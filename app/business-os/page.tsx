import Link from 'next/link';

const featureGroups = [
  ['Executive Team', 'Operations, strategy, finance, growth, compliance and research working from one business memory.'],
  ['Daily Command Center', 'Projects, tasks, priorities, CRM, documents and decisions in one private workspace.'],
  ['Challenge Suite', 'Competitor analysis, CEO red-team review, investor interrogation and CFO stress testing.'],
  ['Execution Engine', 'Turn a business objective into finished deliverables, approval gates and next actions.'],
  ['Company Memory', 'Keep company documents, research and decisions attached to the business instead of scattered across chats.'],
  ['Your Brand', 'The customer-facing workspace carries the customer’s company name, colors and identity, not Aridon’s internal command center.'],
];

const plans = [
  { name: 'Launch', line: 'For an owner who wants a private AI operating system and a clean command center.', items: ['Branded workspace', 'AI executive team', 'Projects + tasks', 'Company knowledge vault', 'Initial setup'] },
  { name: 'Growth', line: 'For businesses using AI to drive sales, research and recurring execution.', items: ['Everything in Launch', 'CRM + sales workflows', 'Competitor intelligence', 'Morning intelligence', 'Execution playbooks'] },
  { name: 'Command', line: 'For teams that want deeper automation, custom workflows and multi-user operations.', items: ['Everything in Growth', 'Custom executive roles', 'Custom domain option', 'Workflow integrations', 'Priority build support'] },
];

