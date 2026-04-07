import { useState } from 'react'
import { useAuth } from '../lib/AuthContext'

export default function AuthModal({ onClose, onSuccess }) {
  const { signIn, signUp, signInWithGoogle, resetPassword } = useAuth()
  const [mode, setMode] = useState('login') // login | signup | forgot
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setMessage('')
    try {
      if (mode === 'signup') {
        const data = await signUp(email, password, name)
        if (data.user && !data.session) {
          setMessage('Check your email for a confirmation link!')
        } else if (data.session) {
          onSuccess?.()
        }
      } else if (mode === 'login') {
        await signIn(email, password)
        onSuccess?.()
      } else if (mode === 'forgot') {
        await resetPassword(email)
        setMessage('Password reset link sent to your email!')
      }
    } catch (err) {
      setError(err.message || 'Something went wrong')
    }
    setLoading(false)
  }

  const handleGoogle = async () => {
    try {
      await signInWithGoogle()
    } catch (err) {
      setError(err.message)
    }
  }

  const switchMode = (newMode) => {
    setMode(newMode)
    setError('')
    setMessage('')
  }

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.card} onClick={e => e.stopPropagation()}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ fontSize: 28, marginBottom: 8 }}>🌍</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text)', fontFamily: 'var(--f-ui)' }}>
            {mode === 'signup' ? 'Create Your Account' : mode === 'forgot' ? 'Reset Password' : 'Welcome Back'}
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
            {mode === 'signup' ? 'Start building your travel passport' : mode === 'forgot' ? "We'll send you a reset link" : 'Sign in to your travel passport'}
          </div>
        </div>

        {error && (
          <div style={styles.errorBox}>{error}</div>
        )}
        {message && (
          <div style={styles.successBox}>{message}</div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {mode === 'signup' && (
            <input type="text" placeholder="Your name" value={name} onChange={e => setName(e.target.value)} style={styles.input} />
          )}
          <input type="email" placeholder="Email address" value={email} onChange={e => setEmail(e.target.value)} required style={styles.input} />
          {mode !== 'forgot' && (
            <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} style={styles.input} />
          )}
          <button type="submit" disabled={loading} style={{ ...styles.btn, opacity: loading ? 0.7 : 1 }}>
            {loading ? '...' : mode === 'signup' ? 'Create Account' : mode === 'forgot' ? 'Send Reset Link' : 'Sign In'}
          </button>
        </form>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '16px 0' }}>
          <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>or</span>
          <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
        </div>

        <button onClick={handleGoogle} style={styles.googleBtn}>
          <svg width="18" height="18" viewBox="0 0 48 48">
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
          </svg>
          Continue with Google
        </button>

        <div style={{ textAlign: 'center', marginTop: 16, fontSize: 13, color: 'var(--text-muted)' }}>
          {mode === 'login' && (
            <>
              <button onClick={() => switchMode('forgot')} style={styles.link}>Forgot password?</button>
              <span style={{ margin: '0 8px' }}>·</span>
              <button onClick={() => switchMode('signup')} style={styles.link}>Create account</button>
            </>
          )}
          {mode === 'signup' && (
            <>Already have an account? <button onClick={() => switchMode('login')} style={styles.link}>Sign in</button></>
          )}
          {mode === 'forgot' && (
            <button onClick={() => switchMode('login')} style={styles.link}>Back to sign in</button>
          )}
        </div>
      </div>
    </div>
  )
}

const styles = {
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(58,74,92,0.3)',
    backdropFilter: 'blur(8px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 300,
  },
  card: {
    background: '#fff',
    borderRadius: 24,
    width: 400,
    maxWidth: '92vw',
    padding: '36px 32px',
    boxShadow: '0 24px 80px rgba(58,74,92,0.18)',
    animation: 'popIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
  },
  input: {
    width: '100%',
    padding: '12px 16px',
    borderRadius: 12,
    border: '1px solid var(--border)',
    background: 'var(--bg)',
    fontSize: 14,
    color: 'var(--text)',
    outline: 'none',
    boxSizing: 'border-box',
    fontFamily: 'var(--f-ui)',
  },
  btn: {
    width: '100%',
    padding: 14,
    borderRadius: 12,
    border: 'none',
    background: 'linear-gradient(135deg, #5B8C5A, #3A7A39)',
    color: '#fff',
    fontSize: 14,
    fontWeight: 700,
    cursor: 'pointer',
    fontFamily: 'var(--f-ui)',
  },
  googleBtn: {
    width: '100%',
    padding: 14,
    borderRadius: 12,
    border: '1px solid var(--border)',
    background: '#fff',
    color: 'var(--text)',
    fontSize: 14,
    fontWeight: 700,
    cursor: 'pointer',
    fontFamily: 'var(--f-ui)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  link: {
    background: 'none',
    border: 'none',
    color: 'var(--accent)',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    padding: 0,
    fontFamily: 'var(--f-ui)',
  },
  errorBox: {
    background: '#FEF2F2',
    border: '1px solid #FECACA',
    borderRadius: 10,
    padding: '10px 14px',
    fontSize: 13,
    color: '#DC2626',
    marginBottom: 16,
  },
  successBox: {
    background: '#F0FDF4',
    border: '1px solid #BBF7D0',
    borderRadius: 10,
    padding: '10px 14px',
    fontSize: 13,
    color: '#16A34A',
    marginBottom: 16,
  },
}
