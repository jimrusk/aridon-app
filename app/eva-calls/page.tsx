'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { EVA_AVATAR } from '../../lib/evaIdentity';
import { getBrowserClient } from '../../lib/supabase';

type Account = { tenant: { slug: string; business_name: string } };
type Campaign = { id: string; name: string; mode: string; status: string; max_calls_per_day: number };
type Target = {
  id: string;
  campaign_id?: string | null;
  company_name: string;
  contact_name?: string | null;
  phone: string;
  state?: string | null;
  consent_basis?: string | null;
  compliance_status: string;
  compliance_reason?: string | null;
  call_status: string;
  do_not_call: boolean;
  last_call_at?: string | null;
};
type Event = {
  id: string;
  target_id?: string | null;
  status: string;
  mode: string;
  summary?: string | null;
  next_action?: string | null;
  created_at: string;
};
type Payload = { configured: boolean; campaigns: Campaign[]; targets: Target[]; events: Event[] };

const EVA_PHONE = '(602) 529-4059';
const EVA_EMAIL = 'aridoninfo@aridon.info';

export default function EvaCallsPage() {
  const router = useRouter();
  const [token, setToken] = useState('');
  const [account, setAccount] = useState<Account | null>(null);
  const [data, setData] = useState<Payload | null>(null);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

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
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Eva Call Console could not open.');
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
    return payload.campaign?.id as string;
  }

  async function addTarget() {
    setBusy('add'); setError(''); setNotice('');
    try {
      if (!company.trim() || !phone.trim()) throw new Error('Company and phone number are required.');
      if (!consentConfirmed || consentBasis.trim().length < 8) throw new Error('Record why this person has agreed to receive an AI voice call before adding them to Eva’s AI queue.');
      const campaignId = await ensureEvaCampaign();
      const payload = await post({
        action: 'add_target',
        campaignId,
        companyName: company,
        contactName: contact,
        phone,
        state,
        source: 'eva_call_console',
        consentBasis,
      });
      if (payload.target?.id) {
        await post({
          action: 'set_compliance',
          targetId: payload.target.id,
          status: 'allowed_ai_opt_in',
          reason: `AI voice permission/relationship basis recorded: ${consentBasis}`,
        });
      }
      setCompany(''); setContact(''); setPhone(''); setState(''); setConsentBasis(''); setConsentConfirmed(false);
      setNotice('Added to Eva’s approved AI call queue.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not add this call target.');
    } finally {
      setBusy('');
    }
  }

  async function callWithEva(target: Target) {
    if (!account || !token) return;
    setBusy(target.id); setError(''); setNotice('');
    try {
      const response = await fetch('/api/customer/call-command/eva-dial', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: account.tenant.slug, targetId: target.id, objective }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || 'Eva could not start the call.');
      setNotice(payload.message || `Eva is calling ${target.contact_name || target.company_name}.`);
      await load(token, account.tenant.slug);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Eva could not start the call.');
    } finally {
      setBusy('');
    }
  }

  async function suppressTarget(target: Target) {
    setBusy(`s-${target.id}`); setError(''); setNotice('');
    try {
      await post({ action: 'suppress', phone: target.phone, reason: 'Owner suppression from Eva Call Console.', source: 'eva_call_console' });
      setNotice(`${target.company_name} will not be called again from this workspace.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not suppress this number.');
    } finally {
      setBusy('');
    }
  }

  if (!account || !data) {
    return <main style={page}><div style={{ maxWidth: 760, margin: '0 auto' }}><div style={eyebrow}>EVA · ARIDON PHONE</div><h1 style={h1}>Opening Eva Call Console…</h1><p style={lead}>{error || 'Connecting to your Aridon workspace and call queue.'}</p></div></main>;
  }

  return (
    <main style={page}>
      <div style={shell}>
        <header style={header}>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            <img src={EVA_AVATAR} alt="Eva" style={avatar} />
            <div>
              <div style={eyebrow}>EVA · ARIDON CALL CONSOLE</div>
              <h1 style={h1}>Eva’s phone desk</h1>
              <p style={lead}>Give Eva the person, the reason for the call, and the objective. She handles the conversation and records the phone exchange in Aridon.</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <Link href="/eva-chat" style={outline}>Eva Chat</Link>
            <Link href={`/workspace/${account.tenant.slug}/call-command`} style={outline}>Full Call Command</Link>
            <Link href={`/workspace/${account.tenant.slug}`} style={mint}>Company Home</Link>
          </div>
        </header>

        <section style={identityBar}>
          <div><span style={identityLabel}>CALLER</span><strong>Eva · Aridon</strong></div>
          <div><span style={identityLabel}>BUSINESS NUMBER</span><strong>{EVA_PHONE}</strong></div>
          <div><span style={identityLabel}>BUSINESS EMAIL</span><strong>{EVA_EMAIL}</strong></div>
          <div><span style={identityLabel}>PHONE ENGINE</span><strong>{data.configured ? 'Twilio connected' : 'Needs Twilio credentials'}</strong></div>
        </section>

        <section style={stats}>
          <article style={stat}><strong>{approved.length}</strong><span>AI-approved contacts</span></article>
          <article style={stat}><strong>{data.targets.length}</strong><span>Total call targets</span></article>
          <article style={stat}><strong>{data.events.length}</strong><span>Call events</span></article>
          <article style={stat}><strong>{suppressed}</strong><span>Suppressed / blocked</span></article>
        </section>

        {!data.configured && (
          <section style={setupBox}>
            <div style={{ fontWeight: 950, letterSpacing: 1, fontSize: 12 }}>ONE-TIME PHONE CONNECTION</div>
            <h2 style={{ margin: '7px 0 8px' }}>Eva’s interface is built. The telephone pipe still needs its keys.</h2>
            <p style={{ margin: 0, lineHeight: 1.65 }}>Verify <strong>{EVA_PHONE}</strong> in Twilio as an outbound caller ID, then set <strong>TWILIO_ACCOUNT_SID</strong>, <strong>TWILIO_AUTH_TOKEN</strong>, <strong>TWILIO_FROM_NUMBER</strong> and <strong>PHONE_CALL_SIGNING_SECRET</strong> in Aridon. Keep the Google Voice number where it is.</p>
          </section>
        )}

        <section style={twoCol}>
          <article style={panel}>
            <div style={label}>ADD AN EVA CALL</div>
            <h2 style={h2}>Who should Eva call?</h2>
            <input placeholder="Company or organization" value={company} onChange={(e) => setCompany(e.target.value)} style={input} />
            <input placeholder="Contact name" value={contact} onChange={(e) => setContact(e.target.value)} style={input} />
            <input placeholder="Phone, including area code" value={phone} onChange={(e) => setPhone(e.target.value)} style={input} />
            <input placeholder="State" value={state} onChange={(e) => setState(e.target.value)} style={input} />
            <textarea placeholder="Why is an AI voice call permitted? Example: They asked Eva to call, requested a callback, or gave affirmative permission by email." value={consentBasis} onChange={(e) => setConsentBasis(e.target.value)} style={{ ...input, minHeight: 92, resize: 'vertical' }} />
            <label style={checkRow}>
              <input type="checkbox" checked={consentConfirmed} onChange={(e) => setConsentConfirmed(e.target.checked)} />
              <span>I confirm this contact has a recorded basis for an AI voice call. Eva will not use this AI queue for unconsented cold calls.</span>
            </label>
            <button onClick={() => void addTarget()} disabled={busy === 'add'} style={button}>{busy === 'add' ? 'Adding…' : 'Add to Eva queue'}</button>
          </article>

          <article style={panel}>
            <div style={label}>CALL OBJECTIVE</div>
            <h2 style={h2}>What should Eva accomplish?</h2>
            <textarea value={objective} onChange={(e) => setObjective(e.target.value)} style={{ ...input, minHeight: 190, resize: 'vertical', lineHeight: 1.55 }} />
            <div style={miniCard}><strong>Eva’s opening</strong><p style={muted}>She identifies herself as an AI assistant with Aridon, states the approved reason for the call, and asks whether it is a good time to talk.</p></div>
            <div style={miniCard}><strong>Automatic stop protection</strong><p style={muted}>If someone says “do not call” or “stop calling,” Aridon suppresses that number and Eva ends the call.</p></div>
            <div style={miniCard}><strong>No binding deals</strong><p style={muted}>Eva can explain, qualify interest and request a follow-up. Pricing, contracts, investment commitments and other consequential decisions stay with a human.</p></div>
          </article>
        </section>

        <section style={panelDark}>
          <div style={{ ...label, color: '#F0A27A' }}>APPROVED EVA QUEUE</div>
          <h2 style={{ ...h2, color: '#fff' }}>Ready-to-call contacts</h2>
          <div style={stack}>
            {approved.length ? approved.map((target) => (
              <div key={target.id} style={queueRow}>
                <div style={{ minWidth: 220, flex: 1 }}>
                  <strong style={{ fontSize: 18 }}>{target.contact_name || target.company_name}</strong>
                  <div style={{ color: '#AAB6CA', marginTop: 3 }}>{target.company_name}{target.contact_name ? ` · ${target.phone}` : ` · ${target.phone}`}{target.state ? ` · ${target.state}` : ''}</div>
                  <div style={{ color: '#7ED7B9', fontSize: 12, marginTop: 6 }}>AI permission recorded · {target.call_status}</div>
                  {target.consent_basis && <div style={{ color: '#8F9BB0', fontSize: 12, marginTop: 5, maxWidth: 720 }}>Basis: {target.consent_basis}</div>}
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                  <button disabled={!data.configured || busy === target.id || objective.trim().length < 12} onClick={() => void callWithEva(target)} style={{ ...callButton, opacity: !data.configured || busy === target.id ? .5 : 1 }}>{busy === target.id ? 'Calling…' : '☎ Call with Eva'}</button>
                  <button disabled={busy === `s-${target.id}`} onClick={() => void suppressTarget(target)} style={danger}>Do not call</button>
                </div>
              </div>
            )) : <p style={{ color: '#AAB6CA' }}>No contacts are approved for Eva AI calling yet. Add one above after permission is recorded.</p>}
          </div>
        </section>

        <section style={{ ...panel, marginTop: 14 }}>
          <div style={label}>RECENT PHONE ACTIVITY</div>
          <h2 style={h2}>Eva’s call trail</h2>
          <div style={stack}>
            {data.events.slice(0, 10).map((event) => {
              const target = data.targets.find((item) => item.id === event.target_id);
              return <div key={event.id} style={eventRow}><div><strong>{target?.company_name || 'Call event'}</strong><div style={muted}>{event.mode} · {event.status} · {new Date(event.created_at).toLocaleString()}</div>{event.summary && <div style={muted}>Objective: {event.summary}</div>}</div></div>;
            })}
            {!data.events.length && <p style={muted}>No phone activity recorded yet.</p>}
          </div>
        </section>

        {notice && <div style={successBox}>{notice}</div>}
        {error && <div style={errorBox}>{error}</div>}
      </div>
    </main>
  );
}

const page = { minHeight: '100vh', background: 'radial-gradient(circle at 30% 0%,#2A1820 0,#07101D 38%,#040812 100%)', color: '#F7FAFC', fontFamily: 'Inter,ui-sans-serif,system-ui,Segoe UI,Arial', padding: '28px 20px 80px' };
const shell = { maxWidth: 1240, margin: '0 auto' };
const header = { display: 'flex', justifyContent: 'space-between', gap: 20, alignItems: 'center', flexWrap: 'wrap' as const, marginBottom: 20 };
const avatar = { width: 88, height: 88, borderRadius: '50%', objectFit: 'cover' as const, border: '3px solid #D45A2A', boxShadow: '0 0 36px rgba(212,90,42,.34)', flexShrink: 0 };
const eyebrow = { color: '#F0A27A', fontSize: 12, fontWeight: 950, letterSpacing: 1.2 };
const h1 = { fontSize: 'clamp(40px,6vw,68px)', lineHeight: .98, letterSpacing: -2.5, margin: '7px 0 10px' };
const h2 = { fontSize: 27, margin: '8px 0 15px' };
const lead = { color: '#B9C5D6', fontSize: 17, lineHeight: 1.58, maxWidth: 760, margin: 0 };
const identityBar = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(210px,1fr))', gap: 1, background: '#26364D', border: '1px solid #26364D', borderRadius: 16, overflow: 'hidden', marginBottom: 12 };
const identityLabel = { display: 'block', color: '#7F8DA4', fontSize: 10, letterSpacing: 1, fontWeight: 900, marginBottom: 5 };
const stats = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 10, marginBottom: 14 };
const stat = { background: '#111C2C', border: '1px solid #26364D', borderRadius: 14, padding: 16, display: 'grid', gap: 4 };
const twoCol = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(340px,1fr))', gap: 14, marginBottom: 14 };
const panel = { background: '#F6F3EB', color: '#171717', borderRadius: 18, padding: 20, border: '1px solid #D7D0C3' };
const panelDark = { background: '#0D1728', color: '#fff', borderRadius: 18, padding: 20, border: '1px solid #26364D' };
const setupBox = { background: '#FFF1D8', color: '#342313', border: '1px solid #E6C98D', borderRadius: 16, padding: 18, marginBottom: 14 };
const label = { fontSize: 11, fontWeight: 950, letterSpacing: 1 };
const input = { width: '100%', boxSizing: 'border-box' as const, padding: '12px 13px', borderRadius: 10, border: '1px solid #CFC6B8', margin: '0 0 9px', background: '#fff', color: '#171717' };
const button = { background: '#0C5D49', color: '#fff', border: 0, borderRadius: 10, padding: '12px 15px', fontWeight: 900, cursor: 'pointer' };
const callButton = { background: '#D45A2A', color: '#fff', border: 0, borderRadius: 10, padding: '11px 14px', fontWeight: 950, cursor: 'pointer' };
const danger = { background: '#FBE9EC', color: '#81283B', border: '1px solid #E7B8C1', borderRadius: 9, padding: '9px 10px', fontWeight: 850, cursor: 'pointer' };
const muted = { color: '#6A645D', fontSize: 13, lineHeight: 1.55, margin: '5px 0 0' };
const stack = { display: 'grid', gap: 9 };
const queueRow = { background: '#121E31', border: '1px solid #2C3A52', borderRadius: 13, padding: 14, display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'center', flexWrap: 'wrap' as const };
const eventRow = { background: '#fff', border: '1px solid #D9D1C4', borderRadius: 12, padding: 13 };
const miniCard = { background: '#fff', border: '1px solid #D9D1C4', borderRadius: 11, padding: 12, marginTop: 9 };
const checkRow = { display: 'flex', gap: 9, alignItems: 'flex-start', fontSize: 13, lineHeight: 1.5, margin: '3px 0 13px' };
const errorBox = { background: '#FCE5EA', color: '#7B233A', borderRadius: 10, padding: 12, marginTop: 12 };
const successBox = { background: '#DDF5E9', color: '#174D3E', borderRadius: 10, padding: 12, marginTop: 12 };
const mint = { background: '#9EF0CF', color: '#07130F', padding: '12px 16px', borderRadius: 11, textDecoration: 'none', fontWeight: 950 };
const outline = { border: '1px solid #52627A', color: '#F7FAFC', padding: '11px 15px', borderRadius: 11, textDecoration: 'none', fontWeight: 900 };
