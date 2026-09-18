import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, CreditCard, Landmark, Wallet, Plus, Lightbulb, AlertTriangle } from 'lucide-react'
import TopBar from '../components/TopBar'
import BottomNav from '../components/BottomNav'
import { Card, Button, Input, IconCircle } from '../components/UI'
import { useApp } from '../context/AppContext'
import * as db from '../lib/db'
import ConfirmDialog from '../components/ConfirmDialog'
import { computeAccountBalance, computeUtilization, nextDateForDay, daysUntil, getCreditTips } from '../lib/creditCards'

function fmt(n) {
  return '$' + Math.round(n || 0).toLocaleString('en-US')
}

const emptyForm = { name: '', type: 'cash', credit_limit: '', statement_day: '', due_day: '' }

export default function AccountsScreen() {
  const { user, context, lang, t } = useApp()
  const [accounts, setAccounts] = useState([])
  const [transactions, setTransactions] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [payingId, setPayingId] = useState(null)
  const [payAmount, setPayAmount] = useState('')
  const [payBusy, setPayBusy] = useState(false)
  const [deletingAccount, setDeletingAccount] = useState(null)
  const [actionError, setActionError] = useState('')

  useEffect(() => {
    if (!user) return
    refresh()
  }, [user, context])

  function refresh() {
    db.listAccounts(user.id, context).then(setAccounts)
    db.listTransactions(user.id, context).then(setTransactions)
  }

  async function createAccount(e) {
    e.preventDefault()
    setSaving(true)
    try {
      await db.upsertAccount(user.id, context, {
        name: form.type === 'cash' ? L.cash : form.name,
        type: form.type,
        credit_limit: form.type === 'credit' ? parseFloat(form.credit_limit) || 0 : null,
        statement_day: form.type === 'credit' ? parseInt(form.statement_day) || null : null,
        due_day: form.type === 'credit' ? parseInt(form.due_day) || null : null,
      })
      setForm(emptyForm)
      setShowForm(false)
      refresh()
    } finally {
      setSaving(false)
    }
  }

  async function removeAccount(id) {
    setDeletingAccount(null)
    try {
      await db.deleteAccount(user.id, id)
      refresh()
    } catch {
      setActionError(t('bills.error'))
    }
  }

  async function logPayment(account) {
    const amt = parseFloat(payAmount)
    if (!amt || amt <= 0) return
    setActionError('')
    setPayBusy(true)
    try {
      await db.addTransaction(user.id, context, {
        amount: amt,
        date: new Date().toISOString().slice(0, 10),
        comment: t('accounts.paymentComment', { name: account.name }),
        group: 'needs',
        category_key: 'other',
        sub: null,
        account_id: account.id,
        // Marks this as moving money to the card, not new spending — the
        // purchases it covers were already counted when they were logged.
        is_payment: true,
      })
      setPayingId(null)
      setPayAmount('')
      refresh()
    } catch {
      setActionError(t('bills.error'))
    } finally {
      setPayBusy(false)
    }
  }

  const rows = useMemo(
    () =>
      accounts.map((a) => {
        const balance = computeAccountBalance(a, transactions)
        const utilization = a.type === 'credit' ? computeUtilization(a, balance) : null
        const dueDate = a.type === 'credit' && a.due_day ? nextDateForDay(a.due_day) : null
        const due = dueDate ? daysUntil(dueDate) : null
        return { ...a, balance, utilization, dueDate, due }
      }),
    [accounts, transactions],
  )

  const tips = getCreditTips(lang)
  const L = {
    title: { ru: 'Карты и счета', en: 'Cards & accounts' }[lang] || 'Карты и счета',
    subtitle: { ru: 'Отдельно по каждой карте — баланс, срок оплаты, загрузка', en: 'Per card — balance, due date, utilization' }[lang] || '',
    cash: { ru: 'Наличные', en: 'Cash' }[lang] || 'Наличные',
    debit: { ru: 'Дебетовый / текущий счёт', en: 'Debit / checking account' }[lang] || 'Дебетовый счёт',
    credit: { ru: 'Кредитная карта', en: 'Credit card' }[lang] || 'Кредитная карта',
    name: { ru: 'Название (например, BofA)', en: 'Name (e.g. BofA)' }[lang] || 'Название',
    limit: { ru: 'Кредитный лимит, $', en: 'Credit limit, $' }[lang] || 'Кредитный лимит',
    statementDay: { ru: 'День закрытия выписки (1-28)', en: 'Statement closing day (1-28)' }[lang] || '',
    dueDay: { ru: 'День платежа (1-28)', en: 'Payment due day (1-28)' }[lang] || '',
    add: { ru: 'Добавить карту/счёт', en: 'Add card/account' }[lang] || 'Добавить',
    cancel: { ru: 'Отмена', en: 'Cancel' }[lang] || 'Отмена',
    save: { ru: 'Сохранить', en: 'Save' }[lang] || 'Сохранить',
    balance: { ru: 'Баланс', en: 'Balance' }[lang] || 'Баланс',
    owed: { ru: 'Долг по карте', en: 'Owed on the card', es: 'Deuda de la tarjeta', fr: 'Dette de la carte' }[lang] || 'Долг по карте',
    available: { ru: 'Осталось доступно', en: 'Still available', es: 'Disponible', fr: 'Encore disponible' }[lang] || 'Осталось доступно',
    availableNote: { ru: 'из лимита {limit}', en: 'of your {limit} limit', es: 'de tu límite {limit}', fr: 'sur votre limite de {limit}' }[lang] || 'из лимита {limit}',
    utilization: { ru: 'Загрузка', en: 'Utilization' }[lang] || 'Загрузка',
    dueIn: (n) => ({ ru: `Платёж через ${n} дн.`, en: `Due in ${n} day(s)` }[lang] || `Due in ${n}`),
    overdue: { ru: 'Просрочка!', en: 'Overdue!' }[lang] || 'Overdue',
    payBtn: { ru: 'Записать платёж', en: 'Log a payment' }[lang] || 'Log a payment',
    payAmountLabel: { ru: 'Сумма платежа', en: 'Payment amount' }[lang] || 'Payment amount',
    confirmPay: { ru: 'Готово', en: 'Done' }[lang] || 'Done',
    delete: { ru: 'Удалить', en: 'Delete' }[lang] || 'Delete',
    highUtil: { ru: 'Загрузка выше 30% — это заметно бьёт по кредитному скорингу.', en: 'Utilization above 30% takes a real bite out of your credit score.' }[lang] || '',
    tipsTitle: { ru: 'Как устроены кредитки — коротко', en: 'How credit cards actually work' }[lang] || '',
    ownSection: { ru: 'Свои деньги', en: 'Your own money', es: 'Tu dinero', fr: 'Votre argent' }[lang] || 'Свои деньги',
    ownTotal: { ru: 'всего', en: 'in total', es: 'en total', fr: 'au total' }[lang] || 'всего',
    creditSection: { ru: 'Кредитные карты', en: 'Credit cards', es: 'Tarjetas de crédito', fr: 'Cartes de crédit' }[lang] || 'Кредитные карты',
    creditTotal: { ru: 'должен', en: 'owed', es: 'debes', fr: 'dû' }[lang] || 'должен',
    creditNote: { ru: 'Это заёмные деньги. Трата попадает в расходы в день покупки; платёж по карте — это «Перевод», а не новая трата.', en: "This is borrowed money. A purchase counts as spending on the day you buy; paying the card off is a Transfer, not a new expense.", es: 'Es dinero prestado. La compra cuenta el día que la haces; pagar la tarjeta es una transferencia, no un gasto nuevo.', fr: "C'est de l'argent emprunté. L'achat compte le jour même ; rembourser la carte est un virement, pas une nouvelle dépense." }[lang] || '',
    noCards: { ru: 'Кредитных карт пока нет.', en: 'No credit cards yet.', es: 'Aún no hay tarjetas de crédito.', fr: 'Aucune carte de crédit pour le moment.' }[lang] || '',
    addCard: { ru: 'Добавить кредитную карту', en: 'Add a credit card', es: 'Añadir tarjeta de crédito', fr: 'Ajouter une carte de crédit' }[lang] || 'Добавить кредитную карту',
    addOwn: { ru: 'Добавить счёт или наличные', en: 'Add an account or cash', es: 'Añadir cuenta o efectivo', fr: 'Ajouter un compte ou des espèces' }[lang] || 'Добавить счёт',
  }

  // Opening the form already set to the right kind: people have several
  // cards, and picking "credit" again on every one is pure friction.
  function openAddForm(type) {
    setForm({ ...emptyForm, type })
    setShowForm(true)
  }

  // Two piles, because they are two different things: money you have, and
  // money you owe. Lumping them in one list is what made the numbers feel
  // like guesswork.
  const ownRows = rows.filter((a) => a.type !== 'credit')
  const creditRows = rows.filter((a) => a.type === 'credit')
  const ownTotalAmount = ownRows.reduce((sum, a) => sum + a.balance, 0)
  const creditTotalAmount = creditRows.reduce((sum, a) => sum + Math.max(0, a.balance), 0)

  function renderAccountCard(a) {
    return (

      <Card key={a.id} className="!p-3.5 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5 min-w-0">
                <IconCircle icon={a.type === 'credit' ? CreditCard : a.type === 'cash' ? Wallet : Landmark} className="bg-primary/10 text-primary" size={36} iconSize={17} />
                <div className="min-w-0">
                  <p className="font-semibold text-sm truncate">{a.name}</p>
                  <p className="text-xs text-muted">{a.type === 'credit' ? L.credit : a.type === 'cash' ? L.cash : L.debit}</p>
                </div>
              </div>
              <button onClick={() => setDeletingAccount(a)} className="text-xs text-muted shrink-0" type="button">✕</button>
            </div>

            <div className="flex items-center justify-between text-sm">
              <span className="text-muted">{a.type === 'credit' ? L.owed : L.balance}</span>
              <span className={`font-semibold font-num ${(a.type === 'credit' ? a.balance > 0 : a.balance < 0) ? 'text-wants' : 'text-savings'}`}>{fmt(a.balance)}</span>
            </div>

            {a.type === 'credit' && (
              <>
                {a.credit_limit > 0 && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted">
                      {L.available}
                      <span className="block text-[11px] opacity-70">{L.availableNote.replace('{limit}', fmt(a.credit_limit))}</span>
                    </span>
                    <span className="font-semibold font-num text-savings">{fmt(Math.max(0, a.credit_limit - Math.max(0, a.balance)))}</span>
                  </div>
                )}
                {a.utilization !== null && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted">{L.utilization}</span>
                    <span className={`font-semibold ${a.utilization > 30 ? 'text-wants' : 'text-savings'}`}>{a.utilization}%</span>
                  </div>
                )}
                {a.utilization > 30 && (
                  <p className="text-xs text-wants flex items-start gap-1.5 bg-wants/10 rounded-lg px-2.5 py-2">
                    <AlertTriangle size={13} className="shrink-0 mt-0.5" />
                    {L.highUtil}
                  </p>
                )}
                {a.due !== null && (
                  <p className={`text-xs font-medium ${a.due <= 3 ? 'text-wants' : 'text-muted'}`}>
                    {a.due < 0 ? L.overdue : L.dueIn(a.due)}
                  </p>
                )}

                {payingId === a.id ? (
                  <div className="flex gap-1.5">
                    <input
                      type="number"
                      value={payAmount}
                      onChange={(e) => setPayAmount(e.target.value)}
                      placeholder={L.payAmountLabel}
                      className="flex-1 bg-surface2 border border-border rounded-lg px-2.5 py-2 text-sm outline-none focus:border-primary"
                    />
                    <Button className="!w-auto px-3 text-xs" disabled={payBusy || !(parseFloat(payAmount) > 0)} onClick={() => logPayment(a)} type="button">{L.confirmPay}</Button>
                  </div>
                ) : (
                  <Button variant="secondary" onClick={() => { setPayingId(a.id); setPayAmount(a.balance > 0 ? String(a.balance) : '') }} type="button">
                    {L.payBtn}
                  </Button>
                )}
              </>
            )}
      </Card>
    )
  }

  return (
    <div className="screen-accounts flex flex-col min-h-[100svh] max-w-app mx-auto w-full">
      <TopBar title={L.title} subtitle={L.subtitle} />
      <div className="flex-1 px-4 py-4 space-y-3">
        <Link to="/dashboard" className="text-xs text-primary font-semibold flex items-center gap-1 mb-1">
          <ArrowLeft size={13} /> {t('nav.overview')}
        </Link>

        <div className="flex items-baseline justify-between pt-1">
          <p className="text-[13px] font-bold tracking-wide text-muted uppercase">{L.ownSection}</p>
          <p className="text-sm font-semibold font-num text-savings">{fmt(ownTotalAmount)} <span className="text-[11px] font-normal text-muted">{L.ownTotal}</span></p>
        </div>
        {ownRows.map(renderAccountCard)}
        {!showForm && (
          <Button variant="secondary" icon={Plus} onClick={() => openAddForm('debit')} type="button">{L.addOwn}</Button>
        )}

        <div className="flex items-baseline justify-between pt-3">
          <p className="text-[13px] font-bold tracking-wide text-muted uppercase">{L.creditSection}</p>
          {creditRows.length > 0 && (
            <p className={`text-sm font-semibold font-num ${creditTotalAmount > 0 ? 'text-wants' : 'text-savings'}`}>{fmt(creditTotalAmount)} <span className="text-[11px] font-normal text-muted">{L.creditTotal}</span></p>
          )}
        </div>
        <p className="text-[11px] text-muted leading-relaxed -mt-1">{L.creditNote}</p>
        {creditRows.length === 0 ? (
          <p className="text-xs text-muted">{L.noCards}</p>
        ) : (
          creditRows.map(renderAccountCard)
        )}
        {!showForm && (
          <Button variant="secondary" icon={Plus} onClick={() => openAddForm('credit')} type="button">{L.addCard}</Button>
        )}

        {showForm ? (
          <Card>
            <form onSubmit={createAccount} className="space-y-3">
              <div className="flex bg-surface2 rounded-xl p-1 border border-border">
                {['cash', 'debit', 'credit'].map((tp) => (
                  <button
                    key={tp}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, type: tp }))}
                    className={`flex-1 py-2 rounded-lg text-sm font-semibold ${form.type === tp ? 'bg-surface shadow-softer text-text' : 'text-muted'}`}
                  >
                    {tp === 'cash' ? L.cash : tp === 'debit' ? L.debit : L.credit}
                  </button>
                ))}
              </div>
              {form.type !== 'cash' && (
                <Input label={L.name} required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="BofA, Chase..." />
              )}
              {form.type === 'credit' && (
                <>
                  <Input label={L.limit} type="number" min="0" value={form.credit_limit} onChange={(e) => setForm((f) => ({ ...f, credit_limit: e.target.value }))} />
                  <Input label={L.statementDay} type="number" min="1" max="28" value={form.statement_day} onChange={(e) => setForm((f) => ({ ...f, statement_day: e.target.value }))} />
                  <Input label={L.dueDay} type="number" min="1" max="28" value={form.due_day} onChange={(e) => setForm((f) => ({ ...f, due_day: e.target.value }))} />
                </>
              )}
              <div className="flex gap-2">
                <Button variant="secondary" type="button" onClick={() => setShowForm(false)}>{L.cancel}</Button>
                <Button type="submit" disabled={saving}>{L.save}</Button>
              </div>
            </form>
          </Card>
        ) : (
          null
        )}

        <div className="pt-2">
          <p className="text-[13px] font-bold tracking-wide text-muted uppercase mb-2 flex items-center gap-1.5">
            <Lightbulb size={13} /> {L.tipsTitle}
          </p>
          <div className="space-y-2">
            {tips.map((tip, i) => (
              <Card key={i} className="!p-3">
                <p className="text-sm font-medium">{tip.title}</p>
                <p className="text-xs text-muted mt-1 leading-relaxed">{tip.body}</p>
              </Card>
            ))}
          </div>
        </div>
      </div>
      {actionError && <p className="px-4 text-xs text-danger">{actionError}</p>}
      {deletingAccount && (
        <ConfirmDialog
          message={t('accounts.deleteConfirm')}
          confirmLabel={t('common.delete')}
          onConfirm={() => removeAccount(deletingAccount.id)}
          onCancel={() => setDeletingAccount(null)}
        />
      )}
      <BottomNav />
    </div>
  )
}
