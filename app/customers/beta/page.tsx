'use client';

import { FormEvent, useState } from 'react';

export default function BetaInviteConsole() {
  const [form, setForm] = useState({ businessName: '', ownerName: '', email: '', industry: '', feedbackContact: '', days: '14' });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [inviteUrl, setInviteUrl] = useState('');

  async function createInvite(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setMessage('');
    setInviteUrl('');

    const response = await fetch('/api/customers/beta-invite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      setMessage(data.error || 'The beta invite could not be created.');
      setLoading(false);
      return;
    }

    setInviteUrl(data.url || '');
    setMessage(`Invite created. It expires ${new Date(data.expiresAt).toLocaleString()}.`);
    setLoading(false);
  }

  async function copyInvite() {
    if (!inviteUrl) return;
    await navigator.clipboard.writeText(inviteUrl);
    setMessage('Invite link copied. Send it directly to the test company.');
  }

  return (
    <main style={{ minHeight: '100vh', background: '#070A12', color: '#F6F8FC', padding: '32px 18px 120px', fontFamily: 'Arial, sans-serif' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        <div style={{ color: '#9EF0CF', fontWeight: 950, fontSize: '12px', letterSpacing: '1.2px' }}>CUSTOMER BETA INVITES</div>
        <h1 style={{ fontSize: 'clamp(38px,7vw,64px)', lineHeight: 1, margin: '10px 0 14px' }}>Give a company a private test workspace at no cost.</h1>
        <p style={{ color: '#AAB5CA', lineHeight: 1.6, fontSize: '18px', maxWidth: '760px' }}>Generate a one-time invitation. The company sets its own password, receives a separate branded tenant, and can send structured feedback from inside the workspace. No Stripe checkout is involved.</p>

        <form onSubmit={createInvite} style={{ marginTop: '24px', background: '#0F1523', border: '1px solid #273551', borderRadius: '18px', padding: '20px', display: 'grid', gap: '14px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: '14px' }} className="beta-grid">
            <label style={labelStyle}>Business name<input required style={inputStyle} value={form.businessName} onChange={(event) => setForm({ ...form, businessName: event.target.value })} /></label>
            <label style={labelStyle}>Owner / test lead<input required style={inputStyle} value={form.ownerName} onChange={(event) => setForm({ ...form, ownerName: event.target.value })} /></label>
            <label style={labelStyle}>Company email<input required type="email" style={inputStyle} value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} /></label>
            <label style={labelStyle}>Industry<input required style={inputStyle} value={form.industry} onChange={(event) => setForm({ ...form, industry: event.target.value })} /></label>
            <label style={labelStyle}>Feedback contact, optional<input style={inputStyle} placeholder="Who should receive/follow up on feedback?" value={form.feedbackContact} onChange={(event) => setForm({ ...form, feedbackContact: event.target.value })} /></label>
            <label style={labelStyle}>Invite expires in days<input type="number" min="1" max="60" style={inputStyle} value={form.days} onChange={(event) => setForm({ ...form, days: event.target.value })} /></label>
          </div>

          {message && <div style={{ background: '#182238', border: '1px solid #314363', borderRadius: '10px', padding: '11px 13px', color: '#D6E1F4' }}>{message}</div>}
          {inviteUrl && <div style={{ display: 'grid', gap: '9px' }}><textarea readOnly rows={3} value={inviteUrl} style={{ ...inputStyle, resize: 'none' }} /><button type="button" onClick={copyInvite} style={{ border: 0, borderRadius: '10px', background: '#9EF0CF', color: '#08130F', padding: '12px', fontWeight: 950, cursor: 'pointer' }}>Copy Test Company Invite</button></div>}
          <button disabled={loading} type="submit" style={{ border: 0, borderRadius: '11px', background: '#C9A7FF', color: '#181020', padding: '13px', fontWeight: 950, cursor: loading ? 'wait' : 'pointer' }}>{loading ? 'Creating invite…' : 'Create No-Cost Beta Invite'}</button>
        </form>
      </div>
      <style>{`@media(max-width:700px){.beta-grid{grid-template-columns:1fr !important}}`}</style>
    </main>
  );
}

const labelStyle = { display: 'grid', gap: '6px', color: '#C9D3E5', fontSize: '13px', fontWeight: 850 };
const inputStyle = { width: '100%', boxSizing: 'border-box' as const, border: '1px solid #34415D', borderRadius: '10px', padding: '12px 13px', fontSize: '15px', background: '#090F1C', color: '#F6F8FC' };
