import type { Metadata } from 'next'

import { NetworkWorkspace } from '@/components/network/NetworkWorkspace'
import { Chip, DataSourceNote, PageHeading } from '@/components/ui/primitives'
import { requireUser } from '@/lib/auth'
import { movementsFor } from '@/lib/insights'
import { dataSource, loadSnapshot } from '@/lib/store'
import { STATUS_COLOURS } from '@/lib/tokens'

export const metadata: Metadata = { title: 'Railway network' }
export const dynamic = 'force-dynamic'

export default async function NetworkPage({
  searchParams,
}: {
  searchParams: Promise<{ section?: string }>
}) {
  await requireUser()
  const { section } = await searchParams
  const snapshot = await loadSnapshot()

  const movements = movementsFor(snapshot, { hours: 24 })
  const critical = snapshot.segments.filter((segment) => segment.status === 'critical').length
  const warning = snapshot.segments.filter((segment) => segment.status === 'warning').length

  return (
    <div className="space-y-4 sm:space-y-5">
      <PageHeading
        eyebrow="Interactive railway visualisation"
        title="Gauteng network map"
        description="Live condition of every monitored section, the sensor that watches it and the maintenance work raised against it. Select a section on the schematic or in the register."
        actions={
          <>
            <Chip tone={STATUS_COLOURS.critical.chip} dot>
              {critical} critical
            </Chip>
            <Chip tone={STATUS_COLOURS.warning.chip} dot>
              {warning} warning
            </Chip>
            <div className="hidden items-center rounded-lg border border-white/10 bg-navy-925 px-3 py-1.5 sm:flex">
              <DataSourceNote source={dataSource} />
            </div>
          </>
        }
      />

      <NetworkWorkspace
        segments={snapshot.segments}
        nodes={snapshot.nodes}
        trains={snapshot.trains}
        sensors={snapshot.sensors}
        alerts={snapshot.alerts}
        reports={snapshot.reports}
        assessments={snapshot.assessments}
        telemetry={snapshot.telemetry}
        movements={movements}
        initialSection={section}
      />
    </div>
  )
}
