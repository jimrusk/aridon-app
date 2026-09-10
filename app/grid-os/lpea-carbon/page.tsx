'use client';

import Link from 'next/link';
import { useMemo, useState, type CSSProperties, type ReactNode } from 'react';
import {
  Activity,
  AlertTriangle,
  BatteryCharging,
  CheckCircle2,
  Factory,
  Gauge,
  Leaf,
  LineChart,
  Network,
  Radio,
  ShieldCheck,
  Sun,
  Truck,
  Zap,
} from 'lucide-react';

type Severity = 'High' | 'Medium' | 'Low';

type Source = {
  name: string;
  value: string;
  note: string;
  status: 'monitor' | 'good' | 'action';
  icon: ReactNode;
};

type Opportunity = {
  title: string;
  area: string;
  co2: string;
  savings: string;
  reliability: string;
  priority: Severity;
};

const sources: Source[] = [
  { name: 'Purchased / market power', value: 'Portfolio signal', note: 'Track hourly MWh by source and emissions factor from suppliers and SPP market data.', status: 'monitor', icon: <Factory size={19}/> },
  { name: 'Renewable supply', value: '32% annual', note: 'Public LPEA June 2026 baseline. Solar + hydro periods can serve a much larger share of load.', status: 'good', icon: <Sun size={19}/> },
  { name: 'Distribution losses', value: 'Connect AMI + SCADA', note: 'Compare substation/feeder input against billed or interval-meter load to find avoidable losses.', status: 'action', icon: <Network size={19}/> },
  { name: 'Peak demand', value: 'Watch hourly', note: 'Flag high-carbon or high-cost peak intervals where storage or demand response may help.', status: 'monitor', icon: <Gauge size={19}/> },
  { name: 'Fleet + generators', value: 'Fuel feed', note: 'Track diesel/gasoline use, generator runtime, idle hours and maintenance-related excess fuel.', status: 'monitor', icon: <Truck size={19}/> },
  { name: 'Facilities', value: 'Meter feed', note: 'Monitor offices, shops and support sites for HVAC, lighting and plug-load efficiency opportunities.', status: 'monitor', icon: <Activity size={19}/> },
  { name: 'Member loads', value: 'AMI segments', note: 'Find irrigation, motor, HVAC and commercial-load efficiency programs that lower system demand.', status: 'monitor', icon: <Zap size={19}/> },
  { name: 'Storage + DER', value: 'Dispatch signal', note: 'Calculate avoided peak MWh, charging emissions and reliability value instead of treating storage as automatically zero-carbon.', status: 'monitor', icon: <BatteryCharging size={19}/> },
];

const opportunities: Opportunity[] = [
  { title: 'Feeder loss reduction study', area: 'Distribution', co2: 'Calculate from avoided MWh', savings: 'Energy + capacity', reliability: 'Positive', priority: 'High' },
  { title: 'Peak carbon / price dispatch', area: 'Storage + demand', co2: 'Hourly marginal factor', savings: 'Demand + market', reliability: 'Policy gated', priority: 'High' },
  { title: 'Transformer efficiency queue', area: 'Assets', co2: 'No-load + load losses', savings: 'Energy + maintenance', reliability: 'Positive', priority: 'Medium' },
  { title: 'Fleet idle + route optimization', area: 'Operations', co2: 'Direct fuel CO₂e', savings: 'Fuel + hours', reliability: 'Neutral', priority: 'Medium' },
];

const alerts = [
  ['High', 'Carbon intensity above target band', 'If hourly portfolio emissions rise above the configured band, compare market purchases, local generation, storage state-of-charge and load flexibility before recommending action.'],
  ['Medium', 'Feeder loss variance', 'Flag a feeder when input-versus-metered-load loss materially departs from its weather- and load-adjusted baseline.'],
  ['Medium', 'Peak coincides with high-emission supply', 'Surface storage, demand response and member-program options. Do not auto-dispatch without approved utility controls.'],
  ['Low', 'Fleet fuel anomaly', 'Compare fuel use, work orders, route miles and generator runtime for explainable causes before escalation.'],
];

