-- Aridon Executive Operations persistent controls and audit trail.
-- Applied to the production Supabase project on 2026-09-01.

create table if not exists executive_ops_controls (
  actor_email text primary key,
  external_actions_enabled boolean not null default true,
  updated_at timestamptz not null default now(),
  updated_by text
);

create table if not exists executive_ops_audit (
  id uuid primary key default gen_random_uuid(),
  actor_email text,
  executive text,
  action text not null,
  channel text not null,
  target text,
  approved boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists executive_ops_audit_created_idx on executive_ops_audit(created_at desc);
create index if not exists executive_ops_audit_actor_idx on executive_ops_audit(actor_email, created_at desc);

alter table executive_ops_controls enable row level security;
alter table executive_ops_audit enable row level security;
