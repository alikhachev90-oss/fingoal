// The account a debt payment or "set aside today" usually leaves — remembered
// per person, so it's picked once and then just stays right.
function key(userId, context) {
  return `fintera_pay_from_${userId}_${context}`
}

export function getPayFrom(userId, context, accounts) {
  let saved = ''
  try { saved = localStorage.getItem(key(userId, context)) || '' } catch { /* storage off */ }
  if (saved && accounts.some((a) => a.id === saved)) return saved
  // Money is paid out of cash or a bank account, not a credit card.
  return (accounts.find((a) => a.type !== 'credit') || accounts[0])?.id || ''
}

export function setPayFrom(userId, context, accountId) {
  try { localStorage.setItem(key(userId, context), accountId) } catch { /* storage off */ }
}
