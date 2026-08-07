import Link from 'next/link';
import { directCheckout } from '../../lib/directCheckout';

const benefits = [
  ['Know what needs attention', 'See priorities, open work and decisions in one place instead of chasing notes and tabs.'],
  ['Ask Eva for help', 'Get help with writing, research, planning, customer follow-up and business decisions in normal language.'],
  ['Find new customers', 'Scout learns what you sell, researches possible buyers and prepares outreach for your review.'],
  ['Keep company knowledge together', 'Store useful company information, research and decisions inside your private business workspace.'],
  ['Stay in control', 'The system can research and draft. Actions that contact customers or start paid services remain approval-gated.'],
  ['Use your own company identity', 'Your team works in a company-branded workspace that is separate from the platform operator’s internal system.'],
];

const plans = [
  { id: 'launch' as const, name: 'Launch', line: 'A simple private workspace for an owner getting started.', items: ['Company workspace', 'Eva AI business partner', 'Projects and tasks', 'Company knowledge', 'Initial setup'] },
  { id: 'growth' as const, name: 'Growth', line: 'For a business that wants stronger sales, research and recurring execution.', items: ['Everything in Launch', 'Scout sales tools', 'Customer follow-up tools', 'Competitor research', 'Execution workflows'] },
  { id: 'command' as const, name: 'Command', line: 'For teams that need deeper automation, integrations and custom workflows.', items: ['Everything in Growth', 'Custom AI roles', 'Custom domain option', 'Workflow integrations', 'Priority build support'] },
];

