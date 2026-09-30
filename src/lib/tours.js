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
  entry: [
    {
      id: 'entry-type',
      title: { ru: 'Доход, расход или перевод', en: 'Income, expense or transfer' },
      body: {
        ru: 'Сначала выбери, что записываешь. «Перевод» — когда деньги просто переехали между твоими счетами (снял наличные, закинул на карту). Это не трата.',
        en: 'First pick what you are logging. "Transfer" is money moving between your own accounts (cash withdrawal, card top-up) — not spending.',
      },
    },
    {
      id: 'entry-money',
      title: { ru: 'Сумма и счёт', en: 'Amount and account' },
      body: {
        ru: 'Сумма, дата и с какой карты или из наличных. Доход пришёл частями (кэш, чек, перевод)? «Разделить по счетам». С кредитки можно сразу включить ежедневное напоминание её погасить. В доходе «Сначала себе» сразу откладывает твой %.',
        en: 'Amount, date and which card or cash. Paid in parts (cash, check, transfer)? "Split across accounts". On a credit card you can turn on a daily pay-it-off reminder. For income, "Pay yourself first" sets your % aside right away.',
      },
    },
    {
      id: 'entry-category',
      title: { ru: 'Категория', en: 'Category' },
      body: {
        ru: 'Начни печатать — приложение само подскажет категорию. Нет подходящей? «+ Своя» в любом разделе, и свои подкатегории тоже. Всё сохраняется.',
        en: 'Start typing and it suggests a category. Nothing fits? "+ Your own" in any section, with your own subcategories too. They are saved.',
      },
    },
  ],
  lessons: [
    {
      id: 'lessons-hero',
      title: { ru: 'Учёба', en: 'Learning' },
      body: {
        ru: 'Короткие уроки по 3–5 минут на твоих же цифрах: кредитки, проценты, подушка, инвестиции. Одного в день хватит — к каждому шагу Пути есть свой урок.',
        en: 'Short 3–5 minute lessons built on your own numbers: cards, interest, cushions, investing. One a day is plenty — each Path step has its own lesson.',
      },
    },
  ],
  debts: [
    {
      id: 'debts-list',
      title: { ru: 'Порядок погашения', en: 'Payoff order' },
      body: {
        ru: 'Первый в списке получает каждый лишний доллар, остальным — только минимум. Закрыл первый — его платёж переходит на следующий, и так до нуля.',
        en: 'The first one gets every spare dollar; the rest get just the minimum. Once it is gone, its payment rolls to the next — all the way to zero.',
      },
    },
  ],
  coach: [
    {
      id: 'coach-input',
      title: { ru: 'Пиши или говори', en: 'Type or talk' },
      body: {
        ru: 'Нажми микрофон и расскажи своими словами, или напиши. Чем честнее — тем точнее план. Разговор хранится на телефоне; «Новый разговор» начинает заново.',
        en: 'Tap the mic and talk, or type. The more honest, the better the plan. The chat stays on your phone; "New conversation" starts fresh.',
      },
    },
  ],
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
      id: 'dash-path',
      title: { ru: 'Путь — твой главный план', en: 'The Path — your main plan' },
      body: {
        ru: 'Шесть шагов от «живу от зарплаты до зарплаты» до свободы: подушка $500 → месяц в запасе → долги → 3 месяца → инвестиции → большие цели. Здесь видно, на каком ты шаге и сколько осталось. Нажми на карточку — раскроются все шаги, урок и челлендж к текущему. «Сначала себе» — сколько % с каждого дохода откладывать сразу.',
        en: 'Six steps from paycheck-to-paycheck to freedom: $500 cushion → a month saved → debts → 3 months → investing → big goals. It shows which step you are on and what is left. Tap it to see every step plus a lesson and a challenge. "Pay yourself first" is the % of each income set aside right away.',
      },
    },
    {
      id: 'dash-coach',
      title: { ru: 'Финансовый друг (AI)', en: 'Money friend (AI)' },
      body: {
        ru: 'Расскажи текстом или голосом, что происходит с деньгами — он видит твои цифры, задаст пару вопросов и скажет, с чего начать: что гасить первым, сколько копить. Долги и цели, о которых договоритесь, добавит в приложение в одно нажатие.',
        en: 'Tell it by text or voice what is going on — it sees your numbers, asks a couple of questions and tells you where to start. Debts and goals you agree on go into the app in one tap.',
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
      id: 'dash-accounts',
      title: { ru: 'Карты и счета', en: 'Cards & accounts' },
      body: {
        ru: 'Сколько у тебя наличными, на картах и сколько должен по кредиткам. Нажми — каждый счёт отдельно, там же оплата кредитки и ежедневное напоминание её погасить.',
        en: 'How much you have in cash, on cards, and owe on credit cards. Tap for each account — card payments and a daily pay-it-off reminder live there too.',
      },
    },
    {
      id: 'dash-debts',
      title: { ru: 'Долги', en: 'Debts' },
      body: {
        ru: 'Все долги в порядке погашения: сначала дорогие, среди них — самый маленький. Вносишь платёж — долг уменьшается, закрытый празднуется.',
        en: 'Every debt in payoff order: expensive first, smallest of those first. Log a payment and the balance drops; each one closed gets celebrated.',
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
      id: 'goals-photo',
      title: { ru: 'Фото цели', en: 'Goal photo' },
      body: {
        ru: 'Добавь фото того, ради чего копишь — машину, дом, маму. Оно будет на цели и на главной, чтобы каждый день видеть, зачем всё это.',
        en: 'Add a photo of what you are saving for — a car, a home, mom. It shows on the goal and the home screen so the "why" is always in view.',
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
    {
      id: 'goals-vision',
      title: { ru: 'Раз в неделю с фото', en: 'Once a week, with the photo' },
      body: {
        ru: 'Выбери день и время — придёт уведомление с фото цели и сколько осталось. Раз в неделю, чтобы не надоедало.',
        en: 'Pick a day and time — a notification arrives with the goal photo and what is left. Once a week, so it never nags.',
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
