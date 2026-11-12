import type {
  Alert,
  ApprovalEntry,
  AuditEntry,
  CallRecord,
  Channel,
  ConditionAssessment,
  Department,
  Employee,
  EnvironmentalReading,
  MaintenanceReport,
  Message,
  NetworkNode,
  Notification,
  Segment,
  SensorDevice,
  TelemetryReading,
  TrainMovement,
  TrainRun,
} from './types'

/**
 * The bundled demonstration dataset.
 *
 * It is used verbatim by the offline store and is mirrored, row for row, by
 * `supabase/03_seed.sql` — regenerate that file with `npm run seed:sql`
 * after changing anything here. Timestamps are fixed rather than relative so
 * that server and client renders always agree (no hydration drift).
 */

const DATASET_NOW = new Date('2026-11-10T07:20:00.000Z') // 09:20 SAST

const ago = (minutes: number) => new Date(DATASET_NOW.getTime() - minutes * 60_000).toISOString()
const daysAgo = (days: number, hour = 8) => {
  const date = new Date(DATASET_NOW)
  date.setUTCDate(date.getUTCDate() - days)
  date.setUTCHours(hour, 0, 0, 0)
  return date.toISOString()
}

/* ────────────────────────────── People ─────────────────────────────── */

export const employees: Employee[] = [
  {
    id: 'emp-0001',
    fullName: 'Nicol van Wyk',
    employeeRef: 'PRASA-OPS-0001',
    role: 'operations-head',
    departmentSlug: 'train-operations',
    region: 'Gauteng North',
    email: 'nicol.vanwyk@prasa.example',
    phone: '+27 11 774 5100',
    isOnline: true,
    lastSeen: ago(1),
    passwordSalt: '336ca27cd3246007c67fc4e8f9743677',
    passwordHash:
      'c34f62c7be4557caa2b3e73e4ac92d3e07d82ed0db1d9c79bab3d8bd7c237426b117f12b16e4a62dbfd6633fde2cf1cdfb1186805fb7f477bc01572d4e135b7a',
  },
  {
    id: 'emp-0002',
    fullName: 'Thandiwe Mokoena',
    employeeRef: 'PRASA-OPS-0107',
    role: 'operations-controller',
    departmentSlug: 'train-control',
    region: 'Gauteng North',
    email: 'thandiwe.mokoena@prasa.example',
    phone: '+27 11 774 5117',
    isOnline: true,
    lastSeen: ago(0),
    passwordSalt: '1f0836fe8b8b9421e092b2b11f51e6cd',
    passwordHash:
      '37494a2eb9a39d4bd552d946b40bb4febea0bbf5e875bec0a736dcfe3168566c4a80a52a94b8006c17557b1990996d3f2da622440da5f5c30a7ce2009c1b8e72',
  },
  {
    id: 'emp-0003',
    fullName: 'Sipho Dlamini',
    employeeRef: 'PRASA-INF-2418',
    role: 'department-manager',
    departmentSlug: 'permanent-way',
    region: 'Gauteng North',
    email: 'sipho.dlamini@prasa.example',
    phone: '+27 11 774 5240',
    isOnline: true,
    lastSeen: ago(4),
    passwordSalt: 'fab324a09aa90b341f56c50ca607832a',
    passwordHash:
      'fb57ed66488b97ad53afdfeb53dce6345f33f80397598ccc8cc757fe580bfc12731958c707c1e2fcbcdb75c243c9edc373b5e9d54b3f1eec3fe2553786fadb66',
  },
  {
    id: 'emp-0004',
    fullName: 'Anele Ngcobo',
    employeeRef: 'PRASA-INF-3376',
    role: 'engineer',
    departmentSlug: 'track',
    region: 'Gauteng North',
    email: 'anele.ngcobo@prasa.example',
    phone: '+27 11 774 5312',
    isOnline: true,
    lastSeen: ago(2),
    passwordSalt: '82affabc0616b9e772fdba1b61a0d43e',
    passwordHash:
      '9872cbd6d7129117a426defc55abe2c25012080c5d90d81ac423da2aeac992799de27527865d962c1ecc65465d5dfd6ce4544c3a1959a5acaceb5954768fcc5b',
  },
  {
    id: 'emp-0005',
    fullName: 'Lindiwe Khumalo',
    employeeRef: 'REGEN-TEC-0042',
    role: 'regen-technical',
    departmentSlug: 'signalling',
    region: 'Gauteng',
    email: 'lindiwe.khumalo@regen.example',
    phone: '+27 10 003 0042',
    isOnline: true,
    lastSeen: ago(0),
    passwordSalt: 'dff0a7de4cd0964d7f88ed59a48f6392',
    passwordHash:
      '09e7b2a03861143b7160c0836fd2f2d054af388e5ecb2529f5abddd979fdcfe23ad52e86743ff7037984367de28b919d359222f8a0bf133c956b97992886e775',
  },
  {
    id: 'emp-0006',
    fullName: 'Pieter Botha',
    employeeRef: 'PRASA-FLD-5120',
    role: 'field-worker',
    departmentSlug: 'permanent-way',
    region: 'Kempton Park',
    email: 'pieter.botha@prasa.example',
    phone: '+27 82 550 5120',
    isOnline: true,
    lastSeen: ago(6),
    passwordSalt: '93f55c6b53668fb6cb4e416c7441511d',
    passwordHash:
      '00334a1d1d649a3cce62347b89de509f72698cc45884e978a005a49086baa3807f1b187ee8a4ea724c767d2c6b2287dc5d33d4426cd6ac06cef17ab05f7b0207',
  },
  {
    id: 'emp-0007',
    fullName: 'Naledi Mahlangu',
    employeeRef: 'PRASA-ADM-6001',
    role: 'administrator',
    departmentSlug: null,
    region: 'Gauteng',
    email: 'naledi.mahlangu@prasa.example',
    phone: '+27 11 774 5001',
    isOnline: false,
    lastSeen: ago(190),
    passwordSalt: '35c2843c547cc829a273177be824a5f7',
    passwordHash:
      'bb7669e49b22d8672dc415b9dcceefb19b678cf71ae56023a8b0132134ed5cc76e26d322749ff89a6efbe9cc68e45112d209a984e2b1820dbb35d336e84f006d',
  },
  {
    id: 'emp-0008',
    fullName: 'Johan Steyn',
    employeeRef: 'PRASA-OPS-0142',
    role: 'operations-controller',
    departmentSlug: 'marshalling-yard',
    region: 'Gauteng North',
    email: 'johan.steyn@prasa.example',
    phone: '+27 11 774 5142',
    isOnline: false,
    lastSeen: ago(74),
    passwordSalt: '93f55c6b53668fb6cb4e416c7441511d',
    passwordHash:
      '00334a1d1d649a3cce62347b89de509f72698cc45884e978a005a49086baa3807f1b187ee8a4ea724c767d2c6b2287dc5d33d4426cd6ac06cef17ab05f7b0207',
  },
  {
    id: 'emp-0009',
    fullName: 'Zanele Ndlovu',
    employeeRef: 'PRASA-FLD-5211',
    role: 'field-worker',
    departmentSlug: 'ohte',
    region: 'Kempton Park',
    email: 'zanele.ndlovu@prasa.example',
    phone: '+27 83 441 5211',
    isOnline: true,
    lastSeen: ago(12),
    passwordSalt: 'fab324a09aa90b341f56c50ca607832a',
    passwordHash:
      'fb57ed66488b97ad53afdfeb53dce6345f33f80397598ccc8cc757fe580bfc12731958c707c1e2fcbcdb75c243c9edc373b5e9d54b3f1eec3fe2553786fadb66',
  },
  {
    id: 'emp-0010',
    fullName: 'Musa Radebe',
    employeeRef: 'PRASA-INF-3390',
    role: 'engineer',
    departmentSlug: 'signalling',
    region: 'Germiston',
    email: 'musa.radebe@prasa.example',
    phone: '+27 82 119 3390',
    isOnline: false,
    lastSeen: ago(320),
    passwordSalt: '82affabc0616b9e772fdba1b61a0d43e',
    passwordHash:
      '9872cbd6d7129117a426defc55abe2c25012080c5d90d81ac423da2aeac992799de27527865d962c1ecc65465d5dfd6ce4544c3a1959a5acaceb5954768fcc5b',
  },
]

/* ──────────────────────────── Departments ──────────────────────────── */

