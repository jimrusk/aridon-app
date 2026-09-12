'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import {
  ArrowLeft, BatteryCharging, Building2, Calculator, CircleDollarSign, Droplets,
  Factory, Home, MapPin, Search, Sun, ThermometerSun, TrendingUp, Users, Zap
} from 'lucide-react';

type Prospect = {
  name: string; city: string; state: string; sqft: number; utility: string; industry: string;
  kwh: number; water: number; decisionMaker: string; title: string; score: number;
  solar: number; storage: number; geothermal: number; awg: number; dataCenter: number;
};

type MultifamilyDeal = {
  name: string; city: string; state: string; units: number; askingPrice: number; estValue: number;
  noi: number; occupancy: number; yearBuilt: number; ownerType: string; motivation: string;
  score: number; capRate: number; pricePerUnit: number; assignmentPotential: number;
  rehabRisk: number; buyerDemand: number; contactTarget: string;
};

const prospects: Prospect[] = [
  { name:'Mesa Industrial Center', city:'Mesa', state:'AZ', sqft:186000, utility:'Salt River Project', industry:'Advanced Manufacturing', kwh:4900000, water:11800000, decisionMaker:'Facilities & Energy Director', title:'Operations', score:94, solar:96, storage:91, geothermal:66, awg:82, dataCenter:80 },
  { name:'Four Corners Processing Campus', city:'Farmington', state:'NM', sqft:242000, utility:'Farmington Electric Utility System', industry:'Food & Industrial Processing', kwh:6100000, water:21400000, decisionMaker:'VP Operations', title:'Executive', score:92, solar:91, storage:88, geothermal:84, awg:95, dataCenter:73 },
  { name:'Rio Grande Logistics Park', city:'Albuquerque', state:'NM', sqft:315000, utility:'PNM', industry:'Warehouse & Logistics', kwh:5300000, water:6400000, decisionMaker:'Director of Facilities', title:'Facilities', score:89, solar:98, storage:90, geothermal:70, awg:71, dataCenter:84 },
  { name:'West Texas Fabrication Works', city:'Midland', state:'TX', sqft:174000, utility:'Oncor', industry:'Metal Fabrication', kwh:7200000, water:9800000, decisionMaker:'Plant Manager', title:'Operations', score:88, solar:94, storage:93, geothermal:87, awg:78, dataCenter:69 },
  { name:'Desert Data Services', city:'Phoenix', state:'AZ', sqft:128000, utility:'Arizona Public Service', industry:'Data Center', kwh:19800000, water:27100000, decisionMaker:'VP Infrastructure', title:'Technology', score:97, solar:88, storage:99, geothermal:75, awg:98, dataCenter:100 },
  { name:'San Juan Cold Storage', city:'Aztec', state:'NM', sqft:96000, utility:'Aztec Electric Department', industry:'Cold Storage', kwh:4100000, water:7200000, decisionMaker:'General Manager', title:'Executive', score:90, solar:93, storage:96, geothermal:79, awg:86, dataCenter:61 }
];

