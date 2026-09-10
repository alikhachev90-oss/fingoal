import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import TopBar from '../components/TopBar'
import BottomNav from '../components/BottomNav'
import { Button, Input, Card } from '../components/UI'
import { useApp } from '../context/AppContext'
import * as db from '../lib/db'
import { suggestCategories, CATEGORY_TREE, findCategory, pickLang, subLabel, subHint } from '../lib/categories'
import InfoTag from '../components/InfoTag'
import { computeGoalPlan, daysSavedByAmount, crossedMilestone } from '../lib/finance'
import { parseQuickEntry } from '../lib/aiInsights'
import { ChevronDown, Wand2 } from 'lucide-react'

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
  const [type, setType] = useState('expense') // 'income' | 'expense' | 'transfer'
  const [fromAccountId, setFromAccountId] = useState('')
  const [toAccountId, setToAccountId] = useState('')
  const [categoriesOpen, setCategoriesOpen] = useState(false)

  function changeType(next) {
    setType(next)
    setSelected(null)
    setPendingCat(null)
    setQuery('')
    setSaved(false)
  }

  // Which top-level category groups this tab offers — income tab only shows
  // the income group, expense tab shows everything that spends cash (needs,
  // wants, savings all reduce the account balance the same way).
  const visibleGroups = useMemo(
    () => Object.entries(CATEGORY_TREE).filter(([group]) => (type === 'income' ? group === 'income' : group !== 'income')),
    [type],
  )

  useEffect(() => {
    if (!user) return
    db.listGoals(user.id, context).then((goals) => setTopGoal(goals?.[0] || null))
    db.getSettings(user.id, context).then(setSettings)
    // A default Cash source always exists so the account picker below has
    // something to offer even before the user adds a card/bank account.
    db.listAccounts(user.id, context).then(async (list) => {
      if (list.length === 0) {
        const cash = await db.upsertAccount(user.id, context, { name: t('accounts.cash'), type: 'cash' })
        setAccounts([cash])
      } else {
        setAccounts(list)
      }
    })
  }, [user, context])

  // Full match set (no cap) drives which grid buttons stay highlighted while
  // typing — a ranked top-5 dropdown would hide legitimate matches further
  // down the list, which is fine for a dropdown but wrong for "dim everything
  // that doesn't match" filtering of an always-visible grid.
  const liveMatches = useMemo(() => (query.trim() && !selected && !pendingCat ? suggestCategories(query, lang, Infinity) : null), [query, lang, selected, pendingCat])
  const matchedKeys = useMemo(() => (liveMatches ? new Set(liveMatches.map((m) => `${m.group}:${m.key}`)) : null), [liveMatches])

  function pickSuggestion(s) {
    const subDisplay = s.sub ? subLabel(s.group, s.key, s.sub, lang) : null
    setSelected({ ...s, sub: s.sub, subDisplay })
    setQuery(subDisplay ? `${s.label} → ${subDisplay}` : s.label)
    setCategoriesOpen(false)
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
    setCategoriesOpen(false)
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

  async function handleTransferSave() {
    if (!amount || !fromAccountId || !toAccountId || fromAccountId === toAccountId) return
    setSaving(true)
    try {
      await db.addTransfer(user.id, context, {
        fromAccountId,
        toAccountId,
        amount: parseFloat(amount),
        date,
        comment,
      })
      setSaved(true)
      setTimeout(() => navigate('/dashboard', { replace: true }), 900)
    } finally {
      setSaving(false)
    }
  }

  async function handleSave() {
    if (type === 'transfer') return handleTransferSave()
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
      } else if (roundUp && topGoal && selected.group !== 'income') {
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
      setTimeout(() => navigate('/dashboard', { replace: true }), milestone ? 2200 : 900)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="screen-entry flex flex-col min-h-[100svh] max-w-app mx-auto w-full">
      <TopBar title={t('entry.title')} />
      <div className="flex-1 px-4 py-4 space-y-4">
        <div className="grid grid-cols-3 gap-2">
          {[
            { key: 'income', label: t('entry.typeIncome') },
            { key: 'expense', label: t('entry.typeExpense') },
            { key: 'transfer', label: t('entry.typeTransfer') },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => changeType(tab.key)}
              className={`text-sm font-semibold py-2.5 rounded-xl border transition-all ${
                type === tab.key ? 'entry-mode-active border-primary/55 text-primary' : 'border-border text-muted bg-surface2'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {type !== 'transfer' && (
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
                className="min-w-0 flex-1 bg-surface border border-border rounded-lg px-3 py-2.5 text-[15px] outline-none focus:border-primary focus:ring-1 focus:ring-primary/40"
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
        )}

        <Card className="entry-form space-y-4">
          <Input className="amount-input" label={t('entry.amount')} type="number" min="0" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0" />
          <div className="entry-details">
          <Input label={t('entry.date')} type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          <Input label={t('entry.comment')} value={comment} onChange={(e) => setComment(e.target.value)} placeholder={t('entry.commentPlaceholder')} />
          </div>
          {type === 'transfer' ? (
            <>
              <label className="block text-sm">
                <span className="text-muted text-xs font-medium">{t('entry.fromAccount')}</span>
                <select
                  value={fromAccountId}
                  onChange={(e) => setFromAccountId(e.target.value)}
                  className="mt-1 w-full bg-surface2 border border-border rounded-lg px-3 py-2.5 text-[15px] outline-none focus:border-primary"
                >
                  <option value="">—</option>
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>{a.name}{a.type === 'credit' ? ` (${t('accounts.credit')})` : ''}</option>
                  ))}
                </select>
              </label>
              <label className="block text-sm">
                <span className="text-muted text-xs font-medium">{t('entry.toAccount')}</span>
                <select
                  value={toAccountId}
                  onChange={(e) => setToAccountId(e.target.value)}
                  className="mt-1 w-full bg-surface2 border border-border rounded-lg px-3 py-2.5 text-[15px] outline-none focus:border-primary"
                >
                  <option value="">—</option>
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>{a.name}{a.type === 'credit' ? ` (${t('accounts.credit')})` : ''}</option>
                  ))}
                </select>
              </label>
              {fromAccountId && toAccountId && fromAccountId === toAccountId && (
                <p className="text-[11px] text-wants -mt-1">{t('entry.sameAccountError')}</p>
              )}
            </>
          ) : accounts.length > 0 && (
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
          {type === 'income' && (
            <p className="text-[11px] text-muted -mt-1">{t('entry.incomeAccountHint')}</p>
          )}
          {type === 'expense' && topGoal && (
            <label className="flex items-center justify-between text-sm pt-1 cursor-pointer">
              <span className="text-muted">{t('entry.roundUpLabel', { name: topGoal.name })}</span>
              <input type="checkbox" checked={roundUp} onChange={(e) => setRoundUp(e.target.checked)} className="w-4 h-4 accent-primary" />
            </label>
          )}
        </Card>

        {type !== 'transfer' && (
        <>
        <button
          type="button"
          aria-expanded={categoriesOpen}
          onClick={() => setCategoriesOpen((open) => !open)}
          className="category-toggle w-full flex items-center justify-between rounded-2xl px-4 py-3.5 glass text-left"
        >
          <span className="flex items-center gap-2 text-sm font-medium">
            <span className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center">{selected ? '✓' : '+'}</span>
            {selected ? pickLang(findCategory(selected.group, selected.key)?.label, lang) || selected.label : t('entry.chooseCategory')}
          </span>
          <ChevronDown size={17} className={`text-muted transition-transform ${categoriesOpen ? 'rotate-180' : ''}`} />
        </button>
        {categoriesOpen && <Card className="category-panel space-y-3">
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

          {!pendingCat && (
            <div className="space-y-3 pt-1 border-t border-border/60">
              {visibleGroups.map(([group, cats]) => (
                <div key={group}>
                  <p className="text-xs text-muted mb-1.5 mt-2">{t(`group.${group}`)}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {cats.map((c) => {
                      const id = `${group}:${c.key}`
                      const isSelected = selected && selected.group === group && selected.key === c.key
                      const isMatched = !matchedKeys || matchedKeys.has(id)
                      const dim = selected ? !isSelected : !isMatched
                      return (
                        <button
                          key={c.key}
                          type="button"
                          onClick={() => pickManualCategory(group, c.key)}
                          className={`text-xs px-2.5 py-1.5 rounded-lg border transition-all ${
                            isSelected
                              ? 'bg-primary/15 border-primary text-primary font-semibold'
                              : dim
                                ? 'bg-surface2/50 border-border/50 text-muted/60'
                                : 'bg-surface2 border-border'
                          }`}
                        >
                          {pickLang(c.label, lang)}
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>}
        </>
        )}

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
        <Button
          onClick={handleSave}
          disabled={
            saving ||
            !amount ||
            (type === 'transfer' ? !fromAccountId || !toAccountId || fromAccountId === toAccountId : !selected)
          }
        >
          {saving
            ? t('entry.saving')
            : type === 'transfer'
              ? t('entry.saveBtnTransfer')
              : type === 'income'
                ? t('entry.saveBtnIncome')
                : t('entry.saveBtnExpense')}
        </Button>
      </div>
      <BottomNav />
    </div>
  )
}
