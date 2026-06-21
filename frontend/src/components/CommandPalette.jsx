import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth'

const COMMANDS = [
  // Navigation
  { id: 'nav-dashboard',     group: 'Navigate',  label: 'Go to Dashboard',          icon: '🏠', path: '/' },
  { id: 'nav-products',      group: 'Navigate',  label: 'Go to Products',            icon: '📦', path: '/products' },
  { id: 'nav-sales',         group: 'Navigate',  label: 'Go to Sales Orders',        icon: '🛍️', path: '/sales' },
  { id: 'nav-purchase',      group: 'Navigate',  label: 'Go to Purchase Orders',     icon: '🚚', path: '/purchase' },
  { id: 'nav-mfg',           group: 'Navigate',  label: 'Go to Manufacturing',       icon: '⚙️',  path: '/manufacturing' },
  { id: 'nav-boms',          group: 'Navigate',  label: 'Go to Bills of Materials',  icon: '📋', path: '/boms' },
  { id: 'nav-customers',     group: 'Navigate',  label: 'Go to Customers',           icon: '👥', path: '/customers', hideForCustomer: true },
  { id: 'nav-warehouse',     group: 'Navigate',  label: 'Go to Warehouse',           icon: '🏭', path: '/warehouse', hideForCustomer: true },
  { id: 'nav-quality',       group: 'Navigate',  label: 'Go to Quality Control',     icon: '✅', path: '/quality', hideForCustomer: true },
  { id: 'nav-invoices',      group: 'Navigate',  label: 'Go to Invoices',            icon: '🧾', path: '/invoices' },
  { id: 'nav-ai',            group: 'Navigate',  label: 'Open AI Insights',          icon: '🤖', path: '/ai' },
  { id: 'nav-analytics',     group: 'Navigate',  label: 'View Analytics',            icon: '📊', path: '/analytics' },
  { id: 'nav-reports',       group: 'Navigate',  label: 'Open Reports',              icon: '📈', path: '/reports' },
  { id: 'nav-audit',         group: 'Navigate',  label: 'View Audit Logs',           icon: '🔍', path: '/audit' },
  { id: 'nav-users',         group: 'Navigate',  label: 'Manage Users',              icon: '👤', path: '/users' },
  { id: 'nav-profile',       group: 'Navigate',  label: 'My Profile',                icon: '🪪', path: '/profile' },
  // Quick actions (navigate + trigger)
  { id: 'act-new-so',        group: 'Actions',   label: 'Create New Sales Order',    icon: '➕', path: '/sales', action: 'new' },
  { id: 'act-new-po',        group: 'Actions',   label: 'Create New Purchase Order', icon: '➕', path: '/purchase', action: 'new' },
  { id: 'act-new-mo',        group: 'Actions',   label: 'Create Manufacturing Order',icon: '➕', path: '/manufacturing', action: 'new' },
  { id: 'act-new-product',   group: 'Actions',   label: 'Add New Product',           icon: '➕', path: '/products', action: 'new' },
  { id: 'act-new-customer',  group: 'Actions',   label: 'Add New Customer',          icon: '➕', path: '/customers', action: 'new', hideForCustomer: true },
]

function fuzzyMatch(str, query) {
  if (!query) return true
  const s = str.toLowerCase()
  const q = query.toLowerCase()
  // exact includes gets priority
  if (s.includes(q)) return true
  // fuzzy: all chars in order
  let si = 0
  for (const c of q) {
    si = s.indexOf(c, si)
    if (si === -1) return false
    si++
  }
  return true
}

