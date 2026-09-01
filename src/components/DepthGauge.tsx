import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent, type KeyboardEvent as ReactKeyboardEvent } from 'react'
import { depthState, MAX_DEPTH } from '../lib/depth'
import { ndlAt, waterTempAt, BANDS } from '../lib/optics'
import { scrollMap } from '../lib/scrollMap'
import { scrollToY } from '../lib/scroller'
import { useD } from '../lib/useD'

const TICKS = [0, 10, 20, 30, 40, 50]

type Drag =
  | { mode: 'absolute'; horizontal: boolean }
  | { mode: 'relative'; horizontal: boolean; startDepth: number; startPos: number; railLen: number }

/**
 * Дълбокомерът е над водните слоеве нарочно — уредите светят сами и не губят
 * цвят. Стойностите се пишат директно в DOM-а, без React state: това е 60 пъти
 * в секунда и не бива да пуска рендер.
 *
 * Скалата е и орган за управление: натиснеш и влачиш, и страницата се мести
 * на съответната дълбочина. По скалата влаченето е абсолютно (където хванеш,
 * там отиваш); по останалата част от панела е относително — местиш се със
 * толкова, с колкото си дръпнал. Само с мишка или писалка: на тъч панелът
 * остава прозрачен за скрола на страницата, за да не се заяжда.
 */
