import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { authenticatedCustomer, customerTenantForUser, subscriptionAllowsAccess } from '../../../../../lib/customerAuth';
import { getServerClient } from '../../../../../lib/supabase';

export const runtime = 'nodejs';
export const maxDuration = 60;

const NO_STORE = { 'Cache-Control': 'no-store' };
const BUCKET = 'customer-files';
const MAX_FILE_BYTES = 25 * 1024 * 1024;
const SHARE_ROLES = new Set(['buyer', 'verifier', 'auditor']);
const PASSPORT_STATUSES = new Set(['draft', 'review_ready', 'submitted', 'archived']);

function text(value: unknown, max = 240) {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

function safeFilename(value: string) {
  const cleaned = value.replace(/[^a-zA-Z0-9._-]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
  return (cleaned || 'farm-evidence').slice(-140);
}

function plainObject(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function tokenHash(token: string) {
  return createHash('sha256').update(token).digest('hex');
}

async function resolveMembership(request: NextRequest, slug: string) {
  const auth = await authenticatedCustomer(request);
  if (!auth.ok) return { error: auth.error, status: auth.status } as const;
  const membership = await customerTenantForUser(auth.user.id, slug);
  if (!membership) return { error: 'You do not have access to this workspace.', status: 403 } as const;
  if (!subscriptionAllowsAccess(membership.tenant.subscription_status)) {
    return { error: 'This workspace is not active.', status: 402 } as const;
  }
  return { auth, membership, service: getServerClient() } as const;
}

async function passportOwnedByTenant(service: ReturnType<typeof getServerClient>, tenantId: string, passportId: string) {
  const { data, error } = await service
    .from('ag_farm_passports')
    .select('id')
    .eq('id', passportId)
    .eq('tenant_id', tenantId)
    .maybeSingle();
  if (error) throw error;
  return Boolean(data?.id);
}

async function loadBundle(service: ReturnType<typeof getServerClient>, tenantId: string, passportId?: string) {
  const { data: passports, error: listError } = await service
    .from('ag_farm_passports')
    .select('id,producer,farm_name,field_id,crop,harvest_year,status,readiness,updated_at,created_at')
    .eq('tenant_id', tenantId)
    .order('updated_at', { ascending: false })
    .limit(100);
  if (listError) throw listError;

  const selectedId = passportId || passports?.[0]?.id || '';
  if (!selectedId) return { passports: passports || [], passport: null, files: [], shares: [], reviews: [] };

  const { data: passport, error: passportError } = await service
    .from('ag_farm_passports')
    .select('id,producer,farm_name,field_id,state,county,crop,harvest_year,record_data,boundary_geojson,readiness,status,created_at,updated_at')
    .eq('tenant_id', tenantId)
    .eq('id', selectedId)
    .maybeSingle();
  if (passportError) throw passportError;
  if (!passport) return { passports: passports || [], passport: null, files: [], shares: [], reviews: [] };

  const [{ data: links, error: linkError }, { data: shares, error: shareError }, { data: reviews, error: reviewError }] = await Promise.all([
    service.from('ag_farm_passport_files').select('id,customer_file_id,evidence_type,label,shared,created_at').eq('tenant_id', tenantId).eq('passport_id', selectedId).order('created_at', { ascending: false }),
    service.from('ag_farm_passport_shares').select('id,role,permissions,expires_at,revoked_at,created_at,last_accessed_at').eq('tenant_id', tenantId).eq('passport_id', selectedId).order('created_at', { ascending: false }),
    service.from('ag_farm_passport_reviews').select('id,share_id,reviewer_name,organization,review_status,notes,requested_items,created_at').eq('tenant_id', tenantId).eq('passport_id', selectedId).order('created_at', { ascending: false }),
  ]);
  if (linkError) throw linkError;
  if (shareError) throw shareError;
  if (reviewError) throw reviewError;

  const fileIds = (links || []).map((item) => item.customer_file_id).filter(Boolean);
  let fileRows: Array<Record<string, unknown>> = [];
  if (fileIds.length) {
    const { data, error } = await service
      .from('customer_files')
      .select('id,filename,mime_type,size_bytes,status,created_at')
      .eq('tenant_id', tenantId)
      .in('id', fileIds);
    if (error) throw error;
    fileRows = (data || []) as Array<Record<string, unknown>>;
  }
  const byId = new Map(fileRows.map((row) => [String(row.id), row]));
  const files = (links || []).map((link) => ({ ...link, file: byId.get(String(link.customer_file_id)) || null }));

  return { passports: passports || [], passport, files, shares: shares || [], reviews: reviews || [] };
}

export async function GET(request: NextRequest) {
  try {
    const slug = text(request.nextUrl.searchParams.get('slug'), 80);
    const passportId = text(request.nextUrl.searchParams.get('passportId'), 80);
    if (!slug) return NextResponse.json({ error: 'Workspace is required.' }, { status: 400, headers: NO_STORE });
    const resolved = await resolveMembership(request, slug);
    if ('error' in resolved) return NextResponse.json({ error: resolved.error }, { status: resolved.status, headers: NO_STORE });
    const bundle = await loadBundle(resolved.service, resolved.membership.tenant.id, passportId || undefined);
    return NextResponse.json(bundle, { headers: NO_STORE });
  } catch (error) {
    console.error('Farm Passport GET error', error);
    return NextResponse.json({ error: 'Unable to load secure Farm Passport records.' }, { status: 500, headers: NO_STORE });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const slug = text(body?.slug, 80);
    const action = text(body?.action, 60);
    if (!slug) return NextResponse.json({ error: 'Workspace is required.' }, { status: 400, headers: NO_STORE });
    const resolved = await resolveMembership(request, slug);
    if ('error' in resolved) return NextResponse.json({ error: resolved.error }, { status: resolved.status, headers: NO_STORE });

    const tenantId = resolved.membership.tenant.id;
    const service = resolved.service;

    if (action === 'save') {
      const record = plainObject(body?.record);
      const readiness = plainObject(body?.readiness);
      const boundaryGeojson = body?.boundaryGeojson && typeof body.boundaryGeojson === 'object' ? body.boundaryGeojson : null;
      const passportId = text(body?.passportId, 80);
      const status = PASSPORT_STATUSES.has(text(body?.status, 40)) ? text(body?.status, 40) : 'draft';
      const harvestYearRaw = Number(record.harvestYear || 0);
      const harvestYear = Number.isFinite(harvestYearRaw) && harvestYearRaw > 1900 && harvestYearRaw < 2200 ? Math.round(harvestYearRaw) : null;
      const countyState = text(record.countyState, 220);
      const payload = {
        tenant_id: tenantId,
        producer: text(record.producer, 180) || null,
        farm_name: text(record.farm, 180) || null,
        field_id: text(record.fieldId, 120) || null,
        state: null,
        county: countyState || null,
        crop: text(record.crop, 120) || null,
        harvest_year: harvestYear,
        record_data: record,
        boundary_geojson: boundaryGeojson,
        readiness,
        status,
        updated_at: new Date().toISOString(),
      };

      let savedId = passportId;
      if (passportId) {
        const { data, error } = await service
          .from('ag_farm_passports')
          .update(payload)
          .eq('tenant_id', tenantId)
          .eq('id', passportId)
          .select('id')
          .maybeSingle();
        if (error) throw error;
        if (!data?.id) return NextResponse.json({ error: 'Farm Passport record not found.' }, { status: 404, headers: NO_STORE });
      } else {
        const { data, error } = await service
          .from('ag_farm_passports')
          .insert({ ...payload, owner_user_id: resolved.auth.user.id })
          .select('id')
          .single();
        if (error) throw error;
        savedId = data.id;
      }

      await service.from('customer_usage_events').insert({
        tenant_id: tenantId,
        user_id: resolved.auth.user.id,
        event_name: 'ag_farm_passport_saved',
        event_data: { passport_id: savedId, field_id: text(record.fieldId, 120), status },
      });
      const bundle = await loadBundle(service, tenantId, savedId);
      return NextResponse.json({ ...bundle, saved: true }, { headers: NO_STORE });
    }

    if (action === 'prepare_evidence_upload') {
      const passportId = text(body?.passportId, 80);
      const filename = text(body?.filename, 220);
      const mimeType = text(body?.mimeType, 160) || 'application/octet-stream';
      const sizeBytes = Number(body?.sizeBytes || 0);
      if (!passportId || !filename || !Number.isFinite(sizeBytes) || sizeBytes <= 0) {
        return NextResponse.json({ error: 'A saved Farm Passport and valid file are required.' }, { status: 400, headers: NO_STORE });
      }
      if (sizeBytes > MAX_FILE_BYTES) return NextResponse.json({ error: 'Evidence files are limited to 25 MB.' }, { status: 413, headers: NO_STORE });
      if (!(await passportOwnedByTenant(service, tenantId, passportId))) {
        return NextResponse.json({ error: 'Farm Passport record not found.' }, { status: 404, headers: NO_STORE });
      }

      const storagePath = `${tenantId}/farm-passport/${passportId}/${randomUUID()}-${safeFilename(filename)}`;
      const { data: fileRow, error: fileError } = await service.from('customer_files').insert({
        tenant_id: tenantId,
        uploaded_by: resolved.auth.user.id,
        filename,
        storage_path: storagePath,
        mime_type: mimeType,
        size_bytes: sizeBytes,
        status: 'uploading',
        extraction_status: 'not_needed',
        notes: 'Farm Passport evidence',
      }).select('id').single();
      if (fileError) throw fileError;

      const { data: signed, error: signedError } = await service.storage.from(BUCKET).createSignedUploadUrl(storagePath);
      if (signedError || !signed?.token) {
        await service.from('customer_files').delete().eq('id', fileRow.id).eq('tenant_id', tenantId);
        throw signedError || new Error('Unable to prepare the private evidence upload.');
      }
      return NextResponse.json({ fileId: fileRow.id, path: storagePath, token: signed.token }, { headers: NO_STORE });
    }

    if (action === 'complete_evidence_upload') {
      const passportId = text(body?.passportId, 80);
      const fileId = text(body?.fileId, 80);
      const evidenceType = text(body?.evidenceType, 80) || 'supporting_document';
      const label = text(body?.label, 180) || null;
      if (!passportId || !fileId) return NextResponse.json({ error: 'Passport and file are required.' }, { status: 400, headers: NO_STORE });
      if (!(await passportOwnedByTenant(service, tenantId, passportId))) return NextResponse.json({ error: 'Farm Passport record not found.' }, { status: 404, headers: NO_STORE });
      const { data: file, error: fileError } = await service.from('customer_files').select('id,status').eq('id', fileId).eq('tenant_id', tenantId).maybeSingle();
      if (fileError) throw fileError;
      if (!file) return NextResponse.json({ error: 'Evidence file not found.' }, { status: 404, headers: NO_STORE });
      await service.from('customer_files').update({ status: 'ready', updated_at: new Date().toISOString() }).eq('id', fileId).eq('tenant_id', tenantId);
      const { error: linkError } = await service.from('ag_farm_passport_files').upsert({
        tenant_id: tenantId,
        passport_id: passportId,
        customer_file_id: fileId,
        evidence_type: evidenceType,
        label,
        shared: true,
      }, { onConflict: 'passport_id,customer_file_id' });
      if (linkError) throw linkError;
      const bundle = await loadBundle(service, tenantId, passportId);
      return NextResponse.json({ ...bundle, uploaded: true }, { headers: NO_STORE });
    }

    if (action === 'download_evidence') {
      const passportId = text(body?.passportId, 80);
      const fileId = text(body?.fileId, 80);
      const { data: link, error: linkError } = await service.from('ag_farm_passport_files').select('customer_file_id').eq('tenant_id', tenantId).eq('passport_id', passportId).eq('customer_file_id', fileId).maybeSingle();
      if (linkError) throw linkError;
      if (!link) return NextResponse.json({ error: 'Evidence file is not linked to this passport.' }, { status: 404, headers: NO_STORE });
      const { data: file, error: fileError } = await service.from('customer_files').select('storage_path').eq('tenant_id', tenantId).eq('id', fileId).maybeSingle();
      if (fileError) throw fileError;
      if (!file) return NextResponse.json({ error: 'Evidence file not found.' }, { status: 404, headers: NO_STORE });
      const { data: signed, error: signedError } = await service.storage.from(BUCKET).createSignedUrl(file.storage_path, 300, { download: true });
      if (signedError || !signed?.signedUrl) throw signedError || new Error('Unable to create a private download link.');
      return NextResponse.json({ url: signed.signedUrl }, { headers: NO_STORE });
    }

    if (action === 'unlink_evidence') {
      const passportId = text(body?.passportId, 80);
      const fileId = text(body?.fileId, 80);
      const { error } = await service.from('ag_farm_passport_files').delete().eq('tenant_id', tenantId).eq('passport_id', passportId).eq('customer_file_id', fileId);
      if (error) throw error;
      const bundle = await loadBundle(service, tenantId, passportId);
      return NextResponse.json({ ...bundle, unlinked: true }, { headers: NO_STORE });
    }

    if (action === 'create_share') {
      const passportId = text(body?.passportId, 80);
      const role = text(body?.role, 30);
      if (!passportId || !SHARE_ROLES.has(role)) return NextResponse.json({ error: 'Choose a saved passport and a valid reviewer role.' }, { status: 400, headers: NO_STORE });
      if (!(await passportOwnedByTenant(service, tenantId, passportId))) return NextResponse.json({ error: 'Farm Passport record not found.' }, { status: 404, headers: NO_STORE });
      const requestedHours = Number(body?.hours || 168);
      const hours = Math.max(1, Math.min(720, Number.isFinite(requestedHours) ? Math.round(requestedHours) : 168));
      const rawToken = randomBytes(32).toString('base64url');
      const permissions = { record: true, boundary: true, documents: body?.documents === true, review: true };
      const expiresAt = new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();
      const { data: share, error } = await service.from('ag_farm_passport_shares').insert({
        tenant_id: tenantId,
        passport_id: passportId,
        role,
        token_hash: tokenHash(rawToken),
        permissions,
        expires_at: expiresAt,
        created_by: resolved.auth.user.id,
      }).select('id,role,permissions,expires_at,created_at').single();
      if (error) throw error;
      const shareUrl = `${request.nextUrl.origin}/ag/farm-passport/share/${encodeURIComponent(rawToken)}`;
      return NextResponse.json({ share, shareUrl }, { headers: NO_STORE });
    }

    if (action === 'revoke_share') {
      const passportId = text(body?.passportId, 80);
      const shareId = text(body?.shareId, 80);
      const { error } = await service.from('ag_farm_passport_shares').update({ revoked_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('passport_id', passportId).eq('id', shareId);
      if (error) throw error;
      const bundle = await loadBundle(service, tenantId, passportId);
      return NextResponse.json({ ...bundle, revoked: true }, { headers: NO_STORE });
    }

    return NextResponse.json({ error: 'Unknown Farm Passport action.' }, { status: 400, headers: NO_STORE });
  } catch (error) {
    console.error('Farm Passport POST error', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to process Farm Passport action.' }, { status: 500, headers: NO_STORE });
  }
}
