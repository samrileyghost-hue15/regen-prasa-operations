-- ═══════════════════════════════════════════════════════════════════════
-- REGEN × PRASA — 02_rls.sql · row level security
--
-- Run order:  01_schema.sql → 02_rls.sql → 03_seed.sql
--
-- How identity reaches Postgres
-- ─────────────────────────────
-- The portal authenticates with its own cookie session and talks to
-- Supabase using the service-role key, which bypasses RLS. RLS therefore
-- exists as the second line of defence: it protects anything that reaches
-- the database directly (the anon key, Supabase Studio, an edge function,
-- a future mobile client, or a leaked publishable key).
--
-- Those clients must announce the signed-in employee for the transaction:
--
--   select set_config('regen.employee_id', 'emp-0002', true);
--
-- Every helper below reads that setting. When it is absent every policy
-- evaluates to false, so an unattributed connection sees nothing.
--
-- Role matrix (mirrors src/lib/permissions.ts)
--   operations-head         · read everything, authorise maintenance
--   operations-controller   · read network, log train movements
--   department-manager      · read + verify reports for own department
--   regen-technical         · read sensors, assess + recommend
--   engineer                · read + complete assigned work orders
--   field-worker            · read own department, raise defect reports
--   administrator           · read all, maintain reference data
-- ═══════════════════════════════════════════════════════════════════════

-- ───────────────────────────── Identity helpers ───────────────────────

create or replace function public.regen_employee_id()
returns text
language sql
stable
as $$
  select nullif(current_setting('regen.employee_id', true), '');
$$;

create or replace function public.regen_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select e.role from public.employees e where e.id = public.regen_employee_id();
$$;

create or replace function public.regen_department_slug()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select e.department_slug from public.employees e where e.id = public.regen_employee_id();
$$;

/** True when the transaction has been attributed to a known employee. */
create or replace function public.regen_signed_in()
returns boolean
language sql
stable
as $$
  select public.regen_role() is not null;
$$;

/** Operations head and administrator see across every department. */
create or replace function public.regen_is_oversight()
returns boolean
language sql
stable
as $$
  select coalesce(public.regen_role() in ('operations-head', 'administrator'), false);
$$;

/** Department managers and oversight may act on a given department's work. */
create or replace function public.regen_can_manage_department(slug text)
returns boolean
language sql
stable
as $$
  select case
    when public.regen_is_oversight() then true
    when public.regen_role() = 'department-manager' then public.regen_department_slug() = slug
    else false
  end;
$$;

/** Channel membership, resolved through a definer function to avoid recursion. */
create or replace function public.regen_is_channel_member(channel text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.channels c
    where c.slug = channel
      and (
        public.regen_employee_id() = any (c.member_ids)
        or public.regen_is_oversight()
      )
  );
$$;

comment on function public.regen_employee_id() is
  'Employee announced for this transaction via set_config(''regen.employee_id'', …).';

-- ─────────────────────── Directory without credentials ────────────────
-- The employees table holds scrypt salts and hashes. Nobody but the
-- service role may read it directly; the portal and any browser client
-- read this definer-owned view instead.

create or replace view public.employee_directory as
select
  e.id,
  e.full_name,
  e.employee_ref,
  e.role,
  e.department_slug,
  e.region,
  e.email,
  e.phone,
  e.is_online,
  e.last_seen
from public.employees e;

comment on view public.employee_directory is
  'Employee records without password salt/hash. Safe for browser clients.';

revoke all on public.employee_directory from public;
grant select on public.employee_directory to anon, authenticated;

-- ─────────────────────────── Enable RLS everywhere ────────────────────

alter table public.departments            enable row level security;
alter table public.employees              enable row level security;
alter table public.rail_nodes             enable row level security;
alter table public.rail_segments          enable row level security;
alter table public.sensor_devices         enable row level security;
alter table public.telemetry_readings     enable row level security;
alter table public.train_movements        enable row level security;
alter table public.train_runs             enable row level security;
alter table public.condition_assessments  enable row level security;
alter table public.alerts                 enable row level security;
alter table public.maintenance_reports    enable row level security;
alter table public.approvals              enable row level security;
alter table public.channels               enable row level security;
alter table public.messages               enable row level security;
alter table public.calls                  enable row level security;
alter table public.notifications          enable row level security;
alter table public.audit_entries          enable row level security;
alter table public.environmental_readings enable row level security;

