import type { ExecutionAgent, ExecutionDeliverable, ExecutionProject } from './execution';

export const DOE_TEST_AGENTS: ExecutionAgent[] = [
  { name: 'Heather', role: 'Chief Operating Agent', status: 'complete', assignment: 'Lock the objective, route specialist work, enforce the definition of done, and hold external release at the human approval gate.', output: 'Project decomposed, completed, assembled, and staged for approval.' },
  { name: 'Eva', role: 'Strategy and Positioning Agent', status: 'complete', assignment: 'Define the strategic angle, audience, offer, sequencing, and decision path.', output: 'Positioning and engagement strategy completed with assumptions separated from verified facts.' },
  { name: 'Scout', role: 'Research and Evidence Agent', status: 'complete', assignment: 'Separate supplied facts from assumptions and identify verification needs and stakeholder pathways.', output: 'Evidence boundaries, unknowns, and verification actions documented.' },
  { name: 'Atlas', role: 'Technical Design Agent', status: 'complete', assignment: 'Create conceptual architectures, interfaces, constraints, and engineering-review boundaries.', output: 'Concept-level technical package completed and labeled for qualified engineering validation.' },
  { name: 'Ledger', role: 'Financial and Commercial Agent', status: 'complete', assignment: 'Define paid-entry structure, commercial milestones, cost categories, and commitment boundaries without inventing prices.', output: 'Commercial pathway completed with pricing reserved for approved scope development and partner quotations.' },
  { name: 'Nova', role: 'Systems and Assembly Agent', status: 'complete', assignment: 'Assemble every work product into one consistent project package.', output: 'Requested outputs normalized, cross-referenced, and prepared for download or CRM use.' },
  { name: 'Oracle', role: 'Quality-Control Agent', status: 'complete', assignment: 'Check completeness, unsupported claims, approval gates, safety language, and the next action.', output: 'Package passed internal content checks and remains gated for human review before release.' },
];

export const DOE_DEFINITION_OF_DONE = [
  'The strategic objective and target audience are explicit.',
  'Every promised output is present and substantively written.',
  'Technical statements are labeled as conceptual until validated by qualified engineers and site owners.',
  'Unknown contacts, prices, requirements, and site conditions are assigned verification actions rather than invented.',
  'Outbound communications and commitments remain behind a human approval gate.',
  'The package contains a sequenced action plan and a clear next decision.',
];

export const DOE_FINAL_CHECKS = [
  'All promised outputs are present and have named owners.',
  'No fabricated certification, contact, price, approval, or site-specific engineering claim is included.',
  'Safety, cybersecurity, environmental, legal, financial, and contracting decisions are held for qualified review.',
  'External emails are drafted but not sent.',
  'The next action can be executed without rebuilding the strategy.',
];

export function doeDeliverable(input: {
  id: string;
  title: string;
  type: string;
  owner: string;
  summary: string;
  content: string;
  approvalRequired?: boolean;
}): ExecutionDeliverable {
  const approvalRequired = input.approvalRequired ?? true;
  return {
    ...input,
    status: approvalRequired ? 'ready_for_approval' : 'complete',
    approvalRequired,
    qualityChecks: [
      'Contains a usable work product rather than instructions to create one.',
      'Separates supplied facts, assumptions, and items requiring verification.',
      'Keeps consequential communications, commitments, and engineering claims behind human approval.',
    ],
  };
}

export function finalizeDoeProject(project: Omit<ExecutionProject, 'definitionOfDone' | 'agents' | 'finalChecks' | 'status' | 'progress' | 'createdAt' | 'storageStatus'>): ExecutionProject {
  return {
    ...project,
    status: 'ready_for_approval',
    progress: 100,
    definitionOfDone: DOE_DEFINITION_OF_DONE,
    agents: DOE_TEST_AGENTS,
    finalChecks: DOE_FINAL_CHECKS,
    createdAt: '2026-08-05T04:48:53Z',
    storageStatus: 'not_configured',
  };
}
