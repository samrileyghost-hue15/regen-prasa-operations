import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, ClipboardCheck, Filter, ShieldCheck, Wrench } from 'lucide-react'

import { RegistryFilters } from '@/components/maintenance/RegistryFilters'
import { ReportIntake } from '@/components/maintenance/ReportIntake'
import {
  Chip,
  DataSourceNote,
  EmptyState,
  PageHeading,
  Panel,
  PanelHeader,
  SeverityChip,
  StageChip,
} from '@/components/ui/primitives'
import { requireUser } from '@/lib/auth'
import { formatAge, formatShort, titleCase } from '@/lib/format'
import { OPEN_STAGES, operationalNow, reportsFor } from '@/lib/insights'
import { ROLE_LABEL, STAGE_LABEL, STAGE_ORDER, STAGE_OWNER, can } from '@/lib/permissions'
import { dataSource, loadSnapshot } from '@/lib/store'
import { STATUS_COLOURS } from '@/lib/tokens'
import type { WorkflowStage } from '@/lib/types'

export const metadata: Metadata = { title: 'Maintenance' }
export const dynamic = 'force-dynamic'

function isStage(value: string | undefined): value is WorkflowStage {
  return Boolean(value) && (STAGE_ORDER as string[]).concat('rejected').includes(value as string)
}

