/**
 * Deterministic South African Standard Time formatting.
 *
 * The portal formats every timestamp manually rather than through `Intl` so
 * that the server render, the browser render and every device timezone all
 * produce exactly the same string (no hydration mismatches).
 */

const SAST_OFFSET_MINUTES = 120
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

type Parts = {
  year: number
  month: number
  day: number
  hour: number
  minute: number
  weekday: number
}

function toSast(value: string | Date): Parts {
  const date = typeof value === 'string' ? new Date(value) : value
  const shifted = new Date(date.getTime() + SAST_OFFSET_MINUTES * 60_000)
  return {
    year: shifted.getUTCFullYear(),
    month: shifted.getUTCMonth(),
    day: shifted.getUTCDate(),
    hour: shifted.getUTCHours(),
    minute: shifted.getUTCMinutes(),
    weekday: shifted.getUTCDay(),
  }
}

const pad = (value: number) => String(value).padStart(2, '0')

/** `09:12` */
export function formatTime(value?: string | null): string {
  if (!value) return '—'
  const parts = toSast(value)
  return `${pad(parts.hour)}:${pad(parts.minute)}`
}

/** `10 Nov 2026` */
export function formatDate(value?: string | null): string {
  if (!value) return '—'
  const parts = toSast(value)
  return `${parts.day} ${MONTHS[parts.month]} ${parts.year}`
}

/** `10 Nov · 09:12` */
export function formatShort(value?: string | null): string {
  if (!value) return '—'
  const parts = toSast(value)
  return `${parts.day} ${MONTHS[parts.month]} · ${pad(parts.hour)}:${pad(parts.minute)}`
}

/** `Tue 10 Nov 2026 · 09:12 SAST` */
export function formatFull(value?: string | null): string {
  if (!value) return '—'
  const parts = toSast(value)
  return `${DAYS[parts.weekday]} ${parts.day} ${MONTHS[parts.month]} ${parts.year} · ${pad(parts.hour)}:${pad(parts.minute)} SAST`
}

/** Coarse, timezone-safe age label: `12m ago`, `5h ago`, `2d ago`. */
export function formatAge(value: string, now: number = Date.now()): string {
  const diff = Math.max(0, now - new Date(value).getTime())
  const minutes = Math.floor(diff / 60_000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  return `${Math.floor(days / 30)}mo ago`
}

/** `00:12:42` — used by the call overlay and duration columns. */
export function formatDuration(totalSeconds: number): string {
  const seconds = Math.max(0, Math.round(totalSeconds))
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  return h > 0 ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`
}

export function initialsOf(fullName: string): string {
  return fullName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}

export function titleCase(value: string): string {
  return value
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}
