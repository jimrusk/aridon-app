import Link from 'next/link';
import { highTicketOffers } from '../../lib/highTicketCheckout';

const mint = '#9EF0CF';
const dark = '#07101D';
const panel = { background: '#0D1728', border: '1px solid #2A3A57', borderRadius: 18, padding: 20 } as const;

export default function SalesHome() {
  const steps = [
    ['01', 'Analyze', 'Start with the real business. Aridon scans the website, scores the major growth signals, and surfaces the strongest opportunities.'],
    ['02', 'Diagnose', 'A $198 diagnostic turns the scan into a more focused revenue, conversion, trust, follow-up, and AI opportunity review.'],
    ['03', 'Plan', 'The $497 Action Plan converts findings into a prioritized 90-day roadmap.'],
    ['04', 'Implement', 'Choose the $2,500 Sprint for focused fixes or the $7,500 Growth Engine for a broader done-for-you buildout.'],
    ['05', 'Manage', 'After implementation, qualified businesses can continue at $1,500/month for ongoing optimization and reporting.'],
  ];

  return (
    <main style={{ minHeight: '100vh', background: dark, color: '#F8FAFC', fontFamily: 'Arial, sans-serif' }}>
      <section style={{ maxWidth: 1160, margin: '0 auto', padding: '24px 20px 78px' }}>
        <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <Link href="/" style={{ color: '#fff', textDecoration: 'none', fontWeight: 950, letterSpacing: 1 }}>ARIDON</Link>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <Link href="/business-os/proof" style={nav}>Proof</Link>
            <Link href="/growth" style={nav}>Growth Packages</Link>
            <Link href="/analyze-business" style={smallButton}>Analyze My Business Free</Link>
          </div>
        </nav>

        <div className="hero" style={{ display: 'grid', gridTemplateColumns: '1.15fr .85fr', gap: 28, alignItems: 'center', paddingTop: 68 }}>
          <div>
            <div style={{ color: mint, fontWeight: 950, fontSize: 12, letterSpacing: 1.2 }}>ARIDON BUSINESS GROWTH SYSTEM</div>
            <h1 style={{ fontSize: 'clamp(48px,7vw,82px)', lineHeight: .94, letterSpacing: -3.5, margin: '14px 0 22px' }}>Find what the business is leaking. Then fix the parts worth fixing.</h1>
            <p style={{ color: '#B8C4D5', fontSize: 20, lineHeight: 1.65, maxWidth: 790 }}>Aridon starts with a free analysis instead of asking a business to buy a giant software package. If the evidence is strong enough, the customer can move from diagnosis to a plan, implementation, and ongoing managed growth.</p>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 24 }}>
              <Link href="/analyze-business" style={button}>Analyze My Business Free</Link>
              <Link href="/growth" style={outline}>See Growth Packages</Link>
            </div>
            <div style={{ display: 'flex', gap: 15, flexWrap: 'wrap', marginTop: 15, color: '#91A0B5', fontSize: 12, fontWeight: 800 }}><span>✓ No card for the free scan</span><span>✓ Secure Stripe checkout</span><span>✓ No revenue guarantee</span></div>
          </div>

          <aside style={{ ...panel, background: '#102033' }}>
            <div style={{ color: mint, fontSize: 11, fontWeight: 950 }}>THE MONEY STAIRCASE</div>
            {[
              ['Free', 'Business Scan', 'See the evidence first.'],
              ['$198', 'Starter Diagnostic', 'Find the highest-priority leaks.'],
              ['$497', 'Action Plan', 'Turn findings into a 90-day roadmap.'],
              ['$2,500', 'Implementation Sprint', 'Fix the highest-priority issues.'],
              ['$7,500', 'Growth Engine', 'Build the broader growth system.'],
              ['$1,500/mo', 'Managed Growth', 'Keep improving what was built.'],
            ].map(([price, title, text]) => <div key={title} style={{ borderTop: '1px solid #2A3A57', padding: '12px 0' }}><strong style={{ color: mint }}>{price}</strong> <strong>{title}</strong><div style={{ color: '#AEBBD0', lineHeight: 1.45, fontSize: 13, marginTop: 3 }}>{text}</div></div>)}
          </aside>
        </div>
      </section>

      <section style={{ background: '#F4F1E9', color: '#171717', padding: '68px 20px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ fontSize: 12, fontWeight: 950 }}>HOW IT WORKS</div>
          <h2 style={{ fontSize: 'clamp(38px,6vw,60px)', lineHeight: 1, letterSpacing: -2, margin: '10px 0 22px' }}>The customer climbs only when the next step makes economic sense.</h2>
          <div className="steps" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(190px,1fr))', gap: 12 }}>
            {steps.map(([n, title, text]) => <Step key={n} n={n} title={title} text={text} />)}
          </div>
        </div>
      </section>

      <section style={{ background: '#0A1422', padding: '68px 20px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ color: mint, fontWeight: 950, fontSize: 12 }}>SELL THE RESULT, NOT THE AI</div>
          <h2 style={{ fontSize: 'clamp(38px,6vw,60px)', lineHeight: 1, letterSpacing: -2, margin: '10px 0 22px' }}>The backend is built around business outcomes.</h2>
          <div className="features" style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 14 }}>
            <Feature title="Recover missed leads" text="Find stale inquiries, broken follow-up, weak calls to action, and other places where demand falls through the cracks." />
            <Feature title="Increase conversion" text="Improve offers, trust signals, landing pages, website messaging, and the path from interest to action." />
            <Feature title="Reduce manual work" text="Identify workflows where automation can reduce owner and staff time without surrendering consequential decisions." />
            <Feature title="Measure before expanding" text="Use a baseline and actual results to decide whether a larger implementation or managed service is justified." />
          </div>
        </div>
      </section>

      <section id="pricing" style={{ background: '#F4F1E9', color: '#171717', padding: '68px 20px' }}>
        <div style={{ maxWidth: 1050, margin: '0 auto' }}>
          <div style={{ fontSize: 12, fontWeight: 950 }}>PAID NEXT STEPS</div>
          <h2 style={{ fontSize: 'clamp(40px,6vw,62px)', lineHeight: 1, margin: '10px 0 18px' }}>Start small. Scale only after value is visible.</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(230px,1fr))', gap: 12 }}>
            {[
              highTicketOffers.healthScan,
              highTicketOffers.actionPlan,
              highTicketOffers.implementationSprint,
              highTicketOffers.growthEngine,
              highTicketOffers.managedGrowth,
            ].map((offer) => (
              <article key={offer.key} style={{ background: '#fff', border: '1px solid #D4CEC2', borderRadius: 18, padding: 20 }}>
                <strong style={{ fontSize: 30 }}>{offer.price}</strong><span style={{ color: '#6C665E', fontSize: 12 }}> {offer.priceDetail}</span>
                <h3 style={{ fontSize: 22, margin: '8px 0' }}>{offer.name}</h3>
                <p style={{ color: '#5D5A54', lineHeight: 1.55, minHeight: 96 }}>{offer.summary}</p>
                <a href={offer.href} style={{ ...darkButton, display: 'inline-block' }}>{offer.type === 'subscription' ? 'Start Managed Growth' : 'Book & Pay Securely'}</a>
              </article>
            ))}
          </div>
          <div style={{ marginTop: 18, display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
            <Link href="/growth" style={darkButton}>See Full Package Details</Link>
            <span style={{ fontSize: 12, color: '#777067' }}>Prices purchase the stated service. Results and revenue are not guaranteed.</span>
          </div>
        </div>
      </section>

      <footer style={{ padding: '28px 20px', borderTop: '1px solid #22324A', color: '#8FA0B8' }}><div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}><strong style={{ color: '#fff' }}>ARIDON</strong><span>Analyze → Diagnose → Plan → Implement → Measure → Manage</span></div></footer>
      <style>{`@media(max-width:820px){.hero,.features{grid-template-columns:1fr !important}}`}</style>
    </main>
  );
}

