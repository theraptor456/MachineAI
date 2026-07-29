import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import axios from 'axios'
import PageTransition from '../components/PageTransition'

interface Analysis {
  id: number
  estimated_runtime: number
  estimated_tool_wear: number
  surface_finish_quality: string
  manufacturing_risk: string
  estimated_cost: number
  created_at: string
}

interface Project {
  id: number
  name: string
  description: string
}

const riskColor = (risk: string) => {
  switch (risk?.toLowerCase()) {
    case 'low': return '#4a9d6f'
    case 'moderate': return '#d4a017'
    case 'high': return '#e07b1a'
    case 'critical': return '#c73e3e'
    default: return '#e8e6e1'
  }
}

export default function ProjectDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [project, setProject] = useState<Project | null>(null)
  const [analyses, setAnalyses] = useState<Analysis[]>([])
  const [gcode, setGcode] = useState('')
  const [analyzing, setAnalyzing] = useState(false)
  const token = localStorage.getItem('token')
  const headers = { Authorization: `Bearer ${token}` }

  useEffect(() => {
    fetchProject()
    fetchAnalyses()
  }, [id])

  const fetchProject = async () => {
    try {
      const res = await axios.get(`http://localhost:8000/projects/${id}`, { headers })
      setProject(res.data)
    } catch {
      navigate('/dashboard')
    }
  }

  const fetchAnalyses = async () => {
    try {
      const res = await axios.get(`http://localhost:8000/projects/${id}/analyses`, { headers })
      setAnalyses(res.data)
    } catch {
      setAnalyses([])
    }
  }

  const analyzeGcode = async () => {
    setAnalyzing(true)
    try {
      await axios.post('http://localhost:8000/gcode/analyze', { gcode_text: gcode, project_id: Number(id) }, { headers })
      setGcode('')
      fetchAnalyses()
    } catch {
      alert('Analysis failed')
    } finally {
      setAnalyzing(false)
    }
  }

  const cardStyle: React.CSSProperties = {
    background: '#1a1a1a',
    border: '1px solid #2a2a2a',
    borderRadius: '2px',
    padding: '32px',
  }

  const sectionLabelStyle: React.CSSProperties = {
    fontSize: '11px',
    fontWeight: 600,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color: '#8a8a8a',
    marginBottom: '8px',
  }

  if (!project) return <div style={{ padding: '80px', textAlign: 'center', color: '#8a8a8a' }}>Loading...</div>

  return (
<PageTransition>
          <div style={{ maxWidth: '960px', margin: '0 auto', padding: '64px 24px' }}>
      <Link to="/dashboard" style={{ color: '#8a8a8a', fontSize: '13px', textDecoration: 'none' }}>&larr; Back to Dashboard</Link>
      <h1 style={{ fontSize: '30px', marginTop: '16px', marginBottom: 0, letterSpacing: '-0.02em' }}>{project.name}</h1>
      {project.description && <p style={{ color: '#8a8a8a', marginTop: '8px', fontSize: '14px' }}>{project.description}</p>}

      <div style={{ ...cardStyle, marginTop: '40px' }}>
        <div style={sectionLabelStyle}>Analysis</div>
        <h2 style={{ marginTop: 0, marginBottom: '20px', fontSize: '20px' }}>Run G-Code Analysis</h2>
        <textarea
          placeholder="Paste your G-Code here..."
          value={gcode}
          onChange={e => setGcode(e.target.value)}
          style={{ width: '100%', height: '160px', background: '#121212', border: '1px solid #2a2a2a', borderRadius: '2px', color: '#e8e6e1', padding: '14px', fontSize: '13px', fontFamily: 'JetBrains Mono, monospace', resize: 'vertical', lineHeight: 1.6 }}
        />
        <button onClick={analyzeGcode} disabled={analyzing} style={{ marginTop: '16px' }}>
          {analyzing ? 'Analyzing...' : 'Analyze and Save to Project'}
        </button>
      </div>

      <div style={{ ...cardStyle, marginTop: '24px' }}>
        <div style={sectionLabelStyle}>History</div>
        <h2 style={{ marginTop: 0, marginBottom: '20px', fontSize: '20px' }}>Analysis History</h2>
        {analyses.length === 0 && <p style={{ color: '#8a8a8a', fontSize: '14px', padding: '16px 0' }}>No analyses yet for this project.</p>}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {analyses.map(a => (
            <div key={a.id} style={{ background: '#121212', border: '1px solid #2a2a2a', padding: '18px', borderRadius: '2px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                <div>
                  <p style={{ color: '#8a8a8a', fontSize: '11px', fontWeight: 600, letterSpacing: '0.06em', margin: 0 }}>RUNTIME (MIN)</p>
                  <p style={{ fontWeight: 600, fontSize: '16px', marginTop: '4px', marginBottom: 0, fontFamily: 'JetBrains Mono, monospace' }}>{a.estimated_runtime}</p>
                </div>
                <div>
                  <p style={{ color: '#8a8a8a', fontSize: '11px', fontWeight: 600, letterSpacing: '0.06em', margin: 0 }}>ESTIMATED COST</p>
                  <p style={{ fontWeight: 600, fontSize: '16px', marginTop: '4px', marginBottom: 0, fontFamily: 'JetBrains Mono, monospace' }}>${a.estimated_cost}</p>
                </div>
                <div>
                  <p style={{ color: '#8a8a8a', fontSize: '11px', fontWeight: 600, letterSpacing: '0.06em', margin: 0 }}>RISK</p>
                  <p style={{ fontWeight: 600, fontSize: '16px', marginTop: '4px', marginBottom: 0, color: riskColor(a.manufacturing_risk) }}>{a.manufacturing_risk}</p>
                </div>
              </div>
              <p style={{ color: '#555', fontSize: '11px', marginTop: '12px', marginBottom: 0 }}>{new Date(a.created_at).toLocaleString()}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
    </PageTransition>
  )
}
