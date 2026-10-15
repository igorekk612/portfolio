import { lazy, Suspense, useState } from 'react'
import { cleanNick, SHOP } from '../config'
import { estimate, filament, FILAMENTS, light, LIGHTS, pln, RGB_EXTRA, unitPrice, variant as findVariant, type Product, type ProductId } from '../lib/catalog'
import { useCart } from '../state/cart'

const Preview3D = lazy(() => import('./Preview3D'))

export function NickInput({ value, onChange, id = 'nick' }: { value: string; onChange: (v: string) => void; id?: string }) {
  const [warn, setWarn] = useState(false)
  return (
    <div className="field">
      <label htmlFor={id}>Nick lub imię</label>
      <input id={id} className="input-nick" type="text" value={value} maxLength={SHOP.nickMax} autoComplete="off" spellCheck={false}
        onChange={e => { const c = cleanNick(e.target.value); setWarn(c !== e.target.value); onChange(c) }} />
      <span className={warn ? 'hint err' : 'hint'}>
        {warn ? 'Usunąłem znaki spoza listy: litery, cyfry, _ i -.' : `Do ${SHOP.nickMax} znaków: litery (także polskie), cyfry, _ i -. Zostało ${SHOP.nickMax - value.length}.`}
      </span>
    </div>
  )
}

export function Swatches({ label, value, onChange, id }: { label: string; value: string; onChange: (v: string) => void; id: string }) {
  return (
    <div className="field">
      <span className="lbl" id={id}>{label} · <span className="muted" style={{ fontWeight: 400 }}>{filament(value).name.toLowerCase()}</span></span>
      <div className="swatches" role="group" aria-labelledby={id}>
        {FILAMENTS.map(f => (
          <button key={f.id} type="button" className="sw" style={{ background: f.hex }} aria-label={f.name} title={f.name}
            aria-pressed={f.id === value} onClick={() => onChange(f.id)} />
        ))}
      </div>
    </div>
  )
}

export function LightPicker({ value, onChange, ledPrice }: { value: string | null; onChange: (v: string | null) => void; ledPrice: number }) {
  const l = light(value)
  return (
    <div className="field">
      <span className="lbl" id="lbl-led">Podświetlenie napisu</span>
      <div className="seg" role="group" aria-labelledby="lbl-led">
        <button type="button" aria-pressed={!value} onClick={() => onChange(null)}>Bez podświetlenia</button>
        <button type="button" aria-pressed={!!value} onClick={() => onChange(value ?? 'cieply')}>Świecący napis LED +{pln(ledPrice)}</button>
      </div>
      {l && (
        <>
          <span className="lbl" id="lbl-light" style={{ marginTop: 6 }}>Kolor światła · <span className="muted" style={{ fontWeight: 400 }}>{l.name.toLowerCase()}{l.id === 'rgb' ? ` (+${pln(RGB_EXTRA)})` : ''}</span></span>
          <div className="swatches" role="group" aria-labelledby="lbl-light">
            {LIGHTS.map(x => (
              <button key={x.id} type="button" className={`sw light${x.id === 'rgb' ? ' rgb' : ''}`} style={{ ['--glow' as string]: x.hex }}
                aria-label={x.name} title={x.name} aria-pressed={x.id === value} onClick={() => onChange(x.id)} />
            ))}
          </div>
          <span className="hint">Świecący napis drukujemy z półprzezroczystego filamentu, a za nim montujemy taśmę LED zasilaną z USB. Kolor napisu wyznacza światło.</span>
        </>
      )}
    </div>
  )
}

export function Stage(props: { id: ProductId; nick: string; base: string; text: string; light?: string | null; variant?: string | null; autoRotate?: boolean; name: string }) {
  const l = light(props.light)
  const label = `Podgląd 3D: ${props.name}, napis „${props.nick || 'Twój nick'}”, kolor ${filament(props.base).name.toLowerCase()}, ${l ? `napis podświetlony: ${l.name.toLowerCase()}` : `napis ${filament(props.text).name.toLowerCase()}`}`
  return (
    <Suspense fallback={<div className="preview3d" aria-label="Ładuję podgląd 3D" />}>
      <Preview3D id={props.id} nick={props.nick} base={filament(props.base).hex} text={filament(props.text).hex} glow={l ? (l.id === 'rgb' ? 'rgb' : l.hex) : null} variant={props.variant ?? null} autoRotate={props.autoRotate} label={label} />
    </Suspense>
  )
}

