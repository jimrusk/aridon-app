'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { getBrowserClient } from '../../lib/supabase';

type Account = { tenant: { slug: string; business_name: string } };
type BridgeConnection = {
  configured?: boolean;
  online?: boolean;
  status?: string;
  bridgeId?: string | null;
  fromNumber?: string;
  lastSeenAt?: string | null;
  name?: string;
};
type BridgePayload = { connection?: BridgeConnection; bridges?: Array<Record<string, unknown>>; jobs?: Array<Record<string, unknown>> };
type Campaign = { id: string; name: string; mode: string };
type CallPayload = { campaigns?: Campaign[] };

const DEFAULT_OBJECTIVE = 'Introduce yourself as Eva, Aridon’s AI assistant, say this is a requested test or permitted call, confirm the audio works, answer briefly, and end politely.';

export default function EvaPhoneBridgePage() {
  const [token, setToken] = useState('');
  const [account, setAccount] = useState<Account | null>(null);
  const [bridgeData, setBridgeData] = useState<BridgePayload>({});
  const [callData, setCallData] = useState<CallPayload>({});
  const [pairingCode, setPairingCode] = useState('');
  const [pairingId, setPairingId] = useState('');
  const [pairingExpires, setPairingExpires] = useState('');
  const [phone, setPhone] = useState('');
  const [contact, setContact] = useState('');
  const [company, setCompany] = useState('Direct Eva Call');
  const [permissionBasis, setPermissionBasis] = useState('Requested test call / affirmative permission');
  const [permissionConfirmed, setPermissionConfirmed] = useState(false);
  const [objective, setObjective] = useState(DEFAULT_OBJECTIVE);
  const [status, setStatus] = useState('Connecting to Aridon…');
  const [busy, setBusy] = useState(false);

  const connection = bridgeData.connection || {};
  const isOnline = Boolean(connection.online);

  async function loadBridge(access: string, slug: string) {
    const response = await fetch(`/api/customer/phone-bridge?slug=${encodeURIComponent(slug)}&t=${Date.now()}`, {
      headers: { Authorization: `Bearer ${access}` }, cache: 'no-store',
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.error || 'Could not load Eva Phone Bridge.');
    setBridgeData(payload as BridgePayload);
    return payload as BridgePayload;
  }

  async function loadCampaigns(access: string, slug: string) {
    const response = await fetch(`/api/customer/call-command?slug=${encodeURIComponent(slug)}&t=${Date.now()}`, {
      headers: { Authorization: `Bearer ${access}` }, cache: 'no-store',
    });
    const payload = await response.json().catch(() => ({}));
    if (response.ok) setCallData(payload as CallPayload);
  }

  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | null = null;
    void (async () => {
      try {
        const db = getBrowserClient();
        const session = await db.auth.getSession();
        const access = session.data.session?.access_token || '';
        if (!access) { setStatus('Sign in to Aridon to use Eva Phone Bridge.'); return; }
        const me = await fetch('/api/customer/me', { headers: { Authorization: `Bearer ${access}` }, cache: 'no-store' });
        const mePayload = await me.json().catch(() => ({}));
        if (!me.ok || !mePayload.tenant?.slug) throw new Error(mePayload.error || 'Could not open your Aridon workspace.');
        const nextAccount = mePayload as Account;
        setToken(access);
        setAccount(nextAccount);
        const loaded = await loadBridge(access, nextAccount.tenant.slug);
        await loadCampaigns(access, nextAccount.tenant.slug);
        setStatus(loaded.connection?.online ? 'Eva Phone Bridge is online and ready.' : 'Pair the free local bridge to your Google Voice browser.');
        timer = setInterval(() => { void loadBridge(access, nextAccount.tenant.slug).catch(() => {}); }, 5000);
      } catch (error) {
        setStatus(error instanceof Error ? error.message : 'Eva Phone Bridge could not connect.');
      }
    })();
    return () => { if (timer) clearInterval(timer); };
  }, []);

  async function bridgePost(body: Record<string, unknown>) {
    if (!token || !account) throw new Error('Sign in to Aridon first.');
    const response = await fetch('/api/customer/phone-bridge', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug: account.tenant.slug, ...body }),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.error || 'Phone Bridge request failed.');
    return payload;
  }

  async function callPost(body: Record<string, unknown>) {
    if (!token || !account) throw new Error('Sign in to Aridon first.');
    const response = await fetch('/api/customer/call-command', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug: account.tenant.slug, ...body }),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.error || 'Aridon could not prepare the call.');
    return payload;
  }

  async function createPairing() {
    if (!account) return;
    setBusy(true);
    setStatus('Creating a secure one-time pairing code…');
    try {
      const payload = await bridgePost({ action: 'create_pairing', name: 'Eva Google Voice Bridge' });
      setPairingCode(String(payload.pairingCode || ''));
      setPairingId(String(payload.bridgeId || ''));
      setPairingExpires(String(payload.expiresAt || ''));
      setStatus(payload.message || 'Pairing code ready.');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Could not create pairing code.');
    } finally { setBusy(false); }
  }

  async function ensureCampaign() {
    const existing = (callData.campaigns || []).find((item) => item.mode === 'ai_opt_in');
    if (existing) return existing.id;
    const payload = await callPost({ action: 'create_campaign', name: 'Eva Direct Calls', mode: 'ai_opt_in', maxCallsPerDay: 20 });
    const id = String(payload.campaign?.id || '');
    if (!id) throw new Error('Aridon could not create the call campaign.');
    return id;
  }

  async function placeCall() {
    if (!account || !token) { setStatus('Sign in to Aridon first.'); return; }
    if (!isOnline) { setStatus('Start the paired Eva Phone Bridge on the computer signed into Google Voice first.'); return; }
    if (!phone.trim()) { setStatus('Enter the number Eva should call.'); return; }
    if (!permissionConfirmed || permissionBasis.trim().length < 8) {
      setStatus('Confirm permission for this AI call and record the basis.'); return;
    }
    if (objective.trim().length < 12) { setStatus('Give Eva a short call objective.'); return; }

    setBusy(true);
    setStatus('Queuing the call to your Google Voice bridge…');
    try {
      const campaignId = await ensureCampaign();
      const created = await callPost({
        action: 'add_target', campaignId, companyName: company.trim() || 'Direct Eva Call',
        contactName: contact.trim(), phone: phone.trim(), source: 'eva_google_voice_bridge', consentBasis: permissionBasis.trim(),
      });
      const targetId = String(created.target?.id || '');
      if (!targetId) throw new Error('Aridon could not create the call target.');
      await callPost({ action: 'set_compliance', targetId, status: 'allowed_ai_opt_in', reason: `Permission confirmed in Eva Phone Bridge: ${permissionBasis.trim()}` });

      const response = await fetch('/api/customer/phone-bridge/dial', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: account.tenant.slug, targetId, objective: objective.trim() }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || 'Eva could not queue the call.');
      setStatus(payload.message || 'Call queued. Eva Phone Bridge is dialing.');
      await loadBridge(token, account.tenant.slug);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Eva could not start the call.');
    } finally { setBusy(false); }
  }

  const pairingExpiry = useMemo(() => pairingExpires ? new Date(pairingExpires).toLocaleTimeString() : '', [pairingExpires]);

  return (
    <main style={page}>
      <section style={shell}>
        <header style={header}>
          <div>
            <div style={eyebrow}>EVA PHONE BRIDGE · GOOGLE VOICE</div>
            <h1 style={h1}>Aridon owns the brain. Google Voice is only the line.</h1>
            <p style={lead}>No SignalWire or AI-receptionist subscription. The Eva Phone Bridge Chrome extension runs on a computer signed into Google Voice, while Aridon handles the AI conversation and call workflow.</p>
          </div>
          <nav style={nav}><Link href="/eva-phone" style={ghost}>Carrier fallback</Link><Link href="/eva-chat" style={ghost}>Eva Chat</Link></nav>
        </header>

        <div style={isOnline ? readyBar : statusBar}>
          <strong>{isOnline ? '● ONLINE' : connection.configured ? '○ PAIRED / OFFLINE' : '○ NOT PAIRED'}</strong>
          <span>{status}</span>
          {connection.fromNumber ? <span style={small}>Google Voice: {connection.fromNumber}</span> : null}
        </div>

        <section style={card}>
          <div style={sectionHeader}><div><div style={eyebrow}>ONE-TIME PAIRING</div><h2 style={h2}>Pair the computer that stays signed into Google Voice</h2></div><button style={button} disabled={busy} onClick={() => void createPairing()}>{pairingCode ? 'New code' : 'Create pairing code'}</button></div>
          <p style={small}>The bridge receives a one-time token. Aridon stores only a hash, so there is no carrier password or SignalWire credential to fight with.</p>
          {pairingCode ? <div style={pairBox}>
            <div><div style={pairLabel}>PAIRING CODE</div><div style={pairCode}>{pairingCode}</div></div>
            <div><div style={pairLabel}>BRIDGE ID</div><code style={code}>{pairingId}</code></div>
            <div><div style={pairLabel}>EXPIRES</div><div>{pairingExpiry}</div></div>
          </div> : null}
          <ol style={steps}>
            <li>On the computer you want to use as Eva’s phone, keep Google Voice signed in in Chrome.</li>
            <li>Install the Aridon Eva Phone Bridge Chrome extension, then open it from the Chrome toolbar.</li>
            <li>Enter the Bridge ID and six-digit code shown here. After that, it reconnects automatically.</li>
          </ol>
        </section>

        <section style={card}>
          <div style={eyebrow}>TEST / PERMITTED OUTBOUND CALL</div>
          <h2 style={h2}>Type a number. Eva calls through Google Voice.</h2>
          <div style={grid2}>
            <div><label style={label}>Phone number</label><input style={input} value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" placeholder="(555) 555-5555" /></div>
            <div><label style={label}>Contact</label><input style={input} value={contact} onChange={(e) => setContact(e.target.value)} placeholder="Name" /></div>
            <div><label style={label}>Company</label><input style={input} value={company} onChange={(e) => setCompany(e.target.value)} /></div>
            <div><label style={label}>Permission basis</label><input style={input} value={permissionBasis} onChange={(e) => setPermissionBasis(e.target.value)} /></div>
          </div>
          <label style={checkRow}><input type="checkbox" checked={permissionConfirmed} onChange={(e) => setPermissionConfirmed(e.target.checked)} /> I confirm this person/number has agreed to receive this AI voice call.</label>
          <label style={label}>Eva’s objective</label>
          <textarea style={textarea} value={objective} onChange={(e) => setObjective(e.target.value)} rows={5} />
          <button style={{ ...callButton, opacity: busy || !isOnline ? 0.55 : 1 }} disabled={busy || !isOnline} onClick={() => void placeCall()}>{busy ? 'Working…' : isOnline ? 'Call with Eva' : 'Bridge offline'}</button>
        </section>
      </section>
    </main>
  );
}

