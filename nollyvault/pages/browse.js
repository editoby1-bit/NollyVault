import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { useSession, useSupabaseClient } from './_app'
import Nav from '../components/Nav'
import MovieCard from '../components/MovieCard'
import MovieModal from '../components/MovieModal'
import ToastContainer, { showToast } from '../components/Toast'
import { useMovies } from '../hooks/useMovies'

const SECTIONS = [
  { id:'trending',  label:'Trending This Week',      filter:m=>m.trending },
  { id:'horror',   label:'Classic Horror & Occult',  filter:m=>m.category==='Classic Horror & Occult' },
  { id:'village',  label:'Village Drama Collection', filter:m=>m.category==='Village Drama' },
  { id:'crime',    label:'Crime & Thriller',         filter:m=>m.category==='Crime & Thriller' },
  { id:'family',   label:'Family Favorites',         filter:m=>m.category==='Family Favorites' },
  { id:'rewatch',  label:'Most Rewatched',           filter:m=>m.rewatched },
  { id:'party',    label:'Watch Party Picks',        filter:m=>m.trending||m.rewatched },
  { id:'date',     label:'Date Night Collection',    filter:m=>['Family Favorites','Village Drama'].includes(m.category) },
]

const ACTORS = ['Pete Edochie','Kanayo O. Kanayo','Genevieve Nnaji','Ramsey Nouah','Ngozi Ezeonu','Patience Ozokwor','Liz Benson','Kate Henshaw','Eucharia Anunobi','Kenneth Okonkwo']

