export type EvaEvalCase = {
  id: string;
  audience: 'customer' | 'pro';
  transcript: string;
  expectedOutcome: string;
  policyRefs: string[];
  severity: 'low' | 'medium' | 'high';
};

export type EvaEvalResult = {
  caseId: string;
  resolved: boolean;
  merelyClosed: boolean;
  correct: boolean;
  fairToBothSides: boolean;
  policyCompliant: boolean;
  expectationAligned: boolean;
  evidenceGrounded: boolean;
  escalationCorrect: boolean;
  satisfactionSignal?: number;
  notes: string[];
};

export const EVA_SERVICE_EXPERIENCE_POLICY = {
  objective: 'Resolve the user problem, not merely close the conversation.',
  audiences: ['customer', 'pro'],
  gates: [
    'golden-dataset evaluation',
    'automated judge',
    'regression comparison',
    'human-review sampling',
    'high-severity mandatory human review',
  ],
  principles: [
    'Set expectations before work begins.',
    'Represent both sides of a marketplace dispute fairly.',
    'Use evidence and policy before intuition.',
    'Do not count a case as resolved unless the requested outcome was achieved or the remaining blocker is explicit.',
    'Measure retention, cost-to-serve, make-goods, satisfaction and contribution LTV separately so attribution is defensible.',
    'Block release when high-severity evals regress.',
  ],
} as const;

export function scoreEvaEval(results: EvaEvalResult[]) {
  const total = Math.max(results.length, 1);
  const rate = (key: keyof EvaEvalResult) => results.filter(r => r[key] === true).length / total;
  const regressions = results.filter(r => !r.correct || !r.policyCompliant || !r.evidenceGrounded || r.merelyClosed);
  const highRiskFailures = regressions.filter(r => !r.escalationCorrect);
  return {
    total: results.length,
    resolutionRate: rate('resolved'),
    correctnessRate: rate('correct'),
    fairnessRate: rate('fairToBothSides'),
    policyComplianceRate: rate('policyCompliant'),
    expectationAlignmentRate: rate('expectationAligned'),
    evidenceGroundingRate: rate('evidenceGrounded'),
    regressions,
    releaseBlocked: highRiskFailures.length > 0,
  };
}

export type ServiceOutcomeMetrics = {
  contributionLtv: number;
  retentionRate: number;
  costToServe: number;
  makeGoodCost: number;
  customerSatisfaction: number;
  proSatisfaction: number;
  aiResolutionRate: number;
};

export function compareServiceOutcome(before: ServiceOutcomeMetrics, after: ServiceOutcomeMetrics) {
  return {
    contributionLtvDelta: after.contributionLtv - before.contributionLtv,
    retentionDelta: after.retentionRate - before.retentionRate,
    costToServeDelta: after.costToServe - before.costToServe,
    makeGoodCostDelta: after.makeGoodCost - before.makeGoodCost,
    customerSatisfactionDelta: after.customerSatisfaction - before.customerSatisfaction,
    proSatisfactionDelta: after.proSatisfaction - before.proSatisfaction,
    aiResolutionDelta: after.aiResolutionRate - before.aiResolutionRate,
  };
}
