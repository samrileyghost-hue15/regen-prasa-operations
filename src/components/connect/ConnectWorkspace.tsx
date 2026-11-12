'use client'

import { useEffect, useMemo, useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  Camera,
  ChevronRight,
  FileText,
  Loader2,
  MapPin,
  MessageSquare,
  Paperclip,
  Phone,
  Search,
  Send,
  Users,
  Video,
  X,
} from 'lucide-react'

import { sendMessageAction } from '@/app/portal/actions'
import { CallOverlay } from '@/components/connect/CallOverlay'
import { Chip, EmptyState, Panel } from '@/components/ui/primitives'
import { formatDate, formatDuration, formatShort, formatTime, initialsOf } from '@/lib/format'
import { ROLE_LABEL, ROLE_SHORT } from '@/lib/permissions'
import type { CallRecord, Channel, Message, PublicEmployee } from '@/lib/types'

type Props = {
  channels: Channel[]
  messages: Message[]
  employees: PublicEmployee[]
  calls: CallRecord[]
  currentUserId: string
  initialChannel?: string
}

const KIND_LABEL: Record<Channel['kind'], string> = {
  operations: 'Operational Centre',
  department: 'Department',
  team: 'Team',
  direct: 'Direct',
}

const KIND_ORDER: Channel['kind'][] = ['operations', 'team', 'department', 'direct']

