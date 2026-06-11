// pages/categories.js
import { useState } from 'react'
import { useRouter } from 'next/router'
import Nav from '../components/Nav'
import MovieCard from '../components/MovieCard'
import MovieModal from '../components/MovieModal'
import ToastContainer from '../components/Toast'
import { useMovies } from '../hooks/useMovies'

const CATEGORIES = [
  { id: 'Classic Horror & Occult', label: 'Classic Horror & Occult', icon: '🔮', color: '#7b68ee', desc: 'Karishika. Living in Bondage. The films that defined a generation.' },
  { id: 'Village Drama', label: 'Village Drama', icon: '🌿', color: '#4ace8a', desc: 'Community, tradition, betrayal. The heart of Nollywood storytelling.' },
  { id: 'Crime & Thriller', label: 'Crime & Thriller', icon: '🔫', color: '#e8774a', desc: 'Rattlesnake. Issakaba. Action that keeps you on the edge.' },
  { id: 'Family Favorites', label: 'Family Favorites', icon: '👨‍👩‍👧‍👦', color: '#c8a84b', desc: 'Watch together. Movies the whole family will love.' },
  { id: 'Romance', label: 'Romance', icon: '💕', color: '#e85d9a', desc: 'Love stories from the golden era of Nigerian cinema.' },
  { id: 'Action', label: 'Action', icon: '⚡', color: '#e84a4a', desc: 'High-stakes stories of courage and survival.' },
]

export default function Categories() {
  const router = useRouter()
  const { movies } = useMovies()
  const [activeProfile] = useState(() => {
    if (typeof window === 'undefined') return null
    try { return JSON.parse(sessionStorage.getItem('activeProfile') || 'null') }
    catch { return null }
  })
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [selectedMovie, setSelectedMovie] = useState(null)

  const filteredMovies = selectedCategory
    ? movies.filter(m => m.category === selectedCategory)
    : []

  return (
    <>
      <Nav activeProfile={activeProfile} onProfileClick={() => router.push('/profiles')} />
      <div style={{ paddingTop: 'var(--nav-height)', minHeight: '100vh', background: 'var(--bg)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '36px 20px 80px' }}>

          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 30, fontWeight: 900, marginBottom: 6 }}>Browse Categories</h1>
          <p style={{ color: 'var(--text2)', fontSize: 14, marginBottom: 36 }}>Explore classic Nollywood by genre</p>

          {/* Category grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12, marginBottom: 48 }}>
            {CATEGORIES.map(cat => (
              <div
                key={cat.id}
                onClick={() => setSelectedCategory(selectedCategory === cat.id ? null : cat.id)}
                style={{
                  background: selectedCategory === cat.id
                    ? `linear-gradient(135deg, ${cat.color}25, ${cat.color}10)`
                    : 'var(--bg2)',
                  border: `1px solid ${selectedCategory === cat.id ? cat.color + '66' : 'var(--bg4)'}`,
                  borderRadius: 'var(--radius-lg)', padding: '20px',
                  cursor: 'pointer', transition: 'all 0.2s',
                }}
                onMouseEnter={e => { if (selectedCategory !== cat.id) e.currentTarget.style.borderColor = cat.color + '44' }}
                onMouseLeave={e => { if (selectedCategory !== cat.id) e.currentTarget.style.borderColor = 'var(--bg4)' }}
              >
                <div style={{ fontSize: 28, marginBottom: 8 }}>{cat.icon}</div>
                <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 4, color: selectedCategory === cat.id ? cat.color : 'var(--text)' }}>
                  {cat.label}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text3)', lineHeight: 1.5 }}>{cat.desc}</div>
                <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 10 }}>
                  {movies.filter(m => m.category === cat.id).length} movies
                </div>
              </div>
            ))}
          </div>

          {/* Movies for selected category */}
          {selectedCategory && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 24, fontWeight: 700 }}>
                  {selectedCategory}
                </h2>
                <button
                  onClick={() => setSelectedCategory(null)}
                  style={{ background: 'transparent', border: '1px solid var(--bg4)', borderRadius: 6, padding: '5px 12px', fontSize: 12, color: 'var(--text2)', cursor: 'pointer' }}
                >
                  Clear ✕
                </button>
              </div>
              {filteredMovies.length === 0 ? (
                <p style={{ color: 'var(--text2)' }}>No movies in this category yet. Check back soon!</p>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(148px, 1fr))', gap: 14 }}>
                  {filteredMovies.map(m => (
                    <MovieCard key={m.id} movie={m} onClick={setSelectedMovie} />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {selectedMovie && (
        <MovieModal
          movie={selectedMovie}
          onClose={() => setSelectedMovie(null)}
          onPlay={m => router.push(`/watch/${m.id}`)}
        />
      )}
      <ToastContainer />
    </>
  )
}
