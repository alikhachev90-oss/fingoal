export function Card({ children, className = '', animate = true, ...rest }) {
  return (
    <div
      className={`glass rounded-3xl p-[18px] shadow-glass ${animate ? 'animate-slide-up' : ''} ${className}`}
      {...rest}
    >
      {children}
    </div>
  )
}

export function Button({ children, variant = 'primary', className = '', icon: Icon, ...props }) {
  const base = 'w-full min-h-12 py-3.5 px-4 rounded-2xl font-semibold text-[15px] transition-all duration-200 active:scale-[0.98] disabled:opacity-40 disabled:active:scale-100 flex items-center justify-center gap-2'
  const variants = {
    primary: 'bg-gradient-to-b from-[#f2c978] to-[#c99543] text-[#19140d] shadow-[0_14px_30px_-14px_rgb(var(--color-primary)/0.9),0_1px_0_rgb(255_255_255/0.35)_inset] hover:brightness-105',
    secondary: 'glass text-text hover:border-primary/50',
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
      className={`w-10 h-10 rounded-full glass flex items-center justify-center transition-all duration-200 active:scale-95 hover:border-primary/50 ${className}`}
      {...props}
    >
      <Icon size={17} strokeWidth={2.1} />
    </button>
  )
}

export function Input({ label, icon: Icon, className = '', ...props }) {
  return (
    <label className="block text-left">
      {label && <span className="block text-xs font-medium text-muted mb-1.5 tracking-wide">{label}</span>}
      <div className="relative">
        {Icon && <Icon size={16} strokeWidth={2.25} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />}
        <input
          className={`w-full bg-surface2 border border-border rounded-2xl px-4 ${Icon ? 'pl-10' : ''} py-3.5 text-[15px] font-num text-text outline-none transition-all focus:border-primary/70 focus:ring-1 focus:ring-primary/30 placeholder:text-muted/60 placeholder:font-sans ${className}`}
          {...props}
        />
      </div>
    </label>
  )
}

export function ProgressBar({ pct, colorClass = 'bg-primary', height = 'h-2' }) {
  return (
    <div className={`w-full ${height} rounded-full bg-white/8 overflow-hidden`}>
      <div className={`h-full ${colorClass} transition-all duration-700 ease-out rounded-full`} style={{ width: `${Math.min(100, Math.max(2, pct))}%` }} />
    </div>
  )
}

export function Pill({ children, className = '' }) {
  return <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full font-num ${className}`}>{children}</span>
}

export function IconCircle({ icon: Icon, className = '', size = 40, iconSize = 18 }) {
  return (
    <div className={`flex items-center justify-center rounded-2xl shrink-0 border border-white/10 ${className}`} style={{ width: size, height: size }}>
      <Icon size={iconSize} strokeWidth={2.15} />
    </div>
  )
}

export function SectionTitle({ children, action }) {
  return (
    <div className="flex items-center justify-between mb-2 px-1">
      <h2 className="section-label">{children}</h2>
      {action}
    </div>
  )
}

export function StatTile({ label, value, valueClassName = '', icon: Icon, iconClassName = 'bg-primary/10 text-primary' }) {
  return (
    <Card className="!p-4 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[11px] text-muted font-medium uppercase tracking-wide">{label}</p>
        {Icon && <IconCircle icon={Icon} size={32} iconSize={15} className={iconClassName} />}
      </div>
      <p className={`text-[24px] leading-none font-semibold font-num tracking-tight ${valueClassName}`}>{value}</p>
    </Card>
  )
}

export function EmptyState({ icon: Icon, title, subtitle, action }) {
  return (
    <div className="flex flex-col items-center text-center py-14 px-4 gap-4">
      {Icon && <div className="w-16 h-16 rounded-full glass flex items-center justify-center"><Icon size={25} strokeWidth={1.8} className="text-primary" /></div>}
      <div className="space-y-1.5"><p className="font-semibold font-display text-xl">{title}</p>{subtitle && <p className="text-sm text-muted max-w-[30ch] mx-auto leading-relaxed">{subtitle}</p>}</div>
      {action}
    </div>
  )
}
