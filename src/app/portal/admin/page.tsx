import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import {
  Activity,
  Building2,
  Cpu,
  Database,
  KeyRound,
  ShieldCheck,
  UserRound,
  Users,
} from 'lucide-react'

import {
  Chip,
  DataSourceNote,
  EmptyState,
  KeyValue,
  PageHeading,
  Panel,
  PanelHeader,
  StatusChip,
} from '@/components/ui/primitives'
import { requireUser } from '@/lib/auth'
import { formatAge, formatShort, initialsOf, titleCase } from '@/lib/format'
import { OPEN_STAGES, operationalNow } from '@/lib/insights'
import { ROLE_LABEL, can } from '@/lib/permissions'
import { dataSource, loadSnapshot, toPublicEmployee } from '@/lib/store'

export const metadata: Metadata = { title: 'Administration' }
export const dynamic = 'force-dynamic'

export default async function AdminPage() {
  const user = await requireUser()
  if (!can.administer(user)) redirect('/portal')

  const snapshot = await loadSnapshot()
  const now = operationalNow(snapshot)

  const employees = snapshot.employees.map(toPublicEmployee)
  const online = employees.filter((employee) => employee.isOnline).length
  const audit = [...snapshot.audit].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
  const employeeById = new Map(employees.map((employee) => [employee.id, employee]))
  const segmentById = new Map(snapshot.segments.map((segment) => [segment.id, segment]))

  const recordCounts = [
    { label: 'Employees', value: employees.length, icon: Users },
    { label: 'Departments', value: snapshot.departments.length, icon: Building2 },
    { label: 'Sections', value: snapshot.segments.length, icon: Activity },
    { label: 'Sensors', value: snapshot.sensors.length, icon: Cpu },
    { label: 'Telemetry rows', value: snapshot.telemetry.length, icon: Database },
    { label: 'Movements', value: snapshot.movements.length, icon: Activity },
    { label: 'Reports', value: snapshot.reports.length, icon: ShieldCheck },
    { label: 'Approvals', value: snapshot.approvals.length, icon: ShieldCheck },
    { label: 'Messages', value: snapshot.messages.length, icon: Users },
    { label: 'Audit entries', value: snapshot.audit.length, icon: KeyRound },
  ]

  return (
    <div className="space-y-4 sm:space-y-5">
      <PageHeading
        eyebrow="Administration"
        title="System administration"
        description="Employees, departments, sensor assets, data-source status and the immutable audit trail. Visible to administrators and the Head of Operations only."
        actions={<DataSourceNote source={dataSource} />}
      />

      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 xl:grid-cols-5">
        {recordCounts.map((row) => (
          <div key={row.label} className="panel p-3.5">
            <div className="flex items-start justify-between">
              <p className="eyebrow text-sky-300">{row.label}</p>
              <row.icon className="h-3.5 w-3.5 text-slate-500" aria-hidden />
            </div>
            <p className="mt-2.5 font-mono text-[20px] font-bold leading-none text-slate-100">{row.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.4fr_1fr] sm:gap-5">
        <div className="space-y-4 sm:space-y-5">
          <Panel>
            <PanelHeader
              eyebrow="People"
              title="Employee directory"
              description="Role and department determine every permission in the portal."
              action={
                <Chip tone="bg-emerald-500/10 text-emerald-300 ring-emerald-500/30">
                  {online} online
                </Chip>
              }
            />
            {/* Phone layout: the directory is a list of people, not a table. */}
            <ul className="divide-y divide-white/6 sm:hidden">
              {employees.map((employee) => (
                <li key={employee.id} className="flex items-start gap-2.5 px-3 py-2.5">
                  <span className="grid h-7 w-7 flex-none place-items-center rounded-full bg-navy-800 font-mono text-[8.5px] font-bold text-slate-300">
                    {initialsOf(employee.fullName)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[11.5px] font-semibold text-slate-200">{employee.fullName}</p>
                    <p className="mt-0.5 text-[9.5px] text-slate-500">
                      <span className="font-mono">{employee.employeeRef}</span> &middot; {ROLE_LABEL[employee.role]}
                    </p>
                    <p className="mt-0.5 text-[9.5px] capitalize text-slate-600">
                      {employee.departmentSlug ? employee.departmentSlug.replace(/-/g, ' ') : 'Unassigned'}
                    </p>
                  </div>
                  <span
                    className={`inline-flex flex-none items-center gap-1 pt-0.5 text-[9.5px] font-semibold ${
                      employee.isOnline ? 'text-emerald-300' : 'text-slate-500'
                    }`}
                  >
                    <span className={`h-1.5 w-1.5 rounded-full ${employee.isOnline ? 'bg-emerald-400' : 'bg-slate-600'}`} />
                    {employee.isOnline ? 'Online' : formatAge(employee.lastSeen, now)}
                  </span>
                </li>
              ))}
            </ul>

            <div className="hidden overflow-x-auto sm:block">
              <table className="data-table min-w-[640px]">
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Reference</th>
                    <th>Role</th>
                    <th>Department</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {employees.map((employee) => (
                    <tr key={employee.id}>
                      <td>
                        <div className="flex items-center gap-2">
                          <span className="grid h-6 w-6 flex-none place-items-center rounded-full bg-navy-800 font-mono text-[8.5px] font-bold text-slate-300">
                            {initialsOf(employee.fullName)}
                          </span>
                          <span className="text-[11px] font-semibold text-slate-200">{employee.fullName}</span>
                        </div>
                      </td>
                      <td className="font-mono text-[9.5px] text-slate-500">{employee.employeeRef}</td>
                      <td className="text-[10px] text-slate-400">{ROLE_LABEL[employee.role]}</td>
                      <td className="text-[10px] capitalize text-slate-500">
                        {employee.departmentSlug ? employee.departmentSlug.replace(/-/g, ' ') : 'â€”'}
                      </td>
                      <td>
                        <span
                          className={`inline-flex items-center gap-1 text-[9.5px] font-semibold ${
                            employee.isOnline ? 'text-emerald-300' : 'text-slate-500'
                          }`}
                        >
                          <span className={`h-1.5 w-1.5 rounded-full ${employee.isOnline ? 'bg-emerald-400' : 'bg-slate-600'}`} />
                          {employee.isOnline ? 'Online' : formatAge(employee.lastSeen, now)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>

          <Panel>
            <PanelHeader
              eyebrow="Audit"
              title="Audit trail"
              description="Every workflow transition, sensor injection and message is recorded against the acting employee."
              action={<Chip tone="bg-white/6 text-slate-300 ring-white/10">{audit.length}</Chip>}
            />
            {audit.length === 0 ? (
              <EmptyState title="No audit entries" description="No actions have been recorded yet." />
            ) : (
              <ol className="divide-y divide-white/6">
                {audit.slice(0, 14).map((entry) => {
                  const actor = employeeById.get(entry.actorId)
                  return (
                    <li key={entry.id} className="flex items-start gap-3 px-4 py-2.5 sm:px-5">
                      <span className="mt-0.5 grid h-6 w-6 flex-none place-items-center rounded-full bg-navy-800 font-mono text-[8px] font-bold text-slate-300">
                        {actor ? initialsOf(actor.fullName) : <UserRound className="h-2.5 w-2.5" aria-hidden />}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-[10.5px] font-semibold text-slate-200">{entry.action}</p>
                        <p className="truncate text-[9.5px] text-slate-500">{entry.detail}</p>
                        <p className="mt-0.5 text-[9px] text-slate-600">
                          {actor?.fullName ?? 'System'} Â· {entry.entity} Â· {entry.entityId} Â·{' '}
                          {formatShort(entry.createdAt)}
                        </p>
                      </div>
                    </li>
                  )
                })}
              </ol>
            )}
          </Panel>
        </div>

        <div className="space-y-4 sm:space-y-5">
          <Panel>
            <PanelHeader eyebrow="Integration" title="Central database" />
            <div className="p-4 sm:p-5">
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 flex-none place-items-center rounded-lg bg-green-500/10 text-green-400 ring-1 ring-inset ring-green-500/25">
                  <Database className="h-4.5 w-4.5" aria-hidden />
                </span>
                <div className="min-w-0">
                  <p className="text-[12px] font-bold text-slate-100">
                    {dataSource === 'supabase' ? 'Supabase Â· PostgreSQL' : 'Bundled demonstration dataset'}
                  </p>
                  <p className="text-[10px] text-slate-500">
                    {dataSource === 'supabase'
                      ? 'Live reads and writes against the REGEN schema'
                      : 'In-process store â€” configure Supabase to persist'}
                  </p>
                </div>
              </div>
              <KeyValue
                items={[
                  { label: 'Data source', value: <DataSourceNote source={dataSource} /> },
                  { label: 'Schema', value: <span className="font-mono text-[10px]">supabase/01_schema.sql</span> },
                  { label: 'Row-level security', value: <span className="font-mono text-[10px]">supabase/02_rls.sql</span> },
                  { label: 'Seed data', value: <span className="font-mono text-[10px]">supabase/03_seed.sql</span> },
                  { label: 'Realtime', value: 'Supabase Realtime / WebSockets' },
                  { label: 'Sensor ingest', value: 'MQTT over TLS / secure API' },
                  { label: 'Auth', value: 'Role-based sessions Â· scrypt + HMAC' },
                ]}
              />
            </div>
          </Panel>

          <Panel>
            <PanelHeader
              eyebrow="Assets"
              title="Sensor registry"
              description="Every edge device and its channel set."
            />
            <div className="divide-y divide-white/6">
              {snapshot.sensors.map((sensor) => {
                const segment = segmentById.get(sensor.segmentId)
                return (
                  <div key={sensor.id} className="px-4 py-2.5 sm:px-5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-[10px] font-semibold text-slate-200">{sensor.sensorId}</span>
                      <span
                        className={`text-[9px] font-bold uppercase tracking-[0.05em] ${
                          sensor.status === 'online'
                            ? 'text-emerald-300'
                            : sensor.status === 'degraded'
                              ? 'text-amber-300'
                              : 'text-slate-500'
                        }`}
                      >
                        {sensor.status}
                      </span>
                    </div>
                    <p className="mt-0.5 truncate text-[9.5px] text-slate-500">
                      {segment?.trackId} Â· {sensor.installationPoint}
                    </p>
                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[9px] text-slate-600">
                      <span className="font-mono">{sensor.firmware}</span>
                      <span>{sensor.channels.length} channels</span>
                      <span>{sensor.signalQuality}% signal</span>
                      <span className={sensor.isSimulated ? 'text-amber-400/80' : 'text-cyan-400/80'}>
                        {sensor.isSimulated ? 'simulated' : 'physical'}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </Panel>

          <Panel>
            <PanelHeader eyebrow="Operations" title="Workflow snapshot" />
            <div className="p-4 sm:p-5">
              <KeyValue
                items={[
                  {
                    label: 'Open reports',
                    value: snapshot.reports.filter((report) => OPEN_STAGES.includes(report.stage)).length,
                  },
                  {
                    label: 'Awaiting authorisation',
                    value: snapshot.reports.filter((report) => report.stage === 'awaiting-authorisation').length,
                  },
                  {
                    label: 'Closed reports',
                    value: snapshot.reports.filter((report) => report.stage === 'closed').length,
                  },
                  {
                    label: 'Open alerts',
                    value: snapshot.alerts.filter((alert) => alert.status !== 'resolved').length,
                  },
                  { label: 'Notifications', value: snapshot.notifications.length },
                  { label: 'Signed-in as', value: ROLE_LABEL[user.role] },
                ]}
              />
            </div>
          </Panel>

          <Panel>
            <PanelHeader eyebrow="Structure" title="Departments" />
            <div className="max-h-[280px] divide-y divide-white/6 overflow-y-auto">
              {snapshot.departments.map((department) => (
                <div key={department.id} className="flex items-center gap-2 px-4 py-2 sm:px-5">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[10.5px] font-semibold text-slate-200">{department.name}</p>
                    <p className="truncate text-[9px] text-slate-600">
                      {titleCase(department.discipline)} Â· {department.headcount} staff
                    </p>
                  </div>
                  <StatusChip status={department.status} />
                </div>
              ))}
            </div>
          </Panel>
        </div>
      </div>
    </div>
  )
}

