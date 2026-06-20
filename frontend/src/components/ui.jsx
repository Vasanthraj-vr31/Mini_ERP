import { STATUS_TONE } from '../api'

export function Chip({ children, tone = 'neutral' }) {
  const map = {
    neutral: 'bg-neutral-bg text-neutral', info: 'bg-info-bg text-info',
    warning: 'bg-warning-bg text-warning', success: 'bg-success-bg text-success',
    danger: 'bg-danger-bg text-danger',
  }
  return <span className={`chip ${map[tone] || map.neutral}`}>
    <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />{children}
  </span>
}

export function StatusChip({ status }) {
  return <Chip tone={STATUS_TONE[status] || 'neutral'}>{status}</Chip>
}

export function PageHeader({ title, subtitle, actions }) {
  return (
    <div className="flex items-end justify-between mb-6 flex-wrap gap-3">
      <div>
        {subtitle && <div className="eyebrow mb-1">{subtitle}</div>}
        <h1 className="font-display text-3xl text-ink-900">{title}</h1>
      </div>
      <div className="flex items-center gap-2">{actions}</div>
    </div>
  )
}

export function Field({ label, children }) {
  return <div><label className="label">{label}</label>{children}</div>
}

export function Empty({ children }) {
  return <div className="text-center text-ink-400 py-16">{children}</div>
}

export function Spinner() {
  return <div className="flex justify-center py-20">
    <div className="w-8 h-8 border-2 border-rose-200 border-t-burgundy-800 rounded-full animate-spin" />
  </div>
}
