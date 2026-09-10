-- Secure Aridon Ag Farm Passport cloud, evidence links, temporary reviewer shares and feedback.
-- The same migration has been applied to production. Customer access is brokered by
-- authenticated server routes; public reviewer access uses hash-only expiring tokens.

create table if not exists ag_farm_passports (
  id uuid default gen_random_uuid() primary key,
  tenant_id uuid not null references customer_tenants(id) on delete cascade,
  owner_user_id uuid references auth.users(id) on delete set null,
  producer text,
  farm_name text,
  field_id text,
  state text,
  county text,
  crop text,
  harvest_year integer,
  record_data jsonb not null default '{}'::jsonb,
  boundary_geojson jsonb,
  readiness jsonb not null default '{}'::jsonb,
  status text not null default 'draft' check (status in ('draft','review_ready','submitted','archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists ag_farm_passport_files (
  id uuid default gen_random_uuid() primary key,
  tenant_id uuid not null references customer_tenants(id) on delete cascade,
  passport_id uuid not null references ag_farm_passports(id) on delete cascade,
  customer_file_id uuid not null references customer_files(id) on delete cascade,
  evidence_type text not null default 'supporting_document',
  label text,
  shared boolean not null default true,
  created_at timestamptz not null default now(),
  unique(passport_id, customer_file_id)
);

create table if not exists ag_farm_passport_shares (
  id uuid default gen_random_uuid() primary key,
  tenant_id uuid not null references customer_tenants(id) on delete cascade,
  passport_id uuid not null references ag_farm_passports(id) on delete cascade,
  role text not null check (role in ('buyer','verifier','auditor')),
  token_hash text not null unique,
  permissions jsonb not null default '{"record":true,"boundary":true,"documents":false,"review":true}'::jsonb,
  expires_at timestamptz not null,
  revoked_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  last_accessed_at timestamptz
);

create table if not exists ag_farm_passport_reviews (
  id uuid default gen_random_uuid() primary key,
  tenant_id uuid not null references customer_tenants(id) on delete cascade,
  passport_id uuid not null references ag_farm_passports(id) on delete cascade,
  share_id uuid not null references ag_farm_passport_shares(id) on delete cascade,
  reviewer_name text,
  organization text,
  review_status text not null default 'received' check (review_status in ('received','needs_information','accepted','declined')),
  notes text,
  requested_items jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists ag_farm_passports_tenant_idx on ag_farm_passports(tenant_id, updated_at desc);
create index if not exists ag_farm_passports_field_idx on ag_farm_passports(tenant_id, field_id, harvest_year);
create index if not exists ag_farm_passport_files_passport_idx on ag_farm_passport_files(passport_id, created_at desc);
create index if not exists ag_farm_passport_shares_passport_idx on ag_farm_passport_shares(passport_id, created_at desc);
create index if not exists ag_farm_passport_shares_expiry_idx on ag_farm_passport_shares(expires_at, revoked_at);
create index if not exists ag_farm_passport_reviews_passport_idx on ag_farm_passport_reviews(passport_id, created_at desc);

alter table ag_farm_passports enable row level security;
alter table ag_farm_passport_files enable row level security;
alter table ag_farm_passport_shares enable row level security;
alter table ag_farm_passport_reviews enable row level security;

revoke all on ag_farm_passports from anon;
revoke all on ag_farm_passport_files from anon;
revoke all on ag_farm_passport_shares from anon;
revoke all on ag_farm_passport_reviews from anon;

revoke all on ag_farm_passports from authenticated;
revoke all on ag_farm_passport_files from authenticated;
revoke all on ag_farm_passport_shares from authenticated;
revoke all on ag_farm_passport_reviews from authenticated;

grant all on ag_farm_passports to service_role;
grant all on ag_farm_passport_files to service_role;
grant all on ag_farm_passport_shares to service_role;
grant all on ag_farm_passport_reviews to service_role;
