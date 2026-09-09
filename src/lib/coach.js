function fmt(n) {
  return '$' + Math.round(n || 0).toLocaleString('en-US')
}

export function getCoachAction({ settings, transactions = [], goals = [], debts = [], lang = 'ru' }) {
  const en = lang === 'en'
  const now = new Date()
  const monthTx = transactions.filter((t) => {
    const d = new Date(t.date)
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
  })
  const incomeLogged = monthTx.filter((t) => t.group === 'income').reduce((s, t) => s + (t.amount || 0), 0)
  const wants = monthTx.filter((t) => t.group === 'wants').reduce((s, t) => s + (t.amount || 0), 0)
  const income = settings?.monthly_income || incomeLogged || 0

  if (transactions.length < 3) {
    return {
      tone: 'neutral',
      eyebrow: en ? 'Start here' : 'Начни отсюда',
      title: en ? 'Give FinTrack a little context' : 'Дай FinTrack немного контекста',
      text: en ? 'Add a few real transactions. The app will start explaining your money instead of only showing empty charts.' : 'Добавь несколько реальных операций. После этого приложение начнёт объяснять твои деньги, а не просто показывать пустые графики.',
      action: en ? 'Add transaction' : 'Добавить операцию',
      to: '/entry',
    }
  }

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

  const goal = goals[0]
  if (goal) {
    const remaining = Math.max(0, (goal.target_amount || 0) - (goal.saved_amount || 0))
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
