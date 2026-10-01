// Country of residence → currency. Amounts are entered and shown in the
// person's own currency (dong, rubles, euros…) — nothing is converted. The
// only place an exchange rate is used is to scale the few fixed dollar
// thresholds (the $500 starter cushion) to a sensible local round number.

// Country → currency for the places people most often live; the full region
// names come from the browser (Intl.DisplayNames) in the interface language.
export const COUNTRIES = {
  US: 'USD', CA: 'CAD', MX: 'MXN', GB: 'GBP', IE: 'EUR', DE: 'EUR', FR: 'EUR', ES: 'EUR', IT: 'EUR', PT: 'EUR',
  NL: 'EUR', BE: 'EUR', AT: 'EUR', FI: 'EUR', GR: 'EUR', CY: 'EUR', EE: 'EUR', LV: 'EUR', LT: 'EUR', ME: 'EUR',
  PL: 'PLN', CZ: 'CZK', CH: 'CHF', SE: 'SEK', NO: 'NOK', DK: 'DKK', RS: 'RSD', RO: 'RON', BG: 'BGN', HU: 'HUF',
  RU: 'RUB', UA: 'UAH', BY: 'BYN', KZ: 'KZT', UZ: 'UZS', KG: 'KGS', GE: 'GEL', AM: 'AMD', AZ: 'AZN', MD: 'MDL',
  TR: 'TRY', IL: 'ILS', AE: 'AED', SA: 'SAR', EG: 'EGP', IN: 'INR', TH: 'THB', VN: 'VND', ID: 'IDR', MY: 'MYR',
  SG: 'SGD', PH: 'PHP', CN: 'CNY', JP: 'JPY', KR: 'KRW', AU: 'AUD', NZ: 'NZD', BR: 'BRL', AR: 'ARS', CL: 'CLP',
  CO: 'COP', PE: 'PEN', DO: 'DOP', CR: 'CRC', ZA: 'ZAR', NG: 'NGN',
}

// Rough units per 1 USD, only for scaling fixed thresholds (see top).
const PER_USD = {
  USD: 1, CAD: 1.37, MXN: 18, GBP: 0.78, EUR: 0.9, PLN: 3.9, CZK: 23, CHF: 0.85, SEK: 10.5, NOK: 10.8, DKK: 6.8,
  RSD: 105, RON: 4.6, BGN: 1.8, HUF: 360, RUB: 90, UAH: 41, BYN: 3.3, KZT: 500, UZS: 12800, KGS: 87, GEL: 2.7,
  AMD: 390, AZN: 1.7, MDL: 18, TRY: 40, ILS: 3.7, AED: 3.67, SAR: 3.75, EGP: 49, INR: 85, THB: 34, VND: 26000,
  IDR: 16000, MYR: 4.4, SGD: 1.33, PHP: 57, CNY: 7.2, JPY: 150, KRW: 1380, AUD: 1.5, NZD: 1.65, BRL: 5.5,
  ARS: 1200, CLP: 940, COP: 4100, PEN: 3.7, DOP: 60, CRC: 510, ZAR: 18, NGN: 1550,
}

