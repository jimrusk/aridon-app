-- ============================================================
-- Aridon Mission Control v1 — Shared Data Layer Schema
-- Branch: mission-control-v1
-- Run in: Supabase SQL Editor → New query → paste → Run
--
-- v3 BULLETPROOF: divisions always dropped/recreated.
-- ALTER TABLE columns use plain text (no FK) to avoid
-- conflicts with any pre-existing partial column state.
-- ============================================================


-- ============================================================
-- STEP 1: Fix divisions (drop + recreate with id TEXT)
-- ============================================================
drop table if exists divisions cascade;

create table divisions (
  id          text primary key,
  name        text not null,
  description text,
  icon        text,
  color       text,
  created_at  timestamptz default now()
);

insert into divisions (id, name, description, icon, color) values
  ('aridon',    'Aridon',                       'AWG-1000, pilots, investors, sales, manufacturing, engineering, partnerships',                                          '🌊', '#4A90D9'),
  ('iron-grid', 'Iron Grid Electric & Water',   'Field ops, electrical/water projects, work orders, customers, contractors, equipment, service, revenue',               '⚡', '#E87722'),
  ('swsa',      'SW Water Security Alliance',   'Governors/state outreach, petition signatures, state partnerships, tribal outreach, water-security grants/policy, contact tracking', '🏛', '#27AE60');


-- ============================================================
-- STEP 2: New reference tables
-- ============================================================
create table if not exists organizations (
  id                 uuid default gen_random_uuid() primary key,
  name               text not null,
  type               text,
  division           text,
  assigned_executive text,
  owner              text,
  status             text default 'active',
  priority           text default 'medium',
  due_date           date,
  website            text,
  phone              text,
  address            text,
  city               text,
  state              text,
  notes              text,
  source_document    text,
  tags               text[],
  created_at         timestamptz default now(),
  updated_at         timestamptz default now()
);

create table if not exists contacts (
  id                 uuid default gen_random_uuid() primary key,
  first_name         text not null,
  last_name          text,
  title              text,
  organization_id    uuid references organizations(id),
  division           text,
  assigned_executive text,
  owner              text,
  email              text,
  phone              text,
  status             text default 'active',
  priority           text default 'medium',
  due_date           date,
  notes              text,
  source_document    text,
  tags               text[],
  created_at         timestamptz default now(),
  updated_at         timestamptz default now()
);


-- ============================================================
-- STEP 3: Extend existing tables (plain text columns, no FK)
-- IF NOT EXISTS skips safely if any column was already added.
-- ============================================================
alter table leads add column if not exists division           text;
alter table leads add column if not exists assigned_executive text;
alter table leads add column if not exists owner              text;
alter table leads add column if not exists priority           text default 'medium';
alter table leads add column if not exists due_date           date;
alter table leads add column if not exists updated_at         timestamptz default now();
alter table leads add column if not exists related_org_id     uuid;
alter table leads add column if not exists related_contact_id uuid;
alter table leads add column if not exists source_document    text;
alter table leads add column if not exists phone              text;
alter table leads add column if not exists title              text;
alter table leads add column if not exists next_action        text;
alter table leads add column if not exists tags               text[];

alter table projects add column if not exists division           text;
alter table projects add column if not exists assigned_executive text;
alter table projects add column if not exists owner              text;
alter table projects add column if not exists priority           text default 'medium';
alter table projects add column if not exists due_date           date;
alter table projects add column if not exists updated_at         timestamptz default now();
alter table projects add column if not exists related_org_id     uuid;
alter table projects add column if not exists related_contact_id uuid;
alter table projects add column if not exists source_document    text;
alter table projects add column if not exists start_date         date;
alter table projects add column if not exists budget             numeric;
alter table projects add column if not exists next_action        text;
alter table projects add column if not exists tags               text[];

alter table tasks add column if not exists division           text;
alter table tasks add column if not exists assigned_executive text;
alter table tasks add column if not exists owner              text;
alter table tasks add column if not exists due_date           date;
alter table tasks add column if not exists updated_at         timestamptz default now();
alter table tasks add column if not exists related_org_id     uuid;
alter table tasks add column if not exists related_contact_id uuid;
alter table tasks add column if not exists source_document    text;
alter table tasks add column if not exists description        text;
alter table tasks add column if not exists next_action        text;
alter table tasks add column if not exists tags               text[];


-- ============================================================
-- STEP 4: Remaining new tables
-- ============================================================
create table if not exists opportunities (
  id                 uuid default gen_random_uuid() primary key,
  title              text not null,
  division           text,
  assigned_executive text,
  owner              text,
  organization_id    uuid references organizations(id),
  contact_id         uuid references contacts(id),
  status             text default 'open',
  priority           text default 'medium',
  stage              text,
  value              numeric,
  due_date           date,
  close_date         date,
  notes              text,
  source_document    text,
  next_action        text,
  tags               text[],
  created_at         timestamptz default now(),
  updated_at         timestamptz default now()
);

