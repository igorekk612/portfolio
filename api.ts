import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { IS_DEMO, SUPABASE_ANON_KEY, SUPABASE_URL } from '../config'
import { PRODUCTS, type Product } from './catalog'
import type { CartItem } from '../state/cart'

export const supabase: SupabaseClient | null = IS_DEMO ? null : createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!)

export async function getProducts(): Promise<Product[]> {
  if (!supabase) return PRODUCTS
  const { data, error } = await supabase.from('products').select('id,name,short,price,grams,description,details,active,led_price,variants,category').eq('active', true).order('sort')
  if (error || !data?.length) return PRODUCTS
  return data.map(r => ({ id: r.id, category: r.category ?? 'inne', name: r.name, short: r.short, price: Number(r.price), grams: r.grams, desc: r.description, details: r.details ?? [], active: r.active, ledPrice: r.led_price == null ? null : Number(r.led_price),
    variants: (r.variants ?? []).map((v: any) => ({ id: v.id, name: v.name, priceDelta: Number(v.price_delta ?? 0), gramsDelta: Number(v.grams_delta ?? 0), desc: v.desc ?? '' })) }))
}

export interface Customer { name: string; email: string; phone: string; locker: string; notes: string }

export type CheckoutResult = { kind: 'redirect'; url: string } | { kind: 'demo' } | { kind: 'error'; message: string }

// Zamówienie i ceny liczy serwer (edge function `create-checkout`), nigdy przeglądarka.
export async function startCheckout(items: CartItem[], customer: Customer): Promise<CheckoutResult> {
  if (!supabase) return { kind: 'demo' }
  const { data, error } = await supabase.functions.invoke('create-checkout', {
    body: {
      customer,
      items: items.map(i => ({ productId: i.productId, nick: i.nick, base: i.base, text: i.text, light: i.light, variant: i.variant, qty: i.qty })),
      origin: window.location.origin,
    },
  })
  if (error || !data?.url) return { kind: 'error', message: data?.error ?? 'Nie udało się rozpocząć płatności. Spróbuj ponownie za chwilę.' }
  return { kind: 'redirect', url: data.url }
}

// ---- Panel admina ----

export type OrderStatus = 'nowe' | 'oplacone' | 'w_druku' | 'wyslane' | 'anulowane'
export const STATUS_LABEL: Record<OrderStatus, string> = {
  nowe: 'Czeka na płatność', oplacone: 'Opłacone', w_druku: 'W druku', wyslane: 'Wysłane', anulowane: 'Anulowane',
}

export interface OrderRow {
  id: string
  number: number
  created_at: string
  status: OrderStatus
  customer_name: string
  email: string
  phone: string
  locker: string
  notes: string | null
  total: number
  tracking: string | null
  order_items: { product_id: string; nick: string; base_color: string; text_color: string; light: string | null; variant: string | null; qty: number; unit_price: number }[]
}

export async function signIn(email: string, password: string) {
  if (!supabase) return { error: 'Panel działa po podłączeniu Supabase.' }
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  return { error: error ? 'Nieprawidłowy e-mail lub hasło.' : null }
}

export async function signOut() { await supabase?.auth.signOut() }

export async function listOrders(): Promise<{ rows: OrderRow[]; error: string | null }> {
  if (!supabase) return { rows: [], error: null }
  const { data, error } = await supabase
    .from('orders')
    .select('id,number,created_at,status,customer_name,email,phone,locker,notes,total,tracking,order_items(product_id,nick,base_color,text_color,light,variant,qty,unit_price)')
    .order('created_at', { ascending: false })
    .limit(200)
  if (error) return { rows: [], error: 'Brak dostępu. Konto nie ma uprawnień administratora.' }
  return { rows: data as OrderRow[], error: null }
}

export async function updateOrder(id: string, patch: Partial<Pick<OrderRow, 'status' | 'tracking'>>) {
  if (!supabase) return { error: null }
  const { error } = await supabase.from('orders').update(patch).eq('id', id)
  return { error: error ? 'Nie udało się zapisać zmiany.' : null }
}
