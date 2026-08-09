import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import axios from 'axios'
import PageTransition from '../components/PageTransition'
import ToolpathViewer from '../components/ToolpathViewer'
import GlossaryLabel from '../components/GlossaryLabel'

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
  const [analysis, setAnalysis] = useState<any>(null)
  const [generating, setGenerating] = useState(false)
  const [stlInfo, setStlInfo] = useState<any>(null)
  const [simulation, setSimulation] = useState<any>(null)
  const [simulating, setSimulating] = useState(false)
  const [explanation, setExplanation] = useState('')
  const [explaining, setExplaining] = useState(false)
  const [explainHistory, setExplainHistory] = useState<{role: string, content: string}[]>([])
  const [followUp, setFollowUp] = useState('')
  const [followUpLoading, setFollowUpLoading] = useState(false)
  const stlFileRef = React.useRef<HTMLInputElement>(null)
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
      const res = await axios.post('http://localhost:8000/gcode/analyze', { gcode_text: gcode, project_id: Number(id) }, { headers })
      setAnalysis(res.data)
      setSimulation(null)
      setExplanation('')
      setExplainHistory([])
      fetchAnalyses()
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

  const explainAnalysis = async () => {
    if (!analysis) return
    setExplaining(true)
    setExplanation('')
    setExplainHistory([])
    try {
      const res = await axios.post('http://localhost:8000/gcode/explain', { analysis }, { headers })
      setExplanation(res.data.response)
      setExplainHistory([
        { role: 'user', content: `Here are my G-Code analysis results: ${JSON.stringify(analysis)}. Explain what these mean.` },
        { role: 'assistant', content: res.data.response }
      ])
    } catch {
      setExplanation('Could not generate an explanation right now. Please try again.')
    } finally {
      setExplaining(false)
    }
  }

  const askFollowUp = async () => {
    if (!followUp.trim() || followUpLoading) return
    const question = followUp
    setFollowUp('')
    setExplainHistory(prev => [...prev, { role: 'user', content: question }])
    setFollowUpLoading(true)
    try {
      const res = await axios.post(
        'http://localhost:8000/ai-assistant/chat',
        { message: question, conversation_history: explainHistory },
        { headers }
      )
      setExplainHistory(prev => [...prev, { role: 'assistant', content: res.data.response }])
    } catch {
      setExplainHistory(prev => [...prev, { role: 'assistant', content: 'Something went wrong. Please try again.' }])
    } finally {
      setFollowUpLoading(false)
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
        <div style={sectionLabelStyle}>CAM</div>
        <h2 style={{ marginTop: 0, marginBottom: '8px', fontSize: '20px' }}>Generate G-Code from STL</h2>
        <p style={{ color: '#8a8a8a', fontSize: '13px', marginTop: 0, marginBottom: '16px' }}>
          Uploads a 3D model and generates a roughing toolpath directly into the G-Code field below.
        </p>
        <input
          ref={stlFileRef}
          type="file"
          accept=".stl"
          style={{ display: 'none' }}
          onChange={e => e.target.files && generateFromStl(e.target.files[0])}
        />
        <button onClick={() => stlFileRef.current?.click()} disabled={generating} style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', color: '#e8e6e1' }}>
          {generating ? 'Generating...' : 'Upload STL File'}
        </button>
        {stlInfo && (
          <p style={{ color: '#4a9d6f', fontSize: '13px', marginTop: '12px' }}>
            G-Code generated from part ({(stlInfo.max_x - stlInfo.min_x).toFixed(1)} x {(stlInfo.max_y - stlInfo.min_y).toFixed(1)} x {(stlInfo.max_z - stlInfo.min_z).toFixed(1)} mm).
          </p>
        )}
      </div>

      <div style={{ ...cardStyle, marginTop: '24px' }}>
        <div style={sectionLabelStyle}>Analysis</div>
        <h2 style={{ marginTop: 0, marginBottom: '20px', fontSize: '20px' }}>Run G-Code Analysis</h2>
        <textarea
          placeholder="Paste your G-Code here..."
          value={gcode}
          onChange={e => setGcode(e.target.value)}
          style={{ width: '100%', height: '160px', background: '#121212', border: '1px solid #2a2a2a', borderRadius: '2px', color: '#e8e6e1', padding: '14px', fontSize: '13px', fontFamily: 'JetBrains Mono, monospace', resize: 'vertical', lineHeight: 1.6 }}
        />
        <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
          <button onClick={analyzeGcode} disabled={analyzing}>
            {analyzing ? 'Analyzing...' : 'Analyze and Save to Project'}
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

        {analysis && (
          <div style={{ marginTop: '20px' }}>
            <button
              onClick={explainAnalysis}
              disabled={explaining}
              style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', color: '#e8e6e1' }}
            >
              {explaining ? 'Explaining...' : 'Explain This Analysis'}
            </button>
            {explanation && (
              <div style={{ marginTop: '16px' }}>
                <div style={{ background: '#121212', border: '1px solid #2a2a2a', borderRadius: '2px', padding: '18px 20px', fontSize: '14px', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
                  {explanation}
                </div>
                {explainHistory.slice(2).map((m, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start', marginTop: '10px' }}>
                    <div style={{
                      maxWidth: '80%',
                      background: m.role === 'user' ? '#ff6b1a' : '#121212',
                      color: m.role === 'user' ? '#121212' : '#e8e6e1',
                      border: m.role === 'assistant' ? '1px solid #2a2a2a' : 'none',
                      borderRadius: '2px', padding: '10px 14px', fontSize: '13px', lineHeight: 1.6, whiteSpace: 'pre-wrap'
                    }}>
                      {m.content}
                    </div>
                  </div>
                ))}
                {followUpLoading && (
                  <div style={{ marginTop: '10px', color: '#8a8a8a', fontSize: '13px' }}>Thinking...</div>
                )}
                <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                  <input
                    placeholder="Ask a follow-up question..."
                    value={followUp}
                    onChange={e => setFollowUp(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && askFollowUp()}
                  />
                  <button onClick={askFollowUp} disabled={followUpLoading} style={{ width: 'auto' }}>Ask</button>
                </div>
              </div>
            )}
          </div>
        )}
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
