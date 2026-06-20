import { useEffect, useState } from 'react'
import api, { money } from '../api'
import { PageHeader, StatusChip, Chip, Spinner, Field } from '../components/ui'
import DataTable from '../components/DataTable'
import { Modal } from './Products'

export default function Sales() {
  const [rows, setRows] = useState(null)
  const [open, setOpen] = useState(null)      // detail order
  const [creating, setCreating] = useState(false)
  const [view, setView] = useState('list')

  const load = () => api.get('/sales-orders').then((r) => setRows(r.data))
  useEffect(() => { load() }, [])

  if (!rows) return <Spinner />

  return (
    <div>
      <PageHeader title="Sales Orders" subtitle="Customer demand"
        actions={<>
          <div className="flex rounded-full bg-paper-0 border border-line p-0.5">
            {['list', 'kanban'].map((v) => (
              <button key={v} onClick={() => setView(v)}
                className={`px-3 py-1 rounded-full text-xs capitalize ${view === v ? 'bg-burgundy-800 text-white' : 'text-ink-600'}`}>{v}</button>
            ))}
          </div>
          <button className="btn-primary" onClick={() => setCreating(true)}>New Sales Order</button>
        </>} />

      {view === 'list' ? (
        <DataTable onRow={(r) => api.get(`/sales-orders/${r.id}`).then((x) => setOpen(x.data))}
          columns={[
            { key: 'reference', label: 'Reference', mono: true },
            { key: 'customer', label: 'Customer' },
            { key: 'salesperson', label: 'Salesperson', render: (r) => r.salesperson || '—' },
            { key: 'total', label: 'Total', right: true, render: (r) => money(r.total) },
            { key: 'status', label: 'Status', render: (r) => <StatusChip status={r.status} /> },
          ]} rows={rows} />
      ) : <Kanban rows={rows} onOpen={(r) => api.get(`/sales-orders/${r.id}`).then((x) => setOpen(x.data))} />}

      {creating && <CreateSO onClose={() => setCreating(false)} onDone={() => { setCreating(false); load() }} />}
      {open && <DetailSO order={open} reload={async () => {
        const x = await api.get(`/sales-orders/${open.id}`); setOpen(x.data); load()
      }} onClose={() => { setOpen(null); load() }} />}
    </div>
  )
}

