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
grant select, insert, update, delete on table public.marketing_autopilot_actions to service_role;

-- Aridon's production Supabase credential currently resolves to the low-privilege Data API role.
-- These grants keep the Autopilot operational without granting access to any other Aridon table.
-- The data stored here is limited to public website diagnostics, generated recommendations and
-- approval state. Approval state never executes external sends, publishes content or changes ad spend.

grant select (id,created_at,trigger,business_name,status,health_score,snapshot,report,source)
  on public.marketing_autopilot_runs to anon, authenticated;
grant insert (trigger,business_name,status,health_score,snapshot,report,source,user_id,tenant_id)
  on public.marketing_autopilot_runs to anon, authenticated;

drop policy if exists marketing_autopilot_runs_read on public.marketing_autopilot_runs;
create policy marketing_autopilot_runs_read
  on public.marketing_autopilot_runs for select to anon, authenticated using (true);

drop policy if exists marketing_autopilot_runs_insert on public.marketing_autopilot_runs;
create policy marketing_autopilot_runs_insert
  on public.marketing_autopilot_runs for insert to anon, authenticated
  with check (
    user_id is null and tenant_id is null and
    source = 'aridon-growth-desk' and status = 'completed' and
    trigger in ('manual','daily','connector') and
    health_score between 0 and 100 and
    char_length(business_name) between 1 and 160 and
    pg_column_size(snapshot) <= 200000 and pg_column_size(report) <= 200000
  );

grant select (id,run_id,created_at,channel,action_type,title,detail,risk,approval_required,status)
  on public.marketing_autopilot_actions to anon, authenticated;
grant insert (run_id,channel,action_type,title,detail,risk,approval_required,status,payload)
  on public.marketing_autopilot_actions to anon, authenticated;
grant update (status) on public.marketing_autopilot_actions to anon, authenticated;

drop policy if exists marketing_autopilot_actions_read on public.marketing_autopilot_actions;
create policy marketing_autopilot_actions_read
  on public.marketing_autopilot_actions for select to anon, authenticated using (true);

drop policy if exists marketing_autopilot_actions_insert on public.marketing_autopilot_actions;
create policy marketing_autopilot_actions_insert
  on public.marketing_autopilot_actions for insert to anon, authenticated
  with check (
    status = 'queued' and risk in ('low','medium','high') and
    char_length(channel) between 1 and 100 and
    char_length(action_type) between 1 and 120 and
    char_length(title) between 1 and 400 and
    coalesce(char_length(detail),0) <= 1000 and
    pg_column_size(payload) <= 50000
  );

drop policy if exists marketing_autopilot_actions_review on public.marketing_autopilot_actions;
create policy marketing_autopilot_actions_review
  on public.marketing_autopilot_actions for update to anon, authenticated
  using (approval_required = true and status = 'queued')
  with check (approval_required = true and status in ('approved','rejected'));

-- Database-side rate limiting protects the two low-privilege write surfaces from abuse.
create schema if not exists private;
revoke all on schema private from public;

create or replace function private.marketing_autopilot_rate_limit()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare v_count integer;
begin
  if tg_table_name = 'marketing_autopilot_runs' then
    select count(*) into v_count
      from public.marketing_autopilot_runs
      where created_at > now() - interval '1 minute';
    if v_count >= 20 then raise exception 'marketing autopilot run rate limit'; end if;
  elsif tg_table_name = 'marketing_autopilot_actions' then
    select count(*) into v_count
      from public.marketing_autopilot_actions
      where created_at > now() - interval '1 minute';
    if v_count >= 120 then raise exception 'marketing autopilot action rate limit'; end if;
  end if;
  return new;
end;
$$;

revoke all on function private.marketing_autopilot_rate_limit() from public, anon, authenticated;

drop trigger if exists marketing_autopilot_runs_rate_limit on public.marketing_autopilot_runs;
create trigger marketing_autopilot_runs_rate_limit
  before insert on public.marketing_autopilot_runs
  for each row execute function private.marketing_autopilot_rate_limit();

drop trigger if exists marketing_autopilot_actions_rate_limit on public.marketing_autopilot_actions;
create trigger marketing_autopilot_actions_rate_limit
  before insert on public.marketing_autopilot_actions
  for each row execute function private.marketing_autopilot_rate_limit();
