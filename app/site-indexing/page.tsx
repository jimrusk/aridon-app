'use client';

import Link from 'next/link';
import { FormEvent, useState } from 'react';

type IndexPage = {
  url: string;
  title: string;
  score: number;
  status: string;
  missing: string[];
};

type IndexResponse = {
  website: string;
  contacts: string[];
  navigation: string[];
  indexEngine: {
    engine: string;
    status: string;
    indexedAt: string;
    pagesIndexed: number;
    readyPages: number;
    searchReadiness: number;
    aiReadiness: number;
    pageIndex: IndexPage[];
    issues: string[];
    recommendedFixes: string[];
    submissionChannels: Array<{ name: string; status: string; detail: string }>;
    note: string;
  };
};

const card = {
  background: '#0D1728',
  border: '1px solid #2A3A57',
  borderRadius: 18,
  padding: 18,
} as const;

function Score({ label, value }: { label: string; value: number }) {
  return (
    <div style={card}>
      <div style={{ color: '#9AA9BF', fontSize: 11, fontWeight: 900, letterSpacing: .7 }}>{label.toUpperCase()}</div>
      <div style={{ fontSize: 40, fontWeight: 950, marginTop: 5 }}>{value}</div>
      <div style={{ color: '#A9B6C9', fontSize: 12 }}>out of 100</div>
    </div>
  );
}

