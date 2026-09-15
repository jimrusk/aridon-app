'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';

const pillars = [
  ['LOWER COST OF LIVING', 'Cut recurring household costs through energy savings, efficiency, fraud prevention, local food resilience and smarter access to public programs.'],
  ['HOUSING', 'Find and rehabilitate vacant homes, unlock infill and ADUs, coordinate modular options, financing and contractor capacity.'],
  ['SMALL BUSINESS', 'Give owners an AI back office for cash flow, sales follow-up, marketing, procurement, funding, scheduling and compliance support.'],
  ['TRUST + FRAUD SHIELD', 'Verify suspicious messages, invoices, vendors, payment changes and high-impact actions before money or data moves.'],
  ['WATER RESILIENCE', 'Forecast, conserve, detect loss, reuse, treat and add supplemental supply while protecting water infrastructure.'],
  ['RURAL EMERGENCY COMMS', 'Layer fiber, cellular, satellite and low-bandwidth mesh with solar-backed critical nodes so alerts survive outages.'],
];

export default function CommunityResiliencePage() {
  const [homes, setHomes] = useState(100);
  const [businesses, setBusinesses] = useState(25);
  const [annualHomeSavings, setAnnualHomeSavings] = useState(900);
  const [annualBusinessSavings, setAnnualBusinessSavings] = useState(6000);

  const impact = useMemo(() => {
    const household = Math.max(0, homes) * Math.max(0, annualHomeSavings);
    const business = Math.max(0, businesses) * Math.max(0, annualBusinessSavings);
    return {
      household,
      business,
      total: household + business,
    };
  }, [homes, businesses, annualHomeSavings, annualBusinessSavings]);

  return (
    <main style={{ minHeight: '100vh', background: '#071019', color: '#F6F8FB', fontFamily: 'Arial, sans-serif' }}>
      <section style={{ maxWidth: 1180, margin: '0 auto', padding: '28px 20px 90px' }}>
        <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <Link href="/" style={{ color: '#fff', textDecoration: 'none', fontWeight: 950, letterSpacing: 1 }}>ARIDON</Link>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <Link href="/trust-layer" style={navLink}>Trust Layer</Link>
            <Link href="/business-os" style={navLink}>Business OS</Link>
            <Link href="/wildfire-resilience" style={navLink}>Wildfire Resilience</Link>
          </div>
        </nav>

        <header style={{ paddingTop: 72, maxWidth: 1020 }}>
          <div style={eyebrow}>ARIDON COMMUNITY RESILIENCE</div>
          <h1 style={{ fontSize: 'clamp(48px,7.5vw,92px)', lineHeight: .94, letterSpacing: -4, margin: '16px 0 20px' }}>
            Make one community cheaper to live in, safer to operate and harder to knock offline.
          </h1>
          <p style={{ color: '#B8C5D4', fontSize: 20, lineHeight: 1.65, maxWidth: 940 }}>
            A measurable public-private pilot that connects household savings, affordable housing, small-business support, fraud protection, water resilience and rural emergency communications through one operating layer.
          </p>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 24 }}>
            <a href="#pilot" style={primaryButton}>See the 100-Home Pilot</a>
            <a href="mailto:aridoninfo@aridon.info?subject=Aridon%20Community%20Resilience%20Pilot&body=We%20would%20like%20to%20explore%20an%20Aridon%20Community%20Resilience%20pilot.%0A%0ACommunity%3A%0AOrganization%3A%0APriority%20problems%3A%0APreferred%20contact%3A" style={secondaryButton}>Request a Community Pilot</a>
          </div>
        </header>

        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginTop: 36 }} className="threeGrid">
          {pillars.map(([title, copy]) => (
            <article key={title} style={card}>
              <div style={eyebrow}>{title}</div>
              <p style={{ color: '#B8C5D4', lineHeight: 1.65, marginBottom: 0 }}>{copy}</p>
            </article>
          ))}
        </section>

        <section id="pilot" style={{ marginTop: 28, background: '#F1EEE5', color: '#151515', borderRadius: 24, padding: 28 }}>
          <div style={{ fontSize: 12, fontWeight: 950, letterSpacing: 1 }}>THE FIRST DEMONSTRATION</div>
          <h2 style={{ fontSize: 42, margin: '10px 0' }}>100 homes + 25 small businesses + 1 water system + a rural emergency network.</h2>
          <p style={{ color: '#56524B', fontSize: 18, lineHeight: 1.7, maxWidth: 930 }}>
            The pilot is deliberately small enough to execute and large enough to produce government-grade evidence. Every intervention is measured before and after so a city, county, Tribe, utility or cooperative can decide whether to scale it.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginTop: 18 }} className="fourGrid">
            {[
              ['100', 'Households enrolled'],
              ['25', 'Small businesses supported'],
              ['1', 'Water utility or system'],
              ['1', 'Emergency communications zone'],
            ].map(([value, label]) => (
              <div key={label} style={{ background: '#fff', borderRadius: 16, padding: 18 }}>
                <div style={{ fontSize: 38, fontWeight: 950 }}>{value}</div>
                <div style={{ color: '#666158', fontWeight: 800, marginTop: 5 }}>{label}</div>
              </div>
            ))}
          </div>
        </section>

        <section style={{ marginTop: 28, background: '#0C1826', border: '1px solid #23364E', borderRadius: 24, padding: 26 }}>
          <div style={eyebrow}>IMPACT CALCULATOR</div>
          <h2 style={{ fontSize: 40, margin: '9px 0 8px' }}>Put a dollar target on the pilot.</h2>
          <p style={{ color: '#9FB0C4', lineHeight: 1.6, maxWidth: 900 }}>These are planning assumptions, not promised savings. Replace them with measured local baselines during pilot design.</p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginTop: 18 }} className="fourGrid">
            <NumberField label="Homes" value={homes} onChange={setHomes} />
            <NumberField label="Annual savings / home" value={annualHomeSavings} onChange={setAnnualHomeSavings} prefix="$" />
            <NumberField label="Small businesses" value={businesses} onChange={setBusinesses} />
            <NumberField label="Annual savings / business" value={annualBusinessSavings} onChange={setAnnualBusinessSavings} prefix="$" />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginTop: 16 }} className="threeGrid">
            <Metric label="Household annual savings target" value={impact.household} />
            <Metric label="Business annual savings target" value={impact.business} />
            <Metric label="Combined annual savings target" value={impact.total} emphasis />
          </div>
        </section>

        <section style={{ marginTop: 28 }}>
          <div style={eyebrow}>WHAT GOVERNMENT CAN MEASURE</div>
          <h2 style={{ fontSize: 42, margin: '10px 0 16px' }}>No vague innovation theater. A scoreboard.</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 12 }} className="twoGrid">
            {[
              ['Household economics', 'Monthly dollars saved, kWh reduced, avoided fraud losses, utility burden and participation rate.'],
              ['Housing', 'Vacant units identified, homes rehabilitated, cost per unit, time to occupancy and financing secured.'],
              ['Small business', 'Hours saved, receivables accelerated, new leads, operating-cost reduction, capital accessed and survival indicators.'],
              ['Trust + fraud', 'Threats screened, high-risk payments held, false positives, confirmed fraud prevented and verification completion time.'],
              ['Water', 'Gallons conserved, leak loss reduced, treatment/reuse output, supplemental supply, outage minutes and emergency reserve.'],
              ['Emergency communications', 'Coverage added, critical nodes protected, failover time, backup-runtime hours and alert-delivery success.'],
            ].map(([title, copy]) => <article key={title} style={card}><h3 style={{ marginTop: 0 }}>{title}</h3><p style={{ color: '#B8C5D4', lineHeight: 1.65, marginBottom: 0 }}>{copy}</p></article>)}
          </div>
        </section>

        <section style={{ marginTop: 28, border: '1px solid #28425A', borderRadius: 24, padding: 28, background: '#09141F' }}>
          <div style={eyebrow}>ARIDON OPERATING MODEL</div>
          <h2 style={{ fontSize: 40, margin: '10px 0' }}>One community. Six workstreams. One evidence trail.</h2>
          <p style={{ color: '#AFC0D1', lineHeight: 1.7, fontSize: 18, maxWidth: 980 }}>
            Business OS coordinates work. Trust Layer verifies people, communications, vendors and consequential actions. Sentinel protects AI and connected-tool activity. Water and energy modules track infrastructure. Every result feeds a shared impact ledger so public partners can see what worked, what failed and what should scale.
          </p>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 18 }}>
            <Link href="/trust-layer" style={primaryButton}>Test Trust Layer</Link>
            <a href="mailto:aridoninfo@aridon.info?subject=Government%20Resilience%20Pilot%20Briefing" style={secondaryButton}>Request Government Briefing</a>
          </div>
        </section>
      </section>
      <style>{`html{scroll-behavior:smooth}@media(max-width:900px){.fourGrid,.threeGrid,.twoGrid{grid-template-columns:1fr !important}}`}</style>
    </main>
  );
}

