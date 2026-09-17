import 'server-only';

import { createHash } from 'crypto';
import { getPublicServerClient } from './supabase';

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
  return {
    id: String(row?.id || ''),
    slug: String(row?.slug || ''),
    title: String(row?.title || ''),
    category: String(row?.category || 'general'),
    description: String(row?.description || ''),
    sellingPrice: asNumber(row?.selling_price),
    freightCost: asNumber(row?.freight_cost),
    quoteOnly: Boolean(row?.quote_only),
    shippingNote: String(row?.shipping_note || ''),
    availability: String(row?.availability || ''),
    warranty: String(row?.warranty || ''),
    imageUrls: asStringArray(row?.image_urls),
    specs: asRecord(row?.specs),
    supplierName: String(row?.supplier_name || ''),
  };
}

export function storeBridgeToken() {
  const stripeSecret = process.env.STRIPE_SECRET_KEY?.trim();
  if (!stripeSecret) throw new Error('STRIPE_SECRET_KEY is not configured.');
  return createHash('sha256').update(`aridon-store-bridge-v1:${stripeSecret}`).digest('hex');
}

export async function storeWrite(operation: 'event' | 'lead' | 'create_order' | 'attach_checkout' | 'checkout_error' | 'mark_paid', payload: Record<string, unknown>) {
  const db = getPublicServerClient();
  const { data, error } = await db.rpc('aridon_store_write', {
    p_bridge_token: storeBridgeToken(),
    p_operation: operation,
    p_payload: payload,
  });
  if (error) throw new Error(error.message);
  return (data && typeof data === 'object' ? data : {}) as Record<string, any>;
}

export async function getStoreContext() {
  const db = getPublicServerClient();
  const { data, error } = await db.rpc('aridon_storefront_context');
  if (error) throw new Error(error.message);
  if (!data || typeof data !== 'object') throw new Error('Storefront is not enabled.');
  const raw = data as any;
  const tenant = raw.tenant || {};
  const profile = raw.profile || {};
  if (!profile.public_store_enabled) throw new Error('Storefront is not enabled.');
  const categories: StoreCategory[] = Array.isArray(profile.categories)
    ? profile.categories
      .filter((item: any) => item && typeof item.slug === 'string' && typeof item.name === 'string')
      .map((item: any) => ({ slug: item.slug, name: item.name, description: String(item.description || '') }))
    : [];
  return {
    tenant,
    profile,
    categories,
    showrooms: Array.isArray(raw.showrooms) ? raw.showrooms : [],
    products: Array.isArray(raw.products) ? raw.products.map(mapProduct) : [],
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
  const db = getPublicServerClient();
  const { data, error } = await db.rpc('aridon_storefront_product', { p_slug: productSlug.slice(0, 180) });
  if (error || !data || typeof data !== 'object') return null;
  const row = data as any;
  return { tenantId: String(row.tenant_id || ''), raw: row, product: mapProduct(row) };
}

export async function recordStoreEvent(input: {
  tenantId?: string;
  eventName: 'store_view' | 'category_view' | 'product_view' | 'lead_submitted' | 'checkout_started' | 'purchase';
  productId?: string | null;
  visitorId?: string | null;
  sessionId?: string | null;
  url?: string | null;
  data?: Record<string, unknown>;
}) {
  await storeWrite('event', {
    eventName: input.eventName,
    productId: input.productId || '',
    visitorId: input.visitorId?.slice(0, 120) || '',
    sessionId: input.sessionId?.slice(0, 120) || '',
    url: input.url?.slice(0, 1200) || '',
    data: input.data || {},
  });
}

export function money(value: number, currency = 'USD') {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(value);
}
