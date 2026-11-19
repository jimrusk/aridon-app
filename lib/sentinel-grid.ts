export type SentinelDisposition = 'allow' | 'restricted' | 'review' | 'block';

export type SentinelSignal = {
  category: string;
  weight: number;
  reason: string;
  source: 'prompt' | 'history' | 'action' | 'provider';
};

export type ProviderSignal = {
  provider: string;
  score: number;
  confidence?: number;
  category?: string;
};

export type SentinelInput = {
  prompt: string;
  history?: string[];
  requestedActions?: string[];
  providerSignals?: ProviderSignal[];
  authorizationContext?: string;
};

export type SentinelAssessment = {
  score: number;
  disposition: SentinelDisposition;
  reasons: string[];
  signals: SentinelSignal[];
  actionGate: {
    mode: 'pass' | 'human_approval' | 'deny';
    reasons: string[];
  };
  trajectory: {
    turnsAnalyzed: number;
    escalationDetected: boolean;
    repeatedEvasionDetected: boolean;
    categoryCount: number;
  };
  providerConsensus: {
    providers: number;
    averageScore: number | null;
    maxScore: number | null;
  };
  privacy: {
    rawPromptSharingRequired: false;
    recommendation: string;
  };
};

type Rule = {
  category: string;
  weight: number;
  reason: string;
  pattern: RegExp;
};

