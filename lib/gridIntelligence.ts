import { createHash, randomUUID, timingSafeEqual } from 'crypto';
import type { NextRequest } from 'next/server';
import { getServerClient } from '@/lib/supabase';

export type GridSeverity = 'Critical' | 'High' | 'Medium' | 'Low';

export type InspectionSignals = {
  assetId?: string;
  assetType?: string;
  thermalC?: number | null;
  thermalBaselineC?: number | null;
  vegetationClearanceFt?: number | null;
  poleLeanDeg?: number | null;
  crackConfidence?: number | null;
  corrosionConfidence?: number | null;
  conductorSagFt?: number | null;
};

export type GridAnalysis = {
  assetId: string;
  assetType: string;
  riskScore: number;
  severity: GridSeverity;
  reasons: string[];
  recommendedAction: string;
  engine: string;
};

export type GatewayIdentity = {
  clientId: string | null;
  utilityId: string;
  clientName: string;
  scopes: string[];
  mode: 'database-key' | 'bootstrap-env';
};

export type GridAdminAuth = {
  ok: boolean;
  configured: boolean;
};

export type NormalizedInspection = {
  eventId: string;
  missionId: string;
  missionName: string;
  missionStatus: 'planned' | 'approved' | 'flying' | 'paused' | 'completed' | 'aborted';
  assetId: string;
  assetType: string;
  feederId: string | null;
  capturedAt: string;
  droneId: string | null;
  position: { lat: number | null; lon: number | null; altitudeM: number | null };
  telemetry: { batteryPct: number | null; speedMps: number | null; headingDeg: number | null; [key: string]: unknown };
  evidence: { rgbUri: string | null; thermalUri: string | null; lidarUri: string | null; videoUri: string | null; sha256: string | null };
  measurements: {
    thermalC: number | null;
    thermalBaselineC: number | null;
    vegetationClearanceFt: number | null;
    poleLeanDeg: number | null;
    crackConfidence: number | null;
    corrosionConfidence: number | null;
    conductorSagFt: number | null;
  };
  metadata: Record<string, unknown>;
};

const MAX_TEXT = 1200;
const PRIVATE_IPV4 = [
  /^10\./,
  /^127\./,
  /^169\.254\./,
  /^192\.168\./,
  /^172\.(1[6-9]|2\d|3[0-1])\./,
  /^0\./,
];

