// Ustawienia sklepu. Wartości z .env (patrz .env.example).
export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

// Bez Supabase sklep działa w trybie demo: produkty z pliku, zamówienia nie są zapisywane, płatność nie jest pobierana.
export const IS_DEMO = !SUPABASE_URL || !SUPABASE_ANON_KEY || import.meta.env.MODE === 'demo'

export const SHOP = {
  name: 'Warstwa',
  email: 'zamowienia@warstwa.pl',
  shippingPln: 12.99,
  // Ostatni dzień zamówień z dostawą przed Wigilią (RRRR-MM-DD).
  christmasDeadline: '2026-12-15',
  nickMax: 14,
}

export const NICK_RE = /^[0-9A-Za-zĄĆĘŁŃÓŚŹŻąćęłńóśźż_-]{1,14}$/
export const cleanNick = (v: string) => v.replace(/[^0-9A-Za-zĄĆĘŁŃÓŚŹŻąćęłńóśźż_-]/g, '').slice(0, SHOP.nickMax)
