// "AI" layer — fully client-side, no external key required, so the app keeps
// working out of the box in demo mode. Everything here is deterministic
// (parsing + rules over the user's own data), presented with the same
// "🤖 explanation" voice as the keyword categorizer in categories.js.
// If a real LLM key is added later (Supabase Edge Function), these functions
// are the natural place to swap a rule-based result for a model call — the
// call sites (EntryScreen, InsightsScreen) don't need to change.

import { suggestCategories, findCategory, pickLang } from './categories'
import { deriveMonthlyIncome } from './finance'

export function categoryLabel(group, key, lang = 'ru') {
  return pickLang(findCategory(group, key)?.label, lang) || key
}

// ---------------------------------------------------------------- quick entry
// "потратил 15 баксов на кофе" -> { amount, suggestion, restText }
const CURRENCY_WORDS = /\b(баксов|баксы|бакс|доллар(?:ов|а)?|usd|дол\.?|у\.е\.?|dollars?|bucks?)\b/gi
const FILLER_WORDS = /\b(потратил[а]?|заплатил[а]?|купил[а]?|взял[а]?|отдал[а]?|на|за|потратила|потратили|spent|paid|bought|got|for|on)\b/gi

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
  return '$' + Math.round(n || 0).toLocaleString('en-US')
}

function monthKey(d) {
  const dt = new Date(d)
  return `${dt.getFullYear()}-${dt.getMonth()}`
}

