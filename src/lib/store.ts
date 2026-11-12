import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { scryptSync, timingSafeEqual, randomUUID } from 'node:crypto'

import { availableActions } from './permissions'
import * as seed from './seed'
import type {
  Alert,
  ApprovalEntry,
  AuditEntry,
  CallRecord,
  Channel,
  ConditionAssessment,
  DataSource,
  Department,
  Employee,
  EnvironmentalReading,
  MaintenanceReport,
  Message,
  NetworkNode,
  Notification,
  OperationsSnapshot,
  PublicEmployee,
  Role,
  Segment,
  SensorDevice,
  TelemetryReading,
  TrainMovement,
  TrainRun,
  WorkflowStage,
} from './types'

/* ───────────────────────────── Backend ─────────────────────────────── */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
const SUPABASE_KEY = (
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)?.trim()

export const dataSource: DataSource =
  SUPABASE_URL && SUPABASE_KEY && process.env.REGEN_FORCE_DEMO !== '1' ? 'supabase' : 'demo'

export const dataSourceLabel =
  dataSource === 'supabase' ? 'Supabase · PostgreSQL' : 'Bundled demonstration dataset'

let cachedClient: SupabaseClient | null = null

function supabase(): SupabaseClient {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    throw new Error('Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.')
  }
  if (!cachedClient) {
    cachedClient = createClient(SUPABASE_URL, SUPABASE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
  }
  return cachedClient
}

/* ──────────────────────── Row shape conversion ─────────────────────── */

const toCamelKey = (key: string) => key.replace(/_([a-z0-9])/g, (_, char: string) => char.toUpperCase())
const toSnakeKey = (key: string) => key.replace(/[A-Z]/g, (char) => `_${char.toLowerCase()}`)

function camelRow<T>(row: Record<string, unknown>): T {
  const result: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(row)) result[toCamelKey(key)] = value
  return result as T
}

function snakeRow(row: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(row)) result[toSnakeKey(key)] = value
  return result
}

async function selectAll<T>(table: string): Promise<T[]> {
  const { data, error } = await supabase().from(table).select('*')
  if (error) throw new Error(`Supabase query failed on "${table}": ${error.message}`)
  return (data ?? []).map((row) => camelRow<T>(row as Record<string, unknown>))
}

async function insertRow<T>(table: string, row: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase().from(table).insert(snakeRow(row)).select('*').single()
  if (error) throw new Error(`Supabase insert failed on "${table}": ${error.message}`)
  return camelRow<T>(data as Record<string, unknown>)
}

async function patchRows(
  table: string,
  match: Record<string, unknown>,
  patch: Record<string, unknown>,
): Promise<void> {
  const { error } = await supabase().from(table).update(snakeRow(patch)).match(snakeRow(match))
  if (error) throw new Error(`Supabase update failed on "${table}": ${error.message}`)
}

/* ─────────────────────── Offline demonstration store ───────────────── */

const HOUR = 3_600_000
const MINUTE = 60_000

/**
 * The demo store is held on `globalThis` so that it survives Next.js hot
 * reloads during development. It is process-local: restarting the server
 * resets the dataset, which is why the UI always labels demo mode.
 */
const globalStore = globalThis as typeof globalThis & { __regenStore?: OperationsSnapshot }

function demo(): OperationsSnapshot {
  if (!globalStore.__regenStore) {
    globalStore.__regenStore = {
      employees: structuredClone(seed.employees),
      departments: structuredClone(seed.departments),
      segments: structuredClone(seed.segments),
      nodes: structuredClone(seed.nodes),
      sensors: structuredClone(seed.sensors),
      telemetry: structuredClone(seed.telemetry),
      movements: structuredClone(seed.movements),
      assessments: structuredClone(seed.assessments),
      alerts: structuredClone(seed.alerts),
      reports: structuredClone(seed.reports),
      approvals: structuredClone(seed.approvals),
      channels: structuredClone(seed.channels),
      messages: structuredClone(seed.messages),
      calls: structuredClone(seed.calls),
      notifications: structuredClone(seed.notifications),
      audit: structuredClone(seed.audit),
      environment: structuredClone(seed.environment),
      trains: structuredClone(seed.trains),
    }
  }
  return globalStore.__regenStore
}

const byDateDesc = (a: string, b: string) => (a < b ? 1 : -1)

/* ───────────────────────────── Snapshot ───────────────────────────── */

