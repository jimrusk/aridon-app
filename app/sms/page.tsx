'use client';

import { useEffect, useMemo, useState } from 'react';

const EXECUTIVES = ['Heather', 'Nova', 'Scout', 'Atlas', 'Oracle', 'Ethos', 'Ledger', 'Eva'];
const WEBHOOK_URL = 'https://aridon-v02.vercel.app/api/sms/webhook/textbee';

type Contact = {
  id: string;
  phone_e164: string;
  display_name?: string | null;
  assigned_executive: string;
  consent_status: 'unknown' | 'inbound' | 'opted_in' | 'opted_out';
  consent_source?: string | null;
  auto_reply: boolean;
  last_inbound_at?: string | null;
  last_outbound_at?: string | null;
  updated_at: string;
};

type Message = {
  id: string;
  contact_id: string;
  direction: 'inbound' | 'outbound';
  executive: string;
  body: string;
  created_at: string;
};

type Inbox = { ok?: boolean; contacts?: Contact[]; messages?: Message[]; error?: string };

export default function SmsPage() {
  const [loading, setLoading] = useState(true);
  const [configured, setConfigured] = useState(false);
  const [ownerPaired, setOwnerPaired] = useState(false);
  const [inbox, setInbox] = useState<Inbox>({ contacts: [], messages: [] });
  const [selectedId, setSelectedId] = useState<string>('');
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  const [pairCode, setPairCode] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [deviceId, setDeviceId] = useState('');
  const [webhookSecret, setWebhookSecret] = useState('');

  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [executive, setExecutive] = useState('Eva');
  const [confirmConsent, setConfirmConsent] = useState(false);
  const [sending, setSending] = useState(false);

  const contacts = inbox.contacts ?? [];
  const messages = inbox.messages ?? [];
  const selected = contacts.find((contact) => contact.id === selectedId) ?? contacts[0];
  const thread = useMemo(
    () => (selected ? messages.filter((item) => item.contact_id === selected.id) : []),
    [messages, selected],
  );

  async function load() {
    setLoading(true);
    setError('');
    try {
      const statusRes = await fetch('/api/sms/status', { cache: 'no-store' });
      const status = await statusRes.json();
      const isConfigured = Boolean(status?.configured);
      setConfigured(isConfigured);

      if (!isConfigured) {
        setOwnerPaired(false);
        setInbox({ contacts: [], messages: [] });
        return;
      }

      const inboxRes = await fetch('/api/sms/inbox', { cache: 'no-store' });
      const data = await inboxRes.json();
      if (inboxRes.ok) {
        setOwnerPaired(true);
        setInbox(data);
        if (!selectedId && data?.contacts?.[0]?.id) setSelectedId(data.contacts[0].id);
      } else {
        setOwnerPaired(false);
      }
    } catch {
      setError('Unable to load the SMS command center.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, []);

  async function pairGateway(event: React.FormEvent) {
    event.preventDefault();
    setError('');
    setNotice('Pairing your phone…');
    const response = await fetch('/api/sms/pair', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: pairCode, apiKey, deviceId, webhookSecret }),
    });
    const data = await response.json();
    if (!response.ok) {
      setNotice('');
      setError(data?.error || 'Pairing failed.');
      return;
    }
    setApiKey('');
    setWebhookSecret('');
    setNotice('Phone paired. Loading your SMS inbox…');
    await load();
  }

  async function pairBrowser(event: React.FormEvent) {
    event.preventDefault();
    setError('');
    const response = await fetch('/api/sms/browser-pair', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: pairCode }),
    });
    const data = await response.json();
    if (!response.ok) {
      setError(data?.error || 'Browser pairing failed.');
      return;
    }
    setNotice('This browser is paired to the SMS command center.');
    await load();
  }

  async function sendSms(event: React.FormEvent) {
    event.preventDefault();
    if (!phone || !message) return;
    setSending(true);
    setError('');
    setNotice('');
    try {
      const response = await fetch('/api/sms/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, message, executive, confirmConsent }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || 'SMS was not sent.');
      setNotice(`${executive} sent the text through your phone.`);
      setMessage('');
      setConfirmConsent(false);
      await load();
    } catch (sendError) {
      setError(sendError instanceof Error ? sendError.message : 'Unable to send SMS.');
    } finally {
      setSending(false);
    }
  }

  async function saveContact(contact: Contact) {
    setError('');
    const response = await fetch('/api/sms/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contactId: contact.id,
        displayName: contact.display_name || '',
        assignedExecutive: contact.assigned_executive,
        consentStatus: contact.consent_status,
        autoReply: contact.auto_reply,
      }),
    });
    const data = await response.json();
    if (!response.ok) {
      setError(data?.error || 'Unable to update contact.');
      return;
    }
    setNotice(`${contact.assigned_executive} now owns this SMS thread${contact.auto_reply ? ' with automatic replies enabled' : ''}.`);
    await load();
  }

  function patchContact(id: string, patch: Partial<Contact>) {
    setInbox((current) => ({
      ...current,
      contacts: (current.contacts ?? []).map((contact) => contact.id === id ? { ...contact, ...patch } : contact),
    }));
  }

  if (loading) {
    return <main style={shell}><section style={panel}><h1>Executive SMS</h1><p>Loading the phone gateway…</p></section></main>;
  }

  if (!configured) {
    return (
      <main style={shell}>
        <section style={{ ...panel, maxWidth: 820 }}>
          <div style={eyebrow}>ARIDON · VERIZON PHONE GATEWAY</div>
          <h1 style={h1}>Connect your phone once</h1>
          <p style={muted}>Your existing Android phone and Verizon number become the SMS line. Aridon stores the gateway secrets encrypted and keeps the SMS owner session in a secure browser cookie.</p>

          <div style={steps}>
            <strong>Phone setup</strong>
            <span>1. Install the TextBee Android gateway and grant SMS permission.</span>
            <span>2. Register your phone and copy its Device ID and API key.</span>
            <span>3. In TextBee, enable receiving and create a MESSAGE_RECEIVED webhook pointing to:</span>
            <code style={codeBox}>{WEBHOOK_URL}</code>
            <span>4. Copy the webhook signing secret into the form below. Do not send the API key or webhook secret in chat.</span>
          </div>

          <form onSubmit={pairGateway} style={formGrid}>
            <label style={label}>One-time Aridon pairing code<input style={inputStyle} value={pairCode} onChange={(e) => setPairCode(e.target.value)} inputMode="numeric" required /></label>
            <label style={label}>TextBee Device ID<input style={inputStyle} value={deviceId} onChange={(e) => setDeviceId(e.target.value)} required /></label>
            <label style={label}>TextBee API key<input style={inputStyle} type="password" autoComplete="off" value={apiKey} onChange={(e) => setApiKey(e.target.value)} required /></label>
            <label style={label}>Webhook signing secret<input style={inputStyle} type="password" autoComplete="off" value={webhookSecret} onChange={(e) => setWebhookSecret(e.target.value)} required /></label>
            <button style={primaryButton}>Pair Verizon Phone</button>
          </form>
          {notice && <p style={success}>{notice}</p>}
          {error && <p style={errorStyle}>{error}</p>}
        </section>
      </main>
    );
  }

  if (!ownerPaired) {
    return (
      <main style={shell}>
        <section style={{ ...panel, maxWidth: 620 }}>
          <div style={eyebrow}>SMS GATEWAY CONNECTED</div>
          <h1 style={h1}>Pair this browser</h1>
          <p style={muted}>The phone gateway is already connected. This browser only needs a fresh one-time owner code. No gateway credentials are required again.</p>
          <form onSubmit={pairBrowser} style={{ display: 'grid', gap: 12 }}>
            <input style={inputStyle} value={pairCode} onChange={(e) => setPairCode(e.target.value)} placeholder="One-time pairing code" inputMode="numeric" required />
            <button style={primaryButton}>Pair This Browser</button>
          </form>
          {error && <p style={errorStyle}>{error}</p>}
        </section>
      </main>
    );
  }

  return (
    <main style={shell}>
      <div style={{ maxWidth: 1280, margin: '0 auto', display: 'grid', gap: 18 }}>
        <section style={panel}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
            <div><div style={eyebrow}>LIVE PHONE LINE</div><h1 style={h1}>Executive SMS Command Center</h1><p style={muted}>Texts leave through your existing Verizon number. Incoming replies are recorded here and routed to the executive you assign.</p></div>
            <div style={liveBadge}>● Phone gateway paired</div>
          </div>
          {notice && <p style={success}>{notice}</p>}
          {error && <p style={errorStyle}>{error}</p>}
        </section>

        <section style={{ display: 'grid', gridTemplateColumns: 'minmax(300px,.8fr) minmax(360px,1.2fr)', gap: 18 }}>
          <div style={panel}>
            <h2 style={h2}>New text</h2>
            <form onSubmit={sendSms} style={{ display: 'grid', gap: 12 }}>
              <label style={label}>Phone number<input style={inputStyle} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+15055551234" required /></label>
              <label style={label}>Executive<select style={inputStyle} value={executive} onChange={(e) => setExecutive(e.target.value)}>{EXECUTIVES.map((name) => <option key={name}>{name}</option>)}</select></label>
              <label style={label}>Message<textarea style={{ ...inputStyle, minHeight: 130, resize: 'vertical' }} value={message} onChange={(e) => setMessage(e.target.value)} maxLength={1450} required /></label>
              <label style={{ ...label, display: 'flex', flexDirection: 'row', gap: 10, alignItems: 'flex-start' }}><input type="checkbox" checked={confirmConsent} onChange={(e) => setConfirmConsent(e.target.checked)} />I have permission to text this person, or this person previously texted this number.</label>
              <button style={primaryButton} disabled={sending}>{sending ? 'Sending through phone…' : `Send as ${executive}`}</button>
            </form>
          </div>

          <div style={panel}>
            <h2 style={h2}>Contacts & routing</h2>
            {contacts.length === 0 ? <p style={muted}>No SMS contacts yet. Incoming messages will appear here.</p> : (
              <div style={{ display: 'grid', gap: 10 }}>
                {contacts.map((contact) => (
                  <button key={contact.id} onClick={() => { setSelectedId(contact.id); setPhone(contact.phone_e164); setExecutive(contact.assigned_executive); }} style={{ ...contactButton, borderColor: selected?.id === contact.id ? '#9EF0CF' : '#2B3957' }}>
                    <strong>{contact.display_name || contact.phone_e164}</strong>
                    <span style={{ color: '#9BA8C6' }}>{contact.phone_e164} · {contact.assigned_executive}</span>
                    <small style={{ color: contact.consent_status === 'opted_out' ? '#FF8C80' : '#75E1B0' }}>{contact.consent_status}{contact.auto_reply ? ' · auto reply on' : ''}</small>
                  </button>
                ))}
              </div>
            )}
          </div>
        </section>

        {selected && (
          <section style={{ display: 'grid', gridTemplateColumns: 'minmax(300px,.72fr) minmax(380px,1.28fr)', gap: 18 }}>
            <div style={panel}>
              <h2 style={h2}>Thread settings</h2>
              <div style={{ display: 'grid', gap: 12 }}>
                <label style={label}>Name<input style={inputStyle} value={selected.display_name || ''} onChange={(e) => patchContact(selected.id, { display_name: e.target.value })} /></label>
                <label style={label}>Executive<select style={inputStyle} value={selected.assigned_executive} onChange={(e) => patchContact(selected.id, { assigned_executive: e.target.value })}>{EXECUTIVES.map((name) => <option key={name}>{name}</option>)}</select></label>
                <label style={label}>SMS permission<select style={inputStyle} value={selected.consent_status} onChange={(e) => patchContact(selected.id, { consent_status: e.target.value as Contact['consent_status'] })}><option value="unknown">Unknown / do not send</option><option value="inbound">They initiated this thread</option><option value="opted_in">Permission confirmed</option><option value="opted_out">Opted out</option></select></label>
                <label style={{ ...label, display: 'flex', flexDirection: 'row', gap: 10 }}><input type="checkbox" checked={selected.auto_reply} disabled={selected.consent_status === 'opted_out'} onChange={(e) => patchContact(selected.id, { auto_reply: e.target.checked })} />Allow {selected.assigned_executive} to answer future incoming texts automatically.</label>
                <button style={primaryButton} onClick={() => void saveContact(selected)}>Save Thread Settings</button>
              </div>
            </div>

            <div style={panel}>
              <h2 style={h2}>{selected.display_name || selected.phone_e164}</h2>
              <div style={{ display: 'grid', gap: 9, maxHeight: 520, overflowY: 'auto', paddingRight: 4 }}>
                {thread.length === 0 ? <p style={muted}>No stored messages in this thread yet.</p> : thread.map((item) => (
                  <div key={item.id} style={{ ...bubble, marginLeft: item.direction === 'outbound' ? '14%' : 0, marginRight: item.direction === 'inbound' ? '14%' : 0, borderColor: item.direction === 'outbound' ? '#4A90D9' : '#334263' }}>
                    <small style={{ color: '#8FA0C0' }}>{item.direction === 'outbound' ? item.executive : 'Incoming'} · {new Date(item.created_at).toLocaleString()}</small>
                    <div style={{ marginTop: 5, lineHeight: 1.5 }}>{item.body}</div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}

const shell: React.CSSProperties = { minHeight: '100vh', background: '#070B13', color: '#F4F7FC', padding: '28px 18px 70px', fontFamily: 'Arial, sans-serif' };
const panel: React.CSSProperties = { background: 'linear-gradient(180deg,#111A2D,#0A101D)', border: '1px solid #293756', borderRadius: 20, padding: 22, boxShadow: '0 18px 55px rgba(0,0,0,.25)' };
const eyebrow: React.CSSProperties = { color: '#E87722', fontSize: 12, fontWeight: 900, letterSpacing: '.14em' };
const h1: React.CSSProperties = { margin: '6px 0 8px', fontSize: 34 };
const h2: React.CSSProperties = { margin: '0 0 15px', fontSize: 22 };
const muted: React.CSSProperties = { color: '#A8B4CD', lineHeight: 1.55 };
const formGrid: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 18 };
const label: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: 7, color: '#D9E1F0', fontSize: 13, fontWeight: 800 };
const inputStyle: React.CSSProperties = { width: '100%', boxSizing: 'border-box', background: '#080D18', color: '#F4F7FC', border: '1px solid #334263', borderRadius: 11, padding: '11px 12px', fontSize: 15 };
const primaryButton: React.CSSProperties = { background: '#9EF0CF', color: '#07120E', border: 0, borderRadius: 11, padding: '12px 15px', fontWeight: 900, cursor: 'pointer' };
const steps: React.CSSProperties = { display: 'grid', gap: 8, background: '#0A0F1C', border: '1px solid #263452', borderRadius: 14, padding: 16, color: '#C8D2E6', lineHeight: 1.45, marginTop: 18 };
const codeBox: React.CSSProperties = { padding: '9px 11px', borderRadius: 9, background: '#050811', color: '#9EF0CF', overflowWrap: 'anywhere' };
const success: React.CSSProperties = { color: '#82E6B0', fontWeight: 800, marginTop: 14 };
const errorStyle: React.CSSProperties = { color: '#FF948A', fontWeight: 800, marginTop: 14 };
const liveBadge: React.CSSProperties = { border: '1px solid #42D392', color: '#8DEAB7', borderRadius: 999, padding: '9px 13px', fontWeight: 900, whiteSpace: 'nowrap' };
const contactButton: React.CSSProperties = { textAlign: 'left', display: 'grid', gap: 4, background: '#090F1C', color: '#F5F7FB', border: '1px solid #2B3957', borderRadius: 12, padding: 12, cursor: 'pointer' };
const bubble: React.CSSProperties = { background: '#080E1A', border: '1px solid #334263', borderRadius: 13, padding: 12 };