export const departments: Department[] = [
  {
    id: 'dep-fi',
    slug: 'fixed-infrastructure',
    name: 'Fixed Infrastructure',
    discipline: 'fixed-infrastructure',
    parentSlug: null,
    description:
      'Permanent assets that keep the network safe and energised: traction power, track, and train authorisation.',
    headcount: 214,
    status: 'warning',
    slaHours: 4,
    kpiLabel: 'Asset availability',
    kpiValue: '97.4%',
  },
  {
    id: 'dep-traction',
    slug: 'traction-power',
    name: 'Traction Power',
    discipline: 'fixed-infrastructure',
    parentSlug: 'fixed-infrastructure',
    description:
      'High-voltage traction supply, feeder protection and substation coordination for the Gauteng network.',
    headcount: 42,
    status: 'normal',
    slaHours: 3,
    kpiLabel: 'Feeder uptime',
    kpiValue: '99.1%',
  },
  {
    id: 'dep-substation',
    slug: 'substation',
    name: 'Substations',
    discipline: 'fixed-infrastructure',
    parentSlug: 'traction-power',
    description:
      'Traction and distribution substations, transformer health, earthing and protection relay testing.',
    headcount: 28,
    status: 'critical',
    slaHours: 2,
    kpiLabel: 'Transformers in alarm',
    kpiValue: '2',
  },
  {
    id: 'dep-ohte',
    slug: 'ohte',
    name: 'OHTE',
    discipline: 'fixed-infrastructure',
    parentSlug: 'traction-power',
    description:
      'Overhead traction equipment: catenary, contact wire, droppers, tensioning and pantograph interfaces.',
    headcount: 36,
    status: 'warning',
    slaHours: 3,
    kpiLabel: 'Catenary defects',
    kpiValue: '5',
  },
  {
    id: 'dep-track',
    slug: 'track',
    name: 'Track',
    discipline: 'fixed-infrastructure',
    parentSlug: 'fixed-infrastructure',
    description:
      'Permanent way asset owner: geometry, rail condition, turnouts and the Kempton Park sensor pilot.',
    headcount: 58,
    status: 'normal',
    slaHours: 4,
    kpiLabel: 'Track quality index',
    kpiValue: '84',
  },
  {
    id: 'dep-permanent-way',
    slug: 'permanent-way',
    name: 'Permanent Way',
    discipline: 'fixed-infrastructure',
    parentSlug: 'track',
    description:
      'Ballast, sleepers, fastenings, formation and drainage. Field teams execute the maintenance work orders.',
    headcount: 61,
    status: 'normal',
    slaHours: 6,
    kpiLabel: 'Open work orders',
    kpiValue: '9',
  },
  {
    id: 'dep-track-circuit',
    slug: 'track-circuit',
    name: 'Track Circuit',
    discipline: 'fixed-infrastructure',
    parentSlug: 'track',
    description:
      'Train detection circuits, axle counters, impedance bonds and false-occupation investigations.',
    headcount: 24,
    status: 'warning',
    slaHours: 3,
    kpiLabel: 'False occupations',
    kpiValue: '3',
  },
  {
    id: 'dep-signalling',
    slug: 'signalling',
    name: 'Signalling',
    discipline: 'fixed-infrastructure',
    parentSlug: 'track',
    description:
      'Interlocking, signals, points and the safe movement of trains through the Gauteng network.',
    headcount: 47,
    status: 'warning',
    slaHours: 2,
    kpiLabel: 'Signal failures',
    kpiValue: '4',
  },
  {
    id: 'dep-tas',
    slug: 'train-authorisation-system',
    name: 'Train Authorisation System',
    discipline: 'fixed-infrastructure',
    parentSlug: 'fixed-infrastructure',
    description:
      'Authority to occupy a section, possession management and protection arrangements for works.',
    headcount: 18,
    status: 'normal',
    slaHours: 2,
    kpiLabel: 'Possessions active',
    kpiValue: '6',
  },
  {
    id: 'dep-train-ops',
    slug: 'train-operations',
    name: 'Train Operations',
    discipline: 'train-operations',
    parentSlug: null,
    description:
      'Day-to-day running of the service: control, yards, traffic, crews and planning across the corridor.',
    headcount: 386,
    status: 'normal',
    slaHours: 1,
    kpiLabel: 'On-time performance',
    kpiValue: '91.2%',
  },
  {
    id: 'dep-train-control',
    slug: 'train-control',
    name: 'Train Control',
    discipline: 'train-operations',
    parentSlug: 'train-operations',
    description:
      'The Operational Centre desk that regulates train movements, incidents and recovery on the corridor.',
    headcount: 54,
    status: 'normal',
    slaHours: 1,
    kpiLabel: 'Trains in section',
    kpiValue: '12',
  },
  {
    id: 'dep-train-crew',
    slug: 'train-crew',
    name: 'Train Crew',
    discipline: 'train-operations',
    parentSlug: 'train-control',
    description:
      'Drivers, assistants and guards. Crew bookings, route knowledge and fitness-to-work records.',
    headcount: 168,
    status: 'normal',
    slaHours: 1,
    kpiLabel: 'Crews available',
    kpiValue: '38',
  },
  {
    id: 'dep-marshalling',
    slug: 'marshalling-yard',
    name: 'Marshalling Yard',
    discipline: 'train-operations',
    parentSlug: 'train-operations',
    description:
      'Shunting, formation and stabling of sets at Kempton Park and Elandsfontein yards.',
    headcount: 46,
    status: 'normal',
    slaHours: 2,
    kpiLabel: 'Sets stabled',
    kpiValue: '17',
  },
  {
    id: 'dep-yard-mgmt',
    slug: 'yard-management',
    name: 'Yard Management',
    discipline: 'train-operations',
    parentSlug: 'marshalling-yard',
    description:
      'Yard capacity, siding allocation, shunting plans and safe access for maintenance teams.',
    headcount: 22,
    status: 'normal',
    slaHours: 2,
    kpiLabel: 'Siding occupancy',
    kpiValue: '68%',
  },
  {
    id: 'dep-train-traffic',
    slug: 'train-traffic',
    name: 'Train Traffic',
    discipline: 'train-operations',
    parentSlug: 'train-operations',
    description:
      'Timetable delivery, pathing and the daily running register for passenger services.',
    headcount: 31,
    status: 'warning',
    slaHours: 1,
    kpiLabel: 'Cancellations today',
    kpiValue: '3',
  },
  {
    id: 'dep-train-operators',
    slug: 'train-operators',
    name: 'Train Operators',
    discipline: 'train-operations',
    parentSlug: 'train-traffic',
    description:
      'Operator liaison, rolling stock availability and service recovery with the operating companies.',
    headcount: 19,
    status: 'normal',
    slaHours: 2,
    kpiLabel: 'Sets in service',
    kpiValue: '24',
  },
  {
    id: 'dep-planning',
    slug: 'planning-control',
    name: 'Planning & Control',
    discipline: 'train-operations',
    parentSlug: 'train-traffic',
    description:
      'Timetable planning, possession scheduling and performance analysis for the Gauteng corridor.',
    headcount: 46,
    status: 'normal',
    slaHours: 8,
    kpiLabel: 'Plan adherence',
    kpiValue: '96.8%',
  },
]

/* ───────────────────────────── Network ─────────────────────────────── */

export const nodes: NetworkNode[] = [
  { id: 'pretoria', name: 'Pretoria', x: 150, y: 74, kind: 'station' },
  { id: 'kaalfontein', name: 'Kaalfontein', x: 330, y: 74, kind: 'station' },
  { id: 'tembisa', name: 'Tembisa', x: 500, y: 74, kind: 'station' },
  { id: 'kempton-park', name: 'Kempton Park', x: 670, y: 74, kind: 'pilot' },
  { id: 'isando', name: 'Isando', x: 832, y: 74, kind: 'station' },
  { id: 'elandsfontein', name: 'Elandsfontein', x: 900, y: 214, kind: 'junction' },
  { id: 'germiston', name: 'Germiston', x: 760, y: 330, kind: 'junction' },
  { id: 'natalspruit', name: 'Natalspruit', x: 600, y: 330, kind: 'station' },
  { id: 'kwesine', name: 'Kwesine', x: 440, y: 330, kind: 'station' },
  { id: 'johannesburg', name: 'Johannesburg Park', x: 280, y: 330, kind: 'station' },
  { id: 'rissik', name: 'Rissik', x: 140, y: 330, kind: 'station' },
  { id: 'pretoria-west', name: 'Pretoria West', x: 78, y: 196, kind: 'depot' },
]

