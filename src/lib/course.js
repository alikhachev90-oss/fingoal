import { tr } from './tr.js'

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
  // First: the why. Not "you're in trouble" — for anyone, from a house
  // cleaner to a business owner, the case for knowing where money goes.
  {
    key: 'why_control',
    title: {"ru": "Зачем вообще контролировать деньги", "en": "Why take control of your money at all", "es": "Para qué controlar tu dinero", "fr": "Pourquoi maîtriser son argent"},
    source: 'Science · NBER · Psychological Bulletin · Journal of Consumer Research',
    sourceUrl: 'https://gflec.org/',
    locked: false,
    lessons: [
      {
        key: 'why_leaks',
        title: {"ru": "Деньги утекают не там, где ты думаешь", "en": "Money leaks where you don't expect", "es": "El dinero se escapa donde no lo esperas", "fr": "L’argent fuit là où tu ne l’attends pas"},
        minutes: 3,
        source: "Sussman & Alter, Journal of Consumer Research (2012)",
        body: (ctx, lang) => {
          const needs = Object.values(ctx.settings?.needs_budget || {}).reduce((s, v) => s + (Number(v) || 0), 0)
          const paras = tr(lang, {"ru": ["Спроси любого, сколько он тратит в месяц, — назовёт аренду, машину, продукты. И почти всегда ошибётся в меньшую сторону. Дело не в глупости: так устроена память.", "Исследователи Сассман и Альтер (Journal of Consumer Research, 2012) показали: люди недооценивают свои траты, потому что считают многие покупки «исключением» — подарок, ремонт, ужин по поводу, срочная поездка. Каждая кажется разовой. Но «разовые» траты случаются каждый месяц — просто каждый раз разные.", "Без записи голова помнит крупное и регулярное и теряет мелкое и «особенное». А именно там и утекает разница между «вроде нормально зарабатываю» и «куда всё делось»."], "en": ["Ask anyone how much they spend a month and they’ll name rent, the car, groceries — and almost always guess too low. It isn’t carelessness: that’s how memory works.", "Researchers Sussman and Alter (Journal of Consumer Research, 2012) showed that people underestimate their spending because they file many purchases as “exceptions” — a gift, a repair, a celebration dinner, an urgent trip. Each one feels one-off. But one-off costs happen every month — they’re just different every time.", "Without a record, your head remembers the big, regular bills and loses the small and “special” ones. That’s exactly where the gap leaks out between “I earn decently” and “where did it all go?”"], "es": ["Pregúntale a cualquiera cuánto gasta al mes: nombrará la renta, el coche, la comida… y casi siempre se quedará corto. No es descuido: así funciona la memoria.", "Los investigadores Sussman y Alter (Journal of Consumer Research, 2012) mostraron que subestimamos lo que gastamos porque vemos muchas compras como «excepciones»: un regalo, una reparación, una cena especial, un viaje urgente. Cada una parece única. Pero los gastos «únicos» ocurren todos los meses; solo que cada vez son distintos.", "Sin registro, la cabeza recuerda lo grande y fijo y pierde lo pequeño y «especial». Justo ahí se escapa la diferencia entre «gano bien» y «¿adónde se fue todo?»."], "fr": ["Demande à n’importe qui combien il dépense par mois : il citera le loyer, la voiture, les courses — et se trompera presque toujours à la baisse. Ce n’est pas de la négligence : c’est ainsi que fonctionne la mémoire.", "Les chercheurs Sussman et Alter (Journal of Consumer Research, 2012) ont montré qu’on sous-estime ses dépenses parce qu’on range beaucoup d’achats parmi les « exceptions » — un cadeau, une réparation, un dîner de fête, un voyage urgent. Chacun semble ponctuel. Mais des dépenses « ponctuelles », il y en a chaque mois — simplement jamais les mêmes.", "Sans trace écrite, la tête retient le gros et le régulier, et perd le petit et « l’exceptionnel ». C’est précisément là que fuit l’écart entre « je gagne correctement » et « où est passé tout l’argent ? »"]})
          const mine = needs > 0 ? tr(lang, { ru: `Твои цифры: обязательные траты — ${fmt(needs)}/мес. Всё, что сверх этого, и есть зона, где деньги утекают незаметно. Записывай её неделю — и увидишь сам.`, en: `Your numbers: essentials come to ${fmt(needs)}/month. Everything beyond that is the zone where money slips away unnoticed. Log it for a week and you’ll see for yourself.`, es: `Tus números: lo esencial suma ${fmt(needs)}/mes. Todo lo que pasa de ahí es la zona donde el dinero se escapa sin que lo notes. Regístralo una semana y lo verás tú mismo.`, fr: `Tes chiffres : l’essentiel représente ${fmt(needs)}/mois. Tout ce qui dépasse, c’est la zone où l’argent file sans qu’on le voie. Note-la une semaine et tu verras par toi-même.` }) : ''
          return [...paras, mine].filter(Boolean).join('\n\n')
        },
      },
      {
        key: 'why_not_poverty',
        title: {"ru": "Это не про бедность. Это про управление", "en": "It's not about being poor. It's about managing", "es": "No se trata de ser pobre, sino de administrar", "fr": "Ce n’est pas une question de pauvreté, mais de gestion"},
        minutes: 4,
        source: "LendingClub/PYMNTS · Carlson, Kim, Lusardi & Camerer (NBER, 2015) · Stanley & Danko",
        body: (_ctx, lang) => tr(lang, {"ru": ["Кажется, что следить за деньгами нужно тем, у кого их мало. Цифры говорят обратное.", "По данным LendingClub и PYMNTS, примерно 4 из 10 американцев с доходом выше $100 000 в год живут от зарплаты до зарплаты. Исследование Карлсона, Ким, Лусарди и Камерера (NBER, 2015): около 16% игроков NFL объявляют банкротство в течение 12 лет после карьеры — заработав в среднем миллионы. Большой доход не защищает. Он просто делает ошибки дороже.", "А в книге «Миллионер по соседству» Стэнли и Данко показали обратную сторону: типичный миллионер — учитель, инженер, владелец небольшого бизнеса, который годами живёт чуть ниже своих возможностей. Закон один и для уборщицы, и для бизнесмена: решает не размер дохода, а разница между доходом и тратами — и куда она идёт."], "en": ["It feels like watching your money is for people who don’t have much. The numbers say otherwise.", "According to LendingClub and PYMNTS, roughly 4 in 10 Americans earning over $100,000 a year live paycheck to paycheck. A study by Carlson, Kim, Lusardi and Camerer (NBER, 2015) found about 16% of NFL players file for bankruptcy within 12 years of retiring — after earning millions on average. A big income doesn’t protect you. It just makes mistakes more expensive.", "And in “The Millionaire Next Door,” Stanley and Danko showed the flip side: the typical millionaire is a teacher, an engineer, a small-business owner who spent years living a little below their means. The rule is the same for a house cleaner and a CEO: what decides it isn’t the size of the income, but the gap between income and spending — and where that gap goes."], "es": ["Parece que cuidar el dinero es cosa de quien tiene poco. Los números dicen lo contrario.", "Según LendingClub y PYMNTS, cerca de 4 de cada 10 estadounidenses que ganan más de $100,000 al año viven al día. Un estudio de Carlson, Kim, Lusardi y Camerer (NBER, 2015) halló que cerca del 16% de los jugadores de la NFL se declara en bancarrota dentro de los 12 años posteriores a su retiro, tras ganar millones en promedio. Un ingreso alto no protege: solo encarece los errores.", "Y en «El millonario de al lado», Stanley y Danko mostraron la otra cara: el millonario típico es un maestro, un ingeniero, el dueño de un pequeño negocio que vivió años un poco por debajo de sus posibilidades. La regla es la misma para quien limpia casas y para un empresario: no decide el tamaño del ingreso, sino la diferencia entre lo que entra y lo que sale, y adónde va."], "fr": ["On croit que surveiller son argent, c’est pour ceux qui en ont peu. Les chiffres disent le contraire.", "Selon LendingClub et PYMNTS, environ 4 Américains sur 10 gagnant plus de 100 000 $ par an vivent d’une paie à l’autre. Une étude de Carlson, Kim, Lusardi et Camerer (NBER, 2015) montre qu’environ 16 % des joueurs de NFL font faillite dans les 12 ans suivant leur retraite — après avoir gagné des millions en moyenne. Un gros revenu ne protège pas. Il rend juste les erreurs plus chères.", "Et dans « The Millionaire Next Door », Stanley et Danko ont montré l’autre face : le millionnaire typique est enseignant, ingénieur, patron d’une petite entreprise qui a vécu des années un peu en dessous de ses moyens. La règle est la même pour une femme de ménage et pour un chef d’entreprise : ce qui compte n’est pas la taille du revenu, mais l’écart entre ce qui rentre et ce qui sort — et où va cet écart."]}).join('\n\n'),
      },
      {
        key: 'why_head',
        title: {"ru": "Что даёт контроль: свободная голова", "en": "What control gives you: a clear head", "es": "Lo que da el control: una mente libre", "fr": "Ce que le contrôle apporte : l’esprit libre"},
        minutes: 3,
        source: "Mani, Mullainathan, Shafir & Zhao, Science (2013)",
        body: (_ctx, lang) => tr(lang, {"ru": ["В 2013 году журнал Science опубликовал исследование Мани, Муллайнатана, Шафира и Чжао. Людям давали логические задачи, а перед этим просили подумать о денежной проблеме — например, о срочном ремонте машины.", "У тех, кому этот вопрос был тяжёл, результат падал так же, как после бессонной ночи — примерно на 13 пунктов IQ. Денежная тревога не сидит отдельно: она съедает внимание, которое нужно на работу, детей, решения.", "Контроль — это не таблица ради таблицы. Это меньше сюрпризов, а значит, меньше решений в панике. И даже если с деньгами всё нормально, знание своих цифр позволяет спокойно сказать «да» поездке, вложению или смене работы — без внутреннего «а потяну ли?»."], "en": ["In 2013 the journal Science published a study by Mani, Mullainathan, Shafir and Zhao. People were given logic puzzles — after first being asked to think about a money problem, like an urgent car repair.", "For those for whom that problem was hard, scores dropped about as much as after a sleepless night — roughly 13 IQ points. Money worry doesn’t sit in its own box: it eats the attention you need for work, kids and decisions.", "Control isn’t a spreadsheet for its own sake. It means fewer surprises — and so fewer decisions made in panic. And even when money is fine, knowing your numbers lets you say “yes” to a trip, an investment or a job change calmly, without the quiet “can I actually afford this?”"], "es": ["En 2013, la revista Science publicó un estudio de Mani, Mullainathan, Shafir y Zhao. Se dieron problemas de lógica a varias personas, pero antes se les pidió pensar en un problema de dinero, como una reparación urgente del coche.", "En quienes ese problema pesaba, los resultados bajaron casi tanto como tras una noche sin dormir: unos 13 puntos de CI. La preocupación por el dinero no se queda aparte: se come la atención que necesitas para el trabajo, los hijos y las decisiones.", "El control no es una tabla por gusto. Significa menos sorpresas y, por tanto, menos decisiones tomadas con pánico. Y aunque el dinero vaya bien, conocer tus números te permite decir «sí» con calma a un viaje, una inversión o un cambio de trabajo, sin el «¿me alcanzará?» de fondo."], "fr": ["En 2013, la revue Science a publié une étude de Mani, Mullainathan, Shafir et Zhao. On donnait des exercices de logique à des personnes — après leur avoir demandé de penser à un problème d’argent, comme une réparation urgente de voiture.", "Chez ceux pour qui ce problème pesait lourd, les résultats chutaient presque autant qu’après une nuit blanche — environ 13 points de QI. L’inquiétude financière ne reste pas dans son coin : elle mange l’attention dont tu as besoin pour le travail, les enfants, les décisions.", "Le contrôle, ce n’est pas un tableau pour le plaisir. C’est moins de surprises, donc moins de décisions prises dans la panique. Et même quand tout va bien, connaître tes chiffres te permet de dire « oui » sereinement à un voyage, un placement ou un changement de travail — sans le petit « est-ce que je peux vraiment ? »"]}).join('\n\n'),
      },
      {
        key: 'why_tracking',
        title: {"ru": "Почему записывать работает (и чем это лучше блокнота)", "en": "Why writing it down works (and beats a notebook)", "es": "Por qué anotar funciona (y supera a la libreta)", "fr": "Pourquoi noter fonctionne (et mieux qu’un carnet)"},
        minutes: 3,
        source: "Harkin et al., Psychological Bulletin (2016)",
        body: (_ctx, lang) => tr(lang, {"ru": ["Мета-анализ Харкина и коллег (Psychological Bulletin, 2016) собрал 138 исследований почти с 20 000 участников. Вывод простой: когда человек регулярно отслеживает свой прогресс к цели, шанс её достичь заметно растёт. Сильнее всего — когда прогресс записан и его видно.", "Блокнот — хорошее начало: он уже лучше, чем ничего. Но блокнот не складывает, не напоминает, не скажет, сколько можно потратить сегодня, и не свяжет кофе на вынос с твоей целью через полгода. Человеку остаётся вся математика — и на третий день её бросают.", "Здесь математику делает приложение. Тебе остаётся только решение: тратить или нет. Привычка записывать занимает пару секунд на трату, а через месяц ты знаешь о своих деньгах больше, чем за годы до этого.", "Попробуй: 7 дней записывай каждую трату — без цели экономить, просто смотреть. На восьмой день открой Главную и посмотри на диаграмму."], "en": ["A meta-analysis by Harkin and colleagues (Psychological Bulletin, 2016) pooled 138 studies with nearly 20,000 participants. The finding is simple: when people regularly monitor their progress toward a goal, their chance of reaching it rises noticeably — most of all when the progress is written down and visible.", "A notebook is a fine start — it already beats nothing. But a notebook doesn’t add up, doesn’t remind you, can’t tell you what’s safe to spend today, and won’t link a takeout coffee to your goal six months out. All the math is left to you — and by day three most people drop it.", "Here the app does the math. All that’s left to you is the decision: spend or not. Logging takes a couple of seconds per purchase, and within a month you know more about your money than in years before.", "Try it: for 7 days, log every purchase — no goal to cut back, just to look. On day eight, open Home and look at the chart."], "es": ["Un metaanálisis de Harkin y colegas (Psychological Bulletin, 2016) reunió 138 estudios con casi 20,000 participantes. La conclusión es simple: cuando una persona sigue con regularidad su avance hacia una meta, su probabilidad de lograrla sube notablemente, sobre todo cuando el avance queda escrito y a la vista.", "Una libreta es un buen comienzo: ya es mejor que nada. Pero una libreta no suma, no te recuerda, no te dice cuánto puedes gastar hoy ni conecta el café para llevar con tu meta dentro de seis meses. Toda la matemática queda para ti, y al tercer día casi todos la abandonan.", "Aquí la matemática la hace la app. A ti solo te queda decidir: gastar o no. Anotar toma un par de segundos por compra, y en un mes sabrás más de tu dinero que en años.", "Pruébalo: durante 7 días anota cada gasto, sin intención de ahorrar, solo para mirar. El octavo día abre Inicio y mira el gráfico."], "fr": ["Une méta-analyse de Harkin et ses collègues (Psychological Bulletin, 2016) a réuni 138 études et près de 20 000 participants. La conclusion est simple : quand on suit régulièrement sa progression vers un objectif, les chances de l’atteindre augmentent nettement — surtout quand la progression est notée et visible.", "Un carnet, c’est un bon début : c’est déjà mieux que rien. Mais un carnet n’additionne pas, ne rappelle rien, ne dit pas ce que tu peux dépenser aujourd’hui et ne relie pas un café à emporter à ton objectif dans six mois. Tout le calcul te revient — et au troisième jour, la plupart abandonnent.", "Ici, c’est l’app qui calcule. Il ne te reste que la décision : dépenser ou pas. Noter prend deux secondes par achat, et en un mois tu en sais plus sur ton argent qu’en des années.", "Essaie : pendant 7 jours, note chaque dépense — sans chercher à économiser, juste pour regarder. Le huitième jour, ouvre l’accueil et regarde le graphique."]}).join('\n\n'),
      },
      {
        key: 'why_skill',
        title: {"ru": "Финансовая грамотность — навык, а не талант", "en": "Financial literacy is a skill, not a talent", "es": "La educación financiera es una habilidad, no un talento", "fr": "La culture financière est une compétence, pas un talent"},
        minutes: 3,
        source: "S&P Global FinLit Survey · Drexler, Fischer & Schoar (AEJ: Applied, 2014)",
        body: (_ctx, lang) => tr(lang, {"ru": ["По мировому исследованию S&P Global, финансово грамотны только 33% взрослых. Это не потому, что остальные глупее: в большинстве стран этому просто не учат — ни в школе, ни дома. Деньги — как вождение: никто не рождается водителем.", "Хорошая новость из экономики: сложное не обязательно. Эксперимент Дрекслера, Фишера и Шоар (2014) показал, что несколько простых правил «на пальцах» улучшили финансы людей сильнее, чем полный курс бухгалтерии.", "Поэтому в приложении — простые правила, а не теория: сначала заплати себе, держи подушку, гаси дорогие долги по порядку, смотри на лимит дня. Путь на Главной разложит их по шагам — открой его и начни с текущего."], "en": ["According to the global S&P Global survey, only 33% of adults are financially literate. Not because the rest are less smart: in most countries nobody teaches it — not at school, not at home. Money is like driving: nobody is born a driver.", "The good news from economics: it doesn’t have to be complicated. An experiment by Drexler, Fischer and Schoar (2014) found that a few simple rules of thumb improved people’s finances more than a full accounting course.", "That’s why the app gives you simple rules, not theory: pay yourself first, keep a cushion, pay off expensive debt in order, watch today’s limit. The Path on Home lays them out step by step — open it and start with your current step."], "es": ["Según la encuesta mundial de S&P Global, solo el 33% de los adultos tiene educación financiera. No es porque los demás sean menos listos: en la mayoría de los países nadie la enseña, ni en la escuela ni en casa. El dinero es como manejar: nadie nace sabiendo.", "La buena noticia de la economía: no tiene que ser complicado. Un experimento de Drexler, Fischer y Schoar (2014) mostró que unas pocas reglas simples mejoraron las finanzas de la gente más que un curso completo de contabilidad.", "Por eso la app te da reglas simples, no teoría: págate primero, ten un colchón, paga las deudas caras en orden, mira el límite del día. El Camino en Inicio las ordena paso a paso: ábrelo y empieza por tu paso actual."], "fr": ["D’après l’enquête mondiale de S&P Global, seuls 33 % des adultes ont une culture financière. Pas parce que les autres sont moins malins : dans la plupart des pays, personne ne l’enseigne — ni à l’école, ni à la maison. L’argent, c’est comme la conduite : personne ne naît conducteur.", "La bonne nouvelle venue de l’économie : pas besoin que ce soit compliqué. Une expérience de Drexler, Fischer et Schoar (2014) a montré que quelques règles simples amélioraient davantage les finances des gens qu’un cours complet de comptabilité.", "C’est pourquoi l’app te donne des règles simples, pas de la théorie : paie-toi d’abord, garde un coussin, rembourse les dettes chères dans l’ordre, regarde la limite du jour. Le Chemin sur l’accueil les range étape par étape — ouvre-le et commence par ton étape actuelle."]}).join('\n\n'),
      },
    ],
    exam: {
      passPct: 60,
      questions: [
        {
          q: {"ru": "Что чаще всего отличает тех, кто накапливает капитал?", "en": "What most often sets apart people who build wealth?", "es": "¿Qué distingue con más frecuencia a quienes acumulan patrimonio?", "fr": "Qu’est-ce qui distingue le plus souvent ceux qui bâtissent un patrimoine ?"},
          options: {"ru": ["Высокая зарплата", "Разница между доходом и тратами — и куда она идёт", "Удача", "Наследство"], "en": ["A high salary", "The gap between income and spending — and where it goes", "Luck", "An inheritance"], "es": ["Un sueldo alto", "La diferencia entre ingresos y gastos, y adónde va", "La suerte", "Una herencia"], "fr": ["Un gros salaire", "L’écart entre revenus et dépenses — et où il va", "La chance", "Un héritage"]},
          correct: 1,
          explain: {"ru": "Даже миллионные доходы не спасают без управления, а большинство миллионеров построили капитал сами — живя чуть ниже своих возможностей.", "en": "Even millions in income don’t help without managing it, and most millionaires built their wealth themselves — by living a little below their means.", "es": "Ni ingresos millonarios salvan sin administración, y la mayoría de los millonarios construyó su patrimonio por sí misma, viviendo un poco por debajo de sus posibilidades.", "fr": "Même des revenus de millionnaire ne suffisent pas sans gestion, et la plupart des millionnaires ont bâti leur patrimoine eux-mêmes — en vivant un peu en dessous de leurs moyens."},
        },
        {
          q: {"ru": "Почему люди недооценивают свои траты?", "en": "Why do people underestimate their spending?", "es": "¿Por qué la gente subestima sus gastos?", "fr": "Pourquoi sous-estime-t-on ses dépenses ?"},
          options: {"ru": ["Банки скрывают траты", "Многие покупки кажутся «разовыми исключениями»", "Цены растут", "Они мало зарабатывают"], "en": ["Banks hide charges", "Many purchases feel like one-off “exceptions”", "Prices go up", "They don’t earn enough"], "es": ["Los bancos ocultan cargos", "Muchas compras parecen «excepciones» únicas", "Los precios suben", "No ganan lo suficiente"], "fr": ["Les banques cachent les débits", "Beaucoup d’achats semblent être des « exceptions » ponctuelles", "Les prix augmentent", "Ils ne gagnent pas assez"]},
          correct: 1,
          explain: {"ru": "«Исключения» случаются каждый месяц — просто разные, поэтому голова их не складывает.", "en": "“Exceptions” happen every month — just different ones, so your head never adds them up.", "es": "Las «excepciones» ocurren cada mes, solo que distintas, así que la cabeza no las suma.", "fr": "Les « exceptions » arrivent chaque mois — simplement différentes, donc la tête ne les additionne pas."},
        },
        {
          q: {"ru": "Что делает регулярное отслеживание прогресса к цели?", "en": "What does regularly tracking progress toward a goal do?", "es": "¿Qué logra seguir con regularidad el avance hacia una meta?", "fr": "Que fait le suivi régulier de la progression vers un objectif ?"},
          options: {"ru": ["Ничего не меняет", "Заметно повышает шанс достичь цели", "Нужно только бухгалтерам", "Заставляет тратить больше"], "en": ["Changes nothing", "Noticeably raises the chance of reaching it", "Is only for accountants", "Makes you spend more"], "es": ["No cambia nada", "Aumenta notablemente la probabilidad de lograrla", "Solo sirve a contadores", "Hace gastar más"], "fr": ["Ne change rien", "Augmente nettement les chances de l’atteindre", "Ne sert qu’aux comptables", "Fait dépenser plus"]},
          correct: 1,
          explain: {"ru": "Мета-анализ 138 исследований: отслеживание прогресса заметно повышает шанс достичь цели — особенно когда он записан.", "en": "A meta-analysis of 138 studies: tracking progress noticeably raises the odds of reaching a goal — especially when it’s written down.", "es": "Un metaanálisis de 138 estudios: seguir el avance aumenta notablemente la probabilidad de lograr una meta, sobre todo si queda escrito.", "fr": "Une méta-analyse de 138 études : suivre sa progression augmente nettement les chances d’atteindre un objectif — surtout quand c’est noté."},
        },
      ],
    },
  },
  {
    key: 'foundations',
    title: { ru: 'Основы: как устроены твои деньги', en: 'Foundations: how your money actually works', es: "Bases: cómo funciona de verdad tu dinero", fr: "Les bases : comment fonctionne vraiment ton argent" },
    source: 'FDIC Money Smart · CFPB «Your Money, Your Goals»',
    sourceUrl: 'https://www.fdic.gov/consumer-resource-center/money-smart',
    locked: false,
    lessons: [
      {
        key: 'crisis_first_aid',
        title: { ru: 'Если совсем труба: план первых шагов', en: 'If things are really bad: first steps', es: "Si todo va muy mal: primeros pasos", fr: "Si ça va vraiment mal : les premiers pas" },
        minutes: 4,
        source: 'CFPB (crisis modules)',
        body: (ctx, lang) => {
          const debts = ctx.debts || []
          const totalDebt = debts.reduce((s, d) => s + (d.balance || 0), 0)
          if (lang === 'es' || lang === 'fr') {
            const es = lang === 'es'
            return [
              es ? 'Cuando no alcanza ni para lo esencial, presupuestar por porcentajes no es el primer paso. El primer paso es detener la hemorragia, y aquí el orden de las acciones importa más que la perfección de cada decisión.' : "Quand l’argent manque même pour l’essentiel, budgéter en pourcentages n’est pas la première étape. La première étape, c’est d’arrêter l’hémorragie — et ici, l’ordre des actions compte plus que la perfection de chaque décision.",
              es ? 'Paso 1: cualquier ingreso es mejor que el ingreso perfecto. Mientras no cierres la brecha, un trabajo extra, temporal o fuera de tu área no es «bajar de nivel»: es lo que paga las cuentas de este mes. Optimizar tu carrera puede y debe venir después, con la brecha cerrada.' : "Étape 1 : n’importe quel revenu vaut mieux que le revenu idéal. Tant que l’écart n’est pas comblé, un petit boulot, un intérim ou un travail hors de ton domaine n’est pas une « régression » — c’est ce qui paie les factures ce mois-ci. Optimiser ta carrière viendra après, une fois l’écart comblé.",
              es ? 'Paso 2: llama tú a tus acreedores antes de que te llamen los cobradores. En EE. UU., bancos y prestamistas deben considerar solicitudes de aplazamiento o un nuevo plan de pagos; la CFPB recomienda contactarlos de forma proactiva: es más fácil negociar antes del atraso que después.' : "Étape 2 : appelle toi-même tes créanciers avant que les recouvreurs ne t’appellent. Aux États-Unis, banques et prêteurs doivent examiner les demandes de report ou de nouveau plan de paiement — la CFPB recommande de les contacter de façon proactive : on négocie plus facilement avant un retard qu’après.",
              es ? 'Paso 3: en una crisis, el orden de pagos no va por tamaño de la deuda ni por tasa, sino por el costo de las consecuencias inmediatas. Primero, lo que pone en riesgo tu techo o el coche que necesitas para trabajar (renta/hipoteca, préstamo del coche) y los servicios críticos (luz, agua). Solo después, tarjetas y otras deudas, aunque su tasa sea más alta.' : "Étape 3 : en crise, l’ordre des paiements ne suit ni le montant ni le taux, mais le coût des conséquences immédiates. D’abord ce qui menace ton toit ou la voiture dont tu as besoin pour travailler (loyer/crédit immobilier, crédit auto) et les factures vitales (électricité, eau). Ensuite seulement les cartes et autres dettes, même si leur taux est plus élevé.",
              es ? 'Paso 4: este es un modo manual temporal, no una estrategia permanente; en cuanto cierres la brecha, vuelve al plan normal (Necesidades/Deseos/Ahorro, pagar deudas con el método avalancha, etc.).' : "Étape 4 : c’est un mode manuel temporaire, pas une stratégie permanente — dès que l’écart est comblé, reviens au plan normal (Essentiel/Envies/Épargne, remboursement en avalanche, etc.).",
              totalDebt > 0
                ? (es ? `Tus números: tu deuda total ahora es ${fmt(totalDebt)}. No es una sentencia: es solo un número con el que puedes empezar a llamar y negociar.` : `Tes chiffres : ta dette totale est aujourd’hui de ${fmt(totalDebt)}. Ce n’est pas une condamnation — juste un chiffre avec lequel tu peux commencer à appeler et négocier.`)
                : '',
            ].filter(Boolean).join('\n\n')
          }
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
        title: { ru: 'Зачем банку твой депозит и что его страхует', en: 'Why banks want your deposit, and what insures it', es: "Por qué el banco quiere tu depósito y qué lo asegura", fr: "Pourquoi la banque veut ton dépôt, et ce qui le garantit" },
        minutes: 4,
        source: 'FDIC',
        body: (_ctx, lang) =>
          (lang === 'es'
            ? [
                "Cuando pones dinero en una cuenta, el banco no lo guarda en una caja fuerte: enseguida presta una parte a otras personas y empresas, y gana con la diferencia de tasas. Es normal y legal: así funciona todo el sistema bancario.",
                "La pregunta que debería preocupar al regulador, no a ti: ¿y si el banco quiebra? En EE. UU. la respuesta es la FDIC (Federal Deposit Insurance Corporation), una agencia independiente que asegura los depósitos hasta $250,000 por depositante y por banco. No es publicidad de un banco: es ley federal y cubre a todos los bancos miembros de la FDIC.",
                "Conclusión práctica: si tienes más de $250,000 en efectivo, conviene repartirlo entre distintos bancos o tipos de titularidad en lugar de un solo lugar; lo que pase del límite no tiene garantía de volver si ese banco quiebra.",
              ]
            : lang === 'fr'
            ? [
                "Quand tu mets de l’argent sur un compte, la banque ne l’enferme pas dans un coffre : elle en prête aussitôt une partie à d’autres personnes et entreprises, et gagne sur la différence de taux. C’est normal et légal — c’est ainsi que fonctionne tout le système bancaire.",
                "La question qui doit inquiéter le régulateur, pas toi : et si la banque fait faillite ? Aux États-Unis, la réponse s’appelle la FDIC (Federal Deposit Insurance Corporation), une agence indépendante qui garantit les dépôts jusqu’à 250 000 $ par déposant et par banque. Ce n’est pas le marketing d’une banque : c’est la loi fédérale, qui couvre toutes les banques membres de la FDIC.",
                "Conclusion pratique : si tu as plus de 250 000 $ en liquide, mieux vaut les répartir entre plusieurs banques ou types de titulaires plutôt qu’à un seul endroit — ce qui dépasse le plafond n’est pas garanti en cas de faillite.",
              ]
            : lang === 'en'
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
        title: { ru: 'Кредитный рейтинг: из чего он реально считается', en: 'Credit score: what it actually is made of', es: "Puntaje de crédito: de qué se compone en realidad", fr: "Cote de crédit : de quoi elle se compose vraiment" },
        minutes: 4,
        source: 'CFPB',
        body: (_ctx, lang) =>
          (lang === 'es'
            ? [
                "Un puntaje de crédito (en EE. UU., casi siempre el FICO Score) no es un misterio ni una «caja negra del destino»: es una fórmula ponderada de cinco factores concretos, y la CFPB (Consumer Financial Protection Bureau) publica sus pesos.",
                "Historial de pagos — cerca del 35% del peso: si pagaste a tiempo. Uso del crédito — cerca del 30%: cuánto de tu límite disponible usas realmente (menos del 30% es notablemente mejor). Antigüedad del historial — cerca del 15%. Solicitudes nuevas — cerca del 10%: muchas solicitudes en poco tiempo bajan el puntaje. Mezcla de créditos — cerca del 10%.",
                "Conclusión práctica: dos acciones simples dan el mayor efecto: pagar siempre a tiempo y no usar más del 30% del límite de tus tarjetas. No es un «truco»: es literalmente lo que mide la fórmula.",
              ]
            : lang === 'fr'
            ? [
                "Une cote de crédit (aux États-Unis, le plus souvent le score FICO) n’a rien de mystérieux ni d’une « boîte noire du destin » : c’est une formule pondérée de cinq facteurs précis, et la CFPB (Consumer Financial Protection Bureau) publie leurs poids.",
                "Historique de paiements — environ 35 % : as-tu payé à temps. Utilisation du crédit — environ 30 % : quelle part de ton plafond tu utilises vraiment (moins de 30 %, c’est nettement mieux). Ancienneté du crédit — environ 15 %. Nouvelles demandes — environ 10 % : beaucoup de demandes en peu de temps font baisser la cote. Diversité des crédits — environ 10 %.",
                "Conclusion pratique : deux gestes simples ont le plus d’effet — toujours payer à temps et ne jamais utiliser plus de 30 % du plafond de tes cartes. Ce n’est pas une « astuce » : c’est littéralement ce que mesure la formule.",
              ]
            : lang === 'en'
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
        title: { ru: 'APR vs процентная ставка — это не одно и то же', en: 'APR vs interest rate — not the same thing', es: "APR vs tasa de interés: no son lo mismo", fr: "TAEG vs taux d’intérêt — ce n’est pas pareil" },
        minutes: 3,
        source: 'CFPB',
        body: (_ctx, lang) =>
          (lang === 'es'
            ? [
                "Los prestamistas están obligados por ley (Truth in Lending Act, supervisada por la CFPB) a informar el APR — Annual Percentage Rate. No es lo mismo que la «tasa de interés» que te dicen de palabra.",
                "La tasa de interés es solo el precio del dinero en sí. El APR le suma todas las comisiones obligatorias del préstamo, convertidas a un porcentaje anual. Por eso un préstamo anunciado «al 5%» con una comisión de apertura grande puede tener un APR del 7–8%, y el APR es el número honesto para comparar dos ofertas.",
                "Conclusión práctica: al comparar préstamos o tarjetas, mira siempre el APR, no la tasa anunciada; es el único número que la ley obliga a calcular igual a todos los prestamistas.",
              ]
            : lang === 'fr'
            ? [
                "Les prêteurs sont tenus par la loi (Truth in Lending Act, contrôlée par la CFPB) d’indiquer l’APR — l’équivalent du TAEG. Ce n’est pas la même chose que le « taux d’intérêt » qu’on t’annonce à l’oral.",
                "Le taux d’intérêt n’est que le prix de l’argent lui-même. Le TAEG y ajoute tous les frais obligatoires du prêt, convertis en pourcentage annuel. C’est pourquoi un prêt affiché « à 5 % » avec de gros frais de dossier peut avoir un TAEG de 7–8 % — et c’est le TAEG qui permet de comparer honnêtement deux offres.",
                "Conclusion pratique : pour comparer des prêts ou des cartes de crédit, regarde toujours le TAEG, pas le taux publicitaire — c’est le seul chiffre que la loi oblige tous les prêteurs à calculer de la même façon.",
              ]
            : lang === 'en'
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
        title: { ru: 'Экстренный фонд по методике CFPB — с чего начать, если денег нет вообще', en: 'An emergency fund the CFPB way — where to start with zero savings', es: "Un fondo de emergencia al estilo CFPB: por dónde empezar sin ahorros", fr: "Une épargne de secours façon CFPB — par où commencer sans aucune économie" },
        minutes: 4,
        source: 'CFPB Your Money, Your Goals',
        body: (ctx, lang) => {
          const needsTotal = Object.values(ctx.settings?.needs_budget || {}).reduce((s, v) => s + (v || 0), 0)
          const small = Math.max(25, Math.round(needsTotal * 0.02))
          if (lang === 'es' || lang === 'fr') {
            const es = lang === 'es'
            return [
              es ? 'El método de la CFPB para quien no tiene ningún ahorro no empieza con «aparta 3 meses de gastos»: eso desanima. Empieza con montos pequeños y regulares: incluso $5–10 por semana, separados de tu cuenta principal para no gastarlos por costumbre.' : "La méthode de la CFPB pour ceux qui n’ont aucune épargne ne commence pas par « mets 3 mois de dépenses de côté » — c’est décourageant. Elle commence par de petites sommes régulières : même 5–10 $ par semaine, à part de ton compte principal pour ne pas les dépenser par habitude.",
              es ? 'La idea es que la primera meta no es un monto, sino el hábito de apartar algo con regularidad. Solo cuando el hábito se afianza tiene sentido armar un colchón completo de 3 meses de gastos esenciales.' : "L’idée : le premier objectif n’est pas un montant, mais l’habitude même de mettre quelque chose de côté régulièrement. Ce n’est qu’une fois l’habitude installée qu’il est utile de viser un vrai coussin de 3 mois de dépenses essentielles.",
              needsTotal > 0
                ? (es ? `Tus números: empezando poco a poco, la referencia de la CFPB es de unos ${fmt(small)}/semana al inicio, separados de tu cuenta principal.` : `Tes chiffres : en commençant petit, le repère de la CFPB est d’environ ${fmt(small)}/semaine au départ, à part de ton compte principal.`)
                : (es ? 'Completa tus gastos esenciales en la configuración — aquí aparecerá un monto inicial al estilo CFPB.' : 'Remplis tes dépenses essentielles dans les réglages — un montant de départ façon CFPB apparaîtra ici.'),
            ].join('\n\n')
          }
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
            en: "If your cash-flow gap is critical (not enough for essentials), what should you do first?", es: "Si te falta dinero hasta para lo esencial, ¿qué deberías hacer primero?", fr: "Si l’argent manque même pour l’essentiel, que faut-il faire en premier ?",
          },
          options: {
            ru: ['Составить идеальный бюджет на год вперёд', 'Взять любой доступный доход (подработка) и связаться с кредиторами самому', 'Ничего не делать, дождаться улучшения', 'Сразу закрыть все долги с самой низкой суммой'],
            en: ['Build a perfect year-ahead budget', 'Take any available income (a side gig) and contact your creditors yourself', 'Do nothing and wait for things to improve', 'Immediately pay off all debts with the smallest balance'],
            es: ["Hacer un presupuesto perfecto para todo el año", "Tomar cualquier ingreso disponible (un trabajo extra) y contactar tú mismo a los acreedores", "No hacer nada y esperar a que mejore", "Pagar de inmediato todas las deudas de saldo más pequeño"],
            fr: ["Faire un budget parfait pour l’année", "Prendre tout revenu disponible (petit boulot) et contacter toi-même tes créanciers", "Ne rien faire et attendre que ça aille mieux", "Rembourser tout de suite les dettes au plus petit solde"],
          },
          correct: 1,
          explain: {
            ru: 'В кризисном режиме порядок действий важнее идеальности: сначала любой доход и проактивный звонок кредиторам — это закрывает разрыв быстрее всего.',
            en: 'In crisis mode, the order of actions matters more than perfection: any income plus a proactive call to creditors closes the gap fastest.', es: "En modo crisis, el orden de las acciones importa más que la perfección: cualquier ingreso más una llamada proactiva a los acreedores cierran la brecha más rápido.", fr: "En mode crise, l’ordre des actions compte plus que la perfection : n’importe quel revenu plus un appel proactif aux créanciers comblent l’écart le plus vite.",
          },
        },
        {
          q: { ru: 'На какую сумму FDIC страхует депозиты одного вкладчика в одном банке?', en: 'How much does the FDIC insure per depositor, per bank?', es: "¿Cuánto asegura la FDIC por depositante y por banco?", fr: "Combien la FDIC garantit-elle par déposant et par banque ?" },
          options: { ru: ['$50,000', '$100,000', '$250,000', 'Без ограничений'], en: ['$50,000', '$100,000', '$250,000', 'No limit'], es: ["$50,000", "$100,000", "$250,000", "Sin límite"], fr: ["50 000 $", "100 000 $", "250 000 $", "Sans limite"] },
          correct: 2,
          explain: {
            ru: 'FDIC страхует до $250,000 на вкладчика на банк — федеральный закон, а не маркетинг конкретного банка.',
            en: 'The FDIC insures up to $250,000 per depositor per bank — federal law, not marketing from any one bank.', es: "La FDIC asegura hasta $250,000 por depositante y por banco: es ley federal, no publicidad de un banco.", fr: "La FDIC garantit jusqu’à 250 000 $ par déposant et par banque — c’est la loi fédérale, pas le marketing d’une banque.",
          },
        },
        {
          q: { ru: 'Какой фактор больше всего влияет на кредитный рейтинг FICO?', en: 'Which factor most affects a FICO credit score?', es: "¿Qué factor influye más en el puntaje FICO?", fr: "Quel facteur pèse le plus sur la cote FICO ?" },
          options: {
            ru: ['Разнообразие типов кредита', 'История платежей (вовремя ли платил)', 'Количество новых заявок', 'Возраст заёмщика'],
            en: ['Credit mix', 'Payment history (paying on time)', 'Number of new applications', "Borrower's age"],
            es: ["Mezcla de créditos", "Historial de pagos (pagar a tiempo)", "Número de solicitudes nuevas", "Edad del solicitante"],
            fr: ["Diversité des crédits", "Historique de paiements (payer à temps)", "Nombre de nouvelles demandes", "Âge de l’emprunteur"],
          },
          correct: 1,
          explain: {
            ru: 'История платежей — около 35% веса, самый значимый фактор.',
            en: "Payment history is about 35% of the weight — the single biggest factor.", es: "El historial de pagos pesa cerca del 35%: es el factor más importante.", fr: "L’historique de paiements pèse environ 35 % — c’est le facteur le plus important.",
          },
        },
        {
          q: { ru: 'Какой процент от доступного кредитного лимита рекомендуется не превышать?', en: 'What percentage of your available credit limit is it recommended not to exceed?', es: "¿Qué porcentaje de tu límite de crédito se recomienda no superar?", fr: "Quel pourcentage de ton plafond de crédit est-il conseillé de ne pas dépasser ?" },
          options: { ru: ['10%', '30%', '50%', '70%'], en: ['10%', '30%', '50%', '70%'], es: ["10%", "30%", "50%", "70%"], fr: ["10 %", "30 %", "50 %", "70 %"] },
          correct: 1,
          explain: {
            ru: 'Использование кредита — около 30% веса рейтинга; ниже 30% от лимита заметно лучше для рейтинга.',
            en: 'Credit utilization is about 30% of the score weight; staying under 30% of your limit is noticeably better.', es: "El uso del crédito pesa cerca del 30% del puntaje; quedarte bajo el 30% de tu límite es notablemente mejor.", fr: "L’utilisation du crédit pèse environ 30 % de la cote ; rester sous 30 % du plafond est nettement mieux.",
          },
        },
        {
          q: { ru: 'Чем APR отличается от процентной ставки по кредиту?', en: 'How does APR differ from a loan\'s interest rate?', es: "¿En qué se diferencia el APR de la tasa de interés de un préstamo?", fr: "En quoi le TAEG diffère-t-il du taux d’intérêt d’un prêt ?" },
          options: {
            ru: ['Ничем, это синонимы', 'APR — это ставка только для ипотеки', 'APR включает обязательные комиссии за выдачу кредита, пересчитанные в годовой процент', 'APR всегда ниже процентной ставки'],
            en: ["They're the same thing", 'APR only applies to mortgages', 'APR includes mandatory loan fees converted into an annualized percentage', 'APR is always lower than the interest rate'],
            es: ["Son lo mismo", "El APR solo aplica a hipotecas", "El APR incluye las comisiones obligatorias del préstamo convertidas a un porcentaje anual", "El APR siempre es menor que la tasa de interés"],
            fr: ["C’est la même chose", "Le TAEG ne concerne que les crédits immobiliers", "Le TAEG inclut les frais obligatoires du prêt convertis en pourcentage annuel", "Le TAEG est toujours inférieur au taux d’intérêt"],
          },
          correct: 2,
          explain: {
            ru: 'APR обязателен по Truth in Lending Act и включает комиссии — честное число для сравнения предложений.',
            en: "APR is required under the Truth in Lending Act and includes fees — the honest number for comparing offers.", es: "El APR es obligatorio por la Truth in Lending Act e incluye comisiones: es el número honesto para comparar ofertas.", fr: "Le TAEG est imposé par la Truth in Lending Act et inclut les frais — c’est le chiffre honnête pour comparer les offres.",
          },
        },
        {
          q: { ru: 'С чего методика CFPB предлагает начинать формирование накоплений человеку без сбережений?', en: 'Where does the CFPB method suggest starting savings for someone with none?', es: "¿Por dónde sugiere el método CFPB empezar a ahorrar si no tienes nada?", fr: "Par où la méthode CFPB propose-t-elle de commencer quand on n’a aucune épargne ?" },
          options: {
            ru: ['Сразу откладывать 3 месячных расхода', 'С маленьких регулярных сумм, чтобы закрепить привычку', 'С покупки страхового полиса', 'С открытия брокерского счёта'],
            en: ['Immediately saving 3 months of expenses', 'With small, regular amounts to build the habit', 'By buying an insurance policy', 'By opening a brokerage account'],
            es: ["Apartar de inmediato 3 meses de gastos", "Con montos pequeños y regulares para crear el hábito", "Comprando una póliza de seguro", "Abriendo una cuenta de corretaje"],
            fr: ["Mettre tout de suite 3 mois de dépenses de côté", "Par de petites sommes régulières pour créer l’habitude", "En achetant une assurance", "En ouvrant un compte-titres"],
          },
          correct: 1,
          explain: {
            ru: 'Методика CFPB начинается с малых регулярных сумм — цель на старте это привычка, а не размер подушки.',
            en: 'The CFPB method starts with small regular amounts — the initial goal is the habit, not the size of the cushion.', es: "El método CFPB empieza con montos pequeños y regulares: el objetivo inicial es el hábito, no el tamaño del colchón.", fr: "La méthode CFPB commence par de petites sommes régulières — le premier objectif est l’habitude, pas la taille du coussin.",
          },
        },
      ],
    },
  },
  {
    key: 'how_money_works',
    title: { ru: 'Как реально работают деньги в экономике', en: 'How money actually works in the economy', es: "Cómo funciona de verdad el dinero en la economía", fr: "Comment l’argent fonctionne vraiment dans l’économie" },
    source: 'Federal Reserve Education',
    sourceUrl: 'https://www.federalreserveeducation.org/',
    locked: false,
    unlockAfter: 'foundations',
    lessons: [
      {
        key: 'fed_dual_mandate',
        title: { ru: 'Зачем вообще существует ФРС', en: 'Why the Fed exists at all', es: "Por qué existe la Fed", fr: "Pourquoi la Fed existe" },
        minutes: 4,
        source: 'Federal Reserve',
        body: (_ctx, lang) =>
          (lang === 'es'
            ? [
                "La Fed (Sistema de la Reserva Federal) es el banco central de EE. UU. Tiene dos mandatos oficiales del Congreso, ambos en la ley: estabilidad de precios (controlar la inflación) y máximo empleo. Todo lo demás se deriva de esas dos metas.",
                "Cuando la Fed sube las tasas, encarece el crédito a propósito, para enfriar la demanda y frenar la inflación. Cuando las baja, estimula la economía pero corre el riesgo de que suban los precios. No es arbitrario: es una herramienta directa al servicio de un mandato concreto.",
                "Conclusión práctica: el titular «la Fed subió las tasas» no es política abstracta lejana; es la razón directa de que tu hipoteca, tu préstamo del coche o la tasa de tu cuenta de ahorro cambien en pocos meses.",
              ]
            : lang === 'fr'
            ? [
                "La Fed (Réserve fédérale) est la banque centrale des États-Unis. Elle a deux mandats officiels du Congrès, inscrits dans la loi : la stabilité des prix (maîtriser l’inflation) et le plein emploi. Tout le reste découle de ces deux objectifs.",
                "Quand la Fed relève ses taux, elle rend volontairement le crédit plus cher — pour refroidir la demande et freiner l’inflation. Quand elle les baisse, elle stimule l’économie mais risque de faire grimper les prix. Ce n’est pas arbitraire : c’est un outil direct au service d’un mandat précis.",
                "Conclusion pratique : le titre « la Fed a relevé ses taux » n’est pas de la politique lointaine — c’est la raison directe pour laquelle ton crédit immobilier, ton crédit auto ou le taux de ton compte épargne changent dans les mois qui suivent.",
              ]
            : lang === 'en'
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
        title: { ru: 'Инфляция: как её измеряют и почему цель именно 2%', en: 'Inflation: how it\'s measured, and why the target is 2%', es: "Inflación: cómo se mide y por qué la meta es 2%", fr: "L’inflation : comment on la mesure, et pourquoi la cible est de 2 %" },
        minutes: 4,
        source: 'Federal Reserve',
        body: (_ctx, lang) =>
          (lang === 'es'
            ? [
                "La inflación se mide con el Índice de Precios al Consumidor (IPC): una canasta de bienes y servicios típicos cuyos precios se siguen cada mes. La Fed tiene como meta oficial una inflación del 2% anual como nivel «sano».",
                "¿Por qué no 0%? Porque una inflación pequeña y predecible da flexibilidad a empresas y trabajadores (sueldos y precios pueden subir sin recortes dolorosos), mientras que la deflación (precios que bajan) históricamente acompañó las peores crisis: la gente pospone compras esperando que todo sea más barato y la economía se frena.",
                "Conclusión práctica: si tu ingreso no crece al menos un 2% al año, te vas empobreciendo en términos reales, aunque no tengas ni un solo mes «malo» en tu presupuesto.",
              ]
            : lang === 'fr'
            ? [
                "L’inflation se mesure avec l’indice des prix à la consommation (IPC) — un panier de biens et services courants dont les prix sont suivis chaque mois. La Fed vise officiellement 2 % d’inflation par an, jugés « sains ».",
                "Pourquoi pas 0 % ? Parce qu’une inflation faible et prévisible donne de la souplesse aux entreprises et aux salariés (salaires et prix peuvent monter sans baisses douloureuses), alors que la déflation (prix qui baissent) a accompagné historiquement les pires crises — on repousse ses achats en attendant que tout soit moins cher, et l’économie cale.",
                "Conclusion pratique : si ton revenu n’augmente pas d’au moins 2 % par an, tu t’appauvris en termes réels — même sans un seul « mauvais » mois dans ton budget.",
              ]
            : lang === 'en'
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
        title: { ru: 'Как банк «создаёт» деньги, когда выдаёт кредит', en: 'How a bank "creates" money when it makes a loan', es: "Cómo un banco «crea» dinero al dar un préstamo", fr: "Comment une banque « crée » de l’argent en accordant un prêt" },
        minutes: 5,
        source: 'Federal Reserve Bank of St. Louis / New York',
        body: (_ctx, lang) =>
          (lang === 'es'
            ? [
                "La intuición dice que un banco presta el dinero que ya está en los depósitos. Es solo parte de la verdad. Cuando un banco aprueba un préstamo, crea un depósito nuevo en la cuenta del deudor: literalmente aumenta la masa monetaria en ese momento, no solo mueve dinero existente.",
                "No es ilimitado: los bancos están limitados por requisitos de capital y por la supervisión de la Fed y otros reguladores, no solo por el volumen de depósitos que ya reunieron.",
                "Conclusión práctica: entender que el dinero de un préstamo no son «los ahorros guardados de alguien», sino parte del mecanismo de la economía, ayuda a explicar por qué la masa monetaria crece más rápido de lo que parece lógico a nivel de un hogar.",
              ]
            : lang === 'fr'
            ? [
                "L’intuition dit qu’une banque prête l’argent qui dort déjà dans les dépôts. Ce n’est qu’une partie de la vérité. Quand une banque accorde un prêt, elle crée un nouveau dépôt sur le compte de l’emprunteur — elle augmente littéralement la masse monétaire à ce moment-là, au lieu de simplement déplacer de l’argent existant.",
                "Ce n’est pas illimité : les banques sont limitées par des exigences de fonds propres et la surveillance de la Fed et d’autres régulateurs, pas seulement par le volume de dépôts déjà collectés.",
                "Conclusion pratique : comprendre que l’argent prêté n’est pas « l’épargne mise de côté par quelqu’un » mais un rouage de l’économie aide à expliquer pourquoi la masse monétaire croît plus vite qu’il n’y paraît à l’échelle d’un ménage.",
              ]
            : lang === 'en'
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
        title: { ru: 'Почему решение ФРС меняет твою ипотеку и вклад', en: 'Why a Fed decision changes your mortgage and your savings rate', es: "Por qué una decisión de la Fed cambia tu hipoteca y tu tasa de ahorro", fr: "Pourquoi une décision de la Fed change ton crédit immobilier et ton taux d’épargne" },
        minutes: 4,
        source: 'Federal Reserve',
        body: (ctx, lang) => {
          const hasDebts = ctx.debts?.length > 0
          if (lang === 'es' || lang === 'fr') {
            const es = lang === 'es'
            return [
              es ? 'La Fed controla directamente una sola tasa: la federal funds rate, la tasa a la que los bancos se prestan entre sí de un día para otro. Pero esa tasa es la base con la que los bancos fijan todo lo demás: hipotecas, préstamos de coche, tasas de ahorro, rendimientos de bonos.' : "La Fed ne contrôle directement qu’un seul taux — le federal funds rate, celui auquel les banques se prêtent entre elles au jour le jour. Mais ce taux est la base à partir de laquelle les banques fixent tout le reste : crédits immobiliers, crédits auto, taux d’épargne, rendements obligataires.",
              es ? 'La transmisión no es instantánea —suele tardar unos meses— y cada producto reacciona a distinta velocidad: las tasas de tarjetas y préstamos nuevos cambian rápido; la de una hipoteca fija ya otorgada no cambia en absoluto (ese es el sentido de una tasa fija).' : "La transmission n’est pas instantanée — en général quelques mois — et chaque produit réagit à sa vitesse : les taux des cartes et des nouveaux prêts bougent vite ; celui d’un crédit immobilier à taux fixe déjà accordé ne bouge pas du tout (c’est tout l’intérêt du taux fixe).",
              hasDebts
                ? (es ? 'Tus números: tienes deudas; si alguna tiene tasa variable, los cambios de la Fed afectan tu pago más rápido que a una hipoteca fija.' : 'Tes chiffres : tu as des dettes — si l’une d’elles est à taux variable, les décisions de la Fed touchent ton paiement plus vite qu’un crédit immobilier à taux fixe.')
                : (es ? 'Si en el futuro pides un préstamo, la diferencia entre tasa fija y variable es literalmente si tu pago dependerá o no de las decisiones de la Fed.' : 'Si tu empruntes un jour, la différence entre taux fixe et variable revient littéralement à savoir si ton paiement dépendra ou non des décisions de la Fed.'),
            ].join('\n\n')
          }
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
          q: { ru: 'Какие два официальных мандата у ФРС?', en: 'What are the Fed\'s two official mandates?', es: "¿Cuáles son los dos mandatos oficiales de la Fed?", fr: "Quels sont les deux mandats officiels de la Fed ?" },
          options: {
            ru: ['Контроль курса доллара и цена на нефть', 'Стабильность цен и максимальная занятость', 'Регулирование фондового рынка и налогов', 'Печать денег и хранение золота'],
            en: ['Controlling the dollar exchange rate and oil prices', 'Price stability and maximum employment', 'Regulating the stock market and taxes', 'Printing money and holding gold'],
            es: ["Controlar el tipo de cambio del dólar y el precio del petróleo", "Estabilidad de precios y máximo empleo", "Regular la bolsa y los impuestos", "Imprimir dinero y guardar oro"],
            fr: ["Contrôler le cours du dollar et le prix du pétrole", "Stabilité des prix et plein emploi", "Réguler la Bourse et les impôts", "Imprimer de l’argent et garder de l’or"],
          },
          correct: 1,
          explain: {
            ru: 'Двойной мандат ФРС закреплён законом: стабильность цен (инфляция) и максимальная занятость.',
            en: "The Fed's dual mandate is set in law: price stability (inflation) and maximum employment.", es: "El doble mandato de la Fed está en la ley: estabilidad de precios (inflación) y máximo empleo.", fr: "Le double mandat de la Fed est inscrit dans la loi : stabilité des prix (inflation) et plein emploi.",
          },
        },
        {
          q: { ru: 'Какой годовой уровень инфляции ФРС официально таргетирует?', en: 'What annual inflation rate does the Fed officially target?', es: "¿Qué inflación anual tiene como meta oficial la Fed?", fr: "Quelle inflation annuelle la Fed vise-t-elle officiellement ?" },
          options: { ru: ['0%', '2%', '5%', '10%'], en: ['0%', '2%', '5%', '10%'], es: ['0%', '2%', '5%', '10%'], fr: ['0 %', '2 %', '5 %', '10 %'] },
          correct: 1,
          explain: {
            ru: '2% в год — официальная цель ФРС по инфляции, измеряемой через индекс потребительских цен (CPI).',
            en: "2% a year is the Fed's official inflation target, measured via the Consumer Price Index (CPI).", es: "2% al año es la meta oficial de inflación de la Fed, medida con el Índice de Precios al Consumidor (IPC).", fr: "2 % par an est la cible officielle d’inflation de la Fed, mesurée par l’indice des prix à la consommation (IPC).",
          },
        },
        {
          q: { ru: 'Что происходит, когда банк выдаёт новый кредит?', en: 'What happens when a bank issues a new loan?', es: "¿Qué pasa cuando un banco da un préstamo nuevo?", fr: "Que se passe-t-il quand une banque accorde un nouveau prêt ?" },
          options: {
            ru: ['Банк просто перекладывает чужие сбережения заёмщику', 'Банк создаёт новый депозит — увеличивает денежную массу в моменте', 'Деньги берутся напрямую из резервов ФРС', 'Ничего не меняется в объёме денег в системе'],
            en: ["The bank just passes someone else's savings to the borrower", 'The bank creates a new deposit — increasing the money supply in that moment', "Money comes directly from the Fed's reserves", 'The total money supply is unchanged'],
            es: ["El banco solo pasa los ahorros de otros al deudor", "El banco crea un depósito nuevo: aumenta la masa monetaria en ese momento", "El dinero sale directamente de las reservas de la Fed", "La masa monetaria total no cambia"],
            fr: ["La banque transmet simplement l’épargne d’autres gens à l’emprunteur", "La banque crée un nouveau dépôt — la masse monétaire augmente à ce moment-là", "L’argent vient directement des réserves de la Fed", "La masse monétaire totale ne change pas"],
          },
          correct: 1,
          explain: {
            ru: 'Выдача кредита создаёт новый депозит — это увеличивает денежную массу, а не просто перераспределяет её.',
            en: 'Issuing a loan creates a new deposit — that increases the money supply rather than merely redistributing it.', es: "Dar un préstamo crea un depósito nuevo: aumenta la masa monetaria en lugar de solo redistribuirla.", fr: "Accorder un prêt crée un nouveau dépôt — cela augmente la masse monétaire au lieu de simplement la redistribuer.",
          },
        },
        {
          q: { ru: 'Ставка по какому продукту меняется быстрее всего вслед за решением ФРС?', en: 'Which product\'s rate changes fastest after a Fed decision?', es: "¿La tasa de qué producto cambia más rápido tras una decisión de la Fed?", fr: "Le taux de quel produit change le plus vite après une décision de la Fed ?" },
          options: {
            ru: ['Уже выданная фиксированная ипотека', 'Кредитная карта / новый кредит', 'Ничего не меняется никогда', 'Только государственные облигации на 30 лет'],
            en: ['An already-issued fixed mortgage', 'A credit card / new loan', 'Nothing ever changes', 'Only 30-year government bonds'],
            es: ["Una hipoteca fija ya otorgada", "Una tarjeta de crédito / un préstamo nuevo", "Nunca cambia nada", "Solo los bonos del gobierno a 30 años"],
            fr: ["Un crédit immobilier à taux fixe déjà accordé", "Une carte de crédit / un nouveau prêt", "Rien ne change jamais", "Seulement les obligations d’État à 30 ans"],
          },
          correct: 1,
          explain: {
            ru: 'Кредитные карты и новые кредиты реагируют быстро; уже выданная фиксированная ипотека — нет, в этом её смысл.',
            en: "Credit cards and new loans react quickly; an already-issued fixed mortgage doesn't — that's the whole point of a fixed rate.", es: "Las tarjetas y los préstamos nuevos reaccionan rápido; una hipoteca fija ya otorgada no: ese es el sentido de la tasa fija.", fr: "Les cartes et les nouveaux prêts réagissent vite ; un crédit immobilier à taux fixe déjà accordé, non — c’est tout l’intérêt du taux fixe.",
          },
        },
      ],
    },
  },
  {
    key: 'investing_foundations',
    title: { ru: 'Основы инвестирования', en: 'Investing foundations', es: "Bases de inversión", fr: "Les bases de l’investissement" },
    source: 'SEC Investor.gov · FINRA · Yale (Robert Shiller, «Financial Markets»)',
    sourceUrl: 'https://www.investor.gov/',
    locked: true,
    comingSoon: true,
    description: {
      ru: 'Риск и доходность, диверсификация, как устроены комиссии фондов, как распознать признаки мошенничества — по материалам официального инвест-образования SEC/FINRA и открытого курса Йельского университета «Financial Markets» нобелевского лауреата Роберта Шиллера.',
      en: "Risk and return, diversification, how fund fees work, and how to spot the signs of fraud — drawn from SEC/FINRA's official investor-education materials and Yale's open course \"Financial Markets\" by Nobel laureate Robert Shiller.", es: "Riesgo y rendimiento, diversificación, cómo funcionan las comisiones de los fondos y cómo detectar señales de fraude — con materiales oficiales de educación al inversor de la SEC/FINRA y el curso abierto de Yale «Financial Markets» del Nobel Robert Shiller.", fr: "Risque et rendement, diversification, fonctionnement des frais de fonds, repérer les signes de fraude — d’après les ressources officielles de la SEC/FINRA et le cours ouvert de Yale « Financial Markets » du prix Nobel Robert Shiller.",
    },
  },
  {
    key: 'professional',
    title: { ru: 'Профессиональный уровень', en: 'Professional level', es: "Nivel profesional", fr: "Niveau professionnel" },
    source: 'CFA Institute Curriculum · NASAA Series 65 · MIT Sloan (Finance Theory I) · Wharton',
    sourceUrl: 'https://www.cfainstitute.org/programs/cfa-program/curriculum',
    locked: true,
    comingSoon: true,
    description: {
      ru: 'Акции, облигации, деривативы, портфельный менеджмент и этика — по карте тем реальной программы CFA (Level I–III) и лицензионного экзамена Series 65, дополненные материалами MIT Sloan «Finance Theory I» и Wharton. Тот же корпус знаний, что у практикующих инвест-профессионалов — объяснённый по-человечески и проверенный настоящим экзаменом.',
      en: 'Stocks, bonds, derivatives, portfolio management, and ethics — mapped to the real CFA program curriculum (Levels I-III) and the Series 65 licensing exam, supplemented with MIT Sloan\'s "Finance Theory I" and Wharton materials. The same body of knowledge practicing investment professionals study — explained plainly and checked with a real exam.', es: "Acciones, bonos, derivados, gestión de carteras y ética — siguiendo el temario real del programa CFA (niveles I–III) y del examen de licencia Series 65, con materiales de «Finance Theory I» de MIT Sloan y de Wharton. El mismo conocimiento que estudian los profesionales de la inversión — explicado con claridad y comprobado con un examen real.", fr: "Actions, obligations, dérivés, gestion de portefeuille et éthique — selon le programme réel du CFA (niveaux I–III) et l’examen de licence Series 65, complétés par « Finance Theory I » du MIT Sloan et des ressources de Wharton. Le même savoir que les professionnels de l’investissement — expliqué simplement et vérifié par un vrai examen.",
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
