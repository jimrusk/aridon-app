import type { Metadata } from 'next';
import Link from 'next/link';

const mint = '#9EF0CF';
const gold = '#F4D06F';
const blue = '#9DB7FF';
const card = { background:'#0D1728', border:'1px solid #2B3C59', borderRadius:18, padding:20 } as const;

export const metadata: Metadata = {
  title: 'Aridon Crossroads | Southwest Innovation, Manufacturing & Entertainment Campus',
  description: 'Aridon Crossroads is a proposed mixed-use innovation, manufacturing, agriculture, sports, hospitality and entertainment campus in Farmington, New Mexico, designed to connect business growth, workforce development and Four Corners tourism.',
  keywords: [
    'Aridon Crossroads',
    'Farmington New Mexico development',
    'Four Corners innovation campus',
    'Southwest technology campus',
    'New Mexico manufacturing campus',
    'Farmington sports entertainment district',
    'water energy agriculture innovation',
    'Farmington economic development',
    'Southwest R&D campus',
    'Piñon Hills Boulevard development',
  ],
  alternates: { canonical: 'https://aridon-v02.vercel.app/crossroads' },
  openGraph: {
    title: 'Aridon Crossroads | Build the Southwest Here',
    description: 'A proposed Farmington, New Mexico campus combining innovation, manufacturing, agriculture, sports, hospitality and entertainment on both sides of Piñon Hills Boulevard.',
    url: 'https://aridon-v02.vercel.app/crossroads',
    siteName: 'Aridon',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Aridon Crossroads | Farmington, New Mexico',
    description: 'A proposed Four Corners destination for innovation, manufacturing, agriculture, sports, hospitality and entertainment.',
  },
};

const anchors = [
  ['Business & Innovation Campus','Aridon headquarters, incubator and startup offices, conference and training space, AI/water/energy labs, agricultural innovation and workforce development.'],
  ['Advanced Manufacturing','Light industrial flex buildings, apparel distribution and future manufacturing, warehouse and logistics capacity, maker space and fabrication.'],
  ['Water, Energy & Agriculture','R&D labs, atmospheric water and resilience technology, solar and storage integration, greenhouses and demonstration agriculture.'],
  ['Sports & Events','Fieldhouse, indoor tournament venue, ice and event arena, sports institute and event lawn tied to the existing Farmington Sports Complex.'],
  ['Adventure & Entertainment','Restaurant row, miniature golf, electric go-karts, tube racing, family attractions and a destination entertainment mix.'],
  ['Hospitality & Community','Hotel and tournament village, commercial kitchen and food-business incubator, public plaza and community gathering spaces.'],
];

const phases = [
  ['Phase 1','Sports + Entertainment District','Fieldhouse, ice arena, restaurant row, mini golf, go-karts, tube racing and kids/family attractions.'],
  ['Phase 2','Business + Innovation Campus','Aridon headquarters, R&D, incubator, training, workforce, manufacturing support, agriculture and demonstration systems.'],
  ['Phase 3','Hospitality + Expansion','Hotel/tournament village, additional manufacturing and greenhouse capacity, future buildings and expanded destination programming.'],
];

const partnerTypes = [
  ['Capital Partners','Family offices, strategic investors, infrastructure capital, real-estate partners and project-finance groups.'],
  ['Corporate Sponsors','Naming-rights partners, technology brands, agriculture companies, energy firms, financial institutions and regional employers.'],
  ['Development Partners','Commercial developers, hotel operators, entertainment brands, restaurant groups, construction teams and site-development specialists.'],
  ['Research & Education','Colleges, universities, labs, workforce programs, technology companies and applied R&D collaborators.'],
  ['Public & Community','City, county, regional economic-development organizations, tourism partners and Four Corners community stakeholders.'],
  ['Operators & Tenants','Restaurants, sports operators, hospitality groups, manufacturers, logistics companies, startups and service businesses.'],
];

