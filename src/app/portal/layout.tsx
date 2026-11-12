import type { Metadata } from 'next'

import { PortalShell } from '@/components/shell/PortalShell'
import { requireUser } from '@/lib/auth'
import { dataSource, loadSnapshot, toPublicEmployee } from '@/lib/store'

export const metadata: Metadata = {
  title: {
    default: 'Operations Centre',
    template: '%s · REGEN Operations',
  },
}

export const dynamic = 'force-dynamic'

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser()
  const snapshot = await loadSnapshot()

  const awaiting = snapshot.reports.filter((report) =>
    ['reported', 'verified', 'assessed', 'awaiting-authorisation', 'authorised', 'in-progress'].includes(
      report.stage,
    ),
  ).length

  return (
    <PortalShell
      user={toPublicEmployee(user)}
      notifications={snapshot.notifications}
      dataSource={dataSource}
      maintenanceBadge={awaiting}
    >
      {children}
    </PortalShell>
  )
}
