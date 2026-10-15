// Odbiera powiadomienia ze Stripe i oznacza zamówienia jako opłacone albo anulowane.
// Wdrażaj z flagą --no-verify-jwt (Stripe nie wysyła tokenu Supabase); autentyczność sprawdza podpis.
import Stripe from 'npm:stripe@16.12.0'
import { createClient } from 'npm:@supabase/supabase-js@2.45.4'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, { apiVersion: '2024-06-20', httpClient: Stripe.createFetchHttpClient() })
const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
const secret = Deno.env.get('STRIPE_WEBHOOK_SECRET')!
const crypto = Stripe.createSubtleCryptoProvider()

Deno.serve(async (req) => {
  const sig = req.headers.get('stripe-signature')
  if (!sig) return new Response('Brak podpisu', { status: 400 })
  const raw = await req.text()

  let event: Stripe.Event
  try {
    event = await stripe.webhooks.constructEventAsync(raw, sig, secret, undefined, crypto)
  } catch {
    return new Response('Nieprawidłowy podpis', { status: 400 })
  }

  const s = event.data.object as Stripe.Checkout.Session
  const orderId = s?.metadata?.order_id
  if (!orderId) return new Response('ok')

  switch (event.type) {
    case 'checkout.session.completed':
    case 'checkout.session.async_payment_succeeded':
      if (s.payment_status === 'paid') {
        await db.from('orders').update({ status: 'oplacone', paid_at: new Date().toISOString() }).eq('id', orderId).eq('status', 'nowe')
      }
      break
    case 'checkout.session.async_payment_failed':
    case 'checkout.session.expired':
      await db.from('orders').update({ status: 'anulowane' }).eq('id', orderId).eq('status', 'nowe')
      break
  }
  return new Response('ok')
})
