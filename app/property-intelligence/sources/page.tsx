import Link from 'next/link';
import { PROPERTY_SOURCE_LANES, US_STATES } from '../../../lib/propertySourceDiscovery';

const priorityOrder = { critical: 0, high: 1, normal: 2 } as const;

export default function PropertySourceCoveragePage() {
  const lanes = [...PROPERTY_SOURCE_LANES].sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  return (
    <main style={{ minHeight: '100vh', background: '#F3F0E8', color: '#171717', fontFamily: 'Arial, sans-serif' }}>
      <header style={{ background: '#07101D', color: '#fff', padding: '28px 20px 56px' }}>
        <div style={{ maxWidth: 1180, margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
            <div>
              <div style={{ color: '#9EF0CF', fontSize: 12, fontWeight: 950, letterSpacing: 1.1 }}>ARIDON · NATIONWIDE PROPERTY WATCH</div>
              <h1 style={{ fontSize: 'clamp(40px,6vw,68px)', lineHeight: .98, letterSpacing: -2.5, margin: '12px 0 12px', maxWidth: 980 }}>Every public county, court and distress list Aridon can find.</h1>
              <p style={{ maxWidth: 900, color: '#C4CEDC', fontSize: 18, lineHeight: 1.6 }}>
                The morning sweep discovers official sources, rechecks known sources, records gaps and promotes only real parcel-backed leads. Counties that do not publish a usable list stay marked as unavailable instead of being silently skipped.
              </p>
            </div>
            <Link href="/property-intelligence" style={{ color: '#07101D', background: '#9EF0CF', textDecoration: 'none', borderRadius: 12, padding: '12px 14px', fontWeight: 950 }}>← Property Intelligence</Link>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(210px,1fr))', gap: 10, marginTop: 24 }}>
            <Metric title="States" value="50" sub="Nationwide discovery enabled" />
            <Metric title="Source lanes" value={String(lanes.length)} sub="Tax, courts, code, REO and more" />
            <Metric title="Morning mode" value="Daily" sub="New + changed sources and leads" />
            <Metric title="Truth filter" value="ON" sub="Parcel/address before promotion" />
          </div>
        </div>
      </header>

      <section style={{ maxWidth: 1180, margin: '0 auto', padding: '28px 20px 8px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: 14 }}>
          <article style={card}>
            <div style={eyebrow}>MORNING SWEEP</div>
            <h2 style={{ fontSize: 30, margin: '8px 0 12px' }}>What gets checked</h2>
            <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 1.9, color: '#5D594F' }}>
              <li>County treasurer / tax collector delinquent lists and tax sales</li>
              <li>Sheriff, trustee and foreclosure auction lists</li>
              <li>District, circuit, county and probate court notices</li>
              <li>Vacant-property, nuisance, condemned and demolition lists</li>
              <li>Land banks, redevelopment authorities and municipal inventories</li>
              <li>Assessor, recorder and clerk ownership / notice sources</li>
              <li>HUD, USDA, Fannie Mae, Freddie Mac and bank REO inventories</li>
            </ul>
          </article>
          <article style={{ ...card, background: '#101827', color: '#fff', borderColor: '#2A3950' }}>
            <div style={{ ...eyebrow, color: '#9EF0CF' }}>SOURCE COVERAGE RULE</div>
            <h2 style={{ fontSize: 30, margin: '8px 0 12px' }}>No county gets a fake green check.</h2>
            <p style={{ color: '#C4CEDC', lineHeight: 1.7 }}>
              A jurisdiction is only counted as covered after Aridon finds a usable public source. If a source is blocked, login-only, paywalled, not published or has no machine-readable list, that gap is recorded and alternate public sources are searched.
            </p>
            <div style={{ marginTop: 16, borderTop: '1px solid #33445E', paddingTop: 14, color: '#AEB9C9', fontSize: 13, lineHeight: 1.65 }}>
              High-value leads are promoted when an address or parcel can be tied to source-backed distress evidence. Multi-source matches rank above single-source clues.
            </div>
          </article>
        </div>
      </section>

      <section style={{ maxWidth: 1180, margin: '0 auto', padding: '38px 20px 10px' }}>
        <div style={eyebrow}>OFFICIAL SOURCE LANES</div>
        <h2 style={{ fontSize: 38, margin: '7px 0 18px' }}>The places Aridon hunts every morning.</h2>
        <div style={{ display: 'grid', gap: 10 }}>
          {lanes.map((lane) => (
            <article key={lane.sourceType} style={{ ...card, display: 'grid', gridTemplateColumns: 'minmax(210px,.9fr) minmax(260px,1.2fr) minmax(260px,1.4fr)', gap: 14, alignItems: 'start' }}>
              <div>
                <span style={{ display: 'inline-block', borderRadius: 999, padding: '5px 8px', background: lane.priority === 'critical' ? '#FFE3D8' : lane.priority === 'high' ? '#FFF0C9' : '#E9EEF6', fontSize: 10, fontWeight: 950, textTransform: 'uppercase' }}>{lane.priority}</span>
                <h3 style={{ margin: '8px 0 0', fontSize: 20 }}>{lane.label}</h3>
              </div>
              <div><div style={smallLabel}>AGENCIES</div><div style={{ color: '#5D594F', lineHeight: 1.55 }}>{lane.agencies.join(' · ')}</div></div>
              <div><div style={smallLabel}>DISCOVERY TERMS</div><div style={{ color: '#5D594F', lineHeight: 1.55 }}>{lane.searchTerms.join(' · ')}</div></div>
            </article>
          ))}
        </div>
      </section>

      <section style={{ maxWidth: 1180, margin: '0 auto', padding: '44px 20px 70px' }}>
        <div style={eyebrow}>50-STATE SOURCE DISCOVERY</div>
        <h2 style={{ fontSize: 38, margin: '7px 0 18px' }}>Every state stays in the hunt.</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(90px,1fr))', gap: 8 }}>
          {US_STATES.map((state) => (
            <div key={state} style={{ background: '#fff', border: '1px solid #D4CEC2', borderRadius: 12, padding: '12px 8px', textAlign: 'center' }}>
              <div style={{ fontSize: 17, fontWeight: 950 }}>{state}</div>
              <div style={{ marginTop: 3, fontSize: 10, color: '#1C6A50', fontWeight: 900 }}>DISCOVERY ON</div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 18, background: '#FFF7DD', border: '1px solid #E3CD86', borderRadius: 14, padding: 15, lineHeight: 1.6, fontSize: 13, color: '#67551D' }}>
          “Discovery on” means the state is included in the source-finding loop. It does not mean every county publishes every dataset. The coverage registry should distinguish found, changed, unavailable, blocked and not-published sources.
        </div>
      </section>
    </main>
  );
}

function Metric({ title, value, sub }: { title: string; value: string; sub: string }) {
  return <div style={{ background: '#0E1B2E', border: '1px solid #293D5A', borderRadius: 14, padding: 15 }}><div style={{ color: '#AAB6C8', fontSize: 11, fontWeight: 900 }}>{title}</div><div style={{ color: '#fff', fontSize: 30, fontWeight: 950, marginTop: 4 }}>{value}</div><div style={{ color: '#9EF0CF', fontSize: 11, marginTop: 3 }}>{sub}</div></div>;
}

const card = { background: '#fff', border: '1px solid #D4CEC2', borderRadius: 18, padding: 20, boxShadow: '0 10px 28px rgba(31,24,15,.05)' };
const eyebrow = { color: '#1C6A50', fontSize: 11, fontWeight: 950, letterSpacing: 1.05 };
const smallLabel = { fontSize: 10, fontWeight: 950, color: '#1C6A50', letterSpacing: .8, marginBottom: 5 };
