// pages/m/[movieId].js — Public shareable movie page
// Server-rendered specifically so WhatsApp/Twitter/Facebook link previews
// actually show the poster and title (client-only rendering can't be read
// by social media crawlers, which is why this uses getServerSideProps
// instead of the useEffect-fetch pattern most other pages use).
import Head from 'next/head'
import Link from 'next/link'
import { createClient } from '@supabase/supabase-js'

export async function getServerSideProps({ params }) {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
  const { data: movie } = await supabase
    .from('movies')
    .select('id, title, year, category, description, thumbnail_url')
    .eq('id', params.movieId)
    .eq('is_active', true) // public RLS policy only allows active movies anyway
    .single()

  if (!movie) return { notFound: true }
  return { props: { movie } }
}

export default function MovieShare({ movie }) {
  const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://nollyvault.vercel.app'
  const shareUrl = `${siteUrl}/m/${movie.id}`

  return (
    <>
      <Head>
        <title>{movie.title} — NaijaRewind</title>
        <meta name="description" content={movie.description || `Watch ${movie.title} on NaijaRewind`} />
        <meta property="og:title" content={`${movie.title} (${movie.year})`} />
        <meta property="og:description" content={movie.description || `Watch the classic Nollywood film "${movie.title}" on NaijaRewind.`} />
        {movie.thumbnail_url && <meta property="og:image" content={movie.thumbnail_url} />}
        <meta property="og:url" content={shareUrl} />
        <meta property="og:type" content="video.movie" />
        <meta name="twitter:card" content="summary_large_image" />
      </Head>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@400;500;600&display=swap');
        :root{--gold:#c8a84b;--bg:#080808;--bg2:#111;--text:#f0ede6;--text2:#9a9590;}
        *,*::before,*::after{box-sizing:border-box;}
        body{font-family:'DM Sans',sans-serif;background:var(--bg);color:var(--text);margin:0;}
      `}</style>
      <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',padding:24,backgroundImage:movie.thumbnail_url?`linear-gradient(rgba(8,8,8,0.85),rgba(8,8,8,0.97)),url(${movie.thumbnail_url})`:'none',backgroundSize:'cover',backgroundPosition:'center'}}>
        <div style={{textAlign:'center',maxWidth:480}}>
          <div style={{fontFamily:"'Playfair Display',serif",fontSize:20,fontWeight:900,color:'var(--gold)',marginBottom:32}}>
            Naija<span style={{color:'var(--text)'}}>Rewind</span>
          </div>
          {movie.thumbnail_url && (
            <img src={movie.thumbnail_url} alt={movie.title} style={{width:180,borderRadius:12,marginBottom:24,boxShadow:'0 12px 40px rgba(0,0,0,0.6)'}} />
          )}
          <h1 style={{fontFamily:"'Playfair Display',serif",fontSize:28,fontWeight:900,marginBottom:8}}>{movie.title}</h1>
          <div style={{color:'var(--text2)',fontSize:14,marginBottom:16}}>{movie.year} · {movie.category}</div>
          {movie.description && <p style={{color:'var(--text2)',fontSize:14,lineHeight:1.7,marginBottom:28}}>{movie.description}</p>}
          <Link href={`/watch/${movie.id}`}>
            <button style={{background:'var(--gold)',color:'#000',border:'none',borderRadius:8,padding:'14px 32px',fontWeight:600,fontSize:15,cursor:'pointer',fontFamily:'inherit'}}>
              Watch on NaijaRewind
            </button>
          </Link>
        </div>
      </div>
    </>
  )
}