export function DepthGauge() {
  const { d } = useD()
  const root = useRef<HTMLDivElement>(null)
  const scale = useRef<HTMLDivElement>(null)
  const value = useRef<HTMLSpanElement>(null)
  const maxRef = useRef<HTMLElement>(null)
  const tempRef = useRef<HTMLElement>(null)
  const ndlRef = useRef<HTMLElement>(null)
  const timeRef = useRef<HTMLElement>(null)
  const drag = useRef<Drag | null>(null)
  const start = useRef(Date.now())
  const [dragging, setDragging] = useState(false)

  useEffect(() => {
    let lastNdl = -1
    let lastTemp = ''
    let lastTime = ''
    let lastAria = -1
    return depthState.onFrame((depth) => {
      const el = root.current
      if (!el) return
      const pct = Math.min(100, (depth / MAX_DEPTH) * 100)
      el.style.setProperty('--p', pct.toFixed(2))
      if (value.current) value.current.textContent = depth.toFixed(1)
      if (maxRef.current) maxRef.current.textContent = depthState.max.toFixed(1)

      const aria = Math.round(depth)
      if (aria !== lastAria && scale.current) {
        scale.current.setAttribute('aria-valuenow', String(aria))
        scale.current.setAttribute('aria-valuetext', `${aria} ${d.hud.m}`)
        lastAria = aria
      }

      const temp = waterTempAt(depth).toFixed(1)
      if (temp !== lastTemp && tempRef.current) {
        tempRef.current.textContent = `${temp}°`
        lastTemp = temp
      }
      const ndl = ndlAt(depth)
      if (ndl !== lastNdl && ndlRef.current) {
        ndlRef.current.textContent = String(ndl)
        lastNdl = ndl
      }
      const secs = Math.floor((Date.now() - start.current) / 1000)
      const stamp = `${String(Math.floor(secs / 60)).padStart(2, '0')}:${String(secs % 60).padStart(2, '0')}`
      if (stamp !== lastTime && timeRef.current) {
        timeRef.current.textContent = stamp
        lastTime = stamp
      }
    })
  }, [d.hud.m])

  const goTo = (depth: number, immediate: boolean) => {
    const clamped = Math.min(Math.max(depth, 0), MAX_DEPTH)
    scrollToY(scrollMap.scrollForDepth(clamped), immediate)
  }

  /**
   * Истинската дълбочина сега — от позицията на скрола, не от изгладената
   * стойност на дисплея. Ако хванеш панела, докато страницата още се движи,
   * плъзгането трябва да тръгне оттам, където си, а не откъдето стрелката
   * още не е стигнала.
   */
  const liveDepth = () => scrollMap.depthAt(window.scrollY)

  const railBox = () => {
    const rect = scale.current?.getBoundingClientRect()
    if (!rect) return null
    const horizontal = rect.width > rect.height
    return { rect, horizontal, len: horizontal ? rect.width : rect.height }
  }

  const depthFromRail = (e: { clientX: number; clientY: number }, horizontal: boolean) => {
    const box = railBox()
    if (!box) return 0
    const f = horizontal
      ? (e.clientX - box.rect.left) / box.rect.width
      : (e.clientY - box.rect.top) / box.rect.height
    return Math.min(Math.max(f, 0), 1) * MAX_DEPTH
  }

  const begin = (e: ReactPointerEvent<HTMLElement>, mode: Drag['mode']) => {
    const box = railBox()
    if (!box) return
    e.currentTarget.setPointerCapture(e.pointerId)
    setDragging(true)
    if (mode === 'absolute') {
      drag.current = { mode, horizontal: box.horizontal }
      goTo(depthFromRail(e, box.horizontal), true)
    } else {
      drag.current = {
        mode,
        horizontal: box.horizontal,
        startDepth: liveDepth(),
        startPos: box.horizontal ? e.clientX : e.clientY,
        railLen: box.len,
      }
    }
  }

  const move = (e: ReactPointerEvent<HTMLElement>) => {
    const state = drag.current
    if (!state) return
    e.preventDefault()
    if (state.mode === 'absolute') {
      goTo(depthFromRail(e, state.horizontal), true)
    } else {
      const pos = state.horizontal ? e.clientX : e.clientY
      const delta = ((pos - state.startPos) / Math.max(state.railLen, 1)) * MAX_DEPTH
      goTo(state.startDepth + delta, true)
    }
  }

  const end = (e: ReactPointerEvent<HTMLElement>) => {
    const state = drag.current
    if (!state) return
    // Последната позиция се прилага и на пускането — ако движението е било
    // изядено от throttling, краят пак е точен.
    if (state.mode === 'absolute') {
      goTo(depthFromRail(e, state.horizontal), true)
    } else {
      const pos = state.horizontal ? e.clientX : e.clientY
      const delta = ((pos - state.startPos) / Math.max(state.railLen, 1)) * MAX_DEPTH
      goTo(state.startDepth + delta, true)
    }
    drag.current = null
    setDragging(false)
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId)
    }
  }

  const onRailKey = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    const step = e.shiftKey ? 5 : 1
    const now = liveDepth()
    let next: number | null = null
    switch (e.key) {
      case 'ArrowDown':
      case 'ArrowRight':
        next = now + step
        break
      case 'ArrowUp':
      case 'ArrowLeft':
        next = now - step
        break
      case 'PageDown':
        next = now + 10
        break
      case 'PageUp':
        next = now - 10
        break
      case 'Home':
        next = 0
        break
      case 'End':
        next = MAX_DEPTH
        break
      default:
        return
    }
    e.preventDefault()
    goTo(next, false)
  }

  return (
    <div
      className="hud gauge"
      ref={root}
      role="group"
      aria-label={d.hud.gauge}
      data-dragging={dragging}
      style={{ ['--p' as string]: 0 }}
      onPointerDown={(e) => {
        // Тъчът остава за скрола на страницата; панелът се влачи с мишка.
        if (e.pointerType === 'touch') return
        if ((e.target as HTMLElement).closest('.gauge__scale')) return
        e.preventDefault()
        begin(e, 'relative')
      }}
      onPointerMove={move}
      onPointerUp={end}
      onPointerCancel={end}
    >
      <div className="gauge__label">{d.hud.depth}</div>
      <p className="gauge__read">
        <span className="gauge__value" ref={value} aria-live="off">
          0.0
        </span>
        <span className="gauge__unit">{d.hud.m}</span>
      </p>

      <div
        className="gauge__scale"
        ref={scale}
        role="slider"
        tabIndex={0}
        aria-label={d.hud.scrub}
        title={d.hud.scrub}
        aria-valuemin={0}
        aria-valuemax={MAX_DEPTH}
        aria-valuenow={0}
        aria-orientation="vertical"
        onPointerDown={(e) => {
          e.preventDefault()
          begin(e, 'absolute')
        }}
        onPointerMove={move}
        onPointerUp={end}
        onPointerCancel={end}
        onKeyDown={onRailKey}
      >
        {TICKS.map((t) => {
          const band = BANDS.find((b) => Math.abs(b.dies - t) < 3)
          return (
            <div
              key={t}
              className="gauge__tick"
              aria-hidden="true"
              style={{ ['--t' as string]: (t / MAX_DEPTH) * 100 }}
            >
              {t}
              {band ? <span>{d.bands[band.key]}</span> : null}
            </div>
          )
        })}
        <div className="gauge__marker" aria-hidden="true" />
      </div>

      <div className="gauge__rows">
        <p className="gauge__row">
          <span>{d.hud.max}</span>
          <b ref={maxRef}>0.0</b>
        </p>
        <p className="gauge__row">
          <span>{d.hud.temp}</span>
          <b ref={tempRef}>24.5°</b>
        </p>
        <p className="gauge__row">
          <span>{d.hud.ndl}</span>
          <b>
            <i ref={ndlRef} style={{ fontStyle: 'normal' }}>
              219
            </i>{' '}
            {d.hud.min}
          </b>
        </p>
        <p className="gauge__row">
          <span>{d.hud.time}</span>
          <b ref={timeRef}>00:00</b>
        </p>
      </div>
    </div>
  )
}
