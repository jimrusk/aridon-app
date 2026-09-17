create extension if not exists pgcrypto;

create table if not exists public.customer_phone_bridges (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.customer_tenants(id) on delete cascade,
  name text not null default 'Eva Phone Bridge',
  status text not null default 'pairing' check (status in ('pairing','online','offline','revoked')),
  pairing_code_hash text,
  pairing_expires_at timestamptz,
  auth_token_hash text,
  last_seen_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists customer_phone_bridges_tenant_idx
  on public.customer_phone_bridges(tenant_id, created_at desc);
create index if not exists customer_phone_bridges_token_idx
  on public.customer_phone_bridges(auth_token_hash)
  where auth_token_hash is not null;

create table if not exists public.customer_phone_jobs (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.customer_tenants(id) on delete cascade,
  bridge_id uuid references public.customer_phone_bridges(id) on delete set null,
  target_id uuid references public.customer_call_targets(id) on delete set null,
  direction text not null default 'outbound' check (direction in ('outbound','inbound')),
  phone text not null,
  contact_name text,
  company_name text,
  objective text not null,
  state text not null default 'queued' check (state in ('queued','claimed','dialing','ringing','connected','completed','failed','cancelled')),
  error text,
  transcript text,
  summary text,
  claimed_at timestamptz,
  started_at timestamptz,
  ended_at timestamptz,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists customer_phone_jobs_queue_idx
  on public.customer_phone_jobs(tenant_id, state, created_at asc);
create index if not exists customer_phone_jobs_bridge_idx
  on public.customer_phone_jobs(bridge_id, created_at desc);

alter table public.customer_phone_bridges enable row level security;
alter table public.customer_phone_jobs enable row level security;

grant select, insert, update on public.customer_phone_bridges to authenticated;
grant select, insert, update on public.customer_phone_jobs to authenticated;

drop policy if exists "customer phone bridges select" on public.customer_phone_bridges;
create policy "customer phone bridges select" on public.customer_phone_bridges
for select to authenticated
using (
  exists (
    select 1 from public.customer_memberships m
    where m.tenant_id = customer_phone_bridges.tenant_id
      and m.user_id = (select auth.uid())
  )
);

drop policy if exists "customer phone bridges insert" on public.customer_phone_bridges;
create policy "customer phone bridges insert" on public.customer_phone_bridges
for insert to authenticated
with check (
  exists (
    select 1 from public.customer_memberships m
    where m.tenant_id = customer_phone_bridges.tenant_id
      and m.user_id = (select auth.uid())
  )
);

drop policy if exists "customer phone bridges update" on public.customer_phone_bridges;
create policy "customer phone bridges update" on public.customer_phone_bridges
for update to authenticated
using (
  exists (
    select 1 from public.customer_memberships m
    where m.tenant_id = customer_phone_bridges.tenant_id
      and m.user_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1 from public.customer_memberships m
    where m.tenant_id = customer_phone_bridges.tenant_id
      and m.user_id = (select auth.uid())
  )
);

drop policy if exists "customer phone jobs select" on public.customer_phone_jobs;
create policy "customer phone jobs select" on public.customer_phone_jobs
for select to authenticated
using (
  exists (
    select 1 from public.customer_memberships m
    where m.tenant_id = customer_phone_jobs.tenant_id
      and m.user_id = (select auth.uid())
  )
);

drop policy if exists "customer phone jobs insert" on public.customer_phone_jobs;
create policy "customer phone jobs insert" on public.customer_phone_jobs
for insert to authenticated
with check (
  exists (
    select 1 from public.customer_memberships m
    where m.tenant_id = customer_phone_jobs.tenant_id
      and m.user_id = (select auth.uid())
  )
);

drop policy if exists "customer phone jobs update" on public.customer_phone_jobs;
create policy "customer phone jobs update" on public.customer_phone_jobs
for update to authenticated
using (
  exists (
    select 1 from public.customer_memberships m
    where m.tenant_id = customer_phone_jobs.tenant_id
      and m.user_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1 from public.customer_memberships m
    where m.tenant_id = customer_phone_jobs.tenant_id
      and m.user_id = (select auth.uid())
  )
);
