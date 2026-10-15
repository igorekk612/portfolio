import { useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { SHOP } from '../config'
import { useCart } from '../state/cart'

export function Success() {
  const [q] = useSearchParams()
  const { clear } = useCart()
  const demo = q.get('demo') === '1'
  useEffect(() => { clear() }, [clear])
  return (
    <div className="page"><div className="wrap center-card">
      <span className="eyebrow">{demo ? 'Tryb demo' : 'Płatność przyjęta'}</span>
      <h1>Dziękujemy za zamówienie</h1>
      <p className="muted">
        {demo
          ? 'To była próba w trybie demo. Zamówienie nie zostało zapisane i nic nie zostało pobrane z konta.'
          : 'Potwierdzenie wysłaliśmy na Twój e-mail. Druk zaczynamy po zaksięgowaniu płatności, a numer przesyłki dostaniesz, gdy paczka wyjdzie.'}
      </p>
      <Link className="btn ghost" to="/">Wróć do sklepu</Link>
    </div></div>
  )
}

export function Cancelled() {
  return (
    <div className="page"><div className="wrap center-card">
      <h1>Płatność przerwana</h1>
      <p className="muted">Nic nie zostało pobrane. Twój koszyk czeka, możesz wrócić do zamówienia.</p>
      <Link className="btn" to="/zamowienie">Wróć do zamówienia</Link>
    </div></div>
  )
}

export function NotFound() {
  return (
    <div className="page"><div className="wrap center-card">
      <h1>Nie ma takiej strony</h1>
      <Link className="btn ghost" to="/">Wróć do sklepu</Link>
    </div></div>
  )
}

// Treść regulaminu i polityki prywatności musi uzupełnić właściciel sklepu przed startem sprzedaży.
export function Legal({ kind }: { kind: 'regulamin' | 'prywatnosc' }) {
  const title = kind === 'regulamin' ? 'Regulamin sklepu' : 'Polityka prywatności'
  return (
    <div className="page"><div className="wrap legal">
      <span className="eyebrow">{SHOP.name}</span>
      <h1 style={{ fontSize: 'clamp(30px,4vw,44px)', marginTop: 8 }}>{title}</h1>
      <div className="alert info" style={{ marginTop: 20, maxWidth: 720 }}>
        Ta strona czeka na treść. Przed startem sprzedaży uzupełnij {kind === 'regulamin' ? 'regulamin' : 'politykę prywatności'} (dane sprzedawcy, zasady zwrotów i reklamacji dla produktów personalizowanych, dostawa, płatności).
      </div>
      <p style={{ marginTop: 20 }}>Kontakt: {SHOP.email}</p>
    </div></div>
  )
}
