import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import ProspectBoardroom from '../../demos/[slug]/ProspectBoardroom';
import { dailyProspectDemos } from '../../../lib/prospectDemosDaily';
import { prospectDemosAug11 } from '../../../lib/prospectDemosAug11';
import { prospectDemosAug13 } from '../../../lib/prospectDemosAug13';
import { prospectDemosAug14 } from '../../../lib/prospectDemosAug14';
import { prospectDemosAug15 } from '../../../lib/prospectDemosAug15';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Private Aridon Executive OS Preview', robots: { index: false, follow: false, googleBot: { index: false, follow: false } } };
type Props = { params: { slug: string } };

export default function DailyProspectDemoPage({ params }: Props) {
  const demo = [...dailyProspectDemos, ...prospectDemosAug11, ...prospectDemosAug13, ...prospectDemosAug14, ...prospectDemosAug15].find((item) => item.slug === params.slug);
  if (!demo || !demo.active || Date.now() >= new Date(demo.expiresAt).getTime()) notFound();
  const companyContext = `${demo.publicSummary} Publicly listed services: ${demo.services.join(', ')}. Demo opportunities identified by Aridon: ${demo.opportunities.join(' ')}`;
  return (
    <main style={{ minHeight:'100vh', background:'#F4F0E8', color:'#171717', fontFamily:'Inter, ui-sans-serif, system-ui, sans-serif' }}>
      <div style={{ maxWidth:1120, margin:'0 auto', padding:'24px 20px 70px' }}>
        <header style={{ display:'flex', justifyContent:'space-between', gap:16, alignItems:'center', flexWrap:'wrap', marginBottom:24 }}><Link href="/business-os/revenue-recovery" style={{ color:'#171717', textDecoration:'none', fontWeight:950, letterSpacing:'.04em' }}>ARIDON · REVENUE RECOVERY PILOT</Link><span style={{ fontSize:12, fontWeight:850, background:'#FFF4D6', border:'1px solid #E4C978', borderRadius:999, padding:'7px 11px' }}>UNOFFICIAL DEMONSTRATION · TEMPORARY</span></header>
        <section style={{ background:'#171717', color:'#fff', borderRadius:24, padding:'clamp(24px,5vw,54px)', marginBottom:18 }}><div style={{ color:'#9EF0CF', fontSize:12, fontWeight:950, letterSpacing:'.1em' }}>14 DAYS · NO UPFRONT FEE · HUMAN APPROVAL STAYS IN CONTROL</div><h1 style={{ fontSize:'clamp(38px,6vw,72px)', lineHeight:.98, margin:'16px 0 18px', maxWidth:880 }}>Where could {demo.companyName} already be leaving money or time on the table?</h1><p style={{ color:'#C8D0D8', fontSize:18, lineHeight:1.65, maxWidth:800 }}>{demo.publicSummary}</p><p style={{ color:'#AAB5C3', lineHeight:1.6, maxWidth:820 }}>Aridon created this unofficial demonstration from public information only. No private systems, customer records, inboxes, CRM data or accounts were accessed.</p><div style={{ display:'flex', flexWrap:'wrap', gap:10, marginTop:20 }}><Link href="/business-os/revenue-recovery" style={{ background:'#9EF0CF', color:'#07130F', textDecoration:'none', borderRadius:10, padding:'12px 15px', fontWeight:950 }}>See the 14-Day Pilot</Link><a href={demo.website} target="_blank" rel="noreferrer" style={{ border:'1px solid #465164', color:'#fff', textDecoration:'none', borderRadius:10, padding:'12px 15px', fontWeight:850 }}>Public source website</a></div></section>
        <section style={{ background:'#fff', border:'1px solid #D9D3C8', borderRadius:20, padding:22, marginBottom:18 }}><div style={{ fontSize:12,fontWeight:950,color:'#24604E',letterSpacing:'.08em' }}>FIRST RECOVERY TARGETS TO TEST</div><div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(240px,1fr))',gap:11,marginTop:15 }}>{demo.opportunities.map((item,index)=><article key={item} style={{ background:'#F7F5EF',borderRadius:14,padding:15 }}><strong>{String(index+1).padStart(2,'0')}</strong><p style={{ marginBottom:0,color:'#56534C',lineHeight:1.55 }}>{item}</p></article>)}</div></section>
        <section style={{ display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(230px,1fr))',gap:12,marginBottom:18 }}><article style={{background:'#fff',border:'1px solid #D9D3C8',borderRadius:18,padding:18}}><h2>$0 upfront</h2><p>Establish the baseline before the test begins.</p></article><article style={{background:'#fff',border:'1px solid #D9D3C8',borderRadius:18,padding:18}}><h2>Approval-gated</h2><p>No external sends, pricing changes, spending or commitments without company approval.</p></article><article style={{background:'#fff',border:'1px solid #D9D3C8',borderRadius:18,padding:18}}><h2>No revenue guarantee</h2><p>If measurable business value is not demonstrated during the pilot, the business can walk away.</p></article></section>
        <section id="boardroom" style={{ scrollMarginTop:20,marginBottom:18 }}><ProspectBoardroom companyName={demo.companyName} companyContext={companyContext} starterQuestions={demo.starterQuestions} /></section>
        <section style={{ background:'#0D1420',color:'#fff',borderRadius:20,padding:22,marginBottom:18 }}><div style={{ fontSize:12,fontWeight:950,color:'#9EF0CF',letterSpacing:'.08em' }}>SAMPLE DAY-14 REVIEW</div><div style={{ display:'grid',gap:9,marginTop:12 }}>{demo.sampleBrief.map(item=><div key={item} style={{ background:'#121E30',border:'1px solid #2A3A57',borderRadius:12,padding:13,color:'#D4DEEB',lineHeight:1.5 }}>{item}</div>)}</div></section>
        <footer style={{ marginTop:20,color:'#756F65',fontSize:12,lineHeight:1.6 }}>Unofficial Aridon demonstration generated from publicly available business information. No private systems were accessed. Search indexing and link following are disabled. This page expires automatically unless the business engages, and Aridon will disable it sooner upon request.</footer>
      </div>
    </main>
  );
}
