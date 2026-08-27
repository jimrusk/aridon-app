create table if not exists public.marketing_autopilot_runs (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  trigger text not null default 'manual' check (trigger in ('manual','daily','connector')),
  business_name text not null default 'Aridon',
  status text not null default 'completed' check (status in ('completed','failed')),
  health_score integer check (health_score between 0 and 100),
  snapshot jsonb not null default '{}'::jsonb,
  report jsonb not null default '{}'::jsonb,
  source text not null default 'aridon-growth-desk',
  user_id uuid references auth.users(id) on delete set null,
  tenant_id uuid references public.customer_tenants(id) on delete set null
);

create index if not exists marketing_autopilot_runs_created_at_idx on public.marketing_autopilot_runs (created_at desc);
create index if not exists marketing_autopilot_runs_user_idx on public.marketing_autopilot_runs(user_id, created_at desc);
create index if not exists marketing_autopilot_runs_tenant_idx on public.marketing_autopilot_runs(tenant_id, created_at desc);

alter table public.marketing_autopilot_runs enable row level security;
revoke all on table public.marketing_autopilot_runs from anon, authenticated;
grant select, insert, update, delete on table public.marketing_autopilot_runs to service_role;

create table if not exists public.marketing_autopilot_actions (
  id uuid primary key default gen_random_uuid(),
  run_id uuid references public.marketing_autopilot_runs(id) on delete cascade,
  created_at timestamptz not null default now(),
  channel text not null,
  action_type text not null,
  title text not null,
  detail text,
  risk text not null default 'low' check (risk in ('low','medium','high')),
  approval_required boolean not null default false,
  status text not null default 'queued' check (status in ('queued','approved','rejected','executed')),
  payload jsonb not null default '{}'::jsonb
);

create index if not exists marketing_autopilot_actions_run_id_idx on public.marketing_autopilot_actions (run_id);
create index if not exists marketing_autopilot_actions_status_idx on public.marketing_autopilot_actions (status, created_at desc);

alter table public.marketing_autopilot_actions enable row level security;
revoke all on table public.marketing_autopilot_actions from anon, authenticated;
grant select, insert, update, delete on table public.marketing_autopilot_actions to service_role;