export default function BusinessOSLanding() {
  return (
    <main style={{ minHeight: '100vh', background: '#F5F2EA', color: '#171717', fontFamily: 'Arial, sans-serif' }}>
      <section style={{ maxWidth: '1180px', margin: '0 auto', padding: '28px 20px 72px' }}>
        <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <div style={{ fontWeight: 950, fontSize: '20px' }}>PRIVATE BUSINESS OS</div>
          <div style={{ display: 'flex', gap: '9px', flexWrap: 'wrap' }}>
            <Link href="/customer/login" style={outlinePill}>Sign In</Link>
            <Link href="/business-os/beta" style={darkPill}>Start Free Beta</Link>
          </div>
        </nav>

        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.25fr) minmax(300px,.75fr)', gap: '42px', alignItems: 'center', paddingTop: '68px' }} className="hero-grid">
          <div>
            <div style={{ display: 'inline-block', border: '1px solid #B9B3A7', borderRadius: '999px', padding: '7px 11px', fontWeight: 800, fontSize: '12px' }}>AN AI BUSINESS TEAM INSIDE YOUR OWN PRIVATE WORKSPACE</div>
            <h1 style={{ fontSize: 'clamp(44px,8vw,82px)', lineHeight: .95, letterSpacing: '-3px', margin: '20px 0 24px', maxWidth: '900px' }}>Run your business with less chasing and more clarity.</h1>
            <p style={{ fontSize: '20px', lineHeight: 1.65, maxWidth: '780px', color: '#4B4B46' }}>Ask for help, organize work, research customers, prepare outreach and keep important company information together. You do not need to learn complicated AI commands.</p>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '30px' }}>
              <Link href="/business-os/beta" style={primaryButton}>Create My Free Business OS</Link>
              <a href="#plans" style={secondaryButton}>See Paid Plans</a>
            </div>
            <p style={{ color: '#6A675F', fontSize: '13px', marginTop: '12px' }}>Try the real workspace free first, or subscribe today through secure Stripe checkout. Nothing is sent to customers automatically.</p>
          </div>

          <div style={{ background: '#171717', color: '#fff', borderRadius: '24px', padding: '24px', boxShadow: '0 28px 70px rgba(0,0,0,.16)' }}>
            <div style={{ fontSize: '12px', color: '#A4F3D3', fontWeight: 900 }}>YOUR HOME SCREEN</div>
            <h2 style={{ fontSize: '32px', margin: '12px 0 20px' }}>Good morning. Here is what matters today.</h2>
            <div style={{ display: 'grid', gap: '10px' }}>
              {['Ask Eva for help', 'See open work', 'Find possible customers', 'Review decisions and risks', 'Pick the next best action'].map((item, index) => (
                <div key={item} style={{ background: '#222', border: '1px solid #343434', borderRadius: '12px', padding: '13px 14px', display: 'flex', gap: '10px', alignItems: 'center' }}><span style={{ width: '24px', height: '24px', borderRadius: '999px', display: 'grid', placeItems: 'center', background: index < 2 ? '#A4F3D3' : '#E8DFC9', color: '#111', fontWeight: 950, fontSize: '12px' }}>{index + 1}</span><span>{item}</span></div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="how-it-works" style={{ background: '#171717', color: '#fff', padding: '72px 20px' }}>
        <div style={{ maxWidth: '1180px', margin: '0 auto' }}>
          <div style={{ color: '#A4F3D3', fontWeight: 900, fontSize: '12px' }}>HOW THE FREE BETA WORKS</div>
          <h2 style={{ fontSize: 'clamp(34px,5vw,54px)', lineHeight: 1.05, margin: '10px 0 28px', maxWidth: '800px' }}>One signup. Your business workspace builds itself.</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(250px,1fr))', gap: '14px' }}>
            <Step number="1" title="Tell us about your business" text="Enter your company name, website if you have one, what you sell and what you want help with first." />
            <Step number="2" title="We create your workspace" text="Your login, private company workspace, starter project and first tasks are created automatically." />
            <Step number="3" title="Open your startup guide" text="Use the link you receive to start with Eva, Scout and your company Home screen." />
          </div>
        </div>
      </section>

      <section style={{ maxWidth: '1180px', margin: '0 auto', padding: '72px 20px' }}>
        <div style={{ maxWidth: '760px', marginBottom: '28px' }}><div style={{ fontWeight: 900, fontSize: '12px' }}>WHAT IT HELPS WITH</div><h2 style={{ fontSize: 'clamp(34px,5vw,52px)', margin: '10px 0' }}>Useful business help, in plain English.</h2></div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: '14px' }}>
          {benefits.map(([title, text]) => <article key={title} style={{ background: '#fff', border: '1px solid #D0CBC0', borderRadius: '16px', padding: '20px' }}><h3 style={{ marginTop: 0 }}>{title}</h3><p style={{ color: '#56564F', lineHeight: 1.6, marginBottom: 0 }}>{text}</p></article>)}
        </div>
      </section>

      <section id="plans" style={{ background: '#E9E5DB', padding: '72px 20px' }}>
        <div style={{ maxWidth: '1180px', margin: '0 auto' }}>
          <div style={{ maxWidth: '800px', marginBottom: '28px' }}><div style={{ fontWeight: 900, fontSize: '12px' }}>LIVE MONTHLY PLANS</div><h2 style={{ fontSize: 'clamp(34px,5vw,52px)', margin: '10px 0' }}>Start free, or put Business OS to work today.</h2><p style={{ color: '#55554F', lineHeight: 1.6 }}>Paid subscriptions are processed by Stripe. If you subscribe before creating your workspace, use the same email at checkout and during Business OS signup so we can keep the account path clean.</p></div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: '14px' }}>
            {plans.map((plan, index) => (
              <article key={plan.name} style={{ background: index === 1 ? '#E7F8F0' : '#fff', border: `1px solid ${index === 1 ? '#7BC8AA' : '#CFC9BD'}`, borderRadius: '18px', padding: '22px' }}>
                {index === 1 && <div style={{ fontWeight: 950, fontSize: '11px', color: '#1D6C50', marginBottom: '8px' }}>RECOMMENDED</div>}
                <div style={{ fontWeight: 950, fontSize: '24px' }}>{plan.name}</div>
                <div style={{ fontWeight: 950, fontSize: '28px', margin: '7px 0' }}>{directCheckout[plan.id].price}</div>
                <p style={{ color: '#56564F', lineHeight: 1.55, minHeight: '70px' }}>{plan.line}</p>
                <ul style={{ lineHeight: 1.8, paddingLeft: '20px' }}>{plan.items.map(item => <li key={item}>{item}</li>)}</ul>
                <div style={{ display: 'grid', gap: '8px', marginTop: '12px' }}>
                  <a href={directCheckout[plan.id].url} style={{ ...primaryButton, textAlign: 'center' }}>Subscribe to {plan.name}</a>
                  <Link href="/business-os/beta" style={{ ...secondaryButton, textAlign: 'center' }}>Try Free First</Link>
                </div>
              </article>
            ))}
          </div>
          <div style={{ marginTop: '18px', color: '#625E55', lineHeight: 1.6, fontSize: '13px' }}>Stripe shows the final recurring price and payment details before you subscribe. You can review everything before completing checkout. See the <Link href="/business-os/terms" style={{ color: '#171717', fontWeight: 850 }}>Business OS Terms</Link> and <Link href="/business-os/privacy" style={{ color: '#171717', fontWeight: 850 }}>Privacy Notice</Link>.</div>
        </div>
      </section>

      <section style={{ background: '#DDE9FF', padding: '64px 20px' }}><div style={{ maxWidth: '900px', margin: '0 auto', textAlign: 'center' }}><h2 style={{ fontSize: 'clamp(36px,6vw,60px)', margin: '0 0 18px', letterSpacing: '-2px' }}>Ready to build yours?</h2><p style={{ fontSize: '19px', color: '#3E4756', lineHeight: 1.6 }}>Start with a free workspace, or choose Growth and begin a paid subscription today.</p><div style={{ display: 'flex', justifyContent: 'center', gap: '10px', flexWrap: 'wrap', marginTop: '14px' }}><Link href="/business-os/beta" style={primaryButton}>Start My Free Beta</Link><a href={directCheckout.growth.url} style={secondaryButton}>Subscribe to Growth · $99/month</a></div></div></section>

      <footer style={{ padding: '28px 20px', textAlign: 'center', color: '#6D6D68', fontSize: '12px' }}>Private Business OS · AI tools inside your company’s private workspace · <Link href="/business-os/terms" style={{ color: 'inherit' }}>Terms</Link> · <Link href="/business-os/privacy" style={{ color: 'inherit' }}>Privacy</Link></footer>
      <style>{`@media (max-width:820px){.hero-grid{grid-template-columns:1fr !important}.hero-grid h1{letter-spacing:-2px !important}}`}</style>
    </main>
  );
}

function Step({ number, title, text }: { number: string; title: string; text: string }) {
  return <article style={{ background: '#202020', border: '1px solid #303030', borderRadius: '16px', padding: '20px' }}><div style={{ width: '34px', height: '34px', display: 'grid', placeItems: 'center', background: '#A4F3D3', color: '#111', borderRadius: '10px', fontWeight: 950 }}>{number}</div><h3>{title}</h3><p style={{ color: '#C4C4C0', lineHeight: 1.6, marginBottom: 0 }}>{text}</p></article>;
}

const darkPill = { background: '#171717', color: '#fff', padding: '11px 16px', borderRadius: '999px', textDecoration: 'none', fontWeight: 850 };
const outlinePill = { border: '1px solid #AAA499', color: '#171717', padding: '10px 15px', borderRadius: '999px', textDecoration: 'none', fontWeight: 850 };
const primaryButton = { background: '#171717', color: '#fff', padding: '14px 19px', borderRadius: '11px', textDecoration: 'none', fontWeight: 900 };
const secondaryButton = { border: '1px solid #AAA499', color: '#171717', padding: '13px 18px', borderRadius: '11px', textDecoration: 'none', fontWeight: 850 };
