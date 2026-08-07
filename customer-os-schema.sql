-- Private Business OS customer schema
-- Separate from the platform operator's internal CRM/projects/tasks tables.
-- Run in Supabase SQL Editor before activating customer or beta workspaces.

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

alter table customer_tenants add column if not exists billing_email text;
alter table customer_tenants add column if not exists subscription_status text default 'inactive';
alter table customer_tenants add column if not exists stripe_customer_id text unique;
alter table customer_tenants add column if not exists stripe_subscription_id text unique;
alter table customer_tenants add column if not exists current_period_end timestamptz;
alter table customer_tenants add column if not exists activated_at timestamptz;
alter table customer_tenants add column if not exists beta_feedback_contact text;

create table if not exists customer_memberships (
  id uuid default gen_random_uuid() primary key,
  tenant_id uuid not null references customer_tenants(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member',
  created_at timestamptz default now(),
  unique (tenant_id, user_id)
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

create table if not exists customer_feedback (
  id uuid default gen_random_uuid() primary key,
  tenant_id uuid not null references customer_tenants(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  rating integer check (rating between 1 and 5),
  likes text,
  problems text,
  missing text,
  recommend text,
  notes text,
  created_at timestamptz default now()
);

-- Eva customer conversations are stored inside the customer's tenant layer so the
-- product can provide continuity and measure support usage without mixing companies.
create table if not exists customer_assistant_messages (
  id uuid default gen_random_uuid() primary key,
  tenant_id uuid not null references customer_tenants(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  role text not null check (role in ('user','assistant')),
  content text not null,
  web_research boolean default false,
  created_at timestamptz default now()
);

-- Each active customer receives one referral code. Referred preview signups are
-- attributed to the referrer without exposing the referred company's private tenant data.
create table if not exists customer_referral_codes (
  id uuid default gen_random_uuid() primary key,
  tenant_id uuid not null unique references customer_tenants(id) on delete cascade,
  code text not null unique,
  created_at timestamptz default now()
);

create table if not exists customer_referrals (
  id uuid default gen_random_uuid() primary key,
  referrer_tenant_id uuid not null references customer_tenants(id) on delete cascade,
  referral_code text not null,
  lead_id text,
  referred_business text,
  referred_name text,
  referred_email text,
  status text default 'signup',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Product telemetry captures coarse business events, not hidden chain-of-thought.
-- It exists to measure activation, engagement, referrals, feedback and retention.
create table if not exists customer_usage_events (
  id uuid default gen_random_uuid() primary key,
  tenant_id uuid references customer_tenants(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  event_name text not null,
  event_data jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

-- One-time no-cost beta invitations are generated from the protected operator console.
-- Only a SHA-256 token hash is stored. The raw invitation token is shown once to the operator.
create table if not exists customer_beta_invites (
  id uuid default gen_random_uuid() primary key,
  token_hash text not null unique,
  business_name text not null,
  owner_name text not null,
  email text not null,
  industry text not null,
  feedback_contact text,
  tenant_id uuid references customer_tenants(id) on delete set null,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz default now()
);

create index if not exists customer_memberships_user_idx on customer_memberships(user_id, tenant_id);
create index if not exists customer_projects_tenant_idx on customer_projects(tenant_id, created_at desc);
create index if not exists customer_tasks_tenant_idx on customer_tasks(tenant_id, created_at desc);
create index if not exists customer_knowledge_tenant_idx on customer_knowledge(tenant_id, created_at desc);
create index if not exists customer_feedback_tenant_idx on customer_feedback(tenant_id, created_at desc);
create index if not exists customer_assistant_messages_tenant_idx on customer_assistant_messages(tenant_id, created_at desc);
create index if not exists customer_referrals_tenant_idx on customer_referrals(referrer_tenant_id, created_at desc);
create index if not exists customer_usage_events_tenant_idx on customer_usage_events(tenant_id, created_at desc);
create index if not exists customer_usage_events_name_idx on customer_usage_events(event_name, created_at desc);
create index if not exists customer_beta_invites_expiry_idx on customer_beta_invites(expires_at, used_at);
create index if not exists customer_tenants_subscription_idx on customer_tenants(subscription_status, updated_at desc);

-- RLS is enabled before confidential customer data is stored.
-- The application currently serves customer data through authenticated server routes.
-- The server service role bypasses these policies; no anonymous customer-data policy exists.
alter table customer_tenants enable row level security;
alter table customer_memberships enable row level security;
alter table customer_projects enable row level security;
alter table customer_tasks enable row level security;
alter table customer_knowledge enable row level security;
alter table customer_feedback enable row level security;
alter table customer_assistant_messages enable row level security;
alter table customer_referral_codes enable row level security;
alter table customer_referrals enable row level security;
alter table customer_usage_events enable row level security;
alter table customer_beta_invites enable row level security;

-- Signed-in users may see their own membership rows. Customer workspace content is still
-- returned through server API routes that verify both the access token and tenant membership.
drop policy if exists "customer can read own memberships" on customer_memberships;
create policy "customer can read own memberships"
  on customer_memberships for select
  to authenticated
  using (user_id = auth.uid());

-- Beta invitations, Stripe identifiers, billing state, tenant records, conversations,
-- referrals and company content have no anonymous direct-browser policies. Access is
-- brokered by authenticated server routes or the protected operator command center.
