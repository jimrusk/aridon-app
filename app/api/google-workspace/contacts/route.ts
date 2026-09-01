import { NextRequest, NextResponse } from 'next/server';
import { googleWorkspaceAccessToken, listGoogleContacts } from '../../../../../lib/googleWorkspace';
import { auditExecutiveAction, connectedExecutiveActor } from '../../../../../lib/executiveOps';

export const runtime = 'nodejs';
const NO_STORE = { 'Cache-Control': 'no-store' };

export async function GET(request: NextRequest) {
  try {
    const accessToken = await googleWorkspaceAccessToken(request);
    const query = (request.nextUrl.searchParams.get('q') || '').trim().slice(0, 200);
    const contacts = await listGoogleContacts(accessToken, query);
    const actor = connectedExecutiveActor(request);
    await auditExecutiveAction({ actorEmail: actor.email, action: 'contacts_read', channel: 'google_contacts', metadata: { query, count: contacts.length } });
    return NextResponse.json({ connected: true, contacts, query }, { headers: NO_STORE });
  } catch (error) {
    return NextResponse.json({ connected: false, contacts: [], error: error instanceof Error ? error.message : 'Unable to read Google Contacts.' }, { status: 500, headers: NO_STORE });
  }
}
