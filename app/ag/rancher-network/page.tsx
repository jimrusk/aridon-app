'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import {
  AlertTriangle,
  BadgeDollarSign,
  CheckCircle2,
  ClipboardCheck,
  Droplets,
  FileText,
  Filter,
  Handshake,
  Landmark,
  Leaf,
  MapPinned,
  Network,
  Plus,
  Search,
  ShieldCheck,
  Sprout,
  Users,
  Waves,
} from 'lucide-react';

type Rancher = {
  id: number;
  name: string;
  operation: string;
  state: string;
  region: string;
  acres: number;
  network: string;
  waterRisk: 'Low' | 'Moderate' | 'High';
  grazingPlan: 'Baseline' | 'In progress' | 'Active';
  funding: string;
  nextAction: string;
  consent: boolean;
};

const seedRanchers: Rancher[] = [
  { id: 1, name: 'Mesa Creek Ranch', operation: 'Cow-calf', state: 'NM', region: 'Southern High Plains', acres: 4200, network: 'Water Resilience Circle', waterRisk: 'High', grazingPlan: 'In progress', funding: 'NRCS / drought resilience screen', nextAction: 'Confirm east-pasture water baseline', consent: true },
  { id: 2, name: 'Red Willow Cattle Co.', operation: 'Cow-calf + hay', state: 'CO', region: 'High Plains', acres: 6100, network: 'Peer Grazing Circle', waterRisk: 'Moderate', grazingPlan: 'Active', funding: 'Working lands opportunity', nextAction: 'Schedule peer-learning review', consent: true },
  { id: 3, name: 'Canyon Wind Ranch', operation: 'Stocker', state: 'AZ', region: 'Southwest', acres: 9800, network: 'Heat + Water Sentinel', waterRisk: 'High', grazingPlan: 'Baseline', funding: 'Sentinel Landscape fit screen', nextAction: 'Map troughs and heat-risk zones', consent: true },
  { id: 4, name: 'Prairie Gate Ranch', operation: 'Cow-calf', state: 'KS', region: 'Flint Hills', acres: 3300, network: 'Grassland Stewardship', waterRisk: 'Low', grazingPlan: 'Active', funding: 'Conservation easement review', nextAction: 'Capture grazing outcome indicators', consent: true },
  { id: 5, name: 'Sage River Livestock', operation: 'Cow-calf + sheep', state: 'NV', region: 'Sagebrush', acres: 12400, network: 'Landscape Resilience', waterRisk: 'Moderate', grazingPlan: 'In progress', funding: 'Rangeland infrastructure screen', nextAction: 'Review fencing and water-capital plan', consent: true },
];

const workQueue = [
  ['Grant deliverable due', 'Canyon Wind Ranch', 'Confirm Sentinel / REPI eligibility evidence before partner review', 'High'],
  ['Water-risk follow-up', 'Mesa Creek Ranch', 'Request pump, trough and well data for east pasture', 'High'],
  ['Peer-learning match', 'Red Willow Cattle Co.', 'Pair with a similar rotation program in the High Plains', 'Medium'],
  ['Outcome evidence', 'Prairie Gate Ranch', 'Collect soil cover, rest-period and stocking notes', 'Medium'],
  ['Capital planning', 'Sage River Livestock', 'Compare water and fencing sequence against available funding', 'Medium'],
];

const grants = [
  ['Working lands resilience', 'Federal / partner', 'Ranch water, grazing infrastructure, habitat', 'Screening'],
  ['Sentinel Landscapes', 'DoD + USDA + DOI partnership', 'Working lands around military landscapes', 'Partner pathway'],
  ['REPI-compatible land protection', 'Department of Defense', 'Compatible land use, resilience and easements', 'Needs project match'],
  ['State drought / water programs', 'State', 'Water efficiency, wells, storage, drought response', 'Rolling scan'],
  ['Private grassland stewardship', 'Foundation / corporate', 'Regenerative grazing, habitat, verification', 'Prospect list'],
];

function StatusPill({ children, tone = 'green' }: { children: React.ReactNode; tone?: 'green' | 'amber' | 'red' | 'gray' }) {
  const styles = {
    green: { background: '#e3efe2', color: '#2e6740' },
    amber: { background: '#f5ead0', color: '#8a621d' },
    red: { background: '#f6ded8', color: '#963f31' },
    gray: { background: '#ecefea', color: '#5b675f' },
  }[tone];
  return <span style={{ ...styles, display:'inline-flex', alignItems:'center', padding:'5px 9px', borderRadius:999, fontSize:11, fontWeight:900 }}>{children}</span>;
}

