// components/Nav.jsx
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { useSession, useSupabaseClient } from '../pages/_app'

export default function Nav({ activeProfile, onProfileClick, onSearch }) {
  const router = useRouter()
  const supabase = useSupabaseClient()
  const session = useSession()
  const [query, setQuery] = useState('')
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', handler)
    return () => window.removeEventListener('scroll', handler)
  }, [])

  // Only show the ADMIN link to people who actually pass the server-side admin check.
  // Never trust a client-only flag for this — this call re-validates against
  // ADMIN_EMAILS on the server every time the session changes.
  useEffect(() => {
    let cancelled = false
    if (!session) { setIsAdmin(false); return }
    fetch('/api/admin/whoami')
      .then(r => r.ok ? r.json() : { isAdmin: false })
      .then(data => { if (!cancelled) setIsAdmin(!!data.isAdmin) })
      .catch(() => { if (!cancelled) setIsAdmin(false) })
    return () => { cancelled = true }
  }, [session])

  const handleSearch = (e) => {
    const val = e.target.value
    setQuery(val)
    onSearch?.(val)
  }

  // 'Movies' used to point at /movies, a page that was never built (404 on click).
  // Home (/browse) already covers full catalog browsing, so it's removed rather
  // than duplicated. 'Advertise' is added here since it previously had no working
  // entry point anywhere in the main nav.
  const navLinks = [
    { label: 'Home',          href: '/browse' },
    { label: 'Categories',    href: '/categories' },
    { label: 'Watchlist',     href: '/watchlist' },
    { label: 'Watch Parties', href: '/watch-party' },
    { label: '🎬 The Legends', href: '/veterans', gold: true },
    { label: 'Reels',          href: '/reels' },
    { label: '📺 Retro Ads', href: '/retro-ads', gold: false },
    { label: 'Advertise',     href: '/advertise' },
    { label: 'Partners',      href: '/partners' },
  ]

  return (
    <>
      <style>{`
        .nav-link{display:none;}
        @media(min-width:900px){.nav-link{display:inline-flex !important;}}
        .mobile-menu{display:none;}
        @media(max-width:899px){.mobile-menu{display:block;}}
      `}</style>

      <nav style={{
        position:'fixed', top:0, left:0, right:0, zIndex:700,
        height:'var(--nav-height, 64px)',
        display:'flex', alignItems:'center', gap:8,
        padding:'0 20px',
        background: scrolled ? 'rgba(8,8,8,0.97)' : 'linear-gradient(to bottom,rgba(8,8,8,0.95),transparent)',
        backdropFilter: scrolled ? 'blur(12px)' : 'none',
        borderBottom: scrolled ? '1px solid var(--bg4,#222)' : 'none',
        transition:'background 0.3s ease',
      }}>

        {/* Logo */}
        <Link href="/browse">
          <span style={{fontFamily:"'Playfair Display',serif",fontSize:22,fontWeight:900,color:'var(--gold,#c8a84b)',letterSpacing:'-0.5px',cursor:'pointer',flexShrink:0}}>
            Nolly<span style={{color:'var(--text,#f0ede6)'}}>Vault</span>
          </span>
        </Link>

        {/* Desktop nav links */}
        <div style={{display:'flex',gap:2,marginLeft:12,flex:1}}>
          {navLinks.map(l => (
            <Link key={l.href} href={l.href}>
              <span className="nav-link" style={{
                padding:'6px 10px', borderRadius:6, fontSize:13, fontWeight:500, cursor:'pointer',
                color: l.gold ? 'var(--gold,#c8a84b)' : (router.pathname===l.href ? 'var(--text,#f0ede6)' : 'var(--text2,#9a9590)'),
                background: router.pathname===l.href ? 'var(--bg3,#1a1a1a)' : 'transparent',
                transition:'color .2s, background .2s',
                borderBottom: l.gold ? '1px solid var(--gold-dim,#7a6530)' : 'none',
              }}>
                {l.label}
              </span>
            </Link>
          ))}
        </div>

        {/* Search */}
        <div style={{display:'flex',alignItems:'center',gap:6,background:'var(--bg3,#1a1a1a)',border:'1px solid var(--bg4,#222)',borderRadius:20,padding:'5px 12px'}}>
          <svg viewBox="0 0 24 24" width={14} height={14} fill="var(--text3,#5a5550)">
            <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
          </svg>
          <input
            value={query} onChange={handleSearch}
            placeholder="Search movies, actors..."
            style={{background:'transparent',border:'none',outline:'none',color:'var(--text,#f0ede6)',fontSize:13,width:150,fontFamily:'inherit'}}
          />
        </div>

        {/* Profile avatar */}
        {activeProfile && (
          <div onClick={onProfileClick} style={{
            width:34,height:34,borderRadius:8,flexShrink:0,
            display:'flex',alignItems:'center',justifyContent:'center',
            fontSize:13,fontWeight:700,cursor:'pointer',
            background:(activeProfile.avatar_color||'#c8a84b')+'33',
            color:activeProfile.avatar_color||'var(--gold,#c8a84b)',
            border:'2px solid '+(activeProfile.avatar_color||'#c8a84b')+'66',
            transition:'.2s',
          }}>
            {activeProfile.avatar_initials||activeProfile.name?.[0]?.toUpperCase()}
          </div>
        )}

        {/* Admin link — only rendered for verified admins, see whoami check above */}
        {isAdmin && (
          <Link href="/admin">
            <span style={{fontSize:11,color:'var(--gold,#c8a84b)',fontWeight:600,background:'rgba(200,168,75,0.1)',padding:'3px 9px',borderRadius:4,border:'1px solid var(--gold-dim,#7a6530)',cursor:'pointer'}}>
              ADMIN
            </span>
          </Link>
        )}

        {/* Mobile hamburger */}
        <button className="mobile-menu" onClick={()=>setMenuOpen(!menuOpen)}
          style={{background:'transparent',border:'none',color:'var(--text,#f0ede6)',cursor:'pointer',padding:4,marginLeft:4}}>
          <svg viewBox="0 0 24 24" width={22} height={22} fill="currentColor"><path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/></svg>
        </button>
      </nav>

      {/* Mobile dropdown */}
      {menuOpen && (
        <div style={{position:'fixed',top:'var(--nav-height,64px)',left:0,right:0,zIndex:699,background:'rgba(8,8,8,0.98)',backdropFilter:'blur(12px)',borderBottom:'1px solid var(--bg4,#222)',padding:'12px 0'}}>
          {navLinks.map(l => (
            <Link key={l.href} href={l.href}>
              <div onClick={()=>setMenuOpen(false)} style={{padding:'12px 24px',fontSize:15,fontWeight:500,color:l.gold?'var(--gold,#c8a84b)':'var(--text2,#9a9590)',cursor:'pointer',borderBottom:'1px solid var(--bg3,#1a1a1a)'}}>
                {l.label}
              </div>
            </Link>
          ))}
        </div>
      )}
    </>
  )
}
