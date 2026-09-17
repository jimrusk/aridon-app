import { NextRequest, NextResponse } from 'next/server';
import { getServerClient } from '../../../../lib/supabase';
import { recordStoreEvent, STORE_TENANT_SLUG } from '../../../../lib/storefront';

export const runtime = 'nodejs';
export const maxDuration = 30;
const NO_STORE = { 'Cache-Control': 'no-store' };

function clean(value: unknown, max: number) { return typeof value === 'string' ? value.trim().slice(0, max) : ''; }
function requiredEnv(name: string) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is not configured.`);
  return value;
}

export async function POST(request: NextRequest) {
  let orderId = '';
  try {
    if (!request.headers.get('content-type')?.includes('application/json')) return NextResponse.json({ error: 'JSON required.' }, { status: 415, headers: NO_STORE });
    const body = await request.json();
    const productId = clean(body?.productId, 80);
    if (!productId) return NextResponse.json({ error: 'A product is required.' }, { status: 400, headers: NO_STORE });

    const db = getServerClient();
    const tenant = await db.from('customer_tenants').select('id').eq('slug', STORE_TENANT_SLUG).maybeSingle();
    if (tenant.error || !tenant.data?.id) throw tenant.error || new Error('Store tenant not found.');
    const tenantId = tenant.data.id;
    const owner = await db.from('customer_memberships').select('user_id').eq('tenant_id', tenantId).eq('role', 'owner').limit(1).maybeSingle();
    if (owner.error || !owner.data?.user_id) throw owner.error || new Error('Store owner not found.');

    const productResult = await db.from('commerce_products')
      .select('id,slug,title,description,selling_price,supplier_cost,freight_cost,quote_only,status,currency:tenant_id,commerce_suppliers!inner(id,name,status)')
      .eq('tenant_id', tenantId)
      .eq('id', productId)
      .eq('status', 'Live')
      .eq('commerce_suppliers.status', 'Approved')
      .maybeSingle();
    if (productResult.error) throw productResult.error;
    const row: any = productResult.data;
    if (!row) return NextResponse.json({ error: 'This product is not available for direct checkout.' }, { status: 409, headers: NO_STORE });
    if (row.quote_only) return NextResponse.json({ error: 'This product requires a verified quote before purchase.' }, { status: 409, headers: NO_STORE });
    const salePrice = Number(row.selling_price || 0);
    const supplierCost = Number(row.supplier_cost || 0);
    const freightCost = Math.max(0, Number(row.freight_cost || 0));
    if (!Number.isFinite(salePrice) || salePrice <= 0) return NextResponse.json({ error: 'Verified product pricing is not available yet.' }, { status: 409, headers: NO_STORE });

    const order = await db.from('commerce_orders').insert({
      tenant_id: tenantId,
      created_by: owner.data.user_id,
      product_id: row.id,
      sale_price: salePrice,
      supplier_cost: Number.isFinite(supplierCost) ? supplierCost : 0,
      freight_cost: freightCost,
      ad_cost: 0,
      other_cost: 0,
      status: 'Pending',
      currency: 'usd',
      payment_status: 'unpaid',
    }).select('id').single();
    if (order.error) throw order.error;
    orderId = order.data.id;

    const secret = requiredEnv('STRIPE_SECRET_KEY');
    const baseUrl = (process.env.NEXT_PUBLIC_APP_URL?.trim() || request.nextUrl.origin).replace(/\/$/, '');
    const form = new URLSearchParams();
    form.set('mode', 'payment');
    form.set('success_url', `${baseUrl}/shop/success?session_id={CHECKOUT_SESSION_ID}`);
    form.set('cancel_url', `${baseUrl}/shop/product/${encodeURIComponent(String(row.slug || ''))}`);
    form.set('shipping_address_collection[allowed_countries][0]', 'US');
    form.set('phone_number_collection[enabled]', 'true');
    form.set('line_items[0][quantity]', '1');
    form.set('line_items[0][price_data][currency]', 'usd');
    form.set('line_items[0][price_data][unit_amount]', String(Math.round(salePrice * 100)));
    form.set('line_items[0][price_data][product_data][name]', String(row.title || 'Aridon Market product').slice(0, 250));
    if (row.description) form.set('line_items[0][price_data][product_data][description]', String(row.description).slice(0, 450));
    if (freightCost > 0) {
      form.set('line_items[1][quantity]', '1');
      form.set('line_items[1][price_data][currency]', 'usd');
      form.set('line_items[1][price_data][unit_amount]', String(Math.round(freightCost * 100)));
      form.set('line_items[1][price_data][product_data][name]', 'Freight / delivery reserve');
      form.set('line_items[1][price_data][product_data][description]', 'Freight reserve shown by Aridon Market for this product.');
    }
    if (process.env.STRIPE_AUTOMATIC_TAX?.trim().toLowerCase() === 'true') form.set('automatic_tax[enabled]', 'true');
    form.set('metadata[commerce_order_id]', orderId);
    form.set('metadata[commerce_product_id]', row.id);
    form.set('metadata[tenant_id]', tenantId);
    form.set('metadata[channel]', 'aridon-market');

    const stripe = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${secret}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        'Idempotency-Key': `aridon-market-${orderId}`,
      },
      body: form,
      cache: 'no-store',
    });
    const session = await stripe.json() as { id?: string; url?: string; error?: { message?: string } };
    if (!stripe.ok || !session.id || !session.url) throw new Error(session.error?.message || `Stripe checkout returned ${stripe.status}.`);

    const update = await db.from('commerce_orders').update({ stripe_checkout_session_id: session.id, updated_at: new Date().toISOString() }).eq('id', orderId).eq('tenant_id', tenantId);
    if (update.error) throw update.error;
    await recordStoreEvent({
      tenantId,
      eventName: 'checkout_started',
      productId: row.id,
      visitorId: clean(body?.visitorId, 120),
      sessionId: clean(body?.sessionId, 120),
      url: clean(body?.sourceUrl, 1200),
      data: { orderId, checkoutSessionId: session.id, salePrice, freightCost },
    });

    return NextResponse.json({ ok: true, url: session.url }, { headers: NO_STORE });
  } catch (error) {
    console.error('store checkout failed', error);
    if (orderId) {
      try { await getServerClient().from('commerce_orders').update({ status: 'Cancelled', payment_status: 'checkout_error', updated_at: new Date().toISOString() }).eq('id', orderId); } catch { /* preserve original error */ }
    }
    return NextResponse.json({ error: error instanceof Error && /STRIPE_SECRET_KEY/.test(error.message) ? 'Secure checkout is being connected. Please request a quote for now.' : 'Checkout could not be opened. Please request a quote and we will help you.' }, { status: 503, headers: NO_STORE });
  }
}
