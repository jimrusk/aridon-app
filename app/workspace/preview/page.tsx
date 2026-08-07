import Link from 'next/link';

type PreviewProps = { searchParams?: { business?: string; industry?: string; owner?: string; plan?: string } };

const helpers = [
  ['Eva', 'Ask questions, draft emails, research competitors, plan work and think through decisions.'],
  ['Scout', 'Learn what you sell, research possible customers and prepare outreach for your review.'],
  ['Your Work', 'Keep projects, tasks and important company information together in one place.'],
];

export default function WorkspacePreview({ searchParams }: PreviewProps) {
  const business = (searchParams?.business || 'Your Company').slice(0, 100);
  const industry = (searchParams?.industry || 'Your Industry').slice(0, 100);
  const owner = (searchParams?.owner || 'Owner').slice(0, 100);
  const plan = ['launch', 'growth', 'command'].includes(searchParams?.plan || '') ? searchParams?.plan : 'launch';

  return (
    <main style={{ minHeight: '100vh', background: '#0B1020', color: '#F7F9FD', fontFamily: 'Arial, sans-serif', padding: '26px 18px 90px' }}>
      <div style={{ maxWidth: '1080px', margin: '0 auto' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', gap: '14px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '28px' }}>
          <div><div style={{ fontWeight: 950, fontSize: '22px' }}>{business}</div><div style={{ color: '#8EA0C3', fontSize: '12px', marginTop: '3px' }}>{industry} · Workspace Preview</div></div>
          <Link href="/customer/login" style={smallLink}>Already a customer? Sign in</Link>
        </header>

        <section style={{ background: 'linear-gradient(135deg,#141C31,#111725)', border: '1px solid #293552', borderRadius: '22px', padding: '26px' }}>
          <div style={{ color: '#9EF0CF', fontSize: '12px', fontWeight: 900 }}>STEP 2 OF 2 · YOUR PREVIEW</div>
          <h1 style={{ fontSize: 'clamp(38px,7vw,62px)', lineHeight: 1, margin: '10px 0 12px' }}>Good morning, {owner}. This is the kind of home screen your business gets.</h1>
          <p style={{ color: '#B9C4D8', fontSize: '17px', lineHeight: 1.65, maxWidth: '760px' }}>The goal is simple: show you what needs attention, give you a place to ask for help, and keep business work from getting scattered.</p>
        </section>

        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(250px,1fr))', gap: '12px', marginTop: '16px' }}>
          {helpers.map(([name, text], index) => <article key={name} style={{ background: '#111827', border: '1px solid #293552', borderRadius: '16px', padding: '18px' }}><div style={{ width: '32px', height: '32px', borderRadius: '9px', display: 'grid', placeItems: 'center', background: index === 0 ? '#9EF0CF' : '#D9E6FF', color: '#0D1320', fontWeight: 950 }}>{index + 1}</div><h2 style={{ margin: '12px 0 6px' }}>{name}</h2><p style={{ color: '#AEBAD0', lineHeight: 1.55, marginBottom: 0 }}>{text}</p></article>)}
        </section>

        <section style={{ marginTop: '18px', background: '#0F1626', border: '1px solid #293552', borderRadius: '20px', padding: '20px' }}>
          <div style={{ color: '#91A5C9', fontSize: '12px', fontWeight: 900 }}>A NORMAL DAY MIGHT LOOK LIKE THIS</div>
          <div style={{ display: 'grid', gap: '10px', marginTop: '14px' }}>
            {['Ask Eva: “What should I focus on today?”', 'Open Scout and find 10 companies worth contacting', 'Review an email sequence before anything is sent', 'Check open tasks and projects', 'Save useful research so the business remembers it'].map((item,index)=><div key={item} style={{ display: 'flex', gap: '11px', alignItems: 'center', border: '1px solid #283653', borderRadius: '12px', padding: '12px 13px', background: '#0E1525' }}><span style={{ color: '#9EF0CF', fontWeight: 950 }}>{index + 1}.</span><span>{item}</span></div>)}
          </div>
        </section>

        <div style={{ marginTop: '24px', background: '#DDF8ED', color: '#102019', borderRadius: '18px', padding: '22px', textAlign: 'center' }}>
          <div style={{ fontWeight: 950, fontSize: '24px' }}>Want to make this a real workspace for {business}?</div>
          <p style={{ lineHeight: 1.55, maxWidth: '720px', margin: '8px auto 14px', color: '#385047' }}>Your real workspace uses your company’s information and login. Your business data stays separate from other customer companies.</p>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href={`/business-os/checkout?plan=${plan}&business=${encodeURIComponent(business)}&industry=${encodeURIComponent(industry)}&owner=${encodeURIComponent(owner)}`} style={darkButton}>Choose a Plan</Link>
            <Link href="/business-os" style={lightButton}>Back to Overview</Link>
          </div>
        </div>
      </div>
    </main>
  );
}

const smallLink = { color: '#DCE7F8', fontSize: '13px', fontWeight: 850, textDecoration: 'none', border: '1px solid #34415D', padding: '9px 12px', borderRadius: '10px' };
const darkButton = { display: 'inline-block', background: '#102019', color: '#fff', borderRadius: '11px', padding: '13px 17px', textDecoration: 'none', fontWeight: 950 };
const lightButton = { display: 'inline-block', border: '1px solid #6A8A7D', color: '#102019', borderRadius: '11px', padding: '12px 16px', textDecoration: 'none', fontWeight: 900 };
