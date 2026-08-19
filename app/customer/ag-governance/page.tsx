'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getBrowserClient } from '../../../lib/supabase';

export default function CustomerAgGovernanceEntry() {
  const router = useRouter();
  const [message, setMessage] = useState('Opening your Sustainable Agriculture Governance workspace…');

  useEffect(() => {
    const db = getBrowserClient();
    db.auth.getSession().then(async ({ data }) => {
      const accessToken = data.session?.access_token;
      if (!accessToken) {
        router.replace('/customer/login?next=/customer/ag-governance');
        return;
      }
      const response = await fetch('/api/customer/me', { headers: { Authorization: `Bearer ${accessToken}` }, cache: 'no-store' });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result?.tenant?.slug) {
        setMessage(result.error || 'No company workspace is attached to this login.');
        return;
      }
      router.replace(`/workspace/${encodeURIComponent(result.tenant.slug)}/ag-governance`);
    });
  }, [router]);

  return <main style={{ minHeight: '100vh', background: '#0B1020', color: '#F8FAFC', display: 'grid', placeItems: 'center', padding: 24, fontFamily: 'Arial,sans-serif' }}><div style={{ maxWidth: 620, textAlign: 'center' }}><div style={{ color: '#A9E67A', fontSize: 12, fontWeight: 950 }}>ARIDON AG ENTERPRISE</div><h1>Sustainable Agriculture Governance</h1><p style={{ color: '#B7C2D5', lineHeight: 1.6 }}>{message}</p><Link href="/customer/login" style={{ color: '#A9E67A', fontWeight: 900 }}>Customer login</Link></div></main>;
}
