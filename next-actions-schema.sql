-- Persistent Aridon Next Moves schema.
-- Production migration applied 2026-09-04 to Supabase project pkshvdobcsoowlkoolmt.

create table if not exists public.aridon_next_actions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.customer_tenants(id) on delete cascade,
  slug text not null,
  priority text not null default 'MEDIUM' check (priority in ('HIGH','MEDIUM','WATCH')),
  lane text not null,
  company text not null,
  person text,
  title text,
  email text,
  phone text,
  location text,
  status text not null default '',
  reason text not null default '',
  recommended_next_step text not null default '',
  fit_score integer not null default 0 check (fit_score between 0 and 100),
  value_text text,
  due_text text,
  action_state text not null default 'open' check (action_state in ('open','approved','watching','skipped','completed')),
  relationship_strength integer not null default 0 check (relationship_strength between 0 and 100),
  source_type text not null default 'manual',
  source_ref text,
  external_thread_id text,
  last_outbound_at timestamptz,
  last_inbound_at timestamptz,
  reply_status text not null default 'unknown' check (reply_status in ('unknown','awaiting','replied','bounced','closed')),
  next_action_at timestamptz,
  updated_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, slug)
);

create table if not exists public.aridon_next_action_events (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.customer_tenants(id) on delete cascade,
  action_id uuid not null references public.aridon_next_actions(id) on delete cascade,
  event_type text not null,
  event_note text,
  source_type text not null default 'aridon',
  source_ref text,
  actor_user_id uuid,
  created_at timestamptz not null default now()
);

create index if not exists aridon_next_actions_rank_idx on public.aridon_next_actions (tenant_id, action_state, fit_score desc, updated_at desc);
create index if not exists aridon_next_actions_reply_idx on public.aridon_next_actions (tenant_id, reply_status, last_inbound_at desc);
create index if not exists aridon_next_action_events_action_idx on public.aridon_next_action_events (action_id, created_at desc);

alter table public.aridon_next_actions enable row level security;
alter table public.aridon_next_action_events enable row level security;
