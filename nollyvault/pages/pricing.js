import { useState } from 'react'
import { useRouter } from 'next/router'
import { useSession } from './_app'

const TIERS = [
  {
    key: 'classic',
    name: 'Classic',
    originalNGN: '₦2,500', priceNGN: '₦1,500',
    color: '#c8a84b',
    watchLimit: '20 hrs/month',
    features: [
      { t: 'Full classic Nollywood catalog', ok: true },
      { t: '1 device at a time', ok: true },
      { t: 'Standard quality (SD)', ok: true },
      { t: '20 hours/month watch limit', ok: true },
      { t: 'Continue watching', ok: true },
      { t: 'Watchlists', ok: true },
      { t: 'HD quality', ok: false },
      { t: 'Offline downloads', ok: false },
      { t: 'Watch Parties', ok: false },
    ],
  },
  {
    key: 'premium',
    name: 'Premium',
    originalNGN: '₦3,500', priceNGN: '₦3,000',
    color: '#e8e8e8', popular: true,
    features: [
      { t: 'Full classic Nollywood catalog', ok: true },
      { t: '3 devices simultaneously', ok: true },
      { t: 'HD streaming — unlimited', ok: true },
      { t: 'Continue watching across devices', ok: true },
      { t: 'Offline downloads', ok: true },
      { t: 'Viewing history', ok: true },
      { t: 'Watch Parties', ok: false },
      { t: 'Family Profiles', ok: false },
    ],
  },
  {
    key: 'family',
    name: 'Family & Friends',
    originalNGN: null, priceNGN: '₦5,000',
    color: '#7b68ee',
    features: [
      { t: 'Full classic Nollywood catalog', ok: true },
      { t: '5 devices simultaneously', ok: true },
      { t: 'HD streaming — unlimited', ok: true },
      { t: 'Offline downloads', ok: true },
      { t: 'Watch Parties & Date Night Mode', ok: true },
      { t: 'Family Profiles (up to 5)', ok: true },
      { t: 'Shared Watchlists', ok: true },
      { t: 'Priority support', ok: true },
    ],
  },
]

