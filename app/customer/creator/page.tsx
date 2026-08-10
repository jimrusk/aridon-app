'use client';

import Link from 'next/link';
import { ChangeEvent, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getBrowserClient } from '../../../lib/supabase';

type Account = { tenant: { slug: string; business_name: string; industry?: string | null } };
type BrandProfile = {
  brand_voice: string;
  audiences: string;
  products_services: string;
  approved_claims: string;
  restricted_claims: string;
  differentiators: string;
  calls_to_action: string;
  website_url: string;
  notes: string;
};
type CompanyFile = {
  id: string;
  filename: string;
  mime_type?: string | null;
  size_bytes?: number | null;
  status: string;
  extraction_status: string;
  notes?: string | null;
  created_at: string;
};
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
type CreatorProject = {
  id: string;
  title: string;
  campaign_type: string;
  goal?: string | null;
  audience?: string | null;
  offer?: string | null;
  channels: string[];
  status: 'draft' | 'approved' | 'archived';
  output: CampaignOutput;
  created_at: string;
  updated_at?: string;
};

const EMPTY_BRAND: BrandProfile = {
  brand_voice: '', audiences: '', products_services: '', approved_claims: '', restricted_claims: '',
  differentiators: '', calls_to_action: '', website_url: '', notes: '',
};

const CHANNELS = ['website', 'email', 'linkedin', 'facebook', 'instagram', 'x', 'press release', 'sales outreach', 'video script', 'blog', 'ad'];

const QUICK_STARTS = [
  { label: 'Launch a Product', type: 'product launch', channels: ['website', 'email', 'linkedin', 'facebook', 'instagram'], goal: 'Launch this offer clearly, create demand, and give prospects an obvious next step.' },
  { label: 'Build a Sales Campaign', type: 'sales campaign', channels: ['sales outreach', 'email', 'linkedin'], goal: 'Create a focused outbound campaign that turns qualified prospects into conversations.' },
  { label: 'Create a Social Campaign', type: 'social campaign', channels: ['linkedin', 'facebook', 'instagram', 'x'], goal: 'Create a coordinated social campaign that builds awareness and drives a concrete response.' },
  { label: 'Improve Website Copy', type: 'website copy', channels: ['website'], goal: 'Rewrite the offer so visitors immediately understand the value, trust the company, and know what to do next.' },
  { label: 'Write a Press Release', type: 'press release', channels: ['press release', 'linkedin'], goal: 'Create a credible announcement and supporting social post without exaggerating claims.' },
  { label: 'Make a Video Campaign', type: 'video campaign', channels: ['video script', 'instagram', 'linkedin'], goal: 'Turn the offer into a concise video concept, script, captions, and launch messaging.' },
  { label: 'Repurpose a Source File', type: 'content repurposing', channels: ['blog', 'email', 'linkedin'], goal: 'Turn the selected source material into useful marketing content without changing its underlying facts.' },
];

