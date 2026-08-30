'use client';

import Link from 'next/link';
import { ChangeEvent, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getBrowserClient } from '../../../../lib/supabase';

type Account = { tenant: { slug: string; business_name: string; industry?: string | null } };
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
type ProductOutput = {
  campaign_summary: string;
  positioning_strategy: string;
  brand_alignment: string;
  risk_flags: string[];
  source_notes: string[];
  deliverables: Deliverable[];
  next_actions: string[];
};
type ProductProject = {
  id: string;
  title: string;
  campaign_type: string;
  status: string;
  output: ProductOutput;
  created_at: string;
};

const PRODUCT_TYPES = [
  'Practical guide / eBook',
  'Workbook',
  'Checklist / playbook',
  'Template pack',
  'Mini-course',
  'Client resource kit',
  'Training manual',
  'Planner / tracker',
];

export default function KnowledgeProductStudioPage() {
  const router = useRouter();
  const [account, setAccount] = useState<Account | null>(null);
  const [token, setToken] = useState('');
  const [files, setFiles] = useState<CompanyFile[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [previous, setPrevious] = useState<ProductProject[]>([]);
  const [active, setActive] = useState<ProductProject | null>(null);
  const [uploading, setUploading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [message, setMessage] = useState('');
  const [form, setForm] = useState({
    title: '',
    productType: PRODUCT_TYPES[0],
    audience: '',
    problem: '',
    transformation: '',
    priceIdea: '',
    notes: '',
    includeLaunchKit: true,
  });

  useEffect(() => {
    const db = getBrowserClient();
    db.auth.getSession().then(async ({ data }) => {
      const accessToken = data.session?.access_token;
      if (!accessToken) { router.replace('/customer/login?next=/customer/creator/product-studio'); return; }
      const response = await fetch('/api/customer/me', { headers: { Authorization: `Bearer ${accessToken}` }, cache: 'no-store' });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.tenant?.slug) { router.replace('/customer/login'); return; }
      setToken(accessToken);
      setAccount(result as Account);
      await loadWorkspace(accessToken, result.tenant.slug);
    });
  }, [router]);

  async function loadWorkspace(accessToken: string, slug: string) {
    const headers = { Authorization: `Bearer ${accessToken}` };
    const [fileResponse, projectResponse] = await Promise.all([
      fetch(`/api/customer/files?slug=${encodeURIComponent(slug)}`, { headers, cache: 'no-store' }),
      fetch(`/api/customer/creator?slug=${encodeURIComponent(slug)}`, { headers, cache: 'no-store' }),
    ]);
    if (fileResponse.ok) {
      const data = await fileResponse.json().catch(() => ({}));
      setFiles(data.files || []);
    }
    if (projectResponse.ok) {
      const data = await projectResponse.json().catch(() => ({}));
      const products = (data.projects || []).filter((item: ProductProject) => item.campaign_type === 'knowledge-product');
      setPrevious(products);
    }
  }

  async function reloadFiles() {
    if (!account || !token) return;
    const response = await fetch(`/api/customer/files?slug=${encodeURIComponent(account.tenant.slug)}`, { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' });
    const data = await response.json().catch(() => ({}));
    if (response.ok) setFiles(data.files || []);
  }

  async function uploadSource(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file || !account || !token) return;
    if (file.size > 25 * 1024 * 1024) { setMessage('That file is over the 25 MB private upload limit.'); return; }
    setUploading(true);
    setMessage(`Securing ${file.name}…`);
    try {
      const prepare = await fetch('/api/customer/files', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'prepare_upload', slug: account.tenant.slug, filename: file.name, mimeType: file.type || 'application/octet-stream', sizeBytes: file.size }),
      });
      const prepared = await prepare.json().catch(() => ({}));
      if (!prepare.ok) throw new Error(prepared.error || 'Could not prepare the private upload.');

      setMessage(`Uploading ${file.name} privately…`);
      const { error } = await getBrowserClient().storage.from('customer-files').uploadToSignedUrl(prepared.path, prepared.token, file, { contentType: file.type || 'application/octet-stream' });
      if (error) throw error;

      setMessage(`Reading ${file.name} into the Company Brain…`);
      const complete = await fetch('/api/customer/files', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'complete_upload', slug: account.tenant.slug, fileId: prepared.fileId }),
      });
      const completed = await complete.json().catch(() => ({}));
      if (!complete.ok) throw new Error(completed.error || 'The file uploaded, but processing failed.');
      await reloadFiles();
      setSelectedFiles((current) => current.includes(prepared.fileId) ? current : [...current, prepared.fileId]);
      setMessage(completed.extractionStatus === 'ready' ? `${file.name} is ready to turn into a product. ✓` : `${file.name} is stored. ${completed.notes || 'Automatic reading was limited.'}`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'The source file could not be uploaded.');
    } finally {
      setUploading(false);
    }
  }

  function toggleFile(id: string) {
    setSelectedFiles((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  }

  async function generateProduct() {
    if (!account || !token) return;
    if (!form.audience.trim()) { setMessage('Tell Aridon who this product is for.'); return; }
    if (!form.notes.trim() && !selectedFiles.length) { setMessage('Add your knowledge as notes or select at least one source file.'); return; }
    setGenerating(true);
    setMessage('Oracle is shaping your expertise into a real product. Scout, Ledger, Ethos, and Eva are reviewing the edges…');
    try {
      const response = await fetch('/api/customer/product-studio', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: account.tenant.slug, ...form, fileIds: selectedFiles }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.project) throw new Error(data.error || 'Aridon could not build the product draft.');
      const project = data.project as ProductProject;
      setActive(project);
      setPrevious((current) => [project, ...current.filter((item) => item.id !== project.id)]);
      setMessage('Product draft built and saved privately. Nothing has been published or sold. ✓');
      window.setTimeout(() => document.getElementById('product-output')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Aridon could not build the product draft.');
    } finally {
      setGenerating(false);
    }
  }

  const readyFiles = useMemo(() => files.filter((file) => file.status === 'ready'), [files]);
  const productDraft = active?.output.deliverables.find((item) => item.channel.toLowerCase() === 'digital product');
  const supportingAssets = active?.output.deliverables.filter((item) => item.channel.toLowerCase() !== 'digital product') || [];
  const home = account ? `/workspace/${account.tenant.slug}` : '/customer/start';

  if (!account) return <main style={loadingStyle}>Opening Knowledge Product Studio…</main>;

  return (
    <main style={pageStyle}>
      <div style={{ maxWidth: 1180, margin: '0 auto' }}>
        <header style={headerStyle}>
          <div>
            <div style={eyebrow}>ARIDON · TURN MY KNOWLEDGE INTO A PRODUCT</div>
            <h1 style={{ fontSize: 'clamp(40px,6vw,68px)', lineHeight: .98, margin: '8px 0 12px', letterSpacing: -2 }}>Your expertise should not stay trapped in your head.</h1>
            <p style={lead}>Give Aridon your notes, procedures, documents, lessons, or source files. Oracle turns them into a practical digital product, then builds the sales page and launch kit around it. Everything stays draft-only until you approve it.</p>
          </div>
          <nav style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <Link href="/customer/creator" style={navLink}>Creator Studio</Link>
            <Link href={home} style={navLink}>Company Home</Link>
            <Link href="/customer/assistant" style={mintLink}>Talk to Eva</Link>
          </nav>
        </header>

        {message && <div style={messageStyle}>{message}</div>}

        <section style={heroPanel}>
          <div>
            <div style={eyebrowDark}>KNOWLEDGE → PRODUCT → REVENUE</div>
            <h2 style={{ fontSize: 34, margin: '8px 0 10px' }}>Aridon does more than write a PDF.</h2>
            <p style={{ ...lead, color: '#C7D2E2', marginBottom: 0 }}>The system identifies the buyer, shapes the product, preserves your facts and voice, flags gaps, recommends packaging, creates the first-edition product content, and prepares the launch assets.</p>
          </div>
          <div style={miniGrid}>
            {['Private source material', 'Real product draft', 'Pricing logic', 'Sales page', 'Launch emails', 'Human approval'].map((item) => <div key={item} style={miniCard}>✓ {item}</div>)}
          </div>
        </section>

        <section style={sectionGrid}>
          <article style={panelStyle}>
            <div style={stepBadge}>1</div>
            <h2 style={sectionTitle}>Give Aridon the knowledge</h2>
            <p style={muted}>Paste what you know, upload source material, or dictate into the notes box with your phone keyboard microphone. Uploaded material remains private to the workspace.</p>
            <textarea
              value={form.notes}
              onChange={(event) => setForm({ ...form, notes: event.target.value })}
              placeholder="Examples: how you price jobs, the 12 mistakes customers make, your inspection process, a training method, a sales framework, field notes, lessons learned, or the content you want transformed…"
              style={{ ...inputStyle, minHeight: 210, resize: 'vertical' }}
            />
            <label style={uploadButton}>
              {uploading ? 'Uploading…' : '+ Upload a private source file'}
              <input type="file" onChange={uploadSource} disabled={uploading} style={{ display: 'none' }} />
            </label>
            <div style={{ marginTop: 12, display: 'grid', gap: 8 }}>
              {readyFiles.length ? readyFiles.map((file) => (
                <label key={file.id} style={{ ...fileRow, borderColor: selectedFiles.includes(file.id) ? '#4A8F77' : '#D8D1C5', background: selectedFiles.includes(file.id) ? '#E7F8F0' : '#fff' }}>
                  <input type="checkbox" checked={selectedFiles.includes(file.id)} onChange={() => toggleFile(file.id)} />
                  <span><strong>{file.filename}</strong><small style={{ display: 'block', color: '#77736B', marginTop: 2 }}>{file.extraction_status === 'ready' ? 'Ready for Oracle' : file.extraction_status}</small></span>
                </label>
              )) : <div style={emptyBox}>No processed source files yet. Upload one here or use the notes box.</div>}
            </div>
          </article>

          <article style={panelStyle}>
            <div style={stepBadge}>2</div>
            <h2 style={sectionTitle}>Tell Aridon what to build</h2>
            <Field label="Working product title" value={form.title} onChange={(value) => setForm({ ...form, title: value })} placeholder="Leave blank if you want a working draft title" />
            <label style={fieldLabel}>Product format
              <select value={form.productType} onChange={(event) => setForm({ ...form, productType: event.target.value })} style={inputStyle}>
                {PRODUCT_TYPES.map((type) => <option key={type}>{type}</option>)}
              </select>
            </label>
            <Field label="Who is it for? *" value={form.audience} onChange={(value) => setForm({ ...form, audience: value })} placeholder="Example: independent HVAC owners with 3–20 employees" />
            <Field label="What problem should it solve?" value={form.problem} onChange={(value) => setForm({ ...form, problem: value })} placeholder="Example: inconsistent estimates and weak follow-up" multiline />
            <Field label="What should the buyer be able to do afterward?" value={form.transformation} onChange={(value) => setForm({ ...form, transformation: value })} placeholder="Example: price jobs consistently and recover lost estimates" multiline />
            <Field label="Price idea, if you have one" value={form.priceIdea} onChange={(value) => setForm({ ...form, priceIdea: value })} placeholder="Example: $49 starter product, or let Aridon recommend a test range" />
            <label style={checkRow}><input type="checkbox" checked={form.includeLaunchKit} onChange={(event) => setForm({ ...form, includeLaunchKit: event.target.checked })} /><span><strong>Build the launch kit too</strong><small>Sales page, email launch, and social launch drafts.</small></span></label>
            <button onClick={generateProduct} disabled={generating} style={{ ...primaryButton, opacity: generating ? .62 : 1 }}>
              {generating ? 'Building the product…' : 'Turn My Knowledge Into a Product'}
            </button>
            <p style={{ ...muted, fontSize: 12, marginBottom: 0 }}>Aridon will flag unsupported claims and missing information instead of quietly inventing it.</p>
          </article>
        </section>

        {active && <section id="product-output" style={{ marginTop: 20 }}>
          <div style={outputHeader}>
            <div><div style={eyebrowDark}>FIRST EDITION · PRIVATE DRAFT</div><h2 style={{ fontSize: 38, margin: '7px 0 8px' }}>{active.title}</h2><p style={{ color: '#CAD4E2', lineHeight: 1.65, margin: 0 }}>{active.output.campaign_summary}</p></div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignContent: 'start' }}><span style={statusPill}>DRAFT</span><Link href="/customer/creator/review" style={reviewLink}>Open Review Queue</Link></div>
          </div>

          <div style={outputGrid}>
            <article style={lightPanel}><div style={eyebrow}>POSITIONING & MONEY</div><p style={copyStyle}>{active.output.positioning_strategy}</p></article>
            <article style={lightPanel}><div style={eyebrow}>BRAND FIT</div><p style={copyStyle}>{active.output.brand_alignment}</p></article>
          </div>

          {productDraft && <article style={{ ...lightPanel, marginTop: 14 }}>
            <div style={eyebrow}>THE PRODUCT</div>
            <h2 style={{ fontSize: 32, margin: '8px 0 16px' }}>{productDraft.title}</h2>
            <div style={documentStyle}>{productDraft.content}</div>
            {productDraft.review_notes && <div style={reviewNote}><strong>Review note:</strong> {productDraft.review_notes}</div>}
          </article>}

          {supportingAssets.length > 0 && <section style={{ marginTop: 14 }}>
            <div style={eyebrow}>SALES & LAUNCH KIT</div>
            <div style={{ display: 'grid', gap: 12, marginTop: 10 }}>
              {supportingAssets.map((asset, index) => <article key={`${asset.channel}-${index}`} style={lightPanel}>
                <div style={{ fontWeight: 950, fontSize: 12, color: '#6B655D', textTransform: 'uppercase', letterSpacing: 1 }}>{asset.channel}</div>
                <h3 style={{ fontSize: 25, margin: '6px 0 10px' }}>{asset.title}</h3>
                <div style={documentStyle}>{asset.content}</div>
                {asset.cta && <div style={{ marginTop: 14 }}><strong>CTA:</strong> {asset.cta}</div>}
                {asset.review_notes && <div style={reviewNote}><strong>Review note:</strong> {asset.review_notes}</div>}
              </article>)}
            </div>
          </section>}

          <div style={outputGrid}>
            <article style={lightPanel}><div style={eyebrow}>RISK / VERIFY</div>{active.output.risk_flags.length ? <ul style={listStyle}>{active.output.risk_flags.map((item) => <li key={item}>{item}</li>)}</ul> : <p style={muted}>No special flags were returned. Owner review is still required.</p>}</article>
            <article style={lightPanel}><div style={eyebrow}>NEXT MOVES</div><ol style={listStyle}>{active.output.next_actions.map((item) => <li key={item}>{item}</li>)}</ol></article>
          </div>
        </section>}

        {previous.length > 0 && <section style={{ marginTop: 28, paddingBottom: 90 }}>
          <div style={eyebrow}>YOUR KNOWLEDGE PRODUCTS</div>
          <h2 style={{ fontSize: 30, margin: '7px 0 12px' }}>Private product library</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(230px,1fr))', gap: 10 }}>
            {previous.slice(0, 8).map((project) => <button key={project.id} onClick={() => setActive(project)} style={historyCard}>
              <strong style={{ fontSize: 17 }}>{project.title}</strong>
              <span style={{ color: '#77736B', fontSize: 12 }}>{new Date(project.created_at).toLocaleDateString()} · {project.status}</span>
            </button>)}
          </div>
        </section>}
      </div>
    </main>
  );
}

