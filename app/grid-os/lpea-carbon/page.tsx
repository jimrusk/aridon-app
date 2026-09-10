'use client';

import Link from 'next/link';
import { ChangeEvent, useMemo, useState, type CSSProperties } from 'react';
import { Activity, AlertTriangle, BatteryCharging, Factory, Gauge, Leaf, Network, Radio, Sun, Truck, Upload, Zap } from 'lucide-react';

type View = 'system' | 'simulator' | 'losses' | 'carbon' | 'actions';

type Inputs = {
  annualMWh: number;
  lossPct: number;
  targetLossPct: number;
  energyCost: number;
  carbonLbPerMWh: number;
  peakMW: number;
  peakReductionMW: number;
  demandCharge: number;
  fleetGallons: number;
  fleetReductionPct: number;
  fuelCost: number;
};

const defaults: Inputs = {
  annualMWh: 500000,
  lossPct: 5,
  targetLossPct: 4.5,
  energyCost: 65,
  carbonLbPerMWh: 700,
  peakMW: 100,
  peakReductionMW: 1,
  demandCharge: 10,
  fleetGallons: 100000,
  fleetReductionPct: 5,
  fuelCost: 4,
};

const monitors = [
  ['Purchased / market power','Hourly MWh + verified emissions factor','Track supplier and SPP portfolio carbon intensity.'],
  ['Renewable supply','32% annual public baseline','Track solar, hydro, wind and other renewable contribution.'],
  ['Distribution losses','AMI + SCADA','Compare feeder/substation input with metered delivery.'],
  ['Peak demand','Hourly','Flag high-cost or high-carbon peaks for review.'],
  ['Fleet + generators','Fuel + runtime','Track diesel/gasoline use, idle hours and standby generation.'],
  ['Facilities','Metered energy','Track offices, shops, HVAC and support-building loads.'],
  ['Member loads','AMI segments','Find irrigation, motor, HVAC and commercial efficiency opportunities.'],
  ['Storage + DER','State + dispatch','Measure charging source, avoided peaks and reliability value.'],
];

const actions = [
  ['Feeder loss reduction study','Avoided MWh → avoided CO₂e','Energy + capacity savings','High'],
  ['Peak carbon / price dispatch','Hourly marginal emissions','Demand + market savings','High'],
  ['Transformer efficiency queue','No-load + load losses','Energy + maintenance','Medium'],
  ['Fleet idle / route optimization','Direct fuel CO₂e','Fuel + labor','Medium'],
];