create table if not exists grants (
  id                 uuid default gen_random_uuid() primary key,
  title              text not null,
  funder             text,
  division           text,
  assigned_executive text,
  owner              text,
  organization_id    uuid references organizations(id),
  status             text default 'researching',
  priority           text default 'medium',
  amount             numeric,
  due_date           date,
  award_date         date,
  notes              text,
  source_document    text,
  next_action        text,
  tags               text[],
  created_at         timestamptz default now(),
  updated_at         timestamptz default now()
);

create table if not exists funding_deadlines (
  id                 uuid default gen_random_uuid() primary key,
  title              text not null,
  funder             text,
  division           text,
  assigned_executive text,
  owner              text,
  grant_id           uuid references grants(id),
  deadline           date not null,
  status             text default 'upcoming',
  priority           text default 'high',
  amount             numeric,
  notes              text,
  source_document    text,
  created_at         timestamptz default now(),
  updated_at         timestamptz default now()
);

create table if not exists investors (
  id                 uuid default gen_random_uuid() primary key,
  name               text not null,
  organization_id    uuid references organizations(id),
  contact_id         uuid references contacts(id),
  division           text,
  assigned_executive text,
  owner              text,
  type               text,
  status             text default 'prospect',
  priority           text default 'medium',
  investment_amount  numeric,
  commitment_date    date,
  due_date           date,
  notes              text,
  source_document    text,
  next_action        text,
  tags               text[],
  created_at         timestamptz default now(),
  updated_at         timestamptz default now()
);

create table if not exists pilot_sites (
  id                    uuid default gen_random_uuid() primary key,
  name                  text not null,
  organization_id       uuid references organizations(id),
  contact_id            uuid references contacts(id),
  division              text,
  assigned_executive    text,
  owner                 text,
  location              text,
  latitude              numeric,
  longitude             numeric,
  status                text default 'prospect',
  priority              text default 'medium',
  due_date              date,
  awg_units             integer default 1,
  daily_capacity_liters integer,
  notes                 text,
  source_document       text,
  next_action           text,
  created_at            timestamptz default now(),
  updated_at            timestamptz default now()
);

create table if not exists manufacturing_milestones (
  id                 uuid default gen_random_uuid() primary key,
  title              text not null,
  division           text,
  assigned_executive text,
  owner              text,
  status             text default 'pending',
  priority           text default 'medium',
  due_date           date,
  completed_at       date,
  notes              text,
  source_document    text,
  next_action        text,
  tags               text[],
  created_at         timestamptz default now(),
  updated_at         timestamptz default now()
);

create table if not exists engineering_milestones (
  id                 uuid default gen_random_uuid() primary key,
  title              text not null,
  division           text,
  assigned_executive text,
  owner              text,
  status             text default 'pending',
  priority           text default 'medium',
  due_date           date,
  completed_at       date,
  notes              text,
  source_document    text,
  next_action        text,
  tags               text[],
  created_at         timestamptz default now(),
  updated_at         timestamptz default now()
);

create table if not exists outreach (
  id                 uuid default gen_random_uuid() primary key,
  title              text not null,
  contact_id         uuid references contacts(id),
  organization_id    uuid references organizations(id),
  division           text,
  assigned_executive text,
  owner              text,
  type               text,
  status             text default 'planned',
  priority           text default 'medium',
  scheduled_date     date,
  completed_date     date,
  due_date           date,
  notes              text,
  source_document    text,
  next_action        text,
  tags               text[],
  created_at         timestamptz default now(),
  updated_at         timestamptz default now()
);

create table if not exists meetings (
  id                 uuid default gen_random_uuid() primary key,
  title              text not null,
  division           text,
  assigned_executive text,
  owner              text,
  organization_id    uuid references organizations(id),
  contact_id         uuid references contacts(id),
  status             text default 'scheduled',
  priority           text default 'medium',
  meeting_date       timestamptz,
  duration_minutes   integer,
  location           text,
  summary            text,
  action_items       text,
  due_date           date,
  notes              text,
  source_document    text,
  created_at         timestamptz default now(),
  updated_at         timestamptz default now()
);

create table if not exists documents (
  id                 uuid default gen_random_uuid() primary key,
  title              text not null,
  type               text,
  division           text,
  assigned_executive text,
  owner              text,
  organization_id    uuid references organizations(id),
  contact_id         uuid references contacts(id),
  status             text default 'draft',
  priority           text default 'medium',
  due_date           date,
  file_url           text,
  notes              text,
  source_document    text,
  tags               text[],
  created_at         timestamptz default now(),
  updated_at         timestamptz default now()
);

