import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import TopBar from '../components/TopBar'
import BottomNav from '../components/BottomNav'
import { Button, Input, Card, Pill } from '../components/UI'
import { useApp } from '../context/AppContext'
import * as db from '../lib/db'
import { suggestCategories, CATEGORY_TREE, GROUP_PILL_CLASSES, findCategory, pickLang, subLabel, subHint } from '../lib/categories'
import InfoTag from '../components/InfoTag'
import { computeGoalPlan, daysSavedByAmount, crossedMilestone } from '../lib/finance'
import { parseQuickEntry } from '../lib/aiInsights'
import { Wand2 } from 'lucide-react'

export default function EntryScreen() {
  const { user, context, t, lang } = useApp()
  const navigate = useNavigate()

  const [amount, setAmount] = useState('')
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [comment, setComment] = useState('')
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState(null) // {group,key,sub,label,explanation}
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [milestoneHit, setMilestoneHit] = useState(null)
  const [topGoal, setTopGoal] = useState(null)
  const [settings, setSettings] = useState(null)
  const [quickText, setQuickText] = useState('')
  const [quickResult, setQuickResult] = useState(null)
  const [roundUp, setRoundUp] = useState(true)
  const [roundUpNote, setRoundUpNote] = useState(null)
  const [pendingCat, setPendingCat] = useState(null) // {group,key} — waiting for a sub pick
  const [accounts, setAccounts] = useState([])
  const [accountId, setAccountId] = useState('')

  useEffect(() => {
    if (!user) return
    db.listGoals(user.id, context).then((goals) => setTopGoal(goals?.[0] || null))
    db.getSettings(user.id, context).then(setSettings)
    db.listAccounts(user.id, context).then(setAccounts)
  }, [user, context])

  const suggestions = useMemo(() => suggestCategories(query, lang), [query, lang])

  function pickSuggestion(s) {
    const subDisplay = s.sub ? subLabel(s.group, s.key, s.sub, lang) : null
    setSelected({ ...s, sub: s.sub, subDisplay })
    setQuery(subDisplay ? `${s.label} → ${subDisplay}` : s.label)
  }

  function runQuickParse() {
    const parsed = parseQuickEntry(quickText, lang)
    setQuickResult(parsed)
    if (parsed?.amount) setAmount(String(parsed.amount))
    if (parsed?.suggestion) pickSuggestion(parsed.suggestion)
    if (!comment && quickText.trim()) setComment(quickText.trim())
  }

  // Step 1: pick the top-level category. If it has sub-categories, wait for
  // step 2 instead of finalizing right away — this is the "what actually
  // belongs under Housing/Transport?" clarity the manual picker was missing.
  function pickManualCategory(group, key) {
    const cat = findCategory(group, key)
    if (cat.subs && cat.subs.length > 0) {
      setSelected(null)
      setPendingCat({ group, key })
      setQuery(pickLang(cat.label, lang))
      return
    }
    finalizeManual(group, key, null)
  }

  function finalizeManual(group, key, subKey) {
    const cat = findCategory(group, key)
    const label = pickLang(cat.label, lang)
    const subDisplay = subKey ? subLabel(group, key, subKey, lang) : null
    setSelected({ group, key, sub: subKey || null, subDisplay, label, explanation: null })
    setQuery(subDisplay ? `${label} → ${subDisplay}` : label)
    setPendingCat(null)
  }

  const goalPlan = useMemo(() => {
    if (!topGoal || !settings) return null
    const monthlyNeeds = Object.values(settings.needs_budget || {}).reduce((s, v) => s + (v || 0), 0)
    return computeGoalPlan(
      { targetAmount: topGoal.target_amount, savedAmount: topGoal.saved_amount, deadline: topGoal.deadline },
      { monthlyIncome: settings.monthly_income, monthlyNeeds },
    )
  }, [topGoal, settings])

  const wantsImpactDays = useMemo(() => {
    if (!selected || selected.group !== 'wants' || !goalPlan || !amount) return null
    return daysSavedByAmount(parseFloat(amount) || 0, goalPlan.perDay)
  }, [selected, goalPlan, amount])

  async function handleSave() {
    if (!selected || !amount) return
    setSaving(true)
    try {
      await db.addTransaction(user.id, context, {
        amount: parseFloat(amount),
        date,
        comment,
        group: selected.group,
        category_key: selected.key,
        sub: selected.sub,
        account_id: accountId || null,
      })
      let milestone = null
      if (selected.group === 'savings') {
        // Putting money toward savings is what the daily check-in/streak tracks.
        if (topGoal && (selected.key === 'emergency' || selected.key === 'investments' || selected.key === 'debt_extra')) {
          const prevPct = goalPlan?.progressPct || 0
          const updatedGoal = await db.addToGoalSavings(user.id, topGoal.id, parseFloat(amount))
          const newPct = topGoal.target_amount > 0 ? Math.min(100, Math.round(((updatedGoal?.saved_amount || 0) / topGoal.target_amount) * 100)) : 0
          milestone = crossedMilestone(prevPct, newPct)
          if (milestone) setMilestoneHit({ pct: milestone, goalName: topGoal.name })
        }
        await db.checkInToday(user.id, context)
      } else if (roundUp && topGoal) {
        // Round-up savings: spare change from Needs/Wants purchases nudges the goal forward too.
        const spent = parseFloat(amount)
        const upTo = Math.ceil(spent)
        const diff = Math.round((upTo - spent) * 100) / 100
        if (diff > 0.009) {
          const prevPct = goalPlan?.progressPct || 0
          await db.addTransaction(user.id, context, {
            amount: diff,
            date,
            comment: t('entry.roundUpComment'),
            group: 'savings',
            category_key: 'roundup',
            sub: null,
          })
          const updatedGoal = await db.addToGoalSavings(user.id, topGoal.id, diff)
          const newPct = topGoal.target_amount > 0 ? Math.min(100, Math.round(((updatedGoal?.saved_amount || 0) / topGoal.target_amount) * 100)) : 0
          const m = crossedMilestone(prevPct, newPct)
          if (m) setMilestoneHit({ pct: m, goalName: topGoal.name })
          setRoundUpNote(t('entry.roundUpNote', { amt: diff.toFixed(2), name: topGoal.name }))
        }
      }
      setSaved(true)
      setTimeout(() => navigate('/dashboard'), milestone ? 2200 : 900)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col min-h-[100svh] max-w-app mx-auto w-full">
      <TopBar title={t('entry.title')} />
      <div className="flex-1 px-4 py-4 space-y-4">
        <Card className="!p-3.5 space-y-2.5 border-l-[3px] !border-l-primary bg-surface2/40">
          <p className="text-xs font-semibold text-muted uppercase tracking-wide flex items-center gap-1.5">
            <Wand2 size={13} className="text-primary" /> {t('entry.quickLabel')}
          </p>
          <div className="flex gap-2">
            <input
              value={quickText}
              onChange={(e) => setQuickText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && runQuickParse()}
              placeholder={t('entry.quickPlaceholder')}
              className="flex-1 bg-surface border border-border rounded-lg px-3 py-2.5 text-[15px] outline-none focus:border-primary focus:ring-1 focus:ring-primary/40"
            />
            <Button variant="secondary" className="!w-auto px-3.5" onClick={runQuickParse} type="button">{t('entry.quickParse')}</Button>
          </div>
          {quickResult && (
            <p className="text-xs text-muted">
              {quickResult.amount ? t('entry.quickResultAmount', { amt: quickResult.amount }) : t('entry.quickResultNoAmount')}
              {quickResult.suggestion ? t('entry.quickResultCatFound') : t('entry.quickResultCatNotFound')}
            </p>
          )}
        </Card>

        <Card className="space-y-3">
          <Input label={t('entry.amount')} type="number" min="0" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0" />
          <Input label={t('entry.date')} type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          <Input label={t('entry.comment')} value={comment} onChange={(e) => setComment(e.target.value)} placeholder={t('entry.commentPlaceholder')} />
          {accounts.length > 0 && (
            <label className="block text-sm">
              <span className="text-muted text-xs font-medium">{t('entry.accountLabel')}</span>
              <select
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                className="mt-1 w-full bg-surface2 border border-border rounded-lg px-3 py-2.5 text-[15px] outline-none focus:border-primary"
              >
                <option value="">{t('entry.accountNone')}</option>
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>{a.name}{a.type === 'credit' ? ` (${t('accounts.credit')})` : ''}</option>
                ))}
              </select>
            </label>
          )}
          {topGoal && (
            <label className="flex items-center justify-between text-sm pt-1 cursor-pointer">
              <span className="text-muted">{t('entry.roundUpLabel', { name: topGoal.name })}</span>
              <input type="checkbox" checked={roundUp} onChange={(e) => setRoundUp(e.target.checked)} className="w-4 h-4 accent-primary" />
            </label>
          )}
        </Card>

        <Card className="space-y-3">
          <Input
            label={t('entry.category')}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setSelected(null)
              setPendingCat(null)
            }}
            placeholder={t('entry.categoryPlaceholder')}
          />

          {!selected && !pendingCat && suggestions.length > 0 && (
            <div className="space-y-2">
              {suggestions.map((s, i) => (
                <button
                  key={i}
                  onClick={() => pickSuggestion(s)}
                  type="button"
                  className="w-full text-left bg-surface2 border border-border rounded-xl p-3 hover:border-primary"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">
                      {t(`group.${s.group}`)} → {s.label}{s.sub ? ` → ${s.sub}` : ''}
                    </span>
                    <Pill className={GROUP_PILL_CLASSES[s.group]}>{s.group}</Pill>
                  </div>
                  {s.explanation && <p className="text-xs text-muted mt-1">🤖 {s.explanation}</p>}
                </button>
              ))}
            </div>
          )}

          {selected && (
            <div className="bg-surface2 border border-primary rounded-xl p-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">
                  {t(`group.${selected.group}`)} → {selected.label}{selected.subDisplay ? ` → ${selected.subDisplay}` : ''}
                </span>
                <button className="text-xs text-primary" onClick={() => { setSelected(null) }} type="button">{t('entry.change')}</button>
              </div>
              {selected.explanation && <p className="text-xs text-muted mt-1">🤖 {selected.explanation}</p>}
            </div>
          )}

          {pendingCat && (
            <div className="bg-surface2 border border-primary rounded-xl p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{pickLang(findCategory(pendingCat.group, pendingCat.key).label, lang)}</span>
                <button className="text-xs text-primary" onClick={() => setPendingCat(null)} type="button">{t('entry.change')}</button>
              </div>
              <p className="text-xs text-muted">{t('entry.pickSub')}</p>
              <div className="space-y-1.5">
                {findCategory(pendingCat.group, pendingCat.key).subs.map((s) => (
                  <div
                    key={s.key}
                    role="button"
                    tabIndex={0}
                    onClick={() => finalizeManual(pendingCat.group, pendingCat.key, s.key)}
                    onKeyDown={(e) => e.key === 'Enter' && finalizeManual(pendingCat.group, pendingCat.key, s.key)}
                    className="w-full text-left bg-surface border border-border rounded-lg p-2.5 hover:border-primary cursor-pointer flex items-center gap-1.5"
                  >
                    <span className="text-sm font-medium">{pickLang(s.label, lang)}</span>
                    {s.hint && <InfoTag>{pickLang(s.hint, lang)}</InfoTag>}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => finalizeManual(pendingCat.group, pendingCat.key, null)}
                  className="w-full text-left text-xs text-muted px-2.5 py-1.5"
                >
                  {t('entry.noSub')}
                </button>
              </div>
            </div>
          )}

          <details className="text-sm">
            <summary className="text-muted cursor-pointer">{t('entry.manualPick')}</summary>
            <div className="mt-2 space-y-3">
              {Object.entries(CATEGORY_TREE).map(([group, cats]) => (
                <div key={group}>
                  <p className="text-xs text-muted mb-1">{t(`group.${group}`)}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {cats.map((c) => (
                      <button
                        key={c.key}
                        type="button"
                        onClick={() => pickManualCategory(group, c.key)}
                        className="text-xs px-2.5 py-1.5 rounded-lg bg-surface2 border border-border"
                      >
                        {pickLang(c.label, lang)}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </details>
        </Card>

        {wantsImpactDays !== null && wantsImpactDays > 0 && (
          <Card className="bg-wants/10 border-wants/30">
            <p className="text-sm">
              {t('entry.wantsImpactPrefix')}<span className="font-semibold">{t('entry.wantsImpactBold', { days: wantsImpactDays })}</span>{t('entry.wantsImpactSuffix', { name: topGoal.name })}
            </p>
          </Card>
        )}

        {milestoneHit && (
          <Card className="bg-primary/10 border-primary/30 text-center">
            <p className="text-sm font-medium">{t('entry.milestoneToast', { name: milestoneHit.goalName, pct: milestoneHit.pct })}</p>
          </Card>
        )}

        {saved && (
          <Card className="bg-savings/10 border-savings/30 text-center">
            <p className="text-sm font-medium">
              {t('entry.saved')}{selected?.group === 'savings' ? t('entry.streakUpdated') : ''}
            </p>
            {roundUpNote && <p className="text-xs text-savings mt-1">{roundUpNote}</p>}
          </Card>
        )}
      </div>
      <div className="px-4 pb-4">
        <Button onClick={handleSave} disabled={!selected || !amount || saving}>
          {saving ? t('entry.saving') : t('entry.saveBtn')}
        </Button>
      </div>
      <BottomNav />
    </div>
  )
}
