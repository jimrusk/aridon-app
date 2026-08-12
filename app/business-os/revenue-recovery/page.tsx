'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { getBrowserClient } from '../../../lib/supabase';

const initial = {
  ownerName:'', businessName:'', email:'', phone:'', website:'', state:'NM', serviceType:'Plumbing/HVAC',
  openEstimates:'', dormantCustomers:'', currentTools:'', leakToTest:'', companyTrap:''
};

export default function RevenueRecoveryPilotPage() {
  const [form,setForm] = useState(initial);
  const [loading,setLoading] = useState(false);
  const [message,setMessage] = useState('');
  const [sent,setSent] = useState(false);

  function update(key:string,value:string){ setForm((v)=>({...v,[key]:value})); }

  async function submit(event:FormEvent){
    event.preventDefault(); setLoading(true); setMessage('');
    if(form.companyTrap){ setSent(true); setLoading(false); return; }
    const db = getBrowserClient();
    const { error } = await db.from('revenue_recovery_pilot_requests').insert({
      owner_name: form.ownerName.trim().slice(0,120),
      business_name: form.businessName.trim().slice(0,180),
      email: form.email.trim().toLowerCase().slice(0,220),
      phone: form.phone.trim().slice(0,80) || null,
      website: form.website.trim().slice(0,300) || null,
      state: form.state,
      service_type: form.serviceType,
      open_estimates: form.openEstimates ? Math.max(0,Math.round(Number(form.openEstimates))) : null,
      dormant_customers: form.dormantCustomers ? Math.max(0,Math.round(Number(form.dormantCustomers))) : null,
      current_tools: form.currentTools.trim().slice(0,500) || null,
      leak_to_test: form.leakToTest.trim().slice(0,1500),
      status: 'new',
    });
    if(error){ setMessage('We could not save the request. Please try again or email Jim directly.'); setLoading(false); return; }
    setSent(true); setLoading(false);
  }

  return (
    <main style={{minHeight:'100vh',background:'#0B1220',color:'#F7FAFC',fontFamily:'Arial,sans-serif'}}>
      <section style={{maxWidth:1120,margin:'0 auto',padding:'32px 20px 76px'}}>
        <nav style={{display:'flex',justifyContent:'space-between',gap:12,alignItems:'center',flexWrap:'wrap'}}>
          <Link href="/business-os" style={{color:'#fff',textDecoration:'none',fontWeight:950}}>ARIDON PRIVATE BUSINESS OS</Link>
          <a href="#pilot-form" style={greenButton}>Request the Pilot</a>
        </nav>

        <div style={{paddingTop:70,maxWidth:950}}>
          <div style={{fontSize:12,fontWeight:950,letterSpacing:1.2,color:'#A4F3D3'}}>FOUNDING PROOF LANE · NEW MEXICO + ARIZONA · 14 DAYS · NO UPFRONT FEE</div>
          <h1 style={{fontSize:'clamp(48px,8vw,88px)',lineHeight:.94,letterSpacing:-4,margin:'14px 0 22px'}}>Plumbing & HVAC owners: give Aridon your stale estimates and make us prove the value.</h1>
          <p style={{fontSize:21,lineHeight:1.65,color:'#C7D2E2',maxWidth:860}}>For the first proof cohort, Aridon is deliberately narrow: plumbing and HVAC businesses with old estimates, missed follow-ups, or dormant customers. We establish the baseline first, prepare owner-approved recovery actions, and measure what actually happens.</p>
          <div style={{display:'flex',gap:10,flexWrap:'wrap',marginTop:24}}>
            <a href="#pilot-form" style={greenButton}>Apply in About 60 Seconds</a>
            <Link href="/business-os/proof" style={outlineButton}>Watch the Public Proof Scoreboard</Link>
          </div>
          <p style={{fontSize:12,color:'#8290A5',marginTop:14}}>No revenue guarantee. No account or password required to apply. Consequential external actions stay under your approval.</p>
        </div>

        <section style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(240px,1fr))',gap:12,marginTop:52}}>
          {[
            ['Stale estimates','Quotes or proposals that never got a disciplined second chance.'],
            ['Missed follow-up','Qualified inquiries that went quiet after the first contact.'],
            ['Dormant customers','Past customers with a plausible service, maintenance, replacement, or reactivation opportunity.'],
          ].map(([title,text]) => <article key={title} style={{background:'#111B2B',border:'1px solid #26354C',borderRadius:16,padding:20}}><h2 style={{fontSize:20,margin:'0 0 8px'}}>{title}</h2><p style={{margin:0,color:'#B9C5D6',lineHeight:1.6}}>{text}</p></article>)}
        </section>
      </section>

      <section style={{background:'#F5F2EA',color:'#171717',padding:'70px 20px'}}>
        <div style={{maxWidth:1020,margin:'0 auto'}}>
          <div style={{fontSize:12,fontWeight:950}}>WHAT THE 14-DAY TEST REQUIRES</div>
          <h2 style={{fontSize:'clamp(36px,6vw,58px)',lineHeight:1,margin:'10px 0 24px'}}>Clean evidence beats a giant feature list.</h2>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(240px,1fr))',gap:12}}>
            <Info title="Data" text="A spreadsheet, CRM export, estimate list, customer list, or permissioned inbox view. A useful starting sample is roughly 25+ stale estimates/leads or 50+ dormant customers when available." />
            <Info title="Time" text="One 30-minute kickoff, brief approval checks during the pilot, and one day-14 review." />
            <Info title="Success threshold" text="Agree before launch on a measurable threshold such as 5 qualified reactivation opportunities, 3 owner-approved follow-ups, 1 booked job, or documented hours saved." />
            <Info title="Human control" text="Aridon does not send messages, change pricing, spend money, sign agreements, or make commitments without approval." />
          </div>

          <div style={{marginTop:34,display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(300px,1fr))',gap:14}}>
            <section style={lightPanel}><h3 style={{fontSize:24,marginTop:0}}>How we count the money</h3><p><strong>Revenue influenced:</strong> opportunity value tied to an Aridon-assisted action that produced a measurable response, reactivation, proposal movement, or booking.</p><p><strong>Revenue collected:</strong> cash actually received by the business and confirmed by the owner. We report these separately.</p></section>
            <section style={lightPanel}><h3 style={{fontSize:24,marginTop:0}}>Who this is not for</h3><p>Businesses with no usable lead/customer history, very long sales cycles, nobody available to approve actions, or no willingness to share a small permissioned data set are poor first-pilot fits.</p></section>
          </div>

          <div style={{marginTop:34,padding:24,borderRadius:18,background:'#171717',color:'#fff'}}>
            <div style={{fontSize:12,fontWeight:950,color:'#A4F3D3'}}>PRIVACY + SECURITY</div>
            <h3 style={{fontSize:28,margin:'8px 0 10px'}}>Use only what the owner authorizes.</h3>
            <p style={{color:'#C8CDD5',lineHeight:1.65,maxWidth:900}}>The pilot begins with the smallest useful permissioned data set. Aridon does not need banking credentials, payment-card data, Social Security numbers, or unrestricted system access for this test. Pilot data is used only for the agreed test and should be removed or disconnected when the pilot ends unless the business explicitly continues.</p>
          </div>

          <section style={{marginTop:34}}>
            <div style={{fontSize:12,fontWeight:950}}>DAY-14 REPORT</div>
            <h3 style={{fontSize:34,margin:'8px 0 14px'}}>The final report is designed to be auditable.</h3>
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(210px,1fr))',gap:10}}>
              {['Baseline','Actions approved','Responses','Booked work','Revenue influenced','Revenue collected','Hours saved','What did not work','Recommended next step'].map((x)=><div key={x} style={{background:'#fff',border:'1px solid #D4CEC2',borderRadius:12,padding:14,fontWeight:850}}>{x}</div>)}
            </div>
          </section>

          <section id="pilot-form" style={{marginTop:48,background:'#fff',border:'1px solid #D4CEC2',borderRadius:20,padding:24}}>
            <div style={{fontSize:12,fontWeight:950}}>FOUNDING PILOT APPLICATION</div>
            <h2 style={{fontSize:'clamp(34px,5vw,50px)',margin:'8px 0 10px'}}>Give Aridon one leak to attack.</h2>
            {sent ? <div style={{background:'#E4F8EF',border:'1px solid #A5D9C3',borderRadius:14,padding:20,fontSize:18,lineHeight:1.6}}><strong>Request received.</strong><br/>We will qualify the data, sales-cycle speed, and approval path before calling anything a pilot.</div> :
            <form onSubmit={submit} style={{display:'grid',gap:12}}>
              <div style={grid}><Field label="Owner / operator name *" value={form.ownerName} onChange={(v)=>update('ownerName',v)} /><Field label="Business name *" value={form.businessName} onChange={(v)=>update('businessName',v)} /></div>
              <div style={grid}><Field label="Business email *" type="email" value={form.email} onChange={(v)=>update('email',v)} /><Field label="Phone" value={form.phone} onChange={(v)=>update('phone',v)} /></div>
              <div style={grid}><Field label="Website" type="url" value={form.website} onChange={(v)=>update('website',v)} /><label style={label}>State *<select required value={form.state} onChange={(e)=>update('state',e.target.value)} style={input}><option value="NM">New Mexico</option><option value="AZ">Arizona</option></select></label></div>
              <div style={grid}><label style={label}>Service type *<select required value={form.serviceType} onChange={(e)=>update('serviceType',e.target.value)} style={input}><option>Plumbing/HVAC</option><option>Plumbing</option><option>HVAC</option></select></label><Field label="Current tools / CRM" value={form.currentTools} onChange={(v)=>update('currentTools',v)} /></div>
              <div style={grid}><Field label="Approx. stale/open estimates" type="number" value={form.openEstimates} onChange={(v)=>update('openEstimates',v)} /><Field label="Approx. dormant customers" type="number" value={form.dormantCustomers} onChange={(v)=>update('dormantCustomers',v)} /></div>
              <label style={label}>What revenue leak should Aridon test first? *<textarea required rows={4} value={form.leakToTest} onChange={(e)=>update('leakToTest',e.target.value)} placeholder="Example: 40 estimates from the last 90 days never received a second follow-up." style={{...input,resize:'vertical'}} /></label>
              <input aria-hidden="true" tabIndex={-1} value={form.companyTrap} onChange={(e)=>update('companyTrap',e.target.value)} style={{position:'absolute',left:-10000,width:1,height:1}} />
              {message && <div style={{color:'#8B1E2D',fontWeight:800}}>{message}</div>}
              <button disabled={loading} type="submit" style={{...greenButton,border:0,cursor:loading?'wait':'pointer',fontSize:16}}>{loading?'Submitting…':'Request the 14-Day Pilot'}</button>
            </form>}
          </section>

          <div style={{marginTop:34,padding:20,border:'1px solid #CFC8BC',borderRadius:16}}>
            <strong>After the free pilot:</strong> if the owner wants Aridon to continue, we present the paid continuation scope and price before any charge or commitment. The founding pilot itself has no upfront fee.
          </div>
        </div>
      </section>
    </main>
  );
}

function Info({title,text}:{title:string;text:string}){ return <article style={lightPanel}><h3 style={{margin:'0 0 8px'}}>{title}</h3><p style={{lineHeight:1.6,color:'#5E5A53',margin:0}}>{text}</p></article>; }
function Field({label:lbl,value,onChange,type='text'}:{label:string;value:string;onChange:(v:string)=>void;type?:string}){ return <label style={label}>{lbl}<input required={lbl.includes('*')} type={type} value={value} onChange={(e)=>onChange(e.target.value)} style={input}/></label>; }
const greenButton={display:'inline-block',background:'#A4F3D3',color:'#07130F',textDecoration:'none',fontWeight:950,padding:'14px 18px',borderRadius:12};
const outlineButton={border:'1px solid #51617A',color:'#fff',textDecoration:'none',fontWeight:900,padding:'13px 17px',borderRadius:12};
const lightPanel={background:'#fff',border:'1px solid #D4CEC2',borderRadius:16,padding:20};
const grid={display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(240px,1fr))',gap:12};
const label={display:'grid',gap:6,fontWeight:850,fontSize:13};
const input={border:'1px solid #BBB3A7',borderRadius:10,padding:'12px 13px',fontSize:16,background:'#fff'};
