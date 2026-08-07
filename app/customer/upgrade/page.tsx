'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getBrowserClient } from '../../../lib/supabase';
import { directCheckout, directCheckoutUrl } from '../../../lib/directCheckout';

type PlanPrice = {
  plan: string;
  currency: string;
  unitAmount: number | null;
  interval: string;
  intervalCount: number;
  active: boolean;
};

type Account = {
  email: string;
  tenant: {
    slug: string;
    business_name: string;
    plan: string | null;
    subscription_status: string | null;
  };
};

const planCopy = {
  launch: {
    name: 'Launch',
    line: 'The simple operating home for an owner who wants Eva, company memory, projects and tasks in one place.',
    bullets: ['Private company workspace', 'Eva AI business partner', 'Projects and tasks', 'Company knowledge'],
  },
  growth: {
    name: 'Growth',
    line: 'The best fit for most businesses that want the operating system plus stronger sales and research tools.',
    bullets: ['Everything in Launch', 'Scout sales tools', 'Customer follow-up workflows', 'Competitor research'],
  },
  command: {
    name: 'Command',
    line: 'For teams that want deeper automation, integrations and custom workflows around how they already operate.',
    bullets: ['Everything in Growth', 'Custom AI roles', 'Workflow integrations', 'Priority build support'],
  },
} as const;

function money(plan?: PlanPrice, fallback?: string) {
  if (!plan || plan.unitAmount == null) return fallback || 'Price shown in checkout';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: plan.currency.toUpperCase(),
    maximumFractionDigits: plan.unitAmount % 100 === 0 ? 0 : 2,
  }).format(plan.unitAmount / 100);
}

