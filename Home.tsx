import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { LightPicker, NickInput, Stage, Swatches } from '../components/Configurator'
import { SHOP } from '../config'
import { CATEGORIES, catalogEntries, pln } from '../lib/catalog'
import { thumb } from '../lib/thumbs'
import { useCart } from '../state/cart'

function Countdown() {
  const end = new Date(SHOP.christmasDeadline + 'T23:59:59').getTime()
  const [now, setNow] = useState(Date.now())
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 60_000); return () => clearInterval(t) }, [])
  const left = Math.max(0, end - now)
  const d = Math.floor(left / 864e5), h = Math.floor(left / 36e5) % 24, m = Math.floor(left / 6e4) % 60
  return (
    <div className="countdown" aria-label={`Do końca zamówień świątecznych zostało ${d} dni ${h} godzin`}>
      <div><b>{d}</b><span>dni</span></div><div><b>{h}</b><span>godz.</span></div><div><b>{m}</b><span>min</span></div>
    </div>
  )
}

export default function Home() {
  const { products, design, setDesign } = useCart()
  const entries = catalogEntries(products)
  const { nick, base, text, light } = design
  const nav = useNavigate()
  const stand = products.find(p => p.id === 'uchwyt') ?? products[0]
  const gift = products.find(p => p.id === 'zestaw')

  return (
    <>
      <div className="hero"><div className="wrap">
        <div className="hero-copy">
          <span className="eyebrow">Druk 3D na zamówienie · dla graczy</span>
          <h1>Twój nick. <span className="nick-live">{nick || 'Twój nick'}</span> Warstwa po warstwie.</h1>
          <p className="lead">Uchwyty, tabliczki i breloki z nickiem gracza. Wpisz nick, a podgląd pokaże go w 3D, zanim cokolwiek trafi na stół drukarki.</p>
          <NickInput id="hero-nick" value={nick} onChange={v => setDesign({ nick: v })} />
          <div className="colors2">
            <Swatches id="hero-base" label="Kolor uchwytu" value={base} onChange={v => setDesign({ base: v })} />
            {!light && <Swatches id="hero-text" label="Kolor napisu" value={text} onChange={v => setDesign({ text: v })} />}
          </div>
          <LightPicker value={light} ledPrice={stand?.ledPrice ?? 49} onChange={v => setDesign({ light: v })} />
          {!light && base === text && <span className="hint err">Napis w kolorze uchwytu będzie słabo widoczny. Wybierz inny kolor napisu.</span>}
          <div className="hero-input">
            <button className="btn" onClick={() => nav('/produkt/uchwyt')}>Zaprojektuj swój uchwyt</button>
            <Link className="btn ghost" to="/katalog">Zobacz katalog</Link>
          </div>
        </div>
        <div className="hero-stage">
          <Stage id="uchwyt" nick={nick} base={base} text={text} light={light} autoRotate name={stand?.name ?? 'Uchwyt'} />
        </div>
      </div></div>

      <section className="block" id="produkty"><div className="wrap">
        <div className="sec-head">
          <span className="eyebrow">Katalog</span>
          <h2>Każdy produkt z Twoim nickiem</h2>
          <p>Drukujemy dopiero po zamówieniu, w dwóch kolorach, które wybierzesz. Personalizacja jest w cenie.</p>
        </div>
        <div className="cats">
          {CATEGORIES.map(c => {
            const list = entries.filter(e => e.product.category === c.id)
            const img = list[0] ? thumb(list[0].key) : undefined
            return (
              <Link key={c.id} to={`/katalog/${c.id}`} className="cat-tile">
                <div className="photo">{img ? <img src={img} alt="" loading="lazy" /> : <span className="ph-name">{c.name.split(' ')[0]}</span>}</div>
                <div className="body"><h3>{c.name}</h3><span>{list.length} {list.length === 1 ? 'produkt' : list.length < 5 ? 'produkty' : 'produktów'}</span></div>
              </Link>
            )
          })}
        </div>
        <div style={{ marginTop: 24 }}><Link className="btn ghost" to="/katalog">Zobacz cały katalog</Link></div>
      </div></section>

      <section className="block" id="jak" style={{ background: 'var(--bg-2)', borderBlock: '1px solid var(--line)' }}><div className="wrap">
        <div className="sec-head"><span className="eyebrow">Od zamówienia do paczki</span><h2>Jak to działa</h2></div>
        <ol className="steps">
          <li><h3>Wpisujesz nick</h3><p>Wybierasz produkt i dwa kolory filamentu. Podgląd 3D pokazuje dokładnie, jak będzie wyglądał napis.</p></li>
          <li><h3>Drukujemy na zamówienie</h3><p>Model z Twoim nickiem powstaje warstwa po warstwie, po 0,2 mm. Każdy egzemplarz sprawdzamy przed pakowaniem.</p></li>
          <li><h3>Wysyłamy do paczkomatu</h3><p>Paczka wychodzi w 2–4 dni robocze. Numer przesyłki dostajesz mailem.</p></li>
        </ol>
      </div></section>

      {gift && (
        <section className="block"><div className="wrap">
          <div className="gift">
            <div style={{ display: 'grid', gap: 16 }}>
              <span className="eyebrow">Na święta</span>
              <h2>{gift.name} dla gracza</h2>
              <p className="muted">Uchwyt i brelok z tym samym nickiem, w pudełku gotowym do wręczenia. Do końca zamówień z dostawą przed Wigilią zostało:</p>
              <Countdown />
              <div><Link className="btn" to="/produkt/zestaw">Zamów zestaw za {pln(gift.price)}</Link></div>
            </div>
            <Stage id="zestaw" nick={nick} base={base} text={text} light={light} name={gift.name} />
          </div>
        </div></section>
      )}

      <section className="block" id="pytania"><div className="wrap">
        <div className="sec-head"><span className="eyebrow">Pytania</span><h2>Zanim zamówisz</h2></div>
        <div className="faq">
          <details><summary>Jakie znaki mogą być w nicku?</summary><p>Litery (także polskie), cyfry, podkreślnik i myślnik. Maksymalnie {SHOP.nickMax} znaków, bo dłuższy napis traci czytelność na małych produktach.</p></details>
          <details><summary>Z czego są produkty?</summary><p>Z PLA, popularnego tworzywa do druku 3D. Na powierzchni widać delikatne linie warstw. To naturalny efekt tej technologii.</p></details>
          <details><summary>Czy uchwyt pasuje do mojego pada?</summary><p>Uchwyt mieści typowe pady do konsol i PC. Jeśli masz nietypowy model, napisz przed zamówieniem: {SHOP.email}.</p></details>
          <details><summary>Jak mogę zapłacić?</summary><p>BLIK-iem, przelewem online (Przelewy24) albo kartą. Płatność obsługuje Stripe, nie widzimy danych Twojej karty.</p></details>
          <details><summary>Ile czeka się na paczkę?</summary><p>Zwykle 2–4 dni robocze od zaksięgowania płatności. Wysyłamy do paczkomatów InPost.</p></details>
          <details><summary>A co ze zwrotami?</summary><p>Każdy produkt robimy na zamówienie z Twoim nickiem. Zasady zwrotów i reklamacji opisuje <Link to="/regulamin">regulamin</Link>.</p></details>
        </div>
      </div></section>
    </>
  )
}