-- Employees: no direct access for anything except the service role.
drop policy if exists employees_service_only on public.employees;
create policy employees_service_only on public.employees
  for select to anon, authenticated
  using (false);

-- ──────────────────────── Shared reference & network ──────────────────
-- Every signed-in employee may read the organisation, the railway asset
-- register and live operational data. The briefing requires that all
-- departments work from one picture of the network.

drop policy if exists departments_read on public.departments;
create policy departments_read on public.departments
  for select to anon, authenticated
  using (public.regen_signed_in());

drop policy if exists departments_write on public.departments;
create policy departments_write on public.departments
  for all to authenticated
  using (public.regen_role() = 'administrator')
  with check (public.regen_role() = 'administrator');

drop policy if exists rail_nodes_read on public.rail_nodes;
create policy rail_nodes_read on public.rail_nodes
  for select to anon, authenticated
  using (public.regen_signed_in());

drop policy if exists rail_nodes_write on public.rail_nodes;
create policy rail_nodes_write on public.rail_nodes
  for all to authenticated
  using (public.regen_role() in ('administrator', 'department-manager'))
  with check (public.regen_role() in ('administrator', 'department-manager'));

drop policy if exists rail_segments_read on public.rail_segments;
create policy rail_segments_read on public.rail_segments
  for select to anon, authenticated
  using (public.regen_signed_in());

drop policy if exists rail_segments_write on public.rail_segments;
create policy rail_segments_write on public.rail_segments
  for all to authenticated
  using (public.regen_role() = 'administrator')
  with check (public.regen_role() = 'administrator');

drop policy if exists sensor_devices_read on public.sensor_devices;
create policy sensor_devices_read on public.sensor_devices
  for select to anon, authenticated
  using (public.regen_signed_in());

drop policy if exists sensor_devices_write on public.sensor_devices;
create policy sensor_devices_write on public.sensor_devices
  for all to authenticated
  using (public.regen_role() in ('administrator', 'regen-technical'))
  with check (public.regen_role() in ('administrator', 'regen-technical'));

drop policy if exists telemetry_read on public.telemetry_readings;
create policy telemetry_read on public.telemetry_readings
  for select to anon, authenticated
  using (public.regen_signed_in());

-- Readings arrive from the MQTT bridge using the service role; only
-- REGEN technical staff may backfill or correct them from a client.
drop policy if exists telemetry_write on public.telemetry_readings;
create policy telemetry_write on public.telemetry_readings
  for all to authenticated
  using (public.regen_role() in ('regen-technical', 'administrator'))
  with check (public.regen_role() in ('regen-technical', 'administrator'));

drop policy if exists condition_read on public.condition_assessments;
create policy condition_read on public.condition_assessments
  for select to anon, authenticated
  using (public.regen_signed_in());

drop policy if exists condition_write on public.condition_assessments;
create policy condition_write on public.condition_assessments
  for all to authenticated
  using (public.regen_role() in ('regen-technical', 'engineer', 'department-manager', 'administrator'))
  with check (public.regen_role() in ('regen-technical', 'engineer', 'department-manager', 'administrator'));

drop policy if exists environment_read on public.environmental_readings;
create policy environment_read on public.environmental_readings
  for select to anon, authenticated
  using (public.regen_signed_in());

drop policy if exists environment_write on public.environmental_readings;
create policy environment_write on public.environmental_readings
  for all to authenticated
  using (public.regen_role() in ('regen-technical', 'administrator'))
  with check (public.regen_role() in ('regen-technical', 'administrator'));

drop policy if exists trains_read on public.train_runs;
create policy trains_read on public.train_runs
  for select to anon, authenticated
  using (public.regen_signed_in());

-- ───────────────────────── Train movement register ────────────────────
-- Briefing §6: an authorised sensor or connected system records the event
-- and notifies the Operations Centre. Reads are open to all staff.

