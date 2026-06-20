import { STATUS_TONE } from '../api'

/* ─── Chip / Badge ─── */
export function Chip({ children, tone = 'neutral', className = '' }) {
  const map = {
    neutral: 'bg-neutral-bg text-neutral',
    info:    'bg-info-bg text-info',
    warning: 'bg-warning-bg text-warning',
    success: 'bg-success-bg text-success',
    danger:  'bg-danger-bg text-danger',
  }
  return (
    <span className={`chip ${map[tone] || map.neutral} ${className}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70 shrink-0" />
      {children}
    </span>
  )
}

export function StatusChip({ status }) {
  return <Chip tone={STATUS_TONE[status] || 'neutral'}>{status}</Chip>
}

export function Badge({ count, tone = 'danger' }) {
  if (!count) return null
  const map = { danger: 'bg-danger text-white', warning: 'bg-warning text-white', success: 'bg-success text-white', info: 'bg-info text-white' }
  return <span className={`badge ${map[tone]}`}>{count > 99 ? '99+' : count}</span>
}

/* ─── Page Header ─── */
export function PageHeader({ title, subtitle, actions, breadcrumb }) {
  return (
    <div className="mb-8">
      {breadcrumb && (
        <div className="flex items-center gap-2 text-xs text-ink-400 mb-3">
          {breadcrumb.map((b, i) => (
            <span key={i} className="flex items-center gap-2">
              {i > 0 && <span className="text-ink-300">/</span>}
              <span className={i === breadcrumb.length - 1 ? 'text-ink-600 font-medium' : 'hover:text-ink-600 cursor-pointer'}>{b}</span>
            </span>
          ))}
        </div>
      )}
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          {subtitle && <div className="eyebrow mb-2">{subtitle}</div>}
          <h1 className="page-title">{title}</h1>
        </div>
        <div className="flex items-center gap-2 flex-wrap">{actions}</div>
      </div>
    </div>
  )
}

/* ─── Field ─── */
export function Field({ label, children, className = '' }) {
  return (
    <div className={className}>
      <label className="label">{label}</label>
      {children}
    </div>
  )
}

/* ─── Avatar ─── */
const AVATAR_COLORS = [
  'bg-burgundy-800 text-rose-200',
  'bg-teak-700 text-amber-200',
  'bg-info text-white',
  'bg-success text-white',
  'bg-warning text-white',
  'bg-neutral text-white',
]
export function Avatar({ name = '', src, size = 'md', className = '' }) {
  const sizes = { xs: 'w-6 h-6 text-[10px]', sm: 'w-8 h-8 text-xs', md: 'w-10 h-10 text-sm', lg: 'w-12 h-12 text-base', xl: 'w-16 h-16 text-xl' }
  const idx = (name.charCodeAt(0) || 0) % AVATAR_COLORS.length
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  return src ? (
    <img src={src} alt={name} className={`avatar object-cover ${sizes[size]} ${className}`} />
  ) : (
    <div className={`avatar ${sizes[size]} ${AVATAR_COLORS[idx]} ${className}`}>{initials || '?'}</div>
  )
}

/* ─── Spinner ─── */
export function Spinner({ size = 'md' }) {
  const s = { sm: 'w-5 h-5', md: 'w-8 h-8', lg: 'w-12 h-12' }
  return (
    <div className="flex justify-center items-center py-20">
      <div className={`${s[size]} border-2 border-rose-200 border-t-burgundy-800 rounded-full animate-spin`} />
    </div>
  )
}

/* ─── Empty State ─── */
const EMPTY_ILLUSTRATIONS = {
  default: (
    <svg viewBox="0 0 160 120" className="w-40 h-32" fill="none">
      <rect x="20" y="70" width="120" height="8" rx="4" fill="#EAD5D8" />
      <rect x="30" y="78" width="8" height="24" rx="2" fill="#D9B3BA" />
      <rect x="122" y="78" width="8" height="24" rx="2" fill="#D9B3BA" />
      <rect x="25" y="50" width="110" height="22" rx="6" fill="#EAD5D8" />
      <rect x="35" y="44" width="14" height="8" rx="2" fill="#D9B3BA" />
      <rect x="111" y="44" width="14" height="8" rx="2" fill="#D9B3BA" />
      <rect x="60" y="30" width="40" height="16" rx="4" fill="#F3E5E8" stroke="#D9B3BA" strokeWidth="1" />
      <circle cx="80" cy="20" r="10" fill="#F3E5E8" stroke="#D9B3BA" strokeWidth="1" />
      <path d="M74 20 Q80 14 86 20" stroke="#D9B3BA" strokeWidth="1.5" fill="none" />
    </svg>
  ),
  sales: (
    <svg viewBox="0 0 160 120" className="w-40 h-32" fill="none">
      <rect x="30" y="30" width="100" height="70" rx="8" fill="#F3E5E8" stroke="#D9B3BA" strokeWidth="1.5" />
      <rect x="44" y="46" width="72" height="4" rx="2" fill="#EAD5D8" />
      <rect x="44" y="56" width="52" height="4" rx="2" fill="#EAD5D8" />
      <rect x="44" y="66" width="60" height="4" rx="2" fill="#EAD5D8" />
      <rect x="44" y="80" width="30" height="6" rx="3" fill="#D9B3BA" />
      <circle cx="130" cy="35" r="18" fill="#501B24" />
      <path d="M122 35 l5 5 l9-10" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  product: (
    <svg viewBox="0 0 160 120" className="w-40 h-32" fill="none">
      <rect x="20" y="75" width="120" height="6" rx="3" fill="#EAD5D8" />
      <rect x="28" y="81" width="6" height="20" rx="2" fill="#D9B3BA" />
      <rect x="126" y="81" width="6" height="20" rx="2" fill="#D9B3BA" />
      <rect x="22" y="52" width="116" height="25" rx="5" fill="#F3E5E8" stroke="#D9B3BA" strokeWidth="1" />
      <rect x="40" y="38" width="16" height="15" rx="3" fill="#EAD5D8" />
      <rect x="104" y="38" width="16" height="15" rx="3" fill="#EAD5D8" />
      <rect x="55" y="25" width="50" height="28" rx="5" fill="#EAD5D8" stroke="#D9B3BA" strokeWidth="1" />
      <rect x="68" y="18" width="24" height="8" rx="4" fill="#D9B3BA" />
    </svg>
  ),
  manufacturing: (
    <svg viewBox="0 0 160 120" className="w-40 h-32" fill="none">
      <rect x="40" y="55" width="80" height="45" rx="6" fill="#F3E5E8" stroke="#D9B3BA" strokeWidth="1.5" />
      <rect x="50" y="42" width="20" height="15" rx="3" fill="#EAD5D8" />
      <rect x="90" y="42" width="20" height="15" rx="3" fill="#EAD5D8" />
      <circle cx="80" cy="40" r="14" fill="#F3E5E8" stroke="#D9B3BA" strokeWidth="1.5" />
      <circle cx="80" cy="40" r="5" fill="#D9B3BA" />
      <line x1="80" y1="26" x2="80" y2="30" stroke="#D9B3BA" strokeWidth="2" strokeLinecap="round"/>
      <line x1="80" y1="50" x2="80" y2="54" stroke="#D9B3BA" strokeWidth="2" strokeLinecap="round"/>
      <line x1="66" y1="40" x2="70" y2="40" stroke="#D9B3BA" strokeWidth="2" strokeLinecap="round"/>
      <line x1="90" y1="40" x2="94" y2="40" stroke="#D9B3BA" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  ),
}

export function EmptyState({ title = 'Nothing here yet', subtitle, action, type = 'default' }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center animate-fade-in">
      <div className="mb-6 opacity-80 animate-float">{EMPTY_ILLUSTRATIONS[type] || EMPTY_ILLUSTRATIONS.default}</div>
      <h3 className="font-display text-2xl text-ink-900 mb-2">{title}</h3>
      {subtitle && <p className="text-ink-400 text-sm max-w-xs mb-6 leading-relaxed">{subtitle}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  )
}

/* backward compat */
export function Empty({ children }) {
  return <div className="text-center text-ink-400 py-16">{children}</div>
}

/* ─── Stat Card ─── */
export function StatCard({ label, value, icon, tone = 'neutral', trend, trendLabel, onClick, sub }) {
  const tones = {
    neutral: 'text-ink-900', info: 'text-info', warning: 'text-warning',
    success: 'text-success', danger: 'text-danger', brand: 'text-burgundy-800',
  }
  const bgTones = {
    neutral: 'bg-neutral-bg', info: 'bg-info-bg', warning: 'bg-warning-bg',
    success: 'bg-success-bg', danger: 'bg-danger-bg', brand: 'bg-rose-100',
  }
  return (
    <div className={`stat-card ${onClick ? 'cursor-pointer hover:-translate-y-0.5' : ''}`} onClick={onClick}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-[13px] text-ink-400 font-medium mb-1">{label}</div>
          <div className={`font-display text-3xl font-semibold leading-none ${tones[tone] || tones.neutral}`}>{value}</div>
          {sub && <div className="text-xs text-ink-400 mt-1">{sub}</div>}
        </div>
        {icon && (
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${bgTones[tone] || bgTones.neutral}`}>
            <span className={`text-lg ${tones[tone]}`}>{icon}</span>
          </div>
        )}
      </div>
      {trend !== undefined && (
        <div className={`flex items-center gap-1 mt-2 text-xs font-medium ${trend >= 0 ? 'text-success' : 'text-danger'}`}>
          <span>{trend >= 0 ? '↑' : '↓'}</span>
          <span>{Math.abs(trend)}%</span>
          {trendLabel && <span className="text-ink-400 font-normal">{trendLabel}</span>}
        </div>
      )}
    </div>
  )
}

