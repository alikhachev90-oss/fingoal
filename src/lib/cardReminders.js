import { computeAccountBalance } from './creditCards'

// "Pay the card off" — a daily push for as long as a credit card carries a
// balance. Set when spending on the card (or on the Accounts screen), kept on
// the device like the other reminders and sent by the server
// (serverReminders.js → api/push/tick.js). It switches itself off once the
// card is back to zero.

const key = (userId, accountId) => `fintera_card_reminder_${userId}_${accountId}`
export const CARD_REMINDER_TIME = '19:00'

export function getCardReminder(userId, accountId) {
  try {
    return JSON.parse(localStorage.getItem(key(userId, accountId))) || null
  } catch {
    return null
  }
}

export function setCardReminder(userId, accountId, patch) {
  const value = { time: CARD_REMINDER_TIME, ...(getCardReminder(userId, accountId) || {}), ...patch, enabled: true }
  try {
    localStorage.setItem(key(userId, accountId), JSON.stringify(value))
  } catch {
    // Private mode — nothing to schedule from.
  }
  return value
}

export function clearCardReminder(userId, accountId) {
  try {
    localStorage.removeItem(key(userId, accountId))
  } catch {
    // ignore
  }
}

// Brings every card reminder's "owed" in line with the real balance, and
// turns off the ones whose card is paid off. Returns true if anything changed
// (the caller then re-syncs the server copy).
export function refreshCardReminders(userId, accounts, transactions) {
  let changed = false
  for (const a of accounts || []) {
    if (a.type !== 'credit') continue
    const r = getCardReminder(userId, a.id)
    if (!r?.enabled) continue
    const owed = Math.max(0, computeAccountBalance(a, transactions))
    if (owed <= 0) {
      clearCardReminder(userId, a.id)
      changed = true
    } else if (owed !== r.owed || a.name !== r.name) {
      setCardReminder(userId, a.id, { owed, name: a.name })
      changed = true
    }
  }
  return changed
}
