-- Aridon Relationship Brain
-- Adds unified relationship history, follow-up intelligence, connector settings,
-- and server-only encrypted integration token storage.

alter table public.leads
  add column if not exists phone text,
  add column if not exists title text,
  add column if not exists priority text default 'medium',
  add column if not exists next_action text,
  add column if not exists updated_at timestamptz default now(),
  add column if not exists last_contact_at timestamptz,
  add column if not exists next_follow_up_at timestamptz,
  add column if not exists relationship_score integer not null default 0,
  add column if not exists source text not null default 'manual',
  add column if not exists social_handle text,
  add column if not exists social_url text;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'leads_relationship_score_range'
  ) then
    alter table public.leads
      add constraint leads_relationship_score_range
      check (relationship_score between 0 and 100);
  end if;
end $$;

create index if not exists leads_email_lower_idx
  on public.leads (lower(email))
  where email is not null and email <> '';

create index if not exists leads_social_handle_lower_idx
  on public.leads (lower(social_handle))
  where social_handle is not null and social_handle <> '';

create index if not exists leads_next_follow_up_idx
  on public.leads (next_follow_up_at)
  where next_follow_up_at is not null;

create table if not exists public.relationship_events (
  id uuid default gen_random_uuid() primary key,
  lead_id uuid not null references public.leads(id) on delete cascade,
  event_type text not null default 'interaction',
  direction text not null default 'unknown',
  source text not null default 'manual',
  source_message_id text,
  subject text,
  summary text,
  happened_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create unique index if not exists relationship_events_source_message_lead_idx
  on public.relationship_events (source, source_message_id, lead_id);

create index if not exists relationship_events_lead_happened_idx
  on public.relationship_events (lead_id, happened_at desc);

create table if not exists public.relationship_settings (
  id integer primary key default 1 check (id = 1),
  auto_create_contacts boolean not null default true,
  daily_brief_enabled boolean not null default true,
  daily_brief_time text not null default '06:00',
  daily_brief_timezone text not null default 'America/Denver',
  brief_recipient text,
  x_sync_enabled boolean not null default false,
  updated_at timestamptz not null default now()
);

insert into public.relationship_settings (id)
values (1)
on conflict (id) do nothing;

create table if not exists public.executive_integration_tokens (
  provider text primary key,
  account_label text,
  encrypted_refresh_token text,
  encrypted_access_token text,
  metadata jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- These tables are only read/written from server routes using the service role.
alter table public.relationship_settings enable row level security;
alter table public.executive_integration_tokens enable row level security;
