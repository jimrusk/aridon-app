import Link from 'next/link';
import {
  ArrowRight,
  BadgeDollarSign,
  BarChart3,
  CheckCircle2,
  CloudRain,
  Database,
  Droplets,
  FlaskConical,
  Handshake,
  Landmark,
  Leaf,
  Microscope,
  Network,
  ShieldCheck,
  Sprout,
  Users,
  Waves,
  Wrench,
} from 'lucide-react';

const budget = [
  ['Manufacturing feasibility + 30% engineering', '$40,000', 'Reference climate, DFM/DFA, controls, instrumentation, risk register and prototype work breakdown.'],
  ['AWG-1000 prototype fabrication + commissioning', '$330,000', 'Planning allowance within Aridon’s existing first-prototype engineering envelope; final amount requires vendor quotation.'],
  ['Field instrumentation + site preparation', '$70,000', 'Flow and power metering, weather station, root-zone sensors, telemetry, installation, storage and site integration.'],
  ['Independent university / third-party validation', '$60,000', 'Protocol review, sampling, data QA, statistical review and independent technical memorandum.'],
  ['Producer participation + co-design stipends', '$40,000', 'Support for a 25–50 producer learning cohort and farmer time spent on structured feedback and field validation.'],
  ['Aridon software, onboarding + data operations', '$55,000', 'Aridon Ag access, training, office hours, pilot dashboard, data provenance and aggregate reporting.'],
  ['Water-quality laboratory program', '$20,000', 'Baseline and operating-period testing under the intended-use protocol.'],
  ['Travel, training + O&M readiness', '$20,000', 'Field visits, operator training, maintenance documentation and closeout support.'],
  ['Pilot contingency', '$65,000', 'Approximately 10% program reserve for site, procurement, test and commissioning uncertainty.'],
];

const roles = [
  {
    name: 'Aridon', icon: FlaskConical,
    role: 'Program integrator and technology lead',
    items: ['Lead R&D architecture and field protocol development', 'Provide Aridon Ag decision and data layer', 'Coordinate AWG engineering/manufacturing work', 'Operate the evidence trail and final replication package'],
  },
  {
    name: 'Food Security Leadership Council', icon: Landmark,
    role: 'Policy and R&D alignment partner',
    items: ['Pressure-test the demonstration against national agricultural R&D priorities', 'Connect the pilot to the broader sustainable-productivity conversation', 'Help identify relevant public R&D, policy and research pathways', 'Participate in final policy / replication briefing if mutually agreed'],
  },
  {
    name: 'Food Tank', icon: Network,
    role: 'Convening, farmer voice and public-learning partner',
    items: ['Help keep farmer needs and relationships at the center of the technology program', 'Connect researchers, producers, funders and food-system leaders where appropriate', 'Support a transparent public-learning format after evidence is reviewed', 'Explore event, editorial or convening opportunities without presuming coverage or endorsement'],
  },
  {
    name: 'University / independent verifier', icon: Microscope,
    role: 'Independent protocol and evidence partner',
    items: ['Review measurement protocol before deployment', 'Validate water, energy, agronomic and economic methods', 'Audit data quality and missing-data treatment', 'Issue or co-author an independent technical memorandum subject to agreement'],
  },
  {
    name: 'Producer + tribal / rural partners', icon: Users,
    role: 'Co-designers and field hosts',
    items: ['Define the practical problem before technology is deployed', 'Approve data permissions and trial boundaries', 'Operate or host field equipment where appropriate', 'Evaluate maintenance burden, usefulness and adoption fit'],
  },
  {
    name: 'Engineering / manufacturing partner', icon: Wrench,
    role: 'Prototype engineering and integration',
    items: ['Complete feasibility / DFM phase before fabrication authorization', 'Engineer, fabricate and factory-test the prototype', 'Support commissioning and corrective actions', 'Document repeat-build requirements and serviceability'],
  },
];

