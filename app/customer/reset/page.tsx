'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getBrowserClient } from '../../../lib/supabase';

export default function CustomerResetPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (password.length < 12) {
      setMessage('Use at least 12 characters.');
      return;
    }
    if (password !== confirm) {
      setMessage('The passwords do not match.');
      return;
    }

    setSaving(true);
    const db = getBrowserClient();
    const { error } = await db.auth.updateUser({ password });
    if (error) {
      setMessage(error.message);
      setSaving(false);
      return;
    }
    router.replace('/customer/login');
  }

  return (
    <main style={{ minHeight: '100vh', background: '#0B1020', color: '#F8FAFC', display: 'grid', placeItems: 'center', padding: '24px', fontFamily: 'Arial, sans-serif' }}>
      <form onSubmit={submit} style={{ width: '100%', maxWidth: '460px', background: '#111827', border: '1px solid #2A3857', borderRadius: '18px', padding: '22px', display: 'grid', gap: '14px' }}>
        <div style={{ color: '#9EF0CF', fontSize: '12px', fontWeight: 950, letterSpacing: '1px' }}>PRIVATE BUSINESS OS</div>
        <h1 style={{ margin: 0, fontSize: '34px' }}>Choose a new password.</h1>
        <input type="password" placeholder="New password" autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} style={inputStyle} required />
        <input type="password" placeholder="Confirm password" autoComplete="new-password" value={confirm} onChange={(event) => setConfirm(event.target.value)} style={inputStyle} required />
        {message && <div style={{ color: '#F4C3BC', fontSize: '13px' }}>{message}</div>}
        <button disabled={saving} style={{ border: 0, background: '#9EF0CF', color: '#08130F', padding: '13px', borderRadius: '11px', fontWeight: 950 }}>{saving ? 'Saving…' : 'Save password'}</button>
      </form>
    </main>
  );
}

const inputStyle = { width: '100%', boxSizing: 'border-box' as const, background: '#0A1020', color: '#F8FAFC', border: '1px solid #34415D', borderRadius: '10px', padding: '12px 13px', fontSize: '15px' };
