export type DeliverabilityStatus = 'green' | 'caution' | 'stop';
export type DeliverabilityAction = 'send' | 'review' | 'stop';
export type AuthState = 'configured' | 'missing' | 'unknown';
export type RecipientStatus = 'verified' | 'catch_all' | 'unknown' | 'invalid';

export type DeliverabilityInput = {
  sender?: string;
  recipient?: string;
  subject?: string;
  body?: string;
  outreach?: boolean;
  recipientStatus?: RecipientStatus;
  spf?: AuthState;
  dkim?: AuthState;
  dmarc?: AuthState;
  bounceRate?: number;
  complaintRate?: number;
  dailyVolume?: number;
  previousDailyVolume?: number;
  warmupDays?: number;
  providerCount?: number;
};

export type DeliverabilityIssue = {
  code: string;
  severity: 'info' | 'caution' | 'stop';
  points: number;
  message: string;
  recommendation: string;
};

export type DeliverabilityReport = {
  policyVersion: '2026.09-a';
  score: number;
  status: DeliverabilityStatus;
  action: DeliverabilityAction;
  issues: DeliverabilityIssue[];
  summary: string;
};

const PROVIDER_DOMAINS = new Set([
  'gmail.com',
  'googlemail.com',
  'outlook.com',
  'hotmail.com',
  'live.com',
  'msn.com',
]);

function emailDomain(value?: string) {
  const normalized = String(value || '').trim().toLowerCase();
  const at = normalized.lastIndexOf('@');
  return at > -1 ? normalized.slice(at + 1) : '';
}

