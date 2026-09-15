-- Aridon Trust Layer audit schema
-- Additive schema for future Supabase deployment. Review RLS and retention policy before applying.

create extension if not exists pgcrypto;

create table if not exists trust_entities (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid,
  entity_type text not null check (entity_type in ('person','organization','domain','email','phone','bank_account','document','device','other')),
  display_name text,
  canonical_value text,
  verification_status text not null default 'unverified' check (verification_status in ('unverified','pending','verified','revoked')),
  verified_at timestamptz,
  verified_by uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists trust_assessments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid,
  subject_type text not null,
  subject_ref text,
  channel text,
  score integer not null check (score between 0 and 100),
  level text not null check (level in ('low','verify','high','block')),
  action_gate text not null check (action_gate in ('proceed','verify_out_of_band','hold','block_automation')),
  signal_summary jsonb not null default '[]'::jsonb,
  evidence_summary jsonb not null default '[]'::jsonb,
  input_fingerprint text not null,
  policy_version text not null,
  raw_content_stored boolean not null default false,
  created_by uuid,
  created_at timestamptz not null default now()
);

create index if not exists trust_assessments_org_created_idx on trust_assessments (organization_id, created_at desc);
create index if not exists trust_assessments_fingerprint_idx on trust_assessments (input_fingerprint);

create table if not exists trust_evidence (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid,
  assessment_id uuid references trust_assessments(id) on delete cascade,
  entity_id uuid references trust_entities(id) on delete set null,
  evidence_type text not null,
  source text,
  fingerprint text,
  status text not null default 'observed' check (status in ('observed','verified','rejected','expired')),
  notes text,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid,
  created_at timestamptz not null default now()
);

create table if not exists trust_actions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid,
  assessment_id uuid references trust_assessments(id) on delete set null,
  action_type text not null,
  gate_decision text not null,
  decision_reason text,
  approved_by uuid,
  approved_at timestamptz,
  executed_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists trust_incidents (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid,
  assessment_id uuid references trust_assessments(id) on delete set null,
  incident_type text not null,
  severity text not null default 'medium' check (severity in ('low','medium','high','critical')),
  status text not null default 'open' check (status in ('open','investigating','contained','resolved','false_positive')),
  loss_avoided numeric,
  confirmed_loss numeric,
  summary text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

-- Recommended production controls:
-- 1. Enable row-level security on every table before exposing through a client.
-- 2. Scope every row to organization_id and authenticated membership.
-- 3. Keep raw message/document content out of these tables unless a customer explicitly opts in.
-- 4. Define retention periods for fingerprints, evidence, and incident records.
-- 5. Require human approval for overrides of hold/block decisions involving money, credentials, or critical infrastructure.
