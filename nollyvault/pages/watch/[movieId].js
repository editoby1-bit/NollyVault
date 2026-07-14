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
  const [isAdmin, setIsAdmin] = useState(false)
  const [resumeSeconds, setResumeSeconds] = useState(0)
  const [showResumePrompt, setShowResumePrompt] = useState(false)
  const controlsTimer = useRef(null)

  useEffect(() => {
    if (!movieId) return
    if (session && supabase) {
      supabase.from('users').select('plan').eq('id', session.user.id).single()
        .then(({ data }) => { if (data?.plan) setUserPlan(data.plan) })
      // Admin accounts always see the real ad experience regardless of their
      // own plan, so ad behavior can actually be monitored/QA'd — real
      // premium/family subscribers see zero ads, no exceptions.
      fetch('/api/admin/whoami').then(r => r.ok ? r.json() : { isAdmin: false })
        .then(({ isAdmin }) => setIsAdmin(isAdmin)).catch(() => {})
    }
    fetchStream()
  }, [movieId, session])

  // Premium/family users skip the pre-roll entirely — unless this is an
  // admin account deliberately watching ads to check ad behavior.
  const isPremiumPlan = userPlan === 'premium' || userPlan === 'family'
  const shouldShowAds = isAdmin || !isPremiumPlan

  const currentTimeRef = useRef(0)
  const resumeTimeoutRef = useRef(null)

  async function fetchStream() {
    setLoading(true)
    try {
      const res = await fetch('/api/stream/' + movieId)
      const data = await res.json()
      if (!res.ok) {
        if (data.redirect) { router.replace(data.redirect); return }
        throw new Error(data.error)
      }
      setMovie({ title: data.title, duration: data.duration_seconds })

      // Check for saved progress on this movie for this profile, so we can
      // resume instead of always restarting from 0.
      const profile = JSON.parse(sessionStorage.getItem('activeProfile') || '{}')
      let resumeAt = 0
      if (profile?.id) {
        try {
          const progRes = await fetch(`/api/progress?profileId=${profile.id}&movieId=${movieId}`)
          const progData = await progRes.json()
          const saved = progData?.progress?.progress_seconds || 0
          // Don't bother resuming for the first ~15s in — that's basically
          // the start anyway, not worth prompting about.
          if (saved > 15 && !progData?.progress?.completed) resumeAt = saved
        } catch {}
      }

      if (resumeAt > 0) {
        setResumeSeconds(resumeAt)
        setShowResumePrompt(true)
        resumeTimeoutRef.current = setTimeout(() => setShowResumePrompt(false), 6000)
        currentTimeRef.current = resumeAt
      }
      // Append a unique param so this iframe's src is never identical to a
      // previous one on the same page — player.js's own docs warn that
      // duplicate srcs across players can cause event delivery to misfire.
      setStreamUrl(`${data.streamUrl}&_s=${Date.now()}`)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  function restartFromBeginning() {
    clearTimeout(resumeTimeoutRef.current)
    setShowResumePrompt(false)
    currentTimeRef.current = 0
    setResumeSeconds(0)
    if (playerRef.current) playerRef.current.setCurrentTime(0)
  }

  // Bunny Stream's embed player uses the player.js library for programmatic
  // control and events — it does NOT just broadcast raw postMessage data to
  // any listener (that was the wrong assumption last time, which is why
  // resume silently did nothing). This loads the real library from Bunny's
  // CDN, attaches it to the iframe once both are ready, seeks to the saved
  // position on 'ready', and tracks real position via 'timeupdate'.
  // Docs: https://docs.bunny.net/docs/playback-control-api
  const iframeRef = useRef(null)
  const playerRef = useRef(null)

  useEffect(() => {
    if (!streamUrl) return
    let cancelled = false

    function attachPlayer() {
      if (cancelled || !iframeRef.current || !window.playerjs) return
      const player = new window.playerjs.Player(iframeRef.current)
      playerRef.current = player
      player.on('ready', () => {
        if (resumeSeconds > 0) player.setCurrentTime(resumeSeconds)
        player.on('timeupdate', (data) => {
          const t = typeof data === 'number' ? data : (data?.seconds ?? data?.currentTime)
          if (typeof t === 'number') currentTimeRef.current = t
        })
      })
    }

    if (window.playerjs) {
      attachPlayer()
    } else {
      const existing = document.getElementById('bunny-playerjs')
      if (!existing) {
        const script = document.createElement('script')
        script.id = 'bunny-playerjs'
        script.src = '//assets.mediadelivery.net/playerjs/playerjs-latest.min.js'
        script.onload = attachPlayer
        document.head.appendChild(script)
      } else {
        existing.addEventListener('load', attachPlayer)
      }
    }

    return () => { cancelled = true }
  }, [streamUrl, showPreRoll, shouldShowAds])

  useEffect(() => {
    if (!streamUrl || !session) return
    const profile = JSON.parse(sessionStorage.getItem('activeProfile') || '{}')

    const saveProgress = () => {
      const payload = JSON.stringify({
        movieId, profileId: profile.id,
        progressSeconds: Math.floor(currentTimeRef.current),
        completed: movie?.duration ? currentTimeRef.current >= movie.duration - 5 : false,
      })
      // sendBeacon fires reliably even as the page is actually closing,
      // unlike a normal fetch which can get cancelled mid-flight.
      if (navigator.sendBeacon) {
        navigator.sendBeacon('/api/progress', new Blob([payload], { type: 'application/json' }))
      } else {
        fetch('/api/progress', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: payload, keepalive: true })
      }
    }

    // Every 10s during playback (was 30s — meant resume could be off by up
    // to half a minute even in the best case).
    const timer = setInterval(saveProgress, 10000)

    // Catch the actual moment someone leaves — tab close, navigating away,
    // switching apps on mobile — so the very last few seconds aren't lost.
    const handleVisibility = () => { if (document.visibilityState === 'hidden') saveProgress() }
    window.addEventListener('beforeunload', saveProgress)
    document.addEventListener('visibilitychange', handleVisibility)

    return () => {
      clearInterval(timer)
      window.removeEventListener('beforeunload', saveProgress)
      document.removeEventListener('visibilitychange', handleVisibility)
      saveProgress() // also save on normal in-app navigation away from this page
    }
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
        @keyframes fadeIn{from{opacity:0;transform:translate(-50%,8px)}to{opacity:1;transform:translate(-50%,0)}}
      `}</style>

      {loading && !streamUrl && (
        <div style={{ position: 'fixed', inset: 0, background: '#000', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
          <div style={{ width: 32, height: 32, border: '3px solid #2a2a2a', borderTopColor: '#c8a84b', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          <div style={{ color: '#5a5550', fontSize: 13 }}>Checking access…</div>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      )}

      {showPreRoll && shouldShowAds && streamUrl && (
        <PreRoll
          movieTitle={movie?.title}
          isAdminPreview={isAdmin && isPremiumPlan}
          onComplete={() => setShowPreRoll(false)}
          onSkipAll={() => setShowPreRoll(false)}
        />
      )}

      {(!showPreRoll || !shouldShowAds) && streamUrl && (
        <div style={{ position: 'fixed', inset: 0, background: '#000', cursor: showControls ? 'default' : 'none' }} onMouseMove={resetControls}>
          <iframe ref={iframeRef} src={streamUrl} style={{ width: '100%', height: '100%', border: 'none' }} allow="autoplay; accelerometer; gyroscope; encrypted-media; picture-in-picture" allowFullScreen title={movie?.title} />

          {showResumePrompt && (
            <div style={{
              position: 'absolute', bottom: 90, left: '50%', transform: 'translateX(-50%)',
              background: 'rgba(0,0,0,0.85)', border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: 10, padding: '12px 18px', display: 'flex', alignItems: 'center', gap: 14,
              animation: 'fadeIn 0.3s ease',
            }}>
              <span style={{ fontSize: 13, color: '#f0ede6' }}>Resuming from where you left off</span>
              <button
                onClick={restartFromBeginning}
                style={{
                  background: 'rgba(200,168,75,0.15)', border: '1px solid rgba(200,168,75,0.4)',
                  color: '#c8a84b', fontSize: 12, fontWeight: 600,
                  padding: '5px 12px', borderRadius: 6, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap',
                }}
              >
                Start from the beginning?
              </button>
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
