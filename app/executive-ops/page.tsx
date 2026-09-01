'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { executives } from '../../lib/executives';

type GoogleStatus = {
  configured: boolean;
  missing: string[];
  connected: boolean;
  email: string;
  approvalRequired: boolean;
  mode?: string;
};

type InboxMessage = {
  id: string;
  threadId: string;
  from: string;
  to: string;
  subject: string;
  date: string;
  snippet: string;
  unread: boolean;
  body?: string;
};

type CalendarEvent = {
  id: string;
  summary: string;
  description: string;
  location: string;
  link: string;
  status: string;
  start: string;
  end: string;
  timeZone: string;
  attendees: Array<{ email?: string; displayName?: string; responseStatus?: string }>;
};

type ReplyDraft = {
  to: string;
  subject: string;
  body: string;
  draftedBy: string;
  mode: string;
};

const panel: React.CSSProperties = {
  background: '#10182A',
  border: '1px solid #283554',
  borderRadius: 18,
  padding: 20,
};

const input: React.CSSProperties = {
  width: '100%',
  boxSizing: 'border-box',
  background: '#09101D',
  border: '1px solid #344260',
  color: '#F5F7FF',
  borderRadius: 10,
  padding: '10px 12px',
  marginTop: 6,
};

const primary: React.CSSProperties = {
  border: 0,
  background: '#E87722',
  color: '#101421',
  borderRadius: 10,
  padding: '11px 15px',
  fontWeight: 900,
  cursor: 'pointer',
};

const secondary: React.CSSProperties = {
  ...primary,
  background: '#17223A',
  color: '#EFF4FF',
  border: '1px solid #344260',
};

function displayDate(value: string) {
  if (!value) return '';
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date.toLocaleString() : value;
}

