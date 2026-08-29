import { NextRequest, NextResponse } from 'next/server';
import { getServerClient } from '../../../../lib/supabase';
import {
  generateAgOperationSnapshot,
  normalizeAgSnapshotInput,
  validateAgSnapshotInput,
} from '../../../../lib/agOperationSnapshot';

export const runtime = 'nodejs';
export const maxDuration = 30;

const NO_STORE = { 'Cache-Control': 'no-store' };

export async function POST(request: NextRequest) {
  try {
    if (!request.headers.get('content-type')?.includes('application/json')) {
      return NextResponse.json({ error: 'Content-Type must be application/json.' }, { status: 415, headers: NO_STORE });
    }

    const body = await request.json();
    if (typeof body?.website === 'string' && body.website.trim()) {
      return NextResponse.json({ error: 'Unable to process this request.' }, { status: 400, headers: NO_STORE });
    }

    const input = normalizeAgSnapshotInput(body);
    const validationError = validateAgSnapshotInput(input);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400, headers: NO_STORE });
    }

    const report = generateAgOperationSnapshot(input);
    let snapshotId: string | null = null;
    let saved = false;

    try {
      const db = getServerClient();
      const { data, error } = await db
        .from('ag_operation_snapshots')
        .insert({
          operation_type: 'cow-calf',
          state: input.state,
          county: input.county,
          breeding_cows: input.breedingCows,
          acres: input.acres,
          owned_percent: input.ownedPercent,
          annual_revenue_range: input.annualRevenueRange,
          top_costs: input.topCosts,
          main_concern: input.mainConcern,
          contact_name: input.contactName || null,
          email: input.email,
          mobile: input.mobile || null,
          consent_email: input.consentEmail,
          consent_sms: input.consentSms,
          report,
          status: 'new',
        })
        .select('id')
        .single();

      if (error) throw error;
      snapshotId = data?.id || null;
      saved = Boolean(snapshotId);
    } catch (error) {
      console.error('Operation Snapshot lead persistence failed', error);
    }

    return NextResponse.json(
      {
        ok: true,
        saved,
        snapshotId,
        input,
        report,
      },
      { status: 201, headers: NO_STORE },
    );
  } catch (error) {
    console.error('Operation Snapshot error', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'The snapshot could not be generated.' },
      { status: 500, headers: NO_STORE },
    );
  }
}
