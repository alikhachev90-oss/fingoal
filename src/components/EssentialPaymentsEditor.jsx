import { useEffect, useRef, useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { Button, Input } from './UI'
import { saveSettings } from '../lib/db'
import { billLabel, budgetRows, serializeBudget } from '../lib/essentialBudget'

export default function EssentialPaymentsEditor({ settings, onSaved, onClose }) {
  const { user, context, lang, t } = useApp()
  const dialog = useRef(null)
  const [rows, setRows] = useState(() => budgetRows(settings.needs_budget))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  useEffect(() => {
    const node = dialog.current
    node.showModal()
    return () => node.close()
  }, [])
  function update(id, patch) {
    setRows((current) => current.map((row) => row.id === id ? { ...row, ...patch } : row))
    setError('')
  }
  async function save(event) {
    event.preventDefault()
    let budget
    try { budget = serializeBudget(rows) } catch { setError(t('bills.invalid')); return }
    setSaving(true)
    setError('')
    try {
      const result = await saveSettings(user.id, context, { needs_budget: budget })
      onSaved(result)
      onClose()
    } catch {
      setError(t('bills.error'))
      setSaving(false)
    }
  }
  const total = rows.reduce((sum, row) => sum + (Number(String(row.amount).replace(',', '.')) || 0), 0)
  return (
    <dialog ref={dialog} className="payments-dialog" aria-labelledby="payments-title" onCancel={(e) => { e.preventDefault(); if (!saving) onClose() }}>
      <form onSubmit={save} className="space-y-4">
        <h2 id="payments-title" className="text-xl font-medium">{t('bills.title')}</h2>
        <p className="text-xs text-muted leading-relaxed">{t('bills.editorNote')}</p>
        <fieldset disabled={saving} className="space-y-3">
          {rows.map((row) => (
            <div key={row.id} className="bg-surface2 rounded-xl p-3 space-y-2">
              <div className="flex items-center justify-between gap-3">
                {row.custom
                  ? <Input label={t('bills.name')} value={row.name} required maxLength={80} onChange={(e) => update(row.id, { name: e.target.value })} />
                  : <span className="text-sm">{billLabel(row.key, lang)}</span>}
                <button type="button" className="p-3 text-muted shrink-0" aria-label={t('bills.remove') + ': ' + (row.custom ? row.name : billLabel(row.key, lang))} onClick={() => setRows((current) => current.filter((item) => item.id !== row.id))}><Trash2 size={16} /></button>
              </div>
              <Input label={t('bills.monthly') + ' — ' + (row.custom ? row.name : billLabel(row.key, lang))} type="number" inputMode="decimal" min="0" step="0.01" value={row.amount} onChange={(e) => update(row.id, { amount: e.target.value })} placeholder="0" />
            </div>
          ))}
          <Button type="button" variant="secondary" icon={Plus} onClick={() => setRows((current) => [...current, { id: crypto.randomUUID(), key: '', custom: true, name: '', amount: '' }])}>{t('bills.add')}</Button>
        </fieldset>
        <p className="flex justify-between text-sm"><span>{t('bills.total')}</span><strong>{new Intl.NumberFormat(lang, { style: 'currency', currency: 'USD' }).format(total)}</strong></p>
        {error && <p role="alert" className="text-danger text-sm">{error}</p>}
        <div className="flex gap-2">
          <Button type="button" variant="secondary" disabled={saving} onClick={onClose}>{t('common.cancel')}</Button>
          <Button type="submit" disabled={saving}>{t(saving ? 'common.saving' : 'common.save')}</Button>
        </div>
      </form>
    </dialog>
  )
}
