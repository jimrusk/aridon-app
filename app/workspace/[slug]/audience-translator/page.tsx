'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getBrowserClient } from '../../../../lib/supabase';

type Result = {
  overallScore: number;
  sendGate: 'pass' | 'review' | 'block';
  scores: { clarity: number; trust: number; relevance: number; humanTone: number; formatting: number; cta: number };
  senderTrust: { score: number; status: 'strong' | 'warning' | 'unknown'; message: string };
  audienceRead: string;
  subject: string;
  translated: string;
  warnings: string[];
  whyItWorks: string[];
  nextMove: string;
};

type Workspace = { tenant?: { business_name?: string } };

const channels = [
  ['email', 'Email'], ['linkedin', 'LinkedIn'], ['dm', 'Direct message'], ['sms', 'Text / SMS'],
  ['proposal', 'Proposal'], ['report', 'Report'], ['website', 'Website copy'], ['other', 'Other'],
];

export default function AudienceTranslator({ params }: { params: { slug: string } }) {
  const router = useRouter();
  const [token, setToken] = useState('');
  const [businessName, setBusinessName] = useState('Your company');
  const [channel, setChannel] = useState('email');
  const [audience, setAudience] = useState('');
  const [goal, setGoal] = useState('');
  const [relationship, setRelationship] = useState('New or early relationship');
  const [senderEmail, setSenderEmail] = useState('');
  const [companyWebsite, setCompanyWebsite] = useState('');
  const [draft, setDraft] = useState('');
  const [result, setResult] = useState<Result | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const db = getBrowserClient();
    db.auth.getSession().then(async ({ data }) => {
      const accessToken = data.session?.access_token || '';
      if (!accessToken) {
        router.replace(`/customer/login?next=${encodeURIComponent(`/workspace/${params.slug}/audience-translator`)}`);
        return;
      }
      setToken(accessToken);
      const response = await fetch(`/api/customer/workspace?slug=${encodeURIComponent(params.slug)}`, {
        headers: { Authorization: `Bearer ${accessToken}` }, cache: 'no-store',
      });
      const workspace = await response.json().catch(() => ({})) as Workspace;
      if (response.ok) setBusinessName(workspace.tenant?.business_name || 'Your company');
    });
  }, [params.slug, router]);

  const canRun = useMemo(() => Boolean(token && draft.trim() && audience.trim() && goal.trim() && !busy), [token, draft, audience, goal, busy]);

  async function translate(event: FormEvent) {
    event.preventDefault();
    if (!canRun) return;
    setBusy(true); setError(''); setResult(null); setCopied(false);
    try {
      const response = await fetch('/api/customer/audience-translator', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: params.slug, channel, audience, goal, relationship, senderEmail, companyWebsite, draft }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'Aridon could not translate this message right now.');
      setResult(data as Result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Audience Translator is temporarily unavailable.');
    } finally {
      setBusy(false);
    }
  }

  async function copyResult() {
    if (!result) return;
    const output = result.subject ? `Subject: ${result.subject}\n\n${result.translated}` : result.translated;
    await navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  }

  return <main style={page}><div style={shell}>
    <header style={header}>
      <div><div style={eyebrow}>ARIDON AUDIENCE TRANSLATOR</div><h1 style={h1}>Deep intelligence in. Human communication out.</h1><p style={lead}>{businessName} · Aridon checks clarity, trust, relevance, formatting and the next ask before customer-facing copy leaves the building.</p></div>
      <div style={{display:'flex',gap:8,flexWrap:'wrap'}}><Link href={`/workspace/${params.slug}`} style={link}>Company Home</Link><Link href={`/workspace/${params.slug}/executive-command`} style={link}>Ask Aridon</Link></div>
    </header>

    <section style={principle}>
      <strong>The new rule:</strong> Aridon can think in 10,000 words. Your recipient should receive only what helps them understand, trust and act. Internal analysis never gets pasted outward by default.
    </section>

    <form onSubmit={translate} style={layout}>
      <section style={panel}>
        <div style={label}>1 · WHO IS THIS FOR?</div>
        <div style={twoCol}>
          <Field label="Channel"><select value={channel} onChange={(e)=>setChannel(e.target.value)} style={input}>{channels.map(([value,name])=><option key={value} value={value}>{name}</option>)}</select></Field>
          <Field label="Relationship"><select value={relationship} onChange={(e)=>setRelationship(e.target.value)} style={input}><option>New or early relationship</option><option>Warm introduction</option><option>Existing customer</option><option>Existing partner</option><option>Follow-up conversation</option><option>Executive / decision maker</option></select></Field>
        </div>
        <Field label="Audience" hint="Be specific: owner of a 20-person landscape company, chamber CEO, lender, rancher, existing client…"><input value={audience} onChange={(e)=>setAudience(e.target.value)} style={input} placeholder="Who will read this?" /></Field>
        <Field label="Desired outcome" hint="One outcome only. Example: get a 20-minute call, ask for financials, invite feedback, confirm interest."><input value={goal} onChange={(e)=>setGoal(e.target.value)} style={input} placeholder="What should they do next?" /></Field>

        <div style={{...label,marginTop:20}}>2 · TRUST CHECK</div>
        <div style={twoCol}>
          <Field label="Sender email" hint="Aridon flags free-mail and domain mismatch risk."><input type="email" value={senderEmail} onChange={(e)=>setSenderEmail(e.target.value)} style={input} placeholder="you@yourcompany.com" /></Field>
          <Field label="Company website" hint="Used only to compare sender-domain alignment."><input value={companyWebsite} onChange={(e)=>setCompanyWebsite(e.target.value)} style={input} placeholder="yourcompany.com" /></Field>
        </div>

        <div style={{...label,marginTop:20}}>3 · ORIGINAL MATERIAL</div>
        <Field label="Paste the draft, analysis or rough notes" hint="It can be ugly. This is the internal side of the wall."><textarea value={draft} onChange={(e)=>setDraft(e.target.value)} style={{...input,minHeight:270,resize:'vertical'}} placeholder="Paste the raw Aridon analysis, email draft, report section or notes here…" /></Field>
        <button disabled={!canRun} style={{...primaryButton,opacity:canRun?1:.45}}>{busy ? 'Translating for the human on the other side…' : 'Run Audience Translator'}</button>
        <p style={guardrail}>Nothing is sent from this screen. Aridon drafts and scores. You approve external communication.</p>
        {error && <div style={errorBox}>{error}</div>}
      </section>

      <aside style={panel}>
        <div style={label}>TRUST GATE</div>
        {!result ? <div style={empty}><div style={{fontSize:42}}>🗣️</div><h2 style={{margin:'8px 0'}}>Recipient-first, not analysis-first.</h2><p style={muted}>Run the translator to see the send score, weak spots, sender-identity warning and the rewritten version.</p><div style={miniGrid}>{['Clarity','Trust','Relevance','Human tone','Formatting','One clear CTA'].map(item=><span key={item} style={chip}>{item}</span>)}</div></div> : <ResultView result={result} onCopy={copyResult} copied={copied} />}
      </aside>
    </form>
  </div></main>;
}

