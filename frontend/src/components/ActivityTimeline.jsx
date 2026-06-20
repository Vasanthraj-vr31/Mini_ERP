import { useEffect, useState } from 'react'
import api from '../api'

function timeAgo(dateStr) {
  if (!dateStr) return ''
  const diff = Date.now() - new Date(dateStr).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1)   return 'just now'
  if (m < 60)  return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24)  return `${h}h ago`
  const d = Math.floor(h / 24)
  return `${d}d ago`
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

const ACTION_ICON = {
  create:   { icon: '✨', color: 'bg-info-bg border-info/20 text-info' },
  update:   { icon: '✏️',  color: 'bg-warning-bg border-warning/20 text-warning' },
  confirm:  { icon: '✅', color: 'bg-success-bg border-success/20 text-success' },
  deliver:  { icon: '🚚', color: 'bg-success-bg border-success/20 text-success' },
  receive:  { icon: '📥', color: 'bg-success-bg border-success/20 text-success' },
  start:    { icon: '▶️',  color: 'bg-info-bg border-info/20 text-info' },
  produce:  { icon: '⚙️',  color: 'bg-teak-600/10 border-teak-600/20 text-teak-700' },
  cancel:   { icon: '❌', color: 'bg-danger-bg border-danger/20 text-danger' },
  delete:   { icon: '🗑️', color: 'bg-danger-bg border-danger/20 text-danger' },
  login:    { icon: '🔑', color: 'bg-neutral-bg border-neutral/20 text-neutral' },
  logout:   { icon: '🚪', color: 'bg-neutral-bg border-neutral/20 text-neutral' },
}

function getActionStyle(action = '') {
  const k = action.toLowerCase()
  return ACTION_ICON[k] || { icon: '📝', color: 'bg-neutral-bg border-neutral/20 text-neutral' }
}

/**
 * Activity Timeline Component
 * Fetches audit events filtered by module and optionally by record reference.
 *
 * Props:
 *   module       - e.g. 'Sales', 'Purchase', 'Manufacturing'
 *   reference    - optional record reference to filter (e.g. 'SO-1001')
 *   maxItems     - max events to show (default 10)
 *   compact      - if true, shows condensed version
 */
export default function ActivityTimeline({ module: mod, reference, maxItems = 10, compact = false }) {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    const params = new URLSearchParams()
    if (mod) params.set('module', mod)
    if (reference) params.set('record', reference)
    params.set('limit', maxItems)

    api.get(`/audit?${params}`).then(r => {
      const data = r.data?.items || r.data || []
      setEvents(Array.isArray(data) ? data.slice(0, maxItems) : [])
    }).catch(() => setEvents([])).finally(() => setLoading(false))
  }, [mod, reference, maxItems])

  if (loading) return (
    <div className="flex justify-center py-6">
      <div className="w-5 h-5 border-2 border-rose-200 border-t-burgundy-800 rounded-full animate-spin" />
    </div>
  )

  if (events.length === 0) return (
    <div className="text-center py-6 text-ink-400 text-sm">No activity recorded yet</div>
  )

  return (
    <div className="relative">
      {events.map((ev, i) => {
        const { icon, color } = getActionStyle(ev.action)
        return (
          <div key={i} className="timeline-item">
            {/* Dot */}
            <div className={`timeline-dot border ${color} shadow-sm`}>
              <span className="text-[10px]">{icon}</span>
            </div>

            {compact ? (
              <div className="flex items-start gap-2">
                <div className="flex-1 min-w-0">
                  <span className="text-xs font-semibold text-ink-700 capitalize">{ev.action}</span>
                  {ev.record_ref && <span className="text-xs text-burgundy-800 ml-1">#{ev.record_ref}</span>}
                  <span className="text-xs text-ink-400 ml-2">{timeAgo(ev.timestamp)}</span>
                </div>
              </div>
            ) : (
              <div className="bg-paper-50 rounded-xl p-3 border border-line/40">
                <div className="flex items-start justify-between gap-2 flex-wrap">
                  <div>
                    <span className="text-sm font-semibold text-ink-900 capitalize">{ev.action}</span>
                    {ev.module && <span className="text-xs text-ink-400 ml-2">· {ev.module}</span>}
                    {ev.record_ref && <span className="text-xs text-burgundy-800 font-mono ml-2">#{ev.record_ref}</span>}
                  </div>
                  <span className="text-[11px] text-ink-400 shrink-0">{timeAgo(ev.timestamp)}</span>
                </div>
                {ev.detail && <div className="text-xs text-ink-600 mt-1 line-clamp-2">{ev.detail}</div>}
                <div className="flex items-center gap-2 mt-2">
                  <div className="w-5 h-5 rounded-full bg-burgundy-800 text-white text-[9px] font-bold flex items-center justify-center shrink-0">
                    {(ev.user_name || ev.user || '?')[0]?.toUpperCase()}
                  </div>
                  <span className="text-[11px] text-ink-500">{ev.user_name || ev.user || 'System'}</span>
                  <span className="text-[11px] text-ink-300 ml-auto">{formatDate(ev.timestamp)}</span>
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
