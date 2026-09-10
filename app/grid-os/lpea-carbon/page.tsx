'use client';

import Link from 'next/link';
import { useState, type CSSProperties } from 'react';
import { Activity, AlertTriangle, BatteryCharging, Factory, Gauge, Leaf, Network, Radio, Sun, Truck, Zap } from 'lucide-react';

type View = 'system' | 'losses' | 'carbon' | 'actions';

const monitors = [
  ['Purchased / market power','Hourly MWh + verified emissions factor','Track supplier and SPP portfolio carbon intensity.'],
  ['Renewable supply','32% annual public baseline','Track solar, hydro, wind and other renewable contribution.'],
  ['Distribution losses','AMI + SCADA','Compare feeder/substation input with metered delivery.'],
  ['Peak demand','Hourly','Flag high-cost or high-carbon peaks for review.'],
  ['Fleet + generators','Fuel + runtime','Track diesel/gasoline use, idle hours and standby generation.'],
  ['Facilities','Metered energy','Track offices, shops, HVAC and support-building loads.'],
  ['Member loads','AMI segments','Find irrigation, motor, HVAC and commercial efficiency opportunities.'],
  ['Storage + DER','State + dispatch','Measure charging source, avoided peaks and reliability value.'],
];

const actions = [
  ['Feeder loss reduction study','Avoided MWh → avoided CO₂e','Energy + capacity savings','High'],
  ['Peak carbon / price dispatch','Hourly marginal emissions','Demand + market savings','High'],
  ['Transformer efficiency queue','No-load + load losses','Energy + maintenance','Medium'],
  ['Fleet idle / route optimization','Direct fuel CO₂e','Fuel + labor','Medium'],
];

