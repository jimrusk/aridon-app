import { NextRequest, NextResponse } from 'next/server';
import { authenticatedCustomer, customerTenantForUser, subscriptionAllowsAccess } from '../../../../../lib/customerAuth';

export const runtime = 'nodejs';
export const maxDuration = 300;

const NO_STORE = { 'Cache-Control': 'no-store' };
const MIRELO_API = 'https://api.mirelo.ai/v2/text-to-sfx/v1.6/sync';

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
  return process.env.MIRELO_API_KEY?.trim() || '';
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const slug = clean(body?.slug, 80);
    const prompt = clean(body?.prompt, 5000);
    const requestedDuration = Number(body?.durationMs || 10000);
    const durationMs = Math.max(1000, Math.min(60000, Number.isFinite(requestedDuration) ? requestedDuration : 10000));

    if (!slug || !prompt) return NextResponse.json({ error: 'Workspace and sound prompt are required.' }, { status: 400, headers: NO_STORE });
    const resolved = await resolveMembership(request, slug);
    if ('error' in resolved) return NextResponse.json({ error: resolved.error }, { status: resolved.status, headers: NO_STORE });

    const key = apiKey();
    if (!key) return NextResponse.json({
      error: 'Mirelo is wired into Aridon Media Engine, but the server is missing MIRELO_API_KEY.',
      configured: false,
    }, { status: 503, headers: NO_STORE });

    const response = await fetch(MIRELO_API, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt,
        duration_ms: durationMs,
        loop: false,
        num_samples: 1,
        output_format: 'mp3',
      }),
      cache: 'no-store',
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) return NextResponse.json({ error: data?.detail || data?.message || `Mirelo returned ${response.status}.` }, { status: response.status, headers: NO_STORE });

    const resultUrls = Array.isArray(data?.result_urls) ? data.result_urls.filter((value: unknown) => typeof value === 'string') : [];
    if (!resultUrls.length) return NextResponse.json({ error: 'Mirelo completed the request but returned no audio URL.' }, { status: 502, headers: NO_STORE });

    await resolved.auth.db.from('customer_usage_events').insert({
      tenant_id: resolved.membership.tenant.id,
      user_id: resolved.auth.user.id,
      event_name: 'media_engine_mirelo_sfx_generated',
      event_data: { duration_ms: durationMs, model: 'mirelo-sfx-1.6' },
    });

    return NextResponse.json({ ok: true, provider: 'Mirelo', model: 'mirelo-sfx-1.6', audioUrl: resultUrls[0], resultUrls }, { headers: NO_STORE });
  } catch (error) {
    console.error('Media Engine Mirelo generation error', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to generate Mirelo sound.' }, { status: 500, headers: NO_STORE });
  }
}
