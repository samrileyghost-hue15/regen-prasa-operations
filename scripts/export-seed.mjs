#!/usr/bin/env node
/**
 * Regenerates `supabase/03_seed.sql` from the bundled demonstration dataset
 * in `src/lib/seed.ts`, so the offline store and the Supabase database can
 * never drift apart.
 *
 *   node scripts/export-seed.mjs
 *
 * How it works
 *   1. `seed.ts` is transpiled with the installed TypeScript compiler and its
 *      type-only import from `./types` is dropped (types do not exist at
 *      runtime).
 *   2. The emitted module is imported and every exported collection is walked.
 *   3. Rows are written as literal INSERT statements in foreign-key-safe
 *      order, formatted by the column type declared below.
 */

import { readFile, writeFile, mkdir, rm } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import ts from 'typescript'

const root = path.resolve(import.meta.dirname, '..')
const seedSource = path.join(root, 'src', 'lib', 'seed.ts')
const tempDir = path.join(root, '.seed-tmp')
const tempModule = path.join(tempDir, 'seed.mjs')
const output = path.join(root, 'supabase', 'migrations', '0003_seed.sql')

/* ─────────────────────────── SQL literals ──────────────────────────── */

const quote = (value) => `'${String(value).replace(/'/g, "''")}'`

function literal(value, kind) {
  if (value === null || value === undefined) return 'null'
  switch (kind) {
    case 'text':
      return quote(value)
    case 'int':
      return String(Math.trunc(Number(value)))
    case 'numeric':
    case 'numeric3':
      return Number(value).toFixed(kind === 'numeric3' ? 3 : 2)
    case 'bool':
      return value ? 'true' : 'false'
    case 'timestamptz':
      return quote(value)
    case 'text[]':
      return value.length ? `array[${value.map(quote).join(', ')}]::text[]` : `'{}'::text[]`
    case 'jsonb':
      return `${quote(JSON.stringify(value))}::jsonb`
    default:
      throw new Error(`Unknown column kind: ${kind}`)
  }
}

/* ──────────────────────── Table & column mapping ───────────────────── */
/* [source field, database column, column kind] — must match 01_schema.sql. */

