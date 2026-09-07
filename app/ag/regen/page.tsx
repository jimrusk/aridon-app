'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Bot, CheckCircle2, ClipboardCheck, Droplets, FlaskConical, Leaf, Printer, Save, ScanLine, ShieldCheck, Sprout, Target, Tractor, TrendingDown, Wheat } from 'lucide-react';

const panel:React.CSSProperties={background:'#fff',border:'1px solid #d8e1d5',borderRadius:18,padding:18};
const input:React.CSSProperties={width:'100%',boxSizing:'border-box',border:'1px solid #cbd8cb',borderRadius:10,padding:'10px 11px',background:'#fbfdf8',color:'#183b2c'};
const button:React.CSSProperties={border:0,borderRadius:10,padding:'11px 14px',background:'#163d2a',color:'#fff',fontWeight:900,cursor:'pointer'};

const defaultPlan={
  farmName:'Southwest Demonstration Farm',crop:'Corn / grain rotation',acres:'100',
  fertilizer:'145',herbicide:'48',insecticide:'24',fungicide:'18',water:'120',
  fertReduction:'45',herbReduction:'70',insectReduction:'60',fungReduction:'55'
};

type Plan=typeof defaultPlan;

function n(v:string){const x=Number(v);return Number.isFinite(x)?x:0}
function money(v:number){return v.toLocaleString(undefined,{style:'currency',currency:'USD',maximumFractionDigits:0})}

