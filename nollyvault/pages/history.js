// pages/history.js — Full watch history for the active profile
import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Nav from '../components/Nav'
import { useSession, useAuthReady } from './_app'

export default function History() {
  const router = useRouter()
  const session = useSession()
  const ready = useAuthReady()
  const [history, setHistory] = useState(null)

  useEffect(() => {
    if (!ready) return
    if (!session) { router.replace('/login?redirect=/history'); return }
    const profile = JSON.parse(sessionStorage.getItem('activeProfile') || '{}')
    if (!profile?.id) { router.replace('/profiles'); return }
    fetch(`/api/progress?profileId=${profile.id}&history=true`)
      .then(r => r.ok ? r.json() : { history: [] })
      .then(({ history }) => setHistory(history || []))
      .catch(() => setHistory([]))
  }, [session, ready])

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@400;500;600&display=swap');
        :root{--gold:#c8a84b;--bg:#080808;--bg2:#111;--bg3:#1a1a1a;--bg4:#222;--text:#f0ede6;--text2:#9a9590;--text3:#5a5550;--green:#4ace8a;}
        *,*::before,*::after{box-sizing:border-box;}
        body{font-family:'DM Sans',sans-serif;background:var(--bg);color:var(--text);}
      `}</style>
      <Nav />
      <div style={{paddingTop:80,minHeight:'100vh',maxWidth:900,margin:'0 auto',padding:'90px 24px 60px'}}>
        <h1 style={{fontFamily:"'Playfair Display',serif",fontSize:32,fontWeight:900,marginBottom:6}}>Watch History</h1>
        <p style={{color:'var(--text2)',fontSize:14,marginBottom:32}}>Everything you've watched on this profile, most recent first.</p>

        {history === null ? (
          <div style={{color:'var(--text3)',textAlign:'center',padding:60}}>Loading…</div>
        ) : history.length === 0 ? (
          <div style={{color:'var(--text3)',textAlign:'center',padding:60}}>Nothing watched yet — your history will show up here once you start.</div>
        ) : (
          <div style={{display:'flex',flexDirection:'column',gap:2}}>
            {history.map((h,i)=>{
              const pct = h.movies?.duration_seconds ? Math.min(100, Math.round((h.progress_seconds/h.movies.duration_seconds)*100)) : null
              return (
                <div key={i} onClick={()=>h.movies?.id && router.push(`/watch/${h.movies.id}`)} style={{display:'flex',alignItems:'center',gap:16,padding:'14px 16px',background:'var(--bg2)',border:'1px solid var(--bg4)',borderRadius:8,cursor:'pointer'}}>
                  <div style={{width:50,height:70,borderRadius:6,background:h.movies?.thumbnail_url?`url(${h.movies.thumbnail_url}) center/cover`:'linear-gradient(160deg,#1a0f00,#2a1800)',flexShrink:0}} />
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontWeight:600,fontSize:14,marginBottom:3}}>{h.movies?.title || 'Unknown movie'}</div>
                    <div style={{fontSize:12,color:'var(--text3)'}}>{h.movies?.year} · {h.movies?.category}</div>
                    <div style={{fontSize:11,color:'var(--text3)',marginTop:4}}>{new Date(h.watched_at).toLocaleDateString(undefined,{month:'short',day:'numeric',year:'numeric'})}</div>
                  </div>
                  <div style={{textAlign:'right',flexShrink:0}}>
                    {h.completed ? (
                      <span style={{fontSize:11,padding:'3px 10px',borderRadius:20,background:'rgba(74,206,138,0.12)',color:'var(--green)',fontWeight:600}}>✓ Watched</span>
                    ) : pct !== null ? (
                      <span style={{fontSize:11,padding:'3px 10px',borderRadius:20,background:'rgba(200,168,75,0.12)',color:'var(--gold)',fontWeight:600}}>{pct}% watched</span>
                    ) : (
                      <span style={{fontSize:11,color:'var(--text3)'}}>In progress</span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </>
  )
}
