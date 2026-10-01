import { toDate } from './dates.js'
// Goal / budget math helpers.

// Monthly income is derived from what the person actually logged, never from a
// number typed once at signup — that number went stale immediately and
// contradicted the real figures shown right next to it.
//
// This month's logged income wins as soon as there is any. Before the first
// paycheque of a new month lands, fall back to the average of the last three
// months that had income, so "safe to spend" doesn't collapse to zero every
// 1st of the month. Returns 0 when nothing was ever logged — callers show a
// "log your income first" hint instead of a fake number.
export function deriveMonthlyIncome(transactions, today = new Date()) {
  const byMonth = new Map()
  for (const t of transactions || []) {
    if (t.group !== 'income') continue
    const key = String(t.date).slice(0, 7) // YYYY-MM
    byMonth.set(key, (byMonth.get(key) || 0) + Number(t.amount || 0))
  }
  const monthKey = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
  const thisMonth = byMonth.get(monthKey(today)) || 0
  if (thisMonth > 0) return Math.round(thisMonth * 100) / 100

  const previous = []
  for (let back = 1; back <= 3; back++) {
    const d = new Date(today.getFullYear(), today.getMonth() - back, 1)
    const amount = byMonth.get(monthKey(d)) || 0
    if (amount > 0) previous.push(amount)
  }
  if (!previous.length) return 0
  const avg = previous.reduce((sum, v) => sum + v, 0) / previous.length
  return Math.round(avg * 100) / 100
}

// What was left over from every month before this one: income in, minus
// spending and money set aside. Spending starts from zero each month, but
// the money that wasn't spent rolls into the next one. Transfers between
// own accounts and card payments (spending already counted) are skipped.
export function carryoverFromPreviousMonths(transactions, today = new Date()) {
  const monthStart = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-01`
  let total = 0
  for (const t of transactions || []) {
    if (String(t.date) >= monthStart || t.group === 'transfer' || t.is_payment) continue
    const amount = Number(t.amount || 0)
    if (t.group === 'income') total += amount
    else if (t.group === 'needs' || t.group === 'wants' || t.group === 'savings') total -= amount
  }
  return Math.round(total * 100) / 100
}

export function daysBetween(from, to) {
  const ms = toDate(to).setHours(0, 0, 0, 0) - toDate(from).setHours(0, 0, 0, 0)
  return Math.max(1, Math.round(ms / 86400000))
}

// goal: { targetAmount, savedAmount, deadline }
// profile: { monthlyIncome, monthlyNeeds }
export function computeGoalPlan(goal, profile, today = new Date()) {
  const remaining = Math.max(0, goal.targetAmount - (goal.savedAmount || 0))
  const daysLeft = daysBetween(today, goal.deadline)
  const monthsLeft = daysLeft / 30

  const perDay = remaining / daysLeft
  const perMonth = remaining / monthsLeft

  const monthlyNeeds = profile.monthlyNeeds || 0
  const monthlyIncome = profile.monthlyIncome || 0

  const requiredDailyIncome = monthlyNeeds / 30 + perDay
  const currentDailyIncome = monthlyIncome / 30
  const dailyGap = requiredDailyIncome - currentDailyIncome
  const hasGap = dailyGap > 0.01

  // If there's a gap, suggest how many extra days are needed to close it
  // by extending the deadline, holding monthly income fixed.
  let suggestedExtraDays = null
  if (hasGap && monthlyIncome > 0) {
    const affordablePerDay = Math.max(0, currentDailyIncome - monthlyNeeds / 30)
    if (affordablePerDay > 0) {
      const neededDays = Math.ceil(remaining / affordablePerDay)
      suggestedExtraDays = Math.max(0, neededDays - daysLeft)
    }
  }

  const progressPct = goal.targetAmount > 0 ? Math.min(100, Math.round(((goal.savedAmount || 0) / goal.targetAmount) * 100)) : 0

  return {
    remaining,
    daysLeft,
    monthsLeft,
    perDay,
    perMonth,
    requiredDailyIncome,
    currentDailyIncome,
    dailyGap,
    hasGap,
    suggestedExtraDays,
    progressPct,
  }
}

// How many days closer to the goal a "skipped" want-expense of `amount` buys,
// given the goal still needs `remaining` at `perDay` pace.
export function daysSavedByAmount(amount, perDay) {
  if (!perDay || perDay <= 0) return 0
  return Math.round((amount / perDay) * 10) / 10
}

export const MILESTONES = [25, 50, 75, 100]

export function crossedMilestone(prevPct, newPct) {
  return MILESTONES.find((m) => prevPct < m && newPct >= m) || null
}

// "Сколько можно потратить сегодня, чтобы дожить до зарплаты" — spreads what's
// left of this month's discretionary money evenly across the days remaining.
// How much is safe to spend on wants today.
// - Essentials count at whichever is larger: the budget set for them, or what
//   was actually spent on them this month (no budget set used to mean $0).
// - The pay-yourself-first share of income is set aside first.
// - The day's limit never grows past an even share of the month: money not
//   spent earlier rolls into what's left over (and savings), not into one big
//   "spend it all" day at the end of the month. Overspending still lowers the
//   limit for the days that remain.
// `wantsSpentThisMonth` is wants logged before today.
export function computeSafeToSpendToday(monthlyIncome, monthlyNeedsBudget, wantsSpentThisMonth, today = new Date(), { needsSpent = 0, savingsReserve = 0 } = {}) {
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate()
  const daysRemaining = daysInMonth - today.getDate() + 1
  const needs = Math.max(monthlyNeedsBudget || 0, needsSpent || 0)
  const monthlyFree = (monthlyIncome || 0) - needs - Math.max(0, savingsReserve || 0)
  const freeMoney = monthlyFree - (wantsSpentThisMonth || 0)
  const evenShare = monthlyFree / daysInMonth
  const safePerDay = Math.min(evenShare, freeMoney / daysRemaining)
  return { safePerDay, freeMoney, daysRemaining, evenShare }
}

// Compound growth simulator: monthly contributions at an annual rate, compounded monthly.
export function projectSavingsGrowth(monthlyAmount, annualRatePct, years, startingAmount = 0) {
  const r = (annualRatePct || 0) / 100 / 12
  const n = Math.round((years || 0) * 12)
  let fv = startingAmount || 0
  if (r === 0) {
    fv += (monthlyAmount || 0) * n
  } else {
    fv = fv * Math.pow(1 + r, n) + (monthlyAmount || 0) * ((Math.pow(1 + r, n) - 1) / r)
  }
  const contributed = (startingAmount || 0) + (monthlyAmount || 0) * n
  return { futureValue: fv, contributed, growth: fv - contributed }
}
