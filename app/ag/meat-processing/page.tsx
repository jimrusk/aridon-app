'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { ArrowLeft, Beef, Boxes, CalendarDays, CheckCircle2, ClipboardList, DollarSign, FileCheck2, PackageCheck, QrCode, Refrigerator, Scale, ShoppingCart, Sparkles, Truck, Users } from 'lucide-react';

type Job = {
  id:string; producer:string; head:number; species:'Beef'|'Pork'; slaughter:string; cutSheet:'Complete'|'Missing'; aging:number; freezer:string; balance:number; status:'Booked'|'Processing'|'Ready';
};

const jobs:Job[]=[
  {id:'BP-260907-14',producer:'Wells Family Farms',head:3,species:'Beef',slaughter:'Sep 8',cutSheet:'Complete',aging:13,freezer:'B2',balance:0,status:'Processing'},
  {id:'BP-260907-15',producer:'North Fork Cattle',head:2,species:'Beef',slaughter:'Sep 9',cutSheet:'Missing',aging:0,freezer:'—',balance:640,status:'Booked'},
  {id:'BP-260907-16',producer:'Prairie Grove',head:1,species:'Pork',slaughter:'Sep 10',cutSheet:'Complete',aging:0,freezer:'—',balance:225,status:'Booked'},
  {id:'BP-260907-11',producer:'Wells Family Farms',head:1,species:'Beef',slaughter:'Sep 3',cutSheet:'Complete',aging:18,freezer:'A4',balance:420,status:'Ready'},
];

const card={background:'#fff',border:'1px solid #d8dfd4',borderRadius:18,padding:18} as const;

