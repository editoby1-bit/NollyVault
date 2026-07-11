// pages/admin/index.js
import { useState, useEffect } from 'react'
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
function buildStats(subscriberCount, activeMovieCount, veteranCount) {
  return [
    { label:'Total Subscribers', value: subscriberCount===null?'…':subscriberCount.toLocaleString(), sub:'Active paid subscriptions', color:'var(--gold)' },
    { label:'Monthly Revenue', value:'—', sub:'Not yet tracked', color:'var(--green)' },
    { label:'Watch Hours', value:'—', sub:'Not yet tracked', color:'var(--purple)' },
    { label:'Movies Licensed', value: String(activeMovieCount), sub:'Currently active', color:'var(--gold)' },
    { label:'Producer Pool (30%)', value:'—', sub:'Not yet tracked', color:'#e8774a' },
    { label:'Legacy Fund (10%)', value:'—', sub:'Not yet tracked', color:'var(--green)' },
    { label:'Active Watch Parties', value:'—', sub:'Not yet tracked', color:'var(--purple)' },
    { label:'Veteran Actors Registered', value: veteranCount===null?'…':String(veteranCount), sub: veteranCount ? `${veteranCount} registered` : '0 registered', color:'var(--gold)' },
  ]
}

const MOCK_MOVIES = [
  { id:'1', title:'Living in Bondage', year:1992, category:'Classic Horror & Occult', producer:'NEK Video Links', is_active:true },
  { id:'2', title:'Karishika', year:1996, category:'Classic Horror & Occult', producer:'Vic. O Productions', is_active:true },
  { id:'3', title:'Glamour Girls', year:1994, category:'Village Drama', producer:'Zeb Ejiro', is_active:true },
  { id:'4', title:'Rattlesnake', year:1995, category:'Crime & Thriller', producer:'Amaka Igwe Films', is_active:true },
  { id:'5', title:'Issakaba', year:2000, category:'Crime & Thriller', producer:'Lancelot Imasuen', is_active:false },
]


const TABS = ['overview','movies','upload','royalties','legacy fund','veterans','referrals','ads & sponsors']

