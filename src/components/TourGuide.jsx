import { useEffect, useLayoutEffect, useState } from 'react'
import { X } from 'lucide-react'
import { Button } from './UI'
import { isTourDone, markTourDone } from '../lib/tours'

const GAP = 6

// Spotlights one data-tour="<step.id>" element at a time with a tooltip
// explaining it. Runs automatically once per screen (tracked in
// localStorage); `active`/`onActiveChange` let a screen's "?" button replay
// it on demand.
export default function TourGuide({ userId, context, screenKey, steps, lang, active, onActiveChange }) {
  const [stepIdx, setStepIdx] = useState(0)
  const [rect, setRect] = useState(null)
  const [running, setRunning] = useState(false)

  useEffect(() => {
    if (!userId || !steps?.length) return
    if (!isTourDone(userId, context, screenKey)) {
      setStepIdx(0)
      setRunning(true)
    }
  }, [userId, context, screenKey])

  useEffect(() => {
    if (active) {
      setStepIdx(0)
      setRunning(true)
    }
  }, [active])

  useLayoutEffect(() => {
    if (!running) return
    const step = steps[stepIdx]
    if (!step) {
      finish()
      return
    }
    // Stale-rect guard: don't keep showing the previous step's spotlight
    // while we're still looking for this step's target — that's what made
    // the ring appear to sit on the wrong card.
    setRect(null)
    let attempts = 0
    let cancelled = false
    function locate() {
      if (cancelled) return
      const el = document.querySelector(`[data-tour="${step.id}"]`)
      if (el) {
        const r = el.getBoundingClientRect()
        const offscreen = r.top < 0 || r.bottom > window.innerHeight
        if (offscreen) {
          el.scrollIntoView({ block: 'center', behavior: 'instant' })
          // Let the scroll settle, then measure the now-in-view position.
          setTimeout(() => {
            if (cancelled) return
            const r2 = el.getBoundingClientRect()
            setRect({ top: r2.top, left: r2.left, width: r2.width, height: r2.height })
          }, 80)
          return
        }
        setRect({ top: r.top, left: r.left, width: r.width, height: r.height })
      } else if (attempts < 5) {
        attempts += 1
        setTimeout(locate, 150)
      } else if (!cancelled) {
        // Target never mounted (e.g. no goal created yet) — skip this step.
        setStepIdx((i) => Math.min(i + 1, steps.length))
      }
    }
    locate()
    // Cancel any pending retry/scroll timeout from this step once we move on
    // (Next clicked, or the tour finished) — otherwise a late timer can fire
    // setStepIdx/setRect for a step the user already left, which is what let
    // stepIdx overshoot past the end and crash on an undefined step.
    return () => {
      cancelled = true
    }
  }, [running, stepIdx, steps])

  function finish() {
    setRunning(false)
    setRect(null)
    markTourDone(userId, context, screenKey)
    onActiveChange?.(false)
  }

  function next() {
    if (stepIdx + 1 >= steps.length) finish()
    else setStepIdx((i) => i + 1)
  }

  if (!running || !rect) return null
  const step = steps[stepIdx]
  // stepIdx can momentarily run past the last step (Next clicked right as an
  // auto-skip-for-not-found timer also lands) — this render fires before the
  // effect below has a chance to call finish()/clear rect, so bail out here
  // too instead of crashing on step.title.
  if (!step) return null
  const title = step.title[lang] || step.title.ru
  const body = step.body[lang] || step.body.ru

  const viewportH = window.innerHeight
  const viewportW = window.innerWidth
  const spaceBelow = viewportH - (rect.top + rect.height)
  const placeBelow = spaceBelow > 190 || rect.top < 190
  const tooltipTop = placeBelow ? rect.top + rect.height + GAP : Math.max(12, rect.top - GAP)
  const tooltipMaxWidth = Math.min(340, viewportW - 32)

  const skipLabel = lang === 'en' ? 'Skip' : lang === 'es' ? 'Omitir' : lang === 'fr' ? 'Passer' : 'Пропустить'
  const nextLabel =
    stepIdx + 1 >= steps.length
      ? lang === 'en' ? 'Got it' : lang === 'es' ? 'Entendido' : lang === 'fr' ? 'Compris' : 'Понятно'
      : lang === 'en' ? 'Next' : lang === 'es' ? 'Siguiente' : lang === 'fr' ? 'Suivant' : 'Далее'

  return (
    <div className="fixed inset-0 z-[60]" role="dialog" aria-modal="true">
      {/* Four dimmed strips around the target, leaving it un-dimmed. */}
      <div className="absolute bg-black/55" style={{ top: 0, left: 0, right: 0, height: Math.max(0, rect.top - 4) }} />
      <div className="absolute bg-black/55" style={{ top: rect.top + rect.height + 4, left: 0, right: 0, bottom: 0 }} />
      <div className="absolute bg-black/55" style={{ top: rect.top - 4, left: 0, width: Math.max(0, rect.left - 4), height: rect.height + 8 }} />
      <div className="absolute bg-black/55" style={{ top: rect.top - 4, left: rect.left + rect.width + 4, right: 0, height: rect.height + 8 }} />
      {/* Highlight ring */}
      <div
        className="absolute rounded-xl ring-2 ring-primary pointer-events-none"
        style={{ top: rect.top - 4, left: rect.left - 4, width: rect.width + 8, height: rect.height + 8 }}
      />
      {/* Tooltip */}
      <div
        className="absolute bg-surface border border-border rounded-xl shadow-soft p-3.5 space-y-2.5"
        style={{
          top: placeBelow ? tooltipTop : undefined,
          bottom: placeBelow ? undefined : viewportH - tooltipTop,
          left: Math.min(Math.max(12, rect.left), viewportW - tooltipMaxWidth - 12),
          width: tooltipMaxWidth,
        }}
      >
        <div className="flex items-start justify-between gap-2">
          <p className="font-semibold text-sm">{title}</p>
          <button onClick={finish} type="button" aria-label={skipLabel} className="text-muted shrink-0">
            <X size={16} />
          </button>
        </div>
        <p className="text-xs text-muted leading-relaxed">{body}</p>
        <div className="flex items-center justify-between pt-1">
          <span className="text-[11px] text-muted">{stepIdx + 1}/{steps.length}</span>
          <div className="flex gap-2">
            <Button variant="secondary" className="!w-auto px-3 text-xs" onClick={finish} type="button">{skipLabel}</Button>
            <Button className="!w-auto px-3.5 text-xs" onClick={next} type="button">{nextLabel}</Button>
          </div>
        </div>
      </div>
    </div>
  )
}
