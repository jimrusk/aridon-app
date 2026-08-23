'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';

type ScenarioKey = 'downside' | 'base' | 'upside';

type FinanceAnswer = {
  summary: string;
  actions: string[];
  risks: string[];
  scenarioIdeas: string[];
  demo?: boolean;
};

const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
const pct = new Intl.NumberFormat('en-US', { style: 'percent', maximumFractionDigits: 1 });

const scenarioPresets: Record<ScenarioKey, { label: string; revenueGrowth: number; marginShift: number; opexGrowth: number }> = {
  downside: { label: 'Downside', revenueGrowth: -0.08, marginShift: -0.03, opexGrowth: 0.02 },
  base: { label: 'Base', revenueGrowth: 0.05, marginShift: 0.01, opexGrowth: 0.03 },
  upside: { label: 'Upside', revenueGrowth: 0.14, marginShift: 0.025, opexGrowth: 0.06 },
};

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function metricTone(value: number, warning: number, good: number) {
  if (value >= good) return '#9EF0CF';
  if (value >= warning) return '#F4D06F';
  return '#FF9B8F';
}

export default function FinancePage() {
  const [revenue, setRevenue] = useState(250000);
  const [budgetRevenue, setBudgetRevenue] = useState(235000);
  const [grossMargin, setGrossMargin] = useState(0.42);
  const [budgetOpex, setBudgetOpex] = useState(90000);
  const [payroll, setPayroll] = useState(62000);
  const [otherOpex, setOtherOpex] = useState(33000);
  const [cash, setCash] = useState(410000);
  const [receivables, setReceivables] = useState(175000);
  const [payables, setPayables] = useState(85000);
  const [scenario, setScenario] = useState<ScenarioKey>('base');
  const [question, setQuestion] = useState('What is the biggest financial risk in this plan, and what should I do next?');
  const [answer, setAnswer] = useState<FinanceAnswer | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const model = useMemo(() => {
    const opex = payroll + otherOpex;
    const grossProfit = revenue * grossMargin;
    const operatingIncome = grossProfit - opex;
    const operatingMargin = revenue > 0 ? operatingIncome / revenue : 0;
    const monthlyBurn = Math.max(0, -operatingIncome);
    const runway = monthlyBurn > 0 ? cash / monthlyBurn : 99;
    const revenueVariance = revenue - budgetRevenue;
    const revenueVariancePct = budgetRevenue > 0 ? revenueVariance / budgetRevenue : 0;
    const opexVariance = opex - budgetOpex;
    const workingCapital = receivables - payables;
    const preset = scenarioPresets[scenario];
    const months = Array.from({ length: 12 }, (_, index) => {
      const month = index + 1;
      const projectedRevenue = revenue * Math.pow(1 + preset.revenueGrowth / 12, month);
      const projectedMargin = clamp(grossMargin + preset.marginShift * (month / 12), 0.05, 0.9);
      const projectedOpex = opex * Math.pow(1 + preset.opexGrowth / 12, month);
      const projectedOperatingIncome = projectedRevenue * projectedMargin - projectedOpex;
      return { month, projectedRevenue, projectedMargin, projectedOpex, projectedOperatingIncome };
    });
    const ending = months[11];
    const alerts: string[] = [];
    if (operatingMargin < 0) alerts.push('Current operations are running below break-even.');
    if (runway < 6) alerts.push(`Cash runway is approximately ${runway.toFixed(1)} months at the current burn rate.`);
    if (opexVariance > 0) alerts.push(`Operating expense is ${money.format(opexVariance)} over plan this month.`);
    if (revenueVariancePct < -0.05) alerts.push(`Revenue is ${pct.format(Math.abs(revenueVariancePct))} below plan.`);
    if (receivables > revenue * 0.75) alerts.push('Receivables are high relative to one month of revenue. Collections deserve attention.');
    if (!alerts.length) alerts.push('No major threshold breach is visible from the current inputs.');
    return { opex, grossProfit, operatingIncome, operatingMargin, monthlyBurn, runway, revenueVariance, revenueVariancePct, opexVariance, workingCapital, months, ending, alerts };
  }, [revenue, budgetRevenue, grossMargin, budgetOpex, payroll, otherOpex, cash, receivables, payables, scenario]);

  async function askFinanceTeam() {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/finance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question,
          snapshot: {
            revenue,
            budgetRevenue,
            grossMargin,
            payroll,
            otherOpex,
            budgetOpex,
            cash,
            receivables,
            payables,
            operatingIncome: model.operatingIncome,
            operatingMargin: model.operatingMargin,
            runwayMonths: model.runway,
            scenario: scenarioPresets[scenario],
            projectedMonth12Revenue: model.ending.projectedRevenue,
            projectedMonth12OperatingIncome: model.ending.projectedOperatingIncome,
          },
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || 'Finance analysis failed.');
      setAnswer(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Finance analysis failed.');
    } finally {
      setLoading(false);
    }
  }

  const chartMax = Math.max(...model.months.map((m) => Math.max(m.projectedRevenue, Math.abs(m.projectedOperatingIncome))), 1);

  return (
    <main style={{ minHeight: '100vh', background: '#07101D', color: '#F8FAFC', fontFamily: 'Arial, sans-serif' }}>
      <div style={{ maxWidth: 1220, margin: '0 auto', padding: '24px 20px 70px' }}>
        <nav style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <div><strong>ARIDON FINANCE</strong><span style={{ color: '#6F7F96', marginLeft: 8 }}>FP&A Command Center</span></div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <Link href="/dashboard" style={navButton}>Owner Command Center</Link>
            <Link href="/boardroom" style={navButton}>Executive Boardroom</Link>
          </div>
        </nav>

        <section style={{ padding: '54px 0 28px' }}>
          <div style={eyebrow}>FINANCE WITHOUT THE SPREADSHEET FOG</div>
          <h1 style={{ fontSize: 'clamp(44px,7vw,76px)', lineHeight: .94, letterSpacing: -2.5, margin: '10px 0 18px', maxWidth: 980 }}>Plan. Forecast. Stress-test. Ask the numbers what they mean.</h1>
          <p style={{ color: '#B8C4D5', lineHeight: 1.65, fontSize: 18, maxWidth: 900 }}>A working Aridon FP&A layer with live scenario math, budget-vs-actual variance, cash runway signals, anomaly flags and a natural-language finance analyst. Enter the company’s real numbers and the dashboard recalculates immediately.</p>
        </section>

        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(210px,1fr))', gap: 10, marginBottom: 14 }}>
          <Metric label="Monthly revenue" value={money.format(revenue)} detail={`${model.revenueVariance >= 0 ? '+' : ''}${money.format(model.revenueVariance)} vs plan`} tone={model.revenueVariance >= 0 ? '#9EF0CF' : '#FF9B8F'} />
          <Metric label="Gross profit" value={money.format(model.grossProfit)} detail={`${pct.format(grossMargin)} gross margin`} tone={metricTone(grossMargin, .25, .4)} />
          <Metric label="Operating income" value={money.format(model.operatingIncome)} detail={`${pct.format(model.operatingMargin)} operating margin`} tone={model.operatingIncome >= 0 ? '#9EF0CF' : '#FF9B8F'} />
          <Metric label="Cash runway" value={model.runway >= 99 ? 'Cash positive' : `${model.runway.toFixed(1)} mo.`} detail={model.monthlyBurn ? `${money.format(model.monthlyBurn)} monthly burn` : 'No operating burn'} tone={model.runway >= 12 ? '#9EF0CF' : model.runway >= 6 ? '#F4D06F' : '#FF9B8F'} />
          <Metric label="Working capital" value={money.format(model.workingCapital)} detail={`${money.format(receivables)} AR · ${money.format(payables)} AP`} tone={model.workingCapital >= 0 ? '#9EF0CF' : '#FF9B8F'} />
        </section>

        <section className="finance-grid" style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.18fr) minmax(320px,.82fr)', gap: 14 }}>
          <article style={panel}>
            <div style={sectionHead}><div><div style={eyebrow}>INPUTS</div><h2 style={h2}>Current month + plan</h2></div><span style={badge}>Recalculates live</span></div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(185px,1fr))', gap: 10 }}>
              <NumberField label="Actual revenue" value={revenue} onChange={setRevenue} prefix="$" />
              <NumberField label="Budget revenue" value={budgetRevenue} onChange={setBudgetRevenue} prefix="$" />
              <NumberField label="Gross margin" value={grossMargin * 100} onChange={(v) => setGrossMargin(clamp(v / 100, 0, 1))} suffix="%" step={1} />
              <NumberField label="Payroll" value={payroll} onChange={setPayroll} prefix="$" />
              <NumberField label="Other OpEx" value={otherOpex} onChange={setOtherOpex} prefix="$" />
              <NumberField label="Budget OpEx" value={budgetOpex} onChange={setBudgetOpex} prefix="$" />
              <NumberField label="Cash" value={cash} onChange={setCash} prefix="$" />
              <NumberField label="Receivables" value={receivables} onChange={setReceivables} prefix="$" />
              <NumberField label="Payables" value={payables} onChange={setPayables} prefix="$" />
            </div>
          </article>

          <article style={panel}>
            <div style={eyebrow}>VARIANCE + SIGNALS</div>
            <h2 style={h2}>Where the plan is drifting</h2>
            <Variance label="Revenue variance" value={model.revenueVariance} goodWhenPositive />
            <Variance label="OpEx variance" value={model.opexVariance} goodWhenPositive={false} />
            <Variance label="Operating income" value={model.operatingIncome} goodWhenPositive />
            <div style={{ marginTop: 16, borderTop: '1px solid #263650', paddingTop: 14 }}>
              {model.alerts.map((alert) => <div key={alert} style={{ display: 'flex', gap: 9, alignItems: 'flex-start', color: '#D7DFEA', lineHeight: 1.5, padding: '7px 0' }}><span style={{ color: alert.startsWith('No major') ? '#9EF0CF' : '#F4D06F' }}>●</span><span>{alert}</span></div>)}
            </div>
          </article>
        </section>

        <section style={{ ...panel, marginTop: 14 }}>
          <div style={sectionHead}>
            <div><div style={eyebrow}>SCENARIO LAB</div><h2 style={h2}>Twelve-month what-if engine</h2></div>
            <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>{(Object.keys(scenarioPresets) as ScenarioKey[]).map((key) => <button key={key} onClick={() => setScenario(key)} style={{ ...scenarioButton, background: scenario === key ? '#9EF0CF' : '#111D30', color: scenario === key ? '#07130F' : '#DCE5F1', borderColor: scenario === key ? '#9EF0CF' : '#31425E' }}>{scenarioPresets[key].label}</button>)}</div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 10, marginBottom: 18 }}>
            <MiniStat label="Annual revenue growth assumption" value={pct.format(scenarioPresets[scenario].revenueGrowth)} />
            <MiniStat label="Gross-margin shift" value={`${scenarioPresets[scenario].marginShift >= 0 ? '+' : ''}${(scenarioPresets[scenario].marginShift * 100).toFixed(1)} pts`} />
            <MiniStat label="Annual OpEx growth" value={pct.format(scenarioPresets[scenario].opexGrowth)} />
            <MiniStat label="Month 12 revenue" value={money.format(model.ending.projectedRevenue)} />
            <MiniStat label="Month 12 operating income" value={money.format(model.ending.projectedOperatingIncome)} />
          </div>
          <div style={{ overflowX: 'auto' }}>
            <div style={{ minWidth: 720, display: 'grid', gridTemplateColumns: 'repeat(12,1fr)', gap: 6, alignItems: 'end', height: 230, padding: '20px 4px 0' }}>
              {model.months.map((m) => {
                const revenueHeight = Math.max(20, (m.projectedRevenue / chartMax) * 180);
                const incomeHeight = Math.max(4, (Math.abs(m.projectedOperatingIncome) / chartMax) * 180);
                return <div key={m.month} style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', alignItems: 'center', gap: 4 }} title={`Month ${m.month}: Revenue ${money.format(m.projectedRevenue)}, Operating income ${money.format(m.projectedOperatingIncome)}`}>
                  <div style={{ height: incomeHeight, width: '48%', borderRadius: '5px 5px 2px 2px', background: m.projectedOperatingIncome >= 0 ? '#9EF0CF' : '#FF9B8F', opacity: .85 }} />
                  <div style={{ height: revenueHeight, width: '78%', borderRadius: '6px 6px 2px 2px', background: '#7FA9FF' }} />
                  <span style={{ color: '#7889A3', fontSize: 10 }}>M{m.month}</span>
                </div>;
              })}
            </div>
          </div>
          <div style={{ color: '#8290A6', fontSize: 12, marginTop: 7 }}>Blue = projected revenue · Mint/red = projected operating income magnitude. The engine compounds each selected scenario monthly.</div>
        </section>

        <section className="finance-grid" style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(320px,.78fr)', gap: 14, marginTop: 14 }}>
          <article style={panel}>
            <div style={eyebrow}>NATURAL-LANGUAGE FINANCE ANALYST</div>
            <h2 style={h2}>Ask Nova what the numbers mean</h2>
            <textarea value={question} onChange={(e) => setQuestion(e.target.value)} rows={4} style={textarea} placeholder="Example: Can we afford to hire two salespeople next month?" />
            <button onClick={askFinanceTeam} disabled={loading || question.trim().length < 8} style={{ ...primaryButton, opacity: loading ? .7 : 1 }}>{loading ? 'Analyzing…' : 'Analyze with Aridon Finance'}</button>
            {error && <div style={{ marginTop: 10, color: '#FF9B8F' }}>{error}</div>}
            {answer && <div style={{ marginTop: 18, borderTop: '1px solid #263650', paddingTop: 18 }}>
              <p style={{ color: '#ECF2F8', lineHeight: 1.65, fontSize: 17 }}>{answer.summary}</p>
              <AnswerList title="Recommended actions" items={answer.actions} />
              <AnswerList title="Risks to watch" items={answer.risks} />
              <AnswerList title="Scenarios worth testing" items={answer.scenarioIdeas} />
              {answer.demo && <div style={{ color: '#8290A6', fontSize: 12, marginTop: 10 }}>Demo analysis is active because no OpenAI API key is available in this environment.</div>}
            </div>}
          </article>

          <article style={panel}>
            <div style={eyebrow}>ARIDON FINANCE AGENTS</div>
            <h2 style={h2}>One finance team, three jobs</h2>
            <Agent title="Forecast Agent" text="Turns current drivers into forward revenue, margin, OpEx and operating-income scenarios." />
            <Agent title="Analytics Agent" text="Flags plan drift, cash pressure, weak margins, expense overruns and unusual working-capital conditions." />
            <Agent title="Reporting Agent" text="Explains the numbers in plain English and turns the analysis into decision-ready actions for the owner." />
          </article>
        </section>

        <section style={{ ...panel, marginTop: 14 }}>
          <div style={eyebrow}>INTEGRATION LAYER</div>
          <h2 style={h2}>Designed to absorb the systems the business already uses</h2>
          <p style={{ color: '#AEBBD0', lineHeight: 1.6, maxWidth: 950 }}>The report’s strongest platforms win by connecting finance with ERP, CRM, HR and data sources. Aridon’s finance layer is structured for the same direction, while keeping connector claims separated from what is already live.</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 10, marginTop: 18 }}>
            {[
              ['Current Aridon data', 'Company Brain, customer context, projects, tasks and operating decisions can become planning inputs as the data layer is wired together.'],
              ['Accounting / ERP', 'QuickBooks and broader ERP connectors belong in the next integration lane for actuals, chart-of-accounts mapping and close data.'],
              ['CRM / Revenue', 'HubSpot, Salesforce and Aridon CRM data can feed pipeline-weighted revenue forecasts and sales-capacity planning.'],
              ['Workforce / HR', 'Payroll and headcount drivers can support hiring scenarios, labor planning and department-level expense forecasts.'],
            ].map(([title, text]) => <article key={title} style={{ background: '#0C1626', border: '1px solid #263650', borderRadius: 14, padding: 16 }}><strong>{title}</strong><p style={{ color: '#9EACC0', lineHeight: 1.55, fontSize: 14, marginBottom: 0 }}>{text}</p></article>)}
          </div>
        </section>

        <section style={{ marginTop: 14, display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(250px,1fr))', gap: 10 }}>
          <Capability title="Datarails lesson" text="Keep familiar inputs, reduce implementation friction, automate consolidation and make natural-language analysis easy." />
          <Capability title="Board lesson" text="Make analytics and scenario modeling deep enough for real management decisions, not just pretty dashboards." />
          <Capability title="Anaplan lesson" text="Let planning scale from simple owner models to more complex cross-functional assumptions and what-if scenarios." />
          <Capability title="Vena + Prophix lesson" text="Use specialized AI finance agents for reporting, analysis, planning, anomaly detection and narrative explanation." />
          <Capability title="Aridon advantage" text="Connect financial planning to the Executive Boardroom, Company Brain, execution workflows and owner approval controls instead of leaving FP&A in a separate silo." />
        </section>
      </div>
      <style jsx>{`
        @media (max-width: 860px) {
          .finance-grid { grid-template-columns: 1fr !important; }
        }
        input, textarea, button { font: inherit; }
        button { cursor: pointer; }
        button:disabled { cursor: not-allowed; }
      `}</style>
    </main>
  );
}

