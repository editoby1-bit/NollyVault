// pages/teasers.js — Free public teasers, no login/subscription needed.
// YouTube-hosted (zero Bunny cost), meant to hook visitors into signing up.
import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function Teasers() {
  const [teasers, setTeasers] = useState(null)
  const [playing, setPlaying] = useState(null)

  useEffect(() => {
    fetch('/api/teasers/list')
      .then(r => r.ok ? r.json() : { teasers: [] })
      .then(({ teasers }) => setTeasers(teasers || []))
      .catch(() => setTeasers([]))
  }, [])

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@400;500;600&display=swap');
        :root{--gold:#c8a84b;--bg:#080808;--bg2:#111;--bg3:#1a1a1a;--bg4:#222;--text:#f0ede6;--text2:#9a9590;--text3:#5a5550;}
        *,*::before,*::after{box-sizing:border-box;}
        body{font-family:'DM Sans',sans-serif;background:var(--bg);color:var(--text);}
        .teaser-card{background:var(--bg2);border:1px solid var(--bg4);border-radius:10px;overflow:hidden;cursor:pointer;transition:transform .2s;}
        .teaser-card:hover{transform:translateY(-3px);border-color:var(--gold);}
        .btn-gold{background:var(--gold);color:#000;border:none;border-radius:8px;padding:11px 22px;font-weight:600;cursor:pointer;font-family:inherit;font-size:14px;}
      `}</style>
      <nav style={{position:'fixed',top:0,left:0,right:0,zIndex:100,height:60,display:'flex',alignItems:'center',padding:'0 24px',background:'rgba(8,8,8,0.96)',backdropFilter:'blur(12px)',borderBottom:'1px solid var(--bg4)'}}>
        <Link href="/"><span style={{fontFamily:"'Playfair Display',serif",fontSize:20,fontWeight:900,color:'var(--gold)',cursor:'pointer'}}>Naija<span style={{color:'var(--text)'}}>Rewind</span></span></Link>
        <div style={{flex:1}}/>
        <Link href="/signup"><button className="btn-gold">Get Started</button></Link>
      </nav>

      <div style={{paddingTop:100,minHeight:'100vh',maxWidth:1200,margin:'0 auto',padding:'100px 24px 60px'}}>
        <h1 style={{fontFamily:"'Playfair Display',serif",fontSize:32,fontWeight:900,marginBottom:6}}>Free Teasers</h1>
        <p style={{color:'var(--text2)',fontSize:14,marginBottom:32}}>A taste of the classics — free, no account needed. Subscribe to watch the full films and unlock every reel.</p>

        {teasers === null ? (
          <div style={{color:'var(--text3)',textAlign:'center',padding:60}}>Loading…</div>
        ) : teasers.length === 0 ? (
          <div style={{color:'var(--text3)',textAlign:'center',padding:60}}>No free teasers yet — check back soon.</div>
        ) : (
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))',gap:20}}>
            {teasers.map(t=>(
              <div key={t.id} className="teaser-card" onClick={()=>setPlaying(t)}>
                <div style={{aspectRatio:'16/9',background:'#000',display:'flex',alignItems:'center',justifyContent:'center',position:'relative'}}>
                  <img src={`https://img.youtube.com/vi/${t.youtube_video_id}/hqdefault.jpg`} alt={t.title} style={{width:'100%',height:'100%',objectFit:'cover'}} />
                  <div style={{position:'absolute',width:48,height:48,borderRadius:'50%',background:'rgba(0,0,0,0.6)',display:'flex',alignItems:'center',justifyContent:'center',border:'2px solid var(--gold)'}}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="#c8a84b"><path d="M8 5v14l11-7z"/></svg>
                  </div>
                </div>
                <div style={{padding:'12px 14px'}}>
                  <div style={{fontSize:14,fontWeight:600,marginBottom:2}}>{t.title}</div>
                  <div style={{fontSize:12,color:'var(--text3)'}}>From {t.movies?.title || 'Unknown'}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div style={{textAlign:'center',marginTop:48,padding:'32px',background:'var(--bg2)',border:'1px solid var(--bg4)',borderRadius:12}}>
          <div style={{fontFamily:"'Playfair Display',serif",fontSize:22,fontWeight:900,marginBottom:10}}>Want the full films?</div>
          <p style={{color:'var(--text2)',fontSize:14,marginBottom:20}}>Subscribe to unlock every classic, full-length, plus every reel highlight.</p>
          <Link href="/signup"><button className="btn-gold">Get Started</button></Link>
        </div>
      </div>

      {playing && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.92)',zIndex:300,display:'flex',alignItems:'center',justifyContent:'center'}} onClick={()=>setPlaying(null)}>
          <button onClick={()=>setPlaying(null)} style={{position:'absolute',top:20,right:24,background:'none',border:'none',color:'#fff',fontSize:28,cursor:'pointer'}}>×</button>
          <div style={{width:'min(800px, 92vw)',aspectRatio:'16/9'}} onClick={e=>e.stopPropagation()}>
            <iframe
              src={`https://www.youtube.com/embed/${playing.youtube_video_id}?autoplay=1`}
              style={{width:'100%',height:'100%',border:'none'}}
              allow="autoplay; encrypted-media"
              allowFullScreen
              title={playing.title}
            />
          </div>
        </div>
      )}
    </>
  )
}
