'use client';

import Link from 'next/link';
import { FormEvent, useMemo, useState } from 'react';
import { CheckCircle2, Download, Loader2, ShieldCheck } from 'lucide-react';

type Opportunity = {
  title: string;
  estimateLow: number;
  estimateHigh: number;
  why: string;
  action: string;
};

type Report = {
  opportunityLow: number;
  opportunityHigh: number;
  opportunities: Opportunity[];
  fundingPrompt: string;
  disclaimer: string;
};

const costOptions = [
  ['feed', 'Feed / hay'],
  ['pasture', 'Pasture / leases'],
  ['labor', 'Labor'],
  ['fuel', 'Fuel / hauling'],
  ['vet', 'Vet / herd health'],
  ['equipment', 'Equipment / repairs'],
  ['financing', 'Financing'],
  ['water', 'Water'],
  ['other', 'Other'],
] as const;

const concerns = [
  ['calf-prices', 'Calf prices'],
  ['drought', 'Drought / forage'],
  ['feed', 'Feed cost'],
  ['water', 'Water'],
  ['labor', 'Labor'],
  ['debt', 'Debt / cash flow'],
  ['equipment', 'Equipment'],
  ['herd-health', 'Herd health'],
  ['paperwork', 'Paperwork / programs'],
] as const;

function money(value: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value || 0);
}

