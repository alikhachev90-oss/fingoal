import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Sparkles, Send, TrendingUp, TrendingDown, Info, Flag, Trophy, Radar, X, Calculator, ChevronRight, FileBarChart, Check } from 'lucide-react'
import TopBar from '../components/TopBar'
import BottomNav from '../components/BottomNav'
import TourGuide from '../components/TourGuide'
import { Card, Button, IconCircle, EmptyState, ProgressBar } from '../components/UI'
import { useApp } from '../context/AppContext'
import { TOURS } from '../lib/tours'
import * as db from '../lib/db'
import {
  computeInsights,
  answerQuestion,
  challengeTitle,
  listChallenges,
  saveChallengeDef,
  deleteChallengeDef,
  resetChallengeDef,
  getActiveChallenge,
  startChallenge,
  clearChallenge,
  evaluateChallenge,
  getSubscriptionRadar,
  markSubscriptionCancelled,
  shouldPromptMonthlyCheck,
  daysSinceRadarCheck,
  recordRadarChecked,
  categoryLabel,
} from '../lib/aiInsights'
import { projectSavingsGrowth } from '../lib/finance'
import { pendingMonthReport, pendingYearReport } from '../lib/monthlyReport'

function fmt(n) {
  return '$' + Math.round(n || 0).toLocaleString('en-US')
}

// "warn" reads as a gentle nudge (amber), not an alarm (red) — nothing here
// is an emergency, it's just something worth a glance.
// The categories worth building a challenge around — the ones people actually
// want to go a week without, not the whole tree (rent can't be given up).
const CHALLENGE_CATEGORY_CHOICES = [
  { group: 'wants', key: 'cafe' },
  { group: 'wants', key: 'coffee' },
  { group: 'wants', key: 'entertainment' },
  { group: 'wants', key: 'subscriptions' },
  { group: 'wants', key: 'clothes' },
  { group: 'wants', key: 'hobby' },
  { group: 'wants', key: 'sport' },
  { group: 'wants', key: 'gifts' },
  { group: 'wants', key: 'other' },
  { group: 'needs', key: 'groceries' },
  { group: 'needs', key: 'transport' },
  { group: 'needs', key: 'connectivity' },
]

const TONE_STYLE = {
  good: { icon: TrendingUp, cls: 'bg-savings/10 text-savings' },
  warn: { icon: TrendingDown, cls: 'bg-wants/10 text-wants' },
  neutral: { icon: Info, cls: 'bg-primary/10 text-primary' },
}

