import webpush from 'web-push'
import { createClient } from '@supabase/supabase-js'
import { buildDigest } from '../../src/lib/digest.js'

// Sends every reminder that has come due, to the person's devices, with the
// app closed. Called every few minutes (see .github/workflows/push-tick.yml).
// Reminders and push addresses live in each account's user_metadata (written
// by src/lib/serverReminders.js); what has been sent is recorded there too,
// so calling this twice never sends anything twice — which is also why it
// needs no secret.

const GOAL_WINDOW_MIN = 120 // a daily reminder still goes out up to 2h late, not later

function localParts(tz, date) {
  try {
    const f = new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false })
    const p = Object.fromEntries(f.formatToParts(date).map((x) => [x.type, x.value]))
    const weekday = new Date(`${p.year}-${p.month}-${p.day}T12:00:00Z`).getUTCDay() || 7 // 1 = Monday … 7 = Sunday
    return { day: `${p.year}-${p.month}-${p.day}`, weekday, minutes: (Number(p.hour) % 24) * 60 + Number(p.minute) }
  } catch {
    return localParts('UTC', date)
  }
}

export default async function handler(req, res) {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return res.status(500).json({ error: 'push_backend_not_configured' })
  }
  webpush.setVapidDetails('mailto:a.likhachev90@gmail.com', process.env.VITE_VAPID_PUBLIC_KEY, process.env.PUSH_VAPID_PRIVATE_KEY)
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })

  // Health: remember when the every-minute Supabase job (supabase/cron.sql,
  // which calls through pg_net) last reached us, and report it on ?status=1.
  const HEALTH = { bucket: 'goal-images', path: '_health/cron.json' }
  if (req.query?.status) {
    const { data } = await supabase.storage.from(HEALTH.bucket).download(HEALTH.path).catch(() => ({ data: null }))
    const last = data ? JSON.parse(await data.text()).at : null
    return res.status(200).json({ ok: true, cron_last_at: last, minutes_ago: last ? Math.round((Date.now() - new Date(last).getTime()) / 60000) : null })
  }
  if (/pg_net/i.test(req.headers['user-agent'] || '')) {
    await supabase.storage.createBucket(HEALTH.bucket, { public: true }).catch(() => {})
    await supabase.storage.from(HEALTH.bucket).upload(HEALTH.path, JSON.stringify({ at: new Date().toISOString() }), { contentType: 'application/json', upsert: true }).catch(() => {})
  }

  const now = new Date()
  let sent = 0
  let checked = 0

  for (let page = 1; page < 50; page++) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 1000 })
    if (error) return res.status(500).json({ error: error.message })
    const users = data?.users || []

    for (const user of users) {
      const meta = user.user_metadata || {}
      const subs = Array.isArray(meta.push_subs) ? meta.push_subs : []
      const reminders = Array.isArray(meta.push_reminders) ? meta.push_reminders : []
      if (!subs.length) continue
      checked += 1

      const fired = new Set(meta.push_fired || [])
      const goalLast = { ...(meta.push_goal_last || {}) }
      const local = localParts(meta.tz || 'UTC', now)
      const due = []

      for (const r of reminders) {
        if (r.kind === 'bill') {
          const at = new Date(r.when).getTime()
          // Anything more than a day overdue was missed for good — don't dig it up.
          if (!fired.has(r.id) && at <= now.getTime() && at > now.getTime() - 86400000) {
            due.push(r)
            fired.add(r.id)
          }
        } else if (r.kind === 'weekly' && r.time) {
          const [h, m] = r.time.split(':').map(Number)
          const late = local.minutes - (h * 60 + m)
          if (local.weekday === Number(r.weekday) && goalLast[r.id] !== local.day && late >= 0 && late <= GOAL_WINDOW_MIN) {
            due.push(r)
            goalLast[r.id] = local.day
          }
        } else if ((r.kind === 'goal' || r.kind === 'daily') && r.time) {
          const [h, m] = r.time.split(':').map(Number)
          const late = local.minutes - (h * 60 + m)
          if (goalLast[r.id] !== local.day && late >= 0 && late <= GOAL_WINDOW_MIN) {
            due.push(r)
            goalLast[r.id] = local.day
          }
        }
      }
      // Evening summary (on unless turned off in Settings), once a day at the
      // person's chosen local time. Their data is read only when it's due.
      const digest = meta.digest || {}
      if (digest.on !== false) {
        const [dh, dm] = String(digest.time || '21:00').split(':').map(Number)
        const late = local.minutes - (dh * 60 + dm)
        if (goalLast.digest !== local.day && late >= 0 && late <= GOAL_WINDOW_MIN) {
          const since = new Date(now.getTime() - 120 * 86400000).toISOString().slice(0, 10)
          const [{ data: tx }, { data: settings }, { data: goals }] = await Promise.all([
            supabase.from('transactions').select('*').eq('user_id', user.id).eq('context', 'personal').gte('date', since),
            supabase.from('context_settings').select('*').eq('user_id', user.id).eq('context', 'personal').maybeSingle(),
            supabase.from('goals').select('*').eq('user_id', user.id).eq('context', 'personal').order('priority'),
          ])
          const { title, body } = buildDigest({ transactions: tx || [], settings, goals: goals || [], day: local.day, lang: meta.lang, saveRate: Number.isFinite(Number(meta.save_rate)) ? Number(meta.save_rate) : 5, currency: meta.currency || 'USD' })
          due.push({ id: 'digest', title, body, url: '/dashboard' })
          goalLast.digest = local.day
        }
      }
      if (!due.length) continue

      const dead = new Set()
      for (const r of due) {
        const payload = JSON.stringify({ title: r.title || 'Finterio', body: r.body || '', tag: r.id, url: r.url || (r.kind === 'goal' ? '/goals' : '/dashboard'), image: r.image })
        await Promise.allSettled(
          subs.map(async (s) => {
            try {
              await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, payload, { TTL: 3600, urgency: 'high' })
              sent += 1
            } catch (err) {
              if (err.statusCode === 404 || err.statusCode === 410) dead.add(s.endpoint)
            }
          }),
        )
      }

      // Re-read right before writing: the phone may have saved something
      // (a category, a photo, new reminders) while pushes were going out,
      // and writing back the copy read at the start would erase it.
      const { data: fresh } = await supabase.auth.admin.getUserById(user.id)
      const latest = fresh?.user?.user_metadata || meta
      await supabase.auth.admin.updateUserById(user.id, {
        user_metadata: {
          ...latest,
          push_fired: [...fired].slice(-100),
          push_goal_last: goalLast,
          push_subs: (Array.isArray(latest.push_subs) ? latest.push_subs : subs).filter((s) => !dead.has(s.endpoint)),
        },
      })
    }
    if (users.length < 1000) break
  }

  return res.status(200).json({ ok: true, checked, sent, at: now.toISOString() })
}
