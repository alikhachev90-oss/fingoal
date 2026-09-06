import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { Flame, Wallet, ShieldCheck, TrendingDown, PiggyBank, ArrowRight, Target, Compass, ClipboardList } from 'lucide-react'
import TopBar from '../components/TopBar'
import BottomNav from '../components/BottomNav'
import DailyQuoteCard from '../components/DailyQuoteCard'
import BatteryProgress from '../components/BatteryProgress'
import InfoTag from '../components/InfoTag'
import { Card, Button, ProgressBar, StatTile, IconCircle, EmptyState } from '../components/UI'
import { useApp } from '../context/AppContext'
import * as db from '../lib/db'
import { findCategory, pickLang } from '../lib/categories'
import { computeGoalPlan, computeSafeToSpendToday } from '../lib/finance'

// Muted, "graphite" chart colors instead of a harsh stoplight red/amber/green —
// the pie is informational, not a warning light.
const GROUP_HEX = { needs: '#8a5a4a', wants: '#a3893e', savings: '#3f7a5c' }

function fmt(n) {
  return '$' + Math.round(n || 0).toLocaleString('en-US')
}

export default function DashboardScreen() {
  const { user, context, t, lang } = useApp()
  const [settings, setSettings] = useState(null)
  const [transactions, setTransactions] = useState([])
  const [goals, setGoals] = useState([])
  const [streak, setStreak] = useState(0)
  const [checkedInToday, setCheckedInToday] = useState(false)

  useEffect(() => {
    if (!user) return
    db.getSettings(user.id, context).then(setSettings)
    db.listTransactions(user.id, context).then(setTransactions)
    db.listGoals(user.id, context).then(setGoals)
    refreshCheckins()
  }, [user, context])

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
      totals[label] = (totals[label] || { value: 0, group: t.group })
      totals[label].value += t.amount
      totals[label].group = t.group
    }
    return Object.entries(totals)
      .map(([name, v]) => ({ name, value: v.value, group: v.group }))
      .sort((a, b) => b.value - a.value)
  }, [monthTx, lang])

  const monthlyIncome = settings?.monthly_income || 0
  const monthlyNeedsBudget = Object.values(settings?.needs_budget || {}).reduce((s, v) => s + (v || 0), 0)
  const spentNeeds = byGroup.needs
  const freeMoney = monthlyIncome - monthlyNeedsBudget - byGroup.wants
  const maxCategoryValue = byCategory[0]?.value || 1

  const pieData = [
    { key: 'needs', name: t('group.needs'), value: byGroup.needs },
    { key: 'wants', name: t('group.wants'), value: byGroup.wants },
    { key: 'savings', name: t('group.savings'), value: byGroup.savings },
  ].filter((d) => d.value > 0)

  const safeToday = computeSafeToSpendToday(monthlyIncome, monthlyNeedsBudget, byGroup.wants)

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
      <TopBar title={t('dashboard.title')} />
      <div className="flex-1 px-4 py-4 space-y-4">
        <DailyQuoteCard />

        <Card className="!p-0 overflow-hidden">
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
          <Card className={`!p-4 flex items-center justify-between !border-l-[3px] ${safeToday.safePerDay >= 0 ? '!border-l-savings bg-savings/5' : '!border-l-wants bg-wants/5'}`}>
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

        {pieData.length > 0 && (
          <Card>
            <p className="text-sm font-semibold mb-1">{t('dashboard.chartTitle')}</p>
            <div className="h-44">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={48} outerRadius={72} paddingAngle={4} strokeWidth={0}>
                    {pieData.map((d) => (
                      <Cell key={d.key} fill={GROUP_HEX[d.key]} stroke="transparent" />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(v) => fmt(v)}
                    contentStyle={{ borderRadius: 12, border: '1px solid rgb(var(--color-border))', background: 'rgb(var(--color-surface))', fontSize: 13 }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-4 mt-1">
              {pieData.map((d) => (
                <div key={d.key} className="flex items-center gap-1.5 text-xs font-medium">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: GROUP_HEX[d.key] }} />
                  {d.name}: {fmt(d.value)}
                </div>
              ))}
            </div>
          </Card>
        )}

        {byCategory.length > 0 && (
          <Card className="space-y-3">
            <p className="text-sm font-semibold">{t('dashboard.byCategoryTitle')}</p>
            <div className="space-y-3">
              {byCategory.slice(0, 6).map((c) => (
                <div key={c.name}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-text font-medium">{c.name}</span>
                    <span className="font-semibold">{fmt(c.value)}</span>
                  </div>
                  <ProgressBar pct={(c.value / maxCategoryValue) * 100} height="h-1.5" colorClass={`bg-${c.group}`} />
                </div>
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
