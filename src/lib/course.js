// A structured, source-cited course — distinct from the narrative "Истории"
// in lessons.js. Every lesson here traces to a named primary source (a US
// regulator, central bank, or university), and every track ends with a real
// pass/fail exam that gates the next track. This is deliberately NOT framed
// as issuing a real credential (CFA charter, Series 65 license, a
// university degree) — those require paid, proctored, identity-verified
// exams through the actual institutions. What this can honestly claim is:
// the same body of knowledge, explained plainly, checked with a real exam.

function fmt(n) {
  return '$' + Math.round(n || 0).toLocaleString('en-US')
}

export const TRACKS = [
  {
    key: 'foundations',
    title: { ru: 'Основы: как устроены твои деньги', en: 'Foundations: how your money actually works' },
    source: 'FDIC Money Smart · CFPB «Your Money, Your Goals»',
    sourceUrl: 'https://www.fdic.gov/consumer-resource-center/money-smart',
    locked: false,
    lessons: [
      {
        key: 'crisis_first_aid',
        title: { ru: 'Если совсем труба: план первых шагов', en: 'If things are really bad: first steps' },
        minutes: 4,
        source: 'CFPB (кризисные модули) + практика',
        body: (ctx, lang) => {
          const debts = ctx.debts || []
          const totalDebt = debts.reduce((s, d) => s + (d.balance || 0), 0)
          if (lang === 'en') {
            return [
              "When there isn't even enough money for essentials, budgeting by percentages isn't the first move. The first move is to stop the bleeding, and here the order of actions matters more than the perfection of any one decision.",
              'Step 1: any income beats a perfect income. Until the cash-flow gap is closed, a side gig, temporary work, or a job outside your field isn\'t a "step down" — it\'s what physically covers the bills this month. Optimizing your career can and should happen later, once the gap is closed.',
              "Step 2: call your creditors yourself, before collectors call you. Banks and lenders in the US are legally expected to consider requests for deferment or a revised payment plan — the CFPB explicitly recommends reaching out proactively: it's easier to negotiate before you're delinquent than after.",
              "Step 3: the priority order for payments in a crisis isn't by debt size or rate — it's by the cost of immediate consequences. First: anything that risks losing your home or the car you need to get to work (rent/mortgage, auto loan), and critical utilities (power, water). Only after that: credit cards and other debts, even if their rate is higher.",
              'Step 4: this is a temporary manual-override mode, not a permanent strategy — once the cash-flow gap is closed, go back to the normal plan (Needs/Wants/Savings, paying down debt via the avalanche method, etc.).',
              totalDebt > 0
                ? `Your numbers: your total debt right now is ${fmt(totalDebt)}. That's not a verdict — it's just a number you can start calling and negotiating with.`
                : '',
            ].filter(Boolean).join('\n\n')
          }
          return [
            'Когда денег не хватает даже на обязательное, планирование бюджета по процентам — не первый шаг. Первый шаг — остановить кровотечение, и здесь порядок действий важнее идеальности каждого решения.',
            'Шаг 1: любой доход важнее идеального дохода. Пока не закрыт кассовый разрыв, подработка, временная или не по специальности работа — это не «понижение статуса», это то, что физически закрывает счета в этом месяце. Оптимизировать карьеру можно и нужно, но позже, когда разрыв закрыт.',
            'Шаг 2: звони кредиторам сам, раньше, чем тебе позвонят коллекторы. Банки и кредиторы в США по закону обязаны рассматривать запросы на отсрочку или изменение плана платежей — CFPB прямо рекомендует связываться проактивно: договориться легче, пока просрочки ещё нет, чем после.',
            'Шаг 3: порядок приоритета платежей в кризис — не по размеру долга и не по ставке, а по цене немедленных последствий. Сначала — то, что грозит потерей крыши над головой или машины, без которой не доехать до работы (аренда/ипотека, автокредит), и критичные счета (свет, вода). Только после этого — карточки и остальные долги, даже если у них выше ставка.',
            'Шаг 4: это временный режим ручного управления, а не постоянная стратегия — как только кассовый разрыв закрыт, возвращаешься к обычному плану (Needs/Wants/Savings, гашение долга по методу лавины и т.д.).',
            totalDebt > 0
              ? `Твои цифры: сумма твоих долгов сейчас — ${fmt(totalDebt)}. Это не приговор — это просто число, с которым можно начать звонить и договариваться.`
              : '',
          ].filter(Boolean).join('\n\n')
        },
      },
      {
        key: 'fdic_insurance',
        title: { ru: 'Зачем банку твой депозит и что его страхует', en: 'Why banks want your deposit, and what insures it' },
        minutes: 4,
        source: 'FDIC',
        body: (_ctx, lang) =>
          (lang === 'en'
            ? [
                "When you put money in an account, the bank doesn't lock it in a vault — it immediately lends part of it out to other people and businesses, earning money on the rate difference. That's normal and legal — it's how the entire banking system works.",
                "The question that should worry the regulator, not you: what if the bank fails? In the US the answer is the FDIC (Federal Deposit Insurance Corporation), an independent agency that insures deposits up to $250,000 per depositor, per bank. This isn't marketing from any one bank — it's federal law covering every FDIC-member bank.",
                "Practical takeaway: if you have more than $250,000 in cash, it's worth spreading it across different banks or ownership categories rather than one place — anything above the limit isn't guaranteed to come back if that bank fails.",
              ]
            : [
                'Когда ты кладёшь деньги на счёт, банк не запирает их в сейфе — он тут же выдаёт часть в виде кредитов другим людям и бизнесам, зарабатывая на разнице процентов. Это нормально и законно: так работает вся банковская система.',
                'Вопрос, который должен беспокоить не тебя, а регулятора: что если банк обанкротится? Ответ в США — FDIC (Federal Deposit Insurance Corporation), независимое агентство, которое страхует депозиты на сумму до $250,000 на одного вкладчика на один банк. Это не маркетинг конкретного банка — это федеральный закон, покрывающий все банки-члены FDIC.',
                'Практический вывод: если у тебя больше $250,000 наличными, есть смысл держать их в разных банках или разных категориях владения счёта, а не в одном месте — превышение лимита в моменте банкротства банка не гарантированно вернётся.',
              ]
          ).join('\n\n'),
      },
      {
        key: 'fico_factors',
        title: { ru: 'Кредитный рейтинг: из чего он реально считается', en: 'Credit score: what it actually is made of' },
        minutes: 4,
        source: 'CFPB',
        body: (_ctx, lang) =>
          (lang === 'en'
            ? [
                "A credit score (in the US, most often the FICO Score) isn't mysterious or a 'black box of fate' — it's a weighted formula of five specific factors, and the CFPB (Consumer Financial Protection Bureau) publishes their weights directly.",
                'Payment history — about 35% of the weight: did you pay on time. Credit utilization — about 30%: how much of your available limit you actually use (under 30% is noticeably better for your score). Length of credit history — about 15%. New credit applications — about 10%: many applications in a short period lowers your score. Credit mix — about 10%.',
                "Practical takeaway: two simple actions give the most impact — always pay on time, and never use more than 30% of your available card limit. That isn't a 'hack' — it's literally what the formula measures.",
              ]
            : [
                'Кредитный рейтинг (в США — чаще всего FICO Score) не мистика и не «чёрный ящик судьбы» — это взвешенная формула из пяти конкретных факторов, и CFPB (Consumer Financial Protection Bureau) прямо публикует их вес.',
                'История платежей — около 35% веса: платил ли ты вовремя. Использование кредита — около 30%: сколько от доступного лимита ты реально используешь (ниже 30% — заметно лучше для рейтинга). Длина кредитной истории — около 15%. Новые заявки на кредит — около 10%: много заявок за короткий срок снижает рейтинг. Разнообразие типов кредита — около 10%.',
                'Практический вывод: два простых действия дают больше всего эффекта — платить вовремя всегда и не использовать больше 30% доступного лимита по картам. Это не «хак», это буквально то, что измеряет формула.',
              ]
          ).join('\n\n'),
      },
      {
        key: 'apr_vs_interest',
        title: { ru: 'APR vs процентная ставка — это не одно и то же', en: 'APR vs interest rate — not the same thing' },
        minutes: 3,
        source: 'CFPB',
        body: (_ctx, lang) =>
          (lang === 'en'
            ? [
                'Lenders are legally required (Truth in Lending Act, enforced by the CFPB) to disclose APR — Annual Percentage Rate. This is not the same as the "interest rate" quoted to you verbally.',
                'The interest rate is only the price of the money itself. APR adds every mandatory loan fee, converted into an annualized percentage. That\'s why a loan advertised at "5% rate" with a large origination fee can carry a 7-8% APR — and APR is the honest number for comparing two offers.',
                'Practical takeaway: when comparing loans or credit cards, always look at APR, not the advertised rate — it\'s the one number the law requires every lender to calculate the same way.',
              ]
            : [
                'Банки обязаны по закону (Truth in Lending Act, регулируется CFPB) показывать APR — Annual Percentage Rate. Это не то же самое, что «процентная ставка», которую тебе называют на словах.',
                'Процентная ставка — это только цена самих денег. APR добавляет к ней все обязательные комиссии за выдачу кредита, пересчитанные в годовой процент. Поэтому кредит под «5% ставки» с крупной комиссией за оформление может иметь APR 7-8% — и именно APR — честное число для сравнения двух предложений.',
                'Практический вывод: при сравнении кредитов или кредитных карт всегда смотри на APR, а не на рекламную ставку — это единственная цифра, которую закон обязывает считать одинаково у всех кредиторов.',
              ]
          ).join('\n\n'),
      },
      {
        key: 'emergency_fund_cfpb',
        title: { ru: 'Экстренный фонд по методике CFPB — с чего начать, если денег нет вообще', en: 'An emergency fund the CFPB way — where to start with zero savings' },
        minutes: 4,
        source: 'CFPB Your Money, Your Goals',
        body: (ctx, lang) => {
          const needsTotal = Object.values(ctx.settings?.needs_budget || {}).reduce((s, v) => s + (v || 0), 0)
          const small = Math.max(25, Math.round(needsTotal * 0.02))
          if (lang === 'en') {
            return [
              'The CFPB\'s method for people with no savings at all doesn\'t start with "set aside 3 months of expenses" — that\'s discouraging. It starts with small, regular amounts: even $5-10 a week, kept separate from your main account so it isn\'t spent out of habit.',
              "The idea is that the first goal isn't an amount — it's the habit itself of regularly setting something aside. Only once the habit sticks does it make sense to build a full 3-month cushion of essential expenses.",
              needsTotal > 0
                ? `Your numbers: starting small, the CFPB benchmark is roughly ${fmt(small)}/week to begin with, kept separate from your main account.`
                : 'Fill in your essential expenses in settings — a CFPB-style starting amount will appear here.',
            ].join('\n\n')
          }
          return [
            'Методика CFPB для людей без накоплений вообще не начинается с «отложи 3 месячных расхода» — это обескураживает. Она начинается с «маленьких, но регулярных» сумм: даже $5–10 в неделю, отдельно от основного счёта, чтобы их не потратить по привычке.',
            'Идея в том, что первая цель — не сумма, а сама привычка регулярно откладывать хоть что-то. Только когда привычка закрепилась, имеет смысл считать полноценную подушку на 3 месяца обязательных трат.',
            needsTotal > 0
              ? `Твои цифры: если начать с малого, ориентир по методике CFPB — около ${fmt(small)} в неделю на старте, отдельно от основного счёта.`
              : 'Заполни обязательные траты в настройках — здесь появится стартовая сумма по методике CFPB.',
          ].join('\n\n')
        },
      },
    ],
    exam: {
      passPct: 70,
      questions: [
        {
          q: {
            ru: 'Если кассовый разрыв критичный (не хватает на обязательное), что стоит сделать в первую очередь?',
            en: "If your cash-flow gap is critical (not enough for essentials), what should you do first?",
          },
          options: {
            ru: ['Составить идеальный бюджет на год вперёд', 'Взять любой доступный доход (подработка) и связаться с кредиторами самому', 'Ничего не делать, дождаться улучшения', 'Сразу закрыть все долги с самой низкой суммой'],
            en: ['Build a perfect year-ahead budget', 'Take any available income (a side gig) and contact your creditors yourself', 'Do nothing and wait for things to improve', 'Immediately pay off all debts with the smallest balance'],
          },
          correct: 1,
          explain: {
            ru: 'В кризисном режиме порядок действий важнее идеальности: сначала любой доход и проактивный звонок кредиторам — это закрывает разрыв быстрее всего.',
            en: 'In crisis mode, the order of actions matters more than perfection: any income plus a proactive call to creditors closes the gap fastest.',
          },
        },
        {
          q: { ru: 'На какую сумму FDIC страхует депозиты одного вкладчика в одном банке?', en: 'How much does the FDIC insure per depositor, per bank?' },
          options: { ru: ['$50,000', '$100,000', '$250,000', 'Без ограничений'], en: ['$50,000', '$100,000', '$250,000', 'No limit'] },
          correct: 2,
          explain: {
            ru: 'FDIC страхует до $250,000 на вкладчика на банк — федеральный закон, а не маркетинг конкретного банка.',
            en: 'The FDIC insures up to $250,000 per depositor per bank — federal law, not marketing from any one bank.',
          },
        },
        {
          q: { ru: 'Какой фактор больше всего влияет на кредитный рейтинг FICO?', en: 'Which factor most affects a FICO credit score?' },
          options: {
            ru: ['Разнообразие типов кредита', 'История платежей (вовремя ли платил)', 'Количество новых заявок', 'Возраст заёмщика'],
            en: ['Credit mix', 'Payment history (paying on time)', 'Number of new applications', "Borrower's age"],
          },
          correct: 1,
          explain: {
            ru: 'История платежей — около 35% веса, самый значимый фактор.',
            en: "Payment history is about 35% of the weight — the single biggest factor.",
          },
        },
        {
          q: { ru: 'Какой процент от доступного кредитного лимита рекомендуется не превышать?', en: 'What percentage of your available credit limit is it recommended not to exceed?' },
          options: { ru: ['10%', '30%', '50%', '70%'], en: ['10%', '30%', '50%', '70%'] },
          correct: 1,
          explain: {
            ru: 'Использование кредита — около 30% веса рейтинга; ниже 30% от лимита заметно лучше для рейтинга.',
            en: 'Credit utilization is about 30% of the score weight; staying under 30% of your limit is noticeably better.',
          },
        },
        {
          q: { ru: 'Чем APR отличается от процентной ставки по кредиту?', en: 'How does APR differ from a loan\'s interest rate?' },
          options: {
            ru: ['Ничем, это синонимы', 'APR — это ставка только для ипотеки', 'APR включает обязательные комиссии за выдачу кредита, пересчитанные в годовой процент', 'APR всегда ниже процентной ставки'],
            en: ["They're the same thing", 'APR only applies to mortgages', 'APR includes mandatory loan fees converted into an annualized percentage', 'APR is always lower than the interest rate'],
          },
          correct: 2,
          explain: {
            ru: 'APR обязателен по Truth in Lending Act и включает комиссии — честное число для сравнения предложений.',
            en: "APR is required under the Truth in Lending Act and includes fees — the honest number for comparing offers.",
          },
        },
        {
          q: { ru: 'С чего методика CFPB предлагает начинать формирование накоплений человеку без сбережений?', en: 'Where does the CFPB method suggest starting savings for someone with none?' },
          options: {
            ru: ['Сразу откладывать 3 месячных расхода', 'С маленьких регулярных сумм, чтобы закрепить привычку', 'С покупки страхового полиса', 'С открытия брокерского счёта'],
            en: ['Immediately saving 3 months of expenses', 'With small, regular amounts to build the habit', 'By buying an insurance policy', 'By opening a brokerage account'],
          },
          correct: 1,
          explain: {
            ru: 'Методика CFPB начинается с малых регулярных сумм — цель на старте это привычка, а не размер подушки.',
            en: 'The CFPB method starts with small regular amounts — the initial goal is the habit, not the size of the cushion.',
          },
        },
      ],
    },
  },
  {
    key: 'how_money_works',
    title: { ru: 'Как реально работают деньги в экономике', en: 'How money actually works in the economy' },
    source: 'Federal Reserve Education (ФРС США)',
    sourceUrl: 'https://www.federalreserveeducation.org/',
    locked: false,
    unlockAfter: 'foundations',
    lessons: [
      {
        key: 'fed_dual_mandate',
        title: { ru: 'Зачем вообще существует ФРС', en: 'Why the Fed exists at all' },
        minutes: 4,
        source: 'Federal Reserve',
        body: (_ctx, lang) =>
          (lang === 'en'
            ? [
                "The Fed (Federal Reserve System) is the US central bank. It has two official mandates from Congress, both written into law: price stability (controlling inflation) and maximum employment. Everything else follows from those two goals.",
                "When the Fed raises rates, it deliberately makes borrowing more expensive — to cool demand and slow inflation. When it cuts rates, it stimulates the economy but risks pushing prices up. This isn't arbitrary — it's a direct tool aimed at a specific mandate.",
                "Practical takeaway: the headline 'the Fed raised rates' isn't abstract policy happening somewhere far away — it's the direct reason your mortgage, auto loan, or savings-account rate changes within a few months of the decision.",
              ]
            : [
                'ФРС (Federal Reserve System) — центральный банк США. У неё официально два мандата от Конгресса, оба закреплены законом: стабильность цен (контроль инфляции) и максимальная занятость. Всё остальное — производные от этих двух целей.',
                'Когда ФРС поднимает ставку, она делает кредиты дороже специально — чтобы охладить спрос и замедлить инфляцию. Когда снижает — стимулирует экономику, но рискует разогнать цены. Это не произвол, а прямой инструмент под конкретный мандат.',
                'Практический вывод: новости «ФРС подняла ставку» — это не абстрактная политика где-то далеко, это прямая причина, почему твоя ипотека, автокредит или ставка по сберегательному счёту меняются в течение нескольких месяцев после решения.',
              ]
          ).join('\n\n'),
      },
      {
        key: 'inflation_target',
        title: { ru: 'Инфляция: как её измеряют и почему цель именно 2%', en: 'Inflation: how it\'s measured, and why the target is 2%' },
        minutes: 4,
        source: 'Federal Reserve',
        body: (_ctx, lang) =>
          (lang === 'en'
            ? [
                "Inflation is measured through the Consumer Price Index (CPI) — a basket of typical goods and services whose prices are tracked monthly. The Fed officially targets 2% annual inflation as a 'healthy' level.",
                "Why not 0%? Because a small, predictable inflation rate gives companies and workers flexibility (wages and prices can rise without painful cuts elsewhere), while deflation (falling prices) has historically accompanied the worst economic crises — people delay purchases expecting things to get cheaper, and the economy stalls.",
                "Practical takeaway: if your income isn't growing at least 2% a year, you're gradually getting poorer in real terms — even without a single 'bad' month in your personal budget.",
              ]
            : [
                'Инфляция измеряется через индекс потребительских цен (CPI) — корзину типичных товаров и услуг, чья цена отслеживается каждый месяц. ФРС официально таргетирует 2% инфляции в год как «здоровый» уровень.',
                'Почему не 0%? Потому что небольшая предсказуемая инфляция даёт компаниям и работникам гибкость (зарплаты и цены могут расти без болезненных урезаний), а дефляция (падение цен) исторически связана с самыми тяжёлыми экономическими кризисами — люди откладывают покупки, ожидая, что будет ещё дешевле, и экономика замирает.',
                'Практический вывод: если твой доход не растёт хотя бы на 2% в год, ты постепенно беднеешь в реальном выражении — даже без единого «плохого» месяца в личном бюджете.',
              ]
          ).join('\n\n'),
      },
      {
        key: 'money_creation',
        title: { ru: 'Как банк «создаёт» деньги, когда выдаёт кредит', en: 'How a bank "creates" money when it makes a loan' },
        minutes: 5,
        source: 'Federal Reserve Bank of St. Louis / New York',
        body: (_ctx, lang) =>
          (lang === 'en'
            ? [
                "Intuition suggests a bank lends out money that already sits in deposits. That's only part of the truth. When a bank approves a loan, it creates a new deposit in the borrower's account — literally increasing the money supply in that moment, not just moving existing money around.",
                "This isn't unlimited: banks are constrained by capital requirements and oversight from the Fed and other regulators, not just by the volume of deposits they've already collected.",
                "Practical takeaway: understanding that loan money isn't 'someone else's saved-up savings,' but part of the economy's mechanism, helps explain why the money supply grows faster than seems logical at a household level.",
              ]
            : [
                'Интуиция подсказывает, что банк выдаёт кредит из уже существующих денег на депозитах. Это только часть правды. Когда банк одобряет кредит, он создаёт новый депозит на счету заёмщика — то есть буквально увеличивает денежную массу в моменте, а не просто перекладывает существующие деньги.',
                'Это не безграничный процесс: банки ограничены требованиями к капиталу и регулированием со стороны ФРС и других органов надзора, а не только объёмом уже собранных депозитов.',
                'Практический вывод: понимание, что кредитные деньги — это не «чьи-то отложенные сбережения», а часть механизма экономики, помогает не удивляться, почему объём денег в системе растёт быстрее, чем кажется логичным на бытовом уровне.',
              ]
          ).join('\n\n'),
      },
      {
        key: 'rate_transmission',
        title: { ru: 'Почему решение ФРС меняет твою ипотеку и вклад', en: 'Why a Fed decision changes your mortgage and your savings rate' },
        minutes: 4,
        source: 'Federal Reserve',
        body: (ctx, lang) => {
          const hasDebts = ctx.debts?.length > 0
          if (lang === 'en') {
            return [
              "The Fed directly controls only one rate — the federal funds rate, the rate banks charge each other overnight. But that rate is the foundation from which banks price everything else: mortgages, auto loans, savings-account rates, bond yields.",
              "The pass-through isn't instant — usually a few months — and different products react at different speeds: credit-card and new-loan rates move fast; rates on an already-issued fixed mortgage don't move at all (that's the whole point of a fixed rate).",
              hasDebts
                ? "Your numbers: you have debts — if any carry a variable rate, Fed changes hit your payment faster than they would a fixed mortgage."
                : "If you take out a loan in the future, the difference between a fixed and a variable rate is literally the question of whether your payment depends on Fed decisions or not.",
            ].join('\n\n')
          }
          return [
            'ФРС напрямую управляет только одной ставкой — federal funds rate, ставкой, по которой банки кредитуют друг друга овернайт. Но эта ставка — фундамент, от которого банки считают все остальные: ипотеку, автокредит, ставку по сберегательному счёту, доходность облигаций.',
            'Передача происходит не мгновенно — обычно несколько месяцев, и разные продукты реагируют с разной скоростью: ставки по кредитным картам и новым кредитам меняются быстрее, ставки по уже выданной фиксированной ипотеке — не меняются вообще (в этом и смысл фиксированной ставки).',
            hasDebts
              ? 'Твои цифры: у тебя есть долги — если среди них кредит с плавающей ставкой, изменения ФРС отражаются на твоём платеже быстрее, чем на фиксированной ипотеке.'
              : 'Если в будущем будешь брать кредит — разница между фиксированной и плавающей ставкой это буквально вопрос того, зависит ли твой платёж от решений ФРС или нет.',
          ].join('\n\n')
        },
      },
    ],
    exam: {
      passPct: 70,
      questions: [
        {
          q: { ru: 'Какие два официальных мандата у ФРС?', en: 'What are the Fed\'s two official mandates?' },
          options: {
            ru: ['Контроль курса доллара и цена на нефть', 'Стабильность цен и максимальная занятость', 'Регулирование фондового рынка и налогов', 'Печать денег и хранение золота'],
            en: ['Controlling the dollar exchange rate and oil prices', 'Price stability and maximum employment', 'Regulating the stock market and taxes', 'Printing money and holding gold'],
          },
          correct: 1,
          explain: {
            ru: 'Двойной мандат ФРС закреплён законом: стабильность цен (инфляция) и максимальная занятость.',
            en: "The Fed's dual mandate is set in law: price stability (inflation) and maximum employment.",
          },
        },
        {
          q: { ru: 'Какой годовой уровень инфляции ФРС официально таргетирует?', en: 'What annual inflation rate does the Fed officially target?' },
          options: { ru: ['0%', '2%', '5%', '10%'], en: ['0%', '2%', '5%', '10%'] },
          correct: 1,
          explain: {
            ru: '2% в год — официальная цель ФРС по инфляции, измеряемой через индекс потребительских цен (CPI).',
            en: "2% a year is the Fed's official inflation target, measured via the Consumer Price Index (CPI).",
          },
        },
        {
          q: { ru: 'Что происходит, когда банк выдаёт новый кредит?', en: 'What happens when a bank issues a new loan?' },
          options: {
            ru: ['Банк просто перекладывает чужие сбережения заёмщику', 'Банк создаёт новый депозит — увеличивает денежную массу в моменте', 'Деньги берутся напрямую из резервов ФРС', 'Ничего не меняется в объёме денег в системе'],
            en: ["The bank just passes someone else's savings to the borrower", 'The bank creates a new deposit — increasing the money supply in that moment', "Money comes directly from the Fed's reserves", 'The total money supply is unchanged'],
          },
          correct: 1,
          explain: {
            ru: 'Выдача кредита создаёт новый депозит — это увеличивает денежную массу, а не просто перераспределяет её.',
            en: 'Issuing a loan creates a new deposit — that increases the money supply rather than merely redistributing it.',
          },
        },
        {
          q: { ru: 'Ставка по какому продукту меняется быстрее всего вслед за решением ФРС?', en: 'Which product\'s rate changes fastest after a Fed decision?' },
          options: {
            ru: ['Уже выданная фиксированная ипотека', 'Кредитная карта / новый кредит', 'Ничего не меняется никогда', 'Только государственные облигации на 30 лет'],
            en: ['An already-issued fixed mortgage', 'A credit card / new loan', 'Nothing ever changes', 'Only 30-year government bonds'],
          },
          correct: 1,
          explain: {
            ru: 'Кредитные карты и новые кредиты реагируют быстро; уже выданная фиксированная ипотека — нет, в этом её смысл.',
            en: "Credit cards and new loans react quickly; an already-issued fixed mortgage doesn't — that's the whole point of a fixed rate.",
          },
        },
      ],
    },
  },
  {
    key: 'investing_foundations',
    title: { ru: 'Основы инвестирования', en: 'Investing foundations' },
    source: 'SEC Investor.gov · FINRA · Yale (Robert Shiller, «Financial Markets»)',
    sourceUrl: 'https://www.investor.gov/',
    locked: true,
    comingSoon: true,
    description: {
      ru: 'Риск и доходность, диверсификация, как устроены комиссии фондов, как распознать признаки мошенничества — по материалам официального инвест-образования SEC/FINRA и открытого курса Йельского университета «Financial Markets» нобелевского лауреата Роберта Шиллера.',
      en: "Risk and return, diversification, how fund fees work, and how to spot the signs of fraud — drawn from SEC/FINRA's official investor-education materials and Yale's open course \"Financial Markets\" by Nobel laureate Robert Shiller.",
    },
  },
  {
    key: 'professional',
    title: { ru: 'Профессиональный уровень', en: 'Professional level' },
    source: 'CFA Institute Curriculum · NASAA Series 65 · MIT Sloan (Finance Theory I) · Wharton',
    sourceUrl: 'https://www.cfainstitute.org/programs/cfa-program/curriculum',
    locked: true,
    comingSoon: true,
    description: {
      ru: 'Акции, облигации, деривативы, портфельный менеджмент и этика — по карте тем реальной программы CFA (Level I–III) и лицензионного экзамена Series 65, дополненные материалами MIT Sloan «Finance Theory I» и Wharton. Тот же корпус знаний, что у практикующих инвест-профессионалов — объяснённый по-человечески и проверенный настоящим экзаменом.',
      en: 'Stocks, bonds, derivatives, portfolio management, and ethics — mapped to the real CFA program curriculum (Levels I-III) and the Series 65 licensing exam, supplemented with MIT Sloan\'s "Finance Theory I" and Wharton materials. The same body of knowledge practicing investment professionals study — explained plainly and checked with a real exam.',
    },
  },
]

