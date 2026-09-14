'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';

type HunterType = 'buyer' | 'partner' | 'investor' | 'grant' | 'acquisition' | 'seo';

type HuntResult = {
  hunter?: string;
  target?: string;
  score?: number;
  grade?: string;
  fit?: string;
  buying_signal?: string;
  why_now?: string;
  likely_decision_maker?: string;
  recommended_offer?: string;
  next_action?: string;
  risks?: string[];
  outreach_subject?: string;
  outreach_body?: string;
  seo_angles?: string[];
  evidence?: string[];
  source_url?: string;
  source_status?: string;
  mode?: string;
  error?: string;
};

const hunters: { id: HunterType; name: string; icon: string; mission: string; example: string }[] = [
  { id: 'buyer', name: 'Buyer Hunter', icon: '◎', mission: 'Find companies showing a real problem, urgency or buying signal.', example: 'Utilities, food companies, banks, data centers, manufacturers' },
  { id: 'partner', name: 'Partner Hunter', icon: '◇', mission: 'Find organizations that can help Aridon distribute, validate or deliver.', example: 'Universities, NGOs, manufacturers, integrators, associations' },
  { id: 'investor', name: 'Investor Hunter', icon: '↗', mission: 'Score investor and sponsor mandate fit without pretending interest exists.', example: 'Family offices, infrastructure funds, climate-tech investors' },
  { id: 'grant', name: 'Grant Hunter', icon: '$', mission: 'Screen funding programs for fit, missing eligibility facts and next steps.', example: 'Water, agriculture, resilience, energy and manufacturing programs' },
  { id: 'acquisition', name: 'Acquisition Hunter', icon: '▦', mission: 'Triage businesses for cash flow, diligence risk and strategic fit.', example: 'Broker listings, distressed operators, strategic bolt-ons' },
  { id: 'seo', name: 'SEO Publisher', icon: '✦', mission: 'Turn buyer questions into useful pages that can rank in search and AI answers.', example: 'Proof-led articles, comparison pages, market briefs, FAQs' },
];

const samples: Record<HunterType, { target: string; signal: string; sourceUrl: string }> = {
  buyer: {
    target: 'Large food company regenerative agriculture program',
    signal: 'The company is measuring soil, water and biodiversity outcomes and needs scalable supplier-level resilience data and intervention planning.',
    sourceUrl: '',
  },
  partner: {
    target: 'Regional agricultural economics consultancy',
    signal: 'The firm works with growers, supply chains, sustainability programs and farm economics in water-stressed regions.',
    sourceUrl: '',
  },
  investor: {
    target: 'Climate and infrastructure family office',
    signal: 'The investor publicly focuses on climate resilience, infrastructure, water and scalable commercial technologies.',
    sourceUrl: '',
  },
  grant: {
    target: 'Water resilience funding program',
    signal: 'Program supports water conservation, drought resilience, infrastructure pilots and partnerships with public entities.',
    sourceUrl: '',
  },
  acquisition: {
    target: 'Multi-location service business',
    signal: '23-year operating history, two locations, recurring memberships, 17 practitioners, 20,000+ historical patients and $225K TTM adjusted EBITDA. Need asking price and earnings bridge.',
    sourceUrl: '',
  },
  seo: {
    target: 'AI business operating system for small and mid-sized companies',
    signal: 'Buyers want AI that does useful work across sales, operations, research and follow-up rather than another standalone chatbot.',
    sourceUrl: '',
  },
};

