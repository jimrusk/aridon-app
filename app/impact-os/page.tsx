'use client';

import Link from 'next/link';
import { FormEvent, useState } from 'react';
import { buildImpactAnalysis } from '../../lib/impactEngine';

type SiteAnalysis = {
  website: string;
  pagesScanned: number;
  contacts: string[];
  navigation: string[];
  pages: Array<{ url: string; title: string; description: string; headings: string[] }>;
};

type ImpactResult = ReturnType<typeof buildImpactAnalysis>;

const card = { background: '#0D1728', border: '1px solid #2A3A57', borderRadius: 18, padding: 18 } as const;
const lightCard = { background: '#fff', border: '1px solid #D6D0C4', borderRadius: 18, padding: 20 } as const;

function Score({ label, value }: { label: string; value: number }) {
  return <div style={card}><div style={{ color: '#AAB7CA', fontSize: 11, fontWeight: 950 }}>{label.toUpperCase()}</div><div style={{ fontSize: 38, fontWeight: 950, marginTop: 6 }}>{value}</div><div style={{ color: '#8290A8', fontSize: 12 }}>out of 100</div></div>;
}

const modules = [
  ['Funding Intelligence', 'Organize grants, foundations, sponsors, deadlines, eligibility clues and next actions.'],
  ['Grant Builder', 'Turn mission, program, budget and impact context into a structured application workbench.'],
  ['Donor & Funder CRM', 'Track funders, sponsors, donors, asks, commitments, follow-ups and stewardship.'],
  ['Impact Measurement', 'Keep outputs, outcomes, proof and reporting together instead of rebuilding every report from scratch.'],
  ['Board & Governance', 'Create briefs, action queues, recurring board work and decision follow-through.'],
  ['Community Outreach', 'Coordinate volunteers, stakeholders, newsletters, events and public communications.'],
  ['AI + Search Discovery', 'Connect the Aridon Index Engine so the organization is easier for people, search and AI systems to understand.'],
];

