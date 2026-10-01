// Daily goal check-in reminder at a user-picked time. Fires here while the
// app is open; with it closed the server sends it (lib/serverReminders.js).
// Unlike bill reminders (one-off, a fixed datetime), this repeats every day —
// so state is keyed by goal id and tracks the last date it fired, not a
// single `fired` flag.

import { translate } from '../i18n/strings'
import { tr } from './tr.js'
import { showLocalNotification } from './reminders'
import { todayStr } from './dates'
import { fmtMoney } from './money.js'

function keyFor(userId, context, goalId) {
  return `fintera_goal_reminder_${userId}_${context}_${goalId}`
}

export function getGoalReminder(userId, context, goalId) {
  try {
    return JSON.parse(localStorage.getItem(keyFor(userId, context, goalId))) || null
  } catch {
    return null
  }
}

// `time` is 'HH:MM' (24h, local time).
export function setGoalReminder(userId, context, goalId, { enabled, time, name }) {
  const existing = getGoalReminder(userId, context, goalId) || {}
  const next = { ...existing, enabled, time, name: name || existing.name || null, lastFiredDate: existing.lastFiredDate || null }
  localStorage.setItem(keyFor(userId, context, goalId), JSON.stringify(next))
  return next
}

export function clearGoalReminder(userId, context, goalId) {
  localStorage.removeItem(keyFor(userId, context, goalId))
}

function buildMessage(goal, plan, checkedInToday, lang = 'ru') {
  const remaining = fmtMoney(plan.remaining)
  const perDay = fmtMoney(plan.perDay)
  const perMonth = fmtMoney(plan.perMonth)
  const daysLeft = Math.max(0, Math.round(plan.daysLeft))

  if (checkedInToday) {
    return tr(lang, {
      ru: `«${goal.name}»: сегодня уже отметили взнос. Осталось ${remaining} и ${daysLeft} дн. Так держать.`,
      en: `"${goal.name}": you already logged a contribution today. ${remaining} and ${daysLeft} day(s) left. Keep it up.`,
      es: `«${goal.name}»: hoy ya registraste un aporte. Faltan ${remaining} y ${daysLeft} día(s). Sigue así.`,
      fr: `« ${goal.name} » : versement déjà noté aujourd’hui. Reste ${remaining} et ${daysLeft} jour(s). Continue comme ça.`,
    })
  }

  return tr(lang, {
    ru: `«${goal.name}»: сегодня ещё не откладывали. Осталось ${remaining} (${daysLeft} дн.). Лучше отложить ~${perDay} сегодня, чем искать ${perMonth} в конце месяца.`,
    en: `"${goal.name}": no contribution logged today yet. ${remaining} left (${daysLeft} days). Better to set aside ~${perDay} today than scramble for ${perMonth} at month's end.`,
    es: `«${goal.name}»: hoy aún no apartaste nada. Faltan ${remaining} (${daysLeft} días). Mejor apartar ~${perDay} hoy que buscar ${perMonth} a fin de mes.`,
    fr: `« ${goal.name} » : rien mis de côté aujourd’hui. Reste ${remaining} (${daysLeft} jours). Mieux vaut mettre ~${perDay} de côté aujourd’hui que chercher ${perMonth} en fin de mois.`,
  })
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
      showLocalNotification(translate('goals.reminderTitle', lang), { body, tag: `goal_${goal.id}` })
    } catch {
      // Notification constructor can throw on some mobile browsers — ignore.
    }
  }
  localStorage.setItem(keyFor(userId, context, goal.id), JSON.stringify({ ...state, lastFiredDate: today }))
  return true
}
