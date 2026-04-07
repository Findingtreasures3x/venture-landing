import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'

const NAV_ITEMS = [
  { path: '/dashboard', label: 'Map', icon: '🌍', exact: true },
  { path: '/dashboard/passports', label: 'Passports', icon: '📖' },
  { path: '/dashboard/settings', label: 'Settings', icon: '⚙️' },
]

export default function Sidebar() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, profile, signOut } = useAuth()

  const isActive = (item) => {
    if (item.exact) return location.pathname === item.path
    return location.pathname.startsWith(item.path)
  }

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  const displayName = profile?.display_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Traveler'

  return (
    <aside style={styles.sidebar}>
      {/* Logo */}
      <div style={styles.logo} onClick={() => navigate('/')}>
        <svg width={20} height={24} viewBox="0 0 100 120" fill="none" stroke="var(--accent)" strokeWidth={5} strokeLinecap="round" strokeLinejoin="round">
          <path d="M15 10 L50 75 L85 10" />
          <ellipse cx="50" cy="95" rx="20" ry="8" />
        </svg>
        <span style={styles.logoText}>VENTURE</span>
      </div>

      {/* Navigation */}
      <nav style={styles.nav}>
        {NAV_ITEMS.map(item => (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            style={{
              ...styles.navItem,
              ...(isActive(item) ? styles.navItemActive : {}),
            }}
          >
            <span style={{ fontSize: 18 }}>{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      {/* User section */}
      <div style={styles.userSection}>
        <div style={styles.userInfo}>
          <div style={styles.avatar}>
            {displayName.charAt(0).toUpperCase()}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={styles.userName}>{displayName}</div>
            <div style={styles.userEmail}>{user?.email}</div>
          </div>
        </div>
        <button onClick={handleSignOut} style={styles.signOutBtn}>
          Sign Out
        </button>
      </div>
    </aside>
  )
}

const styles = {
  sidebar: {
    width: 240,
    height: '100vh',
    position: 'fixed',
    left: 0,
    top: 0,
    background: 'var(--card)',
    borderRight: '1px solid var(--border)',
    display: 'flex',
    flexDirection: 'column',
    padding: '20px 12px',
    zIndex: 50,
    fontFamily: 'var(--f-ui)',
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '8px 12px',
    marginBottom: 28,
    cursor: 'pointer',
  },
  logoText: {
    fontSize: 14,
    fontWeight: 700,
    letterSpacing: '0.1em',
    color: 'var(--accent)',
  },
  nav: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    flex: 1,
  },
  navItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '10px 12px',
    borderRadius: 10,
    border: 'none',
    background: 'transparent',
    color: 'var(--text-soft)',
    fontSize: 14,
    fontWeight: 500,
    cursor: 'pointer',
    fontFamily: 'var(--f-ui)',
    textAlign: 'left',
    width: '100%',
    transition: 'background 0.15s, color 0.15s',
  },
  navItemActive: {
    background: 'rgba(91,140,90,0.08)',
    color: 'var(--accent)',
    fontWeight: 600,
  },
  userSection: {
    borderTop: '1px solid var(--border-light)',
    paddingTop: 16,
  },
  userInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '4px 8px',
    marginBottom: 8,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: '50%',
    background: 'linear-gradient(135deg, var(--accent), var(--accent-soft))',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 13,
    fontWeight: 700,
    flexShrink: 0,
  },
  userName: {
    fontSize: 13,
    fontWeight: 600,
    color: 'var(--text)',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  userEmail: {
    fontSize: 11,
    color: 'var(--text-muted)',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  signOutBtn: {
    width: '100%',
    padding: '8px 12px',
    borderRadius: 8,
    border: '1px solid var(--border)',
    background: 'transparent',
    color: 'var(--text-muted)',
    fontSize: 12,
    fontWeight: 500,
    cursor: 'pointer',
    fontFamily: 'var(--f-ui)',
    transition: 'color 0.15s, border-color 0.15s',
  },
}
