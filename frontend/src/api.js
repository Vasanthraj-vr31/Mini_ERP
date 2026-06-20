import axios from 'axios'

const api = axios.create({ baseURL: '/api' })

api.interceptors.request.use((cfg) => {
  const t = localStorage.getItem('token')
  if (t) cfg.headers.Authorization = `Bearer ${t}`
  return cfg
})

export const money = (n) =>
  '₹' + Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })

export const STATUS_TONE = {
  Draft: 'neutral', Confirmed: 'info', 'In-Progress': 'info',
  'Partially Delivered': 'warning', 'Partially Received': 'warning',
  'Fully Delivered': 'success', 'Fully Received': 'success', Done: 'success',
  Cancelled: 'danger', Available: 'success', 'Not Available': 'danger',
}

export default api
