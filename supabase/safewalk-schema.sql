-- ============================================================================
-- SafeWalk backend schema
-- Paste this whole file into the Supabase SQL editor (one run).
--
-- RLS is ENABLED on all tables with NO public policies. The Next.js API
-- routes use the Supabase SERVICE ROLE key (server-only, never in the
-- browser), which bypasses RLS. Do not add permissive policies unless you
-- also move these routes to user-scoped auth.
-- ============================================================================

-- Trips -----------------------------------------------------------------------
create table if not exists public.safewalk_trips (
  id uuid primary key default gen_random_uuid(),
  user_name text not null,
  guardians jsonb not null default '[]',
  guardian_token text unique not null,
  trip_secret text not null,
  status text not null default 'active',
  check_in_at timestamptz not null,
  last_lat double precision,
  last_lng double precision,
  last_loc_at timestamptz,
  sos_at timestamptz,
  escalated_at timestamptz,
  ended_at timestamptz,
  created_at timestamptz not null default now()
);

-- Location history (latest point is also mirrored on safewalk_trips) ---------
create table if not exists public.safewalk_locations (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.safewalk_trips(id) on delete cascade,
  lat double precision not null,
  lng double precision not null,
  accuracy double precision,
  created_at timestamptz not null default now()
);
create index if not exists safewalk_locations_trip_id_idx
  on public.safewalk_locations (trip_id);

-- Event timeline (created / extended / arrived / sos / escalation / audio) ---
create table if not exists public.safewalk_events (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.safewalk_trips(id) on delete cascade,
  type text not null,
  detail jsonb not null default '{}',
  created_at timestamptz not null default now()
);
create index if not exists safewalk_events_trip_id_idx
  on public.safewalk_events (trip_id);

-- Row Level Security: on, with no public policies (service role bypasses) ---
alter table public.safewalk_trips enable row level security;
alter table public.safewalk_locations enable row level security;
alter table public.safewalk_events enable row level security;

-- Private storage bucket for SOS audio --------------------------------------
insert into storage.buckets (id, name, public)
values ('safewalk-audio', 'safewalk-audio', false)
on conflict (id) do nothing;
