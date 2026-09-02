'use client';

import { useMemo, useState, type CSSProperties, type ReactNode } from 'react';
import Link from 'next/link';
import {
  Activity,
  AlertTriangle,
  BatteryCharging,
  CheckCircle2,
  ChevronRight,
  CircleDot,
  CloudUpload,
  Cpu,
  Crosshair,
  Flame,
  Gauge,
  MapPinned,
  Network,
  Plane,
  Radio,
  Satellite,
  ShieldCheck,
  ThermometerSun,
  Trees,
  Wrench,
} from 'lucide-react';

type Finding = {
  id: string;
  assetId: string;
  assetType: string;
  issue: string;
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  confidence: number;
  score: number;
  action: string;
};

type AnalysisResult = {
  error?: string;
  riskScore?: number;
  severity?: string;
  recommendedAction?: string;
  reasons?: string[];
};

const findings: Finding[] = [
  { id: 'F-1048', assetId: 'TX-09-441', assetType: 'Transformer', issue: 'Thermal hotspot +23.6°C above baseline', severity: 'High', confidence: 97, score: 84, action: 'Crew inspection within 24 hours' },
  { id: 'F-1049', assetId: 'PL-44192', assetType: 'Distribution pole', issue: 'Crossarm deterioration and 4.8° lean', severity: 'Medium', confidence: 93, score: 63, action: 'Field inspection within 14 days' },
  { id: 'F-1050', assetId: 'INS-44192-B', assetType: 'Insulator', issue: 'Surface crack candidate', severity: 'High', confidence: 91, score: 78, action: 'Confirm at next safe access window' },
  { id: 'F-1051', assetId: 'ROW-17-88', assetType: 'Right of way', issue: 'Vegetation clearance 7.2 ft', severity: 'Medium', confidence: 99, score: 61, action: 'Vegetation work order' },
  { id: 'F-1052', assetId: 'SW-18-02', assetType: 'Switch', issue: 'Minor corrosion pattern', severity: 'Low', confidence: 86, score: 34, action: 'Track and compare next flight' },
];

const severityStyle: Record<Finding['severity'], CSSProperties> = {
  Critical: { color: '#FFD7D7', background: '#5F1F28', borderColor: '#8F3340' },
  High: { color: '#FFE2C4', background: '#56341C', borderColor: '#8C5A2C' },
  Medium: { color: '#FFF2B6', background: '#4D4218', borderColor: '#7D6C28' },
  Low: { color: '#CDE7FF', background: '#173A59', borderColor: '#2B5D87' },
};

const sampleInspection = {
  assetId: 'TX-09-441',
  assetType: 'transformer',
  thermalC: 91.4,
  thermalBaselineC: 67.8,
  vegetationClearanceFt: 18,
  poleLeanDeg: 0,
  crackConfidence: 0.03,
  corrosionConfidence: 0.18,
  conductorSagFt: 2.1,
};

