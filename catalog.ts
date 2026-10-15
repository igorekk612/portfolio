// Katalog produktów i kolorów filamentu.
// W trybie produkcyjnym produkty (nazwy, ceny, dostępność) są czytane z tabeli `products` w Supabase,
// a te wartości służą tylko jako zapas i do trybu demo. Ceny w złotych.

export type ProductId = 'uchwyt' | 'tabliczka' | 'brelok' | 'organizer' | 'zestaw' | 'zestaw-biurko' | 'sluchawki' | 'telefon' | 'podkladka'

export type CategoryId = 'uchwyty' | 'breloki' | 'organizery' | 'zestawy' | 'inne'
export interface Category { id: CategoryId; name: string; desc: string }
export const CATEGORIES: Category[] = [
  { id: 'uchwyty', name: 'Uchwyty i stojaki', desc: 'Na pady, słuchawki i telefon. Porządek na biurku z Twoim nickiem.' },
  { id: 'breloki', name: 'Breloki', desc: 'Do kluczy, plecaka albo jako dodatek do prezentu.' },
  { id: 'organizery', name: 'Organizery', desc: 'Przegródki na pady, kable i drobiazgi.' },
  { id: 'zestawy', name: 'Zestawy', desc: 'Kilka rzeczy z tym samym nickiem, gotowe na prezent.' },
  { id: 'inne', name: 'Tabliczki i inne', desc: 'Tabliczki z nickiem, podkładki pod kubek i reszta drobiazgów.' },
]
export const category = (id: string | undefined) => CATEGORIES.find(c => c.id === id)

// Wariant produktu: inny kształt tego samego produktu, z dopłatą (może być 0).
export interface Variant { id: string; name: string; priceDelta: number; gramsDelta: number; desc: string }

export interface Product {
  id: ProductId
  category: CategoryId
  name: string
  short: string
  price: number
  grams: number // orientacyjna waga filamentu bez napisu
  desc: string
  details: string[]
  active: boolean
  ledPrice: number | null // dopłata za świecący napis; null = produkt bez tej opcji
  variants: Variant[] // pierwszy wariant jest domyślny
}

