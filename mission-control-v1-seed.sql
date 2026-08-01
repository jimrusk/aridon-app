-- ============================================================
-- Aridon Mission Control v1 — Sample Data Seed
-- Run AFTER mission-control-v1-schema.sql
-- Run in: Supabase SQL Editor → New query → paste → Run
-- ============================================================

-- ── ORGANIZATIONS ───────────────────────────────────────────
insert into organizations (name, type, division, assigned_executive, owner, status, priority, state, notes) values
  ('Navajo Nation Water Authority',     'tribal',      'iron-grid', 'Ethos',  'Jim Rusk', 'active', 'high',   'NM', 'Primary deployment partner for AWG-1000 pilot. Relationship through tribal council.'),
  ('New Mexico Data Center LLC',        'data-center', 'aridon',    'Scout',  'Jim Rusk', 'active', 'high',   'NM', 'Target token buyer — AI cooling water offset demand. Intro scheduled.'),
  ('San Juan College',                  'government',  'iron-grid', 'Atlas',  'Jim Rusk', 'active', 'medium', 'NM', 'AWG build partner interest. Education infrastructure alignment.'),
  ('New Mexico EMNRD',                  'government',  'swsa',      'Ethos',  'Jim Rusk', 'active', 'medium', 'NM', 'Energy Minerals and Natural Resources Dept — clean energy manufacturing program.'),
  ('Southwest Water Security Alliance', 'ngo',         'swsa',      'Ethos',  'Jim Rusk', 'active', 'high',   'NM', '7-state coalition. Aridon verification and governance partner.'),
  ('USDA Rural Development NM',         'government',  'swsa',      'Scout',  'Jim Rusk', 'active', 'medium', 'NM', 'Grant funding source for tribal and rural water infrastructure.'),
  ('Iron Grid Electric & Water',        'partner',     'iron-grid', 'Heather','Jim Rusk', 'active', 'high',   'NM', 'Operating entity — field ops, installations, revenue.');


-- ── LEADS ───────────────────────────────────────────────────
-- Update existing leads that may already exist, or insert new ones
insert into leads (name, company, email, status, priority, division, assigned_executive, owner, notes, next_action) values
  ('Marcus Runningwater',  'Navajo Nation Water Authority', 'marcus@nwnation.example', 'qualified', 'high',   'iron-grid', 'Ethos',  'Jim Rusk', 'Tribal council contact. Water resilience project lead. AWG-1000 pilot interest.', 'Schedule site visit for AWG-1000 assessment.'),
  ('David Chen',           'New Mexico Data Center LLC',    'dchen@nmdatacenter.example', 'new',    'high',   'aridon',    'Scout',  'Jim Rusk', 'Data center developer. 10MW AI facility under construction in ABQ. Water offset buyer.', 'Send tokenization one-pager and schedule intro call.'),
  ('Dr. Sarah Montoya',    'San Juan College',              'smontoya@sjc.example',    'contacted', 'medium', 'iron-grid', 'Atlas',  'Jim Rusk', 'Facilities director. Interest in AWG system for campus water resilience + education program.', 'Follow up on proposal sent 7/15.'),
  ('Gov. Relations Office','SW Water Security Alliance',    '',                        'qualified', 'high',   'swsa',      'Ethos',  'Jim Rusk', 'Initial outreach made. SWSA interested in verification partnership conversation.', 'Prepare tokenization framework presentation for SWSA leadership.');


-- ── PROJECTS ────────────────────────────────────────────────
-- Update existing projects or insert new ones
insert into projects (name, description, executive, status, priority, division, assigned_executive, owner, next_action) values
  ('AWG-1000 Navajo Nation Pilot',         'Deploy first AWG-1000 unit at Navajo Nation site. Full integration with Iron Grid solar + storage system.', 'Atlas',  'active',   'high',   'iron-grid', 'Atlas',   'Jim Rusk', 'Complete site survey. Atlas to finalize power system specs.'),
  ('Aridon Mission Control v1',            'Upgrade Aridon AI platform with Mission Control dashboard, Heather briefing, division tracking, alerts.', 'Heather','active',   'high',   'aridon',    'Heather', 'Jim Rusk', 'Deploy to Vercel after schema migration.'),
  ('Water Tokenization Legal Framework',   'Engage Wyoming DAO attorney for token issuance structure. WaterLAB is the direct precedent.', 'Eva',    'planning', 'high',   'aridon',    'Eva',     'Jim Rusk', 'Identify and contact Wyoming DAO counsel. Eva to draft scope of engagement.'),
  ('SWSA Verification Partnership',        'Present Aridon tokenization framework to SWSA as verification and governance partner.', 'Ethos',  'planning', 'high',   'swsa',      'Ethos',   'Jim Rusk', 'Finalize presentation deck. Ethos to arrange intro meeting.'),
  ('New Mexico Manufacturing Site Study',  'Evaluate NM manufacturing sites for AWG-1000 production. JTIP incentives, Sandia Labs talent pipeline.', 'Atlas',  'planning', 'medium', 'iron-grid', 'Atlas',   'Jim Rusk', 'Contact NM EMNRD clean energy manufacturing concierge.'),
  ('NM Data Center Water Token Program',   'Develop and pitch water offset token program to New Mexico data center developers.', 'Scout',  'active',   'high',   'aridon',    'Scout',   'Jim Rusk', 'Scout to prepare first-buyer pitch. Target: NM Data Center LLC.');


