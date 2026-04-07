import { useState, useEffect } from 'react'
import { useAuth } from '../lib/AuthContext'
import { supabase } from '../lib/supabase'
import { COUNTRY_DATA } from '../data/countries'

export default function PassportsPage() {
  const { session, passportId } = useAuth()
  const [visited, setVisited] = useState([])
  const [memories, setMemories] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!session || !passportId) {
      setLoading(false)
      return
    }
    loadData()
  }, [session, passportId])

  async function loadData() {
    try {
      const { data: vc } = await supabase
        .from('visited_countries')
        .select('country_code, visited_at')
        .eq('passport_id', passportId)
        .order('visited_at', { ascending: false })

      setVisited(vc || [])

      const { data: mems } = await supabase
        .from('memories')
        .select('*')
        .eq('passport_id', passportId)

      const memObj = {}
      for (const m of (mems || [])) {
        memObj[m.country_code] = {
          note: m.note || '',
          city: m.city || '',
          region: m.region || '',
          date: m.travel_date || '',
        }
      }
      setMemories(memObj)
    } catch (err) {
      console.error(err)
    }
    setLoading(false)
  }

  if (!session) {
    return (
      <div style={styles.container}>
        <div style={styles.emptyState}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📖</div>
          <h2 style={styles.emptyTitle}>Sign in to view your passports</h2>
          <p style={styles.emptyDesc}>Create an account to start building your travel passport collection.</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.emptyState}>
          <p style={{ color: 'var(--text-muted)' }}>Loading your passports...</p>
        </div>
      </div>
    )
  }

  // Group by continent
  const byContinent = {}
  for (const vc of visited) {
    const cd = COUNTRY_DATA[vc.country_code]
    if (!cd) continue
    const cont = cd.continent || 'Other'
    if (!byContinent[cont]) byContinent[cont] = []
    byContinent[cont].push({ ...vc, ...cd, memory: memories[vc.country_code] })
  }

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Your Passport</h1>
      <p style={styles.subtitle}>
        {visited.length} {visited.length === 1 ? 'country' : 'countries'} visited
      </p>

      {visited.length === 0 ? (
        <div style={styles.emptyState}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🗺️</div>
          <h2 style={styles.emptyTitle}>No stamps yet</h2>
          <p style={styles.emptyDesc}>Head to the Map and click on countries you've visited to start filling your passport.</p>
        </div>
      ) : (
        Object.entries(byContinent).map(([continent, countries]) => (
          <div key={continent} style={styles.continentSection}>
            <h2 style={styles.continentTitle}>{continent}</h2>
            <div style={styles.grid}>
              {countries.map(c => (
                <div key={c.country_code} style={styles.stampCard}>
                  <div style={styles.stampIcon}>{c.sticker?.icon || '📍'}</div>
                  <div style={{ flex: 1 }}>
                    <div style={styles.stampName}>{c.name}</div>
                    <div style={styles.stampTitle}>{c.sticker?.title}</div>
                    {c.memory?.note && (
                      <div style={styles.stampNote}>"{c.memory.note}"</div>
                    )}
                    {c.memory?.date && (
                      <div style={styles.stampDate}>{c.memory.date}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  )
}

const styles = {
  container: {
    padding: '32px 40px',
    maxWidth: 800,
  },
  title: {
    fontSize: 28,
    fontWeight: 700,
    fontFamily: 'var(--f-display)',
    color: 'var(--text)',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: 'var(--text-muted)',
    marginBottom: 32,
  },
  continentSection: {
    marginBottom: 32,
  },
  continentTitle: {
    fontSize: 14,
    fontWeight: 700,
    color: 'var(--accent)',
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    marginBottom: 12,
    fontFamily: 'var(--f-ui)',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: 12,
  },
  stampCard: {
    display: 'flex',
    gap: 14,
    padding: '16px 18px',
    borderRadius: 14,
    background: 'var(--card)',
    border: '1px solid var(--border)',
  },
  stampIcon: {
    fontSize: 28,
    width: 48,
    height: 48,
    borderRadius: 12,
    background: 'rgba(91,140,90,0.06)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  stampName: {
    fontSize: 15,
    fontWeight: 700,
    color: 'var(--text)',
    fontFamily: 'var(--f-ui)',
  },
  stampTitle: {
    fontSize: 12,
    color: 'var(--accent)',
    fontWeight: 600,
    marginTop: 2,
  },
  stampNote: {
    fontSize: 12,
    color: 'var(--text-soft)',
    fontStyle: 'italic',
    marginTop: 6,
    lineHeight: 1.4,
  },
  stampDate: {
    fontSize: 11,
    color: 'var(--text-muted)',
    marginTop: 4,
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '50vh',
    textAlign: 'center',
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: 700,
    color: 'var(--text)',
    fontFamily: 'var(--f-display)',
    marginBottom: 8,
  },
  emptyDesc: {
    fontSize: 14,
    color: 'var(--text-soft)',
    maxWidth: 360,
  },
}
