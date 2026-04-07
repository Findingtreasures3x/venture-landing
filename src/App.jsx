import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './lib/AuthContext'
import Landing from './pages/Landing'
import Dashboard from './pages/Dashboard'

export default function App() {
  const { loading } = useAuth()

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        background: 'var(--bg)',
      }}>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 16,
          animation: 'fadeIn 0.5s ease',
        }}>
          <svg width={32} height={38} viewBox="0 0 100 120" fill="none" stroke="var(--accent)" strokeWidth={5} strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 10 L50 75 L85 10" />
            <ellipse cx="50" cy="95" rx="20" ry="8" />
          </svg>
          <span style={{ color: 'var(--text-muted)', fontSize: 13, fontWeight: 500 }}>Loading...</span>
        </div>
      </div>
    )
  }

  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/dashboard/*" element={<Dashboard />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
