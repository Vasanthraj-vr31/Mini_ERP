import { useEffect, useState } from 'react'
import api from '../api'
import { PageHeader, Spinner, Chip, Drawer, Field, Avatar, EmptyState } from '../components/ui'
import DataTable from '../components/DataTable'
import ActivityTimeline from '../components/ActivityTimeline'
import { getProductImage } from '../data/productImages'

export default function Warehouse() {
  const [products, setProducts] = useState(null)
  const [adjust, setAdjust] = useState(null) // Product being adjusted
  const [newQty, setNewQty] = useState('')
  const [reason, setReason] = useState('')
  
  const load = () => api.get('/products').then(r => setProducts(r.data))
  useEffect(() => { load() }, [])

  const submitAdjustment = async () => {
    if (!adjust || newQty === '') return
    const diff = Number(newQty) - adjust.on_hand_qty
    
    // Update product qty via standard API
    await api.put(`/products/${adjust.id}`, {
      ...adjust,
      on_hand_qty: Number(newQty)
    })
    
    // Create an explicit audit log for this manual adjustment if possible,
    // though backend /products PUT already creates a 'Product' audit log.
    // We can simulate an audit log explicitly if backend allows POST /audit
    try {
      await api.post('/audit', {
        module: 'Stock',
        action: 'Manual Adjustment',
        record_ref: adjust.reference,
        detail: `Adjusted inventory from ${adjust.on_hand_qty} to ${newQty} (${diff > 0 ? '+'+diff : diff}). Reason: ${reason || 'Physical count'}`
      })
    } catch(e) {
      // Ignore if POST /audit is not exposed
    }

    setAdjust(null)
    setNewQty('')
    setReason('')
    load()
  }

  if (!products) return <Spinner />

  return (
    <div className="animate-fade-in pb-10">
      <PageHeader title="Warehouse & Inventory" subtitle="Stock Control & Adjustments" />

      <div className="grid lg:grid-cols-3 gap-6">
        
        {/* Left Col: Stock Table */}
        <div className="lg:col-span-2 space-y-6">
          <div className="card overflow-hidden">
            <div className="px-4 py-3 bg-paper-50 border-b border-line flex justify-between items-center">
              <span className="font-semibold text-ink-900">Current Stock Levels</span>
              <span className="text-xs bg-white px-2 py-1 rounded-full border border-line">{products.length} products</span>
            </div>
            {products.length > 0 ? (
              <DataTable rows={products} columns={[
                { key: 'photo', label: '', render: r => (
                  <div className="w-8 h-8 rounded overflow-hidden border border-line bg-white">
                    <img src={r.photo || getProductImage(r.name, null, r.id)} alt={r.name} className="w-full h-full object-cover" />
                  </div>
                )},
                { key: 'reference', label: 'Reference', mono: true },
                { key: 'name', label: 'Product', render: r => <span className="font-medium text-ink-900">{r.name}</span> },
                { key: 'on_hand_qty', label: 'On Hand', right: true, mono: true, render: r => (
                  <span className={`font-bold ${r.on_hand_qty === 0 ? 'text-danger' : 'text-ink-900'}`}>{r.on_hand_qty}</span>
                )},
                { key: 'free_to_use_qty', label: 'Free to Use', right: true, mono: true, render: r => (
                  <span className={r.free_to_use_qty < 0 ? 'text-danger' : 'text-success'}>{r.free_to_use_qty}</span>
                )},
                { key: 'action', label: '', right: true, render: r => (
                  <button className="btn-secondary py-1 px-2 text-xs" onClick={() => { setAdjust(r); setNewQty(r.on_hand_qty) }}>Adjust</button>
                )}
              ]} />
            ) : <EmptyState title="No products in warehouse" type="product" />}
          </div>
        </div>

        {/* Right Col: Timeline */}
        <div className="lg:col-span-1">
          <div className="card p-4 bg-paper-50 h-[600px] flex flex-col">
            <div className="flex items-center gap-2 mb-4 pb-2 border-b border-line">
              <span className="text-lg">📋</span>
              <span className="font-semibold text-ink-900">Recent Stock Movements</span>
            </div>
            <div className="flex-1 overflow-y-auto no-scrollbar">
              <ActivityTimeline module="Stock" compact={false} />
            </div>
          </div>
        </div>

      </div>

      {/* Adjust Stock Drawer */}
      <Drawer open={!!adjust} onClose={() => setAdjust(null)} title="Manual Stock Adjustment" width="max-w-sm">
        {adjust && (
          <div className="flex flex-col h-full space-y-6 pb-20">
            <div className="bg-paper-50 p-4 rounded-xl border border-line flex items-center gap-4">
              <div className="w-16 h-16 rounded-lg overflow-hidden border border-line bg-white shrink-0">
                <img src={adjust.photo || getProductImage(adjust.name, null, adjust.id)} alt={adjust.name} className="w-full h-full object-cover" />
              </div>
              <div>
                <div className="font-mono text-xs text-ink-500 mb-0.5">{adjust.reference}</div>
                <div className="font-semibold text-ink-900 leading-tight">{adjust.name}</div>
              </div>
            </div>

            <div className="flex items-center justify-between px-4 py-3 bg-burgundy-800/5 rounded-xl border border-burgundy-800/10">
              <span className="text-sm font-medium text-ink-700">Current On Hand Qty</span>
              <span className="font-mono text-xl font-bold text-burgundy-800">{adjust.on_hand_qty}</span>
            </div>

            <Field label="New On Hand Quantity">
              <input className="input text-lg font-mono py-3" type="number" value={newQty} onChange={e => setNewQty(e.target.value)} autoFocus />
            </Field>

            <Field label="Reason for Adjustment">
              <textarea className="input min-h-[100px]" placeholder="e.g., Physical count discrepancy, damaged goods..." value={reason} onChange={e => setReason(e.target.value)} />
            </Field>

            {newQty !== '' && Number(newQty) !== adjust.on_hand_qty && (
              <div className={`p-3 rounded-xl border text-sm flex items-center gap-2 ${Number(newQty) > adjust.on_hand_qty ? 'bg-success-bg border-success/20 text-success' : 'bg-danger-bg border-danger/20 text-danger'}`}>
                <span className="text-lg">{Number(newQty) > adjust.on_hand_qty ? '📈' : '📉'}</span>
                Net change: <span className="font-bold font-mono">{Number(newQty) - adjust.on_hand_qty > 0 ? '+' : ''}{Number(newQty) - adjust.on_hand_qty}</span> units
              </div>
            )}

            <div className="absolute bottom-0 left-0 right-0 p-4 bg-paper-0 border-t border-line flex justify-end gap-2">
              <button className="btn-secondary" onClick={() => setAdjust(null)}>Cancel</button>
              <button className="btn-primary" onClick={submitAdjustment} disabled={newQty === '' || Number(newQty) === adjust.on_hand_qty}>Confirm Adjustment</button>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  )
}