const phases = [
  ['0–6 weeks', 'Co-design + protocol', 'Confirm host sites, farmer priorities, intended water use, baseline plan, data rights, reference climate and independent-verification protocol.'],
  ['Months 1–3', 'Engineering + baseline', 'Run paid DFM/engineering work while the producer cohort establishes operational, water, soil, energy and economic baselines.'],
  ['Months 3–5', 'Fabrication + site readiness', 'Build the instrumented prototype, prepare storage/treatment interfaces, install field sensors and complete factory acceptance testing.'],
  ['Month 6', 'Commissioning', 'Site acceptance testing, water-quality release for the approved intended use, operator training and baseline lock.'],
  ['Months 6–11', '180-day field demonstration', 'Operate the controlled trial, preserve raw evidence, document maintenance and compare baseline, precision-water and integrated arms.'],
  ['Month 12', 'Independent review + scale decision', 'Produce the technical memorandum, farmer/economic report, public-learning summary and a go / redesign / stop recommendation.'],
];

const metrics = [
  ['Water production', 'Verified gallons or liters per day; production by temperature, dew point and humidity band'],
  ['Energy intensity', 'kWh per liter / gallon; total operating energy; energy-cost sensitivity'],
  ['Water quality', 'Lab results, treatment performance and intended-use compliance pathway'],
  ['Reliability', 'Uptime, faults, maintenance events, consumables and service hours'],
  ['Root-zone efficiency', 'Gallons per acre, irrigation events, pump kWh, root-zone stress hours and crop response'],
  ['Farm economics', 'Profit per acre, water/energy cost per acre, administrative time, labor and input opportunities'],
  ['Farmer usefulness', 'Adoption, trust, maintenance burden, willingness to continue and willingness to host replication'],
  ['Early warning', 'Lead time, false-alert rate and whether alerts caused useful producer action where that module is tested'],
];

function Pill({ children }: { children: React.ReactNode }) {
  return <span style={{ display:'inline-flex', alignItems:'center', padding:'6px 9px', borderRadius:99, background:'#e7efe1', color:'#356943', fontSize:11, fontWeight:950 }}>{children}</span>;
}

