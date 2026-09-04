'use client'

import { useMemo, useState } from 'react'

type Rose = {
  name: string
  tone: string
  role: string
  fragrance: string
  price: number
  note: string
}

const roses: Rose[] = [
  { name: 'Desdemona', tone: 'White & Cream', role: 'Border / Patio', fragrance: 'Strong', price: 40, note: 'Soft white blooms with a luminous, elegant garden presence.' },
  { name: 'Olivia Rose Austin', tone: 'Pink', role: 'Border / Front of House', fragrance: 'Medium', price: 40, note: 'A versatile English Rose for repeat flowering and balanced planting.' },
  { name: 'Bring Me Sunshine', tone: 'Apricot & Orange', role: 'Feature / Border', fragrance: 'Strong', price: 40, note: 'Warm apricot tones for a high-impact focal planting.' },
  { name: 'Lady of Shalott', tone: 'Apricot & Orange', role: 'Border / Hedge', fragrance: 'Medium', price: 40, note: 'A vigorous choice with rich orange tones and strong visual impact.' },
  { name: 'Vanessa Bell', tone: 'Yellow', role: 'Border / Cottage Garden', fragrance: 'Medium', price: 40, note: 'Soft yellow blooms that layer beautifully with cream and apricot.' },
  { name: 'Claire Austin', tone: 'White & Cream', role: 'Climber / Arch', fragrance: 'Strong', price: 45, note: 'A climbing option for arches, fences and vertical garden structure.' },
]

const pilotTargets = [
  ['Conversion rate', '+10–20%'],
  ['Average order value', '+10–20%'],
  ['Email revenue/customer', '+15–25%'],
  ['Out-of-stock recovery', '+10%+'],
  ['Repeat purchase rate', '+10–20%'],
  ['Customer service load', 'Reduce'],
]

