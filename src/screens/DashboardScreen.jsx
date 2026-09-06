import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { Flame, Wallet, ShieldCheck, TrendingDown, PiggyBank, ArrowRight, Target, Compass, ClipboardList, Landmark } from 'lucide-react'
import TopBar from '../components/TopBar'
import BottomNav from '../components/BottomNav'
import DailyQuoteCard from '../components/DailyQuoteCard'
import BatteryProgress from '../components/BatteryProgress'
import InfoTag from '../components/InfoTag'
import ReminderButton from '../components/ReminderButton'
import HabitTipModal from '../components/HabitTipModal'
import TourGuide from '../components/TourGuide'
import { Card, Button, ProgressBar, StatTile, IconCircle, EmptyState } from '../components/UI'
import { useApp } from '../context/AppContext'
import * as db from '../lib/db'
import { findCategory, pickLang, subLabel, subHint, CATEGORY_TREE } from '../lib/categories'
import { computeGoalPlan, computeSafeToSpendToday } from '../lib/finance'
import { detectHabitTip, dismissHabitTip } from '../lib/habitTips'
import { TOURS } from '../lib/tours'
import { computeAccountBalance, nextDateForDay, daysUntil } from '../lib/creditCards'

// Muted, "graphite" chart colors instead of a harsh stoplight red/amber/green —
// the pie is informational, not a warning light.
const GROUP_HEX = { needs: '#8a5a4a', wants: '#a3893e', savings: '#3f7a5c' }

