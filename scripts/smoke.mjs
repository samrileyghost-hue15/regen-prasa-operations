/**
 * Route smoke test — signs in with a synthetic session cookie and checks that
 * every portal route renders. Run against a live server:
 *
 *   node scripts/smoke.mjs http://127.0.0.1:3123
 */

import { createHmac } from 'node:crypto'

const base = process.argv[2] ?? 'http://127.0.0.1:3123'
const secret = process.env.AUTH_SECRET?.trim() || 'regen-development-signing-secret'

function sessionFor(employeeId) {
  const payload = Buffer.from(
    JSON.stringify({ sub: employeeId, exp: Date.now() + 3_600_000 }),
    'utf8',
  ).toString('base64url')
  const signature = createHmac('sha256', secret).update(payload).digest('base64url')
  return `regen.session=${payload}.${signature}`
}

const CASES = [
  ['signed out', '/', null, [200]],
  ['signed out → portal', '/portal', null, [307]],
  ['operations centre', '/portal', 'emp-0001', [200], ['Operational Centre']],
  ['network', '/portal/network', 'emp-0001', [200], ['Railway network']],
  ['network + section', '/portal/network?section=seg-kp01', 'emp-0001', [200], ['KP-01']],
  ['departments', '/portal/departments', 'emp-0001', [200], ['Fixed Infrastructure', 'Train Operations']],
  ['department detail', '/portal/departments/permanent-way', 'emp-0001', [200], ['Permanent Way']],
  ['kempton park', '/portal/kempton-park', 'emp-0001', [200], ['REGEN-EDGE-KP01', 'REGEN_KP01_TELEMETRY', 'REGEN_KP01_SIGNAL_BUS', 'REGEN_KP01_EVENTS']],
  ['movements', '/portal/movements', 'emp-0001', [200], ['TM-0024-118']],
  ['maintenance', '/portal/maintenance', 'emp-0001', [200], ['MR-2026']],
  ['maintenance detail', '/portal/maintenance/MR-2026-0142', 'emp-0001', [200], ['MR-2026-0142', 'awaiting-authorisation']],
  ['connect', '/portal/connect', 'emp-0001', [200], ['REGEN Connect']],
  ['connect + channel', '/portal/connect?channel=kempton-park-response', 'emp-0001', [200], ['Kempton Park Response']],
  ['analytics', '/portal/analytics', 'emp-0001', [200], ['Predictive maintenance']],
  ['admin', '/portal/admin', 'emp-0001', [200], ['Audit']],
  ['field worker sees registry', '/portal/maintenance', 'emp-0006', [200]],
  ['field worker blocked from admin', '/portal/admin', 'emp-0006', [307]],
  ['not found', '/portal/does-not-exist', 'emp-0001', [404]],
]

let failures = 0

for (const [label, path, employee, expected, needles] of CASES) {
  const headers = employee ? { cookie: sessionFor(employee) } : {}
  const response = await fetch(base + path, { headers, redirect: 'manual' })
  const body = await response.text()
  const problems = []

  if (!expected.includes(response.status)) {
    problems.push(`status ${response.status}, expected ${expected.join('/')}`)
  }
  for (const needle of needles ?? []) {
    if (!body.includes(needle)) problems.push(`missing "${needle}"`)
  }

  if (problems.length) {
    failures += 1
    console.log(`FAIL  ${label.padEnd(32)} ${path}`)
    for (const problem of problems) console.log(`        ${problem}`)
  } else {
    console.log(`ok    ${label.padEnd(32)} ${response.status}  ${path}`)
  }
}

console.log('')
console.log(failures === 0 ? 'All routes passed.' : `${failures} route check(s) failed.`)
process.exitCode = failures === 0 ? 0 : 1
