'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getBrowserClient } from '../../../lib/supabase';

export default function CustomerFinanceEntry() {
  const router = useRouter();

  useEffect(() => {
    const db = getBrowserClient();
    db.auth.getSession().then(async ({ data }) => {
      const token = data.session?.access_token;
      if (!token) {
        router.replace('/customer/login?next=/customer/finance');
        return;
      }
      const response = await fetch('/api/customer/me', {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
      });
      const result = await response.json().catch(() => ({}));
      const slug = result?.tenant?.slug;
      if (!response.ok || !slug) {
        router.replace('/customer/login');
        return;
      }
      router.replace(`/workspace/${encodeURIComponent(slug)}/finance`);
    });
  }, [router]);

  return <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#07101D', color: '#F4F7FB', fontFamily: 'Arial, sans-serif', padding: 24 }}><div style={{ textAlign: 'center' }}><div style={{ fontSize: 11, fontWeight: 950, color: '#9EF0CF', letterSpacing: 1.2 }}>ARIDON FINANCE OS</div><h1 style={{ margin: '8px 0' }}>Opening your finance workspace…</h1><p style={{ color: '#91A0B7' }}>Books · Tax · CFO · Financial Sentinel</p></div></main>;
}
