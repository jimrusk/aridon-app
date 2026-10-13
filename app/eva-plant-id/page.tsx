'use client';

import Link from 'next/link';
import { ChangeEvent, useRef, useState } from 'react';

type PlantResult = {
  commonName?: string;
  scientificName?: string;
  confidence?: 'high' | 'medium' | 'low';
  description?: string;
  benefits?: string[];
  growingNotes?: string[];
  cautions?: string[];
  nextPhotoTip?: string;
};

export default function EvaPlantIdPage() {
  const [preview, setPreview] = useState('');
  const [image, setImage] = useState('');
  const [result, setResult] = useState<PlantResult | null>(null);
  const [status, setStatus] = useState('Take a picture or choose one from your phone.');
  const [loading, setLoading] = useState(false);
  const cameraRef = useRef<HTMLInputElement>(null);
  const libraryRef = useRef<HTMLInputElement>(null);

  function readPhoto(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setStatus('Please choose a photo file.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const value = String(reader.result || '');
      setPreview(value);
      setImage(value);
      setResult(null);
      setStatus('Photo ready. Tap Identify Plant.');
    };
    reader.readAsDataURL(file);
  }

  async function identify() {
    if (!image || loading) return;
    setLoading(true);
    setResult(null);
    setStatus('Eva is studying the leaves, shape, color, and other visible clues…');
    try {
      const response = await fetch('/api/plant-identify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'Plant identification failed.');
      setResult(data.result || null);
      setStatus('Identification complete.');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Eva could not identify that plant.');
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setPreview('');
    setImage('');
    setResult(null);
    setStatus('Take a picture or choose one from your phone.');
    if (cameraRef.current) cameraRef.current.value = '';
    if (libraryRef.current) libraryRef.current.value = '';
  }

  return (
    <main style={{ minHeight: '100vh', background: 'radial-gradient(circle at 70% 0,#164C3A,#071A16 42%,#040B09)', color: '#F7FBF8', fontFamily: 'Arial,sans-serif', padding: 18 }}>
      <div style={{ maxWidth: 960, margin: '0 auto' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', gap: 14, alignItems: 'center', flexWrap: 'wrap', marginBottom: 18 }}>
          <div>
            <div style={{ color: '#9EF0CF', fontSize: 11, fontWeight: 950, letterSpacing: '.14em' }}>ARIDON · EVA PLANT ID</div>
            <h1 style={{ margin: '7px 0 5px', fontSize: 'clamp(34px,7vw,62px)' }}>What plant is this? 🌿</h1>
            <p style={{ color: '#A9C0B6', margin: 0, maxWidth: 690, lineHeight: 1.55 }}>Snap a photo. Eva identifies the likely plant and explains its useful benefits, growing notes, and important cautions.</p>
          </div>
          <Link href="/eva-live" style={navLink}>← Eva</Link>
        </header>

        <section style={panel}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,320px),1fr))', gap: 18 }}>
            <div>
              <div style={{ aspectRatio: '4/3', borderRadius: 18, overflow: 'hidden', border: '1px dashed #477664', background: '#071711', display: 'grid', placeItems: 'center' }}>
                {preview ? <img src={preview} alt="Plant to identify" style={{ width: '100%', height: '100%', objectFit: 'contain' }} /> : <div style={{ textAlign: 'center', color: '#88A99B', padding: 30 }}><div style={{ fontSize: 58 }}>🌱</div><strong>Put the plant in the frame</strong><div style={{ fontSize: 12, marginTop: 7 }}>Leaves plus flowers, fruit, bark, or stem help.</div></div>}
              </div>
              <input ref={cameraRef} type="file" accept="image/*" capture="environment" onChange={readPhoto} style={{ display: 'none' }} />
              <input ref={libraryRef} type="file" accept="image/*" onChange={readPhoto} style={{ display: 'none' }} />
              <div style={{ display: 'flex', gap: 9, flexWrap: 'wrap', marginTop: 12 }}>
                <button style={button} onClick={() => cameraRef.current?.click()}>📷 Take Photo</button>
                <button style={button} onClick={() => libraryRef.current?.click()}>🖼 Choose Photo</button>
                {image && <button style={{ ...button, background: '#173127' }} onClick={reset}>Clear</button>}
              </div>
              <button onClick={() => void identify()} disabled={!image || loading} style={{ ...button, width: '100%', marginTop: 10, background: '#9EF0CF', color: '#07130F', fontSize: 16, opacity: !image || loading ? .5 : 1 }}>{loading ? 'Identifying…' : 'Identify Plant'}</button>
              <div aria-live="polite" style={{ color: '#A9C0B6', marginTop: 11, fontSize: 13, lineHeight: 1.45 }}>{status}</div>
            </div>

            <div>
              {!result ? <div style={{ ...resultBox, minHeight: 260, display: 'grid', placeItems: 'center', textAlign: 'center', color: '#78988A' }}>Your plant identification will appear here.</div> : <div style={resultBox}>
                <div style={{ color: '#9EF0CF', fontSize: 10, fontWeight: 950, letterSpacing: '.12em' }}>{String(result.confidence || 'unknown').toUpperCase()} CONFIDENCE</div>
                <h2 style={{ fontSize: 32, margin: '7px 0 2px' }}>{result.commonName || 'Possible plant'}</h2>
                {result.scientificName && <div style={{ color: '#A9C0B6', fontStyle: 'italic' }}>{result.scientificName}</div>}
                {result.description && <p style={{ lineHeight: 1.55 }}>{result.description}</p>}
                <Info title="Benefits" items={result.benefits} icon="✓" />
                <Info title="Growing notes" items={result.growingNotes} icon="•" />
                <Info title="Cautions" items={result.cautions} icon="!" />
                {result.nextPhotoTip && <div style={{ marginTop: 14, padding: 12, borderRadius: 12, background: '#10261D', color: '#BBD2C7', lineHeight: 1.45 }}><strong>For a stronger ID:</strong> {result.nextPhotoTip}</div>}
              </div>}
            </div>
          </div>
        </section>

        <p style={{ color: '#78988A', fontSize: 11, lineHeight: 1.5, marginTop: 12 }}>Photo identification can be wrong, especially with young plants and close lookalikes. Do not eat, medicate with, or feed a plant to animals based only on a photo identification.</p>
      </div>
    </main>
  );
}

function Info({ title, items, icon }: { title: string; items?: string[]; icon: string }) {
  if (!items?.length) return null;
  return <div style={{ marginTop: 16 }}><strong style={{ color: '#DFF4E9' }}>{title}</strong><div style={{ marginTop: 7, display: 'grid', gap: 7 }}>{items.map((item, index) => <div key={`${title}-${index}`} style={{ color: '#B8CBBF', lineHeight: 1.45 }}><span style={{ color: '#9EF0CF', fontWeight: 950, marginRight: 8 }}>{icon}</span>{item}</div>)}</div></div>;
}

const panel = { background: 'linear-gradient(180deg,#0D2119,#081610)', border: '1px solid #25483A', borderRadius: 22, padding: 18, boxShadow: '0 18px 50px rgba(0,0,0,.24)' } as const;
const resultBox = { padding: 18, borderRadius: 18, background: '#071711', border: '1px solid #25483A' } as const;
const button = { border: '1px solid #386553', borderRadius: 12, padding: '12px 15px', fontWeight: 950, cursor: 'pointer', background: '#10291F', color: '#F7FBF8' } as const;
const navLink = { color: '#9EF0CF', textDecoration: 'none', fontWeight: 900, padding: '9px 12px', borderRadius: 10, border: '1px solid #386553' } as const;
