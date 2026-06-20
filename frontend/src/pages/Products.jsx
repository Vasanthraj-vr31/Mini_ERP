import { useEffect, useState } from 'react'
import api, { money } from '../api'
import { PageHeader, Field, Chip, Spinner } from '../components/ui'
import DataTable from '../components/DataTable'

const blank = { name: '', sales_price: 0, cost_price: 0, on_hand_qty: 0, unit: 'Units',
  procure_on_demand: false, procurement_type: '', vendor_id: '', bom_id: '' }

export default function Products() {
  const [rows, setRows] = useState(null)
  const [edit, setEdit] = useState(null)
  const [vendors, setVendors] = useState([])
  const [boms, setBoms] = useState([])

  const load = () => api.get('/products').then((r) => setRows(r.data))
  useEffect(() => {
    load()
    api.get('/vendors').then((r) => setVendors(r.data))
    api.get('/boms').then((r) => setBoms(r.data))
  }, [])

  const save = async () => {
    const body = { ...edit,
      vendor_id: edit.vendor_id || null, bom_id: edit.bom_id || null,
      sales_price: +edit.sales_price, cost_price: +edit.cost_price, on_hand_qty: +edit.on_hand_qty }
    if (edit.id) await api.put(`/products/${edit.id}`, body)
    else await api.post('/products', body)
    setEdit(null); load()
  }

  if (!rows) return <Spinner />

  return (
    <div>
      <PageHeader title="Products" subtitle="Inventory"
        actions={<button className="btn-primary" onClick={() => setEdit({ ...blank })}>New Product</button>} />

      <DataTable
        onRow={(r) => setEdit({ ...blank, ...r, vendor_id: r.vendor_id || '', bom_id: r.bom_id || '' })}
        columns={[
          { key: 'reference', label: 'Reference', mono: true },
          { key: 'name', label: 'Product' },
          { key: 'sales_price', label: 'Sales Price', right: true, render: (r) => money(r.sales_price) },
          { key: 'cost_price', label: 'Cost Price', right: true, render: (r) => money(r.cost_price) },
          { key: 'on_hand_qty', label: 'On Hand', right: true, mono: true },
          { key: 'reserved_qty', label: 'Reserved', right: true, mono: true },
          { key: 'free_to_use_qty', label: 'Free to Use', right: true, mono: true,
            render: (r) => <span className={r.free_to_use_qty < 0 ? 'text-danger font-semibold' : ''}>{r.free_to_use_qty}</span> },
          { key: 'pod', label: '', render: (r) => r.procure_on_demand ? <Chip tone="info">MTO</Chip> : <Chip tone="neutral">MTS</Chip> },
        ]}
        rows={rows} />

      {edit && (
        <Modal title={edit.id ? `Edit ${edit.reference || ''}` : 'New Product'} onClose={() => setEdit(null)}>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Product Name"><input className="input" value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} /></Field>
            <Field label="Unit"><input className="input" value={edit.unit} onChange={(e) => setEdit({ ...edit, unit: e.target.value })} /></Field>
            <Field label="Sales Price (₹)"><input className="input" type="number" value={edit.sales_price} onChange={(e) => setEdit({ ...edit, sales_price: e.target.value })} /></Field>
            <Field label="Cost Price (₹)"><input className="input" type="number" value={edit.cost_price} onChange={(e) => setEdit({ ...edit, cost_price: e.target.value })} /></Field>
            <Field label="On Hand Qty"><input className="input" type="number" value={edit.on_hand_qty} onChange={(e) => setEdit({ ...edit, on_hand_qty: e.target.value })} /></Field>
            {edit.id && <Field label="Free to Use (computed)"><input className="input bg-paper-50" disabled value={edit.free_to_use_qty ?? '—'} /></Field>}
          </div>

          <div className="mt-5 p-4 rounded-xl bg-paper-50">
            <label className="flex items-center gap-2 text-sm font-medium">
              <input type="checkbox" checked={edit.procure_on_demand}
                onChange={(e) => setEdit({ ...edit, procure_on_demand: e.target.checked })} />
              Procure on Demand (auto-replenish on shortage)
            </label>
            {edit.procure_on_demand && (
              <div className="grid sm:grid-cols-3 gap-4 mt-4">
                <Field label="Procurement Type">
                  <select className="input" value={edit.procurement_type} onChange={(e) => setEdit({ ...edit, procurement_type: e.target.value })}>
                    <option value="">Select…</option>
                    <option>Purchase</option><option>Manufacturing</option>
                  </select>
                </Field>
                {edit.procurement_type === 'Purchase' && (
                  <Field label="Vendor">
                    <select className="input" value={edit.vendor_id} onChange={(e) => setEdit({ ...edit, vendor_id: e.target.value })}>
                      <option value="">Select…</option>
                      {vendors.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
                    </select>
                  </Field>
                )}
                {edit.procurement_type === 'Manufacturing' && (
                  <Field label="Bill of Materials">
                    <select className="input" value={edit.bom_id} onChange={(e) => setEdit({ ...edit, bom_id: e.target.value })}>
                      <option value="">Select…</option>
                      {boms.map((b) => <option key={b.id} value={b.id}>{b.reference} · {b.finished_product}</option>)}
                    </select>
                  </Field>
                )}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 mt-6">
            <button className="btn-secondary" onClick={() => setEdit(null)}>Cancel</button>
            <button className="btn-primary" onClick={save}>Save</button>
          </div>
        </Modal>
      )}
    </div>
  )
}

export function Modal({ title, children, onClose }) {
  return (
    <div className="fixed inset-0 bg-ink-900/30 backdrop-blur-sm grid place-items-center z-50 p-4" onClick={onClose}>
      <div className="card w-full max-w-2xl max-h-[90vh] overflow-auto p-6" onClick={(e) => e.stopPropagation()}>
        <h2 className="font-display text-2xl mb-4">{title}</h2>
        {children}
      </div>
    </div>
  )
}
