import Link from 'next/link';

const sources = [
  { name: 'Reddit', status: 'Needs developer connection', note: 'Best for public owner pain points. Use a Reddit developer app and human account. Respect subreddit promotion rules.' },
  { name: 'LinkedIn', status: 'Needs LinkedIn app approval', note: 'Strong B2B source. Posting/comment permissions are available, while broad member-post reading is restricted and may require approval.' },
  { name: 'Facebook / Instagram', status: 'Needs Meta app + Page assets', note: 'Use for Aridon-owned Pages and permitted comment workflows. Broad group prospecting should remain human-reviewed.' },
  { name: 'Web discovery', status: 'Ready for search workflow', note: 'Find public posts and discussions through approved search sources, then route candidates into this queue for review.' },
];

const workflow = [
  ['1', 'Discover', 'Collect fresh public posts about sales, customers, leads, follow-up, stale estimates and business growth.'],
  ['2', 'Score', 'Rank each post by problem fit, owner intent, urgency, service-business fit and self-promotion risk.'],
  ['3', 'Draft', 'Answer the business problem first. Mention Aridon only when it is genuinely relevant and allowed.'],
  ['4', 'Approve', 'Human review remains the default before a public reply is posted from an Aridon-controlled account.'],
  ['5', 'Track', 'Log the post URL, reply, platform, date, response, qualified lead and eventual revenue attribution.'],
];

export const metadata = {
  title: 'Aridon Social Reply Engine',
  description: 'Find public business-growth conversations, draft helpful Aridon replies and track outreach outcomes.',
};

export default function OutreachRadarPage() {
  return (
    <main style={{ minHeight: '100vh', background: '#F4F1E9', color: '#171717', fontFamily: 'Arial, sans-serif' }}>
      <section style={{ background: '#07101D', color: '#F8FAFC' }}>
        <div style={{ maxWidth: 1120, margin: '0 auto', padding: '28px 20px 64px' }}>
          <nav style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
            <Link href="/business-os" style={{ color: '#fff', textDecoration: 'none', fontWeight: 900 }}>ARIDON · BUSINESS OS</Link>
            <Link href="/business-os" style={{ color: '#BFC9D8', textDecoration: 'none' }}>Back to Business OS</Link>
          </nav>
          <div style={{ paddingTop: 54, maxWidth: 900 }}>
            <div style={{ color: '#9EF0CF', fontWeight: 900, letterSpacing: 1.2, fontSize: 12 }}>SOCIAL REPLY ENGINE</div>
            <h1 style={{ fontSize: 'clamp(46px,8vw,82px)', lineHeight: .93, letterSpacing: -3, margin: '16px 0 22px' }}>Go where the sales problem is already being discussed.</h1>
            <p style={{ color: '#BFC9D8', fontSize: 20, lineHeight: 1.6, maxWidth: 820 }}>Aridon’s outreach engine is designed to find business owners asking for help, rank the best conversations, draft useful replies and measure which conversations turn into leads. No spray-and-pray spam.</p>
          </div>
        </div>
      </section>

      <section style={{ maxWidth: 1120, margin: '0 auto', padding: '64px 20px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(230px,1fr))', gap: 12 }}>
          <Stat value="4–5" label="Targeted replies per day" />
          <Stat value="Help first" label="Default reply rule" />
          <Stat value="Human gate" label="Before public posting" />
          <Stat value="Revenue" label="Ultimate success metric" />
        </div>

        <h2 style={{ fontSize: 38, margin: '56px 0 18px' }}>Operating loop</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(205px,1fr))', gap: 10 }}>
          {workflow.map(([n, title, text]) => (
            <article key={title} style={{ background: '#fff', border: '1px solid #D4CEC2', borderRadius: 16, padding: 18 }}>
              <div style={{ width: 34, height: 34, display: 'grid', placeItems: 'center', background: '#9EF0CF', borderRadius: 10, fontWeight: 950 }}>{n}</div>
              <h3 style={{ fontSize: 21, marginBottom: 8 }}>{title}</h3>
              <p style={{ color: '#666158', lineHeight: 1.6, margin: 0 }}>{text}</p>
            </article>
          ))}
        </div>

        <h2 style={{ fontSize: 38, margin: '56px 0 18px' }}>Connection status</h2>
        <div style={{ display: 'grid', gap: 10 }}>
          {sources.map((source) => (
            <article key={source.name} style={{ background: '#fff', border: '1px solid #D4CEC2', borderRadius: 15, padding: 18, display: 'grid', gridTemplateColumns: 'minmax(150px,.45fr) minmax(180px,.65fr) 2fr', gap: 16, alignItems: 'center' }}>
              <strong style={{ fontSize: 20 }}>{source.name}</strong>
              <span style={{ fontSize: 13, fontWeight: 900, color: source.status.startsWith('Ready') ? '#176348' : '#8A5A12' }}>{source.status}</span>
              <span style={{ color: '#666158', lineHeight: 1.55 }}>{source.note}</span>
            </article>
          ))}
        </div>

        <section style={{ marginTop: 56, background: '#E7F8F0', border: '1px solid #8BCFB4', borderRadius: 20, padding: 24 }}>
          <div style={{ fontSize: 12, fontWeight: 950, color: '#176348', letterSpacing: 1 }}>CONNECTION CHECKLIST</div>
          <h2 style={{ fontSize: 34, margin: '8px 0 14px' }}>What Jim needs to connect</h2>
          <ol style={{ lineHeight: 1.85, color: '#3E4A43', paddingLeft: 22 }}>
            <li>Create or confirm the Aridon LinkedIn Company Page and make the connecting LinkedIn account a Page admin.</li>
            <li>Create a LinkedIn Developer application for Aridon and request the social permissions needed for organization posting/comments.</li>
            <li>Connect the Reddit account you want Aridon to use at Reddit for Developers and register the app before any automated Reddit workflow is enabled.</li>
            <li>Create a Meta Developer app only if we want Aridon Page / Instagram account comment workflows. Add the official Aridon Page and Instagram business account to that app.</li>
            <li>Store access tokens and client secrets only as protected Vercel environment variables. Never paste secrets into a public GitHub file or a public post.</li>
          </ol>
        </section>

        <section style={{ marginTop: 24, background: '#171717', color: '#fff', borderRadius: 20, padding: 24 }}>
          <div style={{ fontSize: 12, fontWeight: 950, color: '#9EF0CF', letterSpacing: 1 }}>GUARDRAIL</div>
          <h2 style={{ fontSize: 31, margin: '8px 0 10px' }}>Helpful outreach, not a spam cannon.</h2>
          <p style={{ color: '#C8C8C4', lineHeight: 1.7, margin: 0 }}>The engine should reject repetitive promotional replies, communities that prohibit promotion, unsupported performance claims and posts that are not a genuine fit. The default is one useful answer, one light Aridon mention, one trackable next step.</p>
        </section>
      </section>
    </main>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return <div style={{ background: '#fff', border: '1px solid #D4CEC2', borderRadius: 16, padding: 20 }}><div style={{ fontSize: 31, fontWeight: 950 }}>{value}</div><div style={{ color: '#777168', marginTop: 4 }}>{label}</div></div>;
}
