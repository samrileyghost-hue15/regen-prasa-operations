'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

import { endSession, requireUser } from '@/lib/auth'
import { can } from '@/lib/permissions'
import {
  createReport,
  injectSimulatedReading,
  logMovement,
  markNotificationsRead,
  recordCall,
  sendMessage,
  transitionReport,
  type CreateReportInput,
  type LogMovementInput,
  type SendMessageInput,
  type TransitionInput,
} from '@/lib/store'

/**
 * All portal mutations run on the server and re-check the caller's role.
 * The UI hides actions a role cannot take, but that is convenience only —
 * these guards are the authoritative check.
 */

function refreshPortal() {
  revalidatePath('/portal', 'layout')
}

export async function signOutAction() {
  await endSession()
  redirect('/')
}

/* ─────────────────────────── Maintenance ──────────────────────────── */

export type ActionResult = { ok: true; reference?: string } | { ok: false; error: string }

const SEGMENT_INPUT = /^(seg-[a-z0-9-]+)$/
const DEPARTMENT_INPUT = /^[a-z0-9-]+$/

export async function createReportAction(input: CreateReportInput): Promise<ActionResult> {
  const user = await requireUser()
  if (!can.createReport(user)) return { ok: false, error: 'Your role cannot submit maintenance reports.' }

  const title = input.title?.trim() ?? ''
  const description = input.description?.trim() ?? ''
  const locationNote = input.locationNote?.trim() ?? ''

  if (title.length < 6) return { ok: false, error: 'Give the defect a descriptive title (at least 6 characters).' }
  if (description.length < 20) {
    return { ok: false, error: 'Describe the defect in at least 20 characters so the department can verify it.' }
  }
  if (locationNote.length < 4) return { ok: false, error: 'Record where on the railway the defect was found.' }
  if (!SEGMENT_INPUT.test(input.segmentId)) return { ok: false, error: 'Select a valid railway section.' }
  if (!DEPARTMENT_INPUT.test(input.departmentSlug)) return { ok: false, error: 'Select the responsible department.' }
  if (!['low', 'medium', 'high', 'critical'].includes(input.severity)) {
    return { ok: false, error: 'Select a valid severity.' }
  }

  const report = await createReport(
    { ...input, title, description, locationNote },
    user,
  )
  refreshPortal()
  return { ok: true, reference: report.reference }
}

export async function transitionReportAction(
  reference: string,
  actionId: string,
  input: TransitionInput,
): Promise<ActionResult> {
  const user = await requireUser()
  if (!reference.startsWith('MR-')) return { ok: false, error: 'Unknown maintenance report.' }

  const result = await transitionReport(reference, actionId, input, user)
  if (!result.ok) return { ok: false, error: result.error }

  refreshPortal()
  return { ok: true, reference: result.report.reference }
}

/* ───────────────────────────── Sensor ─────────────────────────────── */

export async function injectReadingAction(sensorId: string): Promise<ActionResult> {
  const user = await requireUser()
  if (!can.simulateTelemetry(user)) {
    return { ok: false, error: 'Only REGEN technical, control or administration roles can inject test readings.' }
  }
  if (!sensorId.startsWith('REGEN-EDGE-')) return { ok: false, error: 'Unknown sensor device.' }

  await injectSimulatedReading(sensorId, user)
  refreshPortal()
  return { ok: true }
}

/* ─────────────────────────── Train register ───────────────────────── */

export async function logMovementAction(input: LogMovementInput): Promise<ActionResult> {
  const user = await requireUser()
  if (!can.logMovement(user)) return { ok: false, error: 'Your role cannot add entries to the movement register.' }
  if (!SEGMENT_INPUT.test(input.segmentId)) return { ok: false, error: 'Select a valid railway section.' }
  if (!['up', 'down'].includes(input.direction)) return { ok: false, error: 'Select a direction.' }
  if (!['sensor', 'train-control', 'manual'].includes(input.sourceKind)) {
    return { ok: false, error: 'Select a detection source.' }
  }
  if (input.sourceKind !== 'sensor' && input.trainReference.trim().length < 2) {
    return { ok: false, error: 'Record the train reference for control or manual entries.' }
  }

  await logMovement(input, user)
  refreshPortal()
  return { ok: true }
}

/* ─────────────────────────── Communication ────────────────────────── */

export async function sendMessageAction(input: SendMessageInput): Promise<ActionResult> {
  const user = await requireUser()
  if (!can.sendMessage(user)) return { ok: false, error: 'You cannot send messages.' }

  const body = input.body?.trim() ?? ''
  if (!body) return { ok: false, error: 'Write a message before sending.' }
  if (body.length > 2000) return { ok: false, error: 'Messages are limited to 2000 characters.' }
  if (!DEPARTMENT_INPUT.test(input.channelSlug) && !input.channelSlug.startsWith('direct-')) {
    return { ok: false, error: 'Unknown channel.' }
  }

  await sendMessage({ ...input, body }, user)
  refreshPortal()
  return { ok: true }
}

export async function recordCallAction(input: {
  channelSlug: string
  kind: 'audio' | 'video'
  durationSeconds: number
  participants: string[]
}): Promise<ActionResult> {
  const user = await requireUser()
  if (!input.channelSlug) return { ok: false, error: 'Unknown channel.' }
  if (!['audio', 'video'].includes(input.kind)) return { ok: false, error: 'Unknown call type.' }

  await recordCall(input, user)
  refreshPortal()
  return { ok: true }
}

export async function markNotificationsReadAction(): Promise<ActionResult> {
  const user = await requireUser()
  await markNotificationsRead(user)
  refreshPortal()
  return { ok: true }
}
