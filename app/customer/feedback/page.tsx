'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getBrowserClient } from '../../../lib/supabase';

export default function CustomerFeedbackPage() {
  const router = useRouter();
  const [slug, setSlug] = useState('');
  const [token, setToken] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [message, setMessage] = useState('');
  const [form, setForm] = useState({ rating: 5, likes: '', problems: '', missing: '', recommend: '', notes: '' });

  useEffect(() => {
    setSlug(new URLSearchParams(window.location.search).get('workspace') || '');
    getBrowserClient().auth.getSession().then(({ data }) => {
      if (!data.session?.access_token) {
        router.replace('/customer/login');
        return;
      }
      setToken(data.session.access_token);
    });
  }, [router]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!token || !slug) return;
    setSaving(true);
    setMessage('');

    const response = await fetch('/api/customer/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ ...form, slug }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      setMessage(data.error || 'Feedback could not be saved.');
      setSaving(false);
      return;
    }
    setSaved(true);
    setSaving(false);
  }

  if (saved) {
    return (
      <main style={pageStyle}>
        <div style={cardStyle}>
          <div style={eyebrow}>THANK YOU</div>
          <h1 style={{ fontSize: '42px', margin: '10px 0' }}>Your feedback is in.</h1>
          <p style={bodyStyle}>Specific feedback is how this system gets sharper. Your notes have been saved with your company workspace.</p>
          <Link href={`/workspace/${slug}`} style={primaryLink}>Back to my workspace</Link>
        </div>
      </main>
    );
  }

  return (
    <main style={pageStyle}>
      <form onSubmit={submit} style={{ ...cardStyle, maxWidth: '720px' }}>
        <div style={eyebrow}>PRODUCT FEEDBACK</div>
        <h1 style={{ fontSize: 'clamp(36px,7vw,54px)', lineHeight: 1, margin: '10px 0' }}>Help us make this useful enough to earn a permanent place in your business.</h1>
        <p style={bodyStyle}>Tell us what happened when you used the system on real work. Praise is welcome. Friction is gold.</p>

        <label style={labelStyle}>Overall value so far
          <select value={form.rating} onChange={(event) => setForm({ ...form, rating: Number(event.target.value) })} style={inputStyle}>
            <option value={5}>5 · I would keep using it</option>
            <option value={4}>4 · Very useful</option>
            <option value={3}>3 · Promising but needs work</option>
            <option value={2}>2 · More friction than value</option>
            <option value={1}>1 · Not useful yet</option>
          </select>
        </label>
        <label style={labelStyle}>What saved you time or helped you make a better decision?<textarea rows={5} value={form.likes} onChange={(event) => setForm({ ...form, likes: event.target.value })} style={textareaStyle} /></label>
        <label style={labelStyle}>What was confusing, slow, wrong, or frustrating?<textarea rows={5} value={form.problems} onChange={(event) => setForm({ ...form, problems: event.target.value })} style={textareaStyle} /></label>
        <label style={labelStyle}>What capability is missing that would make this much more valuable?<textarea rows={5} value={form.missing} onChange={(event) => setForm({ ...form, missing: event.target.value })} style={textareaStyle} /></label>
        <label style={labelStyle}>Would you recommend this to another business owner? Why or why not?<textarea rows={4} value={form.recommend} onChange={(event) => setForm({ ...form, recommend: event.target.value })} style={textareaStyle} /></label>
        <label style={labelStyle}>Anything else?<textarea rows={4} value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} style={textareaStyle} /></label>

        {message && <div style={{ background: '#2A1718', border: '1px solid #663238', color: '#F2B6AD', borderRadius: '10px', padding: '11px 13px' }}>{message}</div>}
        <button disabled={saving || !slug || !token} type="submit" style={{ border: 0, borderRadius: '11px', background: '#9EF0CF', color: '#08130F', padding: '14px', fontWeight: 950, fontSize: '16px', cursor: saving ? 'wait' : 'pointer' }}>{saving ? 'Saving feedback…' : 'Send Feedback'}</button>
      </form>
    </main>
  );
}

const pageStyle = { minHeight: '100vh', background: '#0B1020', color: '#F8FAFC', display: 'grid', placeItems: 'center', padding: '24px', fontFamily: 'Arial, sans-serif' };
const cardStyle = { width: '100%', maxWidth: '560px', background: '#111827', border: '1px solid #2A3857', borderRadius: '20px', padding: '24px', display: 'grid', gap: '14px' };
const eyebrow = { color: '#9EF0CF', fontSize: '12px', fontWeight: 950, letterSpacing: '1px' };
const bodyStyle = { color: '#B7C2D5', lineHeight: 1.65, margin: 0 };
const labelStyle = { display: 'grid', gap: '6px', color: '#D4DCEA', fontSize: '13px', fontWeight: 850 };
const inputStyle = { width: '100%', boxSizing: 'border-box' as const, background: '#0A1020', color: '#F8FAFC', border: '1px solid #34415D', borderRadius: '10px', padding: '12px 13px', fontSize: '15px' };
const textareaStyle = { ...inputStyle, resize: 'vertical' as const, lineHeight: 1.5 };
const primaryLink = { display: 'inline-block', textAlign: 'center' as const, background: '#9EF0CF', color: '#08130F', borderRadius: '11px', padding: '13px', fontWeight: 950, textDecoration: 'none' };
