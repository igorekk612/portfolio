import { useEffect } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { SHOP } from '../config'
import { CATEGORIES, filament, light, pln, product, variant } from '../lib/catalog'
import { useCart } from '../state/cart'

function Notice() {
  const d = new Date(SHOP.christmasDeadline + 'T23:59:59')
  if (Date.now() > d.getTime()) return null
  const day = d.toLocaleDateString('pl-PL', { day: 'numeric', month: 'long' })
  return (
    <div className="notice"><div className="wrap">
      <span><b>Prezent na święta:</b> zamówienia z dostawą przed Wigilią przyjmujemy do {day}.</span>
    </div></div>
  )
}

function Header() {
  const { count, setOpen } = useCart()
  return (
    <header className="top"><div className="wrap">
      <Link to="/" className="logo" aria-label={`${SHOP.name}, strona główna`}>
        <span className="logo-mark" aria-hidden="true"><i /><i /><i /></span>{SHOP.name}
      </Link>
      <nav className="nav" aria-label="Menu">
        <NavLink to="/katalog">Katalog</NavLink>
        <NavLink to="/#jak">Jak to działa</NavLink>
        <NavLink to="/#pytania">Pytania</NavLink>
      </nav>
      <button className="cart-btn" type="button" onClick={() => setOpen(true)} aria-label={`Koszyk, ${count} szt.`}>
        Koszyk <span className="count tnum">{count}</span>
      </button>
    </div></header>
  )
}

export function Swatch({ hex, label }: { hex: string; label?: string }) {
  return <span className="dot" style={{ background: hex }} title={label} />
}

function CartDrawer() {
  const { open, setOpen, items, products, setQty, remove, subtotal, price } = useCart()
  const nav = useNavigate()
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, setOpen])
  if (!open) return null
  return (
    <>
      <div className="drawer-bg" onClick={() => setOpen(false)} />
      <aside className="drawer" role="dialog" aria-modal="true" aria-label="Koszyk">
        <header><h2>Koszyk</h2><button className="icon-btn" onClick={() => setOpen(false)} aria-label="Zamknij koszyk">×</button></header>
        <div className="items">
          {items.length === 0 ? (
            <div className="empty">
              <p>Koszyk jest pusty. Wybierz produkt i wpisz nick, który mamy wydrukować.</p>
              <button className="btn ghost" onClick={() => { setOpen(false); nav('/produkt/uchwyt') }}>Personalizuj uchwyt</button>
            </div>
          ) : items.map(i => {
            const p = product(i.productId, products); const b = filament(i.base); const t = filament(i.text)
            return (
              <div className="line" key={i.key}>
                <div className="chip" style={{ background: b.hex, color: light(i.light)?.hex ?? t.hex, textShadow: i.light ? `0 0 8px ${light(i.light)!.hex}` : undefined }}>{i.nick.slice(0, 4)}</div>
                <div>
                  <h4>{p.name}{p.variants.length > 1 ? ` · ${variant(p, i.variant)?.name}` : ''}</h4>
                  <div className="meta">Nick: <b>{i.nick}</b></div>
                  <div className="meta"><Swatch hex={b.hex} /> {b.name} · {light(i.light) ? <><Swatch hex={light(i.light)!.hex} /> świecący napis, {light(i.light)!.name.toLowerCase()}</> : <><Swatch hex={t.hex} /> napis {t.name.toLowerCase()}</>}</div>
                  <div className="qty">
                    <button onClick={() => setQty(i.key, i.qty - 1)} aria-label="Mniej">−</button>
                    <span>{i.qty}</span>
                    <button onClick={() => setQty(i.key, i.qty + 1)} aria-label="Więcej">+</button>
                  </div>
                </div>
                <div style={{ textAlign: 'right', display: 'grid', gap: 6 }}>
                  <b className="tnum">{pln(price(i) * i.qty)}</b>
                  <button className="link" onClick={() => remove(i.key)}>Usuń</button>
                </div>
              </div>
            )
          })}
        </div>
        {items.length > 0 && (
          <footer>
            <div className="sum"><span className="muted">Produkty</span><span>{pln(subtotal)}</span></div>
            <div className="sum"><span className="muted">Dostawa do paczkomatu</span><span>{pln(SHOP.shippingPln)}</span></div>
            <div className="sum total"><span>Razem</span><span>{pln(subtotal + SHOP.shippingPln)}</span></div>
            <button className="btn block" onClick={() => { setOpen(false); nav('/zamowienie') }}>Przejdź do zamówienia</button>
          </footer>
        )}
      </aside>
    </>
  )
}

function Footer() {
  return (
    <footer className="foot"><div className="wrap">
      <div style={{ display: 'grid', gap: 8 }}>
        <Link to="/" className="logo" style={{ fontSize: 18 }}><span className="logo-mark" aria-hidden="true"><i /><i /><i /></span>{SHOP.name}</Link>
        <p>Personalizowane wydruki 3D dla graczy. Każdy produkt drukujemy na zamówienie.</p>
        <p>Kontakt: <span style={{ userSelect: 'all' }}>{SHOP.email}</span></p>
      </div>
      <div><h4>Katalog</h4>{CATEGORIES.map(c => <Link key={c.id} to={`/katalog/${c.id}`}>{c.name}</Link>)}</div>
      <div><h4>Informacje</h4><Link to="/regulamin">Regulamin</Link><Link to="/prywatnosc">Polityka prywatności</Link><Link to="/admin">Panel sklepu</Link></div>
    </div></footer>
  )
}

function ScrollManager() {
  const { pathname, hash } = useLocation()
  const { setOpen } = useCart()
  useEffect(() => { setOpen(false) }, [pathname, setOpen])
  useEffect(() => {
    if (hash) {
      const el = document.getElementById(hash.slice(1))
      if (el) { el.scrollIntoView({ block: 'start' }); return }
    }
    window.scrollTo(0, 0)
  }, [pathname, hash])
  return null
}

export default function Layout() {
  return (
    <>
      <ScrollManager />
      <Notice />
      <Header />
      <main><Outlet /></main>
      <Footer />
      <CartDrawer />
    </>
  )
}
