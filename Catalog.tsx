import { NavLink, useParams } from 'react-router-dom'
import ProductCard from '../components/ProductCard'
import { CATEGORIES, catalogEntries, category } from '../lib/catalog'
import { useCart } from '../state/cart'

export default function Catalog() {
  const { kat } = useParams()
  const { products } = useCart()
  const entries = catalogEntries(products)
  const current = category(kat)
  const count = (id: string) => entries.filter(e => e.product.category === id).length

  return (
    <div className="page"><div className="wrap">
      <div className="sec-head" style={{ marginBottom: 20 }}>
        <span className="eyebrow">Katalog</span>
        <h1 style={{ fontSize: 'clamp(34px,4.6vw,54px)' }}>{current ? current.name : 'Wszystkie produkty'}</h1>
        <p>{current ? current.desc : 'Każdy produkt personalizujesz nickiem i dwoma kolorami. Drukujemy dopiero po zamówieniu.'}</p>
      </div>

      <nav className="tabs" aria-label="Kategorie">
        <NavLink to="/katalog" end>Wszystkie <span>{entries.length}</span></NavLink>
        {CATEGORIES.map(c => <NavLink key={c.id} to={`/katalog/${c.id}`}>{c.name} <span>{count(c.id)}</span></NavLink>)}
      </nav>

      {current ? (
        <div className="products">
          {entries.filter(e => e.product.category === current.id).map(e => <ProductCard key={e.key} e={e} />)}
        </div>
      ) : (
        CATEGORIES.map(c => {
          const list = entries.filter(e => e.product.category === c.id)
          if (!list.length) return null
          return (
            <section key={c.id} className="cat-block" aria-labelledby={`h-${c.id}`}>
              <div className="cat-head">
                <div><h2 id={`h-${c.id}`}>{c.name}</h2><p className="muted">{c.desc}</p></div>
                <NavLink className="link" to={`/katalog/${c.id}`}>Tylko {c.name.toLowerCase()} →</NavLink>
              </div>
              <div className="products">{list.map(e => <ProductCard key={e.key} e={e} />)}</div>
            </section>
          )
        })
      )}
    </div></div>
  )
}
