import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api'
import { useAuth } from '../auth'
import { Chip, Spinner, StatCard, CircularProgress, ProgressBar, EmptyState } from '../components/ui'
import { money } from '../api'

const SEV_TONE = { critical: 'danger', warning: 'warning', info: 'info' }

/* ─── Mini Sparkline ─── */
function Sparkline({ values = [], color = '#501B24', height = 32 }) {
  if (!values || values.length < 2) return null
  const max = Math.max(...values, 1)
  const min = Math.min(...values, 0)
  const range = max - min || 1
  const w = 80, h = height
  const pts = values.map((v, i) => {
    const x = (i / (values.length - 1)) * w
    const y = h - ((v - min) / range) * (h - 4) - 2
    return `${x},${y}`
  }).join(' ')
  return (
    <svg width={w} height={h} className="overflow-visible">
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx={pts.split(' ').pop().split(',')[0]} cy={pts.split(' ').pop().split(',')[1]} r="2.5" fill={color}/>
    </svg>
  )
}

/* ─── KPI Hero Card ─── */
function HeroKpi({ label, value, icon, path, tone = 'white', trend }) {
  const nav = useNavigate()
  return (
    <div
      onClick={() => path && nav(path)}
      className={`relative overflow-hidden rounded-2xl p-5 cursor-pointer group transition-all duration-300 hover:-translate-y-1 hover:shadow-card-lg ${
        tone === 'white' ? 'bg-white/10 hover:bg-white/20' : 'bg-white/5 hover:bg-white/15'
      }`}
    >
      <div className="text-4xl mb-3">{icon}</div>
      <div className="font-display text-4xl text-white leading-none mb-1">{value}</div>
      <div className="text-rose-300/80 text-sm">{label}</div>
      {trend !== undefined && (
        <div className={`mt-2 text-xs font-semibold ${trend >= 0 ? 'text-green-300' : 'text-red-300'}`}>
          {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%
        </div>
      )}
      <div className="absolute bottom-0 right-0 opacity-10 group-hover:opacity-20 transition-opacity">
        <div className="text-7xl">{icon}</div>
      </div>
    </div>
  )
}

/* ─── Status Bucket ─── */
function StatusBucket({ label, value, tone, onClick }) {
  const tones = {
    neutral: 'text-ink-900', info: 'text-info', warning: 'text-warning',
    success: 'text-success', danger: 'text-danger',
  }
  return (
    <div className={`card p-4 ${onClick ? 'cursor-pointer hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-250' : ''}`} onClick={onClick}>
      <div className={`font-display text-3xl font-semibold ${tones[tone] || 'text-ink-900'}`}>{value ?? '—'}</div>
      <div className="text-[13px] text-ink-500 mt-1 leading-tight">{label}</div>
    </div>
  )
}

/* ─── Module Section ─── */
function ModuleSection({ title, buckets, onAll, tones, navBase }) {
  const navigate = useNavigate()
  const [tab, setTab] = useState('all')
  const total = buckets.reduce((s, [, v]) => s + (v || 0), 0)

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <div className="eyebrow">{title}</div>
          <div className="font-display text-sm text-ink-400">({total} total)</div>
          <div className="flex rounded-full bg-paper-0 border border-line p-0.5">
            {['all', 'my'].map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={`px-3 py-0.5 rounded-full text-xs font-medium capitalize transition-all duration-200 ${tab === t ? 'bg-burgundy-800 text-white' : 'text-ink-500 hover:text-ink-800'}`}>
                {t === 'all' ? 'All' : 'Mine'}
              </button>
            ))}
          </div>
        </div>
        <button className="text-xs text-burgundy-800 hover:underline font-medium" onClick={onAll}>
          View all →
        </button>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {buckets.map(([label, value, myValue], i) => (
          <StatusBucket key={label} label={label} value={tab === 'all' ? value : (myValue ?? value)}
            tone={tones[i]} onClick={() => navigate(navBase)} />
        ))}
      </div>
    </div>
  )
}

