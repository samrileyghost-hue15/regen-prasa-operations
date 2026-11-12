import type { Metadata } from 'next'
import Link from 'next/link'
import {
  Activity,
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  Cable,
  Cpu,
  Gauge,
  MapPin,
  Radio,
  Ruler,
  Thermometer,
  Timer,
  TrainFront,
  Wifi,
} from 'lucide-react'

import { SensorTrend } from '@/components/charts/SensorTrend'
import { PilotControls } from '@/components/sensor/PilotControls'
import {
  Chip,
  DataSourceNote,
  EmptyState,
  KeyValue,
  LiveBadge,
  Meter,
  PageHeading,
  Panel,
  PanelHeader,
  SeverityChip,
  StatusChip,
} from '@/components/ui/primitives'
import { requireUser } from '@/lib/auth'
import { formatAge, formatFull, formatShort, formatTime } from '@/lib/format'
import { alertsFor, operationalNow } from '@/lib/insights'
import { can } from '@/lib/permissions'
import { dataSource, loadSnapshot } from '@/lib/store'

export const metadata: Metadata = { title: 'Kempton Park pilot' }
export const dynamic = 'force-dynamic'

const SENSOR_ID = 'REGEN-EDGE-KP01'
const REVIEW_THRESHOLD = 10

export default async function KemptonParkPage() {
  const user = await requireUser()
  const snapshot = await loadSnapshot()
  const now = operationalNow(snapshot)

  const device = snapshot.sensors.find((sensor) => sensor.sensorId === SENSOR_ID)
  const segment = device ? snapshot.segments.find((row) => row.id === device.segmentId) : undefined
  const readings = snapshot.telemetry.filter((row) => row.sensorId === SENSOR_ID)
  const latest = readings[0]
  const previous = readings[1]

  const trend = [...readings]
    .slice(0, 36)
    .reverse()
    .map((row) => ({
      label: formatTime(row.capturedAt),
      value: row.vibrationVelocity,
      secondary: row.temperature,
      simulated: row.isSimulated,
    }))

  const temperatureTrend = [...readings]
    .slice(0, 36)
    .reverse()
    .filter((row) => row.temperature !== null)
    .map((row) => ({
      label: formatTime(row.capturedAt),
      value: row.temperature as number,
    }))

  const passages = snapshot.movements
    .filter((movement) => movement.sensorId === SENSOR_ID)
    .slice(0, 12)

  const passages24h = passages.filter(
    (movement) => now - new Date(movement.detectedAt).getTime() <= 24 * 3_600_000,
  )
  const peaks = passages.map((movement) => movement.peakVibration ?? 0)
  const peak24h = peaks.length ? Math.max(...peaks) : 0
  const exceedances = peaks.filter((value) => value >= REVIEW_THRESHOLD).length
  const simulatedReadings = readings.filter((row) => row.isSimulated).length

  const deviceAlerts = segment ? alertsFor(snapshot, segment.id).filter((alert) => alert.status !== 'resolved') : []

  if (!device || !segment) {
    return (
      <Panel>
        <EmptyState
          title="Pilot device not found"
          description="REGEN-EDGE-KP01 is not present in the active dataset. Check the sensor registration."
          icon={Radio}
        />
      </Panel>
    )
  }

  const delta = latest && previous ? Number((latest.vibrationVelocity - previous.vibrationVelocity).toFixed(1)) : 0

  return (
    <div className="space-y-4 sm:space-y-5">
      <PageHeading
        eyebrow="Pilot installation Â· Kempton Park"
        title="REGEN-EDGE-KP01"
        description="Temporary edge sensor on the Kempton Park â€“ Pretoria/Johannesburg pilot corridor. Streams vibration, ambient temperature and train-passage events into the REGEN database."
        actions={
          <>
            <Chip tone="bg-green-500/10 text-green-400 ring-green-500/30" dot>
              {device.status}
            </Chip>
            <PilotControls sensorId={device.sensorId} canSimulate={can.simulateTelemetry(user)} />
          </>
        }
      />

      {/* Data integrity banner */}
      <div className="flex flex-col gap-2 rounded-lg border border-amber-400/25 bg-amber-500/6 px-3.5 py-2.5 sm:flex-row sm:items-center sm:justify-between">
        <p className="flex items-start gap-2 text-[10.5px] leading-relaxed text-amber-200/90">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 flex-none" aria-hidden />
          <span>
            <strong className="font-bold uppercase tracking-[0.06em]">Device vs simulated.</strong>{' '}
            Readings marked <span className="font-semibold text-green-400">Device</span> are produced by the
            physical sensor channel. Readings marked{' '}
            <span className="font-semibold text-amber-300">Simulated</span> are generated values inserted for
            demonstration and are tagged in the database.
          </span>
        </p>
        <div className="flex-none self-start sm:self-auto">
          <DataSourceNote source={dataSource} />
        </div>
      </div>

      {/* Device + KPIs */}
      <div className="grid gap-4 xl:grid-cols-[1fr_1.6fr] sm:gap-5">
        <Panel>
          <PanelHeader
            eyebrow="Device identity"
            title="REGEN edge unit"
            action={<LiveBadge live={!device.isSimulated} label={device.isSimulated ? 'Simulated' : 'Physical'} />}
          />
          <div className="p-4 sm:p-5">
            <div className="flex items-center gap-3">
              <span className="grid h-11 w-11 flex-none place-items-center rounded-lg bg-green-500/10 text-green-400 ring-1 ring-inset ring-green-500/25">
                <Cpu className="h-5 w-5" aria-hidden />
              </span>
              <div className="min-w-0">
                <p className="truncate font-mono text-[13px] font-bold text-white">{device.sensorId}</p>
                <p className="truncate text-[10px] text-slate-500">
                  {segment.trackId} Â· {segment.name}
                </p>
              </div>
            </div>

            <div className="mt-3.5 space-y-3">
              <Meter
                value={device.signalQuality}
                tone={
                  device.signalQuality >= 80
                    ? 'bg-emerald-400'
                    : device.signalQuality >= 60
                      ? 'bg-amber-400'
                      : 'bg-red-400'
                }
                label="Signal quality"
                suffix="%"
              />
              <Meter
                value={device.status === 'online' ? 100 : device.status === 'degraded' ? 62 : 0}
                tone={device.status === 'online' ? 'bg-cyan-400' : device.status === 'degraded' ? 'bg-amber-400' : 'bg-slate-500'}
                label="Channel availability"
                suffix="%"
              />
            </div>

            <KeyValue
              items={[
                { label: 'Connection', value: <StatusChip status={segment.status} /> },
                { label: 'Firmware', value: <span className="font-mono">{device.firmware}</span> },
                { label: 'Installation', value: <span className="text-[10.5px]">{device.installationPoint}</span> },
                { label: 'Last transmission', value: formatShort(device.lastTransmission) },
                { label: 'Age', value: formatAge(device.lastTransmission, now) },
                { label: 'Site code', value: <span className="font-mono">{segment.siteCode}</span> },
                { label: 'Network coverage', value: <span className="text-amber-300">To be verified</span> },
                { label: 'Deployment', value: 'Temporary pilot' },
              ]}
            />

            <div className="mt-3 flex flex-wrap gap-1.5">
              {device.supportsVibration && (
                <Chip tone="bg-emerald-500/10 text-emerald-300 ring-emerald-500/25">
                  <Activity className="h-2.5 w-2.5" /> Vibration
                </Chip>
              )}
              {device.supportsTemperature && (
                <Chip tone="bg-sky-500/10 text-sky-300 ring-sky-500/25">
                  <Thermometer className="h-2.5 w-2.5" /> Temperature
                </Chip>
              )}
              {device.supportsStrain ? (
                <Chip tone="bg-violet-500/10 text-violet-300 ring-violet-500/25">
                  <Ruler className="h-2.5 w-2.5" /> Strain
                </Chip>
              ) : (
                <Chip tone="bg-white/6 text-slate-400 ring-white/10">
                  <Ruler className="h-2.5 w-2.5" /> Strain not supported
                </Chip>
              )}
            </div>
          </div>
        </Panel>

        <div className="space-y-4 sm:space-y-5">
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
            <div className="panel p-3.5">
              <div className="flex items-start justify-between">
                <p className="eyebrow text-green-400">Vibration</p>
                <Activity className="h-3.5 w-3.5 text-slate-500" aria-hidden />
              </div>
              <p className="mt-2.5 font-mono text-[22px] font-bold leading-none text-slate-100">
                {latest ? latest.vibrationVelocity.toFixed(1) : 'â€”'}
                <span className="ml-1 text-[11px] font-medium text-slate-500">mm/s</span>
              </p>
              <p className="mt-1.5 text-[10.5px] text-slate-500">
                {delta === 0 ? 'Steady' : `${delta > 0 ? '+' : ''}${delta} vs previous`}
              </p>
            </div>
            <div className="panel p-3.5">
              <div className="flex items-start justify-between">
                <p className="eyebrow text-sky-300">Temperature</p>
                <Thermometer className="h-3.5 w-3.5 text-slate-500" aria-hidden />
              </div>
              <p className="mt-2.5 font-mono text-[22px] font-bold leading-none text-slate-100">
                {latest?.temperature !== null && latest?.temperature !== undefined
                  ? latest.temperature.toFixed(1)
                  : 'â€”'}
                <span className="ml-1 text-[11px] font-medium text-slate-500">Â°C</span>
              </p>
              <p className="mt-1.5 text-[10.5px] text-slate-500">Rail-side ambient</p>
            </div>
            <div className="panel p-3.5">
              <div className="flex items-start justify-between">
                <p className="eyebrow text-violet-300">Structural strain</p>
                <Ruler className="h-3.5 w-3.5 text-slate-500" aria-hidden />
              </div>
              <p className="mt-2.5 font-mono text-[22px] font-bold leading-none text-slate-400">
                n/a
              </p>
              <p className="mt-1.5 text-[10.5px] text-slate-500">Not fitted to KP01</p>
            </div>
            <div className="panel p-3.5">
              <div className="flex items-start justify-between">
                <p className="eyebrow text-emerald-300">Signal quality</p>
                <Wifi className="h-3.5 w-3.5 text-slate-500" aria-hidden />
              </div>
              <p className="mt-2.5 font-mono text-[22px] font-bold leading-none text-slate-100">
                {device.signalQuality}
                <span className="ml-1 text-[11px] font-medium text-slate-500">%</span>
              </p>
              <p className="mt-1.5 text-[10.5px] text-slate-500">
                {device.channels.filter((channel) => channel.status === 'streaming').length}/{device.channels.length} channels streaming
              </p>
            </div>
            <div className="panel p-3.5">
              <div className="flex items-start justify-between">
                <p className="eyebrow text-amber-300">Passages Â· 24h</p>
                <TrainFront className="h-3.5 w-3.5 text-slate-500" aria-hidden />
              </div>
              <p className="mt-2.5 font-mono text-[22px] font-bold leading-none text-slate-100">
                {passages24h.length}
              </p>
              <p className="mt-1.5 text-[10.5px] text-slate-500">Peak {peak24h.toFixed(1)} mm/s</p>
            </div>
            <div className="panel p-3.5">
              <div className="flex items-start justify-between">
                <p className="eyebrow text-red-300">Threshold breaches</p>
                <Gauge className="h-3.5 w-3.5 text-slate-500" aria-hidden />
              </div>
              <p className={`mt-2.5 font-mono text-[22px] font-bold leading-none ${exceedances > 0 ? 'text-red-300' : 'text-slate-100'}`}>
                {exceedances}
              </p>
              <p className="mt-1.5 text-[10.5px] text-slate-500">â‰¥ {REVIEW_THRESHOLD} mm/s review limit</p>
            </div>
          </div>

          <Panel>
            <PanelHeader
              eyebrow="Telemetry Â· REGEN_KP01_TELEMETRY"
              title="Vibration velocity"
              description={`Rolling window of the last ${trend.length} readings. Red line marks the ${REVIEW_THRESHOLD} mm/s review threshold.`}
              action={
                <Chip tone={simulatedReadings > 0 ? 'bg-amber-500/10 text-amber-300 ring-amber-500/30' : 'bg-green-500/10 text-green-400 ring-green-500/30'}>
                  {simulatedReadings > 0 ? `${simulatedReadings} simulated` : 'All device'}
                </Chip>
              }
            />
            <div className="p-2 sm:p-3">
              {trend.length > 1 ? (
                <SensorTrend data={trend} kind="vibration" threshold={REVIEW_THRESHOLD} height={200} unit=" mm/s" />
              ) : (
                <EmptyState title="No readings yet" description="The telemetry channel has not reported." />
              )}
            </div>
          </Panel>
        </div>
      </div>

      {/* Channels + temperature */}
      <div className="grid gap-4 xl:grid-cols-[1fr_1.25fr] sm:gap-5">
        <Panel>
          <PanelHeader
            eyebrow="Database channels"
            title="Streaming interfaces"
            description="Each channel maps to a Supabase table / MQTT topic used by the REGEN database."
          />
          <div className="divide-y divide-white/6">
            {device.channels.map((channel) => (
              <div key={channel.name} className="flex items-center gap-3 px-4 py-3 sm:px-5">
                <span className="grid h-8 w-8 flex-none place-items-center rounded-md bg-white/5 text-slate-400">
                  <Cable className="h-3.5 w-3.5" aria-hidden />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-mono text-[10.5px] font-semibold text-slate-200">{channel.name}</p>
                  <p className="mt-0.5 text-[9.5px] uppercase tracking-[0.06em] text-slate-500">
                    {channel.kind} Â· {channel.rateHz} Hz
                  </p>
                </div>
                <Chip
                  tone={
                    channel.status === 'streaming'
                      ? 'bg-emerald-500/10 text-emerald-300 ring-emerald-500/30'
                      : channel.status === 'degraded'
                        ? 'bg-amber-500/10 text-amber-300 ring-amber-500/30'
                        : 'bg-white/6 text-slate-400 ring-white/10'
                  }
                  dot
                >
                  {channel.status}
                </Chip>
              </div>
            ))}
          </div>
          <div className="border-t border-white/8 px-4 py-3 sm:px-5">
            <KeyValue
              items={[
                { label: 'Schema owner', value: 'REGEN central database' },
                { label: 'Persistence', value: 'Supabase Â· PostgreSQL' },
                { label: 'Ingest transport', value: 'MQTT over TLS / secure API' },
                { label: 'Readings stored', value: readings.length },
                { label: 'Latest reading ID', value: <span className="font-mono text-[10px]">{latest?.readingId ?? 'â€”'}</span> },
              ]}
            />
          </div>
        </Panel>

        <Panel>
          <PanelHeader
            eyebrow="REGEN_KP01_SIGNAL_BUS"
            title="Ambient temperature"
            description="Auxiliary temperature channel reported alongside each telemetry frame."
            action={<LiveBadge live={!device.isSimulated} label={device.isSimulated ? 'Simulated' : 'Device'} />}
          />
          <div className="p-2 sm:p-3">
            {temperatureTrend.length > 1 ? (
              <SensorTrend data={temperatureTrend} kind="temperature" height={200} unit=" Â°C" />
            ) : (
              <EmptyState title="No temperature frames" description="This device revision does not report temperature." />
            )}
          </div>
          <div className="border-t border-white/8 px-4 py-3 sm:px-5">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[10px] text-slate-500">
              <span className="flex items-center gap-1.5">
                <Timer className="h-3 w-3" aria-hidden />
                Last frame {latest ? formatTime(latest.capturedAt) : 'â€”'}
              </span>
              <span className="flex items-center gap-1.5">
                <MapPin className="h-3 w-3" aria-hidden />
                {segment.trackId} Â· KM {segment.startKm.toFixed(1)}
              </span>
              <span className="flex items-center gap-1.5">
                <Cpu className="h-3 w-3" aria-hidden />
                {device.firmware}
              </span>
            </div>
          </div>
        </Panel>
      </div>

      {/* Train-passing events */}
      <Panel>
        <PanelHeader
          eyebrow="REGEN_KP01_EVENTS"
          title="Train-passing events"
          description="Every passage detected by the edge unit, with direction, peak vibration and processing status."
          action={
            <Link
              href="/portal/movements"
              className="text-[10px] font-bold uppercase tracking-[0.08em] text-green-400 hover:text-green-300"
            >
              Full register
            </Link>
          }
        />
        {passages.length === 0 ? (
          <EmptyState
            title="No passages recorded"
            description="The events channel has not detected a train yet."
            icon={TrainFront}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table min-w-[680px]">
              <thead>
                <tr>
                  <th>Event</th>
                  <th>Detected</th>
                  <th>Direction</th>
                  <th>Peak vibration</th>
                  <th>Duration</th>
                  <th>Source</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {passages.map((movement) => (
                  <tr key={movement.id}>
                    <td className="font-mono text-[10px] font-semibold text-slate-300">{movement.movementId}</td>
                    <td>
                      <span className="text-[10.5px] text-slate-300">{formatTime(movement.detectedAt)}</span>
                      <span className="ml-1.5 text-[9px] text-slate-600">{formatAge(movement.detectedAt, now)}</span>
                    </td>
                    <td>
                      <span className="inline-flex items-center gap-1 text-[10.5px] capitalize text-slate-400">
                        {movement.direction === 'up' ? (
                          <ArrowUp className="h-2.5 w-2.5 text-sky-300" aria-hidden />
                        ) : (
                          <ArrowDown className="h-2.5 w-2.5 text-violet-300" aria-hidden />
                        )}
                        {movement.direction}
                      </span>
                    </td>
                    <td
                      className={`font-mono text-[11px] ${
                        (movement.peakVibration ?? 0) >= REVIEW_THRESHOLD ? 'font-bold text-red-300' : 'text-slate-300'
                      }`}
                    >
                      {movement.peakVibration !== null ? `${movement.peakVibration.toFixed(1)} mm/s` : 'â€”'}
                    </td>
                    <td className="font-mono text-[10px] text-slate-500">
                      {movement.durationSeconds !== null ? `${movement.durationSeconds}s` : 'â€”'}
                    </td>
                    <td className="text-[10px] text-slate-500">{movement.source}</td>
                    <td>
                      <SeverityChip severity={movement.reviewStatus === 'normal' ? 'low' : movement.reviewStatus === 'review' ? 'high' : 'critical'} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="border-t border-white/8 px-4 py-2.5 text-[9.5px] text-slate-600 sm:px-5">
          Events arrive on the events channel and are written to the train-movement register before the
          Operational Centre is notified.
        </div>
      </Panel>

      {/* Related alerts */}
      <Panel>
        <PanelHeader
          eyebrow="Linked escalations"
          title="Alerts on the pilot section"
          action={<Chip tone="bg-red-500/12 text-red-300 ring-red-500/30">{deviceAlerts.length}</Chip>}
        />
        {deviceAlerts.length === 0 ? (
          <EmptyState title="No open alerts" description="The pilot section is reporting normal conditions." />
        ) : (
          <div className="divide-y divide-white/6">
            {deviceAlerts.map((alert) => (
              <div key={alert.id} className="px-4 py-3 sm:px-5">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <SeverityChip severity={alert.severity} />
                    <span className="font-mono text-[9.5px] text-slate-600">{alert.reference}</span>
                  </div>
                  <span className="text-[9.5px] text-slate-600">{formatFull(alert.occurredAt)}</span>
                </div>
                <p className="mt-1 text-[11.5px] font-semibold leading-snug text-slate-200">{alert.title}</p>
                <p className="mt-0.5 text-[10.5px] leading-relaxed text-slate-500">{alert.detail}</p>
              </div>
            ))}
          </div>
        )}
      </Panel>
    </div>
  )
}

