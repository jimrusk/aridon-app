'use client';

import Link from 'next/link';

const executives = [
  { name: 'Eva', role: 'AI Command Advisor & Chief of Staff', finding: 'Coordinate a 14-day member-growth and operations pilot around public data, staffing pressure, geographic expansion, and service-channel follow-through.' },
  { name: 'Heather', role: 'COO', finding: 'Map member-service workflows across branches, phone, chat, email, mobile banking, and Facebook messaging, then identify handoff delays and operational friction.' },
  { name: 'Ledger', role: 'CRO', finding: 'Model growth campaigns around existing checking, loan, business-banking, and digital-service products without using protected member data.' },
  { name: 'Oracle', role: 'CMCO', finding: 'Build localized campaigns for eligible Oklahoma and Texas communities and improve product positioning around financial wellness, rewards, and security.' },
  { name: 'Ethos', role: 'CLRO', finding: 'Require vendor-risk, privacy, recordkeeping, human approval, and regulated-data boundaries before any production integration.' },
  { name: 'Scout', role: 'CSO', finding: 'Research underpenetrated service areas, nearby employer groups, community partnerships, and growth opportunities across the expanded field of membership.' },
  { name: 'Atlas', role: 'CTO', finding: 'Create a technology and workflow inventory for digital banking, website chat, fraud alerts, mobile, website, and internal support systems before proposing connectors.' },
  { name: 'Nova', role: 'CFO', finding: 'Track pilot economics through measurable outcomes such as lead response time, campaign conversion, staff capacity recovered, and product adoption lift.' },
];

const opportunities = [
  ['Member Growth', 'Use public eligibility geography and existing product mix to build localized acquisition campaigns for Oklahoma and Texas communities.'],
  ['Product Expansion', 'Identify ways to increase awareness and adoption of checking, auto loans, mortgages, home-equity, business invoicing, digital banking, and protection products.'],
  ['Hiring & Capacity', 'Support recruiting and onboarding around current loan administration and IT/electronic-services hiring needs while documenting operational knowledge.'],
  ['Member Service', 'Analyze public-facing service channels and design cleaner routing, follow-up, escalation, and management visibility.'],
  ['Fraud Education', 'Turn existing fraud and identity-protection material into a continuously refreshed member-education program with compliance review.'],
  ['Leadership Visibility', 'Give executives one command layer for priorities, experiments, results, risks, staffing, campaigns, and follow-up without replacing core banking systems.'],
];

