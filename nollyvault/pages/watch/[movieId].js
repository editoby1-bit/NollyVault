// pages/watch/[movieId].js
import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/router'
import { useSession, useSupabaseClient } from '../_app'
import PreRoll from '../../components/PreRoll'
import ToastContainer, { showToast } from '../../components/Toast'

export default function WatchPage() {
  const router = useRouter()
  const session = useSession()
  const supabase = useSupabaseClient()
  const { movieId } = router.query
  const [streamUrl, setStreamUrl] = useState(null)
  const [movie, setMovie] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showPreRoll, setShowPreRoll] = useState(true)
  const [showControls, setShowControls] = useState(true)
  const [userPlan, setUserPlan] = useState('classic')
  const controlsTimer = useRef(null)

  useEffect(() => {
    if (!movieId) return
    if (session && supabase) {
      supabase.from('users').select('plan').eq('id', session.user.id).single()
        .then(({ data }) => { if (data?.plan) setUserPlan(data.plan) })
    }
    fetchStream()
  }, [movieId, session])

  async function fetchStream() {
    setLoading(true)
    try {
      const res = await fetch('/api/stream/' + movieId)
      const data = await res.json()
      if (!res.ok) {
        if (data.redirect) { router.push(data.redirect); return }
        throw new Error(data.error)
      }
      setStreamUrl(data.streamUrl)
      setMovie({ title: data.title, duration: data.duration_seconds })
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!streamUrl || !session) return
    const profile = JSON.parse(sessionStorage.getItem('activeProfile') || '{}')
    const timer = setInterval(async () => {
      await fetch('/api/progress', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ movieId, profileId: profile.id, progressSeconds: 0 }),
      })
    }, 30000)
    return () => clearInterval(timer)
  }, [streamUrl, session, movieId])

  const resetControls = () => {
    setShowControls(true)
    clearTimeout(controlsTimer.current)
    controlsTimer.current = setTimeout(() => setShowControls(false), 4000)
  }

  useEffect(() => {
    window.addEventListener('mousemove', resetControls)
    resetControls()
    return () => { window.removeEventListener('mousemove', resetControls); clearTimeout(controlsTimer.current) }
  }, [])

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "Georgia, serif", color: '#c8a84b', fontSize: 20 }}>
      Naija<span style={{ color: '#f0ede6' }}>Rewind</span>
    </div>
  )

  if (error) return (
    <div style={{ minHeight: '100vh', background: '#000', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ color: '#e84a4a', fontSize: 15 }}>{error}</div>
      <button onClick={() => router.back()} style={{ background: 'transparent', border: '1px solid #222', color: '#9a9590', padding: '8px 18px', borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit', fontSize: 13 }}>Back</button>
    </div>
  )

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
        body{font-family:'DM Sans',sans-serif;background:#000;color:#f0ede6;}
        .ctrl-btn{background:transparent;border:none;color:#9a9590;cursor:pointer;padding:6px;display:flex;align-items:center;transition:color .2s;font-family:inherit;}
        .ctrl-btn:hover{color:#c8a84b;}
      `}</style>

      {showPreRoll && (
        <PreRoll
          movieTitle={movie?.title}
          userPlan={userPlan}
          onComplete={() => setShowPreRoll(false)}
          onSkipAll={() => setShowPreRoll(false)}
        />
      )}

      {!showPreRoll && (
        <div style={{ position: 'fixed', inset: 0, background: '#000', cursor: showControls ? 'default' : 'none' }} onMouseMove={resetControls}>
          {streamUrl ? (
            <iframe src={streamUrl} style={{ width: '100%', height: '100%', border: 'none' }} allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture" allowFullScreen title={movie?.title} />
          ) : (
            <div style={{ width: '100%', height: '100%', background: 'radial-gradient(ellipse at center, #1a0f00 0%, #000 100%)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20 }}>
              <div style={{ opacity: 0.3, fontSize: 80 }}>🎬</div>
              <div style={{ color: '#5a5550', fontSize: 14, textAlign: 'center', maxWidth: 360 }}>Connect Bunny.net to enable streaming. See README.md</div>
            </div>
          )}

          <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', opacity: showControls ? 1 : 0, transition: 'opacity 0.4s ease' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.85), transparent)', padding: '16px 24px', display: 'flex', alignItems: 'center', gap: 14, pointerEvents: 'all' }}>
              <button className="ctrl-btn" onClick={() => router.back()} style={{ fontSize: 13, fontWeight: 500, gap: 6 }}>
                <svg viewBox="0 0 24 24" width={16} height={16} fill="currentColor"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></svg>
                Back
              </button>
              <div style={{ fontSize: 16, fontWeight: 600, marginLeft: 4 }}>{movie?.title}</div>
              <div style={{ flex: 1 }} />
              <button className="ctrl-btn" onClick={() => showToast('Watch Party — invite friends 🎉')} style={{ pointerEvents: 'all', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 6, padding: '6px 12px', fontSize: 12 }}>
                Watch Party
              </button>
            </div>
          </div>
        </div>
      )}
      <ToastContainer />
    </>
  )
}
