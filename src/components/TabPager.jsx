import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import DashboardScreen from '../screens/DashboardScreen'
import EntryScreen from '../screens/EntryScreen'
import GoalsScreen from '../screens/GoalsScreen'
import InsightsScreen from '../screens/InsightsScreen'
import LessonsScreen from '../screens/LessonsScreen'
import ScreenErrorBoundary from './ScreenErrorBoundary'

// The five tabs, in the order they sit in the bottom bar, so dragging moves
// the same direction the eye expects.
export const TABS = [
  { path: '/dashboard', Component: DashboardScreen },
  { path: '/entry', Component: EntryScreen },
  { path: '/goals', Component: GoalsScreen },
  { path: '/insights', Component: InsightsScreen },
  { path: '/lessons', Component: LessonsScreen },
]

// Only the pane the person is actually on should own the fixed chrome — with
// three panes mounted mid-drag, three bottom bars would stack on top of each
// other and the topmost one would eat the taps.
const PaneActiveContext = createContext(true)
export const usePaneActive = () => useContext(PaneActiveContext)

// How far a drag has to go (as a share of screen width), or how fast it has to
// flick (px per ms), before the page actually changes. Below either, it
// springs back — the same feel as flipping between home screens on a phone.
const COMMIT_RATIO = 0.28
const COMMIT_VELOCITY = 0.35
const DIRECTION_LOCK = 10 // px of movement before we decide horizontal vs vertical

// Elements that handle their own horizontal drags, plus anything a drag would
// ruin: a text field, a chart, a month strip.
const OPT_OUT = 'input, textarea, select, [contenteditable], [data-no-swipe], .recharts-wrapper'

export default function TabPager() {
  const location = useLocation()
  const navigate = useNavigate()
  const index = Math.max(0, TABS.findIndex((t) => t.path === location.pathname))

  const trackRef = useRef(null)
  const drag = useRef(null)
  // Panes either side are mounted only while a drag is live: each screen loads
  // its own data, and paying for that on every render would be wasteful.
  const [dragging, setDragging] = useState(false)
  const [offset, setOffset] = useState(0)
  const [animating, setAnimating] = useState(false)
  const pendingRef = useRef(null)

  // After the route changes, the new current pane is already centred. Jump the
  // track to where the finger left off and glide it home, so the commit looks
  // like one continuous movement rather than a cut.
  useEffect(() => {
    const pending = pendingRef.current
    if (!pending) return
    pendingRef.current = null
    setAnimating(false)
    if (!pending.from) {
      // Nothing left to glide through — without this guard `animating` would
      // never be cleared (no transition fires) and every later drag is ignored.
      setOffset(0)
      return
    }
    setOffset(pending.from)
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setAnimating(true)
        setOffset(0)
      })
    })
  }, [location.pathname])

  useEffect(() => {
    const node = trackRef.current
    if (!node) return

    function onTouchStart(e) {
      if (e.touches.length !== 1) return
      if (e.target?.closest?.(OPT_OUT)) return
      if (document.querySelector('[role="dialog"]')) return
      // Catching the track mid-glide has to grab it where it is, the way a
      // finger catches a spinning wheel — otherwise a quick second swipe is
      // swallowed while the first one is still settling.
      setAnimating(false)
      const t = e.touches[0]
      drag.current = { x: t.clientX, y: t.clientY, base: offsetRef.current, time: Date.now(), axis: null, last: t.clientX, lastTime: Date.now(), velocity: 0 }
    }

    function onTouchMove(e) {
      const d = drag.current
      if (!d) return
      const t = e.touches[0]
      const dx = t.clientX - d.x
      const dy = t.clientY - d.y

      if (d.axis === null) {
        if (Math.abs(dx) < DIRECTION_LOCK && Math.abs(dy) < DIRECTION_LOCK) return
        d.axis = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y'
        if (d.axis === 'x') setDragging(true)
      }
      if (d.axis !== 'x') return

      // Now that the gesture is ours, stop the page scrolling under it.
      if (e.cancelable) e.preventDefault()

      const now = Date.now()
      const dt = now - d.lastTime
      if (dt > 0) d.velocity = (t.clientX - d.last) / dt
      d.last = t.clientX
      d.lastTime = now

      const width = node.clientWidth || window.innerWidth
      let next = d.base + dx
      // Rubber band at the two ends: there is nothing to pull in from there.
      if ((index === 0 && next > 0) || (index === TABS.length - 1 && next < 0)) next *= 0.25
      setOffset(Math.max(-width, Math.min(width, next)))
    }

    function finish() {
      const d = drag.current
      drag.current = null
      if (!d || d.axis !== 'x') {
        setDragging(false)
        return
      }
      const width = node.clientWidth || window.innerWidth
      const travelled = offsetRef.current
      const far = Math.abs(travelled) > width * COMMIT_RATIO
      const fast = Math.abs(d.velocity) > COMMIT_VELOCITY
      const dir = travelled < 0 ? 1 : -1
      const target = index + dir
      const canGo = (far || fast) && travelled !== 0 && target >= 0 && target < TABS.length

      if (canGo) {
        // Remember where the finger was so the new layout can pick the
        // movement up from exactly that point instead of snapping.
        pendingRef.current = { from: travelled + dir * width }
        setDragging(false)
        navigate(TABS[target].path)
        return
      }
      setAnimating(true)
      setOffset(0)
      setDragging(false)
    }

    node.addEventListener('touchstart', onTouchStart, { passive: true })
    node.addEventListener('touchmove', onTouchMove, { passive: false })
    node.addEventListener('touchend', finish, { passive: true })
    node.addEventListener('touchcancel', finish, { passive: true })
    return () => {
      node.removeEventListener('touchstart', onTouchStart)
      node.removeEventListener('touchmove', onTouchMove)
      node.removeEventListener('touchend', finish)
      node.removeEventListener('touchcancel', finish)
    }
  }, [index, navigate])

  // The handlers above read the live offset without re-subscribing on every
  // pixel of the drag.
  const offsetRef = useRef(0)
  offsetRef.current = offset

  const Current = TABS[index].Component
  const Prev = index > 0 ? TABS[index - 1].Component : null
  const Next = index < TABS.length - 1 ? TABS[index + 1].Component : null
  const showNeighbours = dragging || animating

  function pane(Component, active, style) {
    if (!Component) return null
    return (
      <div className="absolute inset-y-0 w-full overflow-y-auto pb-[92px]" style={style} aria-hidden={!active}>
        <PaneActiveContext.Provider value={active}>
          <ScreenErrorBoundary>
            <Component />
          </ScreenErrorBoundary>
        </PaneActiveContext.Provider>
      </div>
    )
  }

  return (
    <div
      ref={trackRef}
      className="relative overflow-hidden min-h-[100svh]"
      style={{ touchAction: 'pan-y' }}
    >
      <div
        className="relative min-h-[100svh]"
        style={{
          transform: `translate3d(${offset}px, 0, 0)`,
          transition: animating ? 'transform 260ms cubic-bezier(0.22, 1, 0.36, 1)' : 'none',
        }}
        onTransitionEnd={() => setAnimating(false)}
        onTransitionCancel={() => setAnimating(false)}
      >
        {showNeighbours && pane(Prev, false, { left: '-100%' })}
        <div className="w-full pb-[92px]">
          <PaneActiveContext.Provider value={true}>
            <ScreenErrorBoundary>
              <Current />
            </ScreenErrorBoundary>
          </PaneActiveContext.Provider>
        </div>
        {showNeighbours && pane(Next, false, { left: '100%' })}
      </div>
    </div>
  )
}