function NumberField({ label, value, onChange, prefix = '' }: { label: string; value: number; onChange: (n: number) => void; prefix?: string }) {
  return (
    <label style={{ display: 'block' }}>
      <span style={{ display: 'block', color: '#9FB0C4', fontSize: 12, fontWeight: 950, marginBottom: 7 }}>{label}</span>
      <div style={{ display: 'flex', alignItems: 'center', background: '#06101A', border: '1px solid #2B4058', borderRadius: 12, padding: '0 12px' }}>
        {prefix && <span style={{ color: '#84E7C7', fontWeight: 950 }}>{prefix}</span>}
        <input type="number" min={0} value={value} onChange={(e) => onChange(Number(e.target.value || 0))} style={{ width: '100%', border: 0, outline: 0, background: 'transparent', color: '#fff', padding: '13px 8px', fontSize: 18, fontWeight: 850 }} />
      </div>
    </label>
  );
}

function Metric({ label, value, emphasis = false }: { label: string; value: number; emphasis?: boolean }) {
  return (
    <div style={{ background: emphasis ? '#84E7C7' : '#111E2D', color: emphasis ? '#07130F' : '#fff', borderRadius: 16, padding: 20 }}>
      <div style={{ fontSize: 12, fontWeight: 950, opacity: .75 }}>{label}</div>
      <div style={{ fontSize: 34, fontWeight: 950, marginTop: 8 }}>${Math.round(value).toLocaleString()}</div>
    </div>
  );
}

const navLink = { color: '#DCE5EF', textDecoration: 'none', fontWeight: 850 } as const;
const eyebrow = { color: '#84E7C7', fontSize: 12, fontWeight: 950, letterSpacing: 1.05 } as const;
const card = { background: '#0E1A28', border: '1px solid #23364E', borderRadius: 18, padding: 20 } as const;
const primaryButton = { display: 'inline-block', borderRadius: 12, padding: '14px 20px', background: '#84E7C7', color: '#06120E', fontWeight: 950, textDecoration: 'none' } as const;
const secondaryButton = { display: 'inline-block', borderRadius: 12, padding: '14px 20px', border: '1px solid #49647E', color: '#F7F9FB', fontWeight: 900, textDecoration: 'none' } as const;
