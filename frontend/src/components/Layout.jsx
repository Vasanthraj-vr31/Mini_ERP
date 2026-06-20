import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth'

export default function Layout({ children }) {
  const { user, logout, can, isAdmin } = useAuth()
  const nav = useNavigate()

  const admin = isAdmin()

  const NAV_SECTIONS = [
    {
      label: 'Main',
      items: [
        { label: 'Dashboard', path: '/' },
      ],
    },
    {
      label: 'Operations',
      items: [
        can('Sales', 'view')           && { label: 'Sale Orders',           path: '/sales' },
        can('Purchase', 'view')        && { label: 'Purchase Orders',        path: '/purchase' },
        can('Manufacturing', 'view')   && { label: 'Manufacturing Orders',   path: '/manufacturing' },
        can('Manufacturing', 'view')   && { label: 'Bills of Materials',     path: '/boms' },
        can('Product', 'view')         && { label: 'Products',               path: '/products' },
      ].filter(Boolean),
    },
    {
      label: 'Intelligence',
      items: [
        { label: 'AI Insights', path: '/ai' },
        can('Reports', 'view')         && { label: 'Reports',    path: '/reports' },
        can('Analytics', 'view')       && { label: 'Analytics',  path: '/analytics' },
        can('AuditLogs', 'view')       && { label: 'Audit Logs', path: '/audit' },
      ].filter(Boolean),
    },
    admin ? {
      label: 'Administration',
      items: [
        { label: 'User Management', path: '/users' },
      ],
    } : null,
  ].filter(Boolean)

  return (
    <div className="min-h-screen flex">
      {/* Velvet sidebar */}
      <aside className="w-64 shrink-0 p-4 hidden md:block">
        <div className="bg-burgundy-800 rounded-2xl h-full p-4 flex flex-col sticky top-4"
             style={{ minHeight: 'calc(100vh - 2rem)' }}>
          <div className="px-2 py-3 mb-2">
            <div className="font-display text-2xl text-white leading-none">shiv</div>
            <div className="text-rose-300 text-xs tracking-[0.2em] uppercase mt-1">furniture works</div>
          </div>

          <nav className="flex-1 space-y-4 mt-2 overflow-y-auto">
            {NAV_SECTIONS.map(section => (
              <div key={section.label}>
                <div className="px-3 py-1 text-[10px] font-semibold tracking-[0.15em] uppercase text-rose-400/60">
                  {section.label}
                </div>
                <div className="space-y-0.5">
                  {section.items.map(item => (
                    <NavLink key={item.path} to={item.path} end={item.path === '/'}
                      className={({ isActive }) =>
                        `block rounded-xl px-3 py-2 text-sm transition ${
                          isActive
                            ? 'bg-burgundy-900 text-rose-200 font-medium'
                            : 'text-rose-300/70 hover:text-white hover:bg-burgundy-700/40'
                        }`}>
                      {item.label}
                    </NavLink>
                  ))}
                </div>
              </div>
            ))}
          </nav>

          {/* User card at bottom */}
          <div className="border-t border-burgundy-700 pt-3 mt-2">
            <button
              onClick={() => nav('/profile')}
              className="w-full flex items-center gap-3 rounded-xl px-2 py-2 hover:bg-burgundy-700/40 transition text-left"
            >
              {user?.photo ? (
                <img src={user.photo} alt={user.name} className="w-8 h-8 rounded-full object-cover shrink-0" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-rose-200 text-burgundy-800 grid place-items-center font-display font-semibold shrink-0">
                  {user?.name?.[0] || 'U'}
                </div>
              )}
              <div className="min-w-0">
                <div className="text-rose-200 text-sm font-medium truncate">{user?.name}</div>
                <div className="text-rose-300/60 text-xs truncate">{user?.role}</div>
              </div>
            </button>
          </div>
        </div>
      </aside>

      <div className="flex-1 min-w-0">
        {/* Topbar */}
        <header className="h-16 bg-paper-0 border-b border-line flex items-center justify-between px-6 sticky top-0 z-10">
          <div className="font-display text-lg text-burgundy-800 md:hidden">shiv · erp</div>
          <div className="hidden md:block text-sm text-ink-400">From Demand to Delivery</div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => nav('/profile')}
              className="w-9 h-9 rounded-full overflow-hidden bg-rose-200 text-burgundy-800 grid place-items-center font-display font-semibold"
              title="My Profile"
            >
              {user?.photo
                ? <img src={user.photo} alt={user?.name} className="w-full h-full object-cover" />
                : (user?.name?.[0] || 'U')
              }
            </button>
            <button className="btn-ghost text-xs" onClick={() => { logout(); nav('/login') }}>Logout</button>
          </div>
        </header>

        <main className="p-6 max-w-[1200px] mx-auto">{children}</main>
      </div>
    </div>
  )
}
