// "Больше зарабатывать" — the income half of the system. Cutting spending
// has a floor; income doesn't. Each item is one concrete move with a link to
// the official place to do it. US-specific on purpose: that's where the app's
// people live and get paid.

export const EARN_MORE = [
  {
    key: 'eitc',
    tag: 'tax',
    title: { ru: 'Налоговый кредит EITC — деньги, которые многие не забирают', en: 'EITC — money many people never claim' },
    body: {
      ru: 'Если ты работаешь и доход небольшой или средний, налоговая может вернуть до нескольких тысяч долларов — даже если налог ты не должен. По данным IRS, примерно каждый пятый, кому он положен, его не получает. Проверка занимает 10 минут.',
      en: 'If you work on a low-to-moderate income, the IRS can pay you up to several thousand dollars — even if you owe no tax. The IRS says about one in five eligible workers never claim it. Checking takes 10 minutes.',
    },
    cta: { ru: 'Проверить на сайте IRS', en: 'Check on the IRS site' },
    href: 'https://www.irs.gov/credits-deductions/individuals/earned-income-tax-credit/use-the-eitc-assistant',
  },
  {
    key: 'vita',
    tag: 'tax',
    title: { ru: 'Бесплатно подать налоги через VITA', en: 'File your taxes free with VITA' },
    body: {
      ru: 'Программа IRS с волонтёрами: при небольшом доходе декларацию заполнят бесплатно и проверят все вычеты. Не отдавай $200 платным конторам.',
      en: 'An IRS volunteer program: on a modest income they prepare your return free and check every credit. No need to pay a tax shop $200.',
    },
    cta: { ru: 'Найти пункт VITA', en: 'Find a VITA site' },
    href: 'https://www.irs.gov/individuals/free-tax-return-preparation-for-qualifying-taxpayers',
  },
  {
    key: 'refund_split',
    tag: 'tax',
    title: { ru: 'Раздели налоговый возврат', en: 'Split your tax refund' },
    body: {
      ru: 'Форма 8888 отправляет часть возврата сразу на сберегательный счёт — деньги попадают в подушку до того, как их захочется потратить. Форма появилась после исследований Гарварда.',
      en: 'Form 8888 sends part of your refund straight to a savings account — it lands in your cushion before you’re tempted to spend it. The form came out of Harvard research.',
    },
    cta: { ru: 'Про форму 8888', en: 'About Form 8888' },
    href: 'https://www.irs.gov/forms-pubs/about-form-8888',
  },
  {
    key: 'self_employed_tax',
    tag: 'tax',
    title: { ru: 'Получаешь наличными или чеками — откладывай на налог', en: 'Paid in cash or checks? Set tax aside' },
    body: {
      ru: 'С дохода без удержаний налог никто не снял. Откладывай 25–30% каждой выплаты в отдельную копилку, иначе в апреле придёт один большой счёт. Оценку можно посчитать прямо в приложении.',
      en: 'Nobody withheld tax from income paid without withholding. Put 25–30% of every payment into its own pot, or April brings one big bill. You can estimate it right in the app.',
    },
    cta: { ru: 'Посчитать налог', en: 'Estimate my tax' },
    to: '/taxes',
  },
  {
    key: 'benefits',
    tag: 'help',
    title: { ru: 'Проверь, какие льготы тебе положены', en: 'See which benefits you qualify for' },
    body: {
      ru: 'Помощь с едой, медстраховкой, коммуналкой, детским садом — часть программ люди просто не знают. Официальный поиск по всем программам США.',
      en: 'Help with food, health coverage, utilities, childcare — people often don’t know these exist. The official search across US programs.',
    },
    cta: { ru: 'Открыть USA.gov', en: 'Open USA.gov' },
    href: 'https://www.usa.gov/benefits',
  },
  {
    key: 'raise',
    tag: 'work',
    title: { ru: 'Попроси повышение — с цифрами', en: 'Ask for a raise — with numbers' },
    body: {
      ru: 'Узнай рыночную ставку своей профессии, запиши 3 конкретных результата за последние полгода и назови сумму первым. Одна прибавка часто даёт больше, чем год экономии на кофе.',
      en: 'Look up the market rate for your job, write down 3 concrete results from the last six months, and name a number first. One raise often beats a year of skipped coffees.',
    },
    cta: { ru: 'Зарплаты по профессиям (BLS)', en: 'Pay by occupation (BLS)' },
    href: 'https://www.bls.gov/ooh/',
  },
  {
    key: 'raise_to_savings',
    tag: 'work',
    title: { ru: 'Прибавку — сразу наполовину в копилку', en: 'Send half of every raise to savings' },
    body: {
      ru: 'Когда доход растёт, подними процент «Сначала себе» в тот же день. Ты не почувствуешь потери, потому что этих денег у тебя ещё не было — так сбережения выросли с 3.5% до 13.6% в программе «Сохрани больше завтра».',
      en: 'When income goes up, raise your pay-yourself-first rate the same day. It won’t feel like a loss because you never had that money — that’s how savings rose from 3.5% to 13.6% in Save More Tomorrow.',
    },
  },
  {
    key: 'side_skill',
    tag: 'work',
    title: { ru: 'Подработка на том, что уже умеешь', en: 'Side work with the skills you have' },
    body: {
      ru: 'Мелкий ремонт, сборка мебели, покраска, переезды, уборка — такие заказы берут в выходные через Thumbtack или TaskRabbit. Пара заказов в месяц — это +$200–500 прямо в текущий шаг Пути.',
      en: 'Small repairs, furniture assembly, painting, moving, cleaning — weekend jobs through Thumbtack or TaskRabbit. A couple a month is +$200–500 straight into your current Path step.',
    },
  },
  {
    key: 'sell',
    tag: 'quick',
    title: { ru: 'Продай то, чем не пользуешься', en: 'Sell what you don’t use' },
    body: {
      ru: 'Инструменты, техника, одежда — всё, что лежит больше года. Facebook Marketplace и OfferUp: быстрые деньги на стартовую подушку за один вечер.',
      en: 'Tools, electronics, clothes — anything untouched for a year. Facebook Marketplace and OfferUp: quick money for your starter cushion in one evening.',
    },
  },
]