function ResultView({ result, onCopy, copied }: { result: Result; onCopy: () => void; copied: boolean }) {
  const gate = result.sendGate === 'pass' ? 'READY TO REVIEW' : result.sendGate === 'review' ? 'REVISE / REVIEW' : 'DO NOT SEND YET';
  return <div>
    <div style={scoreRow}><div><div style={score}>{result.overallScore}</div><div style={muted}>overall / 100</div></div><span style={{...gatePill,background:result.sendGate==='pass'?'#173C32':result.sendGate==='review'?'#473817':'#4A2025'}}>{gate}</span></div>
    <div style={scoreGrid}>{Object.entries(result.scores).map(([key,value])=><div key={key} style={scoreCard}><span style={scoreName}>{key.replace('humanTone','human tone')}</span><strong>{value}</strong></div>)}</div>

    <div style={sectionTitle}>SENDER TRUST</div>
    <div style={{...trustBox,borderColor:result.senderTrust.status==='strong'?'#2E6B57':'#765E2E'}}><strong>{result.senderTrust.score}/100</strong><span>{result.senderTrust.message}</span></div>

    <div style={sectionTitle}>HOW THE RECIPIENT IS LIKELY TO READ THIS</div><p style={bodyText}>{result.audienceRead}</p>
    {result.warnings?.length ? <><div style={sectionTitle}>WATCH BEFORE SENDING</div><ul style={list}>{result.warnings.map((warning,i)=><li key={i}>{warning}</li>)}</ul></> : null}

    <div style={sectionTitle}>TRANSLATED VERSION</div>
    {result.subject && <div style={subjectBox}><b>Subject:</b> {result.subject}</div>}
    <div style={output}>{result.translated}</div>
    <button type="button" onClick={onCopy} style={primaryButton}>{copied ? 'Copied ✓' : 'Copy translated version'}</button>

    {result.whyItWorks?.length ? <><div style={sectionTitle}>WHY THIS VERSION WORKS BETTER</div><ul style={list}>{result.whyItWorks.map((item,i)=><li key={i}>{item}</li>)}</ul></> : null}
    <div style={nextBox}><b>Next move:</b> {result.nextMove}</div>
  </div>;
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return <label style={{display:'grid',gap:6,marginBottom:13}}><span style={{fontWeight:900,fontSize:13}}>{label}</span>{hint && <span style={hintStyle}>{hint}</span>}{children}</label>;
}

