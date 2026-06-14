import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import axios from 'axios'

export default function Register() {
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleRegister = async () => {
    try {
      const res = await axios.post('http://localhost:8000/auth/register', { email, username, password })
      localStorage.setItem('token', res.data.access_token)
      navigate('/dashboard')
    } catch {
      setError('Registration failed. Email or username may already exist.')
    }
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
      <div style={{ background: '#1e2130', padding: '40px', borderRadius: '12px', width: '360px' }}>
        <h1 style={{ marginBottom: '8px', fontSize: '24px' }}>MachineAI</h1>
        <p style={{ color: '#888', marginBottom: '24px' }}>Create your account</p>
        <input placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
        <input placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} />
        <input placeholder="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} />
        {error && <p style={{ color: '#f87171', marginTop: '8px' }}>{error}</p>}
        <button onClick={handleRegister}>Create Account</button>
        <p style={{ textAlign: 'center', marginTop: '16px', color: '#888' }}>
          Already have an account? <Link to="/login">Sign In</Link>
        </p>
      </div>
    </div>
  )
}