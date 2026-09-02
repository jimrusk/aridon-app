import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';

const NO_STORE = { 'cache-control': 'no-store' };
const MAX_STRING = 500;

function text(value: unknown, max = MAX_STRING) {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

function number(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

export async function POST(request: NextRequest) {
  try {
    if (!request.headers.get('content-type')?.includes('application/json')) {
      return NextResponse.json({ error: 'Send a JSON request.' }, { status: 415, headers: NO_STORE });
    }

    const body = await request.json();
    const missionId = text(body?.missionId, 120);
    const assetId = text(body?.assetId, 120);
    const capturedAt = text(body?.capturedAt, 80) || new Date().toISOString();

    if (!missionId || !assetId) {
      return NextResponse.json({ error: 'missionId and assetId are required.' }, { status: 400, headers: NO_STORE });
    }

    const event = {
      eventId: randomUUID(),
      missionId,
      assetId,
      assetType: text(body?.assetType, 80) || 'unknown',
      capturedAt,
      droneId: text(body?.droneId, 120) || null,
      position: {
        lat: number(body?.position?.lat),
        lon: number(body?.position?.lon),
        altitudeM: number(body?.position?.altitudeM),
      },
      telemetry: {
        batteryPct: number(body?.telemetry?.batteryPct),
        speedMps: number(body?.telemetry?.speedMps),
        headingDeg: number(body?.telemetry?.headingDeg),
      },
      evidence: {
        rgbUri: text(body?.evidence?.rgbUri, 1000) || null,
        thermalUri: text(body?.evidence?.thermalUri, 1000) || null,
        lidarUri: text(body?.evidence?.lidarUri, 1000) || null,
        sha256: text(body?.evidence?.sha256, 128) || null,
      },
      measurements: {
        thermalC: number(body?.measurements?.thermalC),
        thermalBaselineC: number(body?.measurements?.thermalBaselineC),
        vegetationClearanceFt: number(body?.measurements?.vegetationClearanceFt),
        poleLeanDeg: number(body?.measurements?.poleLeanDeg),
        conductorSagFt: number(body?.measurements?.conductorSagFt),
      },
      acceptedAt: new Date().toISOString(),
    };

    // MVP contract: return the normalized event so drone gateways and GIS adapters can
    // integrate against a stable shape. Production deployment should persist this event
    // in Supabase/object storage and publish it to the analysis queue.
    return NextResponse.json({ accepted: true, event }, { status: 202, headers: NO_STORE });
  } catch {
    return NextResponse.json({ error: 'Unable to ingest inspection event.' }, { status: 400, headers: NO_STORE });
  }
}