export default function RevenueEnginePage() {
  const [type, setType] = useState<HunterType>('buyer');
  const [target, setTarget] = useState(samples.buyer.target);
  const [signal, setSignal] = useState(samples.buyer.signal);
  const [sourceUrl, setSourceUrl] = useState('');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<HuntResult | null>(null);

  const selected = useMemo(() => hunters.find((h) => h.id === type) || hunters[0], [type]);

  function choose(next: HunterType) {
    setType(next);
    setTarget(samples[next].target);
    setSignal(samples[next].signal);
    setSourceUrl(samples[next].sourceUrl);
    setResult(null);
  }

  async function run() {
    setBusy(true);
    setResult(null);
    try {
      const response = await fetch('/api/revenue-engine/hunt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, target, signal, sourceUrl }),
      });
      const data = await response.json();
      setResult(data);
    } catch {
      setResult({ error: 'Unable to reach the Revenue Engine.' });
    } finally {
      setBusy(false);
    }
  }

  return (
    <main style={{ minHeight: '100vh', background: '#061018', color: '#F6FAF8', fontFamily: 'Arial, sans-serif' }}>
      <section style={{ maxWidth: 1240, margin: '0 auto', padding: '24px 20px 64px' }}>
        <nav style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <Link href="/business-os" style={{ color: '#fff', textDecoration: 'none', fontWeight: 950 }}>ARIDON · EXECUTIVE OS</Link>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <Link href="/business-os/growth-command" style={outlineButton}>Growth Command</Link>
            <Link href="/business-os/beta" style={mintButton}>Executive Workspace</Link>
          </div>
        </nav>

        <div style={{ maxWidth: 940, paddingTop: 58 }}>
          <div style={eyebrow}>ARIDON REVENUE ENGINE · V1 LIVE</div>
          <h1 style={{ fontSize: 'clamp(46px,7vw,84px)', lineHeight: .94, letterSpacing: -3, margin: '14px 0 20px' }}>Find the signal. Score the opportunity. Move.</h1>
          <p style={{ fontSize: 20, lineHeight: 1.65, color: '#B9C9C4', maxWidth: 900 }}>Six hunters feed one Eva-led revenue loop. Give Aridon a target, a market signal and optionally a public URL. It will separate evidence from inference, score fit, identify the likely buyer role, recommend the smallest credible offer, flag risk and draft the next outreach.</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(230px,1fr))', gap: 11, marginTop: 28 }}>
          {hunters.map((hunter) => {
            const active = hunter.id === type;
            return <button key={hunter.id} onClick={() => choose(hunter.id)} style={{ textAlign: 'left', border: active ? '1px solid #9EF0CF' : '1px solid #263846', background: active ? '#102B29' : '#0C1822', color: '#fff', borderRadius: 17, padding: 17, cursor: 'pointer' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}><span style={{ fontSize: 24, color: '#9EF0CF' }}>{hunter.icon}</span><span style={{ fontSize: 10, fontWeight: 950, color: active ? '#9EF0CF' : '#81939D' }}>{active ? 'ACTIVE' : 'READY'}</span></div>
              <div style={{ fontSize: 20, fontWeight: 950, marginTop: 8 }}>{hunter.name}</div>
              <div style={{ color: '#B9C9C4', lineHeight: 1.5, fontSize: 13, marginTop: 7 }}>{hunter.mission}</div>
              <div style={{ color: '#71858F', fontSize: 11, marginTop: 10 }}>{hunter.example}</div>
            </button>;
          })}
        </div>
      </section>

      <section style={{ background: '#F2F0E9', color: '#171717', padding: '68px 20px' }}>
        <div className="engine-grid" style={{ maxWidth: 1240, margin: '0 auto', display: 'grid', gridTemplateColumns: 'minmax(0,.78fr) minmax(0,1.22fr)', gap: 18 }}>
          <div>
            <div style={lightEyebrow}>RUN {selected.name.toUpperCase()}</div>
            <h2 style={sectionTitle}>Give Eva the evidence, not a scavenger hunt.</h2>
            <p style={body}>A public URL is optional. If supplied, Aridon will attempt to read it and use the source text in the score. Add a concise signal whenever you already know what matters.</p>

            <Field label="Target / company / program / topic" value={target} setValue={setTarget} multiline={false} />
            <Field label="Known signal or context" value={signal} setValue={setSignal} multiline />
            <Field label="Public source URL (optional)" value={sourceUrl} setValue={setSourceUrl} multiline={false} />

            <button onClick={run} disabled={busy || (!target.trim() && !signal.trim() && !sourceUrl.trim())} style={{ width: '100%', border: 0, borderRadius: 12, background: '#071A18', color: '#9EF0CF', padding: '15px 16px', fontWeight: 950, fontSize: 15, cursor: busy ? 'wait' : 'pointer', opacity: busy ? .65 : 1 }}>
              {busy ? `Running ${selected.name}…` : `Run ${selected.name}`}
            </button>
            <div style={{ fontSize: 11, color: '#77736A', marginTop: 10, lineHeight: 1.45 }}>Research, scoring and drafting can move automatically. Sending messages, spending money, signing agreements and other consequential actions remain under owner control.</div>
          </div>

          <div style={{ background: '#fff', border: '1px solid #D4CFC5', borderRadius: 20, padding: 20, minHeight: 620 }}>
            {!result && <EmptyState hunter={selected.name} />}
            {result?.error && <div style={{ color: '#9B2F2F', fontWeight: 850 }}>{result.error}</div>}
            {result && !result.error && <ResultPanel result={result} />}
          </div>
        </div>
      </section>

      <section style={{ background: '#0C1822', padding: '70px 20px' }}>
        <div style={{ maxWidth: 1180, margin: '0 auto' }}>
          <div style={eyebrow}>EVA DAILY REVENUE LOOP</div>
          <h2 style={{ ...sectionTitle, color: '#fff', maxWidth: 850 }}>One queue. Six hunters. No “what do you want me to do?” carousel.</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(205px,1fr))', gap: 10, marginTop: 24 }}>
            {[
              ['01', 'SCAN', 'Collect buyer, partner, investor, grant, acquisition and search signals.'],
              ['02', 'SCORE', 'Rank by evidence, urgency, strategic fit and likely value.'],
              ['03', 'DECIDE', 'Choose the smallest credible next move instead of presenting a menu.'],
              ['04', 'DRAFT', 'Prepare outreach, diligence questions, briefs or publish-ready content.'],
              ['05', 'ACT', 'Execute safe/reversible work and route consequential actions for approval.'],
              ['06', 'LEARN', 'Feed replies, wins, losses and objections back into the next score.'],
            ].map(([n, title, text]) => <article key={n} style={{ border: '1px solid #29404A', background: '#0A141C', borderRadius: 16, padding: 17 }}><div style={{ color: '#9EF0CF', fontWeight: 950, fontSize: 12 }}>{n} · {title}</div><p style={{ color: '#B9C9C4', lineHeight: 1.55, fontSize: 13 }}>{text}</p></article>)}
          </div>
        </div>
      </section>

      <style>{`@media(max-width:860px){.engine-grid{grid-template-columns:1fr !important}}`}</style>
    </main>
  );
}

