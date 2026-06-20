import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api'
import { PageHeader, Spinner, Field, Modal } from '../components/ui'
import DataTable from '../components/DataTable'

export default function Boms() {
  const [rows, setRows] = useState(null)
  const [open, setOpen] = useState(null)
  const [creating, setCreating] = useState(false)
  const load = () => api.get('/boms').then((r) => setRows(r.data))
  useEffect(() => { load() }, [])
  if (!rows) return <Spinner />
  return (
    <div>
      <PageHeader title="Bills of Materials" subtitle="Manufacturing recipes"
        actions={<button className="btn-primary" onClick={() => setCreating(true)}>New BoM</button>} />
      <DataTable onRow={(r) => setOpen(r)}
        columns={[
          { key: 'reference', label: 'Reference', mono: true },
          { key: 'finished_product', label: 'Finished Product' },
          { key: 'quantity', label: 'Quantity', right: true, mono: true },
          { key: 'unit', label: 'Unit', render: () => 'Units' },
        ]} rows={rows} />
      {creating && <CreateBom onClose={() => setCreating(false)} onDone={() => { setCreating(false); load() }} />}
      {open && <ViewBom bom={open} onClose={() => setOpen(null)} />}
    </div>
  )
}

function ViewBom({ bom, onClose }) {
  const navigate = useNavigate()
  return (
    <Modal title={`${bom.reference} · ${bom.finished_product}`} onClose={onClose}>
      <div className="flex justify-end mb-4">
        <button className="btn-ghost text-xs border border-line" onClick={() => { onClose(); navigate('/audit?module=BoM') }}>
          Logs ↗
        </button>
      </div>

      <div className="grid sm:grid-cols-2 gap-3 text-sm mb-5 p-4 bg-paper-50 rounded-xl">
        <div><div className="text-ink-400 text-xs mb-0.5">Finished Product</div>{bom.finished_product}</div>
        <div><div className="text-ink-400 text-xs mb-0.5">Yield Quantity</div><span className="mono">{bom.quantity}</span> Units</div>
      </div>

      <div className="eyebrow mb-2">Components</div>
      <table className="w-full text-sm mb-5">
        <thead><tr className="text-ink-500 text-xs border-b border-line">
          <th className="text-left py-2">Component</th>
          <th className="text-right">Quantity</th>
          <th className="text-right">Unit</th>
        </tr></thead>
        <tbody>
          {bom.components.map((c) => (
            <tr key={c.id} className="border-b border-line/50">
              <td className="py-1.5">{c.component}</td>
              <td className="text-right mono">{c.quantity}</td>
              <td className="text-right text-ink-400 text-xs">Units</td>
            </tr>
          ))}
          {bom.components.length === 0 && <tr><td colSpan={3} className="py-4 text-center text-ink-300 text-sm">No components</td></tr>}
        </tbody>
      </table>

      <div className="eyebrow mb-2">Operations</div>
      <table className="w-full text-sm">
        <thead><tr className="text-ink-500 text-xs border-b border-line">
          <th className="text-left py-2">Operation</th>
          <th>Work Center</th>
          <th className="text-right">Duration (min)</th>
        </tr></thead>
        <tbody>
          {bom.operations.map((o) => (
            <tr key={o.id} className="border-b border-line/50">
              <td className="py-1.5">{o.name}</td>
              <td>{o.work_center || '—'}</td>
              <td className="text-right mono">{o.duration_minutes}</td>
            </tr>
          ))}
          {bom.operations.length === 0 && <tr><td colSpan={3} className="py-4 text-center text-ink-300 text-sm">No operations</td></tr>}
        </tbody>
      </table>
    </Modal>
  )
}

function CreateBom({ onClose, onDone }) {
  const [products, setProducts] = useState([])
  const [wcs, setWcs] = useState([])
  const [form, setForm] = useState({ finished_product_id: '', quantity: 1, components: [], operations: [] })
  useEffect(() => {
    api.get('/products').then((r) => setProducts(r.data))
    api.get('/work-centers').then((r) => setWcs(r.data))
  }, [])
  const save = async () => {
    await api.post('/boms', {
      finished_product_id: +form.finished_product_id, quantity: +form.quantity,
      components: form.components.filter((c) => c.component_id).map((c) => ({ component_id: +c.component_id, quantity: +c.quantity })),
      operations: form.operations.filter((o) => o.name).map((o) => ({ name: o.name, work_center_id: o.work_center_id ? +o.work_center_id : null, duration_minutes: +o.duration_minutes })),
    }); onDone()
  }
  const addC = () => setForm({ ...form, components: [...form.components, { component_id: '', quantity: 1 }] })
  const addO = () => setForm({ ...form, operations: [...form.operations, { name: '', work_center_id: '', duration_minutes: 30 }] })
  const setC = (i, k, v) => { const c = [...form.components]; c[i][k] = v; setForm({ ...form, components: c }) }
  const setO = (i, k, v) => { const o = [...form.operations]; o[i][k] = v; setForm({ ...form, operations: o }) }
  return (
    <Modal title="New Bill of Materials" onClose={onClose}>
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Finished Product">
          <select className="input" value={form.finished_product_id} onChange={(e) => setForm({ ...form, finished_product_id: e.target.value })}>
            <option value="">Select…</option>
            {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </Field>
        <Field label="Yield Qty"><input className="input" type="number" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} /></Field>
      </div>
      <div className="mt-5"><div className="flex justify-between mb-2"><div className="eyebrow">Components</div>
        <button className="btn-ghost text-xs" onClick={addC}>+ Add</button></div>
        {form.components.map((c, i) => <div key={i} className="flex gap-2 mb-2">
          <select className="input" value={c.component_id} onChange={(e) => setC(i, 'component_id', e.target.value)}>
            <option value="">Component…</option>{products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
          <input className="input w-24" type="number" value={c.quantity} onChange={(e) => setC(i, 'quantity', e.target.value)} /></div>)}
      </div>
      <div className="mt-4"><div className="flex justify-between mb-2"><div className="eyebrow">Operations</div>
        <button className="btn-ghost text-xs" onClick={addO}>+ Add</button></div>
        {form.operations.map((o, i) => <div key={i} className="flex gap-2 mb-2">
          <input className="input" placeholder="Operation" value={o.name} onChange={(e) => setO(i, 'name', e.target.value)} />
          <select className="input w-40" value={o.work_center_id} onChange={(e) => setO(i, 'work_center_id', e.target.value)}>
            <option value="">Work Center…</option>{wcs.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}</select>
          <input className="input w-24" type="number" value={o.duration_minutes} onChange={(e) => setO(i, 'duration_minutes', e.target.value)} /></div>)}
      </div>
      <div className="flex justify-end gap-2 mt-6">
        <button className="btn-secondary" onClick={onClose}>Cancel</button>
        <button className="btn-primary" onClick={save} disabled={!form.finished_product_id}>Save</button>
      </div>
    </Modal>
  )
}
