import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  title: 'Aridon Stadium OS Partnership Proposal',
  robots: { index: false, follow: false, googleBot: { index: false, follow: false } },
};

type Proposal = {
  team: string;
  venue: string;
  theme: string;
  publicContext: string[];
  targets: string[];
  pilot: string[];
  metrics: string[];
  infrastructure: string[];
  nextStep: string;
};

const proposals: Record<string, Proposal> = {
  cardinals: {
    team: 'Arizona Cardinals',
    venue: 'State Farm Stadium + Paradise Ridge future headquarters',
    theme: 'Turn fan, commercial, venue and infrastructure data into one decision layer without replacing the Cardinals’ existing business-intelligence team.',
    publicContext: [
      'The Cardinals have expanded premium experiences, including field-level concepts and new hospitality offerings, while building out a dedicated business-intelligence organization.',
      'State Farm Stadium is a year-round venue with meaningful ticketing, premium, sponsorship, food-and-beverage, event and operating complexity.',
      'The organization is also planning a new headquarters and practice facility at Paradise Ridge, creating a rare opportunity to design intelligence, energy, water and operating systems before the new campus is fully built.',
    ],
    targets: [
      'Revenue Command Center: connect approved ticketing, premium, sponsorship, event and hospitality feeds into one executive operating view.',
      'Premium Experience Intelligence: identify unsold or underused inventory, renewal risk, service issues and cross-sell opportunities for premium guests.',
      'Partner Value Engine: organize activation inventory, measurable partner outcomes and renewal evidence for the corporate-partnership team.',
      'GameDay AI: provide an approval-controlled fan assistant for parking, gates, accessibility, food, merchandise, schedules and common venue questions.',
      'Venue Operations Brief: surface event-day dependencies, open issues, vendor handoffs and post-event lessons in one operations workflow.',
      'Paradise Ridge Innovation Layer: evaluate water, energy, cooling, heat mitigation and resilience options for the future headquarters campus before expensive retrofit decisions are made later.',
    ],
    pilot: [
      '90-day Founding Stadium Partner pilot.',
      'No software license fee during the pilot. The Cardinals would only cover mutually approved external integration, travel or on-site costs, if any.',
      'Start with one revenue use case, one fan/partner use case and one infrastructure or operations use case.',
      'Use public or team-approved data only. No production system access until scope, permissions and security controls are agreed in writing.',
      'No external customer/fan communications, pricing changes, commitments or consequential actions without Cardinals approval.',
      'At day 90, continue only if the agreed scorecard shows measurable value. Enterprise commercial terms would then be negotiated based on actual scope.',
    ],
    metrics: [
      'Recovered or newly identified revenue opportunities in the selected workflow.',
      'Reduction in overdue follow-up, response time or manual reporting work.',
      'Premium inventory, partner activation or event-opportunity utilization improvement.',
      'Fan-service resolution time and repeat-question deflection where the GameDay assistant is tested.',
      'Documented infrastructure savings opportunities or avoided retrofit costs for approved Paradise Ridge / venue studies.',
    ],
    infrastructure: [
      'Water-use baseline and conservation opportunity map.',
      'Energy and cooling load intelligence for high-demand venue and campus systems.',
      'Heat-mitigation and resilience planning for Arizona conditions.',
      'Evaluation framework for future Aridon / Iron Grid technologies only after engineering validation and separate approval.',
    ],
    nextStep: '45-minute scoping session with business operations, business intelligence / strategy, corporate partnerships and the appropriate stadium or Paradise Ridge infrastructure representative. If there is mutual interest, move to NDA, select the three pilot workflows and establish the baseline scorecard.',
  },
  cowboys: {
    team: 'Dallas Cowboys',
    venue: 'AT&T Stadium + The Star in Frisco',
    theme: 'Give the Cowboys a secure executive intelligence layer across one of sports’ most complex commercial ecosystems, while preserving existing systems, partner relationships and human control.',
    publicContext: [
      'The Cowboys operate a vertically integrated commercial platform spanning the team, AT&T Stadium, The Star, premium hospitality, major sponsorships, merchandising, digital media and year-round events.',
      'AT&T Stadium supports major non-NFL events, while The Star combines team headquarters, practice, business, hospitality, sports medicine and community uses.',
      'Because the Cowboys publicly state that they do not accept unsolicited ideas, this proposal is being held by Aridon and is not intended for external delivery until the Cowboys identify the appropriate business-development process or enter an NDA.',
    ],
    targets: [
      'Enterprise Revenue Command Center: approved roll-up of ticketing, premium, sponsorship, event, merchandising and digital opportunity signals.',
      'Partner Intelligence: create a measurable activation and renewal evidence layer for corporate partnerships without disrupting existing sponsor systems.',
      'AT&T Stadium 365 Engine: identify event-calendar gaps, premium hospitality opportunities and cross-sell paths across stadium uses.',
      'The Star Business Ecosystem: connect approved event, workspace, hospitality and business-development opportunity signals into one executive view.',
      'Fan and Guest AI: approval-controlled assistance for common event, parking, venue, ticket and hospitality questions.',
      'Infrastructure Intelligence: model energy, water, cooling and facility-opportunity baselines before proposing any physical technology pilots.',
    ],
    pilot: [
      '90-day Founding Stadium Partner pilot, structured only after the Cowboys direct Aridon to an accepted business-development channel.',
      'No software license fee during the pilot; mutually approved third-party or on-site costs handled separately.',
      'Begin with one high-value commercial workflow and one venue/guest workflow rather than a broad enterprise replacement project.',
      'No proprietary technical designs or confidential Aridon IP disclosed through unsolicited channels.',
      'No automated external actions without Cowboys approval.',
      'Negotiate enterprise commercial terms only after measurable value is demonstrated.',
    ],
    metrics: [
      'Qualified commercial opportunities surfaced or recovered.',
      'Reduction in manual executive reporting and follow-up latency.',
      'Improved utilization of selected premium, event or partner inventory.',
      'Guest-question resolution and operational response metrics for any approved assistant pilot.',
      'Documented facility savings opportunities or avoided operating cost in approved studies.',
    ],
    infrastructure: [
      'AT&T Stadium and The Star facility baseline analysis using only approved data.',
      'Energy, water and cooling opportunity mapping.',
      'Event-day demand forecasting for selected systems.',
      'Any physical Aridon / Iron Grid technology demonstration would require a separate engineering and commercial agreement.',
    ],
    nextStep: 'Request the Cowboys’ accepted business-development / partnership process first. After they invite a discussion, execute an NDA if appropriate, then present the full Stadium OS scope and select a tightly defined pilot.',
  },
  broncos: {
    team: 'Denver Broncos',
    venue: 'Empower Field at Mile High + planned Burnham Yard stadium development',
    theme: 'Help the Broncos design the operating intelligence layer for the next stadium before the concrete hardens, while proving immediate value at Empower Field.',
    publicContext: [
      'The Broncos are actively planning a new stadium development at Burnham Yard and have publicly emphasized partner and community collaboration.',
      'The club’s commercial organization manages partnership sales, media sales and activation across the Broncos and Empower Field at Mile High.',
      'The Broncos already support local-business partnerships and in-stadium technology, creating a strong base for a broader revenue-and-operations intelligence layer.',
    ],
    targets: [
      'New Stadium Digital Operating Blueprint: define the data, workflow and AI decision layer during Burnham Yard planning instead of bolting it on after opening.',
      'Commercial Revenue Command Center: connect approved partnership, media, premium, event and ticket opportunity signals into one executive view.',
      'Partner Value Engine: organize activation delivery, partner outcomes, renewal evidence and inventory availability.',
      'Empower Field 365 Engine: identify non-game-day event, hospitality and partnership opportunities while tracking follow-up and conversion.',
      'Fan and Guest AI: approval-controlled assistant for event-day logistics, venue questions and hospitality support.',
      'Resilient Venue Planning: evaluate future water, energy, cooling, heat/cold resilience and operating-efficiency options during stadium design.',
    ],
    pilot: [
      '90-day Founding Stadium Partner pilot.',
      'No software license fee during the pilot; mutually approved integration, travel or on-site costs handled separately.',
      'One immediate Empower Field commercial/operations workflow plus one Burnham Yard planning workflow.',
      'No replacement of existing CRM, BI or venue systems. Aridon sits above approved systems as a decision and workflow layer.',
      'No external communications, purchases, pricing changes or operational commitments without Broncos approval.',
      'At day 90, continue only if the agreed scorecard demonstrates value, then negotiate enterprise terms based on deployment scope.',
    ],
    metrics: [
      'Commercial opportunities surfaced, recovered or accelerated.',
      'Reduction in manual reporting and overdue follow-up.',
      'Partner activation / inventory utilization improvements in the chosen pilot area.',
      'Event-day or venue issue-resolution improvements where tested.',
      'Quantified design-stage savings opportunities or avoided future retrofit costs for Burnham Yard.',
    ],
    infrastructure: [
      'Design-stage water and energy baseline targets.',
      'Cooling/heating load and resilience intelligence for Colorado climate conditions.',
      'Future-proofing for sensors, AI operations, microgrids, water reuse and other systems without locking the Broncos into unvalidated technology.',
      'Any Aridon / Iron Grid physical technology pilot would be separately engineered, reviewed and approved.',
    ],
    nextStep: '45-minute meeting with commercial leadership plus the appropriate stadium-development / venue-operations representative. Agree on NDA if needed, choose the immediate Empower Field pilot and a Burnham Yard planning workstream, then establish the baseline scorecard.',
  },
};

