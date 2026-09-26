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
// below both it springs back.
const COMMIT_RATIO = 0.3
const COMMIT_VELOCITY = 0.35 // px per ms
const DIRECTION_LOCK = 8 // px before we decide horizontal vs vertical
const GLIDE = 'transform 280ms cubic-bezier(0.22, 1, 0.36, 1)'

// Only things that genuinely need a sideways drag of their own keep the
// gesture. Charts and text fields deliberately do NOT opt out — they cover
// most of the screen, and a page you can only turn by grabbing its outer edge
// feels broken. Tapping into a field still works; only a sideways drag that
// starts on one turns the page.
const OPT_OUT = '[contenteditable], [data-no-swipe], input[type="range"]'

export default function TabPager() {
  const location = useLocation()
  const navigate = useNavigate()
  const index = Math.max(0, TABS.findIndex((t) => t.path === location.pathname))

  const frameRef = useRef(null)
  const trackRef = useRef(null)
  const drag = useRef(null)
  const offsetRef = useRef(0)
  const animating = useRef(false)

  // Which screens are alive. A screen is mounted the first time it is needed
  // and then kept — it is what stops the page you just swiped to from
  // flashing its "Загрузка" state, because it was already loaded behind the
  // one you were looking at.
  const [mounted, setMounted] = useState(() => new Set([index]))
  function keepAlive(...indices) {
    setMounted((prev) => {
      const wanted = indices.filter((i) => i >= 0 && i < TABS.length && !prev.has(i))
      if (!wanted.length) return prev
      const next = new Set(prev)
      wanted.forEach((i) => next.add(i))
      return next
    })
  }

  // Every pixel of the drag is written straight to the element. Routing this
  // through React state re-rendered the mounted screens every frame, which is
  // what made the movement stutter instead of tracking the finger.
  function place(x, transition) {
    const el = trackRef.current
    if (!el) return
    offsetRef.current = x
    el.style.transition = transition || 'none'
    // At rest the transform is cleared entirely: an element with a transform
    // becomes the containing block for any `position: fixed` dialog inside it.
    el.style.transform = x === 0 && !transition ? '' : `translate3d(${x}px, 0, 0)`
  }

  // The panes are laid out from the current index, so the track has to be back
  // at zero before the browser paints — a layout effect, not a normal one.
  useLayoutEffect(() => {
    animating.current = false
    place(0)
    keepAlive(index - 1, index + 1)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index])

  useEffect(() => {
    const node = frameRef.current
    if (!node) return

    function onTouchStart(e) {
      if (e.touches.length !== 1) return
      // Let the page finish arriving before another gesture starts, otherwise
      // the second drag fights the glide and lands somewhere in between.
      if (animating.current) return
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
      if (!d || d.axis !== 'x') return

      const width = node.clientWidth || window.innerWidth
      const travelled = offsetRef.current
      const dir = travelled < 0 ? 1 : -1
      const target = index + dir
      const far = Math.abs(travelled) > width * COMMIT_RATIO
      // A flick only counts when it is still moving the way the page went.
      const fast = Math.abs(d.velocity) > COMMIT_VELOCITY && Math.sign(d.velocity) === -dir
      const canGo = travelled !== 0 && (far || fast) && target >= 0 && target < TABS.length

      if (!canGo) {
        place(0, GLIDE)
        return
      }

      // Carry the movement the rest of the way instead of teleporting: let go
      // half way and the page coasts to the edge, the way a phone does. The
      // route changes only once it has arrived, and because both screens were
      // already mounted there is nothing to re-fetch when it does.
      const el = trackRef.current
      const landing = dir === 1 ? -width : width
      const remaining = Math.abs(landing - travelled)
      // Shorter throws finish sooner, so a nearly-complete drag doesn't hang.
      const ms = Math.max(140, Math.min(320, Math.round((remaining / width) * 340)))
      let done = false
      const arrive = () => {
        if (done) return
        done = true
        el?.removeEventListener('transitionend', arrive)
        animating.current = false
        navigate(TABS[target].path)
      }
      animating.current = true
      el?.addEventListener('transitionend', arrive)
      place(landing, `transform ${ms}ms cubic-bezier(0.25, 0.9, 0.3, 1)`)
      // If the transition never fires — backgrounded tab, reduced motion —
      // the page still has to change.
      setTimeout(arrive, ms + 90)
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

  return (
    <div
      ref={frameRef}
      className="relative overflow-hidden h-[100svh]"
      style={{ touchAction: 'pan-y' }}
    >
      <div ref={trackRef} className="absolute inset-0">
        {TABS.map((tab, i) => {
          if (!mounted.has(i)) return null
          const active = i === index
          const near = Math.abs(i - index) <= 1
          const Component = tab.Component
          return (
            <div
              key={tab.path}
              className="absolute inset-y-0 w-full overflow-y-auto overscroll-y-contain pb-[92px]"
              style={{
                left: `${(i - index) * 100}%`,
                // Kept in the tree but out of the way: no paint cost, no
                // stray taps, and the scroll position is remembered.
                visibility: near ? 'visible' : 'hidden',
                pointerEvents: active ? 'auto' : 'none',
              }}
              aria-hidden={!active}
              inert={active ? undefined : true}
            >
              <PaneActiveContext.Provider value={active}>
                <ScreenErrorBoundary>
                  <Component />
                </ScreenErrorBoundary>
              </PaneActiveContext.Provider>
            </div>
          )
        })}
      </div>
    </div>
  )
}
