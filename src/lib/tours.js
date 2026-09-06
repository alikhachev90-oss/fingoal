// In-app guided tours — short "spotlight one element, explain it" walkthroughs
// per screen, aimed at someone who has never used a budgeting app and knows
// nothing about personal finance yet. Each screen owns its own tour and runs
// it once automatically the first time that screen is opened; a screen can
// offer a "?" button (TopBar's onHelp) to replay it on demand.
//
// Deep content, so ru/en only (same convention as lessons.js/course.js) —
// falls back to ru for es/fr users.

function doneKey(userId, context, screenKey) {
  return `fintera_tour_done_${userId}_${context}_${screenKey}`
}

export function isTourDone(userId, context, screenKey) {
  return localStorage.getItem(doneKey(userId, context, screenKey)) === '1'
}

export function markTourDone(userId, context, screenKey) {
  localStorage.setItem(doneKey(userId, context, screenKey), '1')
}

export function resetTour(userId, context, screenKey) {
  localStorage.removeItem(doneKey(userId, context, screenKey))
}

export const TOURS = {
  dashboard: [
    {
      id: 'dash-quote',
      title: { ru: 'Цитата и статистика дня', en: 'Quote & stat of the day' },
      body: {
        ru: 'Здесь каждый день новая мысль из книг по финансам — или реальная цифра из исследования (например, сколько людей в мире живут от зарплаты до зарплаты). Маленькая доза, но помогает не забывать, зачем всё это.',
        en: 'A new line from a finance book each day — or a real number from an actual study (e.g. how many people worldwide live paycheck to paycheck). A small dose, but it keeps the "why" in view.',
      },
    },
    {
      id: 'dash-safe-to-spend',
      title: { ru: 'Можно потратить сегодня', en: 'Safe to spend today' },
      body: {
        ru: 'Это не весь ваш баланс — это сколько можно потратить именно сегодня, чтобы спокойно дотянуть до конца месяца и не залезть в обязательные платежи. Если тратите меньше — отлично, если больше — стоит притормозить.',
        en: "This isn't your whole balance — it's how much you can spend today and still comfortably make it to month's end without eating into your fixed bills. Spend less — great. Spend more — worth slowing down.",
      },
    },
    {
      id: 'dash-streak',
      title: { ru: 'Серия дней подряд', en: 'Daily streak' },
      body: {
        ru: 'Каждый день отмечайте, откладывали ли вы деньги. Это не про суммы — это про привычку. Пропустили день — серия обнулится, но начать заново можно в любой момент.',
        en: "Mark each day whether you set money aside. It's not about the amount — it's about the habit. Miss a day and the streak resets, but you can always start again.",
      },
    },
    {
      id: 'dash-chart',
      title: { ru: 'Диаграмма трат', en: 'Spending chart' },
      body: {
        ru: 'Каждый сектор — отдельная категория (Жильё, Транспорт и т.д.), а не просто «Обязательное/Необязательное». Нажмите на сектор или на его название в списке ниже — увидите, из чего конкретно она состоит (например, в Жильё: аренда, коммуналка, быт).',
        en: "Each slice is one category (Housing, Transport, etc.), not just a broad Needs/Wants split. Tap a slice or its name in the list below to see exactly what makes it up (e.g. Housing breaks into rent, utilities, household).",
      },
    },
    {
      id: 'dash-bills',
      title: { ru: 'Обязательные платежи', en: 'Bills & payments' },
      body: {
        ru: 'Аренда, кредиты, коммуналка — то, что нужно платить в любом случае. На каждом можно поставить напоминание, чтобы не забыть про дату.',
        en: 'Rent, loans, utilities — the stuff you have to pay no matter what. You can set a reminder on any of them so the due date never sneaks up on you.',
      },
    },
  ],
  goals: [
    {
      id: 'goals-new',
      title: { ru: 'Как ставить цель', en: 'How to set a goal' },
      body: {
        ru: 'Цель — это конкретная сумма и конкретная дата, например «$3000 к 1 декабря», а не расплывчатое «накопить побольше». Без даты легко откладывать бесконечно — с датой приложение может посчитать, сколько нужно откладывать в день.',
        en: 'A goal is a specific amount by a specific date — "$3,000 by December 1st", not a vague "save more". Without a date it\'s easy to put off forever; with one, the app can tell you exactly how much to set aside per day.',
      },
    },
    {
      id: 'goals-plan',
      title: { ru: 'План: сколько откладывать', en: 'The plan: how much to set aside' },
      body: {
        ru: 'Здесь видно, сколько нужно откладывать в день и в месяц, чтобы успеть к дедлайну, и хватает ли для этого вашего дохода после обязательных трат. Если не хватает — приложение честно об этом скажет и предложит варианты.',
        en: "This shows how much to set aside per day and per month to hit the deadline, and whether your income after fixed expenses can actually cover it. If it can't, the app says so honestly and suggests options.",
      },
    },
    {
      id: 'goals-reminder',
      title: { ru: 'Ежедневное напоминание', en: 'Daily reminder' },
      body: {
        ru: 'Выберите удобное время — раз в день придёт напоминание, сколько осталось до цели и стоит ли сегодня что-то отложить.',
        en: "Pick a time that works for you — once a day you'll get a nudge on how much is left toward the goal and whether today is a good day to set something aside.",
      },
    },
  ],
  insights: [
    {
      id: 'insights-ask',
      title: { ru: 'Спроси про свои финансы', en: 'Ask about your finances' },
      body: {
        ru: 'Пишите обычными словами: «сколько я трачу на кафе», «успею ли к цели» — ответ строится по вашим же реальным данным, а не общими фразами.',
        en: 'Type it in plain words: "how much do I spend on eating out", "will I make my goal" — the answer is built from your own real data, not generic filler.',
      },
    },
    {
      id: 'insights-radar',
      title: { ru: 'Радар подписок', en: 'Subscription radar' },
      body: {
        ru: 'Замечает повторяющиеся траты — если видит одинаковую сумму в Wants 2+ месяца подряд, спрашивает: это ещё нужная подписка или забытая? Работает по вручную введённым тратам; после привязки карты будет точнее и автоматически.',
        en: 'Spots repeating charges — if it sees the same amount in Wants for 2+ months running, it asks: still a subscription you want, or one you forgot about? Runs on manually logged spending for now; once card-linking ships it\'ll be automatic and more precise.',
      },
    },
    {
      id: 'insights-challenge',
      title: { ru: 'Челленджи', en: 'Challenges' },
      body: {
        ru: 'Короткие вызовы вроде «3 дня без Wants-трат» — тренируют самоконтроль на практике, а не в теории.',
        en: 'Short challenges like "3 days with zero Wants spending" — training self-control in practice, not just in theory.',
      },
    },
    {
      id: 'insights-tax',
      title: { ru: 'Оценка налога', en: 'Tax estimate' },
      body: {
        ru: 'Прикидка федерального налога по вашему доходу — не консультация бухгалтера, а быстрая ориентировка, чего примерно ожидать.',
        en: 'A rough estimate of your federal tax based on your income — not accountant advice, just a quick sense of what to expect.',
      },
    },
  ],
}