const multifamily: MultifamilyDeal[] = [
  { name:'Mesa Garden Apartments', city:'Mesa', state:'AZ', units:42, askingPrice:6100000, estValue:6900000, noi:426000, occupancy:91, yearBuilt:1987, ownerType:'Private LLC', motivation:'Long hold · deferred maintenance', score:94, capRate:6.98, pricePerUnit:145238, assignmentPotential:93, rehabRisk:61, buyerDemand:96, contactTarget:'Managing Member / Owner' },
  { name:'San Juan Flats', city:'Farmington', state:'NM', units:28, askingPrice:3250000, estValue:3825000, noi:258000, occupancy:88, yearBuilt:1979, ownerType:'Family ownership', motivation:'Estate transition / aging ownership', score:96, capRate:7.94, pricePerUnit:116071, assignmentPotential:97, rehabRisk:57, buyerDemand:86, contactTarget:'Property Owner / Family Representative' },
  { name:'Rio Vista Court', city:'Albuquerque', state:'NM', units:64, askingPrice:10250000, estValue:11400000, noi:684000, occupancy:94, yearBuilt:1993, ownerType:'Regional investor', motivation:'Portfolio rotation', score:90, capRate:6.67, pricePerUnit:160156, assignmentPotential:84, rehabRisk:38, buyerDemand:93, contactTarget:'Principal / Acquisitions Contact' },
  { name:'West Texas Workforce Housing', city:'Midland', state:'TX', units:76, askingPrice:11800000, estValue:13400000, noi:902000, occupancy:89, yearBuilt:1985, ownerType:'Private partnership', motivation:'Refinance pressure / capex needs', score:95, capRate:7.64, pricePerUnit:155263, assignmentPotential:95, rehabRisk:66, buyerDemand:98, contactTarget:'Managing Partner' },
  { name:'Desert Palms Residences', city:'Phoenix', state:'AZ', units:96, askingPrice:18200000, estValue:19750000, noi:1210000, occupancy:96, yearBuilt:2001, ownerType:'Small syndicator', motivation:'Fund maturity', score:88, capRate:6.65, pricePerUnit:189583, assignmentPotential:76, rehabRisk:24, buyerDemand:99, contactTarget:'Sponsor / Asset Manager' },
  { name:'Durango Ridge Apartments', city:'Durango', state:'CO', units:34, askingPrice:7450000, estValue:8300000, noi:486000, occupancy:93, yearBuilt:1998, ownerType:'Out-of-state owner', motivation:'Remote ownership / management fatigue', score:92, capRate:6.52, pricePerUnit:219118, assignmentPotential:89, rehabRisk:32, buyerDemand:92, contactTarget:'Owner / Asset Manager' }
];

const C={bg:'#06101B',panel:'#0B1725',panel2:'#0E1D2E',line:'#20344A',text:'#F7FAFC',muted:'#8EA2B8',cyan:'#66D9EF',mint:'#9EF0CF',amber:'#FFC857',orange:'#FF8B57',purple:'#B995FF'};

function pct(v:number){return `${v}%`}
function num(v:number){return new Intl.NumberFormat('en-US').format(v)}
function money(v:number){return new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:0}).format(v)}

