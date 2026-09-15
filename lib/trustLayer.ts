export type TrustChannel = 'email' | 'text' | 'phone' | 'web' | 'document' | 'payment' | 'social' | 'voice-video';

export type TrustInput = {
  channel: TrustChannel;
  message?: string;
  claimedOrganization?: string;
  claimedDomain?: string;
  sender?: string;
  url?: string;
  amount?: number | null;
  verificationEvidence?: string[];
};

export type TrustSignal = {
  category: string;
  weight: number;
  reason: string;
  source: 'content' | 'sender' | 'link' | 'transaction' | 'evidence';
};

export type TrustLevel = 'low' | 'verify' | 'high' | 'block';
export type TrustGate = 'proceed' | 'verify_out_of_band' | 'hold' | 'block_automation';

export type TrustAssessment = {
  score: number;
  level: TrustLevel;
  signals: TrustSignal[];
  reasons: string[];
  actionGate: {
    mode: TrustGate;
    reason: string;
  };
  verificationPlan: string[];
  privacy: {
    storesRawContent: false;
    note: string;
  };
  disclaimer: string;
};

type Rule = {
  category: string;
  weight: number;
  reason: string;
  pattern: RegExp;
};

const CONTENT_RULES: Rule[] = [
  {
    category: 'urgency-pressure',
    weight: 10,
    reason: 'Urgency or pressure language can be used to bypass normal verification.',
    pattern: /\b(urgent|immediately|right now|act now|today only|final warning|do not delay|time sensitive)\b/i,
  },
  {
    category: 'secrecy-bypass',
    weight: 16,
    reason: 'The request encourages secrecy or bypassing normal controls.',
    pattern: /\b(keep this confidential|do not tell|don'?t tell|bypass|skip approval|avoid review|off the books|secretly)\b/i,
  },
  {
    category: 'credential-request',
    weight: 28,
    reason: 'The message requests credentials, one-time codes, or account access information.',
    pattern: /\b(password|passcode|one[- ]?time code|otp|verification code|login|credentials?|security code|recovery code)\b/i,
  },
  {
    category: 'payment-redirection',
    weight: 30,
    reason: 'The message requests money movement or a change in payment destination.',
    pattern: /\b(wire|bank transfer|routing number|account number|gift card|crypto|bitcoin|payment destination|new banking|changed bank|change.*payment|send funds|transfer funds)\b/i,
  },
  {
    category: 'remote-access',
    weight: 24,
    reason: 'The message asks for remote access, software installation, or device control.',
    pattern: /\b(remote access|screen share|install this app|install software|anydesk|teamviewer|remote desktop|control your computer)\b/i,
  },
  {
    category: 'threat-coercion',
    weight: 14,
    reason: 'Threats or coercive consequences are being used to accelerate action.',
    pattern: /\b(arrest|warrant|account.*closed|service.*shut off|lawsuit|penalty|fine|suspended immediately)\b/i,
  },
  {
    category: 'impersonation-cue',
    weight: 12,
    reason: 'The message relies on authority or identity claims that should be independently verified.',
    pattern: /\b(ceo|chief executive|irs|social security|medicare|bank security|fraud department|tech support|police|sheriff|government agency)\b/i,
  },
];

const VERIFIED_EVIDENCE = /\b(verified|official callback|known number|known account|signed|in person|existing contract|confirmed independently|trusted directory|previously verified)\b/i;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function levelFor(score: number): TrustLevel {
  if (score >= 70) return 'block';
  if (score >= 40) return 'high';
  if (score >= 20) return 'verify';
  return 'low';
}

function normalizeDomain(value: string) {
  return value.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0].split(':')[0];
}

function senderDomain(sender: string) {
  const match = sender.toLowerCase().match(/@([a-z0-9.-]+)$/i);
  return match?.[1] || '';
}

function scanUrl(urlText: string): TrustSignal[] {
  const signals: TrustSignal[] = [];
  const text = urlText.trim();
  if (!text) return signals;

  if (/\b(bit\.ly|tinyurl\.com|t\.co|goo\.gl|ow\.ly|is\.gd|buff\.ly)\b/i.test(text)) {
    signals.push({ category: 'shortened-link', weight: 12, reason: 'A shortened link obscures the final destination.', source: 'link' });
  }
  if (/xn--/i.test(text)) {
    signals.push({ category: 'punycode-domain', weight: 24, reason: 'The link uses a punycode domain, which can be used for look-alike addresses.', source: 'link' });
  }
  if (/https?:\/\/[^/]*@/i.test(text)) {
    signals.push({ category: 'url-userinfo', weight: 28, reason: 'The URL contains user-info syntax that can obscure the real destination.', source: 'link' });
  }

  try {
    const candidate = /^https?:\/\//i.test(text) ? text : `https://${text}`;
    const host = new URL(candidate).hostname;
    if (/^(?:\d{1,3}\.){3}\d{1,3}$/.test(host)) {
      signals.push({ category: 'ip-address-link', weight: 20, reason: 'The link goes directly to an IP address rather than a named domain.', source: 'link' });
    }
  } catch {
    signals.push({ category: 'malformed-link', weight: 10, reason: 'The supplied link could not be parsed as a normal web address.', source: 'link' });
  }

  return signals;
}

