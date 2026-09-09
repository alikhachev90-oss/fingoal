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

// The nav bar itself stays tucked away below the screen edge, out of the way
// of content, and a small pull-handle (like a phone's home-indicator) sits
// where it was. Tapping or swiping up on the handle slides the full bar in;
// it slides back away on its own after a few seconds, or as soon as a link
// is tapped and the page navigates.
const AUTO_HIDE_MS = 3500

export default function BottomNav() {
  const { t } = useApp()
  const [expanded, setExpanded] = useState(false)
  const hideTimer = useRef(null)
  const touchStartY = useRef(null)

  function scheduleHide() {
    clearTimeout(hideTimer.current)
    hideTimer.current = setTimeout(() => setExpanded(false), AUTO_HIDE_MS)
  }

  function reveal() {
    setExpanded(true)
    scheduleHide()
  }

  useEffect(() => () => clearTimeout(hideTimer.current), [])

  return (
    <div className="fixed inset-x-0 bottom-0 z-30 flex flex-col items-center">
      <nav
        aria-hidden={!expanded}
        onClick={scheduleHide}
        onTouchStart={scheduleHide}
        className={`w-full px-3 pb-[max(env(safe-area-inset-bottom),10px)] pt-2 transition-transform duration-300 ease-out ${
          expanded ? 'translate-y-0 pointer-events-auto' : 'translate-y-[130%] pointer-events-none'
        }`}
      >
        <div className="max-w-app mx-auto glass rounded-[26px] px-2 py-2 shadow-[0_24px_60px_-25px_rgb(0_0_0/.9)]">
          <div className="flex justify-around">
            {items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) => `relative flex-1 flex flex-col items-center gap-1 px-1 py-1.5 rounded-2xl text-[10px] font-semibold transition-all duration-200 ${isActive ? 'text-primary' : 'text-muted'}`}
              >
                {({ isActive }) => (
                  <>
                    {isActive && <span className="absolute inset-x-3 top-0 h-[2px] rounded-full bg-primary shadow-[0_0_14px_rgb(var(--color-primary)/.7)]" />}
                    <div className={`w-9 h-9 rounded-2xl flex items-center justify-center transition-all duration-200 ${isActive ? 'bg-primary/12' : ''}`}>
                      <item.icon size={19} strokeWidth={isActive ? 2.45 : 1.9} />
                    </div>
                    <span>{t(item.key)}</span>
                  </>
                )}
              </NavLink>
            ))}
          </div>
        </div>
      </nav>

      <button
        type="button"
        aria-label={t('nav.overview')}
        onClick={reveal}
        onTouchStart={(e) => { touchStartY.current = e.touches[0].clientY }}
        onTouchMove={(e) => {
          if (touchStartY.current == null) return
          const dy = touchStartY.current - e.touches[0].clientY
          if (dy > 18) {
            reveal()
            touchStartY.current = null
          }
        }}
        onTouchEnd={() => { touchStartY.current = null }}
        className={`absolute bottom-0 pb-[max(env(safe-area-inset-bottom),8px)] pt-3 px-8 transition-opacity duration-300 ${
          expanded ? 'opacity-0 pointer-events-none' : 'opacity-100 pointer-events-auto'
        }`}
      >
        <span className="block w-11 h-1.5 rounded-full bg-white/25 active:bg-white/45" />
      </button>
    </div>
  )
}
