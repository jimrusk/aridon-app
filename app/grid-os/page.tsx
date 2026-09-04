'use client';

import Link from 'next/link';
import { useMemo, useState, type CSSProperties, type ReactNode } from 'react';
import {
  Activity,
  AlertTriangle,
  BatteryCharging,
  CheckCircle2,
  ChevronRight,
  CircleDot,
  Cpu,
  Gauge,
  Network,
  Radio,
  ShieldCheck,
  ThermometerSun,
  Wrench,
} from 'lucide-react';

type Tab = 'command' | 'efficiency' | 'capacity' | 'cyber' | 'resilience' | 'pilot';

type Recommendation = {
  title: string;
  category: string;
  impact: string;
  value: string;
  priority: 'Critical' | 'High' | 'Medium';
};

const metrics = [
  { label: 'System load', value: '684.2', unit: 'MW', detail: '84% of available capacity' },
  { label: 'Available capacity', value: '811', unit: 'MW', detail: '126.8 MW headroom' },
  { label: 'Renewable output', value: '238.6', unit: 'MW', detail: '34.9% of current load' },
  { label: 'Battery dispatch', value: '44.0', unit: 'MW', detail: 'Peak-shaving window' },
  { label: 'Distribution losses', value: '4.8', unit: '%', detail: 'Optimization target: <4.0%' },
  { label: 'Reserve margin', value: '18.5', unit: '%', detail: 'Normal operating range' },
  { label: 'Frequency', value: '60.01', unit: 'Hz', detail: 'Stable' },
  { label: 'Cyber risk', value: '27', unit: '/100', detail: '3 open demo findings' },
];

const recommendations: Recommendation[] = [
  { title: 'OT segmentation + remote-access hardening', category: 'Sentinel', impact: 'Reduce pathways between business IT and operational technology while keeping operator control intact.', value: '$350k modeled annual risk value', priority: 'Critical' },
  { title: 'Volt/VAR optimization pilot', category: 'Efficiency', impact: 'Test feeder voltage and reactive-power tuning inside utility operating limits before controlled automation.', value: '$420k modeled annual value', priority: 'High' },
  { title: 'Dynamic line rating study', category: 'Capacity', impact: 'Measure weather and conductor conditions on constrained lines to uncover real-time transfer headroom.', value: '$650k modeled annual value', priority: 'High' },
  { title: 'Battery peak-shaving dispatch', category: 'Resilience', impact: 'Coordinate storage around forecast peaks while preserving contingency and critical-load reserve.', value: '$510k modeled annual value', priority: 'Medium' },
];

const cyberFindings = [
  ['High', 'Unexpected vendor remote-access window', 'Restrict session, preserve evidence, require operator review.'],
  ['Medium', 'Engineering workstation baseline drift', 'Compare with last approved configuration before any field action.'],
  ['Low', 'Previously unseen OT device', 'Passive discovery only. Confirm ownership and expected communications.'],
];

const integrations = [
  ['SCADA', 'Read-only first', 'Operational measurements and status'],
  ['AMI', 'Read-only first', 'Meter load and voltage intelligence'],
  ['GIS / ArcGIS', 'Ready to connect', 'Asset and network context'],
  ['Weather', 'Ready to connect', 'Load forecasting + line-rating inputs'],
  ['DER / Storage', 'Approval gated', 'Solar, battery and flexible-load coordination'],
  ['SIEM / Security', 'Read-only first', 'Cyber event correlation with grid behavior'],
];

const tabs: Array<[Tab, string]> = [
  ['command', 'Command Center'],
  ['efficiency', 'Efficiency'],
  ['capacity', 'Grid Capacity'],
  ['cyber', 'Sentinel Security'],
  ['resilience', 'Resilience'],
  ['pilot', '90-Day Pilot'],
];

