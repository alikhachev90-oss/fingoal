import { toDate } from './dates'
import { tr } from './tr.js'
import { fmtMoney } from './money.js'
function fmt(n) {
  return fmtMoney(n)
}

export function getCoachAction({ settings, transactions = [], goals = [], debts = [], lang = 'ru', checkedInToday = false }) {
  const L = (texts) => tr(lang, texts)
  const now = new Date()
  const monthTx = transactions.filter((t) => {
    const d = toDate(t.date)
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
  })
  const incomeLogged = monthTx.filter((t) => t.group === 'income').reduce((s, t) => s + (t.amount || 0), 0)
  const wants = monthTx.filter((t) => t.group === 'wants').reduce((s, t) => s + (t.amount || 0), 0)
  const income = incomeLogged || 0

  const highRateDebt = [...debts].filter((d) => Number(d.rate) > 15).sort((a, b) => Number(b.rate) - Number(a.rate))[0]
  if (highRateDebt) {
    const { name, rate } = highRateDebt
    return {
      tone: 'warn',
      eyebrow: L({ ru: 'Сейчас важно', en: 'Priority now', es: 'Prioridad ahora', fr: 'Priorité du moment' }),
      title: L({ ru: 'Высокий процент по долгу тормозит твой рост', en: 'High-interest debt is slowing you down', es: 'Una deuda con interés alto te está frenando', fr: 'Une dette à taux élevé te freine' }),
      text: L({
        ru: `«${name}» — ${rate}% годовых. Пока такой долг висит, обычно выгоднее сначала давить его, а уже потом наращивать риск в инвестициях.`,
        en: `${name} is at ${rate}% APR. Before increasing investment risk, it usually makes sense to attack this balance first.`,
        es: `«${name}» tiene un ${rate}% anual. Antes de asumir más riesgo invirtiendo, suele convenir atacar primero este saldo.`,
        fr: `« ${name} » est à ${rate} % par an. Avant de prendre plus de risque en investissant, mieux vaut d'abord attaquer ce solde.`,
      }),
      action: L({ ru: 'Разобрать стратегию погашения', en: 'Learn the payoff strategy', es: 'Ver la estrategia de pago', fr: 'Voir la stratégie de remboursement' }),
      to: '/lessons?focus=debt_strategy',
    }
  }

  if (goals.length === 0) {
    return {
      tone: 'neutral',
      eyebrow: L({ ru: 'Следующий шаг', en: 'Next step', es: 'Siguiente paso', fr: 'Prochaine étape' }),
      title: L({ ru: 'Деньгам нужна точка назначения', en: 'Your money needs a destination', es: 'Tu dinero necesita un destino', fr: 'Ton argent a besoin d’une destination' }),
      text: L({
        ru: 'Создай одну конкретную цель с суммой и сроком. Приложение разложит её на понятный дневной и месячный план.',
        en: 'Create one concrete goal with an amount and deadline. The app will turn it into a daily and monthly plan.',
        es: 'Crea una meta concreta con un monto y una fecha. La app la convertirá en un plan diario y mensual.',
        fr: 'Crée un objectif concret avec un montant et une date. L’app le transformera en plan quotidien et mensuel.',
      }),
      action: L({ ru: 'Поставить цель', en: 'Create a goal', es: 'Crear una meta', fr: 'Créer un objectif' }),
      to: '/goals',
    }
  }

  const goal = goals.find((g) => Number(g.target_amount) > Number(g.saved_amount || 0))
  if (!goal) return null
  const monthlyNeeds = Object.values(settings?.needs_budget || {}).reduce((sum, amount) => sum + (Number(amount) || 0), 0)
  const daysLeftThisMonth = Math.max(1, new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate() - now.getDate() + 1)
  const dailyAvailable = Math.max(0, (income - monthlyNeeds - wants) / daysLeftThisMonth)
  const remaining = Math.max(0, (goal.target_amount || 0) - (goal.saved_amount || 0))
  const daysLeft = Math.max(1, Math.ceil((toDate(goal.deadline).setHours(0, 0, 0, 0) - now.setHours(0, 0, 0, 0)) / 86400000))
  const dailyGoalStep = remaining / daysLeft
  const savedRecently = transactions.some((t) => {
    const age = Date.now() - toDate(t.date).getTime()
    return t.group === 'savings' && age >= 0 && age < 14 * 86400000
  })

  if (remaining > 0 && Number.isFinite(dailyGoalStep) && dailyGoalStep > 0 && !savedRecently && !checkedInToday && dailyAvailable >= 1 && wants <= income * 0.3) {
    const suggestedAmount = Math.max(1, Math.min(Math.ceil(dailyGoalStep), Math.floor(dailyAvailable)))
    const step = fmt(dailyGoalStep)
    const sug = fmt(suggestedAmount)
    return {
      tone: 'good',
      eyebrow: L({ ru: 'Действие на сегодня', en: 'Today’s move', es: 'El paso de hoy', fr: 'L’action du jour' }),
      title: L({ ru: `Шаг к «${goal.name}»`, en: `One step toward “${goal.name}”`, es: `Un paso hacia «${goal.name}»`, fr: `Un pas vers « ${goal.name} »` }),
      text: L({
        ru: `Для цели нужно около ${step} в день. Предлагаемый шаг — ${sug} по твоему месячному бюджету. Запиши его, когда действительно отложишь деньги.`,
        en: `The goal plan needs about ${step} a day. Suggested step: ${sug}, based on your monthly budget. Record it once you have actually set the money aside.`,
        es: `La meta necesita unos ${step} al día. Paso sugerido: ${sug}, según tu presupuesto mensual. Anótalo cuando de verdad hayas apartado el dinero.`,
        fr: `L’objectif demande environ ${step} par jour. Étape suggérée : ${sug}, selon ton budget mensuel. Note-la quand tu as vraiment mis l’argent de côté.`,
      }),
      action: L({ ru: `Отложить ${sug}`, en: `Set aside ${sug}`, es: `Apartar ${sug}`, fr: `Mettre ${sug} de côté` }),
      to: `/goals?goal=${encodeURIComponent(goal.id)}&amount=${suggestedAmount}`,
    }
  }

  if (income > 0 && wants > income * 0.3) {
    const pct = Math.round((wants / income) * 100)
    const w = fmt(wants)
    return {
      tone: 'warn',
      eyebrow: L({ ru: 'Стоит посмотреть', en: 'Worth a look', es: 'Vale la pena revisar', fr: 'À regarder' }),
      title: L({ ru: 'Свободные траты разгоняются', en: 'Lifestyle spending is running hot', es: 'Los gastos por gusto se están disparando', fr: 'Les dépenses plaisir s’emballent' }),
      text: L({
        ru: `Wants уже составляют ${pct}% месячного дохода (${w}). Это не обязательно плохо, но именно сюда стоит посмотреть до того, как месяц уйдёт из-под контроля.`,
        en: `Wants are already ${pct}% of monthly income (${w}). That is not automatically bad, but it is the first place to check before the month gets away from you.`,
        es: `Los deseos ya son el ${pct}% del ingreso mensual (${w}). No es malo por sí mismo, pero es lo primero que conviene revisar antes de que el mes se te escape.`,
        fr: `Les envies représentent déjà ${pct} % du revenu mensuel (${w}). Ce n’est pas forcément grave, mais c’est le premier endroit à vérifier avant que le mois ne t’échappe.`,
      }),
      action: L({ ru: 'Прочитать урок на 3 минуты', en: 'Read the 3-minute lesson', es: 'Leer la lección de 3 minutos', fr: 'Lire la leçon de 3 minutes' }),
      to: '/lessons?focus=lifestyle_creep',
    }
  }

  if (goal) {
    const r = fmt(remaining)
    return {
      tone: 'good',
      eyebrow: L({ ru: 'Курс задан', en: 'On course', es: 'En camino', fr: 'Sur la bonne voie' }),
      title: L({ ru: `Продолжай двигаться к «${goal.name}»`, en: `Keep moving toward “${goal.name}”`, es: `Sigue avanzando hacia «${goal.name}»`, fr: `Continue vers « ${goal.name} »` }),
      text: L({
        ru: `Осталось ${r}. Здесь важнее регулярность маленьких шагов, чем редкие «идеальные» месяцы.`,
        en: `${r} remains. Small, regular contributions matter more than occasional perfect months.`,
        es: `Faltan ${r}. Importan más los pasos pequeños y constantes que algún mes «perfecto».`,
        fr: `Il reste ${r}. De petits versements réguliers comptent plus que quelques mois « parfaits ».`,
      }),
      action: L({ ru: 'Открыть цель', en: 'Open the goal', es: 'Abrir la meta', fr: 'Ouvrir l’objectif' }),
      to: '/goals',
    }
  }

  return null
}

export function getRecommendedLesson(lessons, completed = [], focusKey = null) {
  if (!Array.isArray(lessons)) return null
  if (focusKey) {
    const focused = lessons.find((lesson) => lesson.key === focusKey && lesson.unlocked)
    if (focused) return focused
  }
  return lessons.find((lesson) => lesson.unlocked && !completed.includes(lesson.key)) || lessons.find((lesson) => lesson.unlocked) || null
}
