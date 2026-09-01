import { depthState } from '../lib/depth'
import { opticsAt, seaColorAt } from '../lib/optics'
import { QUALITY, torchState, type Quality } from '../lib/device'
import { WaterRenderer } from './renderer'
import { SiltLayer } from './particles'

type Layer = { host: HTMLElement; canvas: HTMLCanvasElement }

type Canvases = {
  multiply: Layer
  screen: Layer
  silt: HTMLCanvasElement
}

type Options = {
  quality: Quality
  reduced: boolean
  onQualityDrop?: (q: Quality) => void
}

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v)
const to255 = (v: number) => Math.round(clamp01(v) * 255)

class Engine {
  private raf = 0
  private last = 0
  private t0 = 0
  private multiply: WaterRenderer | null = null
  private screen: WaterRenderer | null = null
  private silt: SiltLayer | null = null
  private canvases: Canvases | null = null
  private quality: Quality = 'high'
  private reduced = false
  private lastScrollY = 0
  private frameEma = 16.7
  private slowFor = 0
  private droppedOnce = false
  private onQualityDrop?: (q: Quality) => void
  private cssTick = 0
  private glOk = true
  private lastDrawn = -1

  start(canvases: Canvases, opts: Options) {
    this.stop()
    this.canvases = canvases
    this.quality = opts.quality
    this.reduced = opts.reduced
    this.onQualityDrop = opts.onQualityDrop
    depthState.animated = !opts.reduced

    const q = QUALITY[this.quality]
    this.multiply = new WaterRenderer(canvases.multiply.host, canvases.multiply.canvas, 'multiply')
    this.screen = new WaterRenderer(canvases.screen.host, canvases.screen.canvas, 'screen')
    this.multiply.buildProgram(q.causticSteps)
    this.screen.buildProgram(q.causticSteps)
    this.multiply.setScale(q.scale)
    this.screen.setScale(q.scale)
    this.glOk = this.multiply.ready && this.screen.ready

    if (!this.glOk) {
      // Без WebGL слоевете стават плътни цветове върху носещите елементи.
      // Моделът е същият, просто без каустики, снопове и фенер.
      canvases.multiply.canvas.style.display = 'none'
      canvases.screen.canvas.style.display = 'none'
    }

    this.silt = new SiltLayer(canvases.silt, opts.reduced ? 0 : q.particles)
    this.lastScrollY = window.scrollY
    this.t0 = performance.now()
    this.last = this.t0
    this.raf = requestAnimationFrame(this.loop)
  }

  setQuality(next: Quality) {
    if (next === this.quality || !this.canvases) return
    this.quality = next
    const q = QUALITY[next]
    this.multiply?.buildProgram(q.causticSteps)
    this.screen?.buildProgram(q.causticSteps)
    this.multiply?.setScale(q.scale)
    this.screen?.setScale(q.scale)
    this.silt?.setCount(this.reduced ? 0 : q.particles)
  }

  private loop = (now: number) => {
    this.raf = requestAnimationFrame(this.loop)
    const rawDt = now - this.last
    this.last = now
    const dt = Math.min(rawDt, 50) / 1000

    // Кадрова хигиена: ако не смогваме, сваляме качеството вместо кадри.
    // Дупки над 100 ms не са бавен кадър — това е скрит таб, смяна на
    // приложение или пауза за събиране на боклук. Те не бива да свалят
    // качеството на устройство, което иначе се справя.
    const measurable = rawDt < 100 && !document.hidden
    if (measurable) this.frameEma += (rawDt - this.frameEma) * 0.08
    if (measurable && !this.droppedOnce && this.frameEma > 21) {
      this.slowFor += rawDt
      if (this.slowFor > 1400) {
        const next: Quality = this.quality === 'high' ? 'medium' : 'low'
        if (next !== this.quality) {
          this.setQuality(next)
          this.onQualityDrop?.(next)
        }
        if (next === 'low') this.droppedOnce = true
        this.slowFor = 0
      }
    } else if (measurable && this.frameEma < 19) {
      this.slowFor = Math.max(0, this.slowFor - rawDt)
    }

    depthState.tick(dt)
    const d = depthState.current
    const o = opticsAt(d)

    const sy = window.scrollY
    const descend = sy - this.lastScrollY
    this.lastScrollY = sy
    depthState.velocity += (descend - depthState.velocity) * 0.25

    // Фенер
    const target = torchState.on ? 1 : 0
    torchState.intensity += (target - torchState.intensity) * (1 - Math.exp(-dt * 7))
    torchState.radius = Math.min(Math.max(Math.min(window.innerWidth, window.innerHeight) * 0.36, 165), 380)

    const caustics = this.reduced ? 0 : Math.pow(clamp01(1 - d / 16), 1.4)
    const shafts =
      !this.reduced && QUALITY[this.quality].shafts ? Math.pow(clamp01(1 - d / 38), 1.2) : 0
    const time = (now - this.t0) / 1000

    // При намалено движение рисуваме само когато дълбочината се е сменила.
    if (this.reduced && Math.abs(d - this.lastDrawn) < 0.01 && torchState.intensity < 0.001) return
    this.lastDrawn = d

    if (this.glOk) {
      const frame = {
        time,
        depth: d,
        caustics,
        shafts,
        torchX: torchState.x,
        torchY: torchState.y,
        torchIntensity: torchState.intensity,
        torchRadius: torchState.radius,
        color: [0, 0, 0] as [number, number, number],
      }
      this.multiply?.render({ ...frame, color: o.multiply })
      this.screen?.render({ ...frame, color: o.veil })
    } else if (this.canvases) {
      this.canvases.multiply.host.style.backgroundColor = `rgb(${to255(o.multiply[0])},${to255(o.multiply[1])},${to255(o.multiply[2])})`
      this.canvases.screen.host.style.backgroundColor = `rgb(${to255(o.veil[0])},${to255(o.veil[1])},${to255(o.veil[2])})`
    }

    if (!this.reduced) {
      this.silt?.render(dt, depthState.velocity, o.veil, o.exposure)
    }

    // Няколко променливи за HUD-а, но не всеки кадър — style recalc е скъп.
    this.cssTick += rawDt
    if (this.cssTick > 90) {
      this.cssTick = 0
      const root = document.documentElement
      root.style.setProperty('--sea', seaColorAt(d))
      root.style.setProperty('--exposure', o.exposure.toFixed(3))
    }
  }

  stop() {
    if (this.raf) cancelAnimationFrame(this.raf)
    this.raf = 0
    this.multiply?.dispose()
    this.screen?.dispose()
    this.multiply = null
    this.screen = null
    this.silt?.clear()
    this.silt = null
    this.canvases = null
  }
}

export const engine = new Engine()
