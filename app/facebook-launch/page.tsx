'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';

const pageProfile = {
  name: 'Aridon',
  category: 'Software Company · Business Consultant',
  usernameIdeas: ['@AridonAI', '@AridonBusinessOS', '@AridonHQ'],
  bio: 'AI executive operating system for business growth, analysis, execution and opportunity discovery.',
  about:
    'Aridon helps owners run more of the business from one place. Analyze a company, find growth opportunities, coordinate an AI executive team, build plans and presentations, recover revenue, evaluate acquisitions, and move approved work into execution with human control still in the loop.',
  website: 'https://aridon-v02.vercel.app',
  freeAnalyzer: 'https://aridon-v02.vercel.app/analyze-business',
  revenueStore: 'https://aridon-v02.vercel.app/revenue',
};

const launchPosts = [
  {
    title: 'Pinned launch post',
    body: `Most businesses do not need another chatbot. They need a system that can look at the whole company, find what is being missed, organize the work, and help move it forward.\n\nThat is what we are building with Aridon.\n\nStart with a free business analysis and see what Aridon finds: ${pageProfile.freeAnalyzer}`,
  },
  {
    title: 'Business audit post',
    body: `What is your website not telling you?\n\nAridon can review a business from the outside in: website, positioning, conversion path, competitors, growth opportunities, AI automation opportunities and revenue leaks.\n\nRun a free analysis: ${pageProfile.freeAnalyzer}`,
  },
  {
    title: 'AI executive team post',
    body: 'Instead of asking one AI to do everything, Aridon routes work to the right specialist and keeps the business context together. Strategy, operations, research, finance, technical work, quality control and execution all work from the same company brain.',
  },
  {
    title: 'Acquisition post',
    body: `Looking at a business for sale? Aridon can help organize the deal: upside, risks, website and operating opportunities, seller-financing structure, diligence questions and an offer framework.\n\nSee the Acquisition Due-Diligence Package: ${pageProfile.revenueStore}`,
  },
  {
    title: 'Revenue recovery post',
    body: 'A surprising amount of revenue is already sitting inside most businesses: stale leads, weak follow-up, missed upsells, broken conversion paths and customers who never heard back. Aridon is being built to find those leaks and turn them into an action queue.',
  },
  {
    title: 'Presentation Studio post',
    body: 'Need a sales deck, proposal, investor presentation, acquisition package or board report? Aridon can take the business context, research and executive recommendations and turn them into a presentation-ready package instead of starting from a blank slide.',
  },
];

const calendar = [
  ['Week 1', 'Launch + proof', 'Introduce Aridon, free analyzer, executive team, before/after examples'],
  ['Week 2', 'Business growth', 'Website audits, revenue leaks, follow-up, competitor comparisons'],
  ['Week 3', 'Owner leverage', 'AI executive team, automations, presentations, workflow examples'],
  ['Week 4', 'High-value offers', 'Acquisitions, executive audits, Business OS, case-style walkthroughs'],
];

const groups = [
  'Small-business owner groups',
  'Business acquisition / search-fund groups',
  'Local chamber and regional business groups',
  'Contractor, service-business and dealer-owner groups',
  'Agriculture, water and infrastructure groups where Aridon has a real use case',
];

function CopyButton({ value, label = 'Copy' }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  }

  return (
    <button
      onClick={copy}
      style={{
        border: '1px solid #31425F',
        background: copied ? '#9EF0CF' : '#101B2D',
        color: copied ? '#07130F' : '#E8EEF8',
        borderRadius: 10,
        padding: '9px 12px',
        fontWeight: 900,
        cursor: 'pointer',
      }}
    >
      {copied ? 'Copied ✓' : label}
    </button>
  );
}

