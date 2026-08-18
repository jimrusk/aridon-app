export type EnterpriseInput = {
  companyName: string;
  industry?: string;
  annualRevenue: number;
  employees: number;
  annualPayroll?: number;
  monthlyLeads?: number;
  leadConversionRate?: number;
  averageDealValue?: number;
  openReceivables?: number;
  overdueReceivables?: number;
  supportTicketsPerMonth?: number;
  adminHoursPerWeek?: number;
  hourlyLoadedCost?: number;
  churnRate?: number;
  notes?: string;
};

export type Opportunity = {
  id: string;
  lane: 'revenue' | 'cost' | 'cash' | 'customer' | 'operations';
  title: string;
  finding: string;
  annualValue: number;
  confidence: number;
  recommendedAgent: string;
  workflow: string;
  approvalRequired: boolean;
};

export type EnterpriseScan = {
  companyName: string;
  analyzedAt: string;
  opportunityScore: number;
  annualOpportunity: number;
  opportunities: Opportunity[];
  executiveBrief: string[];
  forwardDeploymentPlan: {
    phase: string;
    objective: string;
    outputs: string[];
  }[];
  openAIAlignment: string[];
  proofBaseline: {
    annualRevenue: number;
    employees: number;
    annualPayroll: number;
    monthlyLeads: number;
    leadConversionRate: number;
    openReceivables: number;
    overdueReceivables: number;
    adminHoursPerWeek: number;
  };
};

const n = (value: unknown, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.max(0, parsed) : fallback;
};

const pct = (value: unknown, fallback = 0) => {
  const parsed = n(value, fallback);
  return parsed > 1 ? parsed / 100 : parsed;
};

export function normalizeEnterpriseInput(raw: Partial<EnterpriseInput>): EnterpriseInput {
  const employees = Math.max(1, Math.round(n(raw.employees, 1)));
  return {
    companyName: String(raw.companyName || 'Company').trim().slice(0, 120) || 'Company',
    industry: String(raw.industry || '').trim().slice(0, 120),
    annualRevenue: n(raw.annualRevenue),
    employees,
    annualPayroll: n(raw.annualPayroll, employees * 65000),
    monthlyLeads: n(raw.monthlyLeads),
    leadConversionRate: pct(raw.leadConversionRate),
    averageDealValue: n(raw.averageDealValue),
    openReceivables: n(raw.openReceivables),
    overdueReceivables: n(raw.overdueReceivables),
    supportTicketsPerMonth: n(raw.supportTicketsPerMonth),
    adminHoursPerWeek: n(raw.adminHoursPerWeek, employees * 2),
    hourlyLoadedCost: n(raw.hourlyLoadedCost, 38),
    churnRate: pct(raw.churnRate),
    notes: String(raw.notes || '').trim().slice(0, 4000),
  };
}