export default function GridOSPage() {
  const [tab, setTab] = useState<Tab>('command');
  const [mode, setMode] = useState<'read-only' | 'advisory'>('read-only');
  const [pilot, setPilot] = useState<'not-started' | 'planned'>('not-started');
  const [ack, setAck] = useState<string | null>(null);

  const activeRecommendations = useMemo(() => recommendations.filter(r => tab === 'command' || r.category.toLowerCase().includes(tab === 'cyber' ? 'sentinel' : tab)), [tab]);

  return (
    <main style={s.main}>
      <header style={s.header}>
        <div style={s.headerInner}>
          <div style={{display:'flex',alignItems:'center',gap:14,flexWrap:'wrap'}}>
            <Link href="/" style={s.brand}>ARIDON</Link>
            <span style={s.product}><Activity size={17}/> GridOS</span>
          </div>
          <div style={{display:'flex',gap:9,alignItems:'center',flexWrap:'wrap',justifyContent:'flex-end'}}>
            <span style={s.demo}><CircleDot size={13}/> DEMONSTRATION DATA</span>
            <Link href="/grid-intelligence" style={s.smallLink}>Drone Grid Intelligence</Link>
          </div>
        </div>
      </header>

      <section style={s.hero}>
        <div style={{maxWidth:1120,margin:'0 auto'}}>
          <div style={s.eyebrow}>UTILITY INTELLIGENCE · EFFICIENCY · SECURITY · RESILIENCE</div>
          <h1 style={s.h1}>Make the grid smarter before making it bigger.</h1>
          <p style={s.lead}>Aridon GridOS gives electric utilities one operating layer for load intelligence, efficiency, hidden-capacity discovery, generation planning, asset health and Sentinel OT security. High-impact control remains approval-gated.</p>
          <div style={s.heroActions}>
            <button style={s.primaryButton} onClick={() => setPilot('planned')}>{pilot === 'planned' ? '90-day pilot planned ✓' : 'Plan a 90-day utility pilot'} <ChevronRight size={17}/></button>
            <button style={s.secondaryButton} onClick={() => setMode(mode === 'read-only' ? 'advisory' : 'read-only')}>Mode: {mode === 'read-only' ? 'Read-only' : 'Advisory'}</button>
          </div>
          <p style={s.disclaimer}>This launch screen is a working GridOS product shell using labeled demonstration metrics. It does not issue breaker, relay, DER, generation or field-control commands. Live utility integrations begin read-only and consequential actions require authorized human approval.</p>
        </div>
      </section>

      <nav style={s.tabs} aria-label="GridOS modules">
        <div style={s.tabInner}>{tabs.map(([key,label]) => <button key={key} onClick={() => {setTab(key);setAck(null)}} style={{...s.tabButton,...(tab===key?s.tabActive:{})}}>{label}</button>)}</div>
      </nav>

      <section style={s.section}>
        {tab === 'command' && <CommandCenter ack={ack} setAck={setAck}/>} 
        {tab === 'efficiency' && <Efficiency/>}
        {tab === 'capacity' && <Capacity/>}
        {tab === 'cyber' && <Cyber ack={ack} setAck={setAck}/>} 
        {tab === 'resilience' && <Resilience/>}
        {tab === 'pilot' && <Pilot planned={pilot === 'planned'} setPlanned={() => setPilot('planned')}/>} 

        {(tab === 'command' || activeRecommendations.length > 0) && tab !== 'pilot' && (
          <div style={{marginTop:28}}>
            <SectionTitle eyebrow="PRIORITIZED ACTIONS" title="What GridOS would work next" text="Every recommendation stays separated from automatic control. The utility can accept, reject or send an item for engineering review."/>
            <div style={s.recGrid}>{(tab === 'command' ? recommendations : activeRecommendations).map((r) => <RecommendationCard key={r.title} r={r}/>)}</div>
          </div>
        )}
      </section>
    </main>
  );
}

function CommandCenter({ack,setAck}:{ack:string|null;setAck:(x:string)=>void}) {
  return <>
    <SectionTitle eyebrow="SYSTEM PICTURE" title="One screen for electrons and cyber signals" text="GridOS correlates operational, market, weather, asset and security data so teams can see whether a problem is electrical, physical, cyber or several things at once."/>
    <div style={s.metricGrid}>{metrics.map((m) => <Metric key={m.label} {...m}/>)}</div>
    <div style={s.twoCol}>
      <Panel title="Forecasted evening peak" icon={<ThermometerSun size={19}/> }>
        <div style={s.bigNumber}>742 <span style={s.unit}>MW</span></div>
        <p style={s.muted}>Demo peak forecast at 17:40. GridOS would compare demand response, battery dispatch, generation cost and network constraints before recommending a plan.</p>
        <Bar value={91}/>
        <div style={s.row}><span>Current load</span><strong>684.2 MW</strong></div>
        <div style={s.row}><span>Forecast peak</span><strong>742 MW</strong></div>
        <div style={s.row}><span>Modeled flexible load</span><strong>38 MW</strong></div>
      </Panel>
      <Panel title="Sentinel correlation" icon={<ShieldCheck size={19}/> }>
        <p style={s.muted}>The security layer watches for cyber events that coincide with unusual grid behavior. It does not “hack back” or autonomously switch critical equipment.</p>
        <Alert severity="High" title="Vendor access + transformer load anomaly" detail="Demo correlation only. Preserve evidence, restrict the session and require operator review."/>
        <button style={s.smallButton} onClick={() => setAck('Evidence package queued for authorized review.')}>Create evidence package</button>
        {ack && <p style={s.success}><CheckCircle2 size={15}/>{ack}</p>}
      </Panel>
    </div>
    <div style={s.twoCol}>
      <Panel title="Generation + flexibility mix" icon={<BatteryCharging size={19}/> }>
        <Stack rows={[["Solar","238.6 MW"],["Firm generation","401.6 MW"],["Battery discharge","44.0 MW"],["Demand flexibility","Modeled 38 MW"]]}/>
      </Panel>
      <Panel title="Operator guardrails" icon={<Gauge size={19}/> }>
        <Stack rows={[["Protection relays","Never replaced by AI"],["High-impact switching","Human approval required"],["Pilot integrations","Read-only first"],["Emergency mode","Manual / degraded operation supported"]]}/>
      </Panel>
    </div>
  </>
}

