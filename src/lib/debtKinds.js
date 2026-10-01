import * as db from './db'

// What kind of debt it is — a card, a loan from a friend, back taxes… Kept on
// the account (user metadata), keyed by debt id, so no database change is needed.
export const DEBT_KINDS = [
  { key: 'credit_card', label: { ru: 'Кредитная карта', en: 'Credit card', es: 'Tarjeta de crédito', fr: 'Carte de crédit' } },
  { key: 'personal_loan', label: { ru: 'Потребительский кредит', en: 'Personal loan', es: 'Préstamo personal', fr: 'Prêt personnel' } },
  { key: 'car_loan', label: { ru: 'Автокредит', en: 'Car loan', es: 'Préstamo de auto', fr: 'Crédit auto' } },
  { key: 'mortgage', label: { ru: 'Ипотека', en: 'Mortgage', es: 'Hipoteca', fr: 'Crédit immobilier' } },
  { key: 'student_loan', label: { ru: 'Кредит на учёбу', en: 'Student loan', es: 'Préstamo estudiantil', fr: 'Prêt étudiant' } },
  { key: 'installment', label: { ru: 'Рассрочка', en: 'Installment / buy now, pay later', es: 'Pago a plazos', fr: 'Paiement en plusieurs fois' } },
  { key: 'payday', label: { ru: 'Микрозайм / займ до зарплаты', en: 'Payday loan', es: 'Préstamo de día de pago', fr: 'Prêt sur salaire' } },
  { key: 'tax', label: { ru: 'Долг по налогам', en: 'Back taxes', es: 'Deuda de impuestos', fr: 'Dette fiscale' } },
  { key: 'fine', label: { ru: 'Штраф / долг по суду', en: 'Fine / court debt', es: 'Multa / deuda judicial', fr: 'Amende / dette judiciaire' } },
  { key: 'medical', label: { ru: 'Медицинский долг', en: 'Medical debt', es: 'Deuda médica', fr: 'Dette médicale' } },
  { key: 'person', label: { ru: 'Долг другу / родственнику', en: 'Loan from a friend / family', es: 'Deuda con un amigo / familiar', fr: 'Dette envers un proche' } },
  { key: 'other', label: { ru: 'Другое', en: 'Other', es: 'Otro', fr: 'Autre' } },
]

export function debtKindLabel(kind, lang) {
  const k = DEBT_KINDS.find((d) => d.key === kind)
  return k ? (k.label[lang] || k.label.en) : ''
}

export function getDebtKind(user, debtId) {
  return user?.user_metadata?.debt_kinds?.[debtId] || ''
}

// Records kinds for several debts at once; returns the updated user.
export async function saveDebtKinds(user, kindsById) {
  const entries = Object.entries(kindsById).filter(([id, kind]) => id && kind)
  if (!user || !entries.length) return user
  const merged = { ...(user.user_metadata?.debt_kinds || {}), ...Object.fromEntries(entries) }
  return db.saveUserMeta(user.id, { debt_kinds: merged })
}
