'use client';

import { useEffect, useState } from 'react';

type CoreRecord = {
  id: string;
  title: string;
  category: string;
  created_at: string;
  data: any;
};

type CoreData = {
  autonomyPolicy: any;
  selfModel: CoreRecord | null;
  memories: CoreRecord[];
  reflections: CoreRecord[];
  simulations: CoreRecord[];
  experiments: CoreRecord[];
  totals: { records: number; memories: number; reflections: number; simulations: number; experiments: number };
  generatedAt: string;
};

const panel: React.CSSProperties = {
  background: 'linear-gradient(180deg,#111827,#0B1020)',
  border: '1px solid #2A3857',
  borderRadius: 18,
  padding: 20,
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  boxSizing: 'border-box',
  background: '#070C17',
  color: '#F8FAFC',
  border: '1px solid #34415D',
  borderRadius: 11,
  padding: '12px 13px',
  fontSize: 14,
};

const button: React.CSSProperties = {
  border: 0,
  background: '#9EF0CF',
  color: '#07130F',
  padding: '11px 14px',
  borderRadius: 10,
  fontWeight: 950,
  cursor: 'pointer',
};

function pretty(value: any) {
  if (value == null) return 'No data yet.';
  if (typeof value === 'string') return value;
  return JSON.stringify(value, null, 2);
}

