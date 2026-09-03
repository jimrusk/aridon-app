import { NextRequest, NextResponse } from 'next/server';
import { getServerClient } from '../../../../lib/supabase';
import { cleanText } from '../../../../lib/relationshipBrain';

export const runtime = 'nodejs';
const NO_STORE = { 'Cache-Control': 'no-store' };

const defaults = {
  id: 1,
  auto_create_contacts: true,
  daily_brief_enabled: true,
  daily_brief_time: '06:00',
  daily_brief_timezone: 'America/Denver',
  brief_recipient: null as string | null,
  x_sync_enabled: false,
};

export async function GET() {
  try {
    const db = getServerClient();
    const { data, error } = await db.from('relationship_settings').select('*').eq('id', 1).maybeSingle();
    if (error) throw error;
    return NextResponse.json({ settings: data || defaults }, { headers: NO_STORE });
  } catch (error) {
    console.error('Relationship settings GET error', error);
    return NextResponse.json({ settings: defaults, warning: 'Using default relationship settings.' }, { headers: NO_STORE });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const payload: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (typeof body?.auto_create_contacts === 'boolean') payload.auto_create_contacts = body.auto_create_contacts;
    if (typeof body?.daily_brief_enabled === 'boolean') payload.daily_brief_enabled = body.daily_brief_enabled;
    if (typeof body?.x_sync_enabled === 'boolean') payload.x_sync_enabled = body.x_sync_enabled;
    if (typeof body?.daily_brief_time === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(body.daily_brief_time)) {
      payload.daily_brief_time = body.daily_brief_time;
    }
    if (typeof body?.daily_brief_timezone === 'string') {
      payload.daily_brief_timezone = cleanText(body.daily_brief_timezone, 80) || 'America/Denver';
    }
    if (body?.brief_recipient === null || typeof body?.brief_recipient === 'string') {
      const recipient = cleanText(body?.brief_recipient, 254).toLowerCase();
      if (recipient && !/^\S+@\S+\.\S+$/.test(recipient)) {
        return NextResponse.json({ error: 'Enter a valid briefing email address.' }, { status: 400, headers: NO_STORE });
      }
      payload.brief_recipient = recipient || null;
    }

    const db = getServerClient();
    const { data, error } = await db.from('relationship_settings').upsert({ id: 1, ...payload }, { onConflict: 'id' }).select().single();
    if (error) throw error;
    return NextResponse.json({ settings: data }, { headers: NO_STORE });
  } catch (error) {
    console.error('Relationship settings PATCH error', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to save relationship settings.' }, { status: 500, headers: NO_STORE });
  }
}
