'use client'

import Link from 'next/link'
import { useEffect, useMemo, useRef, useState } from 'react'
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  ChevronRight,
  Clock,
  Compass,
  Layers,
  Maximize2,
  Minus,
  Plus,
  Radio,
  TrainFront,
  Wrench,
} from 'lucide-react'

import { Sparkline } from '@/components/charts/Sparkline'
import {
  Chip,
  EmptyState,
  KeyValue,
  Panel,
  PanelHeader,
  SeverityChip,
  StageChip,
  StatusChip,
} from '@/components/ui/primitives'
import { formatShort, formatTime } from '@/lib/format'
import { STATUS_COLOURS } from '@/lib/tokens'
import type {
  Alert,
  ConditionAssessment,
  MaintenanceReport,
  NetworkNode,
  Segment,
  SensorDevice,
  TelemetryReading,
  TrainMovement,
  TrainRun,
} from '@/lib/types'

type Props = {
  segments: Segment[]
  nodes: NetworkNode[]
  trains: TrainRun[]
  sensors: SensorDevice[]
  alerts: Alert[]
  reports: MaintenanceReport[]
  assessments: ConditionAssessment[]
  telemetry: TelemetryReading[]
  movements: TrainMovement[]
  initialSection?: string
}

const BOARD_WIDTH = 1000
const BOARD_HEIGHT = 420

