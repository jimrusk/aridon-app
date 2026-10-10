'use client';
import Link from 'next/link';

const known=[
 ['Project','Southwest Technology Campus agriculture / processing / cold-storage platform','KNOWN'],
 ['Region','Farmington / Four Corners, New Mexico','KNOWN'],
 ['Planned assets','Meat processing, freezer/cold storage, processing lines, test farms, greenhouse/ag systems','KNOWN'],
 ['Water strategy','AWG + storage + water-efficiency / resilience systems','KNOWN'],
 ['Energy strategy','Campus energy systems including geothermal / solar concepts','KNOWN'],
 ['Producer pipeline','Agriculture pilots and regional producer outreach exist; contracted throughput not yet documented','PARTIAL'],
 ['Buyer/offtake','No signed volume/price commitment loaded into Capital Fit','MISSING'],
 ['Site control','No executed deed/lease/site-control document loaded into Capital Fit','MISSING'],
 ['Construction budget','No decision-grade GC/vendor budget loaded','MISSING'],
 ['Operating model','No final throughput, pricing, EBITDA and staffing model loaded','MISSING'],
 ['Jobs study','No independent direct/indirect job study loaded','MISSING'],
 ['Senior lender terms','No lender term sheet loaded','MISSING'],
 ['Insurance/risk transfer','No project-specific quotes/terms loaded','MISSING'],
 ['Exit/refinance','No committed takeout/refinance path loaded','MISSING'],
];
const opportunities=[
 ['USDA MPPEP Phase 3','Open Sep. 8–Dec. 7, 2026. Relevant if the meat-processing component/applicant meets current eligibility.','LIVE'],
 ['USDA Agriculture Innovation Center','Open Sep. 9, 2026–Jan. 31, 2027; $2.5M program funding, up to $1M grant. Potential fit for producer services/value-added agriculture if entity and program requirements fit.','LIVE'],
 ['USDA Rural Business Development Grant','2026 round closed. Useful future/partner route; for-profit Aridon is not a direct eligible grantee.','WATCH'],
 ['EB-5 rural/job-creation pathway','Screen only. Requires project-specific eligibility, qualifying capital structure and job methodology; do not count as committed capital.','SCREEN'],
];
export default function STCCurrent(){
 const missing=known.filter(x=>x[2]==='MISSING').length;
 const partial=known.filter(x=>x[2]==='PARTIAL').length;
 const readiness=44;
 return <main style={{minHeight:'100vh',background:'#f3f1e8',color:'#17251b',fontFamily:'Arial,sans-serif'}}>
  <header style={{background:'#123d2a',color:'#fff',padding:'14px 18px'}}><div style={{maxWidth:1100,margin:'auto'}}><Link href="/ag/finance/capital-fit/v2" style={{color:'#fff'}}>← Capital Fit 2.0</Link></div></header>
  <section style={{maxWidth:1100,margin:'auto',padding:'34px 18px'}}>
   <div style={{background:'#173f2c',color:'#fff',borderRadius:22,padding:25}}><div style={{fontSize:12,fontWeight:900,color:'#cfe3ba'}}>STC CURRENT-STATE UNDERWRITING</div><h1 style={{fontSize:'clamp(38px,6vw,60px)',margin:'8px 0'}}>NOT READY · {readiness}/100</h1><p style={{fontSize:18,lineHeight:1.55}}>The concept is strong enough to pursue capital, but it is not yet decision-grade. The score deliberately refuses to treat concepts, estimates or possible programs as committed evidence.</p><div>{missing} major evidence blocks missing · {partial} partial</div></div>
   <h2 style={{marginTop:30}}>What Capital Fit can verify today</h2>
   <div style={{background:'#fff',borderRadius:18,padding:20}}>{known.map(([a,b,s])=><div key={a} style={{padding:'12px 0',borderBottom:'1px solid #e2e6df',display:'grid',gridTemplateColumns:'180px 1fr auto',gap:12}}><strong>{a}</strong><span>{b}</span><b style={{fontSize:11,color:s==='MISSING'?'#8a3027':s==='PARTIAL'?'#856b13':'#2f6a3e'}}>{s}</b></div>)}</div>
   <h2 style={{marginTop:30}}>Live / current capital routes</h2>
   <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(240px,1fr))',gap:12}}>{opportunities.map(([a,b,s])=><div key={a} style={{background:'#fff',borderRadius:16,padding:18}}><b>{a}</b><p style={{lineHeight:1.5}}>{b}</p><small>{s}</small></div>)}</div>
   <div style={{marginTop:30,background:'#fff',border:'2px solid #173f2c',borderRadius:18,padding:22}}><h2 style={{marginTop:0}}>Fastest path to NEARLY READY</h2><ol style={{lineHeight:1.8}}><li>Lock the first financeable asset and site: start with meat processing + freezer/cold storage rather than the whole campus.</li><li>Get three vendor/GC budget quotes and a construction/commissioning schedule.</li><li>Document producer supply: annual head/tons/pounds, delivery windows, current buyer, expected price and minimum committed volume.</li><li>Get buyer LOIs/offtake expressions with volume, quality/specification and pricing logic.</li><li>Build a 5-year operating model with throughput, revenue, gross margin, labor, utilities, maintenance, EBITDA and downside cases.</li><li>Commission rural/TEA and job-creation screening before assigning any EB-5 dollars.</li><li>Take the package to USDA Rural Development and lenders for an actual term/eligibility read.</li></ol></div>
   <div style={{marginTop:18,padding:18,borderRadius:16,background:'#e6ecdf'}}><strong>Target gate:</strong> once site control + budget + supply + buyer evidence + operating model are loaded, rerun Capital Fit. That should be the first credible move from NOT READY toward NEARLY READY. No financing amount is being represented as committed yet.</div>
  </section>
 </main>;
}
