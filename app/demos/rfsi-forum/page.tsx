import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'RFSI Forum | Aridon Opportunity Review',
  description: 'A public-information Aridon opportunity review for Regenerative Food Systems Investment and the 2026 RFSI Forum.',
  robots: { index: false, follow: false, googleBot: { index: false, follow: false } },
};

const findings = [
  {
    title: 'Homepage event message is behind the live 2026 program',
    detail: 'RFSI already has the 2026 Forum scheduled for October 7-8 in Denver, while the main homepage still tells visitors to stay tuned for Fall 2026 dates. Aridon can continuously compare live event facts across pages and flag contradictions before they cost registrations or confidence.',
  },
  {
    title: 'Deadline-sensitive content needs automatic monitoring',
    detail: 'The 2026 Forum page still displays an August 14 farmer-scholarship deadline. Aridon can watch dates, applications, inventory, sponsor windows and registration milestones and create an approval-ready update queue when a deadline passes.',
  },
  {
    title: 'RFSI is operating several audiences at once',
    detail: 'Investors, fund managers, farmers, ranchers, startups, food companies, service providers, sponsors, speakers and workshop attendees all have different next actions. Aridon can segment these groups and run separate follow-up pipelines instead of treating every contact like the same lead.',
  },
  {
    title: 'The Forum creates valuable relationship data that should survive the event',
    detail: 'Registrations, sponsor conversations, speaker relationships, investment interests and introductions can become a persistent Company Brain. Aridon can turn event activity into structured follow-up, deal-flow intelligence and next-year growth instead of letting it disappear into inboxes and spreadsheets.',
  },
];

const systems = [
  ['Event Command Center', 'One operating view for registrations, speakers, sponsors, agenda dependencies, workshops, tour logistics and deadlines.'],
  ['Audience Intelligence', 'Segment family offices, funds, lenders, farmers, founders, corporates and service providers by goals, interests and follow-up priority.'],
  ['Sponsor Revenue Pipeline', 'Track sponsor targets, outreach, proposals, follow-up clocks, commitments, deliverables and renewal opportunities.'],
  ['Registration Recovery', 'Identify abandoned or aging registration interest and prepare owner-approved follow-up before the event window closes.'],
  ['Content Freshness Sentinel', 'Watch event pages for stale dates, expired applications, contradictory language, missing descriptions and broken conversion paths.'],
  ['Relationship & Deal-Flow Brain', 'Capture introductions, investment themes, capital needs and next steps so RFSI can create more value between events.'],
  ['Executive Morning Brief', 'Give leadership one concise daily view of what changed, what is at risk, what needs approval and what can create revenue or impact next.'],
  ['Post-Forum Follow-Up Engine', 'Turn attendee and sponsor activity into structured 24-hour, 7-day, 30-day and next-event follow-up plans.'],
];

const runway = [
  ['Now', 'Clean the public conversion path', 'Sync 2026 dates across the homepage and Forum pages, retire expired deadline language, verify every registration and sponsor CTA, and establish one source of truth.'],
  ['Next 2 weeks', 'Build the operating pipelines', 'Create separate registration, sponsor, speaker, investor, farmer/startup and partner pipelines with ownership, priority and next-action clocks.'],
  ['September', 'Run the event from a live command center', 'Track registration momentum, sponsor fulfillment, agenda dependencies, communications, high-value attendees and unresolved blockers in one executive view.'],
  ['Forum week', 'Protect the experience and capture intelligence', 'Use mobile-ready briefs for schedule changes, VIP relationships, introductions, commitments and follow-up notes while the event is happening.'],
  ['After October 8', 'Convert two days into twelve months of value', 'Generate attendee follow-up, sponsor reporting, relationship maps, content opportunities, deal-flow next steps and a 2027 growth brief.'],
];

const brief = [
  'Conversion: main homepage still uses a pre-announcement message even though the October 7-8 Denver Forum is live. Recommend updating the primary homepage CTA and event date immediately.',
  'Deadline: farmer scholarship language references an August 14 deadline. Recommend closing or replacing the application state and preserving a waitlist or next-year interest capture.',
  'Revenue: create a sponsor pipeline that ranks open opportunities by fit, package level, relationship strength, next action and days since last contact.',
  'Audience: separate investors, farmers/startups, sponsors, speakers and service providers so each group receives a relevant journey instead of generic event follow-up.',
  'Operations: add an approval queue for agenda changes, sponsor deliverables, speaker dependencies and attendee communications that require a human decision.',
  'Long-term value: capture investment interests and introductions into a searchable relationship graph so RFSI becomes more useful between annual events.',
];