export default function Configurator({ product, products, onProduct }: { product: Product; products: Product[]; onProduct: (id: ProductId) => void }) {
  const { add, setOpen, design, setDesign } = useCart()
  const { nick, base, text } = design
  const lightId = product.ledPrice != null ? design.light : null
  const setLight = (v: string | null) => setDesign({ light: v })
  const setNick = (v: string) => setDesign({ nick: v })
  const setBase = (v: string) => setDesign({ base: v })
  const setText = (v: string) => setDesign({ text: v })
  const v = findVariant(product, design.variants[product.id])
  const variantId = v?.id ?? null
  const [added, setAdded] = useState('')
  const est = estimate(product, nick, variantId)

  return (
    <div className="configurator">
      <div style={{ display: 'grid', gap: 10, minWidth: 0 }}>
        <Stage id={product.id} nick={nick} base={base} text={text} light={lightId} variant={variantId} name={product.name} />
        <div className="spec" aria-live="polite">
          <span>warstwa <b>0,20 mm</b></span><span>filament <b className="tnum">{est.grams} g</b></span>
          <span>druk <b className="tnum">{est.time}</b></span><span>materiał <b>PLA</b></span>
        </div>
      </div>
      <form className="config-panel" onSubmit={e => {
        e.preventDefault()
        if (!nick) return
        add({ productId: product.id, nick, base, text, light: lightId, variant: variantId })
        setAdded(`Dodano: ${product.short}${v && product.variants.length > 1 ? ` (${v.name.toLowerCase()})` : ''} z nickiem ${nick}${lightId ? ' i podświetleniem' : ''}.`)
      }}>
        <span className="eyebrow">Personalizacja</span>
        <h1>{product.name}</h1>
        <p className="muted">{product.desc}</p>
        {products.length > 1 && <div className="field">
          <span className="lbl" id="lbl-prod">Produkt</span>
          <div className="seg" role="group" aria-labelledby="lbl-prod">
            {products.map(p => <button key={p.id} type="button" aria-pressed={p.id === product.id} onClick={() => onProduct(p.id)}>{p.short}</button>)}
          </div>
        </div>}
        {product.variants.length > 1 && (
          <div className="field">
            <span className="lbl" id="lbl-var">Wariant</span>
            <div className="seg" role="group" aria-labelledby="lbl-var">
              {product.variants.map(x => (
                <button key={x.id} type="button" aria-pressed={x.id === variantId}
                  onClick={() => { setDesign({ variants: { ...design.variants, [product.id]: x.id } }); setAdded('') }}>
                  {x.name}{x.priceDelta ? ` ${x.priceDelta > 0 ? '+' : '−'}${pln(Math.abs(x.priceDelta))}` : ''}
                </button>
              ))}
            </div>
            {v && <span className="hint">{v.desc}</span>}
          </div>
        )}
        <NickInput value={nick} onChange={v => { setNick(v); setAdded('') }} />
        <div className="colors2">
          <Swatches id="lbl-base" label="Kolor produktu" value={base} onChange={v => { setBase(v); setAdded('') }} />
          {!lightId && <Swatches id="lbl-text" label="Kolor napisu" value={text} onChange={v => { setText(v); setAdded('') }} />}
        </div>
        {product.ledPrice != null && <LightPicker value={lightId} ledPrice={product.ledPrice} onChange={v => { setLight(v); setAdded('') }} />}
        {!lightId && base === text && <span className="hint err">Napis w kolorze produktu będzie słabo widoczny. Wybierz inny kolor napisu.</span>}
        <ul className="details">{product.details.map(d => <li key={d}>{d}</li>)}</ul>
        <div className="price-row">
          <div><div className="price">{pln(unitPrice(product, lightId, variantId))}</div><span className="hint">+ dostawa do paczkomatu {pln(SHOP.shippingPln)}</span></div>
          <button className="btn" type="submit" disabled={!nick}>Dodaj do koszyka</button>
        </div>
        {added && <div className="toast" role="status">{added} <button type="button" className="link" onClick={() => setOpen(true)}>Zobacz koszyk</button></div>}
      </form>
    </div>
  )
}
