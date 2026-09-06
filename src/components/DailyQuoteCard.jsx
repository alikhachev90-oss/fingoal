import { BookOpen } from 'lucide-react'
import { getQuoteOfDay } from '../lib/quotes'
import { Card } from './UI'

export default function DailyQuoteCard() {
  const quote = getQuoteOfDay()
  return (
    <Card className="!p-4 !pl-3.5 border-l-[3px] !border-l-primary bg-surface2/50">
      <div className="flex gap-3">
        <BookOpen size={16} strokeWidth={2} className="text-primary shrink-0 mt-0.5" />
        <div className="min-w-0">
          <p className="text-[15px] leading-snug font-display italic">«{quote.text}»</p>
          <p className="text-xs text-muted mt-1.5 uppercase tracking-wide">{quote.source}</p>
        </div>
      </div>
    </Card>
  )
}
