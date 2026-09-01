import Link from 'next/link';
import {
  ArrowRight,
  BadgeDollarSign,
  CheckCircle2,
  ClipboardCheck,
  Database,
  Droplets,
  FileText,
  Handshake,
  Landmark,
  Leaf,
  MapPinned,
  Network,
  ShieldCheck,
  Sprout,
  Users,
} from 'lucide-react';

const pilot = [
  ['Week 0–2', 'Co-design', 'Map the current rancher-network workflow, regions, partner handoffs, grant obligations, data permissions and the minimum information field staff actually need.'],
  ['Week 2–4', 'Configure', 'Set up producer intake, network circles, action queue, water/drought profile, funding tracker, grant-compliance milestones and leadership reporting.'],
  ['Week 5–10', 'Run', 'Onboard a 25–50 rancher pilot cohort with selected TNC staff and partners. Track use, friction, relationship follow-up and program actions.'],
  ['Week 11–13', 'Evaluate', 'Compare baseline vs. pilot workflow: follow-up speed, reporting burden, producer engagement, funding opportunities surfaced and grant-evidence completeness.'],
];

const metrics = [
  ['Producer engagement', 'Percent of participating ranchers with a current action plan and agreed next step'],
  ['Follow-up speed', 'Median time from producer conversation to assigned action / partner handoff'],
  ['Network activation', 'Peer introductions, technical-assistance matches and completed partner connections'],
  ['Funding conversion', 'Eligible opportunities surfaced, applications started and awards where measurable'],
  ['Grant compliance', 'Deliverables on time, evidence completeness and overdue action reduction'],
  ['Water resilience', 'Ranches with baseline water risks documented and prioritized resilience actions'],
  ['Staff efficiency', 'Administrative/reporting time reduced or redirected to producer-facing work'],
  ['Trust + usefulness', 'Producer and field-staff willingness to continue using the workflow'],
];

const layers = [
  [Users, 'Rancher relationship layer', 'Producer goals, contact history, permissions, trusted relationships, peer mentors and next actions.'],
  [Leaf, 'Grazing + land layer', 'Plans, rest periods, infrastructure, field observations and program-specific outcome indicators.'],
  [Droplets, 'Water + drought layer', 'Wells, tanks, troughs, shortages, drought triggers, water projects and resilience priorities.'],
  [BadgeDollarSign, 'Funding layer', 'Public grants, cost share, conservation finance, sponsor programs and capital planning.'],
  [ClipboardCheck, 'Agreement + grant layer', 'Deliverables, match requirements, deadlines, evidence, invoices, reporting and ownership.'],
  [Database, 'Network intelligence layer', 'Aggregate learning across regions without exposing private producer data.'],
  [ShieldCheck, 'Governance layer', 'Permissioned sharing, data retention, Tribal data-sovereignty requirements and auditability.'],
  [MapPinned, 'Landscape layer', 'Regional initiatives, Sentinel Landscapes / REPI-compatible work, habitat and compatible land-use programs.'],
];

