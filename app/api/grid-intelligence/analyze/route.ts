import { NextRequest, NextResponse } from 'next/server';

const NO_STORE = { 'cache-control': 'no-store' };

type InspectionInput = {
  assetId?: string;
  assetType?: string;
  thermalC?: number;
  thermalBaselineC?: number;
  vegetationClearanceFt?: number;
  poleLeanDeg?: number;
  crackConfidence?: number;
  corrosionConfidence?: number;
  conductorSagFt?: number;
};

function numberOrNull(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

export async function POST(request: NextRequest) {
  try {
    if (!request.headers.get('content-type')?.includes('application/json')) {
      return NextResponse.json({ error: 'Send a JSON request.' }, { status: 415, headers: NO_STORE });
    }

    const body = await request.json() as InspectionInput;
    const assetId = typeof body.assetId === 'string' ? body.assetId.slice(0, 120) : 'unknown-asset';
    const assetType = typeof body.assetType === 'string' ? body.assetType.slice(0, 80) : 'unknown';

    const thermal = numberOrNull(body.thermalC);
    const baseline = numberOrNull(body.thermalBaselineC);
    const clearance = numberOrNull(body.vegetationClearanceFt);
    const lean = numberOrNull(body.poleLeanDeg);
    const crack = numberOrNull(body.crackConfidence);
    const corrosion = numberOrNull(body.corrosionConfidence);
    const sag = numberOrNull(body.conductorSagFt);

    let risk = 8;
    const reasons: string[] = [];

    if (thermal !== null && baseline !== null) {
      const delta = thermal - baseline;
      if (delta >= 30) { risk += 48; reasons.push(`Thermal anomaly is ${delta.toFixed(1)}°C above baseline.`); }
      else if (delta >= 20) { risk += 38; reasons.push(`Thermal anomaly is ${delta.toFixed(1)}°C above baseline.`); }
      else if (delta >= 10) { risk += 22; reasons.push(`Thermal rise is ${delta.toFixed(1)}°C above baseline.`); }
      else if (delta >= 5) { risk += 10; reasons.push(`Thermal rise is ${delta.toFixed(1)}°C above baseline.`); }
    }

    if (clearance !== null) {
      if (clearance < 5) { risk += 35; reasons.push(`Vegetation clearance is only ${clearance.toFixed(1)} ft.`); }
      else if (clearance < 10) { risk += 22; reasons.push(`Vegetation clearance is ${clearance.toFixed(1)} ft.`); }
      else if (clearance < 15) { risk += 10; reasons.push(`Vegetation clearance is trending toward the configured threshold.`); }
    }

    if (lean !== null) {
      if (lean >= 8) { risk += 35; reasons.push(`Pole/structure lean is ${lean.toFixed(1)}°.`); }
      else if (lean >= 5) { risk += 22; reasons.push(`Pole/structure lean is ${lean.toFixed(1)}°.`); }
      else if (lean >= 3) { risk += 10; reasons.push(`Pole/structure lean is ${lean.toFixed(1)}°.`); }
    }

    if (crack !== null) {
      const c = Math.max(0, Math.min(1, crack));
      if (c >= .9) { risk += 35; reasons.push(`Crack detector confidence is ${(c * 100).toFixed(0)}%.`); }
      else if (c >= .7) { risk += 24; reasons.push(`Crack detector confidence is ${(c * 100).toFixed(0)}%.`); }
      else if (c >= .5) { risk += 12; reasons.push(`Crack candidate requires confirmation.`); }
    }

    if (corrosion !== null) {
      const c = Math.max(0, Math.min(1, corrosion));
      if (c >= .85) { risk += 24; reasons.push(`Corrosion detector confidence is ${(c * 100).toFixed(0)}%.`); }
      else if (c >= .6) { risk += 12; reasons.push(`Corrosion candidate should be trended.`); }
    }

    if (sag !== null && sag >= 6) {
      risk += sag >= 10 ? 28 : 14;
      reasons.push(`Measured conductor sag is ${sag.toFixed(1)} ft.`);
    }

    const riskScore = Math.min(100, Math.round(risk));
    const severity = riskScore >= 90 ? 'Critical' : riskScore >= 70 ? 'High' : riskScore >= 45 ? 'Medium' : 'Low';
    const recommendedAction = severity === 'Critical'
      ? 'Escalate immediately and require utility operator review before dispatch.'
      : severity === 'High'
      ? 'Create a priority inspection recommendation for utility approval within 24 hours.'
      : severity === 'Medium'
      ? 'Queue a field inspection or maintenance recommendation within 14 days.'
      : 'Track this asset and compare against the next inspection cycle.';

    if (reasons.length === 0) reasons.push('No configured anomaly threshold was exceeded in this inspection payload.');

    return NextResponse.json({
      assetId,
      assetType,
      riskScore,
      severity,
      reasons,
      recommendedAction,
      engine: 'aridon-grid-rules-v0.1',
      note: 'MVP scoring engine. Replace or augment signals with validated computer-vision, thermal and LiDAR models before production use.',
    }, { headers: NO_STORE });
  } catch {
    return NextResponse.json({ error: 'Unable to analyze inspection payload.' }, { status: 400, headers: NO_STORE });
  }
}
