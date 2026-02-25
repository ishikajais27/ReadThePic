'use client'
import React, { useState, useEffect, useRef } from 'react'
import {
  AlertCircle,
  CheckCircle2,
  Upload,
  X,
  Copy,
  Download,
} from 'lucide-react'

// ── Inline leaf SVG ──────────────────────────────────────────────────
function LeafIcon({
  size = 16,
  color = 'currentColor',
}: {
  size?: number
  color?: string
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z" />
      <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
    </svg>
  )
}

// ── Inline animated background ───────────────────────────────────────
function AnimatedBg() {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let W = 0,
      H = 0,
      t = 0,
      raf: number

    const COLORS = [
      [200, 185, 155],
      [160, 185, 140],
      [220, 200, 170],
      [140, 170, 120],
      [200, 175, 140],
      [175, 200, 160],
    ]

    type Blob = {
      x: number
      y: number
      vx: number
      vy: number
      r: number
      rgb: number[]
      phase: number
      phaseV: number
    }
    const blobs: Blob[] = []

    function makeBlobs() {
      blobs.length = 0
      for (let i = 0; i < 8; i++) {
        blobs.push({
          x: Math.random() * W,
          y: Math.random() * H,
          vx: (Math.random() - 0.5) * 0.4,
          vy: (Math.random() - 0.5) * 0.3,
          r: 160 + Math.random() * 200,
          rgb: COLORS[i % COLORS.length],
          phase: Math.random() * Math.PI * 2,
          phaseV: 0.005 + Math.random() * 0.008,
        })
      }
    }

    type Dot = {
      x: number
      y: number
      vy: number
      r: number
      alpha: number
      life: number
      max: number
      wobble: number
      rgb: number[]
    }
    const dots: Dot[] = []
    let dotTimer = 0

    function spawnDot() {
      const p = [
        [160, 185, 140],
        [200, 175, 140],
        [140, 170, 120],
        [190, 165, 130],
      ]
      dots.push({
        x: Math.random() * W,
        y: H + 5,
        vy: -(0.3 + Math.random() * 0.6),
        r: 1 + Math.random() * 2.5,
        alpha: 0,
        life: 0,
        max: 280 + Math.random() * 200,
        wobble: Math.random() * Math.PI * 2,
        rgb: p[Math.floor(Math.random() * p.length)],
      })
    }

    function resize() {
      W = canvas.width = window.innerWidth
      H = canvas.height = window.innerHeight
      makeBlobs()
    }

    function draw() {
      t++
      ctx.fillStyle = '#f5f0e8'
      ctx.fillRect(0, 0, W, H)

      const wash = ctx.createLinearGradient(0, 0, W, H)
      wash.addColorStop(0, 'rgba(200,185,160,0.15)')
      wash.addColorStop(0.5, 'rgba(165,190,148,0.10)')
      wash.addColorStop(1, 'rgba(200,185,155,0.12)')
      ctx.fillStyle = wash
      ctx.fillRect(0, 0, W, H)

      for (const b of blobs) {
        b.phase += b.phaseV
        b.x += b.vx
        b.y += b.vy
        if (b.x < -b.r) b.x = W + b.r
        if (b.x > W + b.r) b.x = -b.r
        if (b.y < -b.r) b.y = H + b.r
        if (b.y > H + b.r) b.y = -b.r
        const pr = b.r * (1 + 0.1 * Math.sin(b.phase))
        const g = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, pr)
        const [r, gn, bl] = b.rgb
        g.addColorStop(0, `rgba(${r},${gn},${bl},0.18)`)
        g.addColorStop(0.5, `rgba(${r},${gn},${bl},0.08)`)
        g.addColorStop(1, `rgba(${r},${gn},${bl},0)`)
        ctx.fillStyle = g
        ctx.beginPath()
        ctx.arc(b.x, b.y, pr, 0, Math.PI * 2)
        ctx.fill()
      }

      ctx.save()
      for (let w = 0; w < 4; w++) {
        const yBase = H * (0.2 + w * 0.2),
          amp = 18 + w * 8,
          freq = 0.003 + w * 0.001,
          speed = t * (0.003 + w * 0.001)
        ctx.beginPath()
        for (let x = 0; x <= W; x += 4) {
          const y = yBase + amp * Math.sin(x * freq + speed)
          x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
        }
        ctx.strokeStyle = `rgba(140,165,120,${0.04 - w * 0.005})`
        ctx.lineWidth = 1
        ctx.stroke()
      }
      ctx.restore()

      dotTimer++
      if (dotTimer > 14 && dots.length < 70) {
        spawnDot()
        dotTimer = 0
      }
      for (let i = dots.length - 1; i >= 0; i--) {
        const d = dots[i]
        d.life++
        d.wobble += 0.02
        d.x += Math.sin(d.wobble) * 0.25
        d.y += d.vy
        d.alpha = Math.sin((d.life / d.max) * Math.PI) * 0.55
        const [r, gn, bl] = d.rgb
        ctx.fillStyle = `rgba(${r},${gn},${bl},${d.alpha})`
        ctx.beginPath()
        ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2)
        ctx.fill()
        if (d.life >= d.max) dots.splice(i, 1)
      }

      raf = requestAnimationFrame(draw)
    }

    resize()
    draw()
    window.addEventListener('resize', resize)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return (
    <canvas
      ref={ref}
      style={{
        position: 'fixed',
        inset: 0,
        width: '100%',
        height: '100%',
        zIndex: 0,
        pointerEvents: 'none',
      }}
    />
  )
}

