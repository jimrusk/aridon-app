import Link from 'next/link';
import { ArrowRight, CheckCircle2, ClipboardList, Landmark, MessageSquareText, ShieldCheck, Smartphone } from 'lucide-react';

const PHONE = '505-360-9529';

const outcomes = [
  ['My 3 Priorities', 'A short weekly list of what is most worth doing next to protect margin.'],
  ['Ask Aridon', 'Ask plain-English questions about feed, markets, weather, water, costs and the ranch business.'],
  ['Money & Funding', 'See margin opportunities and screen ranch projects for grants, loans, rebates and cost share.'],
  ['Paperwork', 'Bring invoices, receipts and program records into one place so deadlines and exceptions do not hide.'],
  ['Owner Approval', 'Aridon can prepare the work, but the owner stays in control of anything that gets sent or committed.'],
];

export default function AridonAgPage() {
  return <main style={{ minHeight: '100vh', background: '#f4f1e8', color: '#18251d', fontFamily: 'Arial,sans-serif' }}>
    <header style={{ background: '#163d2a', color: '#fff', padding: '16px 18px' }}>
      <div style={{ maxWidth: 1120, margin: 'auto', display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <strong style={{ letterSpacing: 1.5 }}>ARIDON AG</strong>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ color: '#dbe8db', fontSize: 13 }}>Built first for cow-calf ranchers</span>
          <a href={`tel:+1${PHONE.replace(/\D/g, '')}`} style={{ color: '#fff', textDecoration: 'none', fontWeight: 900 }}>{PHONE}</a>
        </div>
      </div>
    </header>

    <section style={{ maxWidth: 1120, margin: 'auto', padding: '58px 18px 42px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,300px),1fr))', gap: 30, alignItems: 'center' }}>
      <div>
        <div style={{ color: '#356943', fontWeight: 950, fontSize: 13, letterSpacing: .8 }}>THE AI BACK OFFICE FOR YOUR RANCH</div>
        <h1 style={{ fontSize: 'clamp(48px,8vw,84px)', lineHeight: .94, letterSpacing: -3, margin: '12px 0 20px' }}>Know where your money is going. Know what to do next.</h1>
        <p style={{ maxWidth: 760, fontSize: 21, lineHeight: 1.55, color: '#526058' }}>Aridon watches the business side of the ranch so you can spend less time hunting through numbers, paperwork and programs. Start with a free 2-minute Operation Snapshot.</p>
        <Link href="/ag/snapshot" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginTop: 22, background: '#163d2a', color: '#fff', padding: '16px 19px', borderRadius: 13, fontWeight: 950, textDecoration: 'none', fontSize: 18 }}>Get My Free Operation Snapshot <ArrowRight size={20} /></Link>
        <div style={{ marginTop: 12, color: '#667169', fontSize: 13 }}>No credit card. Eight questions. One-page margin report.</div>
      </div>

      <aside style={{ background: '#fff', border: '1px solid #d8e1d5', borderRadius: 20, padding: 22 }}>
        <div style={{ color: '#356943', fontSize: 12, fontWeight: 950 }}>WHAT YOU GET FIRST</div>
        <h2 style={{ fontSize: 30, margin: '7px 0 14px' }}>Your ranch in one page.</h2>
        <div style={{ display: 'grid', gap: 12 }}>{['Top 3 margin leaks worth investigating', 'Directional dollar impact range', 'Three actions for this week', 'Funding opportunities connected to the problem'].map((text) => <div key={text} style={{ display: 'flex', gap: 9, alignItems: 'flex-start', lineHeight: 1.45 }}><CheckCircle2 size={20} color="#356943" style={{ flex: '0 0 auto', marginTop: 1 }} /><span>{text}</span></div>)}</div>
      </aside>
    </section>

    <section style={{ background: '#fff', borderTop: '1px solid #d8e1d5', borderBottom: '1px solid #d8e1d5', padding: '54px 18px' }}>
      <div style={{ maxWidth: 1120, margin: 'auto' }}>
        <div style={{ color: '#356943', fontSize: 12, fontWeight: 950 }}>ARIDON DOES NOT NEED TO FEEL LIKE SOFTWARE</div>
        <h2 style={{ fontSize: 'clamp(34px,5vw,54px)', margin: '8px 0 22px' }}>Five things. That is the product.</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 12 }}>{outcomes.map(([title, text], index) => <article key={title} style={{ border: '1px solid #d8e1d5', borderRadius: 16, padding: 18, background: '#faf9f4' }}><div style={{ width: 34, height: 34, borderRadius: 99, display: 'grid', placeItems: 'center', background: '#e4eddf', color: '#356943', fontWeight: 950 }}>{index + 1}</div><h3 style={{ margin: '12px 0 6px', fontSize: 22 }}>{title}</h3><p style={{ margin: 0, color: '#5a675f', lineHeight: 1.5 }}>{text}</p></article>)}</div>
      </div>
    </section>

    <section style={{ maxWidth: 1120, margin: 'auto', padding: '58px 18px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 16 }}>
      <article style={{ background: '#163d2a', color: '#fff', borderRadius: 20, padding: 24 }}>
        <MessageSquareText size={30} color="#c8e2ac" />
        <div style={{ color: '#c8e2ac', fontSize: 12, fontWeight: 950, marginTop: 12 }}>MONDAY RANCH BRIEF</div>
        <h2 style={{ fontSize: 34, margin: '7px 0 10px' }}>The three things worth your attention this week.</h2>
        <p style={{ color: '#dbe8df', lineHeight: 1.6 }}>Market movement, weather risk, input pressure, ranch-specific funding and one practical action. Delivered by email and, with permission, text.</p>
      </article>

      <article style={{ background: '#fff', border: '1px solid #d8e1d5', borderRadius: 20, padding: 24 }}>
        <Landmark size={30} color="#356943" />
        <div style={{ color: '#356943', fontSize: 12, fontWeight: 950, marginTop: 12 }}>MONEY & FUNDING</div>
        <h2 style={{ fontSize: 34, margin: '7px 0 10px' }}>If Aridon finds a problem, it also looks for ways to pay for the fix.</h2>
        <p style={{ color: '#5a675f', lineHeight: 1.6 }}>Water, drought, grazing, equipment, energy and conservation projects can be screened against grants, loans, rebates and cost-share programs.</p>
      </article>

      <article style={{ background: '#fff', border: '1px solid #d8e1d5', borderRadius: 20, padding: 24 }}>
        <ClipboardList size={30} color="#356943" />
        <div style={{ color: '#356943', fontSize: 12, fontWeight: 950, marginTop: 12 }}>PAPERWORK COPILOT</div>
        <h2 style={{ fontSize: 34, margin: '7px 0 10px' }}>One inbox for the paper pile.</h2>
        <p style={{ color: '#5a675f', lineHeight: 1.6 }}>Invoices, receipts, records and program documents go into one operating trail so exceptions and deadlines stop disappearing.</p>
      </article>
    </section>

    <section style={{ background: '#e6ecdf', padding: '58px 18px' }}>
      <div style={{ maxWidth: 920, margin: 'auto', textAlign: 'center' }}>
        <ShieldCheck size={34} color="#356943" />
        <div style={{ color: '#356943', fontSize: 12, fontWeight: 950, marginTop: 10 }}>FOUNDING RANCH PLAN</div>
        <h2 style={{ fontSize: 'clamp(38px,6vw,58px)', margin: '8px 0 10px' }}>$149/month or $1,490/year.</h2>
        <p style={{ fontSize: 18, color: '#526058', lineHeight: 1.6, maxWidth: 720, margin: '0 auto' }}>One plan until we have ten paying ranches and enough real usage to justify anything more complicated. Large-operation implementation is quoted only when the setup actually requires it.</p>
        <Link href="/ag/snapshot" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginTop: 20, background: '#163d2a', color: '#fff', padding: '15px 18px', borderRadius: 12, fontWeight: 950, textDecoration: 'none' }}>Start With the Free Snapshot <ArrowRight size={19} /></Link>
      </div>
    </section>

    <footer style={{ padding: '26px 18px 40px' }}>
      <div style={{ maxWidth: 1120, margin: 'auto', display: 'flex', justifyContent: 'space-between', gap: 14, flexWrap: 'wrap', color: '#657069', fontSize: 13 }}>
        <div>Aridon Ag · New Mexico launch · Arizona next</div>
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}><Link href="/ag/funding" style={{ color: '#356943', textDecoration: 'none', fontWeight: 850 }}>Funding tools</Link><Link href="/ag/app" style={{ color: '#356943', textDecoration: 'none', fontWeight: 850 }}>Ranch workspace</Link><Link href="/ag/install" style={{ color: '#356943', textDecoration: 'none', fontWeight: 850 }}><Smartphone size={14} style={{ verticalAlign: 'middle' }} /> Install</Link></div>
      </div>
    </footer>
  </main>;
}
