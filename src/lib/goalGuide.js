// Goal-setting education: short, source-grounded explanations of *why* the
// goal form asks for what it asks for, plus the psychological side the user
// asked to cover explicitly — someone typing "I want a helicopter" should be
// nudged to notice they haven't asked themselves why yet.
//
// Every claim here is traceable to a real named researcher/theory (checked via
// research pass, same "no invented facts" bar as lib/creditCards.js):
// - Locke & Latham, Goal-Setting Theory (American Psychologist, 2002) — specific,
//   measurable goals reliably outperform vague ones ("save more") across decades
//   of replicated research; no invented percentage attached.
// - Gabriele Oettingen (NYU) & Peter Gollwitzer — mental contrasting / WOOP
//   (Wish-Outcome-Obstacle-Plan) — pairing a goal with a concrete obstacle and a
//   plan beats just picturing the outcome.
// - Deci & Ryan, Self-Determination Theory — goals pursued for personal/intrinsic
//   reasons are followed through on more than goals chosen for status/external
//   approval.
// - Kahneman/Gilbert (affective forecasting, "impact bias") and Diener, Lucas &
//   Scollon, "Beyond the Hedonic Treadmill" (American Psychologist, 2006) —
//   people adapt back to their baseline happiness after a purchase faster and
//   more fully than they expect.
//
// Deep content, so ru/en only (same convention as lessons.js/tours.js) — falls
// back to ru for es/fr users.

