import { containmentPlan, scoreSentinelIncident, type SentinelIncidentDraft, type SentinelSignals } from './sentinelSecurity';

export type PaloAltoSource = 'prisma_airs' | 'cortex_xsiam' | 'cortex_xsoar' | 'cyberark' | 'unknown';

export type NormalizedPaloAltoEvent = {
  source: PaloAltoSource;
  sourceLabel: string;
  draft: SentinelIncidentDraft;
  fabric: {
    riskScore: number;
    severity: 'low' | 'medium' | 'high' | 'critical';
    blastRadiusScore: number;
    blastRadius: 'contained' | 'limited' | 'material' | 'enterprise';
    priorityActions: string[];
    continuityActions: string[];
    humanDecision: string;
    evidenceNotes: string[];
  };
};

type JsonRecord = Record<string, unknown>;

function asRecord(value: unknown): JsonRecord {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as JsonRecord : {};
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : value == null ? [] : [value];
}

function asString(value: unknown, fallback = '') {
  return typeof value === 'string' ? value.trim() : typeof value === 'number' || typeof value === 'boolean' ? String(value) : fallback;
}

function lowered(value: unknown) {
  return asString(value).toLowerCase();
}

function containsAny(haystack: string, needles: string[]) {
  return needles.some((needle) => haystack.includes(needle));
}

function sourceFromPayload(payload: JsonRecord): { source: PaloAltoSource; label: string } {
  const product = `${lowered(payload.source)} ${lowered(payload.product)} ${lowered(payload.vendor)} ${lowered(payload.service)} ${lowered(payload.platform)}`;
  if (containsAny(product, ['prisma airs', 'prisma_airs', 'airs', 'ai runtime', 'ai security'])) return { source: 'prisma_airs', label: 'Prisma AIRS' };
  if (containsAny(product, ['xsiam', 'cortex xsiam'])) return { source: 'cortex_xsiam', label: 'Cortex XSIAM' };
  if (containsAny(product, ['xsoar', 'cortex xsoar'])) return { source: 'cortex_xsoar', label: 'Cortex XSOAR' };
  if (containsAny(product, ['cyberark', 'privileged access', 'identity security'])) return { source: 'cyberark', label: 'CyberArk' };
  return { source: 'unknown', label: 'Palo Alto / security source' };
}

function deriveSignals(payload: JsonRecord): SentinelSignals {
  const joined = JSON.stringify(payload).toLowerCase();
  return {
    unauthorizedAccess: containsAny(joined, ['unauthorized', 'stolen credential', 'credential theft', 'account takeover', 'login anomaly', 'authentication bypass']),
    privilegeEscalation: containsAny(joined, ['privilege escalation', 'elevated privilege', 'admin role', 'role escalation', 'sudo', 'superuser']),
    dataExfiltration: containsAny(joined, ['exfiltration', 'bulk export', 'data export', 'large upload', 'sensitive data transfer']),
    ransomware: containsAny(joined, ['ransomware', 'encrypting files', 'ransom note']),
    destructiveAction: containsAny(joined, ['destructive', 'delete database', 'wipe', 'destroy', 'mass delete']),
    criticalInfrastructure: containsAny(joined, ['critical infrastructure', 'scada', 'ics', 'ot network', 'utility control']),
    persistence: containsAny(joined, ['persistence', 'new service account', 'backdoor', 'scheduled task', 'startup item']),
    massRecordAccess: containsAny(joined, ['mass record', 'bulk read', 'high-volume read', 'large query', 'records accessed']),
    commandAndControl: containsAny(joined, ['command and control', 'c2', 'beaconing', 'remote command']),
    impossibleTravel: containsAny(joined, ['impossible travel', 'impossible location']),
    newDevice: containsAny(joined, ['new device', 'unknown device', 'unmanaged device']),
  };
}

function affectedAssets(payload: JsonRecord) {
  const raw = payload.affectedAssets ?? payload.assets ?? payload.targets ?? payload.resources;
  const items = asArray(raw).slice(0, 25);
  return items.map((item, index) => {
    if (typeof item === 'string') return { type: 'asset', name: item };
    const record = asRecord(item);
    return {
      type: asString(record.type || record.kind || record.category, 'asset'),
      name: asString(record.name || record.hostname || record.resource || record.id, `asset-${index + 1}`),
    };
  });
}

function indicators(payload: JsonRecord) {
  const raw = payload.indicators ?? payload.iocs ?? payload.observables;
  return asArray(raw).slice(0, 50);
}

function confidence(payload: JsonRecord) {
  const raw = Number(payload.confidence ?? payload.confidenceScore ?? payload.score ?? 85);
  if (!Number.isFinite(raw)) return 85;
  const normalized = raw <= 1 ? raw * 100 : raw;
  return Math.max(0, Math.min(100, Math.round(normalized)));
}

