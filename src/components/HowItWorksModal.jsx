import { X, Target, TrendingUp, Flame, ShieldCheck } from 'lucide-react'
import { IconCircle } from './UI'
import { useApp } from '../context/AppContext'

export default function HowItWorksModal({ onClose }) {
  const { t } = useApp()
  const POINTS = [
    { icon: Target, color: 'bg-primary/10 text-primary', title: t('howItWorks.point1Title'), body: t('howItWorks.point1Body') },
    { icon: TrendingUp, color: 'bg-savings/10 text-savings', title: t('howItWorks.point2Title'), body: t('howItWorks.point2Body') },
    { icon: Flame, color: 'bg-wants/10 text-wants', title: t('howItWorks.point3Title'), body: t('howItWorks.point3Body') },
  ]
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center animate-pop-in">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-app bg-surface rounded-t-3xl sm:rounded-3xl p-5 pb-[max(env(safe-area-inset-bottom),20px)] max-h-[88svh] overflow-y-auto shadow-soft">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <IconCircle icon={ShieldCheck} className="bg-primary/10 text-primary" size={34} iconSize={16} />
            <h2 className="text-xl font-semibold font-display">{t('howItWorks.modalTitle')}</h2>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-surface2 flex items-center justify-center" aria-label={t('howItWorks.close')}>
            <X size={16} />
          </button>
        </div>

        <div className="space-y-4">
          {POINTS.map((p) => (
            <div key={p.title} className="flex gap-3">
              <IconCircle icon={p.icon} className={p.color} size={40} iconSize={18} />
              <div className="min-w-0">
                <p className="font-semibold text-sm mb-0.5">{p.title}</p>
                <p className="text-sm text-muted leading-relaxed">{p.body}</p>
              </div>
            </div>
          ))}
        </div>

        <button onClick={onClose} className="w-full mt-6 py-3 rounded-xl font-semibold text-[15px] bg-primary text-onprimary active:scale-[0.97] transition">
          {t('howItWorks.gotIt')}
        </button>
      </div>
    </div>
  )
}