export default function BusinessOSLanding() {
  return (
    <main style={{ minHeight: '100vh', background: '#F5F2EA', color: '#171717', fontFamily: 'Arial, sans-serif' }}>
      <section style={{ maxWidth: '1180px', margin: '0 auto', padding: '28px 20px 76px' }}>
        <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <div style={{ fontWeight: 950, letterSpacing: '-0.5px', fontSize: '20px' }}>PRIVATE BUSINESS OS</div>
          <Link href="/business-os/signup" style={{ background: '#171717', color: '#fff', padding: '11px 16px', borderRadius: '999px', textDecoration: 'none', fontWeight: 850 }}>Build My Workspace</Link>
        </nav>

        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.25fr) minmax(300px,.75fr)', gap: '42px', alignItems: 'center', paddingTop: '74px' }} className="hero-grid">
          <div>
            <div style={{ display: 'inline-block', border: '1px solid #B9B3A7', borderRadius: '999px', padding: '7px 11px', fontWeight: 800, fontSize: '12px', letterSpacing: '.5px' }}>YOUR COMPANY. YOUR AI TEAM. YOUR WORKSPACE.</div>
            <h1 style={{ fontSize: 'clamp(44px, 8vw, 84px)', lineHeight: .94, letterSpacing: '-4px', margin: '20px 0 24px', maxWidth: '900px' }}>Run your business with an AI executive team that works from your company’s world.</h1>
            <p style={{ fontSize: '20px', lineHeight: 1.6, maxWidth: '780px', color: '#4B4B46' }}>A private operating system built around your business, your customers, your documents and your priorities. No generic AI dashboard. No shared company identity. Your workspace looks and feels like your company.</p>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '30px' }}>
              <Link href="/business-os/signup" style={{ background: '#171717', color: '#fff', padding: '15px 21px', borderRadius: '12px', textDecoration: 'none', fontWeight: 900 }}>Start My Private Business OS</Link>
              <Link href="/workspace/preview?business=Your%20Company&industry=Your%20Industry" style={{ border: '1px solid #AAA499', color: '#171717', padding: '15px 21px', borderRadius: '12px', textDecoration: 'none', fontWeight: 850 }}>See a workspace preview</Link>
            </div>
          </div>

          <div style={{ background: '#171717', color: '#fff', borderRadius: '24px', padding: '24px', boxShadow: '0 28px 70px rgba(0,0,0,.16)' }}>
            <div style={{ fontSize: '12px', letterSpacing: '1.2px', color: '#A4F3D3', fontWeight: 900 }}>PRIVATE COMMAND CENTER</div>
            <h2 style={{ fontSize: '32px', margin: '12px 0 20px' }}>Good morning, Founder.</h2>
            <div style={{ display: 'grid', gap: '10px' }}>
              {['3 priorities need a decision', '2 sales opportunities advanced', '1 competitor move worth watching', 'Financial risk check ready', 'Execution package completed'].map((item, index) => (
                <div key={item} style={{ background: '#222', border: '1px solid #343434', borderRadius: '12px', padding: '13px 14px', display: 'flex', gap: '10px', alignItems: 'center' }}><span style={{ width: '24px', height: '24px', borderRadius: '999px', display: 'grid', placeItems: 'center', background: index < 2 ? '#A4F3D3' : '#E8DFC9', color: '#111', fontWeight: 950, fontSize: '12px' }}>{index + 1}</span><span>{item}</span></div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section style={{ background: '#171717', color: '#fff', padding: '72px 20px' }}>
        <div style={{ maxWidth: '1180px', margin: '0 auto' }}>
          <div style={{ maxWidth: '760px', marginBottom: '34px' }}>
            <div style={{ color: '#A4F3D3', fontWeight: 900, fontSize: '12px', letterSpacing: '1.2px' }}>WHAT YOU GET</div>
            <h2 style={{ fontSize: 'clamp(34px, 5vw, 56px)', lineHeight: 1.05, margin: '10px 0' }}>A business operating layer, not another chatbot.</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: '14px' }}>
            {featureGroups.map(([title, text]) => (
              <article key={title} style={{ background: '#202020', border: '1px solid #303030', borderRadius: '16px', padding: '20px' }}><h3 style={{ marginTop: 0 }}>{title}</h3><p style={{ color: '#C4C4C0', lineHeight: 1.6, marginBottom: 0 }}>{text}</p></article>
            ))}
          </div>
        </div>
      </section>

      <section style={{ maxWidth: '1180px', margin: '0 auto', padding: '76px 20px' }}>
        <div style={{ maxWidth: '780px', marginBottom: '30px' }}><div style={{ fontWeight: 900, fontSize: '12px', letterSpacing: '1px' }}>THREE WAYS TO START</div><h2 style={{ fontSize: 'clamp(34px, 5vw, 54px)', margin: '10px 0' }}>Start small. Grow the operating system with the company.</h2><p style={{ color: '#55554F', lineHeight: 1.6 }}>Pricing is scoped to the business, integrations and level of automation. The first conversation is about fit, not a credit-card trapdoor.</p></div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: '14px' }}>
          {plans.map((plan, index) => (
            <article key={plan.name} style={{ background: index === 1 ? '#E7F8F0' : '#fff', border: '1px solid #D0CBC0', borderRadius: '18px', padding: '22px' }}><div style={{ fontWeight: 950, fontSize: '24px' }}>{plan.name}</div><p style={{ color: '#56564F', lineHeight: 1.55, minHeight: '72px' }}>{plan.line}</p><ul style={{ lineHeight: 1.8, paddingLeft: '20px' }}>{plan.items.map(item => <li key={item}>{item}</li>)}</ul><Link href={`/business-os/signup?plan=${plan.name.toLowerCase()}`} style={{ display: 'inline-block', marginTop: '8px', background: '#171717', color: '#fff', borderRadius: '10px', padding: '11px 14px', textDecoration: 'none', fontWeight: 850 }}>Choose {plan.name}</Link></article>
          ))}
        </div>
      </section>

      <section style={{ background: '#DDE9FF', padding: '70px 20px' }}><div style={{ maxWidth: '900px', margin: '0 auto', textAlign: 'center' }}><h2 style={{ fontSize: 'clamp(36px, 6vw, 62px)', margin: '0 0 18px', letterSpacing: '-2px' }}>Your business should have its own brain.</h2><p style={{ fontSize: '19px', color: '#3E4756', lineHeight: 1.6 }}>We configure the workspace around the way your company actually works, then add automation where it earns its keep.</p><Link href="/business-os/signup" style={{ display: 'inline-block', marginTop: '16px', background: '#171717', color: '#fff', padding: '15px 22px', borderRadius: '12px', textDecoration: 'none', fontWeight: 900 }}>Build My Workspace</Link></div></section>

      <footer style={{ padding: '28px 20px', textAlign: 'center', color: '#6D6D68', fontSize: '12px' }}>Private Business OS · Powered by the Aridon platform</footer>
      <style>{`@media (max-width:820px){.hero-grid{grid-template-columns:1fr !important}.hero-grid h1{letter-spacing:-2px !important}}`}</style>
    </main>
  );
}
