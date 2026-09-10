'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { Cloud, Copy, Download, FileUp, Link2, MapPinned, RefreshCw, ShieldCheck, Trash2, UserCheck } from 'lucide-react';
import { getBrowserClient } from '../lib/supabase';

type Point = { lat:number; lng:number };
type PassportListItem = { id:string; field_id?:string|null; farm_name?:string|null; crop?:string|null; harvest_year?:number|null; status?:string|null; updated_at?:string|null };
type EvidenceFile = { id:string; customer_file_id:string; evidence_type?:string|null; label?:string|null; shared?:boolean; file?:{ id:string; filename:string; mime_type?:string|null; size_bytes?:number|null; status?:string|null }|null };
type ShareRow = { id:string; role:string; permissions?:Record<string,unknown>; expires_at:string; revoked_at?:string|null; created_at:string; last_accessed_at?:string|null };
type ReviewRow = { id:string; reviewer_name?:string|null; organization?:string|null; review_status:string; notes?:string|null; requested_items?:unknown; created_at:string };
type Bundle = {
  passports: PassportListItem[];
  passport: { id:string; record_data?:Record<string,unknown>|null; boundary_geojson?:{coordinates?:number[][][]}|null; readiness?:Record<string,unknown>|null } | null;
  files: EvidenceFile[];
  shares: ShareRow[];
  reviews: ReviewRow[];
};

type Props = {
  field: object;
  readiness: { z45:number; iscc:number; carb:number };
  onImportRecord: (record: Record<string,unknown>) => void;
};

const card: React.CSSProperties = { background:'#fff', border:'1px solid #d7e0d3', borderRadius:18, padding:20 };
const input: React.CSSProperties = { width:'100%', boxSizing:'border-box', padding:'10px 11px', border:'1px solid #ccd8c8', borderRadius:9, background:'#fff', fontSize:14 };

function sizeLabel(bytes?:number|null){ const n=Number(bytes||0); if(!n) return ''; return n<1024*1024?`${Math.max(1,Math.round(n/1024))} KB`:`${(n/(1024*1024)).toFixed(1)} MB`; }
function pointsFromGeojson(value: Bundle['passport'] extends infer T ? any : never): Point[] {
  const coords = value?.coordinates?.[0];
  if (!Array.isArray(coords)) return [];
  const list = coords.map((item:any)=>({lng:Number(item?.[0]),lat:Number(item?.[1])})).filter((p:Point)=>Number.isFinite(p.lat)&&Number.isFinite(p.lng));
  if (list.length>1 && list[0].lat===list[list.length-1].lat && list[0].lng===list[list.length-1].lng) list.pop();
  return list;
}
function geojsonFromPoints(points:Point[]) { if(points.length<3) return null; const ring=[...points.map(p=>[p.lng,p.lat]),[points[0].lng,points[0].lat]]; return {type:'Polygon',coordinates:[ring]}; }

function BoundaryPreview({points}:{points:Point[]}){
  if(points.length<3) return <div style={{padding:16,border:'1px dashed #cbd6c7',borderRadius:11,color:'#68756d'}}>Capture at least three GPS points to create a field polygon.</div>;
  const minLng=Math.min(...points.map(p=>p.lng)),maxLng=Math.max(...points.map(p=>p.lng)),minLat=Math.min(...points.map(p=>p.lat)),maxLat=Math.max(...points.map(p=>p.lat));
  const dx=Math.max(maxLng-minLng,.00001),dy=Math.max(maxLat-minLat,.00001);
  const svg=points.map(p=>`${10+((p.lng-minLng)/dx)*280},${190-((p.lat-minLat)/dy)*180}`).join(' ');
  return <svg viewBox="0 0 300 200" style={{width:'100%',maxHeight:250,background:'#eef4ea',borderRadius:11,border:'1px solid #d7e0d3'}}><polygon points={svg} fill="#b9d8aa" stroke="#356943" strokeWidth="3"/><text x="12" y="20" fontSize="11" fill="#355342">GIS boundary · {points.length} points</text></svg>;
}

