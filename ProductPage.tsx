import { useEffect } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import Configurator from '../components/Configurator'
import { category } from '../lib/catalog'
import { useCart } from '../state/cart'

export default function ProductPage() {
  const { id } = useParams()
  const [q] = useSearchParams()
  const { products, design, setDesign } = useCart()
  const nav = useNavigate()
  const p = products.find(x => x.id === id) ?? products[0]
  const w = q.get('wariant')

  // Wariant wybrany na karcie katalogu trafia od razu do konfiguratora.
  useEffect(() => {
    if (w && p.variants.some(v => v.id === w) && design.variants[p.id] !== w) {
      setDesign({ variants: { ...design.variants, [p.id]: w } })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [p.id, w])

  const cat = category(p.category)
  return (
    <div className="page"><div className="wrap">
      <nav className="crumbs" aria-label="Okruszki">
        <Link to="/katalog">Katalog</Link><span>/</span>
        {cat && <><Link to={`/katalog/${cat.id}`}>{cat.name}</Link><span>/</span></>}
        <span aria-current="page">{p.name}</span>
      </nav>
      <Configurator key={p.id} product={p} products={products.filter(x => x.category === p.category)} onProduct={pid => nav(`/produkt/${pid}`, { replace: true })} />
    </div></div>
  )
}
