import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronDown, Check, TrendingUp } from 'lucide-react'
import { Card, ProgressBar } from './UI'
import { useApp } from '../context/AppContext'
import * as db from '../lib/db'
import { computePath, saveRate, saveRateStepDue, SAVE_RATE_MAX } from '../lib/path'

function fmt(n) {
  return '$' + Math.round(n || 0).toLocaleString('en-US')
}

// The one line that says where you are on the way out of paycheck-to-paycheck
// and what the next dollar is for. Everything else on the screen feeds it.
export default function PathCard({ transactions, settings, debts, goals }) {
  const { user, setUser, t } = useApp()
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const path = computePath({ transactions, settings, debts, goals })
  const step = path.current
  const total = path.steps.length
  const rate = saveRate(user)
  const offerRaise = saveRateStepDue(user)

  async function setRate(next) {
    setBusy(true)
    try {
      const updated = await db.saveUserMeta(user.id, { save_rate: next, save_rate_at: new Date().toISOString() })
      setUser(updated)
    } finally {
      setBusy(false)
    }
  }

  const pct = step.target > 0 ? (step.current / step.target) * 100 : 0
  const detail = (() => {
    if (step.key === 'debt') {
      return t('path.debtDetail', { left: fmt(step.left), n: step.count, name: step.next?.name || '' })
    }
    if (step.key === 'invest' && step.target === 0) return t('path.investNoIncome')
    if (step.key === 'goals' && !step.goal) return t('path.goalsNone')
    return t('path.left', { left: fmt(step.left), target: fmt(step.target) })
  })()

  return (
    <Card className="path-card !p-4 space-y-3" data-tour="dash-path">
      <button type="button" className="w-full text-left" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        <div className="flex items-center justify-between gap-2">
          <p className="text-[11px] font-semibold tracking-[.08em] uppercase text-muted">
            {t('path.stepOf', { n: path.index + 1, total })}
          </p>
          <ChevronDown size={16} className={`text-muted transition-transform ${open ? 'rotate-180' : ''}`} />
        </div>
        <p className="text-[17px] font-semibold mt-1">{t(`path.step.${step.key}`)}</p>
        <p className="text-xs text-muted mt-0.5">{detail}</p>
      </button>

      {step.key !== 'debt' && step.target > 0 && <ProgressBar pct={pct} />}

      <div className="flex items-center justify-between gap-2 text-xs">
        <span className="text-muted">{t('path.rateLabel', { rate })}</span>
        <span className="flex items-center gap-1">
          <button type="button" disabled={busy || rate <= 1} onClick={() => setRate(rate - 1)} className="w-8 h-8 rounded-lg border border-border text-muted disabled:opacity-40" aria-label="-1%">−</button>
          <span className="w-10 text-center font-num font-semibold">{rate}%</span>
          <button type="button" disabled={busy || rate >= SAVE_RATE_MAX} onClick={() => setRate(rate + 1)} className="w-8 h-8 rounded-lg border border-border text-muted disabled:opacity-40" aria-label="+1%">+</button>
        </span>
      </div>

      {offerRaise && (
        <button type="button" disabled={busy} onClick={() => setRate(rate + 1)} className="w-full flex items-center gap-2 text-left text-xs bg-primary/10 text-primary rounded-lg px-3 py-2.5">
          <TrendingUp size={14} className="shrink-0" />
          <span>{t('path.raiseOffer', { next: rate + 1 })}</span>
        </button>
      )}

      {open && (
        <div className="space-y-1.5 pt-1 border-t border-border/60">
          {path.steps.map((s, i) => (
            <div key={s.key} className={`flex items-start gap-2.5 text-sm py-1 ${i === path.index ? 'text-text' : 'text-muted'}`}>
              <span className={`w-5 h-5 shrink-0 rounded-full flex items-center justify-center text-[11px] font-semibold mt-0.5 ${s.done ? 'bg-savings/20 text-savings' : i === path.index ? 'bg-primary/20 text-primary' : 'bg-surface2'}`}>
                {s.done ? <Check size={12} /> : i + 1}
              </span>
              <span className="min-w-0">
                <span className={i === path.index ? 'font-semibold' : ''}>{t(`path.step.${s.key}`)}</span>
                <span className="block text-[11px] leading-snug opacity-80">{t(`path.why.${s.key}`)}</span>
              </span>
            </div>
          ))}
          <p className="text-[11px] text-muted leading-relaxed pt-1">{t('path.rules')}</p>
          {step.key === 'goals' && !step.goal && (
            <Link to="/goals" className="block text-xs text-primary font-medium pt-1">{t('path.goalsCta')}</Link>
          )}
        </div>
      )}
    </Card>
  )
}