// Lightens a hex color by mixing it toward white — used to give same-group
// pie slices (e.g. several Needs categories) distinct-enough shades while
// staying visually grouped by color family.
function shade(hex, amt) {
  const n = parseInt(hex.slice(1), 16)
  const r = Math.min(255, Math.round(((n >> 16) & 255) + (255 - ((n >> 16) & 255)) * amt))
  const g = Math.min(255, Math.round(((n >> 8) & 255) + (255 - ((n >> 8) & 255)) * amt))
  const b = Math.min(255, Math.round((n & 255) + (255 - (n & 255)) * amt))
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`
}

function fmt(n) {
  return '$' + Math.round(n || 0).toLocaleString('en-US')
}

export default function DashboardScreen() {
  const { user, context, t, lang } = useApp()
  const [settings, setSettings] = useState(null)
  const [transactions, setTransactions] = useState([])
  const [goals, setGoals] = useState([])
  const [debts, setDebts] = useState([])
  const [accounts, setAccounts] = useState([])
  const [streak, setStreak] = useState(0)
  const [checkedInToday, setCheckedInToday] = useState(false)
  const [habitTip, setHabitTip] = useState(null)
  const [tourActive, setTourActive] = useState(false)

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

  const byCategory = useMemo(() => {
    const totals = {}
    for (const t of monthTx) {
      const cat = findCategory(t.group, t.category_key)
      const label = pickLang(cat?.label, lang) || t.category_key
      const id = `${t.group}:${t.category_key}`
      totals[id] = totals[id] || { value: 0, group: t.group, key: t.category_key, name: label }
      totals[id].value += t.amount
    }
    return Object.values(totals).sort((a, b) => b.value - a.value)
  }, [monthTx, lang])

  const [drilldown, setDrilldown] = useState(null) // {group,key,name,total}

  const drilldownSubs = useMemo(() => {
    if (!drilldown) return []
    const totals = {}
    for (const t of monthTx) {
      if (t.group !== drilldown.group || t.category_key !== drilldown.key) continue
      const displayLabel = t.sub ? subLabel(drilldown.group, drilldown.key, t.sub, lang) : (lang === 'en' ? 'Uncategorized' : 'Без подкатегории')
      const id = t.sub || '__none__'
      totals[id] = totals[id] || { value: 0, name: displayLabel, hint: t.sub ? subHint(drilldown.group, drilldown.key, t.sub, lang) : null }
      totals[id].value += t.amount
    }
    return Object.values(totals).sort((a, b) => b.value - a.value)
  }, [drilldown, monthTx, lang])

  const monthlyIncome = settings?.monthly_income || 0
  const monthlyNeedsBudget = Object.values(settings?.needs_budget || {}).reduce((s, v) => s + (v || 0), 0)
  const spentNeeds = byGroup.needs
  const freeMoney = monthlyIncome - monthlyNeedsBudget - byGroup.wants
  const maxCategoryValue = byCategory[0]?.value || 1

  // Pie is at the category level (Housing, Transport, Cafe...), not just the
  // three top groups — each slice tinted by its parent group's color so the
  // needs/wants/savings split still reads at a glance, but clicking a slice
  // drills into what that category is actually made of (see drilldownSubs).
  const pieData = byCategory.map((c) => {
    const siblings = byCategory.filter((x) => x.group === c.group)
    const idx = siblings.indexOf(c)
    const tint = siblings.length > 1 ? (idx / (siblings.length - 1)) * 0.55 : 0
    return { ...c, color: shade(GROUP_HEX[c.group], tint) }
  })

  const safeToday = computeSafeToSpendToday(monthlyIncome, monthlyNeedsBudget, byGroup.wants)

  const needsCats = CATEGORY_TREE.needs || []
  const billsFromNeeds = needsCats
    .filter((c) => (settings?.needs_budget?.[c.key] || 0) > 0)
    .map((c) => ({ billId: `needs:${c.key}`, label: pickLang(c.label, lang), amount: settings.needs_budget[c.key] }))
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

  if (settings === null) {
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
    <div className="flex flex-col min-h-[100svh] max-w-app mx-auto w-full">
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
      <TopBar title={t('dashboard.title')} onHelp={() => setTourActive(true)} />
      <div className="flex-1 px-4 py-4 space-y-4">
        <div data-tour="dash-quote">
          <DailyQuoteCard />
        </div>

        <Card className="!p-0 overflow-hidden" data-tour="dash-streak">
          <div className="bg-[#181712] px-4 pt-4 pb-5 border-b-2 border-[#d4af37]/70">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full border border-[#d4af37]/50 flex items-center justify-center shrink-0">
                  <Flame size={20} className="text-[#d4af37]" strokeWidth={2} />
                </div>
                <div>
                  <p className="text-2xl font-semibold font-display leading-none text-[#f3ede0]">{streak} {t('common.days')}</p>
                  <p className="text-xs text-[#a39a85] mt-1 uppercase tracking-wide flex items-center gap-1">
                    {t('dashboard.streakLabel')}
                    <span className="opacity-70">
                      <InfoTag>{t('dashboard.streakInfo')}</InfoTag>
                    </span>
                  </p>
                </div>
              </div>
              <p className="text-xs font-medium text-[#c9bfa8] text-right max-w-[8rem] leading-snug">{t('dashboard.checkinPrompt')}</p>
            </div>
          </div>
          <div className="p-3">
            {checkedInToday ? (
              <p className="text-sm text-savings font-semibold text-center bg-savings/10 rounded-xl py-2.5">{t('dashboard.checkedIn')}</p>
            ) : (
              <div className="flex gap-2">
                <Button onClick={handleCheckIn} type="button">{t('dashboard.checkinYes')}</Button>
                <Button variant="secondary" type="button" onClick={() => {}} className="!w-auto px-4">{t('dashboard.checkinNo')}</Button>
              </div>
            )}
          </div>
        </Card>

        {monthlyIncome > 0 && (
          <Card data-tour="dash-safe-to-spend" className={`!p-4 flex items-center justify-between !border-l-[3px] ${safeToday.safePerDay >= 0 ? '!border-l-savings bg-savings/5' : '!border-l-wants bg-wants/5'}`}>
            <div>
              <p className="text-xs text-muted font-medium uppercase tracking-wide">{t('dashboard.safeToSpend')}</p>
              <p className={`text-2xl font-bold font-num mt-0.5 ${safeToday.safePerDay >= 0 ? 'text-savings' : 'text-wants'}`}>
                {safeToday.safePerDay >= 0 ? fmt(safeToday.safePerDay) : `−${fmt(Math.abs(safeToday.safePerDay))}`}
              </p>
              <p className="text-xs text-muted mt-0.5">
                {safeToday.safePerDay >= 0
                  ? `${t('dashboard.safeToSpendHintOk')} (${safeToday.daysRemaining} ${t('common.days')})`
                  : t('dashboard.safeToSpendHintNeg')}
              </p>
            </div>
            <IconCircle icon={PiggyBank} className={safeToday.safePerDay >= 0 ? 'bg-savings/10 text-savings' : 'bg-wants/10 text-wants'} size={40} iconSize={18} />
          </Card>
        )}

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

        {bills.length > 0 && (
          <Card className="space-y-3" data-tour="dash-bills">
            <p className="text-sm font-semibold">{t('bills.title')}</p>
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

        {pieData.length > 0 && (
          <Card data-tour="dash-chart">
            <div className="flex items-center justify-between mb-1">
              <p className="text-sm font-semibold">{t('dashboard.chartTitle')}</p>
              <span className="text-[11px] text-muted">{t('dashboard.chartTapHint')}</span>
            </div>
            <div className="h-44">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={48}
                    outerRadius={72}
                    paddingAngle={4}
                    strokeWidth={0}
                    onClick={(d) => setDrilldown({ group: d.group, key: d.key, name: d.name, total: d.value })}
                    style={{ cursor: 'pointer' }}
                  >
                    {pieData.map((d) => (
                      <Cell key={`${d.group}:${d.key}`} fill={d.color} stroke="transparent" />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(v) => fmt(v)}
                    contentStyle={{ borderRadius: 12, border: '1px solid rgb(var(--color-border))', background: 'rgb(var(--color-surface))', fontSize: 13 }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap justify-center gap-x-3 gap-y-1.5 mt-1">
              {pieData.map((d) => (
                <button
                  key={`${d.group}:${d.key}`}
                  type="button"
                  onClick={() => setDrilldown({ group: d.group, key: d.key, name: d.name, total: d.value })}
                  className="flex items-center gap-1.5 text-xs font-medium"
                >
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: d.color }} />
                  {d.name}: {fmt(d.value)}
                </button>
              ))}
            </div>
          </Card>
        )}

        {drilldown && (
          <Card className="space-y-2.5 !border-l-[3px]" style={{ borderLeftColor: GROUP_HEX[drilldown.group] }}>
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

        {byCategory.length > 0 && (
          <Card className="space-y-3">
            <p className="text-sm font-semibold">{t('dashboard.byCategoryTitle')}</p>
            <div className="space-y-3">
              {byCategory.slice(0, 6).map((c) => (
                <button
                  key={`${c.group}:${c.key}`}
                  type="button"
                  onClick={() => setDrilldown({ group: c.group, key: c.key, name: c.name, total: c.value })}
                  className="w-full text-left"
                >
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-text font-medium">{c.name}</span>
                    <span className="font-semibold">{fmt(c.value)}</span>
                  </div>
                  <ProgressBar pct={(c.value / maxCategoryValue) * 100} height="h-1.5" colorClass={`bg-${c.group}`} />
                </button>
              ))}
            </div>
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
    </div>
  )
}
