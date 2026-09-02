'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';

type Input = {
  company: string;
  sector: string;
  stage: string;
  revenue: number;
  recurringRevenue: number;
  grossMargin: number;
  ebitda: number;
  monthlyBurn: number;
  cash: number;
  valuation: number;
  raise: number;
  customerConcentration: number;
  growthRate: number;
  moat: string;
  claim: string;
  notes: string;
};

type Score = { label: string; score: number; reason: string };
type Output = {
  overallScore: number;
  decision: 'PASS' | 'INVESTIGATE' | 'DUE DILIGENCE' | 'INVEST';
  confidence: 'LOW' | 'MEDIUM' | 'HIGH';
  thesis: string;
  scorecard: Score[];
  redFlags: string[];
  questions: string[];
  diligenceChecklist: string[];
  proofPlan: string[];
  memo: {
    opportunity: string;
    market: string;
    economics: string;
    teamExecution: string;
    risks: string;
    recommendation: string;
  };
  assumptions: string[];
  demo?: boolean;
};

const blank: Input = {
  company: '',
  sector: '',
  stage: 'Early stage',
  revenue: 0,
  recurringRevenue: 0,
  grossMargin: 0,
  ebitda: 0,
  monthlyBurn: 0,
  cash: 0,
  valuation: 0,
  raise: 0,
  customerConcentration: 0,
  growthRate: 0,
  moat: '',
  claim: '',
  notes: '',
};

const sample: Input = {
  company: 'Mesa Reliability AI',
  sector: 'Industrial AI / SaaS',
  stage: 'Series A',
  revenue: 4_800_000,
  recurringRevenue: 4_100_000,
  grossMargin: 73,
  ebitda: -620_000,
  monthlyBurn: 118_000,
  cash: 1_900_000,
  valuation: 28_000_000,
  raise: 6_000_000,
  customerConcentration: 34,
  growthRate: 58,
  moat: 'Equipment-failure dataset collected through customer integrations, workflow history, and reliability models embedded in maintenance planning.',
  claim: 'Reduces unplanned downtime by 18% to 30% within the first year of deployment.',
  notes: 'Founder says 11 enterprise customers are live, two customers represent roughly one-third of revenue, expansion revenue is strong, and the company expects to reach cash-flow breakeven 20 months after this round. Need to verify retention, implementation burden, data rights, gross-margin normalization, and whether measured downtime reductions are independently attributable to the platform.',
};

const money = (value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(Number.isFinite(value) ? value : 0);
const pct = (value: number) => `${Math.round(value)}%`;

function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return <label style={{ display: 'grid', gap: 7, color: '#C8D2E3', fontSize: 13, fontWeight: 800 }}>
    <span>{label}</span>
    <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} style={inputStyle} />
  </label>;
}

function NumberField({ label, value, onChange, suffix, prefix }: { label: string; value: number; onChange: (v: number) => void; suffix?: string; prefix?: string }) {
  return <label style={{ display: 'grid', gap: 7, color: '#C8D2E3', fontSize: 13, fontWeight: 800 }}>
    <span>{label}</span>
    <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #293A57', borderRadius: 11, background: '#07111E', overflow: 'hidden' }}>
      {prefix ? <span style={{ paddingLeft: 12, color: '#8BE8C6', fontWeight: 900 }}>{prefix}</span> : null}
      <input type="number" value={value || ''} onChange={(e) => onChange(Number(e.target.value) || 0)} style={{ ...inputStyle, border: 0, background: 'transparent', borderRadius: 0 }} />
      {suffix ? <span style={{ paddingRight: 12, color: '#8FA0B8', fontSize: 12, fontWeight: 900 }}>{suffix}</span> : null}
    </div>
  </label>;
}

function TextArea({ label, value, onChange, placeholder, rows = 4 }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; rows?: number }) {
  return <label style={{ display: 'grid', gap: 7, color: '#C8D2E3', fontSize: 13, fontWeight: 800 }}>
    <span>{label}</span>
    <textarea value={value} rows={rows} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.5 }} />
  </label>;
}

