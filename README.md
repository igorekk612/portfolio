# Warstwa — sklep z personalizowanymi wydrukami 3D

React + Vite + Three.js na froncie, Supabase (baza, logowanie, edge functions) i Stripe (BLIK, Przelewy24, karta) na zapleczu. Wdrożenie na Netlify.

Bez kluczy Supabase strona działa w **trybie demo**: produkty z pliku, koszyk działa, zamówienie nie jest zapisywane i nic nie jest pobierane.

## Co jest w środku

| Ścieżka | Co robi |
| --- | --- |
| `src/pages/Home.tsx` | Strona główna: podgląd 3D nicku w hero, produkty, kroki, zestaw na święta z odliczaniem, pytania |
| `src/pages/ProductPage.tsx` + `src/components/Configurator.tsx` | Konfigurator: produkt, nick, dwa kolory filamentu, podgląd 3D, dodanie do koszyka |
| `src/components/Preview3D.tsx` | Modele 3D produktów (Three.js), napis 3D z polskimi znakami |
| `src/pages/Checkout.tsx` | Dane do wysyłki z kodem paczkomatu InPost, przejście do płatności |
| `src/pages/Admin.tsx` | Panel sklepu `/admin`: zamówienia, filtr statusów, zmiana statusu i numeru przesyłki |
| `src/lib/catalog.ts` | Produkty i kolory (zapas i tryb demo) |
| `src/config.ts` | Nazwa sklepu, e-mail, cena dostawy, termin świąteczny |
| `supabase/migrations/001_init.sql` | Tabele, produkty startowe, zabezpieczenia RLS |
| `supabase/functions/create-checkout` | Liczy ceny na serwerze, zapisuje zamówienie, tworzy płatność Stripe |
| `supabase/functions/stripe-webhook` | Oznacza zamówienie jako opłacone po płatności |

## Uruchomienie lokalnie

```bash
npm install
npm run dev          # tryb demo, jeśli nie ma pliku .env
```

## Podłączenie Supabase

1. Załóż projekt na supabase.com.
2. **SQL Editor** → wklej `supabase/migrations/001_init.sql` → **Run**.
3. **Authentication → Users → Add user**: utwórz swoje konto administratora (e-mail + hasło).
4. Dodaj je do administratorów w SQL Editor:
   ```sql
   insert into public.admins (user_id) select id from auth.users where email = 'twoj@email.pl';
   ```
5. Skopiuj `.env.example` do `.env` i wpisz `VITE_SUPABASE_URL` oraz `VITE_SUPABASE_ANON_KEY` (Project Settings → API).

## Płatności Stripe

1. Załóż konto na stripe.com i w **Settings → Payment methods** włącz **BLIK** i **Przelewy24**.
2. Zainstaluj Supabase CLI, zaloguj się i połącz projekt:
   ```bash
   npx supabase login
   npx supabase link --project-ref TWOJ_PROJECT_REF
   ```
3. Ustaw sekrety funkcji (adres strony bez ukośnika na końcu):
   ```bash
   npx supabase secrets set STRIPE_SECRET_KEY=sk_test_... SITE_URL=https://twoja-strona.netlify.app SHIPPING_PLN=12.99
   ```
4. Wdróż funkcje:
   ```bash
   npx supabase functions deploy create-checkout
   npx supabase functions deploy stripe-webhook --no-verify-jwt
   ```
5. W Stripe: **Developers → Webhooks → Add endpoint**
   - adres: `https://TWOJ_PROJECT_REF.supabase.co/functions/v1/stripe-webhook`
   - zdarzenia: `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `checkout.session.async_payment_failed`, `checkout.session.expired`
6. Skopiuj **Signing secret** i ustaw: `npx supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...`
7. Potwierdzenia mailowe dla klientów: Stripe **Settings → Customer emails → Successful payments**.

Testuj na kluczach `sk_test_...`. Na produkcję przełącz na `sk_live_...` i dodaj webhook w trybie live.

## Wdrożenie na Netlify

1. `npm run build` → folder `dist`.
2. Netlify → Add new site → przeciągnij folder `dist` (plik `_redirects` jest w środku, podstrony będą działać).
3. Lepiej: podłącz repozytorium z GitHuba, build command `npm run build`, publish directory `dist`, a w **Site settings → Environment variables** dodaj `VITE_SUPABASE_URL` i `VITE_SUPABASE_ANON_KEY`.

`npm run build:demo` robi jeden plik `dist-demo/index.html` w trybie demo, do pokazywania bez backendu.

## Katalog

Kategorie (`CATEGORIES` w `src/lib/catalog.ts`): Uchwyty i stojaki, Breloki, Organizery, Zestawy, Tabliczki i inne. Każdy wariant ma osobną kartę z miniaturą z `src/assets/katalog/` (generuje je `scripts/make-thumbs.py`). Instrukcja dodawania produktów jest w `CLAUDE.md`.

## Zmiany, które zrobisz najczęściej

- **Ceny i opisy produktów**: tabela `products` w Supabase (Table Editor). Strona czyta je na bieżąco.
- **Warianty produktów** (np. uchwyt klasyczny, na dwa pady, na ścianę): kolumna `variants` w tabeli `products`, z dopłatą `price_delta`. W trybie demo: `variants` w `src/lib/catalog.ts`. Nowy wariant potrzebuje też modelu w `src/components/Preview3D.tsx`.
- **Świecący napis LED**: dopłata w kolumnie `led_price` tabeli `products` (puste = produkt bez tej opcji). Kolory światła: `LIGHTS` w `src/lib/catalog.ts` i `LIGHTS` w funkcji `create-checkout`. Dopłata za RGB z pilotem: `RGB_EXTRA` w obu miejscach.
- **Kolory filamentu**: `FILAMENTS` w `src/lib/catalog.ts` i ta sama lista `COLORS` w `supabase/functions/create-checkout/index.ts`.
- **Zdjęcia produktów**: na razie w kartach są pola „Zdjęcie wkrótce” (`.photo` w `Home.tsx`). Wrzuć zdjęcia do `public/zdjecia/` i podmień na `<img>`.
- **Termin świąteczny, e-mail, cena dostawy**: `src/config.ts` (cenę dostawy zmień też w sekrecie `SHIPPING_PLN`).

## Przed startem sprzedaży

- [ ] Regulamin i polityka prywatności (strony `/regulamin` i `/prywatnosc` czekają na treść)
- [ ] Zasady zwrotów dla produktów personalizowanych w regulaminie
- [ ] Działalność (nierejestrowana lub firma) i sposób ewidencji sprzedaży
- [ ] Dane producenta i informacje o bezpieczeństwie produktu (GPSR) w opisach
- [ ] Prawdziwe zdjęcia produktów
- [ ] Wersja z LED: zestawy LED z deklaracją zgodności CE od dostawcy, zasilanie USB, bez baterii
- [ ] Testowe zamówienie od początku do końca na kluczach testowych Stripe
