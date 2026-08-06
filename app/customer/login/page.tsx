'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getBrowserClient } from '../../../lib/supabase';

export default function CustomerLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const db = getBrowserClient();
    db.auth.getSession().then(async ({ data }) => {
      const token = data.session?.access_token;
      if (!token) return;
      const response = await fetch('/api/customer/me', { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' });
      const result = await response.json().catch(() => ({}));
      if (response.ok && result.tenant?.slug) router.replace(`/workspace/${result.tenant.slug}`);
    });
  }, [router]);

  async function signIn(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setMessage('');
    const db = getBrowserClient();
    const { data, error } = await db.auth.signInWithPassword({ email: email.trim(), password });
    if (error || !data.session) {
      setMessage(error?.message || 'Login failed.');
      setLoading(false);
      return;
    }

    const response = await fetch('/api/customer/me', {
      headers: { Authorization: `Bearer ${data.session.access_token}` },
      cache: 'no-store',
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok || !result.tenant?.slug) {
      setMessage(result.error || 'No workspace is attached to this account.');
      setLoading(false);
      return;
    }

    router.replace(`/workspace/${result.tenant.slug}`);
  }

  async function resetPassword() {
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      setMessage('Enter your email first, then tap Reset password.');
      return;
    }
    const db = getBrowserClient();
    const { error } = await db.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/customer/reset`,
    });
    setMessage(error ? error.message : 'Password reset email sent.');
  }

  return (
    <main style={{ minHeight: '100vh', background: '#0B1020', color: '#F8FAFC', display: 'grid', placeItems: 'center', padding: '24px', fontFamily: 'Arial, sans-serif' }}>
      <div style={{ width: '100%', maxWidth: '470px' }}>
        <div style={{ fontSize: '12px', fontWeight: 950, letterSpacing: '1.2px', color: '#9EF0CF' }}>PRIVATE BUSINESS OS</div>
        <h1 style={{ fontSize: '42px', lineHeight: 1, margin: '12px 0 10px' }}>Sign in to your company workspace.</h1>
        <p style={{ color: '#AAB7CF', lineHeight: 1.6, marginBottom: '22px' }}>Your company data, projects and AI operating tools stay inside your business workspace.</p>

        <form onSubmit={signIn} style={{ background: '#111827', border: '1px solid #2A3857', borderRadius: '18px', padding: '20px', display: 'grid', gap: '14px' }}>
          <label style={{ display: 'grid', gap: '6px', fontSize: '13px', fontWeight: 850 }}>Email
            <input type="email" required value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" style={inputStyle} />
          </label>
          <label style={{ display: 'grid', gap: '6px', fontSize: '13px', fontWeight: 850 }}>Password
            <input type="password" required value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" style={inputStyle} />
          </label>
          {message && <div style={{ background: '#1C2538', border: '1px solid #354461', borderRadius: '10px', padding: '11px', color: '#D4DEEF', fontSize: '13px' }}>{message}</div>}
          <button type="submit" disabled={loading} style={{ border: 0, background: '#9EF0CF', color: '#08130F', padding: '13px', borderRadius: '11px', fontWeight: 950, cursor: loading ? 'wait' : 'pointer' }}>{loading ? 'Signing in…' : 'Sign in'}</button>
          <button type="button" onClick={resetPassword} style={{ border: '1px solid #34415D', background: 'transparent', color: '#D5DEEE', padding: '11px', borderRadius: '11px', fontWeight: 800, cursor: 'pointer' }}>Reset password</button>
        </form>

        <div style={{ marginTop: '16px', color: '#8190AB', fontSize: '13px' }}>
          Not activated yet? <Link href="/business-os" style={{ color: '#B9CFFF' }}>See the Private Business OS.</Link>
        </div>
      </div>
    </main>
  );
}

const inputStyle = {
  width: '100%',
  boxSizing: 'border-box' as const,
  background: '#0A1020',
  color: '#F8FAFC',
  border: '1px solid #34415D',
  borderRadius: '10px',
  padding: '12px 13px',
  fontSize: '15px',
};