-- ── TASKS ───────────────────────────────────────────────────
insert into tasks (title, assigned_to, priority, status, division, assigned_executive, owner, due_date, next_action, description) values
  ('Schedule Navajo Nation AWG site visit',        'Atlas',   'high',   'open', 'iron-grid', 'Atlas',   'Jim Rusk', current_date + 7,  'Call Marcus to confirm site access and bring Atlas for engineering assessment.', 'Confirm access with Marcus Runningwater. Atlas leads technical assessment.'),
  ('Send tokenization one-pager to NM data center','Scout',   'high',   'open', 'aridon',    'Scout',   'Jim Rusk', current_date + 3,  'Attach one-pager PDF and send intro email to David Chen.', 'Use the Aridon Water Tokenization pitch deck as the source.'),
  ('Contact Wyoming DAO attorney',                 'Eva',     'high',   'open', 'aridon',    'Eva',     'Jim Rusk', current_date + 14, 'Research WaterLAB counsel. Eva to draft initial legal engagement letter.', 'Wyoming DAO legal framework for token issuance structure.'),
  ('Finalize SWSA presentation deck',              'Ethos',   'high',   'open', 'swsa',      'Ethos',   'Jim Rusk', current_date + 10, 'Pull tokenization framework slides and add SWSA governance narrative.', 'Present at next SWSA regional meeting.'),
  ('Run mission-control-v1-schema.sql in Supabase','Heather', 'high',   'open', 'aridon',    'Heather', 'Jim Rusk', current_date + 1,  'Go to Supabase SQL Editor → New query → paste schema → Run.', 'Schema migration required before Mission Control v1 features work.'),
  ('Deploy mission-control-v1 to Vercel',          'Heather', 'high',   'open', 'aridon',    'Heather', 'Jim Rusk', current_date + 2,  'Push branch to GitHub. Import to Vercel if new, or redeploy existing project.', 'Run deploy bat or push branch and trigger Vercel rebuild.'),
  ('Register SAM.gov for federal contracting',     'Eva',     'medium', 'open', 'iron-grid', 'Eva',     'Jim Rusk', current_date + 30, 'Eva to complete SAM.gov registration for federal contract eligibility.', 'Required for USDA, BIA, DOE contract work.'),
  ('Research NM JTIP incentive requirements',      'Ledger',  'medium', 'open', 'iron-grid', 'Ledger',  'Jim Rusk', current_date + 21, 'Ledger to pull JTIP application requirements and estimate wage reimbursement.', 'Job Training Incentive Program for NM manufacturing.'),
  ('Track USDA Rural Development grant deadline',  'Scout',   'medium', 'open', 'swsa',      'Scout',   'Jim Rusk', current_date + 45, 'Scout to find next USDA RD funding cycle and add to grant tracker.', 'Primary federal grant source for tribal water infrastructure.'),
  ('Update company knowledge base with tokenization framework', 'Oracle', 'low', 'open', 'aridon', 'Oracle', 'Jim Rusk', current_date + 7, 'Oracle to ingest new tokenization framework docs into Knowledge Vault.', 'Keeps all executives current on strategy.');


-- ── ALERTS ──────────────────────────────────────────────────
insert into alerts (title, description, severity, division, assigned_executive, status, priority) values
  ('Schema migration required before launch',       'Run mission-control-v1-schema.sql in Supabase before the new Dashboard, Briefing, and Alert features will work.',    'red',   'aridon',    'Heather', 'open', 'high'),
  ('No legal entity for token issuance yet',        'Water token issuance requires Wyoming DAO or equivalent legal structure. Engage counsel immediately.',                'red',   'aridon',    'Eva',     'open', 'high'),
  ('Navajo Nation pilot not yet contracted',        'AWG-1000 pilot at Navajo Nation remains in verbal discussion stage. Written agreement needed before deployment.',     'amber', 'iron-grid', 'Ethos',   'open', 'high'),
  ('NM manufacturing site not selected',            'AWG-1000 scale production requires a manufacturing facility. Site evaluation not yet started.',                      'amber', 'iron-grid', 'Atlas',   'open', 'medium'),
  ('SWSA partnership not formalized',               'SWSA verification partnership is strategic but still informal. Formal MOU or agreement needed.',                     'amber', 'swsa',      'Ethos',   'open', 'medium'),
  ('All 7 AI Executives online',                    'Heather, Ethos, Atlas, Eva, Scout, Ledger, and Oracle are all active and ready.',                                   'green', 'aridon',    'Heather', 'open', 'low'),
  ('Aridon v0.3 live on Vercel',                    'aridon-v02.vercel.app is live, Supabase connected, auth working.',                                                  'green', 'aridon',    'Heather', 'open', 'low');


