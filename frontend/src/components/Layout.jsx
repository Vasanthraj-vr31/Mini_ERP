import { useState, useEffect } from 'react'
import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../auth'
import ActivityCenter from './ActivityCenter'
import GlobalSearch from './GlobalSearch'

/* ─── Nav Icons ─── */
const NAV_ICONS = {
  'Dashboard':            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>,
  'Sale Orders':          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/></svg>,
  'Purchase Orders':      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10"/></svg>,
  'Manufacturing Orders': <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><circle cx="12" cy="12" r="3"/></svg>,
  'Bills of Materials':   <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"/></svg>,
  'Products':             <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7l8 4"/></svg>,
  'Customers':            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/></svg>,
  'Warehouse':            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z"/></svg>,
  'Invoices':             <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z"/></svg>,
  'Quality Control':      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"/></svg>,
  'AI Insights':          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/></svg>,
  'Reports':              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>,
  'Analytics':            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>,
  'Audit Logs':           <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>,
  'User Management':      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/></svg>,
}

function NavItem({ label, path }) {
  return (
    <NavLink to={path} end={path === '/'}
      className={({ isActive }) =>
        isActive ? 'nav-item-active' : 'nav-item-idle'
      }>
      <span className="shrink-0 opacity-80">{NAV_ICONS[label]}</span>
      <span>{label}</span>
    </NavLink>
  )
}

