-- Aridon Wildfire + Watershed Resilience Grid
-- Production data model for treatment prioritization, execution, biomass routing, workforce and verification.
-- Uses the existing customer_tenants/customer_memberships authorization layer.

create table if not exists public.wildfire_programs (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.customer_tenants(id) on delete cascade,
  name text not null,
  region text,
  annual_target_acres integer not null default 0 check (annual_target_acres >= 0),
  status text not null default 'planning' check (status in ('planning','active','paused','complete')),
  created_by uuid not null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.wildfire_zones (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.customer_tenants(id) on delete cascade,
  program_id uuid not null references public.wildfire_programs(id) on delete cascade,
  name text not null,
  region text,
  acres numeric(12,2) not null default 0 check (acres >= 0),
  wildfire_risk smallint not null default 0 check (wildfire_risk between 0 and 100),
  exposure smallint not null default 0 check (exposure between 0 and 100),
  water_value smallint not null default 0 check (water_value between 0 and 100),
  readiness smallint not null default 0 check (readiness between 0 and 100),
  biomass_value smallint not null default 0 check (biomass_value between 0 and 100),
  priority_score numeric(5,2) generated always as (
    wildfire_risk * 0.30 + exposure * 0.25 + water_value * 0.20 + readiness * 0.15 + biomass_value * 0.10
  ) stored,
  treatment_prescription text,
  geometry_geojson jsonb,
  authoritative_source text,
  source_observed_at timestamptz,
  next_review_at timestamptz,
  status text not null default 'candidate' check (status in ('candidate','approved','scheduled','in_progress','treated','maintenance_due','closed')),
  created_by uuid not null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.wildfire_treatments (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.customer_tenants(id) on delete cascade,
  zone_id uuid not null references public.wildfire_zones(id) on delete cascade,
  treatment_type text not null,
  planned_acres numeric(12,2) not null default 0 check (planned_acres >= 0),
  completed_acres numeric(12,2) not null default 0 check (completed_acres >= 0),
  contractor text,
  crew_name text,
  planned_start date,
  planned_finish date,
  actual_start date,
  actual_finish date,
  estimated_cost numeric(14,2) not null default 0 check (estimated_cost >= 0),
  actual_cost numeric(14,2) check (actual_cost is null or actual_cost >= 0),
  before_evidence jsonb not null default '[]'::jsonb,
  after_evidence jsonb not null default '[]'::jsonb,
  verification_status text not null default 'pending' check (verification_status in ('pending','field_verified','remote_verified','accepted','rejected')),
  maintenance_due_at date,
  notes text,
  created_by uuid not null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.wildfire_biomass_routes (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.customer_tenants(id) on delete cascade,
  treatment_id uuid not null references public.wildfire_treatments(id) on delete cascade,
  material_type text not null,
  estimated_dry_tons numeric(12,2) not null default 0 check (estimated_dry_tons >= 0),
  actual_dry_tons numeric(12,2) check (actual_dry_tons is null or actual_dry_tons >= 0),
  destination_name text,
  destination_type text,
  transport_miles numeric(10,2) check (transport_miles is null or transport_miles >= 0),
  unit_value numeric(12,2),
  offtake_status text not null default 'unassigned' check (offtake_status in ('unassigned','planned','contracted','delivered','rejected')),
  fallback_destination text,
  created_by uuid not null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.wildfire_capacity_assets (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.customer_tenants(id) on delete cascade,
  asset_type text not null check (asset_type in ('crew','equipment','yard','processor','training_partner')),
  name text not null,
  region text,
  owner_operator text,
  capacity_per_month numeric(12,2),
  capacity_unit text,
  availability_status text not null default 'unknown' check (availability_status in ('unknown','available','limited','committed','offline')),
  notes text,
  created_by uuid not null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.wildfire_funding_sources (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.customer_tenants(id) on delete cascade,
  name text not null,
  sponsor text,
  funding_type text,
  maximum_award numeric(14,2),
  match_percent numeric(6,2),
  deadline date,
  eligible_uses text,
  source_url text,
  status text not null default 'watching' check (status in ('watching','qualifying','applying','submitted','awarded','declined','closed')),
  created_by uuid not null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists wildfire_programs_tenant_idx on public.wildfire_programs(tenant_id, updated_at desc);
create index if not exists wildfire_zones_priority_idx on public.wildfire_zones(tenant_id, priority_score desc, status);
create index if not exists wildfire_treatments_zone_idx on public.wildfire_treatments(tenant_id, zone_id, created_at desc);
create index if not exists wildfire_biomass_routes_treatment_idx on public.wildfire_biomass_routes(tenant_id, treatment_id, created_at desc);
create index if not exists wildfire_capacity_assets_region_idx on public.wildfire_capacity_assets(tenant_id, region, asset_type);
create index if not exists wildfire_funding_sources_deadline_idx on public.wildfire_funding_sources(tenant_id, deadline, status);

alter table public.wildfire_programs enable row level security;
alter table public.wildfire_zones enable row level security;
alter table public.wildfire_treatments enable row level security;
alter table public.wildfire_biomass_routes enable row level security;
alter table public.wildfire_capacity_assets enable row level security;
alter table public.wildfire_funding_sources enable row level security;

grant select, insert, update, delete on public.wildfire_programs to authenticated;
grant select, insert, update, delete on public.wildfire_zones to authenticated;
grant select, insert, update, delete on public.wildfire_treatments to authenticated;
grant select, insert, update, delete on public.wildfire_biomass_routes to authenticated;
grant select, insert, update, delete on public.wildfire_capacity_assets to authenticated;
grant select, insert, update, delete on public.wildfire_funding_sources to authenticated;

-- Tenant membership policies. No anonymous access is granted.
do $$
declare
  t text;
begin
  foreach t in array array[
    'wildfire_programs',
    'wildfire_zones',
    'wildfire_treatments',
    'wildfire_biomass_routes',
    'wildfire_capacity_assets',
    'wildfire_funding_sources'
  ] loop
    execute format('drop policy if exists "wildfire tenant select" on public.%I', t);
    execute format(
      'create policy "wildfire tenant select" on public.%I for select to authenticated using (exists (select 1 from public.customer_memberships m where m.tenant_id = %I.tenant_id and m.user_id = (select auth.uid())))',
      t, t
    );

    execute format('drop policy if exists "wildfire tenant insert" on public.%I', t);
    execute format(
      'create policy "wildfire tenant insert" on public.%I for insert to authenticated with check (exists (select 1 from public.customer_memberships m where m.tenant_id = %I.tenant_id and m.user_id = (select auth.uid())))',
      t, t
    );

    execute format('drop policy if exists "wildfire tenant update" on public.%I', t);
    execute format(
      'create policy "wildfire tenant update" on public.%I for update to authenticated using (exists (select 1 from public.customer_memberships m where m.tenant_id = %I.tenant_id and m.user_id = (select auth.uid()))) with check (exists (select 1 from public.customer_memberships m where m.tenant_id = %I.tenant_id and m.user_id = (select auth.uid())))',
      t, t, t
    );

    execute format('drop policy if exists "wildfire tenant delete" on public.%I', t);
    execute format(
      'create policy "wildfire tenant delete" on public.%I for delete to authenticated using (exists (select 1 from public.customer_memberships m where m.tenant_id = %I.tenant_id and m.user_id = (select auth.uid())))',
      t, t
    );
  end loop;
end $$;