export default function Pricing() {
  const session = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState('')

  const handleSubscribe = async (tierKey) => {
    if (!session) { router.push('/signup'); return }
    setLoading(tierKey)
    try {
      // Paystack only — accepts international cards, so this covers diaspora
      // subscribers too. See lib/payments.js for why Stripe was removed.
      const res = await fetch('/api/payments/paystack/initialize', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: session.user.email, planKey: tierKey }),
      })
      const data = await res.json()
      const url = data.authorization_url || data.url
      if (url) window.location.href = url
      else alert(data.error || 'Payment failed. Try again.')
    } catch { alert('Something went wrong. Try again.') }
    finally { setLoading('') }
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@400;500;600&display=swap');
        :root{--gold:#c8a84b;--gold-light:#e8c96e;--bg:#080808;--bg2:#111;--bg3:#1a1a1a;--bg4:#222;--text:#f0ede6;--text2:#9a9590;--text3:#5a5550;--green:#4ace8a;--red:#e84a4a;--radius:8px;--radius-lg:14px;}
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
        body{font-family:'DM Sans',sans-serif;background:var(--bg);color:var(--text);-webkit-font-smoothing:antialiased;}
        .btn{display:inline-flex;align-items:center;justify-content:center;gap:7px;padding:10px 20px;border-radius:var(--radius);font-size:14px;font-weight:600;cursor:pointer;border:none;transition:.2s;font-family:inherit;width:100%;}
        .btn:disabled{opacity:.5;cursor:not-allowed;}
        .card{background:var(--bg2);border:1px solid var(--bg4);border-radius:var(--radius-lg);}
        .slash{text-decoration:line-through;color:var(--text3);font-size:16px;font-weight:400;margin-right:8px;}
        .discount-badge{background:rgba(74,206,138,0.15);border:1px solid rgba(74,206,138,0.3);color:var(--green);font-size:10px;font-weight:700;padding:2px 8px;border-radius:20px;text-transform:uppercase;letter-spacing:.06em;margin-left:6px;vertical-align:middle;}
      `}</style>

      <div style={{minHeight:'100vh',background:'var(--bg)',backgroundImage:'radial-gradient(ellipse at 50% 20%,rgba(200,168,75,0.07) 0%,transparent 60%)'}}>
        <div style={{maxWidth:980,margin:'0 auto',padding:'60px 20px 80px'}}>

          {/* Header */}
          <div style={{textAlign:'center',marginBottom:48}}>
            <div style={{fontFamily:"'Playfair Display',serif",fontSize:26,fontWeight:900,color:'var(--gold)',marginBottom:8,cursor:'pointer'}} onClick={()=>router.push('/')}>
              Naija<span style={{color:'var(--text)'}}>Rewind</span>
            </div>
            <h1 style={{fontFamily:"'Playfair Display',serif",fontSize:38,fontWeight:900,marginBottom:10}}>Choose Your Plan</h1>
            <p style={{color:'var(--text2)',fontSize:15,maxWidth:480,margin:'0 auto 8px'}}>
              All plans include the full classic Nollywood catalog. Cancel anytime.
            </p>
            <p style={{color:'var(--green)',fontSize:13,fontWeight:500,marginBottom:24}}>
              🎉 Launch pricing — limited time
            </p>
          </div>

          {/* Tiers */}
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(260px,1fr))',gap:16,marginBottom:40}}>
            {TIERS.map(tier=>(
              <div key={tier.key} className="card" style={{padding:'28px 24px',position:'relative',borderColor:tier.popular?'var(--gold)':'var(--bg4)',transition:'transform .2s'}}
                onMouseEnter={e=>e.currentTarget.style.transform='translateY(-4px)'}
                onMouseLeave={e=>e.currentTarget.style.transform='translateY(0)'}>
                {tier.popular&&<div style={{position:'absolute',top:-11,left:'50%',transform:'translateX(-50%)',background:'var(--gold)',color:'#000',fontSize:10,fontWeight:800,padding:'3px 14px',borderRadius:20,whiteSpace:'nowrap',textTransform:'uppercase',letterSpacing:'.08em'}}>Most Popular</div>}

                <div style={{fontSize:12,fontWeight:600,color:'var(--text2)',textTransform:'uppercase',letterSpacing:'.09em',marginBottom:10}}>{tier.name}</div>

                {/* Price with slash */}
                <div style={{marginBottom:4,display:'flex',alignItems:'baseline',flexWrap:'wrap',gap:4}}>
                  {tier.originalNGN && (
                    <span className="slash">{tier.originalNGN}</span>
                  )}
                  <span style={{fontFamily:"'Playfair Display',serif",fontSize:38,fontWeight:900,color:tier.color}}>
                    {tier.priceNGN}
                  </span>
                  {tier.originalNGN && (
                    <span className="discount-badge">Launch price</span>
                  )}
                </div>
                <div style={{fontSize:12,color:'var(--text3)',marginBottom:tier.watchLimit?4:24}}>per month</div>
                {tier.watchLimit && tier.key==='classic' && (
                  <div style={{fontSize:12,color:'var(--gold)',marginBottom:20,fontWeight:500}}>⏱ {tier.watchLimit}</div>
                )}

                <ul style={{listStyle:'none',marginBottom:26}}>
                  {tier.features.map((f,i)=>(
                    <li key={i} style={{display:'flex',alignItems:'center',gap:9,fontSize:13,color:f.ok?'var(--text2)':'var(--text3)',padding:'5px 0'}}>
                      {f.ok
                        ?<svg viewBox="0 0 24 24" width={15} height={15} fill="var(--green)" style={{flexShrink:0}}><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
                        :<svg viewBox="0 0 24 24" width={15} height={15} fill="var(--text3)" style={{flexShrink:0}}><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
                      }{f.t}
                    </li>
                  ))}
                </ul>

                <button className="btn" disabled={loading===tier.key} onClick={()=>handleSubscribe(tier.key)}
                  style={{background:tier.color,color:tier.key==='family'?'#fff':'#000'}}>
                  {loading===tier.key?'Redirecting…':'Get Started'}
                </button>
              </div>
            ))}
          </div>

          {/* Trust */}
          <div style={{textAlign:'center',fontSize:13,color:'var(--text3)',marginBottom:12}}>
            Pay securely with Paystack · Cards, bank transfer & USSD · International cards accepted
          </div>
          <div style={{textAlign:'center',fontSize:12,color:'var(--text3)'}}>
            💚 5% of every referral subscription goes directly to the actor who referred you
          </div>
        </div>
      </div>
    </>
  )
}
