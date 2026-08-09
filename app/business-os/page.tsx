import type { Metadata } from 'next';
import Link from 'next/link';
import { directCheckout } from '../../lib/directCheckout';
import { executives } from '../../lib/executives';
import BoardroomChallenge from './BoardroomChallenge';

export const metadata: Metadata = {
  title: 'Aridon Executive Operating System | Your AI Executive Team',
  description: 'Give your business an AI executive team, Company Brain, Executive Boardroom, CEO Brief, execution workflows and human approval controls inside one private workspace.',
};

const loop = [
  ['1', 'Company Brain', 'Your business context, decisions, projects, CRM, tasks and useful knowledge stay together.'],
  ['2', 'Executive Boardroom', 'Eva routes important decisions to the executives whose specialties matter.'],
  ['3', 'Decision', 'The team surfaces tradeoffs, risk and disagreement, then gives the owner one recommended move.'],
  ['4', 'Execution Team', 'Turn the chosen outcome into projects, deliverables, research, drafts and next actions.'],
  ['5', 'Human Approval', 'External sends, spending, signatures, commitments and consequential claims stop at approval gates.'],
  ['6', 'CEO Brief', 'Eva compresses the operating picture into priorities, revenue, risk, opportunity and the next three moves.'],
];

const liveFoundation = ['Eight named AI executives', 'Hands-Free Executive Room', 'Company Brain / knowledge layer', 'CRM, projects and tasks', 'Execution Engine', 'Email Queue', 'SMS workspace', 'Stripe subscriptions', 'Supabase-backed private workspaces'];
const connectorRoadmap = ['Gmail and Outlook', 'Google and Microsoft Calendar', 'Drive and OneDrive', 'QuickBooks', 'HubSpot and Salesforce', 'Slack and Microsoft Teams', 'Shopify', 'Additional phone and business-line providers'];

const plans = [
  { id: 'launch' as const, name: 'Launch', line: 'A private executive workspace for an owner getting organized.', items: ['Company workspace', 'Eva AI Chief of Staff', 'Projects and tasks', 'Company Brain', 'Initial setup'] },
  { id: 'growth' as const, name: 'Growth', line: 'For a business that wants stronger sales, research and recurring execution.', items: ['Everything in Launch', 'Scout sales tools', 'Customer follow-up tools', 'Competitor research', 'Execution workflows'] },
  { id: 'command' as const, name: 'Command', line: 'For teams that need deeper automation, integrations and custom workflows.', items: ['Everything in Growth', 'Custom AI roles', 'Custom domain option', 'Workflow integrations', 'Priority build support'] },
];

