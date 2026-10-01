// "Больше зарабатывать" — the income half of the system. Cutting spending
// has a floor; income doesn't. Each item is one concrete move with a link to
// the official place to do it. US-specific on purpose: that's where the app's
// people live and get paid.

export const EARN_MORE = [
  {
    key: 'eitc',
    tag: 'tax',
    title: { ru: 'Налоговый кредит EITC — деньги, которые многие не забирают', en: 'EITC — money many people never claim', es: "EITC: dinero que mucha gente nunca reclama", fr: "EITC : de l’argent que beaucoup ne réclament jamais" },
    body: {
      ru: 'Если ты работаешь и доход небольшой или средний, налоговая может вернуть до нескольких тысяч долларов — даже если налог ты не должен. По данным IRS, примерно каждый пятый, кому он положен, его не получает. Проверка занимает 10 минут.',
      en: 'If you work on a low-to-moderate income, the IRS can pay you up to several thousand dollars — even if you owe no tax. The IRS says about one in five eligible workers never claim it. Checking takes 10 minutes.', es: "Si trabajas con ingresos bajos o medios, el IRS puede pagarte hasta varios miles de dólares, aunque no debas impuestos. Según el IRS, uno de cada cinco trabajadores con derecho nunca lo reclama. Verificarlo toma 10 minutos.", fr: "Si tu travailles avec un revenu faible ou moyen, l’IRS peut te verser jusqu’à plusieurs milliers de dollars — même sans impôt à payer. Selon l’IRS, un travailleur éligible sur cinq ne le réclame jamais. Vérifier prend 10 minutes.",
    },
    cta: { ru: 'Проверить на сайте IRS', en: 'Check on the IRS site', es: "Verificar en el sitio del IRS", fr: "Vérifier sur le site de l’IRS" },
    href: 'https://www.irs.gov/credits-deductions/individuals/earned-income-tax-credit/use-the-eitc-assistant',
  },
  {
    key: 'vita',
    tag: 'tax',
    title: { ru: 'Бесплатно подать налоги через VITA', en: 'File your taxes free with VITA', es: "Declara tus impuestos gratis con VITA", fr: "Déclare tes impôts gratuitement avec VITA" },
    body: {
      ru: 'Программа IRS с волонтёрами: при небольшом доходе декларацию заполнят бесплатно и проверят все вычеты. Не отдавай $200 платным конторам.',
      en: 'An IRS volunteer program: on a modest income they prepare your return free and check every credit. No need to pay a tax shop $200.', es: "Un programa de voluntarios del IRS: con ingresos modestos preparan tu declaración gratis y revisan cada crédito. No hace falta pagarle $200 a una oficina de impuestos.", fr: "Un programme de bénévoles de l’IRS : avec un revenu modeste, ils préparent ta déclaration gratuitement et vérifient chaque crédit. Inutile de payer 200 $ à un cabinet.",
    },
    cta: { ru: 'Найти пункт VITA', en: 'Find a VITA site', es: "Buscar un sitio VITA", fr: "Trouver un site VITA" },
    href: 'https://www.irs.gov/individuals/free-tax-return-preparation-for-qualifying-taxpayers',
  },
  {
    key: 'refund_split',
    tag: 'tax',
    title: { ru: 'Раздели налоговый возврат', en: 'Split your tax refund', es: "Divide tu reembolso de impuestos", fr: "Répartis ton remboursement d’impôt" },
    body: {
      ru: 'Форма 8888 отправляет часть возврата сразу на сберегательный счёт — деньги попадают в подушку до того, как их захочется потратить. Форма появилась после исследований Гарварда.',
      en: 'Form 8888 sends part of your refund straight to a savings account — it lands in your cushion before you’re tempted to spend it. The form came out of Harvard research.', es: "El formulario 8888 envía parte de tu reembolso directo a una cuenta de ahorro: llega a tu colchón antes de que te tiente gastarlo. Nació de una investigación de Harvard.", fr: "Le formulaire 8888 envoie une partie de ton remboursement directement sur un compte épargne — il arrive dans ton coussin avant que tu sois tenté de le dépenser. Il est né de recherches de Harvard.",
    },
    cta: { ru: 'Про форму 8888', en: 'About Form 8888', es: "Sobre el formulario 8888", fr: "À propos du formulaire 8888" },
    href: 'https://www.irs.gov/forms-pubs/about-form-8888',
  },
  {
    key: 'self_employed_tax',
    tag: 'tax',
    title: { ru: 'Получаешь наличными или чеками — откладывай на налог', en: 'Paid in cash or checks? Set tax aside', es: "¿Te pagan en efectivo o cheque? Aparta para impuestos", fr: "Payé en espèces ou chèques ? Mets de côté pour l’impôt" },
    body: {
      ru: 'С дохода без удержаний налог никто не снял. Откладывай 25–30% каждой выплаты в отдельную копилку, иначе в апреле придёт один большой счёт. Оценку можно посчитать прямо в приложении.',
      en: 'Nobody withheld tax from income paid without withholding. Put 25–30% of every payment into its own pot, or April brings one big bill. You can estimate it right in the app.', es: "A los ingresos sin retención nadie les quitó impuestos. Aparta el 25–30% de cada pago en un fondo propio, o en abril llegará una sola cuenta grande. Puedes estimarlo en la app.", fr: "Personne n’a prélevé d’impôt sur un revenu versé sans retenue. Mets 25–30 % de chaque paiement dans une cagnotte à part, sinon avril t’apportera une grosse facture. Tu peux l’estimer dans l’app.",
    },
    cta: { ru: 'Посчитать налог', en: 'Estimate my tax', es: "Estimar mi impuesto", fr: "Estimer mon impôt" },
    to: '/taxes',
  },
  {
    key: 'benefits',
    tag: 'help',
    title: { ru: 'Проверь, какие льготы тебе положены', en: 'See which benefits you qualify for', es: "Mira a qué beneficios tienes derecho", fr: "Vois à quelles aides tu as droit" },
    body: {
      ru: 'Помощь с едой, медстраховкой, коммуналкой, детским садом — часть программ люди просто не знают. Официальный поиск по всем программам США.',
      en: 'Help with food, health coverage, utilities, childcare — people often don’t know these exist. The official search across US programs.', es: "Ayuda con comida, seguro médico, servicios, guardería: mucha gente no sabe que existen. El buscador oficial de programas de EE. UU.", fr: "Aide pour l’alimentation, la santé, les factures, la garde d’enfants — beaucoup ignorent qu’elles existent. La recherche officielle des programmes américains.",
    },
    cta: { ru: 'Открыть USA.gov', en: 'Open USA.gov', es: "Abrir USA.gov", fr: "Ouvrir USA.gov" },
    href: 'https://www.usa.gov/benefits',
  },
  {
    key: 'raise',
    tag: 'work',
    title: { ru: 'Попроси повышение — с цифрами', en: 'Ask for a raise — with numbers', es: "Pide un aumento, con números", fr: "Demande une augmentation — chiffres à l’appui" },
    body: {
      ru: 'Узнай рыночную ставку своей профессии, запиши 3 конкретных результата за последние полгода и назови сумму первым. Одна прибавка часто даёт больше, чем год экономии на кофе.',
      en: 'Look up the market rate for your job, write down 3 concrete results from the last six months, and name a number first. One raise often beats a year of skipped coffees.', es: "Averigua el sueldo de mercado de tu trabajo, anota 3 resultados concretos de los últimos seis meses y di una cifra primero. Un aumento suele valer más que un año sin cafés.", fr: "Renseigne-toi sur le salaire du marché pour ton poste, note 3 résultats concrets des six derniers mois et annonce un chiffre en premier. Une augmentation vaut souvent plus qu’un an sans cafés.",
    },
    cta: { ru: 'Зарплаты по профессиям (BLS)', en: 'Pay by occupation (BLS)', es: "Salarios por ocupación (BLS)", fr: "Salaires par métier (BLS)" },
    href: 'https://www.bls.gov/ooh/',
  },
  {
    key: 'raise_to_savings',
    tag: 'work',
    title: { ru: 'Прибавку — сразу наполовину в копилку', en: 'Send half of every raise to savings', es: "Manda la mitad de cada aumento al ahorro", fr: "Envoie la moitié de chaque augmentation à l’épargne" },
    body: {
      ru: 'Когда доход растёт, подними процент «Сначала себе» в тот же день. Ты не почувствуешь потери, потому что этих денег у тебя ещё не было — так сбережения выросли с 3.5% до 13.6% в программе «Сохрани больше завтра».',
      en: 'When income goes up, raise your pay-yourself-first rate the same day. It won’t feel like a loss because you never had that money — that’s how savings rose from 3.5% to 13.6% in Save More Tomorrow.', es: "Cuando suba tu ingreso, sube tu % de «Págate primero» ese mismo día. No lo sentirás como pérdida porque nunca tuviste ese dinero: así el ahorro pasó del 3.5% al 13.6% en Save More Tomorrow.", fr: "Quand ton revenu augmente, monte ton taux « Payez-vous d’abord » le jour même. Ce ne sera pas une perte, tu n’avais jamais eu cet argent — c’est ainsi que l’épargne est passée de 3,5 % à 13,6 % avec Save More Tomorrow.",
    },
  },
  {
    key: 'side_skill',
    tag: 'work',
    title: { ru: 'Подработка на том, что уже умеешь', en: 'Side work with the skills you have', es: "Trabajos extra con lo que ya sabes hacer", fr: "Petits boulots avec ce que tu sais déjà faire" },
    body: {
      ru: 'Мелкий ремонт, сборка мебели, покраска, переезды, уборка — такие заказы берут в выходные через Thumbtack или TaskRabbit. Пара заказов в месяц — это +$200–500 прямо в текущий шаг Пути.',
      en: 'Small repairs, furniture assembly, painting, moving, cleaning — weekend jobs through Thumbtack or TaskRabbit. A couple a month is +$200–500 straight into your current Path step.', es: "Reparaciones pequeñas, armado de muebles, pintura, mudanzas, limpieza: trabajos de fin de semana por Thumbtack o TaskRabbit. Un par al mes son +$200–500 directo a tu paso actual del Camino.", fr: "Petites réparations, montage de meubles, peinture, déménagements, ménage — des missions du week-end via Thumbtack ou TaskRabbit. Deux par mois, c’est +200–500 $ directement dans ton étape du Chemin.",
    },
  },
  {
    key: 'sell',
    tag: 'quick',
    title: { ru: 'Продай то, чем не пользуешься', en: 'Sell what you don’t use', es: "Vende lo que no usas", fr: "Vends ce que tu n’utilises pas" },
    body: {
      ru: 'Инструменты, техника, одежда — всё, что лежит больше года. Facebook Marketplace и OfferUp: быстрые деньги на стартовую подушку за один вечер.',
      en: 'Tools, electronics, clothes — anything untouched for a year. Facebook Marketplace and OfferUp: quick money for your starter cushion in one evening.', es: "Herramientas, electrónicos, ropa: todo lo que lleva un año sin usarse. Facebook Marketplace y OfferUp: dinero rápido para tu colchón inicial en una tarde.", fr: "Outils, électronique, vêtements — tout ce qui dort depuis un an. Facebook Marketplace et OfferUp : de l’argent rapide pour ton coussin de départ en une soirée.",
    },
  },
]
