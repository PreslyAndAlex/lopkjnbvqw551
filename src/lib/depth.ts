/**
 * depth.ts — единственият източник на истина за текущата дълбочина.
 *
 * Стойността се променя 60 пъти в секунда. Държим я извън React: рендерите на
 * канвасите и гейджа четат директно, а React се пре-рендерира само когато се
 * смени зоната (няколко пъти на цялото спускане).
 */

import { opticsAt, type Optics } from './optics'

export type ZoneId =
  | 'surface'
  | 'shallow'
  | 'thermocline'
  | 'blue'
  | 'twilight'
  | 'wrecks'
  | 'dark'
  | 'ascent'
  | 'deco'

export type Zone = {
  id: ZoneId
  /** дълбочина в началото и края на секцията, m */
  from: number
  to: number
  /** номер за етикета „02 · ПЛИТЧИНАТА“ */
  index: string
}

/** Картата на спускането. Редът тук е редът на секциите в документа. */
export const ZONES: Zone[] = [
  { id: 'surface', from: 0, to: 2, index: '01' },
  { id: 'shallow', from: 2, to: 8, index: '02' },
  { id: 'thermocline', from: 8, to: 16, index: '03' },
  { id: 'blue', from: 16, to: 24, index: '04' },
  { id: 'twilight', from: 24, to: 32, index: '05' },
  { id: 'wrecks', from: 32, to: 42, index: '06' },
  { id: 'dark', from: 42, to: 50, index: '07' },
  { id: 'ascent', from: 50, to: 5, index: '08' },
  { id: 'deco', from: 5, to: 0, index: '09' },
]

export const MAX_DEPTH = 50

export function zoneAt(depth: number, descending = true): Zone {
  const list = descending ? ZONES.slice(0, 7) : ZONES
  for (const z of list) {
    const lo = Math.min(z.from, z.to)
    const hi = Math.max(z.from, z.to)
    if (depth >= lo && depth <= hi) return z
  }
  return ZONES[0]
}

type Listener = (depth: number) => void

class DepthState {
  /** целева дълбочина, зададена от ScrollTrigger */
  target = 0
  /** изгладена дълбочина, това четат рендерите */
  current = 0
  /** най-голямата достигната дълбочина в тази сесия */
  max = 0
  /** скорост на скрола в px/frame — храни частиците */
  velocity = 0
  /** активна ли е анимацията (false при prefers-reduced-motion) */
  animated = true
  /** ръчно фиксирана дълбочина за проверки; в продукция е null */
  override: number | null = null

  private zone: ZoneId = 'surface'
  private frameListeners = new Set<Listener>()

  set(depth: number) {
    if (this.override !== null) return
    this.target = depth
    if (!this.animated) this.current = depth
  }

  /** Фиксира дълбочината независимо от скрола. null я освобождава. */
  freeze(depth: number | null) {
    this.override = depth
    if (depth !== null) {
      this.target = depth
      this.current = depth
    }
  }

  /** Изглаждане, извиквано веднъж на кадър от главния цикъл. */
  tick(dt: number) {
    if (this.animated) {
      const k = 1 - Math.exp(-dt * 9)
      this.current += (this.target - this.current) * k
    } else {
      this.current = this.target
    }
    if (this.current > this.max) this.max = this.current
    const z = zoneAt(this.current).id
    if (z !== this.zone) {
      this.zone = z
      // Зоната е на root елемента: CSS и QA могат да я четат, без React да се
      // пре-рендерира на всеки кадър.
      document.documentElement.dataset.zone = z
    }
    for (const l of this.frameListeners) l(this.current)
  }

  optics(): Optics {
    return opticsAt(this.current)
  }

  onFrame(fn: Listener): () => void {
    this.frameListeners.add(fn)
    return () => {
      this.frameListeners.delete(fn)
    }
  }

  getZone() {
    return this.zone
  }
}

export const depthState = new DepthState()
