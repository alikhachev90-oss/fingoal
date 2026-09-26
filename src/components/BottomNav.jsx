import { NavLink, useLocation } from 'react-router-dom'
import { LayoutGrid, PlusCircle, Target, GraduationCap, Sparkles } from 'lucide-react'
import { useApp } from '../context/AppContext'

const items = [
  { to: '/dashboard', icon: LayoutGrid, key: 'nav.overview' },
  { to: '/entry', icon: PlusCircle, key: 'nav.entry' },
  { to: '/goals', icon: Target, key: 'nav.goals' },
  { to: '/insights', icon: Sparkles, key: 'nav.insights' },
  { to: '/lessons', icon: GraduationCap, key: 'nav.lessons' },
]

const TAB_PATHS = items.map((i) => i.to)

// Mounted once, above the router, so it survives every route change and can
// glide out and back in. It used to be rendered by each screen and hidden on a
// 15-second timer behind an invisible pull handle — that handle sat dead
// centre and quietly ate taps meant for whatever was underneath it.
export default function BottomNav() {
  const { t } = useApp()
  const location = useLocation()
  // Visible on the five main tabs; anywhere deeper the person is inside one
  // task and gets the whole screen. Leaving that screen is the phone's own
  // back gesture, not another button we draw.
  const visible = TAB_PATHS.includes(location.pathname)

  return (
    <div className="fixed inset-x-0 bottom-0 z-30 pointer-events-none">
      <div className="max-w-app mx-auto relative h-[92px]">
        <nav
          aria-hidden={!visible}
          inert={visible ? undefined : true}
          className={`absolute z-40 inset-x-3 bottom-[max(env(safe-area-inset-bottom),10px)] transition-all duration-[420ms] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${
            visible
              ? 'translate-y-0 opacity-100 scale-100 pointer-events-auto'
              : 'translate-y-[140%] opacity-0 scale-[.97] pointer-events-none'
          }`}
        >
          <div className="glass nav-material rounded-[30px] px-2 py-2 shadow-[0_30px_70px_-28px_rgb(0_0_0/.95)] border-white/[.18]">
            <div className="flex justify-around">
              {items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={(e) => {
                    // Tapping the tab you are already on takes that page back
                    // to its top, the way a phone's own tab bars do.
                    if (location.pathname !== item.to) return
                    e.preventDefault()
                    window.dispatchEvent(new CustomEvent('tab-reselect', { detail: item.to }))
                  }}
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
      </div>
    </div>
  )
}
