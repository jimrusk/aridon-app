create extension if not exists pgcrypto;

create table if not exists public.enterprise_scans (
  id uuid primary key default gen_random_uuid(),
  run_id text not null unique,
  tenant_id uuid references public.customer_tenants(id) on delete set null,
  actor_id uuid references auth.users(id) on delete set null,
  request_id text not null,
  input_payload jsonb not null default '{}'::jsonb,
  output_payload jsonb not null default '{}'::jsonb,
  model_lineage jsonb not null default '{}'::jsonb,
  evidence_hashes jsonb not null default '{}'::jsonb,
  state text not null default 'completed',
  created_at timestamptz not null default now()
);

create index if not exists enterprise_scans_tenant_created_idx on public.enterprise_scans (tenant_id, created_at desc);
create index if not exists enterprise_scans_actor_created_idx on public.enterprise_scans (actor_id, created_at desc);
create index if not exists enterprise_scans_request_idx on public.enterprise_scans (request_id);

create table if not exists public.audit_events (
  id bigint generated always as identity primary key,
  event_id uuid not null unique,
  tenant_id uuid references public.customer_tenants(id) on delete set null,
  actor_id uuid references auth.users(id) on delete set null,
  request_id text not null,
  session_id text,
  run_id text not null,
  action text not null,
  previous_state text,
  new_state text,
  parameters jsonb not null default '{}'::jsonb,
  model_lineage jsonb not null default '{}'::jsonb,
  evidence_hashes jsonb not null default '{}'::jsonb,
  artifact_type text,
  artifact_id uuid,
  result_status text not null check (result_status in ('success','failure','pending')),
  created_at timestamptz not null default now()
);

create index if not exists audit_events_tenant_created_idx on public.audit_events (tenant_id, created_at desc);
create index if not exists audit_events_actor_created_idx on public.audit_events (actor_id, created_at desc);
create index if not exists audit_events_request_idx on public.audit_events (request_id);
create index if not exists audit_events_run_idx on public.audit_events (run_id);
create index if not exists audit_events_artifact_idx on public.audit_events (artifact_type, artifact_id);

create table if not exists public.pre_call_briefs (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references public.customer_tenants(id) on delete set null,
  actor_id uuid references auth.users(id) on delete set null,
  request_id text not null,
  content jsonb not null default '{}'::jsonb,
  model_lineage jsonb not null default '{}'::jsonb,
  evidence_hashes jsonb not null default '{}'::jsonb,
  state text not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists pre_call_briefs_tenant_updated_idx on public.pre_call_briefs (tenant_id, updated_at desc);
create index if not exists pre_call_briefs_actor_updated_idx on public.pre_call_briefs (actor_id, updated_at desc);

create table if not exists public.enterprise_rate_limits (
  rate_key text primary key,
  window_started_at timestamptz not null default now(),
  request_count integer not null default 0,
  updated_at timestamptz not null default now()
);

alter table public.enterprise_scans enable row level security;
alter table public.audit_events enable row level security;
alter table public.pre_call_briefs enable row level security;
alter table public.enterprise_rate_limits enable row level security;

revoke all on public.enterprise_scans from anon, authenticated;
revoke all on public.audit_events from anon, authenticated;
revoke all on public.pre_call_briefs from anon, authenticated;
revoke all on public.enterprise_rate_limits from anon, authenticated;

create or replace function public.consume_enterprise_rate_limit(
  p_rate_key text,
  p_limit integer,
  p_window_seconds integer
)
returns table(allowed boolean, remaining integer, retry_after integer)
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_now timestamptz := now();
  v_count integer;
  v_started timestamptz;
begin
  insert into public.enterprise_rate_limits(rate_key, window_started_at, request_count, updated_at)
  values (p_rate_key, v_now, 1, v_now)
  on conflict (rate_key) do update
  set
    window_started_at = case
      when public.enterprise_rate_limits.window_started_at <= v_now - make_interval(secs => p_window_seconds)
      then v_now else public.enterprise_rate_limits.window_started_at end,
    request_count = case
      when public.enterprise_rate_limits.window_started_at <= v_now - make_interval(secs => p_window_seconds)
      then 1 else public.enterprise_rate_limits.request_count + 1 end,
    updated_at = v_now
  returning request_count, window_started_at into v_count, v_started;

  allowed := v_count <= p_limit;
  remaining := greatest(p_limit - v_count, 0);
  retry_after := case when allowed then 0 else greatest(1, ceil(extract(epoch from ((v_started + make_interval(secs => p_window_seconds)) - v_now)))::integer) end;
  return next;
end;
$$;

revoke all on function public.consume_enterprise_rate_limit(text, integer, integer) from public, anon, authenticated;
grant execute on function public.consume_enterprise_rate_limit(text, integer, integer) to service_role;
