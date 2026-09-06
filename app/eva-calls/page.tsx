'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
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
type Payload = { configured: boolean; provider?: 'signalwire' | 'twilio' | null; campaigns: Campaign[]; targets: Target[]; events: Event[] };

const EVA_PHONE = '(602) 529-4059';
const EVA_EMAIL = 'aridoninfo@aridon.info';

export default function EvaCallsPage() {
  const router = useRouter();
  const [token, setToken] = useState('');
  const [account, setAccount] = useState<Account | null>(null);
  const [data, setData] = useState<Payload | null>(null);
  const [busy, setBusy] = useState('');
  const [message, setMessage] = useState('');
  const [company, setCompany] = useState('');
  const [contact, setContact] = useState('');
  const [phone, setPhone] = useState('');
  const [state, setState] = useState('');
  const [consentBasis, setConsentBasis] = useState('');
  const [consentConfirmed, setConsentConfirmed] = useState(false);
  const [objective, setObjective] = useState('Introduce Aridon, explain the relevant opportunity, answer questions, and ask whether a short follow-up meeting would be useful.');

  async function load(access: string, slug: string) {
    const response = await fetch(`/api/customer/call-command?slug=${encodeURIComponent(slug)}`, {
      headers: { Authorization: `Bearer ${access}` },
      cache: 'no-store',
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.error || 'Unable to load Eva Call Console.');
    setData(payload as Payload);
  }

  useEffect(() => {
    const db = getBrowserClient();
    db.auth.getSession().then(async ({ data: sessionData }) => {
      const access = sessionData.session?.access_token || '';
      if (!access) {
        router.replace('/customer/login?next=/eva-calls');
        return;
      }
      setToken(access);
      try {
        const me = await fetch('/api/customer/me', { headers: { Authorization: `Bearer ${access}` }, cache: 'no-store' });
        const mePayload = await me.json().catch(() => ({}));
        if (!me.ok || !mePayload.tenant?.slug) throw new Error(mePayload.error || 'Your Aridon workspace could not be opened.');
        const nextAccount = mePayload as Account;
        setAccount(nextAccount);
        await load(access, nextAccount.tenant.slug);
      } catch (error) {
        setMessage(error instanceof Error ? error.message : 'Eva Call Console could not open.');
      }
    });
  }, [router]);

  const approved = useMemo(() => data?.targets.filter((item) => item.compliance_status === 'allowed_ai_opt_in' && !item.do_not_call) || [], [data]);
  const suppressed = useMemo(() => data?.targets.filter((item) => item.do_not_call || item.compliance_status === 'blocked').length || 0, [data]);

  async function post(body: Record<string, unknown>) {
    if (!token || !account) throw new Error('Eva is not connected to your workspace yet.');
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
    const existing = data?.campaigns.find((item) => item.mode === 'ai_opt_in');
    if (existing) return existing.id;
    const payload = await post({ action: 'create_campaign', name: 'Eva AI Calls', mode: 'ai_opt_in', maxCallsPerDay: 20 });
    return String(payload.campaign?.id || '');
  }

  async function addTarget() {
    setBusy('add'); setMessage('');
    try {
      if (!company.trim() || !phone.trim()) throw new Error('Company and phone number are required.');
      if (!consentConfirmed || consentBasis.trim().length < 8) throw new Error('Record why this person has agreed to receive an AI voice call.');
      const campaignId = await ensureEvaCampaign();
      const payload = await post({ action: 'add_target', campaignId, companyName: company, contactName: contact, phone, state, source: 'eva_call_console', consentBasis });
      if (payload.target?.id) {
        await post({
          action: 'set_compliance',
          targetId: payload.target.id,
          status: 'allowed_ai_opt_in',
          reason: `AI voice permission/relationship basis recorded: ${consentBasis}`,
        });
      }
      setCompany(''); setContact(''); setPhone(''); setState(''); setConsentBasis(''); setConsentConfirmed(false);
      setMessage('Added to Eva’s approved call queue.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not add the call target.');
    } finally {
      setBusy('');
    }
  }

  async function callWithEva(target: Target) {
    if (!account || !token) return;
    setBusy(target.id); setMessage('');
    try {
      const response = await fetch('/api/customer/call-command/eva-dial', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: account.tenant.slug, targetId: target.id, objective }),
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
    setBusy(`s-${target.id}`); setMessage('');
    try {
      await post({ action: 'suppress', phone: target.phone, reason: 'Owner suppression from Eva Call Console.', source: 'eva_call_console' });
      setMessage(`${target.company_name} will not be called again from this workspace.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not suppress this number.');
    } finally {
      setBusy('');
    }
  }

  if (!account || !data) {
    return <main style={page}><div style={shell}><h1 style={h1}>Opening Eva Call Console…</h1><p style={muted}>{message || 'Connecting to your Aridon workspace.'}</p></div></main>;
  }

  const providerName = data.provider === 'signalwire' ? 'SignalWire' : data.provider === 'twilio' ? 'Twilio fallback' : 'Not connected';

  return (
    <main style={page}>
      <div style={shell}>
        <header style={header}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <img src={EVA_AVATAR} alt="Eva" style={avatar} />
            <div>
              <div style={eyebrow}>EVA · ARIDON CALL CONSOLE</div>
              <h1 style={h1}>Eva’s phone desk</h1>
              <p style={lead}>Eva uses Aridon’s own call engine. No Autocalls subscription, and SignalWire is now the preferred carrier.</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <Link href="/eva-chat" style={outline}>Eva Chat</Link>
            <Link href={`/workspace/${account.tenant.slug}/call-command`} style={outline}>Call Command</Link>
            <Link href={`/workspace/${account.tenant.slug}`} style={mint}>Company Home</Link>
          </div>
        </header>

        <section style={identityBar}>
          <div><span style={identityLabel}>CALLER</span><strong>Eva · Aridon</strong></div>
          <div><span style={identityLabel}>CALLER ID</span><strong>{EVA_PHONE}</strong></div>
          <div><span style={identityLabel}>EMAIL</span><strong>{EVA_EMAIL}</strong></div>
          <div><span style={identityLabel}>VOICE CARRIER</span><strong>{providerName}</strong></div>
        </section>

        {!data.configured && (
          <section style={setupBox}>
            <div style={eyebrow}>ONE-TIME SIGNALWIRE CONNECTION</div>
            <h2 style={h2}>Keep the 602 number in Google Voice.</h2>
            <p style={muted}>In SignalWire, verify <strong>{EVA_PHONE}</strong> under Phone Numbers → Verified. SignalWire calls the number and gives you a verification code. Then Aridon needs the SignalWire Space name, Project ID, API Token, and the verified caller ID +16025294059. No new phone number is required.</p>
          </section>
        )}

        <section style={stats}>
          <article style={stat}><strong>{approved.length}</strong><span>AI-approved contacts</span></article>
          <article style={stat}><strong>{data.events.length}</strong><span>Call events</span></article>
          <article style={stat}><strong>{suppressed}</strong><span>Suppressed</span></article>
          <article style={stat}><strong>{data.configured ? 'READY' : 'SETUP'}</strong><span>{providerName}</span></article>
        </section>

        <section style={twoCol}>
          <article style={panel}>
            <div style={label}>ADD CALL</div>
            <h2 style={h2}>Who should Eva call?</h2>
            <input style={input} placeholder="Company or organization" value={company} onChange={(e) => setCompany(e.target.value)} />
            <input style={input} placeholder="Contact name" value={contact} onChange={(e) => setContact(e.target.value)} />
            <input style={input} placeholder="Phone number" value={phone} onChange={(e) => setPhone(e.target.value)} />
            <input style={input} placeholder="State" value={state} onChange={(e) => setState(e.target.value)} />
            <textarea style={{ ...input, minHeight: 92 }} placeholder="Why is an AI call permitted?" value={consentBasis} onChange={(e) => setConsentBasis(e.target.value)} />
            <label style={checkRow}><input type="checkbox" checked={consentConfirmed} onChange={(e) => setConsentConfirmed(e.target.checked)} /><span>I confirm this contact has a recorded basis for an AI voice call.</span></label>
            <button style={button} disabled={busy === 'add'} onClick={() => void addTarget()}>{busy === 'add' ? 'Adding…' : 'Add to Eva queue'}</button>
          </article>

          <article style={panel}>
            <div style={label}>CALL OBJECTIVE</div>
            <h2 style={h2}>What should Eva accomplish?</h2>
            <textarea style={{ ...input, minHeight: 190 }} value={objective} onChange={(e) => setObjective(e.target.value)} />
            <p style={muted}>Eva identifies herself as an AI assistant with Aridon, explains the purpose of the call, honors stop requests, and does not make binding pricing, legal, investment, or contractual commitments.</p>
          </article>
        </section>

        <section style={darkPanel}>
          <div style={{ ...label, color: '#F0A27A' }}>APPROVED EVA QUEUE</div>
          <h2 style={{ ...h2, color: '#fff' }}>Ready-to-call contacts</h2>
          <div style={{ display: 'grid', gap: 10 }}>
            {approved.length ? approved.map((target) => (
              <div key={target.id} style={queueRow}>
                <div style={{ flex: 1 }}>
                  <strong>{target.contact_name || target.company_name}</strong>
                  <div style={{ color: '#AAB6CA', marginTop: 4 }}>{target.company_name} · {target.phone}{target.state ? ` · ${target.state}` : ''}</div>
                  {target.consent_basis && <div style={{ color: '#8190A8', fontSize: 12, marginTop: 5 }}>Basis: {target.consent_basis}</div>}
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button style={{ ...callButton, opacity: data.configured ? 1 : .45 }} disabled={!data.configured || busy === target.id} onClick={() => void callWithEva(target)}>{busy === target.id ? 'Calling…' : '☎ Call with Eva'}</button>
                  <button style={danger} disabled={busy === `s-${target.id}`} onClick={() => void suppressTarget(target)}>Do not call</button>
                </div>
              </div>
            )) : <p style={{ color: '#AAB6CA' }}>No approved AI-call contacts yet.</p>}
          </div>
        </section>

        {message && <div style={messageBox}>{message}</div>}
      </div>
    </main>
  );
}

const page = { minHeight: '100vh', background: 'radial-gradient(circle at 30% 0%,#2A1820 0,#07101D 38%,#040812 100%)', color: '#F7FAFC', fontFamily: 'Inter,ui-sans-serif,system-ui,Segoe UI,Arial', padding: '28px 20px 80px' };
const shell = { maxWidth: 1180, margin: '0 auto' };
const header = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 18, flexWrap: 'wrap' as const, marginBottom: 20 };
const avatar = { width: 76, height: 76, borderRadius: '50%', objectFit: 'cover' as const, border: '3px solid #D45A2A', boxShadow: '0 0 28px rgba(212,90,42,.35)' };
const eyebrow = { color: '#F0A27A', fontSize: 12, fontWeight: 950, letterSpacing: 1.2 };
const h1 = { fontSize: 'clamp(40px,6vw,68px)', lineHeight: .98, letterSpacing: -2.5, margin: '7px 0 10px' };
const h2 = { fontSize: 25, margin: '7px 0 14px' };
const lead = { color: '#B9C5D6', fontSize: 17, lineHeight: 1.58, maxWidth: 760, margin: 0 };
const muted = { color: '#6C7482', fontSize: 14, lineHeight: 1.6 };
const identityBar = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(190px,1fr))', gap: 10, background: '#101827', border: '1px solid #28364C', borderRadius: 16, padding: 14, marginBottom: 14 };
const identityLabel = { display: 'block', color: '#8390A5', fontSize: 10, fontWeight: 900, letterSpacing: 1, marginBottom: 4 };
const stats = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 10, marginBottom: 14 };
const stat = { background: '#111C2C', border: '1px solid #26364D', borderRadius: 14, padding: 15, display: 'grid', gap: 4 };
const twoCol = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(330px,1fr))', gap: 14, marginBottom: 14 };
const panel = { background: '#F6F3EB', color: '#171717', borderRadius: 18, padding: 20, border: '1px solid #D7D0C3' };
const darkPanel = { background: '#0D1728', color: '#fff', borderRadius: 18, padding: 20, border: '1px solid #26364D' };
const setupBox = { background: '#FFF0CD', color: '#392B0F', border: '1px solid #E5C36B', borderRadius: 16, padding: 18, marginBottom: 14 };
const label = { fontSize: 11, fontWeight: 950, letterSpacing: 1 };
const input = { width: '100%', boxSizing: 'border-box' as const, padding: '12px 13px', borderRadius: 10, border: '1px solid #CFC6B8', margin: '0 0 9px', background: '#fff', resize: 'vertical' as const };
const checkRow = { display: 'flex', alignItems: 'flex-start', gap: 9, fontSize: 13, lineHeight: 1.5, margin: '8px 0 14px' };
const button = { background: '#0C5D49', color: '#fff', border: 0, borderRadius: 10, padding: '12px 15px', fontWeight: 900, cursor: 'pointer' };
const callButton = { background: '#D45A2A', color: '#fff', border: 0, borderRadius: 10, padding: '11px 14px', fontWeight: 950, cursor: 'pointer' };
const danger = { background: '#FBE9EC', color: '#81283B', border: '1px solid #E7B8C1', borderRadius: 9, padding: '10px 12px', fontWeight: 850, cursor: 'pointer' };
const queueRow = { background: '#121E31', border: '1px solid #2A3B55', borderRadius: 13, padding: 14, display: 'flex', gap: 14, alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' as const };
const mint = { background: '#9EF0CF', color: '#07130F', padding: '11px 14px', borderRadius: 10, textDecoration: 'none', fontWeight: 950 };
const outline = { border: '1px solid #52627A', color: '#F7FAFC', padding: '10px 13px', borderRadius: 10, textDecoration: 'none', fontWeight: 900 };
const messageBox = { background: '#19263A', border: '1px solid #38506F', color: '#DCE7F5', borderRadius: 12, padding: 13, marginTop: 14 };
