// Detects a repeated small discretionary purchase (takeout coffee, eating
// out) and offers one concrete, math-backed alternative — shown once as a
// dismissible tip, never repeated once the user has seen it for that habit.
// This is intentionally simple: real numbers computed from the user's own
// transactions, not a canned "you could save $X" guess.

const SHOWN_KEY = (userId, context, key) => `fintera_habit_tip_shown_${userId}_${context}_${key}`

function buildCoffeeTip(avgAmount, count, windowDays) {
  const monthlyOutSpend = avgAmount * count * (30 / windowDays)
  const annualOutSpend = monthlyOutSpend * 12
  const homeAnnualCost = 100 // ~4 bags/year at ~$25 (2-3kg bag, ~2 cups/day, lasts ~3 months)
  const savings = Math.max(50, Math.round((annualOutSpend - homeAnnualCost) / 10) * 10)
  const amt = avgAmount.toFixed(2)
  return {
    title: { ru: 'Заметили привычку: кофе навынос', en: 'Noticed a habit: takeout coffee' },
    body: {
      ru: `За последний месяц вы купили кофе навынос ${count} раз(а) — в среднем по $${amt}. Пачка молотого кофе (2-3 кг) в Costco стоит около $25 и хватает примерно на 3 месяца при 2 чашках в день дома. По вашим тратам это может сэкономить около $${savings} в год.`,
      en: `In the last month you bought takeout coffee ${count} time(s) — about $${amt} each. A 2-3kg bag of ground coffee at Costco runs about $25 and lasts roughly 3 months at 2 cups a day at home. Based on your spending, that could save around $${savings} a year.`,
    },
  }
}

function buildCafeTip(avgAmount, count, windowDays) {
  const monthlyOutSpend = avgAmount * count * (30 / windowDays)
  const homeMealCost = avgAmount * 0.35 // rough: cooking at home ~35% of eating-out price
  const savings = Math.max(50, Math.round(((avgAmount - homeMealCost) * count * (30 / windowDays) * 12) / 10) * 10)
  const amt = avgAmount.toFixed(2)
  return {
    title: { ru: 'Заметили привычку: обеды/кафе', en: 'Noticed a habit: eating out' },
    body: {
      ru: `За последний месяц вы оплатили кафе/рестораны ${count} раз(а) — в среднем по $${amt}. Готовка того же блюда дома обычно стоит в 2-3 раза дешевле. По вашим тратам это примерно $${savings} в год, если готовить хотя бы часть этих раз самому.`,
      en: `In the last month you paid for cafes/restaurants ${count} time(s) — about $${amt} each. Cooking the same meal at home usually costs 2-3x less. Based on your spending, that's roughly $${savings} a year if you cook at least some of those meals yourself.`,
    },
  }
}

const HABIT_RULES = [
  { key: 'coffee', group: 'wants', category_key: 'coffee', minCount: 5, windowDays: 30, build: buildCoffeeTip },
  { key: 'cafe', group: 'wants', category_key: 'cafe', minCount: 6, windowDays: 30, build: buildCafeTip },
]

// Returns { key, title:{ru,en}, body:{ru,en} } for the first triggered,
// not-yet-shown habit, or null. Call once per relevant screen load.
export function detectHabitTip(userId, context, transactions) {
  if (!userId) return null
  const now = Date.now()
  for (const rule of HABIT_RULES) {
    if (localStorage.getItem(SHOWN_KEY(userId, context, rule.key))) continue
    const cutoff = now - rule.windowDays * 86400000
    const matches = (transactions || []).filter(
      (t) => t.group === rule.group && t.category_key === rule.category_key && new Date(t.date).getTime() >= cutoff,
    )
    if (matches.length >= rule.minCount) {
      const avgAmount = matches.reduce((s, t) => s + Number(t.amount || 0), 0) / matches.length
      return { key: rule.key, ...rule.build(avgAmount, matches.length, rule.windowDays) }
    }
  }
  return null
}

export function dismissHabitTip(userId, context, key) {
  localStorage.setItem(SHOWN_KEY(userId, context, key), '1')
}
