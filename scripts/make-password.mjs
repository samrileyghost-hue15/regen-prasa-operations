#!/usr/bin/env node
/**
 * Issues a scrypt salt + hash pair for a REGEN account, using exactly the
 * parameters the portal verifies with (see verifyPassword in src/lib/store.ts):
 * a 16-byte hex salt and a 64-byte derived key.
 *
 *   node scripts/make-password.mjs "N3w-Passw0rd" PRASA-OPS-0199
 *
 * With an employee reference the script prints a ready-to-run UPDATE for the
 * Supabase `employees` table; without one it simply prints the pair.
 *
 *   node scripts/make-password.mjs "N3w-Passw0rd" PRASA-OPS-0199 --sql
 */

import { randomBytes, scryptSync } from 'node:crypto'

const [, , password, employeeRef, ...flags] = process.argv

if (!password) {
  console.error('Usage: node scripts/make-password.mjs "<password>" [employeeRef] [--sql]')
  process.exitCode = 1
} else if (password.length < 8) {
  console.error('The portal rejects passwords shorter than 8 characters.')
  process.exitCode = 1
} else {
  const salt = randomBytes(16).toString('hex')
  const hash = scryptSync(password, salt, 64).toString('hex')
  const wantsSql = flags.includes('--sql')

  console.log('')
  console.log(`  password_salt   ${salt}`)
  console.log(`  password_hash   ${hash}`)
  console.log('')

  if (employeeRef) {
    if (wantsSql) {
      console.log('  -- run in the Supabase SQL editor')
      console.log(`  update public.employees`)
      console.log(`     set password_salt = '${salt}',`)
      console.log(`         password_hash = '${hash}'`)
      console.log(`   where employee_ref = '${employeeRef}';`)
    } else {
      console.log(`  Employee ${employeeRef} signs in with this password immediately after`)
      console.log('  the row below is written. Re-run with --sql for the statement.')
    }
  } else {
    console.log('  Insert these into the employees row alongside')
    console.log('  password_salt / password_hash in supabase/03_seed.sql.')
  }
  console.log('')
}
