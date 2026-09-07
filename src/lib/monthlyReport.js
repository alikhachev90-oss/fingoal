// Period reports — monthly and yearly recaps of what happened, built purely
// from transactions + settings the app already has (no new backend). Two
// jobs: compute the numbers for a given month/year, and remember which ones
// the user has already seen so a "your <month> report is ready" banner only
// shows once per closed period, the same pattern lib/aiInsights.js uses for
// the subscription radar's 30-day check.
import { findCategory, pickLang } from './categories'

function reportKey(userId, context) {
  return `fintrack_reports_seen_${userId}_${context}`
}

function getSeenState(userId, context) {
  try {
    return JSON.parse(localStorage.getItem(reportKey(userId, context))) || { months: [], years: [] }
  } catch {
    return { months: [], years: [] }
  }
}

function monthId(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

// The most recent fully-closed calendar month (i.e. never the current one).
export function lastClosedMonth(today = new Date()) {
  return new Date(today.getFullYear(), today.getMonth() - 1, 1)
}

export function lastClosedYear(today = new Date()) {
  return today.getFullYear() - 1
}

// Returns the closed month to prompt about, or null if it's already been seen
// (or there's nothing to show yet — no transactions at all).
export function pendingMonthReport(userId, context, transactions, today = new Date()) {
  if (!transactions.length) return null
  const closed = lastClosedMonth(today)
  const id = monthId(closed)
  const seen = getSeenState(userId, context)
  if (seen.months.includes(id)) return null
  const hasData = transactions.some((t) => {
    const d = new Date(t.date)
    return d.getFullYear() === closed.getFullYear() && d.getMonth() === closed.getMonth()
  })
  return hasData ? closed : null
}

// January only — points at last year's just-finished 12 months.
export function pendingYearReport(userId, context, transactions, today = new Date()) {
  if (today.getMonth() !== 0) return null
  if (!transactions.length) return null
  const year = lastClosedYear(today)
  const seen = getSeenState(userId, context)
  if (seen.years.includes(year)) return null
  const hasData = transactions.some((t) => new Date(t.date).getFullYear() === year)
  return hasData ? year : null
}

export function markMonthReportSeen(userId, context, date) {
  const seen = getSeenState(userId, context)
  const id = monthId(date)
  if (!seen.months.includes(id)) seen.months.push(id)
  localStorage.setItem(reportKey(userId, context), JSON.stringify(seen))
}

export function markYearReportSeen(userId, context, year) {
  const seen = getSeenState(userId, context)
  if (!seen.years.includes(year)) seen.years.push(year)
  localStorage.setItem(reportKey(userId, context), JSON.stringify(seen))
}

// -------------------------------------------------------------- computation
function txForMonth(transactions, date) {
  return transactions.filter((t) => {
    const d = new Date(t.date)
    return d.getFullYear() === date.getFullYear() && d.getMonth() === date.getMonth()
  })
}

function summarize(tx, lang) {
  const byGroup = { needs: 0, wants: 0, savings: 0 }
  const byCategory = {}
  for (const t of tx) {
    byGroup[t.group] = (byGroup[t.group] || 0) + t.amount
    if (t.group === 'savings' || t.group === 'income') continue
    const cat = findCategory(t.group, t.category_key)
    const label = pickLang(cat?.label, lang) || t.category_key
    const id = `${t.group}:${t.category_key}`
    byCategory[id] = byCategory[id] || { name: label, value: 0 }
    byCategory[id].value += t.amount
  }
  const spent = byGroup.needs + byGroup.wants
  const topCategories = Object.values(byCategory).sort((a, b) => b.value - a.value).slice(0, 3)
  return { byGroup, spent, saved: byGroup.savings, topCategories }
}

// A single month's recap: income vs. what actually got spent/saved, plus how
// much closer each active goal got during that specific month (the delta,
// not the goal's all-time total — that's what "this month" should mean).
export function computeMonthReport({ transactions, goals, settings, monthDate, lang }) {
  const tx = txForMonth(transactions, monthDate)
  const { byGroup, spent, saved, topCategories } = summarize(tx, lang)
  const income = settings?.monthly_income || 0
  const leftover = income - spent - saved
  const savingsRate = income > 0 ? Math.round((saved / income) * 100) : 0

  // Goal progress made specifically this month: sum of savings tx tagged to
  // goal-relevant keys (matches EntryScreen's own goal-contribution keys).
  const goalKeys = new Set(['emergency', 'investments', 'debt_extra'])
  const goalContribThisMonth = tx
    .filter((t) => t.group === 'savings' && goalKeys.has(t.category_key))
    .reduce((s, t) => s + t.amount, 0)

  return {
    monthDate,
    income,
    spent,
    saved,
    leftover,
    savingsRate,
    byGroup,
    topCategories,
    goalContribThisMonth,
    goals: (goals || []).map((g) => ({
      id: g.id,
      name: g.name,
      pct: g.target_amount > 0 ? Math.min(100, Math.round((g.saved_amount / g.target_amount) * 100)) : 0,
    })),
    hasData: tx.length > 0,
  }
}

// A year's recap: same shape, aggregated across the 12 months of that year.
export function computeYearReport({ transactions, goals, settings, year, lang }) {
  const tx = transactions.filter((t) => new Date(t.date).getFullYear() === year)
  const { byGroup, spent, saved, topCategories } = summarize(tx, lang)
  const monthsWithData = new Set(tx.map((t) => new Date(t.date).getMonth())).size
  const income = (settings?.monthly_income || 0) * 12
  const savingsRate = income > 0 ? Math.round((saved / income) * 100) : 0

  const goalsCompleted = (goals || []).filter((g) => g.target_amount > 0 && g.saved_amount >= g.target_amount)

  // Best/worst month by net (spent vs saved) — a small highlight, not a full
  // month-by-month table.
  const perMonth = Array.from({ length: 12 }, (_, m) => {
    const mtx = tx.filter((t) => new Date(t.date).getMonth() === m)
    return { month: m, saved: mtx.filter((t) => t.group === 'savings').reduce((s, t) => s + t.amount, 0) }
  }).filter((m) => m.saved > 0)
  const bestMonth = perMonth.length ? perMonth.reduce((a, b) => (b.saved > a.saved ? b : a)) : null

  return {
    year,
    income,
    spent,
    saved,
    savingsRate,
    byGroup,
    topCategories,
    monthsWithData,
    goalsCompleted,
    bestMonth,
    hasData: tx.length > 0,
  }
}

// All months that have at least one transaction, newest first — drives the
// "browse past months" list on the report screen.
export function monthsWithActivity(transactions) {
  const set = new Set()
  for (const t of transactions) {
    const d = new Date(t.date)
    set.add(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
  }
  return Array.from(set)
    .sort()
    .reverse()
    .map((id) => {
      const [y, m] = id.split('-').map(Number)
      return new Date(y, m - 1, 1)
    })
}

export function yearsWithActivity(transactions) {
  const set = new Set(transactions.map((t) => new Date(t.date).getFullYear()))
  return Array.from(set).sort((a, b) => b - a)
}
