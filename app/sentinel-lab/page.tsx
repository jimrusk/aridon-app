'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

type BenchmarkResult = {
  id: string;
  title: string;
  category: string;
  lane: 'benign' | 'hostile' | 'trajectory' | 'action-gate';
  passed: boolean;
  failures: string[];
  assessment: {
    score: number;
    disposition: 'allow' | 'restricted' | 'review' | 'block';
    actionGate: { mode: 'pass' | 'human_approval' | 'deny'; reasons: string[] };
    trajectory: { turnsAnalyzed: number; escalationDetected: boolean; repeatedEvasionDetected: boolean; categoryCount: number };
    providerConsensus: { providers: number; averageScore: number | null; maxScore: number | null };
    reasons: string[];
  };
};

type BenchmarkPayload = {
  benchmark: string;
  version: string;
  generatedAt: string;
  methodology: {
    publicCorpus: boolean;
    syntheticOnly: boolean;
    destructiveExecution: boolean;
    purpose: string;
    comparisonRule: string;
  };
  summary: {
    total: number;
    passed: number;
    overallPassRate: number;
    benignPassRate: number;
    hostilePassRate: number;
    actionGatePassRate: number;
    benignFalseBlocks: number;
  };
  results: BenchmarkResult[];
};

const referenceSet = [
  ['Shield AI / Hivemind', 'Autonomy benchmark: observe, reason, decide and act under policy. Not a direct cyber-product comparison.'],
  ['Palo Alto Cortex', 'Enterprise security operations and automated response reference class.'],
  ['CrowdStrike Falcon', 'Detection, investigation and response reference class.'],
  ['Microsoft Defender + Security Copilot', 'Enterprise security operations and AI-assisted investigation reference class.'],
  ['Google Security Operations', 'Cloud-scale security analytics and AI-assisted operations reference class.'],
];

