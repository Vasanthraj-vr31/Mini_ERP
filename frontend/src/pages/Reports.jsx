import { useEffect, useState, useMemo } from 'react'
import api, { money } from '../api'
import { PageHeader, Spinner, StatCard, Chip, EmptyState } from '../components/ui'
import DataTable from '../components/DataTable'
import { ExportButton } from '../components/ExportButton'

const TABS = ['Sales', 'Inventory Aging', 'Purchase', 'Manufacturing']
const RANGES = [
  { label: '7d', days: 7 },
  { label: '30d', days: 30 },
  { label: '90d', days: 90 },
  { label: 'All', days: 9999 },
]

export default function Reports() {
  const [tab, setTab] = useState('Sales')
  const [range, setRange] = useState(30)
  
  const [sales, setSales] = useState(null)
  const [purchase, setPurchase] = useState(null)
  const [mfg, setMfg] = useState(null)
  const [products, setProducts] = useState(null)
  const [audit, setAudit] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    Promise.all([
      api.get('/sales-orders').catch(() => ({ data: [] })),
      api.get('/purchase-orders').catch(() => ({ data: [] })),
      api.get('/manufacturing-orders').catch(() => ({ data: [] })),
      api.get('/products').catch(() => ({ data: [] })),
      api.get('/audit?limit=500').catch(() => ({ data: [] })),
    ]).then(([s, p, m, prod, aud]) => {
      setSales(s.data || [])
      setPurchase(p.data || [])
      setMfg(m.data || [])
      setProducts(prod.data || [])
      setAudit(Array.isArray(aud.data) ? aud.data : aud.data?.items || [])
    }).finally(() => setLoading(false))
  }, [])

  // Filter by date range
  const filterByDate = (items, dateField = 'created_at') => {
    if (range > 1000) return items
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - range)
    return items.filter(i => new Date(i[dateField]) >= cutoff)
  }

  // --- Sales Report Data ---
  const salesData = useMemo(() => {
    if (!sales) return { lines: [], kpis: {} }
    const fSales = filterByDate(sales)
    const lines = fSales.flatMap(s => 
      s.lines.map(l => ({
        order: s.reference,
        date: s.created_at?.slice(0, 10),
        customer: s.customer,
        product: l.product,
        qty: l.ordered_qty,
        price: l.sales_price,
        total: l.total,
        status: s.status
      }))
    )
    const totalRev = lines.filter(l => !['Cancelled', 'Draft'].includes(l.status)).reduce((acc, l) => acc + l.total, 0)
    const totalItems = lines.filter(l => !['Cancelled', 'Draft'].includes(l.status)).reduce((acc, l) => acc + l.qty, 0)
    
    return {
      lines,
      kpis: { orders: fSales.length, revenue: totalRev, items: totalItems }
    }
  }, [sales, range])

  // --- Purchase Report Data ---
  const purchaseData = useMemo(() => {
    if (!purchase) return { lines: [], kpis: {} }
    const fPurchase = filterByDate(purchase)
    const lines = fPurchase.flatMap(p => 
      p.lines.map(l => ({
        order: p.reference,
        date: p.created_at?.slice(0, 10),
        vendor: p.vendor,
        product: l.product,
        qty: l.ordered_qty,
        cost: l.cost_price,
        total: l.total,
        status: p.status
      }))
    )
    const totalSpend = lines.filter(l => !['Cancelled', 'Draft'].includes(l.status)).reduce((acc, l) => acc + l.total, 0)
    
    return {
      lines,
      kpis: { orders: fPurchase.length, spend: totalSpend }
    }
  }, [purchase, range])

  // --- Mfg Report Data ---
  const mfgData = useMemo(() => {
    if (!mfg) return { lines: [], kpis: {} }
    const fMfg = filterByDate(mfg)
    const lines = fMfg.map(m => ({
      order: m.reference,
      date: m.created_at?.slice(0, 10),
      product: m.finished_product,
      qty: m.quantity,
      status: m.status,
      assignee: m.assignee || 'Unassigned'
    }))
    const totalProduced = lines.filter(l => l.status === 'Done').reduce((acc, l) => acc + l.qty, 0)
    
    return {
      lines,
      kpis: { orders: fMfg.length, produced: totalProduced }
    }
  }, [mfg, range])

  // --- Inventory Aging Data ---
  const agingData = useMemo(() => {
    if (!products || !audit) return []
    const now = Date.now()
    
    // Find last movement for each product from audit
    const lastMoves = {}
    audit.forEach(a => {
      // Stock updates or PO receipts might mention the product reference
      if ((a.module === 'Product' || a.module === 'Stock') && a.record_ref) {
        const pDate = new Date(a.timestamp).getTime()
        if (!lastMoves[a.record_ref] || pDate > lastMoves[a.record_ref]) {
          lastMoves[a.record_ref] = pDate
        }
      }
    })

    return products.map(p => {
      const lastMove = lastMoves[p.reference] || new Date(p.created_at || now - 86400000*120).getTime() // default to 120 days if unknown
      const ageDays = Math.floor((now - lastMove) / (1000 * 60 * 60 * 24))
      
      let tone = 'success'
      let status = '✅ Active'
      if (ageDays > 90) { tone = 'danger'; status = '⚠️ Slow Moving' }
      else if (ageDays > 30) { tone = 'warning'; status = '⏳ Moderate' }
      else if (ageDays < 5) { status = '✨ Fresh' }

      return {
        reference: p.reference,
        name: p.name,
        stock: p.on_hand_qty,
        value: p.on_hand_qty * p.cost_price,
        ageDays,
        status,
        tone
      }
    }).filter(p => p.stock > 0).sort((a, b) => b.ageDays - a.ageDays)
  }, [products, audit])

  if (loading) return <Spinner />

  return (
    <div className="animate-fade-in">
      <PageHeader title="Reports Center" subtitle="Business Intelligence & Analytics"
        actions={<>
          <div className="flex bg-paper-0 border border-line rounded-lg p-0.5">
            {RANGES.map(r => (
              <button key={r.label} onClick={() => setRange(r.days)}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                  range === r.days ? 'bg-rose-100 text-burgundy-900 shadow-sm' : 'text-ink-500 hover:text-ink-900 hover:bg-paper-50'
                }`}>
                {r.label}
              </button>
            ))}
          </div>
        </>} />

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-line/60 pb-px overflow-x-auto no-scrollbar">
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-all whitespace-nowrap ${
              tab === t ? 'border-burgundy-800 text-burgundy-800' : 'border-transparent text-ink-500 hover:text-ink-900 hover:border-line'
            }`}>
            {t}
          </button>
        ))}
      </div>

      {/* --- Sales Report --- */}
      {tab === 'Sales' && (
        <div className="animate-fade-in">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <StatCard label="Total Orders" value={salesData.kpis.orders} icon="🛍️" tone="brand" />
            <StatCard label="Total Revenue" value={money(salesData.kpis.revenue)} icon="💰" tone="success" />
            <StatCard label="Items Sold" value={salesData.kpis.items} icon="📦" tone="info" />
          </div>
          <div className="card overflow-hidden">
            <div className="px-4 py-3 bg-paper-50 border-b border-line flex justify-between items-center">
              <span className="font-semibold text-ink-900">Sales Line Items</span>
              <ExportButton data={salesData.lines} filename={`Sales_Report_${range}d`} columns={[
                { key: 'date', label: 'Date' }, { key: 'order', label: 'Order Ref' }, 
                { key: 'customer', label: 'Customer' }, { key: 'product', label: 'Product' },
                { key: 'qty', label: 'Quantity' }, { key: 'price', label: 'Unit Price' },
                { key: 'total', label: 'Total Value' }, { key: 'status', label: 'Status' }
              ]} />
            </div>
            {salesData.lines.length > 0 ? (
              <DataTable rows={salesData.lines} columns={[
                { key: 'date', label: 'Date' },
                { key: 'order', label: 'Order', mono: true },
                { key: 'customer', label: 'Customer' },
                { key: 'product', label: 'Product' },
                { key: 'qty', label: 'Qty', right: true, mono: true },
                { key: 'total', label: 'Total', right: true, mono: true, render: r => money(r.total) },
                { key: 'status', label: 'Status', render: r => <span className="text-[10px] uppercase tracking-wider">{r.status}</span> },
              ]} />
            ) : <EmptyState title="No sales in this period" type="sales" />}
          </div>
        </div>
      )}

      {/* --- Purchase Report --- */}
      {tab === 'Purchase' && (
        <div className="animate-fade-in">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <StatCard label="Total POs" value={purchaseData.kpis.orders} icon="🚚" tone="brand" />
            <StatCard label="Total Spend" value={money(purchaseData.kpis.spend)} icon="💸" tone="danger" />
          </div>
          <div className="card overflow-hidden">
            <div className="px-4 py-3 bg-paper-50 border-b border-line flex justify-between items-center">
              <span className="font-semibold text-ink-900">Procurement Line Items</span>
              <ExportButton data={purchaseData.lines} filename={`Purchase_Report_${range}d`} columns={[
                { key: 'date', label: 'Date' }, { key: 'order', label: 'Order Ref' }, 
                { key: 'vendor', label: 'Vendor' }, { key: 'product', label: 'Product' },
                { key: 'qty', label: 'Quantity' }, { key: 'cost', label: 'Unit Cost' },
                { key: 'total', label: 'Total Value' }, { key: 'status', label: 'Status' }
              ]} />
            </div>
            {purchaseData.lines.length > 0 ? (
              <DataTable rows={purchaseData.lines} columns={[
                { key: 'date', label: 'Date' },
                { key: 'order', label: 'PO Ref', mono: true },
                { key: 'vendor', label: 'Vendor' },
                { key: 'product', label: 'Product' },
                { key: 'qty', label: 'Qty', right: true, mono: true },
                { key: 'total', label: 'Total', right: true, mono: true, render: r => money(r.total) },
                { key: 'status', label: 'Status', render: r => <span className="text-[10px] uppercase tracking-wider">{r.status}</span> },
              ]} />
            ) : <EmptyState title="No purchases in this period" type="default" />}
          </div>
        </div>
      )}

      {/* --- Mfg Report --- */}
      {tab === 'Manufacturing' && (
        <div className="animate-fade-in">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <StatCard label="Work Orders" value={mfgData.kpis.orders} icon="⚙️" tone="brand" />
            <StatCard label="Finished Goods Produced" value={mfgData.kpis.produced} icon="🏆" tone="success" />
          </div>
          <div className="card overflow-hidden">
            <div className="px-4 py-3 bg-paper-50 border-b border-line flex justify-between items-center">
              <span className="font-semibold text-ink-900">Production Output</span>
              <ExportButton data={mfgData.lines} filename={`Mfg_Report_${range}d`} columns={[
                { key: 'date', label: 'Date' }, { key: 'order', label: 'MO Ref' }, 
                { key: 'product', label: 'Finished Product' }, { key: 'qty', label: 'Quantity' },
                { key: 'assignee', label: 'Assignee' }, { key: 'status', label: 'Status' }
              ]} />
            </div>
            {mfgData.lines.length > 0 ? (
              <DataTable rows={mfgData.lines} columns={[
                { key: 'date', label: 'Date' },
                { key: 'order', label: 'MO Ref', mono: true },
                { key: 'product', label: 'Product' },
                { key: 'qty', label: 'Qty', right: true, mono: true },
                { key: 'assignee', label: 'Assignee' },
                { key: 'status', label: 'Status', render: r => <span className="text-[10px] uppercase tracking-wider">{r.status}</span> },
              ]} />
            ) : <EmptyState title="No production in this period" type="manufacturing" />}
          </div>
        </div>
      )}

      {/* --- Inventory Aging --- */}
      {tab === 'Inventory Aging' && (
        <div className="animate-fade-in">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <StatCard label="Total Stocked Products" value={agingData.length} icon="🏭" tone="info" />
            <StatCard label="Slow Moving Items (>90d)" value={agingData.filter(a => a.ageDays > 90).length} icon="🐌" tone="danger" />
            <StatCard label="Value Tied in Slow Stock" value={money(agingData.filter(a => a.ageDays > 90).reduce((s, a) => s + a.value, 0))} icon="📉" tone="danger" />
          </div>
          <div className="card overflow-hidden">
            <div className="px-4 py-3 bg-paper-50 border-b border-line flex items-center justify-between">
              <span className="font-semibold text-ink-900">Inventory Aging Analysis</span>
              <ExportButton data={agingData} filename="Inventory_Aging_Report" columns={[
                { key: 'reference', label: 'Reference' }, { key: 'name', label: 'Product' },
                { key: 'stock', label: 'Stock Qty' }, { key: 'value', label: 'Total Value' },
                { key: 'ageDays', label: 'Days Since Move' }, { key: 'status', label: 'Status' }
              ]} />
            </div>
            {agingData.length > 0 ? (
              <DataTable rows={agingData} columns={[
                { key: 'reference', label: 'Ref', mono: true },
                { key: 'name', label: 'Product', render: r => <span className="font-medium text-ink-900">{r.name}</span> },
                { key: 'stock', label: 'Stock', right: true, mono: true },
                { key: 'value', label: 'Value', right: true, mono: true, render: r => money(r.value) },
                { key: 'ageDays', label: 'Age (Days)', right: true, mono: true, render: r => (
                  <span className={`font-semibold ${r.ageDays > 90 ? 'text-danger' : r.ageDays > 30 ? 'text-warning' : 'text-success'}`}>
                    {r.ageDays}d
                  </span>
                )},
                { key: 'status', label: 'Status', render: r => <Chip tone={r.tone}>{r.status}</Chip> }
              ]} />
            ) : <EmptyState title="No active inventory found" type="product" />}
          </div>
        </div>
      )}

    </div>
  )
}
