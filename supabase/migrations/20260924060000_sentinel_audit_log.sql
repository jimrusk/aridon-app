-- Aridon Sentinel — tamper-evident audit log (durable store).
--
-- Append-only by design: the application inserts entries and never updates or
-- deletes them. Row Level Security enforces insert-only access; there are
-- intentionally NO update or delete policies. Hash-chain verification happens
-- in application code (lib/sentinelAudit.ts) on every read.

create table if not exists public.sentinel_audit_log (
  seq bigint generated always as identity primary key,
  ts timestamptz not null default now(),
  tenant_id text not null,
  actor text not null,
  event_type text not null check (event_type in (
    'decision', 'approval', 'override', 'policy_change',
    'incident', 'pentest_run', 'chain_verification'
  )),
  summary text not null,
  details jsonb not null default '{}'::jsonb,
  prev_hash text not null,
  hash text not null
);

create index if not exists sentinel_audit_log_tenant_ts_idx
  on public.sentinel_audit_log (tenant_id, ts desc);

create index if not exists sentinel_audit_log_event_type_idx
  on public.sentinel_audit_log (event_type);

alter table public.sentinel_audit_log enable row level security;

-- Service role: full management (used by server-side API routes).
drop policy if exists sentinel_audit_log_service_all on public.sentinel_audit_log;
create policy sentinel_audit_log_service_all
  on public.sentinel_audit_log
  for all
  to service_role
  using (true)
  with check (true);

-- Authenticated application role: INSERT ONLY. No select/update/delete here;
-- reads go through server-side API routes that re-verify the hash chain.
drop policy if exists sentinel_audit_log_app_insert on public.sentinel_audit_log;
create policy sentinel_audit_log_app_insert
  on public.sentinel_audit_log
  for insert
  to authenticated
  with check (true);

-- NOTE: no update policy and no delete policy are created on purpose.
-- Any UPDATE or DELETE attempt is denied by default under RLS.