export default function LpeaCarbonMonitorPage() {
  const [view, setView] = useState<'system' | 'losses' | 'carbon' | 'actions'>('system');
  const [ack, setAck] = useState(false);

  const visibleSources = useMemo(() => {
    if (view === 'losses') return sources.filter(s => ['Distribution losses','Peak demand','Member loads'].includes(s.name));
    if (view === 'carbon') return sources.filter(s => ['Purchased / market power','Renewable supply','Fleet + generators','Facilities','Storage + DER'].includes(s.name));
    return sources;
  }, [view]);

  return <main style={s.main}>
    <header style={s.header}>
      <div style={s.headerInner}>
        <div style={{display:'flex',gap:12,alignItems:'center',flexWrap:'wrap'}}>
          <Link href="/grid-os" style={s.brand}>ARIDON GridOS</Link>
          <span style={s.product}><Leaf size={17}/> LPEA Carbon + Efficiency Monitor</span>
        </div>
        <span style={s.demo}>DEMONSTRATION / READ-ONLY DESIGN</span>
      </div>
    </header>

    <section style={s.hero}>
      <div style={s.wrap}>
        <div style={s.eyebrow}>LA PLATA ELECTRIC ASSOCIATION · COLORADO</div>
        <h1 style={s.h1}>See where every avoidable ton starts.</h1>
        <p style={s.lead}>A cooperative-specific monitoring layer for power-supply carbon, grid losses, peak demand, assets, fleet, facilities, storage and member loads. It turns emissions into an operating signal tied to cost, reliability and funding decisions.</p>
        <div style={s.heroGrid}>
          <Metric label="Public renewable baseline" value="32" unit="%" detail="LPEA annual power supply, June 2026"/>
          <Metric label="CO₂ reduction vs. 2005" value="59" unit="%" detail="Public LPEA current portfolio statement"/>
          <Metric label="2030 strategic goal" value=">80" unit="%" detail="Reduction vs. 2005"/>
          <Metric label="2028 expected reduction" value="85" unit="%" detail="With planned wind delivery, per LPEA"/>
        </div>
        <p style={s.disclaimer}>The public figures above are context, not live telemetry. Live operating values require authorized LPEA integrations. This page does not control breakers, relays, DER, generation or market transactions.</p>
      </div>
    </section>

    <nav style={s.tabs}>
      <div style={s.tabInner}>
        {([['system','System'],['losses','Loss detective'],['carbon','Carbon sources'],['actions','Action queue']] as const).map(([k,label]) =>
          <button key={k} onClick={() => setView(k)} style={{...s.tab,...(view===k?s.activeTab:{})}}>{label}</button>
        )}
      </div>
    </nav>

    <section style={s.section}>
      {view !== 'actions' && <>
        <SectionTitle eyebrow="MONITORING LAYER" title="Generation → market → wires → assets → members" text="Each signal keeps carbon, dollars and reliability side-by-side so an emissions reduction cannot quietly become a reliability or affordability problem."/>
        <div style={s.cardGrid}>{visibleSources.map(x => <SourceCard key={x.name} x={x}/>)}</div>
      </>}

      {view === 'system' && <>
        <div style={s.twoCol}>
          <Panel title="Carbon intensity trajectory" icon={<LineChart size={19}/> }>
            <div style={s.bigNumber}>Configure live <span style={s.unit}>lb CO₂/MWh</span></div>
            <p style={s.muted}>Use hourly portfolio emissions factors so GridOS can distinguish a clean MWh from a high-carbon MWh. Historical LPEA planning documents used carbon intensity targets, but the live system should ingest the cooperative's current verified accounting source.</p>
            <Bar value={59}/>
            <Row left="Reduction vs. 2005" right="59% public baseline"/>
            <Row left="2030 strategic target" right=">80%"/>
            <Row left="Wind-era expectation" right="85% reduction"/>
          </Panel>
          <Panel title="Loss-to-carbon engine" icon={<Network size={19}/> }>
            <p style={s.muted}>For each feeder and substation, estimate avoidable energy loss, then multiply only by the relevant verified emissions factor. That yields the carbon cost of wasted electricity without pretending line loss itself emits CO₂.</p>
            <Formula text="Avoided MWh × verified kg CO₂e/MWh = avoided operational CO₂e"/>
            <Formula text="Avoided MWh × energy / capacity cost = utility value"/>
            <Formula text="Asset + outage effect = reliability value"/>
          </Panel>
        </div>

        <SectionTitle eyebrow="ALERTING" title="Only surface what deserves attention" text="Alerts are evidence-first. GridOS explains why the signal changed, what data supports it and which actions require engineering or operator approval."/>
        <Panel title="Carbon + efficiency event rules" icon={<Radio size={19}/> }>
          {alerts.map(([severity,title,detail]) => <Alert key={title} severity={severity as Severity} title={title} detail={detail}/>) }
          <button style={s.button} onClick={() => setAck(true)}>{ack ? 'Review package queued ✓' : 'Prepare operator review package'}</button>
          {ack && <p style={s.success}><CheckCircle2 size={15}/>Demo action only. No utility control command was issued.</p>}
        </Panel>
      </>}

      {view === 'losses' && <>
        <SectionTitle eyebrow="LOSS DETECTIVE" title="Find wasted electricity before buying more electricity" text="The first live deployment can remain read-only: substation/feeder SCADA + AMI interval totals + asset data + weather. GridOS ranks where engineering attention can produce the largest combined energy, carbon and reliability benefit."/>
        <div style={s.threeCol}>
          <Feature title="Feeder balance" text="Compare feeder input to interval-meter load after known technical adjustments and timing alignment." icon={<Network/>}/>
          <Feature title="Transformer loss model" text="Estimate no-load and load-dependent losses by asset class, age, loading and measured temperature where available." icon={<Gauge/>}/>
          <Feature title="Phase + voltage efficiency" text="Identify imbalance, voltage excursions and reactive-power conditions that deserve an engineering study." icon={<Activity/>}/>
        </div>
      </>}

      {view === 'carbon' && <>
        <SectionTitle eyebrow="CARBON ACCOUNTING WITH OPERATING CONTEXT" title="Separate direct emissions from purchased-power emissions" text="The monitor keeps power-supply emissions, direct fuel emissions and embodied/project emissions distinct so the co-op can explain exactly what changed and why."/>
        <Panel title="Accounting buckets" icon={<Leaf size={19}/> }>
          <Row left="Purchased / generated electricity" right="MWh × verified factor"/>
          <Row left="Fleet + standby generators" right="Fuel × factor"/>
          <Row left="Facilities" right="Metered energy + fuel"/>
          <Row left="Avoided grid losses" right="Avoided MWh × relevant factor"/>
          <Row left="Construction / equipment" right="Separate lifecycle record"/>
        </Panel>
      </>}

      {view === 'actions' && <>
        <SectionTitle eyebrow="PRIORITY ENGINE" title="Rank carbon reductions by co-op value" text="A project should rise to the top only when its carbon benefit survives the affordability and reliability test."/>
        <div style={s.actionGrid}>{opportunities.map(o => <Action key={o.title} o={o}/>)}</div>
        <Panel title="Decision score" icon={<ShieldCheck size={19}/> }>
          <Formula text="CO₂e avoided + member/utility savings + reliability benefit + funding eligibility − implementation risk"/>
          <p style={s.muted}>The score is a prioritization aid, not an engineering approval. Protection, dispatch, switching and interconnection decisions remain with authorized utility personnel.</p>
        </Panel>
      </>}

      <SectionTitle eyebrow="LIVE DATA CONNECTIONS" title="What LPEA would connect first" text="The system can start with exports or read-only APIs, then mature toward approved streaming integrations."/>
      <div style={s.integrationGrid}>
        {[
          ['SCADA / EMS','Substation, feeder, generation and operational measurements'],
          ['AMI','Interval usage, voltage and member-load segmentation'],
          ['SPP / supplier data','Market purchases, generation mix, price and verified carbon factors'],
          ['GIS + asset registry','Feeder, transformer, line and equipment context'],
          ['Fleet / fuel','Vehicle and generator fuel records'],
          ['Facility meters','Office, shop and support-building energy'],
          ['Weather','Load normalization, solar/wind context and asset conditions'],
          ['DER / storage','State-of-charge, solar production and approved dispatch records'],
        ].map(([a,b]) => <div style={s.integration} key={a}><strong>{a}</strong><span>{b}</span></div>)}
      </div>
    </section>
  </main>;
}