function Field({ label, value, onChange, placeholder, multiline = false }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string; multiline?: boolean }) {
  return <label style={fieldLabel}>{label}{multiline
    ? <textarea value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} style={{ ...inputStyle, minHeight: 88, resize: 'vertical' }} />
    : <input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} style={inputStyle} />}</label>;
}

const pageStyle = { minHeight: '100vh', background: '#F4F1E9', color: '#171717', padding: '28px 20px 120px', fontFamily: 'Arial, sans-serif' };
const loadingStyle = { ...pageStyle, display: 'grid', placeItems: 'center', fontWeight: 900 };
const headerStyle = { display: 'flex', justifyContent: 'space-between', gap: 24, alignItems: 'flex-start', flexWrap: 'wrap' as const, marginBottom: 22 };
const eyebrow = { color: '#5C665E', fontSize: 11, fontWeight: 950, letterSpacing: 1.4, textTransform: 'uppercase' as const };
const eyebrowDark = { ...eyebrow, color: '#9EF0CF' };
const lead = { fontSize: 18, lineHeight: 1.65, color: '#5D5A54', maxWidth: 830 };
const muted = { color: '#716D65', lineHeight: 1.55 };
const navLink = { color: '#171717', textDecoration: 'none', border: '1px solid #BBB4A8', borderRadius: 999, padding: '10px 13px', fontSize: 12, fontWeight: 900 };
const mintLink = { ...navLink, background: '#9EF0CF', borderColor: '#69C7A7' };
const messageStyle = { background: '#FFF6C8', border: '1px solid #DAC36C', borderRadius: 13, padding: '12px 15px', marginBottom: 16, lineHeight: 1.5 };
const heroPanel = { background: '#0B1524', color: '#fff', borderRadius: 23, padding: 24, display: 'grid', gridTemplateColumns: 'minmax(0,1.3fr) minmax(280px,.7fr)', gap: 22, alignItems: 'center', boxShadow: '0 18px 50px rgba(0,0,0,.12)' };
const miniGrid = { display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 8 };
const miniCard = { background: '#142238', border: '1px solid #2A3D5B', borderRadius: 12, padding: '12px 13px', fontSize: 13, fontWeight: 850 };
const sectionGrid = { display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 14, marginTop: 16 };
const panelStyle = { background: '#fff', border: '1px solid #D4CEC2', borderRadius: 18, padding: 20, boxShadow: '0 8px 25px rgba(30,25,15,.04)' };
const lightPanel = { background: '#fff', border: '1px solid #D4CEC2', borderRadius: 18, padding: 20 };
const stepBadge = { width: 32, height: 32, borderRadius: 10, background: '#9EF0CF', display: 'grid', placeItems: 'center', fontWeight: 950, marginBottom: 10 };
const sectionTitle = { fontSize: 28, margin: '0 0 8px' };
const fieldLabel = { display: 'grid', gap: 6, fontSize: 12, fontWeight: 900, color: '#4F4B45', marginTop: 12 };
const inputStyle = { width: '100%', boxSizing: 'border-box' as const, border: '1px solid #BEB7AA', background: '#FEFDF9', color: '#171717', borderRadius: 11, padding: '12px 13px', font: 'inherit', lineHeight: 1.45 };
const uploadButton = { display: 'inline-flex', marginTop: 10, border: '1px solid #2F775F', background: '#E7F8F0', color: '#184B3A', borderRadius: 11, padding: '11px 13px', fontSize: 12, fontWeight: 950, cursor: 'pointer' };
const fileRow = { display: 'flex', alignItems: 'center', gap: 10, border: '1px solid #D8D1C5', borderRadius: 11, padding: '10px 11px', cursor: 'pointer' };
const emptyBox = { border: '1px dashed #C9C1B5', borderRadius: 11, padding: 14, color: '#7C776F', fontSize: 13 };
const checkRow = { display: 'flex', gap: 10, alignItems: 'flex-start', marginTop: 14, background: '#F1F7F4', border: '1px solid #C7DDD3', borderRadius: 12, padding: 12, cursor: 'pointer' };
const primaryButton = { width: '100%', marginTop: 14, border: 0, borderRadius: 12, background: '#0B1524', color: '#fff', padding: '14px 16px', fontSize: 15, fontWeight: 950, cursor: 'pointer' };
const outputHeader = { background: '#0B1524', color: '#fff', borderRadius: 20, padding: 22, display: 'flex', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap' as const };
const statusPill = { background: '#F4D06F', color: '#2F2600', borderRadius: 999, padding: '8px 11px', fontSize: 11, fontWeight: 950, height: 'fit-content' };
const reviewLink = { background: '#9EF0CF', color: '#07130F', borderRadius: 999, padding: '8px 11px', fontSize: 11, fontWeight: 950, textDecoration: 'none', height: 'fit-content' };
const outputGrid = { display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 14, marginTop: 14 };
const copyStyle = { whiteSpace: 'pre-wrap' as const, lineHeight: 1.7, color: '#4F4B45', marginBottom: 0 };
const documentStyle = { whiteSpace: 'pre-wrap' as const, lineHeight: 1.75, color: '#2D2A26', fontSize: 15 };
const reviewNote = { marginTop: 16, background: '#FFF6C8', border: '1px solid #E0CF81', borderRadius: 11, padding: 12, lineHeight: 1.55, fontSize: 13 };
const listStyle = { paddingLeft: 20, lineHeight: 1.7, color: '#4F4B45' };
const historyCard = { display: 'grid', gap: 7, textAlign: 'left' as const, border: '1px solid #CFC8BC', background: '#fff', borderRadius: 14, padding: 14, cursor: 'pointer', color: '#171717' };
