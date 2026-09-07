'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import {
  Activity, ArrowRight, Bell, BriefcaseBusiness, Building2, CheckCircle2,
  CircleDollarSign, Droplets, Gauge, Mail, Menu, Mic, Radio, Search,
  Send, ShieldCheck, Sparkles, Target, Users, Zap
} from 'lucide-react';
import { executives } from '../../lib/executives';

const C = {
  bg: '#06101B', panel: '#0B1725', panel2: '#0E1D2E', line: '#20344A',
  text: '#F7FAFC', muted: '#8EA2B8', cyan: '#66D9EF', mint: '#9EF0CF',
  amber: '#FFC857', orange: '#FF8B57', red: '#FF6B6B', blue: '#79A7FF'
};

const missions = [
  { title: 'Southwest Technology Campus', meta: 'Capital · sponsors · partners · site', status: 'PRIORITY', icon: Building2, href: '/investor-intelligence' },
  { title: 'AWG-1000 Commercialization', meta: 'Engineering · pilots · manufacturing', status: 'ACTIVE', icon: Droplets, href: '/execution' },
  { title: 'Utility OS', meta: 'Sales · pilots · electric + water utilities', status: 'OUTREACH', icon: Zap, href: '/business-os' },
  { title: 'Aridon Ag', meta: 'Producers · partners · revenue', status: 'ACTIVE', icon: Target, href: '/ag' },
  { title: 'Acquisition Engine', meta: 'Deals · underwriting · financing', status: 'SCREENING', icon: BriefcaseBusiness, href: '/acquisitions/pipeline' },
  { title: 'Capital & Funding', meta: 'Investors · grants · sponsorships', status: 'RUNNING', icon: CircleDollarSign, href: '/finance' }
];

const systemLinks = [
  ['/boardroom', 'Executive Boardroom'], ['/ceo-brief', 'CEO Brief'], ['/finance', 'Finance'],
  ['/execution', 'Execution'], ['/controls', 'Approvals'], ['/avatars', 'Voice Room'],
  ['/investor-intelligence', 'Investor Intelligence'], ['/acquisitions/pipeline', 'Acquisitions'],
  ['/email', 'Email'], ['/business-os', 'Business OS'], ['/analyze-business', 'Analyze Business']
] as const;

function routeCommand(value: string) {
  const q = value.toLowerCase();
  if (/invest|sponsor|capital|fundrais|family office/.test(q)) return '/investor-intelligence';
  if (/email|reply|inbox|message|send/.test(q)) return '/email';
  if (/grant|funding|budget|cash|finance|cost|revenue/.test(q)) return '/finance';
  if (/acqui|buy business|deal|seller|property/.test(q)) return '/acquisitions/pipeline';
  if (/approve|permission|control|risk/.test(q)) return '/controls';
  if (/brief|priority|morning|today/.test(q)) return '/ceo-brief';
  if (/board|decision|executive team/.test(q)) return '/boardroom';
  if (/ag|farm|ranch|crop|livestock/.test(q)) return '/ag';
  if (/execute|build|task|project|do it/.test(q)) return '/execution';
  return '/avatars';
}