function isSameMonth(d, ref) {
  const a = new Date(d)
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
  const contributions = transactions.filter((t) => t.group === 'savings' && new Date(t.date) >= since)
  const total = contributions.reduce((s, t) => s + t.amount, 0)
  const actualPerDay = total / windowDays

  if (actualPerDay <= 0) {
    return {
      actualPerDay: 0,
      onTrack: false,
      message:
        lang === 'en'
          ? `No contributions to this goal in the last ${windowDays} days — at this pace the deadline won't be reached at all.`
          : `За последние ${windowDays} дней пополнений цели не было — при таком темпе дедлайн не будет достигнут вообще.`,
    }
  }

  const remaining = Math.max(0, goal.target_amount - (goal.saved_amount || 0))
  const projectedDays = Math.ceil(remaining / actualPerDay)
  const projectedDate = new Date(now.getTime() + projectedDays * 86400000)
  const deadline = new Date(goal.deadline)
  const diffDays = Math.round((projectedDate - deadline) / 86400000)
  const onTrack = diffDays <= 0

  return {
    actualPerDay,
    projectedDate,
    onTrack,
    diffDays: Math.abs(diffDays),
    message:
      lang === 'en'
        ? onTrack
          ? `At your actual pace over the last ${windowDays} days (${fmt(actualPerDay)}/day), the goal will be reached about ${Math.abs(diffDays)} day(s) before the deadline.`
          : `At your actual pace over the last ${windowDays} days (${fmt(actualPerDay)}/day), the goal will miss the deadline by about ${diffDays} day(s) — the plan needs ${fmt(goalPlan.perDay)}/day.`
        : onTrack
          ? `При фактическом темпе последних ${windowDays} дней (${fmt(actualPerDay)}/день) цель будет закрыта примерно на ${Math.abs(diffDays)} дн. раньше дедлайна.`
          : `При фактическом темпе последних ${windowDays} дней (${fmt(actualPerDay)}/день) цель придёт к дедлайну с опозданием примерно на ${diffDays} дн. — план требует ${fmt(goalPlan.perDay)}/день.`,
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

  const sums = (ref) => {
    const map = {}
    for (const t of transactions) {
      if (!isSameMonth(t.date, ref) || t.group === 'transfer') continue
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
  const en = lang === 'en'

  // 1. Wants vs income this month
  if (income > 0) {
    const pct = Math.round((monthWantsTotal / income) * 100)
    cards.push({
      id: 'wants-pct',
      tone: pct > 35 ? 'warn' : 'good',
      text: en
        ? pct > 35
          ? `Wants this month — ${fmt(monthWantsTotal)}, that's ${pct}% of income. Above the usual 30% — worth checking what's growing.`
          : monthWantsTotal > 0
            ? `Wants this month — ${fmt(monthWantsTotal)}, that's ${pct}% of income — within the normal range.`
            : `No Wants spending yet this month — a good time to log the first one and see the breakdown.`
        : pct > 35
          ? `В этом месяце Wants — ${fmt(monthWantsTotal)}, это ${pct}% от дохода. Выше стандартных 30% — стоит посмотреть, что растёт.`
          : monthWantsTotal > 0
            ? `Wants в этом месяце — ${fmt(monthWantsTotal)}, это ${pct}% от дохода — в пределах нормы.`
            : `В этом месяце пока нет трат по Wants — самое время внести первую и посмотреть на разбивку.`,
    })
  }

  // 2. Month-over-month movers
  const mom = categoryMonthOverMonth(transactions).filter((r) => r.pct !== null && Math.abs(r.pct) >= 20)
  if (mom.length > 0) {
    const top = mom[0]
    const [group, key] = top.key.split(':')
    cards.push({
      id: 'mom-' + top.key,
      tone: top.delta > 0 ? 'warn' : 'good',
      text: en
        ? `Category "${categoryLabel(group, key, lang)}" ${top.delta > 0 ? 'grew' : 'dropped'} by ${Math.abs(top.pct)}% vs last month (${fmt(top.prevV)} → ${fmt(top.curV)}).`
        : `Категория «${categoryLabel(group, key, lang)}» ${top.delta > 0 ? 'выросла' : 'снизилась'} на ${Math.abs(top.pct)}% по сравнению с прошлым месяцем (${fmt(top.prevV)} → ${fmt(top.curV)}).`,
    })
  }

  // 3. Recurring / subscriptions
  const recurring = detectRecurring(transactions)
  if (recurring.length > 0) {
    const r = recurring[0]
    cards.push({
      id: 'recurring',
      tone: 'neutral',
      text: en
        ? `Looks like a recurring charge: "${categoryLabel('wants', r.category_key, lang)}" for ~${fmt(r.amount)} shows up ${r.monthsCount} months in a row. If it's a forgotten subscription, now's a good time to cancel it.`
        : `Похоже на регулярный платёж: «${categoryLabel('wants', r.category_key, lang)}» на ~${fmt(r.amount)} встречается ${r.monthsCount} мес. подряд. Если это забытая подписка — самое время её отменить.`,
    })
  }

  // 4. Goal forecast (top goal)
  if (goals && goals.length > 0) {
    const goal = goals[0]
    const monthlyNeeds = Object.values(settings?.needs_budget || {}).reduce((s, v) => s + (v || 0), 0)
    // Local import avoided to keep this module dependency-light; recompute plan inline via ratio.
    const remaining = Math.max(0, goal.target_amount - (goal.saved_amount || 0))
    const daysLeft = Math.max(1, Math.round((new Date(goal.deadline) - now) / 86400000))
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
        text: en
          ? `Your priciest rate among current debts is "${worst.name}" at ${worst.rate}%. Any dollar above minimum payments makes the most sense going there.`
          : `Самая дорогая ставка среди твоих долгов — «${worst.name}» под ${worst.rate}%. Любой доллар сверх минимальных платежей логичнее всего направить туда.`,
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
  const { settings, transactions, goals, lang = 'ru' } = ctx
  const en = lang === 'en'
  const now = new Date()
  const monthTx = transactions.filter((t) => isSameMonth(t.date, now))

  const goal = goals?.[0]

  if (/цел[ьи]|успею|хватит|дедлайн|goal|deadline|make it|enough/.test(q) && goal) {
    const remaining = Math.max(0, goal.target_amount - (goal.saved_amount || 0))
    const daysLeft = Math.max(1, Math.round((new Date(goal.deadline) - now) / 86400000))
    const perDay = remaining / daysLeft
    const forecast = forecastGoal(goal, { perDay }, transactions, 30, lang)
    return (
      forecast?.message ||
      (en
        ? `Remaining until goal "${goal.name}" — ${fmt(remaining)}, needs ${fmt(perDay)}/day saved until the deadline.`
        : `Остаток до цели «${goal.name}» — ${fmt(remaining)}, нужно откладывать ${fmt(perDay)}/день до дедлайна.`)
    )
  }

  if (/самая большая категория|на что трачу|больше всего|biggest category|spend the most|what am i spending/.test(q)) {
    const byCat = {}
    for (const t of monthTx) {
      if (t.group === 'transfer') continue
      const k = `${t.group}:${t.category_key}`
      byCat[k] = (byCat[k] || 0) + t.amount
    }
    const entries = Object.entries(byCat).sort((a, b) => b[1] - a[1])
    if (entries.length === 0) return en ? 'No spending logged this month yet — add the first one on the "Entry" tab.' : 'В этом месяце пока нет трат — добавь первую на вкладке «Трата».'
    const [group, key] = entries[0][0].split(':')
    return en
      ? `The biggest spend this month is "${categoryLabel(group, key, lang)}" — ${fmt(entries[0][1])}.`
      : `Больше всего в этом месяце ушло на «${categoryLabel(group, key, lang)}» — ${fmt(entries[0][1])}.`
  }

  if (/wants|дискреционн|развлечен/.test(q)) {
    const total = monthTx.filter((t) => t.group === 'wants').reduce((s, t) => s + t.amount, 0)
    const derivedIncome = deriveMonthlyIncome(transactions)
    const pct = derivedIncome > 0 ? Math.round((total / derivedIncome) * 100) : null
    return en
      ? pct !== null
        ? `Wants this month — ${fmt(total)} (${pct}% of income).`
        : `Wants this month — ${fmt(total)}.`
      : pct !== null
        ? `Wants в этом месяце — ${fmt(total)} (${pct}% от дохода).`
        : `Wants в этом месяце — ${fmt(total)}.`
  }

  if (/доход|зарплат|income|salary/.test(q)) {
    const loggedIncome = deriveMonthlyIncome(transactions)
    return loggedIncome > 0
      ? en
        ? `Your logged monthly income is ${fmt(loggedIncome)}.`
        : `Записанный доход за месяц — ${fmt(loggedIncome)}.`
      : en
        ? 'No income logged yet — add one on the Entry screen.'
        : 'Доход ещё не записан — добавьте его на экране «Запись».'
  }

  return en
    ? 'I can answer questions about your goal ("will I make the deadline"), what you’re spending the most on, and Wants/income. Try rephrasing.'
    : 'Могу ответить на вопросы про цель ("успею ли к дедлайну"), про то, на что уходит больше всего денег, и про Wants/доход. Попробуй переформулировать.'
}

// ------------------------------------------------------------------ challenges
// Lightweight gamified challenges — no backend needed, tracked per user+context
// in localStorage, checked against real transactions during the active window.
export const CHALLENGES = [
  {
    key: 'no_delivery_week',
    title: { ru: 'Неделя без доставки еды', en: 'A week without food delivery' },
    days: 7,
    match: (t) => /достав|delivery|doordash|uber eats/i.test(`${t.category_key} ${t.comment || ''}`),
  },
  {
    key: 'zero_wants_3',
    title: { ru: '3 дня нулевых трат по Wants', en: '3 days of zero Wants spending' },
    days: 3,
    match: (t) => t.group === 'wants',
  },
  {
    key: 'no_coffee_week',
    title: { ru: 'Неделя без кофе на вынос', en: 'A week without takeout coffee' },
    days: 7,
    match: (t) => t.category_key === 'coffee',
  },
]

export function challengeTitle(def, lang = 'ru') {
  if (typeof def?.title === 'string') return def.title // custom ones carry a plain name
  return def?.title?.[lang] || def?.title?.ru || ''
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
  const windowTx = transactions.filter((t) => new Date(t.date) >= start)
  const violating = windowTx.find((t) => def.match(t))
  const completed = !violating && daysElapsed >= def.days
  const failed = Boolean(violating)
  return { challenge: def, daysElapsed, daysTotal: def.days, failed, completed, violatingTx: violating || null }
}
