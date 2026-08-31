'use client';

import { FormEvent, ReactNode, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getBrowserClient } from '../../../../lib/supabase';

type Variant = {
  label: string;
  subject: string;
  text: string;
  rationale: string;
};

type Result = {
  overallScore: number;
  sendGate: 'pass' | 'review' | 'block';
  scores: Record<string, number>;
  senderTrust: { score: number; status: 'strong' | 'warning' | 'unknown'; message: string };
  readingLevel?: { grade: number; target: string; status: 'on-target' | 'high' | 'low' | 'unknown' };
  audienceRead: string;
  messageFocus?: string;
  hook?: string;
  subject: string;
  translated: string;
  variants?: Variant[];
  jargonRemoved?: string[];
  warnings: string[];
  whyItWorks: string[];
  testPlan?: string;
  nextMove: string;
};

type Workspace = { tenant?: { business_name?: string } };

const channels = [
  ['email', 'Email'], ['linkedin', 'LinkedIn'], ['dm', 'Direct message'], ['sms', 'Text / SMS'],
  ['proposal', 'Proposal'], ['report', 'Report'], ['website', 'Website copy'], ['other', 'Other'],
];

const audienceModes = [
  ['general customer', 'General customer'],
  ['farmer / rancher', 'Farmer / rancher'],
  ['small-business owner', 'Small-business owner'],
  ['city / government', 'City / government'],
  ['investor / lender', 'Investor / lender'],
  ['technical / engineering', 'Technical / engineering'],
  ['partner / sponsor', 'Partner / sponsor'],
];

const scoreLabels: Record<string, string> = {
  clarity: 'Clarity',
  trust: 'Trust',
  relevance: 'Relevance',
  humanTone: 'Human tone',
  formatting: 'Formatting',
  cta: 'CTA',
  readability: 'Readability',
  simplicity: 'Simplicity',
  singleMessage: 'One message',
};

export default function AudienceTranslator({ params }: { params: { slug: string } }) {
  const router = useRouter();
  const [token, setToken] = useState('');
  const [businessName, setBusinessName] = useState('Your company');
  const [channel, setChannel] = useState('email');
  const [audienceMode, setAudienceMode] = useState('general customer');
  const [audience, setAudience] = useState('');
  const [goal, setGoal] = useState('');
  const [relationship, setRelationship] = useState('New or early relationship');
  const [senderEmail, setSenderEmail] = useState('');
  const [companyWebsite, setCompanyWebsite] = useState('');
  const [draft, setDraft] = useState('');
  const [result, setResult] = useState<Result | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [copiedKey, setCopiedKey] = useState('');

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

  const canRun = useMemo(
    () => Boolean(token && draft.trim() && audience.trim() && goal.trim() && !busy),
    [token, draft, audience, goal, busy],
  );

  async function translate(event: FormEvent) {
    event.preventDefault();
    if (!canRun) return;
    setBusy(true);
    setError('');
    setResult(null);
    setCopiedKey('');
    try {
      const response = await fetch('/api/customer/audience-translator', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug: params.slug,
          channel,
          audienceMode,
          audience,
          goal,
          relationship,
          senderEmail,
          companyWebsite,
          draft,
        }),
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

  async function copyText(key: string, value: string) {
    await navigator.clipboard.writeText(value);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(''), 1600);
  }

  return <main style={page}><div style={shell}>
    <header style={header}>
      <div>
        <div style={eyebrow}>ARIDON CLARITY + CONVERSION ENGINE</div>
        <h1 style={h1}>Make every message easier to understand and easier to act on.</h1>
        <p style={lead}>{businessName} · One engine for Ag, Business OS, outreach, landing pages and Eva-generated marketing.</p>
      </div>
      <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
        <Link href={`/workspace/${params.slug}`} style={link}>Company Home</Link>
        <Link href={`/workspace/${params.slug}/executive-command`} style={link}>Ask Aridon</Link>
      </div>
    </header>

    <section style={principle}>
      <strong>The clarity rule:</strong> Aridon can do the complicated thinking behind the curtain. The customer should get one clear message, plain language, a useful hook and one easy next step.
    </section>

    <section style={featureStrip}>
      {['Grade 5-7 default','Jargon killer','Audience modes','Double-Take Hook','One-message rule','A/B variants'].map((item) => <span key={item} style={featureChip}>{item}</span>)}
    </section>

    <form onSubmit={translate} style={layout}>
      <section style={panel}>
        <div style={label}>1 · WHO IS THIS FOR?</div>
        <div style={twoCol}>
          <Field label="Channel"><select value={channel} onChange={(e)=>setChannel(e.target.value)} style={input}>{channels.map(([value,name])=><option key={value} value={value}>{name}</option>)}</select></Field>
          <Field label="Audience mode"><select value={audienceMode} onChange={(e)=>setAudienceMode(e.target.value)} style={input}>{audienceModes.map(([value,name])=><option key={value} value={value}>{name}</option>)}</select></Field>
        </div>
        <div style={twoCol}>
          <Field label="Relationship"><select value={relationship} onChange={(e)=>setRelationship(e.target.value)} style={input}><option>New or early relationship</option><option>Warm introduction</option><option>Existing customer</option><option>Existing partner</option><option>Follow-up conversation</option><option>Executive / decision maker</option></select></Field>
          <Field label="Audience" hint="Be specific. Example: ranch owner, chamber CEO, lender, city manager, equipment dealer."><input value={audience} onChange={(e)=>setAudience(e.target.value)} style={input} placeholder="Who will read this?" /></Field>
        </div>
        <Field label="Desired outcome" hint="One outcome only. Example: get a 20-minute call, invite feedback, request financials, confirm interest."><input value={goal} onChange={(e)=>setGoal(e.target.value)} style={input} placeholder="What should they do next?" /></Field>

        <div style={{...label,marginTop:20}}>2 · TRUST CHECK</div>
        <div style={twoCol}>
          <Field label="Sender email" hint="Aridon flags free-mail and domain mismatch risk."><input type="email" value={senderEmail} onChange={(e)=>setSenderEmail(e.target.value)} style={input} placeholder="you@yourcompany.com" /></Field>
          <Field label="Company website" hint="Used only to compare sender-domain alignment."><input value={companyWebsite} onChange={(e)=>setCompanyWebsite(e.target.value)} style={input} placeholder="yourcompany.com" /></Field>
        </div>

        <div style={{...label,marginTop:20}}>3 · ORIGINAL MATERIAL</div>
        <Field label="Paste the draft, analysis or rough notes" hint="It can be technical, long or ugly. This is the internal side of the wall."><textarea value={draft} onChange={(e)=>setDraft(e.target.value)} style={{...input,minHeight:300,resize:'vertical'}} placeholder="Paste the raw Aridon analysis, email draft, report section, landing-page copy or notes here..." /></Field>
        <button disabled={!canRun} style={{...primaryButton,opacity:canRun?1:.45}}>{busy ? 'Simplifying, scoring and building variants...' : 'Run Clarity + Conversion Engine'}</button>
        <p style={guardrail}>Nothing is sent from this screen. Aridon drafts and scores. A human approves external communication.</p>
        {error && <div style={errorBox}>{error}</div>}
      </section>

      <aside style={panel}>
        <div style={label}>CONVERSION GATE</div>
        {!result ? <EmptyState /> : <ResultView result={result} copiedKey={copiedKey} onCopy={copyText} />}
      </aside>
    </form>
  </div></main>;
}

