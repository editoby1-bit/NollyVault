// pages/watch-party/index.js
import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { useSession, useSupabaseClient } from '../_app'
import Nav from '../../components/Nav'
import ToastContainer, { showToast } from '../../components/Toast'

const MOCK_PARTIES = [
  { id: '1', title: 'Horror Night 🔥', movieTitle: 'Karishika', host: 'Chidi_Lagos', viewers: 12, mode: 'party', is_live: true, invite_code: 'XK39F2' },
  { id: '2', title: 'Throwback Sunday 🎬', movieTitle: 'Living in Bondage', host: 'Ada_London', viewers: 8, mode: 'party', is_live: false, time: 'Starts in 2h' },
  { id: '3', title: 'Date Night 💕', movieTitle: 'Egg of Life', host: 'Tolu_Abuja', viewers: 2, mode: 'date_night', is_live: true, invite_code: 'TN88X1' },
]

export default function WatchPartyHub() {
  const session = useSession()
  const router = useRouter()
  const supabase = useSupabaseClient()
  const [activeProfile, setActiveProfile] = useState(null)
  const [userPlan, setUserPlan] = useState(null)
  const [joinCode, setJoinCode] = useState('')

  useEffect(() => {
    const p = sessionStorage.getItem('activeProfile')
    if (p) setActiveProfile(JSON.parse(p))
    if (session) {
      supabase.from('users').select('plan,plan_status').eq('id', session.user.id).single()
        .then(({ data }) => setUserPlan(data))
    }
  }, [session])

  const canWatchParty = userPlan?.plan === 'family' && userPlan?.plan_status === 'active'

  const handleJoin = () => {
    if (!joinCode.trim()) return
    showToast(`Joining party ${joinCode.toUpperCase()}…`, 'gold')
    // router.push(`/watch-party/${joinCode.toUpperCase()}`)
  }

  return (
    <>
      <Nav activeProfile={activeProfile} onProfileClick={() => router.push('/profiles')} />
      <div style={{ paddingTop: 'var(--nav-height)', minHeight: '100vh', background: 'var(--bg)' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '36px 20px 80px' }}>

          {/* Header */}
          <div style={{ marginBottom: 36 }}>
            <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 32, fontWeight: 900, marginBottom: 6 }}>
              Watch Parties
            </h1>
            <p style={{ color: 'var(--text2)', fontSize: 14 }}>
              Watch classic Nollywood together — with friends, family, or your date. Anywhere in the world.
            </p>
          </div>

          {/* Plan gate */}
          {!canWatchParty && (
            <div style={{
              background: 'linear-gradient(135deg, rgba(123,104,238,0.12), rgba(200,168,75,0.08))',
              border: '1px solid rgba(123,104,238,0.3)', borderRadius: 'var(--radius-lg)',
              padding: '24px', marginBottom: 32, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap',
            }}>
              <div>
                <div style={{ fontSize: 11, color: 'var(--purple)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 6 }}>Family & Friends Plan Required</div>
                <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 700 }}>Unlock Watch Parties</div>
                <div style={{ fontSize: 13, color: 'var(--text2)', marginTop: 4 }}>Host or join parties for just ₦5,000/month</div>
              </div>
              <button className="btn btn-gold" onClick={() => router.push('/pricing')}>
                Upgrade Now
              </button>
            </div>
          )}

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: 12, marginBottom: 32, flexWrap: 'wrap' }}>
            <button
              className="btn btn-gold"
              disabled={!canWatchParty}
              onClick={() => router.push('/watch-party/create')}
            >
              <svg viewBox="0 0 24 24" width={16} height={16} fill="currentColor"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>
              Host a Watch Party
            </button>

            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input
                className="form-input"
                style={{ width: 150 }}
                placeholder="Enter code (e.g. XK39F2)"
                value={joinCode}
                onChange={e => setJoinCode(e.target.value.toUpperCase())}
                maxLength={6}
              />
              <button className="btn btn-outline" onClick={handleJoin}>Join</button>
            </div>
          </div>

          {/* Live parties */}
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 700, marginBottom: 16 }}>
            Live Now
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14, marginBottom: 36 }}>
            {MOCK_PARTIES.filter(p => p.is_live).map(party => (
              <PartyCard key={party.id} party={party} canJoin={canWatchParty} onJoin={() => showToast(`Joining "${party.title}"… 🎉`, 'gold')} />
            ))}
          </div>

          {/* Upcoming */}
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 700, marginBottom: 16 }}>
            Upcoming
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14 }}>
            {MOCK_PARTIES.filter(p => !p.is_live).map(party => (
              <PartyCard key={party.id} party={party} canJoin={canWatchParty} onJoin={() => showToast('Party not started yet — set a reminder', 'gold')} />
            ))}
          </div>

          {/* Date Night mode explainer */}
          <div style={{
            marginTop: 48, background: 'linear-gradient(135deg, rgba(232,93,154,0.08), rgba(123,104,238,0.06))',
            border: '1px solid rgba(232,93,154,0.2)', borderRadius: 'var(--radius-lg)', padding: '24px',
          }}>
            <div style={{ fontSize: 11, color: '#e85d9a', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 8 }}>
              💕 Date Night Mode
            </div>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Watch Together, Apart</div>
            <div style={{ fontSize: 14, color: 'var(--text2)', lineHeight: 1.65 }}>
              Pick a movie from our Date Night Collection. Invite your partner with a private code.
              Playback stays in sync — pause on your end, they pause too.
              Chat side-by-side as you watch. Perfect for long-distance couples.
            </div>
          </div>
        </div>
      </div>
      <ToastContainer />
      <style>{`.form-input{background:var(--bg3);border:1px solid var(--bg4);border-radius:8px;padding:9px 12px;font-size:13px;color:var(--text);outline:none;font-family:'DM Sans',sans-serif;} .btn{display:inline-flex;align-items:center;gap:7px;padding:9px 18px;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer;border:none;transition:.2s;} .btn-gold{background:var(--gold);color:#000;} .btn-gold:hover:not(:disabled){background:var(--gold-light);} .btn-gold:disabled{opacity:.4;cursor:not-allowed;} .btn-outline{background:rgba(255,255,255,.07);color:var(--text);border:1px solid rgba(255,255,255,.14);} .btn-outline:hover{background:rgba(255,255,255,.13);}`}</style>
    </>
  )
}

