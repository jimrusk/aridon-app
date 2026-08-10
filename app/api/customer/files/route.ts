import { NextRequest, NextResponse } from 'next/server';
import { authenticatedCustomer, customerTenantForUser, subscriptionAllowsAccess } from '../../../../lib/customerAuth';

export const runtime = 'nodejs';
export const maxDuration = 60;

const NO_STORE = { 'Cache-Control': 'no-store' };
const BUCKET = 'customer-files';
const MAX_FILE_BYTES = 25 * 1024 * 1024;
const MAX_AI_FILE_BYTES = 12 * 1024 * 1024;
const RESPONSES_URL = 'https://api.openai.com/v1/responses';

type ResponsesPayload = {
  output_text?: string;
  output?: Array<{ content?: Array<{ type?: string; text?: string }> }>;
  error?: { message?: string };
};

function text(value: unknown, max: number) {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

function safeFilename(value: string) {
  const cleaned = value.replace(/[^a-zA-Z0-9._-]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
  return (cleaned || 'company-file').slice(-140);
}

function extractOutputText(data: ResponsesPayload) {
  if (typeof data.output_text === 'string' && data.output_text.trim()) return data.output_text.trim();
  return (data.output || [])
    .flatMap((item) => item.content || [])
    .filter((item) => item.type === 'output_text' && typeof item.text === 'string')
    .map((item) => item.text as string)
    .join('\n\n')
    .trim();
}

async function resolveMembership(request: NextRequest, slug: string) {
  const auth = await authenticatedCustomer(request);
  if (!auth.ok) return { error: auth.error, status: auth.status } as const;
  const membership = await customerTenantForUser(auth.user.id, slug);
  if (!membership) return { error: 'You do not have access to this workspace.', status: 403 } as const;
  if (!subscriptionAllowsAccess(membership.tenant.subscription_status)) return { error: 'This workspace is not active.', status: 402 } as const;
  return { auth, membership } as const;
}

function isPlainText(filename: string, mimeType: string) {
  const extension = filename.split('.').pop()?.toLowerCase() || '';
  return mimeType.startsWith('text/') || ['txt', 'md', 'csv', 'tsv', 'json', 'xml', 'html', 'htm', 'log'].includes(extension);
}

async function extractWithOpenAI(bytes: Uint8Array, filename: string, mimeType: string) {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) throw new Error('AI file extraction is not configured.');
  if (bytes.byteLength > MAX_AI_FILE_BYTES) throw new Error('This file is stored, but is too large for automatic AI extraction.');

  const base64 = Buffer.from(bytes).toString('base64');
  const content: Array<Record<string, unknown>> = [{
    type: 'input_text',
    text: 'Extract the useful business information from this company file. Preserve names, products, services, numbers, dates, approved claims, customer descriptions, differentiators, positioning, instructions, and other facts that would help an AI business team create accurate work. Do not invent anything. Return concise plain text, not JSON, and clearly mark uncertainty. Keep the result under 12,000 characters.',
  }];

  if (mimeType.startsWith('image/')) {
    content.push({ type: 'input_image', image_url: `data:${mimeType};base64,${base64}`, detail: 'high' });
  } else {
    content.push({ type: 'input_file', file_data: base64, filename });
  }

  const response = await fetch(RESPONSES_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: process.env.CUSTOMER_FILE_MODEL?.trim() || 'gpt-5-mini',
      input: [{ role: 'user', content }],
      max_output_tokens: 2600,
      store: false,
    }),
    cache: 'no-store',
  });
  const data = await response.json() as ResponsesPayload;
  if (!response.ok) throw new Error(data.error?.message || `AI file extraction returned ${response.status}.`);
  const extracted = extractOutputText(data);
  if (!extracted) throw new Error('The file was stored, but no readable business text was extracted.');
  return extracted.slice(0, 18000);
}

