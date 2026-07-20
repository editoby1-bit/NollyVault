import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { useSession, useSupabaseClient } from './_app'
import Nav from '../components/Nav'

export default function Account() {
  const session = useSession()
  const supabase = useSupabaseClient()
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [profiles, setProfiles] = useState([])
  const [activeProfile, setActiveProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const p = sessionStorage.getItem('activeProfile')
    if (p) setActiveProfile(JSON.parse(p))
  }, [])

  useEffect(() => {
    if (!session) return
    Promise.all([
      supabase.from('users').select('*').eq('id', session.user.id).single(),
      supabase.from('profiles').select('*').eq('user_id', session.user.id).order('created_at'),
    ]).then(([{data:u},{data:profs}]) => {
      setUser(u || { email:session.user.email, plan:null, plan_status:null })
      setProfiles(profs || [])
      setLoading(false)
    })
    if (router.query.payment === 'success') alert('Payment successful! Welcome to NaijaRewind 🎬')
  }, [session])

  const planColors = { classic:'var(--gold)', premium:'#e8e8e8', family:'var(--purple)' }
  const planLabels = { classic:'Classic', premium:'Premium', family:'Family & Friends' }

  if (loading) return <div style={{minHeight:'100vh',background:'var(--bg)',display:'flex',alignItems:'center',justifyContent:'center',color:'var(--text2)'}}>Loading…</div>

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@400;500;600&display=swap');
        :root{--gold:#c8a84b;--gold-light:#e8c96e;--gold-dim:#7a6530;--bg:#080808;--bg2:#111;--bg3:#1a1a1a;--bg4:#222;--text:#f0ede6;--text2:#9a9590;--text3:#5a5550;--green:#4ace8a;--red:#e84a4a;--purple:#7b68ee;--radius:8px;--radius-lg:14px;}
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
        body{font-family:'DM Sans',sans-serif;background:var(--bg);color:var(--text);-webkit-font-smoothing:antialiased;}
        .card{background:var(--bg2);border:1px solid var(--bg4);border-radius:var(--radius-lg);}
        .btn{display:inline-flex;align-items:center;gap:7px;padding:9px 18px;border-radius:var(--radius);font-size:14px;font-weight:600;cursor:pointer;border:none;transition:.2s;font-family:'DM Sans',sans-serif;}
        .btn-sm{padding:7px 14px;font-size:13px;}
        .btn-gold{background:var(--gold);color:#000;} .btn-gold:hover{background:var(--gold-light);}
        .btn-outline{background:rgba(255,255,255,.07);color:var(--text);border:1px solid rgba(255,255,255,.14);}
        .btn-ghost{background:transparent;color:var(--text2);border:1px solid var(--bg4);} .btn-ghost:hover{color:var(--text);}
      `}</style>
      <Nav activeProfile={activeProfile} onProfileClick={()=>router.push('/profiles')} />
      <div style={{paddingTop:'var(--nav-height,64px)',minHeight:'100vh',background:'var(--bg)'}}>
        <div style={{maxWidth:700,margin:'0 auto',padding:'36px 20px 80px'}}>
          <h1 style={{fontFamily:"'Playfair Display',serif",fontSize:28,fontWeight:900,marginBottom:28}}>My Account</h1>

          {/* Subscription */}
          <div className="card" style={{padding:'24px',marginBottom:16}}>
            <h3 style={{fontSize:13,fontWeight:600,color:'var(--text2)',textTransform:'uppercase',letterSpacing:'.07em',marginBottom:16}}>Subscription</h3>
            {user?.plan ? (
              <>
                <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:12}}>
                  <div style={{fontFamily:"'Playfair Display',serif",fontSize:22,fontWeight:900,color:planColors[user.plan]||'var(--gold)'}}>
                    {planLabels[user.plan]||user.plan} Plan
                  </div>
                  <span style={{fontSize:11,padding:'2px 8px',borderRadius:4,fontWeight:600,background:user.plan_status==='active'?'rgba(74,206,138,0.12)':'rgba(232,74,74,0.12)',color:user.plan_status==='active'?'var(--green)':'var(--red)'}}>
                    {(user.plan_status||'unknown').toUpperCase()}
                  </span>
                </div>
                <div style={{fontSize:13,color:'var(--text2)',marginBottom:16}}>Renews automatically. Managed via Paystack.</div>
                <div style={{display:'flex',gap:10}}>
                  <button className="btn btn-outline" onClick={()=>router.push('/pricing')}>Change Plan</button>
                  <button className="btn btn-ghost" onClick={()=>alert('To cancel, contact support or manage via Paystack dashboard.')}>Cancel</button>
                </div>
              </>
            ) : (
              <>
                <div style={{fontSize:14,color:'var(--text2)',marginBottom:16}}>You don't have an active subscription.</div>
                <button className="btn btn-gold" onClick={()=>router.push('/pricing')}>Choose a Plan</button>
              </>
            )}
          </div>

          {/* Profiles */}
          <div className="card" style={{padding:'24px',marginBottom:16}}>
            <h3 style={{fontSize:13,fontWeight:600,color:'var(--text2)',textTransform:'uppercase',letterSpacing:'.07em',marginBottom:16}}>Profiles ({profiles.length}/5)</h3>
            <div style={{display:'flex',gap:14,flexWrap:'wrap',marginBottom:16}}>
              {profiles.map(p=>(
                <div key={p.id} style={{display:'flex',flexDirection:'column',alignItems:'center',gap:6}}>
                  <div style={{width:52,height:52,borderRadius:10,background:(p.avatar_color||'#c8a84b')+'28',color:p.avatar_color||'#c8a84b',display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,fontWeight:700}}>
                    {p.avatar_initials||p.name[0]}
                  </div>
                  <div style={{fontSize:12,color:'var(--text2)'}}>{p.name}</div>
                </div>
              ))}
            </div>
            <button className="btn btn-ghost btn-sm" onClick={()=>router.push('/profiles')}>Manage Profiles</button>
          </div>

          {/* Account details */}
          <div className="card" style={{padding:'24px',marginBottom:24}}>
            <h3 style={{fontSize:13,fontWeight:600,color:'var(--text2)',textTransform:'uppercase',letterSpacing:'.07em',marginBottom:16}}>Account Details</h3>
            <div style={{fontSize:14,color:'var(--text2)',lineHeight:2}}>
              <div><strong style={{color:'var(--text)'}}>Email: </strong>{user?.email}</div>
              <div><strong style={{color:'var(--text)'}}>Member since: </strong>{new Date(session?.user?.created_at).toLocaleDateString('en-NG',{year:'numeric',month:'long'})}</div>
            </div>
          </div>

          <div style={{display:'flex',gap:10,flexWrap:'wrap'}}>
            <button className="btn btn-ghost" onClick={()=>router.push('/history')}>
              <svg viewBox="0 0 24 24" width={15} height={15} fill="currentColor"><path d="M13 3a9 9 0 00-9 9H1l3.89 3.89.07.14L9 12H6a7 7 0 117 7 6.9 6.9 0 01-4.95-2.05l-1.41 1.41A9 9 0 1013 3zm-1 5v5l4.28 2.54.72-1.21-3.5-2.08V8z"/></svg>
              Watch History
            </button>
            <button className="btn btn-ghost" onClick={async()=>{await supabase.auth.signOut();router.push('/login')}}>
              <svg viewBox="0 0 24 24" width={15} height={15} fill="currentColor"><path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/></svg>
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
