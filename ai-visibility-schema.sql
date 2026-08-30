create table if not exists public.ai_visibility_runs (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  website text not null,
  brand_name text,
  overall_score integer,
  search_readiness integer,
  ai_readiness integer,
  citation_readiness integer,
  answer_coverage integer,
  competitors jsonb not null default '[]'::jsonb,
  report jsonb not null default '{}'::jsonb,
  user_id uuid null,
  tenant_id uuid null
);

create index if not exists ai_visibility_runs_website_created_idx on public.ai_visibility_runs (website, created_at desc);
create index if not exists ai_visibility_runs_tenant_created_idx on public.ai_visibility_runs (tenant_id, created_at desc);

alter table public.ai_visibility_runs enable row level security;

-- Aridon server routes use the server-only service role for scan persistence.
-- Add user/tenant-scoped read policies before exposing scan history directly to browser clients.
