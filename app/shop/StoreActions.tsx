'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import styles from './shop.module.css';

function ids() {
  if (typeof window === 'undefined') return { visitorId: '', sessionId: '' };
  let visitorId = localStorage.getItem('aridon_store_visitor') || '';
  if (!visitorId) {
    visitorId = crypto.randomUUID();
    localStorage.setItem('aridon_store_visitor', visitorId);
  }
  let sessionId = sessionStorage.getItem('aridon_store_session') || '';
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    sessionStorage.setItem('aridon_store_session', sessionId);
  }
  return { visitorId, sessionId };
}

export function TrackView({ eventName, productId, data }: {
  eventName: 'store_view' | 'category_view' | 'product_view';
  productId?: string;
  data?: Record<string, unknown>;
}) {
  useEffect(() => {
    const identity = ids();
    fetch('/api/store/event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...identity, eventName, productId, url: window.location.href, data }),
      keepalive: true,
    }).catch(() => undefined);
  }, [eventName, productId]);
  return null;
}

export function LeadForm({ category, productId, productInterest, heading = 'Tell us what you need' }: {
  category?: string;
  productId?: string;
  productInterest?: string;
  heading?: string;
}) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const source = useMemo(() => typeof window === 'undefined' ? '/shop' : window.location.pathname, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true); setError(''); setMessage('');
    const form = new FormData(event.currentTarget);
    const identity = ids();
    const payload = {
      name: String(form.get('name') || ''),
      email: String(form.get('email') || ''),
      phone: String(form.get('phone') || ''),
      company: String(form.get('company') || ''),
      notes: String(form.get('notes') || ''),
      website: String(form.get('website') || ''),
      category,
      productId,
      productInterest: productInterest || category || 'Aridon Market',
      sourceUrl: window.location.href,
      source,
      ...identity,
    };
    try {
      const response = await fetch('/api/store/lead', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unable to send your request.');
      setMessage('Request received. Eva and the Aridon team now have it in the commerce pipeline.');
      event.currentTarget.reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to send your request.');
    } finally {
      setBusy(false);
    }
  }

  return <div className={styles.panel}>
    <h2>{heading}</h2>
    <p>We can confirm availability, freight, system fit and dealer-authorized pricing before you buy.</p>
    <form className={`${styles.form} ${busy ? styles.loading : ''}`} onSubmit={submit}>
      <input name="name" placeholder="Your name" required maxLength={120}/>
      <input name="email" type="email" placeholder="Email" required maxLength={180}/>
      <input name="phone" placeholder="Phone (optional)" maxLength={60}/>
      <input name="company" placeholder="Company / farm / ranch (optional)" maxLength={160}/>
      <textarea name="notes" placeholder="What are you trying to build or buy?" maxLength={1800}/>
      <input name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" style={{position:'absolute',left:'-9999px'}}/>
      <button className={styles.button} type="submit">{busy ? 'Sending…' : 'Request pricing / help'}</button>
    </form>
    {message && <div className={styles.success}>{message}</div>}
    {error && <div className={styles.error}>{error}</div>}
    <div className={styles.notice}>No payment is taken through this form. Products only move to direct checkout after reseller authorization, verified price and freight terms.</div>
  </div>;
}

export function BuyButton({ productId, label = 'Secure checkout' }: { productId: string; label?: string }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function buy() {
    setBusy(true); setError('');
    try {
      const identity = ids();
      const response = await fetch('/api/store/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, ...identity, sourceUrl: window.location.href }),
      });
      const data = await response.json();
      if (!response.ok || !data.url) throw new Error(data.error || 'Checkout is unavailable.');
      window.location.assign(data.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Checkout is unavailable.');
      setBusy(false);
    }
  }
  return <>
    <button className={`${styles.button} ${busy ? styles.loading : ''}`} onClick={buy} disabled={busy}>{busy ? 'Opening checkout…' : label}</button>
    {error && <div className={styles.error}>{error}</div>}
  </>;
}
