import Link from 'next/link';

const strengths = [
  ['Clear service breadth', 'The site makes its full-service model obvious: brand consulting, podcasts, PR, advertising/media buying, audio-video, social media, web design and SEO.'],
  ['Credibility through people', 'Leadership bios, media history and named team members make the agency feel human and experienced rather than anonymous.'],
  ['Strong proof layer', 'Portfolio content and client testimonials reduce perceived risk and give visitors reasons to trust the agency.'],
  ['Growth-centered positioning', 'The language repeatedly connects marketing activity to measurable business growth, not vanity metrics.'],
  ['Multiple conversion paths', 'Visitors can move from services to portfolio, testimonials, blog content and contact without being trapped in one funnel.'],
];

const gaps = [
  ['Too many services compete at once', 'A first-time visitor may understand that Pratt does a lot, but may not immediately know which service or package is the best first step.'],
  ['Outcome hierarchy could be sharper', 'The site talks about results, but a stronger top-level message could separate the agency by customer type, problem solved or measurable outcome.'],
  ['Proof could be quantified', 'Testimonials are useful, but case-study numbers such as leads, revenue lift, conversion improvement or media reach would make the proof much stronger.'],
  ['Lead qualification is light', 'The contact path is simple, but there is room for a smarter intake that learns budget, urgency, service need and growth objective before the first call.'],
  ['AI promise is not yet a product', 'The site mentions AI-powered research. A more concrete demonstration or deliverable would make that positioning more defensible and memorable.'],
];

const osExtraction = [
  'Company identity, location and leadership',
  'Primary services and service categories',
  'Core positioning and differentiators',
  'Target customer clues',
  'Testimonials and proof signals',
  'Public contact channels',
  'Likely revenue opportunities',
  'Website gaps and conversion risks',
  'Starter projects for Eva and Scout',
];

export default function PrattMarketingAnalysis() {
  return (
    <main style={{ minHeight: '100vh', background: '#0B1020', color: '#F8FAFC', padding: '34px 20px 70px', fontFamily: 'Arial, sans-serif' }}>
      <div style={{ maxWidth: '1080px', margin: '0 auto', display: 'grid', gap: '18px' }}>
        <header style={{ background: '#111827', border: '1px solid #2A3857', borderRadius: '20px', padding: '24px' }}>
          <div style={{ color: '#9EF0CF', fontSize: '12px', fontWeight: 950 }}>PUBLIC TEST CASE 001 · BUSINESS OS BETA</div>
          <h1 style={{ fontSize: 'clamp(40px,7vw,66px)', lineHeight: 1, margin: '10px 0 14px' }}>Pratt Marketing Agency</h1>
          <p style={{ color: '#B7C2D5', lineHeight: 1.7, maxWidth: '850px', fontSize: '17px' }}>
            A full-service marketing agency in Scottsdale, Arizona, led by Dave Pratt. The public site presents a broad mix of strategy, media, production and digital-growth services, backed by team bios, portfolio material and client testimonials.
          </p>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '16px' }}>
            <a href="https://prattmarketingagency.com/" target="_blank" rel="noreferrer" style={primaryButton}>Open Public Website</a>
            <Link href="/business-os/beta/sites" style={secondaryButton}>All Beta Test Sites</Link>
          </div>
          <p style={{ color: '#7F8DA5', fontSize: '11px', marginTop: '14px' }}>Analysis of publicly available website information only. Pratt Marketing Agency is not presented as an Aridon customer or partner.</p>
        </header>

        <section style={gridSection}>
          <Score title="Positioning" score="8/10" text="Professional and growth-oriented, with a clear full-service identity." />
          <Score title="Trust" score="9/10" text="Strong leadership history, team visibility and testimonials." />
          <Score title="Conversion" score="7/10" text="Good calls to action, but service choice and qualification can be tighter." />
          <Score title="Business OS Fit" score="9/10" text="Excellent test case for website-to-workspace intelligence." />
        </section>

        <section style={panelStyle}>
          <div style={eyebrow}>WHAT THEY SELL</div>
          <h2 style={heading}>Business model at a glance</h2>
          <p style={body}>Pratt combines traditional agency work with media-production capability. Its public offering includes brand consulting, professional podcasts, public relations, advertising and media buying, audio/video production, audiobook production, social media marketing, website design and SEO.</p>
          <p style={body}><strong style={{ color: '#F8FAFC' }}>Likely commercial engine:</strong> retainers and project work across strategy, creative, media, production and digital-growth services, with cross-sell potential among clients who enter through one service.</p>
        </section>

        <section style={panelStyle}>
          <div style={eyebrow}>WHAT WORKS</div>
          <h2 style={heading}>Five strong pieces to learn from</h2>
          <div style={{ display: 'grid', gap: '10px' }}>{strengths.map(([title, text]) => <Item key={title} title={title} text={text} good />)}</div>
        </section>

        <section style={panelStyle}>
          <div style={{ color: '#FFD6A5', fontSize: '12px', fontWeight: 950 }}>WHERE BUSINESS OS SHOULD HELP</div>
          <h2 style={heading}>Five growth opportunities</h2>
          <div style={{ display: 'grid', gap: '10px' }}>{gaps.map(([title, text]) => <Item key={title} title={title} text={text} />)}</div>
        </section>

        <section style={panelStyle}>
          <div style={eyebrow}>RECOMMENDED STARTER WORKSPACE</div>
          <h2 style={heading}>What our beta should build automatically</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(230px,1fr))', gap: '10px' }}>
            <Mini title="Eva · Strategy" text="Clarify the strongest market position, package services and identify the next highest-value growth move." />
            <Mini title="Scout · Sales" text="Build target account lists by industry, location and likely need, then draft personalized outreach for review." />
            <Mini title="Proof Builder" text="Turn testimonials and portfolio work into quantified case-study templates with measurable outcomes." />
            <Mini title="Conversion Review" text="Audit the buyer journey from homepage to contact and propose better qualification, offers and CTAs." />
          </div>
        </section>

        <section style={panelStyle}>
          <div style={eyebrow}>AUTOMATIC WEBSITE INGESTION TARGET</div>
          <h2 style={heading}>What Business OS should extract from any URL</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: '8px' }}>
            {osExtraction.map((item, index) => <div key={item} style={{ background: '#0D1626', border: '1px solid #34415D', borderRadius: '12px', padding: '12px', color: '#C9D3E4' }}><strong style={{ color: '#9EF0CF' }}>{index + 1}.</strong> {item}</div>)}
          </div>
        </section>

        <section style={{ ...panelStyle, borderColor: '#436D63', background: '#10201F' }}>
          <div style={eyebrow}>BETA PRODUCT REQUIREMENT EXPOSED BY THIS TEST</div>
          <h2 style={heading}>A URL should become company intelligence, not just a saved link.</h2>
          <p style={body}>The current beta can store a website address during signup. The next meaningful step is website ingestion: read the public site, extract the business profile, create useful company knowledge, propose starter projects and hand Scout enough context to research prospects without forcing the owner to retype what is already public.</p>
        </section>

        <Link href="/business-os/beta" style={{ color: '#B9CFFF', fontWeight: 850, textDecoration: 'none' }}>← Back to Business OS beta</Link>
      </div>
    </main>
  );
}

