import { useEffect, useState, useMemo } from 'react'
import api, { money } from '../api'
import { useAuth } from '../auth'
import { PageHeader, Spinner, Chip, EmptyState } from '../components/ui'
import DataTable from '../components/DataTable'
import { InvoicePrintView } from '../components/ExportButton'

export default function Invoices() {
  const { user, isCustomer } = useAuth()
  const [sales, setSales] = useState(null)
  const [purchase, setPurchase] = useState(null)
  const [view, setView] = useState('Receivable') // Receivable (Sales) or Payable (Purchase)
  const [printInvoice, setPrintInvoice] = useState(null)

  const load = () => {
    api.get('/sales-orders').then(r => setSales(r.data))
    api.get('/purchase-orders').then(r => setPurchase(r.data))
  }
  
  useEffect(() => { load() }, [])

  const invoices = useMemo(() => {
    if (view === 'Receivable' && sales) {
      return sales.filter(s => s.status !== 'Draft' && s.status !== 'Cancelled').map(s => ({
        id: s.id,
        reference: `INV-${s.reference}`,
        source: s.reference,
        partner: s.customer,
        date: s.created_at?.slice(0, 10),
        amount: s.total,
        status: s.status === 'Fully Delivered' ? 'Paid' : 'Open'
      }))
    } else if (view === 'Payable' && purchase) {
      return purchase.filter(p => p.status !== 'Draft' && p.status !== 'Cancelled').map(p => ({
        id: p.id,
        reference: `BILL-${p.reference}`,
        source: p.reference,
        partner: p.vendor,
        date: p.created_at?.slice(0, 10),
        amount: p.total,
        status: p.status === 'Fully Received' ? 'Paid' : 'Open'
      }))
    }
    return []
  }, [sales, purchase, view])

  if (!sales || !purchase) return <Spinner />

  const handlePrint = (r) => {
    const isSales = view === 'Receivable'
    const order = isSales ? sales.find(s => s.reference === r.source) : purchase.find(p => p.reference === r.source)
    
    setPrintInvoice({
      number: r.reference,
      date: r.date,
      customer: r.partner,
      address: 'On File',
      total: r.amount,
      lines: order?.components || order?.lines || [{ product: 'Order Total', qty: 1, price: r.amount, total: r.amount }]
    })
    
    setTimeout(() => {
      window.print()
      // Note: In a real app we might want to clear this after print dialog closes,
      // but keeping it rendered is harmless since it's `hidden print:block`.
    }, 100)
  }

  return (
    <>
    <div className="animate-fade-in pb-10 print:hidden">
      <PageHeader title="Invoicing & Billing" subtitle="Financial Operations" />

      <div className="flex bg-paper-0 border border-line rounded-lg p-0.5 w-fit mb-6 shadow-sm">
        <button onClick={() => setView('Receivable')} className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${view === 'Receivable' ? 'bg-burgundy-800 text-white shadow-sm' : 'text-ink-500 hover:text-ink-900 hover:bg-paper-50'}`}>
          Accounts Receivable (Sales)
        </button>
        {!isCustomer() && (
          <button onClick={() => setView('Payable')} className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${view === 'Payable' ? 'bg-burgundy-800 text-white shadow-sm' : 'text-ink-500 hover:text-ink-900 hover:bg-paper-50'}`}>
            Accounts Payable (Purchase)
          </button>
        )}
      </div>

      <div className="card overflow-hidden">
        <div className="px-4 py-3 bg-paper-50 border-b border-line flex justify-between items-center">
          <span className="font-semibold text-ink-900">{view}s</span>
          <span className="text-xs bg-white px-2 py-1 rounded-full border border-line">{invoices.length} invoices</span>
        </div>
        {invoices.length > 0 ? (
          <DataTable rows={invoices} columns={[
            { key: 'reference', label: 'Invoice No', mono: true, render: r => <span className="font-bold text-burgundy-800">{r.reference}</span> },
            { key: 'source', label: 'Source Order', mono: true },
            { key: 'date', label: 'Date' },
            { key: 'partner', label: view === 'Receivable' ? 'Customer' : 'Vendor', render: r => <span className="font-medium text-ink-900">{r.partner}</span> },
            { key: 'amount', label: 'Amount', right: true, mono: true, render: r => <span className="font-semibold">{money(r.amount)}</span> },
            { key: 'status', label: 'Payment Status', right: true, render: r => (
              <Chip tone={r.status === 'Paid' ? 'success' : 'warning'}>{r.status}</Chip>
            )},
            { key: 'action', label: '', right: true, render: (r) => (
              <button className="btn-secondary py-1 px-3 text-xs" onClick={() => handlePrint(r)}>Print PDF</button>
            )}
          ]} />
        ) : <EmptyState title={`No ${view.toLowerCase()}s found`} type="default" />}
      </div>
    </div>
    
    {printInvoice && (
      <div className="hidden print:block w-full bg-white absolute top-0 left-0 z-[100] min-h-screen">
        <InvoicePrintView invoice={printInvoice} />
      </div>
    )}
    </>
  )
}
