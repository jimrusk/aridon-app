import { NextRequest, NextResponse } from 'next/server';

const NO_STORE = { 'cache-control': 'no-store' };

function safeText(value: unknown, max = 500) {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

export async function POST(request: NextRequest) {
  try {
    if (!request.headers.get('content-type')?.includes('application/json')) {
      return NextResponse.json({ error: 'Send a JSON request.' }, { status: 415, headers: NO_STORE });
    }

    const body = await request.json();
    const assetId = safeText(body?.assetId, 120);
    const approved = body?.approved === true;

    if (!assetId) {
      return NextResponse.json({ error: 'assetId is required.' }, { status: 400, headers: NO_STORE });
    }
    if (!approved) {
      return NextResponse.json({
        error: 'Human approval is required before generating an outbound GIS update.',
        approvalRequired: true,
      }, { status: 409, headers: NO_STORE });
    }

    const featureUpdate = {
      attributes: {
        ASSET_ID: assetId,
        ARIDON_RISK_SCORE: typeof body?.riskScore === 'number' ? Math.max(0, Math.min(100, Math.round(body.riskScore))) : null,
        ARIDON_SEVERITY: safeText(body?.severity, 30) || null,
        ARIDON_FINDING: safeText(body?.summary, 1000) || null,
        ARIDON_ACTION: safeText(body?.recommendedAction, 1000) || null,
        ARIDON_INSPECTED_AT: safeText(body?.inspectedAt, 80) || new Date().toISOString(),
        ARIDON_REVIEW_STATUS: 'confirmed',
      },
      attachments: Array.isArray(body?.evidenceUris)
        ? body.evidenceUris.slice(0, 20).filter((x: unknown) => typeof x === 'string').map((uri: string) => ({ uri: uri.slice(0, 1200) }))
        : [],
    };

    return NextResponse.json({
      ready: true,
      provider: safeText(body?.provider, 80) || 'ArcGIS/ArcFM',
      mode: 'payload-only',
      featureUpdate,
      nextStep: 'Send this approved payload through the utility-specific feature service adapter using server-side credentials.',
      note: 'This MVP never stores or exposes GIS credentials and does not write to an external utility system by itself.',
    }, { headers: NO_STORE });
  } catch {
    return NextResponse.json({ error: 'Unable to build GIS export payload.' }, { status: 400, headers: NO_STORE });
  }
}