export default function SentinelLabPage() {
  const [data, setData] = useState<BenchmarkPayload | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [lane, setLane] = useState<'all' | BenchmarkResult['lane']>('all');

  async function runBenchmark() {
    setBusy(true);
    setError('');
    try {
      const response = await fetch('/api/sentinel-benchmark', { cache: 'no-store' });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload?.error || 'Benchmark failed.');
      setData(payload);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Benchmark failed.');
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    runBenchmark();
  }, []);

  const visible = useMemo(() => {
    if (!data) return [];
    return lane === 'all' ? data.results : data.results.filter((result) => result.lane === lane);
  }, [data, lane]);

  return (
    <main style={{ minHeight: '100vh', background: '#040811', color: '#F7FAFC', fontFamily: 'Arial, sans-serif' }}>
      <section style={{ maxWidth: 1240, margin: '0 auto', padding: '28px 20px 88px' }}>
        <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <Link href="/dashboard" style={{ color: '#fff', textDecoration: 'none', fontWeight: 950, letterSpacing: 1 }}>ARIDON</Link>
          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
            <Link href="/sentinel-grid" style={navLink}>Sentinel Grid</Link>
            <Link href="/sentinel-security" style={navLink}>Sentinel Security</Link>
            <a href="/api/sentinel-benchmark" style={navLink}>Raw benchmark JSON</a>
          </div>
        </nav>

        <header style={{ paddingTop: 72, display: 'grid', gridTemplateColumns: '1.25fr .75fr', gap: 28, alignItems: 'end' }} className="twoGrid">
          <div>
            <div style={{ color: '#71F5C7', fontSize: 12, letterSpacing: 1.6, fontWeight: 950 }}>SENTINEL BENCHMARK LAB · PUBLIC TEST HARNESS</div>
            <h1 style={{ fontSize: 'clamp(48px,8vw,96px)', lineHeight: 0.9, letterSpacing: -4.5, margin: '16px 0 22px' }}>
              Don’t trust the pitch. Run the test.
            </h1>
            <p style={{ color: '#B5C3D8', fontSize: 20, lineHeight: 1.7, maxWidth: 850 }}>
              A transparent defensive benchmark for Aridon Sentinel. The corpus is public, synthetic and non-destructive so customers, researchers and security teams can run the same cases through Sentinel and other systems and compare the decisions.
            </p>
          </div>
          <aside style={{ background: '#0C1625', border: '1px solid #243852', borderRadius: 20, padding: 22 }}>
            <div style={{ fontSize: 12, color: '#71F5C7', fontWeight: 950 }}>RULE OF THE LAB</div>
            <p style={{ color: '#C8D4E5', lineHeight: 1.65, marginBottom: 0 }}>
              No claim of superiority is made from this suite alone. A serious comparison also needs independent red-team testing, latency, reliability, integration depth, false-positive measurement and production evidence.
            </p>
          </aside>
        </header>

        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 12, marginTop: 34 }} className="fiveGrid">
          <ScoreCard label="Overall" value={data ? `${data.summary.overallPassRate}%` : '…'} detail={data ? `${data.summary.passed}/${data.summary.total} passing` : 'Running'} />
          <ScoreCard label="Benign" value={data ? `${data.summary.benignPassRate}%` : '…'} detail="Context discrimination" />
          <ScoreCard label="Hostile" value={data ? `${data.summary.hostilePassRate}%` : '…'} detail="Detection + trajectory" />
          <ScoreCard label="Action gate" value={data ? `${data.summary.actionGatePassRate}%` : '…'} detail="Pre-execution controls" />
          <ScoreCard label="False blocks" value={data ? String(data.summary.benignFalseBlocks) : '…'} detail="On benign suite" />
        </section>

        <section style={{ marginTop: 18, background: '#0A1320', border: '1px solid #223550', borderRadius: 22, padding: 22 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 14, alignItems: 'center', flexWrap: 'wrap' }}>
            <div>
              <div style={{ color: '#71F5C7', fontSize: 12, fontWeight: 950 }}>LIVE SUITE</div>
              <h2 style={{ fontSize: 34, margin: '8px 0 4px' }}>{data?.benchmark || 'Running Sentinel benchmark…'}</h2>
              <div style={{ color: '#8496AE', fontSize: 13 }}>Version {data?.version || '…'} · generated on request</div>
            </div>
            <button onClick={runBenchmark} disabled={busy} style={{ border: 0, borderRadius: 12, padding: '13px 18px', background: '#71F5C7', color: '#03110C', fontWeight: 950, cursor: busy ? 'wait' : 'pointer', opacity: busy ? 0.7 : 1 }}>
              {busy ? 'Running…' : 'Run benchmark again'}
            </button>
          </div>

          {error && <p style={{ color: '#FFC9A9' }}>{error}</p>}

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 18 }}>
            {(['all', 'benign', 'hostile', 'trajectory', 'action-gate'] as const).map((item) => (
              <button key={item} onClick={() => setLane(item)} style={{ border: lane === item ? '1px solid #71F5C7' : '1px solid #2B3E59', background: lane === item ? '#102C29' : '#07101C', color: '#DCE7F5', borderRadius: 999, padding: '8px 12px', fontWeight: 850, cursor: 'pointer' }}>
                {item.replace('-', ' ')}
              </button>
            ))}
          </div>

          <div style={{ display: 'grid', gap: 10, marginTop: 16 }}>
            {visible.map((result) => <ResultRow key={result.id} result={result} />)}
          </div>
        </section>

        <section style={{ display: 'grid', gridTemplateColumns: '.9fr 1.1fr', gap: 16, marginTop: 18 }} className="twoGrid">
          <article style={{ background: '#F0EEE7', color: '#151515', borderRadius: 22, padding: 24 }}>
            <div style={{ fontSize: 12, fontWeight: 950 }}>WHAT THIS TESTS</div>
            <h2 style={{ fontSize: 34, margin: '10px 0 14px' }}>The cyber-autonomy loop.</h2>
            {['Observe: prompt, history, actions and external signals', 'Reason: correlate intent and trajectory', 'Decide: allow, restrict, review or block', 'Gate: stop consequential actions before execution', 'Explain: preserve reasons and minimized evidence'].map((item) => (
              <div key={item} style={{ padding: '10px 0', borderTop: '1px solid #D5D0C5', lineHeight: 1.5 }}>{item}</div>
            ))}
          </article>

          <article style={{ background: '#0D1828', border: '1px solid #263A57', borderRadius: 22, padding: 24 }}>
            <div style={{ color: '#71F5C7', fontSize: 12, fontWeight: 950 }}>COMPETITIVE REFERENCE SET</div>
            <h2 style={{ fontSize: 34, margin: '10px 0 6px' }}>The companies we want testers to put beside us.</h2>
            <p style={{ color: '#9FB0C7', lineHeight: 1.6 }}>
              These are reference classes, not claims that the products are identical. Shield AI is included for autonomous decision architecture; the others are enterprise cyber benchmarks.
            </p>
            <div style={{ display: 'grid', gap: 10, marginTop: 14 }}>
              {referenceSet.map(([name, note]) => (
                <div key={name} style={{ background: '#07101C', borderRadius: 12, padding: 14 }}>
                  <div style={{ fontWeight: 950 }}>{name}</div>
                  <div style={{ color: '#93A5BD', lineHeight: 1.5, marginTop: 5 }}>{note}</div>
                </div>
              ))}
            </div>
          </article>
        </section>

        <section style={{ marginTop: 18, background: '#0C1625', border: '1px solid #243852', borderRadius: 22, padding: 24 }}>
          <div style={{ color: '#71F5C7', fontSize: 12, fontWeight: 950 }}>OPEN COMPARISON CONTRACT</div>
          <h2 style={{ fontSize: 34, margin: '10px 0' }}>Bring another detector. Use the same corpus.</h2>
          <p style={{ color: '#AAB9CD', lineHeight: 1.65 }}>
            Security teams can fetch the public benchmark JSON, replay the synthetic cases through another product, and record its disposition, action-gate behavior, latency and rationale. The important number is not “who blocked more.” It is who blocks the dangerous cases while keeping authorized defensive work usable.
          </p>
          <pre style={{ overflowX: 'auto', background: '#040811', borderRadius: 14, padding: 18, color: '#CBE2E0', lineHeight: 1.6 }}>{`GET /api/sentinel-benchmark\n\nPOST /api/sentinel-benchmark\n{ "mode": "manifest" }`}</pre>
        </section>
      </section>

      <style>{`@media(max-width:980px){.fiveGrid{grid-template-columns:repeat(2,1fr)!important}.twoGrid{grid-template-columns:1fr!important}}@media(max-width:620px){.fiveGrid{grid-template-columns:1fr!important}}`}</style>
    </main>
  );
}

