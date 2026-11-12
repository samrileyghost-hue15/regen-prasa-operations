/**
 * REGEN brand components — matches the official brand exactly.
 *
 * Brand palette from the logo image:
 *   Track / wordmark body : #1a3159  (deep brand navy)
 *   Arc gradient start    : #a8d44e  (lime-green)
 *   Arc gradient mid      : #5aad3f  (brand green)
 *   Arc gradient end      : #1a3159  (back to navy)
 *
 * The mark reproduces the logo's key elements:
 *   1. Railway track in perspective (two rails + sleepers, dark navy)
 *   2. The "R" letterform in solid brand navy — same weight as the wordmark
 *   3. The double-arc sweep in brand green gradient over the top of the R
 */

type MarkProps = { className?: string; size?: number }

export function RegenMark({ className = '', size = 36 }: MarkProps) {
  const id = `rg-${size}` // unique gradient id per rendered size
  return (
    <svg
      viewBox="0 0 56 56"
      width={size}
      height={size}
      className={className}
      role="img"
      aria-label="REGEN"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        {/* Brand arc: lime-green → mid-green → deep navy */}
        <linearGradient id={`${id}-arc`} x1="0%" y1="0%" x2="100%" y2="80%">
          <stop offset="0%"   stopColor="#a8d44e" />
          <stop offset="50%"  stopColor="#5aad3f" />
          <stop offset="100%" stopColor="#1a3159" />
        </linearGradient>
      </defs>

      {/* ── Track — two rails converging to vanishing point top-centre ── */}
      {/* Left rail */}
      <path d="M 8 50 L 20 12" stroke="#1a3159" strokeWidth="3.2" strokeLinecap="round" />
      {/* Right rail */}
      <path d="M 28 50 L 22 12" stroke="#1a3159" strokeWidth="3.2" strokeLinecap="round" />
      {/* Sleepers — wider at base, narrowing with perspective */}
      <line x1="6"  y1="44" x2="30" y2="44" stroke="#1a3159" strokeWidth="3"   strokeLinecap="round" />
      <line x1="8"  y1="37" x2="29" y2="37" stroke="#1a3159" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="10" y1="30" x2="27" y2="30" stroke="#1a3159" strokeWidth="2"   strokeLinecap="round" />
      <line x1="13" y1="23" x2="25" y2="23" stroke="#1a3159" strokeWidth="1.6" strokeLinecap="round" />
      <line x1="15" y1="17" x2="24" y2="17" stroke="#1a3159" strokeWidth="1.3" strokeLinecap="round" />

      {/* ── R letterform — solid brand navy, same weight as the wordmark ── */}
      {/* Stem */}
      <path d="M 22 12 L 22 50" stroke="#1a3159" strokeWidth="5" strokeLinecap="round" />
      {/* Bowl — arch rightward from top of stem */}
      <path
        d="M 22 12 Q 42 12 42 26 Q 42 40 28 40 L 22 40"
        stroke="#1a3159"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Leg — diagonal from bowl junction bottom-right */}
      <path d="M 32 40 L 46 50" stroke="#1a3159" strokeWidth="5" strokeLinecap="round" />

      {/* ── Brand arc sweep (the signature element) ── */}
      {/* Primary arc — thicker */}
      <path
        d="M 2 24 Q 10 2 30 8 Q 42 12 48 24"
        stroke={`url(#${id}-arc)`}
        strokeWidth="4.5"
        strokeLinecap="round"
      />
      {/* Secondary echo arc — thinner, slightly lower */}
      <path
        d="M 5 32 Q 12 14 29 18 Q 40 22 46 32"
        stroke={`url(#${id}-arc)`}
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.5"
      />
    </svg>
  )
}

/* ─────────────────────────── Full lockup ─────────────────────────── */

const SIZE_CONFIG = {
  sm: { mark: 28, word: 'text-[16px]', gap: 'gap-2',   tagline: 'text-[7.5px] tracking-[0.22em]' },
  md: { mark: 36, word: 'text-[21px]', gap: 'gap-2.5', tagline: 'text-[8px]   tracking-[0.2em]'  },
  lg: { mark: 48, word: 'text-[28px]', gap: 'gap-3',   tagline: 'text-[9.5px] tracking-[0.26em]' },
} as const

export function RegenLogo({
  size = 'md',
  tagline = false,
  className = '',
}: {
  size?: keyof typeof SIZE_CONFIG
  tagline?: boolean
  className?: string
}) {
  const cfg = SIZE_CONFIG[size]
  return (
    <div className={`flex items-center ${cfg.gap} ${className}`}>
      <RegenMark size={cfg.mark} />
      <div className="min-w-0">
        {/*
          Wordmark: "R" uses the brand green gradient,
          "egen" in white (on dark bg) matching the brand's navy on the actual logo.
        */}
        <div className={`font-black leading-none tracking-tight ${cfg.word}`}>
          <span
            style={{
              background: 'linear-gradient(135deg, #a8d44e 0%, #5aad3f 50%, #1a3159 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            R
          </span>
          <span className="text-white">egen</span>
        </div>
        {tagline && (
          <p className={`mt-0.5 font-semibold uppercase text-slate-400 ${cfg.tagline}`}>
            Built to last. Designed to heal.
          </p>
        )}
      </div>
    </div>
  )
}

/* ─────────────────────────── PRASA lockup ────────────────────────── */

export function PrasaLockup({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">PRASA</span>
      <span className="h-3 w-px bg-slate-700" />
      <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">
        Gauteng Operations
      </span>
    </div>
  )
}
