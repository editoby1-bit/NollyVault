import { useState, useEffect, useRef, createContext, useContext } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import '../styles/globals.css'

export const SupabaseContext = createContext({ supabase: null, session: null })
export const useSupabaseClient = () => useContext(SupabaseContext).supabase
export const useSession = () => useContext(SupabaseContext).session

// Pages that don't require a session — everything else is treated as
// protected. If a session unexpectedly disappears (refresh token expired or
// revoked, user signed out in another tab, etc.) while on a protected page,
// we send them to /login with a redirect param so they land back exactly
// where they were after signing back in, instead of just silently breaking
// or dumping them on the homepage with no context.
const PUBLIC_PATHS = ['/', '/login', '/signup', '/forgot-password', '/reset-password', '/pricing', '/advertise', '/partners']

export default function App({ Component, pageProps }) {
  const router = useRouter()
  const [supabase, setSupabase] = useState(null)
  const [session, setSession] = useState(null)
  const [ready, setReady] = useState(false)
  const hadSession = useRef(false)

  useEffect(() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    const hasReal = url && key && !url.includes('placeholder') && !key.includes('placeholder')

    if (!hasReal) {
      // Demo mode — no Supabase, run on mock data
      console.info('NaijaRewind: running in demo mode (no Supabase env vars)')
      setReady(true)
      return
    }

    // Use the cookie-syncing browser client, not plain createClient() from
    // supabase-js — that version only stores the session in localStorage,
    // which server-side API routes (admin gating, progress tracking,
    // referrals, watch parties, etc.) can't read at all, since they check
    // cookies via createServerSupabaseClient(). Without this, every
    // server-side "is this user logged in / are they an admin" check
    // silently sees no session, for everyone, regardless of credentials.
    import('../lib/supabase').then(({ createBrowserSupabaseClient }) => {
      const client = createBrowserSupabaseClient()
      setSupabase(client)
      client.auth.getSession().then(({ data: { session } }) => {
        setSession(session)
        hadSession.current = !!session
        setReady(true)
      })
      const { data: { subscription } } = client.auth.onAuthStateChange((event, s) => {
        setSession(s)
        if (hadSession.current && !s && !PUBLIC_PATHS.includes(router.pathname)) {
          router.push(`/login?redirect=${encodeURIComponent(router.asPath)}`)
        }
        hadSession.current = !!s
      })
      return () => subscription.unsubscribe()
    })
  }, [])

  if (!ready) return (
    <div style={{ minHeight: '100vh', background: '#080808', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ fontFamily: 'Georgia, serif', fontSize: 22, color: '#c8a84b', letterSpacing: 1 }}>
        Nolly<span style={{ color: '#f0ede6' }}>Vault</span>
      </div>
    </div>
  )

  return (
    <SupabaseContext.Provider value={{ supabase, session }}>
      <Head>
        <title>NaijaRewind — The Home of Classic Nollywood</title>
        <meta name="description" content="Watch the greatest Nollywood classics from the 90s and 2000s in one place. Relive the golden era." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta property="og:title" content="NaijaRewind — Classic Nollywood Streaming" />
        <meta property="og:description" content="Living in Bondage. Karishika. Glamour Girls. All in one place." />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
      </Head>
      <Component {...pageProps} />
    </SupabaseContext.Provider>
  )
}
