// Where this month's money goes, in order — the person logs income as one
// line and it fills the tiers by itself:
//   1. base: the month's essentials
//   2. pay yourself first: the % that goes to the current Path step
//   3. goal: what the top goal's plan needs this month
//   4. free: what's left to live on (the daily limit is spread from this)
// Nothing is moved here — it's the plan the rest of the app follows.
export function computeWaterfall({ available, needs, pyfAmount, goalPerMonth }) {
  let left = Math.max(0, available || 0)
  const fill = (target) => {
    const t = Math.max(0, target || 0)
    const filled = Math.min(left, t)
    left -= filled
    return { target: t, filled, missing: t - filled, done: t > 0 && filled >= t }
  }
  const base = fill(needs)
  const pyf = fill(pyfAmount)
  const goal = fill(goalPerMonth)
  const tiers = { base, pyf, goal }
  const next = ['base', 'pyf', 'goal'].find((k) => tiers[k].target > 0 && !tiers[k].done) || null
  return { ...tiers, free: left, next }
}
