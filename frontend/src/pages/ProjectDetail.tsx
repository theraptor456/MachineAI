import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import axios from 'axios'

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

export default function ProjectDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [project, setProject] = useState<Project | null>(null)
  const [analyses, setAnalyses] = useState<Analysis[]>([])
  const [gcode, setGcode] = useState('')
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
    try {
      await axios.post('http://localhost:8000/gcode/analyze', { gcode_text: gcode, project_id: Number(id) }, { headers })
      setGcode('')
      fetchAnalyses()
    } catch {
      alert('Analysis failed')
    }
  }

  if (!project) return <div style={{ padding: '40px', textAlign: 'center' }}>Loading...</div>

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '40px 20px' }}>
      <Link to="/dashboard" style={{ color: '#888' }}>&larr; Back to Dashboard</Link>
      <h1 style={{ fontSize: '28px', marginTop: '12px' }}>{project.name}</h1>
      {project.description && <p style={{ color: '#888', marginBottom: '24px' }}>{project.description}</p>}

      <div style={{ background: '#1e2130', borderRadius: '12px', padding: '24px', marginTop: '24px' }}>
        <h2 style={{ marginBottom: '16px' }}>Run G-Code Analysis</h2>
        <textarea
          placeholder="Paste your G-Code here..."
          value={gcode}
          onChange={e => setGcode(e.target.value)}
          style={{ width: '100%', height: '140px', background: '#0f1117', border: '1px solid #2e3250', borderRadius: '6px', color: '#e0e0e0', padding: '12px', fontSize: '13px', fontFamily: 'monospace', resize: 'vertical' }}
        />
        <button onClick={analyzeGcode} style={{ marginTop: '12px' }}>Analyze and Save to Project</button>
      </div>

      <div style={{ background: '#1e2130', borderRadius: '12px', padding: '24px', marginTop: '24px' }}>
        <h2 style={{ marginBottom: '16px' }}>Analysis History</h2>
        {analyses.length === 0 && <p style={{ color: '#888' }}>No analyses yet for this project.</p>}
        {analyses.map(a => (
          <div key={a.id} style={{ background: '#0f1117', padding: '16px', borderRadius: '8px', marginBottom: '12px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
              <div>
                <p style={{ color: '#888', fontSize: '12px' }}>RUNTIME (MIN)</p>
                <p style={{ fontWeight: 'bold' }}>{a.estimated_runtime}</p>
              </div>
              <div>
                <p style={{ color: '#888', fontSize: '12px' }}>ESTIMATED COST</p>
                <p style={{ fontWeight: 'bold' }}>${a.estimated_cost}</p>
              </div>
              <div>
                <p style={{ color: '#888', fontSize: '12px' }}>RISK</p>
                <p style={{ fontWeight: 'bold' }}>{a.manufacturing_risk}</p>
              </div>
            </div>
            <p style={{ color: '#555', fontSize: '11px', marginTop: '8px' }}>{new Date(a.created_at).toLocaleString()}</p>
          </div>
        ))}
      </div>
    </div>
  )
}