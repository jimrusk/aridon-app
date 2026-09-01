import { NextRequest, NextResponse } from 'next/server';
import { graphJson, microsoftAccessToken, MS_EMAIL_COOKIE } from '../../../../lib/microsoft365';
import { auditExecutiveAction } from '../../../../lib/executiveOps';

export const runtime = 'nodejs';
const NO_STORE = { 'Cache-Control': 'no-store' };

export async function GET(request: NextRequest) {
  try {
    const accessToken = await microsoftAccessToken(request);
    const query = (request.nextUrl.searchParams.get('q') || '').trim().toLowerCase().slice(0, 200);
    const data = await graphJson<{ value?: any[] }>(`/me/contacts?$top=200&$orderby=lastModifiedDateTime desc&$select=id,displayName,emailAddresses,businessPhones,mobilePhone,companyName,jobTitle`, accessToken);
    const contacts = (data.value || []).map((item) => ({
      id: item.id || '',
      name: item.displayName || item.emailAddresses?.[0]?.address || 'Unnamed contact',
      email: item.emailAddresses?.[0]?.address || '',
      phone: item.mobilePhone || item.businessPhones?.[0] || '',
      organization: item.companyName || '',
      title: item.jobTitle || '',
    })).filter((item) => !query || [item.name, item.email, item.phone, item.organization, item.title].join(' ').toLowerCase().includes(query)).slice(0, 100);
    const actorEmail = request.cookies.get(MS_EMAIL_COOKIE)?.value || '';
    await auditExecutiveAction({ actorEmail, action: 'contacts_read', channel: 'microsoft_contacts', metadata: { query, count: contacts.length } });
    return NextResponse.json({ connected: true, contacts, query }, { headers: NO_STORE });
  } catch (error) {
    return NextResponse.json({ connected: false, contacts: [], error: error instanceof Error ? error.message : 'Unable to read Microsoft contacts.' }, { status: 500, headers: NO_STORE });
  }
}
