import { useEffect, useState, useMemo } from 'react'
import api from '../api'
import { PageHeader, Spinner, Avatar, Drawer, Field, EmptyState } from '../components/ui'
import DataTable from '../components/DataTable'

const blankCustomer = { name: '', email: '', phone: '', address: '' }

export default function Customers() {
  const [rows, setRows] = useState(null)
  const [sales, setSales] = useState(null)
  const [edit, setEdit] = useState(null)
  const [search, setSearch] = useState('')
  const [view, setView] = useState('list')

  const load = () => {
    api.get('/customers').then(r => setRows(r.data))
    api.get('/sales-orders').then(r => setSales(r.data)).catch(() => setSales([]))
  }
  
  useEffect(() => { load() }, [])

  const save = async () => {
    if (edit.id) await api.put(`/customers/${edit.id}`, edit)
    else await api.post('/customers', edit)
    setEdit(null)
    load()
  }

  // Calculate metrics per customer
  const metrics = useMemo(() => {
    if (!sales) return {}
    const m = {}
    sales.forEach(s => {
      if (!m[s.customer]) m[s.customer] = { count: 0, total: 0 }
      m[s.customer].count += 1
      m[s.customer].total += s.total || 0
    })
    return m
  }, [sales])

  const enrichedRows = useMemo(() => {
    if (!rows) return []
    return rows.map(r => ({
      ...r,
      orders: metrics[r.name]?.count || 0,
      total_spent: metrics[r.name]?.total || 0
    })).filter(r => {
      if (!search) return true
      const q = search.toLowerCase()
      return r.name.toLowerCase().includes(q) || r.email?.toLowerCase().includes(q) || r.phone?.includes(q)
    })
  }, [rows, metrics, search])

  if (!rows || !sales) return <Spinner />

  return (
    <div className="animate-fade-in">
      <PageHeader title="Customers" subtitle="CRM & Client Directory"
        actions={<button className="btn-primary" onClick={() => setEdit({ ...blankCustomer })}>+ New Customer</button>} />

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 bg-paper-0 p-3 rounded-2xl border border-line shadow-sm">
        <div className="flex bg-paper-50 border border-line rounded-lg p-0.5">
          <button onClick={() => setView('list')} className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${view === 'list' ? 'bg-white shadow-sm text-ink-900' : 'text-ink-500'}`}>List</button>
          <button onClick={() => setView('grid')} className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${view === 'grid' ? 'bg-white shadow-sm text-ink-900' : 'text-ink-500'}`}>Grid</button>
        </div>
        <div className="relative w-full sm:w-64 shrink-0">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input type="text" placeholder="Search customers…" value={search} onChange={e => setSearch(e.target.value)}
            className="input pl-9 py-2 text-sm w-full bg-paper-50 focus:bg-paper-0" />
        </div>
      </div>

      {enrichedRows.length === 0 ? (
        <EmptyState title="No customers found" type="default" />
      ) : view === 'list' ? (
        <div className="card overflow-hidden">
          <DataTable onRow={r => setEdit(r)}
            columns={[
              { key: 'name', label: 'Customer', render: r => (
                <div className="flex items-center gap-3">
                  <Avatar name={r.name} size="sm" />
                  <span className="font-semibold text-ink-900">{r.name}</span>
                </div>
              )},
              { key: 'email', label: 'Email', render: r => r.email || '—' },
              { key: 'phone', label: 'Phone', render: r => r.phone || '—' },
              { key: 'orders', label: 'Orders', right: true, mono: true },
              { key: 'total_spent', label: 'Total Spent', right: true, mono: true, render: r => `₹${r.total_spent.toLocaleString('en-IN')}` },
            ]} rows={enrichedRows} />
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {enrichedRows.map(r => (
            <div key={r.id} onClick={() => setEdit(r)} className="card p-5 cursor-pointer hover:shadow-card-hover hover:-translate-y-0.5 transition-all group">
              <div className="flex items-start justify-between mb-4">
                <Avatar name={r.name} size="md" />
                <div className="bg-rose-50 text-burgundy-900 px-2 py-1 rounded text-xs font-mono font-semibold">
                  {r.orders} orders
                </div>
              </div>
              <div className="font-semibold text-ink-900 text-lg mb-1 group-hover:text-burgundy-800 transition-colors truncate">{r.name}</div>
              <div className="text-xs text-ink-500 mb-4 truncate">{r.email || 'No email provided'}</div>
              <div className="pt-3 border-t border-line/40 flex justify-between items-end">
                <span className="text-[10px] text-ink-400 uppercase tracking-widest font-bold">Total Spent</span>
                <span className="font-mono font-bold text-ink-900">₹{r.total_spent.toLocaleString('en-IN')}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      <Drawer open={!!edit} onClose={() => setEdit(null)} title={edit?.id ? 'Edit Customer' : 'New Customer'} width="max-w-md">
        {edit && (
          <div className="flex flex-col h-full space-y-5 pb-20">
            <div className="flex items-center justify-center py-6 bg-paper-50 rounded-xl border border-line">
              <Avatar name={edit.name || 'New Customer'} size="xl" />
            </div>
            
            <Field label="Customer Name">
              <input className="input" value={edit.name} onChange={e => setEdit({ ...edit, name: e.target.value })} placeholder="Company or Individual Name" autoFocus />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Email Address">
                <input className="input" type="email" value={edit.email || ''} onChange={e => setEdit({ ...edit, email: e.target.value })} placeholder="contact@example.com" />
              </Field>
              <Field label="Phone Number">
                <input className="input" type="tel" value={edit.phone || ''} onChange={e => setEdit({ ...edit, phone: e.target.value })} placeholder="+91 ..." />
              </Field>
            </div>
            <Field label="Billing/Shipping Address">
              <textarea className="input min-h-[100px]" value={edit.address || ''} onChange={e => setEdit({ ...edit, address: e.target.value })} placeholder="Full address..." />
            </Field>

            <div className="absolute bottom-0 left-0 right-0 p-4 bg-paper-0 border-t border-line flex justify-end gap-2">
              <button className="btn-secondary" onClick={() => setEdit(null)}>Cancel</button>
              <button className="btn-primary" onClick={save} disabled={!edit.name}>Save Customer</button>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  )
}