export function ConnectWorkspace({
  channels,
  messages,
  employees,
  calls,
  currentUserId,
  initialChannel,
}: Props) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  const [channelSlug, setChannelSlug] = useState(
    channels.find((channel) => channel.slug === initialChannel)?.slug ?? channels[0]?.slug ?? '',
  )
  const [mobileConversation, setMobileConversation] = useState(Boolean(initialChannel))
  const [draft, setDraft] = useState('')
  const [attachment, setAttachment] = useState<null | 'image' | 'document' | 'location'>(null)
  const [attachmentValue, setAttachmentValue] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [call, setCall] = useState<null | 'audio' | 'video'>(null)

  const scroller = useRef<HTMLDivElement>(null)

  const employeeById = useMemo(() => new Map(employees.map((employee) => [employee.id, employee])), [employees])
  const channel = channels.find((row) => row.slug === channelSlug) ?? channels[0]

  const channelMessages = useMemo(
    () =>
      messages
        .filter((message) => message.channelSlug === channel?.slug)
        .sort((a, b) => (a.sentAt < b.sentAt ? -1 : 1)),
    [messages, channel?.slug],
  )

  const filteredChannels = useMemo(() => {
    if (!search) return channels
    return channels.filter((row) => `${row.name} ${row.description}`.toLowerCase().includes(search.toLowerCase()))
  }, [channels, search])

  const members = (channel?.memberIds ?? [])
    .map((id) => employeeById.get(id))
    .filter((employee): employee is PublicEmployee => Boolean(employee))

  const channelCalls = calls.filter((row) => row.channelSlug === channel?.slug)
  const shared = channelMessages.filter((message) => ['image', 'document', 'location'].includes(message.kind))

  useEffect(() => {
    if (scroller.current) scroller.current.scrollTop = scroller.current.scrollHeight
  }, [channelMessages.length, channel?.slug])

  const send = () => {
    if (!channel) return
    const body = attachment ? attachmentValue.trim() : draft.trim()
    if (!body) {
      setError('Write a message before sending.')
      return
    }
    setError(null)
    startTransition(async () => {
      const result = await sendMessageAction({
        channelSlug: channel.slug,
        body,
        kind: attachment ?? 'text',
        attachmentName: attachment === 'image' || attachment === 'document' ? body : undefined,
        locationLabel: attachment === 'location' ? body : undefined,
      })
      if (!result.ok) {
        setError(result.error)
        return
      }
      setDraft('')
      setAttachment(null)
      setAttachmentValue('')
      router.refresh()
    })
  }

  const openChannel = (slug: string) => {
    setChannelSlug(slug)
    setMobileConversation(true)
    setError(null)
    setAttachment(null)
    setAttachmentValue('')
  }

  const callParticipants = members.map((member) => ({
    id: member.id,
    fullName: member.fullName,
    role: ROLE_SHORT[member.role],
    isOnline: member.isOnline,
  }))

  const grouped = KIND_ORDER.map((kind) => ({
    kind,
    rows: filteredChannels.filter((row) => row.kind === kind),
  })).filter((group) => group.rows.length > 0)

  if (!channel) {
    return (
      <Panel>
        <EmptyState title="No channels available" description="Communication channels have not been provisioned." />
      </Panel>
    )
  }

  return (
    <>
      <div className="grid gap-4 lg:grid-cols-[264px_1fr] xl:grid-cols-[264px_1fr_280px]">
        {/* Channel list */}
        <div className={`${mobileConversation ? 'hidden lg:block' : 'block'}`}>
          <Panel className="overflow-hidden">
            <div className="border-b border-white/8 p-2.5">
              <div className="relative">
                <Search className="pointer-events-none absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-slate-500" aria-hidden />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Find a channel"
                  aria-label="Search channels"
                  className="w-full rounded-md border border-white/10 bg-navy-950 py-1.5 pl-7 pr-2 text-[10.5px] text-slate-200 outline-none placeholder:text-slate-600 focus:border-green-500/40 focus:ring-1 focus:ring-green-500/30"
                />
              </div>
            </div>
            <div className="max-h-[420px] overflow-y-auto lg:max-h-[540px]">
              {grouped.map((group) => (
                <div key={group.kind} className="border-b border-white/6 last:border-b-0">
                  <p className="px-3 pb-1 pt-2.5 text-[8.5px] font-bold uppercase tracking-[0.12em] text-slate-600">
                    {KIND_LABEL[group.kind]}
                  </p>
                  {group.rows.map((row) => {
                    const last = messages
                      .filter((message) => message.channelSlug === row.slug)
                      .sort((a, b) => (a.sentAt < b.sentAt ? 1 : -1))[0]
                    const active = row.slug === channel.slug
                    return (
                      <button
                        key={row.id}
                        type="button"
                        onClick={() => openChannel(row.slug)}
                        className={`flex w-full items-start gap-2.5 px-3 py-2 text-left transition-colors ${
                          active ? 'bg-green-500/10' : 'hover:bg-white/4'
                        }`}
                      >
                        <span
                          className={`mt-0.5 grid h-7 w-7 flex-none place-items-center rounded-md ${
                            active ? 'bg-green-500/15 text-green-400' : 'bg-white/5 text-slate-400'
                          }`}
                        >
                          <MessageSquare className="h-3.5 w-3.5" aria-hidden />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className={`block truncate text-[11px] font-semibold ${active ? 'text-green-100' : 'text-slate-200'}`}>
                            {row.name}
                          </span>
                          <span className="mt-0.5 block truncate text-[9.5px] text-slate-500">
                            {last
                              ? `${employeeById.get(last.senderId)?.fullName.split(' ')[0] ?? 'Unknown'}: ${last.body}`
                              : row.description}
                          </span>
                        </span>
                        <span className="flex-none font-mono text-[8.5px] text-slate-600">
                          {last ? formatTime(last.sentAt) : ''}
                        </span>
                      </button>
                    )
                  })}
                </div>
              ))}
            </div>
          </Panel>
        </div>

        {/* Conversation */}
        <div className={`${mobileConversation ? 'block' : 'hidden lg:block'}`}>
          <Panel className="flex h-[calc(100dvh-190px)] min-h-[440px] flex-col overflow-hidden lg:h-[calc(100dvh-170px)]">
            <div className="flex flex-wrap items-center gap-2 border-b border-white/8 px-3 py-2.5 sm:px-4">
              <button
                type="button"
                onClick={() => setMobileConversation(false)}
                className="grid h-7 w-7 place-items-center rounded-md text-slate-400 hover:bg-white/6 lg:hidden"
                aria-label="Back to channels"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
              </button>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[12px] font-bold text-slate-100">{channel.name}</p>
                <p className="truncate text-[9.5px] text-slate-500">
                  {KIND_LABEL[channel.kind]} Â· {members.length} members Â· {members.filter((member) => member.isOnline).length} available
                </p>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setCall('audio')}
                  className="grid h-7 w-7 place-items-center rounded-md border border-white/10 text-slate-300 hover:border-emerald-400/40 hover:text-emerald-300"
                  aria-label="Start audio call"
                  title="Audio call"
                >
                  <Phone className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setCall('video')}
                  className="grid h-7 w-7 place-items-center rounded-md border border-white/10 text-slate-300 hover:border-green-500/40 hover:text-green-400"
                  aria-label="Start video call"
                  title="Video call"
                >
                  <Video className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            <div ref={scroller} className="flex-1 space-y-3 overflow-y-auto px-3 py-3 sm:px-4">
              {channelMessages.length === 0 && (
                <EmptyState
                  title="No messages yet"
                  description="Start the conversation. Messages, photographs, documents and locations all land here."
                  icon={MessageSquare}
                />
              )}
              {channelMessages.map((message, index) => {
                const author = employeeById.get(message.senderId)
                const mine = message.senderId === currentUserId
                const previous = channelMessages[index - 1]
                const showDate =
                  !previous || formatDate(previous.sentAt) !== formatDate(message.sentAt)

                if (message.kind === 'system') {
                  return (
                    <div key={message.id} className="flex flex-col items-center gap-1">
                      {showDate && (
                        <span className="rounded-full bg-white/6 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.06em] text-slate-500">
                          {formatDate(message.sentAt)}
                        </span>
                      )}
                      <p className="max-w-md text-center text-[9.5px] italic text-slate-600">{message.body}</p>
                    </div>
                  )
                }

                return (
                  <div key={message.id}>
                    {showDate && (
                      <div className="mb-2 flex justify-center">
                        <span className="rounded-full bg-white/6 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.06em] text-slate-500">
                          {formatDate(message.sentAt)}
                        </span>
                      </div>
                    )}
                    <div className={`flex items-end gap-2 ${mine ? 'flex-row-reverse' : ''}`}>
                      <span className="grid h-6 w-6 flex-none place-items-center rounded-full bg-navy-800 font-mono text-[8.5px] font-bold text-slate-300">
                        {author ? initialsOf(author.fullName) : '?'}
                      </span>
                      <div className={`min-w-0 max-w-[84%] sm:max-w-[74%] ${mine ? 'items-end text-right' : ''}`}>
                        {!mine && (
                          <p className="mb-0.5 text-[9px] font-semibold text-slate-500">
                            {author?.fullName ?? 'Unknown'}
                            {author && <span className="ml-1 font-normal text-slate-600">Â· {ROLE_SHORT[author.role]}</span>}
                          </p>
                        )}
                        <div
                          className={`rounded-lg px-2.5 py-1.5 text-left text-[11px] leading-relaxed ring-1 ring-inset ${
                            mine
                              ? 'bg-green-500/12 text-green-50 ring-green-500/25'
                              : 'bg-white/5 text-slate-200 ring-white/8'
                          }`}
                        >
                          {message.kind === 'image' && (
                            <span className="mb-1 flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-[0.06em] text-green-400">
                              <Camera className="h-3 w-3" aria-hidden /> Photograph
                            </span>
                          )}
                          {message.kind === 'document' && (
                            <span className="mb-1 flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-[0.06em] text-violet-300">
                              <FileText className="h-3 w-3" aria-hidden /> Document
                            </span>
                          )}
                          {message.kind === 'location' && (
                            <span className="mb-1 flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-[0.06em] text-amber-300">
                              <MapPin className="h-3 w-3" aria-hidden /> Location shared
                            </span>
                          )}
                          <p className="whitespace-pre-wrap break-words">{message.body}</p>
                        </div>
                        <p className="mt-0.5 flex items-center gap-1.5 text-[8.5px] text-slate-600">
                          <span className="font-mono">{formatTime(message.sentAt)}</span>
                          {message.isSimulated && <span className="text-amber-400/80">simulated</span>}
                        </p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="border-t border-white/8 p-2.5 sm:p-3">
              {attachment && (
                <div className="mb-2 flex items-center gap-2 rounded-md border border-white/10 bg-navy-950/60 px-2 py-1.5">
                  <span className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-[0.06em] text-slate-400">
                    {attachment === 'image' ? <Camera className="h-3 w-3" /> : attachment === 'document' ? <FileText className="h-3 w-3" /> : <MapPin className="h-3 w-3" />}
                    {attachment}
                  </span>
                  <input
                    autoFocus
                    value={attachmentValue}
                    onChange={(event) => setAttachmentValue(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        event.preventDefault()
                        send()
                      }
                    }}
                    placeholder={
                      attachment === 'location'
                        ? 'KM 0.4 Â· down line Â· Kempton Park'
                        : attachment === 'image'
                          ? 'kp01-patrol-0912.jpg'
                          : 'feeder-b-termination.pdf'
                    }
                    className="min-w-0 flex-1 bg-transparent text-[10.5px] text-slate-200 outline-none placeholder:text-slate-600"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setAttachment(null)
                      setAttachmentValue('')
                    }}
                    className="grid h-5 w-5 flex-none place-items-center rounded text-slate-500 hover:text-slate-200"
                    aria-label="Cancel attachment"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              )}

              <div className="flex items-end gap-1.5">
                <div className="flex flex-none items-center gap-0.5">
                  <button
                    type="button"
                    onClick={() => setAttachment(attachment === 'image' ? null : 'image')}
                    className={`grid h-7 w-7 place-items-center rounded-md ${attachment === 'image' ? 'bg-green-500/15 text-green-400' : 'text-slate-500 hover:bg-white/6 hover:text-slate-300'}`}
                    aria-label="Share a photograph"
                    title="Share photograph"
                  >
                    <Camera className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setAttachment(attachment === 'document' ? null : 'document')}
                    className={`grid h-7 w-7 place-items-center rounded-md ${attachment === 'document' ? 'bg-violet-500/15 text-violet-300' : 'text-slate-500 hover:bg-white/6 hover:text-slate-300'}`}
                    aria-label="Share a document"
                    title="Share document"
                  >
                    <Paperclip className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setAttachment(attachment === 'location' ? null : 'location')}
                    className={`grid h-7 w-7 place-items-center rounded-md ${attachment === 'location' ? 'bg-amber-500/15 text-amber-300' : 'text-slate-500 hover:bg-white/6 hover:text-slate-300'}`}
                    aria-label="Share location"
                    title="Share location (authorised staff)"
                  >
                    <MapPin className="h-3.5 w-3.5" />
                  </button>
                </div>

                {!attachment && (
                  <textarea
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' && !event.shiftKey) {
                        event.preventDefault()
                        send()
                      }
                    }}
                    rows={1}
                    placeholder={`Message ${channel.name}`}
                    aria-label="Message text"
                    className="max-h-24 min-h-[34px] flex-1 resize-none rounded-md border border-white/10 bg-navy-950 px-2.5 py-2 text-[11px] text-slate-200 outline-none placeholder:text-slate-600 focus:border-green-500/40 focus:ring-1 focus:ring-green-500/30"
                  />
                )}

                <button
                  type="button"
                  onClick={send}
                  disabled={pending}
                  className="grid h-[34px] w-[34px] flex-none place-items-center rounded-md bg-green-500 text-navy-950 transition-colors hover:bg-green-400 disabled:opacity-60"
                  aria-label="Send message"
                >
                  {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                </button>
              </div>
              {error && <p className="mt-1.5 text-[9.5px] font-semibold text-red-300">{error}</p>}
            </div>
          </Panel>
        </div>

        {/* Channel detail */}
        <div className="hidden space-y-4 xl:block">
          <Panel>
            <div className="border-b border-white/8 px-3 py-2.5">
              <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-slate-600">Availability</p>
              <p className="mt-0.5 text-[11.5px] font-bold text-slate-100">Channel members</p>
            </div>
            <div className="max-h-[260px] divide-y divide-white/6 overflow-y-auto">
              {members.map((member) => (
                <div key={member.id} className="flex items-center gap-2.5 px-3 py-2">
                  <span className="relative grid h-7 w-7 flex-none place-items-center rounded-full bg-navy-800 font-mono text-[9px] font-bold text-slate-300">
                    {initialsOf(member.fullName)}
                    <span
                      className={`absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full ring-2 ring-navy-900 ${
                        member.isOnline ? 'bg-emerald-400' : 'bg-slate-600'
                      }`}
                    />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[10.5px] font-semibold text-slate-200">{member.fullName}</p>
                    <p className="truncate text-[9px] text-slate-500">{ROLE_LABEL[member.role]}</p>
                  </div>
                  {member.isOnline ? (
                    <span className="flex-none text-[8.5px] font-bold uppercase tracking-[0.05em] text-emerald-400">
                      Online
                    </span>
                  ) : (
                    <span className="flex-none font-mono text-[8.5px] text-slate-600">
                      {formatShort(member.lastSeen).split('Â·')[1]?.trim()}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </Panel>

          <Panel>
            <div className="border-b border-white/8 px-3 py-2.5">
              <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-slate-600">History</p>
              <p className="mt-0.5 text-[11.5px] font-bold text-slate-100">Recent calls</p>
            </div>
            {channelCalls.length === 0 ? (
              <p className="px-3 py-3 text-[10px] text-slate-500">No calls recorded on this channel.</p>
            ) : (
              <div className="divide-y divide-white/6">
                {channelCalls.slice(0, 4).map((row) => (
                  <div key={row.id} className="flex items-center gap-2 px-3 py-2">
                    <span className="grid h-6 w-6 flex-none place-items-center rounded bg-white/5 text-slate-400">
                      {row.kind === 'video' ? <Video className="h-3 w-3" /> : <Phone className="h-3 w-3" />}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[10px] font-semibold capitalize text-slate-300">
                        {row.kind} call Â· {row.participants.length} participants
                      </p>
                      <p className="font-mono text-[9px] text-slate-600">
                        {formatDuration(row.durationSeconds)} Â· {formatShort(row.startedAt)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Panel>

          <Panel>
            <div className="border-b border-white/8 px-3 py-2.5">
              <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-slate-600">Shared</p>
              <p className="mt-0.5 text-[11.5px] font-bold text-slate-100">Files &amp; locations</p>
            </div>
            {shared.length === 0 ? (
              <p className="px-3 py-3 text-[10px] text-slate-500">Nothing shared in this channel yet.</p>
            ) : (
              <div className="divide-y divide-white/6">
                {shared.slice(0, 5).map((message) => (
                  <div key={message.id} className="flex items-center gap-2 px-3 py-2">
                    <span className="grid h-6 w-6 flex-none place-items-center rounded bg-white/5 text-slate-400">
                      {message.kind === 'image' ? (
                        <Camera className="h-3 w-3" />
                      ) : message.kind === 'document' ? (
                        <FileText className="h-3 w-3" />
                      ) : (
                        <MapPin className="h-3 w-3" />
                      )}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[10px] text-slate-300">{message.body}</p>
                      <p className="truncate text-[9px] text-slate-600">
                        {employeeById.get(message.senderId)?.fullName ?? 'Unknown'} Â· {formatTime(message.sentAt)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Panel>

          <Panel>
            <div className="border-b border-white/8 px-3 py-2.5">
              <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-slate-600">Field operations</p>
              <p className="mt-0.5 text-[11.5px] font-bold text-slate-100">Assignments</p>
            </div>
            <div className="space-y-2 p-3">
              <p className="text-[10px] leading-relaxed text-slate-500">
                Field workers receive work orders and submit defect reports directly from REGEN Connect.
              </p>
              <div className="flex flex-wrap gap-1.5">
                <Chip tone="bg-green-500/10 text-green-400 ring-green-500/25">Receive assignments</Chip>
                <Chip tone="bg-green-500/10 text-green-400 ring-green-500/25">Submit reports</Chip>
              </div>
              <a
                href="/portal/maintenance"
                className="flex items-center justify-between rounded-md border border-white/10 px-2.5 py-1.5 text-[10px] font-semibold text-slate-300 hover:border-green-500/40 hover:text-green-300"
              >
                Open maintenance registry
                <ChevronRight className="h-3 w-3" aria-hidden />
              </a>
            </div>
          </Panel>
        </div>
      </div>

      {call && (
        <CallOverlay
          channelSlug={channel.slug}
          channelName={channel.name}
          kind={call}
          participants={callParticipants}
          onClose={() => {
            setCall(null)
            router.refresh()
          }}
        />
      )}
    </>
  )
}


