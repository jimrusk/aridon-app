'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { approvalPolicy, aridonSearchBattlegrounds, growthModules, landingPageMatrix } from '../../../lib/growthCommand';

const statusLabel = { active: 'ACTIVE', ready: 'READY', connector: 'CONNECTOR NEEDED' } as const;

export default function GrowthCommandPage() {
  const [query, setQuery] = useState('municipal drought solutions');
  const [audience, setAudience] = useState('City managers and water utility leaders');
  const [goal, setGoal] = useState('Book a pilot discovery call');

  const campaign = useMemo(() => {
    const topic = query.trim() || 'water resilience';
    const who = audience.trim() || 'qualified buyers';
    const outcome = goal.trim() || 'start a qualified conversation';
    return {
      page: `${titleCase(topic)} | Aridon`,
      brief: `Executive brief: how Aridon can help ${who.toLowerCase()} address ${topic} with a measurable pilot path.`,
      outreach: `Build a targeted outreach sequence for ${who.toLowerCase()} focused on ${topic}, with the primary CTA to ${outcome.toLowerCase()}.`,
      pr: `Find current reporters and trade publications covering ${topic}, then prepare a fact-checked Aridon angle for approval.`,
      measure: `Track qualified visits → form starts → meetings → proposals → pipeline influenced.`,
    };
  }, [query, audience, goal]);

  return (
    <main style={{ minHeight: '100vh', background: '#07101D', color: '#F7FAFC', fontFamily: 'Arial, sans-serif' }}>
      <section style={{ maxWidth: 1220, margin: '0 auto', padding: '24px 20px 72px' }}>
        <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <Link href="/business-os" style={{ color: '#F7FAFC', textDecoration: 'none', fontWeight: 950 }}>ARIDON · EXECUTIVE OS</Link>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <Link href="/business-os/revenue" style={outlineButton}>Revenue</Link>
            <Link href="/business-os/beta" style={mintButton}>Open Workspace</Link>
          </div>
        </nav>

        <div style={{ maxWidth: 940, paddingTop: 62 }}>
          <div style={eyebrow}>ARIDON GROWTH COMMAND</div>
          <h1 style={{ fontSize: 'clamp(46px,7vw,82px)', lineHeight: .94, letterSpacing: -3, margin: '14px 0 22px' }}>From market signal to revenue action.</h1>
          <p style={{ fontSize: 20, lineHeight: 1.65, color: '#B9C5D6', maxWidth: 860 }}>A coordinated growth layer for SEO, AI visibility, competitors, content, PR, authority, ads, conversion and revenue attribution. Research and drafting can move quickly. External sends, spend and consequential changes stay behind owner approval.</p>
        </div>

        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: 12, marginTop: 30 }}>
          <Metric label="Growth modules" value={String(growthModules.length)} detail="One operating system" />
          <Metric label="Priority search battles" value={String(aridonSearchBattlegrounds.length)} detail="Water, resilience, data centers" />
          <Metric label="Market page clusters" value={String(landingPageMatrix.length)} detail="Buyer + geography coverage" />
          <Metric label="Owner control" value="ON" detail="Approval gates preserved" />
        </section>
      </section>

      <section style={{ background: '#F4F1E9', color: '#171717', padding: '72px 20px' }}>
        <div style={{ maxWidth: 1220, margin: '0 auto' }}>
          <div style={{ maxWidth: 820 }}><div style={lightEyebrow}>THE GROWTH STACK</div><h2 style={sectionTitle}>Ten coordinated engines. One revenue picture.</h2><p style={body}>Each module has a specific owner and job. The goal is not more dashboards. The goal is to convert external signals into a clear next action for the executive team.</p></div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(270px,1fr))', gap: 12, marginTop: 26 }}>
            {growthModules.map((module) => (
              <article key={module.id} style={{ background: '#fff', border: '1px solid #D1CBC0', borderRadius: 18, padding: 18 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'start' }}>
                  <div><div style={{ fontWeight: 950, fontSize: 21 }}>{module.name}</div><div style={{ color: '#6F6A61', fontSize: 12, marginTop: 4 }}>{module.owner}</div></div>
                  <span style={{ fontSize: 10, fontWeight: 950, background: module.status === 'active' ? '#DDF7EA' : module.status === 'ready' ? '#E5EDFF' : '#FFF1C7', padding: '6px 8px', borderRadius: 999 }}>{statusLabel[module.status]}</span>
                </div>
                <p style={{ ...body, fontSize: 14 }}>{module.mission}</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>{module.metrics.map((metric) => <span key={metric} style={tag}>{metric}</span>)}</div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section style={{ padding: '72px 20px', background: '#0D1728' }}>
        <div style={{ maxWidth: 1220, margin: '0 auto' }}>
          <div style={{ maxWidth: 820 }}><div style={eyebrow}>CAMPAIGN FACTORY</div><h2 style={{ ...sectionTitle, color: '#fff' }}>Turn one market opportunity into a coordinated campaign.</h2><p style={{ ...body, color: '#BAC5D5' }}>This planner creates the operating brief. Live search, ad, analytics and publishing connectors can plug into the same workflow as they are approved.</p></div>
          <div className="growth-grid" style={{ display: 'grid', gridTemplateColumns: 'minmax(0,.72fr) minmax(0,1.28fr)', gap: 16, marginTop: 26 }}>
            <div style={darkPanel}>
              <Field label="Market problem / keyword" value={query} setValue={setQuery} />
              <Field label="Target buyer" value={audience} setValue={setAudience} />
              <Field label="Desired outcome" value={goal} setValue={setGoal} />
            </div>
            <div style={darkPanel}>
              <Output label="Landing page" value={campaign.page} />
              <Output label="Executive brief" value={campaign.brief} />
              <Output label="Outbound campaign" value={campaign.outreach} />
              <Output label="Digital PR" value={campaign.pr} />
              <Output label="Revenue measurement" value={campaign.measure} />
            </div>
          </div>
        </div>
      </section>

      <section style={{ background: '#DDE9FF', color: '#171717', padding: '72px 20px' }}>
        <div style={{ maxWidth: 1220, margin: '0 auto' }}>
          <div style={{ maxWidth: 850 }}><div style={lightEyebrow}>AI + SEARCH VISIBILITY</div><h2 style={sectionTitle}>Own the questions that can create an Aridon conversation.</h2></div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 10, marginTop: 22 }}>
            {aridonSearchBattlegrounds.map((item, index) => <div key={item} style={{ background: '#fff', border: '1px solid #BFCDE2', borderRadius: 15, padding: 16, display: 'flex', gap: 11 }}><span style={{ fontWeight: 950, color: '#2B5CA8' }}>{String(index + 1).padStart(2, '0')}</span><strong>{item}</strong></div>)}
          </div>
        </div>
      </section>

      <section style={{ background: '#F4F1E9', color: '#171717', padding: '72px 20px' }}>
        <div style={{ maxWidth: 1220, margin: '0 auto' }}>
          <div style={{ maxWidth: 820 }}><div style={lightEyebrow}>PROGRAMMATIC MARKET COVERAGE</div><h2 style={sectionTitle}>Build a search net, not a single product page.</h2></div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 12, marginTop: 24 }}>
            {landingPageMatrix.map((cluster) => <article key={cluster.market} style={{ background: '#fff', border: '1px solid #D1CBC0', borderRadius: 17, padding: 18 }}><h3 style={{ marginTop: 0 }}>{cluster.market}</h3>{cluster.pages.map((page) => <div key={page} style={{ borderTop: '1px solid #ECE7DE', padding: '9px 0', color: '#4D4941' }}>→ {page}</div>)}</article>)}
          </div>
        </div>
      </section>

      <section style={{ padding: '72px 20px', background: '#171717' }}>
        <div style={{ maxWidth: 1120, margin: '0 auto' }}>
          <div style={{ maxWidth: 820 }}><div style={eyebrow}>CONTROLLED AUTONOMY</div><h2 style={{ ...sectionTitle, color: '#fff' }}>Fast where it is safe. Approval where authority matters.</h2></div>
          <div className="growth-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 14, marginTop: 24 }}>
            <Policy title="Can move automatically" items={approvalPolicy.automatic} accent="#9EF0CF" />
            <Policy title="Owner approval required" items={approvalPolicy.approvalRequired} accent="#F4D06F" />
          </div>
          <div style={{ marginTop: 28, display: 'flex', gap: 10, flexWrap: 'wrap' }}><Link href="/business-os/beta" style={mintButton}>Open Executive Workspace</Link><Link href="/business-os" style={outlineButton}>Back to Executive OS</Link></div>
        </div>
      </section>

      <style>{`@media(max-width:820px){.growth-grid{grid-template-columns:1fr !important}}`}</style>
    </main>
  );
}

