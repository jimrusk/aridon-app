import { NextRequest, NextResponse } from 'next/server';
import { getServerClient } from '../../../../lib/supabase';

const NO_STORE = { 'Cache-Control': 'no-store' };

function text(value: unknown, max: number) {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 63);
}

export async function POST(request: NextRequest) {
  try {
    if (!request.headers.get('content-type')?.includes('application/json')) {
      return NextResponse.json({ error: 'Content-Type must be application/json.' }, { status: 415, headers: NO_STORE });
    }
    const body = await request.json();
    const businessName = text(body?.businessName, 180);
    const ownerName = text(body?.ownerName, 120);
    const contactEmail = text(body?.contactEmail, 254);
    const industry = text(body?.industry, 160);
    const tagline = text(body?.tagline, 240);
    const plan = ['launch','growth','command'].includes(text(body?.plan, 30).toLowerCase()) ? text(body?.plan, 30).toLowerCase() : 'launch';
    const requestedSlug = slugify(text(body?.slug, 80) || businessName);
    const primaryColor = /^#[0-9a-fA-F]{6}$/.test(text(body?.primaryColor, 7)) ? text(body?.primaryColor, 7) : '#0B1020';
    const accentColor = /^#[0-9a-fA-F]{6}$/.test(text(body?.accentColor, 7)) ? text(body?.accentColor, 7) : '#72D6B2';

    if (!businessName || !requestedSlug || !/^\S+@\S+\.\S+$/.test(contactEmail)) {
      return NextResponse.json({ error: 'Business name, valid email and workspace slug are required.' }, { status: 400, headers: NO_STORE });
    }

    const db = getServerClient();
    const { data, error } = await db.from('customer_tenants').insert({
      slug: requestedSlug,
      business_name: businessName,
      owner_name: ownerName,
      contact_email: contactEmail,
      industry,
      tagline,
      primary_color: primaryColor,
      accent_color: accentColor,
      plan,
      status: 'onboarding',
    }).select('id,slug,business_name,status').single();

    if (error) throw error;
    return NextResponse.json({ tenant: data, workspaceUrl: `/workspace/${data.slug}` }, { status: 201, headers: NO_STORE });
  } catch (error) {
    console.error('Customer tenant provisioning error', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to provision customer tenant.' }, { status: 500, headers: NO_STORE });
  }
}