const TABLES = [
  {
    source: 'departments',
    table: 'departments',
    columns: [
      ['id', 'id', 'text'],
      ['slug', 'slug', 'text'],
      ['name', 'name', 'text'],
      ['discipline', 'discipline', 'text'],
      ['parentSlug', 'parent_slug', 'text'],
      ['description', 'description', 'text'],
      ['headcount', 'headcount', 'int'],
      ['status', 'status', 'text'],
      ['slaHours', 'sla_hours', 'int'],
      ['kpiLabel', 'kpi_label', 'text'],
      ['kpiValue', 'kpi_value', 'text'],
    ],
  },
  {
    source: 'employees',
    table: 'employees',
    columns: [
      ['id', 'id', 'text'],
      ['fullName', 'full_name', 'text'],
      ['employeeRef', 'employee_ref', 'text'],
      ['role', 'role', 'text'],
      ['departmentSlug', 'department_slug', 'text'],
      ['region', 'region', 'text'],
      ['email', 'email', 'text'],
      ['phone', 'phone', 'text'],
      ['isOnline', 'is_online', 'bool'],
      ['lastSeen', 'last_seen', 'timestamptz'],
      ['passwordSalt', 'password_salt', 'text'],
      ['passwordHash', 'password_hash', 'text'],
    ],
  },
  {
    source: 'nodes',
    table: 'rail_nodes',
    columns: [
      ['id', 'id', 'text'],
      ['name', 'name', 'text'],
      ['x', 'x', 'numeric'],
      ['y', 'y', 'numeric'],
      ['kind', 'kind', 'text'],
    ],
  },
  {
    source: 'segments',
    table: 'rail_segments',
    columns: [
      ['id', 'id', 'text'],
      ['trackId', 'track_id', 'text'],
      ['name', 'name', 'text'],
      ['corridor', 'corridor', 'text'],
      ['direction', 'direction', 'text'],
      ['startKm', 'start_km', 'numeric'],
      ['endKm', 'end_km', 'numeric'],
      ['status', 'status', 'text'],
      ['conditionScore', 'condition_score', 'int'],
      ['infrastructure', 'infrastructure', 'text[]'],
      ['departmentSlugs', 'department_slugs', 'text[]'],
      ['fromNode', 'from_node', 'text'],
      ['toNode', 'to_node', 'text'],
      ['siteCode', 'site_code', 'text'],
    ],
  },
  {
    source: 'sensors',
    table: 'sensor_devices',
    columns: [
      ['id', 'id', 'text'],
      ['sensorId', 'sensor_id', 'text'],
      ['segmentId', 'segment_id', 'text'],
      ['status', 'status', 'text'],
      ['lastTransmission', 'last_transmission', 'timestamptz'],
      ['signalQuality', 'signal_quality', 'int'],
      ['firmware', 'firmware', 'text'],
      ['installationPoint', 'installation_point', 'text'],
      ['supportsVibration', 'supports_vibration', 'bool'],
      ['supportsTemperature', 'supports_temperature', 'bool'],
      ['supportsStrain', 'supports_strain', 'bool'],
      ['isSimulated', 'is_simulated', 'bool'],
      ['channels', 'channels', 'jsonb'],
    ],
  },
  {
    source: 'telemetry',
    table: 'telemetry_readings',
    columns: [
      ['id', 'id', 'text'],
      ['readingId', 'reading_id', 'text'],
      ['sensorId', 'sensor_id', 'text'],
      ['capturedAt', 'captured_at', 'timestamptz'],
      ['vibrationVelocity', 'vibration_velocity', 'numeric'],
      ['temperature', 'temperature', 'numeric'],
      ['structuralStrain', 'structural_strain', 'numeric'],
      ['isSimulated', 'is_simulated', 'bool'],
      ['qualityPct', 'quality_pct', 'int'],
    ],
  },
  {
    source: 'movements',
    table: 'train_movements',
    columns: [
      ['id', 'id', 'text'],
      ['movementId', 'movement_id', 'text'],
      ['segmentId', 'segment_id', 'text'],
      ['sensorId', 'sensor_id', 'text'],
      ['detectedAt', 'detected_at', 'timestamptz'],
      ['direction', 'direction', 'text'],
      ['source', 'source', 'text'],
      ['sourceKind', 'source_kind', 'text'],
      ['trainReference', 'train_reference', 'text'],
      ['peakVibration', 'peak_vibration', 'numeric'],
      ['durationSeconds', 'duration_seconds', 'int'],
      ['reviewStatus', 'review_status', 'text'],
      ['isSimulated', 'is_simulated', 'bool'],
    ],
  },
  {
    source: 'trains',
    table: 'train_runs',
    columns: [
      ['id', 'id', 'text'],
      ['label', 'label', 'text'],
      ['segmentId', 'segment_id', 'text'],
      ['direction', 'direction', 'text'],
      ['progress', 'progress', 'numeric3'],
      ['speedKph', 'speed_kph', 'int'],
      ['isSimulated', 'is_simulated', 'bool'],
    ],
  },
  {
    source: 'assessments',
    table: 'condition_assessments',
    columns: [
      ['id', 'id', 'text'],
      ['segmentId', 'segment_id', 'text'],
      ['condition', 'condition', 'text'],
      ['score', 'score', 'int'],
      ['basis', 'basis', 'text'],
      ['assessedAt', 'assessed_at', 'timestamptz'],
      ['notes', 'notes', 'text'],
    ],
  },
  {
    source: 'alerts',
    table: 'alerts',
    columns: [
      ['id', 'id', 'text'],
      ['reference', 'reference', 'text'],
      ['segmentId', 'segment_id', 'text'],
      ['departmentSlug', 'department_slug', 'text'],
      ['title', 'title', 'text'],
      ['detail', 'detail', 'text'],
      ['severity', 'severity', 'text'],
      ['status', 'status', 'text'],
      ['occurredAt', 'occurred_at', 'timestamptz'],
      ['source', 'source', 'text'],
    ],
  },
  {
    source: 'reports',
    table: 'maintenance_reports',
    columns: [
      ['id', 'id', 'text'],
      ['reference', 'reference', 'text'],
      ['title', 'title', 'text'],
      ['description', 'description', 'text'],
      ['segmentId', 'segment_id', 'text'],
      ['departmentSlug', 'department_slug', 'text'],
      ['severity', 'severity', 'text'],
      ['stage', 'stage', 'text'],
      ['reportedBy', 'reported_by', 'text'],
      ['reportedAt', 'reported_at', 'timestamptz'],
      ['photos', 'photos', 'text[]'],
      ['dueAt', 'due_at', 'timestamptz'],
      ['assignedTo', 'assigned_to', 'text'],
      ['instructions', 'instructions', 'text'],
      ['recommendedAction', 'recommended_action', 'text'],
      ['sensorEvidence', 'sensor_evidence', 'text'],
      ['evidenceNotes', 'evidence_notes', 'text'],
      ['completedAt', 'completed_at', 'timestamptz'],
      ['locationNote', 'location_note', 'text'],
    ],
  },
  {
    source: 'approvals',
    table: 'approvals',
    columns: [
      ['id', 'id', 'text'],
      ['reportId', 'report_id', 'text'],
      ['stage', 'stage', 'text'],
      ['actorId', 'actor_id', 'text'],
      ['actorRole', 'actor_role', 'text'],
      ['decision', 'decision', 'text'],
      ['comment', 'comment', 'text'],
      ['decidedAt', 'decided_at', 'timestamptz'],
    ],
  },
  {
    source: 'channels',
    table: 'channels',
    columns: [
      ['id', 'id', 'text'],
      ['slug', 'slug', 'text'],
      ['name', 'name', 'text'],
      ['kind', 'kind', 'text'],
      ['description', 'description', 'text'],
      ['memberIds', 'member_ids', 'text[]'],
    ],
  },
  {
    source: 'messages',
    table: 'messages',
    columns: [
      ['id', 'id', 'text'],
      ['channelSlug', 'channel_slug', 'text'],
      ['senderId', 'sender_id', 'text'],
      ['body', 'body', 'text'],
      ['sentAt', 'sent_at', 'timestamptz'],
      ['kind', 'kind', 'text'],
      ['attachmentName', 'attachment_name', 'text'],
      ['locationLabel', 'location_label', 'text'],
      ['isSimulated', 'is_simulated', 'bool'],
    ],
  },
  {
    source: 'calls',
    table: 'calls',
    columns: [
      ['id', 'id', 'text'],
      ['channelSlug', 'channel_slug', 'text'],
      ['kind', 'kind', 'text'],
      ['startedAt', 'started_at', 'timestamptz'],
      ['durationSeconds', 'duration_seconds', 'int'],
      ['participants', 'participants', 'text[]'],
      ['status', 'status', 'text'],
    ],
  },
  {
    source: 'notifications',
    table: 'notifications',
    columns: [
      ['id', 'id', 'text'],
      ['title', 'title', 'text'],
      ['body', 'body', 'text'],
      ['severity', 'severity', 'text'],
      ['createdAt', 'created_at', 'timestamptz'],
      ['readAt', 'read_at', 'timestamptz'],
      ['href', 'href', 'text'],
    ],
  },
  {
    source: 'audit',
    table: 'audit_entries',
    columns: [
      ['id', 'id', 'text'],
      ['actorId', 'actor_id', 'text'],
      ['action', 'action', 'text'],
      ['entity', 'entity', 'text'],
      ['entityId', 'entity_id', 'text'],
      ['detail', 'detail', 'text'],
      ['createdAt', 'created_at', 'timestamptz'],
    ],
  },
  {
    source: 'environment',
    table: 'environmental_readings',
    columns: [
      ['id', 'id', 'text'],
      ['segmentId', 'segment_id', 'text'],
      ['capturedAt', 'captured_at', 'timestamptz'],
      ['ambientTempC', 'ambient_temp_c', 'numeric'],
      ['trackTempC', 'track_temp_c', 'numeric'],
      ['rainfallMm', 'rainfall_mm', 'numeric'],
      ['humidityPct', 'humidity_pct', 'int'],
    ],
  },
]

