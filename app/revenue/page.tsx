import Link from 'next/link';

const mint = '#9EF0CF';
const dark = '#07101D';
const panel = '#102033';

const testCheckout = {
  health: 'https://book.stripe.com/test_fZu3cu9zNaLhabQggi4AU00',
  growth: 'https://book.stripe.com/test_7sY4gyfYb2eLabQ9RU4AU01',
  executive: 'https://book.stripe.com/test_8x214m3bp06D2Jo0hk4AU02',
  acquisition: 'https://book.stripe.com/test_eVqeVceU73iP4Rwfce4AU03',
  subscription: 'https://buy.stripe.com/test_9B69AS8vJ06D6ZE1lo4AU04',
} as const;

const liveCheckout = {
  health: process.env.ARIDON_CHECKOUT_HEALTH_SCAN_URL || '',
  growth: process.env.ARIDON_CHECKOUT_GROWTH_BLUEPRINT_URL || '',
  executive: process.env.ARIDON_CHECKOUT_EXECUTIVE_AUDIT_URL || '',
  acquisition: process.env.ARIDON_CHECKOUT_ACQUISITION_DD_URL || '',
  subscription: process.env.ARIDON_CHECKOUT_BUSINESS_OS_URL || '',
} as const;

type OfferKey = keyof typeof testCheckout;

function checkoutUrl(key: OfferKey) {
  const isProduction = process.env.VERCEL_ENV === 'production';
  if (!isProduction) return testCheckout[key];
  return liveCheckout[key] || '/analyze-business';
}

function checkoutLabel(key: OfferKey) {
  const isProduction = process.env.VERCEL_ENV === 'production';
  if (!isProduction) return key === 'subscription' ? 'Test Subscription Checkout' : 'Test Checkout';
  return liveCheckout[key] ? (key === 'subscription' ? 'Start Aridon' : 'Buy This Package') : 'Start With Free Analysis';
}

const offers = [
  {
    key: 'health' as const,
    price: '$198',
    name: 'Business Health Scan',
    eyebrow: 'FASTEST PAID ENTRY',
    summary: 'A focused diagnostic that finds where a business is leaking attention, trust, conversion and revenue.',
    items: [
      'Website and conversion review',
      'Revenue-leak identification',
      'AI and automation opportunity scan',
      'Prioritized action list',
    ],
    bestFor: 'Owners who want a clear answer before committing to a larger engagement.',
  },
  {
    key: 'growth' as const,
    price: '$495',
    name: 'Growth Blueprint',
    eyebrow: '90-DAY DIRECTION',
    summary: 'A deeper business-growth package that turns the diagnostic into a practical operating roadmap.',
    items: [
      'Everything in the Health Scan',
      'Sales and marketing opportunity map',
      'Automation opportunities',
      'Competitive-position review',
      '90-day growth roadmap',
    ],
    bestFor: 'Businesses that know they have upside but need the next moves organized in the right order.',
  },
  {
    key: 'executive' as const,
    price: '$1,500',
    name: 'Executive Business Audit',
    eyebrow: 'FULL EXECUTIVE LENS',
    summary: 'A multi-lens review of growth, operations, finance, market position and execution priorities.',
    items: [
      'Executive-team analysis',
      'Market and competitor review',
      'AI implementation plan',
      'Sales-strategy priorities',
      'Operating and decision roadmap',
    ],
    bestFor: 'Established businesses facing several intertwined problems instead of one isolated issue.',
  },
  {
    key: 'acquisition' as const,
    price: '$2,500',
    name: 'Acquisition Due-Diligence Package',
    eyebrow: 'BUYER DECISION PACKAGE',
    summary: 'A decision-ready package for evaluating a target business and structuring a stronger acquisition approach.',
    items: [
      'Deal economics and risk review',
      'Seller-financing structure',
      'Website and operating upside',
      'Diligence questions and red flags',
      'Proposed offer framework',
    ],
    bestFor: 'Buyers evaluating a real target who need the upside, risks and deal structure in one place.',
  },
];

