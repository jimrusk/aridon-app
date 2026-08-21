'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';

type DealForm = {
  businessName: string;
  askingPrice: number;
  revenue: number;
  ebitda: number;
  cashAvailable: number;
  lenderCapacity: number;
  sellerFinanceWillingness: number;
  sellerUrgency: number;
  listingMonths: number;
  competingBuyers: number;
  buyerAlternatives: number;
  sellerAlternatives: number;
  sellerReason: string;
  sellerPriorities: string;
  walkAwayPrice: number;
};

type Analysis = {
  sellerRead: { primaryMotivation: string; likelyPriorities: string[]; leverageSummary: string };
  negotiation: { openingPosition: string; sequence: string[]; probingQuestions: string[]; concessionsToTrade: string[]; avoid: string[] };
  loi: { headline: string; terms: string[]; diligenceFocus: string[] };
  assumptions: string[];
  approvalGates: string[];
  demo?: boolean;
};

const initialDeal: DealForm = {
  businessName: '',
  askingPrice: 0,
  revenue: 0,
  ebitda: 0,
  cashAvailable: 0,
  lenderCapacity: 0,
  sellerFinanceWillingness: 50,
  sellerUrgency: 3,
  listingMonths: 0,
  competingBuyers: 0,
  buyerAlternatives: 5,
  sellerAlternatives: 5,
  sellerReason: '',
  sellerPriorities: '',
  walkAwayPrice: 0,
};

const money = (value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(Number.isFinite(value) ? value : 0);
const pct = (value: number) => `${Math.round(value)}%`;
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

function NumberField({ label, value, onChange, min = 0, max, step = 1, prefix }: { label: string; value: number; onChange: (value: number) => void; min?: number; max?: number; step?: number; prefix?: string }) {
  return <label style={{ display: 'grid', gap: 7, color: '#C7D2E3', fontSize: 13, fontWeight: 800 }}>
    <span>{label}</span>
    <div style={{ display: 'flex', alignItems: 'center', background: '#08111F', border: '1px solid #263958', borderRadius: 11, overflow: 'hidden' }}>
      {prefix ? <span style={{ paddingLeft: 12, color: '#7FDDB9', fontWeight: 900 }}>{prefix}</span> : null}
      <input type="number" value={value || ''} min={min} max={max} step={step} onChange={(event) => onChange(Number(event.target.value) || 0)} style={{ width: '100%', border: 0, outline: 0, padding: '11px 12px', background: 'transparent', color: '#F8FAFC', fontSize: 15 }} />
    </div>
  </label>;
}

function TextField({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string }) {
  return <label style={{ display: 'grid', gap: 7, color: '#C7D2E3', fontSize: 13, fontWeight: 800 }}>
    <span>{label}</span>
    <input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} style={{ width: '100%', boxSizing: 'border-box', border: '1px solid #263958', borderRadius: 11, outline: 0, padding: '11px 12px', background: '#08111F', color: '#F8FAFC', fontSize: 15 }} />
  </label>;
}

function Card({ title, eyebrow, children }: { title: string; eyebrow?: string; children: React.ReactNode }) {
  return <section style={{ background: '#0D1728', border: '1px solid #263958', borderRadius: 18, padding: 20 }}>
    {eyebrow ? <div style={{ color: '#7FDDB9', fontSize: 11, fontWeight: 950, letterSpacing: 1.1 }}>{eyebrow}</div> : null}
    <h2 style={{ margin: eyebrow ? '7px 0 16px' : '0 0 16px', fontSize: 22 }}>{title}</h2>
    {children}
  </section>;
}

function BulletList({ items }: { items: string[] }) {
  return <ul style={{ margin: 0, paddingLeft: 20, display: 'grid', gap: 8, color: '#C1CCDC', lineHeight: 1.5 }}>{items.map((item, index) => <li key={`${item}-${index}`}>{item}</li>)}</ul>;
}