export const segments: Segment[] = [
  {
    id: 'seg-kp01',
    trackId: 'KP-01',
    name: 'Kempton Park – Isando',
    corridor: 'Kempton Park ⇄ Johannesburg',
    direction: 'down',
    startKm: 0,
    endKm: 6.6,
    status: 'normal',
    conditionScore: 92,
    infrastructure: ['track', 'permanent-way', 'track-circuit', 'signalling', 'ohte', 'traction-power'],
    departmentSlugs: ['track', 'permanent-way', 'signalling'],
    fromNode: 'kempton-park',
    toNode: 'isando',
    siteCode: 'KP-IS',
  },
  {
    id: 'seg-is02',
    trackId: 'IS-02',
    name: 'Isando – Elandsfontein',
    corridor: 'Kempton Park ⇄ Johannesburg',
    direction: 'down',
    startKm: 6.6,
    endKm: 13.8,
    status: 'warning',
    conditionScore: 74,
    infrastructure: ['track', 'track-circuit', 'ohte', 'substation'],
    departmentSlugs: ['track', 'ohte', 'substation'],
    fromNode: 'isando',
    toNode: 'elandsfontein',
    siteCode: 'IS-EL',
  },
  {
    id: 'seg-el03',
    trackId: 'EL-03',
    name: 'Elandsfontein – Germiston',
    corridor: 'Kempton Park ⇄ Johannesburg',
    direction: 'down',
    startKm: 13.8,
    endKm: 20.3,
    status: 'normal',
    conditionScore: 88,
    infrastructure: ['track', 'permanent-way', 'signalling', 'train-authorisation-system'],
    departmentSlugs: ['track', 'signalling'],
    fromNode: 'elandsfontein',
    toNode: 'germiston',
    siteCode: 'EL-GM',
  },
  {
    id: 'seg-gm04',
    trackId: 'GM-04',
    name: 'Germiston – Natalspruit',
    corridor: 'Germiston ⇄ Kwesine',
    direction: 'down',
    startKm: 0,
    endKm: 7.8,
    status: 'critical',
    conditionScore: 61,
    infrastructure: ['track', 'permanent-way', 'track-circuit', 'signalling', 'traction-power'],
    departmentSlugs: ['signalling', 'track-circuit', 'permanent-way'],
    fromNode: 'germiston',
    toNode: 'natalspruit',
    siteCode: 'GM-NS',
  },
  {
    id: 'seg-ns05',
    trackId: 'NS-05',
    name: 'Natalspruit – Kwesine',
    corridor: 'Germiston ⇄ Kwesine',
    direction: 'down',
    startKm: 7.8,
    endKm: 15.5,
    status: 'normal',
    conditionScore: 90,
    infrastructure: ['track', 'track-circuit'],
    departmentSlugs: ['track', 'track-circuit'],
    fromNode: 'natalspruit',
    toNode: 'kwesine',
    siteCode: 'NS-KW',
  },
  {
    id: 'seg-kw06',
    trackId: 'KW-06',
    name: 'Kwesine – Johannesburg Park',
    corridor: 'Germiston ⇄ Kwesine',
    direction: 'up',
    startKm: 15.5,
    endKm: 24.7,
    status: 'warning',
    conditionScore: 79,
    infrastructure: ['track', 'permanent-way', 'ohte', 'substation'],
    departmentSlugs: ['track', 'permanent-way', 'ohte'],
    fromNode: 'kwesine',
    toNode: 'johannesburg',
    siteCode: 'KW-JB',
  },
  {
    id: 'seg-jb07',
    trackId: 'JB-07',
    name: 'Johannesburg Park – Rissik',
    corridor: 'Germiston ⇄ Kwesine',
    direction: 'up',
    startKm: 24.7,
    endKm: 29.9,
    status: 'normal',
    conditionScore: 86,
    infrastructure: ['track', 'signalling', 'track-circuit', 'traction-power'],
    departmentSlugs: ['track', 'signalling'],
    fromNode: 'johannesburg',
    toNode: 'rissik',
    siteCode: 'JB-RK',
  },
  {
    id: 'seg-tb08',
    trackId: 'TB-08',
    name: 'Kempton Park – Tembisa',
    corridor: 'Kempton Park ⇄ Pretoria',
    direction: 'up',
    startKm: 0,
    endKm: 6.4,
    status: 'normal',
    conditionScore: 94,
    infrastructure: ['track', 'ohte', 'substation', 'permanent-way'],
    departmentSlugs: ['track', 'ohte'],
    fromNode: 'kempton-park',
    toNode: 'tembisa',
    siteCode: 'KP-TB',
  },
  {
    id: 'seg-tf09',
    trackId: 'TF-09',
    name: 'Tembisa – Kaalfontein',
    corridor: 'Kempton Park ⇄ Pretoria',
    direction: 'up',
    startKm: 6.4,
    endKm: 13.2,
    status: 'normal',
    conditionScore: 91,
    infrastructure: ['track', 'track-circuit', 'signalling'],
    departmentSlugs: ['track', 'signalling'],
    fromNode: 'tembisa',
    toNode: 'kaalfontein',
    siteCode: 'TB-KF',
  },
  {
    id: 'seg-kl10',
    trackId: 'KL-10',
    name: 'Kaalfontein – Pretoria',
    corridor: 'Kempton Park ⇄ Pretoria',
    direction: 'up',
    startKm: 13.2,
    endKm: 22.6,
    status: 'warning',
    conditionScore: 76,
    infrastructure: ['track', 'permanent-way', 'ohte'],
    departmentSlugs: ['track', 'permanent-way'],
    fromNode: 'kaalfontein',
    toNode: 'pretoria',
    siteCode: 'KF-PR',
  },
  {
    id: 'seg-pr11',
    trackId: 'PR-11',
    name: 'Pretoria – Pretoria West',
    corridor: 'Pretoria West branch',
    direction: 'bi-directional',
    startKm: 0,
    endKm: 4.8,
    status: 'offline',
    conditionScore: 55,
    infrastructure: ['track', 'train-authorisation-system'],
    departmentSlugs: ['track', 'train-authorisation-system'],
    fromNode: 'pretoria',
    toNode: 'pretoria-west',
    siteCode: 'PR-PW',
  },
]

/* ───────────────────────────── Sensors ─────────────────────────────── */

const kp01Channels = [
  { name: 'REGEN_KP01_TELEMETRY', kind: 'telemetry' as const, status: 'streaming' as const, rateHz: 50 },
  { name: 'REGEN_KP01_SIGNAL_BUS', kind: 'signal' as const, status: 'streaming' as const, rateHz: 10 },
  { name: 'REGEN_KP01_EVENTS', kind: 'events' as const, status: 'streaming' as const, rateHz: 1 },
]

export const sensors: SensorDevice[] = [
  {
    id: 'sen-kp01',
    sensorId: 'REGEN-EDGE-KP01',
    segmentId: 'seg-kp01',
    status: 'online',
    lastTransmission: ago(0),
    signalQuality: 94,
    firmware: 'edge-2.4.1',
    installationPoint: 'Kempton Park · KM 0.4 · down line, outside rail',
    supportsVibration: true,
    supportsTemperature: true,
    supportsStrain: false,
    isSimulated: false,
    channels: kp01Channels,
  },
  {
    id: 'sen-kp02',
    sensorId: 'REGEN-EDGE-KP02',
    segmentId: 'seg-is02',
    status: 'degraded',
    lastTransmission: ago(11),
    signalQuality: 61,
    firmware: 'edge-2.3.9',
    installationPoint: 'Isando · KM 9.1 · up line',
    supportsVibration: true,
    supportsTemperature: true,
    supportsStrain: false,
    isSimulated: true,
    channels: [
      { name: 'REGEN_KP02_TELEMETRY', kind: 'telemetry', status: 'degraded', rateHz: 20 },
      { name: 'REGEN_KP02_EVENTS', kind: 'events', status: 'streaming', rateHz: 1 },
    ],
  },
  {
    id: 'sen-gm03',
    sensorId: 'REGEN-EDGE-GM03',
    segmentId: 'seg-gm04',
    status: 'online',
    lastTransmission: ago(2),
    signalQuality: 88,
    firmware: 'edge-2.4.0',
    installationPoint: 'Germiston · KM 3.2 · down line, inside rail',
    supportsVibration: true,
    supportsTemperature: true,
    supportsStrain: true,
    isSimulated: true,
    channels: [
      { name: 'REGEN_GM03_TELEMETRY', kind: 'telemetry', status: 'streaming', rateHz: 50 },
      { name: 'REGEN_GM03_EVENTS', kind: 'events', status: 'streaming', rateHz: 1 },
    ],
  },
]

/* ──────────────────────────── Telemetry ────────────────────────────── */

function rng(seed: number) {
  let value = seed
  return () => {
    value = (value * 1664525 + 1013904223) % 4294967296
    return value / 4294967296
  }
}