function ResultPanel({ result }: { result: HuntResult }) {
  const score = result.score ?? 0;
  return <div>
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 15, alignItems: 'start', flexWrap: 'wrap' }}>
      <div><div style={{ fontSize: 11, fontWeight: 950, color: '#377763' }}>{String(result.hunter || 'HUNTER').toUpperCase()}</div><h3 style={{ margin: '6px 0 0', fontSize: 28 }}>{result.target || 'Opportunity'}</h3></div>
      <div style={{ width: 84, height: 84, borderRadius: 999, border: '8px solid #9EF0CF', display: 'grid', placeItems: 'center', background: '#071A18', color: '#fff' }}><div style={{ textAlign: 'center' }}><div style={{ fontSize: 27, fontWeight: 950, lineHeight: 1 }}>{score}</div><div style={{ fontSize: 10, color: '#9EF0CF', fontWeight: 950 }}>GRADE {result.grade}</div></div></div>
    </div>

    <Output label="Fit" value={result.fit} />
    <Output label="Strongest signal" value={result.buying_signal} />
    <Output label="Why now" value={result.why_now} />
    <Output label="Likely decision-maker role" value={result.likely_decision_maker} />
    <Output label="Recommended offer" value={result.recommended_offer} />
    <Output label="Eva next action" value={result.next_action} accent />

    {!!result.risks?.length && <ListBlock label="Risks / verification" items={result.risks} />}
    {!!result.seo_angles?.length && <ListBlock label="SEO / publishing angles" items={result.seo_angles} />}
    {!!result.evidence?.length && <ListBlock label="Evidence used" items={result.evidence} />}

    {(result.outreach_subject || result.outreach_body) && <div style={{ marginTop: 17, borderRadius: 14, background: '#071A18', color: '#fff', padding: 16 }}>
      <div style={{ color: '#9EF0CF', fontSize: 11, fontWeight: 950 }}>OUTREACH DRAFT</div>
      <div style={{ marginTop: 8, fontWeight: 950 }}>{result.outreach_subject}</div>
      <div style={{ whiteSpace: 'pre-wrap', color: '#D3DDD9', lineHeight: 1.55, fontSize: 13, marginTop: 9 }}>{result.outreach_body}</div>
    </div>}

    <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid #E6E1D8', color: '#7B766D', fontSize: 11, lineHeight: 1.5 }}>{result.source_status}{result.source_url ? ` · ${result.source_url}` : ''} · Mode: {result.mode || 'unknown'}</div>
  </div>;
}

