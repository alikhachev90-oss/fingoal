import { X, Lightbulb } from 'lucide-react'
import { Card, Button } from './UI'

export default function HabitTipModal({ tip, lang, onClose }) {
  if (!tip) return null
  const title = tip.title[lang] || tip.title.ru
  const body = tip.body[lang] || tip.body.ru
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 px-4 pb-4 sm:pb-0">
      <Card className="!p-4 max-w-app w-full space-y-3 relative">
        <button onClick={onClose} className="absolute top-3 right-3 text-muted" aria-label="close" type="button">
          <X size={18} />
        </button>
        <div className="flex items-center gap-2.5 pr-6">
          <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Lightbulb size={16} strokeWidth={2.25} />
          </div>
          <p className="font-semibold text-sm">{title}</p>
        </div>
        <p className="text-sm leading-relaxed text-muted">{body}</p>
        <Button onClick={onClose} type="button">
          {lang === 'ru' ? 'Понятно' : lang === 'es' ? 'Entendido' : lang === 'fr' ? 'Compris' : 'Got it'}
        </Button>
      </Card>
    </div>
  )
}
