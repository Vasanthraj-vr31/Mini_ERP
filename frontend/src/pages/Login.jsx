import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth'

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

  return (
    <div className="min-h-screen grid md:grid-cols-2">
      {/* Velvet brand panel */}
      <div className="bg-burgundy-800 text-white p-12 hidden md:flex flex-col justify-between">
        <div className="font-display text-4xl leading-none">shiv<div className="text-rose-300 text-sm tracking-[0.25em] uppercase mt-2">furniture works</div></div>
        <div>
          <div className="eyebrow text-rose-300 mb-3">Enterprise Resource Planning</div>
          <h1 className="font-display text-5xl leading-tight">From Demand<br />to Delivery.</h1>
          <p className="text-rose-200/80 mt-4 max-w-sm">Sales, procurement, manufacturing and inventory — orchestrated as one connected, intelligent system.</p>
        </div>
        <div className="text-rose-300/50 text-xs">Make To Stock · Make To Order · AI Insights</div>
      </div>

      {/* Form */}
      <div className="flex items-center justify-center p-8 bg-paper-50">
        <form onSubmit={submit} className="w-full max-w-sm">
          <h2 className="font-display text-3xl mb-1">Welcome back</h2>
          <p className="text-ink-400 text-sm mb-8">Sign in to your workspace</p>
          {err && <div className="mb-4 chip bg-danger-bg text-danger w-full justify-center">{err}</div>}
          <label className="label">Login Id</label>
          <input className="input mb-4" value={u} onChange={(e) => setU(e.target.value)} />
          <label className="label">Password</label>
          <input className="input mb-6" type="password" value={p} onChange={(e) => setP(e.target.value)} />
          <button className="btn-primary w-full justify-center" disabled={busy}>
            {busy ? 'Signing in…' : 'Sign In'}
          </button>
          <div className="text-xs text-ink-400 mt-6 space-y-1">
            <div className="font-medium text-ink-600">Demo accounts</div>
            <div>adminuser / Admin@123 · salesuser / Sales@123</div>
            <div>purchaseuser / Buyer@123 · mfguser01 / Mfg@1234</div>
          </div>
        </form>
      </div>
    </div>
  )
}
