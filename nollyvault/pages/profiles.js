import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { useSupabaseClient, useSession } from './_app'

const COLORS = ['#c8a84b','#e85d9a','#5de8c8','#7b68ee','#e8774a','#4ace8a']

export default function Profiles() {
  const session = useSession()
  const supabase = useSupabaseClient()
  const router = useRouter()
  const [profiles, setProfiles] = useState([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const [newName, setNewName] = useState('')

  useEffect(() => {
    if (!session) { setLoading(false); return }
    loadProfiles()
  }, [session])

  async function loadProfiles() {
    const { data } = await supabase.from('profiles').select('*').eq('user_id', session.user.id).order('created_at')
    setProfiles(data || [])
    setLoading(false)
  }

  async function addProfile() {
    if (!newName.trim()) return
    const color = COLORS[profiles.length % COLORS.length]
    await supabase.from('profiles').insert({ user_id: session.user.id, name: newName.trim(), avatar_color: color, avatar_initials: newName.trim()[0].toUpperCase() })
    setNewName(''); setAdding(false); loadProfiles()
  }

  function selectProfile(profile) {
    sessionStorage.setItem('activeProfile', JSON.stringify(profile))
    router.push('/browse')
  }

  const S = {
    page:{minHeight:'100vh',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',background:'var(--bg)',backgroundImage:'radial-gradient(ellipse at 50% 40%,rgba(200,168,75,0.07) 0%,transparent 65%)',padding:'40px 20px'},
  }

  if (loading) return <div style={{...S.page,color:'var(--text2)'}}>Loading…</div>
  if (!session) { router.push('/login'); return null }

  return (
    <div style={S.page}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@900&family=DM+Sans:wght@400;500;600&display=swap');
        :root{--gold:#c8a84b;--gold-light:#e8c96e;--bg:#080808;--bg2:#111;--bg3:#1a1a1a;--bg4:#222;--text:#f0ede6;--text2:#9a9590;--text3:#5a5550;--radius:8px;}
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
        body{font-family:'DM Sans',sans-serif;background:var(--bg);color:var(--text);}
        .btn{display:inline-flex;align-items:center;gap:7px;padding:8px 18px;border-radius:var(--radius);font-size:13px;font-weight:600;cursor:pointer;border:none;transition:.2s;font-family:'DM Sans',sans-serif;}
        .btn-gold{background:var(--gold);color:#000;} .btn-gold:hover{background:var(--gold-light);}
        .btn-ghost{background:transparent;color:var(--text2);border:1px solid var(--bg4);} .btn-ghost:hover{color:var(--text);}
        .form-input{background:var(--bg3);border:1px solid var(--bg4);border-radius:var(--radius);padding:9px 12px;font-size:13px;color:var(--text);outline:none;font-family:'DM Sans',sans-serif;}
        .form-input:focus{border-color:var(--gold);}
      `}</style>

      <div style={{fontFamily:"'Playfair Display',serif",fontSize:24,fontWeight:900,color:'var(--gold)'}}>Naija<span style={{color:'var(--text)'}}>Rewind</span></div>
      <h1 style={{fontFamily:"'Playfair Display',serif",fontSize:32,fontWeight:900,marginTop:20,marginBottom:6,textAlign:'center'}}>Who's watching?</h1>
      <p style={{color:'var(--text2)',fontSize:14,marginBottom:40,textAlign:'center'}}>Pick a profile — or add one for each person in your household. Each profile keeps its own watchlist and "continue watching" separate, so nobody's viewing history gets mixed up with anyone else's.</p>

      <div style={{display:'flex',gap:24,flexWrap:'wrap',justifyContent:'center',marginBottom:40}}>
        {profiles.map(p=>(
          <div key={p.id} onClick={()=>selectProfile(p)} style={{display:'flex',flexDirection:'column',alignItems:'center',gap:10,cursor:'pointer'}}>
            <div style={{width:84,height:84,borderRadius:14,background:(p.avatar_color||'#c8a84b')+'28',color:p.avatar_color||'#c8a84b',display:'flex',alignItems:'center',justifyContent:'center',fontSize:32,fontWeight:700,border:'2px solid transparent',transition:'border-color .2s,transform .2s'}}
              onMouseEnter={e=>{e.currentTarget.style.borderColor=p.avatar_color||'#c8a84b';e.currentTarget.style.transform='scale(1.07)'}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor='transparent';e.currentTarget.style.transform='scale(1)'}}>
              {p.avatar_initials||p.name[0].toUpperCase()}
            </div>
            <div style={{fontSize:14,color:'var(--text2)',fontWeight:500}}>{p.name}</div>
          </div>
        ))}
        {profiles.length < 5 && (
          <div onClick={()=>setAdding(true)} style={{display:'flex',flexDirection:'column',alignItems:'center',gap:10,cursor:'pointer'}}>
            <div style={{width:84,height:84,borderRadius:14,background:'var(--bg3)',border:'2px dashed var(--bg4)',display:'flex',alignItems:'center',justifyContent:'center',color:'var(--text3)',transition:'border-color .2s'}}
              onMouseEnter={e=>e.currentTarget.style.borderColor='var(--text3)'}
              onMouseLeave={e=>e.currentTarget.style.borderColor='var(--bg4)'}>
              <svg viewBox="0 0 24 24" width={36} height={36} fill="currentColor"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>
            </div>
            <div style={{fontSize:14,color:'var(--text3)'}}>Add Profile</div>
          </div>
        )}
      </div>

      {adding && (
        <div style={{display:'flex',gap:10,alignItems:'center',marginBottom:24}}>
          <input className="form-input" style={{width:200}} value={newName} onChange={e=>setNewName(e.target.value)} placeholder="e.g. Mum, Dad, your name…" autoFocus onKeyDown={e=>e.key==='Enter'&&addProfile()} />
          <button className="btn btn-gold" onClick={addProfile}>Add</button>
          <button className="btn btn-ghost" onClick={()=>setAdding(false)}>Cancel</button>
        </div>
      )}

      <button className="btn btn-ghost" onClick={()=>{supabase.auth.signOut();router.push('/login')}}>
        <svg viewBox="0 0 24 24" width={15} height={15} fill="currentColor"><path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/></svg>
        Sign Out
      </button>
    </div>
  )
}
