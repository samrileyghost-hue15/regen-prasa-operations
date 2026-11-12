import {
  BarChart3,
  Building2,
  LayoutDashboard,
  MessagesSquare,
  Radio,
  Settings2,
  TrainFront,
  Waypoints,
  Wrench,
  type LucideIcon,
} from 'lucide-react'

import type { NavKey } from '@/lib/permissions'

export type NavItem = {
  key: NavKey
  href: string
  label: string
  short: string
  icon: LucideIcon
  group: 'Operations' | 'Response' | 'Intelligence'
  /** Pinned to the mobile bottom bar. */
  mobile?: boolean
}

export const NAV_ITEMS: NavItem[] = [
  {
    key: 'overview',
    href: '/portal',
    label: 'Operations Centre',
    short: 'Overview',
    icon: LayoutDashboard,
    group: 'Operations',
    mobile: true,
  },
  {
    key: 'departments',
    href: '/portal/departments',
    label: 'Departments',
    short: 'Depts',
    icon: Building2,
    group: 'Operations',
  },
  {
    key: 'network',
    href: '/portal/network',
    label: 'Railway network',
    short: 'Network',
    icon: Waypoints,
    group: 'Operations',
    mobile: true,
  },
  {
    key: 'kempton-park',
    href: '/portal/kempton-park',
    label: 'Kempton Park pilot',
    short: 'KP-01',
    icon: Radio,
    group: 'Operations',
  },
  {
    key: 'movements',
    href: '/portal/movements',
    label: 'Train movements',
    short: 'Trains',
    icon: TrainFront,
    group: 'Operations',
  },
  {
    key: 'maintenance',
    href: '/portal/maintenance',
    label: 'Maintenance',
    short: 'Works',
    icon: Wrench,
    group: 'Response',
    mobile: true,
  },
  {
    key: 'connect',
    href: '/portal/connect',
    label: 'REGEN Connect',
    short: 'Connect',
    icon: MessagesSquare,
    group: 'Response',
    mobile: true,
  },
  {
    key: 'analytics',
    href: '/portal/analytics',
    label: 'Analytics',
    short: 'Analytics',
    icon: BarChart3,
    group: 'Intelligence',
  },
  {
    key: 'admin',
    href: '/portal/admin',
    label: 'Administration',
    short: 'Admin',
    icon: Settings2,
    group: 'Intelligence',
  },
]

export const NAV_GROUPS: NavItem['group'][] = ['Operations', 'Response', 'Intelligence']

export function activeNavKey(pathname: string): NavKey {
  if (pathname === '/portal') return 'overview'
  const match = NAV_ITEMS.filter((item) => item.href !== '/portal').find((item) =>
    pathname.startsWith(item.href),
  )
  return match?.key ?? 'overview'
}
