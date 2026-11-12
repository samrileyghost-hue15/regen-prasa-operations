import type { Employee, MaintenanceReport, Role, WorkflowStage } from './types'

/**
 * Role-based access control for the REGEN operations portal.
 *
 * Every permission is expressed once here and consumed by both the UI (to hide
 * actions a user cannot take) and the server actions (to reject them if they
 * are somehow submitted).
 */

export const ROLE_LABEL: Record<Role, string> = {
  'operations-head': 'Head of Operations, PRASA',
  'operations-controller': 'Operations Controller',
  'department-manager': 'Department Manager',
  'regen-technical': 'REGEN Technical',
  engineer: 'Maintenance Engineer',
  'field-worker': 'Field Worker',
  administrator: 'System Administrator',
}

export const ROLE_SHORT: Record<Role, string> = {
  'operations-head': 'Operations Head',
  'operations-controller': 'Controller',
  'department-manager': 'Dept Manager',
  'regen-technical': 'REGEN Technical',
  engineer: 'Engineer',
  'field-worker': 'Field Worker',
  administrator: 'Administrator',
}

export type NavKey =
  | 'overview'
  | 'departments'
  | 'network'
  | 'kempton-park'
  | 'movements'
  | 'maintenance'
  | 'connect'
  | 'analytics'
  | 'admin'

/** Roles allowed into each workspace. `null` means every signed-in employee. */
const NAV_ACCESS: Record<NavKey, Role[] | null> = {
  overview: null,
  departments: null,
  network: null,
  'kempton-park': null,
  movements: null,
  maintenance: null,
  connect: null,
  analytics: ['operations-head', 'operations-controller', 'department-manager', 'regen-technical', 'administrator'],
  admin: ['administrator', 'operations-head'],
}

export function canAccess(key: NavKey, role: Role): boolean {
  const allowed = NAV_ACCESS[key]
  return allowed === null || allowed.includes(role)
}

export const can = {
  /** Submit a new defect / maintenance report from the field. */
  createReport: (user: Employee) =>
    ['field-worker', 'engineer', 'department-manager', 'operations-controller', 'regen-technical', 'administrator'].includes(user.role),
  /** Verify a field report for a department. */
  verifyReport: (user: Employee, departmentSlug: string) =>
    user.role === 'administrator' || (user.role === 'department-manager' && user.departmentSlug === departmentSlug),
  /** Evaluate sensor evidence and recommend a maintenance action. */
  assessReport: (user: Employee) => ['regen-technical', 'administrator'].includes(user.role),
  /** Authorise a recommended work order. */
  authoriseWork: (user: Employee) => ['operations-head', 'administrator'].includes(user.role),
  /** Start or complete the physical work. */
  executeWork: (user: Employee) =>
    ['engineer', 'field-worker', 'department-manager', 'administrator'].includes(user.role),
  /** Sign off the completed work as the REGEN outcome record. */
  closeReport: (user: Employee) => ['regen-technical', 'administrator'].includes(user.role),
  /** Inject a simulated sensor reading or train event. */
  simulateTelemetry: (user: Employee) =>
    ['regen-technical', 'administrator', 'operations-controller'].includes(user.role),
  /** Register a train movement manually. */
  logMovement: (user: Employee) =>
    ['operations-controller', 'operations-head', 'department-manager', 'regen-technical', 'administrator'].includes(user.role),
  /** Open the administration workspace. */
  administer: (user: Employee) => ['administrator', 'operations-head'].includes(user.role),
  /** Send a message in a channel. */
  sendMessage: (_user: Employee) => true,
}

export type WorkflowActionId =
  | 'verify'
  | 'reject'
  | 'assess'
  | 'submit-authorisation'
  | 'authorise'
  | 'return'
  | 'start'
  | 'complete'
  | 'close'

export type WorkflowAction = {
  id: WorkflowActionId
  label: string
  to: WorkflowStage
  description: string
  tone: 'primary' | 'danger' | 'neutral'
  /** The action can record free-text decision notes. */
  commentRequired?: boolean
  /** The action carries a department work order (assignee, due date, instruction). */
  requiresWorkOrder?: boolean
  /** The action carries completion evidence. */
  requiresEvidence?: boolean
}

