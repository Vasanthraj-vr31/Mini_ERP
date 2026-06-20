import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api, { money } from '../api'
import { PageHeader, StatusChip, Chip, Spinner, Field, Avatar, StepTracker, ViewToggle, Drawer, Modal, EmptyState, ProgressBar } from '../components/ui'
import DataTable from '../components/DataTable'
import ActivityTimeline from '../components/ActivityTimeline'
import { ExportButton } from '../components/ExportButton'
import { getProductImage } from '../data/productImages'

const PO_COLS = ['Draft', 'Confirmed', 'Partially Received', 'Fully Received', 'Cancelled']

function KanbanPO({ rows, onOpen }) {
  if (!rows?.length) return <EmptyState title="No purchase orders yet" type="default" />

  return (
    <div className="grid md:grid-cols-5 gap-3">
      {PO_COLS.map((col) => {
        const cards = rows.filter((r) => r.status === col)
        return (
          <div key={col} className="kanban-col">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-ink-500">{col}</span>
              <span className="bg-paper-0 text-ink-500 text-[10px] font-bold px-1.5 py-0.5 rounded-full border border-line">{cards.length}</span>
            </div>
            <div className="space-y-3">
              {cards.map((r) => {
                const totalItems = r.lines?.reduce((s, l) => s + l.ordered_qty, 0) || 0
                const receivedItems = r.lines?.reduce((s, l) => s + l.received_qty, 0) || 0
                return (
                  <div key={r.id} onClick={() => onOpen(r)} className="kanban-card group">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono text-xs font-semibold text-burgundy-800">{r.reference}</span>
                      <span className="text-[10px] text-ink-400">{r.created_at?.slice(0, 10)}</span>
                    </div>
                    
                    <div className="flex items-center gap-2 mb-2">
                      <Avatar name={r.vendor} size="xs" />
                      <div className="font-medium text-sm text-ink-900 truncate group-hover:text-burgundy-800 transition-colors">{r.vendor}</div>
                    </div>
                    
                    {r.source && <div className="text-[10px] text-info bg-info-bg/50 px-1.5 py-0.5 rounded w-fit mb-2">auto · {r.source}</div>}

                    {col === 'Partially Received' && totalItems > 0 && (
                      <div className="mb-3">
                        <div className="flex justify-between text-[10px] text-ink-400 mb-1">
                          <span>Received</span>
                          <span>{receivedItems} / {totalItems}</span>
                        </div>
                        <ProgressBar value={receivedItems} max={totalItems} tone="success" className="h-1.5" />
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-2 border-t border-line/40">
                      <div className="text-xs text-ink-500 flex items-center gap-1">
                        <svg className="w-3.5 h-3.5 text-warning" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                        </svg>
                        4.8
                      </div>
                      <div className="font-semibold text-sm text-burgundy-900 bg-rose-50 px-2 py-0.5 rounded-lg">{money(r.total)}</div>
                    </div>
                  </div>
                )
              })}
              {cards.length === 0 && <div className="text-xs text-ink-300 text-center py-4 rounded-xl border border-dashed border-line/60 bg-paper-0/30">—</div>}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function CreatePO({ onClose, onDone }) {
  const [vendors, setVendors] = useState([])
  const [users, setUsers] = useState([])
  const [products, setProducts] = useState([])
  const [form, setForm] = useState({ vendor_id: '', vendor_address: '', responsible_id: '', lines: [] })

  useEffect(() => {
    api.get('/vendors').then((r) => setVendors(r.data))
    api.get('/users').then((r) => setUsers(r.data))
    api.get('/products').then((r) => setProducts(r.data))
  }, [])

  const addLine = () => setForm({ ...form, lines: [...form.lines, { product_id: '', ordered_qty: 1 }] })
  const setLine = (i, k, v) => { const lines = [...form.lines]; lines[i][k] = v; setForm({ ...form, lines }) }
  const removeLine = (i) => { const lines = form.lines.filter((_, idx) => idx !== i); setForm({ ...form, lines }) }

  const save = async () => {
    await api.post('/purchase-orders', {
      vendor_id: +form.vendor_id, vendor_address: form.vendor_address,
      responsible_id: form.responsible_id ? +form.responsible_id : null,
      lines: form.lines.filter((l) => l.product_id).map((l) => ({ product_id: +l.product_id, ordered_qty: +l.ordered_qty })),
    })
    onDone()
  }

  const selectedVendor = vendors.find(v => v.id === +form.vendor_id)

  return (
    <Drawer open={true} title="New Purchase Order" onClose={onClose} width="max-w-2xl">
      <div className="flex flex-col h-full space-y-6 pb-20">
        
        <div className="bg-paper-50 p-4 rounded-2xl border border-line grid sm:grid-cols-2 gap-4">
          <Field label="Vendor">
            <select className="input bg-white" value={form.vendor_id} onChange={(e) => {
              const v = vendors.find((x) => x.id === +e.target.value)
              setForm({ ...form, vendor_id: e.target.value, vendor_address: v?.address || '' })
            }}>
              <option value="">Select vendor…</option>
              {vendors.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
            </select>
          </Field>
          <Field label="Responsible">
            <select className="input bg-white" value={form.responsible_id} onChange={(e) => setForm({ ...form, responsible_id: e.target.value })}>
              <option value="">Select buyer…</option>
              {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
          </Field>
          <Field label="Vendor Address" className="sm:col-span-2">
            <textarea className="input bg-white min-h-[80px]" value={form.vendor_address} 
              onChange={(e) => setForm({ ...form, vendor_address: e.target.value })} 
              placeholder={selectedVendor ? "Enter vendor address..." : "Select a vendor first"} />
          </Field>
        </div>

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
                  <div className="w-8 h-8 rounded bg-info-bg flex items-center justify-center shrink-0 mt-0.5 text-sm">
                    {i+1}
                  </div>
                  <Field label={i === 0 ? "Product" : ""} className="flex-1">
                    <select className="input bg-white" value={l.product_id} onChange={(e) => setLine(i, 'product_id', e.target.value)}>
                      <option value="">Search products…</option>
                      {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
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

        <div className="fixed bottom-0 right-0 w-full max-w-2xl p-4 bg-paper-0 border-t border-line flex justify-end gap-2 z-10">
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={save} disabled={!form.vendor_id || !form.lines.length || !form.lines[0].product_id}>
            Create Draft
          </button>
        </div>
      </div>
    </Drawer>
  )
}

function DetailPO({ order, onClose, reload }) {
  const navigate = useNavigate()
  const [receipts, setReceipts] = useState({})
  
  const canConfirm = order.status === 'Draft'
  const canReceive = ['Confirmed', 'Partially Received'].includes(order.status)
  const canCancel = !['Fully Received', 'Cancelled'].includes(order.status)

  const act = async (path, body) => {
    await api.post(`/purchase-orders/${order.id}/${path}`, body || {})
    await reload()
  }

  const STEPS = ['Draft', 'Manager Approval', 'Confirmed', 'Receipt', 'Done']
  const STEP_MAP = { 
    'Draft': 'Draft', 
    'Manager Approval': 'Manager Approval', // For visual UI
    'Confirmed': 'Confirmed', 
    'Partially Received': 'Receipt', 
    'Fully Received': 'Done', 
    'Cancelled': 'Draft' 
  }

  const totalOrdered = order.lines.reduce((s, l) => s + l.ordered_qty, 0)
  const totalReceived = order.lines.reduce((s, l) => s + l.received_qty, 0)
  const receiveProgress = totalOrdered > 0 ? (totalReceived / totalOrdered) * 100 : 0

  return (
    <Modal title={`Purchase Order · ${order.reference}`} onClose={onClose} size="max-w-5xl">
      <div className="flex flex-col lg:flex-row gap-6">
        
        {/* Left Column: Main Order Details */}
        <div className="flex-1 min-w-0">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 bg-paper-50 p-4 rounded-2xl border border-line">
            <div className="overflow-x-auto pb-2 sm:pb-0 no-scrollbar w-full sm:w-auto pr-4">
              <StepTracker steps={STEPS} current={STEP_MAP[order.status] || order.status} />
            </div>
            
            <div className="flex gap-2 shrink-0">
              {canConfirm && <button className="btn-primary" onClick={() => act('confirm')}>Approve & Confirm</button>}
              {canReceive && <button className="btn-success" onClick={() => act('receive', { receipts })}>Receive Products</button>}
              {canCancel && <button className="btn-secondary text-danger hover:bg-danger-bg hover:border-danger/30" onClick={() => act('cancel')}>Cancel</button>}
              
              <ExportButton 
                filename={order.reference} 
                data={order.lines} 
                columns={[
                  { key: 'product', label: 'Product' },
                  { key: 'ordered_qty', label: 'Ordered' },
                  { key: 'received_qty', label: 'Received' },
                  { key: 'cost_price', label: 'Cost Price' },
                  { key: 'total', label: 'Total' }
                ]} 
              />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4 mb-6">
            <div className="card p-4 flex gap-3">
              <Avatar name={order.vendor} size="lg" />
              <div>
                <div className="text-xs text-ink-400 mb-0.5 uppercase tracking-widest">Supplier</div>
                <div className="text-sm font-semibold text-ink-900 mb-1 flex items-center gap-2">
                  {order.vendor}
                  <div className="flex">
                    {[1,2,3,4,5].map(star => (
                      <svg key={star} className={`w-3 h-3 ${star <= 4 ? 'text-warning' : 'text-line'}`} fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                      </svg>
                    ))}
                  </div>
                </div>
                <div className="text-xs text-ink-500 leading-relaxed">{order.vendor_address || 'No address provided'}</div>
              </div>
            </div>
            
            <div className="card p-4 grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs text-ink-400 mb-0.5 uppercase tracking-widest">Date</div>
                <div className="text-sm font-medium text-ink-900">{order.created_at?.slice(0, 10) || '—'}</div>
              </div>
              <div>
                <div className="text-xs text-ink-400 mb-0.5 uppercase tracking-widest">Status</div>
                <StatusChip status={order.status} />
              </div>
              <div className="col-span-2">
                <div className="flex justify-between text-[11px] text-ink-400 mb-1">
                  <span>Receipt Progress</span>
                  <span>{totalReceived} / {totalOrdered} items</span>
                </div>
                <ProgressBar value={receiveProgress} tone="info" />
              </div>
            </div>
          </div>

          <div className="card overflow-hidden">
            <div className="px-4 py-3 border-b border-line bg-paper-50 flex justify-between items-center">
              <span className="font-semibold text-ink-900">Purchase Lines</span>
              <span className="text-xs font-medium bg-white px-2 py-1 rounded-full border border-line">{order.lines.length} items</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-ink-500 text-[11px] uppercase tracking-wider border-b border-line bg-paper-0/50">
                    <th className="text-left py-2 px-4 font-semibold">Product</th>
                    <th className="text-right font-semibold">Ordered</th>
                    <th className="text-right font-semibold">Received</th>
                    <th className="text-right font-semibold">Cost Price</th>
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
                      <td className="text-right font-mono">{l.ordered_qty}</td>
                      <td className="text-right">
                        {canReceive ? (
                          <div className="flex justify-end">
                            <input className="input w-16 text-right py-1 text-xs" type="number"
                              min="0" max={l.ordered_qty - l.received_qty}
                              defaultValue={l.received_qty}
                              onChange={(e) => setReceipts({ ...receipts, [l.id]: +e.target.value })} />
                          </div>
                        ) : <span className="font-mono">{l.received_qty}</span>}
                      </td>
                      <td className="text-right font-mono text-ink-500">{money(l.cost_price)}</td>
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
              <button className="text-xs text-burgundy-800 hover:underline" onClick={() => { onClose(); navigate('/audit?module=Purchase&record=' + order.reference) }}>
                View all
              </button>
            </div>
            <ActivityTimeline module="Purchase" reference={order.reference} compact />
          </div>
        </div>
      </div>
    </Modal>
  )
}

export default function Purchase() {
  const [rows, setRows] = useState(null)
  const [open, setOpen] = useState(null)
  const [creating, setCreating] = useState(false)
  const [view, setView] = useState('kanban')

  const load = () => api.get('/purchase-orders').then((r) => setRows(r.data))
  useEffect(() => { load() }, [])

  // Listen for 'new' event from Command Palette
  useEffect(() => {
    const handleNew = (e) => { if (e.detail?.path === '/purchase') setCreating(true) }
    window.addEventListener('erp:new', handleNew)
    return () => window.removeEventListener('erp:new', handleNew)
  }, [])

  if (!rows) return <Spinner />

  // Enrich rows with lines for kanban counts
  const enrichedRows = rows.map(r => {
    if (!r.lines && open?.id === r.id) return open
    return r
  })

  return (
    <div className="animate-fade-in">
      <PageHeader title="Purchase Orders" subtitle="Replenishment"
        actions={<>
          <ViewToggle view={view} setView={setView} />
          <button className="btn-primary" onClick={() => setCreating(true)}>
            <span className="text-lg leading-none">+</span> New Order
          </button>
        </>} />

      {view === 'list' ? (
        <div className="card overflow-hidden">
          <DataTable onRow={(r) => api.get(`/purchase-orders/${r.id}`).then((x) => setOpen(x.data))}
            columns={[
              { key: 'reference', label: 'Reference', mono: true },
              { key: 'created_at', label: 'Date', render: (r) => r.created_at?.slice(0, 10) || '—' },
              { key: 'vendor', label: 'Vendor', render: r => (
                <div className="flex items-center gap-2 font-medium text-ink-900">
                  <Avatar name={r.vendor} size="xs" /> {r.vendor}
                </div>
              )},
              { key: 'source', label: 'Source', render: (r) => r.source ? <span className="text-[10px] text-info bg-info-bg/50 px-1.5 py-0.5 rounded">auto · {r.source}</span> : '—' },
              { key: 'total', label: 'Total', right: true, mono: true, render: (r) => money(r.total) },
              { key: 'status', label: 'Status', render: (r) => <StatusChip status={r.status} /> },
            ]} rows={enrichedRows} />
        </div>
      ) : (
        <KanbanPO rows={enrichedRows} onOpen={(r) => api.get(`/purchase-orders/${r.id}`).then((x) => setOpen(x.data))} />
      )}

      {creating && <CreatePO onClose={() => setCreating(false)} onDone={() => { setCreating(false); load() }} />}
      
      {open && <DetailPO order={open} onClose={() => { setOpen(null); load() }}
        reload={async () => { const x = await api.get(`/purchase-orders/${open.id}`); setOpen(x.data); load() }} />}
    </div>
  )
}