function Panel({ title, eyebrow, children }: { title: string; eyebrow?: string; children: React.ReactNode }) {
  return <section style={{ border: '1px solid #263958', borderRadius: 18, background: '#0D1728', padding: 20 }}>
    {eyebrow ? <div style={{ color: '#8BE8C6', fontSize: 11, fontWeight: 950, letterSpacing: 1.15 }}>{eyebrow}</div> : null}
    <h2 style={{ margin: eyebrow ? '7px 0 15px' : '0 0 15px', fontSize: 22 }}>{title}</h2>
    {children}
  </section>;
}

function List({ items }: { items: string[] }) {
  return <ul style={{ margin: 0, paddingLeft: 20, display: 'grid', gap: 9, color: '#C2CDDC', lineHeight: 1.5 }}>{items.map((item, i) => <li key={`${i}-${item.slice(0, 20)}`}>{item}</li>)}</ul>;
}

function DecisionPill({ decision }: { decision: Output['decision'] }) {
  const bg = decision === 'INVEST' ? '#12372B' : decision === 'DUE DILIGENCE' ? '#2D3316' : decision === 'INVESTIGATE' ? '#322818' : '#3A1D24';
  const border = decision === 'INVEST' ? '#2A7C61' : decision === 'DUE DILIGENCE' ? '#7A7E2B' : decision === 'INVESTIGATE' ? '#8D6930' : '#8D4051';
  return <span style={{ display: 'inline-flex', padding: '7px 11px', borderRadius: 999, background: bg, border: `1px solid ${border}`, fontSize: 12, fontWeight: 950, letterSpacing: .7 }}>{decision}</span>;
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  boxSizing: 'border-box',
  background: '#07111E',
  color: '#F7FAFC',
  border: '1px solid #293A57',
  borderRadius: 11,
  padding: '11px 12px',
  outline: 0,
  fontSize: 14,
};

