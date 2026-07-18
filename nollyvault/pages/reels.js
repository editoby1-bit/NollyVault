// pages/reels.js — Short highlight clips from movies, freely watchable
import { useState, useEffect } from 'react'
import Nav from '../components/Nav'

export default function Reels() {
  const [reels, setReels] = useState(null)
  const [playing, setPlaying] = useState(null)
  const [streamUrl, setStreamUrl] = useState(null)

  useEffect(() => {
    fetch('/api/reels/list')
      .then(r => r.ok ? r.json() : { reels: [] })
      .then(({ reels }) => setReels(reels || []))
      .catch(() => setReels([]))
  }, [])

  async function openReel(reel) {
    setPlaying(reel)
    setStreamUrl(null)
    const res = await fetch(`/api/reels/stream/${reel.id}`)
    const data = await res.json()
    if (data.streamUrl) setStreamUrl(data.streamUrl)
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@400;500;600&display=swap');
        :root{--gold:#c8a84b;--bg:#080808;--bg2:#111;--bg3:#1a1a1a;--bg4:#222;--text:#f0ede6;--text2:#9a9590;--text3:#5a5550;}
        *,*::before,*::after{box-sizing:border-box;}
        body{font-family:'DM Sans',sans-serif;background:var(--bg);color:var(--text);}
        .reel-card{background:var(--bg2);border:1px solid var(--bg4);border-radius:10px;overflow:hidden;cursor:pointer;transition:transform .2s;}
        .reel-card:hover{transform:translateY(-3px);border-color:var(--gold);}
      `}</style>
      <Nav />
      <div style={{paddingTop:80,minHeight:'100vh',maxWidth:1200,margin:'0 auto',padding:'90px 24px 60px'}}>
        <h1 style={{fontFamily:"'Playfair Display',serif",fontSize:32,fontWeight:900,marginBottom:6}}>Reels</h1>
        <p style={{color:'var(--text2)',fontSize:14,marginBottom:32}}>Great moments and memorable scenes, cut short. Free to watch, no subscription needed.</p>

        {reels === null ? (
          <div style={{color:'var(--text3)',textAlign:'center',padding:60}}>Loading…</div>
        ) : reels.length === 0 ? (
          <div style={{color:'var(--text3)',textAlign:'center',padding:60}}>No reels yet — check back soon.</div>
        ) : (
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))',gap:16}}>
            {reels.map(r=>(
              <div key={r.id} className="reel-card" onClick={()=>openReel(r)}>
                <div style={{aspectRatio:'9/16',background:r.movies?.thumbnail_url?`url(${r.movies.thumbnail_url}) center/cover`:'linear-gradient(160deg,#1a0f00,#2a1800)',display:'flex',alignItems:'center',justifyContent:'center',position:'relative'}}>
                  <div style={{width:44,height:44,borderRadius:'50%',background:'rgba(0,0,0,0.6)',display:'flex',alignItems:'center',justifyContent:'center',border:'2px solid var(--gold)'}}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="#c8a84b"><path d="M8 5v14l11-7z"/></svg>
                  </div>
                  {r.duration_seconds && (
                    <span style={{position:'absolute',bottom:8,right:8,background:'rgba(0,0,0,0.75)',color:'#fff',fontSize:11,padding:'2px 6px',borderRadius:4}}>
                      {Math.floor(r.duration_seconds/60)}:{String(r.duration_seconds%60).padStart(2,'0')}
                    </span>
                  )}
                </div>
                <div style={{padding:'10px 12px'}}>
                  <div style={{fontSize:13,fontWeight:600,marginBottom:2}}>{r.title}</div>
                  <div style={{fontSize:11,color:'var(--text3)'}}>From {r.movies?.title || 'Unknown'}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {playing && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.92)',zIndex:300,display:'flex',alignItems:'center',justifyContent:'center'}} onClick={()=>setPlaying(null)}>
          <button onClick={()=>setPlaying(null)} style={{position:'absolute',top:20,right:24,background:'none',border:'none',color:'#fff',fontSize:28,cursor:'pointer'}}>×</button>
          <div style={{width:'min(400px, 90vw)',aspectRatio:'9/16',background:'#000'}} onClick={e=>e.stopPropagation()}>
            {streamUrl ? (
              <iframe src={streamUrl} style={{width:'100%',height:'100%',border:'none'}} allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen title={playing.title} />
            ) : (
              <div style={{width:'100%',height:'100%',display:'flex',alignItems:'center',justifyContent:'center',color:'var(--text3)'}}>Loading…</div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
