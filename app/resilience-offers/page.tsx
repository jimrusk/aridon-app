import Link from 'next/link';

const offers = [
  {
    title: 'Municipal & Tribal Water Resilience',
    audience: 'Tribal governments, utilities, municipalities, emergency managers, colleges, clinics, and critical public facilities.',
    problem: 'Communities need dependable supplemental water without increasing pressure on stressed rivers, aquifers, or fragile distribution systems.',
    solution: 'A paid, grant-ready feasibility study for an AWG-1000 pilot integrated with treatment, storage, resilient power, remote monitoring, and long-term operations.',
    outcomes: [
      'Seasonal atmospheric-water production model',
      'Critical-facility demand and storage analysis',
      'Solar, battery, generator, and island-mode architecture',
      'Water-quality, permitting, and verification pathway',
      'Preliminary capital and operating-cost range',
      'Grant-ready scope, schedule, and partner responsibilities',
    ],
  },
  {
    title: 'Data Center Water & Energy Resilience',
    audience: 'Data-center developers, operators, utilities, campuses, economic-development agencies, and infrastructure investors.',
    problem: 'New facilities face growing scrutiny over potable-water demand, grid constraints, cooling reliability, and community impact.',
    solution: 'A site-specific water-positive resilience study combining atmospheric water, closed-loop cooling support, storage, reuse, microgrid power, and measurable water savings.',
    outcomes: [
      'Cooling and non-potable water-demand baseline',
      'AWG production and avoided-water model',
      'Closed-loop cooling and reuse integration options',
      'Power, storage, controls, and flexible-load strategy',
      'Verified gallons produced, saved, or displaced',
      'Pilot economics, deployment phases, and investor narrative',
    ],
  },
  {
    title: 'Remote Industrial & Construction Water',
    audience: 'Industrial operators, oil and gas companies, mines, border and infrastructure contractors, remote work camps, and emergency-response teams.',
    problem: 'Remote projects depend on hauled water or groundwater wells for dust control, washing, workforce needs, and emergency supply.',
    solution: 'A temporary or permanent Water-as-a-Service feasibility package using modular AWG production, storage, treatment, metering, and off-grid power.',
    outcomes: [
      'Daily water-demand and hauled-water cost baseline',
      'Climate-adjusted AWG production forecast',
      'Temporary deployment and site-layout plan',
      'Solar, battery, or generator integration',
      'Metering, water quality, and operating plan',
      'Rental, service-contract, and pilot pricing framework',
    ],
  },
];