function EmptyState() {
  return <div style={empty}>
    <div style={{fontSize:42}}>✦</div>
    <h2 style={{margin:'8px 0'}}>One idea. Plain words. Better odds.</h2>
    <p style={muted}>Run the engine to see readability, jargon, sender trust, the single-message focus, a hook and two testable versions.</p>
    <div style={miniGrid}>{['Clarity','Trust','Readability','Simplicity','One message','One CTA'].map(item=><span key={item} style={chip}>{item}</span>)}</div>
  </div>;
}

function ResultView({ result, onCopy, copiedKey }: { result: Result; onCopy: (key: string, value: string) => void; copiedKey: string }) {
  const gate = result.sendGate === 'pass' ? 'READY TO REVIEW' : result.sendGate === 'review' ? 'REVISE / REVIEW' : 'DO NOT SEND YET';
  const mainOutput = result.subject ? `Subject: ${result.subject}\n\n${result.translated}` : result.translated;
  return <div>
    <div style={scoreRow}>
      <div><div style={score}>{result.overallScore}</div><div style={muted}>overall / 100</div></div>
      <span style={{...gatePill,background:result.sendGate==='pass'?'#173C32':result.sendGate==='review'?'#473817':'#4A2025'}}>{gate}</span>
    </div>

    <div style={scoreGrid}>{Object.entries(result.scores || {}).map(([key,value])=><div key={key} style={scoreCard}><span style={scoreName}>{scoreLabels[key] || key}</span><strong>{value}</strong></div>)}</div>

    {result.readingLevel && <>
      <div style={sectionTitle}>READING LEVEL</div>
      <div style={metricBox}><strong>Grade {result.readingLevel.grade}</strong><span>{result.readingLevel.target}</span></div>
    </>}

    <div style={sectionTitle}>SENDER TRUST</div>
    <div style={{...trustBox,borderColor:result.senderTrust.status==='strong'?'#2E6B57':'#765E2E'}}><strong>{result.senderTrust.score}/100</strong><span>{result.senderTrust.message}</span></div>

    {result.messageFocus && <><div style={sectionTitle}>ONE-MESSAGE FOCUS</div><div style={focusBox}>{result.messageFocus}</div></>}
    {result.hook && <><div style={sectionTitle}>DOUBLE-TAKE HOOK</div><div style={hookBox}>{result.hook}</div></>}

    <div style={sectionTitle}>HOW THE RECIPIENT IS LIKELY TO READ THIS</div>
    <p style={bodyText}>{result.audienceRead}</p>

    {result.jargonRemoved?.length ? <>
      <div style={sectionTitle}>JARGON REMOVED OR FLAGGED</div>
      <div style={miniGridLeft}>{result.jargonRemoved.map(item=><span key={item} style={chip}>{item}</span>)}</div>
    </> : null}

    {result.warnings?.length ? <><div style={sectionTitle}>WATCH BEFORE SENDING</div><ul style={list}>{result.warnings.map((warning,i)=><li key={i}>{warning}</li>)}</ul></> : null}

    <div style={sectionTitle}>BEST DEFAULT VERSION</div>
    {result.subject && <div style={subjectBox}><b>Subject:</b> {result.subject}</div>}
    <div style={output}>{result.translated}</div>
    <button type="button" onClick={()=>onCopy('main', mainOutput)} style={primaryButton}>{copiedKey==='main' ? 'Copied ✓' : 'Copy best version'}</button>

    {result.variants?.length ? <>
      <div style={sectionTitle}>A/B TEST VERSIONS</div>
      <div style={variantGrid}>{result.variants.map((variant, index) => {
        const key = `variant-${index}`;
        const value = variant.subject ? `Subject: ${variant.subject}\n\n${variant.text}` : variant.text;
        return <div key={key} style={variantCard}>
          <div style={variantTitle}>{variant.label}</div>
          {variant.subject && <div style={variantSubject}>{variant.subject}</div>}
          <div style={variantText}>{variant.text}</div>
          {variant.rationale && <div style={variantWhy}>{variant.rationale}</div>}
          <button type="button" onClick={()=>onCopy(key, value)} style={secondaryButton}>{copiedKey===key ? 'Copied ✓' : 'Copy this version'}</button>
        </div>;
      })}</div>
    </> : null}

    {result.testPlan && <><div style={sectionTitle}>TEST PLAN</div><div style={nextBox}>{result.testPlan}</div></>}
    {result.whyItWorks?.length ? <><div style={sectionTitle}>WHY THIS VERSION WORKS BETTER</div><ul style={list}>{result.whyItWorks.map((item,i)=><li key={i}>{item}</li>)}</ul></> : null}
    <div style={nextBox}><b>Next move:</b> {result.nextMove}</div>
  </div>;
}

