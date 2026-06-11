// components/PreRoll.jsx
// The VHS-era pre-film ad reel experience
// Sequence: Brand sponsor → Retro commercial → Nollywood trailer → Film begins
import { useState, useEffect, useRef } from 'react'

const MOCK_PREROLL = [
  {
    id: 'sponsor-1',
    slot_type: 'brand_sponsor',
    title: 'This film is brought to you by Peak Milk',
    brand: 'Peak Milk',
    youtube_video_id: null,
    duration_seconds: 30,
    skip_after: null, // not skippable on Classic
  },
  {
    id: 'retro-1',
    slot_type: 'retro_commercial',
    title: 'Indomie Super Pack — "Mama, I Want Indomie"',
    brand: 'Indomie',
    youtube_video_id: null,
    duration_seconds: 30,
    skip_after: null,
  },
  {
    id: 'trailer-1',
    slot_type: 'nollywood_trailer',
    title: 'Now Showing — Karishika',
    brand: null,
    youtube_video_id: null,
    duration_seconds: 60,
    skip_after: 5, // can skip after 5s
  },
]

export default function PreRoll({ movieTitle, userPlan, onComplete, onSkipAll }) {
  const [currentSlot, setCurrentSlot] = useState(0)
  const [countdown, setCountdown] = useState(0)
  const [canSkip, setCanSkip] = useState(false)
  const [showSkipAll, setShowSkipAll] = useState(false)
  const timerRef = useRef(null)
  const skipTimerRef = useRef(null)

  const isPremium = userPlan === 'premium' || userPlan === 'family'
  const slots = isPremium
    ? MOCK_PREROLL.filter(s => s.slot_type !== 'brand_sponsor') // Premium sees no brand ads
    : MOCK_PREROLL

  const slot = slots[currentSlot]

  useEffect(() => {
    if (!slot) { onComplete?.(); return }

    setCanSkip(false)
    setCountdown(slot.duration_seconds)

    // Countdown timer
    timerRef.current = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) {
          clearInterval(timerRef.current)
          advanceSlot()
          return 0
        }
        return c - 1
      })
    }, 1000)

    // Skip availability
    if (slot.skip_after) {
      skipTimerRef.current = setTimeout(() => {
        setCanSkip(true)
      }, slot.skip_after * 1000)
    }

    // Show "skip all" for Premium after 3 seconds
    if (isPremium) {
      setTimeout(() => setShowSkipAll(true), 3000)
    }

    return () => {
      clearInterval(timerRef.current)
      clearTimeout(skipTimerRef.current)
    }
  }, [currentSlot])

  const advanceSlot = () => {
    if (currentSlot < slots.length - 1) {
      setCurrentSlot(c => c + 1)
    } else {
      onComplete?.()
    }
  }

  if (!slot) return null

  const slotLabels = {
    brand_sponsor: '📢 Sponsored',
    retro_commercial: '📺 Classic Commercial',
    nollywood_trailer: '🎬 Coming Soon',
    platform_promo: '✨ NaijaRewind',
  }

  const slotColors = {
    brand_sponsor: '#c8a84b',
    retro_commercial: '#7b68ee',
    nollywood_trailer: '#e84a4a',
    platform_promo: '#4ace8a',
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 900,
      background: '#000',
      display: 'flex', flexDirection: 'column',
    }}>
      {/* VHS header */}
      <div style={{
        background: '#0a0800',
        padding: '10px 20px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        borderBottom: '1px solid #1a1a1a',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#e84a4a', animation: 'pulse 1.5s infinite' }} />
          <span style={{ fontSize: 11, color: slotColors[slot.slot_type] || '#c8a84b', fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase' }}>
            {slotLabels[slot.slot_type]}
          </span>
          {slot.brand && (
            <span style={{ fontSize: 11, color: '#5a5550', marginLeft: 4 }}>{slot.brand}</span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {/* Slot indicators */}
          <div style={{ display: 'flex', gap: 5 }}>
            {slots.map((_, i) => (
              <div key={i} style={{
                width: i === currentSlot ? 20 : 6,
                height: 6,
                borderRadius: 3,
                background: i < currentSlot ? '#4ace8a' : i === currentSlot ? (slotColors[slot.slot_type] || '#c8a84b') : '#222',
                transition: 'all 0.3s ease',
              }} />
            ))}
          </div>
          <span style={{ fontSize: 11, color: '#5a5550' }}>
            {currentSlot + 1} / {slots.length}
          </span>
        </div>
      </div>

      {/* Video area */}
      <div style={{ flex: 1, position: 'relative', background: '#000' }}>
        {slot.youtube_video_id ? (
          <iframe
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 'none' }}
            src={`https://www.youtube.com/embed/${slot.youtube_video_id}?autoplay=1&controls=0&rel=0&modestbranding=1&disablekb=1`}
            title={slot.title}
            allow="accelerometer; autoplay; encrypted-media"
          />
        ) : (
          /* Placeholder when no video yet */
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', gap: 20,
            background: 'linear-gradient(135deg, #1a0f00, #0a0a1a)',
          }}>
            {/* VHS scanlines */}
            <div style={{
              position: 'absolute', inset: 0, opacity: 0.04,
              backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(255,255,255,0.8) 3px, rgba(255,255,255,0.8) 4px)',
              pointerEvents: 'none',
            }} />
            <div style={{ fontSize: 56, position: 'relative' }}>
              {slot.slot_type === 'nollywood_trailer' ? '🎬' : '📺'}
            </div>
            {slot.brand && (
              <div style={{
                fontFamily: "'Georgia', serif",
                fontSize: 'clamp(20px, 4vw, 36px)',
                fontWeight: 700,
                color: slotColors[slot.slot_type],
                textAlign: 'center',
                textTransform: 'uppercase',
                letterSpacing: '.1em',
                position: 'relative',
              }}>
                {slot.brand}
              </div>
            )}
            <div style={{
              fontSize: 14, color: '#5a5550', textAlign: 'center',
              maxWidth: 360, lineHeight: 1.6, position: 'relative',
            }}>
              {slot.title}
            </div>
            <div style={{ fontSize: 12, color: '#3a3530', position: 'relative' }}>
              Upload video file to activate this ad slot
            </div>
          </div>
        )}

        {/* Progress bar */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          height: 3, background: 'rgba(255,255,255,0.1)',
        }}>
          <div style={{
            height: '100%',
            background: slotColors[slot.slot_type] || '#c8a84b',
            width: `${((slot.duration_seconds - countdown) / slot.duration_seconds) * 100}%`,
            transition: 'width 1s linear',
          }} />
        </div>

        {/* Bottom controls */}
        <div style={{
          position: 'absolute', bottom: 20, right: 20,
          display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8,
        }}>
          {/* Skip button */}
          {canSkip && (
            <button
              onClick={advanceSlot}
              style={{
                background: 'rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.2)',
                color: '#f0ede6', fontSize: 13, fontWeight: 600,
                padding: '8px 16px', borderRadius: 6, cursor: 'pointer',
                fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6,
              }}
            >
              Skip →
            </button>
          )}

          {/* Skip all for Premium */}
          {showSkipAll && isPremium && (
            <button
              onClick={onSkipAll || onComplete}
              style={{
                background: 'rgba(200,168,75,0.15)', border: '1px solid rgba(200,168,75,0.4)',
                color: '#c8a84b', fontSize: 12, fontWeight: 500,
                padding: '6px 14px', borderRadius: 6, cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              Skip all ads (Premium)
            </button>
          )}

          {/* Countdown — shown when not skippable */}
          {!canSkip && !isPremium && (
            <div style={{
              background: 'rgba(0,0,0,0.75)', border: '1px solid rgba(255,255,255,0.1)',
              color: '#9a9590', fontSize: 13, fontWeight: 500,
              padding: '8px 14px', borderRadius: 6, minWidth: 80, textAlign: 'center',
            }}>
              {countdown}s
            </div>
          )}
        </div>

        {/* "Film starting after" banner */}
        {currentSlot === slots.length - 1 && (
          <div style={{
            position: 'absolute', top: 16, left: 16,
            background: 'rgba(0,0,0,0.75)', border: '1px solid rgba(200,168,75,0.3)',
            borderRadius: 6, padding: '6px 12px', fontSize: 12, color: '#c8a84b',
          }}>
            📽 "{movieTitle}" starts in {countdown}s
          </div>
        )}
      </div>

      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}`}</style>
    </div>
  )
}