function Score({ title, score, text }: { title: string; score: string; text: string }) {
  return <div style={{ background: '#111827', border: '1px solid #2A3857', borderRadius: '16px', padding: '18px' }}><div style={{ color: '#9EF0CF', fontWeight: 950, fontSize: '12px' }}>{title.toUpperCase()}</div><div style={{ fontSize: '32px', fontWeight: 950, margin: '7px 0' }}>{score}</div><div style={{ color: '#B7C2D5', lineHeight: 1.5, fontSize: '13px' }}>{text}</div></div>;
}

function Item({ title, text, good = false }: { title: string; text: string; good?: boolean }) {
  return <div style={{ background: '#0D1626', border: '1px solid #34415D', borderRadius: '12px', padding: '14px' }}><strong style={{ color: good ? '#9EF0CF' : '#FFD6A5' }}>{title}</strong><div style={{ color: '#C9D3E4', lineHeight: 1.6, marginTop: '5px' }}>{text}</div></div>;
}

function Mini({ title, text }: { title: string; text: string }) {
  return <div style={{ background: '#0D1626', border: '1px solid #34415D', borderRadius: '14px', padding: '15px' }}><strong style={{ color: '#9EF0CF' }}>{title}</strong><div style={{ color: '#C9D3E4', lineHeight: 1.55, marginTop: '7px', fontSize: '13px' }}>{text}</div></div>;
}

const gridSection = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(210px,1fr))', gap: '10px' };
const panelStyle = { background: '#111827', border: '1px solid #2A3857', borderRadius: '18px', padding: '22px' };
const eyebrow = { color: '#9EF0CF', fontSize: '12px', fontWeight: 950 };
const heading = { fontSize: 'clamp(26px,4vw,38px)', margin: '8px 0 14px' };
const body = { color: '#C4CEDD', lineHeight: 1.7 };
const primaryButton = { background: '#9EF0CF', color: '#08130F', padding: '12px 16px', borderRadius: '10px', textDecoration: 'none', fontWeight: 900 };
const secondaryButton = { border: '1px solid #415171', color: '#E4EAF5', padding: '11px 15px', borderRadius: '10px', textDecoration: 'none', fontWeight: 800 };
