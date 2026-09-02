'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { ComparableLandSale, LandRiskInputs, priceLand } from '../../../lib/landPricing';

type Mode = 'price' | 'analyze' | 'hunt';

type CompDraft = ComparableLandSale & { priceText: string; acresText: string; monthsText: string; distanceText: string; similarityText: string };

const blankRisk: LandRiskInputs = {
  access: 'unknown', water: 'unknown', utilities: 'unknown', zoning: 'unknown', flood: 'unknown', wetlands: 'unknown', slope: 'unknown',
};

function newComp(id: string): CompDraft {
  return { id, price: 0, acres: 0, monthsAgo: 0, distanceMiles: 0, similarity: 80, priceText: '', acresText: '', monthsText: '', distanceText: '', similarityText: '80' };
}

const demoComps: CompDraft[] = [
  { id: 'c1', price: 84000, acres: 20, monthsAgo: 4, distanceMiles: 7, similarity: 92, priceText: '84000', acresText: '20', monthsText: '4', distanceText: '7', similarityText: '92' },
  { id: 'c2', price: 76000, acres: 18, monthsAgo: 9, distanceMiles: 12, similarity: 88, priceText: '76000', acresText: '18', monthsText: '9', distanceText: '12', similarityText: '88' },
  { id: 'c3', price: 112000, acres: 25, monthsAgo: 13, distanceMiles: 18, similarity: 81, priceText: '112000', acresText: '25', monthsText: '13', distanceText: '18', similarityText: '81' },
  { id: 'c4', price: 69000, acres: 16, monthsAgo: 6, distanceMiles: 22, similarity: 76, priceText: '69000', acresText: '16', monthsText: '6', distanceText: '22', similarityText: '76' },
];

const dueDiligence = [
  ['Parcel + ownership', 'Assessor / recorder', 'APN, legal description, acreage, ownership, transfer history'],
  ['Market evidence', 'Licensed comps + deeds', 'Recent sold land normalized by acres, distance, recency and similarity'],
  ['Water', 'State + local records', 'Wells, rights, utility service, hauling, restrictions, drought reliability'],
  ['Buildability', 'Planning + environmental', 'Zoning, legal access, slope, flood, wetlands, septic and usable acreage'],
  ['Infrastructure', 'Providers + field estimates', 'Electric, gas, telecom, road and extension-cost exposure'],
  ['Deal math', 'Aridon underwriting', 'Value range, max offer, spread, target margin and confidence'],
];