export default function InsightsScreen() {
  const { user, context, t, lang } = useApp()
  const [settings, setSettings] = useState(undefined)
  const [debts, setDebts] = useState([])
  const [goals, setGoals] = useState([])
  const [transactions, setTransactions] = useState([])
  const [question, setQuestion] = useState('')
  const [answers, setAnswers] = useState([]) // {q, a}
  const [activeChallenge, setActiveChallenge] = useState(null)
  const [growthAmount, setGrowthAmount] = useState('')
  const [growthRate, setGrowthRate] = useState('7')
  const [growthYears, setGrowthYears] = useState('3')
  const [radarTick, setRadarTick] = useState(0)
  const [radarInfoOpen, setRadarInfoOpen] = useState(false)
  const [tourActive, setTourActive] = useState(false)
  // Challenge editing: which one is open in the editor, the draft being typed,
  // and a tick so saving/deleting re-reads the stored list.
  const [challengeDefsTick, setChallengeDefsTick] = useState(0)
  const [editingChallenge, setEditingChallenge] = useState(null) // def | 'new' | null
  const [challengeDraft, setChallengeDraft] = useState({ title: '', days: '7', categoryKeys: [] })
  const challengeEditorRef = useRef(null)

  useEffect(() => {
    if (!user) return
    db.getSettings(user.id, context).then(setSettings)
    db.listDebts(user.id, context).then(setDebts)
    db.listGoals(user.id, context).then(setGoals)
    db.listTransactions(user.id, context).then(setTransactions)
    setActiveChallenge(getActiveChallenge(user.id, context))
  }, [user, context])

  // Hooks must run on every render, so this is computed before the
  // settings===null early return below (React error #310 otherwise).
  const radarItems = useMemo(
    () => (user ? getSubscriptionRadar(user.id, context, transactions) : []),
    [user, context, transactions, radarTick],
  )

  if (settings === undefined) {
    return <div className="min-h-[100svh] flex items-center justify-center text-muted">Загрузка…</div>
  }

  if (!settings) {
    return (
      <div className="flex flex-col min-h-[100svh] max-w-app mx-auto w-full items-center justify-center px-6">
        <EmptyState icon={Sparkles} title={t('insights.onboardingRequiredTitle')} subtitle={t('insights.onboardingRequiredSubtitle')} />
      </div>
    )
  }

  const cards = computeInsights({ settings, transactions, goals, debts, lang })
  const reportDue = user ? Boolean(pendingMonthReport(user.id, context, transactions) || pendingYearReport(user.id, context, transactions)) : false
  void challengeDefsTick // bumping it re-reads the stored challenge list below
  const myChallenges = user ? listChallenges(user.id, context) : []
  const challengeStatus = evaluateChallenge(activeChallenge, transactions, myChallenges)
  const radarDue = user ? shouldPromptMonthlyCheck(user.id, context) : false
  const radarDays = user ? daysSinceRadarCheck(user.id, context) : null

  function handleCancelSubscription(id) {
    markSubscriptionCancelled(user.id, context, id)
    setRadarTick((v) => v + 1)
  }

  function handleMarkRadarChecked() {
    recordRadarChecked(user.id, context)
    setRadarTick((v) => v + 1)
  }

  function handleCheckNow() {
    recordRadarChecked(user.id, context)
    setRadarTick((v) => v + 1)
    setRadarInfoOpen(true)
  }

  const defaultMonthly = goals[0] ? Math.max(0, Math.round(goals[0].target_amount ? (goals[0].target_amount - goals[0].saved_amount) / 12 : 0)) : 0
  const growthResult = projectSavingsGrowth(
    parseFloat(growthAmount) || defaultMonthly,
    parseFloat(growthRate) || 0,
    parseFloat(growthYears) || 0,
  )

  function ask() {
    if (!question.trim()) return
    const a = answerQuestion(question, { settings, transactions, goals, lang })
    setAnswers((prev) => [{ q: question, a }, ...prev])
    setQuestion('')
  }

  function handleStartChallenge(key) {
    const state = startChallenge(user.id, context, key)
    setActiveChallenge(state)
  }

  function handleStopChallenge() {
    clearChallenge(user.id, context)
    setActiveChallenge(null)
  }

  function openChallengeEditor(def) {
    setEditingChallenge(def || 'new')
    setChallengeDraft(
      def
        ? { title: challengeTitle(def, lang), days: String(def.days), categoryKeys: def.categoryKeys || [] }
        : { title: '', days: '7', categoryKeys: [] },
    )
  }

  // One plain sentence describing what the challenge actually checks, shown
  // both on each card and live under the category chips — without it, tapping
  // a category only lit a pill up and nothing else on screen changed.
  function challengeRule(def) {
    const keys = def.categoryKeys || []
    // A built-in that matches on text carries its own wording.
    if (!keys.length && def.rule) {
      const template = def.rule[lang] || def.rule.ru
      return template.replace('{days}', def.days)
    }
    if (!keys.length) return t('insights.challengeRuleAny', { days: def.days })
    const names = keys
      .map((k) => {
        const choice = CHALLENGE_CATEGORY_CHOICES.find((c) => c.key === k)
        return categoryLabel(choice?.group || 'wants', k, lang)
      })
      .join(', ')
    return t('insights.challengeRule', { days: def.days, cats: names })
  }

  function toggleDraftCategory(key) {
    setChallengeDraft((d) => ({
      ...d,
      categoryKeys: d.categoryKeys.includes(key) ? d.categoryKeys.filter((k) => k !== key) : [...d.categoryKeys, key],
    }))
  }

  function saveChallengeDraft() {
    if (!challengeDraft.title.trim()) return
    const editing = editingChallenge === 'new' ? null : editingChallenge
    saveChallengeDef(user.id, context, {
      key: editing?.key,
      title: challengeDraft.title.trim(),
      days: parseInt(challengeDraft.days, 10) || 7,
      categoryKeys: challengeDraft.categoryKeys,
      // No categories picked means "any discretionary spending breaks it".
      group: challengeDraft.categoryKeys.length ? null : 'wants',
    })
    setEditingChallenge(null)
    setChallengeDefsTick((v) => v + 1)
  }

  function removeChallenge(def) {
    deleteChallengeDef(user.id, context, def.key)
    if (activeChallenge?.key === def.key) handleStopChallenge()
    setEditingChallenge(null)
    setChallengeDefsTick((v) => v + 1)
  }

  function restoreChallenge(def) {
    resetChallengeDef(user.id, context, def.key)
    setEditingChallenge(null)
    setChallengeDefsTick((v) => v + 1)
  }

  function renderChallengeEditor() {
    const draftDef = {
      days: parseInt(challengeDraft.days, 10) || 0,
      categoryKeys: challengeDraft.categoryKeys,
    }
    return (
      <Card ref={challengeEditorRef} className="!p-3.5 space-y-3 border border-primary/40">
        <p className="text-sm font-semibold">
          {editingChallenge === 'new' ? t('insights.challengeCreate') : t('insights.challengeEdit')}
        </p>
        <label className="block text-sm">
          <span className="text-muted text-xs font-medium">{t('insights.challengeName')}</span>
          <input
            value={challengeDraft.title}
            onChange={(e) => setChallengeDraft((d) => ({ ...d, title: e.target.value }))}
            placeholder={t('insights.challengeNamePlaceholder')}
            className="w-full mt-1 bg-surface2 border border-border rounded-lg px-3 py-2.5 text-[15px] outline-none focus:border-primary"
          />
        </label>
        <label className="block text-sm">
          <span className="text-muted text-xs font-medium">{t('insights.challengeLength')}</span>
          <input
            type="number"
            min="1"
            max="365"
            value={challengeDraft.days}
            onChange={(e) => setChallengeDraft((d) => ({ ...d, days: e.target.value }))}
            className="w-full mt-1 bg-surface2 border border-border rounded-lg px-3 py-2.5 text-[15px] outline-none focus:border-primary"
          />
        </label>
        <div>
          <p className="text-muted text-xs font-medium mb-1.5">{t('insights.challengeCategories')}</p>
          <div className="flex flex-wrap gap-1.5">
            {CHALLENGE_CATEGORY_CHOICES.map((c) => {
              const on = challengeDraft.categoryKeys.includes(c.key)
              return (
                <button
                  key={c.key}
                  type="button"
                  onClick={() => toggleDraftCategory(c.key)}
                  className={`inline-flex items-center gap-1 px-2.5 py-2 rounded-lg text-xs font-medium border ${on ? 'bg-primary/15 border-primary text-primary' : 'bg-surface2 border-border text-muted'}`}
                >
                  {on && <Check size={12} strokeWidth={3} />}
                  {categoryLabel(c.group, c.key, lang)}
                </button>
              )
            })}
          </div>
          {/* Live restatement of the rule: tapping a chip has to change
              something you can read, not just tint the chip. */}
          <p className="text-[11px] text-primary mt-2 leading-relaxed">{challengeRule(draftDef)}</p>
          <p className="text-[11px] text-muted mt-1 leading-relaxed">{t('insights.challengeCategoriesHint')}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" type="button" onClick={() => setEditingChallenge(null)}>{t('common.cancel')}</Button>
          <Button type="button" onClick={saveChallengeDraft} disabled={!challengeDraft.title.trim()}>{t('common.save')}</Button>
        </div>
        {editingChallenge !== 'new' && (
          <div className="flex gap-3 pt-1">
            <button type="button" className="text-xs text-wants font-medium py-2 -my-2 pr-3" onClick={() => removeChallenge(editingChallenge)}>
              {t('insights.challengeDelete')}
            </button>
            {editingChallenge.builtIn && editingChallenge.edited && (
              <button type="button" className="text-xs text-muted font-medium py-2 -my-2" onClick={() => restoreChallenge(editingChallenge)}>
                {t('insights.challengeReset')}
              </button>
            )}
          </div>
        )}
      </Card>
    )
  }

  return (
    <div className="screen-insights flex flex-col min-h-[100svh] max-w-app mx-auto w-full">
      <TourGuide
        userId={user?.id}
        context={context}
        screenKey="insights"
        steps={TOURS.insights}
        lang={lang}
        active={tourActive}
        onActiveChange={setTourActive}
      />
      <TopBar title={t('insights.title')} subtitle={t('insights.subtitle')} onHelp={() => setTourActive(true)} />
      <div className="flex-1 px-4 py-4 space-y-3">
        {cards.length === 0 && (
          <EmptyState icon={Sparkles} title={t('insights.emptyTitle')} subtitle={t('insights.emptySubtitle')} />
        )}

        {cards.map((c) => {
          const style = TONE_STYLE[c.tone] || TONE_STYLE.neutral
          return (
            <Card key={c.id} className="!p-3.5 flex items-start gap-3">
              <IconCircle icon={style.icon} className={style.cls} size={34} iconSize={16} />
              <p className="text-sm leading-relaxed flex-1">{c.text}</p>
            </Card>
          )
        })}

        <div className="pt-2" data-tour="insights-radar">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[13px] font-bold tracking-wide text-muted uppercase">{t('radar.title')}</p>
            {radarItems.length > 0 && (
              <span className={`text-[11px] font-medium ${radarDue ? 'text-wants' : 'text-muted'}`}>
                {radarDue
                  ? t('radar.subtitleDue')
                  : radarDays === null
                    ? t('radar.subtitleNeverChecked')
                    : t('radar.subtitleOk', { days: radarDays })}
              </span>
            )}
          </div>
          {radarItems.length === 0 ? (
            <Card className="!p-3.5 space-y-2.5">
              <div className="flex items-start gap-3">
                <IconCircle icon={Radar} className="bg-primary/10 text-primary" size={34} iconSize={16} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{t('radar.emptyTitle')}</p>
                  <p className="text-xs text-muted mt-0.5">{t('radar.emptySubtitle')}</p>
                </div>
              </div>
              {radarInfoOpen && (
                <p className="text-xs text-muted bg-surface2 rounded-lg px-3 py-2 leading-relaxed">
                  {t('radar.checkedJustNow')} — {t('radar.checkNowExplain')}
                </p>
              )}
              <Button variant="secondary" onClick={handleCheckNow} type="button">
                {t('radar.checkNow')}
              </Button>
            </Card>
          ) : (
            <div className="space-y-2">
              {radarDue && (
                <p className="text-xs text-wants font-medium bg-wants/10 rounded-lg px-3 py-2">{t('radar.subtitleDue')}</p>
              )}
              {radarItems.map((item) => (
                <Card key={item.id} className="!p-3 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <IconCircle icon={Radar} className="bg-wants/10 text-wants" size={32} iconSize={15} />
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{categoryLabel(item.group || 'wants', item.category_key, lang)}</p>
                      <p className="text-xs text-muted">{fmt(item.amount)} · {item.monthsCount} {t('radar.monthsSuffix')}</p>
                    </div>
                  </div>
                  <Button
                    variant="secondary"
                    className="!w-auto px-2.5 shrink-0 text-xs"
                    icon={X}
                    onClick={() => handleCancelSubscription(item.id)}
                    type="button"
                  >
                    {t('radar.cancelled')}
                  </Button>
                </Card>
              ))}
              <Button variant="secondary" onClick={handleMarkRadarChecked} type="button">
                {t('radar.markChecked')}
              </Button>
            </div>
          )}
          <p className="text-[11px] text-muted mt-2 leading-relaxed">{t('radar.premiumNote')}</p>
        </div>

        <div className="pt-2" data-tour="insights-challenge">
          <p className="text-[13px] font-bold tracking-wide text-muted uppercase mb-2">{t('insights.challengeSection')}</p>
          {activeChallenge && challengeStatus && (
            <Card className="!p-3.5 space-y-2.5">
              <div className="flex items-center gap-2.5">
                <IconCircle
                  icon={challengeStatus.completed ? Trophy : challengeStatus.failed ? Flag : Flag}
                  className={challengeStatus.completed ? 'bg-savings/10 text-savings' : challengeStatus.failed ? 'bg-wants/10 text-wants' : 'bg-primary/10 text-primary'}
                  size={34}
                  iconSize={16}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{challengeTitle(challengeStatus.challenge, lang)}</p>
                  <p className="text-[11px] text-muted truncate">{challengeRule(challengeStatus.challenge)}</p>
                  <p className="text-xs text-muted">
                    {challengeStatus.completed
                      ? t('insights.challengeCompleted')
                      : challengeStatus.failed
                        ? t('insights.challengeFailed', { day: challengeStatus.daysElapsed })
                        : t('insights.challengeProgress', { elapsed: challengeStatus.daysElapsed, total: challengeStatus.daysTotal })}
                  </p>
                </div>
              </div>
              {!challengeStatus.completed && !challengeStatus.failed && (
                <ProgressBar pct={(challengeStatus.daysElapsed / challengeStatus.daysTotal) * 100} colorClass="bg-primary" />
              )}
              <Button variant="secondary" onClick={handleStopChallenge} type="button">
                {challengeStatus.completed ? t('insights.challengeClose') : challengeStatus.failed ? t('insights.challengeRestart') : t('insights.challengeStop')}
              </Button>
            </Card>
          )}
          <div className="space-y-2">
            {/* While one challenge runs its card is rendered below this block;
                the rest of the list stays visible (dimmed) instead of the
                whole section vanishing the moment you press Start. */}
            {activeChallenge && (
              <p className="text-[11px] text-muted uppercase tracking-wide pt-3">{t('insights.challengeOthers')}</p>
            )}
            {myChallenges
              .filter((c) => c.key !== activeChallenge?.key)
              .map((c) => {
                const editing = editingChallenge !== 'new' && editingChallenge?.key === c.key
                if (editing) return <div key={c.key}>{renderChallengeEditor()}</div>
                return (
                  <Card key={c.key} className={`!p-3 space-y-2 ${activeChallenge ? 'opacity-60' : ''}`}>
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <IconCircle icon={Flag} className="bg-primary/10 text-primary" size={32} iconSize={15} />
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{challengeTitle(c, lang)}</p>
                          {/* The rule, spelled out — so an edit visibly changes
                              the card, and you can see what actually breaks it. */}
                          <p className="text-xs text-muted">{challengeRule(c)}</p>
                        </div>
                      </div>
                      <Button
                        variant="secondary"
                        className="!w-auto px-3 shrink-0"
                        onClick={() => handleStartChallenge(c.key)}
                        disabled={!!activeChallenge}
                        type="button"
                      >
                        {t('insights.startChallenge')}
                      </Button>
                    </div>
                    {/* py/-my: grows the tap target to ~40px without moving the
                        link a pixel — as plain text it was only 16px tall. */}
                    <button type="button" className="self-start text-xs text-primary font-medium py-2.5 -my-2.5 pr-3" onClick={() => openChallengeEditor(c)}>
                      {t('insights.challengeEdit')}
                    </button>
                  </Card>
                )
              })}

            {editingChallenge === 'new' ? renderChallengeEditor() : (
              <Button variant="secondary" onClick={() => openChallengeEditor(null)} type="button">
                + {t('insights.challengeCreate')}
              </Button>
            )}
          </div>

        </div>

        <div className="pt-2">
          <p className="text-[13px] font-bold tracking-wide text-muted uppercase mb-2">{t('insights.simulatorTitle')}</p>
          <Card className="!p-3.5 space-y-3">
            <div className="grid grid-cols-3 gap-2">
              <label className="block">
                <span className="block text-xs text-muted mb-1">{t('insights.perMonth')}</span>
                <input
                  type="number"
                  value={growthAmount}
                  onChange={(e) => setGrowthAmount(e.target.value)}
                  placeholder={String(defaultMonthly || 100)}
                  className="w-full bg-surface2 border border-border rounded-lg px-2 py-2 text-sm outline-none focus:border-primary"
                />
              </label>
              <label className="block">
                <span className="block text-xs text-muted mb-1">{t('insights.annualRate')}</span>
                <input
                  type="number"
                  value={growthRate}
                  onChange={(e) => setGrowthRate(e.target.value)}
                  className="w-full bg-surface2 border border-border rounded-lg px-2 py-2 text-sm outline-none focus:border-primary"
                />
              </label>
              <label className="block">
                <span className="block text-xs text-muted mb-1">{t('insights.years')}</span>
                <input
                  type="number"
                  value={growthYears}
                  onChange={(e) => setGrowthYears(e.target.value)}
                  className="w-full bg-surface2 border border-border rounded-lg px-2 py-2 text-sm outline-none focus:border-primary"
                />
              </label>
            </div>
            <div className="bg-savings/10 rounded-xl px-3 py-2.5">
              <p className="text-xs text-muted">
                {t('insights.growthSummary', {
                  amt: fmt(parseFloat(growthAmount) || defaultMonthly),
                  rate: growthRate || 0,
                  years: growthYears || 0,
                  yearsWord: growthYears == 1 ? t('insights.growthYearSingular') : t('insights.growthYearPlural'),
                })}
              </p>
              <p className="text-xl font-bold font-num text-savings mt-1">{fmt(growthResult.futureValue)}</p>
              <p className="text-xs text-muted mt-0.5">{t('insights.growthBreakdown', { contrib: fmt(growthResult.contributed), growth: fmt(growthResult.growth) })}</p>
            </div>
          </Card>
        </div>

        <div className="pt-2" data-tour="insights-reports">
          <Link to="/reports">
            <Card className="!p-3.5 flex items-center gap-3 hover:border-primary/50 !border-l-[3px] !border-l-savings">
              <IconCircle icon={FileBarChart} className="bg-savings/10 text-savings" size={38} iconSize={17} />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm flex items-center gap-1.5">
                  {t('reports.entryTitle')}
                  {reportDue && <span className="w-1.5 h-1.5 rounded-full bg-wants shrink-0" />}
                </p>
                <p className="text-xs text-muted mt-0.5">{reportDue ? t('reports.entryReady') : t('reports.entrySubtitle')}</p>
              </div>
              <ChevronRight size={16} className="text-muted" />
            </Card>
          </Link>
        </div>

        <div className="pt-2" data-tour="insights-tax">
          <Link to="/taxes">
            <Card className="!p-3.5 flex items-center gap-3 hover:border-primary/50">
              <IconCircle icon={Calculator} className="bg-primary/10 text-primary" size={38} iconSize={17} />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm">{t('tax.entryTitle')}</p>
                <p className="text-xs text-muted mt-0.5">{t('tax.entrySubtitle')}</p>
              </div>
              <ChevronRight size={16} className="text-muted" />
            </Card>
          </Link>
        </div>

        <div className="pt-2" data-tour="insights-ask">
          <p className="text-[13px] font-bold tracking-wide text-muted uppercase mb-2">{t('insights.askSection')}</p>
          <Card className="!p-3 space-y-3">
            <div className="flex gap-2">
              <input
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && ask()}
                placeholder={t('insights.askPlaceholder')}
                className="flex-1 bg-surface2 border border-border rounded-lg px-3 py-2.5 text-[15px] outline-none focus:border-primary focus:ring-1 focus:ring-primary/40"
              />
              <Button variant="secondary" className="!w-auto px-3.5" icon={Send} onClick={ask} type="button" aria-label={t('insights.askAria')} />
            </div>
            {answers.length === 0 && (
              <p className="text-xs text-muted">{t('insights.askHint')}</p>
            )}
            <div className="space-y-2.5">
              {answers.map((item, i) => (
                <div key={i} className="space-y-1">
                  <p className="text-xs text-muted">{t('insights.youLabel', { q: item.q })}</p>
                  <p className="text-sm bg-surface2 border-l-[3px] border-primary rounded-r-lg pl-3 pr-2 py-2 leading-relaxed">🤖 {item.a}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
      <BottomNav />
    </div>
  )
}
