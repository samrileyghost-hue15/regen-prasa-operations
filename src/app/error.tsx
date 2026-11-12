'use client'

import { useEffect } from 'react'
import { AlertTriangle, RotateCcw } from 'lucide-react'

/**
 * Root error boundary — catches errors thrown by any server or client
 * component in the app router. The most common trigger in production is
 * a Supabase connection failure (network issue, database restart, RLS
 * policy change), which surfaces as a thrown Error from `loadSnapshot()`.
 *
 * This boundary renders instead of a blank page so the operator sees what
 * happened and can retry without leaving the app.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log to the server-side error monitoring (replace with Sentry/Datadog
    // in production). For now, console.error is the baseline.
    console.error('REGEN portal error:', error)
  }, [error])

  const isSupabaseError = error.message.includes('Supabase')

  return (
    <main className="grid min-h-dvh place-items-center bg-navy-950 px-5 py-10">
      <div className="w-full max-w-lg text-center">
        <span className="grid mx-auto h-12 w-12 place-items-center rounded-full bg-red-500/12 text-red-300 ring-1 ring-inset ring-red-500/25">
          <AlertTriangle className="h-6 w-6" aria-hidden />
        </span>

        <p className="mt-5 font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-red-300">
          {isSupabaseError ? 'Database connection error' : 'Something went wrong'}
        </p>

        <h1 className="mt-3 text-2xl font-bold tracking-tight text-white sm:text-3xl">
          {isSupabaseError
            ? 'Cannot reach the REGEN database'
            : 'The operations portal hit an unexpected error'}
        </h1>

        <p className="mt-2.5 text-[12px] leading-relaxed text-slate-400">
          {isSupabaseError
            ? 'The platform could not load data from Supabase. This is usually temporary — the database may be restarting or experiencing a brief network interruption. Try again in a moment.'
            : error.message || 'An unexpected error occurred while rendering this page.'}
        </p>

        {error.digest && (
          <p className="mt-2 font-mono text-[9.5px] text-slate-600">
            Error reference: {error.digest}
          </p>
        )}

        <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
          <button
            onClick={reset}
            className="btn btn-primary"
          >
            <RotateCcw className="h-3.5 w-3.5" aria-hidden />
            Try again
          </button>
          <a href="/" className="btn btn-ghost">
            Return to sign in
          </a>
        </div>

        <p className="mt-6 text-[10px] leading-relaxed text-slate-600">
          If this error persists, contact REGEN technical support. All actions up to the error
          were safely recorded in the audit log.
        </p>
      </div>
    </main>
  )
}