function PartyCard({ party, canJoin, onJoin }) {
  return (
    <div className="card" style={{ padding: '18px 20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        {party.is_live && <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#e84a4a', animation: 'pulse 1.5s infinite' }} />}
        <span style={{
          fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em',
          color: party.mode === 'date_night' ? '#e85d9a' : 'var(--purple)',
          background: party.mode === 'date_night' ? 'rgba(232,93,154,0.12)' : 'rgba(123,104,238,0.12)',
          padding: '2px 7px', borderRadius: 4,
        }}>
          {party.mode === 'date_night' ? '💕 Date Night' : '🎬 Watch Party'}
        </span>
      </div>
      <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 4 }}>{party.title}</div>
      <div style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 3 }}>{party.movieTitle}</div>
      <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 14 }}>
        Hosted by {party.host} · {party.viewers} watching
      </div>
      <button
        className="btn"
        disabled={!canJoin}
        onClick={onJoin}
        style={{ background: canJoin ? 'var(--gold)' : 'var(--bg4)', color: canJoin ? '#000' : 'var(--text3)', fontSize: 12, padding: '7px 14px', width: '100%', justifyContent: 'center', borderRadius: 6, border: 'none', cursor: canJoin ? 'pointer' : 'not-allowed' }}
      >
        {canJoin ? (party.is_live ? `Join · Code: ${party.invite_code}` : 'Set Reminder') : 'Family Plan Required'}
      </button>
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}`}</style>
    </div>
  )
}
