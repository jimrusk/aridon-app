'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { EVA_AVATAR } from '../../lib/evaIdentity';
import { getBrowserClient } from '../../lib/supabase';

type Account = { tenant: { slug: string; business_name: string } };
type Campaign = { id: string; name: string; mode: string };
type Target = {
  id: string;
  company_name: string;
  contact_name?: string | null;
  phone: string;
  state?: string | null;
  consent_basis?: string | null;
  compliance_status: string;
  call_status: string;
  do_not_call: boolean;
};
type Event = { id: string; target_id?: string | null; status: string; mode: string; summary?: string | null; created_at: string };
type ConnectionStatus = {
  signalwire: { space: boolean; projectId: boolean; apiToken: boolean; fromNumber: boolean };
  twilio: { accountSid: boolean; authToken: boolean; fromNumber: boolean };
};
type Payload = {
  configured: boolean;
  provider?: 'signalwire' | 'twilio' | null;
  connection?: ConnectionStatus;
  campaigns: Campaign[];
  targets: Target[];
  events: Event[];
};

type AuthState = 'checking' | 'connected' | 'signed_out' | 'error';

const EVA_PHONE = '(602) 529-4059';
const EVA_EMAIL = 'aridoninfo@aridon.info';
const DEFAULT_OBJECTIVE = 'Introduce Aridon, explain the relevant opportunity, answer questions, and ask whether a short follow-up meeting would be useful.';
const EMPTY_DATA: Payload = { configured: false, provider: null, campaigns: [], targets: [], events: [] };

async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return await Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error('Connection check timed out.')), ms)),
  ]);
}

