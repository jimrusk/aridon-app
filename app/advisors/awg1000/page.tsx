import Link from 'next/link';

const card = {
  background: '#0D1321',
  border: '1px solid #27334D',
  borderRadius: '18px',
  padding: '20px',
} as const;

const sourceLink = {
  color: '#8EC5FF',
  textDecoration: 'none',
  wordBreak: 'break-word' as const,
};

const risks = [
  'The 1,000 L/day target is already matched publicly by Watergen GEN-M Pro, so capacity alone is not a defensible differentiator.',
  'Water scarcity and low humidity often occur together. Southwest performance must be demonstrated with location-specific temperature and humidity data rather than nameplate output.',
  'Energy is the economic fulcrum. A 0.333–0.400 kWh/L range implies roughly 333–400 kWh/day at a full 1,000 L/day output.',
  'A 40-foot container can improve serviceability, storage, controls and integration, but it is physically larger than some competing 1,000 L/day systems. The container must earn its footprint.',
  'Potable-water claims require a complete treatment train, water-quality testing, certifications and operating protocols. The pilot should not promise municipal-scale replacement before those are proven.',
];

const opportunities = [
  'Sell resilience, verified production and avoided water hauling or groundwater withdrawal, not “water from air” novelty.',
  'Package AWG-1000 with resilient power, storage, telemetry, remote diagnostics and O&M so the customer buys an operating water service rather than a machine.',
  'Lead with a paid site feasibility phase using local weather data, water demand, energy rates, trucked-water costs and field monitoring.',
  'Target applications where each gallon is worth more: emergency supply, remote operations, Tribal facilities, construction, health facilities, premium drinking water and drought contingency.',
  'Use third-party engineering and water-quality verification as a sales asset. Verification can become part of Aridon’s competitive moat.',
];

const investorQuestions = [
  'What is technically proprietary versus integration of commercially available refrigeration, filtration, controls and container systems?',
  'What verified output has been produced in New Mexico or another arid target climate, at what temperature/RH and at what measured kWh/L?',
  'Why will a customer choose AWG-1000 over Watergen, Aquaria, SOURCE, trucked water, storage, well rehabilitation or conventional treatment?',
  'What is the installed cost, gross margin, warranty exposure, maintenance cost and replacement interval for major components?',
  'Who is the first paying customer, what is the procurement path, and what milestone converts a feasibility study into a deployment contract?',
  'How much capital is needed to reach a field-validated, independently verified production unit and what specific value inflection occurs at that milestone?',
];

const nextActions = [
  'Lock a test protocol: temperature, relative humidity, inlet/outlet air, liters produced, compressor/fan/pump energy, water quality and downtime logged continuously.',
  'Create a location-performance model using hourly weather data for Farmington, Albuquerque, Phoenix, Corpus Christi and one humid benchmark site.',
  'Obtain a third-party engineering review of the Gen 2 thermodynamic design before claiming production or efficiency advantages.',
  'Price a paid feasibility product before pricing a full deployment. The feasibility deliverable should include site yield, energy, water quality, installation scope and lifecycle economics.',
  'Build the first customer comparison around cost per reliable gallon and resilience value, with Watergen, Aquaria, SOURCE and trucked water as named alternatives.',
];