const reviews = [
  {
    name: 'Heather',
    role: 'Chief Operating Officer',
    verdict: 'GO, with packaging improvements',
    thought: 'The three-offer structure is operationally smart because one technical core can serve three markets. Each offer now needs a defined intake checklist, owner, timeline, and repeatable delivery workflow so it can move from pitch to paid engagement without reinventing the process.',
    actions: ['Create one standard client intake form', 'Set a 2–4 week delivery schedule', 'Assign a lead executive and project owner'],
  },
  {
    name: 'Ethos',
    role: 'Chief Strategy Officer',
    verdict: 'GO, lead with infrastructure outcomes',
    thought: 'Aridon should avoid presenting itself as merely an AWG vendor. The durable position is distributed water-and-power infrastructure. The municipal offer builds legitimacy, the data-center offer opens strategic capital, and the industrial offer creates a faster commercial path.',
    actions: ['Use “distributed resilience infrastructure” consistently', 'Keep paid feasibility ahead of equipment sales', 'Build one flagship case study per market'],
  },
  {
    name: 'Atlas',
    role: 'Chief Engineering Officer',
    verdict: 'GO, subject to engineering controls',
    thought: 'The package is technically credible only when output remains site-dependent. Every proposal must define reference temperature, absolute humidity, elevation, water quality, energy use, uptime, and storage assumptions. Verification must be designed before the pilot is built.',
    actions: ['Publish a standard measurement protocol', 'State kWh/L and climate assumptions', 'Require independent water-quality and performance testing'],
  },
  {
    name: 'Eva',
    role: 'Chief Compliance Officer',
    verdict: 'GO, with firm risk language',
    thought: 'The feasibility study must clearly separate conceptual estimates from engineering guarantees. Contracts need scope boundaries, data ownership, confidentiality, intended water use, permitting responsibility, change control, and limitations on performance claims.',
    actions: ['Use a mutual NDA before controlled technical release', 'Add assumptions and exclusions to every scope', 'Define ownership of pilot data and intellectual property'],
  },
  {
    name: 'Scout',
    role: 'Chief Growth Officer',
    verdict: 'STRONG GO',
    thought: 'Three doors into the same engine is exactly the right sales architecture. The offers need sharper benefit headlines, a low-friction first call, and a short qualification scorecard. The industrial offer may close fastest; the municipal offer may unlock grants; the data-center offer may create the largest strategic upside.',
    actions: ['Create a one-page flyer for each market', 'Use a 20-minute qualification call', 'Build target lists and tailored outreach sequences'],
  },
  {
    name: 'Ledger',
    role: 'Chief Financial Officer',
    verdict: 'CONDITIONAL GO',
    thought: 'The concept becomes a business when the study has a price, margin, payment schedule, and conversion path into engineering, deployment, and O&M revenue. Avoid free custom engineering. Offer a paid entry product with optional credits toward a later deployment.',
    actions: ['Set fixed-price tiers with deposits', 'Target at least 50% gross margin on studies', 'Price optional engineering, deployment, and O&M phases separately'],
  },
  {
    name: 'Oracle',
    role: 'Chief Intelligence Officer',
    verdict: 'GO, with evidence discipline',
    thought: 'Market signals support all three lanes, but claims should be backed by current sources, competitor benchmarks, and site data. Aridon should maintain a living evidence library covering drought, water costs, data-center demand, AWG performance, grants, and competing technologies.',
    actions: ['Maintain a cited market-evidence file', 'Track competitors and pilot results quarterly', 'Update each offer with sector-specific proof points'],
  },
];

