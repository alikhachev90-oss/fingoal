import { computeSafeToSpendToday, deriveMonthlyIncome } from './finance.js'
import { tr } from './tr.js'

// The evening summary: today against today's limit, what that does to
// tomorrow's, and how the top goal is moving. Pure — used by the server tick
// (api/push/tick.js) with the person's own local date. Same math as "Safe to
// spend today" on the home screen, so the numbers always match.

const money = (n) => '$' + Math.round(Math.abs(n)).toLocaleString('en-US')
const counts = (t) => t.group !== 'transfer' && !t.is_payment

export function buildDigest({ transactions = [], settings, goals = [], day, lang = 'ru' }) {
  const L = (texts) => tr(lang, texts)
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
    lines.push(L({ ru: 'Сегодня без записей — внеси траты, чтобы сводка была точной.', en: 'No entries today — log what you spent so the summary is accurate.', es: 'Hoy no hay registros — anota tus gastos para que el resumen sea exacto.', fr: 'Aucune saisie aujourd’hui — note tes dépenses pour un résumé exact.' }))
  } else if (income > 0) {
    const limit = computeSafeToSpendToday(income, needs, wantsBefore, today).safePerDay
    if (limit > 0) {
      const diff = limit - wantsToday
      const pct = Math.round((Math.abs(diff) / limit) * 100)
      if (diff >= 0) {
        lines.push(L({
          ru: `Потрачено ${money(wantsToday)} из лимита ${money(limit)} — на ${pct}% меньше 👍`,
          en: `Spent ${money(wantsToday)} of today's ${money(limit)} — ${pct}% under the limit 👍`,
          es: `Gastaste ${money(wantsToday)} de ${money(limit)} de hoy — un ${pct}% bajo el límite 👍`,
          fr: `Dépensé ${money(wantsToday)} sur ${money(limit)} aujourd’hui — ${pct} % sous la limite 👍`,
        }))
      } else {
        lines.push(L({ ru: `Сверх лимита на ${money(diff)} (${pct}%).`, en: `Over today's limit by ${money(diff)} (${pct}%).`, es: `Te pasaste del límite de hoy por ${money(diff)} (${pct}%).`, fr: `Limite du jour dépassée de ${money(diff)} (${pct} %).` }))
      }
      if (tomorrow.getMonth() === today.getMonth()) {
        const next = computeSafeToSpendToday(income, needs, wantsBefore + wantsToday, tomorrow).safePerDay
        const change = next - limit
        if (Math.abs(change) >= 1) {
          const delta = `${change > 0 ? '+' : '−'}${money(change)}`
          lines.push(L({
            ru: `Лимит на завтра: ${money(next)} (${delta}).`,
            en: `Tomorrow's limit: ${money(next)} (${delta}).`,
            es: `Límite de mañana: ${money(next)} (${delta}).`,
            fr: `Limite de demain : ${money(next)} (${delta}).`,
          }))
        }
      }
    } else {
      lines.push(L({
        ru: `Сегодня ушло ${money(spentToday)}. Свободные деньги месяца закончились — до зарплаты только обязательное.`,
        en: `Spent ${money(spentToday)} today. This month's free money is used up — only essentials until payday.`,
        es: `Hoy se fueron ${money(spentToday)}. El dinero libre del mes se acabó — hasta el pago, solo lo esencial.`,
        fr: `Dépensé ${money(spentToday)} aujourd’hui. L’argent libre du mois est épuisé — seulement l’essentiel jusqu’à la paie.`,
      }))
    }
  } else {
    lines.push(L({ ru: `Сегодня ушло ${money(spentToday)}. Внеси доход — посчитаю дневной лимит.`, en: `Spent ${money(spentToday)} today. Log your income to get a daily limit.`, es: `Hoy se fueron ${money(spentToday)}. Anota tus ingresos y calcularé un límite diario.`, fr: `Dépensé ${money(spentToday)} aujourd’hui. Note tes revenus pour obtenir une limite quotidienne.` }))
  }

  if (incomeToday > 0) lines.push(L({ ru: `Пришло: ${money(incomeToday)}.`, en: `Came in: ${money(incomeToday)}.`, es: `Entró: ${money(incomeToday)}.`, fr: `Rentré : ${money(incomeToday)}.` }))

  const goal = goals[0]
  if (goal && Number(goal.target_amount) > 0) {
    const saved = Number(goal.saved_amount) || 0
    const target = Number(goal.target_amount)
    const pct = Math.min(100, Math.round((saved / target) * 100))
    const left = Math.max(0, target - saved)
    const st = savedToday > 0 ? money(savedToday) : ''
    lines.push(L({
      ru: `«${goal.name}»: ${pct}%, осталось ${money(left)}${st ? ` · сегодня отложено ${st}` : ''}.`,
      en: `"${goal.name}": ${pct}%, ${money(left)} to go${st ? ` · +${st} saved today` : ''}.`,
      es: `«${goal.name}»: ${pct}%, faltan ${money(left)}${st ? ` · hoy apartaste ${st}` : ''}.`,
      fr: `« ${goal.name} » : ${pct} %, reste ${money(left)}${st ? ` · ${st} mis de côté aujourd’hui` : ''}.`,
    }))
  } else if (savedToday > 0) {
    lines.push(L({ ru: `Отложено сегодня: ${money(savedToday)} 💪`, en: `Saved today: ${money(savedToday)} 💪`, es: `Apartado hoy: ${money(savedToday)} 💪`, fr: `Mis de côté aujourd’hui : ${money(savedToday)} 💪` }))
  }

  return { title: L({ ru: 'Итоги дня', en: 'Your day in money', es: 'Tu día en dinero', fr: 'Ta journée en argent' }), body: lines.join('\n') }
}
