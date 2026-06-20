import { useEffect, useState } from 'react'
import api, { money } from '../api'
import { PageHeader, StatusChip, Spinner, Field } from '../components/ui'
import DataTable from '../components/DataTable'
import { Modal } from './Products'

export default function Purchase() {
  const [rows, setRows] = useState(null)
  const [open, setOpen] = useState(null)
  const [creating, setCreating] = useState(false)
  const load = () => api.get('/purchase-orders').then((r) => setRows(r.data))
  useEffect(() => { load() }, [])
  if (!rows) return <Spinner />

  return (
    <div>
      <PageHeader title="Purchase Orders" subtitle="Replenishment"
        actions={<button className="btn-primary" onClick={() => setCreating(true)}>New Purchase Order</button>} />
      <DataTable onRow={(r) => api.get(`/purchase-orders/${r.id}`).then((x) => setOpen(x.data))}
        columns={[
          { key: 'reference', label: 'Reference', mono: true },
          { key: 'vendor', label: 'Vendor' },
          { key: 'source', label: 'Source', render: (r) => r.source ? <span className="text-xs text-info">auto · {r.source}</span> : '—' },
          { key: 'total', label: 'Total', right: true, render: (r) => money(r.total) },
          { key: 'status', label: 'Status', render: (r) => <StatusChip status={r.status} /> },
        ]} rows={rows} />
      {creating && <CreatePO onClose={() => setCreating(false)} onDone={() => { setCreating(false); load() }} />}
      {open && <DetailPO order={open} onClose={() => { setOpen(null); load() }}
        reload={async () => { const x = await api.get(`/purchase-orders/${open.id}`); setOpen(x.data); load() }} />}
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
  const save = async () => {
    await api.post('/purchase-orders', {
      vendor_id: +form.vendor_id, vendor_address: form.vendor_address,
      responsible_id: form.responsible_id ? +form.responsible_id : null,
      lines: form.lines.filter((l) => l.product_id).map((l) => ({ product_id: +l.product_id, ordered_qty: +l.ordered_qty })),
    }); onDone()
  }
  return (
    <Modal title="New Purchase Order" onClose={onClose}>
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Vendor">
          <select className="input" value={form.vendor_id} onChange={(e) => {
            const v = vendors.find((x) => x.id === +e.target.value)
            setForm({ ...form, vendor_id: e.target.value, vendor_address: v?.address || '' })
          }}>
            <option value="">Select…</option>
            {vendors.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
          </select>
        </Field>
        <Field label="Responsible">
          <select className="input" value={form.responsible_id} onChange={(e) => setForm({ ...form, responsible_id: e.target.value })}>
            <option value="">Select…</option>
            {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
        </Field>
        <Field label="Vendor Address"><input className="input" value={form.vendor_address} onChange={(e) => setForm({ ...form, vendor_address: e.target.value })} /></Field>
      </div>
      <div className="mt-5">
        <div className="flex items-center justify-between mb-2"><div className="eyebrow">Order Lines</div>
          <button className="btn-ghost text-xs" onClick={addLine}>+ Add a product</button></div>
        {form.lines.map((l, i) => (
          <div key={i} className="flex gap-2 mb-2">
            <select className="input" value={l.product_id} onChange={(e) => setLine(i, 'product_id', e.target.value)}>
              <option value="">Product…</option>
              {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <input className="input w-28" type="number" value={l.ordered_qty} onChange={(e) => setLine(i, 'ordered_qty', e.target.value)} />
          </div>
        ))}
      </div>
      <div className="flex justify-end gap-2 mt-6">
        <button className="btn-secondary" onClick={onClose}>Cancel</button>
        <button className="btn-primary" onClick={save} disabled={!form.vendor_id || !form.lines.length}>Create Draft</button>
      </div>
    </Modal>
  )
}

function DetailPO({ order, onClose, reload }) {
  const [receipts, setReceipts] = useState({})
  const canConfirm = order.status === 'Draft'
  const canReceive = ['Confirmed', 'Partially Received'].includes(order.status)
  const canCancel = !['Fully Received', 'Cancelled'].includes(order.status)
  const act = async (path, body) => { await api.post(`/purchase-orders/${order.id}/${path}`, body || {}); await reload() }
  return (
    <Modal title={order.reference} onClose={onClose}>
      <div className="flex items-center justify-between mb-5 -mt-2">
        <div className="flex gap-2">
          {canConfirm && <button className="btn-primary" onClick={() => act('confirm')}>Confirm</button>}
          {canReceive && <button className="btn-primary" onClick={() => act('receive', { receipts })}>Receive</button>}
          {canCancel && <button className="btn-danger" onClick={() => act('cancel')}>Cancel</button>}
        </div>
        <StatusChip status={order.status} />
      </div>
      <div className="grid sm:grid-cols-2 gap-3 text-sm mb-5">
        <div><div className="text-ink-400 text-xs">Vendor</div>{order.vendor}</div>
        <div><div className="text-ink-400 text-xs">Address</div>{order.vendor_address || '—'}</div>
      </div>
      <table className="w-full text-sm">
        <thead><tr className="text-ink-600 text-[13px] border-b border-line">
          <th className="text-left py-2">Product</th><th className="text-right">Ordered</th>
          <th className="text-right">Received</th><th className="text-right">Cost</th><th className="text-right">Total</th></tr></thead>
        <tbody>{order.lines.map((l) => (
          <tr key={l.id} className="border-b border-line/50">
            <td className="py-2">{l.product}</td><td className="text-right mono">{l.ordered_qty}</td>
            <td className="text-right">{canReceive
              ? <input className="input w-20 text-right py-1 inline-block" type="number" defaultValue={l.received_qty}
                  onChange={(e) => setReceipts({ ...receipts, [l.id]: +e.target.value })} />
              : <span className="mono">{l.received_qty}</span>}</td>
            <td className="text-right mono">{money(l.cost_price)}</td><td className="text-right mono">{money(l.total)}</td>
          </tr>
        ))}</tbody>
      </table>
      <div className="text-right font-display text-2xl mt-4 text-burgundy-800">Total {money(order.total)}</div>
    </Modal>
  )
}
