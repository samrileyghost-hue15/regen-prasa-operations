import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, Building2, ChevronRight, Layers, Users } from 'lucide-react'

import {
  DataSourceNote,
  PageHeading,
  Panel,
  PanelHeader,
  StatusChip,
} from '@/components/ui/primitives'
import { requireUser } from '@/lib/auth'
import { OPEN_STAGES, departmentRollups } from '@/lib/insights'
import { dataSource, loadSnapshot } from '@/lib/store'
import type { Department, Discipline } from '@/lib/types'

export const metadata: Metadata = { title: 'Departments' }
export const dynamic = 'force-dynamic'

const DISCIPLINES: { key: Discipline; label: string; blurb: string }[] = [
  {
    key: 'fixed-infrastructure',
    label: 'Fixed Infrastructure',
    blurb: 'Permanent assets that keep the network safe and energised.',
  },
  {
    key: 'train-operations',
    label: 'Train Operations',
    blurb: 'Day-to-day running of the service across the Gauteng corridor.',
  },
]

export default async function DepartmentsPage() {
  await requireUser()
  const snapshot = await loadSnapshot()
  const rollups = departmentRollups(snapshot)

  const bySlug = new Map(rollups.map((rollup) => [rollup.department.slug, rollup]))
  const totalHeadcount = snapshot.departments.reduce((sum, row) => sum + row.headcount, 0)
  const openReports = snapshot.reports.filter((report) => OPEN_STAGES.includes(report.stage)).length

  const childrenOf = (parentSlug: string | null, discipline: Discipline): Department[] =>
    snapshot.departments.filter(
      (department) => department.parentSlug === parentSlug && department.discipline === discipline,
    )

  const renderNode = (department: Department, depth: number): React.ReactNode => {
    const rollup = bySlug.get(department.slug)
    const children = childrenOf(department.slug, department.discipline)
    return (
      <li key={department.id}>
        <Link
          href={`/portal/departments/${department.slug}`}
          className="group flex items-start gap-3 rounded-lg border border-white/8 bg-navy-925/50 px-3 py-2.5 transition-colors hover:border-green-500/30 hover:bg-navy-850"
          style={{ marginLeft: depth * 14 }}
        >
          <span className="mt-0.5 grid h-7 w-7 flex-none place-items-center rounded-md bg-white/5 text-slate-400 group-hover:text-green-400">
            {depth === 0 ? <Building2 className="h-3.5 w-3.5" aria-hidden /> : <Layers className="h-3.5 w-3.5" aria-hidden />}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <p className="text-[12px] font-semibold text-slate-100">{department.name}</p>
              <StatusChip status={rollup?.status ?? department.status} />
              {rollup && rollup.openReports > 0 && (
                <span className="rounded bg-green-500/12 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.06em] text-green-400">
                  {rollup.openReports} open
                </span>
              )}
            </div>
            <p className="mt-0.5 line-clamp-1 text-[10.5px] leading-relaxed text-slate-500">
              {department.description}
            </p>
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[9.5px] text-slate-500">
              <span className="flex items-center gap-1">
                <Users className="h-2.5 w-2.5" aria-hidden />
                {department.headcount} staff
              </span>
              <span className="font-mono">
                {department.kpiLabel}: <span className="text-slate-300">{department.kpiValue}</span>
              </span>
              <span>SLA {department.slaHours}h</span>
            </div>
          </div>
          <ChevronRight className="mt-1 h-3.5 w-3.5 flex-none text-slate-600 group-hover:text-green-400" aria-hidden />
        </Link>
        {children.length > 0 && (
          <ul className="mt-1.5 space-y-1.5">{children.map((child) => renderNode(child, depth + 1))}</ul>
        )}
      </li>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-5">
      <PageHeading
        eyebrow="PRASA operational structure"
        title="Departments"
        description="Every department has its own workspace connected to the same REGEN database. Access is granted by role and department."
        actions={
          <div className="hidden items-center rounded-lg border border-white/10 bg-navy-925 px-3 py-1.5 sm:flex">
            <DataSourceNote source={dataSource} />
          </div>
        }
      />

      <div className="grid grid-cols-3 gap-2.5">
        <div className="panel p-3.5">
          <p className="eyebrow text-sky-300">Departments</p>
          <p className="mt-2 font-mono text-[22px] font-bold leading-none text-slate-100">
            {snapshot.departments.length}
          </p>
          <p className="mt-1.5 text-[10.5px] text-slate-500">Across two disciplines</p>
        </div>
        <div className="panel p-3.5">
          <p className="eyebrow text-green-400">Total headcount</p>
          <p className="mt-2 font-mono text-[22px] font-bold leading-none text-slate-100">
            {totalHeadcount}
          </p>
          <p className="mt-1.5 text-[10.5px] text-slate-500">Approved establishment</p>
        </div>
        <div className="panel p-3.5">
          <p className="eyebrow text-amber-300">Open in workflow</p>
          <p className="mt-2 font-mono text-[22px] font-bold leading-none text-slate-100">{openReports}</p>
          <p className="mt-1.5 text-[10.5px] text-slate-500">
            <Link href="/portal/maintenance" className="inline-flex items-center gap-1 text-green-400 hover:text-green-300">
              Maintenance registry <ArrowRight className="h-2.5 w-2.5" aria-hidden />
            </Link>
          </p>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-2 sm:gap-5">
        {DISCIPLINES.map((discipline) => {
          const roots = childrenOf(null, discipline.key)
          return (
            <Panel key={discipline.key}>
              <PanelHeader
                eyebrow="Discipline"
                title={discipline.label}
                description={discipline.blurb}
              />
              <div className="p-3 sm:p-4">
                <ul className="space-y-1.5">{roots.map((root) => renderNode(root, 0))}</ul>
              </div>
            </Panel>
          )
        })}
      </div>
    </div>
  )
}

