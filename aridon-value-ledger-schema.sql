create table if not exists value_opportunities (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  run_id text not null,
  lane text not null check (lane in ('revenue','cost','time','inventory','retention','risk','ag')),
  title text not null,
  state text not null check (state in ('identified','approved','executed','observed','verified','rejected')) default 'identified',
  confidence numeric(5,4) not null check (confidence >= 0 and confidence <= 1),
  modeled_value numeric(14,2) not null default 0,
  approved_value numeric(14,2),
  verified_value numeric(14,2),
  hours_saved numeric(12,2),
  recommended_action text not null,
  human_approval_required boolean not null default true,
  engine_version text not null,
  model_provider text not null,
  model text not null,
  prompt_config_version text not null,
  calculation_version text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists value_evidence (
  id uuid primary key default gen_random_uuid(),
  opportunity_id uuid not null references value_opportunities(id) on delete cascade,
  source text not null,
  evidence_hash text,
  captured_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb
);

create table if not exists value_transitions (
  id uuid primary key default gen_random_uuid(),
  opportunity_id uuid not null references value_opportunities(id) on delete cascade,
  actor_id text not null,
  previous_state text,
  new_state text not null,
  request_id text,
  reason text,
  created_at timestamptz not null default now()
);

create index if not exists idx_value_opportunities_tenant_state on value_opportunities(tenant_id, state);
create index if not exists idx_value_opportunities_run on value_opportunities(run_id);
create index if not exists idx_value_evidence_opportunity on value_evidence(opportunity_id);
create index if not exists idx_value_transitions_opportunity on value_transitions(opportunity_id, created_at desc);
