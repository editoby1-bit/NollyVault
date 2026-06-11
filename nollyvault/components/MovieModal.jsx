// components/MovieModal.jsx
import { useState } from 'react'
import { useRouter } from 'next/router'

export default function MovieModal({ movie, onClose, onPlay, watchlisted, onWatchlist, canWatchParty }) {
  const router = useRouter()
  const [wlState, setWlState] = useState(watchlisted)

  if (!movie) return null

  const handleWatchlist = () => {
    setWlState(!wlState)
    onWatchlist?.(movie, !wlState)
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()} style={{ maxWidth: 660 }}>

        {/* Header image */}
        <div style={{ position: 'relative', height: 300, overflow: 'hidden', borderRadius: '14px 14px 0 0' }}>
          <img
            src={movie.thumbnail_url || movie.thumbnail || `https://via.placeholder.com/660x300/1a0a00/c8a84b?text=${encodeURIComponent(movie.title)}`}
            alt={movie.title}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, var(--bg2) 5%, transparent 60%)' }} />
          <button
            onClick={onClose}
            style={{
              position: 'absolute', top: 14, right: 14,
              width: 32, height: 32, borderRadius: '50%',
              background: 'rgba(0,0,0,0.7)', border: 'none',
              color: 'var(--text)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', transition: 'var(--transition)',
            }}
          >
            <svg viewBox="0 0 24 24" width={18} height={18} fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '20px 26px 28px' }}>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 30, fontWeight: 900, lineHeight: 1.15, marginBottom: 10 }}>
            {movie.title}
          </h2>

          {/* Meta row */}
          <div style={{ display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap', fontSize: 13, color: 'var(--text2)', marginBottom: 14 }}>
            <span style={{ color: 'var(--gold)', fontWeight: 600 }}>{movie.year}</span>
            {movie.duration_seconds && <span>{Math.floor(movie.duration_seconds / 60)} min</span>}
            {movie.duration && <span>{movie.duration}</span>}
            <span>{movie.category}</span>
            {movie.rating && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--gold)' }}>
                <svg viewBox="0 0 24 24" width={13} height={13} fill="currentColor"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>
                {movie.rating}
              </span>
            )}
          </div>

          <p style={{ fontSize: 14, color: 'var(--text2)', lineHeight: 1.68, marginBottom: 22 }}>
            {movie.description}
          </p>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 22 }}>
            <button className="btn btn-gold" onClick={() => { onClose(); onPlay?.(movie) }}>
              <svg viewBox="0 0 24 24" width={17} height={17} fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
              Play Now
            </button>

            <button className="btn btn-outline" onClick={handleWatchlist}>
              {wlState
                ? <><svg viewBox="0 0 24 24" width={16} height={16} fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg> In Watchlist</>
                : <><svg viewBox="0 0 24 24" width={16} height={16} fill="currentColor"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg> Add to Watchlist</>
              }
            </button>

            {canWatchParty && (
              <button
                className="btn btn-ghost"
                onClick={() => {
                  onClose()
                  router.push(`/watch-party/create?movieId=${movie.id}`)
                }}
              >
                <svg viewBox="0 0 24 24" width={16} height={16} fill="currentColor"><path d="M21.99 4c0-1.1-.89-2-1.99-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14l4 4-.01-18z"/></svg>
                Watch Party
              </button>
            )}

            <button
              className="btn btn-ghost"
              onClick={() => alert('Offline downloads available on Premium & Family plans')}
            >
              <svg viewBox="0 0 24 24" width={16} height={16} fill="currentColor"><path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/></svg>
            </button>
          </div>

          {/* Details */}
          <div style={{ fontSize: 13, color: 'var(--text3)', lineHeight: 2, borderTop: '1px solid var(--bg4)', paddingTop: 16 }}>
            {(movie.actors || movie.movie_actors) && (
              <div>
                <span style={{ color: 'var(--text2)', fontWeight: 500 }}>Starring: </span>
                {(movie.actors || movie.movie_actors?.map(a => a.actor_name))?.join(', ')}
              </div>
            )}
            {movie.producer && (
              <div>
                <span style={{ color: 'var(--text2)', fontWeight: 500 }}>Producer: </span>
                {movie.producer}
              </div>
            )}
            <div>
              <span style={{ color: 'var(--text2)', fontWeight: 500 }}>Category: </span>
              {movie.category}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
