import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Swatch } from '../components/Layout'
import { IS_DEMO, SHOP } from '../config'
import { startCheckout, type Customer } from '../lib/api'
import { filament, light, pln, product, variant } from '../lib/catalog'
import { useCart } from '../state/cart'

const LOCKER_RE = /^[A-Z]{3}\d{2,3}[A-Z]{0,2}$/

export default function Checkout() {
  const { items, products, subtotal, clear, price } = useCart()
  const nav = useNavigate()
  const [c, setC] = useState<Customer>({ name: '', email: '', phone: '', locker: '', notes: '' })
  const [agree, setAgree] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [touched, setTouched] = useState(false)
  const set = (k: keyof Customer) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setC({ ...c, [k]: e.target.value })

  const problems: Partial<Record<keyof Customer | 'agree', string>> = {}
  if (c.name.trim().length < 3) problems.name = 'Podaj imię i nazwisko.'
  if (!/^\S+@\S+\.\S+$/.test(c.email)) problems.email = 'Podaj adres e-mail, na który wyślemy potwierdzenie.'
  if (c.phone.replace(/\D/g, '').length < 9) problems.phone = 'Podaj numer telefonu (InPost wysyła na niego kod odbioru).'
  if (!LOCKER_RE.test(c.locker.trim().toUpperCase())) problems.locker = 'Podaj kod paczkomatu, np. KRA01M. Znajdziesz go na mapie InPost.'
  if (!agree) problems.agree = 'Zaakceptuj regulamin, żeby złożyć zamówienie.'

  if (!items.length) {
    return (
      <div className="page"><div className="wrap center-card">
        <h1>Koszyk jest pusty</h1>
        <p className="muted">Wybierz produkt i wpisz nick, który mamy wydrukować.</p>
        <Link className="btn" to="/produkt/uchwyt">Personalizuj uchwyt</Link>
      </div></div>
    )
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setTouched(true); setError('')
    if (Object.keys(problems).length) return
    setBusy(true)
    const res = await startCheckout(items, { ...c, locker: c.locker.trim().toUpperCase() })
    setBusy(false)
    if (res.kind === 'redirect') { window.location.href = res.url; return }
    if (res.kind === 'demo') { clear(); nav('/dziekujemy?demo=1'); return }
    setError(res.message)
  }
  const err = (k: keyof typeof problems) => touched && problems[k] ? <span className="hint err">{problems[k]}</span> : null

  return (
    <div className="wrap checkout">
      <form className="panel" onSubmit={submit} noValidate>
        <span className="eyebrow">Zamówienie</span>
        <h2>Dane do wysyłki</h2>
        {IS_DEMO && <div className="alert info">Sklep działa w trybie demo: zamówienie nie zostanie zapisane, a płatność nie zostanie pobrana.</div>}
        <div className="field"><label htmlFor="name">Imię i nazwisko</label><input id="name" type="text" autoComplete="name" value={c.name} onChange={set('name')} />{err('name')}</div>
        <div className="grid2">
          <div className="field"><label htmlFor="email">E-mail</label><input id="email" type="email" autoComplete="email" value={c.email} onChange={set('email')} />{err('email')}</div>
          <div className="field"><label htmlFor="phone">Telefon</label><input id="phone" type="tel" autoComplete="tel" value={c.phone} onChange={set('phone')} />{err('phone')}</div>
        </div>
        <div className="field">
          <label htmlFor="locker">Kod paczkomatu InPost</label>
          <input id="locker" type="text" placeholder="np. KRA01M" value={c.locker} onChange={set('locker')} style={{ textTransform: 'uppercase' }} />
          {err('locker') ?? <span className="hint">Kod znajdziesz na <a href="https://inpost.pl/znajdz-paczkomat" target="_blank" rel="noreferrer">mapie paczkomatów InPost</a>.</span>}
        </div>
        <div className="field"><label htmlFor="notes">Uwagi do zamówienia (opcjonalnie)</label><textarea id="notes" value={c.notes} onChange={set('notes')} maxLength={500} /></div>
        <label className="check"><input id="agree" type="checkbox" checked={agree} onChange={e => setAgree(e.target.checked)} />
          <span>Akceptuję <Link to="/regulamin" target="_blank">regulamin</Link> i wiem, że produkty są wykonywane na zamówienie z podanym nickiem.</span></label>
        {err('agree')}
        {error && <div className="alert err" role="alert">{error}</div>}
        <button className="btn block" type="submit" disabled={busy}>{busy ? 'Przekierowuję do płatności…' : `Zamawiam i płacę ${pln(subtotal + SHOP.shippingPln)}`}</button>
        <span className="hint" style={{ textAlign: 'center' }}>Płatność BLIK, Przelewy24 lub kartą przez Stripe.</span>
      </form>

      <aside className="panel">
        <h2>Twoje produkty</h2>
        <div>
          {items.map(i => {
            const p = product(i.productId, products); const b = filament(i.base); const t = filament(i.text)
            return (
              <div className="line" key={i.key}>
                <div className="chip" style={{ background: b.hex, color: light(i.light)?.hex ?? t.hex, textShadow: i.light ? `0 0 8px ${light(i.light)!.hex}` : undefined }}>{i.nick.slice(0, 4)}</div>
                <div><h4>{p.name}{p.variants.length > 1 ? ` · ${variant(p, i.variant)?.name}` : ''} × {i.qty}</h4><div className="meta">Nick: <b>{i.nick}</b></div>
                  <div className="meta"><Swatch hex={b.hex} /> {b.name} · {light(i.light) ? <><Swatch hex={light(i.light)!.hex} /> świecący napis, {light(i.light)!.name.toLowerCase()}</> : <><Swatch hex={t.hex} /> napis {t.name.toLowerCase()}</>}</div></div>
                <b className="tnum">{pln(price(i) * i.qty)}</b>
              </div>
            )
          })}
        </div>
        <div className="sum"><span className="muted">Produkty</span><span>{pln(subtotal)}</span></div>
        <div className="sum"><span className="muted">Dostawa do paczkomatu</span><span>{pln(SHOP.shippingPln)}</span></div>
        <div className="sum total"><span>Razem</span><span>{pln(subtotal + SHOP.shippingPln)}</span></div>
      </aside>
    </div>
  )
}