const fmtMoney = (value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(Number.isFinite(value) ? value : 0);
const fmtPct = (value: number | null) => value == null ? '—' : `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
const numeric = (text: string) => Math.max(0, Number(text.replace(/[^0-9.]/g, '')) || 0);

export default function AridonLandIntelligencePage() {
  const [mode, setMode] = useState<Mode>('price');
  const [propertyRef, setPropertyRef] = useState('');
  const [state, setState] = useState('Arizona');
  const [acresText, setAcresText] = useState('20');
  const [askingText, setAskingText] = useState('60000');
  const [marginText, setMarginText] = useState('25');
  const [reserveText, setReserveText] = useState('5000');
  const [risks, setRisks] = useState<LandRiskInputs>(blankRisk);
  const [comps, setComps] = useState<CompDraft[]>([newComp('c1'), newComp('c2'), newComp('c3')]);
  const [searchBudget, setSearchBudget] = useState('50000');
  const [minDiscount, setMinDiscount] = useState('30');
  const [minAcres, setMinAcres] = useState('5');
  const [maxAcres, setMaxAcres] = useState('100');
  const [useCase, setUseCase] = useState('Investment / resale');

  const pricedComps = useMemo(() => comps.map((comp) => ({
    ...comp,
    price: numeric(comp.priceText),
    acres: numeric(comp.acresText),
    monthsAgo: numeric(comp.monthsText),
    distanceMiles: numeric(comp.distanceText),
    similarity: Math.min(100, numeric(comp.similarityText) || 80),
  })), [comps]);

  const result = useMemo(() => priceLand({
    acres: numeric(acresText),
    askingPrice: numeric(askingText),
    targetMarginPct: numeric(marginText) || 25,
    reserve: numeric(reserveText),
    comps: pricedComps,
    risks,
  }), [acresText, askingText, marginText, reserveText, pricedComps, risks]);

  function updateRisk<K extends keyof LandRiskInputs>(key: K, value: LandRiskInputs[K]) {
    setRisks((current) => ({ ...current, [key]: value }));
  }

  function updateComp(id: string, key: keyof CompDraft, value: string) {
    setComps((current) => current.map((comp) => comp.id === id ? { ...comp, [key]: value } : comp));
  }

  function addComp() {
    setComps((current) => [...current, newComp(`c${Date.now()}`)]);
  }

  function loadExample() {
    setComps(demoComps);
    setAcresText('20'); setAskingText('60000');
    setRisks({ access: 'paved', water: 'well', utilities: 'nearby', zoning: 'confirmed', flood: 'low', wetlands: 'none', slope: 'rolling' });
  }

  const huntSentence = `Find ${state} land with ${minAcres || '0'}–${maxAcres || 'any'} acres, asking no more than ${fmtMoney(numeric(searchBudget))}, targeting at least ${minDiscount || '0'}% value gap, optimized for ${useCase.toLowerCase()}, then verify access, water, zoning, flood, wetlands and utilities before ranking.`;

  return (
    <main style={{ minHeight: '100vh', background: '#F2EFE6', color: '#171717', fontFamily: 'Arial, sans-serif' }}>
      <header style={{ background: '#07101D', color: '#F8FAFC', padding: '28px 20px 54px' }}>
        <div style={{ maxWidth: 1220, margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
            <div><div style={{ color: mint, fontSize: 11, fontWeight: 950, letterSpacing: 1.25 }}>ARIDON · LAND INTELLIGENCE 2.0</div><div style={{ color: '#91A2BA', fontSize: 12, marginTop: 5 }}>Land pricing + risk + acquisition underwriting</div></div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}><Link href="/property-intelligence" style={darkLink}>Property Hunter</Link><Link href="/property-intelligence/market" style={darkLink}>Market Radar</Link><Link href="/property-intelligence/sources" style={darkLink}>Sources</Link><Link href="/ag" style={darkLink}>Ag</Link></div>
          </div>
          <h1 style={{ fontSize: 'clamp(46px,7vw,82px)', lineHeight: .92, letterSpacing: -3.5, margin: '22px 0 18px', maxWidth: 1080 }}>Price the dirt. Price the risk. Price the deal.</h1>
          <p style={{ color: '#C0CCDC', fontSize: 19, lineHeight: 1.65, maxWidth: 950 }}>Aridon does more than estimate a number. It weights comparable land sales, adjusts for land-specific constraints, exposes confidence, calculates a maximum offer and tells you what could break the deal.</p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 20 }}>{['Comp-weighted value', 'Price / acre', 'Confidence range', 'Water', 'Access', 'Flood + wetlands', 'Zoning', 'Max offer', 'Deal score'].map((item) => <span key={item} style={chip}>{item}</span>)}</div>
        </div>
      </header>

      <section style={{ maxWidth: 1220, margin: '-22px auto 0', padding: '0 20px 12px' }}>
        <div style={{ ...card, padding: 8, display: 'flex', gap: 7, flexWrap: 'wrap' }}>
          <ModeButton active={mode === 'price'} onClick={() => setMode('price')}>$ Price It</ModeButton>
          <ModeButton active={mode === 'analyze'} onClick={() => setMode('analyze')}>◎ Analyze Property</ModeButton>
          <ModeButton active={mode === 'hunt'} onClick={() => setMode('hunt')}>⌕ Find Deals</ModeButton>
        </div>
      </section>

      {mode === 'price' && <section style={section}>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(310px,.85fr) minmax(0,1.55fr)', gap: 14 }}>
          <article style={card}>
            <div style={eyebrow}>SUBJECT PROPERTY</div><h2 style={h2}>Start with the parcel.</h2>
            <Field label="Address, listing URL or APN"><input value={propertyRef} onChange={(e) => setPropertyRef(e.target.value)} style={input} placeholder="Optional property reference" /></Field>
            <div style={twoCol}><Field label="Acres"><input value={acresText} onChange={(e) => setAcresText(e.target.value)} style={input} inputMode="decimal" /></Field><Field label="Asking price"><input value={askingText} onChange={(e) => setAskingText(e.target.value)} style={input} inputMode="numeric" /></Field></div>
            <div style={twoCol}><Field label="Target margin %"><input value={marginText} onChange={(e) => setMarginText(e.target.value)} style={input} inputMode="decimal" /></Field><Field label="DD / closing reserve"><input value={reserveText} onChange={(e) => setReserveText(e.target.value)} style={input} inputMode="numeric" /></Field></div>
            <button onClick={loadExample} style={secondaryButton}>Load clearly labeled example data</button>
            <p style={finePrint}>Example values are only for demonstrating the calculator. A real estimate should use verified sold comps and parcel facts.</p>
          </article>

          <article style={card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'end', flexWrap: 'wrap' }}><div><div style={eyebrow}>COMPARABLE SALES</div><h2 style={h2}>Weight the evidence, not just the average.</h2></div><button onClick={addComp} style={secondaryButton}>+ Add comp</button></div>
            <div style={{ overflowX: 'auto', marginTop: 14 }}><table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 700 }}><thead><tr>{['Sale price', 'Acres', 'Months ago', 'Miles away', 'Similarity %', ''].map((head) => <th key={head} style={th}>{head}</th>)}</tr></thead><tbody>{comps.map((comp) => <tr key={comp.id}><Cell><input aria-label="Comparable sale price" style={cellInput} value={comp.priceText} onChange={(e) => updateComp(comp.id, 'priceText', e.target.value)} /></Cell><Cell><input aria-label="Comparable acres" style={cellInput} value={comp.acresText} onChange={(e) => updateComp(comp.id, 'acresText', e.target.value)} /></Cell><Cell><input aria-label="Comparable months ago" style={cellInput} value={comp.monthsText} onChange={(e) => updateComp(comp.id, 'monthsText', e.target.value)} /></Cell><Cell><input aria-label="Comparable miles away" style={cellInput} value={comp.distanceText} onChange={(e) => updateComp(comp.id, 'distanceText', e.target.value)} /></Cell><Cell><input aria-label="Comparable similarity" style={cellInput} value={comp.similarityText} onChange={(e) => updateComp(comp.id, 'similarityText', e.target.value)} /></Cell><Cell><button aria-label="Remove comparable" onClick={() => setComps((current) => current.filter((item) => item.id !== comp.id))} style={removeButton}>×</button></Cell></tr>)}</tbody></table></div>
          </article>
        </div>

        <RiskStrip risks={risks} updateRisk={updateRisk} />
        <ResultBoard result={result} asking={numeric(askingText)} propertyRef={propertyRef} />
      </section>}

      {mode === 'analyze' && <section style={section}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(310px,1fr))', gap: 14 }}>
          <article style={card}><div style={eyebrow}>LAND-SPECIFIC RISK</div><h2 style={h2}>A Zestimate-style number is not enough for raw land.</h2><p style={copy}>Land can look cheap and still be unusable. Aridon forces the expensive questions into the valuation instead of hiding them after the estimate.</p><RiskFields risks={risks} updateRisk={updateRisk} /></article>
          <article style={{ ...card, background: '#101827', color: '#fff', borderColor: '#26354D' }}><div style={{ ...eyebrow, color: mint }}>CURRENT ADJUSTMENTS</div><h2 style={h2}>What is moving the value.</h2>{result ? <div style={{ display: 'grid', gap: 8 }}>{result.factors.map((item) => <div key={item.label} style={{ padding: 12, border: '1px solid #2B3B55', borderRadius: 12, background: '#0C1524' }}><div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}><strong>{item.label}</strong><strong style={{ color: item.impactPct >= 0 ? mint : '#FFB8A8' }}>{item.impactPct >= 0 ? '+' : ''}{item.impactPct}%</strong></div><div style={{ color: '#AFBDD0', fontSize: 12, lineHeight: 1.5, marginTop: 5 }}>{item.note}</div></div>)}</div> : <EmptyState />}</article>
        </div>
        <div style={{ marginTop: 14, display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(250px,1fr))', gap: 10 }}>{dueDiligence.map(([title, source, detail]) => <article key={title} style={card}><div style={eyebrow}>{title}</div><h3 style={{ margin: '8px 0 6px' }}>{source}</h3><p style={{ ...copy, fontSize: 14, margin: 0 }}>{detail}</p></article>)}</div>
      </section>}

      {mode === 'hunt' && <section style={section}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(320px,1fr))', gap: 14 }}>
          <article style={card}><div style={eyebrow}>DEAL FINDER</div><h2 style={h2}>Describe the buy box.</h2><Field label="State / market"><input value={state} onChange={(e) => setState(e.target.value)} style={input} /></Field><div style={twoCol}><Field label="Min acres"><input value={minAcres} onChange={(e) => setMinAcres(e.target.value)} style={input} /></Field><Field label="Max acres"><input value={maxAcres} onChange={(e) => setMaxAcres(e.target.value)} style={input} /></Field></div><Field label="Max asking price"><input value={searchBudget} onChange={(e) => setSearchBudget(e.target.value)} style={input} /></Field><Field label="Minimum estimated value gap %"><input value={minDiscount} onChange={(e) => setMinDiscount(e.target.value)} style={input} /></Field><Field label="Use case"><select value={useCase} onChange={(e) => setUseCase(e.target.value)} style={input}><option>Investment / resale</option><option>Farm / ranch</option><option>Homestead</option><option>Development</option><option>Solar / energy</option><option>AWG / water infrastructure</option><option>Conservation</option></select></Field></article>
          <article style={{ ...card, background: '#10271C', color: '#fff', borderColor: '#294736' }}><div style={{ ...eyebrow, color: '#BFE79F' }}>ARIDON SEARCH RECIPE</div><h2 style={h2}>Turn filters into a hunt.</h2><div style={{ background: '#183829', border: '1px solid #315340', borderRadius: 14, padding: 16, lineHeight: 1.65, color: '#E8F1EB' }}>{huntSentence}</div><div style={{ marginTop: 16, padding: 14, borderRadius: 12, background: '#0B1D14', color: '#C8D8CF', fontSize: 13, lineHeight: 1.6 }}><strong style={{ color: '#fff' }}>Data honesty:</strong> the scoring engine is live now. Nationwide automatic valuation requires a licensed sold-comps / parcel feed plus public-record overlays. Aridon will not invent a sale, owner, water right or parcel fact when a source is missing.</div><Link href="/property-intelligence" style={{ ...primaryButton, display: 'inline-block', textDecoration: 'none', marginTop: 14 }}>Open Property Hunter →</Link></article>
        </div>
      </section>}

      <section style={{ background: '#fff', borderTop: '1px solid #D8D1C5', marginTop: 34, padding: '44px 20px 70px' }}><div style={{ maxWidth: 1220, margin: '0 auto' }}><div style={eyebrow}>THE MOAT</div><h2 style={{ fontSize: 'clamp(34px,5vw,54px)', margin: '8px 0 18px', letterSpacing: -1.7 }}>The estimate should explain itself.</h2><div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(230px,1fr))', gap: 10 }}>{[['Value', 'Weighted sold comps + acreage normalization'], ['Truth', 'Confidence and source verification instead of false precision'], ['Land', 'Water, access, zoning, slope, flood and wetlands'], ['Buy box', 'Maximum offer, target margin and gross spread'], ['Use', 'Farm, ranch, development, energy and water-infrastructure fit'], ['Action', 'Push the best parcels into Aridon Property Hunter and acquisition workflow']].map(([title, text]) => <article key={title} style={card}><h3 style={{ marginTop: 0 }}>{title}</h3><p style={{ ...copy, fontSize: 14, marginBottom: 0 }}>{text}</p></article>)}</div></div></section>
    </main>
  );
}

function ResultBoard({ result, asking, propertyRef }: { result: ReturnType<typeof priceLand>; asking: number; propertyRef: string }) {
  return <div style={{ marginTop: 14 }}>{result ? <div style={{ display: 'grid', gridTemplateColumns: 'minmax(260px,.7fr) minmax(0,1.5fr)', gap: 14 }}><article style={{ ...card, background: '#101827', color: '#fff', borderColor: '#26354D' }}><div style={{ ...eyebrow, color: mint }}>ARIDON DEAL SCORE</div><div style={{ fontSize: 84, fontWeight: 950, lineHeight: 1, marginTop: 12 }}>{result.dealScore}</div><div style={{ color: mint, fontWeight: 950, marginTop: 8 }}>{result.verdict}</div><div style={{ color: '#AEBBD0', marginTop: 16, lineHeight: 1.55, fontSize: 13 }}>{propertyRef || 'Subject property'}<br />{result.compCount} verified inputs in comp model · confidence {result.confidence}%</div></article><article style={card}><div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(145px,1fr))', gap: 9 }}><Metric label="Estimated value" value={fmtMoney(result.estimatedValue)} /><Metric label="Value range" value={`${fmtMoney(result.lowValue)} – ${fmtMoney(result.highValue)}`} /><Metric label="Adjusted $ / acre" value={fmtMoney(result.adjustedPricePerAcre)} /><Metric label="Confidence" value={`${result.confidence}%`} /><Metric label="Max offer" value={fmtMoney(result.maxOffer)} /><Metric label="Value gap vs ask" value={fmtPct(result.askingDiscountPct)} /><Metric label="Gross spread vs ask" value={result.grossSpread == null ? '—' : fmtMoney(result.grossSpread)} /><Metric label="Land adjustment" value={fmtPct(result.adjustmentPct)} /></div><div style={{ ...finePrint, marginTop: 14 }}>{asking > 0 ? `Asking price entered: ${fmtMoney(asking)}. ` : ''}The range expands when comps disagree or parcel facts are missing. That uncertainty is a feature, not decorative precision.</div></article></div> : <article style={card}><EmptyState /></article>}</div>;
}

function RiskStrip({ risks, updateRisk }: { risks: LandRiskInputs; updateRisk: <K extends keyof LandRiskInputs>(key: K, value: LandRiskInputs[K]) => void }) {
  return <article style={{ ...card, marginTop: 14 }}><div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', alignItems: 'end' }}><div><div style={eyebrow}>PARCEL ADJUSTMENTS</div><h2 style={{ ...h2, marginBottom: 0 }}>Make land facts move the price.</h2></div><div style={finePrint}>Unknowns receive a conservative haircut until verified.</div></div><RiskFields risks={risks} updateRisk={updateRisk} compact /></article>;
}

function RiskFields({ risks, updateRisk, compact = false }: { risks: LandRiskInputs; updateRisk: <K extends keyof LandRiskInputs>(key: K, value: LandRiskInputs[K]) => void; compact?: boolean }) {
  return <div style={{ display: 'grid', gridTemplateColumns: `repeat(auto-fit,minmax(${compact ? 145 : 210}px,1fr))`, gap: 9, marginTop: 14 }}><SelectField label="Access" value={risks.access} onChange={(v) => updateRisk('access', v as LandRiskInputs['access'])} options={[['unknown','Unknown'],['paved','Paved legal'],['unpaved','Unpaved legal'],['easement','Private / easement'],['landlocked','Landlocked']]} /><SelectField label="Water" value={risks.water} onChange={(v) => updateRisk('water', v as LandRiskInputs['water'])} options={[['unknown','Unknown'],['public','Public'],['well','Verified well'],['rights','Water rights'],['haul','Haul / storage'],['none','No source']]} /><SelectField label="Utilities" value={risks.utilities} onChange={(v) => updateRisk('utilities', v as LandRiskInputs['utilities'])} options={[['unknown','Unknown'],['onsite','On site'],['nearby','Nearby'],['offgrid','Off-grid plan'],['none','None']]} /><SelectField label="Zoning" value={risks.zoning} onChange={(v) => updateRisk('zoning', v as LandRiskInputs['zoning'])} options={[['unknown','Unknown'],['confirmed','Use confirmed'],['conditional','Conditional'],['restricted','Restricted']]} /><SelectField label="Flood" value={risks.flood} onChange={(v) => updateRisk('flood', v as LandRiskInputs['flood'])} options={[['unknown','Unknown'],['low','Low'],['moderate','Moderate'],['high','High']]} /><SelectField label="Wetlands" value={risks.wetlands} onChange={(v) => updateRisk('wetlands', v as LandRiskInputs['wetlands'])} options={[['unknown','Unknown'],['none','None known'],['partial','Partial'],['major','Major']]} /><SelectField label="Slope" value={risks.slope} onChange={(v) => updateRisk('slope', v as LandRiskInputs['slope'])} options={[['unknown','Unknown'],['flat','Flat'],['rolling','Rolling'],['steep','Steep']]} /></div>;
}

function SelectField({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: string[][] }) { return <Field label={label}><select value={value} onChange={(e) => onChange(e.target.value)} style={input}>{options.map(([v, t]) => <option key={v} value={v}>{t}</option>)}</select></Field>; }
function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label style={{ display: 'block', marginTop: 10 }}><span style={labelStyle}>{label}</span>{children}</label>; }
function Cell({ children }: { children: React.ReactNode }) { return <td style={{ borderTop: '1px solid #E5DED3', padding: 6 }}>{children}</td>; }
function Metric({ label, value }: { label: string; value: string }) { return <div style={{ border: '1px solid #DDD6CA', borderRadius: 12, padding: 12, background: '#FAF8F3' }}><div style={{ fontSize: 11, color: '#6A655D', fontWeight: 900 }}>{label}</div><div style={{ fontSize: 20, fontWeight: 950, marginTop: 6 }}>{value}</div></div>; }
function ModeButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) { return <button onClick={onClick} style={{ border: active ? '1px solid #07101D' : '1px solid #D5CEC2', background: active ? '#07101D' : '#fff', color: active ? '#fff' : '#171717', borderRadius: 11, padding: '11px 14px', fontWeight: 950, cursor: 'pointer' }}>{children}</button>; }
function EmptyState() { return <div style={{ color: '#6C665D', lineHeight: 1.6 }}><strong style={{ color: '#171717' }}>Add at least one valid sold comp.</strong><br />Aridon will not manufacture a valuation when the evidence box is empty.</div>; }

const mint = '#9EF0CF';
const section = { maxWidth: 1220, margin: '0 auto', padding: '18px 20px 16px' } as const;
const card = { background: '#fff', border: '1px solid #D4CEC2', borderRadius: 18, padding: 20, boxShadow: '0 10px 28px rgba(31,24,15,.045)' } as const;
const eyebrow = { color: '#1C6A50', fontSize: 11, fontWeight: 950, letterSpacing: 1.05 } as const;
const h2 = { fontSize: 29, lineHeight: 1.08, margin: '8px 0 14px', letterSpacing: -.7 } as const;
const copy = { color: '#625E55', lineHeight: 1.65 } as const;
const labelStyle = { display: 'block', fontSize: 11, fontWeight: 900, marginBottom: 6, color: '#514D46' } as const;
const input = { width: '100%', boxSizing: 'border-box', border: '1px solid #CFC9BE', borderRadius: 10, padding: '11px 12px', background: '#fff', color: '#171717', fontWeight: 750 } as const;
const cellInput = { ...input, padding: '9px 9px', minWidth: 90 } as const;
const th = { textAlign: 'left', padding: '8px 6px', color: '#69635B', fontSize: 11, whiteSpace: 'nowrap' } as const;
const twoCol = { display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 9 } as const;
const primaryButton = { background: mint, color: '#07130F', border: 0, borderRadius: 11, padding: '12px 14px', fontWeight: 950, cursor: 'pointer' } as const;
const secondaryButton = { background: '#F5F2EC', color: '#171717', border: '1px solid #D5CEC2', borderRadius: 10, padding: '10px 12px', fontWeight: 900, cursor: 'pointer' } as const;
const removeButton = { border: '1px solid #D9CFC2', background: '#FFF7F4', color: '#8C3120', borderRadius: 9, width: 34, height: 34, fontSize: 20, cursor: 'pointer' } as const;
const darkLink = { color: '#E7EDF6', textDecoration: 'none', border: '1px solid #34445E', borderRadius: 10, padding: '8px 10px', fontSize: 12, fontWeight: 900 } as const;
const chip = { background: '#0E1B2E', border: '1px solid #2C405F', color: '#EAF0F8', borderRadius: 999, padding: '8px 10px', fontSize: 11, fontWeight: 850 } as const;
const finePrint = { color: '#746E64', fontSize: 12, lineHeight: 1.5 } as const;
