'use client';

import { useMemo, useState } from 'react';

type Tab = 'command' | 'queue' | 'biomass' | 'workforce';

type Zone = {
  name: string;
  region: string;
  acres: number;
  wildfireRisk: number;
  exposure: number;
  waterValue: number;
  readiness: number;
  biomassValue: number;
  treatment: string;
};

const STATE_TARGET = 125000;
const REPORTED_TREATED = 22000;
const STATE_GAP = STATE_TARGET - REPORTED_TREATED;

const zones: Zone[] = [
  {
    name: 'San Juan Watershed WUI',
    region: 'Northwest New Mexico pilot',
    acres: 8400,
    wildfireRisk: 92,
    exposure: 86,
    waterValue: 94,
    readiness: 71,
    biomassValue: 68,
    treatment: 'Thin + pile/broadcast burn + defensible space',
  },
  {
    name: 'Navajo Lake Headwaters',
    region: 'Northwest New Mexico pilot',
    acres: 10200,
    wildfireRisk: 88,
    exposure: 61,
    waterValue: 96,
    readiness: 64,
    biomassValue: 72,
    treatment: 'Watershed thinning + prescribed fire + erosion prep',
  },
  {
    name: 'La Plata Corridor',
    region: 'Northwest New Mexico pilot',
    acres: 6200,
    wildfireRisk: 84,
    exposure: 74,
    waterValue: 81,
    readiness: 78,
    biomassValue: 63,
    treatment: 'Mechanical fuels reduction + roadside evacuation buffers',
  },
  {
    name: 'Four Corners Utility Corridor',
    region: 'Northwest New Mexico pilot',
    acres: 4700,
    wildfireRisk: 79,
    exposure: 91,
    waterValue: 66,
    readiness: 82,
    biomassValue: 52,
    treatment: 'Utility corridor fuels work + access + remote verification',
  },
  {
    name: 'Community Buffer Demonstration',
    region: 'Northwest New Mexico pilot',
    acres: 3100,
    wildfireRisk: 76,
    exposure: 95,
    waterValue: 58,
    readiness: 89,
    biomassValue: 45,
    treatment: 'Home ignition zone + community buffer + maintenance cycle',
  },
];

function priorityScore(zone: Zone) {
  return Math.round(
    zone.wildfireRisk * 0.3 +
      zone.exposure * 0.25 +
      zone.waterValue * 0.2 +
      zone.readiness * 0.15 +
      zone.biomassValue * 0.1
  );
}

function money(value: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
}

function number(value: number) {
  return new Intl.NumberFormat('en-US').format(Math.round(value));
}

function scoreLabel(score: number) {
  if (score >= 85) return 'Immediate';
  if (score >= 75) return 'High';
  return 'Planned';
}

const cardStyle: React.CSSProperties = {
  background: 'rgba(9, 20, 31, 0.88)',
  border: '1px solid rgba(255,255,255,.10)',
  borderRadius: 18,
  padding: 18,
  boxShadow: '0 16px 38px rgba(0,0,0,.22)',
};

