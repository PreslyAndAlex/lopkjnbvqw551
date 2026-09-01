import { useD } from '../lib/useD'

export function Footer() {
  const { d } = useD()
  const year = new Date().getFullYear()
  return (
    <footer className="footer">
      <div className="wrap">
        <div className="footer__grid">
          <div>
            <p className="kicker" style={{ marginBottom: '0.6rem' }}>
              {d.brand.name}
            </p>
            <p className="footer__demo">{d.contact.address}</p>
            <p className="footer__demo">
              <a href={`tel:${d.contact.phone.replace(/\s/g, '')}`}>{d.contact.phone}</a>
              {' · '}
              <a href={`mailto:${d.contact.mail}`}>{d.contact.mail}</a>
            </p>
          </div>
          <div>
            <p className="kicker" style={{ marginBottom: '0.6rem' }}>
              {d.nav.menu}
            </p>
            <p className="footer__demo">
              <a href="#gear">{d.nav.gear}</a> · <a href="#trips">{d.nav.trips}</a> ·{' '}
              <a href="#courses">{d.nav.courses}</a> · <a href="#contact">{d.nav.contact}</a>
            </p>
          </div>
          <div>
            <p className="kicker" style={{ marginBottom: '0.6rem' }}>
              {d.footer.demoTitle}
            </p>
            <p className="footer__demo">{d.footer.demo}</p>
          </div>
        </div>

        <div className="footer__bar">
          <span>
            © {year} {d.brand.name}. {d.footer.rights}
          </span>
          <span>{d.footer.colophon}</span>
          <span>
            {d.footer.built}{' '}
            <a href="https://apdigital.bg" rel="noreferrer noopener" target="_blank">
              A&amp;P Digital
            </a>
          </span>
        </div>
      </div>
    </footer>
  )
}