export default function AWGChallengePack() {
  return (
    <main style={{ minHeight: '100vh', background: '#070A12', color: '#F5F7FB', padding: '30px 18px 120px' }}>
      <div style={{ maxWidth: '1180px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '14px', flexWrap: 'wrap', marginBottom: '22px' }}>
          <div>
            <div style={{ color: '#42D392', fontSize: '12px', fontWeight: 950, letterSpacing: '1.5px' }}>ARIDON FOUR-ROOM REVIEW · AUGUST 2026</div>
            <h1 style={{ margin: '8px 0 8px', fontSize: 'clamp(34px, 7vw, 58px)', lineHeight: 1 }}>AWG-1000 Challenge Pack</h1>
            <p style={{ color: '#AAB5CA', maxWidth: '830px', lineHeight: 1.65, margin: 0 }}>
              Competitor Intelligence, CEO Challenge Room, Investor Interrogation and CFO Stress Test applied to the AWG-1000 concept. The 1,000 L/day figure is treated as a site-dependent engineering target, not a guaranteed field output.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <Link href="/advisors" style={{ color: '#fff', border: '1px solid #35415C', borderRadius: '10px', padding: '10px 13px', textDecoration: 'none', height: 'fit-content' }}>Challenge Suite</Link>
            <Link href="/intelligence" style={{ color: '#fff', border: '1px solid #35415C', borderRadius: '10px', padding: '10px 13px', textDecoration: 'none', height: 'fit-content' }}>Morning Intel</Link>
          </div>
        </div>

        <section style={{ ...card, borderTop: '4px solid #E74C3C', marginBottom: '16px' }}>
          <h2 style={{ marginTop: 0 }}>1. Competitor Intelligence</h2>
          <p style={{ color: '#C3CCDD', lineHeight: 1.65 }}>
            <strong>Watergen is the closest direct benchmark.</strong> Its current GEN-M Pro page states up to 1,000 L/day and lists 400 Wh/L under standard conditions. Its commercial line also reaches 6,000 L/day. That means AWG-1000 cannot win by saying “we make 1,000 liters from air.” It has to win on installed economics, arid-climate performance, integration, serviceability, power resilience, verification, procurement fit or business model.
          </p>
          <p style={{ color: '#C3CCDD', lineHeight: 1.65 }}>
            <strong>Aquaria is a price-and-efficiency benchmark.</strong> It publicly lists a Hydropack at about 132 gallons/day for $22,499 MSRP and a smaller Hydropack S with stated 330 Wh/L performance. <strong>SOURCE</strong> is a lower-volume alternative, but its off-grid solar Hydropanel story is strong in remote and arid settings and competes for the same resilience budget.
          </p>
          <div style={{ display: 'grid', gap: '8px', color: '#AAB5CA', lineHeight: 1.55 }}>
            <div><strong style={{ color: '#fff' }}>Positioning to avoid:</strong> “the first,” “unique,” or “1,000 L/day breakthrough” without defensible evidence.</div>
            <div><strong style={{ color: '#fff' }}>Positioning to own:</strong> modular verified water resilience, designed around the customer site, paired with resilient power, telemetry, storage and long-term operations.</div>
          </div>
        </section>

        <section style={{ ...card, borderTop: '4px solid #C9A7FF', marginBottom: '16px' }}>
          <h2 style={{ marginTop: 0 }}>2. CEO Challenge Room</h2>
          <h3>What can break the plan</h3>
          <ul style={{ color: '#C3CCDD', lineHeight: 1.7, paddingLeft: '20px' }}>{risks.map((item) => <li key={item} style={{ marginBottom: '8px' }}>{item}</li>)}</ul>
          <h3>What survives the challenge</h3>
          <ul style={{ color: '#C3CCDD', lineHeight: 1.7, paddingLeft: '20px' }}>{opportunities.map((item) => <li key={item} style={{ marginBottom: '8px' }}>{item}</li>)}</ul>
          <div style={{ background: '#171126', border: '1px solid #C9A7FF55', borderRadius: '12px', padding: '14px', color: '#E6D8FF', lineHeight: 1.55 }}>
            <strong>Decision:</strong> proceed, but sell the first commercial step as a paid feasibility and independent validation engagement. Do not lead with a full municipal replacement promise.
          </div>
        </section>

        <section style={{ ...card, borderTop: '4px solid #FFB454', marginBottom: '16px' }}>
          <h2 style={{ marginTop: 0 }}>3. Investor Interrogation</h2>
          <p style={{ color: '#C3CCDD', lineHeight: 1.65 }}>The investor story becomes much stronger when the ask is tied to a measurable de-risking milestone rather than “fund us to build the company.” The first capital milestone should produce a field-validated unit, an independent performance report, a customer feasibility contract and a repeatable installed-cost model.</p>
          <ol style={{ color: '#C3CCDD', lineHeight: 1.7, paddingLeft: '22px' }}>{investorQuestions.map((item) => <li key={item} style={{ marginBottom: '9px' }}>{item}</li>)}</ol>
          <div style={{ background: '#251A0D', border: '1px solid #FFB45455', borderRadius: '12px', padding: '14px', color: '#FFE0B1', lineHeight: 1.55 }}>
            <strong>Current investability call:</strong> promising infrastructure thesis, but the missing proof is field economics. The fastest valuation improvement is verified yield + verified energy + a paying pilot path.
          </div>
        </section>

        <section style={{ ...card, borderTop: '4px solid #42D392', marginBottom: '16px' }}>
          <h2 style={{ marginTop: 0 }}>4. CFO Stress Test</h2>
          <p style={{ color: '#C3CCDD', lineHeight: 1.65 }}>
            Using only transparent benchmark assumptions, not a forecast: at 1,000 L/day, an efficiency range of 0.333–0.400 kWh/L means about <strong>333–400 kWh/day</strong>, or an average electrical load of roughly <strong>13.9–16.7 kW</strong>. If electricity costs $0.10/kWh, energy alone is approximately $33–$40/day. At $0.15/kWh, it is approximately $50–$60/day. Those figures exclude capex, filters, maintenance, labor, storage, water testing, financing, downtime and installation.
          </p>
          <div style={{ background: '#0A1F18', border: '1px solid #42D39255', borderRadius: '12px', padding: '14px', color: '#CFF7E6', lineHeight: 1.6 }}>
            <strong>Required pricing formula:</strong><br />
            Cost per reliable liter = (annualized equipment + installation + financing + energy + maintenance + labor + testing + insurance + reserves) ÷ verified annual liters delivered.
          </div>
          <p style={{ color: '#C3CCDD', lineHeight: 1.65 }}>
            The model should be compared against the customer’s <em>avoided cost</em>, not municipal tap-water price alone. Trucked water, emergency response, well failure, bottled water, production interruption and drought restrictions can create much higher economic value per gallon.
          </p>
        </section>

        <section style={{ ...card, borderTop: '4px solid #65B7FF', marginBottom: '16px' }}>
          <h2 style={{ marginTop: 0 }}>Execution Order</h2>
          <ol style={{ color: '#C3CCDD', lineHeight: 1.75, paddingLeft: '22px' }}>{nextActions.map((item) => <li key={item} style={{ marginBottom: '9px' }}>{item}</li>)}</ol>
        </section>

        <section style={card}>
          <h2 style={{ marginTop: 0 }}>Public Benchmark Sources</h2>
          <div style={{ display: 'grid', gap: '10px', color: '#AAB5CA', lineHeight: 1.5 }}>
            <a href="https://watergen.com/product-page-gen-m-pro/" style={sourceLink}>Watergen GEN-M Pro: up to 1,000 L/day; 400 Wh/L standard-condition specification</a>
            <a href="https://watergen.com/commercial/" style={sourceLink}>Watergen commercial line: 220–6,000 L/day</a>
            <a href="https://www.aquaria.world/hydropack" style={sourceLink}>Aquaria Hydropack: ~132 gal/day; $22,499 MSRP</a>
            <a href="https://www.aquaria.world/original-product-layout/hydropack-s-original" style={sourceLink}>Aquaria Hydropack S: public 330 Wh/L benchmark</a>
            <a href="https://source.co/pages/what-is-a-hydropanel-1" style={sourceLink}>SOURCE Hydropanel: roughly 2.5 L/day in arid climates and 3.5+ L/day in humid climates</a>
          </div>
          <p style={{ color: '#73819E', fontSize: '12px', lineHeight: 1.5, marginBottom: 0, marginTop: '16px' }}>Competitor specifications are manufacturer claims and should be verified independently before being used in customer or investor materials.</p>
        </section>
      </div>
    </main>
  );
}
