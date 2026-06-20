import { useEffect, useState } from 'react'
import api from '../api'
import { PageHeader, Chip, Spinner } from '../components/ui'

const ACTION_TONE = { Created: 'success', Updated: 'info', Deleted: 'danger' }

export default function Audit() {
  const [data, setData] = useState(null)
  const [module, setModule] = useState('All Modules')
  const [action, setAction] = useState('All Actions')

  const load = () => api.get('/audit-logs', { params: { module, action } }).then((r) => setData(r.data))
  useEffect(() => { load() }, [module, action])
  if (!data) return <Spinner />
  const s = data.summary

  const Metric = ({ label, value, tone }) => (
    <div className={`card p-5`}>
      <div className={`font-display text-3xl ${tone}`}>{value}</div>
      <div className="text-[13px] text-ink-600 mt-1">{label}</div>
    </div>
  )

  return (
    <div>
      <PageHeader title="Audit Logs" subtitle="Traceability" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <Metric label="Total Logs" value={s.total} tone="text-burgundy-800" />
        <Metric label="Records Created" value={s.created} tone="text-success" />
        <Metric label="Records Updated" value={s.updated} tone="text-info" />
        <Metric label="Records Deleted" value={s.deleted} tone="text-danger" />
      </div>

      <div className="flex gap-2 mb-4">
        <select className="input w-auto" value={module} onChange={(e) => setModule(e.target.value)}>
          {['All Modules', 'Sales', 'Purchase', 'Manufacturing', 'Product'].map((m) => <option key={m}>{m}</option>)}
        </select>
        <select className="input w-auto" value={action} onChange={(e) => setAction(e.target.value)}>
          {['All Actions', 'Created', 'Updated', 'Deleted'].map((a) => <option key={a}>{a}</option>)}
        </select>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full">
          <thead className="border-b border-line"><tr>
            {['Date & Time', 'User', 'Module', 'Record', 'Action', 'Field', 'Old', 'New'].map((h) => <th key={h} className="th">{h}</th>)}
          </tr></thead>
          <tbody>
            {data.logs.map((l, i) => (
              <tr key={l.id} className={`border-b border-line/60 last:border-0 ${i % 2 ? 'bg-paper-50/40' : ''}`}>
                <td className="td text-ink-600 text-xs">{l.created_at.slice(0, 16).replace('T', ' ')}</td>
                <td className="td">{l.user}</td>
                <td className="td">{l.module}</td>
                <td className="td mono text-xs">{l.record_ref}</td>
                <td className="td"><Chip tone={ACTION_TONE[l.action]}>{l.action}</Chip></td>
                <td className="td text-xs">{l.field_changed || '—'}</td>
                <td className="td text-xs text-ink-400">{l.old_value || '—'}</td>
                <td className="td text-xs font-medium">{l.new_value || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
