// pages/retro.js — Retro Ads & Movie Trailers browse section
import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Nav from '../components/Nav'
import ToastContainer, { showToast } from '../components/Toast'

const CATEGORIES = [
  { id: 'all',            label: 'Everything',       icon: '📺' },
  { id: 'commercial',     label: 'Old Commercials',  icon: '📡' },
  { id: 'movie_trailer',  label: 'Movie Trailers',   icon: '🎬' },
  { id: 'jingle',         label: 'Jingles',          icon: '🎵' },
  { id: 'programme_intro',label: 'TV Intros',        icon: '📻' },
]

// Mock data — replaced by real API data once retro_content table is populated
const MOCK_RETRO = [
  { id:'1', title:'Peak Milk — The Family Milk', type:'commercial', brand:'Peak Milk', year:1994, youtube_video_id:null, description:'The iconic "Peak Milk, the family milk" jingle that every Nigerian remembers.' },
  { id:'2', title:'Indomie — De Original', type:'commercial', brand:'Indomie', year:1995, youtube_video_id:null, description:'"Indomie, de original!" — one of the most recognisable jingles in Nigerian TV history.' },
  { id:'3', title:'Bournvita — Wisdom of a Mother', type:'commercial', brand:'Bournvita', year:1993, youtube_video_id:null, description:'Classic Bournvita chocolate drink advert with a mother preparing her child for school.' },
  { id:'4', title:'Guinness — Made of Black', type:'commercial', brand:'Guinness', year:1996, youtube_video_id:null, description:'The cinematic Guinness Nigeria advert that felt like a short film.' },
  { id:'5', title:'Living in Bondage — Original Trailer', type:'movie_trailer', brand:null, year:1992, youtube_video_id:null, description:'The original VHS trailer with the now-legendary fast-paced voiceover: "A film that will shake your conscience!"' },
  { id:'6', title:'Karishika — She Has Come', type:'movie_trailer', brand:null, year:1996, youtube_video_id:null, description:'Dramatic movie reel with thunderous voiceover announcing the demon queen.' },
  { id:'7', title:'Cowbell — Protein Milk', type:'commercial', brand:'Cowbell', year:1997, youtube_video_id:null, description:'Cowbell protein milk — the challenger to Peak that every kid debated.' },
  { id:'8', title:'Glamour Girls — Coming to Your Screen', type:'movie_trailer', brand:null, year:1994, youtube_video_id:null, description:'The original Glamour Girls movie advertisement reel.' },
]

