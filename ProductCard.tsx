import { Link } from 'react-router-dom'
import { category, pln, type CatalogEntry } from '../lib/catalog'
import { thumb } from '../lib/thumbs'

export default function ProductCard({ e, wide }: { e: CatalogEntry; wide?: boolean }) {
  const img = thumb(e.key)
  const href = `/produkt/${e.product.id}${e.variant ? `?wariant=${e.variant.id}` : ''}`
  return (
    <Link to={href} className={`pcard${wide ? ' wide' : ''}`}>
      <div className="photo">
        {img ? <img src={img} alt={`${e.title}, podgląd z przykładowym nickiem`} loading="lazy" /> : <span className="ph-name">{e.product.short}</span>}
        {e.product.ledPrice != null && <span className="led-tag">Może świecić</span>}
      </div>
      <div className="body">
        <span className="cat">{category(e.product.category)?.name}</span>
        <h3>{e.variant ? <>{e.product.name} <span className="var">· {e.variant.name}</span></> : e.product.name}</h3>
        <p>{e.desc}</p>
        <div className="row"><span className="from">{pln(e.price)}</span><span className="go">Personalizuj →</span></div>
      </div>
    </Link>
  )
}
