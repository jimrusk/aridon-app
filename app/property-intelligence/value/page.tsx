'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { PropertyComp, PropertyType, valueProperty } from '../../../lib/propertyValuation';

type CompDraft = PropertyComp & {
  priceText: string;
  sizeText: string;
  monthsText: string;
  distanceText: string;
  similarityText: string;
};

const money = (value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(Number.isFinite(value) ? value : 0);
const pct = (value: number | null) => value == null ? '—' : `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
const numeric = (text: string) => Math.max(0, Number(text.replace(/[^0-9.]/g, '')) || 0);

function blankComp(id: string): CompDraft {
  return { id, soldPrice: 0, size: 0, monthsAgo: 0, distanceMiles: 0, similarity: 80, verifiedSale: true, priceText: '', sizeText: '', monthsText: '', distanceText: '', similarityText: '80' };
}

const demoHome: CompDraft[] = [
  { id: 'a', soldPrice: 382000, size: 1880, monthsAgo: 2, distanceMiles: 1.6, similarity: 94, verifiedSale: true, priceText: '382000', sizeText: '1880', monthsText: '2', distanceText: '1.6', similarityText: '94' },
  { id: 'b', soldPrice: 369000, size: 1810, monthsAgo: 5, distanceMiles: 2.4, similarity: 91, verifiedSale: true, priceText: '369000', sizeText: '1810', monthsText: '5', distanceText: '2.4', similarityText: '91' },
  { id: 'c', soldPrice: 401000, size: 2010, monthsAgo: 4, distanceMiles: 3.1, similarity: 87, verifiedSale: true, priceText: '401000', sizeText: '2010', monthsText: '4', distanceText: '3.1', similarityText: '87' },
  { id: 'd', soldPrice: 515000, size: 1930, monthsAgo: 6, distanceMiles: 4.8, similarity: 65, verifiedSale: true, priceText: '515000', sizeText: '1930', monthsText: '6', distanceText: '4.8', similarityText: '65' },
];

export default function VerifiedValuePage() {
  const [propertyType, setPropertyType] = useState<PropertyType>('home');
  const [propertyRef, setPropertyRef] = useState('');
  const [sizeText, setSizeText] = useState('1900');
  const [askingText, setAskingText] = useState('425000');
  const [condition, setCondition] = useState<'excellent' | 'good' | 'average' | 'repairs' | 'major-rehab' | 'unknown'>('average');
  const [marketTrend, setMarketTrend] = useState<'falling' | 'soft' | 'flat' | 'rising' | 'hot'>('flat');
  const [repairText, setRepairText] = useState('0');
  const [marginText, setMarginText] = useState('18');
  const [reserveText, setReserveText] = useState('6000');
  const [comps, setComps] = useState<CompDraft[]>([blankComp('1'), blankComp('2'), blankComp('3')]);

  const unitLabel = propertyType === 'land' || propertyType === 'farm-ranch' ? 'Acres' : 'Sq ft';
  const unitValueLabel = propertyType === 'land' || propertyType === 'farm-ranch' ? '$ / acre' : '$ / sq ft';

  const parsedComps = useMemo(() => comps.map((comp) => ({
    ...comp,
    soldPrice: numeric(comp.priceText),
    size: numeric(comp.sizeText),
    monthsAgo: numeric(comp.monthsText),
    distanceMiles: numeric(comp.distanceText),
    similarity: Math.min(100, numeric(comp.similarityText) || 80),
  })), [comps]);

  const result = useMemo(() => valueProperty({
    propertyType,
    size: numeric(sizeText),
    askingPrice: numeric(askingText),
    condition,
    marketTrend,
    repairBudget: numeric(repairText),
    targetMarginPct: numeric(marginText) || 18,
    closingReserve: numeric(reserveText),
    comps: parsedComps,
  }), [propertyType, sizeText, askingText, condition, marketTrend, repairText, marginText, reserveText, parsedComps]);

  function setComp(id: string, key: keyof CompDraft, value: string | boolean) {
    setComps((current) => current.map((comp) => comp.id === id ? { ...comp, [key]: value } : comp));
  }

  function loadDemo() {
    setPropertyType('home');
    setSizeText('1900');
    setAskingText('425000');
    setCondition('average');
    setMarketTrend('flat');
    setRepairText('0');
    setMarginText('18');
    setReserveText('6000');
    setComps(demoHome);
  }

  return <main style={{ minHeight: '100vh', background: '#F3F0E8', color: '#171717', fontFamily: 'Arial, sans-serif' }}>
    <header style={{ background: '#07101D', color: '#fff', padding: '32px 20px 58px' }}>
      <div style={{ maxWidth: 1220, margin: '0 auto' }}>
        <div style={{ color: '#9EF0CF', fontSize: 11, fontWeight: 950, letterSpacing: 1.2 }}>ARIDON · VERIFIED VALUE</div>
        <h1 style={{ fontSize: 'clamp(48px,7.5vw,84px)', lineHeight: .92, letterSpacing: -3.6, margin: '16px 0 18px', maxWidth: 1120 }}>Don’t guess high. Prove the property value.</h1>
        <p style={{ color: '#BFCCDC', fontSize: 19, lineHeight: 1.65, maxWidth: 960 }}>Aridon uses sold comps, suppresses price outliers, discounts uncertainty, shows the range and separates likely market value from the number a buyer should actually pay.</p>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 20 }}>{['Verified sold comps', 'Outlier suppression', 'Confidence score', 'Condition adjustment', 'Market direction', 'Repair deduction', 'Conservative value', 'Max buy price'].map((item) => <span key={item} style={chip}>{item}</span>)}</div>
      </div>
    </header>

    <section style={{ maxWidth: 1220, margin: '-24px auto 0', padding: '0 20px 18px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(310px,.8fr) minmax(0,1.55fr)', gap: 14 }}>
        <article style={card}>
          <div style={eyebrow}>SUBJECT PROPERTY</div><h2 style={h2}>Tell Aridon what it is.</h2>
          <Field label="Property type"><select value={propertyType} onChange={(e) => setPropertyType(e.target.value as PropertyType)} style={input}><option value="home">Home</option><option value="land">Land</option><option value="farm-ranch">Farm / ranch</option><option value="commercial">Commercial</option></select></Field>
          <Field label="Address, listing URL or APN"><input value={propertyRef} onChange={(e) => setPropertyRef(e.target.value)} style={input} placeholder="Optional reference" /></Field>
          <div style={twoCol}><Field label={unitLabel}><input value={sizeText} onChange={(e) => setSizeText(e.target.value)} style={input} /></Field><Field label="Asking price"><input value={askingText} onChange={(e) => setAskingText(e.target.value)} style={input} /></Field></div>
          <div style={twoCol}><Field label="Condition"><select value={condition} onChange={(e) => setCondition(e.target.value as typeof condition)} style={input}><option value="excellent">Excellent</option><option value="good">Good</option><option value="average">Average</option><option value="repairs">Needs repairs</option><option value="major-rehab">Major rehab</option><option value="unknown">Unknown</option></select></Field><Field label="Market direction"><select value={marketTrend} onChange={(e) => setMarketTrend(e.target.value as typeof marketTrend)} style={input}><option value="falling">Falling</option><option value="soft">Softening</option><option value="flat">Flat</option><option value="rising">Rising</option><option value="hot">Hot</option></select></Field></div>
          <Field label="Known repair / cure cost"><input value={repairText} onChange={(e) => setRepairText(e.target.value)} style={input} /></Field>
          <div style={twoCol}><Field label="Target buyer margin %"><input value={marginText} onChange={(e) => setMarginText(e.target.value)} style={input} /></Field><Field label="Closing / DD reserve"><input value={reserveText} onChange={(e) => setReserveText(e.target.value)} style={input} /></Field></div>
          <button onClick={loadDemo} style={secondaryButton}>Load labeled home example</button>
          {propertyType === 'land' && <Link href="/property-intelligence/land" style={{ ...secondaryButton, display: 'inline-block', textDecoration: 'none', marginLeft: 8 }}>Open deeper land model →</Link>}
        </article>

        <article style={card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'end', gap: 12, flexWrap: 'wrap' }}><div><div style={eyebrow}>SOLD COMPARABLES</div><h2 style={h2}>Use what actually sold.</h2></div><button style={secondaryButton} onClick={() => setComps((current) => [...current, blankComp(`${Date.now()}`)])}>+ Add comp</button></div>
          <p style={{ ...copy, marginTop: -4 }}>Aridon gives more weight to recent, nearby, similar, verified sales. A strange high sale does not get to hijack the estimate.</p>
          <div style={{ overflowX: 'auto' }}><table style={{ width: '100%', minWidth: 760, borderCollapse: 'collapse' }}><thead><tr>{['Sold price', unitLabel, 'Months ago', 'Miles away', 'Similarity %', 'Verified', ''].map((head) => <th key={head} style={th}>{head}</th>)}</tr></thead><tbody>{comps.map((comp) => <tr key={comp.id}><Cell><input style={cellInput} value={comp.priceText} onChange={(e) => setComp(comp.id, 'priceText', e.target.value)} /></Cell><Cell><input style={cellInput} value={comp.sizeText} onChange={(e) => setComp(comp.id, 'sizeText', e.target.value)} /></Cell><Cell><input style={cellInput} value={comp.monthsText} onChange={(e) => setComp(comp.id, 'monthsText', e.target.value)} /></Cell><Cell><input style={cellInput} value={comp.distanceText} onChange={(e) => setComp(comp.id, 'distanceText', e.target.value)} /></Cell><Cell><input style={cellInput} value={comp.similarityText} onChange={(e) => setComp(comp.id, 'similarityText', e.target.value)} /></Cell><Cell style={{ textAlign: 'center' }}><input type="checkbox" checked={comp.verifiedSale !== false} onChange={(e) => setComp(comp.id, 'verifiedSale', e.target.checked)} /></Cell><Cell><button aria-label="Remove comp" style={removeButton} onClick={() => setComps((current) => current.filter((item) => item.id !== comp.id))}>×</button></Cell></tr>)}</tbody></table></div>
        </article>
      </div>
    </section>

    <section style={{ maxWidth: 1220, margin: '0 auto', padding: '0 20px 28px' }}>
      {result ? <div style={{ display: 'grid', gridTemplateColumns: 'minmax(270px,.72fr) minmax(0,1.6fr)', gap: 14 }}>
        <article style={{ ...card, background: '#101827', color: '#fff', borderColor: '#26354D' }}>
          <div style={{ ...eyebrow, color: '#9EF0CF' }}>ARIDON VERDICT</div><div style={{ fontSize: 'clamp(31px,4vw,48px)', fontWeight: 950, lineHeight: 1, marginTop: 14 }}>{result.verdict}</div>
          <div style={{ marginTop: 18, color: '#AEBBD0', lineHeight: 1.55 }}>{propertyRef || 'Subject property'}<br />Confidence: <strong style={{ color: '#fff' }}>{result.confidence}%</strong><br />Verified sold comps: <strong style={{ color: '#fff' }}>{result.verifiedCompCount}/{result.compCount}</strong></div>
          {result.outlierCount > 0 && <div style={{ marginTop: 14, padding: 12, border: '1px solid #604E28', background: '#251F13', borderRadius: 12, color: '#F7DFA8', fontSize: 13 }}>{result.outlierCount} outlier comp{result.outlierCount === 1 ? '' : 's'} suppressed.</div>}
        </article>
        <article style={card}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 9 }}>
            <Metric label="Evidence value" value={money(result.evidenceValue)} help="Robust sold-comp estimate after condition and market adjustments." />
            <Metric label="Conservative value" value={money(result.conservativeValue)} help="Haircut for uncertainty. This is Aridon’s underwriting anchor." />
            <Metric label="Value range" value={`${money(result.lowValue)} – ${money(result.highValue)}`} help="The high side is a range boundary, not a target price." />
            <Metric label={unitValueLabel} value={money(result.adjustedUnitValue)} help="Adjusted evidence value per unit." />
            <Metric label="Max buy price" value={money(result.maxBuyPrice)} help="Conservative value less buyer margin and reserve." />
            <Metric label="Ask vs conservative" value={result.askingPremiumPct != null && result.askingPremiumPct > 0 ? `+${result.askingPremiumPct.toFixed(1)}% high` : pct(result.askingGapPct)} help="Compares the asking price to conservative value, not the optimistic ceiling." />
          </div>
          <div style={{ marginTop: 16, display: 'grid', gap: 8 }}>{result.warnings.length ? result.warnings.map((warning) => <div key={warning} style={warningBox}>⚠ {warning}</div>) : <div style={goodBox}>✓ No major valuation warnings from the entered evidence.</div>}</div>
        </article>
      </div> : <article style={card}><strong>Add at least one valid sold comparable.</strong><p style={copy}>Aridon will not manufacture a property value just to fill the screen.</p></article>}
    </section>

    <section style={{ background: '#fff', borderTop: '1px solid #D6D0C5', padding: '48px 20px 72px' }}><div style={{ maxWidth: 1220, margin: '0 auto' }}>
      <div style={eyebrow}>WHY THIS IS DIFFERENT</div><h2 style={{ fontSize: 'clamp(36px,5vw,56px)', lineHeight: 1, margin: '8px 0 18px', letterSpacing: -1.8 }}>One number is easy. A defensible number is useful.</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(230px,1fr))', gap: 10 }}>{[
        ['Sold, not wished-for', 'Base the model on closed sales, not seller aspirations.'],
        ['Outlier resistant', 'Suppress unusually high or low comps before they distort the answer.'],
        ['Confidence visible', 'A weak evidence set produces a weak confidence score, not fake certainty.'],
        ['Conservative by design', 'Acquisition math uses a haircut value, not the top of the range.'],
        ['Property aware', 'Condition, market direction, repairs and property-specific factors move the value.'],
        ['Explainable', 'Show the evidence, deductions, warnings and buy price so a person can challenge the model.'],
      ].map(([title, text]) => <article key={title} style={card}><h3 style={{ marginTop: 0 }}>{title}</h3><p style={{ ...copy, fontSize: 14, marginBottom: 0 }}>{text}</p></article>)}</div>
    </div></section>
  </main>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label style={{ display: 'block', marginTop: 10 }}><span style={labelStyle}>{label}</span>{children}</label>; }
function Cell({ children, style = {} }: { children: React.ReactNode; style?: React.CSSProperties }) { return <td style={{ borderTop: '1px solid #E5DED3', padding: 6, ...style }}>{children}</td>; }
function Metric({ label, value, help }: { label: string; value: string; help: string }) { return <div style={{ border: '1px solid #DDD6CA', borderRadius: 12, padding: 12, background: '#FAF8F3' }}><div style={{ fontSize: 11, color: '#6A655D', fontWeight: 900 }}>{label}</div><div style={{ fontSize: 20, fontWeight: 950, marginTop: 6 }}>{value}</div><div style={{ color: '#7B756C', fontSize: 10, lineHeight: 1.35, marginTop: 6 }}>{help}</div></div>; }

const card = { background: '#fff', border: '1px solid #D4CEC2', borderRadius: 18, padding: 20, boxShadow: '0 10px 28px rgba(31,24,15,.045)' } as const;
const eyebrow = { color: '#1C6A50', fontSize: 11, fontWeight: 950, letterSpacing: 1.05 } as const;
const h2 = { fontSize: 29, lineHeight: 1.08, margin: '8px 0 14px', letterSpacing: -.7 } as const;
const copy = { color: '#625E55', lineHeight: 1.65 } as const;
const labelStyle = { display: 'block', fontSize: 11, fontWeight: 900, marginBottom: 6, color: '#514D46' } as const;
const input = { width: '100%', boxSizing: 'border-box', border: '1px solid #CFC9BE', borderRadius: 10, padding: '11px 12px', background: '#fff', color: '#171717', fontWeight: 750 } as const;
const cellInput = { ...input, minWidth: 88, padding: '9px 9px' } as const;
const twoCol = { display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 9 } as const;
const secondaryButton = { background: '#F5F2EC', color: '#171717', border: '1px solid #D5CEC2', borderRadius: 10, padding: '10px 12px', fontWeight: 900, cursor: 'pointer', marginTop: 12 } as const;
const removeButton = { border: '1px solid #D9CFC2', background: '#FFF7F4', color: '#8C3120', borderRadius: 9, width: 34, height: 34, fontSize: 20, cursor: 'pointer' } as const;
const th = { textAlign: 'left', padding: '8px 6px', color: '#69635B', fontSize: 11, whiteSpace: 'nowrap' } as const;
const chip = { background: '#0E1B2E', border: '1px solid #2C405F', color: '#EAF0F8', borderRadius: 999, padding: '8px 10px', fontSize: 11, fontWeight: 850 } as const;
const warningBox = { background: '#FFF4D6', border: '1px solid #E4CA82', color: '#654F17', borderRadius: 10, padding: 11, fontSize: 12, lineHeight: 1.45 } as const;
const goodBox = { background: '#E7F5E9', border: '1px solid #A9D2AE', color: '#285D31', borderRadius: 10, padding: 11, fontSize: 12, lineHeight: 1.45 } as const;