const faqs = [
  ['Where is Aridon Crossroads proposed?','The concept is centered on both sides of Piñon Hills Boulevard in Farmington, New Mexico, near the existing Farmington Sports Complex and major regional routes.'],
  ['What is the project?','Aridon Crossroads is a proposed mixed-use campus and destination district that combines business innovation, research, manufacturing, agriculture, sports, hospitality, dining, entertainment and workforce development.'],
  ['Is the plan final?','No. The current master plan is conceptual and intended for discussion, partner recruitment, feasibility work, financing, site planning and public-private coordination. Final scope depends on site control, engineering, entitlements, agreements, financing and market validation.'],
  ['What kinds of investors or sponsors are being sought?','Aridon is seeking family offices, strategic investors, infrastructure and real-estate capital, corporate sponsors, naming-rights partners, project-finance groups, developers and mission-aligned catalytic capital.'],
  ['Can individual buildings or districts be financed separately?','That is a core strategy under consideration. The project can be organized into separate development, operating and technology opportunities so capital partners can participate in the parts that match their mandate.'],
  ['How can a company explore a partnership?','Email Eva at evaaridon@gmail.com with Crossroads in the subject line and describe the investment, sponsorship, tenant, development or technology role you want to discuss.'],
];

export default function CrossroadsPage(){
  const projectSchema = {
    '@context':'https://schema.org',
    '@type':'Project',
    name:'Aridon Crossroads',
    description:'A proposed mixed-use innovation, manufacturing, agriculture, sports, hospitality and entertainment campus in Farmington, New Mexico.',
    url:'https://aridon-v02.vercel.app/crossroads',
    location:{ '@type':'Place', name:'Farmington, New Mexico', address:{ '@type':'PostalAddress', addressLocality:'Farmington', addressRegion:'NM', addressCountry:'US' } },
    member:{ '@type':'Organization', name:'Aridon', url:'https://aridon-v02.vercel.app' },
  };
  const faqSchema = { '@context':'https://schema.org', '@type':'FAQPage', mainEntity: faqs.map(([q,a])=>({ '@type':'Question', name:q, acceptedAnswer:{ '@type':'Answer', text:a } })) };

  return <main style={{minHeight:'100vh',background:'#07101D',color:'#F8FAFC',fontFamily:'Arial,sans-serif'}}>
    <script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(projectSchema)}} />
    <script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(faqSchema)}} />

    <section style={{borderBottom:'1px solid #21314A'}}>
      <div style={{maxWidth:1180,margin:'0 auto',padding:'24px 20px 78px'}}>
        <nav style={{display:'flex',justifyContent:'space-between',gap:12,alignItems:'center',flexWrap:'wrap'}}>
          <Link href="/" style={{color:'#F8FAFC',textDecoration:'none',fontWeight:950}}>ARIDON</Link>
          <div style={{display:'flex',gap:10,alignItems:'center',flexWrap:'wrap'}}>
            <Link href="/investor-signal" style={{color:'#DCE4EF',textDecoration:'none',fontWeight:850,fontSize:13}}>Investor Signal OS</Link>
            <Link href="/ai-visibility" style={{color:'#DCE4EF',textDecoration:'none',fontWeight:850,fontSize:13}}>AI Visibility</Link>
            <a href="mailto:evaaridon@gmail.com?subject=Aridon%20Crossroads%20Partnership" style={{background:mint,color:'#07130F',textDecoration:'none',fontWeight:950,padding:'12px 15px',borderRadius:11}}>Request the Partner Brief</a>
          </div>
        </nav>

        <div style={{paddingTop:70,maxWidth:1050}}>
          <div style={{color:mint,fontWeight:950,fontSize:12,letterSpacing:1.1}}>FARMINGTON, NEW MEXICO · FOUR CORNERS</div>
          <h1 style={{fontSize:'clamp(56px,8vw,94px)',lineHeight:.92,letterSpacing:-4,margin:'14px 0 22px'}}>Aridon Crossroads</h1>
          <p style={{fontSize:'clamp(22px,3vw,31px)',lineHeight:1.3,maxWidth:980,margin:'0 0 18px',fontWeight:850}}>A proposed Southwest campus where innovation, manufacturing, agriculture, sports, hospitality and entertainment meet.</p>
          <p style={{color:'#B8C4D5',fontSize:18,lineHeight:1.7,maxWidth:920}}>Crossroads is being designed as more than a collection of buildings. The goal is a connected economic ecosystem: companies can test technology, manufacture products, train workers, host customers and events, recruit talent, serve the Four Corners and create reasons for visitors to stay longer in Farmington.</p>
          <div style={{display:'flex',gap:10,flexWrap:'wrap',marginTop:28}}>
            <a href="mailto:evaaridon@gmail.com?subject=Aridon%20Crossroads%20Investment%20Discussion" style={{background:mint,color:'#07130F',textDecoration:'none',fontWeight:950,padding:'14px 18px',borderRadius:12}}>Discuss Investment</a>
            <a href="mailto:evaaridon@gmail.com?subject=Aridon%20Crossroads%20Sponsorship" style={{background:'transparent',color:'#fff',textDecoration:'none',fontWeight:950,padding:'13px 17px',borderRadius:12,border:'1px solid #51617A'}}>Explore Sponsorship</a>
            <a href="#plan" style={{background:'transparent',color:'#fff',textDecoration:'none',fontWeight:950,padding:'13px 17px',borderRadius:12,border:'1px solid #51617A'}}>See the Campus Strategy</a>
          </div>
        </div>
      </div>
    </section>

    <section style={{background:'#F4F1E9',color:'#171717',padding:'66px 20px'}}>
      <div style={{maxWidth:1120,margin:'0 auto'}}>
        <div style={{fontSize:12,fontWeight:950,letterSpacing:1}}>THE INVESTMENT THESIS</div>
        <h2 style={{fontSize:'clamp(40px,6vw,64px)',lineHeight:.98,margin:'10px 0 24px',maxWidth:950}}>One site. Multiple economic engines.</h2>
        <p style={{fontSize:19,lineHeight:1.7,color:'#59564F',maxWidth:940}}>Crossroads is structured so the entire vision does not have to depend on one source of capital. Real estate, operating businesses, technology R&D, manufacturing, hospitality, sports, sponsorship and infrastructure can be financed through distinct vehicles and partnerships while reinforcing the same destination.</p>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(240px,1fr))',gap:12,marginTop:28}}>
          {[
            ['Diversified demand','Business, tourism, sports, workforce, manufacturing and community uses reduce dependence on a single activity.'],
            ['Phased capital','Districts and buildings can move independently as partners, financing and market validation are secured.'],
            ['Regional position','Farmington sits in the Four Corners, connecting New Mexico, Colorado, Arizona and Utah.'],
            ['Technology flywheel','Aridon technology, labs, demonstration sites and manufacturing create a built-in innovation narrative for the campus.'],
          ].map(([t,x])=><article key={t} style={{background:'#fff',border:'1px solid #D6D0C5',borderRadius:16,padding:20}}><h3 style={{fontSize:22,margin:'0 0 8px'}}>{t}</h3><p style={{color:'#625F58',lineHeight:1.6,margin:0}}>{x}</p></article>)}
        </div>
      </div>
    </section>

    <section id="plan" style={{padding:'72px 20px'}}>
      <div style={{maxWidth:1120,margin:'0 auto'}}>
        <div style={{color:mint,fontSize:12,fontWeight:950,letterSpacing:1}}>CAMPUS PROGRAM</div>
        <h2 style={{fontSize:'clamp(40px,6vw,64px)',lineHeight:1,margin:'10px 0 28px'}}>Six districts. One Crossroads.</h2>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(290px,1fr))',gap:12}}>
          {anchors.map(([t,x],i)=><article key={t} style={card}><div style={{color:i%2?gold:mint,fontSize:11,fontWeight:950}}>0{i+1}</div><h3 style={{fontSize:24,margin:'8px 0'}}>{t}</h3><p style={{color:'#AEBBD0',lineHeight:1.62,margin:0}}>{x}</p></article>)}
        </div>
      </div>
    </section>

    <section style={{background:'#101A2A',padding:'72px 20px'}}>
      <div style={{maxWidth:1120,margin:'0 auto'}}>
        <div style={{color:blue,fontSize:12,fontWeight:950,letterSpacing:1}}>SUGGESTED PHASING</div>
        <h2 style={{fontSize:'clamp(40px,6vw,64px)',lineHeight:1,margin:'10px 0 28px'}}>Build momentum before building everything.</h2>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))',gap:12}}>
          {phases.map(([phase,t,x],i)=><article key={phase} style={{...card,background:'#0A1321'}}><div style={{fontSize:11,fontWeight:950,color:i===0?'#FFB0A7':i===1?blue:mint}}>{phase.toUpperCase()}</div><h3 style={{fontSize:25,margin:'7px 0'}}>{t}</h3><p style={{color:'#AEBBD0',lineHeight:1.6,margin:0}}>{x}</p></article>)}
        </div>
      </div>
    </section>

    <section style={{background:'#F4F1E9',color:'#171717',padding:'72px 20px'}}>
      <div style={{maxWidth:1120,margin:'0 auto'}}>
        <div style={{fontSize:12,fontWeight:950,letterSpacing:1}}>WHO WE WANT TO MEET</div>
        <h2 style={{fontSize:'clamp(40px,6vw,64px)',lineHeight:1,margin:'10px 0 28px'}}>There is more than one way into the project.</h2>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))',gap:12}}>
          {partnerTypes.map(([t,x])=><article key={t} style={{background:'#fff',border:'1px solid #D6D0C5',borderRadius:16,padding:20}}><h3 style={{fontSize:23,margin:'0 0 8px'}}>{t}</h3><p style={{color:'#625F58',lineHeight:1.6,margin:0}}>{x}</p></article>)}
        </div>
      </div>
    </section>

    <section style={{padding:'72px 20px'}}>
      <div style={{maxWidth:1020,margin:'0 auto'}}>
        <div style={{color:mint,fontSize:12,fontWeight:950,letterSpacing:1}}>FREQUENTLY ASKED QUESTIONS</div>
        <h2 style={{fontSize:'clamp(40px,6vw,60px)',lineHeight:1,margin:'10px 0 28px'}}>Start here.</h2>
        <div style={{display:'grid',gap:10}}>{faqs.map(([q,a])=><article key={q} style={card}><h3 style={{fontSize:21,margin:'0 0 8px'}}>{q}</h3><p style={{color:'#AEBBD0',lineHeight:1.65,margin:0}}>{a}</p></article>)}</div>
      </div>
    </section>

    <section style={{background:'#9EF0CF',color:'#07130F',padding:'70px 20px'}}>
      <div style={{maxWidth:940,margin:'0 auto'}}>
        <div style={{fontSize:12,fontWeight:950,letterSpacing:1}}>CAPITAL · SPONSORSHIP · DEVELOPMENT · TENANCY · R&D</div>
        <h2 style={{fontSize:'clamp(43px,6vw,68px)',lineHeight:.98,margin:'10px 0 18px'}}>Help build the next Four Corners destination.</h2>
        <p style={{fontSize:19,lineHeight:1.65,maxWidth:820}}>If your organization invests in infrastructure, hospitality, real estate, manufacturing, water, energy, agriculture, sports, technology or regional growth, we want to compare notes.</p>
        <a href="mailto:evaaridon@gmail.com?subject=Aridon%20Crossroads%20Partner%20Brief" style={{display:'inline-block',marginTop:12,background:'#07130F',color:'#fff',textDecoration:'none',fontWeight:950,padding:'14px 18px',borderRadius:12}}>Contact Aridon about Crossroads</a>
        <p style={{fontSize:11,lineHeight:1.5,marginTop:28,opacity:.75}}>Conceptual planning material only. Nothing on this page is an offer to sell securities or a promise of project approval, financing, construction, tenancy, performance or returns. Scope, site control, engineering, entitlements, economics and financing remain subject to diligence and agreement.</p>
      </div>
    </section>
  </main>
}