export default function FarmPassportCollaboration({field,readiness,onImportRecord}:Props){
  const record = field as Record<string,unknown>;
  const localRecordId = String(record.id || '');
  const [accessToken,setAccessToken]=useState('');
  const [slug,setSlug]=useState('');
  const [accountName,setAccountName]=useState('');
  const [authReady,setAuthReady]=useState(false);
  const [passports,setPassports]=useState<PassportListItem[]>([]);
  const [currentPassportId,setCurrentPassportId]=useState('');
  const [currentCloudRecordId,setCurrentCloudRecordId]=useState('');
  const [files,setFiles]=useState<EvidenceFile[]>([]);
  const [shares,setShares]=useState<ShareRow[]>([]);
  const [reviews,setReviews]=useState<ReviewRow[]>([]);
  const [boundaryPoints,setBoundaryPoints]=useState<Point[]>([]);
  const [manualLat,setManualLat]=useState('');
  const [manualLng,setManualLng]=useState('');
  const [message,setMessage]=useState('');
  const [busy,setBusy]=useState(false);
  const [evidenceType,setEvidenceType]=useState('supporting_document');
  const [shareRole,setShareRole]=useState('verifier');
  const [shareHours,setShareHours]=useState('168');
  const [shareDocuments,setShareDocuments]=useState(true);
  const [lastShareUrl,setLastShareUrl]=useState('');

  const boundaryGeojson=useMemo(()=>geojsonFromPoints(boundaryPoints),[boundaryPoints]);

  useEffect(()=>{
    let alive=true;
    const db=getBrowserClient();
    db.auth.getSession().then(async({data})=>{
      if(!alive) return;
      const token=data.session?.access_token||'';
      if(!token){setAuthReady(true);return;}
      try{
        const response=await fetch('/api/customer/me',{headers:{Authorization:`Bearer ${token}`},cache:'no-store'});
        const result=await response.json().catch(()=>({}));
        if(response.ok&&result?.tenant?.slug){
          setAccessToken(token); setSlug(result.tenant.slug); setAccountName(result?.user?.first_name||result?.tenant?.business_name||'');
          await loadList(token,result.tenant.slug,alive);
        }
      }catch{}
      if(alive) setAuthReady(true);
    });
    return()=>{alive=false;};
  },[]);

  useEffect(()=>{
    if(currentPassportId && currentCloudRecordId && localRecordId && currentCloudRecordId!==localRecordId){
      setCurrentPassportId(''); setCurrentCloudRecordId(''); setFiles([]); setShares([]); setReviews([]); setBoundaryPoints([]); setLastShareUrl('');
    }
  },[localRecordId,currentPassportId,currentCloudRecordId]);

  async function loadList(token=accessToken,workspace=slug,alive=true){
    if(!token||!workspace) return;
    const response=await fetch(`/api/customer/ag/farm-passport?slug=${encodeURIComponent(workspace)}`,{headers:{Authorization:`Bearer ${token}`},cache:'no-store'});
    const result=await response.json().catch(()=>({}));
    if(!response.ok) throw new Error(result.error||'Unable to load cloud records.');
    if(alive) setPassports(result.passports||[]);
  }

  function applyBundle(result:Bundle,importRecord=false){
    setPassports(result.passports||[]); setFiles(result.files||[]); setShares(result.shares||[]); setReviews(result.reviews||[]);
    if(result.passport){
      setCurrentPassportId(result.passport.id);
      const remoteRecord=result.passport.record_data||{};
      setCurrentCloudRecordId(String(remoteRecord.id||''));
      setBoundaryPoints(pointsFromGeojson(result.passport.boundary_geojson));
      if(importRecord&&Object.keys(remoteRecord).length) onImportRecord(remoteRecord);
    }
  }

  async function loadPassport(id:string){
    if(!accessToken||!slug||!id) return;
    setBusy(true);setMessage('');setLastShareUrl('');
    try{
      const response=await fetch(`/api/customer/ag/farm-passport?slug=${encodeURIComponent(slug)}&passportId=${encodeURIComponent(id)}`,{headers:{Authorization:`Bearer ${accessToken}`},cache:'no-store'});
      const result=await response.json().catch(()=>({})); if(!response.ok) throw new Error(result.error||'Unable to load Farm Passport.');
      applyBundle(result as Bundle,true); setMessage('Cloud record loaded into the editor.');
    }catch(err){setMessage(err instanceof Error?err.message:'Unable to load Farm Passport.');}finally{setBusy(false);}
  }

  async function post(body:Record<string,unknown>){
    const response=await fetch('/api/customer/ag/farm-passport',{method:'POST',headers:{Authorization:`Bearer ${accessToken}`,'Content-Type':'application/json'},body:JSON.stringify({slug,...body})});
    const result=await response.json().catch(()=>({})); if(!response.ok) throw new Error(result.error||'Farm Passport action failed.'); return result;
  }

  async function saveCloud(){
    if(!accessToken||!slug) throw new Error('Sign in to save securely to the cloud.');
    const result=await post({action:'save',passportId:currentPassportId||undefined,record,readiness,boundaryGeojson,status:'draft'});
    applyBundle(result as Bundle,false); setCurrentCloudRecordId(localRecordId); setMessage('Secure cloud record saved.');
    return String(result?.passport?.id||'');
  }

  async function clickSave(){setBusy(true);setMessage('');try{await saveCloud();}catch(err){setMessage(err instanceof Error?err.message:'Unable to save.');}finally{setBusy(false);}}

  function newCloudRecord(){setCurrentPassportId('');setCurrentCloudRecordId('');setFiles([]);setShares([]);setReviews([]);setBoundaryPoints([]);setLastShareUrl('');setMessage('Next save will create a new cloud Farm Passport.');}

  function addManualPoint(){const lat=Number(manualLat),lng=Number(manualLng);if(!Number.isFinite(lat)||!Number.isFinite(lng)||lat<-90||lat>90||lng<-180||lng>180){setMessage('Enter a valid latitude and longitude.');return;}setBoundaryPoints(prev=>[...prev,{lat,lng}]);setManualLat('');setManualLng('');setMessage('Boundary point added. Save to cloud when the polygon is ready.');}
  function addGpsPoint(){if(!navigator.geolocation){setMessage('GPS is not available in this browser.');return;}setMessage('Getting your current GPS point…');navigator.geolocation.getCurrentPosition(pos=>{setBoundaryPoints(prev=>[...prev,{lat:pos.coords.latitude,lng:pos.coords.longitude}]);setMessage(`GPS point added (±${Math.round(pos.coords.accuracy)} m).`);},err=>setMessage(err.message||'Unable to read GPS location.'),{enableHighAccuracy:true,timeout:15000,maximumAge:0});}

  async function uploadEvidence(file:File){
    setBusy(true);setMessage('');
    try{
      let passportId=currentPassportId;
      if(!passportId) passportId=await saveCloud();
      if(!passportId) throw new Error('Save the Farm Passport before uploading evidence.');
      const prepared=await post({action:'prepare_evidence_upload',passportId,filename:file.name,mimeType:file.type||'application/octet-stream',sizeBytes:file.size});
      const db=getBrowserClient();
      const {error:uploadError}=await db.storage.from('customer-files').uploadToSignedUrl(prepared.path,prepared.token,file,{contentType:file.type||'application/octet-stream'});
      if(uploadError) throw uploadError;
      const completed=await post({action:'complete_evidence_upload',passportId,fileId:prepared.fileId,evidenceType,label:file.name});
      applyBundle(completed as Bundle,false); setMessage(`${file.name} is stored privately and linked to this field.`);
    }catch(err){setMessage(err instanceof Error?err.message:'Evidence upload failed.');}finally{setBusy(false);}
  }

  async function downloadEvidence(fileId:string){setBusy(true);setMessage('');try{const result=await post({action:'download_evidence',passportId:currentPassportId,fileId});if(result.url) window.open(result.url,'_blank','noopener,noreferrer');}catch(err){setMessage(err instanceof Error?err.message:'Unable to download evidence.');}finally{setBusy(false);}}
  async function unlinkEvidence(fileId:string){setBusy(true);try{const result=await post({action:'unlink_evidence',passportId:currentPassportId,fileId});applyBundle(result as Bundle,false);setMessage('Evidence was unlinked from this passport. The private source file remains in the company vault.');}catch(err){setMessage(err instanceof Error?err.message:'Unable to unlink evidence.');}finally{setBusy(false);}}

  async function createShare(){setBusy(true);setMessage('');setLastShareUrl('');try{let passportId=currentPassportId;if(!passportId) passportId=await saveCloud();const result=await post({action:'create_share',passportId,role:shareRole,hours:Number(shareHours),documents:shareDocuments});setLastShareUrl(result.shareUrl||'');await refreshCurrent(passportId);setMessage(`${shareRole.charAt(0).toUpperCase()+shareRole.slice(1)} access link created.`);}catch(err){setMessage(err instanceof Error?err.message:'Unable to create share link.');}finally{setBusy(false);}}
  async function revokeShare(shareId:string){setBusy(true);try{const result=await post({action:'revoke_share',passportId:currentPassportId,shareId});applyBundle(result as Bundle,false);setMessage('Temporary access revoked.');}catch(err){setMessage(err instanceof Error?err.message:'Unable to revoke access.');}finally{setBusy(false);}}
  async function refreshCurrent(passportId=currentPassportId){if(!passportId)return;const response=await fetch(`/api/customer/ag/farm-passport?slug=${encodeURIComponent(slug)}&passportId=${encodeURIComponent(passportId)}`,{headers:{Authorization:`Bearer ${accessToken}`},cache:'no-store'});const result=await response.json().catch(()=>({}));if(response.ok)applyBundle(result as Bundle,false);}
  async function copyShare(){if(!lastShareUrl)return;try{await navigator.clipboard.writeText(lastShareUrl);setMessage('Secure share link copied.');}catch{setMessage('Copy was blocked. Press and hold the link to copy it.');}}

  if(!authReady) return <section style={{...card,marginTop:0}}><Cloud size={23} color="#356943"/><strong style={{marginLeft:8}}>Checking secure cloud access…</strong></section>;

  return <div style={{display:'grid',gap:16}}>
    <div style={{...card,border:'2px solid #bfd4b8'}}>
      <div style={{display:'flex',justifyContent:'space-between',gap:12,alignItems:'flex-start',flexWrap:'wrap'}}><div><div style={{display:'flex',gap:8,alignItems:'center',color:'#356943'}}><Cloud size={23}/><strong style={{fontSize:12}}>7 · SECURE FARM PASSPORT CLOUD</strong></div><h2 style={{fontSize:28,margin:'5px 0 8px'}}>Private records, evidence and controlled sharing.</h2><p style={{margin:0,color:'#657168',lineHeight:1.5}}>Keep the working record on-device, then save an owner-controlled copy to Aridon's private tenant layer when you want secure backup, evidence exchange or reviewer access.</p></div>{accessToken?<div style={{fontSize:12,padding:'7px 10px',background:'#eef6e9',borderRadius:99,color:'#356943',fontWeight:900}}>Signed in{accountName?` · ${accountName}`:''}</div>:<Link href="/customer/login?next=/ag/farm-passport" style={{padding:'10px 13px',background:'#143d2a',color:'#fff',borderRadius:9,textDecoration:'none',fontWeight:900}}>Sign in to secure cloud</Link>}</div>
      {accessToken&&<div style={{marginTop:14,display:'grid',gridTemplateColumns:'minmax(0,1fr) auto auto',gap:8}} className="collab-actions"><select style={input} value={currentPassportId} onChange={e=>e.target.value?loadPassport(e.target.value):newCloudRecord()}><option value="">Current field · create new cloud record</option>{passports.map(p=><option key={p.id} value={p.id}>{p.field_id||'Untitled'} · {p.crop||'Crop'} · {p.harvest_year||'Year'}</option>)}</select><button onClick={clickSave} disabled={busy} style={{border:0,borderRadius:9,padding:'10px 13px',background:'#356943',color:'#fff',fontWeight:900,cursor:'pointer'}}>{busy?'Working…':currentPassportId?'Save cloud changes':'Save new cloud record'}</button><button onClick={()=>refreshCurrent()} disabled={!currentPassportId||busy} style={{border:'1px solid #9cb194',borderRadius:9,padding:'10px 12px',background:'#fff',color:'#356943',fontWeight:900,cursor:'pointer'}}><RefreshCw size={16}/></button></div>}
      {message&&<div style={{marginTop:12,padding:10,borderRadius:9,background:'#f6f7f2',color:'#526058',fontSize:13}}>{message}</div>}
    </div>

    {accessToken&&<div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(300px,1fr))',gap:16}}>
      <div style={card}><div style={{display:'flex',gap:8,alignItems:'center',color:'#356943'}}><MapPinned size={22}/><strong style={{fontSize:12}}>GIS FIELD BOUNDARY</strong></div><h3 style={{fontSize:24,margin:'6px 0 10px'}}>Capture the actual field polygon.</h3><BoundaryPreview points={boundaryPoints}/><div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginTop:10}}><input style={input} placeholder="Latitude" inputMode="decimal" value={manualLat} onChange={e=>setManualLat(e.target.value)}/><input style={input} placeholder="Longitude" inputMode="decimal" value={manualLng} onChange={e=>setManualLng(e.target.value)}/></div><div style={{display:'flex',gap:8,flexWrap:'wrap',marginTop:8}}><button onClick={addManualPoint} style={{border:'1px solid #a9bba3',background:'#fff',borderRadius:9,padding:'9px 11px',fontWeight:850,cursor:'pointer'}}>Add coordinate</button><button onClick={addGpsPoint} style={{border:0,background:'#356943',color:'#fff',borderRadius:9,padding:'9px 11px',fontWeight:850,cursor:'pointer'}}>Add my GPS point</button><button onClick={()=>setBoundaryPoints([])} style={{border:'1px solid #c7b1a7',background:'#fff',borderRadius:9,padding:'9px 11px',fontWeight:850,cursor:'pointer'}}>Clear</button></div><div style={{fontSize:12,color:'#68756d',marginTop:9}}>{boundaryPoints.length<3?'Walk/drive the boundary or enter known coordinates.':`${boundaryPoints.length} points ready. Save the cloud record to store the GeoJSON boundary.`}</div></div>

      <div style={card}><div style={{display:'flex',gap:8,alignItems:'center',color:'#356943'}}><FileUp size={22}/><strong style={{fontSize:12}}>PRIVATE EVIDENCE UPLOAD</strong></div><h3 style={{fontSize:24,margin:'6px 0 10px'}}>Receipts, maps, photos and declarations.</h3><select style={input} value={evidenceType} onChange={e=>setEvidenceType(e.target.value)}><option value="supporting_document">Supporting document</option><option value="yield_record">Yield / harvest record</option><option value="nitrogen_receipt">Nitrogen / fertilizer receipt</option><option value="nutrient_log">Nutrient application log</option><option value="land_use">Land-use / eligibility proof</option><option value="gis_boundary">GIS boundary file</option><option value="traceability">Chain-of-custody / traceability</option><option value="water_record">Water / irrigation evidence</option><option value="attestation">Signed declaration / attestation</option></select><label style={{display:'block',marginTop:9,padding:12,border:'1px dashed #9fb398',borderRadius:10,textAlign:'center',fontWeight:900,cursor:'pointer',background:'#f7faf4'}}>Choose evidence file<input type="file" style={{display:'none'}} onChange={e=>{const file=e.target.files?.[0];if(file)uploadEvidence(file);e.currentTarget.value='';}}/></label><div style={{display:'grid',gap:7,marginTop:11}}>{files.length?files.map(item=><div key={item.id} style={{display:'flex',justifyContent:'space-between',gap:9,alignItems:'center',padding:10,border:'1px solid #e0e5dd',borderRadius:9}}><div><strong style={{fontSize:13}}>{item.label||item.file?.filename||'Evidence file'}</strong><div style={{fontSize:11,color:'#68756d'}}>{item.evidence_type||'supporting_document'} {item.file?.size_bytes?`· ${sizeLabel(item.file.size_bytes)}`:''}</div></div><div style={{display:'flex',gap:5}}><button title="Download" onClick={()=>downloadEvidence(item.customer_file_id)} style={{border:0,background:'transparent',cursor:'pointer',color:'#356943'}}><Download size={17}/></button><button title="Unlink" onClick={()=>unlinkEvidence(item.customer_file_id)} style={{border:0,background:'transparent',cursor:'pointer',color:'#8a4b32'}}><Trash2 size={17}/></button></div></div>):<div style={{fontSize:12,color:'#68756d'}}>No cloud evidence linked yet.</div>}</div></div>
    </div>}

    {accessToken&&<div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(300px,1fr))',gap:16}}>
      <div style={card}><div style={{display:'flex',gap:8,alignItems:'center',color:'#356943'}}><Link2 size={22}/><strong style={{fontSize:12}}>BUYER · VERIFIER · AUDITOR ACCESS</strong></div><h3 style={{fontSize:24,margin:'6px 0 10px'}}>Share only what you approve, for only as long as needed.</h3><div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}><label>Role<select style={input} value={shareRole} onChange={e=>setShareRole(e.target.value)}><option value="buyer">Buyer</option><option value="verifier">Verifier</option><option value="auditor">Auditor</option></select></label><label>Expires<select style={input} value={shareHours} onChange={e=>setShareHours(e.target.value)}><option value="24">24 hours</option><option value="168">7 days</option><option value="336">14 days</option><option value="720">30 days</option></select></label></div><label style={{display:'flex',gap:7,alignItems:'center',marginTop:10,fontSize:13}}><input type="checkbox" checked={shareDocuments} onChange={e=>setShareDocuments(e.target.checked)}/>Include linked evidence documents</label><button onClick={createShare} disabled={busy} style={{marginTop:10,border:0,background:'#143d2a',color:'#fff',borderRadius:9,padding:'10px 13px',fontWeight:900,cursor:'pointer'}}>Create temporary access link</button>{lastShareUrl&&<div style={{marginTop:10,padding:10,borderRadius:9,background:'#eef6e9',wordBreak:'break-all',fontSize:12}}><strong>One-time displayed link:</strong><div style={{marginTop:4}}>{lastShareUrl}</div><button onClick={copyShare} style={{marginTop:7,border:'1px solid #9cb194',background:'#fff',borderRadius:8,padding:'7px 9px',fontWeight:850,cursor:'pointer'}}><Copy size={14} style={{verticalAlign:'middle',marginRight:4}}/>Copy link</button></div>}<div style={{display:'grid',gap:7,marginTop:12}}>{shares.length?shares.map(s=>{const active=!s.revoked_at&&new Date(s.expires_at).getTime()>Date.now();return <div key={s.id} style={{display:'flex',justifyContent:'space-between',gap:10,alignItems:'center',padding:10,border:'1px solid #e0e5dd',borderRadius:9}}><div><strong style={{textTransform:'capitalize'}}>{s.role}</strong><div style={{fontSize:11,color:'#68756d'}}>{active?'Active':'Inactive'} · expires {new Date(s.expires_at).toLocaleString()}{s.last_accessed_at?` · last opened ${new Date(s.last_accessed_at).toLocaleString()}`:''}</div></div>{active&&<button onClick={()=>revokeShare(s.id)} style={{border:'1px solid #c7b1a7',background:'#fff',borderRadius:8,padding:'7px 9px',fontWeight:800,cursor:'pointer'}}>Revoke</button>}</div>}):<div style={{fontSize:12,color:'#68756d'}}>No temporary reviewer links created yet.</div>}</div></div>

      <div style={card}><div style={{display:'flex',gap:8,alignItems:'center',color:'#356943'}}><UserCheck size={22}/><strong style={{fontSize:12}}>REVIEWER INBOX</strong></div><h3 style={{fontSize:24,margin:'6px 0 10px'}}>Feedback comes back to the field record.</h3><div style={{display:'grid',gap:8}}>{reviews.length?reviews.map(r=><div key={r.id} style={{padding:11,border:'1px solid #e0e5dd',borderRadius:9,background:'#fafaf7'}}><div style={{display:'flex',justifyContent:'space-between',gap:8,flexWrap:'wrap'}}><strong>{r.reviewer_name||'Reviewer'}{r.organization?` · ${r.organization}`:''}</strong><span style={{fontSize:11,textTransform:'uppercase',fontWeight:900,color:'#356943'}}>{r.review_status.replaceAll('_',' ')}</span></div>{r.notes&&<p style={{fontSize:13,lineHeight:1.45,margin:'7px 0 0'}}>{r.notes}</p>}{Array.isArray(r.requested_items)&&r.requested_items.length>0&&<div style={{fontSize:12,color:'#68756d',marginTop:7}}>Requested: {r.requested_items.join(', ')}</div>}<div style={{fontSize:10,color:'#859087',marginTop:7}}>{new Date(r.created_at).toLocaleString()}</div></div>):<div style={{fontSize:12,color:'#68756d'}}>No buyer, verifier or auditor responses yet.</div>}</div></div>
    </div>}

    <div style={{...card,background:'#173f2c',color:'#fff',border:0,display:'flex',gap:10,alignItems:'flex-start'}}><ShieldCheck size={24} color="#c8e2ac"/><div><strong>Security model</strong><div style={{fontSize:12,color:'#dce8df',lineHeight:1.5,marginTop:4}}>Cloud records are tenant-scoped behind authenticated server routes. Evidence stays in a private storage bucket. Reviewer links store only a SHA-256 token hash, expire automatically, can be revoked, and use short-lived signed document URLs.</div></div></div>
    <style jsx>{`@media(max-width:760px){.collab-actions{grid-template-columns:1fr!important}}`}</style>
  </div>;
}
