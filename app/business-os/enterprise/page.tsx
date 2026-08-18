'use client';

import { FormEvent, useState } from 'react';

type Opportunity = {
  id: string;
  lane: string;
  title: string;
  finding: string;
  annualValue: number;
  confidence: number;
  recommendedAgent: string;
  workflow: string;
  approvalRequired: boolean;
};

type Scan = {
  companyName: string;
  opportunityScore: number;
  annualOpportunity: number;
  opportunities: Opportunity[];
  executiveBrief: string[];
  proofBaseline: Record<string, number>;
};

const money = (value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value || 0);

export default function EnterprisePage() {
  const [form, setForm] = useState({
    companyName: '', industry: '', annualRevenue: '', employees: '', annualPayroll: '', monthlyLeads: '',
    leadConversionRate: '', averageDealValue: '', openReceivables: '', overdueReceivables: '',
    adminHoursPerWeek: '', hourlyLoadedCost: '', churnRate: '', notes: '',
  });
  const [scan, setScan] = useState<Scan | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const update = (key: string, value: string) => setForm(prev => ({ ...prev, [key]: value }));

  async function submit(event: FormEvent) {
    event.preventDefault();
    setLoading(true); setError(''); setScan(null);
    try {
      const payload = Object.fromEntries(Object.entries(form).map(([key, value]) => {
        if (['companyName', 'industry', 'notes'].includes(key)) return [key, value];
        return [key, value === '' ? 0 : Number(value)];
      }));
      const response = await fetch('/api/enterprise/scan', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || 'Scan failed');
      setScan(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Scan failed');
    } finally { setLoading(false); }
  }

  return (
    <main style={{ minHeight: '100vh', background: '#07101D', color: '#F8FAFC', fontFamily: 'Arial, sans-serif' }}>
      <section style={{ maxWidth: 1180, margin: '0 auto', padding: '56px 20px 34px' }}>
        <div style={{ fontSize: 12, fontWeight: 900, letterSpacing: 1.4, color: '#9EF0CF' }}>ARIDON ENTERPRISE · PROOF MODE</div>
        <h1 style={{ fontSize: 'clamp(44px,7vw,78px)', lineHeight: .96, letterSpacing: -2.5, margin: '14px 0 18px', maxWidth: 950 }}>Find the money your company is leaving on the table.</h1>
        <p style={{ color: '#B9C4D4', fontSize: 19, lineHeight: 1.65, maxWidth: 850 }}>Aridon establishes a business baseline, quantifies revenue, cash and productivity opportunities, assigns an executive agent, proposes the workflow, and tracks what is actually recovered in the ROI Ledger.</p>
      </section>

      <section style={{ maxWidth: 1180, margin: '0 auto', padding: '0 20px 64px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(320px,.85fr)', gap: 18, alignItems: 'start' }}>
          <form onSubmit={submit} style={{ background: '#0D1728', border: '1px solid #263754', borderRadius: 22, padding: 22 }}>
            <h2 style={{ marginTop: 0, fontSize: 28 }}>Enterprise Scanner</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 12 }}>
              <Field label="Company name" value={form.companyName} onChange={v => update('companyName', v)} required />
              <Field label="Industry" value={form.industry} onChange={v => update('industry', v)} />
              <Field label="Annual revenue" type="number" value={form.annualRevenue} onChange={v => update('annualRevenue', v)} required />
              <Field label="Employees" type="number" value={form.employees} onChange={v => update('employees', v)} required />
              <Field label="Annual payroll" type="number" value={form.annualPayroll} onChange={v => update('annualPayroll', v)} />
              <Field label="Monthly leads" type="number" value={form.monthlyLeads} onChange={v => update('monthlyLeads', v)} />
              <Field label="Lead conversion %" type="number" value={form.leadConversionRate} onChange={v => update('leadConversionRate', v)} />
              <Field label="Average deal value" type="number" value={form.averageDealValue} onChange={v => update('averageDealValue', v)} />
              <Field label="Open receivables" type="number" value={form.openReceivables} onChange={v => update('openReceivables', v)} />
              <Field label="Overdue receivables" type="number" value={form.overdueReceivables} onChange={v => update('overdueReceivables', v)} />
              <Field label="Admin hours / week" type="number" value={form.adminHoursPerWeek} onChange={v => update('adminHoursPerWeek', v)} />
              <Field label="Loaded hourly cost" type="number" value={form.hourlyLoadedCost} onChange={v => update('hourlyLoadedCost', v)} />
              <Field label="Annual churn %" type="number" value={form.churnRate} onChange={v => update('churnRate', v)} />
            </div>
            <label style={{ display: 'grid', gap: 7, marginTop: 12, fontSize: 13, color: '#C9D4E4' }}>
              Notes / known bottlenecks
              <textarea value={form.notes} onChange={e => update('notes', e.target.value)} rows={4} style={inputStyle} placeholder="Example: slow quote follow-up, manual scheduling, overdue invoices, high churn..." />
            </label>
            {error && <div style={{ marginTop: 12, color: '#FFB4B4' }}>{error}</div>}
            <button disabled={loading} style={{ width: '100%', marginTop: 18, border: 0, borderRadius: 12, padding: '15px 18px', background: '#9EF0CF', color: '#07130F', fontWeight: 950, fontSize: 16, cursor: 'pointer' }}>{loading ? 'Scanning…' : 'Run Enterprise Scan'}</button>
          </form>

          <aside style={{ display: 'grid', gap: 14 }}>
            <Card title="What Aridon measures" items={['Revenue recovery', 'Lead-conversion upside', 'Overdue cash recovery', 'Administrative capacity', 'Labor leverage', 'Customer retention']} />
            <Card title="Governance by default" items={['Human approval for external sends', 'No autonomous spending or commitments', 'Every opportunity gets a confidence score', 'Estimates become verified ROI only with evidence']} />
          </aside>
        </div>
      </section>

      {scan && <section style={{ background: '#F4F1E9', color: '#171717', padding: '64px 20px 86px' }}>
        <div style={{ maxWidth: 1180, margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: 12, marginBottom: 20 }}>
            <Metric label="Opportunity Score" value={`${scan.opportunityScore}/100`} />
            <Metric label="Estimated Annual Opportunity" value={money(scan.annualOpportunity)} />
            <Metric label="Opportunities Found" value={String(scan.opportunities.length)} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.35fr) minmax(300px,.65fr)', gap: 16 }}>
            <div style={{ display: 'grid', gap: 12 }}>
              {scan.opportunities.map((item, index) => <article key={item.id} style={{ background: '#fff', border: '1px solid #D4CEC1', borderRadius: 18, padding: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'flex-start' }}>
                  <div><div style={{ fontSize: 11, fontWeight: 950, letterSpacing: 1.2, color: '#547061' }}>#{index + 1} · {item.lane.toUpperCase()}</div><h3 style={{ fontSize: 24, margin: '7px 0 8px' }}>{item.title}</h3></div>
                  <div style={{ textAlign: 'right' }}><strong style={{ fontSize: 24 }}>{money(item.annualValue)}</strong><div style={{ fontSize: 12, color: '#6B675F' }}>estimated annual value</div></div>
                </div>
                <p style={{ lineHeight: 1.6, color: '#4F4B45' }}>{item.finding}</p>
                <div style={{ background: '#F4F1E9', borderRadius: 12, padding: 13, lineHeight: 1.55 }}><strong>{item.recommendedAgent}</strong><br />{item.workflow}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12, color: '#69645C', fontSize: 12 }}><span>Confidence {item.confidence}%</span><span>{item.approvalRequired ? 'Human approval required' : 'Internal workflow candidate'}</span></div>
              </article>)}
            </div>

            <aside style={{ display: 'grid', gap: 12, alignContent: 'start' }}>
              <article style={{ background: '#171717', color: '#fff', borderRadius: 18, padding: 20 }}><div style={{ color: '#9EF0CF', fontSize: 11, fontWeight: 900, letterSpacing: 1.1 }}>EVA · EXECUTIVE BRIEF</div>{scan.executiveBrief.map(item => <p key={item} style={{ lineHeight: 1.55, color: '#D6D6D2' }}>{item}</p>)}</article>
              <article style={{ background: '#DDE9FF', borderRadius: 18, padding: 20 }}><div style={{ fontSize: 11, fontWeight: 900, letterSpacing: 1.1 }}>ROI LEDGER · BASELINE</div>{Object.entries(scan.proofBaseline).map(([key, value]) => <div key={key} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, borderTop: '1px solid #BCCAE4', padding: '9px 0', fontSize: 13 }}><span>{key.replace(/([A-Z])/g, ' $1')}</span><strong>{key.toLowerCase().includes('rate') ? `${Math.round(value * 1000) / 10}%` : value.toLocaleString('en-US')}</strong></div>)}</article>
            </aside>
          </div>
        </div>
      </section>}

      <style jsx>{`@media (max-width: 850px){ section > div[style*="grid-template-columns"]{grid-template-columns:1fr!important} form div[style*="repeat(2"]{grid-template-columns:1fr!important} }`}</style>
    </main>
  );
}

