import Link from 'next/link';

const packages = [
  {
    name: 'AI Revenue Sprint',
    price: '$495',
    tag: 'Fastest first sale',
    checkoutUrl: 'https://book.stripe.com/aFa00i3bp5qX97Me8a4AU07',
    items: [
      'Business + website diagnostic',
      'Offer and positioning improvements',
      'Competitor gap check',
      '3 follow-up emails',
      'Sales message + CTA',
      '30-day content plan',
      'Prioritized action list',
    ],
  },
  {
    name: 'Growth Sprint',
    price: '$995',
    tag: 'Best value',
    checkoutUrl: 'https://book.stripe.com/4gMfZg8vJ7z5abQe8a4AU08',
    items: [
      'Everything in AI Revenue Sprint',
      '10 qualified prospect targets',
      'Website copy improvement plan',
      'Sales scripts and objections',
      'Multi-channel marketing campaign',
      'Lead follow-up sequence',
      'Implementation roadmap',
    ],
  },
  {
    name: 'Growth Build',
    price: '$1,995',
    tag: 'Done-with-you implementation',
    checkoutUrl: 'https://book.stripe.com/dRmaEW8vJf1xes65BE4AU09',
    items: [
      'Everything in Growth Sprint',
      'Campaign asset buildout',
      'Sales materials + outreach kit',
      'Automation opportunity setup plan',
      'Conversion and follow-up improvements',
      'Weekly execution checkpoint',
      '30-day implementation support',
    ],
  },
];

const monthlyPlans = [
  {
    price: '$298/mo',
    name: 'Essentials',
    description: 'Monthly review + prioritized growth actions.',
    checkoutUrl: 'https://buy.stripe.com/00wbJ06nBg5B97M5BE4AU0a',
  },
  {
    price: '$795/mo',
    name: 'Growth',
    description: 'Ongoing campaigns, follow-up, research, and sales support.',
    checkoutUrl: 'https://buy.stripe.com/3cI28q7rFcTpfwa4xA4AU0b',
  },
  {
    price: '$1,995/mo',
    name: 'Growth Partner',
    description: 'High-touch execution and implementation support.',
    checkoutUrl: 'https://buy.stripe.com/cNi4gycLZ8D93Ns5BE4AU0c',
  },
];

export default function GrowthDeskPage() {
  return (
    <main style={page}>
      <div style={shell}>
        <header style={header}>
          <div>
            <div style={eyebrow}>ARIDON AI GROWTH DESK</div>
            <h1 style={heroTitle}>Turn business problems into finished growth work.</h1>
            <p style={lead}>Aridon combines business analysis, sales, marketing, website improvement, prospect research, follow-up, and AI automation into one focused service. No prompt packs. No homework pile. We build the work that helps move the business forward.</p>
          </div>
          <div style={headerActions}>
            <Link href="/customer/start" style={ghostButton}>Open Aridon</Link>
            <Link href="/customer/sales" style={primaryButton}>Find Prospects</Link>
          </div>
        </header>

        <section style={heroPanel}>
          <div>
            <div style={eyebrow}>START SMALL · PROVE VALUE · EXPAND</div>
            <h2 style={{ margin: '8px 0 8px', fontSize: 32 }}>A productized service designed for speed to revenue.</h2>
            <p style={muted}>The first goal is not to sell software. It is to sell a clear result to a business with a visible problem, deliver quickly using Aridon, then convert the relationship into recurring support.</p>
          </div>
          <div style={processGrid}>
            {['Diagnose', 'Prioritize', 'Build', 'Deliver', 'Follow up', 'Retain'].map((step, index) => (
              <div key={step} style={processCard}><strong>{index + 1}. {step}</strong></div>
            ))}
          </div>
        </section>

        <section style={section}>
          <div style={eyebrow}>FIXED-PRICE OFFERS</div>
          <h2 style={sectionTitle}>Three simple ways to buy.</h2>
          <div style={cards}>
            {packages.map((pkg) => (
              <article key={pkg.name} style={card}>
                <div style={{ color: '#8FE2C2', fontSize: 12, fontWeight: 900 }}>{pkg.tag}</div>
                <h3 style={{ margin: '7px 0 4px', fontSize: 25 }}>{pkg.name}</h3>
                <div style={{ fontSize: 36, fontWeight: 950, marginBottom: 12 }}>{pkg.price}</div>
                <div style={{ display: 'grid', gap: 8 }}>
                  {pkg.items.map((item) => <div key={item} style={itemRow}>✓ {item}</div>)}
                </div>
                <a href={pkg.checkoutUrl} style={{ ...primaryButton, marginTop: 18, display: 'inline-block' }}>Book & Pay Securely</a>
                <div style={secureNote}>Secure live checkout powered by Stripe.</div>
              </article>
            ))}
          </div>
        </section>

        <section style={sectionAlt}>
          <div>
            <div style={eyebrow}>RECURRING REVENUE</div>
            <h2 style={sectionTitle}>Aridon AI Growth Desk Monthly</h2>
            <p style={muted}>After the first project, qualified customers can move into ongoing support for campaigns, follow-up, proposals, prospect research, website improvements, competitive checks, and workflow automation.</p>
          </div>
          <div style={monthlyGrid}>
            {monthlyPlans.map((plan) => (
              <article key={plan.name} style={monthlyCard}>
                <strong style={{ fontSize: 24 }}>{plan.price}</strong>
                <span style={{ fontWeight: 900 }}>{plan.name}</span>
                <small style={{ color: '#AEB9CB', lineHeight: 1.45 }}>{plan.description}</small>
                <a href={plan.checkoutUrl} style={{ ...primaryButton, display: 'inline-block', marginTop: 6, textAlign: 'center' }}>Subscribe</a>
              </article>
            ))}
          </div>
          <p style={{ ...muted, marginTop: 12, fontSize: 12 }}>Monthly plans renew automatically each month until canceled. Checkout collects payment securely through Stripe.</p>
        </section>

        <section style={section}>
          <div style={eyebrow}>7-DAY FIRST-SALES SPRINT</div>
          <h2 style={sectionTitle}>The operating plan.</h2>
          <div style={timeline}>
            {[
              ['Day 1', 'Pick one industry and create one strong demonstration audit.'],
              ['Day 2', 'Build a before/after sample and a fixed-price offer.'],
              ['Day 3', 'Use Scout to identify 25 businesses with visible growth problems.'],
              ['Day 4', 'Contact the best 10 with one specific useful observation.'],
              ['Day 5', 'Run short diagnostics and ask for the first paid sprint.'],
              ['Day 6', 'Deliver using Creator Studio + the AI Master Library.'],
              ['Day 7', 'Ask for a testimonial/referral and offer monthly Growth Desk support.'],
            ].map(([day, action]) => <div key={day} style={timelineRow}><strong>{day}</strong><span>{action}</span></div>)}
          </div>
        </section>

        <section style={ctaPanel}>
          <div>
            <div style={eyebrow}>SELL THE RESULT, NOT THE TOOL</div>
            <h2 style={{ margin: '7px 0 7px', fontSize: 30 }}>Aridon has the machinery. Now use it to close paying work.</h2>
            <p style={{ margin: 0, color: '#21312A', lineHeight: 1.6 }}>Start with one industry, one offer, and ten high-fit prospects. Revenue is never guaranteed, but this path is built to shorten the distance between capability and a customer saying yes.</p>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <Link href="/customer/sales" style={darkButton}>Build Prospect List</Link>
            <Link href="/customer/creator" style={outlineDarkButton}>Build Campaign</Link>
          </div>
        </section>

        <p style={footnote}>Live Stripe checkout is enabled for all six Growth Desk offers. Project scope, kickoff timing, and required customer inputs are confirmed after checkout.</p>
      </div>
    </main>
  );
}

