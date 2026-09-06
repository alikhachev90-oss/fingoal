import { BookOpen, BarChart3 } from 'lucide-react'
import { getQuoteOfDay } from '../lib/quotes'
import { Card } from './UI'
import { useApp } from '../context/AppContext'

export default function DailyQuoteCard() {
  const { lang } = useApp()
  const quote = getQuoteOfDay()
  const text = quote.text[lang] || quote.text.ru
  const source = quote.source[lang] || quote.source.ru
  const isStat = quote.type === 'stat'
  const Icon = isStat ? BarChart3 : BookOpen
  return (
    <Card className="!p-4 !pl-3.5 border-l-[3px] !border-l-primary bg-surface2/50">
      <div className="flex gap-3">
        <Icon size={16} strokeWidth={2} className="text-primary shrink-0 mt-0.5" />
        <div className="min-w-0">
          <p className={`text-[15px] leading-snug font-display ${isStat ? '' : 'italic'}`}>
            {isStat ? text : `«${text}»`}
          </p>
          <p className="text-xs text-muted mt-1.5 uppercase tracking-wide">{source}</p>
        </div>
      </div>
    </Card>
  )
}
