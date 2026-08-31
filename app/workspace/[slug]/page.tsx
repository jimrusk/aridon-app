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
        headers: { Authorization: `Bearer ${token}` }, cache: 'no-store',
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

  if (loading) return <main style={loadingStyle}>Opening your company home…</main>;
  if (!data) return <main style={loadingStyle}><div style={{ maxWidth: '520px', textAlign: 'center' }}><h1>We could not open your workspace.</h1><p style={{ color: '#B7C2D5' }}>{error}</p><Link href="/customer/account" style={{ color: '#9EF0CF', fontWeight: 900 }}>Open account</Link></div></main>;

  const tenant = data.tenant;
  const primary = tenant.primary_color || '#0B1020';
  const accent = tenant.accent_color || '#72D6B2';
  const activeTasks = data.tasks.filter((task) => !['done', 'complete', 'completed', 'closed'].includes((task.status || '').toLowerCase()));
  const firstVisit = data.projects.length === 0 && activeTasks.length === 0 && data.knowledge.length === 0;
  const feedbackHref = `/customer/feedback?workspace=${encodeURIComponent(tenant.slug)}`;
  const isBeta = tenant.plan === 'beta';

  return (
    <main style={{ minHeight: '100vh', background: primary, color: '#F8FAFC', fontFamily: 'Arial, sans-serif', padding: '24px 18px 110px' }}>
      <div style={{ maxWidth: '1080px', margin: '0 auto' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '14px', flexWrap: 'wrap', marginBottom: '24px' }}>
          <div><div style={{ fontSize: '26px', fontWeight: 950 }}>{tenant.business_name}</div><div style={{ color: '#C5CEDD', marginTop: '4px', fontSize: '13px' }}>Your company home</div></div>
          <nav style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <Link href="/customer/start" style={navLink}>Main Room</Link>
            <Link href="/customer/assistant" style={{ ...navLink, background: accent, color: '#07130F', borderColor: accent }}>Ask Eva</Link>
            <Link href={`/workspace/${tenant.slug}/compass`} style={{ ...navLink, borderColor: '#F4C84A', color: '#F4C84A' }}>Compass</Link>
            <Link href="/customer/creator" style={navLink}>Creator Studio</Link>
            <Link href="/customer/sales" style={navLink}>Find Customers</Link>
            {isBeta && <Link href="/customer/upgrade" style={{ ...navLink, background: '#F4D88B', color: '#241C08', borderColor: '#F4D88B' }}>Keep My Business OS</Link>}
            <Link href={feedbackHref} style={{ ...navLink, borderColor: accent, color: accent }}>Send Feedback</Link>
            <Link href="/customer/account" style={navLink}>Account</Link>
            <button onClick={signOut} style={navButton}>Sign out</button>
          </nav>
        </header>

        <section style={{ background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.12)', borderRadius: '22px', padding: '24px' }}>
          <div style={{ color: accent, fontSize: '12px', fontWeight: 950 }}>TODAY</div>
          <h1 style={{ fontSize: 'clamp(38px,7vw,62px)', lineHeight: 1, margin: '9px 0 12px' }}>{tenant.tagline || `What does ${tenant.business_name} need next?`}</h1>
          <p style={{ color: '#C8D0DE', maxWidth: '800px', lineHeight: 1.65, fontSize: '17px' }}>Use the Main Room for the executive team, Compass to evaluate opportunities, Creator Studio to turn one idea into finished marketing drafts, Scout to find customers, and Opportunity Intelligence to find growth paths. Your work and company information stay inside your private company space.</p>
        </section>

        {isBeta && (
          <section style={{ marginTop: '16px', display: 'grid', gridTemplateColumns: 'minmax(0,1fr) auto', gap: '14px', alignItems: 'center', background: '#162237', border: '1px solid #334766', borderRadius: '16px', padding: '18px' }} className="beta-banner">
            <div><div style={{ color: '#F4D88B', fontSize: '11px', fontWeight: 950 }}>FREE BETA</div><h2 style={{ margin: '6px 0 5px' }}>If this is earning its place in your business, you can keep the same workspace.</h2><div style={{ color: '#AEBAD0', fontSize: '13px', lineHeight: 1.55 }}>Upgrading does not reset your projects, tasks, executive history, Brand Brain, company files, company knowledge or sales work.</div></div>
            <div style={{ display: 'grid', gap: '8px' }}><Link href="/customer/upgrade" style={{ background: '#F4D88B', color: '#241C08', borderRadius: '10px', padding: '11px 14px', textDecoration: 'none', fontWeight: 950, textAlign: 'center' }}>See Paid Plans</Link><Link href={feedbackHref} style={{ border: '1px solid #516987', color: '#DDE6F3', borderRadius: '10px', padding: '10px 13px', textDecoration: 'none', fontWeight: 850, textAlign: 'center' }}>Send Beta Feedback</Link></div>
          </section>
        )}

        {firstVisit && (
          <section style={{ marginTop: '16px', background: '#DDF8ED', color: '#102019', borderRadius: '18px', padding: '20px' }}>
            <div style={{ fontSize: '12px', fontWeight: 950 }}>FIRST VISIT?</div>
            <h2 style={{ margin: '7px 0 8px' }}>Start with one of these. You cannot break anything.</h2>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <Link href="/customer/start" style={darkAction}>Talk to the executive team</Link>
              <Link href={`/workspace/${tenant.slug}/compass`} style={darkAction}>Open Compass</Link>
              <Link href="/customer/creator" style={darkAction}>Create a campaign</Link>
              <Link href="/customer/sales" style={darkAction}>Find possible customers</Link>
              <Link href="/customer/start" style={outlineAction}>Show me how this works</Link>
            </div>
          </section>
        )}

        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(230px,1fr))', gap: '12px', marginTop: '16px' }}>
          <HomeCard accent={accent} title="Executive Main Room" text="Talk hands-free with Eva, Heather, Oracle, Scout, Ethos, Nova, Atlas or Ledger without changing rooms." href="/customer/start" button="Enter Main Room" />
          <HomeCard accent="#F4C84A" title="Aridon Compass" text="Compare opportunities, capture your preferences and build an evidence-first diligence path." href={`/workspace/${tenant.slug}/compass`} button="Open Compass" />
          <HomeCard accent={accent} title="Creator Studio" text="Save your Brand Brain, upload company source files, and turn one idea into a reviewed multi-channel campaign." href="/customer/creator" button="Create Marketing" />
          <HomeCard accent={accent} title="Find Customers" text="Teach Scout what you sell and research companies that may be a good fit." href="/customer/sales" button="Open Sales" />
          <HomeCard accent={accent} title="My Work" text={`${data.projects.length} project${data.projects.length === 1 ? '' : 's'} and ${activeTasks.length} open task${activeTasks.length === 1 ? '' : 's'} are currently here.`} href="#my-work" button="See My Work" />
        </section>

        <section id="my-work" style={{ marginTop: '18px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: '14px' }}>
          <div style={panelStyle}>
            <div style={{ color: accent, fontSize: '12px', fontWeight: 950 }}>PROJECTS</div>
            <h2 style={{ margin: '8px 0 12px' }}>What we are working on</h2>
            {data.projects.length === 0 ? <p style={mutedStyle}>No projects have been added yet. Ask Eva to help turn a goal into a project plan.</p> : data.projects.slice(0, 6).map((project) => <div key={project.id} style={rowStyle}><strong>{project.name}</strong><span style={statusStyle}>{project.status || 'active'}</span></div>)}
          </div>
          <div style={panelStyle}>
            <div style={{ color: accent, fontSize: '12px', fontWeight: 950 }}>OPEN TASKS</div>
            <h2 style={{ margin: '8px 0 12px' }}>What still needs attention</h2>
            {activeTasks.length === 0 ? <p style={mutedStyle}>No open tasks are waiting right now.</p> : activeTasks.slice(0, 8).map((task) => <div key={task.id} style={rowStyle}><strong>{task.title}</strong><span style={statusStyle}>{task.priority || 'medium'}</span></div>)}
          </div>
        </section>

        <section style={{ marginTop: '18px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(250px,1fr))', gap: '12px' }}>
          <Link href={feedbackHref} style={quietCard}><strong style={{ color: accent }}>Something confusing?</strong><span style={{ color: '#C8D0DE', lineHeight: 1.5 }}>Tell us what felt unclear so we can fix it.</span></Link>
          <Link href="/customer/referrals" style={quietCard}><strong style={{ color: accent }}>Know another business that could use this?</strong><span style={{ color: '#C8D0DE', lineHeight: 1.5 }}>Get a referral link to share a preview.</span></Link>
        </section>
      </div>

      {isBeta && <Link href={feedbackHref} style={{ position: 'fixed', right: '18px', bottom: '18px', zIndex: 20, background: accent, color: '#07130F', borderRadius: '999px', padding: '12px 16px', textDecoration: 'none', fontWeight: 950, boxShadow: '0 12px 28px rgba(0,0,0,.28)' }}>Feedback</Link>}
      <style>{`@media(max-width:760px){.beta-banner{grid-template-columns:1fr !important}}`}</style>
    </main>
  );
}

function HomeCard({ accent, title, text, href, button }: { accent: string; title: string; text: string; href: string; button: string }) {
  return <article style={panelStyle}><div style={{ color: accent, fontWeight: 950, fontSize: '22px' }}>{title}</div><p style={{ color: '#C8D0DE', lineHeight: 1.6, minHeight: '76px' }}>{text}</p><Link href={href} style={{ display: 'inline-block', background: accent, color: '#07130F', borderRadius: '10px', padding: '10px 13px', textDecoration: 'none', fontWeight: 950 }}>{button}</Link></article>;
}

const loadingStyle = { minHeight: '100vh', background: '#0B1020', color: '#F8FAFC', display: 'grid', placeItems: 'center', padding: '24px', fontFamily: 'Arial, sans-serif' };
const navLink = { border: '1px solid rgba(255,255,255,.2)', color: '#F8FAFC', borderRadius: '10px', padding: '9px 12px', fontSize: '13px', fontWeight: 850, textDecoration: 'none' };
const navButton = { ...navLink, background: 'transparent', cursor: 'pointer' };
const panelStyle = { background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.11)', borderRadius: '16px', padding: '18px' };
const rowStyle = { display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,.08)', padding: '11px 0' };
const statusStyle = { color: '#AEB9CB', fontSize: '12px' };
const mutedStyle = { color: '#AEB9CB', lineHeight: 1.6 };
const darkAction = { background: '#102019', color: '#fff', borderRadius: '10px', padding: '11px 14px', textDecoration: 'none', fontWeight: 900 };
const outlineAction = { border: '1px solid #6A8A7D', color: '#102019', borderRadius: '10px', padding: '10px 13px', textDecoration: 'none', fontWeight: 900 };
const quietCard = { ...panelStyle, textDecoration: 'none', display: 'grid', gap: '6px' };
