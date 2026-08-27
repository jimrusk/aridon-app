import Link from 'next/link';
import { highTicketFunnel } from '../../../lib/highTicketCheckout';

const mint = '#9EF0CF';
const bg = '#07101A';
const panel = { background: '#0D1723', border: '1px solid #26374D', borderRadius: 16, padding: 18 } as const;

const intakeQuestions = [
  'What does the business sell, and who is the ideal customer?',
  'What is the main growth or revenue problem right now?',
  'How are leads currently generated?',
  'What happens after a lead calls, fills out a form, or asks for a quote?',
  'What CRM, website platform, email platform, or scheduling tools are already in use?',
  'What is the average sale, customer value, or project value if known?',
  'Where does the owner believe money is being lost today?',
  'Which parts of the current process are manual, slow, or frequently missed?',
  'What result would make this project clearly worthwhile?',
  'Who can approve website, CRM, campaign, and workflow changes?',
  'What access can be provided, and what systems are off limits?',
  'What timeline matters most: immediate, 30 days, 60 days, or longer?',
];

const followUp = [
  ['Day 0', 'Send the scan summary, the three highest-value findings, the recommended package, the price, and one clear next step.'],
  ['Day 2', 'Send one additional observation or missed opportunity that was not emphasized on the call. Keep it useful, not needy.'],
  ['Day 5', 'Ask for a decision. Offer the smaller implementation sprint if the full Growth Engine is too large for the current stage.'],
  ['Day 10', 'Close the active sales loop politely. State that the analysis remains valid, but active implementation capacity is being allocated elsewhere.'],
  ['Day 21', 'Move the prospect to light nurture. Send a useful growth observation, benchmark, or new opportunity when there is a real reason to reconnect.'],
];

