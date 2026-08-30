'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';

const uses = [
  'Farm / ranch',
  'Homestead',
  'Greenhouse / controlled ag',
  'Cabins / retreat',
  'RV / campground',
  'Recreation',
  'Conservation / habitat',
  'Solar / energy',
  'Long-term investment',
];

const markets = ['New Mexico', 'Arizona', 'Texas', 'Colorado', 'Utah', 'Nevada', 'California', 'Florida', 'Nationwide'];

const fundingPaths = [
  ['Seller financing', 'Search for owner-carry, contract-for-deed and negotiated low-down structures when the seller and deal support them.'],
  ['USDA / FSA', 'Screen farm ownership, operating, beginning-farmer and rural programs when the buyer and intended use may qualify.'],
  ['USDA Rural Development', 'Check eligible rural housing, business and community pathways where location and project type fit.'],
  ['NRCS / conservation', 'Look for cost-share and conservation assistance that can reduce eligible water, soil, grazing or infrastructure costs after acquisition.'],
  ['State + local programs', 'Match rural, housing, economic-development, water and agriculture programs by geography and project.'],
  ['Specialty lenders', 'Identify lenders that understand land, farm, ranch, construction, manufactured housing or alternative collateral.'],
];

const dueDiligence = [
  ['Parcel identity', 'County assessor / recorder', 'Confirm APN, legal description, owner and acreage.'],
  ['Zoning + allowed use', 'Planning / zoning', 'Confirm the intended project is allowed and what permits or hearings are required.'],
  ['Legal access', 'Recorder / title / roads', 'Confirm recorded access, easements and road maintenance obligations.'],
  ['Water', 'State engineer / county / well records', 'Check wells, water rights, hauling, shared systems, surface water and restrictions.'],
  ['Septic + soils', 'Environmental health / soil data', 'Check septic feasibility, soil limits, slopes and buildable area.'],
  ['Flood / fire / environmental', 'FEMA + state / local data', 'Screen floodplain, wildfire, wetlands and other development constraints.'],
  ['Taxes + liens', 'Treasurer / recorder / title', 'Check delinquency, liens, assessments and other encumbrances.'],
  ['Utilities', 'Local providers', 'Estimate electric, gas, telecom and extension costs or off-grid alternatives.'],
];

