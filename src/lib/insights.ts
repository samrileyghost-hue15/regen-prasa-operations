import { clamp } from './format'
import type {
  Alert,
  Department,
  MaintenanceReport,
  OperationsSnapshot,
  Segment,
  TelemetryReading,
  TrainMovement,
  WorkflowStage,
} from './types'

/**
 * Derived operational intelligence.
 *
 * Everything here is a pure function of the snapshot so that the Operations
 * Centre, the network map and the analytics workspace always agree.
 */

/**
 * Demo datasets are frozen at a fixed moment. When the newest record is more
 * than six hours old we treat that record as "now" so that relative windows
 * ("last 24 hours") stay meaningful without pretending the feed is live.
 */
export function operationalNow(snapshot: OperationsSnapshot): number {
  const candidates = [
    snapshot.telemetry[0]?.capturedAt,
    snapshot.movements[0]?.detectedAt,
    snapshot.messages[0]?.sentAt,
  ]
    .filter(Boolean)
    .map((value) => new Date(value as string).getTime())

  const newest = candidates.length ? Math.max(...candidates) : Date.now()
  const now = Date.now()
  return now - newest > 6 * 3_600_000 ? newest : now
}

export function withinHours(iso: string, hours: number, now: number): boolean {
  return now - new Date(iso).getTime() <= hours * 3_600_000
}

export const OPEN_STAGES: WorkflowStage[] = [
  'reported',
  'verified',
  'assessed',
  'awaiting-authorisation',
  'authorised',
  'in-progress',
]

export type OverviewKpis = {
  sectionsOperational: number
  sectionsTotal: number
  sensorsOnline: number
  sensorsTotal: number
  movements24h: number
  openAlerts: number
  criticalAlerts: number
  openReports: number
  awaitingAuthorisation: number
  staffOnline: number
  staffTotal: number
  vibrationNow: number | null
  vibrationDelta: number
  liveSensorCount: number
}

export function buildKpis(snapshot: OperationsSnapshot): OverviewKpis {
  const now = operationalNow(snapshot)
  const kp01 = snapshot.telemetry.filter((row) => row.sensorId === 'REGEN-EDGE-KP01')
  const latest = kp01[0]
  const previous = kp01[1]
  const openAlerts = snapshot.alerts.filter((alert) => alert.status !== 'resolved')

  return {
    sectionsOperational: snapshot.segments.filter((segment) => segment.status !== 'offline').length,
    sectionsTotal: snapshot.segments.length,
    sensorsOnline: snapshot.sensors.filter((sensor) => sensor.status === 'online').length,
    sensorsTotal: snapshot.sensors.length,
    movements24h: snapshot.movements.filter((movement) => withinHours(movement.detectedAt, 24, now)).length,
    openAlerts: openAlerts.length,
    criticalAlerts: openAlerts.filter((alert) => alert.severity === 'critical').length,
    openReports: snapshot.reports.filter((report) => OPEN_STAGES.includes(report.stage)).length,
    awaitingAuthorisation: snapshot.reports.filter((report) => report.stage === 'awaiting-authorisation')
      .length,
    staffOnline: snapshot.employees.filter((employee) => employee.isOnline).length,
    staffTotal: snapshot.employees.length,
    vibrationNow: latest ? latest.vibrationVelocity : null,
    vibrationDelta:
      latest && previous ? Number((latest.vibrationVelocity - previous.vibrationVelocity).toFixed(2)) : 0,
    liveSensorCount: snapshot.sensors.filter((sensor) => !sensor.isSimulated).length,
  }
}

/* ────────────────────────────── Charts ────────────────────────────── */

export type TrendPoint = { label: string; value: number; simulated: boolean; at: string }

export function vibrationSeries(
  snapshot: OperationsSnapshot,
  sensorId = 'REGEN-EDGE-KP01',
  limit = 36,
): TrendPoint[] {
  return snapshot.telemetry
    .filter((row) => row.sensorId === sensorId)
    .slice(0, limit)
    .reverse()
    .map((row) => ({
      label: new Date(row.capturedAt).toISOString().slice(11, 16),
      value: row.vibrationVelocity,
      simulated: row.isSimulated,
      at: row.capturedAt,
    }))
}

export function movementsByHour(snapshot: OperationsSnapshot, hours = 12): { label: string; count: number }[] {
  const now = operationalNow(snapshot)
  const buckets: { label: string; count: number }[] = []
  for (let offset = hours - 1; offset >= 0; offset -= 1) {
    const end = now - offset * 3_600_000
    const start = end - 3_600_000
    const count = snapshot.movements.filter((movement) => {
      const at = new Date(movement.detectedAt).getTime()
      return at > start && at <= end
    }).length
    const hourLabel = new Date(end + 120 * 60_000).toISOString().slice(11, 13)
    buckets.push({ label: `${hourLabel}:00`, count })
  }
  return buckets
}

export function conditionDistribution(segments: Segment[]) {
  return (['normal', 'warning', 'critical', 'offline'] as const).map((status) => ({
    status,
    count: segments.filter((segment) => segment.status === status).length,
  }))
}

/* ─────────────────────── Predictive maintenance ───────────────────── */

export type RiskItem = {
  segment: Segment
  risk: number
  peakVibration: number
  exceedances: number
  condition: number
  window: string
  recommendation: string
  drivers: string[]
}

/**
 * A transparent, rule-based risk score — the prototype's stand-in for the
 * predictive model that REGEN will train on real telemetry.
 */
