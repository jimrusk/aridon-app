import Link from 'next/link';

const prospects = [
  ['Signature Heating, Cooling & Plumbing', 97, 'A', 'Public review signals point to quote follow-through and communication friction. Lead with estimate recovery + follow-up visibility.'],
  ['Affordable Service Plumbing, Heating, Air Conditioning and Electric', 95, 'A', 'Public review signals include scheduling and office-communication friction. Lead with callback ownership + customer follow-up.'],
  ['Wagner Air Conditioning, Heating, Plumbing, & Electrical', 94, 'A', 'Very high lead volume and public scheduling feedback create a strong operations/follow-up automation hypothesis.'],
  ['Duke City Heating & Cooling', 92, 'A', 'Smaller local operator with no-online-estimate signal in public listings. Lead with estimate capture and owner follow-up.'],
  ['Moore Quality Air', 91, 'A', 'Local owner-led HVAC business with room to systematize quote recovery, reviews, and repeat-service follow-up.'],
  ['Pen Pals Cooling Heating Plumbing', 90, 'A', 'Growing local home-services brand. Lead with quote speed, review growth, and recurring maintenance conversion.'],
  ['Tech Air Heating and Cooling', 89, 'A', 'Strong customer sentiment and moderate review volume. Lead with preserving service quality while scaling follow-up.'],
  ['Motherroad Plumbing Heating & Cooling', 88, 'A', 'Public listing shows no online estimates. Lead with a lightweight digital estimate and callback pipeline.'],
  ['Air Care New Mexico', 87, 'B', 'High review volume and broad service area. Lead with maintenance-plan reactivation and cross-sell visibility.'],
  ['Luxury Plumbing Heating & Cooling LLC', 86, 'B', 'Strong review profile and 24/7 operations. Lead with fast lead routing and after-hours follow-up.'],
  ['Kidzz Mechanical', 85, 'B', 'High-rated local HVAC operator. Lead with service-to-replacement conversion and maintenance retention.'],
  ['First Rate Plumbing Heating and Cooling Inc', 84, 'B', 'High-volume home-services operator. Lead with quote aging, missed callbacks, and recurring maintenance.'],
  ['Anderson Air Corps Heating & Cooling', 83, 'B', 'Established company with emergency service. Lead with same-day lead response and replacement-estimate recovery.'],
  ['MGP Mechanical', 82, 'B', 'Strong local rating signal. Lead with a measurable follow-up pilot rather than broad software replacement.'],
  ['Thompson Heating & Air Conditioning', 81, 'B', 'Established HVAC provider. Lead with seasonal reactivation and unclosed replacement estimates.'],
  ['Heat And Air Company LLC', 80, 'B', 'Strong rating signal. Lead with customer reactivation and estimate follow-up automation.'],
  ['Day & Night Plumbing', 79, 'B', 'Home-services business with emergency/service-call volume. Lead with callback SLA and cross-service follow-up.'],
  ['Strongbuilt Plumbing Air Electrical', 78, 'B', 'Multi-trade home-services model creates cross-sell and follow-up opportunities.'],
  ['Number One Plumbing, A/C, Solar & Electric', 77, 'B', 'Multi-trade provider. Lead with one owner view across leads, quotes, jobs, and follow-ups.'],
  ['Homerun Plumbing Heating and Cooling', 76, 'B', 'Strong rating signal. Lead with quote conversion and referral/review automation.'],
  ['Ace Heating, Cooling, Plumbing and Electrical', 75, 'B', 'Multi-trade service model. Lead with pipeline ownership and recurring customer follow-up.'],
  ["Steward's Plumbing Inc", 74, 'C', 'Established plumbing/home-services provider. Lead with reactivation and estimate recovery.'],
  ['NCB Mechanical', 73, 'C', 'Strong review profile. Lead with operational visibility and replacement-estimate follow-up.'],
  ['Hi-Tech Heating and Cooling', 72, 'C', 'Smaller strong-rated HVAC brand. Lead with fast-growth follow-up systems that do not add admin burden.'],
  ["Gustafson's Heating Cooling & Plumbing", 71, 'C', 'Local HVAC/plumbing provider. Lead with unclosed estimates, seasonal service, and referral follow-up.'],
] as const;

const firstTouch = `Subject: I found a few places Aridon may help recover HVAC revenue\n\nHi {{FirstName}},\n\nI was reviewing {{Company}} and noticed a few areas worth testing around estimate follow-up, callbacks, seasonal reactivation, and owner visibility.\n\nI built a simple Aridon Revenue Sprint around this. The goal is not to replace your software. It is to find revenue already sitting in open estimates, missed follow-ups, past customers, and service-to-replacement opportunities, then give your team a clear next-action queue.\n\nWe can start with one small data set and show the opportunities before you commit to anything larger.\n\nWould a 15-minute look at the recovery map be useful?\n\nJim\nAridon`;

const followUp = `Subject: Re: {{Company}} revenue recovery map\n\nHi {{FirstName}},\n\nOne concrete place I would start is old replacement estimates and service calls that never received a clean second or third follow-up. For HVAC companies, a handful of recovered jobs can pay for the entire system quickly.\n\nIf you send me nothing private, I can still show you the workflow using an example first. If it looks useful, we can test it on a permissioned list from your team.\n\nJim\nAridon`;

