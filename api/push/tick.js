import webpush from 'web-push'
import { createClient } from '@supabase/supabase-js'

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
    return { day: `${p.year}-${p.month}-${p.day}`, minutes: (Number(p.hour) % 24) * 60 + Number(p.minute) }
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
      if (!subs.length || !reminders.length) continue
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
        } else if (r.kind === 'goal' && r.time) {
          const [h, m] = r.time.split(':').map(Number)
          const late = local.minutes - (h * 60 + m)
          if (goalLast[r.id] !== local.day && late >= 0 && late <= GOAL_WINDOW_MIN) {
            due.push(r)
            goalLast[r.id] = local.day
          }
        }
      }
      if (!due.length) continue

      const dead = new Set()
      for (const r of due) {
        const payload = JSON.stringify({ title: r.title || 'Finterio', body: r.body || '', tag: r.id, url: r.kind === 'goal' ? '/goals' : '/dashboard' })
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

      await supabase.auth.admin.updateUserById(user.id, {
        user_metadata: {
          ...meta,
          push_fired: [...fired].slice(-100),
          push_goal_last: goalLast,
          push_subs: subs.filter((s) => !dead.has(s.endpoint)),
        },
      })
    }
    if (users.length < 1000) break
  }

  return res.status(200).json({ ok: true, checked, sent, at: now.toISOString() })
}
