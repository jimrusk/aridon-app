import { randomBytes } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { getServerClient } from '@/lib/supabase';
import { authenticateGridAdmin, safeText, sha256 } from '@/lib/gridIntelligence';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const NO_STORE = { 'cache-control': 'no-store' };
const ALLOWED_SCOPES = new Set(['ingest', 'twin:read', '*']);

function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status, headers: NO_STORE });
}

function authorize(request: NextRequest) {
  const admin = authenticateGridAdmin(request);
  if (!admin.configured) return { response: json({ error: 'ARIDON_GRID_ADMIN_KEY is not configured.' }, 503), ok: false };
  if (!admin.ok) return { response: json({ error: 'Valid grid admin credentials are required.' }, 401), ok: false };
  return { response: null, ok: true };
}

export async function GET(request: NextRequest) {
  const auth = authorize(request);
  if (!auth.ok) return auth.response!;
  const utilityId = safeText(new URL(request.url).searchParams.get('utilityId'), 120);
  if (!utilityId) return json({ error: 'utilityId is required.' }, 400);

  const { data, error } = await getServerClient()
    .from('grid_gateway_clients')
    .select('id, utility_id, name, active, scopes, last_seen_at, metadata, created_at, updated_at')
    .eq('utility_id', utilityId)
    .order('created_at', { ascending: false });
  if (error) return json({ error: 'Unable to list gateway clients.' }, 500);
  return json({ clients: data || [] });
}

export async function POST(request: NextRequest) {
  const auth = authorize(request);
  if (!auth.ok) return auth.response!;

  try {
    const body = await request.json();
    const utilityId = safeText(body?.utilityId, 120);
    const name = safeText(body?.name, 160);
    if (!utilityId || !name) return json({ error: 'utilityId and name are required.' }, 400);

    const requestedScopes = Array.isArray(body?.scopes) ? body.scopes.map((scope: unknown) => safeText(scope, 40)).filter(Boolean) : ['ingest', 'twin:read'];
    const scopes = [...new Set(requestedScopes.filter((scope: string) => ALLOWED_SCOPES.has(scope)))];
    if (!scopes.length) return json({ error: 'At least one valid scope is required.' }, 400);

    const rawKey = `grid_${randomBytes(32).toString('base64url')}`;
    const supabase = getServerClient();
    const { data, error } = await supabase
      .from('grid_gateway_clients')
      .insert({
        utility_id: utilityId,
        name,
        key_sha256: sha256(rawKey),
        active: true,
        scopes,
        metadata: body?.metadata && typeof body.metadata === 'object' && !Array.isArray(body.metadata) ? body.metadata : {},
      })
      .select('id, utility_id, name, active, scopes, created_at')
      .single();
    if (error || !data) throw error || new Error('Gateway client creation failed.');

    return json({
      client: data,
      secret: rawKey,
      secretShownOnce: true,
      header: 'x-aridon-grid-key',
      warning: 'Store this gateway secret in the drone/edge gateway secret manager now. Aridon stores only its SHA-256 hash and cannot recover the raw key later.',
    }, 201);
  } catch (error) {
    console.error('Aridon gateway client creation error', error instanceof Error ? error.message : error);
    return json({ error: 'Unable to create grid gateway credentials.' }, 400);
  }
}

export async function PATCH(request: NextRequest) {
  const auth = authorize(request);
  if (!auth.ok) return auth.response!;

  try {
    const body = await request.json();
    const clientId = safeText(body?.clientId, 120);
    if (!clientId || typeof body?.active !== 'boolean') return json({ error: 'clientId and active boolean are required.' }, 400);

    const { data, error } = await getServerClient()
      .from('grid_gateway_clients')
      .update({ active: body.active, updated_at: new Date().toISOString() })
      .eq('id', clientId)
      .select('id, utility_id, name, active, scopes, last_seen_at, updated_at')
      .maybeSingle();
    if (error) throw error;
    if (!data) return json({ error: 'Gateway client not found.' }, 404);
    return json({ client: data });
  } catch (error) {
    console.error('Aridon gateway client update error', error instanceof Error ? error.message : error);
    return json({ error: 'Unable to update grid gateway credentials.' }, 400);
  }
}
