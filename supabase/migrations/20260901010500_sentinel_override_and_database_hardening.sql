alter table public.sentinel_security_policies
  add column if not exists authority_hold boolean not null default false,
  add column if not exists authority_hold_until timestamptz,
  add column if not exists authority_hold_reason text,
  add column if not exists authority_hold_set_by uuid references auth.users(id) on delete set null,
  add column if not exists authority_hold_set_at timestamptz;

alter table public.sentinel_incidents drop constraint if exists sentinel_incidents_authority_escalation_status_check;
alter table public.sentinel_incidents add constraint sentinel_incidents_authority_escalation_status_check
  check (authority_escalation_status in ('not_required','prepared','approval_required','dispatching','reported','failed','held_by_override','cancelled'));

alter table public.sentinel_authority_reports drop constraint if exists sentinel_authority_reports_status_check;
alter table public.sentinel_authority_reports add constraint sentinel_authority_reports_status_check
  check (status in ('prepared','approval_required','dispatching','sent','failed','not_applicable','held','cancelled'));

create table if not exists public.sentinel_override_events (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.customer_tenants(id) on delete cascade,
  incident_id uuid references public.sentinel_incidents(id) on delete cascade,
  action text not null check (action in ('company_hold_enabled','company_hold_disabled','incident_held','incident_resumed','false_positive')),
  reason text not null,
  previous_state jsonb not null default '{}'::jsonb,
  new_state jsonb not null default '{}'::jsonb,
  actor_user_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists sentinel_override_events_tenant_created_idx on public.sentinel_override_events(tenant_id, created_at desc);
create index if not exists sentinel_override_events_incident_idx on public.sentinel_override_events(incident_id, created_at desc);

alter table public.sentinel_override_events enable row level security;
revoke all on public.sentinel_override_events from anon, authenticated;
grant select on public.sentinel_override_events to authenticated;

drop policy if exists "sentinel override select" on public.sentinel_override_events;
create policy "sentinel override select" on public.sentinel_override_events for select to authenticated
using (exists (select 1 from public.customer_memberships m where m.tenant_id = sentinel_override_events.tenant_id and m.user_id = (select auth.uid())));

alter table public.customer_agent_run_steps enable row level security;
alter table public.customer_agent_runs enable row level security;
alter table public.customer_agent_tool_registry enable row level security;
alter table public.customer_call_campaigns enable row level security;
alter table public.customer_call_events enable row level security;
alter table public.customer_call_suppression enable row level security;
alter table public.customer_call_targets enable row level security;
alter table public.customer_executive_memories enable row level security;
alter table public.customer_executive_reflections enable row level security;
alter table public.customer_technology_radar_items enable row level security;
alter table public.executives enable row level security;

do $$
declare t text;
begin
  foreach t in array array[
    'customer_agent_run_steps','customer_agent_runs','customer_call_campaigns','customer_call_events',
    'customer_call_suppression','customer_call_targets','customer_executive_memories',
    'customer_executive_reflections','customer_technology_radar_items'
  ] loop
    execute format('revoke all on public.%I from anon, authenticated', t);
    execute format('grant select, insert, update, delete on public.%I to authenticated', t);
    execute format('drop policy if exists "tenant member select" on public.%I', t);
    execute format('create policy "tenant member select" on public.%I for select to authenticated using (exists (select 1 from public.customer_memberships m where m.tenant_id = %I.tenant_id and m.user_id = (select auth.uid())))', t, t);
    execute format('drop policy if exists "tenant member insert" on public.%I', t);
    execute format('create policy "tenant member insert" on public.%I for insert to authenticated with check (exists (select 1 from public.customer_memberships m where m.tenant_id = %I.tenant_id and m.user_id = (select auth.uid())))', t, t);
    execute format('drop policy if exists "tenant member update" on public.%I', t);
    execute format('create policy "tenant member update" on public.%I for update to authenticated using (exists (select 1 from public.customer_memberships m where m.tenant_id = %I.tenant_id and m.user_id = (select auth.uid()))) with check (exists (select 1 from public.customer_memberships m where m.tenant_id = %I.tenant_id and m.user_id = (select auth.uid())))', t, t, t);
    execute format('drop policy if exists "tenant member delete" on public.%I', t);
    execute format('create policy "tenant member delete" on public.%I for delete to authenticated using (exists (select 1 from public.customer_memberships m where m.tenant_id = %I.tenant_id and m.user_id = (select auth.uid())))', t, t);
  end loop;
end $$;

revoke all on public.customer_agent_tool_registry from anon, authenticated;
grant select on public.customer_agent_tool_registry to authenticated;
drop policy if exists "authenticated read tool registry" on public.customer_agent_tool_registry;
create policy "authenticated read tool registry" on public.customer_agent_tool_registry for select to authenticated using (true);

revoke all on public.executives from anon, authenticated;
grant select on public.executives to authenticated;
drop policy if exists "authenticated read executives" on public.executives;
create policy "authenticated read executives" on public.executives for select to authenticated using (true);

revoke execute on function public.seed_beta_invite_context() from public, anon, authenticated;
revoke execute on function public.seed_customer_owner_identity() from public, anon, authenticated;
revoke execute on function public.touch_pinned_customer_knowledge() from public, anon, authenticated;

revoke execute on function public.sms_apply_eva_triage(text,text,text,numeric,text,text) from public, anon, authenticated;
revoke execute on function public.sms_gateway_status() from public, anon, authenticated;
revoke execute on function public.sms_owner_send(text,text,text,text,boolean) from public, anon, authenticated;
revoke execute on function public.sms_owner_snapshot(text) from public, anon, authenticated;
revoke execute on function public.sms_owner_update_contact(text,uuid,text,text,text,boolean) from public, anon, authenticated;
revoke execute on function public.sms_pair_browser(text) from public, anon, authenticated;
revoke execute on function public.sms_pair_gateway(text,text,text,text) from public, anon, authenticated;
revoke execute on function public.sms_textbee_ingest(text,text) from public, anon, authenticated;
revoke execute on function public.sms_textbee_reply(text,text,text) from public, anon, authenticated;

grant execute on function public.sms_apply_eva_triage(text,text,text,numeric,text,text) to service_role;
grant execute on function public.sms_gateway_status() to service_role;
grant execute on function public.sms_owner_send(text,text,text,text,boolean) to service_role;
grant execute on function public.sms_owner_snapshot(text) to service_role;
grant execute on function public.sms_owner_update_contact(text,uuid,text,text,text,boolean) to service_role;
grant execute on function public.sms_pair_browser(text) to service_role;
grant execute on function public.sms_pair_gateway(text,text,text,text) to service_role;
grant execute on function public.sms_textbee_ingest(text,text) to service_role;
grant execute on function public.sms_textbee_reply(text,text,text) to service_role;