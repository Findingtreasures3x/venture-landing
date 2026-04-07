import { useState, useRef, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { geoNaturalEarth1, geoPath } from 'd3-geo'
import { feature } from 'topojson-client'
import { useAuth } from '../lib/AuthContext'
import AuthModal from '../components/AuthModal'

const CITIES = [
  { emoji: '🗽', name: 'NYC', color: '#5B8C5A' },
  { emoji: '🌴', name: 'Miami', color: '#00897B' },
  { emoji: '🗼', name: 'Paris', color: '#8E24AA' },
  { emoji: '🌉', name: 'SF', color: '#D4880A' },
  { emoji: '⛰️', name: 'Denver', color: '#2D7D46' },
  { emoji: '🏯', name: 'Tokyo', color: '#1A3A5C' },
  { emoji: '🌺', name: 'Honolulu', color: '#E84393' },
  { emoji: '🏛️', name: 'Rome', color: '#C0392B' },
  { emoji: '🎭', name: 'London', color: '#5B6ABF' },
  { emoji: '🌮', name: 'Mexico City', color: '#3A7A39' },
]

const VENTURES = [
  {
    title: 'Midnight in Kyoto',
    loc: 'Kyoto, Japan',
    date: 'Oct 12',
    emoji: '⛩️',
    color: '#C07654',
    accent: '#D4A07A',
    sticker: 'Wabi-Sabi',
    memory: 'Bamboo forest at golden hour. No words, just the sound of wind.',
    img: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=600&q=75',
  },
  {
    title: 'First Time in Patagonia',
    loc: 'Torres del Paine, Chile',
    date: 'Jan 24',
    emoji: '🏔️',
    color: '#5B8C5A',
    accent: '#8BB58A',
    sticker: 'Tierra del Fuego',
    memory: 'The mountains were bigger than anything I\'d imagined.',
    img: 'https://images.unsplash.com/photo-1531761535209-180857e963b9?w=600&q=75',
  },
  {
    title: 'Medina Wandering',
    loc: 'Marrakech, Morocco',
    date: 'Mar 5',
    emoji: '🫖',
    color: '#6B7FBF',
    accent: '#A0B0E0',
    sticker: 'Medina Walker',
    memory: 'Got lost three times. Found the best mint tea of my life.',
    img: 'https://images.unsplash.com/photo-1489749798305-4fea3ae63d43?w=600&q=75',
  },
]

const PERSONAS = [
  { emoji: '💑', title: 'Couples', desc: 'Turn your trips together into a shared memory book. Every country you visit becomes a page you\'ll look back on together.' },
  { emoji: '👥', title: 'Friend Groups', desc: 'One passport for the whole crew. Add your photos and memories from the same trip, all in one place.' },
  { emoji: '🧭', title: 'Solo Explorers', desc: 'Build your personal passport. Track every country, add your photos and stories. Your map fills up as you go.' },
  { emoji: '🌍', title: 'Travel Collectors', desc: 'See your world come together — countries visited, continents explored. Venture makes your travel record tangible and beautiful.' },
]

function useInView(t = 0.05) {
  const r = useRef(null)
  const [v, s] = useState(false)
  useEffect(() => {
    const e = r.current
    if (!e) return
    const o = new IntersectionObserver(([en]) => {
      if (en.isIntersecting) { s(true); o.disconnect() }
    }, { threshold: t, rootMargin: '0px 0px 80px 0px' })
    o.observe(e)
    const rect = e.getBoundingClientRect()
    if (rect.top < window.innerHeight && rect.bottom > 0) s(true)
    return () => o.disconnect()
  }, [])
  return [r, v]
}

function FadeIn({ children, delay = 0, y = 30, style = {} }) {
  const [r, v] = useInView()
  return (
    <div ref={r} style={{
      opacity: v ? 1 : 0,
      transform: v ? 'translateY(0)' : `translateY(${y}px)`,
      transition: `opacity 0.7s ease ${delay}s, transform 0.7s ease ${delay}s`,
      ...style,
    }}>
      {children}
    </div>
  )
}

function MiniSticker({ emoji, color, size = 52 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      border: `2.5px solid ${color}`,
      background: `radial-gradient(circle at 30% 30%, ${color}25, transparent)`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      boxShadow: `0 0 20px ${color}30`, flexShrink: 0,
    }}>
      <span style={{ fontSize: size * 0.46 }}>{emoji}</span>
    </div>
  )
}

