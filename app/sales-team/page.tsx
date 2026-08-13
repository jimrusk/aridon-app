'use client';

import Link from 'next/link';
import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function SalesTeamLandingPage() {
  const router = useRouter();
  const [website, setWebsite] = useState('');
  const [focus, setFocus] = useState('');

  function normalizeWebsite(value: string) {
    const trimmed = value.trim();
    if (!trimmed) return '';
    return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    const url = normalizeWebsite(website);
    if (!url) return;
    const trimmedFocus = focus.trim();
    try {
      window.sessionStorage.setItem('business-os-beta-draft', JSON.stringify({
        website: url,
        goal: trimmedFocus
          ? `Build an AI sales team and find qualified prospects. Initial focus: ${trimmedFocus}`
          : 'Build an AI sales team and find qualified prospects.',
      }));
      window.sessionStorage.setItem('aridon-sales-team-intent', JSON.stringify({ website: url, focus: trimmedFocus }));
    } catch {
      // Query parameters still carry the URL if browser storage is unavailable.
    }
    const params = new URLSearchParams({ website: url, mode: 'sales-team' });
    if (trimmedFocus) params.set('focus', trimmedFocus);
    router.push(`/business-os/beta?${params.toString()}`);
  }

  return (
    <main style={{ minHeight: '100vh', background: '#07101D', color: '#F8FAFC', fontFamily: 'Arial, sans-serif' }}>
      <section style={{ maxWidth: 1120, margin: '0 auto', padding: '26px 20px 80px' }}>
        <nav style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <Link href="/business-os" style={{ color: '#F8FAFC', textDecoration: 'none', fontWeight: 950, letterSpacing: .8 }}>ARIDON · EXECUTIVE OS</Link>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <Link href="/analyze-business" style={outline}>Analyze Any Business</Link>
            <Link href="/customer/login?next=/customer/sales/launch" style={outline}>Existing Customer</Link>
          </div>
        </nav>

        <div style={{ maxWidth: 900, paddingTop: 72 }}>
          <div style={eyebrow}>ARIDON · AI SALES TEAM</div>
          <h1 style={{ fontSize: 'clamp(50px,8vw,88px)', lineHeight: .92, letterSpacing: -3.5, margin: '16px 0 22px' }}>Drop your URL. Put an AI executive sales team to work.</h1>
          <p style={{ color: '#BCC8D8', fontSize: 20, lineHeight: 1.65, maxWidth: 820 }}>Aridon learns what you sell, researches companies that fit, builds a truthful outreach sequence, and prepares approved prospects for your outbound system. You keep control of who gets contacted.</p>
        </div>

        <form onSubmit={submit} style={{ marginTop: 32, background: '#0D1728', border: '1px solid #2D3E5D', borderRadius: 22, padding: 20, display: 'grid', gap: 12, boxShadow: '0 28px 70px rgba(0,0,0,.24)' }}>
          <label style={label}>Your company website
            <input required inputMode="url" autoCapitalize="none" placeholder="www.yourbusiness.com" value={website} onChange={(event) => setWebsite(event.target.value)} style={input} />
          </label>
          <label style={label}>Optional sales focus
            <input placeholder="Example: commercial property managers in New Mexico" value={focus} onChange={(event) => setFocus(event.target.value)} style={input} />
          </label>
          <button type="submit" style={primary}>Build My AI Sales Team</button>
          <div style={{ color: '#8FA0B8', fontSize: 12, lineHeight: 1.55 }}>Starts with a free private Business OS workspace. No credit card. Aridon can research and draft automatically, but external outreach still requires your approval.</div>
        </form>

        <section style={{ marginTop: 54 }}>
          <div style={eyebrow}>WHAT ARIDON BUILDS</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(230px,1fr))', gap: 12, marginTop: 16 }}>
            {[
              ['1', 'Scout learns the company', 'Offer, ideal customer, buyer roles, geography, differentiators and buying triggers.'],
              ['2', 'Scout finds real prospects', 'Current public research, fit scores, why-now triggers and recommended buyer roles.'],
              ['3', 'Oracle sharpens the message', 'Clear positioning and credible personalization without invented proof or fake urgency.'],
              ['4', 'Campaign gets built', 'A restrained multi-step sequence is prepared for the selected prospects.'],
              ['5', 'You approve outbound', 'Verified business contacts can be pushed into Instantly only after explicit approval.'],
              ['6', 'Eva keeps the pipeline visible', 'The Sales Command workspace keeps prospects, campaigns and next actions in one place.'],
            ].map(([number, title, text]) => (
              <article key={title} style={{ background: '#0D1728', border: '1px solid #293A57', borderRadius: 16, padding: 18 }}>
                <div style={{ width: 32, height: 32, borderRadius: 10, display: 'grid', placeItems: 'center', background: '#9EF0CF', color: '#07130F', fontWeight: 950 }}>{number}</div>
                <h2 style={{ fontSize: 20, margin: '12px 0 7px' }}>{title}</h2>
                <p style={{ color: '#AEBBD0', lineHeight: 1.55, margin: 0, fontSize: 14 }}>{text}</p>
              </article>
            ))}
          </div>
        </section>
      </section>
      <style>{`@media(max-width:680px){form{padding:16px !important}}`}</style>
    </main>
  );
}

const eyebrow = { color: '#9EF0CF', fontSize: 12, fontWeight: 950, letterSpacing: 1.1 } as const;
const label = { display: 'grid', gap: 7, color: '#DDE5F0', fontWeight: 850, fontSize: 13 } as const;
const input = { width: '100%', boxSizing: 'border-box', background: '#07101D', color: '#F8FAFC', border: '1px solid #40516E', borderRadius: 12, padding: '15px 16px', fontSize: 16, outline: 'none' } as const;
const primary = { border: 0, borderRadius: 12, background: '#9EF0CF', color: '#07130F', padding: '15px 18px', fontSize: 16, fontWeight: 950, cursor: 'pointer' } as const;
const outline = { color: '#E8EDF5', border: '1px solid #40516D', textDecoration: 'none', borderRadius: 10, padding: '9px 12px', fontWeight: 850, fontSize: 13 } as const;
