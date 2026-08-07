'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getBrowserClient } from '../../../lib/supabase';

type Account = {
  tenant: { slug: string; business_name: string };
};

export default function CustomerStartPage() {
  const router = useRouter();
  const [account, setAccount] = useState<Account | null>(null);

  useEffect(() => {
    const db = getBrowserClient();
    db.auth.getSession().then(async ({ data }) => {
      const token = data.session?.access_token;
      if (!token) {
        router.replace('/customer/login?next=/customer/start');
        return;
      }
      const response = await fetch('/api/customer/me', {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.tenant?.slug) {
        router.replace('/customer/login');
        return;
      }
      setAccount(result as Account);
    });
  }, [router]);

  if (!account) {
    return <main style={loadingStyle}>Opening your guide…</main>;
  }

  const home = `/workspace/${account.tenant.slug}`;

  return (
    <main style={{ minHeight: '100vh', background: '#08101D', color: '#F7FAFC', padding: '28px 18px 90px', fontFamily: 'Arial, sans-serif' }}>
      <div style={{ maxWidth: '980px', margin: '0 auto' }}>
        <nav style={navStyle}>
          <Link href={home} style={navLink}>Home</Link>
          <Link href="/customer/assistant" style={navLink}>Ask Eva</Link>
          <Link href="/customer/sales" style={navLink}>Find Customers</Link>
          <Link href="/customer/account" style={navLink}>Account</Link>
        </nav>

        <div style={{ color: '#9EF0CF', fontSize: '12px', fontWeight: 950, letterSpacing: '1px', marginTop: '34px' }}>START HERE</div>
        <h1 style={{ fontSize: 'clamp(40px,7vw,68px)', lineHeight: 1, margin: '10px 0 14px', letterSpacing: '-2px' }}>Three things are enough to get started.</h1>
        <p style={{ color: '#B5C1D4', fontSize: '18px', lineHeight: 1.65, maxWidth: '760px' }}>You do not need to learn an AI system. Tell it what your business needs, review what it gives you, and keep control of anything that could contact a customer or spend money.</p>

        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(250px,1fr))', gap: '14px', marginTop: '26px' }}>
          <ActionCard number="1" title="Ask Eva" text="Start here when you are not sure what to do. Eva can help with priorities, writing, research, decisions and planning." href="/customer/assistant" button="Ask Eva a question" />
          <ActionCard number="2" title="Find customers" text="Teach Scout what you sell, then let it research companies that may be a good fit. Nothing is sent automatically." href="/customer/sales" button="Open Sales" />
          <ActionCard number="3" title="Use your home screen" text="Your home screen shows your work, open tasks and the fastest paths back to Eva and sales." href={home} button="Go to Home" />
        </section>

        <section style={{ marginTop: '20px', background: '#111827', border: '1px solid #2A3857', borderRadius: '18px', padding: '20px' }}>
          <h2 style={{ marginTop: 0 }}>What the names mean</h2>
          <div style={{ display: 'grid', gap: '12px' }}>
            <Definition term="Home" text="Your company dashboard. This is the first screen to return to." />
            <Definition term="Eva" text="Your AI business partner. Ask for help in normal language, just like talking to a capable assistant." />
            <Definition term="Scout" text="Your sales helper. It learns who you sell to, researches possible customers and drafts outreach for your review." />
            <Definition term="Workspace" text="Your company’s private area. Your business information is kept separate from other customer companies." />
          </div>
        </section>

        <section style={{ marginTop: '20px', background: '#DDF8ED', color: '#102019', borderRadius: '18px', padding: '20px' }}>
          <strong style={{ fontSize: '20px' }}>The safety rule is simple: you stay in charge.</strong>
          <p style={{ lineHeight: 1.6, marginBottom: 0 }}>Research and drafts can be created for you, but sending outreach through connected sales tools requires your approval. If anything on the site feels unclear, use Ask Eva and describe what you are trying to accomplish.</p>
        </section>
      </div>
    </main>
  );
}

function ActionCard({ number, title, text, href, button }: { number: string; title: string; text: string; href: string; button: string }) {
  return (
    <article style={{ background: '#111827', border: '1px solid #2A3857', borderRadius: '18px', padding: '20px', display: 'flex', flexDirection: 'column' }}>
      <div style={{ width: '34px', height: '34px', borderRadius: '10px', display: 'grid', placeItems: 'center', background: '#9EF0CF', color: '#07130F', fontWeight: 950 }}>{number}</div>
      <h2 style={{ margin: '14px 0 6px' }}>{title}</h2>
      <p style={{ color: '#AFBCD0', lineHeight: 1.6, flex: 1 }}>{text}</p>
      <Link href={href} style={{ background: '#9EF0CF', color: '#07130F', borderRadius: '11px', padding: '12px 14px', textDecoration: 'none', fontWeight: 950, textAlign: 'center' }}>{button}</Link>
    </article>
  );
}

function Definition({ term, text }: { term: string; text: string }) {
  return <div style={{ display: 'grid', gridTemplateColumns: '110px 1fr', gap: '12px', borderTop: '1px solid #263551', paddingTop: '12px' }}><strong style={{ color: '#9EF0CF' }}>{term}</strong><span style={{ color: '#C5CFDE', lineHeight: 1.55 }}>{text}</span></div>;
}

const navStyle = { display: 'flex', gap: '8px', flexWrap: 'wrap' as const };
const navLink = { border: '1px solid #354461', color: '#E8EEF7', borderRadius: '10px', padding: '9px 12px', textDecoration: 'none', fontWeight: 850, fontSize: '13px' };
const loadingStyle = { minHeight: '100vh', background: '#08101D', color: '#F7FAFC', display: 'grid', placeItems: 'center', fontFamily: 'Arial, sans-serif' };
