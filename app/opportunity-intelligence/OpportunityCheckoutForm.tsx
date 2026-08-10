'use client';

import { FormEvent, useState } from 'react';
import { opportunityPlans, type OpportunityPlan } from '../../lib/opportunityIntelligence';

export default function OpportunityCheckoutForm({ initialPlan = 'pursuit' }: { initialPlan?: OpportunityPlan }) {
  const [plan, setPlan] = useState<OpportunityPlan>(initialPlan);
  const [ownerName, setOwnerName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [email, setEmail] = useState('');
  const [industry, setIndustry] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  async function submit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setMessage('');
    try {
      const response = await fetch('/api/opportunity-intelligence/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan, ownerName, businessName, email, industry }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.checkoutUrl) throw new Error(data.error || 'Secure checkout could not be opened.');
      window.location.assign(data.checkoutUrl);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Secure checkout could not be opened.');
      setLoading(false);
    }
  }

  const selected = opportunityPlans[plan];

  return (
    <form onSubmit={submit} style={{ background: '#101927', border: '1px solid #2B3C58', borderRadius: 22, padding: 22, display: 'grid', gap: 12, boxShadow: '0 24px 60px rgba(0,0,0,.2)' }}>
      <div style={{ color: '#9EF0CF', fontSize: 12, fontWeight: 950, letterSpacing: 1 }}>START A PAID WORKSPACE</div>
      <h2 style={{ fontSize: 31, margin: 0 }}>{selected.name} · {selected.price}</h2>
      <p style={{ color: '#B8C4D6', lineHeight: 1.55, margin: 0 }}>Enter the company details once. After Stripe checkout, create the private login that owns the opportunity workspace.</p>

      <label style={labelStyle}>Plan
        <select value={plan} onChange={(event) => setPlan(event.target.value as OpportunityPlan)} style={inputStyle}>
          <option value="scout">Scout · $149/month</option>
          <option value="pursuit">Pursuit · $399/month</option>
          <option value="command">Command · $999/month</option>
        </select>
      </label>
      <label style={labelStyle}>Your name
        <input value={ownerName} onChange={(event) => setOwnerName(event.target.value)} placeholder="Owner or team lead" style={inputStyle} required />
      </label>
      <label style={labelStyle}>Company
        <input value={businessName} onChange={(event) => setBusinessName(event.target.value)} placeholder="Company name" style={inputStyle} required />
      </label>
      <label style={labelStyle}>Work email
        <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@company.com" style={inputStyle} required />
      </label>
      <label style={labelStyle}>Industry
        <input value={industry} onChange={(event) => setIndustry(event.target.value)} placeholder="Construction, water, software, manufacturing…" style={inputStyle} required />
      </label>

      {message && <div style={{ background: '#2B171A', border: '1px solid #6A343B', color: '#F2B9B3', borderRadius: 10, padding: 11 }}>{message}</div>}
      <button disabled={loading} style={{ border: 0, borderRadius: 12, background: '#9EF0CF', color: '#07130F', padding: '14px 16px', fontWeight: 950, fontSize: 15, cursor: loading ? 'wait' : 'pointer' }}>
        {loading ? 'Opening secure checkout…' : `Start ${selected.name}`}
      </button>
      <div style={{ color: '#8796AC', fontSize: 12, lineHeight: 1.5 }}>Recurring billing is handled by Stripe. Research and drafting can move quickly, but external sends, spending and commitments remain under human control.</div>
    </form>
  );
}

const labelStyle = { display: 'grid', gap: 6, color: '#DDE6F2', fontSize: 13, fontWeight: 800 };
const inputStyle = { width: '100%', boxSizing: 'border-box' as const, border: '1px solid #374A68', borderRadius: 10, background: '#09111F', color: '#F8FAFC', padding: '11px 12px', fontSize: 14 };
