import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import PageTransition from '../components/PageTransition'
import ToolpathViewer from '../components/ToolpathViewer'
import GlossaryLabel from '../components/GlossaryLabel'

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
  const [analyzing, setAnalyzing] = useState(false)
  const [simulation, setSimulation] = useState<any>(null)
  const [simulating, setSimulating] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [stlInfo, setStlInfo] = useState<any>(null)
  const stlFileRef = React.useRef<HTMLInputElement>(null)
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
    setAnalyzing(true)
    try {
      const res = await axios.post('http://localhost:8000/gcode/analyze', { gcode_text: gcode }, { headers })
      setAnalysis(res.data)
    } catch {
      alert('Analysis failed')
    } finally {
      setAnalyzing(false)
    }
  }

  const simulateGcode = async () => {
    setSimulating(true)
    try {
      const res = await axios.post('http://localhost:8000/gcode/simulate', { gcode_text: gcode }, { headers })
      setSimulation(res.data)
    } catch {
      alert('Simulation failed')
    } finally {
      setSimulating(false)
    }
  }

  const generateFromStl = async (file: File) => {
    setGenerating(true)
    setStlInfo(null)
    const formData = new FormData()
    formData.append('file', file)
    formData.append('stock_margin', '5')
    formData.append('depth_per_pass', '2')
    formData.append('tool_diameter', '6')
    try {
      const res = await axios.post('http://localhost:8000/cam/generate-from-stl', formData, {
        headers: { ...headers, 'Content-Type': 'multipart/form-data' }
      })
      setGcode(res.data.gcode)
      setStlInfo(res.data.bounding_box)
      setAnalysis(null)
      setSimulation(null)
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Could not generate G-Code from this STL file.')
    } finally {
      setGenerating(false)
    }
  }

  const logout = () => {
    localStorage.removeItem('token')
    navigate('/login')
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

  return (
<PageTransition>
          <div style={{ maxWidth: '960px', margin: '0 auto', padding: '64px 24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '56px' }}>
        <div>
          <h1 style={{ fontSize: '30px', margin: 0, letterSpacing: '-0.02em' }}>MachineAI</h1>
          <p style={{ color: '#8a8a8a', marginTop: '6px', fontSize: '14px' }}>CNC Manufacturing Analysis Platform</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => navigate('/assistant')}
            style={{
              width: 'auto', padding: '10px 20px', background: '#1a1a1a', border: '1px solid #2a2a2a',
              color: '#e8e6e1', transition: 'border-color 0.15s ease, background 0.15s ease'
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#ff6b1a' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#2a2a2a' }}
          >
            AI Assistant
          </button>
          <button
            onClick={logout}
            style={{ width: 'auto', padding: '10px 20px', background: 'transparent', border: '1px solid #2a2a2a', color: '#8a8a8a' }}
          >
            Logout
          </button>
        </div>
      </div>

      <div style={{ ...cardStyle, marginBottom: '24px' }}>
        <div style={sectionLabelStyle}>Projects</div>
        <h2 style={{ marginTop: 0, marginBottom: '20px', fontSize: '20px' }}>Your Projects</h2>
        <div style={{ display: 'flex', gap: '10px' }}>
          <input placeholder="New project name" value={newProject} onChange={e => setNewProject(e.target.value)} style={{ margin: 0 }} />
          <button onClick={createProject} style={{ width: 'auto', padding: '10px 20px', margin: 0, background: '#1a1a1a', border: '1px solid #2a2a2a', color: '#e8e6e1' }}>
            Create
          </button>
        </div>
        <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {projects.length === 0 && (
            <p style={{ color: '#8a8a8a', fontSize: '14px', padding: '16px 0' }}>No projects yet — create one above to get started.</p>
          )}
          {projects.map(p => (
            <div
              key={p.id}
              onClick={() => navigate(`/projects/${p.id}`)}
              style={{
                background: '#121212', border: '1px solid #2a2a2a', padding: '16px 18px', borderRadius: '2px',
                cursor: 'pointer', transition: 'border-color 0.15s ease'
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#ff6b1a' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#2a2a2a' }}
            >
              <p style={{ fontWeight: 600, margin: 0, fontSize: '15px' }}>{p.name}</p>
              {p.description && <p style={{ color: '#8a8a8a', fontSize: '13px', margin: '4px 0 0' }}>{p.description}</p>}
            </div>
          ))}
        </div>
      </div>

      <div style={{ ...cardStyle, marginBottom: '24px' }}>
        <div style={sectionLabelStyle}>CAM</div>
        <h2 style={{ marginTop: 0, marginBottom: '8px', fontSize: '20px' }}>Generate G-Code from STL</h2>
        <p style={{ color: '#8a8a8a', fontSize: '13px', marginTop: 0, marginBottom: '16px' }}>
          Uploads a 3D model and generates a 2.5D roughing toolpath that clears stock material around the part's outer footprint.
        </p>
        <input
          ref={stlFileRef}
          type="file"
          accept=".stl"
          style={{ display: 'none' }}
          onChange={e => e.target.files && generateFromStl(e.target.files[0])}
        />
        <button onClick={() => stlFileRef.current?.click()} disabled={generating}>
          {generating ? 'Generating...' : 'Upload STL File'}
        </button>
        {stlInfo && (
          <p style={{ color: '#4a9d6f', fontSize: '13px', marginTop: '12px' }}>
            G-Code generated from part ({(stlInfo.max_x - stlInfo.min_x).toFixed(1)} x {(stlInfo.max_y - stlInfo.min_y).toFixed(1)} x {(stlInfo.max_z - stlInfo.min_z).toFixed(1)} mm) — loaded into the analyzer below.
          </p>
        )}
      </div>

      <div style={cardStyle}>
        <div style={sectionLabelStyle}>Analysis</div>
        <h2 style={{ marginTop: 0, marginBottom: '20px', fontSize: '20px' }}>G-Code Analyzer</h2>
        <textarea
          placeholder="Paste your G-Code here..."
          value={gcode}
          onChange={e => setGcode(e.target.value)}
          style={{ width: '100%', height: '180px', background: '#121212', border: '1px solid #2a2a2a', borderRadius: '2px', color: '#e8e6e1', padding: '14px', fontSize: '13px', fontFamily: 'JetBrains Mono, monospace', resize: 'vertical', lineHeight: 1.6 }}
        />
        <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
          <button onClick={analyzeGcode} disabled={analyzing}>
            {analyzing ? 'Analyzing...' : 'Analyze G-Code'}
          </button>
          <button
            onClick={simulateGcode}
            disabled={simulating}
            style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', color: '#e8e6e1' }}
          >
            {simulating ? 'Simulating...' : 'Simulate Toolpath'}
          </button>
        </div>

        {simulation && (
          <div style={{ marginTop: '28px' }}>
            <ToolpathViewer moves={simulation.moves} warnings={simulation.warnings} />
            {simulation.warnings.length > 0 ? (
              <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {simulation.warnings.map((w: any, i: number) => (
                  <div
                    key={i}
                    style={{
                      background: '#121212',
                      border: `1px solid ${w.severity === 'error' ? '#c73e3e' : '#d4a017'}`,
                      borderRadius: '2px',
                      padding: '10px 14px',
                      fontSize: '13px'
                    }}
                  >
                    <span style={{ color: w.severity === 'error' ? '#c73e3e' : '#d4a017', fontWeight: 600, textTransform: 'uppercase', fontSize: '11px' }}>
                      {w.severity}
                    </span>
                    {' — Line '}{w.line_number}: {w.message}
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: '#4a9d6f', fontSize: '13px', marginTop: '12px' }}>No issues found in this toolpath.</p>
            )}
          </div>
        )}
        {analysis && (
          <div style={{ marginTop: '28px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            {Object.entries(analysis).map(([key, value]) => (
              <div key={key} style={{ background: '#121212', border: '1px solid #2a2a2a', padding: '16px 18px', borderRadius: '2px' }}>
                <GlossaryLabel
                  label={key.replace(/_/g, ' ')}
                  style={{ color: '#8a8a8a', fontSize: '11px', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', margin: 0 }}
                />
                {value !== null && typeof value === 'object' ? (
                  <div style={{ marginTop: '8px' }}>
                    {Object.entries(value as Record<string, unknown>).map(([k, v]) => (
                      <p key={k} style={{ fontSize: '14px', marginTop: '4px', margin: 0 }}>
                        <span style={{ color: '#8a8a8a' }}>{k.replace(/_/g, ' ')}: </span>
                        <span style={{ fontWeight: 600, fontFamily: 'JetBrains Mono, monospace' }}>{String(v)}</span>
                      </p>
                    ))}
                  </div>
                ) : (
                  <p style={{ fontSize: '19px', fontWeight: 600, marginTop: '6px', marginBottom: 0, fontFamily: 'JetBrains Mono, monospace' }}>
                    {String(value)}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
    </PageTransition>
  )
}