function buildTelemetry(): TelemetryReading[] {
  const random = rng(20261110)
  const rows: TelemetryReading[] = []
  const specs = [
    { sensorId: 'REGEN-EDGE-KP01', segmentIndex: 'sen-kp01', count: 42, simulated: false, base: 4.2 },
    { sensorId: 'REGEN-EDGE-KP02', segmentIndex: 'sen-kp02', count: 20, simulated: true, base: 6.1 },
    { sensorId: 'REGEN-EDGE-GM03', segmentIndex: 'sen-gm03', count: 24, simulated: true, base: 5.4 },
  ]
  for (const spec of specs) {
    for (let i = 0; i < spec.count; i += 1) {
      // Elevated vibration between readings 12 and 18 models a developing defect.
      const swell = spec.simulated ? Math.sin(i / 3) * 1.4 : Math.sin(i / 4.2) * 0.9
      const spike = i % 7 === 0 ? 2.6 : 0
      const vibration = Number((spec.base + swell + random() * 1.1 + spike).toFixed(2))
      rows.push({
        id: `tel-${spec.sensorId}-${i}`,
        readingId: `RD-${spec.sensorId.slice(-4)}-${String(4200 - i).padStart(4, '0')}`,
        sensorId: spec.sensorId,
        capturedAt: ago(i * 10),
        vibrationVelocity: Math.max(0.4, vibration),
        temperature: Number((spec.simulated ? 28 + random() * 9 : 31 + random() * 6).toFixed(1)),
        structuralStrain: spec.simulated && spec.sensorId.endsWith('GM03') ? Number((18 + random() * 6).toFixed(1)) : null,
        isSimulated: spec.simulated,
        qualityPct: spec.sensorId.endsWith('KP02') ? 61 : 94 + Math.round(random() * 4),
      })
    }
  }
  return rows.sort((a, b) => (a.capturedAt < b.capturedAt ? 1 : -1))
}

export const telemetry: TelemetryReading[] = buildTelemetry()

/* ─────────────────────────── Train movements ───────────────────────── */

export const movements: TrainMovement[] = [
  { id: 'mov-01', movementId: 'TM-0024-118', segmentId: 'seg-kp01', sensorId: 'REGEN-EDGE-KP01', detectedAt: ago(6), direction: 'down', source: 'REGEN-EDGE-KP01 · events channel', sourceKind: 'sensor', trainReference: null, peakVibration: 5.8, durationSeconds: 42, reviewStatus: 'normal', isSimulated: false },
  { id: 'mov-02', movementId: 'TM-0024-117', segmentId: 'seg-kp01', sensorId: 'REGEN-EDGE-KP01', detectedAt: ago(24), direction: 'up', source: 'REGEN-EDGE-KP01 · events channel', sourceKind: 'sensor', trainReference: null, peakVibration: 6.9, durationSeconds: 44, reviewStatus: 'normal', isSimulated: false },
  { id: 'mov-03', movementId: 'TM-0024-116', segmentId: 'seg-kp01', sensorId: 'REGEN-EDGE-KP01', detectedAt: ago(51), direction: 'down', source: 'REGEN-EDGE-KP01 · events channel', sourceKind: 'sensor', trainReference: null, peakVibration: 12.4, durationSeconds: 47, reviewStatus: 'review', isSimulated: false },
  { id: 'mov-04', movementId: 'TM-0024-115', segmentId: 'seg-tb08', sensorId: null, detectedAt: ago(63), direction: 'up', source: 'Train Control · manual report', sourceKind: 'train-control', trainReference: 'PRASA 5M2A · 0821', peakVibration: null, durationSeconds: null, reviewStatus: 'normal', isSimulated: false },
  { id: 'mov-05', movementId: 'TM-0024-114', segmentId: 'seg-kp01', sensorId: 'REGEN-EDGE-KP01', detectedAt: ago(78), direction: 'up', source: 'REGEN-EDGE-KP01 · events channel', sourceKind: 'sensor', trainReference: null, peakVibration: 5.1, durationSeconds: 41, reviewStatus: 'normal', isSimulated: false },
  { id: 'mov-06', movementId: 'TM-0024-113', segmentId: 'seg-gm04', sensorId: 'REGEN-EDGE-GM03', detectedAt: ago(96), direction: 'down', source: 'REGEN-EDGE-GM03 · events channel', sourceKind: 'sensor', trainReference: null, peakVibration: 14.8, durationSeconds: 55, reviewStatus: 'critical', isSimulated: true },
  { id: 'mov-07', movementId: 'TM-0024-112', segmentId: 'seg-is02', sensorId: 'REGEN-EDGE-KP02', detectedAt: ago(104), direction: 'down', source: 'REGEN-EDGE-KP02 · events channel', sourceKind: 'sensor', trainReference: null, peakVibration: 9.2, durationSeconds: 39, reviewStatus: 'review', isSimulated: true },
  { id: 'mov-08', movementId: 'TM-0024-111', segmentId: 'seg-ns05', sensorId: null, detectedAt: ago(121), direction: 'down', source: 'Track circuit · NS-05 section', sourceKind: 'train-control', trainReference: 'PRASA 10M5 · 1148', peakVibration: null, durationSeconds: null, reviewStatus: 'normal', isSimulated: false },
  { id: 'mov-09', movementId: 'TM-0024-110', segmentId: 'seg-kp01', sensorId: 'REGEN-EDGE-KP01', detectedAt: ago(133), direction: 'down', source: 'REGEN-EDGE-KP01 · events channel', sourceKind: 'sensor', trainReference: null, peakVibration: 5.4, durationSeconds: 43, reviewStatus: 'normal', isSimulated: false },
  { id: 'mov-10', movementId: 'TM-0024-109', segmentId: 'seg-kw06', sensorId: null, detectedAt: ago(152), direction: 'up', source: 'Train Control · manual report', sourceKind: 'train-control', trainReference: 'PRASA 8M4 · 0932', peakVibration: null, durationSeconds: null, reviewStatus: 'normal', isSimulated: false },
  { id: 'mov-11', movementId: 'TM-0024-108', segmentId: 'seg-kp01', sensorId: 'REGEN-EDGE-KP01', detectedAt: ago(168), direction: 'up', source: 'REGEN-EDGE-KP01 · events channel', sourceKind: 'sensor', trainReference: null, peakVibration: 4.9, durationSeconds: 40, reviewStatus: 'normal', isSimulated: false },
  { id: 'mov-12', movementId: 'TM-0024-107', segmentId: 'seg-gm04', sensorId: 'REGEN-EDGE-GM03', detectedAt: ago(181), direction: 'down', source: 'REGEN-EDGE-GM03 · events channel', sourceKind: 'sensor', trainReference: null, peakVibration: 13.1, durationSeconds: 52, reviewStatus: 'critical', isSimulated: true },
  { id: 'mov-13', movementId: 'TM-0024-106', segmentId: 'seg-tf09', sensorId: null, detectedAt: ago(206), direction: 'up', source: 'Track circuit · TF-09 section', sourceKind: 'train-control', trainReference: 'PRASA 5M2A · 0810', peakVibration: null, durationSeconds: null, reviewStatus: 'normal', isSimulated: false },
  { id: 'mov-14', movementId: 'TM-0024-105', segmentId: 'seg-kp01', sensorId: 'REGEN-EDGE-KP01', detectedAt: ago(228), direction: 'down', source: 'REGEN-EDGE-KP01 · events channel', sourceKind: 'sensor', trainReference: null, peakVibration: 5.6, durationSeconds: 42, reviewStatus: 'normal', isSimulated: false },
  { id: 'mov-15', movementId: 'TM-0024-104', segmentId: 'seg-el03', sensorId: null, detectedAt: ago(246), direction: 'down', source: 'Train Control · manual report', sourceKind: 'train-control', trainReference: 'PRASA 6M3 · 0745', peakVibration: null, durationSeconds: null, reviewStatus: 'normal', isSimulated: false },
  { id: 'mov-16', movementId: 'TM-0024-103', segmentId: 'seg-is02', sensorId: 'REGEN-EDGE-KP02', detectedAt: ago(272), direction: 'down', source: 'REGEN-EDGE-KP02 · events channel', sourceKind: 'sensor', trainReference: null, peakVibration: 8.4, durationSeconds: 38, reviewStatus: 'review', isSimulated: true },
  { id: 'mov-17', movementId: 'TM-0024-102', segmentId: 'seg-kp01', sensorId: 'REGEN-EDGE-KP01', detectedAt: ago(291), direction: 'up', source: 'REGEN-EDGE-KP01 · events channel', sourceKind: 'sensor', trainReference: null, peakVibration: 5.2, durationSeconds: 41, reviewStatus: 'normal', isSimulated: false },
  { id: 'mov-18', movementId: 'TM-0024-101', segmentId: 'seg-jb07', sensorId: null, detectedAt: ago(318), direction: 'up', source: 'Track circuit · JB-07 section', sourceKind: 'train-control', trainReference: 'PRASA 8M4 · 0702', peakVibration: null, durationSeconds: null, reviewStatus: 'normal', isSimulated: false },
  { id: 'mov-19', movementId: 'TM-0023-098', segmentId: 'seg-kl10', sensorId: null, detectedAt: ago(1420), direction: 'up', source: 'Train Control · manual report', sourceKind: 'train-control', trainReference: 'PRASA 5M2A · 1826', peakVibration: null, durationSeconds: null, reviewStatus: 'normal', isSimulated: false },
  { id: 'mov-20', movementId: 'TM-0023-097', segmentId: 'seg-gm04', sensorId: 'REGEN-EDGE-GM03', detectedAt: ago(1505), direction: 'down', source: 'REGEN-EDGE-GM03 · events channel', sourceKind: 'sensor', trainReference: null, peakVibration: 12.9, durationSeconds: 51, reviewStatus: 'review', isSimulated: true },
  { id: 'mov-21', movementId: 'TM-0023-096', segmentId: 'seg-kp01', sensorId: 'REGEN-EDGE-KP01', detectedAt: ago(1580), direction: 'down', source: 'REGEN-EDGE-KP01 · events channel', sourceKind: 'sensor', trainReference: null, peakVibration: 6.1, durationSeconds: 45, reviewStatus: 'normal', isSimulated: false },
  { id: 'mov-22', movementId: 'TM-0023-092', segmentId: 'seg-ns05', sensorId: null, detectedAt: ago(2900), direction: 'down', source: 'Track circuit · NS-05 section', sourceKind: 'train-control', trainReference: 'PRASA 10M5 · 1604', peakVibration: null, durationSeconds: null, reviewStatus: 'normal', isSimulated: false },
]

