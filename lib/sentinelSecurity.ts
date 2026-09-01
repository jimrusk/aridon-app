export type SentinelSeverity = 'low' | 'medium' | 'high' | 'critical';
export type SentinelEscalationMode = 'prepare_only' | 'approval_required' | 'automatic_critical';

export type SentinelSignals = {
  unauthorizedAccess?: boolean;
  privilegeEscalation?: boolean;
  dataExfiltration?: boolean;
  ransomware?: boolean;
  destructiveAction?: boolean;
  criticalInfrastructure?: boolean;
  persistence?: boolean;
  massRecordAccess?: boolean;
  commandAndControl?: boolean;
  impossibleTravel?: boolean;
  newDevice?: boolean;
};

export type SentinelActorProfile = {
  ip?: string;
  userId?: string;
  accountEmail?: string;
  deviceId?: string;
  userAgent?: string;
  country?: string;
  region?: string;
  provider?: string;
  observedIdentity?: string;
};

export type SentinelIncidentDraft = {
  tenantId: string;
  title: string;
  summary: string;
  incidentType?: string;
  confidence?: number;
  occurredAt?: string;
  actor?: SentinelActorProfile;
  indicators?: unknown[];
  affectedAssets?: unknown[];
  evidence?: Record<string, unknown>;
  signals?: SentinelSignals;
  simulation?: boolean;
};

export type SentinelPolicy = {
  escalationMode: SentinelEscalationMode;
  automaticScoreThreshold: number;
  automaticConfidenceThreshold: number;
  notifyCisa: boolean;
  notifyFbi: boolean;
  localAuthorityName?: string;
  localAuthorityEmail?: string;
  legalContactEmail?: string;
  securityContactEmail?: string;
  preserveEvidence: boolean;
};

export const SENTINEL_AUTHORITIES = {
  cisa: {
    name: 'CISA',
    email: 'report@cisa.gov',
    phone: '(888) 282-0870',
    url: 'https://www.cisa.gov/report',
  },
  fbi: {
    name: 'FBI Internet Crime Complaint Center (IC3)',
    url: 'https://www.ic3.gov/',
    fieldOfficesUrl: 'https://www.fbi.gov/contact-us/field-offices',
  },
} as const;

export const DEFAULT_SENTINEL_POLICY: SentinelPolicy = {
  escalationMode: 'approval_required',
  automaticScoreThreshold: 95,
  automaticConfidenceThreshold: 90,
  notifyCisa: true,
  notifyFbi: true,
  preserveEvidence: true,
};

function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, Math.round(value)));
}

export function scoreSentinelIncident(signals: SentinelSignals = {}) {
  let score = 15;
  if (signals.unauthorizedAccess) score += 12;
  if (signals.privilegeEscalation) score += 14;
  if (signals.dataExfiltration) score += 24;
  if (signals.ransomware) score += 24;
  if (signals.destructiveAction) score += 20;
  if (signals.criticalInfrastructure) score += 18;
  if (signals.persistence) score += 10;
  if (signals.massRecordAccess) score += 14;
  if (signals.commandAndControl) score += 16;
  if (signals.impossibleTravel) score += 6;
  if (signals.newDevice) score += 4;

  const riskScore = clamp(score);
  const severity: SentinelSeverity =
    riskScore >= 85 ? 'critical' : riskScore >= 65 ? 'high' : riskScore >= 40 ? 'medium' : 'low';

  return { riskScore, severity };
}

export function containmentPlan(signals: SentinelSignals = {}) {
  const actions = [
    'Preserve volatile logs, timestamps, access records and relevant audit evidence.',
    'Revoke the suspicious session and require strong reauthentication.',
    'Block the observed source indicators at the appropriate control points.',
  ];

  if (signals.privilegeEscalation) actions.push('Remove newly granted privileges and rotate privileged credentials.');
  if (signals.dataExfiltration || signals.massRecordAccess) actions.push('Freeze bulk exports and high-volume data access while scope is verified.');
  if (signals.commandAndControl) actions.push('Isolate the affected endpoint or workload from external command-and-control traffic.');
  if (signals.ransomware || signals.destructiveAction) actions.push('Isolate affected systems, protect backups and suspend destructive automation paths.');
  if (signals.criticalInfrastructure) actions.push('Activate the organization critical-infrastructure incident response plan.');

  return actions;
}

export function isAutomaticEscalationEligible(
  policy: SentinelPolicy,
  severity: SentinelSeverity,
  riskScore: number,
  confidence: number,
  simulation = false,
) {
  if (simulation) return false;
  return (
    policy.escalationMode === 'automatic_critical' &&
    severity === 'critical' &&
    riskScore >= policy.automaticScoreThreshold &&
    confidence >= policy.automaticConfidenceThreshold
  );
}

export function buildAuthorityReport(args: {
  organizationName: string;
  incidentId: string;
  title: string;
  summary: string;
  incidentType: string;
  severity: SentinelSeverity;
  riskScore: number;
  confidence: number;
  actor: SentinelActorProfile;
  indicators: unknown[];
  affectedAssets: unknown[];
  containmentActions: string[];
  evidenceSha256: string;
  occurredAt?: string;
  detectedAt: string;
}) {
  const actorLines = [
    args.actor.ip ? `Source IP: ${args.actor.ip}` : '',
    args.actor.observedIdentity ? `Observed identity: ${args.actor.observedIdentity}` : '',
    args.actor.accountEmail ? `Account involved: ${args.actor.accountEmail}` : '',
    args.actor.deviceId ? `Device ID: ${args.actor.deviceId}` : '',
    args.actor.userAgent ? `User agent: ${args.actor.userAgent}` : '',
    args.actor.country ? `Observed country: ${args.actor.country}` : '',
    args.actor.region ? `Observed region: ${args.actor.region}` : '',
    args.actor.provider ? `Network/provider: ${args.actor.provider}` : '',
  ].filter(Boolean);

  return [
    'ARIDON SENTINEL ENTERPRISE - CYBER INCIDENT REPORT',
    '',
    `Organization: ${args.organizationName}`,
    `Aridon incident ID: ${args.incidentId}`,
    `Severity: ${args.severity.toUpperCase()} (${args.riskScore}/100 risk score)`,
    `Evidence confidence: ${args.confidence}%`,
    `Incident type: ${args.incidentType}`,
    `Occurred: ${args.occurredAt || 'Unknown / under investigation'}`,
    `Detected: ${args.detectedAt}`,
    '',
    `Title: ${args.title}`,
    '',
    'Incident summary:',
    args.summary,
    '',
    'Suspected actor / source indicators:',
    ...(actorLines.length ? actorLines : ['No actor identity has been verified.']),
    '',
    'Technical indicators:',
    JSON.stringify(args.indicators, null, 2),
    '',
    'Affected assets:',
    JSON.stringify(args.affectedAssets, null, 2),
    '',
    'Containment actions:',
    ...args.containmentActions.map((action) => `- ${action}`),
    '',
    `Evidence package SHA-256: ${args.evidenceSha256}`,
    '',
    'IMPORTANT ATTRIBUTION NOTICE:',
    'This report concerns suspected cyber activity. IP addresses, account names, devices and other indicators identify observed technical activity only and do not by themselves establish the legal identity or guilt of any person. Attribution remains preliminary unless independently verified.',
  ].join('\n');
}
