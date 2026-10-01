// Financial-literacy lessons. Each one opens with a scene or story (not a
// bullet list of tips), draws out the mechanism behind it, and closes with a
// paragraph computed from the user's OWN numbers — so it reads as "this is
// about your money," not a generic finance blog post.

import { deriveMonthlyIncome } from './finance'
import { toDate } from './dates'
import { fmtMoney } from './money.js'

function fmt(n) {
  return fmtMoney(n)
}

export const LESSONS = [
  {
    key: 'rule_502030',
    title: { ru: 'Почему одинаковая зарплата даёт разные жизни', en: 'Why the same salary gives different lives', es: "Por qué el mismo sueldo da vidas distintas", fr: "Pourquoi un même salaire donne des vies différentes" },
    minutes: 3,
    unlock: () => true,
    body: (ctx, lang) => {
      const needsTotal = Object.values(ctx.settings?.needs_budget || {}).reduce((s, v) => s + (v || 0), 0)
      const needsPct = ctx.monthlyIncome > 0 ? Math.round((needsTotal / ctx.monthlyIncome) * 100) : null
      if (lang === 'es') {
        return [
          `Toma a dos personas con el mismo sueldo. Diez años después, una tiene un departamento y un año de gastos ahorrado. La otra tiene el mismo ingreso, cero ahorros y un límite de crédito cada vez mayor. La diferencia casi nunca es cuánto ganaron. Es adónde fue primero cada dólar.`,
          `La regla 50/30/20 no trata de ahorrar: trata del orden de las operaciones. El 50% del ingreso cubre las Necesidades — aquello sin lo que la vida no funciona: vivienda, transporte, comida, salud. El 30% son Deseos — todo lo que hace la vida agradable pero no es esencial. Y solo el 20% es Ahorro — la única parte que de verdad cambia tu rumbo con los años. El problema es que la mayoría lo hace al revés: gasta primero todo lo que «no parece un derroche» y ahorra lo que sobre. Normalmente, nada.`,
          needsPct !== null
            ? `Tus números: los gastos esenciales (Necesidades) son ${fmt(needsTotal)}/mes, es decir, el ${needsPct}% de tu ingreso de ${fmt(ctx.monthlyIncome)}. ${needsPct > 50 ? 'Está por encima del 50% clásico — no es motivo de pánico, pero sí para buscar primero recortes justo en esta parte (renta, seguros, planes) en lugar de pelearte con el café.' : 'Encaja en la proporción clásica — tienes espacio real para el Ahorro; es cuestión de disciplina, no de falta de dinero.'}`
            : 'Completa tus ingresos en la configuración — aquí verás el cálculo con tus propios números.',
        ].join('\n\n')
      }
      if (lang === 'fr') {
        return [
          `Prends deux personnes avec le même salaire. Dix ans plus tard, l’une possède un appartement et a un an de dépenses de côté. L’autre a le même revenu, zéro épargne et un plafond de crédit qui grimpe. La différence n’est presque jamais ce qu’elles ont gagné. C’est où chaque dollar est allé en premier.`,
          `La règle 50/30/20 ne parle pas d’épargne : elle parle de l’ordre des opérations. 50 % du revenu couvre l’Essentiel — ce sans quoi la vie ne fonctionne pas : logement, transport, nourriture, santé. 30 %, ce sont les Envies — tout ce qui rend la vie agréable sans être indispensable. Et seulement 20 % pour l’Épargne — la seule part qui change vraiment ta trajectoire au fil des ans. Le problème, c’est que la plupart font l’inverse : dépenser d’abord tout ce qui « ne semble pas du gaspillage », puis épargner ce qui reste. Souvent, rien.`,
          needsPct !== null
            ? `Tes chiffres : tes dépenses essentielles sont de ${fmt(needsTotal)}/mois, soit ${needsPct} % de ton revenu de ${fmt(ctx.monthlyIncome)}. ${needsPct > 50 ? 'C’est au-dessus des 50 % classiques — pas de panique, mais une raison de chercher d’abord des économies sur cette partie précise (loyer, assurances, forfaits) plutôt que de rogner sur ton café.' : 'C’est dans la proportion classique — tu as une vraie marge pour l’Épargne ; c’est une question de discipline, pas de manque d’argent.'}`
            : 'Remplis ton revenu dans les réglages — tu verras ici le calcul avec tes propres chiffres.',
        ].join('\n\n')
      }
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
    title: { ru: 'Человек, который платил сам себе первым', en: 'The man who paid himself first', es: "El hombre que se pagaba primero a sí mismo", fr: "L’homme qui se payait d’abord lui-même" },
    minutes: 4,
    unlock: ({ goals }) => !goals.some((g) => /подушк/i.test(g.name)),
    body: (ctx, lang) => {
      const needsTotal = Object.values(ctx.settings?.needs_budget || {}).reduce((s, v) => s + (v || 0), 0)
      const target = needsTotal * 3
      if (lang === 'es') {
        return [
          `Una de las parábolas financieras más antiguas (de hace casi cien años) cuenta la historia de Arkad, un escriba no más rico que sus vecinos, hasta que un día notó algo simple: toda su vida había pagado a todos los que le cobraban — al casero, al mercader, al sastre — pero nunca se había pagado a sí mismo. Empezó a apartar una décima parte de su ingreso antes de gastar en cualquier otra cosa, y trató esa deuda consigo mismo como más importante que cualquier otra cuenta.`,
          `Un fondo de emergencia es exactamente el mismo principio aplicado al riesgo en lugar del crecimiento. No es una inversión para ganar rendimientos: es un seguro contra lo impredecible de la vida — un sueldo perdido, una reparación urgente, una emergencia de salud. Su único trabajo es comprarte tiempo para decidir con calma, en vez de lanzarte con pánico al primer préstamo caro que encuentres.`,
          needsTotal > 0
            ? `Tus números: tus gastos esenciales son ${fmt(needsTotal)}/mes, así que un colchón de 3 meses es ${fmt(target)}. Parece mucho, pero no es «ahórralo y olvídate»: es «ahórralo una vez y nunca más pidas prestado con pánico».`
            : 'Completa tus gastos esenciales en la configuración — aquí verás el tamaño exacto de tu colchón.',
        ].join('\n\n')
      }
      if (lang === 'fr') {
        return [
          `L’une des plus anciennes paraboles financières (presque centenaire) raconte l’histoire d’Arkad, un scribe pas plus riche que ses voisins — jusqu’au jour où il remarqua une chose simple : toute sa vie, il avait payé tous ceux qui lui présentaient une facture — le propriétaire, le marchand, le tailleur — mais ne s’était jamais payé lui-même. Il se mit à mettre de côté un dixième de ses revenus avant toute autre dépense, et traita cette dette envers lui-même comme plus importante que toutes les autres.`,
          `Une épargne de secours, c’est exactement le même principe appliqué au risque plutôt qu’à la croissance. Ce n’est pas un placement censé rapporter : c’est une assurance contre l’imprévu — un salaire perdu, une réparation urgente, un pépin de santé. Son seul rôle est de t’acheter du temps pour décider calmement, au lieu de foncer paniqué vers le premier crédit cher venu.`,
          needsTotal > 0
            ? `Tes chiffres : tes dépenses essentielles sont de ${fmt(needsTotal)}/mois, donc un coussin de 3 mois représente ${fmt(target)}. Ça paraît beaucoup, mais ce n’est pas « épargner et oublier » — c’est « épargner une fois et ne plus jamais emprunter dans la panique ».`
            : 'Remplis tes dépenses essentielles dans les réglages — tu verras ici la taille exacte de ton coussin.',
        ].join('\n\n')
      }
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
    title: { ru: 'Снежный ком или лавина: как гасить несколько долгов', en: 'Snowball or avalanche: paying off multiple debts', es: "Bola de nieve o avalancha: cómo pagar varias deudas", fr: "Boule de neige ou avalanche : rembourser plusieurs dettes" },
    minutes: 3,
    unlock: ({ settings }) => settings?.has_debts,
    body: (ctx, lang) => {
      const debts = ctx.debts || []
      const sorted = [...debts].sort((a, b) => (b.rate || 0) - (a.rate || 0))
      const worst = sorted[0]
      if (lang === 'es') {
        return [
          `Imagina que tienes tres deudas a la vez: una tarjeta al 24%, un plan a plazos al 8% y un préstamo sin intereses de un amigo. ¿Adónde va el primer dólar extra por encima de los pagos mínimos? La mayoría paga por intuición la deuda que «se siente» peor — a menudo la más vieja o la más grande — y pierde dinero real al hacerlo.`,
          `Hay dos métodos sistemáticos. «Bola de nieve»: pagar primero el saldo más pequeño, por una victoria psicológica rápida que te impide rendirte a la mitad. «Avalancha»: pagar primero la tasa más alta, que matemáticamente ahorra más dinero, porque una tasa alta es justo lo que más rápido te come. Cuando las tasas son muy distintas (como 24% vs 8%), la avalancha casi siempre gana en dólares; cuando son parecidas, la diferencia casi no importa y puedes elegir la bola de nieve por la motivación.`,
          debts.length > 0
            ? `Tus números: tienes ${debts.length} deuda${debts.length === 1 ? '' : 's'}${worst?.rate ? `, la tasa más alta es «${worst.name}» al ${worst.rate}% anual` : ''}. Con el método avalancha, cualquier dólar por encima de los mínimos del resto debería ir ahí primero.`
            : 'Agrega tus deudas — aquí verás exactamente por cuál empezar.',
        ].join('\n\n')
      }
      if (lang === 'fr') {
        return [
          `Imagine que tu as trois dettes à la fois : une carte à 24 %, un paiement échelonné à 8 % et un prêt sans intérêt d’un ami. Où va le premier dollar en plus des paiements minimums ? La plupart remboursent d’instinct la dette qui « paraît » la pire — souvent la plus ancienne ou la plus grosse — et perdent de l’argent réel au passage.`,
          `Il existe deux méthodes. « Boule de neige » : rembourser d’abord le plus petit solde, pour une victoire psychologique rapide qui évite d’abandonner à mi-chemin. « Avalanche » : rembourser d’abord le taux le plus élevé, ce qui économise mathématiquement le plus, car un taux élevé est justement ce qui te ronge le plus vite. Quand les taux sont très différents (24 % contre 8 %), l’avalanche gagne presque toujours en dollars ; quand ils sont proches, la différence compte peu et tu peux choisir la boule de neige pour la motivation.`,
          debts.length > 0
            ? `Tes chiffres : tu as ${debts.length} dette${debts.length === 1 ? '' : 's'}${worst?.rate ? `, le taux le plus élevé est « ${worst.name} » à ${worst.rate} % par an` : ''}. Avec la méthode avalanche, chaque dollar au-delà des minimums des autres dettes devrait aller là en premier.`
            : 'Ajoute tes dettes — tu verras ici exactement par laquelle commencer.',
        ].join('\n\n')
      }
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
    title: { ru: 'Откуда берётся «сколько откладывать в день»', en: 'Where "how much to save per day" comes from', es: "De dónde sale el «cuánto apartar por día»", fr: "D’où vient le « combien mettre de côté par jour »" },
    minutes: 3,
    unlock: ({ goals }) => goals.length > 0,
    body: (ctx, lang) => {
      const goal = ctx.goals?.[0]
      if (lang === 'es') {
        return [
          `La mayoría fija una meta financiera como un deseo — «quiero ahorrar para un coche» — sin un número que pueda revisarse mañana por la mañana. Un mes después, el deseo se convierte en una vaga culpa, no en un plan. La diferencia entre un sueño y una meta es una fecha límite y un desglose en la acción de hoy.`,
          `La mecánica es simple: el monto que falta se divide entre los días que quedan hasta la fecha — esa es la cantidad diaria. Súmala a tus Necesidades diarias y obtienes el «ingreso diario necesario». Si tu ingreso real por día es menor, ahí está tu brecha — y solo tiene dos arreglos honestos: mover la fecha o recortar Deseos. Las Necesidades y la meta en sí no se pueden recortar; si no, ya no es una meta, es autoengaño.`,
          goal
            ? `Tus números: para la meta «${goal.name}» de ${fmt(goal.target_amount)} la app ya calculó el monto diario exacto y el ingreso necesario. Revisa la pestaña Metas si hace tiempo que no miras la brecha actual.`
            : 'Crea una meta — aquí verás el cálculo con sus números reales.',
        ].join('\n\n')
      }
      if (lang === 'fr') {
        return [
          `La plupart fixent un objectif financier comme un souhait — « je veux économiser pour une voiture » — sans aucun chiffre vérifiable demain matin. Un mois plus tard, le souhait devient une vague culpabilité, pas un plan. La différence entre un rêve et un objectif, c’est une échéance et un découpage en action du jour.`,
          `Le mécanisme est simple : le montant restant est divisé par le nombre de jours jusqu’à l’échéance — c’est le montant quotidien. Ajoute-le à tes dépenses essentielles quotidiennes et tu obtiens le « revenu quotidien nécessaire ». Si ton revenu réel par jour est inférieur, voilà ton écart — et il n’a que deux solutions honnêtes : repousser l’échéance ou réduire les Envies. L’Essentiel et l’objectif lui-même ne se rognent pas ; sinon ce n’est plus un objectif, c’est de l’auto-illusion.`,
          goal
            ? `Tes chiffres : pour l’objectif « ${goal.name} » de ${fmt(goal.target_amount)}, l’app a déjà calculé le montant quotidien exact et le revenu nécessaire. Ouvre l’onglet Objectifs si tu n’as pas regardé l’écart actuel depuis un moment.`
            : 'Crée un objectif — tu verras ici le calcul avec ses vrais chiffres.',
        ].join('\n\n')
      }
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
    title: { ru: 'Эффект тысячи порезов', en: 'Death by a thousand cuts', es: "Muerte por mil cortes", fr: "La mort par mille coupures" },
    minutes: 2,
    unlock: ({ transactions }) => transactions.filter((t) => t.group === 'wants').length >= 5,
    body: (ctx, lang) => {
      const now = new Date()
      const monthWants = (ctx.transactions || []).filter((t) => {
        const d = toDate(t.date)
        return t.group === 'wants' && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
      })
      const total = monthWants.reduce((s, t) => s + t.amount, 0)
      if (lang === 'es') {
        return [
          `Recuerdas tu renta al dólar: es un solo cargo grande, una vez al mes. Pero el café camino al trabajo, la comida a domicilio en vez de cocinar, una suscripción más «para probar» — cada una es demasiado pequeña para recordarla, y juntas forman la «muerte por mil cortes»: ninguna herida es mortal, pero la pérdida de sangre es real.`,
          `Por eso los Deseos no son gastos que haya que prohibir: son gastos que hay que VER en el momento de decidir. No después, a fin de mes, cuando ya es tarde, sino justo al pagar — con un precio concreto en días hasta tu meta, no con un porcentaje abstracto.`,
          `Tus números: este mes los Deseos ya suman ${fmt(total)} en ${monthWants.length} compra${monthWants.length === 1 ? '' : 's'}. Ninguna parecía grave por sí sola — ese es todo el mecanismo.`,
        ].join('\n\n')
      }
      if (lang === 'fr') {
        return [
          `Tu connais ton loyer au dollar près : c’est un seul gros prélèvement, une fois par mois. Mais le café en allant au travail, la livraison au lieu de cuisiner, un abonnement de plus « pour essayer » — chacun est trop petit pour qu’on s’en souvienne, et ensemble ils forment la « mort par mille coupures » : aucune blessure n’est fatale, mais l’hémorragie est réelle.`,
          `C’est pour ça que les Envies ne sont pas des dépenses à interdire : ce sont des dépenses à VOIR au moment de décider. Pas après coup en fin de mois, quand il est trop tard, mais au moment de payer — avec un prix concret en jours jusqu’à ton objectif, pas un pourcentage abstrait.`,
          `Tes chiffres : ce mois-ci, les Envies totalisent déjà ${fmt(total)} en ${monthWants.length} achat${monthWants.length === 1 ? '' : 's'}. Aucun ne semblait grave pris seul — c’est tout le mécanisme.`,
        ].join('\n\n')
      }
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
    title: { ru: 'Куда исчезает каждая прибавка к зарплате', en: 'Where every raise disappears to', es: "Adónde se va cada aumento de sueldo", fr: "Où disparaît chaque augmentation" },
    minutes: 3,
    unlock: ({ monthTx, monthlyIncome }) => monthlyIncome > 0 && monthTx.wants > monthlyIncome * 0.3,
    body: (ctx, lang) => {
      const pct = ctx.monthlyIncome > 0 ? Math.round((ctx.monthTx.wants / ctx.monthlyIncome) * 100) : 0
      if (lang === 'es') {
        return [
          `Un patrón clásico de carrera: el ingreso sube cada par de años, pero a fin de mes nunca sobra más dinero. No es que los nuevos gastos sean innecesarios: el departamento más grande, el coche nuevo, las suscripciones mejores no llegan porque decidiste ahorrar menos; llegan porque el nuevo nivel de gasto empezó a sentirse normal antes de que lo notaras. Eso es la inflación del estilo de vida: sube al mismo ritmo que el ingreso y se come justo la parte que debía ir al Ahorro.`,
          `La diferencia entre quien termina construyendo patrimonio y quien no casi nunca es el tamaño del sueldo. Es una regla simple: mandar un porcentaje fijo de CADA aumento al Ahorro antes de que el nuevo ingreso tenga tiempo de convertirse en el nuevo nivel normal de gasto.`,
          `Tus números: este mes los Deseos ya fueron el ${pct}% del ingreso — bastante más que el 30% estándar. No siempre es malo (a veces es un mes puntual con regalos o un viaje), pero vale la pena preguntarte un segundo: ¿es una excepción o la nueva normalidad?`,
        ].join('\n\n')
      }
      if (lang === 'fr') {
        return [
          `Un schéma de carrière classique : le revenu augmente tous les deux ou trois ans, mais il ne reste jamais plus d’argent en fin de mois. Ce n’est pas que les nouvelles dépenses soient inutiles : le plus grand appartement, la nouvelle voiture, les abonnements montés en gamme n’arrivent pas parce que tu as décidé d’épargner moins ; ils arrivent parce que le nouveau niveau de dépense est devenu normal avant que tu t’en aperçoives. C’est l’inflation du train de vie : elle monte au même rythme que le revenu et mange précisément la part qui devait aller à l’Épargne.`,
          `La différence entre ceux qui finissent par bâtir un patrimoine et les autres n’est presque jamais le montant du salaire. C’est une règle simple : envoyer un pourcentage fixe de CHAQUE augmentation vers l’Épargne avant que le nouveau revenu ait le temps de devenir le nouveau niveau normal de dépense.`,
          `Tes chiffres : ce mois-ci, les Envies représentent déjà ${pct} % du revenu — nettement au-dessus des 30 % habituels. Ce n’est pas toujours grave (parfois c’est un mois exceptionnel avec des cadeaux ou un voyage), mais ça vaut la peine de te demander une seconde : exception ponctuelle ou nouvelle normalité ?`,
        ].join('\n\n')
      }
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
    const d = toDate(t.date)
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
  })
  const monthTx = { wants: monthTxList.filter((t) => t.group === 'wants').reduce((s, t) => s + t.amount, 0) }

  // Income derived from logged transactions — the signup figure is gone.
  const ctx = { settings, debts, goals, transactions, monthTx, monthlyIncome: deriveMonthlyIncome(transactions, now) }

  return LESSONS.map((lesson) => ({
    ...lesson,
    title: lesson.title[lang] || lesson.title.en || lesson.title.ru,
    unlocked: Boolean(lesson.unlock(ctx)),
    body: lesson.body(ctx, lang),
  }))
}
