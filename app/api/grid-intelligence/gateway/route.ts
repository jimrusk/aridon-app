import { NextRequest, NextResponse } from 'next/server';
import { getServerClient } from '@/lib/supabase';
import {
  authenticateGateway,
  evidenceRows,
  normalizeInspection,
  safeText,
  scoreInspection,
  sha256,
} from '@/lib/gridIntelligence';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const NO_STORE = { 'cache-control': 'no-store' };
const MAX_BODY_BYTES = 1024 * 1024;

function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status, headers: NO_STORE });
}

export async function POST(request: NextRequest) {
  const identity = await authenticateGateway(request, 'ingest');
  if (!identity) return json({ error: 'Valid grid gateway credentials are required.' }, 401);

  const declaredLength = Number(request.headers.get('content-length') || '0');
  if (declaredLength > MAX_BODY_BYTES) return json({ error: 'Inspection payload is too large.' }, 413);

  try {
    const rawBody = await request.text();
    if (Buffer.byteLength(rawBody, 'utf8') > MAX_BODY_BYTES) return json({ error: 'Inspection payload is too large.' }, 413);
    const body = JSON.parse(rawBody);
    const inspection = normalizeInspection(body);
    const supabase = getServerClient();

    const { data: duplicate } = await supabase
      .from('inspection_events')
      .select('id, external_event_id, created_at')
      .eq('utility_id', identity.utilityId)
      .eq('external_event_id', inspection.eventId)
      .maybeSingle();

    if (duplicate) {
      return json({ accepted: true, duplicate: true, event: duplicate, utilityId: identity.utilityId }, 200);
    }

    const { data: asset, error: assetError } = await supabase
      .from('grid_assets')
      .upsert({
        utility_id: identity.utilityId,
        external_asset_id: inspection.assetId,
        asset_type: inspection.assetType,
        feeder_id: inspection.feederId,
        latitude: inspection.position.lat,
        longitude: inspection.position.lon,
        metadata: inspection.metadata,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'utility_id,external_asset_id' })
      .select('id, external_asset_id')
      .single();

    if (assetError || !asset) throw new Error('Asset upsert failed.');

    const { data: mission, error: missionError } = await supabase
      .from('drone_missions')
      .upsert({
        utility_id: identity.utilityId,
        external_mission_id: inspection.missionId,
        name: inspection.missionName,
        status: inspection.missionStatus,
        drone_id: inspection.droneId,
        updated_at: new Date().toISOString(),
        mission_metadata: { gatewayClient: identity.clientName },
      }, { onConflict: 'utility_id,external_mission_id' })
      .select('id, external_mission_id')
      .single();

    if (missionError || !mission) throw new Error('Mission upsert failed.');

    const { data: event, error: eventError } = await supabase
      .from('inspection_events')
      .insert({
        utility_id: identity.utilityId,
        external_event_id: inspection.eventId,
        mission_id: mission.id,
        asset_id: asset.id,
        gateway_client_id: identity.clientId,
        captured_at: inspection.capturedAt,
        latitude: inspection.position.lat,
        longitude: inspection.position.lon,
        altitude_m: inspection.position.altitudeM,
        battery_pct: inspection.telemetry.batteryPct,
        telemetry: inspection.telemetry,
        measurements: inspection.measurements,
        payload_sha256: sha256(rawBody),
      })
      .select('id, external_event_id, captured_at')
      .single();

    if (eventError || !event) throw new Error('Inspection event insert failed.');

    const rows = evidenceRows(identity.utilityId, event.id, inspection);
    if (rows.length) {
      const { error: evidenceError } = await supabase.from('inspection_evidence').insert(rows);
      if (evidenceError) throw new Error('Evidence insert failed.');
    }

    const analysis = scoreInspection({
      assetId: inspection.assetId,
      assetType: inspection.assetType,
      ...inspection.measurements,
    });

    const summary = analysis.reasons[0] || `Inspection risk score ${analysis.riskScore}.`;
    const { data: finding, error: findingError } = await supabase
      .from('grid_findings')
      .insert({
        utility_id: identity.utilityId,
        inspection_event_id: event.id,
        asset_id: asset.id,
        finding_type: analysis.riskScore >= 45 ? 'inspection_anomaly' : 'inspection_clear',
        severity: analysis.severity,
        risk_score: analysis.riskScore,
        confidence: null,
        summary,
        reasons: analysis.reasons,
        recommended_action: analysis.recommendedAction,
        model_version: analysis.engine,
        review_status: analysis.riskScore >= 45 ? 'pending' : 'confirmed',
      })
      .select('id, severity, risk_score, review_status')
      .single();

    if (findingError || !finding) throw new Error('Finding insert failed.');

    const conditionScore = Math.max(0, 100 - analysis.riskScore);
    const { error: updateAssetError } = await supabase
      .from('grid_assets')
      .update({
        asset_type: inspection.assetType,
        feeder_id: inspection.feederId,
        latitude: inspection.position.lat,
        longitude: inspection.position.lon,
        risk_score: analysis.riskScore,
        condition_score: conditionScore,
        last_inspected_at: inspection.capturedAt,
        updated_at: new Date().toISOString(),
      })
      .eq('id', asset.id);

    if (updateAssetError) throw new Error('Digital twin update failed.');

    let workOrder: { id: string; status: string; priority: string | null } | null = null;
    if (analysis.riskScore >= 45) {
      const { data: work } = await supabase
        .from('grid_work_orders')
        .insert({
          utility_id: identity.utilityId,
          finding_id: finding.id,
          asset_id: asset.id,
          status: 'recommended',
          priority: analysis.severity,
          recommended_action: analysis.recommendedAction,
          metadata: { source: 'drone_gateway', eventId: inspection.eventId },
        })
        .select('id, status, priority')
        .single();
      workOrder = work || null;
    }

    return json({
      accepted: true,
      duplicate: false,
      utilityId: identity.utilityId,
      gateway: { clientId: identity.clientId, name: identity.clientName, mode: identity.mode },
      event,
      asset: { id: asset.id, externalAssetId: asset.external_asset_id, conditionScore, riskScore: analysis.riskScore },
      finding: { ...finding, summary, reasons: analysis.reasons, recommendedAction: analysis.recommendedAction },
      workOrder,
      safety: 'Findings and work orders are recommendations only. External dispatch and GIS writes remain separately approval-gated.',
    }, 202);
  } catch (error) {
    console.error('Aridon grid gateway ingestion error', error instanceof Error ? error.message : error);
    return json({ error: 'Unable to persist the inspection event.', detail: safeText(error instanceof Error ? error.message : '', 180) || undefined }, 400);
  }
}
