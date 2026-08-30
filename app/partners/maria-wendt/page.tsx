import Link from 'next/link';
import type { CSSProperties } from 'react';
import { mariaModules, mariaSources } from '../../../lib/mariaWendtCurriculum';

const card: CSSProperties = { background: '#0D1728', border: '1px solid #2B3D5B', borderRadius: 18, padding: 18 };
const pink: CSSProperties = { display: 'inline-block', background: '#F4B8D5', color: '#171019', textDecoration: 'none', borderRadius: 11, padding: '12px 15px', fontWeight: 950 };
const outline: CSSProperties = { display: 'inline-block', border: '1px solid #546681', color: '#EDF3FA', textDecoration: 'none', borderRadius: 11, padding: '11px 14px', fontWeight: 900 };

export default function MariaWendtPartnerPage() {
  const research = [
    ['Large course catalog', 'MariaWendt.com currently exposes a broad library of business products across digital products, Instagram, YouTube, copywriting, email, ads, automation, launches, hiring, mindset and coaching.'],
    ['Wide price ladder', 'The public catalog ranges from low-cost worksheets and tactical tools through larger courses and a coaching community, creating many natural entry and next-step offers.'],
    ['Social attention engine', 'Maria uses high-volume social content and direct-response calls to action to move people from attention toward products, bundles and automated follow-up.'],
    ['Owned commerce hub', 'The website, product shop, checkout flows, help center and email capture give the business owned infrastructure beyond social platforms.'],
    ['YouTube teaching layer', 'Her public YouTube library expands the education funnel with searchable, longer-form business and creator content.'],
    ['Coaching and implementation', 'The paid coaching group and Get Clients Now program add live support, Q&A, community and implementation help after a course purchase.'],
  ];

  const automation = [
    ['Public Knowledge Indexer', 'Continuously organize approved public pages, product descriptions, FAQs, videos and support material into a source-linked knowledge graph.'],
    ['Live AI Teacher', 'Answer questions by voice or text, teach the approved curriculum, quiz the learner and explain the next step through an animated or live digital human.'],
    ['Student Router', 'Ask what the learner wants to accomplish, determine the right starting lesson and route them to the most relevant course or free resource.'],
    ['Offer Ladder Engine', 'Map entry products, core courses, bundles, coaching and higher-level services so the system can recommend the next logical offer rather than showing everything at once.'],
    ['Content Factory', 'Turn approved long-form teaching into reels, hooks, emails, FAQs, worksheets, quizzes and launch assets while final publishing stays behind approval.'],
    ['Launch Command', 'Build campaign calendars, creative checklists, offer sequencing, approvals and post-launch analysis for focused revenue events.'],
    ['Audience Intelligence', 'Connect questions, content responses, purchases and course progress to show what the audience wants next and where students are getting stuck.'],
    ['Lifecycle + Support', 'Automate routine follow-up, onboarding and source-grounded support, then escalate unusual or high-value questions to Maria or her team.'],
    ['Revenue Attribution', 'Track which content, lesson, email, product recommendation and campaign actually leads to purchases instead of measuring attention alone.'],
    ['Creator Operating System', 'Give Maria and her team one view of products, students, campaigns, content, support questions, experiments, revenue and the work Aridon can automate next.'],
  ];

  return (
    <main style={{ minHeight: '100vh', background: '#07101D', color: '#F8FAFC', fontFamily: 'Arial,sans-serif' }}>
      <section style={{ maxWidth: 1180, margin: '0 auto', padding: '24px 20px 72px' }}>
        <nav style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <Link href="/creator-teacher" style={{ color: '#F8FAFC', textDecoration: 'none', fontWeight: 950 }}>ARIDON · CREATOR PARTNER LAB</Link>
          <div style={{ display: 'flex', gap: 9, flexWrap: 'wrap' }}>
            <Link href="/business-os/growth-command" style={outline}>Growth Command</Link>
            <Link href="/partners/maria-wendt/teacher" style={pink}>Open Teaching Platform</Link>
          </div>
        </nav>

        <div className="hero-grid" style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.25fr) minmax(270px,.75fr)', gap: 24, alignItems: 'center', paddingTop: 56 }}>
          <div>
            <div style={{ color: '#F4B8D5', fontSize: 12, fontWeight: 950, letterSpacing: 1 }}>MARIA WENDT + ARIDON · PROPOSED CREATOR OS DEMO</div>
            <h1 style={{ fontSize: 'clamp(48px,8vw,86px)', lineHeight: .93, letterSpacing: -4, margin: '14px 0 20px' }}>Turn a giant course library into a teacher that never stops helping students implement.</h1>
            <p style={{ color: '#BBC7D8', fontSize: 20, lineHeight: 1.68, maxWidth: 880 }}>Maria already has the audience, products, teaching, funnels, coaching and customer proof. Aridon can become the operating layer underneath them: a source-grounded AI teacher, student router, offer ladder, content and launch engine, support system and revenue attribution layer.</p>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 19 }}>
              <Link href="/partners/maria-wendt/teacher" style={pink}>Create / Open Teaching Platform</Link>
              <Link href="/business-os/growth-command" style={outline}>Open Growth Command</Link>
            </div>
          </div>

          <aside style={{ ...card, background: 'linear-gradient(160deg,#32243A,#101929)' }}>
            <div style={{ width: 150, height: 150, borderRadius: '50%', display: 'grid', placeItems: 'center', margin: '0 auto 16px', border: '1px solid #8B6C81', background: '#1D1724', fontSize: 48, fontWeight: 950 }}>MW</div>
            <div style={{ textAlign: 'center' }}>
              <strong style={{ fontSize: 23 }}>Authorized Creator Avatar Slot</strong>
              <p style={{ color: '#C6B7C4', lineHeight: 1.55, fontSize: 13 }}>The working demo uses an Aridon avatar and synthetic voice. It does not copy Maria’s voice or imply a partnership. If Maria approves, her licensed visual assets, approved voice and private curriculum can be connected to this same teaching engine.</p>
            </div>
          </aside>
        </div>
      </section>

      <section style={{ background: '#F7F1F4', color: '#1A1518', padding: '72px 20px' }}>
        <div style={{ maxWidth: 1180, margin: '0 auto' }}>
          <div style={{ fontSize: 12, fontWeight: 950 }}>WHAT THE PUBLIC BUSINESS RESEARCH SHOWS</div>
          <h2 style={{ fontSize: 'clamp(38px,6vw,60px)', lineHeight: 1, margin: '10px 0 22px' }}>This is already a creator ecosystem. Aridon connects the pieces.</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(255px,1fr))', gap: 11 }}>
            {research.map(([name, detail]) => (
              <article key={name} style={{ background: '#fff', border: '1px solid #DED1D8', borderRadius: 16, padding: 17 }}>
                <strong style={{ fontSize: 20 }}>{name}</strong>
                <p style={{ color: '#62565E', lineHeight: 1.6, marginBottom: 0 }}>{detail}</p>
              </article>
            ))}
          </div>
          <p style={{ color: '#74666F', lineHeight: 1.65, marginTop: 18 }}>Research conclusion: attention → low-friction product → core training → automation and nurture → coaching / implementation → next offer. The largest Aridon opportunity is to make that journey adaptive to each learner instead of forcing every person through the same menu.</p>
        </div>
      </section>

      <section style={{ maxWidth: 1180, margin: '0 auto', padding: '72px 20px' }}>
        <div style={{ color: '#F4B8D5', fontSize: 12, fontWeight: 950 }}>ARIDON AUTOMATION MAP</div>
        <h2 style={{ fontSize: 'clamp(38px,6vw,60px)', lineHeight: 1, margin: '10px 0 24px' }}>One brain across teaching, products, launches and support.</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(270px,1fr))', gap: 11 }}>
          {automation.map(([name, detail]) => (
            <article key={name} style={card}>
              <strong style={{ color: '#F4B8D5', fontSize: 19 }}>{name}</strong>
              <p style={{ color: '#C1CCDC', lineHeight: 1.6, marginBottom: 0 }}>{detail}</p>
            </article>
          ))}
        </div>
      </section>

      <section style={{ background: '#0D1728', padding: '72px 20px' }}>
        <div style={{ maxWidth: 1180, margin: '0 auto' }}>
          <div style={{ color: '#B9CFFF', fontSize: 12, fontWeight: 950 }}>PUBLIC CURRICULUM MODEL</div>
          <h2 style={{ fontSize: 'clamp(38px,6vw,58px)', lineHeight: 1, margin: '10px 0 22px' }}>Aridon organized the public teaching into an interactive implementation path.</h2>
          <div style={{ display: 'grid', gap: 10 }}>
            {mariaModules.map((module, index) => (
              <article key={module.id} style={{ ...card, display: 'grid', gridTemplateColumns: '54px minmax(0,1fr)', gap: 14 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, display: 'grid', placeItems: 'center', background: '#F4B8D5', color: '#171019', fontWeight: 950 }}>{index + 1}</div>
                <div>
                  <strong style={{ fontSize: 21 }}>{module.title}</strong>
                  <p style={{ color: '#AEBBD0', lineHeight: 1.55, margin: '5px 0 8px' }}>{module.promise}</p>
                  <div style={{ color: '#F4B8D5', fontSize: 13 }}><strong>Aridon extension:</strong> {module.aridonExtension}</div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section style={{ background: '#F7F1F4', color: '#1A1518', padding: '72px 20px' }}>
        <div style={{ maxWidth: 1080, margin: '0 auto' }}>
          <div style={{ fontSize: 12, fontWeight: 950 }}>REVENUE LEVERS · SCENARIO LOGIC, NOT A FORECAST</div>
          <h2 style={{ fontSize: 'clamp(38px,6vw,58px)', lineHeight: 1, margin: '10px 0 18px' }}>The leverage is not only more courses. It is helping more people buy the right thing and implement it.</h2>
          <p style={{ color: '#62565E', lineHeight: 1.7, fontSize: 17 }}>Maria’s public site says nearly 100,000 students have taken her business and marketing courses. A personalized teacher can potentially create value through better product routing, higher completion, faster implementation, lower repetitive support load, smarter cross-sells, more coaching conversions and stronger retention. For illustration, if a reachable audience of 100,000 people produced only 250 incremental purchases of a $197 offer, gross sales would be $49,250; 1,000 incremental purchases would be $197,000. Those figures are simple scenario math, not predictions, and real results would need to be measured in a controlled pilot.</p>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 18 }}>
            <Link href="/partners/maria-wendt/teacher" style={{ ...pink, background: '#1A1518', color: '#fff' }}>Open the Live Tutor</Link>
            <Link href="/business-os/growth-command" style={{ ...outline, borderColor: '#62565E', color: '#1A1518' }}>Open Growth Command</Link>
          </div>
        </div>
      </section>

      <section style={{ maxWidth: 1080, margin: '0 auto', padding: '52px 20px 76px' }}>
        <p style={{ color: '#8392A9', fontSize: 12, lineHeight: 1.6 }}>This is an internal/proposed partnership demonstration. Aridon is not affiliated with, endorsed by, or partnered with Maria Wendt. Public source material is summarized for analysis and prototype teaching. Exact likenesses, cloned voices, proprietary courses, templates and non-public materials should only be added with authorization.</p>
        <details style={{ marginTop: 12 }}>
          <summary style={{ cursor: 'pointer', color: '#F4B8D5', fontWeight: 900 }}>Public source set used for the prototype</summary>
          <div style={{ display: 'grid', gap: 8, marginTop: 12 }}>{mariaSources.map((source) => <a key={source.id} href={source.url} target="_blank" rel="noreferrer" style={{ color: '#C8D5E6', lineHeight: 1.5 }}>{source.title} · {source.note}</a>)}</div>
        </details>
      </section>

      <style>{`@media(max-width:820px){.hero-grid{grid-template-columns:1fr !important}}`}</style>
    </main>
  );
}
