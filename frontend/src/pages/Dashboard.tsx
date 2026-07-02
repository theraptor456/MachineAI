import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

interface Project {
  id: number
  name: string
  description: string
}

export default function Dashboard() {
  const [projects, setProjects] = useState<Project[]>([])
  const [newProject, setNewProject] = useState('')
  const [gcode, setGcode] = useState('')
  const [analysis, setAnalysis] = useState<any>(null)
  const navigate = useNavigate()
  const token = localStorage.getItem('token')

  const headers = { Authorization: `Bearer ${token}` }

  useEffect(() => {
    fetchProjects()
  }, [])

  const fetchProjects = async () => {
    try {
      const res = await axios.get('http://localhost:8000/projects/', { headers })
      setProjects(res.data)
    } catch {
      navigate('/login')
    }
  }

  const createProject = async () => {
    if (!newProject.trim()) return
    await axios.post('http://localhost:8000/projects/', { name: newProject }, { headers })
    setNewProject('')
    fetchProjects()
  }

  const analyzeGcode = async () => {
    try {
      const res = await axios.post('http://localhost:8000/gcode/analyze', { gcode_text: gcode }, { headers })
      setAnalysis(res.data)
    } catch {
      alert('Analysis failed')
    }
  }

  const logout = () => {
    localStorage.removeItem('token')
    navigate('/login')
  }

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '40px 20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
        <div>
          <h1 style={{ fontSize: '28px' }}>MachineAI</h1>
          <p style={{ color: '#888' }}>CNC Manufacturing Analysis Platform</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={() => navigate('/assistant')} style={{ width: 'auto', padding: '8px 20px', background: '#3a3f6b' }}>AI Assistant</button>
          <button onClick={logout} style={{ width: 'auto', padding: '8px 20px', background: '#2e3250' }}>Logout</button>
        </div>
      </div>

      <div style={{ background: '#1e2130', borderRadius: '12px', padding: '24px', marginBottom: '24px' }}>
        <h2 style={{ marginBottom: '16px' }}>Projects</h2>
        <div style={{ display: 'flex', gap: '10px' }}>
          <input placeholder="New project name" value={newProject} onChange={e => setNewProject(e.target.value)} style={{ margin: 0 }} />
          <button onClick={createProject} style={{ width: 'auto', padding: '10px 20px', margin: 0 }}>Create</button>
        </div>
        <div style={{ marginTop: '16px' }}>
          {projects.length === 0 && <p style={{ color: '#888' }}>No projects yet. Create one above.</p>}
         {projects.map(p => (
            <div
              key={p.id}
              onClick={() => navigate(`/projects/${p.id}`)}
              style={{ background: '#0f1117', padding: '12px 16px', borderRadius: '8px', marginTop: '8px', cursor: 'pointer' }}
            >
              <p style={{ fontWeight: 'bold' }}>{p.name}</p>
              {p.description && <p style={{ color: '#888', fontSize: '13px' }}>{p.description}</p>}
            </div>
          ))}
        </div>
      </div>

      <div style={{ background: '#1e2130', borderRadius: '12px', padding: '24px' }}>
        <h2 style={{ marginBottom: '16px' }}>G-Code Analyzer</h2>
        <textarea
          placeholder="Paste your G-Code here..."
          value={gcode}
          onChange={e => setGcode(e.target.value)}
          style={{ width: '100%', height: '160px', background: '#0f1117', border: '1px solid #2e3250', borderRadius: '6px', color: '#e0e0e0', padding: '12px', fontSize: '13px', fontFamily: 'monospace', resize: 'vertical' }}
        />
        <button onClick={analyzeGcode} style={{ marginTop: '12px' }}>Analyze G-Code</button>
        {analysis && (
          <div style={{ marginTop: '20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            {Object.entries(analysis).map(([key, value]) => (
              <div key={key} style={{ background: '#0f1117', padding: '12px 16px', borderRadius: '8px' }}>
                <p style={{ color: '#888', fontSize: '12px', textTransform: 'uppercase' }}>{key.replace(/_/g, ' ')}</p>
                {value !== null && typeof value === 'object' ? (
                  <div style={{ marginTop: '4px' }}>
                    {Object.entries(value as Record<string, unknown>).map(([k, v]) => (
                      <p key={k} style={{ fontSize: '14px', marginTop: '2px' }}>
                        <span style={{ color: '#888' }}>{k.replace(/_/g, ' ')}: </span>
                        <span style={{ fontWeight: 'bold' }}>{String(v)}</span>
                      </p>
                    ))}
                  </div>
                ) : (
                  <p style={{ fontSize: '18px', fontWeight: 'bold', marginTop: '4px' }}>{String(value)}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}