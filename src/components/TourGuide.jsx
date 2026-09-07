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
    let pollId = null
    let cleanupListeners = null
    function readRect(el) {
      const r = el.getBoundingClientRect()
      return { top: r.top, left: r.left, width: r.width, height: r.height }
    }
    function startPolling(el) {
      // The dashboard's cards load their data async (settings/transactions/
      // goals each resolve separately), so the page can still reflow — the
      // card below can grow/shrink — for a moment after we first find and
      // measure the target. A one-shot measurement can end up describing a
      // position the target has since moved away from (the ring then visibly
      // sits on a neighboring card). Keep re-measuring while this step is
      // shown so the spotlight tracks the real element instead of a snapshot.
      const remeasure = () => {
        if (cancelled) return
        const next = readRect(el)
        setRect((prev) => {
          if (prev && prev.top === next.top && prev.left === next.left && prev.width === next.width && prev.height === next.height) return prev
          return next
        })
      }
      pollId = setInterval(remeasure, 200)
      // Scroll/resize (mobile address-bar collapse, keyboard, orientation
      // change) used to only get picked up on the next 200ms poll tick,
      // which is what made the spotlight/tooltip visibly drift and briefly
      // overlap the wrong card while scrolling — react to them immediately too.
      window.addEventListener('scroll', remeasure, true)
      window.addEventListener('resize', remeasure)
      cleanupListeners = () => {
        window.removeEventListener('scroll', remeasure, true)
        window.removeEventListener('resize', remeasure)
      }
    }
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
            setRect(readRect(el))
            startPolling(el)
          }, 80)
          return
        }
        setRect(readRect(el))
        startPolling(el)
      } else if (attempts < 5) {
        attempts += 1
        setTimeout(locate, 150)
      } else if (!cancelled) {
        // Target never mounted (e.g. no goal created yet) — skip this step.
        setStepIdx((i) => Math.min(i + 1, steps.length))
      }
    }
    locate()
    // Cancel any pending retry/scroll timeout/poll from this step once we
    // move on (Next clicked, or the tour finished) — otherwise a late timer
    // can fire setStepIdx/setRect for a step the user already left, which is
    // what let stepIdx overshoot past the end and crash on an undefined step.
    return () => {
      cancelled = true
      if (pollId) clearInterval(pollId)
      if (cleanupListeners) cleanupListeners()
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

  // visualViewport reflects the space actually visible above the mobile
  // browser's collapsing address bar / gesture nav — window.innerHeight can
  // overshoot that and cut the bottom of the tooltip off-screen.
  const viewportH = window.visualViewport?.height || window.innerHeight
  const viewportW = window.visualViewport?.width || window.innerWidth
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
