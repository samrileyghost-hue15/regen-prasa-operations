-- ═══════════════════════════════════════════════════════════════════════
-- REGEN × PRASA — Railway Operations & Infrastructure Management System
-- 01_schema.sql · central PostgreSQL schema
--
-- Run order:  01_schema.sql → 02_rls.sql → 03_seed.sql
--
-- Conventions
--   · Primary keys are stable text identifiers so that a demonstration
--     dataset and production data can coexist during the pilot.
--   · Timestamps are `timestamptz`; the application renders them in SAST.
--   · Column names are snake_case. The data layer converts to camelCase at
--     the boundary (see src/lib/store.ts), so application code never sees
--     snake_case.
--   · Multi-value fields (arrays, sensor channel descriptors) use native
--     Postgres arrays / jsonb rather than join tables: they are written and
--     read as a single aggregate by the portal.
-- ═══════════════════════════════════════════════════════════════════════

create extension if not exists "pgcrypto";

-- ─────────────────────────── People & structure ───────────────────────

create table if not exists public.departments (
  id            text primary key,
  slug          text not null unique,
  name          text not null,
  discipline    text not null check (discipline in ('fixed-infrastructure', 'train-operations')),
  parent_slug   text references public.departments (slug) on update cascade on delete set null,
  description   text not null default '',
  headcount     integer not null default 0,
  status        text not null default 'normal' check (status in ('normal', 'warning', 'critical', 'offline')),
  sla_hours     integer not null default 4,
  kpi_label     text not null default '',
  kpi_value     text not null default '',
  created_at    timestamptz not null default now()
);

create table if not exists public.employees (
  id               text primary key,
  full_name        text not null,
  employee_ref     text not null unique,
  role             text not null check (role in (
                     'operations-head', 'operations-controller', 'department-manager',
                     'regen-technical', 'engineer', 'field-worker', 'administrator')),
  department_slug  text references public.departments (slug) on update cascade on delete set null,
  region           text not null default 'Gauteng',
  email            text not null,
  phone            text not null default '',
  is_online        boolean not null default false,
  last_seen        timestamptz not null default now(),
  -- scrypt(password, salt) — 16-byte hex salt, 64-byte hex digest.
  password_salt    text not null,
  password_hash    text not null,
  created_at       timestamptz not null default now()
);

create index if not exists employees_department_idx on public.employees (department_slug);
create index if not exists employees_role_idx on public.employees (role);

-- ───────────────────────────── Railway asset ──────────────────────────

create table if not exists public.rail_nodes (
  id    text primary key,
  name  text not null,
  x     numeric(8, 2) not null,
  y     numeric(8, 2) not null,
  kind  text not null check (kind in ('station', 'junction', 'depot', 'pilot'))
);

create table if not exists public.rail_segments (
  id                text primary key,
  track_id          text not null unique,
  name              text not null,
  corridor          text not null,
  direction         text not null check (direction in ('up', 'down', 'bi-directional')),
  start_km          numeric(6, 2) not null default 0,
  end_km            numeric(6, 2) not null default 0,
  status            text not null default 'normal' check (status in ('normal', 'warning', 'critical', 'offline')),
  condition_score   integer not null default 100 check (condition_score between 0 and 100),
  infrastructure    text[] not null default '{}',
  department_slugs  text[] not null default '{}',
  from_node         text references public.rail_nodes (id) on update cascade,
  to_node           text references public.rail_nodes (id) on update cascade,
  site_code         text not null default '',
  created_at        timestamptz not null default now()
);

create index if not exists rail_segments_status_idx on public.rail_segments (status);
create index if not exists rail_segments_corridor_idx on public.rail_segments (corridor);

-- ─────────────────────────────── Sensors ──────────────────────────────

create table if not exists public.sensor_devices (
  id                    text primary key,
  sensor_id             text not null unique,
  segment_id            text not null references public.rail_segments (id) on update cascade on delete cascade,
  status                text not null default 'online' check (status in ('online', 'degraded', 'offline')),
  last_transmission     timestamptz not null default now(),
  signal_quality        integer not null default 0 check (signal_quality between 0 and 100),
  firmware              text not null default '',
  installation_point    text not null default '',
  supports_vibration    boolean not null default true,
  supports_temperature  boolean not null default false,
  supports_strain       boolean not null default false,
  is_simulated          boolean not null default false,
  -- [{ "name": "REGEN_KP01_TELEMETRY", "kind": "telemetry", "status": "streaming", "rateHz": 50 }]
  channels              jsonb not null default '[]'::jsonb,
  created_at            timestamptz not null default now()
);

