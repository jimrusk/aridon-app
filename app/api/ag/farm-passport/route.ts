import { NextRequest, NextResponse } from 'next/server';
import { createHash, randomBytes, randomUUID } from 'crypto';
import { authenticatedCustomer, customerTenantForUser, subscriptionAllowsAccess } from '../../../../lib/customerAuth';
import { getServerClient } from '../../../../lib/supabase';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const NO_STORE = { 'Cache-Control': 'no-store' };
const BUCKET = 'customer-files';
const MAX_FILE_BYTES = 25 * 1024 * 1024;
const ALLOWED_ROLES = new Set(['buyer', 'verifier', 'auditor']);
const ALLOWED_STATUS = new Set(['draft', 'review_ready', 'submitted', 'archived']);
const PACKAGE_TYPES = new Set(['45Z', 'ISCC', 'CARB']);

function txt(value: unknown, max = 240) {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

function safeFilename(value: string) {
  const cleaned = value.replace(/[^a-zA-Z0-9._-]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
  return (cleaned || 'farm-evidence').slice(-140);
}

function tokenHash(token: string) {
  return createHash('sha256').update(token).digest('hex');
}

async function resolveMembership(request: NextRequest, slug: string) {
  const auth = await authenticatedCustomer(request);
  if (!auth.ok) return { error: auth.error, status: auth.status } as const;
  const membership = await customerTenantForUser(auth.user.id, slug, auth.token);
  if (!membership) return { error: 'You do not have access to this workspace.', status: 403 } as const;
  if (!subscriptionAllowsAccess(membership.tenant.subscription_status)) return { error: 'This workspace is not active.', status: 402 } as const;
  return { auth, membership, service: getServerClient() } as const;
}

async function ownedPassport(service: ReturnType<typeof getServerClient>, tenantId: string, passportId: string) {
  const { data, error } = await service.from('ag_farm_passports').select('*').eq('id', passportId).eq('tenant_id', tenantId).maybeSingle();
  if (error) throw error;
  return data;
}

function readinessFromRecord(record: Record<string, unknown>) {
  const base = [record.fieldId, record.farm, record.producer, record.countyState, record.crop, Number(record.acres) > 0, record.harvestYear, record.landUseHistory].map(Boolean);
  const z45 = [...base, Number(record.actualYield) > 0, Number(record.benchmarkYield) > 0, Number(record.syntheticN) >= 0, record.tillage, record.coverCrop, record.nutrientPlan, record.nutrientRecords, (record.evidence as any)?.yield, (record.evidence as any)?.nitrogen, (record.evidence as any)?.nutrient].map(Boolean);
  const iscc = [...base, record.traceability, record.selfDeclaration, (record.evidence as any)?.land, (record.evidence as any)?.traceability].map(Boolean);
  const carb = [...base, record.gisBoundary, record.traceability, record.sustainabilityAttestation, (record.evidence as any)?.gis, (record.evidence as any)?.traceability, (record.evidence as any)?.attestation].map(Boolean);
  const pct = (items: boolean[]) => Math.round(items.filter(Boolean).length / Math.max(1, items.length) * 100);
  return { z45: pct(z45), iscc: pct(iscc), carb: pct(carb) };
}

function packageFor(passport: any, files: any[], framework: string) {
  const r = passport.record_data || {};
  const common = {
    producer: passport.producer,
    farmName: passport.farm_name,
    fieldId: passport.field_id,
    state: passport.state,
    county: passport.county,
    crop: passport.crop,
    harvestYear: passport.harvest_year,
    acres: r.acres,
    landUseHistory: r.landUseHistory,
  };
  const frameworkData = framework === '45Z' ? {
    actualYield: r.actualYield,
    benchmarkYield: r.benchmarkYield,
    syntheticN: r.syntheticN,
    nitrificationInhibitor: r.nitrificationInhibitor,
    manure: r.manure,
    tillage: r.tillage,
    coverCrop: r.coverCrop,
    nutrientPlan: r.nutrientPlan,
    nutrientRecords: r.nutrientRecords,
  } : framework === 'ISCC' ? {
    traceability: r.traceability,
    selfDeclaration: r.selfDeclaration,
    sustainabilityAttestation: r.sustainabilityAttestation,
  } : {
    gisBoundary: r.gisBoundary,
    traceability: r.traceability,
    sustainabilityAttestation: r.sustainabilityAttestation,
  };
  return {
    packageVersion: 'aridon-ag-1.0',
    framework,
    generatedAt: new Date().toISOString(),
    status: passport.status,
    readiness: passport.readiness || {},
    field: { ...common, ...frameworkData },
    waterRiskContext: {
      source: r.waterSource,
      annualAllocationAf: r.annualAllocationAf,
      expectedNeedAf: r.expectedNeedAf,
      pumpingCostPerAf: r.pumpingCostPerAf,
      waterQualityRisk: r.waterQualityRisk,
      infrastructureRisk: r.infrastructureRisk,
    },
    boundaryGeoJson: passport.boundary_geojson || null,
    evidence: files.filter((f) => f.shared !== false).map((f) => ({
      id: f.id,
      evidenceType: f.evidence_type,
      label: f.label,
      filename: f.customer_files?.filename || null,
      mimeType: f.customer_files?.mime_type || null,
      status: f.customer_files?.status || null,
    })),
    disclaimer: 'Aridon organizes producer records and evidence. This package is not a certification, tax opinion, verification decision, or guarantee of program eligibility.',
  };
}

export async function GET(request: NextRequest) {
  try {
    const slug = txt(request.nextUrl.searchParams.get('slug'), 80);
    if (!slug) return NextResponse.json({ error: 'Workspace is required.' }, { status: 400, headers: NO_STORE });
    const resolved = await resolveMembership(request, slug);
    if ('error' in resolved) return NextResponse.json({ error: resolved.error }, { status: resolved.status, headers: NO_STORE });
    const tenantId = resolved.membership.tenant.id;
    const service = resolved.service;

    const [passports, files, shares, reviews] = await Promise.all([
      service.from('ag_farm_passports').select('*').eq('tenant_id', tenantId).neq('status', 'archived').order('updated_at', { ascending: false }),
      service.from('ag_farm_passport_files').select('*,customer_files(id,filename,mime_type,size_bytes,status,extraction_status,created_at)').eq('tenant_id', tenantId).order('created_at', { ascending: false }),
      service.from('ag_farm_passport_shares').select('id,passport_id,role,permissions,expires_at,revoked_at,created_at,last_accessed_at').eq('tenant_id', tenantId).order('created_at', { ascending: false }),
      service.from('ag_farm_passport_reviews').select('*').eq('tenant_id', tenantId).order('created_at', { ascending: false }),
    ]);
    for (const result of [passports, files, shares, reviews]) if (result.error) throw result.error;

    return NextResponse.json({
      tenant: resolved.membership.tenant,
      role: resolved.membership.role,
      passports: passports.data || [],
      files: files.data || [],
      shares: shares.data || [],
      reviews: reviews.data || [],
    }, { headers: NO_STORE });
  } catch (error) {
    console.error('Farm Passport GET error', error);
    return NextResponse.json({ error: 'Unable to load Farm Passport cloud data.' }, { status: 500, headers: NO_STORE });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({})) as Record<string, any>;
    const action = txt(body.action, 40) || 'save';
    const slug = txt(body.slug, 80);
    if (!slug) return NextResponse.json({ error: 'Workspace is required.' }, { status: 400, headers: NO_STORE });
    const resolved = await resolveMembership(request, slug);
    if ('error' in resolved) return NextResponse.json({ error: resolved.error }, { status: resolved.status, headers: NO_STORE });
    const tenantId = resolved.membership.tenant.id;
    const service = resolved.service;

    if (action === 'save') {
      const p = body.passport && typeof body.passport === 'object' ? body.passport : {};
      const record = p.recordData && typeof p.recordData === 'object' ? p.recordData : {};
      const status = ALLOWED_STATUS.has(p.status) ? p.status : 'draft';
      const payload = {
        tenant_id: tenantId,
        owner_user_id: resolved.auth.user.id,
        producer: txt(p.producer || record.producer, 160) || null,
        farm_name: txt(p.farmName || record.farm, 180) || null,
        field_id: txt(p.fieldId || record.fieldId, 120) || null,
        state: txt(p.state, 80) || null,
        county: txt(p.county, 120) || null,
        crop: txt(p.crop || record.crop, 100) || null,
        harvest_year: Number.isFinite(Number(p.harvestYear || record.harvestYear)) ? Number(p.harvestYear || record.harvestYear) : null,
        record_data: record,
        boundary_geojson: p.boundaryGeoJson || null,
        readiness: p.readiness && typeof p.readiness === 'object' ? p.readiness : readinessFromRecord(record),
        status,
        updated_at: new Date().toISOString(),
      };
      if (txt(p.id, 80)) {
        const { data, error } = await service.from('ag_farm_passports').update(payload).eq('id', p.id).eq('tenant_id', tenantId).select('*').single();
        if (error) throw error;
        return NextResponse.json({ passport: data }, { headers: NO_STORE });
      }
      const { data, error } = await service.from('ag_farm_passports').insert(payload).select('*').single();
      if (error) throw error;
      return NextResponse.json({ passport: data }, { status: 201, headers: NO_STORE });
    }

    const passportId = txt(body.passportId, 80);
    if (!passportId) return NextResponse.json({ error: 'Passport is required.' }, { status: 400, headers: NO_STORE });
    const passport = await ownedPassport(service, tenantId, passportId);
    if (!passport) return NextResponse.json({ error: 'Farm Passport not found.' }, { status: 404, headers: NO_STORE });

    if (action === 'prepare_upload') {
      const filename = txt(body.filename, 220);
      const mimeType = txt(body.mimeType, 160) || 'application/octet-stream';
      const sizeBytes = Number(body.sizeBytes || 0);
      if (!filename || !Number.isFinite(sizeBytes) || sizeBytes <= 0) return NextResponse.json({ error: 'Choose a valid file first.' }, { status: 400, headers: NO_STORE });
      if (sizeBytes > MAX_FILE_BYTES) return NextResponse.json({ error: 'Evidence files are limited to 25 MB.' }, { status: 413, headers: NO_STORE });
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
      const { data: linkRow, error: linkError } = await service.from('ag_farm_passport_files').insert({
        tenant_id: tenantId,
        passport_id: passportId,
        customer_file_id: fileRow.id,
        evidence_type: txt(body.evidenceType, 80) || 'supporting_document',
        label: txt(body.label, 180) || null,
        shared: body.shared !== false,
      }).select('id').single();
      if (linkError) throw linkError;
      const { data: signed, error: signedError } = await service.storage.from(BUCKET).createSignedUploadUrl(storagePath);
      if (signedError || !signed?.token) throw signedError || new Error('Unable to prepare secure upload.');
      return NextResponse.json({ fileId: fileRow.id, linkId: linkRow.id, path: storagePath, token: signed.token }, { headers: NO_STORE });
    }

    if (action === 'complete_upload') {
      const fileId = txt(body.fileId, 80);
      const { data: file, error } = await service.from('customer_files').select('id,storage_path').eq('id', fileId).eq('tenant_id', tenantId).maybeSingle();
      if (error) throw error;
      if (!file) return NextResponse.json({ error: 'Evidence file not found.' }, { status: 404, headers: NO_STORE });
      const { error: updateError } = await service.from('customer_files').update({ status:'ready', updated_at:new Date().toISOString() }).eq('id', file.id).eq('tenant_id', tenantId);
      if (updateError) throw updateError;
      return NextResponse.json({ ready:true }, { headers: NO_STORE });
    }

    if (action === 'download_url') {
      const fileId = txt(body.fileId, 80);
      const { data: linked, error } = await service.from('ag_farm_passport_files').select('customer_file_id,customer_files(storage_path)').eq('tenant_id', tenantId).eq('passport_id', passportId).eq('customer_file_id', fileId).maybeSingle();
      if (error) throw error;
      const storagePath = (linked?.customer_files as any)?.storage_path;
      if (!storagePath) return NextResponse.json({ error: 'Evidence file not found.' }, { status: 404, headers: NO_STORE });
      const { data, error: signError } = await service.storage.from(BUCKET).createSignedUrl(storagePath, 300, { download:true });
      if (signError || !data?.signedUrl) throw signError || new Error('Unable to create private download link.');
      return NextResponse.json({ url:data.signedUrl }, { headers: NO_STORE });
    }

    if (action === 'create_share') {
      const role = txt(body.role, 20).toLowerCase();
      if (!ALLOWED_ROLES.has(role)) return NextResponse.json({ error: 'Choose buyer, verifier, or auditor access.' }, { status: 400, headers: NO_STORE });
      const days = Math.max(1, Math.min(90, Number(body.days || 14)));
      const token = randomBytes(32).toString('base64url');
      const permissions = {
        record: body.permissions?.record !== false,
        review: body.permissions?.review !== false,
        boundary: body.permissions?.boundary !== false,
        documents: body.permissions?.documents === true,
      };
      const expiresAt = new Date(Date.now() + days * 86400000).toISOString();
      const { data, error } = await service.from('ag_farm_passport_shares').insert({
        tenant_id:tenantId,
        passport_id:passportId,
        role,
        token_hash:tokenHash(token),
        permissions,
        expires_at:expiresAt,
        created_by:resolved.auth.user.id,
      }).select('id,role,permissions,expires_at').single();
      if (error) throw error;
      const url = `${request.nextUrl.origin}/ag/farm-passport/review/${token}`;
      return NextResponse.json({ share:{ ...data, url } }, { status:201, headers:NO_STORE });
    }

    if (action === 'revoke_share') {
      const shareId = txt(body.shareId, 80);
      const { error } = await service.from('ag_farm_passport_shares').update({ revoked_at:new Date().toISOString() }).eq('id', shareId).eq('passport_id', passportId).eq('tenant_id', tenantId);
      if (error) throw error;
      return NextResponse.json({ revoked:true }, { headers:NO_STORE });
    }

    if (action === 'package') {
      const framework = txt(body.framework, 20).toUpperCase();
      if (!PACKAGE_TYPES.has(framework)) return NextResponse.json({ error:'Choose 45Z, ISCC, or CARB.' }, { status:400, headers:NO_STORE });
      const { data: files, error } = await service.from('ag_farm_passport_files').select('*,customer_files(id,filename,mime_type,status)').eq('tenant_id', tenantId).eq('passport_id', passportId);
      if (error) throw error;
      return NextResponse.json({ package:packageFor(passport, files || [], framework) }, { headers:NO_STORE });
    }

    return NextResponse.json({ error:'Unknown Farm Passport action.' }, { status:400, headers:NO_STORE });
  } catch (error) {
    console.error('Farm Passport POST error', error);
    return NextResponse.json({ error:error instanceof Error ? error.message : 'Unable to process Farm Passport request.' }, { status:500, headers:NO_STORE });
  }
}
