'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';

export default function BusinessOSBetaPage() {
  const [invite, setInvite] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [activated, setActivated] = useState<{ businessName: string; slug: string; email: string; existingAccount: boolean } | null>(null);

  useEffect(() => { setInvite(new URLSearchParams(window.location.search).get('invite') || ''); }, []);

  async function activate(event: FormEvent) {
    event.preventDefault();
    if (!invite) { setMessage('This invitation link is incomplete. Ask the person who invited you for a new link.'); return; }
    if (password.length < 12) { setMessage('Please use a password with at least 12 characters.'); return; }
    if (password !== confirm) { setMessage('The passwords do not match.'); return; }
    setLoading(true); setMessage('');
    const response = await fetch('/api/business-os/beta/activate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ invite, password }) });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) { setMessage(data.error || 'We could not activate this test workspace.'); setLoading(false); return; }
    setActivated({ businessName: data.tenant.businessName, slug: data.tenant.slug, email: data.email, existingAccount: Boolean(data.existingAccount) });
    setLoading(false);
  }

  if (activated) {
    return (
      <main style={pageStyle}>
        <section style={cardStyle}>
          <div style={eyebrowStyle}>FREE BETA TEST</div>
          <h1 style={{ fontSize: 'clamp(36px,7vw,54px)', lineHeight: 1, margin: '10px 0' }}>{activated.businessName} is ready.</h1>
          <p style={bodyStyle}>{activated.existingAccount ? 'This email already had an account, so your existing password is still in place.' : `Your login email is ${activated.email}. No payment method was requested.`}</p>
          <div style={stepsBox}><strong>When you sign in:</strong><span>1. Open <b>Start Here</b>.</span><span>2. Ask Eva a real business question.</span><span>3. Try Find Customers if sales is useful to you.</span><span>4. Tell us what was confusing or helpful.</span></div>
          <Link href="/customer/login" style={primaryLink}>Sign In to My Test Workspace</Link>
        </section>
      </main>
    );
  }

  return (
    <main style={pageStyle}>
      <form onSubmit={activate} style={cardStyle}>
        <div style={eyebrowStyle}>FREE INVITED BETA TEST</div>
        <h1 style={{ fontSize: 'clamp(38px,7vw,56px)', lineHeight: 1, margin: '10px 0' }}>Try the business workspace at no cost.</h1>
        <p style={bodyStyle}>Your company gets its own private login and workspace with AI business help, sales research and company tools. This test does not ask for a credit card and does not start billing.</p>
        <div style={stepsBox}><strong>What we ask from you:</strong><span>Use it on real business work.</span><span>Tell us what was useful.</span><span>Tell us what was confusing.</span><span>Tell us what would make you want to keep using it.</span></div>
        <label style={labelStyle}>Create a password<input type="password" required autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="At least 12 characters" style={inputStyle} /></label>
        <label style={labelStyle}>Type the password again<input type="password" required autoComplete="new-password" value={confirm} onChange={(event) => setConfirm(event.target.value)} style={inputStyle} /></label>
        {message && <div style={{ background: '#2A1718', border: '1px solid #663238', color: '#F2B6AD', borderRadius: '10px', padding: '11px 13px' }}>{message}</div>}
        <button disabled={loading} type="submit" style={{ border: 0, borderRadius: '11px', background: '#9EF0CF', color: '#08130F', padding: '14px', fontWeight: 950, fontSize: '16px', cursor: loading ? 'wait' : 'pointer' }}>{loading ? 'Setting up your workspace…' : 'Set Up My Free Test Workspace'}</button>
        <div style={{ color: '#8290A8', fontSize: '12px', lineHeight: 1.5 }}>This invitation can only be used once. You can decide later whether you want a paid plan. Nothing is charged during this activation.</div>
      </form>
    </main>
  );
}

const pageStyle = { minHeight: '100vh', background: '#0B1020', color: '#F8FAFC', display: 'grid', placeItems: 'center', padding: '24px', fontFamily: 'Arial, sans-serif' };
const cardStyle = { width: '100%', maxWidth: '610px', background: '#111827', border: '1px solid #2A3857', borderRadius: '20px', padding: '24px', display: 'grid', gap: '14px', boxShadow: '0 28px 80px rgba(0,0,0,.28)' };
const eyebrowStyle = { color: '#9EF0CF', fontSize: '12px', fontWeight: 950 };
const bodyStyle = { color: '#B7C2D5', lineHeight: 1.65, margin: 0 };
const labelStyle = { display: 'grid', gap: '6px', color: '#D4DCEA', fontSize: '13px', fontWeight: 850 };
const inputStyle = { width: '100%', boxSizing: 'border-box' as const, background: '#0A1020', color: '#F8FAFC', border: '1px solid #34415D', borderRadius: '10px', padding: '12px 13px', fontSize: '15px' };
const stepsBox = { background: '#102033', border: '1px solid #29405A', borderRadius: '12px', padding: '13px', color: '#C6D5E9', lineHeight: 1.65, display: 'grid', gap: '4px' };
const primaryLink = { display: 'inline-block', textAlign: 'center' as const, background: '#9EF0CF', color: '#08130F', borderRadius: '11px', padding: '13px', fontWeight: 950, textDecoration: 'none' };