export default function MeatProcessingOS(){
  const [selected,setSelected]=useState<Job>(jobs[0]);
  const [brief,setBrief]=useState(false);
  const openSlots=4;
  const freezerUse=78;
  const missingCutSheets=jobs.filter(j=>j.cutSheet==='Missing').length;
  const ready=jobs.filter(j=>j.status==='Ready').length;
  const revenueAtRisk=useMemo(()=>jobs.filter(j=>j.cutSheet==='Missing'||j.status==='Ready').reduce((a,b)=>a+b.balance,0),[]);

  return <main style={{minHeight:'100vh',background:'#f4f1e8',color:'#18251d',fontFamily:'Arial,sans-serif'}}>
    <header style={{background:'#43251a',color:'#fff',padding:'14px 18px',position:'sticky',top:0,zIndex:10}}><div style={{maxWidth:1220,margin:'auto',display:'flex',justifyContent:'space-between',alignItems:'center',gap:12,flexWrap:'wrap'}}><div style={{display:'flex',gap:12,alignItems:'center'}}><Link href="/ag" style={{color:'#f4ddd2',display:'inline-flex'}}><ArrowLeft size={20}/></Link><strong style={{letterSpacing:1.3}}>ARIDON MEAT PROCESSING OS</strong></div><div style={{fontSize:12,color:'#f1d6cb'}}>Pilot configuration · Barnard Processing workflow</div></div></header>

    <section style={{maxWidth:1220,margin:'auto',padding:'34px 18px 18px'}}><div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(min(100%,340px),1fr))',gap:18}}>
      <article style={{background:'#5a2f20',color:'#fff',borderRadius:22,padding:26}}><div style={{display:'inline-flex',gap:8,alignItems:'center',fontSize:12,fontWeight:950,color:'#ffd9c7'}}><Beef size={19}/> PROCESSOR COMMAND CENTER</div><h1 style={{fontSize:'clamp(40px,6vw,68px)',lineHeight:.95,letterSpacing:-2.5,margin:'14px 0'}}>Fill the schedule. Move every animal. Lose nothing in the shuffle.</h1><p style={{fontSize:18,lineHeight:1.55,color:'#f6dfd4'}}>One operating view for booking, cut sheets, carcass aging, packaging, freezer location, customer balances, pickup and direct sales.</p><button onClick={()=>setBrief(true)} style={{border:0,borderRadius:12,padding:'13px 16px',fontWeight:950,cursor:'pointer',display:'inline-flex',gap:8,alignItems:'center'}}><Sparkles size={18}/> Generate Morning Brief</button>{brief&&<div style={{marginTop:14,background:'rgba(255,255,255,.1)',borderRadius:12,padding:14,lineHeight:1.5}}>Today: 3 cattle in process, {missingCutSheets} cut sheet missing, freezer at {freezerUse}%, {ready} order ready for pickup, and {openSlots} open slaughter slots next week.</div>}</article>
      <article style={{...card}}><div style={{fontSize:12,fontWeight:950,color:'#7a4633'}}>CURRENT JOB</div><h2 style={{fontSize:30,margin:'6px 0'}}>{selected.producer}</h2><div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:10,marginTop:14}}>{[['Job',selected.id],['Species',selected.species],['Head',selected.head],['Slaughter',selected.slaughter],['Aging',selected.aging?`${selected.aging} days`:'Not started'],['Freezer',selected.freezer]].map(([k,v])=><div key={String(k)} style={{background:'#faf7f3',borderRadius:12,padding:11}}><div style={{fontSize:11,color:'#746a64',fontWeight:900}}>{k}</div><div style={{fontWeight:950,marginTop:4}}>{v}</div></div>)}</div><div style={{display:'flex',gap:8,flexWrap:'wrap',marginTop:14}}>{jobs.map(j=><button key={j.id} onClick={()=>setSelected(j)} style={{border:selected.id===j.id?'2px solid #7a4633':'1px solid #d7cec9',background:'#fff',borderRadius:999,padding:'8px 10px',fontWeight:850,cursor:'pointer'}}>{j.id.slice(-2)}</button>)}</div></article>
    </div></section>

    <section style={{maxWidth:1220,margin:'auto',padding:'0 18px 18px'}}><div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(210px,1fr))',gap:12}}>{[
      [<CalendarDays size={22}/>, 'Open slaughter slots', openSlots, 'Fill before next week'],
      [<ClipboardList size={22}/>, 'Missing cut sheets', missingCutSheets, 'Text customer now'],
      [<Refrigerator size={22}/>, 'Freezer utilization', `${freezerUse}%`, 'Watch bay capacity'],
      [<PackageCheck size={22}/>, 'Orders ready', ready, 'Trigger pickup reminders'],
      [<DollarSign size={22}/>, 'Balances to collect', `$${revenueAtRisk}`, 'Collect before release'],
    ].map(([icon,label,value,note])=><article key={String(label)} style={{...card}}><div style={{display:'flex',gap:8,alignItems:'center',color:'#7a4633'}}>{icon}<span style={{fontSize:11,fontWeight:950}}>{String(label).toUpperCase()}</span></div><div style={{fontSize:34,fontWeight:950,marginTop:10}}>{value}</div><div style={{fontSize:12,color:'#6e756f',marginTop:4}}>{note}</div></article>)}</div></section>

    <section style={{maxWidth:1220,margin:'auto',padding:'0 18px 24px',display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(min(100%,320px),1fr))',gap:14}}>
      <article style={{...card}}><CalendarDays color="#7a4633"/><h2>Processing Scheduler</h2><p style={{lineHeight:1.5,color:'#59645c'}}>Book slaughter dates, reserve head count, show capacity by day and species, and identify empty slots before they become lost revenue.</p><button style={{border:'1px solid #7a4633',background:'#fff',borderRadius:10,padding:'10px 12px',fontWeight:900}}>Create booking</button></article>
      <article style={{...card}}><ClipboardList color="#7a4633"/><h2>Digital Cut Sheets</h2><p style={{lineHeight:1.5,color:'#59645c'}}>Send mobile cut sheets with steak thickness, roast sizes, ground package size, patties, organs, bones and special instructions.</p><div style={{fontWeight:900,color:selected.cutSheet==='Missing'?'#9b5a10':'#2f6b3d'}}>{selected.cutSheet==='Missing'?'Cut sheet still needed':'Cut sheet complete'}</div></article>
      <article style={{...card}}><Scale color="#7a4633"/><h2>Yield & Margin</h2><p style={{lineHeight:1.5,color:'#59645c'}}>Track live weight, hanging weight, aging loss, packaged weight, cut mix, labor, packaging and processor margin for every job.</p><div style={{fontSize:13,color:'#6b756d'}}>Turns yield questions into a transparent customer report.</div></article>
      <article style={{...card}}><QrCode color="#7a4633"/><h2>Animal-to-Box Traceability</h2><p style={{lineHeight:1.5,color:'#59645c'}}>Carry a lot/QR identity from intake through carcass, aging, cutting, packaging, freezer and pickup, with producer-approved provenance.</p><div style={{fontWeight:900}}>QR lot: {selected.id}</div></article>
      <article style={{...card}}><ShoppingCart color="#7a4633"/><h2>Direct Meat Sales</h2><p style={{lineHeight:1.5,color:'#59645c'}}>Whole, half and quarter reservations, bundles, individual cuts, recurring boxes, restaurant orders, deposits, pickup and route delivery.</p><div style={{fontSize:13,color:'#6b756d'}}>Own the customer relationship instead of renting it from a marketplace.</div></article>
      <article style={{...card}}><Truck color="#7a4633"/><h2>Pickup & Delivery</h2><p style={{lineHeight:1.5,color:'#59645c'}}>Ready alerts, pickup windows, overdue reminders, route grouping and delivery confirmation.</p><div style={{fontWeight:900}}>{ready} ready now</div></article>
      <article style={{...card}}><FileCheck2 color="#7a4633"/><h2>Compliance Document Center</h2><p style={{lineHeight:1.5,color:'#59645c'}}>Organize sanitation, HACCP/SSOP supporting records, maintenance evidence and inspection files without pretending software replaces qualified food-safety oversight.</p></article>
      <article style={{...card}}><Boxes color="#7a4633"/><h2>Freezer & Inventory</h2><p style={{lineHeight:1.5,color:'#59645c'}}>Know where every box is, how long it has been there, what is allocated, and what can be sold.</p><div style={{fontWeight:900}}>Current location: {selected.freezer}</div></article>
      <article style={{...card}}><Users color="#7a4633"/><h2>Producer Network</h2><p style={{lineHeight:1.5,color:'#59645c'}}>Let regional producers request processing and optionally list finished meat in a shared marketplace while Barnard remains the infrastructure hub.</p></article>
    </section>

    <section style={{background:'#ece2dc',padding:'36px 18px'}}><div style={{maxWidth:1220,margin:'auto'}}><div style={{fontSize:12,fontWeight:950,color:'#7a4633'}}>THE FULL LOOP</div><h2 style={{fontSize:'clamp(34px,5vw,52px)',margin:'8px 0 18px'}}>Producer → processing → customer → reorder.</h2><div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))',gap:10}}>{['1. Booking','2. Animal intake','3. USDA/plant records','4. Carcass + aging','5. Cut sheet','6. Packaging + QR','7. Freezer','8. Invoice + pickup','9. Direct sale','10. Reorder + producer analytics'].map(x=><div key={x} style={{background:'#fff',border:'1px solid #dccfc7',borderRadius:13,padding:14,fontWeight:900}}>{x}</div>)}</div></div></section>

    <footer style={{padding:'24px 18px 40px'}}><div style={{maxWidth:1220,margin:'auto',display:'flex',justifyContent:'space-between',gap:12,flexWrap:'wrap'}}><div><strong>Aridon Meat Processing OS</strong><div style={{fontSize:12,color:'#68716b',marginTop:3}}>Pilot workflow for small and regional meat processors.</div></div><Link href="/ag" style={{color:'#7a4633',fontWeight:900,textDecoration:'none'}}>Back to Aridon Ag</Link></div></footer>
  </main>
}
