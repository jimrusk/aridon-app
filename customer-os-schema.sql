-- White-label Business OS schema
-- Intentionally separate from Aridon's internal CRM/projects/tasks tables.
-- Run in Supabase SQL Editor before activating paid customer workspaces.

create table if not exists customer_tenants (
  id uuid default gen_random_uuid() primary key,
  slug text not null unique check (slug ~ '^[a-z0-9][a-z0-9-]{1,62}$'),
  business_name text not null,
  owner_name text,
  contact_email text not null,
  industry text,
  tagline text,
  primary_color text default '#111827',
  accent_color text default '#2563EB',
  custom_domain text unique,
  plan text default 'launch',
  status text default 'onboarding',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists customer_projects (
  id uuid default gen_random_uuid() primary key,
  tenant_id uuid not null references customer_tenants(id) on delete cascade,
  name text not null,
  description text,
  status text default 'active',
  created_at timestamptz default now()
);

create table if not exists customer_tasks (
  id uuid default gen_random_uuid() primary key,
  tenant_id uuid not null references customer_tenants(id) on delete cascade,
  title text not null,
  owner text,
  priority text default 'medium',
  status text default 'open',
  created_at timestamptz default now()
);

create table if not exists customer_knowledge (
  id uuid default gen_random_uuid() primary key,
  tenant_id uuid not null references customer_tenants(id) on delete cascade,
  title text not null,
  category text,
  content text,
  created_at timestamptz default now()
);

create index if not exists customer_projects_tenant_idx on customer_projects(tenant_id, created_at desc);
create index if not exists customer_tasks_tenant_idx on customer_tasks(tenant_id, created_at desc);
create index if not exists customer_knowledge_tenant_idx on customer_knowledge(tenant_id, created_at desc);

-- RLS is deliberately enabled before customer confidential data is stored.
alter table customer_tenants enable row level security;
alter table customer_projects enable row level security;
alter table customer_tasks enable row level security;
alter table customer_knowledge enable row level security;

-- No public policies are created here. Server-side service-role provisioning may create tenants,
-- but customer login/member policies must be added when authentication is activated.
