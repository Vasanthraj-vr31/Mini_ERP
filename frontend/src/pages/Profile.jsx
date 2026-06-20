import { useState } from 'react'
import api from '../api'
import { useAuth } from '../auth'
import { PageHeader, Field } from '../components/ui'

export default function Profile() {
  const { user, setUser } = useAuth()
  const isAdmin = user?.role === 'Admin'
  const [form, setForm] = useState({
    name: user?.name || '', address: user?.address || '', mobile: user?.mobile || '',
    position: user?.position || '',
  })
  const [saved, setSaved] = useState(false)

  const save = async () => {
    const body = { name: form.name, address: form.address, mobile: form.mobile }
    if (isAdmin) body.position = form.position
    const { data } = await api.put('/auth/me', body)
    localStorage.setItem('user', JSON.stringify(data)); setUser(data)
    setSaved(true); setTimeout(() => setSaved(false), 1500)
  }

  return (
    <div className="max-w-2xl">
      <PageHeader title="My Profile" subtitle="User login detail management" />
      <div className="card p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-20 h-20 rounded-2xl bg-rose-200 text-burgundy-800 grid place-items-center font-display text-3xl">
            {form.name?.[0] || 'U'}
          </div>
          <div>
            <div className="font-display text-2xl">{form.name}</div>
            <div className="text-ink-600 text-sm">{user?.role}</div>
          </div>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Name"><input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
          <Field label="Mobile Number"><input className="input" value={form.mobile} onChange={(e) => setForm({ ...form, mobile: e.target.value })} /></Field>
          <Field label="Address"><input className="input" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></Field>
          <Field label="Email (read-only)"><input className="input bg-paper-50 text-ink-400" disabled value={user?.email} /></Field>
          <Field label={`Position ${isAdmin ? '' : '(read-only)'}`}>
            <input className={`input ${isAdmin ? '' : 'bg-paper-50 text-ink-400'}`} disabled={!isAdmin}
              value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })} />
          </Field>
        </div>
        <div className="flex items-center gap-3 mt-6">
          <button className="btn-primary" onClick={save}>Save Changes</button>
          {saved && <span className="text-success text-sm">✓ Saved</span>}
        </div>
        {!isAdmin && <p className="text-xs text-ink-400 mt-3">Email cannot be changed. Position is set by the system administrator.</p>}
      </div>
    </div>
  )
}
