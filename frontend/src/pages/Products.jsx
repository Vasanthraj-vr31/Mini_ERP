import { useEffect, useState, useMemo } from 'react'
import api, { money } from '../api'
import { useAuth } from '../auth'
import { PageHeader, Field, Chip, Spinner, ViewToggle, Drawer, EmptyState, ProgressBar, Modal } from '../components/ui'
import DataTable from '../components/DataTable'
import { getProductImage } from '../data/productImages'

const blank = { name: '', sales_price: 0, cost_price: 0, on_hand_qty: 0, unit: 'Units',
  procure_on_demand: false, procurement_type: '', vendor_id: '', bom_id: '', photo: '' }

function ProductImage({ src, alt, className = '' }) {
  const [err, setErr] = useState(false)
  if (err || !src) {
    return (
      <div className={`bg-gradient-to-br from-rose-100 to-rose-200 flex items-center justify-center ${className}`}>
        <span className="text-xl opacity-50">🛋️</span>
      </div>
    )
  }
  return <img src={src} alt={alt} onError={() => setErr(true)} className={`object-cover ${className}`} loading="lazy" />
}

const CATEGORIES = ['All', 'In Stock', 'Low Stock', 'Out of Stock', 'Make-to-Order']

function classify(r) {
  if (r.procure_on_demand) return 'Make-to-Order'
  if (r.free_to_use_qty > 10) return 'In Stock'
  if (r.free_to_use_qty > 0)  return 'Low Stock'
  return 'Out of Stock'
}

// ─── Cart Drawer for Customers ───
function CartDrawer({ cart, setCart, onClose, onOrderPlaced }) {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)

  const total = cart.reduce((s, i) => s + i.price * i.qty, 0)

  const updateQty = (id, qty) => {
    if (qty <= 0) { setCart(c => c.filter(i => i.id !== id)); return }
    setCart(c => c.map(i => i.id === id ? { ...i, qty } : i))
  }

  const placeOrder = async () => {
    setLoading(true)
    try {
      const lines = cart.map(i => ({ product_id: i.id, ordered_qty: i.qty }))
      const res = await api.post('/sales-orders/place-order', { lines })
      setResult(res.data)
      setCart([])
    } catch (e) {
      alert(e.response?.data?.detail || e.message)
    } finally {
      setLoading(false)
    }
  }

  const statusColor = {
    CONFIRMED: 'text-success', PENDING_PROCUREMENT: 'text-info',
    BACKORDER: 'text-warning', OUT_OF_STOCK: 'text-danger'
  }

  if (result) {
    const order = result.order
    return (
      <Modal title="Order Placed! 🎉" onClose={() => { setResult(null); onClose(); onOrderPlaced?.() }} size="max-w-lg">
        <div className="space-y-4">
          <div className="text-center py-4">
            <div className="text-5xl mb-3">✅</div>
            <div className="font-semibold text-xl text-ink-900">Order {order.reference}</div>
            <div className={`text-sm font-semibold mt-1 ${statusColor[order.status] || 'text-ink-500'}`}>{order.status}</div>
          </div>

          {result.procured?.length > 0 && (
            <div className="bg-info-bg border border-info/20 rounded-xl p-4">
              <div className="text-xs font-bold text-info mb-2 uppercase tracking-wider">Auto-Procurement Triggered</div>
              {result.procured.map((p, i) => (
                <div key={i} className="text-sm text-ink-700 flex items-center gap-2">
                  <span>{p.type === 'PO' ? '📦' : '⚙️'}</span>
                  <span>{p.reference} — {p.qty} × {p.product}</span>
                </div>
              ))}
            </div>
          )}

          {result.warnings?.length > 0 && (
            <div className="bg-warning-bg border border-warning/20 rounded-xl p-4">
              <div className="text-xs font-bold text-warning mb-2 uppercase tracking-wider">Stock Warnings</div>
              {result.warnings.map((w, i) => (
                <div key={i} className="text-sm text-ink-700">⚠️ {w.product}: only {w.free_to_use} in stock (ordered {w.ordered})</div>
              ))}
            </div>
          )}

          <div className="bg-paper-50 rounded-xl p-4 border border-line">
            <div className="flex justify-between text-sm font-semibold text-ink-900">
              <span>Order Total</span>
              <span className="text-burgundy-800">{money(order.total)}</span>
            </div>
          </div>
        </div>
      </Modal>
    )
  }

  return (
    <Drawer open={true} title={`Cart (${cart.length} items)`} onClose={onClose} width="max-w-md">
      {cart.length === 0 ? (
        <EmptyState title="Your cart is empty" type="default" />
      ) : (
        <div className="flex flex-col h-full pb-24 space-y-3">
          {cart.map(item => (
            <div key={item.id} className="flex items-center gap-3 bg-paper-50 p-3 rounded-xl border border-line">
              <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0 border border-line bg-white">
                <ProductImage src={item.photo} alt={item.name} className="w-full h-full" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm text-ink-900 truncate">{item.name}</div>
                <div className="text-xs text-ink-500">{money(item.price)} each</div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button onClick={() => updateQty(item.id, item.qty - 1)}
                  className="w-7 h-7 rounded-full bg-paper-0 border border-line hover:bg-rose-50 text-ink-700 flex items-center justify-center font-bold">−</button>
                <span className="w-8 text-center font-mono text-sm font-semibold">{item.qty}</span>
                <button onClick={() => updateQty(item.id, item.qty + 1)}
                  className="w-7 h-7 rounded-full bg-paper-0 border border-line hover:bg-rose-50 text-ink-700 flex items-center justify-center font-bold">+</button>
              </div>
              <div className="text-sm font-semibold text-burgundy-800 shrink-0 w-20 text-right">{money(item.price * item.qty)}</div>
            </div>
          ))}
        </div>
      )}
      <div className="fixed bottom-0 right-0 w-full max-w-md p-4 bg-paper-0 border-t border-line z-10">
        <div className="flex justify-between items-center mb-3">
          <span className="text-sm font-semibold text-ink-700">Total</span>
          <span className="font-display text-xl text-burgundy-800">{money(total)}</span>
        </div>
        <button className="btn-primary w-full" onClick={placeOrder} disabled={loading || cart.length === 0}>
          {loading ? 'Placing Order…' : '🛒 Place Order'}
        </button>
      </div>
    </Drawer>
  )
}

