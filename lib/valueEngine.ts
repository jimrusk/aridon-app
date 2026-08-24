export type OpportunityState = 'identified' | 'approved' | 'executed' | 'observed' | 'verified' | 'rejected';

export type EvidenceRef = {
  id: string;
  source: string;
  capturedAt: string;
  hash?: string;
};

export type EngineLineage = {
  engineVersion: 'v2.1.0-enterprise';
  modelProvider: string;
  model: string;
  promptConfigVersion: string;
  calculationVersion: string;
  runId: string;
};

export type ValueOpportunity = {
  id: string;
  tenantId: string;
  title: string;
  lane: 'revenue' | 'cost' | 'time' | 'inventory' | 'retention' | 'risk' | 'ag';
  state: OpportunityState;
  confidence: number;
  modeledValue: number;
  approvedValue?: number;
  verifiedValue?: number;
  hoursSaved?: number;
  evidence: EvidenceRef[];
  lineage: EngineLineage;
  recommendedAction: string;
  humanApprovalRequired: boolean;
  createdAt: string;
  updatedAt: string;
};

export function summarizeVerifiedValue(items: ValueOpportunity[]) {
  return items.reduce(
    (totals, item) => {
      totals.identified += item.modeledValue || 0;
      totals.approved += item.approvedValue || 0;
      totals.verified += item.state === 'verified' ? item.verifiedValue || 0 : 0;
      totals.hoursSaved += item.state === 'verified' ? item.hoursSaved || 0 : 0;
      return totals;
    },
    { identified: 0, approved: 0, verified: 0, hoursSaved: 0 }
  );
}

export function canExecute(item: ValueOpportunity) {
  return !item.humanApprovalRequired || item.state === 'approved';
}

export function transitionOpportunity(item: ValueOpportunity, next: OpportunityState): ValueOpportunity {
  const allowed: Record<OpportunityState, OpportunityState[]> = {
    identified: ['approved', 'rejected'],
    approved: ['executed', 'rejected'],
    executed: ['observed'],
    observed: ['verified', 'rejected'],
    verified: [],
    rejected: [],
  };
  if (!allowed[item.state].includes(next)) throw new Error(`Invalid opportunity transition: ${item.state} -> ${next}`);
  return { ...item, state: next, updatedAt: new Date().toISOString() };
}