export default function DavidAustinAridonDemo() {
  const [mode, setMode] = useState<'shopper' | 'executive'>('shopper')
  const [zip, setZip] = useState('')
  const [space, setSpace] = useState('Border')
  const [sun, setSun] = useState('6+ hours')
  const [colour, setColour] = useState('White & Cream')
  const [fragrance, setFragrance] = useState('Strong')
  const [budget, setBudget] = useState('300')
  const [photo, setPhoto] = useState<string | null>(null)
  const [planned, setPlanned] = useState(false)
  const [quantity, setQuantity] = useState(6)
  const [carted, setCarted] = useState(false)

  const recommendations = useMemo(() => {
    const exact = roses.filter((r) => r.tone === colour)
    const rest = roses.filter((r) => r.tone !== colour)
    return [...exact, ...rest].slice(0, 4)
  }, [colour])

  const roseSubtotal = quantity * recommendations[0].price
  const careKit = 24
  const total = roseSubtotal + careKit
  const freeShippingGap = Math.max(0, 175 - total)

  function onPhoto(file?: File) {
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setPhoto(String(reader.result))
    reader.readAsDataURL(file)
  }

  return (
    <main className="shell">
      <div className="conceptBar">CONCEPT DEMO · PREPARED BY ARIDON · NOT YET AFFILIATED WITH DAVID AUSTIN ROSES</div>
      <header className="hero">
        <div className="brandRow">
          <div>
            <div className="eyebrow">ARIDON × DAVID AUSTIN ROSES</div>
            <h1>Turn rose shopping into a complete garden purchase.</h1>
            <p className="lede">An AI commerce layer that helps a customer choose the right roses, visualize a finished garden, buy the whole plan, and receive care guidance for years.</p>
          </div>
          <div className="roseMark">🌹</div>
        </div>
        <div className="switcher">
          <button className={mode === 'shopper' ? 'active' : ''} onClick={() => setMode('shopper')}>Customer Experience</button>
          <button className={mode === 'executive' ? 'active' : ''} onClick={() => setMode('executive')}>Executive View</button>
        </div>
      </header>

      {mode === 'shopper' ? (
        <section className="content">
          <div className="sectionTitle">
            <span>01</span>
            <div><h2>AI Rose Concierge</h2><p>Replace choice overload with a guided garden plan.</p></div>
          </div>

          <div className="grid two">
            <div className="card formCard">
              <label>ZIP code<input value={zip} onChange={(e) => setZip(e.target.value)} placeholder="e.g. 87110" /></label>
              <label>Planting area<select value={space} onChange={(e) => setSpace(e.target.value)}><option>Border</option><option>Patio / Container</option><option>Arch / Doorway</option><option>Fence / Wall</option><option>Front of House</option></select></label>
              <label>Sun exposure<select value={sun} onChange={(e) => setSun(e.target.value)}><option>6+ hours</option><option>4–6 hours</option><option>Morning sun</option><option>Afternoon sun</option></select></label>
              <label>Preferred color<select value={colour} onChange={(e) => setColour(e.target.value)}><option>White & Cream</option><option>Pink</option><option>Apricot & Orange</option><option>Yellow</option></select></label>
              <label>Fragrance<select value={fragrance} onChange={(e) => setFragrance(e.target.value)}><option>Strong</option><option>Medium</option><option>Any</option></select></label>
              <label>Garden budget<input value={budget} onChange={(e) => setBudget(e.target.value)} inputMode="numeric" /></label>
              <button className="primary" onClick={() => setPlanned(true)}>Create My Garden Plan</button>
            </div>

            <div className="card uploadCard">
              <div className="miniTitle">Photograph Your Garden</div>
              <p>Upload a backyard, border, fence, patio, arch or front-of-house photo.</p>
              <label className="drop">
                {photo ? <img src={photo} alt="Uploaded garden preview" /> : <div><div className="camera">📷</div><strong>Upload garden photo</strong><span>Tap to choose an image</span></div>}
                <input type="file" accept="image/*" onChange={(e) => onPhoto(e.target.files?.[0])} />
              </label>
              <div className="tiny">Demo uses a visual placement preview. Production version would connect to Aridon image analysis and David Austin inventory data.</div>
            </div>
          </div>

          {planned && (
            <>
              <div className="sectionTitle padTop"><span>02</span><div><h2>Your Recommended Roses</h2><p>Personalized to {zip || 'your area'}, {space.toLowerCase()}, {sun.toLowerCase()}, and a {colour.toLowerCase()} palette.</p></div></div>
              <div className="roseGrid">
                {recommendations.map((rose, i) => (
                  <article className="roseCard" key={rose.name}>
                    <div className={`bloom b${i}`}>✿</div>
                    <div className="badge">{i === 0 ? 'BEST MATCH' : 'COMPLEMENTS PLAN'}</div>
                    <h3>{rose.name}</h3>
                    <div className="meta">{rose.tone} · {rose.role}</div>
                    <p>{rose.note}</p>
                    <div className="price">From ${rose.price}</div>
                  </article>
                ))}
              </div>

              <div className="sectionTitle padTop"><span>03</span><div><h2>See the Finished Garden</h2><p>Move the decision from “Which rose?” to “I want that garden.”</p></div></div>
              <div className="visualCard">
                <div className="gardenVisual" style={photo ? { backgroundImage: `linear-gradient(rgba(17,45,30,.12),rgba(17,45,30,.12)), url(${photo})` } : undefined}>
                  {!photo && <div className="gardenBlank"><span>🌿</span><strong>Upload a garden photo above to personalize this view.</strong></div>}
                  <div className="plant p1">🌹</div><div className="plant p2">🌹</div><div className="plant p3">🌹</div><div className="plant p4">🌹</div><div className="plant p5">🌹</div><div className="plant p6">🌹</div>
                  <div className="visualLabel">ARIDON GARDEN PREVIEW</div>
                </div>
                <div className="planPanel">
                  <div className="miniTitle">Complete Garden Bundle</div>
                  <h3>{recommendations[0].name} Garden</h3>
                  <p>{quantity} roses + care kit</p>
                  <div className="qty"><button onClick={() => setQuantity(Math.max(3, quantity - 3))}>−</button><strong>{quantity}</strong><button onClick={() => setQuantity(quantity + 3)}>+</button></div>
                  <div className="line"><span>Roses</span><b>${roseSubtotal.toFixed(2)}</b></div>
                  <div className="line"><span>Care kit</span><b>${careKit.toFixed(2)}</b></div>
                  <div className="line total"><span>Plan total</span><b>${total.toFixed(2)}</b></div>
                  {freeShippingGap > 0 ? <div className="shipping">Add ${freeShippingGap.toFixed(2)} more to reach the current $175 free-shipping threshold.</div> : <div className="shipping good">✓ This garden plan qualifies for free shipping under the current U.S. threshold.</div>}
                  <button className="primary" onClick={() => setCarted(true)}>{carted ? '✓ Garden Added' : 'Add Entire Garden to Cart'}</button>
                  <button className="secondary">Save My Garden Plan</button>
                </div>
              </div>

              <div className="journey">
                {['Garden photo', 'AI plan', 'Rose bundle', 'Checkout', 'Planting help', 'Seasonal care', 'Next-year expansion'].map((x, i) => <div key={x}><span>{i + 1}</span><b>{x}</b></div>)}
              </div>
            </>
          )}
        </section>
      ) : (
        <section className="content">
          <div className="sectionTitle"><span>01</span><div><h2>Executive Commerce Dashboard</h2><p>One view of demand, merchandising, customer intent and lifetime value.</p></div></div>
          <div className="metricGrid">
            <div className="metric"><span>AI-assisted conversion</span><strong>+14.8%</strong><small>Pilot target scenario</small></div>
            <div className="metric"><span>Average order value</span><strong>+17.2%</strong><small>Garden bundles vs. single-item carts</small></div>
            <div className="metric"><span>Recovered sold-out demand</span><strong>11.4%</strong><small>Substitutions + waitlist capture</small></div>
            <div className="metric"><span>Repeat-purchase lift</span><strong>+13.1%</strong><small>Care journey + garden expansion</small></div>
          </div>

          <div className="grid two padTop">
            <div className="card">
              <div className="miniTitle">Revenue Engine</div>
              <div className="funnel">
                <div><b>1.</b><span>Traffic + email click</span><em>Intent captured</em></div>
                <div><b>2.</b><span>AI Rose Concierge</span><em>Choice simplified</em></div>
                <div><b>3.</b><span>Garden visualization</span><em>Project desire created</em></div>
                <div><b>4.</b><span>Bundle + free-shipping logic</span><em>AOV expanded</em></div>
                <div><b>5.</b><span>Care + re-engagement</span><em>LTV expanded</em></div>
              </div>
            </div>
            <div className="card">
              <div className="miniTitle">Pilot Measurement Targets</div>
              <div className="targetTable">{pilotTargets.map(([k,v]) => <div key={k}><span>{k}</span><b>{v}</b></div>)}</div>
              <div className="tiny">Targets are proposed pilot goals, not guaranteed outcomes. Actual lift would be measured through controlled A/B testing.</div>
            </div>
          </div>

          <div className="sectionTitle padTop"><span>02</span><div><h2>What Aridon Adds</h2><p>A commerce intelligence layer rather than a website replacement.</p></div></div>
          <div className="featureGrid">
            <div><b>AI Garden Designer</b><p>Photo + dimensions + planting conditions → visual plan.</p></div>
            <div><b>Rose Concierge</b><p>Recommendations from catalog, site conditions, taste and budget.</p></div>
            <div><b>Smart Bundling</b><p>Sell borders, arches and complete garden projects instead of isolated plants.</p></div>
            <div><b>Inventory Recovery</b><p>Substitute compatible roses when a preferred variety is unavailable.</p></div>
            <div><b>Weather Campaigns</b><p>Trigger planting-window messaging by customer region.</p></div>
            <div><b>Rose Doctor</b><p>Photo-assisted care guidance with escalation to human rose experts.</p></div>
            <div><b>Demand Forecasting</b><p>Translate searches, waitlists and lost sales into production intelligence.</p></div>
            <div><b>Lifetime Garden CRM</b><p>Remember what customers planted and recommend next-season expansion.</p></div>
          </div>

          <div className="pilotBox">
            <div><div className="eyebrow">PROPOSED 60-DAY PILOT</div><h2>Start with one high-value path.</h2><p>Launch the Rose Concierge + garden bundle flow on a controlled segment, measure conversion and AOV, then add visualization, care automation and demand forecasting.</p></div>
            <div className="pilotSteps"><b>Phase 1</b><span>Catalog + rules</span><b>Phase 2</b><span>AI concierge</span><b>Phase 3</b><span>Garden bundles</span><b>Phase 4</b><span>A/B measurement</span></div>
          </div>
        </section>
      )}

      <footer>
        <div><b>ARIDON</b><span>AI Commerce & Business Operating Systems</span></div>
        <p>Private concept demonstration prepared for discussion with David Austin Roses. Product names are used only to illustrate a proposed integration concept.</p>
      </footer>

      <style jsx>{`
        :global(*){box-sizing:border-box} :global(body){margin:0;background:#f6f3ec;color:#173324;font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
        .shell{min-height:100vh}.conceptBar{background:#12291d;color:#d9e6d9;font-size:11px;letter-spacing:.14em;text-align:center;padding:10px 16px}.hero{padding:58px max(24px,calc((100vw - 1180px)/2));background:linear-gradient(145deg,#183927,#254e38 58%,#b7c4ab);color:white}.brandRow{display:flex;gap:30px;align-items:center;justify-content:space-between}.eyebrow{font-size:12px;letter-spacing:.18em;font-weight:800;color:#c9d9c8}.hero h1{font-family:Georgia,serif;font-weight:500;font-size:clamp(40px,7vw,76px);line-height:.96;max-width:900px;margin:18px 0}.lede{font-family:Georgia,serif;font-size:19px;line-height:1.65;max-width:800px;color:#e4ede4}.roseMark{font-size:88px;filter:drop-shadow(0 12px 22px rgba(0,0,0,.18))}.switcher{display:flex;gap:10px;margin-top:30px}.switcher button{border:1px solid rgba(255,255,255,.35);background:transparent;color:#fff;padding:12px 18px;border-radius:999px;font-weight:700;cursor:pointer}.switcher button.active{background:#fff;color:#173324}.content{max-width:1180px;margin:auto;padding:48px 24px 72px}.sectionTitle{display:flex;gap:16px;align-items:flex-start;margin-bottom:22px}.sectionTitle>span{font-size:12px;letter-spacing:.12em;font-weight:900;background:#dfe8d9;padding:7px 9px;border-radius:6px}.sectionTitle h2{font-family:Georgia,serif;font-size:32px;font-weight:500;margin:0}.sectionTitle p{margin:6px 0 0;color:#5c6a60}.padTop{margin-top:46px}.grid.two{display:grid;grid-template-columns:1fr 1fr;gap:20px}.card{background:#fff;border:1px solid #dedbd2;border-radius:18px;padding:24px;box-shadow:0 8px 35px rgba(35,58,42,.05)}.formCard{display:grid;grid-template-columns:1fr 1fr;gap:16px}.formCard label{font-size:12px;font-weight:800;color:#476052}.formCard input,.formCard select{width:100%;margin-top:6px;border:1px solid #d6d8d0;border-radius:10px;padding:12px;background:#fbfbf8;color:#173324}.formCard .primary{grid-column:1/-1}.primary,.secondary{border:0;border-radius:999px;padding:14px 18px;font-weight:900;cursor:pointer}.primary{background:#173d29;color:white}.secondary{background:#ecf1e9;color:#173d29;width:100%;margin-top:8px}.uploadCard p{color:#5b695f}.miniTitle{font-size:12px;font-weight:900;letter-spacing:.13em;text-transform:uppercase;color:#496455}.drop{display:block;height:275px;border:1px dashed #9bad9e;border-radius:15px;overflow:hidden;background:#edf2ea;cursor:pointer}.drop input{display:none}.drop>div{height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;color:#496455}.drop img{width:100%;height:100%;object-fit:cover}.camera{font-size:42px}.drop span{font-size:12px}.tiny{font-size:11px;line-height:1.5;color:#7b847e;margin-top:12px}.roseGrid{display:grid;grid-template-columns:repeat(4,1fr);gap:15px}.roseCard{background:white;border:1px solid #dedbd2;border-radius:17px;padding:18px;min-height:300px;position:relative;overflow:hidden}.bloom{height:100px;border-radius:14px;display:flex;align-items:center;justify-content:center;font-size:65px;margin-bottom:15px}.b0{background:#ede9dd;color:#f7f5ee}.b1{background:#f0d2d8;color:#e7aeba}.b2{background:#f0c69f;color:#db9661}.b3{background:#ecd6a6;color:#f0b76a}.badge{font-size:9px;letter-spacing:.11em;font-weight:900;color:#6a7b70}.roseCard h3{font-family:Georgia,serif;font-size:23px;margin:8px 0 4px}.meta{font-size:11px;font-weight:800;color:#708077}.roseCard p{font-family:Georgia,serif;color:#5f6b63;line-height:1.45}.price{font-weight:900}.visualCard{background:white;border:1px solid #dedbd2;border-radius:20px;overflow:hidden;display:grid;grid-template-columns:1.65fr .75fr}.gardenVisual{min-height:440px;position:relative;background:linear-gradient(#c3d6ba,#87a979 60%,#668a62);background-size:cover;background-position:center}.gardenBlank{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;color:white;text-shadow:0 2px 8px rgba(0,0,0,.35)}.gardenBlank span{font-size:60px}.plant{position:absolute;font-size:48px;filter:drop-shadow(0 4px 5px rgba(0,0,0,.25))}.p1{left:12%;bottom:18%}.p2{left:28%;bottom:12%}.p3{left:44%;bottom:20%}.p4{left:59%;bottom:13%}.p5{left:73%;bottom:22%}.p6{left:85%;bottom:15%}.visualLabel{position:absolute;left:18px;top:18px;background:rgba(17,45,30,.8);color:white;border-radius:999px;padding:8px 11px;font-size:10px;letter-spacing:.1em;font-weight:900}.planPanel{padding:28px}.planPanel h3{font-family:Georgia,serif;font-size:30px;margin:10px 0 4px}.qty{display:flex;gap:14px;align-items:center;margin:18px 0}.qty button{width:34px;height:34px;border:1px solid #ccd2c9;border-radius:50%;background:white;font-size:20px;cursor:pointer}.line{display:flex;justify-content:space-between;padding:9px 0;border-bottom:1px solid #eceee9;font-size:13px}.line.total{font-size:16px}.shipping{margin:16px 0;padding:12px;border-radius:10px;background:#f4ece0;color:#775628;font-size:12px;line-height:1.4}.shipping.good{background:#e5f1e6;color:#2b6a3d}.journey{display:grid;grid-template-columns:repeat(7,1fr);gap:8px;margin-top:28px}.journey div{background:#e8eee4;border-radius:12px;padding:14px;min-height:92px}.journey span{display:block;font-size:10px;font-weight:900}.journey b{display:block;margin-top:20px;font-family:Georgia,serif}.metricGrid{display:grid;grid-template-columns:repeat(4,1fr);gap:14px}.metric{background:#173d29;color:white;border-radius:17px;padding:22px}.metric span,.metric small{display:block;color:#c9d7cd}.metric strong{display:block;font-family:Georgia,serif;font-size:38px;font-weight:500;margin:12px 0}.funnel{display:grid;gap:10px;margin-top:16px}.funnel div{display:grid;grid-template-columns:30px 1fr auto;gap:10px;align-items:center;padding:13px;background:#f4f6f1;border-radius:10px}.funnel b{font-size:11px}.funnel span{font-weight:800}.funnel em{font-size:11px;color:#6d786f;font-style:normal}.targetTable{margin-top:12px}.targetTable div{display:flex;justify-content:space-between;padding:12px 0;border-bottom:1px solid #e8e9e4}.targetTable b{color:#2f6c45}.featureGrid{display:grid;grid-template-columns:repeat(4,1fr);gap:14px}.featureGrid>div{background:white;border:1px solid #dedbd2;border-radius:15px;padding:18px}.featureGrid b{font-family:Georgia,serif;font-size:19px}.featureGrid p{color:#637067;line-height:1.5;font-size:13px}.pilotBox{margin-top:40px;background:#163927;color:white;border-radius:22px;padding:34px;display:grid;grid-template-columns:1.4fr 1fr;gap:35px}.pilotBox h2{font-family:Georgia,serif;font-size:35px;margin:12px 0}.pilotBox p{color:#d8e1da;line-height:1.6}.pilotSteps{display:grid;grid-template-columns:auto 1fr;gap:11px;align-content:center}.pilotSteps b{font-size:11px;color:#bcd0c0}.pilotSteps span{background:rgba(255,255,255,.08);border-radius:8px;padding:10px}footer{background:#10271b;color:#d9e5dc;padding:30px max(24px,calc((100vw - 1180px)/2));display:flex;justify-content:space-between;gap:30px;align-items:center}footer b,footer span{display:block}footer span,footer p{font-size:11px;color:#aebfb3;max-width:660px;line-height:1.5}
        @media(max-width:900px){.roseMark{display:none}.grid.two,.visualCard,.pilotBox{grid-template-columns:1fr}.roseGrid,.metricGrid,.featureGrid{grid-template-columns:1fr 1fr}.journey{grid-template-columns:repeat(2,1fr)}.formCard{grid-template-columns:1fr}.formCard .primary{grid-column:auto}.hero{padding-top:38px}.hero h1{font-size:48px}}
        @media(max-width:560px){.roseGrid,.metricGrid,.featureGrid{grid-template-columns:1fr}.hero h1{font-size:40px}.switcher{flex-direction:column}.switcher button{width:100%}.visualCard{display:block}.gardenVisual{min-height:340px}.plant{font-size:34px}footer{display:block}.metric strong{font-size:32px}}
      `}</style>
    </main>
  )
}
