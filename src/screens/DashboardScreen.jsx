import './DashboardScreen.css'
import FeedbackButton from '../components/FeedbackButton'
import EssentialPaymentsEditor from '../components/EssentialPaymentsEditor'
import { billLabel } from '../lib/essentialBudget'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { Flame, Wallet, ShieldCheck, TrendingDown, PiggyBank, ArrowRight, Target, Compass, ClipboardList, Settings, Landmark, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react'
import BottomNav from '../components/BottomNav'
import DailyQuoteCard from '../components/DailyQuoteCard'
import BatteryProgress from '../components/BatteryProgress'
import InfoTag from '../components/InfoTag'
import ReminderButton from '../components/ReminderButton'
import HabitTipModal from '../components/HabitTipModal'
import TourGuide from '../components/TourGuide'
import { Card, Button, StatTile, IconCircle, EmptyState } from '../components/UI'
import { useApp } from '../context/AppContext'
import * as db from '../lib/db'
import { findCategory, pickLang, subLabel, subHint } from '../lib/categories'
import { computeGoalPlan, computeSafeToSpendToday } from '../lib/finance'
import { detectHabitTip, dismissHabitTip } from '../lib/habitTips'
import { TOURS } from '../lib/tours'
import { computeAccountBalance, nextDateForDay, daysUntil } from '../lib/creditCards'
import { getCoachAction } from '../lib/coach'

function fmt(n) {
  return '$' + Math.round(n || 0).toLocaleString('en-US')
}

// Rank-based heat color (largest slice = red, smallest = green) instead of a
// palette tied to needs/wants/savings — this is what the requested chart
// style actually needs: color encodes "how big a share", not which group.
function rankColor(idx, total) {
  if (total <= 1) return 'hsl(4, 75%, 58%)'
  const hue = Math.round((idx / (total - 1)) * 118)
  return `hsl(${hue}, 72%, 52%)`
}

const MONTH_FMT = { en: 'en-US', es: 'es-ES', fr: 'fr-FR', ru: 'ru-RU' }

export default function DashboardScreen() {
  const { user, context, t, lang } = useApp()
  const [settings, setSettings] = useState(undefined)
  const [editingBills, setEditingBills] = useState(false)
  const [transactions, setTransactions] = useState([])
  const [goals, setGoals] = useState([])
  const [debts, setDebts] = useState([])
  const [accounts, setAccounts] = useState([])
  const [streak, setStreak] = useState(0)
  const [checkedInToday, setCheckedInToday] = useState(false)
  const [checkinSkipped, setCheckinSkipped] = useState(false)
  const [habitTip, setHabitTip] = useState(null)
  const [tourActive, setTourActive] = useState(false)
  const [monthOffset, setMonthOffset] = useState(0)
  const [chartTab, setChartTab] = useState('expenses') // 'income' | 'expenses'

  useEffect(() => {
    if (!user) return
    db.getSettings(user.id, context).then(setSettings)
    db.listTransactions(user.id, context).then((txs) => {
      setTransactions(txs)
      setHabitTip(detectHabitTip(user.id, context, txs))
    })
    db.listGoals(user.id, context).then(setGoals)
    db.listDebts(user.id, context).then(setDebts)
    db.listAccounts(user.id, context).then(setAccounts)
    refreshCheckins()
  }, [user, context])

  function closeHabitTip() {
    if (habitTip) dismissHabitTip(user.id, context, habitTip.key)
    setHabitTip(null)
  }

  function refreshCheckins() {
    db.getCheckins(user.id, context).then((c) => {
      setStreak(db.computeStreak(c))
      const today = new Date().toISOString().slice(0, 10)
      setCheckedInToday(c.some((x) => x.date === today))
    })
  }

  async function handleCheckIn() {
    await db.checkInToday(user.id, context)
    refreshCheckins()
  }

  const monthTx = useMemo(() => {
    const now = new Date()
    return transactions.filter((t) => {
      const d = new Date(t.date)
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
    })
  }, [transactions])

  const byGroup = useMemo(() => {
    const totals = { needs: 0, wants: 0, savings: 0 }
    for (const t of monthTx) totals[t.group] = (totals[t.group] || 0) + t.amount
    return totals
  }, [monthTx])

  const [drilldown, setDrilldown] = useState(null) // {group,key,name,total}

  // The month-navigable chart is deliberately separate from `monthTx` above —
  // safe-to-spend/streak/bills stay pinned to the real current month no
  // matter what month the chart card is browsing.
  const chartMonthDate = useMemo(() => {
    const d = new Date()
    d.setDate(1)
    d.setMonth(d.getMonth() + monthOffset)
    return d
  }, [monthOffset])

  const chartMonthTx = useMemo(() => {
    return transactions.filter((t) => {
      const d = new Date(t.date)
      return d.getMonth() === chartMonthDate.getMonth() && d.getFullYear() === chartMonthDate.getFullYear()
    })
  }, [transactions, chartMonthDate])

  const drilldownSubs = useMemo(() => {
    if (!drilldown) return []
    const totals = {}
    for (const t of chartMonthTx) {
      if (t.group !== drilldown.group || t.category_key !== drilldown.key) continue
      const displayLabel = t.sub ? subLabel(drilldown.group, drilldown.key, t.sub, lang) : pickLang({ ru: 'Без подкатегории', en: 'Uncategorized', es: 'Sin subcategoría', fr: 'Sans sous-catégorie' }, lang)
      const id = t.sub || '__none__'
      totals[id] = totals[id] || { value: 0, name: displayLabel, hint: t.sub ? subHint(drilldown.group, drilldown.key, t.sub, lang) : null }
      totals[id].value += t.amount
    }
    return Object.values(totals).sort((a, b) => b.value - a.value)
  }, [drilldown, chartMonthTx, lang])

  // "Expenses" excludes money moved into savings/goals — that's not spending.
  const chartByCategory = useMemo(() => {
    const totals = {}
    for (const tx of chartMonthTx) {
      if (tx.group === 'savings' || tx.group === 'income') continue
      const cat = findCategory(tx.group, tx.category_key)
      const label = pickLang(cat?.label, lang) || tx.category_key
      const id = `${tx.group}:${tx.category_key}`
      totals[id] = totals[id] || { value: 0, group: tx.group, key: tx.category_key, name: label }
      totals[id].value += tx.amount
    }
    return Object.values(totals).sort((a, b) => b.value - a.value)
  }, [chartMonthTx, lang])

  const chartExpenseTotal = chartByCategory.reduce((s, c) => s + c.value, 0)

  const rankedPieData = chartByCategory.map((c, idx) => ({
    ...c,
    color: rankColor(idx, chartByCategory.length),
    pct: chartExpenseTotal > 0 ? (c.value / chartExpenseTotal) * 100 : 0,
  }))

  const monthlyIncome = settings?.monthly_income || 0
  const monthlyNeedsBudget = Object.values(settings?.needs_budget || {}).reduce((s, v) => s + (v || 0), 0)
  const spentNeeds = byGroup.needs
  const freeMoney = monthlyIncome - monthlyNeedsBudget - byGroup.wants

  // Real money in/out this month, from actual logged transactions — not the
  // manually-configured budget figures above. "Остаток" is deliberately the
  // SAME number AccountsScreen computes per account (computeAccountBalance),
  // just summed across every non-credit account, so it never drifts from
  // what /accounts shows: one ground truth for "how much money do I have",
  // instead of a separately-derived estimate that can disagree with reality.
  const realIncomeThisMonth = monthTx.filter((tx) => tx.group === 'income').reduce((s, tx) => s + tx.amount, 0)
  const realExpenseThisMonth = byGroup.needs + byGroup.wants
  const totalBalance = (accounts || [])
    .filter((a) => a.type !== 'credit')
    .reduce((s, a) => s + computeAccountBalance(a, transactions), 0)

  const safeToday = computeSafeToSpendToday(monthlyIncome, monthlyNeedsBudget, byGroup.wants)

  const billsFromNeeds = Object.entries(settings?.needs_budget || {})
    .filter(([, amount]) => amount > 0)
    .map(([key, amount]) => ({ billId: `needs:${key}`, label: billLabel(key, lang), amount }))
  const billsFromDebts = (debts || [])
    .filter((d) => (d.min_payment || 0) > 0)
    .map((d) => ({ billId: `debt:${d.id}`, label: t('bills.debtLabel', { name: d.name }), amount: d.min_payment }))
  // Credit cards: as soon as spending is logged on one, its running balance
  // (see lib/creditCards.computeAccountBalance) shows up here as something to
  // pay — no separate visit to /accounts needed to notice it's owed.
  const billsFromCards = (accounts || [])
    .filter((a) => a.type === 'credit')
    .map((a) => {
      const balance = computeAccountBalance(a, transactions)
      const dueDate = a.due_day ? nextDateForDay(a.due_day) : null
      const due = dueDate ? daysUntil(dueDate) : null
      return { billId: `card:${a.id}`, label: t('bills.cardLabel', { name: a.name }), amount: balance, due }
    })
    .filter((b) => b.amount > 0)
  const bills = [...billsFromNeeds, ...billsFromDebts, ...billsFromCards]

  const topGoal = goals[0]
  const topGoalPlan = topGoal && settings ? computeGoalPlan(
    { targetAmount: topGoal.target_amount, savedAmount: topGoal.saved_amount, deadline: topGoal.deadline },
    { monthlyIncome, monthlyNeeds: monthlyNeedsBudget },
  ) : null

  const coachAction = getCoachAction({ settings, transactions, goals, debts, lang, checkedInToday })

  const displayName = user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split('@')[0] || 'Александр'

  if (settings === undefined) {\n    return <div className="min-h-[100svh] flex items-center justify-center text-muted">Загрузка…</div>\n  }\n\n  if (!settings) {
    return (
      <div className="flex flex-col min-h-[100svh] max-w-app mx-auto w-full items-center justify-center px-6">
        <EmptyState
          icon={ClipboardList}
          title={t('dashboard.onboardingRequired')}
          subtitle={`${t('dashboard.needsBudget')}: ${context === 'personal' ? t('topbar.personal') : t('topbar.business')}`}
          action={
            <Link to="/onboarding">
              <Button icon={ArrowRight} className="!w-auto px-5">{t('common.next')}</Button>
            </Link>
          }
        />
      </div>
    )
  }

  return (
    <div className="home-reference flex flex-col min-h-[100svh] max-w-app mx-auto w-full">
      <HabitTipModal tip={habitTip} lang={lang} onClose={closeHabitTip} />
      <TourGuide
        userId={user?.id}
        context={context}
        screenKey="dashboard"
        steps={TOURS.dashboard}
        lang={lang}
        active={tourActive}
        onActiveChange={setTourActive}
      />
      <header className="home-heading">
        <div className="home-greeting">
          <p>{t('home.welcome')}</p>
          <h1>{displayName}</h1>
          <p className="home-tagline">{t('home.tagline')}</p>
        </div>
        <div className="home-toolbar">
          <span>{context === 'personal' ? t('topbar.personal') : t('topbar.business')}</span>
          <div className="flex items-center gap-2">
            <button type="button" aria-label={t('home.tour')} onClick={() => setTourActive(true)} className="home-tool"><Compass size={16} /></button>
            <FeedbackButton inline />
            <Link to="/settings" aria-label={t('topbar.settings')} className="home-tool"><Settings size={16} /></Link>
          </div>
        </div>
      </header>
      <div className="dashboard-content flex-1 px-5 py-3 space-y-4">
        <Card data-tour="dash-safe-to-spend" className="balance-hero !p-6">
          <div className="flex items-center gap-3">
            <IconCircle icon={Wallet} className="bg-primary/10 text-primary !rounded-full" size={38} iconSize={18} />
            <p className="text-sm text-white/80">{monthlyIncome > 0 ? t('dashboard.safeToSpend') : t('dashboard.moneyLeft')}</p>
          </div>
          <div className="flex items-center justify-between gap-3 mt-5">
            <p className={`metric-hero font-num ${(monthlyIncome > 0 ? safeToday.safePerDay : totalBalance) < 0 ? 'text-wants' : 'text-text'}`}>{fmt(monthlyIncome > 0 ? safeToday.safePerDay : totalBalance)}</p>
            <Link to="/entry" aria-label={t('nav.entry')} className="glass rounded-full w-11 h-11 flex items-center justify-center text-primary shrink-0"><ArrowRight size={19} /></Link>
          </div>
          {monthlyIncome > 0 && <p className="text-xs text-muted mt-4 leading-relaxed">{safeToday.safePerDay >= 0 ? `${t('dashboard.safeToSpendHintOk')} (${safeToday.daysRemaining} ${t('common.days')})` : t('dashboard.safeToSpendHintNeg')}</p>}
        </Card>
        <Card className="flow-card !p-4" data-tour="dash-money-flow">
          <p className="text-[10.5px] font-bold tracking-wide text-muted uppercase mb-3">{t('dashboard.moneyFlowTitle')}</p>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <p className="text-[10px] text-muted uppercase tracking-wide">{t('dashboard.moneyIn')}</p>
              <p className="text-lg font-bold font-num text-savings mt-1 truncate">{fmt(realIncomeThisMonth)}</p>
            </div>
            <div>
              <p className="text-[10px] text-muted uppercase tracking-wide">{t('dashboard.moneyOut')}</p>
              <p className="text-lg font-bold font-num text-needs mt-1 truncate">{fmt(realExpenseThisMonth)}</p>
            </div>
            <div>
              <p className="text-[10px] text-muted uppercase tracking-wide">{t('dashboard.moneyLeft')}</p>
              <p className={`text-lg font-bold font-num mt-1 truncate ${totalBalance < 0 ? 'text-wants' : 'text-text'}`}>{fmt(totalBalance)}</p>
            </div>
          </div>
        </Card>

        {coachAction && transactions.length >= 3 && (
          <Card className={`coach-card !p-4 overflow-hidden ${coachAction.tone === 'warn' ? '!border-wants/25' : coachAction.tone === 'good' ? '!border-savings/25' : '!border-primary/25'}`}>
            <div className="flex items-start gap-3">
              <IconCircle
                icon={Sparkles}
                size={40}
                iconSize={18}
                className={coachAction.tone === 'warn' ? 'bg-wants/10 text-wants' : coachAction.tone === 'good' ? 'bg-savings/10 text-savings' : 'bg-primary/10 text-primary'}
              />
              <div className="flex-1 min-w-0">
                <p className="text-[10px] uppercase tracking-[.16em] text-muted font-bold">{coachAction.eyebrow}</p>
                <p className="font-display text-[19px] leading-tight mt-1">{coachAction.title}</p>
                <p className="text-[13px] text-muted leading-relaxed mt-2">{coachAction.text}</p>
                <Link to={coachAction.to} className="inline-flex items-center gap-1.5 text-sm text-primary font-semibold mt-3">
                  {coachAction.action} <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          </Card>
        )}

        <Card className="home-habit" data-tour="dash-streak">
          <div className="home-habit-stat">
            <Flame size={23} strokeWidth={1.5} />
            <div><p className="home-streak-number">{streak} {t('common.days')}</p><p className="home-caption">{t('dashboard.streakLabel')} <InfoTag>{t('dashboard.streakInfo')}</InfoTag></p></div>
          </div>
          <div className="home-checkin">
            <p>{t('dashboard.checkinPrompt')}</p>
            {checkedInToday ? <p className="text-savings">{t('dashboard.checkedIn')}</p> : checkinSkipped ? <p className="text-muted">{t('dashboard.checkinLater')}</p> : <div className="flex gap-1.5"><Button type="button" onClick={handleCheckIn}>{t('dashboard.checkinYes')}</Button><Button type="button" variant="secondary" onClick={() => setCheckinSkipped(true)}>{t('dashboard.checkinNo')}</Button></div>}
          </div>
        </Card>

        <div className="grid grid-cols-2 gap-3">
          <StatTile label={t('dashboard.income')} value={fmt(monthlyIncome)} icon={Wallet} iconClassName="bg-primary/10 text-primary" />
          <StatTile
            label={<span className="inline-flex items-center gap-1">{t('dashboard.needsBudget')} <InfoTag>{t('dashboard.needsBudgetInfo')}</InfoTag></span>}
            value={fmt(monthlyNeedsBudget)}
            icon={ShieldCheck}
            iconClassName="bg-needs/10 text-needs"
          />
          <StatTile label={t('dashboard.spentNeeds')} value={fmt(spentNeeds)} valueClassName="text-needs" icon={TrendingDown} iconClassName="bg-needs/10 text-needs" />
          <StatTile
            label={<span className="inline-flex items-center gap-1">{t('dashboard.freeMoney')} <InfoTag>{t('dashboard.freeMoneyInfo')}</InfoTag></span>}
            value={fmt(freeMoney)}
            valueClassName={freeMoney < 0 ? 'text-wants' : 'text-savings'}
            icon={PiggyBank}
            iconClassName="bg-savings/10 text-savings"
          />
        </div>

        <div data-tour="dash-quote" className="px-1">
          <DailyQuoteCard />
        </div>

        {(
          <Card className="space-y-3" data-tour="dash-bills">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-semibold">{t('bills.title')}</p>
              <button type="button" className="text-xs text-primary py-3" onClick={() => setEditingBills(true)}>{t('bills.edit')}</button>
            </div>
            {!bills.length && <p className="text-xs text-muted">{t('bills.empty')}</p>}
            <div className="space-y-2">
              {bills.map((b) => (
                <div key={b.billId} className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{b.label}</p>
                    <p className="text-xs text-muted">
                      {fmt(b.amount)}
                      {b.due !== undefined && b.due !== null && (
                        <span className={b.due < 0 ? 'text-wants font-medium' : ''}>
                          {' · '}{b.due < 0 ? t('bills.cardOverdue') : t('bills.cardDueIn', { n: b.due })}
                        </span>
                      )}
                    </p>
                  </div>
                  <ReminderButton billId={b.billId} label={b.label} amount={b.amount} />
                </div>
              ))}
            </div>
            <p className="text-[11px] text-muted leading-relaxed">{t('bills.notifNote')}</p>
          </Card>
        )}

        <Link to="/accounts">
          <Card className="!p-3.5 flex items-center gap-3 hover:border-primary/50">
            <IconCircle icon={Landmark} className="bg-primary/10 text-primary" size={38} iconSize={17} />
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm">{t('accounts.entryTitle')}</p>
              <p className="text-xs text-muted mt-0.5">{t('accounts.entrySubtitle')}</p>
            </div>
            <ArrowRight size={16} className="text-muted shrink-0" />
          </Card>
        </Link>

        <Card data-tour="dash-chart" className="!p-3.5 space-y-3">
          <div className="flex items-center justify-between">
            <button type="button" onClick={() => setMonthOffset((o) => o - 1)} className="text-muted p-1">
              <ChevronLeft size={17} />
            </button>
            <p className="text-sm font-semibold capitalize">
              {chartMonthDate.toLocaleDateString(MONTH_FMT[lang] || 'en-US', { month: 'short', year: 'numeric' })}
            </p>
            <button
              type="button"
              onClick={() => setMonthOffset((o) => Math.min(0, o + 1))}
              disabled={monthOffset >= 0}
              className="text-muted p-1 disabled:opacity-30"
            >
              <ChevronRight size={17} />
            </button>
          </div>

          <div className="flex bg-surface2 rounded-lg p-1 border border-border">
            {['income', 'expenses'].map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setChartTab(tab)}
                className={`flex-1 flex flex-col items-center py-1.5 rounded-md text-xs font-semibold transition-all ${chartTab === tab ? 'bg-surface shadow-softer text-text' : 'text-muted'}`}
              >
                <span>{t(`dashboard.chartTab_${tab}`)}</span>
                <span className="font-num text-[13px] mt-0.5">{fmt(tab === 'income' ? monthlyIncome : chartExpenseTotal)}</span>
              </button>
            ))}
          </div>

          {chartTab === 'income' ? (
            <p className="text-xs text-muted text-center py-4">{t('dashboard.incomeTabNote')}</p>
          ) : rankedPieData.length > 0 ? (
            <>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={rankedPieData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={43}
                      outerRadius={68}
                      strokeWidth={2}
                      stroke="rgb(var(--color-surface))"
                      onClick={(d) => setDrilldown({ group: d.group, key: d.key, name: d.name, total: d.value })}
                      style={{ cursor: 'pointer' }}
                      label={({ cx, cy, midAngle, outerRadius, name, pct }) => {
                        const RADIAN = Math.PI / 180
                        const r = outerRadius + 28
                        const x = cx + r * Math.cos(-midAngle * RADIAN)
                        const y = cy + r * Math.sin(-midAngle * RADIAN)
                        return (
                          <text x={x} y={y} textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" className="fill-text text-[10.5px] font-semibold">
                            {name} {pct.toFixed(1)}%
                          </text>
                        )
                      }}
                      labelLine={{ stroke: 'rgb(var(--color-border))' }}
                    >
                      {rankedPieData.map((d) => (
                        <Cell key={`${d.group}:${d.key}`} fill={d.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(v) => fmt(v)}
                      contentStyle={{ borderRadius: 12, border: '1px solid rgb(var(--color-border))', background: 'rgb(var(--color-surface))', fontSize: 13 }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="divide-y divide-border">
                {rankedPieData.map((d) => (
                  <button
                    key={`${d.group}:${d.key}`}
                    type="button"
                    onClick={() => setDrilldown({ group: d.group, key: d.key, name: d.name, total: d.value })}
                    className="w-full flex items-center gap-3 py-2.5 text-left"
                  >
                    <span
                      className="text-xs font-bold rounded-lg px-2 py-1 shrink-0 text-black/80 font-num"
                      style={{ background: d.color }}
                    >
                      {Math.round(d.pct)}%
                    </span>
                    <span className="flex-1 text-sm font-medium truncate">{d.name}</span>
                    <span className="text-sm font-semibold font-num shrink-0">{fmt(d.value)}</span>
                  </button>
                ))}
              </div>
            </>
          ) : (
            <p className="text-xs text-muted text-center py-4">{t('dashboard.drilldownEmpty')}</p>
          )}
        </Card>

        {drilldown && (
          <Card className="space-y-2.5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold">{drilldown.name}</p>
                <p className="text-xs text-muted">{t('dashboard.drilldownTotal', { amt: fmt(drilldown.total) })}</p>
              </div>
              <button onClick={() => setDrilldown(null)} type="button" className="text-xs text-muted">✕</button>
            </div>
            {drilldownSubs.length > 0 ? (
              <div className="space-y-2">
                {drilldownSubs.map((s) => (
                  <div key={s.name} className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-1 text-muted">
                      {s.name}
                      {s.hint && <InfoTag>{s.hint}</InfoTag>}
                    </span>
                    <span className="font-medium">{fmt(s.value)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted">{t('dashboard.drilldownEmpty')}</p>
            )}
          </Card>
        )}

        <Card>
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold">{t('dashboard.mainGoalTitle')}</p>
            <Link to="/goals" className="text-xs text-primary font-semibold flex items-center gap-0.5">
              {t('dashboard.allGoals')} <ArrowRight size={12} />
            </Link>
          </div>
          {topGoal ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <IconCircle icon={Target} className="bg-primary/10 text-primary" size={36} iconSize={17} />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate">{topGoal.name}</p>
                  <p className="text-xs text-muted">{t('common.savedOfTarget', { saved: fmt(topGoal.saved_amount), target: fmt(topGoal.target_amount) })}</p>
                </div>
              </div>
              <BatteryProgress pct={topGoalPlan.progressPct} label={t('common.daysLeftLabel', { n: topGoalPlan.daysLeft })} />
              {topGoalPlan.hasGap ? (
                <p className="text-xs text-text font-medium flex items-start gap-1.5 bg-wants/10 rounded-lg px-2.5 py-2">
                  <Compass size={13} className="shrink-0 mt-0.5 text-wants" />
                  {t('dashboard.gapMessage')} — {t('dashboard.gapAmount', { amt: fmt(topGoalPlan.dailyGap) })}. {t('dashboard.gapMessageTail')}
                </p>
              ) : (
                <p className="text-xs text-savings font-medium bg-savings/10 rounded-lg px-2.5 py-2">
                  {t('dashboard.okMessage')}
                </p>
              )}
            </div>
          ) : (
            <Link to="/goals" className="text-sm text-primary font-semibold flex items-center gap-1">
              {t('dashboard.createFirstGoal')} <ArrowRight size={14} />
            </Link>
          )}
        </Card>
      </div>
      <BottomNav />
      {editingBills && <EssentialPaymentsEditor key={user.id + ':' + context} settings={settings} onSaved={setSettings} onClose={() => setEditingBills(false)} />}
    </div>
  )
}
