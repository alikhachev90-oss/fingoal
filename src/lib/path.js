// "Путь" — one ladder from zero to financial freedom, so every screen answers
// "what am I working on right now?". The order follows the research-backed
// consensus (r/personalfinance flowchart, Money Guy's order of operations,
// Ramsey's baby steps), trimmed to what the app can measure from real data:
//
//   1. $500 starter cushion     — small liquid savings cut hardship the most
//   2. one month of essentials  — enough to absorb a lost week of work
//   3. expensive debt gone      — smallest balance first (Gal & McShane: small
//                                 wins keep people going to zero)
//   4. three months of essentials
//   5. 15% of income invested
//   6. your own big goals
//
// Nothing here is ticked by hand: the current step is the first one the data
// says isn't done yet.

const HIGH_RATE = 8 // % APR — above this, paying debt beats investing
const STARTER = 500
const INVEST_TARGET = 0.15
const DAY = 86400000

const sum = (list) => list.reduce((s, t) => s + Number(t.amount || 0), 0)

// Money set aside for emergencies: everything filed as savings into the
// cushion (including round-ups), across all time.
export function cushionTotal(transactions) {
  return sum(transactions.filter((t) => t.group === 'savings' && (t.category_key === 'emergency' || t.category_key === 'roundup')))
}

// A month of "can't skip" costs: the needs budget if it's filled in, else the
// real average needs spending of the last 90 days.
export function monthlyEssentials(settings, transactions, today = new Date()) {
  const budget = Object.values(settings?.needs_budget || {}).reduce((s, v) => s + (Number(v) || 0), 0)
  if (budget > 0) return budget
  const since = today.getTime() - 90 * DAY
  const spent = sum(transactions.filter((t) => t.group === 'needs' && !t.is_payment && new Date(t.date).getTime() >= since))
  return spent > 0 ? Math.round(spent / 3) : 1000
}

export function computePath({ transactions = [], settings, debts = [], goals = [] }, today = new Date()) {
  const cushion = cushionTotal(transactions)
  const essentials = monthlyEssentials(settings, transactions, today)
  const expensive = debts
    .filter((d) => Number(d.balance) > 0 && Number(d.rate) >= HIGH_RATE)
    .sort((a, b) => Number(a.balance) - Number(b.balance))
  const debtLeft = expensive.reduce((s, d) => s + Number(d.balance), 0)

  const since = today.getTime() - 30 * DAY
  const recent = transactions.filter((t) => new Date(t.date).getTime() >= since)
  const income30 = sum(recent.filter((t) => t.group === 'income'))
  const invested30 = sum(recent.filter((t) => t.group === 'savings' && t.category_key === 'investments'))
  const investTarget = Math.round(income30 * INVEST_TARGET)

  const goal = goals[0]

  const steps = [
    { key: 'starter', target: STARTER, current: Math.min(cushion, STARTER), saveTo: 'emergency' },
    { key: 'month', target: essentials, current: Math.min(cushion, essentials), saveTo: 'emergency' },
    { key: 'debt', target: debtLeft, current: 0, left: debtLeft, count: expensive.length, next: expensive[0] || null, saveTo: 'debt_extra', done: expensive.length === 0 },
    { key: 'threeMonths', target: essentials * 3, current: Math.min(cushion, essentials * 3), saveTo: 'emergency' },
    { key: 'invest', target: investTarget, current: Math.min(invested30, investTarget), saveTo: 'investments', done: income30 > 0 && invested30 >= investTarget },
    { key: 'goals', target: goal ? Number(goal.target_amount) : 0, current: goal ? Number(goal.saved_amount || 0) : 0, goal, saveTo: 'emergency', done: false },
  ].map((s) => ({ ...s, done: s.done ?? s.current >= s.target, left: s.left ?? Math.max(0, s.target - s.current) }))

  const index = Math.max(0, steps.findIndex((s) => !s.done))
  return { steps, index, current: steps[index], cushion, essentials }
}

// ------------------------------------------------------ pay yourself first
// The share of each income that's set aside the moment it's logged. It
// starts low and climbs 1 point a month up to 15% (Save More Tomorrow:
// 3.5% → 13.6% in 40 months when the raise is agreed to in advance).
export const SAVE_RATE_DEFAULT = 5
export const SAVE_RATE_MAX = 15

export function saveRate(user) {
  const r = Number(user?.user_metadata?.save_rate)
  return Number.isFinite(r) && r >= 0 ? r : SAVE_RATE_DEFAULT
}

// True once a month has passed since the rate last changed and it's still
// below the ceiling — time to offer the next +1%.
export function saveRateStepDue(user, today = new Date()) {
  const rate = saveRate(user)
  if (rate >= SAVE_RATE_MAX) return false
  const at = user?.user_metadata?.save_rate_at
  if (!at) return false
  return today.getTime() - new Date(at).getTime() >= 30 * DAY
}
