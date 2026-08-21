'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

type CheckMap = Record<string, boolean>;
type SellerScore = {
  thesisFit: number;
  sellerMotivation: number;
  financeFlexibility: number;
  recordsQuality: number;
  teamContinuity: number;
  ownerIndependence: number;
  concentrationQuality: number;
  valuationFit: number;
};
type SourceMetrics = {
  onMarketReviews: number;
  offMarketContacts: number;
  brokerTouches: number;
  sellerCalls: number;
  followUps: number;
  lois: number;
};
type RiskMap = Record<string, boolean>;

type SprintPhase = {
  name: string;
  window: string;
  start: number;
  end: number;
  objective: string;
  tasks: { id: string; label: string }[];
};

const phases: SprintPhase[] = [
  {
    name: 'Foundation + Capital',
    window: 'Days 1–7',
    start: 1,
    end: 7,
    objective: 'Lock the acquisition thesis, buyer credibility, decision rules and financing path before deal volume ramps up.',
    tasks: [
      { id: 'p1-buy-box', label: 'Acquisition thesis / buy box is explicit and current' },
      { id: 'p1-buyer-profile', label: 'Buyer profile is ready for brokers and sellers' },
      { id: 'p1-liquidity', label: 'Liquidity and proof-of-funds documents are organized' },
      { id: 'p1-lenders', label: 'At least two lender conversations are underway' },
      { id: 'p1-advisors', label: 'Attorney, CPA/QoE and operating support are identified' },
      { id: 'p1-walkaway', label: 'Maximum price, leverage, cash-at-risk and walk-away rules are written down' },
    ],
  },
  {
    name: 'Source + Qualify',
    window: 'Days 8–28',
    start: 8,
    end: 28,
    objective: 'Create enough qualified deal flow that you can compare opportunities instead of forcing one weak deal to work.',
    tasks: [
      { id: 'p2-market', label: 'On-market sources are reviewed on a repeatable cadence' },
      { id: 'p2-offmarket', label: 'Off-market outreach is running with tracked follow-up' },
      { id: 'p2-brokers', label: 'Broker relationships are being developed proactively' },
      { id: 'p2-fit-call', label: 'Seller fit calls use a consistent qualification scorecard' },
      { id: 'p2-finance', label: 'Lender fit is checked before spending deeply on a target' },
      { id: 'p2-evidence', label: 'Every material seller claim is tagged for verification' },
    ],
  },
  {
    name: 'Underwrite + Structure',
    window: 'Days 29–56',
    start: 29,
    end: 56,
    objective: 'Verify earnings, test downside, compare deal structures and move only when the economics survive scrutiny.',
    tasks: [
      { id: 'p3-earnings', label: 'Normalized earnings and add-backs are independently tested' },
      { id: 'p3-concentration', label: 'Customer, vendor, employee and owner concentration risks are measured' },
      { id: 'p3-capital', label: 'Cash, debt, seller note, earn-out and rollover options are modeled' },
      { id: 'p3-dscr', label: 'Debt-service coverage and post-close cash needs are stress-tested' },
      { id: 'p3-redflags', label: 'Kill-fast risks are cleared or explicitly accepted' },
      { id: 'p3-offer', label: 'Offer range and walk-away price are approved before negotiation' },
    ],
  },
  {
    name: 'LOI + Pre-Diligence',
    window: 'Days 57–90',
    start: 57,
    end: 90,
    objective: 'Get to a disciplined LOI with the key economic, diligence, transition and protection terms understood before full diligence spend.',
    tasks: [
      { id: 'p4-terms', label: 'Purchase price and consideration mix are internally approved' },
      { id: 'p4-working-capital', label: 'Working-capital expectations are defined' },
      { id: 'p4-transition', label: 'Seller transition and key-person continuity are addressed' },
      { id: 'p4-exclusivity', label: 'Exclusivity timing is appropriate for the diligence plan' },
      { id: 'p4-counsel', label: 'Counsel reviews the LOI and binding provisions before signature' },
      { id: 'p4-diligence-plan', label: 'Financial, legal, tax, operational, cyber and people diligence owners are assigned' },
    ],
  },
];

