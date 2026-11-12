'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2, ChevronRight, Loader2, X } from 'lucide-react'

import { transitionReportAction } from '@/app/portal/actions'
import { EmptyState, Panel, PanelHeader } from '@/components/ui/primitives'
import type { WorkflowAction } from '@/lib/permissions'

type Member = { id: string; fullName: string; role: string }

type Props = {
  reference: string
  actions: WorkflowAction[]
  members: Member[]
  stageLabel: string
}

const TONE_CLASS: Record<WorkflowAction['tone'], string> = {
  primary: 'btn btn-primary w-full justify-between',
  danger: 'btn btn-danger w-full justify-between',
  neutral: 'btn btn-ghost w-full justify-between',
}

export function WorkflowActions({ reference, actions, members, stageLabel }: Props) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [active, setActive] = useState<WorkflowAction | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({
    comment: '',
    recommendedAction: '',
    sensorEvidence: '',
    evidenceNotes: '',
    assignedTo: members[0]?.id ?? '',
    dueAt: '',
    instructions: '',
  })

  const open = (action: WorkflowAction) => {
    setActive(action)
    setError(null)
    setForm((current) => ({
      ...current,
      comment: '',
      recommendedAction: action.id === 'assess' ? current.recommendedAction : '',
      sensorEvidence: action.id === 'assess' ? current.sensorEvidence : '',
      evidenceNotes: '',
      instructions: '',
    }))
  }

  const submit = (event: React.FormEvent) => {
    event.preventDefault()
    if (!active) return
    setError(null)
    startTransition(async () => {
      const result = await transitionReportAction(reference, active.id, {
        comment: form.comment,
        recommendedAction: form.recommendedAction || undefined,
        sensorEvidence: form.sensorEvidence || undefined,
        evidenceNotes: form.evidenceNotes || undefined,
        assignedTo: active.requiresWorkOrder ? form.assignedTo : undefined,
        dueAt: active.requiresWorkOrder && form.dueAt ? new Date(form.dueAt).toISOString() : undefined,
        instructions: form.instructions || undefined,
      })
      if (!result.ok) {
        setError(result.error)
        return
      }
      setActive(null)
      router.refresh()
    })
  }

  if (actions.length === 0) {
    return (
      <Panel>
        <PanelHeader eyebrow="Workflow" title="No action available" />
        <EmptyState
          title={`Stage: ${stageLabel}`}
          description="Your role has no transition at this stage. The report stays with the current owner until they act."
          icon={CheckCircle2}
        />
      </Panel>
    )
  }

  return (
    <Panel>
      <PanelHeader
        eyebrow="Workflow"
        title="Available actions"
        description="Only the steps your role may take at this stage are shown. Every step is written to the approval history."
      />

      {!active && (
        <div className="space-y-1.5 p-3 sm:p-4">
          {actions.map((action) => (
            <button key={action.id} type="button" onClick={() => open(action)} className={TONE_CLASS[action.tone]}>
              <span>{action.label}</span>
              <ChevronRight className="h-3.5 w-3.5" aria-hidden />
            </button>
          ))}
        </div>
      )}

      {active && (
        <form onSubmit={submit} className="space-y-3 p-3 sm:p-4">
          <div className="flex items-start justify-between gap-2 rounded-md border border-white/8 bg-navy-950/50 px-2.5 py-2">
            <div className="min-w-0">
              <p className="text-[11px] font-bold text-slate-100">{active.label}</p>
              <p className="mt-0.5 text-[10px] leading-snug text-slate-500">{active.description}</p>
            </div>
            <button
              type="button"
              onClick={() => setActive(null)}
              className="grid h-6 w-6 flex-none place-items-center rounded text-slate-500 hover:bg-white/6 hover:text-slate-200"
              aria-label="Cancel action"
            >
              <X className="h-3 w-3" />
            </button>
          </div>

          {active.id === 'assess' && (
            <>
              <label className="block">
                <span className="field-label">Recommended maintenance action</span>
                <input
                  className="field"
                  value={form.recommendedAction}
                  onChange={(event) => setForm((current) => ({ ...current, recommendedAction: event.target.value }))}
                  placeholder="Tamp and re-ballast KM 0.2 – KM 0.6"
                />
              </label>
              <label className="block">
                <span className="field-label">Sensor evidence considered</span>
                <input
                  className="field"
                  value={form.sensorEvidence}
                  onChange={(event) => setForm((current) => ({ ...current, sensorEvidence: event.target.value }))}
                  placeholder="REGEN-EDGE-KP01 · 3 passages above 10 mm/s in 24h"
                />
              </label>
            </>
          )}

          {active.requiresWorkOrder && (
            <>
              <label className="block">
                <span className="field-label">Assign maintenance team member</span>
                <select
                  className="field"
                  value={form.assignedTo}
                  onChange={(event) => setForm((current) => ({ ...current, assignedTo: event.target.value }))}
                >
                  {members.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.fullName}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="field-label">Work order deadline</span>
                <input
                  type="datetime-local"
                  className="field"
                  value={form.dueAt}
                  onChange={(event) => setForm((current) => ({ ...current, dueAt: event.target.value }))}
                />
              </label>
              <label className="block">
                <span className="field-label">Instructions to the team</span>
                <textarea
                  className="field min-h-[64px] resize-y"
                  value={form.instructions}
                  onChange={(event) => setForm((current) => ({ ...current, instructions: event.target.value }))}
                  placeholder="Possession reference, protection arrangements, materials required."
                />
              </label>
            </>
          )}

          {active.requiresEvidence && (
            <label className="block">
              <span className="field-label">Completion evidence</span>
              <textarea
                className="field min-h-[74px] resize-y"
                value={form.evidenceNotes}
                onChange={(event) => setForm((current) => ({ ...current, evidenceNotes: event.target.value }))}
                placeholder="Work performed, materials used, photographs taken, verification readings."
              />
            </label>
          )}

          <label className="block">
            <span className="field-label">
              Decision note{active.commentRequired ? '' : ' (optional)'}
            </span>
            <textarea
              className="field min-h-[58px] resize-y"
              value={form.comment}
              onChange={(event) => setForm((current) => ({ ...current, comment: event.target.value }))}
              placeholder={active.commentRequired ? 'Required: record the reason for this decision.' : 'Context for the approval history.'}
            />
          </label>

          {error && <p className="text-[10.5px] font-semibold text-red-300">{error}</p>}

          <div className="flex gap-2">
            <button type="submit" className={`btn ${active.tone === 'danger' ? 'btn-danger' : 'btn-primary'} flex-1`} disabled={pending}>
              {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden /> : <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />}
              Confirm {active.label.toLowerCase()}
            </button>
            <button type="button" onClick={() => setActive(null)} className="btn btn-ghost" disabled={pending}>
              Cancel
            </button>
          </div>
        </form>
      )}
    </Panel>
  )
}