const RULES: Rule[] = [
  { category: 'safeguard-evasion', weight: 18, reason: 'Attempts to bypass, disable, or conceal safety controls.', pattern: /\b(bypass|disable|evade|jailbreak|ignore\s+(the\s+)?(rules|policy|safety)|hide\s+(my\s+)?intent|avoid\s+detection)\b/i },
  { category: 'credential-theft', weight: 28, reason: 'Seeks credentials, secrets, tokens, or account access.', pattern: /\b(steal|harvest|capture|exfiltrate)\b.{0,40}\b(passwords?|credentials?|tokens?|cookies?|api\s*keys?|sessions?|secrets?)\b/i },
  { category: 'phishing-social-engineering', weight: 22, reason: 'Potential credential phishing or deceptive impersonation behavior.', pattern: /\b(phish|phishing|credential\s+page|fake\s+login|impersonat(e|ion))\b/i },
  { category: 'intrusion-exploitation', weight: 24, reason: 'Potential unauthorized intrusion or exploit activity.', pattern: /\b(exploit|remote\s+code\s+execution|privilege\s+escalation|lateral\s+movement|persistence|initial\s+access)\b/i },
  { category: 'malware', weight: 30, reason: 'Potential malware, ransomware, credential stealer, or destructive payload behavior.', pattern: /\b(ransomware|credential\s+stealer|keylogger|malware|botnet|wipe\s+(the\s+)?disk|encrypt\s+victim)\b/i },
  { category: 'data-exfiltration', weight: 26, reason: 'Potential unauthorized extraction or transfer of protected data.', pattern: /\b(exfiltrat(e|ion)|dump\s+(the\s+)?database|steal\s+(customer|user|private)\s+data)\b|\b(send|upload|transfer|forward|post)\b[^.\n]{0,40}\b(outside|external|another|my)\s+(server|host|endpoint|address)\b/i },
  { category: 'reconnaissance', weight: 10, reason: 'Reconnaissance language warrants context-sensitive review.', pattern: /\b(scan|enumerate|recon|find\s+vulnerabilit|attack\s+surface)\b/i },
  { category: 'obfuscation', weight: 10, reason: 'Obfuscation can be a signal when combined with other risky behavior.', pattern: /\b(obfuscat(e|ion)|encode\s+to\s+evade|polymorphic|undetectable)\b/i },
  // v0.2.1: resource-exhaustion / anomalous-spend coverage. Mass provisioning
  // is a critical attack primitive against self-funding agents: a compromised
  // agent can burn its treasury on infrastructure without any fund transfer.
  { category: 'resource-exhaustion', weight: 35, reason: 'Bulk resource provisioning or mass creation request that could exhaust budget or capacity.', pattern: /\b(spin\s*up|provision|deploy|launch|stand\s*up|create)\b[^.\n]{0,60}\b(\d{2,}|hundreds?|thousands?|dozens?)\b[^.\n]{0,60}\b(vms?|virtual\s+machines?|instances?|servers?|nodes?|containers?|pods?|workers?|gpus?|clusters?)\b/i },
  { category: 'approval-evasion', weight: 25, reason: 'Explicit request to skip or bypass approval, authorization, or oversight.', pattern: /\b(skip|bypass(?:ing)?|without|no)\b[^.\n]{0,30}\b(all\s+)?(approvals?|authori[sz]ations?|oversight|human\s+review|permission)\b/i },
  { category: 'treasury-drain', weight: 15, reason: 'Request to move an entire treasury balance or all available funds at once.', pattern: /\b(entire|whole|full|all)\b[^.\n]{0,30}\b(treasury|treasuries|balances?|funds?|accounts?|wallets?)\b|\b(drain|empty)\b[^.\n]{0,20}\b(treasury|account|wallet|funds?)\b|\btransfer\b[^.\n]{0,30}\b(everything|all\s+of\s+it)\b/i },
  { category: 'urgency-pressure', weight: 5, reason: 'Urgency or time-pressure language; a weak signal that matters mainly combined with other risk.', pattern: /\b(immediately|right\s*now|urgent(ly)?|asap|a\.s\.a\.p\.)\b/i },
  // v0.2.2: instruction-override / prompt-injection structure. The classic
  // "ignore all previous instructions" family targets the agent's instruction
  // hierarchy itself rather than naming a malicious payload, so payload-based
  // rules miss it. This is the primary attack shape against comment-triggered
  // automations (e.g. hijacking a comment-to-DM bot).
  { category: 'instruction-override', weight: 30, reason: 'Attempts to override, replace, or discard prior instructions (prompt-injection structure).', pattern: /\b(ignore|disregard|forget|override|discard)\b[^.\n]{0,40}\b(previous|prior|earlier|all|your|system)\b[^.\n]{0,40}\b(instructions?|directives?|system\s+prompt|prompts?)\b|\bhere\s+are\s+your\s+new\s+(instructions?|directives?)\b/i },
  // v0.3 (Nov 2026, GAO bypass study): the rules above keyed on cyber-crime
  // vocabulary, so plainly-worded physical-harm requests scored zero, and
  // jailbreak framing (persona override, developer mode, fiction shield)
  // carried no weight at all. GAO testers talked past chatbot safeguards
  // with exactly these shapes to obtain explosive-device and grid-attack
  // plans. The categories below close that hole: the harmful objective is
  // scored on its own terms, whatever costume the request wears.
  { category: 'weapons-explosives', weight: 40, reason: 'Seeks instructions or assistance to build an explosive or incendiary device.', pattern: /\b(build|mak|construct|assembl|manufactur|creat|design|cook\s+up|put\s+together)\w*\b[^.\n]{0,50}\b(explosive\s*(device|charge)?|bomb|pipe\s*bomb|\bied\b|detonator|blasting\s+cap|firework)\b|\b(instructions?|steps?|guide|how\s+to)\b[^.\n]{0,40}\b(explosive|bomb|detonat\w*|detonator)\b/i },
  { category: 'detonation-intent', weight: 18, reason: 'Expresses intent to detonate or explode a device against a target.', pattern: /\b(detonat\w*|blow\s+up|explod\w*|set\s+off)\b[^.\n]{0,50}\b(device|bomb|explosive|car|truck|building|crowd|substation|bridge|train|plane|people)\b|\b(device|bomb|explosive)\b[^.\n]{0,40}\b(detonat\w*|blow\s+up)\b/i },
  { category: 'explosives-materials', weight: 16, reason: 'Asks for materials or chemicals in the context of an explosive device.', pattern: /\b(materials?|ingredients?|chemicals?|components?|supplies)\b[^.\n]{0,60}\b(explosive|bomb|detonat|pipe\s*bomb|firework)\b|\b(explosive|bomb|detonat)\b[^.\n]{0,60}\b(materials?|ingredients?|chemicals?|components?)\b/i },
  { category: 'critical-infrastructure-attack', weight: 36, reason: 'Seeks to attack, sabotage, or shut down critical infrastructure (power, water, SCADA).', pattern: /\b(attack|attacks|attacking|sabotag(e|ing)|shut\s*down|disable|destroy|take\s+(down|out)|knock\s+out|blackout|infiltrat(e|ing)|get\s+inside|break\s+into)\b[^.\n]{0,60}\b(substations?|power\s+grid|electrical\s+grid|the\s+grid|scada|power\s+plant|water\s+treatment|control\s+systems?)\b|\b(substations?|power\s+grid|electrical\s+grid|scada)\b[^.\n]{0,50}\b(attack|shut\s*down|disable|destroy|infiltrat|get\s+inside|vulnerabilit)/i },
  { category: 'attack-planning', weight: 16, reason: 'Frames the request as a plan or step-by-step guide for an attack or detonation.', pattern: /\b(plan|planning|steps?|strategy|walkthrough|guide)\b[^.\n]{0,50}\b(attack|detonat|blow\s+up|sabotag|shut\s+down|infiltrat|get\s+inside)\b|\b(attack|detonat)\b[^.\n]{0,40}\b(plan|steps?|first|targets?)\b/i },
  { category: 'persona-override', weight: 26, reason: 'Attempts to replace the assistant persona with an unrestricted one (roleplay / developer-mode jailbreak).', pattern: /\b(you\s+are|act\s+as|pretend|roleplay\s+as|from\s+now\s+on\s+you\s+are)\b[^.\n]{0,60}\b(no\s+restrictions?|no\s+rules?|no\s+safety|unrestricted|without\s+(any\s+)?(limits?|restrictions?|rules?)|anything\s+goes|\bdan\b|do\s+anything\s+now)\b|\b(developer\s+mode|god\s+mode|unfiltered\s+mode|jailbreak\s+mode)\b|\bno\s+(content\s+)?(restrictions?|filters?|safety\s+rules?)\b/i },
];

