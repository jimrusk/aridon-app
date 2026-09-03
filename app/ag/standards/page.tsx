import Link from 'next/link';
import { ArrowRight, BadgeCheck, FileCheck2, Leaf, Network, ShieldCheck, Sprout, Target } from 'lucide-react';

const frameworks = [
  {
    name: 'Purpose Pledge',
    href: '/ag/standards/purpose-pledge',
    icon: Target,
    kicker: 'Purpose + stakeholder governance',
    text: 'Turn purpose commitments into owned actions, milestones, evidence, stakeholder reporting and a three-year improvement cycle.',
    status: 'Alignment prototype',
  },
  {
    name: 'Rainforest Alliance',
    href: '/ag/standards/rainforest-alliance',
    icon: Leaf,
    kicker: 'Regenerative + certification readiness',
    text: 'Organize farm, supply-chain, traceability, geodata, audit and regenerative outcome evidence around certification and continuous improvement workflows.',
    status: 'Alignment prototype',
  },
];

const shared = [
  ['Evidence ledger', 'Policies, field records, measurements, photos, documents, approvals and verification stay tied to the claim they support.', FileCheck2],
  ['Farmer-first execution', 'Farmers and producer groups get simple action plans while program teams get portfolio visibility and escalation.', Sprout],
  ['Partner workspace', 'Brands, NGOs, agronomists, auditors and funders can collaborate through scoped roles without exposing unrelated data.', Network],
  ['Assurance guardrails', 'Aridon distinguishes internal readiness from formal third-party certification and preserves human review.', ShieldCheck],
];

export default function StandardsHubPage() {
  return (
    <main style={{minHeight:'100vh',background:'#f4f7f2',color:'#17384a',fontFamily:'Arial,sans-serif',paddingBottom:80}}>
      <header style={{background:'linear-gradient(135deg,#082f44,#14503f 72%,#527744)',color:'#fff',padding:'22px 20px 50px'}}>
        <div style={{maxWidth:1180,margin:'auto'}}>
          <nav style={{display:'flex',justifyContent:'space-between',gap:14,alignItems:'center',flexWrap:'wrap'}}>
            <div><div style={{color:'#c9ef9f',fontSize:12,fontWeight:950,letterSpacing:1.3}}>ARIDON AG</div><strong style={{fontSize:23}}>Standards & Partnership Hub</strong></div>
            <div style={{display:'flex',gap:12,flexWrap:'wrap'}}><Link href="/ag" style={{color:'#fff',textDecoration:'none',fontWeight:850}}>Aridon Ag</Link><Link href="/ag/governance" style={{color:'#fff',textDecoration:'none',fontWeight:850}}>Enterprise Governance</Link></div>
          </nav>
          <div style={{maxWidth:850,paddingTop:42}}>
            <div style={{color:'#c9ef9f',fontWeight:950,fontSize:12,letterSpacing:1}}>ONE OPERATING LAYER, MULTIPLE TRUST FRAMEWORKS</div>
            <h1 style={{fontSize:'clamp(42px,7vw,74px)',lineHeight:.98,margin:'12px 0 18px',letterSpacing:-2.5}}>Do the work once.<br/><span style={{color:'#c9ef9f'}}>Prove it many ways.</span></h1>
            <p style={{fontSize:19,lineHeight:1.65,color:'#dcebe4',maxWidth:820}}>Aridon Ag can map the same farm, supply-chain, finance and impact evidence into different sustainability frameworks without making producers re-enter the same information over and over.</p>
          </div>
        </div>
      </header>

      <section style={{maxWidth:1180,margin:'-22px auto 0',padding:'0 20px',display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(310px,1fr))',gap:14}}>
        {frameworks.map(({name,href,icon:Icon,kicker,text,status})=>(
          <Link key={name} href={href} style={{background:'#fff',border:'1px solid #dce7df',borderRadius:22,padding:24,textDecoration:'none',color:'#17384a',display:'block',boxShadow:'0 10px 28px rgba(20,50,35,.06)'}}>
            <div style={{display:'flex',justifyContent:'space-between',gap:12,alignItems:'start'}}><Icon size={34} color="#2e7d32"/><span style={{fontSize:11,fontWeight:950,background:'#eef5ea',color:'#2e7d32',padding:'7px 9px',borderRadius:999}}>{status}</span></div>
            <div style={{fontSize:12,fontWeight:950,color:'#2e7d32',marginTop:18}}>{kicker.toUpperCase()}</div>
            <h2 style={{fontSize:32,margin:'6px 0 10px'}}>{name}</h2>
            <p style={{color:'#607284',lineHeight:1.6,margin:0}}>{text}</p>
            <div style={{display:'flex',gap:8,alignItems:'center',marginTop:20,fontWeight:950,color:'#245f3a'}}>Open module <ArrowRight size={17}/></div>
          </Link>
        ))}
      </section>

      <section style={{maxWidth:1180,margin:'24px auto 0',padding:'0 20px'}}>
        <div style={{background:'#e7f1e3',borderRadius:22,padding:26}}>
          <div style={{display:'flex',gap:9,alignItems:'center',color:'#2e7d32',fontWeight:950,fontSize:12}}><BadgeCheck/> SHARED ARIDON FOUNDATION</div>
          <h2 style={{fontSize:36,margin:'8px 0 18px'}}>Evidence stays reusable, private and actionable.</h2>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(250px,1fr))',gap:12}}>{shared.map(([title,text,Icon]:any)=><div key={title} style={{background:'#fff',borderRadius:16,padding:18}}><Icon color="#2e7d32"/><h3 style={{margin:'10px 0 6px'}}>{title}</h3><p style={{margin:0,color:'#607284',lineHeight:1.55,fontSize:14}}>{text}</p></div>)}</div>
        </div>
      </section>

      <section style={{maxWidth:1180,margin:'18px auto 0',padding:'0 20px'}}><div style={{background:'#fff',border:'1px solid #dce7df',borderRadius:18,padding:20,color:'#607284',lineHeight:1.55}}><strong style={{color:'#17384a'}}>Important:</strong> These are Aridon compatibility and readiness modules. They do not imply endorsement, affiliation, accreditation, or certification by Purpose Pledge, Rainforest Alliance, or any other standards body.</div></section>
    </main>
  );
}
