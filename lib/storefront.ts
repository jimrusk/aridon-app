import 'server-only';

import { getServerClient } from './supabase';

export const STORE_TENANT_SLUG = 'aridon';

export type StoreProduct = {
  id: string;
  slug: string;
  title: string;
  category: string;
  description: string;
  sellingPrice: number;
  freightCost: number;
  quoteOnly: boolean;
  shippingNote: string;
  availability: string;
  warranty: string;
  imageUrls: string[];
  specs: Record<string, unknown>;
  supplierName: string;
};

export type StoreCategory = {
  slug: string;
  name: string;
  description: string;
};

function asNumber(value: unknown) {
  const parsed = Number(value || 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function asStringArray(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string').slice(0, 8) : [];
}

function asRecord(value: unknown) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function mapProduct(row: any): StoreProduct {
  const supplier = Array.isArray(row.commerce_suppliers) ? row.commerce_suppliers[0] : row.commerce_suppliers;
  return {
    id: String(row.id),
    slug: String(row.slug || ''),
    title: String(row.title || ''),
    category: String(row.category || 'general'),
    description: String(row.description || ''),
    sellingPrice: asNumber(row.selling_price),
    freightCost: asNumber(row.freight_cost),
    quoteOnly: Boolean(row.quote_only),
    shippingNote: String(row.shipping_note || ''),
    availability: String(row.availability || ''),
    warranty: String(row.warranty || ''),
    imageUrls: asStringArray(row.image_urls),
    specs: asRecord(row.specs),
    supplierName: String(supplier?.name || ''),
  };
}

export async function getStoreContext() {
  const db = getServerClient();
  const tenantResult = await db.from('customer_tenants').select('id,slug,business_name').eq('slug', STORE_TENANT_SLUG).maybeSingle();
  if (tenantResult.error || !tenantResult.data) throw tenantResult.error || new Error('Store tenant was not found.');
  const tenant = tenantResult.data;

  const [profileResult, showroomResult, productResult] = await Promise.all([
    db.from('commerce_profiles').select('*').eq('tenant_id', tenant.id).maybeSingle(),
    db.from('commerce_showrooms').select('id,name,niche,headline,subheadline,sections,status').eq('tenant_id', tenant.id).eq('status', 'Published').order('created_at', { ascending: true }),
    db.from('commerce_products')
      .select('id,slug,title,category,description,selling_price,freight_cost,quote_only,shipping_note,availability,warranty,image_urls,specs,status,commerce_suppliers!inner(name,status)')
      .eq('tenant_id', tenant.id)
      .eq('status', 'Live')
      .eq('commerce_suppliers.status', 'Approved')
      .order('published_at', { ascending: false, nullsFirst: false }),
  ]);

  if (profileResult.error) throw profileResult.error;
  if (showroomResult.error) throw showroomResult.error;
  if (productResult.error) throw productResult.error;

  const profile = profileResult.data;
  if (!profile?.public_store_enabled) throw new Error('Storefront is not enabled.');
  const categories: StoreCategory[] = Array.isArray(profile.categories)
    ? profile.categories
      .filter((item: any) => item && typeof item.slug === 'string' && typeof item.name === 'string')
      .map((item: any) => ({ slug: item.slug, name: item.name, description: String(item.description || '') }))
    : [];

  return {
    tenant,
    profile,
    categories,
    showrooms: showroomResult.data || [],
    products: (productResult.data || []).map(mapProduct),
  };
}

export async function getCategoryContext(categorySlug: string) {
  const context = await getStoreContext();
  const category = context.categories.find((item) => item.slug === categorySlug);
  if (!category) return null;
  const showroom = context.showrooms.find((item: any) => item.niche === categorySlug) || null;
  return { ...context, category, showroom, products: context.products.filter((item) => item.category === categorySlug) };
}

export async function getPublicProduct(productSlug: string) {
  const db = getServerClient();
  const tenantResult = await db.from('customer_tenants').select('id').eq('slug', STORE_TENANT_SLUG).maybeSingle();
  if (tenantResult.error || !tenantResult.data) return null;
  const result = await db.from('commerce_products')
    .select('id,slug,title,category,description,selling_price,freight_cost,quote_only,shipping_note,availability,warranty,image_urls,specs,status,supplier_cost,commerce_suppliers!inner(id,name,status)')
    .eq('tenant_id', tenantResult.data.id)
    .eq('slug', productSlug)
    .eq('status', 'Live')
    .eq('commerce_suppliers.status', 'Approved')
    .maybeSingle();
  if (result.error || !result.data) return null;
  return { tenantId: tenantResult.data.id, raw: result.data, product: mapProduct(result.data) };
}

export async function recordStoreEvent(input: {
  tenantId: string;
  eventName: 'store_view' | 'category_view' | 'product_view' | 'lead_submitted' | 'checkout_started' | 'purchase';
  productId?: string | null;
  visitorId?: string | null;
  sessionId?: string | null;
  url?: string | null;
  data?: Record<string, unknown>;
}) {
  const db = getServerClient();
  await db.from('commerce_events').insert({
    tenant_id: input.tenantId,
    product_id: input.productId || null,
    visitor_id: input.visitorId?.slice(0, 120) || null,
    session_id: input.sessionId?.slice(0, 120) || null,
    event_name: input.eventName,
    url: input.url?.slice(0, 1200) || null,
    data: input.data || {},
  });
}

export function money(value: number, currency = 'USD') {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(value);
}
