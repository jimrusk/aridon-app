-- Shared data model for Aridon One, Aridon Two and Aridon Three.

create table if not exists public.customer_intelligence_profiles (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.customer_tenants(id) on delete cascade,
  lane text not null check (lane in ('business_need','real_estate','business_acquisition')),
  profile jsonb not null default '{}'::jsonb,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, lane)
);

create table if not exists public.customer_intelligence_runs (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.customer_tenants(id) on delete cascade,
  user_id uuid,
  lane text not null check (lane in ('business_need','real_estate','business_acquisition')),
  status text not null default 'running' check (status in ('running','completed','failed')),
  profile_snapshot jsonb not null default '{}'::jsonb,
  result_count integer not null default 0,
  source_urls text[] not null default '{}',
  error_message text,
  started_at timestamptz not null default now(),
  completed_at timestamptz
);

create table if not exists public.customer_intelligence_leads (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.customer_tenants(id) on delete cascade,
  run_id uuid references public.customer_intelligence_runs(id) on delete set null,
  lane text not null check (lane in ('business_need','real_estate','business_acquisition')),
  fingerprint text not null,
  entity_name text not null,
  entity_type text,
  location text,
  address text,
  primary_url text,
  source_urls text[] not null default '{}',
  score integer not null default 0 check (score between 0 and 100),
  confidence integer not null default 0 check (confidence between 0 and 100),
  verification_status text not null default 'unverified' check (verification_status in ('source_backed','partially_verified','unverified')),
  signal_summary text,
  why_now text,
  value_text text,
  estimated_value numeric,
  score_breakdown jsonb not null default '{}'::jsonb,
  signals jsonb not null default '[]'::jsonb,
  facts jsonb not null default '{}'::jsonb,
  risks text[] not null default '{}',
  contact_path text,
  recommended_next_step text,
  draft_outreach text,
  stage text not null default 'new' check (stage in ('new','reviewing','qualified','contacting','diligence','pursuing','won','lost','watching')),
  status text not null default 'open' check (status in ('open','closed','archived')),
  created_by uuid,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, lane, fingerprint)
);

create index if not exists customer_intelligence_leads_tenant_lane_score_idx
  on public.customer_intelligence_leads (tenant_id, lane, score desc, updated_at desc);
create index if not exists customer_intelligence_leads_tenant_lane_stage_idx
  on public.customer_intelligence_leads (tenant_id, lane, stage, updated_at desc);
create index if not exists customer_intelligence_runs_tenant_lane_idx
  on public.customer_intelligence_runs (tenant_id, lane, started_at desc);

alter table public.customer_intelligence_profiles enable row level security;
alter table public.customer_intelligence_runs enable row level security;
alter table public.customer_intelligence_leads enable row level security;