export default function ResilienceOffersPage() {
  return (
    <main style={{minHeight:'100vh',background:'#070b16',color:'#f4f7ff',padding:'32px 20px 80px',fontFamily:'Arial, sans-serif'}}>
      <div style={{maxWidth:1180,margin:'0 auto'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:16,flexWrap:'wrap',marginBottom:28}}>
          <div>
            <div style={{letterSpacing:3,fontWeight:900,color:'#E87722',fontSize:14}}>ARIDON EXECUTIVE SITE</div>
            <h1 style={{fontSize:'clamp(34px,6vw,64px)',lineHeight:1.02,margin:'10px 0'}}>Resilience Feasibility Offers</h1>
            <p style={{maxWidth:820,color:'#aeb9d4',fontSize:18,lineHeight:1.55}}>Three paid entry offers built on one repeatable engineering core: atmospheric water, resilient power, monitoring, verification, and grant-ready deployment planning.</p>
          </div>
          <Link href="/" style={{color:'#fff',textDecoration:'none',border:'1px solid #33405f',padding:'11px 16px',borderRadius:12,background:'#10182b'}}>← Executive Dashboard</Link>
        </div>

        <section style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(290px,1fr))',gap:18,marginBottom:42}}>
          {offers.map((offer, index) => (
            <article key={offer.title} style={{background:'#0e1527',border:'1px solid #263451',borderTop:`4px solid ${['#E87722','#4A90D9','#27AE60'][index]}`,borderRadius:18,padding:24}}>
              <div style={{fontSize:12,fontWeight:800,letterSpacing:1.5,color:'#8fa1c5'}}>OFFER {index+1}</div>
              <h2 style={{fontSize:25,margin:'8px 0 14px'}}>{offer.title}</h2>
              <p style={{color:'#aeb9d4',lineHeight:1.55}}><strong style={{color:'#fff'}}>Best for:</strong> {offer.audience}</p>
              <p style={{color:'#aeb9d4',lineHeight:1.55}}><strong style={{color:'#fff'}}>Problem:</strong> {offer.problem}</p>
              <p style={{color:'#aeb9d4',lineHeight:1.55}}><strong style={{color:'#fff'}}>Aridon solution:</strong> {offer.solution}</p>
              <h3 style={{fontSize:15,marginTop:20}}>Study deliverables</h3>
              <ul style={{paddingLeft:20,color:'#c6d0e7',lineHeight:1.7}}>{offer.outcomes.map(x=><li key={x}>{x}</li>)}</ul>
            </article>
          ))}
        </section>

        <section style={{background:'linear-gradient(135deg,#171126,#101b31)',border:'1px solid #4c3e69',borderRadius:20,padding:26,marginBottom:42}}>
          <div style={{fontSize:12,fontWeight:900,letterSpacing:1.6,color:'#caa8ff'}}>RECOMMENDED COMMERCIAL STRUCTURE</div>
          <h2 style={{fontSize:30,margin:'8px 0 12px'}}>One paid study. Three levels of depth.</h2>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(240px,1fr))',gap:14}}>
            {[
              ['Tier 1 · Qualification','Climate, demand, site, power, and opportunity screen. Fixed scope and fast decision gate.'],
              ['Tier 2 · Grant-Ready Feasibility','Production model, concept layout, power architecture, treatment, storage, budget, risks, and funding alignment.'],
              ['Tier 3 · Pilot Development','Engineer-led design, partner procurement, permitting support, deployment planning, verification protocol, commissioning, and O&M.'],
            ].map(([t,d])=><div key={t} style={{background:'#0b1020',border:'1px solid #303d5b',borderRadius:14,padding:18}}><h3 style={{margin:'0 0 8px'}}>{t}</h3><p style={{margin:0,color:'#aeb9d4',lineHeight:1.5}}>{d}</p></div>)}
          </div>
        </section>

        <section>
          <div style={{fontSize:12,fontWeight:900,letterSpacing:1.6,color:'#E87722'}}>EXECUTIVE TEAM REVIEW</div>
          <h2 style={{fontSize:34,margin:'8px 0 10px'}}>Seven perspectives. One decision.</h2>
          <p style={{color:'#aeb9d4',fontSize:17,marginBottom:22}}>Consensus: proceed, but sell a disciplined paid feasibility product rather than an open-ended promise or free engineering exercise.</p>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(310px,1fr))',gap:16}}>
            {reviews.map(r=>(
              <article key={r.name} style={{background:'#0e1527',border:'1px solid #263451',borderRadius:16,padding:22}}>
                <div style={{display:'flex',justifyContent:'space-between',gap:12,alignItems:'flex-start'}}>
                  <div><h3 style={{fontSize:23,margin:0}}>{r.name}</h3><div style={{color:'#8fa1c5',fontSize:13,marginTop:3}}>{r.role}</div></div>
                  <span style={{fontSize:11,fontWeight:900,color:'#62d68a',border:'1px solid #2f6f48',background:'#10281b',borderRadius:999,padding:'6px 9px',whiteSpace:'nowrap'}}>{r.verdict}</span>
                </div>
                <p style={{color:'#c3cde3',lineHeight:1.58}}>{r.thought}</p>
                <div style={{fontSize:12,fontWeight:900,letterSpacing:1,color:'#8fa1c5'}}>REQUIRED ACTIONS</div>
                <ul style={{paddingLeft:19,color:'#aeb9d4',lineHeight:1.65}}>{r.actions.map(x=><li key={x}>{x}</li>)}</ul>
              </article>
            ))}
          </div>
        </section>

        <section style={{marginTop:42,background:'#10182b',border:'1px solid #2f3d5c',borderRadius:18,padding:24}}>
          <h2 style={{margin:'0 0 10px'}}>Executive decision</h2>
          <p style={{fontSize:19,lineHeight:1.55,margin:'0 0 14px'}}>Approved to advance as Aridon’s front-end commercial offer, subject to fixed pricing, documented assumptions, a standard verification protocol, and contractual controls.</p>
          <p style={{color:'#aeb9d4',margin:0}}>Immediate next build: three one-page market flyers, one intake form, a pricing sheet, and a master scope of work.</p>
        </section>
      </div>
    </main>
  );
}
