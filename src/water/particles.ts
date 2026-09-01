/**
 * Взвесени частици (морски сняг). Canvas 2D, защото са малко и рисуването е
 * тривиално — WebGL тук би бил разход без полза.
 *
 * Посоката е важна за усещането: когато слизаш, неподвижните частици минават
 * НАГОРЕ покрай теб. Скоростта на скрола ги влачи, а не времето.
 */

type Particle = {
  x: number
  y: number
  /** 0.25..1 — колко близо е частицата; храни размера и паралакса */
  z: number
  size: number
  drift: number
  phase: number
  alpha: number
}

const rand = (a: number, b: number) => a + Math.random() * (b - a)

export class SiltLayer {
  private ctx: CanvasRenderingContext2D | null
  private canvas: HTMLCanvasElement
  private parts: Particle[] = []
  private w = 0
  private h = 0
  private dpr = 1

  constructor(canvas: HTMLCanvasElement, count: number) {
    this.canvas = canvas
    this.ctx = canvas.getContext('2d', { alpha: true, desynchronized: true })
    this.setCount(count)
  }

  setCount(count: number) {
    const cur = this.parts.length
    if (count === cur) return
    if (count < cur) {
      this.parts.length = count
      return
    }
    for (let i = cur; i < count; i++) {
      this.parts.push({
        x: Math.random(),
        y: Math.random(),
        z: rand(0.25, 1),
        size: rand(0.6, 2.4),
        drift: rand(-0.02, 0.02),
        phase: Math.random() * Math.PI * 2,
        alpha: rand(0.18, 0.85),
      })
    }
  }

  private resize() {
    const cw = this.canvas.clientWidth || window.innerWidth
    const ch = this.canvas.clientHeight || window.innerHeight
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const w = Math.round(cw * dpr)
    const h = Math.round(ch * dpr)
    if (w === this.w && h === this.h) return
    this.w = w
    this.h = h
    this.dpr = dpr
    this.canvas.width = w
    this.canvas.height = h
  }

  /**
   * @param dt         секунди от предишния кадър
   * @param descend    px скрол за кадър; положително = слизаш
   * @param tint       цвят на частиците (0..1), идва от воала
   * @param brightness 0..1 общо ниво на светлината
   */
  render(dt: number, descend: number, tint: [number, number, number], brightness: number) {
    const ctx = this.ctx
    if (!ctx) return
    this.resize()
    ctx.clearRect(0, 0, this.w, this.h)
    if (this.parts.length === 0) return

    const rise = descend * 0.0016
    const t = performance.now() * 0.0004
    const r = Math.round(Math.min(1, tint[0] * 1.6 + 0.45) * 255)
    const g = Math.round(Math.min(1, tint[1] * 1.2 + 0.62) * 255)
    const b = Math.round(Math.min(1, tint[2] * 1.1 + 0.72) * 255)
    const base = 0.10 + 0.45 * brightness

    ctx.globalCompositeOperation = 'lighter'

    for (let i = 0; i < this.parts.length; i++) {
      const p = this.parts[i]
      p.y -= (rise * p.z + dt * 0.006 * p.z)
      p.x += (p.drift * dt + Math.sin(t + p.phase) * 0.00035) * p.z

      if (p.y < -0.03) {
        p.y = 1.03
        p.x = Math.random()
      } else if (p.y > 1.03) {
        p.y = -0.03
        p.x = Math.random()
      }
      if (p.x < -0.03) p.x = 1.03
      else if (p.x > 1.03) p.x = -0.03

      const s = p.size * p.z * this.dpr
      const a = p.alpha * base * (0.4 + 0.6 * p.z)
      ctx.fillStyle = `rgba(${r},${g},${b},${a.toFixed(3)})`
      const x = p.x * this.w
      const y = p.y * this.h
      if (s > 1.7) {
        ctx.beginPath()
        ctx.arc(x, y, s * 0.5, 0, Math.PI * 2)
        ctx.fill()
      } else {
        ctx.fillRect(x, y, s, s)
      }
    }
    ctx.globalCompositeOperation = 'source-over'
  }

  clear() {
    this.ctx?.clearRect(0, 0, this.w, this.h)
  }
}
