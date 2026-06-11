import { useState } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { useSupabaseClient } from './_app'

export default function Login() {
  const supabase = useSupabaseClient()
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) { setError(error.message); setLoading(false) }
    else router.push('/profiles')
  }

  return (
    <div style={{
      minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',
      background:'var(--bg)',
      backgroundImage:'radial-gradient(ellipse at 30% 50%,rgba(200,168,75,0.08) 0%,transparent 60%)',
      padding:20,
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@900&family=DM+Sans:wght@400;500;600&display=swap');
        :root{--gold:#c8a84b;--gold-light:#e8c96e;--gold-dim:#7a6530;--bg:#080808;--bg2:#111;--bg3:#1a1a1a;--bg4:#222;--text:#f0ede6;--text2:#9a9590;--text3:#5a5550;--red:#e84a4a;--radius:8px;--radius-lg:14px;}
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
        body{font-family:'DM Sans',sans-serif;background:var(--bg);color:var(--text);-webkit-font-smoothing:antialiased;}
        .card{background:var(--bg2);border:1px solid var(--bg4);border-radius:var(--radius-lg);}
        .btn{display:inline-flex;align-items:center;justify-content:center;padding:11px 20px;border-radius:var(--radius);font-size:14px;font-weight:600;cursor:pointer;border:none;transition:.2s;width:100%;font-family:'DM Sans',sans-serif;}
        .btn-gold{background:var(--gold);color:#000;} .btn-gold:hover:not(:disabled){background:var(--gold-light);}
        .btn:disabled{opacity:.5;cursor:not-allowed;}
        .form-input{width:100%;background:var(--bg3);border:1px solid var(--bg4);border-radius:var(--radius);padding:10px 14px;font-size:14px;color:var(--text);outline:none;font-family:'DM Sans',sans-serif;transition:border-color .2s;}
        .form-input:focus{border-color:var(--gold-dim);}
        .form-input::placeholder{color:var(--text3);}
      `}</style>
      <div className="card" style={{width:'100%',maxWidth:420,padding:'36px 32px'}}>
        <div style={{fontFamily:"'Playfair Display',serif",fontSize:28,fontWeight:900,color:'var(--gold)',textAlign:'center',marginBottom:4}}>
          Naija<span style={{color:'var(--text)'}}>Rewind</span>
        </div>
        <div style={{textAlign:'center',color:'var(--text2)',fontSize:13,marginBottom:30}}>The Home of Classic Nollywood</div>
        <div style={{fontSize:19,fontWeight:600,marginBottom:20}}>Welcome back</div>
        <form onSubmit={handleLogin}>
          <div style={{marginBottom:14}}>
            <label style={{display:'block',fontSize:11,fontWeight:600,color:'var(--text2)',marginBottom:6,textTransform:'uppercase',letterSpacing:'.07em'}}>Email</label>
            <input className="form-input" type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="your@email.com" required />
          </div>
          <div style={{marginBottom:14}}>
            <label style={{display:'block',fontSize:11,fontWeight:600,color:'var(--text2)',marginBottom:6,textTransform:'uppercase',letterSpacing:'.07em'}}>Password</label>
            <input className="form-input" type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••" required />
          </div>
          {error && <div style={{fontSize:12,color:'var(--red)',marginBottom:12}}>{error}</div>}
          <button type="submit" className="btn btn-gold" disabled={loading} style={{marginTop:4}}>
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>
        <div style={{textAlign:'center',fontSize:13,color:'var(--text2)',marginTop:18}}>
          Don't have an account?{' '}
          <Link href="/signup"><span style={{color:'var(--gold)',cursor:'pointer',fontWeight:500}}>Create one</span></Link>
        </div>
      </div>
    </div>
  )
}
