import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Rodale Institute 10 Million Acre Solution | Aridon Review',
  description: 'Aridon opportunity review for Rodale Institute’s 10 Million Acre Solution, including campaign presentation, operating model, technology, and financial growth opportunities.',
  robots: { index: false, follow: false, googleBot: { index: false, follow: false } },
};

const findings = [
  {
    title: 'The campaign is powerful, but the donor journey is too broad',
    detail: 'The headline is strong: $139 million to catalyze 10 million new organic and regenerative organic acres by 2030. The next step should immediately branch by funder type and intent: major donor, family office or DAF, foundation, corporate partner, healthcare institution, food company, landowner, or public-sector partner. Aridon can route each audience into a different cultivation path instead of one general interest form.',
  },
  {
    title: 'Progress should be visible as a live operating scoreboard',
    detail: 'Rodale reported 133,061 acres transitioning in its 2025 year-in-review, but the 10 Million Acre campaign page does not present a live progress-to-goal dashboard. Aridon can maintain an Acre Impact Ledger showing verified acres, farmers served, commitments, funds raised, funds deployed, partner attribution, and progress by geography.',
  },
  {
    title: 'Search and AI discovery are seeing broken goal numbers',
    detail: 'Rodale’s 2030 Goals page is currently parsed by web crawlers with counters such as 0 research trials, 0K people educated, 0M consumers reached, and 0M acres impacted. Those may animate correctly in a browser, but search engines and AI systems can ingest the zero-value server text. Aridon’s indexing sentinel can detect and fix this before the wrong numbers spread.',
  },
  {
    title: 'Content quality needs an automated consistency check',
    detail: 'The 2030 Goals page contains duplicated sections in the crawlable text, and the Global Education block repeats Farmer Consulting language. Older Rodale content also references a previous one-million-acre-by-2035 target while the current campaign is ten million acres by 2030. Aridon can flag stale or conflicting strategy language and keep one current source of truth.',
  },
];

const financial = [
  ['2024 total revenue', '$14.67M', 'Rodale’s 2024 annual report shows total revenue, gains, and support of about $14.67 million.'],
  ['2024 total expenses', '$15.41M', 'Expenses exceeded revenue by roughly $733,000 in 2024, making fundraising growth and operating leverage especially important.'],
  ['Contributions + corporate grants', '$8.30M', 'This category fell from about $11.96 million in 2023, a decline of roughly 31%. A stronger major-gift and corporate cultivation engine can help rebuild this channel.'],
  ['Government grants', '$5.30M', 'Federal, state, and local grants increased from about $4.52 million in 2023, showing a channel worth scaling and coordinating more systematically.'],
  ['Campaign goal', '$139M', 'Mission $91M + Infrastructure $40M + Legacy $8M. Over five years, the campaign implies an average capital-raising pace of about $27.8 million per year.'],
  ['Technology allocation', '$3.2M', 'Rodale specifically calls for integrated systems, AI-enabled tools, and real-time outcome tracking. This is the clearest direct fit for an Aridon operating layer.'],
];