export default function CreatorStudioPage() {
  const router = useRouter();
  const [account, setAccount] = useState<Account | null>(null);
  const [token, setToken] = useState('');
  const [brand, setBrand] = useState<BrandProfile>(EMPTY_BRAND);
  const [brandSaved, setBrandSaved] = useState('');
  const [files, setFiles] = useState<CompanyFile[]>([]);
  const [projects, setProjects] = useState<CreatorProject[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [activeProject, setActiveProject] = useState<CreatorProject | null>(null);
  const [uploading, setUploading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [message, setMessage] = useState('');
  const [researchWeb, setResearchWeb] = useState(false);
  const [campaign, setCampaign] = useState({
    title: '', campaignType: 'custom', goal: '', audience: '', offer: '', brief: '', channels: ['email', 'linkedin'] as string[],
  });

  useEffect(() => {
    const db = getBrowserClient();
    db.auth.getSession().then(async ({ data }) => {
      const accessToken = data.session?.access_token;
      if (!accessToken) { router.replace('/customer/login?next=/customer/creator'); return; }
      const response = await fetch('/api/customer/me', { headers: { Authorization: `Bearer ${accessToken}` }, cache: 'no-store' });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.tenant?.slug) { router.replace('/customer/login'); return; }
      setToken(accessToken);
      setAccount(result as Account);
      await loadAll(accessToken, result.tenant.slug);
    });
  }, [router]);

  async function loadAll(accessToken: string, slug: string) {
    const headers = { Authorization: `Bearer ${accessToken}` };
    const [brandResponse, fileResponse, projectResponse] = await Promise.all([
      fetch(`/api/customer/brand?slug=${encodeURIComponent(slug)}`, { headers, cache: 'no-store' }),
      fetch(`/api/customer/files?slug=${encodeURIComponent(slug)}`, { headers, cache: 'no-store' }),
      fetch(`/api/customer/creator?slug=${encodeURIComponent(slug)}`, { headers, cache: 'no-store' }),
    ]);
    if (brandResponse.ok) {
      const data = await brandResponse.json();
      setBrand({ ...EMPTY_BRAND, ...(data.brand || {}) });
    }
    if (fileResponse.ok) {
      const data = await fileResponse.json();
      setFiles(data.files || []);
    }
    if (projectResponse.ok) {
      const data = await projectResponse.json();
      setProjects(data.projects || []);
      if (data.projects?.length) setActiveProject((current) => current || data.projects[0]);
    }
  }

  async function saveBrand() {
    if (!account || !token) return;
    setBrandSaved('Saving…');
    const response = await fetch('/api/customer/brand', {
      method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug: account.tenant.slug, brand }),
    });
    const data = await response.json().catch(() => ({}));
    setBrandSaved(response.ok ? 'Saved to Brand Brain ✓' : data.error || 'Could not save Brand Brain.');
  }

  async function uploadCompanyFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file || !account || !token) return;
    if (file.size > 25 * 1024 * 1024) { setMessage('That file is over the 25 MB Creator Studio limit.'); return; }
    setUploading(true); setMessage(`Securing ${file.name}…`);
    try {
      const prepare = await fetch('/api/customer/files', {
        method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'prepare_upload', slug: account.tenant.slug, filename: file.name, mimeType: file.type || 'application/octet-stream', sizeBytes: file.size }),
      });
      const prepared = await prepare.json().catch(() => ({}));
      if (!prepare.ok) throw new Error(prepared.error || 'Could not prepare the private upload.');

      setMessage(`Uploading ${file.name} privately…`);
      const { error } = await getBrowserClient().storage.from('customer-files').uploadToSignedUrl(prepared.path, prepared.token, file, { contentType: file.type || 'application/octet-stream' });
      if (error) throw error;

      setMessage(`Reading ${file.name} into the Company Brain…`);
      const complete = await fetch('/api/customer/files', {
        method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'complete_upload', slug: account.tenant.slug, fileId: prepared.fileId }),
      });
      const completed = await complete.json().catch(() => ({}));
      if (!complete.ok) throw new Error(completed.error || 'The file uploaded, but processing failed.');
      setMessage(completed.extractionStatus === 'ready' ? `${file.name} is stored and ready to use. ✓` : `${file.name} is stored. ${completed.notes || 'Automatic reading was limited.'}`);
      await loadFiles();
      setSelectedFiles((current) => current.includes(prepared.fileId) ? current : [...current, prepared.fileId]);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'The file could not be uploaded.');
    } finally {
      setUploading(false);
    }
  }

  async function loadFiles() {
    if (!account || !token) return;
    const response = await fetch(`/api/customer/files?slug=${encodeURIComponent(account.tenant.slug)}`, { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' });
    const data = await response.json().catch(() => ({}));
    if (response.ok) setFiles(data.files || []);
  }

  async function deleteFile(fileId: string) {
    if (!account || !token || !window.confirm('Delete this private company file? This cannot be undone.')) return;
    const response = await fetch('/api/customer/files', {
      method: 'DELETE', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug: account.tenant.slug, fileId }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) { setMessage(data.error || 'Could not delete the file.'); return; }
    setSelectedFiles((current) => current.filter((id) => id !== fileId));
    await loadFiles();
  }

  async function downloadFile(fileId: string) {
    if (!account || !token) return;
    const response = await fetch('/api/customer/files', {
      method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'download_url', slug: account.tenant.slug, fileId }),
    });
    const data = await response.json().catch(() => ({}));
    if (response.ok && data.url) window.open(data.url, '_blank', 'noopener,noreferrer');
    else setMessage(data.error || 'Could not open the file.');
  }

  function applyQuickStart(item: typeof QUICK_STARTS[number]) {
    setCampaign((current) => ({ ...current, campaignType: item.type, goal: item.goal, channels: item.channels, title: current.title || item.label }));
    document.getElementById('campaign-builder')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function toggleChannel(channel: string) {
    setCampaign((current) => ({ ...current, channels: current.channels.includes(channel) ? current.channels.filter((item) => item !== channel) : [...current.channels, channel] }));
  }

  async function generateCampaign() {
    if (!account || !token) return;
    if (!campaign.title.trim() || !campaign.goal.trim()) { setMessage('Give the campaign a title and goal first.'); return; }
    if (!campaign.channels.length) { setMessage('Choose at least one output channel.'); return; }
    setGenerating(true); setMessage('Oracle is building the campaign with Scout, Ledger, and Ethos reviewing the edges…');
    try {
      const response = await fetch('/api/customer/creator', {
        method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: account.tenant.slug, ...campaign, researchWeb, fileIds: selectedFiles }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.project) throw new Error(data.error || 'Creator Studio could not build this campaign.');
      const project = data.project as CreatorProject;
      setActiveProject(project);
      setProjects((current) => [project, ...current.filter((item) => item.id !== project.id)]);
      setMessage('Campaign draft built. Review it below before approving anything. ✓');
      window.setTimeout(() => document.getElementById('campaign-output')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Creator Studio could not build this campaign.');
    } finally {
      setGenerating(false);
    }
  }

  async function setProjectStatus(project: CreatorProject, status: CreatorProject['status']) {
    if (!account || !token) return;
    const response = await fetch('/api/customer/creator', {
      method: 'PATCH', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug: account.tenant.slug, projectId: project.id, status }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) { setMessage(data.error || 'Could not update the campaign.'); return; }
    const updated = { ...project, status };
    setActiveProject(updated);
    setProjects((current) => current.map((item) => item.id === project.id ? updated : item));
    setMessage(status === 'approved' ? 'Approved for use. This does not publish or send anything automatically. ✓' : `Campaign marked ${status}.`);
  }

  const readyFiles = useMemo(() => files.filter((file) => file.status === 'ready'), [files]);
  const home = account ? `/workspace/${account.tenant.slug}` : '/customer/start';

  if (!account) return <main style={loadingStyle}>Opening Creator Studio…</main>;

  return (
    <main style={pageStyle}>
      <div style={{ maxWidth: 1180, margin: '0 auto' }}>
        <header style={headerStyle}>
          <div>
            <div style={eyebrow}>ARIDON · ORACLE CREATOR STUDIO</div>
            <h1 style={{ fontSize: 'clamp(38px,6vw,62px)', lineHeight: 1, margin: '8px 0 10px' }}>Turn one idea into the whole campaign.</h1>
            <p style={lead}>Brand Brain → source files → campaign → human approval. The executive team does the heavy lifting without taking publishing control away from the owner.</p>
          </div>
          <nav style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <Link href="/customer/start" style={navLink}>Main Room</Link>
            <Link href={home} style={navLink}>Company Home</Link>
            <Link href="/customer/opportunities" style={navLink}>Opportunities</Link>
          </nav>
        </header>

        {message && <div style={messageStyle}>{message}</div>}

        <section style={heroPanel}>
          <div><div style={eyebrow}>FAST START</div><h2 style={{ margin: '8px 0' }}>What do you want to accomplish?</h2><p style={muted}>No prompt writing required. Pick a starting point and adjust the brief if you want.</p></div>
          <div style={quickGrid}>{QUICK_STARTS.map((item) => <button key={item.label} onClick={() => applyQuickStart(item)} style={quickButton}>{item.label}</button>)}</div>
        </section>

        <section style={sectionGrid}>
          <div style={panelStyle}>
            <div style={stepBadge}>1</div>
            <h2 style={sectionTitle}>Brand Brain</h2>
            <p style={muted}>Teach Oracle what the company sounds like, what it sells, what it can prove, and what it must never overstate. This becomes reusable private company context.</p>
            <div style={twoCol}>
              <Field label="Brand voice" value={brand.brand_voice} onChange={(value) => setBrand({ ...brand, brand_voice: value })} placeholder="Direct, expert, optimistic, plain English…" />
              <Field label="Website" value={brand.website_url} onChange={(value) => setBrand({ ...brand, website_url: value })} placeholder="https://…" small />
              <Field label="Primary audiences" value={brand.audiences} onChange={(value) => setBrand({ ...brand, audiences: value })} placeholder="Who are the buyers, users, partners, decision-makers?" />
              <Field label="Products & services" value={brand.products_services} onChange={(value) => setBrand({ ...brand, products_services: value })} placeholder="What does the company actually sell or provide?" />
              <Field label="Approved claims" value={brand.approved_claims} onChange={(value) => setBrand({ ...brand, approved_claims: value })} placeholder="Claims, proof points, certifications, metrics or wording that may be used." />
              <Field label="Restricted / unverified claims" value={brand.restricted_claims} onChange={(value) => setBrand({ ...brand, restricted_claims: value })} placeholder="Things Oracle must avoid, soften, or mark VERIFY." />
              <Field label="Differentiators" value={brand.differentiators} onChange={(value) => setBrand({ ...brand, differentiators: value })} placeholder="Why should a customer choose this company?" />
              <Field label="Preferred calls to action" value={brand.calls_to_action} onChange={(value) => setBrand({ ...brand, calls_to_action: value })} placeholder="Book a call, request a quote, schedule a pilot…" />
            </div>
            <Field label="Additional brand notes" value={brand.notes} onChange={(value) => setBrand({ ...brand, notes: value })} placeholder="Anything the executive team should remember when creating public-facing work." />
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}><button onClick={saveBrand} style={primaryButton}>Save Brand Brain</button><span style={{ color: brandSaved.includes('✓') ? '#8BE0BA' : '#AAB7CC', fontSize: 13 }}>{brandSaved}</span></div>
          </div>

          <div style={panelStyle}>
            <div style={stepBadge}>2</div>
            <h2 style={sectionTitle}>Private Source Library</h2>
            <p style={muted}>Upload proposals, product sheets, PDFs, presentations, spreadsheets, images, notes or past marketing. Files stay in the customer’s private storage and can be selected as source material.</p>
            <label style={{ ...primaryButton, display: 'inline-block', cursor: uploading ? 'wait' : 'pointer', opacity: uploading ? .65 : 1 }}>
              {uploading ? 'Uploading / reading…' : '+ Add Company File'}
              <input type="file" hidden disabled={uploading} onChange={uploadCompanyFile} accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.md,.csv,.json,.png,.jpg,.jpeg,.webp,.html,.xml" />
            </label>
            <div style={{ color: '#7F8DA5', fontSize: 11, marginTop: 9 }}>Maximum 25 MB per file. Text, PDFs and images are usually extracted automatically; complex Office files are best-effort and the original remains stored if extraction is limited.</div>
            <div style={{ marginTop: 16, display: 'grid', gap: 8 }}>
              {files.length === 0 && <div style={emptyStyle}>No source files yet.</div>}
              {files.map((file) => {
                const selected = selectedFiles.includes(file.id);
                return <div key={file.id} style={{ ...fileRow, borderColor: selected ? '#9EF0CF' : '#293957' }}>
                  <label style={{ display: 'flex', gap: 10, alignItems: 'flex-start', flex: 1, minWidth: 0, cursor: file.status === 'ready' ? 'pointer' : 'default' }}>
                    <input type="checkbox" checked={selected} disabled={file.status !== 'ready'} onChange={() => setSelectedFiles((current) => selected ? current.filter((id) => id !== file.id) : [...current, file.id])} />
                    <span style={{ minWidth: 0 }}><strong style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis' }}>{file.filename}</strong><span style={{ color: statusColor(file.extraction_status), fontSize: 11 }}>{file.extraction_status === 'ready' ? '● Ready for AI use' : file.extraction_status === 'failed' ? '● Stored · extraction limited' : '● Processing / stored'}</span>{file.notes && <span style={{ display: 'block', color: '#8795AC', fontSize: 10, marginTop: 3 }}>{file.notes}</span>}</span>
                  </label>
                  <div style={{ display: 'flex', gap: 5 }}><button style={tinyButton} onClick={() => void downloadFile(file.id)}>Open</button><button style={{ ...tinyButton, color: '#F2A7A7' }} onClick={() => void deleteFile(file.id)}>Delete</button></div>
                </div>;
              })}
            </div>
          </div>
        </section>

        <section id="campaign-builder" style={{ ...panelStyle, marginTop: 16 }}>
          <div style={stepBadge}>3</div>
          <h2 style={sectionTitle}>Create Campaign</h2>
          <p style={muted}>Oracle leads the draft. Scout checks positioning, Ledger checks the conversion path, and Ethos flags risky or unsupported claims.</p>
          <div style={twoCol}>
            <Field label="Campaign title *" value={campaign.title} onChange={(value) => setCampaign({ ...campaign, title: value })} placeholder="Example: Southwest Water Resilience Pilot Launch" small />
            <Field label="Campaign type" value={campaign.campaignType} onChange={(value) => setCampaign({ ...campaign, campaignType: value })} placeholder="Product launch, sales campaign, press release…" small />
            <Field label="Goal *" value={campaign.goal} onChange={(value) => setCampaign({ ...campaign, goal: value })} placeholder="What should this campaign accomplish?" />
            <Field label="Audience" value={campaign.audience} onChange={(value) => setCampaign({ ...campaign, audience: value })} placeholder="Leave blank to use Brand Brain audiences." />
            <Field label="Offer / product / service" value={campaign.offer} onChange={(value) => setCampaign({ ...campaign, offer: value })} placeholder="What exactly are we promoting?" />
            <Field label="Additional instructions" value={campaign.brief} onChange={(value) => setCampaign({ ...campaign, brief: value })} placeholder="Deadline, promotion, event details, mandatory points, things to emphasize…" />
          </div>
          <div style={{ marginTop: 14 }}><strong>Output channels</strong><div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginTop: 9 }}>{CHANNELS.map((channel) => <button key={channel} onClick={() => toggleChannel(channel)} style={{ ...chip, ...(campaign.channels.includes(channel) ? chipActive : {}) }}>{campaign.channels.includes(channel) ? '✓ ' : ''}{channel}</button>)}</div></div>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap', marginTop: 16 }}>
            <label style={{ display: 'flex', gap: 8, alignItems: 'center', color: '#CDD6E5', fontSize: 13 }}><input type="checkbox" checked={researchWeb} onChange={(event) => setResearchWeb(event.target.checked)} /> Use live web research for current market / competitor context</label>
            <span style={{ color: '#8795AC', fontSize: 12 }}>{selectedFiles.length} source file{selectedFiles.length === 1 ? '' : 's'} selected</span>
          </div>
          <button onClick={generateCampaign} disabled={generating} style={{ ...primaryButton, marginTop: 18, fontSize: 16, opacity: generating ? .6 : 1 }}>{generating ? 'Oracle is building the campaign…' : 'Build the Campaign'}</button>
        </section>

        <section id="campaign-output" style={{ marginTop: 16, display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(250px,.32fr)', gap: 14 }} className="creator-output-grid">
          <div style={panelStyle}>
            <div style={stepBadge}>4</div>
            <h2 style={sectionTitle}>Review & Approve</h2>
            {!activeProject && <div style={emptyStyle}>Generate a campaign and the finished drafts will appear here.</div>}
            {activeProject && <CampaignView project={activeProject} onStatus={(status) => void setProjectStatus(activeProject, status)} />}
          </div>
          <aside style={panelStyle}>
            <div style={eyebrow}>RECENT CAMPAIGNS</div>
            <div style={{ display: 'grid', gap: 8, marginTop: 12 }}>
              {projects.length === 0 && <div style={emptyStyle}>No campaigns yet.</div>}
              {projects.map((project) => <button key={project.id} onClick={() => setActiveProject(project)} style={{ ...historyButton, borderColor: activeProject?.id === project.id ? '#9EF0CF' : '#2A3956' }}><strong>{project.title}</strong><span>{project.campaign_type} · {project.status}</span></button>)}
            </div>
          </aside>
        </section>

        <section style={{ ...panelStyle, marginTop: 16, borderColor: '#355D50' }}>
          <strong style={{ color: '#9EF0CF' }}>Owner-control rule</strong>
          <p style={{ ...muted, marginBottom: 0 }}>Creator Studio can research, draft, organize and prepare content. “Approved” means approved for the customer to use. It does not publish posts, send email, buy ads, sign contracts, or make an external commitment without a separate authorized action.</p>
        </section>
      </div>
      <style>{`@media(max-width:850px){.creator-output-grid{grid-template-columns:1fr !important}} @media(max-width:720px){.creator-two-col{grid-template-columns:1fr !important}}`}</style>
    </main>
  );
}