export async function loadSnapshot(): Promise<OperationsSnapshot> {
  if (dataSource === 'demo') {
    const state = demo()
    return {
      ...state,
      telemetry: [...state.telemetry].sort((a, b) => byDateDesc(a.capturedAt, b.capturedAt)),
      movements: [...state.movements].sort((a, b) => byDateDesc(a.detectedAt, b.detectedAt)),
      messages: [...state.messages].sort((a, b) => byDateDesc(a.sentAt, b.sentAt)),
      notifications: [...state.notifications].sort((a, b) => byDateDesc(a.createdAt, b.createdAt)),
      audit: [...state.audit].sort((a, b) => byDateDesc(a.createdAt, b.createdAt)),
      calls: [...state.calls].sort((a, b) => byDateDesc(a.startedAt, b.startedAt)),
    }
  }

  const [
    employees,
    departments,
    segments,
    nodes,
    sensors,
    telemetry,
    movements,
    assessments,
    alerts,
    reports,
    approvals,
    channels,
    messages,
    calls,
    notifications,
    audit,
    environment,
    trains,
  ] = await Promise.all([
    selectAll<Employee>('employees'),
    selectAll<Department>('departments'),
    selectAll<Segment>('rail_segments'),
    selectAll<NetworkNode>('rail_nodes'),
    selectAll<SensorDevice>('sensor_devices'),
    selectAll<TelemetryReading>('telemetry_readings'),
    selectAll<TrainMovement>('train_movements'),
    selectAll<ConditionAssessment>('condition_assessments'),
    selectAll<Alert>('alerts'),
    selectAll<MaintenanceReport>('maintenance_reports'),
    selectAll<ApprovalEntry>('approvals'),
    selectAll<Channel>('channels'),
    selectAll<Message>('messages'),
    selectAll<CallRecord>('calls'),
    selectAll<Notification>('notifications'),
    selectAll<AuditEntry>('audit_entries'),
    selectAll<EnvironmentalReading>('environmental_readings'),
    selectAll<TrainRun>('train_runs'),
  ])

  return {
    employees,
    departments,
    segments,
    nodes,
    sensors,
    telemetry: telemetry.sort((a, b) => byDateDesc(a.capturedAt, b.capturedAt)),
    movements: movements.sort((a, b) => byDateDesc(a.detectedAt, b.detectedAt)),
    assessments,
    alerts,
    reports,
    approvals,
    channels,
    messages: messages.sort((a, b) => byDateDesc(a.sentAt, b.sentAt)),
    calls: calls.sort((a, b) => byDateDesc(a.startedAt, b.startedAt)),
    notifications: notifications.sort((a, b) => byDateDesc(a.createdAt, b.createdAt)),
    audit: audit.sort((a, b) => byDateDesc(a.createdAt, b.createdAt)),
    environment,
    trains,
  }
}

/* ─────────────────────────────── Auth ──────────────────────────────── */

export function verifyPassword(password: string, salt: string, hash: string): boolean {
  try {
    const derived = scryptSync(password, salt, 64)
    const expected = Buffer.from(hash, 'hex')
    if (derived.length !== expected.length) return false
    return timingSafeEqual(derived, expected)
  } catch {
    return false
  }
}

export async function findEmployeeByRef(employeeRef: string): Promise<Employee | null> {
  const normalised = employeeRef.trim().toUpperCase()
  if (dataSource === 'demo') {
    return demo().employees.find((employee) => employee.employeeRef.toUpperCase() === normalised) ?? null
  }
  const { data, error } = await supabase()
    .from('employees')
    .select('*')
    .ilike('employee_ref', normalised)
    .limit(1)
    .maybeSingle()
  if (error) throw new Error(`Supabase query failed on "employees": ${error.message}`)
  return data ? camelRow<Employee>(data as Record<string, unknown>) : null
}

export async function findEmployeeById(id: string): Promise<Employee | null> {
  if (dataSource === 'demo') {
    return demo().employees.find((employee) => employee.id === id) ?? null
  }
  const { data, error } = await supabase().from('employees').select('*').eq('id', id).maybeSingle()
  if (error) throw new Error(`Supabase query failed on "employees": ${error.message}`)
  return data ? camelRow<Employee>(data as Record<string, unknown>) : null
}

/** Strips credential fields before an employee record crosses to the browser. */
export function toPublicEmployee(employee: Employee): PublicEmployee {
  const { passwordHash: _hash, passwordSalt: _salt, ...rest } = employee
  return rest
}

/* ────────────────────────────── Audit ─────────────────────────────── */

