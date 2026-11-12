'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { AlertTriangle, ArrowLeft, RotateCcw } from 'lucide-react'

/**
 * Portal error boundary — catches errors thrown within any portal page
 * (server components that call loadSnapshot(), transitionReport(), etc).
 * This is narrower than the root boundary: it renders inside the portal
 * shell so navigation remains available.
 */
export default function PortalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Portal error:', error)
  }, [error])

  const isSupabase = error.message.includes('Supabase') || error.message.includes('supabase')
  const isPermission = error.message.includes('permission') || error.message.includes('RLS')

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-5 py-16 text-center">
      <span className="grid mx-auto h-10 w-10 place-items-center rounded-full bg-red-500/12 text-red-300 ring-1 ring-inset ring-red-500/25">
        <AlertTriangle className="h-5 w-5" aria-hidden />
      </span>

      <p className="mt-4 font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-red-300">
        {isSupabase ? 'Database error' : isPermission ? 'Access denied' : 'Page error'}
      </p>

      <h2 className="mt-2 text-xl font-bold tracking-tight text-white">
        {isSupabase
          ? 'Could not load data from Supabase'
          : isPermission
            ? 'Your role cannot access this resource'
            : 'This page ran into a problem'}
      </h2>

      <p className="mt-2 max-w-md text-[12px] leading-relaxed text-slate-400">
        {isSupabase
          ? 'The connection to the REGEN database failed. This is usually temporary.'
          : error.message || 'An unexpected error occurred.'}
      </p>

      {error.digest && (
        <p className="mt-2 font-mono text-[9px] text-slate-600">Ref: {error.digest}</p>
      )}

      <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
        <button onClick={reset} className="btn btn-primary">
          <RotateCcw className="h-3.5 w-3.5" aria-hidden />
          Retry
        </button>
        <Link href="/portal" className="btn btn-ghost">
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
          Operations Centre
        </Link>
      </div>
    </div>
  )
}
