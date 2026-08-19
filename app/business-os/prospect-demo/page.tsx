import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Unofficial Aridon Revenue Recovery Preview',
  robots: { index: false, follow: false, googleBot: { index: false, follow: false } },
};

const clean = (value: string | string[] | undefined, fallback: string) => {
  const raw = Array.isArray(value) ? value[0] : value;
  return (raw || fallback).replace(/[<>]/g, '').slice(0, 180);
};

export default async function ProspectDemo({ searchParams }: { searchParams: Promise<Record<string,string|string[]|undefined>> }) {
  const params = await searchParams;
  const company = clean(params.company, 'Your Business');
  const industry = clean(params.industry, 'service business');
  const state = clean(params.state, 'the Southwest');
  const expires = clean(params.expires, 'August 29, 2026');

  return <main style={{minHeight:'100vh',background:'#07101D',color:'#F8FAFC',fontFamily:'Arial,sans-serif'}}>
    <section style={{maxWidth:980,margin:'0 auto',padding:'54px 22px 72px'}}>
      <div style={{fontSize:12,fontWeight:900,letterSpacing:1.2,color:'#F4D06F'}}>UNOFFICIAL · PUBLIC INFORMATION ONLY · NO PRIVATE SYSTEMS ACCESSED</div>
      <h1 style={{fontSize:'clamp(42px,7vw,76px)',lineHeight:.96,margin:'18px 0 20px'}}>A 14-day Revenue Recovery preview for {company}</h1>
      <p style={{fontSize:20,lineHeight:1.65,color:'#BFC9D8'}}>This temporary Aridon preview is based only on public information about a {industry} operating in {state}. It is not affiliated with, endorsed by, or approved by {company}. It expires {expires} unless the business chooses to engage.</p>

      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(230px,1fr))',gap:12,marginTop:32}}>
        {[
          ['1','Pick one revenue leak','Choose one concrete bucket: quiet estimates, missed follow-ups, unclosed inquiries, old customers, or stalled proposals.'],
          ['2','Build the recovery queue','Organize the opportunity, last contact, next action, owner, and follow-up date instead of letting names disappear in inboxes and spreadsheets.'],
          ['3','Draft the follow-up','Aridon prepares concise, context-aware follow-up drafts. Human approval remains required before consequential external actions.'],
          ['4','Measure the outcome','Track replies, booked conversations, recovered jobs, and attributed revenue. No guaranteed revenue claims.']
        ].map(([n,t,x]) => <article key={t} style={{background:'#0D1728',border:'1px solid #2A3A57',borderRadius:18,padding:20}}><div style={{fontWeight:950,color:'#9EF0CF'}}>{n}</div><h2 style={{fontSize:21}}>{t}</h2><p style={{color:'#BFC9D8',lineHeight:1.6}}>{x}</p></article>)}
      </div>

      <section style={{marginTop:30,background:'#E7F8F0',color:'#10221A',borderRadius:20,padding:24}}>
        <h2 style={{fontSize:32,margin:'0 0 10px'}}>The offer</h2>
        <p style={{fontSize:18,lineHeight:1.65}}>Aridon will test one small Revenue Recovery workflow for 14 days with no upfront fee. The business keeps control of messages, commitments, spending, signatures, legal terms, and other consequential actions. The goal is simple: determine whether a structured follow-up process produces a measurable business outcome.</p>
        <Link href="/business-os/revenue-recovery" style={{display:'inline-block',marginTop:8,background:'#07101D',color:'#fff',padding:'13px 18px',borderRadius:999,textDecoration:'none',fontWeight:900}}>See Revenue Recovery</Link>
      </section>

      <p style={{marginTop:28,color:'#8796AC',fontSize:13,lineHeight:1.6}}>Aridon / Private Business OS · Jim Rusk · 634 Road 1191, La Plata, NM 87418. If you received this preview and want it removed, reply to the outreach email and Aridon will remove/retire the prospect-specific link.</p>
    </section>
  </main>;
}
