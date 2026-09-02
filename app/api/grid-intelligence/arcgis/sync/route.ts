import { NextRequest, NextResponse } from 'next/server';
import { getServerClient } from '@/lib/supabase';
import {
  arcGisLayerMetadata,
  arcGisPost,
  arcGisTokenFromEnv,
  arcGisWhereEquals,
  assertSafeArcGisLayerUrl,
  authenticateGridAdmin,
  safeText,
} from '@/lib/gridIntelligence';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const NO_STORE = { 'cache-control': 'no-store' };

function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status, headers: NO_STORE });
}

function fieldName(value: unknown, fallback: string): string {
  const name = safeText(value, 120) || fallback;
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(name)) throw new Error(`Invalid ArcGIS field name: ${name}`);
  return name;
}

export async function POST(request: NextRequest) {
  const admin = authenticateGridAdmin(request);
  if (!admin.configured) return json({ error: 'ARIDON_GRID_ADMIN_KEY is not configured.' }, 503);
  if (!admin.ok) return json({ error: 'Valid grid admin credentials are required.' }, 401);

  try {
    const body = await request.json();
    const utilityId = safeText(body?.utilityId, 120);
    const integrationId = safeText(body?.integrationId, 120);
    const assetId = safeText(body?.assetId, 120);
    const approvedBy = safeText(body?.approvedBy, 180);
    if (!utilityId || !assetId || !approvedBy || body?.approved !== true) {
      return json({ error: 'utilityId, assetId, approvedBy and approved=true are required for an outbound GIS write.' }, 409);
    }

    const supabase = getServerClient();
    let integrationQuery = supabase
      .from('grid_integrations')
      .select('*')
      .eq('utility_id', utilityId)
      .eq('provider', 'arcgis')
      .eq('enabled', true);
    if (integrationId) integrationQuery = integrationQuery.eq('id', integrationId);
    const { data: integrations, error: integrationError } = await integrationQuery.limit(2);
    if (integrationError) throw integrationError;
    if (!integrations?.length) return json({ error: 'No enabled ArcGIS integration is configured for this utility.' }, 404);
    if (integrations.length > 1 && !integrationId) return json({ error: 'Multiple ArcGIS integrations are enabled. integrationId is required.' }, 409);
    const integration = integrations[0];

    const { data: asset, error: assetError } = await supabase
      .from('grid_assets')
      .select('id, external_asset_id, asset_type, feeder_id, risk_score, condition_score, last_inspected_at')
      .eq('utility_id', utilityId)
      .eq('external_asset_id', assetId)
      .maybeSingle();
    if (assetError) throw assetError;
    if (!asset) return json({ error: 'Grid asset not found in Aridon.' }, 404);

    const { data: finding, error: findingError } = await supabase
      .from('grid_findings')
      .select('id, severity, risk_score, summary, reasons, recommended_action, review_status, reviewed_by, reviewed_at, created_at')
      .eq('asset_id', asset.id)
      .eq('review_status', 'confirmed')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (findingError) throw findingError;
    if (!finding) return json({ error: 'A human-confirmed Aridon finding is required before writing to GIS.' }, 409);

    const layerUrl = assertSafeArcGisLayerUrl(integration.feature_layer_url);
    const token = arcGisTokenFromEnv(integration.token_env_name);
    if (integration.token_env_name && !token) return json({ error: `ArcGIS token environment variable ${integration.token_env_name} is not configured.` }, 503);

    const metadata = await arcGisLayerMetadata(layerUrl, token);
    const objectIdField = fieldName(integration.object_id_field || metadata?.objectIdField || metadata?.objectIdFieldName, 'OBJECTID');
    const assetIdField = fieldName(integration.asset_id_field, 'ASSET_ID');
    const queryResult = await arcGisPost(layerUrl, 'query', {
      where: arcGisWhereEquals(assetIdField, assetId),
      outFields: '*',
      returnGeometry: 'false',
      resultRecordCount: '2',
    }, token);

    const sourceFeatures = Array.isArray(queryResult?.features) ? queryResult.features : [];
    if (sourceFeatures.length === 0) return json({ error: 'Asset was not found in the configured ArcGIS feature layer.' }, 404);
    if (sourceFeatures.length > 1) return json({ error: 'ArcGIS returned multiple assets for the configured asset ID. Refusing ambiguous update.' }, 409);

    const sourceAttributes = sourceFeatures[0]?.attributes || {};
    const objectId = sourceAttributes[objectIdField];
    if (objectId === undefined || objectId === null) return json({ error: `ArcGIS feature did not include ${objectIdField}.` }, 409);

    const mapping = integration.field_mapping && typeof integration.field_mapping === 'object' ? integration.field_mapping : {};
    const attributes: Record<string, unknown> = { [objectIdField]: objectId };
    const mapped = (key: string, fallback: string, value: unknown) => {
      const target = fieldName((mapping as any)[key], fallback);
      attributes[target] = value;
    };

    mapped('risk_score', 'ARIDON_RISK_SCORE', finding.risk_score);
    mapped('severity', 'ARIDON_SEVERITY', finding.severity);
    mapped('finding', 'ARIDON_FINDING', finding.summary);
    mapped('action', 'ARIDON_ACTION', finding.recommended_action);
    mapped('inspected_at', 'ARIDON_INSPECTED_AT', asset.last_inspected_at || finding.created_at);
    mapped('review_status', 'ARIDON_REVIEW_STATUS', finding.review_status);

    const approvedAt = new Date().toISOString();
    const { data: syncLog, error: syncInsertError } = await supabase
      .from('grid_integration_sync')
      .insert({
        utility_id: utilityId,
        integration_id: integration.id,
        provider: 'arcgis',
        direction: 'outbound',
        object_type: 'grid_asset_finding',
        object_id: assetId,
        status: 'running',
        payload: { objectIdField, assetIdField, attributes, findingId: finding.id },
        approved_by: approvedBy,
        approved_at: approvedAt,
      })
      .select('id')
      .single();
    if (syncInsertError || !syncLog) throw new Error('Unable to create GIS sync audit row.');

    try {
      const updateResult = await arcGisPost(layerUrl, 'updateFeatures', {
        features: JSON.stringify([{ attributes }]),
        rollbackOnFailure: 'true',
      }, token);
      const editResult = Array.isArray(updateResult?.updateResults) ? updateResult.updateResults[0] : null;
      if (!editResult?.success) throw new Error(safeText(editResult?.error?.description, 500) || 'ArcGIS update did not report success.');

      await Promise.all([
        supabase.from('grid_integration_sync').update({ status: 'succeeded', response: updateResult, completed_at: new Date().toISOString() }).eq('id', syncLog.id),
        supabase.from('grid_integrations').update({ last_sync_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq('id', integration.id),
        supabase.from('grid_assets').update({ source_provider: 'arcgis', source_object_id: String(objectId), updated_at: new Date().toISOString() }).eq('id', asset.id),
      ]);

      return json({
        synced: true,
        utilityId,
        assetId,
        integration: { id: integration.id, name: integration.name, provider: 'arcgis' },
        arcgis: { objectIdField, objectId, updateResult },
        finding: { id: finding.id, reviewedBy: finding.reviewed_by, reviewedAt: finding.reviewed_at },
        auditId: syncLog.id,
      });
    } catch (syncError) {
      await supabase.from('grid_integration_sync').update({
        status: 'failed',
        error_message: safeText(syncError instanceof Error ? syncError.message : 'ArcGIS sync failed.', 1000),
        completed_at: new Date().toISOString(),
      }).eq('id', syncLog.id);
      throw syncError;
    }
  } catch (error) {
    console.error('Aridon ArcGIS outbound sync error', error instanceof Error ? error.message : error);
    return json({ error: 'ArcGIS sync failed.', detail: safeText(error instanceof Error ? error.message : '', 240) || undefined }, 400);
  }
}