export default function CustomerUpgradePage() {
  const router = useRouter();
  const [account, setAccount] = useState<Account | null>(null);
  const [token, setToken] = useState('');
  const [prices, setPrices] = useState<PlanPrice[]>([]);
  const [billingReady, setBillingReady] = useState(true);
  const [selected, setSelected] = useState<'launch' | 'growth' | 'command'>('growth');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('Loading your upgrade options…');

  useEffect(() => {
    const db = getBrowserClient();
    db.auth.getSession().then(async ({ data }) => {
      const accessToken = data.session?.access_token;
      if (!accessToken) {
        router.replace('/customer/login?next=/customer/upgrade');
        return;
      }
      setToken(accessToken);
      const [accountResponse, plansResponse] = await Promise.all([
        fetch('/api/customer/me', { headers: { Authorization: `Bearer ${accessToken}` }, cache: 'no-store' }),
        fetch('/api/business-os/plans', { cache: 'no-store' }),
      ]);
      const accountData = await accountResponse.json().catch(() => ({}));
      const plansData = await plansResponse.json().catch(() => ({}));
      if (!accountResponse.ok) {
        setMessage(accountData.error || 'Unable to load your account.');
        return;
      }
      setAccount(accountData as Account);
      setBillingReady(plansResponse.ok && plansData.configured !== false);
      setPrices(Array.isArray(plansData.plans) ? plansData.plans : []);
      setMessage('');
    });
  }, [router]);

  const selectedPrice = useMemo(() => prices.find((item) => item.plan === selected), [prices, selected]);
  const alreadyPaid = account && account.tenant.plan && account.tenant.plan !== 'beta';

  async function startUpgrade() {
    if (!account || alreadyPaid) return;

    if (!billingReady) {
      window.location.assign(directCheckoutUrl(selected, account.email));
      return;
    }

    if (!token) return;
    setLoading(true);
    setMessage('');
    const response = await fetch('/api/customer/upgrade', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan: selected }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data.checkoutUrl) {
      setMessage(data.error || 'Secure checkout could not be started. Opening the direct Stripe checkout instead.');
      setLoading(false);
      window.location.assign(directCheckoutUrl(selected, account.email));
      return;
    }
    window.location.assign(data.checkoutUrl);
  }

  if (!account) {
    return <main style={loadingStyle}>{message || 'Opening your plans…'}</main>;
  }

  const home = `/workspace/${account.tenant.slug}`;

  if (alreadyPaid) {
    return (
      <main style={pageStyle}>
        <section style={cardStyle}>
          <div style={eyebrow}>YOU ARE ALREADY ON A PAID PLAN</div>
          <h1 style={{ margin: '8px 0', fontSize: 'clamp(38px,7vw,58px)', lineHeight: 1 }}>Your Business OS is on {account.tenant.plan}.</h1>
          <p style={bodyStyle}>Use Account to manage billing, or head back to your company home.</p>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}><Link href={home} style={primaryLink}>Go Home</Link><Link href="/customer/account" style={secondaryLink}>Open Account</Link></div>
        </section>
      </main>
    );
  }

  return (
    <main style={pageStyle}>
      <div style={{ maxWidth: '1050px', margin: '0 auto' }}>
        <nav style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '26px' }}><Link href={home} style={secondaryLink}>Home</Link><Link href="/customer/account" style={secondaryLink}>Account</Link></nav>
        <div style={eyebrow}>KEEP YOUR BUSINESS OS</div>
        <h1 style={{ fontSize: 'clamp(42px,8vw,70px)', lineHeight: .98, margin: '10px 0 14px', letterSpacing: '-2px', maxWidth: '900px' }}>If it is earning its place, keep it working for your business.</h1>
        <p style={{ ...bodyStyle, fontSize: '18px', maxWidth: '790px' }}>Your beta workspace stays available. When the full billing connection is active, upgrading changes the plan on this same company account so your projects, tasks, knowledge, Eva history and sales work do not need to be rebuilt.</p>

        <section className="plan-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: '12px', marginTop: '26px' }}>
          {(Object.keys(planCopy) as Array<keyof typeof planCopy>).map((key) => {
            const copy = planCopy[key];
            const price = prices.find((item) => item.plan === key);
            const active = selected === key;
            return (
              <button key={key} type="button" onClick={() => setSelected(key)} style={{ textAlign: 'left', background: active ? '#DDF8ED' : '#111827', color: active ? '#102019' : '#F8FAFC', border: `2px solid ${active ? '#61D8AC' : '#2A3857'}`, borderRadius: '18px', padding: '20px', cursor: 'pointer' }}>
                {key === 'growth' && <div style={{ fontSize: '11px', fontWeight: 950, color: active ? '#1D6C50' : '#9EF0CF', marginBottom: '8px' }}>RECOMMENDED</div>}
                <div style={{ fontSize: '25px', fontWeight: 950 }}>{copy.name}</div>
                <div style={{ fontSize: '22px', fontWeight: 950, margin: '8px 0' }}>{money(price, directCheckout[key].price)}{price?.unitAmount != null ? `/${price.interval}` : ''}</div>
                <p style={{ lineHeight: 1.55, color: active ? '#35483F' : '#B8C4D6', minHeight: '96px' }}>{copy.line}</p>
                <ul style={{ paddingLeft: '20px', lineHeight: 1.8, marginBottom: 0 }}>{copy.bullets.map((item) => <li key={item}>{item}</li>)}</ul>
              </button>
            );
          })}
        </section>

        <section style={{ marginTop: '16px', background: '#111827', border: '1px solid #2A3857', borderRadius: '18px', padding: '20px', display: 'grid', gap: '12px' }}>
          <div><strong style={{ fontSize: '20px' }}>Selected: {planCopy[selected].name} at {selectedPrice?.unitAmount != null ? `${money(selectedPrice)}/${selectedPrice.interval}` : directCheckout[selected].price}</strong></div>
          <div style={{ color: '#B9C7D9', lineHeight: 1.6 }}>Checkout is hosted by Stripe. You review the recurring price and payment details there before the subscription begins.</div>
          {!billingReady && <div style={{ background: '#213A2F', border: '1px solid #3E755E', color: '#C9F4DF', borderRadius: '10px', padding: '12px' }}>Direct Stripe checkout is available now. Your current workspace remains available after purchase. Automatic plan syncing may lag until the server-side Stripe connection is completed, but the Stripe subscription itself begins when checkout succeeds.</div>}
          {message && <div style={{ background: '#2A1718', border: '1px solid #663238', color: '#F2B6AD', borderRadius: '10px', padding: '12px' }}>{message}</div>}
          <button onClick={startUpgrade} disabled={loading} style={{ border: 0, borderRadius: '12px', padding: '15px', background: '#9EF0CF', color: '#08130F', fontWeight: 950, fontSize: '16px', cursor: loading ? 'wait' : 'pointer' }}>{loading ? 'Opening secure checkout…' : `Subscribe to ${planCopy[selected].name}`}</button>
          <div style={{ color: '#8190A9', fontSize: '12px', lineHeight: 1.55 }}>Selecting a plan here does not charge you. Stripe is the final checkout and review step. Use the same business email at checkout so payment and workspace records can be reconciled cleanly.</div>
        </section>
      </div>
      <style>{`@media(max-width:820px){.plan-grid{grid-template-columns:1fr !important}}`}</style>
    </main>
  );
}

const pageStyle = { minHeight: '100vh', background: '#0B1020', color: '#F8FAFC', padding: '28px 18px 90px', fontFamily: 'Arial, sans-serif' };
const loadingStyle = { minHeight: '100vh', background: '#0B1020', color: '#F8FAFC', display: 'grid', placeItems: 'center', padding: '24px', fontFamily: 'Arial, sans-serif' };
const cardStyle = { maxWidth: '720px', margin: '0 auto', background: '#111827', border: '1px solid #2A3857', borderRadius: '20px', padding: '24px', display: 'grid', gap: '14px' };
const eyebrow = { color: '#9EF0CF', fontSize: '12px', fontWeight: 950, letterSpacing: '1px' };
const bodyStyle = { color: '#B9C7D9', lineHeight: 1.65 };
const primaryLink = { display: 'inline-block', background: '#9EF0CF', color: '#08130F', borderRadius: '11px', padding: '11px 14px', fontWeight: 950, textDecoration: 'none' };
const secondaryLink = { border: '1px solid #415171', color: '#E4EAF5', borderRadius: '11px', padding: '10px 13px', fontWeight: 850, textDecoration: 'none' };