function blastRadius(signals: SentinelSignals, assetCount: number) {
  let score = Math.min(30, assetCount * 5);
  if (signals.privilegeEscalation) score += 18;
  if (signals.dataExfiltration) score += 20;
  if (signals.ransomware || signals.destructiveAction) score += 24;
  if (signals.commandAndControl || signals.persistence) score += 12;
  if (signals.criticalInfrastructure) score += 24;
  const value = Math.max(0, Math.min(100, Math.round(score)));
  const label = value >= 80 ? 'enterprise' : value >= 55 ? 'material' : value >= 25 ? 'limited' : 'contained';
  return { score: value, label: label as 'contained' | 'limited' | 'material' | 'enterprise' };
}

function continuityPlan(signals: SentinelSignals) {
  const actions = [
    'Prefer the smallest safe isolation boundary so unaffected business services remain online.',
    'Preserve an executive-approved rollback path before broad containment changes are expanded.',
  ];
  if (signals.dataExfiltration || signals.massRecordAccess) actions.push('Restrict bulk export paths while normal low-risk business transactions continue.');
  if (signals.privilegeEscalation) actions.push('Suspend newly elevated privileges first instead of disabling every identity in the environment.');
  if (signals.ransomware || signals.destructiveAction) actions.push('Protect backups and isolate affected segments before considering wider shutdown actions.');
  if (signals.criticalInfrastructure) actions.push('Keep safety-critical operational controls under the organization’s approved continuity procedures.');
  return actions;
}

function priorityActions(source: PaloAltoSource, signals: SentinelSignals) {
  const actions = containmentPlan(signals);
  if (source === 'prisma_airs') actions.unshift('Quarantine the affected AI agent or tool-call path and revoke its active delegated session before expanding containment.');
  if (source === 'cyberark') actions.unshift('Suspend the implicated privileged session and rotate only the exposed privileged credentials first.');
  if (source === 'cortex_xsiam') actions.unshift('Attach the Cortex alert lineage to the Sentinel incident and preserve the originating telemetry before response actions change state.');
  if (source === 'cortex_xsoar') actions.unshift('Treat the existing XSOAR playbook as an execution source while Sentinel applies company-level approval, continuity and escalation policy.');
  return Array.from(new Set(actions)).slice(0, 12);
}

export function normalizePaloAltoEvent(input: unknown, tenantId: string, simulation = true): NormalizedPaloAltoEvent {
  const payload = asRecord(input);
  const { source, label } = sourceFromPayload(payload);
  const signals = deriveSignals(payload);
  const assets = affectedAssets(payload);
  const title = asString(payload.title || payload.name || payload.alertName || payload.incidentName, `${label} security event`);
  const summary = asString(
    payload.summary || payload.description || payload.message || payload.details,
    `Normalized ${label} event for Aridon Sentinel Adaptive Containment Fabric review.`,
  );
  const incidentType = asString(payload.incidentType || payload.category || payload.type, source === 'prisma_airs' ? 'ai_agent_security' : 'security_event');
  const actor = asRecord(payload.actor || payload.identity || payload.user);
  const { riskScore, severity } = scoreSentinelIncident(signals);
  const radius = blastRadius(signals, assets.length);

  const draft: SentinelIncidentDraft = {
    tenantId,
    title,
    summary,
    incidentType,
    confidence: confidence(payload),
    occurredAt: asString(payload.occurredAt || payload.timestamp || payload.eventTime) || undefined,
    actor: {
      ip: asString(actor.ip || actor.sourceIp) || undefined,
      userId: asString(actor.userId || actor.id) || undefined,
      accountEmail: asString(actor.email || actor.accountEmail) || undefined,
      deviceId: asString(actor.deviceId || actor.device) || undefined,
      country: asString(actor.country) || undefined,
      region: asString(actor.region) || undefined,
      provider: asString(actor.provider) || undefined,
      observedIdentity: asString(actor.name || actor.identity || actor.username) || undefined,
    },
    indicators: indicators(payload),
    affectedAssets: assets,
    evidence: {
      integrationSource: source,
      vendor: 'Palo Alto Networks ecosystem',
      originalEvent: payload,
      normalizedAt: new Date().toISOString(),
    },
    signals,
    simulation,
  };

  return {
    source,
    sourceLabel: label,
    draft,
    fabric: {
      riskScore,
      severity,
      blastRadiusScore: radius.score,
      blastRadius: radius.label,
      priorityActions: priorityActions(source, signals),
      continuityActions: continuityPlan(signals),
      humanDecision: simulation
        ? 'Simulation lock is active. No external authority reporting can be sent from this event.'
        : 'Containment may proceed only within configured company policy. External escalation follows the company’s Prepare Only, Human Approval, or pre-authorized Critical Response setting.',
      evidenceNotes: [
        'Preserve the original vendor event and the normalized Sentinel envelope together.',
        'Hash the incident evidence when it enters the Sentinel incident pipeline.',
        'Record every override, hold, approval and containment decision in the audit trail.',
      ],
    },
  };
}
