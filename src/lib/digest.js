import { computeSafeToSpendToday, deriveMonthlyIncome } from './finance.js'

// The evening summary: today against today's limit, what that does to
// tomorrow's, and how the top goal is moving. Pure — used by the server tick
// (api/push/tick.js) with the person's own local date. Same math as "Safe to
// spend today" on the home screen, so the numbers always match.

const money = (n) => '$' + Math.round(Math.abs(n)).toLocaleString('en-US')
const counts = (t) => t.group !== 'transfer' && !t.is_payment

export function buildDigest({ transactions = [], settings, goals = [], day, lang = 'ru' }) {
  const en = lang === 'en'
  const [y, m, d] = day.split('-').map(Number)
  const today = new Date(y, m - 1, d)
  const tomorrow = new Date(y, m - 1, d + 1)
  const monthPrefix = day.slice(0, 7)
  const monthTx = transactions.filter((t) => String(t.date).startsWith(monthPrefix) && counts(t))
  const todayTx = monthTx.filter((t) => t.date === day)

  const sum = (list) => list.reduce((s, t) => s + Number(t.amount || 0), 0)
  const wantsBefore = sum(monthTx.filter((t) => t.group === 'wants' && t.date < day))
  const spentToday = sum(todayTx.filter((t) => t.group === 'wants' || t.group === 'needs'))
  const wantsToday = sum(todayTx.filter((t) => t.group === 'wants'))
  const savedToday = sum(todayTx.filter((t) => t.group === 'savings'))
  const incomeToday = sum(todayTx.filter((t) => t.group === 'income'))

  const income = deriveMonthlyIncome(transactions, today)
  const needs = Object.values(settings?.needs_budget || {}).reduce((s, v) => s + (Number(v) || 0), 0)
  const lines = []

  if (!todayTx.length) {
    lines.push(en ? 'No entries today — log what you spent so the summary is accurate.' : 'Сегодня без записей — внеси траты, чтобы сводка была точной.')
  } else if (income > 0) {
    const limit = computeSafeToSpendToday(income, needs, wantsBefore, today).safePerDay
    if (limit > 0) {
      const diff = limit - wantsToday
      const pct = Math.round((Math.abs(diff) / limit) * 100)
      if (diff >= 0) {
        lines.push(en
          ? `Spent ${money(wantsToday)} of today's ${money(limit)} — ${pct}% under the limit 👍`
          : `Потрачено ${money(wantsToday)} из лимита ${money(limit)} — на ${pct}% меньше 👍`)
      } else {
        lines.push(en ? `Over today's limit by ${money(diff)} (${pct}%).` : `Сверх лимита на ${money(diff)} (${pct}%).`)
      }
      if (tomorrow.getMonth() === today.getMonth()) {
        const next = computeSafeToSpendToday(income, needs, wantsBefore + wantsToday, tomorrow).safePerDay
        const change = next - limit
        if (Math.abs(change) >= 1) {
          lines.push(en
            ? `Tomorrow's limit: ${money(next)} (${change > 0 ? '+' : '−'}${money(change)}).`
            : `Лимит на завтра: ${money(next)} (${change > 0 ? '+' : '−'}${money(change)}).`)
        }
      }
    } else {
      lines.push(en
        ? `Spent ${money(spentToday)} today. This month's free money is used up — only essentials until payday.`
        : `Сегодня ушло ${money(spentToday)}. Свободные деньги месяца закончились — до зарплаты только обязательное.`)
    }
  } else {
    lines.push(en ? `Spent ${money(spentToday)} today. Log your income to get a daily limit.` : `Сегодня ушло ${money(spentToday)}. Внеси доход — посчитаю дневной лимит.`)
  }

  if (incomeToday > 0) lines.push(en ? `Came in: ${money(incomeToday)}.` : `Пришло: ${money(incomeToday)}.`)

  const goal = goals[0]
  if (goal && Number(goal.target_amount) > 0) {
    const saved = Number(goal.saved_amount) || 0
    const target = Number(goal.target_amount)
    const pct = Math.min(100, Math.round((saved / target) * 100))
    const left = Math.max(0, target - saved)
    lines.push(en
      ? `"${goal.name}": ${pct}%, ${money(left)} to go${savedToday > 0 ? ` · +${money(savedToday)} saved today` : ''}.`
      : `«${goal.name}»: ${pct}%, осталось ${money(left)}${savedToday > 0 ? ` · сегодня отложено ${money(savedToday)}` : ''}.`)
  } else if (savedToday > 0) {
    lines.push(en ? `Saved today: ${money(savedToday)} 💪` : `Отложено сегодня: ${money(savedToday)} 💪`)
  }

  return { title: en ? 'Your day in money' : 'Итоги дня', body: lines.join('\n') }
}