create index if not exists sensor_devices_segment_idx on public.sensor_devices (segment_id);

create table if not exists public.telemetry_readings (
  id                  text primary key,
  reading_id          text not null,
  sensor_id           text not null references public.sensor_devices (sensor_id) on update cascade on delete cascade,
  captured_at         timestamptz not null,
  vibration_velocity  numeric(6, 2) not null,
  temperature         numeric(5, 1),
  structural_strain   numeric(6, 1),
  is_simulated        boolean not null default false,
  quality_pct         integer not null default 0,
  created_at          timestamptz not null default now()
);

create index if not exists telemetry_sensor_time_idx
  on public.telemetry_readings (sensor_id, captured_at desc);

-- ─────────────────────────── Train movements ──────────────────────────

create table if not exists public.train_movements (
  id                text primary key,
  movement_id       text not null unique,
  segment_id        text not null references public.rail_segments (id) on update cascade on delete cascade,
  sensor_id         text references public.sensor_devices (sensor_id) on update cascade on delete set null,
  detected_at       timestamptz not null,
  direction         text not null check (direction in ('up', 'down')),
  source            text not null default '',
  source_kind       text not null check (source_kind in ('sensor', 'train-control', 'manual')),
  train_reference   text,
  peak_vibration    numeric(6, 2),
  duration_seconds  integer,
  review_status     text not null default 'normal' check (review_status in ('normal', 'review', 'critical')),
  is_simulated      boolean not null default false,
  created_at        timestamptz not null default now()
);

create index if not exists train_movements_time_idx on public.train_movements (detected_at desc);
create index if not exists train_movements_segment_idx on public.train_movements (segment_id, detected_at desc);

create table if not exists public.train_runs (
  id           text primary key,
  label        text not null,
  segment_id   text not null references public.rail_segments (id) on update cascade on delete cascade,
  direction    text not null check (direction in ('up', 'down')),
  progress     numeric(4, 3) not null default 0 check (progress between 0 and 1),
  speed_kph    integer not null default 0,
  is_simulated boolean not null default false
);

-- ─────────────────────── Condition & escalations ──────────────────────

create table if not exists public.condition_assessments (
  id           text primary key,
  segment_id   text not null references public.rail_segments (id) on update cascade on delete cascade,
  condition    text not null check (condition in ('good', 'fair', 'poor', 'failed')),
  score        integer not null check (score between 0 and 100),
  basis        text not null default '',
  assessed_at  timestamptz not null,
  notes        text not null default '',
  created_at   timestamptz not null default now()
);

create index if not exists condition_assessments_segment_idx
  on public.condition_assessments (segment_id, assessed_at desc);

create table if not exists public.alerts (
  id               text primary key,
  reference        text not null unique,
  segment_id       text not null references public.rail_segments (id) on update cascade on delete cascade,
  department_slug  text references public.departments (slug) on update cascade on delete set null,
  title            text not null,
  detail           text not null default '',
  severity         text not null check (severity in ('critical', 'high', 'medium', 'low')),
  status           text not null default 'open' check (status in ('open', 'acknowledged', 'resolved')),
  occurred_at      timestamptz not null,
  source           text not null default '',
  created_at       timestamptz not null default now()
);

create index if not exists alerts_open_idx on public.alerts (status, severity);

-- ──────────────────────── Maintenance workflow ────────────────────────

