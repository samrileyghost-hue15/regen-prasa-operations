import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  MessageSquare,
  Radio,
  Users,
  Wrench,
} from 'lucide-react'

import {
  Chip,
  DataSourceNote,
  EmptyState,
  KeyValue,
  Meter,
  PageHeading,
  Panel,
  PanelHeader,
  SeverityChip,
  StageChip,
  StatusChip,
} from '@/components/ui/primitives'
import { requireUser } from '@/lib/auth'
import { formatAge, formatShort, formatTime, initialsOf, titleCase } from '@/lib/format'
import { OPEN_STAGES, alertsFor, operationalNow, reportsFor } from '@/lib/insights'
import { ROLE_LABEL } from '@/lib/permissions'
import { dataSource, loadSnapshot } from '@/lib/store'
import { STATUS_COLOURS } from '@/lib/tokens'

export const dynamic = 'force-dynamic'

type Params = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params
  return { title: titleCase(slug) }
}

export default async function DepartmentPage({ params }: Params) {
  await requireUser()
  const { slug } = await params
  const snapshot = await loadSnapshot()

  const department = snapshot.departments.find((row) => row.slug === slug)
  if (!department) notFound()

  const now = operationalNow(snapshot)

  const descendants = snapshot.departments.filter((row) => row.parentSlug === department.slug)
  const scope = [department.slug, ...descendants.map((row) => row.slug)]

  const team = snapshot.employees.filter(
    (employee) => employee.departmentSlug !== null && scope.includes(employee.departmentSlug),
  )
  const sections = snapshot.segments.filter((segment) =>
    segment.departmentSlugs.some((slugName) => scope.includes(slugName)),
  )
  const reports = reportsFor(snapshot).filter((report) => scope.includes(report.departmentSlug))
  const openReports = reports.filter((report) => OPEN_STAGES.includes(report.stage))
  const segmentIds = new Set(sections.map((segment) => segment.id))
  const alerts = alertsFor(snapshot).filter(
    (alert) => scope.includes(alert.departmentSlug) || segmentIds.has(alert.segmentId),
  )
  const openAlerts = alerts.filter((alert) => alert.status !== 'resolved')

  const parent = department.parentSlug
    ? snapshot.departments.find((row) => row.slug === department.parentSlug)
    : null

  const channels = snapshot.channels.filter(
    (channel) =>
      channel.kind === 'department' ||
      (channel.kind !== 'direct' && channel.memberIds.some((id) => team.some((employee) => employee.id === id))),
  )
  const departmentChannel = channels.find((channel) => channel.kind === 'department')

  const workOrders = openReports.filter((report) => report.assignedTo)
  const slaBreaches = openReports.filter(
    (report) => now - new Date(report.reportedAt).getTime() > department.slaHours * 3_600_000,
  )
  const compliance = Math.round(((openReports.length - slaBreaches.length) / Math.max(1, openReports.length)) * 100)

  return (
    <div className="space-y-4 sm:space-y-5">
      <Link
        href="/portal/departments"
        className="inline-flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-[0.08em] text-slate-500 transition-colors hover:text-cyan-300"
      >
        <ArrowLeft className="h-3 w-3" aria-hidden />
        All departments
      </Link>

      <PageHeading
        eyebrow={
          parent ? `${titleCase(parent.name)} · ${titleCase(department.discipline)}` : titleCase(department.discipline)
        }
        title={department.name}
        description={department.description}
        actions={
          <>
            <StatusChip status={department.status} />
            {departmentChannel && (
              <Link href={`/portal/connect?channel=${departmentChannel.slug}`} className="btn btn-ghost">
                <MessageSquare className="h-3.5 w-3.5" aria-hidden />
                Department chat
              </Link>
            )}
            <div className="hidden items-center rounded-lg border border-white/10 bg-navy-925 px-3 py-1.5 sm:flex">
              <DataSourceNote source={dataSource} />
            </div>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-2.5 xl:grid-cols-4">
        <div className="panel p-3.5">
          <p className="eyebrow text-sky-300">Headcount</p>
          <p className="mt-2 font-mono text-[22px] font-bold leading-none text-slate-100">
            {department.headcount}
          </p>
          <p className="mt-1.5 text-[10.5px] text-slate-500">Approved establishment</p>
        </div>
        <div className="panel p-3.5">
          <p className="eyebrow text-teal-300">{department.kpiLabel}</p>
          <p className="mt-2 font-mono text-[22px] font-bold leading-none text-slate-100">
            {department.kpiValue}
          </p>
          <p className="mt-1.5 text-[10.5px] text-slate-500">Reporting period to date</p>
        </div>
        <div className="panel p-3.5">
          <p className="eyebrow text-amber-300">Open in workflow</p>
          <p className="mt-2 font-mono text-[22px] font-bold leading-none text-slate-100">
            {openReports.length}
          </p>
          <p className="mt-1.5 text-[10.5px] text-slate-500">
            {workOrders.length} with a work order issued
          </p>
        </div>
        <div className="panel p-3.5">
          <p className="eyebrow text-violet-300">SLA target</p>
          <p className="mt-2 font-mono text-[22px] font-bold leading-none text-slate-100">
            {department.slaHours}h
          </p>
          <p className="mt-1.5 text-[10.5px] text-slate-500">{slaBreaches.length} reports beyond target</p>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.55fr_1fr] sm:gap-5">
        <div className="space-y-4 sm:space-y-5">
          <Panel>
            <PanelHeader
              eyebrow="Response queue"
              title="Maintenance for this department"
              description="Reports travel field → department → REGEN technical → Head of Operations → maintenance team."
              action={
                <Link
                  href="/portal/maintenance"
                  className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.08em] text-teal-300 hover:text-teal-200"
                >
                  Registry
                  <ArrowRight className="h-3 w-3" aria-hidden />
                </Link>
              }
            />
            {reports.length === 0 ? (
              <EmptyState
                title="No reports recorded"
                description="Nothing has been raised against this department yet."
                icon={Wrench}
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="data-table min-w-[640px]">
                  <thead>
                    <tr>
                      <th>Reference</th>
                      <th>Defect</th>
                      <th>Section</th>
                      <th>Severity</th>
                      <th>Stage</th>
                      <th>Reported</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reports.map((report) => {
                      const segment = snapshot.segments.find((row) => row.id === report.segmentId)
                      return (
                        <tr key={report.id}>
                          <td>
                            <Link
                              href={`/portal/maintenance/${report.reference}`}
                              className="font-mono text-[10.5px] font-semibold text-teal-300 hover:text-teal-200"
                            >
                              {report.reference}
                            </Link>
                          </td>
                          <td className="max-w-[220px]">
                            <span className="line-clamp-1 text-[11px] text-slate-300">{report.title}</span>
                          </td>
                          <td className="font-mono text-[10px] text-slate-500">{segment?.trackId ?? '—'}</td>
                          <td>
                            <SeverityChip severity={report.severity} />
                          </td>
                          <td>
                            <StageChip stage={report.stage} />
                          </td>
                          <td className="text-[10px] text-slate-500">{formatShort(report.reportedAt)}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Panel>

          <Panel>
            <PanelHeader
              eyebrow="Asset responsibility"
              title="Sections maintained"
              description="Infrastructure on this department's sections must be inspected inside the SLA window."
            />
            {sections.length === 0 ? (
              <EmptyState title="No sections assigned" description="This department does not own a track section." />
            ) : (
              <div className="divide-y divide-white/6">
                {sections.map((segment) => (
                  <Link
                    key={segment.id}
                    href={`/portal/network?section=${segment.trackId}`}
                    className="group flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-white/4 sm:px-5"
                  >
                    <span
                      className="h-2 w-2 flex-none rounded-full"
                      style={{ backgroundColor: STATUS_COLOURS[segment.status].hex }}
                      aria-hidden
                    />
                    <span className="w-[52px] flex-none font-mono text-[10.5px] font-semibold text-slate-400">
                      {segment.trackId}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-[11.5px] text-slate-300">{segment.name}</span>
                    <span className="hidden font-mono text-[10px] text-slate-500 sm:block">
                      idx {segment.conditionScore}
                    </span>
                    <StatusChip status={segment.status} />
                    <ArrowRight className="h-3 w-3 flex-none text-slate-600 group-hover:text-cyan-300" aria-hidden />
                  </Link>
                ))}
              </div>
            )}
          </Panel>

          <Panel>
            <PanelHeader
              eyebrow="Escalations"
              title="Open alerts"
              action={<Chip tone="bg-red-500/12 text-red-300 ring-red-500/30">{openAlerts.length}</Chip>}
            />
            {openAlerts.length === 0 ? (
              <EmptyState
                title="No open alerts"
                description="This department has no escalations on the network."
                icon={AlertTriangle}
              />
            ) : (
              <div className="divide-y divide-white/6">
                {openAlerts.map((alert) => (
                  <div key={alert.id} className="px-4 py-3 sm:px-5">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <SeverityChip severity={alert.severity} />
                        <span className="font-mono text-[9.5px] text-slate-600">{alert.reference}</span>
                      </div>
                      <span className="font-mono text-[9.5px] text-slate-600">
                        {formatTime(alert.occurredAt)}
                      </span>
                    </div>
                    <p className="mt-1 text-[11.5px] font-semibold leading-snug text-slate-200">{alert.title}</p>
                    <p className="mt-0.5 text-[10.5px] leading-relaxed text-slate-500">{alert.detail}</p>
                    <p className="mt-1 text-[9.5px] uppercase tracking-[0.06em] text-slate-600">
                      Source · {alert.source}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </Panel>
        </div>

        <div className="space-y-4 sm:space-y-5">
          <Panel>
            <PanelHeader eyebrow="Performance" title="Department health" />
            <div className="space-y-3.5 p-4 sm:p-5">
              <Meter
                value={compliance}
                tone={compliance >= 85 ? 'bg-emerald-400' : compliance >= 60 ? 'bg-amber-400' : 'bg-red-400'}
                label="Reports answered inside SLA"
                suffix="%"
              />
              <Meter
                value={Math.min(100, openReports.length * 18)}
                tone="bg-cyan-400"
                label="Workflow load"
                suffix="%"
              />
              <KeyValue
                items={[
                  { label: 'Discipline', value: titleCase(department.discipline) },
                  { label: 'Reports total', value: reports.length },
                  { label: 'Sub-departments', value: descendants.length || '—' },
                  { label: 'Sections maintained', value: sections.length },
                  { label: 'Open alerts', value: openAlerts.length },
                ]}
              />
            </div>
          </Panel>

          <Panel>
            <PanelHeader
              eyebrow="Team"
              title="Department roster"
              action={<Chip tone="bg-white/6 text-slate-300 ring-white/10">{team.length}</Chip>}
            />
            {team.length === 0 ? (
              <EmptyState title="No employees linked" description="No demonstration accounts are linked to this department." icon={Users} />
            ) : (
              <div className="divide-y divide-white/6">
                {team.map((employee) => (
                  <div key={employee.id} className="flex items-center gap-3 px-4 py-2.5 sm:px-5">
                    <span className="relative grid h-8 w-8 flex-none place-items-center rounded-full bg-navy-800 font-mono text-[10.5px] font-bold text-slate-300">
                      {initialsOf(employee.fullName)}
                      <span
                        className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full ring-2 ring-navy-900 ${
                          employee.isOnline ? 'bg-emerald-400' : 'bg-slate-600'
                        }`}
                      />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[11.5px] font-semibold text-slate-200">{employee.fullName}</p>
                      <p className="truncate text-[9.5px] text-slate-500">
                        {ROLE_LABEL[employee.role]} · {employee.employeeRef}
                      </p>
                    </div>
                    <span className="flex-none text-[9px] uppercase tracking-[0.05em] text-slate-600">
                      {employee.isOnline ? 'Online' : formatAge(employee.lastSeen, now)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Panel>

          {descendants.length > 0 && (
            <Panel>
              <PanelHeader eyebrow="Structure" title="Sub-departments" />
              <div className="divide-y divide-white/6">
                {descendants.map((child) => (
                  <Link
                    key={child.id}
                    href={`/portal/departments/${child.slug}`}
                    className="flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-white/4 sm:px-5"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[11.5px] font-semibold text-slate-200">{child.name}</p>
                      <p className="truncate text-[9.5px] text-slate-500">
                        {child.headcount} staff · {child.kpiLabel}: {child.kpiValue}
                      </p>
                    </div>
                    <StatusChip status={child.status} />
                  </Link>
                ))}
              </div>
            </Panel>
          )}

          <Panel>
            <PanelHeader eyebrow="REGEN Connect" title="Communication channels" />
            <div className="divide-y divide-white/6">
              {channels.map((channel) => (
                <Link
                  key={channel.id}
                  href={`/portal/connect?channel=${channel.slug}`}
                  className="flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-white/4 sm:px-5"
                >
                  <span className="grid h-7 w-7 flex-none place-items-center rounded-md bg-cyan-500/10 text-cyan-300">
                    <MessageSquare className="h-3.5 w-3.5" aria-hidden />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[11.5px] font-semibold text-slate-200">{channel.name}</p>
                    <p className="truncate text-[9.5px] text-slate-500">{channel.description}</p>
                  </div>
                  <span className="flex-none font-mono text-[9.5px] text-slate-600">
                    {channel.memberIds.length}
                  </span>
                </Link>
              ))}
            </div>
          </Panel>

          <div className="flex items-start gap-2 rounded-lg border border-cyan-400/20 bg-cyan-500/5 px-3 py-2.5">
            <Radio className="mt-0.5 h-3.5 w-3.5 flex-none text-cyan-300" aria-hidden />
            <p className="text-[10px] leading-relaxed text-slate-400">
              Section condition is derived from REGEN-EDGE sensor channels, train-control reports and
              recorded inspections. All entries are written to the shared REGEN database and audited.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
