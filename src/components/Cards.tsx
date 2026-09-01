import { useEffect, useRef, useState } from 'react'
import {
  COURSES,
  PRODUCTS,
  TRIPS,
  priceFmt,
  type CourseId,
  type ProductId,
  type TripId,
} from '../data/catalog'
import { useCart } from '../lib/store'
import { useD } from '../lib/useD'
import { KitArt } from './KitArt'

export function KitCard({ id }: { id: ProductId }) {
  const p = PRODUCTS.find((x) => x.id === id)!
  const { d, lang } = useD()
  const copy = d.products[id]
  const add = useCart((s) => s.add)
  const [added, setAdded] = useState(false)
  const timer = useRef<number>(0)

  useEffect(() => () => window.clearTimeout(timer.current), [])

  const onAdd = () => {
    add(id)
    setAdded(true)
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setAdded(false), 1600)
  }

  return (
    <article className="kit reveal">
      <div className="kit__art">
        <KitArt id={id} accent={p.accent} />
        <p className="kit__depth" title={d.a11y.productDepth}>
          {p.depth}
          <small>{d.hud.m}</small>
        </p>
        {p.badge ? <span className="kit__badge">{d.shop.badges[p.badge]}</span> : null}
      </div>

      <div className="kit__body">
        <p className="kit__cat">{d.shop.categories[p.category]}</p>
        <h3 className="kit__name">{copy.name}</h3>
        <p className="kit__tagline">{copy.tagline}</p>
        <p className="kit__desc">{copy.desc}</p>
        <ul className="kit__specs">
          {copy.specs.map((s) => (
            <li key={s}>{s}</li>
          ))}
          <li>
            {d.shop.sku} {p.sku}
          </li>
        </ul>
      </div>

      <div className="kit__foot">
        <span className="kit__price">{priceFmt(p.price, lang)}</span>
        <button type="button" className="kit__add" data-added={added} onClick={onAdd}>
          {added ? d.shop.added : d.shop.add}
        </button>
      </div>
    </article>
  )
}

export function TripCard({ id }: { id: TripId }) {
  const t = TRIPS.find((x) => x.id === id)!
  const { d, lang } = useD()
  const copy = d.trips.items[id]

  return (
    <article className="trip reveal">
      <p className="trip__depth">
        <b>{t.depth}</b>
        <span>{d.hud.m}</span>
      </p>
      <div className="trip__main">
        <p className="trip__site">{copy.site}</p>
        <h3 className="trip__name">{copy.name}</h3>
        <p className="trip__desc">{copy.desc}</p>
        <p className="trip__facts">
          <span className="trip__fact">
            {d.trips.cert} <b>{t.cert}</b>
          </span>
          <span className="trip__fact">
            {d.trips.duration} <b>{t.duration}</b>
          </span>
          <span className="trip__fact">
            <b>{t.dives}</b> {t.dives === 1 ? d.trips.dive : d.trips.dives}
          </span>
        </p>
      </div>
      <div className="trip__side">
        <span className="trip__price">{priceFmt(t.price, lang)}</span>
        <span className="trip__per">{d.trips.perPerson}</span>
        <a className="btn btn--ghost" href="#contact">
          {d.trips.book}
        </a>
      </div>
    </article>
  )
}

export function CourseCard({ id }: { id: CourseId }) {
  const c = COURSES.find((x) => x.id === id)!
  const { d, lang } = useD()
  const copy = d.courses.items[id]

  return (
    <article className="course reveal">
      <p className="course__depth">
        {d.courses.maxDepth} {c.depth} {d.hud.m}
      </p>
      <h3 className="course__name">{copy.name}</h3>
      <p className="course__desc">{copy.desc}</p>
      <p className="course__facts">
        <span>
          {c.days} {d.courses.days}
        </span>
        <span>
          {c.dives} {d.courses.dives}
        </span>
      </p>
      <div className="course__foot">
        <span className="course__price">{priceFmt(c.price, lang)}</span>
        <a className="btn btn--ghost" href="#contact">
          {d.courses.enroll}
        </a>
      </div>
    </article>
  )
}
