import { useState } from 'react'

/**
 * ExportButton — reusable export dropdown
 * Supports: CSV download, Print (window.print), Copy to clipboard
 *
 * Props:
 *   data      - array of row objects for CSV
 *   columns   - array of { key, label } for CSV headers
 *   filename  - base filename for download
 *   printRef  - optional React ref to element to print
 */
export function ExportButton({ data = [], columns = [], filename = 'export', printRef }) {
  const [open, setOpen] = useState(false)

  const downloadCSV = () => {
    const headers = columns.map(c => c.label || c.key)
    const rows = data.map(row => columns.map(c => {
      const val = row[c.key]
      if (val === null || val === undefined) return ''
      const str = String(val).replace(/"/g, '""')
      return str.includes(',') || str.includes('\n') || str.includes('"') ? `"${str}"` : str
    }))
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${filename}-${new Date().toISOString().slice(0,10)}.csv`
    document.body.appendChild(a); a.click()
    document.body.removeChild(a); URL.revokeObjectURL(url)
    setOpen(false)
  }

  const print = () => {
    window.print()
    setOpen(false)
  }

  const copyTable = () => {
    const headers = columns.map(c => c.label || c.key).join('\t')
    const rows = data.map(row => columns.map(c => row[c.key] ?? '').join('\t'))
    const text = [headers, ...rows].join('\n')
    navigator.clipboard?.writeText(text)
    setOpen(false)
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="btn-secondary flex items-center gap-2"
        title="Export options"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
        Export
        <svg className={`w-3.5 h-3.5 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-12 w-44 card shadow-card-lg z-50 py-1 animate-slide-down">
            <button
              onClick={downloadCSV}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-ink-900 hover:bg-paper-50 transition-colors text-left"
            >
              <svg className="w-4 h-4 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Export CSV
            </button>
            <button
              onClick={print}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-ink-900 hover:bg-paper-50 transition-colors text-left no-print"
            >
              <svg className="w-4 h-4 text-info" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              Print
            </button>
            <button
              onClick={copyTable}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-ink-900 hover:bg-paper-50 transition-colors text-left"
            >
              <svg className="w-4 h-4 text-neutral" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Copy Table
            </button>
          </div>
        </>
      )}
    </div>
  )
}

/**
 * InvoicePrintView — formatted invoice for printing
 */
export function InvoicePrintView({ invoice }) {
  if (!invoice) return null
  return (
    <div className="hidden print:block p-8 font-sans text-sm">
      <div className="flex justify-between mb-8">
        <div>
          <div className="font-display text-3xl text-burgundy-800">shiv</div>
          <div className="text-xs tracking-widest uppercase text-ink-400">furniture works</div>
          <div className="text-xs text-ink-600 mt-2">Shiv Furniture Works Pvt. Ltd.</div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold">INVOICE</div>
          <div className="text-ink-600 mt-1">#{invoice.number}</div>
          <div className="text-ink-600">{invoice.date}</div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-8 mb-8 text-xs">
        <div>
          <div className="font-semibold mb-1 uppercase tracking-wider text-ink-400">Bill To</div>
          <div className="font-medium">{invoice.customer}</div>
          <div className="text-ink-600">{invoice.address}</div>
        </div>
      </div>
      <table className="w-full text-xs border-collapse mb-6">
        <thead>
          <tr className="border-b-2 border-ink-900">
            <th className="text-left py-2">Product</th>
            <th className="text-right">Qty</th>
            <th className="text-right">Unit Price</th>
            <th className="text-right">Total</th>
          </tr>
        </thead>
        <tbody>
          {invoice.lines?.map((l, i) => (
            <tr key={i} className="border-b border-ink-200">
              <td className="py-1.5">{l.product}</td>
              <td className="text-right">{l.qty}</td>
              <td className="text-right">₹{Number(l.price).toLocaleString('en-IN')}</td>
              <td className="text-right font-semibold">₹{Number(l.total).toLocaleString('en-IN')}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t-2 border-ink-900">
            <td colSpan={3} className="py-2 font-bold text-right">Total</td>
            <td className="py-2 font-bold text-right text-burgundy-800">₹{Number(invoice.total).toLocaleString('en-IN')}</td>
          </tr>
        </tfoot>
      </table>
      <div className="text-xs text-ink-400 text-center mt-8 border-t border-ink-200 pt-4">
        Thank you for your business · Shiv Furniture Works Pvt. Ltd.
      </div>
    </div>
  )
}
