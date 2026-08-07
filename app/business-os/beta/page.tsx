'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { getBrowserClient } from '../../../lib/supabase';

type CreatedWorkspace = {
  businessName: string;
  email: string;
  workspaceUrl: string;
  startUrl: string;
  loginUrl: string;
};

type BetaForm = {
  ownerName: string;
  businessName: string;
  email: string;
  website: string;
  industry: string;
  offer: string;
  goal: string;
  password: string;
  confirm: string;
  companyTrap: string;
};

const emptyForm: BetaForm = {
  ownerName: '',
  businessName: '',
  email: '',
  website: '',
  industry: '',
  offer: '',
  goal: '',
  password: '',
  confirm: '',
  companyTrap: '',
};

export default function BusinessOSBetaPage() {
  const [invite, setInvite] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [created, setCreated] = useState<CreatedWorkspace | null>(null);
  const [copied, setCopied] = useState(false);
  const [form, setForm] = useState<BetaForm>(emptyForm);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setInvite(params.get('invite') || '');
    try {
      const saved = window.sessionStorage.getItem('business-os-beta-draft');
      if (saved) {
        const parsed = JSON.parse(saved) as Partial<BetaForm>;
        setForm({ ...emptyForm, ...parsed, password: '', confirm: '', companyTrap: '' });
      }
    } catch {
      // A draft is a convenience only. Signup still works if storage is unavailable.
    }
  }, []);

  useEffect(() => {
    if (invite || created) return;
    const { password: _password, confirm: _confirm, companyTrap: _trap, ...safeDraft } = form;
    try {
      window.sessionStorage.setItem('business-os-beta-draft', JSON.stringify(safeDraft));
    } catch {
      // Ignore browser storage failures.
    }
  }, [created, form, invite]);

  const passwordChecks = useMemo(() => {
    return {
      length: form.password.length >= 12,
      letter: /[A-Za-z]/.test(form.password),
      number: /\d/.test(form.password),
      match: Boolean(form.confirm) && form.password === form.confirm,
    };
  }, [form.password, form.confirm]);

  const passwordReady = passwordChecks.length && passwordChecks.letter && passwordChecks.number && passwordChecks.match;

  function update<K extends keyof BetaForm>(key: K, value: BetaForm[K]) {
    setForm((current) => ({ ...current, [key]: value }));
    if (message) setMessage('');
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setMessage('');
    if (!passwordChecks.length || !passwordChecks.letter || !passwordChecks.number) {
      setMessage('Please finish the password rules shown below.');
      return;
    }
    if (!passwordChecks.match) {
      setMessage('The passwords do not match yet.');
      return;
    }

    setLoading(true);
    const endpoint = invite ? '/api/business-os/beta/activate' : '/api/business-os/beta/signup';
    const payload = invite
      ? { invite, password: form.password }
      : {
          ownerName: form.ownerName,
          businessName: form.businessName,
          email: form.email,
          website: form.website,
          industry: form.industry,
          offer: form.offer,
          goal: form.goal,
          password: form.password,
          companyTrap: form.companyTrap,
        };

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      if (data.existing && data.loginUrl) {
        setCreated({
          businessName: form.businessName || 'Your business',
          email: form.email,
          workspaceUrl: data.workspaceUrl || '',
          startUrl: data.loginUrl,
          loginUrl: data.loginUrl,
        });
        setMessage(data.error || 'This email already has a workspace. Sign in to continue.');
      } else {
        setMessage(data.error || 'We could not create the workspace. Please check the highlighted information and try again.');
      }
      setLoading(false);
      return;
    }

    const result: CreatedWorkspace = invite
      ? {
          businessName: data.tenant.businessName,
          email: data.email,
          workspaceUrl: `${window.location.origin}/workspace/${data.tenant.slug}`,
          startUrl: `${window.location.origin}/customer/start`,
          loginUrl: `${window.location.origin}/customer/login?next=${encodeURIComponent('/customer/start')}`,
        }
      : {
          businessName: data.businessName,
          email: data.email,
          workspaceUrl: data.workspaceUrl,
          startUrl: data.startUrl,
          loginUrl: data.loginUrl,
        };

    if (!invite) {
      const db = getBrowserClient();
      await db.auth.signInWithPassword({ email: form.email.trim(), password: form.password });
      try { window.sessionStorage.removeItem('business-os-beta-draft'); } catch {}
    }

    setCreated(result);
    setLoading(false);
  }

  async function copyWorkspaceLink() {
    if (!created?.workspaceUrl) return;
    await navigator.clipboard.writeText(created.workspaceUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2200);
  }

  if (created) {
    return (
      <main style={pageStyle}>
        <section style={cardStyle}>
          <div style={eyebrowStyle}>YOUR BUSINESS OS IS READY</div>
          <h1 style={{ fontSize: 'clamp(36px,7vw,54px)', lineHeight: 1, margin: '10px 0' }}>{created.businessName} has its own workspace.</h1>
          <p style={bodyStyle}>Your login is <strong>{created.email}</strong>. No credit card was requested and no paid subscription was started.</p>
          {message && <div style={infoBox}>{message}</div>}
          <div style={stepsBox}>
            <strong>What happens now:</strong>
            <span>1. Your login and private workspace are already created.</span>
            <span>2. No confirmation email is required for this beta.</span>
            <span>3. Your starter project and first tasks are waiting inside.</span>
            <span>4. Open the startup guide, then ask Eva about a real business problem.</span>
          </div>
          <a href={created.startUrl || created.loginUrl} style={primaryLink}>Start My Business OS</a>
          {created.workspaceUrl && <button type="button" onClick={copyWorkspaceLink} style={secondaryButton}>{copied ? 'Workspace Link Copied' : 'Copy My Workspace Link'}</button>}
          <p style={{ ...bodyStyle, fontSize: '12px' }}>Save the workspace link if you want a direct bookmark. You will still need your email and password to open private company information.</p>
        </section>
      </main>
    );
  }

  return (
    <main style={pageStyle}>
      <div style={{ width: '100%', maxWidth: invite ? '610px' : '1040px', display: 'grid', gap: '16px' }}>
        {!invite && <SampleWorkspace />}

        <form onSubmit={submit} style={{ ...cardStyle, maxWidth: '760px', margin: '0 auto' }}>
          <div style={eyebrowStyle}>{invite ? 'FREE INVITED BETA' : 'FREE BUSINESS OS BETA'}</div>
          <h1 style={{ fontSize: 'clamp(38px,7vw,58px)', lineHeight: 1, margin: '10px 0' }}>{invite ? 'Set up your test workspace.' : 'Build your Business OS.'}</h1>
          <p style={bodyStyle}>{invite ? 'Create your password and we will open the private company workspace that was prepared for you.' : 'Tell us about your company once. We will create your private workspace, login, starter project and first tasks automatically.'}</p>

          {!invite && (
            <>
              <div style={stepsBox}>
                <strong>What you get in about two minutes:</strong>
                <span>A private company home screen.</span>
                <span>Eva for planning, writing, research and decisions.</span>
                <span>Scout for finding possible customers and drafting outreach.</span>
                <span>A starter project and first tasks based on what you tell us.</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: '12px' }} className="beta-grid">
                <label style={labelStyle}>Your name *<input required autoComplete="name" style={inputStyle} value={form.ownerName} onChange={(event) => update('ownerName', event.target.value)} /></label>
                <label style={labelStyle}>Business name *<input required autoComplete="organization" style={inputStyle} value={form.businessName} onChange={(event) => update('businessName', event.target.value)} /></label>
                <label style={labelStyle}>Business email *<input required type="email" autoComplete="email" style={inputStyle} value={form.email} onChange={(event) => update('email', event.target.value)} /><span style={helperStyle}>A regular email is fine if your business does not have its own domain yet.</span></label>
                <label style={labelStyle}>Industry *<input required placeholder="Construction, medical, retail, consulting..." style={inputStyle} value={form.industry} onChange={(event) => update('industry', event.target.value)} /></label>
                <label style={{ ...labelStyle, gridColumn: '1 / -1' }}>Company website <span style={{ fontWeight: 500, color: '#93A1B9' }}>(optional)</span><input type="url" placeholder="https://yourcompany.com" style={inputStyle} value={form.website} onChange={(event) => update('website', event.target.value)} /><span style={helperStyle}>No website yet? Leave this blank. It will not stop you from creating a workspace.</span></label>
              </div>
              <label style={labelStyle}>What does your business sell?<textarea rows={4} placeholder="A short plain-English description is perfect." style={textareaStyle} value={form.offer} onChange={(event) => update('offer', event.target.value)} /></label>
              <label style={labelStyle}>What would you most like help with first?<textarea rows={4} placeholder="Finding customers, getting organized, writing proposals, following up, research, planning..." style={textareaStyle} value={form.goal} onChange={(event) => update('goal', event.target.value)} /></label>
              <input aria-hidden="true" tabIndex={-1} autoComplete="off" value={form.companyTrap} onChange={(event) => update('companyTrap', event.target.value)} style={{ position: 'absolute', left: '-10000px', width: '1px', height: '1px' }} />
            </>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: '12px' }} className="beta-grid">
            <label style={labelStyle}>Create a password *<input type="password" required minLength={12} autoComplete="new-password" value={form.password} onChange={(event) => update('password', event.target.value)} placeholder="At least 12 characters" style={inputStyle} /></label>
            <label style={labelStyle}>Type it again *<input type="password" required minLength={12} autoComplete="new-password" value={form.confirm} onChange={(event) => update('confirm', event.target.value)} style={{ ...inputStyle, borderColor: form.confirm && !passwordChecks.match ? '#A94A55' : inputStyle.border }} /></label>
          </div>

          <div style={passwordBox} aria-live="polite">
            <strong>Password rules</strong>
            <Rule ok={passwordChecks.length} text="12 or more characters" />
            <Rule ok={passwordChecks.letter} text="At least one letter" />
            <Rule ok={passwordChecks.number} text="At least one number" />
            <Rule ok={passwordChecks.match} text={form.confirm ? 'Both passwords match' : 'Type the same password twice'} />
          </div>

          <div style={afterClickBox}>
            <strong>After you click Create My Free Business OS:</strong>
            <span>Setup usually takes less than a minute.</span>
            <span>Your account is created immediately. There is no beta confirmation email to wait for.</span>
            <span>You are taken to your startup guide and can then open your company home screen.</span>
            <span>Your starter project and tasks are created from the information above.</span>
          </div>

          {message && <div aria-live="assertive" style={{ background: '#2A1718', border: '1px solid #663238', color: '#F2B6AD', borderRadius: '10px', padding: '11px 13px' }}>{message}</div>}
          <button disabled={loading || !passwordReady} type="submit" style={{ border: 0, borderRadius: '11px', background: '#9EF0CF', color: '#08130F', padding: '15px', fontWeight: 950, fontSize: '16px', cursor: loading ? 'wait' : passwordReady ? 'pointer' : 'not-allowed', opacity: passwordReady ? 1 : .55 }}>{loading ? 'Building your Business OS…' : invite ? 'Open My Free Test Workspace' : 'Create My Free Business OS'}</button>
          <div style={{ color: '#8290A8', fontSize: '12px', lineHeight: 1.55 }}>{invite ? 'Nothing is charged during this beta activation.' : <>By creating a beta workspace, you agree to the <Link href="/business-os/terms" style={legalLink}>Beta Terms</Link> and acknowledge the <Link href="/business-os/privacy" style={legalLink}>Privacy Notice</Link>. No payment information is requested. Important actions such as sending sales outreach remain under your control.</>}</div>
          {!invite && <Link href="/customer/login" style={{ color: '#B9CFFF', textAlign: 'center', fontWeight: 800 }}>Already created a workspace? Sign in</Link>}
        </form>
      </div>
      <style>{`@media(max-width:700px){.beta-grid{grid-template-columns:1fr !important}.beta-grid label{grid-column:auto !important}.sample-grid{grid-template-columns:1fr !important}}`}</style>
    </main>
  );
}