function Efficiency(){return <>
  <SectionTitle eyebrow="USE LESS TO DELIVER MORE" title="Turn waste reduction into virtual generation" text="GridOS searches feeders and substations for avoidable losses, voltage inefficiency, reactive-power problems, phase imbalance and poor peak timing."/>
  <div style={s.threeCol}>
    <Feature icon={<Gauge/>} title="Volt/VAR intelligence" text="Rank feeders for VVO/CVR study and model savings before a utility changes control settings."/>
    <Feature icon={<Activity/>} title="Loss analytics" text="Compare feeder input, AMI load and asset behavior to identify technical and nontechnical loss candidates."/>
    <Feature icon={<Cpu/>} title="Predictive maintenance" text="Combine thermal, loading, inspection and work-order history to prioritize equipment before failure."/>
  </div>
  <Panel title="Demo efficiency scoreboard" icon={<Activity size={19}/> }>
    <div style={s.metricGrid}><Metric label="Current losses" value="4.8" unit="%" detail="Demo baseline"/><Metric label="Target study range" value="3.8–4.2" unit="%" detail="Not a guaranteed result"/><Metric label="Peak flexibility" value="38" unit="MW" detail="Modeled controllable demand"/><Metric label="Priority feeders" value="7" unit="" detail="For engineering review"/></div>
  </Panel>
</>}

function Capacity(){return <>
  <SectionTitle eyebrow="FIND THE MEGAWATTS ALREADY HIDING IN THE NETWORK" title="Capacity before concrete" text="Before recommending a new line or substation, GridOS ranks lower-cost options such as dynamic line rating, topology optimization, power-flow control, reconductoring and targeted equipment upgrades."/>
  <div style={s.threeCol}>
    <Feature icon={<Radio/>} title="Dynamic line rating" text="Combine conductor limits with local weather and monitoring to estimate real-time safe transfer capability."/>
    <Feature icon={<Network/>} title="Topology optimizer" text="Model alternate network configurations and congestion relief without allowing AI to bypass protection constraints."/>
    <Feature icon={<Wrench/>} title="Reconductoring planner" text="Rank circuits where higher-capacity conductors could defer a new corridor or major rebuild."/>
  </div>
  <Panel title="Capacity opportunity queue" icon={<Network size={19}/> }>
    <Stack rows={[["North 115-kV corridor","DLR engineering study"],["Mesa feeder group","Phase balance + voltage study"],["West tie","Topology / flow study"],["River substation","Transformer upgrade economics"]]}/>
  </Panel>
</>}

function Cyber({ack,setAck}:{ack:string|null;setAck:(x:string)=>void}){return <>
  <SectionTitle eyebrow="SENTINEL UTILITY DEFENSE" title="Protect operational technology without turning security software into the operator" text="Sentinel is designed around passive discovery, segmentation, approved remote access, baseline monitoring, evidence preservation and staged containment."/>
  <div style={s.threeCol}>
    <Feature icon={<ShieldCheck/>} title="OT asset inventory" text="Continuously map authorized SCADA servers, HMIs, engineering stations, gateways, relays, RTUs and DER interfaces."/>
    <Feature icon={<Network/>} title="IT / OT boundary" text="Identify unnecessary pathways, vendor exposure and communications that fall outside the approved baseline."/>
    <Feature icon={<Radio/>} title="Evidence package" text="Preserve timelines, affected assets, account activity and indicators so authorized teams can escalate cleanly."/>
  </div>
  <Panel title="Open demonstration findings" icon={<AlertTriangle size={19}/> }>
    {cyberFindings.map(([severity,title,detail]) => <Alert key={title} severity={severity} title={title} detail={detail}/>) }
    <button style={s.smallButton} onClick={() => setAck('Three demo findings bundled for security review.')}>Prepare review package</button>
    {ack && <p style={s.success}><CheckCircle2 size={15}/>{ack}</p>}
  </Panel>
</>}

