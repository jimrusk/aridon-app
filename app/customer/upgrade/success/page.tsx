'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getBrowserClient } from '../../../../lib/supabase';

type Account = {
  tenant: {
    slug: string;
    business_name: string;
    plan: string | null;
    subscription_status: string | null;
  };
};

export default function UpgradeSuccessPage() {
  const router = useRouter();
  const [account, setAccount] = useState<Account | null>(null);
  const [status, setStatus] = useState('Stripe accepted the checkout. Finishing your Business OS upgrade…');

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    async function check(attempt: number) {
      const db = getBrowserClient();
      const { data } = await db.auth.getSession();
      const token = data.session?.access_token;
      if (!token) {
        router.replace('/customer/login?next=/customer/upgrade/success');
        return;
      }

      const response = await fetch('/api/customer/me', {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
      });
      const result = await response.json().catch(() => ({}));
      if (cancelled) return;
      if (response.ok && result.tenant) {
        setAccount(result as Account);
        if (result.tenant.plan && result.tenant.plan !== 'beta') {
          setStatus('Your paid plan is active. Your existing workspace and business data stayed right where they were.');
          return;
        }
      }

      if (attempt < 10) {
        timer = setTimeout(() => check(attempt + 1), 1500);
      } else {
        setStatus('Payment was completed, but the plan update is still being confirmed. Give it a moment, then refresh this page or open Account.');
      }
    }

    check(0);
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [router]);

  const upgraded = Boolean(account?.tenant.plan && account.tenant.plan !== 'beta');
  const home = account?.tenant.slug ? `/workspace/${account.tenant.slug}` : '/customer/account';

  return (
    <main style={{ minHeight: '100vh', background: '#0B1020', color: '#F8FAFC', display: 'grid', placeItems: 'center', padding: '24px', fontFamily: 'Arial, sans-serif' }}>
      <section style={{ width: '100%', maxWidth: '680px', background: '#111827', border: '1px solid #2A3857', borderRadius: '22px', padding: '26px', display: 'grid', gap: '15px' }}>
        <div style={{ color: '#9EF0CF', fontSize: '12px', fontWeight: 950 }}>{upgraded ? 'UPGRADE COMPLETE' : 'CONFIRMING YOUR UPGRADE'}</div>
        <h1 style={{ fontSize: 'clamp(38px,7vw,58px)', lineHeight: 1, margin: 0 }}>{upgraded ? `${account?.tenant.business_name} is now on ${account?.tenant.plan}.` : 'Your payment went through. We are connecting it to your workspace.'}</h1>
        <p style={{ color: '#B9C7D9', lineHeight: 1.65, margin: 0 }}>{status}</p>
        {upgraded && <div style={{ background: '#102033', border: '1px solid #29405A', borderRadius: '14px', padding: '14px', color: '#C6D5E9', lineHeight: 1.6 }}>Nothing was reset. Your projects, tasks, company knowledge, Eva history and sales work remain in the same private workspace.</div>}
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <Link href={home} style={{ background: '#9EF0CF', color: '#08130F', borderRadius: '11px', padding: '12px 15px', fontWeight: 950, textDecoration: 'none' }}>{upgraded ? 'Return to My Business OS' : 'Open Account'}</Link>
          <Link href="/customer/account" style={{ border: '1px solid #415171', color: '#E4EAF5', borderRadius: '11px', padding: '11px 14px', fontWeight: 850, textDecoration: 'none' }}>Billing & Account</Link>
        </div>
      </section>
    </main>
  );
}
