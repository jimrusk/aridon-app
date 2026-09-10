import { createHash } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { getServerClient } from '../../../../../../lib/supabase';

export const runtime = 'nodejs';
const NO_STORE = { 'Cache-Control': 'no-store' };
const BUCKET = 'customer-files';
const REVIEW_STATUSES = new Set(['received', 'needs_information', 'accepted', 'declined']);

function text(value: unknown, max = 1000) {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

function tokenHash(token: string) {
  return createHash('sha256').update(token).digest('hex');
}

function permissions(value: unknown) {
  const obj = value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
  return {
    record: obj.record !== false,
    boundary: obj.boundary !== false,
    documents: obj.documents === true,
    review: obj.review !== false,
  };
}

async function resolveShare(token: string) {
  const service = getServerClient();
  const { data: share, error } = await service
    .from('ag_farm_passport_shares')
    .select('id,tenant_id,passport_id,role,permissions,expires_at,revoked_at,created_at')
    .eq('token_hash', tokenHash(token))
    .maybeSingle();
  if (error) throw error;
  if (!share) return { error: 'This Farm Passport link is invalid.', status: 404 } as const;
  if (share.revoked_at) return { error: 'This Farm Passport link has been revoked.', status: 410 } as const;
  if (new Date(share.expires_at).getTime() <= Date.now()) return { error: 'This Farm Passport link has expired.', status: 410 } as const;
  return { service, share, access: permissions(share.permissions) } as const;
}

export async function GET(_request: NextRequest, { params }: { params: { token: string } }) {
  try {
    const token = decodeURIComponent(params.token || '').trim();
    if (!token) return NextResponse.json({ error: 'Share token is required.' }, { status: 400, headers: NO_STORE });
    const resolved = await resolveShare(token);
    if ('error' in resolved) return NextResponse.json({ error: resolved.error }, { status: resolved.status, headers: NO_STORE });

    const { service, share, access } = resolved;
    const { data: passport, error: passportError } = await service
      .from('ag_farm_passports')
      .select('id,producer,farm_name,field_id,crop,harvest_year,record_data,boundary_geojson,readiness,status,updated_at')
      .eq('id', share.passport_id)
      .eq('tenant_id', share.tenant_id)
      .maybeSingle();
    if (passportError) throw passportError;
    if (!passport) return NextResponse.json({ error: 'The shared Farm Passport is no longer available.' }, { status: 404, headers: NO_STORE });

    const documents: Array<Record<string, unknown>> = [];
    if (access.documents) {
      const { data: links, error: linkError } = await service
        .from('ag_farm_passport_files')
        .select('customer_file_id,evidence_type,label')
        .eq('tenant_id', share.tenant_id)
        .eq('passport_id', share.passport_id)
        .eq('shared', true);
      if (linkError) throw linkError;
      const ids = (links || []).map((item) => item.customer_file_id).filter(Boolean);
      if (ids.length) {
        const { data: files, error: fileError } = await service
          .from('customer_files')
          .select('id,filename,mime_type,size_bytes,storage_path,status,created_at')
          .eq('tenant_id', share.tenant_id)
          .in('id', ids)
          .eq('status', 'ready');
        if (fileError) throw fileError;
        const linkById = new Map((links || []).map((item) => [String(item.customer_file_id), item]));
        for (const file of files || []) {
          const { data: signed } = await service.storage.from(BUCKET).createSignedUrl(file.storage_path, 300, { download: true });
          const link = linkById.get(String(file.id));
          documents.push({
            id: file.id,
            filename: file.filename,
            mime_type: file.mime_type,
            size_bytes: file.size_bytes,
            evidence_type: link?.evidence_type || 'supporting_document',
            label: link?.label || null,
            url: signed?.signedUrl || null,
          });
        }
      }
    }

    await service.from('ag_farm_passport_shares').update({ last_accessed_at: new Date().toISOString() }).eq('id', share.id);
    return NextResponse.json({
      share: { role: share.role, expires_at: share.expires_at, permissions: access },
      passport: {
        id: passport.id,
        producer: passport.producer,
        farm_name: passport.farm_name,
        field_id: passport.field_id,
        crop: passport.crop,
        harvest_year: passport.harvest_year,
        record_data: access.record ? passport.record_data : null,
        boundary_geojson: access.boundary ? passport.boundary_geojson : null,
        readiness: passport.readiness,
        status: passport.status,
        updated_at: passport.updated_at,
      },
      documents,
    }, { headers: NO_STORE });
  } catch (error) {
    console.error('Farm Passport share GET error', error);
    return NextResponse.json({ error: 'Unable to open this Farm Passport share.' }, { status: 500, headers: NO_STORE });
  }
}

export async function POST(request: NextRequest, { params }: { params: { token: string } }) {
  try {
    const token = decodeURIComponent(params.token || '').trim();
    const resolved = await resolveShare(token);
    if ('error' in resolved) return NextResponse.json({ error: resolved.error }, { status: resolved.status, headers: NO_STORE });
    if (!resolved.access.review) return NextResponse.json({ error: 'Review feedback is disabled for this link.' }, { status: 403, headers: NO_STORE });

    const body = await request.json();
    const requested = Array.isArray(body?.requestedItems)
      ? body.requestedItems.map((item: unknown) => text(item, 180)).filter(Boolean).slice(0, 20)
      : [];
    const requestedStatus = text(body?.reviewStatus, 40);
    const reviewStatus = REVIEW_STATUSES.has(requestedStatus) ? requestedStatus : 'received';
    const { service, share } = resolved;
    const { data, error } = await service.from('ag_farm_passport_reviews').insert({
      tenant_id: share.tenant_id,
      passport_id: share.passport_id,
      share_id: share.id,
      reviewer_name: text(body?.reviewerName, 160) || null,
      organization: text(body?.organization, 180) || null,
      review_status: reviewStatus,
      notes: text(body?.notes, 4000) || null,
      requested_items: requested,
    }).select('id,review_status,created_at').single();
    if (error) throw error;
    return NextResponse.json({ received: true, review: data }, { headers: NO_STORE });
  } catch (error) {
    console.error('Farm Passport share POST error', error);
    return NextResponse.json({ error: 'Unable to submit reviewer feedback.' }, { status: 500, headers: NO_STORE });
  }
}
