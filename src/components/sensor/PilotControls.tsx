'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, RefreshCw, Signal } from 'lucide-react'

import { injectReadingAction } from '@/app/portal/actions'

/**
 * Operator control for the pilot device. Injects a clearly-labelled simulated
 * reading so the difference between device data and simulated data stays
 * visible on screen.
 */
export function PilotControls({ sensorId, canSimulate }: { sensorId: string; canSimulate: boolean }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  const run = (task: () => void) => {
    startTransition(() => {
      void (async () => {
        await task()
        router.refresh()
      })()
    })
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={() => run(() => router.refresh())}
        className="btn btn-ghost"
        disabled={pending}
      >
        {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden /> : <RefreshCw className="h-3.5 w-3.5" aria-hidden />}
        Refresh feed
      </button>

      {canSimulate && (
        <button
          type="button"
          onClick={() =>
            run(async () => {
              await injectReadingAction(sensorId)
            })
          }
          className="btn btn-primary"
          disabled={pending}
          title="Writes a clearly-labelled simulated reading to the telemetry table"
        >
          <Signal className="h-3.5 w-3.5" aria-hidden />
          Inject simulated reading
        </button>
      )}
    </div>
  )
}