async function writeAudit(actor: Employee, entry: Omit<AuditEntry, 'id' | 'createdAt' | 'actorId'>) {
  const record: AuditEntry = {
    id: randomUUID(),
    actorId: actor.id,
    createdAt: new Date().toISOString(),
    ...entry,
  }
  if (dataSource === 'demo') {
    demo().audit.unshift(record)
    return
  }
  await insertRow<AuditEntry>('audit_entries', { ...record })
}

/* ───────────────────────── Maintenance workflow ────────────────────── */

export type CreateReportInput = {
  title: string
  description: string
  segmentId: string
  departmentSlug: string
  severity: MaintenanceReport['severity']
  locationNote: string
  photoName?: string
}

export async function createReport(input: CreateReportInput, actor: Employee): Promise<MaintenanceReport> {
  const snapshot = await loadSnapshot()
  const nextNumber =
    snapshot.reports
      .map((report) => Number(report.reference.split('-').pop()))
      .filter((value) => Number.isFinite(value))
      .reduce((max, value) => Math.max(max, value), 140) + 1

  const report: MaintenanceReport = {
    id: randomUUID(),
    reference: `MR-2026-${String(nextNumber).padStart(4, '0')}`,
    title: input.title,
    description: input.description,
    segmentId: input.segmentId,
    departmentSlug: input.departmentSlug,
    severity: input.severity,
    stage: 'reported',
    reportedBy: actor.id,
    reportedAt: new Date().toISOString(),
    photos: input.photoName ? [input.photoName] : [],
    dueAt: null,
    assignedTo: null,
    instructions: null,
    recommendedAction: null,
    sensorEvidence: null,
    evidenceNotes: null,
    completedAt: null,
    locationNote: input.locationNote,
  }

  const approval: ApprovalEntry = {
    id: randomUUID(),
    reportId: report.id,
    stage: 'reported',
    actorId: actor.id,
    actorRole: actor.role,
    decision: 'Report submitted',
    comment: input.photoName ? `Photographic evidence attached: ${input.photoName}` : 'No photographs attached.',
    decidedAt: report.reportedAt,
  }

  const notification: Notification = {
    id: randomUUID(),
    title: 'New field report',
    body: `${report.reference} logged at ${input.locationNote} by ${actor.fullName}.`,
    severity: input.severity === 'low' ? 'medium' : input.severity,
    createdAt: report.reportedAt,
    readAt: null,
    href: `/portal/maintenance/${report.reference}`,
  }

  if (dataSource === 'demo') {
    const state = demo()
    state.reports.unshift(report)
    state.approvals.push(approval)
    state.notifications.unshift(notification)
    await writeAudit(actor, {
      action: 'Report created',
      entity: 'maintenance_report',
      entityId: report.reference,
      detail: `${report.title} — ${input.locationNote}`,
    })
    return report
  }

  await insertRow<MaintenanceReport>('maintenance_reports', { ...report })
  await insertRow<ApprovalEntry>('approvals', { ...approval })
  await insertRow<Notification>('notifications', { ...notification })
  await writeAudit(actor, {
    action: 'Report created',
    entity: 'maintenance_report',
    entityId: report.reference,
    detail: `${report.title} — ${input.locationNote}`,
  })
  return report
}

export type TransitionInput = {
  comment: string
  recommendedAction?: string
  sensorEvidence?: string
  evidenceNotes?: string
  assignedTo?: string
  dueAt?: string
  instructions?: string
}

