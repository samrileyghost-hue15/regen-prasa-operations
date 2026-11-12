import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Activity, BarChart3, Droplets, Gauge, Thermometer, TrendingUp, Wrench } from 'lucide-react'

import {
  ConditionDonutChart,
  MovementsBarChart,
  PeakVibrationChart,
  RiskBarChart,
} from '@/components/charts/AnalyticsCharts'
import {
  Chip,
  DataSourceNote,
  EmptyState,
  Meter,
  PageHeading,
  Panel,
  PanelHeader,
  StatusChip,
} from '@/components/ui/primitives'
import { requireUser } from '@/lib/auth'
import { formatShort, titleCase } from '@/lib/format'
import {
  conditionDistribution,
  departmentRollups,
  movementsByHour,
  operationalNow,
  predictiveRisks,
} from '@/lib/insights'
import { canAccess } from '@/lib/permissions'
import { dataSource, loadSnapshot } from '@/lib/store'
import { STATUS_COLOURS } from '@/lib/tokens'

export const metadata: Metadata = { title: 'Analytics' }
export const dynamic = 'force-dynamic'

export default async function AnalyticsPage() {
  const user = await requireUser()
  if (!canAccess('analytics', user.role)) redirect('/portal')

  const snapshot = await loadSnapshot()
  const now = operationalNow(snapshot)

  const risks = predictiveRisks(snapshot)
  const distribution = conditionDistribution(snapshot.segments).map((row) => ({
    status: row.status,
    count: row.count,
    colour: STATUS_COLOURS[row.status].hex,
    label: STATUS_COLOURS[row.status].label,
  }))

  const hourly = movementsByHour(snapshot, 12)
  const rollups = departmentRollups(snapshot).sort((a, b) => b.openReports - a.openReports)

  const meanCondition = Math.round(
    snapshot.segments.reduce((sum, segment) => sum + segment.conditionScore, 0) / snapshot.segments.length,
  )
  const sensorsOnline = snapshot.sensors.filter((sensor) => sensor.status === 'online').length
  const uptime = Math.round((sensorsOnline / Math.max(1, snapshot.sensors.length)) * 100)
  const totalMovements = snapshot.movements.filter(
    (movement) => now - new Date(movement.detectedAt).getTime() <= 24 * 3_600_000,
  ).length
  const peaks = snapshot.movements
    .filter((movement) => movement.peakVibration !== null)
    .map((movement) => movement.peakVibration as number)
  const meanPeak = peaks.length ? peaks.reduce((sum, value) => sum + value, 0) / peaks.length : 0

  const peakBySection = snapshot.segments
    .map((segment) => {
      const related = snapshot.movements
        .filter((movement) => movement.segmentId === segment.id && movement.peakVibration !== null)
        .map((movement) => movement.peakVibration as number)
      return { label: segment.trackId, peak: related.length ? Math.max(...related) : 0 }
    })
    .filter((row) => row.peak > 0)
    .sort((a, b) => b.peak - a.peak)
    .slice(0, 9)

  const environment = [...snapshot.environment].sort((a, b) => (a.capturedAt < b.capturedAt ? 1 : -1)).slice(0, 5)
  const highRisk = risks.filter((risk) => risk.risk >= 55)

  const closureRate =
    snapshot.reports.length === 0
      ? 0
      : Math.round(
          (snapshot.reports.filter((report) => ['closed', 'completed'].includes(report.stage)).length /
            snapshot.reports.length) *
            100,
        )

  return (
    <div className="space-y-4 sm:space-y-5">
      <PageHeading
        eyebrow="Intelligence"
        title="Analytics & predictive maintenance"
        description="Network condition, movement throughput, maintenance performance and the rule-based risk model that prioritises intervention across the Gauteng corridor."
        actions={
          <div className="hidden items-center rounded-lg border border-white/10 bg-navy-925 px-3 py-1.5 sm:flex">
            <DataSourceNote source={dataSource} />
          </div>
        }
      />

      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 xl:grid-cols-6">
        <div className="panel p-3.5">
          <div className="flex items-start justify-between">
            <p className="eyebrow text-emerald-300">Mean condition</p>
            <Gauge className="h-3.5 w-3.5 text-slate-500" aria-hidden />
          </div>
          <p className="mt-2.5 font-mono text-[22px] font-bold leading-none text-slate-100">{meanCondition}</p>
          <p className="mt-1.5 text-[10.5px] text-slate-500">Across {snapshot.segments.length} sections</p>
        </div>
        <div className="panel p-3.5">
          <div className="flex items-start justify-between">
            <p className="eyebrow text-green-400">Sensor uptime</p>
            <Activity className="h-3.5 w-3.5 text-slate-500" aria-hidden />
          </div>
          <p className="mt-2.5 font-mono text-[22px] font-bold leading-none text-slate-100">{uptime}%</p>
          <p className="mt-1.5 text-[10.5px] text-slate-500">
            {sensorsOnline}/{snapshot.sensors.length} devices online
          </p>
        </div>
        <div className="panel p-3.5">
          <div className="flex items-start justify-between">
            <p className="eyebrow text-sky-300">Movements Â· 24h</p>
            <BarChart3 className="h-3.5 w-3.5 text-slate-500" aria-hidden />
          </div>
          <p className="mt-2.5 font-mono text-[22px] font-bold leading-none text-slate-100">{totalMovements}</p>
          <p className="mt-1.5 text-[10.5px] text-slate-500">Detected passages</p>
        </div>
        <div className="panel p-3.5">
          <div className="flex items-start justify-between">
            <p className="eyebrow text-amber-300">Mean peak</p>
            <TrendingUp className="h-3.5 w-3.5 text-slate-500" aria-hidden />
          </div>
          <p className="mt-2.5 font-mono text-[22px] font-bold leading-none text-slate-100">
            {meanPeak.toFixed(1)}
            <span className="ml-1 text-[10px] font-medium text-slate-500">mm/s</span>
          </p>
          <p className="mt-1.5 text-[10.5px] text-slate-500">Across recorded passages</p>
        </div>
        <div className="panel p-3.5">
          <div className="flex items-start justify-between">
            <p className="eyebrow text-green-400">Closure rate</p>
            <Wrench className="h-3.5 w-3.5 text-slate-500" aria-hidden />
          </div>
          <p className="mt-2.5 font-mono text-[22px] font-bold leading-none text-slate-100">{closureRate}%</p>
          <p className="mt-1.5 text-[10.5px] text-slate-500">Reports completed or closed</p>
        </div>
        <div className="panel p-3.5">
          <div className="flex items-start justify-between">
            <p className="eyebrow text-red-300">High risk</p>
            <Activity className="h-3.5 w-3.5 text-slate-500" aria-hidden />
          </div>
          <p className={`mt-2.5 font-mono text-[22px] font-bold leading-none ${highRisk.length > 0 ? 'text-red-300' : 'text-slate-100'}`}>
            {highRisk.length}
          </p>
          <p className="mt-1.5 text-[10.5px] text-slate-500">Sections scoring 55+</p>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-3 sm:gap-5">
        <Panel>
          <PanelHeader eyebrow="Throughput" title="Movements by hour" description="Passages detected in the last 12 hours." />
          <div className="p-2 sm:p-3">
            <MovementsBarChart data={hourly} />
          </div>
        </Panel>
        <Panel>
          <PanelHeader eyebrow="Condition" title="Section status split" description="Live colour key across the monitored network." />
          <div className="p-2 sm:p-3">
            <ConditionDonutChart data={distribution} />
          </div>
        </Panel>
        <Panel>
          <PanelHeader eyebrow="Vibration" title="Peak by section" description="Highest recorded peak per section." />
          <div className="p-2 sm:p-3">
            <PeakVibrationChart data={peakBySection} />
          </div>
        </Panel>
      </div>

      <Panel>
        <PanelHeader
          eyebrow="Predictive maintenance"
          title="Risk model & recommended intervention"
          description="Transparent rule-based scoring: condition index, vibration exceedances, peak severity, open high-priority alerts and live section status. This stands in for the model REGEN will train on production telemetry."
          action={<Chip tone="bg-white/6 text-slate-300 ring-white/10">{risks.length} sections scored</Chip>}
        />
        <div className="grid gap-4 p-4 xl:grid-cols-[1.15fr_1fr] sm:p-5">
          <div>
            <RiskBarChart data={risks.slice(0, 8).map((risk) => ({ label: risk.segment.trackId, risk: risk.risk }))} />
            <p className="mt-1 text-[9px] text-slate-600">
              Risk index 0â€“100. 75+ triggers immediate inspection and possession planning.
            </p>
          </div>
          <div className="space-y-2">
            {risks.slice(0, 4).map((risk) => (
              <div key={risk.segment.id} className="rounded-lg border border-white/8 bg-navy-950/50 p-2.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10.5px] font-bold text-slate-200">{risk.segment.trackId}</span>
                    <StatusChip status={risk.segment.status} />
                  </div>
                  <span
                    className={`font-mono text-[13px] font-bold ${
                      risk.risk >= 75 ? 'text-red-300' : risk.risk >= 55 ? 'text-amber-300' : 'text-emerald-300'
                    }`}
                  >
                    {risk.risk}
                  </span>
                </div>
                <p className="mt-1 truncate text-[10px] text-slate-400">{risk.segment.name}</p>
                <div className="mt-1.5">
                  <Meter
                    value={risk.risk}
                    tone={risk.risk >= 75 ? 'bg-red-400' : risk.risk >= 55 ? 'bg-amber-400' : 'bg-emerald-400'}
                  />
                </div>
                <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[9px] text-slate-500">
                  <span className="text-green-400">{risk.recommendation}</span>
                  <span className="font-mono">{risk.window}</span>
                </div>
                <p className="mt-1 text-[9px] leading-relaxed text-slate-600">{risk.drivers.join(' Â· ')}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="overflow-x-auto border-t border-white/8">
          <table className="data-table min-w-[720px]">
            <thead>
              <tr>
                <th>Section</th>
                <th>Condition</th>
                <th>Peak</th>
                <th>Exceedances</th>
                <th>Risk</th>
                <th>Window</th>
                <th>Recommendation</th>
              </tr>
            </thead>
            <tbody>
              {risks.map((risk) => (
                <tr key={risk.segment.id}>
                  <td>
                    <Link
                      href={`/portal/network?section=${risk.segment.trackId}`}
                      className="font-mono text-[10px] font-semibold text-green-400 hover:text-green-300"
                    >
                      {risk.segment.trackId}
                    </Link>
                    <span className="ml-2 text-[10px] text-slate-500">{risk.segment.name}</span>
                  </td>
                  <td className="font-mono text-[10.5px] text-slate-300">{risk.condition}</td>
                  <td className="font-mono text-[10.5px] text-slate-300">{risk.peakVibration.toFixed(1)}</td>
                  <td className="font-mono text-[10.5px] text-slate-300">{risk.exceedances}</td>
                  <td
                    className={`font-mono text-[11px] font-bold ${
                      risk.risk >= 75 ? 'text-red-300' : risk.risk >= 55 ? 'text-amber-300' : 'text-emerald-300'
                    }`}
                  >
                    {risk.risk}
                  </td>
                  <td className="text-[10px] text-slate-400">{risk.window}</td>
                  <td className="text-[10px] text-slate-400">{risk.recommendation}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <div className="grid gap-4 xl:grid-cols-[1.3fr_1fr] sm:gap-5">
        <Panel>
          <PanelHeader
            eyebrow="Department performance"
            title="Workflow load by department"
            description="Open reports and section coverage per department."
          />
          {rollups.length === 0 ? (
            <EmptyState title="No departments" description="Departments have not been provisioned." />
          ) : (
            <div className="overflow-x-auto">
              <table className="data-table min-w-[560px]">
                <thead>
                  <tr>
                    <th>Department</th>
                    <th>Discipline</th>
                    <th>Sections</th>
                    <th>Open reports</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {rollups.map((rollup) => (
                    <tr key={rollup.department.id}>
                      <td>
                        <Link
                          href={`/portal/departments/${rollup.department.slug}`}
                          className="text-[10.5px] font-semibold text-slate-300 hover:text-green-300"
                        >
                          {rollup.department.name}
                        </Link>
                      </td>
                      <td className="text-[9.5px] capitalize text-slate-500">
                        {titleCase(rollup.department.discipline)}
                      </td>
                      <td className="font-mono text-[10px] text-slate-400">{rollup.segmentsTouched}</td>
                      <td className="font-mono text-[10px] text-slate-400">{rollup.openReports}</td>
                      <td>
                        <StatusChip status={rollup.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>

        <Panel>
          <PanelHeader
            eyebrow="Environment"
            title="Track & ambient conditions"
            description="Environmental readings recorded alongside telemetry."
          />
          {environment.length === 0 ? (
            <EmptyState title="No environmental data" description="No readings recorded." icon={Droplets} />
          ) : (
            <div className="divide-y divide-white/6">
              {environment.map((reading) => {
                const segment = snapshot.segments.find((row) => row.id === reading.segmentId)
                return (
                  <div key={reading.id} className="px-4 py-2.5 sm:px-5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-[10px] font-semibold text-slate-300">
                        {segment?.trackId}
                      </span>
                      <span className="font-mono text-[9px] text-slate-600">{formatShort(reading.capturedAt)}</span>
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[9.5px] text-slate-500">
                      <span className="inline-flex items-center gap-1">
                        <Thermometer className="h-2.5 w-2.5 text-amber-300" aria-hidden />
                        {reading.ambientTempC.toFixed(1)}Â°C ambient
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Thermometer className="h-2.5 w-2.5 text-red-300" aria-hidden />
                        {reading.trackTempC.toFixed(1)}Â°C rail
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Droplets className="h-2.5 w-2.5 text-sky-300" aria-hidden />
                        {reading.rainfallMm.toFixed(1)} mm rain
                      </span>
                      <span>{reading.humidityPct.toFixed(0)}% RH</span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </Panel>
      </div>
    </div>
  )
}

