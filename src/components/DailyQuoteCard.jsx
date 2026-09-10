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
    <Card className="!p-5 quote-card">
      <div className="flex gap-3">
        <Icon size={16} strokeWidth={2} className="text-primary shrink-0 mt-0.5" />
        <div className="min-w-0">
          <p className="text-[15px] leading-relaxed font-medium">
            {isStat ? text : `«${text}»`}
          </p>
          <p className="text-[10px] text-muted mt-3 tracking-[.08em] uppercase">{source}</p>
        </div>
      </div>
    </Card>
  )
}