export async function transitionReport(
  reference: string,
  actionId: string,
  input: TransitionInput,
  actor: Employee,
): Promise<{ ok: true; report: MaintenanceReport } | { ok: false; error: string }> {
  const snapshot = await loadSnapshot()
  const report = snapshot.reports.find((item) => item.reference === reference)
  if (!report) return { ok: false, error: 'That report no longer exists.' }

  const action = availableActions(report, actor).find((item) => item.id === actionId)
  if (!action) return { ok: false, error: 'Your role cannot perform this step at the current stage.' }
  if (action.commentRequired && input.comment.trim().length < 4) {
    return { ok: false, error: 'A decision note of at least 4 characters is required.' }
  }
  if (action.requiresWorkOrder) {
    if (!input.assignedTo) return { ok: false, error: 'Select the maintenance team member who will execute the work.' }
    if (!input.dueAt) return { ok: false, error: 'Set the work order deadline.' }
  }
  if (action.requiresEvidence && (input.evidenceNotes ?? '').trim().length < 8) {
    return { ok: false, error: 'Completion evidence of at least 8 characters is required.' }
  }

  const decidedAt = new Date().toISOString()
  const patch: Partial<MaintenanceReport> = {
    stage: action.to as WorkflowStage,
  }
  if (action.id === 'assess') {
    patch.recommendedAction = input.recommendedAction?.trim() || null
    patch.sensorEvidence = input.sensorEvidence?.trim() || null
  }
  if (action.requiresWorkOrder) {
    patch.assignedTo = input.assignedTo ?? null
    patch.dueAt = input.dueAt ?? null
    patch.instructions = input.instructions?.trim() || null
  }
  if (action.id === 'complete') {
    patch.evidenceNotes = input.evidenceNotes?.trim() || null
    patch.completedAt = decidedAt
  }
  if (action.id === 'reject') {
    patch.evidenceNotes = null
  }

  const approval: ApprovalEntry = {
    id: randomUUID(),
    reportId: report.id,
    stage: action.to,
    actorId: actor.id,
    actorRole: actor.role,
    decision: action.label,
    comment: input.comment.trim() || action.description,
    decidedAt,
  }

  const notification: Notification = {
    id: randomUUID(),
    title: `${report.reference} · ${action.label}`,
    body: `${actor.fullName} moved the report to "${action.label}".`,
    severity: action.to === 'rejected' ? 'high' : 'medium',
    createdAt: decidedAt,
    readAt: null,
    href: `/portal/maintenance/${report.reference}`,
  }

  if (dataSource === 'demo') {
    const state = demo()
    const target = state.reports.find((item) => item.reference === reference)
    if (!target) return { ok: false, error: 'That report no longer exists.' }
    Object.assign(target, patch)
    state.approvals.push(approval)
    state.notifications.unshift(notification)
    if (action.to === 'in-progress') {
      state.alerts.unshift({
        id: randomUUID(),
        reference: `ALR-2026-${String(900 + state.alerts.length).slice(-4)}`,
        segmentId: target.segmentId,
        departmentSlug: target.departmentSlug,
        title: `Work order active — ${target.reference}`,
        detail: `${target.title} is now being executed by the maintenance team.`,
        severity: target.severity,
        status: 'open',
        occurredAt: decidedAt,
        source: 'Maintenance workflow',
      })
    }
    await writeAudit(actor, {
      action: action.label,
      entity: 'maintenance_report',
      entityId: target.reference,
      detail: input.comment.trim() || action.description,
    })
    return { ok: true, report: target }
  }

  await patchRows('maintenance_reports', { reference }, patch as Record<string, unknown>)
  await insertRow<ApprovalEntry>('approvals', { ...approval })
  await insertRow<Notification>('notifications', { ...notification })
  await writeAudit(actor, {
    action: action.label,
    entity: 'maintenance_report',
    entityId: report.reference,
    detail: input.comment.trim() || action.description,
  })
  return { ok: true, report: { ...report, ...patch } }
}

/* ───────────────────────────── Telemetry ───────────────────────────── */

export async function injectSimulatedReading(sensorId: string, actor: Employee): Promise<TelemetryReading> {
  const snapshot = await loadSnapshot()
  const readings = snapshot.telemetry.filter((row) => row.sensorId === sensorId)
  const last = readings[0]
  const base = last?.vibrationVelocity ?? 4.2
  const jitter = (Math.random() - 0.35) * 2.4
  const reading: TelemetryReading = {
    id: randomUUID(),
    readingId: `RD-SIM-${String(Math.floor(Math.random() * 9000) + 1000)}`,
    sensorId,
    capturedAt: new Date().toISOString(),
    vibrationVelocity: Number(Math.max(0.4, base + jitter).toFixed(2)),
    temperature: null,
    structuralStrain: null,
    isSimulated: true,
    qualityPct: last?.qualityPct ?? 90,
  }

  if (dataSource === 'demo') {
    demo().telemetry.unshift(reading)
    await writeAudit(actor, {
      action: 'Simulated reading injected',
      entity: 'sensor_device',
      entityId: sensorId,
      detail: `Manual demonstration reading ${reading.readingId} at ${reading.vibrationVelocity} mm/s.`,
    })
    return reading
  }

  await insertRow<TelemetryReading>('telemetry_readings', { ...reading })
  await writeAudit(actor, {
    action: 'Simulated reading injected',
    entity: 'sensor_device',
    entityId: sensorId,
    detail: `Manual demonstration reading ${reading.readingId} at ${reading.vibrationVelocity} mm/s.`,
  })
  return reading
}