const systems = [
  ['Campaign Command Center', 'One live view of the $139M goal, commitments, proposals, asks, grants, major donors, corporate partners, infrastructure funding, endowment funding, deadlines, and next actions.'],
  ['Acre Impact Ledger', 'Track verified acres in transition, certified acres, farmers served, geography, partner attribution, projected outcomes, and evidence behind each reported milestone.'],
  ['Funder Intelligence', 'Segment family offices, DAF holders, foundations, corporations, food companies, healthcare systems, universities, government programs, and landowners by fit and next-best action.'],
  ['Major-Gift Pipeline', 'Score prospects by giving capacity, mission alignment, relationship strength, campaign priority, ask readiness, last touch, and recommended next action.'],
  ['Corporate Partnership Engine', 'Build larger custom campaign partnerships above the normal corporate program, tied to research, farmer transition, education, facilities, technology, and measurable impact.'],
  ['Grant Radar', 'Continuously identify federal, state, foundation, climate, agriculture, health, education, workforce, and rural-development funding that maps to each campaign pillar.'],
  ['Content & Indexing Sentinel', 'Watch campaign pages, impact reports, goals, PDFs, donation paths, search indexing, AI-readable content, stale claims, broken counters, and conflicting targets.'],
  ['Executive Brief', 'Give Rodale leadership a daily or weekly brief covering fundraising velocity, acres, donor movement, partnership risks, grant deadlines, campaign bottlenecks, and approvals.'],
  ['Stewardship Automation', 'Turn every gift or commitment into a structured reporting rhythm so donors see what changed because of their support and are cultivated toward renewal or expansion.'],
  ['Institutional Revenue Engine', 'Package consulting, education, research collaboration, and transition support for mission-aligned food companies, healthcare systems, universities, and large landholders without undermining subsidized farmer services.'],
];

const presentation = [
  ['Lead with three numbers', '10M acres · $139M campaign · 2030 deadline. Then immediately show current progress and the gap remaining.'],
  ['Show the scale math', 'A five-year $139M campaign averages $27.8M per year. A ten-million-acre target averages two million new acres per year. Put the required scale in plain sight.'],
  ['Create funder-specific paths', 'Replace one broad conversion journey with tailored entry points for major donors, corporate partners, foundations, landowners, institutions, and people who simply want to learn or promote.'],
  ['Turn the case into proof', 'Surface the strongest existing evidence earlier: 2025 acreage progress, farmer count, research depth, partnerships, media reach, and concrete farmer economics.'],
  ['Make every dollar legible', 'For each campaign pillar, show what a gift enables, the milestone it advances, how it will be measured, and when the supporter receives an impact update.'],
  ['Add a live campaign dashboard', 'Do not make a prospective $1M donor hunt through PDFs for momentum. Give them an elegant current scoreboard with dollars committed, acres influenced, farmers served, research milestones, and facilities progress.'],
];

const roadmap = [
  ['First 30 days', 'Clean the digital case', 'Fix crawler-visible zero counters and duplicated copy, reconcile stale acreage targets, map every campaign CTA, add funder segmentation, and establish a single campaign data model.'],
  ['Days 30–60', 'Build the capital engine', 'Create major-donor, corporate, foundation, grant, institutional, and landowner pipelines. Import active relationships, assign ownership, establish next-action clocks, and create an approval-controlled outreach queue.'],
  ['Days 60–90', 'Launch the Acre Impact Ledger', 'Connect farmer consulting and campaign data to a verified impact dashboard that ties dollars, partners, acres, geography, and outcomes together.'],
  ['Quarter 2+', 'Scale the network effect', 'Use partner success and geographic proof to identify the next clusters of farmers, brands, healthcare systems, universities, funders, and institutional landowners that can accelerate adoption.'],
];