function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return <label style={{display:'grid',gap:6,marginBottom:13}}><span style={{fontWeight:900,fontSize:13}}>{label}</span>{hint && <span style={hintStyle}>{hint}</span>}{children}</label>;
}

const page={minHeight:'100vh',background:'#07101C',color:'#F4F7FB',padding:'26px 14px 90px',fontFamily:'Arial, sans-serif'} as const;
const shell={maxWidth:1320,margin:'0 auto'} as const;
const header={display:'flex',justifyContent:'space-between',alignItems:'center',gap:18,flexWrap:'wrap',marginBottom:16} as const;
const eyebrow={fontSize:11,fontWeight:950,color:'#9EF0CF',letterSpacing:1.5} as const;
const h1={fontSize:'clamp(34px,5vw,58px)',maxWidth:900,lineHeight:1.02,margin:'7px 0 10px'} as const;
const lead={color:'#A9B5C7',maxWidth:860,lineHeight:1.6,margin:0} as const;
const link={color:'#EAF2FF',textDecoration:'none',border:'1px solid #34445F',padding:'10px 13px',borderRadius:10,fontWeight:850} as const;
const principle={background:'#DDF8ED',color:'#102019',borderRadius:14,padding:'14px 16px',lineHeight:1.55,marginBottom:10} as const;
const featureStrip={display:'flex',gap:7,flexWrap:'wrap',marginBottom:14} as const;
const featureChip={background:'#101C2C',border:'1px solid #2B3A54',borderRadius:999,padding:'7px 10px',fontSize:11,color:'#CFE1F8',fontWeight:800} as const;
const layout={display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(340px,1fr))',gap:14,alignItems:'start'} as const;
const panel={background:'#0D1726',border:'1px solid #25344D',borderRadius:18,padding:18} as const;
const label={fontSize:10,fontWeight:950,color:'#9EF0CF',letterSpacing:1.15,marginBottom:12} as const;
const twoCol={display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))',gap:10} as const;
const input={width:'100%',boxSizing:'border-box',background:'#07101C',color:'#F4F7FB',border:'1px solid #34445F',borderRadius:10,padding:'11px 12px',fontSize:14} as const;
const hintStyle={color:'#8292AA',fontSize:11,lineHeight:1.45} as const;
const primaryButton={border:0,background:'#9EF0CF',color:'#07130F',borderRadius:11,padding:'12px 15px',fontWeight:950,cursor:'pointer',width:'100%'} as const;
const secondaryButton={border:'1px solid #3A4D6C',background:'#111D30',color:'#EAF2FF',borderRadius:10,padding:'10px 12px',fontWeight:850,cursor:'pointer',width:'100%'} as const;
const guardrail={color:'#71829B',fontSize:10,lineHeight:1.5,margin:'9px 0 0'} as const;
const errorBox={marginTop:12,padding:10,borderRadius:10,background:'#2B1718',border:'1px solid #6B353B',color:'#F1B9B1'} as const;
const empty={minHeight:580,display:'grid',placeContent:'center',textAlign:'center',padding:20} as const;
const muted={color:'#91A0B7',lineHeight:1.55} as const;
const miniGrid={display:'flex',gap:7,flexWrap:'wrap',justifyContent:'center',marginTop:12} as const;
const miniGridLeft={display:'flex',gap:7,flexWrap:'wrap',justifyContent:'flex-start',marginTop:8} as const;
const chip={border:'1px solid #34445F',borderRadius:999,padding:'7px 10px',fontSize:11,color:'#C6D2E3'} as const;
const scoreRow={display:'flex',justifyContent:'space-between',alignItems:'center',gap:12} as const;
const score={fontSize:54,fontWeight:950,lineHeight:1,color:'#9EF0CF'} as const;
const gatePill={padding:'8px 10px',borderRadius:999,fontSize:10,fontWeight:950,letterSpacing:.8} as const;
const scoreGrid={display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(120px,1fr))',gap:7,marginTop:14} as const;
const scoreCard={background:'#091321',border:'1px solid #25344D',borderRadius:10,padding:9,display:'flex',justifyContent:'space-between',gap:7,alignItems:'center'} as const;
const scoreName={fontSize:10,color:'#91A0B7'} as const;
const sectionTitle={fontSize:10,fontWeight:950,color:'#9EF0CF',letterSpacing:1.1,margin:'20px 0 8px'} as const;
const trustBox={display:'grid',gridTemplateColumns:'auto 1fr',gap:10,alignItems:'center',padding:11,border:'1px solid',borderRadius:10,background:'#0A1422',fontSize:12,lineHeight:1.45} as const;
const metricBox={display:'grid',gridTemplateColumns:'auto 1fr',gap:12,alignItems:'center',padding:12,border:'1px solid #2B3A54',borderRadius:10,background:'#091321',fontSize:12,lineHeight:1.45} as const;
const focusBox={padding:12,border:'1px solid #365A50',borderRadius:10,background:'#0B201C',fontSize:14,fontWeight:800,lineHeight:1.5} as const;
const hookBox={padding:12,border:'1px solid #4A496A',borderRadius:10,background:'#15172A',fontSize:17,fontWeight:900,lineHeight:1.4} as const;
const bodyText={color:'#D3DCE9',lineHeight:1.6,margin:0} as const;
const list={margin:'7px 0 0',paddingLeft:20,color:'#D3DCE9',lineHeight:1.55,fontSize:13} as const;
const subjectBox={background:'#111D30',border:'1px solid #2B3A54',borderRadius:'10px 10px 0 0',padding:'10px 12px',fontSize:13} as const;
const output={whiteSpace:'pre-wrap',background:'#07101C',border:'1px solid #2B3A54',borderRadius:10,padding:14,color:'#E7EDF7',lineHeight:1.58,fontSize:14,marginBottom:9} as const;
const variantGrid={display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(250px,1fr))',gap:10} as const;
const variantCard={background:'#091321',border:'1px solid #2B3A54',borderRadius:12,padding:12,display:'grid',gap:9} as const;
const variantTitle={fontSize:11,fontWeight:950,color:'#9EF0CF',letterSpacing:.7} as const;
const variantSubject={fontSize:12,fontWeight:850,color:'#DCE8F8'} as const;
const variantText={whiteSpace:'pre-wrap',fontSize:13,lineHeight:1.55,color:'#D3DCE9'} as const;
const variantWhy={fontSize:11,lineHeight:1.5,color:'#8292AA',borderTop:'1px solid #25344D',paddingTop:8} as const;
const nextBox={marginTop:10,padding:11,borderRadius:10,background:'#101D2E',border:'1px solid #2C3E5B',color:'#DCE7F5',fontSize:12,lineHeight:1.5} as const;
