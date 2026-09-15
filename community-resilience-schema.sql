-- Aridon Community Resilience pilot schema
-- Purpose: track communities, interventions, baseline/after metrics and evidence.

create table if not exists community_resilience_pilots (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  jurisdiction text,
  state text,
  partner_type text,
  partner_name text,
  status text not null default 'planning',
  target_homes integer not null default 100,
  target_businesses integer not null default 25,
  target_water_systems integer not null default 1,
  target_emergency_zones integer not null default 1,
  start_date date,
  end_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists community_resilience_participants (
  id uuid primary key default gen_random_uuid(),
  pilot_id uuid not null references community_resilience_pilots(id) on delete cascade,
  participant_type text not null check (participant_type in ('household','business','water_system','communications_node','public_partner')),
  external_ref text,
  display_name text,
  consent_status text not null default 'pending',
  enrolled_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists community_resilience_interventions (
  id uuid primary key default gen_random_uuid(),
  pilot_id uuid not null references community_resilience_pilots(id) on delete cascade,
  participant_id uuid references community_resilience_participants(id) on delete set null,
  workstream text not null check (workstream in ('cost_of_living','housing','small_business','trust_fraud','water','emergency_comms')),
  intervention_type text not null,
  provider text,
  planned_cost numeric,
  actual_cost numeric,
  status text not null default 'planned',
  started_at timestamptz,
  completed_at timestamptz,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists community_resilience_metrics (
  id uuid primary key default gen_random_uuid(),
  pilot_id uuid not null references community_resilience_pilots(id) on delete cascade,
  participant_id uuid references community_resilience_participants(id) on delete set null,
  workstream text not null,
  metric_key text not null,
  metric_value numeric,
  metric_unit text,
  period_start date,
  period_end date,
  phase text not null default 'baseline' check (phase in ('baseline','during','after')),
  evidence_uri text,
  source_name text,
  confidence text,
  created_at timestamptz not null default now()
);

create table if not exists community_resilience_trust_receipts (
  id uuid primary key default gen_random_uuid(),
  pilot_id uuid not null references community_resilience_pilots(id) on delete cascade,
  participant_id uuid references community_resilience_participants(id) on delete set null,
  subject_type text not null,
  subject_ref text,
  decision text not null check (decision in ('allow','verify','hold','block')),
  risk_score integer check (risk_score between 0 and 100),
  evidence_summary jsonb not null default '[]'::jsonb,
  verification_required boolean not null default false,
  verification_completed boolean not null default false,
  receipt_hash text,
  created_at timestamptz not null default now()
);

create index if not exists cr_participants_pilot_idx on community_resilience_participants(pilot_id);
create index if not exists cr_interventions_pilot_idx on community_resilience_interventions(pilot_id);
create index if not exists cr_metrics_pilot_metric_idx on community_resilience_metrics(pilot_id, metric_key);
create index if not exists cr_trust_receipts_pilot_idx on community_resilience_trust_receipts(pilot_id);
