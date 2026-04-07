import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { useAuth } from '../lib/AuthContext'
import { supabase } from '../lib/supabase'
import { COUNTRY_DATA } from '../data/countries'
import { C, CONTINENT_COLORS } from '../data/colors'
import AuthModal from '../components/AuthModal'

const width = 960
const height = 500

export default function WorldMapPage() {
  const { session, passportId } = useAuth()
  const [worldData, setWorldData] = useState(null)
  const [visited, setVisited] = useState(new Set())
  const [memories, setMemories] = useState({})
  const [hovered, setHovered] = useState(null)
  const [lastUnlocked, setLastUnlocked] = useState(null)
  const [showToast, setShowToast] = useState(false)
  const [showMemoryModal, setShowMemoryModal] = useState(null)
  const [memoryDraft, setMemoryDraft] = useState({ note: '', region: '', city: '', customLocation: '', month: '', year: '', photos: [] })
  const [activeTab, setActiveTab] = useState('map')
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [showSearch, setShowSearch] = useState(false)
  const [transform, setTransform] = useState({ x: 0, y: 0, k: 1 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState(null)
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [dataLoaded, setDataLoaded] = useState(false)
  const [authChecked, setAuthChecked] = useState(false)
  const mapRef = useRef(null)

  // D3 projection
  const projection = useMemo(() => {
    if (typeof window === 'undefined') return null
    const d3 = window.__d3
    if (!d3) return null
    return d3.geoNaturalEarth1().scale(155).translate([width / 2, height / 2])
  }, [])

  const pathGenerator = useMemo(() => {
    if (!projection) return null
    const d3 = window.__d3
    if (!d3) return null
    return d3.geoPath(projection)
  }, [projection])

  // Load d3 dynamically
  useEffect(() => {
    if (window.__d3) return
    import('d3-geo').then(d3Geo => {
      window.__d3 = d3Geo
      // Force re-render
      setWorldData(prev => prev ? { ...prev } : prev)
    })
  }, [])

  // Auth check
  useEffect(() => {
    setAuthChecked(true)
  }, [session])

  // Load data from Supabase or localStorage
  useEffect(() => {
    if (!authChecked) return
    if (session && passportId) {
      loadFromSupabase()
    } else if (!session) {
      loadFromLocalStorage()
    }
  }, [authChecked, session, passportId])

  async function loadFromSupabase() {
    try {
      const { data: vc } = await supabase
        .from('visited_countries')
        .select('country_code')
        .eq('passport_id', passportId)
      setVisited(new Set((vc || []).map(r => r.country_code)))

      const { data: mems } = await supabase
        .from('memories')
        .select('*')
        .eq('passport_id', passportId)
      const memObj = {}
      for (const m of (mems || [])) {
        memObj[m.country_code] = {
          note: m.note || '',
          location: m.custom_location || (m.region && m.city ? `${m.city}, ${m.region}` : m.region || ''),
          date: m.travel_date || '',
          region: m.region || '',
          city: m.city || '',
          customLocation: m.custom_location || '',
          month: (m.travel_date || '').split(' ')[0] || '',
          year: (m.travel_date || '').split(' ')[1] || '',
          photos: [],
        }
      }
      // Load photos
      if (mems && mems.length > 0) {
        const { data: photos } = await supabase
          .from('memory_photos')
          .select('memory_id, storage_path, display_order')
          .in('memory_id', mems.map(m => m.id))
          .order('display_order')
        for (const p of (photos || [])) {
          const mem = mems.find(m => m.id === p.memory_id)
          if (mem && memObj[mem.country_code]) {
            const { data: signedData } = await supabase.storage
              .from('memory-photos')
              .createSignedUrl(p.storage_path, 3600)
            if (signedData?.signedUrl) {
              memObj[mem.country_code].photos.push(signedData.signedUrl)
            }
          }
        }
      }
      setMemories(memObj)
      setDataLoaded(true)
    } catch (err) {
      console.error('Error loading data:', err)
      setDataLoaded(true)
    }
  }

  function loadFromLocalStorage() {
    try {
      const v = localStorage.getItem('VENTURE_visited')
      if (v) setVisited(new Set(JSON.parse(v)))
      const m = localStorage.getItem('VENTURE_memories')
      if (m) setMemories(JSON.parse(m))
    } catch {}
    setDataLoaded(true)
  }

  // Load world topojson
  useEffect(() => {
    fetch('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json')
      .then(r => r.json())
      .then(topology => {
        const countries = topology.objects.countries
        const arcs = topology.arcs
        const decodedArcs = arcs.map(arc => {
          let x = 0, y = 0
          return arc.map(([dx, dy]) => {
            x += dx; y += dy
            return [
              topology.transform.translate[0] + x * topology.transform.scale[0],
              topology.transform.translate[1] + y * topology.transform.scale[1]
            ]
          })
        })
        function arcToCoords(i) { return i >= 0 ? decodedArcs[i] : [...decodedArcs[~i]].reverse() }
        function ringToCoords(ring) { let c = []; ring.forEach(i => { c = c.concat(arcToCoords(i)) }); return c }
        const features = countries.geometries.map(geom => {
          let coordinates
          if (geom.type === 'Polygon') coordinates = geom.arcs.map(r => ringToCoords(r))
          else if (geom.type === 'MultiPolygon') coordinates = geom.arcs.map(p => p.map(r => ringToCoords(r)))
          return { type: 'Feature', id: geom.id, properties: { name: COUNTRY_DATA[geom.id]?.name || `${geom.id}` }, geometry: { type: geom.type, coordinates } }
        })
        setWorldData({ type: 'FeatureCollection', features })
      })
  }, [])

  // Persist localStorage for guests
  useEffect(() => {
    if (!dataLoaded || session) return
    try { localStorage.setItem('VENTURE_visited', JSON.stringify([...visited])) } catch {}
  }, [visited, session, dataLoaded])

  useEffect(() => {
    if (!dataLoaded || session) return
    try { localStorage.setItem('VENTURE_memories', JSON.stringify(memories)) } catch {}
  }, [memories, session, dataLoaded])

  // Search
  useEffect(() => {
    if (!searchQuery.trim()) { setSearchResults([]); return }
    const q = searchQuery.toLowerCase()
    const results = Object.entries(COUNTRY_DATA)
      .filter(([, c]) => c.name.toLowerCase().includes(q) || c.continent.toLowerCase().includes(q))
      .slice(0, 8)
      .map(([id, c]) => ({ id, ...c }))
    setSearchResults(results)
  }, [searchQuery])

  // Pre-populate memory draft
  useEffect(() => {
    if (showMemoryModal && memories[showMemoryModal]) {
      const existing = memories[showMemoryModal]
      setMemoryDraft({
        note: existing.note || '',
        region: existing.region || '',
        city: existing.city || '',
        customLocation: existing.customLocation || '',
        month: existing.month || '',
        year: existing.year || '',
        photos: existing.photos || [],
      })
    }
  }, [showMemoryModal, memories])

  // Zoom handlers
  const handleWheel = useCallback((e) => {
    e.preventDefault()
    const rect = mapRef.current?.getBoundingClientRect()
    if (!rect) return
    const mx = (e.clientX - rect.left) / rect.width * width
    const my = (e.clientY - rect.top) / rect.height * height
    const delta = e.deltaY > 0 ? 0.85 : 1.18
    setTransform(prev => {
      const nk = Math.max(1, Math.min(8, prev.k * delta))
      const ratio = nk / prev.k
      return { k: nk, x: mx - ratio * (mx - prev.x), y: my - ratio * (my - prev.y) }
    })
  }, [])

  const handleMouseDown = useCallback((e) => {
    if (transform.k <= 1) return
    const rect = mapRef.current?.getBoundingClientRect()
    if (!rect) return
    const vx = (e.clientX - rect.left) / rect.width * width
    const vy = (e.clientY - rect.top) / rect.height * height
    setIsDragging(true)
    setDragStart({ x: vx - transform.x, y: vy - transform.y })
  }, [transform])

  const handleMouseMove = useCallback((e) => {
    const rect = mapRef.current?.getBoundingClientRect()
    if (rect) setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top })
    if (!isDragging || !dragStart || !rect) return
    const vx = (e.clientX - rect.left) / rect.width * width
    const vy = (e.clientY - rect.top) / rect.height * height
    setTransform(prev => ({ ...prev, x: vx - dragStart.x, y: vy - dragStart.y }))
  }, [isDragging, dragStart])

  const handleMouseUp = useCallback(() => { setIsDragging(false); setDragStart(null) }, [])
  const resetZoom = () => setTransform({ x: 0, y: 0, k: 1 })

  const handleCountryClick = useCallback((id) => {
    if (isDragging) return
    const info = COUNTRY_DATA[id]
    if (!info) return

    setVisited(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
        setMemories(m => { const n = { ...m }; delete n[id]; return n })
        if (session && passportId) {
          supabase.from('visited_countries').delete().eq('passport_id', passportId).eq('country_code', id)
          supabase.from('memories').delete().eq('passport_id', passportId).eq('country_code', id)
        }
      } else {
        next.add(id)
        setLastUnlocked(id)
        setShowToast(true)
        setTimeout(() => setShowToast(false), 3500)
        setTimeout(() => setShowMemoryModal(id), 600)
        if (session && passportId) {
          supabase.from('visited_countries').upsert(
            { passport_id: passportId, country_code: id, added_by: session?.user?.id },
            { onConflict: 'passport_id,country_code' }
          )
        }
      }
      return next
    })
  }, [isDragging, session, passportId])

  const saveMemory = async (id) => {
    const { note, region, city, customLocation, month, year, photos } = memoryDraft
    const location = customLocation || (region && city ? `${city}, ${region}` : region || '')
    const date = month && year ? `${month} ${year}` : year || ''
    if (note || location || date || (photos && photos.length > 0)) {
      setMemories(prev => ({ ...prev, [id]: { ...prev[id], note, location, date, region, city, customLocation, month, year, photos: photos || [] } }))
      if (session && passportId) {
        try {
          await supabase.from('memories').upsert({
            passport_id: passportId,
            country_code: id,
            note: note || null,
            travel_date: date || null,
            region: region || null,
            city: city || null,
            custom_location: customLocation || location || null,
            added_by: session.user.id,
          }, { onConflict: 'passport_id,country_code' })
        } catch (err) { console.error('Save memory error:', err) }
      }
    }
    setShowMemoryModal(null)
    setMemoryDraft({ note: '', region: '', city: '', customLocation: '', month: '', year: '', photos: [] })
  }

  // Stats
  const visitedCount = visited.size
  const continentSet = new Set()
  visited.forEach(id => {
    const c = COUNTRY_DATA[id]
    if (c) continentSet.add(c.continent)
  })
  const continentCount = continentSet.size

  // Country fill color
  const getCountryColor = (id) => {
    const info = COUNTRY_DATA[id]
    if (!info) return C.land
    if (visited.has(id)) return CONTINENT_COLORS[info.continent] || C.accent
    if (hovered === id) return C.landHover
    return C.land
  }

  // SVG path rendering
  const renderPath = (feature) => {
    if (!pathGenerator) return null
    const d = pathGenerator(feature)
    if (!d) return null
    const id = feature.id
    const isVisited = visited.has(id)
    const isHovered = hovered === id

    return (
      <path
        key={id}
        d={d}
        fill={getCountryColor(id)}
        stroke={isVisited ? '#fff' : C.border}
        strokeWidth={isVisited ? 1 : 0.3}
        style={{
          cursor: 'pointer',
          transition: 'fill 0.25s ease',
          filter: isHovered ? 'brightness(1.05)' : 'none',
        }}
        onMouseEnter={() => setHovered(id)}
        onMouseLeave={() => setHovered(null)}
        onClick={() => handleCountryClick(id)}
      />
    )
  }

  // Tabs
  const tabs = [
    { id: 'map', label: 'Map', icon: '🌍' },
    { id: 'collection', label: 'Collection', icon: '🏆' },
    { id: 'passport', label: 'Passport', icon: '📖' },
  ]

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          {!session && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <svg width={18} height={22} viewBox="0 0 100 120" fill="none" stroke="var(--accent)" strokeWidth={5} strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 10 L50 75 L85 10" />
                <ellipse cx="50" cy="95" rx="20" ry="8" />
              </svg>
              <span style={{ fontSize: 14, fontWeight: 700, letterSpacing: '0.08em', color: 'var(--accent)' }}>VENTURE</span>
            </div>
          )}
          <div style={styles.tabs}>
            {tabs.map(t => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                style={{
                  ...styles.tab,
                  ...(activeTab === t.id ? styles.tabActive : {}),
                }}
              >
                <span>{t.icon}</span> {t.label}
              </button>
            ))}
          </div>
        </div>
        <div style={styles.headerRight}>
          {/* Search */}
          <div style={{ position: 'relative' }}>
            <button onClick={() => setShowSearch(!showSearch)} style={styles.iconBtn}>🔍</button>
            {showSearch && (
              <div style={styles.searchDropdown}>
                <input
                  type="text"
                  placeholder="Search countries..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  autoFocus
                  style={styles.searchInput}
                />
                {searchResults.map(r => (
                  <button
                    key={r.id}
                    onClick={() => {
                      handleCountryClick(r.id)
                      setShowSearch(false)
                      setSearchQuery('')
                    }}
                    style={styles.searchResult}
                  >
                    <span>{r.sticker?.icon}</span>
                    <span>{r.name}</span>
                    <span style={{ color: 'var(--text-muted)', fontSize: 11, marginLeft: 'auto' }}>{r.continent}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          {/* Stats */}
          <div style={styles.statPill}>
            <span style={styles.statValue}>{visitedCount}</span>
            <span style={styles.statLabel}>countries</span>
          </div>
          <div style={styles.statPill}>
            <span style={styles.statValue}>{continentCount}</span>
            <span style={styles.statLabel}>continents</span>
          </div>
          {!session && (
            <button onClick={() => setShowAuthModal(true)} style={styles.signInBtn}>
              Sign In
            </button>
          )}
        </div>
      </div>

      {/* Main content */}
      {activeTab === 'map' && (
        <div style={styles.mapContainer}>
          <svg
            ref={mapRef}
            viewBox={`0 0 ${width} ${height}`}
            style={styles.mapSvg}
            onWheel={handleWheel}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            {/* Ocean */}
            <rect x="0" y="0" width={width} height={height} fill={C.ocean} rx="0" />
            {/* Countries group with transform */}
            <g transform={`translate(${transform.x},${transform.y}) scale(${transform.k})`}>
              {worldData && worldData.features.map(f => renderPath(f))}
            </g>
          </svg>

          {/* Zoom controls */}
          <div style={styles.zoomControls}>
            <button onClick={() => setTransform(p => ({ ...p, k: Math.min(8, p.k * 1.3) }))} style={styles.zoomBtn}>+</button>
            <button onClick={() => setTransform(p => ({ ...p, k: Math.max(1, p.k * 0.77) }))} style={styles.zoomBtn}>−</button>
            {transform.k > 1 && (
              <button onClick={resetZoom} style={styles.zoomBtn}>↺</button>
            )}
          </div>

          {/* Hover tooltip */}
          {hovered && COUNTRY_DATA[hovered] && (
            <div style={{
              ...styles.tooltip,
              left: mousePos.x + 16,
              top: mousePos.y - 10,
            }}>
              <span style={{ fontSize: 16 }}>{COUNTRY_DATA[hovered].sticker?.icon}</span>
              <div>
                <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text)' }}>{COUNTRY_DATA[hovered].name}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                  {visited.has(hovered) ? '✓ Visited — click to remove' : 'Click to mark as visited'}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'collection' && (
        <CollectionView visited={visited} />
      )}

      {activeTab === 'passport' && (
        <PassportView visited={visited} memories={memories} />
      )}

      {/* Toast */}
      {showToast && lastUnlocked && COUNTRY_DATA[lastUnlocked] && (
        <div style={styles.toast}>
          <span style={{ fontSize: 24 }}>{COUNTRY_DATA[lastUnlocked].sticker?.icon}</span>
          <div>
            <div style={{ fontWeight: 700, color: 'var(--text)', fontSize: 14 }}>
              {COUNTRY_DATA[lastUnlocked].sticker?.title} unlocked!
            </div>
            <div style={{ color: 'var(--text-soft)', fontSize: 12 }}>{COUNTRY_DATA[lastUnlocked].name}</div>
          </div>
        </div>
      )}

      {/* Memory Modal */}
      {showMemoryModal && COUNTRY_DATA[showMemoryModal] && (
        <div style={styles.modalOverlay} onClick={() => setShowMemoryModal(null)}>
          <div style={styles.modalCard} onClick={e => e.stopPropagation()}>
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <div style={{ fontSize: 32 }}>{COUNTRY_DATA[showMemoryModal].sticker?.icon}</div>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)', marginTop: 8 }}>
                {COUNTRY_DATA[showMemoryModal].name}
              </h3>
              <p style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 600 }}>
                {COUNTRY_DATA[showMemoryModal].sticker?.title}
              </p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <textarea
                placeholder="Write about your experience..."
                value={memoryDraft.note}
                onChange={e => setMemoryDraft(d => ({ ...d, note: e.target.value }))}
                style={styles.textarea}
                rows={3}
              />
              <input
                type="text"
                placeholder="City or location"
                value={memoryDraft.customLocation}
                onChange={e => setMemoryDraft(d => ({ ...d, customLocation: e.target.value }))}
                style={styles.modalInput}
              />
              <div style={{ display: 'flex', gap: 8 }}>
                <select
                  value={memoryDraft.month}
                  onChange={e => setMemoryDraft(d => ({ ...d, month: e.target.value }))}
                  style={{ ...styles.modalInput, flex: 1 }}
                >
                  <option value="">Month</option>
                  {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
                <input
                  type="text"
                  placeholder="Year"
                  value={memoryDraft.year}
                  onChange={e => setMemoryDraft(d => ({ ...d, year: e.target.value }))}
                  style={{ ...styles.modalInput, flex: 1 }}
                />
              </div>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button onClick={() => setShowMemoryModal(null)} style={styles.cancelBtn}>Skip</button>
                <button onClick={() => saveMemory(showMemoryModal)} style={styles.saveBtn}>Save Memory</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Auth Modal */}
      {showAuthModal && (
        <AuthModal
          onClose={() => setShowAuthModal(false)}
          onSuccess={() => setShowAuthModal(false)}
        />
      )}
    </div>
  )
}

// ─── Collection View ───
function CollectionView({ visited }) {
  const byCont = {}
  visited.forEach(id => {
    const c = COUNTRY_DATA[id]
    if (!c) return
    if (!byCont[c.continent]) byCont[c.continent] = []
    byCont[c.continent].push({ id, ...c })
  })

  const allContinents = ['North America', 'South America', 'Europe', 'Africa', 'Asia', 'Oceania']

  return (
    <div style={{ padding: '24px 32px', overflowY: 'auto', maxHeight: 'calc(100vh - 60px)' }}>
      <h2 style={{ fontSize: 22, fontWeight: 700, fontFamily: 'var(--f-display)', marginBottom: 24 }}>
        Your Collection
      </h2>
      {allContinents.map(cont => {
        const countries = byCont[cont] || []
        const total = Object.values(COUNTRY_DATA).filter(c => c.continent === cont).length
        return (
          <div key={cont} style={{ marginBottom: 28 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <div style={{
                width: 10, height: 10, borderRadius: '50%',
                background: CONTINENT_COLORS[cont] || '#999'
              }} />
              <span style={{ fontWeight: 700, color: 'var(--text)', fontSize: 15 }}>{cont}</span>
              <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>
                {countries.length}/{total}
              </span>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {countries.map(c => (
                <div key={c.id} style={{
                  padding: '6px 12px',
                  borderRadius: 10,
                  background: `${CONTINENT_COLORS[cont]}15`,
                  border: `1px solid ${CONTINENT_COLORS[cont]}30`,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  fontSize: 12,
                  fontWeight: 600,
                  color: CONTINENT_COLORS[cont],
                }}>
                  <span>{c.sticker?.icon}</span>
                  {c.name}
                </div>
              ))}
              {countries.length === 0 && (
                <span style={{ color: 'var(--text-muted)', fontSize: 12, fontStyle: 'italic' }}>
                  No countries visited yet
                </span>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── Passport View ───
function PassportView({ visited, memories }) {
  const visitedArr = [...visited].filter(id => COUNTRY_DATA[id])

  if (visitedArr.length === 0) {
    return (
      <div style={{ padding: '60px 32px', textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>📖</div>
        <h3 style={{ fontSize: 20, fontWeight: 700, fontFamily: 'var(--f-display)', color: 'var(--text)' }}>
          Your passport is empty
        </h3>
        <p style={{ color: 'var(--text-soft)', fontSize: 14, marginTop: 8 }}>
          Click on countries in the map to start filling your passport.
        </p>
      </div>
    )
  }

  return (
    <div style={{ padding: '24px 32px', overflowY: 'auto', maxHeight: 'calc(100vh - 60px)' }}>
      <h2 style={{ fontSize: 22, fontWeight: 700, fontFamily: 'var(--f-display)', marginBottom: 24 }}>
        Your Passport — {visitedArr.length} stamps
      </h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14 }}>
        {visitedArr.map(id => {
          const c = COUNTRY_DATA[id]
          const mem = memories[id]
          return (
            <div key={id} style={{
              background: 'var(--card)',
              border: '1px solid var(--border)',
              borderRadius: 16,
              padding: '18px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <span style={{ fontSize: 24 }}>{c.sticker?.icon}</span>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text)' }}>{c.name}</div>
                  <div style={{ fontSize: 11, color: CONTINENT_COLORS[c.continent], fontWeight: 600 }}>
                    {c.sticker?.title}
                  </div>
                </div>
              </div>
              {mem?.note && (
                <p style={{ fontSize: 12, color: 'var(--text-soft)', fontStyle: 'italic', lineHeight: 1.5 }}>
                  "{mem.note}"
                </p>
              )}
              {mem?.location && (
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>📍 {mem.location}</div>
              )}
              {mem?.date && (
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>📅 {mem.date}</div>
              )}
              <div style={{
                marginTop: 10,
                padding: '6px 10px',
                background: 'rgba(91,140,90,0.06)',
                borderRadius: 8,
                fontSize: 11,
                color: 'var(--text-soft)',
                lineHeight: 1.5,
              }}>
                {c.discover}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

const styles = {
  container: {
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
    background: 'var(--bg)',
    overflow: 'hidden',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '10px 20px',
    borderBottom: '1px solid var(--border)',
    background: 'var(--card)',
    zIndex: 20,
    flexShrink: 0,
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: 20,
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  },
  tabs: {
    display: 'flex',
    gap: 4,
  },
  tab: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '7px 14px',
    borderRadius: 8,
    border: 'none',
    background: 'transparent',
    color: 'var(--text-soft)',
    fontSize: 13,
    fontWeight: 500,
    cursor: 'pointer',
    fontFamily: 'var(--f-ui)',
  },
  tabActive: {
    background: 'rgba(91,140,90,0.08)',
    color: 'var(--accent)',
    fontWeight: 600,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    border: '1px solid var(--border)',
    background: 'var(--bg)',
    cursor: 'pointer',
    fontSize: 14,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchDropdown: {
    position: 'absolute',
    top: 42,
    right: 0,
    width: 280,
    background: 'var(--card)',
    border: '1px solid var(--border)',
    borderRadius: 12,
    boxShadow: '0 12px 40px rgba(58,74,92,0.12)',
    zIndex: 30,
    overflow: 'hidden',
  },
  searchInput: {
    width: '100%',
    padding: '10px 14px',
    border: 'none',
    borderBottom: '1px solid var(--border-light)',
    background: 'var(--bg)',
    fontSize: 13,
    color: 'var(--text)',
    outline: 'none',
    fontFamily: 'var(--f-ui)',
  },
  searchResult: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    width: '100%',
    padding: '8px 14px',
    border: 'none',
    background: 'transparent',
    cursor: 'pointer',
    fontSize: 13,
    color: 'var(--text)',
    fontFamily: 'var(--f-ui)',
    textAlign: 'left',
  },
  statPill: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '4px 12px',
    borderRadius: 8,
    background: 'var(--bg)',
    border: '1px solid var(--border-light)',
  },
  statValue: {
    fontSize: 14,
    fontWeight: 700,
    color: 'var(--accent)',
  },
  statLabel: {
    fontSize: 11,
    color: 'var(--text-muted)',
    fontWeight: 500,
  },
  signInBtn: {
    padding: '7px 18px',
    borderRadius: 8,
    border: 'none',
    background: 'linear-gradient(135deg, #5B8C5A, #3A7A39)',
    color: '#fff',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: 'var(--f-ui)',
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
    overflow: 'hidden',
  },
  mapSvg: {
    width: '100%',
    height: '100%',
    cursor: 'grab',
  },
  zoomControls: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },
  zoomBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    border: '1px solid var(--border)',
    background: 'var(--card)',
    color: 'var(--text)',
    fontSize: 18,
    fontWeight: 600,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 2px 8px rgba(58,74,92,0.08)',
  },
  tooltip: {
    position: 'absolute',
    background: 'var(--card)',
    border: '1px solid var(--border)',
    borderRadius: 10,
    padding: '8px 12px',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    boxShadow: '0 4px 16px rgba(58,74,92,0.1)',
    pointerEvents: 'none',
    zIndex: 15,
  },
  toast: {
    position: 'fixed',
    bottom: 28,
    left: '50%',
    transform: 'translateX(-50%)',
    background: 'var(--card)',
    border: '1px solid var(--border)',
    borderRadius: 14,
    padding: '12px 20px',
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    boxShadow: '0 12px 40px rgba(58,74,92,0.15)',
    zIndex: 100,
    animation: 'popIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
  },
  modalOverlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(58,74,92,0.3)',
    backdropFilter: 'blur(8px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 200,
  },
  modalCard: {
    background: '#fff',
    borderRadius: 20,
    width: 400,
    maxWidth: '92vw',
    padding: '28px 24px',
    boxShadow: '0 24px 80px rgba(58,74,92,0.18)',
    animation: 'popIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
  },
  textarea: {
    width: '100%',
    padding: '10px 14px',
    borderRadius: 10,
    border: '1px solid var(--border)',
    background: 'var(--bg)',
    fontSize: 13,
    color: 'var(--text)',
    outline: 'none',
    fontFamily: 'var(--f-ui)',
    resize: 'vertical',
  },
  modalInput: {
    width: '100%',
    padding: '10px 14px',
    borderRadius: 10,
    border: '1px solid var(--border)',
    background: 'var(--bg)',
    fontSize: 13,
    color: 'var(--text)',
    outline: 'none',
    fontFamily: 'var(--f-ui)',
  },
  cancelBtn: {
    padding: '8px 18px',
    borderRadius: 8,
    border: '1px solid var(--border)',
    background: 'transparent',
    color: 'var(--text-soft)',
    fontSize: 13,
    fontWeight: 500,
    cursor: 'pointer',
    fontFamily: 'var(--f-ui)',
  },
  saveBtn: {
    padding: '8px 18px',
    borderRadius: 8,
    border: 'none',
    background: 'linear-gradient(135deg, #5B8C5A, #3A7A39)',
    color: '#fff',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: 'var(--f-ui)',
  },
}
