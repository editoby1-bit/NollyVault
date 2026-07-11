import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { useSupabaseClient } from './_app'

export default function ResetPassword() {
  const supabase = useSupabaseClient()
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (!supabase) return
    // Supabase fires PASSWORD_RECOVERY when the user lands here via the
    // emailed reset link (it exchanges the link's token for a temporary
    // session automatically). Only allow the form once that's confirmed —
    // otherwise someone could land on this URL directly with no valid token.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setReady(true)
    })
    // Also check in case the event already fired before this listener attached
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setReady(true)
    })
    return () => subscription.unsubscribe()
  }, [supabase])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (password.length < 8) { setError('Password must be at least 8 characters'); return }
    setLoading(true); setError('')
    const { error } = await supabase.auth.updateUser({ password })
    if (error) { setError(error.message); setLoading(false) }
    else { setDone(true); setTimeout(() => router.push('/login'), 2500) }
  }

  return (
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'var(--bg)',backgroundImage:'radial-gradient(ellipse at 30% 50%,rgba(200,168,75,0.08) 0%,transparent 60%)',padding:20}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@900&family=DM+Sans:wght@400;500;600&display=swap');
        :root{--gold:#c8a84b;--gold-light:#e8c96e;--gold-dim:#7a6530;--bg:#080808;--bg2:#111;--bg3:#1a1a1a;--bg4:#222;--text:#f0ede6;--text2:#9a9590;--text3:#5a5550;--red:#e84a4a;--green:#4ace8a;--radius:8px;--radius-lg:14px;}
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
        {done ? (
          <>
            <div style={{textAlign:'center',fontSize:36,marginTop:20,marginBottom:14}}>✅</div>
            <div style={{fontSize:17,fontWeight:600,marginBottom:10,textAlign:'center',color:'var(--green)'}}>Password updated</div>
            <p style={{fontSize:13,color:'var(--text2)',textAlign:'center'}}>Taking you to sign in…</p>
          </>
        ) : !ready ? (
          <>
            <div style={{fontSize:15,color:'var(--text2)',textAlign:'center',marginTop:24}}>Verifying your reset link…</div>
            <p style={{fontSize:12,color:'var(--text3)',textAlign:'center',marginTop:10}}>If nothing happens, the link may have expired — request a new one from the sign-in page.</p>
          </>
        ) : (
          <>
            <div style={{fontSize:19,fontWeight:600,marginBottom:20,marginTop:16}}>Set a new password</div>
            <form onSubmit={handleSubmit}>
              <div style={{marginBottom:14}}>
                <label style={{display:'block',fontSize:11,fontWeight:600,color:'var(--text2)',marginBottom:6,textTransform:'uppercase',letterSpacing:'.07em'}}>New Password</label>
                <div style={{position:'relative'}}>
                  <input className="form-input" type={showPassword?'text':'password'} value={password} onChange={e=>setPassword(e.target.value)} placeholder="Min. 8 characters" required style={{paddingRight:44}} />
                  <button type="button" onClick={()=>setShowPassword(s=>!s)} aria-label={showPassword?'Hide password':'Show password'}
                    style={{position:'absolute',right:10,top:'50%',transform:'translateY(-50%)',background:'none',border:'none',cursor:'pointer',color:'var(--text3)',fontSize:12,fontWeight:600,padding:4}}>
                    {showPassword?'Hide':'Show'}
                  </button>
                </div>
              </div>
              {error && <div style={{fontSize:12,color:'var(--red)',marginBottom:12}}>{error}</div>}
              <button type="submit" className="btn btn-gold" disabled={loading}>{loading?'Updating…':'Update Password'}</button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
