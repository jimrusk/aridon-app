'use client';
import { useEffect, useMemo, useState } from 'react';
import { Activity, BatteryCharging, CheckCircle2, Cpu, Gauge, Network, ShieldCheck, Zap } from 'lucide-react';

type Tab='command'|'efficiency'|'capacity'|'cyber'|'resilience'|'pilot';
const utility=process.env.NEXT_PUBLIC_UTILITY_NAME || 'Southwest Utility Demo';
const region=process.env.NEXT_PUBLIC_REGION || 'Southwest USA';

const metrics=[
 ['System Load','684.2','MW','84% of available capacity'],
 ['Available Capacity','811','MW','126.8 MW headroom'],
 ['Renewable Output','238.6','MW','34.9% of current load'],
 ['Battery Dispatch','44.0','MW','Peak shaving window'],
 ['Distribution Losses','4.8','%','Target <4.0%'],
 ['Reserve Margin','18.5','%','Normal operating range'],
 ['Frequency','60.01','Hz','Stable'],
 ['Cyber Risk','27','/100','3 demo findings']
];

export default function Home(){
 const [tab,setTab]=useState<Tab>('command'); const [deferred,setDeferred]=useState<any>(null);
 useEffect(()=>{const h=(e:any)=>{e.preventDefault();setDeferred(e)};window.addEventListener('beforeinstallprompt',h);return()=>window.removeEventListener('beforeinstallprompt',h)},[]);
 const content=useMemo(()=>({
 command:[['Grid Brain','Unified visibility across SCADA, AMI, DER, weather and asset data.'],['Operator Queue','Recommendations stay read-only until an authorized human approves action.'],['System Forecast','5-minute through 7-day demand and reserve forecasting workspace.']],
 efficiency:[['Volt/VAR Optimization','Identify feeder voltage and reactive-power opportunities.'],['Loss Reduction','Rank circuits by technical loss, imbalance and abnormal load.'],['Predictive Maintenance','Combine inspection, thermal and operating history to rank asset risk.']],
 capacity:[['Dynamic Line Rating','Estimate weather-aware carrying capability where instrumentation supports it.'],['Reconductoring Planner','Rank circuits for advanced conductor upgrades before new corridors.'],['Topology Optimization','Surface switching and congestion options for engineering review.']],
 cyber:[['Sentinel OT Defense','Passive asset discovery, anomaly detection and IT/OT correlation.'],['Vendor Access Control','Time-limited remote access with identity, logging and approval.'],['Evidence Package','Assemble timestamps, affected assets and indicators for incident response.']],
 resilience:[['Critical Load Map','Prioritize hospitals, water systems, communications and emergency services.'],['Storage & Microgrids','Plan batteries, islanding and emergency support scenarios.'],['Degraded Mode','Maintain manual operating procedures if AI or cloud services are unavailable.']],
 pilot:[['Days 1-30','Read-only discovery, inventory, baseline and data validation.'],['Days 31-60','Forecasts, cyber findings and optimization recommendations.'],['Days 61-90','One utility-approved controlled use case with measured before/after results.']]
 })[tab],[tab]);
 async function install(){if(!deferred)return;deferred.prompt();await deferred.userChoice;setDeferred(null)}
 return <main className="shell">
   <div className="topbar"><div><div className="brand">ARIDON GRIDOS</div><div className="muted">Dedicated Utility Edition</div></div><div className="badge">{utility} · {region}</div></div>
   <section className="hero">
    <div className="panel"><div className="eyebrow">UTILITY INTELLIGENCE · ENERGY OPTIMIZATION · SENTINEL SECURITY</div><h1>Your grid.<br/>Your software.</h1><p className="lead">A dedicated, installable GridOS environment for {utility}. It is separated from Aridon's general business application and designed so each utility can operate its own branded deployment, data boundary and approval policy.</p><div style={{display:'flex',gap:10,flexWrap:'wrap',marginTop:18}}><button className="button" onClick={install}><Zap size={17}/>Install this app</button><a className="button secondary" href="#command">Open command center</a></div><p className="note">Control actions are disabled by default. GridOS begins read-only and does not replace protective relays, SCADA safety logic or operator authority.</p></div>
    <div className="panel installBox"><div><div className="status ok"><CheckCircle2 size={16}/>DEDICATED DEPLOYMENT READY</div><h2>Built to be utility-owned.</h2><p className="muted">Each customer can receive its own URL, installable PWA, branding, tenant ID, connector credentials and optional dedicated database.</p></div><div className="card"><b>Recommended production mode</b><p className="muted">One utility = one deployment + one data boundary. No customer can see another utility's data.</p></div></div>
   </section>
   <section id="command" className="grid">{metrics.map(([l,v,u,d])=><div className="metric" key={l}><span className="muted">{l}</span><strong>{v} <small style={{fontSize:14,color:'#8297ac'}}>{u}</small></strong><span className="muted">{d}</span></div>)}</section>
   <div className="tabs">{(['command','efficiency','capacity','cyber','resilience','pilot'] as Tab[]).map(t=><button key={t} className={`tab ${tab===t?'active':''}`} onClick={()=>setTab(t)}>{t[0].toUpperCase()+t.slice(1)}</button>)}</div>
   <section className="sectionGrid">{content.map(([title,text],i)=><div className="card" key={title}><div className="status ok">{[<Activity key="a" size={16}/>,<Gauge key="g" size={16}/>,<ShieldCheck key="s" size={16}/>][i%3]}{tab.toUpperCase()}</div><h3>{title}</h3><p className="muted">{text}</p></div>)}</section>
   <div className="panel" style={{marginTop:16}}><div className="sectionGrid"><div><div className="status ok"><Network size={16}/>INTEGRATIONS</div><h3>SCADA · AMI · GIS · DERMS · SIEM</h3><p className="muted">Connectors are provisioned per utility and remain read-only until approved.</p></div><div><div className="status ok"><Cpu size={16}/>AI BOUNDARY</div><h3>Recommend, forecast, correlate</h3><p className="muted">AI does not become the protection system. High-impact changes require engineered rules and operator approval.</p></div><div><div className="status ok"><BatteryCharging size={16}/>ENERGY</div><h3>Produce more value from existing assets</h3><p className="muted">Efficiency, storage dispatch, grid-enhancing technologies and resource planning sit in one operating picture.</p></div></div></div>
   <footer className="footer">Aridon GridOS Utility Edition · Dedicated installable application · Demo data shown until utility integrations are authorized.</footer>
 </main>
}
