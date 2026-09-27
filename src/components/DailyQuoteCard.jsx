import { BookOpen, BarChart3 } from 'lucide-react'
import { getQuoteOfDay } from '../lib/quotes'
import { Card } from './UI'
import { useApp } from '../context/AppContext'

export default function DailyQuoteCard({ inline = false }) {
  const { lang } = useApp()
  const quote = getQuoteOfDay()
  const text = quote.text[lang] || quote.text.ru
  const source = quote.source[lang] || quote.source.ru
  const isStat = quote.type === 'stat'
  const Icon = isStat ? BarChart3 : BookOpen
  // Right under the greeting: the line you read the moment the app opens,
  // a new one every day.
  if (inline) {
    return (
      <div className="home-quote mt-2">
        <p className="text-[14px] leading-snug font-medium text-text/90">
          {isStat ? text : `«${text}»`}
        </p>
        <p className="text-[10px] text-muted mt-1.5 tracking-[.08em] uppercase flex items-center gap-1.5">
          <Icon size={11} strokeWidth={2} className="text-primary shrink-0" />
          {source}
        </p>
      </div>
    )
  }
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
