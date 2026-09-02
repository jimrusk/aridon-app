import { NextRequest, NextResponse } from 'next/server';
import { getServerClient } from '@/lib/supabase';
import { authenticateGridAdmin, safeText } from '@/lib/gridIntelligence';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const NO_STORE = { 'cache-control': 'no-store' };
const ALLOWED = new Set(['confirmed', 'dismissed', 'needs_field_check']);

function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status, headers: NO_STORE });
}

export async function POST(request: NextRequest) {
  const admin = authenticateGridAdmin(request);
  if (!admin.configured) return json({ error: 'ARIDON_GRID_ADMIN_KEY is not configured.' }, 503);
  if (!admin.ok) return json({ error: 'Valid grid admin credentials are required.' }, 401);

  try {
    const body = await request.json();
    const findingId = safeText(body?.findingId, 120);
    const reviewedBy = safeText(body?.reviewedBy, 180);
    const decision = safeText(body?.decision, 40);
    if (!findingId || !reviewedBy || !ALLOWED.has(decision)) {
      return json({ error: 'findingId, reviewedBy and a valid decision are required.' }, 400);
    }

    const supabase = getServerClient();
    const reviewedAt = new Date().toISOString();
    const { data: finding, error } = await supabase
      .from('grid_findings')
      .update({ review_status: decision, reviewed_by: reviewedBy, reviewed_at: reviewedAt })
      .eq('id', findingId)
      .select('id, utility_id, asset_id, severity, risk_score, summary, recommended_action, review_status, reviewed_by, reviewed_at')
      .maybeSingle();

    if (error) throw error;
    if (!finding) return json({ error: 'Finding not found.' }, 404);

    let workOrder = null;
    if (decision === 'confirmed') {
      const { data: existing } = await supabase
        .from('grid_work_orders')
        .select('id, status, priority, approved_by, approved_at')
        .eq('finding_id', finding.id)
        .maybeSingle();

      if (existing) {
        workOrder = existing;
      } else {
        const { data: created } = await supabase
          .from('grid_work_orders')
          .insert({
            utility_id: finding.utility_id,
            finding_id: finding.id,
            asset_id: finding.asset_id,
            status: 'recommended',
            priority: finding.severity,
            recommended_action: finding.recommended_action,
            metadata: { source: 'human_review' },
          })
          .select('id, status, priority, approved_by, approved_at')
          .single();
        workOrder = created || null;
      }
    }

    return json({ finding, workOrder, externalActionsTaken: false, note: 'Review changes local Aridon state only. GIS writes and dispatch remain separately gated.' });
  } catch (error) {
    console.error('Aridon grid finding review error', error instanceof Error ? error.message : error);
    return json({ error: 'Unable to review the grid finding.' }, 400);
  }
}
