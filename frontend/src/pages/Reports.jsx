import { PageHeader } from '../components/ui'

const REPORTS = [
  ['executive', 'Monthly Executive Report', 'Revenue, sales, manufacturing, procurement & inventory at a glance.'],
  ['inventory', 'Inventory Health Report', 'Critical stock, reorder recommendations & AI shortage predictions.'],
  ['manufacturing', 'Manufacturing Performance', 'Production efficiency, delayed orders & work-center bottlenecks.'],
  ['procurement', 'Procurement Intelligence', 'Vendor scorecard, purchase trends & cost analysis.'],
]

export default function Reports() {
  return (
    <div>
      <PageHeader title="Reports" subtitle="Business intelligence" />
      <div className="grid sm:grid-cols-2 gap-4">
        {REPORTS.map(([name, title, desc]) => (
          <div key={name} className="card p-6 flex flex-col">
            <div className="font-display text-xl text-ink-900 mb-1">{title}</div>
            <p className="text-sm text-ink-600 flex-1">{desc}</p>
            <div className="flex gap-2 mt-4">
              <a className="btn-primary" href={`/api/reports/${name}.pdf`} target="_blank" rel="noreferrer">Open PDF</a>
              <a className="btn-secondary" href={`/api/reports/${name}.pdf`} download>Download</a>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