create table if not exists executive_actions (
  id                  uuid default gen_random_uuid() primary key,
  action_type         text not null,
  title               text not null,
  description         text,
  executive           text not null,
  division            text,
  record_type         text,
  record_id           uuid,
  related_org_id      uuid references organizations(id),
  related_contact_id  uuid references contacts(id),
  created_at          timestamptz default now()
);

create table if not exists executive_briefings (
  id              uuid default gen_random_uuid() primary key,
  briefing_date   date not null default current_date,
  narrative       text,
  top_priorities  jsonb default '[]',
  critical_alerts jsonb default '[]',
  recommendations text,
  jim_notes       text,
  is_complete     boolean default false,
  snapshot        jsonb,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

create table if not exists alerts (
  id                  uuid default gen_random_uuid() primary key,
  title               text not null,
  description         text,
  severity            text default 'amber',
  division            text,
  assigned_executive  text,
  owner               text,
  status              text default 'open',
  priority            text default 'high',
  due_date            date,
  resolved_at         timestamptz,
  related_org_id      uuid references organizations(id),
  related_contact_id  uuid references contacts(id),
  notes               text,
  source_document     text,
  created_at          timestamptz default now(),
  updated_at          timestamptz default now()
);

create table if not exists users (
  id         uuid primary key,
  email      text,
  name       text,
  role       text default 'member',
  division   text,
  active     boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);


-- ============================================================
-- STEP 5: Indexes (wrapped in DO block to skip gracefully)
-- ============================================================
do $$ begin
  if not exists (select 1 from pg_indexes where indexname = 'idx_leads_division')           then create index idx_leads_division           on leads(division); end if;
  if not exists (select 1 from pg_indexes where indexname = 'idx_leads_assigned_executive') then create index idx_leads_assigned_executive on leads(assigned_executive); end if;
  if not exists (select 1 from pg_indexes where indexname = 'idx_leads_priority')           then create index idx_leads_priority           on leads(priority); end if;
  if not exists (select 1 from pg_indexes where indexname = 'idx_projects_division')        then create index idx_projects_division        on projects(division); end if;
  if not exists (select 1 from pg_indexes where indexname = 'idx_projects_assigned_exec')   then create index idx_projects_assigned_exec   on projects(assigned_executive); end if;
  if not exists (select 1 from pg_indexes where indexname = 'idx_tasks_division')           then create index idx_tasks_division           on tasks(division); end if;
  if not exists (select 1 from pg_indexes where indexname = 'idx_tasks_due_date')           then create index idx_tasks_due_date           on tasks(due_date); end if;
  if not exists (select 1 from pg_indexes where indexname = 'idx_tasks_priority')           then create index idx_tasks_priority           on tasks(priority); end if;
  if not exists (select 1 from pg_indexes where indexname = 'idx_alerts_severity')          then create index idx_alerts_severity          on alerts(severity); end if;
  if not exists (select 1 from pg_indexes where indexname = 'idx_alerts_status')            then create index idx_alerts_status            on alerts(status); end if;
  if not exists (select 1 from pg_indexes where indexname = 'idx_alerts_division')          then create index idx_alerts_division          on alerts(division); end if;
  if not exists (select 1 from pg_indexes where indexname = 'idx_exec_actions_created')     then create index idx_exec_actions_created     on executive_actions(created_at desc); end if;
  if not exists (select 1 from pg_indexes where indexname = 'idx_exec_actions_executive')   then create index idx_exec_actions_executive   on executive_actions(executive); end if;
  if not exists (select 1 from pg_indexes where indexname = 'idx_briefings_date')           then create index idx_briefings_date           on executive_briefings(briefing_date desc); end if;
  if not exists (select 1 from pg_indexes where indexname = 'idx_opportunities_division')   then create index idx_opportunities_division   on opportunities(division); end if;
  if not exists (select 1 from pg_indexes where indexname = 'idx_opportunities_status')     then create index idx_opportunities_status     on opportunities(status); end if;
  if not exists (select 1 from pg_indexes where indexname = 'idx_grants_division')          then create index idx_grants_division          on grants(division); end if;
  if not exists (select 1 from pg_indexes where indexname = 'idx_grants_status')            then create index idx_grants_status            on grants(status); end if;
  if not exists (select 1 from pg_indexes where indexname = 'idx_pilot_sites_status')       then create index idx_pilot_sites_status       on pilot_sites(status); end if;
  if not exists (select 1 from pg_indexes where indexname = 'idx_contacts_org')             then create index idx_contacts_org             on contacts(organization_id); end if;
  if not exists (select 1 from pg_indexes where indexname = 'idx_contacts_division')        then create index idx_contacts_division        on contacts(division); end if;
  if not exists (select 1 from pg_indexes where indexname = 'idx_orgs_division')            then create index idx_orgs_division            on organizations(division); end if;
end $$;


-- ============================================================
-- DONE — Expected result: "Success. No rows returned."
-- 17 new tables + 3 altered (leads, projects, tasks)
-- ============================================================
