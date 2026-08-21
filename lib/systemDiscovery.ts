export type SystemConnection = {
  id: string;
  name: string;
  category: 'crm' | 'email' | 'finance' | 'support' | 'documents' | 'project' | 'data' | 'custom';
  status: 'connected' | 'planned';
  capabilities: string[];
  writeEnabled?: boolean;
};

export type WorkflowDiscovery = {
  id: string;
  name: string;
  trigger: string;
  systems: string[];
  steps: string[];
  friction: string[];
  opportunity: string;
  recommendedAgent: string;
  governance: string;
  evidenceNeeded: string[];
};

export function discoverWorkflows(systems: SystemConnection[]): WorkflowDiscovery[] {
  const has = (category: SystemConnection['category']) => systems.some(s => s.category === category && s.status === 'connected');
  const names = (categories: SystemConnection['category'][]) => systems.filter(s => categories.includes(s.category)).map(s => s.name);
  const workflows: WorkflowDiscovery[] = [];

  if (has('crm') && has('email')) workflows.push({
    id: 'lead-to-followup', name: 'Lead → qualification → follow-up', trigger: 'New lead or opportunity activity',
    systems: names(['crm','email']), steps: ['Detect new/stale lead','Enrich with business context','Score and prioritize','Draft personalized follow-up','Route high-value opportunities','Measure response and conversion'],
    friction: ['Slow response time','Inconsistent follow-up','CRM/email context split'], opportunity: 'Recover missed revenue and improve conversion without increasing lead volume', recommendedAgent: 'Scout · CSO',
    governance: 'Read and score automatically; require approval before external sends until policy permits narrower write actions.', evidenceNeeded: ['CRM stage history','Email timestamps','Won/lost outcomes','Lead source and deal value']
  });

  if (has('finance') && (has('email') || has('crm'))) workflows.push({
    id: 'invoice-to-cash', name: 'Invoice → collections → cash', trigger: 'Invoice becomes due or overdue',
    systems: names(['finance','email','crm']), steps: ['Detect overdue balance','Prioritize by value/risk','Check account context','Draft reminder','Escalate disputes','Track recovered cash and DSO'],
    friction: ['Manual aging review','Status chasing','Disconnected customer context'], opportunity: 'Accelerate cash collection and reduce receivables leakage', recommendedAgent: 'Ledger · CRO',
    governance: 'Financial records remain source of truth; external collection messages require approval; no autonomous payment commitments.', evidenceNeeded: ['A/R aging','Invoice status','Payment history','Dispute notes']
  });

  if (has('support') && has('crm')) workflows.push({
    id: 'support-to-retention', name: 'Support signal → retention action', trigger: 'High-risk support or customer-health signal',
    systems: names(['support','crm','email']), steps: ['Detect repeated/escalated issues','Join account value and history','Score churn risk','Create save play','Route strategic accounts','Measure retained revenue'],
    friction: ['Support and revenue data separated','Late churn detection'], opportunity: 'Protect recurring revenue through earlier intervention', recommendedAgent: 'Oracle · CMCO',
    governance: 'Risk scoring may run automatically; concessions, contractual changes and outbound commitments require approval.', evidenceNeeded: ['Ticket history','Account value','Renewal/churn outcomes','CSAT or health signals']
  });

  if (has('documents') && (has('project') || has('email'))) workflows.push({
    id: 'knowledge-to-execution', name: 'Knowledge → decision → execution', trigger: 'New request, project, meeting, or operating decision',
    systems: names(['documents','project','email']), steps: ['Retrieve authorized business context','Summarize relevant policy/history','Identify owner and next action','Draft task or decision artifact','Route for approval','Record outcome'],
    friction: ['Knowledge scattered across tools','Repeated research','Manual handoffs'], opportunity: 'Reduce coordination time while improving decision consistency', recommendedAgent: 'Eva · Chief of Staff',
    governance: 'Respect source-system permissions and least privilege; writes stay behind configured approval and action constraints.', evidenceNeeded: ['Document citations','Task timestamps','Approval history','Cycle time']
  });

  return workflows;
}

export function buildBusinessContextMap(systems: SystemConnection[]) {
  return {
    connectedSystems: systems.filter(s => s.status === 'connected').length,
    plannedSystems: systems.filter(s => s.status === 'planned').length,
    readWriteSystems: systems.filter(s => s.status === 'connected' && s.writeEnabled).map(s => s.name),
    principle: 'Ground agents in authorized business context, use least privilege, keep consequential writes governed, and attach evidence to measured outcomes.',
    integrationStandard: 'OpenAI Responses API / Agents SDK with apps and remote MCP servers where appropriate.'
  };
}
