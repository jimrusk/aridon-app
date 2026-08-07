'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';

type PlanPrice = { plan: string; currency: string; unitAmount: number | null; interval: string; intervalCount: number; active: boolean };

const planCopy: Record<string, { title: string; description: string; bestFor: string }> = {
  launch: { title: 'Launch', description: 'Private workspace, Eva, projects, tasks and company memory.', bestFor: 'Best for an owner getting started.' },
  growth: { title: 'Growth', description: 'Adds stronger sales, customer follow-up, research and execution tools.', bestFor: 'Best for a business focused on growth.' },
  command: { title: 'Command', description: 'Adds deeper automation, integrations and custom workflows.', bestFor: 'Best for a team that wants more automation.' },
};

function money(plan?: PlanPrice) {
  if (!plan || plan.unitAmount == null) return 'Price shown in checkout';
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
    setForm((current) => ({
      ...current,
      plan: requested && ['launch', 'growth', 'command'].includes(requested) ? requested : 'launch',
      ownerName: params.get('owner') || current.ownerName,
      businessName: params.get('business') || current.businessName,
      email: params.get('email') || current.email,
      industry: params.get('industry') || current.industry,
    }));
    fetch('/api/business-os/plans', { cache: 'no-store' })
      .then(async (response) => ({ response, data: await response.json().catch(() => ({})) }))
      .then(({ response, data }) => { setBillingReady(response.ok && data.configured !== false); setPrices(Array.isArray(data.plans) ? data.plans : []); })
      .catch(() => setBillingReady(false));
  }, []);

  const selectedPrice = useMemo(() => prices.find((price) => price.plan === form.plan), [prices, form.plan]);
  const ready = Boolean(form.ownerName.trim() && form.businessName.trim() && /^\S+@\S+\.\S+$/.test(form.email.trim()) && form.industry.trim());

  async function startCheckout(event: FormEvent) {
    event.preventDefault();
    if (!ready) return;
    setLoading(true); setError('');
    const response = await fetch('/api/business-os/checkout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data.checkoutUrl) { setError(data.error || 'Secure checkout could not be started.'); setLoading(false); return; }
    window.location.assign(data.checkoutUrl);
  }

  return (
    <main style={{ minHeight: '100vh', background: '#F5F2EA', color: '#171717', padding: '30px 18px 80px', fontFamily: 'Arial, sans-serif' }}>
      <div style={{ maxWidth: '980px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}><Link href="/business-os" style={{ color: '#171717', fontWeight: 900, textDecoration: 'none' }}>← Back to overview</Link><Link href="/customer/login" style={{ color: '#171717', fontWeight: 800 }}>Customer login</Link></div>

        <div style={{ marginTop: '36px', color: '#666158', fontSize: '12px', fontWeight: 950 }}>CHOOSE A PLAN</div>
        <h1 style={{ fontSize: 'clamp(40px,7vw,66px)', lineHeight: 1, letterSpacing: '-2px', margin: '10px 0 14px', maxWidth: '780px' }}>Pick the level of help your business needs.</h1>
        <p style={{ color: '#56564F', fontSize: '18px', lineHeight: 1.6, maxWidth: '760px' }}>You will choose a plan here, continue to Stripe for secure payment, then create your customer login. That is it.</p>

        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: '12px', marginTop: '24px' }} className="plan-grid">
          {(['launch', 'growth', 'command'] as const).map((plan) => {
            const selected = form.plan === plan;
            const price = prices.find((item) => item.plan === plan);
            return <button key={plan} type="button" onClick={() => setForm({ ...form, plan })} style={{ textAlign: 'left', background: selected ? '#DDF8ED' : '#fff', border: `2px solid ${selected ? '#2C8B67' : '#D4CEC2'}`, borderRadius: '16px', padding: '18px', cursor: 'pointer' }}><strong style={{ fontSize: '22px' }}>{planCopy[plan].title}</strong><div style={{ marginTop: '5px', fontWeight: 900 }}>{money(price)}{price?.unitAmount != null ? `/${price.interval}` : ''}</div><p style={{ color: '#5D5B54', lineHeight: 1.5, marginBottom: '7px' }}>{planCopy[plan].description}</p><div style={{ color: '#666158', fontSize: '12px', fontWeight: 800 }}>{planCopy[plan].bestFor}</div></button>;
          })}
        </section>

        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 300px', gap: '18px', alignItems: 'start', marginTop: '18px' }} className="checkout-grid">
          <form onSubmit={startCheckout} style={{ background: '#fff', border: '1px solid #D4CEC2', borderRadius: '20px', padding: '22px', display: 'grid', gap: '14px' }}>
            <h2 style={{ margin: 0 }}>Confirm your business details</h2>
            <label style={labelStyle}>Your name<input required value={form.ownerName} onChange={(event) => setForm({ ...form, ownerName: event.target.value })} style={inputStyle} /></label>
            <label style={labelStyle}>Business name<input required value={form.businessName} onChange={(event) => setForm({ ...form, businessName: event.target.value })} style={inputStyle} /></label>
            <label style={labelStyle}>Business email<input required type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} style={inputStyle} /></label>
            <label style={labelStyle}>Industry<input required value={form.industry} onChange={(event) => setForm({ ...form, industry: event.target.value })} style={inputStyle} /></label>
            {error && <div style={{ background: '#FDE8E6', border: '1px solid #EAB4AF', color: '#8D2F26', borderRadius: '10px', padding: '11px 13px' }}>{error}</div>}
            {!billingReady && <div style={{ background: '#FFF3D6', border: '1px solid #E8CD8A', color: '#614D16', borderRadius: '10px', padding: '11px 13px' }}>Paid checkout is not ready on this deployment yet. A no-cost beta invitation can still be used separately.</div>}
            <button disabled={loading || !ready || !billingReady} type="submit" style={{ border: 0, borderRadius: '12px', background: '#171717', color: '#fff', padding: '14px', fontWeight: 950, fontSize: '16px', opacity: ready && billingReady ? 1 : .5, cursor: loading ? 'wait' : 'pointer' }}>{loading ? 'Opening Stripe…' : `Continue with ${planCopy[form.plan].title}`}</button>
            <div style={{ color: '#78736B', fontSize: '12px', lineHeight: 1.5 }}>Payment is handled securely by Stripe. Your workspace is created after Stripe confirms the subscription.</div>
          </form>

          <aside style={{ background: '#171717', color: '#fff', borderRadius: '18px', padding: '20px' }}>
            <div style={{ color: '#9EF0CF', fontWeight: 950, fontSize: '12px' }}>WHAT HAPPENS NEXT</div>
            <ol style={{ paddingLeft: '20px', lineHeight: 1.8, color: '#D8D8D3' }}><li>Finish secure payment in Stripe.</li><li>Create your password.</li><li>Sign in to your company workspace.</li><li>Use Start Here if you want a guided first visit.</li></ol>
            <strong>No hidden setup maze.</strong>
          </aside>
        </div>
      </div>
      <style>{`@media(max-width:820px){.checkout-grid,.plan-grid{grid-template-columns:1fr !important}}`}</style>
    </main>
  );
}

const labelStyle = { display: 'grid', gap: '6px', color: '#33332F', fontSize: '13px', fontWeight: 850 };
const inputStyle = { width: '100%', boxSizing: 'border-box' as const, border: '1px solid #C9C5BA', borderRadius: '10px', padding: '12px 13px', fontSize: '15px', background: '#fff' };