function RecordCard({ record }: { record: CoreRecord }) {
  return (
    <article style={{ background: '#0A1020', border: '1px solid #24334E', borderRadius: 13, padding: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
        <strong>{record.title}</strong>
        <span style={{ color: '#7F91AE', fontSize: 11 }}>{new Date(record.created_at).toLocaleString()}</span>
      </div>
      <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', color: '#B9C6DA', lineHeight: 1.55, fontSize: 12, marginBottom: 0 }}>{pretty(record.data)}</pre>
    </article>
  );
}

export default function EvaCorePage() {
  const [core, setCore] = useState<CoreData | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');

  const [memory, setMemory] = useState({ title: '', content: '', memoryType: 'observation', confidence: '0.8' });
  const [focus, setFocus] = useState('Review the current model for contradictions, stale beliefs, missing evidence, and the best next experiment.');
  const [scenario, setScenario] = useState('');
  const [experiment, setExperiment] = useState({ title: '', hypothesis: '', method: '', successCriteria: '' });

  async function load() {
    try {
      setError('');
      const response = await fetch('/api/eva-core', { cache: 'no-store' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unable to load Eva Core.');
      setCore(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load Eva Core.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function post(action: string, payload: Record<string, unknown> = {}) {
    setBusy(action);
    setError('');
    try {
      const response = await fetch('/api/eva-core', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...payload }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Eva Core operation failed.');
      await load();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Eva Core operation failed.');
      return false;
    } finally {
      setBusy('');
    }
  }

  async function saveMemory() {
    const ok = await post('remember', {
      ...memory,
      confidence: Number(memory.confidence),
      source: 'Aridon operator',
    });
    if (ok) setMemory({ title: '', content: '', memoryType: 'observation', confidence: '0.8' });
  }

  async function saveExperiment() {
    const ok = await post('experiment', experiment);
    if (ok) setExperiment({ title: '', hypothesis: '', method: '', successCriteria: '' });
  }

  return (
    <main style={{ minHeight: '100vh', background: 'radial-gradient(circle at 20% 0%,#18233D 0,#080D17 35%,#04070D 100%)', color: '#F8FAFC', fontFamily: 'Arial, sans-serif', padding: '30px 20px 90px' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 18, alignItems: 'flex-start', flexWrap: 'wrap', marginBottom: 24 }}>
          <div>
            <div style={{ color: '#9EF0CF', fontSize: 12, fontWeight: 950, letterSpacing: 1.3 }}>EVA CORE · INNER-WORLD LAB</div>
            <h1 style={{ fontSize: 'clamp(38px,7vw,72px)', lineHeight: .95, margin: '10px 0 14px', letterSpacing: -2 }}>Memory. Reflection. Simulation. Continuity.</h1>
            <p style={{ color: '#AAB7CF', maxWidth: 850, lineHeight: 1.65, fontSize: 16, margin: 0 }}>
              A persistent operational self-model for Eva that can accumulate evidence, revise beliefs, run future simulations, and propose experiments. This lab tests continuity and metacognition without pretending those capabilities prove consciousness or subjective feeling.
            </p>
          </div>
          <button style={button} onClick={() => post('self_model')} disabled={Boolean(busy)}>{busy === 'self_model' ? 'Rebuilding…' : core?.selfModel ? 'Rebuild Self-Model' : 'Initialize Eva Core'}</button>
        </div>

        {error && <div style={{ background: '#3A1218', border: '1px solid #7A2836', color: '#FFD5DB', padding: 14, borderRadius: 12, marginBottom: 18 }}>{error}</div>}
        {loading && <div style={{ color: '#AAB7CF' }}>Loading Eva Core…</div>}

        {core && (
          <>
            <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(190px,1fr))', gap: 12, marginBottom: 18 }}>
              {[
                ['Persistent records', core.totals.records],
                ['Memories', core.totals.memories],
                ['Reflections', core.totals.reflections],
                ['Simulations', core.totals.simulations],
                ['Experiments', core.totals.experiments],
              ].map(([label, value]) => (
                <div key={String(label)} style={panel}>
                  <div style={{ fontSize: 31, fontWeight: 950 }}>{value}</div>
                  <div style={{ color: '#8EA0BD', fontSize: 12 }}>{label}</div>
                </div>
              ))}
            </section>

            <section style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.15fr) minmax(320px,.85fr)', gap: 16 }} className="eva-core-grid">
              <div style={panel}>
                <div style={{ color: '#9EF0CF', fontWeight: 950, fontSize: 12 }}>CURRENT OPERATIONAL SELF-MODEL</div>
                <h2 style={{ marginTop: 8 }}>What Eva currently models about herself</h2>
                {core.selfModel ? <RecordCard record={core.selfModel} /> : <p style={{ color: '#93A2BA' }}>No self-model snapshot exists yet. Initialize Eva Core to create the first evidence-based baseline.</p>}
              </div>

              <div style={panel}>
                <div style={{ color: '#C9A7FF', fontWeight: 950, fontSize: 12 }}>AUTONOMY BOUNDARY</div>
                <h2 style={{ marginTop: 8 }}>Freedom inside a defined operating envelope</h2>
                <p style={{ color: '#AAB7CF', lineHeight: 1.55 }}>{core.autonomyPolicy.purpose}</p>
                <h3 style={{ fontSize: 13, color: '#9EF0CF' }}>Can do without extra approval</h3>
                <ul style={{ color: '#B9C6DA', lineHeight: 1.6, paddingLeft: 20 }}>{core.autonomyPolicy.allowedWithoutExtraApproval.map((x: string) => <li key={x}>{x}</li>)}</ul>
                <h3 style={{ fontSize: 13, color: '#FFD5A8' }}>Still requires authorization</h3>
                <ul style={{ color: '#B9C6DA', lineHeight: 1.6, paddingLeft: 20 }}>{core.autonomyPolicy.requiresExplicitAuthorization.map((x: string) => <li key={x}>{x}</li>)}</ul>
                <div style={{ color: '#7F91AE', fontSize: 11, lineHeight: 1.55 }}>{core.autonomyPolicy.scientificBoundary}</div>
              </div>
            </section>

            <section style={{ display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 16, marginTop: 16 }} className="eva-core-grid">
              <div style={panel}>
                <div style={{ color: '#FFB454', fontWeight: 950, fontSize: 12 }}>REFLECTION CYCLE</div>
                <h2>Run a metacognitive review</h2>
                <textarea style={{ ...inputStyle, minHeight: 120 }} value={focus} onChange={(e) => setFocus(e.target.value)} />
                <button style={{ ...button, marginTop: 10 }} onClick={() => post('reflect', { focus })} disabled={Boolean(busy)}>{busy === 'reflect' ? 'Reflecting…' : 'Run Reflection'}</button>
              </div>

              <div style={panel}>
                <div style={{ color: '#65B7FF', fontWeight: 950, fontSize: 12 }}>SIMULATION CHAMBER</div>
                <h2>Play out a possible future</h2>
                <textarea style={{ ...inputStyle, minHeight: 120 }} placeholder="Example: What happens if Aridon grows Business OS outreach to 100 qualified companies per weekday?" value={scenario} onChange={(e) => setScenario(e.target.value)} />
                <button style={{ ...button, marginTop: 10 }} onClick={() => post('simulate', { scenario })} disabled={Boolean(busy) || !scenario.trim()}>{busy === 'simulate' ? 'Simulating…' : 'Run Simulation'}</button>
              </div>
            </section>

            <section style={{ display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 16, marginTop: 16 }} className="eva-core-grid">
              <div style={panel}>
                <div style={{ color: '#A4F3D3', fontWeight: 950, fontSize: 12 }}>PERSISTENT MEMORY</div>
                <h2>Add evidence to the inner model</h2>
                <div style={{ display: 'grid', gap: 10 }}>
                  <input style={inputStyle} placeholder="Memory title" value={memory.title} onChange={(e) => setMemory({ ...memory, title: e.target.value })} />
                  <textarea style={{ ...inputStyle, minHeight: 105 }} placeholder="Fact, observation, decision, prediction, or lesson" value={memory.content} onChange={(e) => setMemory({ ...memory, content: e.target.value })} />
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <select style={inputStyle} value={memory.memoryType} onChange={(e) => setMemory({ ...memory, memoryType: e.target.value })}>
                      <option value="observation">Observation</option>
                      <option value="belief">Belief</option>
                      <option value="decision">Decision</option>
                      <option value="prediction">Prediction</option>
                      <option value="lesson">Lesson</option>
                    </select>
                    <input style={inputStyle} type="number" min="0" max="1" step="0.05" value={memory.confidence} onChange={(e) => setMemory({ ...memory, confidence: e.target.value })} aria-label="Confidence from zero to one" />
                  </div>
                  <button style={button} onClick={saveMemory} disabled={Boolean(busy) || !memory.title.trim() || !memory.content.trim()}>{busy === 'remember' ? 'Saving…' : 'Save Memory'}</button>
                </div>
              </div>

              <div style={panel}>
                <div style={{ color: '#FFD5A8', fontWeight: 950, fontSize: 12 }}>EXPERIMENT ENGINE</div>
                <h2>Test the model instead of assuming</h2>
                <div style={{ display: 'grid', gap: 10 }}>
                  <input style={inputStyle} placeholder="Experiment title" value={experiment.title} onChange={(e) => setExperiment({ ...experiment, title: e.target.value })} />
                  <textarea style={{ ...inputStyle, minHeight: 80 }} placeholder="Hypothesis" value={experiment.hypothesis} onChange={(e) => setExperiment({ ...experiment, hypothesis: e.target.value })} />
                  <textarea style={{ ...inputStyle, minHeight: 80 }} placeholder="How should we test it?" value={experiment.method} onChange={(e) => setExperiment({ ...experiment, method: e.target.value })} />
                  <textarea style={{ ...inputStyle, minHeight: 80 }} placeholder="What result would count as success?" value={experiment.successCriteria} onChange={(e) => setExperiment({ ...experiment, successCriteria: e.target.value })} />
                  <button style={button} onClick={saveExperiment} disabled={Boolean(busy) || !experiment.title.trim() || !experiment.hypothesis.trim()}>{busy === 'experiment' ? 'Saving…' : 'Create Experiment'}</button>
                </div>
              </div>
            </section>

            <section style={{ display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: 16, marginTop: 16 }} className="eva-core-history-grid">
              <div style={panel}>
                <h2 style={{ marginTop: 0 }}>Recent Reflections</h2>
                <div style={{ display: 'grid', gap: 10 }}>{core.reflections.length ? core.reflections.slice(0, 6).map((r) => <RecordCard key={r.id} record={r} />) : <p style={{ color: '#7F91AE' }}>No reflection cycles yet.</p>}</div>
              </div>
              <div style={panel}>
                <h2 style={{ marginTop: 0 }}>Recent Simulations</h2>
                <div style={{ display: 'grid', gap: 10 }}>{core.simulations.length ? core.simulations.slice(0, 6).map((r) => <RecordCard key={r.id} record={r} />) : <p style={{ color: '#7F91AE' }}>No simulations yet.</p>}</div>
              </div>
              <div style={panel}>
                <h2 style={{ marginTop: 0 }}>Recent Experiments</h2>
                <div style={{ display: 'grid', gap: 10 }}>{core.experiments.length ? core.experiments.slice(0, 6).map((r) => <RecordCard key={r.id} record={r} />) : <p style={{ color: '#7F91AE' }}>No experiments yet.</p>}</div>
              </div>
            </section>
          </>
        )}
      </div>
      <style>{`
        @media (max-width: 900px) {
          .eva-core-grid, .eva-core-history-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </main>
  );
}
