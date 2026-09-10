'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, BadgeCheck, Calculator, Copy, Factory, Search, ShoppingCart, Sparkles, Store, Truck, Users } from 'lucide-react';

type Plan = {
  thesis: string;
  idealCustomer: string;
  supplierProfile: string[];
  launchSteps: string[];
  showroomSections: string[];
  trafficPlan: string[];
  outreachSubject: string;
  outreachBody: string;
  riskGates: string[];
};

type Supplier = {
  id: string;
  name: string;
  website: string;
  contact: string;
  status: 'Research' | 'Qualified' | 'Contacted' | 'Approved';
};

const categories = [
  'Farm & ranch equipment',
  'Greenhouses & controlled environment',
  'Water & irrigation systems',
  'Solar, storage & generators',
  'Commercial kitchens & food equipment',
  'Prefab buildings & industrial equipment',
];

const panel = { background: '#0D1728', border: '1px solid #263956', borderRadius: 18, padding: 20 } as const;
const input = { width: '100%', boxSizing: 'border-box', background: '#08111E', color: '#F8FAFC', border: '1px solid #334866', borderRadius: 11, padding: '12px 13px', fontSize: 15 } as const;
const label = { display: 'block', color: '#9FB0C6', fontSize: 12, fontWeight: 900, marginBottom: 6 } as const;
const button = { border: 0, borderRadius: 11, padding: '12px 16px', fontWeight: 950, cursor: 'pointer', background: '#9EF0CF', color: '#07130F' } as const;

