import { useEffect, useMemo, useState } from 'react'
import TopBar from '../components/TopBar'
import BottomNav from '../components/BottomNav'
import { Button, Input, Card, Pill } from '../components/UI'
import BatteryProgress from '../components/BatteryProgress'
import GoalReminderButton from '../components/GoalReminderButton'
import TourGuide from '../components/TourGuide'
import { useApp } from '../context/AppContext'
import * as db from '../lib/db'
import { computeGoalPlan, MILESTONES, crossedMilestone } from '../lib/finance'
import { TOURS } from '../lib/tours'

function fmt(n) {
  return '$' + Math.round(n || 0).toLocaleString('en-US')
}

const emptyForm = { name: '', targetAmount: '', deadline: '' }

export default function GoalsScreen() {
  const { user, context, t, lang } = useApp()
  const [settings, setSettings] = useState(null)
  const [goals, setGoals] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [milestoneHit, setMilestoneHit] = useState(null)
  const [tourActive, setTourActive] = useState(false)

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
              <Input label={t('goals.name')} required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder={t('goals.namePlaceholder')} />
              <Input label={t('goals.targetAmount')} type="number" required min="1" value={form.targetAmount} onChange={(e) => setForm((f) => ({ ...f, targetAmount: e.target.value }))} />
              <Input label={t('goals.deadline')} type="date" required value={form.deadline} onChange={(e) => setForm((f) => ({ ...f, deadline: e.target.value }))} />
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