function Step({ n, title, text }: { n: string; title: string; text: string }) { return <article style={{ background: '#fff', border: '1px solid #D4CEC2', borderRadius: 16, padding: 19 }}><div style={{ fontSize: 12, fontWeight: 950, color: '#6B665E' }}>{n}</div><h3 style={{ fontSize: 24, margin: '8px 0' }}>{title}</h3><p style={{ color: '#5D5A54', lineHeight: 1.58, margin: 0 }}>{text}</p></article>; }
function Feature({ title, text }: { title: string; text: string }) { return <article style={panel}><h3 style={{ margin: '0 0 8px' }}>{title}</h3><p style={{ color: '#AEBBD0', lineHeight: 1.6, margin: 0 }}>{text}</p></article>; }
const nav = { color: '#DCE4EF', textDecoration: 'none', fontWeight: 800, fontSize: 13 } as const;
const smallButton = { background: mint, color: '#07130F', textDecoration: 'none', fontWeight: 950, padding: '10px 13px', borderRadius: 10, fontSize: 13 } as const;
const button = { background: mint, color: '#07130F', textDecoration: 'none', fontWeight: 950, padding: '14px 18px', borderRadius: 12, textAlign: 'center' as const };
const outline = { border: '1px solid #51617A', color: '#fff', textDecoration: 'none', fontWeight: 900, padding: '13px 17px', borderRadius: 12, textAlign: 'center' as const };
const darkButton = { background: '#102019', color: '#fff', textDecoration: 'none', fontWeight: 900, padding: '11px 14px', borderRadius: 10 } as const;
