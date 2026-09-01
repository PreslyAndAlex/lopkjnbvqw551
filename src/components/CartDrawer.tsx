import { useEffect, useRef } from 'react'
import { PRODUCTS, priceFmt } from '../data/catalog'
import { cartCount, cartTotal, useCart } from '../lib/store'
import { useD } from '../lib/useD'
import { KitArt } from './KitArt'

export function CartDrawer() {
  const { d, lang } = useD()
  const { items, open, submitted, setOpen, setQty, submit, reset } = useCart()
  const panel = useRef<HTMLDivElement>(null)
  const closeBtn = useRef<HTMLButtonElement>(null)

  // `inert` се задава директно на елемента: React все още предупреждава за
  // булеви атрибути с празна стойност, а сайтът не бива да пише в конзолата.
  useEffect(() => {
    if (panel.current) panel.current.inert = !open
  }, [open])

  useEffect(() => {
    if (!open) return
    closeBtn.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
      if (e.key !== 'Tab' || !panel.current) return
      const focusables = panel.current.querySelectorAll<HTMLElement>(
        'button, [href], input, textarea, select, [tabindex]:not([tabindex="-1"])',
      )
      if (focusables.length === 0) return
      const first = focusables[0]
      const last = focusables[focusables.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, setOpen])

  const total = cartTotal(items)
  const count = cartCount(items)

  return (
    <>
      <div className="drawer__scrim" data-open={open} onClick={() => setOpen(false)} aria-hidden="true" />
      <aside
        className="drawer"
        data-open={open}
        ref={panel}
        role="dialog"
        aria-modal={open}
        aria-label={d.cart.title}
        aria-hidden={!open}
      >
        <header className="drawer__head">
          <h2 className="drawer__title">{d.cart.title}</h2>
          <span className="kicker">
            {count} {count === 1 ? d.cart.item : d.cart.items}
          </span>
          <button
            type="button"
            className="tool"
            ref={closeBtn}
            onClick={() => setOpen(false)}
            aria-label={d.nav.close}
          >
            ✕
          </button>
        </header>

        {submitted ? (
          <div className="drawer__done">
            <h3>{d.cart.done}</h3>
            <p>{d.cart.doneNote}</p>
            <button
              type="button"
              className="btn btn--ghost"
              onClick={() => {
                reset()
                setOpen(false)
              }}
            >
              {d.cart.continue}
            </button>
          </div>
        ) : (
          <>
            <div className="drawer__list">
              {items.length === 0 ? (
                <p className="drawer__empty">{d.cart.empty}</p>
              ) : (
                items.map((line) => {
                  const p = PRODUCTS.find((x) => x.id === line.id)
                  if (!p) return null
                  return (
                    <div className="line" key={line.id}>
                      <div className="line__art">
                        <KitArt id={p.id} accent={p.accent} />
                      </div>
                      <div className="line__main">
                        <p className="line__name">{d.products[p.id].name}</p>
                        <p className="line__meta">
                          {p.sku} · {p.depth} {d.hud.m} {d.cart.ratedAt}
                        </p>
                        <div className="qty">
                          <button
                            type="button"
                            onClick={() => setQty(p.id, line.qty - 1)}
                            aria-label={d.cart.less}
                          >
                            −
                          </button>
                          <span>{line.qty}</span>
                          <button
                            type="button"
                            onClick={() => setQty(p.id, line.qty + 1)}
                            aria-label={d.cart.more}
                          >
                            +
                          </button>
                        </div>
                      </div>
                      <div className="line__side">
                        <span className="line__price">{priceFmt(p.price * line.qty, lang)}</span>
                        <button
                          type="button"
                          className="line__meta"
                          style={{ background: 'none', border: 0, cursor: 'pointer', padding: 0 }}
                          onClick={() => setQty(p.id, 0)}
                        >
                          {d.cart.remove}
                        </button>
                      </div>
                    </div>
                  )
                })
              )}
            </div>

            <div className="drawer__foot">
              <p className="drawer__total">
                <span>{d.cart.total}</span>
                <b>{priceFmt(total, lang)}</b>
              </p>
              <button
                type="button"
                className="btn btn--primary btn--block"
                disabled={items.length === 0}
                onClick={submit}
              >
                {d.cart.checkout}
              </button>
              <p className="drawer__demo">{d.cart.demo}</p>
            </div>
          </>
        )}
      </aside>
    </>
  )
}
