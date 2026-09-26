import { useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

// The five tabs in the order they sit in the bottom bar, so a swipe moves the
// same direction the eye expects.
const ORDER = ['/dashboard', '/entry', '/goals', '/insights', '/lessons']

// A horizontal drag has to be clearly horizontal and clearly long before it
// counts — otherwise it steals vertical scrolling, which is what people do on
// these screens 99% of the time.
const MIN_DISTANCE = 64
const MAX_OFF_AXIS = 0.6 // |dy| must stay under 60% of |dx|
const MAX_DURATION = 700 // ms; a slow drag is not a flick

// Anything scrollable sideways, or that handles its own drags, keeps its
// gesture: the month strip on the dashboard, a chart, a text field.
const OPT_OUT = 'input, textarea, select, [contenteditable], [data-no-swipe], .recharts-wrapper'

export default function SwipeNavigator() {
  const navigate = useNavigate()
  const location = useLocation()
  const start = useRef(null)

  useEffect(() => {
    const index = ORDER.indexOf(location.pathname)
    if (index === -1) return // not a tab screen — no swiping between pages here

    function onTouchStart(e) {
      if (e.touches.length !== 1) return
      const target = e.target
      if (target?.closest?.(OPT_OUT)) return
      // A dialog or tour is on top: swiping the page behind it is wrong.
      if (document.querySelector('[role="dialog"]')) return
      const t = e.touches[0]
      start.current = { x: t.clientX, y: t.clientY, time: Date.now() }
    }

    function onTouchEnd(e) {
      const from = start.current
      start.current = null
      if (!from) return
      const t = e.changedTouches?.[0]
      if (!t) return
      const dx = t.clientX - from.x
      const dy = t.clientY - from.y
      if (Date.now() - from.time > MAX_DURATION) return
      if (Math.abs(dx) < MIN_DISTANCE) return
      if (Math.abs(dy) > Math.abs(dx) * MAX_OFF_AXIS) return
      const next = index + (dx < 0 ? 1 : -1)
      if (next < 0 || next >= ORDER.length) return
      navigate(ORDER[next])
    }

    function onTouchCancel() {
      start.current = null
    }

    document.addEventListener('touchstart', onTouchStart, { passive: true })
    document.addEventListener('touchend', onTouchEnd, { passive: true })
    document.addEventListener('touchcancel', onTouchCancel, { passive: true })
    return () => {
      document.removeEventListener('touchstart', onTouchStart)
      document.removeEventListener('touchend', onTouchEnd)
      document.removeEventListener('touchcancel', onTouchCancel)
    }
  }, [location.pathname, navigate])

  return null
}
