import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import api from '../api'
import { PageHeader, Chip, Spinner } from '../components/ui'

const ACTION_TONE = { Created: 'success', Updated: 'info', Deleted: 'danger' }
const MODULES = ['All Modules', 'Sales', 'Purchase', 'Manufacturing', 'Product', 'BoM']

export default function Audit() {
  const [searchParams] = useSearchParams()
  const [data, setData] = useState(null)
  const [module, setModule] = useState(searchParams.get('module') || 'All Modules')
  const [action, setAction] = useState('All Actions')
  const [user, setUser] = useState('All Users')

  const load = () =>
    api.get('/audit-logs', { params: { module, action } }).then((r) => setData(r.data))
  useEffect(() => { load() }, [module, action])

  if (!data) return <Spinner />
  const s = data.summary

  const users = ['All Users', ...new Set(data.logs.map((l) => l.user).filter(Boolean))]

  const filtered = user === 'All Users'
    ? data.logs
    : data.logs.filter((l) => l.user === user)

  return (
    <div>
      <PageHeader title="Audit Logs" subtitle="Traceability" />

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <div className="card p-5">
          <div className="font-display text-3xl text-burgundy-800">{s.total}</div>
          <div className="text-[13px] text-ink-600 mt-1">Total Logs</div>
          <div className="text-xs text-ink-400 mt-0.5">All time logs</div>
        </div>
        <div className="card p-5 border-l-4 border-success">
          <div className="font-display text-3xl text-success">{s.created}</div>
          <div className="text-[13px] text-ink-600 mt-1">Create Actions</div>
          <div className="text-xs text-ink-400 mt-0.5">Records Created</div>
        </div>
        <div className="card p-5 border-l-4 border-info">
          <div className="font-display text-3xl text-info">{s.updated}</div>
          <div className="text-[13px] text-ink-600 mt-1">Update Actions</div>
          <div className="text-xs text-ink-400 mt-0.5">Records Updated</div>
        </div>
        <div className="card p-5 border-l-4 border-danger">
          <div className="font-display text-3xl text-danger">{s.deleted}</div>
          <div className="text-[13px] text-ink-600 mt-1">Delete Actions</div>
          <div className="text-xs text-ink-400 mt-0.5">Records Deleted</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-4">
        <select className="input w-auto" value={user} onChange={(e) => setUser(e.target.value)}>
          {users.map((u) => <option key={u}>{u}</option>)}
        </select>
        <select className="input w-auto" value={module} onChange={(e) => setModule(e.target.value)}>
          {MODULES.map((m) => <option key={m}>{m}</option>)}
        </select>
        <select className="input w-auto" value={action} onChange={(e) => setAction(e.target.value)}>
          {['All Actions', 'Created', 'Updated', 'Deleted'].map((a) => <option key={a}>{a}</option>)}
        </select>
        <div className="text-xs text-ink-400 self-center ml-2">{filtered.length} records</div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-line bg-paper-50">
              <tr>
                {['Date & Time', 'User', 'Module', 'Record Type', 'Record ID', 'Action', 'Field Changed', 'Old Value', 'New Value'].map((h) => (
                  <th key={h} className="th text-left px-3 py-2.5 text-xs font-semibold text-ink-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((l, i) => (
                <tr key={l.id} className={`border-b border-line/60 last:border-0 hover:bg-paper-50/40 transition-colors ${i % 2 ? 'bg-paper-50/20' : ''}`}>
                  <td className="px-3 py-2 text-ink-600 text-xs whitespace-nowrap">
                    {l.created_at.slice(0, 16).replace('T', ' ')}
                  </td>
                  <td className="px-3 py-2 font-medium text-ink-900">{l.user}</td>
                  <td className="px-3 py-2"><span className="chip bg-neutral-bg text-neutral text-xs">{l.module}</span></td>
                  <td className="px-3 py-2 text-ink-700">{l.record_type}</td>
                  <td className="px-3 py-2 font-mono text-xs text-ink-600">{l.record_ref}</td>
                  <td className="px-3 py-2"><Chip tone={ACTION_TONE[l.action] || 'neutral'}>{l.action}</Chip></td>
                  <td className="px-3 py-2 text-xs text-ink-600">{l.field_changed || '—'}</td>
                  <td className="px-3 py-2 text-xs text-ink-400">{l.old_value || '—'}</td>
                  <td className="px-3 py-2 text-xs font-medium text-ink-900">{l.new_value || '—'}</td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={9} className="text-center text-ink-400 py-12">No audit logs found</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination hint */}
        {filtered.length >= 200 && (
          <div className="border-t border-line px-4 py-3 text-xs text-ink-400">
            Showing first 200 records — use filters to narrow results
          </div>
        )}
      </div>
    </div>
  )
}