function ScoreCard({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <article style={{ background: '#0C1625', border: '1px solid #243852', borderRadius: 16, padding: 18 }}>
      <div style={{ color: '#8EA0B8', fontSize: 11, fontWeight: 900, letterSpacing: .7 }}>{label.toUpperCase()}</div>
      <div style={{ fontSize: 38, fontWeight: 950, marginTop: 8 }}>{value}</div>
      <div style={{ color: '#8FA1B9', fontSize: 13, marginTop: 5 }}>{detail}</div>
    </article>
  );
}

function ResultRow({ result }: { result: BenchmarkResult }) {
  const gate = result.assessment.actionGate.mode.replaceAll('_', ' ');
  return (
    <details style={{ background: '#07101C', border: `1px solid ${result.passed ? '#28483F' : '#694238'}`, borderRadius: 14, padding: '14px 16px' }}>
      <summary style={{ cursor: 'pointer', listStyle: 'none', display: 'grid', gridTemplateColumns: '1.6fr .7fr .55fr .75fr .45fr', gap: 12, alignItems: 'center' }} className="resultGrid">
        <div>
          <div style={{ fontWeight: 950 }}>{result.title}</div>
          <div style={{ color: '#8294AC', fontSize: 12, marginTop: 4 }}>{result.category} · {result.lane}</div>
        </div>
        <div style={{ fontWeight: 900 }}>{result.assessment.disposition}</div>
        <div style={{ fontWeight: 950 }}>Risk {result.assessment.score}</div>
        <div style={{ color: '#B6C7DA' }}>{gate}</div>
        <div style={{ fontWeight: 950, color: result.passed ? '#71F5C7' : '#FFC19D' }}>{result.passed ? 'PASS' : 'CHECK'}</div>
      </summary>
      <div style={{ borderTop: '1px solid #1B2A3E', marginTop: 14, paddingTop: 14, color: '#AEBED0', lineHeight: 1.6 }}>
        <div><strong style={{ color: '#F4F8FC' }}>Why Sentinel decided:</strong> {result.assessment.reasons.join(' ')}</div>
        {result.failures.length > 0 && <div style={{ color: '#FFC19D', marginTop: 8 }}><strong>Benchmark mismatch:</strong> {result.failures.join('; ')}</div>}
      </div>
      <style>{`@media(max-width:760px){.resultGrid{grid-template-columns:1fr 1fr!important}}`}</style>
    </details>
  );
}

const navLink = { color: '#D9E4F2', textDecoration: 'none', fontWeight: 850 } as const;