export default function GridIntelligencePage() {
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [running, setRunning] = useState(false);
  const [missionState, setMissionState] = useState<'ready' | 'planned'>('ready');

  const counts = useMemo(() => ({
    high: findings.filter(f => f.severity === 'High').length,
    medium: findings.filter(f => f.severity === 'Medium').length,
  }), []);

  async function runSampleInspection() {
    setRunning(true);
    setAnalysis(null);
    try {
      const res = await fetch('/api/grid-intelligence/analyze', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(sampleInspection),
      });
      setAnalysis(await res.json() as AnalysisResult);
    } catch {
      setAnalysis({ error: 'The sample inspection could not be analyzed.' });
    } finally {
      setRunning(false);
    }
  }

  return (
    <main style={s.main}>
      <header style={s.header}>
        <div style={s.headerInner}>
          <Link href="/" style={s.brand}>ARIDON</Link>
          <div style={s.productTitle}><Plane size={18}/> Drone Grid Intelligence</div>
          <div style={s.demoBadge}><CircleDot size={14}/> DEMO MODE</div>
        </div>
      </header>

      <section style={s.hero}>
        <div style={s.heroCopy}>
          <div style={s.eyebrow}>GRID ASSET INTELLIGENCE · DRONE + AI + GIS</div>
          <h1 style={s.h1}>Give the grid eyes.</h1>
          <p style={s.lead}>Autonomous inspection data, thermal imagery, LiDAR measurements and AI findings become condition scores, prioritized work orders and GIS-ready evidence.</p>
          <div style={s.buttonRow}>
            <button onClick={runSampleInspection} disabled={running} style={s.primaryButton}>{running ? 'Analyzing…' : 'Run sample AI inspection'} <ChevronRight size={17}/></button>
            <button onClick={() => setMissionState('planned')} style={s.secondaryButton}>{missionState === 'planned' ? 'Pilot mission planned ✓' : 'Plan pilot mission'}</button>
          </div>
          <p style={s.disclaimer}>This screen uses labeled demonstration data. Flight control, GIS writes and utility work-order dispatch remain approval-gated until live integrations are connected.</p>
        </div>
        <div style={s.heroDiagram}>
          <FlowStep icon={<Plane/>} label="Drone" sub="RGB · Thermal · LiDAR" />
          <Arrow />
          <FlowStep icon={<Cpu/>} label="Aridon AI" sub="Detect · score · compare" />
          <Arrow />
          <FlowStep icon={<Network/>} label="Grid Twin" sub="Asset history + risk" />
          <Arrow />
          <FlowStep icon={<Wrench/>} label="Work" sub="Approve · repair · verify" />
        </div>
      </section>

      <section style={s.wrap}>
        <div style={s.kpiGrid}>
          <Kpi icon={<MapPinned/>} label="Route" value="18.4 mi" sub="Feeder 17 pilot corridor" />
          <Kpi icon={<Crosshair/>} label="Assets inspected" value="127" sub="Demo mission set" />
          <Kpi icon={<AlertTriangle/>} label="Priority findings" value={`${counts.high + counts.medium}`} sub={`${counts.high} high · ${counts.medium} medium`} />
          <Kpi icon={<Gauge/>} label="Evidence coverage" value="96.8%" sub="RGB + thermal capture" />
        </div>

        <div style={s.twoCol}>
          <section style={s.panel}>
            <PanelTitle icon={<Satellite size={19}/>} title="Mission control" kicker="Pilot corridor" />
            <div style={s.missionTop}>
              <div><div style={s.missionName}>Feeder 17 · North Corridor</div><div style={s.muted}>Dock A → 11 inspection zones → Dock B</div></div>
              <span style={s.ready}><Radio size={14}/> READY</span>
            </div>
            <div style={s.routeGraphic}>
              <RouteNode n="A" label="Dock" active /><RouteLine/><RouteNode n="01" label="Substation"/><RouteLine/><RouteNode n="06" label="Midpoint"/><RouteLine/><RouteNode n="11" label="ROW" alert/><RouteLine/><RouteNode n="B" label="Dock" active />
            </div>
            <div style={s.missionStats}>
              <Mini icon={<BatteryCharging size={16}/>} label="Battery reserve" value="34%" />
              <Mini icon={<ThermometerSun size={16}/>} label="Thermal frames" value="418" />
              <Mini icon={<CloudUpload size={16}/>} label="Evidence uploaded" value="2.7 GB" />
            </div>
          </section>

          <section style={s.panel}>
            <PanelTitle icon={<Activity size={19}/>} title="AI inspection engine" kicker="Deterministic MVP" />
            <p style={s.muted}>The first production slice accepts field measurements and returns a risk score, severity, evidence reasons and recommended action. Computer-vision models plug into this same contract later.</p>
            <div style={s.sampleBox}><div><strong>Sample:</strong> TX-09-441</div><div>Thermal: 91.4°C · baseline: 67.8°C</div><div>Delta: +23.6°C</div></div>
            {analysis ? (
              analysis.error ? <div style={s.errorBox}>{analysis.error}</div> :
              <div style={s.analysisBox}>
                <div style={s.analysisScore}>{analysis.riskScore}</div>
                <div><strong>{analysis.severity} risk</strong><div style={s.muted}>{analysis.recommendedAction}</div></div>
                <div style={s.reasonList}>{analysis.reasons?.map(r => <span key={r}>• {r}</span>)}</div>
              </div>
            ) : <div style={s.emptyAnalysis}>Run the sample inspection to exercise the API.</div>}
          </section>
        </div>

        <section style={s.panel}>
          <PanelTitle icon={<AlertTriangle size={19}/>} title="Prioritized findings" kicker="Asset condition queue" />
          <div style={s.tableWrap}>
            <table style={s.table}>
              <thead><tr><th style={s.th}>Asset</th><th style={s.th}>Finding</th><th style={s.th}>Severity</th><th style={s.th}>Confidence</th><th style={s.th}>Condition risk</th><th style={s.th}>Recommended action</th></tr></thead>
              <tbody>{findings.map(f => <tr key={f.id}>
                <td style={s.td}><strong>{f.assetId}</strong><div style={s.small}>{f.assetType}</div></td><td style={s.td}>{f.issue}</td><td style={s.td}><span style={{...s.severity, ...severityStyle[f.severity]}}>{f.severity}</span></td><td style={s.td}>{f.confidence}%</td><td style={s.td}><ScoreBar value={f.score}/></td><td style={s.td}>{f.action}</td>
              </tr>)}</tbody>
            </table>
          </div>
        </section>

        <div style={s.threeCol}>
          <Feature icon={<Flame/>} title="Thermal intelligence" text="Compare component temperature against asset-specific and fleet baselines. Flag connectors, transformers, switches and other abnormal heat signatures." />
          <Feature icon={<Trees/>} title="LiDAR + vegetation" text="Measure conductor clearance, encroachment, pole geometry and sag. Turn distance thresholds into prioritized vegetation work." />
          <Feature icon={<ShieldCheck/>} title="Repair verification" text="Re-fly completed work, compare before/after evidence and close the maintenance loop with a time-stamped audit trail." />
        </div>

        <section style={s.panel}>
          <PanelTitle icon={<Network size={19}/>} title="Integration backbone" kicker="Keep the utility's existing system" />
          <div style={s.integrationGrid}>
            <Integration from="Enterprise UAS" to="Aridon ingestion" text="Mission metadata, telemetry, RGB frames, thermal frames and LiDAR files." />
            <Integration from="Aridon AI" to="Asset digital twin" text="Findings, confidence, condition score, evidence and trend history by asset ID." />
            <Integration from="Digital twin" to="ArcGIS / ArcFM" text="Read asset geometry and IDs; write approved condition attributes, attachments or related records." />
            <Integration from="Approved finding" to="CMMS / work orders" text="Create maintenance recommendations only after the utility's configured human approval step." />
          </div>
        </section>

        <section style={s.panel}>
          <PanelTitle icon={<Plane size={19}/>} title="Pilot hardware package" kicker="Reference configuration" />
          <div style={s.hardwareGrid}>
            <Hardware name="Enterprise inspection drone" spec="RTK positioning · obstacle sensing · geofenced mission planning" />
            <Hardware name="RGB payload" spec="High-resolution zoom camera for hardware, corrosion, cracks and visual evidence" />
            <Hardware name="Radiometric thermal" spec="Temperature-measuring thermal payload for hotspots and comparative inspection" />
            <Hardware name="LiDAR payload" spec="Clearance, conductor sag, structure geometry and vegetation measurement" />
            <Hardware name="Docking station" spec="Weatherized recharge, data sync, health checks and scheduled relaunch" />
            <Hardware name="Edge gateway" spec="Encrypted upload, local buffering, mission manifest and evidence hashing" />
          </div>
        </section>

        <section style={s.bottomCta}>
          <div><div style={s.eyebrow}>ARIDON GRID INTELLIGENCE MVP</div><h2 style={s.h2}>Inspect → detect → prioritize → repair → verify.</h2><p style={s.muted}>The software slice is structured for real drone feeds and utility integrations. Next step is connecting one pilot drone, one corridor and one utility asset export.</p></div>
          <Link href="/" style={s.secondaryLink}>Back to Aridon</Link>
        </section>
      </section>
    </main>
  );
}

