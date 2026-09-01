import Link from 'next/link';
import { ArrowRight, CircleDollarSign, Sprout, Target, Wheat } from 'lucide-react';

const segments = [
  {
    title: 'Greenhouse / controlled environment',
    icon: Sprout,
    decisions: ['Crop mix and production scheduling', 'Energy, water and labor intensity', 'Yield per square foot', 'Contract and market timing'],
    economics: 'Model margin per square foot, energy and labor cost, expected yield, price sensitivity and payback before recommending a change.',
  },
  {
    title: 'Specialty crop producer',
    icon: Target,
    decisions: ['Variety and planting decisions', 'Labor and harvest timing', 'Water and input allocation', 'Buyer, grade and price exposure'],
    economics: 'Model margin per acre or block, harvest labor, pack-out, water/input cost and realistic market scenarios.',
  },
  {
    title: 'Broad-acre producer',
    icon: Wheat,
    decisions: ['Input timing and rates', 'Equipment and field efficiency', 'Yield and weather risk', 'Storage, contracting and sale timing'],
    economics: 'Model margin per acre, break-even yield/price, machinery cost, financing cost and downside scenarios.',
  },
];

const questions = [
  ['What does this mean for my operation?', 'Translate the signal into the producer’s crop, acreage, facilities, location, season and constraints.'],
  ['What should I do next?', 'Give the smallest useful next decision or action, with evidence and confidence instead of generic advice.'],
  ['What will it cost me?', 'Show implementation cost, cash timing, financing/funding possibilities and important assumptions.'],
  ['What is the potential return?', 'Show a range, payback or break-even where the inputs support it. Never present a planning estimate as a guaranteed return.'],
];

export default function GrowerDecisionLensPage() {
  return <main style={{minHeight:'100vh',background:'#f4f1e8',color:'#18251d',fontFamily:'Arial,sans-serif'}}>
    <section style={{maxWidth:1080,margin:'auto',padding:'52px 18px 34px'}}>
      <div style={{color:'#356943',fontWeight:950,fontSize:13,letterSpacing:.8}}>ARIDON AG · GROWER DECISION LENS</div>
      <h1 style={{fontSize:'clamp(42px,7vw,72px)',lineHeight:.98,letterSpacing:-2.5,margin:'10px 0 18px'}}>Data is not the answer. The next decision is.</h1>
      <p style={{fontSize:20,lineHeight:1.6,color:'#526058',maxWidth:820}}>Every Aridon Ag signal should be translated into four producer questions: what it means here, what to do next, what it could cost, and what the potential economic return may be. Recommendations must be grounded in the operation rather than copied across unlike growers.</p>
    </section>

    <section style={{maxWidth:1080,margin:'auto',padding:'10px 18px 36px',display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(230px,1fr))',gap:12}}>
      {questions.map(([title,text],i)=><article key={title} style={{background:'#fff',border:'1px solid #d8e1d5',borderRadius:16,padding:18}}><div style={{width:34,height:34,borderRadius:99,display:'grid',placeItems:'center',background:'#e4eddf',color:'#356943',fontWeight:950}}>{i+1}</div><h2 style={{fontSize:22,margin:'12px 0 7px'}}>{title}</h2><p style={{margin:0,color:'#5a675f',lineHeight:1.55}}>{text}</p></article>)}
    </section>

    <section style={{background:'#fff',borderTop:'1px solid #d8e1d5',borderBottom:'1px solid #d8e1d5',padding:'48px 18px'}}>
      <div style={{maxWidth:1080,margin:'auto'}}><div style={{color:'#356943',fontWeight:950,fontSize:12}}>SEGMENT BEFORE RECOMMENDING</div><h2 style={{fontSize:'clamp(32px,5vw,50px)',margin:'8px 0 22px'}}>Different growers need different decision models.</h2><div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(270px,1fr))',gap:14}}>{segments.map(({title,icon:Icon,decisions,economics})=><article key={title} style={{background:'#faf9f4',border:'1px solid #d8e1d5',borderRadius:18,padding:20}}><Icon size={28} color="#356943"/><h3 style={{fontSize:25,margin:'10px 0'}}>{title}</h3><ul style={{paddingLeft:20,lineHeight:1.7,color:'#526058'}}>{decisions.map(x=><li key={x}>{x}</li>)}</ul><div style={{borderTop:'1px solid #d8e1d5',paddingTop:12,marginTop:12}}><strong>Economic lens</strong><p style={{color:'#5a675f',lineHeight:1.55,marginBottom:0}}>{economics}</p></div></article>)}</div></div>
    </section>

    <section style={{maxWidth:900,margin:'auto',padding:'48px 18px'}}><CircleDollarSign size={32} color="#356943"/><h2 style={{fontSize:36,margin:'10px 0'}}>Recommendation guardrails</h2><p style={{fontSize:18,lineHeight:1.65,color:'#526058'}}>Aridon should ask for missing operating facts before making a high-confidence recommendation. Cost and return outputs should expose assumptions, use ranges when uncertainty is material, distinguish verified records from estimates, and include downside or break-even scenarios for consequential capital decisions. Funding and financing can improve the plan, but should not be counted as certain until eligibility and terms are verified.</p><Link href="/ag/snapshot" style={{display:'inline-flex',alignItems:'center',gap:8,background:'#163d2a',color:'#fff',padding:'14px 17px',borderRadius:12,fontWeight:900,textDecoration:'none'}}>Apply the lens to an operation <ArrowRight size={18}/></Link></section>
  </main>;
}
