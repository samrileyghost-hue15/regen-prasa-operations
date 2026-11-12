'use client'

import { useEffect, useState } from 'react'
import {
  Mic,
  MicOff,
  MonitorUp,
  PhoneCall,
  PhoneOff,
  Video,
  VideoOff,
  Volume2,
} from 'lucide-react'

import { recordCallAction } from '@/app/portal/actions'
import { Chip } from '@/components/ui/primitives'
import { formatDuration, initialsOf } from '@/lib/format'

type Participant = { id: string; fullName: string; role: string; isOnline: boolean }

type Props = {
  channelSlug: string
  channelName: string
  kind: 'audio' | 'video'
  participants: Participant[]
  onClose: () => void
}

/**
 * Simulated REGEN Connect call surface.
 *
 * No media is captured or transmitted â€” the prototype demonstrates the call
 * experience and records the call against the channel so the communication
 * audit is complete.
 */
export function CallOverlay({ channelSlug, channelName, kind, participants, onClose }: Props) {
  const [seconds, setSeconds] = useState(0)
  const [muted, setMuted] = useState(false)
  const [cameraOn, setCameraOn] = useState(kind === 'video')
  const [ending, setEnding] = useState(false)

  useEffect(() => {
    const timer = window.setInterval(() => setSeconds((value) => value + 1), 1000)
    return () => window.clearInterval(timer)
  }, [])

  const end = async () => {
    setEnding(true)
    await recordCallAction({
      channelSlug,
      kind,
      durationSeconds: seconds,
      participants: participants.map((participant) => participant.id),
    })
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-[80] flex flex-col bg-navy-950/95 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={`${kind === 'video' ? 'Video' : 'Audio'} call with ${channelName}`}
    >
      <header className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3 sm:px-6">
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 text-[9.5px] font-bold uppercase tracking-[0.1em] text-green-400">
            <PhoneCall className="h-3 w-3" aria-hidden />
            REGEN Connect Â· {kind === 'video' ? 'video call' : 'audio call'}
          </p>
          <p className="mt-0.5 truncate text-[13px] font-bold text-white">{channelName}</p>
        </div>
        <div className="flex items-center gap-2">
          <Chip tone="bg-amber-500/10 text-amber-300 ring-amber-500/30">
            Simulated Â· no media captured
          </Chip>
          <span className="font-mono text-[13px] font-semibold tabular-nums text-slate-200">
            {formatDuration(seconds)}
          </span>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        <div
          className={`mx-auto grid max-w-4xl gap-3 ${
            participants.length <= 2 ? 'sm:grid-cols-2' : 'sm:grid-cols-2 lg:grid-cols-3'
          }`}
        >
          {participants.map((participant) => (
            <div
              key={participant.id}
              className="relative flex aspect-video flex-col items-center justify-center gap-2 overflow-hidden rounded-xl border border-white/10 bg-gradient-to-br from-navy-850 to-navy-950"
            >
              {kind === 'video' && cameraOn ? (
                <>
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_25%,rgba(34,211,238,0.14),transparent_55%)]" />
                  <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-navy-950 to-transparent" />
                </>
              ) : null}
              <span className="relative grid h-14 w-14 place-items-center rounded-full bg-navy-800 font-mono text-[15px] font-bold text-slate-200 ring-1 ring-inset ring-white/10">
                {initialsOf(participant.fullName)}
              </span>
              <p className="relative text-[11.5px] font-semibold text-slate-100">{participant.fullName}</p>
              <p className="relative text-[9.5px] uppercase tracking-[0.06em] text-slate-500">{participant.role}</p>
              <span
                className={`absolute left-2.5 top-2.5 inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[8.5px] font-bold uppercase tracking-[0.06em] ${
                  participant.isOnline ? 'bg-emerald-500/15 text-emerald-300' : 'bg-white/6 text-slate-400'
                }`}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${participant.isOnline ? 'bg-emerald-400' : 'bg-slate-500'}`} />
                {participant.isOnline ? 'Available' : 'Away'}
              </span>
            </div>
          ))}
        </div>
      </div>

      <footer className="border-t border-white/10 px-4 py-4 sm:px-6">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-center gap-2.5">
          <button
            type="button"
            onClick={() => setMuted((value) => !value)}
            className={`grid h-11 w-11 place-items-center rounded-full border transition-colors ${
              muted ? 'border-red-400/40 bg-red-500/15 text-red-300' : 'border-white/12 bg-white/6 text-slate-200 hover:bg-white/10'
            }`}
            aria-pressed={muted}
            aria-label={muted ? 'Unmute microphone' : 'Mute microphone'}
          >
            {muted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
          </button>

          <button
            type="button"
            onClick={() => setCameraOn((value) => !value)}
            className={`grid h-11 w-11 place-items-center rounded-full border transition-colors ${
              !cameraOn ? 'border-amber-400/40 bg-amber-500/15 text-amber-300' : 'border-white/12 bg-white/6 text-slate-200 hover:bg-white/10'
            }`}
            aria-pressed={!cameraOn}
            aria-label={cameraOn ? 'Turn camera off' : 'Turn camera on'}
          >
            {cameraOn ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
          </button>

          <button
            type="button"
            className="grid h-11 w-11 place-items-center rounded-full border border-white/12 bg-white/6 text-slate-200 hover:bg-white/10"
            aria-label="Share screen (demonstration)"
          >
            <MonitorUp className="h-4 w-4" />
          </button>

          <button
            type="button"
            className="grid h-11 w-11 place-items-center rounded-full border border-white/12 bg-white/6 text-slate-200 hover:bg-white/10"
            aria-label="Speaker (demonstration)"
          >
            <Volume2 className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={end}
            disabled={ending}
            className="ml-2 inline-flex h-11 items-center gap-2 rounded-full bg-red-500 px-5 text-[11.5px] font-bold uppercase tracking-[0.06em] text-white transition-colors hover:bg-red-400 disabled:opacity-60"
          >
            <PhoneOff className="h-4 w-4" aria-hidden />
            {ending ? 'Endingâ€¦' : 'End call'}
          </button>
        </div>
        <p className="mx-auto mt-2.5 max-w-4xl text-center text-[9.5px] leading-relaxed text-slate-600">
          Demonstration call surface. Real WebRTC media, dialling and recording are enabled once PRASA approves
          the production integration. The call is written to the channel history with its duration.
        </p>
      </footer>
    </div>
  )
}