export default function BusinessOSLanding() {
  return (
    <main style={{ minHeight: '100vh', background: '#F4F1E9', color: '#171717', fontFamily: 'Arial, sans-serif' }}>
      <section style={{ background: '#07101D', color: '#F8FAFC' }}>
        <div style={{ maxWidth: 1180, margin: '0 auto', padding: '24px 20px 76px' }}>
          <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
            <Link href="/business-os" style={{ color: '#F8FAFC', textDecoration: 'none', fontWeight: 950, letterSpacing: 1 }}>ARIDON · EXECUTIVE OS</Link>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <a href="#team" style={darkOutline}>The Team</a>
              <a href="#challenge" style={darkOutline}>Live Challenge</a>
              <Link href="/customer/login" style={darkOutline}>Sign In</Link>
              <Link href="/business-os/beta" style={mintPill}>Build My Team</Link>
            </div>
          </nav>

          <div className="hero-grid" style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.25fr) minmax(320px,.75fr)', gap: 38, alignItems: 'center', paddingTop: 68 }}>
            <div>
              <div style={eyebrowDark}>THE AI EXECUTIVE OPERATING SYSTEM</div>
              <h1 style={{ fontSize: 'clamp(48px,8vw,86px)', lineHeight: .92, letterSpacing: -3, margin: '18px 0 24px', maxWidth: 900 }}>Your company doesn’t need another chatbot. It needs an executive team.</h1>
              <p style={{ fontSize: 20, lineHeight: 1.65, color: '#BFC9D8', maxWidth: 790 }}>Aridon gives an owner eight specialized AI executives, a shared Company Brain, an Executive Boardroom, controlled execution, and one Chief of Staff who keeps the business moving.</p>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 28 }}>
                <Link href="/business-os/beta" style={heroPrimary}>Create My Free Business OS</Link>
                <a href="#challenge" style={heroSecondary}>Challenge the Executive Team</a>
              </div>
              <p style={{ color: '#8796AC', fontSize: 13, marginTop: 12 }}>Start with a private beta workspace. No credit card. Important external actions remain under your control.</p>
            </div>

            <div style={{ background: '#0D1728', border: '1px solid #2A3A57', borderRadius: 24, padding: 22, boxShadow: '0 28px 70px rgba(0,0,0,.22)' }}>
              <div style={eyebrowDark}>EVA · CHIEF OF STAFF</div>
              <h2 style={{ fontSize: 32, margin: '9px 0 16px' }}>“Here is what matters today.”</h2>
              {['Top three priorities', 'Revenue and follow-up', 'Operational blockers', 'Risks needing owner attention', 'Best next decision', 'What the team can execute next'].map((item, index) => (
                <div key={item} style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '10px 0', borderTop: index ? '1px solid #23324B' : 0 }}>
                  <span style={{ width: 26, height: 26, borderRadius: 999, background: index < 3 ? '#9EF0CF' : '#E8DFC9', color: '#07130F', display: 'grid', placeItems: 'center', fontSize: 12, fontWeight: 950 }}>{index + 1}</span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="team" style={{ maxWidth: 1180, margin: '0 auto', padding: '76px 20px' }}>
        <div style={{ maxWidth: 820 }}><div style={eyebrow}>YOUR DIGITAL C-SUITE</div><h2 style={sectionTitle}>Eight executives. Clear ownership.</h2><p style={body}>You do not build agents from scratch and hope they cooperate. Aridon starts with a leadership structure that business owners already understand.</p></div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(245px,1fr))', gap: 12, marginTop: 26 }}>
          {executives.map((executive) => (
            <article key={executive.id} style={{ background: '#fff', border: '1px solid #D0CBC0', borderTop: `4px solid ${executive.color}`, borderRadius: 17, padding: 18 }}>
              <div style={{ display: 'flex', gap: 11, alignItems: 'center' }}><span style={{ width: 42, height: 42, display: 'grid', placeItems: 'center', borderRadius: 12, background: `${executive.color}22`, color: executive.color, fontWeight: 950, fontSize: 18 }}>{executive.icon}</span><div><strong style={{ fontSize: 20 }}>{executive.name}</strong><div style={{ color: '#77736B', fontSize: 12 }}>{executive.abbr} · {executive.role}</div></div></div>
              <p style={{ ...body, fontSize: 14, marginBottom: 10 }}>{executive.tagline}</p>
              <div style={{ color: '#6D6A63', fontSize: 12, lineHeight: 1.7 }}>{executive.expertise.slice(0, 3).join(' · ')}</div>
            </article>
          ))}
        </div>
      </section>

      <section style={{ background: '#171717', color: '#fff', padding: '76px 20px' }}>
        <div style={{ maxWidth: 1180, margin: '0 auto' }}>
          <div style={{ maxWidth: 850 }}><div style={eyebrowDark}>THE ARIDON OPERATING LOOP</div><h2 style={{ ...sectionTitle, color: '#fff' }}>From company memory to finished action, without losing owner control.</h2></div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(250px,1fr))', gap: 10, marginTop: 26 }}>
            {loop.map(([number, title, text]) => <article key={title} style={{ background: '#212121', border: '1px solid #333', borderRadius: 16, padding: 19 }}><div style={{ width: 32, height: 32, display: 'grid', placeItems: 'center', borderRadius: 10, background: '#9EF0CF', color: '#07130F', fontWeight: 950 }}>{number}</div><h3 style={{ fontSize: 21, margin: '12px 0 7px' }}>{title}</h3><p style={{ color: '#C4C4C0', lineHeight: 1.6, marginBottom: 0 }}>{text}</p></article>)}
          </div>
        </div>
      </section>

      <section id="challenge" style={{ maxWidth: 1080, margin: '0 auto', padding: '76px 20px' }}>
        <div style={{ textAlign: 'center', maxWidth: 820, margin: '0 auto 28px' }}><div style={eyebrow}>DON’T TAKE OUR WORD FOR IT</div><h2 style={sectionTitle}>Challenge the Aridon Executive Team.</h2><p style={body}>Give the boardroom one genuine business problem and watch Aridon route the decision across multiple executive specialties before producing one recommended move.</p></div>
        <BoardroomChallenge />
      </section>

      <section style={{ background: '#DDE9FF', padding: '76px 20px' }}>
        <div className="two-col" style={{ maxWidth: 1120, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 18 }}>
          <article style={featureCard}>
            <div style={eyebrow}>COMPANY BRAIN</div><h2 style={{ fontSize: 36, margin: '9px 0 12px' }}>Your executives should know the business they are helping run.</h2><p style={body}>Store company knowledge, projects, tasks, decisions, customer context and useful operating information in one private workspace so the team can reason from shared context instead of starting over every chat.</p>
          </article>
          <article style={featureCard}>
            <div style={eyebrow}>CONTROLLED AUTONOMY</div><h2 style={{ fontSize: 36, margin: '9px 0 12px' }}>AI can move fast without quietly taking authority from the owner.</h2><p style={body}>Research, analysis and drafting can move freely. External messages, spending, signatures, legal commitments, consequential claims and destructive actions can be held behind explicit owner approval gates.</p>
          </article>
        </div>
      </section>

      <section style={{ maxWidth: 1120, margin: '0 auto', padding: '76px 20px' }}>
        <div style={{ maxWidth: 820 }}><div style={eyebrow}>ONBOARDING</div><h2 style={sectionTitle}>Tell Aridon about the business once. Open a working executive workspace.</h2><p style={body}>The beta already creates a private company space, login, starter project and first tasks from a short plain-English setup. The next layer is designed to make company context and executive recommendations useful immediately.</p></div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: 11, marginTop: 22 }}>
          <Step number="1" title="Tell us about the company" text="Business name, website if available, industry, what you sell, and what you want help with first." />
          <Step number="2" title="Aridon builds the workspace" text="Private login, company home, starter work and the executive-team operating structure are created." />
          <Step number="3" title="Give the team a real problem" text="Use Eva, the Boardroom or the Executive Room on something that matters in the business today." />
        </div>
      </section>

      <section style={{ background: '#0D1728', color: '#fff', padding: '76px 20px' }}>
        <div style={{ maxWidth: 1120, margin: '0 auto' }}>
          <div style={{ maxWidth: 820 }}><div style={eyebrowDark}>CONNECTION LAYER</div><h2 style={{ ...sectionTitle, color: '#fff' }}>Connect the systems the business already uses. Don’t pretend every logo is live before it is.</h2><p style={{ ...body, color: '#B9C4D4' }}>Aridon’s moat is the executive operating model. Integrations deepen it. This site separates what is in the current product from the connector roadmap instead of advertising vaporware.</p></div>
          <div className="two-col" style={{ display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 14, marginTop: 24 }}>
            <article style={darkFeature}><div style={eyebrowDark}>LIVE FOUNDATION</div><div style={tagGrid}>{liveFoundation.map((item) => <span key={item} style={darkTag}>✓ {item}</span>)}</div></article>
            <article style={darkFeature}><div style={{ ...eyebrowDark, color: '#F4D06F' }}>CONNECTOR ROADMAP</div><div style={tagGrid}>{connectorRoadmap.map((item) => <span key={item} style={roadmapTag}>→ {item}</span>)}</div></article>
          </div>
        </div>
      </section>

      <section id="plans" style={{ background: '#E9E5DB', padding: '76px 20px' }}>
        <div style={{ maxWidth: 1120, margin: '0 auto' }}>
          <div style={{ maxWidth: 800, marginBottom: 28 }}><div style={eyebrow}>MONTHLY PLANS</div><h2 style={sectionTitle}>Start free. Keep the workspace that proves useful.</h2><p style={body}>Paid subscriptions are processed by Stripe. No plan should be sold on promises the product cannot yet keep.</p></div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: 12 }}>
            {plans.map((plan, index) => (
              <article key={plan.name} style={{ background: index === 1 ? '#E7F8F0' : '#fff', border: `1px solid ${index === 1 ? '#7BC8AA' : '#CFC9BD'}`, borderRadius: 18, padding: 22 }}>
                {index === 1 && <div style={{ fontWeight: 950, fontSize: 11, color: '#1D6C50', marginBottom: 8 }}>RECOMMENDED</div>}
                <div style={{ fontWeight: 950, fontSize: 24 }}>{plan.name}</div>
                <div style={{ fontWeight: 950, fontSize: 28, margin: '7px 0' }}>{directCheckout[plan.id].price}</div>
                <p style={{ ...body, minHeight: 68 }}>{plan.line}</p>
                <ul style={{ lineHeight: 1.8, paddingLeft: 20 }}>{plan.items.map((item) => <li key={item}>{item}</li>)}</ul>
                <div style={{ display: 'grid', gap: 8, marginTop: 12 }}><a href={directCheckout[plan.id].url} style={{ ...primaryButton, textAlign: 'center' }}>Subscribe to {plan.name}</a><Link href="/business-os/beta" style={{ ...secondaryButton, textAlign: 'center' }}>Try Free First</Link></div>
              </article>
            ))}
          </div>
          <div style={{ marginTop: 18, color: '#625E55', lineHeight: 1.6, fontSize: 13 }}>Stripe shows final recurring price and payment details before subscription. See the <Link href="/business-os/terms" style={{ color: '#171717', fontWeight: 850 }}>Terms</Link> and <Link href="/business-os/privacy" style={{ color: '#171717', fontWeight: 850 }}>Privacy Notice</Link>.</div>
        </div>
      </section>

      <section style={{ background: '#9EF0CF', padding: '68px 20px' }}><div style={{ maxWidth: 900, margin: '0 auto', textAlign: 'center' }}><div style={{ fontWeight: 950, fontSize: 12 }}>YOUR EXECUTIVE TEAM IS READY FOR A REAL PROBLEM</div><h2 style={{ fontSize: 'clamp(38px,6vw,64px)', lineHeight: .98, letterSpacing: -2, margin: '11px 0 16px' }}>Stop managing AI tools. Start running the business with an AI leadership system.</h2><div style={{ display: 'flex', justifyContent: 'center', gap: 9, flexWrap: 'wrap', marginTop: 18 }}><Link href="/business-os/beta" style={primaryButton}>Build My Free Business OS</Link><a href="#challenge" style={secondaryButton}>Challenge the Team First</a></div></div></section>

      <footer style={{ padding: '28px 20px', textAlign: 'center', color: '#6D6D68', fontSize: 12 }}>Aridon Executive Operating System · <Link href="/business-os/revenue" style={{ color: 'inherit' }}>Revenue Calculator</Link> · <Link href="/business-os/terms" style={{ color: 'inherit' }}>Terms</Link> · <Link href="/business-os/privacy" style={{ color: 'inherit' }}>Privacy</Link></footer>
      <style>{`@media(max-width:820px){.hero-grid,.two-col{grid-template-columns:1fr !important}.hero-grid h1{letter-spacing:-2px !important}}`}</style>
    </main>
  );
}