export function runEnterpriseScan(raw: Partial<EnterpriseInput>): EnterpriseScan {
  const input = normalizeEnterpriseInput(raw);
  const opportunities: Opportunity[] = [];

  const leads = input.monthlyLeads || 0;
  const conversion = input.leadConversionRate || 0;
  const avgDeal = input.averageDealValue || 0;
  if (leads > 0 && avgDeal > 0) {
    const improvement = Math.min(0.04, Math.max(0.01, conversion * 0.2 || 0.02));
    const value = leads * 12 * improvement * avgDeal;
    opportunities.push({
      id: 'lead-conversion', lane: 'revenue', title: 'Lead conversion recovery',
      finding: `A ${Math.round(improvement * 1000) / 10}-point lift in lead conversion creates measurable upside without increasing lead volume.`,
      annualValue: value, confidence: 78, recommendedAgent: 'Scout · CSO',
      workflow: 'Score inbound leads, route hot opportunities, draft personalized follow-up, enforce response-time SLAs and measure win/loss reasons.',
      approvalRequired: true,
    });
  }

  const adminHours = input.adminHoursPerWeek || 0;
  const loadedCost = input.hourlyLoadedCost || 38;
  if (adminHours > 0) {
    const automatable = adminHours * 0.35;
    const value = automatable * 52 * loadedCost;
    opportunities.push({
      id: 'admin-automation', lane: 'operations', title: 'Administrative workflow automation',
      finding: `About ${Math.round(automatable)} hours/week of repetitive coordination is a conservative automation target.`,
      annualValue: value, confidence: 82, recommendedAgent: 'Heather · COO',
      workflow: 'Map repetitive intake, scheduling, reporting, handoffs and document workflows; automate drafts and routing while preserving approval gates.',
      approvalRequired: false,
    });
  }

  const overdue = input.overdueReceivables || 0;
  if (overdue > 0) {
    const recoverable = overdue * 0.35;
    opportunities.push({
      id: 'ar-recovery', lane: 'cash', title: 'Receivables recovery',
      finding: `A conservative 35% recovery/acceleration target on overdue receivables represents ${Math.round(recoverable).toLocaleString('en-US')} in cash impact.`,
      annualValue: recoverable, confidence: 86, recommendedAgent: 'Ledger · CRO',
      workflow: 'Prioritize overdue accounts, draft compliant reminders, schedule follow-ups, flag disputes and measure days-sales-outstanding improvement.',
      approvalRequired: true,
    });
  }

  const payroll = input.annualPayroll || 0;
  if (payroll > 0) {
    const value = payroll * 0.025;
    opportunities.push({
      id: 'labor-leverage', lane: 'cost', title: 'Labor leverage and capacity recovery',
      finding: 'A 2.5% productivity recovery target is intentionally conservative and focuses on capacity, not headcount reduction.',
      annualValue: value, confidence: 70, recommendedAgent: 'Heather · COO',
      workflow: 'Identify duplicate entry, status chasing, recurring report preparation and low-value coordination; redesign work around exception handling.',
      approvalRequired: false,
    });
  }

  const churn = input.churnRate || 0;
  if (churn > 0 && input.annualRevenue > 0) {
    const retained = input.annualRevenue * Math.min(churn * 0.15, 0.025);
    opportunities.push({
      id: 'retention', lane: 'customer', title: 'Customer retention defense',
      finding: 'Early-warning customer signals and structured save workflows can protect recurring revenue before churn occurs.',
      annualValue: retained, confidence: 66, recommendedAgent: 'Oracle · CMCO',
      workflow: 'Detect usage/support/payment risk signals, create save plays, route high-value accounts to humans and measure retained revenue.',
      approvalRequired: true,
    });
  }

  if (input.annualRevenue > 0) {
    const value = input.annualRevenue * 0.01;
    opportunities.push({
      id: 'revenue-leakage', lane: 'revenue', title: 'Revenue leakage audit',
      finding: 'Aridon establishes a 1% revenue-leakage investigation target across stale quotes, missed follow-ups, dormant customers and unbilled work.',
      annualValue: value, confidence: 62, recommendedAgent: 'Eva · Chief of Staff',
      workflow: 'Reconcile CRM, proposals, invoices and customer activity; surface exceptions for owner approval and track recovered revenue in the ROI Ledger.',
      approvalRequired: true,
    });
  }

  const ranked = opportunities
    .map(o => ({ ...o, annualValue: Math.round(o.annualValue) }))
    .filter(o => o.annualValue > 0)
    .sort((a, b) => b.annualValue - a.annualValue)
    .slice(0, 8);

  const annualOpportunity = ranked.reduce((sum, item) => sum + item.annualValue, 0);
  const ratio = input.annualRevenue > 0 ? annualOpportunity / input.annualRevenue : 0;
  const opportunityScore = Math.max(1, Math.min(100, Math.round(35 + ranked.length * 6 + Math.min(ratio, 0.35) * 100)));

  const forwardDeploymentPlan = [
    {
      phase: '1 · Identify the right use cases',
      objective: 'Rank high-impact opportunities by measurable business value, confidence, feasibility and required human oversight.',
      outputs: ['Opportunity map', 'Value-at-stake estimate', 'Use-case priority', 'Success metrics and baseline'],
    },
    {
      phase: '2 · Redesign workflows',
      objective: 'Move from isolated AI assistance to delegated work with clearly defined handoffs, exceptions and owner approval gates.',
      outputs: ['Current-state workflow', 'AI-enabled future state', 'Human/agent responsibility map', 'Exception and escalation paths'],
    },
    {
      phase: '3 · Integrate systems and business context',
      objective: 'Ground agents in the same CRM, finance, support, documents and operating data used by the business.',
      outputs: ['System inventory', 'Required permissions', 'Business context map', 'Data-quality and access risks'],
    },
    {
      phase: '4 · Deploy responsibly',
      objective: 'Run production workflows with explicit permissions, auditable actions, human approvals and observable outcomes.',
      outputs: ['Agent identity and scope', 'Approval policy', 'Audit trail', 'Production rollout plan'],
    },
    {
      phase: '5 · Drive adoption and change management',
      objective: 'Make the new way of working usable by the people who own the process, not just technically functional.',
      outputs: ['Role-based onboarding', 'Operating playbook', 'Adoption metrics', 'Owner and team feedback loop'],
    },
    {
      phase: '6 · Evaluate, optimize and assure value',
      objective: 'Use the ROI Ledger to compare baseline vs. realized impact and continuously improve workflow quality, reliability and economics.',
      outputs: ['Evaluation set', 'Quality and reliability metrics', 'Verified ROI', 'Optimization backlog and scale decision'],
    },
  ];

  return {
    companyName: input.companyName,
    analyzedAt: new Date().toISOString(),
    opportunityScore,
    annualOpportunity,
    opportunities: ranked,
    executiveBrief: [
      `${ranked.length} measurable opportunities identified with an estimated annual value of $${annualOpportunity.toLocaleString('en-US')}.`,
      ranked[0] ? `Highest-value starting point: ${ranked[0].title} (~$${ranked[0].annualValue.toLocaleString('en-US')}/year).` : 'Add operating metrics to produce a quantified opportunity map.',
      'External messages, commitments, payments and consequential actions remain behind explicit human approval.',
      'ROI Ledger records baseline, intervention, evidence source, realized value and confidence so estimates can be replaced by verified outcomes.',
    ],
    forwardDeploymentPlan,
    openAIAlignment: [
      'Identify the right use cases and focus on the highest-impact opportunities.',
      'Redesign workflows instead of adding disconnected AI point solutions.',
      'Integrate with existing systems and data so agents operate with real business context.',
      'Use secure, governed deployment with explicit permissions and auditable actions.',
      'Drive adoption and change management so AI becomes part of everyday work.',
      'Evaluate and optimize continuously, with measurable business impact and value assurance.',
    ],
    proofBaseline: {
      annualRevenue: input.annualRevenue,
      employees: input.employees,
      annualPayroll: input.annualPayroll || 0,
      monthlyLeads: input.monthlyLeads || 0,
      leadConversionRate: input.leadConversionRate || 0,
      openReceivables: input.openReceivables || 0,
      overdueReceivables: input.overdueReceivables || 0,
      adminHoursPerWeek: input.adminHoursPerWeek || 0,
    },
  };
}