export default function SiteIndexingPage() {
  const [website, setWebsite] = useState('');
  const [result, setResult] = useState<IndexResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function submit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await fetch('/api/site-indexing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ website }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || 'Aridon could not index that site.');
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Aridon could not index that site.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ minHeight: '100vh', background: '#07101D', color: '#F8FAFC', fontFamily: 'Arial, sans-serif' }}>
      <section style={{ maxWidth: 1180, margin: '0 auto', padding: '24px 20px 72px' }}>
        <nav style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <Link href="/" style={{ color: '#F8FAFC', textDecoration: 'none', fontWeight: 950 }}>ARIDON</Link>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <Link href="/analyze-business" style={{ color: '#E8EDF5', textDecoration: 'none', border: '1px solid #40516D', padding: '9px 12px', borderRadius: 10, fontWeight: 850 }}>Analyze Any Business</Link>
            <Link href="/" style={{ color: '#07130F', textDecoration: 'none', background: '#9EF0CF', padding: '10px 13px', borderRadius: 10, fontWeight: 950 }}>Dashboard</Link>
          </div>
        </nav>

        <div style={{ maxWidth: 900, paddingTop: 62 }}>
          <div style={{ color: '#9EF0CF', fontSize: 12, fontWeight: 950, letterSpacing: 1 }}>ARIDON · INDEX ENGINE</div>
          <h1 style={{ fontSize: 'clamp(46px,7vw,78px)', lineHeight: .96, letterSpacing: -3, margin: '14px 0 20px' }}>Turn a business website into an indexed growth asset.</h1>
          <p style={{ color: '#B8C4D5', lineHeight: 1.7, fontSize: 19, maxWidth: 850 }}>Aridon catalogs the public pages it can scan, scores search and AI discovery readiness, finds indexing blockers, and prepares the owner-authorized next steps for external search platforms.</p>
        </div>

        <form onSubmit={submit} className="index-form" style={{ ...card, marginTop: 28, display: 'grid', gridTemplateColumns: 'minmax(0,1fr) auto', gap: 10 }}>
          <input
            value={website}
            onChange={(event) => setWebsite(event.target.value)}
            placeholder="https://examplebusiness.com"
            aria-label="Website to index"
            required
            style={{ width: '100%', boxSizing: 'border-box', background: '#07101D', color: '#F8FAFC', border: '1px solid #3A4A66', borderRadius: 11, padding: '14px 15px', fontSize: 16 }}
          />
          <button type="submit" disabled={loading} style={{ border: 0, borderRadius: 11, padding: '14px 18px', background: '#9EF0CF', color: '#07130F', fontWeight: 950, fontSize: 15, cursor: loading ? 'wait' : 'pointer', opacity: loading ? .7 : 1 }}>
            {loading ? 'Indexing…' : 'Index This Site'}
          </button>
        </form>

        {error && <div style={{ marginTop: 14, background: '#3A1620', border: '1px solid #7C3343', color: '#FFD7DF', borderRadius: 12, padding: 14 }}>{error}</div>}

        {result && (
          <div style={{ marginTop: 26, display: 'grid', gap: 16 }}>
            <section style={{ ...card, background: '#102033' }}>
              <div style={{ color: '#9EF0CF', fontSize: 11, fontWeight: 950 }}>INDEX SNAPSHOT</div>
              <h2 style={{ margin: '8px 0 6px', fontSize: 30 }}>{result.website}</h2>
              <div style={{ color: '#AEBBD0', fontSize: 13 }}>{result.indexEngine.pagesIndexed} page{result.indexEngine.pagesIndexed === 1 ? '' : 's'} cataloged · {result.indexEngine.readyPages} ready now</div>
            </section>

            <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 10 }}>
              <Score label="Search Readiness" value={result.indexEngine.searchReadiness} />
              <Score label="AI Discovery" value={result.indexEngine.aiReadiness} />
            </section>

            <section className="two-col" style={{ display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 14 }}>
              <article style={card}>
                <div style={{ color: '#F4D06F', fontWeight: 950, fontSize: 12 }}>INDEXING ISSUES</div>
                <div style={{ display: 'grid', gap: 9, marginTop: 12 }}>
                  {result.indexEngine.issues.length ? result.indexEngine.issues.map((item) => <div key={item} style={{ borderTop: '1px solid #263650', paddingTop: 10, color: '#DCE4EF', lineHeight: 1.55 }}>• {item}</div>) : <div style={{ color: '#B8C4D5' }}>No major issues surfaced in this scan.</div>}
                </div>
              </article>

              <article style={card}>
                <div style={{ color: '#9EF0CF', fontWeight: 950, fontSize: 12 }}>ARIDON FIX QUEUE</div>
                <div style={{ display: 'grid', gap: 9, marginTop: 12 }}>
                  {result.indexEngine.recommendedFixes.map((item, index) => <div key={item} style={{ borderTop: '1px solid #263650', paddingTop: 10, color: '#DCE4EF', lineHeight: 1.55 }}><strong style={{ color: '#9EF0CF' }}>{index + 1}.</strong> {item}</div>)}
                </div>
              </article>
            </section>

            <section style={card}>
              <div style={{ color: '#B9CFFF', fontWeight: 950, fontSize: 12 }}>SUBMISSION CHANNELS</div>
              <div style={{ display: 'grid', gap: 0, marginTop: 12 }}>
                {result.indexEngine.submissionChannels.map((channel) => (
                  <div key={channel.name} style={{ borderTop: '1px solid #263650', padding: '13px 0', display: 'grid', gridTemplateColumns: 'minmax(150px,220px) 100px 1fr', gap: 12, alignItems: 'start' }} className="channel-row">
                    <strong>{channel.name}</strong>
                    <span style={{ color: channel.status === 'active' ? '#9EF0CF' : '#F4D06F', fontWeight: 900 }}>{channel.status.toUpperCase()}</span>
                    <span style={{ color: '#C6D1E1', lineHeight: 1.5 }}>{channel.detail}</span>
                  </div>
                ))}
              </div>
            </section>

            <section style={card}>
              <div style={{ color: '#9AA9BF', fontWeight: 950, fontSize: 12 }}>PAGE INDEX</div>
              {result.indexEngine.pageIndex.map((page) => (
                <div key={page.url} style={{ borderTop: '1px solid #263650', padding: '13px 0', display: 'grid', gridTemplateColumns: '1fr auto', gap: 12 }}>
                  <div>
                    <strong>{page.title}</strong>
                    <div style={{ color: '#8FA0B8', fontSize: 12, marginTop: 4 }}>{page.url}</div>
                    {page.missing.length > 0 && <div style={{ color: '#F4D06F', fontSize: 12, marginTop: 6 }}>Needs: {page.missing.join(', ')}</div>}
                  </div>
                  <div style={{ fontSize: 26, fontWeight: 950 }}>{page.score}</div>
                </div>
              ))}
              <div style={{ color: '#8290A8', fontSize: 12, lineHeight: 1.5, marginTop: 10 }}>{result.indexEngine.note}</div>
            </section>
          </div>
        )}
      </section>

      <style>{`@media(max-width:760px){.index-form,.two-col{grid-template-columns:1fr !important}.channel-row{grid-template-columns:1fr !important}}`}</style>
    </main>
  );
}
