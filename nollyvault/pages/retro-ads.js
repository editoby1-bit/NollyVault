// pages/retro-ads.js — Browse retro Nigerian commercials and old Nollywood trailers
import { useState } from 'react'
import { useRouter } from 'next/router'
import Nav from '../components/Nav'
import ToastContainer, { showToast } from '../components/Toast'

// Mock retro ads data — replace with Supabase query
const MOCK_ADS = [
  {
    id:'1', title:'Indomie Super Pack — "Mama, I Want Indomie"', brand:'Indomie', year:1995,
    ad_type:'brand_commercial', youtube_video_id:null,
    description:'The iconic Indomie noodles ad that every Nigerian 90s child remembers.',
    tags:['indomie','food','90s','kids'], duration_seconds:30,
  },
  {
    id:'2', title:'Peak Milk — "Peak of Goodness"', brand:'Peak Milk', year:1993,
    ad_type:'brand_commercial', youtube_video_id:null,
    description:'Peak Milk at the height of its classic advertising golden era.',
    tags:['peak_milk','dairy','90s'], duration_seconds:30,
  },
  {
    id:'3', title:'Cowbell Milk — Jingle', brand:'Cowbell', year:1994,
    ad_type:'brand_commercial', youtube_video_id:null,
    description:'The Cowbell milk jingle that nobody could get out of their head.',
    tags:['cowbell','dairy','jingle','90s'], duration_seconds:30,
  },
  {
    id:'4', title:'Living in Bondage — Original Cinema Trailer', brand:null, year:1992,
    ad_type:'nollywood_trailer', youtube_video_id:null,
    description:'The hype man voiceover trailer that made Nigeria rush to buy this VHS.',
    tags:['living_in_bondage','horror','nollywood','1992'], duration_seconds:90,
  },
  {
    id:'5', title:'Karishika — "She Has Come to Take Your Soul"', brand:null, year:1996,
    ad_type:'nollywood_trailer', youtube_video_id:null,
    description:'The legendary Karishika trailer with its unforgettable dramatic voiceover.',
    tags:['karishika','horror','nollywood','1996'], duration_seconds:90,
  },
  {
    id:'6', title:'Bournvita — "Raise a Champion"', brand:'Bournvita', year:1996,
    ad_type:'brand_commercial', youtube_video_id:null,
    description:'Bournvita encouraging every Nigerian parent that their child is a champion.',
    tags:['bournvita','cocoa','90s','kids'], duration_seconds:30,
  },
  {
    id:'7', title:'Nigerian Breweries — Star Lager Beer', brand:'Star Beer', year:1994,
    ad_type:'retro_tv_ad', youtube_video_id:null,
    description:'Star Lager Beer in its classic 90s advertising glory.',
    tags:['star_beer','beer','90s','adults'], duration_seconds:30,
  },
  {
    id:'8', title:'Rattlesnake — Home Video Trailer', brand:null, year:1995,
    ad_type:'nollywood_trailer', youtube_video_id:null,
    description:'The Rattlesnake trailer that promised action-packed drama. It delivered.',
    tags:['rattlesnake','crime','nollywood','1995'], duration_seconds:60,
  },
]

const CATEGORIES = [
  { id:'all', label:'All', icon:'📺' },
  { id:'brand_commercial', label:'Old TV Commercials', icon:'📡' },
  { id:'nollywood_trailer', label:'Movie Trailers', icon:'🎬' },
  { id:'retro_tv_ad', label:'Retro Adverts', icon:'📻' },
]