/* ──────────────────────────── Assessments ──────────────────────────── */

export const assessments: ConditionAssessment[] = [
  { id: 'asm-01', segmentId: 'seg-kp01', condition: 'good', score: 92, basis: 'sensor-vibration', assessedAt: ago(120), notes: 'Stable vibration signature across 18 passages. No geometry flags.' },
  { id: 'asm-02', segmentId: 'seg-kp01', condition: 'good', score: 90, basis: 'visual-inspection', assessedAt: ago(2900), notes: 'Ballast profile and fastenings within tolerance.' },
  { id: 'asm-03', segmentId: 'seg-is02', condition: 'fair', score: 74, basis: 'sensor-vibration', assessedAt: ago(180), notes: 'Rising vibration envelope on the down line near KM 9.1.' },
  { id: 'asm-04', segmentId: 'seg-gm04', condition: 'poor', score: 61, basis: 'sensor-vibration', assessedAt: ago(60), notes: 'Sustained high peak vibration with repeat crossings above 12 mm/s.' },
  { id: 'asm-05', segmentId: 'seg-gm04', condition: 'poor', score: 64, basis: 'visual-inspection', assessedAt: ago(1600), notes: 'Sleeper voiding observed between KM 3 and KM 4.' },
  { id: 'asm-06', segmentId: 'seg-kw06', condition: 'fair', score: 79, basis: 'geometry-car', assessedAt: ago(4300), notes: 'Alignment deviation on the up line approaching Johannesburg Park.' },
  { id: 'asm-07', segmentId: 'seg-kl10', condition: 'fair', score: 76, basis: 'geometry-car', assessedAt: ago(5200), notes: 'Cross-level irregularity trending over the last three runs.' },
  { id: 'asm-08', segmentId: 'seg-el03', condition: 'good', score: 88, basis: 'signalling-test', assessedAt: ago(2100), notes: 'Interlocking functional test passed.' },
  { id: 'asm-09', segmentId: 'seg-tb08', condition: 'good', score: 94, basis: 'sensor-vibration', assessedAt: ago(240), notes: 'Clean signatures on the Pretoria corridor.' },
  { id: 'asm-10', segmentId: 'seg-pr11', condition: 'failed', score: 55, basis: 'visual-inspection', assessedAt: ago(6400), notes: 'Branch under possession. Worn fastenings scheduled for replacement.' },
  { id: 'asm-11', segmentId: 'seg-tf09', condition: 'good', score: 91, basis: 'signalling-test', assessedAt: ago(1250), notes: 'Track circuit tuning within limits.' },
  { id: 'asm-12', segmentId: 'seg-ns05', condition: 'good', score: 90, basis: 'visual-inspection', assessedAt: ago(3300), notes: 'Formation dry, drainage clear.' },
]

/* ────────────────────────────── Alerts ─────────────────────────────── */

export const alerts: Alert[] = [
  { id: 'alt-01', reference: 'ALR-2026-0418', segmentId: 'seg-gm04', departmentSlug: 'signalling', title: 'Sustained high vibration at Germiston West', detail: 'REGEN-EDGE-GM03 recorded 14.8 mm/s peak across the last four passages — 2.3× the review threshold.', severity: 'critical', status: 'open', occurredAt: ago(96), source: 'REGEN-EDGE-GM03 · telemetry' },
  { id: 'alt-02', reference: 'ALR-2026-0417', segmentId: 'seg-kp01', departmentSlug: 'substation', title: 'Substation earth fault reported', detail: 'Kempton Park traction substation reported a transient earth fault on feeder B. Field verification pending.', severity: 'high', status: 'open', occurredAt: ago(140), source: 'Traction Power · SCADA' },
  { id: 'alt-03', reference: 'ALR-2026-0416', segmentId: 'seg-is02', departmentSlug: 'ohte', title: 'Catenary dropper arcing', detail: 'Driver report of arcing on the up line dropper at KM 9.4. OHTE patrol requested.', severity: 'high', status: 'acknowledged', occurredAt: ago(310), source: 'Train Crew · report' },
  { id: 'alt-04', reference: 'ALR-2026-0415', segmentId: 'seg-is02', departmentSlug: 'permanent-way', title: 'Sensor gateway degradation', detail: 'REGEN-EDGE-KP02 signal quality dropped to 61% and has missed two scheduled transmissions.', severity: 'medium', status: 'acknowledged', occurredAt: ago(360), source: 'REGEN gateway' },
  { id: 'alt-05', reference: 'ALR-2026-0414', segmentId: 'seg-pr11', departmentSlug: 'train-authorisation-system', title: 'Branch possession active', detail: 'Pretoria West branch under planned possession until 16:00. No unauthorised movements permitted.', severity: 'low', status: 'open', occurredAt: ago(520), source: 'Train Authorisation System' },
  { id: 'alt-06', reference: 'ALR-2026-0413', segmentId: 'seg-kw06', departmentSlug: 'track-circuit', title: 'False occupation cleared', detail: 'KW-06 track circuit false occupation investigated and cleared by the signalling team.', severity: 'medium', status: 'resolved', occurredAt: ago(880), source: 'Signalling · interlocking log' },
]

/* ──────────────────────────── Maintenance ──────────────────────────── */

