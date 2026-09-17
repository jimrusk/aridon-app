'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getBrowserClient } from '../../lib/supabase';

type Account = { tenant: { slug: string; business_name: string } };
type Campaign = { id: string; name: string; mode: string };
type CallPayload = {
  configured?: boolean;
  provider?: string | null;
  campaigns?: Campaign[];
  connection?: {
    signalwire?: {
      configured?: boolean;
      apiTokenSaved?: boolean;
      values?: { space?: string; projectId?: string; fromNumber?: string };
    };
  };
};

type TargetResult = { target?: { id?: string } };

const DEFAULT_OBJECTIVE = 'Introduce yourself as Eva from Aridon, explain the purpose of the call clearly, answer questions, and keep the conversation concise.';

export default function EvaPhonePage() {
  const [token, setToken] = useState('');
  const [account, setAccount] = useState<Account | null>(null);
  const [callData, setCallData] = useState<CallPayload>({});
  const [phone, setPhone] = useState('');
  const [contact, setContact] = useState('');
  const [company, setCompany] = useState('Direct Eva Call');
  const [permissionBasis, setPermissionBasis] = useState('');
  const [permissionConfirmed, setPermissionConfirmed] = useState(false);
  const [objective, setObjective] = useState(DEFAULT_OBJECTIVE);
  const [status, setStatus] = useState('Connecting to Aridon…');
  const [busy, setBusy] = useState(false);
  const [setupOpen, setSetupOpen] = useState(false);
  const [carrierBusy, setCarrierBusy] = useState(false);
  const [swSpace, setSwSpace] = useState('');
  const [swProjectId, setSwProjectId] = useState('');
  const [swApiToken, setSwApiToken] = useState('');
  const [swFromNumber, setSwFromNumber] = useState('');

  async function loadCallData(access: string, slug: string) {
    const response = await fetch(`/api/customer/call-command?slug=${encodeURIComponent(slug)}&t=${Date.now()}`, {
      headers: { Authorization: `Bearer ${access}` },
      cache: 'no-store',
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.error || 'Could not load Aridon Voice Gateway.');
    const next = payload as CallPayload;
    setCallData(next);
    const saved = next.connection?.signalwire?.values;
    if (saved) {
      setSwSpace(saved.space || '');
      setSwProjectId(saved.projectId || '');
      setSwFromNumber(saved.fromNumber || '');
    }
    return next;
  }

  useEffect(() => {
    void (async () => {
      try {
        const db = getBrowserClient();
        const session = await db.auth.getSession();
        const access = session.data.session?.access_token || '';
        if (!access) {
          setStatus('Sign in to Aridon to use Eva Phone.');
          return;
        }
        const me = await fetch('/api/customer/me', {
          headers: { Authorization: `Bearer ${access}` },
          cache: 'no-store',
        });
        const mePayload = await me.json().catch(() => ({}));
        if (!me.ok || !mePayload.tenant?.slug) throw new Error(mePayload.error || 'Could not open your Aridon workspace.');
        const nextAccount = mePayload as Account;
        setToken(access);
        setAccount(nextAccount);
        const voice = await loadCallData(access, nextAccount.tenant.slug);
        setStatus(voice.configured ? 'Aridon Voice Gateway is ready.' : 'One carrier hookup is still needed. You can do it right here without leaving Eva Phone.');
        if (!voice.configured) setSetupOpen(true);
      } catch (error) {
        setStatus(error instanceof Error ? error.message : 'Eva Phone could not connect.');
      }
    })();
  }, []);

  async function postCallCommand(body: Record<string, unknown>) {
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

  async function saveCarrier() {
    if (!token || !account) {
      setStatus('Sign in to Aridon first.');
      return;
    }
    if (!swSpace.trim() || !swProjectId.trim() || !swFromNumber.trim()) {
      setStatus('Enter the carrier Space, Project ID, and Aridon phone number.');
      return;
    }
    if (!swApiToken.trim() && !callData.connection?.signalwire?.apiTokenSaved) {
      setStatus('Paste the API token once. Aridon encrypts it and never displays it again.');
      return;
    }
    setCarrierBusy(true);
    setStatus('Connecting the carrier underneath Aridon Voice Gateway…');
    try {
      const payload = await postCallCommand({
        action: 'save_signalwire',
        space: swSpace.trim(),
        projectId: swProjectId.trim(),
        apiToken: swApiToken.trim(),
        fromNumber: swFromNumber.trim(),
      });
      setSwApiToken('');
      const voice = await loadCallData(token, account.tenant.slug);
      if (!voice.configured) throw new Error('The carrier settings were saved, but the gateway is still incomplete.');
      setSetupOpen(false);
      setStatus(payload.message || 'Carrier connected. Aridon Voice Gateway is ready.');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'The carrier could not be connected.');
    } finally {
      setCarrierBusy(false);
    }
  }

  async function ensureCampaign() {
    const existing = (callData.campaigns || []).find((item) => item.mode === 'ai_opt_in');
    if (existing) return existing.id;
    const payload = await postCallCommand({ action: 'create_campaign', name: 'Eva Direct Calls', mode: 'ai_opt_in', maxCallsPerDay: 20 });
    return String(payload.campaign?.id || '');
  }

  async function callEva() {
    if (!account || !token) {
      setStatus('Sign in to Aridon first.');
      return;
    }
    if (!callData.configured) {
      setSetupOpen(true);
      setStatus('Connect the one-time carrier plumbing below, then Eva can dial from this page.');
      return;
    }
    if (!phone.trim()) {
      setStatus('Enter the number Eva should call.');
      return;
    }
    if (!permissionConfirmed || permissionBasis.trim().length < 8) {
      setStatus('Confirm that this person or number has agreed to receive an AI voice call, and record the basis.');
      return;
    }
    if (objective.trim().length < 12) {
      setStatus('Give Eva a short call objective.');
      return;
    }

    setBusy(true);
    setStatus('Preparing Eva’s call…');
    try {
      const campaignId = await ensureCampaign();
      const created = await postCallCommand({
        action: 'add_target',
        campaignId,
        companyName: company.trim() || 'Direct Eva Call',
        contactName: contact.trim(),
        phone: phone.trim(),
        source: 'eva_phone',
        consentBasis: permissionBasis.trim(),
      }) as TargetResult;
      const targetId = String(created.target?.id || '');
      if (!targetId) throw new Error('Aridon could not create the call target.');

      await postCallCommand({
        action: 'set_compliance',
        targetId,
        status: 'allowed_ai_opt_in',
        reason: `Permission confirmed in Eva Phone: ${permissionBasis.trim()}`,
      });

      const response = await fetch('/api/customer/call-command/eva-dial', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: account.tenant.slug, targetId, objective: objective.trim() }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || 'Eva could not start the call.');
      setStatus(payload.message || 'Eva is calling through Aridon Voice Gateway.');
      await loadCallData(token, account.tenant.slug);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Eva could not start the call.');
    } finally {
      setBusy(false);
    }
  }

  const fromNumber = callData.connection?.signalwire?.values?.fromNumber || swFromNumber;

  return (
    <main style={page}>
      <section style={shell}>
        <header style={header}>
          <div>
            <div style={eyebrow}>EVA PHONE · ARIDON VOICE GATEWAY</div>
            <h1 style={h1}>Type a number. Eva calls.</h1>
            <p style={lead}>Aridon owns the call workflow, AI, permissions, call logic, and interface. The carrier underneath is just telecom plumbing.</p>
          </div>
          <div style={nav}>
            <Link href="/aridon-browser" style={ghost}>Aridon Browser</Link>
            <Link href="/eva-chat" style={ghost}>Eva Chat</Link>
          </div>
        </header>

        <div style={statusBar}>
          <strong>{callData.configured ? '● READY' : '○ ONE-TIME SETUP'}</strong>
          <span>{status}</span>
          {fromNumber ? <span style={small}>Aridon line: {fromNumber}</span> : null}
        </div>

        {!callData.configured || setupOpen ? (
          <section style={setupCard}>
            <div style={setupHeader}>
              <div>
                <div style={eyebrow}>ONE-TIME CARRIER PLUMBING</div>
                <h2 style={setupTitle}>Connect it here. Never live in the carrier dashboard again.</h2>
              </div>
              {callData.configured ? <button type="button" style={tinyButton} onClick={() => setSetupOpen(false)}>Close</button> : null}
            </div>
            <p style={small}>A public U.S. phone number still has to be issued or routed by a licensed carrier. Aridon keeps the carrier underneath the product so Eva’s normal calling stays here.</p>
            <div style={grid2}>
              <div><label style={label}>Space / account name</label><input style={input} value={swSpace} onChange={(e) => setSwSpace(e.target.value)} placeholder="yourspace or full SignalWire URL" autoComplete="off" /></div>
              <div><label style={label}>Project ID</label><input style={input} value={swProjectId} onChange={(e) => setSwProjectId(e.target.value)} placeholder="Project ID" autoComplete="off" /></div>
              <div><label style={label}>API token</label><input style={input} type="password" value={swApiToken} onChange={(e) => setSwApiToken(e.target.value)} placeholder={callData.connection?.signalwire?.apiTokenSaved ? 'Saved securely · leave blank to keep it' : 'Paste once'} autoComplete="new-password" /></div>
              <div><label style={label}>Aridon phone number</label><input style={input} value={swFromNumber} onChange={(e) => setSwFromNumber(e.target.value)} inputMode="tel" placeholder="+1 555 555 5555" /></div>
            </div>
            <button type="button" style={{ ...connectButton, opacity: carrierBusy ? 0.6 : 1 }} disabled={carrierBusy} onClick={() => void saveCarrier()}>{carrierBusy ? 'Connecting…' : 'Connect Aridon Voice Gateway'}</button>
            <p style={small}>The API token is encrypted server-side and is not returned to this screen after saving.</p>
          </section>
        ) : (
          <button type="button" style={tinyButton} onClick={() => setSetupOpen(true)}>Carrier settings</button>
        )}

        <section style={card}>
          <label style={label}>Number to call</label>
          <input style={input} value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" placeholder="(555) 555-5555" />

          <div style={grid2}>
            <div>
              <label style={label}>Contact</label>
              <input style={input} value={contact} onChange={(e) => setContact(e.target.value)} placeholder="Name" />
            </div>
            <div>
              <label style={label}>Company / label</label>
              <input style={input} value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Company" />
            </div>
          </div>

          <label style={label}>What should Eva accomplish?</label>
          <textarea style={textarea} rows={5} value={objective} onChange={(e) => setObjective(e.target.value)} />

          <label style={label}>Permission / relationship basis</label>
          <input style={input} value={permissionBasis} onChange={(e) => setPermissionBasis(e.target.value)} placeholder="Example: Owner-authorized internal test call" />
          <label style={checkRow}>
            <input type="checkbox" checked={permissionConfirmed} onChange={(e) => setPermissionConfirmed(e.target.checked)} />
            <span>I confirm this number/person has agreed to receive this AI voice call.</span>
          </label>

          <button style={{ ...callButton, opacity: busy ? 0.6 : 1 }} disabled={busy} onClick={() => void callEva()}>
            {busy ? 'Connecting Eva…' : 'Call with Eva'}
          </button>
        </section>
      </section>
    </main>
  );
}

