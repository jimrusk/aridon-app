import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
const NO_STORE = { 'Cache-Control': 'no-store' };
const CUSTOMER_SESSION_URL = 'https://pkshvdobcsoowlkoolmt.supabase.co/functions/v1/customer-session';

export async function GET(request: NextRequest) {
  try {
    const authorization = request.headers.get('authorization') || '';
    if (!authorization.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Customer login required.' }, { status: 401, headers: NO_STORE });
    }

    const response = await fetch(CUSTOMER_SESSION_URL, {
      method: 'GET',
      headers: { Authorization: authorization },
      cache: 'no-store',
    });

    const result = await response.json().catch(() => ({}));
    return NextResponse.json(result, { status: response.status, headers: NO_STORE });
  } catch (error) {
    console.error('Customer me error', error);
    return NextResponse.json({ error: 'Unable to load the customer account.' }, { status: 500, headers: NO_STORE });
  }
}
