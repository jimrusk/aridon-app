import type { Metadata } from 'next';
import Link from 'next/link';
import OpportunityCheckoutForm from './OpportunityCheckoutForm';
import { opportunityPlans } from '../../lib/opportunityIntelligence';

export const metadata: Metadata = {
  title: 'Aridon Opportunity Intelligence | Find, Verify & Pursue Revenue',
  description: 'Source-backed AI opportunity intelligence for grants, government contracts, RFPs, partnerships, customers, investors and expansion incentives.',
};

const workflow = [
  ['1', 'Teach it the company', 'Capabilities, target markets, geography, deal size, exclusions and the opportunity types worth chasing.'],
  ['2', 'Scan the live market', 'Research current grants, contracts, RFPs, partners, customers, investors and incentives against the saved profile.'],
  ['3', 'Score the fit', 'Every result gets a 0–100 fit score based on capability, eligibility, timing, geography, evidence and realistic path to win.'],
  ['4', 'Verify the evidence', 'The workspace surfaces sources and labels the result as source-backed, partially verified or unverified.'],
  ['5', 'Build the pursuit', 'See eligibility, risks, requirements, partner strategy, decision-maker path, next action and a restrained outreach draft.'],
  ['6', 'Keep the pipeline moving', 'Move opportunities from new to qualified, pursuing, submitted, won, lost or watchlist without losing the research trail.'],
];

const categories = ['Federal grants', 'Government contracts', 'State & local funding', 'Municipal & tribal opportunities', 'Corporate RFPs', 'Strategic partners', 'High-fit customers', 'Investors', 'Expansion incentives'];

export default function OpportunityIntelligenceLanding() {
  return (
    <main style={{ minHeight: '100vh', background: '#F4F1E9', color: '#171717', fontFamily: 'Arial, sans-serif' }}>
      <section style={{ background: '#07101D', color: '#F8FAFC' }}>
        <div style={{ maxWidth: 1180, margin: '0 auto', padding: '24px 20px 78px' }}>
          <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <Link href="/opportunity-intelligence" style={{ color: '#F8FAFC', fontWeight: 950, letterSpacing: .8, textDecoration: 'none' }}>ARIDON · OPPORTUNITY INTELLIGENCE</Link>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <a href="#how" style={navButton}>How It Works</a>
              <a href="#pricing" style={navButton}>Pricing</a>
              <Link href="/customer/login" style={navButton}>Sign In</Link>
              <Link href="/business-os/beta" style={mintButton}>Try the Business OS</Link>
            </div>
          </nav>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,330px),1fr))', gap: 36, alignItems: 'center', paddingTop: 66 }}>
            <div>
              <div style={eyebrowDark}>FROM SEARCH TO PURSUIT</div>
              <h1 style={{ fontSize: 'clamp(48px,7.7vw,84px)', lineHeight: .93, letterSpacing: -3, margin: '16px 0 24px' }}>Find the right opportunity. Prove the fit. Build the pursuit.</h1>
              <p style={{ color: '#BFC9D8', fontSize: 20, lineHeight: 1.65, maxWidth: 790 }}>Aridon turns public-market research into a private opportunity command center. It finds current opportunities, scores them against the company, exposes the evidence, maps the path to win and keeps the next action visible.</p>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 26 }}>
                <a href="#pricing" style={heroPrimary}>See Plans</a>
                <Link href="/business-os/beta" style={heroSecondary}>Try a Demo Workspace</Link>
              </div>
              <p style={{ color: '#8190A6', marginTop: 12, fontSize: 13 }}>No invented proof. No mystery score. No automatic external commitments.</p>
            </div>

            <div style={{ background: '#0D1728', border: '1px solid #2A3A57', borderRadius: 24, padding: 22, boxShadow: '0 28px 70px rgba(0,0,0,.24)' }}>
              <div style={eyebrowDark}>THE PURSUIT CARD</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginTop: 12, flexWrap: 'wrap' }}><strong style={{ fontSize: 25 }}>High-fit opportunity</strong><span style={{ background: '#9EF0CF', color: '#07130F', borderRadius: 999, padding: '6px 10px', fontWeight: 950 }}>91 / 100</span></div>
              {['Eligibility and fit', 'Deadline and value', 'Verified source trail', 'Requirements and risks', 'Partner strategy', 'Decision-maker path', 'Recommended next action', 'Outreach draft for approval'].map((item) => (
                <div key={item} style={{ padding: '10px 0', borderTop: '1px solid #22314A', color: '#D8E1ED' }}>✓ {item}</div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section style={{ maxWidth: 1120, margin: '0 auto', padding: '74px 20px 36px' }}>
        <div style={{ maxWidth: 820 }}><div style={eyebrow}>ONE ENGINE, MANY REVENUE PATHS</div><h2 style={sectionTitle}>Stop searching each market in a different silo.</h2><p style={body}>A company can define what it sells and where it wants to grow, then use one evidence-backed workflow across public funding, procurement, commercial buyers, partners and capital.</p></div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 9, marginTop: 24 }}>{categories.map((item) => <span key={item} style={pill}>{item}</span>)}</div>
      </section>

      <section id="how" style={{ maxWidth: 1120, margin: '0 auto', padding: '42px 20px 76px' }}>
        <div style={{ maxWidth: 800 }}><div style={eyebrow}>THE OPERATING LOOP</div><h2 style={sectionTitle}>The work product is a qualified pursuit, not a pile of pages.</h2></div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(270px,1fr))', gap: 12, marginTop: 24 }}>
          {workflow.map(([number, title, text]) => <article key={title} style={card}><span style={step}>{number}</span><h3 style={{ fontSize: 21, margin: '12px 0 7px' }}>{title}</h3><p style={{ ...body, fontSize: 14, margin: 0 }}>{text}</p></article>)}
        </div>
      </section>

      <section style={{ background: '#DDE9FF', padding: '72px 20px' }}>
        <div style={{ maxWidth: 1120, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 16 }}>
          <article style={lightCard}><div style={eyebrow}>TRUST LAYER</div><h2 style={{ fontSize: 34, margin: '9px 0 12px' }}>Evidence gets a status.</h2><p style={body}>Formal opportunities are expected to point back to public sources. Aridon compares the result with the research citations and marks it source-backed, partially verified or unverified instead of letting confident prose masquerade as proof.</p></article>
          <article style={lightCard}><div style={eyebrow}>HUMAN AUTHORITY</div><h2 style={{ fontSize: 34, margin: '9px 0 12px' }}>Research can run fast. Authority stays human.</h2><p style={body}>The system can discover, analyze, organize and draft. Sending outreach, spending money, signing documents and making consequential commitments remain approval decisions.</p></article>
        </div>
      </section>

      <section id="pricing" style={{ maxWidth: 1120, margin: '0 auto', padding: '76px 20px' }}>
        <div style={{ maxWidth: 820 }}><div style={eyebrow}>PAID OPPORTUNITY INTELLIGENCE</div><h2 style={sectionTitle}>Choose how many pursuits the company needs to keep moving.</h2><p style={body}>All three plans use the same evidence-first engine. Higher plans widen the number of active pursuits and depth of pursuit support.</p></div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(270px,1fr))', gap: 12, marginTop: 26 }}>
          {Object.values(opportunityPlans).map((plan, index) => (
            <article key={plan.id} style={{ ...card, background: index === 1 ? '#E7F8F0' : '#fff', borderColor: index === 1 ? '#74BEA1' : '#CEC8BC' }}>
              {index === 1 && <div style={{ color: '#176148', fontSize: 11, fontWeight: 950 }}>RECOMMENDED</div>}
              <h3 style={{ fontSize: 27, margin: '7px 0 2px' }}>{plan.name}</h3>
              <div style={{ fontSize: 31, fontWeight: 950 }}>{plan.price}</div>
              <p style={{ ...body, minHeight: 62 }}>{plan.line}</p>
              <ul style={{ lineHeight: 1.8, paddingLeft: 19 }}>{plan.features.map((item) => <li key={item}>{item}</li>)}</ul>
              <a href="#checkout" style={{ ...primaryButton, display: 'block', textAlign: 'center' }}>Choose {plan.name}</a>
            </article>
          ))}
        </div>
      </section>

      <section id="checkout" style={{ background: '#07101D', color: '#F8FAFC', padding: '76px 20px' }}>
        <div style={{ maxWidth: 1080, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,330px),1fr))', gap: 26, alignItems: 'start' }}>
          <div><div style={eyebrowDark}>READY TO PURSUE</div><h2 style={{ ...sectionTitle, color: '#fff' }}>Turn opportunity hunting into an operating system.</h2><p style={{ ...body, color: '#BFC9D8' }}>A new subscription creates a private company workspace. After checkout, the owner creates a login, defines the opportunity profile and can run the first live source-backed scan.</p><p style={{ ...body, color: '#BFC9D8' }}>Already using Aridon? Sign in and add Opportunity Intelligence from inside the customer workspace instead.</p><Link href="/customer/login" style={heroSecondary}>Existing Customer Sign In</Link></div>
          <OpportunityCheckoutForm />
        </div>
      </section>
    </main>
  );
}