export default function AdminDashboard() {
  const session = useSession()
  const supabase = useSupabaseClient()
  const router = useRouter()
  const [movies, setMovies] = useState(MOCK_MOVIES)
  const [subscriberCount, setSubscriberCount] = useState(null)
  const [veteranActors, setVeteranActors] = useState(null)
  const [showAddActor, setShowAddActor] = useState(false)
  const [addingActor, setAddingActor] = useState(false)
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
    supabase.from('movies').select('*').order('created_at',{ascending:false})
      .then(({data})=>{ if(data?.length) setMovies(data) })
    // Real subscriber count — replaces the hardcoded "1,247" that never updated
    supabase.from('users').select('id',{count:'exact',head:true}).eq('plan_status','active')
      .then(({count})=>setSubscriberCount(count ?? 0))
    // Real veteran actor list — replaces MOCK_ACTORS' fake credit amounts
    supabase.from('veteran_actors').select('*').order('created_at',{ascending:false})
      .then(({data})=>setVeteranActors(data || []))
  }, [supabase])

  async function handleUpload(e) {
    e.preventDefault()
    const fd = new FormData(e.target)
    const file = fd.get('videoFile')
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
          showToast(`"${fd.get('title')}" uploaded and live under ${fd.get('category')}!`, 'gold')
          setUploading(false)
          setUploadProgress(0)
          e.target.reset()
          if (supabase) supabase.from('movies').select('*').order('created_at',{ascending:false}).then(({data})=>{ if(data?.length) setMovies(data) })
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
                {buildStats(subscriberCount, movies.filter(m=>m.is_active).length, veteranActors?.length ?? null).map(s=>(
                  <div key={s.label} className="card" style={{padding:'16px 18px'}}>
                    <div style={{fontSize:11,color:'var(--text3)',textTransform:'uppercase',letterSpacing:'.07em',marginBottom:6}}>{s.label}</div>
                    <div style={{fontFamily:"'Playfair Display',serif",fontSize:24,fontWeight:700,color:s.color}}>{s.value}</div>
                    <div style={{fontSize:11,color:'var(--text3)',marginTop:3}}>{s.sub}</div>
                  </div>
                ))}
              </div>

              {/* Revenue split */}
              <div className="card" style={{padding:'22px 24px',marginBottom:16}}>
                <div style={{fontWeight:600,fontSize:15,marginBottom:16}}>Revenue Split — This Month</div>
                {[
                  {label:'Producer Royalty Pool',pct:30,amount:'₦960k',color:'var(--gold)'},
                  {label:'NaijaRewind Operations',pct:60,amount:'₦1.92M',color:'var(--bg4)'},
                  {label:'Veterans Legacy Fund',pct:10,amount:'₦320k',color:'var(--green)'},
                ].map(r=>(
                  <div key={r.label} style={{marginBottom:14}}>
                    <div style={{display:'flex',justifyContent:'space-between',fontSize:13,color:'var(--text2)',marginBottom:5}}>
                      <span>{r.label}</span><span style={{color:r.color,fontWeight:600}}>{r.pct}% · {r.amount}</span>
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
            <div className="card" style={{overflow:'hidden'}}>
              <table>
                <thead><tr><th>Title</th><th>Year</th><th>Category</th><th>Producer</th><th>Watch hrs</th><th>Royalty</th><th>Status</th><th></th></tr></thead>
                <tbody>
                  {movies.map((m,i)=>(
                    <tr key={m.id}>
                      <td style={{color:'var(--text)',fontWeight:500}}>{m.title}</td>
                      <td>{m.year}</td>
                      <td><span style={{fontSize:11,background:'var(--bg4)',padding:'2px 8px',borderRadius:4}}>{m.category?.split(' & ')[0]}</span></td>
                      <td>{m.producer}</td>
                      <td>{120+i*47}</td>
                      <td style={{color:'var(--gold)'}}>₦{((120+i*47)*320).toLocaleString()}</td>
                      <td><span style={{fontSize:11,padding:'2px 8px',borderRadius:4,fontWeight:500,background:m.is_active?'rgba(74,206,138,0.12)':'rgba(90,85,80,0.2)',color:m.is_active?'var(--green)':'var(--text3)'}}>{m.is_active?'Live':'Hidden'}</span></td>
                      <td><button className="btn btn-ghost" style={{fontSize:11,padding:'4px 10px'}} onClick={()=>showToast(`Toggled: ${m.title}`)}>Toggle</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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
                          <td><button className="btn btn-ghost" style={{fontSize:11,padding:'4px 10px'}} onClick={()=>showToast(`Contact ${a.name} to begin onboarding`)}>Onboard</button></td>
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
                            <button className="btn btn-ghost" style={{fontSize:11,padding:'4px 10px'}} onClick={()=>showToast(`Draft outreach message for ${a.name}`)}>Draft Outreach</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              <div style={{marginTop:20,padding:'16px',background:'rgba(200,168,75,0.06)',border:'1px solid rgba(200,168,75,0.2)',borderRadius:8,fontSize:13,color:'var(--text2)',lineHeight:1.7}}>
                <strong style={{color:'var(--gold)'}}>Outreach strategy:</strong> Start with actors who are most active on social media — 
                Kanayo O. Kanayo and Pete Edochie both have verified Instagram accounts with large followings. 
                A simple DM explaining the platform and the Legacy Fund tends to get responses. 
                No need to mention payment figures until you have a meeting.
              </div>
            </div>
          )}
        </div>
      </div>

      {toast && <div className={`toast ${toast.type==='gold'?'toast-gold':toast.type==='red'?'toast-red':''}`}>{toast.msg}</div>}
    </>
  )
}
