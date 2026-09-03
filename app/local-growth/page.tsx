'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

type WebsiteReport = {
  healthScore?: number;
  headline?: string;
  summary?: string;
  priorities?: string[];
  opportunities?: string[];
  website?: {
    reachable?: boolean;
    statusCode?: number | null;
    title?: string | null;
    metaDescription?: string | null;
    canonical?: string | null;
    h1Count?: number;
    noindex?: boolean;
  };
};

type LocalGrowthState = {
  businessName: string;
  website: string;
  industry: string;
  city: string;
  monthlyViews: number;
  calls: number;
  estimates: number;
  sales: number;
  revenue: number;
  rating: number;
  reviewCount: number;
  unansweredReviews: number;
};

const defaults: LocalGrowthState = {
  businessName: '',
  website: '',
  industry: 'Plumbing',
  city: 'Farmington, NM',
  monthlyViews: 1000,
  calls: 45,
  estimates: 24,
  sales: 11,
  revenue: 18000,
  rating: 4.4,
  reviewCount: 68,
  unansweredReviews: 7,
};

const plans = [
  { name: 'Starter', price: '$199/mo', line: 'Visibility + reputation basics', items: ['Google profile operating checklist', 'Review response queue', 'Website health monitoring', 'Monthly growth score'] },
  { name: 'Growth', price: '$499/mo', line: 'Local traffic + content + lead measurement', items: ['Everything in Starter', 'Content interview factory', 'Local SEO campaign planner', 'Lead funnel dashboard', 'Conversion recommendations'] },
  { name: 'Aridon Business', price: '$999/mo', line: 'Growth connected to the operating system', items: ['Everything in Growth', 'CRM + follow-up workflows', 'Scheduling and estimating layer', 'Executive OS workspace', 'Revenue attribution view'] },
  { name: 'Managed Growth', price: '$1,500–$3,000/mo', line: 'Aridon runs the growth desk with approval gates', items: ['Campaign production', 'Content repurposing', 'Local offer testing', 'Reputation workflow', 'Owner approval before external actions'] },
];

