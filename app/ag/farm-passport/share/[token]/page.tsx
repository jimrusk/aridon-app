'use client';

import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Clock3, Download, FileCheck2, MapPinned, ShieldCheck, UserRoundCheck } from 'lucide-react';

type ShareData = {
  share: { role: string; expires_at: string; permissions: { record: boolean; boundary: boolean; documents: boolean; review: boolean } };
  passport: {
    id: string;
    producer?: string | null;
    farm_name?: string | null;
    field_id?: string | null;
    crop?: string | null;
    harvest_year?: number | null;
    record_data?: Record<string, unknown> | null;
    boundary_geojson?: { coordinates?: number[][][]; type?: string } | null;
    readiness?: Record<string, unknown> | null;
    status?: string | null;
    updated_at?: string | null;
  };
  documents: Array<{ id: string; filename: string; mime_type?: string | null; size_bytes?: number | null; evidence_type?: string | null; label?: string | null; url?: string | null }>;
};

const card: React.CSSProperties = { background:'#fff', border:'1px solid #d8e1d5', borderRadius:18, padding:20 };
const input: React.CSSProperties = { width:'100%', boxSizing:'border-box', padding:'11px 12px', border:'1px solid #cfd8cd', borderRadius:9, background:'#fff', fontSize:14 };

function pretty(value: unknown) {
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (typeof value === 'number') return Number.isFinite(value) ? value.toLocaleString() : '—';
  if (typeof value === 'string') return value || '—';
  return '—';
}

