import Link from 'next/link';
import {
  Activity,
  ArrowRight,
  BatteryCharging,
  Beaker,
  BrainCircuit,
  CloudRain,
  Droplets,
  Factory,
  FlaskConical,
  Gauge,
  Leaf,
  Network,
  PiggyBank,
  RadioTower,
  ShieldCheck,
  Sprout,
  SunMedium,
  ThermometerSun,
  Tractor,
  Waves,
} from 'lucide-react';
import PilotScenario from './PilotScenario';

type Module = {
  number: string;
  name: string;
  subtitle: string;
  icon: React.ComponentType<{ size?: number; color?: string }>;
  stage: string;
  problem: string;
  design: string[];
  research: string[];
  metrics: string[];
};

const core: Module[] = [
  {
    number: '01',
    name: 'Aridon Water Independence System',
    subtitle: 'One control layer for every available farm water source.',
    icon: Droplets,
    stage: 'SYSTEM PROTOTYPE',
    problem: 'Farms often manage wells, tanks, rain capture, purchased water, treatment and irrigation as separate systems. That makes it difficult to optimize cost, quality, storage and resilience together.',
    design: [
      'Source inputs: well, rain capture, recycled water, brackish water, municipal water, AWG and storage',
      'Quality inputs: conductivity, turbidity, temperature and treatment status',
      'Resource inputs: water level, electricity price, weather, crop demand and storage capacity',
      'Decision engine: use, treat, store, preserve or defer each source based on farm priorities',
      'Owner view: Water Security Days, cost per usable gallon and source mix',
    ],
    research: [
      'How much groundwater withdrawal can an integrated control strategy avoid?',
      'What operating rules best balance water cost, energy cost and resilience?',
      'How accurately can Water Security Days forecast a farm operating window?',
    ],
    metrics: ['Groundwater gallons avoided', 'Cost per usable gallon', 'Water Security Days', 'Storage utilization', 'Crop water requirement met'],
  },
  {
    number: '02',
    name: 'AWG-1000 Gen 3 Southwest',
    subtitle: 'Hybrid atmospheric water research platform for hot, low-humidity conditions.',
    icon: CloudRain,
    stage: 'ENGINEERING R&D',
    problem: 'Conventional condensation AWG performance can fall sharply in dry climates. Southwest agriculture needs a system designed around humidity swings, nighttime operation, thermal regeneration and energy cost.',
    design: [
      'Mode A: direct condensation when dew-point conditions are favorable',
      'Mode B: desiccant capture when relative humidity is lower',
      'Mode C: thermal regeneration using solar heat, waste heat or another verified heat source',
      'Mode scheduler uses humidity, dew point, ambient temperature, tank level and energy price',
      'Water train includes condensate collection, treatment, storage and quality verification',
    ],
    research: [
      'What hybrid cycle produces the lowest verified kWh per gallon across Southwest weather conditions?',
      'Can nighttime and shoulder-hour operation materially improve seasonal efficiency?',
      'Which desiccant and regeneration approach offers the best durability and maintenance profile?',
    ],
    metrics: ['Liters per day', 'kWh per liter', 'Gallons per dollar', 'Water quality', 'Desiccant cycle life', 'Availability by weather band'],
  },
  {
    number: '03',
    name: 'RootIQ Precision Water',
    subtitle: 'Irrigation decisions based on the root zone instead of the clock.',
    icon: Sprout,
    stage: 'FIELD PROTOTYPE',
    problem: 'Timer-based irrigation can water too early, too late or too uniformly. The crop does not experience the whole field equally, and farm economics suffer when water, energy and fertilizer move where they are not needed.',
    design: [
      'Root-zone moisture and tension sensors at multiple depths',
      'Weather, evapotranspiration, crop stage and rain forecast inputs',
      'Zone-level irrigation recommendations with confidence and evidence',
      'Optional valve and pump control only after owner-approved operating rules',
      'Nutrient and irrigation events stored together for later yield and profit analysis',
    ],
    research: [
      'How much water can root-zone control save without reducing marketable yield?',
      'Which sensor density is accurate enough while remaining affordable?',
      'Can irrigation timing reduce pumping energy and nutrient loss at the same time?',
    ],
    metrics: ['Gallons per acre', 'Yield per acre', 'Pump kWh', 'Irrigation events', 'Root-zone stress hours', 'Profit per acre'],
  },
  {
    number: '04',
    name: 'Farm Profit Digital Twin',
    subtitle: 'Optimize dollars per acre, not just yield per acre.',
    icon: BrainCircuit,
    stage: 'SOFTWARE PROTOTYPE',
    problem: 'Many agriculture tools optimize production while leaving out financing, labor, water, fuel, insurance, storage and market price. A farmer can produce more and still make less money.',
    design: [
      'Farm model: acres, crops, livestock, equipment, labor, water, energy, financing and contracts',
      'Scenario engine compares crop mix, irrigation rules, equipment choices and capital projects',
      'Every recommendation reports both agronomic and economic assumptions',
      'Outputs include profit per acre, cash requirement, downside case and payback window',
      'Actual results feed back into the model after each season',
    ],
    research: [
      'Which variables explain the largest differences between predicted and actual farm margin?',
      'Can water-efficiency recommendations be ranked by financial return rather than technical savings alone?',
      'How should uncertainty be communicated so the model supports decisions without pretending certainty?',
    ],
    metrics: ['Net profit per acre', 'Cash requirement', 'Payback period', 'Water cost per acre', 'Energy cost per acre', 'Forecast error'],
  },
  {
    number: '05',
    name: 'Aridon Farm R&D Network',
    subtitle: 'A field-trial network that moves agricultural inventions from lab to farm.',
    icon: Network,
    stage: 'NETWORK PROTOTYPE',
    problem: 'Promising agriculture research can stall between a successful laboratory result and real farm adoption. Researchers need field sites, farmers need trustworthy evidence, and funders need standardized outcomes.',
    design: [
      'Researcher submits a technology, protocol and measurement plan',
      'Aridon matches trial requirements to willing farms without exposing private data prematurely',
      'Baseline period records water, energy, yield, labor, soil and economic conditions',
      'Trial data follows a common evidence schema with owner permissions and provenance',
      'Results are published at the agreed level: private, partner-only, anonymized or public',
    ],
    research: [
      'Can a common trial framework reduce time and cost between prototype and field evidence?',
      'What compensation and data-rights structure keeps farmers willing to participate?',
      'How much evidence is needed before a technology should advance to a larger demonstration?',
    ],
    metrics: ['Trials launched', 'Time to field', 'Cost per validated trial', 'Farmer retention', 'Technologies advanced', 'Replicable outcome rate'],
  },
];

