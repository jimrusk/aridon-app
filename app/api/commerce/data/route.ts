import { NextRequest, NextResponse } from 'next/server';
import { getUserScopedClient } from '../../../../lib/supabase';
import { customerTenantForUser } from '../../../../lib/customerAuth';

export const runtime = 'nodejs';
const NO_STORE = { 'Cache-Control': 'no-store, max-age=0' };

type Entity = 'supplier' | 'product' | 'lead' | 'order' | 'showroom' | 'profile';

const CONFIG: Record<Exclude<Entity, 'profile'>, { table: string; fields: string[] }> = {
  supplier: { table: 'commerce_suppliers', fields: ['name','website','contact','status','score','why_fit','source_url','evidence','discovered_by_ai'] },
  product: { table: 'commerce_products', fields: ['supplier_id','sku','title','product_url','supplier_cost','selling_price','freight_cost','map_price','availability','warranty','status','source'] },
  lead: { table: 'commerce_leads', fields: ['name','company','email','phone','product_interest','estimated_value','stage','next_step','notes'] },
  order: { table: 'commerce_orders', fields: ['lead_id','product_id','customer_name','sale_price','supplier_cost','ad_cost','freight_cost','other_cost','status','ordered_at'] },
  showroom: { table: 'commerce_showrooms', fields: ['name','niche','headline','subheadline','sections','featured_product_ids','status'] },
};

function cleanObject(source: any, allowed: string[]) {
  const out: Record<string, unknown> = {};
  for (const key of allowed) if (Object.prototype.hasOwnProperty.call(source || {}, key)) out[key] = source[key];
  return out;
}

async function context(request: NextRequest, slug?: string) {
  const authorization = request.headers.get('authorization') || '';
  if (!authorization.startsWith('Bearer ')) return { error: 'Sign in to enable Commerce Engine cloud sync.', status: 401 } as const;
  const token = authorization.slice(7).trim();
  const db = getUserScopedClient(token);
  const { data, error } = await db.auth.getUser(token);
  if (error || !data.user) return { error: 'Your Aridon session has expired.', status: 401 } as const;
  const membership = await customerTenantForUser(data.user.id, slug, token);
  if (!membership) return { error: 'You do not have access to an Aridon workspace.', status: 403 } as const;
  return { db, user: data.user, tenant: membership.tenant } as const;
}

