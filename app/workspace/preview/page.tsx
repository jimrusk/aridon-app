import Link from 'next/link';

type PreviewProps = { searchParams?: { business?: string; industry?: string; owner?: string; plan?: string } };

const executives = [
  ['Operations Lead', 'Turns priorities into finished work and keeps projects moving.'],
  ['Strategy Lead', 'Challenges decisions, watches the market and protects the long game.'],
  ['Growth Lead', 'Builds sales follow-up, positioning, offers and customer-acquisition plans.'],
  ['Finance Lead', 'Stress-tests pricing, margins, cash flow and investment decisions.'],
  ['Risk & Compliance', 'Flags contracts, process, regulatory and execution risk before it bites.'],
  ['Intelligence Lead', 'Tracks competitors, opportunities, funding signals and useful research.'],
];

export default function WorkspacePreview({ searchParams }: PreviewProps) {
  const business = (searchParams?.business || 'Your Company').slice(0, 100);
  const industry = (searchParams?.industry || 'Your Industry').slice(0, 100);
  const owner = (searchParams?.owner || 'Founder').slice(0, 100);
  const plan = ['launch', 'growth', 'command'].includes(searchParams?.plan || '') ? searchParams?.plan : 'launch';

  return (
    <main style={{ minHeight: '100vh', background: '#0B1020', color: '#F7F9FD', fontFamily: 'Arial, sans-serif', padding: '26px 18px 90px' }}>
      <div style={{ maxWidth: '1180px', margin: '0 auto' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', gap: '14px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '28px' }}>
          <div><div style={{ fontWeight: 950, fontSize: '22px', letterSpacing: '-.5px' }}>{business}</div><div style={{ color: '#8EA0C3', fontSize: '12px', marginTop: '3px' }}>{industry} · Private Executive Command Center</div></div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}><div style={{ border: '1px solid #29405A', background: '#102033', color: '#9EF0CF', padding: '8px 12px', borderRadius: '999px', fontSize: '12px', fontWeight: 900 }}>● PRIVATE WORKSPACE PREVIEW</div><Link href="/customer/login" style={{ color: '#DCE7F8', fontSize: '12px', fontWeight: 850, textDecoration: 'none', border: '1px solid #34415D', padding: '8px 12px', borderRadius: '999px' }}>Customer Login</Link></div>
        </header>

        <section style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.5fr) minmax(260px,.5fr)', gap: '16px' }} className="preview-grid">
          <div style={{ background: 'linear-gradient(135deg,#141C31,#111725)', border: '1px solid #293552', borderRadius: '20px', padding: '24px' }}>
            <div style={{ color: '#91A5C9', fontSize: '12px', fontWeight: 900, letterSpacing: '1px' }}>DAILY BRIEF</div>
            <h1 style={{ fontSize: 'clamp(34px,6vw,58px)', lineHeight: 1, margin: '10px 0 12px' }}>Good morning, {owner}.</h1>
            <p style={{ color: '#B9C4D8', fontSize: '17px', lineHeight: 1.6, maxWidth: '720px' }}>Your executive team has organized the work that needs a decision, the opportunities worth attention and the tasks that can move without pulling you into every detail.</p>
            <div style={{ display: 'grid', gap: '10px', marginTop: '20px' }}>
              {['Top 3 priorities for today', 'Sales and customer follow-ups', 'Projects at risk or blocked', 'Competitor and market signals', 'Cash and pricing issues needing attention'].map((item,index)=><div key={item} style={{ display: 'flex', gap: '11px', alignItems: 'center', border: '1px solid #283653', borderRadius: '12px', padding: '12px 13px', background: '#0E1525' }}><span style={{ width: '26px', height: '26px', display: 'grid', placeItems: 'center', borderRadius: '8px', background: index < 2 ? '#9EF0CF' : '#D9E6FF', color: '#0D1320', fontWeight: 950, fontSize: '12px' }}>{index+1}</span><span>{item}</span></div>)}
            </div>
          </div>

          <div style={{ display: 'grid', gap: '12px' }}>
            {[['Projects','12'],['Open Tasks','8'],['Sales Opportunities','6'],['Executive Analyses','4']].map(([label,value])=><div key={label} style={{ background: '#111827', border: '1px solid #293552', borderRadius: '16px', padding: '18px' }}><div style={{ fontSize: '34px', fontWeight: 950 }}>{value}</div><div style={{ color: '#8EA0C3', marginTop: '3px' }}>{label}</div></div>)}
          </div>
        </section>

        <section style={{ marginTop: '18px', background: '#0F1626', border: '1px solid #293552', borderRadius: '20px', padding: '20px' }}>
          <div style={{ color: '#91A5C9', fontSize: '12px', fontWeight: 900, letterSpacing: '1px' }}>YOUR AI LEADERSHIP TEAM</div>
          <h2 style={{ margin: '8px 0 18px', fontSize: '30px' }}>Specialists working from one company memory.</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: '11px' }}>
            {executives.map(([name,text])=><article key={name} style={{ background: '#121B2E', border: '1px solid #2A3857', borderRadius: '14px', padding: '16px' }}><div style={{ fontWeight: 900 }}>{name}</div><p style={{ color: '#AEBAD0', lineHeight: 1.55, marginBottom: 0, fontSize: '14px' }}>{text}</p></article>)}
          </div>
        </section>

        <section style={{ marginTop: '18px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: '12px' }}>
          {['Projects & Tasks','CRM & Follow-Up','Company Knowledge','Competitor Intelligence','CEO Challenge Room','Financial Stress Tests','Execution Workflows','Morning Intelligence'].map(item=><div key={item} style={{ background: '#111827', border: '1px solid #293552', borderRadius: '14px', padding: '16px', fontWeight: 800 }}>{item}</div>)}
        </section>

        <div style={{ marginTop: '28px', background: '#DDF8ED', color: '#102019', borderRadius: '18px', padding: '22px', textAlign: 'center' }}><div style={{ fontWeight: 950, fontSize: '24px' }}>This is the workspace shell we brand around {business}.</div><p style={{ lineHeight: 1.55, maxWidth: '720px', margin: '8px auto 14px', color: '#385047' }}>Paid activation adds your real projects, customers, documents, executive roles, workflows and private access controls. Customer data stays in your own tenant layer rather than the platform operator’s internal business records.</p><Link href={`/business-os/checkout?plan=${plan}`} style={{ display: 'inline-block', background: '#102019', color: '#fff', borderRadius: '11px', padding: '13px 17px', textDecoration: 'none', fontWeight: 950 }}>Activate This Workspace</Link></div>
      </div>
      <style>{`@media(max-width:800px){.preview-grid{grid-template-columns:1fr !important}}`}</style>
    </main>
  );
}
