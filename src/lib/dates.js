// Calendar dates ("2026-10-01") are stored as plain days. `new Date(str)`
// reads them as UTC midnight, which in the US is still the evening before —
// so the 1st of the month landed in the previous month, and a goal's
// deadline showed a day early. These keep a day a day, in local time.

export function toDate(value) {
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [y, m, d] = value.split('-').map(Number)
    return new Date(y, m - 1, d)
  }
  return new Date(value)
}

// Today (or the given moment) as a local "YYYY-MM-DD". toISOString() gives
// the UTC day, which after ~7–8pm in the US is already tomorrow.
export function todayStr(date = new Date()) {
  const pad = (n) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}
