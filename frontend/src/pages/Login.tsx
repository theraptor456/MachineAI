import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import axios from 'axios'
import PageTransition from '../components/PageTransition'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleLogin = async () => {
    setError('')
    setLoading(true)
    try {
      const res = await axios.post('http://localhost:8000/auth/login', { email, password })
      localStorage.setItem('token', res.data.access_token)
      navigate('/dashboard')
    } catch (err: any) {
      const message = err.response?.data?.detail || 'Login failed. Please try again.'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleLogin()
  }

  return (
<PageTransition>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', padding: '20px' }}>
      <div style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', padding: '48px 40px', borderRadius: '2px', width: '380px' }}>
        <h1 style={{ marginBottom: '6px', fontSize: '26px', letterSpacing: '-0.02em' }}>MachineAI</h1>
        <p style={{ color: '#8a8a8a', marginBottom: '32px', fontSize: '14px' }}>CNC Manufacturing Analysis Platform</p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <input placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} onKeyDown={handleKeyDown} />
          <input placeholder="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={handleKeyDown} />
        </div>

        {error && (
          <p style={{ color: '#c73e3e', marginTop: '12px', fontSize: '13px', background: 'rgba(199,62,62,0.1)', border: '1px solid rgba(199,62,62,0.3)', padding: '8px 12px', borderRadius: '2px' }}>
            {error}
          </p>
        )}

        <button onClick={handleLogin} disabled={loading} style={{ marginTop: '20px', width: '100%' }}>
          {loading ? 'Signing In...' : 'Sign In'}
        </button>

        <p style={{ textAlign: 'center', marginTop: '20px', color: '#8a8a8a', fontSize: '13px' }}>
          Don't have an account? <Link to="/register" style={{ color: '#ff6b1a' }}>Register</Link>
        </p>
      </div>
    </div>
    </PageTransition>
  )
}
