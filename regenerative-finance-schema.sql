-- Aridon Ag regenerative finance / underwriting evidence layer

create table if not exists regenerative_risk_records (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid,
  operation_id uuid,
  soil_score numeric,
  water_score numeric,
  yield_stability_score numeric,
  input_efficiency_score numeric,
  practice_adoption_score numeric,
  verification_bonus numeric default 0,
  composite_score numeric,
  risk_band text,
  as_of_date date default current_date,
  created_at timestamptz default now()
);

create table if not exists regenerative_evidence_items (
  id uuid primary key default gen_random_uuid(),
  risk_record_id uuid references regenerative_risk_records(id) on delete cascade,
  evidence_type text not null,
  metric_name text not null,
  metric_value text,
  measurement_method text,
  source_system text,
  source_reference text,
  measured_at timestamptz,
  confidence numeric,
  verification_status text default 'unverified',
  verifier_name text,
  notes text,
  created_at timestamptz default now()
);

create table if not exists capital_fit_assessments (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid,
  operation_id uuid,
  risk_record_id uuid references regenerative_risk_records(id),
  capital_path text not null,
  capital_type text not null,
  fit_score numeric,
  intended_use text,
  recommended_action text,
  status text default 'draft',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists capital_fit_requirements (
  id uuid primary key default gen_random_uuid(),
  assessment_id uuid references capital_fit_assessments(id) on delete cascade,
  requirement_name text not null,
  requirement_status text default 'missing',
  evidence_item_id uuid references regenerative_evidence_items(id),
  notes text
);

create table if not exists capital_provider_profiles (
  id uuid primary key default gen_random_uuid(),
  provider_name text not null,
  provider_type text,
  capital_strategy text,
  geography text,
  min_check numeric,
  max_check numeric,
  target_borrower_or_asset text,
  transition_focus boolean default false,
  infrastructure_focus boolean default false,
  farmland_focus boolean default false,
  blended_capital_fit boolean default false,
  source_url text,
  last_verified_at timestamptz,
  created_at timestamptz default now()
);

create table if not exists capital_provider_matches (
  id uuid primary key default gen_random_uuid(),
  assessment_id uuid references capital_fit_assessments(id) on delete cascade,
  provider_id uuid references capital_provider_profiles(id) on delete cascade,
  match_score numeric,
  match_reason text,
  outreach_status text default 'not_contacted',
  next_action text,
  created_at timestamptz default now()
);

create table if not exists underwriting_packets (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid,
  operation_id uuid,
  risk_record_id uuid references regenerative_risk_records(id),
  packet_type text default 'lender',
  requested_amount numeric,
  use_of_funds text,
  repayment_source text,
  missing_evidence jsonb default '[]'::jsonb,
  packet_status text default 'draft',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_regen_risk_operation on regenerative_risk_records(operation_id, as_of_date desc);
create index if not exists idx_regen_evidence_risk on regenerative_evidence_items(risk_record_id);
create index if not exists idx_capital_fit_operation on capital_fit_assessments(operation_id, created_at desc);
create index if not exists idx_provider_match_assessment on capital_provider_matches(assessment_id, match_score desc);
