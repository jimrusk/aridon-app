import { createHash, randomBytes } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { getServerClient } from '../../../../lib/supabase';
import { appBaseUrl } from '../../../../lib/stripeBilling';

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
    const businessName = text(body?.businessName, 180);
    const ownerName = text(body?.ownerName, 120);
    const email = text(body?.email, 254).toLowerCase();
    const industry = text(body?.industry, 160);
    const feedbackContact = text(body?.feedbackContact, 254);
    const days = Math.min(Math.max(Number(body?.days || 14), 1), 60);

    if (!businessName || !ownerName || !industry || !/^\S+@\S+\.\S+$/.test(email)) {
      return NextResponse.json({ error: 'Business, owner, industry and valid email are required.' }, { status: 400, headers: NO_STORE });
    }

    const token = randomBytes(32).toString('base64url');
    const tokenHash = createHash('sha256').update(token).digest('hex');
    const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
    const db = getServerClient();
    const { data, error } = await db
      .from('customer_beta_invites')
      .insert({
        token_hash: tokenHash,
        business_name: businessName,
        owner_name: ownerName,
        email,
        industry,
        feedback_contact: feedbackContact || null,
        expires_at: expiresAt,
      })
      .select('id,expires_at')
      .single();
    if (error) throw error;

    const url = `${appBaseUrl(request)}/business-os/beta?invite=${encodeURIComponent(token)}`;
    return NextResponse.json({ created: true, inviteId: data.id, expiresAt: data.expires_at, url }, { status: 201, headers: NO_STORE });
  } catch (error) {
    console.error('Beta invite creation error', error);
    return NextResponse.json({ error: 'The beta invite could not be created.' }, { status: 500, headers: NO_STORE });
  }
}