const eyebrow = { color: '#1C6A50', fontSize: 12, fontWeight: 950, letterSpacing: 1.1 };
const eyebrowDark = { color: '#9EF0CF', fontSize: 12, fontWeight: 950, letterSpacing: 1.1 };
const sectionTitle = { fontSize: 'clamp(36px,5vw,56px)', lineHeight: 1.02, letterSpacing: -1.8, margin: '10px 0 15px' };
const body = { color: '#625E55', fontSize: 17, lineHeight: 1.65 };
const card = { background: '#fff', border: '1px solid #CEC8BC', borderRadius: 17, padding: 20 };
const lightCard = { background: 'rgba(255,255,255,.7)', border: '1px solid #B7C9E9', borderRadius: 18, padding: 22 };
const pill = { background: '#fff', border: '1px solid #CEC8BC', borderRadius: 999, padding: '9px 12px', fontWeight: 800, fontSize: 13 };
const step = { width: 34, height: 34, display: 'grid', placeItems: 'center', background: '#171717', color: '#fff', borderRadius: 10, fontWeight: 950 };
const navButton = { color: '#E6EDF7', border: '1px solid #34445F', borderRadius: 10, padding: '9px 12px', textDecoration: 'none', fontWeight: 850, fontSize: 13 };
const mintButton = { color: '#07130F', background: '#9EF0CF', borderRadius: 10, padding: '10px 13px', textDecoration: 'none', fontWeight: 950, fontSize: 13 };
const heroPrimary = { display: 'inline-block', background: '#9EF0CF', color: '#07130F', borderRadius: 12, padding: '13px 17px', textDecoration: 'none', fontWeight: 950 };
const heroSecondary = { display: 'inline-block', border: '1px solid #455978', color: '#F7FAFC', borderRadius: 12, padding: '12px 16px', textDecoration: 'none', fontWeight: 900 };
const primaryButton = { background: '#171717', color: '#fff', borderRadius: 11, padding: '12px 14px', textDecoration: 'none', fontWeight: 950 };
