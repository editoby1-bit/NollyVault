// pages/veterans.js — Cultural Archive, Legacy Fund & Governance
import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Nav from '../components/Nav'
import Link from 'next/link'

const VETERANS = [
  { id:'1', name:'Pete Edochie', state:'Anambra', career_start:1980, bio:"Arguably the greatest Nollywood actor of all time. Pete Edochie brought unmatched gravitas to roles rooted in Igbo tradition and philosophy. His portrayal of Okonkwo in Things Fall Apart cemented his legend before Nollywood even had a name.", highlights:['Things Fall Apart (1987)','Living in Bondage (1992)','Blood Money (1996)','Over 100 Nollywood titles'], movies:['Living in Bondage','Blood Money','Battle of Musanga'] },
  { id:'2', name:'Kanayo O. Kanayo', state:'Imo', career_start:1992, bio:"The face of ritual and occult Nollywood. Kanayo O. Kanayo's commanding presence and ability to portray both menace and vulnerability made him one of the most sought-after actors of the golden era. A barrister at law in real life.", highlights:['Living in Bondage (1992)','Blood Money (1996)','Ritual (1997)','Barrister at law in real life'], movies:['Living in Bondage','Blood Money','Ritual'] },
  { id:'3', name:'Patience Ozokwor', state:'Enugu', career_start:1998, bio:'Known as "Mama G" — the most iconic villain in Nollywood history. Her portrayal of wicked stepmothers defined a genre. Off screen, she is a gospel musician and humanitarian.', highlights:['Tear My Heart (1999)','Over 200 film appearances','Nollywood icon and gospel musician'], movies:['Tears in My Eyes'] },
  { id:'4', name:'Ngozi Ezeonu', state:'Anambra', career_start:1992, bio:"The quintessential Nollywood mother. Ngozi Ezeonu's warm, expressive performances made her the most beloved maternal figure of the golden era. She appeared in dozens of films across the 90s and 2000s.", highlights:['Living in Bondage (1992)','Domitilla','Glamour Girls','Battle of Musanga'], movies:['Battle of Musanga','Most Wanted'] },
  { id:'5', name:'Liz Benson', state:'Akwa Ibom', career_start:1993, bio:"A trailblazer of Nollywood drama. Liz Benson was one of the first actresses to establish herself as a major star, known for emotionally intense roles. She later became a pastor.", highlights:['Glamour Girls (1994)','Numerous lead roles','Now a minister of the gospel'], movies:['Tears in My Eyes'] },
  { id:'6', name:'Kenneth Okonkwo', state:'Enugu', career_start:1992, bio:"The original Nollywood leading man. Kenneth Okonkwo starred in Living in Bondage — the film widely credited as launching the home video revolution — and became a household name overnight. Later became a lawyer and politician.", highlights:['Living in Bondage (1992)','Andy in the cultural imagination','Lawyer and former governorship candidate'], movies:['Living in Bondage'] },
  { id:'7', name:'Eucharia Anunobi', state:'Anambra', career_start:1994, bio:"The glamorous face of 90s Nollywood. Eucharia Anunobi was one of the most magnetic actresses of the era. She later became a pastor and evangelist.", highlights:['Glamour Girls (1994)','Games Women Play','Numerous lead roles','Now a full-time pastor'], movies:['Glamour Girls'] },
  { id:'8', name:'Hanks Anuku', state:'Delta', career_start:1993, bio:"Nollywood's first action hero. Born in Germany, Hanks Anuku defined the street-tough genre that audiences loved. He brought a unique international energy to the Nollywood screen.", highlights:['Issakaba (2000)','Crime-action genre pioneer','Street thug turned genre icon'], movies:['Issakaba'] },
]

const SUB_POOLS = [
  { key:'participation', label:'Legacy Participation Pool', pct:'50%', color:'#c8a84b', desc:'Calculated per actor based on how much their films are watched. Released directly to verified actors once onboarded.' },
  { key:'assistance',    label:'Veteran Assistance Fund',  pct:'30%', color:'#4ace8a', desc:'Emergency support, medical grants, housing assistance, and welfare for veteran actors in need.' },
  { key:'preservation',  label:'Film Preservation Fund',   pct:'20%', color:'#7b68ee', desc:'VHS digitization, film restoration, archival work, and cultural documentation of classic Nollywood.' },
]

