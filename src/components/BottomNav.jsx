import { useEffect, useRef, useState } from 'react'
import { NavLink } from 'react-router-dom'
import { LayoutGrid, PlusCircle, Target, GraduationCap, Sparkles } from 'lucide-react'
import { useApp } from '../context/AppContext'

const items = [
  { to: '/dashboard', icon: LayoutGrid, key: 'nav.overview' },
  { to: '/entry', icon: PlusCircle, key: 'nav.entry' },
  { to: '/goals', icon: Target, key: 'nav.goals' },
  { to: '/insights', icon: Sparkles, key: 'nav.insights' },
  { to: '/lessons', icon: GraduationCap, key: 'nav.lessons' },
]

const AUTO_HIDE_MS = 15000

export default function BottomNav({ persistent = false }) {
  const { t } = useApp()
  const [expanded, setExpanded] = useState(persistent)
  const hideTimer = useRef(null)
  const touchStartY = useRef(null)

  function scheduleHide() {
    if (persistent) return
    clearTimeout(hideTimer.current)
    hideTimer.current = setTimeout(() => setExpanded(false), AUTO_HIDE_MS)
  }

  function reveal() {
    setExpanded(true)
    scheduleHide()
  }

  useEffect(() => () => clearTimeout(hideTimer.current), [])

  return (
    <div className="fixed inset-x-0 bottom-0 z-30 pointer-events-none">
      <div className="max-w-app mx-auto relative h-[92px]">
        <nav
          aria-hidden={!expanded}
          inert={!expanded}
          onPointerDown={scheduleHide}
          onFocus={scheduleHide}
          className={`absolute inset-x-3 bottom-[max(env(safe-area-inset-bottom),10px)] pointer-events-auto transition-all duration-[600ms] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${
            expanded ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-[115%] opacity-0 scale-[.97] pointer-events-none'
          }`}
        >
          <div className="glass nav-material rounded-[30px] px-2 py-2 shadow-[0_30px_70px_-28px_rgb(0_0_0/.95)] border-white/[.18]">
            <div className="flex justify-around">
              {items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => { if (!persistent) setExpanded(false) }}
                  className={({ isActive }) => `relative flex-1 flex flex-col items-center gap-1 px-1 py-1.5 rounded-2xl text-[10px] font-semibold transition-all duration-200 ${isActive ? 'text-primary' : 'text-muted hover:text-text'}`}
                >
                  {({ isActive }) => (
                    <>
                      {isActive && <span className="absolute inset-x-3 top-0 h-[2px] rounded-full bg-primary shadow-[0_0_18px_rgb(var(--color-primary)/.9)]" />}
                      {isActive && <span className="absolute inset-1 rounded-[18px] bg-white/[.025] pointer-events-none" />}
                      <div className={`relative z-[1] w-9 h-9 rounded-2xl flex items-center justify-center transition-all duration-200 ${isActive ? 'bg-primary/14 shadow-[0_10px_20px_-12px_rgb(var(--color-primary)/.9)] -translate-y-0.5' : ''}`}>
                        <item.icon size={19} strokeWidth={isActive ? 2.45 : 1.9} />
                      </div>
                      <span className="relative z-[1]">{t(item.key)}</span>
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          </div>
        </nav>

        {!persistent && <button
          type="button"
          aria-label={t('nav.open')}
          tabIndex={expanded ? -1 : 0}
          aria-expanded={expanded}
          onClick={() => expanded ? setExpanded(false) : reveal()}
          onTouchStart={(e) => { touchStartY.current = e.touches[0].clientY }}
          onTouchMove={(e) => {
            if (touchStartY.current == null) return
            const dy = touchStartY.current - e.touches[0].clientY
            if (dy > 14) {
              reveal()
              touchStartY.current = null
            }
          }}
          onTouchEnd={() => { touchStartY.current = null }}
          className={`pointer-events-auto absolute left-1/2 -translate-x-1/2 bottom-[calc(max(env(safe-area-inset-bottom),2px)+8px)] w-24 h-11 flex items-center justify-center rounded-full transition-all duration-[600ms] motion-reduce:transition-none ${
            expanded ? 'opacity-0 translate-y-2 pointer-events-none' : 'opacity-100 translate-y-0'
          }`}
        >
          <span className="block w-12 h-1 rounded-full bg-muted shadow-[0_1px_0_rgb(255_255_255/.20)_inset,0_0_16px_rgb(255_255_255/.08)]" />
        </button>}
      </div>
    </div>
  )
}
