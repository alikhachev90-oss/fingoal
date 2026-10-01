import { useEffect, useState } from 'react'
import { CreditCard, Plus, Trophy } from 'lucide-react'
import TopBar from '../components/TopBar'
import { Card, Button, Input, IconCircle, EmptyState } from '../components/UI'
import ConfirmDialog from '../components/ConfirmDialog'
import { useApp } from '../context/AppContext'
import * as db from '../lib/db'
import { HIGH_RATE } from '../lib/path'
import { todayStr } from '../lib/dates'
import TourGuide from '../components/TourGuide'
import AccountPicker from '../components/AccountPicker'
import { getPayFrom, setPayFrom } from '../lib/payFrom'
import { TOURS } from '../lib/tours'
import { fmtMoney } from '../lib/money'

function fmt(n) {
  return fmtMoney(n)
}

const emptyForm = { id: null, name: '', balance: '', rate: '', min_payment: '' }

// Every debt in one list, in the order to kill them: expensive ones first,
// smallest balance first among those (Gal & McShane — each account that
// disappears is what keeps people going until they're debt-free).
export default function DebtsScreen() {
  const { user, context, t, lang } = useApp()
  const [debts, setDebts] = useState([])
  const [form, setForm] = useState(null)
  const [saving, setSaving] = useState(false)
  const [payingId, setPayingId] = useState(null)
  const [payAmount, setPayAmount] = useState('')
  const [deleting, setDeleting] = useState(null)
  const [error, setError] = useState('')
  const [cleared, setCleared] = useState('')
  // Which account the payment leaves, so that account's balance drops too.
  const [accounts, setAccounts] = useState([])
  const [payFrom, setPayFromState] = useState('')

  function refresh() {
    return db.listDebts(user.id, context).then(setDebts).catch(() => setDebts([]))
  }

  useEffect(() => {
    if (user) refresh()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, context])

  useEffect(() => {
    if (!user) return
    db.listAccounts(user.id, context).then((list) => {
      setAccounts(list || [])
      setPayFromState(getPayFrom(user.id, context, list || []))
    }).catch(() => setAccounts([]))
  }, [user, context])

  const open = debts.filter((d) => Number(d.balance) > 0)
  const ordered = [...open].sort((a, b) => {
    const ah = Number(a.rate) >= HIGH_RATE
    const bh = Number(b.rate) >= HIGH_RATE
    if (ah !== bh) return ah ? -1 : 1
    return Number(a.balance) - Number(b.balance)
  })
  const paidOff = debts.filter((d) => Number(d.balance) <= 0)
  const total = open.reduce((s, d) => s + Number(d.balance), 0)
  const minTotal = open.reduce((s, d) => s + Number(d.min_payment || 0), 0)

  async function save(e) {
    e.preventDefault()
    setSaving(true)
    setError('')
    const row = {
      name: form.name.trim(),
      balance: parseFloat(form.balance) || 0,
      rate: parseFloat(form.rate) || 0,
      min_payment: parseFloat(form.min_payment) || 0,
    }
    try {
      if (form.id) await db.updateDebt(user.id, form.id, row)
      else await db.addDebt(user.id, context, row)
      setForm(null)
      await refresh()
    } catch {
      setError(t('debts.error'))
    } finally {
      setSaving(false)
    }
  }

  async function pay(debt) {
    const amount = parseFloat(String(payAmount).replace(',', '.'))
    if (!(amount > 0)) return
    setSaving(true)
    setError('')
    try {
      // Filed as an extra payment (Savings → paying off debt), so it counts
      // toward the Path and the streak, and it comes off this debt's balance.
      await db.addTransaction(user.id, context, {
        amount,
        date: todayStr(),
        comment: t('debts.payComment', { name: debt.name }),
        group: 'savings',
        category_key: 'debt_extra',
        sub: null,
        account_id: payFrom || null,
      })
      if (payFrom) setPayFrom(user.id, context, payFrom)
      const left = await db.payDownDebt(user.id, debt.id, amount)
      await db.checkInToday(user.id, context)
      if (left <= 0) setCleared(debt.name)
      setPayingId(null)
      setPayAmount('')
      await refresh()
    } catch {
      setError(t('debts.error'))
    } finally {
      setSaving(false)
    }
  }

  async function remove(debt) {
    setDeleting(null)
    try {
      await db.deleteDebt(user.id, debt.id)
      await refresh()
    } catch {
      setError(t('debts.error'))
    }
  }

  function renderForm() {
    return (
      <Card>
        <form onSubmit={save} className="space-y-3">
          <Input label={t('debts.name')} required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Visa, Car loan…" />
          <Input label={t('debts.balance')} type="number" inputMode="decimal" min="0" step="0.01" required value={form.balance} onChange={(e) => setForm((f) => ({ ...f, balance: e.target.value }))} />
          <Input label={t('debts.rate')} type="number" inputMode="decimal" min="0" step="0.01" value={form.rate} onChange={(e) => setForm((f) => ({ ...f, rate: e.target.value }))} placeholder="24" />
          <Input label={t('debts.minPayment')} type="number" inputMode="decimal" min="0" step="0.01" value={form.min_payment} onChange={(e) => setForm((f) => ({ ...f, min_payment: e.target.value }))} />
          <div className="flex gap-2">
            <Button variant="secondary" type="button" onClick={() => setForm(null)}>{t('common.cancel')}</Button>
            <Button type="submit" disabled={saving}>{saving ? t('common.saving') : t('common.save')}</Button>
          </div>
        </form>
      </Card>
    )
  }

  return (
    <div className="screen-debts flex flex-col min-h-[100svh] max-w-app mx-auto w-full">
      <TourGuide userId={user?.id} context={context} screenKey="debts" steps={TOURS.debts} lang={lang} />
      <TopBar title={t('debts.title')} subtitle={t('debts.subtitle')} />
      <div className="flex-1 px-4 py-4 space-y-3">
        {cleared && (
          <Card className="bg-savings/10 border-savings/30 text-center">
            <p className="text-sm font-medium flex items-center justify-center gap-2"><Trophy size={16} className="text-savings" /> {t('debts.cleared', { name: cleared })}</p>
          </Card>
        )}

        {open.length > 0 && (
          <Card className="!p-4 space-y-1">
            <p className="text-[11px] font-semibold tracking-[.08em] uppercase text-muted">{t('debts.total')}</p>
            <p className="text-2xl font-semibold font-num text-wants">{fmt(total)}</p>
            <p className="text-xs text-muted">{t('debts.summary', { n: open.length, min: fmt(minTotal) })}</p>
            <p className="text-xs text-muted leading-relaxed pt-1">{t('debts.method')}</p>
          </Card>
        )}

        {debts.length === 0 && !form && (
          <EmptyState icon={CreditCard} title={t('debts.emptyTitle')} subtitle={t('debts.emptySubtitle')} />
        )}

        {ordered.map((d, i) => {
          const high = Number(d.rate) >= HIGH_RATE
          return (
            <Card key={d.id} data-tour={i === 0 ? 'debts-list' : undefined} className={`!p-3.5 space-y-2.5 ${i === 0 ? 'border-primary/40' : ''}`}>
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <IconCircle icon={CreditCard} className={high ? 'bg-wants/10 text-wants' : 'bg-primary/10 text-primary'} size={36} iconSize={16} />
                  <div className="min-w-0">
                    <p className="font-semibold text-sm truncate">{i + 1}. {d.name}</p>
                    <p className="text-xs text-muted">
                      {Number(d.rate) > 0 ? t('debts.rateShort', { rate: d.rate }) : t('debts.rateUnknown')}
                      {Number(d.min_payment) > 0 ? ` · ${t('debts.minShort', { amt: fmt(d.min_payment) })}` : ''}
                    </p>
                  </div>
                </div>
                <p className="font-semibold font-num text-wants shrink-0">{fmt(d.balance)}</p>
              </div>
              {i === 0 && <p className="text-xs text-primary">{t('debts.focus')}</p>}
              {payingId === d.id ? (
                <div className="space-y-2">
                {accounts.length > 0 && (
                  <AccountPicker label={t('entry.accountLabelFrom')} emptyLabel={t('entry.accountNone')} accounts={accounts} value={payFrom} onChange={setPayFromState} t={t} />
                )}
                <div className="flex gap-1.5">
                  <input
                    type="number"
                    inputMode="decimal"
                    autoFocus
                    value={payAmount}
                    onChange={(e) => setPayAmount(e.target.value)}
                    placeholder={t('debts.payAmount')}
                    className="flex-1 min-w-0 bg-surface2 border border-border rounded-lg px-2.5 py-2 text-sm outline-none focus:border-primary"
                  />
                  <Button className="!w-auto px-3 text-xs" disabled={saving || !(parseFloat(payAmount) > 0)} onClick={() => pay(d)} type="button">{t('debts.payConfirm')}</Button>
                  <Button variant="secondary" className="!w-auto px-3 text-xs" onClick={() => setPayingId(null)} type="button">{t('common.cancel')}</Button>
                </div>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <Button variant={i === 0 ? 'primary' : 'secondary'} className="flex-1" type="button" onClick={() => { setPayingId(d.id); setPayAmount(''); setCleared('') }}>{t('debts.pay')}</Button>
                  <button type="button" className="text-xs text-primary py-2" onClick={() => setForm({ id: d.id, name: d.name, balance: String(d.balance), rate: String(d.rate || ''), min_payment: String(d.min_payment || '') })}>{t('goals.edit')}</button>
                  <button type="button" className="text-xs text-muted py-2" onClick={() => setDeleting(d)} aria-label={t('common.delete')}>✕</button>
                </div>
              )}
              {form?.id === d.id && renderForm()}
            </Card>
          )
        })}

        {form && !form.id && renderForm()}
        {!form && (
          <Button variant="secondary" icon={Plus} type="button" onClick={() => setForm(emptyForm)}>{t('debts.add')}</Button>
        )}

        {paidOff.length > 0 && (
          <div className="pt-2 space-y-1.5">
            <p className="text-[11px] font-semibold tracking-[.08em] uppercase text-muted">{t('debts.paidOff')}</p>
            {paidOff.map((d) => (
              <p key={d.id} className="text-sm text-savings flex items-center gap-2"><Trophy size={14} /> {d.name}</p>
            ))}
          </div>
        )}

        {error && <p className="text-xs text-wants">{error}</p>}
      </div>
      {deleting && (
        <ConfirmDialog
          message={t('debts.deleteConfirm', { name: deleting.name })}
          confirmLabel={t('common.delete')}
          onConfirm={() => remove(deleting)}
          onCancel={() => setDeleting(null)}
        />
      )}
    </div>
  )
}
