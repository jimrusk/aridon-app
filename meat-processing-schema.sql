-- Aridon Meat Processing OS schema
-- Pilot data model for regional processors such as Barnard Processing.

create table if not exists meat_processors (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  location text,
  inspection_type text,
  created_at timestamptz default now()
);

create table if not exists processing_producers (
  id uuid primary key default gen_random_uuid(),
  processor_id uuid references meat_processors(id) on delete cascade,
  name text not null,
  phone text,
  email text,
  regenerative_claims jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

create table if not exists processing_jobs (
  id uuid primary key default gen_random_uuid(),
  processor_id uuid references meat_processors(id) on delete cascade,
  producer_id uuid references processing_producers(id),
  job_code text unique not null,
  species text not null,
  head_count integer not null default 1,
  slaughter_date date,
  status text not null default 'booked',
  customer_name text,
  customer_phone text,
  customer_email text,
  balance_due numeric(12,2) default 0,
  created_at timestamptz default now()
);

create table if not exists cut_sheets (
  id uuid primary key default gen_random_uuid(),
  job_id uuid references processing_jobs(id) on delete cascade,
  status text not null default 'missing',
  steak_thickness text,
  roast_size text,
  ground_package_size text,
  patty_preferences jsonb default '{}'::jsonb,
  organs jsonb default '{}'::jsonb,
  bones jsonb default '{}'::jsonb,
  special_instructions text,
  submitted_at timestamptz
);

create table if not exists carcass_records (
  id uuid primary key default gen_random_uuid(),
  job_id uuid references processing_jobs(id) on delete cascade,
  animal_or_lot_id text not null,
  live_weight_lb numeric(10,2),
  hanging_weight_lb numeric(10,2),
  packaged_weight_lb numeric(10,2),
  aging_start date,
  aging_end date,
  freezer_location text,
  traceability_qr text,
  created_at timestamptz default now()
);

create table if not exists packaged_inventory (
  id uuid primary key default gen_random_uuid(),
  carcass_id uuid references carcass_records(id) on delete cascade,
  sku text,
  product_name text not null,
  package_weight_lb numeric(8,2),
  package_count integer default 1,
  freezer_location text,
  allocated_to text,
  available_for_sale boolean default false,
  created_at timestamptz default now()
);

create table if not exists processing_capacity (
  id uuid primary key default gen_random_uuid(),
  processor_id uuid references meat_processors(id) on delete cascade,
  work_date date not null,
  species text,
  capacity_head integer not null default 0,
  booked_head integer not null default 0,
  notes text,
  unique(processor_id, work_date, species)
);

create table if not exists pickup_delivery_tasks (
  id uuid primary key default gen_random_uuid(),
  job_id uuid references processing_jobs(id) on delete cascade,
  mode text not null default 'pickup',
  scheduled_at timestamptz,
  status text not null default 'pending',
  reminder_sent_at timestamptz,
  delivery_route text,
  completed_at timestamptz
);

create table if not exists processor_documents (
  id uuid primary key default gen_random_uuid(),
  processor_id uuid references meat_processors(id) on delete cascade,
  category text not null,
  title text not null,
  document_url text,
  effective_date date,
  review_due date,
  notes text,
  created_at timestamptz default now()
);

create table if not exists processor_maintenance (
  id uuid primary key default gen_random_uuid(),
  processor_id uuid references meat_processors(id) on delete cascade,
  equipment text not null,
  task text not null,
  due_date date,
  status text not null default 'open',
  completed_at timestamptz,
  notes text
);

create table if not exists direct_meat_orders (
  id uuid primary key default gen_random_uuid(),
  processor_id uuid references meat_processors(id) on delete cascade,
  producer_id uuid references processing_producers(id),
  buyer_name text not null,
  buyer_type text default 'consumer',
  order_type text not null,
  order_total numeric(12,2) default 0,
  deposit_paid numeric(12,2) default 0,
  status text not null default 'open',
  pickup_or_delivery text,
  created_at timestamptz default now()
);

create table if not exists processing_yield_metrics (
  id uuid primary key default gen_random_uuid(),
  job_id uuid references processing_jobs(id) on delete cascade,
  live_to_hanging_pct numeric(6,2),
  hanging_to_packaged_pct numeric(6,2),
  aging_loss_pct numeric(6,2),
  labor_cost numeric(12,2),
  packaging_cost numeric(12,2),
  processor_revenue numeric(12,2),
  processor_margin numeric(12,2),
  created_at timestamptz default now()
);

create table if not exists processor_daily_briefs (
  id uuid primary key default gen_random_uuid(),
  processor_id uuid references meat_processors(id) on delete cascade,
  brief_date date not null,
  brief_json jsonb not null default '{}'::jsonb,
  created_at timestamptz default now(),
  unique(processor_id, brief_date)
);
