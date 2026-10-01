import { toDate } from './dates'
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
    title: { ru: 'Заметили привычку: кофе навынос', en: 'Noticed a habit: takeout coffee', es: "Hábito detectado: café para llevar", fr: "Habitude repérée : café à emporter" },
    body: {
      ru: `За последний месяц вы купили кофе навынос ${count} раз(а) — в среднем по $${amt}. Пачка молотого кофе (2-3 кг) в Costco стоит около $25 и хватает примерно на 3 месяца при 2 чашках в день дома. По вашим тратам это может сэкономить около $${savings} в год.`,
      en: `In the last month you bought takeout coffee ${count} time(s) — about $${amt} each. A 2-3kg bag of ground coffee at Costco runs about $25 and lasts roughly 3 months at 2 cups a day at home. Based on your spending, that could save around $${savings} a year.`, es: `El último mes compraste café para llevar ${count} vez/veces, unos $${amt} cada uno. Una bolsa de 2–3 kg de café molido en Costco cuesta unos $25 y dura unos 3 meses a 2 tazas al día en casa. Según tus gastos, podrías ahorrar unos $${savings} al año.`, fr: `Le mois dernier, tu as acheté un café à emporter ${count} fois — environ $${amt} chacun. Un sac de 2–3 kg de café moulu chez Costco coûte environ 25 $ et dure à peu près 3 mois à 2 tasses par jour à la maison. D’après tes dépenses, ça pourrait économiser environ $${savings} par an.`,
    },
  }
}

function buildCafeTip(avgAmount, count, windowDays) {
  const homeMealCost = avgAmount * 0.35 // rough: cooking at home ~35% of eating-out price
  const savings = Math.max(50, Math.round(((avgAmount - homeMealCost) * count * (30 / windowDays) * 12) / 10) * 10)
  const amt = avgAmount.toFixed(2)
  return {
    title: { ru: 'Заметили привычку: обеды/кафе', en: 'Noticed a habit: eating out', es: "Hábito detectado: comer fuera", fr: "Habitude repérée : manger dehors" },
    body: {
      ru: `За последний месяц вы оплатили кафе/рестораны ${count} раз(а) — в среднем по $${amt}. Готовка того же блюда дома обычно стоит в 2-3 раза дешевле. По вашим тратам это примерно $${savings} в год, если готовить хотя бы часть этих раз самому.`,
      en: `In the last month you paid for cafes/restaurants ${count} time(s) — about $${amt} each. Cooking the same meal at home usually costs 2-3x less. Based on your spending, that's roughly $${savings} a year if you cook at least some of those meals yourself.`, es: `El último mes pagaste en cafés/restaurantes ${count} vez/veces, unos $${amt} cada vez. Cocinar lo mismo en casa suele costar 2–3 veces menos. Según tus gastos, son unos $${savings} al año si cocinas al menos parte de esas comidas.`, fr: `Le mois dernier, tu as payé au café/restaurant ${count} fois — environ $${amt} à chaque fois. Cuisiner le même plat à la maison coûte souvent 2 à 3 fois moins. D’après tes dépenses, c’est environ $${savings} par an si tu cuisines au moins une partie de ces repas.`,
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
      (t) => t.group === rule.group && t.category_key === rule.category_key && toDate(t.date).getTime() >= cutoff,
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
