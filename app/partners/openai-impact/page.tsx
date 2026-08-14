import Link from 'next/link';

const card = { background: '#0D1728', border: '1px solid #2A3A57', borderRadius: 18, padding: 20 } as const;
const light = { background: '#fff', border: '1px solid #D6D0C4', borderRadius: 16, padding: 18 } as const;

export default function OpenAIImpactPartnershipPage() {
  const pilot = [
    ['1', 'Select a pilot cohort', 'Start with 10–25 smaller mission-driven organizations across several service areas.'],
    ['2', 'Establish a baseline', 'Measure funding workflow maturity, reporting burden, follow-up completion, digital discovery, and current AI adoption.'],
    ['3', 'Deploy Impact OS', 'Give each organization one operating layer for funding work, board follow-through, outreach, impact reporting, and discovery.'],
    ['4', 'Measure outcomes', 'Track time saved, opportunities progressed, follow-up completion, reporting cycle time, and staff adoption.'],
    ['5', 'Build the playbook', 'Turn the results into a repeatable responsible-AI implementation model for mission-driven organizations.'],
  ];

  return <main style={{ minHeight: '100vh', background: '#07101D', color: '#F8FAFC', fontFamily: 'Arial, sans-serif' }}>
    <section style={{ maxWidth: 1120, margin: '0 auto', padding: '24px 20px 72px' }}>
      <nav style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}><Link href="/impact-os" style={{ color: '#F8FAFC', textDecoration: 'none', fontWeight: 950 }}>ARIDON · IMPACT OS</Link><Link href="/impact-os" style={{ background: '#9EF0CF', color: '#07130F', textDecoration: 'none', padding: '10px 13px', borderRadius: 10, fontWeight: 950 }}>Open Live Impact OS</Link></nav>
      <div style={{ maxWidth: 940, paddingTop: 68 }}><div style={{ color: '#C9A7FF', fontSize: 12, fontWeight: 950, letterSpacing: 1 }}>PROPOSED OPENAI COLLABORATION</div><h1 style={{ fontSize: 'clamp(48px,8vw,84px)', lineHeight: .94, letterSpacing: -4, margin: '14px 0 22px' }}>Turn AI capability into operating capacity for nonprofits and civil society.</h1><p style={{ color: '#B8C4D5', fontSize: 20, lineHeight: 1.7, maxWidth: 880 }}>Aridon proposes a measured pilot focused on helping smaller mission-driven organizations use AI consistently inside their real funding, governance, outreach, reporting, and discovery workflows.</p></div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: 12, marginTop: 30 }}>
        <article style={card}><div style={{ color: '#9EF0CF', fontSize: 12, fontWeight: 950 }}>THE GAP</div><h2>AI access is not the same as AI adoption.</h2><p style={{ color: '#C2CDDC', lineHeight: 1.65 }}>Smaller organizations can have access to powerful tools and still lack the time, workflow design, measurement, and operating structure required to use them consistently.</p></article>
        <article style={card}><div style={{ color: '#9EF0CF', fontSize: 12, fontWeight: 950 }}>THE ARIDON LAYER</div><h2>One shared operating system.</h2><p style={{ color: '#C2CDDC', lineHeight: 1.65 }}>Impact OS connects funding intelligence, grant work, supporter relationships, board actions, impact reporting, community outreach, and digital discovery to one operating model.</p></article>
        <article style={card}><div style={{ color: '#9EF0CF', fontSize: 12, fontWeight: 950 }}>THE ASK</div><h2>Build and validate it together.</h2><p style={{ color: '#C2CDDC', lineHeight: 1.65 }}>Aridon is seeking technical enablement, a nonprofit pilot pathway, and a route into OpenAI’s partner ecosystem so the model can be tested responsibly and scaled from evidence.</p></article>
      </div>
    </section>
    <section style={{ background: '#F4F1E9', color: '#171717', padding: '72px 20px' }}><div style={{ maxWidth: 1080, margin: '0 auto' }}><div style={{ fontSize: 12, fontWeight: 950 }}>PROPOSED PILOT</div><h2 style={{ fontSize: 'clamp(38px,6vw,58px)', lineHeight: 1, margin: '10px 0 24px' }}>A small cohort. Real work. Measurable results.</h2><div style={{ display: 'grid', gap: 10 }}>{pilot.map(([n,t,x]) => <article key={n} style={{ ...light, display: 'grid', gridTemplateColumns: '44px minmax(0,1fr)', gap: 14 }}><div style={{ width: 36, height: 36, display: 'grid', placeItems: 'center', borderRadius: 10, background: '#171717', color: '#fff', fontWeight: 950 }}>{n}</div><div><strong style={{ fontSize: 20 }}>{t}</strong><div style={{ color: '#5D5A54', lineHeight: 1.6, marginTop: 5 }}>{x}</div></div></article>)}</div></div></section>
    <section style={{ maxWidth: 1080, margin: '0 auto', padding: '72px 20px' }}><article style={{ ...card, background: '#102033' }}><div style={{ color: '#C9A7FF', fontSize: 12, fontWeight: 950 }}>PARTNERSHIP REQUEST</div><h2 style={{ fontSize: 36, margin: '9px 0 14px' }}>The next step is a joint pilot, not a giant promise.</h2><p style={{ color: '#D4DDEA', lineHeight: 1.7 }}>Aridon is asking to be considered for OpenAI’s partner ecosystem, to receive technical enablement, and to identify a mission-driven pilot cohort. If the pilot produces measurable value, the teams can decide what should scale next.</p><Link href="/impact-os" style={{ display: 'inline-block', background: '#9EF0CF', color: '#07130F', textDecoration: 'none', padding: '11px 14px', borderRadius: 10, fontWeight: 950 }}>Test Impact OS</Link></article><p style={{ color: '#8290A8', fontSize: 12, lineHeight: 1.6, marginTop: 14 }}>Aridon is not currently affiliated with, endorsed by, or partnered with OpenAI. This page describes a proposed collaboration.</p></section>
  </main>;
}
