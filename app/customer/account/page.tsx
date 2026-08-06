'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getBrowserClient } from '../../../lib/supabase';

type AccountData = {
  email: string;
  role: string;
  tenant: {
    slug: string;
    business_name: string;
    plan: string | null;
    status: string | null;
    subscription_status: string | null;
    stripe_customer_id: string | null;
  };
};

export default function CustomerAccountPage() {
  const router = useRouter();
  const [account, setAccount] = useState<AccountData | null>(null);
  const [token, setToken] = useState('');
  const [message, setMessage] = useState('Loading your account…');
  const [billingLoading, setBillingLoading] = useState(false);

  useEffect(() => {
    const db = getBrowserClient();
    db.auth.getSession().then(async ({ data }) => {
      const accessToken = data.session?.access_token;
      if (!accessToken) {
        router.replace('/customer/login');
        return;
      }
      setToken(accessToken);
      const response = await fetch('/api/customer/me', { headers: { Authorization: `Bearer ${accessToken}` }, cache: 'no-store' });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        setMessage(result.error || 'Unable to load this account.');
        return;
      }
      setAccount(result as AccountData);
      setMessage('');
    });
  }, [router]);

  async function openBilling() {
    if (!token) return;
    setBillingLoading(true);
    const response = await fetch('/api/customer/billing-portal', { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data.url) {
      setMessage(data.error || 'Unable to open billing management.');
      setBillingLoading(false);
      return;
    }
    window.location.assign(data.url);
  }

  async function signOut() {
    await getBrowserClient().auth.signOut();
    router.replace('/customer/login');
  }

  return (
    <main style={{ minHeight: '100vh', background: '#0B1020', color: '#F8FAFC', padding: '30px 18px 90px', fontFamily: 'Arial, sans-serif' }}>
      <div style={{ maxWidth: '880px', margin: '0 auto' }}>
        <div style={{ color: '#9EF0CF', fontSize: '12px', fontWeight: 950, letterSpacing: '1px' }}>PRIVATE BUSINESS OS</div>
        <h1 style={{ fontSize: 'clamp(38px,7vw,58px)', margin: '10px 0 22px' }}>Account & access</h1>
        {message && <div style={{ background: '#182238', border: '1px solid #314363', borderRadius: '12px', padding: '13px', color: '#D6E1F4', marginBottom: '16px' }}>{message}</div>}

        {account && (
          <>
            <section style={{ background: '#111827', border: '1px solid #2A3857', borderRadius: '18px', padding: '20px', display: 'grid', gap: '10px' }}>
              <div><strong>Business:</strong> {account.tenant.business_name}</div>
              <div><strong>Login:</strong> {account.email}</div>
              <div><strong>Role:</strong> {account.role}</div>
              <div><strong>Plan:</strong> {account.tenant.plan || 'not set'}</div>
              <div><strong>Access status:</strong> {account.tenant.subscription_status || account.tenant.status || 'unknown'}</div>
            </section>

            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '16px' }}>
              <Link href={`/workspace/${account.tenant.slug}`} style={primaryLink}>Open workspace</Link>
              <Link href={`/customer/feedback?workspace=${encodeURIComponent(account.tenant.slug)}`} style={secondaryLink}>Send feedback</Link>
              {account.tenant.stripe_customer_id && <button onClick={openBilling} disabled={billingLoading} style={buttonStyle}>{billingLoading ? 'Opening…' : 'Manage billing'}</button>}
              <button onClick={signOut} style={buttonStyle}>Sign out</button>
            </div>
          </>
        )}
      </div>
    </main>
  );
}

const primaryLink = { background: '#9EF0CF', color: '#08130F', borderRadius: '11px', padding: '12px 15px', fontWeight: 950, textDecoration: 'none' };
const secondaryLink = { border: '1px solid #415171', color: '#E4EAF5', borderRadius: '11px', padding: '12px 15px', fontWeight: 850, textDecoration: 'none' };
const buttonStyle = { border: '1px solid #415171', background: '#111827', color: '#E4EAF5', borderRadius: '11px', padding: '12px 15px', fontWeight: 850, cursor: 'pointer' };
