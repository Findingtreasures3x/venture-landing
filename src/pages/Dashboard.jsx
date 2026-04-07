import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'
import Sidebar from '../components/Sidebar'
import WorldMapPage from './WorldMapPage'
import PassportsPage from './PassportsPage'
import SettingsPage from './SettingsPage'

export default function Dashboard() {
  const { session, loading } = useAuth()

  // If not logged in, allow guest mode but show limited features
  // For now we let anyone access dashboard — auth modal prompts when needed

  return (
    <div style={styles.layout}>
      {session && <Sidebar />}
      <main style={{ ...styles.main, marginLeft: session ? 240 : 0 }}>
        <Routes>
          <Route index element={<WorldMapPage />} />
          <Route path="passports" element={<PassportsPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </main>
    </div>
  )
}

const styles = {
  layout: {
    display: 'flex',
    minHeight: '100vh',
    background: 'var(--bg)',
  },
  main: {
    flex: 1,
    minHeight: '100vh',
    transition: 'margin-left 0.2s ease',
  },
}