function prettyBytes(value?: number | null) {
  const n = Number(value || 0);
  if (!n) return '';
  if (n < 1024 * 1024) return `${Math.max(1, Math.round(n / 1024))} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

function BoundaryPreview({ geojson }: { geojson?: ShareData['passport']['boundary_geojson'] }) {
  const points = useMemo(() => {
    const raw = geojson?.coordinates?.[0] || [];
    return raw.slice(0, -1).map(([lng, lat]) => ({ lng:Number(lng), lat:Number(lat) })).filter(p => Number.isFinite(p.lng) && Number.isFinite(p.lat));
  }, [geojson]);
  if (points.length < 3) return <div style={{padding:18,border:'1px dashed #cfd8cd',borderRadius:12,color:'#68756d'}}>No shared GIS boundary is attached to this record.</div>;
  const minLng = Math.min(...points.map(p=>p.lng)); const maxLng = Math.max(...points.map(p=>p.lng));
  const minLat = Math.min(...points.map(p=>p.lat)); const maxLat = Math.max(...points.map(p=>p.lat));
  const dx = Math.max(maxLng-minLng, .00001); const dy = Math.max(maxLat-minLat, .00001);
  const svg = points.map(p=>`${10+((p.lng-minLng)/dx)*280},${190-((p.lat-minLat)/dy)*180}`).join(' ');
  return <div><svg viewBox="0 0 300 200" style={{width:'100%',maxHeight:280,background:'#eef4ea',borderRadius:12,border:'1px solid #d8e1d5'}}><polygon points={svg} fill="#b9d8aa" stroke="#356943" strokeWidth="3"/><text x="12" y="20" fontSize="11" fill="#355342">Shared field boundary · {points.length} points</text></svg><div style={{marginTop:8,fontSize:12,color:'#68756d'}}>Boundary preview is generated from the producer-shared GeoJSON coordinates.</div></div>;
}

export default function FarmPassportSharePage({ params }: { params: { token: string } }) {
  const [data,setData] = useState<ShareData | null>(null);
  const [error,setError] = useState('');
  const [loading,setLoading] = useState(true);
  const [reviewerName,setReviewerName] = useState('');
  const [organization,setOrganization] = useState('');
  const [reviewStatus,setReviewStatus] = useState('received');
  const [notes,setNotes] = useState('');
  const [requestedItems,setRequestedItems] = useState('');
  const [submitting,setSubmitting] = useState(false);
  const [submitted,setSubmitted] = useState(false);

  useEffect(()=>{
    let alive = true;
    fetch(`/api/ag/farm-passport/share/${encodeURIComponent(params.token)}`, { cache:'no-store' })
      .then(async response => {
        const result = await response.json().catch(()=>({}));
        if (!response.ok) throw new Error(result.error || 'Unable to open Farm Passport.');
        if (alive) setData(result as ShareData);
      })
      .catch(err=>{ if (alive) setError(err instanceof Error ? err.message : 'Unable to open Farm Passport.'); })
      .finally(()=>{ if (alive) setLoading(false); });
    return ()=>{ alive=false; };
  },[params.token]);

  async function submitReview() {
    setSubmitting(true); setError('');
    try {
      const response = await fetch(`/api/ag/farm-passport/share/${encodeURIComponent(params.token)}`, {
        method:'POST', headers:{'Content-Type':'application/json'},
        body:JSON.stringify({ reviewerName, organization, reviewStatus, notes, requestedItems:requestedItems.split(/\n|,/).map(v=>v.trim()).filter(Boolean) }),
      });
      const result = await response.json().catch(()=>({}));
      if (!response.ok) throw new Error(result.error || 'Unable to submit review.');
      setSubmitted(true);
    } catch (err) { setError(err instanceof Error ? err.message : 'Unable to submit review.'); }
    finally { setSubmitting(false); }
  }

  if (loading) return <main style={{minHeight:'100vh',display:'grid',placeItems:'center',background:'#f4f1e8',fontFamily:'Arial,sans-serif'}}><div>Opening secure Farm Passport…</div></main>;
  if (!data) return <main style={{minHeight:'100vh',display:'grid',placeItems:'center',background:'#f4f1e8',fontFamily:'Arial,sans-serif',padding:24}}><div style={{...card,maxWidth:620,textAlign:'center'}}><ShieldCheck size={34} color="#8a4b32"/><h1>Farm Passport unavailable</h1><p style={{color:'#68756d'}}>{error || 'This link is unavailable.'}</p></div></main>;

  const record = data.passport.record_data || {};
  const ready = data.passport.readiness || {};
  const roleLabel = data.share.role.charAt(0).toUpperCase()+data.share.role.slice(1);
  const expires = new Date(data.share.expires_at);
  const rows: Array<[string,unknown]> = [
    ['Field ID',record.fieldId || data.passport.field_id],['Farm',record.farm || data.passport.farm_name],['Producer',record.producer || data.passport.producer],['County / State',record.countyState],['Crop / feedstock',record.crop || data.passport.crop],['Acres',record.acres],['Harvest year',record.harvestYear || data.passport.harvest_year],['Land-use history',record.landUseHistory],
    ['Actual yield / acre',record.actualYield],['Benchmark yield / acre',record.benchmarkYield],['Synthetic N / acre',record.syntheticN],['Tillage',record.tillage],['Cover crop',record.coverCrop],['Nutrient plan',record.nutrientPlan],['Traceability',record.traceability],['Sustainability attestation',record.sustainabilityAttestation],
    ['Water source',record.waterSource],['Annual water allocation (AF)',record.annualAllocationAf],['Expected water need (AF)',record.expectedNeedAf],['Pumping cost / AF',record.pumpingCostPerAf],
  ];

  return <main style={{minHeight:'100vh',background:'#f4f1e8',color:'#17241c',fontFamily:'Arial,sans-serif',paddingBottom:60}}>
    <header style={{background:'#143d2a',color:'#fff',padding:'18px 16px'}}><div style={{maxWidth:1080,margin:'auto',display:'flex',justifyContent:'space-between',gap:14,alignItems:'center',flexWrap:'wrap'}}><div><div style={{fontSize:11,color:'#c8e2ac',fontWeight:950,letterSpacing:1}}>ARIDON AG · SECURE FARM PASSPORT</div><h1 style={{fontSize:28,margin:'4px 0'}}>Shared {roleLabel} Review</h1></div><div style={{display:'flex',gap:8,alignItems:'center',fontSize:13,color:'#dce8df'}}><Clock3 size={17}/><span>Expires {expires.toLocaleString()}</span></div></div></header>

    <section style={{maxWidth:1080,margin:'auto',padding:'24px 16px',display:'grid',gap:16}}>
      <div style={{...card,display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))',gap:12}}>
        <div><div style={{fontSize:12,fontWeight:900,color:'#657168'}}>FIELD</div><strong style={{fontSize:24}}>{String(record.fieldId || data.passport.field_id || 'Untitled')}</strong></div>
        <div><div style={{fontSize:12,fontWeight:900,color:'#657168'}}>CROP</div><strong style={{fontSize:24}}>{String(record.crop || data.passport.crop || '—')}</strong></div>
        <div><div style={{fontSize:12,fontWeight:900,color:'#657168'}}>45Z READINESS</div><strong style={{fontSize:24}}>{pretty(ready.z45)}%</strong></div>
        <div><div style={{fontSize:12,fontWeight:900,color:'#657168'}}>ISCC / CARB</div><strong style={{fontSize:24}}>{pretty(ready.iscc)}% / {pretty(ready.carb)}%</strong></div>
      </div>

      <div style={card}><div style={{display:'flex',gap:8,alignItems:'center'}}><FileCheck2 size={22} color="#356943"/><h2 style={{margin:0,fontSize:26}}>Shared field record</h2></div><div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))',gap:8,marginTop:14}}>{rows.map(([label,value])=><div key={label} style={{background:'#f8f8f4',border:'1px solid #e0e5dd',borderRadius:10,padding:11}}><div style={{fontSize:11,fontWeight:900,color:'#6a766f'}}>{label.toUpperCase()}</div><div style={{fontWeight:800,marginTop:4}}>{pretty(value)}</div></div>)}</div><p style={{fontSize:12,color:'#68756d',marginBottom:0}}>This is producer-shared decision-support data. It does not by itself establish tax-credit, certification or program eligibility.</p></div>

      {data.share.permissions.boundary && <div style={card}><div style={{display:'flex',gap:8,alignItems:'center'}}><MapPinned size={22} color="#356943"/><h2 style={{margin:0,fontSize:26}}>GIS field boundary</h2></div><div style={{marginTop:14}}><BoundaryPreview geojson={data.passport.boundary_geojson}/></div></div>}

      <div style={card}><div style={{display:'flex',gap:8,alignItems:'center'}}><Download size={22} color="#356943"/><h2 style={{margin:0,fontSize:26}}>Evidence documents</h2></div>{data.share.permissions.documents ? <div style={{display:'grid',gap:8,marginTop:14}}>{data.documents.length ? data.documents.map(doc=><a key={doc.id} href={doc.url || '#'} target="_blank" rel="noreferrer" style={{display:'flex',justifyContent:'space-between',gap:12,alignItems:'center',padding:12,border:'1px solid #dbe2d8',borderRadius:10,color:'#285336',textDecoration:'none',fontWeight:850}}><span>{doc.label || doc.filename}<span style={{display:'block',fontSize:11,fontWeight:500,color:'#68756d'}}>{doc.evidence_type || 'supporting document'} · {prettyBytes(doc.size_bytes)}</span></span><Download size={17}/></a>) : <div style={{color:'#68756d'}}>No evidence files are attached yet.</div>}</div> : <p style={{color:'#68756d'}}>The producer did not include private evidence files in this share.</p>}</div>

      {data.share.permissions.review && <div style={{...card,border:'2px solid #c9dac3'}}><div style={{display:'flex',gap:8,alignItems:'center'}}><UserRoundCheck size={22} color="#356943"/><h2 style={{margin:0,fontSize:26}}>Reviewer response</h2></div>{submitted ? <div style={{marginTop:14,padding:16,borderRadius:12,background:'#eef6e9',display:'flex',gap:8,alignItems:'center'}}><CheckCircle2 size={22} color="#356943"/><strong>Your review was sent back to the producer's Farm Passport dashboard.</strong></div> : <div style={{display:'grid',gap:10,marginTop:14}}><div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))',gap:10}}><label>Reviewer name<input style={input} value={reviewerName} onChange={e=>setReviewerName(e.target.value)}/></label><label>Organization<input style={input} value={organization} onChange={e=>setOrganization(e.target.value)}/></label><label>Review status<select style={input} value={reviewStatus} onChange={e=>setReviewStatus(e.target.value)}><option value="received">Received / under review</option><option value="needs_information">Needs more information</option><option value="accepted">Accepted for this review step</option><option value="declined">Declined / not a fit</option></select></label></div><label>Requested items <span style={{fontSize:11,color:'#68756d'}}>(comma or line separated)</span><textarea style={{...input,minHeight:75}} value={requestedItems} onChange={e=>setRequestedItems(e.target.value)} placeholder="Example: fertilizer receipt, signed self-declaration"/></label><label>Notes<textarea style={{...input,minHeight:110}} value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Questions, findings or next steps"/></label>{error&&<div style={{color:'#8a3d2e'}}>{error}</div>}<button onClick={submitReview} disabled={submitting} style={{justifySelf:'start',border:0,borderRadius:10,padding:'12px 16px',background:'#143d2a',color:'#fff',fontWeight:950,cursor:'pointer'}}>{submitting?'Sending review…':'Send review to producer'}</button></div>}</div>}

      <div style={{fontSize:12,color:'#68756d',textAlign:'center'}}>Access is temporary and controlled by the producer. This link can be revoked before its expiration.</div>
    </section>
  </main>;
}
