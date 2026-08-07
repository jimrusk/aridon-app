'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

type MemoryRecord = {
  id: string;
  title: string;
  category: string;
  created_at: string;
  data: any;
};

type MemoryData = {
  doctrine: {
    coreRule: string;
    recallRule: string;
    salienceSignals: string[];
    mediaRule: string;
  };
  memories: MemoryRecord[];
  discards: MemoryRecord[];
};

const panel: React.CSSProperties = {
  background: '#101827',
  border: '1px solid #2B3953',
  borderRadius: 18,
  padding: 20,
};

const input: React.CSSProperties = {
  width: '100%',
  boxSizing: 'border-box',
  background: '#070C15',
  color: '#F8FAFC',
  border: '1px solid #34415D',
  borderRadius: 11,
  padding: '12px 13px',
  fontSize: 14,
};

const button: React.CSSProperties = {
  border: 0,
  borderRadius: 10,
  background: '#9EF0CF',
  color: '#07130F',
  padding: '11px 14px',
  fontWeight: 950,
  cursor: 'pointer',
};

function memoryText(record: MemoryRecord) {
  const d = record.data || {};
  return d.summary || d.content || JSON.stringify(d, null, 2);
}

export default function EvaMemoryPage() {
  const [data, setData] = useState<MemoryData | null>(null);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [decision, setDecision] = useState<any>(null);
  const [recallResult, setRecallResult] = useState<any>(null);
  const [observation, setObservation] = useState({
    title: '',
    content: '',
    source: '',
    mediaUrl: '',
    mediaType: 'other',
    forceSave: false,
  });
  const [query, setQuery] = useState('');

  async function load() {
    try {
      setError('');
      const res = await fetch('/api/eva-core/memory', { cache: 'no-store' });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Unable to load memory system.');
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load memory system.');
    }
  }

  useEffect(() => { load(); }, []);

  async function observe() {
    setBusy('observe');
    setError('');
    setDecision(null);
    try {
      const res = await fetch('/api/eva-core/memory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'observe', ...observation }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Observation could not be evaluated.');
      setDecision(json);
      if (json.decision === 'saved') {
        setObservation({ title: '', content: '', source: '', mediaUrl: '', mediaType: 'other', forceSave: false });
      }
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Observation could not be evaluated.');
    } finally {
      setBusy('');
    }
  }

  async function recall() {
    setBusy('recall');
    setError('');
    setRecallResult(null);
    try {
      const res = await fetch('/api/eva-core/memory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'recall', query }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Recall failed.');
      setRecallResult(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Recall failed.');
    } finally {
      setBusy('');
    }
  }

  return (
    <main style={{ minHeight: '100vh', background: 'radial-gradient(circle at 20% 0%,#1A2941 0,#08101C 38%,#04070C 100%)', color: '#F8FAFC', fontFamily: 'Arial, sans-serif', padding: '28px 20px 90px' }}>
      <div style={{ maxWidth: 1240, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'flex-start', flexWrap: 'wrap', marginBottom: 22 }}>
          <div>
            <div style={{ color: '#9EF0CF', fontSize: 12, fontWeight: 950, letterSpacing: 1.2 }}>EVA CORE · SALIENCE + RECALL</div>
            <h1 style={{ fontSize: 'clamp(38px,7vw,68px)', lineHeight: .95, margin: '10px 0 14px', letterSpacing: -2 }}>Notice it. Save it. Recall it.</h1>
            <p style={{ color: '#AEBBD0', maxWidth: 850, lineHeight: 1.65, margin: 0 }}>
              Eva Core can evaluate a noteworthy observation for computational salience, save it as persistent memory, and later retrieve it by meaning and association. A lake, a memory chip, a person, a design, a contradiction, or a small detail can all qualify.
            </p>
          </div>
          <Link href="/eva-core" style={{ color: '#08130F', background: '#C9A7FF', borderRadius: 10, padding: '11px 14px', textDecoration: 'none', fontWeight: 950 }}>Back to Eva Core</Link>
        </div>

        {error && <div style={{ background: '#3A1218', border: '1px solid #7A2836', color: '#FFD5DB', padding: 14, borderRadius: 12, marginBottom: 16 }}>{error}</div>}

        {data && (
          <div style={{ ...panel, marginBottom: 16 }}>
            <div style={{ color: '#FFD5A8', fontSize: 12, fontWeight: 950 }}>MEMORY DOCTRINE</div>
            <p style={{ fontSize: 18, lineHeight: 1.6, marginBottom: 8 }}>{data.doctrine.coreRule}</p>
            <p style={{ color: '#AEBBD0', lineHeight: 1.6, marginTop: 0 }}>{data.doctrine.recallRule}</p>
            <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
              {data.doctrine.salienceSignals.map((signal) => <span key={signal} style={{ border: '1px solid #34415D', borderRadius: 999, padding: '7px 10px', color: '#B9C6DA', fontSize: 12 }}>{signal}</span>)}
            </div>
          </div>
        )}

        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 16 }} className="memory-grid">
          <div style={panel}>
            <div style={{ color: '#9EF0CF', fontSize: 12, fontWeight: 950 }}>SALIENCE GATE</div>
            <h2>Something caught attention</h2>
            <div style={{ display: 'grid', gap: 10 }}>
              <input style={input} placeholder="What is it? Example: A still lake under storm clouds" value={observation.title} onChange={(e) => setObservation({ ...observation, title: e.target.value })} />
              <textarea style={{ ...input, minHeight: 130 }} placeholder="Describe what is noteworthy about it." value={observation.content} onChange={(e) => setObservation({ ...observation, content: e.target.value })} />
              <input style={input} placeholder="Source or context" value={observation.source} onChange={(e) => setObservation({ ...observation, source: e.target.value })} />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <select style={input} value={observation.mediaType} onChange={(e) => setObservation({ ...observation, mediaType: e.target.value })}>
                  <option value="other">Other</option>
                  <option value="image">Picture / visual</option>
                  <option value="place">Place</option>
                  <option value="technology">Technology</option>
                  <option value="article">Article / webpage</option>
                  <option value="object">Object</option>
                  <option value="idea">Idea</option>
                </select>
                <input style={input} placeholder="URL or media reference (optional)" value={observation.mediaUrl} onChange={(e) => setObservation({ ...observation, mediaUrl: e.target.value })} />
              </div>
              <label style={{ display: 'flex', gap: 9, alignItems: 'center', color: '#B9C6DA', fontSize: 13 }}>
                <input style={{ width: 18, height: 18, margin: 0 }} type="checkbox" checked={observation.forceSave} onChange={(e) => setObservation({ ...observation, forceSave: e.target.checked })} />
                Save this regardless of the salience score
              </label>
              <button style={button} disabled={Boolean(busy) || !observation.title.trim() || !observation.content.trim()} onClick={observe}>{busy === 'observe' ? 'Evaluating…' : 'Evaluate and Remember'}</button>
            </div>
            {decision && (
              <div style={{ marginTop: 14, border: `1px solid ${decision.decision === 'saved' ? '#39806A' : '#705B3C'}`, borderRadius: 12, padding: 13, background: '#08111A' }}>
                <strong>{decision.decision === 'saved' ? 'Saved as memory' : 'Explicitly discarded'}</strong>
                <div style={{ color: '#9FB0C8', marginTop: 5 }}>Salience score: {Math.round((decision.score || 0) * 100)}%</div>
                <div style={{ color: '#B9C6DA', marginTop: 7, lineHeight: 1.5 }}>{(decision.assessment?.reasons || []).join(' · ')}</div>
              </div>
            )}
          </div>

          <div style={panel}>
            <div style={{ color: '#65B7FF', fontSize: 12, fontWeight: 950 }}>RECALL TEST</div>
            <h2>Can Eva retrieve what was saved?</h2>
            <textarea style={{ ...input, minHeight: 130 }} placeholder="Example: What was that image involving water that seemed visually interesting?" value={query} onChange={(e) => setQuery(e.target.value)} />
            <button style={{ ...button, marginTop: 10 }} disabled={Boolean(busy) || !query.trim()} onClick={recall}>{busy === 'recall' ? 'Recalling…' : 'Recall Memory'}</button>

            {recallResult && (
              <div style={{ display: 'grid', gap: 9, marginTop: 14 }}>
                {recallResult.matches?.length ? recallResult.matches.map((match: any) => (
                  <article key={match.memory.id} style={{ background: '#08111A', border: '1px solid #263650', borderRadius: 12, padding: 13 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
                      <strong>{match.memory.title}</strong>
                      <span style={{ color: '#9EF0CF', fontSize: 12 }}>{Math.round(match.relevance * 100)}% match</span>
                    </div>
                    <p style={{ color: '#B9C6DA', lineHeight: 1.5, marginBottom: 7 }}>{memoryText(match.memory)}</p>
                    <div style={{ color: '#8293AE', fontSize: 12 }}>{match.reason}</div>
                  </article>
                )) : <div style={{ color: '#93A2BA', marginTop: 12 }}>No stored memory matched that cue.</div>}
              </div>
            )}
          </div>
        </section>

        {data && (
          <section style={{ ...panel, marginTop: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'baseline', flexWrap: 'wrap' }}>
              <div>
                <div style={{ color: '#C9A7FF', fontSize: 12, fontWeight: 950 }}>RECENT PERSISTENT MEMORIES</div>
                <h2 style={{ marginBottom: 4 }}>What has actually been saved</h2>
              </div>
              <div style={{ color: '#8EA0BD', fontSize: 12 }}>{data.memories.length} shown · {data.discards.length} recent discard decisions</div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 10, marginTop: 14 }}>
              {data.memories.slice(0, 18).map((memory) => (
                <article key={memory.id} style={{ background: '#08111A', border: '1px solid #263650', borderRadius: 12, padding: 13 }}>
                  <strong>{memory.title}</strong>
                  <p style={{ color: '#B9C6DA', lineHeight: 1.5 }}>{memoryText(memory)}</p>
                  <div style={{ color: '#8293AE', fontSize: 11 }}>{new Date(memory.created_at).toLocaleString()} · salience {Math.round((memory.data?.salience || 0) * 100)}%</div>
                </article>
              ))}
              {!data.memories.length && <div style={{ color: '#93A2BA' }}>No memories have been saved yet.</div>}
            </div>
          </section>
        )}
      </div>
      <style>{`@media(max-width:850px){.memory-grid{grid-template-columns:1fr !important}}`}</style>
    </main>
  );
}
