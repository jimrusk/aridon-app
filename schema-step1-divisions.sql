-- STEP 1 of 4 — Run this ALONE first.
-- Expected result: "Success. No rows returned."

drop table if exists divisions cascade;

create table divisions (
  id          text primary key,
  name        text not null,
  description text,
  icon        text,
  color       text,
  created_at  timestamptz default now()
);

insert into divisions (id, name, description, icon, color) values
  ('aridon',    'Aridon',                     'AWG-1000, pilots, investors, sales',   '🌊', '#4A90D9'),
  ('iron-grid', 'Iron Grid Electric & Water', 'Field ops, installations, revenue',    '⚡', '#E87722'),
  ('swsa',      'SW Water Security Alliance', 'State outreach, policy, grant tracking','🏛', '#27AE60');
