import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { GraduationCap, Check, ChevronRight, X } from 'lucide-react'
import { Card, Button } from './UI'
import { useApp } from '../context/AppContext'
import { isTourDone } from '../lib/tours'

// The app does a lot; this is the guided way in. Each item opens a screen,
// and that screen's short walkthrough runs by itself the first time.
const ITEMS = [
  { key: 'dashboard', path: '/dashboard' },
  { key: 'entry', path: '/entry' },
  { key: 'goals', path: '/goals' },
  { key: 'coach', path: '/coach' },
  { key: 'debts', path: '/debts' },
  { key: 'insights', path: '/insights' },
  { key: 'lessons', path: '/lessons' },
]
const TABS = new Set(['/dashboard', '/entry', '/goals', '/insights', '/lessons'])

const hiddenKey = (userId) => `fintera_learn_hidden_${userId}`
const welcomeKey = (userId) => `fintera_welcome_seen_${userId}`

function read(key) {
  try { return localStorage.getItem(key) } catch { return null }
}
function write(key) {
  try { localStorage.setItem(key, '1') } catch { /* private mode */ }
}

// Re-reads which walkthroughs are done whenever one finishes.
function useToursDone(userId, context) {
  const [done, setDone] = useState(() => ITEMS.map((i) => isTourDone(userId, context, i.key)))
  useEffect(() => {
    const refresh = () => setDone(ITEMS.map((i) => isTourDone(userId, context, i.key)))
    refresh()
    window.addEventListener('fintera-tour-done', refresh)
    return () => window.removeEventListener('fintera-tour-done', refresh)
  }, [userId, context])
  return done
}

export function useWelcome(userId) {
  const [pending, setPending] = useState(() => Boolean(userId) && !read(welcomeKey(userId)))
  return {
    pending,
    close: () => { write(welcomeKey(userId)); setPending(false) },
  }
}

// Shown once, right after sign-up: the app is big, take the short tour.
export function WelcomeModal({ onStart, onLater }) {
  const { t } = useApp()
  return (
    <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center px-4 pb-[max(env(safe-area-inset-bottom),16px)] bg-black/60" role="dialog" aria-modal="true">
      <div className="w-full max-w-app rounded-[22px] p-5 space-y-3 border border-border shadow-soft" style={{ backgroundColor: 'rgb(var(--color-surface))' }}>
        <div className="w-12 h-12 rounded-full bg-primary/15 text-primary flex items-center justify-center"><GraduationCap size={22} /></div>
        <p className="text-lg font-semibold">{t('learn.welcomeTitle')}</p>
        <p className="text-sm text-muted leading-relaxed">{t('learn.welcomeBody')}</p>
        <Button type="button" onClick={onStart}>{t('learn.start')}</Button>
        <button type="button" onClick={onLater} className="w-full text-center text-xs text-muted py-2">{t('learn.later')}</button>
      </div>
    </div>
  )
}

export default function LearnCard({ onDashboardTour }) {
  const { user, context, t } = useApp()
  const navigate = useNavigate()
  const done = useToursDone(user?.id, context)
  const [hidden, setHidden] = useState(() => Boolean(read(hiddenKey(user?.id))))
  const count = done.filter(Boolean).length
  if (!user || hidden || count === ITEMS.length) return null

  function open(item) {
    if (item.key === 'dashboard') onDashboardTour()
    else navigate(item.path, { replace: TABS.has(item.path) })
  }

  return (
    <Card className="!p-4 space-y-3 border-primary/30">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <GraduationCap size={18} className="text-primary shrink-0" />
          <div>
            <p className="font-semibold text-sm">{t('learn.title')}</p>
            <p className="text-xs text-muted">{t('learn.progress', { n: count, total: ITEMS.length })}</p>
          </div>
        </div>
        <button type="button" onClick={() => { write(hiddenKey(user.id)); setHidden(true) }} className="text-muted p-1" aria-label={t('learn.hide')}><X size={15} /></button>
      </div>
      <div className="h-1.5 rounded-full bg-white/[.06] overflow-hidden">
        <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${Math.max(4, (count / ITEMS.length) * 100)}%` }} />
      </div>
      <div className="space-y-0.5">
        {ITEMS.map((item, i) => (
          <button key={item.key} type="button" onClick={() => open(item)} className="w-full flex items-center gap-2.5 py-2 text-left">
            <span className={`w-5 h-5 rounded-full shrink-0 flex items-center justify-center ${done[i] ? 'bg-savings/20 text-savings' : 'border border-border'}`}>
              {done[i] && <Check size={12} />}
            </span>
            <span className="flex-1 min-w-0">
              <span className={`block text-sm ${done[i] ? 'text-muted line-through' : ''}`}>{t(`learn.item.${item.key}`)}</span>
              <span className="block text-[11px] text-muted truncate">{t(`learn.why.${item.key}`)}</span>
            </span>
            {!done[i] && <ChevronRight size={15} className="text-muted shrink-0" />}
          </button>
        ))}
      </div>
    </Card>
  )
}