export default function LocalGrowthPage() {
  const [state, setState] = useState<LocalGrowthState>(defaults);
  const [report, setReport] = useState<WebsiteReport | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem('aridon-local-growth');
      if (raw) setState({ ...defaults, ...JSON.parse(raw) });
    } catch {
      // Browser storage is optional. The page remains fully usable without it.
    }
  }, []);

  const metrics = useMemo(() => buildMetrics(state, report), [state, report]);
  const questions = useMemo(() => interviewQuestions(state), [state]);
  const recommendations = useMemo(() => buildRecommendations(state, metrics, report), [state, metrics, report]);
  const content = useMemo(() => contentPack(state), [state]);

  function update<K extends keyof LocalGrowthState>(key: K, value: LocalGrowthState[K]) {
    setState((current) => ({ ...current, [key]: value }));
    setSaved(false);
  }

  function saveSnapshot() {
    try {
      window.localStorage.setItem('aridon-local-growth', JSON.stringify(state));
      setSaved(true);
      window.setTimeout(() => setSaved(false), 1800);
    } catch {
      setError('This browser blocked local storage. Your numbers are still available on this screen.');
    }
  }

  async function scanWebsite() {
    if (!state.website.trim()) {
      setError('Add the business website first so Aridon has something to scan.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const response = await fetch('/api/marketing-autopilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessName: state.businessName.trim() || 'Local Business', website: state.website.trim() }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || 'Website scan failed.');
      setReport(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Website scan failed.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main style={page}>
      <div style={shell}>
        <header style={header}>
          <div>
            <div style={eyebrow}>ARIDON · LOCAL GROWTH OS</div>
            <h1 style={hero}>Turn local attention into booked jobs, then show the owner exactly where the money came from.</h1>
            <p style={lead}>A practical operating layer for local businesses: visibility, reputation, conversion, content and lead economics. The first live connector is Aridon&apos;s website scan. Google Business, call tracking and publishing remain clearly marked as connector work until they are connected.</p>
          </div>
          <div style={navButtons}>
            <Link href="/marketing-autopilot" style={ghostButton}>Marketing Autopilot</Link>
            <Link href="/business-os/growth-command" style={ghostButton}>Growth Command</Link>
            <Link href="/business-os" style={mintButton}>Business OS</Link>
          </div>
        </header>

        <section style={intakeCard}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'start', flexWrap: 'wrap' }}>
            <div>
              <div style={eyebrow}>BUSINESS SNAPSHOT</div>
              <h2 style={sectionTitle}>Give Aridon the numbers the owner already understands.</h2>
              <p style={muted}>Start with what is known. Perfect analytics can come later. The purpose is to expose the biggest leak in the customer journey now.</p>
            </div>
            <button onClick={saveSnapshot} style={smallButton}>{saved ? 'Saved ✓' : 'Save snapshot'}</button>
          </div>

          <div style={formGrid}>
            <Field label="Business name" value={state.businessName} onChange={(value) => update('businessName', value)} placeholder="ABC Plumbing" />
            <Field label="Website" value={state.website} onChange={(value) => update('website', value)} placeholder="https://example.com" />
            <Field label="Industry" value={state.industry} onChange={(value) => update('industry', value)} placeholder="Plumbing" />
            <Field label="City / market" value={state.city} onChange={(value) => update('city', value)} placeholder="Farmington, NM" />
            <NumberField label="Monthly Google / local views" value={state.monthlyViews} onChange={(value) => update('monthlyViews', value)} />
            <NumberField label="Calls / leads" value={state.calls} onChange={(value) => update('calls', value)} />
            <NumberField label="Estimates / appointments" value={state.estimates} onChange={(value) => update('estimates', value)} />
            <NumberField label="Closed jobs" value={state.sales} onChange={(value) => update('sales', value)} />
            <NumberField label="Revenue from those jobs" value={state.revenue} onChange={(value) => update('revenue', value)} prefix="$" />
            <NumberField label="Google rating" value={state.rating} onChange={(value) => update('rating', value)} step="0.1" />
            <NumberField label="Total reviews" value={state.reviewCount} onChange={(value) => update('reviewCount', value)} />
            <NumberField label="Unanswered reviews" value={state.unansweredReviews} onChange={(value) => update('unansweredReviews', value)} />
          </div>

          <div style={{ display: 'flex', gap: 9, flexWrap: 'wrap', marginTop: 14 }}>
            <button onClick={scanWebsite} disabled={busy} style={{ ...primaryButton, opacity: busy ? .7 : 1, cursor: busy ? 'wait' : 'pointer' }}>{busy ? 'Scanning…' : 'Run live website scan'}</button>
            <Link href="/growth-audit" style={secondaryButton}>Open full Growth Audit</Link>
          </div>
          {error ? <div style={errorBox}>{error}</div> : null}
        </section>

        <section style={metricGrid}>
          <Metric label="Growth score" value={`${metrics.score}/100`} detail={metrics.scoreLine} />
          <Metric label="View → lead" value={`${metrics.viewToLead}%`} detail="Local attention becoming inquiries" />
          <Metric label="Lead → estimate" value={`${metrics.leadToEstimate}%`} detail="Inquiry handling / qualification" />
          <Metric label="Estimate → sale" value={`${metrics.estimateToSale}%`} detail="Offer + trust + close rate" />
          <Metric label="Revenue / sale" value={money(metrics.revenuePerSale)} detail="Average realized job value" />
          <Metric label="Revenue / 1,000 views" value={money(metrics.revenuePerThousand)} detail="One simple local-market efficiency number" />
        </section>

        <section style={twoCol}>
          <article style={card}>
            <div style={eyebrow}>LEAK DETECTOR</div>
            <h2 style={sectionTitle}>Fix the biggest revenue leak first.</h2>
            <div style={{ display: 'grid', gap: 9 }}>
              {recommendations.map((item, index) => (
                <div key={item.title} style={recommendationCard}>
                  <div style={rank}>{index + 1}</div>
                  <div><strong style={{ fontSize: 17 }}>{item.title}</strong><div style={mutedSmall}>{item.detail}</div></div>
                </div>
              ))}
            </div>
          </article>

          <article style={card}>
            <div style={eyebrow}>LIVE WEBSITE EVIDENCE</div>
            <h2 style={sectionTitle}>{report?.headline || 'Run the scan to replace guesswork with evidence.'}</h2>
            {report ? (
              <>
                <div style={websiteScore}>{report.healthScore ?? '—'}</div>
                <p style={muted}>{report.summary || 'Aridon completed the website scan.'}</p>
                <Evidence label="Reachable" value={report.website?.reachable ? `Yes · ${report.website.statusCode ?? ''}` : 'No / unknown'} />
                <Evidence label="Title" value={report.website?.title || 'Missing'} />
                <Evidence label="Meta description" value={report.website?.metaDescription ? 'Present' : 'Missing'} />
                <Evidence label="Canonical" value={report.website?.canonical ? 'Present' : 'Missing'} />
                <Evidence label="Indexing signal" value={report.website?.noindex ? 'NOINDEX detected' : 'Indexable signal'} />
              </>
            ) : <p style={muted}>The existing Marketing Autopilot engine checks whether the website is reachable and inspects title, description, canonical, heading and indexing signals. This page uses that same live engine instead of inventing a second scanner.</p>}
          </article>
        </section>

        <section style={lightSection}>
          <div style={{ maxWidth: 820 }}>
            <div style={darkEyebrow}>THE FIVE-MINUTE CONTENT FACTORY</div>
            <h2 style={{ ...sectionTitle, fontSize: 'clamp(34px,5vw,54px)' }}>Let the owner talk. Let Aridon turn the conversation into useful content.</h2>
            <p style={bodyDark}>Use these questions as the recording script. The answers can become a blog article, FAQ, Google post, email, short videos and sales follow-up without asking the owner to sit down and write.</p>
          </div>
          <div style={questionGrid}>
            {questions.map((question, index) => <div key={question} style={questionCard}><span style={questionNumber}>{index + 1}</span><strong>{question}</strong></div>)}
          </div>
          <div style={{ ...twoCol, marginTop: 14 }}>
            <article style={whiteCard}>
              <div style={darkEyebrow}>CONVERSION PAGE STARTER</div>
              <h3 style={{ fontSize: 28, margin: '8px 0' }}>{content.headline}</h3>
              <p style={bodyDark}>{content.subhead}</p>
              <div style={ctaBox}>{content.cta}</div>
            </article>
            <article style={whiteCard}>
              <div style={darkEyebrow}>15-SECOND LOCAL AD SCRIPT</div>
              <p style={{ ...bodyDark, fontSize: 18, fontWeight: 750 }}>{content.ad}</p>
              <Link href="/video-studio" style={darkButton}>Take this to Video Studio →</Link>
            </article>
          </div>
        </section>

        <section style={card}>
          <div style={eyebrow}>LOCAL GROWTH STACK</div>
          <h2 style={sectionTitle}>One customer journey, not six disconnected marketing toys.</h2>
          <div style={stackGrid}>
            <Stack name="1 · Visibility" status="LIVE + CONNECTORS" text="Website health is live now. Google Business Profile optimization, local ranking and search-term data plug into this layer as connectors are authorized." />
            <Stack name="2 · Reputation" status="READY" text="Review-response operating queue, unanswered-review detection and ethical review-request workflows. No paid or fabricated reviews." />
            <Stack name="3 · Conversion" status="LIVE" text="Track views → calls → estimates → sales → revenue. Surface the step with the highest economic leakage." />
            <Stack name="4 · Content" status="READY" text="Five-question interview framework, article/FAQ/social/video repurposing plan and local offer messaging." />
            <Stack name="5 · Lead Operations" status="BUSINESS OS" text="Connect growth to CRM, scheduling, estimating, follow-up and customer history so marketing stops at revenue, not clicks." />
            <Stack name="6 · Executive Loop" status="LIVE" text="Marketing Autopilot and Growth Command can scan, prioritize and draft. External sends, spend and publishing remain behind approval gates." />
          </div>
        </section>

        <section style={pricingSection}>
          <div style={{ maxWidth: 820 }}>
            <div style={darkEyebrow}>PRODUCT LADDER</div>
            <h2 style={{ ...sectionTitle, fontSize: 'clamp(36px,5vw,56px)' }}>Start with one visible win. Expand when the numbers justify it.</h2>
          </div>
          <div style={pricingGrid}>
            {plans.map((plan, index) => (
              <article key={plan.name} style={{ ...priceCard, borderColor: index === 1 ? '#70C5A4' : '#D2CCC0', background: index === 1 ? '#E8F8F1' : '#fff' }}>
                <div style={darkEyebrow}>{plan.name.toUpperCase()}</div>
                <div style={{ fontSize: 31, fontWeight: 950, marginTop: 6 }}>{plan.price}</div>
                <p style={bodyDark}>{plan.line}</p>
                {plan.items.map((item) => <div key={item} style={planItem}>✓ {item}</div>)}
              </article>
            ))}
          </div>
        </section>

        <section style={footerCta}>
          <div>
            <div style={eyebrow}>NEXT MOVE</div>
            <h2 style={{ ...sectionTitle, marginBottom: 6 }}>Use one local business as the first proof case.</h2>
            <p style={muted}>Run the snapshot, scan the website, pick the biggest leak, implement one fix and measure the result before expanding the engagement.</p>
          </div>
          <div style={navButtons}>
            <Link href="/marketing-autopilot" style={mintButton}>Run Marketing Autopilot</Link>
            <Link href="/business-os/growth-command" style={ghostButton}>Open Growth Command</Link>
          </div>
        </section>
      </div>

      <style>{`@media(max-width:820px){.local-two-col{grid-template-columns:1fr !important}.local-form-grid{grid-template-columns:1fr !important}.local-header{display:block !important}.local-header>div:last-child{margin-top:14px}}`}</style>
    </main>
  );
}