/* ─── Low Stock Alert Card ─── */
function LowStockCard({ product, onClick }) {
  const pct = product.on_hand_qty > 0 ? Math.min(100, (product.free_to_use_qty / product.on_hand_qty) * 100) : 0
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-warning-bg border border-warning/20 cursor-pointer hover:border-warning/50 transition-colors" onClick={onClick}>
      <div className="w-10 h-10 rounded-lg bg-warning/20 flex items-center justify-center shrink-0 text-lg">📦</div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-ink-900 truncate">{product.name}</div>
        <ProgressBar value={product.free_to_use_qty} max={Math.max(product.on_hand_qty, 1)} tone="warning" className="mt-1" />
        <div className="text-[11px] text-warning font-semibold mt-0.5">{product.free_to_use_qty} remaining</div>
      </div>
    </div>
  )
}

/* ─── Main Dashboard ─── */
export default function Dashboard() {
  const [data, setData]         = useState(null)
  const [ai, setAi]             = useState(null)
  const [health, setHealth]     = useState(null)
  const [analytics, setAnalytics] = useState(null)
  const [products, setProducts] = useState([])
  const nav = useNavigate()
  const { can, user } = useAuth()
  const hasIntelligence = can('Reports', 'view') || can('Analytics', 'view')
  const canAnalytics    = can('Analytics', 'view')
  const canSales        = can('Sales', 'view')
  const canPurchase     = can('Purchase', 'view')
  const canMfg          = can('Manufacturing', 'view')
  const canProducts     = can('Product', 'view')

  // Role-based greeting
  const greeting = () => {
    const name = user?.name?.split(' ')[0] || 'there'
    const h = new Date().getHours()
    const tod = h < 12 ? 'morning' : h < 17 ? 'afternoon' : 'evening'
    return `Good ${tod}, ${name}`
  }

  useEffect(() => {
    api.get('/dashboard').then(r => setData(r.data))
    if (hasIntelligence) {
      api.get('/ai/insights').then(r => setAi(r.data)).catch(() => {})
      api.get('/ai/health').then(r => setHealth(r.data)).catch(() => {})
    }
    if (canAnalytics) api.get('/analytics').then(r => setAnalytics(r.data)).catch(() => {})
    if (canProducts)  api.get('/products').then(r => setProducts(r.data)).catch(() => {})
  }, [])

  if (!data) return <Spinner />
  const k = data.kpis

  // Low stock products (free_to_use_qty <= 10 and > 0)
  const lowStock = products.filter(p => p.free_to_use_qty <= 10 && p.free_to_use_qty > 0 && !p.procure_on_demand).slice(0, 4)
  const outOfStock = products.filter(p => p.free_to_use_qty <= 0 && !p.procure_on_demand).length

  return (
    <div className="animate-fade-in">
      {/* Page title */}
      <div className="mb-8">
        <div className="eyebrow mb-1">Executive Dashboard</div>
        <h1 className="page-title">{greeting()}</h1>
        <p className="text-ink-400 text-sm mt-1">
          {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </div>

      {/* ── Hero KPI Banner ── */}
      <div className="gradient-brand rounded-3xl p-6 mb-8 shadow-card-lg overflow-hidden relative">
        {/* Decorative leaf */}
        <svg viewBox="0 0 200 300" className="absolute right-0 top-0 h-full opacity-[0.07] pointer-events-none" aria-hidden="true">
          <path d="M100,5 C145,55 162,140 150,215 C138,275 118,295 100,302 C82,295 62,275 50,215 C38,140 55,55 100,5Z" fill="white"/>
          <line x1="100" y1="5" x2="100" y2="302" stroke="white" strokeWidth="2.5"/>
          {[40,70,100,130,160,190,220,250,280].map((y,i) => {
            const w = 14 + i*5
            return <g key={y}><line x1="100" y1={y} x2={100+w} y2={y+13} stroke="white" strokeWidth="1"/><line x1="100" y1={y} x2={100-w} y2={y+13} stroke="white" strokeWidth="1"/></g>
          })}
        </svg>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 relative z-10">
          {canSales    && <HeroKpi label="Pending Deliveries"   value={k.pending_deliveries}     icon="🚚" path="/sales"         tone="white" />}
          {canMfg      && <HeroKpi label="In Production"        value={k.in_production}          icon="⚙️" path="/manufacturing" tone="dim"   />}
          {canSales    && <HeroKpi label="Sales Orders"         value={k.total_sales_orders}     icon="🛍️" path="/sales"         tone="dim"   />}
          {canPurchase && <HeroKpi label="Purchase Orders"      value={k.total_purchase_orders}  icon="📦" path="/purchase"      tone="dim"   />}
        </div>
      </div>

      {/* ── Analytics Quick View ── */}
      {analytics && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <StatCard label="Total Revenue"   value={money(analytics.sales.total_revenue)}       icon="💰" tone="success" onClick={() => nav('/analytics')} />
          <StatCard label="Gross Margin"    value={money(analytics.gross_margin)}              icon="📈" tone={analytics.gross_margin >= 0 ? 'success' : 'danger'} onClick={() => nav('/analytics')} />
          <StatCard label="Inventory Value" value={money(analytics.inventory.total_value)}     icon="🏭" tone="info"    onClick={() => nav('/analytics')} />
          <StatCard label="Low Stock Items" value={analytics.inventory.low_stock_count}        icon="⚠️" tone={analytics.inventory.low_stock_count > 0 ? 'warning' : 'success'} onClick={() => nav('/products')} />
        </div>
      )}

      {/* ── Intelligence Panel ── */}
      {hasIntelligence && (
        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          {/* Business Health */}
          {health && (
            <div className="card p-6">
              <div className="eyebrow mb-4">Business Health</div>
              <div className="flex items-center gap-5 mb-5">
                <CircularProgress
                  value={health.overall_score} max={100} size={88} strokeWidth={8} tone="brand"
                  label={
                    <div className="text-center">
                      <div className="font-display text-xl text-burgundy-800 leading-none">{health.overall_score}</div>
                      <div className="text-[9px] text-ink-400 font-semibold uppercase tracking-wider">{health.grade}</div>
                    </div>
                  }
                />
                <div className="flex-1 min-w-0">
                  <div className="font-display text-2xl text-ink-900 leading-none">Grade {health.grade}</div>
                  <div className="text-xs text-ink-400 mt-1">Overall score</div>
                  <div className={`chip mt-2 ${health.overall_score >= 70 ? 'status-success' : health.overall_score >= 50 ? 'status-warning' : 'status-danger'}`}>
                    <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70"/>
                    {health.overall_score >= 70 ? 'Healthy' : health.overall_score >= 50 ? 'Moderate' : 'Needs attention'}
                  </div>
                </div>
              </div>
              <div className="space-y-2.5">
                {[['Inventory', health.inventory_score], ['Sales', health.sales_score],
                  ['Procurement', health.procurement_score], ['Manufacturing', health.manufacturing_score]].map(([l, v]) => (
                  <div key={l}>
                    <div className="flex justify-between text-xs text-ink-500 mb-1"><span>{l}</span><span className="font-semibold">{v}%</span></div>
                    <ProgressBar value={v} max={100} tone={v >= 70 ? 'success' : v >= 50 ? 'warning' : 'danger'} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* AI Insights */}
          <div className="card p-6 lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="text-xl">🤖</span>
                <div className="eyebrow">AI Insights</div>
              </div>
              <button className="text-xs text-burgundy-800 hover:underline font-medium" onClick={() => nav('/ai')}>
                Open AI →
              </button>
            </div>
            <div className="space-y-2 max-h-72 overflow-auto scrollbar-thin">
              {ai?.insights?.length ? ai.insights.slice(0, 6).map(insight => (
                <div key={insight.id} className="flex items-start gap-3 p-3 rounded-xl bg-paper-50 border border-line/40 hover:border-rose-200 transition-colors">
                  <Chip tone={SEV_TONE[insight.severity] || 'info'}>{insight.severity}</Chip>
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-ink-900 line-clamp-1">{insight.title}</div>
                    <div className="text-xs text-ink-500 line-clamp-2 mt-0.5">{insight.detail}</div>
                  </div>
                </div>
              )) : (
                <div className="text-center py-6 text-ink-400 text-sm">
                  <div className="text-3xl mb-2">✨</div>
                  No insights yet — <button className="text-burgundy-800 hover:underline" onClick={() => nav('/ai')}>generate from AI page</button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Low Stock Alerts (role-based) ── */}
      {canProducts && lowStock.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="text-lg">⚠️</span>
              <div className="eyebrow">Low Stock Alerts</div>
              {outOfStock > 0 && (
                <span className="badge-danger">{outOfStock} out of stock</span>
              )}
            </div>
            <button className="text-xs text-burgundy-800 hover:underline font-medium" onClick={() => nav('/products')}>View all →</button>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {lowStock.map(p => <LowStockCard key={p.id} product={p} onClick={() => nav('/products')} />)}
          </div>
        </div>
      )}

      {/* ── Module Status Sections ── */}
      {canSales && (
        <ModuleSection title="Sales Orders" onAll={() => nav('/sales')} navBase="/sales"
          tones={['neutral', 'info', 'warning', 'success', 'danger']}
          buckets={[
            ['Draft',     data.sales.Draft],
            ['Confirmed', data.sales.Confirmed],
            ['Partial',   data.sales['Partially Delivered']],
            ['Delivered', data.sales['Fully Delivered']],
            ['Cancelled', data.sales.Cancelled],
          ]} />
      )}

      {canPurchase && (
        <ModuleSection title="Purchase Orders" onAll={() => nav('/purchase')} navBase="/purchase"
          tones={['neutral', 'info', 'warning', 'success', 'danger']}
          buckets={[
            ['Draft',     data.purchase.Draft],
            ['Confirmed', data.purchase.Confirmed],
            ['Partial',   data.purchase['Partially Received']],
            ['Received',  data.purchase['Fully Received']],
            ['Cancelled', data.purchase.Cancelled],
          ]} />
      )}

      {canMfg && (
        <ModuleSection title="Manufacturing Orders" onAll={() => nav('/manufacturing')} navBase="/manufacturing"
          tones={['neutral', 'info', 'info', 'success', 'danger']}
          buckets={[
            ['Draft',       data.manufacturing.Draft],
            ['Confirmed',   data.manufacturing.Confirmed],
            ['In-Progress', data.manufacturing['In-Progress']],
            ['Done',        data.manufacturing.Done],
            ['Cancelled',   data.manufacturing.Cancelled],
          ]} />
      )}

      {/* ── Quick Access ── */}
      <div className="card p-6 mb-8">
        <div className="eyebrow mb-4">Quick Actions</div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: 'New Sales Order',       icon: '🛍️', path: '/sales',         canSee: canSales },
            { label: 'New Purchase Order',     icon: '🚚', path: '/purchase',       canSee: canPurchase },
            { label: 'New Manufacturing Order',icon: '⚙️', path: '/manufacturing',  canSee: canMfg },
            { label: 'View AI Insights',       icon: '🤖', path: '/ai',             canSee: hasIntelligence },
          ].filter(a => a.canSee).map(a => (
            <button key={a.label} onClick={() => nav(a.path)}
              className="flex items-center gap-3 p-4 rounded-2xl bg-paper-50 hover:bg-rose-50 border border-line hover:border-rose-200 transition-all duration-250 text-left group">
              <span className="text-2xl group-hover:scale-110 transition-transform">{a.icon}</span>
              <span className="text-sm font-medium text-ink-900">{a.label}</span>
              <svg className="w-4 h-4 text-ink-400 ml-auto group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/>
              </svg>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
