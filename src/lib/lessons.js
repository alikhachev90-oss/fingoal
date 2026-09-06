// Financial-literacy lessons. Each one opens with a scene or story (not a
// bullet list of tips), draws out the mechanism behind it, and closes with a
// paragraph computed from the user's OWN numbers — so it reads as "this is
// about your money," not a generic finance blog post.

function fmt(n) {
  return '$' + Math.round(n || 0).toLocaleString('en-US')
}

export const LESSONS = [
  {
    key: 'rule_502030',
    title: { ru: 'Почему одинаковая зарплата даёт разные жизни', en: 'Why the same salary gives different lives' },
    minutes: 3,
    unlock: () => true,
    body: (ctx, lang) => {
      const needsTotal = Object.values(ctx.settings?.needs_budget || {}).reduce((s, v) => s + (v || 0), 0)
      const needsPct = ctx.monthlyIncome > 0 ? Math.round((needsTotal / ctx.monthlyIncome) * 100) : null
      if (lang === 'en') {
        return [
          `Take two people with the same salary. Ten years later, one owns an apartment and has a year's living expenses saved. The other has the same income, zero savings, and a growing credit limit. The difference is almost never how much they earned. It's where every dollar went first.`,
          `The 50/30/20 rule isn't about saving — it's about the order of operations. 50% of income covers Needs — the things life physically doesn't work without: housing, transport, food, health. 30% is Wants — everything that makes life pleasant but isn't essential. And only 20% is Savings — the one part that actually changes your trajectory over the years. The problem is most people run this in reverse — spend everything that "doesn't feel wasteful" first, then save whatever happens to be left. Usually that's zero.`,
          needsPct !== null
            ? `Your numbers: essential spending (Needs) is ${fmt(needsTotal)}/month, which is ${needsPct}% of your ${fmt(ctx.monthlyIncome)} income. ${needsPct > 50 ? "That's above the classic 50% — not a reason to panic, but a reason to first look for ways to cut this exact part (rent, insurance, plans) instead of nickel-and-diming your coffee." : "That fits the classic proportion — meaning you have real room for Savings; it's a matter of discipline, not a lack of money."}`
            : 'Fill in your income in settings — you\'ll see the math run on your own numbers here.',
        ].join('\n\n')
      }
      return [
        `Возьмите двух людей с одинаковой зарплатой. Через десять лет у одного — купленная квартира и подушка на год жизни. У другого — тот же доход, ноль накоплений и растущий кредитный лимит. Разница почти никогда не в том, сколько они зарабатывали. Она в том, куда уходил каждый доллар в первую очередь.`,
        `Правило 50/30/20 — это не про экономию, а про порядок действий. 50% дохода закрывают Needs — то, без чего жизнь физически не работает: жильё, транспорт, еда, здоровье. 30% — Wants, всё, что делает жизнь приятной, но необязательной. И только 20% — Savings: единственная часть, которая на самом деле меняет вашу траекторию через годы. Проблема в том, что у большинства людей порядок обратный — сначала тратится всё, что "не жалко", а откладывается то, что случайно осталось. Обычно это ноль.`,
        needsPct !== null
          ? `Твои цифры: обязательные траты (Needs) — ${fmt(needsTotal)} в месяц, это ${needsPct}% от дохода в ${fmt(ctx.monthlyIncome)}. ${needsPct > 50 ? 'Это выше классических 50% — не повод паниковать, но повод в первую очередь искать способ снизить именно эту часть (аренда, страховка, тарифы), а не резать себя по мелочам в кофе.' : 'Это укладывается в классическую пропорцию — значит, у вас есть реальное пространство для Savings, вопрос только в дисциплине, а не в нехватке денег.'}`
          : 'Заполни доход в настройках — и здесь появится расчёт именно по твоим цифрам.',
      ].join('\n\n')
    },
  },
  {
    key: 'emergency_fund',
    title: { ru: 'Человек, который платил сам себе первым', en: 'The man who paid himself first' },
    minutes: 4,
    unlock: ({ goals }) => !goals.some((g) => /подушк/i.test(g.name)),
    body: (ctx, lang) => {
      const needsTotal = Object.values(ctx.settings?.needs_budget || {}).reduce((s, v) => s + (v || 0), 0)
      const target = needsTotal * 3
      if (lang === 'en') {
        return [
          `One of the oldest finance parables (nearly a hundred years old) tells of a scribe named Arkad, no richer than his neighbors — until one day he noticed something simple: he'd spent his whole life paying everyone who billed him — his landlord, the merchant, the tailor — but never once paid himself. He started setting aside a tenth of his income before spending on anything else, and treated that debt to himself as more important than any other bill.`,
          `An emergency fund is the exact same principle applied to risk instead of growth. It's not an investment meant to earn returns — it's insurance against the fact that life is unpredictable: a lost paycheck, an urgent repair, a health emergency. Its only job is to buy you time to make calm decisions, instead of panicking into the first high-interest loan you find.`,
          needsTotal > 0
            ? `Your numbers: essential spending is ${fmt(needsTotal)}/month, so a 3-month cushion is ${fmt(target)}. It sounds like a lot, but this isn't "save it and forget it" — it's "save it once and never borrow in a panic again."`
            : 'Fill in your essential spending in settings — you\'ll see the exact size of your cushion here.',
        ].join('\n\n')
      }
      return [
        `Одна из старейших финансовых притч (ей почти сто лет) рассказывает о писце по имени Аркад, который жил не богаче своих соседей — пока однажды не заметил простую вещь: он всю жизнь платил каждому, кто выставлял ему счёт — хозяину дома, торговцу, портному — но ни разу не заплатил самому себе. Он начал откладывать десятую часть дохода до того, как тратил на что-либо ещё, и обращаться с этой частью так, будто долг перед ней важнее любого другого счёта.`,
        `Подушка безопасности — это ровно тот же принцип, применённый к рискам, а не к росту. Это не инвестиция, которая должна приносить доходность, а страховка от того, что жизнь непредсказуема: потеря дохода, срочный ремонт, форс-мажор со здоровьем. Её единственная задача — купить вам время принимать решения спокойно, а не в панике первого попавшегося кредита под высокий процент.`,
        needsTotal > 0
          ? `Твои цифры: обязательные траты — ${fmt(needsTotal)} в месяц, значит подушка на 3 месяца — это ${fmt(target)}. Звучит как много, но это не "накопить и забыть" — это "накопить один раз и никогда больше не занимать в панике".`
          : 'Заполни обязательные траты в настройках — здесь появится точная сумма твоей подушки.',
      ].join('\n\n')
    },
  },
  {
    key: 'debt_strategy',
    title: { ru: 'Снежный ком или лавина: как гасить несколько долгов', en: 'Snowball or avalanche: paying off multiple debts' },
    minutes: 3,
    unlock: ({ settings }) => settings?.has_debts,
    body: (ctx, lang) => {
      const debts = ctx.debts || []
      const sorted = [...debts].sort((a, b) => (b.rate || 0) - (a.rate || 0))
      const worst = sorted[0]
      if (lang === 'en') {
        return [
          `Imagine you have three debts at once: a credit card at 24%, an installment plan at 8%, and an interest-free loan from a friend. Where does the first extra dollar above minimum payments go? Most people intuitively pay off whichever debt feels "worse" emotionally — often the oldest or the largest — and lose real money doing it.`,
          `There are two systematic approaches. "Snowball" — pay off the smallest balance first, for a quick psychological win that keeps you from giving up halfway. "Avalanche" — pay off the highest interest rate first, which mathematically saves more money over time, because a high rate is exactly what eats you fastest. When rates differ a lot (like 24% vs 8% above), avalanche is almost always better in dollars; when rates are similar, the difference barely matters and you can pick snowball for the motivation.`,
          debts.length > 0
            ? `Your numbers: you have ${debts.length} debt${debts.length === 1 ? '' : 's'}${worst?.rate ? `, the highest rate is "${worst.name}" at ${worst.rate}% annual` : ''}. Under the avalanche method, any dollar above minimum payments on the rest should go there first.`
            : 'Add your debts in settings — you\'ll see exactly which one to start with here.',
        ].join('\n\n')
      }
      return [
        `Представьте, что у вас три долга одновременно: кредитка под 24%, рассрочка под 8% и заём другу без процента. Куда идёт первый лишний доллар сверх минимальных платежей? Большинство людей интуитивно гасят тот долг, который "неприятнее" морально — часто самый старый или самый крупный, — и теряют на этом реальные деньги.`,
        `Есть два системных подхода. «Снежный ком» — гасить сначала долг с наименьшим балансом, чтобы получить быструю психологическую победу и не сдаться на середине пути. «Лавина» — гасить сначала долг с самой высокой процентной ставкой, что математически экономит больше денег за всё время, потому что именно высокая ставка — это то, что съедает вас быстрее всего. Когда ставки сильно различаются (как в примере выше — 24% против 8%), лавина почти всегда выгоднее в деньгах; если ставки похожи, разница неважна и можно выбрать снежный ком ради мотивации.`,
        debts.length > 0
          ? `Твои цифры: у тебя ${debts.length} ${debts.length === 1 ? 'долг' : 'долга/долгов'}${worst?.rate ? `, самая высокая ставка — «${worst.name}» под ${worst.rate}% годовых` : ''}. По методу лавины именно на него должен идти любой доллар сверх минимальных платежей по остальным.`
          : 'Добавь долги в настройках — здесь появится расчёт, с какого долга начинать именно тебе.',
      ].join('\n\n')
    },
  },
  {
    key: 'goal_math',
    title: { ru: 'Откуда берётся «сколько откладывать в день»', en: 'Where "how much to save per day" comes from' },
    minutes: 3,
    unlock: ({ goals }) => goals.length > 0,
    body: (ctx, lang) => {
      const goal = ctx.goals?.[0]
      if (lang === 'en') {
        return [
          `Most people set a financial goal as a wish — "I want to save up for a car" — with no single number that can be checked tomorrow morning. A month later the wish turns into a vague sense of guilt, not a plan. The difference between a dream and a goal is a deadline and a breakdown into today's action.`,
          `The mechanics are simple: the remaining amount is divided by the days left until the deadline — that's the daily amount. Add that to your daily Needs and you get the "required daily income." If your actual daily income is below that, there's your gap — and it has only two honest fixes: push the deadline, or cut Wants. Needs and the goal itself can't be trimmed — otherwise it isn't a goal anymore, it's self-deception.`,
          goal
            ? `Your numbers: the goal "${goal.name}" for ${fmt(goal.target_amount)} — the app has already calculated the exact daily amount and required income for it. Check the Goals tab if you haven't looked at the current gap in a while.`
            : 'Create a goal — you\'ll see the math run on its real numbers here.',
        ].join('\n\n')
      }
      return [
        `Большинство людей ставят финансовую цель как желание — «хочу накопить на машину» — без единого числа, которое можно проверить завтра утром. Через месяц желание превращается в смутное чувство вины, а не в план. Разница между мечтой и целью — это дедлайн и разбивка на действие сегодняшнего дня.`,
        `Механика проста: остаток до цели делится на количество дней до дедлайна — это сумма в день. Дальше эта сумма складывается с вашими Needs в пересчёте на день — получается «требуемый доход в день». Если ваш фактический доход в день ниже требуемого — вот он, разрыв, и у него есть только два честных решения: сдвинуть дедлайн или сократить Wants. Needs и саму цель урезать нельзя — иначе это уже не цель, а самообман.`,
        goal
          ? `Твои цифры: цель «${goal.name}» на ${fmt(goal.target_amount)} — калькулятор в приложении уже посчитал точную сумму в день и требуемый доход именно под неё. Загляни на вкладку «Цели», если давно не проверял(а) актуальный разрыв.`
          : 'Создай цель — здесь появится расчёт по её реальным цифрам.',
      ].join('\n\n')
    },
  },
  {
    key: 'wants_tracking',
    title: { ru: 'Эффект тысячи порезов', en: 'Death by a thousand cuts' },
    minutes: 2,
    unlock: ({ transactions }) => transactions.filter((t) => t.group === 'wants').length >= 5,
    body: (ctx, lang) => {
      const now = new Date()
      const monthWants = (ctx.transactions || []).filter((t) => {
        const d = new Date(t.date)
        return t.group === 'wants' && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
      })
      const total = monthWants.reduce((s, t) => s + t.amount, 0)
      if (lang === 'en') {
        return [
          `You remember your rent down to the dollar — it's one big charge, once a month. But coffee on the way to work, delivery instead of cooking, one more "let's try it" subscription — each one is too small to remember, yet together they form "death by a thousand cuts": no single wound is fatal, but the blood loss is real.`,
          `That's exactly why Wants aren't spending you need to ban — they're spending you need to SEE at the moment of the decision. Not after the fact at month's end when it's too late, but right at the moment of payment — with a concrete price in days until your goal, not an abstract percentage.`,
          `Your numbers: this month Wants already add up to ${fmt(total)} across ${monthWants.length} purchase${monthWants.length === 1 ? '' : 's'}. None of them looked critical on its own — that's the whole mechanism.`,
        ].join('\n\n')
      }
      return [
        `Аренду вы помните до доллара — она одна, крупная и приходит раз в месяц. А вот кофе по дороге на работу, доставка вместо готовки, ещё одна подписка "на попробовать" — каждая трата слишком мелкая, чтобы её запомнить, но вместе они формируют «эффект тысячи порезов»: ни одна рана не смертельна, а кровопотеря реальна.`,
        `Именно поэтому Wants — это не траты, которые нужно запретить, а траты, которые нужно ВИДЕТЬ в моменте принятия решения. Не постфактум в конце месяца, когда уже поздно, а прямо в моменте оплаты — с конкретной ценой в днях до вашей цели, а не в абстрактных процентах.`,
        `Твои цифры: в этом месяце Wants уже набежали на ${fmt(total)} за ${monthWants.length} ${monthWants.length === 1 ? 'покупку' : 'покупок'}. Ни одна из них по отдельности не выглядела критичной — в этом и есть весь механизм.`,
      ].join('\n\n')
    },
  },
  {
    key: 'lifestyle_creep',
    title: { ru: 'Куда исчезает каждая прибавка к зарплате', en: 'Where every raise disappears to' },
    minutes: 3,
    unlock: ({ monthTx, monthlyIncome }) => monthlyIncome > 0 && monthTx.wants > monthlyIncome * 0.3,
    body: (ctx, lang) => {
      const pct = ctx.monthlyIncome > 0 ? Math.round((ctx.monthTx.wants / ctx.monthlyIncome) * 100) : 0
      if (lang === 'en') {
        return [
          `A classic career pattern: income grows every couple of years, but there's never more spare cash at month's end. It's not that the new spending is unnecessary — the bigger apartment, the new car, the upgraded subscriptions don't happen because you decided to save less; they happen because the new spending level started feeling normal before you noticed. That's lifestyle creep — a lifestyle inflation that rises in lockstep with income and eats exactly the part that was supposed to go to Savings.`,
          `The difference between someone who ends up building wealth and someone who doesn't is almost never salary size. It's one simple rule: route a fixed percentage of EVERY raise into Savings before the new income level has a chance to become the new normal spending level.`,
          `Your numbers: this month Wants already made up ${pct}% of income — noticeably above the standard 30%. That's not always bad (sometimes it's a one-off month with gifts or a trip), but it's worth asking yourself for a second: is this a one-time exception, or the new normal?`,
        ].join('\n\n')
      }
      return [
        `Классический паттерн карьеры: доход растёт каждые пару лет, а свободных денег в конце месяца не прибавляется. Дело не в том, что расходы обязательны — большая квартира, новая машина, апгрейд подписок происходят не потому, что вы решили копить меньше, а потому, что новый уровень трат стал казаться нормой раньше, чем вы это заметили. Это и называется lifestyle creep — инфляция образа жизни, которая растёт синхронно с доходом и съедает именно ту часть, которая должна была пойти в Savings.`,
        `Разница между тем, кто в итоге строит капитал, и тем, кто нет — почти никогда не в размере зарплаты. Она в одном простом правиле: направлять в Savings фиксированный процент от КАЖДОЙ прибавки, прежде чем новый уровень дохода успеет стать привычным уровнем трат.`,
        `Твои цифры: в этом месяце Wants уже составили ${pct}% от дохода — заметно выше стандартных 30%. Это не всегда плохо (иногда это разовый месяц с подарками или поездкой), но стоит на секунду задать себе вопрос: это разовое исключение или новый привычный уровень?`,
      ].join('\n\n')
    },
  },
]

export function getLessonsWithStatus({ settings, debts = [], goals = [], transactions = [], lang = 'ru' }) {
  const now = new Date()
  const monthTxList = transactions.filter((t) => {
    const d = new Date(t.date)
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
  })
  const monthTx = { wants: monthTxList.filter((t) => t.group === 'wants').reduce((s, t) => s + t.amount, 0) }

  const ctx = { settings, debts, goals, transactions, monthTx, monthlyIncome: settings?.monthly_income || 0 }

  return LESSONS.map((lesson) => ({
    ...lesson,
    title: lesson.title[lang] || lesson.title.ru,
    unlocked: Boolean(lesson.unlock(ctx)),
    body: lesson.body(ctx, lang),
  }))
}
