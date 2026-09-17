-- Aridon Market public storefront launch
-- Applied to production Supabase on 2026-09-17.

alter table public.commerce_profiles
  add column if not exists store_name text,
  add column if not exists public_slug text,
  add column if not exists tagline text,
  add column if not exists support_email text,
  add column if not exists support_phone text,
  add column if not exists currency text not null default 'usd',
  add column if not exists public_store_enabled boolean not null default false,
  add column if not exists categories jsonb not null default '[]'::jsonb;

alter table public.commerce_suppliers
  add column if not exists category text,
  add column if not exists dealer_program_url text,
  add column if not exists approval_notes text,
  add column if not exists margin_notes text;

alter table public.commerce_products
  add column if not exists slug text,
  add column if not exists category text,
  add column if not exists description text,
  add column if not exists image_urls jsonb not null default '[]'::jsonb,
  add column if not exists specs jsonb not null default '{}'::jsonb,
  add column if not exists quote_only boolean not null default true,
  add column if not exists shipping_note text,
  add column if not exists stripe_product_id text,
  add column if not exists stripe_price_id text,
  add column if not exists published_at timestamptz;

create unique index if not exists commerce_products_tenant_slug_uidx
  on public.commerce_products(tenant_id, slug)
  where slug is not null;

alter table public.commerce_leads
  add column if not exists source text,
  add column if not exists source_url text,
  add column if not exists session_id text;

alter table public.commerce_orders
  add column if not exists customer_email text,
  add column if not exists currency text not null default 'usd',
  add column if not exists stripe_checkout_session_id text,
  add column if not exists stripe_payment_intent_id text,
  add column if not exists payment_status text;

create unique index if not exists commerce_orders_checkout_session_uidx
  on public.commerce_orders(stripe_checkout_session_id)
  where stripe_checkout_session_id is not null;

create table if not exists public.commerce_events (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.customer_tenants(id) on delete cascade,
  product_id uuid references public.commerce_products(id) on delete set null,
  visitor_id text,
  session_id text,
  event_name text not null check (event_name in ('store_view','category_view','product_view','lead_submitted','checkout_started','purchase')),
  url text,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists commerce_events_tenant_created_idx on public.commerce_events(tenant_id, created_at desc);
create index if not exists commerce_events_product_created_idx on public.commerce_events(product_id, created_at desc);
alter table public.commerce_events enable row level security;
