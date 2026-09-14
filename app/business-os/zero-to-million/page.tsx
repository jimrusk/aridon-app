'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';

type Plan = {
  mode?: string;
  stage?: { id: number; name: string; target: number; mission: string };
  edge?: string;
  primary_offer?: string;
  bottleneck?: string;
  revenue_math?: {
    current_monthly_revenue: number;
    next_monthly_target: number;
    price: number;
    customers_needed_at_price: number;
    current_customers: number;
    additional_customers_needed: number;
    suggested_weekly_sales_conversations: number;
  };
  seven_day_sprint?: string[];
  manufacture_luck?: string[];
  reinvestment_rule?: string;
  stop_doing?: string[];
  scorecard?: string[];
  error?: string;
};

const stages = [
  ['0', 'WHITE BELT', 'One buyer. One problem. One paid outcome.'],
  ['1', 'PROOF', 'Get strangers to buy the same offer.'],
  ['2', 'REPEATABILITY', 'Make acquisition and delivery repeatable.'],
  ['3', 'SYSTEMIZE', 'Remove founder bottlenecks and protect margin.'],
  ['4', 'SCALE', 'Scale the winning channel and deepen retention.'],
  ['5', '$1M RUN RATE', 'Defend cash, quality and leadership capacity.'],
];

export default function ZeroToMillionPage() {
  const [business, setBusiness] = useState('Aridon Business OS');
  const [skills, setSkills] = useState('AI business analysis, executive coordination, research, outreach, automation');
  const [customers, setCustomers] = useState('Small and mid-sized businesses that need useful AI execution, not another chatbot');
  const [problem, setProblem] = useState('Owners are overloaded and lose revenue because research, follow-up, sales and operations are fragmented.');
  const [offer, setOffer] = useState('14-day Revenue Recovery / Business OS pilot with a measurable workflow and owner approval controls');
  const [price, setPrice] = useState('1500');
  const [revenue, setRevenue] = useState('0');
  const [customersNow, setCustomersNow] = useState('0');
  const [hours, setHours] = useState('30');
  const [cash, setCash] = useState('2000');
  const [proof, setProof] = useState('Live Aridon modules, working demos, outreach workflows, Business OS, Revenue Engine and active prospect conversations.');
  const [busy, setBusy] = useState(false);
  const [plan, setPlan] = useState<Plan | null>(null);

  const nextMilestone = useMemo(() => {
    const r = Number(revenue) || 0;
    if (r <= 0) return '$1K/mo';
    if (r < 5000) return '$5K/mo';
    if (r < 20000) return '$20K/mo';
    if (r < 50000) return '$50K/mo';
    if (r < 100000) return '$100K/mo';
    return '$1M annual run-rate+';
  }, [revenue]);

  async function run() {
    setBusy(true);
    setPlan(null);
    try {
      const response = await fetch('/api/zero-to-million/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          business, skills, customers, problem, offer,
          price: Number(price) || 0,
          monthlyRevenue: Number(revenue) || 0,
          monthlyCustomers: Number(customersNow) || 0,
          hoursPerWeek: Number(hours) || 0,
          cashAvailable: Number(cash) || 0,
          proof,
        }),
      });
      const data = await response.json();
      setPlan(data);
    } catch {
      setPlan({ error: 'Unable to reach the operating engine.' });
    } finally {
      setBusy(false);
    }
  }

  return (
    <main style={{ minHeight: '100vh', background: '#08120F', color: '#F7FAF8', fontFamily: 'Arial,sans-serif' }}>
      <section style={{ maxWidth: 1220, margin: '0 auto', padding: '24px 20px 62px' }}>
        <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <Link href="/business-os" style={{ color: '#fff', textDecoration: 'none', fontWeight: 950 }}>ARIDON · EXECUTIVE OS</Link>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <Link href="/business-os/revenue-engine" style={outlineButton}>Revenue Engine</Link>
            <Link href="/business-os/growth-command" style={outlineButton}>Growth Command</Link>
          </div>
        </nav>

        <div style={{ maxWidth: 940, paddingTop: 58 }}>
          <div style={eyebrow}>ARIDON 0→$1M OPERATING MODE</div>
          <h1 style={{ fontSize: 'clamp(48px,7vw,86px)', lineHeight: .93, letterSpacing: -3, margin: '14px 0 20px' }}>Earn the next rung before climbing the ladder.</h1>
          <p style={{ fontSize: 20, lineHeight: 1.65, color: '#B9C9C1', maxWidth: 900 }}>Identify the edge. Pick one project. Create one paid offer. Manufacture useful luck. Reinvest only into what proves itself. Eva turns that into weekly operating math instead of motivational fog.</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(175px,1fr))', gap: 9, marginTop: 28 }}>
          {stages.map(([n, name, text]) => <article key={n} style={{ border: '1px solid #2B463C', borderRadius: 15, padding: 15, background: '#0D1D18' }}><div style={{ color: '#9EF0CF', fontWeight: 950, fontSize: 11 }}>{n} · {name}</div><div style={{ color: '#B8C8C0', fontSize: 12, lineHeight: 1.5, marginTop: 7 }}>{text}</div></article>)}
        </div>
      </section>

      <section style={{ background: '#F2F0E9', color: '#171717', padding: '68px 20px' }}>
        <div className="million-grid" style={{ maxWidth: 1220, margin: '0 auto', display: 'grid', gridTemplateColumns: 'minmax(0,.85fr) minmax(0,1.15fr)', gap: 18 }}>
          <div>
            <div style={lightEyebrow}>BUILD THE OPERATING PLAN</div>
            <h2 style={sectionTitle}>Current target: {nextMilestone}</h2>
            <p style={body}>Keep the inputs brutally factual. If an offer, customer, contract or proof point does not exist yet, do not type it in.</p>

            <Field label="Business / project" value={business} setValue={setBusiness} />
            <Field label="Skills / unfair advantages" value={skills} setValue={setSkills} multiline />
            <Field label="Best customer" value={customers} setValue={setCustomers} multiline />
            <Field label="Painful problem" value={problem} setValue={setProblem} multiline />
            <Field label="Primary offer" value={offer} setValue={setOffer} multiline />

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 10 }}>
              <NumberField label="Offer price" value={price} setValue={setPrice} prefix="$" />
              <NumberField label="Monthly revenue" value={revenue} setValue={setRevenue} prefix="$" />
              <NumberField label="Current customers" value={customersNow} setValue={setCustomersNow} />
              <NumberField label="Hours/week" value={hours} setValue={setHours} />
              <NumberField label="Cash available" value={cash} setValue={setCash} prefix="$" />
            </div>

            <Field label="Existing proof" value={proof} setValue={setProof} multiline />

            <button onClick={run} disabled={busy || !business.trim()} style={{ width: '100%', border: 0, borderRadius: 12, background: '#071A14', color: '#9EF0CF', padding: '15px 16px', fontSize: 15, fontWeight: 950, cursor: busy ? 'wait' : 'pointer', opacity: busy ? .65 : 1 }}>
              {busy ? 'Eva is building the operating plan…' : 'Build My 0→$1M Plan'}
            </button>
          </div>

          <div style={{ background: '#fff', border: '1px solid #D4CFC5', borderRadius: 20, padding: 20, minHeight: 760 }}>
            {!plan && <Empty />}
            {plan?.error && <div style={{ color: '#982F2F', fontWeight: 900 }}>{plan.error}</div>}
            {plan && !plan.error && <PlanPanel plan={plan} />}
          </div>
        </div>
      </section>

      <section style={{ padding: '70px 20px', background: '#0B1713' }}>
        <div style={{ maxWidth: 1120, margin: '0 auto' }}>
          <div style={eyebrow}>THE RULES</div>
          <h2 style={{ ...sectionTitle, color: '#fff', maxWidth: 850 }}>White-belt curiosity. Black-belt evidence discipline.</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: 11, marginTop: 23 }}>
            {[
              ['ONE PRIMARY OFFER', 'Secondary ideas wait until the main offer has repeated sales.'],
              ['PROOF > HYPE', 'Show what was built, sold or achieved. Never ask the adjective to do the evidence’s job.'],
              ['MORE USEFUL INTERACTIONS', 'Customers, partners, operators and investors create surface area for opportunity.'],
              ['REINVEST WITH A RECEIPT', 'Increase spending only after a channel, tool or hire shows measurable value.'],
              ['FOUNDER STAYS CLOSE', 'Early objections, calls and customer outcomes are strategic data.'],
              ['CUT DISTRACTIONS FAST', 'Every week ends with one winning constraint and a shorter list.'],
            ].map(([title, text]) => <article key={title} style={{ border: '1px solid #294036', borderRadius: 16, padding: 17, background: '#0D1D18' }}><div style={{ color: '#9EF0CF', fontWeight: 950, fontSize: 12 }}>{title}</div><p style={{ color: '#B9C9C1', lineHeight: 1.55, fontSize: 13 }}>{text}</p></article>)}
          </div>
        </div>
      </section>

      <style>{`@media(max-width:860px){.million-grid{grid-template-columns:1fr !important}}`}</style>
    </main>
  );
}

