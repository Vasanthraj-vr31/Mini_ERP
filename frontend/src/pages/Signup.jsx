import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import api from '../api'
import { useAuth } from '../auth'

function PasswordInput({ value, onChange, placeholder = 'Password' }) {
  const [show, setShow] = useState(false)
  return (
    <div className="relative">
      <input
        className="input pr-10 w-full"
        type={show ? 'text' : 'password'}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
      />
      <button
        type="button"
        tabIndex={-1}
        onClick={() => setShow((s) => !s)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-700"
        aria-label={show ? 'Hide password' : 'Show password'}
      >
        {show ? (
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88L6.59 6.59m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
        )}
      </button>
    </div>
  )
}

export default function Signup() {
  const { setUser } = useAuth()
  const nav = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' })
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const submit = async (e) => {
    e.preventDefault()
    setErr('')
    if (!form.name.trim()) return setErr('Full name is required')
    if (!form.email.trim()) return setErr('Email is required')
    if (form.password.length < 8) return setErr('Password must be at least 8 characters')
    if (form.password !== form.confirm) return setErr('Passwords do not match')

    setBusy(true)
    try {
      const { data } = await api.post('/auth/signup', {
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
      })
      localStorage.setItem('token', data.access_token)
      localStorage.setItem('user', JSON.stringify(data.user))
      setUser(data.user)
      nav('/login')
    } catch (e) {
      setErr(e?.response?.data?.detail || 'Signup failed. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="min-h-screen grid md:grid-cols-2">
      {/* Brand panel */}
      <div className="bg-burgundy-800 text-white p-12 hidden md:flex flex-col justify-between">
        <div className="font-display text-4xl leading-none">
          shiv
          <div className="text-rose-300 text-sm tracking-[0.25em] uppercase mt-2">furniture works</div>
        </div>
        <div>
          <div className="eyebrow text-rose-300 mb-3">Get Started</div>
          <h1 className="font-display text-5xl leading-tight">Join Shiv<br />ERP Today.</h1>
          <p className="text-rose-200/80 mt-4 max-w-sm">
            Your account will be activated by a system administrator. Log in after approval to access your workspace.
          </p>
        </div>
        <div className="text-rose-300/50 text-xs">Secure · Role-Based · Enterprise-Ready</div>
      </div>

      {/* Form */}
      <div className="flex items-center justify-center p-8 bg-paper-50">
        <form onSubmit={submit} className="w-full max-w-sm">
          <h2 className="font-display text-3xl mb-1">Create account</h2>
          <p className="text-ink-400 text-sm mb-8">Enter your details to get started</p>

          {err && <div className="mb-4 p-3 rounded-xl bg-danger-bg text-danger text-sm">{err}</div>}

          <label className="label">Full Name</label>
          <input className="input mb-4 w-full" value={form.name} onChange={set('name')} placeholder="Your full name" />

          <label className="label">Email Address</label>
          <input className="input mb-4 w-full" type="email" value={form.email} onChange={set('email')} placeholder="you@example.com" />

          <label className="label">Password</label>
          <div className="mb-4">
            <PasswordInput value={form.password} onChange={set('password')} placeholder="Minimum 8 characters" />
          </div>

          <label className="label">Confirm Password</label>
          <div className="mb-6">
            <PasswordInput value={form.confirm} onChange={set('confirm')} placeholder="Re-enter your password" />
          </div>

          <button className="btn-primary w-full justify-center" disabled={busy}>
            {busy ? 'Creating account…' : 'Create Account'}
          </button>

          <p className="text-center text-sm text-ink-400 mt-5">
            Already have an account?{' '}
            <Link to="/login" className="text-burgundy-800 font-medium hover:underline">
              Sign in
            </Link>
          </p>
        </form>
      </div>
    </div>
  )
}