function SampleWorkspace() {
  return (
    <section style={{ background: '#08101D', border: '1px solid #2A3857', borderRadius: '20px', padding: '20px', boxShadow: '0 24px 70px rgba(0,0,0,.22)' }}>
      <div style={{ color: '#9EF0CF', fontSize: '12px', fontWeight: 950 }}>EXAMPLE WORKSPACE</div>
      <h2 style={{ fontSize: 'clamp(26px,4vw,36px)', margin: '8px 0 6px' }}>This is the kind of home screen we create for your business.</h2>
      <p style={{ ...bodyStyle, marginBottom: '14px' }}>Example: a small construction company could open its workspace and immediately see its first priorities, ask Eva for a bid follow-up email, or have Scout research local commercial property managers.</p>
      <div className="sample-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: '10px' }}>
        <SampleCard title="Ask Eva" text="Draft a proposal follow-up and tell me what I should do next." />
        <SampleCard title="Find Customers" text="Research local buyers who fit what my company sells." />
        <SampleCard title="My Work" text="3 starter tasks · 1 active project · company notes in one place." />
      </div>
    </section>
  );
}

function SampleCard({ title, text }: { title: string; text: string }) {
  return <div style={{ background: '#111827', border: '1px solid #2E3C59', borderRadius: '14px', padding: '14px' }}><strong style={{ color: '#9EF0CF' }}>{title}</strong><div style={{ color: '#C4CEDD', fontSize: '13px', lineHeight: 1.5, marginTop: '6px' }}>{text}</div></div>;
}

