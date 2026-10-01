import { useState } from 'react'
import { ChevronDown, Check, Plus } from 'lucide-react'

// Pick which account money comes from / goes to — a bottom sheet listing the
// person's cash, cards and bank accounts.
export function accountLabel(account, t) {
  return `${account.name}${account.type === 'credit' ? ` (${t('accounts.credit')})` : ''}`
}

export default function AccountPicker({ label, sheetTitle, emptyLabel, accounts, value, onChange, onCreate, t }) {
  const [open, setOpen] = useState(false)
  const selected = accounts.find((account) => account.id === value)

  return (
    <div className="account-picker">
      {label && <span className="text-muted text-xs font-medium">{label}</span>}
      <button type="button" className="account-picker-trigger" onClick={() => setOpen(true)} aria-haspopup="dialog" aria-expanded={open}>
        <span>{selected ? accountLabel(selected, t) : emptyLabel}</span>
        <ChevronDown size={16} strokeWidth={1.8} />
      </button>
      {open && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center px-3 pb-[max(env(safe-area-inset-bottom),12px)]" role="dialog" aria-modal="true" aria-label={sheetTitle || label}>
          <button type="button" className="absolute inset-0 bg-black/45" aria-label="Close" onClick={() => setOpen(false)} />
          <div className="account-picker-sheet relative w-full max-w-app">
            <div className="account-picker-handle" />
            <p className="account-picker-title">{sheetTitle || label}</p>
            <div className="account-picker-options">
              <button type="button" className={!value ? 'is-selected' : ''} onClick={() => { onChange(''); setOpen(false) }}>
                <span>{emptyLabel}</span>{!value && <Check size={18} />}
              </button>
              {accounts.map((account) => (
                <button key={account.id} type="button" className={value === account.id ? 'is-selected' : ''} onClick={() => { onChange(account.id); setOpen(false) }}>
                  <span>{accountLabel(account, t)}</span>{value === account.id && <Check size={18} />}
                </button>
              ))}
              {onCreate && (
                <button type="button" className="!text-primary" onClick={() => { setOpen(false); onCreate() }}>
                  <span>+ {t('entry.addCardOrAccount')}</span><Plus size={18} />
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