function examKey(userId, context, trackKey) {
  return `fintrack_exam_${userId}_${context}_${trackKey}`
}

export function getExamResult(userId, context, trackKey) {
  try {
    return JSON.parse(localStorage.getItem(examKey(userId, context, trackKey))) || null
  } catch {
    return null
  }
}

export function saveExamResult(userId, context, trackKey, result) {
  localStorage.setItem(examKey(userId, context, trackKey), JSON.stringify(result))
  return result
}

export function isTrackUnlocked(track, userId, context) {
  if (track.comingSoon) return false
  if (!track.unlockAfter) return true
  const prevResult = getExamResult(userId, context, track.unlockAfter)
  return Boolean(prevResult?.passed)
}

function courseCompletedKey(userId, context, trackKey) {
  return `fintrack_course_done_${userId}_${context}_${trackKey}`
}

export function getCompletedLessons(userId, context, trackKey) {
  try {
    return JSON.parse(localStorage.getItem(courseCompletedKey(userId, context, trackKey))) || []
  } catch {
    return []
  }
}

export function markLessonDone(userId, context, trackKey, lessonKey) {
  const done = getCompletedLessons(userId, context, trackKey)
  if (!done.includes(lessonKey)) {
    done.push(lessonKey)
    localStorage.setItem(courseCompletedKey(userId, context, trackKey), JSON.stringify(done))
  }
  return done
}
