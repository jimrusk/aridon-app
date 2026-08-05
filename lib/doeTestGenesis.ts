import { doeDeliverable, finalizeDoeProject } from './doeTestShared';

const type = 'Custom execution package';

export const GENESIS_INTELLIGENCE_TEST_PROJECT = finalizeDoeProject({
  id: 'doe-genesis-intelligence-test',
  title: 'Genesis Infrastructure Intelligence Concept',
  projectType: type,
  objective: 'Create a partnership-ready concept for physics-informed AI applied to critical power, storage, AI-load smoothing, water-energy optimization, and infrastructure resilience.',
  audience: 'DOE laboratories, research universities, Genesis Mission participants, engineering firms, equipment partners, test facilities, and federal prime contractors.',
  constraints: 'Do not imply Genesis selection, DOE endorsement, validated performance, an existing laboratory partnership, IP ownership, or scientific results. Separate proposed research from demonstrated capability and gate external submissions and IP decisions.',
  executiveSummary: 'The team completed a four-part research-partnership package centered on a physics-informed GridCore digital twin and AI-load shock absorber. The concept is framed as a controlled 250 kW research demonstration, with scientific validation led by a qualified laboratory or university and all autonomous-control, savings, and performance claims withheld until demonstrated.',
  nextAction: 'Approve the research concept, background-IP inventory, and partner-selection criteria before contacting prospective scientific leads.',
  deliverables: [
    doeDeliverable({
      id: 'genesis-concept-paper',
      title: 'Infrastructure intelligence partnership concept paper',
      type,
      owner: 'Eva',
      summary: 'Defines the research problem, proposed hybrid-model approach, partnership roles, and claims boundary.',
      content: `# Genesis Infrastructure Intelligence Partnership Concept

## Purpose
Develop and demonstrate physics-informed AI workflows that improve the planning and operation of critical power, energy storage, rapidly changing AI-compute loads, and related water-energy systems.

## Problem
Large computing and federal infrastructure sites combine electrical, thermal, water, operational, cybersecurity, and economic constraints. Conventional dashboards often report conditions after they occur. Pure machine-learning systems may become unreliable or difficult to explain when conditions move outside the training data. Traditional physics models may be too slow or incomplete for real-time scenario evaluation.

## Proposed approach
Aridon proposes an integrated research platform combining:
- electrical network and equipment models;
- battery electrochemical and thermal constraints;
- synchronized power-quality and operating data;
- workload or load-forecast signals where available;
- water-production and cooling-demand models where applicable;
- hard safety and operating limits; and
- AI methods for forecasting, anomaly detection, scenario evaluation, and decision support.

The system should compare physics-only, data-only, and hybrid models. Every model output should carry confidence, applicable operating range, input-quality status, and a traceable explanation of the constraints affecting the recommendation.

## Demonstration path
A controlled 250 kW GridCore platform would provide repeatable load ramps, storage response, source transitions, communication loss, sensor faults, and environmental conditions. The program would proceed through simulation, hardware-in-the-loop, low-power commissioning, controlled full-power tests, independent analysis, and a decision on any larger demonstration.

## Proposed partnership roles
- A DOE laboratory or research university leads scientific method and validation.
- A licensed engineering firm owns protection, grounding, interconnection, code, and safety review.
- Equipment partners provide UPS, switchgear, inverter, BESS, metering, PLC, load-bank, and sensor support.
- A qualified test facility hosts controlled experiments.
- Aridon contributes the integrated use case, prototype requirements, operating workflows, and commercialization path.
- An end-user advisor defines mission requirements without promising procurement.

## Expected research outputs
- validated datasets and metadata;
- comparative model-performance results;
- documented uncertainty and failure behavior;
- a digital-twin reference architecture;
- load-smoothing control results;
- human-operator decision-support findings;
- a scale-transfer assessment from 250 kW to multi-megawatt cells; and
- a commercialization and follow-on demonstration decision.

## Claim boundary
This is a proposed research program. It does not imply selection by the Genesis Mission, DOE endorsement, validated savings, existing laboratory commitment, approved autonomous operation, or demonstrated multi-megawatt performance.`,
    }),
    doeDeliverable({
      id: 'genesis-technical-framework',
      title: 'Digital twin, sensor framework, and load-shock-absorber research design',
      type,
      owner: 'Atlas',
      summary: 'Specifies model layers, required data, experimental logic, safety fallback, and measurable outcomes.',
      content: `# GridCore Digital Twin and AI Load-Shock-Absorber Framework

## 1. Digital-twin model layers
1. Electrical network: sources, impedance, transformers, switchgear, UPS, converters, buses, feeders, and loads.
2. Storage: state of charge, state of health, temperature, power and energy limits, losses, and degradation.
3. Critical load: baseline demand, rapid ramps, scheduled events, and allowable curtailment.
4. Thermal and environmental: equipment temperature, ambient conditions, enclosure limits, and cooling demand.
5. Water-energy: water production, pumping, storage, quality states, and cooling-water relationships where included.
6. Economics: tariffs, demand charges, fuel, degradation cost, and maintenance events.

## 2. Minimum sensor and data framework
Electrical channels should include three-phase voltage and current, real and reactive power, frequency, power factor, harmonics, transient events, breaker states, UPS loading and bypass states, converter commands, and alarms.

Storage channels should include rack or string voltage and current, state of charge, state of health, module temperature, cooling status, insulation or fault indicators, charge/discharge limits, and BMS events.

Operational channels should include feeder demand, controlled load commands, scheduled workload markers where available, maintenance records, alarms, and operator actions.

Environmental and optional water channels should include temperature, humidity, pressure, particulate conditions, enclosure airflow, water production, flow, storage level, selected quality indicators, and pump energy.

Every channel requires a source, unit, sample rate, calibration status, synchronized timestamp, owner, retention policy, and quality flag. Every model requires a version, training dataset, assumptions, applicable operating range, and validation record.

## 3. Load-shock-absorber hypothesis
A predictive controller using workload indicators, high-speed electrical measurements, and storage constraints may reduce the ramp rate and short-duration peaks seen by the upstream grid without violating critical-load or battery limits.

Proposed sequence:
1. Detect or predict a rapid load increase.
2. Dispatch a bounded portion from approved battery or UPS resources.
3. Ramp upstream utility or generation demand toward the new steady state at an approved rate.
4. Recover battery state of charge under an optimized schedule.
5. Fall back to deterministic local controls when data, models, or communications are unavailable.

## 4. Experimental variables
- load-ramp magnitude and duration;
- prediction horizon and forecast error;
- battery power, energy, temperature, and reserve constraints;
- approved upstream ramp-rate limit;
- converter and communications latency;
- competing objectives such as demand cost and degradation; and
- sensor loss or corruption scenarios.

## 5. Metrics
- maximum upstream ramp rate;
- peak-demand reduction;
- voltage and frequency disturbance;
- battery throughput and temperature;
- recovery time;
- prediction error and confidence calibration;
- number of constraint violations;
- operating cost and modeled degradation; and
- operator response time and error rate.

## 6. Safety boundary
The digital twin and AI layer remain supervisory decision support until independently validated and explicitly approved. Hardwired protection, local PLC logic, BMS limits, approved setpoints, and operator controls remain authoritative. No live critical-facility closed-loop deployment should occur before simulation, hardware-in-the-loop, controlled demonstration, and qualified safety review.`,
    }),
    doeDeliverable({
      id: 'genesis-research-ip-partners',
      title: 'Research questions, demonstration requirements, partner map, and IP decisions',
      type,
      owner: 'Scout',
      summary: 'Creates the research agenda, facility requirements, partner categories, and pre-collaboration IP checklist.',
      content: `# Research and Partnership Appendix

## Research questions
1. Does a physics-informed model predict short-duration load and storage behavior more accurately outside the training range than a data-only model?
2. Can bounded storage dispatch reduce upstream ramp rate while preserving critical-load continuity?
3. Does including battery temperature and degradation materially change optimal dispatch?
4. Can confidence-aware control reduce unsafe or uneconomic recommendations during sensor or forecast failure?
5. Can coordination of electrical demand with cooling or water-production schedules reduce peak demand without harming mission requirements?
6. Can operators trace each recommendation to measured conditions, constraints, and assumptions?
7. Which model components transfer from a 250 kW platform to a multi-megawatt cell?
8. Can the system maintain a safe deterministic state during loss or corruption of supervisory communications?
9. Does the decision-support layer improve operator response in controlled scenarios?

Each question requires a baseline, dataset, test method, acceptance metric, and independent review plan.

## Demonstration requirements
- controlled power laboratory or approved industrial test area;
- 250 kW programmable or representative load;
- modular UPS or equivalent power-conditioning equipment;
- bidirectional inverter and battery system;
- source or grid simulator and protected switchgear;
- synchronized high-speed metering and event recording;
- approved emergency shutdown and hazard analysis;
- electrical network, battery, thermal, and workload models;
- hardware-in-the-loop capability;
- version-controlled data and model repository;
- cybersecurity monitoring isolated from protection; and
- written data, publication, IP, incident, and stop-work terms.

## Partner categories and selection criteria
Potential roles include a scientific lead, licensed engineering authority, equipment OEMs, test facility, secure computing and data partner, end-user advisor, workforce partner, and commercialization or prime-contracting partner.

Selection criteria should include mission fit, test facilities, authority, safety culture, data rights, IP compatibility, cost share, schedule, publication terms, cybersecurity, and a named accountable lead.

## Intellectual-property decision map
| Asset | Preliminary treatment | Required decision |
|---|---|---|
| Existing GridCore concept and architecture | Aridon background IP | Document before collaboration |
| Partner equipment designs and firmware | Partner background IP | Define only necessary interface rights |
| Existing laboratory or university models | Institution background IP | Define licenses and restrictions |
| New control algorithms | To be negotiated | Inventorship, ownership, and license rights |
| Integrated digital-twin architecture | To be negotiated | Separate background from jointly developed elements |
| Test data | Project terms | Ownership, access, retention, publication, and commercial use |
| Trained parameters and software | To be negotiated | Relationship to source data and code |
| Safety and test procedures | Project-specific | Reuse and disclosure rights |
| Publications and open-source components | Sponsor-approved | Security, export, patent timing, and review |
| Customer-specific configurations | Customer terms | Confidentiality and reuse limits |

Before technical exchange, prepare a background-IP schedule, use an approved NDA where needed, decide patent-versus-publication timing, define data rights, and obtain legal review. This is a planning framework, not legal advice.`,
    }),
    doeDeliverable({
      id: 'genesis-outreach-plan',
      title: 'Partner outreach email and 90-day research partnership plan',
      type,
      owner: 'Heather',
      summary: 'Provides controlled partner outreach and a sequence leading to a documented proposal decision.',
      content: `# Partner Outreach Email

Subject: Physics-informed AI demonstration for critical power and infrastructure resilience

Hello [Name],

I’m Jim Rusk, founder of Aridon. We are developing GridCore, a modular critical-power concept intended to coordinate UPS systems, battery storage, rapidly changing AI-compute loads, and related water-energy infrastructure.

We are looking for a scientific and engineering partner to evaluate a physics-informed digital-twin and load-smoothing research program. The proposed demonstration would use a controlled 250 kW platform to compare physics-only, data-only, and hybrid models across load ramps, storage dispatch, source transitions, sensor faults, and degraded communications.

Aridon would contribute the integrated use case, prototype requirements, operating workflow, and commercialization path. We are seeking partners with power-systems, battery, controls, AI, test-facility, or infrastructure-resilience expertise.

This is an early partnership concept. Aridon is not claiming selection by the Genesis Mission, DOE endorsement, validated savings, or an existing laboratory relationship.

Would you be open to a brief discussion to determine whether the research questions fit your organization’s capabilities or an upcoming proposal team?

Thank you,

Jim Rusk
Founder, Aridon
[approved contact information]

# 90-Day Partnership Plan

## Days 1–15: Control the concept
Freeze the research problem, claims boundary, background-IP list, desired partner roles, two-page concept, digital-twin diagram, sensor framework, and minimum viable 250 kW configuration.

## Days 16–30: Recruit the core team
Approach a short list of laboratory, university, engineering, equipment, and test-facility partners. Use a standard discovery agenda covering mission fit, authority, facilities, data, IP, cost share, and schedule. Select one scientific lead and one engineering authority before broad outreach.

## Days 31–50: Build the research plan
Define baselines, hypotheses, datasets, model comparisons, test stages, acceptance metrics, budget categories, contribution matrix, hazard outline, cybersecurity boundary, and data-governance plan.

## Days 51–70: Choose the collaboration route
Verify an appropriate open solicitation, laboratory partnership mechanism, research agreement, subcontract, or privately funded demonstration through official sources. Confirm eligibility, submission authority, cost share, IP terms, and deadlines.

## Days 71–90: Reach a controlled decision
Conduct partner review, revise the work breakdown, and decide whether to submit, pursue a paid pre-proposal study, run a privately funded prototype, or pause.

Success means a named scientific lead, engineering authority, test path, agreed research matrix, background-IP schedule, and written go/no-go decision.

Release gate: verify the recipient, tailor the technical emphasis, and approve IP and claims language before sending.`,
    }),
  ],
});
