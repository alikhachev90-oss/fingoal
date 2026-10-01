import { useEffect, useMemo, useState } from 'react'
import { CreditCard, Landmark, Wallet, Plus, Lightbulb, AlertTriangle } from 'lucide-react'
import TopBar from '../components/TopBar'
import { Card, Button, Input, IconCircle } from '../components/UI'
import { useApp } from '../context/AppContext'
import * as db from '../lib/db'
import ConfirmDialog from '../components/ConfirmDialog'
import { getCardReminder, setCardReminder, clearCardReminder, refreshCardReminders } from '../lib/cardReminders'
import { syncServerReminders } from '../lib/serverReminders'
import { requestNotificationPermission } from '../lib/reminders'
import { computeAccountBalance, computeUtilization, nextDateForDay, daysUntil, getCreditTips } from '../lib/creditCards'
import { todayStr } from '../lib/dates'
import { fmtMoney } from '../lib/money'

function fmt(n) {
  return fmtMoney(n)
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
  const [payFrom, setPayFrom] = useState('')
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
      const from = payFrom || accounts.find((a) => a.type !== 'credit')?.id
      let moved = false
      if (from) {
        // Paying the card moves money from your own account to the card: the
        // debt goes down AND the account it came from goes down. Recording
        // only the card side left that money counted as still yours.
        await db.addTransfer(user.id, context, {
          fromAccountId: from,
          toAccountId: account.id,
          amount: amt,
          date: todayStr(),
          comment: t('accounts.paymentComment', { name: account.name }),
        }).then(() => { moved = true }).catch(() => {})
      }
      // No own account to pay from (or the transfer couldn't be saved): at
      // least bring the card's balance down.
      if (!moved) {
        await db.addTransaction(user.id, context, {
          amount: amt,
          date: todayStr(),
          comment: t('accounts.paymentComment', { name: account.name }),
          group: 'needs',
          category_key: 'other',
          sub: null,
          account_id: account.id,
          // Marks this as moving money to the card, not new spending — the
          // purchases it covers were already counted when they were logged.
          is_payment: true,
        })
      }
      setPayingId(null)
      setPayAmount('')
      refresh()
    } catch {
      setActionError(t('bills.error'))
    } finally {
      setPayBusy(false)
    }
  }

  // Daily "pay the card off" reminders, one per card. Balances are brought up
  // to date on every visit, and a paid-off card's reminder switches itself off.
  const [cardReminders, setCardReminders] = useState({})
  useEffect(() => {
    if (!user || !accounts.length) return
    if (refreshCardReminders(user.id, accounts, transactions)) syncServerReminders(user)
    setCardReminders(Object.fromEntries(accounts.map((a) => [a.id, getCardReminder(user.id, a.id)])))
  }, [user, accounts, transactions])

  async function toggleCardReminder(account, on, time) {
    if (on) {
      await requestNotificationPermission()
      setCardReminder(user.id, account.id, { name: account.name, owed: Math.max(0, computeAccountBalance(account, transactions)), ...(time ? { time } : {}) })
    } else {
      clearCardReminder(user.id, account.id)
    }
    setCardReminders((prev) => ({ ...prev, [account.id]: getCardReminder(user.id, account.id) }))
    syncServerReminders(user)
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
    title: { ru: 'Карты и счета', en: 'Cards & accounts', es: 'Tarjetas y cuentas', fr: 'Cartes et comptes' }[lang] || 'Cards & accounts',
    subtitle: { ru: 'Отдельно по каждой карте — баланс, срок оплаты, загрузка', en: 'Per card — balance, due date, utilization', es: 'Por tarjeta — saldo, fecha de pago, uso', fr: 'Par carte — solde, échéance, utilisation' }[lang] || '',
    cash: { ru: 'Наличные', en: 'Cash', es: 'Efectivo', fr: 'Espèces' }[lang] || 'Cash',
    debit: { ru: 'Дебетовый / текущий счёт', en: 'Debit / checking account', es: 'Cuenta de débito / corriente', fr: 'Compte courant / débit' }[lang] || 'Debit / checking account',
    credit: { ru: 'Кредитная карта', en: 'Credit card', es: 'Tarjeta de crédito', fr: 'Carte de crédit' }[lang] || 'Credit card',
    name: { ru: 'Название (например, BofA)', en: 'Name (e.g. BofA)', es: 'Nombre (p. ej., BofA)', fr: 'Nom (ex. BofA)' }[lang] || 'Name (e.g. BofA)',
    limit: { ru: 'Кредитный лимит, $', en: 'Credit limit, $', es: 'Límite de crédito, $', fr: 'Plafond de crédit, $' }[lang] || 'Credit limit, $',
    statementDay: { ru: 'День закрытия выписки (1-28)', en: 'Statement closing day (1-28)', es: 'Día de cierre del estado de cuenta (1-28)', fr: 'Jour de clôture du relevé (1-28)' }[lang] || 'Statement closing day (1-28)',
    dueDay: { ru: 'День платежа (1-28)', en: 'Payment due day (1-28)', es: 'Día de pago (1-28)', fr: 'Jour d’échéance (1-28)' }[lang] || 'Payment due day (1-28)',
    add: { ru: 'Добавить карту/счёт', en: 'Add card/account', es: 'Añadir tarjeta/cuenta', fr: 'Ajouter carte/compte' }[lang] || 'Add card/account',
    cancel: { ru: 'Отмена', en: 'Cancel', es: 'Cancelar', fr: 'Annuler' }[lang] || 'Cancel',
    save: { ru: 'Сохранить', en: 'Save', es: 'Guardar', fr: 'Enregistrer' }[lang] || 'Save',
    balance: { ru: 'Баланс', en: 'Balance', es: 'Saldo', fr: 'Solde' }[lang] || 'Balance',
    owed: { ru: 'Долг по карте', en: 'Owed on the card', es: 'Deuda de la tarjeta', fr: 'Dette de la carte' }[lang] || 'Owed on the card',
    available: { ru: 'Осталось доступно', en: 'Still available', es: 'Disponible', fr: 'Encore disponible' }[lang] || 'Still available',
    availableNote: { ru: 'из лимита {limit}', en: 'of your {limit} limit', es: 'de tu límite {limit}', fr: 'sur votre limite de {limit}' }[lang] || 'of your {limit} limit',
    ownSection: { ru: 'Свои деньги', en: 'Your own money', es: 'Tu dinero', fr: 'Votre argent' }[lang] || 'Your own money',
    ownTotal: { ru: 'всего', en: 'in total', es: 'en total', fr: 'au total' }[lang] || 'in total',
    ownSplit: { ru: 'наличными {cash} · на счетах {bank}', en: '{cash} in cash · {bank} in accounts', es: '{cash} en efectivo · {bank} en cuentas', fr: '{cash} en espèces · {bank} sur les comptes' }[lang] || '{cash} in cash · {bank} in accounts',
    creditSection: { ru: 'Кредитные карты', en: 'Credit cards', es: 'Tarjetas de crédito', fr: 'Cartes de crédit' }[lang] || 'Credit cards',
    creditTotal: { ru: 'должен', en: 'owed', es: 'debes', fr: 'dû' }[lang] || 'owed',
    creditNote: { ru: 'Это заёмные деньги. Трата попадает в расходы в день покупки; платёж по карте — это «Перевод», а не новая трата.', en: 'This is borrowed money. A purchase counts as spending on the day you buy; paying the card off is a Transfer, not a new expense.', es: 'Es dinero prestado. La compra cuenta el día que la haces; pagar la tarjeta es una transferencia, no un gasto nuevo.', fr: "C'est de l'argent emprunté. L'achat compte le jour même ; rembourser la carte est un virement, pas une nouvelle dépense." }[lang] || '',
    noCards: { ru: 'Кредитных карт пока нет.', en: 'No credit cards yet.', es: 'Aún no hay tarjetas de crédito.', fr: 'Aucune carte de crédit pour le moment.' }[lang] || '',
    addCard: { ru: 'Добавить кредитную карту', en: 'Add a credit card', es: 'Añadir tarjeta de crédito', fr: 'Ajouter une carte de crédit' }[lang] || 'Add a credit card',
    addOwn: { ru: 'Добавить счёт или наличные', en: 'Add an account or cash', es: 'Añadir cuenta o efectivo', fr: 'Ajouter un compte ou des espèces' }[lang] || 'Add an account or cash',
    utilization: { ru: 'Загрузка', en: 'Utilization', es: 'Uso del crédito', fr: 'Utilisation du crédit' }[lang] || 'Utilization',
    dueIn: (n) => ({ ru: `Платёж через ${n} дн.`, en: `Due in ${n} day(s)`, es: `Pago en ${n} día(s)`, fr: `Échéance dans ${n} jour(s)` }[lang] || `Due in ${n} day(s)`),
    overdue: { ru: 'Просрочка!', en: 'Overdue!', es: '¡Vencido!', fr: 'En retard !' }[lang] || 'Overdue!',
    payBtn: { ru: 'Записать платёж', en: 'Log a payment', es: 'Registrar un pago', fr: 'Noter un paiement' }[lang] || 'Log a payment',
    payFrom: { ru: 'С какого счёта', en: 'From', es: 'Desde', fr: 'Depuis' }[lang] || 'From',
    payAmountLabel: { ru: 'Сумма платежа', en: 'Payment amount', es: 'Monto del pago', fr: 'Montant du paiement' }[lang] || 'Payment amount',
    confirmPay: { ru: 'Готово', en: 'Done', es: 'Listo', fr: 'Terminé' }[lang] || 'Done',
    delete: { ru: 'Удалить', en: 'Delete', es: 'Eliminar', fr: 'Supprimer' }[lang] || 'Delete',
    highUtil: { ru: 'Загрузка выше 30% — это заметно бьёт по кредитному скорингу.', en: 'Utilization above 30% takes a real bite out of your credit score.', es: 'Usar más del 30% del límite afecta notablemente tu puntaje de crédito.', fr: 'Utiliser plus de 30 % du plafond pèse nettement sur ta cote de crédit.' }[lang] || 'Utilization above 30% takes a real bite out of your credit score.',
    tipsTitle: { ru: 'Как устроены кредитки — коротко', en: 'How credit cards actually work', es: 'Cómo funcionan las tarjetas de crédito, en breve', fr: 'Comment fonctionnent les cartes de crédit, en bref' }[lang] || 'How credit cards actually work',
  }

  // Two piles, because they are two different things: money you have, and
  // money you owe. One mixed list is what made the numbers feel like guesswork.
  const ownRows = rows.filter((a) => a.type !== 'credit')
  const creditRows = rows.filter((a) => a.type === 'credit')
  const ownTotalAmount = ownRows.reduce((sum, a) => sum + a.balance, 0)
  // Cash and bank money behave differently day to day, so the split is worth
  // seeing without adding the accounts up in your head.
  const cashTotalAmount = ownRows.filter((a) => a.type === 'cash').reduce((sum, a) => sum + a.balance, 0)
  const bankTotalAmount = ownTotalAmount - cashTotalAmount
  const creditTotalAmount = creditRows.reduce((sum, a) => sum + Math.max(0, a.balance), 0)

  // Opening the form already set to the right kind: people have several cards,
  // and picking "credit" again on every one is pure friction.
  function openAddForm(type) {
    setForm({ ...emptyForm, type })
    setShowForm(true)
  }

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

                <div className="flex items-center justify-between gap-2 text-xs">
                  <label className="flex items-center gap-2 cursor-pointer text-muted">
                    <input
                      type="checkbox"
                      className="w-4 h-4 accent-primary"
                      disabled={a.balance <= 0}
                      checked={Boolean(cardReminders[a.id]?.enabled)}
                      onChange={(e) => toggleCardReminder(a, e.target.checked)}
                    />
                    {a.balance > 0 ? t('accounts.dailyRemind') : t('accounts.dailyRemindOff')}
                  </label>
                  {cardReminders[a.id]?.enabled && (
                    <input
                      type="time"
                      value={cardReminders[a.id].time}
                      onChange={(e) => e.target.value && toggleCardReminder(a, true, e.target.value)}
                      className="bg-surface2 border border-border rounded-lg px-2 py-1 text-xs text-text outline-none focus:border-primary"
                    />
                  )}
                </div>

                {payingId === a.id ? (
                  <div className="space-y-1.5">
                  {ownRows.length > 0 && (
                    <label className="flex items-center gap-2 text-xs text-muted">
                      {L.payFrom}
                      <select
                        value={payFrom || ownRows[0].id}
                        onChange={(e) => setPayFrom(e.target.value)}
                        className="flex-1 bg-surface2 border border-border rounded-lg px-2 py-1.5 text-sm text-text outline-none focus:border-primary"
                      >
                        {ownRows.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
                      </select>
                    </label>
                  )}
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

        <div className="pt-1">
          <div className="flex items-baseline justify-between">
            <p className="text-[13px] font-bold tracking-wide text-muted uppercase">{L.ownSection}</p>
            <p className="text-sm font-semibold font-num text-savings">{fmt(ownTotalAmount)} <span className="text-[11px] font-normal text-muted">{L.ownTotal}</span></p>
          </div>
          {ownRows.length > 0 && (
            <p className="text-[11px] text-muted mt-0.5 font-num">
              {L.ownSplit.replace('{cash}', fmt(cashTotalAmount)).replace('{bank}', fmt(bankTotalAmount))}
            </p>
          )}
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
              <div className="segmented-control flex bg-surface2 rounded-xl p-1 border border-border">
                {['cash', 'debit', 'credit'].map((tp) => (
                  <button
                    key={tp}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, type: tp }))}
                    className={`flex-1 py-2 rounded-lg text-sm font-semibold ${form.type === tp ? 'segment-active text-text' : 'text-muted'}`}
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
    </div>
  )
}
