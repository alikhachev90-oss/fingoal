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
    <div className="sticky bottom-0 z-20 bg-bg/90 backdrop-blur-lg border-t border-border px-1.5 pb-[max(env(safe-area-inset-bottom),10px)] pt-2">
      <div className="flex justify-around">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 px-2.5 py-1.5 rounded-2xl text-[10.5px] font-semibold transition-all duration-200 ${
                isActive ? 'text-primary' : 'text-muted'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <div className={`w-9 h-9 rounded-2xl flex items-center justify-center transition-all duration-200 ${isActive ? 'bg-primary/12' : ''}`}>
                  <item.icon size={19} strokeWidth={isActive ? 2.4 : 2} />
                </div>
                {t(item.key)}
              </>
            )}
          </NavLink>
        ))}
      </div>
    </div>
  )
}
