'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { directCheckout } from '../../../lib/directCheckout';

function clampNumber(value: string, fallback: number, min = 0, max = 1000000) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
}

function dollars(value: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
}

export default function BusinessOSRevenuePage() {
  const [jobValue, setJobValue] = useState('1500');
  const [monthlyLeads, setMonthlyLeads] = useState('40');
  const [closeRate, setCloseRate] = useState('30');
  const [closeLift, setCloseLift] = useState('5');
  const [hoursSaved, setHoursSaved] = useState('5');
  const [hourValue, setHourValue] = useState('40');

  const result = useMemo(() => {
    const avgJob = clampNumber(jobValue, 1500);
    const leads = clampNumber(monthlyLeads, 40);
    const currentRate = clampNumber(closeRate, 30, 0, 100) / 100;
    const lift = clampNumber(closeLift, 5, 0, 100) / 100;
    const saved = clampNumber(hoursSaved, 5, 0, 168);
    const hourly = clampNumber(hourValue, 40);
    const currentWins = leads * currentRate;
    const additionalWins = leads * lift;
    const extraMonthlyRevenue = additionalWins * avgJob;
    const extraAnnualRevenue = extraMonthlyRevenue * 12;
    const annualCapacityValue = saved * hourly * 52;
    return { currentWins, additionalWins, extraMonthlyRevenue, extraAnnualRevenue, annualCapacityValue };
  }, [jobValue, monthlyLeads, closeRate, closeLift, hoursSaved, hourValue]);

  return (
    <main style={{ minHeight: '100vh', background: '#F5F2EA', color: '#171717', fontFamily: 'Arial, sans-serif' }}>
      <section style={{ maxWidth: '1120px', margin: '0 auto', padding: '28px 20px 72px' }}>
        <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <Link href="/business-os" style={{ fontWeight: 950, color: '#171717', textDecoration: 'none' }}>PRIVATE BUSINESS OS</Link>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}><Link href="/business-os/beta" style={outlineButton}>Start Free</Link><a href={directCheckout.growth.url} style={darkButton}>Get Growth · $99/mo</a></div>
        </nav>

        <div style={{ paddingTop: '58px', maxWidth: '920px' }}>
          <div style={eyebrow}>REVENUE WORKSHEET FOR OWNER-LED BUSINESSES</div>
          <h1 style={{ fontSize: 'clamp(46px,8vw,82px)', letterSpacing: '-3px', lineHeight: .96, margin: '14px 0 22px' }}>What is one better follow-up worth to your business?</h1>
          <p style={{ fontSize: '20px', lineHeight: 1.65, color: '#4D4A43', maxWidth: '820px' }}>Business OS is designed to help you respond faster, follow up consistently, research new prospects, and keep revenue-producing work from getting buried under daily admin. Put your own numbers below and see the size of the opportunity.</p>
        </div>

        <section className="revenue-grid" style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(340px,.8fr)', gap: '18px', alignItems: 'start', marginTop: '32px' }}>
          <div style={panel}>
            <h2 style={{ margin: '0 0 6px', fontSize: '30px' }}>Use your business numbers</h2>
            <p style={muted}>This is a planning estimate, not a promise of results.</p>
            <div className="input-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: '12px', marginTop: '18px' }}>
              <Field label="Average job / sale value" prefix="$" value={jobValue} onChange={setJobValue} />
              <Field label="New leads or inquiries each month" value={monthlyLeads} onChange={setMonthlyLeads} />
              <Field label="Current close rate" suffix="%" value={closeRate} onChange={setCloseRate} />
              <Field label="Possible close-rate improvement" suffix=" percentage points" value={closeLift} onChange={setCloseLift} />
              <Field label="Admin hours Business OS could save weekly" value={hoursSaved} onChange={setHoursSaved} />
              <Field label="Value of an owner/team hour" prefix="$" value={hourValue} onChange={setHourValue} />
            </div>
          </div>

          <aside style={{ ...panel, background: '#171717', color: '#fff', position: 'sticky', top: '18px' }}>
            <div style={{ color: '#A4F3D3', fontSize: '12px', fontWeight: 950 }}>ESTIMATED OPPORTUNITY</div>
            <Metric label="Extra wins per month" value={result.additionalWins.toFixed(1)} />
            <Metric label="Potential extra monthly revenue" value={dollars(result.extraMonthlyRevenue)} />
            <Metric label="Potential extra annual revenue" value={dollars(result.extraAnnualRevenue)} />
            <Metric label="Annual capacity value from saved time" value={dollars(result.annualCapacityValue)} />
            <p style={{ color: '#BFC6CF', fontSize: '12px', lineHeight: 1.55, marginTop: '14px' }}>Actual results depend on lead quality, pricing, capacity, margins, customer demand, and how consistently your team uses the system. Revenue is not guaranteed.</p>
          </aside>
        </section>
      </section>

      <section style={{ background: '#171717', color: '#fff', padding: '70px 20px' }}>
        <div style={{ maxWidth: '1120px', margin: '0 auto' }}>
          <div style={{ color: '#A4F3D3', fontSize: '12px', fontWeight: 950 }}>WHERE THE MONEY CAN COME FROM</div>
          <h2 style={{ fontSize: 'clamp(34px,5vw,54px)', margin: '10px 0 26px', maxWidth: '820px' }}>Not magic. Better execution on work that already matters.</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: '12px' }}>
            <ValueCard title="Recover quiet estimates" text="Create follow-up drafts and reminders so good opportunities do not quietly expire in an inbox." />
            <ValueCard title="Respond while the lead is warm" text="Turn rough notes into a clean customer reply or proposal follow-up without starting from a blank page." />
            <ValueCard title="Find new buyers" text="Use Scout to research companies that fit what you sell and prepare outreach for your review." />
            <ValueCard title="Reactivate old customers" text="Build service reminders, maintenance outreach, and repeat-work campaigns from customer opportunities you already understand." />
            <ValueCard title="Protect owner time" text="Use Eva to organize priorities, write first drafts, research decisions, and reduce hours spent bouncing between tabs and notes." />
            <ValueCard title="Keep next actions visible" text="Projects, tasks, company knowledge, sales research, and decisions live in one private business workspace." />
          </div>
        </div>
      </section>

      <section style={{ padding: '68px 20px', background: '#DDE9FF' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: 'clamp(38px,6vw,60px)', lineHeight: 1, margin: '0 0 16px' }}>Put it against one real business problem.</h2>
          <p style={{ color: '#3E4756', fontSize: '18px', lineHeight: 1.6 }}>Create the free workspace and give Eva or Scout something real: an estimate that needs follow-up, a prospect list you need built, a proposal you need written, or a week that feels out of control.</p>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap', marginTop: '20px' }}><Link href="/business-os/beta" style={darkButton}>Build My Free Business OS</Link><a href={directCheckout.growth.url} style={outlineButton}>Subscribe to Growth · $99/mo</a></div>
        </div>
      </section>

      <style>{`@media(max-width:820px){.revenue-grid{grid-template-columns:1fr !important}.revenue-grid aside{position:static !important}.input-grid{grid-template-columns:1fr !important}}`}</style>
    </main>
  );
}

