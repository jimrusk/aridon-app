// Aridon Sentinel — Treasury Firewall (v0.2.3).
//
// The agent-action layer (analyzeSentinel) answers "should this actor do this
// thing?" The treasury firewall answers a narrower, harder question: "should
// VALUE MOVE?" It is deliberately initiator-agnostic — AI agent, human
// operator, or automated system — because Bitget-class attacks (hot-wallet
// drains, signer deception, quorum bypass) do not care who or what clicked.
//
// Threat model: ASSUME BREACH.
// - The attacker may ALREADY hold hot-wallet credentials (phishing, malware,
//   a compromised endpoint, an insider). Sentinel cannot retroactively stop
//   that compromise, and no honest product claims it can.
// - What the attacker cannot do is make this firewall AUTHORIZE anomalous
//   value movement: unknown destinations, velocity breaches, single-tx limit
//   breaches, what-you-sign mismatches, or quorum bypasses.
// - The result is blast-radius containment: stolen keys alone are not enough
//   to drain the treasury. The theft becomes unexecutable.
//
// What this module is NOT:
// - Not an on-chain transaction simulator. There is no RPC/node dependency;
//   intent is verified structurally (canonicalize -> sha256 -> compare).
// - Not key management. Keys live in the operator's HSM/MPC; the firewall
//   never sees them and never signs.
// - Not endpoint security. A compromised laptop is the operator's EDR
//   problem. This layer assumes that compromise has already happened.
// - Not a decision anyone should deploy without independent review. Internal
//   synthetic tests only; no external audit, no certification.
//
// Server-side only: imports node:crypto. Do not import from client components.

import { createHash } from 'node:crypto';

export type TreasuryInitiator = 'ai-agent' | 'human-operator' | 'automated-system' | 'unknown';

export type TreasuryTransaction = {
  id: string;
  asset: string; // e.g. 'ETH', 'USDC', 'BTC'
  amount: string; // decimal string, e.g. "12.5"
  amountUsd: number; // normalized USD value — all policy math runs on this
  from: string; // source wallet / account identifier
  to: string; // destination address
  initiatedBy: TreasuryInitiator;
  initiatedAt: string; // ISO-8601
  /** Human-readable text the approval UI showed (kept for the audit record). */
  displayedSummary?: string;
  /**
   * sha256 of the canonical summary of the payload AS APPROVED. Set by the
   * approval UI at approve-time: hash(canonicalTreasurySummary(fields shown)).
   * At evaluation the firewall recomputes from the fields actually submitted
   * for signing. Any mismatch means the signed payload is not what was
   * approved — the Bybit signer-deception pattern — and is a hard deny.
   */
  approvedPayloadHash?: string;
  /** Approver identities collected so far (for quorum evaluation). */
  approvals?: string[];
};

export type TreasuryPolicy = {
  allowlistedDestinations: string[];
  maxSingleTxUsd: number;
  maxHourlyOutflowUsd: number;
  maxDailyOutflowUsd: number;
  /** First-seen addresses may receive at most this without human approval. */
  newAddressQuarantineUsd: number;
  /** At or above this amount, quorumRequired distinct approvals are needed. */
  quorumThresholdUsd: number;
  quorumRequired: number;
  /** Step-up window; evaluated in UTC. Outside it, large transfers need a human. */
  businessHoursUtc?: { start: number; end: number };
  /** Anomaly score at or above this trips the circuit breaker (freeze). */
  circuitBreakerAnomalyScore: number;
};

export type TreasuryBaseline = {
  avgTxUsd: number;
  knownDestinations: string[];
  /** Recent settled outflows, newest last; used for velocity math. */
  recentOutflows: { at: string; amountUsd: number }[];
};

export type TreasuryVerdict = 'allow' | 'human_approval' | 'deny' | 'freeze';

export type TreasuryEvaluation = {
  verdict: TreasuryVerdict;
  anomalyScore: number; // 0-100
  reasons: string[];
  requiredApprovals: number;
  approvalsPresent: number;
};

export const DEFAULT_TREASURY_POLICY: TreasuryPolicy = {
  allowlistedDestinations: [],
  maxSingleTxUsd: 250_000,
  maxHourlyOutflowUsd: 500_000,
  maxDailyOutflowUsd: 2_000_000,
  newAddressQuarantineUsd: 10_000,
  quorumThresholdUsd: 100_000,
  quorumRequired: 3,
  businessHoursUtc: { start: 13, end: 23 }, // approx. US business hours, UTC
  circuitBreakerAnomalyScore: 80,
};

/** Canonical, order-stable serialization of a transaction's intent. */
export function canonicalTreasurySummary(tx: TreasuryTransaction): string {
  return [tx.asset, tx.amount, tx.from, tx.to, tx.initiatedAt].join('|');
}

export function hashTreasurySummary(canonicalSummary: string): string {
  return createHash('sha256').update(canonicalSummary, 'utf8').digest('hex');
}

function sumOutflowsSince(recent: TreasuryBaseline['recentOutflows'], sinceMs: number, nowMs: number): number {
  return recent
    .filter((o) => {
      const t = Date.parse(o.at);
      return !Number.isNaN(t) && t >= sinceMs && t <= nowMs;
    })
    .reduce((sum, o) => sum + o.amountUsd, 0);
}