export default function OperationSnapshotPage() {
  const [form, setForm] = useState({
    state: 'New Mexico',
    county: '',
    breedingCows: '',
    acres: '',
    ownedPercent: '50',
    annualRevenueRange: '250k-500k',
    topCosts: ['feed'] as string[],
    mainConcern: 'drought',
    contactName: '',
    email: '',
    mobile: '',
    consentEmail: true,
    consentSms: false,
    website: '',
  });
  const [loading, setLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [error, setError] = useState('');
  const [report, setReport] = useState<Report | null>(null);
  const [saved, setSaved] = useState(false);

  const completion = useMemo(() => {
    const checks = [form.county, form.breedingCows, form.acres, form.annualRevenueRange, form.topCosts.length, form.mainConcern, form.email];
    return Math.round((checks.filter(Boolean).length / checks.length) * 100);
  }, [form]);

  function setField(name: string, value: string | boolean) {
    setForm((current) => ({ ...current, [name]: value }));
  }

  function toggleCost(value: string) {
    setForm((current) => {
      const selected = current.topCosts.includes(value)
        ? current.topCosts.filter((item) => item !== value)
        : [...current.topCosts, value].slice(-3);
      return { ...current, topCosts: selected };
    });
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError('');
    setReport(null);
    try {
      const response = await fetch('/api/ag/snapshot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          breedingCows: Number(form.breedingCows),
          acres: Number(form.acres),
          ownedPercent: Number(form.ownedPercent),
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || 'The snapshot could not be generated.');
      setReport(data.report);
      setSaved(Boolean(data.saved));
      window.setTimeout(() => document.getElementById('snapshot-results')?.scrollIntoView({ behavior: 'smooth' }), 50);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'The snapshot could not be generated.');
    } finally {
      setLoading(false);
    }
  }

  async function downloadPdf() {
    setPdfLoading(true);
    setError('');
    try {
      const response = await fetch('/api/ag/snapshot/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          breedingCows: Number(form.breedingCows),
          acres: Number(form.acres),
          ownedPercent: Number(form.ownedPercent),
        }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data?.error || 'The PDF could not be generated.');
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = 'aridon-operation-snapshot.pdf';
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'The PDF could not be generated.');
    } finally {
      setPdfLoading(false);
    }
  }

  const panel = { background: '#fff', border: '1px solid #d8e1d5', borderRadius: 18, padding: 18 } as const;
  const input = { width: '100%', boxSizing: 'border-box' as const, border: '1px solid #aebaae', borderRadius: 11, padding: '14px 13px', fontSize: 17, background: '#fff', color: '#18251d' };
  const label = { display: 'block', fontWeight: 900, marginBottom: 7, color: '#173526' } as const;

  return <main style={{ minHeight: '100vh', background: '#f4f1e8', color: '#18251d', fontFamily: 'Arial,sans-serif' }}>
    <header style={{ background: '#163d2a', color: '#fff', padding: '16px 18px' }}>
      <div style={{ maxWidth: 920, margin: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
        <Link href="/ag" style={{ color: '#fff', textDecoration: 'none', fontWeight: 950, letterSpacing: 1 }}>ARIDON AG</Link>
        <div style={{ fontSize: 13, color: '#d9e6d8' }}>2-minute ranch margin screen</div>
      </div>
    </header>

    <section style={{ maxWidth: 920, margin: 'auto', padding: '34px 16px 18px' }}>
      <div style={{ maxWidth: 760 }}>
        <div style={{ color: '#356943', fontWeight: 950, fontSize: 13, letterSpacing: .8 }}>FREE OPERATION SNAPSHOT</div>
        <h1 style={{ fontSize: 'clamp(38px,8vw,68px)', lineHeight: .98, margin: '10px 0 16px', letterSpacing: -2 }}>Find the money leaking out of your ranch.</h1>
        <p style={{ fontSize: 19, lineHeight: 1.55, color: '#4b5b50', margin: 0 }}>Answer 8 quick questions. Aridon will show the three areas most worth investigating, a directional dollar range, and what to do next.</p>
      </div>
    </section>

    <section style={{ maxWidth: 920, margin: 'auto', padding: '8px 16px 56px' }}>
      <form onSubmit={submit} style={{ display: 'grid', gap: 12 }}>
        <div style={{ height: 8, background: '#dfe5dc', borderRadius: 99, overflow: 'hidden' }}><div style={{ width: `${completion}%`, height: '100%', background: '#356943' }} /></div>

        <div style={panel}>
          <div style={{ fontSize: 12, fontWeight: 950, color: '#356943', marginBottom: 12 }}>1. WHERE DO YOU OPERATE?</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 10 }}>
            <div><label style={label}>State</label><select value={form.state} onChange={(e) => setField('state', e.target.value)} style={input}><option>New Mexico</option><option>Arizona</option><option>Colorado</option><option>Texas</option><option>Utah</option><option>Nevada</option><option>Other</option></select></div>
            <div><label style={label}>County</label><input value={form.county} onChange={(e) => setField('county', e.target.value)} placeholder="San Juan" style={input} /></div>
          </div>
        </div>

        <div style={panel}>
          <div style={{ fontSize: 12, fontWeight: 950, color: '#356943', marginBottom: 12 }}>2. HOW MANY BREEDING COWS?</div>
          <input inputMode="numeric" value={form.breedingCows} onChange={(e) => setField('breedingCows', e.target.value)} placeholder="250" style={input} />
        </div>

        <div style={panel}>
          <div style={{ fontSize: 12, fontWeight: 950, color: '#356943', marginBottom: 12 }}>3. HOW MANY ACRES DO YOU OPERATE?</div>
          <input inputMode="numeric" value={form.acres} onChange={(e) => setField('acres', e.target.value)} placeholder="8,000" style={input} />
          <div style={{ marginTop: 14 }}><label style={label}>About what percent is owned?</label><input type="range" min="0" max="100" step="5" value={form.ownedPercent} onChange={(e) => setField('ownedPercent', e.target.value)} style={{ width: '100%' }} /><div style={{ fontWeight: 900 }}>{form.ownedPercent}% owned</div></div>
        </div>

        <div style={panel}>
          <div style={{ fontSize: 12, fontWeight: 950, color: '#356943', marginBottom: 12 }}>4. APPROXIMATE ANNUAL CATTLE REVENUE</div>
          <select value={form.annualRevenueRange} onChange={(e) => setField('annualRevenueRange', e.target.value)} style={input}>
            <option value="under-250k">Under $250,000</option><option value="250k-500k">$250,000–$500,000</option><option value="500k-1m">$500,000–$1 million</option><option value="1m-2m">$1–$2 million</option><option value="2m-5m">$2–$5 million</option><option value="over-5m">Over $5 million</option>
          </select>
        </div>

        <div style={panel}>
          <div style={{ fontSize: 12, fontWeight: 950, color: '#356943', marginBottom: 4 }}>5. YOUR THREE BIGGEST COSTS</div>
          <p style={{ margin: '0 0 12px', color: '#657067', fontSize: 13 }}>Tap up to three.</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 8 }}>{costOptions.map(([value, text]) => { const active = form.topCosts.includes(value); return <button key={value} type="button" onClick={() => toggleCost(value)} style={{ padding: '13px 10px', borderRadius: 11, border: active ? '2px solid #356943' : '1px solid #b8c2b7', background: active ? '#e8f0e5' : '#fff', color: '#183523', fontWeight: 850, fontSize: 15 }}>{active ? '✓ ' : ''}{text}</button> })}</div>
        </div>

        <div style={panel}>
          <div style={{ fontSize: 12, fontWeight: 950, color: '#356943', marginBottom: 12 }}>6. WHAT IS YOUR BIGGEST CONCERN RIGHT NOW?</div>
          <select value={form.mainConcern} onChange={(e) => setField('mainConcern', e.target.value)} style={input}>{concerns.map(([value, text]) => <option key={value} value={value}>{text}</option>)}</select>
        </div>

        <div style={panel}>
          <div style={{ fontSize: 12, fontWeight: 950, color: '#356943', marginBottom: 12 }}>7. WHERE SHOULD WE SEND YOUR SNAPSHOT?</div>
          <div style={{ display: 'grid', gap: 10 }}>
            <input value={form.contactName} onChange={(e) => setField('contactName', e.target.value)} placeholder="Name (optional)" autoComplete="name" style={input} />
            <input type="email" value={form.email} onChange={(e) => setField('email', e.target.value)} placeholder="Email" autoComplete="email" style={input} />
            <input value={form.mobile} onChange={(e) => setField('mobile', e.target.value)} placeholder="Mobile, e.g. +15053609529 (optional)" autoComplete="tel" style={input} />
          </div>
        </div>

        <div style={panel}>
          <div style={{ fontSize: 12, fontWeight: 950, color: '#356943', marginBottom: 10 }}>8. HOW SHOULD ARIDON FOLLOW UP?</div>
          <label style={{ display: 'flex', gap: 10, alignItems: 'flex-start', fontWeight: 800, marginBottom: 10 }}><input type="checkbox" checked={form.consentEmail} onChange={(e) => setField('consentEmail', e.target.checked)} style={{ width: 22, height: 22 }} /> Email me the report and useful ranch updates.</label>
          <label style={{ display: 'flex', gap: 10, alignItems: 'flex-start', fontWeight: 800 }}><input type="checkbox" checked={form.consentSms} onChange={(e) => setField('consentSms', e.target.checked)} style={{ width: 22, height: 22 }} /> Text me the Monday Ranch Brief and important alerts. Message/data rates may apply. Reply STOP to opt out.</label>
          <input tabIndex={-1} autoComplete="off" value={form.website} onChange={(e) => setField('website', e.target.value)} aria-hidden="true" style={{ position: 'absolute', left: '-10000px', width: 1, height: 1 }} />
        </div>

        {error && <div style={{ background: '#fff0ed', border: '1px solid #e8b2a7', color: '#7a261a', padding: 14, borderRadius: 12, fontWeight: 800 }}>{error}</div>}

        <button type="submit" disabled={loading} style={{ border: 0, borderRadius: 14, padding: '17px 18px', background: loading ? '#78907f' : '#163d2a', color: '#fff', fontSize: 18, fontWeight: 950, cursor: loading ? 'wait' : 'pointer', minHeight: 58 }}>{loading ? <><Loader2 size={20} style={{ verticalAlign: 'middle', marginRight: 8 }} />Building your snapshot…</> : 'Get My Free Operation Snapshot'}</button>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', justifyContent: 'center', color: '#5e6a61', fontSize: 12 }}><ShieldCheck size={16} /> No credit card. Directional business screen, not a guaranteed savings claim.</div>
      </form>

      {report && <section id="snapshot-results" style={{ marginTop: 30, background: '#fff', border: '2px solid #356943', borderRadius: 20, overflow: 'hidden' }}>
        <div style={{ padding: 22, background: '#163d2a', color: '#fff' }}><div style={{ color: '#c5e2aa', fontSize: 12, fontWeight: 950 }}>YOUR ARIDON OPERATION SNAPSHOT</div><h2 style={{ margin: '7px 0 5px', fontSize: 34 }}>Three places worth investigating first.</h2><div style={{ color: '#dbe9de' }}>Directional annual opportunity: <strong style={{ color: '#fff' }}>{money(report.opportunityLow)}–{money(report.opportunityHigh)}</strong></div></div>
        <div style={{ padding: 18, display: 'grid', gap: 10 }}>{report.opportunities.map((item, index) => <article key={item.title} style={{ background: '#f4f1e8', borderRadius: 14, padding: 16 }}><div style={{ color: '#356943', fontWeight: 950, fontSize: 12 }}>PRIORITY {index + 1}</div><h3 style={{ margin: '5px 0', fontSize: 23 }}>{item.title}</h3><div style={{ color: '#356943', fontWeight: 950 }}>{money(item.estimateLow)}–{money(item.estimateHigh)} worth reviewing</div><p style={{ color: '#566158', lineHeight: 1.5 }}>{item.why}</p><strong>Next:</strong> {item.action}</article>)}</div>
        <div style={{ padding: '0 18px 18px' }}><div style={{ background: '#e7efe3', padding: 15, borderRadius: 12, lineHeight: 1.5 }}><strong>Funding check:</strong> {report.fundingPrompt}</div></div>
        <div style={{ padding: 18, borderTop: '1px solid #dde4dc', display: 'grid', gap: 10 }}>
          <button type="button" onClick={downloadPdf} disabled={pdfLoading} style={{ border: 0, borderRadius: 12, padding: 14, background: '#356943', color: '#fff', fontWeight: 950, fontSize: 16 }}>{pdfLoading ? 'Building PDF…' : <><Download size={18} style={{ verticalAlign: 'middle', marginRight: 7 }} />Download My 1-Page PDF</>}</button>
          <a href="tel:+15053609529" style={{ borderRadius: 12, padding: 14, background: '#163d2a', color: '#fff', fontWeight: 950, fontSize: 16, textAlign: 'center', textDecoration: 'none' }}>Review This With Aridon — 505-360-9529</a>
          <div style={{ textAlign: 'center', fontWeight: 850, color: '#356943' }}>Founding Ranch Plan: $149/month or $1,490/year</div>
          {saved && <div style={{ display: 'flex', gap: 7, justifyContent: 'center', alignItems: 'center', color: '#55705c', fontSize: 12 }}><CheckCircle2 size={15} /> Snapshot saved so Aridon can continue the conversation.</div>}
          <p style={{ margin: 0, color: '#6b746d', fontSize: 11, lineHeight: 1.45 }}>{report.disclaimer}</p>
        </div>
      </section>}
    </section>
  </main>;
}