export default function Layout({ children }) {
  const { user, logout, can, isAdmin, isCustomer } = useAuth()
  const nav = useNavigate()
  const location = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [dark, setDark] = useState(() => localStorage.getItem('shiv_theme') === 'dark')

  // Theme toggle
  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
    localStorage.setItem('shiv_theme', dark ? 'dark' : 'light')
  }, [dark])

  // Close mobile nav on route change
  useEffect(() => { setMobileOpen(false) }, [location.pathname])

  const admin = isAdmin()
  const hasIntelligence = can('Reports', 'view') || can('Analytics', 'view') || can('AuditLogs', 'view')

  const NAV_SECTIONS = [
    {
      label: 'Main',
      items: [{ label: 'Dashboard', path: '/' }],
    },
    {
      label: 'Operations',
      items: [
        can('Sales', 'view')         && { label: 'Sale Orders',          path: '/sales' },
        can('Purchase', 'view')      && { label: 'Purchase Orders',       path: '/purchase' },
        can('Manufacturing', 'view') && { label: 'Manufacturing Orders',  path: '/manufacturing' },
        can('Manufacturing', 'view') && { label: 'Bills of Materials',    path: '/boms' },
        can('Product', 'view')       && { label: 'Products',              path: '/products' },
        can('Sales', 'view')         && !isCustomer() && { label: 'Customers',             path: '/customers' },
        can('Product', 'view')       && !isCustomer() && { label: 'Warehouse',             path: '/warehouse' },
        can('Sales', 'view')         && { label: 'Invoices',              path: '/invoices' },
        can('Manufacturing', 'view') && !isCustomer() && { label: 'Quality Control',       path: '/quality' },
      ].filter(Boolean),
    },
    hasIntelligence ? {
      label: 'Intelligence',
      items: [
        (can('Reports', 'view') || can('Analytics', 'view')) && { label: 'AI Insights', path: '/ai' },
        can('Reports', 'view')   && { label: 'Reports',    path: '/reports' },
        can('Analytics', 'view') && { label: 'Analytics',  path: '/analytics' },
        can('AuditLogs', 'view') && { label: 'Audit Logs', path: '/audit' },
      ].filter(Boolean),
    } : null,
    admin ? {
      label: 'Administration',
      items: [{ label: 'User Management', path: '/users' }],
    } : null,
  ].filter(Boolean)

  const SidebarContent = () => (
    <div className="bg-burgundy-800 rounded-2xl h-full p-4 flex flex-col"
      style={{ minHeight: 'calc(100vh - 2rem)' }}>

      {/* Brand */}
      <div className="relative px-2 py-3 mb-4 overflow-hidden">
        <svg viewBox="0 0 80 120" className="absolute right-0 top-0 h-full opacity-10 pointer-events-none" aria-hidden="true">
          <path d="M40,4 C62,28 70,70 65,100 C60,118 50,126 40,130 C30,126 20,118 15,100 C10,70 18,28 40,4Z" fill="white"/>
          <line x1="40" y1="4" x2="40" y2="130" stroke="white" strokeWidth="1.5"/>
          {[20,36,52,68,84,100].map((y,i) => {
            const w = 8+i*3
            return <g key={y}>
              <line x1="40" y1={y} x2={40+w} y2={y+7} stroke="white" strokeWidth="0.7"/>
              <line x1="40" y1={y} x2={40-w} y2={y+7} stroke="white" strokeWidth="0.7"/>
            </g>
          })}
        </svg>
        <div className="relative z-10 font-display text-3xl text-white leading-none tracking-tight">shiv</div>
        <div className="relative z-10 text-rose-300 text-[10px] tracking-[0.25em] uppercase mt-1 font-medium">furniture works · erp</div>
        <div className="relative z-10 mt-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/10 text-rose-300/80 text-[9px] font-semibold tracking-wider uppercase">
          <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse-soft" />
          Enterprise
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-5 mt-1 overflow-y-auto scrollbar-thin pr-1">
        {NAV_SECTIONS.map(section => (
          <div key={section.label}>
            <div className="px-3 py-1 text-[9px] font-bold tracking-[0.18em] uppercase text-rose-400/50 mb-1">
              {section.label}
            </div>
            <div className="space-y-0.5">
              {section.items.map(item => (
                <NavItem key={item.path} label={item.label} path={item.path} />
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* User card */}
      <div className="border-t border-burgundy-700/60 pt-3 mt-3 space-y-2">
        {/* Theme toggle */}
        <button
          onClick={() => setDark(d => !d)}
          className="w-full flex items-center gap-3 rounded-xl px-3 py-2 hover:bg-burgundy-700/40 transition text-left"
        >
          <span className="text-base">{dark ? '☀️' : '🌙'}</span>
          <span className="text-rose-300/70 text-xs">{dark ? 'Light mode' : 'Dark mode'}</span>
        </button>

        <button onClick={() => nav('/profile')}
          className="w-full flex items-center gap-3 rounded-xl px-2 py-2 hover:bg-burgundy-700/40 transition text-left">
          {user?.photo ? (
            <img src={user.photo} alt={user.name} className="w-8 h-8 rounded-full object-cover shrink-0 ring-2 ring-rose-300/30" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-rose-200 text-burgundy-800 grid place-items-center font-display font-semibold shrink-0 text-sm ring-2 ring-rose-300/20">
              {user?.name?.[0] || 'U'}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div className="text-rose-200 text-sm font-medium truncate">{user?.name}</div>
            <div className="text-rose-300/50 text-[11px] truncate">{user?.role}</div>
          </div>
          <button
            onClick={e => { e.stopPropagation(); logout(); nav('/login') }}
            className="shrink-0 text-rose-400/50 hover:text-rose-200 transition"
            title="Logout"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
            </svg>
          </button>
        </button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen flex bg-paper-50 dark:bg-dark-900">

      {/* Desktop sidebar */}
      <aside className="w-[260px] shrink-0 p-4 hidden md:block print:hidden">
        <SidebarContent />
      </aside>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <>
          <div className="fixed inset-0 bg-ink-900/40 backdrop-blur-sm z-40 md:hidden animate-fade-in"
            onClick={() => setMobileOpen(false)} />
          <div className="fixed left-0 top-0 bottom-0 w-[260px] z-50 p-4 md:hidden animate-slide-in-left">
            <SidebarContent />
          </div>
        </>
      )}

      <div className="flex-1 min-w-0 flex flex-col">
        {/* Topbar */}
        <header className="print:hidden h-16 bg-paper-0/95 dark:bg-dark-800/95 backdrop-blur-sm border-b border-line dark:border-dark-500 flex items-center gap-4 px-4 sticky top-0 z-30 shadow-sm">

          {/* Mobile hamburger */}
          <button
            id="mobile-menu-btn"
            className="md:hidden btn-icon"
            onClick={() => setMobileOpen(o => !o)}
            aria-label="Open menu"
          >
            <svg className="w-5 h-5 text-ink-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              {mobileOpen
                ? <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
                : <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16"/>
              }
            </svg>
          </button>

          {/* Mobile brand */}
          <div className="md:hidden font-display text-lg text-burgundy-800">shiv · erp</div>

          {/* Global Search */}
          <div className="hidden md:flex flex-1">
            <GlobalSearch />
          </div>

          {/* Right section */}
          <div className="flex items-center gap-2 ml-auto">
            {/* Ctrl+K hint */}
            <div className="hidden lg:flex items-center gap-1 text-[11px] text-ink-400 mr-2">
              <kbd className="border border-line rounded px-1 py-0.5 font-mono text-[10px]">Ctrl</kbd>
              <span>+</span>
              <kbd className="border border-line rounded px-1 py-0.5 font-mono text-[10px]">K</kbd>
            </div>

            {/* Activity Center */}
            <ActivityCenter />

            <button
              id="topbar-profile-btn"
              onClick={() => nav('/profile')}
              className="flex items-center gap-2 hover:bg-paper-50 dark:hover:bg-dark-700 p-1 pr-3 rounded-full transition-all border border-transparent hover:border-line dark:hover:border-dark-500"
              title="My Profile"
            >
              <div className="w-8 h-8 rounded-full overflow-hidden bg-rose-200 text-burgundy-800 grid place-items-center font-display font-semibold ring-2 ring-offset-1 ring-transparent hover:ring-rose-300 transition-all">
                {user?.photo
                  ? <img src={user.photo} alt={user?.name} className="w-full h-full object-cover" />
                  : <span className="text-sm">{user?.name?.[0] || 'U'}</span>
                }
              </div>
              <span className="text-sm font-medium hidden md:block text-ink-700 dark:text-ink-200">{user?.name}</span>
            </button>
            <button
              onClick={() => { logout(); nav('/login') }}
              className="w-9 h-9 flex items-center justify-center rounded-full text-ink-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-dark-700 transition-all border border-transparent hover:border-rose-100 dark:hover:border-dark-500"
              title="Logout"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
              </svg>
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 md:p-6 max-w-[1400px] mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  )
}
