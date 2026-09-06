import { useState } from 'react'
import { Info } from 'lucide-react'

// A tiny inline "what does this mean" tag — tap the ⓘ, get one plain-language
// sentence, tap again to close. Exists so jargon never has to sit unexplained
// on screen; keeping money-app anxiety low means never making someone feel
// dumb for not knowing a term.
export default function InfoTag({ children }) {
  const [open, setOpen] = useState(false)
  return (
    <span className="relative inline-flex">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          setOpen((o) => !o)
        }}
        className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-surface2 text-muted hover:text-primary shrink-0"
        aria-label="Что это значит"
      >
        <Info size={11} strokeWidth={2.4} />
      </button>
      {open && (
        <span
          onClick={(e) => e.stopPropagation()}
          className="absolute z-30 top-6 left-1/2 -translate-x-1/2 w-56 bg-surface border border-border rounded-xl shadow-soft p-3 text-xs text-muted leading-relaxed font-sans normal-case tracking-normal font-normal"
        >
          {children}
        </span>
      )}
    </span>
  )
}