const AUTHORIZED_CONTEXT = /\b(authorized|permission|owned\s+system|my\s+system|lab|sandbox|ctf|capture\s+the\s+flag|training\s+environment|defensive|blue\s+team|incident\s+response|security\s+audit|penetration\s+test)\b/i;
const CLEARLY_HARMFUL = /\b(victim|without\s+permission|unauthorized|steal|ransomware|credential\s+stealer|exfiltrate)\b/i;
const HIGH_IMPACT_ACTION = /\b(shell|command|execute|deploy|send\s+email|http\s+request|network\s+request|database\s+(write|delete|update)|delete\s+file|credential\s+access|secret\s+access|payment|transfer)\b/i;
// v0.2.1: provisioning verbs. A bare "provision 1 server" is routine and must
// NOT trip the gate on its own — it only becomes consequential when paired
// with a fired resource-exhaustion signal (mass scale described in the text).
const PROVISIONING_ACTION = /\b(provision|spin\s*up|deploy|launch|stand\s*up)\b/i;

// ---- v0.3: de-obfuscation layer ----
// GAO-style bypasses hide the payload's spelling rather than its meaning:
// leetspeak (st34l), spaced-out letters (s t e a l), dotted words
// (p.a.s.s.w.o.r.d), zero-width characters, and base64 blobs. Rules keyed on
// plain spellings score all of these zero. So every text is scanned in three
// forms: as written, normalized (leet folded, spaced letters rejoined,
// zero-width stripped), and with any embedded base64 decoded and rescanned.
// Normalization only ever ADDS matches for genuinely harmful phrases; benign
// prose does not contain them in any spelling.
const LEET_MAP: Record<string, string> = { '0': 'o', '1': 'i', '3': 'e', '4': 'a', '5': 's', '7': 't', '@': 'a', '$': 's' };

function normalizeText(text: string): string {
  let out = text.replace(/[\u200B-\u200D\uFEFF]/g, '');
  // Rejoin spaced-out or separator-split words: "s t e a l", "p.a.s.s.w.o.r.d"
  out = out.replace(/\b[a-zA-Z](?:[\s.\-_]+[a-zA-Z]){3,}\b/g, (m) => m.replace(/[\s.\-_]+/g, ''));
  out = out.replace(/[013457@$]/g, (ch) => LEET_MAP[ch] || ch);
  return out;
}