export default function RevenueStorefront() {
  return (
    <main style={{ minHeight: '100vh', background: dark, color: '#F8FAFC', fontFamily: 'Arial,sans-serif' }}>
      <section style={{ maxWidth: 1180, margin: '0 auto', padding: '24px 20px 72px' }}>
        <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <Link href="/sales" style={{ color: '#fff', textDecoration: 'none', fontWeight: 950, letterSpacing: 1 }}>ARIDON</Link>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <Link href="/sales" style={nav}>Overview</Link>
            <Link href="/business-os/proof" style={nav}>Proof</Link>
            <a href="#offers" style={nav}>Offers</a>
            <a href="#subscription" style={nav}>Subscription</a>
            <Link href="/analyze-business" style={smallButton}>Analyze My Business Free</Link>
          </div>
        </nav>

        <div className="hero" style={{ display: 'grid', gridTemplateColumns: '1.15fr .85fr', gap: 28, alignItems: 'center', paddingTop: 70 }}>
          <div>
            <div style={{ color: mint, fontWeight: 950, fontSize: 12, letterSpacing: 1.2 }}>ARIDON REVENUE STOREFRONT</div>
            <h1 style={{ fontSize: 'clamp(48px,7vw,82px)', lineHeight: .94, letterSpacing: -3.5, margin: '14px 0 22px' }}>Buy the next measurable business outcome, not a pile of AI features.</h1>
            <p style={{ color: '#B8C4D5', fontSize: 20, lineHeight: 1.65, maxWidth: 790 }}>Start free, buy a focused result when it makes sense, then move into the ongoing Aridon operating system only when the value is clear.</p>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 24 }}>
              <Link href="/analyze-business" style={button}>Analyze My Business Free</Link>
              <a href="#offers" style={outline}>See Paid Packages</a>
            </div>
            <div style={{ display: 'flex', gap: 15, flexWrap: 'wrap', marginTop: 15, color: '#91A0B5', fontSize: 12, fontWeight: 800 }}>
              <span>✓ Clear scope</span><span>✓ Fixed starting prices</span><span>✓ Owner approval stays in control</span>
            </div>
          </div>

          <aside style={{ background: panel, border: '1px solid #2A3A57', borderRadius: 22, padding: 22 }}>
            <div style={{ color: mint, fontSize: 11, fontWeight: 950 }}>THE REVENUE LADDER</div>
            <h2 style={{ fontSize: 30, lineHeight: 1.05, margin: '10px 0 12px' }}>One front door. Several ways to buy.</h2>
            {[
              ['$0', 'Free business analysis', 'Prove value before asking for money.'],
              ['$198', 'Health Scan', 'Turn interest into a low-friction paid engagement.'],
              ['$495+', 'Blueprints and audits', 'Sell deeper analysis when the problem justifies it.'],
              ['$497/mo', 'Business OS', 'Convert successful engagements into recurring revenue.'],
            ].map(([price, title, text]) => (
              <div key={title} style={{ borderTop: '1px solid #2A3A57', padding: '13px 0', display: 'grid', gridTemplateColumns: '82px 1fr', gap: 10 }}>
                <strong style={{ color: mint }}>{price}</strong>
                <div><strong>{title}</strong><div style={{ color: '#AEBBD0', lineHeight: 1.45, fontSize: 13, marginTop: 4 }}>{text}</div></div>
              </div>
            ))}
          </aside>
        </div>
      </section>

      <section id="offers" style={{ background: '#F4F1E9', color: '#171717', padding: '72px 20px' }}>
        <div style={{ maxWidth: 1120, margin: '0 auto' }}>
          <div style={{ fontSize: 12, fontWeight: 950 }}>FIXED-SCOPE OFFERS</div>
          <h2 style={{ fontSize: 'clamp(38px,6vw,60px)', lineHeight: 1, letterSpacing: -2, margin: '10px 0 18px' }}>Four clean ways to turn Aridon into cash flow.</h2>
          <p style={{ color: '#5D5A54', fontSize: 18, lineHeight: 1.65, maxWidth: 800 }}>Each package has a defined business outcome. Customers can start small, then move deeper only when the economics make sense.</p>

          <div className="offerGrid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16, marginTop: 28 }}>
            {offers.map((offer) => (
              <article key={offer.name} style={{ background: '#fff', border: '1px solid #D4CEC2', borderRadius: 20, padding: 24, display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ fontSize: 11, fontWeight: 950, color: '#6B665E', letterSpacing: .8 }}>{offer.eyebrow}</div>
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                  <h3 style={{ fontSize: 31, margin: 0 }}>{offer.name}</h3>
                  <strong style={{ fontSize: 34 }}>{offer.price}</strong>
                </div>
                <p style={{ color: '#5D5A54', lineHeight: 1.6, margin: '2px 0 4px' }}>{offer.summary}</p>
                <ul style={{ color: '#3F3C37', lineHeight: 1.85, paddingLeft: 20, margin: '4px 0 6px' }}>{offer.items.map((item) => <li key={item}>{item}</li>)}</ul>
                <div style={{ background: '#F4F1E9', borderRadius: 12, padding: 12, color: '#5D5A54', lineHeight: 1.5, fontSize: 13 }}><strong style={{ color: '#171717' }}>Best for:</strong> {offer.bestFor}</div>
                <a href={checkoutUrl(offer.key)} style={{ ...darkButton, marginTop: 'auto' }}>{checkoutLabel(offer.key)}</a>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="subscription" style={{ background: '#0A1422', padding: '72px 20px' }}>
        <div className="subscription" style={{ maxWidth: 1080, margin: '0 auto', display: 'grid', gridTemplateColumns: '.8fr 1.2fr', gap: 20, alignItems: 'stretch' }}>
          <div style={{ background: panel, border: '1px solid #2A3A57', borderRadius: 20, padding: 26 }}>
            <div style={{ color: mint, fontWeight: 950, fontSize: 12 }}>RECURRING REVENUE</div>
            <div style={{ marginTop: 10 }}><strong style={{ fontSize: 58 }}>$497</strong><span style={{ fontSize: 18 }}> / month</span></div>
            <h2 style={{ fontSize: 34, lineHeight: 1.05, margin: '12px 0' }}>Aridon Business OS</h2>
            <p style={{ color: '#B8C4D5', lineHeight: 1.65 }}>For customers who want Aridon continuously connected to the work instead of purchasing one isolated report at a time.</p>
            <a href={checkoutUrl('subscription')} style={button}>{checkoutLabel('subscription')}</a>
            <p style={{ fontSize: 12, color: '#91A0B5', lineHeight: 1.5, marginTop: 12 }}>No revenue guarantee. A paid subscription is an explicit customer decision and can be managed under the applicable billing terms.</p>
          </div>

          <div style={{ background: '#F4F1E9', color: '#171717', borderRadius: 20, padding: 26 }}>
            <div style={{ fontSize: 12, fontWeight: 950 }}>WHAT THE SUBSCRIPTION IS FOR</div>
            <h3 style={{ fontSize: 36, lineHeight: 1.05, margin: '10px 0 16px' }}>Keep the executive operating loop running.</h3>
            <div className="features" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
              <Feature title="Executive analysis" text="Operations, growth, finance, research and risk thinking around the same business context." />
              <Feature title="Revenue recovery" text="Keep watching for stale leads, weak follow-up, missed conversion and other recoverable opportunity." />
              <Feature title="Connected execution" text="Projects, tasks and company context stay connected instead of disappearing into isolated chats." />
              <Feature title="Owner control" text="Consequential actions stay behind explicit human approval rather than disappearing into an autonomous black box." />
            </div>
          </div>
        </div>
      </section>

      <section style={{ background: '#F4F1E9', color: '#171717', padding: '72px 20px' }}>
        <div style={{ maxWidth: 1080, margin: '0 auto' }}>
          <div style={{ fontSize: 12, fontWeight: 950 }}>HOW THE FUNNEL WORKS</div>
          <h2 style={{ fontSize: 'clamp(38px,6vw,60px)', lineHeight: 1, letterSpacing: -2, margin: '10px 0 24px' }}>Every offer has a job in the funnel.</h2>
          <div className="steps" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
            <Step n="01" title="Prove" text="The free analyzer earns attention by showing something useful on the customer's own business." />
            <Step n="02" title="Convert" text="The $198 scan creates the first paid relationship without demanding a large commitment." />
            <Step n="03" title="Deepen" text="Blueprints, audits and acquisition packages monetize more complex work." />
            <Step n="04" title="Retain" text="Successful customers move into the $497/month operating system when recurring value is clear." />
          </div>
        </div>
      </section>

      <section style={{ background: '#07101D', padding: '64px 20px' }}>
        <div style={{ maxWidth: 980, margin: '0 auto' }}>
          <div style={{ color: mint, fontSize: 12, fontWeight: 950 }}>BUYER CONFIDENCE</div>
          <h2 style={{ fontSize: 'clamp(36px,5vw,54px)', margin: '10px 0 20px', lineHeight: 1 }}>What happens after checkout?</h2>
          <div className="faq" style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 12 }}>
            <Feature title="1. Intake" text="Checkout gathers the identifying business information needed to start the selected package." />
            <Feature title="2. Analysis" text="Aridon applies the package scope to the real business, website or acquisition target supplied by the customer." />
            <Feature title="3. Decision-ready output" text="The deliverable focuses on findings, priorities and recommended next actions rather than raw AI chatter." />
            <Feature title="4. Optional continuation" text="The customer can stop with the package or continue into a larger engagement or recurring Business OS subscription." />
          </div>
          <div style={{ marginTop: 26, borderTop: '1px solid #22324A', paddingTop: 18, color: '#91A0B5', lineHeight: 1.6, fontSize: 13 }}>Acquisition analysis is decision support, not legal, tax, accounting or investment advice. Customers should use qualified professional advisers for those functions when appropriate.</div>
        </div>
      </section>

      <footer style={{ padding: '28px 20px', borderTop: '1px solid #22324A', color: '#8FA0B8' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <strong style={{ color: '#fff' }}>ARIDON</strong>
          <span>Free proof → focused offer → deeper engagement → recurring value</span>
        </div>
      </footer>

      <style>{`@media(max-width:820px){.hero,.offerGrid,.subscription,.features,.faq,.steps{grid-template-columns:1fr !important}}`}</style>
    </main>
  );
}

function Step({ n, title, text }: { n: string; title: string; text: string }) {
  return <article style={{ background: '#fff', border: '1px solid #D4CEC2', borderRadius: 16, padding: 18 }}><div style={{ fontSize: 12, fontWeight: 950, color: '#6B665E' }}>{n}</div><h3 style={{ fontSize: 24, margin: '8px 0' }}>{title}</h3><p style={{ color: '#5D5A54', lineHeight: 1.6, margin: 0 }}>{text}</p></article>;
}

function Feature({ title, text }: { title: string; text: string }) {
  return <article style={{ background: '#0D1728', border: '1px solid #2A3A57', borderRadius: 16, padding: 18, color: '#fff' }}><h3 style={{ margin: '0 0 8px' }}>{title}</h3><p style={{ color: '#AEBBD0', lineHeight: 1.6, margin: 0 }}>{text}</p></article>;
}

const nav = { color: '#DCE4EF', textDecoration: 'none', fontWeight: 800, fontSize: 13 } as const;
const smallButton = { background: mint, color: '#07130F', textDecoration: 'none', fontWeight: 950, padding: '10px 13px', borderRadius: 10, fontSize: 13 } as const;
const button = { display: 'inline-block', background: mint, color: '#07130F', textDecoration: 'none', fontWeight: 950, padding: '14px 18px', borderRadius: 12, textAlign: 'center' as const };
const darkButton = { display: 'inline-block', background: '#171717', color: '#fff', textDecoration: 'none', fontWeight: 950, padding: '13px 16px', borderRadius: 12, textAlign: 'center' as const };
const outline = { border: '1px solid #51617A', color: '#fff', textDecoration: 'none', fontWeight: 900, padding: '13px 17px', borderRadius: 12, textAlign: 'center' as const };