function FlowStep({icon,label,sub}:{icon:ReactNode;label:string;sub:string}){return <div style={s.flowStep}><div style={s.flowIcon}>{icon}</div><strong>{label}</strong><span>{sub}</span></div>}
function Arrow(){return <div style={s.flowArrow}>→</div>}
function Kpi({icon,label,value,sub}:{icon:ReactNode;label:string;value:string;sub:string}){return <div style={s.kpi}><div style={s.kpiIcon}>{icon}</div><div style={s.kpiLabel}>{label}</div><div style={s.kpiValue}>{value}</div><div style={s.muted}>{sub}</div></div>}
function PanelTitle({icon,title,kicker}:{icon:ReactNode;title:string;kicker:string}){return <div style={s.panelTitle}><div style={s.panelIcon}>{icon}</div><div><div style={s.panelKicker}>{kicker}</div><h2 style={s.panelHeading}>{title}</h2></div></div>}
function RouteNode({n,label,active,alert}:{n:string;label:string;active?:boolean;alert?:boolean}){return <div style={s.routeNodeWrap}><div style={{...s.routeNode,...(active?{borderColor:'#9EF0CF',color:'#9EF0CF'}:{}),...(alert?{borderColor:'#FFB85C',color:'#FFB85C'}:{})}}>{n}</div><div style={s.routeLabel}>{label}</div></div>}
function RouteLine(){return <div style={s.routeLine}/>}
function Mini({icon,label,value}:{icon:ReactNode;label:string;value:string}){return <div style={s.mini}><span>{icon}</span><div><div style={s.small}>{label}</div><strong>{value}</strong></div></div>}
function ScoreBar({value}:{value:number}){return <div style={s.scoreRow}><span>{value}</span><div style={s.bar}><div style={{...s.barFill,width:`${value}%`}}/></div></div>}
function Feature({icon,title,text}:{icon:ReactNode;title:string;text:string}){return <section style={s.feature}><div style={s.featureIcon}>{icon}</div><h3 style={s.featureTitle}>{title}</h3><p style={s.muted}>{text}</p></section>}
function Integration({from,to,text}:{from:string;to:string;text:string}){return <div style={s.integration}><div style={s.integrationPath}><strong>{from}</strong><span>→</span><strong>{to}</strong></div><p style={s.muted}>{text}</p></div>}
function Hardware({name,spec}:{name:string;spec:string}){return <div style={s.hardware}><CheckCircle2 size={18}/><div><strong>{name}</strong><div style={s.muted}>{spec}</div></div></div>}

