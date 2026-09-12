'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { ArrowLeft, BatteryCharging, Building2, Droplets, Factory, MapPin, Search, Sun, ThermometerSun, Users, Zap } from 'lucide-react';

type Prospect = {
  name: string; city: string; state: string; sqft: number; utility: string; industry: string;
  kwh: number; water: number; decisionMaker: string; title: string; score: number;
  solar: number; storage: number; geothermal: number; awg: number; dataCenter: number;
};

const prospects: Prospect[] = [
  { name:'Mesa Industrial Center', city:'Mesa', state:'AZ', sqft:186000, utility:'Salt River Project', industry:'Advanced Manufacturing', kwh:4900000, water:11800000, decisionMaker:'Facilities & Energy Director', title:'Operations', score:94, solar:96, storage:91, geothermal:66, awg:82, dataCenter:80 },
  { name:'Four Corners Processing Campus', city:'Farmington', state:'NM', sqft:242000, utility:'Farmington Electric Utility System', industry:'Food & Industrial Processing', kwh:6100000, water:21400000, decisionMaker:'VP Operations', title:'Executive', score:92, solar:91, storage:88, geothermal:84, awg:95, dataCenter:73 },
  { name:'Rio Grande Logistics Park', city:'Albuquerque', state:'NM', sqft:315000, utility:'PNM', industry:'Warehouse & Logistics', kwh:5300000, water:6400000, decisionMaker:'Director of Facilities', title:'Facilities', score:89, solar:98, storage:90, geothermal:70, awg:71, dataCenter:84 },
  { name:'West Texas Fabrication Works', city:'Midland', state:'TX', sqft:174000, utility:'Oncor', industry:'Metal Fabrication', kwh:7200000, water:9800000, decisionMaker:'Plant Manager', title:'Operations', score:88, solar:94, storage:93, geothermal:87, awg:78, dataCenter:69 },
  { name:'Desert Data Services', city:'Phoenix', state:'AZ', sqft:128000, utility:'Arizona Public Service', industry:'Data Center', kwh:19800000, water:27100000, decisionMaker:'VP Infrastructure', title:'Technology', score:97, solar:88, storage:99, geothermal:75, awg:98, dataCenter:100 },
  { name:'San Juan Cold Storage', city:'Aztec', state:'NM', sqft:96000, utility:'Aztec Electric Department', industry:'Cold Storage', kwh:4100000, water:7200000, decisionMaker:'General Manager', title:'Executive', score:90, solar:93, storage:96, geothermal:79, awg:86, dataCenter:61 }
];

const C={bg:'#06101B',panel:'#0B1725',panel2:'#0E1D2E',line:'#20344A',text:'#F7FAFC',muted:'#8EA2B8',cyan:'#66D9EF',mint:'#9EF0CF',amber:'#FFC857',orange:'#FF8B57'};

function pct(v:number){return `${v}%`}
function num(v:number){return new Intl.NumberFormat('en-US').format(v)}

