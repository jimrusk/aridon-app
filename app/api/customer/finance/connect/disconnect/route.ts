import { NextRequest, NextResponse } from 'next/server';
import { authenticatedCustomer, customerTenantForUser } from '../../../../../../lib/customerAuth';
import { cleanFinanceText, deleteFinanceSecret, financeProviderCatalog, type FinanceProvider } from '../../../../../../lib/financeConnectors';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const NO_STORE = { 'Cache-Control': 'no-store' };

export async function POST(request: NextRequest) {
  try {
    const auth = await authenticatedCustomer(request);
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status, headers: NO_STORE });
    const body = await request.json();
    const slug = cleanFinanceText(body?.slug, 80);
    const provider = cleanFinanceText(body?.provider, 80) as FinanceProvider;
    const membership = await customerTenantForUser(auth.user.id, slug, auth.token);
    if (!membership) return NextResponse.json({ error: 'You do not have access to this workspace.' }, { status: 403, headers: NO_STORE });
    const entry = financeProviderCatalog.find((item) => item.key === provider);
    if (!entry) return NextResponse.json({ error: 'Unknown finance connector.' }, { status: 400, headers: NO_STORE });

    if (['plaid', 'quickbooks', 'stripe-connect'].includes(provider)) await deleteFinanceSecret(membership.tenant.id, provider);
    const { error } = await auth.db.from('customer_finance_connections').upsert({
      tenant_id: membership.tenant.id,
      provider,
      label: entry.label,
      status: 'disconnected',
      external_account_id: null,
      company_name: null,
      capabilities: entry.capabilities,
      metadata: {},
      last_sync_at: null,
      last_error: null,
      created_by: auth.user.id,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'tenant_id,provider' });
    if (error) throw error;
    return NextResponse.json({ ok: true, provider }, { headers: NO_STORE });
  } catch (error) {
    console.error('Finance disconnect error', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to disconnect finance system.' }, { status: 500, headers: NO_STORE });
  }
}
