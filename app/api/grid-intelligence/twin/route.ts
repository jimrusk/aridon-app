import { NextRequest, NextResponse } from 'next/server';
import { getServerClient } from '@/lib/supabase';
import { authenticateGateway, authenticateGridAdmin, safeText } from '@/lib/gridIntelligence';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const NO_STORE = { 'cache-control': 'no-store' };

function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status, headers: NO_STORE });
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const assetId = safeText(url.searchParams.get('assetId'), 120);
  if (!assetId) return json({ error: 'assetId is required.' }, 400);

  const gateway = await authenticateGateway(request, 'twin:read');
  const admin = authenticateGridAdmin(request);
  if (!gateway && !admin.ok) {
    return json({ error: admin.configured ? 'Valid grid credentials are required.' : 'Grid admin access is not configured and no valid gateway key was supplied.' }, 401);
  }

  const utilityId = gateway?.utilityId || safeText(url.searchParams.get('utilityId'), 120);
  if (!utilityId) return json({ error: 'utilityId is required for admin reads.' }, 400);

  try {
    const supabase = getServerClient();
    const { data: asset, error: assetError } = await supabase
      .from('grid_assets')
      .select('*')
      .eq('utility_id', utilityId)
      .eq('external_asset_id', assetId)
      .maybeSingle();

    if (assetError) throw assetError;
    if (!asset) return json({ error: 'Asset not found.' }, 404);

    const [{ data: events, error: eventError }, { data: findings, error: findingError }, { data: workOrders, error: workError }] = await Promise.all([
      supabase
        .from('inspection_events')
        .select('id, external_event_id, captured_at, latitude, longitude, altitude_m, battery_pct, telemetry, measurements, payload_sha256')
        .eq('asset_id', asset.id)
        .order('captured_at', { ascending: false })
        .limit(25),
      supabase
        .from('grid_findings')
        .select('id, finding_type, severity, risk_score, confidence, summary, reasons, recommended_action, model_version, review_status, reviewed_by, reviewed_at, created_at')
        .eq('asset_id', asset.id)
        .order('created_at', { ascending: false })
        .limit(25),
      supabase
        .from('grid_work_orders')
        .select('id, external_work_order_id, status, priority, recommended_action, approved_by, approved_at, completed_at, metadata, created_at, updated_at')
        .eq('asset_id', asset.id)
        .order('created_at', { ascending: false })
        .limit(25),
    ]);

    if (eventError || findingError || workError) throw eventError || findingError || workError;

    const eventIds = (events || []).map((event) => event.id);
    const workOrderIds = (workOrders || []).map((work) => work.id);

    const [{ data: evidence, error: evidenceError }, { data: verifications, error: verificationError }] = await Promise.all([
      eventIds.length
        ? supabase.from('inspection_evidence').select('id, inspection_event_id, evidence_type, storage_uri, sha256, mime_type, metadata, created_at').in('inspection_event_id', eventIds).order('created_at', { ascending: false })
        : Promise.resolve({ data: [], error: null } as any),
      workOrderIds.length
        ? supabase.from('repair_verifications').select('id, work_order_id, before_event_id, after_event_id, result, comparison, verified_by, verified_at, created_at').in('work_order_id', workOrderIds).order('created_at', { ascending: false })
        : Promise.resolve({ data: [], error: null } as any),
    ]);

    if (evidenceError || verificationError) throw evidenceError || verificationError;

    return json({
      utilityId,
      asset,
      timeline: {
        events: events || [],
        evidence: evidence || [],
        findings: findings || [],
        workOrders: workOrders || [],
        verifications: verifications || [],
      },
      digitalTwinVersion: 'aridon-grid-twin-v0.2',
    });
  } catch (error) {
    console.error('Aridon grid twin read error', error instanceof Error ? error.message : error);
    return json({ error: 'Unable to read the grid digital twin.' }, 500);
  }
}
