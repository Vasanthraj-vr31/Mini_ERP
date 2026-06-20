import { useState, useEffect, useRef } from 'react'
import api from '../api'
import { Badge } from './ui'

const TYPE_ICON = {
  Sales:         { icon: '🟢', color: 'text-success' },
  Purchase:      { icon: '🔵', color: 'text-info' },
  Manufacturing: { icon: '🟠', color: 'text-warning' },
  Stock:         { icon: '🟡', color: 'text-warning' },
  User:          { icon: '⚪', color: 'text-neutral' },
  BoM:           { icon: '🔷', color: 'text-info' },
}

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1)   return 'just now'
  if (m < 60)  return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24)  return `${h}h ago`
  const d = Math.floor(h / 24)
  return `${d}d ago`
}

function groupByDate(items) {
  const today = new Date(); today.setHours(0,0,0,0)
  const yesterday = new Date(today); yesterday.setDate(yesterday.getDate()-1)
  const groups = { Today: [], Yesterday: [], Earlier: [] }
  for (const item of items) {
    const d = new Date(item.timestamp)
    if (d >= today)         groups.Today.push(item)
    else if (d >= yesterday) groups.Yesterday.push(item)
    else                     groups.Earlier.push(item)
  }
  return groups
}

export default function ActivityCenter() {
  const [open, setOpen]       = useState(false)
  const [events, setEvents]   = useState([])
  const [read, setRead]       = useState(() => {
    try { return new Set(JSON.parse(localStorage.getItem('shiv_read_events') || '[]')) }
    catch { return new Set() }
  })
  const [filter, setFilter]   = useState('All')
  const [loading, setLoading] = useState(false)
  const ref = useRef(null)

  // Close on outside click
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Load audit events as notifications
  useEffect(() => {
    if (!open) return
    setLoading(true)
    api.get('/audit?limit=40').then(r => {
      const data = r.data?.items || r.data || []
      const mapped = data.map(e => ({
        id:        `${e.id || e.timestamp}`,
        module:    e.module,
        action:    e.action,
        record:    e.record_ref || e.record_id || '',
        detail:    e.detail || `${e.action} on ${e.module}`,
        timestamp: e.timestamp,
        user:      e.user_name || e.user || 'System',
      }))
      setEvents(mapped)
    }).catch(() => {}).finally(() => setLoading(false))
  }, [open])

  const saveRead = (newSet) => {
    setRead(newSet)
    localStorage.setItem('shiv_read_events', JSON.stringify([...newSet]))
  }

  const unread = events.filter(e => !read.has(e.id)).length
  const FILTERS = ['All', 'Sales', 'Purchase', 'Manufacturing', 'Stock']
  const filtered = filter === 'All' ? events : events.filter(e => e.module === filter)
  const groups = groupByDate(filtered)

  return (
    <div ref={ref} className="relative">
      {/* Bell button */}
      <button
        id="activity-center-btn"
        onClick={() => setOpen(o => !o)}
        className="btn-icon relative"
        aria-label="Activity Center"
      >
        <svg className="w-5 h-5 text-ink-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round"
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-0.5 bg-danger text-white text-[9px] font-bold rounded-full flex items-center justify-center animate-notification-in">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      {open && (
        <div className="absolute right-0 top-12 w-[380px] card shadow-card-lg z-50 animate-slide-down overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-line bg-paper-50">
            <div className="flex items-center gap-2">
              <span className="font-display text-lg text-ink-900">Activity</span>
              {unread > 0 && <Badge count={unread} tone="danger" />}
            </div>
            <button
              onClick={() => saveRead(new Set(events.map(e => e.id)))}
              className="text-xs text-burgundy-800 hover:underline font-medium"
            >
              Mark all read
            </button>
          </div>

          {/* Filter tabs */}
          <div className="flex gap-1 px-3 py-2 border-b border-line overflow-x-auto no-scrollbar">
            {FILTERS.map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                  filter === f ? 'bg-burgundy-800 text-white' : 'text-ink-500 hover:bg-rose-100'
                }`}>{f}</button>
            ))}
          </div>

          {/* Events */}
          <div className="max-h-[420px] overflow-y-auto scrollbar-thin">
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="w-6 h-6 border-2 border-rose-200 border-t-burgundy-800 rounded-full animate-spin" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-10 text-ink-400 text-sm">No activity yet</div>
            ) : (
              Object.entries(groups).map(([group, items]) => items.length > 0 && (
                <div key={group}>
                  <div className="px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest text-ink-300 bg-paper-50 border-b border-line/40">
                    {group}
                  </div>
                  {items.map(ev => {
                    const isRead = read.has(ev.id)
                    const { icon, color } = TYPE_ICON[ev.module] || { icon: '⚪', color: 'text-neutral' }
                    return (
                      <div
                        key={ev.id}
                        className={`notification-item ${isRead ? 'opacity-60' : ''}`}
                        onClick={() => saveRead(new Set([...read, ev.id]))}
                      >
                        <span className={`text-base shrink-0 mt-0.5 ${color}`}>{icon}</span>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm text-ink-900 font-medium line-clamp-1">
                            {ev.module} · {ev.action}
                            {ev.record && <span className="text-burgundy-800 ml-1">#{ev.record}</span>}
                          </div>
                          <div className="text-xs text-ink-400 line-clamp-1">{ev.detail}</div>
                          <div className="text-[11px] text-ink-300 mt-0.5">{ev.user} · {timeAgo(ev.timestamp)}</div>
                        </div>
                        {!isRead && <span className="w-2 h-2 rounded-full bg-burgundy-800 shrink-0 mt-1.5" />}
                      </div>
                    )
                  })}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