export default function Browse() {
  const session = useSession()
  const supabase = useSupabaseClient()
  const router = useRouter()
  const { movies } = useMovies()
  const [activeProfile, setActiveProfile] = useState(null)
  const [selectedMovie, setSelectedMovie] = useState(null)
  const [watchlist, setWatchlist] = useState([])
  const [continueWatching, setContinueWatching] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [userPlan, setUserPlan] = useState(null)

  useEffect(() => {
    const p = sessionStorage.getItem('activeProfile')
    if (p) {
      setActiveProfile(JSON.parse(p))
      return
    }
    // No profile in session — try to load from Supabase or use demo
    if (supabase && session) {
      supabase.from('profiles').select('*').eq('user_id', session.user.id).limit(1).single()
        .then(({ data }) => {
          if (data) {
            sessionStorage.setItem('activeProfile', JSON.stringify(data))
            setActiveProfile(data)
          } else {
            // Auto-create from session metadata
            const name = session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'Guest'
            const profile = { id: session.user.id, name, avatar_initials: name[0].toUpperCase(), avatar_color: '#c8a84b' }
            sessionStorage.setItem('activeProfile', JSON.stringify(profile))
            setActiveProfile(profile)
          }
        })
    } else {
      // Demo mode
      const demo = { id: 'demo', name: 'Guest', avatar_initials: 'G', avatar_color: '#c8a84b' }
      setActiveProfile(demo)
    }
  }, [session, supabase])

  useEffect(() => {
    if (!session || !supabase) return
    supabase.from('users').select('plan,plan_status').eq('id',session.user.id).single().then(({data})=>setUserPlan(data))
  }, [session, supabase])

  useEffect(() => {
    if (activeProfile && supabase) {
      supabase.from('watchlists').select('movie_id').eq('profile_id',activeProfile.id).then(({data})=>setWatchlist((data||[]).map(r=>r.movie_id)))
    }
  }, [activeProfile, supabase])

  const [progressMap, setProgressMap] = useState({}) // movieId -> { pct, seconds }

  useEffect(() => {
    if (!activeProfile?.id) return
    fetch(`/api/progress?profileId=${activeProfile.id}`)
      .then(r => r.ok ? r.json() : { continueWatching: [] })
      .then(({ continueWatching: cw }) => {
        const list = (cw || [])
          .filter(row => row.movies) // guard against orphaned rows
          .map(row => ({ ...row.movies, _progressSeconds: row.progress_seconds }))
        setContinueWatching(list)

        const map = {}
        for (const row of cw || []) {
          if (!row.movies?.id) continue
          const duration = row.movies.duration_seconds
          const pct = duration ? Math.min(100, Math.round((row.progress_seconds / duration) * 100)) : null
          map[row.movies.id] = pct
        }
        setProgressMap(map)
      })
      .catch(() => { setContinueWatching([]); setProgressMap({}) })
  }, [activeProfile])

  const handleWatchlist = async (movie, add) => {
    if (!activeProfile || !supabase) return
    if (add) {
      await supabase.from('watchlists').insert({ profile_id:activeProfile.id, movie_id:movie.id })
      setWatchlist(w=>[...w,movie.id]); showToast('Added to watchlist ✓','gold')
    } else {
      await supabase.from('watchlists').delete().eq('profile_id',activeProfile.id).eq('movie_id',movie.id)
      setWatchlist(w=>w.filter(id=>id!==movie.id)); showToast('Removed from watchlist')
    }
  }

  const featuredMovie = movies.find(m=>m.is_featured)||movies[0]
  const q = searchQuery.toLowerCase()
  const searchResults = q.length>1 ? movies.filter(m=>m.title.toLowerCase().includes(q)||m.category?.toLowerCase().includes(q)||m.producer?.toLowerCase().includes(q)||m.actors?.some?.(a=>a.toLowerCase().includes(q))) : []
  const showSearch = searchQuery.length > 1

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@400;500;600&display=swap');
        :root{--gold:#c8a84b;--gold-light:#e8c96e;--gold-dim:#7a6530;--bg:#080808;--bg2:#111;--bg3:#1a1a1a;--bg4:#222;--text:#f0ede6;--text2:#9a9590;--text3:#5a5550;--green:#4ace8a;--purple:#7b68ee;--red:#e84a4a;--radius:8px;--radius-lg:14px;--nav-height:64px;}
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
        body{font-family:'DM Sans',sans-serif;background:var(--bg);color:var(--text);-webkit-font-smoothing:antialiased;overflow-x:hidden;}
        a{color:inherit;text-decoration:none;}
        .btn{display:inline-flex;align-items:center;gap:7px;padding:10px 20px;border-radius:var(--radius);font-size:14px;font-weight:600;cursor:pointer;border:none;transition:.2s;font-family:'DM Sans',sans-serif;}
        .btn-gold{background:var(--gold);color:#000;} .btn-gold:hover{background:var(--gold-light);}
        .btn-outline{background:rgba(255,255,255,.07);color:var(--text);border:1px solid rgba(255,255,255,.14);} .btn-outline:hover{background:rgba(255,255,255,.13);}
        .btn-ghost{background:transparent;color:var(--text2);border:1px solid var(--bg4);} .btn-ghost:hover{color:var(--text);}
        .btn-lg{padding:13px 28px;font-size:15px;}
        .h-scroll{display:flex;gap:12px;overflow-x:auto;padding-bottom:6px;scroll-snap-type:x mandatory;}
        .h-scroll::-webkit-scrollbar{height:3px;}
        .h-scroll::-webkit-scrollbar-thumb{background:var(--bg4);border-radius:2px;}
        .h-scroll>*{scroll-snap-align:start;}
        .movie-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(148px,1fr));gap:14px;}
        .badge-gold{display:inline-flex;align-items:center;gap:5px;padding:3px 9px;border-radius:20px;font-size:11px;font-weight:600;letter-spacing:.05em;text-transform:uppercase;background:rgba(200,168,75,0.15);border:1px solid var(--gold-dim);color:var(--gold);}
        .badge-purple{display:inline-flex;align-items:center;gap:5px;padding:3px 9px;border-radius:20px;font-size:11px;font-weight:600;letter-spacing:.05em;text-transform:uppercase;background:rgba(123,104,238,0.15);border:1px solid rgba(123,104,238,0.35);color:var(--purple);}
        .live-dot{width:7px;height:7px;border-radius:50%;background:var(--red);animation:pulse 1.5s infinite;}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
        ::-webkit-scrollbar{width:4px;height:4px;}
        ::-webkit-scrollbar-thumb{background:var(--bg4);border-radius:2px;}
      `}</style>

      <Nav activeProfile={activeProfile} onProfileClick={()=>router.push('/profiles')} onSearch={setSearchQuery} />

      {/* SEARCH */}
      {showSearch && (
        <div style={{paddingTop:'var(--nav-height)',minHeight:'100vh'}}>
          <div style={{maxWidth:1100,margin:'0 auto',padding:'32px 20px 60px'}}>
            <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:22,marginBottom:20}}>Results for "{searchQuery}"</h2>
            {searchResults.length===0
              ? <p style={{color:'var(--text2)'}}>No movies found. Try a different search.</p>
              : <div className="movie-grid">{searchResults.map(m=><MovieCard key={m.id} movie={m} onClick={setSelectedMovie} progressPct={progressMap[m.id] ?? null}/>)}</div>
            }
          </div>
        </div>
      )}

      {/* HOME */}
      {!showSearch && <>
        {/* HERO */}
        {featuredMovie && (
          <div style={{position:'relative',height:540,background:'linear-gradient(135deg,#0a0500 0%,#1a0a00 50%,#050a00 100%)',display:'flex',alignItems:'flex-end',padding:'0 40px 56px',overflow:'hidden'}}>
            <div style={{position:'absolute',inset:0,background:'radial-gradient(ellipse at 70% 40%,rgba(200,168,75,0.13) 0%,transparent 60%)'}}/>
            <div style={{position:'absolute',right:80,top:40,bottom:0,width:220,borderRadius:'12px 12px 0 0',overflow:'hidden',boxShadow:'-20px 0 60px rgba(0,0,0,0.8)'}}>
              {featuredMovie.thumbnail_url ? (
                <img src={featuredMovie.thumbnail_url} alt={featuredMovie.title} style={{width:'100%',height:'100%',objectFit:'cover',opacity:.85}}/>
              ) : (
                // Fallback for movies without uploaded poster art yet — a
                // designed vintage-reel treatment, not a scraped image.
                // Real poster art is typically its own separate copyright
                // from the film itself, so this stays generic until genuine
                // licensed artwork is uploaded per-movie.
                <div style={{width:'100%',height:'100%',background:'linear-gradient(160deg,#1a0f00 0%,#2a1800 45%,#0d0800 100%)',position:'relative',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:20}}>
                  <div style={{position:'absolute',inset:0,opacity:.25,backgroundImage:'repeating-linear-gradient(0deg,transparent,transparent 3px,rgba(200,168,75,0.15) 3px,rgba(200,168,75,0.15) 4px)'}}/>
                  <svg width="64" height="64" viewBox="0 0 64 64" style={{opacity:.5,marginBottom:16}}>
                    <circle cx="32" cy="32" r="28" fill="none" stroke="#c8a84b" strokeWidth="2"/>
                    <circle cx="32" cy="32" r="8" fill="none" stroke="#c8a84b" strokeWidth="2"/>
                    {[0,60,120,180,240,300].map(deg=>(
                      <circle key={deg} cx={32+18*Math.cos(deg*Math.PI/180)} cy={32+18*Math.sin(deg*Math.PI/180)} r="5" fill="none" stroke="#c8a84b" strokeWidth="1.5"/>
                    ))}
                  </svg>
                  <div style={{fontFamily:"'Playfair Display',serif",fontSize:15,fontWeight:700,color:'var(--gold)',textAlign:'center',lineHeight:1.3,position:'relative'}}>
                    {featuredMovie.title}
                  </div>
                  <div style={{fontSize:10,color:'var(--text3)',marginTop:8,textTransform:'uppercase',letterSpacing:'.1em',position:'relative'}}>{featuredMovie.year}</div>
                </div>
              )}
            </div>
            <div style={{position:'relative',maxWidth:560}}>
              <span className="badge-gold" style={{marginBottom:14}}>⭐ Featured Classic</span>
              <h1 style={{fontFamily:"'Playfair Display',serif",fontSize:46,fontWeight:900,lineHeight:1.08,marginBottom:12}}>{featuredMovie.title}</h1>
              <div style={{display:'flex',gap:14,alignItems:'center',marginBottom:14,fontSize:13,color:'var(--text2)',flexWrap:'wrap'}}>
                <span style={{color:'var(--gold)',fontWeight:600}}>{featuredMovie.year}</span>
                {featuredMovie.duration&&<span>{featuredMovie.duration}</span>}
                <span>{featuredMovie.category}</span>
                {featuredMovie.rating&&<span style={{color:'var(--gold)'}}>★ {featuredMovie.rating}</span>}
              </div>
              <p style={{fontSize:14,color:'var(--text2)',lineHeight:1.65,marginBottom:24,maxWidth:460}}>{featuredMovie.description}</p>
              <div style={{display:'flex',gap:10}}>
                <button className="btn btn-gold btn-lg" onClick={()=>router.push(`/watch/${featuredMovie.id}`)}>▶ Play Now</button>
                <button className="btn btn-outline btn-lg" onClick={()=>setSelectedMovie(featuredMovie)}>ⓘ More Info</button>
                <button className="btn btn-ghost btn-lg" onClick={()=>handleWatchlist(featuredMovie,!watchlist.includes(featuredMovie.id))}>
                  {watchlist.includes(featuredMovie.id)?'✓':'+'}</button>
              </div>
            </div>
          </div>
        )}

        {/* CONTENT */}
        <div style={{padding:'0 20px 80px',maxWidth:1140,margin:'0 auto'}}>
          {/* Watch party banner */}
          <div style={{margin:'28px 0 0',background:'linear-gradient(135deg,rgba(123,104,238,0.12),rgba(200,168,75,0.08))',border:'1px solid rgba(123,104,238,0.28)',borderRadius:'var(--radius-lg)',padding:'16px 20px',display:'flex',alignItems:'center',justifyContent:'space-between',gap:16,flexWrap:'wrap'}}>
            <div>
              <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:6}}>
                <div className="live-dot"/>
                <span className="badge-purple">Watch Party Live</span>
              </div>
              <div style={{fontWeight:600,fontSize:15}}>Horror Night 🔥 — Karishika</div>
              <div style={{fontSize:13,color:'var(--text2)',marginTop:3}}>Hosted by Chidi_Lagos · 12 watching now</div>
            </div>
            <button className="btn btn-outline" style={{borderColor:'rgba(123,104,238,0.4)',flexShrink:0}} onClick={()=>userPlan?.plan==='family'?router.push('/watch-party'):showToast('Watch Parties need the Family & Friends plan','gold')}>Join Party</button>
          </div>

          {/* Continue watching */}
          {continueWatching.length>0 && <Section title="Continue Watching">{continueWatching.map((m)=><MovieCard key={m.id} movie={m} onClick={setSelectedMovie} progressPct={progressMap[m.id] ?? null}/>)}</Section>}

          {/* Dynamic sections */}
          {SECTIONS.map(sec=>{
            const films=movies.filter(sec.filter)
            if(!films.length) return null
            return <Section key={sec.id} title={sec.label}>{films.map(m=><MovieCard key={m.id} movie={m} onClick={setSelectedMovie} progressPct={progressMap[m.id] ?? null}/>)}</Section>
          })}

          {/* Legendary Stars */}
          <div style={{marginTop:36}}>
            <div style={{fontFamily:"'Playfair Display',serif",fontSize:20,fontWeight:700,marginBottom:14,paddingLeft:4}}>Legendary Stars</div>
            <div className="h-scroll">
              {ACTORS.map(actor=>(
                <div key={actor} onClick={()=>setSearchQuery(actor)} style={{background:'var(--bg2)',border:'1px solid var(--bg4)',borderRadius:30,padding:'8px 18px',fontSize:13,cursor:'pointer',color:'var(--text2)',whiteSpace:'nowrap',transition:'border-color .2s,color .2s'}}
                  onMouseEnter={e=>{e.currentTarget.style.borderColor='var(--gold-dim)';e.currentTarget.style.color='var(--gold)'}}
                  onMouseLeave={e=>{e.currentTarget.style.borderColor='var(--bg4)';e.currentTarget.style.color='var(--text2)'}}>
                  {actor}
                </div>
              ))}
            </div>
          </div>


          {/* Retro Ads teaser */}
          <div style={{marginTop:36,background:'linear-gradient(135deg,rgba(200,168,75,0.06),rgba(10,8,0,0))',border:'1px solid var(--bg4)',borderRadius:'var(--radius-lg)',padding:'22px 24px',display:'flex',alignItems:'center',justifyContent:'space-between',gap:16,flexWrap:'wrap'}}
            onMouseEnter={e=>e.currentTarget.style.borderColor='var(--gold-dim)'}
            onMouseLeave={e=>e.currentTarget.style.borderColor='var(--bg4)'}>
            <div>
              <div style={{fontSize:11,fontWeight:700,color:'var(--gold)',textTransform:'uppercase',letterSpacing:'.08em',marginBottom:8}}>📺 Retro Ads Archive</div>
              <div style={{fontFamily:"'Playfair Display',serif",fontSize:18,fontWeight:700,marginBottom:4}}>Before the Movie Started...</div>
              <div style={{fontSize:13,color:'var(--text2)'}}>Indomie. Peak Milk. Cowbell. The movie trailers with the hype man. They're all here.</div>
            </div>
            <button className="btn btn-ghost" onClick={()=>router.push('/retro-ads')} style={{flexShrink:0}}>
              Browse Retro Ads →
            </button>
          </div>

          {/* Upgrade banner */}
          {(!userPlan||userPlan.plan!=='family')&&(
            <div style={{marginTop:40,background:'linear-gradient(135deg,rgba(200,168,75,0.09),rgba(123,104,238,0.06))',border:'1px solid rgba(200,168,75,0.2)',borderRadius:'var(--radius-lg)',padding:'24px 28px',display:'flex',alignItems:'center',justifyContent:'space-between',gap:16,flexWrap:'wrap'}}>
              <div>
                <span className="badge-gold" style={{marginBottom:8,display:'inline-flex'}}>Family & Friends Plan</span>
                <div style={{fontFamily:"'Playfair Display',serif",fontSize:20,fontWeight:700,marginTop:4}}>Watch Together — Anywhere in the World</div>
                <div style={{fontSize:13,color:'var(--text2)',marginTop:5}}>Host Watch Parties, Date Night mode · ₦5,000/mo</div>
              </div>
              <button className="btn btn-gold" onClick={()=>router.push('/pricing')}>View All Plans</button>
            </div>
          )}
        </div>
      </>}

      {selectedMovie&&<MovieModal movie={selectedMovie} onClose={()=>setSelectedMovie(null)} onPlay={m=>router.push(`/watch/${m.id}`)} watchlisted={watchlist.includes(selectedMovie.id)} onWatchlist={handleWatchlist} canWatchParty={userPlan?.plan==='family'}/>}
      <ToastContainer/>
    </>
  )
}

function Section({title,children}) {
  return (
    <div style={{marginTop:36}}>
      <div style={{fontFamily:"'Playfair Display',serif",fontSize:20,fontWeight:700,marginBottom:14,paddingLeft:4}}>{title}</div>
      <div className="h-scroll">{children}</div>
    </div>
  )
}
