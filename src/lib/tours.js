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
      title: { ru: 'Доход, расход или перевод', en: 'Income, expense or transfer', es: "Ingreso, gasto o transferencia", fr: "Revenu, dépense ou virement" },
      body: {
        ru: 'Сначала выбери, что записываешь. «Перевод» — когда деньги просто переехали между твоими счетами (снял наличные, закинул на карту). Это не трата.',
        en: 'First pick what you are logging. "Transfer" is money moving between your own accounts (cash withdrawal, card top-up) — not spending.',
        es: "Primero elige qué registras. «Transferencia» es dinero que se mueve entre tus propias cuentas (sacar efectivo, recargar una tarjeta), no un gasto.",
        fr: "Choisis d’abord ce que tu notes. « Virement » = de l’argent qui passe d’un de tes comptes à un autre (retrait, recharge de carte), pas une dépense.",
      },
    },
    {
      id: 'entry-money',
      title: { ru: 'Сумма и счёт', en: 'Amount and account', es: "Monto y cuenta", fr: "Montant et compte" },
      body: {
        ru: 'Сумма, дата и с какой карты или из наличных. Доход пришёл частями (кэш, чек, перевод)? «Разделить по счетам». С кредитки можно сразу включить ежедневное напоминание её погасить. В доходе «Сначала себе» сразу откладывает твой %.',
        en: 'Amount, date and which card or cash. Paid in parts (cash, check, transfer)? "Split across accounts". On a credit card you can turn on a daily pay-it-off reminder. For income, "Pay yourself first" sets your % aside right away.',
        es: "Monto, fecha y con qué tarjeta o efectivo. ¿Te pagaron en partes (efectivo, cheque, transferencia)? «Dividir entre cuentas». Con tarjeta de crédito puedes activar un recordatorio diario para pagarla. En ingresos, «Págate primero» aparta tu % de inmediato.",
        fr: "Montant, date et quelle carte ou espèces. Payé en plusieurs fois (espèces, chèque, virement) ? « Répartir entre comptes ». Sur une carte de crédit, tu peux activer un rappel quotidien pour la rembourser. Pour un revenu, « Payez-vous d’abord » met ton % de côté tout de suite.",
      },
    },
    {
      id: 'entry-category',
      title: { ru: 'Категория', en: 'Category', es: "Categoría", fr: "Catégorie" },
      body: {
        ru: 'Начни печатать — приложение само подскажет категорию. Нет подходящей? «+ Своя» в любом разделе, и свои подкатегории тоже. Всё сохраняется.',
        en: 'Start typing and it suggests a category. Nothing fits? "+ Your own" in any section, with your own subcategories too. They are saved.',
        es: "Empieza a escribir y te sugiere una categoría. ¿Nada encaja? «+ Propia» en cualquier sección, también con tus propias subcategorías. Se guardan.",
        fr: "Commence à taper et une catégorie est suggérée. Rien ne colle ? « + Perso » dans n’importe quelle section, avec tes propres sous-catégories. Elles sont enregistrées.",
      },
    },
  ],
  lessons: [
    {
      id: 'lessons-hero',
      title: { ru: 'Учёба', en: 'Learning', es: "Aprender", fr: "Apprendre" },
      body: {
        ru: 'Короткие уроки по 3–5 минут на твоих же цифрах: кредитки, проценты, подушка, инвестиции. Одного в день хватит — к каждому шагу Пути есть свой урок.',
        en: 'Short 3–5 minute lessons built on your own numbers: cards, interest, cushions, investing. One a day is plenty — each Path step has its own lesson.',
        es: "Lecciones cortas de 3–5 minutos basadas en tus propios números: tarjetas, intereses, colchón, inversión. Con una al día basta — cada paso del Camino tiene su lección.",
        fr: "De courtes leçons de 3–5 minutes basées sur tes propres chiffres : cartes, intérêts, épargne de secours, investissement. Une par jour suffit — chaque étape du Chemin a sa leçon.",
      },
    },
  ],
  debts: [
    {
      id: 'debts-list',
      title: { ru: 'Порядок погашения', en: 'Payoff order', es: "Orden de pago", fr: "Ordre de remboursement" },
      body: {
        ru: 'Первый в списке получает каждый лишний доллар, остальным — только минимум. Закрыл первый — его платёж переходит на следующий, и так до нуля.',
        en: 'The first one gets every spare dollar; the rest get just the minimum. Once it is gone, its payment rolls to the next — all the way to zero.',
        es: "La primera recibe cada dólar extra; las demás, solo el mínimo. Cuando la liquidas, su pago pasa a la siguiente — hasta llegar a cero.",
        fr: "La première reçoit chaque dollar en plus ; les autres, juste le minimum. Une fois soldée, son paiement passe à la suivante — jusqu’à zéro.",
      },
    },
  ],
  coach: [
    {
      id: 'coach-input',
      title: { ru: 'Пиши или говори', en: 'Type or talk', es: "Escribe o habla", fr: "Écris ou parle" },
      body: {
        ru: 'Нажми микрофон и расскажи своими словами, или напиши. Чем честнее — тем точнее план. Разговор хранится на телефоне; «Новый разговор» начинает заново.',
        en: 'Tap the mic and talk, or type. The more honest, the better the plan. The chat stays on your phone; "New conversation" starts fresh.',
        es: "Toca el micrófono y habla, o escribe. Cuanto más honesto, mejor el plan. El chat queda en tu teléfono; «Nueva conversación» empieza de cero.",
        fr: "Touche le micro et parle, ou écris. Plus tu es honnête, meilleur est le plan. La discussion reste sur ton téléphone ; « Nouvelle conversation » repart de zéro.",
      },
    },
  ],
  dashboard: [
    {
      id: 'dash-quote',
      title: { ru: 'Цитата и статистика дня', en: 'Quote & stat of the day', es: "Cita y dato del día", fr: "Citation et chiffre du jour" },
      body: {
        ru: 'Здесь каждый день новая мысль из книг по финансам — или реальная цифра из исследования (например, сколько людей в мире живут от зарплаты до зарплаты). Маленькая доза, но помогает не забывать, зачем всё это.',
        en: 'A new line from a finance book each day — or a real number from an actual study (e.g. how many people worldwide live paycheck to paycheck). A small dose, but it keeps the "why" in view.',
        es: "Cada día, una frase nueva de un libro de finanzas — o un dato real de un estudio (por ejemplo, cuánta gente en el mundo vive al día). Una dosis pequeña, pero mantiene a la vista el «para qué».",
        fr: "Chaque jour, une phrase d’un livre de finances — ou un vrai chiffre tiré d’une étude (par ex. combien de gens vivent d’une paie à l’autre). Une petite dose, mais elle garde le « pourquoi » en tête.",
      },
    },
    {
      id: 'dash-path',
      title: { ru: 'Путь — твой главный план', en: 'The Path — your main plan', es: "El Camino — tu plan principal", fr: "Le Chemin — ton plan principal" },
      body: {
        ru: 'Шесть шагов от «живу от зарплаты до зарплаты» до свободы: подушка $500 → месяц в запасе → долги → 3 месяца → инвестиции → большие цели. Здесь видно, на каком ты шаге и сколько осталось. Нажми на карточку — раскроются все шаги, урок и челлендж к текущему. «Сначала себе» — сколько % с каждого дохода откладывать сразу.',
        en: 'Six steps from paycheck-to-paycheck to freedom: $500 cushion → a month saved → debts → 3 months → investing → big goals. It shows which step you are on and what is left. Tap it to see every step plus a lesson and a challenge. "Pay yourself first" is the % of each income set aside right away.',
        es: "Seis pasos para dejar de vivir al día: colchón de $500 → un mes ahorrado → deudas → 3 meses → invertir → grandes metas. Muestra en qué paso estás y qué falta. Tócalo para ver cada paso con una lección y un reto. «Págate primero» es el % de cada ingreso que se aparta de inmediato.",
        fr: "Six étapes pour sortir du « paie à paie » : coussin de 500 $ → un mois d’avance → dettes → 3 mois → investir → grands objectifs. Il montre ton étape et ce qu’il reste. Touche-le pour voir chaque étape avec une leçon et un défi. « Payez-vous d’abord » = le % de chaque revenu mis de côté aussitôt.",
      },
    },
    {
      id: 'dash-coach',
      title: { ru: 'Финансовый друг (AI)', en: 'Money friend (AI)', es: "Amigo financiero (IA)", fr: "Ami financier (IA)" },
      body: {
        ru: 'Расскажи текстом или голосом, что происходит с деньгами — он видит твои цифры, задаст пару вопросов и скажет, с чего начать: что гасить первым, сколько копить. Долги и цели, о которых договоритесь, добавит в приложение в одно нажатие.',
        en: 'Tell it by text or voice what is going on — it sees your numbers, asks a couple of questions and tells you where to start. Debts and goals you agree on go into the app in one tap.',
        es: "Cuéntale por texto o voz qué está pasando — ve tus números, hace un par de preguntas y te dice por dónde empezar. Las deudas y metas que acuerden se agregan a la app con un toque.",
        fr: "Raconte-lui par écrit ou à voix haute ce qui se passe — il voit tes chiffres, pose quelques questions et te dit par où commencer. Les dettes et objectifs convenus s’ajoutent à l’app en un geste.",
      },
    },
    {
      id: 'dash-safe-to-spend',
      title: { ru: 'Можно потратить сегодня', en: 'Safe to spend today', es: "Puedes gastar hoy", fr: "Dépensable aujourd’hui" },
      body: {
        ru: 'Это не весь ваш баланс — это сколько можно потратить именно сегодня, чтобы спокойно дотянуть до конца месяца и не залезть в обязательные платежи. Если тратите меньше — отлично, если больше — стоит притормозить.',
        en: "This isn't your whole balance — it's how much you can spend today and still comfortably make it to month's end without eating into your fixed bills. Spend less — great. Spend more — worth slowing down.",
        es: "No es todo tu saldo — es cuánto puedes gastar hoy y aun así llegar tranquilo a fin de mes sin tocar tus pagos fijos. ¿Gastas menos? Genial. ¿Más? Conviene frenar.",
        fr: "Ce n’est pas tout ton solde — c’est ce que tu peux dépenser aujourd’hui en finissant le mois sereinement, sans toucher aux factures fixes. Moins ? Parfait. Plus ? Mieux vaut ralentir.",
      },
    },
    {
      id: 'dash-streak',
      title: { ru: 'Серия дней подряд', en: 'Daily streak', es: "Racha de días", fr: "Série de jours" },
      body: {
        ru: 'Каждый день отмечайте, откладывали ли вы деньги. Это не про суммы — это про привычку. Один пропущенный день серию не обнулит, а если и сорвёшься — начать заново можно в любой момент.',
        en: "Mark each day whether you set money aside. It's not about the amount — it's about the habit. One missed day won’t reset the streak — and if it does break, you can always start again.",
        es: "Marca cada día si apartaste dinero. No se trata del monto, sino del hábito. Un día perdido no reinicia la racha, y si se rompe, siempre puedes volver a empezar.",
        fr: "Note chaque jour si tu as mis de l’argent de côté. Ce n’est pas le montant qui compte, c’est l’habitude. Un jour manqué ne remet pas la série à zéro — et si elle casse, tu peux toujours recommencer.",
      },
    },
    {
      id: 'dash-accounts',
      title: { ru: 'Карты и счета', en: 'Cards & accounts', es: "Tarjetas y cuentas", fr: "Cartes et comptes" },
      body: {
        ru: 'Сколько у тебя наличными, на картах и сколько должен по кредиткам. Нажми — каждый счёт отдельно, там же оплата кредитки и ежедневное напоминание её погасить.',
        en: 'How much you have in cash, on cards, and owe on credit cards. Tap for each account — card payments and a daily pay-it-off reminder live there too.',
        es: "Cuánto tienes en efectivo, en tarjetas y cuánto debes en tarjetas de crédito. Toca para ver cada cuenta — ahí también están los pagos de tarjeta y el recordatorio diario para pagarla.",
        fr: "Ce que tu as en espèces, sur tes cartes, et ce que tu dois sur tes cartes de crédit. Touche pour voir chaque compte — les paiements de carte et le rappel quotidien de remboursement y sont aussi.",
      },
    },
    {
      id: 'dash-debts',
      title: { ru: 'Долги', en: 'Debts', es: "Deudas", fr: "Dettes" },
      body: {
        ru: 'Все долги в порядке погашения: сначала дорогие, среди них — самый маленький. Вносишь платёж — долг уменьшается, закрытый празднуется.',
        en: 'Every debt in payoff order: expensive first, smallest of those first. Log a payment and the balance drops; each one closed gets celebrated.',
        es: "Todas tus deudas en orden de pago: primero las caras, y entre ellas la más pequeña. Registra un pago y el saldo baja; cada una que cierras se celebra.",
        fr: "Toutes tes dettes dans l’ordre de remboursement : d’abord les chères, et parmi elles la plus petite. Note un paiement et le solde baisse ; chaque dette soldée est célébrée.",
      },
    },
    {
      id: 'dash-chart',
      title: { ru: 'Диаграмма трат', en: 'Spending chart', es: "Gráfico de gastos", fr: "Graphique des dépenses" },
      body: {
        ru: 'Каждый сектор — отдельная категория (Жильё, Транспорт и т.д.), а не просто «Обязательное/Необязательное». Нажмите на сектор или на его название в списке ниже — увидите, из чего конкретно она состоит (например, в Жильё: аренда, коммуналка, быт).',
        en: "Each slice is one category (Housing, Transport, etc.), not just a broad Needs/Wants split. Tap a slice or its name in the list below to see exactly what makes it up (e.g. Housing breaks into rent, utilities, household).",
        es: "Cada porción es una categoría (Vivienda, Transporte, etc.), no solo Necesidades/Deseos. Toca una porción o su nombre en la lista para ver de qué se compone (p. ej., Vivienda: renta, servicios, hogar).",
        fr: "Chaque part est une catégorie (Logement, Transport, etc.), pas seulement Besoins/Envies. Touche une part ou son nom dans la liste pour voir son détail (ex. Logement : loyer, charges, maison).",
      },
    },
    {
      id: 'dash-bills',
      title: { ru: 'Обязательные платежи', en: 'Bills & payments', es: "Pagos obligatorios", fr: "Paiements obligatoires" },
      body: {
        ru: 'Аренда, кредиты, коммуналка — то, что нужно платить в любом случае. На каждом можно поставить напоминание, чтобы не забыть про дату.',
        en: 'Rent, loans, utilities — the stuff you have to pay no matter what. You can set a reminder on any of them so the due date never sneaks up on you.',
        es: "Renta, préstamos, servicios — lo que hay que pagar sí o sí. Puedes poner un recordatorio en cualquiera para que la fecha nunca te tome por sorpresa.",
        fr: "Loyer, prêts, charges — ce qu’il faut payer quoi qu’il arrive. Tu peux mettre un rappel sur chacun pour ne jamais être surpris par l’échéance.",
      },
    },
  ],
  goals: [
    {
      id: 'goals-new',
      title: { ru: 'Как ставить цель', en: 'How to set a goal', es: "Cómo fijar una meta", fr: "Comment fixer un objectif" },
      body: {
        ru: 'Цель — это конкретная сумма и конкретная дата, например «$3000 к 1 декабря», а не расплывчатое «накопить побольше». Без даты легко откладывать бесконечно — с датой приложение может посчитать, сколько нужно откладывать в день.',
        en: 'A goal is a specific amount by a specific date — "$3,000 by December 1st", not a vague "save more". Without a date it\'s easy to put off forever; with one, the app can tell you exactly how much to set aside per day.',
        es: "Una meta es un monto concreto para una fecha concreta — «$3,000 para el 1 de diciembre», no un vago «ahorrar más». Sin fecha es fácil posponerla para siempre; con ella, la app te dice exactamente cuánto apartar por día.",
        fr: "Un objectif, c’est un montant précis pour une date précise — « 3 000 $ d’ici le 1er décembre », pas un vague « épargner plus ». Sans date, on repousse à l’infini ; avec, l’app te dit exactement combien mettre de côté par jour.",
      },
    },
    {
      id: 'goals-photo',
      title: { ru: 'Фото цели', en: 'Goal photo', es: "Foto de la meta", fr: "Photo de l’objectif" },
      body: {
        ru: 'Добавь фото того, ради чего копишь — машину, дом, маму. Оно будет на цели и на главной, чтобы каждый день видеть, зачем всё это.',
        en: 'Add a photo of what you are saving for — a car, a home, mom. It shows on the goal and the home screen so the "why" is always in view.',
        es: "Agrega una foto de aquello por lo que ahorras — un auto, una casa, mamá. Aparece en la meta y en la pantalla principal para que el «para qué» esté siempre a la vista.",
        fr: "Ajoute une photo de ce pour quoi tu épargnes — une voiture, une maison, maman. Elle s’affiche sur l’objectif et l’accueil pour garder le « pourquoi » sous les yeux.",
      },
    },
    {
      id: 'goals-plan',
      title: { ru: 'План: сколько откладывать', en: 'The plan: how much to set aside', es: "El plan: cuánto apartar", fr: "Le plan : combien mettre de côté" },
      body: {
        ru: 'Здесь видно, сколько нужно откладывать в день и в месяц, чтобы успеть к дедлайну, и хватает ли для этого вашего дохода после обязательных трат. Если не хватает — приложение честно об этом скажет и предложит варианты.',
        en: "This shows how much to set aside per day and per month to hit the deadline, and whether your income after fixed expenses can actually cover it. If it can't, the app says so honestly and suggests options.",
        es: "Muestra cuánto apartar por día y por mes para llegar a la fecha, y si tu ingreso después de los gastos fijos alcanza. Si no alcanza, la app te lo dice con honestidad y te propone opciones.",
        fr: "Il montre combien mettre de côté par jour et par mois pour tenir la date, et si ton revenu après les dépenses fixes le permet. Sinon, l’app te le dit franchement et propose des options.",
      },
    },
    {
      id: 'goals-reminder',
      title: { ru: 'Ежедневное напоминание', en: 'Daily reminder', es: "Recordatorio diario", fr: "Rappel quotidien" },
      body: {
        ru: 'Выберите удобное время — раз в день придёт напоминание, сколько осталось до цели и стоит ли сегодня что-то отложить.',
        en: "Pick a time that works for you — once a day you'll get a nudge on how much is left toward the goal and whether today is a good day to set something aside.",
        es: "Elige una hora que te convenga — una vez al día recibirás un aviso de cuánto falta para la meta y si hoy es buen día para apartar algo.",
        fr: "Choisis une heure qui te va — une fois par jour, un rappel te dira ce qu’il reste pour l’objectif et si c’est le bon jour pour mettre de côté.",
      },
    },
    {
      id: 'goals-vision',
      title: { ru: 'Раз в неделю с фото', en: 'Once a week, with the photo', es: "Una vez por semana, con la foto", fr: "Une fois par semaine, avec la photo" },
      body: {
        ru: 'Выбери день и время — придёт уведомление с фото цели и сколько осталось. Раз в неделю, чтобы не надоедало.',
        en: 'Pick a day and time — a notification arrives with the goal photo and what is left. Once a week, so it never nags.',
        es: "Elige día y hora — llega una notificación con la foto de la meta y lo que falta. Una vez por semana, para que nunca moleste.",
        fr: "Choisis un jour et une heure — une notification arrive avec la photo de l’objectif et ce qu’il reste. Une fois par semaine, jamais envahissant.",
      },
    },
  ],
  insights: [
    {
      id: 'insights-ask',
      title: { ru: 'Спроси про свои финансы', en: 'Ask about your finances', es: "Pregunta por tus finanzas", fr: "Pose une question sur tes finances" },
      body: {
        ru: 'Пишите обычными словами: «сколько я трачу на кафе», «успею ли к цели» — ответ строится по вашим же реальным данным, а не общими фразами.',
        en: 'Type it in plain words: "how much do I spend on eating out", "will I make my goal" — the answer is built from your own real data, not generic filler.',
        es: "Escríbelo con tus palabras: «cuánto gasto en comer fuera», «llegaré a mi meta» — la respuesta sale de tus datos reales, no de frases genéricas.",
        fr: "Écris-le simplement : « combien je dépense au resto », « vais-je atteindre mon objectif » — la réponse vient de tes vraies données, pas de généralités.",
      },
    },
    {
      id: 'insights-radar',
      title: { ru: 'Радар подписок', en: 'Subscription radar', es: "Radar de suscripciones", fr: "Radar d’abonnements" },
      body: {
        ru: 'Замечает повторяющиеся траты — если видит одинаковую сумму в Wants 2+ месяца подряд, спрашивает: это ещё нужная подписка или забытая? Работает по вручную введённым тратам; после привязки карты будет точнее и автоматически.',
        en: 'Spots repeating charges — if it sees the same amount in Wants for 2+ months running, it asks: still a subscription you want, or one you forgot about? Runs on manually logged spending for now; once card-linking ships it\'ll be automatic and more precise.',
        es: "Detecta cargos que se repiten — si ve el mismo monto en Deseos 2+ meses seguidos, te pregunta: ¿sigue siendo una suscripción que quieres o una que olvidaste? Por ahora funciona con gastos registrados a mano; cuando se vinculen las tarjetas será automático y más preciso.",
        fr: "Repère les débits qui se répètent — même montant en Envies 2 mois de suite ou plus ? Il demande : abonnement voulu ou oublié ? Pour l’instant, sur les dépenses saisies à la main ; avec les cartes liées, ce sera automatique et plus précis.",
      },
    },
    {
      id: 'insights-challenge',
      title: { ru: 'Челленджи', en: 'Challenges', es: "Retos", fr: "Défis" },
      body: {
        ru: 'Короткие вызовы вроде «3 дня без Wants-трат» — тренируют самоконтроль на практике, а не в теории.',
        en: 'Short challenges like "3 days with zero Wants spending" — training self-control in practice, not just in theory.',
        es: "Retos cortos como «3 días sin gastos en Deseos» — entrenan el autocontrol en la práctica, no solo en teoría.",
        fr: "De petits défis comme « 3 jours sans dépenses Envies » — pour entraîner la maîtrise de soi en pratique, pas seulement en théorie.",
      },
    },
    {
      id: 'insights-tax',
      title: { ru: 'Оценка налога', en: 'Tax estimate', es: "Estimación de impuestos", fr: "Estimation d’impôt" },
      body: {
        ru: 'Прикидка федерального налога по вашему доходу — не консультация бухгалтера, а быстрая ориентировка, чего примерно ожидать.',
        en: 'A rough estimate of your federal tax based on your income — not accountant advice, just a quick sense of what to expect.',
        es: "Una estimación aproximada de tu impuesto federal según tu ingreso — no es asesoría contable, solo una idea rápida de qué esperar.",
        fr: "Une estimation approximative de ton impôt fédéral selon ton revenu — pas un conseil de comptable, juste une idée rapide de ce qui t’attend.",
      },
    },
  ],
}
