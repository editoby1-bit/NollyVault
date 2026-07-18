// pages/admin/index.js
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/router'
import { useSession, useSupabaseClient } from '../_app'
import Link from 'next/link'

// STATS used to be entirely hardcoded fake numbers (1,247 subscribers,
// ₦3.2M revenue) that never updated no matter what was actually happening.
// Subscriber count and movies licensed now pull real data. Revenue, watch
// hours, and pool distributions need dedicated aggregation logic this
// codebase doesn't have yet — showing "Not yet tracked" for those instead
// of a fake number is safer than a founder mistaking placeholder data for
// real business metrics.
function buildStats(subscriberCount, activeMovieCount, veteranCount, totalWatchHours) {
  return [
    { label:'Total Subscribers', value: subscriberCount===null?'…':subscriberCount.toLocaleString(), sub:'Active paid subscriptions', color:'var(--gold)' },
    { label:'Monthly Revenue', value:'—', sub:'Not yet tracked', color:'var(--green)' },
    { label:'Watch Hours', value: totalWatchHours!==null ? totalWatchHours.toLocaleString() : '…', sub:'All-time, across all movies', color:'var(--purple)' },
    { label:'Movies Licensed', value: String(activeMovieCount), sub:'Currently active', color:'var(--gold)' },
    { label:'Producer Pool (30%)', value:'—', sub:'Not yet tracked', color:'#e8774a' },
    { label:'Legacy Fund (10%)', value:'—', sub:'Not yet tracked', color:'var(--green)' },
    { label:'Active Watch Parties', value:'—', sub:'Not yet tracked', color:'var(--purple)' },
    { label:'Veteran Actors Registered', value: veteranCount===null?'…':String(veteranCount), sub: veteranCount ? `${veteranCount} registered` : '0 registered', color:'var(--gold)' },
  ]
}

// (mock movie fallback removed — admin panel now always fetches real data
// via /api/admin/movies/list, which sees every movie regardless of
// active/hidden status, unlike the public RLS-restricted query used before)


const TABS = ['overview','movies','upload','reels','royalties','legacy fund','veterans','referrals','ads & sponsors','logs']

