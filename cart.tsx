import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { getProducts } from '../lib/api'
import { PRODUCTS, product, unitPrice, type Product, type ProductId } from '../lib/catalog'

export interface Design { nick: string; base: string; text: string; light: string | null; variants: Record<string, string> }

export interface CartItem { key: string; productId: ProductId; nick: string; base: string; text: string; light: string | null; variant: string | null; qty: number }

interface Ctx {
  products: Product[]
  items: CartItem[]
  count: number
  subtotal: number
  price: (i: CartItem) => number
  open: boolean
  design: Design
  setDesign: (d: Partial<Design>) => void
  setOpen: (v: boolean) => void
  add: (i: Omit<CartItem, 'key' | 'qty'>) => void
  setQty: (key: string, qty: number) => void
  remove: (key: string) => void
  clear: () => void
}

const CartCtx = createContext<Ctx | null>(null)
const STORE = 'warstwa-cart-v3'

export function CartProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<Product[]>(PRODUCTS)
  const [open, setOpen] = useState(false)
  const [design, setDesignState] = useState<Design>(() => {
    try { return { nick: 'KubaGG', base: 'czarny', text: 'pomaranczowy', light: null, variants: {}, ...JSON.parse(localStorage.getItem('warstwa-design') || '{}') } } catch { return { nick: 'KubaGG', base: 'czarny', text: 'pomaranczowy', light: null, variants: {} } }
  })
  useEffect(() => { try { localStorage.setItem('warstwa-design', JSON.stringify(design)) } catch { /* brak pamięci */ } }, [design])
  const [items, setItems] = useState<CartItem[]>(() => {
    try { return JSON.parse(localStorage.getItem(STORE) || '[]') } catch { return [] }
  })

  useEffect(() => { getProducts().then(setProducts) }, [])
  useEffect(() => { try { localStorage.setItem(STORE, JSON.stringify(items)) } catch { /* brak pamięci przeglądarki */ } }, [items])

  const value = useMemo<Ctx>(() => {
    const price = (i: CartItem) => unitPrice(product(i.productId, products), i.light, i.variant)
    return {
      products, items, open, setOpen, design,
      setDesign: (d) => setDesignState(prev => ({ ...prev, ...d })),
      count: items.reduce((s, i) => s + i.qty, 0),
      subtotal: items.reduce((s, i) => s + i.qty * price(i), 0),
      price,
      add: (i) => setItems(prev => {
        const key = `${i.productId}|${i.nick}|${i.base}|${i.text}|${i.light ?? ''}|${i.variant ?? ''}`
        const hit = prev.find(p => p.key === key)
        return hit ? prev.map(p => p.key === key ? { ...p, qty: Math.min(p.qty + 1, 20) } : p) : [...prev, { ...i, key, qty: 1 }]
      }),
      setQty: (key, qty) => setItems(prev => prev.map(p => p.key === key ? { ...p, qty: Math.max(1, Math.min(qty, 20)) } : p)),
      remove: (key) => setItems(prev => prev.filter(p => p.key !== key)),
      clear: () => setItems(prev => (prev.length ? [] : prev)),
    }
  }, [items, products, open, design])

  return <CartCtx.Provider value={value}>{children}</CartCtx.Provider>
}

export const useCart = () => {
  const c = useContext(CartCtx)
  if (!c) throw new Error('useCart poza CartProvider')
  return c
}
