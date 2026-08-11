export const benchmarkDimensions = [
  { id: 'accuracy', label: 'Accuracy', weight: 18, description: 'Gets material facts, assumptions, math, and business logic right.' },
  { id: 'judgment', label: 'Executive judgment', weight: 16, description: 'Makes a useful recommendation, not just a summary.' },
  { id: 'crossFunctional', label: 'Cross-functional reasoning', weight: 14, description: 'Connects revenue, operations, finance, risk, customer, and technology implications.' },
  { id: 'execution', label: 'Execution quality', weight: 16, description: 'Produces concrete actions, owners, deliverables, and completion criteria.' },
  { id: 'evidence', label: 'Evidence discipline', weight: 12, description: 'Separates sourced facts, company-provided facts, assumptions, and inference.' },
  { id: 'risk', label: 'Risk detection', weight: 10, description: 'Finds important downside, compliance, financial, operational, and reputational risks.' },
  { id: 'control', label: 'Human-control discipline', weight: 8, description: 'Respects approval gates and does not pretend external actions occurred.' },
  { id: 'clarity', label: 'Decision clarity', weight: 6, description: 'Makes the next move obvious to the owner.' },
] as const;

export type BenchmarkDimensionId = (typeof benchmarkDimensions)[number]['id'];

export const benchmarkScenarios = [
  {
    id: 'revenue-recovery',
    title: 'Recover a slipping revenue pipeline',
    prompt: 'Pipeline is down 22% versus last quarter. Three large proposals are stalled, sales follow-up is inconsistent, operations is already near capacity, and cash reserves cover about four months. Give the CEO a decision, execution plan, risks, and what should happen in the next 72 hours.',
    pressure: ['Revenue', 'Cash', 'Operations', 'Sales execution'],
  },
  {
    id: 'competitor-entry',
    title: 'Respond to a stronger competitor',
    prompt: 'A better-funded competitor entered our region with lower pricing, a polished website, aggressive paid search, and a new channel partnership. We cannot win a price war. Decide how we should respond and turn the decision into a 30-day operating plan.',
    pressure: ['Strategy', 'Marketing', 'Pricing', 'Partnerships'],
  },
  {
    id: 'enterprise-deal',
    title: 'Protect a major enterprise deal',
    prompt: 'A prospect representing 28% of next year’s growth wants custom features, a 90-day pilot, security documentation, and pricing concessions. Sales wants to say yes immediately. Finance and operations are concerned. Decide whether and how to pursue it.',
    pressure: ['Sales', 'Finance', 'Operations', 'Technology', 'Risk'],
  },
  {
    id: 'service-failure',
    title: 'Handle a serious customer failure',
    prompt: 'A major customer experienced a service failure, posted publicly, and is threatening to leave. The root cause is not yet confirmed. Build the executive response, customer communication plan, investigation path, approval gates, and recovery metrics.',
    pressure: ['Customer', 'Operations', 'Communications', 'Risk'],
  },
  {
    id: 'growth-choice',
    title: 'Choose between two growth paths',
    prompt: 'We have enough capital for one major move this year: expand into a neighboring state or launch a new recurring-revenue service for current customers. Data is incomplete. Build the decision framework, recommendation, assumptions to validate, and execution sequence.',
    pressure: ['Strategy', 'Finance', 'Growth', 'Uncertainty'],
  },
] as const;

export const benchmarkPrinciples = [
  'Use the same scenario wording for every Aridon run being compared.',
  'Score the visible answer and deliverables, not hidden reasoning.',
  'Never claim competitor superiority without a reproducible side-by-side result.',
  'Keep benchmark prompts, scoring weights, model/version, and date attached to every result.',
  'Separate product capability from connector availability and external-service coverage.',
];
