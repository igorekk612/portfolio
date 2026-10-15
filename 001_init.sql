-- Warstwa: baza sklepu. Uruchom w Supabase: SQL Editor -> wklej całość -> Run.

-- Produkty (ceny w złotych). Zmieniasz je tutaj albo w Table Editor; strona czyta je na bieżąco.
create table if not exists public.products (
  id text primary key,
  category text not null default 'inne' check (category in ('uchwyty','breloki','organizery','zestawy','inne')),
  name text not null,
  short text not null,
  price numeric(10,2) not null check (price > 0),
  grams int not null default 0,
  description text not null default '',
  details text[] not null default '{}',
  active boolean not null default true,
  sort int not null default 0,
  led_price numeric(10,2), -- dopłata za świecący napis LED; null = produkt bez tej opcji
  variants jsonb not null default '[]' -- [{id, name, price_delta, grams_delta, desc}], pierwszy = domyślny
);

insert into public.products (id, name, short, price, grams, description, details, sort, led_price) values
  ('uchwyt', 'Uchwyt na pada i słuchawki', 'Uchwyt', 119, 62, 'Stoi na biurku, trzyma pada z przodu i słuchawki na górze. Nick na pionowej płycie.', array['Wymiary ok. 20 × 18 × 12 cm','Mieści typowe pady do konsol i PC','Wypukły nick w drugim kolorze'], 1, 49),
  ('tabliczka', 'Tabliczka z nickiem', 'Tabliczka', 59, 28, 'Na biurko, półkę albo do tła streamu. Wypukły napis w drugim kolorze.', array['Długość ok. 20 cm','Stabilna stopka','Dobrze widoczna na kamerze'], 2, 49),
  ('brelok', 'Brelok z nickiem', 'Brelok', 25, 7, 'Do kluczy albo plecaka. Dobry dodatek do większego zamówienia.', array['Długość ok. 7 cm','Metalowe kółko w zestawie','Lekki, ok. 8 g'], 3, null),
  ('organizer', 'Organizer na biurko', 'Organizer', 79, 48, 'Trzy przegródki na pady, kable i drobiazgi, nick na froncie.', array['Wymiary ok. 24 × 10 × 9 cm','Trzy przegródki','Nick na przedniej ściance'], 4, 49),
  ('zestaw', 'Zestaw prezentowy', 'Zestaw', 169, 74, 'Uchwyt i brelok z tym samym nickiem, w pudełku gotowym do wręczenia.', array['Uchwyt + brelok','Pudełko prezentowe','Ten sam nick i kolory na obu'], 5, 49),
  ('sluchawki', 'Stojak na słuchawki', 'Słuchawki', 89, 70, 'Wysoki stojak, który trzyma słuchawki nad biurkiem. Nick na froncie podstawy.', array['Wysokość ok. 26 cm','Szeroki pałąk nie odkształca słuchawek','Ciężka, stabilna podstawa'], 6, 49),
  ('telefon', 'Podstawka pod telefon', 'Telefon', 49, 34, 'Trzyma telefon pod kątem, w pionie i w poziomie. Nick na przedniej krawędzi.', array['Pasuje do telefonów do 9 mm grubości (także w etui)','Otwór na kabel ładowania','Pion i poziom'], 7, null),
  ('podkladka', 'Podkładki pod kubek (2 szt.)', 'Podkładki', 39, 30, 'Dwie sześciokątne podkładki z nickiem, żeby kubek nie zostawiał śladów na biurku.', array['Szerokość ok. 10 cm','Komplet 2 sztuk','Napis wtopiony równo z powierzchnią, kubek stoi stabilnie'], 9, null),
  ('zestaw-biurko', 'Zestaw na biurko', 'Zestaw biurkowy', 89, 58, 'Tabliczka z nickiem i dwie podkładki pod kubek w jednym stylu, w pudełku prezentowym.', array['Tabliczka + 2 podkładki','Pudełko prezentowe','Ten sam nick i kolory na wszystkich'], 7, null)
on conflict (id) do nothing;

-- Kategorie katalogu
update public.products set category = 'uchwyty' where id in ('uchwyt','sluchawki','telefon');
update public.products set category = 'breloki' where id = 'brelok';
update public.products set category = 'organizery' where id = 'organizer';
update public.products set category = 'zestawy' where id in ('zestaw','zestaw-biurko');
update public.products set category = 'inne' where id in ('tabliczka','podkladka');

