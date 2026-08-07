import { NextRequest, NextResponse } from 'next/server';
import { authenticatedCustomer, customerTenantForUser } from '../../../../lib/customerAuth';
import { ingestPublicWebsite } from '../../../../lib/websiteIngestion';

export const runtime = 'nodejs';
const NO_STORE = { 'Cache-Control': 'no-store' };

function cleanWebsite(value: unknown) {
  if (typeof value !== 'string') return '';
  return value.trim().slice(0, 500);
}

export async function POST(request: NextRequest) {
  try {
    const auth = await authenticatedCustomer(request);
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status, headers: NO_STORE });

    const membership = await customerTenantForUser(auth.user.id);
    if (!membership?.tenant?.id) {
      return NextResponse.json({ error: 'No customer workspace was found for this account.' }, { status: 404, headers: NO_STORE });
    }

    const body = request.headers.get('content-type')?.includes('application/json') ? await request.json().catch(() => ({})) : {};
    let website = cleanWebsite(body?.website);

    if (!website) {
      const { data, error } = await auth.db
        .from('customer_knowledge')
        .select('content')
        .eq('tenant_id', membership.tenant.id)
        .eq('title', 'Company website')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      website = cleanWebsite(data?.content);
    }

    if (!website) {
      return NextResponse.json({ error: 'Add a company website before refreshing website knowledge.' }, { status: 400, headers: NO_STORE });
    }

    const ingestion = await ingestPublicWebsite(website);

    const { error: deleteError } = await auth.db
      .from('customer_knowledge')
      .delete()
      .eq('tenant_id', membership.tenant.id)
      .eq('title', 'Public website intelligence');
    if (deleteError) throw deleteError;

    const { error: insertError } = await auth.db.from('customer_knowledge').insert({
      tenant_id: membership.tenant.id,
      title: 'Public website intelligence',
      category: 'website intelligence',
      content: ingestion.knowledge,
    });
    if (insertError) throw insertError;

    const { error: eventError } = await auth.db.from('customer_usage_events').insert({
      tenant_id: membership.tenant.id,
      user_id: auth.user.id,
      event_name: 'website_knowledge_refreshed',
      event_data: { website: ingestion.canonicalUrl, pages: ingestion.pages.length },
    });
    if (eventError) console.error('Website refresh usage event error', eventError);

    return NextResponse.json(
      {
        refreshed: true,
        website: ingestion.canonicalUrl,
        pages: ingestion.pages.length,
        contacts: ingestion.contacts.length,
      },
      { headers: NO_STORE },
    );
  } catch (error) {
    console.error('Customer website ingestion refresh error', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'The website could not be refreshed.' },
      { status: 500, headers: NO_STORE },
    );
  }
}