/* ─── Progress Bar ─── */
export function ProgressBar({ value, max = 100, tone = 'brand', className = '', showLabel = false }) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100))
  const colors = {
    brand: 'bg-burgundy-800', success: 'bg-success', warning: 'bg-warning',
    danger: 'bg-danger', info: 'bg-info', teak: 'bg-teak-600',
  }
  return (
    <div className={className}>
      <div className="progress-track">
        <div className={`progress-fill ${colors[tone] || colors.brand}`} style={{ width: `${pct}%` }} />
      </div>
      {showLabel && <div className="text-xs text-ink-400 mt-1 text-right">{Math.round(pct)}%</div>}
    </div>
  )
}

/* ─── Circular Progress ─── */
export function CircularProgress({ value, max = 100, size = 80, strokeWidth = 6, label, tone = 'brand' }) {
  const r = (size - strokeWidth) / 2
  const c = 2 * Math.PI * r
  const pct = Math.min(100, Math.max(0, (value / max) * 100))
  const offset = c - (pct / 100) * c
  const colors = { brand: '#501B24', success: '#5B7355', warning: '#B07B3E', danger: '#9B3B3B', info: '#4A6275' }
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle cx={size/2} cy={size/2} r={r} stroke="#F3E5E8" strokeWidth={strokeWidth} fill="none" />
        <circle cx={size/2} cy={size/2} r={r} stroke={colors[tone] || colors.brand} strokeWidth={strokeWidth}
          fill="none" strokeDasharray={c} strokeDashoffset={offset}
          strokeLinecap="round" style={{ transition: 'stroke-dashoffset 0.6s ease' }} />
      </svg>
      {label && <div className="absolute inset-0 flex flex-col items-center justify-center">{label}</div>}
    </div>
  )
}