function CampaignView({ project, onStatus }: { project: CreatorProject; onStatus: (status: CreatorProject['status']) => void }) {
  const output = project.output || {} as CampaignOutput;
  return <div>
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap', alignItems: 'center', marginBottom: 12 }}>
      <div><h3 style={{ margin: 0, fontSize: 26 }}>{project.title}</h3><div style={{ color: '#8EA0B9', fontSize: 12, marginTop: 4 }}>{project.channels?.join(' · ')}</div></div>
      <span style={{ ...statusPill, ...(project.status === 'approved' ? approvedPill : {}) }}>{project.status.toUpperCase()}</span>
    </div>
    <SummaryBox label="Campaign Summary" text={output.campaign_summary} />
    <SummaryBox label="Positioning" text={output.positioning_strategy} />
    <SummaryBox label="Brand Alignment" text={output.brand_alignment} />
    {output.risk_flags?.length > 0 && <div style={riskBox}><strong>Ethos review</strong>{output.risk_flags.map((flag, index) => <div key={index} style={{ marginTop: 7 }}>⚠ {flag}</div>)}</div>}
    <div style={{ display: 'grid', gap: 12, marginTop: 16 }}>{output.deliverables?.map((item, index) => <DeliverableCard key={`${item.channel}-${index}`} item={item} />)}</div>
    {output.source_notes?.length > 0 && <ListBox label="Source Notes" items={output.source_notes} />}
    {output.next_actions?.length > 0 && <ListBox label="Next Actions" items={output.next_actions} />}
    <div style={{ display: 'flex', gap: 9, flexWrap: 'wrap', marginTop: 18 }}>
      {project.status !== 'approved' && <button style={primaryButton} onClick={() => onStatus('approved')}>✓ Approve for Use</button>}
      {project.status === 'approved' && <button style={secondaryButton} onClick={() => onStatus('draft')}>Return to Draft</button>}
      {project.status !== 'archived' && <button style={secondaryButton} onClick={() => onStatus('archived')}>Archive</button>}
    </div>
  </div>;
}

