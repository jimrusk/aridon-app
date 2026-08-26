'use client';

import { useMemo, useState } from 'react';

const signals = [
  'Vacant / abandoned',
  'Tax delinquent',
  'Code violations',
  'Foreclosure / pre-foreclosure',
  'Probate / inherited',
  'Absentee owner',
  'Long-term ownership',
  'Utility shutoff / vacancy indicators',
  'Fire / storm damage',
  'For-sale-by-owner / stale listing',
];

const workflow = [
  ['01', 'Discover', 'Scan public records, listings, county data, notices and source-backed web results for distress signals.'],
  ['02', 'Verify', 'Confirm a real parcel/address, ownership evidence and at least one primary or reliable secondary source.'],
  ['03', 'Score', 'Rank motivation, equity potential, condition risk, legal complexity, location and confidence from 0–100.'],
  ['04', 'Underwrite', 'Estimate acquisition range, rehab risk, resale/rent pathways and the questions that must be answered next.'],
  ['05', 'Pursue', 'Add to watchlist, prepare respectful owner outreach and move the property into an approval-gated acquisition pipeline.'],
  ['06', 'Monitor', 'Recheck high-potential leads as public records, listings, taxes and ownership signals change.'],
];

const demoLeads = [
  {
    label: 'DEMO LEAD A',
    market: 'Rural / small-city target',
    score: 91,
    status: 'Needs address verification',
    evidence: 'Multiple distress signals, long ownership, apparent vacancy.',
    next: 'Confirm parcel + owner before outreach.',
  },
  {
    label: 'DEMO LEAD B',
    market: 'Mountain / recreation market',
    score: 82,
    status: 'Source review required',
    evidence: 'Stale property signal plus possible deferred maintenance.',
    next: 'Check assessor, tax status, liens and current occupancy.',
  },
  {
    label: 'DEMO LEAD C',
    market: 'Sun Belt growth market',
    score: 77,
    status: 'Watchlist',
    evidence: 'Absentee-owner pattern with potential value-add angle.',
    next: 'Monitor for tax, listing or code-enforcement changes.',
  },
];

