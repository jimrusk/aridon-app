'use client';

import { useMemo, useState } from 'react';

const pillars = [
  ['Market Radar', 'Track inventory, days on market, price cuts, sale-to-list spread and changing buyer leverage.'],
  ['Neighborhood Intelligence', 'Layer zoning, development, schools, insurance, flood exposure, taxes and local demand signals.'],
  ['Hidden Opportunity Finder', 'Surface stale listings, weak marketing, repeated reductions, distressed properties and overlooked value-add deals.'],
  ['Deal Score', 'Turn a property into acquisition range, rehab questions, rent/resale paths, financing needs and risk flags.'],
  ['Seller Intelligence', 'Spot pricing, presentation and market-positioning problems before they become expensive.'],
  ['Development Watch', 'Monitor permits, new construction, zoning shifts and infrastructure that can change neighborhood value.'],
];

const sourcePlan = [
  ['Public records', 'Assessor, recorder, taxes, permits, code enforcement, court and municipal sources.'],
  ['Listing data', 'MLS or licensed listing feeds when available, plus public listing signals where permitted.'],
  ['Market context', 'Rates, insurance, flood, schools, infrastructure, development and neighborhood demand.'],
  ['Local expert layer', 'Broker and operator notes that capture what the raw numbers miss.'],
];

