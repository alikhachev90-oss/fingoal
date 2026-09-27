// An installed app stays loaded for days — reopening it from the home screen
// usually just brings the old page back, so a fresh deploy didn't show up.
// This checks /version.json whenever the app comes back to the foreground
// (and every few minutes while open) and reloads onto the new build.

/* global __BUILD_ID__ */
const CHECK_EVERY_MS = 5 * 60 * 1000

let pending = false

async function newerBuildLive() {
  try {
    const res = await fetch(`/version.json?t=${Date.now()}`, { cache: 'no-store' })
    if (!res.ok) return false
    const { id } = await res.json()
    return Boolean(id) && id !== __BUILD_ID__
  } catch {
    return false // offline — try again next time
  }
}

async function check({ reloadNow }) {
  if (!(await newerBuildLive())) return
  // Coming back to the app: nothing is half-typed yet, reload straight away.
  // While it's in use: wait until it's next backgrounded, never mid-entry.
  if (reloadNow) window.location.reload()
  else pending = true
}

export function installAppUpdate() {
  if (import.meta.env.DEV) return
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState !== 'visible') return
    if (pending) return window.location.reload()
    check({ reloadNow: true })
    navigator.serviceWorker?.getRegistration('/sw.js').then((reg) => reg?.update()).catch(() => {})
  })
  setInterval(() => {
    if (document.visibilityState === 'visible') check({ reloadNow: false })
  }, CHECK_EVERY_MS)
}
