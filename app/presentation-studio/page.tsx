'use client';

import { useState } from 'react';

const dark = '#07101D';
const panel = '#102033';
const mint = '#9EF0CF';
const soft = '#B8C4D5';

export default function PresentationStudioPage() {
  const [title, setTitle] = useState('');
  const [purpose, setPurpose] = useState('');
  const [audience, setAudience] = useState('');
  const [sourceText, setSourceText] = useState('');
  const [format, setFormat] = useState<'pptx' | 'pdf'>('pptx');
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');

  async function generate() {
    if (!title.trim()) {
      setStatus('Give the presentation a title first.');
      return;
    }

    setBusy(true);
    setStatus('Aridon is structuring the story, choosing the best AI route, and building the file…');
    try {
      const response = await fetch('/api/presentation-studio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, purpose, audience, sourceText, format }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data?.error || `Generation failed (${response.status}).`);
      }

      const blob = await response.blob();
      const disposition = response.headers.get('content-disposition') || '';
      const match = disposition.match(/filename="([^"]+)"/i);
      const filename = match?.[1] || `Aridon-Presentation.${format}`;
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = filename;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
      setStatus(`Done. ${filename} is ready.`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Unable to generate the presentation.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main style={{ minHeight: '100vh', background: dark, color: '#F8FAFC', padding: '42px 20px 80px', fontFamily: 'Arial, sans-serif' }}>
      <div style={{ maxWidth: 1120, margin: '0 auto' }}>
        <div style={{ color: mint, fontWeight: 950, letterSpacing: 1.1, fontSize: 12 }}>ARIDON PRESENTATION STUDIO</div>
        <h1 style={{ fontSize: 'clamp(44px,7vw,78px)', lineHeight: .95, letterSpacing: -3, margin: '14px 0 18px', maxWidth: 930 }}>
          Give Aridon the goal. Get the deck.
        </h1>
        <p style={{ color: soft, fontSize: 19, lineHeight: 1.65, maxWidth: 820, marginBottom: 30 }}>
          Aridon chooses the best configured AI model behind the scenes, structures the argument, and exports a polished PowerPoint or PDF. No model-picking scavenger hunt required.
        </p>

        <div className="studioGrid" style={{ display: 'grid', gridTemplateColumns: '1.05fr .95fr', gap: 18 }}>
          <section style={{ background: panel, border: '1px solid #2A3A57', borderRadius: 22, padding: 24 }}>
            <Field label="Presentation title" value={title} onChange={setTitle} placeholder="Example: AWG-1000 Pilot Proposal for Corpus Christi" />
            <Field label="Purpose" value={purpose} onChange={setPurpose} placeholder="What should the audience understand, approve, buy, fund, or do?" />
            <Field label="Audience" value={audience} onChange={setAudience} placeholder="Example: City manager, utilities team, investors, Farm Bureau board" />

            <label style={labelStyle}>Source material / notes</label>
            <textarea
              value={sourceText}
              onChange={(event) => setSourceText(event.target.value)}
              placeholder="Paste research, proposal notes, business facts, financial assumptions, email text, website findings, or anything Aridon should use. Leave blank for a clean general structure."
              rows={10}
              style={{ ...inputStyle, resize: 'vertical', minHeight: 220 }}
            />

            <div style={{ display: 'flex', gap: 10, marginTop: 18, flexWrap: 'wrap' }}>
              <button onClick={() => setFormat('pptx')} style={format === 'pptx' ? selectedButton : optionButton}>PowerPoint (.pptx)</button>
              <button onClick={() => setFormat('pdf')} style={format === 'pdf' ? selectedButton : optionButton}>PDF</button>
            </div>

            <button onClick={generate} disabled={busy} style={{ ...primaryButton, opacity: busy ? .65 : 1, cursor: busy ? 'wait' : 'pointer', marginTop: 18 }}>
              {busy ? 'Building…' : `Generate ${format.toUpperCase()}`}
            </button>
            {status ? <div style={{ marginTop: 14, color: status.startsWith('Done') ? mint : soft, lineHeight: 1.5 }}>{status}</div> : null}
          </section>

          <aside style={{ display: 'grid', gap: 12 }}>
            <Card n="01" title="Route" text="Aridon identifies whether the job is research-heavy, document-heavy, multilingual, technical, creative, social, general, or explicitly local/private." />
            <Card n="02" title="Build" text="The selected model creates a decision-ready storyline with bounded slide length and no invented business facts." />
            <Card n="03" title="Export" text="The same outline is rendered into a 16:9 PowerPoint or a landscape PDF with Aridon styling." />
            <Card n="04" title="Reuse" text="Use it for investor pitches, acquisition packages, city proposals, AWG projects, Farm Bureau outreach, customer audits, board reports, and sales presentations." />
          </aside>
        </div>
      </div>
      <style>{`@media(max-width:820px){.studioGrid{grid-template-columns:1fr !important}}`}</style>
    </main>
  );
}

function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (value: string) => void; placeholder: string }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={labelStyle}>{label}</label>
      <input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} style={inputStyle} />
    </div>
  );
}

function Card({ n, title, text }: { n: string; title: string; text: string }) {
  return (
    <article style={{ background: '#F4F1E9', color: '#171717', borderRadius: 18, padding: 20, border: '1px solid #D4CEC2' }}>
      <div style={{ color: '#6B665E', fontSize: 11, fontWeight: 950 }}>{n}</div>
      <h2 style={{ fontSize: 28, margin: '7px 0 8px' }}>{title}</h2>
      <p style={{ color: '#5D5A54', lineHeight: 1.6, margin: 0 }}>{text}</p>
    </article>
  );
}

const labelStyle = { display: 'block', fontSize: 12, fontWeight: 950, color: '#DCE4EF', marginBottom: 7 } as const;
const inputStyle = { width: '100%', boxSizing: 'border-box' as const, background: '#07101D', color: '#F8FAFC', border: '1px solid #415171', borderRadius: 12, padding: '13px 14px', outline: 'none', fontSize: 15, lineHeight: 1.5 };
const primaryButton = { border: 0, borderRadius: 12, background: mint, color: '#07130F', padding: '14px 18px', fontWeight: 950, fontSize: 15 } as const;
const optionButton = { border: '1px solid #415171', borderRadius: 10, background: '#07101D', color: '#DCE4EF', padding: '10px 13px', fontWeight: 900, cursor: 'pointer' } as const;
const selectedButton = { ...optionButton, border: `1px solid ${mint}`, background: mint, color: '#07130F' } as const;