export default function WildfireResilienceApp() {
  const [tab, setTab] = useState<Tab>('command');
  const [crews, setCrews] = useState(12);
  const [acresPerCrewMonth, setAcresPerCrewMonth] = useState(300);
  const [fieldMonths, setFieldMonths] = useState(9);
  const [tonsPerAcre, setTonsPerAcre] = useState(6);
  const [costPerAcre, setCostPerAcre] = useState(2200);

  const rankedZones = useMemo(
    () => [...zones].sort((a, b) => priorityScore(b) - priorityScore(a)),
    []
  );

  const pilotAcres = zones.reduce((sum, zone) => sum + zone.acres, 0);
  const annualCrewCapacity = crews * acresPerCrewMonth * fieldMonths;
  const crewEquivalentForGap = Math.ceil(STATE_GAP / (acresPerCrewMonth * fieldMonths));
  const pilotTons = pilotAcres * tonsPerAcre;
  const pilotTreatmentBudget = pilotAcres * costPerAcre;
  const treatedPercent = (REPORTED_TREATED / STATE_TARGET) * 100;

  const tabs: { key: Tab; label: string }[] = [
    { key: 'command', label: 'Command Center' },
    { key: 'queue', label: 'Treatment Queue' },
    { key: 'biomass', label: 'Biomass Network' },
    { key: 'workforce', label: 'Workforce + Funding' },
  ];

  return (
    <main
      style={{
        minHeight: '100vh',
        color: '#F4F7F1',
        background:
          'radial-gradient(circle at top right, rgba(201,111,40,.24), transparent 28%), radial-gradient(circle at 15% 20%, rgba(46,125,85,.24), transparent 28%), #07111A',
        fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif',
      }}
    >
      <div style={{ maxWidth: 1450, margin: '0 auto', padding: '28px 18px 70px' }}>
        <header
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1fr) auto',
            gap: 20,
            alignItems: 'start',
            marginBottom: 20,
          }}
        >
          <div>
            <div style={{ color: '#92D6AE', fontWeight: 900, letterSpacing: '.12em', fontSize: 12 }}>
              ARIDON WILDFIRE + WATERSHED RESILIENCE
            </div>
            <h1 style={{ margin: '8px 0 8px', fontSize: 'clamp(32px, 6vw, 66px)', lineHeight: .96 }}>
              Wildfire Resilience Grid
            </h1>
            <p style={{ maxWidth: 920, color: '#B8C5CB', fontSize: 17, lineHeight: 1.55, margin: 0 }}>
              One operating system for risk prioritization, treatment capacity, watershed protection, biomass routing,
              workforce, funding, and proof of completion.
            </p>
          </div>
          <div style={{ ...cardStyle, minWidth: 240, background: 'rgba(56,94,64,.35)' }}>
            <div style={{ color: '#B9D8C4', fontSize: 12, fontWeight: 800 }}>PILOT MODE</div>
            <div style={{ fontSize: 22, fontWeight: 900, marginTop: 5 }}>Northwest New Mexico</div>
            <div style={{ color: '#B8C5CB', fontSize: 13, marginTop: 4 }}>Planning prototype with sample zone inputs</div>
          </div>
        </header>

        <section
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
            gap: 12,
            marginBottom: 16,
          }}
        >
          <Metric label="Annual treatment target" value={number(STATE_TARGET)} suffix=" acres" />
          <Metric label="Reported treated" value={number(REPORTED_TREATED)} suffix=" acres" />
          <Metric label="Annual delivery gap" value={number(STATE_GAP)} suffix=" acres" emphasis />
          <Metric label="Pilot treatment queue" value={number(pilotAcres)} suffix=" acres" />
        </section>

        <section style={{ ...cardStyle, marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontWeight: 900, fontSize: 18 }}>Statewide delivery gap</div>
              <div style={{ color: '#AFC0C7', marginTop: 3 }}>The system treats wildfire resilience as an infrastructure production problem.</div>
            </div>
            <div style={{ fontWeight: 900, fontSize: 22 }}>{treatedPercent.toFixed(1)}% of annual target</div>
          </div>
          <div style={{ height: 14, background: '#172733', borderRadius: 999, marginTop: 14, overflow: 'hidden' }}>
            <div style={{ width: `${Math.min(100, treatedPercent)}%`, height: '100%', background: 'linear-gradient(90deg,#ECA34A,#77D6A3)' }} />
          </div>
        </section>

        <nav style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 10, marginBottom: 8 }}>
          {tabs.map((item) => (
            <button
              key={item.key}
              onClick={() => setTab(item.key)}
              style={{
                cursor: 'pointer',
                border: tab === item.key ? '1px solid #83D8AA' : '1px solid rgba(255,255,255,.10)',
                color: tab === item.key ? '#07111A' : '#EAF1F4',
                background: tab === item.key ? '#83D8AA' : '#0D1B26',
                borderRadius: 999,
                padding: '10px 14px',
                fontWeight: 900,
                whiteSpace: 'nowrap',
              }}
            >
              {item.label}
            </button>
          ))}
        </nav>

        {tab === 'command' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.35fr) minmax(300px,.65fr)', gap: 16 }}>
            <section style={cardStyle}>
              <SectionTitle eyebrow="INTERVENTION ENGINE" title="What the system recommends first" />
              <ActionRow rank="01" title="Protect water + people first" text="Rank treatments by fire probability, human exposure, watershed value, readiness, and biomass recovery potential." />
              <ActionRow rank="02" title="Build permanent regional capacity" text="Use year-round resilience crews plus private contractors, with shared equipment fleets to remove the equipment-capital bottleneck." />
              <ActionRow rank="03" title="Create biomass offtake before treatment starts" text="Pre-plan where logs, chips, slash, mulch, biochar feedstock, and erosion-control material will go so hauling does not become the choke point." />
              <ActionRow rank="04" title="Verify every treated acre" text="Attach before/after imagery, contractor, treatment prescription, biomass destination, cost, and re-treatment date to a digital treatment record." />
              <ActionRow rank="05" title="Run maintenance as a repeating cycle" text="Do not count an acre as permanently solved. Give every zone a next inspection and maintenance date." />
            </section>

            <aside style={{ display: 'grid', gap: 16 }}>
              <section style={cardStyle}>
                <SectionTitle eyebrow="DELIVERY CAPACITY" title="Crew scenario" />
                <RangeControl label="Dedicated crews" value={crews} min={1} max={80} step={1} onChange={setCrews} />
                <RangeControl label="Acres / crew / month" value={acresPerCrewMonth} min={100} max={700} step={25} onChange={setAcresPerCrewMonth} />
                <RangeControl label="Field months / year" value={fieldMonths} min={4} max={12} step={1} onChange={setFieldMonths} />
                <div style={{ borderTop: '1px solid rgba(255,255,255,.1)', marginTop: 14, paddingTop: 14 }}>
                  <div style={{ color: '#AFC0C7', fontSize: 13 }}>Annual crew capacity</div>
                  <div style={{ fontSize: 30, fontWeight: 950 }}>{number(annualCrewCapacity)} acres</div>
                  <div style={{ color: '#AFC0C7', fontSize: 13, marginTop: 8 }}>
                    Crew-equivalent needed to close the current annual gap under this productivity assumption: <strong style={{ color: '#fff' }}>{crewEquivalentForGap}</strong>.
                  </div>
                </div>
              </section>

              <section style={{ ...cardStyle, background: 'linear-gradient(145deg, rgba(120,64,28,.65), rgba(20,43,34,.85))' }}>
                <div style={{ color: '#F5C98E', fontWeight: 900, fontSize: 12 }}>DECISION RULE</div>
                <div style={{ fontSize: 26, fontWeight: 950, marginTop: 8 }}>Do not ask “how many acres?” first.</div>
                <p style={{ color: '#E2E8E5', lineHeight: 1.55, marginBottom: 0 }}>
                  Ask which investment prevents the largest probable loss across people, water, power, roads, structures, and ecosystems.
                </p>
              </section>
            </aside>
          </div>
        )}

        {tab === 'queue' && (
          <section style={cardStyle}>
            <SectionTitle eyebrow="PRIORITY ENGINE" title="Northwest New Mexico treatment queue" />
            <p style={{ color: '#AFC0C7', marginTop: -4, marginBottom: 18 }}>
              Scores are prototype planning inputs, not live fire-risk determinations. Replace them with authoritative GIS and incident data in production.
            </p>
            <div style={{ display: 'grid', gap: 10 }}>
              {rankedZones.map((zone, index) => {
                const score = priorityScore(zone);
                return (
                  <div
                    key={zone.name}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '54px minmax(220px,1.1fr) minmax(230px,1fr) 110px 120px',
                      gap: 12,
                      alignItems: 'center',
                      background: '#0B1822',
                      border: '1px solid rgba(255,255,255,.08)',
                      borderRadius: 14,
                      padding: 14,
                    }}
                  >
                    <div style={{ width: 42, height: 42, borderRadius: 12, display: 'grid', placeItems: 'center', background: '#17372B', fontWeight: 950 }}>{index + 1}</div>
                    <div>
                      <div style={{ fontWeight: 950, fontSize: 17 }}>{zone.name}</div>
                      <div style={{ color: '#91A5AE', fontSize: 12 }}>{zone.region}</div>
                    </div>
                    <div>
                      <div style={{ color: '#D9E2E5', fontSize: 13 }}>{zone.treatment}</div>
                      <div style={{ color: '#91A5AE', fontSize: 12, marginTop: 4 }}>{number(zone.acres)} acres in planning queue</div>
                    </div>
                    <div>
                      <div style={{ color: '#91A5AE', fontSize: 11 }}>PRIORITY</div>
                      <div style={{ fontSize: 29, fontWeight: 950 }}>{score}</div>
                    </div>
                    <div style={{ fontWeight: 900, color: score >= 85 ? '#FFB26B' : '#9CE2B8' }}>{scoreLabel(score)}</div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {tab === 'biomass' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(320px,.72fr)', gap: 16 }}>
            <section style={cardStyle}>
              <SectionTitle eyebrow="VALUE RECOVERY" title="Biomass routing before the first machine rolls" />
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 10, marginBottom: 16 }}>
                <SmallMetric label="Pilot treatment queue" value={`${number(pilotAcres)} acres`} />
                <SmallMetric label="Planning biomass yield" value={`${number(pilotTons)} dry tons`} />
                <SmallMetric label="Planning treatment budget" value={money(pilotTreatmentBudget)} />
              </div>
              <RangeControl label="Planning dry tons / treated acre" value={tonsPerAcre} min={1} max={20} step={1} onChange={setTonsPerAcre} />
              <RangeControl label="Planning treatment cost / acre" value={costPerAcre} min={500} max={6000} step={100} onChange={setCostPerAcre} moneyMode />
              <div style={{ marginTop: 18, display: 'grid', gap: 9 }}>
                <Flow source="Sawlogs + poles" destination="Local mills / structural products" note="Highest-value material first" />
                <Flow source="Clean chips" destination="Biochar / mulch / industrial feedstock" note="Short-haul processing preferred" />
                <Flow source="Slash + small material" destination="Mobile grinding / erosion control" note="Avoid paying to haul low-value air and moisture" />
                <Flow source="Residuals" destination="Energy or disposal only after higher uses" note="Last-choice outlet, not the business model" />
              </div>
            </section>

            <aside style={{ display: 'grid', gap: 16 }}>
              <section style={cardStyle}>
                <SectionTitle eyebrow="HUB + SPOKE" title="Regional operating model" />
                <p style={{ color: '#BBC8CE', lineHeight: 1.55 }}>
                  Put preprocessing close to treatment zones. Send only sorted, valuable material to permanent yards and manufacturers.
                </p>
                <div style={{ display: 'grid', gap: 8 }}>
                  <Pill>Mobile grinder / chipper</Pill>
                  <Pill>Shared loader + transport pool</Pill>
                  <Pill>Regional wood yard</Pill>
                  <Pill>Biochar / soil product line</Pill>
                  <Pill>Public procurement of qualified wood products</Pill>
                </div>
              </section>
              <section style={{ ...cardStyle, borderColor: 'rgba(235,163,74,.35)' }}>
                <div style={{ color: '#F4B86C', fontWeight: 950 }}>Critical rule</div>
                <p style={{ color: '#D5DEE2', lineHeight: 1.55, marginBottom: 0 }}>
                  Never approve a large treatment package without a documented biomass destination, transport plan, and fallback outlet.
                </p>
              </section>
            </aside>
          </div>
        )}

        {tab === 'workforce' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: 16 }}>
            <section style={cardStyle}>
              <SectionTitle eyebrow="YEAR-ROUND JOBS" title="Resilience crew model" />
              <ActionRow rank="A" title="Winter / shoulder season" text="Mechanical thinning, equipment maintenance, biomass processing, GIS planning, homeowner mitigation." />
              <ActionRow rank="B" title="Prescribed-fire windows" text="Burn preparation, pile work, ignition support, smoke coordination, post-burn inspection." />
              <ActionRow rank="C" title="Peak fire season" text="Shift trained personnel toward suppression support, patrol, evacuation-route work, and critical infrastructure protection." />
              <ActionRow rank="D" title="Post-fire" text="Erosion control, watershed stabilization, debris routing, infrastructure inspection, and recovery documentation." />
            </section>

            <section style={cardStyle}>
              <SectionTitle eyebrow="CAPITAL STACK" title="Finance the system, not isolated projects" />
              <FundingLine title="Public fuels + watershed grants" role="Pay for public-benefit treatment and planning" />
              <FundingLine title="State / local capital" role="Equipment pools, yards, training, match funding" />
              <FundingLine title="Utility participation" role="Corridor protection and outage-risk reduction" />
              <FundingLine title="Private offtake" role="Purchase biomass products and recovered materials" />
              <FundingLine title="Contractor finance" role="Lease-to-own equipment and working capital" />
              <FundingLine title="Insurance / resilience pilots" role="Test avoided-loss economics where feasible" />
            </section>

            <section style={cardStyle}>
              <SectionTitle eyebrow="PROOF LAYER" title="Every acre gets a digital record" />
              <Check>Priority score and source layers</Check>
              <Check>Landowner / jurisdiction / treatment authority</Check>
              <Check>Prescription and safety approvals</Check>
              <Check>Contractor, crew, and equipment assignment</Check>
              <Check>Before / after imagery and geospatial boundary</Check>
              <Check>Biomass volume and final destination</Check>
              <Check>Actual cost and funding sources</Check>
              <Check>Next inspection and maintenance date</Check>
            </section>
          </div>
        )}

        <footer style={{ color: '#7F949D', fontSize: 12, marginTop: 20, lineHeight: 1.5 }}>
          Prototype planning dashboard. Risk scores, acreage, biomass yield, treatment cost, and crew productivity shown here are scenario inputs until connected to authoritative agency, GIS, contractor, and field data.
        </footer>
      </div>
    </main>
  );
}