export default function AridonLandIntelligencePage() {
  const [market, setMarket] = useState('New Mexico');
  const [acres, setAcres] = useState('20');
  const [projectUse, setProjectUse] = useState('Farm / ranch');
  const [budget, setBudget] = useState('250000');
  const [cash, setCash] = useState('25000');
  const [propertyRef, setPropertyRef] = useState('');
  const [water, setWater] = useState('Unknown');
  const [access, setAccess] = useState('Unknown');
  const [utilities, setUtilities] = useState('Unknown');
  const [sellerFinancing, setSellerFinancing] = useState(true);
  const [planGenerated, setPlanGenerated] = useState(false);

  const analysis = useMemo(() => {
    const purchase = Math.max(0, Number(budget.replace(/[^0-9.]/g, '')) || 0);
    const availableCash = Math.max(0, Number(cash.replace(/[^0-9.]/g, '')) || 0);
    const acreage = Math.max(0, Number(acres.replace(/[^0-9.]/g, '')) || 0);
    const downPct = purchase ? Math.min(100, (availableCash / purchase) * 100) : 0;
    const financingNeed = Math.max(0, purchase - availableCash);

    const waterScore = water === 'Well / verified source' ? 92 : water === 'Public / community water' ? 88 : water === 'Haul / storage plan' ? 66 : 48;
    const accessScore = access === 'Recorded paved access' ? 92 : access === 'Recorded unpaved access' ? 78 : access === 'Private / easement' ? 64 : 46;
    const utilityScore = utilities === 'At property' ? 90 : utilities === 'Nearby' ? 74 : utilities === 'Off-grid planned' ? 72 : 50;

    let fundingScore = sellerFinancing ? 84 : 62;
    if (availableCash > 0) fundingScore += 4;
    if (['Farm / ranch', 'Greenhouse / controlled ag', 'Conservation / habitat'].includes(projectUse)) fundingScore += 5;
    if (downPct >= 20) fundingScore += 4;
    fundingScore = Math.min(96, fundingScore);

    let incomeScore = 64;
    if (['Farm / ranch', 'Greenhouse / controlled ag', 'Cabins / retreat', 'RV / campground', 'Solar / energy'].includes(projectUse)) incomeScore += 12;
    if (acreage >= 10) incomeScore += 5;
    if (acreage >= 40) incomeScore += 3;
    incomeScore = Math.min(94, incomeScore);

    const developmentEase = Math.round((waterScore + accessScore + utilityScore) / 3);
    const opportunity = Math.round((waterScore * .22) + (accessScore * .16) + (utilityScore * .10) + (fundingScore * .27) + (incomeScore * .25));
    const decision = opportunity >= 82 ? 'STRONG CANDIDATE' : opportunity >= 70 ? 'NEGOTIATE / VERIFY' : 'RESEARCH BEFORE OFFER';

    const bestStructure = sellerFinancing && downPct < 20
      ? 'Lead with seller financing, then stack eligible program or lender financing around the project.'
      : downPct >= 20
        ? 'Conventional or specialty land financing is more realistic; still compare seller-carry terms.'
        : 'Preserve cash and search for owner-carry, low-down and program-supported structures rather than forcing a weak loan.';

    const waterPlan = water === 'Unknown'
      ? 'Water is the first gating item. Verify legal supply before treating the parcel as buildable or productive.'
      : water === 'Haul / storage plan'
        ? 'Model hauled-water cost and storage, then compare well feasibility, rain capture and supplemental AWG where climate and economics justify it.'
        : 'Verify source capacity, legal rights and drought reliability, then size storage and any supplemental AWG strategy.';

    return { purchase, availableCash, acreage, downPct, financingNeed, waterScore, accessScore, utilityScore, fundingScore, incomeScore, developmentEase, opportunity, decision, bestStructure, waterPlan };
  }, [budget, cash, acres, water, access, utilities, sellerFinancing, projectUse]);

  const money = (value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);

  return (
    <main style={{ minHeight: '100vh', background: '#F2EFE6', color: '#171717', fontFamily: 'Arial, sans-serif' }}>
      <header style={{ background: '#10271C', color: '#fff', padding: '26px 20px 58px' }}>
        <div style={{ maxWidth: 1180, margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ color: '#BFE79F', fontWeight: 950, fontSize: 12, letterSpacing: 1.1 }}>ARIDON · LAND INTELLIGENCE</div>
            <div style={{ display: 'flex', gap: 9, flexWrap: 'wrap' }}>
              <Link href="/property-intelligence" style={darkLink}>Property Hunter</Link>
              <Link href="/property-intelligence/sources" style={darkLink}>Public Sources</Link>
              <Link href="/ag" style={darkLink}>Aridon Ag</Link>
            </div>
          </div>
          <h1 style={{ fontSize: 'clamp(44px,7vw,78px)', lineHeight: .94, letterSpacing: -3, margin: '18px 0 18px', maxWidth: 1000 }}>Find the land. Verify it. Fund it. Build the deal.</h1>
          <p style={{ color: '#D7E6DB', fontSize: 19, lineHeight: 1.65, maxWidth: 900 }}>
            Aridon combines land search logic, parcel due diligence, water intelligence, project economics and financing paths into one acquisition workflow. It hunts for possibilities, but it does not promise zero-down financing or grant awards.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 20 }}>
            {['Listed + off-market', 'Land score', 'Water security', 'Funding paths', 'Due diligence', 'Income uses', 'Deal structure', 'Watchlists'].map((item) => <span key={item} style={chip}>{item}</span>)}
          </div>
        </div>
      </header>

      <section style={{ maxWidth: 1180, margin: '-26px auto 0', padding: '0 20px 10px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,350px),1fr))', gap: 14 }}>
          <article style={card}>
            <div style={eyebrow}>60-SECOND LAND PROFILE</div>
            <h2 style={{ fontSize: 30, margin: '8px 0 16px' }}>What are you trying to buy?</h2>
            <Field label="Market"><select style={input} value={market} onChange={(event) => setMarket(event.target.value)}>{markets.map((item) => <option key={item}>{item}</option>)}</select></Field>
            <Field label="Target acres"><input style={input} value={acres} onChange={(event) => setAcres(event.target.value)} inputMode="decimal" /></Field>
            <Field label="Intended use"><select style={input} value={projectUse} onChange={(event) => setProjectUse(event.target.value)}>{uses.map((item) => <option key={item}>{item}</option>)}</select></Field>
            <Field label="Purchase budget"><input style={input} value={budget} onChange={(event) => setBudget(event.target.value)} inputMode="numeric" /></Field>
            <Field label="Cash available for acquisition"><input style={input} value={cash} onChange={(event) => setCash(event.target.value)} inputMode="numeric" /></Field>
            <button onClick={() => setSellerFinancing((value) => !value)} style={{ ...toggle, background: sellerFinancing ? '#E6F5DF' : '#F4F1EA', borderColor: sellerFinancing ? '#77A967' : '#D5CEC1' }}>{sellerFinancing ? '✓ Include seller-financing opportunities' : '+ Include seller-financing opportunities'}</button>
          </article>

          <article style={card}>
            <div style={eyebrow}>PASTE A PROPERTY</div>
            <h2 style={{ fontSize: 30, margin: '8px 0 12px' }}>Turn a listing into a research file.</h2>
            <p style={{ color: '#625E55', lineHeight: 1.6, fontSize: 14 }}>Paste a listing URL, street address, APN or legal description. Aridon uses it as the anchor for parcel-specific due diligence and source-backed outreach questions.</p>
            <textarea value={propertyRef} onChange={(event) => setPropertyRef(event.target.value)} placeholder="Listing URL, address, APN or legal description" style={{ ...input, minHeight: 104, resize: 'vertical' }} />
            <div style={{ display: 'grid', gap: 10, marginTop: 16 }}>
              <Field label="Water"><select style={input} value={water} onChange={(event) => setWater(event.target.value)}><option>Unknown</option><option>Well / verified source</option><option>Public / community water</option><option>Haul / storage plan</option></select></Field>
              <Field label="Access"><select style={input} value={access} onChange={(event) => setAccess(event.target.value)}><option>Unknown</option><option>Recorded paved access</option><option>Recorded unpaved access</option><option>Private / easement</option></select></Field>
              <Field label="Utilities"><select style={input} value={utilities} onChange={(event) => setUtilities(event.target.value)}><option>Unknown</option><option>At property</option><option>Nearby</option><option>Off-grid planned</option></select></Field>
            </div>
            <button onClick={() => setPlanGenerated(true)} style={primaryButton}>Build My Land Deal Plan →</button>
            <div style={{ marginTop: 10, fontSize: 12, color: '#746E64', lineHeight: 1.45 }}>This first-pass score uses your inputs. Parcel facts still require source verification before an offer.</div>
          </article>
        </div>
      </section>

      <section style={{ maxWidth: 1180, margin: '0 auto', padding: '34px 20px 8px' }}>
        <div style={eyebrow}>ARIDON LAND SCORE</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(250px,.8fr) minmax(300px,1.6fr)', gap: 14, marginTop: 10 }}>
          <article style={{ ...card, background: '#111A15', color: '#fff', borderColor: '#253A2D' }}>
            <div style={{ color: '#BFE79F', fontSize: 12, fontWeight: 950 }}>{planGenerated ? 'CURRENT DEAL PLAN' : 'LIVE PREVIEW'}</div>
            <div style={{ fontSize: 82, fontWeight: 950, lineHeight: 1, marginTop: 12 }}>{analysis.opportunity}</div>
            <div style={{ color: '#BFE79F', fontWeight: 950, marginTop: 8 }}>{analysis.decision}</div>
            <div style={{ marginTop: 18, color: '#C7D6CC', lineHeight: 1.6, fontSize: 14 }}>{market} · {analysis.acreage || '—'} acres · {projectUse}</div>
            {propertyRef && <div style={{ marginTop: 12, padding: 11, background: '#18251D', borderRadius: 10, fontSize: 12, lineHeight: 1.45, wordBreak: 'break-word' }}><strong>Property anchor:</strong><br />{propertyRef}</div>}
          </article>

          <article style={card}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(135px,1fr))', gap: 10 }}>
              <Score label="Water security" value={analysis.waterScore} />
              <Score label="Access" value={analysis.accessScore} />
              <Score label="Utilities" value={analysis.utilityScore} />
              <Score label="Funding fit" value={analysis.fundingScore} />
              <Score label="Income potential" value={analysis.incomeScore} />
              <Score label="Development ease" value={analysis.developmentEase} />
            </div>
            <div style={{ borderTop: '1px solid #E3DDD2', marginTop: 18, paddingTop: 16, display: 'grid', gap: 10 }}>
              <Line label="Target price" value={money(analysis.purchase)} />
              <Line label="Cash available" value={money(analysis.availableCash)} />
              <Line label="Implied cash percentage" value={`${analysis.downPct.toFixed(1)}%`} />
              <Line label="Financing / capital need" value={money(analysis.financingNeed)} />
            </div>
          </article>
        </div>
      </section>

      <section style={{ maxWidth: 1180, margin: '0 auto', padding: '34px 20px 8px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: 14 }}>
          <article style={card}>
            <div style={eyebrow}>BEST STRUCTURE</div>
            <h2 style={{ fontSize: 28, margin: '8px 0 10px' }}>How Aridon would attack the financing.</h2>
            <p style={{ color: '#5E5A51', lineHeight: 1.65 }}>{analysis.bestStructure}</p>
            <div style={{ marginTop: 14, padding: 14, borderRadius: 12, background: '#FFF4D6', border: '1px solid #E4CA82', color: '#654F17', fontSize: 13, lineHeight: 1.55 }}>Aridon should search for low-down or zero-down structures when available, never advertise them as guaranteed.</div>
          </article>
          <article style={card}>
            <div style={eyebrow}>WATER STRATEGY</div>
            <h2 style={{ fontSize: 28, margin: '8px 0 10px' }}>Make water a purchase condition.</h2>
            <p style={{ color: '#5E5A51', lineHeight: 1.65 }}>{analysis.waterPlan}</p>
            <div style={{ marginTop: 14, padding: 14, borderRadius: 12, background: '#EAF4F5', border: '1px solid #B9D6D9', color: '#284E52', fontSize: 13, lineHeight: 1.55 }}>For Aridon Ag projects, the property file can feed irrigation demand, storage sizing, drought risk and AWG supplemental-water modeling.</div>
          </article>
        </div>
      </section>

      <section style={{ maxWidth: 1180, margin: '0 auto', padding: '42px 20px 8px' }}>
        <div style={eyebrow}>FUNDING FINDER</div>
        <h2 style={{ fontSize: 'clamp(34px,5vw,50px)', margin: '8px 0 18px', letterSpacing: -1.3 }}>Search every realistic capital lane, then prove eligibility.</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: 10 }}>
          {fundingPaths.map(([title, text]) => <article key={title} style={card}><h3 style={{ margin: '0 0 7px', fontSize: 21 }}>{title}</h3><p style={{ margin: 0, color: '#625E55', lineHeight: 1.6, fontSize: 14 }}>{text}</p></article>)}
        </div>
      </section>

      <section style={{ maxWidth: 1180, margin: '0 auto', padding: '42px 20px 8px' }}>
        <div style={eyebrow}>AUTOMATIC DUE DILIGENCE</div>
        <h2 style={{ fontSize: 'clamp(34px,5vw,50px)', margin: '8px 0 18px', letterSpacing: -1.3 }}>The questions Aridon should answer before money moves.</h2>
        <div style={{ display: 'grid', gap: 9 }}>
          {dueDiligence.map(([title, source, text], index) => (
            <article key={title} style={{ ...card, display: 'grid', gridTemplateColumns: '44px minmax(180px,.7fr) minmax(180px,.8fr) minmax(260px,1.4fr)', gap: 12, alignItems: 'center' }}>
              <div style={{ width: 36, height: 36, borderRadius: 999, background: index < 3 ? '#E5F1DD' : '#F0EEE8', display: 'grid', placeItems: 'center', fontWeight: 950 }}>{index + 1}</div>
              <div><div style={{ fontWeight: 950 }}>{title}</div><div style={{ color: propertyRef || index > 0 ? '#956A10' : '#B13E2E', fontSize: 11, fontWeight: 900, marginTop: 4 }}>{propertyRef || index > 0 ? 'VERIFY' : 'NEEDS PROPERTY ANCHOR'}</div></div>
              <div style={{ color: '#1C6A50', fontSize: 12, fontWeight: 900 }}>{source}</div>
              <div style={{ color: '#625E55', lineHeight: 1.5, fontSize: 13 }}>{text}</div>
            </article>
          ))}
        </div>
      </section>

      <section style={{ maxWidth: 1180, margin: '0 auto', padding: '42px 20px 70px' }}>
        <div style={eyebrow}>THE ARIDON LAND LOOP</div>
        <h2 style={{ fontSize: 'clamp(34px,5vw,50px)', margin: '8px 0 18px', letterSpacing: -1.3 }}>From “I want land” to an owner-approved acquisition.</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(210px,1fr))', gap: 10 }}>
          {[
            ['01', 'Find', 'Listed, distressed, auction, tax-sale, owner-financed and off-market candidates.'],
            ['02', 'Score', 'Price, water, access, zoning, utilities, income uses, funding fit and risk.'],
            ['03', 'Verify', 'Tie every important claim to parcel, county, title, utility or program evidence.'],
            ['04', 'Fund', 'Compare seller carry, lenders, USDA/FSA, rural, conservation and state programs.'],
            ['05', 'Negotiate', 'Build a price, terms, contingencies and document-request strategy.'],
            ['06', 'Monitor', 'Keep watchlists alive as listings, taxes, grants, owners and public records change.'],
          ].map(([number, title, text]) => <article key={title} style={card}><div style={eyebrow}>{number}</div><h3 style={{ fontSize: 21, margin: '8px 0 6px' }}>{title}</h3><p style={{ margin: 0, color: '#625E55', lineHeight: 1.6, fontSize: 14 }}>{text}</p></article>)}
        </div>
      </section>
    </main>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label style={{ display: 'block', marginBottom: 13 }}><span style={{ display: 'block', fontSize: 12, fontWeight: 900, marginBottom: 6 }}>{label}</span>{children}</label>;
}