function PlanPanel({ plan }: { plan: Plan }) {
  const math = plan.revenue_math;
  return <div>
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'start', flexWrap: 'wrap' }}>
      <div><div style={{ color: '#347460', fontWeight: 950, fontSize: 11 }}>CURRENT STAGE</div><h3 style={{ fontSize: 32, margin: '5px 0 0' }}>{plan.stage?.name}</h3><p style={{ ...body, marginTop: 7 }}>{plan.stage?.mission}</p></div>
      <div style={{ borderRadius: 999, background: '#071A14', color: '#9EF0CF', padding: '10px 13px', fontWeight: 950, fontSize: 12 }}>{plan.mode === 'ai-assisted' ? 'EVA ASSISTED' : 'OPERATING MATH'}</div>
    </div>

    <Output label="Your edge" value={plan.edge} />
    <Output label="One primary offer" value={plan.primary_offer} />
    <Output label="Current bottleneck" value={plan.bottleneck} accent />

    {math && <div style={{ background: '#F2F7F4', border: '1px solid #CFE1D8', borderRadius: 15, padding: 16, marginTop: 16 }}>
      <div style={{ fontSize: 11, fontWeight: 950, color: '#347460' }}>REVENUE MATH</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(125px,1fr))', gap: 9, marginTop: 10 }}>
        <Metric label="Now" value={money(math.current_monthly_revenue)} />
        <Metric label="Next target" value={money(math.next_monthly_target)} />
        <Metric label="Price" value={money(math.price)} />
        <Metric label="Customers needed" value={String(math.customers_needed_at_price)} />
        <Metric label="Additional" value={String(math.additional_customers_needed)} />
        <Metric label="Sales talks / week" value={String(math.suggested_weekly_sales_conversations)} />
      </div>
    </div>}

    <ListBlock label="7-day sprint" items={plan.seven_day_sprint || []} numbered />
    <ListBlock label="Manufacture luck" items={plan.manufacture_luck || []} />
    <Output label="Reinvestment rule" value={plan.reinvestment_rule} />
    <ListBlock label="Stop doing" items={plan.stop_doing || []} />
    <ListBlock label="Weekly scorecard" items={plan.scorecard || []} />
  </div>;
}