function DeliverableCard({ item }: { item: Deliverable }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    await navigator.clipboard.writeText(`${item.title}\n\n${item.content}${item.cta ? `\n\nCTA: ${item.cta}` : ''}`);
    setCopied(true); window.setTimeout(() => setCopied(false), 1500);
  }
  return <article style={deliverableStyle}>
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'flex-start' }}><div><div style={channelLabel}>{item.channel}</div><h3 style={{ margin: '6px 0 0' }}>{item.title}</h3></div><button onClick={copy} style={tinyButton}>{copied ? 'Copied ✓' : 'Copy'}</button></div>
    <div style={{ whiteSpace: 'pre-wrap', color: '#E6EBF3', lineHeight: 1.65, marginTop: 12 }}>{item.content}</div>
    {item.cta && <div style={{ marginTop: 12, padding: 10, borderRadius: 10, background: '#101D2C' }}><strong style={{ color: '#9EF0CF' }}>CTA:</strong> {item.cta}</div>}
    {item.review_notes && <div style={{ marginTop: 10, color: '#93A2B9', fontSize: 12 }}><strong>Executive review:</strong> {item.review_notes}</div>}
  </article>;
}

function SummaryBox({ label, text }: { label: string; text?: string }) {
  if (!text) return null;
  return <div style={{ marginTop: 10, borderTop: '1px solid #273651', paddingTop: 10 }}><strong style={{ color: '#B9CFFF' }}>{label}</strong><div style={{ color: '#C7D0DF', lineHeight: 1.6, marginTop: 5 }}>{text}</div></div>;
}

