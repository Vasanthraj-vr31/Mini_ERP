import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../auth'

function PasswordInput({ value, onChange, placeholder = 'Password' }) {
  const [show, setShow] = useState(false)
  return (
    <div className="relative">
      <input className="input pr-10 w-full" type={show ? 'text' : 'password'}
        value={value} onChange={onChange} placeholder={placeholder} />
      <button type="button" tabIndex={-1} onClick={() => setShow(s => !s)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-700">
        {show ? (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88L6.59 6.59m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
          </svg>
        ) : (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
        )}
      </button>
    </div>
  )
}

/* Decorative banana-leaf SVG — luxury tropical accent */
function BananaLeaves() {
  return (
    <svg viewBox="0 0 400 600" className="absolute inset-0 w-full h-full opacity-[0.07] pointer-events-none"
      xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      {/* Large leaf — top right */}
      <g transform="translate(280,−40) rotate(−30)">
        <path d="M0,0 C40,60 55,160 45,260 C35,340 15,400 0,440 C−15,400 −35,340 −45,260 C−55,160 −40,60 0,0Z" fill="white"/>
        <line x1="0" y1="0" x2="0" y2="440" stroke="white" strokeWidth="2"/>
        {[40,80,120,160,200,240,280,320,360,400].map((y,i)=>{
          const w = 12 + i*4
          return (
            <g key={y}>
              <line x1="0" y1={y} x2={w} y2={y+10} stroke="white" strokeWidth="1" opacity="0.6"/>
              <line x1="0" y1={y} x2={-w} y2={y+10} stroke="white" strokeWidth="1" opacity="0.6"/>
            </g>
          )
        })}
      </g>
      {/* Medium leaf — bottom left */}
      <g transform="translate(60,420) rotate(25) scale(0.7)">
        <path d="M0,0 C35,55 48,140 40,230 C30,300 12,355 0,390 C−12,355 −30,300 −40,230 C−48,140 −35,55 0,0Z" fill="white"/>
        <line x1="0" y1="0" x2="0" y2="390" stroke="white" strokeWidth="2"/>
        {[35,75,115,155,195,235,275,315,350].map((y,i)=>{
          const w = 10 + i*3.5
          return (
            <g key={y}>
              <line x1="0" y1={y} x2={w} y2={y+9} stroke="white" strokeWidth="1" opacity="0.5"/>
              <line x1="0" y1={y} x2={-w} y2={y+9} stroke="white" strokeWidth="1" opacity="0.5"/>
            </g>
          )
        })}
      </g>
      {/* Small accent leaf — mid right */}
      <g transform="translate(360,260) rotate(−55) scale(0.45)">
        <path d="M0,0 C30,50 42,130 35,210 C26,275 10,325 0,355 C−10,325 −26,275 −35,210 C−42,130 −30,50 0,0Z" fill="white"/>
        <line x1="0" y1="0" x2="0" y2="355" stroke="white" strokeWidth="2"/>
        {[40,80,120,160,200,240,280,320].map((y,i)=>{
          const w = 9+i*3
          return (
            <g key={y}>
              <line x1="0" y1={y} x2={w} y2={y+8} stroke="white" strokeWidth="1" opacity="0.5"/>
              <line x1="0" y1={y} x2={-w} y2={y+8} stroke="white" strokeWidth="1" opacity="0.5"/>
            </g>
          )
        })}
      </g>
    </svg>
  )
}

const DEMO_ACCOUNTS = [
  { role: 'System Administrator', login: 'adminuser',    pwd: 'Admin@123',  badge: 'bg-burgundy-900' },
  { role: 'Sales Administrator',  login: 'salesuser',    pwd: 'Sales@123',  badge: 'bg-rose-900/60' },
  { role: 'Purchase Administrator', login: 'purchaseuser', pwd: 'Buyer@123', badge: 'bg-rose-900/60' },
  { role: 'Manufacturing Admin',  login: 'mfguser01',    pwd: 'Mfg@1234',   badge: 'bg-rose-900/60' },
  { role: 'Business Owner',       login: 'owner01',      pwd: 'Owner@123',  badge: 'bg-rose-900/60' },
  { role: 'Normal User',          login: 'normaluser',   pwd: 'User@1234',  badge: 'bg-rose-900/30' },
]

export default function Login() {
  const { login } = useAuth()
  const nav = useNavigate()
  const [u, setU] = useState('adminuser')
  const [p, setP] = useState('Admin@123')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setErr(''); setBusy(true)
    try { await login(u, p); nav('/') }
    catch (e) { setErr(e?.response?.data?.detail || 'Invalid Login Id or Password') }
    finally { setBusy(false) }
  }

  const fill = (acct) => { setU(acct.login); setP(acct.pwd); setErr('') }

  return (
    <div className="min-h-screen grid md:grid-cols-2">
      {/* ── Luxury brand panel ── */}
      <div className="bg-burgundy-800 relative overflow-hidden hidden md:flex flex-col justify-between p-12">
        <BananaLeaves />

        {/* Brand */}
        <div className="relative z-10">
          <div className="font-display text-5xl text-white leading-none tracking-tight">shiv</div>
          <div className="text-rose-300 text-xs tracking-[0.35em] uppercase mt-2 font-medium">furniture works</div>
        </div>

        {/* Hero copy */}
        <div className="relative z-10">
          <div className="inline-block px-3 py-1 rounded-full bg-white/10 text-rose-300 text-[10px] tracking-[0.2em] uppercase font-semibold mb-5">
            Enterprise Resource Planning
          </div>
          <h1 className="font-display text-6xl text-white leading-[1.05]">
            From<br />Demand<br />to Delivery.
          </h1>
          <p className="text-rose-200/70 mt-5 max-w-xs text-[15px] leading-relaxed">
            Sales, procurement, manufacturing and inventory — orchestrated as one connected, intelligent system.
          </p>

          {/* Feature pills */}
          <div className="flex flex-wrap gap-2 mt-8">
            {['Make To Stock', 'Make To Order', 'AI Insights', 'RBAC', 'Audit Trail'].map(t => (
              <span key={t} className="px-3 py-1 rounded-full bg-white/10 text-rose-300/80 text-xs font-medium">
                {t}
              </span>
            ))}
          </div>
        </div>

        <div className="relative z-10 text-rose-400/40 text-[11px]">
          Shiv Furniture Works · Powered by AI · 2026
        </div>
      </div>

      {/* ── Sign-in panel ── */}
      <div className="flex items-center justify-center p-8 bg-paper-50 overflow-y-auto">
        <div className="w-full max-w-sm">
          {/* Mobile brand */}
          <div className="md:hidden mb-8">
            <div className="font-display text-3xl text-burgundy-800">shiv</div>
            <div className="text-ink-400 text-xs tracking-widest uppercase">furniture works</div>
          </div>

          <h2 className="font-display text-3xl text-ink-900 mb-1">Welcome back</h2>
          <p className="text-ink-400 text-sm mb-8">Sign in to your workspace</p>

          {err && (
            <div className="mb-4 px-4 py-2.5 rounded-xl bg-danger-bg text-danger text-sm text-center">
              {err}
            </div>
          )}

          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="label">Login ID or Email</label>
              <input className="input w-full" value={u} onChange={e => setU(e.target.value)} autoFocus />
            </div>
            <div>
              <label className="label">Password</label>
              <PasswordInput value={p} onChange={e => setP(e.target.value)} />
            </div>
            <button className="btn-primary w-full justify-center mt-2" disabled={busy}>
              {busy ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          <p className="text-center text-sm text-ink-400 mt-5">
            New to Shiv ERP?{' '}
            <Link to="/signup" className="text-burgundy-800 font-medium hover:underline">Create an account</Link>
          </p>

          {/* ── Demo account cards ── */}
          <div className="mt-6 border-t border-line pt-5">
            <div className="text-xs font-semibold text-ink-500 mb-3 uppercase tracking-widest">Demo accounts — click to sign in</div>
            <div className="space-y-1.5">
              {DEMO_ACCOUNTS.map(acct => (
                <button key={acct.login} type="button" onClick={() => fill(acct)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border transition text-left group
                    ${u === acct.login
                      ? 'border-burgundy-800 bg-burgundy-800/5'
                      : 'border-line bg-paper-0 hover:border-burgundy-800/40 hover:bg-burgundy-800/[0.03]'
                    }`}>
                  <span className={`shrink-0 w-2 h-2 rounded-full ${u === acct.login ? 'bg-burgundy-800' : 'bg-rose-300'}`} />
                  <span className="flex-1 min-w-0">
                    <span className="block text-xs font-semibold text-ink-700 truncate">{acct.role}</span>
                    <span className="block text-[11px] text-ink-400 font-mono">{acct.login} · {acct.pwd}</span>
                  </span>
                  {u === acct.login && (
                    <span className="shrink-0 text-[10px] text-burgundy-800 font-semibold">selected</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
