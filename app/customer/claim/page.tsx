'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getBrowserClient } from '../../../lib/supabase';

export default function CustomerClaimPage() {
  const router = useRouter();
  const search = useSearchParams();
  const [message, setMessage] = useState('Verifying your Aridon owner account…');

  useEffect(() => {
    let active = true;

    async function claim() {
      const tokenHash = search.get('token_hash') || '';
      const type = search.get('type') || 'recovery';
      if (!tokenHash) {
        if (active) setMessage('This account link is missing its verification token.');
        return;
      }

      const db = getBrowserClient();
      const { error } = await db.auth.verifyOtp({
        token_hash: tokenHash,
        type: type === 'invite' ? 'invite' : 'recovery',
      });

      if (error) {
        if (active) setMessage('This account link is invalid or has expired.');
        return;
      }

      router.replace('/customer/reset');
    }

    claim();
    return () => { active = false; };
  }, [router, search]);

  return (
    <main style={{ minHeight: '100vh', background: '#0B1020', color: '#F8FAFC', display: 'grid', placeItems: 'center', padding: '24px', fontFamily: 'Arial, sans-serif' }}>
      <div style={{ width: '100%', maxWidth: '460px', background: '#111827', border: '1px solid #2A3857', borderRadius: '18px', padding: '22px' }}>
        <div style={{ color: '#9EF0CF', fontSize: '12px', fontWeight: 950, letterSpacing: '1px' }}>ARIDON OWNER ACCESS</div>
        <h1 style={{ fontSize: '34px', margin: '10px 0' }}>Setting up your login.</h1>
        <p style={{ color: '#AAB7CF', lineHeight: 1.6 }}>{message}</p>
      </div>
    </main>
  );
}