export default function CommercePage() {
  const [niche, setNiche] = useState('Commercial greenhouses');
  const [avgSale, setAvgSale] = useState(15000);
  const [supplierCostPct, setSupplierCostPct] = useState(68);
  const [adCost, setAdCost] = useState(850);
  const [freightReserve, setFreightReserve] = useState(900);
  const [returnReserve, setReturnReserve] = useState(250);
  const [targetOrders, setTargetOrders] = useState(5);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [supplierName, setSupplierName] = useState('');
  const [supplierWebsite, setSupplierWebsite] = useState('');
  const [supplierContact, setSupplierContact] = useState('');

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem('aridon-commerce-suppliers');
      if (saved) setSuppliers(JSON.parse(saved));
    } catch {}
  }, []);

  useEffect(() => {
    try { window.localStorage.setItem('aridon-commerce-suppliers', JSON.stringify(suppliers)); } catch {}
  }, [suppliers]);

  const economics = useMemo(() => {
    const supplierCost = avgSale * (supplierCostPct / 100);
    const contribution = avgSale - supplierCost - adCost - freightReserve - returnReserve;
    const contributionMargin = avgSale ? (contribution / avgSale) * 100 : 0;
    const grossMargin = 100 - supplierCostPct;
    const monthlyRevenue = avgSale * targetOrders;
    const monthlyContribution = contribution * targetOrders;
    const breakEvenRoas = avgSale / Math.max(1, avgSale - supplierCost - freightReserve - returnReserve);
    return { supplierCost, contribution, contributionMargin, grossMargin, monthlyRevenue, monthlyContribution, breakEvenRoas };
  }, [avgSale, supplierCostPct, adCost, freightReserve, returnReserve, targetOrders]);

  async function buildPlan() {
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/commerce/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ niche, avgSale, supplierCostPct, adCost, freightReserve, returnReserve, targetOrders }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not build the plan.');
      setPlan(data.plan);
    } catch (e: any) {
      setError(e?.message || 'Could not build the plan.');
    } finally { setLoading(false); }
  }

  function addSupplier() {
    if (!supplierName.trim()) return;
    setSuppliers(v => [{ id: crypto.randomUUID(), name: supplierName.trim(), website: supplierWebsite.trim(), contact: supplierContact.trim(), status: 'Research' }, ...v]);
    setSupplierName(''); setSupplierWebsite(''); setSupplierContact('');
  }

  function advanceSupplier(id: string) {
    const order: Supplier['status'][] = ['Research','Qualified','Contacted','Approved'];
    setSuppliers(v => v.map(s => s.id === id ? { ...s, status: order[Math.min(order.length - 1, order.indexOf(s.status) + 1)] } : s));
  }

  async function copy(text: string) {
    try { await navigator.clipboard.writeText(text); } catch {}
  }

  return <main style={{ minHeight: '100vh', background: '#07101D', color: '#F8FAFC', fontFamily: 'Arial,sans-serif', paddingBottom: 84 }}>
    <section style={{ maxWidth: 1180, margin: '0 auto', padding: '26px 18px 18px' }}>
      <nav style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <Link href="/" style={{ color: '#F8FAFC', textDecoration: 'none', fontWeight: 950 }}>ARIDON</Link>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <Link href="/business-os" style={{ color: '#B9C6D8', textDecoration: 'none', fontWeight: 850 }}>Business OS</Link>
          <Link href="/sales-team" style={{ color: '#B9C6D8', textDecoration: 'none', fontWeight: 850 }}>Sales AI</Link>
          <Link href="/email" style={{ color: '#B9C6D8', textDecoration: 'none', fontWeight: 850 }}>Email</Link>
        </div>
      </nav>

      <div style={{ padding: '62px 0 34px', maxWidth: 980 }}>
        <div style={{ color: '#9EF0CF', fontWeight: 950, fontSize: 12, letterSpacing: 1.2 }}>ARIDON COMMERCE ENGINE</div>
        <h1 style={{ fontSize: 'clamp(46px,8vw,82px)', lineHeight: .94, letterSpacing: -3, margin: '12px 0 18px' }}>Build a high-ticket business without guessing your way through it.</h1>
        <p style={{ maxWidth: 870, color: '#B8C4D5', fontSize: 20, lineHeight: 1.6 }}>Choose a market. Model the economics. Define the right supplier. Build the showroom, outreach and traffic plan. Keep every supplier approval and margin decision in one command center.</p>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 22 }}>
          <button onClick={buildPlan} style={button}><Sparkles size={16} style={{ verticalAlign: 'middle', marginRight: 7 }}/>{loading ? 'Building…' : 'Build My Commerce Plan'}</button>
          <a href="#supplier-command" style={{ ...button, background: 'transparent', color: '#F8FAFC', border: '1px solid #425675', textDecoration: 'none' }}>Supplier Command</a>
        </div>
      </div>

      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(290px,1fr))', gap: 14 }}>
        <article style={panel}>
          <div style={{ display: 'flex', gap: 9, alignItems: 'center' }}><Search size={20} color="#9EF0CF"/><strong>1. Pick the lane</strong></div>
          <p style={{ color: '#91A1B7', lineHeight: 1.55 }}>Start where purchase value is high enough to support human sales help, supplier margin and customer acquisition.</p>
          <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', marginBottom: 14 }}>{categories.map(c => <button key={c} onClick={() => setNiche(c)} style={{ border: '1px solid #34506B', background: niche === c ? '#9EF0CF' : '#101C2D', color: niche === c ? '#07130F' : '#DDE6F2', borderRadius: 999, padding: '8px 10px', cursor: 'pointer', fontWeight: 850 }}>{c}</button>)}</div>
          <label style={label}>Your niche or product family</label>
          <input value={niche} onChange={e => setNiche(e.target.value)} style={input}/>
        </article>

        <article style={panel}>
          <div style={{ display: 'flex', gap: 9, alignItems: 'center' }}><Calculator size={20} color="#9EF0CF"/><strong>2. Prove the economics</strong></div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 16 }}>
            <Field n="Average sale" prefix="$" v={avgSale} set={setAvgSale}/>
            <Field n="Supplier cost" suffix="%" v={supplierCostPct} set={setSupplierCostPct}/>
            <Field n="Ad cost / order" prefix="$" v={adCost} set={setAdCost}/>
            <Field n="Freight reserve" prefix="$" v={freightReserve} set={setFreightReserve}/>
            <Field n="Returns reserve" prefix="$" v={returnReserve} set={setReturnReserve}/>
            <Field n="Target orders / mo" v={targetOrders} set={setTargetOrders}/>
          </div>
        </article>
      </section>

      <section style={{ marginTop: 14, display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 10 }}>
        <Metric t="Gross margin" v={`${economics.grossMargin.toFixed(1)}%`} />
        <Metric t="Contribution / order" v={money(economics.contribution)} good={economics.contribution > 0}/>
        <Metric t="Contribution margin" v={`${economics.contributionMargin.toFixed(1)}%`} good={economics.contributionMargin > 10}/>
        <Metric t="Monthly revenue target" v={money(economics.monthlyRevenue)} />
        <Metric t="Monthly contribution" v={money(economics.monthlyContribution)} good={economics.monthlyContribution > 0}/>
        <Metric t="Break-even ROAS" v={`${economics.breakEvenRoas.toFixed(2)}x`} />
      </section>

      {error && <div style={{ marginTop: 14, padding: 14, background: '#3B1720', border: '1px solid #8A3349', borderRadius: 12 }}>{error}</div>}

      {plan && <section style={{ marginTop: 18, display: 'grid', gap: 14 }}>
        <article style={{ ...panel, borderColor: '#3E7A67' }}>
          <div style={{ color: '#9EF0CF', fontWeight: 950, fontSize: 12 }}>AI MARKET THESIS</div>
          <h2 style={{ marginBottom: 8 }}>{niche}</h2>
          <p style={{ color: '#C0CDDD', lineHeight: 1.65, fontSize: 17 }}>{plan.thesis}</p>
          <p style={{ color: '#9FB0C6', lineHeight: 1.6 }}><strong style={{ color: '#F8FAFC' }}>Ideal buyer:</strong> {plan.idealCustomer}</p>
        </article>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 14 }}>
          <PlanCard icon={<Factory size={20}/>} title="Supplier profile" items={plan.supplierProfile}/>
          <PlanCard icon={<Store size={20}/>} title="Premium showroom" items={plan.showroomSections}/>
          <PlanCard icon={<Users size={20}/>} title="Traffic & sales" items={plan.trafficPlan}/>
          <PlanCard icon={<BadgeCheck size={20}/>} title="Risk gates" items={plan.riskGates}/>
        </div>
        <article style={panel}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center' }}><h2 style={{ margin: 0 }}>7-step launch sequence</h2><ArrowRight size={20} color="#9EF0CF"/></div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(250px,1fr))', gap: 9, marginTop: 14 }}>{plan.launchSteps.map((x,i)=><div key={i} style={{ background:'#08111E',border:'1px solid #273A55',borderRadius:12,padding:13 }}><strong style={{color:'#9EF0CF'}}>{i+1}.</strong> <span style={{color:'#C6D1DF'}}>{x}</span></div>)}</div>
        </article>
        <article style={panel}>
          <div style={{ display:'flex',justifyContent:'space-between',gap:10,alignItems:'center',flexWrap:'wrap' }}><div><div style={{color:'#9EF0CF',fontSize:12,fontWeight:950}}>SUPPLIER OUTREACH</div><h2 style={{margin:'4px 0'}}>{plan.outreachSubject}</h2></div><button onClick={()=>copy(`Subject: ${plan.outreachSubject}\n\n${plan.outreachBody}`)} style={{...button,background:'#15243A',color:'#F8FAFC',border:'1px solid #3B516F'}}><Copy size={15} style={{verticalAlign:'middle',marginRight:6}}/>Copy</button></div>
          <div style={{ whiteSpace:'pre-wrap',background:'#08111E',border:'1px solid #273A55',borderRadius:12,padding:16,color:'#C5D1E0',lineHeight:1.65,marginTop:12 }}>{plan.outreachBody}</div>
        </article>
      </section>}

      <section id="supplier-command" style={{ marginTop: 22 }}>
        <div style={{ color:'#9EF0CF',fontWeight:950,fontSize:12,letterSpacing:1 }}>SUPPLIER COMMAND</div>
        <h2 style={{ fontSize:'clamp(32px,5vw,48px)',margin:'8px 0 8px' }}>Turn manufacturers into an approved product pipeline.</h2>
        <p style={{ color:'#9FB0C6',maxWidth:850,lineHeight:1.6 }}>Do not publish a supplier as “approved” until they confirm dealer terms, territory, pricing, freight, returns, warranty handling and any MAP policy.</p>
        <div style={{ ...panel, marginTop: 14 }}>
          <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))',gap:9 }}>
            <div><label style={label}>Supplier / manufacturer</label><input value={supplierName} onChange={e=>setSupplierName(e.target.value)} style={input} placeholder="Company name"/></div>
            <div><label style={label}>Website</label><input value={supplierWebsite} onChange={e=>setSupplierWebsite(e.target.value)} style={input} placeholder="https://…"/></div>
            <div><label style={label}>Contact / notes</label><input value={supplierContact} onChange={e=>setSupplierContact(e.target.value)} style={input} placeholder="Name, email or next step"/></div>
          </div>
          <button onClick={addSupplier} style={{...button,marginTop:11}}>Add supplier candidate</button>
        </div>
        <div style={{ display:'grid',gap:9,marginTop:10 }}>
          {suppliers.length === 0 ? <div style={{...panel,color:'#91A1B7'}}>No supplier candidates yet. Add the first manufacturer above, then move it through Research → Qualified → Contacted → Approved.</div> : suppliers.map(s=><article key={s.id} style={{...panel,display:'grid',gridTemplateColumns:'minmax(160px,2fr) minmax(120px,1fr) auto',gap:12,alignItems:'center'}}>
            <div><strong>{s.name}</strong><div style={{color:'#8FA2BA',fontSize:13,marginTop:4}}>{s.website || 'Website not added'}{s.contact ? ` · ${s.contact}` : ''}</div></div>
            <div><span style={{background:'#14253A',border:'1px solid #35516C',borderRadius:999,padding:'6px 9px',fontSize:12,fontWeight:900}}>{s.status}</span></div>
            <button onClick={()=>advanceSupplier(s.id)} disabled={s.status==='Approved'} style={{...button,opacity:s.status==='Approved'?.55:1}}>{s.status==='Approved'?'Approved':'Advance'}</button>
          </article>)}
        </div>
      </section>

      <section style={{ marginTop: 22, display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(260px,1fr))',gap:12 }}>
        <Mini icon={<ShoppingCart/>} title="Showroom before inventory" text="Build around supplier-approved product feeds, strong category pages, financing options and consultative calls. Avoid pretending inventory or authorization exists before it does."/>
        <Mini icon={<Truck/>} title="Freight is part of the product" text="Model lift-gate, residential delivery, damage claims, returns and warranty responsibility before paid traffic starts."/>
        <Mini icon={<BadgeCheck/>} title="Aridon verification gate" text="Supplier claims, MAP rules, warranty terms and dealer status stay marked unverified until evidence is recorded."/>
      </section>
    </section>
  </main>;
}