export default function LPEACarbonPage(){
  const [view,setView]=useState<View>('simulator');
  const [inputs,setInputs]=useState<Inputs>(defaults);
  const [csvMessage,setCsvMessage]=useState('');

  const calc = useMemo(() => {
    const currentLossMWh = inputs.annualMWh * Math.max(inputs.lossPct,0) / 100;
    const targetLossMWh = inputs.annualMWh * Math.max(inputs.targetLossPct,0) / 100;
    const avoidedMWh = Math.max(0, currentLossMWh - targetLossMWh);
    const energySavings = avoidedMWh * Math.max(inputs.energyCost,0);
    const lossCarbonTons = avoidedMWh * Math.max(inputs.carbonLbPerMWh,0) / 2000;
    const peakSavings = Math.max(inputs.peakReductionMW,0) * 1000 * Math.max(inputs.demandCharge,0) * 12;
    const gallonsSaved = Math.max(inputs.fleetGallons,0) * Math.max(inputs.fleetReductionPct,0) / 100;
    const fuelSavings = gallonsSaved * Math.max(inputs.fuelCost,0);
    const fleetCarbonTons = gallonsSaved * 10.21 / 907.185;
    return {
      currentLossMWh,
      targetLossMWh,
      avoidedMWh,
      energySavings,
      lossCarbonTons,
      peakSavings,
      gallonsSaved,
      fuelSavings,
      fleetCarbonTons,
      totalSavings: energySavings + peakSavings + fuelSavings,
      totalCarbonTons: lossCarbonTons + fleetCarbonTons,
    };
  },[inputs]);

  function setNumber(key:keyof Inputs,value:string){
    const n = Number(value);
    setInputs(prev=>({...prev,[key]:Number.isFinite(n)?n:0}));
  }

  async function importCsv(e:ChangeEvent<HTMLInputElement>){
    const file=e.target.files?.[0];
    if(!file) return;
    try{
      const text=await file.text();
      const lines=text.trim().split(/\r?\n/).filter(Boolean);
      if(lines.length<2) throw new Error('CSV needs a header row and at least one data row.');
      const headers=lines[0].split(',').map(x=>x.trim().toLowerCase().replace(/[^a-z0-9]/g,''));
      const values=lines[1].split(',').map(x=>x.trim().replace(/^"|"$/g,''));
      const aliases:Record<keyof Inputs,string[]>={
        annualMWh:['annualmwh','mwhpurchased','annualenergymwh','energypurchasedmwh'],
        lossPct:['losspct','losspercent','distributionloss','distributionlosspct'],
        targetLossPct:['targetlosspct','targetlosspercent','targetdistributionloss'],
        energyCost:['energycost','energydollarspermwh','costpermwh','mwhcost'],
        carbonLbPerMWh:['carbonlbpermwh','lbco2permwh','co2lbpermwh','emissionsfactor'],
        peakMW:['peakmw','peakdemandmw'],
        peakReductionMW:['peakreductionmw','targetpeakreductionmw'],
        demandCharge:['demandcharge','demandchargeperkwmonth','dollarsperkwmonth'],
        fleetGallons:['fleetgallons','annualfuelgallons','fuelgallons'],
        fleetReductionPct:['fleetreductionpct','fuelreductionpct','fleetfuelreductionpct'],
        fuelCost:['fuelcost','fuelcostpergallon','dollarspergallon'],
      };
      const next={...inputs};
      let matched=0;
      (Object.keys(aliases) as (keyof Inputs)[]).forEach(key=>{
        const idx=headers.findIndex(h=>aliases[key].includes(h));
        if(idx>=0 && values[idx]!==undefined){
          const n=Number(values[idx]);
          if(Number.isFinite(n)){ next[key]=n; matched++; }
        }
      });
      if(!matched) throw new Error('No recognized columns found. Use the sample column names shown below.');
      setInputs(next);
      setCsvMessage(`Loaded ${matched} input fields from ${file.name}.`);
    }catch(err:any){setCsvMessage(err?.message||'Could not read that CSV.');}
    e.target.value='';
  }

  return <main style={s.main}>
    <header style={s.header}><div style={s.wrapRow}><Link href="/grid-os" style={s.brand}>ARIDON GridOS</Link><span style={s.product}><Leaf size={17}/> LPEA Carbon + Efficiency Monitor</span><span style={s.demo}>INPUTS ENABLED · GRID CONTROL READ-ONLY</span></div></header>

    <section style={s.hero}><div style={s.wrap}>
      <div style={s.eyebrow}>LA PLATA ELECTRIC ASSOCIATION · COLORADO</div>
      <h1 style={s.h1}>Put your numbers in. See where the savings are.</h1>
      <p style={s.lead}>LPEA staff can enter or upload operating assumptions and immediately model energy, peak-demand, fuel and carbon savings. Grid control stays read-only: this tool never operates breakers, relays, DER, generation or market transactions.</p>
      <div style={s.metrics}>
        <Metric label="Renewable supply" value="32%" note="Public LPEA June 2026 annual baseline"/>
        <Metric label="CO₂ reduction" value="59%" note="Public LPEA statement vs. 2005"/>
        <Metric label="2030 goal" value=">80%" note="Strategic reduction vs. 2005"/>
        <Metric label="2028 expectation" value="85%" note="With planned wind delivery, per LPEA"/>
      </div>
      <p style={s.note}>Public figures are context, not live telemetry. Simulator results are estimates based on user-entered assumptions and should be validated against LPEA engineering, finance, tariff, market and emissions-accounting data.</p>
    </div></section>

    <nav style={s.nav}><div style={s.navInner}>{(['simulator','system','losses','carbon','actions'] as View[]).map(v=><button key={v} onClick={()=>setView(v)} style={{...s.tab,...(view===v?s.tabOn:{})}}>{v==='simulator'?'Savings simulator':v==='system'?'System':v==='losses'?'Loss detective':v==='carbon'?'Carbon sources':'Action queue'}</button>)}</div></nav>

    <section style={s.wrap}>
      {view==='simulator' && <>
        <Title k="TRY IT WITH LPEA DATA" t="Editable savings simulator"/>
        <div style={s.twoCol}>
          <Panel>
            <h3 style={s.panelHeading}>Utility inputs</h3>
            <p style={s.small}>Enter values manually or import the first data row from a CSV. Nothing here sends a control command to the grid.</p>
            <div style={s.formGrid}>
              <Input label="Annual energy purchased (MWh)" value={inputs.annualMWh} onChange={v=>setNumber('annualMWh',v)}/>
              <Input label="Current distribution loss (%)" value={inputs.lossPct} onChange={v=>setNumber('lossPct',v)}/>
              <Input label="Target distribution loss (%)" value={inputs.targetLossPct} onChange={v=>setNumber('targetLossPct',v)}/>
              <Input label="Average energy cost ($/MWh)" value={inputs.energyCost} onChange={v=>setNumber('energyCost',v)}/>
              <Input label="Carbon intensity (lb CO₂e/MWh)" value={inputs.carbonLbPerMWh} onChange={v=>setNumber('carbonLbPerMWh',v)}/>
              <Input label="Current system peak (MW)" value={inputs.peakMW} onChange={v=>setNumber('peakMW',v)}/>
              <Input label="Modeled peak reduction (MW)" value={inputs.peakReductionMW} onChange={v=>setNumber('peakReductionMW',v)}/>
              <Input label="Demand value ($/kW-month)" value={inputs.demandCharge} onChange={v=>setNumber('demandCharge',v)}/>
              <Input label="Annual fleet/generator fuel (gal)" value={inputs.fleetGallons} onChange={v=>setNumber('fleetGallons',v)}/>
              <Input label="Modeled fuel reduction (%)" value={inputs.fleetReductionPct} onChange={v=>setNumber('fleetReductionPct',v)}/>
              <Input label="Fuel cost ($/gal)" value={inputs.fuelCost} onChange={v=>setNumber('fuelCost',v)}/>
            </div>
            <div style={s.uploadBox}>
              <Upload size={19}/><div><strong>Import CSV</strong><p style={s.small}>Recognized examples: annualMWh, lossPct, targetLossPct, energyCost, carbonLbPerMWh, peakMW, peakReductionMW, demandCharge, fleetGallons, fleetReductionPct, fuelCost.</p></div>
              <label style={s.uploadButton}>Choose CSV<input type="file" accept=".csv,text/csv" onChange={importCsv} style={{display:'none'}}/></label>
            </div>
            {csvMessage && <p style={s.csvMessage}>{csvMessage}</p>}
            <button style={s.reset} onClick={()=>{setInputs(defaults);setCsvMessage('Reset to demonstration assumptions.')}}>Reset demo assumptions</button>
          </Panel>

          <Panel>
            <h3 style={s.panelHeading}>Modeled result</h3>
            <div style={s.resultHero}><span>Estimated annual savings</span><strong>{money(calc.totalSavings)}</strong><small>energy + modeled peak + fuel savings</small></div>
            <div style={s.resultGrid}>
              <Result label="Current loss energy" value={`${num(calc.currentLossMWh)} MWh/yr`}/>
              <Result label="Avoided loss energy" value={`${num(calc.avoidedMWh)} MWh/yr`}/>
              <Result label="Loss-energy savings" value={money(calc.energySavings)}/>
              <Result label="Peak-demand value" value={money(calc.peakSavings)}/>
              <Result label="Fuel savings" value={money(calc.fuelSavings)}/>
              <Result label="CO₂e avoided" value={`${num(calc.totalCarbonTons)} tons/yr`}/>
            </div>
            <Formula>{`${num(calc.avoidedMWh)} avoided MWh × $${num(inputs.energyCost)}/MWh = ${money(calc.energySavings)} estimated annual energy savings`}</Formula>
            <div style={s.compare}>
              <div><span>BEFORE</span><strong>{num(inputs.lossPct)}% loss</strong><small>{num(calc.currentLossMWh)} MWh associated with current loss assumption</small></div>
              <div><span>AFTER</span><strong>{num(inputs.targetLossPct)}% loss</strong><small>{num(calc.targetLossMWh)} MWh associated with target loss assumption</small></div>
            </div>
            <p style={s.note}>This is a screening model, not a guaranteed savings quote. A paid deployment would replace assumptions with verified interval data, actual power cost, marginal emissions factors, asset behavior and approved accounting methods.</p>
          </Panel>
        </div>
      </>}

      {view==='system' && <>
        <Title k="MONITORING LAYER" t="Generation → market → wires → assets → members"/>
        <div style={s.grid}>{monitors.map(([a,b,c])=><Card key={a} title={a} value={b} text={c}/>)}</div>
        <Title k="ALERT RULES" t="Surface only what deserves attention"/>
        <Panel><Alert t="Carbon intensity above target band" d="Compare market purchases, local generation, storage and flexible load before recommending action."/><Alert t="Feeder loss variance" d="Flag when weather- and load-adjusted loss departs materially from baseline."/><Alert t="Peak + high-emission supply" d="Surface storage and demand-response options without auto-dispatch."/><Alert t="Fleet fuel anomaly" d="Compare fuel use, route miles, work orders and generator runtime."/></Panel>
      </>}

      {view==='losses' && <><Title k="LOSS DETECTIVE" t="Find wasted electricity before buying more electricity"/><div style={s.grid}><Feature icon={<Network/>} t="Feeder balance" d="Compare feeder input against AMI interval load with time alignment and known technical adjustments."/><Feature icon={<Gauge/>} t="Transformer loss model" d="Estimate no-load and load-dependent losses by class, age, loading and temperature."/><Feature icon={<Activity/>} t="Voltage + phase efficiency" d="Identify imbalance, voltage excursions and reactive-power conditions for engineering review."/></div><Formula>avoided MWh × verified emissions factor = avoided operational CO₂e</Formula></>}

      {view==='carbon' && <><Title k="CARBON ACCOUNTING" t="Separate direct emissions from purchased-power emissions"/><Panel><Row l="Purchased / generated electricity" r="MWh × verified factor"/><Row l="Fleet + standby generators" r="Fuel × factor"/><Row l="Facilities" r="Metered energy + fuel"/><Row l="Avoided grid losses" r="Avoided MWh × relevant factor"/><Row l="Construction / equipment" r="Separate lifecycle record"/></Panel></>}

      {view==='actions' && <><Title k="PRIORITY ENGINE" t="Rank reductions by carbon, savings and reliability"/><div style={s.grid}>{actions.map(([a,b,c,d])=><Card key={a} title={a} value={d} text={`${b} · ${c}`}/>)}</div><Formula>CO₂e avoided + utility/member savings + reliability benefit + funding eligibility − implementation risk</Formula></>}

      <Title k="LIVE DATA CONNECTIONS" t="What LPEA would connect after the simulator proves useful"/>
      <div style={s.grid}><Feature icon={<Radio/>} t="SCADA / EMS" d="Read-only substation, feeder, generation and operating measurements."/><Feature icon={<Zap/>} t="AMI" d="Read-only interval usage, voltage and member-load segmentation."/><Feature icon={<Factory/>} t="SPP / supplier data" d="Market purchases, prices, generation mix and verified carbon factors."/><Feature icon={<Network/>} t="GIS + asset registry" d="Feeder, transformer, line and equipment context."/><Feature icon={<Truck/>} t="Fleet / fuel" d="Vehicle and generator fuel, miles, hours and idle time."/><Feature icon={<Sun/>} t="Weather + DER" d="Load normalization, renewable output, storage state and approved dispatch records."/><Feature icon={<BatteryCharging/>} t="Storage" d="Read-only state-of-charge, charge source, peak avoidance and reserve value."/></div>
    </section>
  </main>
}