function buildMetrics(state: LocalGrowthState, report: WebsiteReport | null) {
  const safe = (numerator: number, denominator: number) => denominator > 0 ? numerator / denominator : 0;
  const viewToLead = safe(state.calls, state.monthlyViews) * 100;
  const leadToEstimate = safe(state.estimates, state.calls) * 100;
  const estimateToSale = safe(state.sales, state.estimates) * 100;
  const revenuePerSale = safe(state.revenue, state.sales);
  const revenuePerThousand = safe(state.revenue, state.monthlyViews) * 1000;

  const visibility = clamp((viewToLead / 8) * 25, 0, 25);
  const reputation = clamp(((state.rating - 3) / 2) * 16 + Math.min(state.reviewCount / 100, 1) * 6 + (state.unansweredReviews === 0 ? 3 : Math.max(0, 3 - state.unansweredReviews * .3)), 0, 25);
  const conversion = clamp((leadToEstimate / 70) * 12 + (estimateToSale / 55) * 13, 0, 25);
  const website = report?.healthScore != null ? clamp(report.healthScore / 4, 0, 25) : 15;
  const score = Math.round(visibility + reputation + conversion + website);
  const scoreLine = score >= 80 ? 'Strong system. Optimize the weakest stage.' : score >= 60 ? 'Good base with measurable leakage.' : score >= 40 ? 'Several fixable leaks are suppressing revenue.' : 'High upside. Start with the largest bottleneck.';

  return {
    viewToLead: round(viewToLead),
    leadToEstimate: round(leadToEstimate),
    estimateToSale: round(estimateToSale),
    revenuePerSale,
    revenuePerThousand,
    score,
    scoreLine,
  };
}

