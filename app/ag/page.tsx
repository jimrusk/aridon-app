import Link from "next/link";
import { ArrowRight, BarChart3, Bot, Droplets, Package, Sprout, Tractor, Users, WalletCards } from "lucide-react";

const cards = [
  { title: "Sales & Buyers", value: "$1.65M", sub: "YTD revenue • buyer pipeline", icon: BarChart3 },
  { title: "Crop Profitability", value: "$144.37", sub: "Avg. profit / acre", icon: Sprout },
  { title: "Payroll & Labor", value: "12.8%", sub: "Labor as % of revenue", icon: Users },
  { title: "Inputs & Inventory", value: "$162K", sub: "Inventory on hand", icon: Package },
  { title: "Water Intelligence", value: "18%", sub: "Efficiency opportunity", icon: Droplets },
  { title: "Equipment", value: "94%", sub: "Fleet readiness", icon: Tractor },
];

export default function AridonAgPage() {
  return <main style={{minHeight:"100vh",background:"#f4f7f4",color:"#102a43",fontFamily:"Arial, sans-serif"}}>
    <section style={{background:"linear-gradient(135deg,#062a46,#0a533e)",color:"white",padding:"64px 7%"}}>
      <div style={{maxWidth:1180,margin:"auto"}}>
        <div style={{fontWeight:800,letterSpacing:2,color:"#9be15d"}}>ARIDON AG</div>
        <h1 style={{fontSize:"clamp(42px,7vw,78px)",lineHeight:1,margin:"18px 0"}}>Boost Sales.<br/>Improve Crops.<br/>Control Payroll.</h1>
        <p style={{fontSize:21,maxWidth:780,lineHeight:1.55,color:"#d8ebe4"}}>One AI-powered operating system for the business of agriculture. Turn farm data into clear actions across revenue, fields, labor, inputs, equipment and water.</p>
        <div style={{display:"flex",gap:14,flexWrap:"wrap",marginTop:30}}><Link href="/" style={{background:"#7fd13b",color:"#092d28",padding:"14px 22px",borderRadius:10,fontWeight:800,textDecoration:"none"}}>Explore Aridon <ArrowRight size={16} style={{verticalAlign:"middle"}}/></Link><a href="#farm-bureau" style={{border:"1px solid #a9d8c7",color:"white",padding:"14px 22px",borderRadius:10,fontWeight:700,textDecoration:"none"}}>Farm Bureau Program</a></div>
      </div>
    </section>

    <section style={{maxWidth:1180,margin:"-28px auto 0",padding:"0 24px"}}><div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(230px,1fr))",gap:14}}>{cards.map(({title,value,sub,icon:Icon})=><div key={title} style={{background:"white",padding:22,borderRadius:16,boxShadow:"0 10px 35px #173b2a18"}}><Icon size={25} color="#278348"/><div style={{fontSize:14,fontWeight:800,marginTop:12}}>{title}</div><div style={{fontSize:30,fontWeight:900,margin:"7px 0"}}>{value}</div><div style={{fontSize:14,color:"#607284"}}>{sub}</div></div>)}</div></section>

    <section style={{maxWidth:1180,margin:"64px auto",padding:"0 24px",display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(300px,1fr))",gap:22}}>
      <div style={{background:"#0c314c",color:"white",borderRadius:20,padding:30}}><Bot size={34} color="#9be15d"/><h2>Aridon AI Farm Advisor</h2><p style={{lineHeight:1.65,color:"#d7e5ee"}}>Not another dashboard. Aridon identifies margin leaks, buyer opportunities, overtime pressure, input-cost changes and field-level performance, then turns them into prioritized actions.</p></div>
      <div style={{background:"white",borderRadius:20,padding:30}}><WalletCards size={34} color="#278348"/><h2>Business + Field Intelligence</h2><p style={{lineHeight:1.65,color:"#52677a"}}>Connect accounting, payroll, CRM, field records, inventory and documents. Aridon is designed to complement existing farm software rather than force producers to rip and replace tools that already work.</p></div>
    </section>

    <section id="farm-bureau" style={{background:"#e8f3e6",padding:"64px 24px"}}><div style={{maxWidth:1000,margin:"auto"}}><div style={{fontWeight:900,color:"#278348"}}>PROPOSED FARM BUREAU MEMBER PROGRAM</div><h2 style={{fontSize:42,marginBottom:12}}>A digital member benefit built around farm profitability.</h2><p style={{fontSize:19,lineHeight:1.65,maxWidth:850}}>Aridon proposes a pilot member program that gives participating producers preferred access to Aridon Ag, onboarding and AI-powered operational insights. Farm Bureau gains a modern technology benefit. Members gain one place to improve sales, crop economics, labor efficiency and resilience.</p><div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))",gap:14,marginTop:28}}>{["Preferred member pricing","90-day pilot cohort","Co-branded onboarding","Aggregate impact reporting"].map(x=><div key={x} style={{background:"white",padding:18,borderRadius:12,fontWeight:800}}>{x}</div>)}</div><p style={{marginTop:26,fontSize:13,color:"#607284"}}>Proposal concept only. No Farm Bureau endorsement or partnership is implied until formally approved.</p></div></section>
  </main>
}
