-- STEP 2 of 4 — Run AFTER step 1 succeeds.
-- Creates all 15 new tables. No changes to existing tables.
-- Expected result: "Success. No rows returned."

create table if not exists organizations (
  id uuid default gen_random_uuid() primary key,
  name text not null, type text, division text, assigned_executive text,
  owner text, status text default 'active', priority text default 'medium',
  due_date date, website text, phone text, address text, city text, state text,
  notes text, source_document text, tags text[],
  created_at timestamptz default now(), updated_at timestamptz default now()
);

create table if not exists contacts (
  id uuid default gen_random_uuid() primary key,
  first_name text not null, last_name text, title text,
  organization_id uuid references organizations(id),
  division text, assigned_executive text, owner text,
  email text, phone text, status text default 'active',
  priority text default 'medium', due_date date,
  notes text, source_document text, tags text[],
  created_at timestamptz default now(), updated_at timestamptz default now()
);

create table if not exists opportunities (
  id uuid default gen_random_uuid() primary key,
  title text not null, division text, assigned_executive text, owner text,
  organization_id uuid references organizations(id),
  contact_id uuid references contacts(id),
  status text default 'open', priority text default 'medium',
  stage text, value numeric, due_date date, close_date date,
  notes text, source_document text, next_action text, tags text[],
  created_at timestamptz default now(), updated_at timestamptz default now()
);

create table if not exists grants (
  id uuid default gen_random_uuid() primary key,
  title text not null, funder text, division text,
  assigned_executive text, owner text,
  organization_id uuid references organizations(id),
  status text default 'researching', priority text default 'medium',
  amount numeric, due_date date, award_date date,
  notes text, source_document text, next_action text, tags text[],
  created_at timestamptz default now(), updated_at timestamptz default now()
);

create table if not exists funding_deadlines (
  id uuid default gen_random_uuid() primary key,
  title text not null, funder text, division text,
  assigned_executive text, owner text,
  grant_id uuid references grants(id),
  deadline date not null, status text default 'upcoming',
  priority text default 'high', amount numeric,
  notes text, source_document text,
  created_at timestamptz default now(), updated_at timestamptz default now()
);

create table if not exists investors (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  organization_id uuid references organizations(id),
  contact_id uuid references contacts(id),
  division text, assigned_executive text, owner text, type text,
  status text default 'prospect', priority text default 'medium',
  investment_amount numeric, commitment_date date, due_date date,
  notes text, source_document text, next_action text, tags text[],
  created_at timestamptz default now(), updated_at timestamptz default now()
);

create table if not exists pilot_sites (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  organization_id uuid references organizations(id),
  contact_id uuid references contacts(id),
  division text, assigned_executive text, owner text,
  location text, latitude numeric, longitude numeric,
  status text default 'prospect', priority text default 'medium',
  due_date date, awg_units integer default 1,
  daily_capacity_liters integer,
  notes text, source_document text, next_action text,
  created_at timestamptz default now(), updated_at timestamptz default now()
);

create table if not exists manufacturing_milestones (
  id uuid default gen_random_uuid() primary key,
  title text not null, division text, assigned_executive text, owner text,
  status text default 'pending', priority text default 'medium',
  due_date date, completed_at date,
  notes text, source_document text, next_action text, tags text[],
  created_at timestamptz default now(), updated_at timestamptz default now()
);

create table if not exists engineering_milestones (
  id uuid default gen_random_uuid() primary key,
  title text not null, division text, assigned_executive text, owner text,
  status text default 'pending', priority text default 'medium',
  due_date date, completed_at date,
  notes text, source_document text, next_action text, tags text[],
  created_at timestamptz default now(), updated_at timestamptz default now()
);

create table if not exists outreach (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  contact_id uuid references contacts(id),
  organization_id uuid references organizations(id),
  division text, assigned_executive text, owner text, type text,
  status text default 'planned', priority text default 'medium',
  scheduled_date date, completed_date date, due_date date,
  notes text, source_document text, next_action text, tags text[],
  created_at timestamptz default now(), updated_at timestamptz default now()
);

create table if not exists meetings (
  id uuid default gen_random_uuid() primary key,
  title text not null, division text, assigned_executive text, owner text,
  organization_id uuid references organizations(id),
  contact_id uuid references contacts(id),
  status text default 'scheduled', priority text default 'medium',
  meeting_date timestamptz, duration_minutes integer,
  location text, summary text, action_items text, due_date date,
  notes text, source_document text,
  created_at timestamptz default now(), updated_at timestamptz default now()
);

create table if not exists documents (
  id uuid default gen_random_uuid() primary key,
  title text not null, type text, division text,
  assigned_executive text, owner text,
  organization_id uuid references organizations(id),
  contact_id uuid references contacts(id),
  status text default 'draft', priority text default 'medium',
  due_date date, file_url text,
  notes text, source_document text, tags text[],
  created_at timestamptz default now(), updated_at timestamptz default now()
);

create table if not exists executive_actions (
  id uuid default gen_random_uuid() primary key,
  action_type text not null, title text not null, description text,
  executive text not null, division text, record_type text, record_id uuid,
  related_org_id uuid references organizations(id),
  related_contact_id uuid references contacts(id),
  created_at timestamptz default now()
);

create table if not exists executive_briefings (
  id uuid default gen_random_uuid() primary key,
  briefing_date date not null default current_date,
  narrative text,
  top_priorities jsonb default '[]',
  critical_alerts jsonb default '[]',
  recommendations text, jim_notes text,
  is_complete boolean default false, snapshot jsonb,
  created_at timestamptz default now(), updated_at timestamptz default now()
);

create table if not exists alerts (
  id uuid default gen_random_uuid() primary key,
  title text not null, description text,
  severity text default 'amber', division text,
  assigned_executive text, owner text,
  status text default 'open', priority text default 'high',
  due_date date, resolved_at timestamptz,
  related_org_id uuid references organizations(id),
  related_contact_id uuid references contacts(id),
  notes text, source_document text,
  created_at timestamptz default now(), updated_at timestamptz default now()
);

create table if not exists users (
  id uuid primary key, email text, name text,
  role text default 'member', division text,
  active boolean default true,
  created_at timestamptz default now(), updated_at timestamptz default now()
);