function buildRecommendations(state: LocalGrowthState, metrics: ReturnType<typeof buildMetrics>, report: WebsiteReport | null) {
  const items: { title: string; detail: string; priority: number }[] = [];
  if (metrics.viewToLead < 4) items.push({ title: 'Conversion page + call path', detail: `Only ${metrics.viewToLead}% of local views are becoming leads. Make the problem, trust signal and call/book action impossible to miss.`, priority: 100 - metrics.viewToLead });
  if (metrics.leadToEstimate < 55) items.push({ title: 'Lead response and qualification', detail: `${metrics.leadToEstimate}% of leads reach an estimate or appointment. Tighten answer speed, scripts, scheduling and follow-up.`, priority: 90 - metrics.leadToEstimate });
  if (metrics.estimateToSale < 40) items.push({ title: 'Offer + estimate follow-up', detail: `${metrics.estimateToSale}% of estimates become jobs. Test proof, guarantee language, financing/payment options and a structured follow-up cadence.`, priority: 85 - metrics.estimateToSale });
  if (state.rating < 4.6 || state.unansweredReviews > 0) items.push({ title: 'Reputation operating queue', detail: `Current rating is ${state.rating.toFixed(1)} with ${state.unansweredReviews} unanswered review${state.unansweredReviews === 1 ? '' : 's'}. Respond consistently and ask real customers for reviews after completed work.`, priority: 82 });
  if (state.reviewCount < 50) items.push({ title: 'Build review depth', detail: `${state.reviewCount} reviews may leave the business looking thin beside an established local competitor. Add an ethical post-job review request workflow.`, priority: 68 });
  if (report?.healthScore != null && report.healthScore < 70) items.push({ title: 'Repair website health signals', detail: `The live website scan scored ${report.healthScore}/100. Work the scan priorities before buying more traffic.`, priority: 95 - report.healthScore / 2 });
  if (report?.website?.noindex) items.push({ title: 'Fix indexing immediately', detail: 'The scan detected a noindex signal. A page asking search engines not to index it cannot win much local search traffic.', priority: 120 });
  if (!items.length) items.push({ title: 'Scale the strongest channel', detail: 'The funnel is healthy enough to test more qualified traffic while preserving the same measurement from view to revenue.', priority: 50 });
  items.push({ title: 'Record the five-question owner interview', detail: `Create a useful ${state.industry.toLowerCase()} article and short-video batch around the questions below, then publish only after review.`, priority: 45 });
  return items.sort((a, b) => b.priority - a.priority).slice(0, 5);
}

