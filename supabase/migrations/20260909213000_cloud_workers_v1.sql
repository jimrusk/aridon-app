create table if not exists public.customer_cloud_workers (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.customer_tenants(id) on delete cascade,
  requested_by uuid references auth.users(id) on delete set null,
  executive text not null default 'Eva',
  name text not null,
  objective text not null,
  mode text not null default 'research',
  priority text not null default 'medium',
  status text not null default 'queued',
  provider text not null default 'openai-web',
  checkpoint jsonb not null default '{}'::jsonb,
  result jsonb not null default '{}'::jsonb,
  cycle_count integer not null default 0,
  max_cycles integer not null default 6,
  next_run_at timestamptz not null default now(),
  lease_until timestamptz,
  last_run_at timestamptz,
  started_at timestamptz,
  completed_at timestamptz,
  paused_at timestamptz,
  error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists customer_cloud_workers_tenant_status_next_idx
  on public.customer_cloud_workers (tenant_id, status, next_run_at, created_at desc);
create index if not exists customer_cloud_workers_due_idx
  on public.customer_cloud_workers (status, next_run_at)
  where status in ('queued','running');

create table if not exists public.customer_cloud_worker_events (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.customer_tenants(id) on delete cascade,
  worker_id uuid not null references public.customer_cloud_workers(id) on delete cascade,
  event_type text not null,
  message text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists customer_cloud_worker_events_worker_created_idx
  on public.customer_cloud_worker_events (worker_id, created_at desc);
create index if not exists customer_cloud_worker_events_tenant_created_idx
  on public.customer_cloud_worker_events (tenant_id, created_at desc);

alter table public.customer_cloud_workers enable row level security;
alter table public.customer_cloud_worker_events enable row level security;

revoke all on table public.customer_cloud_workers from anon;
revoke all on table public.customer_cloud_worker_events from anon;
grant select, insert, update on table public.customer_cloud_workers to authenticated;
grant select, insert on table public.customer_cloud_worker_events to authenticated;

drop policy if exists "cloud workers tenant member select" on public.customer_cloud_workers;
create policy "cloud workers tenant member select"
on public.customer_cloud_workers for select to authenticated
using (
  exists (
    select 1 from public.customer_memberships m
    where m.tenant_id = customer_cloud_workers.tenant_id
      and m.user_id = (select auth.uid())
  )
);

drop policy if exists "cloud workers tenant member insert" on public.customer_cloud_workers;
create policy "cloud workers tenant member insert"
on public.customer_cloud_workers for insert to authenticated
with check (
  exists (
    select 1 from public.customer_memberships m
    where m.tenant_id = customer_cloud_workers.tenant_id
      and m.user_id = (select auth.uid())
  )
  and (requested_by is null or requested_by = (select auth.uid()))
);

drop policy if exists "cloud workers owner admin update" on public.customer_cloud_workers;
create policy "cloud workers owner admin update"
on public.customer_cloud_workers for update to authenticated
using (
  exists (
    select 1 from public.customer_memberships m
    where m.tenant_id = customer_cloud_workers.tenant_id
      and m.user_id = (select auth.uid())
      and m.role in ('owner','admin')
  )
)
with check (
  exists (
    select 1 from public.customer_memberships m
    where m.tenant_id = customer_cloud_workers.tenant_id
      and m.user_id = (select auth.uid())
      and m.role in ('owner','admin')
  )
);

drop policy if exists "cloud worker events tenant member select" on public.customer_cloud_worker_events;
create policy "cloud worker events tenant member select"
on public.customer_cloud_worker_events for select to authenticated
using (
  exists (
    select 1 from public.customer_memberships m
    where m.tenant_id = customer_cloud_worker_events.tenant_id
      and m.user_id = (select auth.uid())
  )
);

drop policy if exists "cloud worker events tenant member insert" on public.customer_cloud_worker_events;
create policy "cloud worker events tenant member insert"
on public.customer_cloud_worker_events for insert to authenticated
with check (
  exists (
    select 1 from public.customer_memberships m
    where m.tenant_id = customer_cloud_worker_events.tenant_id
      and m.user_id = (select auth.uid())
  )
);