const page={minHeight:'100vh',background:'#07101C',color:'#F4F7FB',padding:'26px 14px 90px',fontFamily:'Arial, sans-serif'} as const;
const shell={maxWidth:1280,margin:'0 auto'} as const;
const header={display:'flex',justifyContent:'space-between',alignItems:'center',gap:18,flexWrap:'wrap',marginBottom:16} as const;
const eyebrow={fontSize:11,fontWeight:950,color:'#9EF0CF',letterSpacing:1.5} as const;
const h1={fontSize:'clamp(34px,5vw,58px)',maxWidth:850,lineHeight:1.02,margin:'7px 0 10px'} as const;
const lead={color:'#A9B5C7',maxWidth:820,lineHeight:1.6,margin:0} as const;
const link={color:'#EAF2FF',textDecoration:'none',border:'1px solid #34445F',padding:'10px 13px',borderRadius:10,fontWeight:850} as const;
const principle={background:'#DDF8ED',color:'#102019',borderRadius:14,padding:'14px 16px',lineHeight:1.55,marginBottom:14} as const;
const layout={display:'grid',gridTemplateColumns:'minmax(0,1.05fr) minmax(360px,.95fr)',gap:14,alignItems:'start'} as const;
const panel={background:'#0D1726',border:'1px solid #25344D',borderRadius:18,padding:18} as const;
const label={fontSize:10,fontWeight:950,color:'#9EF0CF',letterSpacing:1.15,marginBottom:12} as const;
const twoCol={display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))',gap:10} as const;
const input={width:'100%',boxSizing:'border-box',background:'#07101C',color:'#F4F7FB',border:'1px solid #34445F',borderRadius:10,padding:'11px 12px',fontSize:14} as const;
const hintStyle={color:'#8292AA',fontSize:11,lineHeight:1.45} as const;
const primaryButton={border:0,background:'#9EF0CF',color:'#07130F',borderRadius:11,padding:'12px 15px',fontWeight:950,cursor:'pointer',width:'100%'} as const;
const guardrail={color:'#71829B',fontSize:10,lineHeight:1.5,margin:'9px 0 0'} as const;
const errorBox={marginTop:12,padding:10,borderRadius:10,background:'#2B1718',border:'1px solid #6B353B',color:'#F1B9B1'} as const;
const empty={minHeight:560,display:'grid',placeContent:'center',textAlign:'center',padding:20} as const;
const muted={color:'#91A0B7',lineHeight:1.55} as const;
const miniGrid={display:'flex',gap:7,flexWrap:'wrap',justifyContent:'center',marginTop:12} as const;
const chip={border:'1px solid #34445F',borderRadius:999,padding:'7px 10px',fontSize:11,color:'#C6D2E3'} as const;
const scoreRow={display:'flex',justifyContent:'space-between',alignItems:'center',gap:12} as const;
const score={fontSize:54,fontWeight:950,lineHeight:1,color:'#9EF0CF'} as const;
const gatePill={padding:'8px 10px',borderRadius:999,fontSize:10,fontWeight:950,letterSpacing:.8} as const;
const scoreGrid={display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:7,marginTop:14} as const;
const scoreCard={background:'#091321',border:'1px solid #25344D',borderRadius:10,padding:9,display:'flex',justifyContent:'space-between',gap:7,alignItems:'center'} as const;
const scoreName={fontSize:10,color:'#91A0B7',textTransform:'capitalize' as const} as const;
const sectionTitle={fontSize:10,fontWeight:950,color:'#9EF0CF',letterSpacing:1.1,margin:'20px 0 8px'} as const;
const trustBox={display:'grid',gridTemplateColumns:'auto 1fr',gap:10,alignItems:'center',padding:11,border:'1px solid',borderRadius:10,background:'#0A1422',fontSize:12,lineHeight:1.45} as const;
const bodyText={color:'#D3DCE9',lineHeight:1.6,margin:0} as const;
const list={margin:'7px 0 0',paddingLeft:20,color:'#D3DCE9',lineHeight:1.55,fontSize:13} as const;
const subjectBox={background:'#111D30',border:'1px solid #2B3A54',borderRadius:'10px 10px 0 0',padding:'10px 12px',fontSize:13} as const;
const output={whiteSpace:'pre-wrap',background:'#07101C',border:'1px solid #2B3A54',borderTop:0,borderRadius:'0 0 10px 10px',padding:14,lineHeight:1.65,minHeight:180,marginBottom:9} as const;
const nextBox={marginTop:18,background:'#162437',border:'1px solid #34445F',borderRadius:10,padding:12,lineHeight:1.55,fontSize:13} as const;
