import axios from 'axios'
import { TC_ADMIN_SESSION_KEY } from './adminAuth'

const API_BASE = import.meta.env.VITE_API_URL || ''

const api = axios.create({
  baseURL: `${API_BASE}/api`,
  timeout: 15000,
})

api.interceptors.request.use((config) => {
  const password = localStorage.getItem(TC_ADMIN_SESSION_KEY)
  if (password) config.headers['x-admin-password'] = password
  return config
})

export default api
