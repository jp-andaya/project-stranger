"use client"

import { useEffect, useRef, useState } from "react"

interface Note {
  x: number
  y: number
  z: number
  rotX: number
  rotZ: number
  width: number
  height: number
  drift: number
  driftSpeed: number
  phase: number
}

interface Bowl3DProps {
  width?: number
  height?: number
  className?: string
  noteCount?: number
}

export default function Bowl3D({ width = 800, height = 600, className = "", noteCount = 8 }: Bowl3DProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animRef = useRef<number>(0)

  useEffect(() => {
    if (!canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Responsive sizing
    const containerWidth = Math.min(width, window.innerWidth - 40)
    const containerHeight = Math.min(height, window.innerHeight - 100)

    const dpr = window.devicePixelRatio || 1
    canvas.width = containerWidth * dpr
    canvas.height = containerHeight * dpr
    canvas.style.width = `${containerWidth}px`
    canvas.style.height = `${containerHeight}px`
    ctx.scale(dpr, dpr)

    const cx = containerWidth / 2
    const cy = containerHeight / 2
    const bowlRadius = Math.min(containerWidth, containerHeight) * 0.32
    const bowlDepth = bowlRadius * 0.6

    // Rotation state
    let rotationY = 0
    let rotationX = 0.4 // slight tilt to show inside
    let autoRotate = true
    const rotationSpeed = 0.003
    let time = 0

    // Generate notes
    const notes: Note[] = Array.from({ length: Math.min(noteCount, 20) }, () => {
      const angle = Math.random() * Math.PI * 2
      const r = Math.random() * bowlRadius * 0.55
      const depth = Math.random() * bowlDepth * 0.7
      return {
        x: Math.cos(angle) * r,
        y: -depth * 0.3 - Math.random() * bowlDepth * 0.4,
        z: Math.sin(angle) * r,
        rotX: (Math.random() - 0.5) * 0.6,
        rotZ: (Math.random() - 0.5) * 0.8,
        width: 14 + Math.random() * 10,
        height: 9 + Math.random() * 6,
        drift: Math.random() * Math.PI * 2,
        driftSpeed: 0.3 + Math.random() * 0.5,
        phase: Math.random() * Math.PI * 2,
      }
    })

    // 3D projection helper
    const project = (x: number, y: number, z: number): [number, number, number] => {
      // Rotate around Y axis
      const cosY = Math.cos(rotationY)
      const sinY = Math.sin(rotationY)
      let rx = x * cosY - z * sinY
      let rz = x * sinY + z * cosY

      // Rotate around X axis
      const cosX = Math.cos(rotationX)
      const sinX = Math.sin(rotationX)
      let ry = y * cosX - rz * sinX
      rz = y * sinX + rz * cosX

      // Perspective
      const perspective = 800
      const scale = perspective / (perspective + rz)
      return [cx + rx * scale, cy + ry * scale, scale]
    }

    // Draw bowl wireframe
    const drawBowl = () => {
      const rings = 10
      const segments = 32

      // Draw horizontal rings (from bottom to top of bowl)
      for (let i = 0; i <= rings; i++) {
        const t = i / rings // 0 = bottom, 1 = rim
        const ringRadius = bowlRadius * (0.15 + t * 0.85) // narrower at bottom
        const ringY = bowlDepth * (1 - t) // depth position

        ctx.beginPath()
        let firstPoint = true
        for (let j = 0; j <= segments; j++) {
          const angle = (j / segments) * Math.PI * 2
          const x = Math.cos(angle) * ringRadius
          const z = Math.sin(angle) * ringRadius
          const [px, py] = project(x, ringY, z)

          if (firstPoint) {
            ctx.moveTo(px, py)
            firstPoint = false
          } else {
            ctx.lineTo(px, py)
          }
        }
        ctx.strokeStyle = i === rings ? "rgba(232, 180, 104, 0.5)" : "rgba(255, 255, 255, 0.08)"
        ctx.lineWidth = i === rings ? 2 : 0.8
        ctx.stroke()
      }

      // Draw vertical ribs
      for (let j = 0; j < segments; j += 4) {
        const angle = (j / segments) * Math.PI * 2
        ctx.beginPath()
        let firstPoint = true

        for (let i = 0; i <= rings; i++) {
          const t = i / rings
          const ringRadius = bowlRadius * (0.15 + t * 0.85)
          const ringY = bowlDepth * (1 - t)
          const x = Math.cos(angle) * ringRadius
          const z = Math.sin(angle) * ringRadius
          const [px, py] = project(x, ringY, z)

          if (firstPoint) {
            ctx.moveTo(px, py)
            firstPoint = false
          } else {
            ctx.lineTo(px, py)
          }
        }
        ctx.strokeStyle = "rgba(255, 255, 255, 0.06)"
        ctx.lineWidth = 0.8
        ctx.stroke()
      }

      // Draw rim highlight (thicker top ring with glow)
      ctx.beginPath()
      for (let j = 0; j <= segments; j++) {
        const angle = (j / segments) * Math.PI * 2
        const x = Math.cos(angle) * bowlRadius
        const z = Math.sin(angle) * bowlRadius
        const [px, py] = project(x, 0, z)

        if (j === 0) ctx.moveTo(px, py)
        else ctx.lineTo(px, py)
      }
      ctx.strokeStyle = "rgba(232, 180, 104, 0.35)"
      ctx.lineWidth = 2.5
      ctx.shadowColor = "rgba(232, 180, 104, 0.3)"
      ctx.shadowBlur = 8
      ctx.stroke()
      ctx.shadowBlur = 0
    }

    // Draw floating notes
    const drawNotes = () => {
      notes.forEach((note) => {
        // Animate drift
        const driftX = Math.sin(time * note.driftSpeed + note.drift) * 3
        const driftY = Math.sin(time * note.driftSpeed * 0.7 + note.phase) * 4
        const driftZ = Math.cos(time * note.driftSpeed * 0.5 + note.drift) * 3

        const nx = note.x + driftX
        const ny = note.y + driftY
        const nz = note.z + driftZ

        const [px, py, scale] = project(nx, ny, nz)

        // Only draw if within canvas bounds
        if (px < 0 || px > containerWidth || py < 0 || py > containerHeight) return

        const w = note.width * scale
        const h = note.height * scale

        ctx.save()
        ctx.translate(px, py)
        ctx.rotate(note.rotZ + Math.sin(time * 0.5 + note.phase) * 0.1)

        // Note shadow
        ctx.fillStyle = "rgba(232, 180, 104, 0.08)"
        ctx.fillRect(-w / 2 + 2, -h / 2 + 2, w, h)

        // Note body
        ctx.fillStyle = `rgba(232, 180, 104, ${0.5 + scale * 0.3})`
        ctx.fillRect(-w / 2, -h / 2, w, h)

        // Note "text" lines
        ctx.fillStyle = `rgba(12, 10, 20, ${0.3 + scale * 0.2})`
        const lineCount = Math.floor(h / 3)
        for (let l = 0; l < lineCount; l++) {
          const lineWidth = w * (0.5 + Math.random() * 0.35)
          ctx.fillRect(-w / 2 + 2, -h / 2 + 2 + l * 3, lineWidth, 1)
        }

        // Glow around note
        ctx.shadowColor = "rgba(232, 180, 104, 0.2)"
        ctx.shadowBlur = 6 * scale
        ctx.strokeStyle = "rgba(232, 180, 104, 0.3)"
        ctx.lineWidth = 0.5
        ctx.strokeRect(-w / 2, -h / 2, w, h)
        ctx.shadowBlur = 0

        ctx.restore()
      })
    }

    // Draw ambient glow
    const drawGlow = () => {
      // Inner bowl glow
      const gradient = ctx.createRadialGradient(cx, cy + bowlDepth * 0.3, 0, cx, cy + bowlDepth * 0.3, bowlRadius * 0.8)
      gradient.addColorStop(0, "rgba(232, 180, 104, 0.06)")
      gradient.addColorStop(0.5, "rgba(196, 160, 255, 0.03)")
      gradient.addColorStop(1, "transparent")
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, containerWidth, containerHeight)

      // Subtle firefly particles
      for (let i = 0; i < 5; i++) {
        const fx = cx + Math.sin(time * 0.3 + i * 1.3) * bowlRadius * 0.6
        const fy = cy + Math.cos(time * 0.4 + i * 0.9) * bowlDepth * 0.4
        const opacity = (Math.sin(time * 0.8 + i * 2) + 1) * 0.15
        ctx.beginPath()
        ctx.arc(fx, fy, 1.5, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(232, 180, 104, ${opacity})`
        ctx.fill()
      }
    }

    // Main render loop
    const render = () => {
      ctx.clearRect(0, 0, containerWidth, containerHeight)

      // Background
      ctx.fillStyle = "#0c0a14"
      ctx.fillRect(0, 0, containerWidth, containerHeight)

      // Subtle background gradient
      const bgGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, containerWidth * 0.6)
      bgGrad.addColorStop(0, "rgba(180, 140, 255, 0.03)")
      bgGrad.addColorStop(1, "transparent")
      ctx.fillStyle = bgGrad
      ctx.fillRect(0, 0, containerWidth, containerHeight)

      drawGlow()
      drawBowl()
      drawNotes()

      if (autoRotate) {
        rotationY += rotationSpeed
      }
      time += 0.016

      animRef.current = requestAnimationFrame(render)
    }

    render()

    // Interaction: drag to rotate
    const handleMouseDown = (event: MouseEvent) => {
      autoRotate = false
      const startX = event.clientX
      const startY = event.clientY
      const startRotY = rotationY
      const startRotX = rotationX

      const handleMouseMove = (e: MouseEvent) => {
        const dx = e.clientX - startX
        const dy = e.clientY - startY
        rotationY = startRotY + dx * 0.005
        rotationX = Math.max(0.1, Math.min(1.2, startRotX + dy * 0.005))
      }

      const handleMouseUp = () => {
        document.removeEventListener("mousemove", handleMouseMove)
        document.removeEventListener("mouseup", handleMouseUp)
        setTimeout(() => { autoRotate = true }, 10)
      }

      document.addEventListener("mousemove", handleMouseMove)
      document.addEventListener("mouseup", handleMouseUp)
    }

    // Scroll to zoom
    const handleWheel = (event: WheelEvent) => {
      event.preventDefault()
      // Adjust bowl visual depth on zoom (no-op for now, can extend)
    }

    canvas.addEventListener("mousedown", handleMouseDown)
    canvas.addEventListener("wheel", handleWheel)

    return () => {
      cancelAnimationFrame(animRef.current)
      canvas.removeEventListener("mousedown", handleMouseDown)
      canvas.removeEventListener("wheel", handleWheel)
    }
  }, [width, height, noteCount])

  return (
    <div className={`relative ${className}`}>
      <canvas
        ref={canvasRef}
        className="w-full h-auto rounded-2xl"
        style={{ maxWidth: "100%", height: "auto" }}
      />
      <div className="absolute bottom-4 left-4 text-xs text-white/30 px-2 py-1 rounded-md bg-black/40">
        Drag to rotate
      </div>
    </div>
  )
}