export default function FacebookLaunchPage() {
  const [selectedPost, setSelectedPost] = useState(0);
  const post = useMemo(() => launchPosts[selectedPost], [selectedPost]);

  return (
    <main style={{ minHeight: '100vh', background: '#07101D', color: '#F7FAFF', fontFamily: 'Arial, sans-serif' }}>
      <section style={{ maxWidth: 1180, margin: '0 auto', padding: '28px 20px 72px' }}>
        <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <Link href="/dashboard" style={{ color: '#fff', textDecoration: 'none', fontWeight: 950, letterSpacing: 1 }}>ARIDON</Link>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <Link href="/revenue" style={{ color: '#DCE4EF', textDecoration: 'none', fontWeight: 850 }}>Revenue Store</Link>
            <Link href="/presentation-studio" style={{ color: '#DCE4EF', textDecoration: 'none', fontWeight: 850 }}>Presentation Studio</Link>
            <Link href="/model-router" style={{ color: '#DCE4EF', textDecoration: 'none', fontWeight: 850 }}>Model Router</Link>
          </div>
        </nav>

        <div style={{ paddingTop: 64, maxWidth: 900 }}>
          <div style={{ color: '#9EF0CF', fontWeight: 950, letterSpacing: 1.2, fontSize: 12 }}>FACEBOOK PAGE LAUNCH CENTER</div>
          <h1 style={{ fontSize: 'clamp(48px,7vw,82px)', lineHeight: 0.96, letterSpacing: -3.2, margin: '14px 0 20px' }}>
            Turn Facebook into an Aridon customer funnel.
          </h1>
          <p style={{ color: '#B7C3D7', fontSize: 20, lineHeight: 1.65, maxWidth: 820 }}>
            Everything needed to build and run the Aridon Facebook Page is staged here. The only manual step is the final creation/publishing action inside Meta until a direct Meta connector is available.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1.1fr .9fr', gap: 18, marginTop: 34 }} className="fbGrid">
          <section style={{ background: '#102033', border: '1px solid #2A3A57', borderRadius: 20, padding: 22 }}>
            <div style={{ color: '#9EF0CF', fontWeight: 950, fontSize: 12 }}>PAGE IDENTITY</div>
            <h2 style={{ fontSize: 34, margin: '8px 0 16px' }}>{pageProfile.name}</h2>
            <Field label="Category" value={pageProfile.category} />
            <Field label="Bio" value={pageProfile.bio} />
            <Field label="About" value={pageProfile.about} />
            <Field label="Website" value={pageProfile.website} />
            <div style={{ marginTop: 16 }}>
              <div style={{ color: '#8FA0B8', fontSize: 12, fontWeight: 900, marginBottom: 8 }}>USERNAME IDEAS</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {pageProfile.usernameIdeas.map((item) => (
                  <span key={item} style={{ background: '#0B1626', border: '1px solid #2A3A57', padding: '8px 10px', borderRadius: 999, fontWeight: 850 }}>{item}</span>
                ))}
              </div>
              <p style={{ color: '#8FA0B8', fontSize: 12, lineHeight: 1.5 }}>Availability must be checked inside Facebook before selecting a username.</p>
            </div>
          </section>

          <section style={{ background: '#F4F1E9', color: '#171717', borderRadius: 20, padding: 22 }}>
            <div style={{ fontWeight: 950, fontSize: 12 }}>THE CUSTOMER PATH</div>
            <h2 style={{ fontSize: 32, margin: '8px 0 18px' }}>One page, four steps to revenue.</h2>
            {[
              ['1', 'Attention', 'Useful posts, audits, examples and owner-focused content.'],
              ['2', 'Free proof', 'Send prospects into the free business analyzer.'],
              ['3', 'Paid outcome', '$198 scan, $495 blueprint, $1,500 audit or $2,500 acquisition package.'],
              ['4', 'Recurring value', 'Move qualified customers into the $497/month Business OS.'],
            ].map(([n, title, body]) => (
              <div key={n} style={{ borderTop: '1px solid #D2CCBF', padding: '13px 0', display: 'grid', gridTemplateColumns: '38px 1fr', gap: 10 }}>
                <strong>{n}</strong><div><strong>{title}</strong><div style={{ color: '#5D5A54', lineHeight: 1.5, marginTop: 4 }}>{body}</div></div>
              </div>
            ))}
            <a href={pageProfile.freeAnalyzer} style={{ display: 'inline-block', marginTop: 12, background: '#171717', color: '#fff', textDecoration: 'none', fontWeight: 950, padding: '13px 16px', borderRadius: 12 }}>
              Free Analyzer Landing Page
            </a>
          </section>
        </div>

        <section style={{ marginTop: 18, background: '#0D1728', border: '1px solid #2A3A57', borderRadius: 20, padding: 22 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
            <div><div style={{ color: '#9EF0CF', fontSize: 12, fontWeight: 950 }}>FIRST POSTS</div><h2 style={{ fontSize: 34, margin: '6px 0' }}>Launch content already written.</h2></div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {launchPosts.map((item, index) => (
                <button key={item.title} onClick={() => setSelectedPost(index)} style={{ border: '1px solid #31425F', background: selectedPost === index ? '#9EF0CF' : '#101B2D', color: selectedPost === index ? '#07130F' : '#E8EEF8', borderRadius: 999, padding: '8px 10px', fontWeight: 850, cursor: 'pointer' }}>{index + 1}</button>
              ))}
            </div>
          </div>
          <div style={{ marginTop: 16, background: '#07101D', borderRadius: 16, padding: 18 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
              <h3 style={{ margin: 0 }}>{post.title}</h3><CopyButton value={post.body} label="Copy Post" />
            </div>
            <p style={{ whiteSpace: 'pre-wrap', color: '#C6D1E2', lineHeight: 1.65, marginBottom: 0 }}>{post.body}</p>
          </div>
        </section>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, marginTop: 18 }} className="fbGrid">
          <section style={{ background: '#F4F1E9', color: '#171717', borderRadius: 20, padding: 22 }}>
            <div style={{ fontWeight: 950, fontSize: 12 }}>30-DAY CONTENT ENGINE</div>
            <h2 style={{ fontSize: 32, margin: '8px 0 16px' }}>Four weekly themes, repeated with fresh proof.</h2>
            {calendar.map(([week, theme, content]) => (
              <div key={week} style={{ borderTop: '1px solid #D2CCBF', padding: '13px 0' }}>
                <strong>{week} · {theme}</strong>
                <div style={{ color: '#5D5A54', lineHeight: 1.5, marginTop: 5 }}>{content}</div>
              </div>
            ))}
          </section>

          <section style={{ background: '#102033', border: '1px solid #2A3A57', borderRadius: 20, padding: 22 }}>
            <div style={{ color: '#9EF0CF', fontWeight: 950, fontSize: 12 }}>GROUP DISTRIBUTION</div>
            <h2 style={{ fontSize: 32, margin: '8px 0 16px' }}>Earn attention before dropping links.</h2>
            <ul style={{ color: '#C3CEE0', lineHeight: 1.8, paddingLeft: 20 }}>
              {groups.map((item) => <li key={item}>{item}</li>)}
            </ul>
            <p style={{ color: '#8FA0B8', lineHeight: 1.6, fontSize: 13 }}>
              Aridon should draft useful answers first, then suggest a relevant link only where group rules allow it. No spam blasting or copied posts across unrelated groups.
            </p>
          </section>
        </div>

        <section style={{ marginTop: 18, background: '#102033', border: '1px solid #2A3A57', borderRadius: 20, padding: 22 }}>
          <div style={{ color: '#9EF0CF', fontWeight: 950, fontSize: 12 }}>META-READY LAUNCH CHECKLIST</div>
          <h2 style={{ fontSize: 34, margin: '8px 0 18px' }}>What remains inside Facebook.</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 12 }} className="fbGrid">
            {[
              'Create the Aridon Facebook Page under the correct Meta account.',
              'Choose the best available username and the Software Company / Business Consultant category.',
              'Upload approved profile and cover artwork.',
              'Paste the staged bio and About copy from this page.',
              'Set the primary CTA to the free Aridon analyzer.',
              'Publish the pinned launch post and queue the first week of content.',
              'Connect Meta Business Suite analytics and inbox when available.',
              'Review Meta monetization eligibility separately. Monetization is not guaranteed and depends on Meta policies and account eligibility.',
            ].map((item) => (
              <div key={item} style={{ background: '#07101D', borderRadius: 14, padding: 14, color: '#C6D1E2', lineHeight: 1.55 }}>✓ {item}</div>
            ))}
          </div>
        </section>
      </section>

      <style>{`@media(max-width:820px){.fbGrid{grid-template-columns:1fr !important}}`}</style>
    </main>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ borderTop: '1px solid #2A3A57', padding: '13px 0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center' }}>
        <div style={{ color: '#8FA0B8', fontSize: 12, fontWeight: 900 }}>{label.toUpperCase()}</div>
        <CopyButton value={value} />
      </div>
      <div style={{ color: '#DCE4EF', lineHeight: 1.6, marginTop: 8 }}>{value}</div>
    </div>
  );
}