const page: React.CSSProperties = { minHeight: '100vh', background: '#080c16', color: '#f4f7ff', padding: '24px 14px 60px', fontFamily: 'Inter, system-ui, sans-serif' };
const shell: React.CSSProperties = { width: 'min(900px, 100%)', margin: '0 auto', display: 'grid', gap: 18 };
const header: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', gap: 18, alignItems: 'flex-start', flexWrap: 'wrap', padding: '14px 4px' };
const eyebrow: React.CSSProperties = { color: '#8aa8ff', fontSize: 12, fontWeight: 900, letterSpacing: 1.6 };
const h1: React.CSSProperties = { fontSize: 'clamp(34px, 8vw, 66px)', lineHeight: 0.98, letterSpacing: -2.2, margin: '10px 0 14px' };
const lead: React.CSSProperties = { color: '#b6c1df', maxWidth: 680, lineHeight: 1.55, fontSize: 17, margin: 0 };
const nav: React.CSSProperties = { display: 'flex', gap: 10, flexWrap: 'wrap' };
const ghost: React.CSSProperties = { color: '#e9eeff', border: '1px solid #33405f', borderRadius: 12, padding: '10px 14px', textDecoration: 'none' };
const statusBar: React.CSSProperties = { display: 'grid', gap: 4, border: '1px solid #33405f', borderRadius: 16, padding: 14, background: '#11182a', color: '#dbe4ff' };
const card: React.CSSProperties = { border: '1px solid #33405f', background: '#0e1525', borderRadius: 22, padding: 'clamp(16px, 4vw, 30px)', display: 'grid', gap: 13, boxShadow: '0 20px 70px rgba(0,0,0,.28)' };
const setupCard: React.CSSProperties = { ...card, borderColor: '#465b91', background: '#101a31' };
const setupHeader: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start', flexWrap: 'wrap' };
const setupTitle: React.CSSProperties = { margin: '6px 0 0', fontSize: 23, lineHeight: 1.15 };
const label: React.CSSProperties = { fontSize: 13, color: '#dce5ff', fontWeight: 900, display: 'block', marginBottom: 6 };
const input: React.CSSProperties = { width: '100%', boxSizing: 'border-box', background: '#080c16', color: '#f5f7ff', border: '1px solid #3a496d', borderRadius: 13, padding: '14px 15px', fontSize: 16, outline: 'none' };
const textarea: React.CSSProperties = { ...input, resize: 'vertical', minHeight: 120, fontFamily: 'inherit' };
const grid2: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 };
const checkRow: React.CSSProperties = { display: 'flex', alignItems: 'flex-start', gap: 10, color: '#c4cee9', lineHeight: 1.45, fontSize: 14 };
const callButton: React.CSSProperties = { border: 0, borderRadius: 15, padding: '16px 20px', background: '#8aa8ff', color: '#06102b', fontWeight: 950, fontSize: 18, cursor: 'pointer', marginTop: 5 };
const connectButton: React.CSSProperties = { ...callButton, background: '#a6ffd7', color: '#061b13' };
const tinyButton: React.CSSProperties = { justifySelf: 'start', border: '1px solid #40527d', borderRadius: 12, background: '#10192c', color: '#dce5ff', padding: '9px 12px', fontWeight: 850, cursor: 'pointer' };
const small: React.CSSProperties = { color: '#93a1c6', fontSize: 12, lineHeight: 1.55 };