function Field({n,v,set,prefix,suffix}:{n:string;v:number;set:(n:number)=>void;prefix?:string;suffix?:string}){return <div><label style={label}>{n}</label><div style={{display:'flex',alignItems:'center',gap:5}}>{prefix&&<span style={{color:'#9FB0C6'}}>{prefix}</span>}<input type="number" value={v} onChange={e=>set(Number(e.target.value))} style={input}/>{suffix&&<span style={{color:'#9FB0C6'}}>{suffix}</span>}</div></div>}
function Metric({t,v,good}:{t:string;v:string;good?:boolean}){return <div style={{background:'#0D1728',border:`1px solid ${good===false?'#7B3344':'#263956'}`,borderRadius:14,padding:15}}><div style={{color:'#8FA2BA',fontSize:11,fontWeight:900}}>{t.toUpperCase()}</div><div style={{fontSize:27,fontWeight:950,marginTop:5,color:good===false?'#FF9AAE':'#F8FAFC'}}>{v}</div></div>}
function PlanCard({icon,title,items}:{icon:React.ReactNode;title:string;items:string[]}){return <article style={panel}><div style={{display:'flex',gap:8,alignItems:'center',color:'#9EF0CF'}}>{icon}<strong style={{color:'#F8FAFC'}}>{title}</strong></div><ul style={{paddingLeft:20,color:'#B9C7D8',lineHeight:1.6}}>{items.map((x,i)=><li key={i} style={{marginTop:8}}>{x}</li>)}</ul></article>}
function Mini({icon,title,text}:{icon:React.ReactNode;title:string;text:string}){return <article style={panel}><div style={{color:'#9EF0CF'}}>{icon}</div><h3>{title}</h3><p style={{color:'#9FB0C6',lineHeight:1.6}}>{text}</p></article>}
function money(n:number){return new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:0}).format(Number.isFinite(n)?n:0)}
