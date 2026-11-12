'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState, useTransition } from 'react'
import {
  Bell,
  CheckCheck,
  ChevronDown,
  LogOut,
  Menu,
  MoreHorizontal,
  Search,
  X,
} from 'lucide-react'

import { RegenLogo } from '@/components/brand/RegenLogo'
import { DataSourceNote } from '@/components/ui/primitives'
import { signOutAction } from '@/app/portal/actions'
import { formatShort, initialsOf } from '@/lib/format'
import { canAccess, ROLE_SHORT, type NavKey } from '@/lib/permissions'
import { severityTone } from '@/lib/tokens'
import type { DataSource, Notification } from '@/lib/types'

import { markNotificationsReadAction } from '@/app/portal/actions'
import { NAV_GROUPS, NAV_ITEMS, activeNavKey, type NavItem } from './nav'

type ShellUser = {
  id: string
  fullName: string
  employeeRef: string
  role: keyof typeof ROLE_SHORT
  departmentSlug: string | null
}

export function PortalShell({
  user,
  notifications,
  dataSource,
  maintenanceBadge,
  children,
}: {
  user: ShellUser
  notifications: Notification[]
  dataSource: DataSource
  maintenanceBadge?: number
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const active = activeNavKey(pathname)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [bellOpen, setBellOpen] = useState(false)
  const [userOpen, setUserOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const bellRef = useRef<HTMLDivElement>(null)
  const userRef = useRef<HTMLDivElement>(null)

  const allowed = NAV_ITEMS.filter((item) => canAccess(item.key, user.role))
  const unread = notifications.filter((item) => !item.readAt).length
  const mobileItems = allowed.filter((item) => item.mobile).slice(0, 4)

  useEffect(() => {
    setDrawerOpen(false)
    setBellOpen(false)
    setUserOpen(false)
    setSearchOpen(false)
  }, [pathname])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setDrawerOpen(false)
        setBellOpen(false)
        setUserOpen(false)
        setSearchOpen(false)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const target = event.target as Node
      if (bellRef.current && !bellRef.current.contains(target)) setBellOpen(false)
      if (userRef.current && !userRef.current.contains(target)) setUserOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  const currentSection = allowed.find((item) => item.key === active)

  return (
    <div className="min-h-screen bg-navy-950">
      {/* â”€â”€ Desktop sidebar â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[248px] flex-col border-r border-white/8 bg-navy-925 lg:flex">
        <div className="flex h-16 items-center gap-2.5 border-b border-white/8 px-4">
          <RegenLogo size="sm" />
        </div>

        <nav className="flex-1 overflow-y-auto px-2.5 py-4">
          {NAV_GROUPS.map((group) => {
            const items = allowed.filter((item) => item.group === group)
            if (!items.length) return null
            return (
              <div key={group} className="mb-5">
                <p className="px-2 pb-1.5 text-[9.5px] font-bold uppercase tracking-[0.16em] text-slate-600">
                  {group}
                </p>
                <div className="space-y-0.5">
                  {items.map((item) => (
                    <SidebarLink
                      key={item.key}
                      item={item}
                      active={item.key === active}
                      badge={item.key === 'maintenance' ? maintenanceBadge : undefined}
                    />
                  ))}
                </div>
              </div>
            )
          })}
        </nav>

        <div className="border-t border-white/8 p-2.5">
          <div className="flex items-center gap-2.5 rounded-lg px-2 py-2">
            <span className="relative grid h-8 w-8 flex-none place-items-center rounded-full bg-green-500/15 text-[10px] font-bold text-green-300 ring-1 ring-green-400/30">
              {initialsOf(user.fullName)}
              <i className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-navy-925 bg-green-400" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[11.5px] font-semibold text-slate-100">{user.fullName}</p>
              <p className="truncate text-[9.5px] uppercase tracking-[0.08em] text-slate-500">
                {ROLE_SHORT[user.role]}
              </p>
            </div>
          </div>
          <form action={signOutAction}>
            <button
              type="submit"
              className="mt-1 flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-[11px] font-semibold text-slate-500 transition-colors hover:bg-white/5 hover:text-slate-200"
            >
              <LogOut className="h-3.5 w-3.5" aria-hidden />
              Secure sign out
            </button>
          </form>
        </div>
      </aside>

      {/* â”€â”€ Mobile drawer â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            className="absolute inset-0 bg-navy-950/80 backdrop-blur-sm"
            onClick={() => setDrawerOpen(false)}
            aria-label="Close navigation"
          />
          <div className="relative flex h-full w-[286px] max-w-[86vw] flex-col border-r border-white/10 bg-navy-925 shadow-2xl">
            <div className="flex h-14 items-center justify-between border-b border-white/8 px-4">
              <RegenLogo size="sm" />
              <button
                onClick={() => setDrawerOpen(false)}
                className="grid h-8 w-8 place-items-center rounded-md text-slate-400 hover:bg-white/5"
                aria-label="Close navigation"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto px-2.5 py-4">
              {NAV_GROUPS.map((group) => {
                const items = allowed.filter((item) => item.group === group)
                if (!items.length) return null
                return (
                  <div key={group} className="mb-4">
                    <p className="px-2 pb-1.5 text-[9.5px] font-bold uppercase tracking-[0.16em] text-slate-600">
                      {group}
                    </p>
                    <div className="space-y-0.5">
                      {items.map((item) => (
                        <SidebarLink key={item.key} item={item} active={item.key === active} />
                      ))}
                    </div>
                  </div>
                )
              })}
            </nav>
            <div className="border-t border-white/8 p-3">
              <div className="flex items-center gap-2.5">
                <span className="grid h-8 w-8 place-items-center rounded-full bg-green-500/15 text-[10px] font-bold text-green-300 ring-1 ring-green-400/30">
                  {initialsOf(user.fullName)}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-[11.5px] font-semibold text-slate-100">{user.fullName}</p>
                  <p className="truncate font-mono text-[9.5px] text-slate-500">{user.employeeRef}</p>
                </div>
              </div>
              <form action={signOutAction}>
                <button type="submit" className="btn btn-ghost mt-3 w-full">
                  <LogOut className="h-3.5 w-3.5" aria-hidden />
                  Secure sign out
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* â”€â”€ Content column â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div className="flex min-h-screen flex-col lg:pl-[248px]">
        <header className="sticky top-0 z-30 border-b border-white/8 bg-navy-950/90 backdrop-blur-md">
          <div className="flex h-14 items-center gap-2 px-3 sm:px-5 lg:h-16">
            <button
              onClick={() => setDrawerOpen(true)}
              className="grid h-9 w-9 flex-none place-items-center rounded-md border border-white/10 text-slate-300 lg:hidden"
              aria-label="Open navigation"
            >
              <Menu className="h-4 w-4" />
            </button>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="truncate text-[12px] font-semibold text-slate-200">
                  {currentSection?.label ?? 'Operations Centre'}
                </span>
              </div>
            </div>

            <DataSourceNote source={dataSource} className="hidden md:inline-flex" />

            {searchOpen ? (
              <div className="flex items-center gap-1 rounded-md border border-white/10 bg-navy-925 px-2">
                <Search className="h-3.5 w-3.5 text-slate-500" aria-hidden />
                <input
                  autoFocus
                  placeholder="Search trains, sections, reportsâ€¦"
                  className="h-8 w-[150px] bg-transparent text-[11px] outline-none placeholder:text-slate-500 sm:w-[220px]"
                  onBlur={() => setSearchOpen(false)}
                />
              </div>
            ) : (
              <button
                onClick={() => setSearchOpen(true)}
                className="grid h-9 w-9 place-items-center rounded-md text-slate-400 hover:bg-white/5 hover:text-slate-200"
                aria-label="Search"
              >
                <Search className="h-4 w-4" />
              </button>
            )}

            {/* Notifications */}
            <div className="relative" ref={bellRef}>
              <button
                onClick={() => {
                  setBellOpen((current) => !current)
                  setUserOpen(false)
                }}
                className="relative grid h-9 w-9 place-items-center rounded-md text-slate-400 hover:bg-white/5 hover:text-slate-200"
                aria-label={`Notifications${unread ? `, ${unread} unread` : ''}`}
                aria-expanded={bellOpen}
              >
                <Bell className="h-4 w-4" />
                {unread > 0 && (
                  <span className="absolute right-1.5 top-1.5 grid h-3.5 min-w-3.5 place-items-center rounded-full bg-red-500 px-1 text-[8px] font-bold text-white">
                    {unread}
                  </span>
                )}
              </button>

              {bellOpen && (
                <div className="absolute right-0 top-11 z-50 w-[320px] max-w-[calc(100vw-24px)] overflow-hidden rounded-xl border border-white/10 bg-navy-900 shadow-2xl">
                  <div className="flex items-center justify-between border-b border-white/8 px-3 py-2.5">
                    <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-slate-300">
                      Notifications
                    </p>
                    <button
                      onClick={() => startTransition(() => void markNotificationsReadAction())}
                      disabled={isPending || unread === 0}
                      className="flex items-center gap-1 text-[10px] font-semibold text-green-400 disabled:opacity-40"
                    >
                      <CheckCheck className="h-3 w-3" />
                      Mark read
                    </button>
                  </div>
                  <div className="max-h-[320px] overflow-y-auto">
                    {notifications.length === 0 && (
                      <p className="px-3 py-6 text-center text-[11px] text-slate-500">
                        No operational notifications.
                      </p>
                    )}
                    {notifications.slice(0, 8).map((item) => (
                      <Link
                        key={item.id}
                        href={item.href}
                        onClick={() => setBellOpen(false)}
                        className="block border-b border-white/5 px-3 py-2.5 transition-colors last:border-0 hover:bg-white/4"
                      >
                        <div className="flex items-start gap-2">
                          <span
                            className={`mt-1 inline-flex rounded px-1 py-0.5 text-[8px] font-bold uppercase ring-1 ring-inset ${severityTone(item.severity)}`}
                          >
                            {item.severity}
                          </span>
                          <div className="min-w-0">
                            <p className="truncate text-[11.5px] font-semibold text-slate-200">
                              {item.title}
                            </p>
                            <p className="mt-0.5 line-clamp-2 text-[10.5px] leading-snug text-slate-500">
                              {item.body}
                            </p>
                            <p className="mt-1 font-mono text-[9.5px] text-slate-600">
                              {formatShort(item.createdAt)}
                            </p>
                          </div>
                          {!item.readAt && <span className="ml-auto mt-1 h-1.5 w-1.5 rounded-full bg-green-400" />}
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* User menu */}
            <div className="relative" ref={userRef}>
              <button
                onClick={() => {
                  setUserOpen((current) => !current)
                  setBellOpen(false)
                }}
                className="flex items-center gap-1.5 rounded-md py-1 pl-1 pr-1.5 hover:bg-white/5"
                aria-expanded={userOpen}
                aria-label="Account menu"
              >
                <span className="grid h-7 w-7 place-items-center rounded-full bg-green-500/15 text-[10px] font-bold text-green-300 ring-1 ring-green-400/30">
                  {initialsOf(user.fullName)}
                </span>
                <ChevronDown className="hidden h-3 w-3 text-slate-500 sm:block" />
              </button>

              {userOpen && (
                <div className="absolute right-0 top-11 z-50 w-[248px] overflow-hidden rounded-xl border border-white/10 bg-navy-900 shadow-2xl">
                  <div className="border-b border-white/8 px-3.5 py-3">
                    <p className="text-[12px] font-semibold text-slate-100">{user.fullName}</p>
                    <p className="mt-0.5 text-[10.5px] text-green-400">{ROLE_SHORT[user.role]}</p>
                    <p className="mt-1 font-mono text-[10px] text-slate-500">{user.employeeRef}</p>
                  </div>
                  <form action={signOutAction} className="p-1.5">
                    <button
                      type="submit"
                      className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-[11.5px] font-semibold text-slate-300 hover:bg-white/5"
                    >
                      <LogOut className="h-3.5 w-3.5" aria-hidden />
                      Sign out
                    </button>
                  </form>
                </div>
              )}
            </div>
          </div>
        </header>

        <main id="main-content" className="flex-1 px-3 pb-24 pt-4 sm:px-5 sm:pb-8 sm:pt-5 lg:px-7 lg:pb-10">
          <div className="mx-auto w-full max-w-[1560px] space-y-4 sm:space-y-5">{children}</div>
        </main>

        {/* â”€â”€ Mobile bottom navigation â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <nav
          className="fixed inset-x-0 bottom-0 z-30 border-t border-white/10 bg-navy-925/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md lg:hidden"
          aria-label="Primary"
        >
          <div className="flex items-stretch justify-around">
            {mobileItems.map((item) => {
              const Icon = item.icon
              const isActive = item.key === active
              return (
                <Link
                  key={item.key}
                  href={item.href}
                  className={`flex flex-1 flex-col items-center gap-1 py-2 text-[9.5px] font-semibold transition-colors ${
                    isActive ? 'text-green-400' : 'text-slate-500'
                  }`}
                >
                  <Icon className="h-[18px] w-[18px]" aria-hidden />
                  {item.short}
                  <span
                    className={`h-0.5 w-6 rounded-full ${isActive ? 'bg-green-400' : 'bg-transparent'}`}
                  />
                </Link>
              )
            })}
            <button
              onClick={() => setDrawerOpen(true)}
              className="flex flex-1 flex-col items-center gap-1 py-2 text-[9.5px] font-semibold text-slate-500"
            >
              <MoreHorizontal className="h-[18px] w-[18px]" aria-hidden />
              More
              <span className="h-0.5 w-6 rounded-full bg-transparent" />
            </button>
          </div>
        </nav>
      </div>
    </div>
  )
}

function SidebarLink({ item, active, badge }: { item: NavItem; active: boolean; badge?: number }) {
  const Icon = item.icon
  return (
    <Link
      href={item.href}
      aria-current={active ? 'page' : undefined}
      className={`group relative flex items-center gap-2.5 rounded-md px-2.5 py-2 text-[12px] font-medium transition-colors ${
        active
          ? 'bg-green-500/12 text-green-100 ring-1 ring-inset ring-green-400/20'
          : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
      }`}
    >
      {active && (
        <span className="absolute inset-y-1.5 -left-2.5 w-0.5 rounded-full bg-green-400" aria-hidden />
      )}
      <Icon
        className={`h-4 w-4 flex-none ${active ? 'text-green-400' : 'text-slate-500 group-hover:text-slate-300'}`}
        aria-hidden
      />
      <span className="truncate">{item.label}</span>
      {badge ? (
        <span className="ml-auto rounded-full bg-red-500/20 px-1.5 text-[9px] font-bold text-red-300">
          {badge}
        </span>
      ) : null}
    </Link>
  )
}

export type { ShellUser }


