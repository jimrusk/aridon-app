import { NextRequest, NextResponse } from 'next/server';
import { getServerClient } from '@/lib/supabase';
import {
  arcGisLayerMetadata,
  arcGisPost,
  arcGisTokenFromEnv,
  assertSafeArcGisLayerUrl,
  authenticateGridAdmin,
  finiteNumber,
  safeText,
} from '@/lib/gridIntelligence';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const NO_STORE = { 'cache-control': 'no-store' };

function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status, headers: NO_STORE });
}

function validField(value: unknown, fallback: string): string {
  const field = safeText(value, 120) || fallback;
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(field)) throw new Error(`Invalid ArcGIS field name: ${field}`);
  return field;
}

export async function POST(request: NextRequest) {
  const admin = authenticateGridAdmin(request);
  if (!admin.configured) return json({ error: 'ARIDON_GRID_ADMIN_KEY is not configured.' }, 503);
  if (!admin.ok) return json({ error: 'Valid grid admin credentials are required.' }, 401);

  try {
    const body = await request.json();
    const utilityId = safeText(body?.utilityId, 120);
    const integrationId = safeText(body?.integrationId, 120);
    const approvedBy = safeText(body?.approvedBy, 180);
    if (!utilityId || !approvedBy || body?.approved !== true) {
      return json({ error: 'utilityId, approvedBy and approved=true are required for a GIS import.' }, 409);
    }

    const requestedLimit = Math.floor(finiteNumber(body?.limit) || 250);
    const limit = Math.max(1, Math.min(500, requestedLimit));
    const requestedOffset = Math.floor(finiteNumber(body?.offset) || 0);
    const offset = Math.max(0, requestedOffset);
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

    const layerUrl = assertSafeArcGisLayerUrl(integration.feature_layer_url);
    const token = arcGisTokenFromEnv(integration.token_env_name);
    if (integration.token_env_name && !token) return json({ error: `ArcGIS token environment variable ${integration.token_env_name} is not configured.` }, 503);

    const metadata = await arcGisLayerMetadata(layerUrl, token);
    const objectIdField = validField(integration.object_id_field || metadata?.objectIdField || metadata?.objectIdFieldName, 'OBJECTID');
    const assetIdField = validField(integration.asset_id_field, 'ASSET_ID');
    const integrationMetadata = integration.metadata && typeof integration.metadata === 'object' ? integration.metadata : {};
    const assetTypeField = safeText((integrationMetadata as any).asset_type_field, 120);
    const feederField = safeText((integrationMetadata as any).feeder_field, 120);
    if (assetTypeField) validField(assetTypeField, assetTypeField);
    if (feederField) validField(feederField, feederField);

    const queryResult = await arcGisPost(layerUrl, 'query', {
      where: '1=1',
      outFields: '*',
      returnGeometry: 'true',
      outSR: '4326',
      resultOffset: String(offset),
      resultRecordCount: String(limit),
      orderByFields: objectIdField,
    }, token);

    const features = Array.isArray(queryResult?.features) ? queryResult.features : [];
    const rows: Array<Record<string, unknown>> = [];
    let skipped = 0;

    for (const feature of features) {
      const attributes = feature?.attributes && typeof feature.attributes === 'object' ? feature.attributes : {};
      const externalAssetId = safeText(attributes[assetIdField], 120) || (attributes[assetIdField] != null ? String(attributes[assetIdField]).slice(0, 120) : '');
      if (!externalAssetId) { skipped += 1; continue; }
      const sourceObjectId = attributes[objectIdField] != null ? String(attributes[objectIdField]).slice(0, 120) : null;
      const assetType = assetTypeField && attributes[assetTypeField] != null ? safeText(String(attributes[assetTypeField]), 80) : 'asset';
      const feederId = feederField && attributes[feederField] != null ? safeText(String(attributes[feederField]), 120) : null;
      const x = finiteNumber(feature?.geometry?.x);
      const y = finiteNumber(feature?.geometry?.y);

      rows.push({
        utility_id: utilityId,
        external_asset_id: externalAssetId,
        asset_type: assetType || 'asset',
        feeder_id: feederId,
        longitude: x,
        latitude: y,
        source_provider: 'arcgis',
        source_object_id: sourceObjectId,
        metadata: { arcgisAttributes: attributes, geometryType: metadata?.geometryType || null },
        updated_at: new Date().toISOString(),
      });
    }

    const approvedAt = new Date().toISOString();
    const { data: syncLog, error: syncLogError } = await supabase
      .from('grid_integration_sync')
      .insert({
        utility_id: utilityId,
        integration_id: integration.id,
        provider: 'arcgis',
        direction: 'inbound',
        object_type: 'grid_asset_batch',
        object_id: `offset:${offset}`,
        status: 'running',
        payload: { offset, limit, featureCount: features.length, objectIdField, assetIdField },
        approved_by: approvedBy,
        approved_at: approvedAt,
      })
      .select('id')
      .single();
    if (syncLogError || !syncLog) throw new Error('Unable to create ArcGIS import audit row.');

    try {
      if (rows.length) {
        const { error: upsertError } = await supabase.from('grid_assets').upsert(rows, { onConflict: 'utility_id,external_asset_id' });
        if (upsertError) throw upsertError;
      }

      const completedAt = new Date().toISOString();
      await Promise.all([
        supabase.from('grid_integration_sync').update({
          status: 'succeeded',
          response: { imported: rows.length, skipped, exceededTransferLimit: !!queryResult?.exceededTransferLimit },
          completed_at: completedAt,
        }).eq('id', syncLog.id),
        supabase.from('grid_integrations').update({ last_import_at: completedAt, updated_at: completedAt }).eq('id', integration.id),
      ]);

      return json({
        imported: rows.length,
        skipped,
        utilityId,
        integration: { id: integration.id, name: integration.name, provider: 'arcgis' },
        page: { offset, limit, sourceFeatures: features.length, exceededTransferLimit: !!queryResult?.exceededTransferLimit },
        nextOffset: queryResult?.exceededTransferLimit ? offset + features.length : null,
        auditId: syncLog.id,
      });
    } catch (importError) {
      await supabase.from('grid_integration_sync').update({
        status: 'failed',
        error_message: safeText(importError instanceof Error ? importError.message : 'ArcGIS import failed.', 1000),
        completed_at: new Date().toISOString(),
      }).eq('id', syncLog.id);
      throw importError;
    }
  } catch (error) {
    console.error('Aridon ArcGIS import error', error instanceof Error ? error.message : error);
    return json({ error: 'ArcGIS import failed.', detail: safeText(error instanceof Error ? error.message : '', 240) || undefined }, 400);
  }
}