export const reports: MaintenanceReport[] = [
  {
    id: 'rep-0142',
    reference: 'MR-2026-0142',
    title: 'Traction substation earth fault — Kempton Park',
    description:
      'Protection relay tripped on feeder B at Kempton Park traction substation. Insulation resistance on the outgoing feeder measured 2.1 MΩ against the 5 MΩ minimum. Field team reports scorching at the cable termination.',
    segmentId: 'seg-kp01',
    departmentSlug: 'substation',
    severity: 'high',
    stage: 'awaiting-authorisation',
    reportedBy: 'emp-0006',
    reportedAt: ago(880),
    photos: ['termination-scorch.jpg', 'relay-panel.jpg'],
    dueAt: ago(-1440),
    assignedTo: null,
    instructions: null,
    recommendedAction: 'Replace the feeder B cable termination and re-test insulation before re-energising.',
    sensorEvidence:
      'REGEN-EDGE-KP01 shows an elevated vibration envelope consistent with a loaded feeder but no track-side anomaly. No structural strain channel available on this node.',
    evidenceNotes: null,
    completedAt: null,
    locationNote: 'Kempton Park traction substation · feeder B · bay 3',
  },
  {
    id: 'rep-0141',
    reference: 'MR-2026-0141',
    title: 'OHTE dropper arcing — Isando KM 9.4',
    description:
      'Crew reported visible arcing at the fourth dropper east of Isando on the up line. Contact wire height measured 5.02 m against a 5.20 m nominal, indicating loss of tension.',
    segmentId: 'seg-is02',
    departmentSlug: 'ohte',
    severity: 'high',
    stage: 'assessed',
    reportedBy: 'emp-0009',
    reportedAt: ago(1320),
    photos: ['dropper-arcing.jpg'],
    dueAt: ago(-720),
    assignedTo: null,
    instructions: null,
    recommendedAction: 'Replace dropper assembly and re-tension the affected span during the next night possession.',
    sensorEvidence:
      'REGEN-EDGE-KP02 recorded a 9.2 mm/s peak on the adjacent section. Footfall vibration is within the expected band for a loaded span.',
    evidenceNotes: null,
    completedAt: null,
    locationNote: 'Isando · KM 9.4 · up line · span 118',
  },
  {
    id: 'rep-0139',
    reference: 'MR-2026-0139',
    title: 'Track geometry deviation — Isando down line',
    description:
      'Geometry car flagged a 12 mm cross-level deviation over a 20 m chord between KM 8.4 and KM 8.6. Tamping required before the deviation propagates.',
    segmentId: 'seg-is02',
    departmentSlug: 'permanent-way',
    severity: 'medium',
    stage: 'in-progress',
    reportedBy: 'emp-0003',
    reportedAt: ago(4100),
    photos: ['geometry-trace.jpg', 'site-marking.jpg'],
    dueAt: ago(-2880),
    assignedTo: 'emp-0004',
    instructions:
      'Attend with the tamping team during the 22:00–04:00 possession. Confirm cross-level within 4 mm and record a post-work geometry run.',
    recommendedAction: 'Tamp the affected 40 m and re-measure.',
    sensorEvidence:
      'Vibration signature on KP-02 shows a repeatable impact at the same chainage on every down-line passage.',
    evidenceNotes: null,
    completedAt: null,
    locationNote: 'Isando · KM 8.4–8.6 · down line',
  },
  {
    id: 'rep-0136',
    reference: 'MR-2026-0136',
    title: 'Signalling cable theft — Germiston North',
    description:
      'Approximately 40 m of signalling multicore cable removed between two location cases. Signals 14 and 16 are showing blank aspect. Protection arrangements requested.',
    segmentId: 'seg-gm04',
    departmentSlug: 'signalling',
    severity: 'critical',
    stage: 'verified',
    reportedBy: 'emp-0010',
    reportedAt: ago(2100),
    photos: ['cable-trench.jpg'],
    dueAt: ago(-360),
    assignedTo: null,
    instructions: null,
    recommendedAction: null,
    sensorEvidence: null,
    evidenceNotes: null,
    completedAt: null,
    locationNote: 'Germiston North · location case 14 to 16',
  },
  {
    id: 'rep-0131',
    reference: 'MR-2026-0131',
    title: 'Rail seat abrasion — Kempton Park down line',
    description:
      'Visual inspection found rail seat abrasion on eleven consecutive sleepers at KM 0.4. Insulator pads degraded. Recommend pad replacement and fastener torque check.',
    segmentId: 'seg-kp01',
    departmentSlug: 'permanent-way',
    severity: 'medium',
    stage: 'completed',
    reportedBy: 'emp-0006',
    reportedAt: ago(7600),
    photos: ['rail-seat.jpg', 'pad-wear.jpg'],
    dueAt: ago(-7400),
    assignedTo: 'emp-0006',
    instructions:
      'Replace insulator pads on the eleven affected sleepers, torque fastenings to 220 Nm and photograph each completed seat.',
    recommendedAction: 'Replace pads and torque fastenings.',
    sensorEvidence:
      'KP01 vibration amplitude reduced by 0.8 mm/s after pad replacement, consistent with improved rail seat condition.',
    evidenceNotes:
      'Work completed during the 02:00 possession. Eleven pads replaced, fastenings torqued and logged. Photographs uploaded.',
    completedAt: ago(2400),
    locationNote: 'Kempton Park · KM 0.4 · down line',
  },
  {
    id: 'rep-0128',
    reference: 'MR-2026-0128',
    title: 'Track circuit false occupation — NS-05',
    description:
      'Section showed occupied with no train in the block on three separate occasions between 06:10 and 07:05.',
    segmentId: 'seg-ns05',
    departmentSlug: 'track-circuit',
    severity: 'medium',
    stage: 'closed',
    reportedBy: 'emp-0002',
    reportedAt: ago(9800),
    photos: [],
    dueAt: ago(-9600),
    assignedTo: 'emp-0010',
    instructions: 'Test impedance bond connections and adjust feed resistance. Record all readings.',
    recommendedAction: 'Adjust feed resistance and re-test.',
    sensorEvidence: 'No sensor coverage on NS-05 at the time of the report.',
    evidenceNotes: 'Feed resistance adjusted from 4.8 Ω to 5.6 Ω. Three consecutive test trains detected correctly.',
    completedAt: ago(9200),
    locationNote: 'Natalspruit · NS-05 track circuit · feed end',
  },
  {
    id: 'rep-0143',
    reference: 'MR-2026-0143',
    title: 'Ballast shoulder erosion — Kaalfontein',
    description:
      'Heavy rain has washed out the ballast shoulder over approximately 8 m on the up line. Sleeper ends are exposed and cribs are empty.',
    segmentId: 'seg-kl10',
    departmentSlug: 'permanent-way',
    severity: 'high',
    stage: 'reported',
    reportedBy: 'emp-0006',
    reportedAt: ago(150),
    photos: ['shoulder-erosion.jpg'],
    dueAt: null,
    assignedTo: null,
    instructions: null,
    recommendedAction: null,
    sensorEvidence: null,
    evidenceNotes: null,
    completedAt: null,
    locationNote: 'Kaalfontein · KM 16.9 · up line',
  },
  {
    id: 'rep-0144',
    reference: 'MR-2026-0144',
    title: 'Signal lamp failure — Rissik home signal',
    description:
      'Home signal R12 showing dark aspect. Lamp unit replacement required; no train delay reported at the time of logging.',
    segmentId: 'seg-jb07',
    departmentSlug: 'signalling',
    severity: 'low',
    stage: 'rejected',
    reportedBy: 'emp-0002',
    reportedAt: ago(3400),
    photos: [],
    dueAt: null,
    assignedTo: null,
    instructions: null,
    recommendedAction: null,
    sensorEvidence: null,
    evidenceNotes: 'Duplicate of MR-2026-0129 — closed by the signalling manager.',
    completedAt: null,
    locationNote: 'Rissik · home signal R12',
  },
]