export default function RodaleTenMillionAcresDemo() {
  return (
    <main style={{ minHeight: '100vh', background: '#F3F1E7', color: '#172218', fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
      <div style={{ maxWidth: 1140, margin: '0 auto', padding: '24px 20px 74px' }}>
        <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14, flexWrap: 'wrap', marginBottom: 24 }}>
          <Link href="/business-os" style={{ color: '#172218', textDecoration: 'none', fontWeight: 950, letterSpacing: '.04em' }}>ARIDON · BUSINESS OS</Link>
          <span style={{ fontSize: 12, fontWeight: 900, padding: '8px 12px', borderRadius: 999, border: '1px solid #B9C5AF', background: '#EDF4E8' }}>PUBLIC-INFORMATION OPPORTUNITY REVIEW · AUG 15, 2026</span>
        </header>

        <section style={{ background: '#18331D', color: '#F7FAF3', borderRadius: 28, padding: 'clamp(28px,5vw,60px)', marginBottom: 18 }}>
          <div style={{ color: '#C5ED79', fontSize: 12, fontWeight: 950, letterSpacing: '.11em' }}>RODALE INSTITUTE · THE 10 MILLION ACRE SOLUTION</div>
          <h1 style={{ fontSize: 'clamp(42px,7vw,80px)', lineHeight: .95, letterSpacing: '-.045em', margin: '14px 0 20px', maxWidth: 970 }}>The campaign is bold enough. Now the operating system has to match the ambition.</h1>
          <p style={{ maxWidth: 880, color: '#D5E0D2', fontSize: 19, lineHeight: 1.68, marginBottom: 12 }}>Rodale Institute is seeking $139 million to catalyze 10 million new organic and regenerative organic acres by 2030. Aridon can help turn that vision into a measurable capital-and-acreage operating system: stronger campaign conversion, funder intelligence, grant and corporate pipelines, live impact tracking, content consistency, and executive decision support.</p>
          <p style={{ maxWidth: 880, color: '#B7C9B7', lineHeight: 1.62 }}>This review uses only publicly available Rodale Institute information. It is an independent Aridon analysis, not an affiliation or claim of access to Rodale private systems.</p>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 22 }}>
            <a href="#findings" style={{ background: '#C5ED79', color: '#142016', borderRadius: 11, padding: '13px 16px', textDecoration: 'none', fontWeight: 950 }}>See What Aridon Found</a>
            <a href="https://rodaleinstitute.org/10millionacres/" target="_blank" rel="noreferrer" style={{ border: '1px solid #66806A', color: '#F7FAF3', borderRadius: 11, padding: '13px 16px', textDecoration: 'none', fontWeight: 850 }}>View Rodale Campaign</a>
          </div>
        </section>

        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(210px,1fr))', gap: 12, marginBottom: 18 }}>
          {[
            ['CAMPAIGN', '$139M', 'Mission $91M · Infrastructure $40M · Legacy $8M'],
            ['TARGET', '10M acres', 'New organic and regenerative organic acres by 2030'],
            ['TECHNOLOGY', '$3.2M', 'AI-enabled tools, integrated data, real-time outcome tracking'],
            ['2025 PACE', '133,061 acres', 'Rodale-reported acres transitioning during 2025'],
          ].map(([label, title, text]) => <article key={label} style={{ background: '#fff', border: '1px solid #D7D3C7', borderRadius: 18, padding: 19 }}><div style={{ fontSize: 11, fontWeight: 950, color: '#687062' }}>{label}</div><h2 style={{ margin: '7px 0', fontSize: 25 }}>{title}</h2><p style={{ margin: 0, color: '#64625B', lineHeight: 1.5 }}>{text}</p></article>)}
        </section>

        <section id="findings" style={{ background: '#fff', border: '1px solid #D7D3C7', borderRadius: 22, padding: 23, marginBottom: 18, scrollMarginTop: 20 }}>
          <div style={{ color: '#2F6C3A', fontSize: 12, fontWeight: 950, letterSpacing: '.09em' }}>PRESENTATION & DIGITAL FINDINGS</div>
          <h2 style={{ fontSize: 35, margin: '8px 0 7px' }}>The story is excellent. The conversion and data layer can be much stronger.</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(250px,1fr))', gap: 11, marginTop: 16 }}>
            {findings.map((item, i) => <article key={item.title} style={{ background: '#F7F5EF', borderRadius: 15, padding: 17 }}><div style={{ fontSize: 12, fontWeight: 950, color: '#2F6C3A' }}>{String(i + 1).padStart(2, '0')}</div><h3 style={{ fontSize: 19, margin: '7px 0' }}>{item.title}</h3><p style={{ margin: 0, color: '#5F5B54', lineHeight: 1.58 }}>{item.detail}</p></article>)}
          </div>
        </section>

        <section style={{ background: '#142119', color: '#fff', borderRadius: 22, padding: 24, marginBottom: 18 }}>
          <div style={{ color: '#C5ED79', fontSize: 12, fontWeight: 950, letterSpacing: '.09em' }}>FINANCIAL VIEW</div>
          <h2 style={{ fontSize: 36, margin: '8px 0 8px' }}>A $139M campaign requires a different fundraising machine.</h2>
          <p style={{ color: '#C2D0C3', lineHeight: 1.62, maxWidth: 890 }}>The campaign is nearly 9.5 times Rodale’s 2024 annual revenue in total. Spread across five years, the average campaign pace is about $27.8M per year, roughly 1.9 times 2024 revenue. That does not make the goal unrealistic, but it means Rodale needs capital-campaign-grade segmentation, pipeline management, stewardship, attribution, and forecasting.</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(235px,1fr))', gap: 10, marginTop: 16 }}>
            {financial.map(([label, value, text]) => <article key={label} style={{ border: '1px solid #39503E', background: '#1C2D21', borderRadius: 15, padding: 16 }}><div style={{ color: '#AFC2B2', fontSize: 11, fontWeight: 900 }}>{label.toUpperCase()}</div><strong style={{ display: 'block', color: '#F3F8F1', fontSize: 28, margin: '5px 0 7px' }}>{value}</strong><p style={{ color: '#C3D0C2', lineHeight: 1.55, marginBottom: 0 }}>{text}</p></article>)}
          </div>
          <div style={{ marginTop: 12, color: '#AFC2B2', fontSize: 12, lineHeight: 1.5 }}>Financial figures are based on Rodale Institute’s public 2024 Annual Report. The campaign’s $139M/10M-acre ratio is about $13.90 per targeted acre, but that is a storytelling ratio, not a claim that each acre directly costs $13.90 to transition.</div>
        </section>

        <section style={{ background: '#fff', border: '1px solid #D7D3C7', borderRadius: 22, padding: 23, marginBottom: 18 }}>
          <div style={{ color: '#2F6C3A', fontSize: 12, fontWeight: 950, letterSpacing: '.09em' }}>A BETTER CAMPAIGN PRESENTATION</div>
          <h2 style={{ fontSize: 35, margin: '8px 0 16px' }}>Move from “support our vision” to “choose your role in the 10-million-acre outcome.”</h2>
          <div style={{ display: 'grid', gap: 9 }}>
            {presentation.map(([title, text], i) => <div key={title} style={{ display: 'grid', gridTemplateColumns: '38px minmax(180px,.65fr) minmax(0,1.6fr)', gap: 12, background: '#F7F5EF', borderRadius: 14, padding: 15 }}><strong style={{ color: '#2F6C3A' }}>{i + 1}</strong><strong>{title}</strong><span style={{ color: '#605D56', lineHeight: 1.5 }}>{text}</span></div>)}
          </div>
        </section>

        <section style={{ background: '#172018', color: '#fff', borderRadius: 22, padding: 24, marginBottom: 18 }}>
          <div style={{ color: '#C5ED79', fontSize: 12, fontWeight: 950, letterSpacing: '.09em' }}>WHAT ARIDON WOULD ADD</div>
          <h2 style={{ fontSize: 36, margin: '8px 0 16px' }}>An operating layer for capital, acreage, partners, and proof.</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(245px,1fr))', gap: 10 }}>
            {systems.map(([title, text]) => <article key={title} style={{ border: '1px solid #38503E', background: '#1D2C21', borderRadius: 15, padding: 16 }}><strong style={{ display: 'block', color: '#F0F7ED', fontSize: 17 }}>{title}</strong><p style={{ color: '#BDCCBE', lineHeight: 1.55, marginBottom: 0 }}>{text}</p></article>)}
          </div>
        </section>

        <section style={{ background: '#fff', border: '1px solid #D7D3C7', borderRadius: 22, padding: 23, marginBottom: 18 }}>
          <div style={{ color: '#2F6C3A', fontSize: 12, fontWeight: 950, letterSpacing: '.09em' }}>THE SCALE GAP</div>
          <h2 style={{ fontSize: 35, margin: '8px 0 8px' }}>Technology is not optional if the 2030 target is literal.</h2>
          <p style={{ color: '#625E56', lineHeight: 1.65, maxWidth: 900 }}>A ten-million-acre target over five years implies an average of roughly two million new acres per year. Rodale reported 133,061 acres transitioning in 2025. If those definitions are comparable, the campaign calls for an annualized scale roughly 15 times the 2025 pace. This is directional math, not a forecast, but it explains why Rodale itself has put AI, integrated data, real-time measurement, partnerships, and organizational scale into the campaign plan.</p>
        </section>

        <section style={{ background: '#0F1923', color: '#fff', borderRadius: 22, padding: 24, marginBottom: 18 }}>
          <div style={{ color: '#A8D8FF', fontSize: 12, fontWeight: 950, letterSpacing: '.09em' }}>90-DAY ARIDON ROADMAP</div>
          <h2 style={{ fontSize: 35, margin: '8px 0 16px' }}>Start with conversion. Then build the capital-and-acreage engine.</h2>
          <div style={{ display: 'grid', gap: 9 }}>
            {roadmap.map(([when, title, text]) => <div key={when} style={{ display: 'grid', gridTemplateColumns: 'minmax(95px,.3fr) minmax(190px,.7fr) minmax(0,1.7fr)', gap: 14, background: '#152534', border: '1px solid #29405A', borderRadius: 13, padding: 14 }}><strong style={{ color: '#A8D8FF' }}>{when}</strong><strong>{title}</strong><span style={{ color: '#D2DEEA', lineHeight: 1.55 }}>{text}</span></div>)}
          </div>
        </section>

        <section style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.5fr) minmax(260px,.7fr)', gap: 16, background: '#fff', border: '1px solid #D7D3C7', borderRadius: 22, padding: 24 }}>
          <div>
            <div style={{ color: '#2F6C3A', fontSize: 12, fontWeight: 950, letterSpacing: '.09em' }}>THE ARIDON FIT</div>
            <h2 style={{ fontSize: 34, margin: '8px 0' }}>Rodale has already written the requirements for the system we should show them.</h2>
            <p style={{ color: '#625E56', lineHeight: 1.65 }}>Their own campaign calls for integrated systems, AI-enabled tools, real-time impact tracking, faster farmer adoption, and greater organizational effectiveness. Aridon should not approach Rodale as a generic website vendor. We should approach them as a technology and operating-system partner for the 10 Million Acre Solution, beginning with a measurable pilot around campaign intelligence, funder pipeline management, content/indexing quality, and the Acre Impact Ledger.</p>
          </div>
          <div style={{ display: 'grid', gap: 9, alignContent: 'center' }}>
            <Link href="/business-os/subscribe" style={{ background: '#172018', color: '#fff', borderRadius: 11, padding: '13px 15px', textAlign: 'center', textDecoration: 'none', fontWeight: 950 }}>See Aridon Business OS</Link>
            <a href="https://rodaleinstitute.org/10millionacres/" target="_blank" rel="noreferrer" style={{ border: '1px solid #CFC8BC', color: '#172018', borderRadius: 11, padding: '12px 15px', textAlign: 'center', textDecoration: 'none', fontWeight: 850 }}>Rodale 10 Million Acres</a>
          </div>
        </section>

        <footer style={{ marginTop: 20, color: '#777067', fontSize: 12, lineHeight: 1.6 }}>Unofficial Aridon opportunity review based on publicly available Rodale Institute information reviewed August 15, 2026. No private systems or donor data were accessed. Financial recommendations are strategic observations, not accounting, legal, tax, or investment advice.</footer>
      </div>
    </main>
  );
}