export default function OpportunityMapPage(){
  const [mode,setMode]=useState<'infrastructure'|'multifamily'>('infrastructure');
  const [query,setQuery]=useState('');
  const [minScore,setMinScore]=useState(80);
  const [selected,setSelected]=useState<Prospect|null>(prospects[4]);
  const [selectedDeal,setSelectedDeal]=useState<MultifamilyDeal|null>(multifamily[1]);
  const [saved,setSaved]=useState<string[]>([]);

  const filtered=useMemo(()=>prospects.filter(p=>p.score>=minScore && `${p.name} ${p.city} ${p.state} ${p.industry} ${p.utility}`.toLowerCase().includes(query.toLowerCase())),[query,minScore]);
  const filteredDeals=useMemo(()=>multifamily.filter(p=>p.score>=minScore && `${p.name} ${p.city} ${p.state} ${p.ownerType} ${p.motivation}`.toLowerCase().includes(query.toLowerCase())),[query,minScore]);

  function addToCRM(name:string){
    const next=Array.from(new Set([...saved,name]));
    setSaved(next);
    try{localStorage.setItem('aridon-opportunity-leads',JSON.stringify(next));}catch{}
  }

  function askEva(command:string){
    try{localStorage.setItem('aridon-last-command',command)}catch{}
    window.location.href='/avatars';
  }

  return <main style={{minHeight:'100vh',background:`radial-gradient(circle at 80% -10%,#12325A 0,${C.bg} 36%,#040A11 100%)`,color:C.text,fontFamily:'Arial,sans-serif'}}>
    <style>{`*{box-sizing:border-box} body{margin:0} input,select,button{font:inherit}.card{background:linear-gradient(180deg,rgba(15,31,48,.97),rgba(8,20,32,.97));border:1px solid ${C.line}} .row:hover{border-color:#3b607f!important;background:#10243A!important}.tab{transition:.18s ease}.tab:hover{transform:translateY(-1px)}@media(max-width:900px){.grid{grid-template-columns:1fr!important}.stats{grid-template-columns:repeat(2,1fr)!important}.hero{grid-template-columns:1fr!important}.filters{grid-template-columns:1fr!important}}`}</style>
    <header style={{borderBottom:`1px solid ${C.line}`,background:'rgba(4,12,20,.9)',position:'sticky',top:0,zIndex:5,backdropFilter:'blur(16px)'}}>
      <div style={{maxWidth:1500,margin:'0 auto',padding:'14px 18px',display:'flex',alignItems:'center',justifyContent:'space-between',gap:12}}>
        <div><div style={{fontWeight:1000,letterSpacing:'.1em'}}>ARIDON OPPORTUNITY MAP</div><div style={{fontSize:10,color:C.muted,marginTop:3}}>PROPERTY + ENERGY + WATER + DEAL INTELLIGENCE</div></div>
        <Link href="/dashboard" style={{display:'flex',gap:7,alignItems:'center',textDecoration:'none',color:C.text,fontSize:12,fontWeight:900}}><ArrowLeft size={15}/> Command Center</Link>
      </div>
    </header>

    <section style={{maxWidth:1500,margin:'0 auto',padding:'24px 18px 50px'}}>
      <div className="hero" style={{display:'grid',gridTemplateColumns:'minmax(0,1fr) auto',gap:14,alignItems:'end'}}>
        <div><div style={{color:C.cyan,fontSize:11,fontWeight:1000,letterSpacing:'.12em'}}>ARIDON PROSPECTING RADAR</div><h1 style={{fontSize:'clamp(32px,5vw,56px)',lineHeight:1,margin:'9px 0'}}>One map. Two revenue engines.</h1><p style={{color:C.muted,maxWidth:950,lineHeight:1.55}}>Find commercial properties where Aridon can sell energy, water and infrastructure solutions, or switch to Multifamily Deal Hunter to screen apartment opportunities for acquisition, assignment or investor disposition.</p></div>
        <div style={{fontSize:11,color:C.muted,textAlign:'right'}}>MVP DATA LAYER<br/><strong style={{color:C.mint}}>READY FOR LIVE DATA CONNECTORS</strong></div>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'repeat(2,minmax(0,1fr))',gap:10,margin:'18px 0 12px'}}>
        <button className="tab" onClick={()=>{setMode('infrastructure');setQuery('')}} style={{cursor:'pointer',textAlign:'left',padding:16,borderRadius:16,border:`1px solid ${mode==='infrastructure'?C.cyan:C.line}`,background:mode==='infrastructure'?'#10273A':'#0A1624',color:C.text}}><div style={{display:'flex',gap:10,alignItems:'center'}}><Zap size={20} color={C.cyan}/><div><strong>ENERGY & INFRASTRUCTURE</strong><div style={{fontSize:10,color:C.muted,marginTop:3}}>kWh · water · utility · solar · storage · geothermal · AWG</div></div></div></button>
        <button className="tab" onClick={()=>{setMode('multifamily');setQuery('')}} style={{cursor:'pointer',textAlign:'left',padding:16,borderRadius:16,border:`1px solid ${mode==='multifamily'?C.purple:C.line}`,background:mode==='multifamily'?'#1B1730':'#0A1624',color:C.text}}><div style={{display:'flex',gap:10,alignItems:'center'}}><Home size={20} color={C.purple}/><div><strong>MULTIFAMILY DEAL HUNTER</strong><div style={{fontSize:10,color:C.muted,marginTop:3}}>owners · motivation · NOI · cap rate · value gap · buyer demand</div></div></div></button>
      </div>

      {mode==='infrastructure' ? <>
        <div className="stats" style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10,margin:'12px 0 18px'}}>
          <Stat icon={Building2} label="Buildings" value="250K+ targetable"/>
          <Stat icon={Zap} label="Energy" value="kWh modeled"/>
          <Stat icon={Droplets} label="Water" value="Demand modeled"/>
          <Stat icon={Users} label="Contacts" value="Decision-maker ready"/>
        </div>

        <div className="filters card" style={{borderRadius:16,padding:12,display:'grid',gridTemplateColumns:'1fr 190px',gap:10,marginBottom:14}}>
          <SearchBox query={query} setQuery={setQuery} placeholder="Search city, industry, building or utility…"/>
          <ScoreSelect minScore={minScore} setMinScore={setMinScore}/>
        </div>

        <div className="grid" style={{display:'grid',gridTemplateColumns:'minmax(0,1.4fr) minmax(330px,.8fr)',gap:14,alignItems:'start'}}>
          <div className="card" style={{borderRadius:18,overflow:'hidden'}}>
            <div style={{padding:'13px 15px',borderBottom:`1px solid ${C.line}`,fontSize:11,fontWeight:1000,color:C.muted}}>QUALIFIED OPPORTUNITIES · {filtered.length}</div>
            <div>{filtered.map(p=><button className="row" key={p.name} onClick={()=>setSelected(p)} style={{width:'100%',textAlign:'left',cursor:'pointer',background:selected?.name===p.name?'#10243A':'transparent',color:C.text,border:0,borderBottom:`1px solid ${C.line}`,padding:15,display:'grid',gridTemplateColumns:'1fr auto',gap:10}}>
              <div><div style={{display:'flex',gap:8,alignItems:'center',flexWrap:'wrap'}}><strong>{p.name}</strong><ScoreBadge score={p.score}/></div><div style={{fontSize:11,color:C.muted,marginTop:6,display:'flex',gap:14,flexWrap:'wrap'}}><span><MapPin size={11} style={{verticalAlign:'middle'}}/> {p.city}, {p.state}</span><span>{p.industry}</span><span>{num(p.sqft)} sq ft</span><span>{p.utility}</span></div></div>
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
            <ActionButtons saved={saved.includes(selected.name)} onSave={()=>addToCRM(selected.name)} onEva={()=>askEva(`Prepare outreach and an energy-water opportunity brief for ${selected.name} in ${selected.city}, ${selected.state}.`)}/>
          </aside>}
        </div>
      </> : <>
        <div className="stats" style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10,margin:'12px 0 18px'}}>
          <Stat icon={Home} label="Target" value="5–100 units" tone={C.purple}/>
          <Stat icon={CircleDollarSign} label="Spread" value="Value gap screened" tone={C.mint}/>
          <Stat icon={Calculator} label="Underwriting" value="NOI + cap rate" tone={C.amber}/>
          <Stat icon={TrendingUp} label="Exit" value="Buyer demand scored" tone={C.orange}/>
        </div>

        <div className="filters card" style={{borderRadius:16,padding:12,display:'grid',gridTemplateColumns:'1fr 190px',gap:10,marginBottom:14}}>
          <SearchBox query={query} setQuery={setQuery} placeholder="Search property, city, state, owner type or motivation…"/>
          <ScoreSelect minScore={minScore} setMinScore={setMinScore}/>
        </div>

        <div className="grid" style={{display:'grid',gridTemplateColumns:'minmax(0,1.4fr) minmax(330px,.8fr)',gap:14,alignItems:'start'}}>
          <div className="card" style={{borderRadius:18,overflow:'hidden'}}>
            <div style={{padding:'13px 15px',borderBottom:`1px solid ${C.line}`,fontSize:11,fontWeight:1000,color:C.muted}}>MULTIFAMILY OPPORTUNITIES · {filteredDeals.length}</div>
            <div>{filteredDeals.map(p=>{
              const spread=p.estValue-p.askingPrice;
              return <button className="row" key={p.name} onClick={()=>setSelectedDeal(p)} style={{width:'100%',textAlign:'left',cursor:'pointer',background:selectedDeal?.name===p.name?'#17182F':'transparent',color:C.text,border:0,borderBottom:`1px solid ${C.line}`,padding:15,display:'grid',gridTemplateColumns:'1fr auto',gap:10}}>
                <div><div style={{display:'flex',gap:8,alignItems:'center',flexWrap:'wrap'}}><strong>{p.name}</strong><ScoreBadge score={p.score} tone={C.purple}/></div><div style={{fontSize:11,color:C.muted,marginTop:6,display:'flex',gap:14,flexWrap:'wrap'}}><span><MapPin size={11} style={{verticalAlign:'middle'}}/> {p.city}, {p.state}</span><span>{p.units} units</span><span>{p.occupancy}% occupied</span><span>{p.ownerType}</span></div><div style={{fontSize:10,color:C.amber,marginTop:7}}>{p.motivation}</div></div>
                <div style={{textAlign:'right'}}><div style={{fontWeight:1000,color:C.mint}}>{money(spread)}</div><div style={{fontSize:9,color:C.muted}}>modeled value gap</div></div>
              </button>
            })}</div>
          </div>

          {selectedDeal && <aside className="card" style={{borderRadius:18,padding:16,position:'sticky',top:80}}>
            <div style={{display:'flex',justifyContent:'space-between',gap:10}}><div><div style={{fontSize:10,color:C.purple,fontWeight:1000}}>ARIDON DEAL SCORE</div><div style={{fontSize:48,fontWeight:1000,lineHeight:1,marginTop:5}}>{selectedDeal.score}</div></div><div style={{width:62,height:62,borderRadius:16,display:'grid',placeItems:'center',background:'#1B1730',color:C.purple}}><Home size={30}/></div></div>
            <h2 style={{marginBottom:4}}>{selectedDeal.name}</h2><div style={{fontSize:11,color:C.muted}}>{selectedDeal.city}, {selectedDeal.state} · {selectedDeal.units} units · built {selectedDeal.yearBuilt}</div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,margin:'14px 0'}}><Mini label="Asking" value={money(selectedDeal.askingPrice)}/><Mini label="Est. value" value={money(selectedDeal.estValue)}/><Mini label="NOI" value={money(selectedDeal.noi)}/><Mini label="Cap rate" value={`${selectedDeal.capRate.toFixed(2)}%`}/><Mini label="Price / unit" value={money(selectedDeal.pricePerUnit)}/><Mini label="Occupancy" value={`${selectedDeal.occupancy}%`}/></div>
            <div style={{padding:12,borderRadius:12,background:'#07111D',border:`1px solid ${C.line}`,marginBottom:14}}><div style={{fontSize:9,color:C.muted,fontWeight:1000}}>MODELED VALUE GAP</div><div style={{fontSize:24,fontWeight:1000,color:C.mint,marginTop:4}}>{money(selectedDeal.estValue-selectedDeal.askingPrice)}</div><div style={{fontSize:9,color:C.muted,marginTop:3}}>Screening figure only. Verify financials, title, contract rights, condition and local law before relying on it.</div></div>
            <div style={{fontSize:10,color:C.muted,fontWeight:1000,margin:'16px 0 8px'}}>DEAL FIT</div>
            <Score icon={CircleDollarSign} label="Assignment / deal-control potential" value={selectedDeal.assignmentPotential} tone={C.purple}/><Score icon={TrendingUp} label="Buyer demand" value={selectedDeal.buyerDemand} tone={C.mint}/><Score icon={Factory} label="Rehab risk" value={selectedDeal.rehabRisk} tone={C.amber}/>
            <div style={{marginTop:16,padding:12,borderRadius:12,background:'#07111D',border:`1px solid ${C.line}`}}><div style={{fontSize:9,color:C.muted,fontWeight:1000}}>OWNER OUTREACH TARGET</div><div style={{fontWeight:900,marginTop:5}}>{selectedDeal.contactTarget}</div><div style={{fontSize:10,color:C.muted,marginTop:2}}>{selectedDeal.ownerType} · {selectedDeal.motivation}</div></div>
            <ActionButtons saved={saved.includes(selectedDeal.name)} onSave={()=>addToCRM(selectedDeal.name)} onEva={()=>askEva(`Underwrite ${selectedDeal.name} in ${selectedDeal.city}, ${selectedDeal.state}. Prepare owner outreach, buyer profile, diligence checklist, legal/compliance questions, and a conservative deal-control or acquisition strategy. Do not assume assignability or fees are legal without local review.`)}/>
          </aside>}
        </div>
      </>}

      <div style={{marginTop:16,color:C.muted,fontSize:10,lineHeight:1.5}}>Current Opportunity Map uses demonstration records and scoring logic. It is structured for licensed property, utility, GIS, ownership, contact, rent-roll, sales-comps and market-data connectors. Multifamily outputs are screening tools, not appraisals, legal advice or guaranteed transaction economics.</div>
    </section>
  </main>
}

