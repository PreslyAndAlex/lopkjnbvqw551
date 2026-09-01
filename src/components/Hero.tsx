import { useD } from '../lib/useD'

export function Hero() {
  const { d } = useD()
  return (
    <section
      className="section hero"
      id="top"
      data-zone="surface"
      data-from={0}
      data-to={2}
      aria-labelledby="hero-title"
    >
      <div className="wrap">
        <p className="kicker hero__kicker reveal">{d.hero.kicker}</p>
        <h1 className="hero__title reveal" id="hero-title">
          {d.hero.title}
        </h1>
        <p className="hero__lead reveal">{d.hero.lead}</p>

        <div className="hero__actions reveal">
          <a className="btn btn--primary" href="#gear">
            {d.hero.ctaPrimary}
          </a>
          <a className="btn btn--ghost" href="#trips">
            {d.hero.ctaSecondary}
          </a>
        </div>

        <dl className="hero__stats reveal">
          <div className="stat">
            <dt className="stat__label">{d.hero.stats.tempLabel}</dt>
            <dd className="stat__value">{d.hero.stats.temp}</dd>
          </div>
          <div className="stat">
            <dt className="stat__label">{d.hero.stats.visLabel}</dt>
            <dd className="stat__value">{d.hero.stats.vis}</dd>
          </div>
          <div className="stat">
            <dt className="stat__label">{d.hero.stats.swellLabel}</dt>
            <dd className="stat__value">{d.hero.stats.swell}</dd>
          </div>
        </dl>
        <p className="hero__note reveal">{d.hero.note}</p>
      </div>

      <p className="scrollcue" aria-hidden="true">
        <span className="scrollcue__line" />
        {d.hero.scroll}
      </p>
    </section>
  )
}
