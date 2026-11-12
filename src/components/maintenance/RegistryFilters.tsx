'use client'

import { useEffect, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { Search, X } from 'lucide-react'

import type { Department } from '@/lib/types'

export function RegistryFilters({ departments }: { departments: Department[] }) {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()

  const [search, setSearch] = useState(params.get('q') ?? '')
  const department = params.get('dept') ?? 'all'
  const stage = params.get('stage') ?? 'all'

  useEffect(() => {
    setSearch(params.get('q') ?? '')
  }, [params])

  const push = (next: Record<string, string | null>) => {
    const query = new URLSearchParams(params.toString())
    for (const [key, value] of Object.entries(next)) {
      if (!value || value === 'all') query.delete(key)
      else query.set(key, value)
    }
    const suffix = query.toString()
    router.push(suffix ? `${pathname}?${suffix}` : pathname)
  }

  const hasFilters = Boolean(params.get('q') || params.get('dept') || params.get('stage'))

  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-white/8 px-3 py-2.5 sm:px-4">
      <form
        className="relative"
        onSubmit={(event) => {
          event.preventDefault()
          push({ q: search || null })
        }}
      >
        <Search className="pointer-events-none absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-slate-500" aria-hidden />
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search reference or defect"
          aria-label="Search maintenance reports"
          className="w-48 rounded-md border border-white/10 bg-navy-925 py-1.5 pl-7 pr-2 text-[10.5px] text-slate-200 outline-none placeholder:text-slate-600 focus:border-green-500/40 focus:ring-1 focus:ring-green-500/30"
        />
      </form>

      <select
        aria-label="Filter by department"
        value={department}
        onChange={(event) => push({ dept: event.target.value })}
        className="rounded-md border border-white/10 bg-navy-925 px-2 py-1.5 text-[10.5px] text-slate-200 outline-none focus:border-green-500/40 focus:ring-1 focus:ring-green-500/30"
      >
        <option value="all">All departments</option>
        {departments.map((row) => (
          <option key={row.id} value={row.slug}>
            {row.name}
          </option>
        ))}
      </select>

      {stage !== 'all' && (
        <span className="rounded-md bg-green-500/12 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.05em] text-green-400">
          {stage.replace(/-/g, ' ')}
        </span>
      )}

      {hasFilters && (
        <button
          type="button"
          onClick={() => router.push(pathname)}
          className="inline-flex items-center gap-1 rounded-md border border-white/10 px-2 py-1.5 text-[10px] font-semibold text-slate-400 hover:text-slate-200"
        >
          <X className="h-3 w-3" aria-hidden />
          Clear
        </button>
      )}
    </div>
  )
}

