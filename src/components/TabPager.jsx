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

// How stiff the settle is, in radians per second. Critically damped, so it
// eases in and stops dead without ever overshooting; lower is looser and
// slower. Around 13 gives a full screen roughly a third of a second, with a
// long soft tail — the part that reads as smooth.
const OMEGA = 13

// Only things that genuinely need a sideways drag of their own keep the
// gesture. Charts and text fields deliberately do NOT opt out — they cover
// most of the screen, and a page you can only turn by grabbing its outer edge
// feels broken. Tapping into a field still works; only a sideways drag that
// starts on one turns the page.
const OPT_OUT = '[contenteditable], [data-no-swipe], input[type="range"]'

// The tabs form a ring: swipe past the last one and the first comes round
// again, so there is never a dead edge you have to swipe all the way back
// from. `wrap` is the shortest signed distance from the current tab.
const step = (i) => (i + TABS.length) % TABS.length
function wrap(rel) {
  const n = TABS.length
  let r = ((rel % n) + n) % n
  if (r > n / 2) r -= n
  return r
}

export default function TabPager() {
  const location = useLocation()
  const navigate = useNavigate()
  const index = Math.max(0, TABS.findIndex((t) => t.path === location.pathname))

  const frameRef = useRef(null)
  const trackRef = useRef(null)
  const drag = useRef(null)
  const offsetRef = useRef(0)
  const animating = useRef(false)
  const raf = useRef(0)

  // Which screens are alive. A screen is mounted the first time it is needed
  // and then kept — it is what stops the page you just swiped to from
  // flashing its "Загрузка" state, because it was already loaded behind the
  // one you were looking at.
  const [mounted, setMounted] = useState(() => new Set([index]))
  function keepAlive(...indices) {
    setMounted((prev) => {
      const wanted = indices.filter((i) => !prev.has(i))
      if (!wanted.length) return prev
      const next = new Set(prev)
      wanted.forEach((i) => next.add(i))
      return next
    })
  }

  // Runs the settle by hand instead of handing it to CSS, because only this
  // way can it start at the speed the finger was already moving. x(t) is a
  // critically damped spring: no overshoot, and the harder the throw the
  // sooner it arrives.
  function settle(from, to, velocity, onDone) {
    cancelAnimationFrame(raf.current)
    const a = from - to
    const b = velocity + OMEGA * a
    const start = performance.now()
    const tick = (now) => {
      const t = (now - start) / 1000
      const decay = Math.exp(-OMEGA * t)
      const x = to + (a + b * t) * decay
      const speed = Math.abs(b * decay - OMEGA * (a + b * t) * decay)
      // Close enough to be indistinguishable, and no longer moving.
      if (Math.abs(x - to) < 0.5 && speed < 12) {
        place(to)
        onDone()
        return
      }
      place(x)
      raf.current = requestAnimationFrame(tick)
    }
    raf.current = requestAnimationFrame(tick)
  }

  // Every pixel of the drag is written straight to the element. Routing this
  // through React state re-rendered the mounted screens every frame, which is
  // what made the movement stutter instead of tracking the finger.
  function place(x, transition) {
    const el = trackRef.current
    if (!el) return
    offsetRef.current = x
    el.style.transition = transition || 'none'
    // Make the browser take in the new transition before the new transform
    // lands, so it has something to animate from rather than snapping.
    if (transition) void el.offsetHeight
    // At rest the transform is cleared entirely: an element with a transform
    // becomes the containing block for any `position: fixed` dialog inside it.
    el.style.transform = x === 0 && !transition ? '' : `translate3d(${x}px, 0, 0)`
  }

  // The panes are laid out from the current index, so the track has to be back
  // at zero before the browser paints — a layout effect, not a normal one.
  useLayoutEffect(() => {
    animating.current = false
    cancelAnimationFrame(raf.current)
    place(0)
    // Mounting the tab that just came into reach is real work — a whole screen
    // of layout and data. Doing it in the same frame the page lands in is felt
    // as a jolt right at the end of the movement, so it waits until the
    // browser is idle again.
    const idle = window.requestIdleCallback || ((fn) => setTimeout(fn, 200))
    const cancel = window.cancelIdleCallback || clearTimeout
    const handle = idle(() => keepAlive(step(index - 1), step(index + 1)), { timeout: 600 })
    return () => cancel(handle)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index])

  useEffect(() => {
    const node = frameRef.current
    if (!node) return

    function onTouchStart(e) {
      if (e.touches.length !== 1) return
      // Let the page finish arriving before another gesture starts, otherwise
      // the second drag fights the settle and lands somewhere in between.
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
      if (dt > 0) {
        // Hold the finger still for a moment and the throw is spent, however
        // fast it was getting here.
        if (dt > 90) d.velocity = 0
        // Lightly smoothed, so one jittery frame can't read as a flick, but
        // not so heavily that the reading lags behind the finger.
        else d.velocity = d.velocity * 0.6 + ((t.clientX - d.last) / dt) * 0.4
        d.last = t.clientX
        d.lastTime = now
      }

      const width = node.clientWidth || window.innerWidth
      // No rubber band: every direction has a page to pull in, because the
      // last tab's neighbour is the first one.
      const next = d.base + dx
      place(Math.max(-width, Math.min(width, next)))
    }

    function finish() {
      const d = drag.current
      drag.current = null
      if (!d || d.axis !== 'x') return

      const width = node.clientWidth || window.innerWidth
      const travelled = offsetRef.current
      const dir = travelled < 0 ? 1 : -1
      const target = step(index + dir)
      const far = Math.abs(travelled) > width * COMMIT_RATIO
      // A flick only counts when it is still moving the way the page went.
      const fast = Math.abs(d.velocity) > COMMIT_VELOCITY && Math.sign(d.velocity) === -dir
      const canGo = travelled !== 0 && (far || fast)

      if (!canGo) {
        animating.current = true
        settle(travelled, 0, d.velocity * 1000, () => {
          animating.current = false
          place(0)
        })
        return
      }

      // Carry the movement on from exactly the speed the finger let go at.
      // A CSS transition always starts from a standstill, so however long it
      // was given, the first instant after release was a stop followed by a
      // fresh push — which is what has been read as a hop at the end. This is
      // the same critically damped spring a phone uses: it inherits the throw,
      // never overshoots, and a hard flick lands sooner than a slow drag.
      const landing = dir === 1 ? -width : width
      animating.current = true
      settle(travelled, landing, d.velocity * 1000, () => {
        animating.current = false
        navigate(TABS[target].path)
      })
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
          const rel = wrap(i - index)
          const near = Math.abs(rel) <= 1
          const Component = tab.Component
          return (
            <div
              key={tab.path}
              className="absolute inset-y-0 w-full overflow-y-auto overscroll-y-contain pb-[92px]"
              style={{
                left: `${rel * 100}%`,
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
