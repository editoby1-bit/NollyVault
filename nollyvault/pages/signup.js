import { useState } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { useSupabaseClient } from './_app'

export default function Signup() {
  const supabase = useSupabaseClient()
  const router = useRouter()
  const [form, setForm] = useState({ name: '', email: '', password: '', referralCode: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  const handleSignup = async (e) => {
    e.preventDefault()
    if (form.password.length < 8) { setError('Password must be at least 8 characters'); return }
    setLoading(true); setError('')
    const { error } = await supabase.auth.signUp({
      email: form.email, password: form.password,
      options: { data: { full_name: form.name } },
    })
    if (error) { setError(error.message); setLoading(false) }
    else {
      if (form.referralCode.trim()) {
        try {
          await fetch('/api/referral/apply', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code: form.referralCode.trim().toUpperCase() }),
          })
        } catch (e) {}
      }
      router.push('/browse')
    }
  }

  return (
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'var(--bg)',backgroundImage:'radial-gradient(ellipse at 70% 30%,rgba(200,168,75,0.07) 0%,transparent 60%)',padding:20}}>
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
        <div style={{fontFamily:"'Playfair Display',serif",fontSize:28,fontWeight:900,color:'var(--gold)',textAlign:'center',marginBottom:4}}>Naija<span style={{color:'var(--text)'}}>Rewind</span></div>
        <div style={{textAlign:'center',color:'var(--text2)',fontSize:13,marginBottom:30}}>Relive the Golden Era of Nollywood</div>
        <div style={{fontSize:19,fontWeight:600,marginBottom:20}}>Create your account</div>
        <form onSubmit={handleSignup}>
          {[{k:'name',label:'Full Name',type:'text',ph:'Ada Okafor'},{k:'email',label:'Email',type:'email',ph:'your@email.com'}].map(f=>(
            <div key={f.k} style={{marginBottom:14}}>
              <label style={{display:'block',fontSize:11,fontWeight:600,color:'var(--text2)',marginBottom:6,textTransform:'uppercase',letterSpacing:'.07em'}}>{f.label}</label>
              <input className="form-input" type={f.type} value={form[f.k]} onChange={set(f.k)} placeholder={f.ph} required />
            </div>
          ))}
          <div style={{marginBottom:14}}>
            <label style={{display:'block',fontSize:11,fontWeight:600,color:'var(--text2)',marginBottom:6,textTransform:'uppercase',letterSpacing:'.07em'}}>Password</label>
            <div style={{position:'relative'}}>
              <input className="form-input" type={showPassword?'text':'password'} value={form.password} onChange={set('password')} placeholder="Min. 8 characters" required style={{paddingRight:44}} />
              <button type="button" onClick={()=>setShowPassword(s=>!s)} aria-label={showPassword?'Hide password':'Show password'}
                style={{position:'absolute',right:10,top:'50%',transform:'translateY(-50%)',background:'none',border:'none',cursor:'pointer',color:'var(--text3)',fontSize:12,fontWeight:600,padding:4}}>
                {showPassword?'Hide':'Show'}
              </button>
            </div>
          </div>
          <div style={{marginBottom:14}}>
            <label style={{display:'block',fontSize:11,fontWeight:600,color:'var(--text2)',marginBottom:6,textTransform:'uppercase',letterSpacing:'.07em'}}>Referral Code <span style={{color:'var(--text3)',fontWeight:400,textTransform:'none'}}>(optional)</span></label>
            <input className="form-input" type="text" value={form.referralCode} onChange={set('referralCode')} placeholder="e.g. KANAYO2024" style={{textTransform:'uppercase'}} />
          </div>
          {error && <div style={{fontSize:12,color:'var(--red)',marginBottom:12}}>{error}</div>}
          <button type="submit" className="btn btn-gold" disabled={loading} style={{marginTop:4}}>
            {loading ? 'Creating account…' : 'Get Started'}
          </button>
        </form>
        <div style={{fontSize:12,color:'var(--text3)',textAlign:'center',marginTop:12}}>By signing up you agree to our Terms of Service</div>
        <div style={{textAlign:'center',fontSize:13,color:'var(--text2)',marginTop:14}}>
          Already have an account?{' '}
          <Link href="/login"><span style={{color:'var(--gold)',cursor:'pointer',fontWeight:500}}>Sign in</span></Link>
        </div>
      </div>
    </div>
  )
}