const readinessItems = [
  ['ready-thesis', 'Clear industry, geography, size, return and risk criteria'],
  ['ready-capital', 'Cash contribution and capital limits are known'],
  ['ready-lender', 'Financing route has been discussed with credible lenders'],
  ['ready-profile', 'Buyer profile can be shared without scrambling'],
  ['ready-team', 'Attorney / CPA / diligence support is identified'],
  ['ready-speed', 'Decision cadence allows quick pass / proceed calls'],
  ['ready-transition', 'You know what seller transition you require'],
  ['ready-loss', 'Maximum acceptable downside is explicit'],
] as const;

const loiGateItems = [
  ['loi-financials', 'Source financials and tax returns received or scheduled'],
  ['loi-normalized', 'Normalized EBITDA/SDE has a documented bridge'],
  ['loi-funding', 'Financing path and equity requirement are plausible'],
  ['loi-dscr', 'Debt-service and downside case are acceptable'],
  ['loi-structure', 'Cash, seller note, earn-out and rollover terms are intentional'],
  ['loi-workingcap', 'Working-capital and inventory treatment are understood'],
  ['loi-transition', 'Transition, training and key employee retention are addressed'],
  ['loi-diligence', 'Diligence scope and data-room request list are prepared'],
  ['loi-counsel', 'Attorney review is planned before signature'],
] as const;

const riskItems = [
  ['risk-records', 'Financial records cannot be verified', 'critical'],
  ['risk-decline', 'Revenue / profit trend is materially deteriorating without a credible explanation', 'critical'],
  ['risk-customer', 'Customer concentration is extreme for this business model', 'critical'],
  ['risk-legal', 'Existential litigation, licensing or regulatory exposure is unresolved', 'critical'],
  ['risk-tax', 'Tax liabilities or payroll compliance are unclear', 'critical'],
  ['risk-owner', 'Value depends heavily on owner relationships that may not transfer', 'major'],
  ['risk-team', 'Key employee retention is uncertain', 'major'],
  ['risk-capex', 'Near-term equipment / technology replacement could overwhelm cash flow', 'major'],
  ['risk-seller', 'Seller resists reasonable verification or diligence access', 'critical'],
  ['risk-lender', 'Credible lenders indicate the deal is not financeable as structured', 'major'],
] as const;

const initialSellerScore: SellerScore = {
  thesisFit: 70,
  sellerMotivation: 55,
  financeFlexibility: 50,
  recordsQuality: 60,
  teamContinuity: 60,
  ownerIndependence: 50,
  concentrationQuality: 60,
  valuationFit: 55,
};

const initialSourceMetrics: SourceMetrics = {
  onMarketReviews: 0,
  offMarketContacts: 0,
  brokerTouches: 0,
  sellerCalls: 0,
  followUps: 0,
  lois: 0,
};

const box: React.CSSProperties = { background: '#0D1728', border: '1px solid #263958', borderRadius: 16, padding: 18 };
const input: React.CSSProperties = { width: '100%', boxSizing: 'border-box', background: '#08111F', border: '1px solid #30435F', borderRadius: 9, color: '#F8FAFC', padding: '10px 11px' };
const button: React.CSSProperties = { border: 0, borderRadius: 9, padding: '10px 13px', background: '#9EF0CF', color: '#07101D', fontWeight: 950, cursor: 'pointer' };
const secondaryButton: React.CSSProperties = { border: '1px solid #405677', borderRadius: 9, padding: '10px 13px', background: '#13223A', color: '#F8FAFC', fontWeight: 900, cursor: 'pointer' };

function pct(done: number, total: number) {
  return total ? Math.round((done / total) * 100) : 0;
}

function CheckRow({ id, label, checks, setChecks }: { id: string; label: string; checks: CheckMap; setChecks: React.Dispatch<React.SetStateAction<CheckMap>> }) {
  return <label style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '9px 0', borderBottom: '1px solid #1C2B41', color: '#C6D1E0', lineHeight: 1.45, cursor: 'pointer' }}>
    <input type="checkbox" checked={!!checks[id]} onChange={e => setChecks(current => ({ ...current, [id]: e.target.checked }))} style={{ marginTop: 3 }} />
    <span>{label}</span>
  </label>;
}

function Metric({ label, value, note }: { label: string; value: string | number; note?: string }) {
  return <div style={box}>
    <div style={{ color: '#7F91AA', fontSize: 11, fontWeight: 900, textTransform: 'uppercase', letterSpacing: .7 }}>{label}</div>
    <div style={{ fontSize: 28, fontWeight: 950, marginTop: 5 }}>{value}</div>
    {note ? <div style={{ color: '#8FA0B8', fontSize: 12, marginTop: 5 }}>{note}</div> : null}
  </div>;
}