// ── Main page ────────────────────────────────────────────────────────
type TaskType = 'text' | 'formula' | 'table'
const taskMeta = {
  text: {
    label: 'Plain Text',
    desc: 'Extract readable text content',
    icon: '𝐓',
  },
  formula: { label: 'Formula', desc: 'Capture equations & math', icon: '∑' },
  table: { label: 'Table', desc: 'Structured data extraction', icon: '⊞' },
}

export default function Home() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [preview, setPreview] = useState('')
  const [extractedText, setExtractedText] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [taskType, setTaskType] = useState<TaskType>('text')
  const [success, setSuccess] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [processingTime, setProcessingTime] = useState(0)
  const [copied, setCopied] = useState(false)
  const [mounted, setMounted] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image (JPG, PNG, GIF, WebP)')
      return
    }
    setSelectedFile(file)
    setExtractedText('')
    setError('')
    setSuccess(false)
    setProcessingTime(0)
    const r = new FileReader()
    r.onloadend = () => setPreview(r.result as string)
    r.readAsDataURL(file)
  }
  const onDrag = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(e.type === 'dragenter' || e.type === 'dragover')
  }
  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (e.dataTransfer.files?.[0]) handleFile(e.dataTransfer.files[0])
  }

  const extract = async () => {
    if (!selectedFile) {
      setError('Please select an image first')
      return
    }
    setLoading(true)
    setError('')
    setExtractedText('')
    setSuccess(false)
    const t0 = Date.now()
    try {
      const fd = new FormData()
      fd.append('file', selectedFile)
      fd.append('task_type', taskType)
      const res = await fetch('http://localhost:8000/api/extract-text', {
        method: 'POST',
        body: fd,
      })
      if (!res.ok) {
        const e = await res.json()
        throw new Error(e.detail || 'Failed')
      }
      const data = await res.json()
      setExtractedText(data.extracted_text)
      setSuccess(true)
      setProcessingTime((Date.now() - t0) / 1000)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const clear = () => {
    setSelectedFile(null)
    setPreview('')
    setExtractedText('')
    setError('')
    setSuccess(false)
    setProcessingTime(0)
  }
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(extractedText)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setError('Copy failed')
    }
  }
  const dl = () => {
    const a = document.createElement('a')
    a.href = URL.createObjectURL(
      new Blob([extractedText], { type: 'text/plain' }),
    )
    a.download = `extracted-${Date.now()}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  const mu = (delay = 0): React.CSSProperties => ({
    opacity: mounted ? 1 : 0,
    animation: mounted
      ? `fadeUp 0.7s ${delay}s cubic-bezier(0.22,1,0.36,1) both`
      : 'none',
  })

  return (
    <main style={{ position: 'relative', zIndex: 1, minHeight: '100vh' }}>
      <AnimatedBg />

      {/* Header */}
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 50,
          background: 'rgba(248,244,238,0.85)',
          backdropFilter: 'blur(18px)',
          borderBottom: '1px solid rgba(160,140,110,0.18)',
          boxShadow: '0 1px 20px rgba(80,60,30,0.06)',
        }}
      >
        <div
          style={{
            maxWidth: 860,
            margin: '0 auto',
            padding: '0 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            height: 64,
          }}
        >
          <div
            style={{ display: 'flex', alignItems: 'center', gap: 12, ...mu(0) }}
          >
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 10,
                background: 'linear-gradient(135deg,#5a7a4a,#3a5a2e)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 14px rgba(58,90,46,0.3)',
              }}
            >
              <LeafIcon size={17} color="#d8f0c8" />
            </div>
            <div>
              <h1
                style={{
                  fontFamily: "'Cormorant Garamond',serif",
                  fontSize: 22,
                  fontWeight: 500,
                  color: '#2a2018',
                  lineHeight: 1,
                  margin: 0,
                }}
              >
                Verdant OCR
              </h1>
              <p
                style={{
                  fontFamily: "'DM Sans',sans-serif",
                  fontSize: 9,
                  color: '#9a8a78',
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  margin: '3px 0 0',
                }}
              >
                Image to Text
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 5 }}>
            {['#7a9e68', '#c8a882', '#5a7a4a'].map((c, i) => (
              <div
                key={i}
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  background: c,
                  opacity: 0.8,
                }}
              />
            ))}
          </div>
        </div>
      </header>

      <div
        style={{
          maxWidth: 860,
          margin: '0 auto',
          padding: '52px 24px 64px',
          position: 'relative',
          zIndex: 1,
        }}
      >
        {/* Hero */}
        <div style={{ textAlign: 'center', marginBottom: 52, ...mu(0.05) }}>
          <h2
            style={{
              fontFamily: "'Cormorant Garamond',serif",
              fontSize: 'clamp(36px,5.5vw,60px)',
              fontWeight: 300,
              lineHeight: 1.1,
              color: '#2a2018',
              margin: '0 0 14px',
            }}
          >
            Extract text from
            <br />
            <em style={{ color: '#5a7a4a', fontStyle: 'italic' }}>any image</em>
            , instantly
          </h2>
          <p
            style={{
              fontFamily: "'DM Sans',sans-serif",
              fontSize: 15,
              color: '#6a5a48',
              fontWeight: 300,
              maxWidth: 420,
              margin: '0 auto',
              lineHeight: 1.6,
            }}
          >
            AI-powered OCR for text, formulas, and structured tables.
          </p>
        </div>

        {/* Error */}
        {error && (
          <div
            style={{
              marginBottom: 18,
              padding: '13px 16px',
              background: 'rgba(200,80,60,0.07)',
              border: '1px solid rgba(200,80,60,0.2)',
              borderRadius: 12,
              display: 'flex',
              gap: 10,
              alignItems: 'flex-start',
            }}
          >
            <AlertCircle
              size={15}
              color="#b85a40"
              style={{ flexShrink: 0, marginTop: 1 }}
            />
            <p
              style={{
                fontFamily: "'DM Sans',sans-serif",
                fontSize: 13,
                color: '#8a3a28',
                margin: 0,
              }}
            >
              {error}
            </p>
          </div>
        )}

        {/* Success */}
        {success && extractedText && (
          <div
            style={{
              marginBottom: 18,
              padding: '13px 16px',
              background: 'rgba(90,122,74,0.07)',
              border: '1px solid rgba(90,122,74,0.22)',
              borderRadius: 12,
              display: 'flex',
              gap: 10,
              alignItems: 'flex-start',
            }}
          >
            <CheckCircle2
              size={15}
              color="#5a7a4a"
              style={{ flexShrink: 0, marginTop: 1 }}
            />
            <div>
              <p
                style={{
                  fontFamily: "'DM Sans',sans-serif",
                  fontSize: 13,
                  color: '#3a5a2e',
                  margin: 0,
                }}
              >
                Text extracted successfully
              </p>
              {processingTime > 0 && (
                <p
                  style={{
                    fontFamily: "'Space Mono',monospace",
                    fontSize: 10,
                    color: '#7a9e68',
                    margin: '3px 0 0',
                  }}
                >
                  {processingTime.toFixed(2)}s
                </p>
              )}
            </div>
          </div>
        )}

        {/* Card */}
        <div
          style={{
            background: 'rgba(255,253,248,0.9)',
            backdropFilter: 'blur(16px)',
            borderRadius: 22,
            border: '1px solid rgba(160,140,110,0.18)',
            boxShadow:
              '0 4px 40px rgba(80,60,30,0.08), 0 1px 0 rgba(255,255,255,0.9) inset',
            overflow: 'hidden',
            ...mu(0.1),
          }}
        >
          {/* Tabs */}
          <div
            style={{
              borderBottom: '1px solid rgba(160,140,110,0.14)',
              background: 'rgba(245,240,232,0.6)',
              padding: '18px 28px',
            }}
          >
            <p
              style={{
                fontFamily: "'DM Sans',sans-serif",
                fontSize: 10,
                fontWeight: 500,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: '#9a8a78',
                margin: '0 0 10px',
              }}
            >
              Extraction Mode
            </p>
            <div style={{ display: 'flex', gap: 8 }}>
              {(
                Object.entries(taskMeta) as [TaskType, typeof taskMeta.text][]
              ).map(([type, meta]) => (
                <button
                  key={type}
                  onClick={() => setTaskType(type)}
                  disabled={loading}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 9,
                    border:
                      taskType === type
                        ? '1.5px solid #7a9e68'
                        : '1.5px solid transparent',
                    background:
                      taskType === type ? 'rgba(90,122,74,0.1)' : 'transparent',
                    color: taskType === type ? '#3a5a2e' : '#8a7a68',
                    fontFamily: "'DM Sans',sans-serif",
                    fontSize: 13,
                    fontWeight: taskType === type ? 500 : 400,
                    cursor: loading ? 'not-allowed' : 'pointer',
                    opacity: loading ? 0.5 : 1,
                    transition: 'all 0.22s cubic-bezier(0.22,1,0.36,1)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 7,
                  }}
                >
                  <span
                    style={{
                      fontFamily: "'Cormorant Garamond',serif",
                      fontSize: 15,
                    }}
                  >
                    {meta.icon}
                  </span>
                  {meta.label}
                </button>
              ))}
            </div>
            <p
              style={{
                fontFamily: "'DM Sans',sans-serif",
                fontSize: 11,
                color: '#9a8a78',
                margin: '7px 0 0 2px',
              }}
            >
              {taskMeta[taskType].desc}
            </p>
          </div>

          <div style={{ padding: '28px' }}>
            {/* Drop zone */}
            <div
              onDragEnter={onDrag}
              onDragLeave={onDrag}
              onDragOver={onDrag}
              onDrop={onDrop}
              onClick={() => !selectedFile && fileRef.current?.click()}
              style={{
                border: `2px dashed ${dragActive ? '#7a9e68' : selectedFile ? '#a0c880' : 'rgba(160,140,110,0.3)'}`,
                borderRadius: 14,
                marginBottom: 22,
                padding: selectedFile ? '18px 22px' : '44px 22px',
                background: dragActive
                  ? 'rgba(90,122,74,0.05)'
                  : 'rgba(245,240,232,0.5)',
                cursor: selectedFile ? 'default' : 'pointer',
                transition: 'all 0.25s cubic-bezier(0.22,1,0.36,1)',
              }}
            >
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                onChange={(e) =>
                  e.target.files && handleFile(e.target.files[0])
                }
                disabled={loading}
                style={{ display: 'none' }}
              />
              {selectedFile ? (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div
                    style={{ display: 'flex', alignItems: 'center', gap: 13 }}
                  >
                    <div
                      style={{
                        width: 38,
                        height: 38,
                        borderRadius: 9,
                        background: 'rgba(90,122,74,0.1)',
                        border: '1px solid rgba(90,122,74,0.2)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <CheckCircle2 size={17} color="#5a7a4a" />
                    </div>
                    <div>
                      <p
                        style={{
                          fontFamily: "'DM Sans',sans-serif",
                          fontSize: 14,
                          fontWeight: 500,
                          color: '#2a2018',
                          margin: 0,
                        }}
                      >
                        {selectedFile.name}
                      </p>
                      <p
                        style={{
                          fontFamily: "'Space Mono',monospace",
                          fontSize: 10,
                          color: '#9a8a78',
                          margin: '2px 0 0',
                        }}
                      >
                        {(selectedFile.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      clear()
                    }}
                    disabled={loading}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#b0a090',
                      padding: 6,
                      borderRadius: 7,
                      transition: 'color 0.18s',
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.color = '#b85a40')
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.color = '#b0a090')
                    }
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <div style={{ textAlign: 'center' }}>
                  <div
                    style={{
                      width: 56,
                      height: 56,
                      borderRadius: 14,
                      background: 'rgba(90,122,74,0.08)',
                      border: '1px solid rgba(90,122,74,0.15)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 14px',
                      animation: 'float 3.5s ease-in-out infinite',
                    }}
                  >
                    <Upload size={24} color="#7a9e68" />
                  </div>
                  <p
                    style={{
                      fontFamily: "'Cormorant Garamond',serif",
                      fontSize: 22,
                      fontWeight: 400,
                      color: '#2a2018',
                      margin: '0 0 7px',
                    }}
                  >
                    Drop your image here
                  </p>
                  <p
                    style={{
                      fontFamily: "'DM Sans',sans-serif",
                      fontSize: 12,
                      color: '#9a8a78',
                      margin: '0 0 18px',
                    }}
                  >
                    or click to browse — JPG, PNG, GIF, WebP
                  </p>
                  <span
                    style={{
                      display: 'inline-block',
                      padding: '9px 22px',
                      background: 'linear-gradient(135deg,#5a7a4a,#3a5a2e)',
                      color: '#d8f0c8',
                      borderRadius: 9,
                      fontFamily: "'DM Sans',sans-serif",
                      fontSize: 13,
                      fontWeight: 500,
                      letterSpacing: '0.03em',
                      boxShadow: '0 4px 14px rgba(58,90,46,0.28)',
                    }}
                  >
                    Browse Files
                  </span>
                </div>
              )}
            </div>

            {/* Preview */}
            {preview && (
              <div style={{ marginBottom: 22 }}>
                <p
                  style={{
                    fontFamily: "'DM Sans',sans-serif",
                    fontSize: 10,
                    fontWeight: 500,
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    color: '#9a8a78',
                    margin: '0 0 10px',
                  }}
                >
                  Preview
                </p>
                <div
                  style={{
                    borderRadius: 12,
                    overflow: 'hidden',
                    border: '1px solid rgba(160,140,110,0.18)',
                    background: 'rgba(245,240,232,0.5)',
                    maxHeight: 320,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <img
                    src={preview}
                    alt="Preview"
                    style={{
                      maxWidth: '100%',
                      maxHeight: 320,
                      objectFit: 'contain',
                      display: 'block',
                    }}
                  />
                </div>
              </div>
            )}

            {/* Extract */}
            {selectedFile && (
              <button
                onClick={extract}
                disabled={loading}
                style={{
                  width: '100%',
                  height: 52,
                  border: 'none',
                  borderRadius: 12,
                  marginBottom: 4,
                  background: loading
                    ? 'linear-gradient(90deg,#5a7a4a 0%,#7a9e68 40%,#3a5a2e 60%,#5a7a4a 100%)'
                    : 'linear-gradient(135deg,#5a7a4a,#3a5a2e)',
                  backgroundSize: loading ? '200% auto' : '100% auto',
                  animation: loading ? 'shimmer 1.8s linear infinite' : 'none',
                  color: '#d8f0c8',
                  fontFamily: "'DM Sans',sans-serif",
                  fontSize: 14,
                  fontWeight: 500,
                  letterSpacing: '0.04em',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  boxShadow: loading
                    ? 'none'
                    : '0 6px 22px rgba(58,90,46,0.32)',
                  transition: 'all 0.25s cubic-bezier(0.22,1,0.36,1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 9,
                }}
                onMouseEnter={(e) =>
                  !loading &&
                  ((e.currentTarget.style.transform = 'translateY(-1px)'),
                  (e.currentTarget.style.boxShadow =
                    '0 10px 28px rgba(58,90,46,0.38)'))
                }
                onMouseLeave={(e) =>
                  !loading &&
                  ((e.currentTarget.style.transform = 'translateY(0)'),
                  (e.currentTarget.style.boxShadow =
                    '0 6px 22px rgba(58,90,46,0.32)'))
                }
              >
                {loading ? (
                  <>
                    <svg
                      style={{
                        animation: 'spin 1s linear infinite',
                        flexShrink: 0,
                      }}
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                    >
                      <circle
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="rgba(200,240,180,0.3)"
                        strokeWidth="3"
                      />
                      <path
                        d="M12 2a10 10 0 0 1 10 10"
                        stroke="#c8f0b0"
                        strokeWidth="3"
                        strokeLinecap="round"
                      />
                    </svg>{' '}
                    Processing…
                  </>
                ) : (
                  <>
                    <LeafIcon size={15} color="#d8f0c8" /> Extract Text
                  </>
                )}
              </button>
            )}

            {/* Result */}
            {extractedText && (
              <div style={{ marginTop: 22 }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: 10,
                  }}
                >
                  <p
                    style={{
                      fontFamily: "'DM Sans',sans-serif",
                      fontSize: 10,
                      fontWeight: 500,
                      letterSpacing: '0.12em',
                      textTransform: 'uppercase',
                      color: '#9a8a78',
                      margin: 0,
                    }}
                  >
                    Extracted Content
                  </p>
                  <span
                    style={{
                      fontFamily: "'Space Mono',monospace",
                      fontSize: 10,
                      color: '#7a9e68',
                    }}
                  >
                    {extractedText.length} chars
                  </span>
                </div>
                <div
                  style={{
                    background: 'rgba(245,240,232,0.7)',
                    border: '1px solid rgba(160,140,110,0.18)',
                    borderRadius: 12,
                    padding: '16px 18px',
                    marginBottom: 14,
                    maxHeight: 260,
                    overflowY: 'auto',
                  }}
                >
                  <p
                    style={{
                      fontFamily: "'Space Mono',monospace",
                      fontSize: 12,
                      lineHeight: 1.8,
                      color: '#2a2018',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                      margin: 0,
                    }}
                  >
                    {extractedText}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button
                    onClick={copy}
                    style={{
                      flex: 1,
                      padding: '10px 0',
                      borderRadius: 9,
                      border: `1.5px solid ${copied ? '#7a9e68' : 'rgba(160,140,110,0.22)'}`,
                      background: copied
                        ? 'rgba(90,122,74,0.08)'
                        : 'rgba(245,240,232,0.6)',
                      color: copied ? '#3a5a2e' : '#5a4a38',
                      fontFamily: "'DM Sans',sans-serif",
                      fontSize: 13,
                      fontWeight: 500,
                      cursor: 'pointer',
                      transition: 'all 0.22s ease',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                    }}
                  >
                    <Copy size={13} />
                    {copied ? 'Copied!' : 'Copy Text'}
                  </button>
                  <button
                    onClick={dl}
                    style={{
                      flex: 1,
                      padding: '10px 0',
                      borderRadius: 9,
                      border: 'none',
                      background: 'linear-gradient(135deg,#5a7a4a,#3a5a2e)',
                      color: '#d8f0c8',
                      fontFamily: "'DM Sans',sans-serif",
                      fontSize: 13,
                      fontWeight: 500,
                      cursor: 'pointer',
                      boxShadow: '0 3px 12px rgba(58,90,46,0.28)',
                      transition: 'all 0.22s ease',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-1px)'
                      e.currentTarget.style.boxShadow =
                        '0 6px 18px rgba(58,90,46,0.38)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)'
                      e.currentTarget.style.boxShadow =
                        '0 3px 12px rgba(58,90,46,0.28)'
                    }}
                  >
                    <Download size={13} /> Download TXT
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <p
          style={{
            textAlign: 'center',
            marginTop: 36,
            fontFamily: "'DM Sans',sans-serif",
            fontSize: 11,
            color: '#9a8a78',
            letterSpacing: '0.08em',
            ...mu(0.5),
          }}
        >
          Powered by AI · Verdant OCR ·{' '}
          <span style={{ color: '#7a9e68' }}>🌿</span>
        </p>
      </div>
    </main>
  )
}