export default function MarketIntelligencePage() {
  const [market, setMarket] = useState('Miami, FL');
  const [inventoryMonths, setInventoryMonths] = useState(5.2);
  const [daysOnMarket, setDaysOnMarket] = useState(67);
  const [priceCuts, setPriceCuts] = useState(28);
  const [saleToList, setSaleToList] = useState(96.5);
  const [locationStrength, setLocationStrength] = useState(82);
  const [riskLoad, setRiskLoad] = useState(38);
  const [expertConfidence, setExpertConfidence] = useState(70);

  const scores = useMemo(() => {
    const leverage = Math.max(0, Math.min(100, Math.round(
      36 + inventoryMonths * 6 + Math.max(0, daysOnMarket - 30) * .35 + priceCuts * .7 + Math.max(0, 100 - saleToList) * 3
    )));
    const demand = Math.max(0, Math.min(100, Math.round(
      locationStrength * .58 + (100 - riskLoad) * .18 + (100 - Math.min(100, inventoryMonths * 10)) * .14 + expertConfidence * .10
    )));
    const opportunity = Math.max(0, Math.min(100, Math.round(
      leverage * .38 + demand * .32 + locationStrength * .18 + expertConfidence * .12
    )));
    const posture = opportunity >= 82 ? 'HUNT AGGRESSIVELY' : opportunity >= 68 ? 'SELECTIVE BUYER MARKET' : opportunity >= 55 ? 'NEGOTIATE CAREFULLY' : 'WAIT FOR BETTER ENTRY';
    return { leverage, demand, opportunity, posture };
  }, [inventoryMonths, daysOnMarket, priceCuts, saleToList, locationStrength, riskLoad, expertConfidence]);

  return (
    <main style={{ minHeight: '100vh', background: '#F3F0E8', color: '#161616', fontFamily: 'Arial, sans-serif' }}>
      <header style={{ background: '#07101D', color: '#fff', padding: '36px 20px 62px' }}>
        <div style={{ maxWidth: 1180, margin: '0 auto' }}>
          <div style={{ color: '#9EF0CF', fontWeight: 950, fontSize: 12, letterSpacing: 1.1 }}>ARIDON · REAL ESTATE MARKET INTELLIGENCE</div>
          <h1 style={{ fontSize: 'clamp(44px,7vw,78px)', lineHeight: .95, letterSpacing: -3, margin: '14px 0 18px', maxWidth: 1000 }}>Know the market before you chase the property.</h1>
          <p style={{ color: '#C3CEDC', fontSize: 19, lineHeight: 1.65, maxWidth: 930 }}>
            Aridon combines market movement, neighborhood fundamentals, distressed-property signals, development activity and local expert judgment into one decision layer for buyers, sellers and investors.
          </p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 20 }}>
            {['Market Radar', 'Neighborhoods', 'Hidden Deals', 'Deal Score', 'Seller Signals', 'Development Watch', 'Local Expert Layer'].map((item) => <span key={item} style={chip}>{item}</span>)}
          </div>
        </div>
      </header>

      <section style={{ maxWidth: 1180, margin: '-28px auto 0', padding: '0 20px 16px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,340px),1fr))', gap: 14 }}>
          <article style={card}>
            <div style={eyebrow}>MARKET PROFILE</div>
            <h2 style={{ fontSize: 30, margin: '8px 0 15px' }}>Read buyer leverage in 60 seconds.</h2>
            <label style={label}>Market</label>
            <input value={market} onChange={(e) => setMarket(e.target.value)} style={input} />
            <Slider label="Months of inventory" value={inventoryMonths} min={1} max={14} step={0.1} onChange={setInventoryMonths} suffix=" mo" />
            <Slider label="Median days on market" value={daysOnMarket} min={10} max={180} step={1} onChange={setDaysOnMarket} suffix=" days" />
            <Slider label="Listings with price cuts" value={priceCuts} min={0} max={70} step={1} onChange={setPriceCuts} suffix="%" />
            <Slider label="Sale-to-list ratio" value={saleToList} min={88} max={103} step={0.1} onChange={setSaleToList} suffix="%" />
          </article>

          <article style={{ ...card, background: '#101827', color: '#fff', borderColor: '#27344A' }}>
            <div style={{ ...eyebrow, color: '#9EF0CF' }}>ARIDON MARKET SCORE</div>
            <div style={{ fontSize: 82, lineHeight: 1, fontWeight: 950, marginTop: 12 }}>{scores.opportunity}</div>
            <div style={{ color: '#9EF0CF', fontWeight: 950, marginTop: 9 }}>{scores.posture}</div>
            <div style={{ color: '#B8C5D5', marginTop: 8, fontSize: 14 }}>{market}</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 10, marginTop: 22 }}>
              <DarkScore label="Buyer leverage" value={scores.leverage} />
              <DarkScore label="Demand quality" value={scores.demand} />
              <DarkScore label="Location strength" value={locationStrength} />
              <DarkScore label="Expert confidence" value={expertConfidence} />
            </div>
            <p style={{ color: '#AEB9C9', fontSize: 12, lineHeight: 1.55, marginTop: 17 }}>
              This is a decision model using the inputs shown here. Live market feeds and licensed MLS data must be connected before treating any score as current market fact.
            </p>
          </article>
        </div>
      </section>

      <section style={{ maxWidth: 1180, margin: '0 auto', padding: '34px 20px 6px' }}>
        <div style={eyebrow}>WHAT ARIDON WATCHES</div>
        <h2 style={{ fontSize: 'clamp(34px,5vw,52px)', margin: '8px 0 20px', letterSpacing: -1.4 }}>Six clear doors instead of fifty features.</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(250px,1fr))', gap: 12 }}>
          {pillars.map(([title, text], i) => (
            <article key={title} style={card}><div style={{ width: 34, height: 34, borderRadius: 99, display: 'grid', placeItems: 'center', background: '#E5F4ED', color: '#1D6A50', fontWeight: 950 }}>{i + 1}</div><h3 style={{ fontSize: 22, margin: '12px 0 7px' }}>{title}</h3><p style={{ color: '#5F5A52', lineHeight: 1.6, margin: 0, fontSize: 14 }}>{text}</p></article>
          ))}
        </div>
      </section>

      <section style={{ maxWidth: 1180, margin: '0 auto', padding: '42px 20px 6px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,340px),1fr))', gap: 14 }}>
          <article style={card}>
            <div style={eyebrow}>LOCATION OVER EVERYTHING</div>
            <h2 style={{ fontSize: 30, margin: '8px 0 12px' }}>Give location a real weight in the deal.</h2>
            <Slider label="Location / access / scarcity strength" value={locationStrength} min={0} max={100} step={1} onChange={setLocationStrength} suffix="" />
            <Slider label="Insurance / flood / tax / regulatory risk" value={riskLoad} min={0} max={100} step={1} onChange={setRiskLoad} suffix="" />
            <Slider label="Confidence in local expert input" value={expertConfidence} min={0} max={100} step={1} onChange={setExpertConfidence} suffix="" />
            <div style={{ marginTop: 16, padding: 14, borderRadius: 12, background: '#F8F5ED', border: '1px solid #DED7CA', color: '#5B574F', lineHeight: 1.55, fontSize: 13 }}>
              Local agents and operators can add notes about showing behavior, buyer objections, micro-neighborhood differences, off-market activity and why a property is being ignored. Aridon keeps those observations separate from verified public facts.
            </div>
          </article>

          <article style={card}>
            <div style={eyebrow}>HIDDEN OPPORTUNITY FINDER</div>
            <h2 style={{ fontSize: 30, margin: '8px 0 14px' }}>Look where presentation and pressure create an opening.</h2>
            <div style={{ display: 'grid', gap: 9 }}>
              {['Long days on market', 'Repeated price reductions', 'Poor photos / weak listing presentation', 'Vacant or absentee-owned', 'Tax, code, probate or foreclosure signals', 'High-equity owners', 'Failed or expired listings', 'Value-add renovation mismatch'].map((item) => <div key={item} style={{ display: 'flex', gap: 9, alignItems: 'flex-start', padding: '10px 11px', borderRadius: 10, background: '#F8F8F5', border: '1px solid #E2DED4', fontSize: 14, fontWeight: 800 }}><span style={{ color: '#1D6A50' }}>✓</span><span>{item}</span></div>)}
            </div>
          </article>
        </div>
      </section>

      <section style={{ maxWidth: 1180, margin: '0 auto', padding: '42px 20px 74px' }}>
        <div style={eyebrow}>DATA + HUMAN JUDGMENT</div>
        <h2 style={{ fontSize: 38, margin: '8px 0 18px' }}>Build the evidence trail, then add the street-level intelligence.</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(250px,1fr))', gap: 12 }}>
          {sourcePlan.map(([title, text]) => <article key={title} style={card}><h3 style={{ fontSize: 21, margin: '0 0 7px' }}>{title}</h3><p style={{ color: '#5F5A52', lineHeight: 1.6, margin: 0, fontSize: 14 }}>{text}</p></article>)}
        </div>
        <div style={{ marginTop: 16, padding: 16, borderRadius: 14, background: '#FFF3CF', border: '1px solid #DDC378', color: '#635019', fontSize: 13, lineHeight: 1.6 }}>
          MLS and brokerage data are licensed datasets. Aridon should only ingest them through an authorized feed or partner agreement. Public-source and user-supplied information can be handled separately with source and confidence labels.
        </div>
      </section>
    </main>
  );
}

