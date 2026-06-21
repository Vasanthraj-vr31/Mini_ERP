import { createContext, useContext, useState } from 'react'
import api from './api'
import { can, isAdmin, isCustomer } from './permissions'

const AuthCtx = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const u = localStorage.getItem('user')
    return u ? JSON.parse(u) : null
  })

  const login = async (username, password) => {
    const body = new URLSearchParams({ username, password })
    const { data } = await api.post('/auth/login', body)
    localStorage.setItem('token', data.access_token)
    localStorage.setItem('user', JSON.stringify(data.user))
    setUser(data.user)
    return data.user
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
  }

  const updateUser = (data) => {
    localStorage.setItem('user', JSON.stringify(data))
    setUser(data)
  }

  // can(module, action) — checks current user's role permissions
  const userCan = (module, action) => can(user?.role, module, action)
  const userIsAdmin = () => isAdmin(user?.role)
  const userIsCustomer = () => isCustomer(user?.role)

  return (
    <AuthCtx.Provider value={{ user, login, logout, setUser: updateUser, can: userCan, isAdmin: userIsAdmin, isCustomer: userIsCustomer }}>
      {children}
    </AuthCtx.Provider>
  )
}

export const useAuth = () => useContext(AuthCtx)
