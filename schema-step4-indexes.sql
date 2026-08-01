-- STEP 4 of 4 — Indexes (non-division only, safe to run on any state)
-- Expected result: "Success. No rows returned."

create index if not exists idx_leads_assigned_executive on leads(assigned_executive);
create index if not exists idx_leads_priority           on leads(priority);
create index if not exists idx_tasks_due_date           on tasks(due_date);
create index if not exists idx_tasks_priority           on tasks(priority);
create index if not exists idx_alerts_severity          on alerts(severity);
create index if not exists idx_alerts_status            on alerts(status);
create index if not exists idx_exec_actions_created     on executive_actions(created_at desc);
create index if not exists idx_exec_actions_executive   on executive_actions(executive);
create index if not exists idx_briefings_date           on executive_briefings(briefing_date desc);
create index if not exists idx_opportunities_status     on opportunities(status);
create index if not exists idx_grants_status            on grants(status);
create index if not exists idx_pilot_sites_status       on pilot_sites(status);
create index if not exists idx_contacts_org             on contacts(organization_id);
