import type { LucideIcon } from 'lucide-react'
import { Inbox } from 'lucide-react'

import { STAGE_LABEL } from '@/lib/permissions'
import { STATUS_COLOURS, STAGE_TONE, severityTone, statusTone } from '@/lib/tokens'
import type { DataSource, SegmentStatus } from '@/lib/types'

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ Surfaces â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

export function Panel({
  children,
  className = '',
  as: Tag = 'section',
}: {
  children: React.ReactNode
  className?: string
  as?: 'section' | 'div' | 'article' | 'aside'
}) {
  return <Tag className={`panel ${className}`}>{children}</Tag>
}

export function PanelHeader({
  eyebrow,
  title,
  description,
  action,
  className = '',
}: {
  eyebrow?: string
  title: string
  description?: string
  action?: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={`flex flex-wrap items-start justify-between gap-3 border-b border-white/8 px-4 py-3.5 sm:px-5 ${className}`}
    >
      <div className="min-w-0">
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h2 className="mt-1 truncate text-[13px] font-bold tracking-tight text-slate-100 sm:text-sm">
          {title}
        </h2>
        {description && <p className="mt-1 text-[11px] leading-snug text-slate-400">{description}</p>}
      </div>
      {action && <div className="flex flex-none items-center gap-2">{action}</div>}
    </div>
  )
}

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ Chips â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

export function Chip({
  children,
  tone = 'bg-slate-500/12 text-slate-300 ring-slate-500/30',
  dot = false,
  className = '',
}: {
  children: React.ReactNode
  tone?: string
  dot?: boolean
  className?: string
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.06em] ring-1 ring-inset ${tone} ${className}`}
    >
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current" />}
      {children}
    </span>
  )
}

export function StatusChip({ status }: { status: SegmentStatus | string }) {
  const meta = STATUS_COLOURS[status as SegmentStatus] ?? STATUS_COLOURS.offline
  return (
    <Chip tone={meta.chip} dot>
      {meta.label}
    </Chip>
  )
}

export function SeverityChip({ severity }: { severity: string }) {
  return <Chip tone={severityTone(severity)}>{severity}</Chip>
}

export function StageChip({ stage }: { stage: string }) {
  return <Chip tone={STAGE_TONE[stage] ?? STAGE_TONE.closed}>{STAGE_LABEL[stage as never] ?? stage}</Chip>
}

export function LiveBadge({ live, label }: { live: boolean; label?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.06em] ring-1 ring-inset ${
        live
          ? 'bg-emerald-500/10 text-emerald-300 ring-emerald-500/30'
          : 'bg-amber-500/10 text-amber-300 ring-amber-500/30'
      }`}
      title={live ? 'Reading produced by the physical sensor channel' : 'Generated value â€” not a physical sensor reading'}
    >
      <span className={`h-1.5 w-1.5 rounded-full bg-current ${live ? 'pulse-dot' : ''}`} />
      {label ?? (live ? 'Device' : 'Simulated')}
    </span>
  )
}

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ Stats â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

export function Stat({
  label,
  value,
  detail,
  icon: Icon,
  tone = 'text-slate-100',
  accent = 'text-sky-300',
  href,
}: {
  label: string
  value: React.ReactNode
  detail?: string
  icon?: LucideIcon
  tone?: string
  accent?: string
  href?: string
}) {
  const content = (
    <>
      <div className="flex items-start justify-between gap-2">
        <span className={`eyebrow ${accent}`}>{label}</span>
        {Icon && <Icon className="h-3.5 w-3.5 flex-none text-slate-500" aria-hidden />}
      </div>
      <div className={`mt-2.5 font-mono text-[22px] font-bold leading-none tracking-tight ${tone}`}>
        {value}
      </div>
      {detail && <p className="mt-1.5 truncate text-[10.5px] text-slate-500">{detail}</p>}
    </>
  )

  if (href) {
    return (
      <a
        href={href}
        className="panel group block p-3.5 transition-colors hover:border-green-500/30 hover:bg-navy-850"
      >
        {content}
      </a>
    )
  }
  return <div className="panel p-3.5">{content}</div>
}

export function Meter({
  value,
  tone = 'bg-emerald-400',
  label,
  suffix = '',
}: {
  value: number
  tone?: string
  label?: string
  suffix?: string
}) {
  const clamped = Math.max(0, Math.min(100, value))
  return (
    <div>
      {label && (
        <div className="mb-1 flex items-baseline justify-between text-[10px] text-slate-400">
          <span>{label}</span>
          <span className="font-mono font-semibold text-slate-200">
            {Math.round(value)}
            {suffix}
          </span>
        </div>
      )}
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/8">
        <div className={`h-full rounded-full ${tone}`} style={{ width: `${clamped}%` }} />
      </div>
    </div>
  )
}

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ Headings â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

export function PageHeading({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow: string
  title: string
  description: string
  actions?: React.ReactNode
}) {
  return (
    <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <p className="eyebrow">{eyebrow}</p>
        <h1 className="mt-1.5 text-xl font-bold tracking-tight text-white sm:text-2xl">{title}</h1>
        <p className="mt-1 max-w-2xl text-[12px] leading-relaxed text-slate-400">{description}</p>
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </header>
  )
}

export function EmptyState({
  title,
  description,
  icon: Icon = Inbox,
  action,
}: {
  title: string
  description?: string
  icon?: LucideIcon
  action?: React.ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-6 py-10 text-center">
      <span className="grid h-9 w-9 place-items-center rounded-full bg-white/5 text-slate-400">
        <Icon className="h-4 w-4" aria-hidden />
      </span>
      <p className="text-[12px] font-semibold text-slate-300">{title}</p>
      {description && <p className="max-w-sm text-[11px] leading-relaxed text-slate-500">{description}</p>}
      {action}
    </div>
  )
}

export function KeyValue({ items }: { items: { label: string; value: React.ReactNode }[] }) {
  return (
    <dl className="divide-y divide-white/6">
      {items.map((item) => (
        <div key={item.label} className="flex items-start justify-between gap-4 py-2.5">
          <dt className="text-[11px] text-slate-500">{item.label}</dt>
          <dd className="text-right text-[11.5px] font-semibold text-slate-200">{item.value}</dd>
        </div>
      ))}
    </dl>
  )
}

export function DataSourceNote({
  source,
  className = '',
}: {
  source: DataSource
  className?: string
}) {
  if (source === 'supabase') {
    return (
      <span
        className={`inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-emerald-400 ${className}`}
      >
        <span className="pulse-dot h-1.5 w-1.5 rounded-full bg-emerald-400" />
        Supabase live
      </span>
    )
  }
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-amber-400 ${className}`}
      title="NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are not configured, so the bundled demonstration dataset is being used."
    >
      <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
      Demo dataset
    </span>
  )
}

export function Divider({ className = '' }: { className?: string }) {
  return <div className={`h-px w-full bg-white/8 ${className}`} />
}

