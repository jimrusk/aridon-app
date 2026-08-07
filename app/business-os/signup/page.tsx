'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const planHelp: Record<string, string> = {
  launch: 'Simple workspace and AI help for an owner getting started.',
  growth: 'Adds stronger sales, research and recurring execution tools.',
  command: 'Adds deeper automation, integrations and custom workflows.',
};

export default function BusinessOSSignup() {
  const router = useRouter();
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [showMore, setShowMore] = useState(false);
  const [form, setForm] = useState({
    ownerName: '', businessName: '', email: '', phone: '', website: '', industry: '',
    teamSize: '', bottleneck: '', plan: 'launch', capabilities: '', companyTrap: '', referralCode: ''
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const requested = params.get('plan');
    const referralCode = (params.get('ref') || '').trim().slice(0, 40).toUpperCase();
    setForm(current => ({
      ...current,
      plan: requested && ['launch','growth','command'].includes(requested) ? requested : current.plan,
      referralCode,
    }));
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
    const query = new URLSearchParams({ business: form.businessName, industry: form.industry, owner: form.ownerName, plan: form.plan });
    router.push(`/workspace/preview?${query.toString()}`);
  }

  return (
    <main style={{ minHeight: '100vh', background: '#F5F2EA', color: '#171717', padding: '30px 18px 70px', fontFamily: 'Arial, sans-serif' }}>
      <div style={{ maxWidth: '880px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          <Link href="/business-os" style={{ color: '#171717', fontWeight: 900, textDecoration: 'none' }}>← Private Business OS</Link>
          <Link href="/customer/login" style={{ color: '#171717', fontWeight: 850 }}>Already a customer? Sign in</Link>
        </div>

        <div style={{ marginTop: '34px', color: '#666158', fontSize: '12px', fontWeight: 950 }}>STEP 1 OF 2 · TELL US ABOUT YOUR BUSINESS</div>
        <h1 style={{ fontSize: 'clamp(38px,7vw,62px)', lineHeight: 1, margin: '10px 0 14px', letterSpacing: '-2px' }}>Create a free preview for your company.</h1>
        <p style={{ color: '#56564F', fontSize: '18px', lineHeight: 1.6, maxWidth: '720px' }}>Fill in the basics below. We will show you what the workspace can look like for your business. This does not charge you or start a subscription.</p>

        {form.referralCode && <div style={{ marginTop: '18px', background: '#E7F8F0', border: '1px solid #A7D9C5', color: '#173D30', borderRadius: '12px', padding: '12px 14px', fontWeight: 800 }}>You were invited by a current customer.</div>}

        <form onSubmit={submit} style={{ background: '#fff', border: '1px solid #D3CEC3', borderRadius: '20px', padding: '22px', marginTop: '24px', boxShadow: '0 20px 55px rgba(0,0,0,.07)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: '14px' }} className="signup-grid">
            <Field label="Your name *"><input required style={inputStyle} value={form.ownerName} onChange={e=>setForm({...form,ownerName:e.target.value})}/></Field>
            <Field label="Business name *"><input required style={inputStyle} value={form.businessName} onChange={e=>setForm({...form,businessName:e.target.value})}/></Field>
            <Field label="Business email *"><input required type="email" style={inputStyle} value={form.email} onChange={e=>setForm({...form,email:e.target.value})}/></Field>
            <Field label="Industry *"><input required placeholder="Construction, retail, consulting..." style={inputStyle} value={form.industry} onChange={e=>setForm({...form,industry:e.target.value})}/></Field>
            <Field label="Website"><input placeholder="https://..." style={inputStyle} value={form.website} onChange={e=>setForm({...form,website:e.target.value})}/></Field>
            <Field label="Phone"><input style={inputStyle} value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})}/></Field>
          </div>

          <div style={{ marginTop: '18px', background: '#F5F2EA', borderRadius: '14px', padding: '16px' }}>
            <label style={labelStyle}>Which setup sounds closest to what you need?
              <select style={inputStyle} value={form.plan} onChange={e=>setForm({...form,plan:e.target.value})}>
                <option value="launch">Launch</option><option value="growth">Growth</option><option value="command">Command</option>
              </select>
            </label>
            <div style={{ color: '#666158', lineHeight: 1.5, fontSize: '13px', marginTop: '7px' }}>{planHelp[form.plan]} You can change this later.</div>
          </div>

          <button type="button" onClick={() => setShowMore(!showMore)} style={{ marginTop: '16px', border: 0, background: 'transparent', padding: 0, color: '#333', fontWeight: 900, cursor: 'pointer' }}>{showMore ? 'Hide optional details ↑' : 'Add optional details to personalize the preview ↓'}</button>

          {showMore && <div style={{ display: 'grid', gap: '14px', marginTop: '14px' }}>
            <Field label="Team size"><select style={inputStyle} value={form.teamSize} onChange={e=>setForm({...form,teamSize:e.target.value})}><option value="">Choose</option><option>1</option><option>2-5</option><option>6-15</option><option>16-50</option><option>51-200</option><option>200+</option></select></Field>
            <Field label="What takes too much of your time right now?"><textarea rows={4} style={{...inputStyle,resize:'vertical'}} placeholder="Follow-up, proposals, scheduling, research..." value={form.bottleneck} onChange={e=>setForm({...form,bottleneck:e.target.value})}/></Field>
            <Field label="What would you like the AI team to help with first?"><textarea rows={4} style={{...inputStyle,resize:'vertical'}} placeholder="Find customers, organize projects, prepare emails, research competitors..." value={form.capabilities} onChange={e=>setForm({...form,capabilities:e.target.value})}/></Field>
          </div>}

          <input aria-hidden="true" tabIndex={-1} autoComplete="off" value={form.companyTrap} onChange={e=>setForm({...form,companyTrap:e.target.value})} style={{position:'absolute',left:'-10000px',width:'1px',height:'1px'}}/>
          {error && <div style={{ marginTop: '14px', background: '#FDE8E6', border: '1px solid #EAB4AF', color: '#8D2F26', borderRadius: '10px', padding: '11px 13px' }}>{error}</div>}
          <button disabled={sending || !ready} type="submit" style={{ marginTop: '20px', width: '100%', border: 0, borderRadius: '12px', padding: '14px', background: '#171717', color: '#fff', fontSize: '16px', fontWeight: 950, cursor: sending ? 'wait' : 'pointer', opacity: ready ? 1 : .55 }}>{sending ? 'Building your preview…' : 'Show Me My Workspace Preview'}</button>
          <p style={{ color: '#777268', fontSize: '12px', lineHeight: 1.5, marginBottom: 0 }}>Next, you will see a sample workspace using your business name. No payment information is requested here.</p>
        </form>
      </div>
      <style>{`@media (max-width:700px){.signup-grid{grid-template-columns:1fr !important}}`}</style>
    </main>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label style={labelStyle}>{label}{children}</label>;
}

const inputStyle = { width: '100%', boxSizing: 'border-box' as const, border: '1px solid #C9C5BA', borderRadius: '10px', padding: '12px 13px', fontSize: '15px', background: '#fff' };
const labelStyle = { display: 'grid', gap: '6px', fontSize: '13px', fontWeight: 800, color: '#33332F' };
