import { CATEGORY_TREE, pickLang } from './categories.js'

export function billLabel(key, lang) {
  const category = CATEGORY_TREE.needs.find((item) => item.key === key)
  if (category) return pickLang(category.label, lang)
  if (key.startsWith('custom:')) {
    try { return decodeURIComponent(key.slice(7)) } catch { return key.slice(7) }
  }
  return key
}

export function budgetRows(budget = {}) {
  const keys = new Set([...CATEGORY_TREE.needs.map((c) => c.key), ...Object.keys(budget)])
  return [...keys].map((key) => ({
    id: key, key, name: billLabel(key, 'ru'),
    custom: !CATEGORY_TREE.needs.some((c) => c.key === key),
    amount: String(budget[key] || ''),
  }))
}

export function serializeBudget(rows) {
  const seen = new Set()
  return Object.fromEntries(rows.map((row) => {
    const name = row.name.trim()
    const amount = Number(String(row.amount).replace(',', '.'))
    const key = row.custom ? 'custom:' + encodeURIComponent(name) : row.key
    if (!name || !Number.isFinite(amount) || amount < 0 || seen.has(key.toLowerCase())) throw new Error('invalid')
    seen.add(key.toLowerCase())
    return [key, Math.round(amount * 100) / 100]
  }))
}
