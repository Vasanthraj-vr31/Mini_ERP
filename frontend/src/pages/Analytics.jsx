import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api'
import { useAuth } from '../auth'
import { PageHeader, Spinner, StatCard, ProgressBar } from '../components/ui'

/* ── Helpers ── */
function fmt(n) {
  if (!n) return '₹0'
  if (n >= 10_000_000) return `₹${(n / 10_000_000).toFixed(2)}Cr`
  if (n >= 100_000)    return `₹${(n / 100_000).toFixed(2)}L`
  if (n >= 1000)       return `₹${(n / 1000).toFixed(1)}K`
  return `₹${Number(n).toLocaleString('en-IN')}`
}

function SectionTitle({ children }) {
  return <div className="eyebrow mt-10 mb-4 text-ink-900 border-b border-line/50 pb-2">{children}</div>
}

/* ── Bar Chart ── */
function BarChart({ data, labelKey, valueKey, colorTone = 'brand', unit = '' }) {
  const max = Math.max(...data.map(d => d[valueKey]), 1)
  return (
    <div className="space-y-3">
      {data.map((d, i) => (
        <div key={i} className="flex items-center gap-3 group">
          <div className="w-24 text-[11px] font-medium text-ink-500 text-right shrink-0 truncate group-hover:text-ink-900 transition-colors">{d[labelKey]}</div>
          <div className="flex-1">
            <ProgressBar value={(d[valueKey] / max) * 100} max={100} tone={colorTone} className="h-2" />
          </div>
          <div className="text-xs font-mono font-semibold text-ink-900 w-24 shrink-0 text-right">
            {unit === '₹' ? fmt(d[valueKey]) : d[valueKey]}
          </div>
        </div>
      ))}
    </div>
  )
}

/* ── SVG Pie / Donut Chart ── */
const PIE_COLORS = ['#501B24', '#8B3A46', '#C47A85', '#D9B3BA', '#F4DDE0', '#3B1218', '#A05060']

