'use client';

import { FormEvent, useState } from 'react';

export default function CustomerAdminPage() {
  const [form, setForm] = useState({
    businessName: '', ownerName: '', contactEmail: '', industry: '', tagline: '', slug: '',
    plan: 'launch', primaryColor: '#0B1020', accentColor: '#72D6B2'
  });
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState('');
  const [workspaceUrl, setWorkspaceUrl] = useState('');

  async function submit(event: FormEvent) {
    event.preventDefault(); setSaving(true); setNotice(''); setWorkspaceUrl('');
    const response = await fetch('/api/customer-admin/provision', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) { setNotice(data.error || 'Unable to provision tenant.'); setSaving(false); return; }
    setNotice(`${data.tenant.business_name} customer workspace provisioned.`);
    setWorkspaceUrl(data.workspaceUrl || '');
    setSaving(false);
  }

  const input = { width: '100%', boxSizing: 'border-box' as const, background: '#0B1020', color: '#fff', border: '1px solid #2D3A57', borderRadius: '9px', padding: '10px 11px' };
  const label = { display: 'grid', gap: '5px', color: '#AAB6CC', fontSize: '12px', fontWeight: 800 };

  return (
    <main style={{ minHeight: '100vh', background: '#070A12', color: '#fff', padding: '28px 18px 110px' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        <div style={{ color: '#9EF0CF', fontSize: '12px', fontWeight: 950, letterSpacing: '1.3px' }}>ARIDON OPERATOR · CUSTOMER PROVISIONING</div>
        <h1 style={{ fontSize: 'clamp(34px,7vw,56px)', margin: '9px 0 12px' }}>Create a separate customer workspace.</h1>
        <p style={{ color: '#A9B4C9', lineHeight: 1.6 }}>Use this only after a customer is approved for activation. Their tenant goes into the customer OS tables, separate from Aridon’s internal projects, tasks and knowledge.</p>

        <form onSubmit={submit} style={{ background: '#0E1422', border: '1px solid #273451', borderRadius: '18px', padding: '20px', display: 'grid', gap: '13px', marginTop: '22px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: '12px' }} className="admin-grid">
            <label style={label}>Business name *<input required style={input} value={form.businessName} onChange={e=>setForm({...form,businessName:e.target.value})}/></label>
            <label style={label}>Owner name<input style={input} value={form.ownerName} onChange={e=>setForm({...form,ownerName:e.target.value})}/></label>
            <label style={label}>Contact email *<input required type="email" style={input} value={form.contactEmail} onChange={e=>setForm({...form,contactEmail:e.target.value})}/></label>
            <label style={label}>Industry<input style={input} value={form.industry} onChange={e=>setForm({...form,industry:e.target.value})}/></label>
            <label style={label}>Workspace slug<input placeholder="acme-electric" style={input} value={form.slug} onChange={e=>setForm({...form,slug:e.target.value})}/></label>
            <label style={label}>Plan<select style={input} value={form.plan} onChange={e=>setForm({...form,plan:e.target.value})}><option value="launch">Launch</option><option value="growth">Growth</option><option value="command">Command</option></select></label>
            <label style={label}>Primary color<input type="color" style={{...input,padding:'4px',height:'42px'}} value={form.primaryColor} onChange={e=>setForm({...form,primaryColor:e.target.value})}/></label>
            <label style={label}>Accent color<input type="color" style={{...input,padding:'4px',height:'42px'}} value={form.accentColor} onChange={e=>setForm({...form,accentColor:e.target.value})}/></label>
          </div>
          <label style={label}>Customer tagline<input placeholder="Run your company from one command center." style={input} value={form.tagline} onChange={e=>setForm({...form,tagline:e.target.value})}/></label>
          {notice && <div style={{ background: '#152016', border: '1px solid #4E8B69', borderRadius: '10px', padding: '11px 12px', color: '#CFF7E6' }}>{notice}</div>}
          <button type="submit" disabled={saving} style={{ border: 0, borderRadius: '10px', padding: '12px', fontWeight: 950, background: '#9EF0CF', color: '#0B1511', cursor: saving ? 'wait' : 'pointer' }}>{saving ? 'Provisioning…' : 'Provision Customer Tenant'}</button>
          {workspaceUrl && <a href={workspaceUrl} style={{ color: '#9BC9FF', fontWeight: 850, textAlign: 'center' }}>Open customer workspace →</a>}
        </form>
      </div>
      <style>{`@media(max-width:700px){.admin-grid{grid-template-columns:1fr !important}}`}</style>
    </main>
  );
}
