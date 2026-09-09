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

export default function BottomNav() {
  const { t } = useApp()
  return (
    <div className="sticky bottom-0 z-30 px-3 pb-[max(env(safe-area-inset-bottom),10px)] pt-2 pointer-events-none">
      <nav className="glass rounded-[26px] px-2 py-2 pointer-events-auto shadow-[0_24px_60px_-25px_rgb(0_0_0/.9)]">
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
      </nav>
    </div>
  )
}