export default function EnduranceDemoPage() {
  return (
    <main style={{ minHeight: '100vh', background: '#07111D', color: '#F8FAFC', fontFamily: 'Arial, sans-serif' }}>
      <section style={{ maxWidth: 1180, margin: '0 auto', padding: '28px 20px 76px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ fontWeight: 950, letterSpacing: 1 }}>ARIDON · UNOFFICIAL PUBLIC-DATA DEMO</div>
          <Link href="/business-os/revenue-recovery" style={pill}>See the Aridon pilot</Link>
        </div>

        <div style={{ paddingTop: 62, maxWidth: 930 }}>
          <div style={eyebrow}>ENDURANCE FEDERAL CREDIT UNION</div>
          <h1 style={h1}>What would Aridon see if it joined the executive table?</h1>
          <p style={lead}>This demonstration uses only public information. No member data, account information, internal systems, credit information, or private documents were accessed. It shows how Aridon could help leadership find growth, operating capacity, and strategic priorities while keeping regulated decisions and sensitive data behind explicit controls.</p>
        </div>

        <section style={banner}>
          <strong style={{ fontSize: 18 }}>Executive read:</strong>
          <span>Endurance already has a broad product set, multiple service channels, an expanded field of membership, active hiring needs, and a strong fraud/security message. Aridon would focus first on turning those existing assets into clearer growth, better follow-through, and stronger leadership visibility.</span>
        </section>

        <section style={{ marginTop: 30 }}>
          <div style={eyebrow}>ARIDON EXECUTIVE BOARD</div>
          <h2 style={h2}>Eight executives, one coordinated recommendation</h2>
          <div style={grid}>
            {executives.map((e) => (
              <article key={e.name} style={card}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}><strong style={{ fontSize: 22 }}>{e.name}</strong><span style={badge}>{e.role}</span></div>
                <p style={copy}>{e.finding}</p>
              </article>
            ))}
          </div>
        </section>

        <section style={{ marginTop: 42 }}>
          <div style={eyebrow}>HIGH-VALUE OPPORTUNITIES</div>
          <h2 style={h2}>Where Aridon would look first</h2>
          <div style={grid}>{opportunities.map(([title,text]) => <article key={title} style={lightCard}><h3 style={{ marginTop: 0 }}>{title}</h3><p style={{ ...copy, color: '#4A4A46' }}>{text}</p></article>)}</div>
        </section>

        <section style={{ ...lightCard, marginTop: 42, padding: 26 }}>
          <div style={{ ...eyebrow, color: '#0F624D' }}>14-DAY PILOT</div>
          <h2 style={{ ...h2, color: '#171717', marginTop: 8 }}>Endurance Member Growth & Operations Pilot</h2>
          <p style={{ ...copy, color: '#3D3A34', fontSize: 17 }}>Aridon would begin with public or deliberately provided non-sensitive information and measure a small set of outcomes before asking for any deeper integration.</p>
          <ol style={{ color: '#2E2B27', lineHeight: 1.8, paddingLeft: 22 }}>
            <li>Map public products, eligible markets, member-service channels, hiring needs, and current outreach.</li>
            <li>Build three leadership-approved growth or operations experiments.</li>
            <li>Track response time, campaign engagement, staff capacity, handoff quality, and other agreed metrics.</li>
            <li>Present an executive brief showing what improved, what did not, and whether a deeper deployment is justified.</li>
          </ol>
          <div style={{ background: '#FFF4D7', border: '1px solid #E3C36A', color: '#523C00', borderRadius: 12, padding: 14, marginTop: 14 }}><strong>Boundary:</strong> no SSNs, account numbers, transaction data, protected member data, underwriting decisions, autonomous approvals, or connection to core banking systems during this public-data demonstration.</div>
        </section>

        <section style={{ marginTop: 42, background: '#101B2A', border: '1px solid #2C3D55', borderRadius: 18, padding: 24 }}>
          <div style={{ ...eyebrow, color: '#9EF0CF' }}>THE QUESTION ARIDON WOULD ASK</div>
          <h2 style={{ ...h2, marginBottom: 10 }}>How much growth and operating capacity are already inside Endurance, but not yet coordinated?</h2>
          <p style={{ ...copy, color: '#C6D0DE' }}>The point of the pilot is not to replace banking software or staff. It is to give leadership a coordinated intelligence and execution layer that can surface opportunities, prepare actions, track results, and keep humans firmly in control.</p>
        </section>

        <footer style={{ marginTop: 30, color: '#90A0B5', fontSize: 12, lineHeight: 1.6 }}>Unofficial demonstration created by Aridon from public information only. Endurance Federal Credit Union has not endorsed, approved, or participated in this demo unless separately confirmed.</footer>
      </section>
    </main>
  );
}

const eyebrow = { color: '#9EF0CF', fontSize: 12, fontWeight: 950, letterSpacing: 1 };
const h1 = { fontSize: 'clamp(48px,8vw,82px)', lineHeight: .96, letterSpacing: -3, margin: '12px 0 20px' };
const h2 = { fontSize: 'clamp(30px,5vw,48px)', lineHeight: 1.05, margin: '9px 0 20px' };
const lead = { color: '#B7C4D4', fontSize: 19, lineHeight: 1.7 };
const copy = { color: '#C0CAD8', lineHeight: 1.65, marginBottom: 0 };
const grid = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 12 };
const card = { background: '#101A28', border: '1px solid #26364B', borderRadius: 16, padding: 18 };
const lightCard = { background: '#F6F1E8', border: '1px solid #D8D0C3', borderRadius: 16, padding: 18, color: '#171717' };
const badge = { background: '#1D2A3A', border: '1px solid #33465E', color: '#BFD0E4', borderRadius: 999, padding: '6px 9px', fontSize: 10, fontWeight: 900, maxWidth: 160, textAlign: 'right' as const };
const pill = { background: '#9EF0CF', color: '#07130F', padding: '11px 14px', borderRadius: 999, textDecoration: 'none', fontWeight: 950 };
const banner = { display: 'grid', gap: 8, background: '#0D5D49', borderRadius: 16, padding: 20, marginTop: 28, lineHeight: 1.65 };