function interviewQuestions(state: LocalGrowthState) {
  const industry = state.industry.trim() || 'service';
  const market = state.city.trim() || 'your area';
  return [
    `What is the most common ${industry.toLowerCase()} problem customers in ${market} call you about?`,
    `How can a customer tell whether that problem needs a quick repair or a bigger replacement?`,
    `What does a typical ${industry.toLowerCase()} job cost, and what makes the price move up or down?`,
    `What mistake do customers make before they call a ${industry.toLowerCase()} company?`,
    `What should someone ask before hiring a ${industry.toLowerCase()} provider in ${market}?`,
  ];
}

function contentPack(state: LocalGrowthState) {
  const business = state.businessName.trim() || 'Your local team';
  const industry = state.industry.trim() || 'service';
  const city = state.city.trim() || 'your area';
  return {
    headline: `Need ${industry.toLowerCase()} help in ${city}? Start with a clear answer, not a sales maze.`,
    subhead: `${business} can lead with the customer problem, proof, service area and one obvious call or booking action. Then measure whether the page creates real conversations and revenue.`,
    cta: `Primary CTA: Call or book ${business} now`,
    ad: `${city}, need a reliable ${industry.toLowerCase()} answer? ${business} makes the next step simple. See the problem, see the proof, then call or book. Search ${business} today.`,
  };
}

function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string }) {
  return <label style={field}><span style={smallLabel}>{label}</span><input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} style={input} /></label>;
}

function NumberField({ label, value, onChange, prefix, step = '1' }: { label: string; value: number; onChange: (value: number) => void; prefix?: string; step?: string }) {
  return <label style={field}><span style={smallLabel}>{label}</span><div style={{ position: 'relative' }}>{prefix ? <span style={prefixStyle}>{prefix}</span> : null}<input type="number" min="0" step={step} value={Number.isFinite(value) ? value : 0} onChange={(event) => onChange(Number(event.target.value) || 0)} style={{ ...input, paddingLeft: prefix ? 27 : 12 }} /></div></label>;
}

