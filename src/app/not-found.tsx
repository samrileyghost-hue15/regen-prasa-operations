import Link from 'next/link'

export default function NotFound() {
  return (
    <main className="grid min-h-dvh place-items-center bg-navy-950 px-5 py-10">
      <div className="w-full max-w-md text-center">
        <p className="font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-green-400">
          404 Â· Section not found
        </p>
        <h1 className="mt-3 text-2xl font-bold tracking-tight text-white sm:text-3xl">
          That part of the network does not exist
        </h1>
        <p className="mt-2 text-[12px] leading-relaxed text-slate-400">
          The page, section or report reference you requested is not registered in the REGEN database. Check the
          reference or return to the Operational Centre.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
          <Link href="/portal" className="btn btn-primary">
            Operations Centre
          </Link>
          <Link href="/" className="btn btn-ghost">
            Sign in
          </Link>
        </div>
      </div>
    </main>
  )
}

