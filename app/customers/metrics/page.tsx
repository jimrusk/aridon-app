'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

type Metrics = {
  generatedAt: string;
  windowDays: number;
  totals: {
    tenants: number;
    paidTenants: number;
    betaTenants: number;
    activatedTenants: number;
    activeEvaTenants30d: number;
    evaQuestions30d: number;
    feedbackResponses30d: number;
    averageFeedbackRating30d: number;
    referrals30d: number;
    betaInvites30d: number;
    betaInvitesClaimed30d: number;
  };
  recentTenants: Array<{ id: string; business_name: string; plan: string | null; status: string | null; subscription_status: string | null; created_at: string; activated_at?: string | null }>;
};

export default function CustomerMetricsPage() {
  const [data, setData] = useState<Metrics | null>(null);
  const [message, setMessage] = useState('Loading product health…');

  async function load() {
    setMessage('Loading product health…');
    const response = await fetch('/api/customers/metrics', { cache: 'no-store' });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      setMessage(result.error || 'Unable to load product metrics.');
      return;
    }
    setData(result as Metrics);
    setMessage('');
  }

  useEffect(() => { load(); }, []);

  return (
    <main style={{ minHeight: '100vh', background: '#070A12', color: '#F6F8FC', padding: '32px 18px 120px', fontFamily: 'Arial, sans-serif' }}>
      <div style={{ maxWidth: '1120px', margin: '0 auto' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', gap: '14px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <div>
            <div style={{ color: '#9EF0CF', fontSize: '12px', fontWeight: 950, letterSpacing: '1.1px' }}>PRIVATE BUSINESS OS · PRODUCT HEALTH</div>
            <h1 style={{ fontSize: 'clamp(40px,7vw,64px)', lineHeight: 1, margin: '10px 0 8px' }}>Measure what an acquirer or serious investor would care about.</h1>
            <p style={{ color: '#AAB5CA', lineHeight: 1.6, maxWidth: '820px' }}>Real customer activation, AI engagement, referrals, feedback quality and beta conversion matter more than vanity traffic. This dashboard keeps those signals visible.</p>
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <Link href="/customers/beta" style={topLink}>Beta Invites</Link>
            <Link href="/customers/feedback" style={topLink}>Feedback</Link>
            <button onClick={load} style={topButton}>Refresh</button>
          </div>
        </header>

        {message && <div style={{ marginTop: '18px', background: '#182238', border: '1px solid #314363', borderRadius: '12px', padding: '13px', color: '#D6E1F4' }}>{message}</div>}

        {data && (
          <>
            <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(190px,1fr))', gap: '12px', marginTop: '22px' }}>
              <Metric value={data.totals.tenants} label="Customer tenants" />
              <Metric value={data.totals.paidTenants} label="Paid / trial tenants" />
              <Metric value={data.totals.betaTenants} label="Beta tenants" />
              <Metric value={data.totals.activeEvaTenants30d} label="Companies using Eva · 30d" />
              <Metric value={data.totals.evaQuestions30d} label="Eva questions · 30d" />
              <Metric value={data.totals.referrals30d} label="Referral signups · 30d" />
              <Metric value={data.totals.feedbackResponses30d} label="Feedback responses · 30d" />
              <Metric value={data.totals.averageFeedbackRating30d || '—'} label="Avg feedback / 5 · 30d" />
            </section>

            <section style={{ marginTop: '20px', background: '#0F1523', border: '1px solid #273551', borderRadius: '18px', padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'baseline', flexWrap: 'wrap' }}><h2 style={{ margin: 0 }}>Activation funnel</h2><span style={{ color: '#8493AC', fontSize: '12px' }}>Last {data.windowDays} days for engagement metrics</span></div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: '10px', marginTop: '14px' }}>
                <Funnel label="All tenants" value={data.totals.tenants} />
                <Funnel label="Activated tenants" value={data.totals.activatedTenants} />
                <Funnel label="Beta invites created · 30d" value={data.totals.betaInvites30d} />
                <Funnel label="Beta invites claimed · 30d" value={data.totals.betaInvitesClaimed30d} />
              </div>
            </section>

            <section style={{ marginTop: '20px', background: '#0F1523', border: '1px solid #273551', borderRadius: '18px', padding: '20px' }}>
              <h2 style={{ marginTop: 0 }}>Recent customer tenants</h2>
              {data.recentTenants.length === 0 ? <p style={{ color: '#AAB5CA' }}>No customer tenants yet.</p> : <div style={{ display: 'grid', gap: '8px' }}>{data.recentTenants.map((tenant) => <div key={tenant.id} style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) auto auto', gap: '12px', alignItems: 'center', borderTop: '1px solid #202D47', padding: '10px 0' }} className="tenant-row"><div><strong>{tenant.business_name}</strong><div style={{ color: '#8493AC', fontSize: '12px', marginTop: '3px' }}>{new Date(tenant.created_at).toLocaleDateString()}</div></div><span style={{ color: '#B9C6D9' }}>{tenant.plan || '—'}</span><span style={{ color: '#9EF0CF', fontWeight: 850 }}>{tenant.subscription_status || tenant.status || 'unknown'}</span></div>)}</div>}
            </section>

            <section style={{ marginTop: '20px', border: '1px solid #334464', background: '#0A111F', borderRadius: '18px', padding: '20px' }}>
              <strong style={{ color: '#9EF0CF', fontSize: '18px' }}>The acquisition story should be earned by the numbers.</strong>
              <p style={{ color: '#B6C1D3', lineHeight: 1.65, marginBottom: 0 }}>The strongest future story is recurring revenue, growing active companies, high Eva engagement, referrals that lower customer-acquisition cost, strong feedback scores, low churn, and a secure multi-tenant architecture. This dashboard is the scoreboard, not the trophy case.</p>
            </section>
          </>
        )}
      </div>
      <style>{`@media(max-width:620px){.tenant-row{grid-template-columns:1fr !important}}`}</style>
    </main>
  );
}

function Metric({ value, label }: { value: string | number; label: string }) {
  return <div style={{ background: '#0F1523', border: '1px solid #273551', borderRadius: '15px', padding: '17px' }}><div style={{ color: '#9EF0CF', fontSize: '34px', fontWeight: 950 }}>{value}</div><div style={{ color: '#A5B1C6', lineHeight: 1.4, marginTop: '4px', fontSize: '13px' }}>{label}</div></div>;
}

function Funnel({ label, value }: { label: string; value: number }) {
  return <div style={{ background: '#0A101C', border: '1px solid #202D47', borderRadius: '12px', padding: '14px' }}><strong style={{ fontSize: '24px', color: '#DDE6F5' }}>{value}</strong><div style={{ color: '#8C9AB2', marginTop: '4px', fontSize: '13px' }}>{label}</div></div>;
}

const topLink = { border: '1px solid #405070', color: '#E7EDF8', borderRadius: '10px', padding: '10px 13px', textDecoration: 'none', fontWeight: 850 };
const topButton = { border: '1px solid #405070', background: '#101827', color: '#E7EDF8', borderRadius: '10px', padding: '10px 13px', fontWeight: 850, cursor: 'pointer' };