function Field({ label, value, onChange, type = 'text', required = false }: { label: string; value: string; onChange: (value: string) => void; type?: string; required?: boolean }) {
  return <label style={{ display: 'grid', gap: 7, fontSize: 13, color: '#C9D4E4' }}>{label}<input required={required} type={type} value={value} onChange={e => onChange(e.target.value)} style={inputStyle} /></label>;
}

function Card({ title, items }: { title: string; items: string[] }) {
  return <article style={{ background: '#0D1728', border: '1px solid #263754', borderRadius: 18, padding: 18 }}><h3 style={{ marginTop: 0 }}>{title}</h3>{items.map(item => <div key={item} style={{ padding: '9px 0', borderTop: '1px solid #23324B', color: '#C5D0E0' }}>✓ {item}</div>)}</article>;
}

function Metric({ label, value }: { label: string; value: string }) {
  return <article style={{ background: '#fff', border: '1px solid #D4CEC1', borderRadius: 16, padding: 18 }}><div style={{ color: '#716D65', fontSize: 12, fontWeight: 900 }}>{label.toUpperCase()}</div><div style={{ fontSize: 32, fontWeight: 950, marginTop: 7 }}>{value}</div></article>;
}

const inputStyle = { width: '100%', boxSizing: 'border-box' as const, border: '1px solid #34445F', borderRadius: 10, padding: '12px 11px', background: '#07101D', color: '#F8FAFC', fontSize: 15 };
