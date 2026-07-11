import { useState } from 'react'
import Link from 'next/link'
import { useSupabaseClient } from './_app'

export default function ForgotPassword() {
  const supabase = useSupabaseClient()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true); setError('')
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    // Show success either way — never reveal whether an email exists in the
    // system, so this can't be used to check which emails are registered.
    if (error) console.warn('Password reset request error:', error.message)
    setSent(true)
    setLoading(false)
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
        {sent ? (
          <>
            <div style={{textAlign:'center',fontSize:36,marginTop:20,marginBottom:14}}>✉️</div>
            <div style={{fontSize:17,fontWeight:600,marginBottom:10,textAlign:'center'}}>Check your email</div>
            <p style={{fontSize:13,color:'var(--text2)',textAlign:'center',lineHeight:1.6}}>
              If an account exists for <strong style={{color:'var(--text)'}}>{email}</strong>, a password reset link is on its way. It expires after a while, so use it soon.
            </p>
          </>
        ) : (
          <>
            <div style={{fontSize:19,fontWeight:600,marginBottom:8,marginTop:16}}>Reset your password</div>
            <p style={{fontSize:13,color:'var(--text2)',marginBottom:20}}>Enter the email on your account and we'll send you a link to reset it.</p>
            <form onSubmit={handleSubmit}>
              <div style={{marginBottom:14}}>
                <label style={{display:'block',fontSize:11,fontWeight:600,color:'var(--text2)',marginBottom:6,textTransform:'uppercase',letterSpacing:'.07em'}}>Email</label>
                <input className="form-input" type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="your@email.com" required />
              </div>
              {error && <div style={{fontSize:12,color:'var(--red)',marginBottom:12}}>{error}</div>}
              <button type="submit" className="btn btn-gold" disabled={loading}>{loading?'Sending…':'Send Reset Link'}</button>
            </form>
          </>
        )}
        <div style={{textAlign:'center',fontSize:13,color:'var(--text2)',marginTop:18}}>
          <Link href="/login"><span style={{color:'var(--gold)',cursor:'pointer',fontWeight:500}}>← Back to sign in</span></Link>
        </div>
      </div>
    </div>
  )
}
