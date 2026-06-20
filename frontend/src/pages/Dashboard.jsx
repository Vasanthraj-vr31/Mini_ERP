import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api'
import { PageHeader, Chip, Spinner } from '../components/ui'

const SEV_TONE = { critical: 'danger', warning: 'warning', info: 'info' }

function Bucket({ label, value, tone }) {
  const tones = {
    neutral: 'text-neutral', info: 'text-info', warning: 'text-warning',
    success: 'text-success', danger: 'text-danger',
  }
  return (
    <div className="card p-4">
      <div className={`font-display text-3xl ${tones[tone] || 'text-ink-900'}`}>{value}</div>
      <div className="text-[13px] text-ink-600 mt-1">{label}</div>
    </div>
  )
}

function Section({ title, buckets, onAll, tones }) {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-3">
        <div className="eyebrow">{title}</div>
        <button className="text-xs text-burgundy-800 hover:underline" onClick={onAll}>View all →</button>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {buckets.map(([label, value], i) => (
          <Bucket key={label} label={label} value={value} tone={tones[i]} />
        ))}
      </div>
    </div>
  )
}

export default function Dashboard() {
  const [data, setData] = useState(null)
  const [ai, setAi] = useState(null)
  const [health, setHealth] = useState(null)
  const nav = useNavigate()

  useEffect(() => {
    api.get('/dashboard').then((r) => setData(r.data))
    api.get('/ai/insights').then((r) => setAi(r.data))
    api.get('/ai/health').then((r) => setHealth(r.data))
  }, [])

  if (!data) return <Spinner />
  const k = data.kpis

  return (
    <div>
      <PageHeader title="Good day, let's ship furniture" subtitle="Today at the workshop" />

      {/* Hero strip */}
      <div className="bg-burgundy-800 rounded-2xl p-6 mb-8 text-white grid sm:grid-cols-4 gap-6">
        {[
          ['Pending Deliveries', k.pending_deliveries],
          ['In Production', k.in_production],
          ['Sales Orders', k.total_sales_orders],
          ['Purchase Orders', k.total_purchase_orders],
        ].map(([l, v]) => (
          <div key={l}>
            <div className="font-display text-4xl">{v}</div>
            <div className="text-rose-300 text-sm mt-1">{l}</div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6 mb-8">
        {/* Health score */}
        <div className="card p-6">
          <div className="eyebrow mb-3">Business Health</div>
          {health && (
            <>
              <div className="flex items-end gap-2">
                <span className="font-display text-5xl text-burgundy-800">{health.overall_score}</span>
                <span className="chip bg-success-bg text-success mb-2">Grade {health.grade}</span>
              </div>
              <div className="space-y-2 mt-4">
                {[['Inventory', health.inventory_score], ['Sales', health.sales_score],
                  ['Procurement', health.procurement_score], ['Manufacturing', health.manufacturing_score]].map(([l, v]) => (
                  <div key={l}>
                    <div className="flex justify-between text-xs text-ink-600"><span>{l}</span><span>{v}</span></div>
                    <div className="h-1.5 bg-rose-100 rounded-full mt-1 overflow-hidden">
                      <div className="h-full bg-burgundy-700 rounded-full" style={{ width: `${v}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* AI insights */}
        <div className="card p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <div className="eyebrow">AI Insights</div>
            <button className="text-xs text-burgundy-800 hover:underline" onClick={() => nav('/ai')}>Open AI →</button>
          </div>
          <div className="space-y-2 max-h-72 overflow-auto">
            {ai?.insights?.length ? ai.insights.slice(0, 8).map((i) => (
              <div key={i.id} className="flex items-start gap-3 p-3 rounded-xl bg-paper-50">
                <Chip tone={SEV_TONE[i.severity] || 'info'}>{i.severity}</Chip>
                <div className="min-w-0">
                  <div className="text-sm font-medium text-ink-900">{i.title}</div>
                  <div className="text-xs text-ink-600">{i.detail}</div>
                </div>
              </div>
            )) : <div className="text-ink-400 text-sm">No insights yet — generate from the AI page.</div>}
          </div>
        </div>
      </div>

      <Section title="Sale Orders" onAll={() => nav('/sales')}
        tones={['neutral', 'info', 'warning', 'success', 'danger']}
        buckets={[['Draft', data.sales.Draft], ['Confirmed', data.sales.Confirmed],
                  ['Partial', data.sales['Partially Delivered']], ['Delivered', data.sales['Fully Delivered']],
                  ['Cancelled', data.sales.Cancelled]]} />
      <Section title="Purchase Orders" onAll={() => nav('/purchase')}
        tones={['neutral', 'info', 'warning', 'success', 'danger']}
        buckets={[['Draft', data.purchase.Draft], ['Confirmed', data.purchase.Confirmed],
                  ['Partial', data.purchase['Partially Received']], ['Received', data.purchase['Fully Received']],
                  ['Cancelled', data.purchase.Cancelled]]} />
      <Section title="Manufacturing Orders" onAll={() => nav('/manufacturing')}
        tones={['neutral', 'info', 'info', 'success', 'danger']}
        buckets={[['Draft', data.manufacturing.Draft], ['Confirmed', data.manufacturing.Confirmed],
                  ['In-Progress', data.manufacturing['In-Progress']], ['Done', data.manufacturing.Done],
                  ['Cancelled', data.manufacturing.Cancelled]]} />
    </div>
  )
}
