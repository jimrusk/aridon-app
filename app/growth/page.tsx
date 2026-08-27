import Link from 'next/link';
import { highTicketFunnel, highTicketOffers } from '../../lib/highTicketCheckout';

const mint = '#9EF0CF';
const bg = '#07101A';
const card = { background: '#0D1723', border: '1px solid #26374D', borderRadius: 18, padding: 20 } as const;

const deliverables: Record<string, string[]> = {
  'free-scan': ['Executive website readout', 'Conversion and trust scoring', 'Visibility and indexing checks', 'Top opportunities surfaced'],
  'health-scan': ['Revenue leak review', 'Conversion and trust gaps', 'AI opportunity scan', 'Priority next-action list'],
  'action-plan': ['90-day roadmap', 'Growth priorities ranked', 'Lead follow-up plan', 'Automation opportunities'],
  'implementation-sprint': ['Priority fixes implemented', 'Lead capture setup', 'Follow-up automation', 'Website or landing-page improvements'],
  'growth-engine': ['Full growth-system buildout', 'CRM and follow-up workflows', 'Campaign and conversion assets', 'AI workflow and reporting setup'],
  'managed-growth': ['Ongoing optimization', 'Campaign and conversion updates', 'Lead follow-up improvements', 'Monthly executive reporting'],
  enterprise: ['Custom integrations', 'Multi-location or multi-team rollout', 'Executive reporting', 'Custom workflow deployment'],
};