function Slider({ label: text, value, min, max, step, onChange, suffix }: { label: string; value: number; min: number; max: number; step: number; onChange: (value: number) => void; suffix: string }) {
  return <div style={{ marginTop: 17 }}><div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, fontSize: 12, fontWeight: 900 }}><span>{text}</span><strong>{value}{suffix}</strong></div><input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} style={{ width: '100%', marginTop: 8 }} /></div>;
}

function DarkScore({ label: text, value }: { label: string; value: number }) {
  return <div style={{ background: '#172235', border: '1px solid #2B3A52', borderRadius: 12, padding: 12 }}><div style={{ color: '#AAB7C8', fontSize: 11 }}>{text}</div><div style={{ fontSize: 27, fontWeight: 950, marginTop: 3 }}>{value}</div></div>;
}

const card = { background: '#fff', border: '1px solid #D8D1C5', borderRadius: 18, padding: 20, boxShadow: '0 10px 28px rgba(31,24,15,.05)' };
const eyebrow = { color: '#1C6A50', fontSize: 11, fontWeight: 950, letterSpacing: 1.05 };
const label = { display: 'block', fontSize: 12, fontWeight: 900, marginBottom: 7 };
const input = { width: '100%', boxSizing: 'border-box' as const, border: '1px solid #CBC4B8', borderRadius: 10, padding: '11px 12px', background: '#fff', fontWeight: 750 };
const chip = { background: '#0E1B2E', border: '1px solid #2C405F', padding: '8px 11px', borderRadius: 999, fontSize: 12, fontWeight: 850 };