export default function PropertyIntelligencePage() {
  const [state, setState] = useState('Nationwide');
  const [minimumScore, setMinimumScore] = useState(75);
  const [selected, setSelected] = useState<string[]>(['Vacant / abandoned', 'Tax delinquent', 'Code violations']);
  const [strictVerification, setStrictVerification] = useState(true);

  const querySummary = useMemo(() => {
    const active = selected.length ? selected.join(', ') : 'all distress signals';
    return `${state} · score ${minimumScore}+ · ${active}`;
  }, [state, minimumScore, selected]);

  function toggleSignal(signal: string) {
    setSelected((current) => current.includes(signal) ? current.filter((item) => item !== signal) : [...current, signal]);
  }

  return (
    <main style={{ minHeight: '100vh', background: '#F2EFE6', color: '#151515', fontFamily: 'Arial, sans-serif' }}>
      <section style={{ background: '#07101D', color: '#F8FAFC', padding: '30px 20px 66px' }}>
        <div style={{ maxWidth: 1180, margin: '0 auto' }}>
          <div style={{ color: '#9EF0CF', fontSize: 12, fontWeight: 950, letterSpacing: 1.2 }}>ARIDON · PROPERTY INTELLIGENCE</div>
          <h1 style={{ fontSize: 'clamp(44px,7vw,78px)', lineHeight: .94, letterSpacing: -3, margin: '14px 0 18px', maxWidth: 980 }}>Find the property before everybody else sees the deal.</h1>
          <p style={{ color: '#BCC8D8', fontSize: 19, lineHeight: 1.65, maxWidth: 900 }}>
            A nationwide distressed-property hunter for abandoned homes, tax problems, code issues, probate, foreclosure risk, absentee owners and other motivated-seller signals. Aridon separates discovery from verification so an AI-generated social post never gets mistaken for a real property.
          </p>
          <div style={{ display: 'flex', gap: 9, flexWrap: 'wrap', marginTop: 22 }}>
            {['Nationwide scanning', 'Evidence status', '0–100 deal score', 'Owner-path research', 'Daily watchlist', 'Approval-gated outreach'].map((item) => (
              <span key={item} style={{ background: '#0E1B2E', border: '1px solid #2C405F', padding: '8px 11px', borderRadius: 999, fontSize: 12, fontWeight: 850 }}>{item}</span>
            ))}
          </div>
        </div>
      </section>

      <section style={{ maxWidth: 1180, margin: '0 auto', padding: '28px 20px 10px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,340px),1fr))', gap: 14 }}>
          <article style={card}>
            <div style={eyebrow}>HUNT PROFILE</div>
            <h2 style={{ margin: '8px 0 16px', fontSize: 30 }}>Tell Aridon what to hunt.</h2>
            <label style={label}>Geography</label>
            <select value={state} onChange={(event) => setState(event.target.value)} style={input}>
              <option>Nationwide</option><option>New Mexico</option><option>Arizona</option><option>Texas</option><option>Colorado</option><option>Utah</option><option>Nevada</option><option>California</option><option>Florida</option>
            </select>
            <label style={{ ...label, marginTop: 18 }}>Minimum opportunity score: <strong>{minimumScore}</strong></label>
            <input type="range" min="50" max="95" step="1" value={minimumScore} onChange={(event) => setMinimumScore(Number(event.target.value))} style={{ width: '100%' }} />
            <div style={{ marginTop: 15, padding: 12, background: '#F6F8FB', borderRadius: 12, fontSize: 13, lineHeight: 1.5 }}><strong>Active hunt:</strong><br />{querySummary}</div>
          </article>

          <article style={card}>
            <div style={eyebrow}>DISTRESS SIGNALS</div>
            <h2 style={{ margin: '8px 0 14px', fontSize: 30 }}>Stack the clues.</h2>
            <div style={{ display: 'grid', gap: 7 }}>
              {signals.map((signal) => (
                <button key={signal} onClick={() => toggleSignal(signal)} style={{ textAlign: 'left', border: selected.includes(signal) ? '1px solid #1E6C51' : '1px solid #D6D0C5', background: selected.includes(signal) ? '#E6F6EF' : '#fff', borderRadius: 10, padding: '10px 11px', cursor: 'pointer', fontWeight: 800 }}>
                  {selected.includes(signal) ? '✓ ' : '+ '}{signal}
                </button>
              ))}
            </div>
          </article>

          <article style={{ ...card, background: '#101827', color: '#F8FAFC', borderColor: '#26354D' }}>
            <div style={{ ...eyebrow, color: '#9EF0CF' }}>TRUTH FILTER</div>
            <h2 style={{ margin: '8px 0 12px', fontSize: 30 }}>No ghost houses.</h2>
            <p style={{ color: '#C4CEDC', lineHeight: 1.65, fontSize: 15 }}>Social-media images, AI imagery and reposted stories can start a search, but they do not count as verified property evidence.</p>
            <button onClick={() => setStrictVerification((value) => !value)} style={{ width: '100%', marginTop: 10, background: strictVerification ? '#9EF0CF' : '#26354D', color: strictVerification ? '#07130F' : '#fff', border: 0, borderRadius: 12, padding: '13px 14px', fontWeight: 950, cursor: 'pointer' }}>
              {strictVerification ? '✓ Strict verification ON' : 'Strict verification OFF'}
            </button>
            <div style={{ marginTop: 14, borderTop: '1px solid #2D3A50', paddingTop: 14, color: '#AEB9C9', fontSize: 13, lineHeight: 1.6 }}>
              Promote a lead only after Aridon can tie it to a real parcel/address and source trail. Owner contact data should come from lawful sources and outreach remains human-approved.
            </div>
          </article>
        </div>
      </section>

      <section style={{ maxWidth: 1180, margin: '0 auto', padding: '40px 20px 10px' }}>
        <div style={eyebrow}>THE HUNTING LOOP</div>
        <h2 style={{ fontSize: 'clamp(34px,5vw,52px)', margin: '8px 0 20px', letterSpacing: -1.5 }}>From strange-looking house to qualified acquisition lead.</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(250px,1fr))', gap: 10 }}>
          {workflow.map(([number, title, text]) => (
            <article key={title} style={card}><div style={{ fontSize: 12, fontWeight: 950, color: '#1C6A50' }}>{number}</div><h3 style={{ margin: '8px 0 6px', fontSize: 21 }}>{title}</h3><p style={{ margin: 0, lineHeight: 1.6, color: '#625E55', fontSize: 14 }}>{text}</p></article>
          ))}
        </div>
      </section>

      <section style={{ maxWidth: 1180, margin: '0 auto', padding: '46px 20px 72px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', alignItems: 'end' }}>
          <div><div style={eyebrow}>DEAL BOARD</div><h2 style={{ fontSize: 38, margin: '8px 0 0' }}>What Eva should surface each morning.</h2></div>
          <span style={{ fontSize: 12, background: '#FFF0C9', border: '1px solid #D8BF7E', borderRadius: 999, padding: '8px 11px', fontWeight: 900 }}>DEMO DATA · NOT REAL PROPERTIES</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 12, marginTop: 18 }}>
          {demoLeads.map((lead) => (
            <article key={lead.label} style={card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'start' }}><div><div style={eyebrow}>{lead.label}</div><h3 style={{ margin: '7px 0 2px', fontSize: 22 }}>{lead.market}</h3></div><span style={{ background: '#171717', color: '#fff', borderRadius: 12, padding: '8px 10px', fontWeight: 950 }}>{lead.score}</span></div>
              <div style={{ marginTop: 12, fontSize: 12, fontWeight: 900, color: '#855B0D' }}>{lead.status}</div>
              <p style={{ lineHeight: 1.55, color: '#5F5A52', fontSize: 14 }}>{lead.evidence}</p>
              <div style={{ paddingTop: 12, borderTop: '1px solid #E4DED3', fontSize: 13 }}><strong>Next:</strong> {lead.next}</div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}

const card = { background: '#fff', border: '1px solid #D4CEC2', borderRadius: 18, padding: 20, boxShadow: '0 10px 28px rgba(31,24,15,.05)' };
const eyebrow = { color: '#1C6A50', fontSize: 11, fontWeight: 950, letterSpacing: 1.05 };
const label = { display: 'block', fontSize: 12, fontWeight: 900, marginBottom: 7 };
const input = { width: '100%', border: '1px solid #CFC9BE', borderRadius: 10, padding: '11px 12px', background: '#fff', fontWeight: 750 };
