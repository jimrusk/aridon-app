export const metadata = {
  title: 'Aridon Flexible Energy Campus',
  description: 'A demonstration platform for orchestrating distributed energy, water, storage, computing and flexible loads as grid resources.'
};

const assets = [
  ['Solar + Wind', 'Variable generation forecast and dispatch'],
  ['Battery Storage', 'Charge, discharge and reserve capacity scheduling'],
  ['Geothermal', 'Firm clean generation and abandoned-well conversion pilots'],
  ['AWG Water Systems', 'Shift water production into lower-cost / lower-stress grid windows'],
  ['Data Center Loads', 'Flexible compute scheduling, backup power and demand shaping'],
  ['Buildings + EVs', 'Demand response, charging control and peak reduction'],
];

const phases = [
  ['1. Instrument', 'Meter generation, load, water production, storage state and interconnection limits in real time.'],
  ['2. Forecast', 'Predict campus demand, renewable output, grid conditions, weather and water-production needs.'],
  ['3. Optimize', 'Choose when to consume, store, export, curtail or shift loads while protecting reliability and cost.'],
  ['4. Authorize', 'Use Sentinel policy controls for consequential dispatch, access and automation decisions.'],
  ['5. Demonstrate', 'Operate repeatable utility pilots and publish performance, resilience, cost and capacity results.'],
  ['6. Commercialize', 'Package the control layer, integration playbook and campus test environment for utilities and industrial customers.'],
];

export default function FlexibleEnergyCampusPage() {
  return (
    <main style={{minHeight:'100vh',background:'#071018',color:'#edf7ff',fontFamily:'Inter,Arial,sans-serif',padding:'48px 20px'}}>
      <div style={{maxWidth:1100,margin:'0 auto'}}>
        <div style={{fontSize:13,letterSpacing:2,textTransform:'uppercase',color:'#8ed8ff',marginBottom:12}}>Aridon · Southwest Technology Campus</div>
        <h1 style={{fontSize:'clamp(38px,6vw,72px)',lineHeight:1.02,margin:'0 0 18px'}}>Flexible Energy Campus</h1>
        <p style={{fontSize:22,lineHeight:1.5,maxWidth:880,color:'#c8d8e5'}}>Turn the campus into a living grid laboratory where energy generation, storage, water production, computing and buildings behave as coordinated, controllable resources.</p>

        <section style={{margin:'38px 0',padding:28,border:'1px solid #21445a',borderRadius:18,background:'#0b1822'}}>
          <h2 style={{marginTop:0}}>Operating objective</h2>
          <p style={{fontSize:18,lineHeight:1.6,color:'#d7e7f2'}}>Increase usable interconnection capacity, lower peak demand, reduce operating cost, improve resilience and prove that flexible industrial loads such as atmospheric water generation and data-center computing can support the grid instead of simply consuming from it.</p>
        </section>

        <h2>Campus resources under orchestration</h2>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(250px,1fr))',gap:14}}>
          {assets.map(([name,desc]) => <div key={name} style={{padding:20,border:'1px solid #19384d',borderRadius:14,background:'#0a151e'}}><strong style={{fontSize:18}}>{name}</strong><div style={{marginTop:8,color:'#a9c1d2',lineHeight:1.45}}>{desc}</div></div>)}
        </div>

        <h2 style={{marginTop:44}}>Control loop</h2>
        <div style={{display:'grid',gap:12}}>{phases.map(([name,desc]) => <div key={name} style={{padding:'18px 20px',borderLeft:'4px solid #62c7ff',background:'#0a151e',borderRadius:10}}><strong>{name}</strong><div style={{marginTop:5,color:'#b8cbd8'}}>{desc}</div></div>)}</div>

        <section style={{marginTop:44,padding:28,border:'1px solid #21445a',borderRadius:18,background:'#0b1822'}}>
          <h2 style={{marginTop:0}}>First demonstration</h2>
          <p style={{fontSize:18,lineHeight:1.6}}>Start with a controllable microgrid cell combining solar, battery storage, one flexible AWG load, a simulated or live data-center load, interval metering and an interconnection limit. Run baseline versus optimized operation and measure peak kW reduction, shifted kWh, curtailed energy avoided, water produced per energy window, battery cycling, resilience duration and avoided infrastructure cost.</p>
        </section>

        <section style={{marginTop:28,padding:28,border:'1px solid #21445a',borderRadius:18}}>
          <h2 style={{marginTop:0}}>Utility pilot offer</h2>
          <p style={{lineHeight:1.6,color:'#c8d8e5'}}>Aridon will host a controlled 60–90 day demonstration with a utility, technology supplier or research partner. Partners define feeder/interconnection constraints and success criteria; Aridon integrates the flexible assets, telemetry, optimization logic and Sentinel action controls, then delivers a validation report and commercialization roadmap.</p>
        </section>
      </div>
    </main>
  );
}
