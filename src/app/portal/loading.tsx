/**
 * Portal-level loading skeleton — renders instantly while any portal page
 * awaits data from Supabase. Next.js streams this in the shell layout
 * so the sidebar, header and nav are visible immediately; only the page
 * content area shows the skeleton.
 */
export default function PortalLoading() {
  return (
    <div className="space-y-4 sm:space-y-5">
      {/* Page heading skeleton */}
      <div className="space-y-2">
        <div className="h-3 w-24 animate-pulse rounded bg-white/8" />
        <div className="h-7 w-72 animate-pulse rounded bg-white/10" />
        <div className="h-3 w-96 animate-pulse rounded bg-white/6" />
      </div>

      {/* KPI strip skeleton */}
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 xl:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="panel p-3.5 space-y-2">
            <div className="h-2 w-20 animate-pulse rounded bg-white/8" />
            <div className="h-7 w-16 animate-pulse rounded bg-white/10" />
            <div className="h-2 w-28 animate-pulse rounded bg-white/6" />
          </div>
        ))}
      </div>

      {/* Main content skeleton */}
      <div className="grid gap-4 xl:grid-cols-[1.55fr_1fr] sm:gap-5">
        <div className="panel h-72 animate-pulse bg-white/4" />
        <div className="panel h-72 animate-pulse bg-white/4" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3 sm:gap-5">
        <div className="panel h-48 animate-pulse bg-white/4" />
        <div className="panel h-48 animate-pulse bg-white/4" />
        <div className="panel h-48 animate-pulse bg-white/4" />
      </div>
    </div>
  )
}
