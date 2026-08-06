'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getBrowserClient } from '../../../lib/supabase';

type WorkspaceData = {
  email: string;
  role: string;
  tenant: {
    id: string;
    slug: string;
    business_name: string;
    owner_name: string | null;
    industry: string | null;
    tagline: string | null;
    primary_color: string | null;
    accent_color: string | null;
    plan: string | null;
    status: string | null;
    subscription_status: string | null;
  };
  projects: Array<{ id: string; name: string; description?: string | null; status?: string | null }>;
  tasks: Array<{ id: string; title: string; owner?: string | null; priority?: string | null; status?: string | null }>;
  knowledge: Array<{ id: string; title: string; category?: string | null }>;
};

export default function CustomerWorkspace({ params }: { params: { slug: string } }) {
  const router = useRouter();
  const [data, setData] = useState<WorkspaceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const db = getBrowserClient();
    db.auth.getSession().then(async ({ data: sessionData }) => {
      const token = sessionData.session?.access_token;
      if (!token) {
        router.replace(`/customer/login?next=${encodeURIComponent(`/workspace/${params.slug}`)}`);
        return;
      }

      const response = await fetch(`/api/customer/workspace?slug=${encodeURIComponent(params.slug)}`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
      });
      const result = await response.json().catch(() => ({}));
      if (response.status === 401 || response.status === 403) {
        await db.auth.signOut();
        router.replace('/customer/login');
        return;
      }
      if (!response.ok) {
        setError(result.error || 'Unable to load this workspace.');
        setLoading(false);
        return;
      }
      setData(result as WorkspaceData);
      setLoading(false);
    });
  }, [params.slug, router]);

  async function signOut() {
    await getBrowserClient().auth.signOut();
    router.replace('/customer/login');
  }

  if (loading) {
    return <main style={{ minHeight: '100vh', background: '#0B1020', color: '#F8FAFC', display: 'grid', placeItems: 'center', fontFamily: 'Arial, sans-serif' }}>Opening your private workspace…</main>;
  }

  if (!data) {
    return (
      <main style={{ minHeight: '100vh', background: '#0B1020', color: '#F8FAFC', display: 'grid', placeItems: 'center', padding: '24px', fontFamily: 'Arial, sans-serif' }}>
        <div style={{ maxWidth: '520px', textAlign: 'center' }}><h1>Workspace unavailable</h1><p style={{ color: '#B7C2D5', lineHeight: 1.6 }}>{error}</p><Link href="/customer/account" style={{ color: '#9EF0CF', fontWeight: 900 }}>Open account</Link></div>
      </main>
    );
  }

  const tenant = data.tenant;
  const primary = tenant.primary_color || '#0B1020';
  const accent = tenant.accent_color || '#72D6B2';
  const activeTasks = data.tasks.filter((task) => !['done', 'complete', 'completed', 'closed'].includes((task.status || '').toLowerCase()));

  return (
    <main style={{ minHeight: '100vh', background: primary, color: '#F8FAFC', fontFamily: 'Arial, sans-serif', padding: '28px 18px 90px' }}>
      <div style={{ maxWidth: '1120px', margin: '0 auto' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', flexWrap: 'wrap', marginBottom: '28px' }}>
          <div>
            <div style={{ fontSize: '26px', fontWeight: 950 }}>{tenant.business_name}</div>
            <div style={{ color: '#C5CEDD', marginTop: '4px', fontSize: '13px' }}>{tenant.industry || 'Private Business'} · Executive Command Center</div>
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <Link href={`/customer/feedback?workspace=${encodeURIComponent(tenant.slug)}`} style={{ border: `1px solid ${accent}88`, color: accent, borderRadius: '999px', padding: '9px 12px', fontSize: '12px', fontWeight: 900, textDecoration: 'none' }}>Send Feedback</Link>
            <Link href="/customer/account" style={{ border: '1px solid rgba(255,255,255,.2)', color: '#F8FAFC', borderRadius: '999px', padding: '9px 12px', fontSize: '12px', fontWeight: 850, textDecoration: 'none' }}>Account</Link>
            <button onClick={signOut} style={{ border: '1px solid rgba(255,255,255,.2)', background: 'transparent', color: '#F8FAFC', borderRadius: '999px', padding: '9px 12px', fontSize: '12px', fontWeight: 850, cursor: 'pointer' }}>Sign out</button>
          </div>
        </header>

        <section style={{ background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.12)', borderRadius: '22px', padding: '26px' }}>
          <div style={{ color: accent, fontSize: '12px', fontWeight: 950, letterSpacing: '1px' }}>YOUR BUSINESS OPERATING SYSTEM</div>
          <h1 style={{ fontSize: 'clamp(38px,7vw,66px)', lineHeight: 1, margin: '10px 0 14px' }}>{tenant.tagline || `Run ${tenant.business_name} from one command center.`}</h1>
          <p style={{ color: '#C8D0DE', maxWidth: '780px', lineHeight: 1.65, fontSize: '18px' }}>Your company projects, tasks, knowledge and operating decisions are loaded through your customer login and tenant membership. This workspace does not expose the platform operator’s internal business records.</p>
        </section>

        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(210px,1fr))', gap: '12px', marginTop: '16px' }}>
          {[
            ['Active Projects', String(data.projects.length), 'Work currently tracked in your company tenant'],
            ['Open Tasks', String(activeTasks.length), 'Items still waiting to be finished'],
            ['Knowledge Items', String(data.knowledge.length), 'Company research and operating memory'],
            ['Access', tenant.subscription_status === 'beta' ? 'BETA' : (tenant.plan || 'ACTIVE').toUpperCase(), tenant.subscription_status === 'beta' ? 'No-cost invited test workspace' : 'Customer subscription workspace'],
          ].map(([label, value, note]) => (
            <article key={label} style={{ background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.11)', borderRadius: '16px', padding: '18px' }}>
              <div style={{ color: accent, fontWeight: 950, fontSize: '30px' }}>{value}</div>
              <div style={{ fontWeight: 900, marginTop: '5px' }}>{label}</div>
              <div style={{ color: '#BCC6D6', lineHeight: 1.45, marginTop: '5px', fontSize: '13px' }}>{note}</div>
            </article>
          ))}
        </section>

        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: '14px', marginTop: '18px' }}>
          <div style={panelStyle}>
            <div style={{ color: accent, fontSize: '12px', fontWeight: 950, letterSpacing: '.8px' }}>PROJECTS</div>
            <h2 style={{ margin: '8px 0 12px' }}>What the company is moving</h2>
            {data.projects.length === 0 ? <p style={mutedStyle}>No customer projects have been added yet.</p> : data.projects.slice(0, 6).map((project) => <div key={project.id} style={rowStyle}><strong>{project.name}</strong><span style={{ color: '#AEB9CB', fontSize: '12px' }}>{project.status || 'active'}</span></div>)}
          </div>
          <div style={panelStyle}>
            <div style={{ color: accent, fontSize: '12px', fontWeight: 950, letterSpacing: '.8px' }}>TASKS</div>
            <h2 style={{ margin: '8px 0 12px' }}>What needs attention</h2>
            {activeTasks.length === 0 ? <p style={mutedStyle}>No open customer tasks are waiting right now.</p> : activeTasks.slice(0, 8).map((task) => <div key={task.id} style={rowStyle}><strong>{task.title}</strong><span style={{ color: '#AEB9CB', fontSize: '12px' }}>{task.priority || 'medium'} · {task.status || 'open'}</span></div>)}
          </div>
        </section>

        <section style={{ marginTop: '18px', border: `1px solid ${accent}55`, background: 'rgba(0,0,0,.18)', borderRadius: '16px', padding: '18px' }}>
          <strong style={{ color: accent }}>Help shape the product while you use it.</strong>
          <p style={{ color: '#C8D0DE', lineHeight: 1.6, margin: '6px 0 12px' }}>Use the system on real work, then tell us what saved time, what broke your flow, and what you expected it to do next.</p>
          <Link href={`/customer/feedback?workspace=${encodeURIComponent(tenant.slug)}`} style={{ color: accent, fontWeight: 950 }}>Send product feedback →</Link>
        </section>
      </div>
    </main>
  );
}

const panelStyle = { background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.11)', borderRadius: '16px', padding: '18px' };
const rowStyle = { display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,.08)', padding: '11px 0' };
const mutedStyle = { color: '#AEB9CB', lineHeight: 1.6 };