function Resilience(){return <>
  <SectionTitle eyebrow="SURVIVE THE BAD DAY" title="Coordinate storage, critical loads and degraded operation" text="GridOS helps utilities prepare a resilience sequence before heat, wildfire, equipment failure, fuel constraints or cyber incidents turn into an emergency."/>
  <div style={s.threeCol}>
    <Feature icon={<BatteryCharging/>} title="Storage dispatch" text="Reserve battery capacity for peak reduction, contingencies and critical-load support according to operator policy."/>
    <Feature icon={<Activity/>} title="Critical-load map" text="Prioritize hospitals, water systems, emergency services and designated facilities during constrained operation."/>
    <Feature icon={<ShieldCheck/>} title="Degraded-mode playbooks" text="Document safe manual operations if GridOS, communications or another digital system is unavailable."/>
  </div>
  <Panel title="Resilience readiness" icon={<CheckCircle2 size={19}/> }>
    <Stack rows={[["Critical load inventory","Pilot requirement"],["Black-start / restoration plan","Import existing utility plan"],["Battery reserve policy","Configure with operator"],["Cyber manual override","Required before live control"]]}/>
  </Panel>
</>}

function Pilot({planned,setPlanned}:{planned:boolean;setPlanned:()=>void}){return <>
  <SectionTitle eyebrow="90-DAY DEPLOYMENT" title="Start read-only. Prove value. Automate only what earns trust." text="The pilot is built to produce measurable before-and-after evidence without asking a utility to hand critical control to an unproven system."/>
  <div style={s.pilotGrid}>
    <Phase n="01" title="Days 1–30 · Baseline" bullets={['Connect approved historical and live feeds read-only','Build asset + integration inventory','Establish load, loss, outage, cyber and cost baselines','Select one feeder or substation study area']}/>
    <Phase n="02" title="Days 31–60 · Recommend" bullets={['Load and peak forecasting','Efficiency and capacity opportunity ranking','Sentinel OT findings and evidence workflow','Engineering review of recommended actions']}/>
    <Phase n="03" title="Days 61–90 · Controlled pilot" bullets={['Utility selects one approved use case','Human approval stays in the loop','Measure reliability, cost, energy and security results','Build rollout business case from measured results']}/>
  </div>
  <div style={s.twoCol}>
    <Panel title="Pilot scorecard" icon={<Gauge size={19}/> }><Stack rows={[["Peak MW","Before / after"],["Distribution losses","Before / after"],["Avoided or deferred capex","Engineering estimate"],["Outage / asset risk","Measured findings"],["Cyber exposure","Closed vs open findings"],["Operator time","Workflow reduction"]]}/></Panel>
    <Panel title="Integration checklist" icon={<Network size={19}/> }>{integrations.map(([name,status,detail]) => <div key={name} style={s.integration}><div><strong>{name}</strong><div style={s.mutedSmall}>{detail}</div></div><span style={s.status}>{status}</span></div>)}</Panel>
  </div>
  <button style={s.primaryButton} onClick={setPlanned}>{planned ? 'Pilot framework marked ready ✓' : 'Mark pilot framework ready'} <ChevronRight size={17}/></button>
</>}

function SectionTitle({eyebrow,title,text}:{eyebrow:string;title:string;text:string}){return <div style={{maxWidth:920,marginBottom:22}}><div style={s.eyebrow}>{eyebrow}</div><h2 style={s.h2}>{title}</h2><p style={s.copy}>{text}</p></div>}

function Metric({label,value,unit,detail}:{label:string;value:string;unit:string;detail:string}){return <article style={s.metric}><div style={s.metricLabel}>{label}</div><div style={s.metricValue}>{value} <span style={s.metricUnit}>{unit}</span></div><div style={s.metricDetail}>{detail}</div></article>}

function Panel({title,icon,children}:{title:string;icon:ReactNode;children:ReactNode}){return <article style={s.panel}><div style={s.panelTitle}>{icon}<strong>{title}</strong></div>{children}</article>}