export default function RegenPage(){
  const [plan,setPlan]=useState<Plan>(defaultPlan);
  const [message,setMessage]=useState('');
  useEffect(()=>{try{const s=localStorage.getItem('aridon-regen-plan');if(s)setPlan({...defaultPlan,...JSON.parse(s)})}catch{}},[]);

  const calc=useMemo(()=>{
    const acres=n(plan.acres);
    const baselinePerAcre=n(plan.fertilizer)+n(plan.herbicide)+n(plan.insecticide)+n(plan.fungicide);
    const baseline=baselinePerAcre*acres;
    const targetPerAcre=
      n(plan.fertilizer)*(1-n(plan.fertReduction)/100)+
      n(plan.herbicide)*(1-n(plan.herbReduction)/100)+
      n(plan.insecticide)*(1-n(plan.insectReduction)/100)+
      n(plan.fungicide)*(1-n(plan.fungReduction)/100);
    const target=targetPerAcre*acres;
    const avoided=Math.max(0,baseline-target);
    const weightedReduction=baselinePerAcre?Math.round((1-targetPerAcre/baselinePerAcre)*100):0;
    return {acres,baselinePerAcre,baseline,targetPerAcre,target,avoided,weightedReduction};
  },[plan]);

  function save(){localStorage.setItem('aridon-regen-plan',JSON.stringify(plan));setMessage('Plan saved on this device.');setTimeout(()=>setMessage(''),2500)}
  function field(k:keyof Plan,label:string,type='number'){return <label style={{fontWeight:800,fontSize:13}}>{label}<input style={{...input,marginTop:5}} type={type} value={plan[k]} onChange={e=>setPlan(p=>({...p,[k]:e.target.value}))}/></label>}

  return <main style={{minHeight:'100vh',background:'#f3f1e7',color:'#18251d',fontFamily:'Arial,sans-serif',paddingBottom:70}}>
    <header style={{background:'#123c2a',color:'#fff',padding:'17px 18px',position:'sticky',top:0,zIndex:20,boxShadow:'0 4px 18px #123c2a22'}}>
      <div style={{maxWidth:1220,margin:'auto',display:'flex',justifyContent:'space-between',gap:14,alignItems:'center',flexWrap:'wrap'}}>
        <div><div style={{fontSize:12,fontWeight:950,color:'#c7e7a8',letterSpacing:1}}>ARIDON AG · REGENERATIVE OPERATING SYSTEM</div><strong style={{fontSize:24}}>RegenOS + RegenRover</strong></div>
        <div style={{display:'flex',gap:12,alignItems:'center',flexWrap:'wrap'}}><Link href="/ag" style={{color:'#fff',textDecoration:'none',fontWeight:850,display:'flex',gap:6,alignItems:'center'}}><ArrowLeft size={17}/> Aridon Ag</Link><button onClick={()=>window.print()} style={{...button,background:'#315f45',display:'flex',gap:7,alignItems:'center'}}><Printer size={16}/> Print</button></div>
      </div>
    </header>

    <section style={{maxWidth:1220,margin:'auto',padding:'42px 18px 20px',display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(min(100%,350px),1fr))',gap:22,alignItems:'center'}}>
      <div><div style={{fontSize:12,fontWeight:950,color:'#356943',letterSpacing:.8}}>REDUCE INPUTS WITHOUT FLYING BLIND</div><h1 style={{fontSize:'clamp(43px,7vw,76px)',lineHeight:.95,letterSpacing:-2.5,margin:'9px 0 17px'}}>Measure the field. Treat the problem. Prove the result.</h1><p style={{fontSize:19,lineHeight:1.6,color:'#536159',maxWidth:760,margin:0}}>Aridon Regen turns regenerative agriculture into an operating system: baseline every acre, reduce blanket chemical use, deploy precision mechanical and biological tools, then verify yield, soil, water and profit.</p></div>
      <aside style={{...panel,background:'#fffef9'}}><Leaf size={31} color="#356943"/><div style={{fontSize:12,fontWeight:950,color:'#356943',marginTop:10}}>THE RULE</div><h2 style={{fontSize:30,margin:'6px 0 9px'}}>Chemistry becomes the last tool, not the first.</h2><p style={{color:'#5c695f',lineHeight:1.55,margin:0}}>The system does not promise zero inputs on every farm. It stages reductions while protecting crop health, food safety and economics.</p></aside>
    </section>

    <section style={{maxWidth:1220,margin:'auto',padding:'8px 18px'}}>
      <div style={{display:'grid',gridTemplateColumns:'minmax(0,1.35fr) minmax(300px,.65fr)',gap:14}}>
        <section style={panel}><div style={{display:'flex',gap:9,alignItems:'center'}}><ClipboardCheck color="#356943"/><div><div style={{fontSize:12,fontWeight:950,color:'#356943'}}>FIELD TRANSITION PLANNER</div><h2 style={{margin:'2px 0'}}>Build the baseline</h2></div></div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))',gap:10,marginTop:14}}>{field('farmName','Farm / project name','text')}{field('crop','Crop / rotation','text')}{field('acres','Acres')}</div>
          <h3 style={{margin:'22px 0 9px'}}>Current annual input cost per acre</h3>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(150px,1fr))',gap:9}}>{field('fertilizer','Fertilizer $/acre')}{field('herbicide','Herbicide $/acre')}{field('insecticide','Insecticide $/acre')}{field('fungicide','Fungicide $/acre')}{field('water','Irrigation $/acre')}</div>
          <h3 style={{margin:'22px 0 9px'}}>Target reduction</h3>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(150px,1fr))',gap:9}}>{field('fertReduction','Fertilizer %')}{field('herbReduction','Herbicide %')}{field('insectReduction','Insecticide %')}{field('fungReduction','Fungicide %')}</div>
          <div style={{display:'flex',gap:8,alignItems:'center',marginTop:14,flexWrap:'wrap'}}><button style={{...button,display:'flex',gap:7,alignItems:'center'}} onClick={save}><Save size={16}/> Save Transition Plan</button>{message?<span style={{fontSize:13,color:'#356943',fontWeight:800}}>{message}</span>:null}</div>
        </section>
        <section style={{...panel,background:'#123c2a',color:'#fff'}}><TrendingDown color="#c7e7a8"/><div style={{fontSize:12,fontWeight:950,color:'#c7e7a8',marginTop:9}}>PLANNING CASE</div><h2 style={{fontSize:32,margin:'5px 0 12px'}}>{calc.weightedReduction}% less synthetic input spend</h2><Metric label="Baseline input spend" value={money(calc.baseline)} sub={`${money(calc.baselinePerAcre)} / acre`}/><Metric label="Target input spend" value={money(calc.target)} sub={`${money(calc.targetPerAcre)} / acre`}/><Metric label="Potential avoided spend" value={money(calc.avoided)} sub="Before equipment, labor or biological replacement costs"/><p style={{fontSize:12,lineHeight:1.5,color:'#d8e7dc',marginTop:14}}>Planning math only. Actual savings depend on crop, pest pressure, labor, equipment, biological products, weather and yield response.</p></section>
      </div>
    </section>

    <section style={{maxWidth:1220,margin:'auto',padding:'30px 18px 10px'}}><div style={{fontSize:12,fontWeight:950,color:'#356943'}}>THE SYSTEM</div><h2 style={{fontSize:'clamp(34px,5vw,52px)',margin:'6px 0 16px'}}>Four products, one field record.</h2><div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(245px,1fr))',gap:12}}>
      <Product icon={<ScanLine/>} title="RegenOS" tag="SOFTWARE BRAIN" text="Field-by-field baseline, transition plans, scouting, prescriptions, cost-per-acre, soil health, yield and buyer verification." bullets={['Chemical-use baseline','3-year transition plan','Profit-per-acre tracking','Field treatment history']}/>
      <Product icon={<Tractor/>} title="RegenRover" tag="PRECISION IMPLEMENT" text="A tractor-mounted vision toolbar that treats weeds and crop problems individually instead of spraying whole fields." bullets={['AI camera bar','Mechanical weed heads','Thermal / light module ready','Spot biological application']}/>
      <Product icon={<FlaskConical/>} title="Soil Recovery Station" tag="FIELD DIAGNOSTICS" text="Measure moisture, salinity, compaction and core soil indicators, then map corrective actions by zone." bullets={['Soil sampling workflow','Moisture + EC mapping','Compaction tracking','Biological treatment log']}/>
      <Product icon={<ShieldCheck/>} title="Verified Supply Chain" tag="PROOF LAYER" text="Turn producer-approved records into buyer-ready evidence for regenerative sourcing programs." bullets={['Input reduction evidence','Water + yield records','Traceability by field','Buyer audit packet']}/>
    </div></section>

    <section style={{maxWidth:1220,margin:'auto',padding:'30px 18px 10px'}}><div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(300px,1fr))',gap:14}}>
      <section style={panel}><div style={{display:'flex',gap:9,alignItems:'center'}}><Bot color="#356943"/><div><div style={{fontSize:12,fontWeight:950,color:'#356943'}}>REGENROVER 1.0</div><h2 style={{margin:'2px 0'}}>First hardware build</h2></div></div><ol style={{lineHeight:1.75,color:'#4f6156',paddingLeft:20}}><li>12 to 20 ft modular 3-point or pull-behind toolbar.</li><li>Front RGB cameras with row and weed detection.</li><li>GNSS position logging and section control.</li><li>Mechanical cultivation heads with independent actuation.</li><li>Low-volume spot biological / approved treatment nozzles.</li><li>Rear verification camera records treatment success.</li><li>Tablet interface sends every pass into RegenOS.</li></ol><div style={{padding:12,borderRadius:12,background:'#eef5e8',fontSize:13,color:'#356943',fontWeight:800}}>Gen 1 deliberately avoids overcomplication. Vision + mechanical control + precise spot application is the fastest path to a fieldable prototype.</div></section>
      <section style={panel}><div style={{display:'flex',gap:9,alignItems:'center'}}><Droplets color="#356943"/><div><div style={{fontSize:12,fontWeight:950,color:'#356943'}}>100-ACRE PROVING FARM</div><h2 style={{margin:'2px 0'}}>Evidence before slogans</h2></div></div><div style={{display:'grid',gap:9,marginTop:13}}>{[['25 ac','Conventional control'],['25 ac','Reduced synthetic input'],['25 ac','Regenerative management'],['25 ac','Aridon RegenOS + RegenRover']].map(([a,t])=><div key={t} style={{display:'flex',gap:12,alignItems:'center',padding:11,border:'1px solid #e0e8dd',borderRadius:11}}><strong style={{minWidth:55,color:'#356943'}}>{a}</strong><span>{t}</span></div>)}</div><p style={{color:'#5b685f',lineHeight:1.55}}>Track yield, quality, chemical use, fertilizer, labor, fuel, irrigation, soil organic matter, weed pressure, pest pressure and net profit per acre.</p></section>
    </div></section>

    <section style={{maxWidth:1220,margin:'auto',padding:'30px 18px 10px'}}><div style={{fontSize:12,fontWeight:950,color:'#356943'}}>TRANSITION LOGIC</div><h2 style={{fontSize:40,margin:'5px 0 15px'}}>Three seasons, controlled reduction.</h2><div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(250px,1fr))',gap:12}}>
      <Year n="01" title="Baseline + remove waste" goal="Cut unnecessary blanket applications" items={['Soil and tissue baseline','Map weeds and recurring pests','Introduce cover-crop / rotation plan','Mechanical control on easiest acres','Record every input and pass']}/>
      <Year n="02" title="Replace functions" goal="Shift more work to biology + precision" items={['Expand mechanical control','Add beneficial habitat / IPM','Precision nutrient applications','Biological trials in controlled blocks','Compare yield and margin by block']}/>
      <Year n="03" title="Scale what wins" goal="Near-zero routine synthetic use where practical" items={['Retire failed practices','Expand proven replacements','Contract buyer verification','Publish field-level economics','Use targeted chemistry only when justified']}/>
    </div></section>

    <section style={{maxWidth:1220,margin:'auto',padding:'34px 18px'}}><section style={{...panel,background:'#fffef9'}}><div style={{display:'flex',gap:9,alignItems:'center'}}><Target color="#356943"/><div><div style={{fontSize:12,fontWeight:950,color:'#356943'}}>BUILD SEQUENCE</div><h2 style={{margin:'2px 0'}}>What Aridon builds next</h2></div></div><div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(210px,1fr))',gap:10,marginTop:13}}>{[
      ['NOW','RegenOS MVP','Transition planner, cost baseline, field scorecard and proving-farm protocol.'],
      ['0-90 DAYS','Rover engineering','Toolbar frame, camera rig, actuation, safety interlocks and first-row bench testing.'],
      ['90-180 DAYS','Field pilot','10 to 25 acres with conventional side-by-side control and treatment verification.'],
      ['6-12 MONTHS','Commercial beta','Lease prototype machines to founding growers and sell verification to buyers.']
    ].map(([phase,title,text])=><div key={phase} style={{padding:14,border:'1px solid #dbe5d8',borderRadius:13,background:'#fafbf7'}}><div style={{fontSize:11,fontWeight:950,color:'#356943'}}>{phase}</div><h3 style={{margin:'6px 0',fontSize:20}}>{title}</h3><p style={{margin:0,color:'#5b685f',lineHeight:1.45,fontSize:14}}>{text}</p></div>)}</div></section></section>

    <footer style={{maxWidth:1220,margin:'auto',padding:'18px',color:'#657069',fontSize:13,display:'flex',justifyContent:'space-between',gap:12,flexWrap:'wrap'}}><span>Aridon Regen · planning and field validation system</span><span>Not a pesticide label, agronomic prescription or certification standard.</span></footer>
  </main>
}

