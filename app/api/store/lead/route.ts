import { NextRequest, NextResponse } from 'next/server';
import { storeWrite } from '../../../../lib/storefront';

export const runtime = 'nodejs';
const NO_STORE = { 'Cache-Control': 'no-store' };

function text(value: unknown, max: number) {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

function validEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) && value.length <= 180;
}

export async function POST(request: NextRequest) {
  try {
    if (!request.headers.get('content-type')?.includes('application/json')) return NextResponse.json({ error: 'JSON required.' }, { status: 415, headers: NO_STORE });
    const body = await request.json();
    if (text(body?.website, 200)) return NextResponse.json({ ok: true }, { headers: NO_STORE });

    const name = text(body?.name, 120);
    const email = text(body?.email, 180).toLowerCase();
    if (!name || !validEmail(email)) return NextResponse.json({ error: 'Name and a valid email are required.' }, { status: 400, headers: NO_STORE });

    const result = await storeWrite('lead', {
      name,
      email,
      phone: text(body?.phone, 60),
      company: text(body?.company, 160),
      notes: text(body?.notes, 1800),
      category: text(body?.category, 80),
      productId: text(body?.productId, 80),
      productInterest: text(body?.productInterest, 250),
      source: text(body?.source, 200) || 'aridon-market',
      sourceUrl: text(body?.sourceUrl, 1200),
      visitorId: text(body?.visitorId, 120),
      sessionId: text(body?.sessionId, 120),
    });
    return NextResponse.json({ ok: true, leadId: result.leadId || null }, { headers: NO_STORE });
  } catch (error) {
    console.error('store lead failed', error);
    return NextResponse.json({ error: 'We could not save that request. Please try again.' }, { status: 500, headers: NO_STORE });
  }
}
