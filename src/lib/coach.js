function fmt(n) {
  return '$' + Math.round(n || 0).toLocaleString('en-US')
}

export function getCoachAction({ settings, transactions = [], goals = [], debts = [], lang = 'ru', checkedInToday = false }) {
  const en = lang === 'en'
  const now = new Date()
  const monthTx = transactions.filter((t) => {
    const d = new Date(t.date)
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
  })
  const incomeLogged = monthTx.filter((t) => t.group === 'income').reduce((s, t) => s + (t.amount || 0), 0)
  const wants = monthTx.filter((t) => t.group === 'wants').reduce((s, t) => s + (t.amount || 0), 0)
  const income = settings?.monthly_income || incomeLogged || 0

  const highRateDebt = [...debts].filter((d) => Number(d.rate) > 15).sort((a, b) => Number(b.rate) - Number(a.rate))[0]
  if (highRateDebt) {
    return {
      tone: 'warn',
      eyebrow: en ? 'Priority now' : 'Сейчас важно',
      title: en ? 'High-interest debt is slowing you down' : 'Высокий процент по долгу тормозит твой рост',
      text: en ? `${highRateDebt.name} is at ${highRateDebt.rate}% APR. Before increasing investment risk, it usually makes sense to attack this balance first.` : `«${highRateDebt.name}» — ${highRateDebt.rate}% годовых. Пока такой долг висит, обычно выгоднее сначала давить его, а уже потом наращивать риск в инвестициях.`,
      action: en ? 'Learn the payoff strategy' : 'Разобрать стратегию погашения',
      to: '/lessons?focus=debt_strategy',
    }
  }

  if (goals.length === 0) {
    return {
      tone: 'neutral',
      eyebrow: en ? 'Next step' : 'Следующий шаг',
      title: en ? 'Your money needs a destination' : 'Деньгам нужна точка назначения',
      text: en ? 'Create one concrete goal with an amount and deadline. FinTrack will turn it into a daily and monthly plan.' : 'Создай одну конкретную цель с суммой и сроком. FinTrack разложит её на понятный дневной и месячный план.',
      action: en ? 'Create a goal' : 'Поставить цель',
      to: '/goals',
    }
  }

  const goal = goals.find((g) => Number(g.target_amount) > Number(g.saved_amount || 0))
  if (!goal) return null
  const monthlyNeeds = Object.values(settings?.needs_budget || {}).reduce((sum, amount) => sum + (Number(amount) || 0), 0)
  const daysLeftThisMonth = Math.max(1, new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate() - now.getDate() + 1)
  const dailyAvailable = Math.max(0, (income - monthlyNeeds - wants) / daysLeftThisMonth)
  const remaining = Math.max(0, (goal.target_amount || 0) - (goal.saved_amount || 0))
  const daysLeft = Math.max(1, Math.ceil((new Date(goal.deadline).setHours(0, 0, 0, 0) - now.setHours(0, 0, 0, 0)) / 86400000))
  const dailyGoalStep = remaining / daysLeft
  const savedRecently = transactions.some((t) => {
    const age = Date.now() - new Date(t.date).getTime()
    return t.group === 'savings' && age >= 0 && age < 14 * 86400000
  })

  if (remaining > 0 && Number.isFinite(dailyGoalStep) && dailyGoalStep > 0 && !savedRecently && !checkedInToday && dailyAvailable >= 1 && wants <= income * 0.3) {
    const suggestedAmount = Math.max(1, Math.min(Math.ceil(dailyGoalStep), Math.floor(dailyAvailable)))
    return {
      tone: 'good',
      eyebrow: en ? 'Today’s move' : 'Действие на сегодня',
      title: en ? `One step toward “${goal.name}”` : `Шаг к «${goal.name}»`,
      text: en
        ? `The goal plan needs about ${fmt(dailyGoalStep)} a day. Suggested step: ${fmt(suggestedAmount)}, based on your monthly budget. Record it once you have actually set the money aside.`
        : `Для цели нужно около ${fmt(dailyGoalStep)} в день. Предлагаемый шаг — ${fmt(suggestedAmount)} по твоему месячному бюджету. Запиши его, когда действительно отложишь деньги.`,
      action: en ? `Set aside ${fmt(suggestedAmount)}` : `Отложить ${fmt(suggestedAmount)}`,
      to: `/goals?goal=${encodeURIComponent(goal.id)}&amount=${suggestedAmount}`,
    }
  }

  if (income > 0 && wants > income * 0.3) {
    const pct = Math.round((wants / income) * 100)
    return {
      tone: 'warn',
      eyebrow: en ? 'Worth a look' : 'Стоит посмотреть',
      title: en ? 'Lifestyle spending is running hot' : 'Свободные траты разгоняются',
      text: en ? `Wants are already ${pct}% of monthly income (${fmt(wants)}). That is not automatically bad, but it is the first place to check before the month gets away from you.` : `Wants уже составляют ${pct}% месячного дохода (${fmt(wants)}). Это не обязательно плохо, но именно сюда стоит посмотреть до того, как месяц уйдёт из-под контроля.`,
      action: en ? 'Read the 3-minute lesson' : 'Прочитать урок на 3 минуты',
      to: '/lessons?focus=lifestyle_creep',
    }
  }

  if (goal) {
    return {
      tone: 'good',
      eyebrow: en ? 'On course' : 'Курс задан',
      title: en ? `Keep moving toward “${goal.name}”` : `Продолжай двигаться к «${goal.name}»`,
      text: en ? `${fmt(remaining)} remains. Small, regular contributions matter more than occasional perfect months.` : `Осталось ${fmt(remaining)}. Здесь важнее регулярность маленьких шагов, чем редкие «идеальные» месяцы.`,
      action: en ? 'Open the goal' : 'Открыть цель',
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