drop policy if exists movements_read on public.train_movements;
create policy movements_read on public.train_movements
  for select to anon, authenticated
  using (public.regen_signed_in());

drop policy if exists movements_write on public.train_movements;
create policy movements_write on public.train_movements
  for all to authenticated
  using (public.regen_role() in (
    'operations-controller', 'operations-head', 'regen-technical', 'administrator'))
  with check (public.regen_role() in (
    'operations-controller', 'operations-head', 'regen-technical', 'administrator'));

-- ─────────────────────────────── Alerts ───────────────────────────────

drop policy if exists alerts_read on public.alerts;
create policy alerts_read on public.alerts
  for select to anon, authenticated
  using (public.regen_signed_in());

drop policy if exists alerts_write on public.alerts;
create policy alerts_write on public.alerts
  for all to authenticated
  using (public.regen_role() in (
    'operations-controller', 'operations-head', 'regen-technical',
    'department-manager', 'administrator'))
  with check (public.regen_role() in (
    'operations-controller', 'operations-head', 'regen-technical',
    'department-manager', 'administrator'));

-- ─────────────────────── Maintenance workflow (§8) ────────────────────
-- Read: every employee, because authorisation depends on an informed
-- Operational Centre. Write: modelled stage by stage so a client can
-- never skip department verification or REGEN assessment.

drop policy if exists reports_read on public.maintenance_reports;
create policy reports_read on public.maintenance_reports
  for select to anon, authenticated
  using (public.regen_signed_in());

drop policy if exists reports_insert on public.maintenance_reports;
create policy reports_insert on public.maintenance_reports
  for insert to authenticated
  with check (
    public.regen_role() in (
      'field-worker', 'engineer', 'department-manager',
      'regen-technical', 'operations-controller', 'administrator')
    and reported_by = public.regen_employee_id()
    and stage = 'reported'
  );

drop policy if exists reports_update on public.maintenance_reports;
create policy reports_update on public.maintenance_reports
  for update to authenticated
  using (
    -- Department verifies reported → verified.
    (stage = 'reported' and public.regen_can_manage_department(department_slug))
    -- REGEN technical assesses verified → assessed.
    or (stage = 'verified' and public.regen_role() in ('regen-technical', 'administrator'))
    -- REGEN recommends assessed → awaiting-authorisation.
    or (stage = 'assessed' and public.regen_role() in ('regen-technical', 'administrator'))
    -- Head of Operations authorises awaiting-authorisation → authorised.
    or (stage = 'awaiting-authorisation' and public.regen_role() in ('operations-head', 'administrator'))
    -- Authorised work is issued, executed and signed off.
    or (stage in ('authorised', 'in-progress') and public.regen_role() in (
      'department-manager', 'engineer', 'regen-technical', 'operations-head', 'administrator'))
    or (stage = 'completed' and public.regen_role() in ('operations-head', 'administrator'))
  )
  with check (
    stage in ('verified', 'assessed', 'awaiting-authorisation', 'authorised',
              'in-progress', 'completed', 'closed', 'rejected')
  );

-- Approvals are the append-only audit of the chain above.
drop policy if exists approvals_read on public.approvals;
create policy approvals_read on public.approvals
  for select to anon, authenticated
  using (public.regen_signed_in());

drop policy if exists approvals_insert on public.approvals;
create policy approvals_insert on public.approvals
  for insert to authenticated
  with check (
    actor_id = public.regen_employee_id()
    and public.regen_role() in (
      'operations-head', 'regen-technical', 'department-manager',
      'engineer', 'administrator')
  );

-- ─────────────────────────── REGEN Connect (§7) ───────────────────────

drop policy if exists channels_read on public.channels;
create policy channels_read on public.channels
  for select to anon, authenticated
  using (
    public.regen_employee_id() = any (member_ids)
    or public.regen_is_oversight()
  );

drop policy if exists channels_write on public.channels;
create policy channels_write on public.channels
  for all to authenticated
  using (public.regen_role() in ('operations-head', 'administrator'))
  with check (public.regen_role() in ('operations-head', 'administrator'));

