import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth'

const NAV = [
  ['Dashboard', '/'],
  ['Sale Orders', '/sales'],
  ['Purchase Orders', '/purchase'],
  ['Manufacturing Orders', '/manufacturing'],
  ['Bills of Materials', '/boms'],
  ['Products', '/products'],
  ['AI Insights', '/ai'],
  ['Reports', '/reports'],
  ['Audit Logs', '/audit'],
]

export default function Layout({ children }) {
  const { user, logout } = useAuth()
  const nav = useNavigate()

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
          <nav className="flex-1 space-y-1 mt-2">
            {NAV.map(([label, path]) => (
              <NavLink key={path} to={path} end={path === '/'}
                className={({ isActive }) =>
                  `block rounded-xl px-3 py-2 text-sm transition ${
                    isActive ? 'bg-burgundy-900 text-rose-200 font-medium'
                             : 'text-rose-300/70 hover:text-white hover:bg-burgundy-700/40'}`}>
                {label}
              </NavLink>
            ))}
          </nav>
          <div className="border-t border-burgundy-700 pt-3 mt-2">
            <div className="text-rose-200 text-sm font-medium">{user?.name}</div>
            <div className="text-rose-300/60 text-xs">{user?.position || user?.role}</div>
          </div>
        </div>
      </aside>

      <div className="flex-1 min-w-0">
        {/* Topbar */}
        <header className="h-16 bg-paper-0 border-b border-line flex items-center justify-between px-6 sticky top-0 z-10">
          <div className="font-display text-lg text-burgundy-800 md:hidden">shiv · erp</div>
          <div className="hidden md:block text-sm text-ink-400">From Demand to Delivery</div>
          <div className="flex items-center gap-3">
            <button onClick={() => nav('/profile')}
              className="w-9 h-9 rounded-full bg-rose-200 text-burgundy-800 grid place-items-center font-display font-semibold">
              {user?.name?.[0] || 'U'}
            </button>
            <button className="btn-ghost text-xs" onClick={() => { logout(); nav('/login') }}>Logout</button>
          </div>
        </header>

        <main className="p-6 max-w-[1200px] mx-auto">{children}</main>
      </div>
    </div>
  )
}