function money(n:number){return n.toLocaleString('en-US',{style:'currency',currency:'USD',maximumFractionDigits:0})}
function num(n:number){return n.toLocaleString('en-US',{maximumFractionDigits:1})}
function Input({label,value,onChange}:{label:string;value:number;onChange:(v:string)=>void}){return <label style={s.inputLabel}><span>{label}</span><input type="number" step="any" value={value} onChange={e=>onChange(e.target.value)} style={s.input}/></label>}
function Result({label,value}:{label:string;value:string}){return <div style={s.result}><span>{label}</span><strong>{value}</strong></div>}
function Metric({label,value,note}:{label:string;value:string;note:string}){return <div style={s.metric}><span>{label}</span><strong>{value}</strong><small>{note}</small></div>}
function Title({k,t}:{k:string;t:string}){return <div style={s.title}><div style={s.eyebrow}>{k}</div><h2>{t}</h2></div>}
function Card({title,value,text}:{title:string;value:string;text:string}){return <div style={s.card}><div style={s.cardTop}><strong>{title}</strong><span style={s.badge}>{value}</span></div><p>{text}</p></div>}
function Feature({icon,t,d}:{icon:any;t:string;d:string}){return <div style={s.card}><div style={s.icon}>{icon}</div><strong>{t}</strong><p>{d}</p></div>}
function Panel({children}:{children:any}){return <div style={s.panel}>{children}</div>}
function Alert({t,d}:{t:string;d:string}){return <div style={s.alert}><AlertTriangle size={16}/><div><strong>{t}</strong><p>{d}</p></div></div>}
function Row({l,r}:{l:string;r:string}){return <div style={s.row}><span>{l}</span><strong>{r}</strong></div>}
function Formula({children}:{children:any}){return <div style={s.formula}>{children}</div>}

