import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_URL || ''

const api = axios.create({
  baseURL: `${API_BASE}/api`,
  timeout: 15000,
})

api.interceptors.request.use((config) => {
  const password = localStorage.getItem('adminPassword')
  if (password) config.headers['x-admin-password'] = password
  return config
})

export default api
