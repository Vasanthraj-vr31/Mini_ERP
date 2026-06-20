import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api, { money } from '../api'
import { PageHeader, StatusChip, Chip, Spinner, Field, Avatar, StepTracker, ViewToggle, Drawer, Modal, EmptyState } from '../components/ui'
import DataTable from '../components/DataTable'
import ActivityTimeline from '../components/ActivityTimeline'
import { ExportButton, InvoicePrintView } from '../components/ExportButton'
import { getProductImage } from '../data/productImages'

const SO_COLS = ['Draft', 'Confirmed', 'Partially Delivered', 'Fully Delivered', 'Cancelled']

function KanbanSO({ rows, onOpen }) {
  if (!rows?.length) return <EmptyState title="No sales orders yet" type="sales" />

  return (
    <div className="grid md:grid-cols-5 gap-3">
      {SO_COLS.map((col) => {
        const cards = rows.filter((r) => r.status === col)
        return (
          <div key={col} className="kanban-col">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-ink-500">{col}</span>
              <span className="bg-paper-0 text-ink-500 text-[10px] font-bold px-1.5 py-0.5 rounded-full border border-line">{cards.length}</span>
            </div>
            <div className="space-y-3">
              {cards.map((r) => (
                <div key={r.id} onClick={() => onOpen(r)} className="kanban-card group">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-xs font-semibold text-burgundy-800">{r.reference}</span>
                    <span className="text-[10px] text-ink-400">{r.created_at?.slice(0, 10)}</span>
                  </div>
                  
                  <div className="flex items-center gap-2 mb-3">
                    <Avatar name={r.customer} size="xs" />
                    <div className="font-medium text-sm text-ink-900 truncate group-hover:text-burgundy-800 transition-colors">{r.customer}</div>
                  </div>
                  
                  <div className="flex items-center justify-between pt-2 border-t border-line/40">
                    <div className="text-xs text-ink-500 flex items-center gap-1">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/>
                      </svg>
                      {r.item_count || 0} items
                    </div>
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

function CreateSO({ onClose, onDone }) {
  const [customers, setCustomers] = useState([])
  const [users, setUsers] = useState([])
  const [products, setProducts] = useState([])
  const [form, setForm] = useState({ customer_id: '', customer_address: '', salesperson_id: '', lines: [] })

  useEffect(() => {
    api.get('/customers').then((r) => setCustomers(r.data))
    api.get('/users').then((r) => setUsers(r.data))
    api.get('/products').then((r) => setProducts(r.data))
  }, [])

  const addLine = () => setForm({ ...form, lines: [...form.lines, { product_id: '', ordered_qty: 1 }] })
  const setLine = (i, k, v) => { const lines = [...form.lines]; lines[i][k] = v; setForm({ ...form, lines }) }
  const removeLine = (i) => { const lines = form.lines.filter((_, idx) => idx !== i); setForm({ ...form, lines }) }

  const save = async () => {
    await api.post('/sales-orders', {
      customer_id: +form.customer_id, customer_address: form.customer_address,
      salesperson_id: form.salesperson_id ? +form.salesperson_id : null,
      lines: form.lines.filter((l) => l.product_id).map((l) => ({ product_id: +l.product_id, ordered_qty: +l.ordered_qty })),
    })
    onDone()
  }

  const selectedCustomer = customers.find(c => c.id === +form.customer_id)

  return (
    <Drawer open={true} title="New Sales Order" onClose={onClose} width="max-w-2xl">
      <div className="flex flex-col h-full space-y-6 pb-20">
        
        {/* Header section */}
        <div className="bg-paper-50 p-4 rounded-2xl border border-line grid sm:grid-cols-2 gap-4">
          <Field label="Customer">
            <select className="input bg-white" value={form.customer_id} onChange={(e) => {
              const c = customers.find((x) => x.id === +e.target.value)
              setForm({ ...form, customer_id: e.target.value, customer_address: c?.address || '' })
            }}>
              <option value="">Select customer…</option>
              {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </Field>
          
          <Field label="Salesperson">
            <select className="input bg-white" value={form.salesperson_id} onChange={(e) => setForm({ ...form, salesperson_id: e.target.value })}>
              <option value="">Select salesperson…</option>
              {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
          </Field>
          
          <Field label="Shipping Address" className="sm:col-span-2">
            <textarea className="input bg-white min-h-[80px]" value={form.customer_address} 
              onChange={(e) => setForm({ ...form, customer_address: e.target.value })} 
              placeholder={selectedCustomer ? "Enter delivery address..." : "Select a customer first"} />
          </Field>
        </div>

        {/* Lines section */}
        <div>
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-line">
            <div className="eyebrow text-ink-900">Order Lines</div>
            <button className="btn-secondary py-1 px-3 text-xs" onClick={addLine}>+ Add Product</button>
          </div>
          
          {form.lines.length === 0 ? (
            <div className="text-center py-8 text-ink-400 text-sm bg-paper-50 rounded-xl border border-dashed border-line">
              No products added yet.
            </div>
          ) : (
            <div className="space-y-3">
              {form.lines.map((l, i) => (
                <div key={i} className="flex items-start gap-2 bg-paper-50 p-2 rounded-xl border border-line">
                  <div className="w-8 h-8 rounded bg-rose-100 flex items-center justify-center shrink-0 mt-0.5 text-sm">
                    {i+1}
                  </div>
                  <Field label={i === 0 ? "Product" : ""} className="flex-1">
                    <select className="input bg-white" value={l.product_id} onChange={(e) => setLine(i, 'product_id', e.target.value)}>
                      <option value="">Search products…</option>
                      {products.map((p) => <option key={p.id} value={p.id}>{p.name} (Free: {p.free_to_use_qty})</option>)}
                    </select>
                  </Field>
                  <Field label={i === 0 ? "Qty" : ""} className="w-24 shrink-0">
                    <input className="input bg-white text-right" type="number" min="1" value={l.ordered_qty} onChange={(e) => setLine(i, 'ordered_qty', e.target.value)} />
                  </Field>
                  <div className={i === 0 ? "pt-7" : "pt-1"}>
                    <button className="btn-icon-sm text-danger hover:bg-danger/10" onClick={() => removeLine(i)}>✕</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Fixed footer */}
        <div className="fixed bottom-0 right-0 w-full max-w-2xl p-4 bg-paper-0 border-t border-line flex justify-end gap-2 z-10">
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={save} disabled={!form.customer_id || !form.lines.length || !form.lines[0].product_id}>
            Create Draft
          </button>
        </div>
      </div>
    </Drawer>
  )
}

function DetailSO({ order, onClose, reload }) {
  const navigate = useNavigate()
  const [result, setResult] = useState(null)
  const [deliveries, setDeliveries] = useState({})
  
  const canConfirm = order.status === 'Draft'
  const canDeliver = ['Confirmed', 'Partially Delivered'].includes(order.status)
  const canCancel = !['Fully Delivered', 'Cancelled'].includes(order.status)

  const act = async (path, body) => {
    const { data } = await api.post(`/sales-orders/${order.id}/${path}`, body || {})
    if (path === 'confirm') setResult(data)
    await reload()
  }

  const STEPS = ['Draft', 'Confirmed', 'Delivery', 'Delivered']
  const STEP_MAP = { 'Draft': 'Draft', 'Confirmed': 'Confirmed', 'Partially Delivered': 'Delivery', 'Fully Delivered': 'Delivered', 'Cancelled': 'Draft' }

  return (
    <Modal title={`Sale Order · ${order.reference}`} onClose={onClose} size="max-w-5xl">
      <div className="flex flex-col lg:flex-row gap-6">
        
        {/* Left Column: Main Order Details */}
        <div className="flex-1 min-w-0">
          
          {/* Action bar + Stepper */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 bg-paper-50 p-4 rounded-2xl border border-line">
            <div className="overflow-x-auto pb-2 sm:pb-0 no-scrollbar w-full sm:w-auto pr-4">
              <StepTracker steps={STEPS} current={STEP_MAP[order.status] || order.status} />
            </div>
            
            <div className="flex gap-2 shrink-0">
              {canConfirm && <button className="btn-primary" onClick={() => act('confirm')}>Confirm Order</button>}
              {canDeliver && <button className="btn-success" onClick={() => act('deliver', { deliveries })}>Process Delivery</button>}
              {canCancel && <button className="btn-secondary text-danger hover:bg-danger-bg hover:border-danger/30" onClick={() => act('cancel')}>Cancel</button>}
              
              <ExportButton 
                filename={order.reference} 
                data={order.lines} 
                columns={[
                  { key: 'product', label: 'Product' },
                  { key: 'ordered_qty', label: 'Ordered' },
                  { key: 'delivered_qty', label: 'Delivered' },
                  { key: 'sales_price', label: 'Unit Price' },
                  { key: 'total', label: 'Total' }
                ]} 
              />
            </div>
          </div>

          {result?.procured?.length > 0 && (
            <div className="mb-4 p-4 rounded-xl bg-success-bg border border-success/30 flex gap-3 animate-slide-down">
              <span className="text-xl">⚡</span>
              <div>
                <div className="text-sm font-semibold text-success mb-1">Procurement auto-triggered</div>
                {result.procured.map((p, i) => (
                  <div key={i} className="text-sm text-ink-900">Created {p.type} <span className="font-mono font-semibold">{p.reference}</span> for {p.qty} × {p.product}</div>
                ))}
              </div>
            </div>
          )}
          {result?.warnings?.length > 0 && (
            <div className="mb-4 p-4 rounded-xl bg-warning-bg border border-warning/30 flex gap-3 animate-slide-down">
              <span className="text-xl">⚠️</span>
              <div>
                <div className="text-sm font-semibold text-warning mb-1">Stock Shortage</div>
                {result.warnings.map((w, i) => (
                  <div key={i} className="text-sm text-ink-900">
                    <span className="font-semibold">{w.product}:</span> ordered {w.ordered}, only {w.free_to_use} free-to-use
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Header info */}
          <div className="grid sm:grid-cols-2 gap-4 mb-6">
            <div className="card p-4 flex gap-3">
              <Avatar name={order.customer} size="lg" />
              <div>
                <div className="text-xs text-ink-400 mb-0.5 uppercase tracking-widest">Customer</div>
                <div className="text-sm font-semibold text-ink-900 mb-1">{order.customer}</div>
                <div className="text-xs text-ink-500 leading-relaxed">{order.customer_address || 'No address provided'}</div>
              </div>
            </div>
            
            <div className="card p-4 grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs text-ink-400 mb-0.5 uppercase tracking-widest">Salesperson</div>
                <div className="text-sm font-medium text-ink-900">{order.salesperson || '—'}</div>
              </div>
              <div>
                <div className="text-xs text-ink-400 mb-0.5 uppercase tracking-widest">Date</div>
                <div className="text-sm font-medium text-ink-900">{order.created_at?.slice(0, 16).replace('T', ' ')}</div>
              </div>
              <div>
                <div className="text-xs text-ink-400 mb-0.5 uppercase tracking-widest">Status</div>
                <StatusChip status={order.status} />
              </div>
            </div>
          </div>

          {/* Order lines */}
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
                    <th className="text-center font-semibold">Stock</th>
                    <th className="text-right font-semibold">Ordered</th>
                    <th className="text-right font-semibold">Delivered</th>
                    <th className="text-right font-semibold">Unit Price</th>
                    <th className="text-right py-2 px-4 font-semibold">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {order.lines.map((l) => (
                    <tr key={l.id} className="border-b border-line/40 last:border-0 hover:bg-paper-50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 border border-line bg-white">
                            <img src={getProductImage(l.product, null, l.product_id)} alt={l.product} className="w-full h-full object-cover" />
                          </div>
                          <span className="font-medium text-ink-900">{l.product}</span>
                        </div>
                      </td>
                      <td className="text-center">
                        <Chip tone={l.available ? 'success' : 'danger'} className="text-[10px]">
                          {l.available ? 'Available' : 'Short'}
                        </Chip>
                      </td>
                      <td className="text-right font-mono">{l.ordered_qty}</td>
                      <td className="text-right">
                        {canDeliver ? (
                          <div className="flex justify-end">
                            <input className="input w-16 text-right py-1 text-xs" type="number"
                              min="0" max={l.ordered_qty - l.delivered_qty}
                              defaultValue={l.delivered_qty}
                              onChange={(e) => setDeliveries({ ...deliveries, [l.id]: +e.target.value })} />
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
        
        {/* Right Column: Timeline */}
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
      </div>
    </Modal>
  )
}

export default function Sales() {
  const [rows, setRows] = useState(null)
  const [open, setOpen] = useState(null)
  const [creating, setCreating] = useState(false)
  const [view, setView] = useState('kanban')

  const load = () => api.get('/sales-orders').then((r) => setRows(r.data))
  
  useEffect(() => { load() }, [])
  
  // Listen for 'new' event from Command Palette
  useEffect(() => {
    const handleNew = (e) => { if (e.detail?.path === '/sales') setCreating(true) }
    window.addEventListener('erp:new', handleNew)
    return () => window.removeEventListener('erp:new', handleNew)
  }, [])

  if (!rows) return <Spinner />

  return (
    <div className="animate-fade-in">
      <PageHeader title="Sales Orders" subtitle="Customer Demand"
        actions={<>
          <ViewToggle view={view} setView={setView} />
          <button className="btn-primary" onClick={() => setCreating(true)}>
            <span className="text-lg leading-none">+</span> New Order
          </button>
        </>} />

      {view === 'list' ? (
        <div className="card overflow-hidden">
          <DataTable
            onRow={(r) => api.get(`/sales-orders/${r.id}`).then((x) => setOpen(x.data))}
            columns={[
              { key: 'reference', label: 'Reference', mono: true },
              { key: 'created_at', label: 'Date', render: (r) => r.created_at?.slice(0, 10) || '—' },
              { key: 'customer', label: 'Customer', render: r => (
                <div className="flex items-center gap-2 font-medium text-ink-900">
                  <Avatar name={r.customer} size="xs" /> {r.customer}
                </div>
              )},
              { key: 'salesperson', label: 'Salesperson', render: (r) => r.salesperson || '—' },
              { key: 'total', label: 'Total', right: true, mono: true, render: r => money(r.total) },
              { key: 'status', label: 'Status', render: (r) => <StatusChip status={r.status} /> },
            ]} rows={rows} />
        </div>
      ) : (
        <KanbanSO rows={rows} onOpen={(r) => api.get(`/sales-orders/${r.id}`).then((x) => setOpen(x.data))} />
      )}

      {creating && <CreateSO onClose={() => setCreating(false)} onDone={() => { setCreating(false); load() }} />}
      
      {open && <DetailSO order={open} reload={async () => {
        const x = await api.get(`/sales-orders/${open.id}`); setOpen(x.data); load()
      }} onClose={() => { setOpen(null); load() }} />}
    </div>
  )
}