// ─── Product Card (Customer View) ───
function CustomerProductCard({ r, onAddToCart, inCart }) {
  const cls = classify(r)
  const isLow = cls === 'Low Stock' || cls === 'Out of Stock'
  const isMto = cls === 'Make-to-Order'
  const pct = r.on_hand_qty > 0 ? (r.free_to_use_qty / r.on_hand_qty) * 100 : 0

  return (
    <div className="card overflow-hidden group transition-all duration-300 hover:shadow-card-hover hover:-translate-y-1">
      <div className="relative h-48 w-full overflow-hidden bg-rose-50">
        <ProductImage src={r.photo || getProductImage(r.name, null, r.id)} alt={r.name}
          className="w-full h-full group-hover:scale-105 transition-transform duration-700 ease-out" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-80" />
        <div className="absolute top-3 left-3">
          <Chip tone={isMto ? 'info' : isLow ? 'danger' : 'success'} className="shadow-sm backdrop-blur-md bg-white/90">
            {isMto ? 'Made to Order' : cls}
          </Chip>
        </div>
        <div className="absolute bottom-3 left-3 right-3 flex justify-between items-end">
          <div className="font-mono text-xs text-white/80 font-medium tracking-wider">{r.reference}</div>
          <div className="bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg text-sm font-semibold text-burgundy-800 shadow-sm">
            {money(r.sales_price)}
          </div>
        </div>
      </div>

      <div className="p-4 bg-paper-0">
        <div className="font-medium text-base text-ink-900 leading-tight mb-3 line-clamp-1">{r.name}</div>

        {!isMto && (
          <div className="mb-3">
            <div className="flex justify-between text-[11px] text-ink-500 mb-1.5 font-medium">
              <span>{Math.max(0, r.free_to_use_qty)} available</span>
              <span>{r.unit}</span>
            </div>
            <ProgressBar value={Math.max(0, pct)} max={100} tone={isLow ? 'danger' : 'success'} className="h-1.5" />
          </div>
        )}
        {isMto && <div className="text-xs text-ink-400 italic mb-3">Manufactured on demand</div>}

        <button
          onClick={() => onAddToCart(r)}
          className={`w-full py-2 px-4 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2
            ${inCart
              ? 'bg-success/10 text-success border border-success/30 hover:bg-success/20'
              : 'btn-primary'
            }`}>
          {inCart ? '✓ In Cart' : '+ Add to Cart'}
        </button>
      </div>
    </div>
  )
}

