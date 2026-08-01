'use client';
import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter, useSearchParams } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get('next') || '/';

  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [checking, setChecking] = useState(true);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // If already logged in, skip straight to app
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) router.replace(next);
      else setChecking(false);
    });
  }, []);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    const { error: err } = await supabase.auth.signInWithPassword({ email, password });
    if (err) {
      setError(err.message);
      setLoading(false);
    } else {
      router.replace(next);
    }
  }

  if (checking) return (
    <div style={{minHeight:'100vh',background:'#0a0e1a',display:'flex',alignItems:'center',justifyContent:'center'}}>
      <div style={{color:'#9ba8c6',fontSize:'14px'}}>Loading…</div>
    </div>
  );

  return (
    <div style={{minHeight:'100vh',background:'#0a0e1a',display:'flex',alignItems:'center',justifyContent:'center',padding:'24px'}}>
      <div style={{width:'100%',maxWidth:'400px'}}>

        {/* Logo */}
        <div style={{textAlign:'center',marginBottom:'40px'}}>
          <div style={{fontSize:'28px',fontWeight:900,letterSpacing:'4px',color:'#fff',marginBottom:'6px'}}>ARIDON</div>
          <div style={{fontSize:'13px',color:'#9ba8c6'}}>Your Executive Team is Online</div>
        </div>

        {/* Card */}
        <div style={{background:'#0f1623',border:'1px solid #1d2740',borderRadius:'16px',padding:'32px'}}>
          <h2 style={{margin:'0 0 24px',color:'#fff',fontSize:'18px',fontWeight:700}}>Sign in to your workspace</h2>

          <form onSubmit={handleLogin} style={{display:'flex',flexDirection:'column',gap:'16px'}}>
            <div>
              <label style={{display:'block',fontSize:'12px',fontWeight:600,color:'#9ba8c6',marginBottom:'6px',textTransform:'uppercase',letterSpacing:'0.5px'}}>Email</label>
              <input
                type="email"
                value={email}
                onChange={e=>setEmail(e.target.value)}
                placeholder="you@company.com"
                required
                style={{width:'100%',background:'#0a0e1a',border:'1px solid #1d2740',borderRadius:'8px',padding:'10px 14px',color:'#fff',fontSize:'14px',outline:'none',boxSizing:'border-box'}}
              />
            </div>

            <div>
              <label style={{display:'block',fontSize:'12px',fontWeight:600,color:'#9ba8c6',marginBottom:'6px',textTransform:'uppercase',letterSpacing:'0.5px'}}>Password</label>
              <input
                type="password"
                value={password}
                onChange={e=>setPassword(e.target.value)}
                placeholder="••••••••"
                required
                style={{width:'100%',background:'#0a0e1a',border:'1px solid #1d2740',borderRadius:'8px',padding:'10px 14px',color:'#fff',fontSize:'14px',outline:'none',boxSizing:'border-box'}}
              />
            </div>

            {error && (
              <div style={{background:'#E8772218',border:'1px solid #E8772244',borderRadius:'8px',padding:'10px 14px',color:'#E87722',fontSize:'13px'}}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{background:'#4A90D9',border:'none',borderRadius:'8px',padding:'12px',color:'#fff',fontWeight:700,fontSize:'14px',cursor:loading?'not-allowed':'pointer',opacity:loading?0.7:1,marginTop:'4px'}}
            >
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          <p style={{margin:'20px 0 0',fontSize:'12px',color:'#9ba8c6',textAlign:'center'}}>
            No account? Contact your Aridon administrator for access.
          </p>
        </div>

        <p style={{textAlign:'center',marginTop:'24px',fontSize:'11px',color:'#4a5568'}}>
          Powered by Iron Grid Electric &amp; Water · Aridon AI
        </p>
      </div>
    </div>
  );
}
