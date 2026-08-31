create table if not exists public.customer_finance_connections (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.customer_tenants(id) on delete cascade,
  provider text not null,
  label text not null,
  status text not null default 'available' check (status in ('available','needs_setup','connecting','connected','error','disconnected','manual_ready')),
  external_account_id text,
  company_name text,
  capabilities jsonb not null default '[]'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  last_sync_at timestamptz,
  last_error text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, provider)
);

create table if not exists public.customer_finance_secrets (
  tenant_id uuid not null references public.customer_tenants(id) on delete cascade,
  provider text not null,
  ciphertext text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (tenant_id, provider)
);

create table if not exists public.customer_finance_imports (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.customer_tenants(id) on delete cascade,
  source text not null,
  filename text,
  row_count integer not null default 0,
  imported_count integer not null default 0,
  duplicate_count integer not null default 0,
  status text not null default 'completed',
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.customer_finance_accounts (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.customer_tenants(id) on delete cascade,
  source text not null,
  external_id text not null,
  name text not null,
  account_type text,
  account_subtype text,
  mask text,
  current_balance numeric(18,2),
  available_balance numeric(18,2),
  currency_code text not null default 'USD',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, source, external_id)
);

create table if not exists public.customer_finance_transactions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.customer_tenants(id) on delete cascade,
  account_id uuid references public.customer_finance_accounts(id) on delete set null,
  import_id uuid references public.customer_finance_imports(id) on delete set null,
  source text not null,
  external_id text not null,
  posted_at date not null,
  description text not null,
  merchant text,
  amount numeric(18,2) not null check (amount >= 0),
  direction text not null check (direction in ('inflow','outflow')),
  category text,
  tax_category text,
  reference text,
  status text not null default 'posted',
  reconciled boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, source, external_id)
);

create table if not exists public.customer_finance_invoices (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.customer_tenants(id) on delete cascade,
  source text not null,
  external_id text not null,
  invoice_number text,
  customer_name text,
  issue_date date,
  due_date date,
  total numeric(18,2) not null default 0,
  balance numeric(18,2) not null default 0,
  status text not null default 'open',
  matched_transaction_id uuid references public.customer_finance_transactions(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, source, external_id)
);

create table if not exists public.customer_finance_reconciliation_runs (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.customer_tenants(id) on delete cascade,
  period_start date not null,
  period_end date not null,
  status text not null default 'completed',
  matched_count integer not null default 0,
  unresolved_count integer not null default 0,
  summary jsonb not null default '{}'::jsonb,
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.customer_finance_reconciliation_items (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references public.customer_finance_reconciliation_runs(id) on delete cascade,
  tenant_id uuid not null references public.customer_tenants(id) on delete cascade,
  transaction_id uuid references public.customer_finance_transactions(id) on delete cascade,
  invoice_id uuid references public.customer_finance_invoices(id) on delete cascade,
  issue_type text not null,
  confidence numeric(5,4),
  status text not null default 'open',
  note text,
  created_at timestamptz not null default now()
);

create table if not exists public.customer_finance_tax_handoffs (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.customer_tenants(id) on delete cascade,
  tax_year integer not null,
  status text not null default 'draft' check (status in ('draft','approved','delivered','archived')),
  preparer_name text,
  preparer_email text,
  summary jsonb not null default '{}'::jsonb,
  owner_approved boolean not null default false,
  approved_by uuid references auth.users(id) on delete set null,
  approved_at timestamptz,
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists customer_finance_transactions_tenant_date_idx on public.customer_finance_transactions(tenant_id, posted_at desc);
create index if not exists customer_finance_transactions_reconcile_idx on public.customer_finance_transactions(tenant_id, reconciled, posted_at desc);
create index if not exists customer_finance_invoices_tenant_due_idx on public.customer_finance_invoices(tenant_id, due_date, status);
create index if not exists customer_finance_recon_items_run_idx on public.customer_finance_reconciliation_items(run_id, status);

alter table public.customer_finance_connections enable row level security;
alter table public.customer_finance_secrets enable row level security;
alter table public.customer_finance_imports enable row level security;
alter table public.customer_finance_accounts enable row level security;
alter table public.customer_finance_transactions enable row level security;
alter table public.customer_finance_invoices enable row level security;
alter table public.customer_finance_reconciliation_runs enable row level security;
alter table public.customer_finance_reconciliation_items enable row level security;
alter table public.customer_finance_tax_handoffs enable row level security;

grant select, insert, update, delete on public.customer_finance_connections to authenticated;
grant select, insert, update, delete on public.customer_finance_imports to authenticated;
grant select, insert, update, delete on public.customer_finance_accounts to authenticated;
grant select, insert, update, delete on public.customer_finance_transactions to authenticated;
grant select, insert, update, delete on public.customer_finance_invoices to authenticated;
grant select, insert, update, delete on public.customer_finance_reconciliation_runs to authenticated;
grant select, insert, update, delete on public.customer_finance_reconciliation_items to authenticated;
grant select, insert, update, delete on public.customer_finance_tax_handoffs to authenticated;
revoke all on public.customer_finance_secrets from anon, authenticated;

do $$
declare t text;
begin
  foreach t in array array[
    'customer_finance_connections','customer_finance_imports','customer_finance_accounts',
    'customer_finance_transactions','customer_finance_invoices','customer_finance_reconciliation_runs',
    'customer_finance_reconciliation_items','customer_finance_tax_handoffs'
  ] loop
    execute format('drop policy if exists "finance tenant select" on public.%I', t);
    execute format('create policy "finance tenant select" on public.%I for select to authenticated using (exists (select 1 from public.customer_memberships m where m.tenant_id = %I.tenant_id and m.user_id = auth.uid()))', t, t);
    execute format('drop policy if exists "finance tenant insert" on public.%I', t);
    execute format('create policy "finance tenant insert" on public.%I for insert to authenticated with check (exists (select 1 from public.customer_memberships m where m.tenant_id = %I.tenant_id and m.user_id = auth.uid()))', t, t);
    execute format('drop policy if exists "finance tenant update" on public.%I', t);
    execute format('create policy "finance tenant update" on public.%I for update to authenticated using (exists (select 1 from public.customer_memberships m where m.tenant_id = %I.tenant_id and m.user_id = auth.uid())) with check (exists (select 1 from public.customer_memberships m where m.tenant_id = %I.tenant_id and m.user_id = auth.uid()))', t, t, t);
    execute format('drop policy if exists "finance tenant delete" on public.%I', t);
    execute format('create policy "finance tenant delete" on public.%I for delete to authenticated using (exists (select 1 from public.customer_memberships m where m.tenant_id = %I.tenant_id and m.user_id = auth.uid()))', t, t);
  end loop;
end $$;
