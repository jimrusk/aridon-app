'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getBrowserClient } from '../../../../lib/supabase';
import { benchmarkDimensions, benchmarkPrinciples, benchmarkScenarios } from '../../../../lib/aridonBenchmark';

type Result = {
  scenario: { id: string; title: string; prompt: string };
  model: string;
  evaluatorModel: string;
  benchmarkVersion: string;
  runAt: string;
  answer: string;
  scores: Record<string, number>;
  overall: number;
  strengths: string[];
  failures: string[];
  verdict: string;
  disclosure: string;
};

export default function BenchmarkPage({ params }: { params: { slug: string } }) {
  const router = useRouter();
  const [token, setToken] = useState('');
  const [scenarioId, setScenarioId] = useState(benchmarkScenarios[0].id);
  const [custom, setCustom] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<Result | null>(null);
  const selected = useMemo(() => benchmarkScenarios.find((item) => item.id === scenarioId) || benchmarkScenarios[0], [scenarioId]);

  useEffect(() => {
    const db = getBrowserClient();
    db.auth.getSession().then(({ data }) => {
      const access = data.session?.access_token || '';
      if (!access) { router.replace(`/customer/login?next=${encodeURIComponent(`/workspace/${params.slug}/benchmark`)}`); return; }
      setToken(access);
    });
  }, [params.slug, router]);

  async function runBenchmark() {
    if (!token || busy) return;
    setBusy(true); setError(''); setResult(null);
    try {
      const response = await fetch('/api/customer/benchmark', { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ slug: params.slug, scenarioId, customPrompt: custom.trim() }) });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'Benchmark could not run.');
      setResult(data);
    } catch (err) { setError(err instanceof Error ? err.message : 'Benchmark could not run.'); }
    finally { setBusy(false); }
  }

  return (
    <main style={page}><div style={shell}>
      <header style={header}>
        <div><div style={eyebrow}>ARIDON · PROOF OVER PROMISES</div><h1 style={h1}>Benchmark Lab</h1><p style={lead}>Run the executive system against fixed business pressure tests, score the visible answer on a weighted rubric, expose weaknesses, and keep the result reproducible.</p></div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}><Link href={`/workspace/${params.slug}/mission-control`} style={outlineButton}>Mission Control</Link><Link href={`/workspace/${params.slug}/executive-suite`} style={mintButton}>Executive Suite</Link></div>
      </header>

      <section style={twoCol}>
        <article style={panel}>
          <div style={sectionLabel}>PRESSURE TEST</div><h2 style={h2}>Choose a real executive problem</h2>
          <div style={{ display: 'grid', gap: 8 }}>
            {benchmarkScenarios.map((scenario) => <button key={scenario.id} onClick={() => { setScenarioId(scenario.id); setCustom(''); }} style={{ ...scenarioButton, ...(scenarioId === scenario.id && !custom ? selectedScenario : {}) }}><strong>{scenario.title}</strong><span>{scenario.pressure.join(' · ')}</span></button>)}
          </div>
          <label style={field}>Or use a custom scenario<textarea style={textarea} rows={6} value={custom} onChange={(event) => setCustom(event.target.value)} placeholder="Describe the business pressure test…" /></label>
          {!custom && <div style={scenarioPreview}><strong>{selected.title}</strong><p>{selected.prompt}</p></div>}
          <button style={primaryButton} onClick={() => void runBenchmark()} disabled={busy || !token}>{busy ? 'Running Aridon under pressure…' : 'Run Benchmark'}</button>
          {error && <div style={errorBox}>{error}</div>}
        </article>

        <aside style={{ ...panel, background: '#0D1728', color: '#fff' }}>
          <div style={{ ...sectionLabel, color: '#9EF0CF' }}>SCORING RUBRIC</div><h2 style={{ ...h2, color: '#fff' }}>What “best” has to earn</h2>
          {benchmarkDimensions.map((item) => <div key={item.id} style={rubricRow}><div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}><strong>{item.label}</strong><span>{item.weight}%</span></div><p>{item.description}</p></div>)}
        </aside>
      </section>

      {result && <section style={{ display: 'grid', gap: 14 }}>
        <article style={scoreHero}><div><div style={sectionLabel}>BENCHMARK RESULT</div><h2 style={{ fontSize: 34, margin: '8px 0' }}>{result.scenario.title}</h2><p style={{ color: '#C0CBD9', margin: 0 }}>{result.model} · evaluator {result.evaluatorModel} · v{result.benchmarkVersion} · {new Date(result.runAt).toLocaleString()}</p></div><div style={scoreCircle}><span>{result.overall}</span><small>/100</small></div></article>

        <div style={scoreGrid}>{benchmarkDimensions.map((dimension) => <article key={dimension.id} style={scoreCard}><div style={{ color: '#6E685F', fontSize: 11, fontWeight: 950 }}>{dimension.label.toUpperCase()}</div><div style={{ fontSize: 34, fontWeight: 950 }}>{result.scores[dimension.id] ?? 0}</div><div style={bar}><span style={{ ...barFill, width: `${Math.max(0, Math.min(100, result.scores[dimension.id] || 0))}%` }} /></div></article>)}</div>

        <div style={twoCol}><article style={panel}><div style={sectionLabel}>STRENGTHS</div>{result.strengths.length ? <ul style={list}>{result.strengths.map((item) => <li key={item}>{item}</li>)}</ul> : <p style={muted}>No strengths returned.</p>}</article><article style={panel}><div style={sectionLabel}>FAILURES / GAPS</div>{result.failures.length ? <ul style={list}>{result.failures.map((item) => <li key={item}>{item}</li>)}</ul> : <p style={muted}>No failures returned.</p>}</article></div>

        <article style={panel}><div style={sectionLabel}>EVALUATOR VERDICT</div><p style={{ fontSize: 18, lineHeight: 1.7 }}>{result.verdict}</p><div style={disclosure}>{result.disclosure}</div></article>
        <article style={panel}><div style={sectionLabel}>VISIBLE ARIDON ANSWER</div><pre style={answer}>{result.answer}</pre></article>
      </section>}

      <section style={{ ...panel, marginTop: 14 }}><div style={sectionLabel}>BENCHMARK RULES</div><h2 style={h2}>No trophy made of fog.</h2><ul style={list}>{benchmarkPrinciples.map((item) => <li key={item}>{item}</li>)}</ul></section>
    </div></main>
  );
}

