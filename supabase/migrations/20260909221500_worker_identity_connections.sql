create table if not exists public.customer_browser_identities (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.customer_tenants(id) on delete cascade,
  created_by uuid references auth.users(id) on delete set null,
  name text not null,
  site_name text,
  login_url text,
  home_url text,
  context_id text not null,
  status text not null default 'new',
  last_session_id text,
  last_verified_at timestamptz,
  last_used_at timestamptz,
  session_lease_until timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, context_id)
);

create index if not exists customer_browser_identities_tenant_status_idx
  on public.customer_browser_identities (tenant_id, status, updated_at desc);

create table if not exists public.customer_direct_integrations (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.customer_tenants(id) on delete cascade,
  created_by uuid references auth.users(id) on delete set null,
  provider text not null,
  label text,
  encrypted_secret text,
  status text not null default 'connected',
  metadata jsonb not null default '{}'::jsonb,
  last_verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, provider)
);

create index if not exists customer_direct_integrations_tenant_provider_idx
  on public.customer_direct_integrations (tenant_id, provider, status);

alter table public.customer_cloud_workers
  add column if not exists browser_identity_id uuid references public.customer_browser_identities(id) on delete set null;

create index if not exists customer_cloud_workers_browser_identity_idx
  on public.customer_cloud_workers (browser_identity_id, status, updated_at desc);

alter table public.customer_browser_identities enable row level security;
alter table public.customer_direct_integrations enable row level security;

revoke all on table public.customer_browser_identities from anon;
revoke all on table public.customer_direct_integrations from anon;
grant select, insert, update, delete on table public.customer_browser_identities to authenticated;
grant select, insert, update, delete on table public.customer_direct_integrations to authenticated;

drop policy if exists "browser identities tenant member select" on public.customer_browser_identities;
create policy "browser identities tenant member select"
on public.customer_browser_identities for select to authenticated
using (
  exists (
    select 1 from public.customer_memberships m
    where m.tenant_id = customer_browser_identities.tenant_id
      and m.user_id = (select auth.uid())
  )
);

drop policy if exists "browser identities owner admin insert" on public.customer_browser_identities;
create policy "browser identities owner admin insert"
on public.customer_browser_identities for insert to authenticated
with check (
  exists (
    select 1 from public.customer_memberships m
    where m.tenant_id = customer_browser_identities.tenant_id
      and m.user_id = (select auth.uid())
      and m.role in ('owner','admin')
  )
  and (created_by is null or created_by = (select auth.uid()))
);

drop policy if exists "browser identities owner admin update" on public.customer_browser_identities;
create policy "browser identities owner admin update"
on public.customer_browser_identities for update to authenticated
using (
  exists (
    select 1 from public.customer_memberships m
    where m.tenant_id = customer_browser_identities.tenant_id
      and m.user_id = (select auth.uid())
      and m.role in ('owner','admin')
  )
)
with check (
  exists (
    select 1 from public.customer_memberships m
    where m.tenant_id = customer_browser_identities.tenant_id
      and m.user_id = (select auth.uid())
      and m.role in ('owner','admin')
  )
);

drop policy if exists "browser identities owner admin delete" on public.customer_browser_identities;
create policy "browser identities owner admin delete"
on public.customer_browser_identities for delete to authenticated
using (
  exists (
    select 1 from public.customer_memberships m
    where m.tenant_id = customer_browser_identities.tenant_id
      and m.user_id = (select auth.uid())
      and m.role in ('owner','admin')
  )
);

drop policy if exists "direct integrations tenant member select" on public.customer_direct_integrations;
create policy "direct integrations tenant member select"
on public.customer_direct_integrations for select to authenticated
using (
  exists (
    select 1 from public.customer_memberships m
    where m.tenant_id = customer_direct_integrations.tenant_id
      and m.user_id = (select auth.uid())
  )
);

drop policy if exists "direct integrations owner admin insert" on public.customer_direct_integrations;
create policy "direct integrations owner admin insert"
on public.customer_direct_integrations for insert to authenticated
with check (
  exists (
    select 1 from public.customer_memberships m
    where m.tenant_id = customer_direct_integrations.tenant_id
      and m.user_id = (select auth.uid())
      and m.role in ('owner','admin')
  )
  and (created_by is null or created_by = (select auth.uid()))
);

drop policy if exists "direct integrations owner admin update" on public.customer_direct_integrations;
create policy "direct integrations owner admin update"
on public.customer_direct_integrations for update to authenticated
using (
  exists (
    select 1 from public.customer_memberships m
    where m.tenant_id = customer_direct_integrations.tenant_id
      and m.user_id = (select auth.uid())
      and m.role in ('owner','admin')
  )
)
with check (
  exists (
    select 1 from public.customer_memberships m
    where m.tenant_id = customer_direct_integrations.tenant_id
      and m.user_id = (select auth.uid())
      and m.role in ('owner','admin')
  )
);

drop policy if exists "direct integrations owner admin delete" on public.customer_direct_integrations;
create policy "direct integrations owner admin delete"
on public.customer_direct_integrations for delete to authenticated
using (
  exists (
    select 1 from public.customer_memberships m
    where m.tenant_id = customer_direct_integrations.tenant_id
      and m.user_id = (select auth.uid())
      and m.role in ('owner','admin')
  )
);