/* ─── Step Tracker ─── */
export function StepTracker({ steps, current }) {
  const currentIdx = steps.findIndex(s => s === current || s.key === current)
  return (
    <div className="flex items-center gap-0">
      {steps.map((step, i) => {
        const label = typeof step === 'string' ? step : step.label
        const isDone = i < currentIdx
        const isActive = i === currentIdx
        return (
          <div key={i} className="flex items-center">
            <div className={`flex flex-col items-center gap-1`}>
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${
                isDone ? 'bg-success border-success text-white' :
                isActive ? 'bg-burgundy-800 border-burgundy-800 text-white shadow-glow' :
                'bg-paper-0 border-line text-ink-400'
              }`}>
                {isDone ? '✓' : i + 1}
              </div>
              <span className={`text-[10px] font-medium whitespace-nowrap ${isActive ? 'text-burgundy-800' : isDone ? 'text-success' : 'text-ink-400'}`}>
                {label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className={`h-0.5 w-8 sm:w-14 mx-1 mb-4 rounded ${i < currentIdx ? 'bg-success' : 'bg-line'}`} />
            )}
          </div>
        )
      })}
    </div>
  )
}

/* ─── Drawer ─── */
export function Drawer({ open, onClose, title, width = 'max-w-lg', children }) {
  if (!open) return null
  return (
    <>
      <div className="drawer-overlay animate-fade-in" onClick={onClose} />
      <div className={`drawer-panel w-full ${width} animate-slide-in-right`}>
        <div className="sticky top-0 bg-paper-0 border-b border-line px-6 py-4 flex items-center justify-between z-10">
          <h2 className="font-display text-xl text-ink-900">{title}</h2>
          <button onClick={onClose} className="btn-icon" aria-label="Close">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </>
  )
}

/* ─── Modal ─── */
export function Modal({ title, children, onClose, size = 'max-w-2xl' }) {
  return (
    <div className="fixed inset-0 bg-ink-900/30 backdrop-blur-sm grid place-items-center z-50 p-4 animate-fade-in" onClick={onClose}>
      <div className={`card w-full ${size} max-h-[90vh] overflow-auto p-6 animate-scale-in`} onClick={e => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-4 mb-5">
          <h2 className="font-display text-2xl text-ink-900 leading-tight">{title}</h2>
          <button onClick={onClose} className="btn-icon shrink-0 mt-0.5" aria-label="Close">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

/* ─── Info Row ─── */
export function InfoRow({ label, value, mono = false }) {
  return (
    <div>
      <div className="text-xs text-ink-400 mb-0.5 font-medium">{label}</div>
      <div className={`text-sm text-ink-900 ${mono ? 'font-mono' : ''}`}>{value || '—'}</div>
    </div>
  )
}

/* ─── View Toggle ─── */
export function ViewToggle({ view, setView, options = [['list', '☰ List'], ['kanban', '⊞ Board']] }) {
  return (
    <div className="flex rounded-full bg-paper-0 border border-line p-0.5 shadow-inner">
      {options.map(([v, label]) => (
        <button key={v} onClick={() => setView(v)}
          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
            view === v ? 'bg-burgundy-800 text-white shadow-sm' : 'text-ink-500 hover:text-ink-800'
          }`}>
          {label}
        </button>
      ))}
    </div>
  )
}

/* ─── Section Header ─── */
export function SectionHeader({ title, action }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="eyebrow">{title}</div>
      {action}
    </div>
  )
}

/* ─── Toast (simple, no state management) ─── */
export function Toast({ message, tone = 'success', onClose }) {
  const colors = {
    success: 'bg-success-bg border-success/30 text-success',
    danger:  'bg-danger-bg border-danger/30 text-danger',
    warning: 'bg-warning-bg border-warning/30 text-warning',
    info:    'bg-info-bg border-info/30 text-info',
  }
  return (
    <div className={`fixed bottom-6 right-6 z-[200] flex items-center gap-3 px-4 py-3 rounded-xl border shadow-card-lg animate-notification-in ${colors[tone]}`}>
      <span className="text-sm font-medium">{message}</span>
      {onClose && <button onClick={onClose} className="opacity-60 hover:opacity-100 ml-1">✕</button>}
    </div>
  )
}