function Metric({ label, value, suffix = '', emphasis = false }: { label: string; value: string; suffix?: string; emphasis?: boolean }) {
  return (
    <div style={{ ...cardStyle, borderColor: emphasis ? 'rgba(236,163,74,.46)' : 'rgba(255,255,255,.10)' }}>
      <div style={{ color: '#9FB0B8', fontSize: 12, fontWeight: 800 }}>{label.toUpperCase()}</div>
      <div style={{ fontSize: 29, fontWeight: 950, marginTop: 6, color: emphasis ? '#F4B86C' : '#F4F7F1' }}>
        {value}<span style={{ fontSize: 14, color: '#AFC0C7' }}>{suffix}</span>
      </div>
    </div>
  );
}

function SmallMetric({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ background: '#0B1822', border: '1px solid rgba(255,255,255,.08)', borderRadius: 14, padding: 14 }}>
      <div style={{ color: '#90A5AE', fontSize: 11 }}>{label.toUpperCase()}</div>
      <div style={{ fontWeight: 950, fontSize: 20, marginTop: 4 }}>{value}</div>
    </div>
  );
}

function SectionTitle({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ color: '#83D8AA', fontSize: 11, fontWeight: 950, letterSpacing: '.12em' }}>{eyebrow}</div>
      <h2 style={{ fontSize: 25, margin: '5px 0 0' }}>{title}</h2>
    </div>
  );
}

