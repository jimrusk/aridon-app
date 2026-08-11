import { NextRequest, NextResponse } from 'next/server';
import { authenticatedCustomer, customerTenantForUser } from '../../../../lib/customerAuth';

export const runtime = 'nodejs';
const NO_STORE = { 'Cache-Control': 'no-store' };
const catalog = [
  { key: 'gmail', label: 'Gmail', category: 'communications', capabilities: ['read','draft','send','monitor'] },
  { key: 'google-calendar', label: 'Google Calendar', category: 'schedule', capabilities: ['read','availability','create','update'] },
  { key: 'github', label: 'GitHub', category: 'engineering', capabilities: ['read','issues','pull requests','code changes'] },
  { key: 'vercel', label: 'Vercel', category: 'deployment', capabilities: ['deployments','logs','production status'] },
  { key: 'supabase', label: 'Supabase', category: 'data', capabilities: ['database','auth','storage','functions'] },
  { key: 'stripe', label: 'Stripe', category: 'revenue', capabilities: ['customers','payments','subscriptions','payment links'] },
  { key: 'analytics', label: 'Analytics', category: 'growth', capabilities: ['traffic','conversion','attribution'] },
  { key: 'ads', label: 'Paid Ads', category: 'growth', capabilities: ['campaigns','spend','lead attribution'] },
  { key: 'crm', label: 'CRM', category: 'revenue', capabilities: ['leads','pipeline','opportunities','follow-up'] },
];
function text(value: unknown, max = 120) { return typeof value === 'string' ? value.trim().slice(0, max) : ''; }

export async function GET(request: NextRequest) {
  try {
    const auth = await authenticatedCustomer(request); if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status, headers: NO_STORE });
    const slug = text(new URL(request.url).searchParams.get('slug'), 80); const membership = await customerTenantForUser(auth.user.id, slug);
    if (!membership) return NextResponse.json({ error: 'You do not have access to this workspace.' }, { status: 403, headers: NO_STORE });
    const { data, error } = await auth.db.from('customer_connectors').select('*').eq('tenant_id', membership.tenant.id); if (error) throw error;
    const state = new Map((data || []).map((item) => [item.connector_key, item]));
    return NextResponse.json({ connectors: catalog.map((item) => ({ ...item, ...(state.get(item.key) || {}), connector_key: item.key })) }, { headers: NO_STORE });
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to load connectors.' }, { status: 500, headers: NO_STORE }); }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await authenticatedCustomer(request); if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status, headers: NO_STORE });
    const body = await request.json(); const slug = text(body?.slug, 80); const key = text(body?.connectorKey, 80); const membership = await customerTenantForUser(auth.user.id, slug);
    if (!membership) return NextResponse.json({ error: 'You do not have access to this workspace.' }, { status: 403, headers: NO_STORE });
    const entry = catalog.find((item) => item.key === key); if (!entry) return NextResponse.json({ error: 'Unknown connector.' }, { status: 400, headers: NO_STORE });
    const status = text(body?.status, 40) || 'available';
    const payload = { tenant_id: membership.tenant.id, connector_key: entry.key, label: entry.label, category: entry.category, status, capabilities: entry.capabilities, updated_at: new Date().toISOString(), last_sync_at: status === 'connected' ? new Date().toISOString() : null };
    const { data, error } = await auth.db.from('customer_connectors').upsert(payload, { onConflict: 'tenant_id,connector_key' }).select('*').single(); if (error) throw error;
    return NextResponse.json({ connector: data }, { headers: NO_STORE });
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to update connector.' }, { status: 500, headers: NO_STORE }); }
}
