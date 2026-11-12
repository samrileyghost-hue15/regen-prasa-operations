import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { Activity, Cpu, Radio, TrainFront } from 'lucide-react'

import { DataSourceNote } from '@/components/ui/primitives'
import { currentUser } from '@/lib/auth'
import { dataSource } from '@/lib/store'

import { LoginForm } from './login-form'

export const metadata: Metadata = {
  title: 'Sign in',
  description: 'Secure access to the REGEN Railway Operations & Infrastructure Management System.',
}

export const dynamic = 'force-dynamic'

const HIGHLIGHTS = [
  { icon: TrainFront, label: 'Operations Centre', value: '15 departments' },
  { icon: Cpu, label: 'Kempton Park pilot', value: 'REGEN-EDGE-KP01' },
  { icon: Activity, label: 'Railway sections', value: '11 monitored' },
]

export default async function SignInPage() {
  const user = await currentUser()
  if (user) redirect('/portal')

  return (
    <main className="relative min-h-screen overflow-hidden bg-navy-950 lg:grid lg:grid-cols-[1.05fr_0.95fr]">
      {/* Brand / context panel */}
      <section className="relative hidden flex-col justify-between overflow-hidden border-r border-white/8 p-10 lg:flex xl:p-14">
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(1200px 620px at 18% 8%, rgba(90,173,63,0.16), transparent 58%), radial-gradient(900px 700px at 88% 92%, rgba(90,173,63,0.18), transparent 60%), linear-gradient(160deg, #04101d 0%, #061726 48%, #040d18 100%)',
          }}
        />
        <div className="grid-backdrop absolute inset-0 opacity-40" />
        <div className="pointer-events-none absolute -left-24 top-1/3 h-72 w-72 rounded-full bg-green-500/10 blur-3xl" />

        <div className="relative z-10">
          {/* Use the full SVG logo file on the sign-in hero panel */}
          <img
            src="/regen-logo.svg"
            alt="Regen â€” Built to last. Designed to heal."
            className="h-16 w-auto"
            draggable={false}
          />
        </div>

        <div className="relative z-10 max-w-xl">
          <p className="eyebrow">Railway operations &amp; infrastructure management</p>
          <h1 className="mt-4 text-4xl font-bold leading-[1.08] tracking-tight text-white xl:text-[44px]">
            One platform.
            <br />
            <span className="bg-gradient-to-r from-green-300 via-green-400 to-emerald-500 bg-clip-text text-transparent">
              Connected infrastructure.
            </span>
          </h1>
          <p className="mt-5 max-w-md text-[13.5px] leading-relaxed text-slate-400">
            The Operational Centre, REGEN&apos;s central database, track sensors, departments,
            maintenance engineers and field workers â€” connected in one control-room view.
          </p>

          <div className="mt-9 grid grid-cols-3 gap-px overflow-hidden rounded-lg border border-white/10 bg-white/8">
            {HIGHLIGHTS.map(({ icon: Icon, label, value }) => (
              <div key={label} className="bg-navy-900/80 px-4 py-4">
                <Icon className="h-4 w-4 text-green-400" aria-hidden />
                <p className="mt-2.5 font-mono text-[12.5px] font-semibold text-white">{value}</p>
                <p className="mt-0.5 text-[10px] uppercase tracking-[0.08em] text-slate-500">{label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 flex items-center justify-between text-[10px] uppercase tracking-[0.16em] text-slate-600">
          <span>Built to last. Designed to heal.</span>
          <span className="flex items-center gap-1.5">
            <Radio className="h-3 w-3" />
            {dataSource === 'supabase' ? 'Supabase connected' : 'Pilot demonstration'}
          </span>
        </div>
      </section>

      {/* Sign-in panel */}
      <section className="relative flex min-h-screen items-center justify-center px-5 py-10 sm:px-8">
        <div className="grid-backdrop pointer-events-none absolute inset-0 opacity-20 lg:hidden" />
        <div className="relative w-full max-w-[420px]">
          <div className="mb-8 lg:hidden">
            <img
              src="/regen-logo.svg"
              alt="Regen"
              className="h-11 w-auto"
              draggable={false}
            />
          </div>

          <div className="panel rise p-6 sm:p-7">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="eyebrow">Authorised access</p>
                <h2 className="mt-1.5 text-[19px] font-bold tracking-tight text-white">
                  Operations portal sign-in
                </h2>
              </div>
              <DataSourceNote source={dataSource} />
            </div>

            <p className="mt-2 text-[11.5px] leading-relaxed text-slate-400">
              Sign in with your employee name, PRASA reference number and personal password.
            </p>

            <LoginForm />

            <div className="mt-6 border-t border-white/8 pt-4">
              <p className="text-[10px] leading-relaxed text-slate-500">
                All access is monitored and recorded in the REGEN audit log. Unauthorised use may
                result in disciplinary action and prosecution.
              </p>
            </div>
          </div>

          <div className="mt-5 flex items-center justify-between text-[10px] uppercase tracking-[0.14em] text-slate-600">
            <span>PRASA Ã— REGEN</span>
            <span>v1.0 Â· Kempton Park pilot</span>
          </div>
        </div>
      </section>
    </main>
  )
}

