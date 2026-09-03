import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "She's Rooted Home · Aridon Farm Growth Review",
  robots: { index: false, follow: false, googleBot: { index: false, follow: false } },
};

const card = { background:'#FFFFFF', border:'1px solid #DED7CB', borderRadius:20, padding:20 } as const;
const dark = { background:'#172019', color:'#FFF', borderRadius:24, padding:'clamp(26px,5vw,52px)' } as const;

export default function ShesRootedHomeReview() {
  const opportunities = [
    {
      title:'Split the storefront by buyer intent',
      text:'Give visitors three obvious paths on the first screen: Grow Saffron at Home, Start a Saffron Side Hustle, and Scale a Small Farm. Each path should land on a focused offer instead of asking every buyer to sort through the same catalog.',
    },
    {
      title:'Make the high-ticket grower offer feel complete',
      text:'The 1,250-corm offer can become a Micro-Farm Launch Kit: corms, growing plan, harvest workflow, packaging checklist, farmers-market kit, pricing worksheet, buyer outreach scripts, and a live onboarding session. Keep earnings examples clearly labeled as illustrations, never guarantees.',
    },
    {
      title:'Turn the Growers Club into the retention engine',
      text:'Use the club as the bridge between seasons: monthly grow guidance, harvest reminders, recipe drops, corm-division reminders, early access, member-only bundles, and a renewal path tied to the customer’s next planting season.',
    },
    {
      title:'Build an off-season revenue calendar',
      text:'Corm demand is seasonal. Fill the rest of the year with digital guides, cookbooks, saffron-use kits, giftable education, virtual workshops, and member content so revenue is not waiting on one planting window.',
    },
    {
      title:'Test a chef and specialty-food buyer lane',
      text:'Create a small B2B test for restaurants, bakeries, specialty grocers, farm stores, and culinary schools. Start with a buyer page, sample request, quality/harvest story, wholesale inquiry form, and follow-up sequence before investing heavily in inventory.',
    },
    {
      title:'Use customer proof more aggressively',
      text:'Move verified ratings, harvest photos, first-year success stories, repeat-buyer stories, and press/partner mentions closer to the buy buttons. The current proof is strong but too much of it lives below the decision point.',
    },
  ];

  const automations = [
    'Planting-zone quiz → recommended corm bundle → email sequence',
    'Abandoned cart → education-first follow-up → seasonal deadline reminder',
    'Purchase → planting reminders → harvest reminders → review/referral request',
    'First harvest → invitation to Growers Club or next-size corm bundle',
    'Large grower inquiry → qualification → scheduled call → proposal checklist',
    'Past customer → next-season reorder forecast based on prior bundle size',
  ];

  return (
    <main style={{ minHeight:'100vh', background:'#F5F0E7', color:'#1B211D', fontFamily:'Inter, ui-sans-serif, system-ui, sans-serif' }}>
      <div style={{ maxWidth:1120, margin:'0 auto', padding:'24px 20px 72px' }}>
        <header style={{ display:'flex', justifyContent:'space-between', gap:14, alignItems:'center', flexWrap:'wrap', marginBottom:22 }}>
          <a href="/" style={{ color:'#1B211D', textDecoration:'none', fontWeight:950, letterSpacing:'.06em' }}>ARIDON · FARM GROWTH REVIEW</a>
          <span style={{ fontSize:12, fontWeight:850, background:'#FFF4D6', border:'1px solid #E1C875', borderRadius:999, padding:'7px 11px' }}>PRIVATE · PUBLIC-SOURCE REVIEW · NO-INDEX</span>
        </header>

        <section style={dark}>
          <div style={{ color:'#A9E8C8', fontSize:12, fontWeight:950, letterSpacing:'.1em' }}>SHE’S ROOTED HOME · OKLAHOMA SAFFRON</div>
          <h1 style={{ fontSize:'clamp(42px,6.5vw,74px)', lineHeight:.98, margin:'16px 0 18px', maxWidth:900 }}>A strong farm brand with room to build a much bigger sales machine.</h1>
          <p style={{ color:'#D7DED9', fontSize:18, lineHeight:1.65, maxWidth:850 }}>Aridon reviewed the public storefront, saffron growing offers, Growers Club, product ladder, FAQs, and customer proof. The brand already has the hard part: a distinctive story, a rare crop, useful education, repeatable products, and strong social proof. The next step is organizing those assets into clearer buyer paths and year-round revenue loops.</p>
          <div style={{ display:'flex', gap:10, flexWrap:'wrap', marginTop:22 }}>
            <a href="https://shesrootedhome.com/" target="_blank" rel="noreferrer" style={{ background:'#A9E8C8', color:'#102018', textDecoration:'none', borderRadius:11, padding:'12px 15px', fontWeight:950 }}>Open public website</a>
            <a href="/analyze-business" style={{ border:'1px solid #607169', color:'#FFF', textDecoration:'none', borderRadius:11, padding:'11px 15px', fontWeight:900 }}>Run Aridon site analyzer</a>
          </div>
        </section>

        <section style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(210px,1fr))', gap:12, marginTop:16 }}>
          {[
            ['POSITIONING','Strong','Clear saffron + back-to-basics story'],
            ['CONVERSION','Good','Clear shop paths, seasonal urgency and guarantees'],
            ['CUSTOMER PROOF','Strong','High verified review volume and repeat-buyer stories'],
            ['PRODUCT LADDER','Strong base','Low-ticket through four-figure grower kits'],
            ['YEAR-ROUND REVENUE','Biggest gap','Corm season still carries too much weight'],
          ].map(([label,value,note]) => <article key={label} style={card}><div style={{ fontSize:11,fontWeight:950,color:'#39735B',letterSpacing:'.08em' }}>{label}</div><div style={{ fontSize:28,fontWeight:950,marginTop:6 }}>{value}</div><div style={{ color:'#6D716E',lineHeight:1.5,fontSize:13,marginTop:5 }}>{note}</div></article>)}
        </section>

        <section style={{ ...card, marginTop:16 }}>
          <div style={{ fontSize:12,fontWeight:950,color:'#39735B',letterSpacing:'.08em' }}>WHAT ARIDON WOULD TEST FIRST</div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(300px,1fr))', gap:12, marginTop:16 }}>
            {opportunities.map((item,index)=><article key={item.title} style={{ background:'#F9F7F2',border:'1px solid #E6E0D6',borderRadius:16,padding:17 }}><div style={{ fontSize:12,fontWeight:950,color:'#8B6D2E' }}>{String(index+1).padStart(2,'0')}</div><h2 style={{ fontSize:20,margin:'7px 0 8px' }}>{item.title}</h2><p style={{ color:'#626762',lineHeight:1.62,margin:0 }}>{item.text}</p></article>)}
          </div>
        </section>

        <section style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(300px,1fr))', gap:14, marginTop:16 }}>
          <article style={card}>
            <div style={{ fontSize:12,fontWeight:950,color:'#39735B',letterSpacing:'.08em' }}>ARIDON SALES AUTOMATIONS</div>
            <div style={{ display:'grid',gap:9,marginTop:13 }}>{automations.map(item=><div key={item} style={{ borderTop:'1px solid #E6E0D6',paddingTop:10,lineHeight:1.5 }}>✓ {item}</div>)}</div>
          </article>
          <article style={card}>
            <div style={{ fontSize:12,fontWeight:950,color:'#39735B',letterSpacing:'.08em' }}>30-DAY SALES EXPERIMENT</div>
            <ol style={{ color:'#555B57',lineHeight:1.7,paddingLeft:21 }}>
              <li>Launch the three-path homepage split.</li>
              <li>Create one dedicated Micro-Farm Launch Kit landing page.</li>
              <li>Move the best customer proof above the first purchase decision.</li>
              <li>Build post-purchase planting and harvest automation.</li>
              <li>Test a chef/specialty-buyer inquiry page with 25 targeted prospects.</li>
              <li>Track conversion rate, average order value, club attach rate, repeat purchase rate, and qualified B2B inquiries.</li>
            </ol>
          </article>
        </section>

        <section style={{ ...dark, marginTop:16, background:'#202019' }}>
          <div style={{ color:'#F0D98D',fontSize:12,fontWeight:950,letterSpacing:'.08em' }}>ARIDON RECOMMENDATION</div>
          <h2 style={{ fontSize:'clamp(30px,4vw,46px)',margin:'10px 0 12px' }}>Do not rebuild the brand. Build the revenue system around the brand that is already working.</h2>
          <p style={{ color:'#DDD9CC',lineHeight:1.65,maxWidth:850 }}>She’s Rooted Home already has trust, teaching, scarcity, a premium crop, a community offer and a usable price ladder. Aridon’s job would be to connect those pieces so each visitor is routed to the right offer, every buyer receives the right next step, and the business keeps selling after the corm shipping season ends.</p>
        </section>

        <footer style={{ color:'#777168',fontSize:12,lineHeight:1.6,marginTop:18 }}>Unofficial Aridon review generated from publicly available information only. No private systems, customer records, order data, analytics, email, CRM or financial accounts were accessed. Recommendations are experiments to validate, not revenue guarantees.</footer>
      </div>
    </main>
  );
}