export default function DashboardPage() {
  const router = useRouter();
  const [command, setCommand] = useState('');
  const [clock, setClock] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [recent, setRecent] = useState<string[]>([]);

  useEffect(() => {
    const tick = () => setClock(new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit', month: 'short', day: 'numeric' }).format(new Date()));
    tick();
    const id = setInterval(tick, 30000);
    try { setRecent(JSON.parse(localStorage.getItem('aridon-command-history') || '[]').slice(0, 4)); } catch {}
    return () => clearInterval(id);
  }, []);

  const eva = useMemo(() => executives.find(e => e.id === 'eva'), []);

  function executeCommand() {
    const value = command.trim();
    if (!value) return;
    const next = [value, ...recent.filter(x => x !== value)].slice(0, 4);
    setRecent(next);
    try { localStorage.setItem('aridon-command-history', JSON.stringify(next)); localStorage.setItem('aridon-last-command', value); } catch {}
    setCommand('');
    router.push(routeCommand(value));
  }

  return <main style={{ minHeight: '100vh', background: `radial-gradient(circle at 76% -10%, #12325A 0, ${C.bg} 34%, #040A11 100%)`, color: C.text, fontFamily: 'Arial, sans-serif' }}>
    <style>{`
      *{box-sizing:border-box} body{margin:0} button,input{font:inherit}
      .ar-panel{background:linear-gradient(180deg,rgba(15,31,48,.96),rgba(8,20,32,.96));border:1px solid ${C.line};box-shadow:0 18px 50px rgba(0,0,0,.22)}
      .ar-card{transition:.18s ease}.ar-card:hover{transform:translateY(-2px);border-color:#365674!important;background:#10243A!important}
      .ar-agent{transition:.18s ease}.ar-agent:hover{background:#10243A!important;border-color:#365674!important}
      .ar-command:focus{outline:none}.ar-scroll::-webkit-scrollbar{width:7px}.ar-scroll::-webkit-scrollbar-thumb{background:#29435D;border-radius:10px}
      @media(max-width:1050px){.ar-shell{grid-template-columns:1fr!important}.ar-left,.ar-right{display:none}.ar-mobile{display:flex!important}}
      @media(max-width:700px){.ar-toplinks{display:none!important}.ar-metrics{grid-template-columns:repeat(2,1fr)!important}.ar-missions{grid-template-columns:1fr!important}.ar-eva{grid-template-columns:1fr!important}.ar-hero-title{font-size:28px!important}}
    `}</style>

    <header style={{ height: 66, borderBottom: `1px solid ${C.line}`, background: 'rgba(4,12,20,.88)', backdropFilter: 'blur(18px)', position: 'sticky', top: 0, zIndex: 20 }}>
      <div style={{ maxWidth: 1600, margin: '0 auto', height: '100%', padding: '0 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 13 }}>
          <button className="ar-mobile" onClick={() => setMenuOpen(!menuOpen)} style={{ display: 'none', background: 'transparent', color: C.text, border: 0 }}><Menu size={22}/></button>
          <div style={{ width: 35, height: 35, borderRadius: 10, display: 'grid', placeItems: 'center', background: `linear-gradient(135deg,${C.orange},#A93DFF)`, fontWeight: 1000 }}>A</div>
          <div><strong style={{ letterSpacing: '.12em', fontSize: 15 }}>ARIDON COMMAND</strong><div style={{ color: C.muted, fontSize: 10, fontWeight: 900, letterSpacing: '.11em', marginTop: 2 }}>EXECUTIVE OPERATING SYSTEM</div></div>
        </div>
        <div className="ar-toplinks" style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          {systemLinks.slice(0, 6).map(([h,t]) => <Link key={h} href={h} style={{ color: C.muted, textDecoration: 'none', fontSize: 12, fontWeight: 850 }}>{t}</Link>)}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, color: C.mint, fontSize: 11, fontWeight: 900 }}><span style={{ width: 7, height: 7, borderRadius: 99, background: C.mint, boxShadow: `0 0 12px ${C.mint}` }}/>{clock || 'LIVE'}</div>
          <button style={iconBtn}><Bell size={17}/></button>
        </div>
      </div>
    </header>

    {menuOpen && <div style={{ position: 'fixed', zIndex: 30, top: 66, left: 0, right: 0, background: '#071321', borderBottom: `1px solid ${C.line}`, padding: 14, display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 8 }}>
      {systemLinks.map(([h,t]) => <Link key={h} href={h} style={{ padding: 12, border: `1px solid ${C.line}`, borderRadius: 10, color: C.text, textDecoration: 'none', fontWeight: 800, fontSize: 12 }}>{t}</Link>)}
    </div>}

    <div className="ar-shell" style={{ maxWidth: 1600, margin: '0 auto', padding: 16, display: 'grid', gridTemplateColumns: '245px minmax(0,1fr) 300px', gap: 14 }}>
      <aside className="ar-left ar-panel ar-scroll" style={{ borderRadius: 18, padding: 12, height: 'calc(100vh - 98px)', position: 'sticky', top: 82, overflowY: 'auto' }}>
        <div style={sectionLabel}><Users size={14}/> AI WORKFORCE <span style={{ marginLeft: 'auto', color: C.mint }}>{executives.length} ONLINE</span></div>
        <div style={{ display: 'grid', gap: 7, marginTop: 10 }}>
          {executives.map((e, i) => <Link className="ar-agent" href={e.id === 'eva' ? '/avatars' : '/boardroom'} key={e.id} style={{ display: 'grid', gridTemplateColumns: '42px 1fr auto', gap: 9, alignItems: 'center', textDecoration: 'none', color: C.text, padding: 8, border: '1px solid transparent', borderRadius: 12 }}>
            <div style={{ width: 42, height: 42, borderRadius: 12, background: `linear-gradient(145deg,${e.color}66,#102033)`, border: `1px solid ${e.color}88`, display: 'grid', placeItems: 'center', overflow: 'hidden', fontWeight: 1000 }}>
              {e.avatar ? <img src={e.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(ev) => { ev.currentTarget.style.display='none'; }}/>: e.icon}
            </div>
            <div style={{ minWidth: 0 }}><div style={{ fontWeight: 950, fontSize: 13 }}>{e.name}</div><div style={{ color: C.muted, fontSize: 10, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{e.abbr} · {e.focus.split(',')[0]}</div></div>
            <span title={i < 7 ? 'Working' : 'Ready'} style={{ width: 8, height: 8, borderRadius: 99, background: i < 7 ? C.mint : C.amber, boxShadow: `0 0 10px ${i < 7 ? C.mint : C.amber}` }}/>
          </Link>)}
        </div>
        <div style={{ marginTop: 15, padding: 12, borderRadius: 13, background: '#07111D', border: `1px solid ${C.line}` }}>
          <div style={{ fontSize: 10, color: C.muted, fontWeight: 900 }}>AGENT STATUS</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 9, fontSize: 12 }}><span>Available</span><strong style={{color:C.mint}}>{executives.length}</strong></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 12 }}><span>Owner control</span><strong>ON</strong></div>
        </div>
      </aside>

      <section style={{ minWidth: 0 }}>
        <div className="ar-panel" style={{ borderRadius: 20, overflow: 'hidden', position: 'relative' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 80% 10%,rgba(102,217,239,.13),transparent 34%)', pointerEvents: 'none' }}/>
          <div className="ar-eva" style={{ position: 'relative', padding: '22px 22px 18px', display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 240px', gap: 18, alignItems: 'center' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: C.cyan, fontSize: 11, fontWeight: 950, letterSpacing: '.12em' }}><Radio size={14}/> EVA · COMMAND ADVISOR</div>
              <h1 className="ar-hero-title" style={{ fontSize: 38, letterSpacing: '-.035em', lineHeight: 1.02, margin: '10px 0 8px' }}>What do you want Aridon to move today?</h1>
              <p style={{ color: C.muted, lineHeight: 1.6, margin: 0, maxWidth: 760, fontSize: 14 }}>Give Eva the objective. Aridon routes it to the right executive module, keeps owner approvals in place, and brings the decision back to one cockpit.</p>
            </div>
            <div style={{ height: 148, borderRadius: 18, border: `1px solid ${C.line}`, background: 'linear-gradient(145deg,#162A3E,#091521)', display: 'grid', placeItems: 'center', overflow: 'hidden', position: 'relative' }}>
              <div style={{ position: 'absolute', width: 150, height: 150, borderRadius: 999, background: 'rgba(255,139,87,.11)', filter: 'blur(10px)' }}/>
              {eva?.avatar ? <img src={eva.avatar} alt="Eva" style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'relative' }} /> : <div style={{fontSize:64,fontWeight:1000,color:C.orange}}>E</div>}
              <div style={{ position: 'absolute', left: 10, bottom: 10, right: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(3,10,17,.78)', border: `1px solid ${C.line}`, padding: '6px 9px', borderRadius: 9 }}><strong style={{fontSize:11}}>EVA</strong><span style={{fontSize:9,color:C.mint,fontWeight:950}}>READY</span></div>
            </div>
          </div>
          <div style={{ padding: '0 18px 18px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', alignItems: 'center', gap: 8, padding: 7, borderRadius: 16, background: '#050D16', border: '1px solid #2B4863', boxShadow: '0 0 0 3px rgba(102,217,239,.035)' }}>
              <Search size={19} color={C.cyan} style={{ marginLeft: 7 }}/>
              <input className="ar-command" value={command} onChange={e => setCommand(e.target.value)} onKeyDown={e => e.key === 'Enter' && executeCommand()} placeholder="Tell Aridon what you want done…" style={{ minWidth: 0, width: '100%', gridColumn: '2 / 2', background: 'transparent', color: C.text, border: 0, padding: '12px 0', fontSize: 15 }} />
              <div style={{ gridColumn: '3', display: 'flex', gap: 6 }}><button title="Voice room" onClick={() => router.push('/avatars')} style={iconBtn}><Mic size={18}/></button><button onClick={executeCommand} style={{ ...iconBtn, width: 43, background: C.cyan, color: '#04202A', borderColor: C.cyan }}><Send size={17}/></button></div>
            </div>
            {recent.length > 0 && <div style={{ display: 'flex', gap: 7, overflowX: 'auto', marginTop: 9, paddingBottom: 2 }}>{recent.map((x,i)=><button key={i} onClick={() => setCommand(x)} style={{ whiteSpace:'nowrap', background:'#0D1B2A', color:C.muted, border:`1px solid ${C.line}`, borderRadius:999, padding:'7px 10px', fontSize:10, cursor:'pointer' }}>{x}</button>)}</div>}
          </div>
        </div>

        <div className="ar-metrics" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginTop: 12 }}>
          <Metric icon={Users} label="AI workforce" value={String(executives.length)} sub="executives available" tone={C.mint}/>
          <Metric icon={Target} label="Mission lanes" value={String(missions.length)} sub="priority workstreams" tone={C.cyan}/>
          <Metric icon={ShieldCheck} label="Control mode" value="ON" sub="owner approvals" tone={C.amber}/>
          <Metric icon={Gauge} label="Operating mode" value="LIVE" sub="one command layer" tone={C.orange}/>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, margin: '18px 2px 9px' }}>
          <div style={sectionLabel}><Target size={14}/> MISSION CONTROL</div>
          <Link href="/execution" style={{ color: C.cyan, fontSize: 11, fontWeight: 900, textDecoration: 'none' }}>OPEN EXECUTION <ArrowRight size={12} style={{verticalAlign:'middle'}}/></Link>
        </div>
        <div className="ar-missions" style={{ display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 10 }}>
          {missions.map((m, i) => { const Icon=m.icon; return <Link href={m.href} className="ar-card" key={m.title} style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: 16, padding: 15, color: C.text, textDecoration: 'none', display: 'grid', gridTemplateColumns: '42px 1fr auto', alignItems: 'center', gap: 11 }}>
            <div style={{ width: 42, height: 42, borderRadius: 12, background: '#102338', display: 'grid', placeItems: 'center', color: i % 2 ? C.mint : C.cyan }}><Icon size={20}/></div>
            <div><strong style={{ fontSize: 14 }}>{m.title}</strong><div style={{ color: C.muted, fontSize: 11, marginTop: 4, lineHeight: 1.4 }}>{m.meta}</div></div>
            <span style={{ alignSelf: 'start', fontSize: 8, color: m.status==='PRIORITY'?C.orange:C.mint, fontWeight: 1000, letterSpacing: '.08em', border: `1px solid ${m.status==='PRIORITY'?C.orange+'55':C.mint+'44'}`, padding: '4px 6px', borderRadius: 99 }}>{m.status}</span>
          </Link>})}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '18px 2px 9px' }}><div style={sectionLabel}><Sparkles size={14}/> EXECUTIVE MODULES</div></div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 8 }}>
          {systemLinks.map(([h,t],i) => <Link className="ar-card" key={h} href={h} style={{ padding: 12, minHeight: 72, border: `1px solid ${C.line}`, borderRadius: 13, background: '#0A1624', textDecoration: 'none', color: C.text, display:'flex', flexDirection:'column', justifyContent:'space-between' }}><span style={{color:[C.cyan,C.mint,C.amber,C.orange][i%4],fontSize:9,fontWeight:950}}>0{i+1}</span><strong style={{fontSize:12}}>{t}</strong></Link>)}
        </div>
      </section>

      <aside className="ar-right" style={{ display: 'grid', gap: 12, alignContent: 'start', position: 'sticky', top: 82 }}>
        <div className="ar-panel" style={{ borderRadius: 18, padding: 14 }}>
          <div style={sectionLabel}><Activity size={14}/> OPERATIONS</div>
          <div style={{ display: 'grid', gap: 10, marginTop: 12 }}>
            <Ops icon={Mail} title="Communications" text="Email command center" href="/email"/>
            <Ops icon={CheckCircle2} title="Approvals" text="Owner control gates" href="/controls"/>
            <Ops icon={CircleDollarSign} title="Capital" text="Finance + investor intel" href="/finance"/>
            <Ops icon={BriefcaseBusiness} title="Deals" text="Acquisition pipeline" href="/acquisitions/pipeline"/>
          </div>
        </div>

        <div className="ar-panel" style={{ borderRadius: 18, padding: 14 }}>
          <div style={sectionLabel}><Radio size={14}/> SYSTEM MAP</div>
          <div style={{ borderLeft: `1px solid ${C.line}`, margin: '13px 0 2px 8px', paddingLeft: 14, display: 'grid', gap: 15 }}>
            <Timeline title="Command" text="You give Eva the objective." tone={C.cyan}/>
            <Timeline title="Route" text="The request moves to the right executive module." tone={C.mint}/>
            <Timeline title="Control" text="Consequential actions stop at owner approval." tone={C.amber}/>
            <Timeline title="Execute" text="Approved work moves into execution." tone={C.orange}/>
          </div>
        </div>

        <div style={{ borderRadius: 18, padding: 15, background: 'linear-gradient(145deg,#15304C,#0A1624)', border: '1px solid #315576' }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', color: C.cyan, fontSize: 10, fontWeight: 1000 }}><Sparkles size={14}/> EVA QUICK START</div>
          <p style={{ color: '#C2D0DF', lineHeight: 1.55, fontSize: 12 }}>Try: “Find campus investors,” “check my email,” “build today’s CEO brief,” or “open the acquisition pipeline.”</p>
          <button onClick={() => { setCommand('Build today’s CEO brief and show me the three most important actions.'); window.scrollTo({top:0,behavior:'smooth'}); }} style={{ width:'100%', border:0, borderRadius:10, padding:'10px 12px', background:C.cyan, color:'#06202A', fontWeight:950, cursor:'pointer' }}>LOAD A COMMAND</button>
        </div>
      </aside>
    </div>
  </main>;
}

