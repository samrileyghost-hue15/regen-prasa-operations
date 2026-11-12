import type { Metadata } from 'next'
import Link from 'next/link'
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BellRing,
  Building2,
  Cpu,
  Gauge,
  MapPin,
  Radio,
  ShieldCheck,
  TrainFront,
  TrendingDown,
  TrendingUp,
  Users,
  Wrench,
} from 'lucide-react'

import { Sparkline } from '@/components/charts/Sparkline'
import { LiveClock } from '@/components/shell/LiveClock'
import {
  Chip,
  DataSourceNote,
  EmptyState,
  Meter,
  PageHeading,
  Panel,
  PanelHeader,
  SeverityChip,
  StageChip,
  Stat,
  StatusChip,
} from '@/components/ui/primitives'
import { requireUser } from '@/lib/auth'
import { formatAge, formatShort, formatTime } from '@/lib/format'
import {
  OPEN_STAGES,
  buildKpis,
  operationalNow,
  predictiveRisks,
  vibrationSeries,
} from '@/lib/insights'
import { STAGE_LABEL, STAGE_ORDER } from '@/lib/permissions'
import { dataSource, loadSnapshot } from '@/lib/store'
import { STATUS_COLOURS, severityTone } from '@/lib/tokens'
import type { Segment, Severity } from '@/lib/types'

export const metadata: Metadata = { title: 'Operations Centre' }
export const dynamic = 'force-dynamic'

const SEVERITY_RANK: Record<Severity, number> = { critical: 0, high: 1, medium: 2, low: 3 }

