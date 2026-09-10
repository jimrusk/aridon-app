import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'crypto';
import { getServerClient } from '../../../../../../lib/supabase';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const NO_STORE = { 'Cache-Control': 'no-store' };
const BUCKET = 'customer-files';
const ALLOWED_REVIEW_STATUS = new Set(['received','needs_information','accepted','declined']);

function clean(value: unknown, max = 1000) {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}
function hashToken(token: string) { return createHash('sha256').update(token).digest('hex'); }

async function resolveShare(token: string) {
  if (!token || token.length < 20) return null;
  const service = getServerClient();
  const { data: share, error } = await service
    .from('ag_farm_passport_shares')
    .select('*')
    .eq('token_hash', hashToken(token))
    .is('revoked_at', null)
    .maybeSingle();
  if (error) throw error;
  if (!share || new Date(share.expires_at).getTime() <= Date.now()) return null;
  const { data: passport, error: passportError } = await service
    .from('ag_farm_passports')
    .select('*')
    .eq('id', share.passport_id)
    .eq('tenant_id', share.tenant_id)
    .maybeSingle();
  if (passportError) throw passportError;
  if (!passport) return null;
  return { service, share, passport };
}

export async function GET(_request: NextRequest, { params }: { params: { token: string } }) {
  try {
    const resolved = await resolveShare(params.token);
    if (!resolved) return NextResponse.json({ error:'This review link is invalid, expired, or revoked.' }, { status:404, headers:NO_STORE });
    const { service, share, passport } = resolved;
    const permissions = share.permissions || {};
    let documents: Array<Record<string, unknown>> = [];

    if (permissions.documents) {
      const { data: links, error } = await service
        .from('ag_farm_passport_files')
        .select('id,evidence_type,label,shared,customer_files(id,filename,mime_type,size_bytes,status,storage_path)')
        .eq('tenant_id', share.tenant_id)
        .eq('passport_id', passport.id)
        .eq('shared', true);
      if (error) throw error;
      documents = await Promise.all((links || []).map(async (link: any) => {
        const file = link.customer_files;
        let url: string | null = null;
        if (file?.storage_path && file.status === 'ready') {
          const { data } = await service.storage.from(BUCKET).createSignedUrl(file.storage_path, 600);
          url = data?.signedUrl || null;
        }
        return { id:link.id, evidenceType:link.evidence_type, label:link.label, filename:file?.filename, mimeType:file?.mime_type, sizeBytes:file?.size_bytes, url };
      }));
    }

    await service.from('ag_farm_passport_shares').update({ last_accessed_at:new Date().toISOString() }).eq('id', share.id);
    return NextResponse.json({
      role:share.role,
      permissions,
      expiresAt:share.expires_at,
      passport:{
        id:passport.id,
        producer:passport.producer,
        farmName:passport.farm_name,
        fieldId:passport.field_id,
        state:passport.state,
        county:passport.county,
        crop:passport.crop,
        harvestYear:passport.harvest_year,
        readiness:passport.readiness,
        status:passport.status,
        recordData:permissions.record ? passport.record_data : null,
        boundaryGeoJson:permissions.boundary ? passport.boundary_geojson : null,
      },
      documents,
    }, { headers:NO_STORE });
  } catch (error) {
    console.error('Farm Passport review GET error', error);
    return NextResponse.json({ error:'Unable to open this Farm Passport review.' }, { status:500, headers:NO_STORE });
  }
}

export async function POST(request: NextRequest, { params }: { params: { token: string } }) {
  try {
    const resolved = await resolveShare(params.token);
    if (!resolved) return NextResponse.json({ error:'This review link is invalid, expired, or revoked.' }, { status:404, headers:NO_STORE });
    const { service, share, passport } = resolved;
    if (!share.permissions?.review) return NextResponse.json({ error:'This link is view-only.' }, { status:403, headers:NO_STORE });
    const body = await request.json().catch(() => ({}));
    const reviewStatus = clean(body?.reviewStatus, 40).toLowerCase();
    if (!ALLOWED_REVIEW_STATUS.has(reviewStatus)) return NextResponse.json({ error:'Choose a valid review status.' }, { status:400, headers:NO_STORE });
    const requestedItems = Array.isArray(body?.requestedItems) ? body.requestedItems.map((item: unknown) => clean(item, 240)).filter(Boolean).slice(0, 20) : [];
    const { data, error } = await service.from('ag_farm_passport_reviews').insert({
      tenant_id:share.tenant_id,
      passport_id:passport.id,
      share_id:share.id,
      reviewer_name:clean(body?.reviewerName, 160) || null,
      organization:clean(body?.organization, 180) || null,
      review_status:reviewStatus,
      notes:clean(body?.notes, 5000) || null,
      requested_items:requestedItems,
    }).select('id,review_status,created_at').single();
    if (error) throw error;
    await service.from('ag_farm_passport_shares').update({ last_accessed_at:new Date().toISOString() }).eq('id', share.id);
    return NextResponse.json({ review:data }, { status:201, headers:NO_STORE });
  } catch (error) {
    console.error('Farm Passport review POST error', error);
    return NextResponse.json({ error:'Unable to submit this review.' }, { status:500, headers:NO_STORE });
  }
}
