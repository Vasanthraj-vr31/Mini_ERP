import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api'
import { PageHeader, StatusChip, Chip, Spinner, Field, Avatar, StepTracker, ViewToggle, Drawer, Modal, EmptyState, ProgressBar, CircularProgress } from '../components/ui'
import DataTable from '../components/DataTable'
import ActivityTimeline from '../components/ActivityTimeline'
import { ExportButton } from '../components/ExportButton'

const MO_COLS = [
  { key: 'Draft',       icon: '📝', color: 'text-ink-500' },
  { key: 'Confirmed',   icon: '✅', color: 'text-info' },
  { key: 'In-Progress', icon: '⚙️',  color: 'text-warning' },
  { key: 'Done',        icon: '🏆', color: 'text-success' },
  { key: 'Cancelled',   icon: '❌', color: 'text-danger' }
]

function KanbanMO({ rows, onOpen }) {
  if (!rows?.length) return <EmptyState title="No manufacturing orders yet" type="manufacturing" />

  return (
    <div className="grid md:grid-cols-5 gap-3">
      {MO_COLS.map(({ key: col, icon, color }) => {
        const cards = rows.filter((r) => r.status === col)
        return (
          <div key={col} className="kanban-col">
            <div className="flex items-center justify-between mb-3 border-b border-line/40 pb-2">
              <span className={`text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 ${color}`}>
                <span className="text-base">{icon}</span> {col}
              </span>
              <span className="bg-paper-0 text-ink-500 text-[10px] font-bold px-1.5 py-0.5 rounded-full border border-line">{cards.length}</span>
            </div>
            
            <div className="space-y-3">
              {cards.map((r) => {
                // Calculate progress based on components or work orders
                const totalComp = r.components?.length || 1
                const availComp = r.components?.filter(c => c.availability === 'Available').length || 0
                const progress = (availComp / totalComp) * 100

                return (
                  <div key={r.id} onClick={() => onOpen(r)} className="kanban-card group relative">
                    {r.source && <div className="absolute -top-2 -right-2 bg-info text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow-sm">AUTO</div>}
                    
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono text-xs font-semibold text-burgundy-800">{r.reference}</span>
                      <span className="text-[10px] text-ink-400">{r.created_at?.slice(0, 10)}</span>
                    </div>
                    
                    <div className="font-medium text-sm text-ink-900 mb-2 leading-tight group-hover:text-burgundy-800 transition-colors">
                      {r.finished_product}
                    </div>
                    
                    <div className="flex items-center gap-3 mb-3">
                      <div className="bg-rose-50 border border-rose-100 text-burgundy-900 px-2 py-0.5 rounded text-xs font-mono font-semibold">
                        ×{r.quantity}
                      </div>
                      {r.assignee && (
                        <div className="flex items-center gap-1 ml-auto">
                          <Avatar name={r.assignee} size="xs" />
                          <span className="text-[10px] text-ink-500 truncate max-w-[80px]">{r.assignee.split(' ')[0]}</span>
                        </div>
                      )}
                    </div>

                    <div className="pt-2 border-t border-line/40">
                      <div className="flex justify-between text-[10px] text-ink-400 mb-1">
                        <span>Materials</span>
                        <span>{availComp}/{totalComp} ready</span>
                      </div>
                      <ProgressBar value={progress} max={100} tone={progress === 100 ? 'success' : 'warning'} className="h-1" />
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

function CreateMO({ onClose, onDone }) {
  const [products, setProducts] = useState([])
  const [boms, setBoms] = useState([])
  const [users, setUsers] = useState([])
  const [form, setForm] = useState({ finished_product_id: '', bom_id: '', quantity: 1, assignee_id: '' })

  useEffect(() => {
    api.get('/products').then((r) => setProducts(r.data))
    api.get('/users').then((r) => setUsers(r.data))
  }, [])

  useEffect(() => {
    if (form.finished_product_id) api.get(`/boms?product_id=${form.finished_product_id}`).then((r) => setBoms(r.data))
  }, [form.finished_product_id])

  const save = async () => {
    await api.post('/manufacturing-orders', {
      finished_product_id: +form.finished_product_id, bom_id: form.bom_id ? +form.bom_id : null,
      quantity: +form.quantity, assignee_id: form.assignee_id ? +form.assignee_id : null,
    })
    onDone()
  }

  return (
    <Drawer open={true} title="New Manufacturing Order" onClose={onClose} width="max-w-md">
      <div className="flex flex-col h-full space-y-5 pb-20">
        <Field label="Finished Product">
          <select className="input" value={form.finished_product_id} onChange={(e) => setForm({ ...form, finished_product_id: e.target.value, bom_id: '' })}>
            <option value="">Select product to build…</option>
            {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </Field>
        
        {form.finished_product_id && (
          <div className="p-4 bg-paper-50 rounded-xl border border-line animate-fade-in">
            <Field label="Bill of Materials (Routing)">
              <select className="input bg-white" value={form.bom_id} onChange={(e) => setForm({ ...form, bom_id: e.target.value })}>
                <option value="">Select BOM…</option>
                {boms.map((b) => <option key={b.id} value={b.id}>{b.reference}</option>)}
              </select>
            </Field>
            {boms.length === 0 && <div className="text-[11px] text-warning mt-1">No BOM found for this product. You can still create the order, but components must be added manually.</div>}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <Field label="Quantity">
            <input className="input text-lg font-mono" type="number" min="1" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} />
          </Field>
          <Field label="Assignee (Worker)">
            <select className="input" value={form.assignee_id} onChange={(e) => setForm({ ...form, assignee_id: e.target.value })}>
              <option value="">Select…</option>
              {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
          </Field>
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-4 bg-paper-0 border-t border-line flex justify-end gap-2 z-10">
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={save} disabled={!form.finished_product_id}>Create Draft</button>
        </div>
      </div>
    </Drawer>
  )
}

function DetailMO({ order, onClose, reload }) {
  const navigate = useNavigate()
  
  const act = async (path) => { 
    await api.post(`/manufacturing-orders/${order.id}/${path}`)
    await reload() 
  }
  
  const s = order.status
  const STEPS = ['Draft', 'Supervisor Approval', 'Production', 'Done']
  const STEP_MAP = { 
    'Draft': 'Draft', 
    'Supervisor Approval': 'Supervisor Approval', // visual UI step
    'Confirmed': 'Confirmed', 
    'In-Progress': 'Production', 
    'Done': 'Done', 
    'Cancelled': 'Draft' 
  }

  // Component availability donut calculation
  const totalComp = order.components?.length || 0
  const availComp = order.components?.filter(c => c.availability === 'Available').length || 0
  const compProgress = totalComp > 0 ? (availComp / totalComp) * 100 : 100

  return (
    <Modal title={`Manufacturing Order · ${order.reference}`} onClose={onClose} size="max-w-5xl">
      <div className="flex flex-col lg:flex-row gap-6">
        
        {/* Main Content */}
        <div className="flex-1 min-w-0">
          
          {/* Action Bar + Stepper */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 bg-paper-50 p-4 rounded-2xl border border-line">
            <div className="overflow-x-auto pb-2 sm:pb-0 no-scrollbar w-full sm:w-auto pr-4">
              <StepTracker steps={STEPS} current={STEP_MAP[s] || s} />
            </div>
            
            <div className="flex gap-2 shrink-0">
              {s === 'Draft' && <button className="btn-primary" onClick={() => act('confirm')}>Approve & Confirm</button>}
              {s === 'Confirmed' && <button className="btn-primary" onClick={() => act('start')}>Start Production</button>}
              {['Confirmed', 'In-Progress'].includes(s) && <button className="btn-success" onClick={() => act('produce')}>Mark Done</button>}
              {!['Done', 'Cancelled'].includes(s) && <button className="btn-secondary text-danger hover:bg-danger-bg hover:border-danger/30" onClick={() => act('cancel')}>Cancel</button>}
              
              <ExportButton 
                filename={order.reference} 
                data={order.components} 
                columns={[
                  { key: 'component', label: 'Component' },
                  { key: 'to_consume_qty', label: 'To Consume' },
                  { key: 'consumed_qty', label: 'Consumed' },
                  { key: 'availability', label: 'Status' }
                ]} 
              />
            </div>
          </div>

          {/* KPI Cards */}
          <div className="grid sm:grid-cols-3 gap-4 mb-6">
            <div className="card p-4 flex gap-4 items-center">
              <div className="w-12 h-12 rounded-xl bg-burgundy-800 text-white flex items-center justify-center text-xl shrink-0">
                🛋️
              </div>
              <div className="min-w-0">
                <div className="text-xs text-ink-400 mb-0.5 uppercase tracking-widest">Target Product</div>
                <div className="text-sm font-semibold text-ink-900 truncate" title={order.finished_product}>{order.finished_product}</div>
                <div className="text-lg font-mono font-bold text-burgundy-800 mt-0.5">×{order.quantity}</div>
              </div>
            </div>

            <div className="card p-4 flex items-center gap-4">
              <CircularProgress 
                value={compProgress} 
                max={100} 
                size={54} 
                strokeWidth={5} 
                tone={compProgress === 100 ? 'success' : 'warning'}
                label={<div className="text-[10px] font-bold">{Math.round(compProgress)}%</div>}
              />
              <div>
                <div className="text-xs text-ink-400 mb-0.5 uppercase tracking-widest">Components</div>
                <div className="text-sm font-semibold text-ink-900">{availComp} of {totalComp} ready</div>
              </div>
            </div>

            <div className="card p-4 grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <div className="text-xs text-ink-400 mb-1 uppercase tracking-widest">Assignee</div>
                {order.assignee ? (
                  <div className="flex items-center gap-2">
                    <Avatar name={order.assignee} size="sm" />
                    <span className="text-sm font-medium text-ink-900">{order.assignee}</span>
                  </div>
                ) : (
                  <span className="text-sm text-ink-400">—</span>
                )}
              </div>
            </div>
          </div>

          {/* Tabs / Tables */}
          <div className="space-y-6">
            {/* Components Table */}
            <div className="card overflow-hidden">
              <div className="px-4 py-3 border-b border-line bg-paper-50">
                <span className="font-semibold text-ink-900">Materials to Consume</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-ink-500 text-[11px] uppercase tracking-wider border-b border-line bg-paper-0/50">
                      <th className="text-left py-2 px-4 font-semibold">Component</th>
                      <th className="text-right font-semibold">To Consume</th>
                      <th className="text-right font-semibold">Consumed</th>
                      <th className="text-right py-2 px-4 font-semibold">Availability</th>
                    </tr>
                  </thead>
                  <tbody>
                    {order.components.map((c) => (
                      <tr key={c.id} className="border-b border-line/40 last:border-0 hover:bg-paper-50">
                        <td className="py-2.5 px-4 font-medium text-ink-900">{c.component}</td>
                        <td className="text-right font-mono">{c.to_consume_qty}</td>
                        <td className="text-right font-mono">{c.consumed_qty}</td>
                        <td className="text-right py-2 px-4">
                          <Chip tone={c.availability === 'Available' ? 'success' : 'danger'}>{c.availability}</Chip>
                        </td>
                      </tr>
                    ))}
                    {order.components.length === 0 && (
                      <tr><td colSpan="4" className="text-center py-6 text-ink-400 text-sm">No components required</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Work Orders Table */}
            <div className="card overflow-hidden">
              <div className="px-4 py-3 border-b border-line bg-paper-50">
                <span className="font-semibold text-ink-900">Work Orders (Routing)</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-ink-500 text-[11px] uppercase tracking-wider border-b border-line bg-paper-0/50">
                      <th className="text-left py-2 px-4 font-semibold">Operation</th>
                      <th className="text-left font-semibold">Work Center</th>
                      <th className="text-right font-semibold">Expected (m)</th>
                      <th className="text-right font-semibold">Real (m)</th>
                      <th className="text-right py-2 px-4 font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {order.work_orders.map((w) => (
                      <tr key={w.id} className="border-b border-line/40 last:border-0 hover:bg-paper-50">
                        <td className="py-2.5 px-4 font-medium text-ink-900 flex items-center gap-2">
                          <span className="text-base opacity-70">⚡</span>
                          {w.operation}
                        </td>
                        <td className="text-ink-600">{w.work_center || '—'}</td>
                        <td className="text-right font-mono text-ink-500">{w.expected_duration}</td>
                        <td className="text-right font-mono font-medium">{w.real_duration}</td>
                        <td className="text-right py-2 px-4">
                          <Chip tone={w.status === 'Done' ? 'success' : w.status === 'In-Progress' ? 'info' : 'neutral'}>{w.status}</Chip>
                        </td>
                      </tr>
                    ))}
                    {order.work_orders.length === 0 && (
                      <tr><td colSpan="5" className="text-center py-6 text-ink-400 text-sm">No routing specified</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
        
        {/* Right Column: Timeline */}
        <div className="w-full lg:w-72 shrink-0">
          <div className="card p-4 bg-paper-50 h-full max-h-[600px] overflow-y-auto scrollbar-thin">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-line">
              <span className="font-semibold text-ink-900">Activity Timeline</span>
              <button className="text-xs text-burgundy-800 hover:underline" onClick={() => { onClose(); navigate('/audit?module=Manufacturing&record=' + order.reference) }}>
                View all
              </button>
            </div>
            <ActivityTimeline module="Manufacturing" reference={order.reference} compact={false} />
          </div>
        </div>

      </div>
    </Modal>
  )
}

export default function Manufacturing() {
  const [rows, setRows] = useState(null)
  const [open, setOpen] = useState(null)
  const [creating, setCreating] = useState(false)
  const [view, setView] = useState('kanban')

  const load = () => api.get('/manufacturing-orders').then((r) => setRows(r.data))
  useEffect(() => { load() }, [])

  // Listen for 'new' event from Command Palette
  useEffect(() => {
    const handleNew = (e) => { if (e.detail?.path === '/manufacturing') setCreating(true) }
    window.addEventListener('erp:new', handleNew)
    return () => window.removeEventListener('erp:new', handleNew)
  }, [])

  if (!rows) return <Spinner />

  // Enrich rows for kanban component calculation
  const enrichedRows = rows.map(r => {
    if (!r.components && open?.id === r.id) return open
    return r
  })

  return (
    <div className="animate-fade-in">
      <PageHeader title="Manufacturing Orders" subtitle="Production Board"
        actions={<>
          <ViewToggle view={view} setView={setView} />
          <button className="btn-primary" onClick={() => setCreating(true)}>
            <span className="text-lg leading-none">+</span> New Order
          </button>
        </>} />

      {view === 'list' ? (
        <div className="card overflow-hidden">
          <DataTable onRow={(r) => api.get(`/manufacturing-orders/${r.id}`).then((x) => setOpen(x.data))}
            columns={[
              { key: 'reference', label: 'Reference', mono: true },
              { key: 'created_at', label: 'Date', render: (r) => r.created_at?.slice(0, 10) || '—' },
              { key: 'finished_product', label: 'Finished Product', render: r => <span className="font-medium text-ink-900">{r.finished_product}</span> },
              { key: 'quantity', label: 'Qty', right: true, mono: true, render: r => <span className="font-bold">×{r.quantity}</span> },
              { key: 'source', label: 'Source', render: (r) => r.source ? <span className="text-[10px] text-info bg-info-bg/50 px-1.5 py-0.5 rounded">auto</span> : '—' },
              { key: 'status', label: 'Status', render: (r) => <StatusChip status={r.status} /> },
            ]} rows={enrichedRows} />
        </div>
      ) : (
        <KanbanMO rows={enrichedRows} onOpen={(r) => api.get(`/manufacturing-orders/${r.id}`).then((x) => setOpen(x.data))} />
      )}

      {creating && <CreateMO onClose={() => setCreating(false)} onDone={() => { setCreating(false); load() }} />}
      
      {open && <DetailMO order={open} onClose={() => { setOpen(null); load() }}
        reload={async () => { const x = await api.get(`/manufacturing-orders/${open.id}`); setOpen(x.data); load() }} />}
    </div>
  )
}
