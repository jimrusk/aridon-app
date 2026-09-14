'use client';

import Link from 'next/link';
import { FormEvent, useMemo, useState } from 'react';
import { highTicketOffers } from '../../lib/highTicketCheckout';

type DomainDiagnostic = {
  kind: string;
  severity: 'info' | 'warning' | 'error';
  message: string;
  from?: string;
  to?: string;
};

type DomainDiagnostics = {
  requestedUrl: string;
  canonicalUrl?: string;
  redirectChain: string[];
  diagnostics: DomainDiagnostic[];
  safeToScore: boolean;
};

type DiagnosticResult = {
  analyzedAt: string;
  analysisStatus: 'diagnostic';
  website?: string;
  error: string;
  domainDiagnostics: DomainDiagnostics;
};

type Analysis = {
  analyzedAt: string;
  analysisStatus?: 'scored';
  website: string;
  organizationType: string;
  pagesScanned: number;
  contacts: string[];
  navigation: string[];
  scores: {
    overall: number;
    clarity: number;
    conversion: number;
    trust: number;
    aiSearchVisibility: number;
    indexingReadiness: number;
    contentIntegrity: number;
  };
  authoritySignals: string[];
  integrityFindings: string[];
  domainDiagnostics?: DomainDiagnostics;
  strengths: string[];
  opportunities: string[];
  executiveReview: Array<{ executive: string; finding: string }>;
  pages: Array<{ url: string; title: string; description: string; headings: string[] }>;
  note: string;
};

type Offer = (typeof highTicketOffers)[keyof typeof highTicketOffers];

type Recommendation = {
  offer: Offer;
  eyebrow: string;
  headline: string;
  reason: string;
  outcome: string;
};

const card = { background: '#0D1728', border: '1px solid #2A3A57', borderRadius: 18, padding: 18 } as const;
const pill = { background: '#173149', border: '1px solid #315474', borderRadius: 999, padding: '7px 10px', color: '#D8E9F8', fontSize: 12 } as const;

function Score({ label, value }: { label: string; value: number }) {
  return (
    <div style={card}>
      <div style={{ color: '#9AA9BF', fontSize: 11, fontWeight: 900, letterSpacing: .7 }}>{label.toUpperCase()}</div>
      <div style={{ fontSize: 40, fontWeight: 950, marginTop: 5 }}>{value}</div>
      <div style={{ color: '#A9B6C9', fontSize: 12 }}>out of 100</div>
    </div>
  );
}

function recommendationFor(analysis: Analysis): Recommendation {
  const s = analysis.scores;
  const criticalIntegrity = s.contentIntegrity < 72 || analysis.integrityFindings.length >= 2;
  const earlyStage = s.overall < 52 || s.clarity < 50 || s.trust < 48;
  const roadmapGap = s.overall < 76 || s.conversion < 72 || s.aiSearchVisibility < 72 || s.indexingReadiness < 72;
  const implementationReady = s.trust >= 70 && s.clarity >= 68 && analysis.opportunities.length >= 2;

  if (criticalIntegrity || earlyStage) {
    return {
      offer: highTicketOffers.healthScan,
      eyebrow: 'RECOMMENDED FIRST PAID STEP',
      headline: 'Diagnose the weak spots before spending on implementation.',
      reason: criticalIntegrity
        ? `Aridon detected content-integrity or freshness risk. A focused diagnostic should separate cleanup work from growth work before money is spent implementing the wrong thing.`
        : `The scan shows foundational clarity, trust, or positioning gaps. The lowest-risk next step is a focused diagnostic rather than a large implementation package.`,
      outcome: 'A prioritized diagnosis of revenue leaks, trust gaps, conversion friction, AI opportunities, and the next actions worth funding.',
    };
  }

  if (roadmapGap || !implementationReady) {
    return {
      offer: highTicketOffers.actionPlan,
      eyebrow: 'EVA RECOMMENDS',
      headline: 'Turn these findings into a 90-day Action Blueprint.',
      reason: `The site is healthy enough to move beyond basic diagnosis, but the scan still shows material gaps in conversion, visibility, indexing, or follow-up. The best next purchase is a decision-ready roadmap before execution begins.`,
      outcome: 'A prioritized 90-day plan covering revenue, conversion, follow-up, trust, AI, automation, owners, sequence, and what should be implemented first.',
    };
  }

  return {
    offer: highTicketOffers.implementationSprint,
    eyebrow: 'IMPLEMENTATION-READY',
    headline: 'The fundamentals are strong enough to start fixing the highest-value gaps.',
    reason: `Aridon found usable authority and clarity signals plus specific opportunities that can be acted on. That makes a focused implementation sprint more sensible than buying another layer of diagnosis.`,
    outcome: 'Done-for-you execution of the highest-priority conversion, lead capture, follow-up, landing-page, automation, and reporting fixes.',
  };
}

