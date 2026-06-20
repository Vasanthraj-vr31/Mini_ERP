import { useEffect, useState } from 'react'
import api from '../api'
import { PageHeader, Spinner, Chip, EmptyState } from '../components/ui'
import DataTable from '../components/DataTable'

export default function Quality() {
  const [mfg, setMfg] = useState(null)
  const [inspections, setInspections] = useState([]) // Mock state for quality checks

  const load = () => {
    api.get('/manufacturing-orders').then(r => setMfg(r.data))
  }
  
  useEffect(() => { load() }, [])

  if (!mfg) return <Spinner />

  const completedMos = mfg.filter(m => m.status === 'Done')

  return (
    <div className="animate-fade-in pb-10">
      <PageHeader title="Quality Control" subtitle="Production Inspections" />

      <div className="grid lg:grid-cols-3 gap-6">
        
        {/* Left Col: Pending Inspections */}
        <div className="lg:col-span-2 space-y-6">
          <div className="card overflow-hidden">
            <div className="px-4 py-3 bg-paper-50 border-b border-line flex justify-between items-center">
              <span className="font-semibold text-ink-900">Completed Manufacturing Orders</span>
              <span className="text-xs bg-white px-2 py-1 rounded-full border border-line">{completedMos.length} awaiting QC</span>
            </div>
            {completedMos.length > 0 ? (
              <DataTable rows={completedMos} columns={[
                { key: 'reference', label: 'MO Ref', mono: true },
                { key: 'finished_product', label: 'Product', render: r => <span className="font-medium text-ink-900">{r.finished_product}</span> },
                { key: 'quantity', label: 'Produced Qty', right: true, mono: true, render: r => <span className="font-bold">{r.quantity}</span> },
                { key: 'assignee', label: 'Worker', render: r => r.assignee || '—' },
                { key: 'action', label: 'Action', right: true, render: r => (
                  <button className="btn-primary py-1 px-3 text-xs" onClick={() => {
                    const pass = confirm(`Pass inspection for MO ${r.reference}?`)
                    if (pass) {
                      setInspections([...inspections, { id: Date.now(), mo: r.reference, product: r.finished_product, status: 'Passed', date: new Date().toISOString() }])
                    } else {
                      setInspections([...inspections, { id: Date.now(), mo: r.reference, product: r.finished_product, status: 'Failed', date: new Date().toISOString() }])
                    }
                  }}>Inspect</button>
                )}
              ]} />
            ) : <EmptyState title="No completed production to inspect" type="manufacturing" />}
          </div>
        </div>

        {/* Right Col: Inspection Log */}
        <div className="lg:col-span-1">
          <div className="card p-4 bg-paper-50 h-[600px] flex flex-col">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-line">
              <div className="flex items-center gap-2">
                <span className="text-lg">📋</span>
                <span className="font-semibold text-ink-900">Inspection Log</span>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto no-scrollbar space-y-3">
              {inspections.length === 0 ? (
                <div className="text-center py-10 text-ink-400 text-sm">No inspections recorded yet</div>
              ) : (
                inspections.map(i => (
                  <div key={i.id} className="bg-white p-3 rounded-xl border border-line shadow-sm">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-mono text-xs font-semibold text-burgundy-800">{i.mo}</span>
                      <Chip tone={i.status === 'Passed' ? 'success' : 'danger'}>{i.status}</Chip>
                    </div>
                    <div className="text-sm font-medium text-ink-900">{i.product}</div>
                    <div className="text-xs text-ink-400 mt-2">{new Date(i.date).toLocaleString()}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
