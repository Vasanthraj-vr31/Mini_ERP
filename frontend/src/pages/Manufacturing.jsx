import { useEffect, useState } from 'react'
import api from '../api'
import { PageHeader, StatusChip, Chip, Spinner, Field } from '../components/ui'
import DataTable from '../components/DataTable'
import { Modal } from './Products'

export default function Manufacturing() {
  const [rows, setRows] = useState(null)
  const [open, setOpen] = useState(null)
  const [creating, setCreating] = useState(false)
  const load = () => api.get('/manufacturing-orders').then((r) => setRows(r.data))
  useEffect(() => { load() }, [])
  if (!rows) return <Spinner />

  return (
    <div>
      <PageHeader title="Manufacturing Orders" subtitle="Production"
        actions={<button className="btn-primary" onClick={() => setCreating(true)}>New Manufacturing Order</button>} />
      <DataTable onRow={(r) => api.get(`/manufacturing-orders/${r.id}`).then((x) => setOpen(x.data))}
        columns={[
          { key: 'reference', label: 'Reference', mono: true },
          { key: 'finished_product', label: 'Finished Product' },
          { key: 'quantity', label: 'Qty', right: true, mono: true },
          { key: 'source', label: 'Source', render: (r) => r.source ? <span className="text-xs text-info">auto</span> : '—' },
          { key: 'status', label: 'Status', render: (r) => <StatusChip status={r.status} /> },
        ]} rows={rows} />
      {creating && <CreateMO onClose={() => setCreating(false)} onDone={() => { setCreating(false); load() }} />}
      {open && <DetailMO order={open} onClose={() => { setOpen(null); load() }}
        reload={async () => { const x = await api.get(`/manufacturing-orders/${open.id}`); setOpen(x.data); load() }} />}
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
    }); onDone()
  }
  return (
    <Modal title="New Manufacturing Order" onClose={onClose}>
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Finished Product">
          <select className="input" value={form.finished_product_id} onChange={(e) => setForm({ ...form, finished_product_id: e.target.value, bom_id: '' })}>
            <option value="">Select…</option>
            {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </Field>
        <Field label="Bill of Materials">
          <select className="input" value={form.bom_id} onChange={(e) => setForm({ ...form, bom_id: e.target.value })}>
            <option value="">Select…</option>
            {boms.map((b) => <option key={b.id} value={b.id}>{b.reference}</option>)}
          </select>
        </Field>
        <Field label="Quantity"><input className="input" type="number" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} /></Field>
        <Field label="Assignee">
          <select className="input" value={form.assignee_id} onChange={(e) => setForm({ ...form, assignee_id: e.target.value })}>
            <option value="">Select…</option>
            {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
        </Field>
      </div>
      <div className="flex justify-end gap-2 mt-6">
        <button className="btn-secondary" onClick={onClose}>Cancel</button>
        <button className="btn-primary" onClick={save} disabled={!form.finished_product_id}>Create Draft</button>
      </div>
    </Modal>
  )
}

function DetailMO({ order, onClose, reload }) {
  const act = async (path) => { await api.post(`/manufacturing-orders/${order.id}/${path}`); await reload() }
  const s = order.status
  return (
    <Modal title={order.reference} onClose={onClose}>
      <div className="flex items-center justify-between mb-5 -mt-2">
        <div className="flex gap-2">
          {s === 'Draft' && <button className="btn-primary" onClick={() => act('confirm')}>Confirm</button>}
          {s === 'Confirmed' && <button className="btn-primary" onClick={() => act('start')}>Start</button>}
          {['Confirmed', 'In-Progress'].includes(s) && <button className="btn-primary" onClick={() => act('produce')}>Produce</button>}
          {!['Done', 'Cancelled'].includes(s) && <button className="btn-danger" onClick={() => act('cancel')}>Cancel</button>}
        </div>
        <StatusChip status={order.status} />
      </div>
      <div className="grid sm:grid-cols-3 gap-3 text-sm mb-5">
        <div><div className="text-ink-400 text-xs">Finished Product</div>{order.finished_product}</div>
        <div><div className="text-ink-400 text-xs">Quantity</div><span className="mono">{order.quantity}</span></div>
        <div><div className="text-ink-400 text-xs">Assignee</div>{order.assignee || '—'}</div>
      </div>

      <div className="eyebrow mb-2">Components</div>
      <table className="w-full text-sm mb-5">
        <thead><tr className="text-ink-600 text-[13px] border-b border-line">
          <th className="text-left py-2">Component</th><th className="text-right">To Consume</th>
          <th className="text-right">Consumed</th><th className="text-right">Availability</th></tr></thead>
        <tbody>{order.components.map((c) => (
          <tr key={c.id} className="border-b border-line/50">
            <td className="py-2">{c.component}</td><td className="text-right mono">{c.to_consume_qty}</td>
            <td className="text-right mono">{c.consumed_qty}</td>
            <td className="text-right"><Chip tone={c.availability === 'Available' ? 'success' : 'danger'}>{c.availability}</Chip></td>
          </tr>
        ))}</tbody>
      </table>

      <div className="eyebrow mb-2">Work Orders</div>
      <table className="w-full text-sm">
        <thead><tr className="text-ink-600 text-[13px] border-b border-line">
          <th className="text-left py-2">Operation</th><th>Work Center</th>
          <th className="text-right">Expected (m)</th><th className="text-right">Real (m)</th><th className="text-right">Status</th></tr></thead>
        <tbody>{order.work_orders.map((w) => (
          <tr key={w.id} className="border-b border-line/50">
            <td className="py-2">{w.operation}</td><td>{w.work_center || '—'}</td>
            <td className="text-right mono">{w.expected_duration}</td><td className="text-right mono">{w.real_duration}</td>
            <td className="text-right"><Chip tone={w.status === 'Done' ? 'success' : w.status === 'In-Progress' ? 'info' : 'neutral'}>{w.status}</Chip></td>
          </tr>
        ))}</tbody>
      </table>
    </Modal>
  )
}
