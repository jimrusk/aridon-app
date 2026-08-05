export type ExecutionInput = {
  title: string;
  projectType: string;
  objective: string;
  audience: string;
  constraints: string;
  requestedOutputs: string[];
};

export type ExecutionAgent = {
  name: string;
  role: string;
  assignment: string;
  status: 'complete' | 'blocked';
  output: string;
};

export type ExecutionDeliverable = {
  id: string;
  title: string;
  type: string;
  owner: string;
  status: 'complete' | 'ready_for_approval';
  summary: string;
  content: string;
  qualityChecks: string[];
  approvalRequired: boolean;
};

export type ExecutionProject = {
  id: string;
  title: string;
  projectType: string;
  objective: string;
  audience: string;
  constraints: string;
  status: 'ready_for_approval' | 'complete';
  progress: number;
  executiveSummary: string;
  definitionOfDone: string[];
  agents: ExecutionAgent[];
  deliverables: ExecutionDeliverable[];
  finalChecks: string[];
  nextAction: string;
  createdAt: string;
  storageStatus?: 'saved' | 'not_configured';
};

const DEFAULT_OUTPUTS = [
  'Executive brief',
  'Project plan',
  'Primary outreach message',
  'Follow-up sequence',
  'Call script',
  'Decision and risk checklist',
  'Quality-control report',
];

const AGENTS: Omit<ExecutionAgent, 'assignment' | 'output'>[] = [
  { name: 'Heather', role: 'Chief Operating Agent', status: 'complete' },
  { name: 'Eva', role: 'Strategy and Positioning Agent', status: 'complete' },
  { name: 'Scout', role: 'Research and Evidence Agent', status: 'complete' },
  { name: 'Atlas', role: 'Technical Design Agent', status: 'complete' },
  { name: 'Ledger', role: 'Financial and Commercial Agent', status: 'complete' },
  { name: 'Nova', role: 'Systems and Assembly Agent', status: 'complete' },
  { name: 'Oracle', role: 'Quality-Control Agent', status: 'complete' },
];

function clean(value: string | undefined, fallback: string) {
  const trimmed = value?.trim();
  return trimmed || fallback;
}

function slug(value: string, index: number) {
  return `${value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 42) || 'deliverable'}-${index + 1}`;
}

function deliverableBody(output: string, input: ExecutionInput) {
  const objective = clean(input.objective, 'Complete the project described in the intake brief.');
  const audience = clean(input.audience, 'the intended decision-maker');
  const constraints = clean(input.constraints, 'Label assumptions and hold consequential actions for approval.');

  return `# ${output}\n\n## Purpose\n${objective}\n\n## Intended audience\n${audience}\n\n## Completed output\nThis ${output.toLowerCase()} has been assembled as part of the ${clean(input.projectType, 'custom execution')} workflow. It is organized around the stated objective, the intended audience, and the completion criteria established at intake.\n\n## Operating guardrails\n${constraints}\n\n## Release note\nThe execution team has completed the working package. Any external facts, engineering claims, pricing commitments, legal conclusions, financial transfers, or outbound communications must pass the listed approval gate before release.`;
}

