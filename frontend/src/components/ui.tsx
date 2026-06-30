import type { ReactNode } from 'react'

export function Panel({
  children,
  className = '',
  label,
  right,
}: {
  children: ReactNode
  className?: string
  label?: string
  right?: ReactNode
}) {
  return (
    <section className={`panel p-4 ${className}`}>
      {label && (
        <header className="mb-3 flex items-center justify-between">
          <h3 className="panel-label">{label}</h3>
          {right}
        </header>
      )}
      {children}
    </section>
  )
}

export function Stat({
  label,
  value,
  sub,
  tone = 'text',
}: {
  label: string
  value: ReactNode
  sub?: ReactNode
  tone?: 'text' | 'red' | 'green' | 'amber' | 'cyan'
}) {
  const color = {
    text: 'text-pit-text',
    red: 'text-pit-red',
    green: 'text-pit-green',
    amber: 'text-pit-amber',
    cyan: 'text-pit-cyan',
  }[tone]
  return (
    <div>
      <div className="panel-label">{label}</div>
      <div className={`mono text-2xl font-semibold ${color}`}>{value}</div>
      {sub && <div className="mono text-xs text-pit-muted">{sub}</div>}
    </div>
  )
}

export function Pill({
  children,
  tone = 'muted',
}: {
  children: ReactNode
  tone?: 'muted' | 'red' | 'green' | 'amber' | 'cyan' | 'purple'
}) {
  const map = {
    muted: 'bg-pit-line/60 text-pit-muted',
    red: 'bg-pit-red/15 text-pit-red border border-pit-red/30',
    green: 'bg-pit-green/15 text-pit-green border border-pit-green/30',
    amber: 'bg-pit-amber/15 text-pit-amber border border-pit-amber/30',
    cyan: 'bg-pit-cyan/15 text-pit-cyan border border-pit-cyan/30',
    purple: 'bg-pit-purple/15 text-pit-purple border border-pit-purple/30',
  }[tone]
  return (
    <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-semibold ${map}`}>
      {children}
    </span>
  )
}

export function Confidence({ value }: { value: number }) {
  const tone = value >= 70 ? 'text-pit-green' : value >= 50 ? 'text-pit-amber' : 'text-pit-red'
  const bar = value >= 70 ? 'bg-pit-green' : value >= 50 ? 'bg-pit-amber' : 'bg-pit-red'
  return (
    <div className="w-full">
      <div className="mb-1 flex items-center justify-between">
        <span className="panel-label">AI Confidence</span>
        <span className={`mono text-sm font-bold ${tone}`}>{value}%</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-pit-line">
        <div className={`h-full rounded-full ${bar}`} style={{ width: `${value}%` }} />
      </div>
    </div>
  )
}