function Empty() {
  return <div style={{ minHeight: 710, display: 'grid', placeItems: 'center' }}><div style={{ maxWidth: 470, textAlign: 'center' }}><div style={{ width: 65, height: 65, borderRadius: 999, background: '#E0F7EC', display: 'grid', placeItems: 'center', margin: '0 auto', fontSize: 26 }}>↗</div><h3 style={{ fontSize: 28, marginBottom: 8 }}>Ready to pick the rung.</h3><p style={{ ...body, fontSize: 15 }}>Run the Aridon sample or replace it with any customer business. Eva will choose the stage, bottleneck, revenue math and seven-day sprint.</p></div></div>;
}

function Field({ label, value, setValue, multiline = false }: { label: string; value: string; setValue: (v: string) => void; multiline?: boolean }) {
  return <label style={{ display: 'grid', gap: 6, marginBottom: 12, fontSize: 12, fontWeight: 900 }}><span>{label}</span>{multiline ? <textarea value={value} onChange={(e) => setValue(e.target.value)} rows={3} style={inputStyle} /> : <input value={value} onChange={(e) => setValue(e.target.value)} style={inputStyle} />}</label>;
}
function NumberField({ label, value, setValue, prefix }: { label: string; value: string; setValue: (v: string) => void; prefix?: string }) {
  return <label style={{ display: 'grid', gap: 6, marginBottom: 12, fontSize: 12, fontWeight: 900 }}><span>{label}</span><div style={{ display: 'flex', alignItems: 'center', border: '1px solid #C8C3BA', borderRadius: 10, background: '#fff' }}>{prefix && <span style={{ paddingLeft: 10, color: '#777' }}>{prefix}</span>}<input type="number" min="0" value={value} onChange={(e) => setValue(e.target.value)} style={{ ...inputStyle, border: 0, flex: 1, minWidth: 0 }} /></div></label>;
}
function Output({ label, value, accent = false }: { label: string; value?: string; accent?: boolean }) {
  if (!value) return null;
  return <div style={{ borderTop: '1px solid #E5E0D7', padding: '13px 0' }}><div style={{ color: accent ? '#196A4C' : '#79736A', fontSize: 11, fontWeight: 950 }}>{label.toUpperCase()}</div><div style={{ marginTop: 5, lineHeight: 1.55, fontWeight: accent ? 900 : 650 }}>{value}</div></div>;
}
function Metric({ label, value }: { label: string; value: string }) { return <div style={{ background: '#fff', borderRadius: 11, padding: 11, border: '1px solid #D7E3DC' }}><div style={{ fontSize: 10, color: '#6C776F', fontWeight: 900 }}>{label.toUpperCase()}</div><div style={{ fontSize: 20, fontWeight: 950, marginTop: 3 }}>{value}</div></div>; }
function ListBlock({ label, items, numbered = false }: { label: string; items: string[]; numbered?: boolean }) {
  if (!items.length) return null;
  return <div style={{ marginTop: 16 }}><div style={{ color: '#347460', fontSize: 11, fontWeight: 950 }}>{label.toUpperCase()}</div><div style={{ marginTop: 7 }}>{items.map((item, i) => <div key={`${item}-${i}`} style={{ display: 'flex', gap: 9, borderTop: '1px solid #ECE7DE', padding: '9px 0', lineHeight: 1.5, fontSize: 13 }}><strong style={{ color: '#347460', minWidth: 20 }}>{numbered ? `${i + 1}.` : '✓'}</strong><span>{item}</span></div>)}</div></div>;
}
function money(n: number) { return `$${Math.round(n || 0).toLocaleString()}`; }

const inputStyle = { width: '100%', boxSizing: 'border-box' as const, border: '1px solid #C8C3BA', borderRadius: 10, padding: '11px 12px', fontFamily: 'inherit', fontSize: 14, resize: 'vertical' as const, background: '#fff', color: '#171717' };
const eyebrow = { color: '#9EF0CF', fontSize: 12, fontWeight: 950, letterSpacing: 1 };
const lightEyebrow = { color: '#347460', fontSize: 12, fontWeight: 950, letterSpacing: 1 };
const sectionTitle = { fontSize: 'clamp(35px,5vw,56px)', lineHeight: 1, letterSpacing: -2, margin: '10px 0 14px' };
const body = { color: '#5E5A52', lineHeight: 1.65 };
const outlineButton = { display: 'inline-block', border: '1px solid #426557', color: '#F7FAF8', padding: '10px 14px', borderRadius: 10, textDecoration: 'none', fontWeight: 900 };
