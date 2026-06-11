// components/MovieCard.jsx

export default function MovieCard({ movie, onClick, progressPct = null, size = 'md' }) {
  const widths = { sm: 130, md: 155, lg: 200 }
  const heights = { sm: 185, md: 220, lg: 285 }
  const w = widths[size]
  const h = heights[size]

  return (
    <div
      onClick={() => onClick?.(movie)}
      style={{
        width: w, cursor: 'pointer', flexShrink: 0,
        transition: 'transform 0.2s ease',
      }}
      onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.04)'}
      onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
    >
      {/* Poster */}
      <div style={{
        width: w, height: h, borderRadius: 8,
        background: 'var(--bg3)', overflow: 'hidden',
        position: 'relative', border: '1px solid var(--bg4)',
      }}>
        <img
          src={movie.thumbnail_url || movie.thumbnail || `https://via.placeholder.com/${w}x${h}/1a0a00/c8a84b?text=${encodeURIComponent(movie.title)}`}
          alt={movie.title}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          loading="lazy"
        />
        {/* Hover overlay */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to top, rgba(0,0,0,0.92) 0%, transparent 55%)',
          opacity: 0, transition: 'opacity 0.2s ease',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
          onMouseEnter={e => e.currentTarget.style.opacity = '1'}
          onMouseLeave={e => e.currentTarget.style.opacity = '0'}
        >
          <div style={{
            width: 42, height: 42, borderRadius: '50%',
            background: 'var(--gold)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg viewBox="0 0 24 24" width={20} height={20} fill="#000"><path d="M8 5v14l11-7z"/></svg>
          </div>
        </div>
        {/* Progress bar */}
        {progressPct !== null && (
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, background: 'rgba(0,0,0,0.5)' }}>
            <div style={{ height: '100%', background: 'var(--gold)', width: `${progressPct}%` }} />
          </div>
        )}
        {/* Category chip */}
        {movie.is_featured && (
          <div style={{
            position: 'absolute', top: 8, left: 8,
            background: 'var(--gold)', color: '#000',
            fontSize: 9, fontWeight: 700, padding: '2px 6px',
            borderRadius: 3, letterSpacing: '0.06em', textTransform: 'uppercase',
          }}>Featured</div>
        )}
      </div>
      {/* Info */}
      <div style={{ marginTop: 8, paddingLeft: 2 }}>
        <div style={{ fontSize: 13, fontWeight: 500, lineHeight: 1.3, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
          {movie.title}
        </div>
        <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 2 }}>
          <span style={{ color: 'var(--gold-dim)' }}>{movie.year}</span>
          {movie.category && ` · ${movie.category.split(' & ')[0]}`}
        </div>
      </div>
    </div>
  )
}
