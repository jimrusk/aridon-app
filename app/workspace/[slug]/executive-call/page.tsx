'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getBrowserClient } from '../../../../lib/supabase';
import { executives } from '../../../../lib/executives';

export default function ExecutiveCallPage({ params }: { params: { slug: string } }) {
  const router = useRouter();
  const [token, setToken] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [executive, setExecutive] = useState('Eva');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    getBrowserClient().auth.getSession().then(({ data }) => {
      const accessToken = data.session?.access_token || '';
      if (!accessToken) { router.replace(`/customer/login?next=${encodeURIComponent(`/workspace/${params.slug}/executive-call`)}`); return; }
      setToken(accessToken);
    });
  }, [params.slug, router]);

  async function callMe() {
    if (!token || busy) return;
    setBusy(true); setError(''); setMessage('');
    try {
      const response = await fetch('/api/executive-call/initiate', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: params.slug, phoneNumber, executive }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'The call could not be started.');
      setMessage(`${data.executive || executive} is calling you now.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'The call could not be started.');
    } finally { setBusy(false); }
  }

  return <main style={page}><div style={shell}>
    <div style={top}><div><div style={eyebrow}>ARIDON EXECUTIVE PHONE</div><h1 style={h1}>Have an executive call you.</h1><p style={lead}>Choose who you want to talk with, enter your phone number, and Aridon places the call.</p></div><div style={{display:'flex',gap:8,flexWrap:'wrap'}}><Link href={`/workspace/${params.slug}/executive-command`} style={link}>Ask Aridon</Link><Link href={`/workspace/${params.slug}`} style={link}>Company Home</Link></div></div>

    <section style={panel}>
      <div style={label}>WHO SHOULD CALL?</div>
      <div style={teamGrid}>{executives.map((item) => <button key={item.id} onClick={() => setExecutive(item.name)} style={{...card,...(executive===item.name?activeCard:{})}}><img src={item.avatar} alt="" style={avatar}/><div><strong>{item.name}</strong><small style={small}>{item.role}</small></div></button>)}</div>
      <div style={callBox}><label style={fieldLabel}>Your phone number</label><input value={phoneNumber} onChange={(e)=>setPhoneNumber(e.target.value)} placeholder="+15055551212" inputMode="tel" style={input}/><button onClick={callMe} disabled={!token || busy || !phoneNumber.trim()} style={{...callButton,opacity:(!token||busy||!phoneNumber.trim())?.45:1}}>{busy ? 'Starting call…' : `📞 Call me with ${executive}`}</button></div>
      {message && <div style={success}>{message}</div>}
      {error && <div style={errorBox}>{error}</div>}
      <p style={note}>Eva uses an Australian English voice. The other executives have their own voices. Calls use the same Aridon executive rules: they can talk, analyze and advise, but consequential commitments remain behind owner approval.</p>
    </section>
  </div></main>;
}

const page={minHeight:'100vh',background:'#07101C',color:'#F4F7FB',padding:'26px 16px 80px',fontFamily:'Arial,sans-serif'} as const;
const shell={maxWidth:1100,margin:'0 auto'} as const;
const top={display:'flex',justifyContent:'space-between',alignItems:'center',gap:18,flexWrap:'wrap',marginBottom:18} as const;
const eyebrow={fontSize:11,fontWeight:950,color:'#9EF0CF',letterSpacing:1.4} as const;
const h1={fontSize:'clamp(34px,6vw,60px)',margin:'7px 0'} as const;
const lead={color:'#9DABC0',maxWidth:700,lineHeight:1.6} as const;
const link={color:'#ECF3FC',textDecoration:'none',border:'1px solid #34445F',padding:'10px 13px',borderRadius:10,fontWeight:850} as const;
const panel={background:'#0D1726',border:'1px solid #25344D',borderRadius:20,padding:18} as const;
const label={fontSize:11,fontWeight:950,color:'#7F91AB',marginBottom:10} as const;
const teamGrid={display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(210px,1fr))',gap:9} as const;
const card={display:'flex',alignItems:'center',gap:10,border:'1px solid #2B3A54',background:'#101B2B',color:'#EEF4FC',padding:10,borderRadius:13,textAlign:'left',cursor:'pointer'} as const;
const activeCard={border:'1px solid #9EF0CF',background:'#16283A'} as const;
const avatar={width:52,height:52,borderRadius:13,objectFit:'cover'} as const;
const small={display:'block',color:'#93A2B8',fontSize:10,marginTop:4} as const;
const callBox={display:'grid',gridTemplateColumns:'minmax(220px,1fr) auto',gap:10,alignItems:'end',marginTop:18} as const;
const fieldLabel={gridColumn:'1/-1',fontSize:11,fontWeight:900,color:'#B8C3D3'} as const;
const input={background:'#07101C',color:'#fff',border:'1px solid #34445F',borderRadius:12,padding:'14px 13px',fontSize:16} as const;
const callButton={border:0,background:'#9EF0CF',color:'#07130F',borderRadius:12,padding:'14px 18px',fontWeight:950,cursor:'pointer'} as const;
const success={marginTop:12,padding:12,borderRadius:10,background:'#133126',border:'1px solid #2A6A4E',color:'#B9F2D9'} as const;
const errorBox={marginTop:12,padding:12,borderRadius:10,background:'#2B1718',border:'1px solid #6B353B',color:'#F1B9B1'} as const;
const note={color:'#74849B',fontSize:11,lineHeight:1.6,marginTop:14} as const;