export default function AnalyzeBusinessPage() {
  const [website, setWebsite] = useState('');
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [diagnostic, setDiagnostic] = useState<DiagnosticResult | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const recommendation = useMemo(() => analysis ? recommendationFor(analysis) : null, [analysis]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError('');
    setAnalysis(null);
    setDiagnostic(null);
    try {
      const response = await fetch('/api/analyze-business', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ website }),
      });
      const data = await response.json();
      if (!response.ok) {
        if (data?.analysisStatus === 'diagnostic' && data?.domainDiagnostics) {
          setDiagnostic(data as DiagnosticResult);
          return;
        }
        throw new Error(data?.error || 'Aridon could not analyze that business.');
      }
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
            <Link href="/growth" style={{ color: '#E8EDF5', textDecoration: 'none', border: '1px solid #40516D', padding: '9px 12px', borderRadius: 10, fontWeight: 850 }}>Growth Packages</Link>
            <Link href="/customer/start" style={{ color: '#07130F', textDecoration: 'none', background: '#9EF0CF', padding: '10px 13px', borderRadius: 10, fontWeight: 950 }}>Open Aridon</Link>
          </div>
        </nav>

        <div style={{ maxWidth: 930, paddingTop: 62 }}>
          <div style={{ color: '#9EF0CF', fontSize: 12, fontWeight: 950, letterSpacing: 1 }}>ARIDON · ANALYZE → IMPROVE → AUTOMATE → PROTECT → GROW</div>
          <h1 style={{ fontSize: 'clamp(46px,7vw,78px)', lineHeight: .96, letterSpacing: -3, margin: '14px 0 20px' }}>Paste a company website. Get the executive readout and the next best move.</h1>
          <p style={{ color: '#B8C4D5', lineHeight: 1.7, fontSize: 19, maxWidth: 900 }}>The free scan diagnoses the public business signals first. Eva then recommends the smallest sensible paid next step based on the evidence, rather than pushing every company into the same package.</p>
        </div>

        <form onSubmit={submit} style={{ ...card, marginTop: 28, display: 'grid', gridTemplateColumns: 'minmax(0,1fr) auto', gap: 10 }} className="analyze-form">
          <input value={website} onChange={(event) => setWebsite(event.target.value)} placeholder="https://examplebusiness.com" aria-label="Business website" required style={{ width: '100%', boxSizing: 'border-box', background: '#07101D', color: '#F8FAFC', border: '1px solid #3A4A66', borderRadius: 11, padding: '14px 15px', fontSize: 16 }} />
          <button type="submit" disabled={loading} style={{ border: 0, borderRadius: 11, padding: '14px 18px', background: '#9EF0CF', color: '#07130F', fontWeight: 950, fontSize: 15, cursor: loading ? 'wait' : 'pointer', opacity: loading ? .7 : 1 }}>
            {loading ? 'Analyzing…' : 'Analyze My Business'}
          </button>
        </form>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
          {['Free scan', 'No card required', 'Evidence-based recommendation', 'Live Stripe checkout', 'No forced upsell'].map((item) => <span key={item} style={pill}>{item}</span>)}
        </div>

        {error && <div style={{ marginTop: 14, background: '#3A1620', border: '1px solid #7C3343', color: '#FFD7DF', borderRadius: 12, padding: 14 }}>{error}</div>}

        {diagnostic && (
          <section style={{ ...card, marginTop: 26, background: '#211A12', borderColor: '#7C6537' }}>
            <div style={{ color: '#F4D06F', fontSize: 11, fontWeight: 950, letterSpacing: .7 }}>DOMAIN / HOSTING DIAGNOSTIC · NO BUSINESS SCORE ASSIGNED</div>
            <h2 style={{ margin: '9px 0 6px', fontSize: 28 }}>{diagnostic.domainDiagnostics.requestedUrl}</h2>
            <p style={{ color: '#F2E8CF', lineHeight: 1.6, margin: '8px 0 0' }}>{diagnostic.error}</p>
            {diagnostic.domainDiagnostics.canonicalUrl && <p style={{ color: '#D9CCAF' }}><strong style={{ color: '#F4D06F' }}>Destination:</strong> {diagnostic.domainDiagnostics.canonicalUrl}</p>}
            <div style={{ display: 'grid', gap: 9, marginTop: 16 }}>
              {diagnostic.domainDiagnostics.diagnostics.map((item, index) => (
                <div key={`${item.kind}-${index}`} style={{ borderTop: '1px solid #4A3D25', paddingTop: 10, color: '#F2E8CF', lineHeight: 1.55 }}>
                  <strong style={{ color: item.severity === 'error' ? '#FFB4C0' : '#F4D06F' }}>{item.severity.toUpperCase()}:</strong> {item.message}
                </div>
              ))}
            </div>
            <div style={{ marginTop: 18, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <a href={highTicketOffers.healthScan.href} style={{ background: '#F4D06F', color: '#241B08', textDecoration: 'none', borderRadius: 11, padding: '12px 15px', fontWeight: 950 }}>Get the {highTicketOffers.healthScan.price} Diagnostic</a>
              <Link href="/growth" style={{ border: '1px solid #7C6537', color: '#F2E8CF', textDecoration: 'none', borderRadius: 11, padding: '11px 15px', fontWeight: 900 }}>Review Growth Options</Link>
            </div>
          </section>
        )}

        {analysis && recommendation && (
          <div style={{ marginTop: 26, display: 'grid', gap: 16 }}>
            <section style={{ ...card, background: '#102033' }}>
              <div style={{ color: '#9EF0CF', fontSize: 11, fontWeight: 950 }}>EXECUTIVE SNAPSHOT</div>
              <h2 style={{ margin: '8px 0 6px', fontSize: 30 }}>{analysis.website}</h2>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
                <span style={{ ...pill, fontWeight: 850 }}>{analysis.organizationType}</span>
                <span style={pill}>{analysis.pagesScanned} page{analysis.pagesScanned === 1 ? '' : 's'} scanned</span>
                <span style={pill}>{analysis.contacts.length} contact signal{analysis.contacts.length === 1 ? '' : 's'}</span>
                <span style={pill}>{analysis.authoritySignals.length} authority signal{analysis.authoritySignals.length === 1 ? '' : 's'}</span>
              </div>
            </section>

            <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 10 }}>
              <Score label="Overall" value={analysis.scores.overall} />
              <Score label="Clarity" value={analysis.scores.clarity} />
              <Score label="Conversion" value={analysis.scores.conversion} />
              <Score label="Trust / Authority" value={analysis.scores.trust} />
              <Score label="AI / Search Visibility" value={analysis.scores.aiSearchVisibility} />
              <Score label="Indexing Readiness" value={analysis.scores.indexingReadiness} />
              <Score label="Content Integrity" value={analysis.scores.contentIntegrity} />
            </section>

            <section style={{ ...card, background: 'linear-gradient(135deg,#10261F,#102033)', borderColor: '#3C6B59', padding: 24 }}>
              <div style={{ color: '#9EF0CF', fontWeight: 950, fontSize: 12, letterSpacing: .7 }}>{recommendation.eyebrow}</div>
              <h2 style={{ margin: '9px 0 8px', fontSize: 'clamp(30px,4vw,46px)', lineHeight: 1.04 }}>{recommendation.headline}</h2>
              <p style={{ color: '#C9D8D2', lineHeight: 1.7, fontSize: 17, maxWidth: 900 }}>{recommendation.reason}</p>
              <div style={{ background: '#0A1717', border: '1px solid #31574B', borderRadius: 13, padding: 15, marginTop: 14 }}>
                <div style={{ color: '#8FE8C6', fontSize: 11, fontWeight: 950 }}>WHAT YOU BUY</div>
                <div style={{ fontWeight: 950, fontSize: 24, marginTop: 5 }}>{recommendation.offer.name}</div>
                <div style={{ marginTop: 3 }}><strong style={{ fontSize: 30 }}>{recommendation.offer.price}</strong> <span style={{ color: '#9FB2AC' }}>{recommendation.offer.priceDetail}</span></div>
                <p style={{ color: '#B8C9C4', lineHeight: 1.6, marginBottom: 0 }}>{recommendation.outcome}</p>
              </div>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 16 }}>
                <a href={recommendation.offer.href} style={{ background: '#9EF0CF', color: '#07130F', textDecoration: 'none', borderRadius: 11, padding: '13px 17px', fontWeight: 950 }}>Choose {recommendation.offer.name}</a>
                <Link href="/growth" style={{ border: '1px solid #587268', color: '#E8F7F1', textDecoration: 'none', borderRadius: 11, padding: '12px 16px', fontWeight: 900 }}>Compare All Options</Link>
              </div>
              <div style={{ color: '#91A0B5', fontSize: 11, marginTop: 11 }}>Recommendation is based only on this public-site scan. No revenue guarantee. Larger implementation remains optional until scope and access are confirmed.</div>
            </section>

            {analysis.integrityFindings.length > 0 && (
              <section style={{ ...card, borderColor: '#735A2F' }}>
                <div style={{ color: '#F4D06F', fontWeight: 950, fontSize: 12 }}>CONTENT INTEGRITY & FRESHNESS FINDINGS</div>
                <div style={{ display: 'grid', gap: 9, marginTop: 12 }}>
                  {analysis.integrityFindings.map((item, index) => <div key={item} style={{ borderTop: '1px solid #3A3324', paddingTop: 10, color: '#F2E8CF', lineHeight: 1.55 }}><strong style={{ color: '#F4D06F' }}>{index + 1}.</strong> {item}</div>)}
                </div>
              </section>
            )}

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
              <div style={{ color: '#7DE7BF', fontWeight: 950, fontSize: 12 }}>AUTHORITY SIGNALS ARIDON DETECTED</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
                {analysis.authoritySignals.length ? analysis.authoritySignals.map((item) => <span key={item} style={{ background: '#142D28', border: '1px solid #2F6557', borderRadius: 999, padding: '8px 10px', color: '#CFF4E7', fontSize: 12 }}>{item}</span>) : <span style={{ color: '#AEBBD0' }}>No strong authority signals detected in this first pass.</span>}
              </div>
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

            <section style={{ ...card, background: '#0B1522' }}>
              <div style={{ color: '#9EF0CF', fontWeight: 950, fontSize: 12 }}>THE ARIDON MONEY LOOP</div>
              <div className="money-loop" style={{ display: 'grid', gridTemplateColumns: 'repeat(5,minmax(0,1fr))', gap: 9, marginTop: 13 }}>
                {[
                  ['1', 'Analyze', 'Free scan finds the problems.'],
                  ['2', 'Plan', 'Buy only the depth needed.'],
                  ['3', 'Implement', 'Fix the highest-value gaps.'],
                  ['4', 'Manage', 'Keep improving with recurring service.'],
                  ['5', 'Expand', 'Add departments, agents, security, and locations.'],
                ].map(([number, title, text]) => <div key={number} style={{ border: '1px solid #293B53', borderRadius: 13, padding: 13 }}><div style={{ color: '#9EF0CF', fontWeight: 950 }}>{number}. {title}</div><div style={{ color: '#9EACBF', lineHeight: 1.5, fontSize: 13, marginTop: 6 }}>{text}</div></div>)}
              </div>
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
      <style>{`@media(max-width:760px){.analyze-form,.two-col,.money-loop{grid-template-columns:1fr !important}}`}</style>
    </main>
  );
}
