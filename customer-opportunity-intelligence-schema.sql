-- Aridon Opportunity Intelligence customer schema.
-- Applied to the production Supabase project on 2026-08-09.

create table if not exists public.customer_opportunity_profiles (
  tenant_id uuid primary key references public.customer_tenants(id) on delete cascade,
  website text,
  capabilities text,
  target_markets text[] not null default '{}',
  geographies text[] not null default '{}',
  opportunity_types text[] not null default '{}',
  keywords text[] not null default '{}',
  exclusions text,
  minimum_value numeric,
  maximum_value numeric,
  source_urls text[] not null default '{}',
  updated_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.customer_opportunity_runs (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.customer_tenants(id) on delete cascade,
  user_id uuid,
  status text not null default 'running' check (status in ('running','completed','failed')),
  profile_snapshot jsonb not null default '{}'::jsonb,
  result_count integer not null default 0,
  source_urls text[] not null default '{}',
  error_message text,
  started_at timestamptz not null default now(),
  completed_at timestamptz
);

create table if not exists public.customer_opportunities (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.customer_tenants(id) on delete cascade,
  run_id uuid references public.customer_opportunity_runs(id) on delete set null,
  fingerprint text not null,
  title text not null,
  opportunity_type text,
  issuer text,
  location text,
  source_url text,
  source_urls text[] not null default '{}',
  deadline_text text,
  deadline_date date,
  value_text text,
  estimated_value numeric,
  fit_score integer not null default 0 check (fit_score between 0 and 100),
  verification_status text not null default 'source_backed' check (verification_status in ('source_backed','partially_verified','unverified')),
  eligibility text,
  fit_reason text,
  why_now text,
  requirements text[] not null default '{}',
  risks text[] not null default '{}',
  partner_strategy text,
  decision_maker_path text,
  recommended_next_step text,
  draft_outreach text,
  stage text not null default 'new' check (stage in ('new','reviewing','qualified','pursuing','submitted','won','lost','watching')),
  status text not null default 'open' check (status in ('open','closed','archived')),
  created_by uuid,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, fingerprint)
);

create index if not exists customer_opportunities_tenant_fit_idx on public.customer_opportunities (tenant_id, fit_score desc, updated_at desc);
create index if not exists customer_opportunities_tenant_stage_idx on public.customer_opportunities (tenant_id, stage, updated_at desc);
create index if not exists customer_opportunity_runs_tenant_idx on public.customer_opportunity_runs (tenant_id, started_at desc);

alter table public.customer_opportunity_profiles enable row level security;
alter table public.customer_opportunity_runs enable row level security;
alter table public.customer_opportunities enable row level security;

alter table public.customer_tenants add column if not exists opportunity_plan text;
alter table public.customer_tenants drop constraint if exists customer_tenants_opportunity_plan_check;
alter table public.customer_tenants add constraint customer_tenants_opportunity_plan_check
  check (opportunity_plan is null or opportunity_plan in ('scout','pursuit','command'));
