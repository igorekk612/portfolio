// Tworzy zamówienie i sesję płatności Stripe (BLIK, Przelewy24, karta).
// Ceny są liczone tutaj, z tabeli products — nigdy z danych przysłanych przez przeglądarkę.
import Stripe from 'npm:stripe@16.12.0'
import { createClient } from 'npm:@supabase/supabase-js@2.45.4'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, { apiVersion: '2024-06-20', httpClient: Stripe.createFetchHttpClient() })
const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
const SITE_URL = (Deno.env.get('SITE_URL') ?? '').replace(/\/$/, '')
const SHIPPING_PLN = Number(Deno.env.get('SHIPPING_PLN') ?? '12.99')

const NICK_RE = /^[0-9A-Za-zĄĆĘŁŃÓŚŹŻąćęłńóśźż_-]{1,14}$/
const COLORS = new Set(['czarny', 'bialy', 'szary', 'czerwony', 'pomaranczowy', 'zolty', 'zielony', 'niebieski', 'fioletowy', 'rozowy'])
const LIGHTS = new Set(['cieply', 'zimny', 'czerwony', 'niebieski', 'fioletowy', 'zielony', 'rgb'])
const RGB_EXTRA = 20
const LOCKER_RE = /^[A-Z]{3}\d{2,3}[A-Z]{0,2}$/

const cors = {
  'Access-Control-Allow-Origin': SITE_URL || '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } })

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (req.method !== 'POST') return json({ error: 'Metoda niedozwolona.' }, 405)

  let body: any
  try { body = await req.json() } catch { return json({ error: 'Nieprawidłowe dane.' }, 400) }
  const c = body?.customer ?? {}
  const items: any[] = Array.isArray(body?.items) ? body.items : []

  // Walidacja danych klienta
  const customer = {
    name: String(c.name ?? '').trim().slice(0, 120),
    email: String(c.email ?? '').trim().slice(0, 200),
    phone: String(c.phone ?? '').trim().slice(0, 30),
    locker: String(c.locker ?? '').trim().toUpperCase().slice(0, 10),
    notes: String(c.notes ?? '').trim().slice(0, 500) || null,
  }
  if (customer.name.length < 3 || !/^\S+@\S+\.\S+$/.test(customer.email) || customer.phone.replace(/\D/g, '').length < 9 || !LOCKER_RE.test(customer.locker)) {
    return json({ error: 'Sprawdź dane do wysyłki.' }, 400)
  }
  if (!items.length || items.length > 20) return json({ error: 'Koszyk jest pusty albo za duży.' }, 400)

  // Ceny z bazy
  const { data: products, error: pErr } = await db.from('products').select('id,name,price,active,led_price,variants')
  if (pErr || !products) return json({ error: 'Nie udało się pobrać produktów.' }, 500)
  const byId = new Map(products.filter(p => p.active).map(p => [p.id, p]))

  const lines = []
  for (const it of items) {
    const p = byId.get(String(it.productId))
    const qty = Math.trunc(Number(it.qty))
    const nick = String(it.nick ?? '')
    const lightId = it.light == null ? null : String(it.light)
    if (lightId && (!LIGHTS.has(lightId) || p?.led_price == null)) {
      return json({ error: 'Ten produkt nie ma opcji podświetlenia. Usuń go z koszyka i dodaj ponownie.' }, 400)
    }
    const variants: any[] = Array.isArray(p?.variants) ? p.variants : []
    const v = variants.length ? (variants.find(x => x.id === it.variant) ?? (it.variant == null ? variants[0] : null)) : null
    if (variants.length && !v) return json({ error: 'Wybrany wariant produktu nie istnieje. Dodaj produkt do koszyka ponownie.' }, 400)
    if (!p || !NICK_RE.test(nick) || !COLORS.has(it.base) || !COLORS.has(it.text) || !(qty >= 1 && qty <= 20)) {
      return json({ error: 'Jedna z pozycji w koszyku jest nieprawidłowa. Usuń ją i dodaj ponownie.' }, 400)
    }
    const unit = Number(p.price) + Number(v?.price_delta ?? 0) + (lightId ? Number(p.led_price) + (lightId === 'rgb' ? RGB_EXTRA : 0) : 0)
    lines.push({ product: p, variant: v, nick, base: it.base, text: it.text, light: lightId, qty, unit })
  }
  const subtotal = lines.reduce((s, l) => s + l.unit * l.qty, 0)
  const total = Math.round((subtotal + SHIPPING_PLN) * 100) / 100

  // Zamówienie w bazie (status: czeka na płatność)
  const { data: order, error: oErr } = await db.from('orders').insert({
    customer_name: customer.name, email: customer.email, phone: customer.phone, locker: customer.locker, notes: customer.notes,
    subtotal, shipping: SHIPPING_PLN, total,
  }).select('id,number').single()
  if (oErr || !order) return json({ error: 'Nie udało się zapisać zamówienia.' }, 500)

  const { error: iErr } = await db.from('order_items').insert(lines.map(l => ({
    order_id: order.id, product_id: l.product.id, nick: l.nick, base_color: l.base, text_color: l.text, light: l.light, variant: l.variant?.id ?? null, qty: l.qty, unit_price: l.unit,
  })))
  if (iErr) { await db.from('orders').delete().eq('id', order.id); return json({ error: 'Nie udało się zapisać zamówienia.' }, 500) }

  // Sesja płatności Stripe
  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      currency: 'pln',
      payment_method_types: ['blik', 'p24', 'card'],
      customer_email: customer.email,
      client_reference_id: order.id,
      metadata: { order_id: order.id, order_number: String(order.number) },
      line_items: [
        ...lines.map(l => ({
          quantity: l.qty,
          price_data: { currency: 'pln', unit_amount: Math.round(l.unit * 100), product_data: { name: `${l.product.name}${l.variant && (l.product.variants?.length ?? 0) > 1 ? ` (${l.variant.name})` : ''} – nick: ${l.nick}${l.light ? ' + świecący napis LED' : ''}` } },
        })),
        { quantity: 1, price_data: { currency: 'pln', unit_amount: Math.round(SHIPPING_PLN * 100), product_data: { name: `Dostawa do paczkomatu ${customer.locker}` } } },
      ],
      success_url: `${SITE_URL}/dziekujemy?zamowienie=${order.number}`,
      cancel_url: `${SITE_URL}/anulowano`,
      expires_at: Math.floor(Date.now() / 1000) + 60 * 60, // sesja ważna 1 godzinę
    })
    await db.from('orders').update({ stripe_session_id: session.id }).eq('id', order.id)
    return json({ url: session.url })
  } catch (e) {
    console.error(e)
    await db.from('orders').update({ status: 'anulowane' }).eq('id', order.id)
    return json({ error: 'Nie udało się rozpocząć płatności. Spróbuj ponownie za chwilę.' }, 502)
  }
})