export default function AdminDashboard() {
  const session = useSession()
  const supabase = useSupabaseClient()
  const router = useRouter()
  const [movies, setMovies] = useState(null)
  const [subscriberCount, setSubscriberCount] = useState(null)
  const [veteranActors, setVeteranActors] = useState(null)
  const [showAddActor, setShowAddActor] = useState(false)
  const [addingActor, setAddingActor] = useState(false)
  const [editingActor, setEditingActor] = useState(null)
  const [movieSearch, setMovieSearch] = useState('')
  const [movieMinutes, setMovieMinutes] = useState({})
  const [referralCodes, setReferralCodes] = useState(null)
  const [referralEarnings, setReferralEarnings] = useState(null)
  const [sponsors, setSponsors] = useState(null)
  const [logs, setLogs] = useState(null)
  const [reels, setReels] = useState(null)
  const [uploadingReel, setUploadingReel] = useState(false)
  const [reelProgress, setReelProgress] = useState(0)
  const [deletingMovie, setDeletingMovie] = useState(null)
  const [editingMovie, setEditingMovie] = useState(null)
  const [savingMovie, setSavingMovie] = useState(false)
  const [outreachActor, setOutreachActor] = useState(null)
  const outreachTextRef = useRef(null)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [tab, setTab] = useState('overview')
  const [toast, setToast] = useState(null)

  // Access gate. In demo mode (no Supabase env vars set yet) there's no real
  // auth to check against, so the dashboard stays open for local preview —
  // exactly how it's worked so far. Once Supabase is connected, this page
  // re-validates against the server (same ADMIN_EMAILS check the admin API
  // routes already use) and bounces anyone who isn't an admin, instead of
  // relying on the nav link simply being hidden.
  const [access, setAccess] = useState(supabase ? 'checking' : 'open')

  useEffect(() => {
    if (!supabase) { setAccess('open'); return }
    if (!session) { setAccess('denied'); return }
    let cancelled = false
    fetch('/api/admin/whoami')
      .then(r => r.ok ? r.json() : { isAdmin: false })
      .then(({ isAdmin }) => { if (!cancelled) setAccess(isAdmin ? 'open' : 'denied') })
      .catch(() => { if (!cancelled) setAccess('denied') })
    return () => { cancelled = true }
  }, [supabase, session])

  useEffect(() => {
    if (access === 'denied') router.replace('/browse')
  }, [access, router])

  const showToast = (msg, type='') => {
    setToast({msg,type})
    setTimeout(()=>setToast(null), 3000)
  }

  useEffect(() => {
    if (!supabase) return
    fetch('/api/admin/movies/list')
      .then(r => r.ok ? r.json() : { movies: [] })
      .then(({ movies }) => setMovies(movies || []))
      .catch(() => setMovies([]))
    // Real subscriber count — replaces the hardcoded "1,247" that never updated
    supabase.from('users').select('id',{count:'exact',head:true}).eq('plan_status','active')
      .then(({count})=>setSubscriberCount(count ?? 0))
    // Real veteran actor list — fetched via admin API route (service role),
    // not a direct client query, since veteran_actors is correctly RLS-locked
    // against direct browser reads. See pages/api/admin/veterans/list.js
    fetch('/api/admin/veterans/list')
      .then(r => r.ok ? r.json() : { actors: [] })
      .then(({ actors }) => setVeteranActors(actors))
      .catch(() => setVeteranActors([]))
    fetch('/api/admin/movies/stats')
      .then(r => r.ok ? r.json() : { minutesByMovie: {} })
      .then(({ minutesByMovie }) => setMovieMinutes(minutesByMovie || {}))
      .catch(() => setMovieMinutes({}))
    fetch('/api/admin/referrals/list')
      .then(r => r.ok ? r.json() : { codes: [], earnings: [] })
      .then(({ codes, earnings }) => { setReferralCodes(codes); setReferralEarnings(earnings) })
      .catch(() => { setReferralCodes([]); setReferralEarnings([]) })
    fetch('/api/admin/sponsors/list')
      .then(r => r.ok ? r.json() : { sponsors: [] })
      .then(({ sponsors }) => setSponsors(sponsors))
      .catch(() => setSponsors([]))
    fetch('/api/admin/logs/list')
      .then(r => r.ok ? r.json() : { logs: [] })
      .then(({ logs }) => setLogs(logs))
      .catch(() => setLogs([]))
    fetch('/api/admin/reels/list')
      .then(r => r.ok ? r.json() : { reels: [] })
      .then(({ reels }) => setReels(reels))
      .catch(() => setReels([]))
  }, [supabase])

  async function handleUpload(e) {
    e.preventDefault()
    const fd = new FormData(e.target)
    const file = fd.get('videoFile')
    const posterFile = fd.get('posterFile')
    if (!file || !file.size) { showToast('Choose a video file first', 'red'); return }

    setUploading(true)
    setUploadProgress(0)
    try {
      // 1. Create the Bunny video placeholder + Supabase row (is_active: false)
      const res = await fetch('/api/admin/upload-url', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body:JSON.stringify({ title:fd.get('title'), year:parseInt(fd.get('year')), category:fd.get('category'), description:fd.get('description'), producer:fd.get('producer') }),
      })
      const data = await res.json()
      if (!data.bunny_video_guid) { showToast(data.error||'Could not create movie entry','red'); setUploading(false); return }

      // 2. Get a short-lived signed TUS credential for this specific video
      const authRes = await fetch('/api/admin/tus-auth', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body:JSON.stringify({ videoGuid: data.bunny_video_guid }),
      })
      const auth = await authRes.json()
      if (!auth.authorizationSignature) { showToast('Could not authorize upload','red'); setUploading(false); return }

      // 3. Upload the actual file, directly browser-to-Bunny, with real progress
      const { Upload } = await import('tus-js-client')
      const upload = new Upload(file, {
        endpoint: auth.endpoint,
        retryDelays: [0, 3000, 5000, 10000, 20000],
        headers: {
          AuthorizationSignature: auth.authorizationSignature,
          AuthorizationExpire: String(auth.authorizationExpire),
          VideoId: auth.videoId,
          LibraryId: String(auth.libraryId),
        },
        metadata: { filetype: file.type, title: fd.get('title') },
        onError: (err) => {
          console.error('Upload failed:', err)
          showToast('Upload failed: ' + err.message, 'red')
          setUploading(false)
        },
        onProgress: (bytesUploaded, bytesTotal) => {
          setUploadProgress(Math.round((bytesUploaded / bytesTotal) * 100))
        },
        onSuccess: async () => {
          // 4. File genuinely finished uploading — now it's safe to activate.
          // Bunny may still be encoding for a short while after this; the
          // movie will simply 404 briefly on playback until encoding catches
          // up, which is expected for larger files.
          await fetch('/api/admin/activate-movie', {
            method:'POST', headers:{'Content-Type':'application/json'},
            body:JSON.stringify({ movieId: data.movieId }),
          })

          // 5. Optional poster upload, using Bunny's real Set Thumbnail API
          if (posterFile && posterFile.size) {
            try {
              await fetch(`/api/admin/upload-poster?movieId=${data.movieId}`, {
                method: 'POST',
                headers: { 'Content-Type': posterFile.type || 'application/octet-stream' },
                body: posterFile,
              })
            } catch (err) {
              console.error('Poster upload failed:', err)
              showToast('Movie uploaded, but the poster failed to attach — you can retry it later', 'red')
            }
          }

          showToast(`"${fd.get('title')}" uploaded and live under ${fd.get('category')}!`, 'gold')
          setUploading(false)
          setUploadProgress(0)
          e.target.reset()
          fetch('/api/admin/movies/list').then(r=>r.ok?r.json():{movies:[]}).then(({movies})=>setMovies(movies||[]))
        },
      })

      upload.findPreviousUploads().then(previous => {
        if (previous.length) upload.resumeFromPreviousUpload(previous[0])
        upload.start()
      })
    } catch (err) {
      console.error(err)
      showToast('Upload failed','red')
      setUploading(false)
    }
  }

  async function creditLegacyFund(period, totalRevenueNGN) {
    if (!period || !totalRevenueNGN) { showToast('Enter both period and revenue amount','red'); return }
    const res = await fetch('/api/admin/legacy-fund/credit', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body:JSON.stringify({ period, totalRevenueNGN: Number(totalRevenueNGN) }),
    })
    const data = await res.json()
    if (data.success) showToast(`Legacy Fund credited ₦${data.fund_credited_ngn?.toLocaleString()} for ${data.actors_allocated} actors`,'gold')
    else showToast(data.message||data.error,'gold')
  }

  async function handleAddActor(e) {
    e.preventDefault()
    const fd = new FormData(e.target)
    setAddingActor(true)
    try {
      const res = await fetch('/api/admin/veterans/add', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({
          name: fd.get('name'),
          bio: fd.get('bio'),
          birthYear: fd.get('birthYear'),
          stateOfOrigin: fd.get('stateOfOrigin'),
          careerStartYear: fd.get('careerStartYear'),
          careerHighlights: fd.get('careerHighlights'),
        }),
      })
      const data = await res.json()
      if (data.success) {
        showToast(`${fd.get('name')} added to the Legends registry`, 'gold')
        setVeteranActors(prev => [data.actor, ...(prev||[])])
        setShowAddActor(false)
        e.target.reset()
      } else showToast(data.error || 'Could not add actor', 'red')
    } catch { showToast('Request failed', 'red') }
    finally { setAddingActor(false) }
  }

  async function handleUpdateActor(e) {
    e.preventDefault()
    const fd = new FormData(e.target)
    setAddingActor(true)
    try {
      const res = await fetch('/api/admin/veterans/update', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({
          id: editingActor.id,
          name: fd.get('name'),
          bio: fd.get('bio'),
          birthYear: fd.get('birthYear'),
          stateOfOrigin: fd.get('stateOfOrigin'),
          careerStartYear: fd.get('careerStartYear'),
          careerHighlights: fd.get('careerHighlights'),
          status: fd.get('status'),
          isVerified: fd.get('isVerified') === 'on',
        }),
      })
      const data = await res.json()
      if (data.success) {
        showToast(`${fd.get('name')} updated`, 'gold')
        setVeteranActors(prev => prev.map(a => a.id === data.actor.id ? data.actor : a))
        setEditingActor(null)
      } else showToast(data.error || 'Could not update actor', 'red')
    } catch { showToast('Request failed', 'red') }
    finally { setAddingActor(false) }
  }

  async function handleUpdateMovie(e) {
    e.preventDefault()
    const fd = new FormData(e.target)
    setSavingMovie(true)
    try {
      const res = await fetch('/api/admin/movies/update', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({
          movieId: editingMovie.id,
          title: fd.get('title'), year: fd.get('year'),
          producer: fd.get('producer'), category: fd.get('category'),
          description: fd.get('description'),
        }),
      })
      const data = await res.json()
      if (data.success) {
        setMovies(prev => prev.map(m => m.id === data.movie.id ? data.movie : m))
        showToast(`"${data.movie.title}" updated`, 'gold')
        setEditingMovie(null)
      } else showToast(data.error || 'Could not save', 'red')
    } catch { showToast('Request failed', 'red') }
    finally { setSavingMovie(false) }
  }

  async function syncDuration(movie) {
    const res = await fetch('/api/admin/movies/sync-duration', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ movieId: movie.id }),
    })
    const data = await res.json()
    if (data.success) {
      setMovies(prev => prev.map(m => m.id === movie.id ? { ...m, duration_seconds: data.duration_seconds } : m))
      showToast(`Duration synced: ${Math.round(data.duration_seconds/60)} min`, 'gold')
    } else showToast(data.error || 'Could not sync duration', 'red')
  }

  async function deleteMovie(movie) {
    const res = await fetch('/api/admin/movies/delete', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ movieId: movie.id }),
    })
    const data = await res.json()
    if (data.success) {
      setMovies(prev => prev.filter(m => m.id !== movie.id))
      showToast(`"${movie.title}" permanently deleted`, 'gold')
      setDeletingMovie(null)
    } else showToast(data.error || 'Could not delete', 'red')
  }

  async function handleReelUpload(e) {
    e.preventDefault()
    const fd = new FormData(e.target)
    const file = fd.get('reelFile')
    const movieId = fd.get('movieId')
    const title = fd.get('reelTitle')
    if (!file || !file.size) { showToast('Choose a clip file first', 'red'); return }
    if (!movieId) { showToast('Pick which movie this reel is from', 'red'); return }

    setUploadingReel(true)
    setReelProgress(0)
    try {
      const res = await fetch('/api/admin/reels/create', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body:JSON.stringify({ movieId, title }),
      })
      const data = await res.json()
      if (!data.bunny_video_guid) { showToast(data.error||'Could not create reel entry','red'); setUploadingReel(false); return }

      const authRes = await fetch('/api/admin/tus-auth', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body:JSON.stringify({ videoGuid: data.bunny_video_guid }),
      })
      const auth = await authRes.json()
      if (!auth.authorizationSignature) { showToast('Could not authorize upload','red'); setUploadingReel(false); return }

      const { Upload } = await import('tus-js-client')
      const upload = new Upload(file, {
        endpoint: auth.endpoint,
        retryDelays: [0, 3000, 5000, 10000, 20000],
        headers: {
          AuthorizationSignature: auth.authorizationSignature,
          AuthorizationExpire: String(auth.authorizationExpire),
          VideoId: auth.videoId,
          LibraryId: String(auth.libraryId),
        },
        metadata: { filetype: file.type, title },
        onError: (err) => { showToast('Upload failed: ' + err.message, 'red'); setUploadingReel(false) },
        onProgress: (up, total) => setReelProgress(Math.round((up/total)*100)),
        onSuccess: async () => {
          await fetch('/api/admin/reels/activate', {
            method:'POST', headers:{'Content-Type':'application/json'},
            body:JSON.stringify({ reelId: data.reelId }),
          })
          showToast(`Reel "${title}" uploaded and live!`, 'gold')
          setUploadingReel(false)
          setReelProgress(0)
          e.target.reset()
          fetch('/api/admin/reels/list').then(r=>r.ok?r.json():{reels:[]}).then(({reels})=>setReels(reels))
        },
      })
      upload.findPreviousUploads().then(previous => {
        if (previous.length) upload.resumeFromPreviousUpload(previous[0])
        upload.start()
      })
    } catch (err) {
      console.error(err)
      showToast('Upload failed', 'red')
      setUploadingReel(false)
    }
  }

  async function activateReel(reel) {
    const res = await fetch('/api/admin/reels/activate', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ reelId: reel.id }),
    })
    const data = await res.json()
    if (data.success) {
      setReels(prev => prev.map(r => r.id === reel.id ? { ...r, is_active: true } : r))
      showToast(`"${reel.title}" activated`, 'gold')
    } else showToast(data.error || 'Could not activate', 'red')
  }

  async function toggleMovieActive(movie) {
    const res = await fetch('/api/admin/activate-movie', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ movieId: movie.id, setActive: !movie.is_active }),
    })
    const data = await res.json()
    if (data.success) {
      setMovies(prev => prev.map(m => m.id === movie.id ? { ...m, is_active: !movie.is_active } : m))
      showToast(`${movie.title} is now ${!movie.is_active ? 'Live' : 'Hidden'}`, 'gold')
    } else showToast(data.error || 'Could not update', 'red')
  }

  async function generateReferralCode(actor) {
    const res = await fetch('/api/admin/referrals/create', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ veteranActorId: actor.id, actorName: actor.name }),
    })
    const data = await res.json()
    if (data.success) {
      setReferralCodes(prev => [data.referralCode, ...(prev||[])])
      showToast(`Code ${data.referralCode.code} created for ${actor.name}`, 'gold')
    } else showToast(data.error || 'Could not create code', 'red')
  }

  async function toggleSponsor(sponsor) {
    const res = await fetch('/api/admin/sponsors/toggle', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ sponsorId: sponsor.id, setActive: !sponsor.is_active }),
    })
    const data = await res.json()
    if (data.success) {
      setSponsors(prev => prev.map(s => s.id === sponsor.id ? { ...s, is_active: !sponsor.is_active } : s))
      showToast(`${sponsor.brand_name} marked ${!sponsor.is_active ? 'Active' : 'Inactive'}`, 'gold')
    } else showToast(data.error || 'Could not update', 'red')
  }

  if (access === 'checking') {
    return (
      <div style={{minHeight:'100vh',background:'#080808',display:'flex',alignItems:'center',justifyContent:'center',color:'#9a9590',fontFamily:'DM Sans, sans-serif'}}>
        Checking access…
      </div>
    )
  }
  if (access === 'denied') {
    return (
      <div style={{minHeight:'100vh',background:'#080808',display:'flex',alignItems:'center',justifyContent:'center',color:'#9a9590',fontFamily:'DM Sans, sans-serif'}}>
        Redirecting…
      </div>
    )
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@400;500;600&display=swap');
        :root{--gold:#c8a84b;--gold-light:#e8c96e;--gold-dim:#7a6530;--bg:#080808;--bg2:#111;--bg3:#1a1a1a;--bg4:#222;--text:#f0ede6;--text2:#9a9590;--text3:#5a5550;--green:#4ace8a;--purple:#7b68ee;--red:#e84a4a;--radius:8px;--radius-lg:14px;}
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
        body{font-family:'DM Sans',sans-serif;background:var(--bg);color:var(--text);-webkit-font-smoothing:antialiased;}
        .btn{display:inline-flex;align-items:center;gap:7px;padding:8px 16px;border-radius:var(--radius);font-size:13px;font-weight:600;cursor:pointer;border:none;transition:.2s;font-family:inherit;}
        .btn:disabled{opacity:.5;cursor:not-allowed;}
        .btn-gold{background:var(--gold);color:#000;} .btn-gold:hover:not(:disabled){background:var(--gold-light);}
        .btn-ghost{background:transparent;color:var(--text2);border:1px solid var(--bg4);} .btn-ghost:hover{color:var(--text);}
        .btn-green{background:var(--green);color:#000;}
        .card{background:var(--bg2);border:1px solid var(--bg4);border-radius:var(--radius-lg);}
        table{width:100%;border-collapse:collapse;}
        th{font-size:11px;color:var(--text3);text-transform:uppercase;letter-spacing:.07em;padding:8px 12px;text-align:left;border-bottom:1px solid var(--bg4);}
        td{font-size:13px;padding:11px 12px;border-bottom:1px solid var(--bg3);color:var(--text2);vertical-align:middle;}
        tr:hover td{background:var(--bg3);}
        .form-input{width:100%;background:var(--bg3);border:1px solid var(--bg4);border-radius:var(--radius);padding:9px 12px;font-size:13px;color:var(--text);outline:none;font-family:inherit;}
        .form-input:focus{border-color:var(--gold-dim);}
        .form-select{width:100%;background:var(--bg3);border:1px solid var(--bg4);border-radius:var(--radius);padding:9px 12px;font-size:13px;color:var(--text);outline:none;font-family:inherit;}
        .tab{padding:7px 14px;border-radius:6px;cursor:pointer;font-size:13px;font-weight:500;color:var(--text2);background:transparent;border:none;font-family:inherit;transition:.2s;text-transform:capitalize;}
        .tab.active{color:var(--text);background:var(--bg3);}
        .tab.active-green{color:var(--green);background:rgba(74,206,138,0.1);}
        .toast{position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:var(--bg3);border:1px solid var(--bg4);border-radius:var(--radius);padding:10px 22px;font-size:13px;z-index:9999;white-space:nowrap;}
        .toast-gold{border-color:var(--gold-dim);color:var(--gold);}
        .toast-red{border-color:rgba(232,74,74,0.4);color:var(--red);}
      `}</style>

      <div style={{minHeight:'100vh',background:'var(--bg)'}}>
        {/* Admin Nav */}
        <div style={{background:'var(--bg2)',borderBottom:'1px solid var(--bg4)',padding:'0 24px',display:'flex',alignItems:'center',gap:12,height:56,flexWrap:'wrap'}}>
          <Link href="/browse">
            <span style={{fontFamily:"'Playfair Display',serif",fontSize:20,fontWeight:900,color:'var(--gold)',cursor:'pointer'}}>
              Naija<span style={{color:'var(--text)'}}>Rewind</span>
            </span>
          </Link>
          <span style={{fontSize:11,color:'var(--gold)',fontWeight:700,background:'rgba(200,168,75,0.12)',padding:'2px 8px',borderRadius:4,border:'1px solid var(--gold-dim)'}}>ADMIN</span>
          <div style={{flex:1}}/>
          <Link href="/browse"><button className="btn btn-ghost">← Back to App</button></Link>
        </div>

        <div style={{maxWidth:1100,margin:'0 auto',padding:'32px 20px 80px'}}>
          <h1 style={{fontFamily:"'Playfair Display',serif",fontSize:28,fontWeight:900,marginBottom:4}}>Admin Dashboard</h1>
          <p style={{color:'var(--text2)',fontSize:14,marginBottom:28}}>Content, subscribers, royalties, Legacy Fund and veteran actors</p>

          {/* Tabs */}
          <div style={{display:'flex',gap:4,marginBottom:28,background:'var(--bg2)',border:'1px solid var(--bg4)',borderRadius:8,padding:4,width:'fit-content',flexWrap:'wrap'}}>
            {TABS.map(t=>(
              <button key={t} className={`tab ${tab===t ? (t==='legacy fund'||t==='veterans'?'active-green':'active') : ''}`} onClick={()=>setTab(t)}>
                {t==='legacy fund'?'🌿 Legacy Fund':t==='veterans'?'🎬 Veterans':t.charAt(0).toUpperCase()+t.slice(1)}
              </button>
            ))}
          </div>

          {/* ── OVERVIEW ── */}
          {tab==='overview' && (
            <>
              <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))',gap:12,marginBottom:32}}>
                {buildStats(subscriberCount, (movies||[]).filter(m=>m.is_active).length, veteranActors?.length ?? null, Object.values(movieMinutes).reduce((sum,m)=>sum+m,0) > 0 ? Math.round(Object.values(movieMinutes).reduce((sum,m)=>sum+m,0)/60) : 0).map(s=>(
                  <div key={s.label} className="card" style={{padding:'16px 18px'}}>
                    <div style={{fontSize:11,color:'var(--text3)',textTransform:'uppercase',letterSpacing:'.07em',marginBottom:6}}>{s.label}</div>
                    <div style={{fontFamily:"'Playfair Display',serif",fontSize:24,fontWeight:700,color:s.color}}>{s.value}</div>
                    <div style={{fontSize:11,color:'var(--text3)',marginTop:3}}>{s.sub}</div>
                  </div>
                ))}
              </div>

              {/* Revenue split */}
              <div className="card" style={{padding:'22px 24px',marginBottom:16}}>
                <div style={{fontWeight:600,fontSize:15,marginBottom:4}}>Revenue Split Policy</div>
                <p style={{fontSize:12,color:'var(--text3)',marginBottom:16}}>The percentages are your real, fixed policy. Naira amounts populate once you run a real monthly royalty/legacy fund calculation — not shown yet since none has been run.</p>
                {[
                  {label:'Producer Royalty Pool',pct:30,color:'var(--gold)'},
                  {label:'NaijaRewind Operations',pct:60,color:'var(--bg4)'},
                  {label:'Veterans Legacy Fund',pct:10,color:'var(--green)'},
                ].map(r=>(
                  <div key={r.label} style={{marginBottom:14}}>
                    <div style={{display:'flex',justifyContent:'space-between',fontSize:13,color:'var(--text2)',marginBottom:5}}>
                      <span>{r.label}</span><span style={{color:r.color,fontWeight:600}}>{r.pct}%</span>
                    </div>
                    <div style={{height:6,background:'var(--bg4)',borderRadius:3}}>
                      <div style={{height:'100%',background:r.color,borderRadius:3,width:`${r.pct}%`}}/>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* ── MOVIES ── */}
          {tab==='movies' && (
            <>
              <div style={{marginBottom:14}}>
                <input
                  className="form-input" style={{maxWidth:320}}
                  placeholder="🔍 Search movies by title…"
                  value={movieSearch} onChange={e=>setMovieSearch(e.target.value)}
                />
              </div>
              <div className="card" style={{overflow:'hidden'}}>
                <table>
                  <thead><tr><th>Title</th><th>Year</th><th>Category</th><th>Producer</th><th>Duration</th><th>Watch hrs</th><th>Royalty</th><th>Status</th><th></th></tr></thead>
                  <tbody>
                    {(movies||[]).filter(m => m.title?.toLowerCase().includes(movieSearch.toLowerCase())).map((m)=>(
                      <tr key={m.id}>
                        <td style={{color:'var(--text)',fontWeight:500}}>{m.title}</td>
                        <td>{m.year}</td>
                        <td><span style={{fontSize:11,background:'var(--bg4)',padding:'2px 8px',borderRadius:4}}>{m.category?.split(' & ')[0]}</span></td>
                        <td>{m.producer}</td>
                        <td>
                          {m.duration_seconds
                            ? `${Math.floor(m.duration_seconds/60)}m`
                            : <button className="btn btn-ghost" style={{fontSize:11,padding:'3px 8px'}} onClick={()=>syncDuration(m)}>Sync</button>}
                        </td>
                        <td style={{color:'var(--text)'}}>{movieMinutes[m.id] ? `${(movieMinutes[m.id]/60).toFixed(1)}h` : <span style={{color:'var(--text3)'}}>0h</span>}</td>
                        <td style={{color:'var(--text3)'}} title="Populates after you run a monthly royalty calculation on the Royalties tab">Pending calc</td>
                        <td><span style={{fontSize:11,padding:'2px 8px',borderRadius:4,fontWeight:500,background:m.is_active?'rgba(74,206,138,0.12)':'rgba(90,85,80,0.2)',color:m.is_active?'var(--green)':'var(--text3)'}}>{m.is_active?'Live':'Hidden'}</span></td>
                        <td style={{whiteSpace:'nowrap'}}>
                          <button className="btn btn-ghost" style={{fontSize:11,padding:'4px 10px',marginRight:6}} onClick={()=>setEditingMovie(m)}>Edit</button>
                          <button className="btn btn-ghost" style={{fontSize:11,padding:'4px 10px',marginRight:6}} onClick={()=>toggleMovieActive(m)}>{m.is_active?'Hide':'Activate'}</button>
                          <button className="btn btn-ghost" style={{fontSize:11,padding:'4px 10px',color:'var(--red)'}} onClick={()=>setDeletingMovie(m)}>Delete</button>
                        </td>
                      </tr>
                    ))}
                    {movies === null && (
                      <tr><td colSpan={9} style={{textAlign:'center',padding:24,color:'var(--text3)'}}>Loading…</td></tr>
                    )}
                    {movies !== null && (movies||[]).filter(m => m.title?.toLowerCase().includes(movieSearch.toLowerCase())).length === 0 && (
                      <tr><td colSpan={9} style={{textAlign:'center',padding:24,color:'var(--text3)'}}>No movies match "{movieSearch}"</td></tr>{/* colSpan updated for new Duration column */}
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* ── UPLOAD ── */}
          {tab==='upload' && (
            <div className="card" style={{padding:'28px',maxWidth:560}}>
              <h3 style={{fontSize:16,fontWeight:600,marginBottom:20}}>Upload New Movie</h3>
              <form onSubmit={handleUpload}>
                {[{name:'title',label:'Movie Title',type:'text',ph:'Living in Bondage'},{name:'year',label:'Year',type:'number',ph:'1992'},{name:'producer',label:'Producer',type:'text',ph:'NEK Video Links'}].map(f=>(
                  <div key={f.name} style={{marginBottom:14}}>
                    <label style={{display:'block',fontSize:11,fontWeight:600,color:'var(--text2)',marginBottom:6,textTransform:'uppercase',letterSpacing:'.07em'}}>{f.label}</label>
                    <input className="form-input" name={f.name} type={f.type} placeholder={f.ph} required/>
                  </div>
                ))}
                <div style={{marginBottom:14}}>
                  <label style={{display:'block',fontSize:11,fontWeight:600,color:'var(--text2)',marginBottom:6,textTransform:'uppercase',letterSpacing:'.07em'}}>Category</label>
                  <input className="form-input" list="category-options" name="category" placeholder="Pick a suggestion or type your own" required />
                  <datalist id="category-options">
                    {['Classic Horror & Occult','Village Drama','Crime & Thriller','Family Favorites','Romance','Action','Comedy','Religious','Musical','Epic & Historical','Others'].map(c=><option key={c} value={c} />)}
                  </datalist>
                </div>
                <div style={{marginBottom:20}}>
                  <label style={{display:'block',fontSize:11,fontWeight:600,color:'var(--text2)',marginBottom:6,textTransform:'uppercase',letterSpacing:'.07em'}}>Description</label>
                  <textarea className="form-input" name="description" rows={3} style={{resize:'vertical'}} placeholder="Brief plot description…"/>
                </div>
                <div style={{marginBottom:20}}>
                  <label style={{display:'block',fontSize:11,fontWeight:600,color:'var(--text2)',marginBottom:6,textTransform:'uppercase',letterSpacing:'.07em'}}>Video File</label>
                  <input className="form-input" name="videoFile" type="file" accept="video/*" required disabled={uploading} />
                </div>
                <div style={{marginBottom:20}}>
                  <label style={{display:'block',fontSize:11,fontWeight:600,color:'var(--text2)',marginBottom:6,textTransform:'uppercase',letterSpacing:'.07em'}}>Poster Image (optional)</label>
                  <input className="form-input" name="posterFile" type="file" accept="image/*" disabled={uploading} />
                  <p style={{fontSize:11,color:'var(--text3)',marginTop:6}}>Skip this and Bunny will auto-generate one from a video frame instead.</p>
                </div>
                {uploading && (
                  <div style={{marginBottom:20}}>
                    <div style={{height:8,background:'var(--bg3)',borderRadius:4,overflow:'hidden'}}>
                      <div style={{height:'100%',width:`${uploadProgress}%`,background:'var(--gold)',transition:'width .3s'}} />
                    </div>
                    <div style={{fontSize:12,color:'var(--text2)',marginTop:6}}>{uploadProgress}% uploaded — don't close this tab</div>
                  </div>
                )}
                <button type="submit" className="btn btn-gold" disabled={uploading}>{uploading?`Uploading… ${uploadProgress}%`:'Upload Movie'}</button>
                <p style={{fontSize:12,color:'var(--text3)',marginTop:10}}>Uploads go straight to Bunny.net and become visible in the app as soon as the file finishes uploading.</p>
              </form>
            </div>
          )}

          {/* ── REELS ── */}
          {tab==='reels' && (
            <div>
              <div className="card" style={{padding:'24px',marginBottom:20}}>
                <h3 style={{fontSize:16,fontWeight:600,marginBottom:6}}>Upload a Reel</h3>
                <p style={{fontSize:13,color:'var(--text2)',marginBottom:18}}>Short cuts from a movie — a great scene, a memorable moment. Free to watch, no subscription required, great for discovery.</p>
                <form onSubmit={handleReelUpload}>
                  <div style={{marginBottom:14}}>
                    <label style={{display:'block',fontSize:11,fontWeight:600,color:'var(--text2)',marginBottom:6,textTransform:'uppercase',letterSpacing:'.07em'}}>Which Movie Is This From? *</label>
                    <select name="movieId" className="form-input" required disabled={uploadingReel}>
                      <option value="">Select a movie…</option>
                      {(movies||[]).map(m=><option key={m.id} value={m.id}>{m.title} ({m.year})</option>)}
                    </select>
                  </div>
                  <div style={{marginBottom:14}}>
                    <label style={{display:'block',fontSize:11,fontWeight:600,color:'var(--text2)',marginBottom:6,textTransform:'uppercase',letterSpacing:'.07em'}}>Reel Title *</label>
                    <input name="reelTitle" className="form-input" placeholder="e.g. The unforgettable confrontation scene" required disabled={uploadingReel} />
                  </div>
                  <div style={{marginBottom:20}}>
                    <label style={{display:'block',fontSize:11,fontWeight:600,color:'var(--text2)',marginBottom:6,textTransform:'uppercase',letterSpacing:'.07em'}}>Clip File</label>
                    <input className="form-input" name="reelFile" type="file" accept="video/*" required disabled={uploadingReel} />
                  </div>
                  {uploadingReel && (
                    <div style={{marginBottom:20}}>
                      <div style={{height:8,background:'var(--bg3)',borderRadius:4,overflow:'hidden'}}>
                        <div style={{height:'100%',width:`${reelProgress}%`,background:'var(--gold)',transition:'width .3s'}} />
                      </div>
                      <div style={{fontSize:12,color:'var(--text2)',marginTop:6}}>{reelProgress}% uploaded</div>
                    </div>
                  )}
                  <button type="submit" className="btn btn-gold" disabled={uploadingReel}>{uploadingReel?`Uploading… ${reelProgress}%`:'Upload Reel'}</button>
                </form>
              </div>

              <div style={{fontWeight:600,fontSize:15,marginBottom:12}}>All Reels</div>
              <div className="card" style={{overflow:'hidden'}}>
                {reels === null ? (
                  <div style={{padding:'24px',textAlign:'center',color:'var(--text3)',fontSize:13}}>Loading…</div>
                ) : !reels.length ? (
                  <div style={{padding:'24px',textAlign:'center',color:'var(--text3)',fontSize:13}}>No reels uploaded yet.</div>
                ) : (
                  <table>
                    <thead><tr><th>Title</th><th>From Movie</th><th>Duration</th><th>Views</th><th>Status</th><th></th></tr></thead>
                    <tbody>
                      {reels.map(r=>(
                        <tr key={r.id}>
                          <td style={{color:'var(--text)',fontWeight:500}}>{r.title}</td>
                          <td>{r.movies?.title || '—'}</td>
                          <td>{r.duration_seconds ? `${Math.floor(r.duration_seconds/60)}:${String(r.duration_seconds%60).padStart(2,'0')}` : '—'}</td>
                          <td>{r.view_count || 0}</td>
                          <td><span style={{fontSize:11,padding:'2px 8px',borderRadius:4,background:r.is_active?'rgba(74,206,138,0.12)':'rgba(90,85,80,0.2)',color:r.is_active?'var(--green)':'var(--text3)'}}>{r.is_active?'Live':'Pending'}</span></td>
                          <td>{!r.is_active && <button className="btn btn-ghost" style={{fontSize:11,padding:'4px 10px'}} onClick={()=>activateReel(r)}>Activate</button>}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}

          {/* ── ROYALTIES ── */}
          {tab==='royalties' && (
            <div>
              <div className="card" style={{padding:'20px 24px',marginBottom:16}}>
                <h3 style={{fontSize:15,fontWeight:600,marginBottom:6}}>Monthly Royalty Pool — 30% of Revenue</h3>
                <p style={{fontSize:13,color:'var(--text2)',marginBottom:16}}>Distributed to producers proportionally by watch minutes.</p>
                <div style={{display:'flex',gap:10,flexWrap:'wrap'}}>
                  <button className="btn btn-gold" onClick={async()=>{
                    const res=await fetch('/api/admin/royalties/calculate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({period:'2024-06',totalRevenueNGN:3200000})})
                    const d=await res.json()
                    showToast(`Royalties calculated! Pool: ₦${d.pool_ngn?.toLocaleString()||'N/A'}`,'gold')
                  }}>Calculate June 2024</button>
                  <button className="btn btn-ghost" onClick={()=>showToast('Export CSV — coming soon')}>Export CSV</button>
                </div>
              </div>
              <div className="card" style={{overflow:'hidden'}}>
                <table>
                  <thead><tr><th>Movie</th><th>Producer</th><th>Watch hrs</th><th>Pool share</th><th>Payout (₦)</th><th>Status</th></tr></thead>
                  <tbody>
                    {[['Karishika','Vic. O Productions',340,'18.2%','174,720','Pending'],['Living in Bondage','NEK Video Links',280,'15.0%','144,000','Pending'],['Issakaba','Lancelot Imasuen',260,'13.9%','133,440','Paid'],['Rattlesnake','Amaka Igwe Films',180,'9.6%','92,160','Paid'],['Glamour Girls','Zeb Ejiro',160,'8.6%','82,560','Pending']].map(row=>(
                      <tr key={row[0]}>
                        <td style={{color:'var(--text)',fontWeight:500}}>{row[0]}</td>
                        <td>{row[1]}</td><td>{row[2]}</td>
                        <td style={{color:'var(--gold)'}}>{row[3]}</td>
                        <td style={{fontWeight:500}}>₦{row[4]}</td>
                        <td><span style={{fontSize:11,padding:'2px 8px',borderRadius:4,background:row[5]==='Paid'?'rgba(74,206,138,0.12)':'rgba(200,168,75,0.1)',color:row[5]==='Paid'?'var(--green)':'var(--gold)'}}>{row[5]}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── LEGACY FUND ── */}
          {tab==='legacy fund' && (
            <div>
              {/* Fund summary */}
              <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))',gap:12,marginBottom:24}}>
                {[
                  {label:'Fund Balance',value:'₦960,000',color:'var(--green)'},
                  {label:'Allocated to Legacy Fund',value:'₦320,000',color:'var(--gold)'},
                  {label:'Total Credited',value:'₦960,000',color:'var(--purple)'},
                  {label:'Months Active',value:'3',color:'var(--text2)'},
                ].map(s=>(
                  <div key={s.label} className="card" style={{padding:'16px 18px'}}>
                    <div style={{fontSize:11,color:'var(--text3)',textTransform:'uppercase',letterSpacing:'.07em',marginBottom:6}}>{s.label}</div>
                    <div style={{fontFamily:"'Playfair Display',serif",fontSize:26,fontWeight:700,color:s.color}}>{s.value}</div>
                  </div>
                ))}
              </div>

              {/* How it works */}
              <div className="card" style={{padding:'20px 24px',marginBottom:16,borderColor:'rgba(74,206,138,0.25)'}}>
                <h3 style={{fontSize:15,fontWeight:600,marginBottom:8,color:'var(--green)'}}>🌿 Veterans Legacy Fund</h3>
                <p style={{fontSize:13,color:'var(--text2)',lineHeight:1.7,marginBottom:16}}>
                  10% of monthly revenue is credited here automatically. Allocations are calculated per actor using their Legacy Points 
                  (Lead = 5pts, Major Supporting = 3pts, Minor = 1pt) weighted by watch minutes of their films. 
                  Funds are held as <strong style={{color:'var(--text)'}}>status: held</strong> until actors are verified and onboarded.
                </p>
                <form onSubmit={(e)=>{e.preventDefault(); const fd=new FormData(e.target); creditLegacyFund(fd.get('period'), fd.get('revenue'));}} style={{display:'flex',gap:10,flexWrap:'wrap',alignItems:'flex-end'}}>
                  <div>
                    <label style={{display:'block',fontSize:10,color:'var(--text3)',marginBottom:4,textTransform:'uppercase'}}>Period (e.g. 2026-07)</label>
                    <input name="period" className="form-input" style={{width:140}} placeholder="2026-07" required />
                  </div>
                  <div>
                    <label style={{display:'block',fontSize:10,color:'var(--text3)',marginBottom:4,textTransform:'uppercase'}}>Total Revenue (₦)</label>
                    <input name="revenue" type="number" className="form-input" style={{width:160}} placeholder="Real amount from Paystack" required />
                  </div>
                  <button type="submit" className="btn btn-green">Credit Fund (10%)</button>
                  <button type="button" className="btn btn-ghost" onClick={()=>showToast('Export actor allocations — coming soon')}>Export Allocations</button>
                </form>
              </div>

              {/* Actor allocations table */}
              <div style={{fontWeight:600,fontSize:15,marginBottom:12}}>Actor Legacy Credits — Held Pending Onboarding</div>
              <div className="card" style={{overflow:'hidden',marginBottom:24}}>
                {!veteranActors?.length ? (
                  <div style={{padding:'32px 20px',textAlign:'center',color:'var(--text3)',fontSize:13}}>
                    No veteran actors registered yet. Add actors under the Veterans tab to start tracking credits.
                  </div>
                ) : (
                  <table>
                    <thead><tr><th>Actor</th><th>Status</th><th></th></tr></thead>
                    <tbody>
                      {veteranActors.map(a=>(
                        <tr key={a.id}>
                          <td style={{color:'var(--text)',fontWeight:500}}>{a.name}</td>
                          <td><span style={{fontSize:11,padding:'2px 8px',borderRadius:4,background:'rgba(200,168,75,0.1)',color:'var(--gold)',fontWeight:600}}>{(a.status||'uncontacted').toUpperCase()}</span></td>
                          <td><button className="btn btn-ghost" style={{fontSize:11,padding:'4px 10px',marginRight:6}} onClick={()=>setEditingActor(a)}>Edit</button><button className="btn btn-ghost" style={{fontSize:11,padding:'4px 10px'}} onClick={()=>showToast(`Contact ${a.name} to begin onboarding`)}>Onboard</button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
              <div style={{fontSize:13,color:'var(--text3)',padding:'12px 16px',background:'var(--bg2)',border:'1px solid var(--bg4)',borderRadius:8}}>
                💡 Real per-actor credit amounts require legacy_fund_ledger and actor_legacy_allocations data, which populate once you've credited a real revenue period above and licensed movies are linked to actors via movie_legacy_points.
                Once an actor is verified (ID + bank details), click <strong>Onboard</strong> to begin direct payment setup.
              </div>
            </div>
          )}

          {/* ── VETERANS ── */}
          {tab==='veterans' && (
            <div>
              <div className="card" style={{padding:'20px 24px',marginBottom:16}}>
                <h3 style={{fontSize:15,fontWeight:600,marginBottom:8}}>Veteran Actors Registry</h3>
                <p style={{fontSize:13,color:'var(--text2)',marginBottom:16}}>
                  Track contact status, verification, and onboarding for each veteran actor. 
                  Start with research and outreach — no agreements needed yet.
                </p>
                <button className="btn btn-gold" onClick={()=>setShowAddActor(s=>!s)}>{showAddActor?'Cancel':'+ Add Veteran Actor'}</button>

                {showAddActor && (
                  <form onSubmit={handleAddActor} style={{marginTop:16,paddingTop:16,borderTop:'1px solid var(--bg4)',display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
                    <div style={{gridColumn:'1 / -1'}}>
                      <label style={{display:'block',fontSize:11,color:'var(--text3)',marginBottom:4,textTransform:'uppercase'}}>Full Name *</label>
                      <input name="name" className="form-input" placeholder="e.g. Pete Edochie" required />
                    </div>
                    <div style={{gridColumn:'1 / -1'}}>
                      <label style={{display:'block',fontSize:11,color:'var(--text3)',marginBottom:4,textTransform:'uppercase'}}>Bio</label>
                      <textarea name="bio" className="form-input" rows={2} placeholder="Short tribute / career summary" style={{resize:'vertical'}} />
                    </div>
                    <div>
                      <label style={{display:'block',fontSize:11,color:'var(--text3)',marginBottom:4,textTransform:'uppercase'}}>Birth Year</label>
                      <input name="birthYear" type="number" className="form-input" placeholder="1947" />
                    </div>
                    <div>
                      <label style={{display:'block',fontSize:11,color:'var(--text3)',marginBottom:4,textTransform:'uppercase'}}>Career Start Year</label>
                      <input name="careerStartYear" type="number" className="form-input" placeholder="1975" />
                    </div>
                    <div>
                      <label style={{display:'block',fontSize:11,color:'var(--text3)',marginBottom:4,textTransform:'uppercase'}}>State of Origin</label>
                      <input name="stateOfOrigin" className="form-input" placeholder="e.g. Anambra" />
                    </div>
                    <div>
                      <label style={{display:'block',fontSize:11,color:'var(--text3)',marginBottom:4,textTransform:'uppercase'}}>Career Highlights</label>
                      <input name="careerHighlights" className="form-input" placeholder="Comma-separated, e.g. AMAA Lifetime Award, 200+ films" />
                    </div>
                    <div style={{gridColumn:'1 / -1'}}>
                      <button type="submit" className="btn btn-gold" disabled={addingActor}>{addingActor?'Adding…':'Add to Legends'}</button>
                    </div>
                  </form>
                )}
              </div>

              <div className="card" style={{overflow:'hidden'}}>
                {!veteranActors?.length ? (
                  <div style={{padding:'32px 20px',textAlign:'center',color:'var(--text3)',fontSize:13}}>
                    No veteran actors registered yet. Use "+ Add Veteran Actor" above to start building the registry.
                  </div>
                ) : (
                  <table>
                    <thead><tr><th>Actor</th><th>Contact Status</th><th>Verified</th><th>Action</th></tr></thead>
                    <tbody>
                      {veteranActors.map(a=>(
                        <tr key={a.id}>
                          <td style={{color:'var(--text)',fontWeight:500}}>{a.name}</td>
                          <td><span style={{fontSize:11,padding:'2px 8px',borderRadius:4,background:'rgba(90,85,80,0.3)',color:'var(--text3)'}}>{(a.status||'uncontacted').replace('_',' ').toUpperCase()}</span></td>
                          <td style={{color:a.is_verified?'var(--green)':'var(--text3)'}}>{a.is_verified?'✓ Verified':'—'}</td>
                          <td>
                            <button className="btn btn-ghost" style={{fontSize:11,padding:'4px 10px',marginRight:6}} onClick={()=>setEditingActor(a)}>Edit</button>
                            <button className="btn btn-ghost" style={{fontSize:11,padding:'4px 10px'}} onClick={()=>setOutreachActor(a)}>Draft Outreach</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              <div style={{marginTop:20,padding:'16px',background:'rgba(200,168,75,0.06)',border:'1px solid rgba(200,168,75,0.2)',borderRadius:8,fontSize:13,color:'var(--text2)',lineHeight:1.7}}>
                <strong style={{color:'var(--gold)'}}>Outreach strategy:</strong> Start with whichever actors are most active on social media today — check first, don't assume.
                A simple DM explaining the platform and the Legacy Fund tends to get responses.
                No need to mention payment figures until you have a meeting.
              </div>
            </div>
          )}

          {/* ── REFERRALS ── */}
          {tab==='referrals' && (
            <div>
              <div className="card" style={{padding:'20px 24px',marginBottom:16}}>
                <h3 style={{fontSize:15,fontWeight:600,marginBottom:8}}>Actor Referral Codes</h3>
                <p style={{fontSize:13,color:'var(--text2)',marginBottom:16}}>
                  Give veteran actors a personal code (e.g. "KANAYO2024") to share with fans. When someone subscribes using it,
                  the actor earns a 5% cut of that subscriber's revenue, tracked monthly.
                </p>
              </div>

              <div style={{fontWeight:600,fontSize:15,marginBottom:12}}>Generate a code</div>
              <div className="card" style={{overflow:'hidden',marginBottom:24}}>
                {!veteranActors?.length ? (
                  <div style={{padding:'24px',textAlign:'center',color:'var(--text3)',fontSize:13}}>
                    Add veteran actors first (Veterans tab) before generating referral codes for them.
                  </div>
                ) : (
                  <table>
                    <thead><tr><th>Actor</th><th>Existing Codes</th><th></th></tr></thead>
                    <tbody>
                      {veteranActors.map(a=>{
                        const codes = (referralCodes||[]).filter(c=>c.veteran_actor_id===a.id)
                        return (
                          <tr key={a.id}>
                            <td style={{color:'var(--text)',fontWeight:500}}>{a.name}</td>
                            <td>{codes.length ? codes.map(c=>c.code).join(', ') : <span style={{color:'var(--text3)'}}>None yet</span>}</td>
                            <td><button className="btn btn-ghost" style={{fontSize:11,padding:'4px 10px'}} onClick={()=>generateReferralCode(a)}>+ Generate Code</button></td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                )}
              </div>

              <div style={{fontWeight:600,fontSize:15,marginBottom:12}}>All Codes</div>
              <div className="card" style={{overflow:'hidden',marginBottom:24}}>
                {referralCodes === null ? (
                  <div style={{padding:'24px',textAlign:'center',color:'var(--text3)',fontSize:13}}>Loading…</div>
                ) : !referralCodes.length ? (
                  <div style={{padding:'24px',textAlign:'center',color:'var(--text3)',fontSize:13}}>No referral codes generated yet.</div>
                ) : (
                  <table>
                    <thead><tr><th>Code</th><th>Actor</th><th>Total Referrals</th><th>Total Earned</th><th>Status</th></tr></thead>
                    <tbody>
                      {referralCodes.map(c=>(
                        <tr key={c.id}>
                          <td style={{color:'var(--gold)',fontFamily:'monospace',fontWeight:600}}>{c.code}</td>
                          <td>{c.actor_name}</td>
                          <td>{c.total_referrals || 0}</td>
                          <td style={{color:'var(--green)'}}>₦{Number(c.total_earned_ngn||0).toLocaleString()}</td>
                          <td><span style={{fontSize:11,padding:'2px 8px',borderRadius:4,background:c.is_active?'rgba(74,206,138,0.12)':'rgba(90,85,80,0.2)',color:c.is_active?'var(--green)':'var(--text3)'}}>{c.is_active?'Active':'Inactive'}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              <div style={{fontWeight:600,fontSize:15,marginBottom:12}}>Recent Monthly Earnings</div>
              <div className="card" style={{overflow:'hidden'}}>
                {!referralEarnings?.length ? (
                  <div style={{padding:'24px',textAlign:'center',color:'var(--text3)',fontSize:13}}>
                    No earnings calculated yet — this populates once monthly referral earnings are computed for a real revenue period.
                  </div>
                ) : (
                  <table>
                    <thead><tr><th>Period</th><th>Actor</th><th>Active Referrals</th><th>Earned</th><th>Status</th></tr></thead>
                    <tbody>
                      {referralEarnings.map(e=>(
                        <tr key={e.id}>
                          <td>{e.period}</td>
                          <td>{e.actor_name}</td>
                          <td>{e.active_referrals}</td>
                          <td style={{color:'var(--green)'}}>₦{Number(e.earned_ngn||0).toLocaleString()}</td>
                          <td>{e.status}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}

          {/* ── ADS & SPONSORS ── */}
          {tab==='ads & sponsors' && (
            <div>
              <div className="card" style={{padding:'20px 24px',marginBottom:16}}>
                <h3 style={{fontSize:15,fontWeight:600,marginBottom:8}}>Sponsor Enquiries & Deals</h3>
                <p style={{fontSize:13,color:'var(--text2)',marginBottom:0}}>
                  Every submission from the public <code>/advertise</code> page lands here as "Inactive" (pending review).
                  Mark a deal Active once it's confirmed and you're ready for it to appear in the pre-roll rotation.
                </p>
              </div>

              <div className="card" style={{overflow:'hidden'}}>
                {sponsors === null ? (
                  <div style={{padding:'24px',textAlign:'center',color:'var(--text3)',fontSize:13}}>Loading…</div>
                ) : !sponsors.length ? (
                  <div style={{padding:'24px',textAlign:'center',color:'var(--text3)',fontSize:13}}>
                    No sponsor enquiries yet — these appear automatically when someone submits the /advertise form.
                  </div>
                ) : (
                  <table>
                    <thead><tr><th>Brand</th><th>Contact</th><th>Monthly Fee</th><th>Notes</th><th>Status</th><th></th></tr></thead>
                    <tbody>
                      {sponsors.map(s=>(
                        <tr key={s.id}>
                          <td style={{color:'var(--text)',fontWeight:500}}>{s.brand_name}</td>
                          <td>{s.contact_name}<br/><span style={{color:'var(--text3)',fontSize:12}}>{s.contact_email}</span></td>
                          <td>{s.monthly_fee_ngn ? `₦${Number(s.monthly_fee_ngn).toLocaleString()}` : <span style={{color:'var(--text3)'}}>Not set</span>}</td>
                          <td style={{maxWidth:220,whiteSpace:'pre-wrap',fontSize:12,color:'var(--text2)'}}>{s.notes}</td>
                          <td><span style={{fontSize:11,padding:'2px 8px',borderRadius:4,background:s.is_active?'rgba(74,206,138,0.12)':'rgba(90,85,80,0.2)',color:s.is_active?'var(--green)':'var(--text3)'}}>{s.is_active?'Active':'Inactive'}</span></td>
                          <td><button className="btn btn-ghost" style={{fontSize:11,padding:'4px 10px'}} onClick={()=>toggleSponsor(s)}>{s.is_active?'Deactivate':'Activate'}</button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}

          {/* ── LOGS ── */}
          {tab==='logs' && (
            <div>
              <div className="card" style={{padding:'20px 24px',marginBottom:16}}>
                <h3 style={{fontSize:15,fontWeight:600,marginBottom:8}}>Admin Activity Log</h3>
                <p style={{fontSize:13,color:'var(--text2)',marginBottom:0}}>
                  Every hide, delete, fund credit, and status change is recorded here with who did it and when. Last 100 actions.
                </p>
              </div>
              <div className="card" style={{overflow:'hidden'}}>
                {logs === null ? (
                  <div style={{padding:'24px',textAlign:'center',color:'var(--text3)',fontSize:13}}>Loading…</div>
                ) : !logs.length ? (
                  <div style={{padding:'24px',textAlign:'center',color:'var(--text3)',fontSize:13}}>No activity logged yet.</div>
                ) : (
                  <table>
                    <thead><tr><th>When</th><th>Admin</th><th>Action</th><th>Target</th><th>Details</th></tr></thead>
                    <tbody>
                      {logs.map(l=>(
                        <tr key={l.id}>
                          <td style={{whiteSpace:'nowrap',fontSize:12,color:'var(--text3)'}}>{new Date(l.created_at).toLocaleString()}</td>
                          <td style={{fontSize:12}}>{l.admin_email}</td>
                          <td><span style={{fontSize:11,padding:'2px 8px',borderRadius:4,background:'var(--bg4)'}}>{l.action}</span></td>
                          <td>{l.target_label}</td>
                          <td style={{fontSize:12,color:'var(--text2)'}}>{l.details}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {editingMovie && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.7)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:200,padding:20}} onClick={()=>setEditingMovie(null)}>
          <div className="card" style={{width:'100%',maxWidth:500,padding:24,maxHeight:'85vh',overflowY:'auto'}} onClick={e=>e.stopPropagation()}>
            <h3 style={{fontSize:16,fontWeight:600,marginBottom:16}}>Edit "{editingMovie.title}"</h3>
            <form onSubmit={handleUpdateMovie}>
              <div style={{marginBottom:14}}>
                <label style={{display:'block',fontSize:11,color:'var(--text3)',marginBottom:4,textTransform:'uppercase'}}>Movie Title *</label>
                <input name="title" className="form-input" defaultValue={editingMovie.title} required />
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:14}}>
                <div>
                  <label style={{display:'block',fontSize:11,color:'var(--text3)',marginBottom:4,textTransform:'uppercase'}}>Year</label>
                  <input name="year" type="number" className="form-input" defaultValue={editingMovie.year} />
                </div>
                <div>
                  <label style={{display:'block',fontSize:11,color:'var(--text3)',marginBottom:4,textTransform:'uppercase'}}>Producer</label>
                  <input name="producer" className="form-input" defaultValue={editingMovie.producer} />
                </div>
              </div>
              <div style={{marginBottom:14}}>
                <label style={{display:'block',fontSize:11,color:'var(--text3)',marginBottom:4,textTransform:'uppercase'}}>Category</label>
                <input name="category" list="category-options" className="form-input" defaultValue={editingMovie.category} />
              </div>
              <div style={{marginBottom:20}}>
                <label style={{display:'block',fontSize:11,color:'var(--text3)',marginBottom:4,textTransform:'uppercase'}}>Description</label>
                <textarea name="description" className="form-input" rows={3} defaultValue={editingMovie.description} style={{resize:'vertical'}} />
              </div>
              <div style={{display:'flex',gap:10}}>
                <button type="submit" className="btn btn-gold" disabled={savingMovie}>{savingMovie?'Saving…':'Save Changes'}</button>
                <button type="button" className="btn btn-ghost" onClick={()=>setEditingMovie(null)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deletingMovie && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.7)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:200,padding:20}} onClick={()=>setDeletingMovie(null)}>
          <div className="card" style={{width:'100%',maxWidth:420,padding:24}} onClick={e=>e.stopPropagation()}>
            <h3 style={{fontSize:16,fontWeight:600,marginBottom:10,color:'var(--red)'}}>Delete "{deletingMovie.title}"?</h3>
            <p style={{fontSize:13,color:'var(--text2)',marginBottom:20,lineHeight:1.6}}>
              This permanently removes the movie from the database <strong>and deletes the video file from Bunny.net</strong> — this cannot be undone. If you just want to pull it from the app temporarily, use "Hide" instead.
            </p>
            <div style={{display:'flex',gap:10}}>
              <button className="btn btn-ghost" style={{background:'var(--red)',color:'#fff'}} onClick={()=>deleteMovie(deletingMovie)}>Yes, Delete Permanently</button>
              <button className="btn btn-ghost" onClick={()=>setDeletingMovie(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {outreachActor && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.7)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:200,padding:20}} onClick={()=>setOutreachActor(null)}>
          <div className="card" style={{width:'100%',maxWidth:520,padding:24}} onClick={e=>e.stopPropagation()}>
            <h3 style={{fontSize:16,fontWeight:600,marginBottom:14}}>Outreach draft — {outreachActor.name}</h3>
            <p style={{fontSize:12,color:'var(--text3)',marginBottom:10}}>Copy this, personalize it, and send via DM/email. This doesn't send anything automatically — there's no messaging integration yet.</p>
            <textarea
              ref={outreachTextRef}
              readOnly
              style={{width:'100%',minHeight:180,background:'var(--bg3)',border:'1px solid var(--bg4)',borderRadius:8,padding:14,fontSize:13,color:'var(--text)',fontFamily:'inherit',lineHeight:1.6,resize:'vertical'}}
              value={`Hi ${outreachActor.name.split(' ')[0]},

I'm reaching out from NaijaRewind, a new platform bringing classic Nollywood films back for streaming — including some of the titles you're remembered for.

We've built a Legacy Fund into the platform: 10% of subscription revenue goes directly toward honoring and supporting veteran actors like yourself, through direct participation payments and welfare support, funded automatically as people watch.

I'd love to tell you more and see if you'd like to be part of it — no obligation, just an introduction for now. Would you be open to a quick call or chat?

Warm regards`}
            />
            <div style={{display:'flex',gap:10,marginTop:14}}>
              <button className="btn btn-gold" onClick={()=>{navigator.clipboard.writeText(outreachTextRef.current?.value || ''); showToast('Copied to clipboard','gold')}}>Copy Message</button>
              <button className="btn btn-ghost" onClick={()=>setOutreachActor(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {editingActor && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.7)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:200,padding:20}} onClick={()=>setEditingActor(null)}>
          <div className="card" style={{width:'100%',maxWidth:500,padding:24,maxHeight:'85vh',overflowY:'auto'}} onClick={e=>e.stopPropagation()}>
            <h3 style={{fontSize:16,fontWeight:600,marginBottom:16}}>Edit {editingActor.name}</h3>
            <form onSubmit={handleUpdateActor} style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
              <div style={{gridColumn:'1 / -1'}}>
                <label style={{display:'block',fontSize:11,color:'var(--text3)',marginBottom:4,textTransform:'uppercase'}}>Full Name *</label>
                <input name="name" className="form-input" defaultValue={editingActor.name} required />
              </div>
              <div style={{gridColumn:'1 / -1'}}>
                <label style={{display:'block',fontSize:11,color:'var(--text3)',marginBottom:4,textTransform:'uppercase'}}>Bio</label>
                <textarea name="bio" className="form-input" rows={2} defaultValue={editingActor.bio||''} style={{resize:'vertical'}} />
              </div>
              <div>
                <label style={{display:'block',fontSize:11,color:'var(--text3)',marginBottom:4,textTransform:'uppercase'}}>Birth Year</label>
                <input name="birthYear" type="number" className="form-input" defaultValue={editingActor.birth_year||''} />
              </div>
              <div>
                <label style={{display:'block',fontSize:11,color:'var(--text3)',marginBottom:4,textTransform:'uppercase'}}>Career Start Year</label>
                <input name="careerStartYear" type="number" className="form-input" defaultValue={editingActor.career_start_year||''} />
              </div>
              <div>
                <label style={{display:'block',fontSize:11,color:'var(--text3)',marginBottom:4,textTransform:'uppercase'}}>State of Origin</label>
                <input name="stateOfOrigin" className="form-input" defaultValue={editingActor.state_of_origin||''} />
              </div>
              <div>
                <label style={{display:'block',fontSize:11,color:'var(--text3)',marginBottom:4,textTransform:'uppercase'}}>Status</label>
                <select name="status" className="form-input" defaultValue={editingActor.status||'uncontacted'}>
                  <option value="uncontacted">Uncontacted</option>
                  <option value="active">Active</option>
                  <option value="deceased">Deceased</option>
                </select>
              </div>
              <div style={{gridColumn:'1 / -1'}}>
                <label style={{display:'block',fontSize:11,color:'var(--text3)',marginBottom:4,textTransform:'uppercase'}}>Career Highlights</label>
                <input name="careerHighlights" className="form-input" defaultValue={(editingActor.career_highlights||[]).join(', ')} placeholder="Comma-separated" />
              </div>
              <div style={{gridColumn:'1 / -1',display:'flex',alignItems:'center',gap:8}}>
                <input type="checkbox" name="isVerified" id="isVerified" defaultChecked={!!editingActor.is_verified} />
                <label htmlFor="isVerified" style={{fontSize:13,color:'var(--text2)'}}>Verified (contact + bank details confirmed)</label>
              </div>
              <div style={{gridColumn:'1 / -1',display:'flex',gap:10,marginTop:8}}>
                <button type="submit" className="btn btn-gold" disabled={addingActor}>{addingActor?'Saving…':'Save Changes'}</button>
                <button type="button" className="btn btn-ghost" onClick={()=>setEditingActor(null)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {toast && <div className={`toast ${toast.type==='gold'?'toast-gold':toast.type==='red'?'toast-red':''}`}>{toast.msg}</div>}
    </>
  )
}