const page: React.CSSProperties = { minHeight: '100vh', background: '#071019', color: '#eef5f7', padding: '28px 16px 60px', fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif' };
const shell: React.CSSProperties = { maxWidth: 1050, margin: '0 auto', display: 'grid', gap: 18 };
const header: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', gap: 24, alignItems: 'flex-start', flexWrap: 'wrap' };
const nav: React.CSSProperties = { display: 'flex', gap: 8, flexWrap: 'wrap' };
const eyebrow: React.CSSProperties = { fontSize: 12, letterSpacing: 1.5, fontWeight: 800, color: '#75d7c8' };
const h1: React.CSSProperties = { fontSize: 'clamp(30px,5vw,54px)', lineHeight: 1.02, margin: '8px 0 10px', maxWidth: 760 };
const h2: React.CSSProperties = { margin: '6px 0 10px', fontSize: 24 };
const lead: React.CSSProperties = { color: '#b8c9ce', maxWidth: 760, fontSize: 17, lineHeight: 1.55 };
const small: React.CSSProperties = { color: '#9fb1b8', fontSize: 13, lineHeight: 1.45 };
const ghost: React.CSSProperties = { color: '#dce9ed', border: '1px solid #29424c', borderRadius: 10, padding: '9px 12px', textDecoration: 'none' };
const statusBar: React.CSSProperties = { border: '1px solid #6f5832', background: '#20190e', borderRadius: 14, padding: '13px 16px', display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'center' };
const readyBar: React.CSSProperties = { ...statusBar, border: '1px solid #2e745f', background: '#0c211b' };
const card: React.CSSProperties = { background: '#0d1821', border: '1px solid #1f3540', borderRadius: 18, padding: 20, display: 'grid', gap: 14, boxShadow: '0 18px 50px rgba(0,0,0,.22)' };
const sectionHeader: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap' };
const button: React.CSSProperties = { border: 0, borderRadius: 12, background: '#c8f5ec', color: '#062019', fontWeight: 800, padding: '11px 15px', cursor: 'pointer' };
const callButton: React.CSSProperties = { ...button, background: '#7ce2cd', fontSize: 17, padding: '14px 18px' };
const grid2: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 12 };
const label: React.CSSProperties = { display: 'block', color: '#bfd0d6', fontSize: 13, marginBottom: 6, fontWeight: 700 };
const input: React.CSSProperties = { width: '100%', boxSizing: 'border-box', background: '#071019', border: '1px solid #29424c', borderRadius: 11, color: '#f3f8fa', padding: '12px 13px', outline: 'none' };
const textarea: React.CSSProperties = { ...input, resize: 'vertical' };
const checkRow: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 9, color: '#d4e0e4', fontSize: 14 };
const pairBox: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(170px,1fr))', gap: 14, background: '#071019', border: '1px solid #29424c', borderRadius: 14, padding: 16 };
const pairLabel: React.CSSProperties = { fontSize: 11, color: '#8298a0', letterSpacing: 1.2, marginBottom: 5 };
const pairCode: React.CSSProperties = { fontSize: 34, fontWeight: 900, letterSpacing: 5, color: '#baf5e9' };
const code: React.CSSProperties = { color: '#dbe8ec', wordBreak: 'break-all', fontSize: 12 };
const steps: React.CSSProperties = { margin: '0 0 0 20px', color: '#b8c9ce', lineHeight: 1.7 };
