'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';

type PlanPrice = {
  plan: string;
  currency: string;
  unitAmount: number | null;
  interval: string;
  intervalCount: number;
  active: boolean;
};

const planCopy: Record<string, { title: string; description: string }> = {
  launch: { title: 'Launch', description: 'Private workspace, AI executive team, projects, tasks and company memory.' },
  growth: { title: 'Growth', description: 'Adds CRM, competitive intelligence, morning intelligence and execution playbooks.' },
  command: { title: 'Command', description: 'Adds deeper workflows, custom executive roles, integrations and priority build support.' },
};

function money(plan?: PlanPrice) {
  if (!plan || plan.unitAmount == null) return 'Price shown in secure checkout';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: plan.currency.toUpperCase() }).format(plan.unitAmount / 100);
}

export default function BusinessOSCheckoutPage() {
  const [prices, setPrices] = useState<PlanPrice[]>([]);
  const [billingReady, setBillingReady] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ ownerName: '', businessName: '', email: '', industry: '', plan: 'launch' });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const requested = params.get('plan');
    const initialPlan = requested && ['launch', 'growth', 'command'].includes(requested) ? requested : 'launch';
    setForm((current) => ({
      ...current,
      plan: initialPlan,
      ownerName: params.get('owner') || current.ownerName,
      businessName: params.get('business') || current.businessName,
      email: params.get('email') || current.email,
      industry: params.get('industry') || current.industry,
    }));

    fetch('/api/business-os/plans', { cache: 'no-store' })
      .then(async (response) => ({ response, data: await response.json().catch(() => ({})) }))
      .then(({ response, data }) => {
        setBillingReady(response.ok && data.configured !== false);
        setPrices(Array.isArray(data.plans) ? data.plans : []);
      })
      .catch(() => setBillingReady(false));
  }, []);

  const selectedPrice = useMemo(() => prices.find((price) => price.plan === form.plan), [prices, form.plan]);
  const ready = Boolean(form.ownerName.trim() && form.businessName.trim() && /^\S+@\S+\.\S+$/.test(form.email.trim()) && form.industry.trim());

  async function startCheckout(event: FormEvent) {
    event.preventDefault();
    if (!ready) return;
    setLoading(true);
    setError('');

    const response = await fetch('/api/business-os/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data.checkoutUrl) {
      setError(data.error || 'Secure checkout could not be started.');
      setLoading(false);
      return;
    }
    window.location.assign(data.checkoutUrl);
  }

  return (
    <main style={{ minHeight: '100vh', background: '#F5F2EA', color: '#171717', padding: '30px 18px 80px', fontFamily: 'Arial, sans-serif' }}>
      <div style={{ maxWidth: '980px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ fontSize: '13px', fontWeight: 950, letterSpacing: '1px' }}>PRIVATE BUSINESS OS</div>
          <Link href="/business-os" style={{ color: '#171717', fontWeight: 800 }}>Back to overview</Link>
        </div>

        <h1 style={{ fontSize: 'clamp(40px,7vw,68px)', lineHeight: .98, letterSpacing: '-2px', margin: '38px 0 14px', maxWidth: '780px' }}>Activate your private company operating system.</h1>
        <p style={{ color: '#56564F', fontSize: '18px', lineHeight: 1.6, maxWidth: '760px' }}>Choose a package, complete secure billing, then create your customer login. A dedicated tenant is provisioned automatically after successful checkout.</p>

        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.1fr) minmax(300px,.9fr)', gap: '18px', alignItems: 'start', marginTop: '28px' }} className="checkout-grid">
          <form onSubmit={startCheckout} style={{ background: '#fff', border: '1px solid #D4CEC2', borderRadius: '20px', padding: '22px', display: 'grid', gap: '14px' }}>
            <label style={labelStyle}>Your name<input required value={form.ownerName} onChange={(event) => setForm({ ...form, ownerName: event.target.value })} style={inputStyle} /></label>
            <label style={labelStyle}>Business name<input required value={form.businessName} onChange={(event) => setForm({ ...form, businessName: event.target.value })} style={inputStyle} /></label>
            <label style={labelStyle}>Business email<input required type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} style={inputStyle} /></label>
            <label style={labelStyle}>Industry<input required value={form.industry} onChange={(event) => setForm({ ...form, industry: event.target.value })} style={inputStyle} /></label>

            {error && <div style={{ background: '#FDE8E6', border: '1px solid #EAB4AF', color: '#8D2F26', borderRadius: '10px', padding: '11px 13px' }}>{error}</div>}
            {!billingReady && <div style={{ background: '#FFF3D6', border: '1px solid #E8CD8A', color: '#614D16', borderRadius: '10px', padding: '11px 13px' }}>Paid checkout is not configured on this deployment yet. The no-cost beta invitation path remains separate.</div>}

            <button disabled={loading || !ready || !billingReady} type="submit" style={{ border: 0, borderRadius: '12px', background: '#171717', color: '#fff', padding: '14px', fontWeight: 950, fontSize: '16px', opacity: ready && billingReady ? 1 : .5, cursor: loading ? 'wait' : 'pointer' }}>{loading ? 'Opening secure checkout…' : 'Continue to Secure Checkout'}</button>
            <div style={{ color: '#78736B', fontSize: '12px', lineHeight: 1.5 }}>Billing is handled by Stripe. The customer workspace is created only after Stripe reports a completed subscription checkout.</div>
          </form>

          <aside style={{ display: 'grid', gap: '11px' }}>
            {(['launch', 'growth', 'command'] as const).map((plan) => {
              const selected = form.plan === plan;
              const price = prices.find((item) => item.plan === plan);
              return (
                <button key={plan} type="button" onClick={() => setForm({ ...form, plan })} style={{ textAlign: 'left', background: selected ? '#DDF8ED' : '#fff', border: `2px solid ${selected ? '#2C8B67' : '#D4CEC2'}`, borderRadius: '16px', padding: '18px', cursor: 'pointer' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'baseline' }}><strong style={{ fontSize: '22px' }}>{planCopy[plan].title}</strong><strong>{money(price)}{price?.unitAmount != null ? `/${price.interval}` : ''}</strong></div>
                  <p style={{ color: '#5D5B54', lineHeight: 1.5, marginBottom: 0 }}>{planCopy[plan].description}</p>
                </button>
              );
            })}
          </aside>
        </div>
      </div>
      <style>{`@media(max-width:820px){.checkout-grid{grid-template-columns:1fr !important}}`}</style>
    </main>
  );
}

const labelStyle = { display: 'grid', gap: '6px', color: '#33332F', fontSize: '13px', fontWeight: 850 };
const inputStyle = { width: '100%', boxSizing: 'border-box' as const, border: '1px solid #C9C5BA', borderRadius: '10px', padding: '12px 13px', fontSize: '15px', background: '#fff' };
