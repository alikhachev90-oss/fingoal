import { useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import TopBar from '../components/TopBar'
import BottomNav from '../components/BottomNav'
import { Button, Input, Card, Pill, IconCircle } from '../components/UI'
import BatteryProgress from '../components/BatteryProgress'
import GoalReminderButton from '../components/GoalReminderButton'
import TourGuide from '../components/TourGuide'
import InfoTag from '../components/InfoTag'
import { useApp } from '../context/AppContext'
import * as db from '../lib/db'
import { computeGoalPlan, MILESTONES, crossedMilestone } from '../lib/finance'
import { TOURS } from '../lib/tours'
import { GOAL_TIPS } from '../lib/goalGuide'
import { Lightbulb, ShieldCheck, CreditCard, Home, TrendingUp } from 'lucide-react'

function fmt(n) {
  return '$' + Math.round(n || 0).toLocaleString('en-US')
}

function pickLang(obj, lang) {
  return obj?.[lang] || obj?.ru || ''
}

const emptyForm = { name: '', targetAmount: '', deadline: '', why: '' }
const GOAL_PRESETS = [
  { key: 'emergency', icon: ShieldCheck, name: { ru: 'Подушка безопасности', en: 'Emergency fund', es: "Fondo de emergencia", fr: "Fonds d’urgence" }, amount: 5000, months: 6 },
  { key: 'debt', icon: CreditCard, name: { ru: 'Закрыть дорогой долг', en: 'Pay off high-interest debt', es: "Pagar deudas de alto interés", fr: "Rembourser une dette à taux élevé" }, amount: 3000, months: 6 },
  { key: 'purchase', icon: Home, name: { ru: 'Большая покупка', en: 'Major purchase', es: "Gran compra", fr: "Achat important" }, amount: 10000, months: 12 },
  { key: 'invest', icon: TrendingUp, name: { ru: 'Инвестиционный капитал', en: 'Investment capital', es: "Capital de inversión", fr: "Capital d’investissement" }, amount: 10000, months: 12 },
]

function futureDate(months) {
  const d = new Date()
  d.setMonth(d.getMonth() + months)
  return d.toISOString().slice(0, 10)
}


export default function GoalsScreen() {
  const { user, context, t, lang } = useApp()
  const [settings, setSettings] = useState(null)
  const [goals, setGoals] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [milestoneHit, setMilestoneHit] = useState(null)
  const [tourActive, setTourActive] = useState(false)
  const [guideOpen, setGuideOpen] = useState(false)
  const [searchParams, setSearchParams] = useSearchParams()
  const [suggestedAmount, setSuggestedAmount] = useState('')
  const [contributionBusy, setContributionBusy] = useState(false)
  const contributionLock = useRef(false)
  const [contributionMessage, setContributionMessage] = useState('')
  const suggestedGoalId = searchParams.get('goal')

  useEffect(() => {
    if (!user) return
    db.getSettings(user.id, context).then(setSettings)
    refresh()
  }, [user, context])

  useEffect(() => {
    if (suggestedGoalId) setSuggestedAmount(searchParams.get('amount') || '')
  }, [suggestedGoalId, searchParams])

  function refresh() {
    db.listGoals(user.id, context).then(setGoals)
  }

  const monthlyNeedsBudget = useMemo(
    () => Object.values(settings?.needs_budget || {}).reduce((s, v) => s + (v || 0), 0),
    [settings],
  )

  async function createGoal(e) {
    e.preventDefault()
    setSaving(true)
    try {
      await db.upsertGoal(user.id, context, {
        name: form.name,
        target_amount: parseFloat(form.targetAmount),
        deadline: form.deadline,
        why: form.why || null,
        priority: goals.length,
      })
      setForm(emptyForm)
      setShowForm(false)
      refresh()
    } finally {
      setSaving(false)
    }
  }

  async function addSavings(goal, rawAmount) {
    const amt = rawAmount ?? window.prompt(t('goals.addSavingsPrompt', { name: goal.name }))
    const num = parseFloat(amt)
    if (!Number.isFinite(num) || num <= 0 || contributionLock.current) return false
    contributionLock.current = true
    setContributionBusy(true)
    setContributionMessage('')
    try {
    const prevPct = goal.target_amount > 0 ? Math.min(100, Math.round(((goal.saved_amount || 0) / goal.target_amount) * 100)) : 0
    const updated = await db.addToGoalSavings(user.id, goal.id, num)
    const newPct = goal.target_amount > 0 ? Math.min(100, Math.round(((updated?.saved_amount || 0) / goal.target_amount) * 100)) : 0
    const milestone = crossedMilestone(prevPct, newPct)
    if (milestone) {
      setMilestoneHit({ pct: milestone, goalName: goal.name })
      setTimeout(() => setMilestoneHit(null), 4000)
    }
    setContributionMessage(t('goals.contributionRecorded', { amt: fmt(num), name: goal.name }))
    await db.checkInToday(user.id, context).catch(() => {})
    refresh()
    return true
    } catch {
      setContributionMessage(t('bills.error'))
      return false
    } finally {
      contributionLock.current = false
      setContributionBusy(false)
    }
  }

  async function saveSuggestedContribution(event, goal) {
    event.preventDefault()
    const saved = await addSavings(goal, suggestedAmount)
    if (saved) setSearchParams({})
  }

  async function removeGoal(id) {
    if (!window.confirm(t('goals.deleteConfirm'))) return
    await db.deleteGoal(user.id, id)
    refresh()
  }

  return (
    <div className="screen-goals flex flex-col min-h-[100svh] max-w-app mx-auto w-full">
      <TourGuide
        userId={user?.id}
        context={context}
        screenKey="goals"
        steps={TOURS.goals}
        lang={lang}
        active={tourActive}
        onActiveChange={setTourActive}
      />
      <TopBar title={t('goals.title')} onHelp={() => setTourActive(true)} />
      <div className="flex-1 px-4 py-4 space-y-4">
        {contributionMessage && <p role="status" className="glass rounded-xl p-3 text-sm">{contributionMessage}</p>}
        {milestoneHit && (
          <Card className="bg-primary/10 border-primary/30 text-center">
            <p className="text-sm font-medium">{t('goals.milestoneToast', { name: milestoneHit.goalName, pct: milestoneHit.pct })}</p>
          </Card>
        )}

        <Card className="!p-3.5 space-y-2">
          <button type="button" onClick={() => setGuideOpen((v) => !v)} className="w-full flex items-center justify-between text-left">
            <span className="text-sm font-semibold flex items-center gap-1.5">
              <Lightbulb size={14} className="text-primary shrink-0" /> {t('goals.guideTitle')}
            </span>
            <span className="text-xs text-primary shrink-0">{guideOpen ? '−' : t('goals.guideToggle')}</span>
          </button>
          {guideOpen && (
            <div className="space-y-2.5 pt-1">
              {GOAL_TIPS.map((tip) => (
                <div key={tip.id} className="bg-surface2 rounded-lg p-2.5">
                  <p className="text-sm font-medium">{pickLang(tip.title, lang)}</p>
                  <p className="text-xs text-muted mt-1 leading-relaxed">{pickLang(tip.body, lang)}</p>
                  <p className="text-[11px] text-muted/70 mt-1">— {pickLang(tip.source, lang)}</p>
                </div>
              ))}
            </div>
          )}
        </Card>
        {goals.length === 0 && !showForm && (
          <Card className="!p-4 space-y-3 border-primary/20">
            <div>
              <p className="text-[10px] uppercase tracking-[.16em] text-primary font-bold">{t('goals.quickStart')}</p>
              <p className="font-display text-xl mt-1">{t('goals.direction')}</p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {GOAL_PRESETS.map((preset) => (
                <button
                  key={preset.key}
                  type="button"
                  onClick={() => {
                    setForm({
                      name: pickLang(preset.name, lang),
                      targetAmount: String(preset.amount),
                      deadline: futureDate(preset.months),
                      why: '',
                    })
                    setShowForm(true)
                  }}
                  className="glass rounded-2xl p-3 text-left min-h-[98px] hover:border-primary/35 transition-all active:scale-[.98]"
                >
                  <IconCircle icon={preset.icon} className="bg-primary/10 text-primary" size={34} iconSize={15} />
                  <p className="text-sm font-semibold mt-3 leading-tight">{pickLang(preset.name, lang)}</p>
                  <p className="text-[11px] text-muted mt-1 font-num">{fmt(preset.amount)} · {preset.months} {t('goals.monthShort')}</p>
                </button>
              ))}
            </div>
          </Card>
        )}

        {goals.map((goal) => {
          const isSuggestedGoal = suggestedGoalId === goal.id
          const plan = settings
            ? computeGoalPlan(
                { targetAmount: goal.target_amount, savedAmount: goal.saved_amount, deadline: goal.deadline },
                { monthlyIncome: settings.monthly_income, monthlyNeeds: monthlyNeedsBudget },
              )
            : null
          return (
            <Card key={goal.id} className="goal-card space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold">{goal.name}</p>
                  <p className="text-xs text-muted">{t('goals.until', { date: new Date(goal.deadline).toLocaleDateString('en-US') })}</p>
                </div>
                <button onClick={() => removeGoal(goal.id)} className="text-xs text-muted">✕</button>
              </div>

              {goal.why && <p className="text-xs text-muted italic bg-surface2 rounded-lg px-2.5 py-2">« {goal.why} »</p>}

              <BatteryProgress pct={plan?.progressPct || 0} label={t('common.savedOfTarget', { saved: fmt(goal.saved_amount), target: fmt(goal.target_amount) })} />

              {plan && (
                <div className="text-xs text-muted space-y-1 bg-surface2 rounded-lg p-2.5" data-tour="goals-plan">
                  <p>{t('goals.perDay')}: <span className="text-text font-medium">{t('goals.perDayValue', { amt: fmt(plan.perDay) })}</span> ({t('goals.perMonth', { amt: fmt(plan.perMonth) })})</p>
                  <p>{t('goals.daysLeft')}: {plan.daysLeft}</p>
                  <p>{t('goals.requiredIncomeLabel')}: <span className="text-text font-medium">{fmt(plan.requiredDailyIncome)}</span></p>
                  {plan.hasGap ? (
                    <p className="text-text">
                      {t('goals.gapIntro', { amt: fmt(plan.dailyGap) })}{' '}
                      {plan.suggestedExtraDays ? t('goals.gapPushDeadline', { days: plan.suggestedExtraDays }) + ' ' : ''}{t('goals.gapCutWants')}
                    </p>
                  ) : (
                    <p className="text-savings">{t('goals.okMessage')}</p>
                  )}
                </div>
              )}

              {MILESTONES.filter((m) => plan?.progressPct >= m).length > 0 && (
                <div className="flex gap-1.5">
                  {MILESTONES.filter((m) => plan?.progressPct >= m).map((m) => (
                    <Pill key={m} className="bg-savings/10 text-savings">🏆 {m}%</Pill>
                  ))}
                </div>
              )}

              {isSuggestedGoal && (
                <form onSubmit={(event) => saveSuggestedContribution(event, goal)} className="bg-primary/10 border border-primary/25 rounded-xl p-3 space-y-2.5">
                  <p className="text-sm font-medium">{t('goals.coachContributionTitle')}</p>
                  <p className="text-xs text-muted">{t('goals.coachContributionHint')}</p>
                  <div className="flex items-end gap-2">
                    <Input label={t('goals.coachContributionAmount')} type="number" min="1" step="1" required value={suggestedAmount} onChange={(event) => setSuggestedAmount(event.target.value)} />
                    <Button type="submit" disabled={contributionBusy} className="!w-auto px-4 shrink-0">{t(contributionBusy ? 'common.saving' : 'goals.coachContributionSave')}</Button>
                  </div>
                </form>
              )}

              <div className="flex items-center gap-2 flex-wrap">
                <Button variant="secondary" disabled={contributionBusy} onClick={() => addSavings(goal)} type="button" className="!w-auto flex-1">{t('goals.addSavingsToday')}</Button>
                <span data-tour="goals-reminder">
                  <GoalReminderButton goalId={goal.id} />
                </span>
              </div>
            </Card>
          )
        })}

        {showForm ? (
          <Card>
            <form onSubmit={createGoal} className="space-y-3">
              <h2 className="font-semibold">{t('goals.createGoal')}</h2>
              <div>
                <Input label={<span className="inline-flex items-center gap-1">{t('goals.name')} <InfoTag>{t('goals.nameHint')}</InfoTag></span>} required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder={t('goals.namePlaceholder')} />
              </div>
              <Input label={t('goals.targetAmount')} type="number" required min="1" value={form.targetAmount} onChange={(e) => setForm((f) => ({ ...f, targetAmount: e.target.value }))} />
              <div>
                <Input label={<span className="inline-flex items-center gap-1">{t('goals.deadline')} <InfoTag>{t('goals.deadlineHint')}</InfoTag></span>} type="date" required value={form.deadline} onChange={(e) => setForm((f) => ({ ...f, deadline: e.target.value }))} />
              </div>
              <div>
                <label className="block text-sm mb-1">
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-muted">{t('goals.why')} <InfoTag>{t('goals.whyHint')}</InfoTag></span>
                </label>
                <textarea
                  value={form.why}
                  onChange={(e) => setForm((f) => ({ ...f, why: e.target.value }))}
                  placeholder={t('goals.whyPlaceholder')}
                  rows={2}
                  className="w-full bg-surface2 border border-border rounded-lg px-3 py-2.5 text-[15px] outline-none focus:border-primary resize-none"
                />
              </div>
              <div className="flex gap-2">
                <Button variant="secondary" type="button" onClick={() => setShowForm(false)}>{t('goals.cancel')}</Button>
                <Button type="submit" disabled={saving}>{saving ? t('goals.saving') : t('goals.submitCreate')}</Button>
              </div>
            </form>
          </Card>
        ) : (
          <Button onClick={() => setShowForm(true)} type="button" data-tour="goals-new">{t('goals.newGoal')}</Button>
        )}
      </div>
      <BottomNav />
    </div>
  )
}
