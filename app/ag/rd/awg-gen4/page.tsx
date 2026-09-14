'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';

function money(n:number){return Number.isFinite(n)?`$${n.toFixed(3)}`:'—'}
function num(v:string){const n=Number(v);return Number.isFinite(n)?n:0}

export default function AWGGen4CostGate(){
  const [gpd,setGpd]=useState('30000');
  const [sec,setSec]=useState('0.50');
  const [power,setPower]=useState('0.0541');
  const [capex,setCapex]=useState('5000000');
  const [life,setLife]=useState('15');
  const [rate,setRate]=useState('8');
  const [capacity,setCapacity]=useState('85');
  const [maint,setMaint]=useState('4');
  const [fixed,setFixed]=useState('250000');
  const [treatment,setTreatment]=useState('0.03');
  const [thermal,setThermal]=useState('0.02');

  const m=useMemo(()=>{
    const gallons=Math.max(1,num(gpd));
    const liters=gallons*3.785411784;
    const cf=Math.min(1,Math.max(.01,num(capacity)/100));
    const annualGal=gallons*365*cf;
    const kwhDay=liters*Math.max(0,num(sec));
    const energyGal=(Math.max(0,num(sec))*3.785411784)*Math.max(0,num(power));
    const r=Math.max(0,num(rate)/100);
    const n=Math.max(1,num(life));
    const crf=r===0?1/n:(r*Math.pow(1+r,n))/(Math.pow(1+r,n)-1);
    const annualCap=Math.max(0,num(capex))*crf;
    const capGal=annualCap/annualGal;
    const maintGal=(Math.max(0,num(capex))*Math.max(0,num(maint)/100))/annualGal;
    const fixedGal=Math.max(0,num(fixed))/annualGal;
    const total=energyGal+capGal+maintGal+fixedGal+Math.max(0,num(treatment))+Math.max(0,num(thermal));
    return {liters,kwhDay,avgKw:kwhDay/24,annualGal,energyGal,capGal,maintGal,fixedGal,total,margin:.60-total};
  },[gpd,sec,power,capex,life,rate,capacity,maint,fixed,treatment,thermal]);

  const pass=m.total<=.60;
  return <main style={{minHeight:'100vh',background:'#061018',color:'#f7fbf9',fontFamily:'Arial,sans-serif'}}>
    <section style={{maxWidth:1180,margin:'auto',padding:'24px 18px 70px'}}>
      <nav style={{display:'flex',justifyContent:'space-between',gap:12,flexWrap:'wrap',alignItems:'center'}}>
        <Link href="/ag/rd" style={{color:'#fff',textDecoration:'none',fontWeight:950}}>ARIDON AG R&D</Link>
        <Link href="/advisors/awg1000" style={{color:'#9EF0CF',textDecoration:'none',fontWeight:900}}>AWG Challenge Pack</Link>
      </nav>
      <div style={{paddingTop:52,maxWidth:950}}>
        <div style={{color:'#9EF0CF',fontWeight:950,fontSize:12,letterSpacing:1.2}}>AWG GEN 4 · COST-FIRST REDESIGN</div>
        <h1 style={{fontSize:'clamp(46px,7vw,82px)',lineHeight:.95,letterSpacing:-3,margin:'14px 0 20px'}}>No gallon over 60¢ without a reason.</h1>
        <p style={{fontSize:20,lineHeight:1.6,color:'#B9C9C4'}}>This gate converts energy, capital, uptime and operating assumptions into an all-in planning cost per gallon. A design that cannot pass the economics does not advance to mechanical detailing.</p>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))',gap:11,marginTop:26}}>
        <Metric label="Modeled cost / gal" value={money(m.total)} big good={pass}/>
        <Metric label="Target" value="$0.600"/>
        <Metric label="Margin to target" value={money(m.margin)} good={m.margin>=0}/>
        <Metric label="Average electrical load" value={`${Math.round(m.avgKw).toLocaleString()} kW`}/>
      </div>

      <div className="grid" style={{display:'grid',gridTemplateColumns:'minmax(0,.85fr) minmax(0,1.15fr)',gap:16,marginTop:20}}>
        <section style={panel}>
          <h2 style={{marginTop:0}}>Planning inputs</h2>
          <div style={{display:'grid',gridTemplateColumns:'repeat(2,minmax(0,1fr))',gap:10}}>
            <Field label="Output, gal/day" value={gpd} set={setGpd}/><Field label="Electrical SEC, kWh/L" value={sec} set={setSec}/>
            <Field label="Electricity, $/kWh" value={power} set={setPower}/><Field label="Installed capex, $" value={capex} set={setCapex}/>
            <Field label="Asset life, years" value={life} set={setLife}/><Field label="Discount rate, %" value={rate} set={setRate}/>
            <Field label="Capacity factor, %" value={capacity} set={setCapacity}/><Field label="Maintenance, % capex/yr" value={maint} set={setMaint}/>
            <Field label="Fixed labor/service, $/yr" value={fixed} set={setFixed}/><Field label="Treatment/testing, $/gal" value={treatment} set={setTreatment}/>
            <Field label="Purchased thermal, $/gal" value={thermal} set={setThermal}/>
          </div>
          <p style={{color:'#829691',fontSize:12,lineHeight:1.5}}>Defaults are planning placeholders, not achieved AWG specifications. Replace capex, O&M and SEC with quotes and field measurements before customer or investor use.</p>
        </section>

        <section style={panel}>
          <div style={{display:'flex',justifyContent:'space-between',gap:10,alignItems:'start',flexWrap:'wrap'}}>
            <div><div style={{color:pass?'#9EF0CF':'#FF9A8B',fontSize:12,fontWeight:950}}>{pass?'PASS':'REDESIGN'}</div><h2 style={{margin:'6px 0 0'}}>{pass?'Economics clear the 60¢ gate.':'This configuration does not clear the 60¢ gate.'}</h2></div>
            <div style={{fontSize:34,fontWeight:950,color:pass?'#9EF0CF':'#FF9A8B'}}>{money(m.total)}</div>
          </div>
          <div style={{display:'grid',gap:8,marginTop:18}}>
            <Row label="Electricity" value={money(m.energyGal)}/>
            <Row label="Annualized equipment + installation" value={money(m.capGal)}/>
            <Row label="Maintenance" value={money(m.maintGal)}/>
            <Row label="Fixed labor / service" value={money(m.fixedGal)}/>
            <Row label="Treatment / testing" value={money(num(treatment))}/>
            <Row label="Purchased thermal" value={money(num(thermal))}/>
          </div>
          <div style={{marginTop:16,padding:15,borderRadius:14,background:'#0A1F18',border:'1px solid #234B3E',lineHeight:1.55,color:'#D6E8E1'}}>
            <strong style={{color:'#9EF0CF'}}>Operating doctrine:</strong> direct condensation when dew point is favorable; desiccant capture when dry; regenerate with recovered condenser heat, solar thermal or waste heat; pause when predicted marginal cost is worse than stored-water economics.
          </div>
        </section>
      </div>

      <section style={{...panel,marginTop:16}}>
        <h2 style={{marginTop:0}}>Gen 4 architecture</h2>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))',gap:10}}>
          {[
            ['A · Condense','Variable-speed refrigeration + cold-exhaust sensible recovery during favorable dew-point windows.'],
            ['B · Capture','Low-pressure liquid or solid desiccant contactors for dry-air operation.'],
            ['C · Regenerate','Use heat-pump condenser heat first, then waste heat / solar thermal. Purchased electric heat is last.'],
            ['D · Pause','Storage lets the plant stop during ugly weather or expensive power instead of manufacturing costly gallons.'],
          ].map(([h,t])=><article key={h} style={{background:'#0A141C',border:'1px solid #263C46',borderRadius:15,padding:15}}><strong style={{color:'#9EF0CF'}}>{h}</strong><p style={{color:'#B9C9C4',lineHeight:1.55,fontSize:13,marginBottom:0}}>{t}</p></article>)}
        </div>
        <p style={{color:'#829691',fontSize:12,lineHeight:1.5,marginTop:15}}>The 30,000-gpd product is now treated as a modular industrial plant built from transportable capture, heat-pump/regeneration and treatment skids. The single 40-ft 30K concept is not the baseline for arid deployment.</p>
      </section>
    </section>
    <style>{`@media(max-width:850px){.grid{grid-template-columns:1fr !important}}`}</style>
  </main>
}

const panel={background:'#0D1821',border:'1px solid #263C46',borderRadius:18,padding:18} as const;
function Metric({label,value,big,good}:{label:string,value:string,big?:boolean,good?:boolean}){return <div style={panel}><div style={{color:'#819791',fontSize:11,fontWeight:900}}>{label.toUpperCase()}</div><div style={{fontSize:big?34:26,fontWeight:950,marginTop:6,color:good===true?'#9EF0CF':good===false?'#FF9A8B':'#fff'}}>{value}</div></div>}
function Field({label,value,set}:{label:string,value:string,set:(v:string)=>void}){return <label style={{display:'grid',gap:5,fontSize:11,fontWeight:900,color:'#9CB0AA'}}>{label}<input value={value} onChange={e=>set(e.target.value)} inputMode="decimal" style={{width:'100%',boxSizing:'border-box',background:'#071018',color:'#fff',border:'1px solid #334953',borderRadius:10,padding:'11px 10px',fontSize:14}}/></label>}
function Row({label,value}:{label:string,value:string}){return <div style={{display:'flex',justifyContent:'space-between',gap:15,padding:'10px 0',borderBottom:'1px solid #243640'}}><span style={{color:'#AABAB5'}}>{label}</span><strong>{value}/gal</strong></div>}
