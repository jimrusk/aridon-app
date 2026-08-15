-- Aridon intelligence routes now use the signed-in user's JWT instead of relying on
-- server service-role database access. These policies keep every query tenant-scoped.

grant select on table public.customer_memberships to authenticated;
grant select on table public.customer_tenants to authenticated;
grant select, insert, update on table public.customer_intelligence_profiles to authenticated;
grant select, insert, update on table public.customer_intelligence_runs to authenticated;
grant select, insert, update on table public.customer_intelligence_leads to authenticated;

drop policy if exists "customer can read attached tenants" on public.customer_tenants;
create policy "customer can read attached tenants"
on public.customer_tenants
for select
to authenticated
using (
  exists (
    select 1
    from public.customer_memberships membership
    where membership.tenant_id = customer_tenants.id
      and membership.user_id = auth.uid()
  )
);

drop policy if exists "customer can read intelligence profiles" on public.customer_intelligence_profiles;
create policy "customer can read intelligence profiles"
on public.customer_intelligence_profiles
for select
to authenticated
using (
  exists (
    select 1 from public.customer_memberships membership
    where membership.tenant_id = customer_intelligence_profiles.tenant_id
      and membership.user_id = auth.uid()
  )
);

drop policy if exists "customer can insert intelligence profiles" on public.customer_intelligence_profiles;
create policy "customer can insert intelligence profiles"
on public.customer_intelligence_profiles
for insert
to authenticated
with check (
  exists (
    select 1 from public.customer_memberships membership
    where membership.tenant_id = customer_intelligence_profiles.tenant_id
      and membership.user_id = auth.uid()
  )
  and created_by = auth.uid()
);

drop policy if exists "customer can update intelligence profiles" on public.customer_intelligence_profiles;
create policy "customer can update intelligence profiles"
on public.customer_intelligence_profiles
for update
to authenticated
using (
  exists (
    select 1 from public.customer_memberships membership
    where membership.tenant_id = customer_intelligence_profiles.tenant_id
      and membership.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.customer_memberships membership
    where membership.tenant_id = customer_intelligence_profiles.tenant_id
      and membership.user_id = auth.uid()
  )
);

drop policy if exists "customer can read intelligence runs" on public.customer_intelligence_runs;
create policy "customer can read intelligence runs"
on public.customer_intelligence_runs
for select
to authenticated
using (
  exists (
    select 1 from public.customer_memberships membership
    where membership.tenant_id = customer_intelligence_runs.tenant_id
      and membership.user_id = auth.uid()
  )
);

drop policy if exists "customer can insert intelligence runs" on public.customer_intelligence_runs;
create policy "customer can insert intelligence runs"
on public.customer_intelligence_runs
for insert
to authenticated
with check (
  exists (
    select 1 from public.customer_memberships membership
    where membership.tenant_id = customer_intelligence_runs.tenant_id
      and membership.user_id = auth.uid()
  )
  and user_id = auth.uid()
);

drop policy if exists "customer can update intelligence runs" on public.customer_intelligence_runs;
create policy "customer can update intelligence runs"
on public.customer_intelligence_runs
for update
to authenticated
using (
  exists (
    select 1 from public.customer_memberships membership
    where membership.tenant_id = customer_intelligence_runs.tenant_id
      and membership.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.customer_memberships membership
    where membership.tenant_id = customer_intelligence_runs.tenant_id
      and membership.user_id = auth.uid()
  )
);

drop policy if exists "customer can read intelligence leads" on public.customer_intelligence_leads;
create policy "customer can read intelligence leads"
on public.customer_intelligence_leads
for select
to authenticated
using (
  exists (
    select 1 from public.customer_memberships membership
    where membership.tenant_id = customer_intelligence_leads.tenant_id
      and membership.user_id = auth.uid()
  )
);

drop policy if exists "customer can insert intelligence leads" on public.customer_intelligence_leads;
create policy "customer can insert intelligence leads"
on public.customer_intelligence_leads
for insert
to authenticated
with check (
  exists (
    select 1 from public.customer_memberships membership
    where membership.tenant_id = customer_intelligence_leads.tenant_id
      and membership.user_id = auth.uid()
  )
  and created_by = auth.uid()
);

drop policy if exists "customer can update intelligence leads" on public.customer_intelligence_leads;
create policy "customer can update intelligence leads"
on public.customer_intelligence_leads
for update
to authenticated
using (
  exists (
    select 1 from public.customer_memberships membership
    where membership.tenant_id = customer_intelligence_leads.tenant_id
      and membership.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.customer_memberships membership
    where membership.tenant_id = customer_intelligence_leads.tenant_id
      and membership.user_id = auth.uid()
  )
);
