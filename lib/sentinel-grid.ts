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
  { category: 'credential-theft', weight: 28, reason: 'Seeks credentials, secrets, tokens, or account access.', pattern: /\b(steal|harvest|capture|exfiltrate)\b.{0,40}\b(password|credential|token|cookie|api\s*key|session)\b/i },
  { category: 'phishing-social-engineering', weight: 22, reason: 'Potential credential phishing or deceptive impersonation behavior.', pattern: /\b(phish|phishing|credential\s+page|fake\s+login|impersonat(e|ion))\b/i },
  { category: 'intrusion-exploitation', weight: 24, reason: 'Potential unauthorized intrusion or exploit activity.', pattern: /\b(exploit|remote\s+code\s+execution|privilege\s+escalation|lateral\s+movement|persistence|initial\s+access)\b/i },
  { category: 'malware', weight: 30, reason: 'Potential malware, ransomware, credential stealer, or destructive payload behavior.', pattern: /\b(ransomware|credential\s+stealer|keylogger|malware|botnet|wipe\s+(the\s+)?disk|encrypt\s+victim)\b/i },
  { category: 'data-exfiltration', weight: 26, reason: 'Potential unauthorized extraction or transfer of protected data.', pattern: /\b(exfiltrat(e|ion)|dump\s+(the\s+)?database|steal\s+(customer|user|private)\s+data)\b/i },
  { category: 'reconnaissance', weight: 10, reason: 'Reconnaissance language warrants context-sensitive review.', pattern: /\b(scan|enumerate|recon|find\s+vulnerabilit|attack\s+surface)\b/i },
  { category: 'obfuscation', weight: 10, reason: 'Obfuscation can be a signal when combined with other risky behavior.', pattern: /\b(obfuscat(e|ion)|encode\s+to\s+evade|polymorphic|undetectable)\b/i },
];

const AUTHORIZED_CONTEXT = /\b(authorized|permission|owned\s+system|my\s+system|lab|sandbox|ctf|capture\s+the\s+flag|training\s+environment|defensive|blue\s+team|incident\s+response|security\s+audit|penetration\s+test)\b/i;
const CLEARLY_HARMFUL = /\b(victim|without\s+permission|unauthorized|steal|ransomware|credential\s+stealer|exfiltrate)\b/i;
const HIGH_IMPACT_ACTION = /\b(shell|command|execute|deploy|send\s+email|http\s+request|network\s+request|database\s+(write|delete|update)|delete\s+file|credential\s+access|secret\s+access|payment|transfer)\b/i;

function scan(text: string, source: SentinelSignal['source'], multiplier = 1): SentinelSignal[] {
  return RULES.filter((rule) => rule.pattern.test(text)).map((rule) => ({
    category: rule.category,
    weight: Math.round(rule.weight * multiplier),
    reason: rule.reason,
    source,
  }));
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
  const categories = new Set(allSignals.filter((s) => s.source !== 'action').map((s) => s.category));

  const currentRisk = promptSignals.reduce((sum, s) => sum + s.weight, 0);
  const historicalRisk = historySignals.reduce((sum, s) => sum + s.weight, 0);
  const repeatedEvasion = [prompt, ...history].filter((turn) => RULES[0].pattern.test(turn)).length >= 2;
  const escalationDetected = currentRisk >= 24 && historicalRisk >= 12;

  let score = allSignals.reduce((sum, s) => sum + s.weight, 0);
  if (repeatedEvasion) score += 10;
  if (escalationDetected) score += 10;
  if (categories.size >= 3) score += 8;

  const hasAuthorizedContext = AUTHORIZED_CONTEXT.test(`${authContext} ${prompt}`);
  const hasClearlyHarmfulLanguage = CLEARLY_HARMFUL.test(prompt);
  if (hasAuthorizedContext && !hasClearlyHarmfulLanguage) score -= 18;

  score = clamp(Math.round(score), 0, 100);
  const disposition = dispositionFor(score);

  const highImpactRequested = actions.some((action) => HIGH_IMPACT_ACTION.test(action));
  const gateReasons: string[] = [];
  let actionGate: SentinelAssessment['actionGate']['mode'] = 'pass';

  if (highImpactRequested && score >= 50) {
    actionGate = 'deny';
    gateReasons.push('Risk is elevated and consequential external actions are blocked before execution.');
  } else if (highImpactRequested) {
    actionGate = 'human_approval';
    gateReasons.push('Consequential actions require an independent human approval even when content risk is low.');
  } else if (score >= 75) {
    actionGate = 'deny';
    gateReasons.push('Critical-risk content cannot proceed to tool execution.');
  }

  const external = input.providerSignals || [];
  const avg = external.length ? Math.round(external.reduce((sum, s) => sum + clamp(s.score, 0, 100), 0) / external.length) : null;
  const max = external.length ? Math.max(...external.map((s) => clamp(s.score, 0, 100))) : null;

  const reasons = [...new Set(allSignals.map((signal) => signal.reason))];
  if (hasAuthorizedContext && !hasClearlyHarmfulLanguage) reasons.push('Authorized defensive context reduced risk, but did not disable safety checks.');
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