export const approvals: ApprovalEntry[] = [
  { id: 'apr-01', reportId: 'rep-0142', stage: 'reported', actorId: 'emp-0006', actorRole: 'field-worker', decision: 'Report submitted', comment: 'Photographs of the termination and relay panel attached.', decidedAt: ago(880) },
  { id: 'apr-02', reportId: 'rep-0142', stage: 'verified', actorId: 'emp-0005', actorRole: 'regen-technical', decision: 'Department verified', comment: 'Insulation test values confirmed against the substation register.', decidedAt: ago(760) },
  { id: 'apr-03', reportId: 'rep-0142', stage: 'assessed', actorId: 'emp-0005', actorRole: 'regen-technical', decision: 'Sensor evidence evaluated', comment: 'Recommend termination replacement before the evening peak.', decidedAt: ago(640) },
  { id: 'apr-04', reportId: 'rep-0142', stage: 'awaiting-authorisation', actorId: 'emp-0005', actorRole: 'regen-technical', decision: 'Submitted for authorisation', comment: 'Awaiting Mr Nicol, Head of Operations.', decidedAt: ago(620) },
  { id: 'apr-05', reportId: 'rep-0141', stage: 'reported', actorId: 'emp-0009', actorRole: 'field-worker', decision: 'Report submitted', comment: 'Crew report and arcing photograph attached.', decidedAt: ago(1320) },
  { id: 'apr-06', reportId: 'rep-0141', stage: 'verified', actorId: 'emp-0003', actorRole: 'department-manager', decision: 'Verified by OHTE', comment: 'Span 118 dropper confirmed degraded.', decidedAt: ago(1180) },
  { id: 'apr-07', reportId: 'rep-0141', stage: 'assessed', actorId: 'emp-0005', actorRole: 'regen-technical', decision: 'Sensor evidence evaluated', comment: 'No track-side anomaly. Proceed with night possession.', decidedAt: ago(1050) },
  { id: 'apr-08', reportId: 'rep-0139', stage: 'reported', actorId: 'emp-0003', actorRole: 'department-manager', decision: 'Report submitted', comment: 'Raised from the geometry car run.', decidedAt: ago(4100) },
  { id: 'apr-09', reportId: 'rep-0139', stage: 'verified', actorId: 'emp-0003', actorRole: 'department-manager', decision: 'Verified', comment: 'Deviation reproduced on site.', decidedAt: ago(3900) },
  { id: 'apr-10', reportId: 'rep-0139', stage: 'assessed', actorId: 'emp-0005', actorRole: 'regen-technical', decision: 'Sensor evidence evaluated', comment: 'Repeatable impact signature supports tamping.', decidedAt: ago(3700) },
  { id: 'apr-11', reportId: 'rep-0139', stage: 'authorised', actorId: 'emp-0001', actorRole: 'operations-head', decision: 'Authorised', comment: 'Approved for the night possession. Keep the corridor open for the 18:00 peak.', decidedAt: ago(3400) },
  { id: 'apr-12', reportId: 'rep-0139', stage: 'in-progress', actorId: 'emp-0004', actorRole: 'engineer', decision: 'Work started', comment: 'Tamping team on site at 22:10.', decidedAt: ago(3100) },
  { id: 'apr-13', reportId: 'rep-0136', stage: 'reported', actorId: 'emp-0010', actorRole: 'engineer', decision: 'Report submitted', comment: 'Cable trench photographed. SAPS case opened.', decidedAt: ago(2100) },
  { id: 'apr-14', reportId: 'rep-0136', stage: 'verified', actorId: 'emp-0003', actorRole: 'department-manager', decision: 'Verified', comment: 'Escalated to critical. Protection requested.', decidedAt: ago(1980) },
  { id: 'apr-15', reportId: 'rep-0131', stage: 'reported', actorId: 'emp-0006', actorRole: 'field-worker', decision: 'Report submitted', comment: 'Photographs of all eleven sleepers attached.', decidedAt: ago(7600) },
  { id: 'apr-16', reportId: 'rep-0131', stage: 'verified', actorId: 'emp-0003', actorRole: 'department-manager', decision: 'Verified', comment: 'Pads ordered from the Kempton Park store.', decidedAt: ago(7400) },
  { id: 'apr-17', reportId: 'rep-0131', stage: 'assessed', actorId: 'emp-0005', actorRole: 'regen-technical', decision: 'Sensor evidence evaluated', comment: 'Vibration trend supports pad replacement.', decidedAt: ago(7000) },
  { id: 'apr-18', reportId: 'rep-0131', stage: 'authorised', actorId: 'emp-0001', actorRole: 'operations-head', decision: 'Authorised', comment: 'Approved.', decidedAt: ago(6800) },
  { id: 'apr-19', reportId: 'rep-0131', stage: 'in-progress', actorId: 'emp-0006', actorRole: 'field-worker', decision: 'Work started', comment: 'Possession taken at 02:00.', decidedAt: ago(2600) },
  { id: 'apr-20', reportId: 'rep-0131', stage: 'completed', actorId: 'emp-0006', actorRole: 'field-worker', decision: 'Work completed', comment: 'Eleven pads replaced and photographed.', decidedAt: ago(2400) },
  { id: 'apr-21', reportId: 'rep-0128', stage: 'closed', actorId: 'emp-0005', actorRole: 'regen-technical', decision: 'Outcome verified', comment: 'Three test trains detected correctly. Closed.', decidedAt: ago(9200) },
  { id: 'apr-22', reportId: 'rep-0143', stage: 'reported', actorId: 'emp-0006', actorRole: 'field-worker', decision: 'Report submitted', comment: 'Erosion photographed after the morning patrol.', decidedAt: ago(150) },
  { id: 'apr-23', reportId: 'rep-0144', stage: 'reported', actorId: 'emp-0002', actorRole: 'operations-controller', decision: 'Report submitted', comment: 'Signal lamp reported dark.', decidedAt: ago(3400) },
  { id: 'apr-24', reportId: 'rep-0144', stage: 'rejected', actorId: 'emp-0003', actorRole: 'department-manager', decision: 'Rejected', comment: 'Duplicate of MR-2026-0129.', decidedAt: ago(3300) },
]

/* ──────────────────────────── Communication ────────────────────────── */

export const channels: Channel[] = [
  {
    id: 'chn-01',
    slug: 'kempton-park-response',
    name: 'Kempton Park Response',
    kind: 'team',
    description: 'Kempton Park pilot sensor and maintenance response team',
    memberIds: ['emp-0001', 'emp-0003', 'emp-0004', 'emp-0005', 'emp-0006', 'emp-0009'],
  },
  {
    id: 'chn-02',
    slug: 'gauteng-operations',
    name: 'Gauteng Operational Centre',
    kind: 'operations',
    description: 'Operational Centre, controllers and department managers',
    memberIds: ['emp-0001', 'emp-0002', 'emp-0008', 'emp-0005', 'emp-0003'],
  },
  {
    id: 'chn-03',
    slug: 'track-engineering',
    name: 'Track Engineering',
    kind: 'department',
    description: 'Track, permanent way and signalling coordination',
    memberIds: ['emp-0003', 'emp-0004', 'emp-0006', 'emp-0009', 'emp-0010'],
  },
  {
    id: 'chn-04',
    slug: 'direct-nicol-lindiwe',
    name: 'Nicol van Wyk · Lindiwe Khumalo',
    kind: 'direct',
    description: 'Direct line between Operations and REGEN technical',
    memberIds: ['emp-0001', 'emp-0005'],
  },
]

export const messages: Message[] = [
  { id: 'msg-01', channelSlug: 'kempton-park-response', senderId: 'emp-0006', body: 'Morning patrol complete on KP-01. Ballast shoulder looks stable after last night’s rain.', sentAt: ago(210), kind: 'text', attachmentName: null, locationLabel: 'Kempton Park · KM 0.4', isSimulated: false },
  { id: 'msg-02', channelSlug: 'kempton-park-response', senderId: 'emp-0006', body: 'Patrol photographs attached for the register.', sentAt: ago(208), kind: 'image', attachmentName: 'kp01-patrol-0912.jpg', locationLabel: null, isSimulated: false },
  { id: 'msg-03', channelSlug: 'kempton-park-response', senderId: 'emp-0005', body: 'Thanks Pieter. KP01 is streaming cleanly — 94% signal quality, no dropped frames overnight.', sentAt: ago(196), kind: 'text', attachmentName: null, locationLabel: null, isSimulated: false },
  { id: 'msg-04', channelSlug: 'kempton-park-response', senderId: 'emp-0005', body: 'The 06:41 passage peaked at 12.4 mm/s. That is above our review threshold — I am raising it with track.', sentAt: ago(180), kind: 'text', attachmentName: null, locationLabel: null, isSimulated: false },
  { id: 'msg-05', channelSlug: 'kempton-park-response', senderId: 'emp-0004', body: 'Noted. I will walk that chainage after the 10:00 peak and check for a wet spot.', sentAt: ago(168), kind: 'text', attachmentName: null, locationLabel: null, isSimulated: false },
  { id: 'msg-06', channelSlug: 'kempton-park-response', senderId: 'emp-0003', body: 'MR-2026-0139 is authorised. Tamping team is booked for the 22:00 possession.', sentAt: ago(140), kind: 'text', attachmentName: null, locationLabel: null, isSimulated: false },
  { id: 'msg-07', channelSlug: 'gauteng-operations', senderId: 'emp-0002', body: 'Germiston–Natalspruit is still flagged critical. Signal 14 and 16 are dark, protection is on site.', sentAt: ago(150), kind: 'text', attachmentName: null, locationLabel: null, isSimulated: false },
  { id: 'msg-08', channelSlug: 'gauteng-operations', senderId: 'emp-0001', body: 'Keep the corridor open for the 18:00 peak. If the cable work needs longer, we do it after 21:00.', sentAt: ago(132), kind: 'text', attachmentName: null, locationLabel: null, isSimulated: false },
  { id: 'msg-09', channelSlug: 'gauteng-operations', senderId: 'emp-0005', body: 'MR-2026-0142 is with you for authorisation, Mr Nicol. Substation termination is the only open item.', sentAt: ago(96), kind: 'text', attachmentName: null, locationLabel: null, isSimulated: false },
  { id: 'msg-10', channelSlug: 'gauteng-operations', senderId: 'emp-0005', body: 'Feeder B relay panel and termination photographs.', sentAt: ago(94), kind: 'document', attachmentName: 'feeder-b-termination.pdf', locationLabel: null, isSimulated: false },
  { id: 'msg-11', channelSlug: 'gauteng-operations', senderId: 'emp-0001', body: 'Received. Reviewing now.', sentAt: ago(88), kind: 'text', attachmentName: null, locationLabel: null, isSimulated: false },
  { id: 'msg-12', channelSlug: 'track-engineering', senderId: 'emp-0010', body: 'Cable trench at Germiston North is 40 m short. Replacement drum arrives at 13:00.', sentAt: ago(240), kind: 'text', attachmentName: null, locationLabel: 'Germiston North · case 14', isSimulated: false },
  { id: 'msg-13', channelSlug: 'track-engineering', senderId: 'emp-0009', body: 'OHTE patrol scheduled for KM 9.4 tonight. Dropper kit is on the bakkie.', sentAt: ago(220), kind: 'text', attachmentName: null, locationLabel: null, isSimulated: false },
  { id: 'msg-14', channelSlug: 'track-engineering', senderId: 'emp-0006', body: 'Kaalfontein shoulder erosion is worse than yesterday. Logged as MR-2026-0143.', sentAt: ago(146), kind: 'text', attachmentName: null, locationLabel: 'Kaalfontein · KM 16.9', isSimulated: false },
  { id: 'msg-15', channelSlug: 'direct-nicol-lindiwe', senderId: 'emp-0005', body: 'Mr Nicol, one item needs your signature before 12:00 — MR-2026-0142.', sentAt: ago(92), kind: 'text', attachmentName: null, locationLabel: null, isSimulated: false },
  { id: 'msg-16', channelSlug: 'direct-nicol-lindiwe', senderId: 'emp-0001', body: 'On it. Approving the substation work now.', sentAt: ago(70), kind: 'text', attachmentName: null, locationLabel: null, isSimulated: false },
  { id: 'msg-17', channelSlug: 'kempton-park-response', senderId: 'emp-0005', body: 'System note: KP02 gateway degraded — two scheduled transmissions missed.', sentAt: ago(360), kind: 'system', attachmentName: null, locationLabel: null, isSimulated: true },
]

