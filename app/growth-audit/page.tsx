'use client';

import Link from 'next/link';
import { FormEvent, useMemo, useState } from 'react';

type WebAnalysis = {
  website: string;
  organizationType: string;
  scores: {
    overall: number;
    clarity: number;
    conversion: number;
    trust: number;
    aiSearchVisibility: number;
    indexingReadiness: number;
    contentIntegrity: number;
  };
  strengths: string[];
  opportunities: string[];
  pages: Array<{ url: string; title: string; description: string; headings: string[] }>;
};

type Audit = {
  presenceModel: string;
  scores: Array<{ label: string; value: number; why: string }>;
  preserve: string[];
  buildNext: string[];
  revenueLadder: Array<{ level: string; offer: string; purpose: string }>;
  benchmark: Array<{ pattern: string; status: 'present' | 'partial' | 'missing'; note: string }>;
  ninetyDay: string[];
};

const socialHosts = ['linkedin.com', 'facebook.com', 'instagram.com', 'tiktok.com', 'x.com', 'twitter.com', 'youtube.com'];
const card: React.CSSProperties = { background: '#0D1728', border: '1px solid #293A57', borderRadius: 18, padding: 18 };
const input: React.CSSProperties = { width: '100%', boxSizing: 'border-box', background: '#07101D', border: '1px solid #3A4B68', color: '#F8FAFC', borderRadius: 11, padding: '12px 13px', fontSize: 15, outline: 0 };

