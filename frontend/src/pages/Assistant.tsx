import { useState, useRef, useEffect } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'

interface Message {
  role: 'user' | 'assistant'
  content: string
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
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

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
        { message: userMessage.content, conversation_history: history },
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

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '24px', display: 'flex', flexDirection: 'column', height: '100vh', boxSizing: 'border-box' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h2 style={{ margin: 0 }}>AI CNC Assistant</h2>
        <button onClick={() => navigate('/dashboard')} style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', color: '#e8e6e1', padding: '8px 16px', borderRadius: '2px', cursor: 'pointer' }}>
          Back to Dashboard
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', background: '#1a1a1a', borderRadius: '2px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {messages.map((m, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
            <div style={{
              maxWidth: '75%',
              background: m.role === 'user' ? '#ff6b1a' : '#121212',
              border: m.role === 'assistant' ? '1px solid #2a2a2a' : 'none',
              borderRadius: '2px',
              padding: '10px 14px',
              fontSize: '14px',
              lineHeight: 1.5,
              whiteSpace: 'pre-wrap'
            }}>
              {m.content}
            </div>
          </div>
        ))}
        {loading && (
          <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
            <div style={{ background: '#121212', border: '1px solid #2a2a2a', borderRadius: '2px', padding: '10px 14px', fontSize: '14px', color: '#8a8a8a' }}>
              Thinking...
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div style={{ marginTop: '16px', display: 'flex', gap: '10px' }}>
        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask about G-Code, tools, materials, feeds and speeds..."
          style={{ flex: 1, height: '50px', resize: 'none', background: '#121212', border: '1px solid #2a2a2a', borderRadius: '2px', color: '#e8e6e1', padding: '12px', fontSize: '14px', fontFamily: 'inherit' }}
        />
        <button onClick={sendMessage} disabled={loading} style={{ padding: '0 20px', borderRadius: '2px', border: 'none', background: '#ff6b1a', color: '#fff', cursor: 'pointer' }}>
          Send
        </button>
      </div>
    </div>
  )
}