const page = { minHeight: '100vh', background: '#07101A', color: '#F8FAFC', fontFamily: 'Arial, sans-serif', padding: '28px 18px 100px' };
const shell = { maxWidth: 1160, margin: '0 auto' };
const header = { display: 'flex', justifyContent: 'space-between', gap: 24, alignItems: 'start', flexWrap: 'wrap' as const, marginBottom: 18 };
const headerActions = { display: 'flex', gap: 10, flexWrap: 'wrap' as const };
const eyebrow = { color: '#79E0BC', fontSize: 11, letterSpacing: 1.4, fontWeight: 950 };
const heroTitle = { fontSize: 'clamp(42px,7vw,72px)', lineHeight: .98, margin: '9px 0 12px', maxWidth: 840 };
const lead = { maxWidth: 860, color: '#BBC7D6', lineHeight: 1.7, fontSize: 18 };
const muted = { color: '#AEB9CB', lineHeight: 1.65, margin: 0 };
const primaryButton = { background: '#9EF0CF', color: '#07130F', borderRadius: 10, padding: '11px 14px', textDecoration: 'none', fontWeight: 950 };
const ghostButton = { border: '1px solid #334155', color: '#F8FAFC', borderRadius: 10, padding: '10px 13px', textDecoration: 'none', fontWeight: 850 };
const heroPanel = { background: 'linear-gradient(135deg,#122233,#10271F)', border: '1px solid #294057', borderRadius: 20, padding: 22, display: 'grid', gap: 18 };
const processGrid = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(130px,1fr))', gap: 9 };
const processCard = { background: '#09131F', border: '1px solid #2A3A4E', borderRadius: 11, padding: 12, color: '#DCE7F2' };
const section = { marginTop: 24 };
const sectionAlt = { marginTop: 24, background: '#0E1825', border: '1px solid #223146', borderRadius: 18, padding: 20 };
const sectionTitle = { fontSize: 32, margin: '7px 0 13px' };
const cards = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: 12 };
const card = { background: '#0D1723', border: '1px solid #243449', borderRadius: 16, padding: 18 };
const itemRow = { color: '#CCD6E3', lineHeight: 1.45, fontSize: 14 };
const secureNote = { color: '#8495AA', fontSize: 11, marginTop: 8 };
const monthlyGrid = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 10, marginTop: 14 };
const monthlyCard = { background: '#09131F', border: '1px solid #26374D', borderRadius: 13, padding: 15, display: 'grid', gap: 6 };
const timeline = { display: 'grid', gap: 8 };
const timelineRow = { display: 'grid', gridTemplateColumns: '80px 1fr', gap: 12, alignItems: 'start', background: '#0E1825', border: '1px solid #223146', borderRadius: 12, padding: 13 };
const ctaPanel = { marginTop: 26, background: '#DDF8ED', color: '#102019', borderRadius: 18, padding: 20, display: 'flex', justifyContent: 'space-between', gap: 18, alignItems: 'center', flexWrap: 'wrap' as const };
const darkButton = { background: '#102019', color: '#FFFFFF', borderRadius: 10, padding: '11px 14px', textDecoration: 'none', fontWeight: 900 };
const outlineDarkButton = { border: '1px solid #49675B', color: '#102019', borderRadius: 10, padding: '10px 13px', textDecoration: 'none', fontWeight: 900 };
const footnote = { color: '#7F8EA2', fontSize: 12, lineHeight: 1.5, marginTop: 18 };
