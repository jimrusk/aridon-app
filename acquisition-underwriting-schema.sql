-- Aridon 3 advanced acquisition underwriting schema.
-- Production migration name: add_acquisition_underwriting_os

create table if not exists public.acquisition_underwriting (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null unique references public.acquisition_leads(id) on delete cascade,
  inputs jsonb not null default '{}'::jsonb,
  results jsonb not null default '{}'::jsonb,
  decision text not null default 'needs_data' check (decision in ('buy','buy_conditionally','needs_data','pass')),
  kill_triggers text[] not null default '{}',
  advisor_flags text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.acquisition_evidence (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.acquisition_leads(id) on delete cascade,
  category text not null default 'General',
  claim text not null,
  source_type text not null default 'seller_claim',
  source_label text not null default '',
  source_url text not null default '',
  confidence integer not null default 50 check (confidence between 0 and 100),
  verified boolean not null default false,
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.acquisition_takeover_tasks (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.acquisition_leads(id) on delete cascade,
  phase text not null default 'day_1' check (phase in ('pre_close','day_1','day_30','day_60','day_100','year_1')),
  task text not null,
  owner text not null default 'Owner',
  due_day integer not null default 1 check (due_day between 0 and 365),
  status text not null default 'open' check (status in ('open','in_progress','done','blocked')),
  rationale text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists acquisition_evidence_lead_idx on public.acquisition_evidence(lead_id, created_at desc);
create index if not exists acquisition_takeover_tasks_lead_idx on public.acquisition_takeover_tasks(lead_id, phase, due_day);

alter table public.acquisition_underwriting enable row level security;
alter table public.acquisition_evidence enable row level security;
alter table public.acquisition_takeover_tasks enable row level security;