function Metric({ label, value, detail }: { label: string; value: string; detail: string }) { return <div style={{ background: '#0D1728', border: '1px solid #2A3A57', borderRadius: 16, padding: 18 }}><div style={{ color: '#93A3BA', fontSize: 11, fontWeight: 900 }}>{label.toUpperCase()}</div><div style={{ fontSize: 36, fontWeight: 950, margin: '5px 0' }}>{value}</div><div style={{ color: '#B9C5D6', fontSize: 13 }}>{detail}</div></div>; }
function Field({ label, value, setValue }: { label: string; value: string; setValue: (value: string) => void }) { return <label style={{ display: 'grid', gap: 7, marginBottom: 14, fontWeight: 900, fontSize: 12 }}><span>{label}</span><input value={value} onChange={(e) => setValue(e.target.value)} style={{ border: '1px solid #36445B', background: '#07101D', color: '#fff', borderRadius: 11, padding: '13px 12px', fontSize: 15, outline: 0 }} /></label>; }
function Output({ label, value }: { label: string; value: string }) { return <div style={{ borderTop: '1px solid #2C3A50', padding: '13px 0' }}><div style={{ color: '#9EF0CF', fontSize: 11, fontWeight: 950 }}>{label.toUpperCase()}</div><div style={{ color: '#E8EDF5', lineHeight: 1.55, marginTop: 5 }}>{value}</div></div>; }
function Policy({ title, items, accent }: { title: string; items: string[]; accent: string }) { return <article style={{ border: '1px solid #353535', borderRadius: 16, padding: 19 }}><h3 style={{ color: accent, marginTop: 0 }}>{title}</h3>{items.map((item) => <div key={item} style={{ borderTop: '1px solid #2C2C2C', padding: '10px 0', color: '#D5D5D1' }}>✓ {item}</div>)}</article>; }
function titleCase(value: string) { return value.replace(/\b\w/g, (letter) => letter.toUpperCase()); }

const eyebrow = { fontSize: 12, fontWeight: 950, color: '#9EF0CF', letterSpacing: 1 };
const lightEyebrow = { fontSize: 12, fontWeight: 950, letterSpacing: 1 };
const sectionTitle = { fontSize: 'clamp(36px,5vw,58px)', lineHeight: 1, letterSpacing: -2, margin: '10px 0 14px' };
const body = { color: '#5D5951', lineHeight: 1.65 };
const darkPanel = { background: '#121E30', border: '1px solid #2B3A53', borderRadius: 18, padding: 20 };
const tag = { background: '#F0EEE8', borderRadius: 999, padding: '6px 8px', fontSize: 11, fontWeight: 850 };
const mintButton = { display: 'inline-block', background: '#9EF0CF', color: '#07130F', padding: '12px 16px', borderRadius: 11, textDecoration: 'none', fontWeight: 950 };
const outlineButton = { display: 'inline-block', border: '1px solid #52627A', color: '#F7FAFC', padding: '11px 15px', borderRadius: 11, textDecoration: 'none', fontWeight: 900 };