const s:Record<string,CSSProperties>={
  main:{minHeight:'100vh',background:'#07110d',color:'#edf8f0',fontFamily:'Inter,system-ui,sans-serif'},header:{borderBottom:'1px solid #1f3a2b',background:'#09170f',position:'sticky',top:0,zIndex:10},wrap:{maxWidth:1160,margin:'0 auto',padding:'36px 20px'},wrapRow:{maxWidth:1160,margin:'0 auto',padding:'14px 20px',display:'flex',gap:14,alignItems:'center',flexWrap:'wrap'},brand:{color:'#eaffef',fontWeight:900,textDecoration:'none',letterSpacing:'.06em'},product:{display:'flex',alignItems:'center',gap:7,color:'#9ce6b5',fontWeight:800},demo:{marginLeft:'auto',fontSize:11,border:'1px solid #365944',borderRadius:999,padding:'6px 9px',color:'#c6d9cc'},hero:{background:'radial-gradient(circle at 75% 20%,#17442b 0,transparent 35%),linear-gradient(180deg,#0b1d13,#07110d)'},eyebrow:{fontSize:12,fontWeight:900,letterSpacing:'.12em',color:'#78df9d'},h1:{fontSize:'clamp(40px,7vw,72px)',lineHeight:1,letterSpacing:'-.04em',maxWidth:980,margin:'12px 0 16px'},lead:{fontSize:19,lineHeight:1.65,maxWidth:960,color:'#c4d6ca'},note:{fontSize:12,lineHeight:1.6,color:'#91a497',maxWidth:950},small:{fontSize:12,lineHeight:1.5,color:'#9db1a3'},metrics:{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(190px,1fr))',gap:12,margin:'26px 0 14px'},metric:{background:'#0d1d14',border:'1px solid #244532',borderRadius:16,padding:16,display:'grid',gap:6},nav:{borderTop:'1px solid #1f3a2b',borderBottom:'1px solid #1f3a2b',background:'#08140d'},navInner:{maxWidth:1160,margin:'0 auto',padding:'0 20px',display:'flex',overflowX:'auto'},tab:{background:'transparent',border:0,color:'#9fb2a5',fontWeight:800,padding:'14px 13px',cursor:'pointer',whiteSpace:'nowrap'},tabOn:{color:'#e3ffeb',borderBottom:'2px solid #6ddd95'},title:{margin:'26px 0 14px'},grid:{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(240px,1fr))',gap:13},twoCol:{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(320px,1fr))',gap:16,alignItems:'start'},card:{background:'#0d1b13',border:'1px solid #213c2c',borderRadius:16,padding:17},cardTop:{display:'flex',gap:10,justifyContent:'space-between',alignItems:'center',flexWrap:'wrap'},badge:{border:'1px solid #365d46',background:'#11281a',color:'#c6f0d3',borderRadius:999,padding:'4px 8px',fontSize:12},icon:{width:38,height:38,borderRadius:11,display:'grid',placeItems:'center',background:'#143322',color:'#75de99',marginBottom:11},panel:{background:'#0d1b13',border:'1px solid #213c2c',borderRadius:16,padding:18},panelHeading:{margin:'0 0 6px'},alert:{display:'grid',gridTemplateColumns:'22px 1fr',gap:9,padding:'12px 0',borderBottom:'1px solid #1b3125'},row:{display:'flex',justifyContent:'space-between',gap:14,flexWrap:'wrap',padding:'12px 0',borderBottom:'1px solid #1b3125'},formula:{margin:'16px 0',padding:14,border:'1px solid #2a5039',background:'#08140d',borderRadius:12,fontFamily:'ui-monospace,monospace',color:'#c9ffda'},formGrid:{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(210px,1fr))',gap:11,marginTop:16},inputLabel:{display:'grid',gap:6,fontSize:12,fontWeight:800,color:'#b9cbbf'},input:{width:'100%',boxSizing:'border-box',background:'#07110d',border:'1px solid #34533f',borderRadius:10,padding:'10px 11px',color:'#f2fff6',fontSize:15},uploadBox:{marginTop:16,border:'1px dashed #3d6b4d',borderRadius:14,padding:14,display:'grid',gridTemplateColumns:'24px 1fr auto',gap:10,alignItems:'center'},uploadButton:{background:'#68d68e',color:'#06120a',fontWeight:900,borderRadius:10,padding:'10px 12px',cursor:'pointer',whiteSpace:'nowrap'},csvMessage:{fontSize:12,color:'#9ce6b5'},reset:{marginTop:10,background:'transparent',border:'1px solid #355642',color:'#cdebd5',borderRadius:10,padding:'9px 11px',cursor:'pointer',fontWeight:800},resultHero:{padding:18,borderRadius:14,background:'#10281a',border:'1px solid #386b49',display:'grid',gap:5,margin:'14px 0'},resultGrid:{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(170px,1fr))',gap:10},result:{background:'#08140d',border:'1px solid #203d2b',borderRadius:12,padding:13,display:'grid',gap:6},compare:{display:'grid',gridTemplateColumns:'repeat(2,minmax(0,1fr))',gap:10,marginTop:14},
};
