'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getBrowserClient } from '../../../../lib/supabase';

type Prospect = {
  id: string;
  company_name: string;
  location?: string | null;
  fit_score?: number | null;
  fit_reason?: string | null;
  recommended_buyer_role?: string | null;
};

type LaunchResult = {
  prospects: Prospect[];
  campaignName: string;
  campaignId: string;
};

type Stage = 'idle' | 'learn' | 'research' | 'campaign' | 'done';

export default function SalesTeamLaunchPage() {
  const router = useRouter();
  const [token, setToken] = useState('');
  const [website, setWebsite] = useState('');
  const [focus, setFocus] = useState('');
  const [geography, setGeography] = useState('');
  const [bookingUrl, setBookingUrl] = useState('');
  const [count, setCount] = useState(10);
  const [stage, setStage] = useState<Stage>('idle');
  const [notice, setNotice] = useState('');
  const [result, setResult] = useState<LaunchResult | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const queryWebsite = params.get('website') || '';
    const queryFocus = params.get('focus') || '';
    let storedWebsite = '';
    let storedFocus = '';
    try {
      const intent = JSON.parse(window.sessionStorage.getItem('aridon-sales-team-intent') || '{}') as { website?: string; focus?: string };
      storedWebsite = intent.website || '';
      storedFocus = intent.focus || '';
    } catch {}
    setWebsite(queryWebsite || storedWebsite);
    setFocus(queryFocus || storedFocus);

    const db = getBrowserClient();
    db.auth.getSession().then(({ data }) => {
      const accessToken = data.session?.access_token;
      if (!accessToken) {
        const next = `/customer/sales/launch${queryWebsite ? `?website=${encodeURIComponent(queryWebsite)}` : ''}`;
        router.replace(`/customer/login?next=${encodeURIComponent(next)}`);
        return;
      }
      setToken(accessToken);
    });
  }, [router]);

  const stageCopy = useMemo(() => {
    if (stage === 'learn') return 'Scout is learning your business and ideal customer…';
    if (stage === 'research') return 'Scout is researching real companies that fit…';
    if (stage === 'campaign') return 'Scout and Oracle are building the outreach sequence…';
    if (stage === 'done') return 'Your AI sales team is ready for review.';
    return 'Nothing will be sent during this launch.';
  }, [stage]);

  function normalizeWebsite(value: string) {
    const trimmed = value.trim();
    if (!trimmed) return '';
    return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  }

  async function runAgent(action: string, payload: Record<string, unknown>) {
    const response = await fetch('/api/customer/sales/agent', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, ...payload }),
      cache: 'no-store',
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || 'Aridon could not finish this sales step.');
    return data;
  }

  async function launch(event: FormEvent) {
    event.preventDefault();
    if (!token) return;
    setNotice('');
    setResult(null);

    const normalizedWebsite = normalizeWebsite(website);
    if (!normalizedWebsite) {
      setNotice('Add the company website first.');
      return;
    }

    try {
      setStage('learn');
      await runAgent('learn', {
        website: normalizedWebsite,
        offer: '',
        goal: 'Build a qualified B2B sales pipeline and earn relevant meetings.',
        geography,
        exclusions: '',
      });

      setStage('research');
      const prospectResult = await runAgent('find_prospects', { count, focus });
      const prospects = Array.isArray(prospectResult.prospects) ? prospectResult.prospects as Prospect[] : [];
      const leadIds = prospects.map((prospect) => prospect.id).filter(Boolean);
      if (!leadIds.length) throw new Error('Scout did not find enough credible prospects to build a campaign. Try a broader focus.');

      setStage('campaign');
      const bookingInstruction = bookingUrl.trim()
        ? ` When a prospect is ready for a meeting, the owner-approved scheduling link is ${bookingUrl.trim()}. Do not imply a meeting is booked until the prospect actually books it.`
        : '';
      const campaignResult = await runAgent('build_sequence', {
        leadIds,
        objective: `Start relevant conversations with qualified prospects and earn a meeting.${bookingInstruction}`,
      });
      const campaign = campaignResult.campaign || {};

      setResult({
        prospects,
        campaignName: campaign.name || 'Aridon outreach campaign',
        campaignId: campaign.id || '',
      });
      setStage('done');
      try { window.sessionStorage.removeItem('aridon-sales-team-intent'); } catch {}
    } catch (error) {
      setStage('idle');
      setNotice(error instanceof Error ? error.message : 'Aridon could not launch the sales team.');
    }
  }

  return (
    <main style={{ minHeight: '100vh', background: '#070B14', color: '#F7F9FD', fontFamily: 'Arial, sans-serif', padding: '26px 18px 90px' }}>
      <div style={{ maxWidth: 1080, margin: '0 auto' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <div><div style={eyebrow}>ARIDON · SALES TEAM LAUNCH</div><h1 style={{ fontSize: 'clamp(42px,7vw,68px)', lineHeight: .96, margin: '9px 0 6px', letterSpacing: -2 }}>Turn the website into a working sales system.</h1></div>
          <nav style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}><Link href="/customer/sales" style={navLink}>Sales Command</Link><Link href="/customer/assistant" style={navLink}>Ask Eva</Link></nav>
        </header>

        <p style={{ color: '#AEBAD0', fontSize: 18, lineHeight: 1.6, maxWidth: 820 }}>One launch teaches Scout the business, researches high-fit prospects and builds the first campaign draft. Aridon stops before external outreach so you can verify contacts and approve what leaves the system.</p>

        <section style={panel}>
          <form onSubmit={launch} style={{ display: 'grid', gap: 11 }}>
            <label style={label}>Company website<input required inputMode="url" placeholder="https://yourcompany.com" value={website} onChange={(event) => setWebsite(event.target.value)} style={input} /></label>
            <div className="two-col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <label style={label}>Target focus<input placeholder="e.g. manufacturers, property managers, utilities" value={focus} onChange={(event) => setFocus(event.target.value)} style={input} /></label>
              <label style={label}>Geography<input placeholder="e.g. New Mexico and Arizona" value={geography} onChange={(event) => setGeography(event.target.value)} style={input} /></label>
            </div>
            <div className="two-col" style={{ display: 'grid', gridTemplateColumns: '1fr 180px', gap: 10 }}>
              <label style={label}>Scheduling link <span style={helper}>(optional)</span><input inputMode="url" placeholder="https://calendly.com/..." value={bookingUrl} onChange={(event) => setBookingUrl(event.target.value)} style={input} /></label>
              <label style={label}>Prospects<input type="number" min={3} max={20} value={count} onChange={(event) => setCount(Math.max(3, Math.min(20, Number(event.target.value) || 10)))} style={input} /></label>
            </div>
            <button type="submit" disabled={!token || stage !== 'idle'} style={{ ...primary, opacity: !token || stage !== 'idle' ? .58 : 1, cursor: !token || stage !== 'idle' ? 'wait' : 'pointer' }}>{stage === 'idle' ? 'Launch My AI Sales Team' : 'Aridon Is Building It…'}</button>
          </form>

          <div style={{ marginTop: 15, display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: 8 }} className="progress-grid">
            <Progress active={stage === 'learn'} done={stage === 'research' || stage === 'campaign' || stage === 'done'} title="Learn" text="Company + ICP" />
            <Progress active={stage === 'research'} done={stage === 'campaign' || stage === 'done'} title="Research" text="Real prospects" />
            <Progress active={stage === 'campaign'} done={stage === 'done'} title="Build" text="Campaign draft" />
          </div>
          <div aria-live="polite" style={{ color: stage === 'done' ? '#9EF0CF' : '#9CAAC0', marginTop: 12, fontSize: 13 }}>{stageCopy}</div>
          {notice && <div style={{ marginTop: 12, background: '#2A1718', border: '1px solid #67333A', color: '#F2B6AD', borderRadius: 10, padding: '11px 13px' }}>{notice}</div>}
        </section>

        {result && (
          <section style={{ ...panel, marginTop: 16, borderColor: '#4A806C' }}>
            <div style={eyebrow}>READY FOR OWNER REVIEW</div>
            <h2 style={{ fontSize: 31, margin: '8px 0 5px' }}>{result.campaignName}</h2>
            <p style={{ color: '#B6C3D5', lineHeight: 1.55 }}>Scout found {result.prospects.length} prospects and built the campaign. Next, verify the actual business contacts, review the copy and connect or choose your Instantly campaign. No outreach has been sent.</p>
            <div style={{ display: 'grid', gap: 8, marginTop: 14 }}>
              {result.prospects.slice(0, 8).map((prospect) => (
                <article key={prospect.id} style={{ background: '#0A1220', border: '1px solid #263650', borderRadius: 12, padding: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}><strong>{prospect.company_name}</strong><span style={{ color: '#9EF0CF', fontSize: 12, fontWeight: 900 }}>FIT {prospect.fit_score || 0}/100</span></div>
                  <div style={{ color: '#92A2B9', fontSize: 12, marginTop: 3 }}>{prospect.location || prospect.recommended_buyer_role || 'Possible customer'}</div>
                  {prospect.fit_reason && <div style={{ color: '#C3CDDA', fontSize: 13, lineHeight: 1.45, marginTop: 7 }}>{prospect.fit_reason}</div>}
                </article>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 9, flexWrap: 'wrap', marginTop: 16 }}>
              <Link href="/customer/sales" style={primaryLink}>Review & Approve in Sales Command</Link>
              <Link href="/customer/assistant" style={secondaryLink}>Ask Eva What to Do Next</Link>
            </div>
          </section>
        )}
      </div>
      <style>{`@media(max-width:720px){.two-col,.progress-grid{grid-template-columns:1fr !important}}`}</style>
    </main>
  );
}

function Progress({ active, done, title, text }: { active: boolean; done: boolean; title: string; text: string }) {
  return <div style={{ background: done ? '#10271F' : active ? '#17243A' : '#0A1220', border: `1px solid ${done ? '#39725D' : active ? '#4A6287' : '#263650'}`, borderRadius: 12, padding: 11 }}><strong style={{ color: done ? '#9EF0CF' : '#F3F6FA' }}>{done ? '✓ ' : active ? '● ' : '○ '}{title}</strong><div style={{ color: '#8F9EB4', fontSize: 12, marginTop: 3 }}>{text}</div></div>;
}

const panel = { background: '#0D1523', border: '1px solid #293A57', borderRadius: 18, padding: 18, boxShadow: '0 20px 55px rgba(0,0,0,.18)' } as const;
const eyebrow = { color: '#9EF0CF', fontSize: 12, fontWeight: 950, letterSpacing: 1 } as const;
const label = { display: 'grid', gap: 7, color: '#DDE5F0', fontWeight: 850, fontSize: 13 } as const;
const helper = { color: '#8797AE', fontWeight: 500 } as const;
const input = { width: '100%', boxSizing: 'border-box', background: '#070B14', color: '#F7F9FD', border: '1px solid #3A4A64', borderRadius: 11, padding: '13px 14px', fontSize: 15, outline: 'none' } as const;
const primary = { border: 0, borderRadius: 11, background: '#9EF0CF', color: '#07130F', padding: '14px 17px', fontWeight: 950, fontSize: 15 } as const;
const navLink = { color: '#DDE5F0', border: '1px solid #40516D', textDecoration: 'none', borderRadius: 10, padding: '9px 11px', fontWeight: 850, fontSize: 13 } as const;
const primaryLink = { background: '#9EF0CF', color: '#07130F', textDecoration: 'none', borderRadius: 10, padding: '11px 13px', fontWeight: 950 } as const;
const secondaryLink = { color: '#DDE5F0', border: '1px solid #40516D', textDecoration: 'none', borderRadius: 10, padding: '11px 13px', fontWeight: 850 } as const;