export default function GrowthPage() {
  return (
    <main style={{ minHeight: '100vh', background: bg, color: '#F8FAFC', fontFamily: 'Arial, sans-serif' }}>
      <section style={{ maxWidth: 1180, margin: '0 auto', padding: '24px 20px 80px' }}>
        <nav style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <Link href="/" style={{ color: '#fff', textDecoration: 'none', fontWeight: 950, letterSpacing: 1 }}>ARIDON</Link>
          <div style={{ display: 'flex', gap: 9, flexWrap: 'wrap' }}>
            <Link href="/analyze-business" style={ghostButton}>Free Business Scan</Link>
            <Link href="/sales" style={ghostButton}>How Aridon Works</Link>
          </div>
        </nav>

        <header style={{ paddingTop: 64, maxWidth: 940 }}>
          <div style={eyebrow}>ARIDON GROWTH BACKEND</div>
          <h1 style={{ fontSize: 'clamp(48px,7vw,82px)', lineHeight: .95, letterSpacing: -3.5, margin: '14px 0 20px' }}>Find the leak. Prove the value. Fix the problem. Keep improving it.</h1>
          <p style={{ color: '#BAC6D6', fontSize: 20, lineHeight: 1.7, maxWidth: 880 }}>Aridon starts with evidence instead of a giant software pitch. A business can begin free, buy a focused diagnostic, move into implementation, then continue with managed growth only when the value is there.</p>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 24 }}>
            <Link href="/analyze-business" style={primaryButton}>Run the Free Scan</Link>
            <a href={highTicketOffers.healthScan.href} style={outlineButton}>Buy the $198 Diagnostic</a>
          </div>
          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginTop: 14, color: '#8FA0B8', fontSize: 12, fontWeight: 800 }}>
            <span>✓ Free scan needs no card</span>
            <span>✓ Secure live Stripe checkout</span>
            <span>✓ No revenue guarantee</span>
          </div>
        </header>

        <section style={{ ...card, marginTop: 34, background: 'linear-gradient(135deg,#102033,#10261F)' }}>
          <div style={eyebrow}>THE FUNNEL</div>
          <h2 style={{ fontSize: 34, margin: '8px 0 16px' }}>One ladder, seven clear next steps.</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 9 }}>
            {['Free scan', '$198 diagnostic', '$497 plan', '$2.5K sprint', '$7.5K build', '$1.5K/mo managed', 'Enterprise'].map((item, index) => (
              <div key={item} style={{ background: '#08131F', border: '1px solid #2A4057', borderRadius: 12, padding: 13 }}><strong>{index + 1}. {item}</strong></div>
            ))}
          </div>
        </section>

        <section style={{ marginTop: 34 }}>
          <div style={eyebrow}>OFFER LADDER</div>
          <h2 style={{ fontSize: 36, margin: '8px 0 18px' }}>Buy only the level of help the business needs.</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(270px,1fr))', gap: 13 }}>
            {highTicketFunnel.map((offer, index) => {
              const isExternal = offer.href.startsWith('http');
              const buttonLabel = offer.key === 'free-scan' ? 'Start Free' : offer.key === 'enterprise' ? 'Start Enterprise Scoping' : offer.type === 'subscription' ? 'Start Managed Growth' : 'Book & Pay Securely';
              return (
                <article key={offer.key} style={{ ...card, borderColor: index === 4 ? '#4B8C74' : '#26374D', boxShadow: index === 4 ? '0 0 0 1px #4B8C7444' : 'none' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'start' }}>
                    <div>
                      <div style={{ color: index === 4 ? mint : '#8FA0B8', fontSize: 11, fontWeight: 950, letterSpacing: 1 }}>STEP {index + 1}</div>
                      <h3 style={{ fontSize: 25, margin: '7px 0 4px' }}>{offer.name}</h3>
                    </div>
                    {index === 4 && <span style={{ background: '#17362B', color: mint, border: '1px solid #2E6B56', borderRadius: 999, padding: '6px 9px', fontSize: 11, fontWeight: 900 }}>CORE BACKEND</span>}
                  </div>
                  <div style={{ marginTop: 10 }}><strong style={{ fontSize: 36 }}>{offer.price}</strong> <span style={{ color: '#94A3B8', fontSize: 13 }}>{offer.priceDetail}</span></div>
                  <p style={{ color: '#B4C0D0', lineHeight: 1.6, minHeight: 78 }}>{offer.summary}</p>
                  <div style={{ display: 'grid', gap: 8, marginTop: 12 }}>
                    {deliverables[offer.key].map((item) => <div key={item} style={{ color: '#D5DFEB', fontSize: 14 }}>✓ {item}</div>)}
                  </div>
                  {isExternal ? <a href={offer.href} style={{ ...primaryButton, display: 'inline-block', marginTop: 18 }}>{buttonLabel}</a> : <Link href={offer.href} style={{ ...primaryButton, display: 'inline-block', marginTop: 18 }}>{buttonLabel}</Link>}
                </article>
              );
            })}
          </div>
        </section>

        <section style={{ ...card, marginTop: 34, background: '#F0F7F3', color: '#102019', borderColor: '#C8E0D5' }}>
          <div style={{ color: '#1B7659', fontSize: 11, fontWeight: 950, letterSpacing: 1 }}>WHAT THE CUSTOMER IS REALLY BUYING</div>
          <h2 style={{ fontSize: 34, margin: '8px 0 12px' }}>Do not sell AI. Sell the correction of a measurable business problem.</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(210px,1fr))', gap: 10 }}>
            {['Recover missed leads', 'Increase conversion', 'Improve follow-up speed', 'Strengthen trust and visibility', 'Reduce manual work', 'Create a repeatable growth system'].map((item) => <div key={item} style={{ background: '#fff', border: '1px solid #D1E2DA', borderRadius: 12, padding: 14, fontWeight: 850 }}>{item}</div>)}
          </div>
        </section>

        <section style={{ marginTop: 34 }}>
          <div style={eyebrow}>HOW THE BACKEND CLOSES</div>
          <h2 style={{ fontSize: 34, margin: '8px 0 16px' }}>The sales conversation stays simple.</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 10 }}>
            {[
              ['1. Show the leak', 'Use the scan and evidence to identify what is being missed.'],
              ['2. Quantify the impact', 'Use ranges and assumptions, not made-up certainty.'],
              ['3. Show the fix', 'Explain the specific work Aridon can implement.'],
              ['4. Give two choices', 'Offer the sprint or the full Growth Engine when both are appropriate.'],
              ['5. Retain the win', 'Move successful implementations into Managed Growth.'],
            ].map(([title, text]) => <article key={title} style={card}><strong style={{ color: mint }}>{title}</strong><p style={{ color: '#AFBDCE', lineHeight: 1.55, marginBottom: 0 }}>{text}</p></article>)}
          </div>
        </section>

        <section style={{ ...card, marginTop: 34 }}>
          <div style={eyebrow}>B2B SAFETY AND SCOPE</div>
          <p style={{ color: '#B4C0D0', lineHeight: 1.65, marginBottom: 0 }}>Prices purchase the stated service level, not a guaranteed revenue outcome. Exact implementation scope, access requirements, timing, exclusions, and any third-party costs are confirmed during kickoff. Aridon does not make consequential external changes without the customer or owner authorizing them.</p>
        </section>
      </section>
      <style>{`@media(max-width:760px){h1{letter-spacing:-2px !important}}`}</style>
    </main>
  );
}

const eyebrow = { color: mint, fontSize: 11, letterSpacing: 1.3, fontWeight: 950 } as const;
const primaryButton = { background: mint, color: '#07130F', borderRadius: 11, padding: '12px 15px', textDecoration: 'none', fontWeight: 950, border: '1px solid #9EF0CF' } as const;
const outlineButton = { border: '1px solid #51617A', color: '#F8FAFC', borderRadius: 11, padding: '11px 15px', textDecoration: 'none', fontWeight: 900 } as const;
const ghostButton = { border: '1px solid #35455D', color: '#E7EDF5', borderRadius: 10, padding: '9px 12px', textDecoration: 'none', fontWeight: 850, fontSize: 13 } as const;
