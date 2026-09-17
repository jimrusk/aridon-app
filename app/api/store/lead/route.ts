import { NextRequest, NextResponse } from 'next/server';
import { getServerClient } from '../../../../lib/supabase';
import { recordStoreEvent, STORE_TENANT_SLUG } from '../../../../lib/storefront';

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
    const phone = text(body?.phone, 60);
    const company = text(body?.company, 160);
    const notes = text(body?.notes, 1800);
    const category = text(body?.category, 80);
    const productId = text(body?.productId, 80);
    const requestedInterest = text(body?.productInterest, 250);
    const source = text(body?.source, 200) || 'aridon-market';
    const sourceUrl = text(body?.sourceUrl, 1200);
    const visitorId = text(body?.visitorId, 120);
    const sessionId = text(body?.sessionId, 120);
    if (!name || !validEmail(email)) return NextResponse.json({ error: 'Name and a valid email are required.' }, { status: 400, headers: NO_STORE });

    const db = getServerClient();
    const tenantResult = await db.from('customer_tenants').select('id').eq('slug', STORE_TENANT_SLUG).maybeSingle();
    if (tenantResult.error || !tenantResult.data) throw tenantResult.error || new Error('Store tenant not found.');
    const tenantId = tenantResult.data.id;

    let productInterest = requestedInterest || category || 'Aridon Market';
    let estimatedValue: number | null = null;
    let verifiedProductId: string | null = null;
    if (productId) {
      const productResult = await db.from('commerce_products').select('id,title,selling_price').eq('tenant_id', tenantId).eq('id', productId).maybeSingle();
      if (productResult.data) {
        verifiedProductId = productResult.data.id;
        productInterest = String(productResult.data.title || productInterest);
        const price = Number(productResult.data.selling_price || 0);
        estimatedValue = Number.isFinite(price) && price > 0 ? price : null;
      }
    }

    const insert = await db.from('commerce_leads').insert({
      tenant_id: tenantId,
      created_by: null,
      name,
      email,
      phone: phone || null,
      company: company || null,
      product_interest: productInterest,
      estimated_value: estimatedValue,
      stage: 'New',
      next_step: 'Confirm supplier authorization, availability, freight and pricing; then reply to the customer.',
      notes: [notes, category ? `Category: ${category}` : '', verifiedProductId ? `Product ID: ${verifiedProductId}` : ''].filter(Boolean).join('\n'),
      source,
      source_url: sourceUrl || null,
      session_id: sessionId || null,
    }).select('id').single();
    if (insert.error) throw insert.error;

    await recordStoreEvent({ tenantId, eventName: 'lead_submitted', productId: verifiedProductId, visitorId, sessionId, url: sourceUrl, data: { category, leadId: insert.data.id } });
    return NextResponse.json({ ok: true, leadId: insert.data.id }, { headers: NO_STORE });
  } catch (error) {
    console.error('store lead failed', error);
    return NextResponse.json({ error: 'We could not save that request. Please try again.' }, { status: 500, headers: NO_STORE });
  }
}
