import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Camera, ImagePlus, X, CalendarClock } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { goalImage, setGoalImage, removeGoalImage, getVision, setVision, clearVision, goalSnapshot } from '../lib/goalVision'
import { requestNotificationPermission } from '../lib/reminders'
import { syncServerReminders } from '../lib/serverReminders'

const WEEKDAYS = {
  ru: ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'],
  en: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
}

// The photo on top of a goal card, with its own "add / change / remove".
export function GoalPhoto({ goal, pct }) {
  const { user, setUser, t } = useApp()
  const input = useRef(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const src = goalImage(user, goal.id)

  async function pick(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setBusy(true)
    setError('')
    try {
      setUser(await setGoalImage(user, goal.id, file))
    } catch {
      setError(t('vision.uploadFailed'))
    } finally {
      setBusy(false)
    }
  }

  async function remove() {
    setBusy(true)
    try {
      setUser(await removeGoalImage(user, goal.id))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <input ref={input} type="file" accept="image/*" className="hidden" onChange={pick} />
      {src ? (
        <div className="relative overflow-hidden rounded-xl aspect-[16/9] bg-surface2">
          <img src={src} alt="" className="w-full h-full object-cover" loading="lazy" />
          <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/75 to-transparent pointer-events-none" />
          <p className="absolute left-3 bottom-2.5 text-white text-sm font-semibold font-num drop-shadow">{pct}%</p>
          <div className="absolute right-2 top-2 flex gap-1.5">
            <button type="button" disabled={busy} onClick={() => input.current?.click()} className="w-8 h-8 rounded-full bg-black/45 text-white flex items-center justify-center" aria-label={t('vision.change')}>
              <Camera size={15} />
            </button>
            <button type="button" disabled={busy} onClick={remove} className="w-8 h-8 rounded-full bg-black/45 text-white flex items-center justify-center" aria-label={t('common.delete')}>
              <X size={15} />
            </button>
          </div>
          {busy && <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-white text-xs">{t('common.saving')}</div>}
        </div>
      ) : (
        <button type="button" data-tour="goals-photo" disabled={busy} onClick={() => input.current?.click()} className="w-full flex items-center gap-2.5 rounded-xl border border-dashed border-primary/50 px-3 py-3 text-left">
          <ImagePlus size={18} className="text-primary shrink-0" />
          <span className="min-w-0">
            <span className="block text-sm text-primary font-medium">{busy ? t('common.saving') : t('vision.add')}</span>
            <span className="block text-[11px] text-muted leading-snug">{t('vision.addHint')}</span>
          </span>
        </button>
      )}
      {error && <p className="text-xs text-wants mt-1.5">{error}</p>}
    </div>
  )
}

// "Show me this goal once a week": a day and a time, off by default so it
// never nags. Keeps the goal's numbers fresh for the message on every visit.
export function VisionPush({ goal }) {
  const { user, lang, t } = useApp()
  const [state, setState] = useState(() => getVision(user.id, goal.id))
  const days = WEEKDAYS[lang] || WEEKDAYS.ru

  // Every visit refreshes the numbers the Monday message will quote.
  useEffect(() => {
    if (!state?.enabled) return
    setVision(user.id, goal.id, { snapshot: goalSnapshot(goal) })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [goal.saved_amount, goal.target_amount, goal.name])

  async function update(next) {
    if (next.enabled) await requestNotificationPermission()
    const value = next.enabled === false
      ? (clearVision(user.id, goal.id), null)
      : setVision(user.id, goal.id, { weekday: 1, time: '09:00', ...next, snapshot: goalSnapshot(goal) })
    setState(value)
    syncServerReminders(user)
  }

  if (!state?.enabled) {
    return (
      <button type="button" data-tour="goals-vision" onClick={() => update({ enabled: true })} className="flex items-center gap-1.5 text-xs text-primary font-medium py-1">
        <CalendarClock size={14} /> {t('vision.weeklyOn')}
      </button>
    )
  }

  return (
    <div className="bg-surface2 rounded-xl p-2.5 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted flex items-center gap-1.5"><CalendarClock size={14} className="text-primary" /> {t('vision.weekly')}</span>
        <button type="button" onClick={() => update({ enabled: false })} className="text-xs text-muted">{t('vision.off')}</button>
      </div>
      <div className="flex items-center gap-1">
        {days.map((d, i) => (
          <button
            key={d}
            type="button"
            onClick={() => update({ weekday: i + 1 })}
            className={`flex-1 py-1.5 rounded-lg text-[11px] font-semibold border ${state.weekday === i + 1 ? 'bg-primary/15 border-primary text-primary' : 'border-border text-muted'}`}
          >
            {d}
          </button>
        ))}
      </div>
      <input
        type="time"
        value={state.time}
        onChange={(e) => e.target.value && update({ time: e.target.value })}
        className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary"
      />
    </div>
  )
}

// The top goal's photo on the home screen: the reason, seen every day.
export function GoalVisionBanner({ goal }) {
  const { user, t } = useApp()
  const src = goal && goalImage(user, goal.id)
  if (!src) return null
  const target = Number(goal.target_amount) || 0
  const saved = Number(goal.saved_amount) || 0
  const pct = target > 0 ? Math.min(100, Math.round((saved / target) * 100)) : 0
  return (
    <Link to="/goals" replace className="block relative overflow-hidden rounded-[18px] aspect-[16/8] bg-surface2">
      <img src={src} alt="" className="w-full h-full object-cover" loading="lazy" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
      <div className="absolute left-4 right-4 bottom-3 text-white">
        <p className="text-[11px] uppercase tracking-[.08em] opacity-80">{t('vision.bannerLabel')}</p>
        <p className="font-semibold text-[17px] leading-tight">{goal.name}</p>
        <div className="mt-2 h-1.5 rounded-full bg-white/25 overflow-hidden">
          <div className="h-full bg-primary rounded-full" style={{ width: `${Math.max(2, pct)}%` }} />
        </div>
        <p className="text-xs opacity-85 mt-1 font-num">{t('vision.bannerLeft', { pct, left: '$' + Math.max(0, Math.round(target - saved)).toLocaleString('en-US') })}</p>
      </div>
    </Link>
  )
}
