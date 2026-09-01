import { NextRequest, NextResponse } from 'next/server';
import {
  decryptToken,
  GMAIL_REFRESH_COOKIE,
  refreshGoogleAccessToken,
} from '../../../../lib/gmail';
import {
  auditExecutiveAction,
  connectedExecutiveActor,
  externalActionsEnabled,
} from '../../../../lib/executiveOps';

export const runtime = 'nodejs';

const NO_STORE_HEADERS = { 'Cache-Control': 'no-store' };
const CALENDAR_API = 'https://www.googleapis.com/calendar/v3/calendars/primary/events';

function text(value: unknown, maxLength: number) {
  return typeof value === 'string' ? value.trim().slice(0, maxLength) : '';
}

function validDate(value: string) {
  return Boolean(value && Number.isFinite(Date.parse(value)));
}

async function accessTokenFromRequest(request: NextRequest) {
  const encryptedRefreshToken = request.cookies.get(GMAIL_REFRESH_COOKIE)?.value;
  if (!encryptedRefreshToken) throw new Error('Connect Google Workspace before using Calendar.');
  return refreshGoogleAccessToken(decryptToken(encryptedRefreshToken));
}

export async function GET(request: NextRequest) {
  try {
    const accessToken = await accessTokenFromRequest(request);
    const now = new Date();
    const days = Math.max(1, Math.min(90, Number(request.nextUrl.searchParams.get('days') || 30) || 30));
    const end = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
    const url = new URL(CALENDAR_API);
    url.searchParams.set('singleEvents', 'true');
    url.searchParams.set('orderBy', 'startTime');
    url.searchParams.set('timeMin', now.toISOString());
    url.searchParams.set('timeMax', end.toISOString());
    url.searchParams.set('maxResults', '50');

    const response = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: 'no-store',
    });
    const data = (await response.json()) as {
      items?: Array<{
        id?: string;
        summary?: string;
        description?: string;
        location?: string;
        htmlLink?: string;
        status?: string;
        start?: { dateTime?: string; date?: string; timeZone?: string };
        end?: { dateTime?: string; date?: string; timeZone?: string };
        attendees?: Array<{ email?: string; displayName?: string; responseStatus?: string }>;
        organizer?: { email?: string; displayName?: string };
      }>;
      error?: { message?: string };
    };
    if (!response.ok) throw new Error(data.error?.message || 'Google Calendar request failed.');

    const events = (data.items || []).map((event) => ({
      id: event.id || '',
      summary: event.summary || '(Untitled event)',
      description: event.description || '',
      location: event.location || '',
      link: event.htmlLink || '',
      status: event.status || '',
      start: event.start?.dateTime || event.start?.date || '',
      end: event.end?.dateTime || event.end?.date || '',
      timeZone: event.start?.timeZone || event.end?.timeZone || '',
      attendees: event.attendees || [],
      organizer: event.organizer || null,
    }));
    const actor = connectedExecutiveActor(request);
    await auditExecutiveAction({ actorEmail: actor.email, action: 'calendar_read', channel: 'google_calendar', metadata: { count: events.length, days } });

    return NextResponse.json({ connected: true, events }, { headers: NO_STORE_HEADERS });
  } catch (error) {
    console.error('Aridon Google Calendar read error', error);
    const message = error instanceof Error ? error.message : 'Unable to load Google Calendar.';
    const status = message.startsWith('Connect Google Workspace') ? 401 : 500;
    return NextResponse.json({ connected: status !== 401, events: [], error: message }, { status, headers: NO_STORE_HEADERS });
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!request.headers.get('content-type')?.includes('application/json')) {
      return NextResponse.json({ error: 'Content-Type must be application/json.' }, { status: 415, headers: NO_STORE_HEADERS });
    }

    const body = await request.json();
    if (body?.approved !== true) {
      return NextResponse.json(
        { error: 'Owner approval is required before Aridon creates or commits a calendar event.' },
        { status: 403, headers: NO_STORE_HEADERS },
      );
    }

    const actor = connectedExecutiveActor(request);
    if (!(await externalActionsEnabled(request))) {
      await auditExecutiveAction({ actorEmail: actor.email, executive: text(body?.executive, 120), action: 'calendar_create_blocked_emergency_stop', channel: 'google_calendar', target: text(body?.summary, 500), approved: true });
      return NextResponse.json(
        { error: 'Executive Operations emergency stop is active. Calendar writes are disabled.' },
        { status: 423, headers: NO_STORE_HEADERS },
      );
    }

    const summary = text(body?.summary, 500);
    const description = text(body?.description, 10_000);
    const location = text(body?.location, 1_000);
    const start = text(body?.start, 100);
    const end = text(body?.end, 100);
    const timeZone = text(body?.timeZone, 100) || 'America/Denver';
    const attendees = Array.isArray(body?.attendees)
      ? body.attendees
          .map((value: unknown) => text(value, 254))
          .filter((email: string) => /^\S+@\S+\.\S+$/.test(email))
          .slice(0, 50)
      : [];

    if (!summary || !validDate(start) || !validDate(end) || Date.parse(end) <= Date.parse(start)) {
      return NextResponse.json(
        { error: 'A title and valid start/end times are required, and end must be after start.' },
        { status: 400, headers: NO_STORE_HEADERS },
      );
    }

    const accessToken = await accessTokenFromRequest(request);
    const response = await fetch(CALENDAR_API, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        summary,
        description: description || undefined,
        location: location || undefined,
        start: { dateTime: new Date(start).toISOString(), timeZone },
        end: { dateTime: new Date(end).toISOString(), timeZone },
        attendees: attendees.length ? attendees.map((email: string) => ({ email })) : undefined,
      }),
      cache: 'no-store',
    });
    const data = (await response.json()) as { id?: string; htmlLink?: string; error?: { message?: string } };
    if (!response.ok || !data.id) throw new Error(data.error?.message || 'Google Calendar rejected the event.');

    const createdAt = new Date().toISOString();
    await auditExecutiveAction({
      actorEmail: actor.email,
      executive: text(body?.executive, 120),
      action: 'calendar_event_created',
      channel: 'google_calendar',
      target: summary,
      approved: true,
      metadata: { eventId: data.id, attendees, start, end, location },
    });

    return NextResponse.json(
      { created: true, eventId: data.id, link: data.htmlLink || '', createdAt },
      { headers: NO_STORE_HEADERS },
    );
  } catch (error) {
    console.error('Aridon Google Calendar create error', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to create the calendar event.' },
      { status: 500, headers: NO_STORE_HEADERS },
    );
  }
}