drop policy if exists messages_read on public.messages;
create policy messages_read on public.messages
  for select to anon, authenticated
  using (public.regen_is_channel_member(channel_slug));

drop policy if exists messages_insert on public.messages;
create policy messages_insert on public.messages
  for insert to authenticated
  with check (
    sender_id = public.regen_employee_id()
    and public.regen_is_channel_member(channel_slug)
  );

drop policy if exists calls_read on public.calls;
create policy calls_read on public.calls
  for select to anon, authenticated
  using (public.regen_is_channel_member(channel_slug));

drop policy if exists calls_insert on public.calls;
create policy calls_insert on public.calls
  for insert to authenticated
  with check (public.regen_is_channel_member(channel_slug));

-- ─────────────────────── Notifications & audit trail ──────────────────

drop policy if exists notifications_read on public.notifications;
create policy notifications_read on public.notifications
  for select to anon, authenticated
  using (public.regen_signed_in());

drop policy if exists notifications_write on public.notifications;
create policy notifications_write on public.notifications
  for all to authenticated
  using (public.regen_role() in ('operations-head', 'administrator'))
  with check (public.regen_role() in ('operations-head', 'administrator'));

-- The audit trail is append-only and readable by oversight roles only.
drop policy if exists audit_read on public.audit_entries;
create policy audit_read on public.audit_entries
  for select to anon, authenticated
  using (public.regen_role() in ('operations-head', 'administrator'));

drop policy if exists audit_insert on public.audit_entries;
create policy audit_insert on public.audit_entries
  for insert to authenticated
  with check (
    actor_id = public.regen_employee_id()
    and public.regen_role() in (
      'operations-head', 'administrator', 'regen-technical',
      'department-manager', 'operations-controller', 'engineer', 'field-worker')
  );

-- ────────────────────────────── Grants ────────────────────────────────
-- RLS only filters what the role already has table privileges for.

grant usage on schema public to anon, authenticated;

grant select on
  public.departments,
  public.rail_nodes,
  public.rail_segments,
  public.sensor_devices,
  public.telemetry_readings,
  public.train_movements,
  public.train_runs,
  public.condition_assessments,
  public.alerts,
  public.maintenance_reports,
  public.approvals,
  public.channels,
  public.messages,
  public.calls,
  public.notifications,
  public.environmental_readings
to anon, authenticated;

grant select on public.audit_entries to authenticated;

grant insert, update on
  public.rail_nodes,
  public.rail_segments,
  public.sensor_devices,
  public.telemetry_readings,
  public.train_movements,
  public.condition_assessments,
  public.alerts,
  public.channels,
  public.notifications,
  public.environmental_readings
to authenticated;

grant insert, update on public.maintenance_reports to authenticated;
grant insert on public.approvals, public.messages, public.calls, public.audit_entries to authenticated;

-- ───────────────────── Realtime publication (Supabase) ────────────────
-- Live dashboards subscribe to these tables. Wrapped so the script also
-- runs on a plain Postgres instance where the publication is absent.

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    execute 'alter publication supabase_realtime add table public.alerts';
    execute 'alter publication supabase_realtime add table public.train_movements';
    execute 'alter publication supabase_realtime add table public.telemetry_readings';
    execute 'alter publication supabase_realtime add table public.messages';
    execute 'alter publication supabase_realtime add table public.maintenance_reports';
    execute 'alter publication supabase_realtime add table public.notifications';
  end if;
exception
  when duplicate_object then null;
end;
$$;

-- ═══════════════════════════════════════════════════════════════════════
-- Verification
--
--   -- sees nothing: no employee announced
--   select count(*) from public.maintenance_reports;
--
--   -- sees the register as Thandiwe (operations-controller)
--   select set_config('regen.employee_id', 'emp-0002', true);
--   select count(*) from public.maintenance_reports;
--
--   -- audit trail is visible to Mr Nicol only
--   select set_config('regen.employee_id', 'emp-0001', true);
--   select count(*) from public.audit_entries;
-- ═══════════════════════════════════════════════════════════════════════
