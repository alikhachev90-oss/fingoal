import { useRef, useState, useLayoutEffect } from 'react'
import { createPortal } from 'react-dom'
import { Info } from 'lucide-react'

// A tiny inline "what does this mean" tag — tap the ⓘ, get one plain-language
// sentence, tap again to close.
//
// Two bugs this fixes: (1) the popup used to be positioned `absolute` inside
// its own narrow parent (a stat tile ~160px wide), so its fixed 224px width
// spilled into whichever card sat next to it; it's now `fixed` in viewport
// coordinates, measured from the icon and clamped to stay on-screen. (2)
// each tag tracked its own open/closed state independently, so tapping a
// second ⓘ left the first popup open too and they visually overlapped —
// `currentCloser` is a tiny module-level singleton so opening one always
// closes whichever other one was open first. (3) `fixed` alone was not
// enough: the cards use `backdrop-filter`, and a filtered ancestor becomes
// the containing block for fixed children, so the carefully clamped
// viewport coordinates were being resolved against the card instead — the
// popup shot off the right edge of the screen. It renders in a portal on
// <body> now, where `fixed` means what it says.
let currentCloser = null

export default function InfoTag({ children }) {
  const btnRef = useRef(null)
  const [pos, setPos] = useState(null) // {top,left,width} in fixed/viewport coords, or null = closed

  function computePos() {
    const el = btnRef.current
    if (!el) return null
    const r = el.getBoundingClientRect()
    const width = Math.min(224, window.innerWidth - 16)
    const left = Math.min(Math.max(8, r.left + r.width / 2 - width / 2), window.innerWidth - width - 8)
    // Below the icon by default, but flipped above it when there isn't room —
    // on a tile near the bottom of the screen the popup ran off the edge.
    const estimated = 96
    const below = r.bottom + 6
    const top = below + estimated > window.innerHeight - 8 && r.top - 6 - estimated > 8
      ? r.top - 6 - estimated
      : Math.min(below, Math.max(8, window.innerHeight - estimated - 8))
    return { top, left, width }
  }

  function close() {
    setPos(null)
    if (currentCloser === close) currentCloser = null
  }

  function toggle(e) {
    e.stopPropagation()
    if (pos) {
      close()
      return
    }
    if (currentCloser) currentCloser()
    setPos(computePos())
    currentCloser = close
  }

  // Keep the popup glued to its icon if the page scrolls or the viewport
  // resizes (address-bar collapse, orientation change) while it's open.
  useLayoutEffect(() => {
    if (!pos) return
    function reposition() {
      setPos((p) => (p ? computePos() || p : p))
    }
    window.addEventListener('resize', reposition)
    window.addEventListener('scroll', reposition, true)
    return () => {
      window.removeEventListener('resize', reposition)
      window.removeEventListener('scroll', reposition, true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [!!pos])

  return (
    <span className="relative inline-flex">
      <button
        ref={btnRef}
        type="button"
        onClick={toggle}
        className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-surface2 text-muted hover:text-primary shrink-0"
        aria-label="Что это значит"
      >
        <Info size={11} strokeWidth={2.4} />
      </button>
      {pos && createPortal(
        <>
          <div className="fixed inset-0 z-[70]" onClick={close} />
          <div
            onClick={(e) => e.stopPropagation()}
            className="fixed z-[71] bg-surface border border-border rounded-xl shadow-soft p-3 text-xs text-muted leading-relaxed font-sans normal-case tracking-normal font-normal"
            style={{ top: pos.top, left: pos.left, width: pos.width }}
          >
            {children}
          </div>
        </>,
        document.body,
      )}
    </span>
  )
}
