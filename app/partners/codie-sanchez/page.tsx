import Link from 'next/link';
import type { CSSProperties } from 'react';
import { codieModules, codieSources } from '../../../lib/codieCurriculum';

const card: CSSProperties = { background: '#0D1728', border: '1px solid #2B3D5B', borderRadius: 18, padding: 18 };
const mint: CSSProperties = { display: 'inline-block', background: '#9EF0CF', color: '#07130F', textDecoration: 'none', borderRadius: 11, padding: '12px 15px', fontWeight: 950 };
const outline: CSSProperties = { display: 'inline-block', border: '1px solid #546681', color: '#EDF3FA', textDecoration: 'none', borderRadius: 11, padding: '11px 14px', fontWeight: 900 };

export default function CodieSanchezPartnerPage() {
  const automation = [
    ['Audience Intelligence', 'Turn newsletters, public content, events and buyer questions into a living map of what students are trying to learn and buy.'],
    ['AI Teaching Studio', 'Teach the public curriculum 24/7 with interactive lessons, quizzes and source-linked explanations. An authorized portrait and voice layer can be added only with partner approval.'],
    ['Buyer Room', 'Students bring a real deal into Aridon and move from buy box to financial normalization, financing, diligence and decision.'],
    ['Academy Progress', 'Track what each student has learned, which deals they screened, where they are stuck and what lesson or advisor should come next.'],
    ['Deal Underwriting', 'Normalize SDE, challenge add-backs, test customers, working capital, owner dependence, debt service, evidence quality and post-close survivability.'],
    ['Financing Desk', 'Model SBA, conventional, seller-note and earnout structures before students fall in love with a headline purchase price.'],
    ['Content Factory', 'Turn long-form teaching into newsletters, lesson summaries, FAQs, clips, worksheets, quizzes and buyer checklists while final publishing stays behind approval.'],
    ['Growth Boardroom', 'After close, move the buyer into a 100-day takeover plan, Growth Command, website analysis, AI visibility, revenue attribution and operating-system buildout.'],
    ['Member and Deal Analytics', 'Measure lesson completion, deals screened, deals killed, LOIs advanced, financing readiness, time-to-decision and post-close progress.'],
  ];

  const research = [
    ['Contrarian Thinking', 'Main authority hub for buying and scaling cash-flowing businesses. The current site emphasizes ownership, events, Academy and owner growth.'],
    ['CodieSanchez.com', 'Founder gateway connecting Owner Nation, Growth Boardroom, Contrarian Academy, book and podcast.'],
    ['Contrarian Thinking Newsletter', 'Weekly owned-media engine teaching business buying, growth, hiring, financing and owner-independence.'],
    ['Main Street Minute', 'Buyer-specific publication built around practical case studies and lessons from real acquisitions.'],
    ['YouTube', 'Large top-of-funnel teaching engine centered on boring businesses, acquisition entrepreneurship, deal funding, business selection and becoming a CEO.'],
    ['Academy and Boardroom', 'Paid education and advisory layers moving the audience from information into transactions and operations.'],
    ['Deal and investment ecosystem', 'The broader machine extends beyond education into deal discovery, investing and ownership infrastructure.'],
  ];

  return (
    <main style={{ minHeight: '100vh', background: '#07101D', color: '#F8FAFC', fontFamily: 'Arial,sans-serif' }}>
      <section style={{ maxWidth: 1180, margin: '0 auto', padding: '24px 20px 72px' }}>
        <nav style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <Link href="/dashboard" style={{ color: '#F8FAFC', textDecoration: 'none', fontWeight: 950 }}>ARIDON - PARTNER LAB</Link>
          <div style={{ display: 'flex', gap: 9, flexWrap: 'wrap' }}>
            <Link href="/acquisitions" style={outline}>Buyer Room</Link>
            <Link href="/partners/codie-sanchez/teacher" style={mint}>Open Teaching Platform</Link>
          </div>
        </nav>

        <div className="hero-grid" style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.25fr) minmax(270px,.75fr)', gap: 24, alignItems: 'center', paddingTop: 56 }}>
          <div>
            <div style={{ color: '#9EF0CF', fontSize: 12, fontWeight: 950, letterSpacing: 1 }}>CONTRARIAN THINKING + ARIDON - PROPOSED PARTNERSHIP DEMO</div>
            <h1 style={{ fontSize: 'clamp(48px,8vw,86px)', lineHeight: .93, letterSpacing: -4, margin: '14px 0 20px' }}>Teach ownership. Then help every student underwrite the deal.</h1>
            <p style={{ color: '#BBC7D8', fontSize: 20, lineHeight: 1.68, maxWidth: 870 }}>Codie already built the audience, curriculum, community and deal ecosystem. Aridon does not need to replace that. It can become the decision-support and operating layer underneath it: a source-grounded tutor, a Buyer Room for real acquisitions, a financing and diligence engine, and a post-close growth system.</p>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 19 }}>
              <Link href="/partners/codie-sanchez/teacher" style={mint}>Create / Open Teaching Platform</Link>
              <Link href="/acquisitions" style={outline}>Test a Real Deal</Link>
            </div>
          </div>

          <aside style={{ ...card, background: 'linear-gradient(160deg,#162237,#0B1524)' }}>
            <div style={{ width: 150, height: 150, borderRadius: '50%', display: 'grid', placeItems: 'center', margin: '0 auto 16px', border: '1px solid #556885', background: '#101B2C', fontSize: 48, fontWeight: 950 }}>CS</div>
            <div style={{ textAlign: 'center' }}>
              <strong style={{ fontSize: 23 }}>Authorized Partner Portrait Slot</strong>
              <p style={{ color: '#AEBBD0', lineHeight: 1.55, fontSize: 13 }}>The demo intentionally does not copy Codie's photo or voice. If she approves the partnership and supplies or licenses brand assets, this slot can use her authorized portrait and an approved voice solution. Until then, the tutor uses a clearly synthetic, non-imitative demo voice.</p>
            </div>
          </aside>
        </div>
      </section>

      <section style={{ background: '#F4F1E9', color: '#171717', padding: '72px 20px' }}>
        <div style={{ maxWidth: 1180, margin: '0 auto' }}>
          <div style={{ fontSize: 12, fontWeight: 950 }}>WHAT THE SITE RESEARCH SHOWS</div>
          <h2 style={{ fontSize: 'clamp(38px,6vw,60px)', lineHeight: 1, margin: '10px 0 22px' }}>The real asset is the ecosystem, not one website.</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(255px,1fr))', gap: 11 }}>
            {research.map(([name, detail]) => (
              <article key={name} style={{ background: '#fff', border: '1px solid #D6D0C4', borderRadius: 16, padding: 17 }}>
                <strong style={{ fontSize: 20 }}>{name}</strong>
                <p style={{ color: '#5E5950', lineHeight: 1.6, marginBottom: 0 }}>{detail}</p>
              </article>
            ))}
          </div>
          <p style={{ color: '#6F685D', lineHeight: 1.65, marginTop: 18 }}>Research conclusion: social attention to free education to owned email audience to event / Academy / Boardroom to deal tools and services to investments / holdings. Aridon plugs into the point where a student says: I found a business. Should I buy it?</p>
        </div>
      </section>

      <section style={{ maxWidth: 1180, margin: '0 auto', padding: '72px 20px' }}>
        <div style={{ color: '#9EF0CF', fontSize: 12, fontWeight: 950 }}>ARIDON AUTOMATION MAP</div>
        <h2 style={{ fontSize: 'clamp(38px,6vw,60px)', lineHeight: 1, margin: '10px 0 24px' }}>One teaching system that follows the member all the way to ownership.</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(270px,1fr))', gap: 11 }}>
          {automation.map(([name, detail]) => (
            <article key={name} style={card}>
              <strong style={{ color: '#9EF0CF', fontSize: 19 }}>{name}</strong>
              <p style={{ color: '#C1CCDC', lineHeight: 1.6, marginBottom: 0 }}>{detail}</p>
            </article>
          ))}
        </div>
      </section>

      <section style={{ background: '#0D1728', padding: '72px 20px' }}>
        <div style={{ maxWidth: 1180, margin: '0 auto' }}>
          <div style={{ color: '#C5B8FF', fontSize: 12, fontWeight: 950 }}>CURRICULUM MODEL</div>
          <h2 style={{ fontSize: 'clamp(38px,6vw,58px)', lineHeight: 1, margin: '10px 0 22px' }}>Aridon has organized the public teaching into a source-linked path.</h2>
          <div style={{ display: 'grid', gap: 10 }}>
            {codieModules.map((module, index) => (
              <article key={module.id} style={{ ...card, display: 'grid', gridTemplateColumns: '54px minmax(0,1fr)', gap: 14 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, display: 'grid', placeItems: 'center', background: '#9EF0CF', color: '#07130F', fontWeight: 950 }}>{index + 1}</div>
                <div>
                  <strong style={{ fontSize: 21 }}>{module.title}</strong>
                  <p style={{ color: '#AEBBD0', lineHeight: 1.55, margin: '5px 0 8px' }}>{module.promise}</p>
                  <div style={{ color: '#9EF0CF', fontSize: 13 }}><strong>Aridon extension:</strong> {module.aridonExtension}</div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section style={{ background: '#F4F1E9', color: '#171717', padding: '72px 20px' }}>
        <div style={{ maxWidth: 1080, margin: '0 auto' }}>
          <div style={{ fontSize: 12, fontWeight: 950 }}>REVENUE UPSIDE - SCENARIO, NOT A FORECAST</div>
          <h2 style={{ fontSize: 'clamp(38px,6vw,58px)', lineHeight: 1, margin: '10px 0 18px' }}>The leverage comes from tiny conversion and retention improvements across a very large audience.</h2>
          <p style={{ color: '#5D5951', lineHeight: 1.7, fontSize: 17 }}>Contrarian Thinking publicly says its newsletters reach more than one million weekly readers. If an interactive Aridon teaching path created just 0.02% to 0.05% incremental conversion in a campaign, that would equal roughly 200 to 500 additional buyers. At a hypothetical $500 first purchase, that is $100,000 to $250,000 in incremental gross sales for that campaign. At a hypothetical $2,000 offer, it becomes $400,000 to $1,000,000. These are illustrations only, not predictions. The larger recurring opportunity may be retention, Academy activation, advisory upsell, deal-tool licensing and staff time saved.</p>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 18 }}>
            <Link href="/partners/codie-sanchez/teacher" style={{ ...mint, background: '#171717', color: '#fff' }}>Open the Tutor Demo</Link>
            <Link href="/acquisitions" style={{ ...outline, borderColor: '#555', color: '#171717' }}>Open Deal Analyzer</Link>
          </div>
        </div>
      </section>

      <section style={{ maxWidth: 1080, margin: '0 auto', padding: '52px 20px 76px' }}>
        <p style={{ color: '#8392A9', fontSize: 12, lineHeight: 1.6 }}>This is an internal/proposed partnership demonstration. Aridon is not affiliated with, endorsed by, or partnered with Codie Sanchez or Contrarian Thinking. Public source material is summarized for analysis and prototype teaching. Exact photos, cloned voices, proprietary course materials and non-public content should only be added with authorization.</p>
        <details style={{ marginTop: 12 }}>
          <summary style={{ cursor: 'pointer', color: '#9EF0CF', fontWeight: 900 }}>Public source set used for the prototype</summary>
          <div style={{ display: 'grid', gap: 8, marginTop: 12 }}>
            {codieSources.map((source) => <a key={source.id} href={source.url} target="_blank" rel="noreferrer" style={{ color: '#C8D5E6', lineHeight: 1.5 }}>{source.title} - {source.note}</a>)}
          </div>
        </details>
      </section>

      <style>{`@media(max-width:820px){.hero-grid{grid-template-columns:1fr !important}}`}</style>
    </main>
  );
}