const s: Record<string, CSSProperties> = {
  main:{minHeight:'100vh',background:'#06101B',color:'#F7FAFC',fontFamily:'Arial, sans-serif'},header:{position:'sticky',top:0,zIndex:20,background:'rgba(6,16,27,.94)',backdropFilter:'blur(12px)',borderBottom:'1px solid #1E3144'},headerInner:{maxWidth:1240,margin:'0 auto',padding:'15px 20px',display:'flex',alignItems:'center',gap:18,justifyContent:'space-between',flexWrap:'wrap'},brand:{color:'#9EF0CF',textDecoration:'none',fontWeight:950,letterSpacing:2},productTitle:{display:'flex',gap:8,alignItems:'center',fontWeight:900},demoBadge:{display:'flex',gap:6,alignItems:'center',fontSize:11,fontWeight:900,color:'#FFD77D',border:'1px solid #6B5827',background:'#2C2612',padding:'7px 9px',borderRadius:999},
  hero:{maxWidth:1240,margin:'0 auto',padding:'58px 20px 34px',display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))',gap:28,alignItems:'center'},heroCopy:{maxWidth:720},eyebrow:{color:'#9EF0CF',fontSize:12,fontWeight:950,letterSpacing:1.2},h1:{fontSize:'clamp(52px,8vw,92px)',lineHeight:.92,letterSpacing:-4,margin:'12px 0 20px'},lead:{fontSize:20,lineHeight:1.65,color:'#B8C7D7',maxWidth:780},buttonRow:{display:'flex',gap:10,flexWrap:'wrap',marginTop:24},primaryButton:{border:0,borderRadius:12,padding:'13px 16px',background:'#9EF0CF',color:'#07130F',fontWeight:950,cursor:'pointer',display:'flex',alignItems:'center',gap:8,fontSize:14},secondaryButton:{border:'1px solid #3A526B',borderRadius:12,padding:'13px 16px',background:'#0B1A29',color:'#F7FAFC',fontWeight:900,cursor:'pointer',fontSize:14},disclaimer:{color:'#7F93A7',fontSize:12,lineHeight:1.55,maxWidth:720,marginTop:14},
  heroDiagram:{background:'#091827',border:'1px solid #233A50',borderRadius:22,padding:18,display:'flex',alignItems:'center',justifyContent:'space-between',gap:8,overflowX:'auto'},flowStep:{minWidth:112,display:'flex',flexDirection:'column',gap:5,alignItems:'center',textAlign:'center'},flowIcon:{width:52,height:52,border:'1px solid #2B4B61',background:'#0D2433',borderRadius:15,display:'grid',placeItems:'center',color:'#9EF0CF'},flowArrow:{color:'#5D7891',fontSize:25,fontWeight:950},
  wrap:{maxWidth:1240,margin:'0 auto',padding:'10px 20px 70px'},kpiGrid:{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(210px,1fr))',gap:12,margin:'16px 0 12px'},kpi:{background:'#0A1725',border:'1px solid #20364A',borderRadius:16,padding:18},kpiIcon:{color:'#9EF0CF'},kpiLabel:{fontSize:12,fontWeight:900,color:'#8EA2B5',textTransform:'uppercase',marginTop:10},kpiValue:{fontSize:34,fontWeight:950,letterSpacing:-1,margin:'5px 0'},muted:{color:'#8FA3B7',fontSize:14,lineHeight:1.55},small:{color:'#8196A9',fontSize:11,marginTop:3},twoCol:{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))',gap:12,margin:'12px 0'},
  panel:{background:'#0A1725',border:'1px solid #20364A',borderRadius:18,padding:20,margin:'12px 0'},panelTitle:{display:'flex',gap:11,alignItems:'center',marginBottom:17},panelIcon:{width:39,height:39,borderRadius:11,display:'grid',placeItems:'center',background:'#10283A',color:'#9EF0CF',border:'1px solid #28506B'},panelKicker:{fontSize:10,fontWeight:950,color:'#6F889D',textTransform:'uppercase',letterSpacing:1},panelHeading:{fontSize:21,margin:'3px 0 0'},missionTop:{display:'flex',justifyContent:'space-between',gap:12,alignItems:'center'},missionName:{fontSize:18,fontWeight:950},ready:{display:'flex',gap:6,alignItems:'center',fontSize:11,fontWeight:950,color:'#9EF0CF',border:'1px solid #285B50',padding:'6px 8px',borderRadius:999},
  routeGraphic:{display:'flex',alignItems:'flex-start',justifyContent:'center',margin:'28px 0 22px',overflowX:'auto',paddingBottom:5},routeNodeWrap:{display:'flex',flexDirection:'column',alignItems:'center',minWidth:58},routeNode:{width:40,height:40,borderRadius:999,border:'2px solid #52687D',display:'grid',placeItems:'center',fontWeight:950,fontSize:11},routeLabel:{fontSize:9,color:'#8096AA',marginTop:6},routeLine:{height:2,background:'#334D64',width:55,marginTop:20,flex:'0 0 55px'},missionStats:{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(120px,1fr))',gap:8},mini:{background:'#08131F',border:'1px solid #1A3146',borderRadius:12,padding:10,display:'flex',gap:8,alignItems:'center'},
  sampleBox:{background:'#07131F',border:'1px solid #20394F',borderRadius:12,padding:13,display:'grid',gap:4,fontSize:13,margin:'12px 0'},emptyAnalysis:{border:'1px dashed #2B455B',borderRadius:12,padding:18,color:'#788FA3',textAlign:'center'},analysisBox:{border:'1px solid #2A5B50',background:'#08221D',borderRadius:12,padding:14,display:'grid',gridTemplateColumns:'70px 1fr',gap:12,alignItems:'center'},analysisScore:{fontSize:42,fontWeight:950,color:'#9EF0CF',textAlign:'center'},reasonList:{gridColumn:'1 / -1',display:'grid',gap:4,color:'#B9C8D6',fontSize:12},errorBox:{border:'1px solid #743641',background:'#2F151A',borderRadius:12,padding:13,color:'#FFD5D9'},
  tableWrap:{overflowX:'auto'},table:{width:'100%',borderCollapse:'collapse',minWidth:900},th:{textAlign:'left',fontSize:10,textTransform:'uppercase',letterSpacing:.7,color:'#71869A',padding:'10px 9px',borderBottom:'1px solid #22384D'},td:{padding:'13px 9px',fontSize:13,borderBottom:'1px solid #172B3D',verticalAlign:'top',color:'#DCE6EF'},severity:{display:'inline-block',fontSize:10,fontWeight:950,border:'1px solid',borderRadius:999,padding:'4px 7px'},scoreRow:{display:'flex',alignItems:'center',gap:8,minWidth:120},bar:{height:7,flex:1,borderRadius:99,background:'#172A3B',overflow:'hidden'},barFill:{height:'100%',background:'#9EF0CF',borderRadius:99},
  threeCol:{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(240px,1fr))',gap:12,margin:'12px 0'},feature:{background:'#0A1725',border:'1px solid #20364A',borderRadius:18,padding:20},featureIcon:{color:'#9EF0CF'},featureTitle:{fontSize:18,margin:'14px 0 7px'},integrationGrid:{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(240px,1fr))',gap:10},integration:{background:'#07131F',border:'1px solid #1D3448',borderRadius:12,padding:14},integrationPath:{display:'flex',alignItems:'center',justifyContent:'space-between',gap:10,fontSize:12,color:'#DCE9F2'},hardwareGrid:{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(250px,1fr))',gap:9},hardware:{display:'flex',gap:10,alignItems:'flex-start',background:'#07131F',border:'1px solid #1D3448',borderRadius:12,padding:13,color:'#9EF0CF'},bottomCta:{display:'flex',justifyContent:'space-between',gap:18,alignItems:'center',flexWrap:'wrap',padding:'34px 0 8px'},h2:{fontSize:'clamp(32px,5vw,50px)',letterSpacing:-1.5,margin:'7px 0 10px'},secondaryLink:{color:'#F7FAFC',border:'1px solid #3A526B',borderRadius:12,padding:'12px 15px',textDecoration:'none',fontWeight:900},
};
