-- Add an explicit rejected state to the Creator Studio human review gate.
alter table customer_creator_projects
  drop constraint if exists customer_creator_projects_status_check;

alter table customer_creator_projects
  add constraint customer_creator_projects_status_check
  check (status in ('draft','approved','rejected','archived'));
