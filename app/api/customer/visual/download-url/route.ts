import { NextRequest, NextResponse } from 'next/server';
import { authenticatedCustomer, customerTenantForUser, subscriptionAllowsAccess } from '../../../../../lib/customerAuth';

export const runtime = 'nodejs';
const NO_STORE = { 'Cache-Control': 'no-store' };

function text(value: unknown, max: number) {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

async function resolveMembership(request: NextRequest, slug: string) {
  const auth = await authenticatedCustomer(request);
  if (!auth.ok) return { error: auth.error, status: auth.status } as const;
  const membership = await customerTenantForUser(auth.user.id, slug);
  if (!membership) return { error: 'You do not have access to this workspace.', status: 403 } as const;
  if (!subscriptionAllowsAccess(membership.tenant.subscription_status)) return { error: 'This workspace is not active.', status: 402 } as const;
  return { auth, membership } as const;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const slug = text(body?.slug, 80);
    const assetId = text(body?.assetId, 80);
    if (!slug || !assetId) return NextResponse.json({ error: 'Workspace and approved asset are required.' }, { status: 400, headers: NO_STORE });
    const resolved = await resolveMembership(request, slug);
    if ('error' in resolved) return NextResponse.json({ error: resolved.error }, { status: resolved.status, headers: NO_STORE });
    const db = resolved.auth.db;
    const tenantId = resolved.membership.tenant.id;

    const { data: asset, error } = await db.from('customer_visual_assets').select('id,visual_project_id,asset_kind,storage_bucket,storage_path,mime_type,status').eq('id', assetId).eq('tenant_id', tenantId).maybeSingle();
    if (error) throw error;
    if (!asset) return NextResponse.json({ error: 'Visual asset not found.' }, { status: 404, headers: NO_STORE });
    if (asset.status !== 'approved') return NextResponse.json({ error: 'Approve the asset before downloading the final version.' }, { status: 409, headers: NO_STORE });
    if (!asset.storage_bucket || !asset.storage_path) return NextResponse.json({ error: 'The approved asset has not finished rendering yet.' }, { status: 409, headers: NO_STORE });

    const { data, error: signedError } = await db.storage.from(asset.storage_bucket).createSignedUrl(asset.storage_path, 60 * 10, { download: true });
    if (signedError) throw signedError;
    await db.from('customer_visual_reviews').insert({ tenant_id: tenantId, visual_project_id: asset.visual_project_id, asset_id: asset.id, user_id: resolved.auth.user.id, action: 'download', notes: 'Approved final asset download requested.' });
    return NextResponse.json({ url: data?.signedUrl || null, mimeType: asset.mime_type, assetKind: asset.asset_kind }, { headers: NO_STORE });
  } catch (error) {
    console.error('Visual Studio download URL error', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to prepare the approved asset download.' }, { status: 500, headers: NO_STORE });
  }
}