function Metric({label,value,sub}:{label:string,value:string,sub:string}){return <div style={{padding:'12px 0',borderBottom:'1px solid #ffffff24'}}><div style={{fontSize:12,color:'#c7e7a8',fontWeight:850}}>{label}</div><div style={{fontSize:28,fontWeight:950,marginTop:2}}>{value}</div><div style={{fontSize:12,color:'#d8e7dc'}}>{sub}</div></div>}
function Product({icon,title,tag,text,bullets}:{icon:React.ReactNode,title:string,tag:string,text:string,bullets:string[]}){return <article style={panel}><div style={{color:'#356943'}}>{icon}</div><div style={{fontSize:11,fontWeight:950,color:'#356943',marginTop:10}}>{tag}</div><h3 style={{fontSize:27,margin:'5px 0 8px'}}>{title}</h3><p style={{color:'#5b685f',lineHeight:1.5,minHeight:84}}>{text}</p><div style={{display:'grid',gap:7}}>{bullets.map(b=><div key={b} style={{display:'flex',gap:7,alignItems:'center',fontSize:13}}><CheckCircle2 size={16} color="#356943"/>{b}</div>)}</div></article>}
function Year({n,title,goal,items}:{n:string,title:string,goal:string,items:string[]}){return <article style={panel}><div style={{width:38,height:38,borderRadius:99,display:'grid',placeItems:'center',background:'#e5eedf',color:'#356943',fontWeight:950}}>{n}</div><h3 style={{fontSize:26,margin:'11px 0 4px'}}>{title}</h3><div style={{fontSize:13,color:'#356943',fontWeight:900,marginBottom:10}}>{goal}</div><ul style={{paddingLeft:19,lineHeight:1.65,color:'#5b685f',marginBottom:0}}>{items.map(i=><li key={i}>{i}</li>)}</ul></article>}