function Metric({ label, value, detail, tone }: { label: string; value: string; detail: string; tone: string }) {
  return <article style={{ background: '#0D1728', border: '1px solid #263650', borderRadius: 16, padding: 16 }}><div style={{ color: '#7F8EA5', fontSize: 11, fontWeight: 900, letterSpacing: .8 }}>{label.toUpperCase()}</div><div style={{ fontSize: 27, fontWeight: 950, margin: '7px 0 3px', color: tone }}>{value}</div><div style={{ color: '#9EACC0', fontSize: 12 }}>{detail}</div></article>;
}

function NumberField({ label, value, onChange, prefix, suffix, step = 1000 }: { label: string; value: number; onChange: (value: number) => void; prefix?: string; suffix?: string; step?: number }) {
  return <label style={{ display: 'grid', gap: 6 }}><span style={{ color: '#9EACC0', fontSize: 12, fontWeight: 800 }}>{label}</span><div style={{ display: 'flex', alignItems: 'center', background: '#07101D', border: '1px solid #30415D', borderRadius: 11, padding: '0 10px' }}>{prefix && <span style={{ color: '#687A94' }}>{prefix}</span>}<input type="number" step={step} value={Number.isFinite(value) ? value : 0} onChange={(e) => onChange(Number(e.target.value) || 0)} style={{ width: '100%', background: 'transparent', border: 0, outline: 0, color: '#F8FAFC', padding: '11px 7px' }} />{suffix && <span style={{ color: '#687A94' }}>{suffix}</span>}</div></label>;
}