export default function OpportunityMapPage(){
  const [query,setQuery]=useState('');
  const [minScore,setMinScore]=useState(80);
  const [selected,setSelected]=useState<Prospect|null>(prospects[4]);
  const [saved,setSaved]=useState<string[]>([]);

  const filtered=useMemo(()=>prospects.filter(p=>p.score>=minScore && `${p.name} ${p.city} ${p.state} ${p.industry} ${p.utility}`.toLowerCase().includes(query.toLowerCase())),[query,minScore]);

  function addToCRM(p:Prospect){
    const next=Array.from(new Set([...saved,p.name]));
    setSaved(next);
    try{localStorage.setItem('aridon-opportunity-leads',JSON.stringify(next));}catch{}
  }

  return <main style={{minHeight:'100vh',background:`radial-gradient(circle at 80% -10%,#12325A 0,${C.bg} 36%,#040A11 100%)`,color:C.text,fontFamily:'Arial,sans-serif'}}>
    <style>{`*{box-sizing:border-box} body{margin:0} input,select,button{font:inherit}.card{background:linear-gradient(180deg,rgba(15,31,48,.97),rgba(8,20,32,.97));border:1px solid ${C.line}} .row:hover{border-color:#3b607f!important;background:#10243A!important}@media(max-width:900px){.grid{grid-template-columns:1fr!important}.stats{grid-template-columns:repeat(2,1fr)!important}}`}</style>
    <header style={{borderBottom:`1px solid ${C.line}`,background:'rgba(4,12,20,.9)',position:'sticky',top:0,zIndex:5,backdropFilter:'blur(16px)'}}>
      <div style={{maxWidth:1500,margin:'0 auto',padding:'14px 18px',display:'flex',alignItems:'center',justifyContent:'space-between',gap:12}}>
        <div><div style={{fontWeight:1000,letterSpacing:'.1em'}}>ARIDON OPPORTUNITY MAP</div><div style={{fontSize:10,color:C.muted,marginTop:3}}>ENERGY + WATER + INFRASTRUCTURE INTELLIGENCE</div></div>
        <Link href="/dashboard" style={{display:'flex',gap:7,alignItems:'center',textDecoration:'none',color:C.text,fontSize:12,fontWeight:900}}><ArrowLeft size={15}/> Command Center</Link>
      </div>
    </header>

    <section style={{maxWidth:1500,margin:'0 auto',padding:'24px 18px 50px'}}>
      <div style={{display:'grid',gridTemplateColumns:'minmax(0,1fr) auto',gap:14,alignItems:'end'}}>
        <div><div style={{color:C.cyan,fontSize:11,fontWeight:1000,letterSpacing:'.12em'}}>PROSPECTING RADAR</div><h1 style={{fontSize:'clamp(32px,5vw,56px)',lineHeight:1,margin:'9px 0'}}>Find the buildings where Aridon can save the most money and resources.</h1><p style={{color:C.muted,maxWidth:900,lineHeight:1.55}}>Search commercial and industrial properties, estimate energy and water demand, identify the provider and decision-maker, then score solar, storage, geothermal, AWG and data-center opportunities in one cockpit.</p></div>
        <div style={{fontSize:11,color:C.muted,textAlign:'right'}}>MVP DATA LAYER<br/><strong style={{color:C.mint}}>READY FOR LIVE DATA CONNECTORS</strong></div>
      </div>

      <div className="stats" style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10,margin:'18px 0'}}>
        <Stat icon={Building2} label="Buildings" value="250K+ targetable"/>
        <Stat icon={Zap} label="Energy" value="kWh modeled"/>
        <Stat icon={Droplets} label="Water" value="Demand modeled"/>
        <Stat icon={Users} label="Contacts" value="Decision-maker ready"/>
      </div>

      <div className="card" style={{borderRadius:16,padding:12,display:'grid',gridTemplateColumns:'1fr 190px',gap:10,marginBottom:14}}>
        <div style={{display:'flex',alignItems:'center',gap:9,background:'#07111D',border:`1px solid ${C.line}`,borderRadius:12,padding:'0 12px'}}><Search size={17} color={C.cyan}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search city, industry, building or utility…" style={{width:'100%',padding:'13px 0',border:0,outline:0,background:'transparent',color:C.text}}/></div>
        <select value={minScore} onChange={e=>setMinScore(Number(e.target.value))} style={{borderRadius:12,border:`1px solid ${C.line}`,background:'#07111D',color:C.text,padding:'0 12px'}}><option value={0}>All opportunities</option><option value={80}>Score 80+</option><option value={90}>Score 90+</option><option value={95}>Score 95+</option></select>
      </div>

      <div className="grid" style={{display:'grid',gridTemplateColumns:'minmax(0,1.4fr) minmax(330px,.8fr)',gap:14,alignItems:'start'}}>
        <div className="card" style={{borderRadius:18,overflow:'hidden'}}>
          <div style={{padding:'13px 15px',borderBottom:`1px solid ${C.line}`,fontSize:11,fontWeight:1000,color:C.muted}}>QUALIFIED OPPORTUNITIES · {filtered.length}</div>
          <div>{filtered.map(p=><button className="row" key={p.name} onClick={()=>setSelected(p)} style={{width:'100%',textAlign:'left',cursor:'pointer',background:selected?.name===p.name?'#10243A':'transparent',color:C.text,border:0,borderBottom:`1px solid ${C.line}`,padding:15,display:'grid',gridTemplateColumns:'1fr auto',gap:10}}>
            <div><div style={{display:'flex',gap:8,alignItems:'center',flexWrap:'wrap'}}><strong>{p.name}</strong><span style={{fontSize:9,color:C.mint,border:`1px solid ${C.mint}55`,borderRadius:99,padding:'3px 6px'}}>SCORE {p.score}</span></div><div style={{fontSize:11,color:C.muted,marginTop:6,display:'flex',gap:14,flexWrap:'wrap'}}><span><MapPin size={11} style={{verticalAlign:'middle'}}/> {p.city}, {p.state}</span><span>{p.industry}</span><span>{num(p.sqft)} sq ft</span><span>{p.utility}</span></div></div>
            <div style={{textAlign:'right'}}><div style={{fontWeight:1000,color:C.cyan}}>{(p.kwh/1000000).toFixed(1)}M</div><div style={{fontSize:9,color:C.muted}}>est. kWh/yr</div></div>
          </button>)}</div>
        </div>

        {selected && <aside className="card" style={{borderRadius:18,padding:16,position:'sticky',top:80}}>
          <div style={{display:'flex',justifyContent:'space-between',gap:10}}><div><div style={{fontSize:10,color:C.cyan,fontWeight:1000}}>ARIDON OPPORTUNITY SCORE</div><div style={{fontSize:48,fontWeight:1000,lineHeight:1,marginTop:5}}>{selected.score}</div></div><div style={{width:62,height:62,borderRadius:16,display:'grid',placeItems:'center',background:'#102338',color:C.orange}}><Factory size={30}/></div></div>
          <h2 style={{marginBottom:4}}>{selected.name}</h2><div style={{fontSize:11,color:C.muted}}>{selected.city}, {selected.state} · {selected.industry}</div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,margin:'14px 0'}}><Mini label="Energy" value={`${(selected.kwh/1000000).toFixed(1)}M kWh/yr`}/><Mini label="Water" value={`${(selected.water/1000000).toFixed(1)}M gal/yr`}/><Mini label="Area" value={`${num(selected.sqft)} sq ft`}/><Mini label="Utility" value={selected.utility}/></div>
          <div style={{fontSize:10,color:C.muted,fontWeight:1000,margin:'16px 0 8px'}}>SOLUTION FIT</div>
          <Score icon={Sun} label="Solar" value={selected.solar}/><Score icon={BatteryCharging} label="Storage" value={selected.storage}/><Score icon={ThermometerSun} label="Geothermal" value={selected.geothermal}/><Score icon={Droplets} label="AWG / Water" value={selected.awg}/><Score icon={Building2} label="Data-center fit" value={selected.dataCenter}/>
          <div style={{marginTop:16,padding:12,borderRadius:12,background:'#07111D',border:`1px solid ${C.line}`}}><div style={{fontSize:9,color:C.muted,fontWeight:1000}}>DECISION-MAKER TARGET</div><div style={{fontWeight:900,marginTop:5}}>{selected.decisionMaker}</div><div style={{fontSize:10,color:C.muted,marginTop:2}}>{selected.title}</div></div>
          <button onClick={()=>addToCRM(selected)} style={{marginTop:10,width:'100%',border:0,borderRadius:11,padding:'12px 14px',background:saved.includes(selected.name)?C.mint:C.cyan,color:'#05212A',fontWeight:1000,cursor:'pointer'}}>{saved.includes(selected.name)?'SAVED TO ARIDON CRM':'ADD TO ARIDON CRM'}</button>
          <button onClick={()=>{try{localStorage.setItem('aridon-last-command',`Prepare outreach and an energy-water opportunity brief for ${selected.name} in ${selected.city}, ${selected.state}.`)}catch{};window.location.href='/avatars'}} style={{marginTop:8,width:'100%',border:`1px solid ${C.line}`,borderRadius:11,padding:'11px 14px',background:'#0E1B2A',color:C.text,fontWeight:900,cursor:'pointer'}}>ASK EVA TO PREPARE OUTREACH</button>
        </aside>}
      </div>

      <div style={{marginTop:16,color:C.muted,fontSize:10,lineHeight:1.5}}>Current page is an operational MVP with demonstration prospect records and scoring. The interface is structured for licensed commercial-building, utility, contact, GIS, weather, solar, water and property-data connectors so live coverage can replace demo records without redesigning the workflow.</div>
    </section>
  </main>
}