function SourceCard({x}:{x:Source}) { return <div style={s.card}><div style={s.icon}>{x.icon}</div><div style={s.cardTop}><strong>{x.name}</strong><span style={badge(x.status)}>{x.value}</span></div><p style={s.muted}>{x.note}</p></div> }
function SectionTitle({eyebrow,title,text}:{eyebrow:string;title:string;text:string}) { return <div style={{margin:'34px 0 16px'}}><div style={s.eyebrow}>{eyebrow}</div><h2 style={s.h2}>{title}</h2><p style={s.muted}>{text}</p></div> }
function Metric({label,value,unit,detail}:{label:string;value:string;unit:string;detail:string}) { return <div style={s.metric}><span>{label}</span><div style={s.metricValue}>{value}<small>{unit}</small></div><em>{detail}</em></div> }
function Panel({title,icon,children}:{title:string;icon:ReactNode;children:ReactNode}) { return <div style={s.panel}><h3 style={s.panelTitle}>{icon}{title}</h3>{children}</div> }
function Row({left,right}:{left:string;right:string}) { return <div style={s.row}><span>{left}</span><strong>{right}</strong></div> }
function Formula({text}:{text:string}) { return <div style={s.formula}>{text}</div> }
function Feature({title,text,icon}:{title:string;text:string;icon:ReactNode}) { return <div style={s.card}><div style={s.icon}>{icon}</div><h3>{title}</h3><p style={s.muted}>{text}</p></div> }
function Alert({severity,title,detail}:{severity:Severity;title:string;detail:string}) { return <div style={s.alert}><AlertTriangle size={17}/><div><div style={{display:'flex',gap:8,alignItems:'center',flexWrap:'wrap'}}><strong>{title}</strong><span style={sev(severity)}>{severity}</span></div><p style={{...s.muted,margin:'6px 0 0'}}>{detail}</p></div></div> }
function Action({o}:{o:Opportunity}) { return <div style={s.card}><div style={s.cardTop}><strong>{o.title}</strong><span style={sev(o.priority)}>{o.priority}</span></div><Row left="Area" right={o.area}/><Row left="Carbon" right={o.co2}/><Row left="Savings" right={o.savings}/><Row left="Reliability" right={o.reliability}/></div> }
function Bar({value}:{value:number}) { return <div style={s.barTrack}><div style={{...s.bar,width:`${Math.max(0,Math.min(100,value))}%`}}/></div> }

