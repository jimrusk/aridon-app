export type WorkloadClass =
  | "fast"
  | "standard"
  | "deep"
  | "research"
  | "coding"
  | "multimodal"
  | "tool";

export type ApprovalClass = "A0" | "A1" | "A2" | "A3";

export type SentinelDecision =
  | "ALLOW"
  | "ALLOW_WITH_LIMITS"
  | "NEEDS_APPROVAL"
  | "BLOCK";

export interface MissionPolicy {
  workload: WorkloadClass;
  approval: ApprovalClass;
  maxCostUsd?: number;
  maxLatencyMs?: number;
  requiresFreshData?: boolean;
  allowFallback: boolean;
  requireEvaluation: boolean;
}

export const EVA_PRODUCTION_DEFAULTS = {
  routing: {
    preferLowestCostMeetingQuality: true,
    escalateOnFailedEvaluation: true,
    providerIndependent: true,
    recordRoutingReason: true,
  },
  knowledge: {
    tenantScoped: true,
    requireProvenance: true,
    respectRls: true,
  },
  execution: {
    requireIdempotencyKey: true,
    verifyExternalOutcome: true,
    immutableAuditEvent: true,
    emergencyStopEnabled: true,
  },
  approvals: {
    A0: false,
    A1: false,
    A2: "tenant-configurable",
    A3: true,
  },
  sentinel: {
    preExecutionGate: true,
    postGenerationVerification: true,
    blockCrossTenantAccess: true,
    detectPromptInjection: true,
    detectDataExfiltration: true,
  },
} as const;

export function requiresHumanApproval(level: ApprovalClass): boolean {
  return level === "A3";
}

export function canExecute(
  sentinel: SentinelDecision,
  approval: ApprovalClass,
  approved = false,
): boolean {
  if (sentinel === "BLOCK") return false;
  if (sentinel === "NEEDS_APPROVAL") return approved;
  if (requiresHumanApproval(approval)) return approved;
  return true;
}
