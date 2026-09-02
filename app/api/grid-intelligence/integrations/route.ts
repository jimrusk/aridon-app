import { NextRequest, NextResponse } from 'next/server';
import { getServerClient } from '@/lib/supabase';
import { assertSafeArcGisLayerUrl, authenticateGridAdmin, safeText } from '@/lib/gridIntelligence';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const NO_STORE = { 'cache-control': 'no-store' };

function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status, headers: NO_STORE });
}

function authResponse(request: NextRequest): NextResponse | null {
  const admin = authenticateGridAdmin(request);
  if (!admin.configured) return json({ error: 'ARIDON_GRID_ADMIN_KEY is not configured.' }, 503);
  if (!admin.ok) return json({ error: 'Valid grid admin credentials are required.' }, 401);
  return null;
}

function field(value: unknown, fallback: string): string {
  const result = safeText(value, 120) || fallback;
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(result)) throw new Error(`Invalid ArcGIS field name: ${result}`);
  return result;
}

export async function GET(request: NextRequest) {
  const denied = authResponse(request);
  if (denied) return denied;
  const utilityId = safeText(new URL(request.url).searchParams.get('utilityId'), 120);
  if (!utilityId) return json({ error: 'utilityId is required.' }, 400);

  const { data, error } = await getServerClient()
    .from('grid_integrations')
    .select('id, utility_id, provider, name, feature_layer_url, asset_id_field, object_id_field, token_env_name, field_mapping, enabled, last_import_at, last_sync_at, metadata, created_at, updated_at')
    .eq('utility_id', utilityId)
    .order('created_at', { ascending: false });
  if (error) return json({ error: 'Unable to list grid integrations.' }, 500);
  return json({ integrations: data || [] });
}

export async function POST(request: NextRequest) {
  const denied = authResponse(request);
  if (denied) return denied;

  try {
    const body = await request.json();
    const utilityId = safeText(body?.utilityId, 120);
    const name = safeText(body?.name, 180);
    if (!utilityId || !name) return json({ error: 'utilityId and name are required.' }, 400);

    const layerUrl = assertSafeArcGisLayerUrl(body?.featureLayerUrl);
    const assetIdField = field(body?.assetIdField, 'ASSET_ID');
    const objectIdField = safeText(body?.objectIdField, 120) ? field(body?.objectIdField, 'OBJECTID') : null;
    const tokenEnvName = safeText(body?.tokenEnvName, 100) || null;
    if (tokenEnvName && !/^ARIDON_ARCGIS_[A-Z0-9_]+$/.test(tokenEnvName)) {
      return json({ error: 'tokenEnvName must begin with ARIDON_ARCGIS_ and contain only uppercase letters, numbers and underscores.' }, 400);
    }

    const incomingMapping = body?.fieldMapping && typeof body.fieldMapping === 'object' && !Array.isArray(body.fieldMapping) ? body.fieldMapping : {};
    const fieldMapping = {
      risk_score: field((incomingMapping as any).risk_score, 'ARIDON_RISK_SCORE'),
      severity: field((incomingMapping as any).severity, 'ARIDON_SEVERITY'),
      finding: field((incomingMapping as any).finding, 'ARIDON_FINDING'),
      action: field((incomingMapping as any).action, 'ARIDON_ACTION'),
      inspected_at: field((incomingMapping as any).inspected_at, 'ARIDON_INSPECTED_AT'),
      review_status: field((incomingMapping as any).review_status, 'ARIDON_REVIEW_STATUS'),
    };

    const metadata = body?.metadata && typeof body.metadata === 'object' && !Array.isArray(body.metadata) ? body.metadata : {};
    if ((metadata as any).asset_type_field) field((metadata as any).asset_type_field, 'ASSET_TYPE');
    if ((metadata as any).feeder_field) field((metadata as any).feeder_field, 'FEEDER_ID');

    const supabase = getServerClient();
    const { data, error } = await supabase
      .from('grid_integrations')
      .upsert({
        utility_id: utilityId,
        provider: 'arcgis',
        name,
        feature_layer_url: layerUrl,
        asset_id_field: assetIdField,
        object_id_field: objectIdField,
        token_env_name: tokenEnvName,
        field_mapping: fieldMapping,
        enabled: body?.enabled === true,
        metadata,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'utility_id,provider,feature_layer_url' })
      .select('id, utility_id, provider, name, feature_layer_url, asset_id_field, object_id_field, token_env_name, field_mapping, enabled, last_import_at, last_sync_at, metadata, created_at, updated_at')
      .single();
    if (error || !data) throw error || new Error('Integration configuration failed.');

    return json({
      integration: data,
      credentialsStored: false,
      note: tokenEnvName ? `The ArcGIS token must be supplied server-side through ${tokenEnvName}.` : 'This integration is configured for a public/no-token ArcGIS layer.',
    }, 201);
  } catch (error) {
    console.error('Aridon grid integration configuration error', error instanceof Error ? error.message : error);
    return json({ error: 'Unable to configure the grid integration.', detail: safeText(error instanceof Error ? error.message : '', 240) || undefined }, 400);
  }
}

export async function PATCH(request: NextRequest) {
  const denied = authResponse(request);
  if (denied) return denied;
  try {
    const body = await request.json();
    const integrationId = safeText(body?.integrationId, 120);
    if (!integrationId || typeof body?.enabled !== 'boolean') return json({ error: 'integrationId and enabled boolean are required.' }, 400);
    const { data, error } = await getServerClient()
      .from('grid_integrations')
      .update({ enabled: body.enabled, updated_at: new Date().toISOString() })
      .eq('id', integrationId)
      .select('id, utility_id, provider, name, feature_layer_url, enabled, last_import_at, last_sync_at, updated_at')
      .maybeSingle();
    if (error) throw error;
    if (!data) return json({ error: 'Integration not found.' }, 404);
    return json({ integration: data });
  } catch (error) {
    console.error('Aridon grid integration update error', error instanceof Error ? error.message : error);
    return json({ error: 'Unable to update the grid integration.' }, 400);
  }
}