function EmptyState({ hunter }: { hunter: string }) {
  return <div style={{ height: '100%', minHeight: 560, display: 'grid', placeItems: 'center' }}><div style={{ maxWidth: 480, textAlign: 'center' }}><div style={{ width: 62, height: 62, borderRadius: 999, background: '#E1F7ED', display: 'grid', placeItems: 'center', margin: '0 auto', fontSize: 25 }}>◎</div><h3 style={{ fontSize: 27, marginBottom: 9 }}>{hunter} is ready.</h3><p style={{ ...body, fontSize: 15 }}>Run the sample as-is, replace it with a real prospect, or paste a public source URL. Aridon will return a decision-oriented brief instead of another pile of search results.</p></div></div>;
}

function Field({ label, value, setValue, multiline }: { label: string; value: string; setValue: (value: string) => void; multiline: boolean }) {
  const shared = { width: '100%', boxSizing: 'border-box' as const, border: '1px solid #CFC8BD', borderRadius: 11, background: '#fff', color: '#171717', padding: '12px', fontSize: 14, outline: 0 };
  return <label style={{ display: 'grid', gap: 7, margin: '15px 0', fontWeight: 900, fontSize: 12 }}><span>{label}</span>{multiline ? <textarea rows={5} value={value} onChange={(e) => setValue(e.target.value)} style={{ ...shared, resize: 'vertical' }} /> : <input value={value} onChange={(e) => setValue(e.target.value)} style={shared} />}</label>;
}

function Output({ label, value, accent = false }: { label: string; value?: string; accent?: boolean }) {
  if (!value) return null;
  return <div style={{ borderTop: '1px solid #E6E1D8', padding: '12px 0' }}><div style={{ color: accent ? '#1D7259' : '#79736A', fontSize: 10, fontWeight: 950 }}>{label.toUpperCase()}</div><div style={{ lineHeight: 1.55, marginTop: 5, fontWeight: accent ? 800 : 500 }}>{value}</div></div>;
}

function ListBlock({ label, items }: { label: string; items: string[] }) {
  return <div style={{ borderTop: '1px solid #E6E1D8', padding: '12px 0' }}><div style={{ color: '#79736A', fontSize: 10, fontWeight: 950 }}>{label.toUpperCase()}</div>{items.map((item, index) => <div key={`${item}-${index}`} style={{ lineHeight: 1.5, marginTop: 6, fontSize: 13 }}>• {item}</div>)}</div>;
}

const eyebrow = { fontSize: 12, fontWeight: 950, color: '#9EF0CF', letterSpacing: 1 };
const lightEyebrow = { fontSize: 12, fontWeight: 950, color: '#27644F', letterSpacing: 1 };
const sectionTitle = { fontSize: 'clamp(36px,5vw,58px)', lineHeight: 1, letterSpacing: -2, margin: '10px 0 14px' };
const body = { color: '#5D5951', lineHeight: 1.65 };
const mintButton = { display: 'inline-block', background: '#9EF0CF', color: '#07130F', padding: '12px 16px', borderRadius: 11, textDecoration: 'none', fontWeight: 950 };
const outlineButton = { display: 'inline-block', border: '1px solid #52627A', color: '#F7FAFC', padding: '11px 15px', borderRadius: 11, textDecoration: 'none', fontWeight: 900 };
