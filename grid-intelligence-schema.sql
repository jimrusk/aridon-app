-- Aridon Drone Grid Intelligence MVP schema
-- Apply to the existing Supabase/Postgres project after reviewing tenant/auth policy.

create extension if not exists pgcrypto;

create table if not exists grid_assets (
  id uuid primary key default gen_random_uuid(),
  external_asset_id text not null unique,
  asset_type text not null,
  utility_id text,
  feeder_id text,
  latitude double precision,
  longitude double precision,
  install_date date,
  condition_score integer check (condition_score between 0 and 100),
  last_inspected_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists drone_missions (
  id uuid primary key default gen_random_uuid(),
  external_mission_id text unique,
  utility_id text,
  name text not null,
  status text not null default 'planned' check (status in ('planned','approved','flying','paused','completed','aborted')),
  drone_id text,
  dock_start text,
  dock_end text,
  planned_route_geojson jsonb,
  operator_approved_by text,
  operator_approved_at timestamptz,
  started_at timestamptz,
  completed_at timestamptz,
  mission_metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists inspection_events (
  id uuid primary key default gen_random_uuid(),
  external_event_id text unique,
  mission_id uuid references drone_missions(id) on delete set null,
  asset_id uuid references grid_assets(id) on delete set null,
  captured_at timestamptz not null,
  latitude double precision,
  longitude double precision,
  altitude_m numeric,
  battery_pct numeric,
  telemetry jsonb not null default '{}'::jsonb,
  measurements jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists inspection_evidence (
  id uuid primary key default gen_random_uuid(),
  inspection_event_id uuid references inspection_events(id) on delete cascade,
  evidence_type text not null check (evidence_type in ('rgb','thermal','lidar','video','document')),
  storage_uri text not null,
  sha256 text,
  mime_type text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists grid_findings (
  id uuid primary key default gen_random_uuid(),
  inspection_event_id uuid references inspection_events(id) on delete cascade,
  asset_id uuid references grid_assets(id) on delete set null,
  finding_type text not null,
  severity text not null check (severity in ('Critical','High','Medium','Low')),
  risk_score integer not null check (risk_score between 0 and 100),
  confidence numeric check (confidence between 0 and 1),
  summary text not null,
  reasons jsonb not null default '[]'::jsonb,
  model_version text,
  review_status text not null default 'pending' check (review_status in ('pending','confirmed','dismissed','needs_field_check')),
  reviewed_by text,
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists grid_work_orders (
  id uuid primary key default gen_random_uuid(),
  finding_id uuid references grid_findings(id) on delete set null,
  asset_id uuid references grid_assets(id) on delete set null,
  external_work_order_id text,
  status text not null default 'recommended' check (status in ('recommended','approved','dispatched','in_progress','completed','verified','cancelled')),
  priority text,
  recommended_action text,
  approved_by text,
  approved_at timestamptz,
  completed_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists repair_verifications (
  id uuid primary key default gen_random_uuid(),
  work_order_id uuid references grid_work_orders(id) on delete cascade,
  before_event_id uuid references inspection_events(id) on delete set null,
  after_event_id uuid references inspection_events(id) on delete set null,
  result text not null check (result in ('pending','passed','failed','manual_review')),
  comparison jsonb not null default '{}'::jsonb,
  verified_by text,
  verified_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists grid_integration_sync (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  direction text not null check (direction in ('inbound','outbound')),
  object_type text not null,
  object_id text,
  status text not null check (status in ('queued','running','succeeded','failed')),
  payload jsonb not null default '{}'::jsonb,
  response jsonb,
  error_message text,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create index if not exists idx_grid_assets_feeder on grid_assets(feeder_id);
create index if not exists idx_grid_assets_last_inspected on grid_assets(last_inspected_at desc);
create index if not exists idx_drone_missions_status on drone_missions(status);
create index if not exists idx_inspection_events_mission on inspection_events(mission_id, captured_at desc);
create index if not exists idx_inspection_events_asset on inspection_events(asset_id, captured_at desc);
create index if not exists idx_grid_findings_asset on grid_findings(asset_id, created_at desc);
create index if not exists idx_grid_findings_review on grid_findings(review_status, severity);
create index if not exists idx_grid_work_orders_status on grid_work_orders(status, created_at desc);

-- Security note:
-- Enable Row Level Security and add tenant-aware policies that match Aridon's existing
-- customer/session model before storing live utility data. The MVP intentionally does not
-- assume a tenant column or auth subject because those must match the deployed app.
