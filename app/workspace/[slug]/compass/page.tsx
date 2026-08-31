'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';

type Path = {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  strengths: string[];
  bestFor: string;
  caution: string;
};

const paths: Path[] = [
  {
    id: 'mhp', title: 'Manufactured Home Park', subtitle: 'Long-term housing + leased land',
    description: 'A community model centered on manufactured homes, recurring site rent and long-duration residents.',
    strengths: ['Recurring site-rent potential', 'Longer resident tenure can reduce turnover', 'Can serve affordable-housing demand', 'Resident-owned homes can reduce some unit maintenance exposure'],
    bestFor: 'Investors prioritizing durable occupancy and long-term cash flow.',
    caution: 'Verify zoning, utility infrastructure, deferred maintenance, resident-owned vs park-owned homes, rent rules and actual collections.'
  },
  {
    id: 'rv', title: 'RV Park', subtitle: 'Flexible short- and long-stay sites',
    description: 'A hospitality-influenced community with RV sites, variable stay lengths and potentially more dynamic pricing.',
    strengths: ['Multiple stay-length strategies', 'Potential seasonal or dynamic pricing', 'Traveler, worker and destination demand', 'Amenities may support pricing and retention'],
    bestFor: 'Operators comfortable with more active management and variable demand.',
    caution: 'Model seasonality, local tourism/workforce demand, utility costs, staffing, online reviews and occupancy by month rather than relying on headline averages.'
  },
  {
    id: 'combo', title: 'Manufactured Home + RV', subtitle: 'Combination community',
    description: 'A blended property combining longer-term manufactured-home residents with RV sites.',
    strengths: ['Diversified resident and guest mix', 'Multiple potential income streams', 'Can balance long- and shorter-duration demand', 'May improve utilization of suitable land'],
    bestFor: 'Investors seeking diversification within one community.',
    caution: 'Confirm that zoning, infrastructure, traffic flow and management systems work for both uses. Diversification does not automatically reduce risk.'
  },
  {
    id: 'tiny', title: 'Tiny Home / Park Model', subtitle: 'Compact housing communities',
    description: 'Smaller homes or park-model units organized around efficient land use and a distinct resident or guest experience.',
    strengths: ['Smaller unit footprints', 'Potentially efficient land use', 'Can target specific resident or hospitality niches', 'Flexible community positioning'],
    bestFor: 'Investors evaluating newer housing formats and carefully validated local demand.',
    caution: 'Definitions and codes vary sharply by jurisdiction. Verify zoning, HUD/RV classifications, foundations, financing, insurance and year-round occupancy rules.'
  }
];