// Time zone → country, for a sensible default before the person picks one.
const TZ_COUNTRY = {
  'Asia/Ho_Chi_Minh': 'VN', 'Asia/Saigon': 'VN', 'Asia/Bangkok': 'TH', 'Asia/Jakarta': 'ID', 'Asia/Makassar': 'ID',
  'Asia/Bali': 'ID', 'Asia/Kuala_Lumpur': 'MY', 'Asia/Singapore': 'SG', 'Asia/Manila': 'PH', 'Asia/Shanghai': 'CN',
  'Asia/Tokyo': 'JP', 'Asia/Seoul': 'KR', 'Asia/Kolkata': 'IN', 'Asia/Dubai': 'AE', 'Asia/Jerusalem': 'IL',
  'Asia/Tbilisi': 'GE', 'Asia/Yerevan': 'AM', 'Asia/Baku': 'AZ', 'Asia/Almaty': 'KZ', 'Asia/Qostanay': 'KZ',
  'Asia/Tashkent': 'UZ', 'Asia/Bishkek': 'KG', 'Europe/Moscow': 'RU', 'Europe/Samara': 'RU', 'Asia/Yekaterinburg': 'RU',
  'Asia/Novosibirsk': 'RU', 'Asia/Krasnoyarsk': 'RU', 'Asia/Irkutsk': 'RU', 'Asia/Vladivostok': 'RU', 'Europe/Kaliningrad': 'RU',
  'Europe/Kyiv': 'UA', 'Europe/Kiev': 'UA', 'Europe/Minsk': 'BY', 'Europe/Chisinau': 'MD', 'Europe/Istanbul': 'TR',
  'Europe/Warsaw': 'PL', 'Europe/Prague': 'CZ', 'Europe/Belgrade': 'RS', 'Europe/Podgorica': 'ME', 'Europe/London': 'GB',
  'Europe/Dublin': 'IE', 'Europe/Berlin': 'DE', 'Europe/Paris': 'FR', 'Europe/Madrid': 'ES', 'Europe/Rome': 'IT',
  'Europe/Lisbon': 'PT', 'Europe/Amsterdam': 'NL', 'Europe/Brussels': 'BE', 'Europe/Vienna': 'AT', 'Europe/Zurich': 'CH',
  'Europe/Helsinki': 'FI', 'Europe/Athens': 'GR', 'Europe/Riga': 'LV', 'Europe/Vilnius': 'LT', 'Europe/Tallinn': 'EE',
  'Asia/Nicosia': 'CY', 'Europe/Stockholm': 'SE', 'Europe/Oslo': 'NO', 'Europe/Copenhagen': 'DK', 'Europe/Bucharest': 'RO',
  'Europe/Sofia': 'BG', 'Europe/Budapest': 'HU', 'America/Mexico_City': 'MX', 'America/Cancun': 'MX', 'America/Tijuana': 'MX',
  'America/Toronto': 'CA', 'America/Vancouver': 'CA', 'America/Sao_Paulo': 'BR', 'America/Argentina/Buenos_Aires': 'AR',
  'America/Santiago': 'CL', 'America/Bogota': 'CO', 'America/Lima': 'PE', 'America/Santo_Domingo': 'DO',
  'America/Costa_Rica': 'CR', 'Australia/Sydney': 'AU', 'Australia/Melbourne': 'AU', 'Pacific/Auckland': 'NZ',
  'Africa/Cairo': 'EG', 'Africa/Johannesburg': 'ZA', 'Africa/Lagos': 'NG',
}

export function guessCountry() {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
    if (TZ_COUNTRY[tz]) return TZ_COUNTRY[tz]
    if (tz && tz.startsWith('America/')) return 'US'
  } catch { /* ignore */ }
  try {
    const region = (navigator.language || '').split('-')[1]?.toUpperCase()
    if (region && COUNTRIES[region]) return region
  } catch { /* ignore */ }
  return 'US'
}

export function currencyFor(country) {
  return COUNTRIES[country] || 'USD'
}

export function countryName(code, lang) {
  try {
    return new Intl.DisplayNames([lang], { type: 'region' }).of(code) || code
  } catch {
    return code
  }
}

const LOCALES = { ru: 'ru-RU', en: 'en-US', es: 'es-ES', fr: 'fr-FR' }

// Stateless formatter — used on the server too (evening summary).
export function formatMoney(n, currency = 'USD', lang = 'en', { decimals = false } = {}) {
  const value = Number(n) || 0
  try {
    // Dollars keep the familiar $1,975 look whatever the interface language.
    return new Intl.NumberFormat(currency === 'USD' ? 'en-US' : LOCALES[lang] || 'en-US', {
      style: 'currency',
      currency,
      currencyDisplay: 'narrowSymbol',
      minimumFractionDigits: 0,
      maximumFractionDigits: decimals ? 2 : 0,
    }).format(decimals ? value : Math.round(value))
  } catch {
    return `${Math.round(value).toLocaleString('en-US')} ${currency}`
  }
}

export function currencySymbol(currency = 'USD', lang = 'en') {
  try {
    const part = new Intl.NumberFormat(LOCALES[lang] || 'en-US', { style: 'currency', currency, currencyDisplay: 'narrowSymbol' })
      .formatToParts(0).find((p) => p.type === 'currency')
    return part?.value || currency
  } catch {
    return currency
  }
}

// A fixed dollar amount (e.g. the $500 cushion) as a round local amount.
export function fromUsd(usd, currency = 'USD') {
  const raw = usd * (PER_USD[currency] || 1)
  if (raw <= 0) return 0
  const magnitude = Math.pow(10, Math.max(0, Math.floor(Math.log10(raw)) - 1))
  return Math.round(raw / magnitude) * magnitude
}

// The current person's currency, set once by the app (AppContext) so every
// screen and helper formats the same way without threading it through props.
let current = { currency: 'USD', lang: 'ru' }
export function setMoneyContext(currency, lang) {
  current = { currency: currency || 'USD', lang: lang || 'ru' }
}
export function getCurrency() {
  return current.currency
}
export function fmtMoney(n, opts) {
  return formatMoney(n, current.currency, current.lang, opts)
}
export function curSymbol() {
  return currencySymbol(current.currency, current.lang)
}
