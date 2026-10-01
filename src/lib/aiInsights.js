// "AI" layer — fully client-side, no external key required, so the app keeps
// working out of the box in demo mode. Everything here is deterministic
// (parsing + rules over the user's own data), presented with the same
// "🤖 explanation" voice as the keyword categorizer in categories.js.
// If a real LLM key is added later (Supabase Edge Function), these functions
// are the natural place to swap a rule-based result for a model call — the
// call sites (EntryScreen, InsightsScreen) don't need to change.

import { tr } from './tr.js'
import { suggestCategories, findCategory, pickLang } from './categories'
import { deriveMonthlyIncome } from './finance'
import { toDate } from './dates'
import { fmtMoney } from './money.js'

export function categoryLabel(group, key, lang = 'ru') {
  return pickLang(findCategory(group, key)?.label, lang) || key
}

// ---------------------------------------------------------------- quick entry
// "потратил 15 баксов на кофе" -> { amount, suggestion, restText }
const CURRENCY_WORDS = /\b(баксов|баксы|бакс|доллар(?:ов|а)?|usd|дол\.?|у\.е\.?|dollars?|bucks?|dólares|dolares|dollars)\b/gi
const FILLER_WORDS = /\b(потратил[а]?|заплатил[а]?|купил[а]?|взял[а]?|отдал[а]?|на|за|потратила|потратили|spent|paid|bought|got|for|on|gasté|pagué|compré|en|para|dépensé|payé|acheté|pour)\b/gi

