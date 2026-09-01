import { useEffect, useRef, type ReactNode } from 'react'
import { ZONES, depthState, type ZoneId } from '../lib/depth'
import { BANDS, opticsAt, scaleHex } from '../lib/optics'
import { useD } from '../lib/useD'

/** Истинските цветове на петте ленти при пълна светлина. */
const BAND_COLOR: Record<string, string> = {
  red: '#ff2f18',
  orange: '#ff8a1f',
  yellow: '#ffd21f',
  green: '#3ee03e',
  blue: '#2fb8ff',
}

/**
 * Спектралната лента е уред, не украса: стои над водните слоеве и се захранва
 * директно от предаването по ленти. Затова показва истината — червеното пада
 * под един процент на пет метра, а не приблизението на трите sRGB канала.
 */
export function Spectrum() {
  const { d } = useD()
  const chips = useRef<(HTMLElement | null)[]>([])
  const pcts = useRef<(HTMLElement | null)[]>([])

  useEffect(() => {
    let last = -1
    return depthState.onFrame((depth) => {
      const rounded = Math.round(depth * 4) / 4
      if (rounded === last) return
      last = rounded
      const o = opticsAt(rounded)
      const blue = Math.max(o.bands[4], 1e-6)
      for (let i = 0; i < BANDS.length; i++) {
        const t = Math.min(1, o.bands[i] / blue)
        const chip = chips.current[i]
        if (chip) chip.style.background = scaleHex(BAND_COLOR[BANDS[i].key], t)
        const pct = pcts.current[i]
        if (pct) {
          const v = t * 100
          pct.textContent = v >= 10 ? `${Math.round(v)}%` : v >= 1 ? `${v.toFixed(1)}%` : `${v.toFixed(2)}%`
        }
      }
    })
  }, [])

  return (
    <ul className="spectrum reveal">
      {BANDS.map((b, i) => (
        <li className="spectrum__band" key={b.key}>
          <span
            className="spectrum__chip"
            ref={(el) => {
              chips.current[i] = el
            }}
            style={{ background: BAND_COLOR[b.key] }}
          />
          <span className="spectrum__name">
            <b className="spectrum__word">{d.bands[b.key]} · </b>
            {b.nm}
          </span>
          <span
            className="spectrum__pct"
            ref={(el) => {
              pcts.current[i] = el
            }}
          >
            100%
          </span>
        </li>
      ))}
    </ul>
  )
}

type Props = {
  id: Exclude<ZoneId, 'surface'>
  anchor?: string
  spectrum?: boolean
  children?: ReactNode
}

export function Zone({ id, anchor, spectrum, children }: Props) {
  const { d } = useD()
  const zone = ZONES.find((z) => z.id === id)!
  const copy = d.zones[id]
  const lo = Math.min(zone.from, zone.to)
  const hi = Math.max(zone.from, zone.to)

  return (
    <section
      className="section section--tall"
      id={anchor}
      data-zone={id}
      data-from={zone.from}
      data-to={zone.to}
      aria-labelledby={`zone-${id}`}
    >
      <div className="wrap zone">
        <header className="zone__head">
          <p className="zone__meta reveal">
            <span className="zone__index">{zone.index}</span>
            <span className="zone__label">{copy.label}</span>
            <span className="zone__rule" />
            <span className="zone__depth">
              {lo}–{hi} {d.hud.m}
            </span>
          </p>
          <h2 className="zone__title reveal" id={`zone-${id}`}>
            {copy.title}
          </h2>
          <p className="zone__body reveal">{copy.body}</p>
          {copy.note ? (
            <span className="zone__note reveal">
              <i />
              {copy.note}
            </span>
          ) : null}
          {copy.hint ? <p className="zone__hint reveal">{copy.hint}</p> : null}
        </header>

        {spectrum ? <Spectrum /> : null}
        {children}
      </div>
    </section>
  )
}