function SearchBox({query,setQuery,placeholder}:{query:string;setQuery:(v:string)=>void;placeholder:string}){return <div style={{display:'flex',alignItems:'center',gap:9,background:'#07111D',border:`1px solid ${C.line}`,borderRadius:12,padding:'0 12px'}}><Search size={17} color={C.cyan}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder={placeholder} style={{width:'100%',padding:'13px 0',border:0,outline:0,background:'transparent',color:C.text}}/></div>}
function ScoreSelect({minScore,setMinScore}:{minScore:number;setMinScore:(n:number)=>void}){return <select value={minScore} onChange={e=>setMinScore(Number(e.target.value))} style={{borderRadius:12,border:`1px solid ${C.line}`,background:'#07111D',color:C.text,padding:'0 12px'}}><option value={0}>All opportunities</option><option value={80}>Score 80+</option><option value={90}>Score 90+</option><option value={95}>Score 95+</option></select>}
function ScoreBadge({score,tone=C.mint}:{score:number;tone?:string}){return <span style={{fontSize:9,color:tone,border:`1px solid ${tone}55`,borderRadius:99,padding:'3px 6px'}}>SCORE {score}</span>}
function ActionButtons({saved,onSave,onEva}:{saved:boolean;onSave:()=>void;onEva:()=>void}){return <><button onClick={onSave} style={{marginTop:10,width:'100%',border:0,borderRadius:11,padding:'12px 14px',background:saved?C.mint:C.cyan,color:'#05212A',fontWeight:1000,cursor:'pointer'}}>{saved?'SAVED TO ARIDON CRM':'ADD TO ARIDON CRM'}</button><button onClick={onEva} style={{marginTop:8,width:'100%',border:`1px solid ${C.line}`,borderRadius:11,padding:'11px 14px',background:'#0E1B2A',color:C.text,fontWeight:900,cursor:'pointer'}}>ASK EVA TO PREPARE NEXT MOVE</button></>}
function Stat({icon:Icon,label,value,tone=C.cyan}:{icon:any;label:string;value:string;tone?:string}){return <div className="card" style={{borderRadius:14,padding:13}}><Icon size={17} color={tone}/><div style={{fontSize:9,color:C.muted,fontWeight:1000,marginTop:8}}>{label.toUpperCase()}</div><div style={{fontWeight:1000,marginTop:4}}>{value}</div></div>}
function Mini({label,value}:{label:string;value:string}){return <div style={{padding:9,borderRadius:10,background:'#07111D',border:`1px solid ${C.line}`}}><div style={{fontSize:8,color:C.muted,fontWeight:1000}}>{label.toUpperCase()}</div><div style={{fontSize:11,fontWeight:900,marginTop:4,lineHeight:1.3}}>{value}</div></div>}
function Score({icon:Icon,label,value,tone=C.mint}:{icon:any;label:string;value:number;tone?:string}){return <div style={{display:'grid',gridTemplateColumns:'24px 1fr 38px',alignItems:'center',gap:8,margin:'8px 0'}}><Icon size={15} color={C.cyan}/><div><div style={{fontSize:10,fontWeight:850}}>{label}</div><div style={{height:5,background:'#12263A',borderRadius:99,marginTop:4,overflow:'hidden'}}><div style={{width:pct(value),height:'100%',background:tone}}/></div></div><strong style={{fontSize:11,textAlign:'right'}}>{value}</strong></div>}
