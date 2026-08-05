import { doeDeliverable, finalizeDoeProject } from './doeTestShared';

const type = 'Data-center electrical proposal';

export const PADUCAH_GRIDCORE_TEST_PROJECT = finalizeDoeProject({
  id: 'doe-paducah-gridcore-test',
  title: 'Paducah GridCore Entry Package',
  projectType: type,
  objective: 'Create a complete supplier-entry package positioning Aridon GridCore for the DOE Paducah American Energy Hub, with a 250 kW demonstrator scaling toward a repeatable 5 MW critical-power cell.',
  audience: 'DOE/PPPO small-business personnel, the selected campus and energy developers, serving utilities, incumbent contractors, engineering firms, and equipment partners.',
  constraints: 'Do not claim an awarded role, approved design, final price, certification, named contact, or guaranteed performance. Verify the procurement chain and require human approval before outreach or commitments.',
  executiveSummary: 'The team completed a four-part Paducah supplier-entry package containing the technical concept, supplier positioning, outreach copy, and a 90-day pursuit plan. The recommended lane is not to challenge the selected developers or utilities. Aridon should enter as a modular critical-power integration and demonstration partner, beginning with a paid interface study and a 250 kW prototype before any multi-megawatt claim.',
  nextAction: 'Verify the current Paducah procurement and small-business pathways, confirm an electrical-engineering partner, and approve the outreach messages for controlled release.',
  deliverables: [
    doeDeliverable({
      id: 'paducah-master-package',
      title: 'GridCore technical and commercial entry package',
      type,
      owner: 'Atlas',
      summary: 'Combines the opportunity brief, 250 kW architecture, 5 MW scale-up concept, commercial entry, and engineering boundaries.',
      content: `# Paducah GridCore Technical and Commercial Entry Package

## 1. Recommended market position
The Paducah American Energy Hub is a large owner-and-developer-led project. Aridon should not present itself as a replacement for the selected campus developer, the dedicated-energy developer, the serving utilities, an EPC firm, or an equipment manufacturer. The credible position is a specialist supplier and demonstration partner for modular critical-power integration, rapid-load management, controls, sensing, and operating-data systems.

The first commercial ask should be a paid feasibility and interface-definition study. A 250 kW demonstration should be offered as an optional second phase. The 5 MW cell is the future scale-up destination, not a presently certified product.

## 2. GridCore value proposition
GridCore is intended to coordinate:
- modular online UPS capacity and maintenance bypass;
- fast-response and longer-duration battery storage;
- distributed generation and approved renewable inputs;
- rapid AI-compute load ramps;
- power-quality and equipment-condition monitoring;
- local protective controls separated from supervisory intelligence;
- islanding, restoration, and controlled load shedding; and
- a digital-twin-ready historian and sensor architecture.

## 3. 250 kW demonstration architecture
A conceptual demonstration would use a 480 V three-phase source or grid simulator feeding protected switchgear, a modular UPS bank, and a programmable 250 kW critical-load emulator. A bidirectional 250 kW battery converter and an approximately 500 kWh battery would connect through a controlled bus. An optional renewable-resource simulator may connect at up to 100 kW. A separately protected 800 VDC research bay may be evaluated later.

Core equipment categories:
- source and service protection;
- three modular UPS blocks sized to demonstrate N+1 operation;
- 250 kW programmable load bank or equivalent controlled load;
- bidirectional converter and battery racks with independent BMS;
- high-speed power-quality and revenue-grade metering;
- PLC-based local sequencing and emergency shutdown;
- supervisory controller and historian;
- approved ventilation, fire detection, grounding, and physical protection.

Demonstration events:
1. No-break transfer and UPS ride-through.
2. Battery support during a rapid simulated AI-load increase.
3. Peak-demand clipping and controlled source ramping.
4. Islanded operation and approved resynchronization.
5. Safe fallback when communications or the supervisory layer fails.
6. Black-start under a reviewed test plan.
7. Synchronized event capture for digital-twin validation.

## 4. Repeatable 5 MW cell concept
The commercial destination is a repeatable 5 MW critical-load block with independent A and B paths, dual-corded load delivery, sectionalized medium-voltage energy interfaces, local protection, and a supervisory microgrid controller. Each cell should have standardized upstream, downstream, cooling, DCIM/EMS, storage, generator, maintenance-bypass, and emergency-shutdown interfaces.

Fast storage near the critical load should handle ride-through and power quality. Campus-scale storage should handle longer-duration resilience, demand management, renewable shifting, and generator transitions. The final split must be established by owner requirements, utility constraints, economics, and qualified engineering.

## 5. Paid first phase
The interface-definition study should produce:
- owner and utility requirement matrix;
- conceptual one-line and interface-control document;
- preliminary equipment schedule;
- load-ramp and storage model;
- data, controls, and cybersecurity architecture;
- hazard and verification register;
- prototype test matrix;
- budgetary cost range based on partner quotations; and
- go/no-go recommendation for the demonstration.

## 6. Engineering and claim boundary
This package is not stamped engineering, listed equipment, an approved interconnection, a reliability-tier certification, or a performance guarantee. Final topology, interrupting ratings, grounding, conductor sizing, protective-device coordination, arc-flash analysis, battery chemistry, fire strategy, site layout, utility approval, and construction documents require qualified owner-approved professionals and equipment partners.`,
    }),
    doeDeliverable({
      id: 'paducah-capability-and-map',
      title: 'Paducah capability statement and stakeholder map',
      type,
      owner: 'Eva',
      summary: 'Provides concise supplier-facing positioning and the questions to ask each stakeholder group.',
      content: `# Aridon Capability Statement: AI-Campus Power Resilience

Aridon is a New Mexico infrastructure-development company focused on modular power, water, controls, and resilience systems for data centers, public infrastructure, and remote operations.

## Proposed contribution
Aridon is developing GridCore, a modular critical-power integration concept intended to coordinate UPS systems, battery storage, distributed generation, renewable resources, power-quality monitoring, and rapid AI-load changes.

## Proposed capabilities
- critical-power concept development;
- modular UPS and BESS integration requirements;
- microgrid and islanding control logic;
- AI-load ramp and demand-management strategies;
- sensor architecture, event logging, and digital-twin data models;
- prototype planning and test design;
- coordination across OEM, EPC, utility, owner, and research teams; and
- operator-training concepts.

## Proposed engagement
Aridon seeks a paid feasibility and interface-definition phase followed by a 250 kW demonstration only if the responsible project organization identifies a fit. The purpose is to establish measured safety, operating, data, and integration evidence before proposing a repeatable 5 MW cell.

## Qualification boundary
Aridon is not representing GridCore as stamped engineering, approved equipment, an existing Paducah role, or a substitute for the selected developers, utilities, EPC firms, or OEMs.

# Stakeholder and Supplier-Entry Map

| Stakeholder category | Likely role | Aridon objective | First question |
|---|---|---|---|
| DOE EM / PPPO | Federal landowner and site oversight | Learn official supplier pathways | Which selected developer or prime owns critical-power supplier qualification? |
| Campus developer | Campus development and operation | Identify owner requirements | Who owns the data-hall electrical basis of design and prototype evaluation? |
| Energy developer | Generation and storage delivery | Explore controls and storage coordination | Is there a route for third-party resilience or controls demonstrations? |
| Wholesale and retail utilities | Service, protection, telemetry, interconnection | Understand grid-facing constraints | Which ramp-rate, protection, and telemetry requirements govern the campus? |
| Community utility partner | Local coordination and economic benefit | Align workforce and local-supplier value | Are local supplier or training partnerships being organized? |
| Incumbent DOE contractors | Site operations, infrastructure, cleanup, or security | Identify subcontract routes | Which scopes are available to qualified small businesses? |
| UPS, switchgear, BESS, controls, and meter OEMs | Equipment and validation | Build a qualified technical team | Which products and engineering support fit a 250 kW demonstrator? |
| EPC and engineering firms | Final design and construction authority | Close qualification gaps | Would the firm co-develop and validate the prototype package? |

Verify current organizations, contacts, portals, project responsibilities, site-access rules, and procurement schedules before outreach.`,
    }),
    doeDeliverable({
      id: 'paducah-outreach',
      title: 'Paducah supplier and small-business outreach messages',
      type,
      owner: 'Heather',
      summary: 'Two approval-gated messages for the project developer, prime contractor, or official small-business pathway.',
      content: `# Supplier Introduction Email

Subject: Modular critical-power demonstration for the Paducah AI campus

Hello [Name],

I’m Jim Rusk, founder of Aridon, a New Mexico infrastructure company developing modular power, water, controls, and resilience systems.

The Paducah American Energy Hub closely matches a critical-power architecture we are developing for large AI campuses. GridCore is intended to coordinate modular UPS capacity, battery storage, distributed generation, power-quality monitoring, and rapid AI-load changes through a locally safe, data-rich control platform.

We are not approaching this as a replacement for the selected developer, utility, EPC, or equipment manufacturers. We are seeking the correct supplier pathway for a paid interface study and, if useful to the responsible project team, a 250 kW demonstration that could validate controls and data requirements before any multi-megawatt application.

Could you direct me to the person responsible for critical-power innovation, supplier qualification, or prototype evaluation for the Paducah campus?

I can provide a concise concept and proposed demonstration scope for review.

Thank you,

Jim Rusk
Founder, Aridon
[approved phone]
[approved email]

# Small-Business Pathway Email

Subject: Small-business pathway for Paducah energy-hub critical-power technology

Hello [Small Business Program Manager],

Aridon is a New Mexico small business developing a modular critical-power and energy-management concept for large AI and high-performance-computing campuses.

Our GridCore concept combines UPS integration, battery and generation coordination, rapid-load smoothing, power-quality monitoring, and a digital-twin-ready sensor architecture. We would like to understand whether the Paducah project has a supplier-engagement, subcontracting, innovation-demonstration, or teaming pathway relevant to this work.

Our proposed first step is limited: a paid feasibility and interface-definition study, followed by a 250 kW demonstration only if the responsible organization sees a useful fit. We are not claiming approved equipment, final engineering, or an existing role on the project.

Would you please identify the appropriate developer, prime contractor, procurement portal, or technical contact for submitting a capability statement?

Thank you,

Jim Rusk
Founder, Aridon
[approved contact information]

Release gate: verify the recipient, organization, contact details, attachment, and every company representation before sending.`,
    }),
    doeDeliverable({
      id: 'paducah-90-day-plan',
      title: 'Paducah qualification checklist and 90-day action plan',
      type,
      owner: 'Nova',
      summary: 'Turns the concept into a measured supplier-qualification and partnership pursuit.',
      content: `# Supplier Qualification Checklist

## Corporate readiness
- Confirm legal company information, W-9, insurance position, registrations, UEI, and applicable NAICS codes.
- Prepare a one-page capability statement without unsupported past-performance claims.
- Confirm any small-business designations before using them.
- Create a controlled document room with versioned technical and corporate files.

## Technical readiness
- Freeze the GridCore scope and exclusions.
- Retain a licensed electrical-engineering partner.
- Identify UPS, switchgear, BESS, controls, metering, and load-bank partners.
- Create the conceptual one-line, interface-control document, hazard matrix, cybersecurity boundary, and test matrix.
- Define software, data, and IP ownership before sharing proprietary material.

## Procurement discovery
- Verify the developer, energy-resource, utility, DOE/PPPO, and incumbent-contractor supplier routes.
- Track industry days, RFIs, RFQs, prequalification requirements, and vendor events.
- Do not submit pricing, compliance claims, schedules, or proprietary drawings before approval.

# 90-Day Action Plan

## Days 1–15: Become supplier-ready
Finalize the concept, capability statement, corporate file set, engineering partner, and equipment-partner shortlist.

## Days 16–30: Map the actual procurement chain
Contact the official small-business pathway, verify supplier portals, request short discovery calls, and log every referral and qualification requirement.

## Days 31–50: Close technical gaps
Complete the prototype one-line, equipment categories, test matrix, risk register, and preliminary partner quotations. Do not represent budgetary quotations as final pricing.

## Days 51–70: Submit a controlled concept
Tailor the package to the party that owns critical-power requirements. Offer the paid interface study first and the demonstrator as an optional next phase.

## Days 71–90: Seek a written decision
Conduct a technical workshop, revise the scope, and pursue one of three outcomes: a paid study, a supplier-prequalification path, or a documented no-go with a re-entry date.

Success means one verified project owner, one qualified engineering partner, one formal supplier path, and one written decision on the study proposal.`,
    }),
  ],
});
