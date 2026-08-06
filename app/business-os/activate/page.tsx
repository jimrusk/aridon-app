'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';

export default function BusinessOSActivatePage() {
  const [sessionId, setSessionId] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [activated, setActivated] = useState<{ slug: string; businessName: string; email: string; existingAccount: boolean } | null>(null);

  useEffect(() => {
    setSessionId(new URLSearchParams(window.location.search).get('session_id') || '');
  }, []);

  async function activate(event: FormEvent) {
    event.preventDefault();
    if (!sessionId) {
      setMessage('The checkout session is missing. Return to secure checkout.');
      return;
    }
    if (password.length < 12) {
      setMessage('Use a password with at least 12 characters.');
      return;
    }
    if (password !== confirm) {
      setMessage('The passwords do not match.');
      return;
    }

    setLoading(true);
    setMessage('');
    const response = await fetch('/api/business-os/activate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, password }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      setMessage(data.error || 'Activation failed.');
      setLoading(false);
      return;
    }

    setActivated({
      slug: data.tenant.slug,
      businessName: data.tenant.businessName,
      email: data.email,
      existingAccount: Boolean(data.existingAccount),
    });
    setLoading(false);
  }

  if (activated) {
    return (
      <main style={pageStyle}>
        <div style={cardStyle}>
          <div style={{ color: '#9EF0CF', fontSize: '12px', fontWeight: 950, letterSpacing: '1px' }}>WORKSPACE READY</div>
          <h1 style={{ fontSize: '38px', margin: '10px 0' }}>{activated.businessName} is activated.</h1>
          <p style={{ color: '#B7C2D5', lineHeight: 1.6 }}>{activated.existingAccount ? 'This email already had a customer account, so its existing password was preserved for security. Use that password or reset it from the login page.' : `Your login is ${activated.email}.`}</p>
          <Link href="/customer/login" style={primaryLink}>Sign in to the workspace</Link>
        </div>
      </main>
    );
  }

  return (
    <main style={pageStyle}>
      <form onSubmit={activate} style={cardStyle}>
        <div style={{ color: '#9EF0CF', fontSize: '12px', fontWeight: 950, letterSpacing: '1px' }}>FINAL ACTIVATION</div>
        <h1 style={{ fontSize: '38px', margin: '10px 0' }}>Create your customer login.</h1>
        <p style={{ color: '#B7C2D5', lineHeight: 1.6 }}>Payment is complete. Set the password used to enter your private company command center.</p>
        <input type="password" autoComplete="new-password" placeholder="Password, at least 12 characters" value={password} onChange={(event) => setPassword(event.target.value)} style={inputStyle} required />
        <input type="password" autoComplete="new-password" placeholder="Confirm password" value={confirm} onChange={(event) => setConfirm(event.target.value)} style={inputStyle} required />
        {message && <div style={{ color: '#F2B6AD', background: '#2A1718', border: '1px solid #663238', borderRadius: '10px', padding: '11px' }}>{message}</div>}
        <button disabled={loading} style={{ border: 0, borderRadius: '11px', background: '#9EF0CF', color: '#08130F', padding: '13px', fontWeight: 950, cursor: loading ? 'wait' : 'pointer' }}>{loading ? 'Activating…' : 'Activate My Workspace'}</button>
      </form>
    </main>
  );
}

const pageStyle = { minHeight: '100vh', background: '#0B1020', color: '#F8FAFC', display: 'grid', placeItems: 'center', padding: '24px', fontFamily: 'Arial, sans-serif' };
const cardStyle = { width: '100%', maxWidth: '500px', background: '#111827', border: '1px solid #2A3857', borderRadius: '18px', padding: '22px', display: 'grid', gap: '14px' };
const inputStyle = { width: '100%', boxSizing: 'border-box' as const, background: '#0A1020', color: '#F8FAFC', border: '1px solid #34415D', borderRadius: '10px', padding: '12px 13px', fontSize: '15px' };
const primaryLink = { display: 'inline-block', textAlign: 'center' as const, background: '#9EF0CF', color: '#08130F', borderRadius: '11px', padding: '13px', fontWeight: 950, textDecoration: 'none' };