function Stat({icon:Icon,label,value}:{icon:any;label:string;value:string}){return <div className="card" style={{borderRadius:14,padding:13}}><Icon size={17} color={C.cyan}/><div style={{fontSize:9,color:C.muted,fontWeight:1000,marginTop:8}}>{label.toUpperCase()}</div><div style={{fontWeight:1000,marginTop:4}}>{value}</div></div>}
function Mini({label,value}:{label:string;value:string}){return <div style={{padding:9,borderRadius:10,background:'#07111D',border:`1px solid ${C.line}`}}><div style={{fontSize:8,color:C.muted,fontWeight:1000}}>{label.toUpperCase()}</div><div style={{fontSize:11,fontWeight:900,marginTop:4,lineHeight:1.3}}>{value}</div></div>}
function Score({icon:Icon,label,value}:{icon:any;label:string;value:number}){return <div style={{display:'grid',gridTemplateColumns:'24px 1fr 38px',alignItems:'center',gap:8,margin:'8px 0'}}><Icon size={15} color={C.cyan}/><div><div style={{fontSize:10,fontWeight:850}}>{label}</div><div style={{height:5,background:'#12263A',borderRadius:99,marginTop:4,overflow:'hidden'}}><div style={{width:pct(value),height:'100%',background:C.mint}}/></div></div><strong style={{fontSize:11,textAlign:'right'}}>{value}</strong></div>}