export function NetworkWorkspace({
  segments,
  nodes,
  trains,
  sensors,
  alerts,
  reports,
  assessments,
  telemetry,
  movements,
  initialSection,
}: Props) {
  const [selectedTrack, setSelectedTrack] = useState(
    segments.find((segment) => segment.trackId === initialSection)?.trackId ?? segments[0]?.trackId ?? '',
  )
  const [zoom, setZoom] = useState(1)
  const [showTrains, setShowTrains] = useState(true)
  const [positions, setPositions] = useState<Record<string, number>>(() =>
    Object.fromEntries(trains.map((train) => [train.id, train.progress])),
  )
  const directionRef = useRef<Record<string, 1 | -1>>({})

  const nodeById = useMemo(() => new Map(nodes.map((node) => [node.id, node])), [nodes])
  const segmentById = useMemo(() => new Map(segments.map((segment) => [segment.id, segment])), [segments])

  const selected = segments.find((segment) => segment.trackId === selectedTrack) ?? segments[0]

  // Train tokens travel along their section and bounce at each end.
  useEffect(() => {
    if (!showTrains) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    let frame = 0
    let last = performance.now()
    const step = (now: number) => {
      const dt = Math.min(120, now - last) / 1000
      last = now
      setPositions((current) => {
        const next: Record<string, number> = { ...current }
        for (const train of trains) {
          const direction = directionRef.current[train.id] ?? 1
          const speed = train.speedKph / 420
          let progress = (current[train.id] ?? 0) + direction * speed * dt
          if (progress > 1) {
            progress = 1
            directionRef.current[train.id] = -1
          } else if (progress < 0) {
            progress = 0
            directionRef.current[train.id] = 1
          } else {
            directionRef.current[train.id] = direction
          }
          next[train.id] = progress
        }
        return next
      })
      frame = requestAnimationFrame(step)
    }
    frame = requestAnimationFrame(step)
    return () => cancelAnimationFrame(frame)
  }, [showTrains, trains])

  const openAlertsFor = (segmentId: string) =>
    alerts.filter((alert) => alert.segmentId === segmentId && alert.status !== 'resolved')

  const selectedSensor = sensors.find((sensor) => sensor.segmentId === selected.id)
  const selectedReports = reports.filter((report) => report.segmentId === selected.id)
  const selectedAssessments = assessments
    .filter((assessment) => assessment.segmentId === selected.id)
    .sort((a, b) => (a.assessedAt < b.assessedAt ? 1 : -1))
  const selectedAlerts = openAlertsFor(selected.id)
  const selectedMovements = movements.filter((movement) => movement.segmentId === selected.id).slice(0, 5)
  const series = telemetry
    .filter((row) => row.sensorId === selectedSensor?.sensorId)
    .slice(0, 30)
    .reverse()

  return (
    <div className="grid gap-4 xl:grid-cols-[1.62fr_1fr] sm:gap-5">
      <div className="space-y-4 sm:space-y-5">
        <Panel className="overflow-hidden">
          <PanelHeader
            eyebrow="Interactive railway visualisation"
            title="Gauteng network schematic"
            description="Select any section to inspect condition, sensor readings and maintenance history."
            action={
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setShowTrains((current) => !current)}
                  className={`rounded-md border px-2 py-1 text-[10px] font-bold uppercase tracking-[0.06em] transition-colors ${
                    showTrains
                      ? 'border-green-500/40 bg-green-500/12 text-green-300'
                      : 'border-white/10 text-slate-400'
                  }`}
                >
                  Trains
                </button>
                <div className="flex items-center overflow-hidden rounded-md border border-white/10">
                  <button
                    onClick={() => setZoom((current) => Math.max(1, Number((current - 0.25).toFixed(2))))}
                    className="grid h-6 w-6 place-items-center text-slate-400 hover:bg-white/6"
                    aria-label="Zoom out"
                  >
                    <Minus className="h-3 w-3" />
                  </button>
                  <span className="w-8 text-center font-mono text-[9.5px] text-slate-400">
                    {zoom.toFixed(2)}Ã—
                  </span>
                  <button
                    onClick={() => setZoom((current) => Math.min(2, Number((current + 0.25).toFixed(2))))}
                    className="grid h-6 w-6 place-items-center text-slate-400 hover:bg-white/6"
                    aria-label="Zoom in"
                  >
                    <Plus className="h-3 w-3" />
                  </button>
                </div>
              </div>
            }
          />

          {/* Section switcher for touch devices */}
          <div className="no-scrollbar flex gap-1.5 overflow-x-auto border-b border-white/8 px-3 py-2 xl:hidden">
            {segments.map((segment) => (
              <button
                key={segment.id}
                onClick={() => setSelectedTrack(segment.trackId)}
                className={`flex flex-none items-center gap-1.5 rounded-md border px-2 py-1 text-[10px] font-semibold transition-colors ${
                  segment.trackId === selectedTrack
                    ? 'border-green-500/40 bg-green-500/12 text-green-100'
                    : 'border-white/8 text-slate-400'
                }`}
              >
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ backgroundColor: STATUS_COLOURS[segment.status].hex }}
                />
                {segment.trackId}
              </button>
            ))}
          </div>

          <div className="relative overflow-x-auto bg-navy-950/60">
            <div
              className="relative mx-auto"
              style={{ minWidth: zoom > 1 ? `${720 * zoom}px` : '720px', width: '100%' }}
            >
              <svg
                viewBox={`0 0 ${BOARD_WIDTH} ${BOARD_HEIGHT}`}
                className="block h-auto w-full"
                role="img"
                aria-label="Schematic map of the Gauteng railway network with section condition"
              >
                <defs>
                  <pattern id="map-grid" width="34" height="34" patternUnits="userSpaceOnUse">
                    <path d="M34 0H0V34" fill="none" stroke="rgba(148,197,255,0.06)" strokeWidth="1" />
                  </pattern>
                  <filter id="map-glow" x="-40%" y="-40%" width="180%" height="180%">
                    <feGaussianBlur stdDeviation="4" result="blur" />
                    <feMerge>
                      <feMergeNode in="blur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>

                <rect width={BOARD_WIDTH} height={BOARD_HEIGHT} fill="url(#map-grid)" />

                {/* Park/ line labels */}
                <text x="60" y="52" fill="rgba(148,163,184,0.5)" fontSize="11" fontWeight="700" letterSpacing="1.5">
                  PRETORIA CORRIDOR
                </text>
                <text x="60" y="316" fill="rgba(148,163,184,0.5)" fontSize="11" fontWeight="700" letterSpacing="1.5">
                  GERMISTON â‡„ JOHANNESBURG
                </text>

                {segments.map((segment) => {
                  const from = nodeById.get(segment.fromNode)
                  const to = nodeById.get(segment.toNode)
                  if (!from || !to) return null
                  const colour = STATUS_COLOURS[segment.status].hex
                  const isSelected = segment.trackId === selectedTrack
                  const midX = (from.x + to.x) / 2
                  const midY = (from.y + to.y) / 2
                  const segmentAlerts = openAlertsFor(segment.id)

                  return (
                    <g key={segment.id}>
                      {/* selection halo */}
                      {isSelected && (
                        <line
                          x1={from.x}
                          y1={from.y}
                          x2={to.x}
                          y2={to.y}
                          stroke="rgba(34,211,238,0.28)"
                          strokeWidth="16"
                          strokeLinecap="round"
                        />
                      )}
                      {/* track bed */}
                      <line
                        x1={from.x}
                        y1={from.y}
                        x2={to.x}
                        y2={to.y}
                        stroke="#0b1a2b"
                        strokeWidth="10"
                        strokeLinecap="round"
                      />
                      {/* status colour */}
                      <line
                        x1={from.x}
                        y1={from.y}
                        x2={to.x}
                        y2={to.y}
                        stroke={colour}
                        strokeWidth="6"
                        strokeLinecap="round"
                        opacity={segment.status === 'offline' ? 0.55 : 1}
                        filter={isSelected ? 'url(#map-glow)' : undefined}
                      />
                      {/* sleeper tick pattern */}
                      <line
                        x1={from.x}
                        y1={from.y}
                        x2={to.x}
                        y2={to.y}
                        stroke="rgba(255,255,255,0.45)"
                        strokeWidth="1.2"
                        strokeDasharray="1.5 7"
                        strokeLinecap="round"
                      />
                      {/* generous hit area */}
                      <line
                        x1={from.x}
                        y1={from.y}
                        x2={to.x}
                        y2={to.y}
                        stroke="transparent"
                        strokeWidth="24"
                        strokeLinecap="round"
                        className="cursor-pointer"
                        onClick={() => setSelectedTrack(segment.trackId)}
                      />
                      <text
                        x={midX}
                        y={midY - 12}
                        textAnchor="middle"
                        fontSize="10.5"
                        fontWeight="700"
                        fill={isSelected ? '#a5f3fc' : 'rgba(203,213,225,0.75)'}
                        className="pointer-events-none select-none"
                      >
                        {segment.trackId}
                      </text>

                      {segmentAlerts.some((alert) => alert.severity === 'critical') && (
                        <g transform={`translate(${midX + 20}, ${midY - 20})`}>
                          <circle r="9" fill="rgba(239,68,68,0.18)" />
                          <circle r="5" fill="#ef4444" />
                          <circle r="9" fill="none" stroke="#ef4444" strokeWidth="1" opacity="0.5" />
                        </g>
                      )}
                    </g>
                  )
                })}

                {/* Sensors */}
                {sensors.map((sensor) => {
                  const segment = segmentById.get(sensor.segmentId)
                  if (!segment) return null
                  const from = nodeById.get(segment.fromNode)
                  const to = nodeById.get(segment.toNode)
                  if (!from || !to) return null
                  const x = from.x + (to.x - from.x) * 0.68
                  const y = from.y + (to.y - from.y) * 0.68
                  const colour = sensor.isSimulated ? '#f59e0b' : '#22d3ee'
                  return (
                    <g key={sensor.id} className="pointer-events-none">
                      <circle cx={x} cy={y} r="11" fill={`${colour}22`} />
                      <circle cx={x} cy={y} r="7" fill="#061120" stroke={colour} strokeWidth="1.6" />
                      <circle cx={x} cy={y} r="2.4" fill={colour} />
                      {!sensor.isSimulated && (
                        <circle cx={x} cy={y} r="11" fill="none" stroke={colour} strokeWidth="1" opacity="0.4" className="pulse-dot" />
                      )}
                    </g>
                  )
                })}

                {/* Nodes */}
                {nodes.map((node) => {
                  const isPilot = node.kind === 'pilot'
                  const isJunction = node.kind === 'junction'
                  return (
                    <g key={node.id} className="pointer-events-none">
                      <circle
                        cx={node.x}
                        cy={node.y}
                        r={isPilot ? 7 : isJunction ? 5.5 : 4.5}
                        fill={isPilot ? '#22d3ee' : '#0d2439'}
                        stroke={isPilot ? '#a5f3fc' : 'rgba(148,197,255,0.6)'}
                        strokeWidth="1.6"
                      />
                      <text
                        x={node.x}
                        y={node.y - 13}
                        textAnchor="middle"
                        fontSize="10"
                        fontWeight={isPilot ? '700' : '600'}
                        fill={isPilot ? '#a5f3fc' : 'rgba(148,163,184,0.85)'}
                      >
                        {node.name}
                      </text>
                      {isPilot && (
                        <text
                          x={node.x}
                          y={node.y + 22}
                          textAnchor="middle"
                          fontSize="8.5"
                          fontWeight="700"
                          letterSpacing="0.8"
                          fill="#22d3ee"
                        >
                          PILOT Â· KP01
                        </text>
                      )}
                    </g>
                  )
                })}

                {/* Trains */}
                {showTrains &&
                  trains.map((train) => {
                    const segment = segmentById.get(train.segmentId)
                    if (!segment) return null
                    const from = nodeById.get(segment.fromNode)
                    const to = nodeById.get(segment.toNode)
                    if (!from || !to) return null
                    const progress = positions[train.id] ?? train.progress
                    const x = from.x + (to.x - from.x) * progress
                    const y = from.y + (to.y - from.y) * progress
                    return (
                      <g key={train.id} className="pointer-events-none">
                        <rect
                          x={x - 8}
                          y={y - 4}
                          width="16"
                          height="8"
                          rx="2.5"
                          fill={train.isSimulated ? '#f59e0b' : '#e0f2fe'}
                          stroke="#061120"
                          strokeWidth="1"
                        />
                        <rect x={x - 8} y={y - 4} width="16" height="8" rx="2.5" fill="#0ea5e9" opacity="0.35" />
                      </g>
                    )
                  })}
              </svg>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-white/8 px-3 py-2.5 sm:px-4">
            {(Object.keys(STATUS_COLOURS) as (keyof typeof STATUS_COLOURS)[]).map((key) => (
              <span key={key} className="flex items-center gap-1.5 text-[10px] text-slate-400">
                <span
                  className="h-1.5 w-4 rounded-full"
                  style={{ backgroundColor: STATUS_COLOURS[key].hex }}
                />
                {STATUS_COLOURS[key].label}
              </span>
            ))}
            <span className="flex items-center gap-1.5 text-[10px] text-slate-400">
              <span className="h-2 w-2 rounded-full border border-green-400 bg-navy-950" />
              Live sensor
            </span>
            <span className="flex items-center gap-1.5 text-[10px] text-slate-400">
              <span className="h-2 w-2 rounded-full border border-amber-300 bg-navy-950" />
              Simulated sensor
            </span>
            <span className="ml-auto hidden items-center gap-1 text-[9.5px] text-slate-600 sm:flex">
              <Compass className="h-3 w-3" aria-hidden />
              Schematic â€” not to geographic scale
            </span>
          </div>
        </Panel>

        {/* Section register */}
        <Panel className="hidden xl:block">
          <PanelHeader
            eyebrow="Section register"
            title="All monitored railway sections"
            action={<Chip tone="bg-white/6 text-slate-300 ring-white/10">{segments.length} sections</Chip>}
          />
          <div className="overflow-x-auto">
            <table className="data-table min-w-[760px]">
              <thead>
                <tr>
                  <th>Section</th>
                  <th>Corridor</th>
                  <th>Direction</th>
                  <th>Chainage</th>
                  <th>Condition</th>
                  <th>Sensor</th>
                  <th>Status</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {segments.map((segment) => {
                  const sensor = sensors.find((item) => item.segmentId === segment.id)
                  return (
                    <tr key={segment.id} className="cursor-pointer" onClick={() => setSelectedTrack(segment.trackId)}>
                      <td>
                        <span className="font-mono text-[10.5px] font-semibold text-slate-300">
                          {segment.trackId}
                        </span>
                        <span className="ml-2 text-[11px] text-slate-400">{segment.name}</span>
                      </td>
                      <td className="text-[10.5px] text-slate-500">{segment.corridor}</td>
                      <td className="text-[10.5px] capitalize text-slate-400">{segment.direction}</td>
                      <td className="font-mono text-[10px] text-slate-500">
                        {segment.startKm.toFixed(1)} â€“ {segment.endKm.toFixed(1)} km
                      </td>
                      <td className="font-mono text-[11px] text-slate-300">{segment.conditionScore}</td>
                      <td className="font-mono text-[9.5px] text-slate-500">
                        {sensor ? sensor.sensorId.replace('REGEN-EDGE-', '') : 'â€”'}
                      </td>
                      <td>
                        <StatusChip status={segment.status} />
                      </td>
                      <td>
                        <ChevronRight className="h-3.5 w-3.5 text-slate-600" aria-hidden />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Panel>
      </div>

      {/* Inspector */}
      <div className="space-y-4 sm:space-y-5">
        <Panel>
          <div className="border-b border-white/8 p-4 sm:p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="eyebrow">Selected section</p>
                <h2 className="mt-1 truncate text-[15px] font-bold text-white">
                  {selected.trackId} Â· {selected.name}
                </h2>
                <p className="mt-0.5 text-[10.5px] text-slate-500">{selected.corridor}</p>
              </div>
              <StatusChip status={selected.status} />
            </div>

            <div className="mt-3.5 grid grid-cols-2 gap-2">
              {[
                { label: 'Condition index', value: `${selected.conditionScore}/100` },
                {
                  label: 'Chainage',
                  value: `${selected.startKm.toFixed(1)}â€“${selected.endKm.toFixed(1)} km`,
                },
                {
                  label: 'Direction',
                  value: selected.direction === 'bi-directional' ? 'Bi-directional' : `${selected.direction === 'up' ? 'Up' : 'Down'} line`,
                },
                { label: 'Site code', value: selected.siteCode },
              ].map((item) => (
                <div key={item.label} className="rounded-md border border-white/8 bg-navy-950/50 px-2.5 py-1.5">
                  <p className="text-[9px] uppercase tracking-[0.07em] text-slate-600">{item.label}</p>
                  <p className="mt-0.5 truncate font-mono text-[11px] font-semibold text-slate-200">
                    {item.value}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-3 flex flex-wrap gap-1.5">
              {selected.direction === 'up' ? (
                <Chip tone="bg-sky-500/10 text-sky-300 ring-sky-500/25">
                  <ArrowUp className="h-2.5 w-2.5" /> Up direction
                </Chip>
              ) : selected.direction === 'down' ? (
                <Chip tone="bg-violet-500/10 text-violet-300 ring-violet-500/25">
                  <ArrowDown className="h-2.5 w-2.5" /> Down direction
                </Chip>
              ) : (
                <Chip tone="bg-white/6 text-slate-300 ring-white/10">Bi-directional</Chip>
              )}
              {selectedAlerts.length > 0 && (
                <Chip tone="bg-red-500/12 text-red-300 ring-red-500/30">
                  <AlertTriangle className="h-2.5 w-2.5" /> {selectedAlerts.length} alert
                  {selectedAlerts.length > 1 ? 's' : ''}
                </Chip>
              )}
              {selectedReports.length > 0 && (
                <Chip tone="bg-green-500/12 text-green-400 ring-green-500/30">
                  <Wrench className="h-2.5 w-2.5" /> {selectedReports.length} report
                  {selectedReports.length > 1 ? 's' : ''}
                </Chip>
              )}
            </div>
          </div>

          {/* Infrastructure coverage */}
          <div className="border-b border-white/8 p-4 sm:p-5">
            <p className="text-[9.5px] font-bold uppercase tracking-[0.1em] text-slate-500">
              Infrastructure on this section
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {selected.infrastructure.map((item) => (
                <span
                  key={item}
                  className="rounded border border-white/8 bg-white/4 px-1.5 py-0.5 text-[9.5px] font-semibold uppercase tracking-[0.04em] text-slate-300"
                >
                  {item.replace(/-/g, ' ')}
                </span>
              ))}
            </div>
          </div>

          {/* Sensor */}
          <div className="border-b border-white/8 p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <p className="text-[9.5px] font-bold uppercase tracking-[0.1em] text-slate-500">
                Sensor coverage
              </p>
              {selectedSensor && (
                <span
                  className={`text-[9.5px] font-bold uppercase ${selectedSensor.isSimulated ? 'text-amber-300' : 'text-green-400'}`}
                >
                  {selectedSensor.isSimulated ? 'Simulated' : 'Physical device'}
                </span>
              )}
            </div>

            {selectedSensor ? (
              <>
                <div className="mt-2 flex items-center gap-2">
                  <span className="grid h-7 w-7 place-items-center rounded-md bg-green-500/10 text-green-400">
                    <Radio className="h-3.5 w-3.5" aria-hidden />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate font-mono text-[11px] font-semibold text-slate-200">
                      {selectedSensor.sensorId}
                    </p>
                    <p className="truncate text-[9.5px] text-slate-500">
                      {selectedSensor.installationPoint}
                    </p>
                  </div>
                </div>
                {series.length > 0 && (
                  <div className="mt-2.5 rounded-md border border-white/8 bg-navy-950/50 px-1.5 pt-1.5">
                    <Sparkline
                      values={series.map((row) => row.vibrationVelocity)}
                      color="#22d3ee"
                      threshold={10}
                      height={44}
                    />
                  </div>
                )}
                <KeyValue
                  items={[
                    { label: 'Connection', value: selectedSensor.status },
                    { label: 'Signal quality', value: `${selectedSensor.signalQuality}%` },
                    { label: 'Last transmission', value: formatShort(selectedSensor.lastTransmission) },
                    {
                      label: 'Latest reading',
                      value: series.length
                        ? `${series[series.length - 1].vibrationVelocity.toFixed(1)} mm/s Â· ${formatTime(series[series.length - 1].capturedAt)}`
                        : 'No reading',
                    },
                  ]}
                />
              </>
            ) : (
              <p className="mt-2 text-[10.5px] leading-relaxed text-slate-500">
                No REGEN sensor is installed on this section. Condition is derived from visual
                inspections, geometry runs and train-control reports.
              </p>
            )}
          </div>

          {/* Recent train passages on this section */}
          <div className="border-b border-white/8 p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <p className="text-[9.5px] font-bold uppercase tracking-[0.1em] text-slate-500">
                Recent train passages
              </p>
              <Link
                href="/portal/movements"
                className="text-[9.5px] font-bold uppercase tracking-[0.06em] text-green-400 hover:text-green-300"
              >
                Register
              </Link>
            </div>
            {selectedMovements.length === 0 ? (
              <p className="mt-2 text-[10.5px] text-slate-500">No movements recorded on this section yet.</p>
            ) : (
              <ol className="mt-2 space-y-1.5">
                {selectedMovements.map((movement) => (
                  <li
                    key={movement.id}
                    className="flex items-center gap-2 rounded-md border border-white/8 bg-navy-950/40 px-2 py-1.5"
                  >
                    <TrainFront className="h-3 w-3 flex-none text-sky-300" aria-hidden />
                    <span className="font-mono text-[10px] text-slate-200">
                      {movement.trainReference ?? 'Unidentified'}
                    </span>
                    <span className="text-[9.5px] text-slate-500">
                      {movement.direction === 'up' ? 'Up' : 'Down'} Â· {formatTime(movement.detectedAt)}
                    </span>
                    <span className="ml-auto truncate text-[9px] uppercase tracking-[0.05em] text-slate-600">
                      {movement.sourceKind === 'sensor' ? 'Sensor' : movement.sourceKind === 'train-control' ? 'Train control' : 'Manual'}
                    </span>
                  </li>
                ))}
              </ol>
            )}
          </div>

          {/* Alerts */}
          <div className="p-4 sm:p-5">
            <p className="text-[9.5px] font-bold uppercase tracking-[0.1em] text-slate-500">
              Section alerts
            </p>
            {selectedAlerts.length === 0 ? (
              <p className="mt-2 text-[10.5px] text-slate-500">No open alerts on this section.</p>
            ) : (
              <div className="mt-2 space-y-1.5">
                {selectedAlerts.map((alert) => (
                  <div key={alert.id} className="rounded-md border border-white/8 bg-navy-950/40 p-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <SeverityChip severity={alert.severity} />
                      <span className="font-mono text-[9px] text-slate-600">
                        {formatTime(alert.occurredAt)}
                      </span>
                    </div>
                    <p className="mt-1 text-[10.5px] font-semibold leading-snug text-slate-200">
                      {alert.title}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Panel>

        {/* Condition history */}
        <Panel>
          <PanelHeader eyebrow="History" title="Condition assessments" />
          {selectedAssessments.length === 0 ? (
            <EmptyState title="No assessments recorded" description="This section has not yet been assessed." />
          ) : (
            <div className="divide-y divide-white/6">
              {selectedAssessments.map((assessment) => (
                <div key={assessment.id} className="flex items-start gap-3 px-4 py-2.5 sm:px-5">
                  <span
                    className={`grid h-8 w-8 flex-none place-items-center rounded-md font-mono text-[11px] font-bold ${
                      assessment.score >= 85
                        ? 'bg-emerald-500/12 text-emerald-300'
                        : assessment.score >= 70
                          ? 'bg-amber-500/12 text-amber-300'
                          : 'bg-red-500/12 text-red-300'
                    }`}
                  >
                    {assessment.score}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-semibold capitalize text-slate-200">
                      {assessment.condition} Â· {assessment.basis.replace(/-/g, ' ')}
                    </p>
                    <p className="mt-0.5 line-clamp-2 text-[10px] leading-relaxed text-slate-500">
                      {assessment.notes}
                    </p>
                    <p className="mt-0.5 flex items-center gap-1 text-[9px] text-slate-600">
                      <Clock className="h-2.5 w-2.5" aria-hidden />
                      {formatShort(assessment.assessedAt)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Panel>

        {/* Maintenance on this section */}
        <Panel>
          <PanelHeader
            eyebrow="Maintenance linkage"
            title="Reports on this section"
            action={
              <Link
                href="/portal/maintenance"
                className="text-[10px] font-bold uppercase tracking-[0.08em] text-green-400 hover:text-green-300"
              >
                Registry
              </Link>
            }
          />
          {selectedReports.length === 0 ? (
            <EmptyState
              title="No maintenance reports"
              description="Nothing has been reported against this section."
              icon={Wrench}
            />
          ) : (
            <div className="divide-y divide-white/6">
              {selectedReports.map((report) => (
                <Link
                  key={report.id}
                  href={`/portal/maintenance/${report.reference}`}
                  className="block px-4 py-2.5 transition-colors hover:bg-white/4 sm:px-5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-[10px] text-slate-400">{report.reference}</span>
                    <StageChip stage={report.stage} />
                  </div>
                  <p className="mt-1 text-[11px] font-semibold leading-snug text-slate-200">
                    {report.title}
                  </p>
                  <p className="mt-0.5 flex items-center gap-1.5 text-[9.5px] text-slate-600">
                    <Layers className="h-2.5 w-2.5" aria-hidden />
                    {report.departmentSlug.replace(/-/g, ' ')} Â· {formatShort(report.reportedAt)}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </Panel>

        <div className="flex items-center justify-center gap-1.5 text-[9.5px] text-slate-600">
          <Maximize2 className="h-3 w-3" aria-hidden />
          Tap a section on the schematic or use the chips above to switch inspection target
        </div>
      </div>
    </div>
  )
}

