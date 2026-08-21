-- Aridon Ag Greenhouse Growing OS
-- Production migration: add_greenhouse_growing_os

create table if not exists public.greenhouse_facilities (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  location text not null default '',
  structure_type text not null default 'greenhouse',
  area_sqft numeric not null default 0,
  growing_system text not null default 'mixed',
  notes text not null default '',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.greenhouse_zones (
  id uuid primary key default gen_random_uuid(),
  facility_id uuid not null references public.greenhouse_facilities(id) on delete cascade,
  name text not null,
  crop text not null default '',
  variety text not null default '',
  growth_stage text not null default 'planning',
  planting_date date,
  target_harvest_date date,
  plant_count integer not null default 0,
  area_sqft numeric not null default 0,
  growing_system text not null default 'soil',
  substrate text not null default '',
  irrigation_method text not null default '',
  target_profile jsonb not null default '{}'::jsonb,
  notes text not null default '',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.greenhouse_readings (
  id uuid primary key default gen_random_uuid(),
  facility_id uuid not null references public.greenhouse_facilities(id) on delete cascade,
  zone_id uuid not null references public.greenhouse_zones(id) on delete cascade,
  recorded_at timestamptz not null default now(),
  source text not null default 'manual',
  air_temp_f numeric,
  humidity_pct numeric,
  vpd_kpa numeric,
  co2_ppm numeric,
  ppfd_umol_m2_s numeric,
  dli_mol_m2_day numeric,
  root_zone_temp_f numeric,
  substrate_moisture_pct numeric,
  ph numeric,
  ec_ms_cm numeric,
  irrigation_gallons numeric,
  runoff_pct numeric,
  dissolved_oxygen_mg_l numeric,
  notes text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.greenhouse_activities (
  id uuid primary key default gen_random_uuid(),
  facility_id uuid not null references public.greenhouse_facilities(id) on delete cascade,
  zone_id uuid references public.greenhouse_zones(id) on delete cascade,
  activity_date timestamptz not null default now(),
  activity_type text not null default 'note',
  product_or_material text not null default '',
  quantity numeric,
  unit text not null default '',
  labor_hours numeric,
  cost numeric,
  scout_result text not null default '',
  notes text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.greenhouse_harvests (
  id uuid primary key default gen_random_uuid(),
  facility_id uuid not null references public.greenhouse_facilities(id) on delete cascade,
  zone_id uuid not null references public.greenhouse_zones(id) on delete cascade,
  harvest_date date not null default current_date,
  marketable_lb numeric not null default 0,
  cull_lb numeric not null default 0,
  units_harvested numeric not null default 0,
  unit_name text not null default 'lb',
  sale_price_per_unit numeric not null default 0,
  revenue numeric not null default 0,
  labor_hours numeric not null default 0,
  notes text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.greenhouse_tasks (
  id uuid primary key default gen_random_uuid(),
  facility_id uuid not null references public.greenhouse_facilities(id) on delete cascade,
  zone_id uuid references public.greenhouse_zones(id) on delete cascade,
  title text not null,
  task_type text not null default 'crop',
  priority text not null default 'medium' check (priority in ('low','medium','high','critical')),
  status text not null default 'open' check (status in ('open','in_progress','done','blocked')),
  due_at timestamptz,
  assigned_to text not null default '',
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists greenhouse_zones_facility_idx on public.greenhouse_zones(facility_id, active, updated_at desc);
create index if not exists greenhouse_readings_zone_time_idx on public.greenhouse_readings(zone_id, recorded_at desc);
create index if not exists greenhouse_readings_facility_time_idx on public.greenhouse_readings(facility_id, recorded_at desc);
create index if not exists greenhouse_activities_zone_time_idx on public.greenhouse_activities(zone_id, activity_date desc);
create index if not exists greenhouse_activities_facility_time_idx on public.greenhouse_activities(facility_id, activity_date desc);
create index if not exists greenhouse_harvests_zone_date_idx on public.greenhouse_harvests(zone_id, harvest_date desc);
create index if not exists greenhouse_harvests_facility_date_idx on public.greenhouse_harvests(facility_id, harvest_date desc);
create index if not exists greenhouse_tasks_facility_status_idx on public.greenhouse_tasks(facility_id, status, due_at);

alter table public.greenhouse_facilities enable row level security;
alter table public.greenhouse_zones enable row level security;
alter table public.greenhouse_readings enable row level security;
alter table public.greenhouse_activities enable row level security;
alter table public.greenhouse_harvests enable row level security;
alter table public.greenhouse_tasks enable row level security;