function Score({ label, value }: { label: string; value: number }) {
  return <div style={{ background: '#F7F5EF', border: '1px solid #DDD7CC', borderRadius: 13, padding: 12 }}><div style={{ color: '#706A61', fontSize: 10, fontWeight: 900 }}>{label}</div><div style={{ fontSize: 28, fontWeight: 950, marginTop: 4 }}>{value}</div></div>;
}

function Line({ label, value }: { label: string; value: string }) {
  return <div style={{ display: 'flex', justifyContent: 'space-between', gap: 14, fontSize: 14 }}><span style={{ color: '#706A61' }}>{label}</span><strong>{value}</strong></div>;
}

const card = { background: '#fff', border: '1px solid #D4CEC2', borderRadius: 18, padding: 20, boxShadow: '0 10px 28px rgba(31,24,15,.05)' } as const;
const eyebrow = { color: '#1C6A50', fontSize: 11, fontWeight: 950, letterSpacing: 1.05 } as const;
const input = { width: '100%', boxSizing: 'border-box', border: '1px solid #CFC9BE', borderRadius: 10, padding: '11px 12px', background: '#fff', color: '#171717', fontWeight: 750, fontSize: 14 } as const;
const primaryButton = { width: '100%', marginTop: 16, border: 0, borderRadius: 12, padding: '14px 15px', background: '#173B29', color: '#fff', fontWeight: 950, fontSize: 15, cursor: 'pointer' } as const;
const toggle = { width: '100%', textAlign: 'left', border: '1px solid #D5CEC1', borderRadius: 11, padding: '12px 13px', color: '#203027', fontWeight: 900, cursor: 'pointer' } as const;
const chip = { background: '#183829', border: '1px solid #315340', color: '#EAF4ED', borderRadius: 999, padding: '8px 10px', fontSize: 11, fontWeight: 850 } as const;
const darkLink = { color: '#EAF4ED', textDecoration: 'none', border: '1px solid #3B5A47', borderRadius: 10, padding: '8px 10px', fontSize: 12, fontWeight: 900 } as const;
