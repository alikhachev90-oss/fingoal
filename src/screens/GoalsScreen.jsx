import { useEffect, useMemo, useState } from 'react'
import TopBar from '../components/TopBar'
import BottomNav from '../components/BottomNav'
import { Button, Input, Card, Pill } from '../components/UI'
import BatteryProgress from '../components/BatteryProgress'
import GoalReminderButton from '../components/GoalReminderButton'
import TourGuide from '../components/TourGuide'
import InfoTag from '../components/InfoTag'
import { useApp } from '../context/AppContext'
import * as db from '../lib/db'
import { computeGoalPlan, MILESTONES, crossedMilestone } from '../lib/finance'
import { TOURS } from '../lib/tours'
import { GOAL_TIPS } from '../lib/goalGuide'
import { Lightbulb } from 'lucide-react'

function fmt(n) {
  return '$' + Math.round(n || 0).toLocaleString('en-US')
}

function pickLang(obj, lang) {
  return obj?.[lang] || obj?.ru || ''
}

const emptyForm = { name: '', targetAmount: '', deadline: '', why: '' }

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

  useEffect(() => {
    if (!user) return
    db.getSettings(user.id, context).then(setSettings)
    refresh()
  }, [user, context])

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

  async function addSavings(goal) {
    const amt = window.prompt(t('goals.addSavingsPrompt', { name: goal.name }))
    const num = parseFloat(amt)
    if (!num || num <= 0) return
    const prevPct = goal.target_amount > 0 ? Math.min(100, Math.round(((goal.saved_amount || 0) / goal.target_amount) * 100)) : 0
    const updated = await db.addToGoalSavings(user.id, goal.id, num)
    const newPct = goal.target_amount > 0 ? Math.min(100, Math.round(((updated?.saved_amount || 0) / goal.target_amount) * 100)) : 0
    const milestone = crossedMilestone(prevPct, newPct)
    if (milestone) {
      setMilestoneHit({ pct: milestone, goalName: goal.name })
      setTimeout(() => setMilestoneHit(null), 4000)
    }
    await db.checkInToday(user.id, context)
    refresh()
  }

  async function removeGoal(id) {
    if (!window.confirm(t('goals.deleteConfirm'))) return
    await db.deleteGoal(user.id, id)
    refresh()
  }

  return (
    <div className="flex flex-col min-h-[100svh] max-w-app mx-auto w-full">
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
        {goals.map((goal) => {
          const plan = settings
            ? computeGoalPlan(
                { targetAmount: goal.target_amount, savedAmount: goal.saved_amount, deadline: goal.deadline },
                { monthlyIncome: settings.monthly_income, monthlyNeeds: monthlyNeedsBudget },
              )
            : null
          return (
            <Card key={goal.id} className="space-y-3">
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

              <div className="flex items-center gap-2 flex-wrap">
                <Button variant="secondary" onClick={() => addSavings(goal)} type="button" className="!w-auto flex-1">{t('goals.addSavingsToday')}</Button>
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
