import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api, { money } from '../api'
import { useAuth } from '../auth'
import { PageHeader, StatusChip, Chip, Spinner, Field, Avatar, ViewToggle, Drawer, Modal, EmptyState } from '../components/ui'
import DataTable from '../components/DataTable'
import ActivityTimeline from '../components/ActivityTimeline'
import { ExportButton } from '../components/ExportButton'
import { getProductImage } from '../data/productImages'

// ─── Status Color Map ───
const STATUS_TONES = {
  PENDING: 'warning', CONFIRMED: 'success', PENDING_PROCUREMENT: 'info',
  BACKORDER: 'warning', OUT_OF_STOCK: 'danger', DISPATCHED: 'success',
  DELIVERED: 'success', CANCELLED: 'neutral',
}

// ─── Kanban for Admin (new status columns) ───
const SO_COLS = ['PENDING', 'CONFIRMED', 'PENDING_PROCUREMENT', 'BACKORDER', 'OUT_OF_STOCK', 'DISPATCHED', 'DELIVERED']
const COL_LABELS = {
  PENDING: 'Pending', CONFIRMED: 'Confirmed', PENDING_PROCUREMENT: 'Proc. Pending',
  BACKORDER: 'Backorder', OUT_OF_STOCK: 'Out of Stock', DISPATCHED: 'Dispatched', DELIVERED: 'Delivered',
}

