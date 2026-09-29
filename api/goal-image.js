import { createClient } from '@supabase/supabase-js'

// Stores a goal's photo in Supabase Storage and returns its public URL.
// The browser sends an already-shrunk JPEG as a data URL plus the person's
// access token; the token is checked, so only a signed-in user can upload,
// and only into their own folder.
const BUCKET = 'goal-images'
const MAX_BYTES = 1.5 * 1024 * 1024

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'method_not_allowed' })
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return res.status(500).json({ error: 'storage_not_configured' })
  }
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })

  const token = (req.headers.authorization || '').replace(/^Bearer /, '')
  const { data: auth } = await supabase.auth.getUser(token)
  const user = auth?.user
  if (!user) return res.status(401).json({ error: 'unauthorized' })

  const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {}
  const match = /^data:image\/(jpeg|png|webp);base64,(.+)$/.exec(body.dataUrl || '')
  const goalId = String(body.goalId || '').replace(/[^a-zA-Z0-9-]/g, '')
  if (!match || !goalId) return res.status(400).json({ error: 'bad_request' })
  const bytes = Buffer.from(match[2], 'base64')
  if (bytes.length > MAX_BYTES) return res.status(413).json({ error: 'too_large' })

  // First upload ever creates the bucket; later ones find it already there.
  await supabase.storage.createBucket(BUCKET, { public: true }).catch(() => {})

  const path = `${user.id}/${goalId}-${Date.now()}.${match[1] === 'jpeg' ? 'jpg' : match[1]}`
  const { error } = await supabase.storage.from(BUCKET).upload(path, bytes, { contentType: `image/${match[1]}`, upsert: true })
  if (error) return res.status(500).json({ error: error.message })

  // The goal's previous photo is no longer shown anywhere — don't keep it.
  const { data: files } = await supabase.storage.from(BUCKET).list(user.id)
  const stale = (files || []).map((f) => `${user.id}/${f.name}`).filter((p) => p !== path && p.startsWith(`${user.id}/${goalId}-`))
  if (stale.length) await supabase.storage.from(BUCKET).remove(stale)

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
  return res.status(200).json({ url: data.publicUrl })
}
