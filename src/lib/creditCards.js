// Accounts/cards: separate a person's spending by which card/account it went
// on, and — for credit cards specifically — surface what's actually
// confusing about them (grace period, minimum payment trap, utilization)
// with real numbers computed from the user's own balance, not just text.
//
// No real bank balance exists here (that needs Plaid — see plaidSync.js).
// A credit card's "balance" is derived: every transaction tagged with that
// account's id adds to it, and a recorded payment (is_payment: true)
// subtracts. This is honest about being an estimate the user must keep in
// sync themselves, same limitation as the rest of the manual-entry app.

export function computeAccountBalance(account, transactions) {
  let balance = 0
  for (const t of transactions) {
    if (t.account_id !== account.id) continue
    const amt = Number(t.amount || 0)
    // A transfer is two linked rows tagged with the same account fields as a
    // normal transaction, distinguished by group:'transfer' + transfer_direction.
    // The 'in' leg behaves like money arriving (income for cash/debit, a
    // payment for credit); the 'out' leg falls through to the normal
    // spend/debt-add branch below, same as any other transaction leaving the account.
    const isTransferIn = t.group === 'transfer' && t.transfer_direction === 'in'
    if (account.type === 'credit') {
      // Credit balance = what's owed: a purchase adds debt, a recorded payment reduces it.
      balance += (t.is_payment || isTransferIn) ? -amt : amt
    } else {
      // Cash/debit balance = what's actually there: income adds, spending subtracts.
      balance += (t.group === 'income' || isTransferIn) ? amt : -amt
    }
  }
  return Math.round(balance * 100) / 100
}

export function computeUtilization(account, balance) {
  if (!account.credit_limit || account.credit_limit <= 0) return null
  return Math.max(0, Math.round((balance / account.credit_limit) * 1000) / 10)
}

// Next occurrence (today or in the future) of a given day-of-month, clamped
// to the last day of a shorter month (e.g. day 31 in February -> Feb 28/29).
export function nextDateForDay(day, today = new Date()) {
  const clamp = (y, m) => Math.min(day, new Date(y, m + 1, 0).getDate())
  let y = today.getFullYear()
  let m = today.getMonth()
  let d = new Date(y, m, clamp(y, m))
  if (d < new Date(today.getFullYear(), today.getMonth(), today.getDate())) {
    m += 1
    if (m > 11) { m = 0; y += 1 }
    d = new Date(y, m, clamp(y, m))
  }
  return d
}

export function daysUntil(date, today = new Date()) {
  const a = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const b = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  return Math.round((b - a) / 86400000)
}

