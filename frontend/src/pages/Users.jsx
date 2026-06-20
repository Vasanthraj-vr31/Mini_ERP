import { useEffect, useState } from 'react'
import api from '../api'
import { useAuth } from '../auth'
import { PageHeader, Field, Spinner } from '../components/ui'

const ROLES = [
  'System Administrator','Sales Administrator','Purchase Administrator',
  'Manufacturing Administrator','Inventory Manager','Business Owner','Normal User',
]

const ROLE_COLORS = {
  'System Administrator': 'bg-burgundy-800 text-white',
  'Sales Administrator':  'bg-info-bg text-info',
  'Purchase Administrator': 'bg-warning-bg text-warning',
  'Manufacturing Administrator': 'bg-success-bg text-success',
  'Inventory Manager': 'bg-neutral-bg text-neutral',
  'Business Owner': 'bg-rose-100 text-burgundy-800',
  'Normal User': 'bg-paper-50 text-ink-600',
}

function Avatar({ user, size = 10 }) {
  if (user.photo) {
    return <img src={user.photo} alt={user.name} className={`w-${size} h-${size} rounded-full object-cover`} />
  }
  return (
    <div className={`w-${size} h-${size} rounded-full bg-rose-200 text-burgundy-800 grid place-items-center font-display font-semibold text-lg shrink-0`}>
      {user.name?.[0] || 'U'}
    </div>
  )
}

const EMPTY_FORM = { name:'', login_id:'', email:'', password:'', role:'Normal User', position:'', department:'', mobile:'', address:'' }

