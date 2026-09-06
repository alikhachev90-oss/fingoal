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
    title: { ru: 'Конкретная цель работает — расплывчатая нет', en: 'A specific goal works — a vague one doesn\'t' },
    body: {
      ru: '«Накопить побольше» откладывается бесконечно, потому что непонятно, когда остановиться. «$3000 к 1 декабря» — это то, под что можно посчитать план. Десятилетия исследований (теория постановки целей Локка и Латэма) показывают: конкретные, измеримые цели устойчиво работают лучше расплывчатых.',
      en: '"Save more" gets postponed forever because there\'s no line that says "enough." "$3,000 by December 1st" is something a plan can actually be built from. Decades of research (Locke & Latham\'s Goal-Setting Theory) show specific, measurable goals reliably outperform vague ones.',
    },
    source: { ru: 'Locke & Latham, теория постановки целей (2002)', en: 'Locke & Latham, Goal-Setting Theory (2002)' },
  },
  {
    id: 'short_long',
    title: { ru: 'Длинная цель = короткие шаги', en: 'A long-term goal = short-term steps' },
    body: {
      ru: 'Большая цель на год вперёд легко откладывается — до неё «ещё далеко». Разбейте её на дневную/месячную сумму (приложение делает это автоматически) и на препятствие + план: что именно может помешать откладывать и что вы сделаете в этот момент. Это и есть метод WOOP психолога Габриэле Эттинген — просто мечтать о результате работает хуже, чем заранее продумать конкретное препятствие и план на этот случай.',
      en: 'A big goal a year out is easy to put off — it always feels far away. Break it into a daily/monthly number (the app does this automatically) plus an obstacle + plan: what will actually get in the way of saving, and what you\'ll do when it does. That\'s psychologist Gabriele Oettingen\'s WOOP method — just picturing the outcome works worse than naming a concrete obstacle and a plan for it in advance.',
    },
    source: { ru: 'Oettingen & Gollwitzer, метод WOOP', en: 'Oettingen & Gollwitzer, the WOOP method' },
  },
  {
    id: 'why',
    title: { ru: 'Зачем вам это на самом деле?', en: 'What do you actually need this for?' },
    body: {
      ru: '«Хочу вертолёт» — это цель, выбранная ради статуса или момента, а не то, что на самом деле важно. Исследования мотивации (теория самодетерминации Деси и Райана) показывают: цели, выбранные из-за личных ценностей, доводятся до конца чаще, чем цели «для галочки» или ради того, что подумают другие. Прежде чем ставить крупную цель, спросите себя: что изменится в моей жизни, когда я её достигну? Если честный ответ — «ничего важного, просто хотелось» — возможно, стоит пересмотреть цель или сумму.',
      en: '"I want a helicopter" is a goal picked for status or a passing feeling, not for what actually matters to you. Motivation research (Deci & Ryan\'s Self-Determination Theory) shows goals chosen for personal reasons get followed through on more than goals chosen to impress someone or for the sake of having one. Before locking in a big goal, ask: what actually changes in my life once I have this? If the honest answer is "nothing important, I just wanted it" — the goal or the amount might be worth reconsidering.',
    },
    source: { ru: 'Deci & Ryan, теория самодетерминации', en: 'Deci & Ryan, Self-Determination Theory' },
  },
  {
    id: 'impulse',
    title: { ru: 'Радость от покупки проходит быстрее, чем кажется', en: 'The joy of a purchase fades faster than you\'d think' },
    body: {
      ru: 'Люди систематически переоценивают, насколько долго и сильно новая вещь сделает их счастливее (это называют «impact bias» — исследования Канемана и Гилберта). Психика возвращается к привычному уровню настроения — «гедонистическая беговая дорожка» — быстрее, чем кажется в момент желания. Это не значит «не покупайте» — значит, что перед большой необязательной целью полезно спросить себя ещё раз через неделю, всё ли так же хочется.',
      en: 'People systematically overestimate how much, and for how long, a new thing will make them happier — this is the "impact bias" (research by Kahneman and Gilbert). The mind drifts back to its normal mood level — the "hedonic treadmill" — faster than it feels like it will in the moment of wanting something. That doesn\'t mean "never buy it" — it means a big discretionary goal is worth re-checking a week later to see if it still feels as urgent.',
    },
    source: { ru: 'Kahneman/Gilbert; Diener, Lucas & Scollon (2006)', en: 'Kahneman/Gilbert; Diener, Lucas & Scollon (2006)' },
  },
]