export default function AcquisitionPlaybookPage() {
  const [startDate, setStartDate] = useState('');
  const [checks, setChecks] = useState<CheckMap>({});
  const [loiChecks, setLoiChecks] = useState<CheckMap>({});
  const [seller, setSeller] = useState<SellerScore>(initialSellerScore);
  const [sources, setSources] = useState<SourceMetrics>(initialSourceMetrics);
  const [risks, setRisks] = useState<RiskMap>({});
  const [weeklyNote, setWeeklyNote] = useState('');
  const [saved, setSaved] = useState('');

  useEffect(() => {
    try {
      const raw = localStorage.getItem('aridon-acquisition-90-day');
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (parsed.startDate) setStartDate(parsed.startDate);
      if (parsed.checks) setChecks(parsed.checks);
      if (parsed.loiChecks) setLoiChecks(parsed.loiChecks);
      if (parsed.seller) setSeller({ ...initialSellerScore, ...parsed.seller });
      if (parsed.sources) setSources({ ...initialSourceMetrics, ...parsed.sources });
      if (parsed.risks) setRisks(parsed.risks);
      if (typeof parsed.weeklyNote === 'string') setWeeklyNote(parsed.weeklyNote);
    } catch {
      // Ignore malformed local state and start clean.
    }
  }, []);

  const phaseTasks = phases.flatMap(phase => phase.tasks);
  const taskDone = phaseTasks.filter(task => checks[task.id]).length;
  const readinessDone = readinessItems.filter(([id]) => checks[id]).length;
  const loiDone = loiGateItems.filter(([id]) => loiChecks[id]).length;

  const currentDay = useMemo(() => {
    if (!startDate) return 0;
    const start = new Date(`${startDate}T00:00:00`);
    if (Number.isNaN(start.getTime())) return 0;
    const diff = Math.floor((Date.now() - start.getTime()) / 86400000) + 1;
    return Math.max(1, diff);
  }, [startDate]);

  const currentPhase = phases.find(phase => currentDay >= phase.start && currentDay <= phase.end) || (currentDay > 90 ? phases[3] : phases[0]);

  const sellerFit = useMemo(() => {
    const weights: Record<keyof SellerScore, number> = {
      thesisFit: .2,
      sellerMotivation: .1,
      financeFlexibility: .1,
      recordsQuality: .15,
      teamContinuity: .1,
      ownerIndependence: .1,
      concentrationQuality: .1,
      valuationFit: .15,
    };
    return Math.round((Object.keys(weights) as (keyof SellerScore)[]).reduce((sum, key) => sum + seller[key] * weights[key], 0));
  }, [seller]);

  const criticalRisks = riskItems.filter(([id, , level]) => level === 'critical' && risks[id]).length;
  const majorRisks = riskItems.filter(([id, , level]) => level === 'major' && risks[id]).length;
  const riskSignal = criticalRisks > 0 ? 'STOP / RESOLVE' : majorRisks >= 2 ? 'HOLD / INVESTIGATE' : majorRisks === 1 ? 'PROCEED WITH CAUTION' : 'NO ACTIVE KILL FLAG';
  const sourceActivity = sources.onMarketReviews + sources.offMarketContacts + sources.brokerTouches + sources.sellerCalls + sources.followUps;

  function save() {
    try {
      localStorage.setItem('aridon-acquisition-90-day', JSON.stringify({ startDate, checks, loiChecks, seller, sources, risks, weeklyNote }));
      setSaved('Saved on this device.');
    } catch {
      setSaved('This browser could not save the command center.');
    }
  }

  function reset() {
    setChecks({});
    setLoiChecks({});
    setSeller(initialSellerScore);
    setSources(initialSourceMetrics);
    setRisks({});
    setWeeklyNote('');
    setStartDate('');
    try { localStorage.removeItem('aridon-acquisition-90-day'); } catch {}
    setSaved('Reset complete.');
  }

  return <main style={{ minHeight: '100vh', background: '#07101D', color: '#F8FAFC', fontFamily: 'Arial,sans-serif', padding: '24px 18px 70px' }}>
    <div style={{ maxWidth: 1320, margin: '0 auto' }}>
      <nav style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <strong>ARIDON 3 · 90-DAY ACQUISITION COMMAND CENTER</strong>
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
          <Link href="/acquisitions/thesis" style={{ color: '#9EF0CF', textDecoration: 'none', fontWeight: 900 }}>Acquisition Thesis</Link>
          <Link href="/acquisitions/pipeline" style={{ color: '#9EF0CF', textDecoration: 'none', fontWeight: 900 }}>Pipeline</Link>
          <Link href="/acquisitions" style={{ color: '#9EF0CF', textDecoration: 'none', fontWeight: 900 }}>Deal Engine</Link>
        </div>
      </nav>

      <header style={{ padding: '44px 0 22px' }}>
        <div style={{ color: '#9EF0CF', fontSize: 12, fontWeight: 950, letterSpacing: 1.1 }}>SEARCH → QUALIFY → UNDERWRITE → STRUCTURE → LOI → DILIGENCE → OPERATE</div>
        <h1 style={{ fontSize: 'clamp(40px,6vw,72px)', lineHeight: .98, margin: '9px 0 13px', maxWidth: 1000 }}>Run the acquisition like an operating system, not a scavenger hunt.</h1>
        <p style={{ color: '#B5C1D2', fontSize: 18, lineHeight: 1.6, maxWidth: 940, margin: 0 }}>This page turns Aridon 3 into a disciplined 90-day execution board: buyer readiness, sourcing activity, seller fit, kill-fast risk controls, LOI gates and the first 100 days after close.</p>
      </header>

      <section style={{ ...box, marginBottom: 14, display: 'grid', gridTemplateColumns: 'minmax(220px,.8fr) minmax(300px,1.2fr)', gap: 14, alignItems: 'end' }}>
        <label style={{ color: '#C6D1E0', fontWeight: 800 }}>Sprint start date
          <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} style={{ ...input, marginTop: 6 }} />
        </label>
        <div style={{ display: 'flex', gap: 9, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          <button onClick={save} style={button}>Save Command Center</button>
          <button onClick={reset} style={secondaryButton}>Reset</button>
        </div>
        {saved ? <div style={{ gridColumn: '1 / -1', color: '#AFC0D5', fontSize: 13 }}>{saved}</div> : null}
      </section>

      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(170px,1fr))', gap: 10, marginBottom: 16 }}>
        <Metric label="Sprint Day" value={currentDay ? Math.min(currentDay, 90) : '—'} note={startDate ? (currentDay > 90 ? '90-day window complete' : currentPhase.name) : 'Set a start date'} />
        <Metric label="Sprint Tasks" value={`${pct(taskDone, phaseTasks.length)}%`} note={`${taskDone}/${phaseTasks.length} complete`} />
        <Metric label="Buyer Ready" value={`${pct(readinessDone, readinessItems.length)}%`} note={`${readinessDone}/${readinessItems.length} ready`} />
        <Metric label="Seller Fit" value={`${sellerFit}/100`} note={sellerFit >= 75 ? 'Strong candidate' : sellerFit >= 60 ? 'Investigate' : 'Weak fit'} />
        <Metric label="Risk Signal" value={riskSignal} note={`${criticalRisks} critical · ${majorRisks} major`} />
        <Metric label="Sourcing Activity" value={sourceActivity} note={`${sources.sellerCalls} seller calls · ${sources.lois} LOIs`} />
      </section>

      <section style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.15fr) minmax(300px,.85fr)', gap: 14, alignItems: 'start', marginBottom: 14 }}>
        <div style={{ display: 'grid', gap: 14 }}>
          <section style={box}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', alignItems: 'baseline' }}>
              <div><div style={{ color: '#9EF0CF', fontSize: 11, fontWeight: 950 }}>90-DAY EXECUTION ROADMAP</div><h2 style={{ margin: '6px 0 4px' }}>Four phases, one decision rhythm</h2></div>
              <div style={{ color: '#8FA0B8', fontSize: 13 }}>Current: {startDate ? currentPhase.window : 'start date not set'}</div>
            </div>
            <div style={{ display: 'grid', gap: 11, marginTop: 12 }}>
              {phases.map(phase => {
                const done = phase.tasks.filter(task => checks[task.id]).length;
                const active = startDate && currentDay >= phase.start && currentDay <= phase.end;
                return <div key={phase.name} style={{ border: active ? '1px solid #77D7B2' : '1px solid #2A3C59', borderRadius: 13, padding: 14, background: active ? '#0D1F26' : '#091321' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}><strong>{phase.window} · {phase.name}</strong><span style={{ color: '#9EF0CF', fontWeight: 900 }}>{done}/{phase.tasks.length}</span></div>
                  <p style={{ color: '#AAB7C9', lineHeight: 1.5, margin: '7px 0 8px' }}>{phase.objective}</p>
                  {phase.tasks.map(task => <CheckRow key={task.id} id={task.id} label={task.label} checks={checks} setChecks={setChecks} />)}
                </div>;
              })}
            </div>
          </section>

          <section style={box}>
            <div style={{ color: '#9EF0CF', fontSize: 11, fontWeight: 950 }}>SELLER FIT SCORECARD</div>
            <h2 style={{ margin: '6px 0 8px' }}>Score the deal before emotion gets a vote.</h2>
            <p style={{ color: '#AAB7C9', lineHeight: 1.55, marginTop: 0 }}>Use 0–100 for each dimension. A high score means the factor is favorable to the buyer. The weighted result is a screening signal, not a substitute for diligence.</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(230px,1fr))', gap: 12 }}>
              {([
                ['thesisFit', 'Thesis fit'], ['sellerMotivation', 'Seller motivation'], ['financeFlexibility', 'Deal-structure flexibility'], ['recordsQuality', 'Financial record quality'], ['teamContinuity', 'Team continuity'], ['ownerIndependence', 'Owner independence'], ['concentrationQuality', 'Customer / vendor diversification'], ['valuationFit', 'Valuation fit'],
              ] as [keyof SellerScore, string][]).map(([key, label]) => <label key={key} style={{ color: '#C6D1E0', fontSize: 13, fontWeight: 800 }}>
                <span style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}><span>{label}</span><strong style={{ color: '#9EF0CF' }}>{seller[key]}</strong></span>
                <input type="range" min={0} max={100} step={5} value={seller[key]} onChange={e => setSeller(current => ({ ...current, [key]: Number(e.target.value) }))} style={{ width: '100%', marginTop: 7 }} />
              </label>)}
            </div>
          </section>

          <section style={box}>
            <div style={{ color: '#9EF0CF', fontSize: 11, fontWeight: 950 }}>KILL-FAST RISK SCREEN</div>
            <h2 style={{ margin: '6px 0 8px' }}>Find the reason not to buy it early.</h2>
            <p style={{ color: '#AAB7C9', lineHeight: 1.55, marginTop: 0 }}>Check a flag only when the issue is currently present or unresolved. Critical flags should stop acceleration until evidence clears them.</p>
            <div style={{ display: 'grid', gap: 2 }}>
              {riskItems.map(([id, label, level]) => <label key={id} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', borderBottom: '1px solid #1D2C43', padding: '9px 0', cursor: 'pointer' }}>
                <input type="checkbox" checked={!!risks[id]} onChange={e => setRisks(current => ({ ...current, [id]: e.target.checked }))} style={{ marginTop: 3 }} />
                <span style={{ flex: 1, color: '#C6D1E0' }}>{label}</span>
                <span style={{ fontSize: 10, fontWeight: 950, color: level === 'critical' ? '#FFB4B4' : '#FFD6A6', textTransform: 'uppercase' }}>{level}</span>
              </label>)}
            </div>
          </section>
        </div>

        <div style={{ display: 'grid', gap: 14 }}>
          <section style={box}>
            <div style={{ color: '#9EF0CF', fontSize: 11, fontWeight: 950 }}>BUYER READINESS</div>
            <h2 style={{ margin: '6px 0 8px' }}>Look credible before asking for confidential data.</h2>
            {readinessItems.map(([id, label]) => <CheckRow key={id} id={id} label={label} checks={checks} setChecks={setChecks} />)}
            <div style={{ display: 'flex', gap: 9, flexWrap: 'wrap', marginTop: 12 }}>
              <Link href="/acquisitions/thesis" style={{ ...button, textDecoration: 'none', display: 'inline-block' }}>Set Buy Box</Link>
              <Link href="/acquisitions/pipeline" style={{ ...secondaryButton, textDecoration: 'none', display: 'inline-block' }}>Open Pipeline</Link>
            </div>
          </section>

          <section style={box}>
            <div style={{ color: '#9EF0CF', fontSize: 11, fontWeight: 950 }}>SOURCING CADENCE</div>
            <h2 style={{ margin: '6px 0 8px' }}>Track activity, not just outcomes.</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 9 }}>
              {([
                ['onMarketReviews', 'On-market reviews'], ['offMarketContacts', 'Off-market contacts'], ['brokerTouches', 'Broker touches'], ['sellerCalls', 'Seller calls'], ['followUps', 'Follow-ups'], ['lois', 'LOIs'],
              ] as [keyof SourceMetrics, string][]).map(([key, label]) => <label key={key} style={{ color: '#C6D1E0', fontSize: 12, fontWeight: 800 }}>{label}<input type="number" min={0} value={sources[key] || ''} onChange={e => setSources(current => ({ ...current, [key]: Number(e.target.value) || 0 }))} style={{ ...input, marginTop: 5 }} /></label>)}
            </div>
          </section>

          <section style={box}>
            <div style={{ color: '#9EF0CF', fontSize: 11, fontWeight: 950 }}>LOI GATE</div>
            <h2 style={{ margin: '6px 0 8px' }}>Do not use an LOI to hide unanswered questions.</h2>
            {loiGateItems.map(([id, label]) => <CheckRow key={id} id={id} label={label} checks={loiChecks} setChecks={setLoiChecks} />)}
            <div style={{ marginTop: 10, color: '#9EF0CF', fontWeight: 950 }}>{pct(loiDone, loiGateItems.length)}% gate complete</div>
          </section>

          <section style={box}>
            <div style={{ color: '#9EF0CF', fontSize: 11, fontWeight: 950 }}>WEEKLY POWER REVIEW</div>
            <h2 style={{ margin: '6px 0 8px' }}>What changed this week?</h2>
            <textarea rows={8} value={weeklyNote} onChange={e => setWeeklyNote(e.target.value)} placeholder="Best new lead, biggest risk, financing update, broker response, seller signal, next three actions..." style={{ ...input, resize: 'vertical' }} />
          </section>
        </div>
      </section>

      <section style={{ ...box, marginBottom: 14 }}>
        <div style={{ color: '#9EF0CF', fontSize: 11, fontWeight: 950 }}>FIRST 100 DAYS AFTER CLOSE</div>
        <h2 style={{ margin: '6px 0 12px' }}>Protect the asset before trying to reinvent it.</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: 10 }}>
          {[
            ['Days 1–30', 'Stabilize + Learn', ['Meet employees and key customers', 'Protect cash, payroll and service continuity', 'Document critical routines and dependencies', 'Confirm what the seller actually did every week']],
            ['Days 31–60', 'Measure + Fix', ['Baseline KPIs and working-capital behavior', 'Remove obvious process bottlenecks', 'Validate pricing, labor and vendor economics', 'Close diligence findings that became operating risks']],
            ['Days 61–100+', 'Improve + Grow', ['Launch only evidence-backed growth moves', 'Strengthen management and accountability', 'Automate repeatable reporting and workflows', 'Revisit acquisition thesis with real operating data']],
          ].map(([window, title, items]) => <div key={String(window)} style={{ border: '1px solid #2A3C59', borderRadius: 13, padding: 14, background: '#091321' }}>
            <div style={{ color: '#9EF0CF', fontSize: 11, fontWeight: 950 }}>{window as string}</div>
            <strong style={{ display: 'block', fontSize: 18, margin: '5px 0 8px' }}>{title as string}</strong>
            <ul style={{ margin: 0, paddingLeft: 18, color: '#B7C3D4', lineHeight: 1.55 }}>{(items as string[]).map(item => <li key={item}>{item}</li>)}</ul>
          </div>)}
        </div>
      </section>

      <section style={{ ...box, borderColor: '#3B4B63' }}>
        <strong>Aridon guardrail:</strong>
        <span style={{ color: '#AAB7C9', lineHeight: 1.55 }}> This is an original acquisition workflow built around general M&amp;A operating principles. It does not reproduce third-party proprietary templates. Have qualified legal, tax, accounting and lending professionals review transaction-specific terms, diligence conclusions and financing assumptions.</span>
      </section>
    </div>
  </main>;
}
