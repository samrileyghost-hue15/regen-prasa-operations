'use client'

import { useActionState, useId, useState } from 'react'
import { AlertCircle, ChevronRight, Eye, EyeOff, Loader2, LogIn, UserSquare2 } from 'lucide-react'

import { signInAction, type LoginState } from '@/app/login-actions'

const DEMO_PASSWORD = 'Regen@2026'

const DEMO_ACCOUNTS = [
  { name: 'Nicol van Wyk', ref: 'PRASA-OPS-0001', role: 'Head of Operations', accent: 'text-emerald-300' },
  { name: 'Thandiwe Mokoena', ref: 'PRASA-OPS-0107', role: 'Operations Controller', accent: 'text-sky-300' },
  { name: 'Sipho Dlamini', ref: 'PRASA-INF-2418', role: 'Dept Manager Â· Permanent Way', accent: 'text-green-400' },
  { name: 'Anele Ngcobo', ref: 'PRASA-INF-3376', role: 'Maintenance Engineer', accent: 'text-green-400' },
  { name: 'Lindiwe Khumalo', ref: 'REGEN-TEC-0042', role: 'REGEN Technical', accent: 'text-violet-300' },
  { name: 'Pieter Botha', ref: 'PRASA-FLD-5120', role: 'Field Worker', accent: 'text-amber-300' },
  { name: 'Naledi Mahlangu', ref: 'PRASA-ADM-6001', role: 'Administrator', accent: 'text-slate-300' },
]

export function LoginForm() {
  const [state, formAction, pending] = useActionState<LoginState, FormData>(signInAction, {})
  const [fullName, setFullName] = useState('')
  const [employeeRef, setEmployeeRef] = useState('')
  const [password, setPassword] = useState('')
  const [reveal, setReveal] = useState(false)
  const [pickerOpen, setPickerOpen] = useState(false)
  const nameId = useId()
  const refId = useId()
  const passwordId = useId()

  const choose = (account: (typeof DEMO_ACCOUNTS)[number]) => {
    setFullName(account.name)
    setEmployeeRef(account.ref)
    setPassword(DEMO_PASSWORD)
    setPickerOpen(false)
  }

  return (
    <div className="mt-5">
      <form action={formAction} className="space-y-3.5">
        <div>
          <label htmlFor={nameId} className="field-label">
            Employee name
          </label>
          <input
            id={nameId}
            name="fullName"
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
            autoComplete="name"
            placeholder="Nicol van Wyk"
            className="field"
            required
          />
        </div>

        <div>
          <label htmlFor={refId} className="field-label">
            PRASA employee / region reference
          </label>
          <input
            id={refId}
            name="employeeRef"
            value={employeeRef}
            onChange={(event) => setEmployeeRef(event.target.value.toUpperCase())}
            autoComplete="username"
            spellCheck={false}
            placeholder="PRASA-OPS-0001"
            className="field font-mono text-[12.5px] tracking-wide"
            required
          />
        </div>

        <div>
          <label htmlFor={passwordId} className="field-label">
            Personal password
          </label>
          <div className="relative">
            <input
              id={passwordId}
              name="password"
              type={reveal ? 'text' : 'password'}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢"
              className="field pr-11"
              required
              minLength={8}
            />
            <button
              type="button"
              onClick={() => setReveal((current) => !current)}
              className="absolute right-1.5 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-md text-slate-400 hover:bg-white/5 hover:text-slate-200"
              aria-label={reveal ? 'Hide password' : 'Show password'}
            >
              {reveal ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {state.error && (
          <div
            role="alert"
            className="flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2.5 text-[11.5px] leading-relaxed text-red-200"
          >
            <AlertCircle className="mt-0.5 h-3.5 w-3.5 flex-none" aria-hidden />
            {state.error}
          </div>
        )}

        <button type="submit" disabled={pending} className="btn btn-primary w-full py-2.5">
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
          {pending ? 'Verifying credentials' : 'Sign in to operations'}
        </button>
      </form>

      <div className="mt-5 rounded-lg border border-white/8 bg-navy-925/70">
        <button
          type="button"
          onClick={() => setPickerOpen((current) => !current)}
          className="flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left"
          aria-expanded={pickerOpen}
        >
          <span className="flex items-center gap-2 text-[11px] font-semibold text-slate-300">
            <UserSquare2 className="h-3.5 w-3.5 text-green-400" aria-hidden />
            Demonstration accounts
          </span>
          <ChevronRight
            className={`h-3.5 w-3.5 text-slate-500 transition-transform ${pickerOpen ? 'rotate-90' : ''}`}
            aria-hidden
          />
        </button>

        {pickerOpen && (
          <div className="border-t border-white/8 p-2">
            <p className="px-1 pb-2 text-[10px] leading-relaxed text-slate-500">
              Authentication integration with PRASA is pending approval. Use a demonstration
              account below â€” the shared password is{' '}
              <span className="font-mono text-slate-300">{DEMO_PASSWORD}</span>.
            </p>
            <div className="max-h-[218px] space-y-1 overflow-y-auto pr-0.5">
              {DEMO_ACCOUNTS.map((account) => (
                <button
                  key={account.ref}
                  type="button"
                  onClick={() => choose(account)}
                  className="flex w-full items-center justify-between gap-3 rounded-md px-2 py-2 text-left transition-colors hover:bg-white/6"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-[11.5px] font-semibold text-slate-200">
                      {account.name}
                    </span>
                    <span className={`block truncate text-[10px] ${account.accent}`}>{account.role}</span>
                  </span>
                  <span className="flex-none font-mono text-[10px] text-slate-500">{account.ref}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

