// A phone-battery-style progress indicator: starts red when far from the goal,
// eases through amber and into green as the goal gets closer — with a
// battery "nub" on the right, just like a real charge indicator.

function colorForPct(pct) {
  if (pct < 25) return { fill: 'rgb(var(--color-danger))', text: 'text-danger' }
  if (pct < 60) return { fill: 'rgb(var(--color-wants))', text: 'text-wants' }
  return { fill: 'rgb(var(--color-savings))', text: 'text-savings' }
}

export default function BatteryProgress({ pct, label, height = 22 }) {
  const clamped = Math.min(100, Math.max(0, pct))
  const { fill, text } = colorForPct(clamped)
  const nubWidth = Math.round(height * 0.22)
  const nubHeight = Math.round(height * 0.45)

  return (
    <div className="flex items-center gap-2.5">
      <div className="flex items-center shrink-0" style={{ height }}>
        <div
          className="relative rounded-[6px] border-2 overflow-hidden bg-surface2"
          style={{ width: 84, height, borderColor: 'rgb(var(--color-border))' }}
        >
          <div
            className="absolute inset-y-0 left-0 rounded-[3px] transition-all duration-700 ease-out"
            style={{ width: `${clamped}%`, background: fill, margin: 2 }}
          />
        </div>
        <div
          className="rounded-r-[3px]"
          style={{
            width: nubWidth,
            height: nubHeight,
            background: 'rgb(var(--color-border))',
            marginLeft: 1,
          }}
        />
      </div>
      <div className="flex items-baseline gap-1.5 min-w-0">
        <span className={`font-num font-bold text-lg leading-none ${text}`}>{Math.round(clamped)}%</span>
        {label && <span className="text-xs text-muted truncate">{label}</span>}
      </div>
    </div>
  )
}