/* ─────────────────────────── Train movements ───────────────────────── */

export type LogMovementInput = {
  segmentId: string
  direction: 'up' | 'down'
  sourceKind: TrainMovement['sourceKind']
  trainReference: string
  note: string
}

export async function logMovement(input: LogMovementInput, actor: Employee): Promise<TrainMovement> {
  const snapshot = await loadSnapshot()
  const nextNumber =
    snapshot.movements
      .map((movement) => Number(movement.movementId.split('-').pop()))
      .filter((value) => Number.isFinite(value))
      .reduce((max, value) => Math.max(max, value), 118) + 1

  const movement: TrainMovement = {
    id: randomUUID(),
    movementId: `TM-0024-${String(nextNumber).padStart(3, '0')}`,
    segmentId: input.segmentId,
    sensorId: null,
    detectedAt: new Date().toISOString(),
    direction: input.direction,
    source:
      input.sourceKind === 'sensor'
        ? `REGEN-EDGE-KP01 · events channel`
        : input.sourceKind === 'train-control'
          ? `Train Control · ${actor.fullName}`
          : `Manual entry · ${actor.fullName}`,
    sourceKind: input.sourceKind,
    trainReference: input.trainReference.trim() || null,
    peakVibration: null,
    durationSeconds: null,
    reviewStatus: 'normal',
    isSimulated: input.sourceKind === 'manual',
  }

  if (dataSource === 'demo') {
    demo().movements.unshift(movement)
    await writeAudit(actor, {
      action: 'Train movement logged',
      entity: 'train_movement',
      entityId: movement.movementId,
      detail: `${input.segmentId} · ${input.direction} · ${input.note || 'no note'}`,
    })
    return movement
  }

  await insertRow<TrainMovement>('train_movements', { ...movement })
  await writeAudit(actor, {
    action: 'Train movement logged',
    entity: 'train_movement',
    entityId: movement.movementId,
    detail: `${input.segmentId} · ${input.direction} · ${input.note || 'no note'}`,
  })
  return movement
}

/* ─────────────────────────── Communication ─────────────────────────── */

export type SendMessageInput = {
  channelSlug: string
  body: string
  kind: Message['kind']
  attachmentName?: string
  locationLabel?: string
}

export async function sendMessage(input: SendMessageInput, actor: Employee): Promise<Message> {
  const message: Message = {
    id: randomUUID(),
    channelSlug: input.channelSlug,
    senderId: actor.id,
    body: input.body,
    sentAt: new Date().toISOString(),
    kind: input.kind,
    attachmentName: input.attachmentName ?? null,
    locationLabel: input.locationLabel ?? null,
    isSimulated: false,
  }

  if (dataSource === 'demo') {
    demo().messages.unshift(message)
    return message
  }

  await insertRow<Message>('messages', { ...message })
  return message
}

export async function recordCall(
  input: { channelSlug: string; kind: CallRecord['kind']; durationSeconds: number; participants: string[] },
  _actor: Employee,
): Promise<CallRecord> {
  const call: CallRecord = {
    id: randomUUID(),
    channelSlug: input.channelSlug,
    kind: input.kind,
    startedAt: new Date(Date.now() - input.durationSeconds * 1000).toISOString(),
    durationSeconds: input.durationSeconds,
    participants: input.participants,
    status: input.durationSeconds > 0 ? 'completed' : 'missed',
  }

  if (dataSource === 'demo') {
    demo().calls.unshift(call)
    return call
  }

  await insertRow<CallRecord>('calls', { ...call })
  return call
}

export async function markNotificationsRead(actor: Employee): Promise<void> {
  const now = new Date().toISOString()
  if (dataSource === 'demo') {
    for (const notification of demo().notifications) notification.readAt = notification.readAt ?? now
    return
  }
  await supabase().from('notifications').update({ read_at: now }).is('read_at', null)
}

/* ────────────────────────────── Helpers ────────────────────────────── */

export async function getEmployeesPublic(): Promise<PublicEmployee[]> {
  const snapshot = await loadSnapshot()
  return snapshot.employees
    .map(toPublicEmployee)
    .sort((a, b) => a.fullName.localeCompare(b.fullName))
}

export function roleDisplayName(role: Role): string {
  return role
}

/** Demonstrates the age of demo data so the UI never implies a live feed. */
export const demoDatasetNow = seed.demoNow

export const DEMO_MINUTE = MINUTE
export const DEMO_HOUR = HOUR