create table if not exists public.maintenance_reports (
  id                  text primary key,
  reference           text not null unique,
  title               text not null,
  description         text not null default '',
  segment_id          text not null references public.rail_segments (id) on update cascade,
  department_slug     text not null references public.departments (slug) on update cascade,
  severity            text not null check (severity in ('low', 'medium', 'high', 'critical')),
  stage               text not null default 'reported' check (stage in (
                        'reported', 'verified', 'assessed', 'awaiting-authorisation',
                        'authorised', 'in-progress', 'completed', 'closed', 'rejected')),
  reported_by         text not null references public.employees (id) on update cascade,
  reported_at         timestamptz not null default now(),
  photos              text[] not null default '{}',
  due_at              timestamptz,
  assigned_to         text references public.employees (id) on update cascade on delete set null,
  instructions        text,
  recommended_action  text,
  sensor_evidence     text,
  evidence_notes      text,
  completed_at        timestamptz,
  location_note       text not null default '',
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index if not exists maintenance_reports_stage_idx on public.maintenance_reports (stage);
create index if not exists maintenance_reports_department_idx
  on public.maintenance_reports (department_slug, stage);
create index if not exists maintenance_reports_segment_idx on public.maintenance_reports (segment_id);

create table if not exists public.approvals (
  id          text primary key,
  report_id   text not null references public.maintenance_reports (id) on update cascade on delete cascade,
  stage       text not null,
  actor_id    text not null references public.employees (id) on update cascade,
  actor_role  text not null,
  decision    text not null,
  comment     text not null default '',
  decided_at  timestamptz not null default now()
);

create index if not exists approvals_report_idx on public.approvals (report_id, decided_at);

-- ─────────────────────────── Communication ────────────────────────────

create table if not exists public.channels (
  id           text primary key,
  slug         text not null unique,
  name         text not null,
  kind         text not null check (kind in ('department', 'team', 'direct', 'operations')),
  description  text not null default '',
  member_ids   text[] not null default '{}',
  created_at   timestamptz not null default now()
);

create table if not exists public.messages (
  id               text primary key,
  channel_slug     text not null references public.channels (slug) on update cascade on delete cascade,
  sender_id        text not null references public.employees (id) on update cascade,
  body             text not null,
  sent_at          timestamptz not null default now(),
  kind             text not null default 'text' check (kind in ('text', 'location', 'image', 'document', 'system')),
  attachment_name  text,
  location_label   text,
  is_simulated     boolean not null default false
);

create index if not exists messages_channel_idx on public.messages (channel_slug, sent_at desc);

create table if not exists public.calls (
  id                text primary key,
  channel_slug      text not null references public.channels (slug) on update cascade on delete cascade,
  kind              text not null check (kind in ('audio', 'video')),
  started_at        timestamptz not null default now(),
  duration_seconds  integer not null default 0,
  participants      text[] not null default '{}',
  status            text not null default 'completed' check (status in ('completed', 'missed'))
);

create index if not exists calls_channel_idx on public.calls (channel_slug, started_at desc);

-- ─────────────────────── Notifications & audit ────────────────────────

create table if not exists public.notifications (
  id          text primary key,
  title       text not null,
  body        text not null default '',
  severity    text not null default 'medium' check (severity in ('critical', 'high', 'medium', 'low')),
  created_at  timestamptz not null default now(),
  read_at     timestamptz,
  href        text not null default '/portal'
);

create index if not exists notifications_unread_idx on public.notifications (read_at);

create table if not exists public.audit_entries (
  id          text primary key,
  actor_id    text not null references public.employees (id) on update cascade,
  action      text not null,
  entity      text not null,
  entity_id   text not null,
  detail      text not null default '',
  created_at  timestamptz not null default now()
);

create index if not exists audit_entries_time_idx on public.audit_entries (created_at desc);
create index if not exists audit_entries_entity_idx on public.audit_entries (entity, entity_id);

-- ──────────────────────────── Environment ─────────────────────────────

create table if not exists public.environmental_readings (
  id               text primary key,
  segment_id       text not null references public.rail_segments (id) on update cascade on delete cascade,
  captured_at      timestamptz not null,
  ambient_temp_c   numeric(5, 1) not null,
  track_temp_c     numeric(5, 1) not null,
  rainfall_mm      numeric(5, 1) not null default 0,
  humidity_pct     integer not null default 0
);

create index if not exists environmental_readings_segment_idx
  on public.environmental_readings (segment_id, captured_at desc);

-- ───────────────────────── Updated-at trigger ─────────────────────────

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists maintenance_reports_touch on public.maintenance_reports;
create trigger maintenance_reports_touch
  before update on public.maintenance_reports
  for each row execute function public.touch_updated_at();

-- ─────────────────────────── Convenience view ─────────────────────────

create or replace view public.v_open_maintenance as
select
  r.reference,
  r.title,
  r.stage,
  r.severity,
  r.department_slug,
  s.track_id,
  r.reported_at,
  r.due_at,
  r.assigned_to
from public.maintenance_reports r
join public.rail_segments s on s.id = r.segment_id
where r.stage not in ('closed', 'rejected')
order by r.reported_at desc;

comment on view public.v_open_maintenance is
  'Everything still inside the maintenance workflow, joined to its railway section.';
