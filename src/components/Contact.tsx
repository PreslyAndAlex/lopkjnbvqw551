import { useState, type FormEvent } from 'react'
import { useD } from '../lib/useD'

type Errors = { name?: string; email?: string; message?: string }

export function Contact() {
  const { d } = useD()
  const [errors, setErrors] = useState<Errors>({})
  const [sent, setSent] = useState(false)

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    const name = String(form.get('name') ?? '').trim()
    const email = String(form.get('email') ?? '').trim()
    const message = String(form.get('message') ?? '').trim()
    const next: Errors = {}
    if (!name) next.name = d.contact.required
    if (!email) next.email = d.contact.required
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) next.email = d.contact.invalidEmail
    if (!message) next.message = d.contact.required
    setErrors(next)
    if (Object.keys(next).length === 0) {
      setSent(true)
      e.currentTarget.reset()
    }
  }

  return (
    <div className="contact">
      <form onSubmit={onSubmit} noValidate>
        <div className="field">
          <label htmlFor="cf-name">{d.contact.name}</label>
          <input id="cf-name" name="name" autoComplete="name" aria-invalid={!!errors.name} />
          {errors.name && <span className="field__error">{errors.name}</span>}
        </div>
        <div className="field">
          <label htmlFor="cf-email">{d.contact.email}</label>
          <input
            id="cf-email"
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            aria-invalid={!!errors.email}
          />
          {errors.email && <span className="field__error">{errors.email}</span>}
        </div>
        <div className="field">
          <label htmlFor="cf-msg">{d.contact.message}</label>
          <textarea
            id="cf-msg"
            name="message"
            placeholder={d.contact.messagePlaceholder}
            aria-invalid={!!errors.message}
          />
          {errors.message && <span className="field__error">{errors.message}</span>}
        </div>
        <button type="submit" className="btn btn--primary btn--block">
          {d.contact.send}
        </button>
        <p className="notice" role="status" style={{ marginTop: '0.8rem' }}>
          {sent ? d.contact.sent : ''}
        </p>
      </form>

      <dl className="info">
        <div className="info__row">
          <dt>{d.contact.label}</dt>
          <dd>
            <a href={`tel:${d.contact.phone.replace(/\s/g, '')}`}>{d.contact.phone}</a>
          </dd>
          <dd>
            <a href={`mailto:${d.contact.mail}`}>{d.contact.mail}</a>
          </dd>
        </div>
        <div className="info__row">
          <dt>{d.brand.tagline}</dt>
          <dd>{d.contact.address}</dd>
        </div>
        <div className="info__row" style={{ borderBottom: 0 }}>
          <dt>{d.hud.time}</dt>
          <dd>{d.contact.hours}</dd>
        </div>
      </dl>
    </div>
  )
}
