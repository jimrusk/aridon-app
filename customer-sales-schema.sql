-- Private Business OS: Scout Sales Agent schema
-- Run after customer-os-schema.sql. All records remain tenant-scoped.

create table if not exists customer_sales_profiles (
  id uuid default gen_random_uuid() primary key,
  tenant_id uuid not null unique references customer_tenants(id) on delete cascade,
  website text,
  company_summary text,
  offer_summary text,
  sales_goal text,
  ideal_customer_profile text,
  buyer_roles jsonb default '[]'::jsonb,
  industries jsonb default '[]'::jsonb,
  geographies jsonb default '[]'::jsonb,
  differentiators jsonb default '[]'::jsonb,
  proof_points jsonb default '[]'::jsonb,
  trigger_events jsonb default '[]'::jsonb,
  disqualifiers jsonb default '[]'::jsonb,
  messaging_angles jsonb default '[]'::jsonb,
  source_urls jsonb default '[]'::jsonb,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists customer_sales_leads (
  id uuid default gen_random_uuid() primary key,
  tenant_id uuid not null references customer_tenants(id) on delete cascade,
  company_name text not null,
  website text,
  location text,
  contact_name text,
  contact_email text,
  contact_title text,
  recommended_buyer_role text,
  fit_score integer default 0 check (fit_score between 0 and 100),
  fit_reason text,
  trigger_event text,
  research_notes text,
  personalization text,
  source_urls jsonb default '[]'::jsonb,
  source_type text default 'scout_research',
  status text default 'researched',
  instantly_lead_id text,
  instantly_campaign_id text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists customer_sales_campaigns (
  id uuid default gen_random_uuid() primary key,
  tenant_id uuid not null references customer_tenants(id) on delete cascade,
  name text not null,
  objective text,
  audience_summary text,
  sequence jsonb not null default '[]'::jsonb,
  selected_lead_ids jsonb default '[]'::jsonb,
  status text default 'draft',
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists customer_sales_integrations (
  id uuid default gen_random_uuid() primary key,
  tenant_id uuid not null references customer_tenants(id) on delete cascade,
  provider text not null,
  encrypted_secret text,
  connected_by uuid references auth.users(id) on delete set null,
  status text default 'connected',
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (tenant_id, provider)
);

create table if not exists customer_sales_suppressions (
  id uuid default gen_random_uuid() primary key,
  tenant_id uuid not null references customer_tenants(id) on delete cascade,
  email text,
  domain text,
  reason text default 'do_not_contact',
  created_at timestamptz default now(),
  check (email is not null or domain is not null)
);

create table if not exists customer_sales_events (
  id uuid default gen_random_uuid() primary key,
  tenant_id uuid not null references customer_tenants(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  event_name text not null,
  event_data jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

create index if not exists customer_sales_leads_tenant_idx on customer_sales_leads(tenant_id, created_at desc);
create index if not exists customer_sales_leads_fit_idx on customer_sales_leads(tenant_id, fit_score desc);
create index if not exists customer_sales_campaigns_tenant_idx on customer_sales_campaigns(tenant_id, created_at desc);
create index if not exists customer_sales_events_tenant_idx on customer_sales_events(tenant_id, created_at desc);
create index if not exists customer_sales_suppressions_email_idx on customer_sales_suppressions(tenant_id, email);
create index if not exists customer_sales_suppressions_domain_idx on customer_sales_suppressions(tenant_id, domain);

alter table customer_sales_profiles enable row level security;
alter table customer_sales_leads enable row level security;
alter table customer_sales_campaigns enable row level security;
alter table customer_sales_integrations enable row level security;
alter table customer_sales_suppressions enable row level security;
alter table customer_sales_events enable row level security;

-- No anonymous direct-browser policies. Authenticated customer routes verify tenant membership
-- on the server before reading or writing sales data. Integration credentials are encrypted
-- before storage and are never returned to the browser.