function Variance({ label, value, goodWhenPositive }: { label: string; value: number; goodWhenPositive: boolean }) {
  const good = goodWhenPositive ? value >= 0 : value <= 0;
  return <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '11px 0', borderBottom: '1px solid #1D2B42' }}><span style={{ color: '#AAB8CB' }}>{label}</span><strong style={{ color: good ? '#9EF0CF' : '#FF9B8F' }}>{value >= 0 ? '+' : ''}{money.format(value)}</strong></div>;
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return <div style={{ background: '#07101D', border: '1px solid #263650', borderRadius: 12, padding: 13 }}><div style={{ color: '#74849C', fontSize: 11 }}>{label}</div><strong style={{ display: 'block', marginTop: 5, fontSize: 19 }}>{value}</strong></div>;
}

function Agent({ title, text }: { title: string; text: string }) {
  return <div style={{ padding: '15px 0', borderBottom: '1px solid #22324A' }}><strong style={{ color: '#9EF0CF' }}>{title}</strong><p style={{ color: '#AAB8CB', lineHeight: 1.55, margin: '6px 0 0', fontSize: 14 }}>{text}</p></div>;
}

function Capability({ title, text }: { title: string; text: string }) {
  return <article style={{ background: '#E8E4D9', color: '#171717', borderRadius: 15, padding: 17 }}><strong>{title}</strong><p style={{ color: '#5D5A53', lineHeight: 1.55, marginBottom: 0, fontSize: 14 }}>{text}</p></article>;
}