export default function InvestorIntelligencePage() {
  const [input, setInput] = useState<Input>(blank);
  const [result, setResult] = useState<Output | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const set = <K extends keyof Input>(key: K, value: Input[K]) => setInput((current) => ({ ...current, [key]: value }));

  const quickMetrics = useMemo(() => {
    const recurringPct = input.revenue > 0 ? input.recurringRevenue / input.revenue * 100 : 0;
    const runway = input.monthlyBurn > 0 ? input.cash / input.monthlyBurn : 0;
    const revenueMultiple = input.revenue > 0 ? input.valuation / input.revenue : 0;
    return { recurringPct, runway, revenueMultiple };
  }, [input]);

  async function analyze() {
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const response = await fetch('/api/investor-intelligence/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload?.error || 'Screen failed.');
      setResult(payload as Output);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Investor Intelligence could not complete the screen.');
    } finally {
      setLoading(false);
    }
  }

  return <main style={{ minHeight: '100vh', background: '#06101C', color: '#F8FAFC', fontFamily: 'Arial,sans-serif', padding: '22px 18px 72px' }}>
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
      <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <div><strong>ARIDON</strong><span style={{ marginLeft: 10, color: '#7F8EA6', fontSize: 13 }}>Investment Intelligence</span></div>
        <div style={{ display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ color: '#8BE8C6', fontSize: 12, fontWeight: 900 }}>PRIVATE PILOT</span>
          <Link href="/dashboard" style={{ color: '#A1F0D2', textDecoration: 'none', fontWeight: 900 }}>Owner Dashboard</Link>
        </div>
      </nav>

      <header style={{ padding: '52px 0 28px' }}>
        <div style={{ color: '#8BE8C6', fontSize: 12, fontWeight: 950, letterSpacing: 1.25 }}>PREPARED FOR MARK S. BENAK & ASSOCIATES</div>
        <h1 style={{ fontSize: 'clamp(44px,7vw,76px)', lineHeight: .96, maxWidth: 980, margin: '10px 0 16px' }}>Put a second brain on every investment decision.</h1>
        <p style={{ maxWidth: 890, margin: 0, color: '#B9C5D5', fontSize: 18, lineHeight: 1.65 }}>Drop in the facts from an early-stage or growth opportunity. Aridon screens the deal, separates claims from evidence, scores the risk, creates the management questions, builds the diligence plan, and drafts an investor memo before the meeting clock starts ticking.</p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(230px,1fr))', gap: 10, marginBottom: 18 }}>
        {[['01', 'SCREEN', 'Decide what deserves time.'], ['02', 'VERIFY', 'Expose missing evidence and contradictions.'], ['03', 'DILIGENCE', 'Generate the data-room and management checklist.'], ['04', 'MEMO', 'Turn findings into an investment-ready brief.']].map(([n, title, text]) => <div key={n} style={{ border: '1px solid #263958', borderRadius: 14, background: '#0A1423', padding: 15 }}><div style={{ color: '#73829A', fontSize: 11, fontWeight: 900 }}>{n}</div><strong style={{ display: 'block', marginTop: 5 }}>{title}</strong><span style={{ display: 'block', color: '#A7B5C8', marginTop: 4, lineHeight: 1.45, fontSize: 13 }}>{text}</span></div>)}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.05fr) minmax(330px,.95fr)', gap: 16, alignItems: 'start' }}>
        <div style={{ display: 'grid', gap: 16 }}>
          <Panel title="Opportunity intake" eyebrow="DEAL SCREEN">
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap', alignItems: 'center', marginBottom: 14 }}>
              <p style={{ margin: 0, color: '#93A3B9', fontSize: 13 }}>Use non-confidential sample information until a dedicated secure diligence workspace is configured.</p>
              <button onClick={() => { setInput(sample); setResult(null); }} style={secondaryButton}>Load sample industrial-AI deal</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(210px,1fr))', gap: 12 }}>
              <Field label="Company" value={input.company} onChange={(v) => set('company', v)} placeholder="Target company" />
              <Field label="Sector" value={input.sector} onChange={(v) => set('sector', v)} placeholder="Industrial AI, SaaS, manufacturing..." />
              <Field label="Stage" value={input.stage} onChange={(v) => set('stage', v)} placeholder="Seed, Series A, growth..." />
              <NumberField label="Annual revenue" value={input.revenue} onChange={(v) => set('revenue', v)} prefix="$" />
              <NumberField label="Recurring revenue" value={input.recurringRevenue} onChange={(v) => set('recurringRevenue', v)} prefix="$" />
              <NumberField label="Gross margin" value={input.grossMargin} onChange={(v) => set('grossMargin', v)} suffix="%" />
              <NumberField label="EBITDA / operating profit" value={input.ebitda} onChange={(v) => set('ebitda', v)} prefix="$" />
              <NumberField label="Monthly cash burn" value={input.monthlyBurn} onChange={(v) => set('monthlyBurn', v)} prefix="$" />
              <NumberField label="Cash on hand" value={input.cash} onChange={(v) => set('cash', v)} prefix="$" />
              <NumberField label="Pre/post-money valuation" value={input.valuation} onChange={(v) => set('valuation', v)} prefix="$" />
              <NumberField label="Capital being raised" value={input.raise} onChange={(v) => set('raise', v)} prefix="$" />
              <NumberField label="Largest customer concentration" value={input.customerConcentration} onChange={(v) => set('customerConcentration', v)} suffix="%" />
              <NumberField label="YoY growth" value={input.growthRate} onChange={(v) => set('growthRate', v)} suffix="%" />
            </div>
            <div style={{ display: 'grid', gap: 12, marginTop: 12 }}>
              <TextArea label="What is the moat?" value={input.moat} onChange={(v) => set('moat', v)} placeholder="Proprietary data, IP, integration depth, distribution, switching cost, cost advantage..." rows={3} />
              <TextArea label="Most important founder/product claim" value={input.claim} onChange={(v) => set('claim', v)} placeholder="What claim, if true, makes this deal investable?" rows={3} />
              <TextArea label="Notes from deck, conversation or data room" value={input.notes} onChange={(v) => set('notes', v)} placeholder="Traction, customers, pricing, team, risks, contracts, technical claims, use of funds..." rows={5} />
            </div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', marginTop: 16 }}>
              <button onClick={analyze} disabled={loading} style={{ ...primaryButton, opacity: loading ? .65 : 1 }}>{loading ? 'Running investor screen…' : 'Run Investor Screen'}</button>
              <button onClick={() => { setInput(blank); setResult(null); setError(''); }} style={secondaryButton}>Clear</button>
              {error ? <span style={{ color: '#FF9AAA', fontWeight: 800 }}>{error}</span> : null}
            </div>
          </Panel>

          {result ? <>
            <Panel title="Investment thesis" eyebrow="ARIDON READ">
              <div style={{ display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap', marginBottom: 14 }}>
                <div style={{ width: 88, height: 88, borderRadius: 22, display: 'grid', placeItems: 'center', background: '#081321', border: '1px solid #36506F' }}><div style={{ textAlign: 'center' }}><strong style={{ display: 'block', fontSize: 34, color: '#A3F2D5' }}>{Math.round(result.overallScore)}</strong><span style={{ color: '#7F90A9', fontSize: 11 }}>of 100</span></div></div>
                <div style={{ flex: 1, minWidth: 230 }}><div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}><DecisionPill decision={result.decision} /><span style={{ color: '#8696AD', fontSize: 12, fontWeight: 800 }}>CONFIDENCE: {result.confidence}</span>{result.demo ? <span style={{ color: '#8696AD', fontSize: 12 }}>fallback screen</span> : <span style={{ color: '#8BE8C6', fontSize: 12 }}>AI analysis</span>}</div><p style={{ margin: '10px 0 0', color: '#CAD4E2', lineHeight: 1.6 }}>{result.thesis}</p></div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 10 }}>
                {result.scorecard.map((s) => <div key={s.label} style={{ border: '1px solid #263A59', borderRadius: 13, background: '#091423', padding: 13 }}><div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}><strong>{s.label}</strong><strong style={{ color: s.score >= 75 ? '#91EAC9' : s.score >= 55 ? '#E8D584' : '#F09AAA' }}>{s.score}</strong></div><div style={{ height: 6, background: '#18263A', borderRadius: 99, overflow: 'hidden', margin: '9px 0' }}><div style={{ height: '100%', width: `${Math.max(2, Math.min(100, s.score))}%`, background: 'linear-gradient(90deg,#4F7FB1,#8BE8C6)' }} /></div><p style={{ margin: 0, color: '#99A9BE', fontSize: 12, lineHeight: 1.45 }}>{s.reason}</p></div>)}
              </div>
            </Panel>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: 16 }}>
              <Panel title="Red flags" eyebrow="WHAT CAN KILL THE DEAL"><List items={result.redFlags} /></Panel>
              <Panel title="Questions for management" eyebrow="NEXT MEETING"><List items={result.questions} /></Panel>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: 16 }}>
              <Panel title="Diligence-room request" eyebrow="VERIFY"><List items={result.diligenceChecklist} /></Panel>
              <Panel title="Proof plan" eyebrow="FALSIFY THE THESIS"><List items={result.proofPlan} /></Panel>
            </div>

            <Panel title="Draft investment memo" eyebrow="ONE-PAGE IC BRIEF">
              <div style={{ display: 'grid', gap: 13 }}>
                {[['Opportunity', result.memo.opportunity], ['Market', result.memo.market], ['Economics', result.memo.economics], ['Team & execution', result.memo.teamExecution], ['Risks', result.memo.risks], ['Recommendation', result.memo.recommendation]].map(([label, text]) => <div key={label} style={{ borderBottom: '1px solid #20314B', paddingBottom: 13 }}><strong style={{ color: '#91EAC9' }}>{label}</strong><p style={{ margin: '6px 0 0', color: '#C6D1DF', lineHeight: 1.6 }}>{text}</p></div>)}
              </div>
            </Panel>
          </> : null}
        </div>

        <aside style={{ display: 'grid', gap: 16, position: 'sticky', top: 16 }}>
          <Panel title="Instant metrics" eyebrow="BEFORE THE AI">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 9 }}>
              {[['Revenue', money(input.revenue)], ['Recurring mix', pct(quickMetrics.recurringPct)], ['Runway', quickMetrics.runway ? `${quickMetrics.runway.toFixed(1)} mo` : '—'], ['Valuation / revenue', quickMetrics.revenueMultiple ? `${quickMetrics.revenueMultiple.toFixed(1)}×` : '—'], ['Gross margin', pct(input.grossMargin)], ['Top customer', pct(input.customerConcentration)]].map(([label, value]) => <div key={label} style={{ background: '#081321', border: '1px solid #263958', borderRadius: 12, padding: 12 }}><div style={{ color: '#8292AA', fontSize: 11, fontWeight: 850 }}>{label}</div><strong style={{ display: 'block', marginTop: 5, fontSize: 18 }}>{value}</strong></div>)}
            </div>
          </Panel>

          <Panel title="What Mark gets from the pilot" eyebrow="3–5 LIVE DEALS">
            <List items={[
              'A consistent first-pass screen before spending partner time.',
              'A red-team layer that challenges founder claims and financial presentation.',
              'Management questions ranked around what can actually change the decision.',
              'A diligence-room request list tailored to the deal instead of a generic checklist.',
              'An editable investment memo with explicit assumptions and go/no-go conditions.',
              'A record of what Aridon found versus what the investor team found manually.',
            ]} />
          </Panel>

          <Panel title="Portfolio Intelligence" eyebrow="AFTER THE CHECK CLEARS">
            <p style={{ color: '#A9B7C9', lineHeight: 1.55, marginTop: 0 }}>The same engine can move from pre-investment screening to monthly portfolio oversight.</p>
            <List items={['Revenue vs. plan and cash runway', 'Burn, hiring and financing risk', 'Customer concentration and churn', 'Sales pipeline and conversion health', 'Competitive and regulatory developments', 'Three companies that need investor attention now']} />
          </Panel>

          <section style={{ border: '1px solid #315A52', background: 'linear-gradient(145deg,#0D2424,#0D1728)', borderRadius: 18, padding: 20 }}>
            <div style={{ color: '#8BE8C6', fontSize: 11, fontWeight: 950, letterSpacing: 1.15 }}>PILOT QUESTION</div>
            <h2 style={{ fontSize: 24, margin: '8px 0 9px' }}>Can Aridon find something worth knowing before you do?</h2>
            <p style={{ margin: 0, color: '#B9C8D7', lineHeight: 1.6 }}>Run the same live opportunities through Mark's normal process and Aridon. Compare missed risks, better questions, time saved, and decision quality. If it does not improve the work, there is no reason to buy it.</p>
          </section>
        </aside>
      </div>

      <footer style={{ borderTop: '1px solid #20314B', marginTop: 34, paddingTop: 18, color: '#7F8EA4', fontSize: 12, lineHeight: 1.5 }}>Aridon Investment Intelligence is decision-support software. It does not replace financial, legal, tax, technical, cybersecurity, or investment diligence, and it does not guarantee investment outcomes.</footer>
    </div>
  </main>;
}

const primaryButton: React.CSSProperties = { border: '1px solid #7CE0BE', background: '#8BE8C6', color: '#05120E', borderRadius: 11, padding: '11px 16px', fontWeight: 950, cursor: 'pointer', fontSize: 14 };
const secondaryButton: React.CSSProperties = { border: '1px solid #31445F', background: '#0B1728', color: '#D6DEEA', borderRadius: 10, padding: '9px 12px', fontWeight: 850, cursor: 'pointer', fontSize: 12 };