const ACTIONS: Record<WorkflowStage, WorkflowAction[]> = {
  reported: [
    {
      id: 'verify',
      label: 'Verify report',
      to: 'verified',
      description: 'Confirm the defect belongs to this department and is valid.',
      tone: 'primary',
    },
    {
      id: 'reject',
      label: 'Reject report',
      to: 'rejected',
      description: 'Close the report as invalid or duplicate. A reason is required.',
      tone: 'danger',
      commentRequired: true,
    },
  ],
  verified: [
    {
      id: 'assess',
      label: 'Evaluate sensor evidence',
      to: 'assessed',
      description: 'Record the REGEN maintenance recommendation.',
      tone: 'primary',
      commentRequired: true,
    },
  ],
  assessed: [
    {
      id: 'submit-authorisation',
      label: 'Submit for authorisation',
      to: 'awaiting-authorisation',
      description: 'Send the recommendation to the Head of Operations.',
      tone: 'primary',
    },
  ],
  'awaiting-authorisation': [
    {
      id: 'authorise',
      label: 'Authorise work',
      to: 'authorised',
      description: 'Approve the work order for execution.',
      tone: 'primary',
    },
    {
      id: 'return',
      label: 'Return for assessment',
      to: 'assessed',
      description: 'Send the recommendation back to REGEN technical. A reason is required.',
      tone: 'danger',
      commentRequired: true,
    },
  ],
  authorised: [
    {
      id: 'start',
      label: 'Issue work order & start',
      to: 'in-progress',
      description: 'Assign the maintenance team, set the deadline and start the work.',
      tone: 'primary',
      requiresWorkOrder: true,
    },
  ],
  'in-progress': [
    {
      id: 'complete',
      label: 'Submit completion evidence',
      to: 'completed',
      description: 'Record what was done, materials used and photographic evidence.',
      tone: 'primary',
      requiresEvidence: true,
      commentRequired: true,
    },
  ],
  completed: [
    {
      id: 'close',
      label: 'Verify outcome & close',
      to: 'closed',
      description: 'Confirm the maintenance outcome against the sensor record.',
      tone: 'primary',
    },
  ],
  closed: [],
  rejected: [],
}

/** Actions available to a specific employee for a specific report. */
export function availableActions(report: MaintenanceReport, user: Employee): WorkflowAction[] {
  return ACTIONS[report.stage].filter((action) => {
    switch (action.id) {
      case 'verify':
      case 'reject':
        return can.verifyReport(user, report.departmentSlug)
      case 'assess':
      case 'submit-authorisation':
        return can.assessReport(user)
      case 'authorise':
      case 'return':
        return can.authoriseWork(user)
      case 'start':
        return can.executeWork(user)
      case 'complete':
        return can.executeWork(user)
      case 'close':
        return can.closeReport(user)
      default:
        return false
    }
  })
}

export const STAGE_LABEL: Record<WorkflowStage, string> = {
  reported: 'Reported',
  verified: 'Department verified',
  assessed: 'REGEN assessed',
  'awaiting-authorisation': 'Awaiting authorisation',
  authorised: 'Authorised',
  'in-progress': 'In progress',
  completed: 'Completed · awaiting verification',
  closed: 'Closed',
  rejected: 'Rejected',
}

export const STAGE_ORDER: WorkflowStage[] = [
  'reported',
  'verified',
  'assessed',
  'awaiting-authorisation',
  'authorised',
  'in-progress',
  'completed',
  'closed',
]

export const STAGE_OWNER: Record<WorkflowStage, string> = {
  reported: 'Field worker',
  verified: 'Department',
  assessed: 'REGEN technical',
  'awaiting-authorisation': 'Head of Operations',
  authorised: 'Department',
  'in-progress': 'Maintenance team',
  completed: 'REGEN technical',
  closed: 'Record complete',
  rejected: 'Closed by department',
}