export default function FslcFoodTankProposalPage() {
  const total = '$700,000';
  return (
    <main style={{ minHeight:'100vh', background:'#f4f1e8', color:'#18251d', fontFamily:'Arial,sans-serif' }}>
      <style>{`@media print { .no-print { display:none !important; } body { background:#fff !important; } }`}</style>

      <header className="no-print" style={{ background:'#102d25', color:'#fff', padding:'15px 18px' }}>
        <div style={{ maxWidth:1180, margin:'auto', display:'flex', alignItems:'center', justifyContent:'space-between', gap:12, flexWrap:'wrap' }}>
          <div><strong>ARIDON AG</strong> · R&D Partnership Proposal</div>
          <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
            <Link href="/ag/rd" style={{ color:'#c8e2ac', textDecoration:'none', fontWeight:900 }}>R&D Portfolio</Link>
            <Link href="/ag" style={{ color:'#fff', textDecoration:'none', fontWeight:850 }}>Aridon Ag</Link>
          </div>
        </div>
      </header>

      <section style={{ maxWidth:1180, margin:'auto', padding:'62px 18px 44px', display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(min(100%,340px),1fr))', gap:28, alignItems:'center' }}>
        <div>
          <div style={{ color:'#356943', fontSize:12, fontWeight:950, letterSpacing:1 }}>FORMAL CONCEPT FOR DISCUSSION · AUGUST 2026</div>
          <h1 style={{ fontSize:'clamp(46px,7vw,78px)', lineHeight:.96, letterSpacing:-2.8, margin:'12px 0 20px' }}>Southwest Agricultural R&D Demonstration Partnership</h1>
          <p style={{ fontSize:20, lineHeight:1.6, color:'#526058', maxWidth:780 }}>A New Mexico field program designed to turn agricultural R&D priorities into independently measured evidence around water security, farm profitability, soil and root-zone performance, early warning and farmer-centered technology adoption.</p>
          <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginTop:18 }}>
            <Pill>Prepared for FSLC discussion</Pill><Pill>Food Tank discussion</Pill><Pill>New Mexico first</Pill><Pill>Field validation before claims</Pill>
          </div>
        </div>
        <aside style={{ background:'#163d2a', color:'#fff', borderRadius:24, padding:24, boxShadow:'0 18px 60px rgba(22,61,42,.18)' }}>
          <Handshake size={34} color="#c8e2ac" />
          <div style={{ color:'#c8e2ac', fontWeight:950, fontSize:12, marginTop:12 }}>THE PROPOSITION</div>
          <h2 style={{ fontSize:35, lineHeight:1.08, margin:'8px 0 12px' }}>Build one demonstration that researchers, farmers and funders can all interrogate.</h2>
          <p style={{ color:'#dbe8df', lineHeight:1.65, margin:0 }}>Aridon is proposing a 12-month program that combines a 25–50 producer learning cohort with an instrumented 180-day field demonstration. The objective is not to ask partners to accept unverified technology claims. It is to create the evidence needed to decide what deserves scale.</p>
        </aside>
      </section>

      <section style={{ background:'#fff', borderTop:'1px solid #d8e1d5', borderBottom:'1px solid #d8e1d5', padding:'52px 18px' }}>
        <div style={{ maxWidth:1180, margin:'auto' }}>
          <div style={{ color:'#356943', fontSize:12, fontWeight:950 }}>WHY THIS FITS THE MOMENT</div>
          <h2 style={{ fontSize:'clamp(36px,5vw,54px)', margin:'8px 0 22px' }}>The national R&D agenda and the farm problem overlap almost perfectly.</h2>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(250px,1fr))', gap:12 }}>
            {[
              [Landmark, 'Sustainable productivity', 'FSLC is calling for major new public agricultural R&D investment oriented toward sustainable productivity and farmer profitability. The proposed demonstration is structured to produce field evidence, not marketing claims.'],
              [Droplets, 'Well-managed water', 'Water scarcity is a direct operating constraint across the Southwest. The pilot tests supplemental production, precision irrigation, storage, water-quality verification and water-security decisions together.'],
              [Sprout, 'Healthy soil + root zone', 'RootIQ and the Soil Water Battery research track focus on the actual root zone, irrigation timing, soil moisture and crop response rather than dashboard activity alone.'],
              [Database, 'Public data + early warning', 'The evidence architecture is designed for permissioned, auditable field data and can support regional early-warning research without exposing private farm information.'],
              [Users, 'Technology shaped by farmers', 'Food Tank’s recent technology framing emphasizes solving real producer problems and centering relationships. The pilot begins with co-design, farmer permissions and compensated producer participation.'],
              [BarChart3, 'Profitability as an endpoint', 'The Farm Profit Digital Twin connects water, energy, labor, inputs and yield so technical efficiency is evaluated against farmer economics.'],
            ].map(([Icon, title, text]) => {
              const C = Icon as typeof Landmark;
              return <article key={String(title)} style={{ background:'#faf9f4', border:'1px solid #dde3d8', borderRadius:18, padding:18 }}><C size={28} color="#356943"/><h3 style={{ fontSize:23, margin:'11px 0 7px' }}>{String(title)}</h3><p style={{ margin:0, color:'#5a675f', lineHeight:1.55 }}>{String(text)}</p></article>;
            })}
          </div>
        </div>
      </section>

      <section style={{ maxWidth:1180, margin:'auto', padding:'58px 18px' }}>
        <div style={{ color:'#356943', fontSize:12, fontWeight:950 }}>THE FIELD DESIGN</div>
        <h2 style={{ fontSize:'clamp(38px,5vw,58px)', margin:'8px 0 12px' }}>One program, two connected proof layers.</h2>
        <p style={{ maxWidth:850, color:'#5a675f', fontSize:17, lineHeight:1.6 }}>The digital cohort tests whether Aridon helps producers make better business and resilience decisions. The instrumented field demonstration tests the physical water and agronomic technologies under measured Southwest conditions.</p>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(300px,1fr))', gap:14, marginTop:22 }}>
          <article style={{ background:'#fff', border:'1px solid #d8e1d5', borderRadius:20, padding:22 }}><Users size={30} color="#356943"/><div style={{ color:'#356943', fontSize:11, fontWeight:950, marginTop:10 }}>LAYER 1 · 90 DAYS</div><h3 style={{ fontSize:30, margin:'6px 0 10px' }}>25–50 producer learning cohort</h3><p style={{ color:'#5a675f', lineHeight:1.6 }}>Crop, livestock, specialty, irrigated and diversified operations where practical. Aridon leads onboarding, training and office hours. Producers help prioritize the problems worth solving and evaluate usefulness.</p><ul style={{ color:'#526058', lineHeight:1.6, paddingLeft:19 }}><li>Farm profitability and margin visibility</li><li>Water and drought planning usefulness</li><li>Labor, input and administrative opportunities</li><li>Farmer trust, adoption and willingness to continue</li></ul></article>
          <article style={{ background:'#163d2a', color:'#fff', borderRadius:20, padding:22 }}><CloudRain size={30} color="#c8e2ac"/><div style={{ color:'#c8e2ac', fontSize:11, fontWeight:950, marginTop:10 }}>LAYER 2 · 180 DAYS MINIMUM</div><h3 style={{ fontSize:30, margin:'6px 0 10px' }}>Instrumented water-secure farm demonstration</h3><p style={{ color:'#dbe8df', lineHeight:1.6 }}>Use a controlled comparison on one primary field site, with additional rural or tribal participation only by invitation and agreement. Hardware performance remains a design target until measured.</p><ul style={{ color:'#dbe8df', lineHeight:1.6, paddingLeft:19 }}><li>Arm A: current-practice baseline</li><li>Arm B: RootIQ precision-water decision support</li><li>Arm C: RootIQ + Water Independence System + AWG research platform + storage</li><li>Optional modules: early warning, livestock heat/water sentinel, energy-water scheduling</li></ul></article>
        </div>
      </section>

      <section style={{ background:'#102d25', color:'#fff', padding:'58px 18px' }}>
        <div style={{ maxWidth:1180, margin:'auto' }}>
          <div style={{ color:'#c8e2ac', fontSize:12, fontWeight:950 }}>PARTNER ROLES</div>
          <h2 style={{ fontSize:'clamp(38px,5vw,58px)', margin:'8px 0 22px' }}>Nobody has to pretend to be everybody.</h2>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(270px,1fr))', gap:12 }}>
            {roles.map(({ name, icon: Icon, role, items }) => <article key={name} style={{ background:'#173a30', border:'1px solid #2d5547', borderRadius:18, padding:18 }}><Icon size={28} color="#c8e2ac"/><h3 style={{ fontSize:23, margin:'11px 0 4px' }}>{name}</h3><div style={{ color:'#c8e2ac', fontWeight:850, fontSize:13 }}>{role}</div><ul style={{ color:'#dbe8df', lineHeight:1.55, paddingLeft:18 }}>{items.map(item => <li key={item} style={{ marginBottom:6 }}>{item}</li>)}</ul></article>)}
          </div>
        </div>
      </section>

      <section style={{ maxWidth:1180, margin:'auto', padding:'58px 18px' }}>
        <div style={{ color:'#356943', fontSize:12, fontWeight:950 }}>EQUIPMENT + EVIDENCE STACK</div>
        <h2 style={{ fontSize:'clamp(38px,5vw,58px)', margin:'8px 0 20px' }}>Instrument the question before buying the answer.</h2>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(230px,1fr))', gap:11 }}>
          {[
            [CloudRain, 'AWG-1000 research prototype', 'Containerized, instrumented atmospheric-water platform; nominal design objective remains subject to engineering and climate validation.'],
            [Waves, 'Storage + treatment', 'Site-sized tankage, sanitary piping, pumps, treatment / UV and sampling points matched to approved intended use.'],
            [Droplets, 'Water metering', 'Timestamped product-water flow, tank levels, treatment status and water-quality sampling chain.'],
            [BadgeDollarSign, 'Energy metering', 'Dedicated electrical metering so kWh per liter / gallon and operating cost can be calculated without guesswork.'],
            [Leaf, 'Root-zone sensor network', 'Moisture / tension at multiple depths, weather / ET inputs and optional zone-level irrigation control.'],
            [Database, 'Telemetry + provenance', 'Weather, output, energy, alarms, maintenance, irrigation, crop and economic events stored with timestamps and data-quality flags.'],
          ].map(([Icon, title, text]) => { const C=Icon as typeof CloudRain; return <article key={String(title)} style={{ background:'#fff', border:'1px solid #d8e1d5', borderRadius:17, padding:17 }}><C size={27} color="#356943"/><h3 style={{ fontSize:21, margin:'10px 0 6px' }}>{String(title)}</h3><p style={{ color:'#5a675f', lineHeight:1.5, margin:0 }}>{String(text)}</p></article>; })}
        </div>
      </section>

      <section style={{ background:'#fff', borderTop:'1px solid #d8e1d5', borderBottom:'1px solid #d8e1d5', padding:'58px 18px' }}>
        <div style={{ maxWidth:1180, margin:'auto' }}>
          <div style={{ display:'flex', justifyContent:'space-between', gap:18, alignItems:'end', flexWrap:'wrap' }}>
            <div><div style={{ color:'#356943', fontSize:12, fontWeight:950 }}>PROPOSED PROGRAM BUDGET</div><h2 style={{ fontSize:'clamp(38px,5vw,58px)', margin:'8px 0 8px' }}>{total} target capitalization</h2><p style={{ color:'#5a675f', maxWidth:760, lineHeight:1.6, margin:0 }}>A planning budget for consortium formation. The AWG prototype line is not a vendor quote; Aridon’s current engineering package places a first engineered and instrumented prototype in a broad $200,000–$470,000 planning envelope.</p></div>
            <div style={{ background:'#e6efdf', borderRadius:16, padding:'14px 17px', minWidth:250 }}><div style={{ color:'#356943', fontSize:11, fontWeight:950 }}>PROPOSED CAPITAL STACK</div><div style={{ fontWeight:950, fontSize:22, marginTop:4 }}>$550k external R&D / sponsor support</div><div style={{ color:'#526058', fontSize:13, marginTop:5 }}>$100k in-kind site, university, engineering or research contribution target · $50k Aridon in-kind software / program contribution target</div></div>
          </div>
          <div style={{ overflowX:'auto', marginTop:22 }}>
            <table style={{ width:'100%', borderCollapse:'collapse', minWidth:760 }}><thead><tr style={{ textAlign:'left', color:'#356943', fontSize:12 }}><th style={{ padding:'10px 8px', borderBottom:'2px solid #cfd9cc' }}>WORK PACKAGE</th><th style={{ padding:'10px 8px', borderBottom:'2px solid #cfd9cc' }}>PLANNING ALLOWANCE</th><th style={{ padding:'10px 8px', borderBottom:'2px solid #cfd9cc' }}>WHAT IT COVERS</th></tr></thead><tbody>{budget.map(([name, amount, detail]) => <tr key={name}><td style={{ padding:'13px 8px', borderBottom:'1px solid #e2e6de', fontWeight:850 }}>{name}</td><td style={{ padding:'13px 8px', borderBottom:'1px solid #e2e6de', fontWeight:950, whiteSpace:'nowrap' }}>{amount}</td><td style={{ padding:'13px 8px', borderBottom:'1px solid #e2e6de', color:'#5a675f', lineHeight:1.45 }}>{detail}</td></tr>)}</tbody></table>
          </div>
        </div>
      </section>

      <section style={{ maxWidth:1180, margin:'auto', padding:'58px 18px' }}>
        <div style={{ color:'#356943', fontSize:12, fontWeight:950 }}>12-MONTH WORK PLAN</div>
        <h2 style={{ fontSize:'clamp(38px,5vw,58px)', margin:'8px 0 22px' }}>Six gates. Every gate can stop a weak idea.</h2>
        <div style={{ display:'grid', gap:10 }}>{phases.map(([time, title, text], i) => <div key={title} style={{ display:'grid', gridTemplateColumns:'110px minmax(190px,260px) 1fr', gap:14, alignItems:'start', background:'#fff', border:'1px solid #d8e1d5', borderRadius:15, padding:15 }}><div style={{ width:42, height:42, borderRadius:99, display:'grid', placeItems:'center', background:'#e6efdf', color:'#356943', fontWeight:950 }}>{i+1}</div><div><div style={{ color:'#356943', fontSize:11, fontWeight:950 }}>{time}</div><strong style={{ fontSize:19 }}>{title}</strong></div><div style={{ color:'#5a675f', lineHeight:1.55 }}>{text}</div></div>)}</div>
      </section>

      <section style={{ background:'#e6ecdf', padding:'58px 18px' }}>
        <div style={{ maxWidth:1180, margin:'auto' }}>
          <div style={{ color:'#356943', fontSize:12, fontWeight:950 }}>SUCCESS METRICS</div>
          <h2 style={{ fontSize:'clamp(38px,5vw,58px)', margin:'8px 0 22px' }}>The scoreboard is deliberately unforgiving.</h2>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(260px,1fr))', gap:10 }}>{metrics.map(([title, text]) => <article key={title} style={{ background:'#fff', border:'1px solid #d5ddd1', borderRadius:16, padding:16 }}><CheckCircle2 size={22} color="#356943"/><h3 style={{ fontSize:20, margin:'9px 0 5px' }}>{title}</h3><p style={{ color:'#5a675f', margin:0, lineHeight:1.5 }}>{text}</p></article>)}</div>
        </div>
      </section>

      <section style={{ maxWidth:1180, margin:'auto', padding:'58px 18px', display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(290px,1fr))', gap:16 }}>
        <article style={{ background:'#fff', border:'1px solid #d8e1d5', borderRadius:20, padding:22 }}><ShieldCheck size={30} color="#356943"/><div style={{ color:'#356943', fontSize:11, fontWeight:950, marginTop:10 }}>DATA + GOVERNANCE</div><h2 style={{ fontSize:31, margin:'6px 0 10px' }}>Farmer permission is part of the architecture.</h2><ul style={{ color:'#526058', lineHeight:1.6, paddingLeft:19 }}><li>Producer-controlled permission for private operating data</li><li>Aggregate / anonymized reporting by default for public summaries</li><li>Tribal data sovereignty requirements incorporated where applicable</li><li>Measured results and modeled scenarios kept visibly separate</li><li>Raw evidence preserved for independent review under agreed terms</li></ul></article>
        <article style={{ background:'#163d2a', color:'#fff', borderRadius:20, padding:22 }}><Handshake size={30} color="#c8e2ac"/><div style={{ color:'#c8e2ac', fontSize:11, fontWeight:950, marginTop:10 }}>THE ASK</div><h2 style={{ fontSize:31, margin:'6px 0 10px' }}>Form the demonstration consortium, not a press release.</h2><ol style={{ color:'#dbe8df', lineHeight:1.65, paddingLeft:20 }}><li>Hold a 45-minute working session with Aridon, FSLC and Food Tank.</li><li>Select one primary New Mexico field-validation site and the producer-cohort recruitment path.</li><li>Identify the independent research / university verifier and engineering prime.</li><li>Build the $700,000 capitalization stack and launch only after protocol, data rights and success gates are agreed.</li></ol></article>
      </section>

      <section style={{ background:'#fff', borderTop:'1px solid #d8e1d5', padding:'50px 18px' }}>
        <div style={{ maxWidth:980, margin:'auto' }}>
          <div style={{ color:'#356943', fontSize:12, fontWeight:950 }}>CONTACT + DISCUSSION PATH</div>
          <h2 style={{ fontSize:40, margin:'8px 0 16px' }}>Send one concise proposal, then work the room together.</h2>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(260px,1fr))', gap:12 }}>
            <div style={{ background:'#faf9f4', border:'1px solid #dde3d8', borderRadius:16, padding:17 }}><strong>Food Security Leadership Council</strong><div style={{ color:'#5a675f', marginTop:7, lineHeight:1.55 }}>President: Dr. Cary Fowler<br/>Executive Director: Anna Nelson<br/><a href="mailto:info@foodsecurityleadership.org" style={{ color:'#356943', fontWeight:850 }}>info@foodsecurityleadership.org</a></div></div>
            <div style={{ background:'#faf9f4', border:'1px solid #dde3d8', borderRadius:16, padding:17 }}><strong>Food Tank</strong><div style={{ color:'#5a675f', marginTop:7, lineHeight:1.55 }}>President: Danielle Nierenberg<br/><a href="mailto:danielle@foodtank.com" style={{ color:'#356943', fontWeight:850 }}>danielle@foodtank.com</a><br/>202-590-1037</div></div>
            <div style={{ background:'#faf9f4', border:'1px solid #dde3d8', borderRadius:16, padding:17 }}><strong>Aridon</strong><div style={{ color:'#5a675f', marginTop:7, lineHeight:1.55 }}>Jim Rusk<br/><a href="mailto:jimrusk66@gmail.com" style={{ color:'#356943', fontWeight:850 }}>jimrusk66@gmail.com</a><br/><a href="/ag/rd" style={{ color:'#356943', fontWeight:850 }}>Live R&D portfolio</a></div></div>
          </div>
          <div style={{ marginTop:18, padding:15, background:'#eef3e9', borderRadius:14, color:'#526058', lineHeight:1.55 }}><strong style={{ color:'#356943' }}>Proposal status:</strong> Concept for discussion. No FSLC, Food Tank, university, tribal, producer, agency, manufacturer or funding endorsement, commitment or affiliation is represented until separately agreed in writing. Budget figures are planning allowances, not vendor bids. Hardware, water-quality and agronomic performance remain subject to engineering, permitting, intended-use requirements and independent field validation.</div>
        </div>
      </section>

      <section className="no-print" style={{ background:'#102d25', color:'#fff', padding:'48px 18px' }}>
        <div style={{ maxWidth:900, margin:'auto', textAlign:'center' }}><div style={{ color:'#c8e2ac', fontSize:12, fontWeight:950 }}>SUPPORTING TECHNICAL MATERIAL</div><h2 style={{ fontSize:38, margin:'8px 0 12px' }}>The proposal sits on top of the live R&D architecture.</h2><p style={{ color:'#dbe8df', lineHeight:1.6 }}>Review the ten-program portfolio, three-arm field design and interactive water-security scenario before the consortium meeting.</p><Link href="/ag/rd" style={{ display:'inline-flex', alignItems:'center', gap:8, marginTop:12, background:'#c8e2ac', color:'#102d25', padding:'14px 17px', borderRadius:12, fontWeight:950, textDecoration:'none' }}>Open Aridon Ag R&D <ArrowRight size={19}/></Link></div>
      </section>

      <footer style={{ padding:'24px 18px 36px' }}><div style={{ maxWidth:1180, margin:'auto', display:'flex', justifyContent:'space-between', gap:12, flexWrap:'wrap', color:'#657069', fontSize:13 }}><div>Aridon Ag · Southwest Agricultural R&D Demonstration Partnership</div><div>New Mexico first · independent validation · scale only what earns it</div></div></footer>
    </main>
  );
}