export default function HighTicketPlaybookPage() {
  return (
    <main style={{ minHeight: '100vh', background: bg, color: '#F8FAFC', fontFamily: 'Arial, sans-serif' }}>
      <section style={{ maxWidth: 1180, margin: '0 auto', padding: '26px 20px 84px' }}>
        <nav style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <Link href="/sales" style={{ color: '#DCE5EF', textDecoration: 'none', fontWeight: 900 }}>← Sales</Link>
          <Link href="/growth" style={{ background: mint, color: '#07130F', borderRadius: 10, padding: '10px 13px', textDecoration: 'none', fontWeight: 950 }}>Open Customer Funnel</Link>
        </nav>

        <header style={{ maxWidth: 930, paddingTop: 54 }}>
          <div style={eyebrow}>ARIDON HIGH-TICKET BACKEND PLAYBOOK</div>
          <h1 style={{ fontSize: 'clamp(46px,7vw,78px)', lineHeight: .96, letterSpacing: -3, margin: '13px 0 18px' }}>Turn the scan into a scoped implementation sale.</h1>
          <p style={{ color: '#B7C4D4', fontSize: 19, lineHeight: 1.7 }}>This page is the operating playbook for qualification, discovery, the sales call, proposal structure, follow-up, partner referrals, and the numbers that tell us whether the backend is working.</p>
        </header>

        <section style={{ ...panel, marginTop: 28 }}>
          <div style={eyebrow}>OFFER LADDER</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(190px,1fr))', gap: 9, marginTop: 12 }}>
            {highTicketFunnel.map((offer, index) => <div key={offer.key} style={{ background: '#09131F', border: '1px solid #2A3B50', borderRadius: 11, padding: 12 }}><strong>{index + 1}. {offer.name}</strong><div style={{ color: mint, marginTop: 5 }}>{offer.price} <span style={{ color: '#8FA0B8', fontSize: 12 }}>{offer.priceDetail}</span></div></div>)}
          </div>
        </section>

        <section style={{ marginTop: 24 }}>
          <div style={eyebrow}>QUALIFICATION</div>
          <h2 style={sectionTitle}>Only push high-ticket when the economics support it.</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 10 }}>
            {[
              ['Visible problem', 'The scan or discovery shows a specific revenue, conversion, follow-up, visibility, or workflow problem.'],
              ['Meaningful value', 'Fixing the problem is plausibly worth several times the project price. Use ranges and assumptions, not invented certainty.'],
              ['Access', 'The buyer can provide the approvals or system access needed to implement the work.'],
              ['Urgency', 'There is a current business reason to act instead of a vague future interest.'],
              ['Decision maker', 'The person approving the project is on the call or can be brought into the next step quickly.'],
              ['Delivery fit', 'Aridon can actually perform the promised work without depending on unknown third parties or unsupported integrations.'],
            ].map(([title, text]) => <article key={title} style={panel}><strong style={{ color: mint }}>{title}</strong><p style={bodyText}>{text}</p></article>)}
          </div>
        </section>

        <section style={{ ...panel, marginTop: 24 }}>
          <div style={eyebrow}>DISCOVERY INTAKE</div>
          <h2 style={sectionTitle}>Questions to ask before proposing implementation.</h2>
          <div style={{ display: 'grid', gap: 9 }}>
            {intakeQuestions.map((question, index) => <div key={question} style={{ borderTop: '1px solid #27384D', paddingTop: 10, color: '#D5DFEA', lineHeight: 1.55 }}><strong style={{ color: mint }}>{index + 1}.</strong> {question}</div>)}
          </div>
        </section>

        <section style={{ marginTop: 24 }}>
          <div style={eyebrow}>SALES CALL</div>
          <h2 style={sectionTitle}>Use a five-part close.</h2>
          <div style={{ display: 'grid', gap: 10 }}>
            {[
              ['1. Confirm the problem', '“The scan points to three areas worth attention. Before I recommend anything, which one is hurting the business most today?”'],
              ['2. Quantify the impact', '“If this keeps happening for the next 12 months, what does it cost in missed leads, slow follow-up, owner time, or lost sales?”'],
              ['3. Show the fix', '“The implementation work is not another report. We would install the lead capture, follow-up, conversion, and reporting changes needed to attack the problem.”'],
              ['4. Present two choices', '“The focused Sprint is $2,500. The full Growth Engine is $7,500. Based on what we found, I would choose the one that matches the amount of implementation you want us to own.”'],
              ['5. Ask for the decision', '“Which makes more sense for the business right now, the focused Sprint or the full implementation?”'],
            ].map(([title, text]) => <article key={title} style={panel}><strong style={{ color: '#F4D06F' }}>{title}</strong><p style={{ ...bodyText, fontSize: 16 }}>{text}</p></article>)}
          </div>
        </section>

        <section style={{ ...panel, marginTop: 24 }}>
          <div style={eyebrow}>PROPOSAL TEMPLATE</div>
          <h2 style={sectionTitle}>Every proposal should fit on a decision page before the detail.</h2>
          <div style={{ display: 'grid', gap: 9 }}>
            {[
              ['Problem', 'State the business problem in plain language.'],
              ['Evidence', 'List the scan findings, customer statements, and observable facts supporting it.'],
              ['Business impact', 'Show the likely effect using disclosed assumptions and a reasonable range.'],
              ['Scope', 'List exactly what Aridon will implement.'],
              ['Deliverables', 'State what the customer receives and what systems will be changed.'],
              ['Timeline', 'State kickoff, checkpoints, and expected completion window.'],
              ['Customer inputs', 'List access, approvals, content, data, or decisions required from the customer.'],
              ['Price and payment', 'State the package price, payment timing, and any recurring service separately.'],
              ['Exclusions', 'Identify third-party spend, unsupported systems, legal work, ad spend, custom development, or items not included.'],
              ['Success measures', 'State the baseline metrics that will be compared after implementation.'],
              ['Next step', 'One clear approval and payment path.'],
            ].map(([title, text]) => <div key={title} style={{ borderTop: '1px solid #27384D', paddingTop: 10 }}><strong style={{ color: mint }}>{title}</strong><div style={{ color: '#B7C4D4', marginTop: 3 }}>{text}</div></div>)}
          </div>
        </section>

        <section style={{ ...panel, marginTop: 24 }}>
          <div style={eyebrow}>FOLLOW-UP SEQUENCE</div>
          <h2 style={sectionTitle}>Five touches, each with a reason to exist.</h2>
          <div style={{ display: 'grid', gap: 9 }}>
            {followUp.map(([day, action]) => <div key={day} style={{ display: 'grid', gridTemplateColumns: '90px 1fr', gap: 12, borderTop: '1px solid #27384D', paddingTop: 11 }}><strong style={{ color: mint }}>{day}</strong><span style={{ color: '#C7D2DF', lineHeight: 1.55 }}>{action}</span></div>)}
          </div>
        </section>

        <section style={{ marginTop: 24 }}>
          <div style={eyebrow}>PARTNER NETWORK PILOT</div>
          <h2 style={sectionTitle}>Turn trusted advisors into distribution.</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: 10 }}>
            {[
              ['Who to recruit', 'Accountants, web agencies, consultants, IT firms, business brokers, chambers, associations, and service providers with established business relationships.'],
              ['Pilot economics', 'Starting proposal: 20% of the first qualifying project plus 10% of qualifying recurring Managed Growth revenue for up to 12 months. Final terms require a written partner agreement.'],
              ['Lead ownership', 'The partner introduces the business. Aridon performs the scan, qualifies the opportunity, scopes the work, collects payment, and delivers the service.'],
              ['Tracking', 'Use a unique partner code in the CRM or deal record before checkout. Do not promise automated affiliate payouts until referral tracking and payout controls are fully implemented.'],
            ].map(([title, text]) => <article key={title} style={panel}><strong style={{ color: mint }}>{title}</strong><p style={bodyText}>{text}</p></article>)}
          </div>
        </section>

        <section style={{ ...panel, marginTop: 24 }}>
          <div style={eyebrow}>BACKEND KPIS</div>
          <h2 style={sectionTitle}>Watch the money staircase, not vanity traffic.</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(190px,1fr))', gap: 9 }}>
            {['Scan completions', '$198 conversions', '$497 conversions', 'Strategy calls booked', 'Show rate', '$2,500 close rate', '$7,500 close rate', '$1,500/mo attach rate', 'Average revenue per buyer', 'Gross margin', 'Delivery time', '90-day retention'].map((metric) => <div key={metric} style={{ background: '#09131F', border: '1px solid #2A3B50', borderRadius: 11, padding: 12, fontWeight: 850 }}>{metric}</div>)}
          </div>
        </section>

        <section style={{ ...panel, marginTop: 24, background: '#1A1510', borderColor: '#5E4C2D' }}>
          <div style={{ color: '#F4D06F', fontSize: 11, fontWeight: 950 }}>NON-NEGOTIABLE</div>
          <p style={{ color: '#EEE4CF', lineHeight: 1.65, marginBottom: 0 }}>Never invent ROI, traffic, sales, or revenue numbers to force the close. Separate observed facts from estimates. High-ticket works when the problem is real, the scope is clear, and the customer can see why the implementation is worth paying for.</p>
        </section>
      </section>
    </main>
  );
}

const eyebrow = { color: mint, fontSize: 11, letterSpacing: 1.3, fontWeight: 950 } as const;
const sectionTitle = { fontSize: 32, margin: '8px 0 14px' } as const;
const bodyText = { color: '#B7C4D4', lineHeight: 1.6, marginBottom: 0 } as const;
