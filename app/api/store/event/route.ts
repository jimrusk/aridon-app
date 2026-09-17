import { NextRequest, NextResponse } from 'next/server';
import { recordStoreEvent } from '../../../../lib/storefront';

export const runtime = 'nodejs';
const NO_STORE = { 'Cache-Control': 'no-store' };
const ALLOWED = new Set(['store_view','category_view','product_view']);

function text(value: unknown, max: number) { return typeof value === 'string' ? value.trim().slice(0, max) : ''; }

export async function POST(request: NextRequest) {
  try {
    if (!request.headers.get('content-type')?.includes('application/json')) return NextResponse.json({ ok: false }, { status: 415, headers: NO_STORE });
    const body = await request.json();
    const eventName = text(body?.eventName, 40);
    if (!ALLOWED.has(eventName)) return NextResponse.json({ ok: false }, { status: 400, headers: NO_STORE });
    const rawData = body?.data && typeof body.data === 'object' && !Array.isArray(body.data) ? body.data : {};
    const safeData = Object.fromEntries(Object.entries(rawData).slice(0, 12).map(([key,value]) => [key.slice(0,80), typeof value === 'string' ? value.slice(0,300) : value]));
    await recordStoreEvent({
      eventName: eventName as 'store_view' | 'category_view' | 'product_view',
      productId: text(body?.productId, 80) || null,
      visitorId: text(body?.visitorId, 120),
      sessionId: text(body?.sessionId, 120),
      url: text(body?.url, 1200),
      data: safeData,
    });
    return NextResponse.json({ ok: true }, { headers: NO_STORE });
  } catch {
    return NextResponse.json({ ok: false }, { headers: NO_STORE });
  }
}
