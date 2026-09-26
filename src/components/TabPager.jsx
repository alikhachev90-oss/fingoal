import { createContext, useContext, useEffect, useLayoutEffect, useRef, useState } from 'react'
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

const PaneActiveContext = createContext(true)
export const usePaneActive = () => useContext(PaneActiveContext)

// Past this share of the screen, or this fast a flick, the page changes;
// below both it springs back. Deliberately past a third of the screen — a
// shorter throw turned a glance sideways into an accidental page turn.
const COMMIT_RATIO = 0.42
const COMMIT_VELOCITY = 0.55 // px per ms
const DIRECTION_LOCK = 8 // px before we decide horizontal vs vertical
const GLIDE = 'transform 300ms cubic-bezier(0.22, 1, 0.36, 1)'

const OPT_OUT = 'input, textarea, select, [contenteditable], [data-no-swipe], .recharts-wrapper'

export default function TabPager() {
  const location = useLocation()
  const navigate = useNavigate()
  const index = Math.max(0, TABS.findIndex((t) => t.path === location.pathname))

  const frameRef = useRef(null)
  const trackRef = useRef(null)
  const drag = useRef(null)
  const offsetRef = useRef(0)
  // Neighbours cost a full screen's worth of data loading each, so they are
  // mounted for the length of a gesture and dropped again afterwards.
  const [live, setLive] = useState(false)

  // Every pixel of the drag is written straight to the element. Routing this
  // through React state re-rendered three mounted screens per frame, which is
  // what made the movement stutter instead of tracking the finger.
  function place(x, transition) {
    const el = trackRef.current
    if (!el) return
    offsetRef.current = x
    el.style.transition = transition || 'none'
    el.style.transform = `translate3d(${x}px, 0, 0)`
  }

  // The new pane arrives already centred, so the track has to be back at zero
  // before the browser paints — a layout effect, not a normal one.
  useLayoutEffect(() => {
    place(0, 'none')
    setLive(false)
  }, [location.pathname])

  useEffect(() => {
    const node = frameRef.current
    if (!node) return

    function onTouchStart(e) {
      if (e.touches.length !== 1) return
      if (e.target?.closest?.(OPT_OUT)) return
      if (document.querySelector('[role="dialog"]')) return
      const t = e.touches[0]
      drag.current = {
        x: t.clientX,
        y: t.clientY,
        base: offsetRef.current,
        axis: null,
        last: t.clientX,
        lastTime: Date.now(),
        velocity: 0,
      }
      // Bring the neighbours in at the very start of the gesture rather than
      // partway through it: mounting a screen mid-drag is a visible hitch.
      setLive(true)
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
        if (d.axis === 'y') setLive(false)
      }
      if (d.axis !== 'x') return
      if (e.cancelable) e.preventDefault()

      const now = Date.now()
      const dt = now - d.lastTime
      // Smoothed, so one jittery frame can't read as a flick.
      if (dt > 0) d.velocity = d.velocity * 0.7 + ((t.clientX - d.last) / dt) * 0.3
      d.last = t.clientX
      d.lastTime = now

      const width = node.clientWidth || window.innerWidth
      let next = d.base + dx
      // Rubber band at the two ends: there is nothing to pull in from there.
      if ((index === 0 && next > 0) || (index === TABS.length - 1 && next < 0)) next *= 0.22
      place(Math.max(-width, Math.min(width, next)))
    }

    function finish() {
      const d = drag.current
      drag.current = null
      if (!d || d.axis !== 'x') {
        setLive(false)
        return
      }
      const width = node.clientWidth || window.innerWidth
      const travelled = offsetRef.current
      const dir = travelled < 0 ? 1 : -1
      const target = index + dir
      const far = Math.abs(travelled) > width * COMMIT_RATIO
      const fast = Math.abs(d.velocity) > COMMIT_VELOCITY
      const canGo = travelled !== 0 && (far || fast) && target >= 0 && target < TABS.length

      if (!canGo) {
        place(0, GLIDE)
        setTimeout(() => setLive(false), 320)
        return
      }

      // Finish the movement the finger started, then swap the route under it
      // once the outgoing pane is fully off to the side.
      const el = trackRef.current
      const landing = dir === 1 ? -width : width
      let done = false
      const commit = () => {
        if (done) return
        done = true
        el?.removeEventListener('transitionend', commit)
        navigate(TABS[target].path)
      }
      el?.addEventListener('transitionend', commit)
      place(landing, GLIDE)
      // Belt and braces: if the transition never fires (backgrounded tab,
      // reduced motion) the page still has to change.
      setTimeout(commit, 360)
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

  const Current = TABS[index].Component
  const Prev = index > 0 ? TABS[index - 1].Component : null
  const Next = index < TABS.length - 1 ? TABS[index + 1].Component : null

  function pane(Component, style) {
    if (!Component) return null
    return (
      <div className="absolute inset-y-0 w-full overflow-y-auto pb-[92px]" style={style} aria-hidden="true">
        <PaneActiveContext.Provider value={false}>
          <ScreenErrorBoundary>
            <Component />
          </ScreenErrorBoundary>
        </PaneActiveContext.Provider>
      </div>
    )
  }

  return (
    <div ref={frameRef} className="relative overflow-hidden min-h-[100svh]" style={{ touchAction: 'pan-y' }}>
      <div ref={trackRef} className="relative min-h-[100svh]" style={{ willChange: 'transform' }}>
        {live && pane(Prev, { left: '-100%' })}
        <div className="w-full pb-[92px]">
          <PaneActiveContext.Provider value={true}>
            <ScreenErrorBoundary>
              <Current />
            </ScreenErrorBoundary>
          </PaneActiveContext.Provider>
        </div>
        {live && pane(Next, { left: '100%' })}
      </div>
    </div>
  )
}
