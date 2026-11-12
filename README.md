# REGEN × PRASA — Railway Operations & Infrastructure Management System

**Built to last. Designed to heal.**

A centralised operations platform connecting the PRASA Operational Centre, the
REGEN central database, physical railway sensors, departments, maintenance
engineers and field workers on the track.

The first implementation is the **Kempton Park pilot** (`REGEN-EDGE-KP01`); the
data model and navigation are built to extend to further corridors and
departments without redesign.

---

## Contents

1. [Quick start](#quick-start)
2. [Demonstration accounts](#demonstration-accounts)
3. [Connecting Supabase](#connecting-supabase)
4. [The three SQL scripts](#the-three-sql-scripts)
5. [Architecture](#architecture)
6. [Routes and what each one does](#routes-and-what-each-one-does)
7. [How the briefing maps to the build](#how-the-briefing-maps-to-the-build)
8. [The maintenance workflow, stage by stage](#the-maintenance-workflow-stage-by-stage)
9. [Roles and permissions](#roles-and-permissions)
10. [Data honesty rules](#data-honesty-rules)
11. [Scripts](#scripts)
12. [Devices and browsers](#devices-and-browsers)
13. [Extending the pilot](#extending-the-pilot)

---

## Quick start

```bash
npm install
npm run dev          # http://localhost:3000
```

The application runs with **no configuration at all**. When no Supabase
credentials are present it uses the bundled demonstration dataset held in
process memory (`src/lib/seed.ts`), so the whole platform — sign-in, map,
sensor feed, workflow, messaging — is fully operable offline.

```bash
npm run build        # production build
npm start            # serve the production build
npm run typecheck    # tsc --noEmit
```

Node 20+ is required.

---

## Demonstration accounts

Sign-in requires **all three** of: full employee name, PRASA employee/region
reference number, and personal password. This is the demonstration
authentication described in the briefing; it is designed to be replaced by
PRASA identity integration without changing the rest of the platform.

**Shared password for every demonstration account: `Regen@2026`**

| Employee | Reference | Role | Department |
| --- | --- | --- | --- |
| Nicol van Wyk | `PRASA-OPS-0001` | Head of Operations | Train Operations |
| Thandiwe Mokoena | `PRASA-OPS-0107` | Operations Controller | Train Control |
| Sipho Dlamini | `PRASA-INF-2418` | Department Manager | Permanent Way |
| Anele Ngcobo | `PRASA-INF-3376` | Engineer | Track |
| Lindiwe Khumalo | `REGEN-TEC-0042` | REGEN Technical | Signalling |
| Pieter Botha | `PRASA-FLD-5120` | Field Worker | Permanent Way |
| Naledi Mahlangu | `PRASA-ADM-6001` | Administrator | — |
| Johan Steyn | `PRASA-OPS-0142` | Operations Controller | Marshalling Yard |
| Zanele Ndlovu | `PRASA-FLD-5211` | Field Worker | OHTE |
| Musa Radebe | `PRASA-INF-3390` | Engineer | Signalling |

Sign in as different people to see the platform change: a field worker can
raise a defect report and message their team, a department manager can verify
it, REGEN technical can attach sensor evidence, and only the Head of
Operations can authorise the work order.

---

## Connecting Supabase

1. Create a Supabase project.
2. Run the SQL scripts in `supabase/` in order (see below).
3. Copy `.env.example` to `.env.local` and fill in:

```ini
NEXT_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key>
SUPABASE_SERVICE_ROLE_KEY=<service role key>   # server only
AUTH_SECRET=<48 random bytes, hex>
```

4. Restart `npm run dev`.

The data layer (`src/lib/store.ts`) switches automatically: if the URL and a
key are present it reads and writes Supabase; otherwise it uses the in-memory
store. `REGEN_FORCE_DEMO=1` pins the app to the offline dataset even when
credentials exist, which is useful for demonstrations without connectivity.

Every screen states which source is live in its footer note ("Bundled
demonstration dataset" vs "Live Supabase"). There is no silent fallback: if
Supabase is configured but unreachable, the request fails loudly rather than
pretending to be real data.

---

## The three SQL scripts

Run in this exact order in the Supabase SQL editor:

| File | Purpose |
| --- | --- |
| `supabase/migrations/0001_schema.sql` | 18 tables, indexes, the `updated_at` trigger and the `v_open_maintenance` view. |
| `supabase/migrations/0002_rls.sql` | Row level security, identity helpers and the `employee_directory` view. |
| `supabase/migrations/0003_seed.sql` | 267 demonstration rows in foreign-key-safe order. |

`03_seed.sql` is **generated** from the application's own dataset, so the
offline demo and the database can never disagree:

```bash
npm run seed:sql    # writes to supabase/migrations/0003_seed.sql
```

### Why RLS exists here

The portal signs in with its own cookie session and talks to Supabase with the
service-role key, which bypasses row level security. RLS is therefore the
second line of defence for anything that reaches the database directly — the
anon key, Studio, an edge function or a future mobile client. Such a client
must announce who it is for the transaction:

```sql
select set_config('regen.employee_id', 'emp-0002', true);
```

With no employee announced, every policy evaluates to `false` and the client
sees nothing.

Password material never leaves the server: the `employees` table itself is
readable only by the service role, and browser clients read the
`employee_directory` view, which omits `password_salt` and `password_hash`.

---

## Architecture

```
src/
  app/
    page.tsx                     sign-in
    login-form.tsx               client form, demo account picker
    login-actions.ts             server action
    portal/
      layout.tsx                 authenticated shell
      page.tsx                   Operations Centre
      departments/               index + [slug] workspace
      network/                   interactive railway map
      kempton-park/              REGEN-EDGE-KP01 pilot centre
      movements/                 train movement register
      maintenance/               registry + [reference] detail
      connect/                   REGEN Connect messaging and calls
      analytics/                 analytics and predictive maintenance
      admin/                     administration, audit, integration status
      actions.ts                 all portal server actions
    not-found.tsx
  components/
    primitives.tsx               panels, chips, stats, meters, page headings
    shell/PortalShell.tsx        sidebar, top bar, mobile drawer and tab bar
    network/NetworkWorkspace.tsx schematic map + inspector
    sensor/PilotControls.tsx     refresh / inject simulated reading
    movements/MovementRegister.tsx
    maintenance/                 intake form, workflow actions, registry filters
    connect/                     workspace, call overlay
    charts/                      Recharts wrappers
    LiveClock.tsx, Sparkline.tsx
  lib/
    types.ts                     the domain model
    seed.ts                      demonstration dataset (single source of truth)
    store.ts                     Supabase or in-memory data layer + mutations
    auth.ts                      cookie session, HMAC signing, login
    permissions.ts               roles, navigation access, workflow matrix
    insights.ts                  derived metrics, rolling windows, risk model
    tokens.ts, format.ts, nav.ts
supabase/                        schema, RLS, generated seed (in migrations/)
scripts/                         seed exporter, password hasher
```

Two principles hold the design together:

- **Business rules live in `src/lib/permissions.ts`.** The UI hides actions a
  role cannot take, and every server action re-checks the same matrix before
  writing. Hiding a button is convenience; the check is the control.
- **Derived numbers are computed once, in `src/lib/insights.ts`.** KPIs, risk
  scores, rolling windows and department rollups come from one module so the
  dashboard, the map and the analytics page can never disagree.

---

## Routes and what each one does

| Route | Purpose |
| --- | --- |
| `/` | Sign-in with name, PRASA reference and password. |
| `/portal` | Operations Centre: org-wide KPIs, live map preview, alerts, authorisation queue, movement feed. |
| `/portal/departments` | The PRASA structure as a tree — Fixed Infrastructure and Train Operations. |
| `/portal/departments/[slug]` | Department workspace: roster, sections, reports, channels, SLA compliance. |
| `/portal/network` | Interactive schematic map; select a section to see condition, sensors, recent passages, maintenance history. |
| `/portal/kempton-park` | The pilot: device identity, channels, vibration/temperature trends, passages, data-integrity banner. |
| `/portal/movements` | Historical train movement register, filters and manual logging. |
| `/portal/maintenance` | Defect intake, authorisation queue, stage pipeline, filterable registry. |
| `/portal/maintenance/[reference]` | One report: stage tracker, evidence, work order, approval history, role-gated actions. |
| `/portal/connect` | REGEN Connect: channel list, conversation, members, calls, attachments, location sharing. |
| `/portal/analytics` | Predictive maintenance, condition mix, peak vibration, department performance, environment. |
| `/portal/admin` | Record counts, employee directory, audit trail, integration status, sensor and department registers. |

### Colour language

Green = normal · Amber = warning · Red = critical · Grey = offline. The same
tokens drive segment status, alert severity, workflow stage and map colouring,
so a red section on the map means the same thing as a red chip in the
registry.

---

## How the briefing maps to the build

| § | Briefing requirement | Where it lives |
| --- | --- | --- |
| 2 | Name + PRASA reference + password sign-in | `/`, `lib/auth.ts` (scrypt hashes, HMAC cookie session, 8-hour shift) |
| 3 | Operations Centre mirrors the PRASA structure | `/portal/departments` tree with all 17 departments nested exactly as briefed |
| 3 | Each department has its own workspace | `/portal/departments/[slug]` |
| 4 | Kempton Park pilot | `/portal/kempton-park` — `REGEN-EDGE-KP01`, the three channels, capability flags, integrity banner |
| 4 | Real data distinguished from simulated | `isSimulated` on every reading, movement and message; `LiveBadge` and `DataSourceNote` everywhere |
| 5 | Interactive railway map | `/portal/network` — sections, direction, train tokens, sensor markers, condition colouring, section inspector |
| 6 | Train movement monitoring | Automatic sensor events plus manual logging on `/portal/movements`; Operations Centre notification |
| 7 | REGEN Connect | `/portal/connect` — individual, department and team channels, audio/video call UI, attachments, location sharing, availability |
| 8 | Maintenance reporting and approval | `/portal/maintenance` and the eight-stage workflow |
| 9 | Central database | `supabase/01_schema.sql` — 18 tables covering every category in the briefing |
| 10 | Next.js, TypeScript, Tailwind, Supabase, Recharts | `package.json`; realtime publication configured in `02_rls.sql` |

---

## The maintenance workflow, stage by stage

```
reported            field worker (or controller) submits the defect
   │
verified            department manager confirms it is real and theirs
   │
assessed            REGEN technical attaches sensor evidence + recommendation
   │
awaiting-authorisation   queued for Mr Nicol, Head of Operations
   │
authorised          Head of Operations signs it off
   │
in-progress         work order issued: assignee, due date, instructions
   │
completed           engineer submits completion evidence
   │
closed              outcome recorded in REGEN
```

Any stage may be rejected with a mandatory comment; rejection is recorded in
the audit trail with the actor and reason.

Every report carries a reference (`MR-2026-0142`), location and section,
department, defect description, severity, photographs, timestamps and the full
approval history. Field length and ownership rules are enforced in
`store.ts` — for example a work order cannot be issued without an assignee and
a due date, and completion evidence must be substantive.

---

## Roles and permissions

| Role | Sees | Can do |
| --- | --- | --- |
| Head of Operations | Everything | Authorise maintenance, log movements, read the audit trail |
| Operations Controller | Network and operations | Log and review movements, acknowledge alerts |
| Department Manager | Own department | Verify reports, issue and close work orders |
| REGEN Technical | Sensors and workflow | Assess reports, attach evidence, recommend action |
| Engineer | Assigned work | Complete work orders with evidence |
| Field Worker | Own department | Raise defect reports, message teams, share location |
| Administrator | Everything | Maintain reference data and accounts |

Permissions are declared once in `NAV_ACCESS`, `can.*` and the per-stage
`ACTIONS` matrix in `src/lib/permissions.ts`.

---

## Data honesty rules

The brief is explicit that real sensor data must be distinguishable from
simulated data, and that is enforced visually and in the model:

- Every telemetry reading, train movement and message carries `isSimulated`.
- `LiveBadge` renders "Device" (emerald) or "Simulated" (amber) on any value
  whose provenance matters.
- The pilot page opens with an amber integrity banner explaining the
  difference and stating that coverage is still to be verified.
- The map draws simulated sensor markers differently from the real device.
- The calls overlay says "Simulated · no media captured" — no audio or video
  leaves the browser.
- Every page footer states whether it is reading Supabase or the bundled
  dataset.

---

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Development server. |
| `npm run build` / `npm start` | Production build and serve. |
| `npm run typecheck` | TypeScript, no emit. |
| `npm run seed:sql` | Regenerate `supabase/03_seed.sql` from `src/lib/seed.ts`. |
| `npm run hash -- "<password>" <REF>` | Issue a scrypt salt/hash pair for a new account (`--sql` prints the UPDATE). |

---

## Devices and browsers

The platform is responsive from 320 px phones to wide control-room displays:

- Desktop: 248 px sidebar, multi-column dashboards, full data tables.
- Tablet: collapsed navigation, two-column grids.
- Mobile: drawer navigation plus a bottom tab bar; tables become card lists;
  the map and inspector stack; Connect becomes a single column with a back
  button.

Cross-browser notes: layout uses CSS Grid and Flexbox with no container-query
dependency; charts are plain SVG (Recharts) with animation disabled so no
motion or hydration mismatch occurs; the map uses SVG and `requestAnimationFrame`
with `prefers-reduced-motion` honoured; all interactive controls are real
buttons, inputs and links with visible focus states, and filtering is driven by
URL parameters so it works without client JavaScript.

---

## Extending the pilot

1. Add the section to `segments` (and any new nodes) in `src/lib/seed.ts`.
2. Add the sensor to `sensors` with its channel list.
3. Regenerate the seed SQL: `npm run seed:sql`.
4. Point the MQTT bridge at the ingest endpoint, writing into
   `telemetry_readings`, `train_movements` and `alerts` with the service role.
   Readings carry `is_simulated = false` only for real hardware.

The Kempton Park page, the map, the movement register and the analytics are
all driven by these tables, so a new sensor appears everywhere without further
code.
