'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { getBrowserClient } from '../../../lib/supabase';

type CreatedWorkspace = {
  businessName: string;
  email: string;
  workspaceUrl: string;
  startUrl: string;
  loginUrl: string;
};

export default function BusinessOSBetaPage() {
  const [invite, setInvite] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [created, setCreated] = useState<CreatedWorkspace | null>(null);
  const [copied, setCopied] = useState(false);
  const [form, setForm] = useState({
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
  });

  useEffect(() => {
    setInvite(new URLSearchParams(window.location.search).get('invite') || '');
  }, []);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setMessage('');
    if (form.password.length < 12) {
      setMessage('Please use a password with at least 12 characters.');
      return;
    }
    if (form.password !== form.confirm) {
      setMessage('The passwords do not match.');
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
        setMessage(data.error || 'This email already has a workspace.');
      } else {
        setMessage(data.error || 'We could not create the workspace.');
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
            <strong>Start here:</strong>
            <span>1. Open your startup guide.</span>
            <span>2. Ask Eva about a real business problem.</span>
            <span>3. Let Scout learn what you sell and look for possible customers.</span>
            <span>4. Come back to Home to see your work in one place.</span>
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
      <form onSubmit={submit} style={{ ...cardStyle, maxWidth: invite ? '610px' : '760px' }}>
        <div style={eyebrowStyle}>{invite ? 'FREE INVITED BETA' : 'FREE BUSINESS OS BETA'}</div>
        <h1 style={{ fontSize: 'clamp(38px,7vw,58px)', lineHeight: 1, margin: '10px 0' }}>{invite ? 'Set up your test workspace.' : 'Build your Business OS.'}</h1>
        <p style={bodyStyle}>{invite ? 'Create your password and we will open the private company workspace that was prepared for you.' : 'Tell us about your company once. We will create your private workspace, login, starter project and first tasks automatically.'}</p>

        {!invite && (
          <>
            <div style={stepsBox}>
              <strong>This takes about two minutes.</strong>
              <span>No credit card.</span>
              <span>No software setup.</span>
              <span>No need to understand AI terminology.</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: '12px' }} className="beta-grid">
              <label style={labelStyle}>Your name *<input required style={inputStyle} value={form.ownerName} onChange={(event) => setForm({ ...form, ownerName: event.target.value })} /></label>
              <label style={labelStyle}>Business name *<input required style={inputStyle} value={form.businessName} onChange={(event) => setForm({ ...form, businessName: event.target.value })} /></label>
              <label style={labelStyle}>Business email *<input required type="email" autoComplete="email" style={inputStyle} value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} /></label>
              <label style={labelStyle}>Industry *<input required placeholder="Construction, medical, retail, consulting..." style={inputStyle} value={form.industry} onChange={(event) => setForm({ ...form, industry: event.target.value })} /></label>
              <label style={{ ...labelStyle, gridColumn: '1 / -1' }}>Company website<input type="url" placeholder="https://yourcompany.com" style={inputStyle} value={form.website} onChange={(event) => setForm({ ...form, website: event.target.value })} /></label>
            </div>
            <label style={labelStyle}>What does your business sell?<textarea rows={4} placeholder="A short plain-English description is perfect." style={textareaStyle} value={form.offer} onChange={(event) => setForm({ ...form, offer: event.target.value })} /></label>
            <label style={labelStyle}>What would you most like help with first?<textarea rows={4} placeholder="Finding customers, getting organized, writing proposals, following up, research, planning..." style={textareaStyle} value={form.goal} onChange={(event) => setForm({ ...form, goal: event.target.value })} /></label>
            <input aria-hidden="true" tabIndex={-1} autoComplete="off" value={form.companyTrap} onChange={(event) => setForm({ ...form, companyTrap: event.target.value })} style={{ position: 'absolute', left: '-10000px', width: '1px', height: '1px' }} />
          </>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: '12px' }} className="beta-grid">
          <label style={labelStyle}>Create a password *<input type="password" required autoComplete="new-password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} placeholder="At least 12 characters" style={inputStyle} /></label>
          <label style={labelStyle}>Type it again *<input type="password" required autoComplete="new-password" value={form.confirm} onChange={(event) => setForm({ ...form, confirm: event.target.value })} style={inputStyle} /></label>
        </div>

        {message && <div style={{ background: '#2A1718', border: '1px solid #663238', color: '#F2B6AD', borderRadius: '10px', padding: '11px 13px' }}>{message}</div>}
        <button disabled={loading} type="submit" style={{ border: 0, borderRadius: '11px', background: '#9EF0CF', color: '#08130F', padding: '15px', fontWeight: 950, fontSize: '16px', cursor: loading ? 'wait' : 'pointer' }}>{loading ? 'Building your Business OS…' : invite ? 'Open My Free Test Workspace' : 'Create My Free Business OS'}</button>
        <div style={{ color: '#8290A8', fontSize: '12px', lineHeight: 1.55 }}>{invite ? 'Nothing is charged during this beta activation.' : 'By creating a beta workspace, you are creating a private test account. No payment information is requested. Important actions such as sending sales outreach remain under your control.'}</div>
        {!invite && <Link href="/customer/login" style={{ color: '#B9CFFF', textAlign: 'center', fontWeight: 800 }}>Already created a workspace? Sign in</Link>}
      </form>
      <style>{`@media(max-width:700px){.beta-grid{grid-template-columns:1fr !important}.beta-grid label{grid-column:auto !important}}`}</style>
    </main>
  );
}

const pageStyle = { minHeight: '100vh', background: '#0B1020', color: '#F8FAFC', display: 'grid', placeItems: 'center', padding: '24px', fontFamily: 'Arial, sans-serif' };
const cardStyle = { width: '100%', maxWidth: '610px', background: '#111827', border: '1px solid #2A3857', borderRadius: '20px', padding: '24px', display: 'grid', gap: '14px', boxShadow: '0 28px 80px rgba(0,0,0,.28)' };
const eyebrowStyle = { color: '#9EF0CF', fontSize: '12px', fontWeight: 950 };
const bodyStyle = { color: '#B7C2D5', lineHeight: 1.65, margin: 0 };
const labelStyle = { display: 'grid', gap: '6px', color: '#D4DCEA', fontSize: '13px', fontWeight: 850 };
const inputStyle = { width: '100%', boxSizing: 'border-box' as const, background: '#0A1020', color: '#F8FAFC', border: '1px solid #34415D', borderRadius: '10px', padding: '12px 13px', fontSize: '15px' };
const textareaStyle = { ...inputStyle, resize: 'vertical' as const, lineHeight: 1.5 };
const stepsBox = { background: '#102033', border: '1px solid #29405A', borderRadius: '12px', padding: '13px', color: '#C6D5E9', lineHeight: 1.65, display: 'grid', gap: '4px' };
const infoBox = { background: '#182238', border: '1px solid #314363', borderRadius: '10px', padding: '11px 13px', color: '#D6E1F4' };
const primaryLink = { display: 'inline-block', textAlign: 'center' as const, background: '#9EF0CF', color: '#08130F', borderRadius: '11px', padding: '14px', fontWeight: 950, textDecoration: 'none' };
const secondaryButton = { border: '1px solid #415171', background: '#111827', color: '#E4EAF5', borderRadius: '11px', padding: '12px 15px', fontWeight: 850, cursor: 'pointer' };
