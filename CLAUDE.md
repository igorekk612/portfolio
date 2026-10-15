# Warstwa — notatki dla Claude Code

Sklep z personalizowanymi wydrukami 3D dla graczy (nick na uchwytach, brelokach, tabliczkach…).
Właściciel: Igor (Nexcode). **Rozmawiaj po polsku**, cały tekst w UI jest po polsku.

## Komendy
- `npm run dev` — lokalnie; bez `.env` działa tryb demo (produkty z pliku, bez płatności)
- `npm run build` — wersja na Netlify (`dist/`, BrowserRouter + `public/_redirects`)
- `npm run build:demo` — jeden plik `dist-demo/index.html` (HashRouter, tryb demo)
- `npx tsc -b` — sprawdzenie typów (musi przejść przed commitem)
- `python scripts/make-thumbs.py` — miniatury katalogu z podglądu 3D (po `build:demo`)

## Architektura
- `src/lib/catalog.ts` — kategorie, produkty, warianty, kolory filamentu, kolory LED, ceny (`unitPrice`), `catalogEntries`
- `src/components/Preview3D.tsx` — wszystkie modele 3D (React Three Fiber). Styl „gamingowy”: obrysy 2D wyciągane `Extruded`,
  akcenty `Strip`/`Outline`/`CornerAccents` w kolorze napisu (świecą przy LED), nick `Nick` (font z polskimi znakami
  w `src/assets/chakra-petch-bold.typeface.json`, `flat` = napis wtopiony), kółko breloka `SwingingRing` (wahadło Verlet)
- `src/components/Configurator.tsx` — wybór wariantu, nicku, kolorów, LED; `Stage` = podgląd 3D
- `src/state/cart.tsx` — koszyk + wspólny „design” (nick, kolory, LED, wybrane warianty), zapis w localStorage
- `src/pages/` — Home, Catalog (`/katalog`, `/katalog/:kat`), ProductPage (`?wariant=`), Checkout, Admin, Simple
- `supabase/migrations/001_init.sql` — tabele + RLS; `supabase/functions/create-checkout` (ceny liczone na serwerze, Stripe BLIK/P24/karta),
  `stripe-webhook` (status `oplacone`)

## Zasady
- Ceny liczy **tylko serwer** (`create-checkout`) z tabeli `products`. Front pokazuje ceny, ale ich nie wysyła.
- Listy dozwolonych wartości są w dwóch miejscach: front (`catalog.ts`) i funkcja `create-checkout` (COLORS, LIGHTS, RGB_EXTRA).
  Zmieniasz jedno — zmień drugie.
- RLS: klient czyta tylko aktywne produkty; zamówienia tylko admin (tabela `admins`), admin zmienia tylko `status` i `tracking`.
- Żadnych cudzych logo/postaci/marek w modelach i grafikach.

## Dodanie produktu albo wariantu
1. `src/lib/catalog.ts` — wpis w `PRODUCTS` (kategoria, cena, `ledPrice`, `variants`); nowy `ProductId` w typie
2. `src/components/Preview3D.tsx` — model w `Model()` (wariant przez `variant`)
3. `supabase/migrations/` — nowa migracja z `insert`/`update` produktu (nie edytuj wdrożonej 001)
4. `scripts/make-thumbs.py` — dopisz do `ENTRIES`, wygeneruj miniaturę
5. `npx tsc -b`, `npm run build:demo`, sprawdź podgląd

## Do zrobienia
- [ ] Treść regulaminu i polityki prywatności (`/regulamin`, `/prywatnosc` mają tylko zaślepkę)
- [ ] Prawdziwe zdjęcia produktów zamiast miniatur z 3D (te same nazwy plików w `src/assets/katalog/`)
- [ ] Modele do druku (OpenSCAD, parametr = nick), w tym świecąca płyta: korpus z wyciętymi literami, półprzezroczysty wkład, klapka z kanałem na kabel
- [ ] Podłączenie Supabase + Stripe wg README, testowe zamówienie od początku do końca