function Rule({ ok, text }: { ok: boolean; text: string }) {
  return <span style={{ color: ok ? '#A9E9CC' : '#A9B4C7' }}>{ok ? '✓' : '○'} {text}</span>;
}

const pageStyle = { minHeight: '100vh', background: '#0B1020', color: '#F8FAFC', display: 'grid', placeItems: 'center', padding: '24px', fontFamily: 'Arial, sans-serif' };
const cardStyle = { width: '100%', maxWidth: '610px', background: '#111827', border: '1px solid #2A3857', borderRadius: '20px', padding: '24px', display: 'grid', gap: '14px', boxShadow: '0 28px 80px rgba(0,0,0,.28)' };
const eyebrowStyle = { color: '#9EF0CF', fontSize: '12px', fontWeight: 950 };
const bodyStyle = { color: '#B7C2D5', lineHeight: 1.65, margin: 0 };
const labelStyle = { display: 'grid', gap: '6px', color: '#D4DCEA', fontSize: '13px', fontWeight: 850 };
const helperStyle = { color: '#8E9CB4', fontSize: '11px', lineHeight: 1.4, fontWeight: 500 };
const inputStyle = { width: '100%', boxSizing: 'border-box' as const, background: '#0A1020', color: '#F8FAFC', border: '1px solid #34415D', borderRadius: '10px', padding: '12px 13px', fontSize: '15px' };
const textareaStyle = { ...inputStyle, resize: 'vertical' as const, lineHeight: 1.5 };
const stepsBox = { background: '#102033', border: '1px solid #29405A', borderRadius: '12px', padding: '13px', color: '#C6D5E9', lineHeight: 1.65, display: 'grid', gap: '4px' };
const passwordBox = { background: '#0D1626', border: '1px solid #34415D', borderRadius: '12px', padding: '12px 13px', color: '#C9D3E4', lineHeight: 1.55, display: 'grid', gap: '3px', fontSize: '12px' };
const afterClickBox = { background: '#172033', border: '1px solid #34415D', borderRadius: '12px', padding: '13px', color: '#C9D3E4', lineHeight: 1.55, display: 'grid', gap: '4px', fontSize: '13px' };
const infoBox = { background: '#182238', border: '1px solid #314363', borderRadius: '10px', padding: '11px 13px', color: '#D6E1F4' };
const primaryLink = { display: 'inline-block', textAlign: 'center' as const, background: '#9EF0CF', color: '#08130F', borderRadius: '11px', padding: '14px', fontWeight: 950, textDecoration: 'none' };
const secondaryButton = { border: '1px solid #415171', background: '#111827', color: '#E4EAF5', borderRadius: '11px', padding: '12px 15px', fontWeight: 850, cursor: 'pointer' };
const legalLink = { color: '#B9CFFF', fontWeight: 800 };