const COLS = ['Draft', 'Confirmed', 'Partially Delivered', 'Fully Delivered', 'Cancelled']
function Kanban({ rows, onOpen }) {
  return (
    <div className="grid md:grid-cols-5 gap-3">
      {COLS.map((c) => (
        <div key={c}>
          <div className="eyebrow mb-2">{c} · {rows.filter((r) => r.status === c).length}</div>
          <div className="space-y-2">
            {rows.filter((r) => r.status === c).map((r) => (
              <div key={r.id} onClick={() => onOpen(r)} className="card p-3 cursor-pointer hover:shadow-card-hover transition">
                <div className="mono text-xs text-ink-600">{r.reference}</div>
                <div className="font-medium text-sm">{r.customer}</div>
                <div className="text-xs text-ink-600 mt-1">{money(r.total)}</div>
              </div>
            ))}
          </div>
        </div>
      ))}
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
  const setLine = (i, k, v) => {
    const lines = [...form.lines]; lines[i][k] = v; setForm({ ...form, lines })
  }
  const save = async () => {
    await api.post('/sales-orders', {
      customer_id: +form.customer_id, customer_address: form.customer_address,
      salesperson_id: form.salesperson_id ? +form.salesperson_id : null,
      lines: form.lines.filter((l) => l.product_id).map((l) => ({ product_id: +l.product_id, ordered_qty: +l.ordered_qty })),
    })
    onDone()
  }

  return (
    <Modal title="New Sales Order" onClose={onClose}>
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Customer">
          <select className="input" value={form.customer_id} onChange={(e) => {
            const c = customers.find((x) => x.id === +e.target.value)
            setForm({ ...form, customer_id: e.target.value, customer_address: c?.address || '' })
          }}>
            <option value="">Select…</option>
            {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </Field>
        <Field label="Salesperson">
          <select className="input" value={form.salesperson_id} onChange={(e) => setForm({ ...form, salesperson_id: e.target.value })}>
            <option value="">Select…</option>
            {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
        </Field>
        <Field label="Customer Address"><input className="input" value={form.customer_address} onChange={(e) => setForm({ ...form, customer_address: e.target.value })} /></Field>
      </div>

      <div className="mt-5">
        <div className="flex items-center justify-between mb-2">
          <div className="eyebrow">Order Lines</div>
          <button className="btn-ghost text-xs" onClick={addLine}>+ Add a product</button>
        </div>
        {form.lines.map((l, i) => (
          <div key={i} className="flex gap-2 mb-2">
            <select className="input" value={l.product_id} onChange={(e) => setLine(i, 'product_id', e.target.value)}>
              <option value="">Product…</option>
              {products.map((p) => <option key={p.id} value={p.id}>{p.name} (free {p.free_to_use_qty})</option>)}
            </select>
            <input className="input w-28" type="number" value={l.ordered_qty} onChange={(e) => setLine(i, 'ordered_qty', e.target.value)} />
          </div>
        ))}
      </div>

      <div className="flex justify-end gap-2 mt-6">
        <button className="btn-secondary" onClick={onClose}>Cancel</button>
        <button className="btn-primary" onClick={save} disabled={!form.customer_id || !form.lines.length}>Create Draft</button>
      </div>
    </Modal>
  )
}

function DetailSO({ order, onClose, reload }) {
  const [result, setResult] = useState(null)
  const [deliveries, setDeliveries] = useState({})
  const editable = order.status === 'Draft'
  const canConfirm = order.status === 'Draft'
  const canDeliver = ['Confirmed', 'Partially Delivered'].includes(order.status)
  const canCancel = !['Fully Delivered', 'Cancelled'].includes(order.status)

  const act = async (path, body) => {
    const { data } = await api.post(`/sales-orders/${order.id}/${path}`, body || {})
    if (path === 'confirm') setResult(data)
    await reload()
  }

  return (
    <Modal title={order.reference} onClose={onClose}>
      {/* Statusbar */}
      <div className="flex items-center justify-between mb-5 -mt-2">
        <div className="flex gap-2">
          {canConfirm && <button className="btn-primary" onClick={() => act('confirm')}>Confirm</button>}
          {canDeliver && <button className="btn-primary" onClick={() => act('deliver', { deliveries })}>Deliver</button>}
          {canCancel && <button className="btn-danger" onClick={() => act('cancel')}>Cancel</button>}
        </div>
        <StatusChip status={order.status} />
      </div>

      {result?.procured?.length > 0 && (
        <div className="mb-4 p-4 rounded-xl bg-success-bg border border-success/20">
          <div className="text-sm font-semibold text-success mb-1">⚡ Procurement auto-triggered</div>
          {result.procured.map((p, i) => (
            <div key={i} className="text-sm text-ink-900">Created {p.type} <b>{p.reference}</b> for {p.qty} × {p.product}</div>
          ))}
        </div>
      )}
      {result?.warnings?.length > 0 && (
        <div className="mb-4 p-3 rounded-xl bg-warning-bg text-sm text-ink-900">
          {result.warnings.map((w, i) => <div key={i}>⚠ {w.product}: ordered {w.ordered}, only {w.free_to_use} free-to-use (shortfall {w.shortfall})</div>)}
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-3 text-sm mb-5">
        <Info label="Customer" value={order.customer} />
        <Info label="Salesperson" value={order.salesperson || '—'} />
        <Info label="Address" value={order.customer_address || '—'} />
        <Info label="Created" value={order.created_at?.slice(0, 16).replace('T', ' ')} />
      </div>

      <table className="w-full text-sm">
        <thead><tr className="text-ink-600 text-[13px] border-b border-line">
          <th className="text-left py-2">Product</th><th className="text-right">Ordered</th>
          <th className="text-right">Delivered</th><th className="text-right">Price</th><th className="text-right">Total</th>
        </tr></thead>
        <tbody>
          {order.lines.map((l) => (
            <tr key={l.id} className="border-b border-line/50">
              <td className="py-2">{l.product}{!l.available && <Chip tone="danger">short</Chip>}</td>
              <td className="text-right mono">{l.ordered_qty}</td>
              <td className="text-right">
                {canDeliver ? (
                  <input className="input w-20 text-right py-1 inline-block" type="number"
                    defaultValue={l.delivered_qty}
                    onChange={(e) => setDeliveries({ ...deliveries, [l.id]: +e.target.value })} />
                ) : <span className="mono">{l.delivered_qty}</span>}
              </td>
              <td className="text-right mono">{money(l.sales_price)}</td>
              <td className="text-right mono">{money(l.total)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="text-right font-display text-2xl mt-4 text-burgundy-800">Total {money(order.total)}</div>
    </Modal>
  )
}

function Info({ label, value }) {
  return <div><div className="text-ink-400 text-xs">{label}</div><div className="text-ink-900">{value}</div></div>
}
