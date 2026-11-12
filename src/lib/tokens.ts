/**
 * Brand design tokens.
 *
 * Colour language:
 *   Brand green  = good / active / primary action  (matches logo arc)
 *   Amber        = warning
 *   Red          = critical
 *   Slate        = offline / muted
 *
 * All colours sourced from the REGEN logo brand palette.
 */

export type SeverityTone = 'critical' | 'high' | 'medium' | 'low' | 'info'

export const STATUS_COLOURS = {
  normal:   { hex: '#5aad3f', label: 'Normal',   chip: 'bg-green-500/12  text-green-300  ring-green-500/30'  },
  warning:  { hex: '#fbbf24', label: 'Warning',  chip: 'bg-amber-500/12  text-amber-300  ring-amber-500/30'  },
  critical: { hex: '#f87171', label: 'Critical', chip: 'bg-red-500/12    text-red-300    ring-red-500/30'    },
  offline:  { hex: '#64748b', label: 'Offline',  chip: 'bg-slate-500/12  text-slate-300  ring-slate-500/30'  },
} as const

export const SEVERITY_COLOURS: Record<string, string> = {
  critical: 'bg-red-500/12    text-red-300    ring-red-500/30',
  high:     'bg-orange-500/12 text-orange-300 ring-orange-500/30',
  medium:   'bg-amber-500/12  text-amber-300  ring-amber-500/30',
  low:      'bg-green-500/12  text-green-300  ring-green-500/30',
}

export const STAGE_TONE: Record<string, string> = {
  'reported':                'bg-sky-500/12    text-sky-300    ring-sky-500/30',
  'verified':                'bg-indigo-500/12 text-indigo-300 ring-indigo-500/30',
  'assessed':                'bg-violet-500/12 text-violet-300 ring-violet-500/30',
  'awaiting-authorisation':  'bg-amber-500/12  text-amber-300  ring-amber-500/30',
  'authorised':              'bg-green-500/12  text-green-300  ring-green-500/30',
  'in-progress':             'bg-green-600/12  text-green-200  ring-green-600/30',
  'completed':               'bg-emerald-500/12 text-emerald-300 ring-emerald-500/30',
  'closed':                  'bg-slate-500/12  text-slate-300  ring-slate-500/30',
  'rejected':                'bg-red-500/12    text-red-300    ring-red-500/30',
}

export function statusTone(status: string): string {
  return STATUS_COLOURS[status as keyof typeof STATUS_COLOURS]?.chip ?? STATUS_COLOURS.offline.chip
}

export function severityTone(severity: string): string {
  return SEVERITY_COLOURS[severity] ?? SEVERITY_COLOURS.low
}