const badge = (status:Source['status']):CSSProperties => ({...s.badge,opacity: status==='good'?1:.9});
const sev = (severity:Severity):CSSProperties => ({...s.badge,fontSize:11});

const s:Record<string,CSSProperties> = {
  main:{minHeight:'100vh',background:'#07110d',color:'#ecf7f0',fontFamily:'Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif'},
  header:{borderBottom:'1px solid #1d3429',background:'#091710',position:'sticky',top:0,zIndex:20},
  headerInner:{maxWidth:1180,margin:'0 auto',padding:'14px 20px',display:'flex',justifyContent:'space-between',alignItems:'center',gap:14,flexWrap:'wrap'},
  brand:{color:'#e8fff0',textDecoration:'none',fontWeight:900,letterSpacing:'.08em'},
  product:{display:'inline-flex',alignItems:'center',gap:7,color:'#aeeac3',fontWeight:800},
  demo:{fontSize:11,letterSpacing:'.09em',border:'1px solid #385747',padding:'7px 9px',borderRadius:999,color:'#c8dfd0'},
  hero:{background:'radial-gradient(circle at 72% 20%,#173d28 0,transparent 34%),linear-gradient(180deg,#0c1d14,#07110d)',borderBottom:'1px solid #1c3528'},
  wrap:{maxWidth:1180,margin:'0 auto',padding:'68px 20px 42px'},
  eyebrow:{fontSize:12,fontWeight:900,letterSpacing:'.13em',color:'#7ee2a1'},
  h1:{fontSize:'clamp(38px,7vw,72px)',lineHeight:.98,letterSpacing:'-.045em',margin:'12px 0 18px',maxWidth:900},
  h2:{fontSize:'clamp(27px,4vw,42px)',letterSpacing:'-.03em',margin:'6px 0 8px'},
  lead:{fontSize:19,lineHeight:1.65,maxWidth:930,color:'#c9d9cf'},
  disclaimer:{fontSize:12,lineHeight:1.6,color:'#92a79a',maxWidth:960,marginTop:18},
  heroGrid:{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(190px,1fr))',gap:12,marginTop:28},
  metric:{background:'#0d1e15',border:'1px solid #244432',borderRadius:16,padding:16,display:'grid',gap:5},
  metricValue:{fontSize:34,fontWeight:900,color:'#d9ffe6'},
  metric:{background:'#0d1e15',border:'1px solid #244432',borderRadius:16,padding:16,display:'grid',gap:5} as CSSProperties,
  tabs:{borderBottom:'1px solid #1d3429',background:'#08140e'},
  tabInner:{maxWidth:1180,margin:'0 auto',padding:'0 20px',display:'flex',gap:4,overflowX:'auto'},
  tab:{background:'transparent',color:'#9eb2a5',border:0,padding:'15px 13px',cursor:'pointer',fontWeight:800,whiteSpace:'nowrap'},
  activeTab:{color:'#dffff0',borderBottom:'2px solid #65d891'},
  section:{maxWidth:1180,margin:'0 auto',padding:'10px 20px 70px'},
  cardGrid:{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(240px,1fr))',gap:13},
  card:{background:'#0c1b13',border:'1px solid #213b2c',borderRadius:17,padding:17},
  cardTop:{display:'flex',justifyContent:'space-between',gap:9,alignItems:'center',flexWrap:'wrap'},
  icon:{width:38,height:38,borderRadius:11,background:'#153523',display:'grid',placeItems:'center',color:'#7ae39f',marginBottom:12},
  badge:{border:'1px solid #355f46',borderRadius:999,padding:'4px 8px',color:'#bceccd',background:'#10291b',whiteSpace:'nowrap'},
  muted:{color:'#a8bbb0',lineHeight:1.65},
  twoCol:{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(300px,1fr))',gap:14,marginTop:14},
  threeCol:{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(250px,1fr))',gap:14},
  panel:{background:'#0c1b13',border:'1px solid #213b2c',borderRadius:18,padding:19,marginTop:14},
  panelTitle:{display:'flex',alignItems:'center',gap:9,margin:'0 0 12px',fontSize:20},
  bigNumber:{fontSize:34,fontWeight:900,margin:'8px 0'},
  unit:{fontSize:14,color:'#9db2a4',fontWeight:700},
  row:{display:'flex',justifyContent:'space-between',gap:16,borderTop:'1px solid #1b3125',padding:'11px 0',color:'#b6c9bd',flexWrap:'wrap'},
  formula:{background:'#07130d',border:'1px solid #294b37',borderRadius:12,padding:13,margin:'8px 0',fontFamily:'ui-monospace,SFMono-Regular,Menlo,monospace',color:'#c9ffdb'},
  alert:{display:'grid',gridTemplateColumns:'22px 1fr',gap:10,padding:'13px 0',borderTop:'1px solid #1b3125'},
  success:{display:'flex',gap:7,alignItems:'center',color:'#8eeaae',fontWeight:800},
  button:{background:'#76e59d',color:'#06110a',border:0,borderRadius:11,padding:'11px 14px',fontWeight:900,cursor:'pointer',marginTop:12},
  barTrack:{height:9,background:'#17281e',borderRadius:999,overflow:'hidden',margin:'12px 0'},
  bar:{height:'100%',background:'#70d995',borderRadius:999},
  actionGrid:{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(260px,1fr))',gap:14},
  integrationGrid:{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(230px,1fr))',gap:10},
  integration:{background:'#0b1911',border:'1px solid #20372b',borderRadius:13,padding:14,display:'grid',gap:6},
};
