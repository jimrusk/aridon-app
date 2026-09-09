alter table public.customer_action_queue
  add column if not exists adapter_key text not null default 'manual',
  add column if not exists source text not null default 'action-center',
  add column if not exists source_ref text,
  add column if not exists idempotency_key text,
  add column if not exists attempt_count integer not null default 0,
  add column if not exists last_attempt_at timestamptz,
  add column if not exists connection_key text;

create unique index if not exists customer_action_queue_tenant_idempotency_idx
  on public.customer_action_queue (tenant_id, idempotency_key)
  where idempotency_key is not null;

create index if not exists customer_action_queue_tenant_status_created_idx
  on public.customer_action_queue (tenant_id, status, created_at desc);

create table if not exists public.customer_action_executions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.customer_tenants(id) on delete cascade,
  action_id uuid not null references public.customer_action_queue(id) on delete cascade,
  requested_by uuid references auth.users(id) on delete set null,
  adapter_key text not null,
  attempt_no integer not null default 1 check (attempt_no > 0),
  status text not null default 'running',
  input_snapshot jsonb not null default '{}'::jsonb,
  output jsonb not null default '{}'::jsonb,
  error text,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  created_at timestamptz not null default now(),
  unique (action_id, attempt_no)
);

create index if not exists customer_action_executions_tenant_created_idx
  on public.customer_action_executions (tenant_id, created_at desc);
create index if not exists customer_action_executions_action_attempt_idx
  on public.customer_action_executions (action_id, attempt_no desc);

alter table public.customer_action_queue enable row level security;
alter table public.customer_action_executions enable row level security;
alter table public.customer_outcomes enable row level security;

revoke all on table public.customer_action_queue from anon;
revoke all on table public.customer_action_executions from anon;
revoke all on table public.customer_outcomes from anon;

grant select, insert, update on table public.customer_action_queue to authenticated;
grant select, insert, update on table public.customer_action_executions to authenticated;
grant select, insert, update on table public.customer_outcomes to authenticated;
grant insert on table public.customer_tasks to authenticated;

drop policy if exists "action queue tenant member select" on public.customer_action_queue;
create policy "action queue tenant member select"
on public.customer_action_queue for select to authenticated
using (
  exists (
    select 1 from public.customer_memberships m
    where m.tenant_id = customer_action_queue.tenant_id
      and m.user_id = (select auth.uid())
  )
);

drop policy if exists "action queue tenant member insert" on public.customer_action_queue;
create policy "action queue tenant member insert"
on public.customer_action_queue for insert to authenticated
with check (
  exists (
    select 1 from public.customer_memberships m
    where m.tenant_id = customer_action_queue.tenant_id
      and m.user_id = (select auth.uid())
  )
  and (requested_by is null or requested_by = (select auth.uid()))
);

drop policy if exists "action queue owner admin update" on public.customer_action_queue;
create policy "action queue owner admin update"
on public.customer_action_queue for update to authenticated
using (
  exists (
    select 1 from public.customer_memberships m
    where m.tenant_id = customer_action_queue.tenant_id
      and m.user_id = (select auth.uid())
      and m.role in ('owner','admin')
  )
)
with check (
  exists (
    select 1 from public.customer_memberships m
    where m.tenant_id = customer_action_queue.tenant_id
      and m.user_id = (select auth.uid())
      and m.role in ('owner','admin')
  )
);

drop policy if exists "action executions tenant member select" on public.customer_action_executions;
create policy "action executions tenant member select"
on public.customer_action_executions for select to authenticated
using (
  exists (
    select 1 from public.customer_memberships m
    where m.tenant_id = customer_action_executions.tenant_id
      and m.user_id = (select auth.uid())
  )
);

drop policy if exists "action executions owner admin insert" on public.customer_action_executions;
create policy "action executions owner admin insert"
on public.customer_action_executions for insert to authenticated
with check (
  exists (
    select 1 from public.customer_memberships m
    where m.tenant_id = customer_action_executions.tenant_id
      and m.user_id = (select auth.uid())
      and m.role in ('owner','admin')
  )
  and (requested_by is null or requested_by = (select auth.uid()))
);

drop policy if exists "action executions owner admin update" on public.customer_action_executions;
create policy "action executions owner admin update"
on public.customer_action_executions for update to authenticated
using (
  exists (
    select 1 from public.customer_memberships m
    where m.tenant_id = customer_action_executions.tenant_id
      and m.user_id = (select auth.uid())
      and m.role in ('owner','admin')
  )
)
with check (
  exists (
    select 1 from public.customer_memberships m
    where m.tenant_id = customer_action_executions.tenant_id
      and m.user_id = (select auth.uid())
      and m.role in ('owner','admin')
  )
);

drop policy if exists "customer task tenant member insert" on public.customer_tasks;
create policy "customer task tenant member insert"
on public.customer_tasks for insert to authenticated
with check (
  exists (
    select 1 from public.customer_memberships m
    where m.tenant_id = customer_tasks.tenant_id
      and m.user_id = (select auth.uid())
  )
);

drop policy if exists "customer outcomes tenant member select" on public.customer_outcomes;
create policy "customer outcomes tenant member select"
on public.customer_outcomes for select to authenticated
using (
  exists (
    select 1 from public.customer_memberships m
    where m.tenant_id = customer_outcomes.tenant_id
      and m.user_id = (select auth.uid())
  )
);

drop policy if exists "customer outcomes tenant member insert" on public.customer_outcomes;
create policy "customer outcomes tenant member insert"
on public.customer_outcomes for insert to authenticated
with check (
  exists (
    select 1 from public.customer_memberships m
    where m.tenant_id = customer_outcomes.tenant_id
      and m.user_id = (select auth.uid())
  )
);

drop policy if exists "customer outcomes owner admin update" on public.customer_outcomes;
create policy "customer outcomes owner admin update"
on public.customer_outcomes for update to authenticated
using (
  exists (
    select 1 from public.customer_memberships m
    where m.tenant_id = customer_outcomes.tenant_id
      and m.user_id = (select auth.uid())
      and m.role in ('owner','admin')
  )
)
with check (
  exists (
    select 1 from public.customer_memberships m
    where m.tenant_id = customer_outcomes.tenant_id
      and m.user_id = (select auth.uid())
      and m.role in ('owner','admin')
  )
);