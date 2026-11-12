'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Camera, CheckCircle2, Loader2, Plus, X } from 'lucide-react'

import { createReportAction } from '@/app/portal/actions'
import { Panel, PanelHeader } from '@/components/ui/primitives'
import type { Department, Segment, Severity } from '@/lib/types'

type Props = {
  segments: Segment[]
  departments: Department[]
  defaultDepartmentSlug?: string
}

const SEVERITIES: { value: Severity; label: string; hint: string }[] = [
  { value: 'low', label: 'Low', hint: 'Cosmetic or scheduled' },
  { value: 'medium', label: 'Medium', hint: 'Monitor at next inspection' },
  { value: 'high', label: 'High', hint: 'Intervene at next possession' },
  { value: 'critical', label: 'Critical', hint: 'Safety of the line' },
]

export function ReportIntake({ segments, departments, defaultDepartmentSlug }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const [form, setForm] = useState({
    title: '',
    description: '',
    segmentId: segments[0]?.id ?? '',
    departmentSlug: defaultDepartmentSlug ?? departments[0]?.slug ?? '',
    severity: 'medium' as Severity,
    locationNote: '',
    photoName: '',
  })

  const submit = (event: React.FormEvent) => {
    event.preventDefault()
    setError(null)
    setSuccess(null)
    startTransition(async () => {
      const result = await createReportAction({
        title: form.title,
        description: form.description,
        segmentId: form.segmentId,
        departmentSlug: form.departmentSlug,
        severity: form.severity,
        locationNote: form.locationNote,
        photoName: form.photoName || undefined,
      })
      if (!result.ok) {
        setError(result.error)
        return
      }
      setSuccess(`${result.reference} submitted for department verification.`)
      setForm((current) => ({
        ...current,
        title: '',
        description: '',
        locationNote: '',
        photoName: '',
      }))
      setOpen(false)
      router.refresh()
    })
  }

  return (
    <Panel>
      <PanelHeader
        eyebrow="Field reporting"
        title="Submit a defect report"
        description="Field workers, engineers and controllers raise a defect here. It enters the workflow at Department verification."
        action={
          <button type="button" onClick={() => setOpen((value) => !value)} className={open ? 'btn btn-ghost' : 'btn btn-primary'}>
            {open ? <X className="h-3.5 w-3.5" aria-hidden /> : <Plus className="h-3.5 w-3.5" aria-hidden />}
            {open ? 'Cancel' : 'New report'}
          </button>
        }
      />

      {success && !open && (
        <div className="flex items-center gap-2 border-b border-emerald-400/20 bg-emerald-500/8 px-4 py-2.5 sm:px-5">
          <CheckCircle2 className="h-3.5 w-3.5 flex-none text-emerald-300" aria-hidden />
          <p className="text-[10.5px] font-semibold text-emerald-200">{success}</p>
        </div>
      )}

      {open && (
        <form onSubmit={submit} className="grid gap-3 p-4 sm:grid-cols-2 sm:p-5">
          <label className="block sm:col-span-2">
            <span className="field-label">Defect title</span>
            <input
              className="field"
              value={form.title}
              onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
              placeholder="Sleeper voiding between KM 3.2 and KM 3.6"
              maxLength={120}
            />
          </label>

          <label className="block sm:col-span-2">
            <span className="field-label">Description</span>
            <textarea
              className="field min-h-[86px] resize-y"
              value={form.description}
              onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
              placeholder="What did you observe, and what is the risk to the line?"
              maxLength={900}
            />
          </label>

          <label className="block">
            <span className="field-label">Railway section</span>
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
            <span className="field-label">Responsible department</span>
            <select
              className="field"
              value={form.departmentSlug}
              onChange={(event) => setForm((current) => ({ ...current, departmentSlug: event.target.value }))}
            >
              {departments.map((department) => (
                <option key={department.id} value={department.slug}>
                  {department.name}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="field-label">Location on the section</span>
            <input
              className="field"
              value={form.locationNote}
              onChange={(event) => setForm((current) => ({ ...current, locationNote: event.target.value }))}
              placeholder="KM 3.4 Â· down line Â· outside rail"
            />
          </label>

          <label className="block">
            <span className="field-label">Photograph reference</span>
            <div className="relative">
              <Camera className="pointer-events-none absolute left-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-slate-500" aria-hidden />
              <input
                className="field pl-7"
                value={form.photoName}
                onChange={(event) => setForm((current) => ({ ...current, photoName: event.target.value }))}
                placeholder="kp01-patrol-0912.jpg"
              />
            </div>
          </label>

          <fieldset className="sm:col-span-2">
            <legend className="field-label">Severity</legend>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {SEVERITIES.map((option) => (
                <label
                  key={option.value}
                  className={`cursor-pointer rounded-md border px-2.5 py-2 transition-colors ${
                    form.severity === option.value
                      ? option.value === 'critical'
                        ? 'border-red-400/50 bg-red-500/10'
                        : option.value === 'high'
                          ? 'border-amber-400/50 bg-amber-500/10'
                          : option.value === 'medium'
                            ? 'border-green-500/50 bg-green-500/10'
                            : 'border-emerald-400/50 bg-emerald-500/10'
                      : 'border-white/10 bg-navy-925/60 hover:border-white/20'
                  }`}
                >
                  <input
                    type="radio"
                    name="severity"
                    value={option.value}
                    checked={form.severity === option.value}
                    onChange={() => setForm((current) => ({ ...current, severity: option.value }))}
                    className="sr-only"
                  />
                  <span className="block text-[11px] font-bold text-slate-200">{option.label}</span>
                  <span className="mt-0.5 block text-[9px] leading-snug text-slate-500">{option.hint}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <div className="flex flex-wrap items-center gap-2 sm:col-span-2">
            <button type="submit" className="btn btn-primary" disabled={pending}>
              {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden /> : <Plus className="h-3.5 w-3.5" aria-hidden />}
              Submit report
            </button>
            {error && <p className="text-[10.5px] font-semibold text-red-300">{error}</p>}
          </div>
        </form>
      )}
    </Panel>
  )
}