function Feature({icon,title,text}:{icon:ReactNode;title:string;text:string}){return <article style={s.feature}><div style={s.icon}>{icon}</div><h3 style={{fontSize:18,margin:'12px 0 8px'}}>{title}</h3><p style={s.muted}>{text}</p></article>}

function RecommendationCard({r}:{r:Recommendation}){const critical=r.priority==='Critical';return <article style={{...s.rec,borderColor:critical?'#8F3340':'#2B3B59'}}><div style={{display:'flex',justifyContent:'space-between',gap:12,alignItems:'center'}}><span style={s.kicker}>{r.category}</span><span style={{...s.priority,background:critical?'#5F1F28':'#21324A'}}>{r.priority}</span></div><h3 style={{fontSize:19,margin:'12px 0 8px'}}>{r.title}</h3><p style={s.muted}>{r.impact}</p><div style={s.value}>{r.value}</div><div style={s.approval}>HUMAN APPROVAL REQUIRED</div></article>}

function Alert({severity,title,detail}:{severity:string;title:string;detail:string}){return <div style={s.alert}><AlertTriangle size={17}/><div style={{flex:1}}><div style={{display:'flex',gap:8,flexWrap:'wrap',alignItems:'center'}}><strong>{title}</strong><span style={s.status}>{severity}</span></div><div style={s.mutedSmall}>{detail}</div></div></div>}

function Stack({rows}:{rows:string[][]}){return <div>{rows.map(([a,b]) => <div key={a} style={s.row}><span>{a}</span><strong style={{textAlign:'right'}}>{b}</strong></div>)}</div>}

function Bar({value}:{value:number}){return <div style={s.bar}><div style={{...s.barFill,width:`${Math.min(value,100)}%`}}/></div>}

function Phase({n,title,bullets}:{n:string;title:string;bullets:string[]}){return <article style={s.phase}><div style={s.phaseN}>{n}</div><h3>{title}</h3><ul style={{color:'#B7C4D8',lineHeight:1.75,paddingLeft:20}}>{bullets.map(b=><li key={b}>{b}</li>)}</ul></article>}

