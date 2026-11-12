'use server'

import { redirect } from 'next/navigation'

import { attemptLogin } from '@/lib/auth'

export type LoginState = { error?: string }

/**
 * Sign-in is validated on the server: name, PRASA reference and password are
 * all required, and the password is checked against a scrypt hash. Until PRASA
 * approves production authentication integration these are demonstration
 * accounts held in the employees table.
 */
export async function signInAction(_previous: LoginState, formData: FormData): Promise<LoginState> {
  const fullName = String(formData.get('fullName') ?? '')
  const employeeRef = String(formData.get('employeeRef') ?? '')
  const password = String(formData.get('password') ?? '')

  const result = await attemptLogin(fullName, employeeRef, password)
  if (!result.ok) return { error: result.error }

  redirect('/portal')
}