const expansion = [
  {
    name: 'Soil Water Battery', icon: Waves,
    idea: 'Research porous mineral or ceramic root-zone structures that temporarily hold irrigation water and release it as surrounding soil dries.',
    proof: 'Measure usable storage, evaporation reduction, release curve, crop response, durability and installed cost per acre.',
  },
  {
    name: 'Nutrient Independence', icon: Beaker,
    idea: 'Combine soil demand, manure, wastewater nutrients and precision application to reduce purchased fertilizer while protecting yield and water quality.',
    proof: 'Measure purchased N-P-K avoided, nutrient recovery efficiency, yield, runoff risk and net savings.',
  },
  {
    name: 'Agricultural Early Warning', icon: RadioTower,
    idea: 'Detect regional patterns in weather, pests, disease, well levels and crop stress using permissioned farm observations plus public data.',
    proof: 'Measure warning lead time, false-alert rate, farmer action rate and avoided loss.',
  },
  {
    name: 'Livestock Water + Heat Sentinel', icon: ThermometerSun,
    idea: 'Combine trough level, water temperature, heat index, forecast and animal movement to flag water or heat stress before it becomes an emergency.',
    proof: 'Measure alert lead time, water availability, heat-risk events and response time.',
  },
  {
    name: 'Farm Energy-Water Microgrid', icon: BatteryCharging,
    idea: 'Coordinate solar, batteries, grid power, pumps, treatment, AWG and water tanks so energy and water storage are optimized together.',
    proof: 'Measure energy cost per acre, demand-charge reduction, water produced during low-cost hours and resilience during outages.',
  },
];

const layers = [
  ['Water', 'AWG, wells, rain, recycled water, treatment, storage', Droplets],
  ['Root zone', 'Soil moisture, tension, crop stage and irrigation control', Sprout],
  ['Energy', 'Grid, solar, battery, pumps and thermal resources', SunMedium],
  ['Economics', 'Margin, financing, insurance, labor and market scenarios', PiggyBank],
  ['Evidence', 'Trials, provenance, validation and farmer-controlled data rights', ShieldCheck],
];

function Badge({ children }: { children: React.ReactNode }) {
  return <span style={{ display: 'inline-flex', alignItems: 'center', padding: '6px 9px', borderRadius: 99, background: '#e6efdf', color: '#356943', fontSize: 11, fontWeight: 950, letterSpacing: .5 }}>{children}</span>;
}