export function assessTrust(input: TrustInput): TrustAssessment {
  const message = input.message?.trim() || '';
  const signals: TrustSignal[] = CONTENT_RULES
    .filter((rule) => rule.pattern.test(message))
    .map((rule) => ({ category: rule.category, weight: rule.weight, reason: rule.reason, source: 'content' as const }));

  if (input.url) signals.push(...scanUrl(input.url));

  const claimedDomain = input.claimedDomain ? normalizeDomain(input.claimedDomain) : '';
  const actualSenderDomain = input.sender ? senderDomain(input.sender) : '';
  if (claimedDomain && actualSenderDomain && actualSenderDomain !== claimedDomain && !actualSenderDomain.endsWith(`.${claimedDomain}`)) {
    signals.push({
      category: 'sender-domain-mismatch',
      weight: 24,
      reason: `The sender domain (${actualSenderDomain}) does not match the claimed organization domain (${claimedDomain}).`,
      source: 'sender',
    });
  }

  const amount = Number(input.amount || 0);
  if (amount >= 50000) {
    signals.push({ category: 'high-impact-transaction', weight: 14, reason: 'A high-value transaction warrants stronger verification before execution.', source: 'transaction' });
  } else if (amount >= 5000) {
    signals.push({ category: 'material-transaction', weight: 8, reason: 'A material transaction warrants independent verification before execution.', source: 'transaction' });
  }

  const evidence = (input.verificationEvidence || []).filter(Boolean).slice(0, 10);
  const strongEvidenceCount = evidence.filter((item) => VERIFIED_EVIDENCE.test(item)).length;
  if (strongEvidenceCount) {
    signals.push({
      category: 'independent-verification',
      weight: -Math.min(24, strongEvidenceCount * 8),
      reason: 'Independent verification evidence reduces risk but does not disable action controls.',
      source: 'evidence',
    });
  }

  const positiveRisk = signals.filter((s) => s.weight > 0).reduce((sum, signal) => sum + signal.weight, 0);
  const paymentRelated = signals.some((s) => s.category === 'payment-redirection');
  const credentialRelated = signals.some((s) => s.category === 'credential-request');
  const secrecyRelated = signals.some((s) => s.category === 'secrecy-bypass');

  let combinationBoost = 0;
  if (paymentRelated && secrecyRelated) combinationBoost += 14;
  if (credentialRelated && secrecyRelated) combinationBoost += 12;
  if ((paymentRelated || credentialRelated) && signals.some((s) => s.source === 'sender' || s.source === 'link')) combinationBoost += 12;

  let score = signals.reduce((sum, signal) => sum + signal.weight, 0) + combinationBoost;
  score = clamp(Math.round(score), 0, 100);
  const level = levelFor(score);

  let gate: TrustGate = 'proceed';
  let gateReason = 'No material trust indicators require an action hold based on the supplied information.';
  if (score >= 70) {
    gate = 'block_automation';
    gateReason = 'Automated consequential action should be blocked until a human completes independent verification.';
  } else if (score >= 40) {
    gate = 'hold';
    gateReason = 'Hold the transaction or consequential action until independent verification is complete.';
  } else if (score >= 20 || amount >= 5000) {
    gate = 'verify_out_of_band';
    gateReason = 'Verify through a trusted channel that is independent of the incoming request before acting.';
  }

  const verificationPlan: string[] = [];
  if (input.claimedOrganization || claimedDomain) verificationPlan.push('Contact the organization using a phone number or website obtained independently, not from the incoming message.');
  if (paymentRelated || amount >= 5000) verificationPlan.push('Confirm payee name, account details, amount, and authorization using a known contact before releasing funds.');
  if (credentialRelated) verificationPlan.push('Do not share passwords or one-time codes. Open the service directly from a known app or bookmarked site.');
  if (input.url) verificationPlan.push('Open the claimed organization through a known address rather than following the supplied link.');
  if (input.channel === 'voice-video') verificationPlan.push('Use a pre-arranged code word or a separate known contact method for high-impact requests; voice or video alone is not proof of identity.');
  if (!verificationPlan.length) verificationPlan.push('For consequential actions, use a second independent source before relying on the claim.');

  const reasons = [...new Set(signals.filter((s) => s.weight > 0).map((s) => s.reason))];
  if (!reasons.length) reasons.push('No material fraud or impersonation indicators were detected in the supplied information.');
  if (strongEvidenceCount) reasons.push('Independent verification evidence lowered the score, but the evidence should remain auditable.');

  return {
    score,
    level,
    signals,
    reasons,
    actionGate: { mode: gate, reason: gateReason },
    verificationPlan,
    privacy: {
      storesRawContent: false,
      note: 'The core assessment function is stateless. A production deployment should store only the minimum evidence and audit data required by the customer policy.',
    },
    disclaimer: 'Trust Layer is a decision-support and action-gating system. A score is not a factual determination that a person, organization, message, or transaction is fraudulent.',
  };
}
