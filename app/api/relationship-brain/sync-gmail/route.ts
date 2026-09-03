import { NextRequest, NextResponse } from 'next/server';
import { getServerClient } from '../../../../lib/supabase';
import {
  decryptToken,
  GMAIL_EMAIL_COOKIE,
  GMAIL_REFRESH_COOKIE,
  refreshGoogleAccessToken,
} from '../../../../lib/gmail';
import { cleanText, companyFromEmail, extractMailboxes } from '../../../../lib/relationshipBrain';

export const runtime = 'nodejs';

const NO_STORE = { 'Cache-Control': 'no-store' };
const GMAIL_API = 'https://gmail.googleapis.com/gmail/v1/users/me';

type GmailHeader = { name?: string; value?: string };
type GmailMessage = {
  id?: string;
  internalDate?: string;
  snippet?: string;
  payload?: { headers?: GmailHeader[] };
};

function header(headers: GmailHeader[] | undefined, name: string): string {
  return headers?.find((item) => item.name?.toLowerCase() === name.toLowerCase())?.value || '';
}

function ignoredAddress(email: string) {
  const normalized = email.toLowerCase();
  return !normalized || /(?:no-?reply|donotreply|mailer-daemon|notifications?|calendar-notification)@/.test(normalized);
}

async function gmailJson<T>(url: string, accessToken: string): Promise<T> {
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: 'no-store',
  });
  const data = (await response.json()) as T & { error?: { message?: string } };
  if (!response.ok) throw new Error(data.error?.message || 'Gmail request failed.');
  return data;
}

async function savedGoogleToken(db: ReturnType<typeof getServerClient>) {
  const { data } = await db
    .from('executive_integration_tokens')
    .select('account_label,encrypted_refresh_token')
    .eq('provider', 'google-workspace')
    .maybeSingle();
  return data || null;
}

export async function POST(request: NextRequest) {
  try {
    const db = getServerClient();
    const cookieToken = request.cookies.get(GMAIL_REFRESH_COOKIE)?.value || '';
    const cookieEmail = request.cookies.get(GMAIL_EMAIL_COOKIE)?.value || '';
    const saved = cookieToken ? null : await savedGoogleToken(db);
    const encryptedRefresh = cookieToken || saved?.encrypted_refresh_token || '';
    const accountEmail = cleanText(cookieEmail || saved?.account_label || '', 254).toLowerCase();

    if (!encryptedRefresh) {
      return NextResponse.json({ connected: false, error: 'Connect Google Workspace before syncing relationship history.' }, { status: 401, headers: NO_STORE });
    }

    const accessToken = await refreshGoogleAccessToken(decryptToken(encryptedRefresh));
    const listUrl = new URL(`${GMAIL_API}/messages`);
    listUrl.searchParams.set('q', 'newer_than:180d');
    listUrl.searchParams.set('maxResults', '100');
    const list = await gmailJson<{ messages?: Array<{ id?: string }> }>(listUrl.toString(), accessToken);
    const ids = (list.messages || []).map((item) => item.id).filter(Boolean) as string[];

    const messages = await Promise.all(ids.map((id) => gmailJson<GmailMessage>(
      `${GMAIL_API}/messages/${encodeURIComponent(id)}?format=metadata&metadataHeaders=From&metadataHeaders=To&metadataHeaders=Cc&metadataHeaders=Subject&metadataHeaders=Date`,
      accessToken,
    )));

    const { data: settings } = await db.from('relationship_settings').select('auto_create_contacts').eq('id', 1).maybeSingle();
    const autoCreate = settings?.auto_create_contacts !== false;
    const { data: existing, error: existingError } = await db
      .from('leads')
      .select('id,name,company,email,last_contact_at,relationship_score')
      .limit(5000);
    if (existingError) throw existingError;

    const byEmail = new Map<string, any>();
    for (const lead of existing || []) {
      if (typeof lead.email === 'string' && lead.email.trim()) byEmail.set(lead.email.trim().toLowerCase(), lead);
    }

    let created = 0;
    let matched = 0;
    let eventsAdded = 0;
    let updated = 0;
    const touched = new Set<string>();

    for (const message of messages) {
      const headers = message.payload?.headers;
      const from = extractMailboxes(header(headers, 'From'));
      const recipients = [
        ...extractMailboxes(header(headers, 'To')),
        ...extractMailboxes(header(headers, 'Cc')),
      ];
      const fromSelf = accountEmail && from.some((box) => box.email === accountEmail);
      const counterparties = fromSelf ? recipients : from;
      const direction = fromSelf ? 'outbound' : 'inbound';
      const timestamp = Number(message.internalDate || 0);
      const happenedAt = timestamp ? new Date(timestamp).toISOString() : new Date().toISOString();
      const subject = cleanText(header(headers, 'Subject') || '(No subject)', 500);
      const summary = cleanText(message.snippet || '', 1000);

      for (const party of counterparties) {
        const email = party.email.toLowerCase();
        if (!email || email === accountEmail || ignoredAddress(email)) continue;
        let lead = byEmail.get(email);
        if (!lead && !autoCreate) continue;

        if (!lead) {
          const payload = {
            name: cleanText(party.name, 160) || email.split('@')[0],
            company: companyFromEmail(email),
            email,
            status: 'new',
            source: 'gmail',
            notes: 'Created automatically from Google Workspace relationship activity.',
            last_contact_at: happenedAt,
            relationship_score: 12,
            updated_at: new Date().toISOString(),
          };
          const { data, error } = await db.from('leads').insert(payload).select('id,name,company,email,last_contact_at,relationship_score').single();
          if (error || !data) continue;
          lead = data;
          byEmail.set(email, data);
          created++;
        } else {
          matched++;
        }

        const lastContact = lead.last_contact_at ? Date.parse(lead.last_contact_at) : 0;
        const currentTime = Date.parse(happenedAt);
        const relationshipScore = Math.min(100, Math.max(Number(lead.relationship_score || 0), 12) + 1);
        if (!lastContact || currentTime > lastContact || relationshipScore !== Number(lead.relationship_score || 0)) {
          const { error } = await db.from('leads').update({
            last_contact_at: !lastContact || currentTime > lastContact ? happenedAt : lead.last_contact_at,
            relationship_score: relationshipScore,
            updated_at: new Date().toISOString(),
          }).eq('id', lead.id);
          if (!error) {
            lead.last_contact_at = !lastContact || currentTime > lastContact ? happenedAt : lead.last_contact_at;
            lead.relationship_score = relationshipScore;
            updated++;
          }
        }

        const { error: eventError } = await db.from('relationship_events').upsert({
          lead_id: lead.id,
          event_type: 'email',
          direction,
          source: 'gmail',
          source_message_id: message.id || null,
          subject,
          summary,
          happened_at: happenedAt,
          metadata: { counterpartEmail: email },
        }, { onConflict: 'source,source_message_id,lead_id', ignoreDuplicates: true });
        if (!eventError) eventsAdded++;
        touched.add(lead.id);
      }
    }

    return NextResponse.json({
      connected: true,
      accountEmail,
      scannedMessages: messages.length,
      relationshipsTouched: touched.size,
      contactsCreated: created,
      contactsMatched: matched,
      relationshipsUpdated: updated,
      eventsProcessed: eventsAdded,
      autoCreateContacts: autoCreate,
    }, { headers: NO_STORE });
  } catch (error) {
    console.error('Relationship Brain Gmail sync error', error);
    return NextResponse.json({ connected: true, error: error instanceof Error ? error.message : 'Unable to sync Gmail relationship history.' }, { status: 500, headers: NO_STORE });
  }
}
