import Link from 'next/link';
import { BarChart3, Bot, Droplets, Package, Sprout, Tractor, Users, WalletCards, Wrench, ClipboardList, ShieldCheck, ArrowRight } from 'lucide-react';

const modules=[
  ['Sales & Buyers','Track contracts, buyers, follow-up and revenue opportunities',BarChart3],
  ['Crop & Field Profit','Compare crop, field and per-acre economics',Sprout],
  ['Payroll & Labor','See labor %, overtime and scheduling pressure',Users],
  ['Inputs & Inventory','Track feed, seed, fertilizer, fuel and stock levels',Package],
  ['Water & Resilience','Monitor water cost, drought exposure and efficiency',Droplets],
  ['Equipment','Maintenance, downtime and work-order visibility',Tractor],
  ['Farm Financials','See operating margin, cash needs and cost trends',WalletCards],
  ['Work Orders','Turn recommendations into accountable field tasks',Wrench],
  ['Reports & Documents','Keep operating, lender and compliance records together',ClipboardList],
];

export default function AgApp(){return <main style={{minHeight:'100vh',background:'#eef4ee',color:'#183b4e',fontFamily:'Arial,sans-serif',paddingBottom:90}}>
<header style={{background:'#0a533e',color:'#fff',padding:'18px 18px 22px',position:'sticky',top:0,zIndex:10,boxShadow:'0 4px 16px #173b2a24'}}><div style={{maxWidth:1180,margin:'auto',display:'flex',justifyContent:'space-between',gap:12,alignItems:'center',flexWrap:'wrap'}}><div><div style={{fontSize:12,fontWeight:950,color:'#a9e67a',letterSpacing:1}}>ARIDON AG</div><strong style={{fontSize:23}}>Farm Command Center</strong></div><div style={{display:'flex',gap:8,flexWrap:'wrap'}}><Link href="/ag" style={{color:'#fff',textDecoration:'none',fontWeight:800}}>Home</Link><Link href="/ag/verified-data" style={{color:'#a9e67a',textDecoration:'none',fontWeight:900}}>Verified Data</Link><Link href="/ag/install" style={{background:'#a9e67a',color:'#143326',textDecoration:'none',padding:'9px 12px',borderRadius:9,fontWeight:900}}>Install App</Link></div></div></header>
<section style={{maxWidth:1180,margin:'auto',padding:'24px 18px'}}>
<div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))',gap:12}}>
<Card title="Today's Farm Score" value="82/100" sub="3 opportunities need attention" />
<Card title="Sales Pipeline" value="$184K" sub="Open buyer opportunities" />
<Card title="Labor" value="14.6%" sub="Of revenue • watch overtime" />
<Card title="Water" value="Moderate" sub="Drought/resilience exposure" />
</div>

<div style={{display:'grid',gridTemplateColumns:'minmax(0,1.4fr) minmax(280px,.8fr)',gap:14,marginTop:14}}>
<section style={{background:'#fff',borderRadius:20,padding:22,border:'1px solid #dce8df'}}><div style={{display:'flex',gap:10,alignItems:'center'}}><Bot color="#2e7d32"/><div><div style={{fontSize:12,fontWeight:950,color:'#2e7d32'}}>ARIDON AI FARM ADVISOR</div><h2 style={{margin:'3px 0'}}>What should I do today?</h2></div></div><div style={{display:'grid',gap:10,marginTop:14}}><Action n="1" title="Follow up with 3 repeat buyers" text="They are outside their normal reorder window." money="$18K potential"/><Action n="2" title="Review overtime on Crew B" text="Current scheduling trend may push labor above plan." money="$1.4K/month"/><Action n="3" title="Inspect Field 7 input usage" text="Fertilizer cost is rising faster than yield contribution." money="$7.2K opportunity"/><Action n="4" title="Service Pump #2 this week" text="Preventive maintenance is due before the next irrigation cycle." money="Risk reduction"/></div></section>
<section style={{background:'#0d314c',color:'#fff',borderRadius:20,padding:22}}><div style={{fontSize:12,fontWeight:950,color:'#a9e67a'}}>THIS WEEK</div><h2 style={{fontSize:30,margin:'7px 0 12px'}}>Farm priorities</h2><ul style={{lineHeight:1.9,paddingLeft:20,color:'#d7e5ee'}}><li>Protect margin on Field 7</li><li>Close open buyer follow-ups</li><li>Reduce Crew B overtime</li><li>Prepare water-use report</li><li>Complete Pump #2 service</li></ul><Link href="/ag#profit-check" style={{display:'inline-block',marginTop:8,background:'#a9e67a',color:'#153427',textDecoration:'none',fontWeight:950,padding:'12px 14px',borderRadius:10}}>Run Profit Check</Link></section>
</div>