export async function GET(request: NextRequest) {
  try {
    const ctx = await context(request, request.nextUrl.searchParams.get('slug') || undefined);
    if ('error' in ctx) return NextResponse.json({ error: ctx.error }, { status: ctx.status, headers: NO_STORE });
    const tenantId = ctx.tenant.id;
    const [profile, suppliers, products, leads, orders, showrooms] = await Promise.all([
      ctx.db.from('commerce_profiles').select('*').eq('tenant_id', tenantId).maybeSingle(),
      ctx.db.from('commerce_suppliers').select('*').eq('tenant_id', tenantId).order('score', { ascending: false }).order('created_at', { ascending: false }),
      ctx.db.from('commerce_products').select('*').eq('tenant_id', tenantId).order('created_at', { ascending: false }),
      ctx.db.from('commerce_leads').select('*').eq('tenant_id', tenantId).order('created_at', { ascending: false }),
      ctx.db.from('commerce_orders').select('*').eq('tenant_id', tenantId).order('created_at', { ascending: false }),
      ctx.db.from('commerce_showrooms').select('*').eq('tenant_id', tenantId).order('created_at', { ascending: false }).limit(10),
    ]);
    for (const result of [profile, suppliers, products, leads, orders, showrooms]) if (result.error) throw result.error;
    return NextResponse.json({
      tenant: { id: tenantId, slug: ctx.tenant.slug, businessName: ctx.tenant.business_name },
      profile: profile.data || null,
      suppliers: suppliers.data || [], products: products.data || [], leads: leads.data || [], orders: orders.data || [], showrooms: showrooms.data || [],
    }, { headers: NO_STORE });
  } catch (error) {
    console.error('commerce data GET failed', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to load commerce data.' }, { status: 500, headers: NO_STORE });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const ctx = await context(request, typeof body?.slug === 'string' ? body.slug : undefined);
    if ('error' in ctx) return NextResponse.json({ error: ctx.error }, { status: ctx.status, headers: NO_STORE });
    const entity = body?.entity as Entity;
    if (entity === 'profile') {
      const record = {
        tenant_id: ctx.tenant.id,
        created_by: ctx.user.id,
        niche: String(body?.record?.niche || 'Commercial greenhouses').slice(0, 250),
        economics: body?.record?.economics && typeof body.record.economics === 'object' ? body.record.economics : {},
        updated_at: new Date().toISOString(),
      };
      const result = await ctx.db.from('commerce_profiles').upsert(record, { onConflict: 'tenant_id' }).select('*').single();
      if (result.error) throw result.error;
      return NextResponse.json({ item: result.data }, { headers: NO_STORE });
    }
    if (!CONFIG[entity as Exclude<Entity,'profile'>]) return NextResponse.json({ error: 'Unknown commerce entity.' }, { status: 400, headers: NO_STORE });
    const cfg = CONFIG[entity as Exclude<Entity,'profile'>];
    const inputRows = Array.isArray(body?.records) ? body.records.slice(0, 100) : [body?.record || {}];
    const rows = inputRows.map((row: any) => ({ ...cleanObject(row, cfg.fields), tenant_id: ctx.tenant.id, created_by: ctx.user.id }));
    if (!rows.length) return NextResponse.json({ error: 'Nothing to save.' }, { status: 400, headers: NO_STORE });
    const result = await ctx.db.from(cfg.table).insert(rows).select('*');
    if (result.error) throw result.error;
    return NextResponse.json({ items: result.data || [] }, { headers: NO_STORE });
  } catch (error) {
    console.error('commerce data POST failed', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to save commerce data.' }, { status: 500, headers: NO_STORE });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const ctx = await context(request, typeof body?.slug === 'string' ? body.slug : undefined);
    if ('error' in ctx) return NextResponse.json({ error: ctx.error }, { status: ctx.status, headers: NO_STORE });
    const entity = body?.entity as Exclude<Entity,'profile'>;
    const id = String(body?.id || '');
    const cfg = CONFIG[entity];
    if (!cfg || !id) return NextResponse.json({ error: 'Entity and id are required.' }, { status: 400, headers: NO_STORE });
    const changes = { ...cleanObject(body?.changes || {}, cfg.fields), updated_at: new Date().toISOString() };
    const result = await ctx.db.from(cfg.table).update(changes).eq('tenant_id', ctx.tenant.id).eq('id', id).select('*').single();
    if (result.error) throw result.error;
    return NextResponse.json({ item: result.data }, { headers: NO_STORE });
  } catch (error) {
    console.error('commerce data PATCH failed', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to update commerce data.' }, { status: 500, headers: NO_STORE });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const ctx = await context(request, typeof body?.slug === 'string' ? body.slug : undefined);
    if ('error' in ctx) return NextResponse.json({ error: ctx.error }, { status: ctx.status, headers: NO_STORE });
    const entity = body?.entity as Exclude<Entity,'profile'>;
    const id = String(body?.id || '');
    const cfg = CONFIG[entity];
    if (!cfg || !id) return NextResponse.json({ error: 'Entity and id are required.' }, { status: 400, headers: NO_STORE });
    const result = await ctx.db.from(cfg.table).delete().eq('tenant_id', ctx.tenant.id).eq('id', id);
    if (result.error) throw result.error;
    return NextResponse.json({ ok: true }, { headers: NO_STORE });
  } catch (error) {
    console.error('commerce data DELETE failed', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to delete commerce data.' }, { status: 500, headers: NO_STORE });
  }
}