function ListBox({ label, items }: { label: string; items: string[] }) {
  return <div style={{ marginTop: 16 }}><strong style={{ color: '#B9CFFF' }}>{label}</strong><div style={{ display: 'grid', gap: 6, marginTop: 8 }}>{items.map((item, index) => <div key={index} style={{ color: '#C7D0DF', lineHeight: 1.5 }}>• {item}</div>)}</div></div>;
}

function Field({ label, value, onChange, placeholder, small = false }: { label: string; value: string; onChange: (value: string) => void; placeholder: string; small?: boolean }) {
  return <label style={{ display: 'grid', gap: 6, fontSize: 12, fontWeight: 850, color: '#D8E0EC' }}>{label}{small ? <input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} style={inputStyle} /> : <textarea value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} style={{ ...inputStyle, minHeight: 92, resize: 'vertical' }} />}</label>;
}

function statusColor(status: string) {
  return status === 'ready' ? '#82E2B0' : status === 'failed' ? '#F1BC7D' : '#8EA0B9';
}

const pageStyle = { minHeight: '100vh', background: 'radial-gradient(circle at 12% 0%,#17264A 0,#09101E 38%,#050912 100%)', color: '#F8FAFC', padding: '28px 18px 100px', fontFamily: 'Arial, sans-serif' };
const loadingStyle = { minHeight: '100vh', background: '#08101D', color: '#F7FAFC', display: 'grid', placeItems: 'center', fontFamily: 'Arial, sans-serif' };
const headerStyle = { display: 'flex', justifyContent: 'space-between', gap: 22, alignItems: 'flex-start', flexWrap: 'wrap' as const, marginBottom: 18 };
const eyebrow = { color: '#9EF0CF', fontSize: 11, fontWeight: 950, letterSpacing: '1.2px' };
const lead = { color: '#B6C1D4', lineHeight: 1.65, maxWidth: 780, fontSize: 17, margin: 0 };
const muted = { color: '#AEB9CC', lineHeight: 1.6 };
const navLink = { border: '1px solid #354461', color: '#E8EEF7', borderRadius: 10, padding: '9px 12px', textDecoration: 'none', fontWeight: 850, fontSize: 13 };
const messageStyle = { background: '#132033', border: '1px solid #35506F', color: '#DCE6F5', borderRadius: 12, padding: '11px 13px', lineHeight: 1.5, marginBottom: 14 };
const heroPanel = { background: 'linear-gradient(135deg,rgba(158,240,207,.12),rgba(31,49,84,.58))', border: '1px solid #355C53', borderRadius: 20, padding: 20 };
const quickGrid = { display: 'flex', flexWrap: 'wrap' as const, gap: 8, marginTop: 14 };
const quickButton = { border: '1px solid #4B657D', background: '#0E1929', color: '#EEF3FA', borderRadius: 999, padding: '10px 13px', fontWeight: 850, cursor: 'pointer' };
const sectionGrid = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(340px,1fr))', gap: 14, marginTop: 16 };
const panelStyle = { background: 'linear-gradient(180deg,rgba(18,27,46,.97),rgba(9,14,25,.98))', border: '1px solid #283853', borderRadius: 18, padding: 20, boxShadow: '0 18px 48px rgba(0,0,0,.22)' };
const stepBadge = { width: 30, height: 30, borderRadius: 9, display: 'grid', placeItems: 'center', background: '#9EF0CF', color: '#07130F', fontWeight: 950 };
const sectionTitle = { fontSize: 27, margin: '11px 0 4px' };
const twoCol = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: 11, marginTop: 14 };
const inputStyle = { width: '100%', boxSizing: 'border-box' as const, background: '#080F1C', color: '#F7FAFC', border: '1px solid #33435F', borderRadius: 10, padding: '11px 12px', fontSize: 14, lineHeight: 1.5 };
const primaryButton = { border: 0, borderRadius: 10, background: '#9EF0CF', color: '#07130F', padding: '11px 14px', fontWeight: 950, cursor: 'pointer' };
const secondaryButton = { border: '1px solid #425371', borderRadius: 10, background: '#101827', color: '#E2E8F2', padding: '10px 13px', fontWeight: 850, cursor: 'pointer' };
const fileRow = { display: 'flex', gap: 8, alignItems: 'center', justifyContent: 'space-between', border: '1px solid #293957', background: '#0A1220', borderRadius: 11, padding: 10 };
const tinyButton = { border: '1px solid #3A4B67', background: '#10192A', color: '#DDE5F1', borderRadius: 8, padding: '6px 8px', fontSize: 11, fontWeight: 800, cursor: 'pointer' };
const emptyStyle = { color: '#8391A7', border: '1px dashed #33415A', borderRadius: 11, padding: 14 };
const chip = { border: '1px solid #354561', background: '#0B1422', color: '#AAB7CB', borderRadius: 999, padding: '8px 10px', fontSize: 12, fontWeight: 800, cursor: 'pointer' };
const chipActive = { background: '#193529', borderColor: '#64C89F', color: '#A8F3D1' };
const historyButton = { display: 'grid', gap: 4, textAlign: 'left' as const, background: '#0A1220', border: '1px solid #2A3956', borderRadius: 10, padding: 10, color: '#EEF3FA', cursor: 'pointer' };
const statusPill = { borderRadius: 999, border: '1px solid #A98255', color: '#F3C895', padding: '6px 9px', fontSize: 10, fontWeight: 950, letterSpacing: '.5px' };
const approvedPill = { borderColor: '#62C79C', color: '#98E8C2' };
const deliverableStyle = { border: '1px solid #32415D', background: '#080F1B', borderRadius: 14, padding: 15 };
const channelLabel = { display: 'inline-block', color: '#9EF0CF', textTransform: 'uppercase' as const, letterSpacing: '.8px', fontSize: 10, fontWeight: 950 };
const riskBox = { marginTop: 14, padding: 12, borderRadius: 12, background: '#271D16', border: '1px solid #6A4A2C', color: '#F2CAA1', lineHeight: 1.5 };
