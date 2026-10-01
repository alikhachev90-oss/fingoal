import { useApp } from '../context/AppContext'
import { DEBT_KINDS } from '../lib/debtKinds'

// Which kind of debt: card, loan, back taxes, money owed to a friend…
export default function DebtKindSelect({ value, onChange }) {
  const { t, lang } = useApp()
  return (
    <label className="block space-y-1.5">
      <span className="text-muted text-xs font-medium">{t('debts.kind')}</span>
      <select
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-surface2 border border-border rounded-lg px-3 py-2.5 text-[15px] text-text outline-none focus:border-primary"
      >
        <option value="">—</option>
        {DEBT_KINDS.map((k) => <option key={k.key} value={k.key}>{k.label[lang] || k.label.en}</option>)}
      </select>
    </label>
  )
}
