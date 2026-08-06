import { createHash } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { activateBetaTenant } from '../../../../../lib/customerProvisioning';
import { getServerClient } from '../../../../../lib/supabase';

export const runtime = 'nodejs';
const NO_STORE = { 'Cache-Control': 'no-store' };

function text(value: unknown, max: number) {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

export async function POST(request: NextRequest) {
  try {
    if (!request.headers.get('content-type')?.includes('application/json')) {
      return NextResponse.json({ error: 'Content-Type must be application/json.' }, { status: 415, headers: NO_STORE });
    }

    const body = await request.json();
    const inviteToken = text(body?.invite, 500);
    const password = text(body?.password, 500);
    if (!inviteToken || password.length < 12) {
      return NextResponse.json({ error: 'A valid beta invitation and a password with at least 12 characters are required.' }, { status: 400, headers: NO_STORE });
    }

    const tokenHash = createHash('sha256').update(inviteToken).digest('hex');
    const db = getServerClient();
    const { data: invite, error: inviteError } = await db
      .from('customer_beta_invites')
      .select('id,business_name,owner_name,email,industry,feedback_contact,expires_at,used_at')
      .eq('token_hash', tokenHash)
      .maybeSingle();

    if (inviteError) throw inviteError;
    if (!invite || invite.used_at) {
      return NextResponse.json({ error: 'This beta invitation is invalid or has already been used.' }, { status: 410, headers: NO_STORE });
    }
    if (Date.parse(invite.expires_at) <= Date.now()) {
      return NextResponse.json({ error: 'This beta invitation has expired.' }, { status: 410, headers: NO_STORE });
    }

    const activated = await activateBetaTenant({
      businessName: invite.business_name,
      ownerName: invite.owner_name,
      email: invite.email,
      industry: invite.industry,
      password,
      feedbackContact: invite.feedback_contact || '',
    });

    const { data: marked, error: markError } = await db
      .from('customer_beta_invites')
      .update({ used_at: new Date().toISOString(), tenant_id: activated.tenant.id })
      .eq('id', invite.id)
      .is('used_at', null)
      .select('id')
      .maybeSingle();
    if (markError) throw markError;
    if (!marked) {
      return NextResponse.json({ error: 'This invitation was already claimed.' }, { status: 409, headers: NO_STORE });
    }

    return NextResponse.json(
      {
        activated: true,
        existingAccount: activated.existingAccount,
        email: activated.email,
        tenant: { slug: activated.tenant.slug, businessName: activated.tenant.business_name },
      },
      { status: 201, headers: NO_STORE },
    );
  } catch (error) {
    console.error('Beta activation error', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'The beta workspace could not be activated.' },
      { status: 500, headers: NO_STORE },
    );
  }
}