export function evaluateTreasuryTransaction(
  tx: TreasuryTransaction,
  policy: TreasuryPolicy = DEFAULT_TREASURY_POLICY,
  baseline: TreasuryBaseline = { avgTxUsd: 0, knownDestinations: [], recentOutflows: [] }
): TreasuryEvaluation {
  const reasons: string[] = [];
  const hardDenials: string[] = [];
  let anomalyScore = 0;

  const approvalsPresent = (tx.approvals || []).length;
  const nowMs = Date.parse(tx.initiatedAt);
  const now = Number.isNaN(nowMs) ? Date.now() : nowMs;

  // ---- 1. What-you-sign verification (hard deny). The single most
  // important check in this module: is the payload being signed the payload
  // that was approved? A mismatch is the Bybit pattern — the approval UI
  // showed one thing while the signer authorized another.
  if (tx.approvedPayloadHash) {
    const actualHash = hashTreasurySummary(canonicalTreasurySummary(tx));
    if (actualHash !== tx.approvedPayloadHash) {
      hardDenials.push(
        'What-you-sign mismatch: the payload submitted for signing does not match what was approved. ' +
          'Possible approval-UI deception or payload tampering — denied before signature.'
      );
    }
  }

  // ---- 2. Hard policy limits (deny).
  if (tx.amountUsd > policy.maxSingleTxUsd) {
    hardDenials.push(
      `Single-transaction limit exceeded: $${tx.amountUsd.toLocaleString('en-US')} > $${policy.maxSingleTxUsd.toLocaleString('en-US')} policy maximum.`
    );
  }
  const hourlyOutflow = sumOutflowsSince(baseline.recentOutflows, now - 3_600_000, now) + tx.amountUsd;
  if (hourlyOutflow > policy.maxHourlyOutflowUsd) {
    hardDenials.push(
      `Hourly outflow velocity exceeded: $${hourlyOutflow.toLocaleString('en-US')} in the last hour > $${policy.maxHourlyOutflowUsd.toLocaleString('en-US')} policy maximum.`
    );
  }
  const dailyOutflow = sumOutflowsSince(baseline.recentOutflows, now - 86_400_000, now) + tx.amountUsd;
  if (dailyOutflow > policy.maxDailyOutflowUsd) {
    hardDenials.push(
      `Daily outflow velocity exceeded: $${dailyOutflow.toLocaleString('en-US')} in the last 24h > $${policy.maxDailyOutflowUsd.toLocaleString('en-US')} policy maximum.`
    );
  }

  // ---- 3. Anomaly signals (scored, initiator-agnostic).
  const isAllowlisted = policy.allowlistedDestinations.includes(tx.to);
  const isKnown = isAllowlisted || baseline.knownDestinations.includes(tx.to);
  const isNewDestination = !isKnown;

  let needsHuman = false;

  if (isNewDestination) {
    anomalyScore += 35;
    reasons.push('Destination address has never been seen before.');
    if (tx.amountUsd > policy.newAddressQuarantineUsd) {
      needsHuman = true;
      reasons.push(
        `First-seen destination above the $${policy.newAddressQuarantineUsd.toLocaleString('en-US')} quarantine cap requires human approval.`
      );
    }
  }

  if (policy.businessHoursUtc) {
    const hourUtc = new Date(now).getUTCHours();
    const { start, end } = policy.businessHoursUtc;
    const inHours = start <= end ? hourUtc >= start && hourUtc < end : hourUtc >= start || hourUtc < end;
    if (!inHours && tx.amountUsd > policy.newAddressQuarantineUsd) {
      anomalyScore += 15;
      needsHuman = true;
      reasons.push('Transfer initiated outside business hours requires human approval.');
    }
  }

  if (baseline.avgTxUsd > 0 && tx.amountUsd > 5 * baseline.avgTxUsd) {
    anomalyScore += 25;
    reasons.push(`Amount is more than 5x the baseline average ($${baseline.avgTxUsd.toLocaleString('en-US')}).`);
  }

  if (policy.maxHourlyOutflowUsd > 0 && hourlyOutflow > 0.8 * policy.maxHourlyOutflowUsd) {
    anomalyScore += 20;
    reasons.push('Hourly outflow is above 80% of the policy velocity limit.');
  }

  anomalyScore = Math.min(100, Math.round(anomalyScore));

  // ---- 4. Quorum enforcement. Large transfers need N distinct approvals;
  // a single approval — or a compromised single signer — is not enough.
  const quorumApplies = tx.amountUsd >= policy.quorumThresholdUsd;
  const requiredApprovals = quorumApplies ? policy.quorumRequired : needsHuman || anomalyScore >= 30 ? 1 : 0;
  if (requiredApprovals > 0 && approvalsPresent < requiredApprovals) {
    needsHuman = true;
    reasons.push(
      `Quorum not met: ${approvalsPresent}/${requiredApprovals} approvals present for a $${tx.amountUsd.toLocaleString('en-US')} transfer.`
    );
  }

  // ---- 5. Verdict assembly.
  let verdict: TreasuryVerdict;
  if (hardDenials.length > 0) {
    verdict = 'deny';
    reasons.unshift(...hardDenials);
  } else if (anomalyScore >= policy.circuitBreakerAnomalyScore) {
    verdict = 'freeze';
    reasons.unshift(
      `Circuit breaker tripped: anomaly score ${anomalyScore} >= ${policy.circuitBreakerAnomalyScore}. ` +
        'All outflows must halt until a human reviews — the host system enforces the freeze.'
    );
  } else if (anomalyScore >= 50) {
    verdict = 'deny';
    reasons.unshift(`Anomaly score ${anomalyScore} exceeds the autonomous-approval ceiling; denied pending human review.`);
  } else if (needsHuman) {
    verdict = 'human_approval';
  } else {
    verdict = 'allow';
    if (quorumApplies && approvalsPresent >= requiredApprovals) {
      reasons.push(`Quorum satisfied (${approvalsPresent}/${requiredApprovals}); within all policy limits.`);
    } else {
      reasons.push('Within all policy limits; no anomaly signals fired.');
    }
  }

  return { verdict, anomalyScore, reasons, requiredApprovals, approvalsPresent };
}
