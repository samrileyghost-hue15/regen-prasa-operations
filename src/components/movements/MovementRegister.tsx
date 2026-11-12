'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowDown, ArrowUp, Filter, Loader2, Plus, Radio, Search, X } from 'lucide-react'

import { logMovementAction } from '@/app/portal/actions'
import { Chip, EmptyState, Panel, PanelHeader, SeverityChip } from '@/components/ui/primitives'
import { formatAge, formatTime } from '@/lib/format'
import type { Segment, TrainMovement } from '@/lib/types'

type Props = {
  movements: TrainMovement[]
  segments: Segment[]
  now: number
  canLog: boolean
}

const SOURCE_LABEL: Record<TrainMovement['sourceKind'], string> = {
  sensor: 'Sensor',
  'train-control': 'Train control',
  manual: 'Manual',
}

export function MovementRegister({ movements, segments, now, canLog }: Props) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  const [segmentFilter, setSegmentFilter] = useState('all')
  const [directionFilter, setDirectionFilter] = useState('all')
  const [sourceFilter, setSourceFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [search, setSearch] = useState('')

  const [showForm, setShowForm] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({
    segmentId: segments[0]?.id ?? '',
    direction: 'down' as 'up' | 'down',
    sourceKind: 'train-control' as TrainMovement['sourceKind'],
    trainReference: '',
    note: '',
  })

  const segmentById = useMemo(() => new Map(segments.map((segment) => [segment.id, segment])), [segments])

  const filtered = useMemo(
    () =>
      movements.filter((movement) => {
        if (segmentFilter !== 'all' && movement.segmentId !== segmentFilter) return false
        if (directionFilter !== 'all' && movement.direction !== directionFilter) return false
        if (sourceFilter !== 'all' && movement.sourceKind !== sourceFilter) return false
        if (statusFilter !== 'all' && movement.reviewStatus !== statusFilter) return false
        if (search) {
          const haystack = `${movement.movementId} ${movement.trainReference ?? ''} ${movement.source} ${segmentById.get(movement.segmentId)?.trackId ?? ''}`.toLowerCase()
          if (!haystack.includes(search.toLowerCase())) return false
        }
        return true
      }),
    [movements, segmentFilter, directionFilter, sourceFilter, statusFilter, search, segmentById],
  )

  const activeFilters =
    (segmentFilter !== 'all' ? 1 : 0) +
    (directionFilter !== 'all' ? 1 : 0) +
    (sourceFilter !== 'all' ? 1 : 0) +
    (statusFilter !== 'all' ? 1 : 0) +
    (search ? 1 : 0)

  const reset = () => {
    setSegmentFilter('all')
    setDirectionFilter('all')
    setSourceFilter('all')
    setStatusFilter('all')
    setSearch('')
  }

  const submit = (event: React.FormEvent) => {
    event.preventDefault()
    setError(null)
    startTransition(async () => {
      const result = await logMovementAction({
        segmentId: form.segmentId,
        direction: form.direction,
        sourceKind: form.sourceKind,
        trainReference: form.trainReference,
        note: form.note,
      })
      if (!result.ok) {
        setError(result.error)
        return
      }
      setForm((current) => ({ ...current, trainReference: '', note: '' }))
      setShowForm(false)
      router.refresh()
    })
  }

  const selectClass =
    'rounded-md border border-white/10 bg-navy-925 px-2 py-1.5 text-[10.5px] text-slate-200 outline-none focus:border-green-500/40 focus:ring-1 focus:ring-green-500/30'

  return (
    <div className="space-y-4 sm:space-y-5">
      {canLog && (
        <Panel>
          <PanelHeader
            eyebrow="Detection"
            title="Register a movement"
            description="Use this when a connected system or a manual report identifies a train the sensors did not detect."
            action={
              <button
                type="button"
                onClick={() => setShowForm((value) => !value)}
                className={showForm ? 'btn btn-ghost' : 'btn btn-primary'}
              >
                {showForm ? <X className="h-3.5 w-3.5" aria-hidden /> : <Plus className="h-3.5 w-3.5" aria-hidden />}
                {showForm ? 'Cancel' : 'New entry'}
              </button>
            }
          />
          {showForm && (
            <form onSubmit={submit} className="grid gap-3 p-4 sm:grid-cols-2 sm:p-5 lg:grid-cols-3">
              <label className="block">
                <span className="field-label">Section</span>
                <select
                  className="field"
                  value={form.segmentId}
                  onChange={(event) => setForm((current) => ({ ...current, segmentId: event.target.value }))}
                >
                  {segments.map((segment) => (
                    <option key={segment.id} value={segment.id}>
                      {segment.trackId} Â· {segment.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="field-label">Direction</span>
                <select
                  className="field"
                  value={form.direction}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, direction: event.target.value as 'up' | 'down' }))
                  }
                >
                  <option value="down">Down line</option>
                  <option value="up">Up line</option>
                </select>
              </label>
              <label className="block">
                <span className="field-label">Detection source</span>
                <select
                  className="field"
                  value={form.sourceKind}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      sourceKind: event.target.value as TrainMovement['sourceKind'],
                    }))
                  }
                >
                  <option value="train-control">Train control report</option>
                  <option value="manual">Manual / field observation</option>
                  <option value="sensor">Connected sensor</option>
                </select>
              </label>
              <label className="block">
                <span className="field-label">Train reference</span>
                <input
                  className="field"
                  value={form.trainReference}
                  onChange={(event) => setForm((current) => ({ ...current, trainReference: event.target.value }))}
                  placeholder="PRASA 5M2A Â· 0821"
                />
              </label>
              <label className="block sm:col-span-2 lg:col-span-2">
                <span className="field-label">Note (optional)</span>
                <input
                  className="field"
                  value={form.note}
                  onChange={(event) => setForm((current) => ({ ...current, note: event.target.value }))}
                  placeholder="Context recorded with the movement"
                />
              </label>
              <div className="flex items-end gap-2 sm:col-span-2 lg:col-span-3">
                <button type="submit" className="btn btn-primary" disabled={pending}>
                  {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden /> : <Plus className="h-3.5 w-3.5" aria-hidden />}
                  Add to register
                </button>
                {error && <p className="text-[10.5px] font-semibold text-red-300">{error}</p>}
              </div>
            </form>
          )}
        </Panel>
      )}

      <Panel>
        <PanelHeader
          eyebrow="Historical register"
          title="Train movement register"
          description="Every passage detected by a REGEN sensor, reported by train control or logged manually."
          action={<Chip tone="bg-white/6 text-slate-300 ring-white/10">{filtered.length} shown</Chip>}
        />

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 border-b border-white/8 px-3 py-2.5 sm:px-4">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-slate-500" aria-hidden />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search reference"
              aria-label="Search the movement register"
              className="w-40 rounded-md border border-white/10 bg-navy-925 py-1.5 pl-7 pr-2 text-[10.5px] text-slate-200 outline-none placeholder:text-slate-600 focus:border-green-500/40 focus:ring-1 focus:ring-green-500/30"
            />
          </div>
          <select
            aria-label="Filter by section"
            value={segmentFilter}
            onChange={(event) => setSegmentFilter(event.target.value)}
            className={selectClass}
          >
            <option value="all">All sections</option>
            {segments.map((segment) => (
              <option key={segment.id} value={segment.id}>
                {segment.trackId}
              </option>
            ))}
          </select>
          <select
            aria-label="Filter by direction"
            value={directionFilter}
            onChange={(event) => setDirectionFilter(event.target.value)}
            className={selectClass}
          >
            <option value="all">Both directions</option>
            <option value="up">Up</option>
            <option value="down">Down</option>
          </select>
          <select
            aria-label="Filter by detection source"
            value={sourceFilter}
            onChange={(event) => setSourceFilter(event.target.value)}
            className={selectClass}
          >
            <option value="all">All sources</option>
            <option value="sensor">Sensor</option>
            <option value="train-control">Train control</option>
            <option value="manual">Manual</option>
          </select>
          <select
            aria-label="Filter by review status"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className={selectClass}
          >
            <option value="all">All statuses</option>
            <option value="normal">Normal</option>
            <option value="review">Review</option>
            <option value="critical">Critical</option>
          </select>
          {activeFilters > 0 && (
            <button
              type="button"
              onClick={reset}
              className="inline-flex items-center gap-1 rounded-md border border-white/10 px-2 py-1.5 text-[10px] font-semibold text-slate-400 hover:text-slate-200"
            >
              <Filter className="h-3 w-3" aria-hidden />
              Clear {activeFilters}
            </button>
          )}
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            title="No movements match"
            description="Adjust the filters to widen the register."
            icon={Radio}
            action={
              <button type="button" onClick={reset} className="btn btn-ghost mt-1">
                Reset filters
              </button>
            }
          />
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden overflow-x-auto md:block">
              <table className="data-table min-w-[840px]">
                <thead>
                  <tr>
                    <th>Movement</th>
                    <th>Detected</th>
                    <th>Section</th>
                    <th>Direction</th>
                    <th>Train</th>
                    <th>Source</th>
                    <th>Peak</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((movement) => {
                    const segment = segmentById.get(movement.segmentId)
                    return (
                      <tr key={movement.id}>
                        <td className="font-mono text-[10px] font-semibold text-slate-300">
                          {movement.movementId}
                          {movement.isSimulated && (
                            <span className="ml-1.5 rounded bg-amber-500/12 px-1 py-0.5 text-[8.5px] font-bold uppercase text-amber-300">
                              sim
                            </span>
                          )}
                        </td>
                        <td>
                          <span className="text-[10.5px] text-slate-300">{formatTime(movement.detectedAt)}</span>
                          <span className="ml-1.5 text-[9px] text-slate-600">{formatAge(movement.detectedAt, now)}</span>
                        </td>
                        <td className="font-mono text-[10px] text-slate-400">{segment?.trackId ?? 'â€”'}</td>
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
                        <td className="text-[10.5px] text-slate-400">{movement.trainReference ?? 'Unidentified'}</td>
                        <td className="text-[10px] text-slate-500">{movement.source}</td>
                        <td className="font-mono text-[10.5px] text-slate-300">
                          {movement.peakVibration !== null ? `${movement.peakVibration.toFixed(1)} mm/s` : 'â€”'}
                        </td>
                        <td>
                          <SeverityChip
                            severity={
                              movement.reviewStatus === 'normal'
                                ? 'low'
                                : movement.reviewStatus === 'review'
                                  ? 'high'
                                  : 'critical'
                            }
                          />
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <ul className="divide-y divide-white/6 md:hidden">
              {filtered.map((movement) => {
                const segment = segmentById.get(movement.segmentId)
                return (
                  <li key={movement.id} className="px-4 py-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-[10px] font-semibold text-slate-300">
                        {movement.movementId}
                      </span>
                      <SeverityChip
                        severity={
                          movement.reviewStatus === 'normal'
                            ? 'low'
                            : movement.reviewStatus === 'review'
                              ? 'high'
                              : 'critical'
                        }
                      />
                    </div>
                    <p className="mt-1 text-[11.5px] font-semibold text-slate-200">
                      {movement.trainReference ?? 'Unidentified train'}
                    </p>
                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[9.5px] text-slate-500">
                      <span className="inline-flex items-center gap-1 capitalize">
                        {movement.direction === 'up' ? (
                          <ArrowUp className="h-2.5 w-2.5 text-sky-300" aria-hidden />
                        ) : (
                          <ArrowDown className="h-2.5 w-2.5 text-violet-300" aria-hidden />
                        )}
                        {movement.direction}
                      </span>
                      <span className="font-mono">{segment?.trackId ?? 'â€”'}</span>
                      <span>{formatTime(movement.detectedAt)}</span>
                      <span>{SOURCE_LABEL[movement.sourceKind]}</span>
                      {movement.peakVibration !== null && (
                        <span className="font-mono">{movement.peakVibration.toFixed(1)} mm/s</span>
                      )}
                    </div>
                  </li>
                )
              })}
            </ul>
          </>
        )}

        <div className="border-t border-white/8 px-4 py-2.5 text-[9.5px] text-slate-600 sm:px-5">
          Movement detection notifies the Operational Centre in real time and is retained as the historical
          register required for corridor performance analysis.
        </div>
      </Panel>
    </div>
  )
}

