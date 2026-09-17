import { NextRequest, NextResponse } from 'next/server';
import { authenticatedCustomer, customerTenantForUser, subscriptionAllowsAccess } from '../../../../lib/customerAuth';
import { runBrowserExploration } from '../../../../lib/browserWorker';

export const runtime = 'nodejs';
export const maxDuration = 60;

const NO_STORE = { 'Cache-Control': 'no-store' };

function clean(value: unknown, max = 4000) {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

function normalizeUrl(value: string) {
  if (!value) return '';
  if (/^https?:\/\//i.test(value)) return value;
  return `https://${value}`;
}

export async function POST(request: NextRequest) {
  try {
    const auth = await authenticatedCustomer(request);
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status, headers: NO_STORE });
    if (!request.headers.get('content-type')?.includes('application/json')) {
      return NextResponse.json({ error: 'Content-Type must be application/json.' }, { status: 415, headers: NO_STORE });
    }

    const body = await request.json();
    const slug = clean(body?.slug, 80);
    const objective = clean(body?.objective, 2500);
    const requestedUrl = normalizeUrl(clean(body?.url, 2000));
    if (!slug) return NextResponse.json({ error: 'Workspace is required.' }, { status: 400, headers: NO_STORE });
    if (!objective) return NextResponse.json({ error: 'Tell Eva what you want the browser to find or inspect.' }, { status: 400, headers: NO_STORE });
    if (!requestedUrl) return NextResponse.json({ error: 'A website URL is required.' }, { status: 400, headers: NO_STORE });

    const membership = await customerTenantForUser(auth.user.id, slug, auth.token);
    if (!membership) return NextResponse.json({ error: 'You do not have access to this workspace.' }, { status: 403, headers: NO_STORE });
    if (!subscriptionAllowsAccess(membership.tenant.subscription_status)) {
      return NextResponse.json({ error: 'This workspace is not active.' }, { status: 402, headers: NO_STORE });
    }

    const exploration = await runBrowserExploration({
      objective: `${objective}\n\nStart at: ${requestedUrl}`,
      candidateUrls: [requestedUrl],
      maxSteps: 5,
    });

    return NextResponse.json({
      ok: !exploration.error,
      engine: exploration.engine || 'aridon',
      exploration,
    }, { status: exploration.error && !exploration.ran ? 502 : 200, headers: NO_STORE });
  } catch (error) {
    console.error('Aridon Browser request failed', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Aridon Browser could not complete the request.' }, { status: 500, headers: NO_STORE });
  }
}