export function parseQuickEntry(text, lang = 'ru') {
  const raw = text.trim()
  if (!raw) return null

  const amountMatch = raw.match(/\$?\s*(\d+(?:[.,]\d{1,2})?)/)
  const amount = amountMatch ? parseFloat(amountMatch[1].replace(',', '.')) : null

  let restText = raw
    .replace(amountMatch ? amountMatch[0] : '', ' ')
    .replace(CURRENCY_WORDS, ' ')
    .replace(FILLER_WORDS, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  const suggestions = suggestCategories(restText || raw, lang)
  const best = suggestions[0] || null

  return {
    amount,
    restText,
    suggestion: best,
    confident: Boolean(amount && best),
  }
}

// -------------------------------------------------------------------- format
function fmt(n) {
  return fmtMoney(n)
}

function monthKey(d) {
  const dt = toDate(d)
  return `${dt.getFullYear()}-${dt.getMonth()}`
}

function isSameMonth(d, ref) {
  const a = toDate(d)
  return a.getMonth() === ref.getMonth() && a.getFullYear() === ref.getFullYear()
}

// --------------------------------------------------------------- goal forecast
// Looks at actual `savings`-group transactions over the trailing window to
// derive a real daily pace, then compares it to the pace the goal's deadline
// requires (goalPlan.perDay from finance.js) to project a realistic finish date.
export function forecastGoal(goal, goalPlan, transactions, windowDays = 30, lang = 'ru') {
  if (!goal || !goalPlan) return null
  const now = new Date()
  const since = new Date(now.getTime() - windowDays * 86400000)
  const contributions = transactions.filter((t) => t.group === 'savings' && toDate(t.date) >= since)
  const total = contributions.reduce((s, t) => s + t.amount, 0)
  const actualPerDay = total / windowDays

  if (actualPerDay <= 0) {
    return {
      actualPerDay: 0,
      onTrack: false,
      message: tr(lang, {
        ru: `За последние ${windowDays} дней пополнений цели не было — при таком темпе дедлайн не будет достигнут вообще.`,
        en: `No contributions to this goal in the last ${windowDays} days — at this pace the deadline won't be reached at all.`,
        es: `No hubo aportes a esta meta en los últimos ${windowDays} días — a este ritmo no se llegará a la fecha.`,
        fr: `Aucun versement sur cet objectif ces ${windowDays} derniers jours — à ce rythme, l’échéance ne sera jamais atteinte.`,
      }),
    }
  }

  const remaining = Math.max(0, goal.target_amount - (goal.saved_amount || 0))
  const projectedDays = Math.ceil(remaining / actualPerDay)
  const projectedDate = new Date(now.getTime() + projectedDays * 86400000)
  const deadline = toDate(goal.deadline)
  const diffDays = Math.round((projectedDate - deadline) / 86400000)
  const onTrack = diffDays <= 0

  return {
    actualPerDay,
    projectedDate,
    onTrack,
    diffDays: Math.abs(diffDays),
    message: onTrack
      ? tr(lang, {
        ru: `При фактическом темпе последних ${windowDays} дней (${fmt(actualPerDay)}/день) цель будет закрыта примерно на ${Math.abs(diffDays)} дн. раньше дедлайна.`,
        en: `At your actual pace over the last ${windowDays} days (${fmt(actualPerDay)}/day), the goal will be reached about ${Math.abs(diffDays)} day(s) before the deadline.`,
        es: `Con tu ritmo real de los últimos ${windowDays} días (${fmt(actualPerDay)}/día), llegarás a la meta unos ${Math.abs(diffDays)} día(s) antes de la fecha.`,
        fr: `À ton rythme réel des ${windowDays} derniers jours (${fmt(actualPerDay)}/jour), l’objectif sera atteint environ ${Math.abs(diffDays)} jour(s) avant l’échéance.`,
      })
      : tr(lang, {
        ru: `При фактическом темпе последних ${windowDays} дней (${fmt(actualPerDay)}/день) цель придёт к дедлайну с опозданием примерно на ${diffDays} дн. — план требует ${fmt(goalPlan.perDay)}/день.`,
        en: `At your actual pace over the last ${windowDays} days (${fmt(actualPerDay)}/day), the goal will miss the deadline by about ${diffDays} day(s) — the plan needs ${fmt(goalPlan.perDay)}/day.`,
        es: `Con tu ritmo real de los últimos ${windowDays} días (${fmt(actualPerDay)}/día), llegarás a la meta unos ${diffDays} día(s) tarde — el plan pide ${fmt(goalPlan.perDay)}/día.`,
        fr: `À ton rythme réel des ${windowDays} derniers jours (${fmt(actualPerDay)}/jour), l’objectif sera atteint avec environ ${diffDays} jour(s) de retard — le plan demande ${fmt(goalPlan.perDay)}/jour.`,
      }),
  }
}

// ----------------------------------------------------------- subscription/anomaly
// Flags recurring charges of near-identical amount seen in >=2 distinct months —
// the classic "forgotten subscription" signature.
//
// Every kind of spending counts, not just Wants: phone, internet and insurance
// are the most-forgotten subscriptions of all and people file those under
// essentials. Income, transfers, savings and card payments are not spending, so
// they stay out.
//
// Amounts are clustered with a tolerance rather than bucketed by whole dollars,
// because subscriptions creep up ($9.99 → $10.99) and an exact-match bucket
// would read one subscription as two unrelated charges and find neither.
const RECURRING_TOLERANCE = 0.12 // 12% around the cluster's typical amount

export function detectRecurring(transactions) {
  const spending = (transactions || []).filter(
    (t) => t.group !== 'income' && t.group !== 'transfer' && t.group !== 'savings' && !t.is_payment,
  )

  // category -> list of clusters { amounts[], months:Set, group, category_key }
  const byCategory = new Map()
  for (const t of spending) {
    const amount = Number(t.amount || 0)
    if (!(amount > 0)) continue
    const catKey = `${t.group}:${t.category_key}`
    if (!byCategory.has(catKey)) byCategory.set(catKey, [])
    const clusters = byCategory.get(catKey)
    const typical = (c) => c.amounts.reduce((s, v) => s + v, 0) / c.amounts.length
    const hit = clusters.find((c) => Math.abs(amount - typical(c)) <= typical(c) * RECURRING_TOLERANCE)
    if (hit) {
      hit.amounts.push(amount)
      hit.months.add(monthKey(t.date))
      hit.lastDate = hit.lastDate && hit.lastDate > t.date ? hit.lastDate : t.date
      hit.lastAmount = hit.lastDate === t.date ? amount : hit.lastAmount
    } else {
      clusters.push({
        amounts: [amount],
        months: new Set([monthKey(t.date)]),
        group: t.group,
        category_key: t.category_key,
        lastDate: t.date,
        lastAmount: amount,
      })
    }
  }

  const found = []
  for (const [catKey, clusters] of byCategory) {
    for (const c of clusters) {
      if (c.months.size < 2) continue
      const typical = c.amounts.reduce((s, v) => s + v, 0) / c.amounts.length
      found.push({
        // Stable id so "already cancelled" marks survive new transactions.
        id: `${catKey}|${Math.round(typical)}`,
        months: c.months,
        monthsCount: c.months.size,
        // Show the most recent charge — that is what they pay today.
        amount: Math.round((c.lastAmount ?? typical) * 100) / 100,
        group: c.group,
        category_key: c.category_key,
        count: c.amounts.length,
      })
    }
  }

  return found.sort((a, b) => b.monthsCount - a.monthsCount || b.amount - a.amount).slice(0, 6)
}

// --------------------------------------------------------- subscription radar
// A lightweight "does this look like a forgotten subscription?" scanner, built
// entirely on `detectRecurring` above — i.e. on the user's own manually-entered
// transactions. No bank/card connection here: real automatic detection from a
// linked account is a bigger (paid, later) feature — this is the free version
// that works with what the app already has.
function radarKey(userId, context) {
  return `fintrack_radar_${userId}_${context}`
}

export function getRadarState(userId, context) {
  try {
    return JSON.parse(localStorage.getItem(radarKey(userId, context))) || { cancelled: [], lastCheckedAt: null }
  } catch {
    return { cancelled: [], lastCheckedAt: null }
  }
}

function saveRadarState(userId, context, state) {
  localStorage.setItem(radarKey(userId, context), JSON.stringify(state))
  return state
}

// Recurring charges the user hasn't already marked as cancelled.
export function getSubscriptionRadar(userId, context, transactions) {
  const state = getRadarState(userId, context)
  const cancelled = new Set(state.cancelled || [])
  return detectRecurring(transactions).filter((b) => !cancelled.has(b.id))
}

export function markSubscriptionCancelled(userId, context, bucketId) {
  const state = getRadarState(userId, context)
  const cancelled = Array.from(new Set([...(state.cancelled || []), bucketId]))
  return saveRadarState(userId, context, { ...state, cancelled })
}

// True once 30+ days have passed since the last "reviewed" mark (or it was never checked).
export function shouldPromptMonthlyCheck(userId, context) {
  const state = getRadarState(userId, context)
  if (!state.lastCheckedAt) return true
  const days = (Date.now() - new Date(state.lastCheckedAt).getTime()) / 86400000
  return days >= 30
}

export function daysSinceRadarCheck(userId, context) {
  const state = getRadarState(userId, context)
  if (!state.lastCheckedAt) return null
  return Math.floor((Date.now() - new Date(state.lastCheckedAt).getTime()) / 86400000)
}

export function recordRadarChecked(userId, context) {
  const state = getRadarState(userId, context)
  return saveRadarState(userId, context, { ...state, lastCheckedAt: new Date().toISOString() })
}

// -------------------------------------------------------- month-over-month diff
export function categoryMonthOverMonth(transactions) {
  const now = new Date()
  const prevRef = new Date(now.getFullYear(), now.getMonth() - 1, 1)

  // Spending only, and the same stretch of days in both months — comparing
  // 1 Oct against all of September read as "salary dropped 100%".
  const upToDay = now.getDate()
  const sums = (ref) => {
    const map = {}
    for (const t of transactions) {
      if (!isSameMonth(t.date, ref) || t.group === 'transfer' || t.group === 'income' || t.group === 'savings') continue
      if (toDate(t.date).getDate() > upToDay) continue
      const k = `${t.group}:${t.category_key}`
      map[k] = (map[k] || 0) + t.amount
    }
    return map
  }

  const cur = sums(now)
  const prev = sums(prevRef)
  const keys = new Set([...Object.keys(cur), ...Object.keys(prev)])
  const rows = []
  for (const k of keys) {
    const curV = cur[k] || 0
    const prevV = prev[k] || 0
    if (prevV === 0 && curV === 0) continue
    const delta = curV - prevV
    const pct = prevV > 0 ? Math.round((delta / prevV) * 100) : null
    rows.push({ key: k, curV, prevV, delta, pct })
  }
  return rows.sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
}

// --------------------------------------------------------------- insight cards
// Returns an ordered list of { id, tone: 'good'|'warn'|'neutral', text }.
export function computeInsights({ settings, transactions, goals, debts, lang = 'ru' }) {
  const cards = []
  const now = new Date()
  const monthTx = transactions.filter((t) => isSameMonth(t.date, now))
  const monthWants = monthTx.filter((t) => t.group === 'wants')
  const monthWantsTotal = monthWants.reduce((s, t) => s + t.amount, 0)
  // Income comes from logged transactions now, not from a signup figure.
  const income = deriveMonthlyIncome(transactions, now)
  const L = (texts) => tr(lang, texts)

  // 1. Wants vs income this month
  if (income > 0) {
    const pct = Math.round((monthWantsTotal / income) * 100)
    cards.push({
      id: 'wants-pct',
      tone: pct > 35 ? 'warn' : 'good',
      text: pct > 35
        ? L({
          ru: `В этом месяце Wants — ${fmt(monthWantsTotal)}, это ${pct}% от дохода. Выше стандартных 30% — стоит посмотреть, что растёт.`,
          en: `Wants this month — ${fmt(monthWantsTotal)}, that's ${pct}% of income. Above the usual 30% — worth checking what's growing.`,
          es: `Deseos este mes: ${fmt(monthWantsTotal)}, el ${pct}% del ingreso. Más del 30% habitual — conviene ver qué está creciendo.`,
          fr: `Envies ce mois-ci : ${fmt(monthWantsTotal)}, soit ${pct} % du revenu. Au-dessus des 30 % habituels — à surveiller.`,
        })
        : monthWantsTotal > 0
          ? L({
            ru: `Wants в этом месяце — ${fmt(monthWantsTotal)}, это ${pct}% от дохода — в пределах нормы.`,
            en: `Wants this month — ${fmt(monthWantsTotal)}, that's ${pct}% of income — within the normal range.`,
            es: `Deseos este mes: ${fmt(monthWantsTotal)}, el ${pct}% del ingreso — dentro de lo normal.`,
            fr: `Envies ce mois-ci : ${fmt(monthWantsTotal)}, soit ${pct} % du revenu — dans la norme.`,
          })
          : L({
            ru: 'В этом месяце пока нет трат по Wants — самое время внести первую и посмотреть на разбивку.',
            en: 'No Wants spending yet this month — a good time to log the first one and see the breakdown.',
            es: 'Aún no hay gastos en Deseos este mes — buen momento para registrar el primero y ver el desglose.',
            fr: 'Pas encore de dépenses Envies ce mois-ci — le bon moment pour noter la première et voir la répartition.',
          }),
    })
  }

  // 2. Month-over-month movers
  // Not in the first days of a month (too little to compare), and not over
  // a few dollars' noise.
  const mom = now.getDate() < 7 ? [] : categoryMonthOverMonth(transactions).filter((r) => r.pct !== null && Math.abs(r.pct) >= 20 && Math.abs(r.delta) >= 20)
  if (mom.length > 0) {
    const top = mom[0]
    const [group, key] = top.key.split(':')
    cards.push({
      id: 'mom-' + top.key,
      tone: top.delta > 0 ? 'warn' : 'good',
      text: (() => {
        const name = categoryLabel(group, key, lang)
        const pctAbs = Math.abs(top.pct)
        const span = `${fmt(top.prevV)} → ${fmt(top.curV)}`
        return top.delta > 0
          ? L({ ru: `Категория «${name}» выросла на ${pctAbs}% по сравнению с прошлым месяцем (${span}).`, en: `Category "${name}" grew by ${pctAbs}% vs last month (${span}).`, es: `La categoría «${name}» subió un ${pctAbs}% frente al mes pasado (${span}).`, fr: `La catégorie « ${name} » a augmenté de ${pctAbs} % par rapport au mois dernier (${span}).` })
          : L({ ru: `Категория «${name}» снизилась на ${pctAbs}% по сравнению с прошлым месяцем (${span}).`, en: `Category "${name}" dropped by ${pctAbs}% vs last month (${span}).`, es: `La categoría «${name}» bajó un ${pctAbs}% frente al mes pasado (${span}).`, fr: `La catégorie « ${name} » a baissé de ${pctAbs} % par rapport au mois dernier (${span}).` })
      })(),
    })
  }

  // 3. Recurring / subscriptions
  const recurring = detectRecurring(transactions)
  if (recurring.length > 0) {
    const r = recurring[0]
    cards.push({
      id: 'recurring',
      tone: 'neutral',
      text: (() => {
        const name = categoryLabel(r.group || 'wants', r.category_key, lang)
        return L({
          ru: `Похоже на регулярный платёж: «${name}» на ~${fmt(r.amount)} встречается ${r.monthsCount} мес. подряд. Если это забытая подписка — самое время её отменить.`,
          en: `Looks like a recurring charge: "${name}" for ~${fmt(r.amount)} shows up ${r.monthsCount} months in a row. If it's a forgotten subscription, now's a good time to cancel it.`,
          es: `Parece un cargo recurrente: «${name}» por ~${fmt(r.amount)} aparece ${r.monthsCount} meses seguidos. Si es una suscripción olvidada, es buen momento para cancelarla.`,
          fr: `Ça ressemble à un prélèvement récurrent : « ${name} » d’environ ${fmt(r.amount)} revient ${r.monthsCount} mois de suite. Si c’est un abonnement oublié, c’est le moment de l’annuler.`,
        })
      })(),
    })
  }

  // 4. Goal forecast (top goal)
  if (goals && goals.length > 0) {
    const goal = goals[0]
    const monthlyNeeds = Object.values(settings?.needs_budget || {}).reduce((s, v) => s + (v || 0), 0)
    // Local import avoided to keep this module dependency-light; recompute plan inline via ratio.
    const remaining = Math.max(0, goal.target_amount - (goal.saved_amount || 0))
    const daysLeft = Math.max(1, Math.round((toDate(goal.deadline) - now) / 86400000))
    const perDay = remaining / daysLeft
    const forecast = forecastGoal(goal, { perDay }, transactions, 30, lang)
    if (forecast) {
      cards.push({ id: 'forecast', tone: forecast.onTrack ? 'good' : 'warn', text: forecast.message })
    }
    void monthlyNeeds
  }

  // 5. Debt highest rate reminder
  if (debts && debts.length > 0) {
    const worst = [...debts].sort((a, b) => (b.rate || 0) - (a.rate || 0))[0]
    if (worst?.rate) {
      cards.push({
        id: 'debt',
        tone: 'neutral',
        text: L({
          ru: `Самая дорогая ставка среди твоих долгов — «${worst.name}» под ${worst.rate}%. Любой доллар сверх минимальных платежей логичнее всего направить туда.`,
          en: `Your priciest rate among current debts is "${worst.name}" at ${worst.rate}%. Any dollar above minimum payments makes the most sense going there.`,
          es: `La tasa más cara de tus deudas es «${worst.name}» al ${worst.rate}%. Cualquier dólar por encima de los mínimos conviene mandarlo ahí.`,
          fr: `Le taux le plus cher de tes dettes est « ${worst.name} » à ${worst.rate} %. Chaque dollar au-delà des minimums est le plus utile là.`,
        }),
      })
    }
  }

  return cards
}

// ---------------------------------------------------------- simple Q&A "coach"
// Rule-based intent matching over the user's own data — not a real LLM chat,
// but answers a handful of common questions grounded in real numbers.
export function answerQuestion(question, ctx) {
  const q = question.toLowerCase()
  const { transactions, goals, lang = 'ru' } = ctx
  const L = (texts) => tr(lang, texts)
  const now = new Date()
  const monthTx = transactions.filter((t) => isSameMonth(t.date, now))

  const goal = goals?.[0]

  if (/цел[ьи]|успею|хватит|дедлайн|goal|deadline|make it|enough|meta|llegar|alcanz|objectif|échéance|atteindr/.test(q) && goal) {
    const remaining = Math.max(0, goal.target_amount - (goal.saved_amount || 0))
    const daysLeft = Math.max(1, Math.round((toDate(goal.deadline) - now) / 86400000))
    const perDay = remaining / daysLeft
    const forecast = forecastGoal(goal, { perDay }, transactions, 30, lang)
    return (
      forecast?.message ||
      L({
        ru: `Остаток до цели «${goal.name}» — ${fmt(remaining)}, нужно откладывать ${fmt(perDay)}/день до дедлайна.`,
        en: `Remaining until goal "${goal.name}" — ${fmt(remaining)}, needs ${fmt(perDay)}/day saved until the deadline.`,
        es: `Faltan ${fmt(remaining)} para la meta «${goal.name}»: hay que apartar ${fmt(perDay)}/día hasta la fecha.`,
        fr: `Il reste ${fmt(remaining)} pour l’objectif « ${goal.name} » : il faut mettre ${fmt(perDay)}/jour de côté jusqu’à l’échéance.`,
      })
    )
  }

  if (/самая большая категория|на что трачу|больше всего|biggest category|spend the most|what am i spending|en qué gasto|gasto más|más gasto|je dépense le plus|où va mon argent|plus grosse/.test(q)) {
    const byCat = {}
    for (const t of monthTx) {
      if (t.group === 'transfer' || t.group === 'income' || t.is_payment) continue
      const k = `${t.group}:${t.category_key}`
      byCat[k] = (byCat[k] || 0) + t.amount
    }
    const entries = Object.entries(byCat).sort((a, b) => b[1] - a[1])
    if (entries.length === 0) {
      return L({
        ru: 'В этом месяце пока нет трат — добавь первую на вкладке «Запись».',
        en: 'No spending logged this month yet — add the first one on the "Entry" tab.',
        es: 'Aún no hay gastos este mes — agrega el primero en la pestaña «Registro».',
        fr: 'Aucune dépense ce mois-ci — ajoute la première dans l’onglet « Saisie ».',
      })
    }
    const [group, key] = entries[0][0].split(':')
    const name = categoryLabel(group, key, lang)
    const amt = fmt(entries[0][1])
    return L({
      ru: `Больше всего в этом месяце ушло на «${name}» — ${amt}.`,
      en: `The biggest spend this month is "${name}" — ${amt}.`,
      es: `Lo que más gastaste este mes: «${name}» — ${amt}.`,
      fr: `Ta plus grosse dépense ce mois-ci : « ${name} » — ${amt}.`,
    })
  }

  if (/wants|дискреционн|развлечен|gustos|deseos|envies|loisirs/.test(q)) {
    const total = fmt(monthTx.filter((t) => t.group === 'wants').reduce((s, t) => s + t.amount, 0))
    const derivedIncome = deriveMonthlyIncome(transactions)
    const pct = derivedIncome > 0 ? Math.round((monthTx.filter((t) => t.group === 'wants').reduce((s, t) => s + t.amount, 0) / derivedIncome) * 100) : null
    return pct !== null
      ? L({ ru: `Wants в этом месяце — ${total} (${pct}% от дохода).`, en: `Wants this month — ${total} (${pct}% of income).`, es: `Deseos este mes: ${total} (${pct}% del ingreso).`, fr: `Envies ce mois-ci : ${total} (${pct} % du revenu).` })
      : L({ ru: `Wants в этом месяце — ${total}.`, en: `Wants this month — ${total}.`, es: `Deseos este mes: ${total}.`, fr: `Envies ce mois-ci : ${total}.` })
  }

  if (/доход|зарплат|income|salary|ingreso|sueldo|salario|revenu|salaire/.test(q)) {
    const loggedIncome = deriveMonthlyIncome(transactions)
    return loggedIncome > 0
      ? L({ ru: `Записанный доход за месяц — ${fmt(loggedIncome)}.`, en: `Your logged monthly income is ${fmt(loggedIncome)}.`, es: `Tu ingreso mensual registrado es ${fmt(loggedIncome)}.`, fr: `Ton revenu mensuel enregistré est de ${fmt(loggedIncome)}.` })
      : L({ ru: 'Доход ещё не записан — добавьте его на экране «Запись».', en: 'No income logged yet — add one on the Entry screen.', es: 'Aún no hay ingresos registrados — agrégalos en la pantalla «Registro».', fr: 'Aucun revenu enregistré — ajoute-le dans l’écran « Saisie ».' })
  }

  return L({
    ru: 'Могу ответить на вопросы про цель ("успею ли к дедлайну"), про то, на что уходит больше всего денег, и про Wants/доход. Попробуй переформулировать.',
    en: 'I can answer questions about your goal ("will I make the deadline"), what you’re spending the most on, and Wants/income. Try rephrasing.',
    es: 'Puedo responder sobre tu meta («¿llegaré a la fecha?»), en qué gastas más, y sobre Deseos/ingresos. Intenta reformular.',
    fr: 'Je peux répondre sur ton objectif (« vais-je tenir l’échéance ? »), sur ta plus grosse dépense, et sur Envies/revenus. Essaie de reformuler.',
  })
}

// ------------------------------------------------------------------ challenges
// Lightweight gamified challenges — no backend needed, tracked per user+context
// in localStorage, checked against real transactions during the active window.
export const CHALLENGES = [
  {
    key: 'no_delivery_week',
    title: { ru: 'Неделя без доставки еды', en: 'A week without food delivery', es: "Una semana sin comida a domicilio", fr: "Une semaine sans livraison de repas" },
    // `rule` spells out what actually breaks it. The built-ins match on text,
    // not on a category, so the generic "any discretionary spending" line the
    // editor shows for category-based challenges would be a lie here.
    rule: {
      ru: '{days} дн. без доставки еды и заказов из ресторанов',
      en: '{days} days with no food delivery or takeout orders',
      es: '{days} días sin pedidos de comida a domicilio',
      fr: '{days} jours sans livraison de repas',
    },
    days: 7,
    match: (t) => /достав|delivery|doordash|uber ?eats|grubhub|domicilio|livraison/i.test(`${t.category_key} ${t.comment || ''}`),
  },
  {
    key: 'zero_wants_3',
    title: { ru: '3 дня нулевых трат по Wants', en: '3 days of zero Wants spending', es: "3 días sin gastos en Deseos", fr: "3 jours sans dépenses Envies" },
    days: 3,
    match: (t) => t.group === 'wants',
  },
  {
    key: 'no_coffee_week',
    title: { ru: 'Неделя без кофе на вынос', en: 'A week without takeout coffee', es: "Una semana sin café para llevar", fr: "Une semaine sans café à emporter" },
    rule: {
      ru: '{days} дн. без трат: Кофе на вынос',
      en: '{days} days with no spending on: Coffee to go',
      es: '{days} días sin gastar en: Café para llevar',
      fr: '{days} jours sans dépense : Café à emporter',
    },
    days: 7,
    match: (t) => t.category_key === 'coffee',
  },
]

export function challengeTitle(def, lang = 'ru') {
  if (typeof def?.title === 'string') return def.title // custom ones carry a plain name
  return def?.title?.[lang] || def?.title?.en || def?.title?.ru || ''
}

// ------------------------------------------------- editable / custom challenges
// The three above are a starting point, not the whole menu: each can have its
// length and categories adjusted, be hidden, or sit next to ones the person
// writes themselves. Edits live per user+context alongside the active run.
function challengeDefsKey(userId, context) {
  return `fintrack_challenge_defs_${userId}_${context}`
}

function readChallengeDefs(userId, context) {
  try {
    const raw = JSON.parse(localStorage.getItem(challengeDefsKey(userId, context)))
    return { custom: [], overrides: {}, hidden: [], ...(raw || {}) }
  } catch {
    return { custom: [], overrides: {}, hidden: [] }
  }
}

function writeChallengeDefs(userId, context, defs) {
  try {
    localStorage.setItem(challengeDefsKey(userId, context), JSON.stringify(defs))
  } catch { /* private mode — the built-ins still work */ }
  return defs
}

// A custom/edited challenge stores the categories it forbids; this turns that
// into the same `match(tx)` predicate the built-ins use.
function matcherFor(def) {
  if (typeof def.match === 'function') return def.match
  const keys = def.categoryKeys || []
  const group = def.group || null
  return (t) => {
    if (keys.length) return keys.includes(t.category_key)
    if (group) return t.group === group
    return false
  }
}

// Every challenge the person can see: built-ins (with their edits applied),
// minus the ones they hid, plus their own.
export function listChallenges(userId, context) {
  const defs = readChallengeDefs(userId, context)
  const hidden = new Set(defs.hidden || [])
  const builtIns = CHALLENGES
    .filter((c) => !hidden.has(c.key))
    .map((c) => {
      const patch = defs.overrides?.[c.key]
      if (!patch) return { ...c, builtIn: true, match: matcherFor(c) }
      const merged = { ...c, ...patch, builtIn: true, edited: true }
      // An edit that named categories replaces the built-in predicate.
      merged.match = patch.categoryKeys?.length || patch.group ? matcherFor(patch) : matcherFor(c)
      return merged
    })
  const custom = (defs.custom || [])
    .filter((c) => !hidden.has(c.key))
    .map((c) => ({ ...c, builtIn: false, match: matcherFor(c) }))
  return [...builtIns, ...custom]
}

// Create or update one. A built-in is stored as an override so the original
// stays available if they reset it later; anything else lands in `custom`.
export function saveChallengeDef(userId, context, def) {
  const defs = readChallengeDefs(userId, context)
  const isBuiltIn = CHALLENGES.some((c) => c.key === def.key)
  const clean = {
    key: def.key || `custom_${Date.now().toString(36)}`,
    title: def.title,
    days: Math.max(1, Math.min(365, Number(def.days) || 7)),
    categoryKeys: def.categoryKeys || [],
    group: def.group || null,
  }
  if (isBuiltIn) {
    defs.overrides = { ...(defs.overrides || {}), [clean.key]: clean }
  } else {
    const rest = (defs.custom || []).filter((c) => c.key !== clean.key)
    defs.custom = [...rest, clean]
  }
  defs.hidden = (defs.hidden || []).filter((k) => k !== clean.key)
  writeChallengeDefs(userId, context, defs)
  return clean
}

export function deleteChallengeDef(userId, context, key) {
  const defs = readChallengeDefs(userId, context)
  const isBuiltIn = CHALLENGES.some((c) => c.key === key)
  if (isBuiltIn) {
    defs.hidden = Array.from(new Set([...(defs.hidden || []), key]))
    if (defs.overrides) delete defs.overrides[key]
  } else {
    defs.custom = (defs.custom || []).filter((c) => c.key !== key)
  }
  writeChallengeDefs(userId, context, defs)
  return defs
}

// Puts an edited built-in back to how it shipped.
export function resetChallengeDef(userId, context, key) {
  const defs = readChallengeDefs(userId, context)
  if (defs.overrides) delete defs.overrides[key]
  defs.hidden = (defs.hidden || []).filter((k) => k !== key)
  writeChallengeDefs(userId, context, defs)
  return defs
}

function challengeKey(userId, context) {
  return `fintrack_challenge_${userId}_${context}`
}

export function getActiveChallenge(userId, context) {
  try {
    return JSON.parse(localStorage.getItem(challengeKey(userId, context))) || null
  } catch {
    return null
  }
}

export function startChallenge(userId, context, challengeKeyName) {
  const state = { key: challengeKeyName, startedAt: new Date().toISOString() }
  localStorage.setItem(challengeKey(userId, context), JSON.stringify(state))
  return state
}

export function clearChallenge(userId, context) {
  localStorage.removeItem(challengeKey(userId, context))
}

// Returns { challenge, daysElapsed, daysTotal, failed, completed, violatingTx }
// `available` is the person's own list (built-ins plus their edits and custom
// ones) — without it a running custom challenge would evaluate to nothing.
export function evaluateChallenge(active, transactions, available = CHALLENGES) {
  if (!active) return null
  const def = (available || CHALLENGES).find((c) => c.key === active.key)
  if (!def) return null
  const start = new Date(active.startedAt)
  const now = new Date()
  const daysElapsed = Math.min(def.days, Math.floor((now - start) / 86400000))
  const windowTx = transactions.filter((t) => toDate(t.date) >= start)
  const violating = windowTx.find((t) => def.match(t))
  const completed = !violating && daysElapsed >= def.days
  const failed = Boolean(violating)
  return { challenge: def, daysElapsed, daysTotal: def.days, failed, completed, violatingTx: violating || null }
}
