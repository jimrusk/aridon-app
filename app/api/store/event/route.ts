import { NextRequest, NextResponse } from 'next/server';
import { getServerClient } from '../../../../lib/supabase';
import { recordStoreEvent, STORE_TENANT_SLUG } from '../../../../lib/storefront';

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
    const db = getServerClient();
    const tenant = await db.from('customer_tenants').select('id').eq('slug', STORE_TENANT_SLUG).maybeSingle();
    if (!tenant.data?.id) return NextResponse.json({ ok: false }, { status: 404, headers: NO_STORE });
    let productId: string | null = null;
    const requestedProductId = text(body?.productId, 80);
    if (requestedProductId) {
      const product = await db.from('commerce_products').select('id').eq('tenant_id', tenant.data.id).eq('id', requestedProductId).maybeSingle();
      if (product.data?.id) productId = product.data.id;
    }
    const rawData = body?.data && typeof body.data === 'object' && !Array.isArray(body.data) ? body.data : {};
    const safeData = Object.fromEntries(Object.entries(rawData).slice(0, 12).map(([key,value]) => [key.slice(0,80), typeof value === 'string' ? value.slice(0,300) : value]));
    await recordStoreEvent({
      tenantId: tenant.data.id,
      eventName: eventName as 'store_view' | 'category_view' | 'product_view',
      productId,
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