export default function CommandPalette() {
  const [open, setOpen]         = useState(false)
  const [query, setQuery]       = useState('')
  const [selected, setSelected] = useState(0)
  const nav = useNavigate()
  const inputRef = useRef(null)

  const { isCustomer } = useAuth()

  // Ctrl+K global hotkey
  useEffect(() => {
    const h = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        setOpen(o => !o)
        setQuery('')
        setSelected(0)
      }
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', h)
    return () => document.removeEventListener('keydown', h)
  }, [])

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50)
  }, [open])

  const availableCommands = COMMANDS.filter(c => !(c.hideForCustomer && isCustomer()))
  
  const filtered = query.trim()
    ? availableCommands.filter(c => fuzzyMatch(c.label, query) || fuzzyMatch(c.group, query))
    : availableCommands

  // Group results
  const grouped = filtered.reduce((acc, cmd) => {
    if (!acc[cmd.group]) acc[cmd.group] = []
    acc[cmd.group].push(cmd)
    return acc
  }, {})

  const flatFiltered = Object.values(grouped).flat()

  const execute = useCallback((cmd) => {
    nav(cmd.path)
    setOpen(false)
    setQuery('')
    // If action='new', dispatch a custom event for the target page to open create modal
    if (cmd.action) {
      setTimeout(() => window.dispatchEvent(new CustomEvent('erp:new', { detail: { path: cmd.path } })), 200)
    }
  }, [nav])

  const onKey = (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setSelected(s => Math.min(s + 1, flatFiltered.length - 1)) }
    if (e.key === 'ArrowUp')   { e.preventDefault(); setSelected(s => Math.max(s - 1, 0)) }
    if (e.key === 'Enter')     { e.preventDefault(); if (flatFiltered[selected]) execute(flatFiltered[selected]) }
  }

  if (!open) return null

  let flatIdx = 0

  return (
    <div className="command-overlay animate-fade-in" onClick={() => setOpen(false)}>
      <div className="command-modal animate-scale-in" onClick={e => e.stopPropagation()}>
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-line">
          <svg className="w-5 h-5 text-ink-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            ref={inputRef}
            id="command-palette-input"
            type="text"
            value={query}
            onChange={e => { setQuery(e.target.value); setSelected(0) }}
            onKeyDown={onKey}
            placeholder="Search commands…"
            className="flex-1 bg-transparent outline-none text-base text-ink-900 placeholder:text-ink-400"
          />
          <kbd className="hidden sm:inline-flex items-center px-2 py-0.5 rounded border border-line text-xs text-ink-400 font-mono">Esc</kbd>
        </div>

        {/* Results */}
        <div className="max-h-[400px] overflow-y-auto py-2 scrollbar-thin">
          {flatFiltered.length === 0 ? (
            <div className="text-center py-10 text-ink-400 text-sm">No commands found for "<span className="text-ink-700">{query}</span>"</div>
          ) : (
            Object.entries(grouped).map(([group, cmds]) => (
              <div key={group}>
                <div className="px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest text-ink-300">{group}</div>
                {cmds.map(cmd => {
                  const idx = flatIdx++
                  const isSelected = idx === selected
                  return (
                    <button key={cmd.id} onClick={() => execute(cmd)}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-all ${
                        isSelected ? 'bg-burgundy-800/5 border-l-2 border-burgundy-800' : 'hover:bg-paper-50 border-l-2 border-transparent'
                      }`}>
                      <span className="text-lg w-7 text-center shrink-0">{cmd.icon}</span>
                      <span className={`text-sm font-medium ${isSelected ? 'text-burgundy-800' : 'text-ink-900'}`}>{cmd.label}</span>
                      <span className="ml-auto">
                        {cmd.action === 'new' && (
                          <span className="text-[10px] bg-burgundy-800/10 text-burgundy-800 px-2 py-0.5 rounded-full font-semibold">Action</span>
                        )}
                      </span>
                    </button>
                  )
                })}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t border-line flex items-center gap-4 text-[10px] text-ink-400">
          <span className="flex items-center gap-1"><kbd className="border border-line rounded px-1 font-mono">↑↓</kbd> navigate</span>
          <span className="flex items-center gap-1"><kbd className="border border-line rounded px-1 font-mono">↵</kbd> select</span>
          <span className="flex items-center gap-1"><kbd className="border border-line rounded px-1 font-mono">Esc</kbd> close</span>
          <span className="ml-auto flex items-center gap-1"><kbd className="border border-line rounded px-1 font-mono">Ctrl+K</kbd> toggle</span>
        </div>
      </div>
    </div>
  )
}