export async function GET(request: NextRequest) {
  try {
    const slug = text(request.nextUrl.searchParams.get('slug'), 80);
    if (!slug) return NextResponse.json({ error: 'Workspace is required.' }, { status: 400, headers: NO_STORE });
    const resolved = await resolveMembership(request, slug);
    if ('error' in resolved) return NextResponse.json({ error: resolved.error }, { status: resolved.status, headers: NO_STORE });

    const { data, error } = await resolved.auth.db
      .from('customer_files')
      .select('id,filename,mime_type,size_bytes,status,extraction_status,notes,created_at')
      .eq('tenant_id', resolved.membership.tenant.id)
      .order('created_at', { ascending: false })
      .limit(100);
    if (error) throw error;
    return NextResponse.json({ files: data || [] }, { headers: NO_STORE });
  } catch (error) {
    console.error('Customer files GET error', error);
    return NextResponse.json({ error: 'Unable to load company files.' }, { status: 500, headers: NO_STORE });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const action = text(body?.action, 40);
    const slug = text(body?.slug, 80);
    if (!slug) return NextResponse.json({ error: 'Workspace is required.' }, { status: 400, headers: NO_STORE });
    const resolved = await resolveMembership(request, slug);
    if ('error' in resolved) return NextResponse.json({ error: resolved.error }, { status: resolved.status, headers: NO_STORE });

    const db = resolved.auth.db;
    const tenantId = resolved.membership.tenant.id;

    if (action === 'prepare_upload') {
      const filename = text(body?.filename, 220);
      const mimeType = text(body?.mimeType, 160) || 'application/octet-stream';
      const sizeBytes = Number(body?.sizeBytes || 0);
      if (!filename || !Number.isFinite(sizeBytes) || sizeBytes <= 0) return NextResponse.json({ error: 'Choose a valid file first.' }, { status: 400, headers: NO_STORE });
      if (sizeBytes > MAX_FILE_BYTES) return NextResponse.json({ error: 'Files are limited to 25 MB in Creator Studio.' }, { status: 413, headers: NO_STORE });

      const storagePath = `${tenantId}/${crypto.randomUUID()}-${safeFilename(filename)}`;
      const { data: row, error: rowError } = await db.from('customer_files').insert({
        tenant_id: tenantId,
        uploaded_by: resolved.auth.user.id,
        filename,
        storage_path: storagePath,
        mime_type: mimeType,
        size_bytes: sizeBytes,
        status: 'uploading',
        extraction_status: 'pending',
      }).select('id').single();
      if (rowError) throw rowError;

      const { data: signed, error: signedError } = await db.storage.from(BUCKET).createSignedUploadUrl(storagePath);
      if (signedError || !signed?.token) {
        await db.from('customer_files').delete().eq('id', row.id).eq('tenant_id', tenantId);
        throw signedError || new Error('Unable to prepare the private upload.');
      }
      return NextResponse.json({ fileId: row.id, path: storagePath, token: signed.token }, { headers: NO_STORE });
    }

    if (action === 'complete_upload') {
      const fileId = text(body?.fileId, 80);
      const { data: file, error: fileError } = await db
        .from('customer_files')
        .select('id,filename,storage_path,mime_type,size_bytes')
        .eq('id', fileId)
        .eq('tenant_id', tenantId)
        .maybeSingle();
      if (fileError) throw fileError;
      if (!file) return NextResponse.json({ error: 'File record not found.' }, { status: 404, headers: NO_STORE });

      const { data: blob, error: downloadError } = await db.storage.from(BUCKET).download(file.storage_path);
      if (downloadError || !blob) throw downloadError || new Error('The uploaded file could not be read.');
      const bytes = new Uint8Array(await blob.arrayBuffer());
      let extractedText = '';
      let extractionStatus: 'ready' | 'failed' | 'not_needed' = 'not_needed';
      let notes = '';

      try {
        if (isPlainText(file.filename, file.mime_type || '')) {
          extractedText = new TextDecoder('utf-8', { fatal: false }).decode(bytes).replace(/\u0000/g, '').slice(0, 18000);
          extractionStatus = extractedText.trim() ? 'ready' : 'not_needed';
        } else {
          extractedText = await extractWithOpenAI(bytes, file.filename, file.mime_type || 'application/octet-stream');
          extractionStatus = 'ready';
        }
      } catch (error) {
        extractionStatus = 'failed';
        notes = error instanceof Error ? error.message.slice(0, 500) : 'Automatic extraction failed. The original private file is still stored.';
      }

      const { error: updateError } = await db.from('customer_files').update({
        status: 'ready',
        extraction_status: extractionStatus,
        extracted_text: extractedText || null,
        notes: notes || null,
        updated_at: new Date().toISOString(),
      }).eq('id', file.id).eq('tenant_id', tenantId);
      if (updateError) throw updateError;

      await db.from('customer_usage_events').insert({
        tenant_id: tenantId,
        user_id: resolved.auth.user.id,
        event_name: 'company_file_uploaded',
        event_data: { filename: file.filename, size_bytes: file.size_bytes, extraction_status: extractionStatus },
      });
      return NextResponse.json({ ready: true, extractionStatus, notes }, { headers: NO_STORE });
    }

    if (action === 'download_url') {
      const fileId = text(body?.fileId, 80);
      const { data: file, error: fileError } = await db.from('customer_files').select('storage_path').eq('id', fileId).eq('tenant_id', tenantId).maybeSingle();
      if (fileError) throw fileError;
      if (!file) return NextResponse.json({ error: 'File not found.' }, { status: 404, headers: NO_STORE });
      const { data, error } = await db.storage.from(BUCKET).createSignedUrl(file.storage_path, 300, { download: true });
      if (error || !data?.signedUrl) throw error || new Error('Unable to create a download link.');
      return NextResponse.json({ url: data.signedUrl }, { headers: NO_STORE });
    }

    return NextResponse.json({ error: 'Unknown file action.' }, { status: 400, headers: NO_STORE });
  } catch (error) {
    console.error('Customer files POST error', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to process this company file.' }, { status: 500, headers: NO_STORE });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const slug = text(body?.slug, 80);
    const fileId = text(body?.fileId, 80);
    if (!slug || !fileId) return NextResponse.json({ error: 'Workspace and file are required.' }, { status: 400, headers: NO_STORE });
    const resolved = await resolveMembership(request, slug);
    if ('error' in resolved) return NextResponse.json({ error: resolved.error }, { status: resolved.status, headers: NO_STORE });
    const tenantId = resolved.membership.tenant.id;
    const db = resolved.auth.db;
    const { data: file, error: fileError } = await db.from('customer_files').select('storage_path,filename').eq('id', fileId).eq('tenant_id', tenantId).maybeSingle();
    if (fileError) throw fileError;
    if (!file) return NextResponse.json({ deleted: true }, { headers: NO_STORE });
    await db.storage.from(BUCKET).remove([file.storage_path]);
    const { error } = await db.from('customer_files').delete().eq('id', fileId).eq('tenant_id', tenantId);
    if (error) throw error;
    await db.from('customer_usage_events').insert({ tenant_id: tenantId, user_id: resolved.auth.user.id, event_name: 'company_file_deleted', event_data: { filename: file.filename } });
    return NextResponse.json({ deleted: true }, { headers: NO_STORE });
  } catch (error) {
    console.error('Customer files DELETE error', error);
    return NextResponse.json({ error: 'Unable to delete this company file.' }, { status: 500, headers: NO_STORE });
  }
}
