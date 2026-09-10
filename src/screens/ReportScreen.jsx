import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, ChevronLeft, ChevronRight, TrendingUp, TrendingDown, PiggyBank, Trophy, CalendarDays, CalendarRange, Download } from 'lucide-react'
import TopBar from '../components/TopBar'
import BottomNav from '../components/BottomNav'
import { Card, IconCircle, ProgressBar, EmptyState } from '../components/UI'
import { useApp } from '../context/AppContext'
import * as db from '../lib/db'
import {
  computeMonthReport,
  computeYearReport,
  markMonthReportSeen,
  markYearReportSeen,
  monthsWithActivity,
  yearsWithActivity,
  lastClosedMonth,
} from '../lib/monthlyReport'

function fmt(n) {
  return '$' + Math.round(n || 0).toLocaleString('en-US')
}

const MONTH_FMT = { en: 'en-US', es: 'es-ES', fr: 'fr-FR', ru: 'ru-RU' }

export default function ReportScreen() {
  const { user, context, t, lang } = useApp()
  const [settings, setSettings] = useState(null)
  const [transactions, setTransactions] = useState([])
  const [goals, setGoals] = useState([])
  const [mode, setMode] = useState('month') // 'month' | 'year'
  const [monthDate, setMonthDate] = useState(() => lastClosedMonth())
  const [year, setYear] = useState(() => new Date().getFullYear() - 1)

  useEffect(() => {
    if (!user) return
    db.getSettings(user.id, context).then(setSettings)
    db.listTransactions(user.id, context).then(setTransactions)
    db.listGoals(user.id, context).then(setGoals)
  }, [user, context])

  const months = useMemo(() => monthsWithActivity(transactions), [transactions])
  const years = useMemo(() => yearsWithActivity(transactions), [transactions])

  useEffect(() => {
    if (!user) return
    if (mode === 'month') markMonthReportSeen(user.id, context, monthDate)
    else markYearReportSeen(user.id, context, year)
  }, [user, context, mode, monthDate, year])

  const monthReport = useMemo(
    () => computeMonthReport({ transactions, goals, settings, monthDate, lang }),
    [transactions, goals, settings, monthDate, lang],
  )
  const yearReport = useMemo(
    () => computeYearReport({ transactions, goals, settings, year, lang }),
    [transactions, goals, settings, year, lang],
  )

  const monthIdx = months.findIndex((m) => m.getFullYear() === monthDate.getFullYear() && m.getMonth() === monthDate.getMonth())
  const canGoOlderMonth = monthIdx >= 0 ? monthIdx < months.length - 1 : months.length > 0
  const canGoNewerMonth = monthIdx > 0

  function stepMonth(dir) {
    const idx = monthIdx >= 0 ? monthIdx : 0
    const next = months[idx + dir]
    if (next) setMonthDate(next)
  }

  const yearIdx = years.indexOf(year)
  const canGoOlderYear = yearIdx >= 0 ? yearIdx < years.length - 1 : years.length > 0
  const canGoNewerYear = yearIdx > 0

  function stepYear(dir) {
    const idx = yearIdx >= 0 ? yearIdx : 0
    const next = years[idx + dir]
    if (next !== undefined) setYear(next)
  }

  const report = mode === 'month' ? monthReport : yearReport
  const netClass = report.leftover === undefined ? '' : report.leftover >= 0 ? 'text-savings' : 'text-wants'

  function downloadReport() {
    const periodLabel = mode === 'month'
      ? monthDate.toLocaleDateString(MONTH_FMT[lang] || 'en-US', { month: 'long', year: 'numeric' })
      : String(year)
    const lines = []
    lines.push(`${t('reports.title')} — ${periodLabel}`)
    lines.push('')
    lines.push(`${t('reports.spent')}: ${fmt(report.spent)}`)
    lines.push(`${t('reports.saved')}: ${fmt(report.saved)}`)
    lines.push(`${t('reports.savingsRate')}: ${report.savingsRate}%`)
    if (mode === 'month') lines.push(`${t('reports.leftover')}: ${fmt(report.leftover)}`)
    if (report.topCategories?.length) {
      lines.push('')
      lines.push(`${t('reports.topCategories')}:`)
      report.topCategories.forEach((c) => lines.push(`  ${c.name}: ${fmt(c.value)}`))
    }
    if (mode === 'month' && monthReport.goals?.length) {
      lines.push('')
      lines.push(`${t('reports.goalsProgress')}:`)
      monthReport.goals.forEach((g) => lines.push(`  ${g.name}: ${g.pct}%`))
    }
    if (mode === 'year') {
      if (yearReport.goalsCompleted?.length) {
        lines.push('')
        lines.push(`${t('reports.goalsCompleted')}:`)
        yearReport.goalsCompleted.forEach((g) => lines.push(`  ${g.name}`))
      }
      if (yearReport.bestMonth) {
        lines.push('')
        lines.push(t('reports.bestMonthNote', {
          month: new Date(year, yearReport.bestMonth.month, 1).toLocaleDateString(MONTH_FMT[lang] || 'en-US', { month: 'long' }),
          amt: fmt(yearReport.bestMonth.saved),
        }))
      }
    }
    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    const monthTag = `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, '0')}`
    a.download = `report-${mode === 'month' ? monthTag : year}.txt`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="screen-report flex flex-col min-h-[100svh] max-w-app mx-auto w-full">
      <TopBar title={t('reports.title')} subtitle={t('reports.subtitle')} />
      <div className="flex-1 px-4 py-4 space-y-3">
        <Link to="/insights" className="text-xs text-primary font-semibold flex items-center gap-1 mb-1">
          <ArrowLeft size={13} /> {t('nav.insights')}
        </Link>

        <div className="flex bg-surface2 rounded-lg p-1 border border-border">
          {[
            { key: 'month', label: t('reports.tabMonth'), icon: CalendarDays },
            { key: 'year', label: t('reports.tabYear'), icon: CalendarRange },
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              type="button"
              onClick={() => setMode(key)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-xs font-semibold ${mode === key ? 'bg-surface shadow-softer text-text' : 'text-muted'}`}
            >
              <Icon size={13} /> {label}
            </button>
          ))}
        </div>

        {months.length === 0 ? (
          <EmptyState icon={CalendarDays} title={t('reports.emptyTitle')} subtitle={t('reports.emptySubtitle')} />
        ) : (
          <>
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => (mode === 'month' ? stepMonth(1) : stepYear(1))}
                disabled={mode === 'month' ? !canGoOlderMonth : !canGoOlderYear}
                className="text-muted p-1 disabled:opacity-30"
              >
                <ChevronLeft size={17} />
              </button>
              <p className="text-sm font-semibold capitalize">
                {mode === 'month' ? monthDate.toLocaleDateString(MONTH_FMT[lang] || 'en-US', { month: 'long', year: 'numeric' }) : year}
              </p>
              <button
                type="button"
                onClick={() => (mode === 'month' ? stepMonth(-1) : stepYear(-1))}
                disabled={mode === 'month' ? !canGoNewerMonth : !canGoNewerYear}
                className="text-muted p-1 disabled:opacity-30"
              >
                <ChevronRight size={17} />
              </button>
            </div>

            {report.hasData && (
              <button
                type="button"
                onClick={downloadReport}
                className="w-full flex items-center justify-center gap-1.5 text-xs font-semibold text-primary py-1.5"
              >
                <Download size={13} /> {t('reports.download')}
              </button>
            )}

            {!report.hasData ? (
              <EmptyState icon={CalendarDays} title={t('reports.emptyTitle')} subtitle={t('reports.emptySubtitle')} />
            ) : (
              <>
                <Card className="!p-4 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs text-muted font-medium uppercase tracking-wide">{t('reports.spent')}</p>
                      <p className="text-xl font-bold font-num text-needs mt-0.5">{fmt(report.spent)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted font-medium uppercase tracking-wide">{t('reports.saved')}</p>
                      <p className="text-xl font-bold font-num text-savings mt-0.5">{fmt(report.saved)}</p>
                    </div>
                  </div>
                  <div className="pt-2 border-t border-border flex items-center justify-between">
                    <p className="text-xs text-muted">{t('reports.savingsRate')}</p>
                    <p className={`text-sm font-bold font-num ${report.savingsRate >= 0 ? 'text-savings' : 'text-wants'}`}>{report.savingsRate}%</p>
                  </div>
                  {mode === 'month' && (
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-muted">{t('reports.leftover')}</p>
                      <p className={`text-sm font-bold font-num ${netClass}`}>{fmt(report.leftover)}</p>
                    </div>
                  )}
                </Card>

                {report.topCategories.length > 0 && (
                  <Card className="!p-3.5 space-y-2">
                    <p className="text-xs font-bold tracking-wide text-muted uppercase">{t('reports.topCategories')}</p>
                    {report.topCategories.map((c) => (
                      <div key={c.name} className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-2 text-muted"><TrendingDown size={13} className="text-needs" /> {c.name}</span>
                        <span className="font-medium font-num">{fmt(c.value)}</span>
                      </div>
                    ))}
                  </Card>
                )}

                {mode === 'month' && monthReport.goalContribThisMonth > 0 && (
                  <Card className="!p-3.5 flex items-start gap-3">
                    <IconCircle icon={PiggyBank} className="bg-savings/10 text-savings" size={34} iconSize={16} />
                    <p className="text-sm leading-relaxed flex-1">
                      {t('reports.goalContribNote', { amt: fmt(monthReport.goalContribThisMonth) })}
                    </p>
                  </Card>
                )}

                {mode === 'month' && monthReport.goals.length > 0 && (
                  <Card className="!p-3.5 space-y-3">
                    <p className="text-xs font-bold tracking-wide text-muted uppercase">{t('reports.goalsProgress')}</p>
                    {monthReport.goals.map((g) => (
                      <div key={g.id} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium truncate">{g.name}</span>
                          <span className="text-muted font-num">{g.pct}%</span>
                        </div>
                        <ProgressBar pct={g.pct} colorClass={g.pct >= 100 ? 'bg-savings' : 'bg-primary'} />
                      </div>
                    ))}
                  </Card>
                )}

                {mode === 'year' && (
                  <>
                    {yearReport.goalsCompleted.length > 0 && (
                      <Card className="!p-3.5 space-y-2">
                        <p className="text-xs font-bold tracking-wide text-muted uppercase flex items-center gap-1.5"><Trophy size={13} /> {t('reports.goalsCompleted')}</p>
                        {yearReport.goalsCompleted.map((g) => (
                          <p key={g.id} className="text-sm font-medium flex items-center gap-2">
                            <Trophy size={14} className="text-savings shrink-0" /> {g.name}
                          </p>
                        ))}
                      </Card>
                    )}
                    {yearReport.bestMonth && (
                      <Card className="!p-3.5 flex items-start gap-3">
                        <IconCircle icon={TrendingUp} className="bg-savings/10 text-savings" size={34} iconSize={16} />
                        <p className="text-sm leading-relaxed flex-1">
                          {t('reports.bestMonthNote', {
                            month: new Date(year, yearReport.bestMonth.month, 1).toLocaleDateString(MONTH_FMT[lang] || 'en-US', { month: 'long' }),
                            amt: fmt(yearReport.bestMonth.saved),
                          })}
                        </p>
                      </Card>
                    )}
                    <p className="text-[11px] text-muted leading-relaxed px-1">{t('reports.yearMonthsNote', { n: yearReport.monthsWithData })}</p>
                  </>
                )}
              </>
            )}
          </>
        )}
      </div>
      <BottomNav />
    </div>
  )
}
