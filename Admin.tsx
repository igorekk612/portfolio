import { useEffect, useMemo, useState } from 'react'
import { Swatch } from '../components/Layout'
import { IS_DEMO } from '../config'
import { listOrders, signIn, signOut, STATUS_LABEL, supabase, updateOrder, type OrderRow, type OrderStatus } from '../lib/api'
import { filament, light, pln, product, variant } from '../lib/catalog'

// Przykładowe zamówienia pokazywane tylko w trybie demo, żeby było widać, jak działa panel.
const EXAMPLES: OrderRow[] = [
  { id: 'ex1', number: 1003, created_at: new Date(Date.now() - 36e5).toISOString(), status: 'oplacone', customer_name: 'Przykład: Jan Kowalski', email: 'jan@example.com', phone: '500 000 000', locker: 'KRA01M', notes: null, total: 131.99, tracking: null,
    order_items: [{ product_id: 'uchwyt', nick: 'KubaGG', base_color: 'czarny', text_color: 'pomaranczowy', light: null, variant: null, qty: 1, unit_price: 119 }] },
  { id: 'ex2', number: 1002, created_at: new Date(Date.now() - 864e5).toISOString(), status: 'w_druku', customer_name: 'Przykład: Anna Nowak', email: 'anna@example.com', phone: '600 000 000', locker: 'WAW22A', notes: 'Prezent, bez paragonu w paczce', total: 255.99, tracking: null,
    order_items: [{ product_id: 'zestaw', nick: 'Ola_2010', base_color: 'bialy', text_color: 'fioletowy', light: 'fioletowy', variant: null, qty: 1, unit_price: 218 }, { product_id: 'brelok', nick: 'Ola_2010', base_color: 'fioletowy', text_color: 'bialy', light: null, variant: null, qty: 1, unit_price: 25 }] },
  { id: 'ex3', number: 1001, created_at: new Date(Date.now() - 3 * 864e5).toISOString(), status: 'wyslane', customer_name: 'Przykład: Piotr Zieliński', email: 'piotr@example.com', phone: '700 000 000', locker: 'GDA05N', notes: null, total: 71.99, tracking: '6200 1234 5678 9012',
    order_items: [{ product_id: 'tabliczka', nick: 'Zielu', base_color: 'szary', text_color: 'zielony', light: null, variant: null, qty: 1, unit_price: 59 }] },
]

function Login({ onDone }: { onDone: () => void }) {
  const [email, setEmail] = useState(''); const [pass, setPass] = useState(''); const [err, setErr] = useState(''); const [busy, setBusy] = useState(false)
  return (
    <form className="panel" style={{ maxWidth: 420, margin: '0 auto' }} onSubmit={async e => {
      e.preventDefault(); setBusy(true); const r = await signIn(email, pass); setBusy(false)
      if (r.error) setErr(r.error); else onDone()
    }}>
      <h2>Panel sklepu</h2>
      <div className="field"><label htmlFor="a-email">E-mail</label><input id="a-email" type="email" value={email} onChange={e => setEmail(e.target.value)} autoComplete="username" /></div>
      <div className="field"><label htmlFor="a-pass">Hasło</label><input id="a-pass" type="password" value={pass} onChange={e => setPass(e.target.value)} autoComplete="current-password" /></div>
      {err && <div className="alert err" role="alert">{err}</div>}
      <button className="btn block" disabled={busy}>{busy ? 'Loguję…' : 'Zaloguj'}</button>
    </form>
  )
}