function Metric({ label, value, detail }: { label: string; value: string; detail: string }) {
  return <div style={metricCard}><div style={smallLabel}>{label}</div><div style={{ fontSize: 31, fontWeight: 950, marginTop: 5 }}>{value}</div><div style={mutedTiny}>{detail}</div></div>;
}

function Evidence({ label, value }: { label: string; value: string }) {
  return <div style={evidenceRow}><span style={{ color: '#8FA0B5' }}>{label}</span><strong style={{ textAlign: 'right', overflowWrap: 'anywhere' }}>{value}</strong></div>;
}

function Stack({ name, status, text }: { name: string; status: string; text: string }) {
  return <article style={stackCard}><div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}><strong style={{ fontSize: 18 }}>{name}</strong><span style={statusPill}>{status}</span></div><p style={mutedSmall}>{text}</p></article>;
}

function clamp(value: number, min: number, max: number) { return Math.min(Math.max(value, min), max); }
function round(value: number) { return Math.round(value * 10) / 10; }
function money(value: number) { return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(Number.isFinite(value) ? value : 0); }

const page = { minHeight: '100vh', background: '#07101A', color: '#F7FAFC', fontFamily: 'Arial, sans-serif', padding: '26px 18px 118px' };
const shell = { maxWidth: 1200, margin: '0 auto' };
const header = { display: 'flex', justifyContent: 'space-between', gap: 22, alignItems: 'start', flexWrap: 'wrap' as const, marginBottom: 18 };
const eyebrow = { color: '#83E8C5', fontSize: 11, fontWeight: 950, letterSpacing: 1.2 };
const darkEyebrow = { color: '#1C6E54', fontSize: 11, fontWeight: 950, letterSpacing: 1.1 };
const hero = { maxWidth: 890, fontSize: 'clamp(42px,6.4vw,72px)', lineHeight: .96, letterSpacing: -2.7, margin: '10px 0 14px' };
const lead = { maxWidth: 920, color: '#B7C4D4', lineHeight: 1.66, fontSize: 17 };
const navButtons = { display: 'flex', gap: 8, flexWrap: 'wrap' as const };
const ghostButton = { display: 'inline-block', border: '1px solid #40516A', color: '#F7FAFC', textDecoration: 'none', borderRadius: 10, padding: '10px 13px', fontWeight: 900, fontSize: 13 };
const mintButton = { display: 'inline-block', background: '#9EF0CF', color: '#07130F', textDecoration: 'none', borderRadius: 10, padding: '11px 14px', fontWeight: 950, fontSize: 13 };
const intakeCard = { background: 'linear-gradient(135deg,#102136,#102A22)', border: '1px solid #2C4657', borderRadius: 20, padding: 20 };
const sectionTitle = { fontSize: 'clamp(28px,4vw,40px)', lineHeight: 1.05, letterSpacing: -1.2, margin: '8px 0 9px' };
const muted = { color: '#B3C0CF', lineHeight: 1.6, margin: 0, maxWidth: 850 };
const mutedSmall = { color: '#AEBBCB', lineHeight: 1.5, margin: '5px 0 0', fontSize: 13 };
const mutedTiny = { color: '#8798AD', lineHeight: 1.45, marginTop: 4, fontSize: 11 };
const smallButton = { background: '#162438', border: '1px solid #40536A', color: '#F7FAFC', borderRadius: 9, padding: '9px 11px', fontWeight: 900, cursor: 'pointer' };
const formGrid = { display: 'grid', gridTemplateColumns: 'repeat(4,minmax(0,1fr))', gap: 10, marginTop: 18 };
const field = { display: 'grid', gap: 6 };
const smallLabel = { color: '#8EA0B6', fontSize: 10, fontWeight: 950, letterSpacing: .6, textTransform: 'uppercase' as const };
const input = { width: '100%', boxSizing: 'border-box' as const, background: '#08131F', color: '#F8FAFC', border: '1px solid #344A61', borderRadius: 9, padding: '11px 12px', outline: 'none', fontSize: 14 };
const prefixStyle = { position: 'absolute' as const, left: 11, top: 11, color: '#8EA0B6', fontSize: 14 };
const primaryButton = { background: '#9EF0CF', color: '#07130F', border: 0, borderRadius: 10, padding: '12px 15px', fontWeight: 950 };
const secondaryButton = { display: 'inline-block', background: '#172437', color: '#F7FAFC', border: '1px solid #40526A', borderRadius: 10, padding: '11px 14px', fontWeight: 900, textDecoration: 'none' };
const errorBox = { marginTop: 12, background: '#3A1720', border: '1px solid #773041', color: '#FFC7D0', padding: 11, borderRadius: 10, fontSize: 13 };
const metricGrid = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(175px,1fr))', gap: 9, margin: '14px 0' };
const metricCard = { background: '#0D1926', border: '1px solid #273A4F', borderRadius: 14, padding: 15 };
const twoCol = { display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 14, marginBottom: 14 };
const card = { background: '#0D1926', border: '1px solid #273A4F', borderRadius: 18, padding: 19, marginTop: 14 };
const recommendationCard = { display: 'grid', gridTemplateColumns: '34px 1fr', gap: 10, background: '#0A1420', border: '1px solid #24364A', borderRadius: 12, padding: 11 };
const rank = { width: 28, height: 28, borderRadius: 9, display: 'grid', placeItems: 'center', background: '#9EF0CF', color: '#07130F', fontWeight: 950 };
const websiteScore = { width: 70, height: 70, borderRadius: 999, display: 'grid', placeItems: 'center', background: '#9EF0CF', color: '#07130F', fontSize: 28, fontWeight: 950, margin: '10px 0 14px' };
const evidenceRow = { display: 'flex', justifyContent: 'space-between', gap: 12, borderTop: '1px solid #26384C', padding: '10px 0', fontSize: 13 };
const lightSection = { background: '#E8F0E9', color: '#15201B', borderRadius: 20, padding: 20, marginTop: 14 };
const bodyDark = { color: '#4E5A53', lineHeight: 1.62, margin: 0 };
const questionGrid = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 9, marginTop: 18 };
const questionCard = { background: '#F8FBF8', border: '1px solid #C9D8CD', borderRadius: 13, padding: 14, display: 'grid', gridTemplateColumns: '30px 1fr', gap: 9, alignItems: 'start' };
const questionNumber = { width: 27, height: 27, borderRadius: 8, display: 'grid', placeItems: 'center', background: '#1F765A', color: '#fff', fontWeight: 950 };
const whiteCard = { background: '#fff', border: '1px solid #CCD8CF', borderRadius: 14, padding: 16 };
const ctaBox = { marginTop: 12, background: '#E6F6EE', border: '1px solid #A8D6C2', borderRadius: 10, padding: 11, fontWeight: 900 };
const darkButton = { display: 'inline-block', marginTop: 14, background: '#15261F', color: '#fff', textDecoration: 'none', borderRadius: 9, padding: '10px 12px', fontWeight: 900 };
const stackGrid = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: 9, marginTop: 16 };
const stackCard = { background: '#0A1420', border: '1px solid #24364A', borderRadius: 13, padding: 14 };
const statusPill = { color: '#07130F', background: '#9EF0CF', borderRadius: 999, padding: '5px 7px', fontSize: 9, fontWeight: 950, whiteSpace: 'nowrap' as const };
const pricingSection = { background: '#EEEAE1', color: '#171717', borderRadius: 20, padding: 20, marginTop: 14 };
const pricingGrid = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(230px,1fr))', gap: 10, marginTop: 17 };
const priceCard = { border: '1px solid #D2CCC0', borderRadius: 14, padding: 16 };
const planItem = { borderTop: '1px solid #E6E1D7', padding: '8px 0', color: '#4E4B45', fontSize: 13 };
const footerCta = { background: '#0F2436', border: '1px solid #2E4A61', borderRadius: 18, padding: 19, marginTop: 14, display: 'flex', justifyContent: 'space-between', gap: 18, alignItems: 'center', flexWrap: 'wrap' as const };