export default function RancherNetworkProposalPage() {
  return (
    <main style={{ minHeight:'100vh', background:'#f4f1e8', color:'#18251d', fontFamily:'Arial,sans-serif' }}>
      <section style={{ background:'#102d25', color:'#fff', padding:'16px 18px' }}><div style={{ maxWidth:1180, margin:'auto', display:'flex', justifyContent:'space-between', alignItems:'center', gap:12, flexWrap:'wrap' }}><div><strong>ARIDON AG</strong> · Rancher Network Proposal</div><div style={{ display:'flex', gap:12 }}><Link href="/ag/rancher-network" style={{ color:'#c8e2ac', fontWeight:900, textDecoration:'none' }}>Live network</Link><Link href="/ag" style={{ color:'#fff', fontWeight:850, textDecoration:'none' }}>Aridon Ag</Link></div></div></section>

      <section style={{ maxWidth:1180, margin:'auto', padding:'64px 18px 48px', display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(min(100%,360px),1fr))', gap:28, alignItems:'center' }}>
        <div>
          <div style={{ color:'#356943', fontSize:12, fontWeight:950, letterSpacing:1 }}>PROPOSAL FOR DISCUSSION · THE NATURE CONSERVANCY RGL</div>
          <h1 style={{ fontSize:'clamp(48px,7vw,78px)', lineHeight:.96, letterSpacing:-2.5, margin:'12px 0 20px' }}>Give rancher networks an operating layer without taking the rancher out of the center.</h1>
          <p style={{ color:'#556159', fontSize:20, lineHeight:1.65, maxWidth:820 }}>Aridon proposes a 90-day pilot of the Rancher Network OS to help regenerative grazing teams coordinate producer relationships, peer networks, water and drought resilience, funding, agreements, field outcomes and grant reporting across regions.</p>
        </div>
        <aside style={{ background:'#163d2a', color:'#fff', borderRadius:23, padding:23, boxShadow:'0 20px 60px rgba(22,61,42,.18)' }}>
          <Handshake size={34} color="#c8e2ac" />
          <div style={{ color:'#c8e2ac', fontSize:11, fontWeight:950, marginTop:10 }}>THE PITCH IN ONE SENTENCE</div>
          <h2 style={{ fontSize:35, lineHeight:1.08, margin:'7px 0 12px' }}>You already have the trust, science and field teams. Aridon helps the network carry the work farther.</h2>
          <p style={{ color:'#dbe8df', lineHeight:1.65, margin:0 }}>We are not proposing to replace TNC staff, rancher-led groups or local knowledge. We are proposing software and workflow infrastructure that reduces the administrative drag between a rancher conversation and a funded, documented, measurable action.</p>
        </aside>
      </section>

      <section style={{ background:'#fff', borderTop:'1px solid #d7dfd4', borderBottom:'1px solid #d7dfd4', padding:'52px 18px' }}>
        <div style={{ maxWidth:1180, margin:'auto' }}>
          <div style={{ color:'#356943', fontSize:12, fontWeight:950 }}>WHY THIS IS ALIGNED</div>
          <h2 style={{ fontSize:'clamp(36px,5vw,55px)', margin:'8px 0 18px' }}>Build around TNC’s stated rancher-network strategy, not around our product menu.</h2>
          <p style={{ color:'#5c675f', fontSize:17, lineHeight:1.65, maxWidth:930 }}>TNC publicly says its North America Regenerative Grazing Lands strategy aims by 2030 to protect and improve 240 million acres of grazing lands, protect 57 million at-risk acres from conversion and avoid or sequester 7.3 million metric tons of CO₂ per year. It also says a core action is strengthening, connecting and activating local and regional rancher-led networks while helping producers access technical expertise, financial resources and technology. That is the exact workflow this pilot is designed around.</p>
          <div style={{ display:'flex', gap:10, flexWrap:'wrap', marginTop:15 }}><a href="https://www.nature.org/en-us/what-we-do/our-priorities/provide-food-and-water-sustainably/food-and-water-stories/sustainable-grazing-lands/" target="_blank" rel="noreferrer" style={{ color:'#356943', fontWeight:900 }}>TNC Regenerative Grazing Lands strategy ↗</a><a href="https://www.repi.mil/Landscape-Partnerships/Sentinel-Landscapes-Partnership/" target="_blank" rel="noreferrer" style={{ color:'#356943', fontWeight:900 }}>Sentinel Landscapes framework ↗</a></div>
        </div>
      </section>

      <section style={{ maxWidth:1180, margin:'auto', padding:'56px 18px' }}>
        <div style={{ color:'#356943', fontSize:12, fontWeight:950 }}>WHAT WE WOULD DEMONSTRATE</div>
        <h2 style={{ fontSize:'clamp(36px,5vw,55px)', margin:'8px 0 20px' }}>Eight connected layers, one producer-centered record.</h2>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(250px,1fr))', gap:10 }}>{layers.map(([Icon, title, text]) => { const C=Icon as typeof Users; return <article key={String(title)} style={{ background:'#fff', border:'1px solid #d7dfd4', borderRadius:16, padding:17 }}><C size={26} color="#356943"/><h3 style={{ fontSize:22, margin:'9px 0 5px' }}>{String(title)}</h3><p style={{ color:'#5e6962', lineHeight:1.5, margin:0 }}>{String(text)}</p></article>; })}</div>
      </section>

      <section style={{ background:'#102d25', color:'#fff', padding:'56px 18px' }}>
        <div style={{ maxWidth:1180, margin:'auto' }}>
          <div style={{ color:'#c8e2ac', fontSize:12, fontWeight:950 }}>90-DAY PILOT</div>
          <h2 style={{ fontSize:'clamp(38px,5vw,58px)', margin:'8px 0 22px' }}>Start small enough to learn, large enough to matter.</h2>
          <div style={{ display:'grid', gap:10 }}>{pilot.map(([time, title, text], i) => <div key={title} style={{ display:'grid', gridTemplateColumns:'105px minmax(180px,250px) 1fr', gap:14, background:'#173a30', border:'1px solid #2a5243', borderRadius:14, padding:15, alignItems:'start' }}><div style={{ width:42, height:42, borderRadius:99, display:'grid', placeItems:'center', background:'#c8e2ac', color:'#102d25', fontWeight:950 }}>{i+1}</div><div><div style={{ color:'#c8e2ac', fontSize:11, fontWeight:950 }}>{time}</div><strong style={{ fontSize:20 }}>{title}</strong></div><div style={{ color:'#dbe8df', lineHeight:1.55 }}>{text}</div></div>)}</div>
        </div>
      </section>

      <section style={{ maxWidth:1180, margin:'auto', padding:'56px 18px' }}>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(310px,1fr))', gap:15 }}>
          <article style={{ background:'#fff', border:'1px solid #d7dfd4', borderRadius:20, padding:21 }}>
            <Landmark size={29} color="#356943"/><div style={{ color:'#356943', fontSize:11, fontWeight:950, marginTop:10 }}>PROPOSED PILOT SCOPE</div><h2 style={{ fontSize:31, margin:'6px 0 10px' }}>25–50 ranchers · 2–3 priority regions · 90 days</h2>
            <ul style={{ color:'#556159', lineHeight:1.65, paddingLeft:19 }}><li>6–12 TNC / partner staff users</li><li>Producer intake and permission framework</li><li>Rancher network / peer-circle workflow</li><li>Water and drought resilience profile</li><li>Funding and agreement tracker</li><li>Grant deliverables and evidence queue</li><li>Leadership dashboard and closeout report</li></ul>
          </article>
          <article style={{ background:'#e6ecdf', border:'1px solid #d3ddcf', borderRadius:20, padding:21 }}>
            <BadgeDollarSign size={29} color="#356943"/><div style={{ color:'#356943', fontSize:11, fontWeight:950, marginTop:10 }}>COMMERCIAL PROPOSAL</div><h2 style={{ fontSize:31, margin:'6px 0 10px' }}>$50,000 fixed-fee pilot</h2>
            <p style={{ color:'#556159', lineHeight:1.6 }}>Planning price for the defined 90-day pilot, including configuration, onboarding, staff training, cohort support, workflow refinement, dashboard and final evaluation. Travel, third-party data, field hardware or custom integrations would be separately approved before expense.</p>
            <p style={{ color:'#556159', lineHeight:1.6, marginBottom:0 }}><strong>Scale decision:</strong> if the pilot earns expansion, price the multi-state enterprise program from actual usage and support requirements rather than guessing today.</p>
          </article>
        </div>
      </section>

      <section style={{ background:'#fff', borderTop:'1px solid #d7dfd4', borderBottom:'1px solid #d7dfd4', padding:'54px 18px' }}>
        <div style={{ maxWidth:1180, margin:'auto' }}>
          <div style={{ color:'#356943', fontSize:12, fontWeight:950 }}>SUCCESS SCORECARD</div>
          <h2 style={{ fontSize:'clamp(36px,5vw,54px)', margin:'8px 0 20px' }}>Judge us on whether the network gets easier to run.</h2>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(260px,1fr))', gap:10 }}>{metrics.map(([title, text]) => <article key={title} style={{ background:'#faf9f4', border:'1px solid #dde3d8', borderRadius:15, padding:16 }}><CheckCircle2 size={23} color="#356943"/><h3 style={{ fontSize:20, margin:'8px 0 5px' }}>{title}</h3><p style={{ color:'#626d65', lineHeight:1.5, margin:0 }}>{text}</p></article>)}</div>
        </div>
      </section>

      <section style={{ maxWidth:1180, margin:'auto', padding:'56px 18px' }}>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(300px,1fr))', gap:15 }}>
          <article style={{ background:'#fff', border:'1px solid #d7dfd4', borderRadius:20, padding:21 }}><ShieldCheck size={29} color="#356943"/><div style={{ color:'#356943', fontSize:11, fontWeight:950, marginTop:10 }}>NON-NEGOTIABLE</div><h2 style={{ fontSize:30, margin:'6px 0 10px' }}>Ranchers control their information.</h2><p style={{ color:'#58635c', lineHeight:1.6 }}>Private ranch-level data should remain permissioned. Public or leadership reporting defaults to aggregate information unless the producer has approved attribution. Tribal participants require governance aligned with the participating Nation’s data-sovereignty requirements.</p></article>
          <article style={{ background:'#163d2a', color:'#fff', borderRadius:20, padding:21 }}><Network size={29} color="#c8e2ac"/><div style={{ color:'#c8e2ac', fontSize:11, fontWeight:950, marginTop:10 }}>THE STRATEGIC UPSIDE</div><h2 style={{ fontSize:30, margin:'6px 0 10px' }}>The network becomes institutional memory.</h2><p style={{ color:'#dce8e0', lineHeight:1.6 }}>Staff turnover no longer erases relationship history. A rancher does not have to retell the entire story every time a program changes. Leaders can see where networks are thriving, where grants are slipping and where producers need help, without flattening local judgment.</p></article>
        </div>
      </section>

      <section style={{ background:'#e6ecdf', padding:'56px 18px' }}>
        <div style={{ maxWidth:980, margin:'auto' }}>
          <div style={{ color:'#356943', fontSize:12, fontWeight:950 }}>HOW TO PRESENT IT</div>
          <h2 style={{ fontSize:'clamp(38px,5vw,58px)', margin:'8px 0 20px' }}>Do not lead with “AI.” Lead with the job they are already trying to do.</h2>
          <div style={{ display:'grid', gap:10 }}>
            {[
              ['1. Open with their mission', '“Your rancher-network strategy depends on trusted local relationships, multi-state coordination, funding and measurable outcomes. We built an operating layer around that work.”'],
              ['2. Show the live rancher journey', 'Use one fictional ranch from intake → water risk → peer match → funding → project → grant evidence. Make the workflow visible in under five minutes.'],
              ['3. Show the manager view', 'Switch to the action queue and show how overdue deliverables, producer follow-ups, funding matches and regional risks surface automatically.'],
              ['4. Make a small ask', 'Do not ask for national deployment. Ask for a 90-day, 25–50 rancher pilot in two or three priority regions with a jointly agreed scorecard.'],
              ['5. End on trust', 'Say explicitly that Aridon does not replace ranchers, field staff, science or local knowledge. It keeps those relationships from being buried under administrative work.'],
            ].map(([title, text]) => <div key={title} style={{ background:'#fff', border:'1px solid #d4ddd0', borderRadius:14, padding:15 }}><strong style={{ fontSize:18 }}>{title}</strong><div style={{ color:'#5d6861', lineHeight:1.55, marginTop:5 }}>{text}</div></div>)}
          </div>
        </div>
      </section>

      <section style={{ maxWidth:900, margin:'auto', padding:'58px 18px 72px', textAlign:'center' }}>
        <FileText size={34} color="#356943" />
        <div style={{ color:'#356943', fontSize:12, fontWeight:950, marginTop:9 }}>THE ASK</div>
        <h2 style={{ fontSize:'clamp(38px,5vw,58px)', margin:'8px 0 14px' }}>Give us 30 minutes to show the workflow and choose a pilot region together.</h2>
        <p style={{ color:'#5d6861', fontSize:17, lineHeight:1.65 }}>The first conversation should be with Regenerative Grazing Lands strategy leadership and the rancher-network / collaborative-conservation team. If the workflow resonates, bring in grants, data/governance and one or two state or initiative-area staff to co-design the pilot.</p>
        <Link href="/ag/rancher-network" style={{ display:'inline-flex', alignItems:'center', gap:8, marginTop:13, background:'#163d2a', color:'#fff', padding:'14px 17px', borderRadius:11, textDecoration:'none', fontWeight:950 }}>Open the live network <ArrowRight size={18}/></Link>
        <div style={{ marginTop:18, color:'#788078', fontSize:11, lineHeight:1.5 }}>Concept for discussion only. This page does not imply endorsement, partnership or procurement by The Nature Conservancy, the Department of Defense, Sentinel Landscapes, REPI or any rancher organization. The $50,000 pilot figure is an Aridon planning offer subject to final scope and contracting.</div>
      </section>
    </main>
  );
}
