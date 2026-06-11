import { useState, useEffect, createContext, useContext } from 'react'
import Head from 'next/head'
import '../styles/globals.css'

export const SupabaseContext = createContext({ supabase: null, session: null })
export const useSupabaseClient = () => useContext(SupabaseContext).supabase
export const useSession = () => useContext(SupabaseContext).session

export default function App({ Component, pageProps }) {
  const [supabase, setSupabase] = useState(null)
  const [session, setSession] = useState(null)
  const [ready, setReady] = useState(false)

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

    import('@supabase/supabase-js').then(({ createClient }) => {
      const client = createClient(url, key)
      setSupabase(client)
      client.auth.getSession().then(({ data: { session } }) => {
        setSession(session)
        setReady(true)
      })
      const { data: { subscription } } = client.auth.onAuthStateChange((_e, s) => setSession(s))
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