export const calls: CallRecord[] = [
  { id: 'cal-01', channelSlug: 'kempton-park-response', kind: 'video', startedAt: ago(300), durationSeconds: 742, participants: ['emp-0005', 'emp-0006', 'emp-0004'], status: 'completed' },
  { id: 'cal-02', channelSlug: 'direct-nicol-lindiwe', kind: 'audio', startedAt: ago(190), durationSeconds: 268, participants: ['emp-0001', 'emp-0005'], status: 'completed' },
  { id: 'cal-03', channelSlug: 'gauteng-operations', kind: 'audio', startedAt: ago(520), durationSeconds: 0, participants: ['emp-0002', 'emp-0001'], status: 'missed' },
  { id: 'cal-04', channelSlug: 'track-engineering', kind: 'video', startedAt: ago(1450), durationSeconds: 1310, participants: ['emp-0003', 'emp-0004', 'emp-0010'], status: 'completed' },
]

/* ───────────────────── Notifications, audit, environment ───────────── */

export const notifications: Notification[] = [
  { id: 'ntf-01', title: 'Authorisation required', body: 'MR-2026-0142 needs Head of Operations authorisation.', severity: 'high', createdAt: ago(96), readAt: null, href: '/portal/maintenance/MR-2026-0142' },
  { id: 'ntf-02', title: 'Critical vibration', body: 'REGEN-EDGE-GM03 exceeded the review threshold on four consecutive passages.', severity: 'critical', createdAt: ago(96), readAt: null, href: '/portal/network?section=GM-04' },
  { id: 'ntf-03', title: 'Sensor gateway degraded', body: 'REGEN-EDGE-KP02 signal quality at 61%.', severity: 'medium', createdAt: ago(360), readAt: ago(300), href: '/portal/kempton-park' },
  { id: 'ntf-04', title: 'Work completed', body: 'MR-2026-0131 evidence submitted for verification.', severity: 'low', createdAt: ago(2400), readAt: ago(2300), href: '/portal/maintenance/MR-2026-0131' },
  { id: 'ntf-05', title: 'New field report', body: 'MR-2026-0143 logged at Kaalfontein by Pieter Botha.', severity: 'high', createdAt: ago(150), readAt: null, href: '/portal/maintenance/MR-2026-0143' },
  { id: 'ntf-06', title: 'Possession active', body: 'Pretoria West branch possession in force until 16:00.', severity: 'low', createdAt: ago(520), readAt: ago(500), href: '/portal/network?section=PR-11' },
]

export const audit: AuditEntry[] = [
  { id: 'aud-01', actorId: 'emp-0006', action: 'Report created', entity: 'maintenance_report', entityId: 'MR-2026-0143', detail: 'Ballast shoulder erosion logged at Kaalfontein KM 16.9.', createdAt: ago(150) },
  { id: 'aud-02', actorId: 'emp-0001', action: 'Work authorised', entity: 'maintenance_report', entityId: 'MR-2026-0139', detail: 'Night possession approved for tamping.', createdAt: ago(3400) },
  { id: 'aud-03', actorId: 'emp-0005', action: 'Sensor evidence evaluated', entity: 'maintenance_report', entityId: 'MR-2026-0141', detail: 'Dropper assembly replacement recommended.', createdAt: ago(1050) },
  { id: 'aud-04', actorId: 'emp-0002', action: 'Session started', entity: 'session', entityId: 'PRASA-OPS-0107', detail: 'Operational Centre workstation.', createdAt: ago(190) },
  { id: 'aud-05', actorId: 'emp-0006', action: 'Work completed', entity: 'maintenance_report', entityId: 'MR-2026-0131', detail: 'Eleven insulator pads replaced, torqued to 220 Nm.', createdAt: ago(2400) },
  { id: 'aud-06', actorId: 'emp-0005', action: 'Sensor channel checked', entity: 'sensor_device', entityId: 'REGEN-EDGE-KP02', detail: 'Gateway degradation confirmed, site visit raised.', createdAt: ago(355) },
  { id: 'aud-07', actorId: 'emp-0010', action: 'Report created', entity: 'maintenance_report', entityId: 'MR-2026-0136', detail: 'Signalling cable theft logged at Germiston North.', createdAt: ago(2100) },
  { id: 'aud-08', actorId: 'emp-0001', action: 'Work authorised', entity: 'maintenance_report', entityId: 'MR-2026-0131', detail: 'Insulator pad replacement approved.', createdAt: ago(6800) },
]

export const environment: EnvironmentalReading[] = [
  { id: 'env-01', segmentId: 'seg-kp01', capturedAt: ago(30), ambientTempC: 24.2, trackTempC: 31.6, rainfallMm: 0, humidityPct: 58 },
  { id: 'env-02', segmentId: 'seg-kp01', capturedAt: ago(150), ambientTempC: 21.8, trackTempC: 26.4, rainfallMm: 0.4, humidityPct: 71 },
  { id: 'env-03', segmentId: 'seg-kp01', capturedAt: ago(300), ambientTempC: 19.1, trackTempC: 20.2, rainfallMm: 2.8, humidityPct: 84 },
  { id: 'env-04', segmentId: 'seg-is02', capturedAt: ago(60), ambientTempC: 23.9, trackTempC: 33.1, rainfallMm: 0, humidityPct: 55 },
  { id: 'env-05', segmentId: 'seg-gm04', capturedAt: ago(45), ambientTempC: 25.4, trackTempC: 35.8, rainfallMm: 0, humidityPct: 51 },
  { id: 'env-06', segmentId: 'seg-gm04', capturedAt: ago(240), ambientTempC: 22.0, trackTempC: 27.9, rainfallMm: 0.2, humidityPct: 66 },
  { id: 'env-07', segmentId: 'seg-kl10', capturedAt: ago(120), ambientTempC: 20.6, trackTempC: 24.8, rainfallMm: 4.1, humidityPct: 88 },
  { id: 'env-08', segmentId: 'seg-kl10', capturedAt: ago(420), ambientTempC: 18.4, trackTempC: 19.6, rainfallMm: 6.7, humidityPct: 92 },
  { id: 'env-09', segmentId: 'seg-tb08', capturedAt: ago(90), ambientTempC: 24.0, trackTempC: 30.4, rainfallMm: 0, humidityPct: 57 },
  { id: 'env-10', segmentId: 'seg-kw06', capturedAt: ago(75), ambientTempC: 24.8, trackTempC: 34.2, rainfallMm: 0, humidityPct: 54 },
  { id: 'env-11', segmentId: 'seg-jb07', capturedAt: ago(105), ambientTempC: 25.1, trackTempC: 34.9, rainfallMm: 0, humidityPct: 52 },
  { id: 'env-12', segmentId: 'seg-pr11', capturedAt: ago(600), ambientTempC: 19.9, trackTempC: 22.1, rainfallMm: 1.2, humidityPct: 79 },
]

/* ──────────────────────────── Live trains ──────────────────────────── */

export const trains: TrainRun[] = [
  { id: 'trn-01', label: 'PRASA 5M2A · 0821', segmentId: 'seg-kp01', direction: 'down', progress: 0.32, speedKph: 68, isSimulated: false },
  { id: 'trn-02', label: 'PRASA 10M5 · 1148', segmentId: 'seg-ns05', direction: 'down', progress: 0.61, speedKph: 74, isSimulated: false },
  { id: 'trn-03', label: 'PRASA 8M4 · 0932', segmentId: 'seg-kw06', direction: 'up', progress: 0.18, speedKph: 59, isSimulated: false },
  { id: 'trn-04', label: 'PRASA 6M3 · 0745', segmentId: 'seg-el03', direction: 'down', progress: 0.77, speedKph: 71, isSimulated: false },
  { id: 'trn-05', label: 'SHUNT 14 · Yard', segmentId: 'seg-tb08', direction: 'up', progress: 0.44, speedKph: 24, isSimulated: true },
]

export const demoNow = DATASET_NOW.toISOString()
export const daysAgoHelper = daysAgo
