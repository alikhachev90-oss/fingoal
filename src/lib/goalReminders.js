// Daily goal check-in reminder — client-side only, same honest limitation as
// lib/reminders.js: fires as a browser Notification once a day at a
// user-picked time, but only while the app/tab is open around that time.
// Unlike bill reminders (one-off, a fixed datetime), this repeats every day —
// so state is keyed by goal id and tracks the last date it fired, not a
// single `fired` flag.

function keyFor(userId, context, goalId) {
  return `fintera_goal_reminder_${userId}_${context}_${goalId}`
}

function todayStr(d = new Date()) {
  return d.toISOString().slice(0, 10)
}

export function getGoalReminder(userId, context, goalId) {
  try {
    return JSON.parse(localStorage.getItem(keyFor(userId, context, goalId))) || null
  } catch {
    return null
  }
}

// `time` is 'HH:MM' (24h, local time).
export function setGoalReminder(userId, context, goalId, { enabled, time }) {
  const existing = getGoalReminder(userId, context, goalId) || {}
  const next = { ...existing, enabled, time, lastFiredDate: existing.lastFiredDate || null }
  localStorage.setItem(keyFor(userId, context, goalId), JSON.stringify(next))
  return next
}

export function clearGoalReminder(userId, context, goalId) {
  localStorage.removeItem(keyFor(userId, context, goalId))
}

function buildMessage(goal, plan, checkedInToday, lang = 'ru') {
  const remaining = Math.round(plan.remaining)
  const perDay = Math.round(plan.perDay)
  const perMonth = Math.round(plan.perMonth)
  const daysLeft = Math.max(0, Math.round(plan.daysLeft))

  if (checkedInToday) {
    return {
      ru: `«${goal.name}»: сегодня уже отметили взнос. Осталось $${remaining} и ${daysLeft} дн. Так держать.`,
      en: `"${goal.name}": you already logged a contribution today. $${remaining} and ${daysLeft} day(s) left. Keep it up.`,
    }[lang] || `«${goal.name}»: сегодня уже отметили взнос. Осталось $${remaining} и ${daysLeft} дн.`
  }

  return {
    ru: `«${goal.name}»: сегодня ещё не откладывали. Осталось $${remaining} (${daysLeft} дн.). Лучше отложить ~$${perDay} сегодня, чем искать $${perMonth} в конце месяца.`,
    en: `"${goal.name}": no contribution logged today yet. $${remaining} left (${daysLeft} days). Better to set aside ~$${perDay} today than scramble for $${perMonth} at month's end.`,
  }[lang] || `«${goal.name}»: сегодня ещё не откладывали. Осталось $${remaining} (${daysLeft} дн.).`
}

// Call periodically (same interval as checkDueReminders) for each goal that
// has a reminder configured. Fires at most once per calendar day, at or
// after the configured time. Returns true if it fired.
export function checkGoalReminderDue(userId, context, goal, plan, checkedInToday, lang = 'ru') {
  const state = getGoalReminder(userId, context, goal.id)
  if (!state || !state.enabled || !state.time) return false

  const now = new Date()
  const today = todayStr(now)
  if (state.lastFiredDate === today) return false

  const [h, m] = state.time.split(':').map(Number)
  const dueTime = new Date(now)
  dueTime.setHours(h, m, 0, 0)
  if (now.getTime() < dueTime.getTime()) return false

  const body = buildMessage(goal, plan, checkedInToday, lang)
  if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
    try {
      new Notification(lang === 'en' ? 'Goal check-in' : 'Напоминание о цели', { body, tag: `goal_${goal.id}_${today}` })
    } catch {
      // Notification constructor can throw on some mobile browsers — ignore.
    }
  }
  localStorage.setItem(keyFor(userId, context, goal.id), JSON.stringify({ ...state, lastFiredDate: today }))
  return true
}