const iconBtn = { width: 36, height: 36, borderRadius: 10, display: 'grid', placeItems: 'center', background: '#0E1B2A', color: C.text, border: `1px solid ${C.line}`, cursor: 'pointer' } as const;
const sectionLabel = { display: 'flex', alignItems: 'center', gap: 7, color: '#B9CADB', fontSize: 10, fontWeight: 1000, letterSpacing: '.11em' } as const;

function Metric({icon:Icon,label,value,sub,tone}:{icon:any;label:string;value:string;sub:string;tone:string}) {
  return <div className="ar-panel" style={{borderRadius:14,padding:13,minWidth:0}}><div style={{display:'flex',justifyContent:'space-between',gap:8,alignItems:'center'}}><span style={{color:C.muted,fontSize:9,fontWeight:950,letterSpacing:'.08em'}}>{label.toUpperCase()}</span><Icon size={15} color={tone}/></div><div style={{fontSize:25,fontWeight:1000,marginTop:7}}>{value}</div><div style={{color:C.muted,fontSize:9,marginTop:2}}>{sub}</div></div>
}
function Ops({icon:Icon,title,text,href}:{icon:any;title:string;text:string;href:string}) {
  return <Link href={href} className="ar-card" style={{display:'grid',gridTemplateColumns:'34px 1fr auto',gap:9,alignItems:'center',textDecoration:'none',color:C.text,padding:9,border:`1px solid ${C.line}`,borderRadius:12,background:'#091522'}}><div style={{width:34,height:34,borderRadius:9,background:'#102338',display:'grid',placeItems:'center',color:C.cyan}}><Icon size={16}/></div><div><strong style={{fontSize:12}}>{title}</strong><div style={{fontSize:9,color:C.muted,marginTop:2}}>{text}</div></div><ArrowRight size={13} color={C.muted}/></Link>
}
function Timeline({title,text,tone}:{title:string;text:string;tone:string}) {return <div style={{position:'relative'}}><span style={{position:'absolute',left:-19,top:3,width:8,height:8,borderRadius:99,background:tone,boxShadow:`0 0 10px ${tone}`}}/><strong style={{fontSize:11}}>{title}</strong><div style={{fontSize:10,color:C.muted,lineHeight:1.5,marginTop:3}}>{text}</div></div>}
