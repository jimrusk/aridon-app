'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getBrowserClient } from '../../../../lib/supabase';

type Account = { tenant: { slug: string; business_name: string } };
type Status = 'draft' | 'approved' | 'rejected' | 'archived';
type Deliverable = { channel: string; title: string; content: string; cta: string; review_notes: string };
type CampaignOutput = {
  campaign_summary: string;
  positioning_strategy: string;
  brand_alignment: string;
  risk_flags: string[];
  source_notes: string[];
  deliverables: Deliverable[];
  next_actions: string[];
};
type Project = {
  id: string;
  title: string;
  campaign_type: string;
  channels: string[];
  status: Status;
  output: CampaignOutput;
  created_at: string;
};

function cloneOutput(output: CampaignOutput): CampaignOutput {
  return JSON.parse(JSON.stringify(output || {}));
}

export default function CreatorReviewDesk() {
  const router = useRouter();
  const [account, setAccount] = useState<Account | null>(null);
  const [token, setToken] = useState('');
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<CampaignOutput | null>(null);
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const db = getBrowserClient();
    db.auth.getSession().then(async ({ data }) => {
      const accessToken = data.session?.access_token;
      if (!accessToken) { router.replace('/customer/login?next=/customer/creator/review'); return; }
      const response = await fetch('/api/customer/me', { headers: { Authorization: `Bearer ${accessToken}` }, cache: 'no-store' });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.tenant?.slug) { router.replace('/customer/login'); return; }
      setToken(accessToken);
      setAccount(result as Account);
      await loadProjects(accessToken, result.tenant.slug);
    });
  }, [router]);

  async function loadProjects(accessToken: string, slug: string) {
    const response = await fetch(`/api/customer/creator?slug=${encodeURIComponent(slug)}`, { headers: { Authorization: `Bearer ${accessToken}` }, cache: 'no-store' });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) { setMessage(data.error || 'Could not load campaigns.'); return; }
    const list = (data.projects || []) as Project[];
    setProjects(list);
    if (list.length) setSelectedId((current) => current || list[0].id);
  }

  const selected = useMemo(() => projects.find((item) => item.id === selectedId) || null, [projects, selectedId]);

  function beginEdit() {
    if (!selected) return;
    setDraft(cloneOutput(selected.output));
    setEditing(true);
    setMessage('Editing a private draft. Nothing is being published or sent.');
  }

  function cancelEdit() {
    setEditing(false);
    setDraft(null);
    setMessage('Edits cancelled.');
  }

  function updateDeliverable(index: number, field: keyof Deliverable, value: string) {
    if (!draft) return;
    const next = cloneOutput(draft);
    next.deliverables[index] = { ...next.deliverables[index], [field]: value };
    setDraft(next);
  }

  async function patchProject(project: Project, status: Status, output?: CampaignOutput) {
    if (!account || !token) return;
    setSaving(true);
    try {
      const response = await fetch('/api/customer/creator', {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: account.tenant.slug, projectId: project.id, status, ...(output ? { output } : {}) }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'Could not update campaign.');
      const updated: Project = { ...project, status, ...(data.project?.output ? { output: data.project.output } : output ? { output } : {}) };
      setProjects((current) => current.map((item) => item.id === project.id ? updated : item));
      setEditing(false);
      setDraft(null);
      if (status === 'approved') setMessage('Approved for use. No post, email, ad, or external action was sent automatically. ✓');
      else if (status === 'rejected') setMessage('Rejected. The campaign stays private and cannot be mistaken for approved work.');
      else setMessage(`Campaign marked ${status}.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not update campaign.');
    } finally {
      setSaving(false);
    }
  }

  async function saveEdits() {
    if (!selected || !draft) return;
    await patchProject(selected, 'draft', draft);
    setMessage('Edits saved as a draft. Review again before approval. ✓');
  }

  if (!account) return <main style={loadingStyle}>Opening Creator Review Desk…</main>;

  return (
    <main style={pageStyle}>
      <div style={{ maxWidth: 1180, margin: '0 auto' }}>
        <header style={headerStyle}>
          <div>
            <div style={eyebrow}>ARIDON · HUMAN REVIEW GATE</div>
            <h1 style={{ fontSize: 'clamp(38px,6vw,60px)', lineHeight: 1, margin: '8px 0 10px' }}>Creator Review Desk</h1>
            <p style={lead}>Edit the executive team's drafts, approve what is ready, reject what is not, or archive old work. Approval never publishes by itself.</p>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <Link href="/customer/creator" style={navLink}>Creator Studio</Link>
            <Link href="/customer/start" style={navLink}>Main Room</Link>
          </div>
        </header>

        {message && <div style={messageStyle}>{message}</div>}

        <section style={gridStyle}>
          <aside style={panelStyle}>
            <div style={eyebrow}>CAMPAIGNS</div>
            <div style={{ display: 'grid', gap: 8, marginTop: 12 }}>
              {projects.length === 0 && <div style={emptyStyle}>No campaigns have been generated yet.</div>}
              {projects.map((project) => (
                <button key={project.id} onClick={() => { setSelectedId(project.id); setEditing(false); setDraft(null); }} style={{ ...historyButton, borderColor: selectedId === project.id ? '#9EF0CF' : '#2B3955' }}>
                  <strong>{project.title}</strong>
                  <span>{project.campaign_type} · {project.status}</span>
                </button>
              ))}
            </div>
          </aside>

          <div style={panelStyle}>
            {!selected && <div style={emptyStyle}>Select a campaign to review.</div>}
            {selected && (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
                  <div><h2 style={{ margin: 0, fontSize: 30 }}>{selected.title}</h2><div style={{ color: '#8999B1', fontSize: 12, marginTop: 5 }}>{selected.channels?.join(' · ')}</div></div>
                  <StatusPill status={selected.status} />
                </div>

                {!editing && <ReadOnlyCampaign output={selected.output} />}
                {editing && draft && <CampaignEditor output={draft} setOutput={setDraft} updateDeliverable={updateDeliverable} />}

                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 18 }}>
                  {!editing && <button disabled={saving} style={secondaryButton} onClick={beginEdit}>✎ Edit Copy</button>}
                  {editing && <button disabled={saving} style={primaryButton} onClick={() => void saveEdits()}>{saving ? 'Saving…' : 'Save Edits as Draft'}</button>}
                  {editing && <button disabled={saving} style={secondaryButton} onClick={cancelEdit}>Cancel</button>}
                  {!editing && selected.status !== 'approved' && <button disabled={saving} style={primaryButton} onClick={() => void patchProject(selected, 'approved')}>✓ Approve for Use</button>}
                  {!editing && selected.status !== 'rejected' && <button disabled={saving} style={rejectButton} onClick={() => void patchProject(selected, 'rejected')}>✕ Reject</button>}
                  {!editing && ['approved', 'rejected'].includes(selected.status) && <button disabled={saving} style={secondaryButton} onClick={() => void patchProject(selected, 'draft')}>Return to Draft</button>}
                  {!editing && selected.status !== 'archived' && <button disabled={saving} style={secondaryButton} onClick={() => void patchProject(selected, 'archived')}>Archive</button>}
                </div>
              </>
            )}
          </div>
        </section>

        <section style={{ ...panelStyle, marginTop: 14, borderColor: '#355D50' }}>
          <strong style={{ color: '#9EF0CF' }}>Approval boundary</strong>
          <p style={{ ...muted, marginBottom: 0 }}>Approve means the content is cleared for the customer to use. Sending email, publishing social posts, buying ads, spending money, signing documents, or making external commitments still requires a separate authorized action.</p>
        </section>
      </div>
      <style>{`@media(max-width:850px){.review-grid{grid-template-columns:1fr !important}}`}</style>
    </main>
  );
}

function CampaignEditor({ output, setOutput, updateDeliverable }: { output: CampaignOutput; setOutput: (value: CampaignOutput) => void; updateDeliverable: (index: number, field: keyof Deliverable, value: string) => void }) {
  function setField(field: keyof CampaignOutput, value: string) {
    if (typeof output[field] !== 'string') return;
    setOutput({ ...output, [field]: value });
  }
  return <div style={{ marginTop: 16, display: 'grid', gap: 12 }}>
    <EditorField label="Campaign Summary" value={output.campaign_summary || ''} onChange={(value) => setField('campaign_summary', value)} />
    <EditorField label="Positioning Strategy" value={output.positioning_strategy || ''} onChange={(value) => setField('positioning_strategy', value)} />
    <EditorField label="Brand Alignment" value={output.brand_alignment || ''} onChange={(value) => setField('brand_alignment', value)} />
    {(output.deliverables || []).map((item, index) => <article key={`${item.channel}-${index}`} style={deliverableStyle}>
      <div style={channelLabel}>{item.channel}</div>
      <EditorField label="Title" value={item.title} onChange={(value) => updateDeliverable(index, 'title', value)} small />
      <EditorField label="Copy" value={item.content} onChange={(value) => updateDeliverable(index, 'content', value)} />
      <EditorField label="Call to action" value={item.cta} onChange={(value) => updateDeliverable(index, 'cta', value)} small />
      <EditorField label="Executive review notes" value={item.review_notes} onChange={(value) => updateDeliverable(index, 'review_notes', value)} />
    </article>)}
  </div>;
}

function EditorField({ label, value, onChange, small = false }: { label: string; value: string; onChange: (value: string) => void; small?: boolean }) {
  return <label style={{ display: 'grid', gap: 6, fontSize: 12, fontWeight: 850, color: '#D5DEEB' }}>{label}{small ? <input value={value} onChange={(event) => onChange(event.target.value)} style={inputStyle} /> : <textarea value={value} onChange={(event) => onChange(event.target.value)} style={{ ...inputStyle, minHeight: 110, resize: 'vertical' }} />}</label>;
}

function ReadOnlyCampaign({ output }: { output: CampaignOutput }) {
  return <div>
    <Summary label="Campaign Summary" text={output?.campaign_summary} />
    <Summary label="Positioning" text={output?.positioning_strategy} />
    <Summary label="Brand Alignment" text={output?.brand_alignment} />
    {output?.risk_flags?.length > 0 && <div style={riskBox}><strong>Ethos review</strong>{output.risk_flags.map((flag, index) => <div key={index} style={{ marginTop: 7 }}>⚠ {flag}</div>)}</div>}
    <div style={{ display: 'grid', gap: 12, marginTop: 16 }}>{(output?.deliverables || []).map((item, index) => <ReadOnlyDeliverable key={`${item.channel}-${index}`} item={item} />)}</div>
  </div>;
}

function ReadOnlyDeliverable({ item }: { item: Deliverable }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    await navigator.clipboard.writeText(`${item.title}\n\n${item.content}${item.cta ? `\n\nCTA: ${item.cta}` : ''}`);
    setCopied(true); window.setTimeout(() => setCopied(false), 1200);
  }
  return <article style={deliverableStyle}>
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}><div><div style={channelLabel}>{item.channel}</div><h3 style={{ margin: '6px 0 0' }}>{item.title}</h3></div><button onClick={copy} style={tinyButton}>{copied ? 'Copied ✓' : 'Copy'}</button></div>
    <div style={{ marginTop: 12, whiteSpace: 'pre-wrap', lineHeight: 1.65, color: '#E5EBF4' }}>{item.content}</div>
    {item.cta && <div style={{ marginTop: 12, padding: 10, borderRadius: 10, background: '#101D2C' }}><strong style={{ color: '#9EF0CF' }}>CTA:</strong> {item.cta}</div>}
    {item.review_notes && <div style={{ marginTop: 9, color: '#92A1B8', fontSize: 12 }}><strong>Executive review:</strong> {item.review_notes}</div>}
  </article>;
}

function Summary({ label, text }: { label: string; text?: string }) {
  if (!text) return null;
  return <div style={{ marginTop: 12, borderTop: '1px solid #273651', paddingTop: 11 }}><strong style={{ color: '#B9CFFF' }}>{label}</strong><div style={{ color: '#C6D0DF', lineHeight: 1.6, marginTop: 5 }}>{text}</div></div>;
}

function StatusPill({ status }: { status: Status }) {
  const style = status === 'approved' ? { borderColor: '#60C79A', color: '#9CE6C1' } : status === 'rejected' ? { borderColor: '#A64D55', color: '#F1A4AA' } : status === 'archived' ? { borderColor: '#59667B', color: '#9AA6B8' } : { borderColor: '#A77B4F', color: '#EFC38E' };
  return <span style={{ ...statusPill, ...style }}>{status.toUpperCase()}</span>;
}

const pageStyle = { minHeight: '100vh', background: 'radial-gradient(circle at 12% 0%,#17264A 0,#09101E 38%,#050912 100%)', color: '#F8FAFC', padding: '28px 18px 100px', fontFamily: 'Arial, sans-serif' };
const loadingStyle = { minHeight: '100vh', background: '#08101D', color: '#F8FAFC', display: 'grid', placeItems: 'center', fontFamily: 'Arial, sans-serif' };
const headerStyle = { display: 'flex', justifyContent: 'space-between', gap: 20, alignItems: 'flex-start', flexWrap: 'wrap' as const, marginBottom: 18 };
const eyebrow = { color: '#9EF0CF', fontSize: 11, fontWeight: 950, letterSpacing: '1.2px' };
const lead = { color: '#B6C1D4', lineHeight: 1.65, maxWidth: 760, fontSize: 17, margin: 0 };
const muted = { color: '#AEB9CC', lineHeight: 1.6 };
const navLink = { border: '1px solid #354461', color: '#E8EEF7', borderRadius: 10, padding: '9px 12px', textDecoration: 'none', fontWeight: 850, fontSize: 13 };
const messageStyle = { background: '#132033', border: '1px solid #35506F', color: '#DCE6F5', borderRadius: 12, padding: '11px 13px', lineHeight: 1.5, marginBottom: 14 };
const gridStyle = { display: 'grid', gridTemplateColumns: 'minmax(240px,.32fr) minmax(0,1fr)', gap: 14 };
const panelStyle = { background: 'linear-gradient(180deg,rgba(18,27,46,.97),rgba(9,14,25,.98))', border: '1px solid #283853', borderRadius: 18, padding: 20, boxShadow: '0 18px 48px rgba(0,0,0,.22)' };
const emptyStyle = { color: '#8794A8', border: '1px dashed #34425B', borderRadius: 11, padding: 14 };
const historyButton = { display: 'grid', gap: 4, textAlign: 'left' as const, background: '#0A1220', border: '1px solid #2B3955', color: '#EEF3FA', borderRadius: 10, padding: 10, cursor: 'pointer' };
const deliverableStyle = { border: '1px solid #32415D', background: '#080F1B', borderRadius: 14, padding: 15, display: 'grid', gap: 10 };
const channelLabel = { display: 'inline-block', color: '#9EF0CF', textTransform: 'uppercase' as const, letterSpacing: '.8px', fontSize: 10, fontWeight: 950 };
const inputStyle = { width: '100%', boxSizing: 'border-box' as const, background: '#080F1C', color: '#F7FAFC', border: '1px solid #3A4A66', borderRadius: 10, padding: '10px 11px', fontSize: 14, lineHeight: 1.5 };
const primaryButton = { border: 0, borderRadius: 10, background: '#9EF0CF', color: '#07130F', padding: '11px 14px', fontWeight: 950, cursor: 'pointer' };
const secondaryButton = { border: '1px solid #425371', borderRadius: 10, background: '#101827', color: '#E2E8F2', padding: '10px 13px', fontWeight: 850, cursor: 'pointer' };
const rejectButton = { border: '1px solid #914A51', borderRadius: 10, background: '#28171A', color: '#F1A4AA', padding: '10px 13px', fontWeight: 900, cursor: 'pointer' };
const tinyButton = { border: '1px solid #3A4B67', background: '#10192A', color: '#DDE5F1', borderRadius: 8, padding: '6px 8px', fontSize: 11, fontWeight: 800, cursor: 'pointer' };
const statusPill = { borderRadius: 999, border: '1px solid', padding: '6px 9px', fontSize: 10, fontWeight: 950, letterSpacing: '.5px' };
const riskBox = { marginTop: 14, padding: 12, borderRadius: 12, background: '#271D16', border: '1px solid #6A4A2C', color: '#F2CAA1', lineHeight: 1.5 };