function MapPreview() {
  const [worldData, setWorldData] = useState(null)
  const W = 960, H = 500
  const sampleVisited = new Set(['840','076','380','392','504','710','036','356','250','276','764','032'])
  const sampleColors = {
    '840': '#5B8C5A', '076': '#5B8C5A', '032': '#5B8C5A',
    '380': '#6B7FBF', '250': '#6B7FBF', '276': '#6B7FBF',
    '392': '#1A3A5C', '356': '#1A3A5C', '764': '#1A3A5C',
    '504': '#C07654', '710': '#C07654',
    '036': '#00897B',
  }
  const projection = useMemo(() => geoNaturalEarth1().scale(155).translate([W / 2, H / 2]), [])
  const path = useMemo(() => geoPath(projection), [projection])
  useEffect(() => {
    fetch('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json')
      .then(r => r.json())
      .then(topology => setWorldData(feature(topology, topology.objects.countries)))
      .catch(() => {})
  }, [])
  return (
    <div style={{
      position: 'relative', width: '100%', maxWidth: 560, aspectRatio: '16/9',
      background: 'rgba(91,140,90,0.04)', borderRadius: 16, margin: '0 auto',
      border: '1px solid var(--border)', overflow: 'hidden', cursor: 'pointer',
    }}>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: '100%', display: 'block' }}>
        <rect x="0" y="0" width={W} height={H} fill="#e8ecf0" rx="0" />
        {worldData && worldData.features.map(f => {
          const d = path(f)
          if (!d) return null
          const isVisited = sampleVisited.has(f.id)
          return (
            <path
              key={f.id}
              d={d}
              fill={isVisited ? (sampleColors[f.id] || '#5B8C5A') : '#ddd6cb'}
              stroke={isVisited ? '#fff' : 'rgba(58,74,92,0.15)'}
              strokeWidth={isVisited ? 0.8 : 0.3}
            />
          )
        })}
      </svg>
      <div style={{
        position: 'absolute', bottom: 12, right: 12,
        background: 'rgba(58,74,92,0.08)', backdropFilter: 'blur(12px)',
        borderRadius: 10, padding: '8px 14px', display: 'flex', gap: 16,
      }}>
        {[{ v: '12', l: 'Countries' }, { v: '34', l: 'Cities' }, { v: '4', l: 'Continents' }].map((s, i) => (
          <div key={i} style={{ textAlign: 'center' }}>
            <div style={{ color: '#5B8C5A', fontSize: 14, fontWeight: 700 }}>{s.v}</div>
            <div style={{ color: 'var(--text-muted)', fontSize: 8, fontWeight: 600, letterSpacing: '0.05em' }}>{s.l.toUpperCase()}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
export default function Landing() {
  const navigate = useNavigate()
  const { session } = useAuth()
  const [showAuth, setShowAuth] = useState(false)

  const handleAuthSuccess = () => {
    setShowAuth(false)
    navigate('/dashboard')
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)', fontFamily: 'var(--f-body)', overflowX: 'hidden' }}>

      {/* Nav */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        background: 'rgba(246,243,237,0.85)', backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(221,214,203,0.6)', padding: '14px 24px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <svg width={18} height={22} viewBox="0 0 100 120" fill="none" stroke="var(--accent)" strokeWidth={5} strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 10 L50 75 L85 10" />
            <ellipse cx="50" cy="95" rx="20" ry="8" />
          </svg>
          <span style={{ fontSize: 15, fontWeight: 700, letterSpacing: '0.1em', color: 'var(--accent)' }}>VENTURE</span>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {session ? (
            <button onClick={() => navigate('/dashboard')} style={{
              padding: '8px 20px', borderRadius: 8, border: 'none', cursor: 'pointer',
              background: 'var(--accent)', color: '#fff', fontSize: 12, fontWeight: 700,
              fontFamily: 'var(--f-body)',
            }}>
              Go to Dashboard
            </button>
          ) : (
            <>
              <button onClick={() => setShowAuth(true)} style={{
                padding: '8px 20px', borderRadius: 8, border: '1px solid var(--border)', cursor: 'pointer',
                background: 'transparent', color: 'var(--text)', fontSize: 12, fontWeight: 600,
                fontFamily: 'var(--f-body)',
              }}>
                Sign In
              </button>
              <button onClick={() => navigate('/dashboard')} style={{
                padding: '8px 20px', borderRadius: 8, border: 'none', cursor: 'pointer',
                background: 'var(--accent)', color: '#fff', fontSize: 12, fontWeight: 700,
                fontFamily: 'var(--f-body)',
              }}>
                Explore Map
              </button>
            </>
          )}
        </div>
      </nav>

      {/* Hero */}
      <section style={{
        minHeight: '100vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', textAlign: 'center',
        padding: '100px 24px 40px', position: 'relative',
      }}>
        <div style={{
          position: 'absolute', top: '20%', left: '50%', transform: 'translateX(-50%)',
          width: 600, height: 600, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(91,140,90,0.08), transparent 70%)',
          filter: 'blur(60px)', pointerEvents: 'none',
        }} />
        <FadeIn delay={0.1}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            background: 'rgba(91,140,90,0.08)', border: '1px solid var(--border)',
            borderRadius: 20, padding: '6px 16px', marginBottom: 28,
          }}>
            <span style={{ fontSize: 12 }}>📍</span>
            <span style={{ color: 'var(--accent)', fontSize: 12, fontWeight: 600 }}>A new way to keep your adventures</span>
          </div>
        </FadeIn>
        <FadeIn delay={0.25}>
          <h1 style={{
            fontSize: 'clamp(36px, 7vw, 64px)', fontWeight: 800, lineHeight: 1.08,
            fontFamily: 'var(--f-display)', letterSpacing: '-0.03em', maxWidth: 720, marginBottom: 20,
          }}>
            Your adventures deserve more than a{' '}
            <span style={{
              background: 'linear-gradient(135deg, #5B8C5A, #8BB58A)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>camera roll.</span>
          </h1>
        </FadeIn>
        <FadeIn delay={0.4}>
          <p style={{
            fontSize: 'clamp(15px, 2.2vw, 18px)', color: 'var(--text-soft)',
            maxWidth: 520, lineHeight: 1.65, marginBottom: 36,
          }}>
            Turn your travels into a personal passport. Click a country, add your photos and stories,
            and build a beautiful collection of everywhere you've been — one memory at a time.
          </p>
        </FadeIn>
        <FadeIn delay={0.55}>
          <div style={{ display: 'flex', gap: 12 }}>
            {session ? (
              <button onClick={() => navigate('/dashboard')} style={{
                padding: '14px 32px', borderRadius: 10, border: 'none', cursor: 'pointer',
                background: 'linear-gradient(135deg, #5B8C5A, #3A7A39)', color: '#fff',
                fontSize: 15, fontWeight: 700, fontFamily: 'var(--f-body)',
                boxShadow: '0 4px 20px rgba(91,140,90,0.3)',
              }}>
                Go to Your Dashboard
              </button>
            ) : (
              <>
                <button onClick={() => setShowAuth(true)} style={{
                  padding: '14px 28px', borderRadius: 10, border: 'none', cursor: 'pointer',
                  background: 'linear-gradient(135deg, #5B8C5A, #3A7A39)', color: '#fff',
                  fontSize: 15, fontWeight: 700, fontFamily: 'var(--f-body)',
                  boxShadow: '0 4px 20px rgba(91,140,90,0.3)',
                }}>
                  Create Account
                </button>
                <button onClick={() => navigate('/dashboard')} style={{
                  padding: '14px 28px', borderRadius: 10, border: '1px solid var(--border)',
                  cursor: 'pointer', background: 'transparent', color: 'var(--text)',
                  fontSize: 15, fontWeight: 600, fontFamily: 'var(--f-body)',
                }}>
                  Try as Guest
                </button>
              </>
            )}
          </div>
        </FadeIn>
        <FadeIn delay={0.7} style={{
          display: 'flex', gap: 12, marginTop: 48, flexWrap: 'wrap', justifyContent: 'center',
        }}>
          {CITIES.slice(0, 8).map((c, i) => (
            <div key={i} style={{
              animation: `float ${3 + i * 0.4}s ease-in-out infinite alternate`,
              animationDelay: `${i * 0.25}s`,
            }}>
              <MiniSticker emoji={c.emoji} color={c.color} size={42} />
            </div>
          ))}
        </FadeIn>
      </section>

      {/* How it works */}
      <section style={{ padding: '60px 24px 50px', maxWidth: 560, margin: '0 auto' }}>
        <FadeIn>
          <p style={{ color: 'var(--accent)', fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', marginBottom: 10 }}>HOW IT WORKS</p>
          <h2 style={{ fontSize: 32, fontWeight: 700, fontFamily: 'var(--f-display)', letterSpacing: '-0.02em', marginBottom: 8 }}>Three steps. That's it.</h2>
          <p style={{ color: 'var(--text-soft)', fontSize: 14, lineHeight: 1.6, marginBottom: 36 }}>
            No complicated setup. No app to download. Just open the map and start building your passport.
          </p>
        </FadeIn>
        {[
          { num: 1, icon: '🌍', title: 'Pick a country', desc: 'Click anywhere on the interactive world map. Every country is a blank page waiting for your story.' },
          { num: 2, icon: '📸', title: 'Add your memory', desc: 'Upload your photos, write what you remember, mark the date and city. Make it yours.' },
          { num: 3, icon: '📖', title: 'Build your passport portfolio', desc: 'Each country becomes a passport page with your photos, words, and a collectible sticker. Watch your collection grow.' },
        ].map((s, i) => (
          <FadeIn key={i} delay={i * 0.05}>
            <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', padding: '18px 0' }}>
              <div style={{
                width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                background: 'rgba(91,140,90,0.1)', border: '1px solid rgba(91,140,90,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20,
              }}>{s.icon}</div>
              <div>
                <div style={{ color: 'rgba(91,140,90,0.5)', fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', marginBottom: 4 }}>STEP {s.num}</div>
                <div style={{ color: 'var(--text)', fontSize: 16, fontWeight: 700, marginBottom: 4, fontFamily: 'var(--f-display)' }}>{s.title}</div>
                <div style={{ color: 'var(--text-soft)', fontSize: 13, lineHeight: 1.55 }}>{s.desc}</div>
              </div>
            </div>
          </FadeIn>
        ))}
      </section>

      {/* Story cards */}
      <section style={{ padding: '40px 24px 60px' }}>
        <FadeIn>
          <div style={{ textAlign: 'center', marginBottom: 36 }}>
            <p style={{ color: 'var(--accent)', fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', marginBottom: 10 }}>WHAT YOU GET</p>
            <h2 style={{ fontSize: 32, fontWeight: 700, fontFamily: 'var(--f-display)', letterSpacing: '-0.02em' }}>Your passport, your story</h2>
            <p style={{ color: 'var(--text-soft)', fontSize: 14, maxWidth: 440, margin: '8px auto 0', lineHeight: 1.6 }}>
              Every country you visit becomes a passport page — with your photos, your words, and a collectible sticker you'll never forget.
            </p>
          </div>
        </FadeIn>
        <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap', maxWidth: 740, margin: '0 auto' }}>
          {VENTURES.map((v, i) => (
            <FadeIn key={i} delay={i * 0.12} style={{ flexShrink: 0 }}>
              <div style={{
                width: 230, borderRadius: 18, overflow: 'hidden',
                background: 'var(--card)', boxShadow: '0 12px 40px rgba(58,74,92,0.1)',
                border: '1px solid var(--border)',
              }}>
                <div style={{ position: 'relative', height: 170 }}>
                  <img src={v.img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(255,255,255,0.95) 5%, transparent 50%)' }} />
                  <div style={{
                    position: 'absolute', top: 10, left: 10,
                    background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(8px)',
                    padding: '4px 10px', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 5,
                    border: `1px solid ${v.color}25`,
                  }}>
                    <span style={{ fontSize: 14 }}>{v.emoji}</span>
                    <span style={{ color: v.color, fontSize: 9, fontWeight: 700, letterSpacing: '0.06em' }}>{v.sticker}</span>
                  </div>
                  <div style={{ position: 'absolute', bottom: 10, left: 12, right: 12 }}>
                    <div style={{ color: 'var(--text)', fontSize: 14, fontWeight: 700, fontFamily: 'var(--f-display)', lineHeight: 1.2 }}>{v.title}</div>
                  </div>
                </div>
                <div style={{ padding: '10px 14px 14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 8 }}>
                    <svg width={9} height={9} viewBox="0 0 16 16" fill={v.accent}><path d="M8 1C5.24 1 3 3.24 3 6c0 3.75 5 9 5 9s5-5.25 5-9c0-2.76-2.24-5-5-5zm0 7a2 2 0 110-4 2 2 0 010 4z" /></svg>
                    <span style={{ color: v.accent, fontSize: 10, fontWeight: 600 }}>{v.loc}</span>
                    <span style={{ color: 'var(--text-muted)', fontSize: 10, marginLeft: 'auto' }}>{v.date}</span>
                  </div>
                  <div style={{
                    padding: '8px 10px', background: `${v.color}08`, borderRadius: 10,
                    borderLeft: `3px solid ${v.color}40`, fontSize: 11, color: 'var(--text-soft)',
                    lineHeight: 1.5, fontStyle: 'italic',
                  }}>
                    "{v.memory}"
                  </div>
                </div>
              </div>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* Interactive map preview */}
      <section style={{ padding: '40px 24px 60px', maxWidth: 960, margin: '0 auto' }}>
        <FadeIn>
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <p style={{ color: 'var(--accent)', fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', marginBottom: 10 }}>TRY IT NOW</p>
            <h2 style={{ fontSize: 28, fontWeight: 700, fontFamily: 'var(--f-display)', letterSpacing: '-0.02em', marginBottom: 8 }}>
              Start building your passport
            </h2>
            <p style={{ color: 'var(--text-soft)', fontSize: 14, maxWidth: 480, margin: '0 auto', lineHeight: 1.6 }}>
              Click the map to explore the full interactive experience.
            </p>
          </div>
        </FadeIn>
        <FadeIn delay={0.15}>
          <div onClick={() => navigate('/dashboard')} style={{
            borderRadius: 20, border: '1px solid var(--border)', overflow: 'hidden',
            boxShadow: '0 8px 40px rgba(58,74,92,0.08)', background: 'var(--card)',
            cursor: 'pointer', transition: 'box-shadow 0.3s, transform 0.3s',
          }}>
            <div style={{ padding: 24 }}>
              <MapPreview />
              <div style={{
                textAlign: 'center', marginTop: 16, color: 'var(--accent)',
                fontSize: 14, fontWeight: 600,
              }}>
                Click to open full interactive map →
              </div>
            </div>
          </div>
        </FadeIn>
      </section>

      {/* Personas */}
      <section style={{ padding: '40px 24px 60px', maxWidth: 700, margin: '0 auto' }}>
        <FadeIn>
          <div style={{ textAlign: 'center', marginBottom: 36 }}>
            <p style={{ color: 'var(--accent)', fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', marginBottom: 10 }}>WHO IT'S FOR</p>
            <h2 style={{ fontSize: 28, fontWeight: 700, fontFamily: 'var(--f-display)', letterSpacing: '-0.02em' }}>However you explore</h2>
          </div>
        </FadeIn>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14 }}>
          {PERSONAS.map((pe, i) => (
            <FadeIn key={i} delay={i * 0.1}>
              <div style={{
                background: 'rgba(91,140,90,0.04)', border: '1px solid var(--border)',
                borderRadius: 14, padding: '24px 22px',
              }}>
                <div style={{ fontSize: 28, marginBottom: 12 }}>{pe.emoji}</div>
                <div style={{ color: 'var(--text)', fontSize: 16, fontWeight: 700, marginBottom: 8, fontFamily: 'var(--f-display)' }}>{pe.title}</div>
                <div style={{ color: 'var(--text-soft)', fontSize: 13, lineHeight: 1.55 }}>{pe.desc}</div>
              </div>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* Comparison */}
      <section style={{ padding: '40px 24px 60px', maxWidth: 600, margin: '0 auto' }}>
        <FadeIn>
          <p style={{ color: 'var(--accent)', fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', marginBottom: 10 }}>WHY VENTURE</p>
          <h2 style={{ fontSize: 28, fontWeight: 700, fontFamily: 'var(--f-display)', letterSpacing: '-0.02em', marginBottom: 8 }}>You've tried everything else.</h2>
          <p style={{ color: 'var(--text-soft)', fontSize: 14, lineHeight: 1.6, marginBottom: 28 }}>
            Here's where your travel memories go right now — and how Venture is different.
          </p>
        </FadeIn>
        <div style={{ background: 'rgba(91,140,90,0.04)', borderRadius: 14, border: '1px solid var(--border)', overflow: 'hidden' }}>
          <div style={{
            display: 'grid', gridTemplateColumns: '110px 1fr 1fr',
            borderBottom: '1px solid var(--border)', fontSize: 10, fontWeight: 700,
            letterSpacing: '0.08em', color: 'var(--text-muted)',
          }}>
            <div style={{ padding: 12 }}>TODAY</div>
            <div style={{ padding: 12 }}>WHAT HAPPENS</div>
            <div style={{ padding: 12, color: 'var(--accent)' }}>WITH VENTURE</div>
          </div>
          {[
            ['Camera Roll', 'Photos pile up, never organized', 'Photos organized by country with your story attached'],
            ['Instagram', 'Performative posts for an audience', 'A personal keepsake you actually look back on'],
            ['Shared Album', 'Photo dump with no context', 'Memories with dates, places, and your own words'],
            ['Google Maps', 'A list of places with no emotion', 'A world map that shows the adventures behind each pin'],
          ].map(([p, b, a], i) => (
            <FadeIn key={i} delay={i * 0.05}>
              <div style={{
                display: 'grid', gridTemplateColumns: '110px 1fr 1fr',
                borderBottom: i < 3 ? '1px solid var(--border)' : 'none', fontSize: 13,
              }}>
                <div style={{ padding: '14px 12px', color: 'var(--text)', fontWeight: 600 }}>{p}</div>
                <div style={{ padding: '14px 12px', color: 'var(--text-muted)' }}>{b}</div>
                <div style={{ padding: '14px 12px', color: '#5B8C5A', fontWeight: 500 }}>{a}</div>
              </div>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* Sticker collection */}
      <section style={{ padding: '40px 24px 60px' }}>
        <FadeIn>
          <div style={{ textAlign: 'center', marginBottom: 36 }}>
            <p style={{ color: 'var(--accent)', fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', marginBottom: 10 }}>YOUR COLLECTION</p>
            <h2 style={{ fontSize: 28, fontWeight: 700, fontFamily: 'var(--f-display)', letterSpacing: '-0.02em', marginBottom: 8 }}>Collect every city</h2>
            <p style={{ color: 'var(--text-soft)', fontSize: 14, maxWidth: 420, margin: '0 auto', lineHeight: 1.6 }}>
              Every country gets its own collectible sticker. Your shelf grows with every adventure.
            </p>
          </div>
        </FadeIn>
        <FadeIn delay={0.15}>
          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap', maxWidth: 560, margin: '0 auto' }}>
            {CITIES.map((c, i) => (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                <MiniSticker emoji={c.emoji} color={c.color} size={52} />
                <span style={{ color: 'var(--text-soft)', fontSize: 10, fontWeight: 600 }}>{c.name}</span>
              </div>
            ))}
          </div>
        </FadeIn>
      </section>

      {/* Final CTA */}
      <section style={{ padding: '60px 24px 80px', textAlign: 'center', position: 'relative' }}>
        <div style={{
          position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)',
          width: 500, height: 500, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(91,140,90,0.06), transparent 70%)',
          filter: 'blur(60px)', pointerEvents: 'none',
        }} />
        <FadeIn>
          <h2 style={{
            fontSize: 'clamp(28px, 5vw, 40px)', fontWeight: 800, fontFamily: 'var(--f-display)',
            letterSpacing: '-0.02em', maxWidth: 520, margin: '0 auto 16px',
          }}>
            Go somewhere.{' '}
            <span style={{ background: 'linear-gradient(135deg, #5B8C5A, #8BB58A)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Prove it.</span>{' '}
            Keep it forever.
          </h2>
          <p style={{ color: 'var(--text-soft)', fontSize: 15, maxWidth: 400, margin: '0 auto 32px', lineHeight: 1.6 }}>
            Create your account and be the first to build your passport.
          </p>
        </FadeIn>
        <FadeIn delay={0.15}>
          <div style={{ position: 'relative', zIndex: 1, display: 'flex', gap: 12, justifyContent: 'center' }}>
            {session ? (
              <button onClick={() => navigate('/dashboard')} style={{
                padding: '14px 32px', borderRadius: 10, border: 'none', cursor: 'pointer',
                background: 'linear-gradient(135deg, #5B8C5A, #3A7A39)', color: '#fff',
                fontSize: 15, fontWeight: 700, fontFamily: 'var(--f-body)',
                boxShadow: '0 4px 20px rgba(91,140,90,0.3)',
              }}>
                Open Dashboard
              </button>
            ) : (
              <>
                <button onClick={() => setShowAuth(true)} style={{
                  padding: '14px 28px', borderRadius: 10, border: 'none', cursor: 'pointer',
                  background: 'linear-gradient(135deg, #5B8C5A, #3A7A39)', color: '#fff',
                  fontSize: 15, fontWeight: 700, fontFamily: 'var(--f-body)',
                  boxShadow: '0 4px 20px rgba(91,140,90,0.3)',
                }}>
                  Create Account
                </button>
                <button onClick={() => navigate('/dashboard')} style={{
                  padding: '14px 28px', borderRadius: 10, border: '1px solid var(--border)',
                  cursor: 'pointer', background: 'transparent', color: 'var(--text)',
                  fontSize: 15, fontWeight: 600, fontFamily: 'var(--f-body)',
                }}>
                  Explore as Guest
                </button>
              </>
            )}
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: 11, marginTop: 12, position: 'relative', zIndex: 1 }}>
            Free forever. No spam.
          </p>
        </FadeIn>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid rgba(221,214,203,0.6)', padding: '28px 24px', textAlign: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 8 }}>
          <svg width={12} height={14} viewBox="0 0 100 120" fill="none" stroke="var(--accent)" strokeWidth={6} strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 10 L50 75 L85 10" />
            <ellipse cx="50" cy="95" rx="20" ry="8" />
          </svg>
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', color: 'var(--text-muted)' }}>VENTURE</span>
        </div>
        <p style={{ color: 'rgba(91,140,90,0.15)', fontSize: 11 }}>© 2026 Venture · Go somewhere worth remembering</p>
      </footer>

      {/* Auth Modal */}
      {showAuth && (
        <AuthModal onClose={() => setShowAuth(false)} onSuccess={handleAuthSuccess} />
      )}
    </div>
  )
}
