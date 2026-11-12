import type { Metadata } from 'next'
import { MessageSquare, Phone, Users, Video } from 'lucide-react'

import { ConnectWorkspace } from '@/components/connect/ConnectWorkspace'
import { DataSourceNote, PageHeading } from '@/components/ui/primitives'
import { requireUser } from '@/lib/auth'
import { dataSource, loadSnapshot, toPublicEmployee } from '@/lib/store'

export const metadata: Metadata = { title: 'REGEN Connect' }
export const dynamic = 'force-dynamic'

export default async function ConnectPage({
  searchParams,
}: {
  searchParams: Promise<{ channel?: string }>
}) {
  const user = await requireUser()
  const { channel } = await searchParams
  const snapshot = await loadSnapshot()

  const employees = snapshot.employees.map(toPublicEmployee)
  const online = employees.filter((employee) => employee.isOnline).length
  const audioCalls = snapshot.calls.filter((call) => call.kind === 'audio').length
  const videoCalls = snapshot.calls.filter((call) => call.kind === 'video').length

  return (
    <div className="space-y-4 sm:space-y-5">
      <PageHeading
        eyebrow="Communication Â· Operational Centre â‡„ field"
        title="REGEN Connect"
        description="Individual messaging, department group chats, audio and video calls, photograph, document and location sharing â€” with live employee availability."
        actions={
          <>
            <span className="hidden items-center gap-1.5 rounded-lg border border-emerald-400/25 bg-emerald-500/8 px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-[0.06em] text-emerald-300 sm:flex">
              <Users className="h-3 w-3" aria-hidden />
              {online} of {employees.length} available
            </span>
            <div className="hidden items-center rounded-lg border border-white/10 bg-navy-925 px-3 py-1.5 md:flex">
              <DataSourceNote source={dataSource} />
            </div>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        <div className="panel flex items-center gap-2.5 p-3">
          <span className="grid h-8 w-8 flex-none place-items-center rounded-md bg-green-500/10 text-green-400">
            <MessageSquare className="h-4 w-4" aria-hidden />
          </span>
          <div className="min-w-0">
            <p className="font-mono text-[15px] font-bold leading-none text-slate-100">{snapshot.channels.length}</p>
            <p className="mt-1 truncate text-[9.5px] text-slate-500">Channels</p>
          </div>
        </div>
        <div className="panel flex items-center gap-2.5 p-3">
          <span className="grid h-8 w-8 flex-none place-items-center rounded-md bg-green-500/10 text-green-400">
            <Users className="h-4 w-4" aria-hidden />
          </span>
          <div className="min-w-0">
            <p className="font-mono text-[15px] font-bold leading-none text-slate-100">
              {online}
              <span className="text-[10px] text-slate-500">/{employees.length}</span>
            </p>
            <p className="mt-1 truncate text-[9.5px] text-slate-500">Available staff</p>
          </div>
        </div>
        <div className="panel flex items-center gap-2.5 p-3">
          <span className="grid h-8 w-8 flex-none place-items-center rounded-md bg-sky-500/10 text-sky-300">
            <Phone className="h-4 w-4" aria-hidden />
          </span>
          <div className="min-w-0">
            <p className="font-mono text-[15px] font-bold leading-none text-slate-100">{audioCalls}</p>
            <p className="mt-1 truncate text-[9.5px] text-slate-500">Audio calls logged</p>
          </div>
        </div>
        <div className="panel flex items-center gap-2.5 p-3">
          <span className="grid h-8 w-8 flex-none place-items-center rounded-md bg-violet-500/10 text-violet-300">
            <Video className="h-4 w-4" aria-hidden />
          </span>
          <div className="min-w-0">
            <p className="font-mono text-[15px] font-bold leading-none text-slate-100">{videoCalls}</p>
            <p className="mt-1 truncate text-[9.5px] text-slate-500">Video calls logged</p>
          </div>
        </div>
      </div>

      <ConnectWorkspace
        channels={snapshot.channels}
        messages={snapshot.messages}
        employees={employees}
        calls={snapshot.calls}
        currentUserId={user.id}
        initialChannel={channel}
      />

      <p className="text-[9.5px] leading-relaxed text-slate-600">
        Calls are demonstrated in-app without capturing media. Once PRASA approves the production integration,
        the same surface connects to WebRTC media, and every call, message and shared location is retained in
        the central REGEN database for audit.
      </p>
    </div>
  )
}