export default function EvaCallsPage() {
  const [token, setToken] = useState('');
  const [account, setAccount] = useState<Account | null>(null);
  const [data, setData] = useState<Payload>(EMPTY_DATA);
  const [authState, setAuthState] = useState<AuthState>('checking');
  const [busy, setBusy] = useState('');
  const [message, setMessage] = useState('');

  const [company, setCompany] = useState('');
  const [contact, setContact] = useState('');
  const [phone, setPhone] = useState('');
  const [state, setState] = useState('');
  const [consentBasis, setConsentBasis] = useState('');
  const [consentConfirmed, setConsentConfirmed] = useState(false);
  const [objective, setObjective] = useState(DEFAULT_OBJECTIVE);

  async function load(access: string, slug: string) {
    const response = await fetch(`/api/customer/call-command?slug=${encodeURIComponent(slug)}&t=${Date.now()}`, {
      headers: { Authorization: `Bearer ${access}` },
      cache: 'no-store',
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.error || 'Unable to load Eva Call Console.');
    setData({ ...EMPTY_DATA, ...(payload as Payload) });
  }

  async function bootstrap() {
    setAuthState('checking');
    setMessage('');
    try {
      const db = getBrowserClient();
      const sessionResult = await withTimeout(db.auth.getSession(), 8000);
      const access = sessionResult.data.session?.access_token || '';
      if (!access) {
        setToken('');
        setAccount(null);
        setAuthState('signed_out');
        setMessage('The call desk is editable, but you need to sign in before saving or placing a call.');
        return;
      }

      setToken(access);
      const me = await withTimeout(fetch('/api/customer/me', {
        headers: { Authorization: `Bearer ${access}` },
        cache: 'no-store',
      }), 10000);
      const mePayload = await me.json().catch(() => ({}));
      if (!me.ok || !mePayload.tenant?.slug) throw new Error(mePayload.error || 'Your Aridon workspace could not be opened.');

      const nextAccount = mePayload as Account;
      setAccount(nextAccount);
      await withTimeout(load(access, nextAccount.tenant.slug), 12000);
      setAuthState('connected');
    } catch (error) {
      setAuthState('error');
      setMessage(error instanceof Error ? error.message : 'Eva Call Console could not connect. You can still edit the call details below.');
    }
  }

  useEffect(() => {
    void bootstrap();
  }, []);

  const approved = useMemo(
    () => data.targets.filter((item) => item.compliance_status === 'allowed_ai_opt_in' && !item.do_not_call),
    [data.targets],
  );
  const suppressed = useMemo(
    () => data.targets.filter((item) => item.do_not_call || item.compliance_status === 'blocked').length,
    [data.targets],
  );

  async function post(body: Record<string, unknown>) {
    if (!token || !account) throw new Error('Sign in to Aridon before saving call changes.');
    const response = await fetch('/api/customer/call-command', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug: account.tenant.slug, ...body }),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.error || 'Call Console action failed.');
    await load(token, account.tenant.slug);
    return payload;
  }

  async function ensureEvaCampaign() {
    const existing = data.campaigns.find((item) => item.mode === 'ai_opt_in');
    if (existing) return existing.id;
    const payload = await post({ action: 'create_campaign', name: 'Eva AI Calls', mode: 'ai_opt_in', maxCallsPerDay: 20 });
    return String(payload.campaign?.id || '');
  }

  function loadJimTest() {
    setCompany('Aridon Test');
    setContact('Jim');
    setPhone('505-360-9529');
    setState('NM');
    setConsentBasis('Owner-authorized internal Eva voice test.');
    setConsentConfirmed(true);
    setObjective('Run a short live Eva voice test. Introduce yourself as Eva, an AI assistant with Aridon, confirm the audio is clear, answer a simple question, and keep the call brief.');
    setMessage('Jim test call loaded. You can edit every field before adding it to the queue.');
  }

  async function addTarget() {
    setBusy('add');
    setMessage('');
    try {
      if (!company.trim() || !phone.trim()) throw new Error('Company and phone number are required.');
      if (!consentConfirmed || consentBasis.trim().length < 8) throw new Error('Record why this person has agreed to receive an AI voice call.');
      const campaignId = await ensureEvaCampaign();
      const payload = await post({
        action: 'add_target',
        campaignId,
        companyName: company.trim(),
        contactName: contact.trim(),
        phone: phone.trim(),
        state: state.trim(),
        source: 'eva_call_console',
        consentBasis: consentBasis.trim(),
      });
      if (payload.target?.id) {
        await post({
          action: 'set_compliance',
          targetId: payload.target.id,
          status: 'allowed_ai_opt_in',
          reason: `AI voice permission/relationship basis recorded: ${consentBasis.trim()}`,
        });
      }
      setMessage('Added to Eva’s approved call queue.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not add the call target.');
    } finally {
      setBusy('');
    }
  }

  async function callWithEva(target: Target) {
    if (!account || !token) {
      setMessage('Sign in to Aridon before placing a call.');
      return;
    }
    setBusy(target.id);
    setMessage('');
    try {
      const response = await fetch('/api/customer/call-command/eva-dial', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: account.tenant.slug, targetId: target.id, objective: objective.trim() || DEFAULT_OBJECTIVE }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || 'Eva could not start the call.');
      setMessage(payload.message || `Eva is calling ${target.contact_name || target.company_name}.`);
      await load(token, account.tenant.slug);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Eva could not start the call.');
    } finally {
      setBusy('');
    }
  }

  async function suppressTarget(target: Target) {
    setBusy(`s-${target.id}`);
    setMessage('');
    try {
      await post({ action: 'suppress', phone: target.phone, reason: 'Owner suppression from Eva Call Console.', source: 'eva_call_console' });
      setMessage(`${target.company_name} will not be called again from this workspace.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not suppress this number.');
    } finally {
      setBusy('');
    }
  }

  const providerName = data.provider === 'signalwire' ? 'SignalWire' : data.provider === 'twilio' ? 'Twilio fallback' : 'Not connected';
  const sw = data.connection?.signalwire;
  const workspaceSlug = account?.tenant?.slug || 'aridon';
  const workspaceLabel = authState === 'connected'
    ? `Connected to ${account?.tenant?.business_name || 'Aridon'}`
    : authState === 'checking'
      ? 'Checking workspace connection…'
      : authState === 'signed_out'
        ? 'Not signed in'
        : 'Workspace connection needs attention';

  return (
    <main style={page}>
      <div style={shell}>
        <header style={header}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <img src={EVA_AVATAR} alt="Eva" style={avatar} />
            <div>
              <div style={eyebrow}>EVA · ARIDON CALL CONSOLE</div>
              <h1 style={h1}>Eva’s phone desk</h1>
              <p style={lead}>The call desk stays editable even while Aridon checks the workspace and phone carrier.</p>
            </div>
          </div>
          <div style={navRow}>
            <Link href="/eva-chat" style={outline}>Eva Chat</Link>
            <Link href={`/workspace/${workspaceSlug}/call-command`} style={outline}>Call Command</Link>
            <Link href={`/workspace/${workspaceSlug}`} style={mint}>Company Home</Link>
          </div>
        </header>

        <section style={statusStrip}>
          <strong>{workspaceLabel}</strong>
          <button type="button" style={smallButton} onClick={() => void bootstrap()} disabled={authState === 'checking'}>
            {authState === 'checking' ? 'Checking…' : 'Refresh status'}
          </button>
          {authState === 'signed_out' && <Link href="/customer/login?next=/eva-calls" style={smallLink}>Sign in</Link>}
        </section>

        <section style={identityBar}>
          <div><span style={identityLabel}>CALLER</span><strong>Eva · Aridon</strong></div>
          <div><span style={identityLabel}>CALLER ID</span><strong>{EVA_PHONE}</strong></div>
          <div><span style={identityLabel}>EMAIL</span><strong>{EVA_EMAIL}</strong></div>
          <div><span style={identityLabel}>VOICE CARRIER</span><strong>{providerName}</strong></div>
        </section>

        <section style={setupBox}>
          <div style={eyebrow}>SIGNALWIRE CONNECTION CHECK</div>
          <h2 style={h2}>{data.configured ? 'SignalWire is ready.' : 'SignalWire is not ready inside Aridon yet.'}</h2>
          <div style={connectionGrid}>
            <div style={connectionItem}><strong>{sw ? (sw.space ? '✓' : '✕') : '…'} Space name</strong></div>
            <div style={connectionItem}><strong>{sw ? (sw.projectId ? '✓' : '✕') : '…'} Project ID</strong></div>
            <div style={connectionItem}><strong>{sw ? (sw.apiToken ? '✓' : '✕') : '…'} API token</strong></div>
            <div style={connectionItem}><strong>{sw ? (sw.fromNumber ? '✓' : '✕') : '…'} From number</strong></div>
          </div>
          <p style={muted}>These indicators only show whether Aridon can see each setting. Secret values are never displayed on this screen.</p>
        </section>

        <section style={stats}>
          <article style={stat}><strong>{approved.length}</strong><span>AI-approved contacts</span></article>
          <article style={stat}><strong>{data.events.length}</strong><span>Call events</span></article>
          <article style={stat}><strong>{suppressed}</strong><span>Suppressed</span></article>
          <article style={stat}><strong>{data.configured ? 'READY' : 'SETUP'}</strong><span>{providerName}</span></article>
        </section>

        <section style={twoCol}>
          <article style={panel} data-no-translate="true">
            <div style={panelTopRow}>
              <div>
                <div style={label}>ADD CALL</div>
                <h2 style={h2}>Who should Eva call?</h2>
              </div>
              <button type="button" style={presetButton} onClick={loadJimTest}>Load Jim test</button>
            </div>

            <label style={fieldLabel}>Company or organization</label>
            <input style={input} value={company} onChange={(e) => setCompany(e.target.value)} autoComplete="off" />
            <label style={fieldLabel}>Contact name</label>
            <input style={input} value={contact} onChange={(e) => setContact(e.target.value)} autoComplete="off" />
            <label style={fieldLabel}>Phone number</label>
            <input style={input} value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" autoComplete="tel" />
            <label style={fieldLabel}>State</label>
            <input style={input} value={state} onChange={(e) => setState(e.target.value)} autoComplete="address-level1" />
            <label style={fieldLabel}>Why is an AI call permitted?</label>
            <textarea style={{ ...input, minHeight: 90 }} value={consentBasis} onChange={(e) => setConsentBasis(e.target.value)} />
            <label style={checkRow}>
              <input type="checkbox" checked={consentConfirmed} onChange={(e) => setConsentConfirmed(e.target.checked)} />
              <span>I confirm this contact has a recorded basis for an AI voice call.</span>
            </label>
            <button type="button" style={button} disabled={busy === 'add'} onClick={() => void addTarget()}>
              {busy === 'add' ? 'Adding…' : 'Add to Eva queue'}
            </button>
          </article>

          <article style={panel} data-no-translate="true">
            <div style={label}>CALL OBJECTIVE</div>
            <h2 style={h2}>What should Eva accomplish?</h2>
            <textarea style={{ ...input, minHeight: 230 }} value={objective} onChange={(e) => setObjective(e.target.value)} />
            <p style={muted}>You can edit this at any time. Eva identifies herself as an AI assistant with Aridon and does not make binding pricing, legal, investment, purchasing, or contractual commitments.</p>
          </article>
        </section>

        <section style={darkPanel}>
          <div style={{ ...label, color: '#F0A27A' }}>APPROVED EVA QUEUE</div>
          <h2 style={{ ...h2, color: '#fff' }}>Ready-to-call contacts</h2>
          <div style={{ display: 'grid', gap: 10 }}>
            {approved.length ? approved.map((target) => (
              <div key={target.id} style={queueRow}>
                <div style={{ flex: 1, minWidth: 210 }}>
                  <strong>{target.contact_name || target.company_name}</strong>
                  <div style={{ color: '#AAB6CA', marginTop: 4 }}>{target.company_name} · {target.phone}{target.state ? ` · ${target.state}` : ''}</div>
                  {target.consent_basis && <div style={{ color: '#8190A8', fontSize: 12, marginTop: 5 }}>Basis: {target.consent_basis}</div>}
                </div>
                <div style={queueActions}>
                  <button
                    type="button"
                    style={{ ...callButton, opacity: data.configured ? 1 : .48 }}
                    disabled={!data.configured || busy === target.id}
                    onClick={() => void callWithEva(target)}
                  >
                    {busy === target.id ? 'Calling…' : '☎ Call with Eva'}
                  </button>
                  <button type="button" style={danger} disabled={busy === `s-${target.id}`} onClick={() => void suppressTarget(target)}>Do not call</button>
                </div>
              </div>
            )) : <p style={{ color: '#AAB6CA' }}>No approved AI-call contacts yet. Use “Load Jim test” above to fill the first test in one tap.</p>}
          </div>
        </section>

        {message && <div style={messageBox}>{message}</div>}
      </div>
    </main>
  );
}

const page = {
  minHeight: '100vh',
  background: 'radial-gradient(circle at 30% 0%,#2A1820 0,#07101D 38%,#040812 100%)',
  color: '#F7FAFC',
  fontFamily: 'Inter,ui-sans-serif,system-ui,Segoe UI,Arial',
  padding: '24px 14px 80px',
};
const shell = { maxWidth: 1120, margin: '0 auto' };
const header = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap' as const, marginBottom: 16 };
const avatar = { width: 68, height: 68, borderRadius: '50%', objectFit: 'cover' as const, border: '3px solid #D45A2A', boxShadow: '0 0 28px rgba(212,90,42,.35)' };
const eyebrow = { color: '#F0A27A', fontSize: 12, fontWeight: 950, letterSpacing: 1.2 };
const h1 = { fontSize: 'clamp(36px,7vw,64px)', lineHeight: 1, letterSpacing: -2.2, margin: '6px 0 9px' };
const h2 = { fontSize: 24, margin: '7px 0 14px' };
const lead = { color: '#B9C5D6', fontSize: 16, lineHeight: 1.55, maxWidth: 720, margin: 0 };
const muted = { color: '#6C7482', fontSize: 14, lineHeight: 1.6 };
const navRow = { display: 'flex', gap: 8, flexWrap: 'wrap' as const };
const statusStrip = { display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' as const, background: '#101827', border: '1px solid #2A3B55', borderRadius: 14, padding: 12, marginBottom: 12 };
const identityBar = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 10, background: '#101827', border: '1px solid #28364C', borderRadius: 16, padding: 14, marginBottom: 12 };
const identityLabel = { display: 'block', color: '#8390A5', fontSize: 10, fontWeight: 900, letterSpacing: 1, marginBottom: 4 };
const setupBox = { background: '#FFF0CD', color: '#392B0F', border: '1px solid #E5C36B', borderRadius: 16, padding: 18, marginBottom: 12 };
const connectionGrid = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 8, marginBottom: 8 };
const connectionItem = { background: 'rgba(255,255,255,.55)', borderRadius: 10, padding: 10 };
const stats = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(145px,1fr))', gap: 10, marginBottom: 12 };
const stat = { background: '#111C2C', border: '1px solid #26364D', borderRadius: 14, padding: 15, display: 'grid', gap: 4 };
const twoCol = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(310px,1fr))', gap: 14, marginBottom: 14 };
const panel = { position: 'relative' as const, zIndex: 2, background: '#F6F3EB', color: '#171717', borderRadius: 18, padding: 18, border: '1px solid #D7D0C3', pointerEvents: 'auto' as const, touchAction: 'manipulation' as const };
const darkPanel = { background: '#0D1728', color: '#fff', borderRadius: 18, padding: 18, border: '1px solid #26364D' };
const panelTopRow = { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, flexWrap: 'wrap' as const };
const label = { fontSize: 11, fontWeight: 950, letterSpacing: 1 };
const fieldLabel = { display: 'block', fontSize: 12, fontWeight: 850, marginBottom: 5, color: '#4A4238' };
const input = { width: '100%', boxSizing: 'border-box' as const, padding: '13px 14px', borderRadius: 10, border: '1px solid #BEB4A6', margin: '0 0 11px', background: '#fff', color: '#111', fontSize: 16, lineHeight: 1.35, resize: 'vertical' as const, pointerEvents: 'auto' as const, touchAction: 'manipulation' as const, WebkitUserSelect: 'text' as const, userSelect: 'text' as const };
const checkRow = { display: 'flex', alignItems: 'flex-start', gap: 9, fontSize: 13, lineHeight: 1.5, margin: '8px 0 14px' };
const button = { background: '#0C5D49', color: '#fff', border: 0, borderRadius: 10, padding: '13px 16px', fontWeight: 900, fontSize: 15, cursor: 'pointer', touchAction: 'manipulation' as const };
const presetButton = { background: '#D45A2A', color: '#fff', border: 0, borderRadius: 10, padding: '10px 12px', fontWeight: 900, cursor: 'pointer', touchAction: 'manipulation' as const };
const smallButton = { background: '#24344E', color: '#fff', border: '1px solid #3D5375', borderRadius: 9, padding: '8px 10px', fontWeight: 850, cursor: 'pointer' };
const smallLink = { background: '#9EF0CF', color: '#07130F', borderRadius: 9, padding: '8px 10px', textDecoration: 'none', fontWeight: 900 };
const callButton = { background: '#D45A2A', color: '#fff', border: 0, borderRadius: 10, padding: '11px 14px', fontWeight: 950, cursor: 'pointer' };
const danger = { background: '#FBE9EC', color: '#81283B', border: '1px solid #E7B8C1', borderRadius: 9, padding: '10px 12px', fontWeight: 850, cursor: 'pointer' };
const queueRow = { background: '#121E31', border: '1px solid #2A3B55', borderRadius: 13, padding: 14, display: 'flex', gap: 14, alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' as const };
const queueActions = { display: 'flex', gap: 8, flexWrap: 'wrap' as const };
const mint = { background: '#9EF0CF', color: '#07130F', padding: '10px 13px', borderRadius: 10, textDecoration: 'none', fontWeight: 950 };
const outline = { border: '1px solid #52627A', color: '#F7FAFC', padding: '10px 13px', borderRadius: 10, textDecoration: 'none', fontWeight: 900 };
const messageBox = { background: '#19263A', border: '1px solid #38506F', color: '#DCE7F5', borderRadius: 12, padding: 13, marginTop: 14, position: 'sticky' as const, bottom: 10, zIndex: 6 };
