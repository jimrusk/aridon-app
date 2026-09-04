-- Aridon GridOS utility data model
-- Intended for the existing Aridon Supabase project.
-- Security default: RLS enabled; privileged server routes use the service role.

create extension if not exists pgcrypto;

create table if not exists public.grid_os_utilities (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  utility_type text not null default 'municipal',
  region text,
  demo boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.grid_os_assets (
  id uuid primary key default gen_random_uuid(),
  utility_id uuid not null references public.grid_os_utilities(id) on delete cascade,
  asset_code text not null,
  asset_type text not null,
  name text,
  status text not null default 'online',
  voltage_kv numeric,
  capacity_mw numeric,
  latitude numeric,
  longitude numeric,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (utility_id, asset_code)
);

create table if not exists public.grid_os_metrics (
  id bigint generated always as identity primary key,
  utility_id uuid not null references public.grid_os_utilities(id) on delete cascade,
  metric_key text not null,
  value numeric not null,
  unit text not null,
  source text not null,
  is_demo boolean not null default false,
  captured_at timestamptz not null default now()
);
create index if not exists grid_os_metrics_lookup_idx on public.grid_os_metrics (utility_id, metric_key, captured_at desc);

create table if not exists public.grid_os_forecasts (
  id uuid primary key default gen_random_uuid(),
  utility_id uuid not null references public.grid_os_utilities(id) on delete cascade,
  horizon text not null,
  forecast_at timestamptz not null,
  load_mw numeric not null,
  renewable_mw numeric not null default 0,
  peak_risk text not null default 'normal',
  confidence numeric not null default 0.8,
  created_at timestamptz not null default now()
);

create table if not exists public.grid_os_recommendations (
  id uuid primary key default gen_random_uuid(),
  utility_id uuid not null references public.grid_os_utilities(id) on delete cascade,
  category text not null,
  title text not null,
  description text not null,
  expected_impact text,
  estimated_annual_value numeric,
  priority text not null default 'medium',
  status text not null default 'proposed',
  requires_human_approval boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.grid_os_security_findings (
  id uuid primary key default gen_random_uuid(),
  utility_id uuid not null references public.grid_os_utilities(id) on delete cascade,
  asset_id uuid references public.grid_os_assets(id) on delete set null,
  severity text not null,
  title text not null,
  description text,
  status text not null default 'open',
  detected_at timestamptz not null default now(),
  resolved_at timestamptz
);

create table if not exists public.grid_os_integrations (
  id uuid primary key default gen_random_uuid(),
  utility_id uuid not null references public.grid_os_utilities(id) on delete cascade,
  integration_type text not null,
  provider text,
  status text not null default 'planned',
  read_only boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  unique (utility_id, integration_type, provider)
);

create table if not exists public.grid_os_approvals (
  id uuid primary key default gen_random_uuid(),
  utility_id uuid not null references public.grid_os_utilities(id) on delete cascade,
  recommendation_id uuid references public.grid_os_recommendations(id) on delete set null,
  action_name text not null,
  decision text not null,
  decided_by text,
  notes text,
  decided_at timestamptz not null default now()
);

alter table public.grid_os_utilities enable row level security;
alter table public.grid_os_assets enable row level security;
alter table public.grid_os_metrics enable row level security;
alter table public.grid_os_forecasts enable row level security;
alter table public.grid_os_recommendations enable row level security;
alter table public.grid_os_security_findings enable row level security;
alter table public.grid_os_integrations enable row level security;
alter table public.grid_os_approvals enable row level security;
