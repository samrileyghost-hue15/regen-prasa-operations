'use client'

import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

export type TrendPoint = {
  label: string
  value: number
  secondary?: number | null
  simulated?: boolean
}

type Props = {
  data: TrendPoint[]
  kind?: 'vibration' | 'temperature'
  threshold?: number
  unit?: string
  height?: number
  showSecondary?: boolean
  secondaryLabel?: string
  secondaryUnit?: string
}

const AXIS = 'rgba(148,163,184,0.55)'
const GRID = 'rgba(148,197,255,0.08)'

function TrendTooltip({
  active,
  payload,
  label,
  unit,
  secondaryLabel,
  secondaryUnit,
}: {
  active?: boolean
  payload?: { value?: number | string; dataKey?: string | number; color?: string }[]
  label?: string | number
  unit?: string
  secondaryLabel?: string
  secondaryUnit?: string
}) {
  if (!active || !payload || payload.length === 0) return null
  return (
    <div className="rounded-md border border-white/12 bg-navy-950/95 px-2.5 py-1.5 shadow-xl backdrop-blur">
      <p className="font-mono text-[9.5px] uppercase tracking-[0.08em] text-slate-500">{label}</p>
      {payload.map((entry) => {
        const isSecondary = entry.dataKey === 'secondary'
        return (
          <p key={String(entry.dataKey)} className="mt-0.5 font-mono text-[11px] font-semibold text-slate-100">
            <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full align-middle" style={{ backgroundColor: entry.color }} />
            {isSecondary ? (secondaryLabel ?? 'Secondary') : 'Reading'}{' '}
            <span className="text-slate-300">
              {typeof entry.value === 'number' ? entry.value.toFixed(1) : entry.value}
              {isSecondary ? (secondaryUnit ?? '') : (unit ?? '')}
            </span>
          </p>
        )
      })}
    </div>
  )
}

/**
 * Recharts trend used by the Kempton Park pilot centre. Colours follow the
 * control-room palette: cyan for live device data, amber for simulated data.
 */
export function SensorTrend({
  data,
  kind = 'vibration',
  threshold,
  unit = ' mm/s',
  height = 210,
  showSecondary = false,
  secondaryLabel = 'Temperature',
  secondaryUnit = ' °C',
}: Props) {
  const stroke = kind === 'vibration' ? '#22d3ee' : '#fbbf24'
  const gradientId = `trend-${kind}`

  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 8, right: 4, left: -18, bottom: 0 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={stroke} stopOpacity={0.42} />
              <stop offset="100%" stopColor={stroke} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke={GRID} vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fill: AXIS, fontSize: 9 }}
            tickLine={false}
            axisLine={{ stroke: GRID }}
            interval="preserveStartEnd"
            minTickGap={22}
          />
          <YAxis
            tick={{ fill: AXIS, fontSize: 9 }}
            tickLine={false}
            axisLine={false}
            width={38}
            domain={['auto', 'auto']}
          />
          {showSecondary && (
            <YAxis
              yAxisId="secondary"
              orientation="right"
              tick={{ fill: 'rgba(251,191,36,0.65)', fontSize: 9 }}
              tickLine={false}
              axisLine={false}
              width={30}
              domain={['auto', 'auto']}
            />
          )}
          <Tooltip
            content={
              <TrendTooltip unit={unit} secondaryLabel={secondaryLabel} secondaryUnit={secondaryUnit} />
            }
            cursor={{ stroke: 'rgba(148,163,184,0.25)', strokeWidth: 1 }}
          />
          {typeof threshold === 'number' && (
            <ReferenceLine
              y={threshold}
              stroke="#ef4444"
              strokeDasharray="4 4"
              strokeWidth={1}
              label={{
                value: 'review',
                position: 'insideTopRight',
                fill: 'rgba(248,113,113,0.75)',
                fontSize: 8,
              }}
            />
          )}
          <Area
            type="monotone"
            dataKey="value"
            stroke={stroke}
            strokeWidth={1.8}
            fill={`url(#${gradientId})`}
            dot={false}
            activeDot={{ r: 3, fill: stroke, stroke: '#040b15', strokeWidth: 1.5 }}
            isAnimationActive={false}
          />
          {showSecondary && (
            <Line
              yAxisId="secondary"
              type="monotone"
              dataKey="secondary"
              stroke="#fbbf24"
              strokeWidth={1.2}
              strokeDasharray="3 3"
              dot={false}
              isAnimationActive={false}
            />
          )}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}