function Field({ label, value, onChange, prefix, suffix }: { label: string; value: string; onChange: (value: string) => void; prefix?: string; suffix?: string }) {
  return <label style={{ display: 'grid', gap: '7px', fontWeight: 850, fontSize: '13px' }}><span>{label}</span><div style={{ display: 'flex', alignItems: 'center', border: '1px solid #C7C0B3', borderRadius: '11px', background: '#fff', overflow: 'hidden' }}>{prefix && <span style={{ paddingLeft: '12px', color: '#6A675F' }}>{prefix}</span>}<input inputMode="decimal" value={value} onChange={(event) => onChange(event.target.value.replace(/[^0-9.]/g, ''))} style={{ width: '100%', border: 0, outline: 0, padding: '13px 12px', fontSize: '16px', background: 'transparent' }} />{suffix && <span style={{ paddingRight: '12px', color: '#6A675F', whiteSpace: 'nowrap' }}>{suffix}</span>}</div></label>;
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div style={{ borderTop: '1px solid #353535', padding: '16px 0' }}><div style={{ color: '#BFC6CF', fontSize: '12px', fontWeight: 800 }}>{label}</div><div style={{ fontSize: 'clamp(28px,5vw,42px)', fontWeight: 950, marginTop: '4px' }}>{value}</div></div>;
}

function ValueCard({ title, text }: { title: string; text: string }) {
  return <article style={{ background: '#222', border: '1px solid #333', borderRadius: '16px', padding: '18px' }}><h3 style={{ margin: '0 0 7px' }}>{title}</h3><p style={{ color: '#C5C5C0', lineHeight: 1.6, margin: 0 }}>{text}</p></article>;
}

const panel = { background: '#fff', border: '1px solid #D0CBC0', borderRadius: '18px', padding: '22px', boxShadow: '0 18px 50px rgba(0,0,0,.06)' };
const muted = { color: '#666159', lineHeight: 1.6, margin: 0 };
const eyebrow = { fontSize: '12px', fontWeight: 950, letterSpacing: '1px' };
const darkButton = { display: 'inline-block', background: '#171717', color: '#fff', padding: '13px 17px', borderRadius: '11px', textDecoration: 'none', fontWeight: 950 };
const outlineButton = { display: 'inline-block', border: '1px solid #8E877C', color: '#171717', padding: '12px 16px', borderRadius: '11px', textDecoration: 'none', fontWeight: 900 };
