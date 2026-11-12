import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import {
  ArrowLeft,
  CalendarClock,
  Camera,
  CheckCircle2,
  Circle,
  ClipboardList,
  MapPin,
  ShieldCheck,
  UserRound,
} from 'lucide-react'

import { WorkflowActions } from '@/components/maintenance/WorkflowActions'
import {
  Chip,
  DataSourceNote,
  EmptyState,
  KeyValue,
  PageHeading,
  Panel,
  PanelHeader,
  SeverityChip,
  StageChip,
} from '@/components/ui/primitives'
import { requireUser } from '@/lib/auth'
import { formatFull, formatShort, initialsOf, titleCase } from '@/lib/format'
import { operationalNow } from '@/lib/insights'
import {
  ROLE_LABEL,
  STAGE_LABEL,
  STAGE_ORDER,
  STAGE_OWNER,
  availableActions,
  can,
} from '@/lib/permissions'
import { dataSource, loadSnapshot } from '@/lib/store'

export const dynamic = 'force-dynamic'

type Params = { params: Promise<{ reference: string }> }

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { reference } = await params
  return { title: reference }
}

export default async function ReportDetailPage({ params }: Params) {
  const user = await requireUser()
  const { reference } = await params
  const snapshot = await loadSnapshot()
  const now = operationalNow(snapshot)

  const report = snapshot.reports.find((row) => row.reference === reference)
  if (!report) notFound()

  const segment = snapshot.segments.find((row) => row.id === report.segmentId)
  const department = snapshot.departments.find((row) => row.slug === report.departmentSlug)
  const reporter = snapshot.employees.find((row) => row.id === report.reportedBy)
  const assignee = report.assignedTo
    ? snapshot.employees.find((row) => row.id === report.assignedTo)
    : null
  const sensor = segment ? snapshot.sensors.find((row) => row.segmentId === segment.id) : null
  const readings = sensor
    ? snapshot.telemetry.filter((row) => row.sensorId === sensor.sensorId).slice(0, 12)
    : []
  const peak = readings.length ? Math.max(...readings.map((row) => row.vibrationVelocity)) : null
  const alerts = segment
    ? snapshot.alerts.filter((alert) => alert.segmentId === segment.id && alert.status !== 'resolved')
    : []

  const approvals = snapshot.approvals
    .filter((entry) => entry.reportId === report.id)
    .sort((a, b) => (a.decidedAt < b.decidedAt ? 1 : -1))

  const actions = availableActions(report, user)
  const currentIndex = STAGE_ORDER.indexOf(report.stage)
  const rejected = report.stage === 'rejected'

  const members = snapshot.employees.filter((employee) =>
    ['engineer', 'field-worker', 'department-manager'].includes(employee.role),
  )

  const overdue =
    report.dueAt !== null &&
    new Date(report.dueAt).getTime() < now &&
    !['completed', 'closed', 'rejected'].includes(report.stage)

  return (
    <div className="space-y-4 sm:space-y-5">
      <Link
        href="/portal/maintenance"
        className="inline-flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-[0.08em] text-slate-500 transition-colors hover:text-cyan-300"
      >
        <ArrowLeft className="h-3 w-3" aria-hidden />
        Maintenance registry
      </Link>

      <PageHeading
        eyebrow={`${report.reference} · ${titleCase(report.departmentSlug)}`}
        title={report.title}
        description={`Reported by ${reporter?.fullName ?? 'an unknown employee'} on ${formatFull(report.reportedAt)}.`}
        actions={
          <>
            <SeverityChip severity={report.severity} />
            <StageChip stage={report.stage} />
            <div className="hidden items-center rounded-lg border border-white/10 bg-navy-925 px-3 py-1.5 sm:flex">
              <DataSourceNote source={dataSource} />
            </div>
          </>
        }
      />

      {/* Stage tracker */}
      <Panel>
        <div className="no-scrollbar flex items-stretch overflow-x-auto">
          {STAGE_ORDER.map((stage, index) => {
            const done = !rejected && currentIndex > index
            const current = !rejected && currentIndex === index
            return (
              <div
                key={stage}
                className={`flex min-w-[136px] flex-1 flex-col gap-1 border-r border-white/6 px-3 py-2.5 last:border-r-0 ${
                  current ? 'bg-cyan-500/8' : done ? 'bg-emerald-500/5' : ''
                }`}
              >
                <div className="flex items-center gap-1.5">
                  {done ? (
                    <CheckCircle2 className="h-3 w-3 flex-none text-emerald-400" aria-hidden />
                  ) : current ? (
                    <span className="h-1.5 w-1.5 flex-none rounded-full bg-cyan-300 pulse-dot" />
                  ) : (
                    <Circle className="h-3 w-3 flex-none text-slate-700" aria-hidden />
                  )}
                  <span
                    className={`text-[9px] font-bold uppercase tracking-[0.05em] ${
                      current ? 'text-cyan-200' : done ? 'text-emerald-300' : 'text-slate-600'
                    }`}
                  >
                    Step {index + 1}
                  </span>
                </div>
                <p
                  className={`text-[10px] leading-snug ${
                    current ? 'font-semibold text-slate-100' : done ? 'text-slate-400' : 'text-slate-600'
                  }`}
                >
                  {STAGE_LABEL[stage]}
                </p>
              </div>
            )
          })}
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-white/8 px-4 py-2.5 sm:px-5">
          <span className="text-[10px] text-slate-500">
            Current owner · <span className="font-semibold text-slate-300">{STAGE_OWNER[report.stage]}</span>
          </span>
          {report.dueAt && (
            <span className={`flex items-center gap-1.5 text-[10px] ${overdue ? 'text-red-300' : 'text-slate-500'}`}>
              <CalendarClock className="h-3 w-3" aria-hidden />
              Due {formatShort(report.dueAt)}
              {overdue ? ' · overdue' : ''}
            </span>
          )}
          <span className="ml-auto text-[10px] text-slate-600">{approvals.length} approval records</span>
        </div>
      </Panel>

      <div className="grid gap-4 xl:grid-cols-[1.5fr_1fr] sm:gap-5">
        <div className="space-y-4 sm:space-y-5">
          <Panel>
            <PanelHeader eyebrow="Defect" title="Reported condition" />
            <div className="space-y-4 p-4 sm:p-5">
              <p className="text-[11.5px] leading-relaxed text-slate-300">{report.description}</p>

              <div className="grid gap-2 sm:grid-cols-2">
                <div className="rounded-md border border-white/8 bg-navy-950/50 px-2.5 py-2">
                  <p className="text-[9px] uppercase tracking-[0.07em] text-slate-600">Location</p>
                  <p className="mt-0.5 flex items-start gap-1.5 text-[11px] font-semibold text-slate-200">
                    <MapPin className="mt-0.5 h-3 w-3 flex-none text-slate-500" aria-hidden />
                    {report.locationNote}
                  </p>
                </div>
                <div className="rounded-md border border-white/8 bg-navy-950/50 px-2.5 py-2">
                  <p className="text-[9px] uppercase tracking-[0.07em] text-slate-600">Section</p>
                  <p className="mt-0.5 font-mono text-[11px] font-semibold text-slate-200">
                    {segment ? `${segment.trackId} · ${segment.name}` : '—'}
                  </p>
                </div>
                <div className="rounded-md border border-white/8 bg-navy-950/50 px-2.5 py-2">
                  <p className="text-[9px] uppercase tracking-[0.07em] text-slate-600">Department</p>
                  <p className="mt-0.5 text-[11px] font-semibold text-slate-200">
                    {department?.name ?? titleCase(report.departmentSlug)}
                  </p>
                </div>
                <div className="rounded-md border border-white/8 bg-navy-950/50 px-2.5 py-2">
                  <p className="text-[9px] uppercase tracking-[0.07em] text-slate-600">Reported</p>
                  <p className="mt-0.5 text-[11px] font-semibold text-slate-200">{formatShort(report.reportedAt)}</p>
                </div>
              </div>

              <div>
                <p className="text-[9.5px] font-bold uppercase tracking-[0.1em] text-slate-500">Photographs</p>
                {report.photos.length === 0 ? (
                  <p className="mt-1.5 text-[10.5px] text-slate-500">No photographs attached to this report.</p>
                ) : (
                  <div className="mt-1.5 flex flex-wrap gap-2">
                    {report.photos.map((photo) => (
                      <span
                        key={photo}
                        className="inline-flex items-center gap-1.5 rounded-md border border-white/8 bg-white/4 px-2 py-1 text-[10px] text-slate-300"
                      >
                        <Camera className="h-3 w-3 text-slate-500" aria-hidden />
                        {photo}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </Panel>

          {/* Sensor evidence */}
          <Panel>
            <PanelHeader
              eyebrow="REGEN technical"
              title="Sensor evidence & recommendation"
              description="The technical team evaluates the telemetry before recommending maintenance."
              action={
                segment ? (
                  <Link
                    href={`/portal/network?section=${segment.trackId}`}
                    className="text-[10px] font-bold uppercase tracking-[0.08em] text-teal-300 hover:text-teal-200"
                  >
                    Inspect section
                  </Link>
                ) : undefined
              }
            />
            <div className="space-y-3 p-4 sm:p-5">
              {report.sensorEvidence ? (
                <div className="rounded-md border border-cyan-400/20 bg-cyan-500/6 px-3 py-2">
                  <p className="text-[9px] uppercase tracking-[0.07em] text-cyan-300/80">Evidence considered</p>
                  <p className="mt-1 text-[11px] leading-relaxed text-slate-200">{report.sensorEvidence}</p>
                </div>
              ) : (
                <p className="text-[10.5px] text-slate-500">
                  No technical assessment recorded yet. The recommendation appears once REGEN technical has
                  evaluated the sensor evidence.
                </p>
              )}

              {report.recommendedAction && (
                <div className="rounded-md border border-white/8 bg-navy-950/50 px-3 py-2">
                  <p className="text-[9px] uppercase tracking-[0.07em] text-slate-600">Recommended action</p>
                  <p className="mt-1 text-[11px] font-semibold leading-relaxed text-slate-200">
                    {report.recommendedAction}
                  </p>
                </div>
              )}

              {sensor ? (
                <KeyValue
                  items={[
                    { label: 'Sensor', value: <span className="font-mono text-[10.5px]">{sensor.sensorId}</span> },
                    { label: 'Device or simulated', value: sensor.isSimulated ? 'Simulated' : 'Physical device' },
                    { label: 'Signal quality', value: `${sensor.signalQuality}%` },
                    { label: 'Last transmission', value: formatShort(sensor.lastTransmission) },
                    {
                      label: 'Peak in window',
                      value: peak !== null ? `${peak.toFixed(1)} mm/s` : 'No readings',
                    },
                    { label: 'Open alerts on section', value: alerts.length },
                  ]}
                />
              ) : (
                <p className="text-[10.5px] text-slate-500">
                  No REGEN sensor is installed on this section. Evidence is drawn from inspections and
                  train-control reports.
                </p>
              )}
            </div>
          </Panel>

          {/* Work order + completion */}
          <Panel>
            <PanelHeader
              eyebrow="Execution"
              title="Work order & completion"
              description="The maintenance team receives the authorised work order and submits evidence when the task is finished."
            />
            <div className="space-y-3 p-4 sm:p-5">
              {report.assignedTo || report.dueAt || report.instructions ? (
                <>
                  <KeyValue
                    items={[
                      {
                        label: 'Assigned to',
                        value: assignee ? `${assignee.fullName} · ${ROLE_LABEL[assignee.role]}` : report.assignedTo ?? '—',
                      },
                      { label: 'Deadline', value: report.dueAt ? formatFull(report.dueAt) : '—' },
                      { label: 'Completed', value: report.completedAt ? formatFull(report.completedAt) : 'Not yet' },
                    ]}
                  />
                  {report.instructions && (
                    <div className="rounded-md border border-white/8 bg-navy-950/50 px-3 py-2">
                      <p className="text-[9px] uppercase tracking-[0.07em] text-slate-600">Instructions</p>
                      <p className="mt-1 text-[11px] leading-relaxed text-slate-300">{report.instructions}</p>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-[10.5px] text-slate-500">
                  No work order has been issued. A work order is created when the Head of Operations authorises
                  the recommendation.
                </p>
              )}

              {report.evidenceNotes && (
                <div className="rounded-md border border-emerald-400/20 bg-emerald-500/6 px-3 py-2">
                  <p className="text-[9px] uppercase tracking-[0.07em] text-emerald-300/80">Completion evidence</p>
                  <p className="mt-1 text-[11px] leading-relaxed text-slate-200">{report.evidenceNotes}</p>
                </div>
              )}
            </div>
          </Panel>
        </div>

        <div className="space-y-4 sm:space-y-5">
          <WorkflowActions
            reference={report.reference}
            actions={actions}
            members={members.map((member) => ({
              id: member.id,
              fullName: member.fullName,
              role: ROLE_LABEL[member.role],
            }))}
            stageLabel={STAGE_LABEL[report.stage]}
          />

          <Panel>
            <PanelHeader
              eyebrow="Audit"
              title="Approval history"
              action={<Chip tone="bg-white/6 text-slate-300 ring-white/10">{approvals.length}</Chip>}
            />
            {approvals.length === 0 ? (
              <EmptyState title="No approval records" description="This report has no workflow history." icon={ClipboardList} />
            ) : (
              <ol className="relative divide-y divide-white/6">
                {approvals.map((entry) => {
                  const actor = snapshot.employees.find((employee) => employee.id === entry.actorId)
                  return (
                    <li key={entry.id} className="flex gap-3 px-4 py-3 sm:px-5">
                      <span className="grid h-7 w-7 flex-none place-items-center rounded-full bg-navy-800 font-mono text-[9.5px] font-bold text-slate-300">
                        {actor ? initialsOf(actor.fullName) : <UserRound className="h-3 w-3" aria-hidden />}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                          <p className="text-[11px] font-semibold text-slate-200">{entry.decision}</p>
                          <StageChip stage={entry.stage} />
                        </div>
                        <p className="mt-0.5 text-[10px] leading-relaxed text-slate-400">{entry.comment}</p>
                        <p className="mt-1 text-[9px] text-slate-600">
                          {actor?.fullName ?? 'System'} ·{' '}
                          {entry.actorRole === 'system' ? 'System' : ROLE_LABEL[entry.actorRole as keyof typeof ROLE_LABEL]} ·{' '}
                          {formatShort(entry.decidedAt)}
                        </p>
                      </div>
                    </li>
                  )
                })}
              </ol>
            )}
          </Panel>

          <Panel>
            <PanelHeader eyebrow="People" title="Parties involved" />
            <div className="divide-y divide-white/6">
              {[
                reporter && {
                  label: 'Reported by',
                  name: reporter.fullName,
                  meta: `${ROLE_LABEL[reporter.role]} · ${reporter.employeeRef}`,
                },
                assignee && {
                  label: 'Work order assignee',
                  name: assignee.fullName,
                  meta: `${ROLE_LABEL[assignee.role]} · ${assignee.employeeRef}`,
                },
                department && {
                  label: 'Responsible department',
                  name: department.name,
                  meta: `${department.headcount} staff · SLA ${department.slaHours}h`,
                  href: `/portal/departments/${department.slug}`,
                },
              ]
                .filter(Boolean)
                .map((row) => {
                  const item = row as { label: string; name: string; meta: string; href?: string }
                  const content = (
                    <>
                      <span className="grid h-7 w-7 flex-none place-items-center rounded-md bg-white/5 text-slate-400">
                        <UserRound className="h-3.5 w-3.5" aria-hidden />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-[9px] uppercase tracking-[0.07em] text-slate-600">{item.label}</p>
                        <p className="truncate text-[11.5px] font-semibold text-slate-200">{item.name}</p>
                        <p className="truncate text-[9.5px] text-slate-500">{item.meta}</p>
                      </div>
                    </>
                  )
                  return item.href ? (
                    <Link key={item.label} href={item.href} className="flex items-center gap-3 px-4 py-2.5 hover:bg-white/4 sm:px-5">
                      {content}
                    </Link>
                  ) : (
                    <div key={item.label} className="flex items-center gap-3 px-4 py-2.5 sm:px-5">
                      {content}
                    </div>
                  )
                })}
            </div>
          </Panel>

          <div className="flex items-start gap-2 rounded-lg border border-white/8 bg-navy-925/50 px-3 py-2.5">
            <ShieldCheck className="mt-0.5 h-3.5 w-3.5 flex-none text-cyan-300" aria-hidden />
            <p className="text-[10px] leading-relaxed text-slate-500">
              You are signed in as <span className="font-semibold text-slate-300">{ROLE_LABEL[user.role]}</span>.
              {can.authoriseWork(user)
                ? ' Work orders at this stage require your authorisation.'
                : can.assessReport(user)
                  ? ' You may record the technical assessment and recommendation.'
                  : can.verifyReport(user, report.departmentSlug)
                    ? ' You may verify this report for the department.'
                    : can.executeWork(user)
                      ? ' You may execute or complete work orders assigned to you.'
                      : ' This report is outside your workflow permissions.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
