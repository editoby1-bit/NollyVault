// pages/partners.js — Producer / rights-holder licensing page
import { useState } from 'react'
import Link from 'next/link'

const STEPS = [
  { n: '01', title: 'Tell us what you hold rights to', desc: 'Submit the form below with the titles you produced or currently hold distribution rights to.' },
  { n: '02', title: 'We verify', desc: 'We confirm rights ownership (contract, CAC certificate, or prior distribution agreement) before anything goes live.' },
  { n: '03', title: 'We license and list', desc: 'Films are encoded, categorized, and added to the catalog under your name as producer.' },
  { n: '04', title: 'You get paid monthly', desc: 'A transparent royalty statement and payout, based on actual watch-minutes your films earned that month.' },
]

export default function Partners() {
  const [form, setForm] = useState({ holderName: '', name: '', email: '', phone: '', films: '', proof: '', message: '' })
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  const handleSubmit = async e => {
    e.preventDefault()
    setLoading(true)
    try {
      await fetch('/api/partners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
    } catch {}
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
        <Link href="/advertise"><button className="btn btn-outline" style={{ fontSize:13, padding:'7px 16px', marginRight:8 }}>Advertising →</button></Link>
        <Link href="/browse"><button className="btn btn-outline" style={{ fontSize:13, padding:'7px 16px' }}>← Back to App</button></Link>
      </nav>

      <div style={{ paddingTop: 60, minHeight: '100vh' }}>

        {/* HERO */}
        <div style={{ background:'linear-gradient(135deg,#0a0800,#1a1000,#080808)', borderBottom:'1px solid var(--bg4)', padding:'64px 20px 56px', textAlign:'center', position:'relative', overflow:'hidden' }}>
          <div style={{ position:'absolute', inset:0, background:'radial-gradient(ellipse at 50% 50%, rgba(200,168,75,0.1) 0%, transparent 65%)', pointerEvents:'none' }} />
          <div style={{ position:'relative', maxWidth:700, margin:'0 auto' }}>
            <div style={{ display:'inline-flex', alignItems:'center', gap:8, background:'rgba(200,168,75,0.1)', border:'1px solid var(--gold-dim)', borderRadius:20, padding:'4px 16px', fontSize:11, fontWeight:700, color:'var(--gold)', letterSpacing:'.09em', textTransform:'uppercase', marginBottom:20 }}>
              🎬 For Producers &amp; Rights Holders
            </div>
            <h1 style={{ fontFamily:"'Playfair Display',serif", fontSize:'clamp(28px,5vw,52px)', fontWeight:900, lineHeight:1.1, marginBottom:16 }}>
              Your Films Deserve<br/>a Second Life
            </h1>
            <p style={{ fontSize:16, color:'var(--text2)', lineHeight:1.75, maxWidth:560, margin:'0 auto 32px' }}>
              Thousands of people are searching for the films you made and can't find them anywhere legal.
              License your catalog to NaijaRewind and earn from every minute watched — while your cast's legacy
              is honored through our Legacy Fund.
            </p>
            <div style={{ display:'flex', gap:28, justifyContent:'center', flexWrap:'wrap' }}>
              {[
                ['Non-exclusive', "Keep your rights — this is not a buyout"],
                ['Transparent split', 'Paid by actual watch-minutes, monthly'],
                ['Cast honored', '10% of revenue funds veteran actor support'],
              ].map(([h, d]) => (
                <div key={h} style={{ textAlign:'center', maxWidth:170 }}>
                  <div style={{ fontWeight:600, fontSize:14, color:'var(--gold)', marginBottom:4 }}>{h}</div>
                  <div style={{ fontSize:12, color:'var(--text3)', lineHeight:1.5 }}>{d}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{ maxWidth:1100, margin:'0 auto', padding:'48px 20px 0' }}>

          {/* WHY PARTNER */}
          <div style={{ textAlign:'center', marginBottom:32 }}>
            <div style={{ fontSize:11, fontWeight:700, color:'var(--text3)', textTransform:'uppercase', letterSpacing:'.08em', marginBottom:8 }}>Why license with us</div>
            <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:28, fontWeight:900 }}>Built for people who love these films</h2>
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))', gap:14, marginBottom:56 }}>
            {[
              { icon:'💰', title:'Real royalties', desc: 'Not a flat licensing fee. You earn a share of subscription revenue every single month your films are watched.' },
              { icon:'📊', title:'Proportional, transparent', desc: '30% of subscription revenue forms the Producer Royalty Pool, split across licensed films by their share of total watch-minutes that month.' },
              { icon:'🏛️', title:'A real legacy fund', desc: '10% of revenue funds veteran cast welfare, direct actor participation payments, and film preservation — a first for this era of Nollywood.' },
              { icon:'🌍', title:'Diaspora reach', desc: 'Access viewers in the UK, US, and Canada who have been searching for these titles for years with nowhere legitimate to watch.' },
              { icon:'🔒', title:'You keep your rights', desc: 'Licensing is non-exclusive. This is a distribution partnership, not a sale — you can still license elsewhere.' },
              { icon:'🎞️', title:'Preservation, not just streaming', desc: 'We take restoration seriously. Prints in poor condition are prioritized for cleanup as part of our preservation pool.' },
            ].map(f => (
              <div key={f.title} className="card" style={{ padding:'20px' }}>
                <div style={{ fontSize:26, marginBottom:10 }}>{f.icon}</div>
                <div style={{ fontWeight:600, fontSize:14, marginBottom:6 }}>{f.title}</div>
                <div style={{ fontSize:13, color:'var(--text2)', lineHeight:1.65 }}>{f.desc}</div>
              </div>
            ))}
          </div>

          {/* REVENUE MODEL */}
          <div style={{ textAlign:'center', marginBottom:24 }}>
            <div style={{ fontSize:11, fontWeight:700, color:'var(--text3)', textTransform:'uppercase', letterSpacing:'.08em', marginBottom:8 }}>How the money works</div>
            <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:28, fontWeight:900, marginBottom:8 }}>Where every naira of subscription revenue goes</h2>
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(240px,1fr))', gap:14, marginBottom:24 }}>
            <div className="card" style={{ padding:'24px', borderColor:'var(--gold-dim)' }}>
              <div style={{ fontFamily:"'Playfair Display',serif", fontSize:32, fontWeight:900, color:'var(--gold)', marginBottom:4 }}>30%</div>
              <div style={{ fontWeight:600, fontSize:14, marginBottom:8 }}>Producer Royalty Pool</div>
              <p style={{ fontSize:13, color:'var(--text2)', lineHeight:1.65 }}>
                Split across every licensed film by its share of total watch-minutes that month. More views, more minutes watched — more of the pool is yours.
              </p>
            </div>
            <div className="card" style={{ padding:'24px', borderColor:'var(--purple)' }}>
              <div style={{ fontFamily:"'Playfair Display',serif", fontSize:32, fontWeight:900, color:'var(--purple)', marginBottom:4 }}>10%</div>
              <div style={{ fontWeight:600, fontSize:14, marginBottom:8 }}>Legacy Fund</div>
              <p style={{ fontSize:13, color:'var(--text2)', lineHeight:1.65 }}>
                Split three ways: 50% direct actor participation payments, 30% veteran welfare/assistance, 20% film preservation and restoration.
              </p>
            </div>
            <div className="card" style={{ padding:'24px' }}>
              <div style={{ fontFamily:"'Playfair Display',serif", fontSize:32, fontWeight:900, color:'var(--text2)', marginBottom:4 }}>60%</div>
              <div style={{ fontWeight:600, fontSize:14, marginBottom:8 }}>Platform operations</div>
              <p style={{ fontSize:13, color:'var(--text2)', lineHeight:1.65 }}>
                Hosting, streaming delivery, encoding, payments processing, and growing the subscriber base that drives your royalties up.
              </p>
            </div>
          </div>

          <div style={{ background:'rgba(200,168,75,0.06)', border:'1px solid rgba(200,168,75,0.2)', borderRadius:'var(--radius-lg)', padding:'24px', marginBottom:56, fontSize:13, color:'var(--text2)', lineHeight:1.75 }}>
            <strong style={{ color:'var(--gold)' }}>Why this matters for you: </strong>
            Most of your films have never earned you a naira since their original release. Pirated copies circulate everywhere with zero return to you or your cast.
            This model means every legitimate view — from Lagos to London — puts money back where it belongs: with the people who made the film, and the actors who brought it to life.
          </div>

          {/* HOW IT WORKS */}
          <div style={{ textAlign:'center', marginBottom:32 }}>
            <div style={{ fontSize:11, fontWeight:700, color:'var(--text3)', textTransform:'uppercase', letterSpacing:'.08em', marginBottom:8 }}>The process</div>
            <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:28, fontWeight:900 }}>Four steps to getting your films live</h2>
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))', gap:14, marginBottom:56 }}>
            {STEPS.map(s => (
              <div key={s.n} className="card" style={{ padding:'22px' }}>
                <div style={{ fontFamily:"'Playfair Display',serif", fontSize:22, fontWeight:900, color:'var(--gold-dim)', marginBottom:10 }}>{s.n}</div>
                <div style={{ fontWeight:600, fontSize:14, marginBottom:8 }}>{s.title}</div>
                <div style={{ fontSize:13, color:'var(--text2)', lineHeight:1.65 }}>{s.desc}</div>
              </div>
            ))}
          </div>

          {/* SUBMISSION FORM */}
          <div style={{ maxWidth:580, margin:'0 auto 64px' }}>
            <div style={{ textAlign:'center', marginBottom:32 }}>
              <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:26, fontWeight:900, marginBottom:8 }}>Submit your catalog</h2>
              <p style={{ color:'var(--text2)', fontSize:14 }}>We respond within a few days. Nothing goes live until rights are verified.</p>
            </div>

            {submitted ? (
              <div style={{ textAlign:'center', background:'rgba(74,206,138,0.1)', border:'1px solid rgba(74,206,138,0.3)', borderRadius:'var(--radius-lg)', padding:'40px 24px' }}>
                <div style={{ fontSize:40, marginBottom:14 }}>✅</div>
                <div style={{ fontFamily:"'Playfair Display',serif", fontSize:22, fontWeight:700, marginBottom:8, color:'var(--green)' }}>Submission received</div>
                <p style={{ color:'var(--text2)', fontSize:14 }}>We'll review your catalog and reach out to verify rights. Thank you for trusting us with your work.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:14 }}>
                  <div>
                    <label style={{ display:'block', fontSize:11, fontWeight:600, color:'var(--text2)', marginBottom:6, textTransform:'uppercase', letterSpacing:'.07em' }}>Production Company / Rights Holder</label>
                    <input className="form-input" value={form.holderName} onChange={set('holderName')} placeholder="e.g. Zeb Ejiro Productions" required />
                  </div>
                  <div>
                    <label style={{ display:'block', fontSize:11, fontWeight:600, color:'var(--text2)', marginBottom:6, textTransform:'uppercase', letterSpacing:'.07em' }}>Your Name</label>
                    <input className="form-input" value={form.name} onChange={set('name')} placeholder="Contact person" required />
                  </div>
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:14 }}>
                  <div>
                    <label style={{ display:'block', fontSize:11, fontWeight:600, color:'var(--text2)', marginBottom:6, textTransform:'uppercase', letterSpacing:'.07em' }}>Email</label>
                    <input className="form-input" type="email" value={form.email} onChange={set('email')} placeholder="you@company.com" required />
                  </div>
                  <div>
                    <label style={{ display:'block', fontSize:11, fontWeight:600, color:'var(--text2)', marginBottom:6, textTransform:'uppercase', letterSpacing:'.07em' }}>Phone (optional)</label>
                    <input className="form-input" type="tel" value={form.phone} onChange={set('phone')} placeholder="+234 800 000 0000" />
                  </div>
                </div>
                <div style={{ marginBottom:14 }}>
                  <label style={{ display:'block', fontSize:11, fontWeight:600, color:'var(--text2)', marginBottom:6, textTransform:'uppercase', letterSpacing:'.07em' }}>Films you hold rights to</label>
                  <textarea className="form-input" rows={2} value={form.films} onChange={set('films')} placeholder="e.g. Living in Bondage (1992), Karishika (1996)…" style={{ resize:'vertical' }} required />
                </div>
                <div style={{ marginBottom:14 }}>
                  <label style={{ display:'block', fontSize:11, fontWeight:600, color:'var(--text2)', marginBottom:6, textTransform:'uppercase', letterSpacing:'.07em' }}>Proof of rights</label>
                  <input className="form-input" value={form.proof} onChange={set('proof')} placeholder="e.g. Original production contract, CAC certificate, prior distribution deal" />
                </div>
                <div style={{ marginBottom:20 }}>
                  <label style={{ display:'block', fontSize:11, fontWeight:600, color:'var(--text2)', marginBottom:6, textTransform:'uppercase', letterSpacing:'.07em' }}>Message (optional)</label>
                  <textarea className="form-input" rows={3} value={form.message} onChange={set('message')} placeholder="Anything else we should know…" style={{ resize:'vertical' }} />
                </div>
                <button type="submit" className="btn btn-gold" style={{ width:'100%', fontSize:15, padding:'12px' }} disabled={loading}>
                  {loading ? 'Sending…' : 'Submit Catalog'}
                </button>
                <div style={{ textAlign:'center', fontSize:12, color:'var(--text3)', marginTop:12 }}>
                  Or email directly: <span style={{ color:'var(--gold)' }}>partners@naijarewind.com</span>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