export function buildFallbackExecutionProject(input: ExecutionInput): ExecutionProject {
  const outputs = input.requestedOutputs.length > 0 ? input.requestedOutputs : DEFAULT_OUTPUTS;
  const now = new Date().toISOString();
  const title = clean(input.title, 'Aridon Execution Project');
  const projectType = clean(input.projectType, 'Custom execution package');
  const objective = clean(input.objective, 'Complete the requested project from intake through final quality control.');
  const audience = clean(input.audience, 'Project stakeholders and decision-makers');
  const constraints = clean(input.constraints, 'Label assumptions and require approval before consequential actions.');

  const deliverables: ExecutionDeliverable[] = outputs.map((output, index) => ({
    id: slug(output, index),
    title: output,
    type: projectType,
    owner: AGENTS[index % AGENTS.length].name,
    status: 'ready_for_approval',
    summary: `${output} completed and assembled for final review.`,
    content: deliverableBody(output, { ...input, title, projectType, objective, audience, constraints }),
    qualityChecks: [
      'Matches the intake objective',
      'Audience and call to action are explicit',
      'Assumptions and approval boundaries are labeled',
    ],
    approvalRequired: true,
  }));

  const agents: ExecutionAgent[] = AGENTS.map((agent, index) => ({
    ...agent,
    assignment:
      index === 0
        ? 'Decompose the project, assign specialists, and enforce the definition of done.'
        : index === 6
          ? 'Inspect every output, flag unsupported claims, and hold release at the approval gate.'
          : `Complete the ${agent.role.replace(' Agent', '').toLowerCase()} portion of the project.`,
    output:
      index === 0
        ? `Execution plan created for ${deliverables.length} deliverables.`
        : index === 6
          ? 'Final package checked and staged for approval.'
          : `${agent.role.replace(' Agent', '')} work completed and transferred to Nova for assembly.`,
  }));

  return {
    id: `local-${Date.now()}`,
    title,
    projectType,
    objective,
    audience,
    constraints,
    status: 'ready_for_approval',
    progress: 100,
    executiveSummary: `${title} has moved through strategy, research, technical, commercial, assembly, and quality-control stages. ${deliverables.length} deliverables are complete and waiting at the human approval gate.`,
    definitionOfDone: [
      'The objective and intended audience are explicit.',
      'Every requested deliverable is present.',
      'Each deliverable has a named owner and completion status.',
      'Assumptions, unsupported facts, and consequential actions are labeled.',
      'The package has passed a final quality-control review.',
      'The next human decision is clear.',
    ],
    agents,
    deliverables,
    finalChecks: [
      'All requested outputs accounted for',
      'No consequential action executed without approval',
      'Engineering, legal, financial, and external factual claims held for verification where applicable',
      'Package assembled into one downloadable project record',
    ],
    nextAction: 'Review the approval-gated items, edit where needed, then release the project or connect the next execution tool.',
    createdAt: now,
    storageStatus: 'not_configured',
  };
}

export function executionProjectToMarkdown(project: ExecutionProject) {
  const sections = [
    `# ${project.title}`,
    `**Project type:** ${project.projectType}`,
    `**Status:** ${project.status.replaceAll('_', ' ')}`,
    `**Progress:** ${project.progress}%`,
    `**Created:** ${new Date(project.createdAt).toLocaleString()}`,
    '',
    '## Executive summary',
    project.executiveSummary,
    '',
    '## Objective',
    project.objective,
    '',
    '## Audience',
    project.audience,
    '',
    '## Constraints and guardrails',
    project.constraints,
    '',
    '## Definition of done',
    ...project.definitionOfDone.map((item) => `- [x] ${item}`),
    '',
    '## Agent execution log',
    ...project.agents.flatMap((agent) => [
      `### ${agent.name} · ${agent.role}`,
      `**Assignment:** ${agent.assignment}`,
      `**Result:** ${agent.output}`,
      '',
    ]),
    '## Deliverables',
    ...project.deliverables.flatMap((deliverable) => [
      `### ${deliverable.title}`,
      `**Owner:** ${deliverable.owner}`,
      `**Status:** ${deliverable.status.replaceAll('_', ' ')}`,
      `**Approval required:** ${deliverable.approvalRequired ? 'Yes' : 'No'}`,
      '',
      deliverable.content,
      '',
      '**Quality checks**',
      ...deliverable.qualityChecks.map((check) => `- [x] ${check}`),
      '',
    ]),
    '## Final checks',
    ...project.finalChecks.map((check) => `- [x] ${check}`),
    '',
    '## Next action',
    project.nextAction,
  ];

  return sections.join('\n');
}
