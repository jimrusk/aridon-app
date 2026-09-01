create table if not exists public.sentinel_security_policies (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null unique references public.customer_tenants(id) on delete cascade,
  escalation_mode text not null default 'approval_required' check (escalation_mode in ('prepare_only','approval_required','automatic_critical')),
  automatic_score_threshold integer not null default 95 check (automatic_score_threshold between 80 and 100),
  automatic_confidence_threshold integer not null default 90 check (automatic_confidence_threshold between 80 and 100),
  notify_cisa boolean not null default true,
  notify_fbi boolean not null default true,
  local_authority_name text,
  local_authority_email text,
  legal_contact_email text,
  security_contact_email text,
  custom_authority_webhook_url text,
  preserve_evidence boolean not null default true,
  evidence_retention_days integer not null default 2555 check (evidence_retention_days between 30 and 3650),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.sentinel_incidents (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.customer_tenants(id) on delete cascade,
  source text not null default 'aridon_sentinel',
  title text not null,
  summary text not null,
  incident_type text not null default 'unauthorized_access',
  severity text not null check (severity in ('low','medium','high','critical')),
  risk_score integer not null check (risk_score between 0 and 100),
  confidence integer not null check (confidence between 0 and 100),
  status text not null default 'detected' check (status in ('detected','contained','investigating','reported','resolved','false_positive')),
  actor_profile jsonb not null default '{}'::jsonb,
  indicators jsonb not null default '[]'::jsonb,
  affected_assets jsonb not null default '[]'::jsonb,
  evidence jsonb not null default '{}'::jsonb,
  containment_actions jsonb not null default '[]'::jsonb,
  evidence_sha256 text not null,
  authority_escalation_status text not null default 'not_required' check (authority_escalation_status in ('not_required','prepared','approval_required','dispatching','reported','failed')),
  occurred_at timestamptz,
  detected_at timestamptz not null default now(),
  contained_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.sentinel_authority_reports (
  id uuid primary key default gen_random_uuid(),
  incident_id uuid not null references public.sentinel_incidents(id) on delete cascade,
  tenant_id uuid not null references public.customer_tenants(id) on delete cascade,
  authority text not null,
  destination text not null,
  delivery_method text not null check (delivery_method in ('email','webhook','portal','phone','manual')),
  status text not null default 'prepared' check (status in ('prepared','approval_required','dispatching','sent','failed','not_applicable')),
  report_payload jsonb not null default '{}'::jsonb,
  external_reference text,
  submitted_at timestamptz,
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists sentinel_incidents_tenant_detected_idx on public.sentinel_incidents(tenant_id, detected_at desc);
create index if not exists sentinel_incidents_tenant_status_idx on public.sentinel_incidents(tenant_id, status, severity);
create index if not exists sentinel_authority_reports_incident_idx on public.sentinel_authority_reports(incident_id, status);

alter table public.sentinel_security_policies enable row level security;
alter table public.sentinel_incidents enable row level security;
alter table public.sentinel_authority_reports enable row level security;

revoke all on public.sentinel_security_policies from anon, authenticated;
revoke all on public.sentinel_incidents from anon, authenticated;
revoke all on public.sentinel_authority_reports from anon, authenticated;

grant select, insert, update on public.sentinel_security_policies to authenticated;
grant select, insert, update on public.sentinel_incidents to authenticated;
grant select on public.sentinel_authority_reports to authenticated;

drop policy if exists "sentinel policy select" on public.sentinel_security_policies;
create policy "sentinel policy select" on public.sentinel_security_policies for select to authenticated
using (exists (select 1 from public.customer_memberships m where m.tenant_id = sentinel_security_policies.tenant_id and m.user_id = (select auth.uid())));

drop policy if exists "sentinel policy insert" on public.sentinel_security_policies;
create policy "sentinel policy insert" on public.sentinel_security_policies for insert to authenticated
with check (exists (select 1 from public.customer_memberships m where m.tenant_id = sentinel_security_policies.tenant_id and m.user_id = (select auth.uid())));

drop policy if exists "sentinel policy update" on public.sentinel_security_policies;
create policy "sentinel policy update" on public.sentinel_security_policies for update to authenticated
using (exists (select 1 from public.customer_memberships m where m.tenant_id = sentinel_security_policies.tenant_id and m.user_id = (select auth.uid())))
with check (exists (select 1 from public.customer_memberships m where m.tenant_id = sentinel_security_policies.tenant_id and m.user_id = (select auth.uid())));

drop policy if exists "sentinel incident select" on public.sentinel_incidents;
create policy "sentinel incident select" on public.sentinel_incidents for select to authenticated
using (exists (select 1 from public.customer_memberships m where m.tenant_id = sentinel_incidents.tenant_id and m.user_id = (select auth.uid())));

drop policy if exists "sentinel incident insert" on public.sentinel_incidents;
create policy "sentinel incident insert" on public.sentinel_incidents for insert to authenticated
with check (exists (select 1 from public.customer_memberships m where m.tenant_id = sentinel_incidents.tenant_id and m.user_id = (select auth.uid())));

drop policy if exists "sentinel incident update" on public.sentinel_incidents;
create policy "sentinel incident update" on public.sentinel_incidents for update to authenticated
using (exists (select 1 from public.customer_memberships m where m.tenant_id = sentinel_incidents.tenant_id and m.user_id = (select auth.uid())))
with check (exists (select 1 from public.customer_memberships m where m.tenant_id = sentinel_incidents.tenant_id and m.user_id = (select auth.uid())));

drop policy if exists "sentinel authority report select" on public.sentinel_authority_reports;
create policy "sentinel authority report select" on public.sentinel_authority_reports for select to authenticated
using (exists (select 1 from public.customer_memberships m where m.tenant_id = sentinel_authority_reports.tenant_id and m.user_id = (select auth.uid())));