/* ─────────────────────────────── Build ─────────────────────────────── */

async function loadDataset() {
  const source = await readFile(seedSource, 'utf8')
  // The only runtime import in seed.ts is the type-only import.
  const withoutTypes = source.replace(/import\s*\{[^}]*\}\s*from\s*'\.\/types'\s*/s, '')
  const { outputText } = ts.transpileModule(withoutTypes, {
    fileName: 'seed.ts',
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.ESNext,
      isolatedModules: true,
    },
    reportDiagnostics: true,
  })

  await mkdir(tempDir, { recursive: true })
  await writeFile(tempModule, outputText, 'utf8')
  return import(pathToFileURL(tempModule).href)
}

function buildSql(dataset) {
  const lines = []
  const counts = []

  lines.push('-- ═══════════════════════════════════════════════════════════════════════')
  lines.push('-- REGEN × PRASA — 03_seed.sql · demonstration dataset')
  lines.push('--')
  lines.push('-- GENERATED FILE — do not edit by hand.')
  lines.push('--   source:    src/lib/seed.ts')
  lines.push('--   generator: node scripts/export-seed.mjs')
  lines.push('--')
  lines.push('-- Run order:  01_schema.sql → 02_rls.sql → 03_seed.sql')
  lines.push('--')
  lines.push('-- Every row is inserted with ON CONFLICT (id) DO NOTHING, so the script is')
  lines.push('-- safe to re-run against a partially seeded database. To start clean:')
  lines.push('--')
  lines.push('--   truncate table public.audit_entries, public.notifications, public.calls,')
  lines.push('--     public.messages, public.channels, public.approvals,')
  lines.push('--     public.maintenance_reports, public.alerts,')
  lines.push('--     public.condition_assessments, public.train_runs,')
  lines.push('--     public.train_movements, public.telemetry_readings,')
  lines.push('--     public.sensor_devices, public.environmental_readings,')
  lines.push('--     public.rail_segments, public.rail_nodes, public.employees,')
  lines.push('--     public.departments cascade;')
  lines.push('--')
  lines.push('-- Demonstration accounts sign in with employee name + employee reference +')
  lines.push('-- password. Credentials are published on the sign-in screen and in README.md.')
  lines.push('-- ═══════════════════════════════════════════════════════════════════════')
  lines.push('')
  lines.push('begin;')
  lines.push('')

  for (const spec of TABLES) {
    const rows = dataset[spec.source]
    if (!Array.isArray(rows)) throw new Error(`seed.ts has no export named "${spec.source}"`)

    const columnList = spec.columns.map(([, column]) => column).join(', ')
    lines.push(`-- ── ${spec.table} · ${rows.length} row${rows.length === 1 ? '' : 's'}`)
    lines.push('')

    for (const row of rows) {
      const values = spec.columns.map(([field, , kind]) => literal(row[field], kind))
      lines.push(
        `insert into public.${spec.table} (${columnList}) values (${values.join(', ')}) on conflict (id) do nothing;`,
      )
    }

    lines.push('')
    counts.push([spec.table, rows.length])
  }

  lines.push('commit;')
  lines.push('')
  lines.push('-- ───────────────────────────── Summary ─────────────────────────────')
  lines.push('--')
  for (const [table, count] of counts) {
    lines.push(`--   ${table.padEnd(26)} ${String(count).padStart(4)} rows`)
  }
  lines.push('')

  return { sql: lines.join('\n'), counts }
}

async function main() {
  if (!existsSync(path.join(root, 'node_modules', 'typescript'))) {
    throw new Error('TypeScript is not installed. Run `npm install` first.')
  }

  const dataset = await loadDataset()
  const { sql, counts } = buildSql(dataset)
  await writeFile(output, sql, 'utf8')
  await rm(tempDir, { recursive: true, force: true })

  const total = counts.reduce((sum, [, count]) => sum + count, 0)
  console.log(`Wrote ${path.relative(root, output)} — ${total} rows across ${counts.length} tables.`)
  for (const [table, count] of counts) {
    console.log(`  ${table.padEnd(26)} ${String(count).padStart(4)}`)
  }
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
