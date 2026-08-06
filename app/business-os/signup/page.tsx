'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function BusinessOSSignup() {
  const router = useRouter();
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    ownerName: '', businessName: '', email: '', phone: '', website: '', industry: '',
    teamSize: '', bottleneck: '', plan: 'launch', capabilities: '', companyTrap: ''
  });

  useEffect(() => {
    const requested = new URLSearchParams(window.location.search).get('plan');
    if (requested && ['launch','growth','command'].includes(requested)) {
      setForm(current => ({ ...current, plan: requested }));
    }
  }, []);

  const ready = useMemo(() => form.ownerName.trim() && form.businessName.trim() && form.email.trim() && form.industry.trim(), [form]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!ready) return;
    setSending(true); setError('');
    const response = await fetch('/api/business-os/signup', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) { setError(data.error || 'We could not save your request.'); setSending(false); return; }
    const query = new URLSearchParams({ business: form.businessName, industry: form.industry, owner: form.ownerName });
    router.push(`/workspace/preview?${query.toString()}`);
  }

  const inputStyle = { width: '100%', boxSizing: 'border-box' as const, border: '1px solid #C9C5BA', borderRadius: '10px', padding: '12px 13px', fontSize: '15px', background: '#fff' };
  const labelStyle = { display: 'grid', gap: '6px', fontSize: '13px', fontWeight: 800, color: '#33332F' };

  return (
    <main style={{ minHeight: '100vh', background: '#F5F2EA', color: '#171717', padding: '30px 18px 70px', fontFamily: 'Arial, sans-serif' }}>
      <div style={{ maxWidth: '920px', margin: '0 auto' }}>
        <div style={{ fontSize: '12px', fontWeight: 950, letterSpacing: '1.2px' }}>PRIVATE BUSINESS OS</div>
        <h1 style={{ fontSize: 'clamp(38px, 7vw, 64px)', lineHeight: 1, margin: '12px 0 14px', letterSpacing: '-2px' }}>Tell us how your business works.</h1>
        <p style={{ color: '#56564F', fontSize: '18px', lineHeight: 1.6, maxWidth: '730px' }}>We use this to shape your private workspace, executive roles and first automation plan. Your customer site is branded around your business, not mixed into the Aridon command center.</p>

        <form onSubmit={submit} style={{ background: '#fff', border: '1px solid #D3CEC3', borderRadius: '20px', padding: '22px', marginTop: '26px', boxShadow: '0 20px 55px rgba(0,0,0,.07)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: '14px' }} className="signup-grid">
            <label style={labelStyle}>Your name *<input required style={inputStyle} value={form.ownerName} onChange={e=>setForm({...form,ownerName:e.target.value})}/></label>
            <label style={labelStyle}>Business name *<input required style={inputStyle} value={form.businessName} onChange={e=>setForm({...form,businessName:e.target.value})}/></label>
            <label style={labelStyle}>Email *<input required type="email" style={inputStyle} value={form.email} onChange={e=>setForm({...form,email:e.target.value})}/></label>
            <label style={labelStyle}>Phone<input style={inputStyle} value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})}/></label>
            <label style={labelStyle}>Website<input placeholder="https://..." style={inputStyle} value={form.website} onChange={e=>setForm({...form,website:e.target.value})}/></label>
            <label style={labelStyle}>Industry *<input required placeholder="Construction, medical, retail, consulting..." style={inputStyle} value={form.industry} onChange={e=>setForm({...form,industry:e.target.value})}/></label>
            <label style={labelStyle}>Team size<select style={inputStyle} value={form.teamSize} onChange={e=>setForm({...form,teamSize:e.target.value})}><option value="">Choose</option><option>1</option><option>2-5</option><option>6-15</option><option>16-50</option><option>51-200</option><option>200+</option></select></label>
            <label style={labelStyle}>Starting package<select style={inputStyle} value={form.plan} onChange={e=>setForm({...form,plan:e.target.value})}><option value="launch">Launch</option><option value="growth">Growth</option><option value="command">Command</option></select></label>
          </div>
          <div style={{ display: 'grid', gap: '14px', marginTop: '14px' }}>
            <label style={labelStyle}>What is eating the most owner time right now?<textarea rows={5} style={{...inputStyle,resize:'vertical'}} value={form.bottleneck} onChange={e=>setForm({...form,bottleneck:e.target.value})}/></label>
            <label style={labelStyle}>What would you want the AI team to handle first?<textarea rows={5} style={{...inputStyle,resize:'vertical'}} placeholder="Sales follow-up, proposals, scheduling, research, project management, customer service, finance..." value={form.capabilities} onChange={e=>setForm({...form,capabilities:e.target.value})}/></label>
            <input aria-hidden="true" tabIndex={-1} autoComplete="off" value={form.companyTrap} onChange={e=>setForm({...form,companyTrap:e.target.value})} style={{position:'absolute',left:'-10000px',width:'1px',height:'1px'}}/>
          </div>
          {error && <div style={{ marginTop: '14px', background: '#FDE8E6', border: '1px solid #EAB4AF', color: '#8D2F26', borderRadius: '10px', padding: '11px 13px' }}>{error}</div>}
          <button disabled={sending || !ready} type="submit" style={{ marginTop: '18px', width: '100%', border: 0, borderRadius: '12px', padding: '14px', background: '#171717', color: '#fff', fontSize: '16px', fontWeight: 950, cursor: sending ? 'wait' : 'pointer', opacity: ready ? 1 : .55 }}>{sending ? 'Building your preview…' : 'Create My Workspace Preview'}</button>
          <p style={{ color: '#777268', fontSize: '12px', lineHeight: 1.5, marginBottom: 0 }}>Submitting this form requests a business-system consultation. It does not start billing or create a paid subscription.</p>
        </form>
      </div>
      <style>{`@media (max-width:700px){.signup-grid{grid-template-columns:1fr !important}}`}</style>
    </main>
  );
}