const box = { background: '#fff', border: '1px solid #D8D8D8', borderRadius: 18, padding: 22 } as const;
const dark = { background: '#10141C', color: '#fff', borderRadius: 22, padding: 'clamp(24px,5vw,54px)' } as const;

export default function StadiumProposal({ params }: { params: { team: string } }) {
  const proposal = proposals[params.team];
  if (!proposal) notFound();

  return (
    <main style={{ minHeight: '100vh', background: '#F3F1EB', color: '#171717', fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif' }}>
      <div style={{ maxWidth: 1080, margin: '0 auto', padding: '24px 20px 72px' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 22 }}>
          <Link href="/" style={{ color: '#171717', textDecoration: 'none', fontWeight: 950 }}>ARIDON · STADIUM OS</Link>
          <span style={{ fontSize: 12, fontWeight: 900, background: '#FFF1C2', border: '1px solid #D8BD63', borderRadius: 999, padding: '7px 11px' }}>PROPOSAL FOR DISCUSSION · NO-INDEX</span>
        </header>

        <section style={dark}>
          <div style={{ color: '#9EF0CF', fontSize: 12, fontWeight: 950, letterSpacing: '.1em' }}>FOUNDING STADIUM PARTNER PROPOSAL</div>
          <h1 style={{ fontSize: 'clamp(42px,7vw,78px)', lineHeight: .96, margin: '14px 0 18px', maxWidth: 920 }}>{proposal.team} × Aridon Stadium OS</h1>
          <p style={{ color: '#C8D0D8', fontSize: 19, lineHeight: 1.65, maxWidth: 860 }}>{proposal.theme}</p>
          <div style={{ marginTop: 18, color: '#9EF0CF', fontWeight: 850 }}>{proposal.venue}</div>
        </section>

        <section style={{ ...box, marginTop: 18 }}>
          <div style={{ fontSize: 12, fontWeight: 950, color: '#24604E', letterSpacing: '.08em' }}>WHY NOW</div>
          <div style={{ display: 'grid', gap: 10, marginTop: 14 }}>{proposal.publicContext.map((x) => <p key={x} style={{ margin: 0, lineHeight: 1.65, color: '#54514A' }}>{x}</p>)}</div>
        </section>

        <section style={{ marginTop: 18 }}>
          <div style={{ fontSize: 12, fontWeight: 950, color: '#24604E', letterSpacing: '.08em', marginBottom: 10 }}>WHAT ARIDON WOULD TEST</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: 12 }}>
            {proposal.targets.map((x, i) => <article key={x} style={box}><strong>{String(i + 1).padStart(2, '0')}</strong><p style={{ marginBottom: 0, lineHeight: 1.55, color: '#56534C' }}>{x}</p></article>)}
          </div>
        </section>

        <section style={{ ...box, marginTop: 18, background: '#102033', color: '#fff', borderColor: '#2D4562' }}>
          <div style={{ fontSize: 12, fontWeight: 950, color: '#9EF0CF', letterSpacing: '.08em' }}>90-DAY PILOT STRUCTURE</div>
          <div style={{ display: 'grid', gap: 10, marginTop: 14 }}>{proposal.pilot.map((x) => <div key={x} style={{ borderTop: '1px solid #263650', paddingTop: 10, color: '#DCE4EF', lineHeight: 1.55 }}>✓ {x}</div>)}</div>
        </section>

        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: 14, marginTop: 18 }}>
          <article style={box}><div style={{ fontSize: 12, fontWeight: 950, color: '#24604E', letterSpacing: '.08em' }}>SUCCESS SCORECARD</div><div style={{ display: 'grid', gap: 9, marginTop: 12 }}>{proposal.metrics.map((x) => <div key={x} style={{ borderTop: '1px solid #E2DED6', paddingTop: 9, lineHeight: 1.55 }}>{x}</div>)}</div></article>
          <article style={box}><div style={{ fontSize: 12, fontWeight: 950, color: '#24604E', letterSpacing: '.08em' }}>INFRASTRUCTURE / RESILIENCE LANE</div><div style={{ display: 'grid', gap: 9, marginTop: 12 }}>{proposal.infrastructure.map((x) => <div key={x} style={{ borderTop: '1px solid #E2DED6', paddingTop: 9, lineHeight: 1.55 }}>{x}</div>)}</div></article>
        </section>

        <section style={{ ...dark, marginTop: 18, background: '#153025' }}>
          <div style={{ color: '#9EF0CF', fontSize: 12, fontWeight: 950, letterSpacing: '.1em' }}>NEXT STEP</div>
          <h2 style={{ fontSize: 34, margin: '10px 0' }}>Start narrow. Prove it. Then scale.</h2>
          <p style={{ color: '#D5E3DD', fontSize: 17, lineHeight: 1.65, maxWidth: 860 }}>{proposal.nextStep}</p>
        </section>

        <footer style={{ marginTop: 20, color: '#777168', fontSize: 12, lineHeight: 1.6 }}>
          Aridon proposal prepared from public information and internal Aridon product concepts. No team or venue endorsement is implied. No trademarks are used for promotion. Any access to private data, systems or facilities requires written authorization. Physical infrastructure concepts require separate engineering validation, safety review, commercial terms and approvals.
        </footer>
      </div>
    </main>
  );
}
