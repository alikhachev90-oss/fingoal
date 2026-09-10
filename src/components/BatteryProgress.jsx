export default function BatteryProgress({ pct, label }) {
  const value = Number.isFinite(pct) ? Math.min(100, Math.max(0, pct)) : 0
  const circumference = 2 * Math.PI * 25
  return (
    <div className="flex items-center gap-4 py-2">
      <div className="relative w-16 h-16 shrink-0" role="progressbar" aria-valuenow={Math.round(value)} aria-valuemin={0} aria-valuemax={100} aria-label={label}>
        <svg viewBox="0 0 64 64" className="w-full h-full -rotate-90" aria-hidden="true">
          <circle cx="32" cy="32" r="25" fill="none" stroke="rgb(255 255 255 / .08)" strokeWidth="4" />
          <circle cx="32" cy="32" r="25" fill="none" stroke="rgb(var(--color-primary))" strokeWidth="4" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={circumference * (1 - value / 100)} />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center font-num text-sm font-medium">{Math.round(value)}%</span>
      </div>
      {label && <p className="text-sm text-white/80 leading-relaxed font-num">{label}</p>}
    </div>
  )
}