export const PRODUCTS: Product[] = [
  {
    id: 'uchwyt', category: 'uchwyty', ledPrice: 49, name: 'Uchwyt na pada i słuchawki', short: 'Uchwyt', price: 119, grams: 62, active: true,
    desc: 'Stoi na biurku, trzyma pada z przodu i słuchawki na górze. Nick na pionowej płycie.',
    details: ['Wymiary ok. 20 × 18 × 12 cm', 'Mieści typowe pady do konsol i PC', 'Wypukły nick w drugim kolorze'],
    variants: [
      { id: 'klasyczny', name: 'Klasyczny', priceDelta: 0, gramsDelta: 0, desc: 'Jeden pad z przodu, słuchawki na górze.' },
      { id: 'podwojny', name: 'Na dwa pady', priceDelta: 40, gramsDelta: 38, desc: 'Szerszy, mieści dwa pady obok siebie i słuchawki.' },
      { id: 'scienny', name: 'Na ścianę', priceDelta: -10, gramsDelta: -18, desc: 'Bez podstawy, wieszasz na dwóch wkrętach. Zwalnia miejsce na biurku.' },
    ],
  },
  {
    id: 'sluchawki', category: 'uchwyty', ledPrice: 49, name: 'Stojak na słuchawki', short: 'Słuchawki', price: 89, grams: 70, active: true,
    desc: 'Wysoki stojak, który trzyma słuchawki nad biurkiem. Nick na froncie podstawy.',
    details: ['Wysokość ok. 26 cm', 'Szeroki pałąk nie odkształca słuchawek', 'Ciężka, stabilna podstawa'],
    variants: [],
  },
  {
    id: 'telefon', category: 'uchwyty', ledPrice: null, name: 'Podstawka pod telefon', short: 'Telefon', price: 49, grams: 34, active: true,
    desc: 'Trzyma telefon pod kątem, w pionie i w poziomie. Nick na przedniej krawędzi.',
    details: ['Pasuje do telefonów do 9 mm grubości (także w etui)', 'Otwór na kabel ładowania', 'Pion i poziom'],
    variants: [],
  },
  {
    id: 'brelok', category: 'breloki', ledPrice: null, name: 'Brelok z nickiem', short: 'Brelok', price: 25, grams: 7, active: true,
    desc: 'Do kluczy albo plecaka. Dobry dodatek do większego zamówienia.',
    details: ['Metalowe kółko w zestawie', 'Lekki, ok. 8 g', 'Nick wypukły w drugim kolorze'],
    variants: [
      { id: 'zawieszka', name: 'Zawieszka', priceDelta: 0, gramsDelta: 0, desc: 'Podłużna, ścięta zawieszka, długość ok. 7 cm.' },
      { id: 'niesmiertelnik', name: 'Nieśmiertelnik', priceDelta: 5, gramsDelta: 2, desc: 'W kształcie wojskowego nieśmiertelnika, z obwódką w kolorze napisu.' },
    ],
  },
  {
    id: 'organizer', category: 'organizery', ledPrice: 49, name: 'Organizer na biurko', short: 'Organizer', price: 79, grams: 48, active: true,
    desc: 'Przegródki na pady, kable i drobiazgi, nick na froncie.',
    details: ['Nick na przedniej ściance', 'Skośne boki ułatwiają wyjmowanie', 'Stabilny, nie przesuwa się'],
    variants: [
      { id: 'trzy', name: 'Trzy przegródki', priceDelta: 0, gramsDelta: 0, desc: 'Ok. 24 × 10 × 9 cm. Na pady, kable i drobiazgi.' },
      { id: 'pady', name: 'Na dwa pady', priceDelta: 0, gramsDelta: -4, desc: 'Ok. 24 × 10 × 9 cm. Dwie szerokie przegródki, każda na jeden pad.' },
      { id: 'maly', name: 'Mały', priceDelta: -20, gramsDelta: -16, desc: 'Ok. 16 × 10 × 9 cm. Dwie przegródki na drobiazgi i kable.' },
    ],
  },
  {
    id: 'zestaw', category: 'zestawy', ledPrice: 49, name: 'Zestaw prezentowy', short: 'Zestaw gracza', price: 169, grams: 74, active: true,
    desc: 'Uchwyt i brelok z tym samym nickiem, w pudełku gotowym do wręczenia.',
    details: ['Uchwyt + brelok', 'Pudełko prezentowe', 'Ten sam nick i kolory na obu'],
    variants: [],
  },
  {
    id: 'zestaw-biurko', category: 'zestawy', ledPrice: null, name: 'Zestaw na biurko', short: 'Zestaw biurkowy', price: 89, grams: 58, active: true,
    desc: 'Tabliczka z nickiem i dwie podkładki pod kubek w jednym stylu, w pudełku prezentowym.',
    details: ['Tabliczka + 2 podkładki', 'Pudełko prezentowe', 'Ten sam nick i kolory na wszystkich'],
    variants: [],
  },
  {
    id: 'tabliczka', category: 'inne', ledPrice: 49, name: 'Tabliczka z nickiem', short: 'Tabliczka', price: 59, grams: 28, active: true,
    desc: 'Na biurko, półkę albo do tła streamu. Wypukły napis w drugim kolorze.',
    details: ['Długość ok. 20 cm', 'Stabilna stopka', 'Dobrze widoczna na kamerze'],
    variants: [
      { id: 'prosta', name: 'Prosta', priceDelta: 0, gramsDelta: 0, desc: 'Czysta płyta z wypukłym nickiem.' },
      { id: 'ramka', name: 'Z ramką', priceDelta: 10, gramsDelta: 6, desc: 'Wypukła ramka w kolorze napisu.' },
      { id: 'pikselowa', name: 'Pikselowa', priceDelta: 15, gramsDelta: 8, desc: 'Ramka z pikseli w stylu gier 8-bit.' },
    ],
  },
  {
    id: 'podkladka', category: 'inne', ledPrice: null, name: 'Podkładki pod kubek (2 szt.)', short: 'Podkładki', price: 39, grams: 30, active: true,
    desc: 'Dwie sześciokątne podkładki z nickiem, żeby kubek nie zostawiał śladów na biurku.',
    details: ['Szerokość ok. 10 cm', 'Komplet 2 sztuk', 'Napis wtopiony równo z powierzchnią, kubek stoi stabilnie'],
    variants: [],
  },
]

