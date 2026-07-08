// pages/index.js  — Public landing page (waitlist + marketing)
import { useState } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'

const CLASSICS = [
  'Living in Bondage', 'Karishika', 'Glamour Girls', 'Nneka the Pretty Serpent',
  'Blood Money', 'Rattlesnake', 'Issakaba', 'Domitilla', 'End of the Wicked',
  'Most Wanted', 'Egg of Life', 'Tears in My Eyes',
]

const TESTIMONIALS = [
  { name: 'Adaeze O.', location: 'London, UK', text: 'I have been looking for Karishika online for years. Finally found it in one place with good quality. This brought back my entire childhood.' },
  { name: 'Emeka T.', location: 'Houston, TX', text: 'My kids had no idea what real Nollywood looked like. We watched Living in Bondage together and they were speechless.' },
  { name: 'Ngozi M.', location: 'Lagos', text: 'The Watch Party feature is everything. My sister in Canada and I watched Glamour Girls together like the old days.' },
]

const FAQS = [
  { q: 'How many movies are available?', a: 'We\'re launching with 50+ licensed classics from the 90s and early 2000s, with new titles added monthly as we secure rights.' },
  { q: 'Can I watch on my TV?', a: 'Yes. NaijaRewind works on any browser — including smart TV browsers. Mobile apps for iOS and Android are coming soon.' },
  { q: 'How do I pay from outside Nigeria?', a: 'International subscribers pay in USD via Stripe. We accept all major cards. Pricing is the same value, just in your currency.' },
  { q: 'What if a movie I want isn\'t available?', a: 'Request it. We have a request list and actively negotiate with producers. The more requests a title gets, the faster we move on licensing it.' },
  { q: 'Can I download movies to watch offline?', a: 'Offline downloads are available on Premium (₦3,000) and Family & Friends (₦5,000) plans.' },
  { q: 'What is a Watch Party?', a: 'A Watch Party lets you and friends or family watch the same movie in sync, from different locations. Chat alongside. Pause together. Available on the Family & Friends plan.' },
]

