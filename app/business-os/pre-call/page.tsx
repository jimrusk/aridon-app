"use client";

import { useMemo, useState } from "react";

export default function PreCallPage() {
  const [problem, setProblem] = useState("");
  const [inaction, setInaction] = useState("");
  const [solution, setSolution] = useState("");
  const [proof, setProof] = useState("");
  const [nextStep, setNextStep] = useState("");

  const brief = useMemo(() => [
    ["1. The problem", problem],
    ["2. Cost of inaction", inaction],
    ["3. How Aridon helps", solution],
    ["4. Proof", proof],
    ["5. Next step", nextStep],
  ], [problem, inaction, solution, proof, nextStep]);

  const copyBrief = async () => {
    const text = brief.map(([h, b]) => `${h}\n${b || "—"}`).join("\n\n");
    await navigator.clipboard.writeText(text);
  };

  return (
    <main style={{maxWidth:1100,margin:"0 auto",padding:"48px 24px",color:"#f7f7f7"}}>
      <p style={{color:"#a78bfa",fontWeight:700}}>ARIDON BUSINESS OS · SALES ENABLEMENT</p>
      <h1 style={{fontSize:"clamp(2.2rem,6vw,4.5rem)",lineHeight:1,margin:"12px 0"}}>Pre-Call One-Page Builder</h1>
      <p style={{fontSize:20,color:"#c7c7d1",maxWidth:820}}>Educate before the call so the call can focus on fit, decisions, and closing. Build one concise brief in the order a prospect needs to understand it.</p>

      <section style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(300px,1fr))",gap:22,marginTop:36}}>
        <Editor n="1" title="The prospect's problem" hint="Describe their current situation in their language—not your credentials or solution." value={problem} set={setProblem}/>
        <Editor n="2" title="Cost of inaction" hint="Quantify revenue, time, labor, risk, or opportunity lost if nothing changes." value={inaction} set={setInaction}/>
        <Editor n="3" title="Solution mechanism" hint="Explain in 3–5 simple steps what happens when they work with Aridon and why it works." value={solution} set={setSolution}/>
        <Editor n="4" title="Proof" hint="Use verified before/after outcomes, ROI, time saved, or customer results. Never invent proof." value={proof} set={setProof}/>
        <Editor n="5" title="One next step" hint="Give one clear action and tell them exactly what the call will accomplish." value={nextStep} set={setNextStep}/>
      </section>

      <section style={{marginTop:38,padding:28,border:"1px solid #30303b",borderRadius:22,background:"#111118"}}>
        <div style={{display:"flex",justifyContent:"space-between",gap:16,alignItems:"center",flexWrap:"wrap"}}>
          <div><p style={{color:"#a78bfa",fontWeight:700,margin:0}}>LIVE PREVIEW</p><h2 style={{fontSize:30,margin:"6px 0"}}>Prospect Brief</h2></div>
          <button onClick={copyBrief} style={{padding:"12px 18px",borderRadius:12,border:0,fontWeight:800,cursor:"pointer"}}>Copy one-page brief</button>
        </div>
        {brief.map(([h,b]) => <div key={h} style={{padding:"18px 0",borderTop:"1px solid #282832"}}><h3 style={{margin:"0 0 7px"}}>{h}</h3><p style={{margin:0,color:"#d1d1da",whiteSpace:"pre-wrap"}}>{b || "Add this section above."}</p></div>)}
      </section>

      <section style={{marginTop:28,padding:24,borderRadius:18,background:"#171321"}}>
        <h2 style={{marginTop:0}}>How Aridon uses it</h2>
        <p style={{color:"#d1d1da",lineHeight:1.7}}>Send the brief about 24 hours before a scheduled sales conversation. On the call, do not re-present it. Ask what resonated, what questions it raised, and start from the prospect's reaction. Aridon can later generate these briefs from CRM notes, Enterprise Scan findings, Opportunity Scores, and verified ROI Ledger evidence.</p>
      </section>
    </main>
  );
}

function Editor({n,title,hint,value,set}:{n:string,title:string,hint:string,value:string,set:(v:string)=>void}) {
  return <label style={{display:"block",padding:22,border:"1px solid #30303b",borderRadius:18,background:"#101016"}}>
    <span style={{color:"#a78bfa",fontWeight:800}}>STEP {n}</span>
    <h2 style={{fontSize:22,margin:"8px 0"}}>{title}</h2>
    <p style={{color:"#aaaab6",minHeight:48}}>{hint}</p>
    <textarea value={value} onChange={e=>set(e.target.value)} rows={7} style={{width:"100%",boxSizing:"border-box",borderRadius:12,border:"1px solid #3a3a46",background:"#09090d",color:"white",padding:14,fontSize:16}} />
  </label>
}
