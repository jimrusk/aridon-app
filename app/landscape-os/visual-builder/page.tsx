'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';

const styles = ['Southwestern xeriscape','Modern desert','Lush residential','Low-water commercial','Native pollinator','Turf + shade','Luxury outdoor living'];

export default function LandscapeVisualBuilderPage() {
  const [before, setBefore] = useState<string>('');
  const [after, setAfter] = useState<string>('');
  const [customer, setCustomer] = useState('Customer Concept');
  const [address, setAddress] = useState('');
  const [style, setStyle] = useState(styles[0]);
  const [notes, setNotes] = useState('Add shade trees, drought-tolerant planting, defined beds, efficient irrigation and a clean entry sequence.');
  const [budget, setBudget] = useState('$15,000–$25,000');

  function load(file: File | undefined, setter: (v:string)=>void) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setter(String(reader.result || ''));
    reader.readAsDataURL(file);
  }

  const proposalText = useMemo(() => [
    style,
    notes,
    `Planning budget: ${budget}`,
    'Concept image is for customer visualization and estimating discussion. Final scope, plant quantities, irrigation, grading and construction details require field verification.'
  ], [style, notes, budget]);

  return (
    <main style={{minHeight:'100vh',background:'#F3F0E8',color:'#171A15',fontFamily:'Arial,sans-serif'}}>
      <section style={{background:'#162716',color:'#F6FAF3',padding:'22px 20px 54px'}}>
        <div style={{maxWidth:1180,margin:'0 auto'}}>
          <nav style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:12,flexWrap:'wrap'}}>
            <Link href="/landscape-os" style={{color:'#F6FAF3',textDecoration:'none',fontWeight:950}}>ARIDON · LANDSCAPE VISUAL BUILDER</Link>
            <div style={{display:'flex',gap:8,flexWrap:'wrap'}}><Link href="/landscape-os" style={nav}>Landscape OS</Link><Link href="/customer/login" style={primary}>Open Private Visual Studio</Link></div>
          </nav>
          <div style={{maxWidth:850,paddingTop:42}}><div style={eyebrow}>CUSTOMER PICTURE BUILDER</div><h1 style={{fontSize:'clamp(44px,7vw,72px)',lineHeight:.96,letterSpacing:-2.5,margin:'14px 0 18px'}}>Show the customer what the property could become.</h1><p style={{fontSize:19,lineHeight:1.65,color:'#C8D4C3'}}>Upload the current property photo, add an AI or designer concept image, and build a clean before-and-after proposal board for the estimate conversation. The private Aridon Visual Studio can generate concept imagery for authenticated workspaces; this page also accepts any finished concept image your team creates.</p></div>
        </div>
      </section>

      <section style={{maxWidth:1180,margin:'0 auto',padding:'34px 20px 70px'}}>
        <div style={{display:'grid',gridTemplateColumns:'minmax(300px,.72fr) minmax(0,1.28fr)',gap:18,alignItems:'start'}} className="visual-grid">
          <aside style={card}>
            <div style={eyebrow}>PROJECT SETUP</div>
            <Field label="Customer / project"><input value={customer} onChange={e=>setCustomer(e.target.value)} style={input}/></Field>
            <Field label="Property address"><input value={address} onChange={e=>setAddress(e.target.value)} placeholder="Optional" style={input}/></Field>
            <Field label="Design direction"><select value={style} onChange={e=>setStyle(e.target.value)} style={input}>{styles.map(s=><option key={s}>{s}</option>)}</select></Field>
            <Field label="Planning budget"><input value={budget} onChange={e=>setBudget(e.target.value)} style={input}/></Field>
            <Field label="What should change?"><textarea value={notes} onChange={e=>setNotes(e.target.value)} rows={6} style={{...input,resize:'vertical'}}/></Field>
            <Field label="Current property photo"><input type="file" accept="image/*" onChange={e=>load(e.target.files?.[0],setBefore)} /></Field>
            <Field label="Proposed / AI concept image"><input type="file" accept="image/*" onChange={e=>load(e.target.files?.[0],setAfter)} /></Field>
            <div style={{background:'#EEF5E8',border:'1px solid #D4E4CA',borderRadius:14,padding:14,marginTop:16,fontSize:13,lineHeight:1.6,color:'#566050'}}><strong>AI picture generation:</strong> use the authenticated Aridon Visual Studio to generate customer concepts, then place the approved draft here for side-by-side presentation. Keep concepts labeled as visualizations until scope and pricing are verified.</div>
          </aside>

          <section style={{display:'grid',gap:14}}>
            <article style={{...card,padding:0,overflow:'hidden'}}>
              <div style={{padding:'18px 20px',borderBottom:'1px solid #E2DDD2',display:'flex',justifyContent:'space-between',gap:12,flexWrap:'wrap'}}><div><div style={eyebrow}>CUSTOMER PRESENTATION BOARD</div><h2 style={{fontSize:28,margin:'6px 0 0'}}>{customer || 'Landscape Concept'}</h2>{address && <div style={{color:'#77736B',marginTop:5}}>{address}</div>}</div><div style={{alignSelf:'center',background:'#E7F3DF',padding:'8px 12px',borderRadius:999,fontWeight:900,color:'#42643B'}}>{style}</div></div>
              <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(290px,1fr))'}}>
                <Picture label="BEFORE" src={before} empty="Upload the customer's current property photo." />
                <Picture label="PROPOSED CONCEPT" src={after} empty="Add the AI-generated or designer concept image." />
              </div>
            </article>

            <article style={card}>
              <div style={eyebrow}>CONCEPT NOTES</div>
              <div style={{display:'grid',gap:9,marginTop:12}}>{proposalText.map((t,i)=><div key={i} style={{display:'grid',gridTemplateColumns:'28px 1fr',gap:9,alignItems:'start'}}><span style={{width:26,height:26,borderRadius:999,display:'grid',placeItems:'center',background:'#DDEBCF',fontWeight:950,color:'#405D39',fontSize:12}}>{i+1}</span><span style={{lineHeight:1.6,color:'#55534D'}}>{t}</span></div>)}</div>
            </article>

            <article style={{...card,background:'#172617',color:'#F6F8F4'}}><div style={{...eyebrow,color:'#A8E06F'}}>SALES WORKFLOW</div><h3 style={{fontSize:28,margin:'8px 0 12px'}}>Picture → scope → estimate → approval.</h3><p style={{lineHeight:1.7,color:'#C7D1C3'}}>Attach the visual board to the estimate, show alternates at different budgets, record what the customer likes, and move approved elements into the actual job scope. This keeps the picture from becoming an accidental construction promise.</p><div style={{display:'flex',gap:9,flexWrap:'wrap',marginTop:18}}><Link href="/customer/login" style={primary}>Generate concepts in Visual Studio</Link><Link href="/landscape-os" style={nav}>Back to Landscape OS</Link></div></article>
          </section>
        </div>
      </section>
      <style jsx global>{`@media(max-width:800px){.visual-grid{grid-template-columns:1fr!important}}`}</style>
    </main>
  );
}