function AnswerList({ title, items }: { title: string; items: string[] }) {
  return <div style={{ marginTop: 14 }}><strong style={{ color: '#9EF0CF' }}>{title}</strong><ul style={{ color: '#B9C5D5', lineHeight: 1.65, paddingLeft: 20, marginBottom: 0 }}>{items.map((item) => <li key={item}>{item}</li>)}</ul></div>;
}

const panel: React.CSSProperties = { background: '#0D1728', border: '1px solid #263650', borderRadius: 18, padding: 19 };
const h2: React.CSSProperties = { fontSize: 28, margin: '7px 0 17px' };
const eyebrow: React.CSSProperties = { color: '#9EF0CF', fontSize: 11, fontWeight: 950, letterSpacing: 1.1 };
const sectionHead: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start', flexWrap: 'wrap' };
const navButton: React.CSSProperties = { color: '#DCE5F1', textDecoration: 'none', border: '1px solid #30415D', borderRadius: 999, padding: '9px 12px', fontSize: 13, fontWeight: 800 };
const badge: React.CSSProperties = { color: '#9EF0CF', background: '#10251F', border: '1px solid #295543', borderRadius: 999, padding: '6px 9px', fontSize: 11, fontWeight: 900 };
const scenarioButton: React.CSSProperties = { border: '1px solid', borderRadius: 999, padding: '8px 12px', fontWeight: 900 };
const textarea: React.CSSProperties = { width: '100%', boxSizing: 'border-box', resize: 'vertical', background: '#07101D', color: '#F8FAFC', border: '1px solid #30415D', borderRadius: 12, padding: 13, outline: 0, lineHeight: 1.5 };
const primaryButton: React.CSSProperties = { marginTop: 10, background: '#9EF0CF', color: '#07130F', border: 0, borderRadius: 11, padding: '12px 15px', fontWeight: 950 };