export default function LPEACarbonPage(){
  const [view,setView]=useState<View>('system');
  return <main style={s.main}>
    <header style={s.header}><div style={s.wrapRow}><Link href="/grid-os" style={s.brand}>ARIDON GridOS</Link><span style={s.product}><Leaf size={17}/> LPEA Carbon + Efficiency Monitor</span><span style={s.demo}>DEMO / READ-ONLY</span></div></header>

    <section style={s.hero}><div style={s.wrap}>
      <div style={s.eyebrow}>LA PLATA ELECTRIC ASSOCIATION · COLORADO</div>
      <h1 style={s.h1}>See where every avoidable ton starts.</h1>
      <p style={s.lead}>A cooperative-specific monitoring layer for power-supply carbon, grid losses, peak demand, assets, fleet, facilities, storage and member loads. Carbon, cost and reliability stay on the same screen.</p>
      <div style={s.metrics}>
        <Metric label="Renewable supply" value="32%" note="Public LPEA June 2026 annual baseline"/>
        <Metric label="CO₂ reduction" value="59%" note="Public LPEA statement vs. 2005"/>
        <Metric label="2030 goal" value=">80%" note="Strategic reduction vs. 2005"/>
        <Metric label="2028 expectation" value="85%" note="With planned wind delivery, per LPEA"/>
      </div>
      <p style={s.note}>Public figures are context, not live telemetry. Live values require authorized LPEA data feeds. This screen does not control breakers, relays, DER, generation or market transactions.</p>
    </div></section>

    <nav style={s.nav}><div style={s.navInner}>{(['system','losses','carbon','actions'] as View[]).map(v=><button key={v} onClick={()=>setView(v)} style={{...s.tab,...(view===v?s.tabOn:{})}}>{v==='system'?'System':v==='losses'?'Loss detective':v==='carbon'?'Carbon sources':'Action queue'}</button>)}</div></nav>

    <section style={s.wrap}>
      {view==='system' && <>
        <Title k="MONITORING LAYER" t="Generation → market → wires → assets → members"/>
        <div style={s.grid}>{monitors.map(([a,b,c])=><Card key={a} title={a} value={b} text={c}/>)}</div>
        <Title k="ALERT RULES" t="Surface only what deserves attention"/>
        <Panel>
          <Alert t="Carbon intensity above target band" d="Compare market purchases, local generation, storage and flexible load before recommending action."/>
          <Alert t="Feeder loss variance" d="Flag when weather- and load-adjusted loss departs materially from baseline."/>
          <Alert t="Peak + high-emission supply" d="Surface storage and demand-response options without auto-dispatch."/>
          <Alert t="Fleet fuel anomaly" d="Compare fuel use, route miles, work orders and generator runtime."/>
        </Panel>
      </>}

      {view==='losses' && <>
        <Title k="LOSS DETECTIVE" t="Find wasted electricity before buying more electricity"/>
        <div style={s.grid}>
          <Feature icon={<Network/>} t="Feeder balance" d="Compare feeder input against AMI interval load with time alignment and known technical adjustments."/>
          <Feature icon={<Gauge/>} t="Transformer loss model" d="Estimate no-load and load-dependent losses by class, age, loading and temperature."/>
          <Feature icon={<Activity/>} t="Voltage + phase efficiency" d="Identify imbalance, voltage excursions and reactive-power conditions for engineering review."/>
        </div>
        <Formula>avoided MWh × verified emissions factor = avoided operational CO₂e</Formula>
      </>}

      {view==='carbon' && <>
        <Title k="CARBON ACCOUNTING" t="Separate direct emissions from purchased-power emissions"/>
        <Panel>
          <Row l="Purchased / generated electricity" r="MWh × verified factor"/>
          <Row l="Fleet + standby generators" r="Fuel × factor"/>
          <Row l="Facilities" r="Metered energy + fuel"/>
          <Row l="Avoided grid losses" r="Avoided MWh × relevant factor"/>
          <Row l="Construction / equipment" r="Separate lifecycle record"/>
        </Panel>
      </>}

      {view==='actions' && <>
        <Title k="PRIORITY ENGINE" t="Rank reductions by carbon, savings and reliability"/>
        <div style={s.grid}>{actions.map(([a,b,c,d])=><Card key={a} title={a} value={d} text={`${b} · ${c}`}/>)}</div>
        <Formula>CO₂e avoided + utility/member savings + reliability benefit + funding eligibility − implementation risk</Formula>
      </>}

      <Title k="LIVE DATA CONNECTIONS" t="What LPEA would connect first"/>
      <div style={s.grid}>
        <Feature icon={<Radio/>} t="SCADA / EMS" d="Substation, feeder, generation and operating measurements."/>
        <Feature icon={<Zap/>} t="AMI" d="Interval usage, voltage and member-load segmentation."/>
        <Feature icon={<Factory/>} t="SPP / supplier data" d="Market purchases, prices, generation mix and verified carbon factors."/>
        <Feature icon={<Network/>} t="GIS + asset registry" d="Feeder, transformer, line and equipment context."/>
        <Feature icon={<Truck/>} t="Fleet / fuel" d="Vehicle and generator fuel, miles, hours and idle time."/>
        <Feature icon={<Sun/>} t="Weather + DER" d="Load normalization, renewable output, storage state and approved dispatch records."/>
        <Feature icon={<BatteryCharging/>} t="Storage" d="State-of-charge, charge source, peak avoidance and reserve value."/>
      </div>
    </section>
  </main>
}

function Metric({label,value,note}:{label:string;value:string;note:string}){return <div style={s.metric}><span>{label}</span><strong>{value}</strong><small>{note}</small></div>}
function Title({k,t}:{k:string;t:string}){return <div style={s.title}><div style={s.eyebrow}>{k}</div><h2>{t}</h2></div>}
function Card({title,value,text}:{title:string;value:string;text:string}){return <div style={s.card}><div style={s.cardTop}><strong>{title}</strong><span style={s.badge}>{value}</span></div><p>{text}</p></div>}
function Feature({icon,t,d}:{icon:any;t:string;d:string}){return <div style={s.card}><div style={s.icon}>{icon}</div><strong>{t}</strong><p>{d}</p></div>}
function Panel({children}:{children:any}){return <div style={s.panel}>{children}</div>}
function Alert({t,d}:{t:string;d:string}){return <div style={s.alert}><AlertTriangle size={16}/><div><strong>{t}</strong><p>{d}</p></div></div>}
function Row({l,r}:{l:string;r:string}){return <div style={s.row}><span>{l}</span><strong>{r}</strong></div>}
function Formula({children}:{children:any}){return <div style={s.formula}>{children}</div>}

