import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import ProspectBoardroom from '../../demos/[slug]/ProspectBoardroom';
import { foundingProspects } from '../../../lib/foundingProspects';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  title: 'Private Aridon Founding Customer Preview',
  robots: { index: false, follow: false, googleBot: { index: false, follow: false } },
};

type Props = { params: { slug: string } };

export default function FoundingProspectDemoPage({ params }: Props) {
  const demo = foundingProspects.find((item) => item.slug === params.slug);
  if (!demo || !demo.active || Date.now() >= new Date(demo.expiresAt).getTime()) notFound();

  const companyContext = `${demo.publicSummary} Aridon fit hypothesis: ${demo.fitReason} Items Aridon would watch first: ${demo.watchItems.join(' ')} Studio use cases: ${demo.studioIdeas.join(' ')}`;

  return (
    <main style={{ minHeight: '100vh', background: '#F2EFE7', color: '#171717', fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif' }}>
      <div style={{ maxWidth: 1160, margin: '0 auto', padding: '24px 20px 80px' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'center', flexWrap: 'wrap', marginBottom: 24 }}>
          <Link href="/business-os" style={{ color: '#171717', textDecoration: 'none', fontWeight: 950, letterSpacing: '.04em' }}>ARIDON · PRIVATE BUSINESS OS</Link>
          <span style={{ fontSize: 12, fontWeight: 900, background: '#FFF1C9', border: '1px solid #DFC36A', borderRadius: 999, padding: '7px 11px' }}>PRIVATE FOUNDING-CUSTOMER PREVIEW</span>
        </header>

        <section style={{ background: '#111827', color: '#fff', borderRadius: 26, padding: 'clamp(26px,5vw,58px)', marginBottom: 18 }}>
          <div style={{ color: '#9EF0CF', fontSize: 12, fontWeight: 950, letterSpacing: '.1em' }}>BUILT SPECIFICALLY FOR {demo.companyName.toUpperCase()}</div>
          <h1 style={{ fontSize: 'clamp(40px,6vw,76px)', lineHeight: .96, margin: '16px 0 18px', maxWidth: 920 }}>One AI executive team for capture, growth, sales and content.</h1>
          <p style={{ color: '#D4D9E1', fontSize: 18, lineHeight: 1.65, maxWidth: 860 }}>{demo.publicSummary}</p>
          <p style={{ color: '#AEB7C4', lineHeight: 1.65, maxWidth: 860 }}>{demo.fitReason}</p>
          <p style={{ color: '#8E99A8', lineHeight: 1.6, maxWidth: 860, fontSize: 13 }}>This preview was created only from public information. Aridon has not accessed private company systems, customer records, classified information, proprietary technical data, or internal documents.</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 20 }}>
            <a href="#boardroom" style={{ background: '#9EF0CF', color: '#07130F', textDecoration: 'none', borderRadius: 10, padding: '12px 15px', fontWeight: 950 }}>Try the Executive Team</a>
            <a href="#studio" style={{ border: '1px solid #506078', color: '#fff', textDecoration: 'none', borderRadius: 10, padding: '12px 15px', fontWeight: 850 }}>See Creator + Visual Studio</a>
            <a href={demo.website} target="_blank" rel="noreferrer" style={{ border: '1px solid #506078', color: '#fff', textDecoration: 'none', borderRadius: 10, padding: '12px 15px', fontWeight: 850 }}>Source website</a>
          </div>
        </section>

        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 12, marginBottom: 18 }}>
          <InfoCard label="COMPANY" title={demo.companyName} text={demo.industry} />
          <InfoCard label="MARKET" title={demo.location} text="Public-source demonstration" />
          <InfoCard label="EXECUTIVE TARGET" title={demo.decisionMaker} text={demo.decisionRole} />
          <InfoCard label="CONTROL" title="Human approval stays in charge" text="External sends, spending and commitments remain approval-gated." />
        </section>

        <section style={{ background: '#fff', border: '1px solid #D8D2C8', borderRadius: 20, padding: 22, marginBottom: 18 }}>
          <div style={{ fontSize: 12, fontWeight: 950, color: '#24604E', letterSpacing: '.08em' }}>WHAT ARIDON WOULD WATCH FIRST</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: 11, marginTop: 15 }}>
            {demo.watchItems.map((item, index) => <article key={item} style={{ background: '#F7F5EF', borderRadius: 14, padding: 15 }}><strong>{String(index + 1).padStart(2, '0')}</strong><p style={{ marginBottom: 0, color: '#56534C', lineHeight: 1.55 }}>{item}</p></article>)}
          </div>
        </section>

        <section id="studio" style={{ background: '#101827', color: '#fff', borderRadius: 20, padding: 22, marginBottom: 18, scrollMarginTop: 20 }}>
          <div style={{ fontSize: 12, fontWeight: 950, color: '#B9CFFF', letterSpacing: '.08em' }}>CREATOR STUDIO + VISUAL STUDIO</div>
          <h2 style={{ margin: '8px 0 10px', fontSize: 32 }}>Turn approved company knowledge into finished growth material.</h2>
          <p style={{ color: '#B8C2D1', lineHeight: 1.65, maxWidth: 850 }}>Aridon can keep a private Brand Brain, use approved source files, create campaign copy, produce visual concepts and video storyboards, and hold everything at a review gate until an owner approves it.</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(250px,1fr))', gap: 11, marginTop: 14 }}>
            {demo.studioIdeas.map((item, index) => <article key={item} style={{ background: '#152237', border: '1px solid #2A3A57', borderRadius: 14, padding: 15 }}><div style={{ color: '#9EF0CF', fontWeight: 950 }}>STUDIO {index + 1}</div><p style={{ marginBottom: 0, color: '#D8E0EC', lineHeight: 1.55 }}>{item}</p></article>)}
          </div>
        </section>

        <section style={{ background: '#fff', border: '1px solid #D8D2C8', borderRadius: 20, padding: 22, marginBottom: 18 }}>
          <div style={{ fontSize: 12, fontWeight: 950, color: '#24604E', letterSpacing: '.08em' }}>SAMPLE EXECUTIVE BRIEF</div>
          <h2 style={{ margin: '8px 0 14px', fontSize: 30 }}>One page showing what deserves attention.</h2>
          <div style={{ display: 'grid', gap: 9 }}>{demo.sampleBrief.map((item) => <div key={item} style={{ background: '#F7F5EF', border: '1px solid #E4DED3', borderRadius: 12, padding: 13, color: '#4F4B44', lineHeight: 1.5 }}>{item}</div>)}</div>
        </section>

        <section id="boardroom" style={{ scrollMarginTop: 20, marginBottom: 18 }}>
          <ProspectBoardroom companyName={demo.companyName} companyContext={companyContext} starterQuestions={demo.starterQuestions} />
        </section>

        <section style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.5fr) minmax(260px,.7fr)', gap: 16, background: '#fff', border: '1px solid #D8D2C8', borderRadius: 20, padding: 22 }} className="founding-cta-grid">
          <div>
            <div style={{ fontSize: 12, fontWeight: 950, color: '#24604E', letterSpacing: '.08em' }}>FOUNDING CUSTOMER CONVERSATION</div>
            <h2 style={{ fontSize: 31, margin: '8px 0' }}>If this solves a real problem, we want the feedback before we scale it.</h2>
            <p style={{ color: '#605C54', lineHeight: 1.65 }}>We are selecting a small first group of companies to pressure-test Aridon with real workflows. The next step is a short conversation to identify one measurable use case, then decide whether a private company workspace is worth setting up.</p>
          </div>
          <div style={{ display: 'grid', gap: 9, alignContent: 'center' }}>
            <Link href={`/business-os/beta?company=${encodeURIComponent(demo.companyName)}&source=founding-customer`} style={{ background: '#171717', color: '#fff', borderRadius: 11, padding: '13px 15px', textAlign: 'center', textDecoration: 'none', fontWeight: 950 }}>Request a private setup</Link>
            <a href={`mailto:${demo.contactEmail}?subject=${encodeURIComponent(`Aridon preview for ${demo.companyName}`)}`} style={{ border: '1px solid #CFC8BC', color: '#171717', borderRadius: 11, padding: '12px 15px', textAlign: 'center', textDecoration: 'none', fontWeight: 850 }}>Reply by email</a>
          </div>
        </section>

        <footer style={{ marginTop: 20, color: '#756F65', fontSize: 12, lineHeight: 1.6 }}>Unofficial Aridon demonstration generated from public business information. No affiliation or endorsement is implied. The page is excluded from search indexing and expires automatically on September 15, 2026 unless the company asks to continue. Aridon will disable it sooner upon request.</footer>
      </div>
      <style>{`@media(max-width:760px){.founding-cta-grid{grid-template-columns:1fr !important}}`}</style>
    </main>
  );
}

function InfoCard({ label, title, text }: { label: string; title: string; text: string }) {
  return <article style={{ background: '#fff', border: '1px solid #D8D2C8', borderRadius: 18, padding: 18 }}><div style={{ fontSize: 11, fontWeight: 950, color: '#786F61' }}>{label}</div><h2 style={{ margin: '7px 0 3px', fontSize: 21 }}>{title}</h2><div style={{ color: '#666158', lineHeight: 1.45 }}>{text}</div></article>;
}
