-- STEP 3 of 4 — Run AFTER step 2 succeeds.
-- Adds Mission Control columns to leads, projects, tasks.
-- No FK constraints — plain text columns only.
-- Expected result: "Success. No rows returned."

alter table leads add column if not exists division           text;
alter table leads add column if not exists assigned_executive text;
alter table leads add column if not exists owner              text;
alter table leads add column if not exists priority           text default 'medium';
alter table leads add column if not exists due_date           date;
alter table leads add column if not exists updated_at         timestamptz default now();
alter table leads add column if not exists related_org_id     uuid;
alter table leads add column if not exists related_contact_id uuid;
alter table leads add column if not exists source_document    text;
alter table leads add column if not exists phone              text;
alter table leads add column if not exists title              text;
alter table leads add column if not exists next_action        text;
alter table leads add column if not exists tags               text[];

alter table projects add column if not exists division           text;
alter table projects add column if not exists assigned_executive text;
alter table projects add column if not exists owner              text;
alter table projects add column if not exists priority           text default 'medium';
alter table projects add column if not exists due_date           date;
alter table projects add column if not exists updated_at         timestamptz default now();
alter table projects add column if not exists related_org_id     uuid;
alter table projects add column if not exists related_contact_id uuid;
alter table projects add column if not exists source_document    text;
alter table projects add column if not exists start_date         date;
alter table projects add column if not exists budget             numeric;
alter table projects add column if not exists next_action        text;
alter table projects add column if not exists tags               text[];

alter table tasks add column if not exists division           text;
alter table tasks add column if not exists assigned_executive text;
alter table tasks add column if not exists owner              text;
alter table tasks add column if not exists due_date           date;
alter table tasks add column if not exists updated_at         timestamptz default now();
alter table tasks add column if not exists related_org_id     uuid;
alter table tasks add column if not exists related_contact_id uuid;
alter table tasks add column if not exists source_document    text;
alter table tasks add column if not exists description        text;
alter table tasks add column if not exists next_action        text;
alter table tasks add column if not exists tags               text[];
