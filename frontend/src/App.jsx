import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './auth'
import Layout from './components/Layout'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Dashboard from './pages/Dashboard'
import Products from './pages/Products'
import Sales from './pages/Sales'
import Purchase from './pages/Purchase'
import Manufacturing from './pages/Manufacturing'
import Boms from './pages/Boms'
import Audit from './pages/Audit'
import AI from './pages/AI'
import Reports from './pages/Reports'
import Profile from './pages/Profile'
import Users from './pages/Users'
import Analytics from './pages/Analytics'
import Customers from './pages/Customers'
import Warehouse from './pages/Warehouse'
import Quality from './pages/Quality'
import Invoices from './pages/Invoices'
import CommandPalette from './components/CommandPalette'

function Guard({ children }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  return <Layout>{children}</Layout>
}

export default function App() {
  const { user } = useAuth()
  return (
    <>
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/signup" element={user ? <Navigate to="/" replace /> : <Signup />} />
      <Route path="/" element={<Guard><Dashboard /></Guard>} />
      <Route path="/sales" element={<Guard><Sales /></Guard>} />
      <Route path="/purchase" element={<Guard><Purchase /></Guard>} />
      <Route path="/manufacturing" element={<Guard><Manufacturing /></Guard>} />
      <Route path="/boms" element={<Guard><Boms /></Guard>} />
      <Route path="/products" element={<Guard><Products /></Guard>} />
      <Route path="/ai" element={<Guard><AI /></Guard>} />
      <Route path="/reports" element={<Guard><Reports /></Guard>} />
      <Route path="/audit" element={<Guard><Audit /></Guard>} />
      <Route path="/profile" element={<Guard><Profile /></Guard>} />
      <Route path="/users" element={<Guard><Users /></Guard>} />
      <Route path="/analytics" element={<Guard><Analytics /></Guard>} />
      <Route path="/customers" element={<Guard><Customers /></Guard>} />
      <Route path="/warehouse" element={<Guard><Warehouse /></Guard>} />
      <Route path="/quality" element={<Guard><Quality /></Guard>} />
      <Route path="/invoices" element={<Guard><Invoices /></Guard>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    <CommandPalette />
    </>
  )
}