export default function RetroAds() {
  const router = useRouter()
  const [activeCategory, setActiveCategory] = useState('all')
  const [playingAd, setPlayingAd] = useState(null)
  const [activeProfile] = useState(() => {
    if (typeof window === 'undefined') return null
    try { return JSON.parse(sessionStorage.getItem('activeProfile') || 'null') } catch { return null }
  })

  const filtered = activeCategory === 'all'
    ? MOCK_ADS
    : MOCK_ADS.filter(a => a.ad_type === activeCategory)

  const typeLabels = {
    brand_commercial: '📡 TV Commercial',
    nollywood_trailer: '🎬 Movie Trailer',
    retro_tv_ad: '📻 Retro Advert',
    modern_brand_retro: '✨ Modern Retro',
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,700&family=DM+Sans:wght@400;500;600&display=swap');
        :root{--gold:#c8a84b;--gold-light:#e8c96e;--gold-dim:#7a6530;--bg:#080808;--bg2:#111;--bg3:#1a1a1a;--bg4:#222;--text:#f0ede6;--text2:#9a9590;--text3:#5a5550;--green:#4ace8a;--purple:#7b68ee;--red:#e84a4a;--radius:8px;--radius-lg:14px;--nav-height:64px;}
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
        body{font-family:'DM Sans',sans-serif;background:var(--bg);color:var(--text);-webkit-font-smoothing:antialiased;}
        .card{background:var(--bg2);border:1px solid var(--bg4);border-radius:var(--radius-lg);}
        .btn{display:inline-flex;align-items:center;gap:7px;padding:9px 18px;border-radius:var(--radius);font-size:13px;font-weight:600;cursor:pointer;border:none;font-family:inherit;transition:.2s;}
        .btn-gold{background:var(--gold);color:#000;} .btn-gold:hover{background:var(--gold-light);}
        .btn-ghost{background:transparent;color:var(--text2);border:1px solid var(--bg4);} .btn-ghost:hover{color:var(--text);}
        .modal-overlay{position:fixed;inset:0;z-index:800;background:rgba(0,0,0,0.92);display:flex;align-items:center;justify-content:center;padding:20px;}
        .modal-box{background:#000;border-radius:var(--radius-lg);max-width:760px;width:100%;overflow:hidden;}
        ::-webkit-scrollbar{width:4px;} ::-webkit-scrollbar-thumb{background:var(--bg4);}
        @keyframes scanlines{0%{transform:translateY(0)}100%{transform:translateY(4px)}}
      `}</style>

      <Nav activeProfile={activeProfile} onProfileClick={() => router.push('/profiles')} />

      <div style={{ paddingTop: 'var(--nav-height)', minHeight: '100vh', background: 'var(--bg)' }}>

        {/* Hero */}
        <div style={{
          background: 'linear-gradient(135deg, #0a0800, #150f00, #080808)',
          borderBottom: '1px solid var(--bg4)',
          padding: '48px 20px 44px',
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden',
        }}>
          {/* VHS scanline effect */}
          <div style={{
            position: 'absolute', inset: 0, opacity: 0.03,
            backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.5) 2px, rgba(255,255,255,0.5) 4px)',
            pointerEvents: 'none',
          }} />
          <div style={{ position: 'relative', maxWidth: 640, margin: '0 auto' }}>
            <div style={{ display:'inline-flex', alignItems:'center', gap:8, background:'rgba(200,168,75,0.1)', border:'1px solid var(--gold-dim)', borderRadius:20, padding:'4px 16px', fontSize:11, fontWeight:700, color:'var(--gold)', letterSpacing:'.09em', textTransform:'uppercase', marginBottom:20 }}>
              📺 Rewind to the Adverts
            </div>
            <h1 style={{ fontFamily:"'Playfair Display',serif", fontSize:'clamp(26px,5vw,44px)', fontWeight:900, lineHeight:1.1, marginBottom:12 }}>
              The Ads We All Remember
            </h1>
            <p style={{ fontSize:15, color:'var(--text2)', lineHeight:1.7, marginBottom:0 }}>
              Before every Nollywood film started, there were the ads. The Indomie jingles,
              the Peak Milk moments, the dramatic movie trailers with the hype man voiceover.
              They're all here — exactly as you remember them.
            </p>
          </div>
        </div>

        {/* Category filter */}
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '28px 20px 0' }}>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 28 }}>
            {CATEGORIES.map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                style={{
                  padding: '8px 18px', borderRadius: 30, border: '1px solid',
                  borderColor: activeCategory === cat.id ? 'var(--gold)' : 'var(--bg4)',
                  background: activeCategory === cat.id ? 'rgba(200,168,75,0.12)' : 'var(--bg2)',
                  color: activeCategory === cat.id ? 'var(--gold)' : 'var(--text2)',
                  fontSize: 13, fontWeight: 500, cursor: 'pointer', transition: '.2s',
                  fontFamily: 'inherit',
                }}
              >
                {cat.icon} {cat.label}
              </button>
            ))}
          </div>

          {/* Ad grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14, marginBottom: 48 }}>
            {filtered.map(ad => (
              <div
                key={ad.id}
                className="card"
                style={{ overflow: 'hidden', cursor: 'pointer', transition: 'transform .2s, border-color .2s' }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.borderColor = 'var(--gold-dim)' }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.borderColor = 'var(--bg4)' }}
                onClick={() => setPlayingAd(ad)}
              >
                {/* Thumbnail with VHS overlay */}
                <div style={{ position: 'relative', paddingBottom: '56.25%', background: 'linear-gradient(135deg, #1a0f00, #0a0a0a)' }}>
                  {ad.youtube_video_id ? (
                    <img
                      src={`https://img.youtube.com/vi/${ad.youtube_video_id}/mqdefault.jpg`}
                      alt={ad.title}
                      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.7 }}
                    />
                  ) : (
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                      <div style={{ fontSize: 36 }}>
                        {ad.ad_type === 'nollywood_trailer' ? '🎬' : '📺'}
                      </div>
                      {ad.brand && (
                        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--gold)', textTransform: 'uppercase', letterSpacing: '.08em' }}>{ad.brand}</div>
                      )}
                      <div style={{ fontSize: 10, color: 'var(--text3)' }}>{ad.year}</div>
                    </div>
                  )}
                  {/* VHS scanlines overlay */}
                  <div style={{ position: 'absolute', inset: 0, backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.15) 3px, rgba(0,0,0,0.15) 4px)', pointerEvents: 'none' }} />
                  {/* Play button */}
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.9 }}>
                      <svg viewBox="0 0 24 24" width={20} height={20} fill="#000"><path d="M8 5v14l11-7z"/></svg>
                    </div>
                  </div>
                  {/* Type badge */}
                  <div style={{ position: 'absolute', top: 8, left: 8, fontSize: 10, background: 'rgba(0,0,0,0.8)', color: 'var(--gold)', padding: '2px 8px', borderRadius: 4, fontWeight: 600 }}>
                    {typeLabels[ad.ad_type]}
                  </div>
                  {/* Duration */}
                  <div style={{ position: 'absolute', bottom: 8, right: 8, fontSize: 11, background: 'rgba(0,0,0,0.8)', color: 'var(--text2)', padding: '2px 7px', borderRadius: 4 }}>
                    {ad.duration_seconds}s
                  </div>
                </div>

                <div style={{ padding: '14px 16px' }}>
                  <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4, lineHeight: 1.3 }}>{ad.title}</div>
                  <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 8 }}>
                    {ad.brand && `${ad.brand} · `}{ad.year}
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.5 }}>{ad.description}</div>
                  {/* Tags */}
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 10 }}>
                    {ad.tags?.slice(0, 3).map(tag => (
                      <span key={tag} style={{ fontSize: 10, background: 'var(--bg3)', border: '1px solid var(--bg4)', borderRadius: 4, padding: '2px 7px', color: 'var(--text3)' }}>
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Submit an ad section */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(200,168,75,0.07), rgba(123,104,238,0.05))',
            border: '1px solid rgba(200,168,75,0.2)',
            borderRadius: 'var(--radius-lg)',
            padding: '28px',
            marginBottom: 48,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 20,
            flexWrap: 'wrap',
          }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--gold)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 8 }}>Have an old Nigerian commercial?</div>
              <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 20, fontWeight: 700, marginBottom: 6 }}>Help us restore the archive</div>
              <div style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.65 }}>
                If you have VHS recordings of old Nigerian TV ads or Nollywood movie trailers,<br/>
                we want them. Help us preserve this piece of Nigerian media history.
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flexShrink: 0 }}>
              <button className="btn btn-gold" onClick={() => showToast('Submit a commercial — send to archive@naijarewind.com', 'gold')}>
                Submit a commercial
              </button>
              <button className="btn btn-ghost" onClick={() => router.push('/advertise')}>
                Advertise on NaijaRewind
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Ad player modal */}
      {playingAd && (
        <div className="modal-overlay" onClick={() => setPlayingAd(null)}>
          <div className="modal-box" onClick={e => e.stopPropagation()} style={{ maxWidth: 760 }}>
            {/* VHS header bar */}
            <div style={{ background: '#1a0a00', padding: '10px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--bg4)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--red)', animation: 'pulse 1.5s infinite' }} />
                <span style={{ fontSize: 11, color: 'var(--gold)', fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase' }}>
                  📼 PLAY
                </span>
                <span style={{ fontSize: 11, color: 'var(--text3)', marginLeft: 8 }}>
                  {playingAd.brand || 'NaijaRewind'} · {playingAd.year}
                </span>
              </div>
              <button onClick={() => setPlayingAd(null)} style={{ background: 'transparent', border: 'none', color: 'var(--text2)', cursor: 'pointer', fontSize: 18, lineHeight: 1 }}>✕</button>
            </div>

            {/* Video area */}
            <div style={{ position: 'relative', paddingBottom: '56.25%', background: '#000' }}>
              {playingAd.youtube_video_id ? (
                <iframe
                  style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 'none' }}
                  src={`https://www.youtube.com/embed/${playingAd.youtube_video_id}?autoplay=1&rel=0&modestbranding=1`}
                  title={playingAd.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : playingAd.bunny_video_guid ? (
                <iframe
                  style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 'none' }}
                  src={`https://iframe.mediadelivery.net/embed/${process.env.NEXT_PUBLIC_BUNNY_LIBRARY_ID}/${playingAd.bunny_video_guid}?autoplay=true`}
                  title={playingAd.title}
                  allow="accelerometer; autoplay; encrypted-media; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, background: 'linear-gradient(135deg, #1a0f00, #0a0a0a)' }}>
                  <div style={{ fontSize: 48 }}>📺</div>
                  <div style={{ fontSize: 15, color: 'var(--text2)', textAlign: 'center', padding: '0 32px' }}>
                    This ad hasn't been digitized yet.
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--text3)', textAlign: 'center' }}>
                    Upload the video file in Admin → Upload, or add a YouTube video ID.
                  </div>
                </div>
              )}
            </div>

            {/* Info bar */}
            <div style={{ padding: '14px 16px', background: 'var(--bg2)' }}>
              <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>{playingAd.title}</div>
              <div style={{ fontSize: 13, color: 'var(--text2)' }}>{playingAd.description}</div>
            </div>
          </div>
        </div>
      )}

      <ToastContainer />
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}`}</style>
    </>
  )
}