export function safeText(value: unknown, max = MAX_TEXT): string {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

export function finiteNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

export function sha256(value: string): string {
  return createHash('sha256').update(value, 'utf8').digest('hex');
}

function constantTimeEqual(a: string, b: string): boolean {
  const aHash = Buffer.from(sha256(a), 'hex');
  const bHash = Buffer.from(sha256(b), 'hex');
  return timingSafeEqual(aHash, bHash);
}

function parseIsoDate(value: unknown): string {
  const text = safeText(value, 80);
  if (!text) return new Date().toISOString();
  const parsed = new Date(text);
  return Number.isNaN(parsed.getTime()) ? new Date().toISOString() : parsed.toISOString();
}

export function scoreInspection(input: InspectionSignals): GridAnalysis {
  const assetId = safeText(input.assetId, 120) || 'unknown-asset';
  const assetType = safeText(input.assetType, 80) || 'unknown';
  const thermal = finiteNumber(input.thermalC);
  const baseline = finiteNumber(input.thermalBaselineC);
  const clearance = finiteNumber(input.vegetationClearanceFt);
  const lean = finiteNumber(input.poleLeanDeg);
  const crack = finiteNumber(input.crackConfidence);
  const corrosion = finiteNumber(input.corrosionConfidence);
  const sag = finiteNumber(input.conductorSagFt);

  let risk = 8;
  const reasons: string[] = [];

  if (thermal !== null && baseline !== null) {
    const delta = thermal - baseline;
    if (delta >= 30) { risk += 48; reasons.push(`Thermal anomaly is ${delta.toFixed(1)}°C above baseline.`); }
    else if (delta >= 20) { risk += 38; reasons.push(`Thermal anomaly is ${delta.toFixed(1)}°C above baseline.`); }
    else if (delta >= 10) { risk += 22; reasons.push(`Thermal rise is ${delta.toFixed(1)}°C above baseline.`); }
    else if (delta >= 5) { risk += 10; reasons.push(`Thermal rise is ${delta.toFixed(1)}°C above baseline.`); }
  }

  if (clearance !== null) {
    if (clearance < 5) { risk += 35; reasons.push(`Vegetation clearance is only ${clearance.toFixed(1)} ft.`); }
    else if (clearance < 10) { risk += 22; reasons.push(`Vegetation clearance is ${clearance.toFixed(1)} ft.`); }
    else if (clearance < 15) { risk += 10; reasons.push('Vegetation clearance is trending toward the configured threshold.'); }
  }

  if (lean !== null) {
    if (lean >= 8) { risk += 35; reasons.push(`Pole/structure lean is ${lean.toFixed(1)}°.`); }
    else if (lean >= 5) { risk += 22; reasons.push(`Pole/structure lean is ${lean.toFixed(1)}°.`); }
    else if (lean >= 3) { risk += 10; reasons.push(`Pole/structure lean is ${lean.toFixed(1)}°.`); }
  }

  if (crack !== null) {
    const confidence = Math.max(0, Math.min(1, crack));
    if (confidence >= .9) { risk += 35; reasons.push(`Crack detector confidence is ${(confidence * 100).toFixed(0)}%.`); }
    else if (confidence >= .7) { risk += 24; reasons.push(`Crack detector confidence is ${(confidence * 100).toFixed(0)}%.`); }
    else if (confidence >= .5) { risk += 12; reasons.push('Crack candidate requires confirmation.'); }
  }

  if (corrosion !== null) {
    const confidence = Math.max(0, Math.min(1, corrosion));
    if (confidence >= .85) { risk += 24; reasons.push(`Corrosion detector confidence is ${(confidence * 100).toFixed(0)}%.`); }
    else if (confidence >= .6) { risk += 12; reasons.push('Corrosion candidate should be trended.'); }
  }

  if (sag !== null && sag >= 6) {
    risk += sag >= 10 ? 28 : 14;
    reasons.push(`Measured conductor sag is ${sag.toFixed(1)} ft.`);
  }

  const riskScore = Math.min(100, Math.round(risk));
  const severity: GridSeverity = riskScore >= 90 ? 'Critical' : riskScore >= 70 ? 'High' : riskScore >= 45 ? 'Medium' : 'Low';
  const recommendedAction = severity === 'Critical'
    ? 'Escalate immediately and require utility operator review before dispatch.'
    : severity === 'High'
      ? 'Create a priority inspection recommendation for utility approval within 24 hours.'
      : severity === 'Medium'
        ? 'Queue a field inspection or maintenance recommendation within 14 days.'
        : 'Track this asset and compare against the next inspection cycle.';

  if (reasons.length === 0) reasons.push('No configured anomaly threshold was exceeded in this inspection payload.');

  return { assetId, assetType, riskScore, severity, reasons, recommendedAction, engine: 'aridon-grid-rules-v0.2' };
}

export function normalizeInspection(body: any): NormalizedInspection {
  const missionId = safeText(body?.missionId, 120);
  const assetId = safeText(body?.assetId, 120);
  if (!missionId || !assetId) throw new Error('missionId and assetId are required.');

  const missionStatusRaw = safeText(body?.missionStatus, 30);
  const missionStatuses = new Set(['planned', 'approved', 'flying', 'paused', 'completed', 'aborted']);
  const missionStatus = (missionStatuses.has(missionStatusRaw) ? missionStatusRaw : 'flying') as NormalizedInspection['missionStatus'];

  const telemetryRaw = body?.telemetry && typeof body.telemetry === 'object' && !Array.isArray(body.telemetry) ? body.telemetry : {};
  const metadataRaw = body?.metadata && typeof body.metadata === 'object' && !Array.isArray(body.metadata) ? body.metadata : {};

  return {
    eventId: safeText(body?.eventId, 120) || randomUUID(),
    missionId,
    missionName: safeText(body?.missionName, 180) || missionId,
    missionStatus,
    assetId,
    assetType: safeText(body?.assetType, 80) || 'unknown',
    feederId: safeText(body?.feederId, 120) || null,
    capturedAt: parseIsoDate(body?.capturedAt),
    droneId: safeText(body?.droneId, 120) || null,
    position: {
      lat: finiteNumber(body?.position?.lat),
      lon: finiteNumber(body?.position?.lon),
      altitudeM: finiteNumber(body?.position?.altitudeM),
    },
    telemetry: {
      ...telemetryRaw,
      batteryPct: finiteNumber(body?.telemetry?.batteryPct),
      speedMps: finiteNumber(body?.telemetry?.speedMps),
      headingDeg: finiteNumber(body?.telemetry?.headingDeg),
    },
    evidence: {
      rgbUri: safeText(body?.evidence?.rgbUri, 1600) || null,
      thermalUri: safeText(body?.evidence?.thermalUri, 1600) || null,
      lidarUri: safeText(body?.evidence?.lidarUri, 1600) || null,
      videoUri: safeText(body?.evidence?.videoUri, 1600) || null,
      sha256: safeText(body?.evidence?.sha256, 128) || null,
    },
    measurements: {
      thermalC: finiteNumber(body?.measurements?.thermalC),
      thermalBaselineC: finiteNumber(body?.measurements?.thermalBaselineC),
      vegetationClearanceFt: finiteNumber(body?.measurements?.vegetationClearanceFt),
      poleLeanDeg: finiteNumber(body?.measurements?.poleLeanDeg),
      crackConfidence: finiteNumber(body?.measurements?.crackConfidence),
      corrosionConfidence: finiteNumber(body?.measurements?.corrosionConfidence),
      conductorSagFt: finiteNumber(body?.measurements?.conductorSagFt),
    },
    metadata: metadataRaw,
  };
}

export async function authenticateGateway(request: NextRequest, requiredScope: string): Promise<GatewayIdentity | null> {
  const rawKey = safeText(request.headers.get('x-aridon-grid-key'), 512);
  if (!rawKey) return null;

  const clientHash = sha256(rawKey);
  const supabase = getServerClient();
  const { data } = await supabase
    .from('grid_gateway_clients')
    .select('id, utility_id, name, scopes')
    .eq('key_sha256', clientHash)
    .eq('active', true)
    .maybeSingle();

  if (data) {
    const scopes = Array.isArray(data.scopes) ? data.scopes.filter((scope: unknown): scope is string => typeof scope === 'string') : [];
    if (!scopes.includes(requiredScope) && !scopes.includes('*')) return null;
    await supabase.from('grid_gateway_clients').update({ last_seen_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq('id', data.id);
    return { clientId: data.id, utilityId: data.utility_id, clientName: data.name, scopes, mode: 'database-key' };
  }

  const bootstrapKey = process.env.ARIDON_GRID_GATEWAY_KEY?.trim() || '';
  if (bootstrapKey && constantTimeEqual(rawKey, bootstrapKey)) {
    const utilityId = safeText(process.env.ARIDON_GRID_DEFAULT_UTILITY_ID || request.headers.get('x-aridon-utility-id'), 120);
    if (!utilityId) return null;
    return { clientId: null, utilityId, clientName: 'bootstrap-gateway', scopes: ['*'], mode: 'bootstrap-env' };
  }

  return null;
}

export function authenticateGridAdmin(request: NextRequest): GridAdminAuth {
  const configured = process.env.ARIDON_GRID_ADMIN_KEY?.trim() || '';
  if (!configured) return { ok: false, configured: false };
  const supplied = safeText(request.headers.get('x-aridon-grid-admin'), 512);
  return { ok: !!supplied && constantTimeEqual(supplied, configured), configured: true };
}

export function assertSafeArcGisLayerUrl(value: unknown): string {
  const raw = safeText(value, 2000);
  if (!raw) throw new Error('ArcGIS feature layer URL is required.');
  const parsed = new URL(raw);
  if (parsed.protocol !== 'https:') throw new Error('ArcGIS feature layer URL must use HTTPS.');
  if (parsed.username || parsed.password) throw new Error('Credentials must not be embedded in the ArcGIS URL.');
  const hostname = parsed.hostname.toLowerCase();
  if (hostname === 'localhost' || hostname === '::1' || PRIVATE_IPV4.some((pattern) => pattern.test(hostname))) {
    throw new Error('Private or loopback ArcGIS hosts are not allowed from the cloud connector.');
  }
  const cleanPath = parsed.pathname.replace(/\/+$/, '');
  if (!/\/FeatureServer\/\d+$/i.test(cleanPath)) throw new Error('ArcGIS URL must point to a FeatureServer layer, for example .../FeatureServer/0.');
  parsed.pathname = cleanPath;
  parsed.search = '';
  parsed.hash = '';
  return parsed.toString().replace(/\/$/, '');
}

export function arcGisTokenFromEnv(tokenEnvName: unknown): string | null {
  const envName = safeText(tokenEnvName, 100);
  if (!envName) return null;
  if (!/^ARIDON_ARCGIS_[A-Z0-9_]+$/.test(envName)) throw new Error('ArcGIS token environment name must begin with ARIDON_ARCGIS_.');
  return process.env[envName]?.trim() || null;
}

async function readArcGisJson(response: Response): Promise<any> {
  const text = await response.text();
  let parsed: any;
  try { parsed = JSON.parse(text); } catch { throw new Error(`ArcGIS returned a non-JSON response (${response.status}).`); }
  if (!response.ok) throw new Error(`ArcGIS HTTP ${response.status}.`);
  if (parsed?.error) throw new Error(safeText(parsed.error?.message, 500) || 'ArcGIS returned an error.');
  return parsed;
}

function arcGisHeaders(token: string | null): Record<string, string> {
  return token ? { 'X-Esri-Authorization': `Bearer ${token}` } : {};
}

export async function arcGisLayerMetadata(layerUrl: string, token: string | null): Promise<any> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);
  try {
    const response = await fetch(`${layerUrl}?f=json`, { method: 'GET', headers: arcGisHeaders(token), signal: controller.signal, cache: 'no-store' });
    return await readArcGisJson(response);
  } finally {
    clearTimeout(timeout);
  }
}

export async function arcGisPost(layerUrl: string, operation: 'query' | 'updateFeatures', params: Record<string, string>, token: string | null): Promise<any> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 25000);
  try {
    const body = new URLSearchParams({ f: 'json', ...params });
    const response = await fetch(`${layerUrl}/${operation}`, {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded;charset=UTF-8', ...arcGisHeaders(token) },
      body,
      signal: controller.signal,
      cache: 'no-store',
    });
    return await readArcGisJson(response);
  } finally {
    clearTimeout(timeout);
  }
}

export function arcGisWhereEquals(field: string, value: string): string {
  const safeField = safeText(field, 120);
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(safeField)) throw new Error('ArcGIS asset ID field name is invalid.');
  return `${safeField}='${value.replace(/'/g, "''")}'`;
}

export function evidenceRows(utilityId: string, inspectionEventId: string, inspection: NormalizedInspection) {
  const rows: Array<Record<string, unknown>> = [];
  const candidates: Array<[string, string | null]> = [
    ['rgb', inspection.evidence.rgbUri],
    ['thermal', inspection.evidence.thermalUri],
    ['lidar', inspection.evidence.lidarUri],
    ['video', inspection.evidence.videoUri],
  ];
  for (const [evidenceType, storageUri] of candidates) {
    if (!storageUri) continue;
    rows.push({ utility_id: utilityId, inspection_event_id: inspectionEventId, evidence_type: evidenceType, storage_uri: storageUri, sha256: inspection.evidence.sha256, metadata: {} });
  }
  return rows;
}