export default function RancherNetworkPage() {
  const [ranchers, setRanchers] = useState<Rancher[]>(seedRanchers);
  const [query, setQuery] = useState('');
  const [stateFilter, setStateFilter] = useState('All');
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState('');
  const [newState, setNewState] = useState('NM');
  const [newAcres, setNewAcres] = useState('1000');

  const states = useMemo(() => ['All', ...Array.from(new Set(ranchers.map(r => r.state))).sort()], [ranchers]);
  const filtered = useMemo(() => ranchers.filter(r => {
    const q = query.trim().toLowerCase();
    const matchesQ = !q || [r.name, r.operation, r.region, r.network, r.funding].some(v => v.toLowerCase().includes(q));
    const matchesState = stateFilter === 'All' || r.state === stateFilter;
    return matchesQ && matchesState;
  }), [ranchers, query, stateFilter]);

  const totalAcres = ranchers.reduce((sum, r) => sum + r.acres, 0);
  const highWater = ranchers.filter(r => r.waterRisk === 'High').length;
  const activePlans = ranchers.filter(r => r.grazingPlan === 'Active').length;

  function addRancher() {
    const acres = Math.max(0, Number(newAcres) || 0);
    if (!newName.trim()) return;
    setRanchers(prev => [...prev, {
      id: Date.now(),
      name: newName.trim(),
      operation: 'Ranch operation',
      state: newState,
      region: 'New network intake',
      acres,
      network: 'Needs network match',
      waterRisk: 'Moderate',
      grazingPlan: 'Baseline',
      funding: 'Needs funding screen',
      nextAction: 'Complete ranch needs assessment',
      consent: true,
    }]);
    setNewName(''); setNewAcres('1000'); setShowAdd(false);
  }

  return (
    <main style={{ minHeight:'100vh', background:'#f4f1e8', color:'#18251d', fontFamily:'Arial,sans-serif' }}>
      <section style={{ background:'linear-gradient(135deg,#102d25,#1f4a36)', color:'#fff', padding:'56px 18px 46px' }}>
        <div style={{ maxWidth:1180, margin:'auto', display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(min(100%,360px),1fr))', gap:26, alignItems:'center' }}>
          <div>
            <div style={{ color:'#c8e2ac', fontSize:12, fontWeight:950, letterSpacing:1 }}>ARIDON AG · RANCHER NETWORK OS</div>
            <h1 style={{ fontSize:'clamp(46px,7vw,76px)', lineHeight:.96, letterSpacing:-2.4, margin:'12px 0 18px' }}>From rancher relationship to funded, measurable action.</h1>
            <p style={{ color:'#d9e7de', fontSize:19, lineHeight:1.65, maxWidth:780 }}>A network operating layer for regenerative grazing programs: producer intake, peer groups, water and drought risk, funding, agreements, grant deliverables, field outcomes and relationship follow-up in one place.</p>
            <div style={{ display:'flex', flexWrap:'wrap', gap:8, marginTop:18 }}><StatusPill>Producer-first</StatusPill><StatusPill>Permissioned data</StatusPill><StatusPill>Multi-state</StatusPill><StatusPill>Grant-ready</StatusPill></div>
          </div>
          <aside style={{ background:'#fff', color:'#18251d', borderRadius:22, padding:22, boxShadow:'0 18px 55px rgba(0,0,0,.18)' }}>
            <Network size={34} color="#356943" />
            <h2 style={{ fontSize:31, margin:'10px 0 8px' }}>What the network does</h2>
            <p style={{ color:'#5b675f', lineHeight:1.6, margin:0 }}>Every producer gets a relationship record, needs assessment, resilience profile, funding screen, action plan and evidence trail. Program leaders see where help is needed without turning ranchers into rows in a spreadsheet.</p>
            <Link href="/ag/rancher-network/proposal" style={{ display:'inline-flex', marginTop:16, background:'#163d2a', color:'#fff', padding:'12px 14px', borderRadius:10, textDecoration:'none', fontWeight:900 }}>Open TNC proposal →</Link>
          </aside>
        </div>
      </section>

      <section style={{ maxWidth:1180, margin:'-18px auto 0', padding:'0 18px 44px' }}>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(210px,1fr))', gap:10 }}>
          {[
            [Users, String(ranchers.length), 'demo producers'],
            [MapPinned, totalAcres.toLocaleString(), 'acres represented'],
            [Droplets, String(highWater), 'high water-risk ranches'],
            [Leaf, String(activePlans), 'active grazing plans'],
          ].map(([Icon, value, label]) => { const C = Icon as typeof Users; return <article key={String(label)} style={{ background:'#fff', border:'1px solid #d7dfd4', borderRadius:16, padding:17 }}><C size={24} color="#356943"/><div style={{ fontSize:31, fontWeight:950, marginTop:8 }}>{String(value)}</div><div style={{ color:'#667069', fontSize:13 }}>{String(label)}</div></article>; })}
        </div>
      </section>

      <section style={{ maxWidth:1180, margin:'auto', padding:'0 18px 54px' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'end', gap:14, flexWrap:'wrap' }}>
          <div><div style={{ color:'#356943', fontSize:12, fontWeight:950 }}>NETWORK COMMAND CENTER</div><h2 style={{ fontSize:'clamp(34px,5vw,52px)', margin:'7px 0' }}>Rancher relationships, not CRM clutter.</h2></div>
          <button onClick={() => setShowAdd(v => !v)} style={{ display:'inline-flex', alignItems:'center', gap:8, border:0, borderRadius:10, padding:'12px 14px', background:'#163d2a', color:'#fff', fontWeight:900, cursor:'pointer' }}><Plus size={18}/> Add rancher</button>
        </div>

        {showAdd && <div style={{ background:'#fff', border:'1px solid #d7dfd4', borderRadius:16, padding:16, margin:'12px 0 14px', display:'grid', gridTemplateColumns:'2fr 1fr 1fr auto', gap:10 }}>
          <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Ranch / producer name" style={{ padding:12, border:'1px solid #ccd5c9', borderRadius:9 }} />
          <select value={newState} onChange={e => setNewState(e.target.value)} style={{ padding:12, border:'1px solid #ccd5c9', borderRadius:9 }}>{['NM','AZ','CO','NV','TX','KS','OK','MT','WY','SD','ND'].map(s => <option key={s}>{s}</option>)}</select>
          <input value={newAcres} onChange={e => setNewAcres(e.target.value)} inputMode="numeric" placeholder="Acres" style={{ padding:12, border:'1px solid #ccd5c9', borderRadius:9 }} />
          <button onClick={addRancher} style={{ border:0, borderRadius:9, background:'#356943', color:'#fff', padding:'0 16px', fontWeight:900 }}>Add</button>
        </div>}

        <div style={{ display:'grid', gridTemplateColumns:'1fr auto', gap:10, margin:'16px 0 12px' }}>
          <div style={{ position:'relative' }}><Search size={17} style={{ position:'absolute', left:12, top:13, color:'#68726b' }}/><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search ranch, region, funding, network..." style={{ width:'100%', boxSizing:'border-box', padding:'12px 12px 12px 38px', border:'1px solid #cfd7cd', borderRadius:10, background:'#fff' }} /></div>
          <div style={{ display:'flex', alignItems:'center', gap:7, background:'#fff', border:'1px solid #cfd7cd', borderRadius:10, padding:'0 10px' }}><Filter size={16}/><select value={stateFilter} onChange={e => setStateFilter(e.target.value)} style={{ border:0, background:'transparent', padding:'11px 2px', fontWeight:850 }}>{states.map(s => <option key={s}>{s}</option>)}</select></div>
        </div>

        <div style={{ overflowX:'auto', background:'#fff', border:'1px solid #d7dfd4', borderRadius:16 }}>
          <table style={{ width:'100%', minWidth:980, borderCollapse:'collapse' }}>
            <thead><tr style={{ textAlign:'left', color:'#356943', fontSize:11 }}><th style={{ padding:13 }}>RANCH</th><th style={{ padding:13 }}>NETWORK</th><th style={{ padding:13 }}>WATER</th><th style={{ padding:13 }}>GRAZING</th><th style={{ padding:13 }}>FUNDING</th><th style={{ padding:13 }}>NEXT ACTION</th></tr></thead>
            <tbody>{filtered.map(r => <tr key={r.id} style={{ borderTop:'1px solid #e1e6de' }}><td style={{ padding:13 }}><strong>{r.name}</strong><div style={{ color:'#6a736d', fontSize:12, marginTop:3 }}>{r.operation} · {r.state} · {r.acres.toLocaleString()} ac</div></td><td style={{ padding:13 }}><div style={{ fontWeight:850 }}>{r.network}</div><div style={{ color:'#6a736d', fontSize:12 }}>{r.region}</div></td><td style={{ padding:13 }}><StatusPill tone={r.waterRisk === 'High' ? 'red' : r.waterRisk === 'Moderate' ? 'amber' : 'green'}>{r.waterRisk}</StatusPill></td><td style={{ padding:13 }}><StatusPill tone={r.grazingPlan === 'Active' ? 'green' : r.grazingPlan === 'In progress' ? 'amber' : 'gray'}>{r.grazingPlan}</StatusPill></td><td style={{ padding:13, color:'#526058', maxWidth:220 }}>{r.funding}</td><td style={{ padding:13, color:'#526058', maxWidth:240 }}>{r.nextAction}</td></tr>)}</tbody>
          </table>
        </div>
        <div style={{ color:'#798079', fontSize:11, marginTop:8 }}>Demo data only. Real producer records should be added only with the appropriate permissions and program agreements.</div>
      </section>

      <section style={{ background:'#fff', borderTop:'1px solid #d7dfd4', borderBottom:'1px solid #d7dfd4', padding:'54px 18px' }}>
        <div style={{ maxWidth:1180, margin:'auto' }}>
          <div style={{ color:'#356943', fontSize:12, fontWeight:950 }}>PROGRAM WORKFLOW</div>
          <h2 style={{ fontSize:'clamp(36px,5vw,54px)', margin:'8px 0 20px' }}>One rancher, one living action record.</h2>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(235px,1fr))', gap:10 }}>
            {[
              [Users, '1. Listen', 'Capture the producer’s goals, constraints, water situation, grazing realities, succession concerns and what they do not want imposed on them.'],
              [ClipboardCheck, '2. Baseline', 'Build the ranch profile: acres, herds, water, infrastructure, grazing plan, finances, habitat, labor, drought exposure and existing agreements.'],
              [Handshake, '3. Match', 'Connect the rancher to peer networks, technical assistance, conservation partners, funding and proven practices that fit their operation.'],
              [BadgeDollarSign, '4. Fund', 'Rank grants, cost-share, easement, sponsor and financing pathways. Track eligibility, application evidence, match and deadlines.'],
              [Sprout, '5. Implement', 'Turn the chosen strategy into milestones, owner assignments, field tasks, equipment or practice changes and support visits.'],
              [FileText, '6. Prove', 'Track deliverables, maintenance, producer feedback and agreed ecological/economic indicators. Generate grant and partner reports from the evidence trail.'],
            ].map(([Icon, title, text]) => { const C=Icon as typeof Users; return <article key={String(title)} style={{ background:'#faf9f4', border:'1px solid #dde3d8', borderRadius:16, padding:17 }}><C size={26} color="#356943"/><h3 style={{ fontSize:22, margin:'10px 0 6px' }}>{String(title)}</h3><p style={{ color:'#5a675f', lineHeight:1.55, margin:0 }}>{String(text)}</p></article>; })}
          </div>
        </div>
      </section>

      <section style={{ maxWidth:1180, margin:'auto', padding:'56px 18px' }}>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(310px,1fr))', gap:14 }}>
          <article style={{ background:'#102d25', color:'#fff', borderRadius:20, padding:21 }}>
            <AlertTriangle size={28} color="#f1cf82"/><div style={{ color:'#c8e2ac', fontWeight:950, fontSize:11, marginTop:9 }}>ACTION QUEUE</div><h2 style={{ fontSize:30, margin:'6px 0 13px' }}>What needs attention now</h2>
            <div style={{ display:'grid', gap:8 }}>{workQueue.map(([type, ranch, action, priority]) => <div key={type+ranch} style={{ background:'#173a30', border:'1px solid #2c5346', borderRadius:12, padding:12 }}><div style={{ display:'flex', justifyContent:'space-between', gap:8 }}><strong>{type}</strong><StatusPill tone={priority === 'High' ? 'red' : 'amber'}>{priority}</StatusPill></div><div style={{ color:'#c8e2ac', fontSize:12, marginTop:3 }}>{ranch}</div><div style={{ color:'#dce8e1', fontSize:13, marginTop:5, lineHeight:1.45 }}>{action}</div></div>)}</div>
          </article>
          <article style={{ background:'#fff', border:'1px solid #d7dfd4', borderRadius:20, padding:21 }}>
            <Landmark size={28} color="#356943"/><div style={{ color:'#356943', fontWeight:950, fontSize:11, marginTop:9 }}>FUNDING + AGREEMENT DESK</div><h2 style={{ fontSize:30, margin:'6px 0 13px' }}>Turn opportunities into tracked pathways</h2>
            <div style={{ display:'grid', gap:8 }}>{grants.map(([program, source, fit, status]) => <div key={program} style={{ background:'#faf9f4', border:'1px solid #e1e5dd', borderRadius:12, padding:12 }}><div style={{ display:'flex', justifyContent:'space-between', gap:8, alignItems:'start' }}><strong>{program}</strong><StatusPill tone="gray">{status}</StatusPill></div><div style={{ color:'#356943', fontSize:12, marginTop:3, fontWeight:850 }}>{source}</div><div style={{ color:'#667069', fontSize:13, marginTop:5 }}>{fit}</div></div>)}</div>
          </article>
        </div>
      </section>

      <section style={{ background:'#e6ecdf', padding:'54px 18px' }}>
        <div style={{ maxWidth:1180, margin:'auto' }}>
          <div style={{ color:'#356943', fontSize:12, fontWeight:950 }}>MODULES FOR A LARGE RANCHER NETWORK</div>
          <h2 style={{ fontSize:'clamp(36px,5vw,54px)', margin:'8px 0 20px' }}>The operating layer behind the relationship work.</h2>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(250px,1fr))', gap:10 }}>
            {[
              [Network, 'Rancher network graph', 'Local groups, peer mentors, trusted partners, technical-assistance providers and regional programs.'],
              [Droplets, 'Water + drought resilience', 'Wells, tanks, troughs, supply risk, drought triggers, water projects and resilience actions.'],
              [Leaf, 'Grazing plan + outcomes', 'Rest periods, utilization notes, stocking decisions, field observations and agreed outcome indicators.'],
              [BadgeDollarSign, 'Ranch economics', 'Track whether a conservation recommendation supports or harms ranch economics before scaling it.'],
              [ClipboardCheck, 'Grant compliance', 'Milestones, match, receipts, field evidence, reporting dates and partner responsibilities.'],
              [ShieldCheck, 'Data governance', 'Producer permissions, sharing levels, Tribal data sovereignty requirements and audit trail.'],
              [Waves, 'Landscape programs', 'REPI, Sentinel Landscapes, easements, habitat, wildfire, water and compatible-use initiatives.'],
              [CheckCircle2, 'Impact reporting', 'Produce ranch-level private reports and aggregate network reports without exposing private producer data.'],
            ].map(([Icon, title, text]) => { const C=Icon as typeof Network; return <article key={String(title)} style={{ background:'#fff', border:'1px solid #d6ded2', borderRadius:16, padding:17 }}><C size={25} color="#356943"/><h3 style={{ fontSize:21, margin:'9px 0 5px' }}>{String(title)}</h3><p style={{ color:'#5f6962', lineHeight:1.5, margin:0 }}>{String(text)}</p></article>; })}
          </div>
        </div>
      </section>

      <section style={{ maxWidth:900, margin:'auto', padding:'56px 18px 70px', textAlign:'center' }}>
        <div style={{ color:'#356943', fontSize:12, fontWeight:950 }}>NEXT STEP</div>
        <h2 style={{ fontSize:'clamp(38px,6vw,58px)', margin:'8px 0 14px' }}>Present the workflow before the software.</h2>
        <p style={{ color:'#5a675f', fontSize:17, lineHeight:1.65 }}>The strongest pitch is not “buy our ranching software.” It is “you already do relationship-heavy, multi-state work. We built an operating layer around the exact work your team is trying to scale.”</p>
        <Link href="/ag/rancher-network/proposal" style={{ display:'inline-flex', marginTop:14, background:'#163d2a', color:'#fff', padding:'14px 17px', borderRadius:11, fontWeight:950, textDecoration:'none' }}>View the presentation proposal →</Link>
      </section>
    </main>
  );
}
