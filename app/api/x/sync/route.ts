import { NextResponse } from 'next/server';
import { decryptToken, encryptToken } from '../../../../lib/gmail';
import { getServerClient } from '../../../../lib/supabase';
import { cleanText } from '../../../../lib/relationshipBrain';
import { refreshXAccessToken, xJson } from '../../../../lib/x';

export const runtime = 'nodejs';
const NO_STORE = { 'Cache-Control': 'no-store' };

type XUser = { id: string; name?: string; username?: string };
type XTweet = { id: string; text?: string; author_id?: string; created_at?: string; conversation_id?: string };
type MentionsResponse = { data?: XTweet[]; includes?: { users?: XUser[] }; meta?: { result_count?: number } };

type StoredToken = {
  encrypted_access_token?: string | null;
  encrypted_refresh_token?: string | null;
  metadata?: Record<string, any> | null;
};

async function loadMentions(accessToken: string, userId: string) {
  return xJson<MentionsResponse>(
    `/users/${encodeURIComponent(userId)}/mentions?max_results=25&tweet.fields=created_at,author_id,conversation_id&expansions=author_id&user.fields=id,name,username`,
    accessToken,
  );
}

export async function POST() {
  try {
    const db = getServerClient();
    const [{ data: settings }, { data: tokenRow, error: tokenError }] = await Promise.all([
      db.from('relationship_settings').select('x_sync_enabled').eq('id', 1).maybeSingle(),
      db.from('executive_integration_tokens').select('encrypted_access_token,encrypted_refresh_token,metadata').eq('provider', 'x').maybeSingle(),
    ]);
    if (tokenError) throw tokenError;
    if (!tokenRow) return NextResponse.json({ connected: false, error: 'Connect X before syncing social relationships.' }, { status: 401, headers: NO_STORE });
    if (settings?.x_sync_enabled === false) return NextResponse.json({ connected: true, synced: false, reason: 'X relationship sync is turned off.' }, { headers: NO_STORE });

    const stored = tokenRow as StoredToken;
    const userId = cleanText(stored.metadata?.userId, 100);
    if (!userId || !stored.encrypted_access_token) throw new Error('The saved X connection is incomplete. Reconnect X.');

    let accessToken = decryptToken(stored.encrypted_access_token);
    let mentions: MentionsResponse;
    try {
      mentions = await loadMentions(accessToken, userId);
    } catch (firstError) {
      if (!stored.encrypted_refresh_token) throw firstError;
      const refreshed = await refreshXAccessToken(decryptToken(stored.encrypted_refresh_token));
      accessToken = refreshed.accessToken;
      await db.from('executive_integration_tokens').update({
        encrypted_access_token: encryptToken(refreshed.accessToken),
        encrypted_refresh_token: refreshed.refreshToken ? encryptToken(refreshed.refreshToken) : stored.encrypted_refresh_token,
        updated_at: new Date().toISOString(),
      }).eq('provider', 'x');
      mentions = await loadMentions(accessToken, userId);
    }

    const users = new Map((mentions.includes?.users || []).map((user) => [user.id, user]));
    const handles = [...new Set((mentions.includes?.users || []).map((user) => (user.username || '').toLowerCase()).filter(Boolean))];
    const { data: existing, error: existingError } = handles.length
      ? await db.from('leads').select('id,name,social_handle,last_contact_at,relationship_score').in('social_handle', handles)
      : { data: [], error: null } as any;
    if (existingError) throw existingError;
    const byHandle = new Map<string, any>();
    for (const lead of existing || []) if (lead.social_handle) byHandle.set(String(lead.social_handle).toLowerCase(), lead);

    let contactsCreated = 0;
    let eventsProcessed = 0;
    const touched = new Set<string>();

    for (const tweet of mentions.data || []) {
      if (!tweet.author_id || tweet.author_id === userId) continue;
      const author = users.get(tweet.author_id);
      const handle = cleanText(author?.username, 80).replace(/^@/, '').toLowerCase();
      if (!handle) continue;
      let lead = byHandle.get(handle);
      const happenedAt = tweet.created_at || new Date().toISOString();
      if (!lead) {
        const { data, error } = await db.from('leads').insert({
          name: cleanText(author?.name, 160) || `@${handle}`,
          company: 'X relationship',
          email: '',
          status: 'new',
          source: 'x',
          social_handle: handle,
          social_url: `https://x.com/${handle}`,
          notes: 'Created automatically from an X mention connected to Aridon Relationship Brain.',
          last_contact_at: happenedAt,
          relationship_score: 10,
          updated_at: new Date().toISOString(),
        }).select('id,name,social_handle,last_contact_at,relationship_score').single();
        if (error || !data) continue;
        lead = data;
        byHandle.set(handle, data);
        contactsCreated++;
      }

      const last = lead.last_contact_at ? Date.parse(lead.last_contact_at) : 0;
      const when = Date.parse(happenedAt);
      const nextScore = Math.min(100, Math.max(10, Number(lead.relationship_score || 0)) + 2);
      await db.from('leads').update({
        last_contact_at: !last || when > last ? happenedAt : lead.last_contact_at,
        relationship_score: nextScore,
        updated_at: new Date().toISOString(),
      }).eq('id', lead.id);
      lead.last_contact_at = !last || when > last ? happenedAt : lead.last_contact_at;
      lead.relationship_score = nextScore;

      const { error: eventError } = await db.from('relationship_events').upsert({
        lead_id: lead.id,
        event_type: 'social',
        direction: 'inbound',
        source: 'x',
        source_message_id: tweet.id,
        subject: `X mention from @${handle}`,
        summary: cleanText(tweet.text || '', 1000),
        happened_at: happenedAt,
        metadata: { authorId: tweet.author_id, handle, conversationId: tweet.conversation_id || null },
      }, { onConflict: 'source,source_message_id,lead_id', ignoreDuplicates: true });
      if (!eventError) eventsProcessed++;
      touched.add(lead.id);
    }

    return NextResponse.json({
      connected: true,
      synced: true,
      mentionsRead: mentions.data?.length || 0,
      relationshipsTouched: touched.size,
      contactsCreated,
      eventsProcessed,
    }, { headers: NO_STORE });
  } catch (error) {
    console.error('X relationship sync error', error);
    return NextResponse.json({ connected: true, error: error instanceof Error ? error.message : 'Unable to sync X relationships.' }, { status: 500, headers: NO_STORE });
  }
}
