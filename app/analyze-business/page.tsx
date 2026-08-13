'use client';

import Link from 'next/link';
import { FormEvent, useState } from 'react';

type Analysis = {
  analyzedAt: string;
  website: string;
  pagesScanned: number;
  contacts: string[];
  navigation: string[];
  scores: {
    overall: number;
    clarity: number;
    conversion: number;
    trust: number;
    localVisibility: number;
  };
  strengths: string[];
  opportunities: string[];
  executiveReview: Array<{ executive: string; finding: string }>;
  pages: Array<{ url: string; title: string; description: string; headings: string[] }>;
  note: string;
};

const card = { background: '#0D1728', border: '1px solid #2A3A57', borderRadius: 18, padding: 18 } as const;

function Score({ label, value }: { label: string; value: number }) {
  return (
    <div style={card}>
      <div style={{ color: '#9AA9BF', fontSize: 11, fontWeight: 900, letterSpacing: .7 }}>{label.toUpperCase()}</div>
      <div style={{ fontSize: 40, fontWeight: 950, marginTop: 5 }}>{value}</div>
      <div style={{ color: '#A9B6C9', fontSize: 12 }}>out of 100</div>
    </div>
  );
}

export default function AnalyzeBusinessPage() {
  const [website, setWebsite] = useState('');
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError('');
    setAnalysis(null);
    try {
      const response = await fetch('/api/analyze-business', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ website }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || 'Aridon could not analyze that business.');
      setAnalysis(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Aridon could not analyze that business.');
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
            <Link href="/business-os/growth-command" style={{ color: '#E8EDF5', textDecoration: 'none', border: '1px solid #40516D', padding: '9px 12px', borderRadius: 10, fontWeight: 850 }}>Growth Command</Link>
            <Link href="/" style={{ color: '#07130F', textDecoration: 'none', background: '#9EF0CF', padding: '10px 13px', borderRadius: 10, fontWeight: 950 }}>Dashboard</Link>
          </div>
        </nav>

        <div style={{ maxWidth: 900, paddingTop: 62 }}>
          <div style={{ color: '#9EF0CF', fontSize: 12, fontWeight: 950, letterSpacing: 1 }}>ARIDON · ANALYZE ANY BUSINESS</div>
          <h1 style={{ fontSize: 'clamp(46px,7vw,78px)', lineHeight: .96, letterSpacing: -3, margin: '14px 0 20px' }}>Paste a company website. Get the executive readout.</h1>
          <p style={{ color: '#B8C4D5', lineHeight: 1.7, fontSize: 19, maxWidth: 850 }}>Aridon scans the public website, scores the company’s digital front door, identifies strengths and missed opportunities, and routes the findings through an executive lens.</p>
        </div>

        <form onSubmit={submit} style={{ ...card, marginTop: 28, display: 'grid', gridTemplateColumns: 'minmax(0,1fr) auto', gap: 10 }} className="analyze-form">
          <input
            value={website}
            onChange={(event) => setWebsite(event.target.value)}
            placeholder="https://examplebusiness.com"
            aria-label="Business website"
            required
            style={{ width: '100%', boxSizing: 'border-box', background: '#07101D', color: '#F8FAFC', border: '1px solid #3A4A66', borderRadius: 11, padding: '14px 15px', fontSize: 16 }}
          />
          <button type="submit" disabled={loading} style={{ border: 0, borderRadius: 11, padding: '14px 18px', background: '#9EF0CF', color: '#07130F', fontWeight: 950, fontSize: 15, cursor: loading ? 'wait' : 'pointer', opacity: loading ? .7 : 1 }}>
            {loading ? 'Analyzing…' : 'Analyze Any Business'}
          </button>
        </form>

        {error && <div style={{ marginTop: 14, background: '#3A1620', border: '1px solid #7C3343', color: '#FFD7DF', borderRadius: 12, padding: 14 }}>{error}</div>}

        {analysis && (
          <div style={{ marginTop: 26, display: 'grid', gap: 16 }}>
            <section style={{ ...card, background: '#102033' }}>
              <div style={{ color: '#9EF0CF', fontSize: 11, fontWeight: 950 }}>EXECUTIVE SNAPSHOT</div>
              <h2 style={{ margin: '8px 0 6px', fontSize: 30 }}>{analysis.website}</h2>
              <div style={{ color: '#AEBBD0', fontSize: 13 }}>{analysis.pagesScanned} public page{analysis.pagesScanned === 1 ? '' : 's'} scanned · {analysis.contacts.length} contact signal{analysis.contacts.length === 1 ? '' : 's'} found</div>
            </section>

            <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 10 }}>
              <Score label="Overall" value={analysis.scores.overall} />
              <Score label="Clarity" value={analysis.scores.clarity} />
              <Score label="Conversion" value={analysis.scores.conversion} />
              <Score label="Trust" value={analysis.scores.trust} />
              <Score label="Local Visibility" value={analysis.scores.localVisibility} />
            </section>

            <section className="two-col" style={{ display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 14 }}>
              <article style={card}>
                <div style={{ color: '#9EF0CF', fontWeight: 950, fontSize: 12 }}>WHAT IS WORKING</div>
                <div style={{ display: 'grid', gap: 9, marginTop: 12 }}>
                  {analysis.strengths.map((item) => <div key={item} style={{ borderTop: '1px solid #263650', paddingTop: 10, color: '#DCE4EF', lineHeight: 1.55 }}>✓ {item}</div>)}
                  {!analysis.strengths.length && <div style={{ color: '#AEBBD0' }}>No strong signals surfaced in this first pass.</div>}
                </div>
              </article>
              <article style={card}>
                <div style={{ color: '#F4D06F', fontWeight: 950, fontSize: 12 }}>BEST OPPORTUNITIES</div>
                <div style={{ display: 'grid', gap: 9, marginTop: 12 }}>
                  {analysis.opportunities.map((item, index) => <div key={item} style={{ borderTop: '1px solid #263650', paddingTop: 10, color: '#DCE4EF', lineHeight: 1.55 }}><strong style={{ color: '#F4D06F' }}>{index + 1}.</strong> {item}</div>)}
                </div>
              </article>
            </section>

            <section style={card}>
              <div style={{ color: '#B9CFFF', fontWeight: 950, fontSize: 12 }}>EXECUTIVE TEAM READOUT</div>
              <div style={{ display: 'grid', gap: 0, marginTop: 12 }}>
                {analysis.executiveReview.map((item) => (
                  <div key={item.executive} style={{ borderTop: '1px solid #263650', padding: '13px 0', display: 'grid', gap: 5 }}>
                    <strong style={{ color: '#9EF0CF' }}>{item.executive}</strong>
                    <span style={{ color: '#DCE4EF', lineHeight: 1.6 }}>{item.finding}</span>
                  </div>
                ))}
              </div>
            </section>

            <section className="two-col" style={{ display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 14 }}>
              <article style={card}>
                <div style={{ color: '#9AA9BF', fontWeight: 950, fontSize: 12 }}>PUBLIC CONTACT SIGNALS</div>
                <div style={{ color: '#E7EDF5', lineHeight: 1.8, marginTop: 10 }}>{analysis.contacts.length ? analysis.contacts.join(' · ') : 'None detected.'}</div>
              </article>
              <article style={card}>
                <div style={{ color: '#9AA9BF', fontWeight: 950, fontSize: 12 }}>HIGH-SIGNAL NAVIGATION</div>
                <div style={{ color: '#E7EDF5', lineHeight: 1.8, marginTop: 10 }}>{analysis.navigation.length ? analysis.navigation.join(' · ') : 'None detected.'}</div>
              </article>
            </section>

            <section style={card}>
              <div style={{ color: '#9AA9BF', fontWeight: 950, fontSize: 12 }}>PAGES SCANNED</div>
              {analysis.pages.map((page) => (
                <div key={page.url} style={{ borderTop: '1px solid #263650', padding: '13px 0' }}>
                  <strong>{page.title || page.url}</strong>
                  <div style={{ color: '#8FA0B8', fontSize: 12, marginTop: 4 }}>{page.url}</div>
                  {page.description && <div style={{ color: '#C6D1E1', lineHeight: 1.55, marginTop: 7 }}>{page.description}</div>}
                </div>
              ))}
              <div style={{ color: '#8290A8', fontSize: 12, lineHeight: 1.5, marginTop: 10 }}>{analysis.note}</div>
            </section>
          </div>
        )}
      </section>
      <style>{`@media(max-width:760px){.analyze-form,.two-col{grid-template-columns:1fr !important}}`}</style>
    </main>
  );
}