function clamp(value: number) { return Math.max(0, Math.min(100, Math.round(value))); }
function includes(text: string, terms: string[]) { return terms.some((term) => text.includes(term)); }
function hostOf(raw: string) { try { return new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`).hostname.toLowerCase().replace(/^www\./, ''); } catch { return ''; } }
function isSocial(raw: string) { const host = hostOf(raw); return socialHosts.some((domain) => host === domain || host.endsWith(`.${domain}`)); }

function Score({ label, value, why }: { label: string; value: number; why: string }) {
  return <div style={card}><div style={{ color: '#91A2BA', fontSize: 11, fontWeight: 950, letterSpacing: .7 }}>{label.toUpperCase()}</div><div style={{ fontSize: 38, fontWeight: 950, marginTop: 5 }}>{value}</div><div style={{ color: '#B9C5D6', fontSize: 12, lineHeight: 1.45, marginTop: 5 }}>{why}</div></div>;
}

export default function GrowthAuditPage() {
  const [businessName, setBusinessName] = useState('');
  const [primaryUrl, setPrimaryUrl] = useState('');
  const [context, setContext] = useState('');
  const [webAnalysis, setWebAnalysis] = useState<WebAnalysis | null>(null);
  const [audit, setAudit] = useState<Audit | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const social = useMemo(() => isSocial(primaryUrl), [primaryUrl]);

  async function run(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setMessage('');
    setAudit(null);
    let site: WebAnalysis | null = null;

    if (primaryUrl && !social) {
      try {
        const response = await fetch('/api/analyze-business', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ website: primaryUrl }) });
        const payload = await response.json();
        if (response.ok) site = payload as WebAnalysis;
        else setMessage('The public-site crawl did not complete, so Aridon used the information you supplied instead.');
      } catch {
        setMessage('The public-site crawl did not complete, so Aridon used the information you supplied instead.');
      }
    }

    setWebAnalysis(site);
    const pageText = (site?.pages || []).map((page) => `${page.title} ${page.description} ${page.headings.join(' ')}`).join(' ');
    const text = `${businessName} ${primaryUrl} ${context} ${pageText} ${(site?.strengths || []).join(' ')} ${(site?.opportunities || []).join(' ')}`.toLowerCase();

    const ownedWeb = Boolean(primaryUrl) && !social;
    const proof = includes(text, ['testimonial', 'recommendation', 'review', 'case study', 'case studies', 'client', 'clients', 'followers', 'results', 'award']);
    const clearService = includes(text, ['service', 'services', 'management', 'marketing', 'consulting', 'coaching', 'strategy', 'done for you', 'fractional']);
    const leadCapture = includes(text, ['newsletter', 'email signup', 'sign up', 'subscribe', 'lead magnet', 'free guide', 'checklist', 'weekly email']);
    const entryOffer = includes(text, ['power hour', 'audit', 'assessment', 'diagnostic', 'strategy session', 'consultation', '$', 'investment starts']);
    const premiumOffer = includes(text, ['fractional', 'retainer', 'managed service', 'management service', 'done for you', 'takeover']);
    const digitalOffer = includes(text, ['course', 'workshop', 'template', 'self-paced', 'digital product', 'resource library', 'training']);
    const booking = includes(text, ['book', 'schedule', 'calendar', 'contact', 'dm me', 'request proposal']);
    const aiSearch = includes(text, ['ai search', 'aeo', 'answer engine', 'chatgpt', 'claude', 'perplexity', 'llm', 'schema', 'ai visibility']);
    const analytics = includes(text, ['google analytics', 'search console', 'hubspot', 'salesforce', 'analytics', 'attribution', 'share of voice']);
    const crm = includes(text, ['crm', 'pipeline', 'lead scoring', 'follow-up', 'follow up', 'automation', 'nurture']);
    const contentEngine = includes(text, ['blog', 'newsletter', 'articles', 'content marketing', 'content creation', 'social media']);

    const presenceModel = social ? 'Platform-first / rented audience' : ownedWeb ? 'Owned website + external channels' : 'Presence not yet established';
    const ownedScore = ownedWeb ? 92 : social ? 18 : 5;
    const authorityScore = site?.scores?.trust ?? clamp((proof ? 72 : 36) + (clearService ? 10 : 0));
    const conversionScore = site?.scores?.conversion ?? clamp(25 + (booking ? 24 : 0) + (entryOffer ? 18 : 0) + (leadCapture ? 18 : 0) + (premiumOffer ? 10 : 0));
    const offerScore = clamp((entryOffer ? 34 : 5) + (premiumOffer ? 33 : 5) + (digitalOffer ? 33 : 5));
    const audienceScore = leadCapture ? 88 : social ? 28 : 20;
    const aiScore = site?.scores?.aiSearchVisibility ?? (aiSearch ? 82 : ownedWeb ? 46 : 20);
    const revenueOpsScore = clamp(20 + (booking ? 18 : 0) + (crm ? 28 : 0) + (analytics ? 24 : 0) + (leadCapture ? 10 : 0));
    const scaleScore = clamp(24 + (contentEngine ? 18 : 0) + (digitalOffer ? 24 : 0) + (premiumOffer ? 12 : 0) + (aiSearch ? 12 : 0) + (crm ? 10 : 0));

    const preserve: string[] = [];
    if (proof) preserve.push('Keep the authority already earned: testimonials, recommendations, client outcomes, audience size and visible expertise.');
    if (clearService) preserve.push('Keep the core positioning and specialty clear instead of broadening into generic marketing language.');
    if (contentEngine) preserve.push('Keep the existing content rhythm because it is already creating trust and distribution.');
    if (social) preserve.push('Keep the social profile active as the audience engine, but stop asking it to do the entire job of an owned website.');
    if (!preserve.length) preserve.push('Preserve the strongest existing offer, proof and relationship channels while the growth stack is rebuilt around them.');

    const buildNext: string[] = [];
    if (!ownedWeb) buildNext.push('Build an owned conversion website that Aridon can index, measure and improve. The social profile should feed the site, not substitute for it.');
    if (!entryOffer) buildNext.push('Add a low-friction paid entry offer such as an audit, diagnostic or focused strategy session.');
    if (!premiumOffer) buildNext.push('Package the highest-value work as a premium managed or fractional service with a clear outcome and qualification path.');
    if (!leadCapture) buildNext.push('Create an owned-audience capture path: newsletter, guide, checklist or other useful opt-in with automated nurture.');
    if (!digitalOffer) buildNext.push('Productize repeatable expertise into a course, workshop, template pack or self-service resource so revenue is not limited to one-to-one delivery.');
    if (!aiSearch) buildNext.push('Add an AI/AEO layer: entity-rich service pages, answer-ready FAQs, schema, prompt tracking and citation monitoring across AI search.');
    if (!crm) buildNext.push('Connect inquiries to CRM stages with qualification, follow-up, proposal, win/loss and referral automation.');
    if (!analytics) buildNext.push('Connect website, search, AI visibility and CRM data so Aridon can attribute leads and revenue to the channels that actually work.');
    if (!proof) buildNext.push('Turn client wins into case studies with specific before/after outcomes and make that proof reusable across sales, search and social.');

    const revenueLadder = [
      { level: 'Free', offer: leadCapture ? 'Existing newsletter / resource' : 'Useful newsletter or lead magnet', purpose: 'Move followers into an audience the business owns.' },
      { level: 'Entry', offer: entryOffer ? 'Existing focused paid offer' : 'Audit / diagnostic / strategy session', purpose: 'Create a simple first purchase and qualify serious prospects.' },
      { level: 'Core', offer: clearService ? 'Primary advisory or management service' : 'Clearly packaged core service', purpose: 'Solve the main client problem with a defined scope and result.' },
      { level: 'Premium', offer: premiumOffer ? 'Existing managed / fractional offer' : 'Done-for-you or fractional retainer', purpose: 'Monetize clients who want implementation and ongoing ownership.' },
      { level: 'Scalable', offer: digitalOffer ? 'Existing course / resource' : 'Course, workshop, templates or membership', purpose: 'Sell repeatable knowledge without adding equal delivery hours.' },
    ];

    const benchmark: Audit['benchmark'] = [
      { pattern: 'Productized entry offer', status: entryOffer ? 'present' : clearService ? 'partial' : 'missing', note: 'Wicked Tactical pattern: a clearly priced, low-friction first purchase can turn expertise into an easier yes.' },
      { pattern: 'Premium implementation path', status: premiumOffer ? 'present' : 'missing', note: 'Wicked Tactical pattern: clients can move from advice into higher-value implementation or fractional leadership.' },
      { pattern: 'Owned audience + nurture', status: leadCapture ? 'present' : contentEngine ? 'partial' : 'missing', note: 'A newsletter or useful opt-in converts platform followers into a direct relationship the business controls.' },
      { pattern: 'Scalable knowledge products', status: digitalOffer ? 'present' : clearService ? 'partial' : 'missing', note: 'Courses, workshops and resources monetize expertise beyond one-to-one service hours.' },
      { pattern: 'AI-search visibility monitoring', status: aiSearch ? 'present' : 'missing', note: 'Searchable pattern: track whether the brand appears in AI answers, where competitors win, and what content or technical fixes can improve citations.' },
      { pattern: 'Actionable AEO / technical audit', status: aiSearch && ownedWeb ? 'present' : aiSearch || ownedWeb ? 'partial' : 'missing', note: 'Pair visibility monitoring with crawlability, structured content, schema and prioritized remediation.' },
      { pattern: 'Revenue attribution', status: analytics && crm ? 'present' : analytics || crm ? 'partial' : 'missing', note: 'Tie visibility and content to traffic, qualified leads, proposals and revenue rather than stopping at impressions.' },
      { pattern: 'AI agent / knowledge base', status: aiSearch && contentEngine ? 'partial' : 'missing', note: 'Train the growth system on brand voice, services, ideal clients, proof and competitors so recommendations stay specific.' },
    ];

    const ninetyDay = [
      'Days 1–14: lock positioning, ideal client, proof library and offer ladder; decide what stays on social and what moves to the owned site.',
      'Days 15–30: launch the owned conversion hub with service pages, proof, booking, lead capture, analytics, CRM routing and technical indexing basics.',
      'Days 31–60: publish answer-ready content, FAQs and case studies; begin AI visibility prompt tracking and systematic content repurposing.',
      'Days 61–90: add scalable knowledge products, tighten nurture and follow-up, measure channel-to-revenue performance and iterate the highest-converting paths.',
    ];

    setAudit({
      presenceModel,
      scores: [
        { label: 'Owned media', value: ownedScore, why: ownedWeb ? 'The business controls its primary web destination.' : 'The primary destination is a third-party platform.' },
        { label: 'Authority', value: authorityScore, why: proof ? 'Strong proof and audience signals are present.' : 'More visible proof is needed.' },
        { label: 'Conversion', value: conversionScore, why: booking || entryOffer ? 'There is a path toward inquiry or purchase.' : 'The audience needs a clearer next step.' },
        { label: 'Offer ladder', value: offerScore, why: 'Measures entry, premium and scalable offers.' },
        { label: 'Owned audience', value: audienceScore, why: leadCapture ? 'Direct opt-in capture is present.' : 'Followers are not yet consistently converted into an owned list.' },
        { label: 'AI discovery', value: aiScore, why: aiSearch ? 'AI/AEO signals are present.' : 'AI-search visibility is not yet a visible operating layer.' },
        { label: 'Revenue ops', value: revenueOpsScore, why: 'Measures booking, CRM, nurture and attribution signals.' },
        { label: 'Scalability', value: scaleScore, why: 'Measures repeatable content, digital products, premium offers and automation.' },
      ],
      preserve,
      buildNext,
      revenueLadder,
      benchmark,
      ninetyDay,
    });
    setLoading(false);
  }

  return <main style={{ minHeight: '100vh', background: '#07101D', color: '#F8FAFC', fontFamily: 'Arial,sans-serif', padding: '24px 18px 72px' }}><div style={{ maxWidth: 1240, margin: '0 auto' }}>
    <nav style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}><strong>ARIDON · GROWTH STACK AUDIT</strong><div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}><Link href="/analyze-business" style={navLink}>Website Analyzer</Link><Link href="/business-os/growth-command" style={navLink}>Growth Command</Link></div></nav>

    <header style={{ padding: '52px 0 24px', maxWidth: 950 }}><div style={{ color: '#9EF0CF', fontSize: 12, fontWeight: 950, letterSpacing: 1 }}>PROFILE → OWNED MEDIA → OFFERS → AI DISCOVERY → REVENUE</div><h1 style={{ fontSize: 'clamp(44px,7vw,78px)', lineHeight: .96, letterSpacing: -3, margin: '12px 0 18px' }}>Turn a strong reputation into an owned growth machine.</h1><p style={{ color: '#B8C4D5', fontSize: 18, lineHeight: 1.65 }}>This audit is built for businesses that may rely on LinkedIn or another platform as their “website.” Aridon preserves the audience and credibility already working, then identifies what is missing across owned media, offer design, lead capture, AI/search visibility, automation and revenue measurement.</p></header>

    <form onSubmit={run} style={{ ...card, display: 'grid', gap: 13 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: 12 }}>
        <label style={label}>Business / person<input value={businessName} onChange={(e) => setBusinessName(e.target.value)} placeholder="Annie Rose Inc" style={input} /></label>
        <label style={label}>Primary public URL<input value={primaryUrl} onChange={(e) => setPrimaryUrl(e.target.value)} placeholder="https://linkedin.com/in/... or company.com" style={input} /></label>
      </div>
      <label style={label}>Profile, About page, service notes, research findings or other context<textarea value={context} onChange={(e) => setContext(e.target.value)} placeholder="Paste the public profile/About copy or the key research notes here. This is especially useful when a social network blocks automated crawling." rows={8} style={{ ...input, resize: 'vertical' }} /></label>
      {social ? <div style={{ color: '#F4D06F', fontSize: 13, lineHeight: 1.5 }}>Platform-first mode detected. Aridon will score the ownership gap immediately and use the context above for the rest of the audit.</div> : null}
      <button disabled={loading} style={{ border: 0, borderRadius: 11, padding: '13px 16px', background: '#9EF0CF', color: '#07130F', fontWeight: 950, cursor: loading ? 'wait' : 'pointer', width: 'fit-content' }}>{loading ? 'Running Growth Audit…' : 'Run Full Growth Stack Audit'}</button>
      {message ? <div style={{ color: '#B9C5D6', fontSize: 13 }}>{message}</div> : null}
    </form>

    {webAnalysis ? <section style={{ ...card, marginTop: 15 }}><div style={{ color: '#9EF0CF', fontSize: 11, fontWeight: 950 }}>PUBLIC WEBSITE SCAN CONNECTED</div><div style={{ marginTop: 7, color: '#D7E1EE' }}>{webAnalysis.website} · {webAnalysis.organizationType} · base Aridon score {webAnalysis.scores.overall}/100</div></section> : null}

    {audit ? <div style={{ display: 'grid', gap: 15, marginTop: 18 }}>
      <section style={{ ...card, background: '#102033' }}><div style={{ color: '#9EF0CF', fontSize: 11, fontWeight: 950 }}>PRESENCE MODEL</div><h2 style={{ margin: '7px 0 0', fontSize: 30 }}>{audit.presenceModel}</h2></section>

      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 10 }}>{audit.scores.map((item) => <Score key={item.label} {...item} />)}</section>

      <section className="two" style={{ display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 14 }}><article style={card}><div style={{ color: '#9EF0CF', fontSize: 12, fontWeight: 950 }}>KEEP & AMPLIFY</div>{audit.preserve.map((item) => <p key={item} style={row}>✓ {item}</p>)}</article><article style={card}><div style={{ color: '#F4D06F', fontSize: 12, fontWeight: 950 }}>BUILD NEXT</div>{audit.buildNext.map((item, index) => <p key={item} style={row}><strong style={{ color: '#F4D06F' }}>{index + 1}.</strong> {item}</p>)}</article></section>

      <section style={card}><div style={{ color: '#9EF0CF', fontSize: 12, fontWeight: 950 }}>REVENUE LADDER</div><div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(210px,1fr))', gap: 10, marginTop: 12 }}>{audit.revenueLadder.map((item) => <div key={item.level} style={{ border: '1px solid #2B3D5B', borderRadius: 13, padding: 13 }}><div style={{ color: '#91A2BA', fontSize: 11, fontWeight: 950 }}>{item.level.toUpperCase()}</div><strong style={{ display: 'block', fontSize: 18, margin: '6px 0' }}>{item.offer}</strong><div style={{ color: '#B7C3D4', fontSize: 13, lineHeight: 1.5 }}>{item.purpose}</div></div>)}</div></section>

      <section style={card}><div style={{ color: '#C5B8FF', fontSize: 12, fontWeight: 950 }}>REFERENCE-PATTERN BENCHMARK</div><p style={{ color: '#AEBBD0', lineHeight: 1.55 }}>Aridon now checks for growth patterns demonstrated by productized marketing firms and AI-search platforms: paid entry offers, premium implementation, owned-audience capture, scalable knowledge products, AEO monitoring, technical action, revenue attribution and an AI-trained brand knowledge layer.</p><div style={{ display: 'grid', gap: 9 }}>{audit.benchmark.map((item) => <div key={item.pattern} style={{ borderTop: '1px solid #263852', paddingTop: 10 }}><strong>{item.pattern}</strong><span style={{ marginLeft: 8, fontSize: 10, fontWeight: 950, borderRadius: 999, padding: '5px 7px', background: item.status === 'present' ? '#173D32' : item.status === 'partial' ? '#4A3D1A' : '#41202A', color: item.status === 'present' ? '#9EF0CF' : item.status === 'partial' ? '#F4D06F' : '#FFB7C2' }}>{item.status.toUpperCase()}</span><div style={{ color: '#AEBBD0', fontSize: 13, lineHeight: 1.5, marginTop: 5 }}>{item.note}</div></div>)}</div></section>

      <section style={{ ...card, background: 'linear-gradient(135deg,#10261F,#102033)', borderColor: '#3D6C5A' }}><div style={{ color: '#9EF0CF', fontSize: 12, fontWeight: 950 }}>90-DAY BUILD ORDER</div>{audit.ninetyDay.map((item) => <p key={item} style={row}>{item}</p>)}</section>
    </div> : null}
    <style>{`@media(max-width:780px){.two{grid-template-columns:1fr !important}}`}</style>
  </div></main>;
}

const navLink: React.CSSProperties = { color: '#9EF0CF', textDecoration: 'none', fontWeight: 900 };
const label: React.CSSProperties = { display: 'grid', gap: 7, color: '#CAD5E4', fontSize: 13, fontWeight: 850 };
const row: React.CSSProperties = { borderTop: '1px solid #253650', paddingTop: 10, color: '#D7E1EE', lineHeight: 1.55 };
