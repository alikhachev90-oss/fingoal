import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Sparkles, Send, TrendingUp, TrendingDown, Info, Flag, Trophy, Radar, X, Calculator, ChevronRight } from 'lucide-react'
import TopBar from '../components/TopBar'
import BottomNav from '../components/BottomNav'
import { Card, Button, IconCircle, EmptyState, ProgressBar } from '../components/UI'
import { useApp } from '../context/AppContext'
import * as db from '../lib/db'
import {
  computeInsights,
  answerQuestion,
  CHALLENGES,
  challengeTitle,
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

function fmt(n) {
  return '$' + Math.round(n || 0).toLocaleString('en-US')
}

// "warn" reads as a gentle nudge (amber), not an alarm (red) — nothing here
// is an emergency, it's just something worth a glance.
const TONE_STYLE = {
  good: { icon: TrendingUp, cls: 'bg-savings/10 text-savings' },
  warn: { icon: TrendingDown, cls: 'bg-wants/10 text-wants' },
  neutral: { icon: Info, cls: 'bg-primary/10 text-primary' },
}

export default function InsightsScreen() {
  const { user, context, t, lang } = useApp()
  const [settings, setSettings] = useState(null)
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

  if (settings === null) {
    return (
      <div className="flex flex-col min-h-[100svh] max-w-app mx-auto w-full items-center justify-center px-6">
        <EmptyState icon={Sparkles} title={t('insights.onboardingRequiredTitle')} subtitle={t('insights.onboardingRequiredSubtitle')} />
      </div>
    )
  }

  const cards = computeInsights({ settings, transactions, goals, debts, lang })
  const challengeStatus = evaluateChallenge(activeChallenge, transactions)
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

  return (
    <div className="flex flex-col min-h-[100svh] max-w-app mx-auto w-full">
      <TopBar title={t('insights.title')} subtitle={t('insights.subtitle')} />
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

        <div className="pt-2">
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
                      <p className="text-sm font-medium truncate">{categoryLabel('wants', item.category_key, lang)}</p>
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

        <div className="pt-2">
          <p className="text-[13px] font-bold tracking-wide text-muted uppercase mb-2">{t('insights.challengeSection')}</p>
          {!activeChallenge && (
            <div className="space-y-2">
              {CHALLENGES.map((c) => (
                <Card key={c.key} className="!p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <IconCircle icon={Flag} className="bg-primary/10 text-primary" size={32} iconSize={15} />
                    <p className="text-sm font-medium truncate">{challengeTitle(c, lang)}</p>
                  </div>
                  <Button variant="secondary" className="!w-auto px-3 shrink-0" onClick={() => handleStartChallenge(c.key)} type="button">
                    {t('insights.startChallenge')}
                  </Button>
                </Card>
              ))}
            </div>
          )}
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

        <div className="pt-2">
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

        <div className="pt-2">
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