function ActionRow({ rank, title, text }: { rank: string; title: string; text: string }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '48px minmax(0,1fr)', gap: 12, padding: '12px 0', borderTop: '1px solid rgba(255,255,255,.08)' }}>
      <div style={{ width: 38, height: 38, borderRadius: 12, background: '#17372B', display: 'grid', placeItems: 'center', color: '#A8E6C0', fontWeight: 950 }}>{rank}</div>
      <div>
        <div style={{ fontWeight: 950 }}>{title}</div>
        <div style={{ color: '#AFC0C7', lineHeight: 1.5, marginTop: 3 }}>{text}</div>
      </div>
    </div>
  );
}

function RangeControl({
  label,
  value,
  min,
  max,
  step,
  onChange,
  moneyMode = false,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
  moneyMode?: boolean;
}) {
  return (
    <label style={{ display: 'block', marginTop: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, color: '#D6E0E4', fontSize: 13 }}>
        <span>{label}</span>
        <strong>{moneyMode ? money(value) : number(value)}</strong>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        style={{ width: '100%', marginTop: 7, accentColor: '#83D8AA' }}
      />
    </label>
  );
}

function Flow({ source, destination, note }: { source: string; destination: string; note: string }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(140px,.8fr) 32px minmax(180px,1fr)', gap: 10, alignItems: 'center', background: '#0B1822', borderRadius: 14, padding: 13 }}>
      <div style={{ fontWeight: 900 }}>{source}</div>
      <div style={{ textAlign: 'center', color: '#83D8AA', fontWeight: 950 }}>→</div>
      <div><div style={{ fontWeight: 900 }}>{destination}</div><div style={{ color: '#91A5AE', fontSize: 12 }}>{note}</div></div>
    </div>
  );
}

function Pill({ children }: { children: React.ReactNode }) {
  return <div style={{ border: '1px solid rgba(131,216,170,.25)', background: '#0D211B', borderRadius: 999, padding: '10px 12px', color: '#D7EEE0', fontWeight: 800 }}>{children}</div>;
}

function FundingLine({ title, role }: { title: string; role: string }) {
  return (
    <div style={{ padding: '11px 0', borderTop: '1px solid rgba(255,255,255,.08)' }}>
      <div style={{ fontWeight: 950 }}>{title}</div>
      <div style={{ color: '#AFC0C7', marginTop: 2 }}>{role}</div>
    </div>
  );
}

function Check({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '24px 1fr', gap: 8, alignItems: 'start', padding: '8px 0' }}>
      <span style={{ color: '#83D8AA', fontWeight: 950 }}>✓</span>
      <span style={{ color: '#D5DEE2' }}>{children}</span>
    </div>
  );
}