update public.products set variants = '[
  {"id":"klasyczny","name":"Klasyczny","price_delta":0,"grams_delta":0,"desc":"Jeden pad z przodu, słuchawki na górze."},
  {"id":"podwojny","name":"Na dwa pady","price_delta":40,"grams_delta":38,"desc":"Szerszy, mieści dwa pady obok siebie i słuchawki."},
  {"id":"scienny","name":"Na ścianę","price_delta":-10,"grams_delta":-18,"desc":"Bez podstawy, wieszasz na dwóch wkrętach. Zwalnia miejsce na biurku."}
]' where id = 'uchwyt' and variants = '[]';
update public.products set variants = '[
  {"id":"prosta","name":"Prosta","price_delta":0,"grams_delta":0,"desc":"Czysta płyta z wypukłym nickiem."},
  {"id":"ramka","name":"Z ramką","price_delta":10,"grams_delta":6,"desc":"Wypukła ramka w kolorze napisu."},
  {"id":"pikselowa","name":"Pikselowa","price_delta":15,"grams_delta":8,"desc":"Ramka z pikseli w stylu gier 8-bit."}
]' where id = 'tabliczka' and variants = '[]';
update public.products set variants = '[
  {"id":"zawieszka","name":"Zawieszka","price_delta":0,"grams_delta":0,"desc":"Podłużna, ścięta zawieszka, długość ok. 7 cm."},
  {"id":"niesmiertelnik","name":"Nieśmiertelnik","price_delta":5,"grams_delta":2,"desc":"W kształcie wojskowego nieśmiertelnika, z obwódką w kolorze napisu."}
]' where id = 'brelok' and variants = '[]';
update public.products set variants = '[
  {"id":"trzy","name":"Trzy przegródki","price_delta":0,"grams_delta":0,"desc":"Ok. 24 × 10 × 9 cm. Na pady, kable i drobiazgi."},
  {"id":"pady","name":"Na dwa pady","price_delta":0,"grams_delta":-4,"desc":"Ok. 24 × 10 × 9 cm. Dwie szerokie przegródki, każda na jeden pad."},
  {"id":"maly","name":"Mały","price_delta":-20,"grams_delta":-16,"desc":"Ok. 16 × 10 × 9 cm. Dwie przegródki na drobiazgi i kable."}
]' where id = 'organizer' and variants = '[]';

-- Zamówienia
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  number bigint generated always as identity (start with 1001) unique,
  created_at timestamptz not null default now(),
  status text not null default 'nowe' check (status in ('nowe','oplacone','w_druku','wyslane','anulowane')),
  customer_name text not null,
  email text not null,
  phone text not null,
  locker text not null,
  notes text,
  subtotal numeric(10,2) not null,
  shipping numeric(10,2) not null,
  total numeric(10,2) not null,
  stripe_session_id text unique,
  paid_at timestamptz,
  tracking text
);

create table if not exists public.order_items (
  id bigint generated always as identity primary key,
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id text not null references public.products(id),
  nick text not null check (nick ~ '^[0-9A-Za-zĄĆĘŁŃÓŚŹŻąćęłńóśźż_-]{1,14}$'),
  base_color text not null,
  text_color text not null,
  light text check (light in ('cieply','zimny','czerwony','niebieski','fioletowy','zielony','rgb')), -- null = bez podświetlenia
  variant text, -- id wariantu z products.variants; null = produkt bez wariantów
  qty int not null check (qty between 1 and 20),
  unit_price numeric(10,2) not null
);
create index if not exists order_items_order_idx on public.order_items(order_id);

-- Administratorzy panelu: dodaj tu swoje konto (instrukcja w README).
create table if not exists public.admins (
  user_id uuid primary key references auth.users(id) on delete cascade
);

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.admins where user_id = auth.uid());
$$;

-- Zabezpieczenia (RLS). Klienci widzą tylko aktywne produkty.
-- Zamówienia tworzy wyłącznie funkcja create-checkout (klucz serwisowy), czyta i zmienia je tylko administrator.
alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.admins enable row level security;

drop policy if exists "produkty: odczyt aktywnych" on public.products;
create policy "produkty: odczyt aktywnych" on public.products for select using (active or public.is_admin());
drop policy if exists "produkty: admin zmienia" on public.products;
create policy "produkty: admin zmienia" on public.products for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "zamowienia: admin czyta" on public.orders;
create policy "zamowienia: admin czyta" on public.orders for select using (public.is_admin());
drop policy if exists "zamowienia: admin zmienia" on public.orders;
create policy "zamowienia: admin zmienia" on public.orders for update using (public.is_admin()) with check (public.is_admin());

drop policy if exists "pozycje: admin czyta" on public.order_items;
create policy "pozycje: admin czyta" on public.order_items for select using (public.is_admin());

drop policy if exists "admini: widzą siebie" on public.admins;
create policy "admini: widzą siebie" on public.admins for select using (user_id = auth.uid());

-- Administrator może zmieniać tylko status i numer przesyłki, nie kwoty ani dane płatności.
revoke update on public.orders from authenticated;
grant update (status, tracking) on public.orders to authenticated;
