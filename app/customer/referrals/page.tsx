'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getBrowserClient } from '../../../lib/supabase';

type Referral = {
  id: string;
  referred_business?: string | null;
  referred_email?: string | null;
  status?: string | null;
  created_at?: string | null;
};

type ReferralData = {
  code: string;
  url: string;
  businessName: string;
  referrals: Referral[];
};

export default function CustomerReferralPage() {
  const router = useRouter();
  const [data, setData] = useState<ReferralData | null>(null);
  const [message, setMessage] = useState('Loading your referral link…');

  useEffect(() => {
    const db = getBrowserClient();
    db.auth.getSession().then(async ({ data: sessionData }) => {
      const token = sessionData.session?.access_token;
      if (!token) {
        router.replace('/customer/login');
        return;
      }
      const response = await fetch('/api/customer/referral', { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        setMessage(result.error || 'Unable to create your referral link.');
        return;
      }
      setData(result as ReferralData);
      setMessage('');
    });
  }, [router]);

  async function copyLink() {
    if (!data?.url) return;
    await navigator.clipboard.writeText(data.url);
    setMessage('Referral link copied.');
    window.setTimeout(() => setMessage(''), 2200);
  }

  async function shareLink() {
    if (!data?.url) return;
    const shareText = `I’ve been testing a Private Business OS for running company work with an AI executive team. If you want to see what your own workspace could look like, here’s my invite:`;
    if (navigator.share) {
      await navigator.share({ title: 'Private Business OS', text: shareText, url: data.url });
      return;
    }
    await navigator.clipboard.writeText(`${shareText}\n${data.url}`);
    setMessage('Share message copied.');
    window.setTimeout(() => setMessage(''), 2200);
  }

  return (
    <main style={{ minHeight: '100vh', background: '#F5F2EA', color: '#171717', padding: '30px 18px 90px', fontFamily: 'Arial, sans-serif' }}>
      <div style={{ maxWidth: '920px', margin: '0 auto' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div><div style={{ fontSize: '12px', fontWeight: 950, letterSpacing: '1.1px' }}>CUSTOMER REFERRAL CENTER</div><h1 style={{ fontSize: 'clamp(38px,7vw,62px)', lineHeight: 1, margin: '10px 0 8px' }}>Know another business that should have its own AI operating system?</h1></div>
          <Link href="/customer/account" style={{ color: '#171717', fontWeight: 850 }}>Account</Link>
        </header>

        <p style={{ color: '#56564F', fontSize: '18px', lineHeight: 1.65, maxWidth: '760px' }}>Share your personal invitation. We track the referral so we know which customers are helping the product grow. The person you refer gets a clean preview first, not an automatic charge.</p>

        {message && <div style={{ background: '#FFF3D6', border: '1px solid #E7D08F', color: '#624F18', borderRadius: '11px', padding: '11px 13px', margin: '18px 0' }}>{message}</div>}

        {data && (
          <>
            <section style={{ background: '#171717', color: '#fff', borderRadius: '20px', padding: '22px', marginTop: '22px' }}>
              <div style={{ color: '#9EF0CF', fontSize: '12px', fontWeight: 950, letterSpacing: '1px' }}>YOUR INVITE CODE · {data.code}</div>
              <h2 style={{ fontSize: '30px', margin: '10px 0 8px' }}>{data.businessName} referral link</h2>
              <div style={{ background: '#252525', border: '1px solid #383838', borderRadius: '11px', padding: '12px 13px', wordBreak: 'break-word', color: '#DDE4EC' }}>{data.url}</div>
              <div style={{ display: 'flex', gap: '9px', flexWrap: 'wrap', marginTop: '13px' }}>
                <button onClick={copyLink} style={primaryButton}>Copy Referral Link</button>
                <button onClick={shareLink} style={secondaryButton}>Share with a Business Owner</button>
              </div>
            </section>

            <section style={{ marginTop: '20px', background: '#fff', border: '1px solid #D1CBC0', borderRadius: '18px', padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'baseline', flexWrap: 'wrap' }}><h2 style={{ margin: 0 }}>Your referral activity</h2><strong>{data.referrals.length} signup{data.referrals.length === 1 ? '' : 's'}</strong></div>
              {data.referrals.length === 0 ? <p style={{ color: '#66625A', lineHeight: 1.6 }}>No referred companies have completed the preview form yet.</p> : <div style={{ display: 'grid', gap: '9px', marginTop: '14px' }}>{data.referrals.map((referral) => <div key={referral.id} style={{ borderTop: '1px solid #E2DDD4', padding: '11px 0', display: 'flex', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}><div><strong>{referral.referred_business || 'Referred business'}</strong><div style={{ color: '#777168', fontSize: '12px', marginTop: '3px' }}>{referral.referred_email || ''}</div></div><div style={{ fontWeight: 850 }}>{referral.status || 'signup'}</div></div>)}</div>}
            </section>

            <section style={{ marginTop: '20px', background: '#DDF8ED', borderRadius: '18px', padding: '20px' }}>
              <strong style={{ fontSize: '20px' }}>Referral standard</strong>
              <p style={{ color: '#385047', lineHeight: 1.6, marginBottom: 0 }}>Refer it because it genuinely helps the business, not because someone was pressured into a sales funnel. Product quality is the referral engine.</p>
            </section>
          </>
        )}
      </div>
    </main>
  );
}

const primaryButton = { border: 0, borderRadius: '10px', background: '#9EF0CF', color: '#07130F', padding: '11px 14px', fontWeight: 950, cursor: 'pointer' };
const secondaryButton = { border: '1px solid #4C4C4C', borderRadius: '10px', background: '#252525', color: '#fff', padding: '11px 14px', fontWeight: 850, cursor: 'pointer' };