export default function AridonAgRDPage() {
  return (
    <main style={{ minHeight: '100vh', background: '#f4f1e8', color: '#18251d', fontFamily: 'Arial,sans-serif' }}>
      <header style={{ background: '#102d25', color: '#fff', padding: '16px 18px', borderTop: '1px solid rgba(255,255,255,.08)' }}>
        <div style={{ maxWidth: 1180, margin: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: 12, color: '#c8e2ac', fontWeight: 950, letterSpacing: 1 }}>ARIDON AG R&D PORTFOLIO</div>
            <strong style={{ fontSize: 18 }}>Southwest Water-Secure Agriculture</strong>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <Link href="/ag" style={{ color: '#fff', textDecoration: 'none', fontWeight: 850, fontSize: 13 }}>Aridon Ag</Link>
            <Link href="/ag/intelligence" style={{ color: '#c8e2ac', textDecoration: 'none', fontWeight: 850, fontSize: 13 }}>Farm Intelligence</Link>
          </div>
        </div>
      </header>

      <section style={{ maxWidth: 1180, margin: 'auto', padding: '62px 18px 42px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,330px),1fr))', gap: 28, alignItems: 'center' }}>
        <div>
          <Badge>FIELD-FIRST AGRICULTURAL R&D</Badge>
          <h1 style={{ fontSize: 'clamp(48px,7vw,80px)', lineHeight: .95, letterSpacing: -3, margin: '14px 0 20px' }}>Make farms more water-secure, more measurable and more profitable.</h1>
          <p style={{ maxWidth: 760, fontSize: 20, lineHeight: 1.58, color: '#526058' }}>A presentation-ready portfolio of ten Aridon research programs designed around Southwest water constraints, farm economics and the gap between promising technology and verified field performance.</p>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 20 }}>
            <a href="#flagships" style={{ display: 'inline-flex', gap: 8, alignItems: 'center', background: '#163d2a', color: '#fff', padding: '14px 17px', borderRadius: 12, textDecoration: 'none', fontWeight: 950 }}>See the five flagships <ArrowRight size={18} /></a>
            <a href="#pilot" style={{ display: 'inline-flex', gap: 8, alignItems: 'center', border: '1px solid #bfcbbd', color: '#274535', padding: '14px 17px', borderRadius: 12, textDecoration: 'none', fontWeight: 950 }}>View pilot design</a>
          </div>
        </div>
        <aside style={{ background: '#163d2a', color: '#fff', borderRadius: 24, padding: 24, boxShadow: '0 18px 60px rgba(22,61,42,.18)' }}>
          <FlaskConical size={34} color="#c8e2ac" />
          <div style={{ color: '#c8e2ac', fontSize: 12, fontWeight: 950, marginTop: 13, letterSpacing: .8 }}>R&D RULE</div>
          <h2 style={{ fontSize: 36, lineHeight: 1.05, margin: '8px 0 14px' }}>Nothing becomes a claim until a field trial earns it.</h2>
          <p style={{ color: '#dbe8df', lineHeight: 1.65, margin: 0 }}>Every concept below separates design targets from measured results. The goal is not a glossy gadget catalog. The goal is a repeatable evidence engine that tells farmers, researchers and funders what actually works.</p>
        </aside>
      </section>

      <section style={{ background: '#fff', borderTop: '1px solid #d8e1d5', borderBottom: '1px solid #d8e1d5', padding: '48px 18px' }}>
        <div style={{ maxWidth: 1180, margin: 'auto' }}>
          <div style={{ color: '#356943', fontSize: 12, fontWeight: 950, letterSpacing: .7 }}>ONE FARM OPERATING STACK</div>
          <h2 style={{ fontSize: 'clamp(34px,5vw,52px)', margin: '8px 0 22px' }}>Five layers share one evidence trail.</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(190px,1fr))', gap: 10 }}>
            {layers.map(([name, text, Icon]) => (
              <article key={String(name)} style={{ border: '1px solid #d8e1d5', background: '#faf9f4', borderRadius: 17, padding: 17 }}>
                <Icon size={27} color="#356943" />
                <h3 style={{ fontSize: 21, margin: '11px 0 6px' }}>{String(name)}</h3>
                <p style={{ margin: 0, color: '#5a675f', lineHeight: 1.5, fontSize: 14 }}>{String(text)}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="flagships" style={{ maxWidth: 1180, margin: 'auto', padding: '58px 18px' }}>
        <div style={{ color: '#356943', fontSize: 12, fontWeight: 950, letterSpacing: .7 }}>FIVE FLAGSHIP PROGRAMS</div>
        <h2 style={{ fontSize: 'clamp(38px,5vw,58px)', margin: '8px 0 12px' }}>Designed to be tested, not merely admired.</h2>
        <p style={{ maxWidth: 820, color: '#5a675f', lineHeight: 1.6, fontSize: 17, marginBottom: 26 }}>Each module has a problem statement, prototype architecture, research questions and measurable field endpoints. Hardware performance remains an engineering target until independent testing confirms it.</p>

        <div style={{ display: 'grid', gap: 16 }}>
          {core.map((module) => {
            const Icon = module.icon;
            return (
              <article key={module.number} style={{ background: '#fff', border: '1px solid #d8e1d5', borderRadius: 22, overflow: 'hidden' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr)', gap: 0 }}>
                  <div style={{ padding: 22 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
                      <div style={{ display: 'flex', gap: 13, alignItems: 'center' }}>
                        <div style={{ width: 48, height: 48, borderRadius: 15, display: 'grid', placeItems: 'center', background: '#e6efdf' }}><Icon size={27} color="#356943" /></div>
                        <div>
                          <div style={{ color: '#356943', fontSize: 11, fontWeight: 950 }}>{module.number} · {module.stage}</div>
                          <h3 style={{ fontSize: 29, margin: '3px 0 3px' }}>{module.name}</h3>
                          <div style={{ color: '#657169', fontWeight: 750 }}>{module.subtitle}</div>
                        </div>
                      </div>
                    </div>
                    <p style={{ color: '#506057', lineHeight: 1.6, fontSize: 16, margin: '17px 0 18px' }}>{module.problem}</p>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(250px,1fr))', gap: 14 }}>
                      <div style={{ background: '#faf9f4', borderRadius: 15, padding: 16 }}>
                        <div style={{ fontSize: 11, color: '#356943', fontWeight: 950, letterSpacing: .6 }}>PROTOTYPE ARCHITECTURE</div>
                        <ul style={{ paddingLeft: 18, margin: '10px 0 0', color: '#526058', lineHeight: 1.55 }}>{module.design.map((item) => <li key={item} style={{ marginBottom: 7 }}>{item}</li>)}</ul>
                      </div>
                      <div style={{ background: '#eef3e9', borderRadius: 15, padding: 16 }}>
                        <div style={{ fontSize: 11, color: '#356943', fontWeight: 950, letterSpacing: .6 }}>R&D QUESTIONS</div>
                        <ul style={{ paddingLeft: 18, margin: '10px 0 0', color: '#526058', lineHeight: 1.55 }}>{module.research.map((item) => <li key={item} style={{ marginBottom: 7 }}>{item}</li>)}</ul>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', marginTop: 15 }}>{module.metrics.map((metric) => <Badge key={metric}>{metric}</Badge>)}</div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section style={{ background: '#102d25', color: '#fff', padding: '58px 18px' }}>
        <div style={{ maxWidth: 1180, margin: 'auto' }}>
          <div style={{ color: '#c8e2ac', fontSize: 12, fontWeight: 950, letterSpacing: .7 }}>FIVE EXPANSION PROGRAMS</div>
          <h2 style={{ fontSize: 'clamp(38px,5vw,58px)', margin: '8px 0 22px' }}>The second wave attacks storage, nutrients, warning, livestock and energy.</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(250px,1fr))', gap: 12 }}>
            {expansion.map(({ name, icon: Icon, idea, proof }) => (
              <article key={name} style={{ background: '#173a30', border: '1px solid #2d5547', borderRadius: 18, padding: 18 }}>
                <Icon size={28} color="#c8e2ac" />
                <h3 style={{ fontSize: 23, margin: '12px 0 8px' }}>{name}</h3>
                <p style={{ color: '#dbe8df', lineHeight: 1.55 }}>{idea}</p>
                <div style={{ borderTop: '1px solid #2d5547', marginTop: 14, paddingTop: 12, color: '#c8e2ac', fontSize: 13, lineHeight: 1.5 }}><strong>Proof plan:</strong> {proof}</div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="pilot" style={{ maxWidth: 1180, margin: 'auto', padding: '58px 18px' }}>
        <div style={{ color: '#356943', fontSize: 12, fontWeight: 950, letterSpacing: .7 }}>SOUTHWEST WATER-SECURE FARM DEMONSTRATION</div>
        <h2 style={{ fontSize: 'clamp(38px,5vw,58px)', margin: '8px 0 12px' }}>A three-arm field trial with a clean comparison.</h2>
        <p style={{ maxWidth: 820, color: '#5a675f', lineHeight: 1.6, fontSize: 17 }}>Start small enough to measure correctly. Use the same crop class, comparable soils and a common measurement protocol wherever possible.</p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: 12, margin: '22px 0' }}>
          {[
            ['ARM A', 'Baseline control', 'Current irrigation and operating practice. Instrument it, but do not optimize it. Establish the comparison.'],
            ['ARM B', 'RootIQ precision', 'Root-zone sensing, weather and irrigation decision support. Test water and pumping savings without AWG.'],
            ['ARM C', 'Integrated water-secure farm', 'RootIQ plus Water Independence System, storage and the AWG research platform. Add energy optimization as instrumentation allows.'],
          ].map(([tag, title, text]) => (
            <article key={tag} style={{ background: '#fff', border: '1px solid #d8e1d5', borderRadius: 18, padding: 19 }}>
              <div style={{ color: '#356943', fontSize: 11, fontWeight: 950 }}>{tag}</div>
              <h3 style={{ fontSize: 25, margin: '7px 0 8px' }}>{title}</h3>
              <p style={{ color: '#5a675f', lineHeight: 1.55, margin: 0 }}>{text}</p>
            </article>
          ))}
        </div>

        <PilotScenario />
      </section>

      <section style={{ background: '#fff', borderTop: '1px solid #d8e1d5', padding: '56px 18px' }}>
        <div style={{ maxWidth: 1180, margin: 'auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 18 }}>
          <div>
            <div style={{ color: '#356943', fontSize: 12, fontWeight: 950 }}>FIELD EVIDENCE PACKAGE</div>
            <h2 style={{ fontSize: 40, margin: '8px 0 10px' }}>What a partner receives.</h2>
            <p style={{ color: '#5a675f', lineHeight: 1.6 }}>The output is designed to be useful to a farmer, university, funder, investor or public agency without changing the underlying evidence.</p>
          </div>
          <div style={{ display: 'grid', gap: 10 }}>
            {[
              ['Baseline dataset', 'Water, energy, soil, weather, yield, labor and economics before intervention.'],
              ['Protocol + provenance', 'What changed, who approved it, when sensors were calibrated and how data was collected.'],
              ['Outcome dashboard', 'Measured results with confidence, missing-data flags and no hidden substitution of modeled numbers for measured numbers.'],
              ['Farmer economics', 'Capital cost, operating cost, net benefit, downside case and practical maintenance burden.'],
              ['Replication package', 'What another farm would need to repeat the trial and test whether the result travels.'],
            ].map(([title, text]) => (
              <div key={title} style={{ display: 'flex', gap: 11, alignItems: 'flex-start', background: '#faf9f4', border: '1px solid #e2e5dc', borderRadius: 14, padding: 14 }}>
                <Gauge size={21} color="#356943" />
                <div><strong>{title}</strong><div style={{ color: '#5a675f', marginTop: 3, lineHeight: 1.45 }}>{text}</div></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section style={{ background: '#e6ecdf', padding: '58px 18px' }}>
        <div style={{ maxWidth: 960, margin: 'auto', textAlign: 'center' }}>
          <Factory size={34} color="#356943" />
          <div style={{ color: '#356943', fontSize: 12, fontWeight: 950, marginTop: 10 }}>THE COMMERCIALIZATION PATH</div>
          <h2 style={{ fontSize: 'clamp(38px,6vw,58px)', margin: '8px 0 12px' }}>Design → instrument → field test → independently validate → scale.</h2>
          <p style={{ color: '#526058', fontSize: 18, lineHeight: 1.6, maxWidth: 780, margin: '0 auto' }}>The first presentation should invite research and pilot partners, not ask anyone to accept unverified performance. A strong partner helps us turn design targets into measured evidence and measured evidence into a product farmers can trust.</p>
          <Link href="/ag" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginTop: 20, background: '#163d2a', color: '#fff', padding: '15px 18px', borderRadius: 12, fontWeight: 950, textDecoration: 'none' }}>Back to Aridon Ag <ArrowRight size={19} /></Link>
        </div>
      </section>

      <footer style={{ padding: '26px 18px 40px' }}>
        <div style={{ maxWidth: 1180, margin: 'auto', display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', color: '#657069', fontSize: 13 }}>
          <div>Aridon Ag R&D · New Mexico first · Southwest field validation</div>
          <div>Concept and prototype program. Hardware and agronomic performance require independent validation.</div>
        </div>
      </footer>
    </main>
  );
}