function PieChart({ data, donut = false, size = 180, totalLabel = '' }) {
  const total = data.reduce((s, d) => s + (d.value || 0), 0)
  if (!total) return <div className="text-sm text-ink-300 italic py-8 text-center bg-paper-50 rounded-xl border border-dashed border-line">No data available</div>

  const cx = size / 2, cy = size / 2
  const r  = size / 2 - 8
  const ir = donut ? r * 0.6 : 0

  let angle = -Math.PI / 2
  const slices = data.map((d, i) => {
    const sweep   = (d.value / total) * 2 * Math.PI
    const end     = angle + sweep
    const x1 = cx + r * Math.cos(angle), y1 = cy + r * Math.sin(angle)
    const x2 = cx + r * Math.cos(end),   y2 = cy + r * Math.sin(end)
    const large = sweep > Math.PI ? 1 : 0

    let path
    if (donut) {
      const ix1 = cx + ir * Math.cos(angle), iy1 = cy + ir * Math.sin(angle)
      const ix2 = cx + ir * Math.cos(end),   iy2 = cy + ir * Math.sin(end)
      path = `M${x1},${y1} A${r},${r} 0 ${large} 1 ${x2},${y2} L${ix2},${iy2} A${ir},${ir} 0 ${large} 0 ${ix1},${iy1} Z`
    } else {
      path = `M${cx},${cy} L${x1},${y1} A${r},${r} 0 ${large} 1 ${x2},${y2} Z`
    }
    angle = end
    return { ...d, path, pct: ((d.value / total) * 100).toFixed(1), color: d.color || PIE_COLORS[i % PIE_COLORS.length] }
  })

  return (
    <div className="flex flex-col sm:flex-row items-center justify-center gap-8">
      <div className="relative shrink-0 filter drop-shadow-md hover:scale-105 transition-transform duration-500">
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {slices.map((s, i) => (
            <path key={i} d={s.path} fill={s.color} stroke="white" strokeWidth="2" className="transition-all hover:opacity-90 cursor-pointer">
              <title>{s.label}: {s.value} ({s.pct}%)</title>
            </path>
          ))}
          {donut && (
            <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle"
              className="font-display font-semibold" style={{ fontSize: 16, fill: '#501B24' }}>
              {totalLabel || total}
            </text>
          )}
        </svg>
      </div>
      <div className="space-y-3 w-full max-w-[200px]">
        {slices.map((s, i) => (
          <div key={i} className="flex items-center gap-2.5 group">
            <div className="w-3 h-3 rounded-sm shrink-0 shadow-inner" style={{ backgroundColor: s.color }} />
            <span className="text-sm text-ink-600 flex-1 truncate group-hover:text-ink-900 transition-colors">{s.label}</span>
            <span className="text-xs font-mono font-semibold text-ink-900">{s.pct}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ── Main Component ── */
export default function Analytics() {
  const { can } = useAuth()
  const nav = useNavigate()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState('')

  if (!can('Analytics', 'view')) return (
    <div className="flex flex-col items-center justify-center py-32 text-ink-400 animate-fade-in">
      <div className="w-20 h-20 bg-paper-50 rounded-full flex items-center justify-center mb-4 border border-line">
        <span className="text-3xl">🔒</span>
      </div>
      <div className="font-display text-2xl mb-2 text-ink-900">Access Denied</div>
      <div>You do not have permission to view Analytics.</div>
    </div>
  )

  useEffect(() => {
    api.get('/analytics')
      .then(r => { setData(r.data); setLoading(false) })
      .catch(e => { setErr(e?.response?.data?.detail || 'Failed to load analytics'); setLoading(false) })
  }, [])

  if (loading) return <Spinner />
  if (err) return <div className="card p-6 text-danger text-center font-medium bg-danger-bg/50 border-danger/30">{err}</div>
  if (!data) return null

  const { sales, purchase, manufacturing, inventory, top_products_by_revenue, gross_margin, recent_audit_events } = data

  const salesPie = [
    { label: 'Delivered',     value: sales.delivered_orders },
    { label: 'Confirmed',     value: Math.max(0, sales.confirmed_orders - sales.delivered_orders) },
    { label: 'Pending',       value: Math.max(0, sales.pending_delivery - sales.confirmed_orders) },
  ].filter(d => d.value > 0)

  const moPie = [
    { label: 'Completed',   value: manufacturing.completed },
    { label: 'In Progress', value: manufacturing.in_progress },
    { label: 'Planned',     value: manufacturing.planned },
  ].filter(d => d.value > 0)

  const topProductsPie = top_products_by_revenue.slice(0, 5).map(p => ({
    label: p.product.length > 20 ? p.product.slice(0, 20) + '…' : p.product,
    value: Math.round(p.revenue),
  }))

  const revenuePie = [
    { label: 'Revenue',  value: Math.round(sales.total_revenue), color: '#501B24' },
    { label: 'Cost',     value: Math.round(purchase.total_cost), color: '#D9B3BA' },
  ]
  
  const marginPct = sales.total_revenue > 0 ? (gross_margin / sales.total_revenue) * 100 : 0

  return (
    <div className="animate-fade-in pb-10">
      <PageHeader title="Profit Dashboard" subtitle="Financial & Operational Analytics" />

      {/* ── Executive Strip ── */}
      <div className="grid sm:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Revenue" value={fmt(sales.total_revenue)} icon="📈" tone="brand" />
        <StatCard label="Total Cost" value={fmt(purchase.total_cost)} icon="📉" tone="danger" />
        <div className="card p-5 bg-gradient-to-br from-burgundy-800 to-burgundy-900 text-white relative overflow-hidden group">
          <div className="absolute right-0 top-0 w-32 h-32 bg-white/5 rounded-full -mr-10 -mt-10 blur-2xl group-hover:bg-white/10 transition-colors"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-2 opacity-80">
              <span className="text-xl">💰</span>
              <span className="text-xs uppercase tracking-widest font-semibold">Gross Margin</span>
            </div>
            <div className="font-display text-4xl mb-1">{fmt(gross_margin)}</div>
            <div className="text-sm font-medium text-rose-200">{marginPct.toFixed(1)}% of Revenue</div>
          </div>
        </div>
        <StatCard label="Inventory Value" value={fmt(inventory.total_value)} icon="📦" tone="info" />
      </div>

      {/* ── Financial Health ── */}
      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        <div className="card p-6 flex flex-col justify-center">
          <div className="text-sm font-bold text-ink-900 uppercase tracking-wider mb-6 text-center">Revenue vs Cost Breakdown</div>
          <PieChart data={revenuePie} donut size={220} totalLabel={marginPct > 0 ? `+${marginPct.toFixed(0)}%` : '0%'} />
        </div>

        <div className="card p-6">
          <div className="text-sm font-bold text-ink-900 uppercase tracking-wider mb-6">Top Products by Revenue</div>
          {topProductsPie.length ? (
            <div className="space-y-6">
              <PieChart data={topProductsPie} size={160} />
              <div className="pt-4 border-t border-line/50">
                <BarChart data={top_products_by_revenue.slice(0, 5)} labelKey="product" valueKey="revenue" unit="₹" colorTone="brand" />
              </div>
            </div>
          ) : (
            <div className="py-10 text-center text-ink-400 text-sm bg-paper-50 rounded-xl border border-dashed border-line">No sales data available</div>
          )}
        </div>
      </div>

      {/* ── Operational Metrics ── */}
      <div className="grid lg:grid-cols-3 gap-6 mb-8">
        
        {/* Sales */}
        <div className="card p-6">
          <div className="flex items-center gap-2 text-sm font-bold text-ink-900 uppercase tracking-wider mb-6">
            <span className="text-lg">🛒</span> Sales Activity
          </div>
          <div className="space-y-4 mb-6">
            <div className="flex justify-between items-center pb-2 border-b border-line/40">
              <span className="text-xs text-ink-500 font-medium">Total Orders</span>
              <span className="font-mono font-bold text-ink-900">{sales.total_orders}</span>
            </div>
            <div className="flex justify-between items-center pb-2 border-b border-line/40">
              <span className="text-xs text-ink-500 font-medium">Delivered</span>
              <span className="font-mono font-bold text-success">{sales.delivered_orders}</span>
            </div>
            <div className="flex justify-between items-center pb-2 border-b border-line/40">
              <span className="text-xs text-ink-500 font-medium">Pending</span>
              <span className="font-mono font-bold text-warning">{sales.pending_delivery}</span>
            </div>
          </div>
          <PieChart data={salesPie} donut size={140} totalLabel={sales.total_orders} />
        </div>

        {/* Manufacturing */}
        <div className="card p-6">
          <div className="flex items-center gap-2 text-sm font-bold text-ink-900 uppercase tracking-wider mb-6">
            <span className="text-lg">⚙️</span> Production
          </div>
          <div className="space-y-4 mb-6">
            <div className="flex justify-between items-center pb-2 border-b border-line/40">
              <span className="text-xs text-ink-500 font-medium">Total MOs</span>
              <span className="font-mono font-bold text-ink-900">{manufacturing.total_orders}</span>
            </div>
            <div className="flex justify-between items-center pb-2 border-b border-line/40">
              <span className="text-xs text-ink-500 font-medium">Completed</span>
              <span className="font-mono font-bold text-success">{manufacturing.completed}</span>
            </div>
            <div className="flex justify-between items-center pb-2 border-b border-line/40">
              <span className="text-xs text-ink-500 font-medium">In Progress</span>
              <span className="font-mono font-bold text-warning">{manufacturing.in_progress}</span>
            </div>
          </div>
          <PieChart data={moPie} donut size={140} totalLabel={manufacturing.total_orders} />
        </div>

        {/* Inventory */}
        <div className="card p-6 flex flex-col">
          <div className="flex items-center gap-2 text-sm font-bold text-ink-900 uppercase tracking-wider mb-6">
            <span className="text-lg">🏭</span> Inventory Health
          </div>
          <div className="space-y-5 flex-1">
            <div>
              <div className="flex justify-between text-xs font-medium mb-1">
                <span className="text-ink-500">Low Stock Items</span>
                <span className={inventory.low_stock_count > 0 ? 'text-danger font-bold' : 'text-success font-bold'}>{inventory.low_stock_count}</span>
              </div>
              <ProgressBar value={inventory.low_stock_count > 0 ? (inventory.low_stock_count/inventory.total_products)*100 : 0} max={100} tone="danger" />
            </div>
            
            <div className="pt-4 border-t border-line/40">
              <div className="text-[10px] uppercase tracking-widest text-ink-400 font-semibold mb-3">Last 30 Days Movement</div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs text-ink-600 flex items-center gap-1.5"><span className="text-success text-base">↓</span> Stock In</span>
                <span className="font-mono font-bold">{inventory.stock_in_30d} units</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-ink-600 flex items-center gap-1.5"><span className="text-danger text-base">↑</span> Stock Out</span>
                <span className="font-mono font-bold">{inventory.stock_out_30d} units</span>
              </div>
            </div>

            <div className="pt-4 border-t border-line/40 mt-auto">
              <div className="text-[10px] uppercase tracking-widest text-ink-400 font-semibold mb-3">Procurement</div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs text-ink-600">Total POs</span>
                <span className="font-mono font-bold">{purchase.total_orders}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-ink-600">Pending Receipt</span>
                <span className="font-mono font-bold text-warning">{purchase.pending_receipt}</span>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* ── Footer ── */}
      <div className="bg-paper-0 border border-line rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-paper-50 border border-line flex items-center justify-center text-xl">
            📋
          </div>
          <div>
            <div className="text-sm font-bold text-ink-900">System Activity Logs</div>
            <div className="text-xs text-ink-500">{recent_audit_events} events recorded in the last 30 days</div>
          </div>
        </div>
        <button className="btn-secondary whitespace-nowrap" onClick={() => nav('/audit')}>
          View Audit Log →
        </button>
      </div>

    </div>
  )
}
