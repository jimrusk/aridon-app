import { NextRequest, NextResponse } from 'next/server';
import { graphJson, microsoftAccessToken, MS_EMAIL_COOKIE } from '../../../../lib/microsoft365';
import { auditExecutiveAction, externalActionsEnabled } from '../../../../lib/executiveOps';

export const runtime = 'nodejs';
const NO_STORE = { 'Cache-Control': 'no-store' };

function text(value: unknown, max: number) { return typeof value === 'string' ? value.trim().slice(0, max) : ''; }
function validDate(value: string) { return Boolean(value && Number.isFinite(Date.parse(value))); }

export async function GET(request: NextRequest) {
  try {
    const accessToken = await microsoftAccessToken(request);
    const days = Math.max(1, Math.min(90, Number(request.nextUrl.searchParams.get('days') || 30) || 30));
    const start = new Date();
    const end = new Date(start.getTime() + days * 86400000);
    const url = `/me/calendarView?startDateTime=${encodeURIComponent(start.toISOString())}&endDateTime=${encodeURIComponent(end.toISOString())}&$top=50&$orderby=start/dateTime&$select=id,subject,bodyPreview,start,end,location,attendees,organizer,webLink,isOnlineMeeting,onlineMeeting`;
    const data = await graphJson<{ value?: any[] }>(url, accessToken);
    const events = (data.value || []).map((item) => ({
      id: item.id || '', summary: item.subject || '(Untitled event)', description: item.bodyPreview || '',
      start: item.start?.dateTime || '', end: item.end?.dateTime || '', timeZone: item.start?.timeZone || item.end?.timeZone || '',
      location: item.location?.displayName || '', attendees: item.attendees || [], organizer: item.organizer || null,
      link: item.webLink || '', onlineMeeting: item.onlineMeeting || null,
    }));
    const actorEmail = request.cookies.get(MS_EMAIL_COOKIE)?.value || '';
    await auditExecutiveAction({ actorEmail, action: 'calendar_read', channel: 'outlook_calendar', metadata: { days, count: events.length } });
    return NextResponse.json({ connected: true, events }, { headers: NO_STORE });
  } catch (error) {
    return NextResponse.json({ connected: false, events: [], error: error instanceof Error ? error.message : 'Unable to read Microsoft calendar.' }, { status: 500, headers: NO_STORE });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (body?.approved !== true) return NextResponse.json({ error: 'Owner approval is required before creating an event.' }, { status: 403, headers: NO_STORE });
    if (!(await externalActionsEnabled(request))) return NextResponse.json({ error: 'Executive Operations emergency stop is active. Microsoft calendar writes are disabled.' }, { status: 423, headers: NO_STORE });
    const summary = text(body?.summary, 500);
    const description = text(body?.description, 10000);
    const location = text(body?.location, 1000);
    const start = text(body?.start, 100);
    const end = text(body?.end, 100);
    const executive = text(body?.executive, 120);
    const attendees = Array.isArray(body?.attendees) ? body.attendees.map((value: unknown) => text(value, 254)).filter((email: string) => /^\S+@\S+\.\S+$/.test(email)).slice(0, 50) : [];
    if (!summary || !validDate(start) || !validDate(end) || Date.parse(end) <= Date.parse(start)) return NextResponse.json({ error: 'A title and valid start/end times are required.' }, { status: 400, headers: NO_STORE });

    const accessToken = await microsoftAccessToken(request);
    const event = await graphJson<any>('/me/events', accessToken, {
      method: 'POST',
      body: JSON.stringify({
        subject: summary,
        body: { contentType: 'Text', content: description },
        start: { dateTime: new Date(start).toISOString(), timeZone: 'UTC' },
        end: { dateTime: new Date(end).toISOString(), timeZone: 'UTC' },
        location: location ? { displayName: location } : undefined,
        attendees: attendees.map((email: string) => ({ emailAddress: { address: email }, type: 'required' })),
      }),
    });
    const actorEmail = request.cookies.get(MS_EMAIL_COOKIE)?.value || '';
    await auditExecutiveAction({ actorEmail, executive, action: 'calendar_event_created', channel: 'outlook_calendar', target: summary, approved: true, metadata: { eventId: event.id || '', attendees, start, end, location } });
    return NextResponse.json({ created: true, eventId: event.id || '', link: event.webLink || '', createdAt: new Date().toISOString() }, { headers: NO_STORE });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to create Microsoft calendar event.' }, { status: 500, headers: NO_STORE });
  }
}