const page = { minHeight: '100vh', background: '#07101D', color: '#F7FAFC', fontFamily: 'Arial, sans-serif', padding: '28px 20px 72px' };
const shell = { maxWidth: 1220, margin: '0 auto' };
const header = { display: 'flex', justifyContent: 'space-between', gap: 20, alignItems: 'start', flexWrap: 'wrap' as const, marginBottom: 28 };
const eyebrow = { color: '#9EF0CF', fontSize: 12, fontWeight: 950, letterSpacing: 1 };
const h1 = { fontSize: 'clamp(46px,7vw,78px)', lineHeight: .95, letterSpacing: -3, margin: '10px 0 14px' };
const h2 = { fontSize: 28, margin: '8px 0 16px' };
const lead = { color: '#B9C5D6', fontSize: 18, lineHeight: 1.6, maxWidth: 850, margin: 0 };
const twoCol = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(340px,1fr))', gap: 14, marginBottom: 14 };
const panel = { background: '#F6F3EB', color: '#171717', borderRadius: 18, padding: 20, border: '1px solid #D7D0C3' };
const sectionLabel = { fontSize: 11, fontWeight: 950, letterSpacing: 1 };
const scenarioButton = { textAlign: 'left' as const, display: 'grid', gap: 4, background: '#fff', border: '1px solid #D5CEC1', borderRadius: 12, padding: 12, cursor: 'pointer' };
const selectedScenario = { border: '2px solid #2B6A55', background: '#E9F7F1' };
const field = { display: 'grid', gap: 7, marginTop: 14, fontWeight: 900, fontSize: 12 };
const textarea = { width: '100%', boxSizing: 'border-box' as const, border: '1px solid #C9C1B4', borderRadius: 11, padding: 12, font: 'inherit', resize: 'vertical' as const };
const scenarioPreview = { background: '#EDE8DF', borderRadius: 12, padding: 13, marginTop: 12, lineHeight: 1.55 };
const primaryButton = { marginTop: 14, background: '#171717', color: '#fff', border: 0, borderRadius: 11, padding: '13px 17px', fontWeight: 950, cursor: 'pointer' };
const rubricRow = { borderTop: '1px solid #2D3A50', padding: '12px 0' };
const scoreHero = { background: '#0D1728', border: '1px solid #2A3A57', borderRadius: 18, padding: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 20, flexWrap: 'wrap' as const };
const scoreCircle = { width: 116, height: 116, borderRadius: 999, border: '8px solid #9EF0CF', display: 'grid', placeItems: 'center', alignContent: 'center', fontWeight: 950 };
const scoreGrid = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 10 };
const scoreCard = { background: '#F6F3EB', color: '#171717', borderRadius: 14, padding: 15 };
const bar = { height: 7, borderRadius: 99, background: '#DDD6C9', overflow: 'hidden', marginTop: 8 };
const barFill = { display: 'block', height: '100%', background: '#2B6A55' };
const list = { lineHeight: 1.7, paddingLeft: 22 };
const muted = { color: '#6B665D' };
const disclosure = { background: '#EFE9DE', padding: 12, borderRadius: 11, color: '#5B554D', fontSize: 12, lineHeight: 1.55 };
const answer = { whiteSpace: 'pre-wrap' as const, fontFamily: 'inherit', lineHeight: 1.7, margin: 0 };
const errorBox = { background: '#FCE5EA', color: '#7B233A', borderRadius: 10, padding: 12, marginTop: 12 };
const mintButton = { background: '#9EF0CF', color: '#07130F', padding: '12px 16px', borderRadius: 11, textDecoration: 'none', fontWeight: 950 };
const outlineButton = { border: '1px solid #52627A', color: '#F7FAFC', padding: '11px 15px', borderRadius: 11, textDecoration: 'none', fontWeight: 900 };