export default function ImpactOSPage() {
  const [website, setWebsite] = useState('');
  const [site, setSite] = useState<SiteAnalysis | null>(null);
  const [impact, setImpact] = useState<ImpactResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function analyze(event: FormEvent) {
    event.preventDefault();
    setLoading(true); setError(''); setSite(null); setImpact(null);
    try {
      const response = await fetch('/api/analyze-business', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ website }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || 'Aridon could not analyze that organization.');
      const snapshot: SiteAnalysis = data;
      const result = buildImpactAnalysis({
        contacts: snapshot.contacts || [],
        navigation: snapshot.navigation || [],
        pages: (snapshot.pages || []).map((page) => ({ ...page, text: `${page.title} ${page.description} ${page.headings.join(' ')}` })),
      });
      setSite(snapshot);
      setImpact(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Aridon could not analyze that organization.');
    } finally { setLoading(false); }
  }

  return <main style={{ minHeight: '100vh', background: '#07101D', color: '#F8FAFC', fontFamily: 'Arial, sans-serif' }}>
    <section style={{ maxWidth: 1180, margin: '0 auto', padding: '24px 20px 72px' }}>
      <nav style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <Link href="/" style={{ color: '#F8FAFC', textDecoration: 'none', fontWeight: 950 }}>ARIDON · IMPACT OS</Link>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}><Link href="/site-indexing" style={{ color: '#E8EDF5', textDecoration: 'none', border: '1px solid #40516D', padding: '9px 12px', borderRadius: 10, fontWeight: 850 }}>Index Engine</Link><Link href="/business-os" style={{ color: '#07130F', textDecoration: 'none', background: '#9EF0CF', padding: '10px 13px', borderRadius: 10, fontWeight: 950 }}>Business OS</Link></div>
      </nav>

      <div style={{ maxWidth: 940, paddingTop: 68 }}><div style={{ color: '#9EF0CF', fontSize: 12, fontWeight: 950, letterSpacing: 1 }}>AI OPERATING SYSTEM FOR MISSION-DRIVEN ORGANIZATIONS</div><h1 style={{ fontSize: 'clamp(50px,8vw,86px)', lineHeight: .93, letterSpacing: -4, margin: '14px 0 22px' }}>Give the mission an executive team, a funding engine, and an operating system.</h1><p style={{ color: '#B8C4D5', fontSize: 20, lineHeight: 1.65, maxWidth: 880 }}>Aridon Impact OS is built for nonprofits, community organizations, philanthropic teams and mission-driven institutions that need more capacity without assembling a pile of disconnected AI tools.</p></div>

      <form onSubmit={analyze} className="impact-form" style={{ ...card, marginTop: 28, display: 'grid', gridTemplateColumns: 'minmax(0,1fr) auto', gap: 10 }}>
        <input value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://yourorganization.org" aria-label="Organization website" required style={{ width: '100%', boxSizing: 'border-box', background: '#07101D', color: '#F8FAFC', border: '1px solid #3A4A66', borderRadius: 11, padding: '14px 15px', fontSize: 16 }} />
        <button disabled={loading} type="submit" style={{ border: 0, borderRadius: 11, padding: '14px 18px', background: '#9EF0CF', color: '#07130F', fontWeight: 950, fontSize: 15, cursor: loading ? 'wait' : 'pointer', opacity: loading ? .7 : 1 }}>{loading ? 'Analyzing…' : 'Run Impact Readiness Scan'}</button>
      </form>
      {error && <div style={{ marginTop: 14, background: '#3A1620', border: '1px solid #7C3343', color: '#FFD7DF', borderRadius: 12, padding: 14 }}>{error}</div>}

      {impact && site && <div style={{ marginTop: 24, display: 'grid', gap: 14 }}>
        <section style={{ ...card, background: '#102033' }}><div style={{ color: '#9EF0CF', fontSize: 11, fontWeight: 950 }}>IMPACT READINESS SNAPSHOT</div><h2 style={{ fontSize: 30, margin: '8px 0 5px' }}>{site.website}</h2><div style={{ color: '#AEBBD0', fontSize: 13 }}>{site.pagesScanned} public page{site.pagesScanned === 1 ? '' : 's'} scanned · {site.contacts.length} contact signal{site.contacts.length === 1 ? '' : 's'} found</div></section>
        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(175px,1fr))', gap: 10 }}><Score label="Overall" value={impact.scores.overall}/><Score label="Mission" value={impact.scores.missionClarity}/><Score label="Funding" value={impact.scores.fundingReadiness}/><Score label="Supporter Path" value={impact.scores.supporterConversion}/><Score label="Impact Proof" value={impact.scores.impactProof}/><Score label="Discovery" value={impact.scores.digitalDiscovery}/></section>
        <section className="two-col" style={{ display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 14 }}><article style={card}><div style={{ color: '#9EF0CF', fontWeight: 950, fontSize: 12 }}>WHAT IS WORKING</div>{impact.strengths.length ? impact.strengths.map((item) => <div key={item} style={{ borderTop: '1px solid #263650', paddingTop: 10, marginTop: 10, color: '#DCE4EF' }}>✓ {item}</div>) : <p style={{ color: '#AEBBD0' }}>The first pass did not surface strong public signals yet.</p>}</article><article style={card}><div style={{ color: '#F4D06F', fontWeight: 950, fontSize: 12 }}>PRIORITY FIXES</div>{impact.priorities.map((item, i) => <div key={item} style={{ borderTop: '1px solid #263650', paddingTop: 10, marginTop: 10, color: '#DCE4EF' }}><strong style={{ color: '#F4D06F' }}>{i + 1}.</strong> {item}</div>)}</article></section>
        <section style={card}><div style={{ color: '#B9CFFF', fontWeight: 950, fontSize: 12 }}>FUNDING LANES</div><div style={{ display: 'grid', gap: 10, marginTop: 12 }}>{impact.fundingLanes.map((lane) => <div key={lane.lane} style={{ borderTop: '1px solid #263650', paddingTop: 12 }}><strong style={{ color: '#9EF0CF' }}>{lane.lane}</strong><div style={{ color: '#DCE4EF', marginTop: 5, lineHeight: 1.55 }}>{lane.action}</div></div>)}</div><div style={{ marginTop: 15 }}><Link href="/opportunity-intelligence" style={{ color: '#07130F', background: '#9EF0CF', borderRadius: 10, padding: '10px 13px', textDecoration: 'none', fontWeight: 950 }}>Open Opportunity Intelligence</Link></div></section>
        <section style={card}><div style={{ color: '#B9CFFF', fontWeight: 950, fontSize: 12 }}>EXECUTIVE TEAM READOUT</div>{impact.executiveReview.map((item) => <div key={item.executive} style={{ borderTop: '1px solid #263650', padding: '12px 0' }}><strong style={{ color: '#9EF0CF' }}>{item.executive}</strong><div style={{ color: '#DCE4EF', marginTop: 5, lineHeight: 1.55 }}>{item.finding}</div></div>)}</section>
        <div style={{ color: '#8290A8', fontSize: 12, lineHeight: 1.6 }}>{impact.note}</div>
      </div>}
    </section>

    <section style={{ background: '#F4F1E9', color: '#171717', padding: '72px 20px' }}><div style={{ maxWidth: 1120, margin: '0 auto' }}><div style={{ fontSize: 12, fontWeight: 950 }}>THE IMPACT OPERATING LAYER</div><h2 style={{ fontSize: 'clamp(38px,6vw,60px)', lineHeight: 1, margin: '10px 0 24px' }}>One shared brain for funding, programs, people and proof.</h2><div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(250px,1fr))', gap: 12 }}>{modules.map(([name, detail]) => <article key={name} style={lightCard}><h3 style={{ marginTop: 0 }}>{name}</h3><p style={{ color: '#5D5A54', lineHeight: 1.6 }}>{detail}</p></article>)}</div></div></section>

    <section style={{ padding: '72px 20px' }}><div style={{ maxWidth: 900, margin: '0 auto', ...card, background: '#102033' }}><div style={{ color: '#9EF0CF', fontSize: 12, fontWeight: 950 }}>IMPACT STARTER</div><div style={{ display: 'flex', gap: 12, alignItems: 'baseline', flexWrap: 'wrap', marginTop: 8 }}><strong style={{ fontSize: 58 }}>$198</strong><span style={{ color: '#B8C4D5', fontSize: 18 }}>/ month</span></div><p style={{ color: '#D5DEEA', fontSize: 18, lineHeight: 1.65 }}>Built as the affordable entry tier for smaller organizations: readiness scan, funding workspace, grant builder, donor/funder CRM, board support, impact reporting, and website + AI discovery review.</p><div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}><Link href="/business-os/beta" style={{ color: '#07130F', background: '#9EF0CF', borderRadius: 10, padding: '11px 14px', textDecoration: 'none', fontWeight: 950 }}>Start the Impact OS Beta</Link><Link href="/site-indexing" style={{ color: '#E8EDF5', border: '1px solid #40516D', borderRadius: 10, padding: '11px 14px', textDecoration: 'none', fontWeight: 900 }}>Open Index Engine</Link></div><p style={{ color: '#8290A8', fontSize: 12, lineHeight: 1.6, marginBottom: 0 }}>The $198 plan is built into the product offer. Stripe checkout for this new plan will be activated separately before Aridon accepts payment for it.</p></div></section>

    <style>{`@media(max-width:760px){.impact-form,.two-col{grid-template-columns:1fr !important}}`}</style>
  </main>;
}
