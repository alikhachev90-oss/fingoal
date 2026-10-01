import { useMemo } from 'react'
import { useApp } from '../context/AppContext'
import { COUNTRIES, countryName, currencyFor, currencySymbol } from '../lib/money'

// Country of residence — sets the currency every amount is entered and shown in.
export default function CountrySelect() {
  const { country, setCountry, lang, t } = useApp()
  const options = useMemo(
    () => Object.keys(COUNTRIES)
      .map((code) => ({ code, name: countryName(code, lang), cur: currencyFor(code) }))
      .sort((a, b) => a.name.localeCompare(b.name, lang)),
    [lang],
  )
  return (
    <label className="block space-y-1.5">
      <span className="text-muted text-xs font-medium">{t('settings.country')}</span>
      <select
        value={country}
        onChange={(e) => setCountry(e.target.value)}
        className="w-full bg-surface2 border border-border rounded-lg px-3 py-2.5 text-[15px] text-text outline-none focus:border-primary"
      >
        {options.map((o) => (
          <option key={o.code} value={o.code}>{o.name} — {o.cur} ({currencySymbol(o.cur, lang)})</option>
        ))}
      </select>
      <span className="block text-[11px] text-muted leading-relaxed">{t('settings.countryHint')}</span>
    </label>
  )
}