export default function Veterans() {
  const router = useRouter()
  const [selected, setSelected] = useState(null)
  const [activeTab, setActiveTab] = useState('legends') // legends | fund | governance
  const [stats, setStats] = useState({ total_allocated_ngn:960000, sub_pools:{ participation_ngn:480000, assistance_ngn:288000, preservation_ngn:192000 }, registered_actors:8, verified_actors:0, active_films:15 })
  const [activeProfile] = useState(() => {
    if (typeof window === 'undefined') return null
    try { return JSON.parse(sessionStorage.getItem('activeProfile') || 'null') }
    catch { return null }
  })

  useEffect(() => {
    fetch('/api/admin/legacy-fund/stats')
      .then(r => r.json())
      .then(d => setStats(d))
      .catch(() => {}) // silently keep mock data
  }, [])

  const fmt = (n) => n >= 1000000 ? `₦${(n/1000000).toFixed(1)}M` : `₦${Math.round(n/1000)}k`

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,700&family=DM+Sans:wght@300;400;500;600&display=swap');
        :root{--gold:#c8a84b;--gold-light:#e8c96e;--gold-dim:#7a6530;--bg:#080808;--bg2:#111;--bg3:#1a1a1a;--bg4:#222;--text:#f0ede6;--text2:#9a9590;--text3:#5a5550;--green:#4ace8a;--purple:#7b68ee;--red:#e84a4a;--radius:8px;--radius-lg:14px;--nav-height:64px;}
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
        body{font-family:'DM Sans',sans-serif;background:var(--bg);color:var(--text);-webkit-font-smoothing:antialiased;}
        a{color:inherit;text-decoration:none;}
        .card{background:var(--bg2);border:1px solid var(--bg4);border-radius:var(--radius-lg);}
        .btn{display:inline-flex;align-items:center;gap:7px;padding:9px 18px;border-radius:var(--radius);font-size:14px;font-weight:600;cursor:pointer;border:none;transition:.2s;font-family:inherit;}
        .btn-gold{background:var(--gold);color:#000;} .btn-gold:hover{background:var(--gold-light);}
        .btn-ghost{background:transparent;color:var(--text2);border:1px solid var(--bg4);} .btn-ghost:hover{color:var(--text);}
        .tab{padding:8px 18px;border-radius:6px;font-size:14px;font-weight:500;cursor:pointer;border:none;font-family:inherit;transition:.2s;color:var(--text2);background:transparent;}
        .tab.active{color:var(--text);background:var(--bg3);}
        .modal-overlay{position:fixed;inset:0;z-index:800;background:rgba(0,0,0,0.88);display:flex;align-items:center;justify-content:center;padding:20px;}
        .modal-box{background:var(--bg2);border:1px solid var(--bg4);border-radius:var(--radius-lg);max-width:600px;width:100%;max-height:90vh;overflow-y:auto;}
        ::-webkit-scrollbar{width:4px;} ::-webkit-scrollbar-thumb{background:var(--bg4);border-radius:2px;}
        @keyframes fadeIn{from{opacity:0;transform:translateY(8px);}to{opacity:1;transform:none;}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.3}}
        .fade-in{animation:fadeIn .3s ease both;}
      `}</style>

      <Nav activeProfile={activeProfile} onProfileClick={()=>router.push('/profiles')} />

      <div style={{paddingTop:'var(--nav-height)',minHeight:'100vh',background:'var(--bg)'}}>

        {/* ── HERO ── */}
        <div style={{background:'linear-gradient(135deg,#060a04 0%,#0a1000 50%,#080808 100%)',borderBottom:'1px solid var(--bg4)',padding:'56px 20px 48px',textAlign:'center',position:'relative',overflow:'hidden'}}>
          <div style={{position:'absolute',inset:0,background:'radial-gradient(ellipse at 50% 60%,rgba(74,206,138,0.08) 0%,transparent 65%)',pointerEvents:'none'}}/>
          <div style={{position:'relative',maxWidth:720,margin:'0 auto'}}>
            <div style={{display:'inline-flex',alignItems:'center',gap:8,background:'rgba(74,206,138,0.1)',border:'1px solid rgba(74,206,138,0.25)',borderRadius:20,padding:'4px 16px',fontSize:11,fontWeight:700,color:'var(--green)',letterSpacing:'.09em',textTransform:'uppercase',marginBottom:20}}>
              <span style={{width:6,height:6,borderRadius:'50%',background:'var(--green)',display:'inline-block',animation:'pulse 2s infinite'}}/>
              Cultural Archive & Legacy Fund
            </div>
            <h1 style={{fontFamily:"'Playfair Display',serif",fontSize:'clamp(28px,5vw,52px)',fontWeight:900,lineHeight:1.1,marginBottom:16}}>
              The Legends Who Built<br/><span style={{color:'var(--gold)',fontStyle:'italic'}}>Nollywood</span>
            </h1>
            <p style={{fontSize:16,color:'var(--text2)',lineHeight:1.7,maxWidth:560,margin:'0 auto 32px'}}>
              These actors gave us the golden era of Nigerian cinema. Many are struggling today — unable to benefit from the fame their work created. 10% of every NaijaRewind subscription is <strong style={{color:'var(--text)'}}>allocated to the Legacy Fund</strong> in their name.
            </p>

            {/* Fund stats ticker */}
            <div style={{display:'inline-flex',gap:32,background:'var(--bg2)',border:'1px solid rgba(74,206,138,0.2)',borderRadius:14,padding:'18px 28px',flexWrap:'wrap',justifyContent:'center'}}>
              {[
                { label:'Allocated to Legacy Fund', value:fmt(stats.total_allocated_ngn), color:'var(--green)' },
                { label:'Actors Registered', value:stats.registered_actors, color:'var(--gold)' },
                { label:'Films Preserved', value:stats.active_films, color:'var(--purple)' },
              ].map(s=>(
                <div key={s.label} style={{textAlign:'center'}}>
                  <div style={{fontFamily:"'Playfair Display',serif",fontSize:26,fontWeight:900,color:s.color}}>{s.value}</div>
                  <div style={{fontSize:11,color:'var(--text3)',marginTop:3,textTransform:'uppercase',letterSpacing:'.07em'}}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── TABS ── */}
        <div style={{borderBottom:'1px solid var(--bg4)',padding:'0 20px'}}>
          <div style={{maxWidth:1000,margin:'0 auto',display:'flex',gap:4,padding:'12px 0'}}>
            {[['legends','🎬 The Legends'],['fund','🌿 How the Fund Works'],['governance','⚖️ Governance']].map(([k,l])=>(
              <button key={k} className={`tab ${activeTab===k?'active':''}`} onClick={()=>setActiveTab(k)}>{l}</button>
            ))}
          </div>
        </div>

        <div style={{maxWidth:1000,margin:'0 auto',padding:'40px 20px 80px'}}>

          {/* ── LEGENDS TAB ── */}
          {activeTab==='legends' && (
            <>
              <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:26,fontWeight:900,marginBottom:6}}>The Legends</h2>
              <p style={{color:'var(--text2)',fontSize:14,marginBottom:28}}>Click any actor to read their story, filmography, and Legacy Credits status.</p>
              <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))',gap:14}}>
                {VETERANS.map((v,i)=>(
                  <div key={v.id} onClick={()=>setSelected(v)} className="card fade-in"
                    style={{padding:'22px 18px',cursor:'pointer',transition:'border-color .2s,transform .2s',textAlign:'center',animationDelay:`${i*0.05}s`}}
                    onMouseEnter={e=>{e.currentTarget.style.borderColor='var(--gold-dim)';e.currentTarget.style.transform='translateY(-3px)'}}
                    onMouseLeave={e=>{e.currentTarget.style.borderColor='var(--bg4)';e.currentTarget.style.transform='none'}}>
                    <div style={{width:60,height:60,borderRadius:'50%',background:'linear-gradient(135deg,var(--gold-dim),var(--bg4))',margin:'0 auto 14px',display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,fontWeight:700,color:'var(--gold)'}}>
                      {v.name.split(' ').map(n=>n[0]).join('').slice(0,2)}
                    </div>
                    <div style={{fontFamily:"'Playfair Display',serif",fontSize:15,fontWeight:700,marginBottom:4,lineHeight:1.3}}>{v.name}</div>
                    <div style={{fontSize:11,color:'var(--text3)',marginBottom:10}}>{v.state} · since {v.career_start}</div>
                    <div style={{display:'flex',gap:5,justifyContent:'center',flexWrap:'wrap'}}>
                      {v.movies.slice(0,2).map(m=>(
                        <span key={m} style={{fontSize:10,background:'var(--bg3)',border:'1px solid var(--bg4)',borderRadius:4,padding:'2px 7px',color:'var(--text3)'}}>{m.split(' ').slice(0,2).join(' ')}</span>
                      ))}
                    </div>
                    {/* Legacy Credits badge — not earnings */}
                    <div style={{marginTop:10,fontSize:10,color:'var(--green)',background:'rgba(74,206,138,0.08)',border:'1px solid rgba(74,206,138,0.2)',borderRadius:4,padding:'3px 8px',display:'inline-block'}}>
                      Legacy Credits Accumulating
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* ── FUND TAB ── */}
          {activeTab==='fund' && (
            <>
              {/* How your sub is split */}
              <div className="card" style={{padding:'28px',marginBottom:24}}>
                <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:22,fontWeight:900,marginBottom:6}}>Where Your Subscription Goes</h2>
                <p style={{fontSize:14,color:'var(--text2)',marginBottom:24,lineHeight:1.65}}>
                  Every month, 10% of total platform revenue is <strong style={{color:'var(--text)'}}>allocated to the Legacy Fund</strong>. 
                  That fund is then split across three purposes:
                </p>
                {[
                  {label:'Producer Royalty Pool',pct:30,color:'var(--gold)',desc:'Paid to movie rights holders based on watch minutes each month'},
                  {label:'NaijaRewind Operations & Growth',pct:60,color:'var(--bg4)',desc:'Platform infrastructure, team, marketing, new content acquisition'},
                  {label:'Veterans Legacy Fund (total)',pct:10,color:'var(--green)',desc:'Split across three sub-pools below'},
                ].map(r=>(
                  <div key={r.label} style={{marginBottom:16}}>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:6}}>
                      <div>
                        <span style={{fontWeight:500,fontSize:14}}>{r.label}</span>
                        <span style={{fontSize:12,color:'var(--text3)',marginLeft:10}}>{r.desc}</span>
                      </div>
                      <span style={{fontWeight:700,color:r.color,fontSize:15,flexShrink:0,marginLeft:12}}>{r.pct}%</span>
                    </div>
                    <div style={{height:7,background:'var(--bg4)',borderRadius:4}}>
                      <div style={{height:'100%',background:r.color,borderRadius:4,width:`${r.pct}%`}}/>
                    </div>
                  </div>
                ))}
              </div>

              {/* Three sub-pools */}
              <h3 style={{fontFamily:"'Playfair Display',serif",fontSize:20,fontWeight:700,marginBottom:16}}>The Legacy Fund — Three Sub-Pools</h3>
              <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(240px,1fr))',gap:14,marginBottom:32}}>
                {SUB_POOLS.map(p=>(
                  <div key={p.key} className="card" style={{padding:'22px',borderColor:p.color+'33'}}>
                    <div style={{fontFamily:"'Playfair Display',serif",fontSize:22,fontWeight:900,color:p.color,marginBottom:4}}>{p.pct}</div>
                    <div style={{fontWeight:600,fontSize:14,marginBottom:8}}>{p.label}</div>
                    <div style={{fontSize:13,color:'var(--text2)',lineHeight:1.65,marginBottom:14}}>{p.desc}</div>
                    <div style={{fontSize:13,color:p.color,fontWeight:500}}>
                      {fmt(stats.sub_pools?.[`${p.key}_ngn`]||0)} allocated to date
                    </div>
                  </div>
                ))}
              </div>

              {/* Credit flow explainer */}
              <div className="card" style={{padding:'24px',marginBottom:24}}>
                <h3 style={{fontWeight:600,fontSize:15,marginBottom:16}}>How Legacy Credits Are Calculated</h3>
                <div style={{display:'flex',flexDirection:'column',gap:14}}>
                  {[
                    {step:'1', title:'Legacy Points assigned', desc:'Every actor on a movie has a points value: Lead = 5, Major Supporting = 3, Minor Supporting = 1. Admins can override for films where a "lead" role is misleading.'},
                    {step:'2', title:'Watch minutes recorded', desc:'Every time someone watches a film, the minutes are logged per movie for that period. More popular films generate more weight.'},
                    {step:'3', title:'Credits calculated', desc:'(Actor\'s points × movie\'s watch minutes) ÷ total weighted minutes across all films = actor\'s share of the Participation Pool. These are internal calculations only.'},
                    {step:'4', title:'Held, not paid', desc:'All credits are marked "held" in the system. No money moves until an actor has been verified with a signed agreement and bank details confirmed.'},
                    {step:'5', title:'Released on onboarding', desc:'Once an actor is onboarded, their accumulated held credits are reviewed, approved, and transferred. Going forward they receive monthly direct payments.'},
                  ].map(s=>(
                    <div key={s.step} style={{display:'flex',gap:14,alignItems:'flex-start'}}>
                      <div style={{width:28,height:28,borderRadius:'50%',background:'var(--bg3)',border:'1px solid var(--bg4)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:700,color:'var(--gold)',flexShrink:0}}>{s.step}</div>
                      <div>
                        <div style={{fontWeight:600,fontSize:14,marginBottom:3}}>{s.title}</div>
                        <div style={{fontSize:13,color:'var(--text2)',lineHeight:1.6}}>{s.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Important note */}
              <div style={{background:'rgba(200,168,75,0.06)',border:'1px solid rgba(200,168,75,0.2)',borderRadius:8,padding:'16px 20px',fontSize:13,color:'var(--text2)',lineHeight:1.7}}>
                <strong style={{color:'var(--gold)'}}>Important: </strong>
                Legacy Credits are internal accounting units, not legally binding earnings or royalties. 
                They represent NaijaRewind's voluntary commitment to allocate platform revenue toward veteran actor welfare. 
                All disbursements are subject to formal agreements, verification, and governance board approval.
              </div>
            </>
          )}

          {/* ── GOVERNANCE TAB ── */}
          {activeTab==='governance' && (
            <>
              <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:26,fontWeight:900,marginBottom:6}}>Legacy Fund Governance</h2>
              <p style={{color:'var(--text2)',fontSize:14,lineHeight:1.7,maxWidth:600,marginBottom:32}}>
                The Legacy Fund is overseen by an advisory board to ensure transparency, fairness, and accountability. 
                The structure is established at launch. Board seats are being filled as the platform grows.
              </p>

              {/* Board seats */}
              <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))',gap:14,marginBottom:36}}>
                {[
                  {seat:'NaijaRewind Leadership', status:'Filled', color:'var(--gold)', icon:'🏛️', desc:'Platform founders. Responsible for fund operations, accounting, and reporting.'},
                  {seat:'Veteran Actor Representative', status:'Recruiting', color:'var(--green)', icon:'🎬', desc:'A senior veteran actor or their designated representative. Advocates for actor welfare and disbursement priorities.'},
                  {seat:'Producer Representative', status:'Recruiting', color:'var(--purple)', icon:'🎥', desc:'A licensed Nollywood producer. Ensures alignment between content rights and cultural preservation goals.'},
                  {seat:'Independent Cultural Advisor', status:'Recruiting', color:'#e8774a', icon:'📚', desc:'An independent expert in Nigerian cultural heritage, film history, or performing arts welfare.'},
                ].map(b=>(
                  <div key={b.seat} className="card" style={{padding:'22px',borderColor:b.status==='Filled'?b.color+'44':'var(--bg4)'}}>
                    <div style={{fontSize:24,marginBottom:10}}>{b.icon}</div>
                    <div style={{fontWeight:600,fontSize:14,marginBottom:4}}>{b.seat}</div>
                    <div style={{fontSize:13,color:'var(--text2)',lineHeight:1.6,marginBottom:14}}>{b.desc}</div>
                    <span style={{fontSize:11,padding:'3px 10px',borderRadius:20,fontWeight:600,background:b.status==='Filled'?b.color+'22':'rgba(90,85,80,0.3)',color:b.status==='Filled'?b.color:'var(--text3)',border:`1px solid ${b.status==='Filled'?b.color+'44':'var(--bg4)'}`}}>
                      {b.status}
                    </span>
                  </div>
                ))}
              </div>

              {/* Principles */}
              <div className="card" style={{padding:'24px',marginBottom:24}}>
                <h3 style={{fontWeight:600,fontSize:15,marginBottom:16}}>Fund Principles</h3>
                {[
                  ['Transparency', 'Monthly allocation amounts are published publicly. Every naira into and out of the fund is recorded in an auditable ledger.'],
                  ['No automatic payments', 'No funds are disbursed without governance board review and explicit approval. All credits are held until verified.'],
                  ['Language precision', 'We use "Legacy Credits" and "allocated" — not "earnings", "royalties", or "distributed" — until formal agreements and disbursements occur.'],
                  ['Actor primacy', 'The Participation Pool exists solely for actors. It cannot be redirected to platform operations under any circumstances.'],
                  ['Preservation as mission', '20% of the fund goes to film preservation regardless of actor onboarding status. The cultural archive mission runs independently.'],
                ].map(([title,desc])=>(
                  <div key={title} style={{display:'flex',gap:12,marginBottom:14,paddingBottom:14,borderBottom:'1px solid var(--bg4)'}}>
                    <div style={{color:'var(--gold)',flexShrink:0,marginTop:1}}>◆</div>
                    <div>
                      <div style={{fontWeight:600,fontSize:14,marginBottom:3}}>{title}</div>
                      <div style={{fontSize:13,color:'var(--text2)',lineHeight:1.6}}>{desc}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Contact */}
              <div style={{background:'rgba(74,206,138,0.05)',border:'1px solid rgba(74,206,138,0.2)',borderRadius:8,padding:'16px 20px',fontSize:13,color:'var(--text2)',lineHeight:1.7}}>
                <strong style={{color:'var(--green)'}}>Want to join the board or nominate someone? </strong>
                We are actively recruiting the Veteran Actor and Producer seats. Contact us at <span style={{color:'var(--gold)'}}>legacy@naijaRewind.com</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── ACTOR DETAIL MODAL ── */}
      {selected && (
        <div className="modal-overlay" onClick={()=>setSelected(null)}>
          <div className="modal-box" onClick={e=>e.stopPropagation()}>
            <div style={{padding:'28px'}}>
              <div style={{display:'flex',alignItems:'flex-start',gap:16,marginBottom:20}}>
                <div style={{width:68,height:68,borderRadius:'50%',flexShrink:0,background:'linear-gradient(135deg,var(--gold-dim),var(--bg4))',display:'flex',alignItems:'center',justifyContent:'center',fontSize:24,fontWeight:700,color:'var(--gold)'}}>
                  {selected.name.split(' ').map(n=>n[0]).join('').slice(0,2)}
                </div>
                <div style={{flex:1}}>
                  <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:24,fontWeight:900,lineHeight:1.2,marginBottom:4}}>{selected.name}</h2>
                  <div style={{fontSize:13,color:'var(--text2)'}}>{selected.state} State · Career started {selected.career_start}</div>
                </div>
                <button onClick={()=>setSelected(null)} style={{background:'transparent',border:'none',color:'var(--text2)',cursor:'pointer',fontSize:20,padding:4,flexShrink:0}}>✕</button>
              </div>

              <p style={{fontSize:14,color:'var(--text2)',lineHeight:1.75,marginBottom:20}}>{selected.bio}</p>

              <div style={{marginBottom:20}}>
                <div style={{fontSize:11,fontWeight:600,color:'var(--text3)',textTransform:'uppercase',letterSpacing:'.07em',marginBottom:10}}>Career Highlights</div>
                {selected.highlights.map((h,i)=>(
                  <div key={i} style={{display:'flex',alignItems:'flex-start',gap:8,fontSize:13,color:'var(--text2)',marginBottom:6}}>
                    <span style={{color:'var(--gold)',marginTop:1}}>◆</span>{h}
                  </div>
                ))}
              </div>

              <div style={{marginBottom:20}}>
                <div style={{fontSize:11,fontWeight:600,color:'var(--text3)',textTransform:'uppercase',letterSpacing:'.07em',marginBottom:10}}>Films on NaijaRewind</div>
                <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
                  {selected.movies.map(m=>(
                    <span key={m} style={{fontSize:13,background:'var(--bg3)',border:'1px solid var(--bg4)',borderRadius:6,padding:'5px 12px',color:'var(--text2)'}}>{m}</span>
                  ))}
                </div>
              </div>

              {/* Legacy Credits — careful language */}
              <div style={{background:'rgba(74,206,138,0.05)',border:'1px solid rgba(74,206,138,0.18)',borderRadius:8,padding:'16px',fontSize:13,color:'var(--text2)',lineHeight:1.7}}>
                <div style={{color:'var(--green)',fontWeight:600,marginBottom:6}}>🌿 Legacy Credits</div>
                Based on how much {selected.name}'s films are watched on NaijaRewind, Legacy Credits are being 
                accumulated in their name within our Participation Pool. These credits will be converted to 
                direct payments once {selected.name} is formally onboarded into the Legacy Fund programme.
                <div style={{marginTop:10,fontSize:12,color:'var(--text3)'}}>
                  Legacy Credits are an internal accounting mechanism — not legally binding earnings or royalties.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
