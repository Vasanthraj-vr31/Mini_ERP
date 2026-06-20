import { useEffect, useState } from 'react'
import api from '../api'
import { PageHeader, Chip, Spinner } from '../components/ui'

const SEV = { critical: 'danger', warning: 'warning', info: 'info' }

export default function AI() {
  const [forecast, setForecast] = useState(null)
  const [vendors, setVendors] = useState([])
  const [mfg, setMfg] = useState(null)
  const [busy, setBusy] = useState(false)

  const load = () => {
    api.get('/ai/forecast').then((r) => setForecast(r.data))
    api.get('/ai/vendors').then((r) => setVendors(r.data))
    api.get('/ai/manufacturing').then((r) => setMfg(r.data))
  }
  useEffect(() => { load() }, [])
  const regen = async () => { setBusy(true); await api.post('/ai/regenerate'); load(); setBusy(false) }
  if (!forecast) return <Spinner />

  return (
    <div>
      <PageHeader title="AI Insights" subtitle="Decision support"
        actions={<button className="btn-primary" onClick={regen} disabled={busy}>{busy ? 'Analyzing…' : 'Regenerate Insights'}</button>} />

      <div className="card p-6 mb-6">
        <div className="eyebrow mb-3">Inventory Forecasting · runout & reorder</div>
        <table className="w-full text-sm">
          <thead><tr className="text-ink-600 text-[13px] border-b border-line">
            <th className="text-left py-2">Product</th><th className="text-right">Velocity/day</th>
            <th className="text-right">Free</th><th className="text-right">Runout</th>
            <th className="text-right">Reorder Qty</th><th className="text-right">Risk</th></tr></thead>
          <tbody>{forecast.map((f) => (
            <tr key={f.product_id} className="border-b border-line/50">
              <td className="py-2">{f.product}</td>
              <td className="text-right mono">{f.daily_velocity}</td>
              <td className="text-right mono">{f.free_to_use_qty}</td>
              <td className="text-right mono">{f.runout_days == null ? '—' : `${f.runout_days}d`}</td>
              <td className="text-right mono font-semibold">{f.recommended_reorder_qty || '—'}</td>
              <td className="text-right"><Chip tone={SEV[f.severity]}>{f.severity}</Chip></td>
            </tr>
          ))}</tbody>
        </table>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <div className="eyebrow mb-3">Vendor Recommendation</div>
          {vendors.map((v, i) => (
            <div key={v.vendor_id} className="flex items-center justify-between py-2 border-b border-line/50 last:border-0">
              <div>
                <div className="font-medium text-sm flex items-center gap-2">
                  {i === 0 && <Chip tone="success">Best</Chip>}{v.vendor_name}
                </div>
                <div className="text-xs text-ink-600">On-time {v.on_time_pct}% · Fulfillment {v.fulfillment_pct}% · Price idx {v.price_index}</div>
              </div>
              <div className="font-display text-2xl text-burgundy-800">{v.overall}</div>
            </div>
          ))}
        </div>

        <div className="card p-6">
          <div className="eyebrow mb-3">Manufacturing Risk</div>
          {mfg?.risks?.length ? mfg.risks.map((r, i) => (
            <div key={i} className="flex items-start gap-2 py-2 border-b border-line/50 last:border-0">
              <Chip tone={SEV[r.severity]}>{r.type}</Chip>
              <div className="text-sm text-ink-900"><b>{r.mo}</b> · {r.detail}</div>
            </div>
          )) : <div className="text-ink-400 text-sm">No active risks.</div>}
          {mfg?.bottlenecks?.length > 0 && (
            <div className="mt-3 pt-3 border-t border-line">
              <div className="eyebrow mb-2">Bottlenecks</div>
              {mfg.bottlenecks.map((b, i) => <div key={i} className="text-sm">{b.work_center}: <b>{b.queued_hours}h</b> queued</div>)}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
