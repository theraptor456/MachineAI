import { useRef, useEffect } from 'react'

interface Move {
  line_number: number
  command: string
  type: 'rapid' | 'cutting' | 'other'
  start: { x: number; y: number; z: number }
  end: { x: number; y: number; z: number }
  feed_rate: number | null
  spindle_on: boolean
}

interface Warning {
  line_number: number
  severity: 'warning' | 'error'
  message: string
}

export default function ToolpathViewer({ moves, warnings }: { moves: Move[]; warnings: Warning[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || moves.length === 0) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const width = canvas.width
    const height = canvas.height
    ctx.clearRect(0, 0, width, height)
    ctx.fillStyle = '#121212'
    ctx.fillRect(0, 0, width, height)

    const allX = moves.flatMap(m => [m.start.x, m.end.x])
    const allY = moves.flatMap(m => [m.start.y, m.end.y])
    const minX = Math.min(...allX)
    const maxX = Math.max(...allX)
    const minY = Math.min(...allY)
    const maxY = Math.max(...allY)

    const padding = 40
    const rangeX = Math.max(maxX - minX, 1)
    const rangeY = Math.max(maxY - minY, 1)
    const scale = Math.min((width - padding * 2) / rangeX, (height - padding * 2) / rangeY)

    const toScreenX = (x: number) => padding + (x - minX) * scale
    const toScreenY = (y: number) => height - padding - (y - minY) * scale

    const errorLines = new Set(warnings.filter(w => w.severity === 'error').map(w => w.line_number))
    const warningLines = new Set(warnings.filter(w => w.severity === 'warning').map(w => w.line_number))

    moves.forEach(move => {
      ctx.beginPath()
      ctx.moveTo(toScreenX(move.start.x), toScreenY(move.start.y))
      ctx.lineTo(toScreenX(move.end.x), toScreenY(move.end.y))

      if (errorLines.has(move.line_number)) {
        ctx.strokeStyle = '#c73e3e'
        ctx.lineWidth = 3
      } else if (warningLines.has(move.line_number)) {
        ctx.strokeStyle = '#d4a017'
        ctx.lineWidth = 3
      } else if (move.type === 'rapid') {
        ctx.strokeStyle = '#8a8a8a'
        ctx.lineWidth = 1
        ctx.setLineDash([4, 4])
      } else {
        ctx.strokeStyle = '#ff6b1a'
        ctx.lineWidth = 2
        ctx.setLineDash([])
      }
      ctx.stroke()
      ctx.setLineDash([])
    })

    // Start point marker
    if (moves.length > 0) {
      ctx.beginPath()
      ctx.arc(toScreenX(moves[0].start.x), toScreenY(moves[0].start.y), 4, 0, Math.PI * 2)
      ctx.fillStyle = '#4a9d6f'
      ctx.fill()
    }
  }, [moves, warnings])

  return (
    <div>
      <canvas ref={canvasRef} width={700} height={400} style={{ width: '100%', border: '1px solid #2a2a2a', borderRadius: '2px', display: 'block' }} />
      <div style={{ display: 'flex', gap: '20px', marginTop: '12px', fontSize: '12px', color: '#8a8a8a' }}>
        <span><span style={{ color: '#ff6b1a' }}>■</span> Cutting move</span>
        <span><span style={{ color: '#8a8a8a' }}>┄</span> Rapid move</span>
        <span><span style={{ color: '#d4a017' }}>■</span> Warning</span>
        <span><span style={{ color: '#c73e3e' }}>■</span> Error</span>
        <span><span style={{ color: '#4a9d6f' }}>●</span> Start point</span>
      </div>
    </div>
  )
}
