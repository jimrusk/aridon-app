import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const OWNER_PASSWORD_URL = 'https://pkshvdobcsoowlkoolmt.supabase.co/functions/v1/aridon-owner-password';
const NO_STORE = { 'Cache-Control': 'no-store' };

export async function POST(request: NextRequest) {
  try {
    const authorization = request.headers.get('authorization') || '';
    if (!authorization.startsWith('Basic ')) {
      return NextResponse.json({ error: 'Command Center authorization required.' }, { status: 401, headers: NO_STORE });
    }

    const body = await request.json().catch(() => ({}));
    const password = typeof body?.password === 'string' ? body.password : '';

    const response = await fetch(OWNER_PASSWORD_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-aridon-basic-auth': authorization,
      },
      body: JSON.stringify({ password }),
      cache: 'no-store',
    });

    const result = await response.json().catch(() => ({}));
    return NextResponse.json(result, { status: response.status, headers: NO_STORE });
  } catch (error) {
    console.error('Owner password setup error', error);
    return NextResponse.json({ error: 'Unable to update the Aridon owner password.' }, { status: 500, headers: NO_STORE });
  }
}