// Plain-language credit card mechanics — the exact confusion the user
// described. Facts checked against CFPB / myFICO / Experian, not invented:
// grace period is federally required to be at least 21 days from statement
// close to due date; minimum payment is typically ~1-2% of balance (or a
// flat floor like $25-40) and is designed to barely cover interest, so it
// can take years to clear a balance that way; utilization under 30% avoids
// the sharpest score hit, under ~10% is where the best scores tend to sit;
// FICO weighs payment history 35%, utilization 30%, history length 15%,
// new credit 10%, credit mix 10%.
export function getCreditTips(lang = 'ru') {
  const tips = [
    {
      title: { ru: 'Дата закрытия выписки vs дата платежа — это разное', en: 'Statement close date vs. due date — not the same thing', es: "Fecha de cierre vs. fecha de pago: no son lo mismo", fr: "Date de clôture vs date d’échéance — pas la même chose" },
      body: {
        ru: 'Выписка закрывается в один день — с этого момента считается баланс к оплате. Платить нужно позже, обычно есть минимум 21 день на это (так требует закон). Это и есть грейс-период.',
        en: 'The statement closes on one date — that\'s the balance you owe. You pay later, usually with at least 21 days in between (required by law). That gap is the grace period.', es: "El estado de cuenta cierra en una fecha: ese es el saldo que debes. Pagas después, normalmente con al menos 21 días de diferencia (lo exige la ley). Ese intervalo es el período de gracia.", fr: "Le relevé se clôture à une date — c’est le solde dû. Tu paies plus tard, en général au moins 21 jours après (c’est la loi). Cet écart, c’est le délai de grâce.",
      },
    },
    {
      title: { ru: 'Платите весь баланс — не минимум', en: 'Pay the full balance — not the minimum', es: "Paga el saldo completo, no el mínimo", fr: "Paie le solde total — pas le minimum" },
      body: {
        ru: 'Если оплатить весь баланс до due date — проценты не начисляются вообще. Оплатите хотя бы на доллар меньше — грейс-период пропадает, и проценты начинают капать на всё, часто задним числом с даты покупки.',
        en: "Pay the full statement balance by the due date and you owe zero interest. Pay even a dollar less and you lose the grace period — interest starts accruing on everything, often backdated to the purchase date.", es: "Paga el saldo completo del estado de cuenta antes de la fecha y no pagas intereses. Paga aunque sea un dólar menos y pierdes el período de gracia: los intereses corren sobre todo, a menudo desde la fecha de compra.", fr: "Paie le solde total du relevé avant l’échéance et tu ne paies aucun intérêt. Un dollar de moins et tu perds le délai de grâce — les intérêts courent sur tout, souvent depuis la date d’achat.",
      },
    },
    {
      title: { ru: 'Минимальный платёж — ловушка', en: 'The minimum payment is a trap', es: "El pago mínimo es una trampa", fr: "Le paiement minimum est un piège" },
      body: {
        ru: 'Минимум обычно ~1-2% от баланса — рассчитан так, чтобы едва покрывать проценты. Платя только минимум, можно годами не уменьшать сам долг и переплатить в разы больше исходной суммы.',
        en: 'The minimum is usually ~1-2% of the balance — designed to barely cover interest. Pay only the minimum and the principal can stay flat for years while you pay multiples of the original amount in interest.', es: "El mínimo suele ser ~1–2% del saldo, pensado para apenas cubrir los intereses. Si pagas solo el mínimo, la deuda puede quedarse igual por años mientras pagas en intereses varias veces el monto original.", fr: "Le minimum représente souvent ~1–2 % du solde — juste de quoi couvrir les intérêts. En ne payant que lui, le capital peut stagner des années pendant que tu paies plusieurs fois la somme initiale en intérêts.",
      },
    },
    {
      title: { ru: 'Загрузка кредита (utilization)', en: 'Credit utilization', es: "Uso del crédito", fr: "Taux d’utilisation du crédit" },
      body: {
        ru: 'Это баланс делённый на лимит. Держите ниже 30%, чтобы не терять в скоринге заметно; для лучших скорингов — обычно однозначные проценты (<10%). Это ~30% веса в самом скоринге FICO.',
        en: "That's your balance divided by your limit. Keep it under 30% to avoid a real score hit; the best scores usually sit under ~10%. This alone is about 30% of the FICO score itself.", es: "Es tu saldo dividido entre tu límite. Mantenlo bajo el 30% para no dañar tu puntaje; los mejores puntajes suelen estar bajo ~10%. Solo esto es cerca del 30% del puntaje FICO.", fr: "C’est ton solde divisé par ton plafond. Reste sous 30 % pour éviter un vrai impact sur ta cote ; les meilleures cotes sont souvent sous ~10 %. Ce seul facteur pèse environ 30 % du score FICO.",
      },
    },
    {
      title: { ru: 'Из чего вообще состоит кредитный скоринг', en: "What actually makes up a credit score", es: "De qué se compone un puntaje de crédito", fr: "De quoi se compose une cote de crédit" },
      body: {
        ru: 'История платежей вовремя — 35%, загрузка кредита — 30%, длина кредитной истории — 15%, новые кредиты — 10%, разнообразие кредитов — 10% (модель FICO).',
        en: 'On-time payment history — 35%, utilization — 30%, length of credit history — 15%, new credit — 10%, credit mix — 10% (FICO model).', es: "Historial de pagos a tiempo: 35%, uso del crédito: 30%, antigüedad del historial: 15%, crédito nuevo: 10%, mezcla de créditos: 10% (modelo FICO).", fr: "Historique de paiements à temps — 35 %, utilisation — 30 %, ancienneté du crédit — 15 %, nouveaux crédits — 10 %, diversité des crédits — 10 % (modèle FICO).",
      },
    },
  ]
  return tips.map((t) => ({ title: t.title[lang] || t.title.en || t.title.ru, body: t.body[lang] || t.body.en || t.body.ru }))
}
