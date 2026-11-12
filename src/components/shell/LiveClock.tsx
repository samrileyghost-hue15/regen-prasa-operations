'use client'

import { useEffect, useState } from 'react'

const pad = (value: number) => String(value).padStart(2, '0')

/** Ticking South African Standard Time clock for the control-room header. */
export function LiveClock({ className = '' }: { className?: string }) {
  const [now, setNow] = useState<Date | null>(null)

  useEffect(() => {
    setNow(new Date())
    const timer = window.setInterval(() => setNow(new Date()), 1000)
    return () => window.clearInterval(timer)
  }, [])

  if (!now) {
    return (
      <span className={`font-mono text-[12px] tabular-nums text-slate-300 ${className}`}>
        --:--:--
      </span>
    )
  }

  const sast = new Date(now.getTime() + 120 * 60_000)
  return (
    <span className={`inline-flex items-baseline gap-1.5 font-mono tabular-nums ${className}`}>
      <span className="text-[13px] font-semibold text-slate-100">
        {pad(sast.getUTCHours())}:{pad(sast.getUTCMinutes())}
        <span className="text-slate-500">:{pad(sast.getUTCSeconds())}</span>
      </span>
      <span className="text-[9px] font-bold uppercase tracking-[0.12em] text-slate-500">SAST</span>
    </span>
  )
}