function finiteNumber(value: unknown) {
  const numeric = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(numeric) ? numeric : undefined;
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function addIssue(
  issues: DeliverabilityIssue[],
  issue: DeliverabilityIssue,
) {
  issues.push(issue);
}

function authIssue(
  issues: DeliverabilityIssue[],
  label: 'SPF' | 'DKIM' | 'DMARC',
  state: AuthState | undefined,
  outreach: boolean,
) {
  if (state !== 'missing') return;
  const severe = outreach && (label === 'SPF' || label === 'DKIM');
  addIssue(issues, {
    code: `${label.toLowerCase()}_missing`,
    severity: severe ? 'stop' : 'caution',
    points: severe ? 28 : 14,
    message: `${label} is reported missing for this sending identity.`,
    recommendation: `Configure ${label} before increasing outbound volume.`,
  });
}

export function scoreDeliverability(raw: DeliverabilityInput): DeliverabilityReport {
  const input: DeliverabilityInput = {
    ...raw,
    bounceRate: finiteNumber(raw.bounceRate),
    complaintRate: finiteNumber(raw.complaintRate),
    dailyVolume: finiteNumber(raw.dailyVolume),
    previousDailyVolume: finiteNumber(raw.previousDailyVolume),
    warmupDays: finiteNumber(raw.warmupDays),
    providerCount: finiteNumber(raw.providerCount),
  };

  const issues: DeliverabilityIssue[] = [];
  const outreach = input.outreach === true;
  const recipient = String(input.recipient || '').trim();
  const senderDomain = emailDomain(input.sender);
  const subject = String(input.subject || '').trim();
  const message = String(input.body || '');

  if (!/^\S+@\S+\.\S+$/.test(recipient) || input.recipientStatus === 'invalid') {
    addIssue(issues, {
      code: 'recipient_invalid',
      severity: 'stop',
      points: 100,
      message: 'The recipient address is invalid or has been marked invalid.',
      recommendation: 'Do not send. Correct or verify the address first.',
    });
  } else if (input.recipientStatus === 'catch_all') {
    addIssue(issues, {
      code: 'recipient_catch_all',
      severity: 'caution',
      points: 12,
      message: 'The recipient domain is catch-all, so mailbox validity is uncertain.',
      recommendation: 'Verify the contact through another source or send at low volume.',
    });
  } else if (input.recipientStatus === 'unknown' && outreach) {
    addIssue(issues, {
      code: 'recipient_unverified',
      severity: 'caution',
      points: 7,
      message: 'This outreach recipient has not been marked verified.',
      recommendation: 'Verify the address before scaling the campaign.',
    });
  }

  authIssue(issues, 'SPF', input.spf, outreach);
  authIssue(issues, 'DKIM', input.dkim, outreach);
  authIssue(issues, 'DMARC', input.dmarc, outreach);

  if (input.bounceRate !== undefined) {
    if (input.bounceRate >= 5) {
      addIssue(issues, {
        code: 'bounce_rate_critical',
        severity: 'stop',
        points: 38,
        message: `Bounce rate is ${input.bounceRate.toFixed(2)}%, well above a healthy outreach range.`,
        recommendation: 'Stop the campaign, suppress bad addresses, and repair list quality before resuming.',
      });
    } else if (input.bounceRate >= 2) {
      addIssue(issues, {
        code: 'bounce_rate_high',
        severity: 'caution',
        points: 18,
        message: `Bounce rate is ${input.bounceRate.toFixed(2)}%, at or above the 2% caution line.`,
        recommendation: 'Slow sending and verify the remaining list before continuing.',
      });
    }
  }

  if (input.complaintRate !== undefined) {
    if (input.complaintRate >= 0.3) {
      addIssue(issues, {
        code: 'complaint_rate_critical',
        severity: 'stop',
        points: 40,
        message: `Complaint rate is ${input.complaintRate.toFixed(2)}%, which is a serious reputation risk.`,
        recommendation: 'Stop sending and review targeting, consent, frequency, and suppression controls.',
      });
    } else if (input.complaintRate >= 0.1) {
      addIssue(issues, {
        code: 'complaint_rate_high',
        severity: 'caution',
        points: 20,
        message: `Complaint rate is ${input.complaintRate.toFixed(2)}%, high enough to threaten inbox placement.`,
        recommendation: 'Reduce volume and tighten targeting before the next batch.',
      });
    }
  }

  const dailyVolume = input.dailyVolume || 0;
  const previousDailyVolume = input.previousDailyVolume || 0;
  if (previousDailyVolume > 0 && dailyVolume > 0) {
    const spike = ((dailyVolume - previousDailyVolume) / previousDailyVolume) * 100;
    if (spike >= 250) {
      addIssue(issues, {
        code: 'volume_spike_critical',
        severity: 'stop',
        points: 30,
        message: `Planned volume is ${Math.round(spike)}% above the previous daily level.`,
        recommendation: 'Ramp gradually instead of making a sudden volume jump.',
      });
    } else if (spike >= 75) {
      addIssue(issues, {
        code: 'volume_spike',
        severity: 'caution',
        points: 14,
        message: `Planned volume is ${Math.round(spike)}% above the previous daily level.`,
        recommendation: 'Use a smaller, steadier increase to protect sender reputation.',
      });
    }
  }

  if (input.warmupDays !== undefined && dailyVolume > 0) {
    if (input.warmupDays < 7 && dailyVolume >= 100) {
      addIssue(issues, {
        code: 'warmup_too_short',
        severity: 'stop',
        points: 30,
        message: `The sending identity has only ${Math.max(0, Math.floor(input.warmupDays))} warmup days for a planned volume of ${Math.round(dailyVolume)}.`,
        recommendation: 'Keep volume low and build a longer history before scaling.',
      });
    } else if (input.warmupDays < 14 && dailyVolume >= 200) {
      addIssue(issues, {
        code: 'warmup_thin',
        severity: 'caution',
        points: 15,
        message: 'The sending identity is still young for the planned daily volume.',
        recommendation: 'Increase volume more gradually and watch inbox placement closely.',
      });
    }
  }

  if ((input.providerCount || 0) <= 1 && dailyVolume >= 250) {
    addIssue(issues, {
      code: 'provider_concentration',
      severity: 'caution',
      points: 10,
      message: 'Higher-volume outreach is concentrated on one sending provider.',
      recommendation: 'Use legitimate infrastructure segmentation and failover, not rotation intended to evade provider controls.',
    });
  }

  if (outreach && senderDomain && PROVIDER_DOMAINS.has(senderDomain)) {
    addIssue(issues, {
      code: 'consumer_sender_outreach',
      severity: 'caution',
      points: 12,
      message: `Outbound outreach is using the shared provider domain ${senderDomain}.`,
      recommendation: 'Use an authenticated business sending identity for scalable outreach.',
    });
  }

  if (subject) {
    if (subject.length > 90) {
      addIssue(issues, {
        code: 'subject_long',
        severity: 'caution',
        points: 5,
        message: 'The subject line is unusually long.',
        recommendation: 'Shorten it so the message looks natural and renders cleanly on mobile.',
      });
    }
    const letters = subject.replace(/[^A-Za-z]/g, '');
    if (letters.length >= 8 && letters === letters.toUpperCase()) {
      addIssue(issues, {
        code: 'subject_all_caps',
        severity: 'caution',
        points: 8,
        message: 'The subject line is effectively all caps.',
        recommendation: 'Use normal capitalization.',
      });
    }
    if ((subject.match(/!/g) || []).length >= 4) {
      addIssue(issues, {
        code: 'subject_exclamation',
        severity: 'caution',
        points: 5,
        message: 'The subject contains excessive exclamation marks.',
        recommendation: 'Reduce punctuation and keep the subject conversational.',
      });
    }
  }

  if (message) {
    const links = message.match(/https?:\/\/\S+/gi) || [];
    if (links.length >= 8) {
      addIssue(issues, {
        code: 'too_many_links',
        severity: 'caution',
        points: 8,
        message: `The message contains ${links.length} links.`,
        recommendation: 'Reduce unnecessary links and keep one clear call to action.',
      });
    }
    if (/\b(bit\.ly|tinyurl\.com|t\.co|goo\.gl|ow\.ly)\b/i.test(message)) {
      addIssue(issues, {
        code: 'shortened_link',
        severity: 'caution',
        points: 8,
        message: 'The message contains a public URL shortener.',
        recommendation: 'Use a transparent first-party or destination URL when possible.',
      });
    }
    if (outreach && !/\b(unsubscribe|opt out|opt-out|do not contact)\b/i.test(message)) {
      addIssue(issues, {
        code: 'opt_out_missing',
        severity: 'caution',
        points: 8,
        message: 'This message is marked as outreach but does not contain an obvious opt-out path.',
        recommendation: 'Add a clear way for recipients to stop future outreach when applicable.',
      });
    }
  }

  const penalty = issues.reduce((total, issue) => total + issue.points, 0);
  const score = clamp(100 - penalty, 0, 100);
  const hasStop = issues.some((issue) => issue.severity === 'stop');
  const hasCaution = issues.some((issue) => issue.severity === 'caution');
  const status: DeliverabilityStatus = hasStop || score < 50 ? 'stop' : hasCaution || score < 85 ? 'caution' : 'green';
  const action: DeliverabilityAction = status === 'stop' ? 'stop' : status === 'caution' ? 'review' : 'send';

  return {
    policyVersion: '2026.09-a',
    score,
    status,
    action,
    issues,
    summary: status === 'green'
      ? 'Send conditions look healthy based on the supplied signals.'
      : status === 'caution'
        ? 'One or more signals deserve review before scaling this send.'
        : 'Deliverability Sentinel found a hard-stop condition. Do not send until it is corrected.',
  };
}

function objectValue(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function authState(value: unknown): AuthState | undefined {
  return value === 'configured' || value === 'missing' || value === 'unknown' ? value : undefined;
}

function recipientStatus(value: unknown): RecipientStatus | undefined {
  return value === 'verified' || value === 'catch_all' || value === 'unknown' || value === 'invalid' ? value : undefined;
}

export function deliverabilityInputFromPayload(input: {
  payload: Record<string, unknown>;
  sender?: string;
  recipient: string;
  subject: string;
  body: string;
}): DeliverabilityInput {
  const metrics = objectValue(input.payload.deliverability);
  return {
    sender: input.sender,
    recipient: input.recipient,
    subject: input.subject,
    body: input.body,
    outreach: input.payload.outreach === true || metrics.outreach === true,
    recipientStatus: recipientStatus(metrics.recipientStatus),
    spf: authState(metrics.spf),
    dkim: authState(metrics.dkim),
    dmarc: authState(metrics.dmarc),
    bounceRate: finiteNumber(metrics.bounceRate),
    complaintRate: finiteNumber(metrics.complaintRate),
    dailyVolume: finiteNumber(metrics.dailyVolume),
    previousDailyVolume: finiteNumber(metrics.previousDailyVolume),
    warmupDays: finiteNumber(metrics.warmupDays),
    providerCount: finiteNumber(metrics.providerCount),
  };
}