function Order({ o, onSave }: { o: OrderRow; onSave: (id: string, patch: Partial<OrderRow>) => Promise<string | null> }) {
  const [status, setStatus] = useState<OrderStatus>(o.status)
  const [tracking, setTracking] = useState(o.tracking ?? '')
  const [msg, setMsg] = useState('')
  const dirty = status !== o.status || tracking !== (o.tracking ?? '')
  return (
    <article className={`order s-${o.status}`}>
      <div className="order-top">
        <h3>#{o.number} · {o.customer_name}</h3>
        <span className="muted tnum">{new Date(o.created_at).toLocaleString('pl-PL', { dateStyle: 'short', timeStyle: 'short' })} · <b style={{ color: 'var(--ink)' }}>{pln(o.total)}</b> · {STATUS_LABEL[o.status]}</span>
      </div>
      <div className="order-items">
        {o.order_items.map((it, i) => {
          const b = filament(it.base_color); const t = filament(it.text_color)
          return (
            <div key={i}>
              <span>{it.qty} × {product(it.product_id).name}{it.variant && product(it.product_id).variants.length > 1 ? ` · ${variant(product(it.product_id), it.variant)?.name}` : ''}</span>
              <span className="nick-tag">{it.nick}</span>
              <span className="muted"><Swatch hex={b.hex} /> {b.name} · {light(it.light) ? <><Swatch hex={light(it.light)!.hex} /> <b style={{ color: 'var(--warn)' }}>LED</b> {light(it.light)!.name.toLowerCase()}</> : <><Swatch hex={t.hex} /> napis {t.name.toLowerCase()}</>}</span>
            </div>
          )
        })}
      </div>
      <div className="muted" style={{ fontSize: 14 }}>Paczkomat <b style={{ color: 'var(--ink)' }}>{o.locker}</b> · {o.phone} · {o.email}{o.notes ? ` · Uwagi: ${o.notes}` : ''}</div>
      <div className="order-actions">
        <div className="field"><label htmlFor={`st-${o.id}`}>Status</label>
          <select id={`st-${o.id}`} value={status} onChange={e => setStatus(e.target.value as OrderStatus)}>
            {(Object.keys(STATUS_LABEL) as OrderStatus[]).map(s => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
          </select></div>
        <div className="field"><label htmlFor={`tr-${o.id}`}>Numer przesyłki</label>
          <input id={`tr-${o.id}`} type="text" value={tracking} onChange={e => setTracking(e.target.value)} placeholder="np. 6200 1234…" /></div>
        <button className="btn" disabled={!dirty} onClick={async () => { const e = await onSave(o.id, { status, tracking: tracking || null }); setMsg(e ?? 'Zapisano') }}>Zapisz</button>
        {msg && <span className="toast" role="status">{msg}</span>}
      </div>
    </article>
  )
}

export default function Admin() {
  const [authed, setAuthed] = useState<boolean | null>(IS_DEMO ? true : null)
  const [rows, setRows] = useState<OrderRow[]>(IS_DEMO ? EXAMPLES : [])
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<OrderStatus | 'all'>('all')

  useEffect(() => {
    if (!supabase) return
    supabase.auth.getSession().then(({ data }) => setAuthed(!!data.session))
  }, [])
  useEffect(() => {
    if (IS_DEMO || !authed) return
    listOrders().then(r => { setRows(r.rows); setError(r.error) })
  }, [authed])

  const counts = useMemo(() => rows.reduce((m, r) => ({ ...m, [r.status]: (m[r.status] ?? 0) + 1 }), {} as Record<string, number>), [rows])
  const shown = filter === 'all' ? rows : rows.filter(r => r.status === filter)

  const save = async (id: string, patch: Partial<OrderRow>) => {
    if (IS_DEMO) { setRows(rs => rs.map(r => r.id === id ? { ...r, ...patch } : r)); return null }
    const r = await updateOrder(id, patch as never)
    if (!r.error) setRows(rs => rs.map(x => x.id === id ? { ...x, ...patch } : x))
    return r.error
  }

  if (authed === null) return <div className="page"><div className="wrap muted">Sprawdzam logowanie…</div></div>
  if (!authed) return <div className="page"><div className="wrap"><Login onDone={() => setAuthed(true)} /></div></div>

  return (
    <div className="page"><div className="wrap">
      <div className="admin-head">
        <div style={{ display: 'grid', gap: 6 }}>
          <span className="eyebrow">Panel sklepu</span>
          <h1 style={{ fontSize: 34 }}>Zamówienia</h1>
        </div>
        {!IS_DEMO && <button className="btn ghost" onClick={async () => { await signOut(); setAuthed(false) }}>Wyloguj</button>}
      </div>
      {IS_DEMO && <div className="alert info" style={{ marginBottom: 16 }}>Tryb demo: poniżej są <b>przykładowe</b> zamówienia, żeby było widać, jak działa panel. Po podłączeniu Supabase zobaczysz tu prawdziwe zamówienia.</div>}
      {error && <div className="alert err" style={{ marginBottom: 16 }}>{error}</div>}
      <div className="stats" style={{ marginBottom: 16 }}>
        <button className="stat" style={{ cursor: 'pointer' }} onClick={() => setFilter('all')} aria-pressed={filter === 'all'}>Wszystkie <b>{rows.length}</b></button>
        {(Object.keys(STATUS_LABEL) as OrderStatus[]).map(s => (
          <button key={s} className="stat" style={{ cursor: 'pointer', borderColor: filter === s ? 'var(--ink)' : undefined }} onClick={() => setFilter(s)} aria-pressed={filter === s}>
            {STATUS_LABEL[s]} <b>{counts[s] ?? 0}</b>
          </button>
        ))}
      </div>
      <div className="orders">
        {shown.length === 0 ? <p className="muted">Brak zamówień w tym statusie.</p> : shown.map(o => <Order key={o.id + o.status + (o.tracking ?? '')} o={o} onSave={save} />)}
      </div>
    </div></div>
  )
}