function Field({label,children}:{label:string;children:React.ReactNode}){return <label style={{display:'grid',gap:7,marginTop:15,fontSize:13,fontWeight:850,color:'#5C5A54'}}>{label}{children}</label>}
function Picture({label,src,empty}:{label:string;src:string;empty:string}){return <div style={{minHeight:360,background:'#E9E8E1',position:'relative',borderRight:'1px solid #DDD8CE'}}><div style={{position:'absolute',zIndex:2,top:14,left:14,background:'rgba(18,33,18,.88)',color:'#fff',padding:'7px 10px',borderRadius:999,fontSize:11,fontWeight:950,letterSpacing:1}}>{label}</div>{src?<img src={src} alt={label} style={{width:'100%',height:420,objectFit:'cover',display:'block'}}/>:<div style={{height:420,display:'grid',placeItems:'center',padding:30,textAlign:'center',color:'#77736B',lineHeight:1.6}}>{empty}</div>}</div>}

const card:React.CSSProperties={background:'#fff',border:'1px solid #D8D2C7',borderRadius:18,padding:20,boxShadow:'0 12px 30px rgba(45,55,40,.06)'};
const eyebrow:React.CSSProperties={color:'#527A48',fontWeight:950,fontSize:12,letterSpacing:1.4,textTransform:'uppercase'};
const input:React.CSSProperties={width:'100%',boxSizing:'border-box',border:'1px solid #CFC9BD',borderRadius:10,padding:'11px 12px',font: 'inherit',background:'#fff'};
const primary:React.CSSProperties={background:'#A8E06F',color:'#15210E',textDecoration:'none',fontWeight:950,borderRadius:999,padding:'11px 15px',display:'inline-block'};
const nav:React.CSSProperties={color:'#EFF5EA',textDecoration:'none',border:'1px solid #486243',borderRadius:999,padding:'10px 14px',fontWeight:850,fontSize:14};
