-- Aridon Commerce Engine Phase 2 schema
-- Applied to the production Supabase project on 2026-09-10.

create table if not exists public.commerce_profiles (
  tenant_id uuid primary key references public.customer_tenants(id) on delete cascade,
  created_by uuid not null default auth.uid(),
  niche text not null default 'Commercial greenhouses',
  economics jsonb not null default '{"avgSale":15000,"supplierCostPct":68,"adCost":850,"freightReserve":900,"returnReserve":250,"targetOrders":5}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.commerce_suppliers (
  id uuid primary key default gen_random_uuid(), tenant_id uuid not null references public.customer_tenants(id) on delete cascade,
  created_by uuid not null default auth.uid(), name text not null, website text, contact text,
  status text not null default 'Research' check (status in ('Research','Qualified','Contacted','Approved','Rejected')),
  score numeric not null default 0 check (score between 0 and 100), why_fit text, source_url text,
  evidence jsonb not null default '[]'::jsonb, discovered_by_ai boolean not null default false,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table if not exists public.commerce_products (
  id uuid primary key default gen_random_uuid(), tenant_id uuid not null references public.customer_tenants(id) on delete cascade,
  supplier_id uuid references public.commerce_suppliers(id) on delete set null, created_by uuid not null default auth.uid(),
  sku text, title text not null, product_url text, supplier_cost numeric, selling_price numeric, freight_cost numeric not null default 0,
  map_price numeric, availability text, warranty text, status text not null default 'Draft' check (status in ('Draft','Verified','Live','Paused')),
  source text, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table if not exists public.commerce_leads (
  id uuid primary key default gen_random_uuid(), tenant_id uuid not null references public.customer_tenants(id) on delete cascade,
  created_by uuid not null default auth.uid(), name text not null, company text, email text, phone text, product_interest text,
  estimated_value numeric, stage text not null default 'New' check (stage in ('New','Qualified','Quoted','Negotiating','Won','Lost')),
  next_step text, notes text, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table if not exists public.commerce_orders (
  id uuid primary key default gen_random_uuid(), tenant_id uuid not null references public.customer_tenants(id) on delete cascade,
  lead_id uuid references public.commerce_leads(id) on delete set null, product_id uuid references public.commerce_products(id) on delete set null,
  created_by uuid not null default auth.uid(), customer_name text, sale_price numeric not null default 0, supplier_cost numeric not null default 0,
  ad_cost numeric not null default 0, freight_cost numeric not null default 0, other_cost numeric not null default 0,
  status text not null default 'Pending' check (status in ('Pending','Paid','Ordered','Shipped','Completed','Refunded','Cancelled')),
  ordered_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table if not exists public.commerce_showrooms (
  id uuid primary key default gen_random_uuid(), tenant_id uuid not null references public.customer_tenants(id) on delete cascade,
  created_by uuid not null default auth.uid(), name text not null, niche text not null, headline text, subheadline text,
  sections jsonb not null default '[]'::jsonb, featured_product_ids uuid[] not null default '{}',
  status text not null default 'Draft' check (status in ('Draft','Ready','Published','Archived')),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

alter table public.commerce_profiles enable row level security;
alter table public.commerce_suppliers enable row level security;
alter table public.commerce_products enable row level security;
alter table public.commerce_leads enable row level security;
alter table public.commerce_orders enable row level security;
alter table public.commerce_showrooms enable row level security;

-- Policies are membership-scoped: users may only access rows belonging to an Aridon tenant they are a member of.
