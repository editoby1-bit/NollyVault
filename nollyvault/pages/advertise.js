// pages/advertise.js — Brand partnership and sponsorship page
import { useState } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'

const PACKAGES = [
  {
    name: 'Pre-Roll Sponsor',
    price: '₦1,500,000',
    period: 'per month',
    color: '#c8a84b',
    icon: '📺',
    description: 'Your 30-second ad plays before every film. Non-skippable for Classic subscribers. 100% share of voice for the entire month.',
    features: [
      'Non-skippable 30-second pre-roll',
      '100% share of voice — no competitor ads',
      'Retro-styled creative available',
      'All subscribers see your ad',
      'Monthly impression report',
    ],
  },
  {
    name: 'Retro Commercial Slot',
    price: '₦800,000',
    period: 'per month',
    color: '#7b68ee',
    popular: true,
    icon: '📡',
    description: 'Your brand featured in the retro commercial segment — styled in authentic 90s Nigerian TV aesthetic. Premium nostalgia placement.',
    features: [
      '30-second retro-styled brand ad',
      'Placed in the pre-film reel',
      'Nostalgic 90s Nigerian TV aesthetic',
      'Creative production support included',
      'Featured in Retro Ads browse section',
    ],
  },
  {
    name: 'Podcast Episode Sponsor',
    price: '₦750,000',
    period: 'per episode',
    color: '#4ace8a',
    icon: '🎙️',
    description: 'Sponsor an episode of the NaijaRewind veteran actor interview series. Your brand introduced by the actor themselves.',
    features: [
      'Host read — actor mentions your brand',
      'Pre and mid-roll placement',
      'YouTube + Spotify distribution',
      'Episode promoted to all subscribers',
      'Brand logo in episode thumbnail',
    ],
  },
  {
    name: 'Platform Naming Rights',
    price: '₦5,000,000',
    period: 'per month',
    color: '#e8774a',
    icon: '🏆',
    description: 'Maximum visibility. "This month\'s viewing is brought to you by [Brand]" across the entire platform — hero banner, loading screen, email.',
    features: [
      '"Brought to you by" across all pages',
      'Hero banner placement',
      'Loading screen branding',
      'Subscriber email mention',
      'All other slots included',
      'Exclusive — no other sponsors this month',
    ],
  },
]

const BRANDS = ['Indomie', 'Peak Milk', 'Cowbell', 'Bournvita', 'MTN', 'Glo', 'GTBank', 'Dangote', 'Chi Limited', 'Nigerian Breweries']

