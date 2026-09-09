import { NextRequest, NextResponse } from 'next/server';
import { authenticatedCustomer, customerTenantForUser, subscriptionAllowsAccess } from '../../../../../lib/customerAuth';

export const runtime = 'nodejs';
export const maxDuration = 300;

const NO_STORE = { 'Cache-Control': 'no-store' };
const LTX_API = 'https://api.ltx.io/v2';
const MODEL = process.env.LTX_VIDEO_MODEL?.trim() || 'ltx-2-5-fast';

function clean(value: unknown, max = 5000) {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

async function resolveMembership(request: NextRequest, slug: string) {
  const auth = await authenticatedCustomer(request);
  if (!auth.ok) return { error: auth.error, status: auth.status } as const;
  const membership = await customerTenantForUser(auth.user.id, slug, auth.token);
  if (!membership) return { error: 'You do not have access to this workspace.', status: 403 } as const;
  if (!subscriptionAllowsAccess(membership.tenant.subscription_status)) return { error: 'This workspace is not active.', status: 402 } as const;
  return { auth, membership } as const;
}

function apiKey() {
  return process.env.LTXV_API_KEY?.trim() || process.env.LTX_API_KEY?.trim() || '';
}

function resolutionFor(value: unknown) {
  switch (value) {
    case '360p': return '640x360';
    case '1080p': return '1920x1080';
    case '4k': return '3840x2160';
    case '720p':
    default: return '1280x720';
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const slug = clean(body?.slug, 80);
    const prompt = clean(body?.prompt, 5000);
    const resolution = resolutionFor(body?.resolution);

    if (!slug || !prompt) return NextResponse.json({ error: 'Workspace and prompt are required.' }, { status: 400, headers: NO_STORE });
    const resolved = await resolveMembership(request, slug);
    if ('error' in resolved) return NextResponse.json({ error: resolved.error }, { status: resolved.status, headers: NO_STORE });

    const key = apiKey();
    if (!key) return NextResponse.json({
      error: 'LTX is wired into Aridon Media Engine, but the server is missing LTXV_API_KEY.',
      configured: false,
      model: MODEL,
    }, { status: 503, headers: NO_STORE });

    const response = await fetch(`${LTX_API}/text-to-video`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt,
        model: MODEL,
        duration: null,
        resolution,
        generate_audio: true,
      }),
      cache: 'no-store',
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) return NextResponse.json({ error: data?.error?.message || data?.message || `LTX returned ${response.status}.` }, { status: response.status, headers: NO_STORE });

    const jobId = clean(data?.id, 180);
    if (!jobId) return NextResponse.json({ error: 'LTX accepted the request but did not return a job ID.' }, { status: 502, headers: NO_STORE });

    await resolved.auth.db.from('customer_usage_events').insert({
      tenant_id: resolved.membership.tenant.id,
      user_id: resolved.auth.user.id,
      event_name: 'media_engine_ltx_generation_requested',
      event_data: { model: MODEL, resolution },
    });

    return NextResponse.json({ ok: true, provider: 'LTX', model: MODEL, jobId, status: 'pending' }, { status: 201, headers: NO_STORE });
  } catch (error) {
    console.error('Media Engine LTX submit error', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to submit LTX generation.' }, { status: 500, headers: NO_STORE });
  }
}

export async function GET(request: NextRequest) {
  try {
    const slug = clean(request.nextUrl.searchParams.get('slug'), 80);
    const jobId = clean(request.nextUrl.searchParams.get('jobId'), 180);
    if (!slug || !jobId) return NextResponse.json({ error: 'Workspace and job ID are required.' }, { status: 400, headers: NO_STORE });

    const resolved = await resolveMembership(request, slug);
    if ('error' in resolved) return NextResponse.json({ error: resolved.error }, { status: resolved.status, headers: NO_STORE });

    const key = apiKey();
    if (!key) return NextResponse.json({ error: 'LTXV_API_KEY is not configured.' }, { status: 503, headers: NO_STORE });

    const response = await fetch(`${LTX_API}/text-to-video/${encodeURIComponent(jobId)}`, {
      headers: { Authorization: `Bearer ${key}` },
      cache: 'no-store',
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) return NextResponse.json({ error: data?.error?.message || data?.message || `LTX status returned ${response.status}.` }, { status: response.status, headers: NO_STORE });

    return NextResponse.json({
      provider: 'LTX',
      model: MODEL,
      status: clean(data?.status, 40) || 'processing',
      videoUrl: clean(data?.result?.video_url, 4000),
      error: clean(data?.error?.message || data?.message, 1000),
    }, { headers: NO_STORE });
  } catch (error) {
    console.error('Media Engine LTX status error', error);
    return NextResponse.json({ error: 'Unable to read LTX job status.' }, { status: 500, headers: NO_STORE });
  }
}
