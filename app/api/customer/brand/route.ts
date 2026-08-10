import { NextRequest, NextResponse } from 'next/server';
import { authenticatedCustomer, customerTenantForUser, subscriptionAllowsAccess } from '../../../../lib/customerAuth';

export const runtime = 'nodejs';
const NO_STORE = { 'Cache-Control': 'no-store' };
const BRAND_TITLE = 'Aridon Brand Brain';

type BrandProfile = {
  brand_voice: string;
  audiences: string;
  products_services: string;
  approved_claims: string;
  restricted_claims: string;
  differentiators: string;
  calls_to_action: string;
  website_url: string;
  notes: string;
};

const EMPTY_BRAND: BrandProfile = {
  brand_voice: '',
  audiences: '',
  products_services: '',
  approved_claims: '',
  restricted_claims: '',
  differentiators: '',
  calls_to_action: '',
  website_url: '',
  notes: '',
};

function text(value: unknown, max: number) {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

function cleanBrand(value: unknown): BrandProfile {
  const source = value && typeof value === 'object' ? value as Record<string, unknown> : {};
  return {
    brand_voice: text(source.brand_voice, 4000),
    audiences: text(source.audiences, 6000),
    products_services: text(source.products_services, 8000),
    approved_claims: text(source.approved_claims, 8000),
    restricted_claims: text(source.restricted_claims, 8000),
    differentiators: text(source.differentiators, 6000),
    calls_to_action: text(source.calls_to_action, 4000),
    website_url: text(source.website_url, 500),
    notes: text(source.notes, 8000),
  };
}

async function resolveMembership(request: NextRequest, slug: string) {
  const auth = await authenticatedCustomer(request);
  if (!auth.ok) return { error: auth.error, status: auth.status } as const;
  const membership = await customerTenantForUser(auth.user.id, slug);
  if (!membership) return { error: 'You do not have access to this workspace.', status: 403 } as const;
  if (!subscriptionAllowsAccess(membership.tenant.subscription_status)) return { error: 'This workspace is not active.', status: 402 } as const;
  return { auth, membership } as const;
}

function parseBrand(content: string | null | undefined) {
  if (!content) return EMPTY_BRAND;
  try {
    return cleanBrand(JSON.parse(content));
  } catch {
    return { ...EMPTY_BRAND, notes: content.slice(0, 8000) };
  }
}

export async function GET(request: NextRequest) {
  try {
    const slug = text(request.nextUrl.searchParams.get('slug'), 80);
    if (!slug) return NextResponse.json({ error: 'Workspace is required.' }, { status: 400, headers: NO_STORE });
    const resolved = await resolveMembership(request, slug);
    if ('error' in resolved) return NextResponse.json({ error: resolved.error }, { status: resolved.status, headers: NO_STORE });

    const { data, error } = await resolved.auth.db
      .from('customer_knowledge')
      .select('id,content,created_at')
      .eq('tenant_id', resolved.membership.tenant.id)
      .eq('title', BRAND_TITLE)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw error;

    return NextResponse.json({
      brand: parseBrand(data?.content),
      company: {
        business_name: resolved.membership.tenant.business_name,
        industry: resolved.membership.tenant.industry,
        tagline: resolved.membership.tenant.tagline,
        primary_color: resolved.membership.tenant.primary_color,
        accent_color: resolved.membership.tenant.accent_color,
      },
    }, { headers: NO_STORE });
  } catch (error) {
    console.error('Customer brand GET error', error);
    return NextResponse.json({ error: 'Unable to load the Brand Brain.' }, { status: 500, headers: NO_STORE });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const slug = text(body?.slug, 80);
    if (!slug) return NextResponse.json({ error: 'Workspace is required.' }, { status: 400, headers: NO_STORE });
    const brand = cleanBrand(body?.brand);
    const resolved = await resolveMembership(request, slug);
    if ('error' in resolved) return NextResponse.json({ error: resolved.error }, { status: resolved.status, headers: NO_STORE });

    const db = resolved.auth.db;
    const { data: existing, error: existingError } = await db
      .from('customer_knowledge')
      .select('id')
      .eq('tenant_id', resolved.membership.tenant.id)
      .eq('title', BRAND_TITLE)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (existingError) throw existingError;

    const content = JSON.stringify(brand);
    if (existing?.id) {
      const { error } = await db.from('customer_knowledge').update({ category: 'brand brain', content }).eq('id', existing.id).eq('tenant_id', resolved.membership.tenant.id);
      if (error) throw error;
    } else {
      const { error } = await db.from('customer_knowledge').insert({ tenant_id: resolved.membership.tenant.id, title: BRAND_TITLE, category: 'brand brain', content });
      if (error) throw error;
    }

    await db.from('customer_usage_events').insert({
      tenant_id: resolved.membership.tenant.id,
      user_id: resolved.auth.user.id,
      event_name: 'brand_brain_saved',
      event_data: { has_website: Boolean(brand.website_url), has_claims: Boolean(brand.approved_claims) },
    });

    return NextResponse.json({ saved: true, brand }, { headers: NO_STORE });
  } catch (error) {
    console.error('Customer brand POST error', error);
    return NextResponse.json({ error: 'Unable to save the Brand Brain.' }, { status: 500, headers: NO_STORE });
  }
}