export function predictiveRisks(snapshot: OperationsSnapshot): RiskItem[] {
  const now = operationalNow(snapshot)

  return snapshot.segments
    .map((segment) => {
      const related = snapshot.movements.filter((movement) => movement.segmentId === segment.id)
      const recent = related.filter((movement) => withinHours(movement.detectedAt, 30 * 24, now))
      const peaks = recent.map((movement) => movement.peakVibration ?? 0)
      const peakVibration = peaks.length ? Math.max(...peaks) : 0
      const exceedances = peaks.filter((value) => value >= 10).length

      const assessment = snapshot.assessments
        .filter((row) => row.segmentId === segment.id)
        .sort((a, b) => (a.assessedAt < b.assessedAt ? 1 : -1))[0]
      const condition = assessment?.score ?? segment.conditionScore

      const openCritical = snapshot.alerts.filter(
        (alert) =>
          alert.segmentId === segment.id &&
          alert.status !== 'resolved' &&
          ['critical', 'high'].includes(alert.severity),
      ).length

      const risk = Math.round(
        clamp(
          (100 - condition) * 1.15 +
            exceedances * 7 +
            (peakVibration > 12 ? 12 : 0) +
            openCritical * 5 +
            (segment.status === 'critical' ? 10 : segment.status === 'warning' ? 4 : 0),
          2,
          99,
        ),
      )

      const drivers: string[] = []
      if (condition < 80) drivers.push(`Condition index ${condition}`)
      if (exceedances > 0) drivers.push(`${exceedances} vibration exceedances`)
      if (peakVibration > 12) drivers.push(`Peak ${peakVibration.toFixed(1)} mm/s`)
      if (openCritical > 0) drivers.push(`${openCritical} open high-priority alert`)
      if (!drivers.length) drivers.push('No adverse indicators')

      const window =
        risk >= 75 ? '7 – 14 days' : risk >= 55 ? '30 days' : risk >= 35 ? '90 days' : 'Routine cycle'

      const recommendation =
        risk >= 75
          ? 'Immediate inspection and possession planning'
          : risk >= 55
            ? 'Schedule intervention at the next possession'
            : risk >= 35
              ? 'Increase monitoring frequency'
              : 'Continue routine inspections'

      return {
        segment,
        risk,
        peakVibration,
        exceedances,
        condition,
        window,
        recommendation,
        drivers,
      }
    })
    .sort((a, b) => b.risk - a.risk)
}

/* ──────────────────────── Department rollups ──────────────────────── */

export type DepartmentRollup = {
  department: Department
  openReports: number
  segmentsTouched: number
  status: Segment['status']
}

export function departmentRollups(snapshot: OperationsSnapshot): DepartmentRollup[] {
  return snapshot.departments.map((department) => {
    const openReports = snapshot.reports.filter(
      (report) => report.departmentSlug === department.slug && OPEN_STAGES.includes(report.stage),
    ).length
    const segmentsTouched = snapshot.segments.filter((segment) =>
      segment.departmentSlugs.includes(department.slug),
    ).length
    const degrading = snapshot.reports.some(
      (report) =>
        report.departmentSlug === department.slug &&
        ['critical', 'high'].includes(report.severity) &&
        OPEN_STAGES.includes(report.stage),
    )
    const status: Segment['status'] =
      department.status === 'offline'
        ? 'offline'
        : openReports >= 2 || degrading
          ? 'warning'
          : department.status
    return { department, openReports, segmentsTouched, status }
  })
}

/* ────────────────────────── Registry filters ───────────────────────── */

export function reportsFor(
  snapshot: OperationsSnapshot,
  filter: { stage?: WorkflowStage; departmentSlug?: string; search?: string } = {},
): MaintenanceReport[] {
  return snapshot.reports
    .filter((report) => (filter.stage ? report.stage === filter.stage : true))
    .filter((report) => (filter.departmentSlug ? report.departmentSlug === filter.departmentSlug : true))
    .filter((report) =>
      filter.search
        ? `${report.reference} ${report.title} ${report.description}`
            .toLowerCase()
            .includes(filter.search.toLowerCase())
        : true,
    )
    .sort((a, b) => (a.reportedAt < b.reportedAt ? 1 : -1))
}

export function movementsFor(
  snapshot: OperationsSnapshot,
  filter: { segmentId?: string; hours?: number } = {},
): TrainMovement[] {
  const now = operationalNow(snapshot)
  return snapshot.movements
    .filter((movement) => (filter.segmentId ? movement.segmentId === filter.segmentId : true))
    .filter((movement) => (filter.hours ? withinHours(movement.detectedAt, filter.hours, now) : true))
    .sort((a, b) => (a.detectedAt < b.detectedAt ? 1 : -1))
}

export function alertsFor(snapshot: OperationsSnapshot, segmentId?: string): Alert[] {
  return snapshot.alerts
    .filter((alert) => (segmentId ? alert.segmentId === segmentId : true))
    .sort((a, b) => (a.occurredAt < b.occurredAt ? 1 : -1))
}

export function telemetryFor(snapshot: OperationsSnapshot, sensorId: string): TelemetryReading[] {
  return snapshot.telemetry.filter((row) => row.sensorId === sensorId)
}

export function sensorForSegment(snapshot: OperationsSnapshot, segmentId: string) {
  return snapshot.sensors.find((sensor) => sensor.segmentId === segmentId) ?? null
}

export function formatPeak(value: number | null): string {
  return value === null ? '—' : `${value.toFixed(1)} mm/s`
}
