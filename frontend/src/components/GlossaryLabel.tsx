import { useState } from 'react'
import { glossaryLookup } from '../data/glossary'

export default function GlossaryLabel({ label, style }: { label: string; style?: React.CSSProperties }) {
  const [show, setShow] = useState(false)
  const definition = glossaryLookup(label)

  if (!definition) {
    return <p style={style}>{label}</p>
  }

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <p
        style={{ ...style, cursor: 'help', borderBottom: '1px dotted #8a8a8a', display: 'inline' }}
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
      >
        {label}
      </p>
      {show && (
        <div style={{
          position: 'absolute', bottom: '100%', left: 0, marginBottom: '6px',
          background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '2px',
          padding: '10px 12px', fontSize: '12px', color: '#e8e6e1', lineHeight: 1.5,
          width: '240px', zIndex: 10, textTransform: 'none', fontWeight: 400,
          boxShadow: '0 4px 12px rgba(0,0,0,0.4)'
        }}>
          {definition}
        </div>
      )}
    </div>
  )
}