function KanbanSO({ rows, onOpen }) {
  if (!rows?.length) return <EmptyState title="No sales orders yet" type="sales" />
  const activeRows = rows.filter(r => r.status !== 'CANCELLED')
  return (
    <div className="flex gap-3 overflow-x-auto pb-4 no-scrollbar">
      {SO_COLS.map((col) => {
        const cards = activeRows.filter(r => r.status === col)
        if (cards.length === 0 && !['PENDING','CONFIRMED','DISPATCHED'].includes(col)) return null
        return (
          <div key={col} className="kanban-col min-w-[200px] flex-shrink-0">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-ink-500">{COL_LABELS[col]}</span>
              <span className="bg-paper-0 text-ink-500 text-[10px] font-bold px-1.5 py-0.5 rounded-full border border-line">{cards.length}</span>
            </div>
            <div className="space-y-3">
              {cards.map(r => (
                <div key={r.id} onClick={() => onOpen(r)} className="kanban-card group cursor-pointer">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-xs font-semibold text-burgundy-800">{r.reference}</span>
                    <span className="text-[10px] text-ink-400">{r.created_at?.slice(0, 10)}</span>
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <Avatar name={r.customer} size="xs" />
                    <div className="font-medium text-sm text-ink-900 truncate group-hover:text-burgundy-800 transition-colors">{r.customer}</div>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-line/40">
                    <Chip tone={STATUS_TONES[r.status] || 'neutral'} className="text-[10px]">{r.status}</Chip>
                    <div className="font-semibold text-sm text-ink-900">{money(r.total)}</div>
                  </div>
                </div>
              ))}
              {cards.length === 0 && <div className="text-xs text-ink-300 text-center py-4 rounded-xl border border-dashed border-line/60 bg-paper-0/30">—</div>}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── Customer Order Tracking ───
function CustomerOrderCard({ order, onClick }) {
  const isFinal = ['DELIVERED', 'DISPATCHED'].includes(order.status)
  const isPending = ['PENDING', 'PENDING_PROCUREMENT', 'BACKORDER', 'OUT_OF_STOCK'].includes(order.status)

  return (
    <div className="card p-5 cursor-pointer hover:shadow-card-hover transition-all group" onClick={onClick}>
      <div className="flex items-start justify-between mb-3">
        <div>
          <span className="font-mono text-sm font-bold text-burgundy-800">{order.reference}</span>
          <div className="text-xs text-ink-400 mt-0.5">{order.created_at?.slice(0, 10)}</div>
        </div>
        <Chip tone={STATUS_TONES[order.status] || 'neutral'}>{order.status?.replace(/_/g, ' ')}</Chip>
      </div>
      <div className="flex gap-2 flex-wrap mb-3">
        {order.lines.map(l => (
          <div key={l.id} className="flex items-center gap-1.5 bg-paper-50 px-2 py-1 rounded-lg border border-line text-xs">
            <div className="w-5 h-5 rounded overflow-hidden shrink-0">
              <img src={getProductImage(l.product, null, l.product_id)} alt={l.product} className="w-full h-full object-cover" />
            </div>
            <span className="font-medium text-ink-800">{l.product}</span>
            <span className="text-ink-400">× {l.ordered_qty}</span>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between pt-3 border-t border-line">
        <div className="text-xs text-ink-500">
          {isPending && '⏳ Processing your order'}
          {order.status === 'CONFIRMED' && '✅ Stock confirmed, awaiting dispatch'}
          {order.status === 'DISPATCHED' && '🚚 Your order is on the way!'}
          {order.status === 'DELIVERED' && '📦 Delivered'}
          {order.status === 'CANCELLED' && '❌ Cancelled'}
        </div>
        <div className="font-semibold text-burgundy-800">{money(order.total)}</div>
      </div>
    </div>
  )
}

// ─── Admin Detail Modal ───
function DetailSO({ order, onClose, reload, isCustomerView }) {
  const navigate = useNavigate()
  const [result, setResult] = useState(null)
  const [deliveries, setDeliveries] = useState({})
  const [loading, setLoading] = useState(false)

  const canConfirm = order.status === 'PENDING'
  const canDispatch = ['CONFIRMED', 'PENDING_PROCUREMENT', 'BACKORDER'].includes(order.status)
  const canCancel = !['DELIVERED', 'DISPATCHED', 'CANCELLED'].includes(order.status)

  const act = async (path, body) => {
    setLoading(true)
    try {
      const { data } = await api.post(`/sales-orders/${order.id}/${path}`, body || {})
      if (path === 'confirm') setResult(data)
      await reload()
    } catch (e) {
      alert(e.response?.data?.detail || e.message)
    } finally {
      setLoading(false)
    }
  }

  const STEPS = ['PENDING', 'CONFIRMED', 'DISPATCHED', 'DELIVERED']
  const stepIdx = STEPS.indexOf(order.status)
  const currentStep = stepIdx >= 0 ? STEPS[stepIdx] : 'PENDING'

  return (
    <Modal title={`Order · ${order.reference}`} onClose={onClose} size="max-w-5xl">
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1 min-w-0">

          {/* Status strip */}
          <div className="flex items-center gap-3 flex-wrap mb-4">
            {STEPS.map((s, i) => (
              <div key={s} className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all
                  ${s === order.status ? 'bg-burgundy-800 text-white shadow-sm' :
                    STEPS.indexOf(order.status) > i ? 'bg-success text-white' : 'bg-paper-50 border border-line text-ink-400'}`}>
                  {STEPS.indexOf(order.status) > i ? '✓' : i + 1}
                </div>
                <span className={`text-xs font-semibold ${s === order.status ? 'text-burgundy-800' : 'text-ink-400'}`}>{s.replace(/_/g, ' ')}</span>
                {i < STEPS.length - 1 && <div className="w-6 h-px bg-line mx-1" />}
              </div>
            ))}
            {!STEPS.includes(order.status) && (
              <Chip tone={STATUS_TONES[order.status] || 'neutral'}>{order.status?.replace(/_/g, ' ')}</Chip>
            )}
          </div>

          {/* Admin action bar */}
          {!isCustomerView && (
            <div className="flex gap-2 mb-5 flex-wrap">
              {canConfirm && <button className="btn-primary" disabled={loading} onClick={() => act('confirm')}>✅ Process Order</button>}
              {canDispatch && <button className="btn-success" disabled={loading} onClick={() => act('deliver', { deliveries })}>🚚 Dispatch</button>}
              {canCancel && <button className="btn-secondary text-danger hover:bg-danger-bg" disabled={loading} onClick={() => act('cancel')}>Cancel</button>}
              <ExportButton filename={order.reference} data={order.lines} columns={[
                { key: 'product', label: 'Product' }, { key: 'ordered_qty', label: 'Ordered' },
                { key: 'delivered_qty', label: 'Dispatched' }, { key: 'sales_price', label: 'Unit Price' },
                { key: 'total', label: 'Total' }
              ]} />
            </div>
          )}

          {/* Auto-procurement result banner */}
          {result?.procured?.length > 0 && (
            <div className="mb-4 p-4 rounded-xl bg-info-bg border border-info/20 flex gap-3 animate-fade-in">
              <span className="text-xl">⚡</span>
              <div>
                <div className="text-sm font-semibold text-info mb-1">Procurement auto-triggered</div>
                {result.procured.map((p, i) => (
                  <div key={i} className="text-sm text-ink-900">Created {p.type} <span className="font-mono font-semibold">{p.reference}</span> — {p.qty} × {p.product}</div>
                ))}
              </div>
            </div>
          )}
          {result?.warnings?.length > 0 && (
            <div className="mb-4 p-4 rounded-xl bg-warning-bg border border-warning/20 flex gap-3 animate-fade-in">
              <span className="text-xl">⚠️</span>
              <div>
                <div className="text-sm font-semibold text-warning mb-1">Stock Shortage</div>
                {result.warnings.map((w, i) => (
                  <div key={i} className="text-sm text-ink-900"><span className="font-semibold">{w.product}:</span> ordered {w.ordered}, only {w.free_to_use} available</div>
                ))}
              </div>
            </div>
          )}

          {/* Info */}
          <div className="grid sm:grid-cols-2 gap-4 mb-5">
            <div className="card p-4 flex gap-3">
              <Avatar name={order.customer} size="lg" />
              <div>
                <div className="text-xs text-ink-400 mb-0.5 uppercase tracking-widest">Customer</div>
                <div className="text-sm font-semibold text-ink-900 mb-1">{order.customer}</div>
                <div className="text-xs text-ink-500 leading-relaxed">{order.customer_address || 'No address'}</div>
              </div>
            </div>
            <div className="card p-4 grid grid-cols-2 gap-3">
              <div>
                <div className="text-xs text-ink-400 mb-0.5 uppercase tracking-widest">Order Date</div>
                <div className="text-sm font-medium text-ink-900">{order.created_at?.slice(0, 10)}</div>
              </div>
              <div>
                <div className="text-xs text-ink-400 mb-0.5 uppercase tracking-widest">Status</div>
                <Chip tone={STATUS_TONES[order.status] || 'neutral'} className="text-xs">{order.status?.replace(/_/g, ' ')}</Chip>
              </div>
              <div>
                <div className="text-xs text-ink-400 mb-0.5 uppercase tracking-widest">Total</div>
                <div className="text-sm font-bold text-burgundy-800">{money(order.total)}</div>
              </div>
            </div>
          </div>

          {/* Order lines table */}
          <div className="card overflow-hidden">
            <div className="px-4 py-3 border-b border-line bg-paper-50 flex justify-between items-center">
              <span className="font-semibold text-ink-900">Order Lines</span>
              <span className="text-xs font-medium bg-white px-2 py-1 rounded-full border border-line">{order.lines.length} items</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-ink-500 text-[11px] uppercase tracking-wider border-b border-line bg-paper-0/50">
                    <th className="text-left py-2 px-4 font-semibold">Product</th>
                    {!isCustomerView && <><th className="text-center font-semibold">Strategy</th>
                    <th className="text-center font-semibold">Type</th>
                    <th className="text-right font-semibold">In Stock</th>
                    <th className="text-right font-semibold">Shortage</th>
                    <th className="text-center font-semibold">Linked</th></>}
                    <th className="text-right font-semibold">Ordered</th>
                    <th className="text-right font-semibold">Dispatched</th>
                    <th className="text-right font-semibold">Unit Price</th>
                    <th className="text-right py-2 px-4 font-semibold">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {order.lines.map(l => (
                    <tr key={l.id} className="border-b border-line/40 last:border-0 hover:bg-paper-50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 border border-line bg-white">
                            <img src={getProductImage(l.product, null, l.product_id)} alt={l.product} className="w-full h-full object-cover" />
                          </div>
                          <span className="font-medium text-ink-900">{l.product}</span>
                        </div>
                      </td>
                      {!isCustomerView && <>
                        <td className="text-center">
                          <Chip tone={l.procurement_strategy === 'MTO' ? 'info' : 'neutral'} className="text-[10px]">
                            {l.procurement_strategy || 'MTS'}
                          </Chip>
                        </td>
                        <td className="text-center text-xs text-ink-500">{l.procurement_type || '—'}</td>
                        <td className="text-right font-mono text-xs">{l.available_stock ?? l.free_to_use}</td>
                        <td className="text-right">
                          {(l.shortage_qty > 0)
                            ? <span className="text-xs font-bold text-danger bg-danger-bg px-1.5 py-0.5 rounded">{l.shortage_qty}</span>
                            : <span className="text-xs text-success">—</span>}
                        </td>
                        <td className="text-center text-xs">
                          {l.linked_po && <span className="text-info font-mono text-[10px]">PO: {l.linked_po}</span>}
                          {l.linked_mo && <span className="text-warning font-mono text-[10px]">MO: {l.linked_mo}</span>}
                          {!l.linked_po && !l.linked_mo && '—'}
                        </td>
                      </>}
                      <td className="text-right font-mono">{l.ordered_qty}</td>
                      <td className="text-right">
                        {canDispatch && !isCustomerView ? (
                          <div className="flex justify-end">
                            <input className="input w-16 text-right py-1 text-xs" type="number"
                              min="0" max={l.ordered_qty - (l.delivered_qty || 0)}
                              defaultValue={l.delivered_qty || 0}
                              onChange={e => setDeliveries({ ...deliveries, [l.id]: +e.target.value })} />
                          </div>
                        ) : <span className="font-mono">{l.delivered_qty}</span>}
                      </td>
                      <td className="text-right font-mono text-ink-500">{money(l.sales_price)}</td>
                      <td className="text-right py-3 px-4 font-mono font-medium text-burgundy-900">{money(l.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="bg-paper-50 p-4 border-t border-line flex justify-end">
              <div className="flex items-center gap-4">
                <span className="text-sm font-semibold text-ink-500 uppercase tracking-widest">Total Amount</span>
                <span className="font-display text-3xl text-burgundy-800">{money(order.total)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Timeline (admin only) */}
        {!isCustomerView && (
          <div className="w-full lg:w-72 shrink-0">
            <div className="card p-4 bg-paper-50 h-full max-h-[600px] overflow-y-auto scrollbar-thin">
              <div className="flex items-center justify-between mb-4 pb-2 border-b border-line">
                <span className="font-semibold text-ink-900">Activity</span>
                <button className="text-xs text-burgundy-800 hover:underline" onClick={() => { onClose(); navigate('/audit?module=Sales&record=' + order.reference) }}>
                  View all
                </button>
              </div>
              <ActivityTimeline module="Sales" reference={order.reference} compact />
            </div>
          </div>
        )}
      </div>
    </Modal>
  )
}

// ─── Admin Create SO Drawer ───
function CreateSO({ onClose, onDone }) {
  const [customers, setCustomers] = useState([])
  const [users, setUsers] = useState([])
  const [products, setProducts] = useState([])
  const [form, setForm] = useState({ customer_id: '', customer_address: '', salesperson_id: '', lines: [] })

  useEffect(() => {
    api.get('/customers').then(r => setCustomers(r.data))
    api.get('/users').then(r => setUsers(r.data))
    api.get('/products').then(r => setProducts(r.data))
  }, [])

  const addLine = () => setForm({ ...form, lines: [...form.lines, { product_id: '', ordered_qty: 1 }] })
  const setLine = (i, k, v) => { const lines = [...form.lines]; lines[i][k] = v; setForm({ ...form, lines }) }
  const removeLine = (i) => { const lines = form.lines.filter((_, idx) => idx !== i); setForm({ ...form, lines }) }

  const save = async () => {
    try {
      await api.post('/sales-orders', {
        customer_id: +form.customer_id, customer_address: form.customer_address,
        salesperson_id: form.salesperson_id ? +form.salesperson_id : null,
        lines: form.lines.filter(l => l.product_id).map(l => ({ product_id: +l.product_id, ordered_qty: +l.ordered_qty })),
      })
      onDone()
    } catch (e) {
      alert(e.response?.data?.detail || e.message)
    }
  }

  return (
    <Drawer open={true} title="New Sales Order" onClose={onClose} width="max-w-2xl">
      <div className="flex flex-col h-full space-y-6 pb-20">
        <div className="bg-paper-50 p-4 rounded-2xl border border-line grid sm:grid-cols-2 gap-4">
          <Field label="Customer">
            <select className="input bg-white" value={form.customer_id} onChange={e => {
              const c = customers.find(x => x.id === +e.target.value)
              setForm({ ...form, customer_id: e.target.value, customer_address: c?.address || '' })
            }}>
              <option value="">Select customer…</option>
              {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </Field>
          <Field label="Salesperson">
            <select className="input bg-white" value={form.salesperson_id} onChange={e => setForm({ ...form, salesperson_id: e.target.value })}>
              <option value="">Select salesperson…</option>
              {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
          </Field>
          <Field label="Shipping Address" className="sm:col-span-2">
            <textarea className="input bg-white min-h-[80px]" value={form.customer_address}
              onChange={e => setForm({ ...form, customer_address: e.target.value })}
              placeholder="Enter delivery address..." />
          </Field>
        </div>
        <div>
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-line">
            <div className="eyebrow text-ink-900">Order Lines</div>
            <button className="btn-secondary py-1 px-3 text-xs" onClick={addLine}>+ Add Product</button>
          </div>
          {form.lines.length === 0 ? (
            <div className="text-center py-8 text-ink-400 text-sm bg-paper-50 rounded-xl border border-dashed border-line">No products added yet.</div>
          ) : (
            <div className="space-y-3">
              {form.lines.map((l, i) => (
                <div key={i} className="flex items-start gap-2 bg-paper-50 p-2 rounded-xl border border-line">
                  <div className="w-8 h-8 rounded bg-rose-100 flex items-center justify-center shrink-0 mt-0.5 text-sm">{i + 1}</div>
                  <Field label={i === 0 ? 'Product' : ''} className="flex-1">
                    <select className="input bg-white" value={l.product_id} onChange={e => setLine(i, 'product_id', e.target.value)}>
                      <option value="">Search products…</option>
                      {products.map(p => <option key={p.id} value={p.id}>{p.name} (Free: {p.free_to_use_qty})</option>)}
                    </select>
                  </Field>
                  <Field label={i === 0 ? 'Qty' : ''} className="w-24 shrink-0">
                    <input className="input bg-white text-right" type="number" min="1" value={l.ordered_qty} onChange={e => setLine(i, 'ordered_qty', e.target.value)} />
                  </Field>
                  <div className={i === 0 ? 'pt-7' : 'pt-1'}>
                    <button className="btn-icon-sm text-danger hover:bg-danger/10" onClick={() => removeLine(i)}>✕</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="fixed bottom-0 right-0 w-full max-w-2xl p-4 bg-paper-0 border-t border-line flex justify-end gap-2 z-10">
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={save} disabled={!form.customer_id || !form.lines.length || !form.lines[0].product_id}>
            Create Order
          </button>
        </div>
      </div>
    </Drawer>
  )
}

// ─── Main Export ───
export default function Sales() {
  const { isCustomer } = useAuth()
  const customerMode = isCustomer()

  const [rows, setRows] = useState(null)
  const [open, setOpen] = useState(null)
  const [creating, setCreating] = useState(false)
  const [view, setView] = useState('list')

  const load = () => api.get('/sales-orders').then(r => setRows(r.data))

  useEffect(() => { load() }, [])

  useEffect(() => {
    const handleNew = e => { if (e.detail?.path === '/sales') setCreating(true) }
    window.addEventListener('erp:new', handleNew)
    return () => window.removeEventListener('erp:new', handleNew)
  }, [])

  if (!rows) return <Spinner />

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={customerMode ? 'My Orders' : 'Sales Orders'}
        subtitle={customerMode ? 'Track your order status' : 'Order Management'}
        actions={<>
          {!customerMode && <ViewToggle view={view} setView={setView} />}
          {!customerMode && (
            <button className="btn-primary" onClick={() => setCreating(true)}>
              <span className="text-lg leading-none">+</span> New Order
            </button>
          )}
        </>} />

      {/* Customer view: card grid */}
      {customerMode ? (
        rows.length === 0
          ? (
            <EmptyState title="No orders yet" type="default">
              <p className="text-sm text-ink-500 mt-2">Go to <a href="/products" className="text-burgundy-800 hover:underline">Products</a> to place your first order.</p>
            </EmptyState>
          )
          : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {rows.map(r => (
                <CustomerOrderCard key={r.id} order={r}
                  onClick={() => api.get(`/sales-orders/${r.id}`).then(x => setOpen(x.data))} />
              ))}
            </div>
          )
      ) : (
        // Admin view
        <>
          {/* Summary stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 mb-6">
            {SO_COLS.map(col => {
              const count = rows.filter(r => r.status === col).length
              return (
                <div key={col} className={`card p-3 text-center ${count > 0 ? '' : 'opacity-50'}`}>
                  <div className={`font-display text-2xl font-semibold text-${STATUS_TONES[col] || 'ink'}-600`}>{count}</div>
                  <div className="text-[10px] text-ink-400 mt-0.5 uppercase tracking-wider">{COL_LABELS[col]}</div>
                </div>
              )
            })}
          </div>

          {view === 'list' ? (
            <div className="card overflow-hidden">
              <DataTable
                onRow={r => api.get(`/sales-orders/${r.id}`).then(x => setOpen(x.data))}
                columns={[
                  { key: 'reference', label: 'Order ID', mono: true },
                  { key: 'created_at', label: 'Date', render: r => r.created_at?.slice(0, 10) || '—' },
                  { key: 'customer', label: 'Customer', render: r => (
                    <div className="flex items-center gap-2 font-medium text-ink-900">
                      <Avatar name={r.customer} size="xs" /> {r.customer}
                    </div>
                  )},
                  { key: 'lines', label: 'Items', render: r => r.lines?.length || 0 },
                  { key: 'total', label: 'Total', right: true, mono: true, render: r => money(r.total) },
                  { key: 'status', label: 'Status', render: r => (
                    <Chip tone={STATUS_TONES[r.status] || 'neutral'} className="text-xs">{r.status?.replace(/_/g, ' ')}</Chip>
                  )},
                ]} rows={rows} />
            </div>
          ) : (
            <KanbanSO rows={rows} onOpen={r => api.get(`/sales-orders/${r.id}`).then(x => setOpen(x.data))} />
          )}
        </>
      )}

      {!customerMode && creating && (
        <CreateSO onClose={() => setCreating(false)} onDone={() => { setCreating(false); load() }} />
      )}

      {open && (
        <DetailSO
          order={open}
          isCustomerView={customerMode}
          reload={async () => { const x = await api.get(`/sales-orders/${open.id}`); setOpen(x.data); load() }}
          onClose={() => { setOpen(null); load() }}
        />
      )}
    </div>
  )
}