export default function Advertise() {
  const router = useRouter()
  const [form, setForm] = useState({ brand: '', name: '', email: '', phone: '', package: '', message: '' })
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  const handleSubmit = async e => {
    e.preventDefault()
    setLoading(true)
    // In production: POST to /api/advertise which emails the team
    await new Promise(r => setTimeout(r, 1000))
    setSubmitted(true)
    setLoading(false)
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,700&family=DM+Sans:wght@400;500;600&display=swap');
        :root{--gold:#c8a84b;--gold-light:#e8c96e;--gold-dim:#7a6530;--bg:#080808;--bg2:#111;--bg3:#1a1a1a;--bg4:#222;--text:#f0ede6;--text2:#9a9590;--text3:#5a5550;--green:#4ace8a;--purple:#7b68ee;--red:#e84a4a;--radius:8px;--radius-lg:14px;}
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
        body{font-family:'DM Sans',sans-serif;background:var(--bg);color:var(--text);-webkit-font-smoothing:antialiased;}
        a{color:inherit;text-decoration:none;}
        .card{background:var(--bg2);border:1px solid var(--bg4);border-radius:var(--radius-lg);}
        .btn{display:inline-flex;align-items:center;justify-content:center;gap:7px;padding:10px 20px;border-radius:var(--radius);font-size:14px;font-weight:600;cursor:pointer;border:none;font-family:inherit;transition:.2s;}
        .btn-gold{background:var(--gold);color:#000;} .btn-gold:hover{background:var(--gold-light);}
        .btn-outline{background:transparent;color:var(--text);border:1px solid rgba(255,255,255,.15);} .btn-outline:hover{background:rgba(255,255,255,.07);}
        .btn:disabled{opacity:.5;cursor:not-allowed;}
        .form-input{width:100%;background:var(--bg3);border:1px solid var(--bg4);border-radius:var(--radius);padding:10px 14px;font-size:14px;color:var(--text);outline:none;font-family:inherit;transition:border-color .2s;}
        .form-input:focus{border-color:var(--gold-dim);}
        .form-input::placeholder{color:var(--text3);}
        .form-select{width:100%;background:var(--bg3);border:1px solid var(--bg4);border-radius:var(--radius);padding:10px 14px;font-size:14px;color:var(--text);outline:none;font-family:inherit;}
        ::-webkit-scrollbar{width:4px;} ::-webkit-scrollbar-thumb{background:var(--bg4);}
      `}</style>

      {/* NAV */}
      <nav style={{ position:'fixed', top:0, left:0, right:0, zIndex:100, height:60, display:'flex', alignItems:'center', padding:'0 24px', background:'rgba(8,8,8,0.96)', backdropFilter:'blur(12px)', borderBottom:'1px solid var(--bg4)' }}>
        <Link href="/browse">
          <span style={{ fontFamily:"'Playfair Display',serif", fontSize:20, fontWeight:900, color:'var(--gold)', cursor:'pointer' }}>
            Naija<span style={{ color:'var(--text)' }}>Rewind</span>
          </span>
        </Link>
        <div style={{ flex:1 }} />
        <Link href="/partners"><button className="btn btn-outline" style={{ fontSize:13, padding:'7px 16px', marginRight:8 }}>Producers/Rights Holders →</button></Link>
        <Link href="/browse"><button className="btn btn-outline" style={{ fontSize:13, padding:'7px 16px' }}>← Back to App</button></Link>
      </nav>

      <div style={{ paddingTop: 60, minHeight: '100vh' }}>

        {/* HERO */}
        <div style={{ background:'linear-gradient(135deg,#0a0800,#1a1000,#080808)', borderBottom:'1px solid var(--bg4)', padding:'64px 20px 56px', textAlign:'center', position:'relative', overflow:'hidden' }}>
          <div style={{ position:'absolute', inset:0, background:'radial-gradient(ellipse at 50% 50%, rgba(200,168,75,0.1) 0%, transparent 65%)', pointerEvents:'none' }} />
          <div style={{ position:'relative', maxWidth:700, margin:'0 auto' }}>
            <div style={{ display:'inline-flex', alignItems:'center', gap:8, background:'rgba(200,168,75,0.1)', border:'1px solid var(--gold-dim)', borderRadius:20, padding:'4px 16px', fontSize:11, fontWeight:700, color:'var(--gold)', letterSpacing:'.09em', textTransform:'uppercase', marginBottom:20 }}>
              📢 Brand Partnerships
            </div>
            <h1 style={{ fontFamily:"'Playfair Display',serif", fontSize:'clamp(28px,5vw,52px)', fontWeight:900, lineHeight:1.1, marginBottom:16 }}>
              Reach the Most Nostalgic<br/>Audience in Nigeria
            </h1>
            <p style={{ fontSize:16, color:'var(--text2)', lineHeight:1.75, maxWidth:560, margin:'0 auto 32px' }}>
              NaijaRewind subscribers are intentional viewers — they chose to sit down and watch classic Nollywood.
              Your brand appears before films they love, in a format that brings back memories.
              This is not scrolling. This is watching.
            </p>
            <div style={{ display:'flex', gap:28, justifyContent:'center', flexWrap:'wrap' }}>
              {[
                ['Non-skippable', 'Classic subscribers cannot skip pre-rolls'],
                ['Premium audience', 'Paying subscribers, not free tier'],
                ['Nostalgic mindset', 'Emotionally receptive, not distracted'],
              ].map(([h, d]) => (
                <div key={h} style={{ textAlign:'center', maxWidth:160 }}>
                  <div style={{ fontWeight:600, fontSize:14, color:'var(--gold)', marginBottom:4 }}>{h}</div>
                  <div style={{ fontSize:12, color:'var(--text3)', lineHeight:1.5 }}>{d}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* AUDIENCE STATS */}
        <div style={{ maxWidth:1100, margin:'0 auto', padding:'48px 20px 0' }}>
          <div style={{ textAlign:'center', marginBottom:32 }}>
            <div style={{ fontSize:11, fontWeight:700, color:'var(--text3)', textTransform:'uppercase', letterSpacing:'.08em', marginBottom:8 }}>Why advertise here</div>
            <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:28, fontWeight:900 }}>The audience brands have been missing</h2>
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))', gap:14, marginBottom:48 }}>
            {[
              { icon:'🇳🇬', title:'Nigerian & diaspora', desc:'Subscribers in Nigeria, UK, US, and Canada — upwardly mobile, with purchasing power.' },
              { icon:'📺', title:'Intentional viewing', desc:'They sat down to watch a film. They are not doom-scrolling. Your ad has their full attention.' },
              { icon:'💡', title:'Nostalgia premium', desc:'The brands that show up in our pre-roll are associated with the feeling of watching these films. That is priceless brand positioning.' },
              { icon:'🎯', title:'Non-skippable for Classic', desc:'Classic plan subscribers (60% of the base) cannot skip pre-roll ads. You get the full 30 seconds, guaranteed.' },
              { icon:'📊', title:'Measurable impressions', desc:'Monthly report showing impressions, completion rates, and subscriber demographics.' },
              { icon:'🎬', title:'Retro creative support', desc:'We can help produce your ad in authentic 90s Nigerian TV commercial style — the aesthetic your audience grew up with.' },
            ].map(f => (
              <div key={f.title} className="card" style={{ padding:'20px' }}>
                <div style={{ fontSize:26, marginBottom:10 }}>{f.icon}</div>
                <div style={{ fontWeight:600, fontSize:14, marginBottom:6 }}>{f.title}</div>
                <div style={{ fontSize:13, color:'var(--text2)', lineHeight:1.65 }}>{f.desc}</div>
              </div>
            ))}
          </div>

          {/* Rate card */}
          <div style={{ textAlign:'center', marginBottom:32 }}>
            <div style={{ fontSize:11, fontWeight:700, color:'var(--text3)', textTransform:'uppercase', letterSpacing:'.08em', marginBottom:8 }}>Rate card</div>
            <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:28, fontWeight:900, marginBottom:8 }}>Sponsorship packages</h2>
            <p style={{ color:'var(--text2)', fontSize:14 }}>All packages are monthly. Custom packages available for longer commitments.</p>
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(250px,1fr))', gap:14, marginBottom:48 }}>
            {PACKAGES.map(pkg => (
              <div key={pkg.name} className="card" style={{ padding:'24px', position:'relative', borderColor: pkg.popular ? 'var(--purple)' : 'var(--bg4)', transition:'transform .2s' }}
                onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-3px)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'none'}>
                {pkg.popular && (
                  <div style={{ position:'absolute', top:-10, left:'50%', transform:'translateX(-50%)', background:'var(--purple)', color:'#fff', fontSize:10, fontWeight:700, padding:'2px 12px', borderRadius:20, whiteSpace:'nowrap', textTransform:'uppercase', letterSpacing:'.07em' }}>Most Chosen</div>
                )}
                <div style={{ fontSize:26, marginBottom:10 }}>{pkg.icon}</div>
                <div style={{ fontSize:12, fontWeight:600, color:'var(--text2)', textTransform:'uppercase', letterSpacing:'.08em', marginBottom:8 }}>{pkg.name}</div>
                <div style={{ fontFamily:"'Playfair Display',serif", fontSize:30, fontWeight:900, color:pkg.color, marginBottom:2 }}>{pkg.price}</div>
                <div style={{ fontSize:12, color:'var(--text3)', marginBottom:14 }}>{pkg.period}</div>
                <p style={{ fontSize:13, color:'var(--text2)', lineHeight:1.65, marginBottom:18 }}>{pkg.description}</p>
                <ul style={{ listStyle:'none', marginBottom:0 }}>
                  {pkg.features.map((f, i) => (
                    <li key={i} style={{ display:'flex', alignItems:'flex-start', gap:8, fontSize:13, color:'var(--text2)', padding:'4px 0' }}>
                      <svg viewBox="0 0 24 24" width={14} height={14} fill="var(--green)" style={{ flexShrink:0, marginTop:2 }}><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Context on pricing */}
          <div style={{ background:'rgba(200,168,75,0.06)', border:'1px solid rgba(200,168,75,0.2)', borderRadius:'var(--radius-lg)', padding:'24px', marginBottom:48, fontSize:13, color:'var(--text2)', lineHeight:1.75 }}>
            <strong style={{ color:'var(--gold)' }}>Context on our pricing: </strong>
            A 30-second spot on Africa Magic Showcase costs approximately ₦250,000. A programme sponsorship on Channels TV runs ₦2,250,000–₦7,000,000 per month.
            NaijaRewind offers something neither can — a non-skippable, intimate, nostalgic viewing environment where your brand is genuinely welcomed as part of the experience.
            Subscribers expect ads before a Nollywood film. They remember the ads fondly. That context is worth more per impression than any other Nigerian digital media placement.
          </div>

          {/* Brands we'd love */}
          <div style={{ textAlign:'center', marginBottom:20 }}>
            <div style={{ fontSize:11, fontWeight:700, color:'var(--text3)', textTransform:'uppercase', letterSpacing:'.08em', marginBottom:12 }}>Brands we'd love to work with</div>
            <div style={{ display:'flex', gap:10, flexWrap:'wrap', justifyContent:'center' }}>
              {BRANDS.map(b => (
                <span key={b} style={{ background:'var(--bg2)', border:'1px solid var(--bg4)', borderRadius:30, padding:'6px 16px', fontSize:13, color:'var(--text2)' }}>{b}</span>
              ))}
            </div>
          </div>

          {/* ENQUIRY FORM */}
          <div style={{ maxWidth:580, margin:'48px auto 64px' }}>
            <div style={{ textAlign:'center', marginBottom:32 }}>
              <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:26, fontWeight:900, marginBottom:8 }}>Get in touch</h2>
              <p style={{ color:'var(--text2)', fontSize:14 }}>We respond within 24 hours. All packages are negotiable for longer commitments.</p>
            </div>

            {submitted ? (
              <div style={{ textAlign:'center', background:'rgba(74,206,138,0.1)', border:'1px solid rgba(74,206,138,0.3)', borderRadius:'var(--radius-lg)', padding:'40px 24px' }}>
                <div style={{ fontSize:40, marginBottom:14 }}>✅</div>
                <div style={{ fontFamily:"'Playfair Display',serif", fontSize:22, fontWeight:700, marginBottom:8, color:'var(--green)' }}>Message received</div>
                <p style={{ color:'var(--text2)', fontSize:14 }}>We'll be in touch within 24 hours to discuss your sponsorship package. Thank you for choosing NaijaRewind.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:14 }}>
                  <div>
                    <label style={{ display:'block', fontSize:11, fontWeight:600, color:'var(--text2)', marginBottom:6, textTransform:'uppercase', letterSpacing:'.07em' }}>Brand / Company Name</label>
                    <input className="form-input" value={form.brand} onChange={set('brand')} placeholder="e.g. Indomie Nigeria" required />
                  </div>
                  <div>
                    <label style={{ display:'block', fontSize:11, fontWeight:600, color:'var(--text2)', marginBottom:6, textTransform:'uppercase', letterSpacing:'.07em' }}>Your Name</label>
                    <input className="form-input" value={form.name} onChange={set('name')} placeholder="Marketing Manager" required />
                  </div>
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:14 }}>
                  <div>
                    <label style={{ display:'block', fontSize:11, fontWeight:600, color:'var(--text2)', marginBottom:6, textTransform:'uppercase', letterSpacing:'.07em' }}>Email</label>
                    <input className="form-input" type="email" value={form.email} onChange={set('email')} placeholder="marketing@brand.com" required />
                  </div>
                  <div>
                    <label style={{ display:'block', fontSize:11, fontWeight:600, color:'var(--text2)', marginBottom:6, textTransform:'uppercase', letterSpacing:'.07em' }}>Phone (optional)</label>
                    <input className="form-input" type="tel" value={form.phone} onChange={set('phone')} placeholder="+234 800 000 0000" />
                  </div>
                </div>
                <div style={{ marginBottom:14 }}>
                  <label style={{ display:'block', fontSize:11, fontWeight:600, color:'var(--text2)', marginBottom:6, textTransform:'uppercase', letterSpacing:'.07em' }}>Package of interest</label>
                  <select className="form-select" value={form.package} onChange={set('package')} required>
                    <option value="">Select a package…</option>
                    {PACKAGES.map(p => <option key={p.name} value={p.name}>{p.name} — {p.price}/{p.period}</option>)}
                    <option value="custom">Custom package — let's talk</option>
                  </select>
                </div>
                <div style={{ marginBottom:20 }}>
                  <label style={{ display:'block', fontSize:11, fontWeight:600, color:'var(--text2)', marginBottom:6, textTransform:'uppercase', letterSpacing:'.07em' }}>Message (optional)</label>
                  <textarea className="form-input" rows={3} value={form.message} onChange={set('message')} placeholder="Tell us about your campaign goals, preferred start date, or any questions…" style={{ resize:'vertical' }} />
                </div>
                <button type="submit" className="btn btn-gold" style={{ width:'100%', fontSize:15, padding:'12px' }} disabled={loading}>
                  {loading ? 'Sending…' : 'Send Enquiry'}
                </button>
                <div style={{ textAlign:'center', fontSize:12, color:'var(--text3)', marginTop:12 }}>
                  Or email directly: <span style={{ color:'var(--gold)' }}>advertise@naijarewind.com</span>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