export default function AcquisitionsPage() {
  const [deal, setDeal] = useState<DealForm>(initialDeal);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState('');

  const update = <K extends keyof DealForm>(key: K, value: DealForm[K]) => setDeal((current) => ({ ...current, [key]: value }));

  const leverage = useMemo(() => {
    const urgency = ((clamp(deal.sellerUrgency, 1, 5) - 1) / 4) * 25;
    const listing = clamp(deal.listingMonths / 18, 0, 1) * 15;
    const competition = deal.competingBuyers <= 0 ? 20 : deal.competingBuyers === 1 ? 14 : deal.competingBuyers === 2 ? 8 : 3;
    const sellerFinance = clamp(deal.sellerFinanceWillingness, 0, 100) * 0.15;
    const buyerOptions = clamp(deal.buyerAlternatives, 0, 10) * 1.5;
    const sellerOptions = (10 - clamp(deal.sellerAlternatives, 0, 10));
    return Math.round(clamp(urgency + listing + competition + sellerFinance + buyerOptions + sellerOptions, 0, 100));
  }, [deal]);

  const askingMultiple = deal.ebitda > 0 ? deal.askingPrice / deal.ebitda : 0;
  const cashCoverage = deal.askingPrice > 0 ? (deal.cashAvailable / deal.askingPrice) * 100 : 0;
  const sellerMax = deal.askingPrice * clamp(deal.sellerFinanceWillingness / 100, 0, 1) * 0.6;

  const offers = useMemo(() => {
    const build = (name: string, priceFactor: number, cashTarget: number, sellerTarget: number, earnoutTarget: number, note: string) => {
      const price = deal.askingPrice * priceFactor;
      const cash = Math.min(deal.cashAvailable, price * cashTarget);
      const sellerNote = Math.min(price * sellerTarget, sellerMax);
      const earnout = price * earnoutTarget;
      const lenderNeeded = Math.max(0, price - cash - sellerNote - earnout);
      const gap = Math.max(0, lenderNeeded - deal.lenderCapacity);
      return { name, price, cash, sellerNote, earnout, lenderNeeded, gap, note };
    };
    if (deal.askingPrice <= 0) return [];
    return [
      build('Certainty Offer', 0.9, 0.15, 0.2, 0, 'Lower headline price in exchange for a cleaner, simpler close. Use only if verified earnings support the price.'),
      build('Seller Income Offer', 1, 0.05, 0.5, 0.1, 'Protect headline price while converting more consideration into seller financing and performance-based value.'),
      build('Performance Offer', 1.05, 0.05, 0.3, 0.2, 'A higher headline number only when part of the value is earned through verified post-close performance.'),
    ];
  }, [deal.askingPrice, deal.cashAvailable, deal.lenderCapacity, sellerMax]);

  async function runStrategy() {
    setLoading(true);
    setError('');
    setAnalysis(null);
    try {
      const response = await fetch('/api/acquisitions/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(deal),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload?.error || 'Analysis failed.');
      setAnalysis(payload as Analysis);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'The deal strategy could not be completed.');
    } finally {
      setLoading(false);
    }
  }

  function saveSnapshot() {
    try {
      localStorage.setItem('aridon-acquisition-deal', JSON.stringify(deal));
      setSaved('Deal snapshot saved on this device.');
    } catch {
      setSaved('This browser could not save the snapshot.');
    }
  }

  function loadSnapshot() {
    try {
      const raw = localStorage.getItem('aridon-acquisition-deal');
      if (!raw) return setSaved('No saved deal found on this device.');
      setDeal({ ...initialDeal, ...JSON.parse(raw) });
      setSaved('Saved deal loaded.');
    } catch {
      setSaved('The saved deal could not be loaded.');
    }
  }

  return <main style={{ minHeight: '100vh', background: '#07101D', color: '#F8FAFC', fontFamily: 'Arial,sans-serif', padding: '24px 18px 70px' }}>
    <div style={{ maxWidth: 1180, margin: '0 auto' }}>
      <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 28 }}>
        <div><strong>ARIDON 3</strong><span style={{ color: '#7B8BA4', marginLeft: 10, fontSize: 13 }}>Acquisition Deal Engine</span></div>
        <Link href="/dashboard" style={{ color: '#9EF0CF', textDecoration: 'none', fontWeight: 900 }}>← Owner Dashboard</Link>
      </nav>

      <header style={{ padding: '30px 0 26px' }}>
        <div style={{ color: '#9EF0CF', fontSize: 12, fontWeight: 950, letterSpacing: 1.25 }}>FIND → SCORE → STRUCTURE → NEGOTIATE → LOI → DILIGENCE</div>
        <h1 style={{ fontSize: 'clamp(42px,7vw,72px)', lineHeight: .96, margin: '10px 0 14px', maxWidth: 900 }}>Turn a business listing into a deal strategy.</h1>
        <p style={{ color: '#B8C4D5', fontSize: 18, lineHeight: 1.6, maxWidth: 850, margin: 0 }}>Score leverage, expose the real cash requirement, build multiple acquisition structures, read seller psychology, and prepare the negotiation path before anyone sends an offer.</p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.15fr) minmax(310px,.85fr)', gap: 16, alignItems: 'start' }}>
        <div style={{ display: 'grid', gap: 16 }}>
          <Card title="Target business" eyebrow="DEAL INTAKE">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(210px,1fr))', gap: 12 }}>
              <TextField label="Business name" value={deal.businessName} onChange={(value) => update('businessName', value)} placeholder="Example: Mesa Equipment Rental" />
              <NumberField label="Asking price" value={deal.askingPrice} onChange={(value) => update('askingPrice', value)} prefix="$" step={1000} />
              <NumberField label="Annual revenue" value={deal.revenue} onChange={(value) => update('revenue', value)} prefix="$" step={1000} />
              <NumberField label="Normalized EBITDA / SDE" value={deal.ebitda} onChange={(value) => update('ebitda', value)} prefix="$" step={1000} />
              <NumberField label="Cash available" value={deal.cashAvailable} onChange={(value) => update('cashAvailable', value)} prefix="$" step={1000} />
              <NumberField label="Estimated lender capacity" value={deal.lenderCapacity} onChange={(value) => update('lenderCapacity', value)} prefix="$" step={1000} />
              <NumberField label="Walk-away price" value={deal.walkAwayPrice} onChange={(value) => update('walkAwayPrice', value)} prefix="$" step={1000} />
            </div>
          </Card>

          <Card title="Seller psychology & leverage" eyebrow="NEGOTIATION INTELLIGENCE">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(190px,1fr))', gap: 12 }}>
              <NumberField label="Seller urgency (1–5)" value={deal.sellerUrgency} onChange={(value) => update('sellerUrgency', clamp(value, 1, 5))} min={1} max={5} />
              <NumberField label="Months on market" value={deal.listingMonths} onChange={(value) => update('listingMonths', value)} max={120} />
              <NumberField label="Known competing buyers" value={deal.competingBuyers} onChange={(value) => update('competingBuyers', value)} max={20} />
              <NumberField label="Seller-finance willingness %" value={deal.sellerFinanceWillingness} onChange={(value) => update('sellerFinanceWillingness', clamp(value, 0, 100))} max={100} />
              <NumberField label="Our alternatives (0–10)" value={deal.buyerAlternatives} onChange={(value) => update('buyerAlternatives', clamp(value, 0, 10))} max={10} />
              <NumberField label="Seller alternatives (0–10)" value={deal.sellerAlternatives} onChange={(value) => update('sellerAlternatives', clamp(value, 0, 10))} max={10} />
            </div>
            <div style={{ display: 'grid', gap: 12, marginTop: 12 }}>
              <TextField label="Why is the owner selling?" value={deal.sellerReason} onChange={(value) => update('sellerReason', value)} placeholder="Retirement, burnout, health, partner dispute, no successor..." />
              <TextField label="What appears to matter most to the seller?" value={deal.sellerPriorities} onChange={(value) => update('sellerPriorities', value)} placeholder="Price, speed, monthly income, employees, legacy, taxes, certainty..." />
            </div>
          </Card>

          <Card title="Three ways to buy it" eyebrow="STRUCTURE LAB">
            {offers.length === 0 ? <p style={{ color: '#90A0B8', margin: 0 }}>Enter an asking price to generate acquisition structures.</p> : <div style={{ display: 'grid', gap: 12 }}>
              {offers.map((offer) => <div key={offer.name} style={{ border: '1px solid #2A3B58', background: '#091321', borderRadius: 14, padding: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', alignItems: 'baseline' }}><strong style={{ fontSize: 19 }}>{offer.name}</strong><strong style={{ color: '#9EF0CF', fontSize: 20 }}>{money(offer.price)}</strong></div>
                <p style={{ color: '#AEBBD0', lineHeight: 1.5, margin: '8px 0 12px' }}>{offer.note}</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(120px,1fr))', gap: 8 }}>
                  {[['Cash', offer.cash], ['Seller note', offer.sellerNote], ['Earnout', offer.earnout], ['Lender needed', offer.lenderNeeded]].map(([label, value]) => <div key={String(label)} style={{ background: '#0E1B2D', borderRadius: 10, padding: 10 }}><div style={{ color: '#8190A8', fontSize: 11, fontWeight: 800 }}>{label}</div><div style={{ marginTop: 5, fontWeight: 900 }}>{money(Number(value))}</div></div>)}
                </div>
                {offer.gap > 0 ? <div style={{ marginTop: 10, color: '#FFC46B', fontSize: 13, fontWeight: 800 }}>Funding gap: {money(offer.gap)} beyond entered lender capacity.</div> : <div style={{ marginTop: 10, color: '#7FDDB9', fontSize: 13, fontWeight: 800 }}>No modeled funding gap against the lender capacity entered. Financing is still subject to lender approval.</div>}
              </div>)}
            </div>}
          </Card>
        </div>

        <aside style={{ display: 'grid', gap: 16, position: 'sticky', top: 16 }}>
          <Card title="Deal cockpit" eyebrow="LIVE SCORE">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div style={{ background: '#08111F', borderRadius: 14, padding: 15 }}><div style={{ color: '#8190A8', fontSize: 11, fontWeight: 900 }}>LEVERAGE</div><div style={{ fontSize: 34, fontWeight: 950, color: leverage >= 70 ? '#9EF0CF' : leverage >= 45 ? '#FFC46B' : '#FF8E8E' }}>{leverage}/100</div></div>
              <div style={{ background: '#08111F', borderRadius: 14, padding: 15 }}><div style={{ color: '#8190A8', fontSize: 11, fontWeight: 900 }}>ASKING MULTIPLE</div><div style={{ fontSize: 34, fontWeight: 950 }}>{askingMultiple > 0 ? `${askingMultiple.toFixed(2)}×` : '—'}</div></div>
              <div style={{ background: '#08111F', borderRadius: 14, padding: 15 }}><div style={{ color: '#8190A8', fontSize: 11, fontWeight: 900 }}>CASH COVERAGE</div><div style={{ fontSize: 27, fontWeight: 950 }}>{pct(cashCoverage)}</div></div>
              <div style={{ background: '#08111F', borderRadius: 14, padding: 15 }}><div style={{ color: '#8190A8', fontSize: 11, fontWeight: 900 }}>SELLER NOTE RANGE</div><div style={{ fontSize: 22, fontWeight: 950 }}>{money(sellerMax)}</div></div>
            </div>
            <div style={{ color: '#91A0B6', fontSize: 12, lineHeight: 1.5, marginTop: 12 }}>Leverage is a screening score based on the inputs above. It is not proof of seller intent or bargaining power.</div>
          </Card>

          <Card title="Run the negotiation plan" eyebrow="AI DEAL ROOM">
            <p style={{ color: '#AEBBD0', lineHeight: 1.55, marginTop: 0 }}>Build the seller read, opening position, probing questions, concession trades, LOI priorities, and diligence focus from this deal.</p>
            <button onClick={runStrategy} disabled={loading || deal.askingPrice <= 0} style={{ width: '100%', border: 0, borderRadius: 12, padding: '13px 16px', background: '#9EF0CF', color: '#06111B', fontWeight: 950, cursor: 'pointer', opacity: loading || deal.askingPrice <= 0 ? .5 : 1 }}>{loading ? 'Building strategy…' : 'Build Deal Strategy'}</button>
            {error ? <div style={{ color: '#FF9B9B', marginTop: 10, fontSize: 13 }}>{error}</div> : null}
            <div style={{ display: 'flex', gap: 8, marginTop: 10 }}><button onClick={saveSnapshot} style={{ flex: 1, border: '1px solid #314662', borderRadius: 10, padding: '10px 12px', background: '#0A1422', color: '#D8E2F0', fontWeight: 800, cursor: 'pointer' }}>Save</button><button onClick={loadSnapshot} style={{ flex: 1, border: '1px solid #314662', borderRadius: 10, padding: '10px 12px', background: '#0A1422', color: '#D8E2F0', fontWeight: 800, cursor: 'pointer' }}>Load Last</button></div>
            {saved ? <div style={{ color: '#8FA0B6', marginTop: 8, fontSize: 12 }}>{saved}</div> : null}
          </Card>
        </aside>
      </div>

      {analysis ? <div style={{ display: 'grid', gap: 16, marginTop: 18 }}>
        <div style={{ padding: 14, borderRadius: 12, background: analysis.demo ? '#2A2112' : '#10251F', border: `1px solid ${analysis.demo ? '#6C5625' : '#285E4E'}`, color: analysis.demo ? '#FFD88F' : '#A8F3D7', fontWeight: 800 }}>{analysis.demo ? 'Fallback strategy mode is active because an AI key was not available for this run.' : 'AI acquisition strategy completed.'}</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(310px,1fr))', gap: 16 }}>
          <Card title="Seller read" eyebrow="PSYCHOLOGY">
            <p style={{ color: '#E7EDF6', lineHeight: 1.6, fontWeight: 800 }}>{analysis.sellerRead.primaryMotivation}</p>
            <p style={{ color: '#AEBBD0', lineHeight: 1.55 }}>{analysis.sellerRead.leverageSummary}</p>
            <BulletList items={analysis.sellerRead.likelyPriorities} />
          </Card>
          <Card title="Opening position" eyebrow="NEGOTIATION">
            <p style={{ color: '#E7EDF6', lineHeight: 1.6, fontWeight: 800 }}>{analysis.negotiation.openingPosition}</p>
            <h3 style={{ fontSize: 14, color: '#9EF0CF' }}>Sequence</h3><BulletList items={analysis.negotiation.sequence} />
          </Card>
          <Card title="Questions that uncover the deal" eyebrow="SELLER DISCOVERY"><BulletList items={analysis.negotiation.probingQuestions} /></Card>
          <Card title="Trade, don't give" eyebrow="CONCESSIONS"><BulletList items={analysis.negotiation.concessionsToTrade} /><h3 style={{ fontSize: 14, color: '#FFB3B3', marginTop: 18 }}>Avoid</h3><BulletList items={analysis.negotiation.avoid} /></Card>
          <Card title={analysis.loi.headline} eyebrow="LOI FRAMEWORK"><BulletList items={analysis.loi.terms} /></Card>
          <Card title="Due diligence attack list" eyebrow="VERIFY BEFORE YOU BUY"><BulletList items={analysis.loi.diligenceFocus} /></Card>
        </div>
        <Card title="Human approval gates" eyebrow="CONTROL LAYER"><BulletList items={analysis.approvalGates} /><div style={{ height: 1, background: '#283B58', margin: '18px 0' }} /><BulletList items={analysis.assumptions} /></Card>
      </div> : null}

      <footer style={{ marginTop: 24, color: '#7F8EA5', fontSize: 12, lineHeight: 1.6 }}>Aridon Acquisition Deal Engine is a screening and negotiation-support tool. It does not replace independent valuation, lender underwriting, accounting/tax advice, legal review, or due diligence.</footer>
    </div>
  </main>;
}
