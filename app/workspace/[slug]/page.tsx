import { notFound } from 'next/navigation';
import { getServerClient } from '../../../lib/supabase';

export const dynamic = 'force-dynamic';

type Tenant = {
  slug: string;
  business_name: string;
  owner_name: string | null;
  industry: string | null;
  tagline: string | null;
  primary_color: string | null;
  accent_color: string | null;
  status: string | null;
};

export default async function CustomerWorkspace({ params }: { params: { slug: string } }) {
  let tenant: Tenant | null = null;
  try {
    const db = getServerClient();
    const { data } = await db
      .from('customer_tenants')
      .select('slug,business_name,owner_name,industry,tagline,primary_color,accent_color,status')
      .eq('slug', params.slug)
      .maybeSingle();
    tenant = (data as Tenant | null) || null;
  } catch {
    tenant = null;
  }

  if (!tenant) notFound();

  const primary = tenant.primary_color || '#0B1020';
  const accent = tenant.accent_color || '#72D6B2';

  return (
    <main style={{ minHeight: '100vh', background: primary, color: '#F8FAFC', fontFamily: 'Arial, sans-serif', padding: '28px 18px 80px' }}>
      <div style={{ maxWidth: '1120px', margin: '0 auto' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', flexWrap: 'wrap', marginBottom: '34px' }}>
          <div>
            <div style={{ fontSize: '25px', fontWeight: 950 }}>{tenant.business_name}</div>
            <div style={{ color: '#C5CEDD', marginTop: '4px', fontSize: '13px' }}>{tenant.industry || 'Private Business'} · Executive Command Center</div>
          </div>
          <div style={{ border: `1px solid ${accent}88`, color: accent, borderRadius: '999px', padding: '8px 12px', fontSize: '12px', fontWeight: 900 }}>PRIVATE TENANT · {tenant.status || 'onboarding'}</div>
        </header>

        <section style={{ background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.12)', borderRadius: '22px', padding: '26px' }}>
          <div style={{ color: accent, fontSize: '12px', fontWeight: 950, letterSpacing: '1px' }}>YOUR BUSINESS OPERATING SYSTEM</div>
          <h1 style={{ fontSize: 'clamp(38px,7vw,66px)', lineHeight: 1, margin: '10px 0 14px' }}>{tenant.tagline || `Run ${tenant.business_name} from one command center.`}</h1>
          <p style={{ color: '#C8D0DE', maxWidth: '780px', lineHeight: 1.65, fontSize: '18px' }}>This tenant is reserved for {tenant.business_name}. Projects, tasks, company knowledge and automations are stored in the customer workspace layer, separate from the platform operator’s internal business records.</p>
        </section>

        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: '12px', marginTop: '16px' }}>
          {[
            ['Daily Brief','Priorities, decisions and blocked work'],
            ['Executive Team','Operations, strategy, finance, growth and risk'],
            ['Projects','Active work and definitions of done'],
            ['Customers','CRM, opportunities and follow-up'],
            ['Knowledge','Company documents, decisions and research'],
            ['Challenge Room','Competitors, assumptions, investors and economics'],
          ].map(([title,text]) => (
            <article key={title} style={{ background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.11)', borderRadius: '16px', padding: '18px' }}>
              <div style={{ color: accent, fontWeight: 950, fontSize: '18px' }}>{title}</div>
              <div style={{ color: '#BCC6D6', lineHeight: 1.5, marginTop: '6px', fontSize: '14px' }}>{text}</div>
            </article>
          ))}
        </section>

        <section style={{ marginTop: '18px', border: `1px solid ${accent}55`, background: 'rgba(0,0,0,.18)', borderRadius: '16px', padding: '18px' }}>
          <strong style={{ color: accent }}>Activation status</strong>
          <p style={{ color: '#C8D0DE', lineHeight: 1.6, marginBottom: 0 }}>The branded tenant shell is live. Confidential customer data should only be added after customer authentication and tenant-specific access policies are activated.</p>
        </section>
      </div>
    </main>
  );
}
