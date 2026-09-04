'use client'

import { useState } from 'react'

const capabilities = [
  ['AI Garden Concierge','Guides shoppers from ZIP code, sunlight, space, style and budget to a small set of products that fit.'],
  ['Photograph Your Garden','A customer uploads a yard, patio, fence or bed and sees a concept plan before buying.'],
  ['Project Bundles','Turns single-plant shopping into border, patio, pollinator, entryway and complete-garden purchases.'],
  ['Inventory Recovery','When an item is unavailable, recommends compatible substitutes or captures waitlist demand instead of losing the visit.'],
  ['Weather & Zone Campaigns','Coordinates regional planting windows, inventory and campaigns by location.'],
  ['Care + Repeat Revenue','Keeps the relationship alive after delivery with planting, care and next-season expansion guidance.'],
]

const targets = [
  ['Conversion lift','10–20% pilot target'],
  ['Average order value','10–20% pilot target'],
  ['Email revenue/customer','15–25% pilot target'],
  ['Sold-out recovery','10%+ pilot target'],
  ['Repeat purchase','10–20% pilot target'],
]

export default function GardenCommercePage(){
  const [view,setView]=useState<'customer'|'executive'>('customer')
  const [planned,setPlanned]=useState(false)
  return <main className="shell">
    <div className="top">ARIDON GARDEN COMMERCE · LIVE PROSPECT DEMONSTRATION</div>
    <header className="hero">
      <div className="eyebrow">AI COMMERCE FOR NURSERIES, GARDEN BRANDS & PLANT RETAILERS</div>
      <h1>Sell the finished garden, not just the individual plant.</h1>
      <p>Aridon adds an intelligent sales layer to an existing ecommerce site. It helps customers decide what will work, visualize the result, buy the complete project, and return for care and expansion.</p>
      <div className="actions"><a href="/david-austin">View the live rose example</a><button onClick={()=>setView(view==='customer'?'executive':'customer')}>{view==='customer'?'See executive view':'See customer view'}</button></div>
    </header>

    {view==='customer'?<section className="content">
      <div className="flow"><div><b>1</b><span>Upload garden photo</span></div><div><b>2</b><span>Answer a few questions</span></div><div><b>3</b><span>Receive a matched plan</span></div><div><b>4</b><span>Buy the whole project</span></div></div>
      <div className="demo">
        <div className="card">
          <h2>Garden Concierge</h2>
          <label>ZIP code<input placeholder="87110" /></label>
          <label>Project<select><option>Front border</option><option>Patio containers</option><option>Pollinator garden</option><option>Fence / screening</option><option>Entryway</option></select></label>
          <label>Sun<select><option>6+ hours</option><option>4–6 hours</option><option>Morning sun</option><option>Afternoon sun</option></select></label>
          <label>Budget<select><option>$200–$400</option><option>$400–$750</option><option>$750–$1,500</option><option>$1,500+</option></select></label>
          <button className="primary" onClick={()=>setPlanned(true)}>Build My Garden Plan</button>
        </div>
        <div className="visual">
          <div className="scene">🌳 <span>🌿</span> <i>🌺</i> <em>🌸</em> <strong>🌼</strong></div>
          <h2>{planned?'Your complete project is ready':'See the finished garden before buying'}</h2>
          <p>{planned?'8 matched plants + soil amendment + care plan. One click can add the complete project to cart.':'The production version connects customer photos, plant catalog data, hardiness, sunlight, inventory and merchandising rules.'}</p>
          {planned&&<button className="primary">Add Complete Garden to Cart</button>}
        </div>
      </div>
      <div className="capGrid">{capabilities.map(([h,p])=><article key={h}><h3>{h}</h3><p>{p}</p></article>)}</div>
    </section>:<section className="content">
      <div className="metrics">{targets.map(([a,b])=><div key={a}><span>{a}</span><strong>{b}</strong></div>)}</div>
      <div className="execGrid">
        <article><h2>What the retailer gains</h2><p>More confident decisions, larger baskets, better recovery of unavailable items, regional campaign intelligence and a longer customer lifecycle.</p></article>
        <article><h2>What Aridon does not require</h2><p>A website replacement. The pilot is designed as a layer on top of the existing catalog, ecommerce, CRM and customer-care stack.</p></article>
        <article><h2>60-day pilot</h2><p>Start with one category or traffic segment, connect product rules and inventory, launch the concierge and project bundles, then measure against a control.</p></article>
        <article><h2>Where it expands</h2><p>Roses, shrubs, perennials, bulbs, seeds, houseplants, landscape kits, garden supplies and retailer networks can all use the same commerce engine.</p></article>
      </div>
      <div className="notice">Pilot figures are measurement targets, not guaranteed outcomes. Results should be validated through controlled testing.</div>
    </section>}

    <footer><b>ARIDON</b><span>AI Commerce & Business Operating Systems</span><p>Concept demonstration for business-development discussions. Brand-specific integrations require retailer approval and catalog access.</p></footer>
    <style jsx>{`
      :global(*){box-sizing:border-box}:global(body){margin:0;background:#f5f2e9;color:#173124;font-family:Inter,system-ui,-apple-system,"Segoe UI",sans-serif}.shell{min-height:100vh}.top{background:#10261a;color:#d8e5d9;text-align:center;padding:10px 18px;font-size:11px;font-weight:800;letter-spacing:.14em}.hero{padding:72px max(24px,calc((100vw - 1160px)/2));background:linear-gradient(140deg,#173728,#2c5a40 65%,#c2cdb6);color:#fff}.eyebrow{font-size:12px;font-weight:900;letter-spacing:.16em;color:#d6e4d5}.hero h1{font:500 clamp(42px,7vw,78px)/.98 Georgia,serif;max-width:950px;margin:18px 0}.hero p{font:20px/1.65 Georgia,serif;max-width:850px;color:#edf3ec}.actions{display:flex;gap:12px;flex-wrap:wrap;margin-top:28px}.actions a,.actions button,.primary{appearance:none;border:0;border-radius:999px;padding:14px 20px;font-weight:900;text-decoration:none;cursor:pointer}.actions a,.primary{background:#e9d8a5;color:#173124}.actions button{background:transparent;color:white;border:1px solid rgba(255,255,255,.5)}.content{max-width:1160px;margin:auto;padding:46px 24px 70px}.flow{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:28px}.flow div{background:#fff;border:1px solid #d8dfd5;padding:18px;border-radius:16px;display:flex;gap:10px;align-items:center}.flow b{width:28px;height:28px;border-radius:50%;display:grid;place-items:center;background:#1f4b35;color:#fff}.flow span{font-weight:800}.demo{display:grid;grid-template-columns:.82fr 1.18fr;gap:20px}.card,.visual,.execGrid article{background:#fff;border:1px solid #d8dfd5;border-radius:22px;padding:26px;box-shadow:0 10px 30px rgba(30,60,40,.06)}.card label{display:grid;gap:7px;font-size:13px;font-weight:800;margin:14px 0}.card input,.card select{width:100%;padding:13px;border:1px solid #cbd5ca;border-radius:12px;background:#fff;font:inherit}.visual{min-height:430px;display:flex;flex-direction:column;justify-content:center}.scene{height:220px;border-radius:18px;background:linear-gradient(#b9d7ea 0 45%,#6e945e 45%);display:flex;align-items:end;justify-content:space-around;font-size:64px;padding:20px;overflow:hidden}.scene span{font-size:70px}.scene i,.scene em,.scene strong{font-style:normal;font-weight:400;font-size:58px}.visual h2,.card h2,.execGrid h2{font:500 29px/1.1 Georgia,serif}.visual p,.execGrid p,.capGrid p{line-height:1.6;color:#52635a}.capGrid{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-top:26px}.capGrid article{background:#e9eee6;border-radius:18px;padding:20px}.capGrid h3{margin:0 0 8px}.metrics{display:grid;grid-template-columns:repeat(5,1fr);gap:12px}.metrics div{background:#173728;color:white;border-radius:18px;padding:22px}.metrics span{display:block;font-size:12px;color:#c9d8cf;margin-bottom:8px}.metrics strong{font-size:20px}.execGrid{display:grid;grid-template-columns:repeat(2,1fr);gap:18px;margin-top:24px}.notice{margin-top:22px;padding:17px;border-radius:14px;background:#fff4d7;border:1px solid #ebd79f;color:#665523}footer{background:#10261a;color:#d8e5d9;padding:34px max(24px,calc((100vw - 1160px)/2));display:flex;gap:12px;align-items:center;flex-wrap:wrap}footer b{font-size:22px}footer span{font-weight:700}footer p{width:100%;font-size:12px;color:#aabbb0;margin:0}@media(max-width:800px){.flow,.capGrid,.metrics{grid-template-columns:1fr 1fr}.demo,.execGrid{grid-template-columns:1fr}.hero{padding-top:48px}.scene{font-size:42px}.scene span,.scene i,.scene em,.scene strong{font-size:42px}}@media(max-width:520px){.flow,.capGrid,.metrics{grid-template-columns:1fr}.hero h1{font-size:44px}}
    `}</style>
  </main>
}
