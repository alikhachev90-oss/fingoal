export function Card({ children, className = '', animate = true, ...rest }) {
  return (
    <div
      className={`bg-surface border border-border rounded-2.5xl p-4 shadow-softer ${animate ? 'animate-slide-up' : ''} ${className}`}
      {...rest}
    >
      {children}
    </div>
  )
}

export function Button({ children, variant = 'primary', className = '', icon: Icon, ...props }) {
  const base =
    'w-full py-3 rounded-xl font-semibold text-[15px] transition-all duration-150 active:scale-[0.97] disabled:opacity-40 disabled:active:scale-100 flex items-center justify-center gap-2'
  const variants = {
    primary: 'bg-primary text-onprimary shadow-softer hover:brightness-110',
    secondary: 'bg-surface2 text-text border border-border hover:border-primary/50',
    ghost: 'bg-transparent text-muted hover:text-text',
    danger: 'bg-danger/10 text-danger hover:bg-danger/15',
  }
  return (
    <button className={`${base} ${variants[variant]} ${className}`} {...props}>
      {Icon && <Icon size={17} strokeWidth={2.25} />}
      {children}
    </button>
  )
}

export function IconButton({ icon: Icon, className = '', ...props }) {
  return (
    <button
      className={`w-9 h-9 rounded-full bg-surface2 border border-border flex items-center justify-center transition active:scale-95 hover:border-primary/50 ${className}`}
      {...props}
    >
      <Icon size={16} strokeWidth={2.25} />
    </button>
  )
}

export function Input({ label, icon: Icon, className = '', ...props }) {
  return (
    <label className="block text-left">
      {label && <span className="block text-xs font-medium text-muted mb-1.5 tracking-wide">{label}</span>}
      <div className="relative">
        {Icon && <Icon size={16} strokeWidth={2.25} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />}
        <input
          className={`w-full bg-surface2 border border-border rounded-lg px-3 ${Icon ? 'pl-9' : ''} py-2.5 text-[15px] font-num text-text outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary/40 placeholder:text-muted/60 placeholder:font-sans ${className}`}
          {...props}
        />
      </div>
    </label>
  )
}

export function ProgressBar({ pct, colorClass = 'bg-primary', height = 'h-2' }) {
  return (
    <div className={`w-full ${height} rounded-full bg-surface2 overflow-hidden`}>
      <div
        className={`h-full ${colorClass} transition-all duration-700 ease-out rounded-full`}
        style={{ width: `${Math.min(100, Math.max(2, pct))}%` }}
      />
    </div>
  )
}

export function Pill({ children, className = '' }) {
  return <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full font-num ${className}`}>{children}</span>
}

export function IconCircle({ icon: Icon, className = '', size = 40, iconSize = 18 }) {
  return (
    <div
      className={`flex items-center justify-center rounded-xl shrink-0 ${className}`}
      style={{ width: size, height: size }}
    >
      <Icon size={iconSize} strokeWidth={2.25} />
    </div>
  )
}

export function SectionTitle({ children, action }) {
  return (
    <div className="flex items-center justify-between mb-1">
      <h2 className="text-[13px] font-bold tracking-wide text-muted uppercase">{children}</h2>
      {action}
    </div>
  )
}

export function StatTile({ label, value, valueClassName = '', icon: Icon, iconClassName = 'bg-primary/10 text-primary' }) {
  return (
    <Card className="!p-3.5 space-y-2 border-t-2 !border-t-border">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted font-medium">{label}</p>
        {Icon && <IconCircle icon={Icon} size={26} iconSize={13} className={iconClassName} />}
      </div>
      <p className={`text-lg font-bold font-num ${valueClassName}`}>{value}</p>
    </Card>
  )
}

export function EmptyState({ icon: Icon, title, subtitle, action }) {
  return (
    <div className="flex flex-col items-center text-center py-10 px-4 gap-3">
      {Icon && (
        <div className="w-14 h-14 rounded-full bg-surface2 flex items-center justify-center">
          <Icon size={24} strokeWidth={2} className="text-muted" />
        </div>
      )}
      <div className="space-y-1">
        <p className="font-semibold font-display text-lg">{title}</p>
        {subtitle && <p className="text-sm text-muted max-w-[26ch] mx-auto">{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}
