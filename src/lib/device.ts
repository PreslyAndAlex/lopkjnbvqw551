export type Quality = 'high' | 'medium' | 'low'

/**
 * Системната настройка води. `?reduced=1` я включва ръчно — удобно е, за да
 * може достъпната версия да се покаже на клиент, без да се пипа операционната
 * система.
 */
export const prefersReducedMotion = () => {
  if (typeof window === 'undefined') return false
  if (new URLSearchParams(window.location.search).get('reduced') === '1') return true
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export const isCoarsePointer = () =>
  typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches

/**
 * Първоначален клас на устройството. Телефоните тръгват на „medium“ —
 * по-малко частици и по-нисък рендер мащаб — а монитор за кадрите може да
 * свали до „low“ по време на работа.
 */
export function initialQuality(): Quality {
  if (typeof window === 'undefined') return 'medium'
  const cores = navigator.hardwareConcurrency ?? 4
  const mem = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 4
  const small = window.innerWidth < 900 || isCoarsePointer()
  if (small && (cores <= 4 || mem <= 4)) return 'low'
  if (small) return 'medium'
  if (cores <= 4 || mem <= 4) return 'medium'
  return 'high'
}

export const QUALITY = {
  high: { scale: 0.5, particles: 150, causticSteps: 3, shafts: true },
  medium: { scale: 0.4, particles: 70, causticSteps: 2, shafts: true },
  low: { scale: 0.3, particles: 34, causticSteps: 1, shafts: false },
} as const

/** Позицията на фенера — чете се всеки кадър, затова живее извън React. */
export const torchState = {
  /** CSS px спрямо viewport-а */
  x: -1,
  y: -1,
  /** 0..1, изгладена интензивност */
  intensity: 0,
  on: false,
  /** радиус в CSS px */
  radius: 190,
}

export function attachTorchTracking() {
  if (typeof window === 'undefined') return () => {}
  const onMove = (e: PointerEvent) => {
    torchState.x = e.clientX
    torchState.y = e.clientY
  }
  const centre = () => {
    torchState.x = window.innerWidth / 2
    torchState.y = window.innerHeight * 0.45
  }
  if (isCoarsePointer()) {
    centre()
    window.addEventListener('resize', centre)
    window.addEventListener('pointerdown', onMove, { passive: true })
    window.addEventListener('pointermove', onMove, { passive: true })
    return () => {
      window.removeEventListener('resize', centre)
      window.removeEventListener('pointerdown', onMove)
      window.removeEventListener('pointermove', onMove)
    }
  }
  window.addEventListener('pointermove', onMove, { passive: true })
  return () => window.removeEventListener('pointermove', onMove)
}
