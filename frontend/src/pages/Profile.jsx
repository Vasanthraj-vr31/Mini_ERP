import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api'
import { useAuth } from '../auth'
import { PageHeader, Field } from '../components/ui'

const ROLE_BADGE = {
  'System Administrator': 'bg-burgundy-800 text-white',
  'Admin':                'bg-burgundy-800 text-white',
  'Sales Administrator':  'bg-info-bg text-info',
  'Purchase Administrator': 'bg-warning-bg text-warning',
  'Manufacturing Administrator': 'bg-success-bg text-success',
  'Inventory Manager':    'bg-neutral-bg text-neutral',
  'Business Owner':       'bg-rose-100 text-burgundy-800',
  'Normal User':          'bg-paper-50 text-ink-600',
}

function Avatar({ user, size = 24, onUpload }) {
  const inputRef = useRef()

  const handleFile = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => onUpload(reader.result)
    reader.readAsDataURL(file)
  }

  return (
    <div className="relative group">
      {user.photo ? (
        <img src={user.photo} alt={user.name}
          className={`w-${size} h-${size} rounded-2xl object-cover border-4 border-rose-200`} />
      ) : (
        <div className={`w-${size} h-${size} rounded-2xl bg-rose-200 text-burgundy-800 grid place-items-center font-display text-5xl border-4 border-white shadow-lg`}>
          {user.name?.[0] || 'U'}
        </div>
      )}
      {onUpload && (
        <>
          <button
            onClick={() => inputRef.current.click()}
            className="absolute inset-0 rounded-2xl bg-black/40 text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
          >
            Change photo
          </button>
          <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
        </>
      )}
    </div>
  )
}

export default function Profile() {
  const { user, setUser, isAdmin, logout } = useAuth()
  const nav = useNavigate()
  const admin = isAdmin()
  const [form, setForm] = useState({
    name: user?.name || '',
    address: user?.address || '',
    mobile: user?.mobile || '',
    position: user?.position || '',
    photo: user?.photo || '',
  })
  const [saved, setSaved] = useState(false)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  const save = async () => {
    setErr(''); setBusy(true)
    try {
      const body = { name: form.name, address: form.address, mobile: form.mobile, photo: form.photo }
      if (admin) body.position = form.position
      const { data } = await api.put('/auth/me', body)
      setUser(data)
      setSaved(true); setTimeout(() => setSaved(false), 2000)
    } catch (e) {
      setErr(e?.response?.data?.detail || 'Save failed')
    } finally { setBusy(false) }
  }

  return (
    <div className="max-w-3xl">
      <PageHeader title="My Profile" subtitle="User login detail management" />

      {/* Hero card */}
      <div className="card mb-6 overflow-hidden">
        <div className="h-24 bg-burgundy-800" />
        <div className="px-6 pb-6">
          <div className="flex flex-col sm:flex-row gap-5 -mt-12 mb-4">
            <Avatar
              user={{ ...user, photo: form.photo }}
              size={24}
              onUpload={photo => setForm(f => ({ ...f, photo }))}
            />
            <div className="mt-2 sm:mt-14">
              <div className="font-display text-2xl text-ink-900 leading-none">{form.name || user?.name}</div>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <span className={`chip text-xs ${ROLE_BADGE[user?.role] || 'bg-paper-50 text-ink-600'}`}>
                  {user?.role}
                </span>
                {user?.department && (
                  <span className="chip text-xs bg-paper-50 text-ink-600">{user.department}</span>
                )}
              </div>
            </div>
          </div>

          {/* Meta row */}
          <div className="grid sm:grid-cols-3 gap-4 text-sm border-t border-line pt-4">
            <div>
              <div className="eyebrow text-xs mb-1">Login ID</div>
              <div className="text-ink-700 font-mono">{user?.login_id}</div>
            </div>
            <div>
              <div className="eyebrow text-xs mb-1">Email</div>
              <div className="text-ink-700">{user?.email}</div>
            </div>
            <div>
              <div className="eyebrow text-xs mb-1">Last Login</div>
              <div className="text-ink-700">
                {user?.last_login ? new Date(user.last_login).toLocaleString() : 'This session'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit form */}
      <div className="card p-6">
        <div className="eyebrow mb-4">Edit Details</div>
        {err && <div className="mb-4 p-3 bg-danger-bg text-danger rounded-xl text-sm">{err}</div>}
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Full Name">
            <input className="input" value={form.name} onChange={set('name')} />
          </Field>
          <Field label="Mobile Number">
            <input className="input" value={form.mobile} onChange={set('mobile')} />
          </Field>
          <Field label="Address">
            <input className="input" value={form.address} onChange={set('address')} />
          </Field>
          <Field label="Email (read-only)">
            <input className="input bg-paper-50 text-ink-400" disabled value={user?.email || ''} />
          </Field>
          <Field label={`Position${admin ? '' : ' (read-only)'}`}>
            <input
              className={`input ${admin ? '' : 'bg-paper-50 text-ink-400'}`}
              disabled={!admin}
              value={form.position}
              onChange={set('position')}
            />
          </Field>
          <Field label="Department (read-only)">
            <input className="input bg-paper-50 text-ink-400" disabled value={user?.department || ''} />
          </Field>
        </div>

        {/* Permissions summary */}
        <div className="mt-6 p-4 rounded-xl bg-paper-50 border border-line">
          <div className="eyebrow text-xs mb-2">Permission Summary</div>
          <div className="text-sm text-ink-600">
            {user?.role === 'System Administrator' || user?.role === 'Admin'
              ? 'Full access to all modules — create, edit, approve, delete.'
              : `Role: ${user?.role}. Contact your system administrator to adjust permissions.`}
          </div>
        </div>

        <div className="flex items-center gap-3 mt-6">
          <button className="btn-primary" onClick={save} disabled={busy}>
            {busy ? 'Saving…' : 'Save Changes'}
          </button>
          <button className="btn-secondary text-rose-600 hover:bg-rose-50 border-rose-200" onClick={() => { logout(); nav('/login') }}>
            Logout
          </button>
          {saved && <span className="text-success text-sm font-medium">✓ Saved successfully</span>}
        </div>
        {!admin && (
          <p className="text-xs text-ink-400 mt-3">
            Email and department are managed by the system administrator. Hover your photo to upload a new one.
          </p>
        )}
      </div>
    </div>
  )
}
