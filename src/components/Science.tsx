import { useEffect, useRef } from 'react'
import { ADAPTATION_GAMMA, BANDS, opticsAt } from '../lib/optics'
import { depthState } from '../lib/depth'
import { useD } from '../lib/useD'

const BAND_COLOR: Record<string, string> = {
  red: '#ff3b23',
  orange: '#ff8a1f',
  yellow: '#ffd21f',
  green: '#4bd94b',
  blue: '#35c6f4',
}

/**
 * Живата версия на модела. Числата в таблицата са същите, които в момента
 * управляват слоевете над страницата — не са картинка.
 */
export function Science() {
  const { d } = useD()
  const depthRef = useRef<HTMLSpanElement>(null)
  const vals = useRef<(HTMLElement | null)[]>([])
  const bars = useRef<(HTMLElement | null)[]>([])

  useEffect(() => {
    let last = -1
    return depthState.onFrame((depth) => {
      const rounded = Math.round(depth * 2) / 2
      if (rounded === last) return
      last = rounded
      const o = opticsAt(rounded)
      if (depthRef.current) depthRef.current.textContent = rounded.toFixed(1)
      for (let i = 0; i < BANDS.length; i++) {
        const t = o.bands[i] / Math.max(o.bands[4], 1e-6)
        const pct = Math.min(100, t * 100)
        const val = vals.current[i]
        const bar = bars.current[i]
        if (val) {
          val.textContent =
            pct >= 10 ? `${Math.round(pct)}%` : pct >= 1 ? `${pct.toFixed(1)}%` : `${pct.toFixed(2)}%`
        }
        if (bar) bar.style.width = `${Math.max(pct, 0).toFixed(2)}%`
      }
    })
  }, [])

  return (
    <div className="science reveal">
      <h3 className="kicker">{d.science.title}</h3>
      <p className="science__note">{d.science.intro}</p>
      <p className="science__formula mono">T(λ, d) = e^(−Kd(λ) · (2d + 3))</p>

      <table className="science__table">
        <caption className="science__note" style={{ captionSide: 'top', textAlign: 'left', paddingBottom: '0.5rem' }}>
          {d.science.at} <span ref={depthRef}>0.0</span> {d.hud.m}
        </caption>
        <thead>
          <tr>
            <th>{d.science.cols.band}</th>
            <th>{d.science.cols.nm}</th>
            <th>{d.science.cols.k}</th>
            <th>{d.science.cols.t}</th>
          </tr>
        </thead>
        <tbody>
          {BANDS.map((b, i) => (
            <tr key={b.key}>
              <td>
                <span className="science__swatch" style={{ background: BAND_COLOR[b.key] }} />
                {d.bands[b.key]}
              </td>
              <td>{b.nm}</td>
              <td>{b.k.toFixed(3)}</td>
              <td>
                <span className="science__cell">
                  <span className="science__bar">
                    <i
                      ref={(el) => {
                        bars.current[i] = el
                      }}
                      style={{ width: '100%', background: BAND_COLOR[b.key] }}
                    />
                  </span>
                  <span
                    className="science__val"
                    ref={(el) => {
                      vals.current[i] = el
                    }}
                  >
                    100%
                  </span>
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <p className="science__note">{d.science.note}</p>
      <p className="science__note mono" style={{ fontSize: 'var(--step--2)' }}>
        γ<sub>adapt</sub> = {ADAPTATION_GAMMA.toFixed(2)} · Jerlov I–II · L = 2d + 3 m
      </p>
    </div>
  )
}