const s:Record<string,CSSProperties>={
  main:{minHeight:'100vh',background:'#07110d',color:'#edf8f0',fontFamily:'Inter,system-ui,sans-serif'},
  header:{borderBottom:'1px solid #1f3a2b',background:'#09170f',position:'sticky',top:0,zIndex:10},
  wrap:{maxWidth:1160,margin:'0 auto',padding:'36px 20px'},
  wrapRow:{maxWidth:1160,margin:'0 auto',padding:'14px 20px',display:'flex',gap:14,alignItems:'center',flexWrap:'wrap'},
  brand:{color:'#eaffef',fontWeight:900,textDecoration:'none',letterSpacing:'.06em'},
  product:{display:'flex',alignItems:'center',gap:7,color:'#9ce6b5',fontWeight:800},
  demo:{marginLeft:'auto',fontSize:11,border:'1px solid #365944',borderRadius:999,padding:'6px 9px',color:'#c6d9cc'},
  hero:{background:'radial-gradient(circle at 75% 20%,#17442b 0,transparent 35%),linear-gradient(180deg,#0b1d13,#07110d)'},
  eyebrow:{fontSize:12,fontWeight:900,letterSpacing:'.12em',color:'#78df9d'},
  h1:{fontSize:'clamp(40px,7vw,72px)',lineHeight:1,letterSpacing:'-.04em',maxWidth:900,margin:'12px 0 16px'},
  lead:{fontSize:19,lineHeight:1.65,maxWidth:930,color:'#c4d6ca'},
  note:{fontSize:12,lineHeight:1.6,color:'#91a497',maxWidth:950},
  metrics:{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(190px,1fr))',gap:12,margin:'26px 0 14px'},
  metric:{background:'#0d1d14',border:'1px solid #244532',borderRadius:16,padding:16,display:'grid',gap:6},
  nav:{borderTop:'1px solid #1f3a2b',borderBottom:'1px solid #1f3a2b',background:'#08140d'},
  navInner:{maxWidth:1160,margin:'0 auto',padding:'0 20px',display:'flex',overflowX:'auto'},
  tab:{background:'transparent',border:0,color:'#9fb2a5',fontWeight:800,padding:'14px 13px',cursor:'pointer',whiteSpace:'nowrap'},
  tabOn:{color:'#e3ffeb',borderBottom:'2px solid #6ddd95'},
  title:{margin:'26px 0 14px'},
  grid:{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(240px,1fr))',gap:13},
  card:{background:'#0d1b13',border:'1px solid #213c2c',borderRadius:16,padding:17},
  cardTop:{display:'flex',gap:10,justifyContent:'space-between',alignItems:'center',flexWrap:'wrap'},
  badge:{border:'1px solid #365d46',background:'#11281a',color:'#c6f0d3',borderRadius:999,padding:'4px 8px',fontSize:12},
  icon:{width:38,height:38,borderRadius:11,display:'grid',placeItems:'center',background:'#143322',color:'#75de99',marginBottom:11},
  panel:{background:'#0d1b13',border:'1px solid #213c2c',borderRadius:16,padding:18},
  alert:{display:'grid',gridTemplateColumns:'22px 1fr',gap:9,padding:'12px 0',borderBottom:'1px solid #1b3125'},
  row:{display:'flex',justifyContent:'space-between',gap:14,flexWrap:'wrap',padding:'12px 0',borderBottom:'1px solid #1b3125'},
  formula:{margin:'16px 0',padding:14,border:'1px solid #2a5039',background:'#08140d',borderRadius:12,fontFamily:'ui-monospace,monospace',color:'#c9ffda'}
};
