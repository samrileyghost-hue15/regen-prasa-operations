import type { Metadata } from 'next'
import { ArrowDown, ArrowUp, Radio, TrainFront, TriangleAlert } from 'lucide-react'

import { MovementRegister } from '@/components/movements/MovementRegister'
import { Chip, DataSourceNote, PageHeading } from '@/components/ui/primitives'
import { requireUser } from '@/lib/auth'
import { formatAge } from '@/lib/format'
import { operationalNow } from '@/lib/insights'
import { can } from '@/lib/permissions'
import { dataSource, loadSnapshot } from '@/lib/store'

export const metadata: Metadata = { title: 'Train movements' }
export const dynamic = 'force-dynamic'

export default async function MovementsPage() {
  const user = await requireUser()
  const snapshot = await loadSnapshot()
  const now = operationalNow(snapshot)

  const movements = [...snapshot.movements].sort((a, b) => (a.detectedAt < b.detectedAt ? 1 : -1))
  const last24h = movements.filter((movement) => now - new Date(movement.detectedAt).getTime() <= 24 * 3_600_000)
  const latest = movements[0]
  const underReview = movements.filter(
    (movement) => movement.reviewStatus !== 'normal' && now - new Date(movement.detectedAt).getTime() <= 24 * 3_600_000,
  ).length
  const upCount = last24h.filter((movement) => movement.direction === 'up').length
  const sensorDetected = last24h.filter((movement) => movement.sourceKind === 'sensor').length

  return (
    <div className="space-y-4 sm:space-y-5">
      <PageHeading
        eyebrow="Movement monitoring"
        title="Train movement register"
        description="Whenever an authorised sensor or connected system detects a train, the event, timestamp, section, direction and detection source are recorded and the Operational Centre is notified."
        actions={
          <div className="hidden items-center rounded-lg border border-white/10 bg-navy-925 px-3 py-1.5 sm:flex">
            <DataSourceNote source={dataSource} />
          </div>
        }
      />

      <div className="grid grid-cols-2 gap-2.5 xl:grid-cols-4">
        <div className="panel p-3.5">
          <div className="flex items-start justify-between">
            <p className="eyebrow text-sky-300">Movements Â· 24h</p>
            <TrainFront className="h-3.5 w-3.5 text-slate-500" aria-hidden />
          </div>
          <p className="mt-2.5 font-mono text-[22px] font-bold leading-none text-slate-100">{last24h.length}</p>
          <p className="mt-1.5 text-[10.5px] text-slate-500">{movements.length} in the full register</p>
        </div>
        <div className="panel p-3.5">
          <div className="flex items-start justify-between">
            <p className="eyebrow text-green-400">Sensor-detected</p>
            <Radio className="h-3.5 w-3.5 text-slate-500" aria-hidden />
          </div>
          <p className="mt-2.5 font-mono text-[22px] font-bold leading-none text-slate-100">{sensorDetected}</p>
          <p className="mt-1.5 text-[10.5px] text-slate-500">Automatic edge-unit events</p>
        </div>
        <div className="panel p-3.5">
          <div className="flex items-start justify-between">
            <p className="eyebrow text-violet-300">Direction split</p>
            <ArrowUp className="h-3.5 w-3.5 text-slate-500" aria-hidden />
          </div>
          <p className="mt-2.5 flex items-baseline gap-1 font-mono text-[22px] font-bold leading-none text-slate-100">
            {upCount}
            <span className="text-slate-600">/</span>
            {last24h.length - upCount}
          </p>
          <p className="mt-1.5 flex items-center gap-2 text-[10.5px] text-slate-500">
            <span className="inline-flex items-center gap-1">
              <ArrowUp className="h-2.5 w-2.5 text-sky-300" aria-hidden /> up
            </span>
            <span className="inline-flex items-center gap-1">
              <ArrowDown className="h-2.5 w-2.5 text-violet-300" aria-hidden /> down
            </span>
          </p>
        </div>
        <div className="panel p-3.5">
          <div className="flex items-start justify-between">
            <p className="eyebrow text-amber-300">Needs review</p>
            <TriangleAlert className="h-3.5 w-3.5 text-slate-500" aria-hidden />
          </div>
          <p className={`mt-2.5 font-mono text-[22px] font-bold leading-none ${underReview > 0 ? 'text-amber-300' : 'text-slate-100'}`}>
            {underReview}
          </p>
          <p className="mt-1.5 text-[10.5px] text-slate-500">
            {latest ? `Last event ${formatAge(latest.detectedAt, now)}` : 'No events'}
          </p>
        </div>
      </div>

      <MovementRegister
        movements={movements}
        segments={snapshot.segments}
        now={now}
        canLog={can.logMovement(user)}
      />

      <div className="flex flex-wrap items-center gap-2 rounded-lg border border-white/8 bg-navy-925/50 px-3.5 py-2.5">
        <Chip tone="bg-green-500/10 text-green-400 ring-green-500/25" dot>
          Operational Centre notified
        </Chip>
        <p className="text-[10.5px] leading-relaxed text-slate-500">
          Sensor events are written to the events channel, promoted to the movement register, and pushed to the
          Operational Centre notification feed before any automated assessment runs.
        </p>
      </div>
    </div>
  )
}