export default function RetroAds() {
  const router = useRouter()
  const [activeType, setActiveType] = useState('all')
  const [items, setItems] = useState(MOCK_RETRO)
  const [playing, setPlaying] = useState(null)
  const [activeProfile] = useState(() => {
    if (typeof window === 'undefined') return null
    try { return JSON.parse(sessionStorage.getItem('activeProfile') || 'null') } catch { return null }
  })

  useEffect(() => {
    fetch(`/api/ads/retro?type=${activeType}`)
      .then(r => r.json())
      .then(d => { if (d.items?.length) setItems(d.items) })
      .catch(() => {})
  }, [activeType])

  const filtered = activeType === 'all' ? items : items.filter(i => i.type === activeType)

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@400;500;600&display=swap');
        :root{--gold:#c8a84b;--gold-light:#e8c96e;--gold-dim:#7a6530;--bg:#080808;--bg2:#111;--bg3:#1a1a1a;--bg4:#222;--text:#f0ede6;--text2:#9a9590;--text3:#5a5550;--green:#4ace8a;--radius:8px;--radius-lg:14px;--nav-height:64px;}
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
        body{font-family:'DM Sans',sans-serif;background:var(--bg);color:var(--text);-webkit-font-smoothing:antialiased;}
        .card{background:var(--bg2);border:1px solid var(--bg4);border-radius:var(--radius-lg);}
        .btn{display:inline-flex;align-items:center;gap:7px;padding:8px 16px;border-radius:var(--radius);font-size:13px;font-weight:600;cursor:pointer;border:none;transition:.2s;font-family:inherit;}
        .btn-gold{background:var(--gold);color:#000;} .btn-gold:hover{background:var(--gold-light);}
        .btn-ghost{background:transparent;color:var(--text2);border:1px solid var(--bg4);} .btn-ghost:hover{color:var(--text);}
        .modal-overlay{position:fixed;inset:0;z-index:800;background:rgba(0,0,0,0.92);display:flex;align-items:center;justify-content:center;padding:20px;}
        .modal-box{background:#000;border:1px solid var(--bg4);border-radius:var(--radius-lg);max-width:700px;width:100%;}
        ::-webkit-scrollbar{width:4px;} ::-webkit-scrollbar-thumb{background:var(--bg4);border-radius:2px;}
        @keyframes scanline{0%{transform:translateY(-100%);}100%{transform:translateY(100vh);}}
      `}</style>

      <Nav activeProfile={activeProfile} onProfileClick={() => router.push('/profiles')} />

      <div style={{ paddingTop: 'var(--nav-height)', minHeight: '100vh', background: 'var(--bg)' }}>

        {/* Hero */}
        <div style={{
          background: 'linear-gradient(135deg, #0a0800, #1a0f00)',
          borderBottom: '1px solid var(--bg4)',
          padding: '48px 20px 44px', textAlign: 'center', position: 'relative', overflow: 'hidden',
        }}>
          {/* VHS scanline effect */}
          <div style={{ position:'absolute', inset:0, background:'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.05) 2px, rgba(0,0,0,0.05) 4px)', pointerEvents:'none' }}/>
          <div style={{ position:'relative' }}>
            <div style={{ display:'inline-flex', alignItems:'center', gap:8, background:'rgba(200,168,75,0.1)', border:'1px solid var(--gold-dim)', borderRadius:20, padding:'4px 16px', fontSize:11, fontWeight:700, color:'var(--gold)', letterSpacing:'.09em', textTransform:'uppercase', marginBottom:20 }}>
              📺 Retro Archive
            </div>
            <h1 style={{ fontFamily:"'Playfair Display',serif", fontSize:'clamp(26px,5vw,48px)', fontWeight:900, lineHeight:1.1, marginBottom:14 }}>
              Old Commercials.<br/>Classic Trailers.<br/><span style={{ color:'var(--gold)', fontStyle:'italic' }}>Pure Nostalgia.</span>
            </h1>
            <p style={{ fontSize:15, color:'var(--text2)', lineHeight:1.7, maxWidth:520, margin:'0 auto' }}>
              Back then, every movie started with a string of ads and trailers. That hype was part of the experience. 
              Relive it here — every old jingle, every dramatic voiceover, every "COMING SOON TO YOUR SCREEN."
            </p>
          </div>
        </div>

        <div style={{ maxWidth:1100, margin:'0 auto', padding:'36px 20px 80px' }}>

          {/* Category filter */}
          <div style={{ display:'flex', gap:10, flexWrap:'wrap', marginBottom:32 }}>
            {CATEGORIES.map(cat => (
              <button key={cat.id}
                onClick={() => setActiveType(cat.id)}
                style={{
                  padding:'8px 18px', borderRadius:30, fontSize:13, fontWeight:500, cursor:'pointer',
                  border:'1px solid', transition:'.2s',
                  borderColor: activeType===cat.id ? 'var(--gold)' : 'var(--bg4)',
                  background: activeType===cat.id ? 'rgba(200,168,75,0.1)' : 'var(--bg2)',
                  color: activeType===cat.id ? 'var(--gold)' : 'var(--text2)',
                  fontFamily:'inherit',
                }}
              >
                {cat.icon} {cat.label}
              </button>
            ))}
          </div>

          {/* Grid */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:16 }}>
            {filtered.map(item => (
              <div key={item.id} className="card" style={{ overflow:'hidden', cursor:'pointer', transition:'transform .2s, border-color .2s' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor='var(--gold-dim)'; e.currentTarget.style.transform='translateY(-3px)' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor='var(--bg4)'; e.currentTarget.style.transform='none' }}
                onClick={() => setPlaying(item)}>

                {/* Thumbnail / video preview */}
                <div style={{ position:'relative', paddingBottom:'56.25%', background:'linear-gradient(135deg,#1a0f00,#0a0a1a)' }}>
                  {item.youtube_video_id ? (
                    <img
                      src={`https://img.youtube.com/vi/${item.youtube_video_id}/mqdefault.jpg`}
                      alt={item.title}
                      style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover', opacity:.8 }}
                    />
                  ) : (
                    <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:8 }}>
                      <div style={{ fontSize:40 }}>{item.type === 'commercial' ? '📡' : '🎬'}</div>
                      <div style={{ fontSize:11, color:'var(--text3)', textAlign:'center', padding:'0 16px' }}>
                        {item.year} · {item.brand || 'Classic Nollywood'}
                      </div>
                    </div>
                  )}
                  {/* Play button */}
                  <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', opacity:0, transition:'opacity .2s' }}
                    onMouseEnter={e => e.currentTarget.style.opacity='1'}
                    onMouseLeave={e => e.currentTarget.style.opacity='0'}>
                    <div style={{ width:52, height:52, borderRadius:'50%', background:'var(--gold)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                      <svg viewBox="0 0 24 24" width={22} height={22} fill="#000"><path d="M8 5v14l11-7z"/></svg>
                    </div>
                  </div>
                  {/* Type badge */}
                  <div style={{ position:'absolute', top:8, left:8, fontSize:10, fontWeight:700, padding:'2px 8px', borderRadius:4, textTransform:'uppercase', letterSpacing:'.06em', background: item.type==='commercial'?'rgba(200,168,75,0.9)':'rgba(123,104,238,0.9)', color:'#fff' }}>
                    {item.type === 'commercial' ? 'Commercial' : 'Movie Reel'}
                  </div>
                </div>

                {/* Info */}
                <div style={{ padding:'14px 16px' }}>
                  <div style={{ fontWeight:600, fontSize:14, marginBottom:3, lineHeight:1.3 }}>{item.title}</div>
                  <div style={{ fontSize:11, color:'var(--text3)', marginBottom:8 }}>
                    {item.year}{item.brand ? ` · ${item.brand}` : ''}
                  </div>
                  <div style={{ fontSize:12, color:'var(--text2)', lineHeight:1.55 }}>{item.description}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Submit content CTA */}
          <div style={{ marginTop:48, background:'rgba(200,168,75,0.06)', border:'1px solid rgba(200,168,75,0.2)', borderRadius:'var(--radius-lg)', padding:'24px', textAlign:'center' }}>
            <div style={{ fontFamily:"'Playfair Display',serif", fontSize:20, fontWeight:700, marginBottom:8 }}>
              Do you have an old Nigerian commercial or movie reel?
            </div>
            <p style={{ fontSize:14, color:'var(--text2)', marginBottom:20, maxWidth:480, margin:'0 auto 20px' }}>
              We're building the most complete archive of classic Nigerian TV advertising. 
              Share what you have — VHS transfers, recordings, anything.
            </p>
            <a href="mailto:archive@naijarewind.com">
              <button className="btn btn-gold">Submit to the Archive</button>
            </a>
          </div>
        </div>
      </div>

      {/* Video Player Modal */}
      {playing && (
        <div className="modal-overlay" onClick={() => setPlaying(null)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 18px', borderBottom:'1px solid var(--bg4)' }}>
              <div>
                <div style={{ fontWeight:600, fontSize:15 }}>{playing.title}</div>
                <div style={{ fontSize:12, color:'var(--text3)', marginTop:2 }}>{playing.year}{playing.brand ? ` · ${playing.brand}` : ''}</div>
              </div>
              <button onClick={() => setPlaying(null)} style={{ background:'transparent', border:'none', color:'var(--text2)', cursor:'pointer', fontSize:20, padding:4 }}>✕</button>
            </div>
            <div style={{ position:'relative', paddingBottom:'56.25%', background:'#000' }}>
              {playing.youtube_video_id ? (
                <iframe
                  style={{ position:'absolute', inset:0, width:'100%', height:'100%', border:'none' }}
                  src={`https://www.youtube.com/embed/${playing.youtube_video_id}?autoplay=1&rel=0&modestbranding=1`}
                  title={playing.title}
                  allow="autoplay; encrypted-media; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:14, background:'linear-gradient(135deg,#1a0f00,#0a0a1a)' }}>
                  <div style={{ fontSize:60 }}>{playing.type === 'commercial' ? '📡' : '🎬'}</div>
                  <div style={{ fontSize:14, color:'var(--text2)', textAlign:'center', maxWidth:320, lineHeight:1.6 }}>
                    <strong style={{ color:'var(--gold)' }}>{playing.title}</strong><br/>
                    Video coming soon — we're sourcing the original footage.<br/>
                    <span style={{ fontSize:12, color:'var(--text3)', marginTop:8, display:'block' }}>
                      Have this video? <a href="mailto:archive@naijarewind.com" style={{ color:'var(--gold)' }}>Send it to us →</a>
                    </span>
                  </div>
                </div>
              )}
            </div>
            <div style={{ padding:'12px 18px' }}>
              <div style={{ fontSize:13, color:'var(--text2)', lineHeight:1.6 }}>{playing.description}</div>
            </div>
          </div>
        </div>
      )}

      <ToastContainer />
    </>
  )
}
