'use client'

import {
  Bar,
  BarChart,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts'

const AXIS = 'rgba(148,163,184,0.55)'
const GRID = 'rgba(148,197,255,0.08)'

const TOOLTIP_STYLE = {
  backgroundColor: 'rgba(4,11,21,0.96)',
  border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: 6,
  fontSize: 11,
  color: '#e2e8f0',
  padding: '6px 9px',
} as const

/** Hourly train movements across the last 12 hours. */
export function MovementsBarChart({ data }: { data: { label: string; count: number }[] }) {
  return (
    <div className="h-[190px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 6, right: 4, left: -22, bottom: 0 }}>
          <CartesianGrid stroke={GRID} vertical={false} />
          <XAxis dataKey="label" tick={{ fill: AXIS, fontSize: 9 }} tickLine={false} axisLine={{ stroke: GRID }} minTickGap={10} />
          <YAxis tick={{ fill: AXIS, fontSize: 9 }} tickLine={false} axisLine={false} width={34} allowDecimals={false} />
          <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: 'rgba(148,197,255,0.06)' }} />
          <Bar dataKey="count" name="Movements" fill="#22d3ee" radius={[2, 2, 0, 0]} maxBarSize={26} isAnimationActive={false} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

/** Section condition split. */
export function ConditionDonutChart({
  data,
}: {
  data: { status: string; count: number; colour: string; label: string }[]
}) {
  const total = data.reduce((sum, row) => sum + row.count, 0)
  return (
    <div className="relative h-[190px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="count"
            nameKey="label"
            innerRadius="58%"
            outerRadius="86%"
            paddingAngle={2}
            stroke="rgba(4,11,21,0.9)"
            strokeWidth={1.5}
            isAnimationActive={false}
          >
            {data.map((row) => (
              <Cell key={row.status} fill={row.colour} />
            ))}
          </Pie>
          <Tooltip contentStyle={TOOLTIP_STYLE} />
          <Legend
            verticalAlign="bottom"
            height={22}
            iconType="circle"
            iconSize={6}
            formatter={(value) => <span style={{ color: 'rgba(148,163,184,0.9)', fontSize: 10 }}>{value}</span>}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-x-0 top-[38%] -translate-y-1/2 text-center">
        <p className="font-mono text-[19px] font-bold leading-none text-slate-100">{total}</p>
        <p className="mt-0.5 text-[8.5px] uppercase tracking-[0.1em] text-slate-500">sections</p>
      </div>
    </div>
  )
}

/** Predictive risk score by section. */
export function RiskBarChart({ data }: { data: { label: string; risk: number }[] }) {
  return (
    <div className="h-[210px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 4, right: 12, left: 4, bottom: 0 }}>
          <CartesianGrid stroke={GRID} horizontal={false} />
          <XAxis type="number" domain={[0, 100]} tick={{ fill: AXIS, fontSize: 9 }} tickLine={false} axisLine={false} />
          <YAxis
            type="category"
            dataKey="label"
            width={44}
            tick={{ fill: AXIS, fontSize: 9 }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: 'rgba(148,197,255,0.06)' }} />
          <Bar dataKey="risk" name="Risk score" radius={[0, 2, 2, 0]} maxBarSize={14} isAnimationActive={false}>
            {data.map((row) => (
              <Cell
                key={row.label}
                fill={row.risk >= 75 ? '#ef4444' : row.risk >= 55 ? '#f59e0b' : row.risk >= 35 ? '#eab308' : '#22c55e'}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

/** Peak vibration per section over the analysis window. */
export function PeakVibrationChart({ data }: { data: { label: string; peak: number }[] }) {
  return (
    <div className="h-[200px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 6, right: 6, left: -20, bottom: 0 }}>
          <CartesianGrid stroke={GRID} vertical={false} />
          <XAxis dataKey="label" tick={{ fill: AXIS, fontSize: 9 }} tickLine={false} axisLine={{ stroke: GRID }} />
          <YAxis tick={{ fill: AXIS, fontSize: 9 }} tickLine={false} axisLine={false} width={34} />
          <Tooltip contentStyle={TOOLTIP_STYLE} />
          <Line
            type="monotone"
            dataKey="peak"
            name="Peak mm/s"
            stroke="#f59e0b"
            strokeWidth={1.8}
            dot={{ r: 2.2, fill: '#f59e0b', strokeWidth: 0 }}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
