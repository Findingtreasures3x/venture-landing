import { useState } from 'react'
import { useAuth } from '../lib/AuthContext'
import { supabase } from '../lib/supabase'

export default function SettingsPage() {
  const { user, profile, session } = useAuth()
  const [displayName, setDisplayName] = useState(profile?.display_name || '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  if (!session) {
    return (
      <div style={styles.container}>
        <div style={styles.emptyState}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>⚙️</div>
          <h2 style={styles.emptyTitle}>Sign in to access settings</h2>
          <p style={styles.emptyDesc}>Create an account to manage your profile and preferences.</p>
        </div>
      </div>
    )
  }

  const handleSave = async () => {
    setSaving(true)
    setSaved(false)
    try {
      await supabase
        .from('profiles')
        .update({ display_name: displayName, updated_at: new Date().toISOString() })
        .eq('id', user.id)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (err) {
      console.error(err)
    }
    setSaving(false)
  }

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Settings</h1>

      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Profile</h2>
        <div style={styles.card}>
          <div style={styles.field}>
            <label style={styles.label}>Display Name</label>
            <input
              type="text"
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              style={styles.input}
              placeholder="Your name"
            />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Email</label>
            <input
              type="email"
              value={user?.email || ''}
              disabled
              style={{ ...styles.input, opacity: 0.6, cursor: 'not-allowed' }}
            />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Subscription</label>
            <div style={styles.badge}>
              {profile?.subscription_tier === 'free' ? 'Free Plan' : profile?.subscription_tier || 'Free Plan'}
            </div>
          </div>
          <button onClick={handleSave} disabled={saving} style={styles.saveBtn}>
            {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Changes'}
          </button>
        </div>
      </div>

      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Account</h2>
        <div style={styles.card}>
          <p style={styles.desc}>Member since {new Date(user?.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
        </div>
      </div>
    </div>
  )
}

const styles = {
  container: {
    padding: '32px 40px',
    maxWidth: 640,
  },
  title: {
    fontSize: 28,
    fontWeight: 700,
    fontFamily: 'var(--f-display)',
    color: 'var(--text)',
    marginBottom: 32,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 600,
    color: 'var(--text)',
    marginBottom: 12,
    fontFamily: 'var(--f-ui)',
  },
  card: {
    background: 'var(--card)',
    border: '1px solid var(--border)',
    borderRadius: 16,
    padding: '24px',
  },
  field: {
    marginBottom: 20,
  },
  label: {
    display: 'block',
    fontSize: 12,
    fontWeight: 600,
    color: 'var(--text-muted)',
    marginBottom: 6,
    letterSpacing: '0.04em',
    fontFamily: 'var(--f-ui)',
  },
  input: {
    width: '100%',
    padding: '10px 14px',
    borderRadius: 10,
    border: '1px solid var(--border)',
    background: 'var(--bg)',
    fontSize: 14,
    color: 'var(--text)',
    outline: 'none',
    fontFamily: 'var(--f-ui)',
  },
  badge: {
    display: 'inline-block',
    padding: '4px 12px',
    borderRadius: 8,
    background: 'rgba(91,140,90,0.08)',
    color: 'var(--accent)',
    fontSize: 13,
    fontWeight: 600,
    fontFamily: 'var(--f-ui)',
  },
  saveBtn: {
    padding: '10px 24px',
    borderRadius: 10,
    border: 'none',
    background: 'linear-gradient(135deg, #5B8C5A, #3A7A39)',
    color: '#fff',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: 'var(--f-ui)',
  },
  desc: {
    fontSize: 14,
    color: 'var(--text-soft)',
    fontFamily: 'var(--f-ui)',
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '60vh',
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
  },
}
