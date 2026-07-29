import { useState, useRef, useEffect } from 'react'
import axios from 'axios'
import PageTransition from '../components/PageTransition'
import { useNavigate } from 'react-router-dom'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface MaterialOption {
  id: number
  name: string
}

interface ToolOption {
  id: number
  name: string
}

function CameraModal({ onCapture, onClose }: { onCapture: (file: File) => void; onClose: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [error, setError] = useState('')
  const streamRef = useRef<MediaStream | null>(null)

  useEffect(() => {
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: 'environment' } })
      .then(stream => {
        streamRef.current = stream
        if (videoRef.current) videoRef.current.srcObject = stream
      })
      .catch(() => {
        setError('Could not access camera. Check your browser permissions.')
      })

    return () => {
      streamRef.current?.getTracks().forEach(track => track.stop())
    }
  }, [])

  const capture = () => {
    if (!videoRef.current || !canvasRef.current) return
    const video = videoRef.current
    const canvas = canvasRef.current
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.drawImage(video, 0, 0)
    canvas.toBlob(blob => {
      if (blob) {
        const file = new File([blob], `capture-${Date.now()}.jpg`, { type: 'image/jpeg' })
        onCapture(file)
      }
    }, 'image/jpeg', 0.9)
  }

  return (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '2px', padding: '24px', maxWidth: '600px', width: '90%' }}>
        <h3 style={{ marginTop: 0, marginBottom: '16px', fontSize: '17px' }}>Take a Photo</h3>
        {error ? (
          <p style={{ color: '#c73e3e', fontSize: '14px' }}>{error}</p>
        ) : (
          <video ref={videoRef} autoPlay playsInline style={{ width: '100%', borderRadius: '2px', background: '#000' }} />
        )}
        <canvas ref={canvasRef} style={{ display: 'none' }} />
        <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
          <button onClick={capture} disabled={!!error} style={{ flex: 1, background: '#ff6b1a', color: '#121212' }}>Capture</button>
          <button onClick={onClose} style={{ flex: 1, background: 'transparent', border: '1px solid #2a2a2a', color: '#e8e6e1' }}>Cancel</button>
        </div>
      </div>
    </div>
  )
}