export default function Users() {
  const { user: me, isAdmin } = useAuth()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null)  // null | 'create' | user_obj
  const [form, setForm] = useState(EMPTY_FORM)
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')

  if (!isAdmin()) return (
    <div className="flex flex-col items-center justify-center py-20 text-ink-400">
      <div className="font-display text-4xl mb-2">403</div>
      <div>Administrator access required</div>
    </div>
  )

  const load = () => {
    setLoading(true)
    api.get('/admin/users').then(r => { setUsers(r.data); setLoading(false) }).catch(() => setLoading(false))
  }

  useEffect(load, [])

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  const openCreate = () => { setForm(EMPTY_FORM); setErr(''); setModal('create') }
  const openEdit = u => { setForm({ ...u, password: '' }); setErr(''); setModal(u) }

  const save = async () => {
    setErr(''); setBusy(true)
    try {
      if (modal === 'create') {
        if (!form.name || !form.email || !form.password) { setErr('Name, email and password are required'); setBusy(false); return }
        await api.post('/admin/users', form)
      } else {
        const patch = { ...form }
        if (!patch.password) delete patch.password
        await api.patch(`/admin/users/${modal.id}`, patch)
      }
      setModal(null); load()
    } catch (e) {
      setErr(e?.response?.data?.detail || 'Save failed')
    } finally { setBusy(false) }
  }

  const toggleStatus = async (u) => {
    await api.patch(`/admin/users/${u.id}/status`)
    load()
  }

  const deleteUser = async (u) => {
    if (!confirm(`Delete ${u.name}? This cannot be undone.`)) return
    await api.delete(`/admin/users/${u.id}`)
    load()
  }

  const filtered = users.filter(u => {
    const q = search.toLowerCase()
    const matchQ = !q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.login_id.toLowerCase().includes(q)
    const matchR = !roleFilter || u.role === roleFilter
    return matchQ && matchR
  })

  return (
    <div>
      <PageHeader
        title="User Management"
        subtitle="System Administration"
        actions={<button className="btn-primary" onClick={openCreate}>+ Add User</button>}
      />

      {/* Filters */}
      <div className="flex gap-3 mb-6 flex-wrap">
        <input className="input max-w-xs" placeholder="Search name, email, login…" value={search} onChange={e => setSearch(e.target.value)} />
        <select className="input max-w-xs" value={roleFilter} onChange={e => setRoleFilter(e.target.value)}>
          <option value="">All Roles</option>
          {ROLES.map(r => <option key={r}>{r}</option>)}
        </select>
        <div className="text-ink-400 text-sm self-center">{filtered.length} users</div>
      </div>

      {loading ? <Spinner /> : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-line">
              <tr className="text-left">
                <th className="px-4 py-3 text-ink-400 font-medium">User</th>
                <th className="px-4 py-3 text-ink-400 font-medium hidden sm:table-cell">Role</th>
                <th className="px-4 py-3 text-ink-400 font-medium hidden lg:table-cell">Department</th>
                <th className="px-4 py-3 text-ink-400 font-medium hidden md:table-cell">Last Login</th>
                <th className="px-4 py-3 text-ink-400 font-medium">Status</th>
                <th className="px-4 py-3 text-ink-400 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {filtered.map(u => (
                <tr key={u.id} className="hover:bg-paper-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar user={u} size={9} />
                      <div>
                        <div className="font-medium text-ink-900">{u.name}</div>
                        <div className="text-xs text-ink-400">{u.login_id} · {u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <span className={`chip text-xs ${ROLE_COLORS[u.role] || 'bg-paper-50 text-ink-600'}`}>{u.role}</span>
                  </td>
                  <td className="px-4 py-3 text-ink-600 hidden lg:table-cell">{u.department || '—'}</td>
                  <td className="px-4 py-3 text-ink-400 text-xs hidden md:table-cell">
                    {u.last_login ? new Date(u.last_login).toLocaleString() : 'Never'}
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => toggleStatus(u)} className={`chip cursor-pointer ${u.status === 'Active' ? 'bg-success-bg text-success' : 'bg-danger-bg text-danger'}`}>
                      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />{u.status}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button className="text-xs text-burgundy-800 hover:underline mr-3" onClick={() => openEdit(u)}>Edit</button>
                    {u.id !== me?.id && (
                      <button className="text-xs text-danger hover:underline" onClick={() => deleteUser(u)}>Delete</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="text-center text-ink-400 py-12">No users found</div>
          )}
        </div>
      )}

      {/* Modal */}
      {modal !== null && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-line">
              <h2 className="font-display text-2xl">{modal === 'create' ? 'Add User' : `Edit ${modal.name}`}</h2>
            </div>
            <div className="p-6 space-y-4">
              {err && <div className="p-3 bg-danger-bg text-danger rounded-xl text-sm">{err}</div>}
              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="Full Name *">
                  <input className="input" value={form.name} onChange={set('name')} />
                </Field>
                <Field label={`Login Id ${modal === 'create' ? '(auto if blank)' : '(read-only)'}`}>
                  <input className="input" value={form.login_id} onChange={set('login_id')} disabled={modal !== 'create'} />
                </Field>
                <Field label="Email *">
                  <input className="input" type="email" value={form.email} onChange={set('email')} />
                </Field>
                <Field label={modal === 'create' ? 'Password *' : 'New Password (leave blank to keep)'}>
                  <input className="input" type="password" value={form.password} onChange={set('password')} />
                </Field>
                <Field label="Role">
                  <select className="input" value={form.role} onChange={set('role')}>
                    {ROLES.map(r => <option key={r}>{r}</option>)}
                  </select>
                </Field>
                <Field label="Position">
                  <input className="input" value={form.position} onChange={set('position')} />
                </Field>
                <Field label="Department">
                  <input className="input" value={form.department} onChange={set('department')} />
                </Field>
                <Field label="Mobile">
                  <input className="input" value={form.mobile} onChange={set('mobile')} />
                </Field>
                <Field label="Address" className="sm:col-span-2">
                  <input className="input" value={form.address} onChange={set('address')} />
                </Field>
              </div>
            </div>
            <div className="p-6 border-t border-line flex justify-end gap-3">
              <button className="btn-ghost" onClick={() => setModal(null)}>Cancel</button>
              <button className="btn-primary" onClick={save} disabled={busy}>
                {busy ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
