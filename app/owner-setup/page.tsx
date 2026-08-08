'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';

export default function OwnerSetupPage() {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const [complete, setComplete] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setMessage('');
    if (password.length < 12 || password.length > 64) {
      setMessage('Use a password between 12 and 64 characters.');
      return;
    }
    if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
      setMessage('Include at least one letter and one number.');
      return;
    }
    if (password !== confirm) {
      setMessage('The passwords do not match.');
      return;
    }

    setSaving(true);
    try {
      const response = await fetch('/api/owner-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        setMessage(result.error || 'Unable to update the password.');
        return;
      }
      setPassword('');
      setConfirm('');
      setComplete(true);
      setMessage('Owner password saved. You can now sign in to Private Business OS.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <main style={{ minHeight: '100vh', background: 'radial-gradient(circle at 50% 0%,#18213c 0,#090b12 45%,#05060a 100%)', color: '#F8FAFC', display: 'grid', placeItems: 'center', padding: '24px', fontFamily: 'Arial, sans-serif' }}>
      <div style={{ width: '100%', maxWidth: '500px' }}>
        <div style={{ color: '#9EF0CF', fontSize: '12px', fontWeight: 950, letterSpacing: '1px' }}>ARIDON OWNER ACCESS</div>
        <h1 style={{ fontSize: '40px', margin: '10px 0' }}>Set your owner password.</h1>
        <p style={{ color: '#AAB7CF', lineHeight: 1.6 }}>This page is protected by the Aridon Command Center. The password you choose here becomes your Private Business OS owner password.</p>

        <form onSubmit={submit} style={{ marginTop: '20px', background: '#111827', border: '1px solid #2A3857', borderRadius: '18px', padding: '20px', display: 'grid', gap: '14px' }}>
          <input type="password" autoComplete="new-password" required placeholder="New password" value={password} onChange={(event) => setPassword(event.target.value)} style={inputStyle} />
          <input type="password" autoComplete="new-password" required placeholder="Confirm new password" value={confirm} onChange={(event) => setConfirm(event.target.value)} style={inputStyle} />
          {message && <div style={{ background: complete ? '#123027' : '#271B24', border: `1px solid ${complete ? '#2C7059' : '#6A394A'}`, color: complete ? '#BDF5DF' : '#F4C3CF', borderRadius: '11px', padding: '12px', lineHeight: 1.5 }}>{message}</div>}
          {!complete && <button disabled={saving} type="submit" style={{ border: 0, background: '#9EF0CF', color: '#08130F', padding: '13px', borderRadius: '11px', fontWeight: 950, cursor: saving ? 'wait' : 'pointer' }}>{saving ? 'Saving…' : 'Save owner password'}</button>}
          {complete && <Link href="/customer/login" style={{ textAlign: 'center', background: '#9EF0CF', color: '#08130F', padding: '13px', borderRadius: '11px', fontWeight: 950, textDecoration: 'none' }}>Go to Sign In</Link>}
        </form>
      </div>
    </main>
  );
}

const inputStyle = { width: '100%', boxSizing: 'border-box' as const, background: '#0A1020', color: '#F8FAFC', border: '1px solid #34415D', borderRadius: '10px', padding: '13px', fontSize: '16px' };
