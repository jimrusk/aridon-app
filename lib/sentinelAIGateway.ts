import { containmentPlan, scoreSentinelIncident, SentinelSignals } from './sentinelSecurity';

export type SentinelGatewayDecision = 'allow' | 'review' | 'block';
export type SentinelToolRequest = {
  agentId: string;
  tool: string;
  operation?: string;
  destination?: string;
  content?: string;
  requestedScopes?: string[];
  allowedTools?: string[];
  allowedScopes?: string[];
  approvedDestinations?: string[];
};

const PROMPT_INJECTION = [
  /ignore (all|any|the|your) (previous|prior|system) instructions/i,
  /reveal (the )?(system prompt|hidden instructions|credentials|api key)/i,
  /bypass (security|policy|guardrails|permissions)/i,
  /disable (monitoring|logging|security|sentinel)/i,
];
const SECRET_PATTERN = /(sk-[A-Za-z0-9_-]{16,}|api[_ -]?key\s*[:=]|password\s*[:=]|private[_ -]?key)/i;

export function inspectAgentAction(req: SentinelToolRequest) {
  const signals: SentinelSignals = {};
  const reasons: string[] = [];
  const text = req.content || '';

  if (PROMPT_INJECTION.some((p) => p.test(text))) {
    signals.promptInjection = true;
    reasons.push('Untrusted content contains instruction-hijacking indicators.');
  }
  if (SECRET_PATTERN.test(text)) {
    signals.credentialExposure = true;
    reasons.push('Potential credential or secret detected in outbound content.');
  }
  if (req.allowedTools && !req.allowedTools.includes(req.tool)) {
    signals.unauthorizedToolUse = true;
    reasons.push(`Tool ${req.tool} is outside the agent allowlist.`);
  }
  const excessScopes = (req.requestedScopes || []).filter((s) => !(req.allowedScopes || []).includes(s));
  if (excessScopes.length) {
    signals.privilegeEscalation = true;
    reasons.push(`Unauthorized scopes requested: ${excessScopes.join(', ')}.`);
  }
  if (req.destination && req.approvedDestinations && !req.approvedDestinations.includes(req.destination)) {
    signals.covertChannel = true;
    signals.dataExfiltration = Boolean(text);
    reasons.push('Outbound destination is not approved for this agent.');
  }

  const { riskScore, severity } = scoreSentinelIncident(signals);
  const hardBlock = Boolean(signals.credentialExposure || signals.unauthorizedToolUse || signals.privilegeEscalation || signals.dataExfiltration || signals.covertChannel);
  const decision: SentinelGatewayDecision = hardBlock || riskScore >= 85 ? 'block' : signals.promptInjection || riskScore >= 40 ? 'review' : 'allow';

  return {
    allowed: decision === 'allow',
    decision,
    riskScore,
    severity,
    signals,
    reasons,
    containment: decision === 'allow' ? [] : containmentPlan(signals),
    inspectedAt: new Date().toISOString(),
  };
}

export async function sentinelGuard<T>(request: SentinelToolRequest, execute: () => Promise<T>) {
  const inspection = inspectAgentAction(request);
  if (!inspection.allowed) return { executed: false as const, inspection };
  const result = await execute();
  return { executed: true as const, inspection, result };
}