function Step({ number, title, text }: { number: string; title: string; text: string }) {
  return <article style={{ background: '#fff', border: '1px solid #D0CBC0', borderRadius: 16, padding: 19 }}><div style={{ width: 34, height: 34, display: 'grid', placeItems: 'center', background: '#171717', color: '#fff', borderRadius: 10, fontWeight: 950 }}>{number}</div><h3 style={{ fontSize: 20 }}>{title}</h3><p style={{ ...body, marginBottom: 0 }}>{text}</p></article>;
}

const eyebrow = { color: '#24604E', fontWeight: 950, fontSize: 11, letterSpacing: 1 };
const eyebrowDark = { color: '#9EF0CF', fontWeight: 950, fontSize: 11, letterSpacing: 1 };
const sectionTitle = { fontSize: 'clamp(36px,5vw,56px)', lineHeight: 1, letterSpacing: -1.5, margin: '9px 0 14px' };
const body = { color: '#56564F', lineHeight: 1.65, fontSize: 16 };
const mintPill = { background: '#9EF0CF', color: '#07130F', padding: '10px 14px', borderRadius: 999, textDecoration: 'none', fontWeight: 950 };
const darkOutline = { border: '1px solid #3C4A63', color: '#E6EBF3', padding: '9px 12px', borderRadius: 999, textDecoration: 'none', fontWeight: 850, fontSize: 13 };
const heroPrimary = { background: '#9EF0CF', color: '#07130F', padding: '14px 18px', borderRadius: 11, textDecoration: 'none', fontWeight: 950 };
const heroSecondary = { border: '1px solid #526078', color: '#F1F4F8', padding: '13px 17px', borderRadius: 11, textDecoration: 'none', fontWeight: 900 };
const featureCard = { background: 'rgba(255,255,255,.72)', border: '1px solid #B7C6DE', borderRadius: 19, padding: 22 };
const darkFeature = { background: '#121F33', border: '1px solid #2E405F', borderRadius: 18, padding: 20 };
const tagGrid = { display: 'flex', flexWrap: 'wrap' as const, gap: 8, marginTop: 15 };
const darkTag = { display: 'inline-block', background: '#172A35', border: '1px solid #315F57', color: '#CFF4E7', borderRadius: 999, padding: '8px 10px', fontSize: 12, fontWeight: 800 };
const roadmapTag = { display: 'inline-block', background: '#2A2518', border: '1px solid #6D5B2C', color: '#F6E5A8', borderRadius: 999, padding: '8px 10px', fontSize: 12, fontWeight: 800 };
const primaryButton = { background: '#171717', color: '#fff', padding: '14px 19px', borderRadius: 11, textDecoration: 'none', fontWeight: 900 };
const secondaryButton = { border: '1px solid #AAA499', color: '#171717', padding: '13px 18px', borderRadius: 11, textDecoration: 'none', fontWeight: 850 };