-- ── GRANTS ──────────────────────────────────────────────────
insert into grants (title, funder, division, assigned_executive, owner, status, priority, amount, due_date) values
  ('USDA Rural Development Water Infrastructure', 'USDA Rural Development',  'swsa',      'Scout', 'Jim Rusk', 'researching', 'high',   500000,  current_date + 60),
  ('Bureau of Indian Affairs Infrastructure Fund','BIA / DOI',               'iron-grid', 'Eva',   'Jim Rusk', 'eligible',    'high',   250000,  current_date + 45),
  ('DOE Clean Energy Resilience Grant',           'Department of Energy',    'aridon',    'Scout', 'Jim Rusk', 'researching', 'medium', 750000,  current_date + 90),
  ('EPA Water Infrastructure Program',            'US EPA',                  'swsa',      'Eva',   'Jim Rusk', 'researching', 'medium', 300000,  current_date + 120),
  ('NM Clean Energy Manufacturing Incentive',     'NM EMNRD',                'iron-grid', 'Scout', 'Jim Rusk', 'eligible',    'high',   150000,  current_date + 30);


-- ── PILOT SITES ──────────────────────────────────────────────
insert into pilot_sites (name, division, assigned_executive, owner, location, status, priority, awg_units, daily_capacity_liters, notes, next_action) values
  ('Navajo Nation Pilot Site — TBD',       'iron-grid', 'Atlas',   'Jim Rusk', 'Navajo Nation, NM',      'prospect', 'high',   1, 1000, 'Site location TBD pending council approval. Atlas to lead engineering assessment.', 'Complete site survey. Confirm GPS coordinates with tribal council.'),
  ('San Juan College Campus',              'iron-grid', 'Atlas',   'Jim Rusk', 'Farmington, NM',         'prospect', 'medium', 1, 1000, 'Education pilot potential. Dr. Montoya interested.', 'Follow up on proposal. Atlas to prepare technical spec.'),
  ('NM Data Center Cooling Application',   'aridon',    'Atlas',   'Jim Rusk', 'Albuquerque, NM',        'prospect', 'high',   3, 3000, 'AI cooling water offset use case. Token buyer aligned.', 'Scout to confirm interest. Atlas to spec multi-unit deployment.');


-- ── EXECUTIVE ACTIONS (activity seed) ───────────────────────
insert into executive_actions (action_type, title, description, executive, division, record_type) values
  ('created',     'Mission Control v1 project launched',         'Aridon upgraded to Mission Control v1 — Heather briefing, alerts, division tracking, and briefing archive.', 'Heather', 'aridon',    'project'),
  ('created',     'Schema migration prepared',                   '20-table Mission Control schema ready. Awaiting deployment to Supabase.',                                     'Heather', 'aridon',    'task'),
  ('recommended', 'Wyoming DAO attorney engagement recommended', 'Water tokenization requires immediate legal structure. Wyoming DAO is the proven model.',                     'Eva',     'aridon',    'task'),
  ('created',     'SWSA presentation deck tasked',               'Ethos assigned to finalize SWSA verification partnership presentation.',                                      'Ethos',   'swsa',      'task'),
  ('created',     'Navajo Nation site visit scheduled',          'Atlas assigned to lead AWG-1000 engineering site assessment.',                                               'Atlas',   'iron-grid', 'project'),
  ('flagged',     'No token issuance legal entity — red alert',  'Eva flagged: water token issuance requires legal entity. Wyoming DAO structure urgently needed.',           'Eva',     'aridon',    'alert'),
  ('created',     'Navajo Nation lead qualified',                'Marcus Runningwater qualified as high-priority lead. AWG-1000 pilot interest confirmed.',                    'Scout',   'iron-grid', 'lead'),
  ('created',     'NM Data Center opportunity opened',           'David Chen at NM Data Center LLC identified as first water token buyer prospect.',                           'Scout',   'aridon',    'lead');

-- ============================================================
-- END OF SEED DATA
-- ============================================================