export default function CompassPage({ params }: { params: { slug: string } }) {
  const [capital, setCapital] = useState('');
  const [management, setManagement] = useState('balanced');
  const [goal, setGoal] = useState('cashflow');
  const [selected, setSelected] = useState<string[]>([]);

  const recommendation = useMemo(() => {
    if (selected.length) return paths.filter((p) => selected.includes(p.id));
    if (management === 'active') return paths.filter((p) => p.id === 'rv' || p.id === 'combo');
    if (goal === 'innovation') return paths.filter((p) => p.id === 'tiny' || p.id === 'combo');
    return paths.filter((p) => p.id === 'mhp' || p.id === 'combo');
  }, [selected, management, goal]);

  function toggle(id: string) {
    setSelected((current) => current.includes(id) ? current.filter((x) => x !== id) : [...current, id]);
  }

  return <main style={page}>
    <div style={{ maxWidth: 1180, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div><div style={eyebrow}>ARIDON COMPASS · ALTERNATIVE HOUSING</div><h1 style={h1}>Which community model deserves a closer look?</h1></div>
        <Link href={`/workspace/${params.slug}`} style={back}>Company Home</Link>
      </div>
      <p style={lead}>Compare four alternative-housing strategies, then let Aridon turn your preferences into a diligence path. These are screening frameworks, not promises of returns.</p>

      <section style={grid}>
        {paths.map((p) => <button key={p.id} onClick={() => toggle(p.id)} style={{ ...card, borderColor: selected.includes(p.id) ? '#F4C84A' : 'rgba(255,255,255,.14)' }}>
          <div style={{ fontSize: 12, fontWeight: 900, color: '#F4C84A' }}>{p.subtitle.toUpperCase()}</div>
          <h2 style={{ margin: '8px 0', fontSize: 25 }}>{p.title}</h2>
          <p style={muted}>{p.description}</p>
          <ul style={{ textAlign: 'left', paddingLeft: 20, lineHeight: 1.55 }}>{p.strengths.map((x) => <li key={x}>{x}</li>)}</ul>
          <div style={best}><strong>Best fit:</strong> {p.bestFor}</div>
          <div style={caution}><strong>Verify:</strong> {p.caution}</div>
        </button>)}
      </section>

      <section style={panel}>
        <div style={eyebrow}>QUICK FIT</div><h2 style={{ fontSize: 30, margin: '7px 0 16px' }}>Give Aridon three signals.</h2>
        <div style={formGrid}>
          <label style={label}>Capital available for a deal<input value={capital} onChange={(e) => setCapital(e.target.value)} placeholder="Example: $250,000" style={input}/></label>
          <label style={label}>Management style<select value={management} onChange={(e) => setManagement(e.target.value)} style={input}><option value="passive">Prefer lower-touch</option><option value="balanced">Balanced</option><option value="active">Comfortable with active operations</option></select></label>
          <label style={label}>Primary goal<select value={goal} onChange={(e) => setGoal(e.target.value)} style={input}><option value="cashflow">Long-term cash flow</option><option value="diversification">Diversification</option><option value="innovation">Newer / growth-oriented model</option></select></label>
        </div>
        <div style={{ marginTop: 18, padding: 18, borderRadius: 14, background: '#111C32' }}><strong>Compass starting point:</strong> {recommendation.map((p) => p.title).join(' + ')}. {capital ? `Capital signal recorded: ${capital}. ` : ''}Next, Aridon should validate location, price, actual NOI, occupancy, utilities, zoning, debt terms, seller financing and downside scenarios before ranking a property.</div>
      </section>

      <section style={{ ...panel, background: '#EAF8F2', color: '#102019' }}><div style={{ fontWeight: 950 }}>PHONE-READY DESIGN</div><h2 style={{ fontSize: 30, margin: '7px 0' }}>The executive can conduct this same Compass by conversation.</h2><p style={{ lineHeight: 1.65 }}>A customer can answer these questions by voice in their preferred language. Aridon can confirm important numbers and facts, structure the answers, and prepare the same screening result. Saving customer records and consequential actions should require the appropriate confirmation and authorization.</p></section>
    </div>
  </main>;
}

const page = { minHeight: '100vh', background: '#07162B', color: '#F8FAFC', padding: '30px 18px 90px', fontFamily: 'Arial, sans-serif' };
const eyebrow = { color: '#F4C84A', fontSize: 12, fontWeight: 950, letterSpacing: 1 };
const h1 = { fontSize: 'clamp(38px,6vw,68px)', maxWidth: 850, lineHeight: 1, margin: '9px 0 12px' };
const lead = { maxWidth: 850, color: '#C8D3E4', fontSize: 18, lineHeight: 1.65 };
const grid = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(245px,1fr))', gap: 13, marginTop: 24 };
const card = { background: '#0D2340', color: '#F8FAFC', border: '2px solid', borderRadius: 20, padding: 20, cursor: 'pointer', font: 'inherit', textAlign: 'left' as const };
const muted = { color: '#C8D3E4', lineHeight: 1.55 };
const best = { marginTop: 14, borderTop: '1px solid rgba(255,255,255,.14)', paddingTop: 13, lineHeight: 1.5 };
const caution = { marginTop: 10, color: '#D8E0EC', fontSize: 13, lineHeight: 1.5 };
const panel = { marginTop: 18, padding: 24, borderRadius: 20, background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.12)' };
const formGrid = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 12 };
const label = { display: 'grid', gap: 7, fontWeight: 850 };
const input = { borderRadius: 10, padding: '12px 13px', border: '1px solid #52647D', background: '#F8FAFC', color: '#0B1020', fontSize: 15 };
const back = { color: '#F4C84A', textDecoration: 'none', fontWeight: 900, border: '1px solid #F4C84A', borderRadius: 10, padding: '10px 13px', height: 'fit-content' };