<Link href="/ag/verified-data" style={{display:'block',textDecoration:'none',color:'inherit',marginTop:16}}><section style={{background:'linear-gradient(135deg,#0d314c,#0a533e)',color:'#fff',borderRadius:20,padding:22,border:'1px solid #295e51'}}><div style={{display:'grid',gridTemplateColumns:'auto 1fr auto',gap:14,alignItems:'center'}}><div style={{width:48,height:48,borderRadius:14,background:'#b9ee91',display:'grid',placeItems:'center'}}><ShieldCheck size={27} color="#153427"/></div><div><div style={{fontSize:12,fontWeight:950,color:'#b9ee91'}}>NEW • VERIFIED FARM DATA & INCENTIVES</div><h2 style={{margin:'4px 0 6px',fontSize:27}}>Enter farm data once. Reuse it wherever it can make or save money.</h2><div style={{color:'#d8ebe4',lineHeight:1.5,fontSize:14}}>Build evidence for Scope 3 buyer programs, 45Z supply-chain requests, conservation/cost-share opportunities, lender packets and audits, then connect the result back to farm profitability.</div></div><ArrowRight size={24} color="#b9ee91"/></div></section></Link>

<h2 style={{fontSize:30,margin:'28px 0 12px'}}>Your farm operating system</h2>
<div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(230px,1fr))',gap:12}}>{modules.map(([title,text,Icon]:any)=><section key={title} style={{background:'#fff',borderRadius:17,padding:19,border:'1px solid #dce8df'}}><Icon size={24} color="#2e7d32"/><h3 style={{margin:'10px 0 6px'}}>{title}</h3><p style={{margin:0,color:'#607284',lineHeight:1.5,fontSize:14}}>{text}</p></section>)}</div>

<section style={{marginTop:20,background:'#e3efe3',borderRadius:18,padding:20}}><strong>Built for the field:</strong> use this dashboard from a phone, tablet or desktop. Install Aridon Ag to your home screen for a dedicated app-style experience.</section>
</section>
</main>}

function Card({title,value,sub}:{title:string,value:string,sub:string}){return <section style={{background:'#fff',borderRadius:17,padding:19,border:'1px solid #dce8df'}}><div style={{fontSize:12,fontWeight:900,color:'#607284'}}>{title}</div><div style={{fontSize:31,fontWeight:950,margin:'5px 0'}}>{value}</div><div style={{fontSize:13,color:'#607284'}}>{sub}</div></section>}
function Action({n,title,text,money}:{n:string,title:string,text:string,money:string}){return <div style={{display:'grid',gridTemplateColumns:'34px 1fr auto',gap:10,alignItems:'center',padding:12,borderRadius:12,background:'#f5f8f5'}}><div style={{width:30,height:30,borderRadius:999,display:'grid',placeItems:'center',background:'#dff1d8',fontWeight:950,color:'#2e7d32'}}>{n}</div><div><strong>{title}</strong><div style={{fontSize:13,color:'#607284',marginTop:3}}>{text}</div></div><div style={{fontSize:12,fontWeight:900,color:'#2e7d32',textAlign:'right'}}>{money}</div></div>}