// ─── Admin Kanban Card ───
function KanbanProducts({ rows, onEdit }) {
  if (!rows?.length) return <EmptyState title="No products found" type="product" />
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {rows.map(r => {
        const cls = classify(r)
        const isLow = cls === 'Low Stock' || cls === 'Out of Stock'
        const isMto = cls === 'Make-to-Order'
        const pct = r.on_hand_qty > 0 ? (r.free_to_use_qty / r.on_hand_qty) * 100 : 0
        return (
          <div key={r.id} onClick={() => onEdit(r)}
            className="card overflow-hidden group cursor-pointer hover:shadow-card-hover transition-all duration-300">
            <div className="relative h-48 w-full overflow-hidden bg-rose-50">
              <ProductImage src={r.photo || getProductImage(r.name, null, r.id)} alt={r.name}
                className="w-full h-full group-hover:scale-105 transition-transform duration-700 ease-out" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-80" />
              <div className="absolute top-3 left-3">
                <Chip tone={isMto ? 'info' : isLow ? 'danger' : 'success'} className="shadow-sm backdrop-blur-md bg-white/90">
                  {isMto ? 'MTO' : cls}
                </Chip>
              </div>
              <div className="absolute bottom-3 left-3 right-3 flex justify-between items-end">
                <div className="font-mono text-xs text-white/80 font-medium tracking-wider">{r.reference}</div>
                <div className="bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg text-sm font-semibold text-burgundy-800 shadow-sm">
                  {money(r.sales_price)}
                </div>
              </div>
            </div>
            <div className="p-4 bg-paper-0">
              <div className="font-medium text-base text-ink-900 leading-tight mb-3 line-clamp-1 group-hover:text-burgundy-800 transition-colors">{r.name}</div>
              {!isMto && (
                <div>
                  <div className="flex justify-between text-[11px] text-ink-500 mb-1.5 font-medium">
                    <span>{Math.max(0, r.free_to_use_qty)} Free to use</span>
                    <span>{r.on_hand_qty} Total</span>
                  </div>
                  <ProgressBar value={Math.max(0, pct)} max={100} tone={isLow ? 'danger' : 'success'} className="h-1.5" />
                </div>
              )}
              {isMto && <div className="text-xs text-ink-400 italic">Procure on demand</div>}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── Main Export ───
export default function Products() {
  const { isCustomer } = useAuth()
  const customerMode = isCustomer()

  const [rows, setRows] = useState(null)
  const [edit, setEdit] = useState(null)
  const [vendors, setVendors] = useState([])
  const [boms, setBoms] = useState([])
  const [view, setView] = useState('kanban')
  const [category, setCategory] = useState('All')
  const [search, setSearch] = useState('')
  const [cart, setCart] = useState([])
  const [showCart, setShowCart] = useState(false)

  const load = () => api.get('/products').then(r => {
    const enriched = r.data.map(p => ({
      ...p, photo: p.photo || getProductImage(p.name, null, p.id)
    }))
    setRows(enriched)
  })

  useEffect(() => {
    load()
    if (!customerMode) {
      api.get('/vendors').then(r => setVendors(r.data))
      api.get('/boms').then(r => setBoms(r.data))
    }
  }, [])

  const save = async () => {
    const body = { ...edit,
      vendor_id: edit.vendor_id || null, bom_id: edit.bom_id || null,
      sales_price: +edit.sales_price, cost_price: +edit.cost_price, on_hand_qty: +edit.on_hand_qty,
      photo: edit.photo || null }
    if (edit.id) await api.put(`/products/${edit.id}`, body)
    else await api.post('/products', body)
    setEdit(null); load()
  }

  const filtered = useMemo(() => {
    if (!rows) return []
    return rows.filter(r => {
      const q = search.toLowerCase()
      const mSearch = !q || r.name.toLowerCase().includes(q) || r.reference.toLowerCase().includes(q)
      const mCat = category === 'All' || classify(r) === category
      return mSearch && mCat
    })
  }, [rows, search, category])

  if (!rows) return <Spinner />

  const openEdit = (r) => {
    if (customerMode) return // customers can't edit
    setEdit({ ...blank, ...r, vendor_id: r.vendor_id || '', bom_id: r.bom_id || '', photo: r.photo || '' })
  }

  const addToCart = (product) => {
    setCart(c => {
      const exists = c.find(i => i.id === product.id)
      if (exists) return c.map(i => i.id === product.id ? { ...i, qty: i.qty + 1 } : i)
      return [...c, { id: product.id, name: product.name, price: product.sales_price, qty: 1, photo: product.photo }]
    })
  }

  const cartCount = cart.reduce((s, i) => s + i.qty, 0)

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={customerMode ? 'Shop Products' : 'Product Catalog'}
        subtitle={customerMode ? 'Browse & order products' : 'Master Data'}
        actions={<>
          {!customerMode && <ViewToggle view={view} setView={setView} />}
          {customerMode && (
            <button className="btn-primary relative" onClick={() => setShowCart(true)}>
              🛒 Cart
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-danger text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </button>
          )}
          {!customerMode && (
            <button className="btn-primary" onClick={() => setEdit({ ...blank })}>
              <span className="text-lg leading-none">+</span> New Product
            </button>
          )}
        </>} />

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 bg-paper-0 p-3 rounded-2xl border border-line shadow-sm">
        <div className="flex gap-1.5 overflow-x-auto w-full sm:w-auto no-scrollbar py-1">
          {CATEGORIES.map(c => (
            <button key={c} onClick={() => setCategory(c)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all duration-200 ${
                category === c ? 'bg-burgundy-800 text-white shadow-sm' : 'bg-paper-50 text-ink-500 hover:bg-rose-100 hover:text-burgundy-900'
              }`}>
              {c}
            </button>
          ))}
        </div>
        <div className="relative w-full sm:w-64 shrink-0">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input type="text" placeholder="Search products…" value={search} onChange={e => setSearch(e.target.value)}
            className="input pl-9 py-2 text-sm w-full bg-paper-50 border-transparent focus:bg-paper-0 focus:border-rose-300" />
        </div>
      </div>

      {/* Customer mode: card grid */}
      {customerMode ? (
        filtered.length === 0
          ? <EmptyState title="No products found" type="product" />
          : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filtered.map(r => (
                <CustomerProductCard
                  key={r.id} r={r}
                  onAddToCart={addToCart}
                  inCart={cart.some(i => i.id === r.id)}
                />
              ))}
            </div>
          )
      ) : (
        // Admin mode: list or kanban
        view === 'list' ? (
          <div className="card overflow-hidden">
            <DataTable onRow={openEdit}
              columns={[
                { key: 'photo', label: '', render: (r) => (
                  <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 border border-line/40">
                    <ProductImage src={r.photo || getProductImage(r.name, null, r.id)} alt={r.name} className="w-full h-full" />
                  </div>
                )},
                { key: 'reference', label: 'Reference', mono: true },
                { key: 'name', label: 'Product', render: r => <span className="font-medium text-ink-900">{r.name}</span> },
                { key: 'sales_price', label: 'Price', right: true, render: r => <span className="font-semibold text-burgundy-800">{money(r.sales_price)}</span> },
                { key: 'on_hand_qty', label: 'On Hand', right: true, mono: true },
                { key: 'free_to_use_qty', label: 'Free to Use', right: true, mono: true,
                  render: r => <span className={r.free_to_use_qty < 0 ? 'text-danger font-semibold bg-danger-bg px-1.5 py-0.5 rounded' : ''}>{r.free_to_use_qty}</span> },
                { key: 'pod', label: 'Strategy', render: r => r.procure_on_demand ? <Chip tone="info">MTO</Chip> : <Chip tone="neutral">MTS</Chip> },
                { key: 'procurement_type', label: 'Proc. Type', render: r => r.procurement_type ? <Chip tone="neutral">{r.procurement_type}</Chip> : '—' },
              ]} rows={filtered} />
          </div>
        ) : (
          <KanbanProducts rows={filtered} onEdit={openEdit} />
        )
      )}

      {/* Cart Drawer (Customer only) */}
      {showCart && (
        <CartDrawer
          cart={cart} setCart={setCart}
          onClose={() => setShowCart(false)}
          onOrderPlaced={load}
        />
      )}

      {/* Admin Edit Drawer */}
      {!customerMode && (
        <Drawer open={!!edit} onClose={() => setEdit(null)} title={edit?.id ? edit.reference : 'New Product'} width="max-w-md">
          {edit && (
            <div className="flex flex-col h-full space-y-5 pb-20">
              <div className="relative rounded-xl overflow-hidden h-48 bg-rose-50 border border-line group">
                <ProductImage src={edit.photo || getProductImage(edit.name, null, edit.id)} alt={edit.name} className="w-full h-full" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <span className="text-white text-xs font-medium px-3 py-1 bg-black/50 rounded-full backdrop-blur-sm">Edit Photo URL below</span>
                </div>
              </div>

              <Field label="Product Name">
                <input className="input" value={edit.name} onChange={e => setEdit({ ...edit, name: e.target.value })} placeholder="e.g. Wooden Dining Chair" />
              </Field>
              <Field label="Photo URL">
                <input className="input text-xs font-mono" placeholder="Leave empty for auto-image" value={edit.photo}
                  onChange={e => setEdit({ ...edit, photo: e.target.value })} />
              </Field>

              <div className="grid grid-cols-2 gap-4">
                <Field label="Sales Price (₹)">
                  <input className="input" type="number" value={edit.sales_price} onChange={e => setEdit({ ...edit, sales_price: e.target.value })} />
                </Field>
                <Field label="Cost Price (₹)">
                  <input className="input" type="number" value={edit.cost_price} onChange={e => setEdit({ ...edit, cost_price: e.target.value })} />
                </Field>
                <Field label="On Hand Qty">
                  <input className="input" type="number" value={edit.on_hand_qty} onChange={e => setEdit({ ...edit, on_hand_qty: e.target.value })} />
                </Field>
                <Field label="Free to Use">
                  <input className="input bg-paper-50" disabled value={edit.id ? (edit.free_to_use_qty ?? '—') : 'Auto'} />
                </Field>
              </div>

              <div className="p-4 rounded-xl bg-info-bg/30 border border-info/20 mt-2">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input type="checkbox" className="mt-1 accent-burgundy-800" checked={edit.procure_on_demand}
                    onChange={e => setEdit({ ...edit, procure_on_demand: e.target.checked })} />
                  <div>
                    <div className="text-sm font-semibold text-ink-900">Procure on Demand (MTO)</div>
                    <div className="text-xs text-ink-500 mt-0.5 leading-relaxed">Automatically trigger procurement when a sales order is placed.</div>
                  </div>
                </label>

                {edit.procure_on_demand && (
                  <div className="space-y-4 mt-4 pt-4 border-t border-info/20">
                    <Field label="Procurement Type">
                      <select className="input" value={edit.procurement_type}
                        onChange={e => setEdit({ ...edit, procurement_type: e.target.value })}>
                        <option value="">Select type…</option>
                        <option value="Purchase">PURCHASE</option>
                        <option value="Manufacturing">MANUFACTURE</option>
                      </select>
                    </Field>
                    {edit.procurement_type === 'Purchase' && (
                      <Field label="Preferred Vendor">
                        <select className="input" value={edit.vendor_id}
                          onChange={e => setEdit({ ...edit, vendor_id: e.target.value })}>
                          <option value="">Select vendor…</option>
                          {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                        </select>
                      </Field>
                    )}
                    {edit.procurement_type === 'Manufacturing' && (
                      <Field label="Bill of Materials">
                        <select className="input" value={edit.bom_id}
                          onChange={e => setEdit({ ...edit, bom_id: e.target.value })}>
                          <option value="">Select BOM…</option>
                          {boms.map(b => <option key={b.id} value={b.id}>{b.reference}</option>)}
                        </select>
                      </Field>
                    )}
                  </div>
                )}
              </div>

              <div className="absolute bottom-0 left-0 right-0 p-4 bg-paper-0 border-t border-line flex justify-end gap-2">
                <button className="btn-secondary" onClick={() => setEdit(null)}>Cancel</button>
                <button className="btn-primary" onClick={save}>Save Product</button>
              </div>
            </div>
          )}
        </Drawer>
      )}
    </div>
  )
}