// Pozycja katalogu: produkt albo jeden z jego wariantów (każdy wariant ma osobną kartę).
export interface CatalogEntry { product: Product; variant: Variant | null; key: string; title: string; price: number; desc: string }
export const catalogEntries = (products: Product[]): CatalogEntry[] =>
  products.flatMap<CatalogEntry>(p => p.variants.length > 1
    ? p.variants.map(v => ({ product: p, variant: v, key: `${p.id}:${v.id}`, title: `${p.name} · ${v.name}`, price: p.price + v.priceDelta, desc: v.desc }))
    : [{ product: p, variant: null, key: p.id, title: p.name, price: p.price, desc: p.desc }])

// Kolory światła LED. RGB z pilotem kosztuje dodatkowo RGB_EXTRA.
export const RGB_EXTRA = 20
export interface Light { id: string; name: string; hex: string }
export const LIGHTS: Light[] = [
  { id: 'cieply', name: 'Ciepły biały', hex: '#FFD49A' },
  { id: 'zimny', name: 'Zimny biały', hex: '#DDE8FF' },
  { id: 'czerwony', name: 'Czerwony', hex: '#FF3A3A' },
  { id: 'niebieski', name: 'Niebieski', hex: '#3D7DFF' },
  { id: 'fioletowy', name: 'Fioletowy', hex: '#A54DFF' },
  { id: 'zielony', name: 'Zielony', hex: '#38F07A' },
  { id: 'rgb', name: 'RGB z pilotem', hex: '#FF3AD0' },
]
export const light = (id: string | null | undefined) => LIGHTS.find(l => l.id === id) ?? null
export const ledExtra = (p: Product, lightId: string | null | undefined) =>
  lightId && p.ledPrice != null ? p.ledPrice + (lightId === 'rgb' ? RGB_EXTRA : 0) : 0
export const variant = (p: Product, id: string | null | undefined) => p.variants.find(v => v.id === id) ?? p.variants[0] ?? null
export const unitPrice = (p: Product, lightId: string | null | undefined, variantId?: string | null) =>
  p.price + (variant(p, variantId)?.priceDelta ?? 0) + ledExtra(p, lightId)

export interface Filament { id: string; name: string; hex: string }

export const FILAMENTS: Filament[] = [
  { id: 'czarny', name: 'Czarny', hex: '#1E2026' },
  { id: 'bialy', name: 'Biały', hex: '#EDEDE8' },
  { id: 'szary', name: 'Szary', hex: '#8A909A' },
  { id: 'czerwony', name: 'Czerwony', hex: '#C9322D' },
  { id: 'pomaranczowy', name: 'Pomarańczowy', hex: '#EA7A2F' },
  { id: 'zolty', name: 'Żółty', hex: '#F1C232' },
  { id: 'zielony', name: 'Zielony', hex: '#3A9C57' },
  { id: 'niebieski', name: 'Niebieski', hex: '#2F62D6' },
  { id: 'fioletowy', name: 'Fioletowy', hex: '#7B4CC6' },
  { id: 'rozowy', name: 'Różowy', hex: '#E571A9' },
]

export const filament = (id: string) => FILAMENTS.find(f => f.id === id) ?? FILAMENTS[0]
export const product = (id: string, list: Product[] = PRODUCTS) => list.find(p => p.id === id) ?? list[0]

export const estimate = (p: Product, nick: string, variantId?: string | null) => {
  const grams = p.grams + (variant(p, variantId)?.gramsDelta ?? 0) + Math.round(nick.length * 1.4)
  const minutes = Math.round(grams * 4.2)
  return { grams, time: `ok. ${Math.floor(minutes / 60)} h ${String(minutes % 60).padStart(2, '0')} min` }
}

export const pln = (v: number) => v.toLocaleString('pl-PL', { style: 'currency', currency: 'PLN', minimumFractionDigits: v % 1 ? 2 : 0 })
