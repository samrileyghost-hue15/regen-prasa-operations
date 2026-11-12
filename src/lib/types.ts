/**
 * REGEN × PRASA — shared domain types.
 *
 * These mirror the PostgreSQL schema in `supabase/01_schema.sql` (snake_case
 * columns are converted at the data-layer boundary, so application code is
 * always camelCase).
 */

export type Role =
  | 'operations-head'
  | 'operations-controller'
  | 'department-manager'
  | 'regen-technical'
  | 'engineer'
  | 'field-worker'
  | 'administrator'

export type Discipline = 'fixed-infrastructure' | 'train-operations'

export type Employee = {
  id: string
  fullName: string
  employeeRef: string
  role: Role
  departmentSlug: string | null
  region: string
  email: string
  phone: string
  isOnline: boolean
  lastSeen: string
  passwordSalt: string
  passwordHash: string
}

/** Employee record safe to serialise to the browser — no credential material. */
export type PublicEmployee = Omit<Employee, 'passwordHash' | 'passwordSalt'>

export type Department = {
  id: string
  slug: string
  name: string
  discipline: Discipline
  parentSlug: string | null
  description: string
  headcount: number
  status: SegmentStatus
  slaHours: number
  kpiLabel: string
  kpiValue: string
}

export type SegmentStatus = 'normal' | 'warning' | 'critical' | 'offline'

export type NetworkNode = {
  id: string
  name: string
  x: number
  y: number
  kind: 'station' | 'junction' | 'depot' | 'pilot'
}

export type Segment = {
  id: string
  trackId: string
  name: string
  corridor: string
  direction: 'up' | 'down' | 'bi-directional'
  startKm: number
  endKm: number
  status: SegmentStatus
  conditionScore: number
  infrastructure: string[]
  departmentSlugs: string[]
  fromNode: string
  toNode: string
  siteCode: string
}

export type SensorChannel = {
  name: string
  kind: 'telemetry' | 'signal' | 'events'
  status: 'streaming' | 'degraded' | 'idle'
  rateHz: number
}

export type SensorDevice = {
  id: string
  sensorId: string
  segmentId: string
  status: 'online' | 'degraded' | 'offline'
  lastTransmission: string
  signalQuality: number
  firmware: string
  installationPoint: string
  supportsVibration: boolean
  supportsTemperature: boolean
  supportsStrain: boolean
  isSimulated: boolean
  channels: SensorChannel[]
}

export type TelemetryReading = {
  id: string
  readingId: string
  sensorId: string
  capturedAt: string
  vibrationVelocity: number
  temperature: number | null
  structuralStrain: number | null
  isSimulated: boolean
  qualityPct: number
}

export type MovementSourceKind = 'sensor' | 'train-control' | 'manual'

export type TrainMovement = {
  id: string
  movementId: string
  segmentId: string
  sensorId: string | null
  detectedAt: string
  direction: 'up' | 'down'
  source: string
  sourceKind: MovementSourceKind
  trainReference: string | null
  peakVibration: number | null
  durationSeconds: number | null
  reviewStatus: 'normal' | 'review' | 'critical'
  isSimulated: boolean
}

export type ConditionAssessment = {
  id: string
  segmentId: string
  condition: 'good' | 'fair' | 'poor' | 'failed'
  score: number
  basis: string
  assessedAt: string
  notes: string
}

export type AlertSeverity = 'critical' | 'high' | 'medium' | 'low'

export type Alert = {
  id: string
  reference: string
  segmentId: string
  departmentSlug: string
  title: string
  detail: string
  severity: AlertSeverity
  status: 'open' | 'acknowledged' | 'resolved'
  occurredAt: string
  source: string
}

export type Severity = 'low' | 'medium' | 'high' | 'critical'

/**
 * The maintenance lifecycle, in order. Every report starts at `reported`
 * and moves forward only through the transitions allowed in
 * `src/lib/permissions.ts`.
 */
export type WorkflowStage =
  | 'reported'
  | 'verified'
  | 'assessed'
  | 'awaiting-authorisation'
  | 'authorised'
  | 'in-progress'
  | 'completed'
  | 'closed'
  | 'rejected'

export type MaintenanceReport = {
  id: string
  reference: string
  title: string
  description: string
  segmentId: string
  departmentSlug: string
  severity: Severity
  stage: WorkflowStage
  reportedBy: string
  reportedAt: string
  photos: string[]
  dueAt: string | null
  assignedTo: string | null
  instructions: string | null
  recommendedAction: string | null
  sensorEvidence: string | null
  evidenceNotes: string | null
  completedAt: string | null
  locationNote: string
}

export type ApprovalEntry = {
  id: string
  reportId: string
  stage: WorkflowStage
  actorId: string
  actorRole: Role | 'system'
  decision: string
  comment: string
  decidedAt: string
}

export type Channel = {
  id: string
  slug: string
  name: string
  kind: 'department' | 'team' | 'direct' | 'operations'
  description: string
  memberIds: string[]
}

export type Message = {
  id: string
  channelSlug: string
  senderId: string
  body: string
  sentAt: string
  kind: 'text' | 'location' | 'image' | 'document' | 'system'
  attachmentName: string | null
  locationLabel: string | null
  isSimulated: boolean
}

export type CallRecord = {
  id: string
  channelSlug: string
  kind: 'audio' | 'video'
  startedAt: string
  durationSeconds: number
  participants: string[]
  status: 'completed' | 'missed'
}

export type Notification = {
  id: string
  title: string
  body: string
  severity: AlertSeverity
  createdAt: string
  readAt: string | null
  href: string
}

export type AuditEntry = {
  id: string
  actorId: string
  action: string
  entity: string
  entityId: string
  detail: string
  createdAt: string
}

export type EnvironmentalReading = {
  id: string
  segmentId: string
  capturedAt: string
  ambientTempC: number
  trackTempC: number
  rainfallMm: number
  humidityPct: number
}

/** A live train token rendered on the schematic network map. */
export type TrainRun = {
  id: string
  label: string
  segmentId: string
  direction: 'up' | 'down'
  progress: number
  speedKph: number
  isSimulated: boolean
}

/** Composite view model used by the Operations Centre. */
export type OperationsSnapshot = {
  employees: Employee[]
  departments: Department[]
  segments: Segment[]
  nodes: NetworkNode[]
  sensors: SensorDevice[]
  telemetry: TelemetryReading[]
  movements: TrainMovement[]
  assessments: ConditionAssessment[]
  alerts: Alert[]
  reports: MaintenanceReport[]
  approvals: ApprovalEntry[]
  channels: Channel[]
  messages: Message[]
  calls: CallRecord[]
  notifications: Notification[]
  audit: AuditEntry[]
  environment: EnvironmentalReading[]
  trains: TrainRun[]
}

export type DataSource = 'supabase' | 'demo'