function toLocalInput(date: Date) {
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

export default function ExecutiveOperationsPage() {
  const [status, setStatus] = useState<GoogleStatus>({
    configured: false,
    missing: [],
    connected: false,
    email: '',
    approvalRequired: true,
  });
  const [messages, setMessages] = useState<InboxMessage[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [selected, setSelected] = useState<InboxMessage | null>(null);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [executive, setExecutive] = useState('Eva');
  const [objective, setObjective] = useState('Answer the important point clearly and move the conversation to the next practical step.');
  const [draft, setDraft] = useState<ReplyDraft | null>(null);
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [search, setSearch] = useState('in:inbox');

  const defaultStart = useMemo(() => {
    const start = new Date(Date.now() + 24 * 60 * 60 * 1000);
    start.setMinutes(0, 0, 0);
    return toLocalInput(start);
  }, []);
  const defaultEnd = useMemo(() => {
    const end = new Date(Date.now() + 25 * 60 * 60 * 1000);
    end.setMinutes(0, 0, 0);
    return toLocalInput(end);
  }, []);

  const [eventForm, setEventForm] = useState({
    summary: '',
    description: '',
    location: '',
    start: defaultStart,
    end: defaultEnd,
    attendees: '',
  });

  async function loadStatus() {
    const response = await fetch('/api/gmail/status', { cache: 'no-store' });
    const data = (await response.json()) as GoogleStatus;
    setStatus(data);
    return data;
  }

  async function loadInbox(query = search) {
    const response = await fetch(`/api/gmail/inbox?q=${encodeURIComponent(query || 'in:inbox')}&maxResults=25`, { cache: 'no-store' });
    const data = (await response.json()) as { messages?: InboxMessage[]; error?: string };
    if (!response.ok) throw new Error(data.error || 'Unable to read Gmail.');
    setMessages(data.messages || []);
    if (!selectedId && data.messages?.[0]?.id) setSelectedId(data.messages[0].id);
  }

  async function loadCalendar() {
    const response = await fetch('/api/google-calendar/events?days=30', { cache: 'no-store' });
    const data = (await response.json()) as { events?: CalendarEvent[]; error?: string };
    if (!response.ok) throw new Error(data.error || 'Unable to read Google Calendar.');
    setEvents(data.events || []);
  }

  async function refreshAll() {
    setBusy(true);
    setNotice('');
    try {
      const nextStatus = await loadStatus();
      if (nextStatus.connected) {
        const results = await Promise.allSettled([loadInbox(), loadCalendar()]);
        const firstError = results.find((result) => result.status === 'rejected') as PromiseRejectedResult | undefined;
        if (firstError) setNotice(firstError.reason instanceof Error ? firstError.reason.message : 'One Google service could not load. Reconnect Google Workspace if permissions changed.');
      }
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Unable to load Executive Operations.');
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    refreshAll();
    const params = new URLSearchParams(window.location.search);
    const result = params.get('gmail');
    if (result === 'connected') setNotice('Google Workspace connected. Gmail and Calendar permissions are ready.');
    if (result === 'denied') setNotice('Google access was not approved. Nothing was connected.');
    if (result === 'connect-error') setNotice('Google Workspace connection failed. Check OAuth configuration and reconnect.');
    if (result === 'state-error') setNotice('The Google connection attempt expired. Start it again.');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!selectedId || !status.connected) return;
    setDraft(null);
    fetch(`/api/gmail/inbox?messageId=${encodeURIComponent(selectedId)}`, { cache: 'no-store' })
      .then(async (response) => {
        const data = (await response.json()) as { message?: InboxMessage; error?: string };
        if (!response.ok || !data.message) throw new Error(data.error || 'Unable to open the email.');
        setSelected(data.message);
      })
      .catch((error) => setNotice(error instanceof Error ? error.message : 'Unable to open the email.'));
  }, [selectedId, status.connected]);

  async function draftReply() {
    if (!selected?.body) return;
    setBusy(true);
    setNotice('');
    try {
      const response = await fetch('/api/email/reply-draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: selected.from,
          subject: selected.subject,
          message: selected.body,
          objective,
          executive,
        }),
      });
      const data = (await response.json()) as ReplyDraft & { error?: string };
      if (!response.ok || !data.to || !data.subject || !data.body) throw new Error(data.error || 'Unable to draft the reply.');
      setDraft(data);
      setNotice(`${executive} drafted a reply. Nothing has been sent.`);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Unable to draft the reply.');
    } finally {
      setBusy(false);
    }
  }

  async function approveAndSend() {
    if (!draft || busy) return;
    const approved = window.confirm(`Approve and send this email from ${status.email} to ${draft.to}?`);
    if (!approved) return;
    setBusy(true);
    setNotice('');
    try {
      const response = await fetch('/api/gmail/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approved: true, to: draft.to, subject: draft.subject, body: draft.body }),
      });
      const data = (await response.json()) as { sent?: boolean; messageId?: string; error?: string };
      if (!response.ok || !data.sent) throw new Error(data.error || 'Gmail did not send the message.');
      setNotice(`Email sent with your approval. Gmail message ${data.messageId || ''}`.trim());
      setDraft(null);
      await loadInbox();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Unable to send the email.');
    } finally {
      setBusy(false);
    }
  }

  async function createEvent() {
    if (!eventForm.summary || !eventForm.start || !eventForm.end || busy) return;
    const approved = window.confirm(`Approve creating "${eventForm.summary}" on Google Calendar?`);
    if (!approved) return;
    setBusy(true);
    setNotice('');
    try {
      const attendees = eventForm.attendees.split(/[\n,;]+/).map((item) => item.trim()).filter(Boolean);
      const response = await fetch('/api/google-calendar/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          approved: true,
          ...eventForm,
          attendees,
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/Denver',
        }),
      });
      const data = (await response.json()) as { created?: boolean; error?: string };
      if (!response.ok || !data.created) throw new Error(data.error || 'Calendar did not create the event.');
      setNotice('Calendar event created with your approval.');
      setEventForm({ ...eventForm, summary: '', description: '', location: '', attendees: '' });
      await loadCalendar();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Unable to create the calendar event.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main style={{ minHeight: '100vh', background: '#070D18', color: '#F5F7FF', padding: 24 }}>
      <div style={{ maxWidth: 1320, margin: '0 auto' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', gap: 18, alignItems: 'center', flexWrap: 'wrap', marginBottom: 22 }}>
          <div>
            <div style={{ color: '#E87722', fontWeight: 950, letterSpacing: '.16em' }}>ARIDON EXECUTIVE OPERATIONS LAYER</div>
            <h1 style={{ margin: '7px 0 5px', fontSize: 'clamp(34px,6vw,58px)', lineHeight: 1 }}>The executives can see the work, then help move it.</h1>
            <p style={{ maxWidth: 850, color: '#AAB6CF', fontSize: 17, lineHeight: 1.55 }}>
              Google Workspace connection for email reading, executive reply drafting, approved sending, calendar awareness, and approved scheduling. External actions remain behind owner approval by default.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <Link href="/email" style={{ ...secondary, textDecoration: 'none' }}>Email Center</Link>
            <Link href="/" style={{ ...secondary, textDecoration: 'none' }}>Command Center</Link>
          </div>
        </header>

        {notice && <div style={{ ...panel, padding: '13px 16px', borderColor: '#E8772266', marginBottom: 18 }}>{notice}</div>}

        <section style={{ ...panel, marginBottom: 18 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 12, letterSpacing: '.14em', color: '#91A1C2', fontWeight: 900 }}>GOOGLE WORKSPACE</div>
              <h2 style={{ margin: '6px 0' }}>{status.connected ? `Connected: ${status.email}` : 'Connect the company Google account'}</h2>
              <p style={{ color: '#AAB6CF', margin: 0 }}>
                {status.connected ? 'Gmail read/send and Calendar event access are enabled for this browser session.' : 'Aridon requests only the Google permissions needed for the features shown here.'}
              </p>
            </div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {status.configured && <button style={primary} onClick={() => { window.location.href = '/api/gmail/connect?returnTo=/executive-ops'; }}>{status.connected ? 'Reconnect / Refresh Permissions' : 'Connect Google Workspace'}</button>}
              <button style={secondary} onClick={refreshAll} disabled={busy}>{busy ? 'Refreshing...' : 'Refresh'}</button>
            </div>
          </div>
          {!status.configured && <div style={{ marginTop: 14, color: '#FFB36F' }}>Missing server configuration: {status.missing.join(', ') || 'Google OAuth environment variables'}</div>}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(190px,1fr))', gap: 10, marginTop: 18 }}>
            {[
              ['Email read', 'ON', 'Executives can review connected inbox content.'],
              ['Draft replies', 'ON', 'Any Aridon executive can prepare a response for review.'],
              ['Email send', 'APPROVAL', 'No external send happens until the owner approves it.'],
              ['Calendar read', 'ON', 'Upcoming events can inform briefs and priorities.'],
              ['Calendar write', 'APPROVAL', 'Creating a commitment requires owner approval.'],
              ['Delete / sign / spend', 'OFF', 'No permanent deletion, signatures, or spending from this layer.'],
            ].map(([name, mode, description]) => (
              <div key={name} style={{ background: '#0A1120', border: '1px solid #263450', borderRadius: 12, padding: 13 }}>
                <strong>{name}</strong><div style={{ color: mode === 'ON' ? '#61D98B' : mode === 'OFF' ? '#FF9A82' : '#FFB15C', fontSize: 12, fontWeight: 950, margin: '5px 0' }}>{mode}</div><div style={{ color: '#8F9DB9', fontSize: 13, lineHeight: 1.4 }}>{description}</div>
              </div>
            ))}
          </div>
        </section>

        <section style={{ display: 'grid', gridTemplateColumns: 'minmax(320px,.9fr) minmax(380px,1.35fr)', gap: 18, alignItems: 'start' }}>
          <div style={{ display: 'grid', gap: 18 }}>
            <div style={panel}>
              <div style={{ fontSize: 12, letterSpacing: '.14em', color: '#91A1C2', fontWeight: 900 }}>INBOX</div>
              <h2>Executive email desk</h2>
              <div style={{ display: 'flex', gap: 8 }}>
                <input style={{ ...input, marginTop: 0 }} value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Gmail search, e.g. in:inbox newer_than:7d" />
                <button style={secondary} onClick={() => loadInbox(search)}>Search</button>
              </div>
              <div style={{ display: 'grid', gap: 8, marginTop: 14, maxHeight: 610, overflowY: 'auto' }}>
                {messages.length === 0 && <p style={{ color: '#8F9DB9' }}>{status.connected ? 'No matching email loaded.' : 'Connect Google Workspace to load email.'}</p>}
                {messages.map((message) => (
                  <button
                    key={message.id}
                    onClick={() => setSelectedId(message.id)}
                    style={{
                      textAlign: 'left',
                      color: '#F5F7FF',
                      background: selectedId === message.id ? '#182644' : '#0A1120',
                      border: `1px solid ${selectedId === message.id ? '#E87722' : '#263450'}`,
                      borderRadius: 11,
                      padding: 12,
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}><strong>{message.subject}</strong>{message.unread && <span style={{ color: '#61D98B', fontSize: 11 }}>NEW</span>}</div>
                    <div style={{ color: '#AAB6CF', fontSize: 12, marginTop: 4 }}>{message.from}</div>
                    <div style={{ color: '#74839F', fontSize: 11, marginTop: 4 }}>{displayDate(message.date)}</div>
                    <div style={{ color: '#8F9DB9', fontSize: 12, marginTop: 6 }}>{message.snippet}</div>
                  </button>
                ))}
              </div>
            </div>

            <div style={panel}>
              <div style={{ fontSize: 12, letterSpacing: '.14em', color: '#91A1C2', fontWeight: 900 }}>NEXT CONNECTORS</div>
              <h2>What I would add after Google</h2>
              <p style={{ color: '#AAB6CF', lineHeight: 1.55 }}>Contacts for recipient resolution, Drive/Docs for company knowledge, Meet transcripts for automatic follow-up, then Slack/Teams, CRM, phone/SMS, and accounting. Each should use the same permission gates rather than becoming a separate little kingdom.</p>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>{['Contacts', 'Drive + Docs', 'Meet notes', 'Slack / Teams', 'CRM', 'Phone + SMS', 'Accounting'].map((item) => <span key={item} style={{ border: '1px solid #344260', borderRadius: 999, padding: '7px 10px', color: '#AAB6CF', fontSize: 12 }}>{item}</span>)}</div>
            </div>
          </div>

          <div style={{ display: 'grid', gap: 18 }}>
            <div style={panel}>
              <div style={{ fontSize: 12, letterSpacing: '.14em', color: '#91A1C2', fontWeight: 900 }}>READ + RESPOND</div>
              {!selected ? <p style={{ color: '#8F9DB9' }}>Choose an email to open it.</p> : <>
                <h2 style={{ marginBottom: 5 }}>{selected.subject}</h2>
                <div style={{ color: '#AAB6CF', fontSize: 13 }}>{selected.from} · {displayDate(selected.date)}</div>
                <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit', background: '#09101D', border: '1px solid #263450', borderRadius: 12, padding: 15, maxHeight: 330, overflowY: 'auto', lineHeight: 1.5 }}>{selected.body || selected.snippet}</pre>
                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(170px,.45fr) minmax(260px,1fr)', gap: 10 }}>
                  <label>Executive
                    <select style={input} value={executive} onChange={(event) => setExecutive(event.target.value)}>{executives.map((item) => <option key={item.id} value={item.name}>{item.name} · {item.role}</option>)}</select>
                  </label>
                  <label>Reply objective
                    <input style={input} value={objective} onChange={(event) => setObjective(event.target.value)} />
                  </label>
                </div>
                <button style={{ ...primary, marginTop: 12 }} onClick={draftReply} disabled={busy}>{busy ? 'Working...' : `Have ${executive} Draft Reply`}</button>
              </>}

              {draft && <div style={{ marginTop: 18, borderTop: '1px solid #2B3856', paddingTop: 18 }}>
                <div style={{ color: '#61D98B', fontWeight: 900, marginBottom: 9 }}>DRAFT ONLY · NOT SENT</div>
                <label>To<input style={input} value={draft.to} onChange={(event) => setDraft({ ...draft, to: event.target.value })} /></label>
                <label style={{ display: 'block', marginTop: 10 }}>Subject<input style={input} value={draft.subject} onChange={(event) => setDraft({ ...draft, subject: event.target.value })} /></label>
                <label style={{ display: 'block', marginTop: 10 }}>Body<textarea style={input} rows={13} value={draft.body} onChange={(event) => setDraft({ ...draft, body: event.target.value })} /></label>
                <div style={{ display: 'flex', gap: 9, flexWrap: 'wrap', marginTop: 12 }}><button style={primary} onClick={approveAndSend} disabled={busy}>Approve & Send</button><button style={secondary} onClick={() => setDraft(null)}>Discard Draft</button></div>
              </div>}
            </div>

            <div style={panel}>
              <div style={{ fontSize: 12, letterSpacing: '.14em', color: '#91A1C2', fontWeight: 900 }}>CALENDAR</div>
              <h2>Upcoming commitments</h2>
              <div style={{ display: 'grid', gap: 8, maxHeight: 330, overflowY: 'auto' }}>
                {events.length === 0 && <p style={{ color: '#8F9DB9' }}>{status.connected ? 'No upcoming events loaded, or Calendar permission needs to be refreshed.' : 'Connect Google Workspace to load the calendar.'}</p>}
                {events.map((event) => <div key={event.id} style={{ background: '#0A1120', border: '1px solid #263450', borderRadius: 11, padding: 12 }}><strong>{event.summary}</strong><div style={{ color: '#AAB6CF', fontSize: 12, marginTop: 5 }}>{displayDate(event.start)}{event.location ? ` · ${event.location}` : ''}</div>{event.attendees?.length ? <div style={{ color: '#7888A6', fontSize: 11, marginTop: 4 }}>{event.attendees.length} attendee{event.attendees.length === 1 ? '' : 's'}</div> : null}</div>)}
              </div>

              <div style={{ borderTop: '1px solid #2B3856', marginTop: 16, paddingTop: 16 }}>
                <h3 style={{ marginTop: 0 }}>Create an approved event</h3>
                <label>Title<input style={input} value={eventForm.summary} onChange={(event) => setEventForm({ ...eventForm, summary: event.target.value })} /></label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 10 }}>
                  <label>Start<input type="datetime-local" style={input} value={eventForm.start} onChange={(event) => setEventForm({ ...eventForm, start: event.target.value })} /></label>
                  <label>End<input type="datetime-local" style={input} value={eventForm.end} onChange={(event) => setEventForm({ ...eventForm, end: event.target.value })} /></label>
                </div>
                <label style={{ display: 'block', marginTop: 10 }}>Location<input style={input} value={eventForm.location} onChange={(event) => setEventForm({ ...eventForm, location: event.target.value })} /></label>
                <label style={{ display: 'block', marginTop: 10 }}>Attendee emails, separated by commas<textarea style={input} rows={3} value={eventForm.attendees} onChange={(event) => setEventForm({ ...eventForm, attendees: event.target.value })} /></label>
                <label style={{ display: 'block', marginTop: 10 }}>Notes<textarea style={input} rows={4} value={eventForm.description} onChange={(event) => setEventForm({ ...eventForm, description: event.target.value })} /></label>
                <button style={{ ...primary, marginTop: 12 }} onClick={createEvent} disabled={busy}>Approve & Create Event</button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
