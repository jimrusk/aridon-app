import Link from 'next/link';
import { Bot, CheckCircle2, ClipboardList, Landmark, MessageSquareText, ShieldCheck } from 'lucide-react';

const actions = [
  ['1', 'Review winter feed exposure', 'Feed and hay remain the largest controllable cost in this sample operation.', '$18K–$31K worth reviewing'],
  ['2', 'Map the highest-risk water points', 'Screen wells, storage, pipelines and solar pumping before the next dry period.', 'Funding may offset cost'],
  ['3', 'Sort keep / watch / cull cows', 'Use pregnancy, age, calf performance and feed requirement before the next major cost period.', 'Protect herd margin'],
];

const doors = [
  ['My 3 Priorities', 'The short list above. No dashboard archaeology required.', CheckCircle2],
  ['Ask Aridon', 'Ask about feed, cattle markets, weather, water, financing or the ranch business in plain English.', Bot],
  ['Money & Funding', 'Connect a ranch problem or project to grants, loans, rebates and cost-share programs.', Landmark],
  ['Paperwork', 'Keep invoices, receipts, records and program documents in one operating trail.', ClipboardList],
  ['Owner Approval', 'Aridon prepares the work. The ranch owner approves anything that gets sent or committed.', ShieldCheck],
];

export default function AgApp() {
  return <main style={{ minHeight: '100vh', background: '#f4f1e8', color: '#18251d', fontFamily: 'Arial,sans-serif', paddingBottom: 60 }}>
    <header style={{ background: '#163d2a', color: '#fff', padding: '17px 18px', position: 'sticky', top: 0, zIndex: 10 }}>
      <div style={{ maxWidth: 1080, margin: 'auto', display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <div><div style={{ color: '#c5e2aa', fontSize: 12, fontWeight: 950, letterSpacing: 1 }}>ARIDON AG</div><strong style={{ fontSize: 22 }}>Your ranch back office</strong></div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}><Link href="/ag" style={{ color: '#fff', textDecoration: 'none', fontWeight: 850 }}>Home</Link><Link href="/ag/snapshot" style={{ color: '#c5e2aa', textDecoration: 'none', fontWeight: 950 }}>Operation Snapshot</Link></div>
      </div>
    </header>

    <section style={{ maxWidth: 1080, margin: 'auto', padding: '28px 16px' }}>
      <div style={{ background: '#fff', border: '1px solid #d8e1d5', borderRadius: 20, padding: 22 }}>
        <div style={{ color: '#356943', fontSize: 12, fontWeight: 950 }}>THIS WEEK</div>
        <h1 style={{ fontSize: 'clamp(36px,6vw,58px)', lineHeight: 1, margin: '8px 0 12px' }}>Three things worth your attention.</h1>
        <p style={{ margin: 0, color: '#5a675f', fontSize: 17, lineHeight: 1.5 }}>Sample ranch view. Production accounts will use the operation's own records, market context, weather and approved integrations.</p>
        <div style={{ display: 'grid', gap: 10, marginTop: 18 }}>{actions.map(([n, title, text, money]) => <article key={title} style={{ display: 'grid', gridTemplateColumns: '42px minmax(0,1fr) auto', gap: 12, alignItems: 'center', padding: 14, borderRadius: 14, background: '#f4f1e8' }}><div style={{ width: 38, height: 38, borderRadius: 99, display: 'grid', placeItems: 'center', background: '#dfe9da', color: '#356943', fontWeight: 950 }}>{n}</div><div><strong style={{ fontSize: 18 }}>{title}</strong><div style={{ color: '#5e695f', marginTop: 3, lineHeight: 1.4 }}>{text}</div></div><div style={{ color: '#356943', fontSize: 12, fontWeight: 950, textAlign: 'right' }}>{money}</div></article>)}</div>
      </div>

      <section style={{ marginTop: 16, background: '#163d2a', color: '#fff', borderRadius: 20, padding: 22 }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', color: '#c5e2aa', fontSize: 12, fontWeight: 950 }}><MessageSquareText size={21} /> MONDAY RANCH BRIEF</div>
        <h2 style={{ fontSize: 32, margin: '8px 0' }}>One useful message instead of another dashboard to check.</h2>
        <p style={{ margin: 0, color: '#dbe8df', lineHeight: 1.6 }}>Market movement, weather risk, input pressure, funding worth checking and the number-one action for the week. Email first, plus Sent.dm text updates when the owner opts in.</p>
      </section>

      <h2 style={{ fontSize: 30, margin: '28px 0 12px' }}>The whole product</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(230px,1fr))', gap: 12 }}>{doors.map(([title, text, Icon]: any) => <article key={title} style={{ background: '#fff', border: '1px solid #d8e1d5', borderRadius: 17, padding: 19 }}><Icon size={26} color="#356943" /><h3 style={{ fontSize: 22, margin: '10px 0 6px' }}>{title}</h3><p style={{ margin: 0, color: '#5a675f', lineHeight: 1.5 }}>{text}</p>{title === 'Money & Funding' && <Link href="/ag/funding" style={{ display: 'inline-block', marginTop: 12, color: '#356943', fontWeight: 950, textDecoration: 'none' }}>Open funding tools →</Link>}</article>)}</div>

      <section style={{ marginTop: 18, border: '1px solid #d8e1d5', background: '#e7ede2', borderRadius: 18, padding: 20 }}><strong>Founding Ranch Plan:</strong> $149/month or $1,490/year. One plan until Aridon has ten paying ranch customers and real usage data to justify more tiers.</section>
    </section>
  </main>;
}
