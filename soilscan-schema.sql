-- Aridon SoilScan AI
-- Evidence, calibration, nutrient screening, verification and regenerative-finance linkage.

create extension if not exists pgcrypto;

create table if not exists soilscan_sites (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid,
  operation_name text not null,
  field_name text not null,
  zone_name text,
  acres numeric,
  crop text,
  latitude numeric,
  longitude numeric,
  created_at timestamptz not null default now()
);

create table if not exists soilscan_samples (
  id uuid primary key default gen_random_uuid(),
  site_id uuid references soilscan_sites(id) on delete cascade,
  external_sample_id text unique,
  collected_at timestamptz,
  collection_method text,
  sample_depth_cm numeric,
  moisture_pct numeric,
  sample_prep text,
  sensor_model text,
  wavelength_min_nm integer,
  wavelength_max_nm integer,
  spectral_object_url text,
  model_version text,
  model_confidence numeric check (model_confidence between 0 and 1),
  nitrogen_class text check (nitrogen_class in ('low','medium','high')),
  phosphorus_class text check (phosphorus_class in ('low','medium','high')),
  potassium_class text check (potassium_class in ('low','medium','high')),
  organic_matter_estimate numeric,
  ph_estimate numeric,
  screening_notes text,
  created_at timestamptz not null default now()
);

create table if not exists soilscan_lab_results (
  id uuid primary key default gen_random_uuid(),
  sample_id uuid not null references soilscan_samples(id) on delete cascade,
  lab_name text,
  lab_method text,
  nitrogen_value numeric,
  nitrogen_unit text,
  phosphorus_value numeric,
  phosphorus_unit text,
  potassium_value numeric,
  potassium_unit text,
  organic_matter_pct numeric,
  ph numeric,
  report_object_url text,
  verified_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists soilscan_decisions (
  id uuid primary key default gen_random_uuid(),
  sample_id uuid not null references soilscan_samples(id) on delete cascade,
  recommendation text not null,
  decision_type text,
  requires_lab_confirmation boolean not null default true,
  owner_approved boolean not null default false,
  approved_at timestamptz,
  action_taken text,
  action_date date,
  outcome_notes text,
  created_at timestamptz not null default now()
);

create table if not exists soilscan_evidence_events (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references soilscan_sites(id) on delete cascade,
  sample_id uuid references soilscan_samples(id) on delete set null,
  evidence_type text not null,
  evidence_source text,
  measurement_method text,
  baseline_value numeric,
  current_value numeric,
  unit text,
  confidence numeric check (confidence between 0 and 1),
  verification_status text not null default 'screened' check (verification_status in ('screened','pending_lab','verified','rejected')),
  intended_use text,
  observed_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists soilscan_finance_scores (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references soilscan_sites(id) on delete cascade,
  score_version text not null,
  total_score numeric check (total_score between 0 and 100),
  measurement_confidence_score numeric,
  soil_trend_score numeric,
  water_efficiency_score numeric,
  input_efficiency_score numeric,
  yield_stability_score numeric,
  validation_score numeric,
  finance_readiness text,
  explanation text,
  calculated_at timestamptz not null default now()
);

create index if not exists idx_soilscan_samples_site on soilscan_samples(site_id, collected_at desc);
create index if not exists idx_soilscan_evidence_site on soilscan_evidence_events(site_id, observed_at desc);
create index if not exists idx_soilscan_finance_site on soilscan_finance_scores(site_id, calculated_at desc);

comment on table soilscan_samples is 'Rapid screening results. Do not treat as certified laboratory measurements unless supported by a linked verified lab result.';
