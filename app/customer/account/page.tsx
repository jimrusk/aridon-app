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
  const [websiteLoading, setWebsiteLoading] = useState(false);

  useEffect(() => {
    const db = getBrowserClient();
    db.auth.getSession().then(async ({ data }) => {
      const accessToken = data.session?.access_token;
      if (!accessToken) { router.replace('/customer/login'); return; }
      setToken(accessToken);
      const response = await fetch('/api/customer/me', { headers: { Authorization: `Bearer ${accessToken}` }, cache: 'no-store' });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) { setMessage(result.error || 'Unable to load this account.'); return; }
      setAccount(result as AccountData); setMessage('');
    });
  }, [router]);

  async function openBilling() {
    if (!token) return;
    setBillingLoading(true);
    const response = await fetch('/api/customer/billing-portal', { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data.url) { setMessage(data.error || 'Unable to open billing management.'); setBillingLoading(false); return; }
    window.location.assign(data.url);
  }

  async function refreshWebsiteKnowledge() {
    if (!token) return;
    setWebsiteLoading(true);
    setMessage('');
    const response = await fetch('/api/customer/website-ingestion', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      setMessage(data.error || 'Unable to refresh website knowledge.');
      setWebsiteLoading(false);
      return;
    }
    setMessage(`Website knowledge refreshed from ${data.pages || 0} public page${data.pages === 1 ? '' : 's'}. Eva can use the updated context immediately. Open Find Customers and update Scout's sales profile when you want Scout to relearn the site too.`);
    setWebsiteLoading(false);
  }

  async function signOut() { await getBrowserClient().auth.signOut(); router.replace('/customer/login'); }

  const isBeta = account?.tenant.plan === 'beta';

  return (
    <main style={{ minHeight: '100vh', background: '#0B1020', color: '#F8FAFC', padding: '30px 18px 90px', fontFamily: 'Arial, sans-serif' }}>
      <div style={{ maxWidth: '880px', margin: '0 auto' }}>
        {account && <nav style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '28px' }}><Link href={`/workspace/${account.tenant.slug}`} style={navLink}>Home</Link><Link href="/customer/start" style={navLink}>Start Here</Link><Link href="/customer/assistant" style={navLink}>Ask Eva</Link><Link href="/customer/sales" style={navLink}>Find Customers</Link>{isBeta && <Link href="/customer/upgrade" style={{ ...navLink, background: '#F4D88B', color: '#241C08', borderColor: '#F4D88B' }}>Keep My Business OS</Link>}</nav>}
        <div style={{ color: '#9EF0CF', fontSize: '12px', fontWeight: 950 }}>ACCOUNT</div>
        <h1 style={{ fontSize: 'clamp(38px,7vw,58px)', margin: '10px 0 8px' }}>Your company account</h1>
        <p style={{ color: '#AEBAD0', lineHeight: 1.6, marginBottom: '22px' }}>Use this page for login details, company knowledge, plan information, billing and sign-out.</p>
        {message && <div style={{ background: '#182238', border: '1px solid #314363', borderRadius: '12px', padding: '13px', color: '#D6E1F4', marginBottom: '16px' }}>{message}</div>}

        {account && <>
          <section style={{ background: '#111827', border: '1px solid #2A3857', borderRadius: '18px', padding: '20px', display: 'grid', gap: '12px' }}>
            <Info label="Business" value={account.tenant.business_name} />
            <Info label="Email used to sign in" value={account.email} />
            <Info label="Your access" value={account.role || 'member'} />
            <Info label="Plan" value={account.tenant.plan || 'not set'} />
            <Info label="Account status" value={account.tenant.subscription_status || account.tenant.status || 'unknown'} />
          </section>

          {isBeta && <section style={{ marginTop: '16px', background: '#2B2514', border: '1px solid #665827', borderRadius: '16px', padding: '18px' }}>
            <div style={{ color: '#F4D88B', fontSize: '12px', fontWeight: 950 }}>FREE BETA</div>
            <h2 style={{ margin: '7px 0' }}>Want to keep this same workspace after the beta?</h2>
            <p style={{ color: '#DED3B3', lineHeight: 1.55, margin: '0 0 12px' }}>Choose a paid plan without rebuilding your account. Your current projects, tasks, company knowledge, Eva history and sales work stay in place.</p>
            <Link href="/customer/upgrade" style={{ display: 'inline-block', background: '#F4D88B', color: '#241C08', borderRadius: '11px', padding: '11px 14px', fontWeight: 950, textDecoration: 'none' }}>See Paid Plans</Link>
          </section>}

          <section style={{ marginTop: '16px', background: '#111827', border: '1px solid #2A3857', borderRadius: '16px', padding: '18px' }}>
            <div style={{ color: '#9EF0CF', fontSize: '12px', fontWeight: 950 }}>WEBSITE INTELLIGENCE</div>
            <h2 style={{ margin: '7px 0' }}>Let the Business OS relearn your public website.</h2>
            <p style={{ color: '#B9C7D9', lineHeight: 1.55, margin: '0 0 12px' }}>If you supplied a company website during beta signup, the system can rescan up to three high-signal public pages and refresh the website context used by Eva. Scout performs its own sales-focused learning when you update its profile in Find Customers. Private pages and logged-in content are not accessed.</p>
            <button onClick={refreshWebsiteKnowledge} disabled={websiteLoading} style={buttonStyle}>{websiteLoading ? 'Refreshing website…' : 'Refresh website knowledge'}</button>
          </section>

          <section style={{ marginTop: '16px', background: '#102033', border: '1px solid #29405A', borderRadius: '16px', padding: '18px' }}>
            <h2 style={{ margin: '0 0 7px' }}>Need help using the system?</h2>
            <p style={{ color: '#B9C7D9', lineHeight: 1.55, margin: '0 0 12px' }}>Open Start Here for a simple walkthrough, or ask Eva what you are trying to accomplish.</p>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}><Link href="/customer/start" style={primaryLink}>Start Here</Link><Link href="/customer/assistant" style={secondaryLink}>Ask Eva</Link></div>
          </section>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '16px' }}>
            {account.tenant.stripe_customer_id && <button onClick={openBilling} disabled={billingLoading} style={buttonStyle}>{billingLoading ? 'Opening billing…' : 'Manage billing'}</button>}
            {isBeta && <Link href="/customer/upgrade" style={primaryLink}>Upgrade</Link>}
            <Link href={`/customer/feedback?workspace=${encodeURIComponent(account.tenant.slug)}`} style={secondaryLink}>Send feedback</Link>
            <Link href="/customer/referrals" style={secondaryLink}>Refer a business</Link>
            <button onClick={signOut} style={buttonStyle}>Sign out</button>
          </div>
        </>}
      </div>
    </main>
  );
}

function Info({ label, value }: { label: string; value: string }) { return <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr', gap: '12px', borderTop: '1px solid #273650', paddingTop: '10px' }}><strong style={{ color: '#9EF0CF' }}>{label}</strong><span>{value}</span></div>; }

const navLink = { border: '1px solid #415171', color: '#E4EAF5', borderRadius: '10px', padding: '9px 12px', fontWeight: 850, textDecoration: 'none', fontSize: '13px' };
const primaryLink = { display: 'inline-block', background: '#9EF0CF', color: '#08130F', borderRadius: '11px', padding: '11px 14px', fontWeight: 950, textDecoration: 'none' };
const secondaryLink = { border: '1px solid #415171', color: '#E4EAF5', borderRadius: '11px', padding: '10px 13px', fontWeight: 850, textDecoration: 'none' };
const buttonStyle = { border: '1px solid #415171', background: '#111827', color: '#E4EAF5', borderRadius: '11px', padding: '11px 14px', fontWeight: 850, cursor: 'pointer' };
