import { createHmac, timingSafeEqual } from 'node:crypto'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

import { findEmployeeByRef, findEmployeeById, verifyPassword } from './store'
import type { Employee } from './types'

const COOKIE_NAME = 'regen.session'
const SESSION_SECONDS = 60 * 60 * 8 // 8-hour operational shift

function signingSecret(): string {
  return process.env.AUTH_SECRET?.trim() || 'regen-development-signing-secret'
}

function sign(payload: string): string {
  return createHmac('sha256', signingSecret()).update(payload).digest('base64url')
}

function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a)
  const right = Buffer.from(b)
  if (left.length !== right.length) return false
  return timingSafeEqual(left, right)
}

/* ─────────────────────────── Session cookie ─────────────────────────── */

export async function startSession(employeeId: string): Promise<void> {
  const payload = Buffer.from(
    JSON.stringify({ sub: employeeId, exp: Date.now() + SESSION_SECONDS * 1000 }),
    'utf8',
  ).toString('base64url')
  const token = `${payload}.${sign(payload)}`

  const jar = await cookies()
  jar.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_SECONDS,
    secure: process.env.NODE_ENV === 'production',
  })
}

export async function endSession(): Promise<void> {
  const jar = await cookies()
  jar.delete(COOKIE_NAME)
}

/* ───────────────────────────── Resolution ───────────────────────────── */

export async function currentUser(): Promise<Employee | null> {
  try {
    const jar = await cookies()
    const token = jar.get(COOKIE_NAME)?.value
    if (!token) return null

    const [payload, signature] = token.split('.')
    if (!payload || !signature) return null
    if (!safeEqual(signature, sign(payload))) return null

    const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as {
      sub?: string
      exp?: number
    }
    if (!decoded.sub || !decoded.exp || decoded.exp < Date.now()) return null

    return await findEmployeeById(decoded.sub)
  } catch {
    return null
  }
}

/** Server-component guard: sends unauthenticated visitors back to the sign-in page. */
export async function requireUser(): Promise<Employee> {
  const user = await currentUser()
  if (!user) redirect('/')
  return user
}

/* ─────────────────────────────── Login ─────────────────────────────── */

export type LoginResult = { ok: true; employee: Employee } | { ok: false; error: string }

export async function attemptLogin(
  fullName: string,
  employeeRef: string,
  password: string,
): Promise<LoginResult> {
  const name = fullName.trim()
  const ref = employeeRef.trim()

  if (name.length < 3) return { ok: false, error: 'Enter your full employee name as it appears on your PRASA record.' }
  if (ref.length < 5) return { ok: false, error: 'Enter your PRASA employee or region reference number.' }
  if (password.length < 8) return { ok: false, error: 'Your password must be at least 8 characters.' }

  const employee = await findEmployeeByRef(ref)
  if (!employee) {
    return { ok: false, error: 'This PRASA reference is not registered for REGEN access.' }
  }

  const nameMatches = employee.fullName.trim().toLocaleLowerCase('en-ZA') === name.toLocaleLowerCase('en-ZA')
  if (!nameMatches) {
    return { ok: false, error: 'The employee name does not match this PRASA reference.' }
  }

  if (!verifyPassword(password, employee.passwordSalt, employee.passwordHash)) {
    return { ok: false, error: 'The password is incorrect. Check your credentials and try again.' }
  }

  await startSession(employee.id)
  return { ok: true, employee }
}