export default async function MaintenancePage({
  searchParams,
}: {
  searchParams: Promise<{ stage?: string; dept?: string; q?: string }>
}) {
  const user = await requireUser()
  const { stage, dept, q } = await searchParams
  const snapshot = await loadSnapshot()
  const now = operationalNow(snapshot)

  const reports = reportsFor(snapshot, {
    stage: isStage(stage) ? stage : undefined,
    departmentSlug: dept,
    search: q,
  })

  const stageCounts = [...STAGE_ORDER, 'rejected' as WorkflowStage].map((key) => ({
    stage: key,
    count: snapshot.reports.filter((report) => report.stage === key).length,
  }))

  const awaiting = snapshot.reports.filter((report) => report.stage === 'awaiting-authorisation')
  const openReports = snapshot.reports.filter((report) => OPEN_STAGES.includes(report.stage))
  const overdue = openReports.filter((report) => {
    if (!report.dueAt) return false
    return new Date(report.dueAt).getTime() < now && report.stage !== 'completed'
  })
  const employeeById = new Map(snapshot.employees.map((employee) => [employee.id, employee]))
  const segmentById = new Map(snapshot.segments.map((segment) => [segment.id, segment]))

  const reporterDepartments = snapshot.departments.filter((department) => department.parentSlug !== null)

  return (
    <div className="space-y-4 sm:space-y-5">
      <PageHeading
        eyebrow="Maintenance authorisation"
        title="Maintenance registry"
        description="Field report â†’ department verification â†’ REGEN technical assessment â†’ Head of Operations authorisation â†’ work order â†’ completion evidence â†’ verified outcome."
        actions={
          <>
            <Chip tone="bg-green-500/12 text-green-400 ring-green-500/30">
              {openReports.length} open
            </Chip>
            <Chip tone="bg-amber-500/12 text-amber-300 ring-amber-500/30">
              {awaiting.length} awaiting authorisation
            </Chip>
            <div className="hidden items-center rounded-lg border border-white/10 bg-navy-925 px-3 py-1.5 sm:flex">
              <DataSourceNote source={dataSource} />
            </div>
          </>
        }
      />

      {awaiting.length > 0 && (
        <Panel className="border-amber-400/25 bg-amber-500/4">
          <PanelHeader
            eyebrow="Authorisation queue"
            title="Awaiting Mr Nicol Â· Head of Operations, PRASA"
            description="REGEN technical assessment is complete. Each work order needs an authorisation decision before the maintenance team can be tasked."
            action={
              <Link href="/portal/maintenance?stage=awaiting-authorisation" className="btn btn-primary">
                <ShieldCheck className="h-3.5 w-3.5" aria-hidden />
                Review queue
              </Link>
            }
          />
          <div className="divide-y divide-white/6">
            {awaiting.map((report) => {
              const segment = segmentById.get(report.segmentId)
              return (
                <Link
                  key={report.id}
                  href={`/portal/maintenance/${report.reference}`}
                  className="flex flex-wrap items-center gap-x-3 gap-y-1.5 px-4 py-3 transition-colors hover:bg-white/4 sm:px-5"
                >
                  <span className="font-mono text-[10px] font-semibold text-amber-200">{report.reference}</span>
                  <span className="min-w-0 flex-1 truncate text-[11.5px] font-semibold text-slate-200">
                    {report.title}
                  </span>
                  <span className="font-mono text-[10px] text-slate-500">{segment?.trackId}</span>
                  <SeverityChip severity={report.severity} />
                  <span className="text-[9.5px] text-slate-500">{formatAge(report.reportedAt, now)}</span>
                  <ArrowRight className="h-3 w-3 text-slate-600" aria-hidden />
                </Link>
              )
            })}
          </div>
        </Panel>
      )}

      <div className="grid grid-cols-2 gap-2.5 xl:grid-cols-4">
        <div className="panel p-3.5">
          <div className="flex items-start justify-between">
            <p className="eyebrow text-green-400">Open in workflow</p>
            <Wrench className="h-3.5 w-3.5 text-slate-500" aria-hidden />
          </div>
          <p className="mt-2.5 font-mono text-[22px] font-bold leading-none text-slate-100">{openReports.length}</p>
          <p className="mt-1.5 text-[10.5px] text-slate-500">{snapshot.reports.length} reports all-time</p>
        </div>
        <div className="panel p-3.5">
          <div className="flex items-start justify-between">
            <p className="eyebrow text-amber-300">Overdue work orders</p>
            <Filter className="h-3.5 w-3.5 text-slate-500" aria-hidden />
          </div>
          <p className={`mt-2.5 font-mono text-[22px] font-bold leading-none ${overdue.length > 0 ? 'text-amber-300' : 'text-slate-100'}`}>
            {overdue.length}
          </p>
          <p className="mt-1.5 text-[10.5px] text-slate-500">Past the assigned deadline</p>
        </div>
        <div className="panel p-3.5">
          <div className="flex items-start justify-between">
            <p className="eyebrow text-emerald-300">Completed</p>
            <ClipboardCheck className="h-3.5 w-3.5 text-slate-500" aria-hidden />
          </div>
          <p className="mt-2.5 font-mono text-[22px] font-bold leading-none text-slate-100">
            {snapshot.reports.filter((report) => ['completed', 'closed'].includes(report.stage)).length}
          </p>
          <p className="mt-1.5 text-[10.5px] text-slate-500">
            {snapshot.reports.filter((report) => report.stage === 'closed').length} verified &amp; closed
          </p>
        </div>
        <div className="panel p-3.5">
          <div className="flex items-start justify-between">
            <p className="eyebrow text-sky-300">Your role</p>
            <ShieldCheck className="h-3.5 w-3.5 text-slate-500" aria-hidden />
          </div>
          <p className="mt-2.5 font-mono text-[13px] font-bold leading-tight text-slate-100">
            {ROLE_LABEL[user.role]}
          </p>
          <p className="mt-1.5 text-[10.5px] text-slate-500">
            {can.authoriseWork(user)
              ? 'May authorise work orders'
              : can.assessReport(user)
                ? 'May assess and recommend'
                : can.verifyReport(user, user.departmentSlug ?? '')
                  ? 'May verify department reports'
                  : can.executeWork(user)
                    ? 'May execute assigned work'
                    : 'Read-only at this stage'}
          </p>
        </div>
      </div>

      {can.createReport(user) && (
        <ReportIntake
          segments={snapshot.segments}
          departments={reporterDepartments}
          defaultDepartmentSlug={user.departmentSlug ?? undefined}
        />
      )}

      <Panel>
        <PanelHeader
          eyebrow="Pipeline"
          title="Reports by workflow stage"
          description="Select a stage to filter the registry. Rejected reports are retained for audit."
        />
        <div className="no-scrollbar flex gap-1.5 overflow-x-auto p-3 sm:flex-wrap sm:p-4">
          <Link
            href="/portal/maintenance"
            className={`flex-none rounded-md border px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-[0.05em] transition-colors ${
              !stage ? 'border-green-500/40 bg-green-500/12 text-green-300' : 'border-white/10 text-slate-400 hover:border-white/20'
            }`}
          >
            All Â· {snapshot.reports.length}
          </Link>
          {stageCounts.map((row) => {
            const active = stage === row.stage
            return (
              <Link
                key={row.stage}
                href={`/portal/maintenance?stage=${row.stage}${dept ? `&dept=${dept}` : ''}`}
                className={`flex flex-none items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-[0.05em] transition-colors ${
                  active
                    ? 'border-green-500/40 bg-green-500/12 text-green-300'
                    : row.count === 0
                      ? 'border-white/6 text-slate-600'
                      : 'border-white/10 text-slate-400 hover:border-white/20'
                }`}
              >
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{
                    backgroundColor:
                      row.stage === 'rejected'
                        ? STATUS_COLOURS.critical.hex
                        : row.count > 0
                          ? STATUS_COLOURS.normal.hex
                          : STATUS_COLOURS.offline.hex,
                  }}
                  aria-hidden
                />
                {STAGE_LABEL[row.stage]}
                <span className="text-slate-500">{row.count}</span>
              </Link>
            )
          })}
        </div>
      </Panel>

      <Panel>
        <PanelHeader
          eyebrow="Registry"
          title="Maintenance reports"
          description="Every report carries a reference, location, department, defect description, severity, photographs, timestamps and full approval history."
          action={<Chip tone="bg-white/6 text-slate-300 ring-white/10">{reports.length} shown</Chip>}
        />
        <RegistryFilters departments={reporterDepartments} />

        {reports.length === 0 ? (
          <EmptyState
            title="No reports match"
            description="Clear the filters or submit a new defect report."
            icon={Wrench}
          />
        ) : (
          <>
            <div className="hidden overflow-x-auto md:block">
              <table className="data-table min-w-[900px]">
                <thead>
                  <tr>
                    <th>Reference</th>
                    <th>Defect</th>
                    <th>Section</th>
                    <th>Department</th>
                    <th>Severity</th>
                    <th>Stage</th>
                    <th>Owner</th>
                    <th>Reported</th>
                  </tr>
                </thead>
                <tbody>
                  {reports.map((report) => {
                    const segment = segmentById.get(report.segmentId)
                    return (
                      <tr key={report.id}>
                        <td>
                          <Link
                            href={`/portal/maintenance/${report.reference}`}
                            className="font-mono text-[10px] font-semibold text-green-400 hover:text-green-300"
                          >
                            {report.reference}
                          </Link>
                        </td>
                        <td className="max-w-[240px]">
                          <Link
                            href={`/portal/maintenance/${report.reference}`}
                            className="line-clamp-1 text-[11px] text-slate-300 hover:text-slate-100"
                          >
                            {report.title}
                          </Link>
                        </td>
                        <td className="font-mono text-[10px] text-slate-500">{segment?.trackId ?? 'â€”'}</td>
                        <td className="text-[10px] capitalize text-slate-400">
                          {report.departmentSlug.replace(/-/g, ' ')}
                        </td>
                        <td>
                          <SeverityChip severity={report.severity} />
                        </td>
                        <td>
                          <StageChip stage={report.stage} />
                        </td>
                        <td className="text-[10px] text-slate-500">{STAGE_OWNER[report.stage]}</td>
                        <td className="text-[10px] text-slate-500">
                          {formatShort(report.reportedAt)}
                          <span className="ml-1 text-slate-600">{formatAge(report.reportedAt, now)}</span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            <ul className="divide-y divide-white/6 md:hidden">
              {reports.map((report) => {
                const segment = segmentById.get(report.segmentId)
                const reporter = employeeById.get(report.reportedBy)
                return (
                  <li key={report.id}>
                    <Link href={`/portal/maintenance/${report.reference}`} className="block px-4 py-3 hover:bg-white/4">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-[10px] font-semibold text-green-400">{report.reference}</span>
                        <StageChip stage={report.stage} />
                      </div>
                      <p className="mt-1 text-[11.5px] font-semibold leading-snug text-slate-200">{report.title}</p>
                      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[9.5px] text-slate-500">
                        <span className="font-mono">{segment?.trackId}</span>
                        <span className="capitalize">{report.departmentSlug.replace(/-/g, ' ')}</span>
                        <SeverityChip severity={report.severity} />
                        <span>{formatAge(report.reportedAt, now)}</span>
                        {reporter && <span>{reporter.fullName}</span>}
                      </div>
                    </Link>
                  </li>
                )
              })}
            </ul>
          </>
        )}

        <div className="border-t border-white/8 px-4 py-2.5 text-[9.5px] text-slate-600 sm:px-5">
          Authorisation is restricted to the Head of Operations, PRASA. Roles cannot act outside their stage â€”
          the guard is enforced on the server for every transition.
        </div>
      </Panel>
    </div>
  )
}