export default function Landing() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [openFaq, setOpenFaq] = useState(null)

  const handleWaitlist = async (e) => {
    e.preventDefault()
    // In production: POST to /api/waitlist which saves to Supabase
    setSubmitted(true)
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,700&family=DM+Sans:wght@300;400;500;600&display=swap');
        :root{--gold:#c8a84b;--gold-light:#e8c96e;--gold-dim:#7a6530;--bg:#080808;--bg2:#111;--bg3:#1a1a1a;--bg4:#222;--text:#f0ede6;--text2:#9a9590;--text3:#5a5550;--green:#4ace8a;--purple:#7b68ee;--radius:8px;--radius-lg:14px;}
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
        html{scroll-behavior:smooth;}
        body{font-family:'DM Sans',sans-serif;background:var(--bg);color:var(--text);-webkit-font-smoothing:antialiased;overflow-x:hidden;}
        a{color:inherit;text-decoration:none;}
        .btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;padding:12px 24px;border-radius:var(--radius);font-size:15px;font-weight:600;cursor:pointer;border:none;transition:.2s;font-family:'DM Sans',sans-serif;}
        .btn-gold{background:var(--gold);color:#000;} .btn-gold:hover{background:var(--gold-light);}
        .btn-outline{background:transparent;color:var(--text);border:1.5px solid rgba(255,255,255,.18);} .btn-outline:hover{background:rgba(255,255,255,.07);}
        .section{padding:80px 20px;max-width:1100px;margin:0 auto;}
        .section-label{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:var(--gold);margin-bottom:12px;}
        .section-title{font-family:'Playfair Display',serif;font-size:38px;font-weight:900;line-height:1.15;margin-bottom:14px;}
        .section-sub{font-size:16px;color:var(--text2);line-height:1.65;max-width:540px;}
        @media(max-width:640px){.section-title{font-size:28px;} .section{padding:56px 16px;}}
        .card{background:var(--bg2);border:1px solid var(--bg4);border-radius:var(--radius-lg);}
        ::-webkit-scrollbar{width:4px;height:4px;}
        ::-webkit-scrollbar-thumb{background:var(--bg4);border-radius:2px;}
        @keyframes fadeUp{from{opacity:0;transform:translateY(20px);}to{opacity:1;transform:translateY(0);}}
        @keyframes ticker{0%{transform:translateX(0);}100%{transform:translateX(-50%);}}
        .fade-up{animation:fadeUp .6s ease both;}
      `}</style>

      {/* ── NAV ──────────────────────────────────────────────────────────────── */}
      <nav style={{
        position:'fixed',top:0,left:0,right:0,zIndex:100,
        display:'flex',alignItems:'center',padding:'0 24px',height:60,
        background:'rgba(8,8,8,0.92)',backdropFilter:'blur(12px)',
        borderBottom:'1px solid var(--bg4)',
      }}>
        <div style={{fontFamily:"'Playfair Display',serif",fontSize:22,fontWeight:900,color:'var(--gold)'}}>
          Naija<span style={{color:'var(--text)'}}>Rewind</span>
        </div>
        <div style={{flex:1}}/>
        <div style={{display:'flex',gap:10,alignItems:'center'}}>
          <Link href="/veterans"><span style={{fontSize:13,color:'var(--gold)',cursor:'pointer',fontWeight:500,marginRight:4}}>🎬 The Legends</span></Link>
          <Link href="/login"><button className="btn btn-outline" style={{padding:'7px 18px',fontSize:13}}>Sign In</button></Link>
          <Link href="/signup"><button className="btn btn-gold" style={{padding:'7px 18px',fontSize:13}}>Get Started</button></Link>
        </div>
      </nav>

      {/* ── HERO ─────────────────────────────────────────────────────────────── */}
      <div style={{
        minHeight:'100vh',display:'flex',flexDirection:'column',alignItems:'center',
        justifyContent:'center',textAlign:'center',padding:'100px 20px 60px',
        background:'radial-gradient(ellipse at 50% 30%, rgba(200,168,75,0.1) 0%, transparent 60%), radial-gradient(ellipse at 20% 80%, rgba(123,104,238,0.07) 0%, transparent 50%)',
        position:'relative',overflow:'hidden',
      }}>
        {/* Film grain texture */}
        <div style={{
          position:'absolute',inset:0,opacity:.03,
          backgroundImage:"url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
          pointerEvents:'none',
        }}/>

        <div className="fade-up" style={{animationDelay:'.1s'}}>
          <div style={{
            display:'inline-flex',alignItems:'center',gap:8,
            background:'rgba(200,168,75,0.1)',border:'1px solid var(--gold-dim)',
            borderRadius:20,padding:'5px 14px',fontSize:12,fontWeight:600,
            color:'var(--gold)',letterSpacing:'.07em',textTransform:'uppercase',marginBottom:24,
          }}>
            <span style={{width:6,height:6,borderRadius:'50%',background:'var(--gold)',display:'inline-block'}}/>
            Now Streaming Classic Nollywood
          </div>
        </div>

        <h1 className="fade-up" style={{
          fontFamily:"'Playfair Display',serif",fontSize:'clamp(36px,6vw,72px)',
          fontWeight:900,lineHeight:1.08,marginBottom:20,
          animationDelay:'.2s',maxWidth:760,
        }}>
          The Golden Era of<br/>
          <span style={{color:'var(--gold)',fontStyle:'italic'}}>Nollywood</span><br/>
          All in One Place
        </h1>

        <p className="fade-up" style={{
          fontSize:18,color:'var(--text2)',lineHeight:1.7,
          maxWidth:520,marginBottom:36,animationDelay:'.3s',
        }}>
          Living in Bondage. Karishika. Glamour Girls. Rattlesnake.
          The movies you grew up with — finally in one home, streaming on demand.
        </p>

        {/* Waitlist / CTA */}
        <div className="fade-up" style={{animationDelay:'.4s'}}>
          {submitted ? (
            <div style={{
              background:'rgba(74,206,138,0.1)',border:'1px solid rgba(74,206,138,0.3)',
              borderRadius:12,padding:'16px 28px',fontSize:15,color:'var(--green)',
            }}>
              ✓ You're on the list! We'll email you when we launch.
            </div>
          ) : (
            <form onSubmit={handleWaitlist} style={{display:'flex',gap:10,flexWrap:'wrap',justifyContent:'center'}}>
              <input
                type="email" required value={email} onChange={e=>setEmail(e.target.value)}
                placeholder="Enter your email"
                style={{
                  background:'var(--bg2)',border:'1px solid var(--bg4)',borderRadius:8,
                  padding:'12px 18px',fontSize:15,color:'var(--text)',outline:'none',
                  width:280,fontFamily:'inherit',
                }}
              />
              <button type="submit" className="btn btn-gold">
                Join the Waitlist
                <svg viewBox="0 0 24 24" width={16} height={16} fill="currentColor"><path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z"/></svg>
              </button>
            </form>
          )}
          <div style={{fontSize:12,color:'var(--text3)',marginTop:12}}>
            Already a member? <Link href="/login"><span style={{color:'var(--gold)',cursor:'pointer'}}>Sign in →</span></Link>
          </div>
        </div>

        {/* Social proof */}
        <div className="fade-up" style={{marginTop:48,display:'flex',gap:32,flexWrap:'wrap',justifyContent:'center',animationDelay:'.5s'}}>
          {[['2,000+','on the waitlist'],['50+','classic movies'],['90s–2000s','golden era'],].map(([val,lab])=>(
            <div key={lab} style={{textAlign:'center'}}>
              <div style={{fontFamily:"'Playfair Display',serif",fontSize:28,fontWeight:900,color:'var(--gold)'}}>{val}</div>
              <div style={{fontSize:13,color:'var(--text3)',marginTop:2}}>{lab}</div>
            </div>
          ))}
        </div>

        {/* Legacy Fund ticker */}
        <div className="fade-up" style={{marginTop:28,animationDelay:'.6s'}}>
          <div style={{display:'inline-flex',alignItems:'center',gap:8,background:'rgba(74,206,138,0.08)',border:'1px solid rgba(74,206,138,0.2)',borderRadius:8,padding:'10px 20px',fontSize:13,color:'var(--text2)'}}>
            <span style={{width:7,height:7,borderRadius:'50%',background:'var(--green)',display:'inline-block',animation:'pulse 2s infinite'}}/>
            <span style={{color:'var(--green)',fontWeight:600}}>Legacy Fund Active</span>
            · 10% of every subscription is allocated to the NaijaRewind Legacy Fund
            <Link href="/veterans"><span style={{color:'var(--gold)',cursor:'pointer',fontWeight:500,marginLeft:4}}>Learn more →</span></Link>
          </div>
        </div>
      </div>

      {/* ── SCROLLING TITLE TICKER ────────────────────────────────────────────── */}
      <div style={{background:'var(--bg2)',borderTop:'1px solid var(--bg4)',borderBottom:'1px solid var(--bg4)',overflow:'hidden',padding:'14px 0'}}>
        <div style={{display:'flex',gap:0,animation:'ticker 25s linear infinite',width:'max-content'}}>
          {[...CLASSICS,...CLASSICS].map((title,i)=>(
            <span key={i} style={{
              fontSize:13,fontWeight:500,color:'var(--text3)',whiteSpace:'nowrap',
              padding:'0 28px',borderRight:'1px solid var(--bg4)',
            }}>
              {title}
            </span>
          ))}
        </div>
      </div>


      {/* ── FREE PREVIEWS ────────────────────────────────────────────────────── */}
      <div style={{background:'var(--bg2)',borderTop:'1px solid var(--bg4)',padding:'80px 20px'}}>
        <div style={{maxWidth:1100,margin:'0 auto'}}>
          <div style={{textAlign:'center',marginBottom:44}}>
            <div className="section-label">Watch Before You Subscribe</div>
            <h2 className="section-title" style={{margin:'0 auto 10px'}}>A taste of the golden era</h2>
            <p style={{color:'var(--text2)',fontSize:15,maxWidth:480,margin:'0 auto'}}>
              Watch these free previews. When you're ready for the full films, subscribe.
            </p>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(300px,1fr))',gap:20}}>
            {[
              {title:'Living in Bondage — Trailer',year:1992,youtubeId:'placeholder_1',desc:'The film that started it all.'},
              {title:'Karishika — Official Clip',year:1996,youtubeId:'placeholder_2',desc:'The demon queen of Nollywood.'},
              {title:'Glamour Girls — Scene',year:1994,youtubeId:'placeholder_3',desc:'The iconic Lagos story.'},
            ].map(v=>(
              <div key={v.title} style={{borderRadius:'var(--radius-lg)',overflow:'hidden',background:'var(--bg3)',border:'1px solid var(--bg4)'}}>
                {/* YouTube embed — replace youtubeId with real IDs from your channel */}
                <div style={{position:'relative',paddingBottom:'56.25%',background:'#000'}}>
                  {v.youtubeId === 'placeholder_1' || v.youtubeId === 'placeholder_2' || v.youtubeId === 'placeholder_3' ? (
                    <div style={{position:'absolute',inset:0,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:12,background:'linear-gradient(135deg,#1a0a00,#0a0a1a)'}}>
                      <div style={{width:56,height:56,borderRadius:'50%',background:'var(--gold)',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',opacity:.8}}>
                        <svg viewBox="0 0 24 24" width={24} height={24} fill="#000"><path d="M8 5v14l11-7z"/></svg>
                      </div>
                      <div style={{fontSize:12,color:'var(--text3)',textAlign:'center',padding:'0 16px'}}>
                        Upload clip to YouTube → paste video ID here
                      </div>
                    </div>
                  ) : (
                    <iframe
                      style={{position:'absolute',inset:0,width:'100%',height:'100%',border:'none'}}
                      src={`https://www.youtube.com/embed/${v.youtubeId}?rel=0&modestbranding=1`}
                      title={v.title}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  )}
                </div>
                <div style={{padding:'14px 16px'}}>
                  <div style={{fontWeight:600,fontSize:15,marginBottom:3}}>{v.title}</div>
                  <div style={{fontSize:12,color:'var(--text3)',marginBottom:8}}>{v.year} · Classic Nollywood</div>
                  <div style={{fontSize:13,color:'var(--text2)'}}>{v.desc}</div>
                </div>
              </div>
            ))}
          </div>
          <div style={{textAlign:'center',marginTop:36}}>
            <Link href="/signup">
              <button className="btn btn-gold" style={{fontSize:15,padding:'12px 28px'}}>
                Subscribe to watch full films →
              </button>
            </Link>
          </div>
        </div>
      </div>

      {/* ── WHY NOLLYVAULT ────────────────────────────────────────────────────── */}
      <div className="section" style={{paddingBottom:20}}>
        <div style={{textAlign:'center',marginBottom:56}}>
          <div className="section-label">Why NaijaRewind</div>
          <h2 className="section-title" style={{margin:'0 auto 14px'}}>Everything wrong with how<br/>you've been watching classic Nollywood</h2>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(240px,1fr))',gap:14}}>
          {[
            {icon:'😤',title:'Scattered across YouTube',desc:'Different channels, missing parts, terrible quality. You spend 20 minutes searching instead of watching.'},
            {icon:'📼',title:'VHS copies of copies',desc:'Grainy, washed out. The movie you remember deserves better than a 4th-generation cassette transfer.'},
            {icon:'🚫',title:'No legal way to pay',desc:'Piracy hurts the producers who made these films. NaijaRewind gives you a clean, legal home — and pays royalties.'},
            {icon:'🌍',title:'Diaspora left out',desc:'You\'re in London or Houston and can\'t find what you grew up with. NaijaRewind works anywhere in the world.'},
          ].map(f=>(
            <div key={f.title} className="card" style={{padding:'22px 20px'}}>
              <div style={{fontSize:28,marginBottom:10}}>{f.icon}</div>
              <div style={{fontWeight:600,fontSize:15,marginBottom:6}}>{f.title}</div>
              <div style={{fontSize:13,color:'var(--text2)',lineHeight:1.65}}>{f.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── FEATURES ─────────────────────────────────────────────────────────── */}
      <div className="section">
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(300px,1fr))',gap:48,alignItems:'center'}}>
          <div>
            <div className="section-label">Features</div>
            <h2 className="section-title">Built for how Nigerians<br/>actually watch</h2>
            <div style={{display:'flex',flexDirection:'column',gap:18,marginTop:28}}>
              {[
                {icon:'🎬',title:'Full catalog, one subscription','desc':'No per-movie fees. Pay once a month, watch everything.'},
                {icon:'👨‍👩‍👧‍👦',title:'Family Profiles','desc':'Up to 5 profiles per account. Everyone keeps their own watchlist and continue-watching.'},
                {icon:'🎉',title:'Watch Parties','desc':'Watch in sync with people anywhere in the world. Chat side by side. Pause together.'},
                {icon:'💕',title:'Date Night Mode','desc':'A private, intimate watch party for two. Curated romance selections included.'},
                {icon:'📱',title:'Download for offline','desc':'Save movies for flights, bad network days, or travel. Available on Premium and Family plans.'},
                {icon:'🌍',title:'Works everywhere','desc':'Nigeria, UK, US, Canada — stream from any country. Pay in naira or dollars.'},
              ].map(f=>(
                <div key={f.title} style={{display:'flex',gap:14,alignItems:'flex-start'}}>
                  <div style={{fontSize:22,flexShrink:0,marginTop:2}}>{f.icon}</div>
                  <div>
                    <div style={{fontWeight:600,fontSize:15,marginBottom:2}}>{f.title}</div>
                    <div style={{fontSize:13,color:'var(--text2)',lineHeight:1.6}}>{f.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          {/* Visual mockup */}
          <div style={{
            background:'linear-gradient(135deg,#1a0a00,#0a0a1a)',
            borderRadius:16,border:'1px solid var(--bg4)',
            padding:'28px 24px',minHeight:360,position:'relative',overflow:'hidden',
          }}>
            <div style={{position:'absolute',inset:0,background:'radial-gradient(ellipse at 60% 30%,rgba(200,168,75,0.12) 0%,transparent 65%)',pointerEvents:'none'}}/>
            <div style={{fontFamily:"'Playfair Display',serif",fontSize:18,fontWeight:700,marginBottom:20,color:'var(--gold)'}}>Trending This Week</div>
            {CLASSICS.slice(0,5).map((title,i)=>(
              <div key={title} style={{
                display:'flex',alignItems:'center',gap:12,padding:'10px 0',
                borderBottom:i<4?'1px solid var(--bg4)':'none',
              }}>
                <div style={{
                  width:36,height:50,borderRadius:5,background:`hsl(${30+i*25},60%,${12+i*2}%)`,
                  flexShrink:0,border:'1px solid var(--bg4)',
                }}/>
                <div>
                  <div style={{fontSize:14,fontWeight:500}}>{title}</div>
                  <div style={{fontSize:12,color:'var(--text3)',marginTop:2}}>{1992+i*2} · Classic Nollywood</div>
                </div>
                <div style={{marginLeft:'auto'}}>
                  <div style={{
                    width:30,height:30,borderRadius:'50%',background:'var(--gold)',
                    display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',
                  }}>
                    <svg viewBox="0 0 24 24" width={14} height={14} fill="#000"><path d="M8 5v14l11-7z"/></svg>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── PRICING SUMMARY ───────────────────────────────────────────────────── */}
      <div style={{background:'var(--bg2)',borderTop:'1px solid var(--bg4)',borderBottom:'1px solid var(--bg4)',padding:'80px 20px'}}>
        <div style={{maxWidth:900,margin:'0 auto',textAlign:'center'}}>
          <div className="section-label">Pricing</div>
          <h2 className="section-title" style={{margin:'0 auto 10px'}}>Simple, honest pricing</h2>
          <p style={{color:'var(--text2)',fontSize:15,marginBottom:44}}>No ads. No per-movie fees. Cancel anytime.</p>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(240px,1fr))',gap:14,marginBottom:32}}>
            {[
              {name:'Classic',price:'₦1,500',usd:'$4.99',desc:'Full catalog · 1 device · Standard quality',color:'var(--gold)'},
              {name:'Premium',price:'₦3,000',usd:'$9.99',desc:'HD · 3 devices · Offline downloads',color:'#e8e8e8',popular:true},
              {name:'Family & Friends',price:'₦5,000',usd:'$14.99',desc:'Watch Parties · Date Night · 5 devices · Family Profiles',color:'var(--purple)'},
            ].map(t=>(
              <div key={t.name} className="card" style={{padding:'24px',position:'relative',borderColor:t.popular?'var(--gold)':'var(--bg4)'}}>
                {t.popular && <div style={{position:'absolute',top:-10,left:'50%',transform:'translateX(-50%)',background:'var(--gold)',color:'#000',fontSize:10,fontWeight:800,padding:'3px 14px',borderRadius:20,whiteSpace:'nowrap',textTransform:'uppercase',letterSpacing:'.07em'}}>Most Popular</div>}
                <div style={{fontSize:12,fontWeight:600,color:'var(--text2)',textTransform:'uppercase',letterSpacing:'.09em',marginBottom:8}}>{t.name}</div>
                <div style={{fontFamily:"'Playfair Display',serif",fontSize:34,fontWeight:900,color:t.color}}>{t.price}</div>
                <div style={{fontSize:12,color:'var(--text3)',marginBottom:14}}>{t.usd} · per month</div>
                <div style={{fontSize:13,color:'var(--text2)',lineHeight:1.6,marginBottom:20}}>{t.desc}</div>
                <Link href="/signup"><button className="btn" style={{width:'100%',background:t.color,color:t.name==='Family & Friends'?'#fff':'#000',fontSize:14}}>Get Started</button></Link>
              </div>
            ))}
          </div>
          <div style={{fontSize:13,color:'var(--text3)'}}>Pay with Paystack (Nigeria) or Stripe (Diaspora) · Secure payments · No hidden fees</div>
        </div>
      </div>

      {/* ── TESTIMONIALS ─────────────────────────────────────────────────────── */}
      <div className="section">
        <div style={{textAlign:'center',marginBottom:44}}>
          <div className="section-label">Early Access</div>
          <h2 className="section-title">What our beta users say</h2>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(260px,1fr))',gap:14}}>
          {TESTIMONIALS.map(t=>(
            <div key={t.name} className="card" style={{padding:'24px'}}>
              <div style={{fontSize:28,color:'var(--gold)',marginBottom:14,fontFamily:'serif'}}>"</div>
              <p style={{fontSize:14,color:'var(--text2)',lineHeight:1.7,marginBottom:18}}>{t.text}</p>
              <div style={{fontWeight:600,fontSize:14}}>{t.name}</div>
              <div style={{fontSize:12,color:'var(--text3)',marginTop:2}}>{t.location}</div>
            </div>
          ))}
        </div>
      </div>


      {/* ── LEGACY FUND & VETERANS ───────────────────────────────────────────── */}
      <div style={{background:'linear-gradient(135deg,#060a04,#040800)',borderTop:'1px solid rgba(74,206,138,0.15)',borderBottom:'1px solid rgba(74,206,138,0.15)',padding:'80px 20px'}}>
        <div style={{maxWidth:1000,margin:'0 auto'}}>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(300px,1fr))',gap:48,alignItems:'center'}}>
            <div>
              <div style={{fontSize:11,fontWeight:700,textTransform:'uppercase',letterSpacing:'.1em',color:'var(--green)',marginBottom:12}}>Veterans Legacy Fund</div>
              <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:'clamp(24px,4vw,36px)',fontWeight:900,lineHeight:1.2,marginBottom:16}}>
                Giving back to the people<br/>who built Nollywood
              </h2>
              <p style={{fontSize:15,color:'var(--text2)',lineHeight:1.75,marginBottom:24}}>
                The actors who gave us Living in Bondage, Karishika, and Glamour Girls don't always benefit 
                from the fame their work created. NaijaRewind allocates 10% of every subscription to a Legacy Fund — 
                accumulating month by month, ready to be paid directly to verified veteran actors.
              </p>
              <div style={{display:'flex',gap:20,marginBottom:28,flexWrap:'wrap'}}>
                {[['10%','of every subscription'],['₦320k+','held for veterans'],['8','actors registered']].map(([v,l])=>(
                  <div key={l}>
                    <div style={{fontFamily:"'Playfair Display',serif",fontSize:26,fontWeight:900,color:'var(--green)'}}>{v}</div>
                    <div style={{fontSize:12,color:'var(--text3)',marginTop:2}}>{l}</div>
                  </div>
                ))}
              </div>
              <Link href="/veterans">
                <button className="btn" style={{background:'var(--green)',color:'#000',fontSize:14,padding:'10px 22px'}}>
                  Meet the Legends →
                </button>
              </Link>
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:12}}>
              {[
                {name:'Pete Edochie',role:'Lead · Living in Bondage, Blood Money',pts:'5 pts/film'},
                {name:'Kanayo O. Kanayo',role:'Lead · Living in Bondage, Blood Money, Ritual',pts:'5 pts/film'},
                {name:'Patience Ozokwor',role:'Lead · Tears in My Eyes',pts:'5 pts/film'},
                {name:'Ngozi Ezeonu',role:'Lead · Most Wanted, Battle of Musanga',pts:'5 pts/film'},
              ].map(a=>(
                <div key={a.name} style={{background:'rgba(74,206,138,0.06)',border:'1px solid rgba(74,206,138,0.15)',borderRadius:10,padding:'14px 16px',display:'flex',alignItems:'center',gap:14}}>
                  <div style={{width:40,height:40,borderRadius:'50%',background:'rgba(74,206,138,0.15)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:14,fontWeight:700,color:'var(--green)',flexShrink:0}}>
                    {a.name.split(' ').map(n=>n[0]).join('').slice(0,2)}
                  </div>
                  <div style={{flex:1}}>
                    <div style={{fontWeight:600,fontSize:14}}>{a.name}</div>
                    <div style={{fontSize:12,color:'var(--text3)',marginTop:2}}>{a.role}</div>
                  </div>
                  <div style={{fontSize:11,color:'var(--green)',fontWeight:600,flexShrink:0}}>{a.pts}</div>
                </div>
              ))}
              <div style={{fontSize:12,color:'var(--text3)',textAlign:'center',paddingTop:4}}>
                + 4 more veteran actors registered · Allocations accumulating monthly
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── FAQ ──────────────────────────────────────────────────────────────── */}
      <div style={{background:'var(--bg2)',borderTop:'1px solid var(--bg4)',padding:'80px 20px'}}>
        <div style={{maxWidth:680,margin:'0 auto'}}>
          <div style={{textAlign:'center',marginBottom:44}}>
            <div className="section-label">FAQ</div>
            <h2 className="section-title">Common questions</h2>
          </div>
          {FAQS.map((faq,i)=>(
            <div key={i} style={{borderBottom:'1px solid var(--bg4)',padding:'16px 0',cursor:'pointer'}} onClick={()=>setOpenFaq(openFaq===i?null:i)}>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:12}}>
                <div style={{fontWeight:600,fontSize:15}}>{faq.q}</div>
                <div style={{color:'var(--gold)',flexShrink:0,transition:'transform .2s',transform:openFaq===i?'rotate(45deg)':'none',fontSize:22,lineHeight:1}}>+</div>
              </div>
              {openFaq===i && (
                <div style={{fontSize:14,color:'var(--text2)',lineHeight:1.7,marginTop:12,paddingRight:24}}>
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── FINAL CTA ────────────────────────────────────────────────────────── */}
      <div style={{
        textAlign:'center',padding:'100px 20px',
        background:'radial-gradient(ellipse at 50% 50%,rgba(200,168,75,0.1) 0%,transparent 65%)',
      }}>
        <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:'clamp(28px,5vw,52px)',fontWeight:900,lineHeight:1.15,marginBottom:16}}>
          The classics deserve<br/>a proper home.
        </h2>
        <p style={{fontSize:16,color:'var(--text2)',marginBottom:36,maxWidth:420,margin:'0 auto 36px'}}>
          Join thousands of Nigerians and diaspora members already on the waitlist.
        </p>
        <Link href="/signup">
          <button className="btn btn-gold" style={{fontSize:16,padding:'14px 32px'}}>
            Start Watching
            <svg viewBox="0 0 24 24" width={18} height={18} fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
          </button>
        </Link>
      </div>

      {/* ── FOOTER ───────────────────────────────────────────────────────────── */}
      <footer style={{background:'var(--bg2)',borderTop:'1px solid var(--bg4)',padding:'32px 24px'}}>
        <div style={{maxWidth:1100,margin:'0 auto',display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:16}}>
          <div style={{fontFamily:"'Playfair Display',serif",fontSize:18,fontWeight:900,color:'var(--gold)'}}>
            Naija<span style={{color:'var(--text)'}}>Rewind</span>
            <div style={{fontSize:11,color:'var(--text3)',fontFamily:'DM Sans',fontWeight:400,marginTop:3}}>The Home of Classic Nollywood</div>
          </div>
          <div style={{display:'flex',gap:24,fontSize:13,color:'var(--text3)',flexWrap:'wrap'}}>
            {/* Pricing, Advertise, and Retro Ads have real pages, so they're
                genuine links now instead of decorative spans. About, Contact,
                Terms, and Privacy don't have pages yet — flagged, not faked. */}
            {[
              { label: 'About' },
              { label: 'Pricing',   href: '/pricing' },
              { label: 'Advertise', href: '/advertise' },
              { label: 'Partners',  href: '/partners' },
              { label: 'Retro Ads', href: '/retro-ads' },
              { label: 'Contact' },
              { label: 'Terms' },
              { label: 'Privacy' },
            ].map(l => l.href ? (
              <Link key={l.label} href={l.href}>
                <span style={{cursor:'pointer'}}>{l.label}</span>
              </Link>
            ) : (
              <span key={l.label} style={{cursor:'default',opacity:0.5}} title="Page not built yet">{l.label}</span>
            ))}
          </div>
          <div style={{fontSize:12,color:'var(--text3)'}}>© {new Date().getFullYear()} NaijaRewind. All rights reserved.</div>
        </div>
      </footer>
    </>
  )
}
