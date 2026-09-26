// A tiny tap under the finger on every button, like the phone's own UI.
//
// Android: the Vibration API with a pulse too short to read as buzzing — just
// a tick. iOS Safari has no Vibration API, but since iOS 18 toggling a native
// `<input type="checkbox" switch>` plays the system's selection tick, so a
// hidden one is flipped through its label on each tap.

const TARGET = 'button, a[href], [role="button"], [role="tab"], [role="switch"], [role="menuitem"], summary, label, select'

let iosLabel = null
function iosTick() {
  if (!iosLabel) {
    const input = document.createElement('input')
    input.type = 'checkbox'
    input.setAttribute('switch', '')
    input.id = 'haptic-switch'
    iosLabel = document.createElement('label')
    iosLabel.htmlFor = input.id
    iosLabel.setAttribute('aria-hidden', 'true')
    for (const el of [input, iosLabel]) {
      el.style.cssText = 'position:fixed;width:1px;height:1px;opacity:0;pointer-events:none;left:-9px;top:-9px'
      el.tabIndex = -1
    }
    document.body.append(input, iosLabel)
  }
  iosLabel.click()
}

let last = 0
export function haptic() {
  // A label forwards its click to its input; one tap, one tick.
  const now = performance.now()
  if (now - last < 60) return
  last = now
  try {
    if (typeof navigator.vibrate === 'function') navigator.vibrate(10)
    else iosTick()
  } catch {
    // No haptics on this device — nothing to do.
  }
}

export function installHaptics() {
  document.addEventListener(
    'click',
    (e) => {
      // Our own hidden switch clicking itself must not tick again.
      if (!e.isTrusted) return
      const el = e.target?.closest?.(TARGET)
      if (!el || el.disabled || el.getAttribute('aria-disabled') === 'true') return
      if (el.closest('[data-no-haptic]')) return
      haptic()
    },
    true,
  )
}
