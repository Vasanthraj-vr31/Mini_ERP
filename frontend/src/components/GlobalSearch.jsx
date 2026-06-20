import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api'

const TYPE_CONFIG = {
  product:  { label: 'Product',   icon: '📦', color: 'bg-rose-100 text-burgundy-800', path: '/products' },
  sales:    { label: 'Sales Order', icon: '🛍️', color: 'bg-info-bg text-info',         path: '/sales' },
  purchase: { label: 'Purchase',  icon: '🚚', color: 'bg-success-bg text-success',     path: '/purchase' },
  mfg:      { label: 'Production',icon: '⚙️',  color: 'bg-warning-bg text-warning',    path: '/manufacturing' },
}

function useDebounce(value, delay) {
  const [dv, setDv] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setDv(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return dv
}

export default function GlobalSearch() {
  const [query, setQuery]       = useState('')
  const [results, setResults]   = useState([])
  const [open, setOpen]         = useState(false)
  const [loading, setLoading]   = useState(false)
  const [selected, setSelected] = useState(0)
  const nav    = useNavigate()
  const ref    = useRef(null)
  const input  = useRef(null)
  const dq     = useDebounce(query, 280)

  // Close on outside click
  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  // Keyboard: Ctrl+/ or / to focus
  useEffect(() => {
    const h = (e) => {
      if ((e.ctrlKey && e.key === '/') || (e.key === '/' && document.activeElement.tagName === 'BODY')) {
        e.preventDefault()
        input.current?.focus()
        setOpen(true)
      }
      if (e.key === 'Escape') { setOpen(false); setQuery('') }
    }
    document.addEventListener('keydown', h)
    return () => document.removeEventListener('keydown', h)
  }, [])

  // Search
  useEffect(() => {
    if (dq.trim().length < 2) { setResults([]); return }
    setLoading(true)
    const q = dq.toLowerCase()

    Promise.all([
      api.get('/products').catch(() => ({ data: [] })),
      api.get('/sales-orders').catch(() => ({ data: [] })),
      api.get('/purchase-orders').catch(() => ({ data: [] })),
      api.get('/manufacturing-orders').catch(() => ({ data: [] })),
    ]).then(([prod, so, po, mo]) => {
      const results = []

      ;(prod.data || []).filter(p =>
        p.name?.toLowerCase().includes(q) || p.reference?.toLowerCase().includes(q)
      ).slice(0, 4).forEach(p => results.push({
        type: 'product', id: p.id, primary: p.name,
        secondary: `${p.reference} · ₹${Number(p.sales_price).toLocaleString('en-IN')}`,
        sub: p.free_to_use_qty != null ? `${p.free_to_use_qty} in stock` : '',
        path: '/products',
      }))

      ;(so.data || []).filter(s =>
        s.reference?.toLowerCase().includes(q) || s.customer?.toLowerCase().includes(q)
      ).slice(0, 3).forEach(s => results.push({
        type: 'sales', id: s.id, primary: s.reference,
        secondary: s.customer, sub: s.status, path: '/sales',
      }))

      ;(po.data || []).filter(p =>
        p.reference?.toLowerCase().includes(q) || p.vendor?.toLowerCase().includes(q)
      ).slice(0, 3).forEach(p => results.push({
        type: 'purchase', id: p.id, primary: p.reference,
        secondary: p.vendor, sub: p.status, path: '/purchase',
      }))

      ;(mo.data || []).filter(m =>
        m.reference?.toLowerCase().includes(q) || m.finished_product?.toLowerCase().includes(q)
      ).slice(0, 3).forEach(m => results.push({
        type: 'mfg', id: m.id, primary: m.reference,
        secondary: m.finished_product, sub: m.status, path: '/manufacturing',
      }))

      setResults(results)
      setSelected(0)
    }).finally(() => setLoading(false))
  }, [dq])

  const go = useCallback((item) => {
    nav(item.path)
    setOpen(false); setQuery(''); setResults([])
  }, [nav])

  // Keyboard nav
  const onKey = (e) => {
    if (!open || !results.length) return
    if (e.key === 'ArrowDown') { e.preventDefault(); setSelected(s => Math.min(s + 1, results.length - 1)) }
    if (e.key === 'ArrowUp')   { e.preventDefault(); setSelected(s => Math.max(s - 1, 0)) }
    if (e.key === 'Enter')     { e.preventDefault(); if (results[selected]) go(results[selected]) }
  }

  return (
    <div ref={ref} className="relative flex-1 max-w-md">
      <div className="relative">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400 pointer-events-none"
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          ref={input}
          id="global-search"
          type="text"
          value={query}
          onChange={e => { setQuery(e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKey}
          placeholder="Search products, orders… (Ctrl+/)"
          className="input pl-9 pr-9 py-2 text-sm w-full bg-paper-50 border-line/60 focus:bg-paper-0"
          autoComplete="off"
        />
        {query && (
          <button onClick={() => { setQuery(''); setResults([]) }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-700 text-xs">✕</button>
        )}
      </div>

      {open && (query.length >= 2) && (
        <div className="absolute top-12 left-0 right-0 card shadow-card-lg z-50 overflow-hidden animate-slide-down">
          {loading ? (
            <div className="px-4 py-6 flex items-center gap-3 text-ink-400 text-sm">
              <div className="w-4 h-4 border-2 border-rose-200 border-t-burgundy-800 rounded-full animate-spin" />
              Searching…
            </div>
          ) : results.length === 0 ? (
            <div className="px-4 py-6 text-center text-ink-400 text-sm">
              No results for "<span className="text-ink-700 font-medium">{query}</span>"
            </div>
          ) : (
            <div className="py-1 max-h-80 overflow-y-auto">
              {results.map((r, i) => {
                const cfg = TYPE_CONFIG[r.type] || TYPE_CONFIG.product
                return (
                  <button key={`${r.type}-${r.id}`} onClick={() => go(r)}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                      i === selected ? 'bg-rose-50' : 'hover:bg-paper-50'
                    }`}>
                    <span className="text-base shrink-0">{cfg.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-ink-900 line-clamp-1">{r.primary}</div>
                      <div className="text-xs text-ink-400 line-clamp-1">{r.secondary}</div>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${cfg.color}`}>{cfg.label}</span>
                      {r.sub && <span className="text-[10px] text-ink-400">{r.sub}</span>}
                    </div>
                  </button>
                )
              })}
              <div className="px-4 py-2 border-t border-line/40 flex items-center justify-between">
                <span className="text-[10px] text-ink-400">{results.length} result{results.length !== 1 ? 's' : ''}</span>
                <span className="text-[10px] text-ink-300">↑↓ navigate · Enter select · Esc close</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
