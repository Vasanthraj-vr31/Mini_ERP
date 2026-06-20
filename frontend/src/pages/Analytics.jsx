import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api'
import { useAuth } from '../auth'
import { PageHeader, Spinner } from '../components/ui'

function KpiCard({ label, value, sub, accent = false }) {
  return (
    <div className={`card p-5 ${accent ? 'bg-burgundy-800 text-white' : ''}`}>
      <div className={`font-display text-3xl ${accent ? 'text-white' : 'text-ink-900'}`}>{value}</div>
      <div className={`text-sm mt-1 ${accent ? 'text-rose-300' : 'text-ink-600'}`}>{label}</div>
      {sub && <div className={`text-xs mt-1 ${accent ? 'text-rose-400' : 'text-ink-400'}`}>{sub}</div>}
    </div>
  )
}

function SectionTitle({ children }) {
  return <div className="eyebrow mt-8 mb-4">{children}</div>
}

function BarChart({ data, labelKey, valueKey, color = '#501B24', unit = '' }) {
  const max = Math.max(...data.map(d => d[valueKey]), 1)
  return (
    <div className="space-y-2">
      {data.map((d, i) => (
        <div key={i} className="flex items-center gap-3">
          <div className="w-20 text-xs text-ink-400 text-right shrink-0 truncate">{d[labelKey]}</div>
          <div className="flex-1 bg-rose-100 rounded-full h-2.5 overflow-hidden">
            <div className="h-full rounded-full transition-all" style={{ width: `${(d[valueKey] / max) * 100}%`, backgroundColor: color }} />
          </div>
          <div className="text-xs text-ink-600 w-20 shrink-0">
            {unit === '₹' ? `₹${Number(d[valueKey]).toLocaleString('en-IN')}` : d[valueKey]}
          </div>
        </div>
      ))}
    </div>
  )
}

function fmt(n) {
  if (n >= 10_000_000) return `₹${(n / 10_000_000).toFixed(1)}Cr`
  if (n >= 100_000) return `₹${(n / 100_000).toFixed(1)}L`
  if (n >= 1000) return `₹${(n / 1000).toFixed(1)}K`
  return `₹${Number(n).toLocaleString('en-IN')}`
}

export default function Analytics() {
  const { can } = useAuth()
  const nav = useNavigate()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState('')

  if (!can('Analytics', 'view')) return (
    <div className="flex flex-col items-center justify-center py-20 text-ink-400">
      <div className="font-display text-4xl mb-2">403</div>
      <div>Analytics access not permitted for your role</div>
    </div>
  )

  useEffect(() => {
    api.get('/analytics')
      .then(r => { setData(r.data); setLoading(false) })
      .catch(e => { setErr(e?.response?.data?.detail || 'Failed to load analytics'); setLoading(false) })
  }, [])

  if (loading) return <Spinner />
  if (err) return <div className="text-danger p-4">{err}</div>
  if (!data) return null

  const { sales, purchase, manufacturing, inventory, top_products_by_revenue, gross_margin, recent_audit_events } = data

  return (
    <div>
      <PageHeader title="Analytics" subtitle="Business Intelligence" />

      {/* Top KPI strip */}
      <div className="bg-burgundy-800 rounded-2xl p-6 mb-8 text-white grid sm:grid-cols-4 gap-6">
        {[
          ['Total Revenue', fmt(sales.total_revenue)],
          ['Total Cost', fmt(purchase.total_cost)],
          ['Gross Margin', fmt(gross_margin)],
          ['Inventory Value', fmt(inventory.total_value)],
        ].map(([l, v]) => (
          <div key={l}>
            <div className="font-display text-3xl">{v}</div>
            <div className="text-rose-300 text-sm mt-1">{l}</div>
          </div>
        ))}
      </div>

      {/* Sales */}
      <SectionTitle>Sales Performance</SectionTitle>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <KpiCard label="Total Orders" value={sales.total_orders} />
        <KpiCard label="Confirmed" value={sales.confirmed_orders} />
        <KpiCard label="Delivered" value={sales.delivered_orders} />
        <KpiCard label="Pending Delivery" value={sales.pending_delivery} />
      </div>
      <div className="card p-5 mb-6">
        <div className="text-sm font-medium text-ink-700 mb-4">Monthly Revenue (Last 6 Months)</div>
        <BarChart data={sales.monthly_revenue} labelKey="month" valueKey="revenue" unit="₹" />
      </div>

      {/* Purchase */}
      <SectionTitle>Procurement</SectionTitle>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
        <KpiCard label="Total POs" value={purchase.total_orders} />
        <KpiCard label="Received" value={purchase.received_orders} />
        <KpiCard label="Pending Receipt" value={purchase.pending_receipt} />
      </div>
      <div className="card p-5 mb-6">
        <div className="text-sm font-medium text-ink-700 mb-4">Monthly Purchase Cost (Last 6 Months)</div>
        <BarChart data={purchase.monthly_cost} labelKey="month" valueKey="cost" color="#8B4513" unit="₹" />
      </div>

      {/* Manufacturing */}
      <SectionTitle>Manufacturing</SectionTitle>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        <KpiCard label="Total MOs" value={manufacturing.total_orders} />
        <KpiCard label="Completed" value={manufacturing.completed} accent />
        <KpiCard label="In Progress" value={manufacturing.in_progress} />
        <KpiCard label="Planned" value={manufacturing.planned} />
      </div>

      {/* Inventory + Top Products side by side */}
      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        <div>
          <SectionTitle>Inventory Health</SectionTitle>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <KpiCard label="Total Products" value={inventory.total_products} />
            <KpiCard label="Low Stock Items" value={inventory.low_stock_count} />
            <KpiCard label="Stock In (30d)" value={inventory.stock_in_30d} sub="units received" />
            <KpiCard label="Stock Out (30d)" value={inventory.stock_out_30d} sub="units consumed" />
          </div>
        </div>

        <div>
          <SectionTitle>Top Products by Revenue</SectionTitle>
          {top_products_by_revenue.length ? (
            <div className="card p-5">
              <BarChart data={top_products_by_revenue} labelKey="product" valueKey="revenue" unit="₹" />
            </div>
          ) : (
            <div className="card p-5 text-ink-400 text-sm">No delivered sales yet</div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="card p-5 flex items-center gap-6 text-sm">
        <div>
          <span className="text-ink-400">Recent Audit Events (30d):</span>
          <span className="ml-2 font-display text-xl text-burgundy-800">{recent_audit_events}</span>
        </div>
        <button className="ml-auto text-xs text-burgundy-800 hover:underline" onClick={() => nav('/audit')}>
          View Audit Log →
        </button>
      </div>
    </div>
  )
}