export default function RfsiForumDemo() {
  return (
    <main style={{ minHeight: '100vh', background: '#F4F0E8', color: '#172018', fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
      <div style={{ maxWidth: 1120, margin: '0 auto', padding: '24px 20px 72px' }}>
        <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14, flexWrap: 'wrap', marginBottom: 24 }}>
          <Link href="/business-os" style={{ color: '#172018', textDecoration: 'none', fontWeight: 950, letterSpacing: '.04em' }}>ARIDON · BUSINESS OS</Link>
          <span style={{ fontSize: 12, fontWeight: 900, padding: '8px 12px', borderRadius: 999, border: '1px solid #BFC8B7', background: '#EEF4E9' }}>PUBLIC-INFORMATION OPPORTUNITY REVIEW · AUG 15, 2026</span>
        </header>

        <section style={{ background: '#142419', color: '#F7FAF5', borderRadius: 28, padding: 'clamp(28px,5vw,58px)', marginBottom: 18 }}>
          <div style={{ color: '#AEE8A6', fontSize: 12, fontWeight: 950, letterSpacing: '.11em' }}>REGENERATIVE FOOD SYSTEMS INVESTMENT</div>
          <h1 style={{ fontSize: 'clamp(42px,7vw,78px)', lineHeight: .95, letterSpacing: '-.045em', margin: '14px 0 20px', maxWidth: 920 }}>Aridon can become the operating layer behind the RFSI Forum.</h1>
          <p style={{ maxWidth: 860, color: '#D2DED2', fontSize: 19, lineHeight: 1.68, marginBottom: 12 }}>RFSI is coordinating a multi-sided ecosystem of capital, farmers, food businesses, sponsors, speakers and service providers. The 2026 Forum is scheduled for October 7-8 in Denver. Aridon can help turn that complexity into one controlled operating system for growth, follow-up and execution.</p>
          <p style={{ maxWidth: 860, color: '#AFC0B1', lineHeight: 1.62 }}>This demonstration was prepared from publicly available RFSI website information. It is not an affiliation, endorsement, or claim of access to RFSI private data.</p>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 22 }}>
            <a href="#findings" style={{ background: '#AEE8A6', color: '#0E1A12', borderRadius: 11, padding: '13px 16px', textDecoration: 'none', fontWeight: 950 }}>See What Aridon Found</a>
            <a href="https://rfsi-forum.com/2026-rfsi-forum/" target="_blank" rel="noreferrer" style={{ border: '1px solid #647869', color: '#F7FAF5', borderRadius: 11, padding: '13px 16px', textDecoration: 'none', fontWeight: 850 }}>View RFSI 2026 Forum</a>
          </div>
        </section>

        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 12, marginBottom: 18 }}>
          {[
            ['EVENT', 'October 7-8, 2026', 'Denver Performing Arts Complex'],
            ['AUDIENCE', 'Capital + agriculture', 'Investors, farmers, funds, lenders, food companies and partners'],
            ['ARIDON ROLE', 'Coordination + growth', 'Keep the event current, organized, measurable and followed through'],
          ].map(([label, title, text]) => <article key={label} style={{ background: '#fff', border: '1px solid #D8D3C7', borderRadius: 18, padding: 19 }}><div style={{ fontSize: 11, fontWeight: 950, color: '#687062' }}>{label}</div><h2 style={{ margin: '7px 0', fontSize: 23 }}>{title}</h2><p style={{ margin: 0, color: '#64625B', lineHeight: 1.5 }}>{text}</p></article>)}
        </section>

        <section id="findings" style={{ background: '#fff', border: '1px solid #D8D3C7', borderRadius: 22, padding: 23, marginBottom: 18, scrollMarginTop: 20 }}>
          <div style={{ color: '#2C6B47', fontSize: 12, fontWeight: 950, letterSpacing: '.09em' }}>WHAT ARIDON FOUND FIRST</div>
          <h2 style={{ fontSize: 34, margin: '8px 0 7px' }}>Four places where an AI operating layer can help immediately.</h2>
          <p style={{ color: '#68645C', lineHeight: 1.62, maxWidth: 820 }}>These are operational opportunities, not criticism of the RFSI mission or team. They show where a system that watches continuously can remove manual burden and protect conversion.</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(250px,1fr))', gap: 11, marginTop: 16 }}>
            {findings.map((item, i) => <article key={item.title} style={{ background: '#F7F5EF', borderRadius: 15, padding: 17 }}><div style={{ fontSize: 12, fontWeight: 950, color: '#2C6B47' }}>{String(i + 1).padStart(2, '0')}</div><h3 style={{ fontSize: 19, margin: '7px 0 7px' }}>{item.title}</h3><p style={{ margin: 0, color: '#5F5B54', lineHeight: 1.58 }}>{item.detail}</p></article>)}
          </div>
        </section>

        <section style={{ background: '#172018', color: '#fff', borderRadius: 22, padding: 24, marginBottom: 18 }}>
          <div style={{ color: '#AEE8A6', fontSize: 12, fontWeight: 950, letterSpacing: '.09em' }}>WHAT ARIDON WOULD RUN</div>
          <h2 style={{ fontSize: 36, margin: '8px 0 16px' }}>A business OS for the Forum, not another dashboard.</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(245px,1fr))', gap: 10 }}>
            {systems.map(([title, text]) => <article key={title} style={{ border: '1px solid #38503E', background: '#1D2C21', borderRadius: 15, padding: 16 }}><strong style={{ display: 'block', color: '#EAF5E9', fontSize: 17 }}>{title}</strong><p style={{ color: '#BDCCBE', lineHeight: 1.55, marginBottom: 0 }}>{text}</p></article>)}
          </div>
        </section>

        <section style={{ background: '#fff', border: '1px solid #D8D3C7', borderRadius: 22, padding: 23, marginBottom: 18 }}>
          <div style={{ color: '#2C6B47', fontSize: 12, fontWeight: 950, letterSpacing: '.09em' }}>RUNWAY TO OCTOBER</div>
          <h2 style={{ fontSize: 34, margin: '8px 0 16px' }}>How Aridon could help before, during and after the Forum.</h2>
          <div style={{ display: 'grid', gap: 9 }}>
            {runway.map(([when, title, text]) => <div key={when} style={{ display: 'grid', gridTemplateColumns: 'minmax(90px,.3fr) minmax(190px,.75fr) minmax(0,1.7fr)', gap: 14, alignItems: 'start', background: '#F7F5EF', borderRadius: 14, padding: 15 }}><strong style={{ color: '#2C6B47' }}>{when}</strong><strong>{title}</strong><span style={{ color: '#605D56', lineHeight: 1.5 }}>{text}</span></div>)}
          </div>
        </section>

        <section style={{ background: '#0E1722', color: '#fff', borderRadius: 22, padding: 24, marginBottom: 18 }}>
          <div style={{ color: '#A8D8FF', fontSize: 12, fontWeight: 950, letterSpacing: '.09em' }}>SAMPLE ARIDON CEO BRIEF FOR RFSI</div>
          <h2 style={{ fontSize: 34, margin: '8px 0 16px' }}>The six things leadership should see today.</h2>
          <div style={{ display: 'grid', gap: 9 }}>
            {brief.map((item, i) => <div key={item} style={{ display: 'grid', gridTemplateColumns: '34px 1fr', gap: 10, background: '#152333', border: '1px solid #29405A', borderRadius: 13, padding: 14, color: '#D6E1ED', lineHeight: 1.55 }}><strong style={{ color: '#A8D8FF' }}>{i + 1}</strong><span>{item}</span></div>)}
          </div>
        </section>

        <section style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.5fr) minmax(260px,.7fr)', gap: 16, background: '#fff', border: '1px solid #D8D3C7', borderRadius: 22, padding: 24 }}>
          <div>
            <div style={{ color: '#2C6B47', fontSize: 12, fontWeight: 950, letterSpacing: '.09em' }}>THE BUSINESS CASE</div>
            <h2 style={{ fontSize: 34, margin: '8px 0' }}>Aridon helps RFSI protect the event they already built and multiply its value.</h2>
            <p style={{ color: '#625E56', lineHeight: 1.65 }}>The win is not replacing RFSI's team. The win is giving that team an always-on executive and execution layer that catches stale information, organizes relationships, keeps follow-up moving, protects sponsor and registration revenue, and converts event knowledge into a durable institutional asset.</p>
          </div>
          <div style={{ display: 'grid', gap: 9, alignContent: 'center' }}>
            <Link href="/business-os/subscribe" style={{ background: '#172018', color: '#fff', borderRadius: 11, padding: '13px 15px', textAlign: 'center', textDecoration: 'none', fontWeight: 950 }}>See Aridon Plans</Link>
            <a href="https://rfsi-forum.com/contact-us/" target="_blank" rel="noreferrer" style={{ border: '1px solid #CFC8BC', color: '#172018', borderRadius: 11, padding: '12px 15px', textAlign: 'center', textDecoration: 'none', fontWeight: 850 }}>RFSI Contact Page</a>
          </div>
        </section>

        <footer style={{ marginTop: 20, color: '#777067', fontSize: 12, lineHeight: 1.6 }}>Unofficial Aridon opportunity review based only on publicly available information from rfsi-forum.com as reviewed August 15, 2026. No private RFSI systems or data were accessed. Facts and deadlines should be revalidated with RFSI before outreach or implementation.</footer>
      </div>
    </main>
  );
}
