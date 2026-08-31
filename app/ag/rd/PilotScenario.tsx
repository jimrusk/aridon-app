'use client';

import { useMemo, useState } from 'react';

const LITERS_PER_GALLON = 3.78541;

function number(value: number, digits = 0) {
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: digits }).format(value);
}

export default function PilotScenario() {
  const [acres, setAcres] = useState(100);
  const [baselineGallonsPerAcreDay, setBaselineGallonsPerAcreDay] = useState(2800);
  const [precisionReductionPct, setPrecisionReductionPct] = useState(15);
  const [awgUnits, setAwgUnits] = useState(4);
  const [awgLitersPerDay, setAwgLitersPerDay] = useState(1000);
  const [seasonDays, setSeasonDays] = useState(120);

  const result = useMemo(() => {
    const baselineDaily = acres * baselineGallonsPerAcreDay;
    const precisionSavedDaily = baselineDaily * (precisionReductionPct / 100);
    const awgDaily = (awgUnits * awgLitersPerDay) / LITERS_PER_GALLON;
    const totalOffsetDaily = precisionSavedDaily + awgDaily;
    const seasonOffset = totalOffsetDaily * seasonDays;
    const baselineSeason = baselineDaily * seasonDays;
    const offsetPct = baselineSeason > 0 ? (seasonOffset / baselineSeason) * 100 : 0;
    return { baselineDaily, precisionSavedDaily, awgDaily, totalOffsetDaily, seasonOffset, offsetPct };
  }, [acres, baselineGallonsPerAcreDay, precisionReductionPct, awgUnits, awgLitersPerDay, seasonDays]);

  const field = (label: string, value: number, onChange: (n: number) => void, suffix: string) => (
    <label style={{ display: 'grid', gap: 7, fontSize: 13, fontWeight: 850, color: '#33483d' }}>
      <span>{label}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#fff', border: '1px solid #cfd9cc', borderRadius: 12, padding: '8px 10px' }}>
        <input
          aria-label={label}
          type="number"
          min="0"
          value={value}
          onChange={(event) => onChange(Math.max(0, Number(event.target.value) || 0))}
          style={{ width: '100%', border: 0, outline: 0, fontSize: 16, fontWeight: 850, color: '#183126', background: 'transparent' }}
        />
        <span style={{ color: '#68776f', whiteSpace: 'nowrap' }}>{suffix}</span>
      </div>
    </label>
  );

  return (
    <section style={{ background: '#eef3e9', border: '1px solid #d2ddce', borderRadius: 22, padding: 22 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 18, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <div style={{ maxWidth: 720 }}>
          <div style={{ color: '#356943', fontSize: 12, fontWeight: 950, letterSpacing: .8 }}>ILLUSTRATIVE PILOT SCENARIO</div>
          <h3 style={{ fontSize: 30, margin: '7px 0 8px' }}>Model a water-security test before anyone makes a performance claim.</h3>
          <p style={{ color: '#5a675f', lineHeight: 1.55, margin: 0 }}>Change the assumptions below. Results are scenario math only, not validated AWG, irrigation, crop, or economic performance. Field trials must establish the real numbers.</p>
        </div>
        <div style={{ background: '#163d2a', color: '#fff', borderRadius: 16, padding: '12px 15px', minWidth: 190 }}>
          <div style={{ color: '#c8e2ac', fontSize: 11, fontWeight: 950 }}>MODELED WATER OFFSET</div>
          <div style={{ fontSize: 34, fontWeight: 950, marginTop: 3 }}>{number(result.offsetPct, 2)}%</div>
          <div style={{ color: '#dbe8df', fontSize: 12 }}>of baseline seasonal demand</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 12, marginTop: 18 }}>
        {field('Farm area', acres, setAcres, 'acres')}
        {field('Baseline irrigation', baselineGallonsPerAcreDay, setBaselineGallonsPerAcreDay, 'gal/acre/day')}
        {field('Precision reduction target', precisionReductionPct, setPrecisionReductionPct, '%')}
        {field('AWG units', awgUnits, setAwgUnits, 'units')}
        {field('AWG design target per unit', awgLitersPerDay, setAwgLitersPerDay, 'L/day')}
        {field('Pilot season', seasonDays, setSeasonDays, 'days')}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(190px,1fr))', gap: 10, marginTop: 18 }}>
        {[
          ['Baseline demand', `${number(result.baselineDaily)} gal/day`],
          ['Precision savings target', `${number(result.precisionSavedDaily)} gal/day`],
          ['AWG modeled contribution', `${number(result.awgDaily)} gal/day`],
          ['Combined modeled offset', `${number(result.totalOffsetDaily)} gal/day`],
          ['Season modeled offset', `${number(result.seasonOffset)} gallons`],
        ].map(([label, value]) => (
          <div key={label} style={{ background: '#fff', border: '1px solid #d2ddce', borderRadius: 14, padding: 14 }}>
            <div style={{ color: '#68776f', fontSize: 11, fontWeight: 900 }}>{label.toUpperCase()}</div>
            <div style={{ fontSize: 22, fontWeight: 950, marginTop: 4 }}>{value}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