export const GOAL_TIPS = [
  {
    id: 'specific',
    title: { ru: 'Конкретная цель работает — расплывчатая нет', en: 'A specific goal works — a vague one doesn\'t', es: "Una meta concreta funciona; una vaga, no", fr: "Un objectif précis marche — un objectif flou, non" },
    body: {
      ru: '«Накопить побольше» откладывается бесконечно, потому что непонятно, когда остановиться. «$3000 к 1 декабря» — это то, под что можно посчитать план. Десятилетия исследований (теория постановки целей Локка и Латэма) показывают: конкретные, измеримые цели устойчиво работают лучше расплывчатых.',
      en: '"Save more" gets postponed forever because there\'s no line that says "enough." "$3,000 by December 1st" is something a plan can actually be built from. Decades of research (Locke & Latham\'s Goal-Setting Theory) show specific, measurable goals reliably outperform vague ones.', es: "«Ahorrar más» se pospone para siempre porque no hay una línea que diga «suficiente». «$3,000 para el 1 de diciembre» es algo con lo que sí se puede armar un plan. Décadas de investigación (teoría de fijación de metas de Locke y Latham) muestran que las metas concretas y medibles superan a las vagas.", fr: "« Épargner plus » est repoussé à l’infini car rien ne dit « assez ». « 3 000 $ d’ici le 1er décembre », c’est quelque chose sur quoi bâtir un plan. Des décennies de recherche (théorie des objectifs de Locke et Latham) montrent que les objectifs précis et mesurables battent les objectifs flous.",
    },
    source: { ru: 'Locke & Latham, теория постановки целей (2002)', en: 'Locke & Latham, Goal-Setting Theory (2002)', es: "Locke y Latham, teoría de fijación de metas (2002)", fr: "Locke et Latham, théorie de la fixation d’objectifs (2002)" },
  },
  {
    id: 'short_long',
    title: { ru: 'Длинная цель = короткие шаги', en: 'A long-term goal = short-term steps', es: "Meta a largo plazo = pasos cortos", fr: "Objectif lointain = petits pas" },
    body: {
      ru: 'Большая цель на год вперёд легко откладывается — до неё «ещё далеко». Разбейте её на дневную/месячную сумму (приложение делает это автоматически) и на препятствие + план: что именно может помешать откладывать и что вы сделаете в этот момент. Это и есть метод WOOP психолога Габриэле Эттинген — просто мечтать о результате работает хуже, чем заранее продумать конкретное препятствие и план на этот случай.',
      en: 'A big goal a year out is easy to put off — it always feels far away. Break it into a daily/monthly number (the app does this automatically) plus an obstacle + plan: what will actually get in the way of saving, and what you\'ll do when it does. That\'s psychologist Gabriele Oettingen\'s WOOP method — just picturing the outcome works worse than naming a concrete obstacle and a plan for it in advance.', es: "Una meta grande a un año es fácil de posponer: siempre parece lejana. Divídela en un número diario/mensual (la app lo hace sola) más un obstáculo y un plan: qué te impedirá ahorrar y qué harás cuando pase. Es el método WOOP de la psicóloga Gabriele Oettingen: solo imaginar el resultado funciona peor que nombrar de antemano un obstáculo concreto y un plan.", fr: "Un grand objectif à un an se repousse facilement — il semble toujours loin. Découpe-le en montant quotidien/mensuel (l’app le fait seule) plus un obstacle et un plan : ce qui va vraiment gêner ton épargne, et ce que tu feras alors. C’est la méthode WOOP de la psychologue Gabriele Oettingen — imaginer le résultat marche moins bien que nommer à l’avance un obstacle concret et un plan.",
    },
    source: { ru: 'Oettingen & Gollwitzer, метод WOOP', en: 'Oettingen & Gollwitzer, the WOOP method', es: "Oettingen y Gollwitzer, método WOOP", fr: "Oettingen et Gollwitzer, méthode WOOP" },
  },
  {
    id: 'why',
    title: { ru: 'Зачем вам это на самом деле?', en: 'What do you actually need this for?', es: "¿Para qué lo necesitas de verdad?", fr: "Pourquoi en as-tu vraiment besoin ?" },
    body: {
      ru: '«Хочу вертолёт» — это цель, выбранная ради статуса или момента, а не то, что на самом деле важно. Исследования мотивации (теория самодетерминации Деси и Райана) показывают: цели, выбранные из-за личных ценностей, доводятся до конца чаще, чем цели «для галочки» или ради того, что подумают другие. Прежде чем ставить крупную цель, спросите себя: что изменится в моей жизни, когда я её достигну? Если честный ответ — «ничего важного, просто хотелось» — возможно, стоит пересмотреть цель или сумму.',
      en: '"I want a helicopter" is a goal picked for status or a passing feeling, not for what actually matters to you. Motivation research (Deci & Ryan\'s Self-Determination Theory) shows goals chosen for personal reasons get followed through on more than goals chosen to impress someone or for the sake of having one. Before locking in a big goal, ask: what actually changes in my life once I have this? If the honest answer is "nothing important, I just wanted it" — the goal or the amount might be worth reconsidering.', es: "«Quiero un helicóptero» es una meta elegida por estatus o por un impulso, no por lo que de verdad te importa. La investigación sobre motivación (teoría de la autodeterminación de Deci y Ryan) muestra que las metas elegidas por razones personales se cumplen más que las elegidas para impresionar. Antes de fijar una meta grande, pregúntate: ¿qué cambia de verdad en mi vida cuando la tenga? Si la respuesta honesta es «nada importante, solo lo quería», quizá convenga replantear la meta o el monto.", fr: "« Je veux un hélicoptère » est un objectif choisi pour le statut ou une envie passagère, pas pour ce qui compte vraiment. Les recherches sur la motivation (théorie de l’autodétermination de Deci et Ryan) montrent qu’on va plus souvent au bout des objectifs choisis pour des raisons personnelles que de ceux choisis pour impressionner. Avant de fixer un gros objectif, demande-toi : qu’est-ce qui change vraiment dans ma vie une fois que je l’ai ? Si la réponse honnête est « rien d’important, j’en avais juste envie » — l’objectif ou le montant mérite peut-être d’être revu.",
    },
    source: { ru: 'Deci & Ryan, теория самодетерминации', en: 'Deci & Ryan, Self-Determination Theory', es: "Deci y Ryan, teoría de la autodeterminación", fr: "Deci et Ryan, théorie de l’autodétermination" },
  },
  {
    id: 'impulse',
    title: { ru: 'Радость от покупки проходит быстрее, чем кажется', en: 'The joy of a purchase fades faster than you\'d think', es: "La alegría de una compra se esfuma más rápido de lo que crees", fr: "La joie d’un achat s’efface plus vite qu’on ne croit" },
    body: {
      ru: 'Люди систематически переоценивают, насколько долго и сильно новая вещь сделает их счастливее (это называют «impact bias» — исследования Канемана и Гилберта). Психика возвращается к привычному уровню настроения — «гедонистическая беговая дорожка» — быстрее, чем кажется в момент желания. Это не значит «не покупайте» — значит, что перед большой необязательной целью полезно спросить себя ещё раз через неделю, всё ли так же хочется.',
      en: 'People systematically overestimate how much, and for how long, a new thing will make them happier — this is the "impact bias" (research by Kahneman and Gilbert). The mind drifts back to its normal mood level — the "hedonic treadmill" — faster than it feels like it will in the moment of wanting something. That doesn\'t mean "never buy it" — it means a big discretionary goal is worth re-checking a week later to see if it still feels as urgent.', es: "La gente sobreestima sistemáticamente cuánto y por cuánto tiempo algo nuevo la hará feliz: es el «sesgo de impacto» (investigaciones de Kahneman y Gilbert). La mente vuelve a su nivel de ánimo normal —la «cinta hedónica»— más rápido de lo que parece cuando deseas algo. No significa «nunca lo compres», sino que vale la pena revisar una meta grande por gusto una semana después para ver si sigue siendo igual de urgente.", fr: "On surestime systématiquement combien et combien de temps un objet neuf nous rendra heureux — c’est le « biais d’impact » (recherches de Kahneman et Gilbert). L’humeur revient à son niveau habituel — le « tapis roulant hédonique » — plus vite qu’on ne l’imagine au moment de l’envie. Ça ne veut pas dire « ne l’achète jamais » : un gros objectif plaisir mérite d’être revu une semaine plus tard pour voir s’il semble toujours aussi urgent.",
    },
    source: { ru: 'Kahneman/Gilbert; Diener, Lucas & Scollon (2006)', en: 'Kahneman/Gilbert; Diener, Lucas & Scollon (2006)', es: 'Kahneman/Gilbert; Diener, Lucas y Scollon (2006)', fr: 'Kahneman/Gilbert ; Diener, Lucas et Scollon (2006)' },
  },
]
