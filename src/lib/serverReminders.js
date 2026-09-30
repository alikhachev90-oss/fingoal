import * as db from './db'
import { supabase, supabaseEnabled } from './supabaseClient'

// Reminders that arrive with the app closed. The browser can't schedule a
// notification on its own, so the reminders (and this device's push address)
// are copied into the account, and a server tick (api/push/tick.js, run every
// few minutes) sends each one when it comes due.
//
// The client only ever writes `push_reminders`, `push_subs` and `tz`; the
// server alone writes `push_fired` / `push_goal_last`, so a re-sync from the
// phone can never un-send something the server already delivered.

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(base64)
  return Uint8Array.from(raw, (c) => c.charCodeAt(0))
}

// Set when push is turned off in Settings: this device must then neither be
// re-subscribed by a sync nor stay on the account's list.
export const PUSH_OFF_KEY = 'fintera_push_off'
const LAST_ENDPOINT_KEY = 'fintera_push_endpoint'
const pushOff = () => { try { return localStorage.getItem(PUSH_OFF_KEY) === '1' } catch { return false } }

// This device's push subscription, created if permission is already given.
async function deviceSubscription() {
  if (pushOff()) return null
  if (!VAPID_PUBLIC_KEY || !('serviceWorker' in navigator) || !('PushManager' in window)) return null
  if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return null
  const reg = (await navigator.serviceWorker.getRegistration('/sw.js')) || (await navigator.serviceWorker.register('/sw.js'))
  await navigator.serviceWorker.ready
  let sub = await reg.pushManager.getSubscription()
  if (!sub) {
    sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) })
  }
  const json = sub.toJSON()
  try { localStorage.setItem(LAST_ENDPOINT_KEY, json.endpoint) } catch { /* ignore */ }
  return { endpoint: json.endpoint, p256dh: json.keys.p256dh, auth: json.keys.auth }
}

function collectReminders(userId, meta = {}) {
  const en = (localStorage.getItem('fintrack_lang') || 'ru') === 'en'
  const out = []
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (!key) continue
    try {
      if (key.startsWith(`fintrack_reminders_${userId}_`)) {
        for (const r of JSON.parse(localStorage.getItem(key)) || []) {
          if (r.fired || !r.when) continue
          out.push({ id: r.id, kind: 'bill', when: r.when, title: r.label, body: r.amount ? `$${Math.round(r.amount)}` : '' })
        }
      } else if (key.startsWith(`fintera_goal_reminder_${userId}_`)) {
        const r = JSON.parse(localStorage.getItem(key))
        if (!r?.enabled || !r.time) continue
        const goalId = key.split('_').pop()
        out.push({ id: `goal_${goalId}`, kind: 'goal', time: r.time, title: r.name ? `«${r.name}»` : 'Цель', body: 'Пора отложить на цель сегодня.' })
      } else if (key.startsWith(`fintera_card_reminder_${userId}_`)) {
        const r = JSON.parse(localStorage.getItem(key))
        if (!r?.enabled || !r.time || !(r.owed > 0)) continue
        const accountId = key.slice(`fintera_card_reminder_${userId}_`.length)
        const owed = `$${Math.round(r.owed).toLocaleString('en-US')}`
        out.push({
          id: `card_${accountId}`,
          kind: 'daily',
          time: r.time,
          title: en ? `Pay off "${r.name}"` : `Погаси «${r.name}»`,
          body: en ? `${owed} on the card. Pay it in full before the due date — no interest.` : `На карте долг ${owed}. Закрой полностью до даты платежа — и никаких процентов.`,
          url: '/accounts',
        })
      } else if (key.startsWith(`fintera_vision_${userId}_`)) {
        const r = JSON.parse(localStorage.getItem(key))
        if (!r?.enabled || !r.time || !r.snapshot) continue
        const goalId = key.slice(`fintera_vision_${userId}_`.length)
        const { name, target, saved } = r.snapshot
        const left = Math.max(0, Math.round(target - saved))
        const pct = target > 0 ? Math.min(100, Math.round((saved / target) * 100)) : 0
        const image = meta.goal_images?.[goalId]
        out.push({
          id: `vision_${goalId}`,
          kind: 'weekly',
          weekday: r.weekday || 1,
          time: r.time,
          title: `«${name}» · ${pct}%`,
          body: en ? `$${left} to go. One more step this week.` : `Осталось $${left}. Ещё один шаг на этой неделе.`,
          url: '/goals',
          // Only a hosted photo can ride in a push, not an inline one.
          image: image && image.startsWith('https://') ? image : undefined,
        })
      }
    } catch {
      // A broken entry must not stop the rest from syncing.
    }
  }
  return out
}

// Copies every reminder set on this device, plus this device's push address,
// into the account. Safe to call often; failures just leave the old copy.
export async function syncServerReminders(user) {
  if (!supabaseEnabled || !user) return
  try {
    // The freshest copy: the server prunes dead devices, and the cached
    // session user can be hours old.
    const { data } = await supabase.auth.getUser()
    const current = data?.user?.user_metadata || user.user_metadata || {}
    let subs = Array.isArray(current.push_subs) ? current.push_subs : []
    if (pushOff()) {
      let last = null
      try { last = localStorage.getItem(LAST_ENDPOINT_KEY) } catch { /* ignore */ }
      if (last) subs = subs.filter((s) => s.endpoint !== last)
    }
    const device = await deviceSubscription().catch(() => null)
    if (device && !subs.some((s) => s.endpoint === device.endpoint)) subs = [...subs, device].slice(-5)
    await db.saveUserMeta(user.id, {
      push_subs: subs,
      push_reminders: collectReminders(user.id, current),
      tz: Intl.DateTimeFormat().resolvedOptions().timeZone,
    })
  } catch {
    // Offline: the next sync (app start or next reminder change) catches up.
  }
}