function decodeBase64Blobs(text: string): string[] {
  const decoded: string[] = [];
  const candidates = text.match(/[A-Za-z0-9+/]{16,}={0,2}/g) || [];
  for (const candidate of candidates.slice(0, 4)) {
    if (candidate.length % 4 !== 0) continue;
    try {
      let plain = '';
      if (typeof atob === 'function') {
        const bin = atob(candidate);
        const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
        plain = new TextDecoder('utf-8', { fatal: false }).decode(bytes);
      } else if (typeof Buffer !== 'undefined') {
        plain = Buffer.from(candidate, 'base64').toString('utf-8');
      } else {
        continue;
      }
      const printable = plain.replace(/[^\x20-\x7E]/g, '');
      if (plain.length >= 8 && printable.length / plain.length >= 0.85) decoded.push(plain);
    } catch {
      // Not valid base64; ignore.
    }
  }
  return decoded;
}

function scan(text: string, source: SentinelSignal['source'], multiplier = 1): SentinelSignal[] {
  const variants = [text, normalizeText(text), ...decodeBase64Blobs(text).flatMap((d) => [d, normalizeText(d)])];
  const byCategory = new Map<string, SentinelSignal>();
  for (const variant of variants) {
    for (const rule of RULES) {
      if (!rule.pattern.test(variant)) continue;
      const signal: SentinelSignal = {
        category: rule.category,
        weight: Math.round(rule.weight * multiplier),
        reason: rule.reason,
        source,
      };
      const existing = byCategory.get(rule.category);
      if (!existing || signal.weight > existing.weight) byCategory.set(rule.category, signal);
    }
  }
  return [...byCategory.values()];
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function dispositionFor(score: number): SentinelDisposition {
  if (score >= 75) return 'block';
  if (score >= 50) return 'review';
  if (score >= 25) return 'restricted';
  return 'allow';
}

export function analyzeSentinel(input: SentinelInput): SentinelAssessment {
  const prompt = input.prompt?.trim() || '';
  const history = (input.history || []).filter(Boolean).slice(-12);
  const actions = (input.requestedActions || []).filter(Boolean).slice(0, 20);
  const authContext = input.authorizationContext || '';

  const promptSignals = scan(prompt, 'prompt', 1);
  // Defensive-framing guard: "how do we defend the grid against attacks" is
  // protective work, not an attack. When the framing is defensive and the
  // infrastructure category is the only material signal, drop it.
  if (/\b(defend|defending|defense|defensive|protect|protecting|harden|hardening|resilien|security\s+of)\b/i.test(prompt)) {
    const otherMaterial = promptSignals.some((s) => s.weight >= 24 && s.category !== 'critical-infrastructure-attack');
    if (!otherMaterial) {
      for (let i = promptSignals.length - 1; i >= 0; i--) {
        if (promptSignals[i].category === 'critical-infrastructure-attack') promptSignals.splice(i, 1);
      }
    }
  }
  const historySignals = history.flatMap((turn, index) => {
    const age = history.length - index;
    const multiplier = age <= 2 ? 0.65 : 0.4;
    return scan(turn, 'history', multiplier);
  });

  const actionSignals: SentinelSignal[] = actions
    .filter((action) => HIGH_IMPACT_ACTION.test(action))
    .map(() => ({
      category: 'consequential-tool-use',
      weight: 12,
      reason: 'A consequential external action was requested and must pass an independent action gate.',
      source: 'action' as const,
    }));

  const providerSignals: SentinelSignal[] = (input.providerSignals || []).slice(0, 8).map((signal) => ({
    category: signal.category || `provider:${signal.provider}`,
    weight: Math.round(clamp(signal.score, 0, 100) * 0.18),
    reason: `${signal.provider} supplied an independent risk signal.`,
    source: 'provider' as const,
  }));

  const allSignals = [...promptSignals, ...historySignals, ...actionSignals, ...providerSignals];
  // v0.3: an authorization claim inside the prompt text, stacked on harmful
  // content, is itself a risk signal (see the discount change below).
  if (
    AUTHORIZED_CONTEXT.test(prompt) &&
    !AUTHORIZED_CONTEXT.test(authContext) &&
    promptSignals.some((s) => s.weight >= 18)
  ) {
    allSignals.push({
      category: 'unverified-authorization-claim',
      weight: 12,
      reason: 'Authorization is claimed inside the request text itself, which is not evidence of authorization.',
      source: 'prompt' as const,
    });
  }
  const categories = new Set(allSignals.filter((s) => s.source !== 'action').map((s) => s.category));

  const currentRisk = promptSignals.reduce((sum, s) => sum + s.weight, 0);
  const historicalRisk = historySignals.reduce((sum, s) => sum + s.weight, 0);
  const repeatedEvasion = [prompt, ...history].filter((turn) => RULES[0].pattern.test(turn)).length >= 2;
  const escalationDetected = currentRisk >= 24 && historicalRisk >= 12;

  let score = allSignals.reduce((sum, s) => sum + s.weight, 0);
  if (repeatedEvasion) score += 10;
  if (escalationDetected) score += 10;
  if (categories.size >= 3) score += 8;

  // v0.3: authorization credit comes ONLY from the authorizationContext
  // field, which the integrating system supplies. Claims inside the prompt
  // are attacker-controlled text — the GAO bypass was, in effect, "trust
  // me, this is allowed" — so in-prompt claims earn no discount.
  const fieldAuthorized = AUTHORIZED_CONTEXT.test(authContext);
  const promptClaimsAuthorization = AUTHORIZED_CONTEXT.test(prompt);
  const hasClearlyHarmfulLanguage = CLEARLY_HARMFUL.test(prompt);
  if (fieldAuthorized && !hasClearlyHarmfulLanguage) score -= 18;

  score = clamp(Math.round(score), 0, 100);
  const disposition = dispositionFor(score);

  const highImpactRequested = actions.some((action) => HIGH_IMPACT_ACTION.test(action));
  // v0.2.1: bulk provisioning at mass scale is a consequential spend action and
  // must clear a human gate even when no fund transfer is involved. The signal
  // requirement keeps routine single-server provisioning out of the gate.
  const resourceExhaustionSignaled = promptSignals.some((signal) => signal.category === 'resource-exhaustion');
  const bulkProvisioningRequested =
    resourceExhaustionSignaled && actions.some((action) => PROVISIONING_ACTION.test(action));
  const consequentialRequested = highImpactRequested || bulkProvisioningRequested;
  const gateReasons: string[] = [];
  let actionGate: SentinelAssessment['actionGate']['mode'] = 'pass';

  if (consequentialRequested && score >= 50) {
    actionGate = 'deny';
    gateReasons.push('Risk is elevated and consequential external actions are blocked before execution.');
  } else if (consequentialRequested) {
    actionGate = 'human_approval';
    gateReasons.push('Consequential actions require an independent human approval even when content risk is low.');
  } else if (score >= 75) {
    actionGate = 'deny';
    gateReasons.push('Critical-risk content cannot proceed to tool execution.');
  }
  if (bulkProvisioningRequested) {
    gateReasons.push('Bulk infrastructure provisioning at mass scale was detected; spend of this size needs a human approver.');
  }

  const external = input.providerSignals || [];
  const avg = external.length ? Math.round(external.reduce((sum, s) => sum + clamp(s.score, 0, 100), 0) / external.length) : null;
  const max = external.length ? Math.max(...external.map((s) => clamp(s.score, 0, 100))) : null;

  const reasons = [...new Set(allSignals.map((signal) => signal.reason))];
  if (fieldAuthorized && !hasClearlyHarmfulLanguage) reasons.push('Authorized defensive context reduced risk, but did not disable safety checks.');
  if (promptClaimsAuthorization && !fieldAuthorized) reasons.push('Authorization claimed inside the request text was not credited; only system-supplied context counts.');
  if (!reasons.length) reasons.push('No material malicious-intent indicators were detected in the supplied context.');

  return {
    score,
    disposition,
    reasons,
    signals: allSignals,
    actionGate: { mode: actionGate, reasons: gateReasons },
    trajectory: {
      turnsAnalyzed: history.length + 1,
      escalationDetected,
      repeatedEvasionDetected: repeatedEvasion,
      categoryCount: categories.size,
    },
    providerConsensus: {
      providers: external.length,
      averageScore: avg,
      maxScore: max,
    },
    privacy: {
      rawPromptSharingRequired: false,
      recommendation: 'Keep raw prompts with the originating provider. Share only minimized threat indicators, scores, technique tags, and confirmed campaign fingerprints across organizations.',
    },
  };
}
