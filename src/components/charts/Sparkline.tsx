/** Dependency-free sparkline — renders on the server, scales with its container. */
export function Sparkline({
  values,
  color = '#34d399',
  height = 44,
  className = '',
  threshold,
}: {
  values: number[]
  color?: string
  height?: number
  className?: string
  threshold?: number
}) {
  if (!values.length) return <div className={className} style={{ height }} />

  const width = 100
  const min = Math.min(...values, threshold ?? Infinity)
  const max = Math.max(...values, threshold ?? -Infinity)
  const span = max - min || 1
  const step = values.length > 1 ? width / (values.length - 1) : width

  const points = values.map((value, index) => {
    const x = index * step
    const y = height - ((value - min) / span) * (height - 4) - 2
    return `${x.toFixed(2)},${y.toFixed(2)}`
  })

  const last = points[points.length - 1]?.split(',') ?? ['0', '0']
  const areaPath = `M0,${height} L${points.join(' L')} L${last[0]},${height} Z`
  const thresholdY =
    threshold !== undefined ? height - ((threshold - min) / span) * (height - 4) - 2 : null

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      className={className}
      style={{ height }}
      role="img"
      aria-label="Recent vibration trend"
    >
      <defs>
        <linearGradient id={`spark-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.32" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#spark-${color.replace('#', '')})`} />
      <polyline
        points={points.join(' ')}
        fill="none"
        stroke={color}
        strokeWidth="1.4"
        strokeLinejoin="round"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
      {thresholdY !== null && (
        <line
          x1="0"
          x2={width}
          y1={thresholdY}
          y2={thresholdY}
          stroke="#f59e0b"
          strokeWidth="0.7"
          strokeDasharray="2 2"
          opacity="0.65"
          vectorEffect="non-scaling-stroke"
        />
      )}
    </svg>
  )
}
