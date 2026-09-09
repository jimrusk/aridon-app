'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getBrowserClient } from '../../lib/supabase';

export default function WorkerConnectionsLauncher() {
  const router = useRouter();
  const [message, setMessage] = useState('Opening Eva Identity & Connections…');

  useEffect(() => {
    const db = getBrowserClient();
    db.auth.getSession().then(async ({ data }) => {
      const token = data.session?.access_token || '';
      if (!token) {
        router.replace('/customer/login?next=/worker-connections');
        return;
      }
      const response = await fetch('/api/customer/me', {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.tenant?.slug) {
        setMessage(result.error || 'No active Aridon workspace is attached to this account.');
        return;
      }
      router.replace(`/workspace/${result.tenant.slug}/worker-connections`);
    });
  }, [router]);

  return <main style={{minHeight:'100vh',display:'grid',placeItems:'center',background:'#0B1020',color:'#F8FAFC',padding:24,fontFamily:'Inter,ui-sans-serif,system-ui,Segoe UI,Arial',fontWeight:900}}>{message}</main>;
}
