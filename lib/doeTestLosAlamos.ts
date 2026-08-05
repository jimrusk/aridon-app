import { doeDeliverable, finalizeDoeProject } from './doeTestShared';

const type = 'Pilot outreach package';

export const LOS_ALAMOS_RESILIENCE_TEST_PROJECT = finalizeDoeProject({
  id: 'doe-los-alamos-resilience-test',
  title: 'Los Alamos Remote Resilience Pilot',
  projectType: type,
  objective: 'Create a complete outreach-ready pilot package for a non-safety-class Remote Resilience Pod supporting approved field monitoring, temporary operations, communications, and resilient power needs associated with Los Alamos legacy cleanup.',
  audience: 'DOE EM Los Alamos Field Office, N3B small-business and technical personnel, program owners, and qualified engineering partners.',
  constraints: 'Exclude nuclear-safety, radiological-process, protected-network, and safety-significant claims. Do not invent site conditions, contacts, qualifications, prices, or approvals. Require DOE, contractor, cybersecurity, environmental, safety, and licensed-engineering review.',
  executiveSummary: 'The team completed a four-part Los Alamos pilot package containing the field-use concept, technical and safety appendix, contractor-facing capability and outreach copy, and a 60-day engagement plan. The package deliberately narrows the first application to a site-selected non-safety-class use and makes a paid feasibility study the commercial entry point.',
  nextAction: 'Verify the current EM-LA and N3B small-business pathway, identify a licensed New Mexico engineering partner, and approve the discovery email.',
  deliverables: [
    doeDeliverable({
      id: 'los-alamos-master-pilot',
      title: 'Remote Resilience Pod pilot package',
      type,
      owner: 'Eva',
      summary: 'Defines the concept, appropriate use cases, paid feasibility scope, and owner decision path.',
      content: `# Los Alamos Remote Resilience Pilot Package

## 1. Concept
Aridon proposes a non-safety-class Remote Resilience Pod for temporary or remote field operations associated with environmental investigation and cleanup. The pod would combine resilient electrical supply, battery storage, local controls, communications support, environmental-sensor power, equipment monitoring, and optional non-process water production where the site owner determines that it is appropriate.

The pod is not proposed for safety-class, safety-significant, nuclear-process, radiological-treatment, safeguards-and-security, or protected-network functions in the initial pilot.

## 2. Candidate use cases
| Potential use | Possible value | Initial treatment |
|---|---|---|
| Environmental monitoring station | Continuous sensor and communications power | Candidate for study |
| Groundwater sampling support | Temporary power for approved pumps and instruments | Candidate for study |
| Remote communications repeater | Resilient power and condition monitoring | Candidate for study, subject to cybersecurity approval |
| Temporary field office | Power, charging, HVAC support, and communications | Candidate for study, subject to occupancy and fire requirements |
| Wildfire-preparation monitoring | Cameras, weather sensors, and communications | Candidate for study |
| Optional atmospheric-water module | Limited non-process water demonstration | Conditional on climate, water quality, drainage, and permits |
| Safety-class or nuclear-facility load | Could affect nuclear or radiological safety | Excluded from initial pilot |
| Radiological treatment equipment | Regulated process equipment | Excluded from initial pilot |
| Protected operational network | Cybersecurity-sensitive | Conditional or excluded unless explicitly authorized |

The DOE or contractor owner must assign the final safety, cybersecurity, environmental, and operational classification.

## 3. Paid feasibility and interface-definition scope
The first contract should answer whether the pod can safely and economically support one owner-selected non-safety-class use.

Owner inputs:
- connected load list, starting demand, operating profile, and allowable interruption;
- criticality and continuity requirements;
- available electrical sources and connection points;
- environmental, physical, access, fire, and security requirements;
- communications, network, data-retention, and cybersecurity requirements;
- quality-assurance, procurement, training, and site-access requirements.

Aridon-team outputs:
1. use-case and requirements matrix;
2. conceptual electrical and communications architecture;
3. preliminary equipment-category schedule;
4. battery-runtime and source-sizing model using supplied data;
5. siting and interface checklist;
6. risk, assumption, and verification register;
7. budgetary cost range based on qualified partner quotations;
8. pilot test and acceptance outline; and
9. go/no-go recommendation and next-phase scope.

Exclusions include stamped design, final equipment selection, nuclear safety analysis, environmental permitting, construction, network authorization, and guaranteed runtime or production.

## 4. Pilot decision path
The responsible site organization should select one use case and provide enough information for the feasibility study. Aridon and qualified partners then prepare a controlled concept. The project advances only after the site approves the classification, interfaces, safety approach, cybersecurity boundary, procurement route, and test plan.

The immediate ask is a discovery meeting and permission to submit a limited paid-feasibility proposal, not approval to install equipment.`,
    }),
    doeDeliverable({
      id: 'los-alamos-technical-safety',
      title: 'Conceptual architecture, equipment schedule, and safety limitations',
      type,
      owner: 'Atlas',
      summary: 'Provides the technical skeleton while making the regulatory and engineering boundaries unmistakable.',
      content: `# Remote Resilience Pod Technical and Safety Appendix

## Conceptual electrical path
Approved site source, portable generator, or renewable input → lockable service disconnect → protected AC distribution → approved critical-load panel. A bidirectional inverter connects a battery system sized after a load study. Sensitive instruments may receive an additional online UPS where approved.

## Control hierarchy
1. Hardwired protection, BMS limits, emergency stop, and local disconnects.
2. Local PLC for source sequencing, load shedding, alarms, and safe shutdown.
3. Optional supervisory gateway for trends, maintenance alerts, and approved remote reporting.
4. No dependence on cloud connectivity or AI for protective functions.

## Communications architecture
- isolated equipment network;
- approved cellular, radio, fiber, or site-network interface;
- store-and-forward historian during communications loss;
- encrypted access, role-based permissions, and event logs;
- optional one-way reporting architecture where required.

## Preliminary equipment categories
| System | Function | Selection inputs |
|---|---|---|
| Service disconnect and panel | Safe connection and isolation | Voltage, load, fault duty, enclosure |
| Bidirectional inverter/charger | Source and battery coordination | kW, surge, grid-forming need, listing |
| Battery and BMS | Ride-through and islanded runtime | kWh, chemistry, climate, fire strategy |
| Optional online UPS | Clean power for instruments | Load, runtime, bypass, harmonics |
| Generator interface | Backup source | Fuel, emissions, noise, ownership |
| Renewable controller | Approved solar or other input | Resource, footprint, curtailment |
| PLC and safety I/O | Local sequencing and alarms | Interlocks and site requirements |
| Metering and historian | Power quality and operating data | Sample rate, retention, cybersecurity |
| Communications gateway | Remote reporting | Approved network and encryption |
| HVAC and ventilation | Equipment environment | Heat load, climate, filtration |
| Fire and gas detection | Warning and shutdown input | Battery chemistry and code basis |
| Enclosure, trailer, or skid | Weather, transport, and security | Wind, snow, wildfire, access |
| Optional water module | Non-process water demonstration | Climate, quality, storage, discharge |

## Safety and regulatory limitations
- This is a concept, not approved site equipment.
- The initial scope excludes safety-class, safety-significant, nuclear-process, radiological-treatment, safeguards-and-security, and protected-network functions unless separately authorized and designed by qualified organizations.
- Final design requires applicable licensed electrical, structural, fire-protection, environmental, cybersecurity, and other professional review.
- Battery systems require approved chemistry, listing, fire testing, spacing, ventilation, detection, suppression, emergency response, and disposal plans.
- Generators require approved fuel, emissions, noise, grounding, and operating controls.
- Any water element requires a defined intended use, water-quality standards, sampling, storage, drainage, and contamination controls.
- No runtime, reliability, savings, production, or schedule guarantee may be made before site data and partner engineering are complete.
- Site access, badging, training, insurance, quality assurance, and subcontract requirements must be met before field activity.`,
    }),
    doeDeliverable({
      id: 'los-alamos-capability-outreach',
      title: 'N3B-facing capability statement, email, and discovery questions',
      type,
      owner: 'Heather',
      summary: 'Provides controlled contractor-facing language and the questions needed to define a real pilot.',
      content: `# Aridon Field Resilience Capability

Aridon develops modular infrastructure concepts combining resilient power, storage, controls, communications support, environmental monitoring, and optional water systems.

## Proposed capabilities
- non-safety-class remote power and battery concepts;
- local-control and safe-shutdown architecture;
- temporary field and monitoring support;
- power-quality, equipment-condition, and environmental sensing;
- container, trailer, and skid concept development;
- data-historian and maintenance-alert requirements;
- paid feasibility studies and technical-partner coordination; and
- operator-training and documentation concepts.

## Proposed Los Alamos entry
Aridon seeks one bounded field use where a Remote Resilience Pod could reduce generator runtime, improve instrumentation continuity, support communications, or simplify temporary deployment. Aridon expects to work beneath DOE and prime-contractor requirements and alongside qualified engineering, fire-protection, environmental, cybersecurity, and equipment partners.

Aridon is not claiming nuclear-safety qualification, radiological-process authority, site access, approved cybersecurity status, or an existing contract role.

# Small-Business Introduction Email

Subject: Non-safety-class remote resilience concept for Los Alamos field operations

Hello [Name],

I’m Jim Rusk, founder of Aridon, a New Mexico infrastructure company developing modular power, storage, controls, monitoring, and water-resilience concepts.

We are exploring a limited Remote Resilience Pod for non-safety-class field applications such as environmental monitoring, temporary field support, communications equipment, or approved groundwater-investigation support. The concept uses local protective controls, battery storage, optional generation or renewable inputs, and a secure monitoring layer.

We are not proposing this for nuclear-safety systems, radiological treatment equipment, or protected networks without the required DOE and contractor approvals. Our first request is a short discovery conversation to determine whether there is a suitable use case and an appropriate small-business or subcontracting pathway.

If useful, I can provide a paid feasibility scope that would produce a requirements matrix, conceptual architecture, risk register, budgetary estimate, and go/no-go recommendation.

Would you please direct me to the appropriate technical or small-business contact?

Thank you,

Jim Rusk
Founder, Aridon
[approved contact information]

# Pilot Discovery Questions
1. What exact field activity needs improved resilience?
2. Which loads are critical, and what are their starting, continuous, and peak demands?
3. What interruption duration is acceptable, and who owns the connected equipment?
4. Is any load safety-significant, process-connected, radiological, security-sensitive, or network-protected?
5. Which fire, electrical, quality-assurance, environmental, and emergency-management requirements apply?
6. What sources and connection points are available?
7. What wind, snow, wildfire, temperature, dust, altitude, access, and security conditions govern the site?
8. Is remote reporting permitted, and which communications pathway is approved?
9. Who owns the data, and what retention and cybersecurity review are required?
10. Which prime contractor or program owns the requirement?
11. Is a paid feasibility study an allowable first procurement?
12. What decision date and budget cycle govern the opportunity?

Release gate: verify the recipient, role, contact details, and every company representation before sending.`,
    }),
    doeDeliverable({
      id: 'los-alamos-60-day-plan',
      title: 'Los Alamos 60-day engagement plan',
      type,
      owner: 'Nova',
      summary: 'Moves from contact verification to a written decision on a bounded feasibility phase.',
      content: `# Los Alamos 60-Day Engagement Plan

## Days 1–10: Prepare
- Verify the current DOE EM-LA and N3B small-business and technical pathways.
- Finalize the capability statement, pilot concept, and feasibility-scope template.
- Identify a New Mexico licensed electrical partner and a field-enclosure or integration partner.
- Confirm Aridon registrations, insurance posture, and approved contact information.

## Days 11–20: Discover
- Send approved introductions.
- Request one 30-minute discovery call.
- Ask the owner for a candidate non-safety-class use instead of presenting a fixed site solution.
- Log classification, safety, cybersecurity, environmental, access, procurement, and schedule requirements.

## Days 21–35: Define
- Convert the selected use into a requirements matrix.
- Conduct a partner review of the one-line, battery approach, enclosure, fire strategy, communications boundary, and data requirements.
- Prepare a not-to-exceed feasibility proposal with explicit exclusions.

## Days 36–50: Present
- Present the feasibility scope to the responsible owner.
- Resolve questions involving data rights, site access, safety review, subcontracting, insurance, and partner roles.
- Obtain written authorization before using site names or technical data in external material.

## Days 51–60: Secure a decision
Pursue one of four outcomes:
1. paid feasibility award;
2. invitation to a supplier or technical process;
3. referral to another program owner; or
4. documented no-go with a future re-entry condition.

Success means a verified owner and a written decision on the feasibility phase, not merely an informal expression of interest.`,
    }),
  ],
});
