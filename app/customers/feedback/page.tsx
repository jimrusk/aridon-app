'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

type Feedback = {
  id: string;
  rating: number;
  likes: string;
  problems: string;
  missing: string;
  recommend: string;
  notes: string;
  created_at: string;
  customer_tenants?: { business_name?: string; slug?: string; plan?: string; subscription_status?: string } | null;
};

export default function CustomerFeedbackDashboard() {
  const [items, setItems] = useState<Feedback[]>([]);
  const [message, setMessage] = useState('Loading customer feedback…');

  async function load() {
    setMessage('Loading customer feedback…');
    const response = await fetch('/api/customers/feedback', { cache: 'no-store' });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      setMessage(data.error || 'Unable to load customer feedback.');
      return;
    }
    setItems(Array.isArray(data) ? data : []);
    setMessage('');
  }

  useEffect(() => { load(); }, []);

  const average = items.length ? items.reduce((sum, item) => sum + Number(item.rating || 0), 0) / items.length : 0;

  return (
    <main style={{ minHeight: '100vh', background: '#070A12', color: '#F6F8FC', padding: '32px 18px 120px', fontFamily: 'Arial, sans-serif' }}>
      <div style={{ maxWidth: '1050px', margin: '0 auto' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', gap: '14px', flexWrap: 'wrap', alignItems: 'flex-start' }}>
          <div><div style={{ color: '#9EF0CF', fontSize: '12px', fontWeight: 950, letterSpacing: '1.2px' }}>CUSTOMER LEARNING LOOP</div><h1 style={{ fontSize: 'clamp(38px,7vw,62px)', lineHeight: 1, margin: '10px 0' }}>What test companies are telling us.</h1></div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}><Link href="/customers/beta" style={topLink}>Create Beta Invite</Link><button onClick={load} style={topButton}>Refresh</button></div>
        </header>

        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(210px,1fr))', gap: '12px', margin: '24px 0' }}>
          <div style={metricCard}><strong style={metricValue}>{items.length}</strong><span style={metricLabel}>Feedback submissions</span></div>
          <div style={metricCard}><strong style={metricValue}>{average ? average.toFixed(1) : '—'}</strong><span style={metricLabel}>Average value score / 5</span></div>
          <div style={metricCard}><strong style={metricValue}>{items.filter((item) => item.rating >= 4).length}</strong><span style={metricLabel}>Strong-value responses</span></div>
        </section>

        {message && <div style={{ background: '#182238', border: '1px solid #314363', borderRadius: '12px', padding: '13px', color: '#D6E1F4' }}>{message}</div>}
        {!message && items.length === 0 && <div style={{ color: '#AAB5CA' }}>No feedback has arrived yet.</div>}

        <div style={{ display: 'grid', gap: '14px' }}>
          {items.map((item) => {
            const company = item.customer_tenants?.business_name || 'Customer';
            return (
              <article key={item.id} style={{ background: '#0F1523', border: '1px solid #273551', borderRadius: '16px', padding: '18px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}><div><strong style={{ fontSize: '20px' }}>{company}</strong><div style={{ color: '#8594AF', fontSize: '12px', marginTop: '3px' }}>{new Date(item.created_at).toLocaleString()} · {item.customer_tenants?.subscription_status || item.customer_tenants?.plan || 'customer'}</div></div><div style={{ color: '#9EF0CF', fontSize: '24px', fontWeight: 950 }}>{item.rating}/5</div></div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(250px,1fr))', gap: '12px', marginTop: '14px' }}>
                  <FeedbackBlock title="What worked" value={item.likes} />
                  <FeedbackBlock title="Friction / problems" value={item.problems} />
                  <FeedbackBlock title="Missing capability" value={item.missing} />
                  <FeedbackBlock title="Recommendation" value={item.recommend} />
                </div>
                {item.notes && <div style={{ marginTop: '12px' }}><FeedbackBlock title="Other notes" value={item.notes} /></div>}
              </article>
            );
          })}
        </div>
      </div>
    </main>
  );
}

function FeedbackBlock({ title, value }: { title: string; value: string }) {
  return <div style={{ background: '#0A101C', border: '1px solid #202D47', borderRadius: '12px', padding: '13px' }}><div style={{ color: '#91A2BE', fontSize: '11px', fontWeight: 950, letterSpacing: '.7px', textTransform: 'uppercase' }}>{title}</div><div style={{ color: '#D8E0EF', lineHeight: 1.55, marginTop: '6px', whiteSpace: 'pre-wrap' }}>{value || 'No response'}</div></div>;
}

const topLink = { border: '1px solid #405070', color: '#E7EDF8', borderRadius: '10px', padding: '10px 13px', textDecoration: 'none', fontWeight: 850 };
const topButton = { border: '1px solid #405070', background: '#101827', color: '#E7EDF8', borderRadius: '10px', padding: '10px 13px', fontWeight: 850, cursor: 'pointer' };
const metricCard = { background: '#0F1523', border: '1px solid #273551', borderRadius: '15px', padding: '17px', display: 'grid', gap: '5px' };
const metricValue = { fontSize: '34px', color: '#9EF0CF' };
const metricLabel = { color: '#A6B2C8', fontSize: '13px' };
