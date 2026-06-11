// pages/watchlist.js
import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { useSession, useSupabaseClient } from './_app'
import Nav from '../components/Nav'
import MovieCard from '../components/MovieCard'
import MovieModal from '../components/MovieModal'
import ToastContainer, { showToast } from '../components/Toast'

export default function Watchlist() {
  const session = useSession()
  const supabase = useSupabaseClient()
  const router = useRouter()
  const [activeProfile, setActiveProfile] = useState(null)
  const [movies, setMovies] = useState([])
  const [selectedMovie, setSelectedMovie] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const p = sessionStorage.getItem('activeProfile')
    if (!p) { return } // demo mode: no redirect needed
    const profile = JSON.parse(p)
    setActiveProfile(profile)
    loadWatchlist(profile.id)
  }, [])

  async function loadWatchlist(profileId) {
    const { data } = await supabase
      .from('watchlists')
      .select('added_at, movies(*)')
      .eq('profile_id', profileId)
      .order('added_at', { ascending: false })
    setMovies((data || []).map(r => r.movies).filter(Boolean))
    setLoading(false)
  }

  async function removeFromWatchlist(movie) {
    if (!activeProfile) return
    await supabase.from('watchlists')
      .delete()
      .eq('profile_id', activeProfile.id)
      .eq('movie_id', movie.id)
    setMovies(prev => prev.filter(m => m.id !== movie.id))
    showToast('Removed from watchlist')
  }

  return (
    <>
      <Nav activeProfile={activeProfile} onProfileClick={() => router.push('/profiles')} />
      <div style={{ paddingTop: 'var(--nav-height)', minHeight: '100vh', background: 'var(--bg)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '36px 20px 80px' }}>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 30, fontWeight: 900, marginBottom: 6 }}>
            {activeProfile?.name}'s Watchlist
          </h1>
          <p style={{ color: 'var(--text2)', fontSize: 14, marginBottom: 32 }}>
            {movies.length} {movies.length === 1 ? 'movie' : 'movies'} saved
          </p>

          {loading && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(148px,1fr))', gap: 14 }}>
              {[...Array(8)].map((_, i) => (
                <div key={i}>
                  <div className="skeleton" style={{ width: '100%', height: 220, borderRadius: 8 }} />
                  <div className="skeleton" style={{ height: 14, marginTop: 8, borderRadius: 4, width: '80%' }} />
                </div>
              ))}
            </div>
          )}

          {!loading && movies.length === 0 && (
            <div style={{
              textAlign: 'center', padding: '80px 20px',
              background: 'var(--bg2)', border: '1px solid var(--bg4)',
              borderRadius: 'var(--radius-lg)',
            }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>🎬</div>
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 700, marginBottom: 8 }}>
                No movies saved yet
              </div>
              <p style={{ color: 'var(--text2)', fontSize: 14, marginBottom: 24 }}>
                Browse the catalog and add movies you want to watch
              </p>
              <button className="btn btn-gold" onClick={() => router.push('/browse')}>
                Browse Movies
              </button>
            </div>
          )}

          {!loading && movies.length > 0 && (
            <div className="movie-grid">
              {movies.map(m => (
                <div key={m.id} style={{ position: 'relative' }}>
                  <MovieCard movie={m} onClick={setSelectedMovie} />
                  <button
                    onClick={() => removeFromWatchlist(m)}
                    style={{
                      position: 'absolute', top: 8, right: 8,
                      width: 26, height: 26, borderRadius: '50%',
                      background: 'rgba(0,0,0,0.75)', border: 'none',
                      color: 'var(--text2)', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 14, fontWeight: 700, lineHeight: 1,
                      transition: 'background 0.2s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--red)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'rgba(0,0,0,0.75)'}
                    title="Remove from watchlist"
                  >×</button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {selectedMovie && (
        <MovieModal
          movie={selectedMovie}
          onClose={() => setSelectedMovie(null)}
          onPlay={m => router.push(`/watch/${m.id}`)}
          watchlisted={movies.some(m => m.id === selectedMovie.id)}
          onWatchlist={(movie, add) => { if (!add) removeFromWatchlist(movie); setSelectedMovie(null) }}
        />
      )}

      <ToastContainer />
      <style>{`
        .btn{display:inline-flex;align-items:center;gap:7px;padding:9px 18px;border-radius:8px;font-size:14px;font-weight:600;cursor:pointer;border:none;transition:.2s;}
        .btn-gold{background:var(--gold);color:#000;} .btn-gold:hover{background:var(--gold-light);}
        .movie-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(148px,1fr));gap:14px;}
        .skeleton{background:linear-gradient(90deg,var(--bg3) 25%,var(--bg4) 50%,var(--bg3) 75%);background-size:200% 100%;animation:shimmer 1.4s infinite;border-radius:8px;}
        @keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}
      `}</style>
    </>
  )
}
