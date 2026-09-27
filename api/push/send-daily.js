import webpush from 'web-push'
import { createClient } from '@supabase/supabase-js'

// Fired once a day by Vercel Cron (see vercel.json). Sends the same short
// "did you log today?" nudge to every device that turned push on in Settings.
// Personal reminders (bills, goals) go out separately via api/push/tick.js.
export default async function handler(req, res) {
  // Vercel sets this header on requests it triggers via Cron when a
  // CRON_SECRET env var is configured — reject anything else so this
  // endpoint can't be used by a stranger to spam every subscriber.
  const auth = req.headers.authorization
  if (process.env.CRON_SECRET && auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'unauthorized' })
  }

  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return res.status(500).json({ error: 'push_backend_not_configured' })
  }

  webpush.setVapidDetails(
    'mailto:a.likhachev90@gmail.com',
    process.env.VITE_VAPID_PUBLIC_KEY,
    process.env.PUSH_VAPID_PRIVATE_KEY,
  )

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
  const { data: subs, error } = await supabase.from('push_subscriptions').select('*')
  if (error) return res.status(500).json({ error: error.message })

  const payload = JSON.stringify({
    title: 'Fintera',
    body: 'Записал сегодняшние траты? Пара секунд — и бюджет под контролем.',
  })

  let sent = 0
  const stale = []
  await Promise.allSettled(
    (subs || []).map(async (s) => {
      try {
        await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, payload)
        sent += 1
      } catch (err) {
        // 404/410 means the browser unsubscribed or the subscription expired
        // on its end — clean it up so we stop trying it every day.
        if (err.statusCode === 404 || err.statusCode === 410) stale.push(s.endpoint)
      }
    }),
  )

  if (stale.length) {
    await supabase.from('push_subscriptions').delete().in('endpoint', stale)
  }

  return res.status(200).json({ sent, total: subs?.length || 0, removed: stale.length })
}