export default function Assistant() {
  const navigate = useNavigate()
  const token = localStorage.getItem('token')
  const headers = { Authorization: `Bearer ${token}` }

  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: "Hi! I'm the MachineAI CNC Assistant. Ask me about G-Code, tool selection, materials, or how to machine a part." }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [materials, setMaterials] = useState<MaterialOption[]>([])
  const [tools, setTools] = useState<ToolOption[]>([])
  const [selectedMaterial, setSelectedMaterial] = useState('')
  const [selectedTool, setSelectedTool] = useState('')
  const [identifying, setIdentifying] = useState<string | null>(null)
  const [cameraTarget, setCameraTarget] = useState<'material' | 'tool' | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const materialFileRef = useRef<HTMLInputElement>(null)
  const toolFileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const refreshLists = () => {
    axios.get('http://localhost:8000/materials/', { headers }).then(res => setMaterials(res.data)).catch(() => {})
    axios.get('http://localhost:8000/tools/', { headers }).then(res => setTools(res.data)).catch(() => {})
  }

  useEffect(() => {
    refreshLists()
  }, [])

  const handleImageUpload = async (file: File, itemType: 'material' | 'tool') => {
    setIdentifying(itemType)
    const formData = new FormData()
    formData.append('item_type', itemType)
    formData.append('file', file)
    try {
      const res = await axios.post('http://localhost:8000/ai-assistant/identify-image', formData, {
        headers: { ...headers, 'Content-Type': 'multipart/form-data' }
      })
      refreshLists()
      const name = res.data.identified?.name || 'Item'
      if (itemType === 'material') setSelectedMaterial(name)
      else setSelectedTool(name)
    } catch (err) {
      alert('Could not identify the item from that photo. Try a clearer image.')
    } finally {
      setIdentifying(null)
    }
  }

  const sendMessage = async () => {
    if (!input.trim() || loading) return
    const userMessage: Message = { role: 'user', content: input }
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setLoading(true)

    try {
      const history = messages.map(m => ({ role: m.role, content: m.content }))
      const res = await axios.post(
        'http://localhost:8000/ai-assistant/chat',
        {
          message: userMessage.content,
          conversation_history: history,
          material: selectedMaterial || null,
          tool_name: selectedTool || null
        },
        { headers }
      )
      setMessages(prev => [...prev, { role: 'assistant', content: res.data.response }])
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Something went wrong reaching the assistant. Please try again.' }])
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const labelStyle: React.CSSProperties = {
    fontSize: '10px',
    fontWeight: 600,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color: '#8a8a8a',
    marginBottom: '6px',
  }

  const iconButtonStyle: React.CSSProperties = {
    background: '#1a1a1a', border: '1px solid #2a2a2a', color: '#e8e6e1',
    padding: '0 10px', fontSize: '13px', whiteSpace: 'nowrap', transition: 'border-color 0.15s ease'
  }

  return (
    <PageTransition>
    <div style={{ maxWidth: '880px', margin: '0 auto', padding: '40px 24px', display: 'flex', flexDirection: 'column', height: '100vh', boxSizing: 'border-box' }}>
      {cameraTarget && (
        <CameraModal
          onCapture={file => {
            handleImageUpload(file, cameraTarget)
            setCameraTarget(null)
          }}
          onClose={() => setCameraTarget(null)}
        />
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <div style={labelStyle}>Assistant</div>
          <h2 style={{ margin: 0, fontSize: '22px', letterSpacing: '-0.02em' }}>AI CNC Assistant</h2>
        </div>
        <button
          onClick={() => navigate('/dashboard')}
          style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', color: '#e8e6e1', padding: '10px 18px', borderRadius: '2px', cursor: 'pointer' }}
        >
          Back to Dashboard
        </button>
      </div>

      <div style={{ display: 'flex', gap: '16px', marginBottom: '20px' }}>
        <div style={{ flex: 1 }}>
          <div style={labelStyle}>Material</div>
          <div style={{ display: 'flex', gap: '6px' }}>
            <select value={selectedMaterial} onChange={e => setSelectedMaterial(e.target.value)} style={{ flex: 1 }}>
              <option value="">No material selected</option>
              {materials.map(m => (
                <option key={m.id} value={m.name}>{m.name}</option>
              ))}
            </select>
            <input
              ref={materialFileRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={e => e.target.files && handleImageUpload(e.target.files[0], 'material')}
            />
            <button
              onClick={() => materialFileRef.current?.click()}
              disabled={identifying !== null}
              title="Upload a photo"
              style={iconButtonStyle}
            >
              {identifying === 'material' ? '...' : '📁'}
            </button>
            <button
              onClick={() => setCameraTarget('material')}
              disabled={identifying !== null}
              title="Take a photo"
              style={iconButtonStyle}
            >
              {identifying === 'material' ? '...' : '📷'}
            </button>
          </div>
        </div>
        <div style={{ flex: 1 }}>
          <div style={labelStyle}>Tool</div>
          <div style={{ display: 'flex', gap: '6px' }}>
            <select value={selectedTool} onChange={e => setSelectedTool(e.target.value)} style={{ flex: 1 }}>
              <option value="">No tool selected</option>
              {tools.map(t => (
                <option key={t.id} value={t.name}>{t.name}</option>
              ))}
            </select>
            <input
              ref={toolFileRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={e => e.target.files && handleImageUpload(e.target.files[0], 'tool')}
            />
            <button
              onClick={() => toolFileRef.current?.click()}
              disabled={identifying !== null}
              title="Upload a photo"
              style={iconButtonStyle}
            >
              {identifying === 'tool' ? '...' : '📁'}
            </button>
            <button
              onClick={() => setCameraTarget('tool')}
              disabled={identifying !== null}
              title="Take a photo"
              style={iconButtonStyle}
            >
              {identifying === 'tool' ? '...' : '📷'}
            </button>
          </div>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '2px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {messages.map((m, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
            <div style={{
              maxWidth: '75%',
              background: m.role === 'user' ? '#ff6b1a' : '#121212',
              color: m.role === 'user' ? '#121212' : '#e8e6e1',
              border: m.role === 'assistant' ? '1px solid #2a2a2a' : 'none',
              borderRadius: '2px',
              padding: '12px 16px',
              fontSize: '14px',
              lineHeight: 1.6,
              whiteSpace: 'pre-wrap'
            }}>
              {m.content}
            </div>
          </div>
        ))}
        {loading && (
          <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
            <div style={{ background: '#121212', border: '1px solid #2a2a2a', borderRadius: '2px', padding: '12px 16px', fontSize: '14px', color: '#8a8a8a' }}>
              Thinking...
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask about G-Code, tools, materials, feeds and speeds..."
          style={{ flex: 1, height: '54px', resize: 'none', background: '#121212', border: '1px solid #2a2a2a', borderRadius: '2px', color: '#e8e6e1', padding: '14px', fontSize: '14px', fontFamily: 'inherit' }}
        />
        <button onClick={sendMessage} disabled={loading} style={{ padding: '0 24px', borderRadius: '2px', border: 'none', background: '#ff6b1a', color: '#121212', cursor: 'pointer' }}>
          Send
        </button>
      </div>
    </div>
    </PageTransition>
  )
}