export default async function OperationsCentrePage() {
  const user = await requireUser()
  const snapshot = await loadSnapshot()
  const now = operationalNow(snapshot)
  const kpis = buildKpis(snapshot)

  const openAlerts = snapshot.alerts
    .filter((alert) => alert.status !== 'resolved')
    .sort(
      (a, b) =>
        SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity] || (a.occurredAt < b.occurredAt ? 1 : -1),
    )

  const awaiting = snapshot.reports.filter((report) => report.stage === 'awaiting-authorisation')
  const activeReports = snapshot.reports.filter((report) => OPEN_STAGES.includes(report.stage))
  const latestMovements = snapshot.movements.slice(0, 5)
  const pilotSensor = snapshot.sensors.find((sensor) => sensor.sensorId === 'REGEN-EDGE-KP01')!
  const pilotSeries = vibrationSeries(snapshot, 'REGEN-EDGE-KP01', 30)
  const latestReading = snapshot.telemetry.find((row) => row.sensorId === 'REGEN-EDGE-KP01')
  const risks = predictiveRisks(snapshot).slice(0, 3)

  const corridors = Object.entries(
    snapshot.segments.reduce<Record<string, Segment[]>>((groups, segment) => {
      groups[segment.corridor] = [...(groups[segment.corridor] ?? []), segment]
      return groups
    }, {}),
  )

  const stageCounts = STAGE_ORDER.map((stage) => ({
    stage,
    count: snapshot.reports.filter((report) => report.stage === stage).length,
  }))
  const maxStage = Math.max(1, ...stageCounts.map((row) => row.count))

  const disciplines = (['fixed-infrastructure', 'train-operations'] as const).map((discipline) => ({
    discipline,
    departments: snapshot.departments.filter(
      (department) => department.discipline === discipline && department.parentSlug !== null,
    ),
  }))

  return (
    <div className="space-y-4 sm:space-y-5">
      <PageHeading
        eyebrow="Operational Centre Â· Gauteng"
        title={`Good day, ${user.fullName.split(' ')[0]}`}
        description="Live condition of the Gauteng railway network, sensor status, train movements and the maintenance response queue."
        actions={
          <>
            <div className="hidden items-center gap-3 rounded-lg border border-white/10 bg-navy-925 px-3 py-1.5 sm:flex">
              <LiveClock />
              <span className="h-3 w-px bg-white/10" />
              <DataSourceNote source={dataSource} />
            </div>
            <Link href="/portal/network" className="btn btn-ghost">
              <MapPin className="h-3.5 w-3.5" aria-hidden />
              Railway map
            </Link>
          </>
        }
      />

      {/* KPI strip */}
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 xl:grid-cols-6">
        <Stat
          label="Sections in service"
          value={
            <>
              {kpis.sectionsOperational}
              <span className="text-[13px] text-slate-500">/{kpis.sectionsTotal}</span>
            </>
          }
          detail={`${snapshot.segments.filter((segment) => segment.status === 'critical').length} critical Â· ${snapshot.segments.filter((segment) => segment.status === 'warning').length} warning`}
          icon={Gauge}
          accent="text-emerald-300"
        />
        <Stat
          label="Sensors online"
          value={
            <>
              {kpis.sensorsOnline}
              <span className="text-[13px] text-slate-500">/{kpis.sensorsTotal}</span>
            </>
          }
          detail={`${kpis.liveSensorCount} physical Â· ${kpis.sensorsTotal - kpis.liveSensorCount} simulated`}
          icon={Cpu}
          accent="text-green-400"
        />
        <Stat
          label="Trains detected Â· 24h"
          value={kpis.movements24h}
          detail={`${snapshot.movements.length} in register`}
          icon={TrainFront}
          accent="text-sky-300"
        />
        <Stat
          label="Open alerts"
          value={kpis.openAlerts}
          detail={`${kpis.criticalAlerts} critical priority`}
          icon={AlertTriangle}
          accent="text-amber-300"
          tone={kpis.criticalAlerts > 0 ? 'text-red-300' : 'text-slate-100'}
        />
        <Stat
          label="Maintenance in workflow"
          value={kpis.openReports}
          detail={`${kpis.awaitingAuthorisation} awaiting authorisation`}
          icon={Wrench}
          accent="text-green-400"
          href="/portal/maintenance"
        />
        <Stat
          label="Field staff online"
          value={
            <>
              {kpis.staffOnline}
              <span className="text-[13px] text-slate-500">/{kpis.staffTotal}</span>
            </>
          }
          detail="REGEN Connect availability"
          icon={Users}
          accent="text-violet-300"
          href="/portal/connect"
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.55fr_1fr] sm:gap-5">
        {/* Network condition */}
        <Panel>
          <PanelHeader
            eyebrow="Network condition"
            title="Gauteng corridors"
            description="Sections are coloured by live condition. Select a section to open the map inspector."
            action={
              <Link
                href="/portal/network"
                className="flex items-center gap-1 text-[10.5px] font-bold uppercase tracking-[0.08em] text-green-400 hover:text-green-300"
              >
                Open map
                <ArrowRight className="h-3 w-3" aria-hidden />
              </Link>
            }
          />
          <div className="space-y-4 p-4 sm:p-5">
            {corridors.map(([corridor, sections]) => (
              <div key={corridor}>
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-[10.5px] font-bold uppercase tracking-[0.1em] text-slate-400">
                    {corridor}
                  </p>
                  <span className="font-mono text-[10px] text-slate-600">{sections.length} sections</span>
                </div>
                <div className="space-y-1">
                  {sections.map((segment) => {
                    const colour = STATUS_COLOURS[segment.status]
                    return (
                      <Link
                        key={segment.id}
                        href={`/portal/network?section=${segment.trackId}`}
                        className="group flex items-center gap-3 rounded-md border border-transparent px-1.5 py-1.5 transition-colors hover:border-white/8 hover:bg-white/4"
                      >
                        <span
                          className="h-2 w-2 flex-none rounded-full"
                          style={{ backgroundColor: colour.hex }}
                          aria-hidden
                        />
                        <span className="w-[52px] flex-none font-mono text-[10.5px] font-semibold text-slate-400">
                          {segment.trackId}
                        </span>
                        <span className="min-w-0 flex-1 truncate text-[11.5px] text-slate-300">
                          {segment.name}
                        </span>
                        <span className="hidden w-[74px] flex-none text-right font-mono text-[10px] text-slate-500 sm:block">
                          {segment.status === 'offline' ? 'closed' : `${segment.conditionScore} idx`}
                        </span>
                        <span className="flex-none text-right">
                          <StatusChip status={segment.status} />
                        </span>
                      </Link>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-white/8 px-4 py-2.5 sm:px-5">
            {(Object.keys(STATUS_COLOURS) as (keyof typeof STATUS_COLOURS)[]).map((key) => (
              <span key={key} className="flex items-center gap-1.5 text-[10px] text-slate-500">
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ backgroundColor: STATUS_COLOURS[key].hex }}
                />
                {STATUS_COLOURS[key].label}
              </span>
            ))}
          </div>
        </Panel>

        {/* Alerts */}
        <Panel className="flex flex-col">
          <PanelHeader
            eyebrow="Attention queue"
            title="Open alerts"
            description="Escalations requiring an operational decision"
            action={
              <span className="grid h-6 min-w-6 place-items-center rounded-full bg-red-500/15 px-1.5 text-[10px] font-bold text-red-300">
                {openAlerts.length}
              </span>
            }
          />
          <div className="flex-1 divide-y divide-white/6 overflow-y-auto">
            {openAlerts.length === 0 && (
              <EmptyState title="No open alerts" description="The network is reporting normal conditions." />
            )}
            {openAlerts.slice(0, 5).map((alert) => {
              const segment = snapshot.segments.find((item) => item.id === alert.segmentId)
              return (
                <Link
                  key={alert.id}
                  href={`/portal/network?section=${segment?.trackId ?? ''}`}
                  className="block px-4 py-3 transition-colors hover:bg-white/4 sm:px-5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <SeverityChip severity={alert.severity} />
                    <span className="font-mono text-[9.5px] text-slate-500">
                      {formatAge(alert.occurredAt, now)}
                    </span>
                  </div>
                  <p className="mt-1.5 text-[11.5px] font-semibold leading-snug text-slate-100">
                    {alert.title}
                  </p>
                  <p className="mt-0.5 line-clamp-2 text-[10.5px] leading-relaxed text-slate-500">
                    {alert.detail}
                  </p>
                  <div className="mt-1.5 flex items-center gap-1.5 text-[9.5px] text-slate-600">
                    <MapPin className="h-2.5 w-2.5" aria-hidden />
                    {segment?.trackId} Â· {segment?.name}
                  </div>
                </Link>
              )
            })}
          </div>
        </Panel>
      </div>

      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-[1.1fr_1fr_1fr] sm:gap-5">
        {/* Kempton Park pilot */}
        <Panel>
          <PanelHeader
            eyebrow="Pilot installation"
            title="Kempton Park Â· REGEN-EDGE-KP01"
            action={<StatusChip status={pilotSensor.status === 'online' ? 'normal' : 'warning'} />}
          />
          <div className="p-4 sm:p-5">
            <div className="flex items-end justify-between gap-3">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-500">
                  Vibration velocity
                </p>
                <p className="mt-1 flex items-baseline gap-1.5">
                  <span className="font-mono text-[26px] font-bold leading-none text-white">
                    {kpis.vibrationNow?.toFixed(1) ?? 'â€”'}
                  </span>
                  <span className="text-[11px] text-slate-500">mm/s</span>
                  <span
                    className={`ml-1 inline-flex items-center gap-0.5 text-[10px] font-bold ${
                      kpis.vibrationDelta > 0 ? 'text-amber-300' : 'text-emerald-300'
                    }`}
                  >
                    {kpis.vibrationDelta > 0 ? (
                      <TrendingUp className="h-3 w-3" aria-hidden />
                    ) : (
                      <TrendingDown className="h-3 w-3" aria-hidden />
                    )}
                    {Math.abs(kpis.vibrationDelta).toFixed(2)}
                  </span>
                </p>
              </div>
              <Chip tone="bg-green-500/12 text-green-400 ring-green-500/30" dot>
                {pilotSensor.signalQuality}% signal
              </Chip>
            </div>

            <div className="mt-3 overflow-hidden rounded-md border border-white/8 bg-navy-950/60 px-1 pt-2">
              <Sparkline values={pilotSeries.map((point) => point.value)} color="#22d3ee" threshold={10} height={62} />
            </div>
            <div className="mt-1 flex items-center justify-between text-[9px] text-slate-600">
              <span>{pilotSeries.length ? formatTime(pilotSeries[0].at) : 'â€”'}</span>
              <span className="text-amber-500/80">review threshold 10 mm/s</span>
              <span>{latestReading ? formatTime(latestReading.capturedAt) : 'â€”'}</span>
            </div>

            <div className="mt-3 grid grid-cols-3 gap-2">
              {[
                { label: 'Last transmission', value: formatShort(pilotSensor.lastTransmission) },
                { label: 'Channels', value: `${pilotSensor.channels.length} active` },
                { label: 'Firmware', value: pilotSensor.firmware },
              ].map((item) => (
                <div key={item.label} className="rounded-md border border-white/8 bg-navy-950/40 p-2">
                  <p className="text-[9px] uppercase tracking-[0.07em] text-slate-600">{item.label}</p>
                  <p className="mt-0.5 truncate font-mono text-[10.5px] font-semibold text-slate-300">
                    {item.value}
                  </p>
                </div>
              ))}
            </div>

            <Link
              href="/portal/kempton-park"
              className="mt-3 flex items-center justify-center gap-1.5 rounded-md border border-green-500/25 bg-green-500/8 py-2 text-[10.5px] font-bold uppercase tracking-[0.08em] text-green-300 hover:bg-green-500/14"
            >
              <Radio className="h-3.5 w-3.5" aria-hidden />
              Open pilot centre
            </Link>
          </div>
        </Panel>

        {/* Maintenance workflow */}
        <Panel>
          <PanelHeader
            eyebrow="Maintenance workflow"
            title="Reports by stage"
            description="Field â†’ Department â†’ REGEN â†’ Authorisation â†’ Work"
            action={
              <Link
                href="/portal/maintenance"
                className="text-[10.5px] font-bold uppercase tracking-[0.08em] text-green-400 hover:text-green-300"
              >
                Open
              </Link>
            }
          />
          <div className="space-y-2 p-4 sm:p-5">
            {stageCounts.map(({ stage, count }) => (
              <div key={stage} className="flex items-center gap-2.5">
                <span className="w-[118px] flex-none truncate text-[10.5px] text-slate-400">
                  {STAGE_LABEL[stage]}
                </span>
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/6">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-teal-500/70 to-cyan-400"
                    style={{ width: `${(count / maxStage) * 100}%` }}
                  />
                </div>
                <span className="w-5 flex-none text-right font-mono text-[11px] font-semibold text-slate-300">
                  {count}
                </span>
              </div>
            ))}
          </div>
          <div className="border-t border-white/8 px-4 py-3 sm:px-5">
            <p className="text-[9.5px] font-bold uppercase tracking-[0.1em] text-amber-300">
              Awaiting authorisation
            </p>
            {awaiting.length === 0 ? (
              <p className="mt-1.5 text-[10.5px] text-slate-500">Nothing is waiting on an approval decision.</p>
            ) : (
              awaiting.map((report) => (
                <Link
                  key={report.id}
                  href={`/portal/maintenance/${report.reference}`}
                  className="mt-1.5 flex items-center gap-2 rounded-md border border-amber-400/20 bg-amber-500/6 px-2 py-1.5 hover:bg-amber-500/12"
                >
                  <ShieldCheck className="h-3.5 w-3.5 flex-none text-amber-300" aria-hidden />
                  <span className="min-w-0 flex-1 truncate text-[10.5px] font-semibold text-amber-100">
                    {report.reference} Â· {report.title}
                  </span>
                  <ArrowRight className="h-3 w-3 flex-none text-amber-400" aria-hidden />
                </Link>
              ))
            )}
          </div>
        </Panel>

        {/* Latest movements */}
        <Panel className="lg:col-span-2 xl:col-span-1">
          <PanelHeader
            eyebrow="Automatic register"
            title="Latest train movements"
            description="Detected by sensor, track circuit or control"
            action={
              <Link
                href="/portal/movements"
                className="text-[10.5px] font-bold uppercase tracking-[0.08em] text-green-400 hover:text-green-300"
              >
                Register
              </Link>
            }
          />
          <div className="divide-y divide-white/6">
            {latestMovements.map((movement) => {
              const segment = snapshot.segments.find((item) => item.id === movement.segmentId)
              return (
                <div key={movement.id} className="flex items-center gap-2.5 px-4 py-2.5 sm:px-5">
                  <span
                    className={`grid h-7 w-7 flex-none place-items-center rounded-md ${
                      movement.sourceKind === 'sensor'
                        ? 'bg-green-500/12 text-green-400'
                        : 'bg-white/6 text-slate-400'
                    }`}
                  >
                    <TrainFront className="h-3.5 w-3.5" aria-hidden />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[11px] font-semibold text-slate-200">
                      {movement.trainReference ?? movement.movementId}
                    </p>
                    <p className="truncate text-[9.5px] text-slate-500">
                      {segment?.trackId} Â· {movement.direction === 'up' ? 'Up line' : 'Down line'} Â·{' '}
                      {movement.isSimulated ? 'simulated' : 'detected'}
                    </p>
                  </div>
                  <div className="flex-none text-right">
                    <p className="font-mono text-[10.5px] text-slate-300">{formatTime(movement.detectedAt)}</p>
                    <p className="text-[9px] text-slate-600">{formatAge(movement.detectedAt, now)}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </Panel>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.4fr_1fr] sm:gap-5">
        {/* Departments */}
        <Panel>
          <PanelHeader
            eyebrow="PRASA operational structure"
            title="Departments connected to REGEN"
            description="Every discipline works from the same central database."
            action={
              <Link
                href="/portal/departments"
                className="text-[10.5px] font-bold uppercase tracking-[0.08em] text-green-400 hover:text-green-300"
              >
                All departments
              </Link>
            }
          />
          <div className="grid gap-4 p-4 sm:grid-cols-2 sm:p-5">
            {disciplines.map(({ discipline, departments }) => (
              <div key={discipline}>
                <div className="mb-2 flex items-center gap-1.5">
                  {discipline === 'fixed-infrastructure' ? (
                    <Cpu className="h-3.5 w-3.5 text-green-400" aria-hidden />
                  ) : (
                    <TrainFront className="h-3.5 w-3.5 text-sky-300" aria-hidden />
                  )}
                  <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-300">
                    {discipline === 'fixed-infrastructure' ? 'Fixed Infrastructure' : 'Train Operations'}
                  </p>
                </div>
                <div className="space-y-0.5">
                  {departments.map((department) => {
                    const openCount = snapshot.reports.filter(
                      (report) =>
                        report.departmentSlug === department.slug && OPEN_STAGES.includes(report.stage),
                    ).length
                    return (
                      <Link
                        key={department.id}
                        href={`/portal/departments/${department.slug}`}
                        className="flex items-center gap-2 rounded-md px-1.5 py-1.5 hover:bg-white/4"
                      >
                        <span
                          className="h-1.5 w-1.5 flex-none rounded-full"
                          style={{ backgroundColor: STATUS_COLOURS[department.status].hex }}
                          aria-hidden
                        />
                        <span className="min-w-0 flex-1 truncate text-[11px] text-slate-300">
                          {department.name}
                        </span>
                        {openCount > 0 && (
                          <span className="flex-none rounded bg-amber-500/12 px-1 text-[9px] font-bold text-amber-300">
                            {openCount}
                          </span>
                        )}
                        <span className="w-8 flex-none text-right font-mono text-[9.5px] text-slate-600">
                          {department.headcount}
                        </span>
                      </Link>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </Panel>

        {/* Predictive strip */}
        <div className="space-y-4 sm:space-y-5">
          <Panel>
            <PanelHeader
              eyebrow="Predictive maintenance"
              title="Highest current risk"
              description="Rule-based model over condition and vibration history"
              action={
                <Link
                  href="/portal/analytics"
                  className="text-[10.5px] font-bold uppercase tracking-[0.08em] text-green-400 hover:text-green-300"
                >
                  Analytics
                </Link>
              }
            />
            <div className="divide-y divide-white/6">
              {risks.map((risk) => (
                <div key={risk.segment.id} className="px-4 py-3 sm:px-5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-[10.5px] font-semibold text-slate-300">
                      {risk.segment.trackId}
                    </span>
                    <span
                      className={`font-mono text-[13px] font-bold ${
                        risk.risk >= 75 ? 'text-red-300' : risk.risk >= 55 ? 'text-amber-300' : 'text-emerald-300'
                      }`}
                    >
                      {risk.risk}
                    </span>
                  </div>
                  <p className="mt-0.5 truncate text-[11px] text-slate-400">{risk.segment.name}</p>
                  <div className="mt-1.5">
                    <Meter
                      value={risk.risk}
                      tone={
                        risk.risk >= 75 ? 'bg-red-400' : risk.risk >= 55 ? 'bg-amber-400' : 'bg-emerald-400'
                      }
                    />
                  </div>
                  <p className="mt-1 text-[9.5px] text-slate-500">
                    Intervention window Â· {risk.window}
                  </p>
                </div>
              ))}
            </div>
          </Panel>

          <Panel className="p-4">
            <div className="flex items-start gap-2.5">
              <span className="grid h-7 w-7 flex-none place-items-center rounded-md bg-green-500/12 text-green-400">
                <BellRing className="h-3.5 w-3.5" aria-hidden />
              </span>
              <div className="min-w-0">
                <p className="text-[11px] font-semibold text-slate-200">
                  {activeReports.length} active maintenance records
                </p>
                <p className="mt-0.5 text-[10.5px] leading-relaxed text-slate-500">
                  Every report keeps its identification number, location, department, severity,
                  photographs, timestamps and approval history.
                </p>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {(['critical', 'high', 'medium', 'low'] as Severity[]).map((severity) => {
                const count = activeReports.filter((report) => report.severity === severity).length
                return (
                  <span
                    key={severity}
                    className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[9.5px] font-bold uppercase ring-1 ring-inset ${severityTone(severity)}`}
                  >
                    {severity} {count}
                  </span>
                )
              })}
            </div>
          </Panel>

          <Panel className="p-4">
            <div className="flex items-center gap-2">
              <Building2 className="h-3.5 w-3.5 text-slate-500" aria-hidden />
              <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-500">
                Session
              </p>
            </div>
            <p className="mt-1.5 text-[11px] text-slate-300">
              {user.fullName} Â· <span className="font-mono text-[10px]">{user.employeeRef}</span>
            </p>
            <p className="mt-0.5 text-[10px] text-slate-500">
              {activeReports.length} records in your authorised view Â· {formatShort(new Date().toISOString())}
            </p>
            <div className="mt-2 flex items-center gap-1.5">
              <Activity className="h-3 w-3 text-emerald-400" aria-hidden />
              <span className="text-[9.5px] uppercase tracking-[0.08em] text-emerald-400">
                Session active Â· audit logging on
              </span>
            </div>
          </Panel>
        </div>
      </div>
    </div>
  )
}