const s:Record<string,CSSProperties> = {
  main:{minHeight:'100vh',background:'#06101C',color:'#F7FAFC',fontFamily:'Arial,sans-serif'},
  header:{borderBottom:'1px solid #1E2D44',background:'#07111F',position:'sticky',top:0,zIndex:20},
  headerInner:{maxWidth:1200,margin:'0 auto',padding:'14px 20px',display:'flex',justifyContent:'space-between',gap:16,alignItems:'center',flexWrap:'wrap'},
  brand:{color:'#9EF0CF',textDecoration:'none',fontWeight:950,letterSpacing:1},
  product:{display:'inline-flex',alignItems:'center',gap:7,fontWeight:900,color:'#E6EDF7'},
  demo:{display:'inline-flex',gap:6,alignItems:'center',fontSize:11,fontWeight:900,color:'#FFD98D',border:'1px solid #5D4A22',background:'#2C2513',padding:'7px 9px',borderRadius:999},
  smallLink:{color:'#B8C7D9',fontSize:12,fontWeight:850,textDecoration:'none',border:'1px solid #2A3B56',padding:'7px 9px',borderRadius:9},
  hero:{padding:'58px 20px 38px',background:'linear-gradient(180deg,#09192B 0%,#06101C 100%)'},
  eyebrow:{fontSize:11,fontWeight:950,letterSpacing:1.2,color:'#9EF0CF'},
  h1:{fontSize:'clamp(44px,7vw,78px)',lineHeight:.95,letterSpacing:-3,margin:'12px 0 20px',maxWidth:1000},
  h2:{fontSize:'clamp(30px,5vw,48px)',lineHeight:1.02,letterSpacing:-1.5,margin:'8px 0 12px'},
  lead:{fontSize:20,lineHeight:1.6,maxWidth:940,color:'#B8C6D9'},
  copy:{fontSize:17,lineHeight:1.65,color:'#B5C2D5',margin:0},
  heroActions:{display:'flex',gap:10,flexWrap:'wrap',marginTop:24},
  primaryButton:{display:'inline-flex',alignItems:'center',gap:7,border:0,borderRadius:11,padding:'13px 16px',fontWeight:950,cursor:'pointer',background:'#9EF0CF',color:'#06120E'},
  secondaryButton:{border:'1px solid #4B5C75',borderRadius:11,padding:'13px 16px',fontWeight:900,cursor:'pointer',background:'transparent',color:'#F7FAFC'},
  smallButton:{border:'1px solid #425572',borderRadius:10,padding:'10px 12px',fontWeight:900,cursor:'pointer',background:'#142238',color:'#F7FAFC',marginTop:10},
  disclaimer:{fontSize:12,lineHeight:1.55,color:'#8291A8',maxWidth:980,marginTop:14},
  tabs:{borderTop:'1px solid #15253C',borderBottom:'1px solid #21314A',background:'#0A1423',position:'sticky',top:57,zIndex:19,overflowX:'auto'},
  tabInner:{maxWidth:1200,margin:'0 auto',display:'flex',gap:4,padding:'9px 20px'},
  tabButton:{whiteSpace:'nowrap',border:0,borderRadius:9,padding:'9px 12px',fontWeight:850,cursor:'pointer',background:'transparent',color:'#9EAEC3'},
  tabActive:{background:'#1A2A42',color:'#F8FAFC'},
  section:{maxWidth:1200,margin:'0 auto',padding:'36px 20px 80px'},
  metricGrid:{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))',gap:10,marginBottom:18},
  metric:{background:'#0D192A',border:'1px solid #243550',borderRadius:14,padding:17},
  metricLabel:{fontSize:11,fontWeight:900,color:'#93A3B8',textTransform:'uppercase',letterSpacing:.5},
  metricValue:{fontSize:29,fontWeight:950,marginTop:7},
  metricUnit:{fontSize:13,color:'#9FB0C5'},
  metricDetail:{fontSize:12,color:'#8495AA',marginTop:5},
  twoCol:{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(320px,1fr))',gap:14,marginTop:14},
  threeCol:{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(250px,1fr))',gap:12,marginBottom:18},
  panel:{background:'#0C1727',border:'1px solid #263852',borderRadius:16,padding:19},
  panelTitle:{display:'flex',alignItems:'center',gap:8,color:'#EAF2FC',marginBottom:12},
  bigNumber:{fontSize:46,fontWeight:950},
  unit:{fontSize:15,color:'#9BABBF'},
  muted:{color:'#A9B7C9',lineHeight:1.6,fontSize:14},
  mutedSmall:{color:'#8E9EB3',lineHeight:1.5,fontSize:12,marginTop:4},
  row:{display:'flex',justifyContent:'space-between',gap:14,borderTop:'1px solid #1D2B41',padding:'11px 0',color:'#A9B7C9',fontSize:13},
  bar:{height:9,borderRadius:99,background:'#1B2A40',overflow:'hidden',margin:'14px 0'},
  barFill:{height:'100%',background:'#9EF0CF',borderRadius:99},
  alert:{display:'flex',gap:10,alignItems:'flex-start',padding:'12px 0',borderTop:'1px solid #20314A',color:'#F6D08B'},
  status:{fontSize:10,fontWeight:950,border:'1px solid #3C506D',background:'#17253A',padding:'4px 7px',borderRadius:999,color:'#C7D5E7'},
  success:{display:'flex',alignItems:'center',gap:7,color:'#9EF0CF',fontSize:12,fontWeight:850},
  feature:{background:'#0D192A',border:'1px solid #263852',borderRadius:15,padding:18},
  icon:{width:40,height:40,borderRadius:11,display:'grid',placeItems:'center',background:'#172B3D',color:'#9EF0CF'},
  recGrid:{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(250px,1fr))',gap:12},
  rec:{background:'#0D192A',border:'1px solid #2B3B59',borderRadius:15,padding:17},
  kicker:{fontSize:11,fontWeight:950,color:'#9EF0CF',textTransform:'uppercase'},
  priority:{fontSize:10,fontWeight:950,padding:'4px 7px',borderRadius:999,color:'#F7FAFC'},
  value:{fontSize:12,fontWeight:900,color:'#D7E3F3',marginTop:13},
  approval:{fontSize:9,fontWeight:950,letterSpacing:.6,color:'#F5C66C',marginTop:10},
  pilotGrid:{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(260px,1fr))',gap:12,marginBottom:16},
  phase:{background:'#0D192A',border:'1px solid #263852',borderRadius:16,padding:20},
  phaseN:{fontSize:28,fontWeight:950,color:'#9EF0CF'},
  integration:{display:'flex',justifyContent:'space-between',alignItems:'center',gap:12,padding:'11px 0',borderTop:'1px solid #20314A'},
};
