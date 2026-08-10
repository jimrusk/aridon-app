-- Aridon Creator Studio + private customer source library
create table if not exists customer_files (
  id uuid default gen_random_uuid() primary key,
  tenant_id uuid not null references customer_tenants(id) on delete cascade,
  uploaded_by uuid references auth.users(id) on delete set null,
  filename text not null,
  storage_path text not null unique,
  mime_type text,
  size_bytes bigint default 0,
  status text not null default 'uploading' check (status in ('uploading','ready','failed')),
  extraction_status text not null default 'pending' check (extraction_status in ('pending','ready','failed','not_needed')),
  extracted_text text,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists customer_creator_projects (
  id uuid default gen_random_uuid() primary key,
  tenant_id uuid not null references customer_tenants(id) on delete cascade,
  created_by uuid references auth.users(id) on delete set null,
  title text not null,
  campaign_type text not null default 'custom',
  goal text,
  audience text,
  offer text,
  channels text[] default '{}'::text[],
  brief text,
  status text not null default 'draft' check (status in ('draft','approved','archived')),
  output jsonb not null default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists customer_files_tenant_idx on customer_files(tenant_id, created_at desc);
create index if not exists customer_creator_projects_tenant_idx on customer_creator_projects(tenant_id, created_at desc);

alter table customer_files enable row level security;
alter table customer_creator_projects enable row level security;

-- Raw customer files remain private. Uploads are issued through authenticated,
-- time-limited signed upload tokens after server-side tenant membership checks.
insert into storage.buckets (id, name, public)
values ('customer-files', 'customer-files', false)
on conflict (id) do update set public = false;