export default function HvacScoutPage() {
  return (
    <main style={page}>
      <div style={shell}>
        <header style={header}>
          <div>
            <div style={eyebrow}>GROWTH DESK · SCOUT WAVE 01</div>
            <h1 style={title}>25 Albuquerque HVAC prospects ready for first contact.</h1>
            <p style={lead}>This list is built from public business signals only. Scores are outreach-priority hypotheses, not private performance claims. Verify the decision-maker and contact route before sending.</p>
          </div>
          <div style={actions}>
            <Link href="/growth-desk" style={ghost}>Growth Desk</Link>
            <a href="https://book.stripe.com/aFa00i3bp5qX97Me8a4AU07" style={primary}>$495 Revenue Sprint</a>
          </div>
        </header>

        <section style={stats}>
          <div><strong>25</strong><span>prospects</span></div>
          <div><strong>8</strong><span>A-priority targets</span></div>
          <div><strong>1</strong><span>industry focus</span></div>
          <div><strong>$495</strong><span>first offer</span></div>
        </section>

        <section style={section}>
          <div style={eyebrow}>SCOUT QUEUE</div>
          <h2 style={h2}>Call the A-list first.</h2>
          <div style={tableWrap}>
            <table style={table}>
              <thead><tr><th>#</th><th>Company</th><th>Score</th><th>Tier</th><th>Opening angle</th><th>Status</th></tr></thead>
              <tbody>
                {prospects.map((p, i) => (
                  <tr key={p[0]}>
                    <td>{i + 1}</td><td><strong>{p[0]}</strong></td><td>{p[1]}</td><td>{p[2]}</td><td>{p[3]}</td><td><span style={status}>Research-ready</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section style={grid}>
          <article style={card}><div style={eyebrow}>TOUCH 1 · USEFUL OBSERVATION</div><h2 style={h2}>First email</h2><pre style={script}>{firstTouch}</pre></article>
          <article style={card}><div style={eyebrow}>TOUCH 2 · 2-3 BUSINESS DAYS LATER</div><h2 style={h2}>Follow-up</h2><pre style={script}>{followUp}</pre></article>
        </section>

        <section style={card}>
          <div style={eyebrow}>PHONE OPENER</div>
          <h2 style={h2}>Keep it to 30 seconds.</h2>
          <p style={phone}>“Hi, this is Jim with Aridon. I’m not calling to sell you another CRM. We built a revenue-recovery system for service businesses that finds open estimates, missed callbacks and past customers that may already be worth money. I put together a quick HVAC example for your company. Who handles sales follow-up or operations there?”</p>
        </section>

        <section style={cta}>
          <div><div style={eyebrowDark}>EXECUTION ORDER</div><h2 style={{...h2, marginBottom:6}}>A1-A8 first, then B-tier.</h2><p style={{margin:0,lineHeight:1.6}}>Do not spray all 25 with the same message. Verify the contact, personalize one useful observation, send 8 high-fit messages, follow up, then expand the batch based on replies.</p></div>
          <Link href="/customer/sales" style={darkButton}>Open Aridon Sales</Link>
        </section>
      </div>
    </main>
  );
}

const page={minHeight:'100vh',background:'#07101A',color:'#F8FAFC',fontFamily:'Arial, sans-serif',padding:'28px 18px 100px'};
const shell={maxWidth:1250,margin:'0 auto'};
const header={display:'flex',justifyContent:'space-between',gap:24,alignItems:'start',flexWrap:'wrap' as const};
const actions={display:'flex',gap:10,flexWrap:'wrap' as const};
const eyebrow={color:'#79E0BC',fontWeight:950,fontSize:11,letterSpacing:1.3};
const eyebrowDark={color:'#245647',fontWeight:950,fontSize:11,letterSpacing:1.3};
const title={fontSize:'clamp(38px,6vw,68px)',lineHeight:1,margin:'9px 0 12px',maxWidth:900};
const lead={color:'#B8C5D4',fontSize:17,lineHeight:1.65,maxWidth:850};
const primary={background:'#9EF0CF',color:'#07130F',padding:'11px 14px',borderRadius:10,textDecoration:'none',fontWeight:950};
const ghost={border:'1px solid #35465D',color:'#fff',padding:'10px 13px',borderRadius:10,textDecoration:'none',fontWeight:900};
const stats={display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))',gap:10,marginTop:22};
const section={marginTop:28};
const h2={fontSize:28,margin:'7px 0 14px'};
const tableWrap={overflowX:'auto' as const,border:'1px solid #223247',borderRadius:16};
const table={width:'100%',borderCollapse:'collapse' as const,background:'#0D1723',fontSize:13};
const status={background:'#193128',color:'#9EF0CF',borderRadius:999,padding:'5px 8px',fontWeight:900,fontSize:11,whiteSpace:'nowrap' as const};
const grid={display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(320px,1fr))',gap:12,marginTop:24};
const card={background:'#0D1723',border:'1px solid #23344A',borderRadius:16,padding:18,marginTop:16};
const script={whiteSpace:'pre-wrap' as const,color:'#D7E0EB',lineHeight:1.55,fontFamily:'Arial, sans-serif',fontSize:14,margin:0};
const phone={color:'#D7E0EB',fontSize:17,lineHeight:1.65,margin:0};
const cta={marginTop:24,background:'#DDF8ED',color:'#102019',borderRadius:18,padding:20,display:'flex',justifyContent:'space-between',gap:18,alignItems:'center',flexWrap:'wrap' as const};
const darkButton={background:'#102019',color:'#fff',padding:'11px 14px',borderRadius:10,textDecoration:'none',fontWeight:950};
