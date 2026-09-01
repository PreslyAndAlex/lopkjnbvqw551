import { COURSES, PRODUCTS, TRIPS, priceFmt, type ProductId } from '../data/catalog'
import { useCart } from '../lib/store'
import { useD } from '../lib/useD'

type Row = {
  key: string
  depth: number
  kind: 'gear' | 'trip' | 'course'
  name: string
  price: number
  id?: ProductId
}

/**
 * Дневникът на гмуркането: всичко, покрай което си минал, подредено по
 * дълбочина. Стои на изплуването, защото точно там човек си спомня какво е
 * видял — и защото оттук може да се поръча, без да се слиза пак.
 */
export function DiveLog() {
  const { d, lang } = useD()
  const add = useCart((s) => s.add)
  const setOpen = useCart((s) => s.setOpen)

  const rows: Row[] = [
    ...PRODUCTS.map((p) => ({
      key: `g-${p.id}`,
      depth: p.depth,
      kind: 'gear' as const,
      name: d.products[p.id].name,
      price: p.price,
      id: p.id,
    })),
    ...TRIPS.map((t) => ({
      key: `t-${t.id}`,
      depth: t.depth,
      kind: 'trip' as const,
      name: d.trips.items[t.id].name,
      price: t.price,
    })),
    ...COURSES.map((c) => ({
      key: `c-${c.id}`,
      depth: c.depth,
      kind: 'course' as const,
      name: d.courses.items[c.id].name,
      price: c.price,
    })),
  ].sort((a, b) => a.depth - b.depth || a.name.localeCompare(b.name, lang))

  return (
    <div className="log reveal">
      <div className="log__head">
        <h3 className="log__title">{d.log.title}</h3>
        <p className="log__lead">{d.log.lead}</p>
      </div>
      <ul className="log__list">
        {rows.map((r) => (
          <li className="log__row" key={r.key} data-kind={r.kind}>
            <span className="log__depth">
              {String(r.depth).padStart(2, '0')}
              <small>{d.hud.m}</small>
            </span>
            <span className="log__name">{r.name}</span>
            <span className="log__kind">{d.log.kinds[r.kind]}</span>
            <span className="log__price">{priceFmt(r.price, lang)}</span>
            {r.id ? (
              <button
                type="button"
                className="log__add"
                onClick={() => {
                  add(r.id as ProductId)
                  setOpen(true)
                }}
              >
                {d.log.add}
              </button>
            ) : (
              <a className="log__add" href="#contact">
                {d.trips.book}
              </a>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}
