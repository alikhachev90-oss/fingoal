// Lightweight bill reminders — client-side only, no backend/push service.
// A reminder fires as a browser Notification while the app/tab is open (checked
// on an interval mounted once at the app root); it can't wake the phone when the
// app is fully closed — that would need a real push backend, which is a bigger
// (later, paid) feature. This is the honest, free version: "remind me while I
// have the app open around that time."

// Through the service worker when there is one: Android Chrome refuses
// `new Notification()` outright, which is why reminders never showed there.
// The tag matches the server push for the same reminder, so if both arrive
// the phone shows one notification, not two.
export function showLocalNotification(title, options) {
  const fallback = () => {
    try {
      new Notification(title, options)
    } catch {
      // Not allowed on this browser — the server push still covers it.
    }
  }
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistration('/sw.js').then((reg) => (reg ? reg.showNotification(title, options) : fallback())).catch(fallback)
  } else {
    fallback()
  }
}

function remindersKey(userId, context) {
  return `fintrack_reminders_${userId}_${context}`
}

export function getReminders(userId, context) {
  try {
    return JSON.parse(localStorage.getItem(remindersKey(userId, context))) || []
  } catch {
    return []
  }
}

function saveReminders(userId, context, list) {
  localStorage.setItem(remindersKey(userId, context), JSON.stringify(list))
  return list
}

export function getReminderFor(userId, context, billId) {
  return getReminders(userId, context).find((r) => r.billId === billId) || null
}

// `when` is an ISO datetime string. Replaces any existing reminder for this billId.
export function setReminder(userId, context, { billId, label, amount, when }) {
  const list = getReminders(userId, context).filter((r) => r.billId !== billId)
  list.push({ id: `${billId}_${Date.now()}`, billId, label, amount, when, fired: false })
  return saveReminders(userId, context, list)
}

export function clearReminder(userId, context, billId) {
  const list = getReminders(userId, context).filter((r) => r.billId !== billId)
  return saveReminders(userId, context, list)
}

export async function requestNotificationPermission() {
  if (typeof Notification === 'undefined') return 'unsupported'
  if (Notification.permission === 'granted' || Notification.permission === 'denied') return Notification.permission
  try {
    return await Notification.requestPermission()
  } catch {
    return 'denied'
  }
}

// Call periodically (e.g. every 30-60s) from a single place mounted at the app
// root. Fires a Notification for any due, not-yet-fired reminder and marks it fired.
export function checkDueReminders(userId, context) {
  const list = getReminders(userId, context)
  const now = Date.now()
  let changed = false
  for (const r of list) {
    if (r.fired) continue
    if (new Date(r.when).getTime() > now) continue
    changed = true
    r.fired = true
    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      try {
        showLocalNotification(r.label, { body: r.amount ? `$${Math.round(r.amount)}` : undefined, tag: r.id })
      } catch {
        // Notification constructor can throw on some mobile browsers — ignore.
      }
    }
  }
  if (changed) saveReminders(userId, context, list)
  return list
}
